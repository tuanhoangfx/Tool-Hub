export type HubShellVariant = "V1" | "V2" | "V3" | "V4" | "V5";

export type MockTool = {
  code: string;
  name: string;
  status: "Ready" | "WIP" | "Drift";
  port: number;
};

export const MOCK_TOOLS: MockTool[] = [
  { code: "P0004", name: "Tool Hub", status: "Ready", port: 5176 },
  { code: "P0020", name: "Workspace Notes", status: "Ready", port: 5177 },
  { code: "P0008", name: "Sales Console", status: "Ready", port: 5178 },
  { code: "P0019", name: "Todo Kanban", status: "WIP", port: 5180 },
  { code: "P0005", name: "Zalo AI Bot", status: "Drift", port: 5185 },
];

export const HUB_SHELL_VARIANTS: {
  id: HubShellVariant;
  label: string;
  desc: string;
  mood: string;
}[] = [
  {
    id: "V1",
    label: "Unified Sidebar",
    desc: "P0020 H1 — sidebar indigo tối, nav icon + main rộng",
    mood: "Workspace hub",
  },
  {
    id: "V2",
    label: "Classic macOS",
    desc: "Traffic lights + sidebar mỏng — production hiện tại",
    mood: "Native desktop",
  },
  {
    id: "V3",
    label: "Search-first",
    desc: "Cmd-K trung tâm, chrome tối thiểu, kết quả instant",
    mood: "Power user",
  },
  {
    id: "V4",
    label: "Top Nav Tabs",
    desc: "Không sidebar — tab ngang + content full-width",
    mood: "Web app",
  },
  {
    id: "V5",
    label: "Bento Dashboard",
    desc: "Home bento metrics + library section cuộn",
    mood: "Executive overview",
  },
];

export function readHubShellVariant(): HubShellVariant {
  if (typeof window === "undefined") return "V1";
  const v = new URLSearchParams(window.location.search).get("hsdesign");
  if (v === "V1" || v === "V2" || v === "V3" || v === "V4" || v === "V5") return v;
  return "V1";
}

export function setHubShellVariant(v: HubShellVariant) {
  const p = new URLSearchParams(window.location.search);
  p.set("screen", "system");
  p.set("stab", "template");
  p.set("dtpl", "hub-shell");
  p.set("hsdesign", v);
  window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
