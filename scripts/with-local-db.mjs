#!/usr/bin/env node
/**
 * Ensures a file:/pglite: DATABASE_URL is served over local TCP, then runs the
 * given command so Prisma CLI and the app share one PGlite instance.
 *
 * Cross-platform: pass argv as an array (not a joined shell string) so paths
 * with spaces and Windows .cmd shims (npm/npx/prisma) work on win/mac/linux.
 *
 * Usage:
 *   node scripts/with-local-db.mjs -- prisma migrate deploy
 *   node scripts/with-local-db.mjs -- npm run start:app
 *   node scripts/with-local-db.mjs -- node prisma/seed.mjs --use-faker --count 10
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import {
  ensureDatabaseReady,
  isLocalFileDatabaseUrl,
  stopLocalDatabase,
} from "../src/dbBootstrap.js";

dotenv.config();

const isWindows = process.platform === "win32";
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const localBin = path.join(repoRoot, "node_modules", ".bin");

const args = process.argv.slice(2);
const commandArgs = args[0] === "--" ? args.slice(1) : args;

if (commandArgs.length === 0) {
  console.error(
    "Usage: node scripts/with-local-db.mjs -- <command> [args...]\n" +
      "Example: node scripts/with-local-db.mjs -- prisma migrate deploy",
  );
  process.exit(1);
}

function childEnv() {
  const pathKey = isWindows
    ? Object.keys(process.env).find((key) => key.toLowerCase() === "path") ||
      "Path"
    : "PATH";
  const existing = process.env[pathKey] || "";
  return {
    ...process.env,
    [pathKey]: `${localBin}${path.delimiter}${existing}`,
  };
}

/**
 * @param {import("node:child_process").ChildProcess} child
 * @param {NodeJS.Signals | number} [signal]
 */
function terminateChild(child, signal = "SIGTERM") {
  if (!child.pid || child.exitCode !== null || child.signalCode) return;

  if (isWindows) {
    // SIGINT/SIGTERM do not reliably stop process trees on Windows.
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  try {
    child.kill(signal);
  } catch {
    // Child may already be gone.
  }
}

async function main() {
  if (isLocalFileDatabaseUrl()) {
    await ensureDatabaseReady({ manageSignals: false });
  }

  const [command, ...commandRest] = commandArgs;
  const child = spawn(command, commandRest, {
    // Windows needs a shell to resolve npm/npx/prisma .cmd shims in PATH.
    // Argv is still passed as an array so Node quotes safely (no quote-stripping bugs).
    shell: isWindows,
    stdio: "inherit",
    env: childEnv(),
    windowsHide: true,
  });

  const forward = (signal) => terminateChild(child, signal);
  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));

  const exitCode = await new Promise((resolve) => {
    child.on("error", (err) => {
      console.error(err);
      resolve(1);
    });
    child.on("close", (code, signal) => {
      if (signal) resolve(1);
      else resolve(code ?? 1);
    });
  });

  await stopLocalDatabase();
  process.exit(exitCode);
}

main().catch(async (err) => {
  console.error(err);
  await stopLocalDatabase();
  process.exit(1);
});
