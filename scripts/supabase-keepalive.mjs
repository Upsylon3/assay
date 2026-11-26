// Check the public settings read used by Assay. A gateway response alone does not
// establish database activity. A restore requires the Management API to report INACTIVE.

import { readFileSync } from "node:fs";

const CONFIG_FILE = process.env.PVL_CONFIG_FILE || "config.js";
const API_BASE = process.env.SUPABASE_API_BASE || "https://api.supabase.com";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || "";
const POLL_MS = Number(process.env.KEEPALIVE_POLL_MS || 20000);   // how often to check a restore
const MAX_WAIT_MS = Number(process.env.KEEPALIVE_MAX_WAIT_MS || 15 * 60 * 1000);

const log = (m) => console.log(m);
const fail = (m) => { console.error("FAILED: " + m); process.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- read the public settings out of config.js (the same file the site uses)
let cfg;
try { cfg = readFileSync(CONFIG_FILE, "utf8"); } catch { fail(`cannot read ${CONFIG_FILE}`); }
const pick = (name) => (cfg.match(new RegExp(name + "\\s*:\\s*[\"']([^\"']+)[\"']")) || [])[1];
const url = (process.env.SUPABASE_URL || pick("supabaseUrl") || "").replace(/\/+$/, "");
const key = process.env.SUPABASE_KEY || pick("supabaseKey");
if (!url || !key) fail("supabaseUrl / supabaseKey not found in " + CONFIG_FILE);
// the project ref is the first part of the host name: https://<ref>.supabase.co
const ref = process.env.SUPABASE_PROJECT_REF || new URL(url).hostname.split(".")[0];

// ---- 1. the ping
async function ping() {
  try {
    const r = await fetch(`${url}/rest/v1/app_settings?select=key&limit=1`, {
      headers: { apikey: key }, signal: AbortSignal.timeout(20000),
    });
    return r.status;           // 0 below means "no answer at all"
  } catch { return 0; }
}

const describeRead = status => status ? `HTTP ${status}` : "no response";
const first = await ping();
if (first === 200) {
  log(`Project ${ref}: database read succeeded (HTTP 200).`);
  process.exit(0);
}
log(`Project ${ref}: database read failed (${describeRead(first)}).`);

// ---- 2. it may be paused: try to restore it
if (!TOKEN) {
  fail("Check project status in Supabase. If it is active, check the public key and app_settings access. " +
       "If it is paused, resume it from the dashboard or configure SUPABASE_ACCESS_TOKEN for automatic restore.");
}
const mgmt = async (method, path) => {
  const r = await fetch(API_BASE + path, {
    method, headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: method === "POST" ? "{}" : undefined, signal: AbortSignal.timeout(30000),
  });
  let body = null; try { body = await r.json(); } catch { /* empty body */ }
  return { status: r.status, body };
};

const deadline = Date.now() + MAX_WAIT_MS;
let restoreSent = false;
while (Date.now() < deadline) {
  const s = await mgmt("GET", `/v1/projects/${ref}`);
  if (s.status === 401 || s.status === 403) fail(`the access token was refused (HTTP ${s.status}). Create a new one and update the secret.`);
  if (s.status !== 200) fail(`could not read the project status (HTTP ${s.status}) ${JSON.stringify(s.body)}`);
  const status = s.body && s.body.status;
  log(`Project status: ${status}`);

  if (status === "ACTIVE_HEALTHY") {
    // up according to the platform: the first ping may just have been unlucky. Check again properly.
    const again = await ping();
    if (again === 200) { log(`Project ${ref}: database read succeeded (HTTP 200).`); process.exit(0); }
    if (again >= 400 && again < 500 && again !== 429) {
      fail(`Project is active, but the settings read returned HTTP ${again}. Check the public key and app_settings access.`);
    }
    await sleep(POLL_MS); continue;
  }
  if (status === "INACTIVE" && !restoreSent) {
    const r = await mgmt("POST", `/v1/projects/${ref}/restore`);
    if (r.status >= 300) fail(`restore request refused (HTTP ${r.status}) ${JSON.stringify(r.body)}. Check the Supabase dashboard for recovery options.`);
    restoreSent = true; log("Restore requested."); await sleep(POLL_MS); continue;
  }
  if (["COMING_UP", "RESTORING", "UPGRADING", "PAUSING", "GOING_DOWN", "INACTIVE", "ACTIVE_UNHEALTHY"].includes(status)) {
    await sleep(POLL_MS); continue;    // in transition (or INACTIVE right after we asked): just wait
  }
  fail(`unexpected project status "${status}". Look at the project in the Supabase dashboard.`);
}
fail("no successful database read within " + Math.round(MAX_WAIT_MS / 60000) + " minutes. Check the dashboard.");
