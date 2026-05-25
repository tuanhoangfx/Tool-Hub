import { ToolVersionsPanel } from "../../../overview/ToolVersionsPanel";
import { MOCK_VERSION_HISTORY } from "./mock";
import "../design-template.css";

/** Design Template — reference matches production history table. */
export function ToolVersionsPreviewHub() {
  return (
    <div className="design-template-hub space-y-4 anim-fade">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-200/90">
        <strong>Locked: V4 + history rows</strong> —{" "}
        <code className="rounded bg-black/30 px-1">ToolVersionsPanel.tsx</code>
      </div>
      <ToolVersionsPanel
        rows={MOCK_VERSION_HISTORY}
        tool={{ code: "P0001-preview", localPath: "E:\\Dev\\Tool\\P0001-GPM-Automation-Console", branch: "main" }}
        canonicalVersion="0.2.34"
      />
    </div>
  );
}
