import type { KeyboardEvent, ReactNode } from "react";

const BASE =
  "anim-slide rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:ring-2 hover:ring-indigo-500/25";
const SELECTED = "border-indigo-400/30 bg-indigo-500/5";
const DEFAULT = "border-white/5 bg-[var(--panel)]";

export type HubDirectoryCardShellProps = {
  selected?: boolean;
  isDetail?: boolean;
  detailRingClass?: string;
  className?: string;
  children: ReactNode;
};

function shellClass({ selected, isDetail, detailRingClass, className }: Omit<HubDirectoryCardShellProps, "children">) {
  return [
    BASE,
    selected ? SELECTED : DEFAULT,
    isDetail ? `ring-2 ${detailRingClass ?? "ring-emerald-500/40"}` : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Directory card surface — selection/detail rings without click handler. */
export function HubDirectoryCardShell(props: HubDirectoryCardShellProps) {
  return <article className={shellClass(props)}>{props.children}</article>;
}

export type HubDirectoryInteractiveCardProps = HubDirectoryCardShellProps & {
  ariaLabel: string;
  onActivate: () => void;
};

/** Directory card — row click / keyboard opens detail (bots, channels). */
export function HubDirectoryInteractiveCard({ ariaLabel, onActivate, children, ...shell }: HubDirectoryInteractiveCardProps) {
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={`${shellClass(shell)} cursor-pointer`}
      onClick={onActivate}
      onKeyDown={onKeyDown}
    >
      {children}
    </article>
  );
}

export type HubDirectoryCardCheckboxProps = {
  checked: boolean;
  label: string;
  onChange: () => void;
};

/** Bulk-select checkbox — stops card activation propagation. */
export function HubDirectoryCardCheckbox({ checked, label, onChange }: HubDirectoryCardCheckboxProps) {
  return (
    <label
      className="shrink-0 pt-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="hub-checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
      />
    </label>
  );
}
