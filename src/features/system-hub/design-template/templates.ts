/** Registry tính năng có mẫu thiết kế trong System → Design Template */
export type DesignTemplateId = "hub-shell";

export type DesignTemplateEntry = {
  id: DesignTemplateId;
  label: string;
  feature: string;
  variants: string;
  status: "preview" | "locked" | "planned";
  docPath: string;
  variantParam: string;
};

export const DESIGN_TEMPLATES: DesignTemplateEntry[] = [
  {
    id: "hub-shell",
    label: "Hub Shell",
    feature: "Tool Hub · layout chính · nav · library embed",
    variants: "V1–V5",
    status: "preview",
    docPath: "docs/DESIGN-PREVIEW-HUB-SHELL.md",
    variantParam: "hsdesign",
  },
];

export const DESIGN_TEMPLATE_RULE =
  "Luôn hoàn thiện mẫu trong Design Template (≥5 hướng khác nhau) trước khi triển khai shell production.";

export function readDesignTemplateId(): DesignTemplateId {
  if (typeof window === "undefined") return "hub-shell";
  const t = new URLSearchParams(window.location.search).get("dtpl");
  if (t === "hub-shell") return "hub-shell";
  return "hub-shell";
}

export function setDesignTemplateId(id: DesignTemplateId) {
  const p = new URLSearchParams(window.location.search);
  p.set("screen", "system");
  p.set("stab", "template");
  p.set("dtpl", id);
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
