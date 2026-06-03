"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { readSharedEnv, workspaceDevRoot } = require("./read-env-file.cjs");

const CACHE_TTL_MS = 10 * 60_000;
const FETCH_TIMEOUT_MS = 12_000;
const PROJECT_CONCURRENCY = 6;

function loadCatalog(devRoot, hubRoot) {
  const candidates = [];
  if (hubRoot) {
    candidates.push(path.join(hubRoot, "public", "supabase-projects.catalog.json"));
  }
  candidates.push(path.join(devRoot, "supabase-projects.catalog.json"));
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return { projects: [], accounts: [] };
    }
  }
  return { projects: [], accounts: [] };
}

function loadAllManagementTokens(sharedEnv, extra = {}) {
  const tokens = [];
  const labels = [];
  const push = (token, label) => {
    const v = token?.replace(/^["']|["']$/g, "").trim();
    if (!v || tokens.includes(v)) return;
    tokens.push(v);
    labels.push(label || `token-${tokens.length}`);
  };

  push(process.env.SUPABASE_MANAGEMENT_TOKEN, "env-primary");
  push(extra.primary, "extra-primary");

  const multi = process.env.SUPABASE_MANAGEMENT_TOKENS || sharedEnv.SUPABASE_MANAGEMENT_TOKENS || "";
  for (const part of multi.split(/[,;\s]+/)) push(part, "multi");

  for (const [key, val] of Object.entries({ ...sharedEnv, ...extra })) {
    if (/^SUPABASE_PAT_/i.test(key) || /^SUPABASE_MANAGEMENT_TOKEN_/i.test(key)) {
      push(val, key.replace(/^SUPABASE_/, "").toLowerCase());
    }
  }

  push(sharedEnv.SUPABASE_MANAGEMENT_TOKEN, "shared-primary");
  return { tokens, labels: labels.slice(0, tokens.length) };
}

function listFrom(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const v = value;
    if (Array.isArray(v.data)) return v.data;
    if (Array.isArray(v.items)) return v.items;
    if (Array.isArray(v.organizations)) return v.organizations;
    if (Array.isArray(v.projects)) return v.projects;
    if (Array.isArray(v.entitlements)) return v.entitlements;
  }
  return null;
}

/** Map GET /v1/organizations/{slug}/entitlements → { entitlements: EntitlementItem[] }. */
function normalizeEntitlementsPayload(raw) {
  const list = listFrom(raw) ?? [];
  const entitlements = list
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row;
      const key = r.feature?.key ?? r.key;
      if (!key) return null;
      const num =
        typeof r.value === "number"
          ? r.value
          : r.config && typeof r.config === "object" && typeof r.config.value === "number"
            ? r.config.value
            : null;
      return {
        feature: { key },
        hasAccess: r.hasAccess,
        config: num == null ? undefined : { value: num },
        value: num ?? undefined,
      };
    })
    .filter(Boolean);
  return { entitlements };
}

async function withConcurrency(items, limit, fn) {
  const queue = items.slice();
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

function createTokenApi(token) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  const apiFetch = async (apiPath) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const r = await fetch(`https://api.supabase.com${apiPath}`, { headers, signal: controller.signal });
      const text = await r.text();
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${text.slice(0, 300)}`);
      return text ? JSON.parse(text) : null;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        throw new Error(`Timeout after ${FETCH_TIMEOUT_MS}ms: ${apiPath}`);
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  };

  const apiFetchSoft = (apiPath) => apiFetch(apiPath).catch((e) => ({ error: String(e) }));
  return { apiFetch, apiFetchSoft };
}

async function enrichProjectWithMetrics(entry, apiFetchSoft) {
  const ref = entry.projectRef;
  if (!ref) return entry;

  const healthQs = "services=auth&services=db&services=realtime&services=rest&services=storage";
  const [apiCounts, apiRequestsCount, projectDetail, diskUtil, health] = await Promise.all([
    apiFetchSoft(`/v1/projects/${encodeURIComponent(ref)}/analytics/endpoints/usage.api-counts`),
    apiFetchSoft(`/v1/projects/${encodeURIComponent(ref)}/analytics/endpoints/usage.api-requests-count`),
    apiFetchSoft(`/v1/projects/${encodeURIComponent(ref)}`),
    apiFetchSoft(`/v1/projects/${encodeURIComponent(ref)}/config/disk/util`),
    apiFetchSoft(`/v1/projects/${encodeURIComponent(ref)}/health?${healthQs}`),
  ]);

  entry.usage = { apiCounts, apiRequestsCount, diskUtil, health };
  entry.quotaSource = "api";
  if (projectDetail && typeof projectDetail === "object" && !projectDetail.error) {
    entry.plan = projectDetail.plan ?? projectDetail.subscription_tier ?? entry.plan ?? null;
    if (projectDetail.name) entry.projectName = projectDetail.name;
    if (projectDetail.region) entry.region = projectDetail.region;
  }
  return entry;
}

async function fetchQuotaForToken(token, tokenLabel) {
  const { apiFetch, apiFetchSoft } = createTokenApi(token);

  const organizationsRaw = await apiFetch("/v1/organizations");
  const organizations = listFrom(organizationsRaw) ?? [];

  const orgs = [];
  const projects = [];
  const orgPlanBySlug = new Map();

  await Promise.all(
    organizations.map(async (org) => {
      const orgRow = { slug: org.slug, plan: org.plan ?? null, tokenLabel, entitlements: null };
      try {
        const detail = await apiFetchSoft(`/v1/organizations/${encodeURIComponent(org.slug)}`);
        if (detail && !detail.error && detail.plan) orgRow.plan = detail.plan;
        const entRaw = await apiFetchSoft(`/v1/organizations/${encodeURIComponent(org.slug)}/entitlements`);
        if (entRaw && !entRaw.error) orgRow.entitlements = normalizeEntitlementsPayload(entRaw);
      } catch (e) {
        orgRow.error = e instanceof Error ? e.message : String(e);
      }
      orgs.push(orgRow);
      orgPlanBySlug.set(org.slug, orgRow.plan ?? null);
    }),
  );

  const projectsByOrg = await Promise.all(
    organizations.map(async (org) => {
      try {
        const raw = await apiFetch(`/v1/organizations/${encodeURIComponent(org.slug)}/projects`);
        const list = listFrom(raw);
        if (!list) throw new Error(`Unexpected projects response: ${JSON.stringify(raw).slice(0, 120)}`);
        return { orgSlug: org.slug, projects: list };
      } catch (e) {
        projects.push({
          orgSlug: org.slug,
          projectRef: "",
          projectName: `(fetch failed: ${tokenLabel})`,
          tokenLabel,
          error: e instanceof Error ? e.message : String(e),
        });
        return { orgSlug: org.slug, projects: [] };
      }
    }),
  );

  const workItems = [];
  for (const { orgSlug, projects: listed } of projectsByOrg) {
    for (const p of listed) workItems.push({ orgSlug, p });
  }

  await withConcurrency(workItems, PROJECT_CONCURRENCY, async ({ orgSlug, p }) => {
    const entry = {
      orgSlug,
      projectRef: p.ref,
      projectName: p.name,
      region: p.region ?? null,
      plan: p.plan ?? null,
      orgPlan: orgPlanBySlug.get(orgSlug) ?? null,
      tokenLabel,
      quotaSource: "api",
    };

    try {
      await enrichProjectWithMetrics(entry, apiFetchSoft);
    } catch (e) {
      entry.error = e instanceof Error ? e.message : String(e);
    }

    projects.push(entry);
  });

  return { orgs, projects, tokenLabel };
}

function buildCatalogMeta(catalog) {
  const accountOwners = new Map();
  for (const a of catalog.accounts || []) {
    if (a.id) accountOwners.set(a.id, a.owner || null);
  }
  const refMeta = new Map();
  for (const row of catalog.projects || []) {
    if (!row.ref) continue;
    refMeta.set(row.ref, {
      accountId: row.accountId || null,
      ownerEmail: row.owner || accountOwners.get(row.accountId) || null,
      catalogTools: row.tools || [],
    });
  }
  return { accountOwners, refMeta };
}

const WORKSPACE_SCAN_TTL_MS = 5 * 60_000;
let workspaceScanCache = null;

function buildWorkspaceScanByRef() {
  const now = Date.now();
  if (workspaceScanCache && now - workspaceScanCache.at < WORKSPACE_SCAN_TTL_MS) {
    return workspaceScanCache.byRef;
  }

  const byRef = new Map();
  try {
    const scanMod = path.join(__dirname, "supabase-workspace-scan.cjs");
    const { scanSupabaseWorkspace } = require(scanMod);
    const map = scanSupabaseWorkspace();
    for (const row of map.projects || []) {
      if (!row.ref) continue;
      const bindings = (row.bindings || []).map((b) => ({
        toolCode: b.toolCode,
        toolName: b.toolName || null,
        envFile: b.envFile || null,
        envKey: b.envKey || null,
        envLabel: b.envLabel || null,
        source: "workspace",
      }));
      const tools = [...new Set(bindings.map((b) => b.toolCode).filter(Boolean))].sort((a, b) => a.localeCompare(b));
      byRef.set(row.ref, { tools, bindings });
    }
  } catch {
    /* scan optional */
  }

  workspaceScanCache = { at: now, byRef };
  return byRef;
}

function mergeToolBindings(workspaceBindings, catalogTools) {
  const bindings = [...(workspaceBindings || [])];
  for (const code of catalogTools || []) {
    if (!bindings.some((b) => b.toolCode === code)) {
      bindings.push({
        toolCode: code,
        toolName: null,
        envFile: "catalog",
        envKey: "tools[]",
        envLabel: "Catalog mapping",
        source: "catalog",
      });
    }
  }
  return bindings;
}

function mergeToolCodes(workspaceTools, catalogTools) {
  return [...new Set([...(workspaceTools || []), ...(catalogTools || [])])].filter(Boolean).sort((a, b) =>
    a.localeCompare(b),
  );
}

function enrichProjectsWithCatalogMeta(projects, catalog, workspaceScanByRef) {
  const { accountOwners, refMeta } = buildCatalogMeta(catalog);
  return projects.map((p) => {
    const meta = p.projectRef ? refMeta.get(p.projectRef) : null;
    const scan = p.projectRef ? workspaceScanByRef.get(p.projectRef) : null;
    const workspaceTools = scan?.tools ?? p.workspaceTools ?? [];
    const workspaceBindings = scan?.bindings ?? [];
    const catalogTools = meta?.catalogTools ?? p.catalogTools ?? [];
    const toolBindings = mergeToolBindings(workspaceBindings, catalogTools);
    let ownerEmail = meta?.ownerEmail ?? p.ownerEmail ?? null;
    let accountId = meta?.accountId ?? p.accountId ?? p.catalogOwner ?? null;
    if (!ownerEmail && p.tokenLabel) {
      const m = /^pat_([a-z0-9_]+)$/i.exec(String(p.tokenLabel));
      if (m) {
        ownerEmail = accountOwners.get(m[1]) ?? ownerEmail;
        accountId = accountId || m[1];
      }
    }
    return {
      ...p,
      accountId,
      ownerEmail,
      catalogOwner: accountId,
      catalogTools,
      workspaceTools,
      tools: mergeToolCodes(workspaceTools, catalogTools),
      toolBindings,
    };
  });
}

function mergeCatalogProjects(fetchedProjects, catalog, workspaceScanByRef) {
  const { accountOwners, refMeta } = buildCatalogMeta(catalog);
  const byRef = new Map();
  for (const p of fetchedProjects) {
    if (p.projectRef) byRef.set(p.projectRef, p);
  }

  for (const row of catalog.projects || []) {
    if (!row.ref || byRef.has(row.ref)) continue;
    const meta = refMeta.get(row.ref);
    byRef.set(row.ref, {
      orgSlug: row.accountId || "catalog",
      projectRef: row.ref,
      projectName: row.name,
      region: null,
      plan: null,
      orgPlan: null,
      tokenLabel: null,
      quotaSource: "catalog",
      accountId: row.accountId || null,
      ownerEmail: row.owner || accountOwners.get(row.accountId) || null,
      catalogOwner: row.accountId || null,
      catalogTools: row.tools || [],
      error: "No Management API token for this account — add SUPABASE_PAT_* in E:\\Dev\\.env.shared",
    });
  }

  return enrichProjectsWithCatalogMeta([...byRef.values()], catalog, workspaceScanByRef).sort((a, b) =>
    (a.projectName || "").localeCompare(b.projectName || ""),
  );
}

function organizationsFromCatalog(catalog) {
  const seen = new Set();
  const orgs = [];
  for (const row of catalog.projects || []) {
    const slug = row.accountId || "catalog";
    if (seen.has(slug)) continue;
    seen.add(slug);
    orgs.push({ slug, plan: null, tokenLabel: null });
  }
  return orgs;
}

/** Instant payload from catalog + workspace scan (no Management API). */
function fetchSupabaseQuotaCatalogPayload(options = {}) {
  const cwd = options.cwd || process.cwd();
  const devRoot = workspaceDevRoot(cwd);
  const catalog = loadCatalog(devRoot, cwd);
  const workspaceScanByRef = buildWorkspaceScanByRef();
  const projects = mergeCatalogProjects([], catalog, workspaceScanByRef);

  return {
    ok: true,
    metricsPhase: "catalog",
    generatedAt: new Date().toISOString(),
    cacheTtlMs: CACHE_TTL_MS,
    organizations: organizationsFromCatalog(catalog),
    projects,
    tokenCount: 0,
    catalogTotal: (catalog.projects || []).length,
  };
}

/** Live metrics for specific project refs only (priority / modal). */
async function fetchMetricsForRefs(refs, options = {}) {
  const cwd = options.cwd || process.cwd();
  const devRoot = workspaceDevRoot(cwd);
  const sharedEnv = readSharedEnv(cwd);
  const catalog = loadCatalog(devRoot, cwd);
  const workspaceScanByRef = buildWorkspaceScanByRef();
  const { tokens, labels } = loadAllManagementTokens(sharedEnv, options.extraTokens || {});

  const uniqueRefs = [...new Set((refs || []).map((r) => String(r).trim()).filter(Boolean))].slice(0, 8);
  if (!uniqueRefs.length) {
    return { ok: false, error: "No project refs requested", projects: [] };
  }

  if (!tokens.length) {
    return {
      ok: false,
      error: "Missing SUPABASE_MANAGEMENT_TOKEN / SUPABASE_PAT_* in E:\\Dev\\.env.shared",
      projects: [],
    };
  }

  const catalogProjects = mergeCatalogProjects([], catalog, workspaceScanByRef);
  const byRef = new Map(catalogProjects.map((p) => [p.projectRef, p]));

  const orgEntitlements = new Map();

  const enriched = await Promise.all(
    uniqueRefs.map(async (ref) => {
      const base = byRef.get(ref);
      if (!base) {
        return {
          orgSlug: "catalog",
          projectRef: ref,
          projectName: ref,
          quotaSource: "catalog",
          error: "Project ref not in workspace catalog",
        };
      }

      for (let i = 0; i < tokens.length; i++) {
        const { apiFetchSoft } = createTokenApi(tokens[i]);
        const label = labels[i] || `token-${i + 1}`;
        const probe = await apiFetchSoft(`/v1/projects/${encodeURIComponent(ref)}`);
        if (!probe || probe.error) continue;

        const orgSlug = probe.organization_slug ?? base.orgSlug;
        if (orgSlug && !orgEntitlements.has(orgSlug)) {
          const entRaw = await apiFetchSoft(`/v1/organizations/${encodeURIComponent(orgSlug)}/entitlements`);
          if (entRaw && !entRaw.error) {
            orgEntitlements.set(orgSlug, {
              slug: orgSlug,
              plan: probe.plan ?? null,
              tokenLabel: label,
              entitlements: normalizeEntitlementsPayload(entRaw),
            });
          }
        }

        const entry = {
          ...base,
          orgSlug,
          projectRef: ref,
          projectName: probe.name ?? base.projectName,
          region: probe.region ?? base.region,
          plan: probe.plan ?? base.plan,
          tokenLabel: label,
          quotaSource: "api",
        };
        try {
          await enrichProjectWithMetrics(entry, apiFetchSoft);
        } catch (e) {
          entry.error = e instanceof Error ? e.message : String(e);
        }
        return enrichProjectsWithCatalogMeta([entry], catalog, workspaceScanByRef)[0];
      }

      return base;
    }),
  );

  return {
    ok: true,
    metricsPhase: "live",
    generatedAt: new Date().toISOString(),
    projects: enriched,
    organizations: [...orgEntitlements.values()],
    priorityRefs: uniqueRefs,
  };
}

async function fetchSupabaseQuotaPayload(options = {}) {
  const cwd = options.cwd || process.cwd();
  const devRoot = workspaceDevRoot(cwd);
  const sharedEnv = readSharedEnv(cwd);
  const catalog = loadCatalog(devRoot, cwd);
  const workspaceScanByRef = buildWorkspaceScanByRef();
  const { tokens, labels } = loadAllManagementTokens(sharedEnv, options.extraTokens || {});

  if (!tokens.length) {
    return {
      ok: false,
      metricsPhase: "catalog",
      generatedAt: new Date().toISOString(),
      cacheTtlMs: CACHE_TTL_MS,
      organizations: organizationsFromCatalog(catalog),
      projects: mergeCatalogProjects([], catalog, workspaceScanByRef),
      error: "Missing SUPABASE_MANAGEMENT_TOKEN / SUPABASE_PAT_* in E:\\Dev\\.env.shared",
      tokenCount: 0,
      catalogTotal: (catalog.projects || []).length,
    };
  }

  const allOrgs = [];
  const allProjects = [];
  const tokenStats = [];

  const tokenResults = await Promise.all(
    tokens.map(async (token, i) => {
      const label = labels[i] || `token-${i + 1}`;
      try {
        const result = await fetchQuotaForToken(token, label);
        return { ok: true, label, ...result };
      } catch (e) {
        return {
          ok: false,
          label,
          error: e instanceof Error ? e.message : String(e),
          orgs: [],
          projects: [],
        };
      }
    }),
  );

  for (const tr of tokenResults) {
    if (!tr.ok) {
      tokenStats.push({ label: tr.label, error: tr.error });
      continue;
    }
    allOrgs.push(...tr.orgs);
    allProjects.push(...tr.projects);
    tokenStats.push({
      label: tr.label,
      projects: tr.projects.filter((p) => p.projectRef).length,
    });
  }

  const orgSlugs = new Set();
  const mergedOrgs = [];
  for (const o of allOrgs) {
    if (orgSlugs.has(o.slug)) continue;
    orgSlugs.add(o.slug);
    mergedOrgs.push(o);
  }

  const mergedProjects = mergeCatalogProjects(allProjects, catalog, workspaceScanByRef);

  return {
    ok: true,
    metricsPhase: "live",
    generatedAt: new Date().toISOString(),
    cacheTtlMs: CACHE_TTL_MS,
    organizations: mergedOrgs,
    projects: mergedProjects,
    tokenCount: tokens.length,
    tokenStats,
    catalogTotal: (catalog.projects || []).length,
  };
}

function createQuotaMiddleware(options = {}) {
  let cache = null;
  let inFlight = null;

  return async function quotaMiddleware(req, res, next) {
    try {
      if (!req.url?.startsWith("/api/supabase/quota")) return next();
      if (req.method && req.method !== "GET") {
        res.statusCode = 405;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
        return;
      }

      const url = new URL(req.url, "http://127.0.0.1");
      const forceRefresh = url.searchParams.get("refresh") === "1";
      const fastOnly = url.searchParams.get("fast") === "1";
      const refsParam = url.searchParams.get("refs");
      const now = Date.now();

      if (forceRefresh) workspaceScanCache = null;

      if (refsParam) {
        const refs = refsParam
          .split(/[,;\s]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        const payload = await fetchMetricsForRefs(refs, { cwd: options.cwd || process.cwd() });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("X-Cache", "PRIORITY");
        res.setHeader("X-Quota-Phase", "priority");
        res.end(JSON.stringify(payload));
        return;
      }

      if (fastOnly) {
        const payload = fetchSupabaseQuotaCatalogPayload({ cwd: options.cwd || process.cwd() });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("X-Cache", "FAST");
        res.setHeader("X-Quota-Phase", "catalog");
        res.end(JSON.stringify(payload));
        return;
      }

      if (!forceRefresh && cache && now - cache.at < CACHE_TTL_MS) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("X-Cache", "HIT");
        res.end(cache.body);
        return;
      }

      const run = async () => {
        const payload = await fetchSupabaseQuotaPayload({ cwd: options.cwd || process.cwd() });
        return JSON.stringify(payload);
      };

      if (!forceRefresh && inFlight) {
        const body = await inFlight;
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("X-Cache", "COALESCED");
        res.end(body);
        return;
      }

      inFlight = run();
      const body = await inFlight;
      inFlight = null;
      cache = { at: Date.now(), body };

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-Cache", "MISS");
      res.end(body);
    } catch (e) {
      inFlight = null;
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
          organizations: [],
          projects: [],
        }),
      );
    }
  };
}

module.exports = {
  CACHE_TTL_MS,
  loadAllManagementTokens,
  loadCatalog,
  fetchSupabaseQuotaCatalogPayload,
  fetchMetricsForRefs,
  fetchSupabaseQuotaPayload,
  createQuotaMiddleware,
  mergeCatalogProjects,
};
