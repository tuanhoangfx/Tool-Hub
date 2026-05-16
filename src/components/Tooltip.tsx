import type { ReactNode } from "react";

type TooltipProps = {
  title: string;
  lines: string[];
  children: ReactNode;
  align?: "start" | "center" | "end";
};

export function Tooltip({ title, lines, children, align = "center" }: TooltipProps) {
  return (
    <span className={`tooltip-host tooltip-align-${align}`}>
      {children}
      <span className="tooltip-bubble" role="tooltip">
        <strong className="tooltip-title">{title}</strong>
        <ul className="tooltip-lines">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </span>
    </span>
  );
}
