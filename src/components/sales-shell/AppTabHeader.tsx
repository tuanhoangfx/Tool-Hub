import type { ElementType } from "react";
import { Clock } from "lucide-react";
import { usePageSessionSeconds } from "../../hooks/usePageSessionSeconds";
import "./app-tab-header.css";

export type TabHeaderMetaItem = {
  icon: ElementType<{ size?: number; className?: string }>;
  /** Omit or empty to hide label (e.g. release line: icon · v0.1.0 · date). */
  title?: string;
  value: string;
  live?: boolean;
};

export type TabHeaderStatItem = {
  key: string;
  icon: ElementType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  toneClass: string;
};

type AppTabHeaderProps = {
  ariaLabel: string;
  titleIcon: ElementType<{ size?: number; className?: string }>;
  titleIconClass?: string;
  title: string;
  metaItems: TabHeaderMetaItem[];
  centerStats: TabHeaderStatItem[];
  pinSticky?: boolean;
  /** Bottom rule; off when Hub search bar is pinned (rule moves below search). */
  dividerBelow?: boolean;
  /** Inside shared sticky chrome (header + search); no own sticky/margins. */
  embedded?: boolean;
};

function Rule({ visibleFrom = "sm" }: { visibleFrom?: "sm" | "md" | "lg" }) {
  const vis =
    visibleFrom === "lg" ? "hidden lg:block" : visibleFrom === "md" ? "hidden md:block" : "hidden sm:block";
  return <span className={`h-3.5 w-px shrink-0 self-center bg-white/10 ${vis}`} aria-hidden />;
}

function MetaLine({ icon: Icon, title, value, live }: TabHeaderMetaItem) {
  const tip = title ? `${title}: ${value}` : value;
  return (
    <div
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-[13px] leading-none text-[var(--muted)]"
      title={tip}
    >
      <Icon size={14} className="shrink-0 text-indigo-400/90" />
      {title ? <span className="shrink-0">{title}</span> : null}
      {live !== undefined ? (
        <span
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${live ? "bg-emerald-400" : "bg-amber-400"}`}
          aria-hidden
        />
      ) : null}
      <span className="truncate tabular-nums text-[var(--text)]/90">{value}</span>
    </div>
  );
}

function StatLine({
  icon: Icon,
  value,
  label,
  toneClass,
}: {
  icon: ElementType<{ size?: number; className?: string }>;
  value: number;
  label: string;
  toneClass: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 text-[13px] leading-none text-[var(--muted)]"
      title={label}
    >
      <Icon size={14} className={`shrink-0 ${toneClass}`} />
      <span className="font-semibold tabular-nums text-[var(--text)]/90">{value}</span>
      <span>{label}</span>
    </div>
  );
}

export function AppTabHeader({
  ariaLabel,
  titleIcon: TitleIcon,
  titleIconClass = "text-indigo-400",
  title,
  metaItems,
  centerStats,
  pinSticky = true,
  dividerBelow = true,
  embedded = false,
}: AppTabHeaderProps) {
  const sessionMmSs = usePageSessionSeconds();
  const positionClass = embedded ? "relative" : pinSticky ? "sticky top-0 z-40" : "relative z-0";
  const dividerClass = embedded || !dividerBelow ? "" : "border-b border-white/5";
  const gapBelow = embedded || !dividerBelow ? "" : "mb-[var(--app-tab-header-gap-below)]";
  const chromeClass = embedded ? "" : "-mx-6";

  return (
    <header
      className={`app-tab-header ${positionClass} ${chromeClass} ${gapBelow} box-border grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 bg-[var(--bg)] ${dividerClass}`}
      aria-label={ariaLabel}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-self-start gap-x-2.5 gap-y-0">
        <TitleIcon size={16} className={`shrink-0 ${titleIconClass}`} aria-hidden />
        <h1 className="shrink-0 text-base font-semibold leading-none tracking-tight text-[var(--text)]">{title}</h1>
        {metaItems.map((item, index) => (
          <span key={`${item.title}-${index}`} className="inline-flex items-center gap-x-2.5">
            <Rule visibleFrom={index === 0 ? "sm" : index === 1 ? "md" : "lg"} />
            <MetaLine {...item} />
          </span>
        ))}
      </div>

      <div
        className="flex min-w-0 items-center justify-center justify-self-center gap-x-2.5 overflow-x-auto"
        role="status"
        aria-label={`${title} summary`}
      >
        {centerStats.map((stat, index) => (
          <span key={stat.key} className="inline-flex items-center gap-x-2.5">
            {index > 0 ? <Rule /> : null}
            <StatLine icon={stat.icon} value={stat.value} label={stat.label} toneClass={stat.toneClass} />
          </span>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-self-end gap-1.5 text-[13px] leading-none text-[var(--muted)]">
        <Clock size={14} className="shrink-0 text-indigo-400/90" />
        <span>Session</span>
        <span className="tabular-nums text-[var(--text)]/90">{sessionMmSs}</span>
      </div>
    </header>
  );
}
