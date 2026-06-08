import { useMemo, useState } from "react";
import { BookOpen, Check, Code2, Copy } from "lucide-react";
import { compactIconSize } from "../../../lib/ui-scale";
import { useSessionState } from "../../../hooks/useSessionState";
import { AgentGitPipelineWizard } from "./agent-git-pipeline-wizard";
import { AgentKeywordAxisBanner } from "./agent-keyword-axis-banner";
import type { AgentContentField, AgentContextItem, AgentGuideSection } from "./types";
import {
  looksLikeSourceCode,
  parseAgentMarkdown,
  parseInline,
  parseKeywordFields,
  type AgentBodyBlock,
  type InlinePart,
} from "./agent-context-body-parser";

export type AgentBodyViewMode = "reading" | "source";

type AgentContextBodyViewProps = {
  item: AgentContextItem;
};

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      title={label}
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[.04] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)] transition-colors hover:border-indigo-300/30 hover:text-indigo-100"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function InlineText({ parts }: { parts: InlinePart[] }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === "bold") {
          return (
            <strong key={i} className="font-semibold text-[var(--text)]">
              {p.value}
            </strong>
          );
        }
        if (p.kind === "code") {
          return (
            <code
              key={i}
              className="rounded border border-white/10 bg-white/[.06] px-1 py-0.5 font-mono text-[11px] text-emerald-200/90"
            >
              {p.value}
            </code>
          );
        }
        return <span key={i}>{p.value}</span>;
      })}
    </>
  );
}

function StructuredFieldsView({ fields }: { fields: AgentContentField[] }) {
  const priority = [
    "Keyword",
    "Flow",
    "Khi nào",
    "Tóm tắt",
    "Summary",
    "Prompt mẫu",
    "Skill",
    "Pipeline (gồm)",
    "Ship script",
    "Lệnh agent",
    "Gate command",
    "Pattern ID",
    "Pattern id",
    "Layer",
    "Golden",
    "Golden screen",
    "Golden table",
    "Clones",
    "Tabs gợi ý",
    "Gate intent",
    "Tier",
    "Verify",
    "Linked paths",
  ];
  const sorted = [...fields].sort((a, b) => {
    const ai = priority.indexOf(a.label);
    const bi = priority.indexOf(b.label);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <dl className="grid gap-2">
      {sorted.map(({ label, value, variant, copy }) => (
        <div key={label} className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2.5">
          <dt className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <span>{label}</span>
            {copy ? <CopyButton value={value} label={`Copy ${label}`} /> : null}
          </dt>
          <dd className="mt-1">
            {variant === "code" ? (
              <code className="block whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed text-emerald-200/95">
                {value}
              </code>
            ) : variant === "multiline" ? (
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-sky-100/85">{value}</pre>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--text)]">
                <InlineText parts={parseInline(value)} />
              </p>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function KeywordGuideSectionsView({ sections }: { sections: AgentGuideSection[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => {
        if (section.type === "group") {
          return (
            <h4
              key={section.anchor}
              className="border-b border-indigo-300/15 pb-1 text-sm font-semibold text-indigo-100/95"
            >
              {section.title}
            </h4>
          );
        }

        return (
          <article
            key={section.anchor}
            className="rounded-xl border border-white/[.08] bg-gradient-to-br from-white/[.04] to-white/[.015] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]"
          >
            <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-flex rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[13px] font-semibold text-emerald-100">
                  {section.keyword}
                </span>
                {section.summary ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">{section.summary}</p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-md border border-white/10 bg-white/[.04] px-2 py-0.5 text-[10px] text-sky-100/85">
                {section.skill}
              </span>
            </header>

            {section.when ? (
              <p className="mb-2 text-sm leading-relaxed text-[var(--text)]/90">
                <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Khi nào</span>
                {section.when}
              </p>
            ) : null}

            <div className="space-y-2">
              <div className="rounded-lg border border-white/[.06] bg-[#0d1117]/80 px-2.5 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Prompt mẫu</span>
                  <CopyButton value={section.example} label="Copy prompt" />
                </div>
                <code className="block font-mono text-[12px] text-emerald-200/95">{section.example}</code>
              </div>

              <div className="rounded-lg border border-white/[.06] bg-[#0d1117]/80 px-2.5 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Lệnh agent</span>
                  <CopyButton value={section.command} label="Copy command" />
                </div>
                <code className="block whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-slate-300">
                  {section.command}
                </code>
              </div>

              {section.patternId ? (
                <p className="text-xs text-[var(--muted)]">
                  Pattern <code className="text-sky-200/90">{section.patternId}</code>
                  {section.goldenRef ? (
                    <>
                      {" "}
                      · golden <code className="text-sky-200/90">{section.goldenRef}</code>
                    </>
                  ) : null}
                </p>
              ) : null}

              {section.tabHint ? (
                <pre className="whitespace-pre-wrap rounded-lg border border-white/[.06] bg-white/[.02] px-2.5 py-2 font-mono text-[10px] leading-relaxed text-sky-100/80">
                  {section.tabHint}
                </pre>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MarkdownBlockView({ block }: { block: AgentBodyBlock }) {
  switch (block.type) {
    case "h1":
      return <h3 className="text-base font-semibold text-[var(--text)]">{block.text}</h3>;
    case "h2":
      return (
        <h4 className="border-b border-white/5 pb-1 text-sm font-semibold text-indigo-100/95">{block.text}</h4>
      );
    case "h3":
      return <h5 className="text-sm font-semibold text-sky-100/90">{block.text}</h5>;
    case "p":
      return (
        <p className="text-sm leading-relaxed text-[var(--text)]/90">
          <InlineText parts={parseInline(block.text)} />
        </p>
      );
    case "ul":
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--text)]/90">
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineText parts={parseInline(item)} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-[var(--text)]/90">
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineText parts={parseInline(item)} />
            </li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0d1117] p-3 font-mono text-[11px] leading-relaxed text-slate-300">
          {block.text}
        </pre>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[280px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[.04]">
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 font-medium text-indigo-100/90">
                    <InlineText parts={parseInline(h)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-white/5 last:border-0">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-[var(--text)]/85">
                      <InlineText parts={parseInline(cell)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr className="border-white/10" />;
    default:
      return null;
  }
}

function defaultViewMode(item: AgentContextItem, text: string): AgentBodyViewMode {
  if (looksLikeSourceCode(text)) return "source";
  if (item.guideSections?.length || item.contentFields?.length) return "reading";
  if (item.kind === "command" && item.id.startsWith("keyword-")) return "reading";
  if (item.kind === "doc") return "reading";
  return "reading";
}

export function AgentContextBodyView({ item }: AgentContextBodyViewProps) {
  const text = item.bodyPreview ?? "";
  const [viewMode, setViewMode] = useSessionState<AgentBodyViewMode>(
    "system:agent:bodyView",
    defaultViewMode(item, text),
  );

  const legacyKeywordFields = useMemo(() => {
    if (viewMode !== "reading") return null;
    if (item.contentFields?.length || item.guideSections?.length) return null;
    if (item.id === "agent-keyword-guide") return null;
    if (item.kind === "command" && item.id.startsWith("keyword-")) {
      return parseKeywordFields(text);
    }
    return null;
  }, [item, text, viewMode]);

  const markdownBlocks = useMemo(
    () =>
      viewMode === "reading" && !item.contentFields?.length && !item.guideSections?.length && !legacyKeywordFields
        ? parseAgentMarkdown(text)
        : [],
    [text, viewMode, item.contentFields, item.guideSections, legacyKeywordFields],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-[var(--muted)]">
          {viewMode === "reading" ? "Reading mode — formatted for humans" : "Source — raw manifest text"}
        </p>
        <div
          className="inline-flex rounded-lg border border-white/10 bg-white/[.03] p-0.5"
          role="tablist"
          aria-label="Content view mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "reading"}
            onClick={() => setViewMode("reading")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              viewMode === "reading"
                ? "bg-indigo-500/20 text-indigo-100"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <BookOpen size={compactIconSize(12)} />
            Reading
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "source"}
            onClick={() => setViewMode("source")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
              viewMode === "source"
                ? "bg-indigo-500/20 text-indigo-100"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            <Code2 size={compactIconSize(12)} />
            Source
          </button>
        </div>
      </div>

      <div className="max-h-[min(58vh,520px)] overflow-y-auto rounded-lg border border-white/5 bg-[#0a0e14]/80 p-3">
        {viewMode === "source" ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-300">
            {text}
          </pre>
        ) : (
          <div className="space-y-3">
            <AgentKeywordAxisBanner item={item} />
            <AgentGitPipelineWizard item={item} />
            {item.guideSections?.length ? (
              <KeywordGuideSectionsView sections={item.guideSections} />
            ) : item.contentFields?.length ? (
              <StructuredFieldsView fields={item.contentFields} />
            ) : legacyKeywordFields ? (
              <StructuredFieldsView
                fields={legacyKeywordFields.map((f) => ({
                  ...f,
                  copy: f.label === "Example" || f.label === "Prompt mẫu" || f.label === "Command" || f.label === "Lệnh agent",
                }))}
              />
            ) : (
              <div className="space-y-3">
                {markdownBlocks.map((block, i) => (
                  <MarkdownBlockView key={i} block={block} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
