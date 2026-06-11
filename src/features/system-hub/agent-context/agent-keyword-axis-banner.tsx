import { GitBranch, ShieldCheck } from "lucide-react";
import { compactIconSize } from "@tool-workspace/hub-ui";
import type { AgentContextItem } from "./types";

type AxisBanner = {
  tone: "verify" | "git";
  title: string;
  detail: string;
};

function resolveAxisBanner(item: AgentContextItem): AxisBanner | null {
  if (item.keywordGroup === "verify" || item.id.startsWith("keyword-ship") || item.id === "keyword-loop" || item.id === "keyword-fix" || item.id === "keyword-smoke") {
    return {
      tone: "verify",
      title: "Verify stack — not Git/production",
      detail: "Local gate + dev stack + browser MCP. Run before Push/Deploy when UI changed.",
    };
  }
  if (item.keywordGroup === "git" || item.id.startsWith("keyword-git") || item.id === "keyword-push" || item.id === "keyword-deploy" || item.id === "keyword-release") {
    return {
      tone: "git",
      title: "Git pipeline — production path",
      detail: "Cumulative tiers: Git → Push → Deploy → Release. Not browser verify loop (use Ship P00xx).",
    };
  }
  if (item.trigger?.includes("ship-until-done") && !item.trigger?.includes("p00xx-ship-keywords")) {
    return {
      tone: "verify",
      title: "Verify stack",
      detail: "Browser MCP contract — pair with Git keywords only after local verify passes.",
    };
  }
  if (item.name === "p00xx-ship-keywords" || item.id.includes("ship-keywords")) {
    return {
      tone: "git",
      title: "Git pipeline skill — prompt only",
      detail: "Say Deploy P00xx / Push P00xx — do not attach manually from palette.",
    };
  }
  return null;
}

export function AgentKeywordAxisBanner({ item }: { item: AgentContextItem }) {
  const banner = resolveAxisBanner(item);
  if (!banner) return null;

  const isVerify = banner.tone === "verify";

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
        isVerify
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100/90"
          : "border-amber-400/25 bg-amber-500/10 text-amber-100/90"
      }`}
      role="note"
    >
      {isVerify ? (
        <ShieldCheck size={compactIconSize(14)} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <GitBranch size={compactIconSize(14)} className="mt-0.5 shrink-0" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="font-semibold">{banner.title}</p>
        <p className="mt-0.5 text-[11px] opacity-90">{banner.detail}</p>
      </div>
    </div>
  );
}
