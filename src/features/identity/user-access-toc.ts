export const USER_ACCESS_TOC = [
  { id: "user", label: "User", emoji: "👤", chipClass: "border-indigo-400/30 bg-indigo-500/15" },
  { id: "tools", label: "Tool access", emoji: "🧰", chipClass: "border-emerald-400/30 bg-emerald-500/15" },
  { id: "legacy", label: "Projects (legacy)", emoji: "📁", chipClass: "border-amber-400/30 bg-amber-500/15" },
  { id: "summary", label: "Summary", emoji: "📋", chipClass: "border-slate-400/30 bg-slate-500/15" },
] as const;

export function userAccessSectionTitle(id: (typeof USER_ACCESS_TOC)[number]["id"]): string {
  const item = USER_ACCESS_TOC.find((t) => t.id === id);
  return item ? `${item.emoji} ${item.label}` : id;
}
