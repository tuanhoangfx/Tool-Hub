#!/usr/bin/env node
import { loadTokens } from "./fetch-service-role.mjs";

export async function runDbQuery(projectRef, query) {
  const tokens = loadTokens();
  if (!tokens.length) throw new Error("Missing Supabase management token in E:\\Dev\\.env.shared");
  const uri = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  let lastErr;
  for (const token of tokens) {
    const res = await fetch(uri, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (res.ok) return res.json();
    const text = await res.text();
    lastErr = new Error(`${projectRef} database/query ${res.status}: ${text}`);
    if (res.status !== 401 && res.status !== 403) throw lastErr;
  }
  throw lastErr;
}
