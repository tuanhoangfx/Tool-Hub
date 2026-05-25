import { useEffect, useState } from "react";
import { CheckCircle2, Lock, Palette } from "lucide-react";
import { LOCKED_UI_DECISIONS } from "./locked-decisions";
import { DESIGN_TEMPLATES, readDesignTemplateId, setDesignTemplateId } from "./templates";
import { ToolVersionsPreviewHub } from "./tool-versions/ToolVersionsPreviewHub";
import "./design-template.css";

function LockedTemplateNotice({ label, choice }: { label: string; choice?: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3 text-[12px] text-emerald-200/90">
      <div className="flex items-center gap-2">
        <Lock size={14} aria-hidden />
        <strong>{label}</strong> is locked in production.
      </div>
      {choice ? <p className="mt-1 text-[11px]">Choice: {choice}</p> : null}
      <p className="mt-1 text-[10px] text-[var(--muted)]">Edit the production path listed under Locked decisions below.</p>
    </div>
  );
}

export function DesignTemplateHub() {
  const [templateId, setTemplateId] = useState(() => readDesignTemplateId());

  useEffect(() => {
    const onPop = () => setTemplateId(readDesignTemplateId());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const activeTemplate = DESIGN_TEMPLATES.find((t) => t.id === templateId) ?? DESIGN_TEMPLATES[0];

  return (
    <div className="design-template-hub anim-fade space-y-4">
      <header className="rounded-xl border border-white/5 bg-white/[.02] px-4 py-3">
        <div className="flex items-start gap-3">
          <Palette size={20} className="mt-0.5 shrink-0 text-indigo-300" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Design Template</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[var(--muted)]">
              Review <strong>5 mockups</strong> for features in preview before production. Locked areas show shipped
              decisions only.
            </p>
          </div>
        </div>
      </header>

      <div className="dt-template-grid">
        {DESIGN_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`dt-template-card ${templateId === t.id ? "active" : ""}`}
            onClick={() => {
              setDesignTemplateId(t.id);
              setTemplateId(t.id);
            }}
          >
            <div className="dt-template-card-head">
              <span className="dt-template-label">{t.label}</span>
              <span className={`dt-status ${t.status === "locked" ? "dt-status--locked" : "dt-status--preview"}`}>
                {t.status}
              </span>
            </div>
            <p className="dt-template-feature">{t.blurb}</p>
            {t.lockedChoice ? (
              <p className="dt-template-meta">
                <CheckCircle2 size={10} className="inline" /> {t.lockedChoice}
              </p>
            ) : null}
          </button>
        ))}
      </div>

      {activeTemplate.status === "locked" ? (
        <LockedTemplateNotice label={activeTemplate.label} choice={activeTemplate.lockedChoice} />
      ) : activeTemplate.id === "tool-versions" ? (
        <ToolVersionsPreviewHub />
      ) : null}

      <section className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Locked in production</h3>
        <ul className="space-y-2">
          {LOCKED_UI_DECISIONS.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-white/5 bg-[var(--panel)] px-4 py-3 transition-colors hover:border-white/10"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[var(--text)]">{row.label}</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
                  <Lock size={10} aria-hidden />
                  locked
                </span>
                <span className="text-[11px] text-indigo-200/90">{row.choice}</span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-cyan-300/90">{row.production}</p>
              {row.doc ? <p className="mt-0.5 text-[10px] text-[var(--muted)]">{row.doc}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
