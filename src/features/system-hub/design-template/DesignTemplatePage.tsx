import { HubDesignTemplateEmpty } from "@tool-workspace/hub-ui";
import { SystemHubShell } from "../SystemHubShell";
import { ACTIVE_DESIGN_COUNT } from "./design-registry";

/** P0004 System → Design Template sub-tab — empty until a new review is scaffolded. */
export function DesignTemplatePage() {
  return (
    <SystemHubShell tabId="template" showFilter={false} sectionRuleLabel="Design Template">
      <div className="space-y-4 pb-10 px-2">
        <div className="rounded-2xl border border-white/8 bg-[var(--panel)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-300">System</p>
          <h1 className="mt-1 text-xl font-semibold">Design Template</h1>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Active reviews: <strong className="text-cyan-200">{ACTIVE_DESIGN_COUNT}</strong>
          </p>
        </div>
        <HubDesignTemplateEmpty />
      </div>
    </SystemHubShell>
  );
}
