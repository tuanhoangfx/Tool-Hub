import type { AgentContextItem } from "./types";

const KEYWORD_QUERY = /^(ship|loop|fix|smoke|git|commit|push|deploy|release|hub|migrate|directory|inbox|dashboard|overview|system|notes)\b/i;

function queryTokens(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreItem(item: AgentContextItem, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const name = item.name.toLowerCase();
  const hay = [
    item.name,
    item.path,
    item.summary,
    item.commandId ?? "",
    item.keywordGroup ?? "",
    ...item.tags,
    ...(item.contentFields?.map((f) => `${f.label} ${f.value}`) ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (name === q) return 100;
  if (item.id === q || item.id === `keyword-${q}`) return 95;
  if (q.length >= 3 && name.startsWith(q)) return 80;
  if (q.length >= 4 && hay.includes(q)) return 60;

  const tokens = queryTokens(q);
  if (!tokens.length) return 0;
  const matched = tokens.filter((t) => hay.includes(t)).length;
  if (matched === tokens.length) return 40 + matched * 5;
  return 0;
}

/** Best row to deep-open from search (keyword-like query or strong name match). */
export function pickAgentSearchOpenItem(
  items: AgentContextItem[],
  query: string,
): AgentContextItem | null {
  const q = query.trim();
  if (q.length < 2) return null;

  const ranked = items
    .map((item) => ({ item, score: scoreItem(item, q) }))
    .filter((row) => row.score >= (q.length < 4 ? 80 : 60))
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return null;

  const top = ranked[0];
  if (ranked.length === 1) return top.item;
  if (top.score >= 95) return top.item;
  if (KEYWORD_QUERY.test(q) && top.item.id.startsWith("keyword-")) return top.item;
  if (items.length === 1) return items[0];
  return null;
}

export function agentKeywordGroupLabel(group?: AgentContextItem["keywordGroup"]): string {
  switch (group) {
    case "verify":
      return "Verify";
    case "git":
      return "Git";
    case "hub-ui":
      return "Hub UI";
    case "pattern":
      return "Pattern";
    case "supabase":
      return "Supabase";
    default:
      return "—";
  }
}
