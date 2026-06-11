import type { SystemTab } from "../features/system-hub/components/SystemTabs";

export type SchemaEntity = "catalog" | "manifest" | "runtime";

const SCHEMA_ENTITIES = new Set<SchemaEntity>(["catalog", "manifest", "runtime"]);

export type SystemRoute = {
  tab: SystemTab;
  schemaEntity?: SchemaEntity;
  design?: {
    template: "tool-access" | "agent-context" | "auth-gate" | "hub-chrome-spacing";
    variant: number;
    live: boolean;
  };
};

const TAB_SEGMENT: Record<SystemTab, string> = {
  overview: "overview",
  schema: "schema",
  "supabase-quota": "supabase-quota",
  server: "server",
  agent: "agent",
  skills: "skills",
  template: "template",
};

const SEGMENT_TAB: Record<string, SystemTab> = {
  overview: "overview",
  schema: "schema",
  "supabase-quota": "supabase-quota",
  server: "server",
  agent: "agent",
  skills: "skills",
  template: "template",
};

function clampVariant(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 5) return 5;
  return Math.round(n);
}

function parseTemplateVariant(segments: string[], p: URLSearchParams): number {
  const seg = segments[2];
  if (seg && /^[1-5]$/.test(seg)) return clampVariant(Number(seg));
  const namedTemplate =
    seg === "tool-access" ||
    seg === "ta" ||
    seg === "auth-gate" ||
    seg === "auth" ||
    seg === "agent-context" ||
    seg === "agent";
  if (namedTemplate && segments[3] && /^[1-5]$/.test(segments[3])) {
    return clampVariant(Number(segments[3]));
  }
  const qv = p.get("qv") ?? p.get("sqv")?.replace(/^V/i, "");
  if (qv) return clampVariant(Number(qv));
  return 1;
}

function legacyDesignQuery(p: URLSearchParams) {
  p.delete("dtpl");
  p.delete("dt");
  p.delete("sqv");
  p.delete("sqm");
}

/** Parse `/system/overview`, `/system/template`, `/system/template/3`. */
export function parseSystemRoute(pathname: string, search = ""): SystemRoute {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const segments = normalized.split("/").filter(Boolean);
  const p = new URLSearchParams(search);
  legacyDesignQuery(p);

  let tab: SystemTab = "overview";
  let schemaEntity: SchemaEntity | undefined;
  let design: SystemRoute["design"] | undefined;

  if (segments[0] === "system") {
    if (segments.length >= 2) {
      tab = SEGMENT_TAB[segments[1]] ?? "overview";
      if (segments[1] === "supabase-projects") tab = "supabase-quota";
      if (tab === "schema" && segments[2] && SCHEMA_ENTITIES.has(segments[2] as SchemaEntity)) {
        schemaEntity = segments[2] as SchemaEntity;
      }
      if (tab === "template") {
        const tplSeg = segments[2];
        let template: NonNullable<SystemRoute["design"]>["template"] = "tool-access";
        let variantSegments = segments;
        if (tplSeg === "agent-context" || tplSeg === "agent") {
          template = "agent-context";
        } else if (tplSeg === "tool-access" || tplSeg === "ta") {
          template = "tool-access";
        } else if (tplSeg === "auth-gate" || tplSeg === "auth") {
          template = "auth-gate";
          variantSegments = ["system", "template", "auth-gate", ...segments.slice(3)];
        } else if (/^[1-5]$/.test(tplSeg ?? "")) {
          template = "auth-gate";
        }
        design = {
          template,
          variant: parseTemplateVariant(variantSegments, p),
          live: false,
        };
      }
    }

    const stab = p.get("stab");
    if (segments.length <= 1 && stab && SEGMENT_TAB[stab]) {
      tab = SEGMENT_TAB[stab];
      if (tab === "template") {
        design = { template: "tool-access", variant: parseTemplateVariant(segments, p), live: false };
      }
    }
  }

  if (tab === "schema" && !schemaEntity) {
    const table = p.get("table");
    if (table && SCHEMA_ENTITIES.has(table as SchemaEntity)) {
      schemaEntity = table as SchemaEntity;
    }
  }

  if (tab === "template" && !design) {
    design = { template: "tool-access", variant: 1, live: false };
  }

  return { tab, schemaEntity, design };
}

export function readSystemRoute(): SystemRoute {
  if (typeof window === "undefined") return { tab: "overview" };
  return parseSystemRoute(window.location.pathname, window.location.search);
}

/** Build canonical path-first system URL. */
export function buildSystemUrl(route: SystemRoute, search = ""): string {
  let path = `/system/${TAB_SEGMENT[route.tab]}`;

  if (route.tab === "schema" && route.schemaEntity) {
    path += `/${route.schemaEntity}`;
  }

  const p = new URLSearchParams(search);
  for (const k of ["stab", "table", "dt", "dtpl", "qv", "sqv", "qm", "sqm", "live"]) {
    p.delete(k);
  }

  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Redirect legacy `/system?stab=…` → `/system/overview` etc. */
export function migrateSystemUrl(): string | null {
  const route = parseSystemRoute(window.location.pathname, window.location.search);
  const p = new URLSearchParams(window.location.search);
  for (const k of ["stab", "table", "dt", "dtpl", "qv", "sqv", "qm", "sqm", "screen", "tab", "live"]) {
    p.delete(k);
  }

  const target = buildSystemUrl(route, p.toString());
  const current = `${window.location.pathname}${window.location.search}`;
  return current !== target ? target : null;
}
