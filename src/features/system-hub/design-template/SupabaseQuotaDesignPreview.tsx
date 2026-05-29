import { useCallback, useEffect, useMemo, useState } from "react";
import { Gauge, RefreshCcw } from "lucide-react";
import { z } from "zod";
import { HubResultCount, MiniBarChart, ViewToggle, type HubViewMode } from "../../../components/sales-shell";
import { useSessionState } from "../../../hooks";
import { readHubListPrefs } from "../../../lib/url-prefs";
import { compactIconSize } from "../../../lib/ui-scale";
import { SystemHubShell } from "../SystemHubShell";

type Variant = "V1" | "V2" | "V3" | "V4" | "V5";
const VARIANTS: Variant[] = ["V1", "V2", "V3", "V4", "V5"];

type DataMode = "mock" | "live";

const QuotaPayloadSchema = z.object({
  ok: z.boolean(),
  generatedAt: z.string().optional(),
  organizations: z.array(z.object({ slug: z.string() })).optional(),
  projects: z.array(z.object({ orgSlug: z.string(), projectRef: z.string().optional(), projectName: z.string().optional() })).optional(),
  error: z.string().optional(),
});

function readVariant(): Variant {
  if (typeof window === "undefined") return "V1";
  const raw = new URLSearchParams(window.location.search).get("sqv") ?? "V1";
  return (VARIANTS as readonly string[]).includes(raw) ? (raw as Variant) : "V1";
}

function setVariant(v: Variant) {
  const p = new URLSearchParams(window.location.search);
  p.set("screen", "system");
  p.set("stab", "template");
  p.set("dtpl", "supabase-quota");
  p.delete("dt");
  p.set("sqv", v);
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function readDataMode(): DataMode {
  if (typeof window === "undefined") return "mock";
  const raw = new URLSearchParams(window.location.search).get("sqm") ?? "mock";
  return raw === "live" ? "live" : "mock";
}

function setDataMode(m: DataMode) {
  const p = new URLSearchParams(window.location.search);
  p.set("screen", "system");
  p.set("stab", "template");
  p.set("dtpl", "supabase-quota");
  p.delete("dt");
  p.set("sqm", m);
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function VariantToggle({ value, onChange }: { value: Variant; onChange: (v: Variant) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[var(--panel-2)] p-1">
      {VARIANTS.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            value === v ? "bg-indigo-500/15 text-indigo-200" : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
          }`}
          aria-current={value === v ? "page" : undefined}
          title={`Variant ${v}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function PanelCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/5 bg-[var(--panel)]">
      <div className="border-b border-white/5 bg-white/[.02] px-4 py-3">
        <div className="text-sm font-semibold text-[var(--text)]">{title}</div>
        {subtitle ? <div className="mt-0.5 text-[11px] text-[var(--muted)]">{subtitle}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function mockBar(title: string) {
  return (
    <MiniBarChart
      title={title}
      items={[
        { label: "ap-southeast-1", value: 6, color: "#818cf8" },
        { label: "ap-southeast-2", value: 4, color: "#22c55e" },
        { label: "us-east-1", value: 2, color: "#a855f7" },
        { label: "—", value: 1, color: "#f59e0b" },
      ]}
    />
  );
}

export function SupabaseQuotaDesignPreview() {
  const [query, setQuery] = useState("");
  const [prefs, setPrefs] = useState(readHubListPrefs);
  const [viewMode, setViewMode] = useSessionState<HubViewMode>("system:design-template:supabase-quota:viewMode", "table");
  const [variant, setVariantState] = useState<Variant>(() => readVariant());
  const [mode, setMode] = useState<DataMode>(() => readDataMode());
  const [live, setLive] = useState<z.infer<typeof QuotaPayloadSchema> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setPrefs(readHubListPrefs());
      setVariantState(readVariant());
      setMode(readDataMode());
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const fetchLive = useCallback(async (force: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/supabase/quota${force ? "?refresh=1" : ""}`);
      const data = QuotaPayloadSchema.parse(await r.json());
      if (!data.ok) throw new Error(data.error || "Live fetch failed");
      setLive(data);
    } catch (e) {
      setLive(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== "live") return;
    void fetchLive(false);
  }, [mode, fetchLive]);

  const toolbar = useMemo(
    () => (
      <>
        <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[var(--panel-2)] p-1">
          {(["mock", "live"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setDataMode(m);
              }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                mode === m ? "bg-indigo-500/15 text-indigo-200" : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
              }`}
              aria-current={mode === m ? "page" : undefined}
              title={m === "mock" ? "Mock data" : "Live data (Management API token)"}
            >
              {m === "mock" ? "Mock" : "Live"}
            </button>
          ))}
        </div>
        <VariantToggle
          value={variant}
          onChange={(v) => {
            setVariantState(v);
            setVariant(v);
          }}
        />
        <ViewToggle value={viewMode} onChange={setViewMode} />
        {mode === "live" ? (
          <>
            <button
              type="button"
              onClick={() => void fetchLive(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[var(--panel-2)] px-3 py-1.5 text-xs text-[var(--text)] hover:bg-white/5 disabled:opacity-50"
              title="Refresh live data"
            >
              <RefreshCcw size={compactIconSize(12)} className={loading ? "anim-spin" : ""} />
              Refresh
            </button>
            <HubResultCount
              icon={Gauge}
              shown={(live?.projects?.length ?? 0) as number}
              total={(live?.projects?.length ?? 0) as number}
              label="projects"
            />
          </>
        ) : (
          <HubResultCount icon={Gauge} shown={12} total={12} label="projects" />
        )}
        <span className="hidden text-[10px] text-[var(--muted)] sm:inline" title="Design Template only">
          prefs: range={prefs.range}
        </span>
      </>
    ),
    [mode, variant, viewMode, setViewMode, prefs.range, fetchLive, loading, live?.projects?.length],
  );

  const content = useMemo(() => {
    if (variant === "V1") {
      return (
        <div className="space-y-3 pb-8">
          <PanelCard title="V1 · One-screen audit" subtitle="KPI + charts + table/cards (mock)">
            <div className="text-[12px] text-[var(--muted)]">Hub-clone chrome with a single summary card, then data section.</div>
          </PanelCard>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {mockBar("By region")}
            {mockBar("By plan")}
            {mockBar("By org")}
            {mockBar("Errors")}
          </div>
          <PanelCard title="Data" subtitle="Table / cards mock">
            <div className="rounded-xl border border-white/5 bg-black/10 p-3 text-[12px] text-[var(--muted)]">
              Table/card layout placeholder · Use real panel for live data.
            </div>
          </PanelCard>
        </div>
      );
    }

    if (variant === "V2") {
      return (
        <div className="space-y-3 pb-8">
          <PanelCard title="V2 · Org tiles first" subtitle="Cards grid with drilldown behavior (mock)">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/5 bg-[var(--panel)] p-4 transition-colors hover:border-indigo-500/35 hover:bg-white/[.02]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[11px] text-indigo-200/90">org-{i + 1}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">2 projects · 0 errors</div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[var(--muted)]">Free</span>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      );
    }

    if (variant === "V3") {
      return (
        <div className="space-y-3 pb-8">
          <PanelCard title="V3 · Charts-first" subtitle="Push distribution above the fold (mock)">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-3">{mockBar("By region (top)")}</div>
              <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-3">{mockBar("By plan (top)")}</div>
            </div>
          </PanelCard>
        </div>
      );
    }

    if (variant === "V4") {
      return (
        <div className="space-y-3 pb-8">
          <PanelCard title="V4 · Split view" subtitle="Org list → table right (mock)">
            <div className="grid gap-3 lg:grid-cols-[18rem,1fr]">
              <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-2">
                <div className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Organizations</div>
                <div className="space-y-1 px-1 pb-1">
                  {["org-a", "org-b", "org-c", "org-d"].map((o) => (
                    <div key={o} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white/[.03]">
                      <span className="truncate font-mono text-[11px] text-[var(--text)]">{o}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-[var(--muted)]">3</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-3">
                <div className="rounded-xl border border-white/5 bg-black/10 p-3 text-[12px] text-[var(--muted)]">Project table mock</div>
              </div>
            </div>
          </PanelCard>
        </div>
      );
    }

    return (
      <div className="space-y-3 pb-8">
        <PanelCard title="V5 · Compact audit" subtitle="Compact table + rollup chips (mock)">
          <div className="flex flex-wrap gap-2">
            {["org-a", "org-b", "org-c", "org-d", "org-e"].map((o) => (
              <span key={o} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]">
                <span className="font-mono text-indigo-200/90">{o}</span>
                <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] text-[var(--muted)]">4</span>
              </span>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-white/5 bg-black/10 p-3 text-[12px] text-[var(--muted)]">Compact table mock</div>
        </PanelCard>
      </div>
    );
  }, [variant]);

  return (
    <SystemHubShell
      placeholder="Search Supabase Quota design by keyword..."
      query={query}
      onQueryChange={setQuery}
      values={{}}
      onValuesChange={() => {}}
      toolbar={toolbar}
      kpiItems={[
        { label: "Design variants", value: 5, icon: Gauge, tone: "indigo" },
        { label: "Production", value: 1, icon: Gauge, tone: "emerald" },
        { label: "Scope", value: "Template", icon: Gauge, tone: "amber" },
        { label: "Notes", value: "Mock", icon: Gauge, tone: "purple" },
      ]}
      charts={
        <>
          {mockBar("By region")}
          {mockBar("By plan")}
        </>
      }
    >
      <div className="space-y-3">
        {mode === "live" && error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>
        ) : null}
        <div className="rounded-2xl border border-white/5 bg-white/[.02] px-4 py-3 text-[12px] text-[var(--muted)]">
          Design Template only. Production tab: <code className="rounded bg-black/20 px-1 py-0.5 font-mono">System → Supabase Quota</code>.
          <span className="ml-2 text-[10px] text-[var(--muted)]" aria-hidden>
            icon {compactIconSize(12)}
          </span>
        </div>
        {content}
      </div>
    </SystemHubShell>
  );
}

