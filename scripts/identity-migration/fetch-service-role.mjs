#!/usr/bin/env node
/** Fetch service_role via Supabase Management API (projects your PAT can access). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedEnv = path.resolve(__dirname, "../../../../.env.shared");

export function loadTokens() {
  const tokens = [];
  const push = (t) => {
    const v = t?.replace(/^["']|["']$/g, "").trim();
    if (v && !tokens.includes(v)) tokens.push(v);
  };
  push(process.env.SUPABASE_MANAGEMENT_TOKEN);
  push(process.env.SUPABASE_ACCESS_TOKEN);
  if (fs.existsSync(sharedEnv)) {
    let fileMgmt;
    let fileAccess;
    for (const line of fs.readFileSync(sharedEnv, "utf8").split(/\r?\n/)) {
      const m = line.trim().match(/^SUPABASE_(MANAGEMENT|ACCESS)_TOKEN=(.+)$/);
      if (!m) continue;
      if (m[1] === "MANAGEMENT") fileMgmt = m[2];
      else fileAccess = m[2];
    }
    push(fileMgmt);
    push(fileAccess);
  }
  return tokens;
}

async function fetchWithToken(projectRef, token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${projectRef} api-keys ${res.status}: ${text}`);
  }
  const keys = await res.json();
  const row = keys.find((k) => k.name === "service_role" || k.id === "service_role");
  if (!row?.api_key) throw new Error(`No service_role key for ${projectRef}`);
  return row.api_key;
}

export async function fetchServiceRole(projectRef) {
  const tokens = loadTokens();
  if (!tokens.length) {
    throw new Error("Missing SUPABASE_MANAGEMENT_TOKEN or SUPABASE_ACCESS_TOKEN in E:\\Dev\\.env.shared");
  }
  let lastErr;
  for (const token of tokens) {
    try {
      return await fetchWithToken(projectRef, token);
    } catch (e) {
      lastErr = e;
      if (!/ api-keys (403|401):/.test(e.message)) throw e;
    }
  }
  throw lastErr;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ref = process.argv[2] || "fmnrafpzctuhxjaaomzt";
  fetchServiceRole(ref)
    .then((key) => {
      console.log(ref, "service_role prefix:", key.slice(0, 12) + "…");
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
