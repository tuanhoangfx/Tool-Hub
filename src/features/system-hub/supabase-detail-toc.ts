export const SUPABASE_DETAIL_TOC = [
  { id: "about", label: "About", emoji: "ℹ️", chipClass: "border-sky-400/25 bg-sky-500/10 text-sky-200" },
  { id: "usage", label: "Usage", emoji: "📊", chipClass: "border-amber-400/25 bg-amber-500/10 text-amber-200" },
  { id: "infra", label: "Infrastructure", emoji: "🗄️", chipClass: "border-violet-400/25 bg-violet-500/10 text-violet-200" },
  { id: "quota", label: "Org quota", emoji: "📦", chipClass: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" },
  { id: "health", label: "Health", emoji: "💚", chipClass: "border-rose-400/25 bg-rose-500/10 text-rose-200" },
  { id: "links", label: "Links", emoji: "🔗", chipClass: "border-indigo-400/25 bg-indigo-500/10 text-indigo-200" },
] as const;

export function supabaseSectionTitle(id: (typeof SUPABASE_DETAIL_TOC)[number]["id"]): string {
  const item = SUPABASE_DETAIL_TOC.find((t) => t.id === id);
  return item ? `${item.emoji} ${item.label}` : id;
}
