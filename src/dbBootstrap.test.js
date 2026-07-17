import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ensureDatabaseReady,
  getLocalDataDir,
  isLocalFileDatabaseUrl,
  stopLocalDatabase,
} from "./dbBootstrap.js";

describe("getLocalDataDir", () => {
  it("returns null for postgres URLs", () => {
    expect(getLocalDataDir("postgresql://user:pass@localhost:5432/db")).toBeNull();
    expect(getLocalDataDir("postgres://localhost/db")).toBeNull();
    expect(isLocalFileDatabaseUrl("postgresql://localhost/db")).toBe(false);
  });

  it("resolves relative file and pglite URLs from cwd", () => {
    expect(getLocalDataDir("file:./.data/local")).toBe(
      path.resolve(process.cwd(), ".data/local"),
    );
    expect(getLocalDataDir("pglite:.data/local")).toBe(
      path.resolve(process.cwd(), ".data/local"),
    );
    expect(isLocalFileDatabaseUrl("file:./.data/local")).toBe(true);
  });

  it("resolves absolute POSIX-style paths", () => {
    const dir = getLocalDataDir("file:/tmp/associate-db");
    expect(path.isAbsolute(dir)).toBe(true);
    expect(dir.replace(/\\/g, "/")).toMatch(/\/tmp\/associate-db$/);
  });

  it("resolves Windows drive paths when provided", () => {
    const dir = getLocalDataDir("file:C:/local-data/associate-incidents");
    expect(path.isAbsolute(dir)).toBe(true);
    expect(dir.replace(/\\/g, "/").toLowerCase()).toContain(
      "local-data/associate-incidents",
    );
  });

  it("supports paths with spaces (literal and percent-encoded)", () => {
    expect(getLocalDataDir("file:./.data/my local db")).toBe(
      path.resolve(process.cwd(), ".data/my local db"),
    );
    expect(getLocalDataDir("file:./.data/my%20local%20db")).toBe(
      path.resolve(process.cwd(), ".data/my local db"),
    );
    expect(getLocalDataDir('file:"./spaced dir/db"')).toBe(
      path.resolve(process.cwd(), "spaced dir/db"),
    );

    const winSpaced = getLocalDataDir(
      "file:///C:/Users/Some User/App Data/db",
    );
    expect(path.isAbsolute(winSpaced)).toBe(true);
    expect(winSpaced.replace(/\\/g, "/")).toMatch(
      /Users\/Some User\/App Data\/db$/,
    );
  });
});

describe("ensureDatabaseReady with spaced data dirs", () => {
  afterEach(async () => {
    await stopLocalDatabase();
    delete process.env.DATABASE_URL;
  });

  it(
    "opens a PGlite data directory whose path contains spaces",
    async () => {
      const spacedDir = path.join(
        os.tmpdir(),
        `associate incidents ${Date.now()}`,
        "local db",
      );
      process.env.DATABASE_URL = `file:${spacedDir}`;

      const ready = await ensureDatabaseReady({ manageSignals: false });
      expect(ready.mode).toBe("pglite");
      expect(ready.dataDir).toBe(path.resolve(spacedDir));
      expect(fs.existsSync(spacedDir)).toBe(true);
      expect(ready.connectionUrl).toMatch(
        /^postgresql:\/\/postgres:postgres@127\.0\.0\.1:\d+\//,
      );

      await stopLocalDatabase();
      fs.rmSync(path.dirname(spacedDir), { recursive: true, force: true });
    },
    30_000,
  );
});
