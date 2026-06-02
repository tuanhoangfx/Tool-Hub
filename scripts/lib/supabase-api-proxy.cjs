"use strict";

const { readSharedEnv, workspaceDevRoot } = require("./read-env-file.cjs");
const { scanSupabaseWorkspace } = require("./supabase-workspace-scan.cjs");

const MAP_CACHE_TTL_MS = 120_000;

function resolveManagementToken(mode, loadEnv, cwd) {
  const direct = process.env.SUPABASE_MANAGEMENT_TOKEN?.trim() || process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (direct) return direct;

  const shared = readSharedEnv(cwd).SUPABASE_MANAGEMENT_TOKEN?.trim()
    || readSharedEnv(cwd).SUPABASE_ACCESS_TOKEN?.trim();
  if (shared) return shared;

  const devRoot = workspaceDevRoot(cwd);
  for (const root of [cwd, devRoot]) {
    const loaded = loadEnv(mode, root, "");
    const token = loaded.SUPABASE_MANAGEMENT_TOKEN?.trim() || loaded.SUPABASE_ACCESS_TOKEN?.trim();
    if (token) return token;
  }
  return "";
}

function createSupabaseApiProxy({ mode, cwd, loadEnv }) {
  let mapCache = null;
  let mapInFlight = null;

  const buildWorkspaceMap = () => {
    try {
      return JSON.stringify(scanSupabaseWorkspace());
    } catch (e) {
      return JSON.stringify({
        ok: false,
        generatedAt: new Date().toISOString(),
        summary: { projectCount: 0, toolBindingCount: 0, toolsScanned: 0, toolsWithSupabase: 0 },
        projects: [],
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleWorkspaceMap = async (res, forceRefresh) => {
    const now = Date.now();
    if (!forceRefresh && mapCache && now - mapCache.at < MAP_CACHE_TTL_MS) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-Cache", "HIT");
      res.end(mapCache.body);
      return;
    }

    if (!forceRefresh && mapInFlight) {
      const body = await mapInFlight;
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-Cache", "COALESCED");
      res.end(body);
      return;
    }

    mapInFlight = Promise.resolve(buildWorkspaceMap());
    const body = await mapInFlight;
    mapInFlight = null;
    mapCache = { at: Date.now(), body };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("X-Cache", "MISS");
    res.end(body);
  };

  return async function supabaseApiMiddleware(req, res, next) {
    try {
      if (!req.url?.startsWith("/api/supabase/workspace-map")) return next();

      const url = new URL(req.url, "http://127.0.0.1");
      const forceRefresh = url.searchParams.get("refresh") === "1";

      if (req.method && req.method !== "GET") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
        return;
      }

      await handleWorkspaceMap(res, forceRefresh);
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
    }
  };
}

module.exports = { createSupabaseApiProxy, resolveManagementToken };
