export const HOSTING_DEPLOY_DETAIL_TOC = [
  { id: "identity", label: "Identity", emoji: "🌐", chipClass: "border-sky-400/30 bg-sky-500/15" },
  { id: "metrics", label: "Metrics", emoji: "📊", chipClass: "border-amber-400/30 bg-amber-500/15" },
  { id: "links", label: "Links & alerts", emoji: "🔗", chipClass: "border-indigo-400/30 bg-indigo-500/15" },
  { id: "tools", label: "Linked tools", emoji: "🧰", chipClass: "border-emerald-400/30 bg-emerald-500/15" },
] as const;

export function hostingDeploySectionTitle(id: (typeof HOSTING_DEPLOY_DETAIL_TOC)[number]["id"]): string {
  const item = HOSTING_DEPLOY_DETAIL_TOC.find((t) => t.id === id);
  return item ? `${item.emoji} ${item.label}` : id;
}
