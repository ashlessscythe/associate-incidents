#!/usr/bin/env node
/**
 * Fail CI on high/critical npm advisories, with an allowlist for findings that
 * do not apply to this app's runtime.
 *
 * GHSA-qwww-vcr4-c8h2 only affects unstable React Router RSC APIs. This project
 * is a Vite SPA using BrowserRouter and does not use those APIs. The patched
 * react-router@8.3.0 also requires React 19, which is out of scope here.
 */
import { execFileSync } from "node:child_process";

const ALLOWED_HIGH_ADVISORIES = new Set([
  "GHSA-qwww-vcr4-c8h2",
]);

const LEVEL_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const FAIL_AT_OR_ABOVE = LEVEL_RANK.high;

let report;
try {
  execFileSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 20 * 1024 * 1024,
  });
  report = { vulnerabilities: {}, metadata: { vulnerabilities: {} } };
} catch (error) {
  const stdout = error.stdout?.toString?.() ?? "";
  try {
    report = JSON.parse(stdout);
  } catch {
    console.error("npm audit did not return JSON; raw output follows:");
    console.error(stdout || error.message);
    process.exit(1);
  }
}

const vulns = report.vulnerabilities || {};

function advisoryIdsFrom(entry) {
  return (entry.via || [])
    .filter((v) => v && typeof v === "object")
    .map((v) => {
      const url = String(v.url || "");
      const match = url.match(/GHSA-[\w-]+/i);
      return match ? match[0] : null;
    })
    .filter(Boolean);
}

function titlesFrom(entry) {
  return (entry.via || [])
    .filter((v) => v && typeof v === "object")
    .map((v) => v.title)
    .filter(Boolean);
}

/** True if this entry (and any string-via parents) only reference allowlisted GHSAs. */
function isAllowlisted(name, seen = new Set()) {
  if (seen.has(name)) return true;
  seen.add(name);
  const entry = vulns[name];
  if (!entry) return false;

  const ids = advisoryIdsFrom(entry);
  const parentNames = (entry.via || []).filter((v) => typeof v === "string");

  if (ids.length === 0 && parentNames.length === 0) return false;

  const idsOk =
    ids.length === 0 || ids.every((id) => ALLOWED_HIGH_ADVISORIES.has(id));
  const parentsOk =
    parentNames.length === 0 ||
    parentNames.every((parent) => isAllowlisted(parent, seen));

  return idsOk && parentsOk;
}

const blocking = [];
const allowed = [];

for (const [name, entry] of Object.entries(vulns)) {
  const severity = entry.severity || "info";
  if ((LEVEL_RANK[severity] ?? 0) < FAIL_AT_OR_ABOVE) continue;

  const item = {
    name,
    severity,
    viaIds: advisoryIdsFrom(entry),
    title: titlesFrom(entry),
  };

  if (isAllowlisted(name)) allowed.push(item);
  else blocking.push(item);
}

if (allowed.length) {
  console.log("Allowed high/critical advisories (do not apply to this app):");
  for (const item of allowed) {
    const detail =
      item.viaIds.join(", ") ||
      (vulns[item.name]?.via || []).filter((v) => typeof v === "string").join(" via ");
    console.log(`  - ${item.name}: ${detail}`);
  }
}

if (blocking.length) {
  console.error("Blocking high/critical advisories:");
  for (const item of blocking) {
    console.error(
      `  - ${item.name} (${item.severity}): ${item.title.join("; ") || item.viaIds.join(", ") || "see npm audit"}`
    );
  }
  process.exit(1);
}

const counts = report.metadata?.vulnerabilities || {};
console.log(
  `Audit check passed (high+: 0 blocking). npm totals: ${JSON.stringify(counts)}`
);
