/** Design Template registry — preview vs locked. */

export type DesignTemplateStatus = "preview" | "locked";

export type DesignTemplateEntry = {
  id: string;
  label: string;
  status: DesignTemplateStatus;
  blurb: string;
  urlParam?: string;
  lockedChoice?: string;
};

export const DESIGN_TEMPLATES: DesignTemplateEntry[] = [
  {
    id: "tool-versions",
    label: "Tool Versions",
    status: "locked",
    blurb: "Bảng version + FilterBar (V4)",
    lockedChoice: "V4 Filtered table",
  },
  {
    id: "hub-card",
    label: "Hub Card",
    status: "locked",
    blurb: "Hub grid / table card",
    lockedChoice: "V4 quiet badges + V3 status dot",
  },
  {
    id: "hub-header",
    label: "Hub / System header",
    status: "locked",
    blurb: "Sticky command rail",
    lockedChoice: "V2 Compact command rail",
  },
  {
    id: "tool-links",
    label: "Tool Links",
    status: "locked",
    blurb: "Links table in tool modal",
    lockedChoice: "V4a Standard",
  },
  {
    id: "badges",
    label: "Badges & icons",
    status: "locked",
    blurb: "Hub filters, KPI, schema chips",
    lockedChoice: "badge-registry",
  },
];

export function readDesignTemplateId(): string {
  if (typeof window === "undefined") return "tool-versions";
  const id = new URLSearchParams(window.location.search).get("dtpl");
  const found = DESIGN_TEMPLATES.some((t) => t.id === id);
  return found && id ? id : "tool-versions";
}

export function setDesignTemplateId(id: string) {
  const p = new URLSearchParams(window.location.search);
  p.set("screen", "system");
  p.set("stab", "template");
  p.set("dtpl", id);
  if (id === "tool-versions") {
    if (!p.get("vver")) p.set("vver", "V1");
  } else {
    p.delete("vver");
  }
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
