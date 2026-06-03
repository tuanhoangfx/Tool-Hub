import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import {
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
    patchHubListPrefs({ lhpoll: next === "90" ? null : next });
    window.dispatchEvent(
      new CustomEvent("tool-hub-log", {
        detail: {
          scope: "Hub",
          message: `Local health poll: ${LOCAL_HEALTH_POLL_OPTIONS.find((o) => o.value === next)?.label ?? next}`,
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
        Controls background checks for <code className="text-[var(--text)]/80">:port live</code> badges on Hub cards. Use{" "}
        <span className="text-[var(--text)]/90">Local health</span> on the filter bar for an immediate recheck.
      </p>
      <div className="space-y-0.5">
        {LOCAL_HEALTH_POLL_OPTIONS.map((opt) => {
          const on = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[11px] transition-colors hover:bg-white/[.04]"
            >
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                  on ? "border-emerald-400 bg-emerald-500/25" : "border-white/20"
                }`}
                aria-hidden
              >
                {on ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> : null}
              </span>
              <span className={on ? "text-[var(--text)]" : "text-[var(--muted)]"}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
