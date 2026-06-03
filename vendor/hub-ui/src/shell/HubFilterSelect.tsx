import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { compactIconSize } from "../ui-scale";

export type HubFilterSelectOption<T extends string = string> = {
  value: T;
  label: string;
};

type HubFilterSelectProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: HubFilterSelectOption<T>[];
  label?: string;
  disabled?: boolean;
  className?: string;
  renderValue?: (value: T, option: HubFilterSelectOption<T> | undefined) => ReactNode;
  renderOption?: (option: HubFilterSelectOption<T>, selected: boolean) => ReactNode;
};

/** Single-select dropdown — same chrome as FilterBar `MultiFilterDropdown`. */
export function HubFilterSelect<T extends string>({
  value,
  onChange,
  options,
  label = "Select",
  disabled = false,
  className = "",
  renderValue,
  renderOption,
}: HubFilterSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="hub-filter-select-trigger"
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left">
          {renderValue ? renderValue(value, current) : (current?.label ?? label)}
        </span>
        <ChevronDown
          size={compactIconSize(12)}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="hub-filter-select-panel anim-pop" role="listbox">
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                className="hub-filter-select-option"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <span className="hub-filter-select-option-check" aria-hidden>
                  {selected ? <Check size={compactIconSize(14)} className="text-indigo-300" /> : null}
                </span>
                <span className="flex-1 truncate text-left">
                  {renderOption ? renderOption(opt, selected) : opt.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
