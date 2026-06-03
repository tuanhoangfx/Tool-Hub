import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import {
  isDefaultLocalHealthPoll,
  LOCAL_HEALTH_POLL_OPTIONS,
  type LocalHealthPollValue,
} from "../../lib/local-health-prefs";
import { patchHubListPrefs, readHubListPrefs } from "../../lib/url-prefs";
import { compactIconSize } from "../../lib/ui-scale";

export function LocalHealthPollSettings() {
  const [value, setValue] = useState<LocalHealthPollValue>(() => readHubListPrefs().localHealthPoll);

  useEffect(() => {
    const sync = () => setValue(readHubListPrefs().localHealthPoll);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  function select(next: LocalHealthPollValue) {
    if (next === value) return;
    setValue(next);
    patchHubListPrefs({ lhpoll: isDefaultLocalHealthPoll(next) ? null : next });
    window.dispatchEvent(
      new CustomEvent("tool-hub-log", {
        detail: {
          scope: "Hub",
          message: `Local health poll: ${next === "off" ? "Off (manual)" : `Auto ${next}`}`,
        },
      }),
    );
  }

  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
        <Radio size={compactIconSize(12)} className="text-emerald-400" aria-hidden />
        <span>Local health poll</span>
      </div>
      <p className="mb-2 text-[10px] leading-snug text-[var(--muted)]">
        Auto-check <code className="text-[var(--text)]/80">:port live</code> on cards.{" "}
        <span className="text-[var(--text)]/90">Local health</span> on the filter bar = check now.
      </p>
      <div className="flex flex-wrap gap-1">
        {LOCAL_HEALTH_POLL_OPTIONS.map((opt) => {
          const on = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              title={
                opt.value === "off"
                  ? "No background checks"
                  : `Background check every ${opt.value}`
              }
              className={`min-w-[2.25rem] rounded-md border px-2 py-1 text-[11px] font-medium tabular-nums transition-colors ${
                on
                  ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                  : "border-white/10 bg-white/[.03] text-[var(--muted)] hover:border-white/20 hover:text-[var(--text)]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
