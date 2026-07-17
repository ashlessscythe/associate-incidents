import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

/** @type {{ db: import("@electric-sql/pglite").PGlite, server: import("@electric-sql/pglite-socket").PGLiteSocketServer } | null} */
let runtime = null;
let readyPromise = null;
let shuttingDown = false;

/**
 * @param {string} value
 * @returns {string}
 */
function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

/**
 * Decode percent-encoded path segments (e.g. %20) without throwing on bare "%".
 * @param {string} value
 * @returns {string}
 */
function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * @param {string | undefined} url
 * @returns {string | null} Absolute data directory, or null if not a local file URL
 */
export function getLocalDataDir(url = process.env.DATABASE_URL) {
  if (!url) return null;
  const trimmed = stripWrappingQuotes(url.trim());

  if (/^(postgresql|postgres):\/\//i.test(trimmed)) {
    return null;
  }

  let rest;
  if (/^file:/i.test(trimmed)) {
    rest = trimmed.slice("file:".length);
  } else if (/^pglite:/i.test(trimmed)) {
    rest = trimmed.slice("pglite:".length);
  } else {
    return null;
  }

  // Allow file:"./my dir" / file:'./my dir' forms from .env quirks
  rest = stripWrappingQuotes(rest);

  // Absolute file URLs: file:///C:/path, file:///home/path, file://localhost/C:/path
  if (
    rest.startsWith("///") ||
    /^\/\/localhost\//i.test(rest) ||
    /^\/\/[A-Za-z]:/.test(rest)
  ) {
    try {
      let asFileUrl = /^file:/i.test(trimmed)
        ? trimmed
        : `file:${rest.startsWith("//") ? rest : `///${rest}`}`;
      // fileURLToPath requires valid URLs; encode literal spaces if present.
      if (asFileUrl.includes(" ")) {
        asFileUrl = asFileUrl.replaceAll(" ", "%20");
      }
      return fileURLToPath(asFileUrl);
    } catch {
      // fall through to relative/absolute path resolution
    }
  }

  // Strip optional empty authority (file://./.data/local → ./.data/local)
  rest = decodePath(rest.replace(/^\/\//, ""));

  // Absolute POSIX (/data/db) or Windows (C:/data or C:\data)
  if (path.isAbsolute(rest) || /^[A-Za-z]:[\\/]/.test(rest)) {
    return path.resolve(rest);
  }

  // Relative paths: file:./.data/local, pglite:.data/my local db
  return path.resolve(process.cwd(), rest);
}

export function isLocalFileDatabaseUrl(url = process.env.DATABASE_URL) {
  return getLocalDataDir(url) !== null;
}

async function shutdown() {
  if (shuttingDown || !runtime) return;
  shuttingDown = true;
  const { db, server } = runtime;
  runtime = null;
  try {
    await server.stop();
  } catch (err) {
    console.error("Error stopping PGlite socket server:", err);
  }
  try {
    await db.close();
  } catch (err) {
    console.error("Error closing PGlite database:", err);
  }
}

/**
 * If DATABASE_URL is a file:/pglite: path, start file-backed PGlite + TCP socket
 * and rewrite DATABASE_URL to a local postgresql:// connection string.
 * No-op for normal postgres URLs.
 *
 * @param {{ manageSignals?: boolean }} [options]
 * @returns {Promise<{ mode: "pglite" | "postgres", dataDir?: string, connectionUrl: string }>}
 */
export async function ensureDatabaseReady(options = {}) {
  const { manageSignals = true } = options;
  if (!readyPromise) {
    readyPromise = startIfNeeded({ manageSignals });
  }
  return readyPromise;
}

async function startIfNeeded({ manageSignals }) {
  const originalUrl = process.env.DATABASE_URL;
  const dataDir = getLocalDataDir(originalUrl);

  if (!dataDir) {
    if (!originalUrl) {
      throw new Error("DATABASE_URL is not set");
    }
    return { mode: "postgres", connectionUrl: originalUrl };
  }

  fs.mkdirSync(dataDir, { recursive: true });

  const db = new PGlite(dataDir);
  await db.waitReady;

  const host = "127.0.0.1";
  const server = new PGLiteSocketServer({
    db,
    host,
    port: 0,
    maxConnections: 20,
  });

  await server.start();

  // Port is updated from the OS-assigned address after listen(0)
  const port = Number(String(server.getServerConn()).split(":")[1]);
  const connectionUrl = `postgresql://postgres:postgres@${host}:${port}/postgres?sslmode=disable`;

  process.env.DATABASE_URL = connectionUrl;
  runtime = { db, server };

  if (manageSignals) {
    const onSignal = () => {
      void shutdown().finally(() => process.exit(0));
    };
    process.once("SIGINT", onSignal);
    process.once("SIGTERM", onSignal);
  }

  console.log(`PGlite file database ready at ${dataDir} (via ${host}:${port})`);

  return { mode: "pglite", dataDir, connectionUrl };
}

/**
 * Stop the in-process PGlite socket (used by the CLI wrapper after the child exits).
 */
export async function stopLocalDatabase() {
  await shutdown();
  readyPromise = null;
  shuttingDown = false;
}
