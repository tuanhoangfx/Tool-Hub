/** TOC + section headers — cùng một emoji/label (không dùng Lucide khác màu). */
export type OverviewTocItem = {
  id: string;
  label: string;
  emoji: string;
  chipClass: string;
};

export const OVERVIEW_TOC: OverviewTocItem[] = [
  { id: "about", label: "About", emoji: "📖", chipClass: "border-indigo-400/30 bg-indigo-500/15" },
  { id: "links", label: "Links", emoji: "🔗", chipClass: "border-cyan-400/30 bg-cyan-500/15" },
  { id: "versions", label: "Versions", emoji: "🏷️", chipClass: "border-indigo-400/30 bg-indigo-500/15" },
  { id: "stack", label: "Tech Stack", emoji: "🧱", chipClass: "border-amber-400/30 bg-amber-500/15" },
  { id: "features", label: "Features", emoji: "⚡", chipClass: "border-emerald-400/30 bg-emerald-500/15" },
  { id: "changelog", label: "Changelog", emoji: "🕐", chipClass: "border-fuchsia-400/30 bg-fuchsia-500/15" },
  { id: "roadmap", label: "Roadmap", emoji: "🎯", chipClass: "border-rose-400/30 bg-rose-500/15" },
  { id: "runbook", label: "Runbook", emoji: "⚙️", chipClass: "border-slate-400/30 bg-slate-500/15" },
  { id: "health", label: "Health", emoji: "💚", chipClass: "border-emerald-400/30 bg-emerald-500/15" },
];

export function overviewSectionTitle(id: string): string {
  const item = OVERVIEW_TOC.find((t) => t.id === id);
  return item ? `${item.emoji} ${item.label}` : id;
}
