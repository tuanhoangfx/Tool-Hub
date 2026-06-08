import { useMemo, useState } from "react";
import { Check, Circle, Copy } from "lucide-react";
import type { AgentContextItem } from "./types";

type PipelineTier = "Git" | "Push" | "Deploy" | "Release";

type WizardStep = {
  id: string;
  label: string;
  detail: string;
  included: boolean;
};

function tierFromItem(item: AgentContextItem): PipelineTier | null {
  if (item.id === "keyword-git") return "Git";
  if (item.id === "keyword-push") return "Push";
  if (item.id === "keyword-deploy") return "Deploy";
  if (item.id === "keyword-release") return "Release";
  return null;
}

function productCodeFromItem(item: AgentContextItem): string {
  const example = item.contentFields?.find((f) => f.label === "Prompt mẫu")?.value ?? item.summary;
  const m = example?.match(/\b(P\d{4}|E\d{4})\b/i);
  return m ? m[1].toUpperCase() : "P00xx";
}

function shipScript(code: string, tier: PipelineTier): string {
  return `powershell -File E:\\Dev\\Tool\\scripts\\ship-product.ps1 -Code ${code} -Keyword ${tier}`;
}

function stepsForTier(tier: PipelineTier): WizardStep[] {
  const all: WizardStep[] = [
    {
      id: "commit",
      label: "Auto-commit WIP",
      detail: "version triple + CHANGELOG title → stage & commit (skip if clean tree)",
      included: tier !== "Git",
    },
    {
      id: "build",
      label: "Build + version sync",
      detail: "check-version-sync → pnpm build when script exists",
      included: true,
    },
    {
      id: "push",
      label: "Push origin",
      detail: "gh auth → git push -u origin HEAD",
      included: tier !== "Git",
    },
    {
      id: "smoke",
      label: "Production smoke",
      detail: "verify-production-smoke.mjs (Vercel READY + HTTP) or VPS deploy scripts",
      included: tier === "Deploy" || tier === "Release",
    },
    {
      id: "release",
      label: "GitHub Release",
      detail: "Major bump + gh release create + post-gh-release metadata",
      included: tier === "Release",
    },
  ];
  if (tier === "Git") {
    return [
      {
        id: "build",
        label: "Build",
        detail: "pnpm build — agent stages/commits + stamp CHANGELOG after",
        included: true,
      },
      {
        id: "commit",
        label: "Commit local",
        detail: "Manual/agent commit + CHANGELOG Minor — no push",
        included: true,
      },
    ];
  }
  return all.filter((s) => s.included);
}

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[.04] px-2 py-1 text-[10px] font-medium text-[var(--muted)] hover:border-indigo-300/30 hover:text-indigo-100"
      aria-label={label}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy script"}
    </button>
  );
}

export function AgentGitPipelineWizard({ item }: { item: AgentContextItem }) {
  const tier = tierFromItem(item);
  const steps = useMemo(() => (tier ? stepsForTier(tier) : []), [tier]);
  const code = useMemo(() => productCodeFromItem(item), [item]);

  if (!tier || tier === "Git") return null;

  const script = shipScript(code, tier);

  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-500/[.06] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-amber-100/95">
          Pipeline wizard — <span className="font-mono">{tier}</span> tier (cumulative)
        </p>
        <CopyChip value={script} label={`Copy ${tier} script`} />
      </div>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-2 text-xs">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-500/15 text-[10px] font-semibold text-amber-100">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 rounded-lg border border-white/[.06] bg-[#0a0e14]/60 px-2.5 py-2">
              <p className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                <Circle size={8} className="text-amber-300/80" aria-hidden />
                {step.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-2 font-mono text-[10px] text-amber-200/80">{script}</p>
    </div>
  );
}
