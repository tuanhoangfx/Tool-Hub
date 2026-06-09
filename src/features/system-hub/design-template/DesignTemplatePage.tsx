import { useEffect, useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { HubAuthGateGoldenPreview, semanticKpiIcon } from "@tool-workspace/hub-ui";
import type { KpiTileData } from "../../../components/sales-shell";
import { ensureUserAccessModalShellLocked } from "../../../lib/design-template-state";
import { readSystemRoute } from "../../../lib/system-path";
import { SystemHubShell } from "../SystemHubShell";
import { USER_MODAL_LABEL_LOCK, USER_MODAL_SHELL_LOCK } from "./design-registry";

/** Design Template — user-modal locked V5+L1 · auth-gate preview on /auth-gate. */
export function DesignTemplatePage() {
  const [template, setTemplate] = useState(() => readSystemRoute().design?.template ?? "tool-access");

  useEffect(() => {
    ensureUserAccessModalShellLocked();
    const sync = () => setTemplate(readSystemRoute().design?.template ?? "tool-access");
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const isUserModal = template === "tool-access";
  const kpiItems = useMemo<KpiTileData[]>(
    () => [
      { prefKey: "total", label: "Templates", value: 1, ...semanticKpiIcon("template.total") },
      { prefKey: "locked", label: "Locked", value: 2, ...semanticKpiIcon("template.locked") },
      { prefKey: "preview", label: "In preview", value: 0, ...semanticKpiIcon("template.preview") },
      { prefKey: "draft", label: "Draft", value: 0, ...semanticKpiIcon("template.draft") },
      { prefKey: "published", label: "Published", value: 2, ...semanticKpiIcon("template.published") },
      { prefKey: "variants", label: "Variants", value: 0, ...semanticKpiIcon("template.variants") },
      { prefKey: "features", label: "Features", value: 1, ...semanticKpiIcon("template.features") },
      { prefKey: "archived", label: "Archived", value: 0, ...semanticKpiIcon("template.archived") },
    ],
    [],
  );

  return (
    <SystemHubShell tabId="template" showFilter={false} sectionRuleLabel="Design Template" kpiItems={kpiItems}>
      {isUserModal ? (
        <div className="mx-auto w-full max-w-2xl space-y-4 px-2 py-4">
          <div className="rounded-2xl border border-white/8 bg-[var(--panel)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-300">Design Template</p>
            <h1 className="mt-1 text-xl font-semibold">User Modal</h1>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Shell <strong className="text-emerald-200">{USER_MODAL_SHELL_LOCK}</strong> · labels{" "}
              <strong className="text-emerald-200">{USER_MODAL_LABEL_LOCK}</strong> Field Table —{" "}
              <code className="text-indigo-300">HubUserModalFieldTable</code> (Cookie download FAB pattern).
            </p>
            <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100">
              <Lock size={14} />
              Locked · {USER_MODAL_SHELL_LOCK} + {USER_MODAL_LABEL_LOCK}
            </span>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[var(--panel)] p-3">
            <label className="relative block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input className="field w-full opacity-60" style={{ paddingLeft: 34 }} placeholder="Search active designs..." disabled />
            </label>
          </div>
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] px-4 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--text)]">No active design reviews</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              User modal shipped — <code className="text-indigo-300">HubFullUserAccountModal</code> ·{" "}
              <code className="text-indigo-300">HubWorkspaceUserModal</code>.
            </p>
          </div>
        </div>
      ) : (
        <HubAuthGateGoldenPreview />
      )}
    </SystemHubShell>
  );
}
