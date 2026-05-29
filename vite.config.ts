import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { loadEnv } from "vite";

/** Read token at request time so `.env.local` edits apply after Vite restart (not only at first import). */
function resolveManagementToken(mode: string): string {
  const direct = process.env.SUPABASE_MANAGEMENT_TOKEN?.trim();
  if (direct) return direct;

  for (const root of [process.cwd(), path.resolve(process.cwd(), "../..")]) {
    const loaded = loadEnv(mode, root, "");
    const token = loaded.SUPABASE_MANAGEMENT_TOKEN?.trim();
    if (token) return token;
  }
  return "";
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      {
        name: "supabase-management-api-proxy",
        configureServer(server) {
          const CACHE_TTL_MS = 60_000;
          let cache: { at: number; body: string } | null = null;
          let inFlight: Promise<string> | null = null;

          const withConcurrency = async <T,>(items: T[], limit: number, fn: (item: T) => Promise<void>) => {
            const queue = items.slice();
            const workers = Array.from({ length: Math.max(1, limit) }, async () => {
              while (queue.length > 0) {
                const item = queue.shift();
                if (!item) return;
                await fn(item);
              }
            });
            await Promise.all(workers);
          };

          server.middlewares.use(async (req, res, next) => {
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
              const now = Date.now();
              if (!forceRefresh && cache && now - cache.at < CACHE_TTL_MS) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.setHeader("X-Cache", "HIT");
                res.end(cache.body);
                return;
              }

              const token = resolveManagementToken(mode);
              if (!token) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    ok: false,
                    generatedAt: new Date().toISOString(),
                    organizations: [],
                    projects: [],
                    error: "Missing SUPABASE_MANAGEMENT_TOKEN env var",
                  }),
                );
                return;
              }

              const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" } as const;

              const apiFetch = async (path: string) => {
                const r = await fetch(`https://api.supabase.com${path}`, { headers });
                const text = await r.text();
                if (!r.ok) throw new Error(`${r.status} ${r.statusText}: ${text.slice(0, 300)}`);
                return text ? JSON.parse(text) : null;
              };

              const run = async () => {
                const listFrom = (value: unknown) => {
                  if (Array.isArray(value)) return value;
                  if (value && typeof value === "object") {
                    const v = value as Record<string, unknown>;
                    if (Array.isArray(v.data)) return v.data;
                    if (Array.isArray(v.items)) return v.items;
                    if (Array.isArray(v.organizations)) return v.organizations;
                    if (Array.isArray(v.projects)) return v.projects;
                  }
                  return null;
                };

                const organizationsRaw = (await apiFetch("/v1/organizations")) as unknown;
                const organizations = (listFrom(organizationsRaw) ?? []) as Array<{ slug: string; plan?: string }>;

                const orgs: Array<{
                  slug: string;
                  plan?: string | null;
                  entitlements?: unknown;
                  error?: string;
                }> = [];

                const projects: Array<{
                  orgSlug: string;
                  projectRef: string;
                  projectName: string;
                  region?: string | null;
                  plan?: string | null;
                  addons?: unknown;
                  usage?: {
                    apiCounts?: unknown;
                    apiRequestsCount?: unknown;
                    diskUtil?: unknown;
                    diskConfig?: unknown;
                    health?: unknown;
                    orgUsage?: unknown;
                  };
                  error?: string;
                }> = [];

                for (const org of organizations) {
                  const orgRow: (typeof orgs)[number] = { slug: org.slug, plan: org.plan ?? null };
                  try {
                    const detail = (await apiFetch(`/v1/organizations/${encodeURIComponent(org.slug)}`)) as {
                      plan?: string;
                    };
                    if (detail?.plan) orgRow.plan = detail.plan;
                    orgRow.entitlements = await apiFetch(`/v1/organizations/${encodeURIComponent(org.slug)}/entitlements`);
                  } catch (e) {
                    orgRow.error = e instanceof Error ? e.message : String(e);
                  }
                  orgs.push(orgRow);
                }

                for (const org of organizations) {
                  let orgProjects: Array<{ ref: string; name: string; region?: string; plan?: string }> = [];
                  try {
                    const raw = (await apiFetch(`/v1/organizations/${encodeURIComponent(org.slug)}/projects`)) as unknown;
                    const list = listFrom(raw);
                    if (!list) throw new Error(`Unexpected projects response shape: ${JSON.stringify(raw).slice(0, 180)}`);
                    orgProjects = list as Array<{ ref: string; name: string; region?: string; plan?: string }>;
                  } catch (e) {
                    projects.push({
                      orgSlug: org.slug,
                      projectRef: "",
                      projectName: "(org projects fetch failed)",
                      error: e instanceof Error ? e.message : String(e),
                    });
                    continue;
                  }

                  await withConcurrency(orgProjects, 4, async (p) => {
                    const entry = {
                      orgSlug: org.slug,
                      projectRef: p.ref,
                      projectName: p.name,
                      region: p.region ?? null,
                      plan: p.plan ?? null,
                    } as (typeof projects)[number];

                    try {
                      const healthQs =
                        "services=auth&services=db&services=realtime&services=rest&services=storage";
                      const [addons, apiCounts, apiRequestsCount, projectDetail, diskUtil, diskConfig, health, orgUsage] =
                        await Promise.all([
                          apiFetch(`/v1/projects/${encodeURIComponent(p.ref)}/billing/addons`).catch((e) => ({
                            error: String(e),
                          })),
                          apiFetch(`/v1/projects/${encodeURIComponent(p.ref)}/analytics/endpoints/usage.api-counts`).catch(
                            (e) => ({ error: String(e) }),
                          ),
                          apiFetch(
                            `/v1/projects/${encodeURIComponent(p.ref)}/analytics/endpoints/usage.api-requests-count`,
                          ).catch((e) => ({ error: String(e) })),
                          apiFetch(`/v1/projects/${encodeURIComponent(p.ref)}`).catch((e) => ({ error: String(e) })),
                          apiFetch(`/v1/projects/${encodeURIComponent(p.ref)}/config/disk/util`).catch((e) => ({
                            error: String(e),
                          })),
                          apiFetch(`/v1/projects/${encodeURIComponent(p.ref)}/config/disk`).catch((e) => ({
                            error: String(e),
                          })),
                          apiFetch(`/v1/projects/${encodeURIComponent(p.ref)}/health?${healthQs}`).catch((e) => ({
                            error: String(e),
                          })),
                          apiFetch(
                            `/platform/organizations/${encodeURIComponent(org.slug)}/usage?project_ref=${encodeURIComponent(p.ref)}`,
                          ).catch((e) => ({ error: String(e) })),
                        ]);

                      entry.addons = addons;
                      entry.usage = { apiCounts, apiRequestsCount, diskUtil, diskConfig, health, orgUsage };
                      if (!entry.plan && projectDetail && typeof projectDetail === "object" && !("error" in projectDetail)) {
                        const pd = projectDetail as { plan?: string; subscription_tier?: string };
                        entry.plan = pd.plan ?? pd.subscription_tier ?? org.plan ?? null;
                      } else if (!entry.plan) {
                        entry.plan = org.plan ?? null;
                      }
                    } catch (e) {
                      entry.error = e instanceof Error ? e.message : String(e);
                    }

                    projects.push(entry);
                  });
                }

                return JSON.stringify({
                  ok: true,
                  generatedAt: new Date().toISOString(),
                  cacheTtlMs: CACHE_TTL_MS,
                  organizations: orgs,
                  projects,
                });
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
              return;

            } catch (e) {
              inFlight = null;
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  ok: false,
                  generatedAt: new Date().toISOString(),
                  projects: [],
                  error: e instanceof Error ? e.message : String(e),
                }),
              );
            }
          });
        },
      },
    ],
    server: {
      host: "127.0.0.1",
      port: 5176,
      strictPort: true,
    },
    test: {
      exclude: [...configDefaults.exclude, "scripts/**/*.test.cjs"],
    },
  };
});
