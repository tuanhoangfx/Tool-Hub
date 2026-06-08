/** Lightweight markdown blocks for Agent detail Reading mode (no external deps). */

export type AgentBodyBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang: string | null; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" };

export type AgentKeywordField = {
  label: string;
  value: string;
  variant?: "code" | "text" | "multiline";
};

const TABLE_SEP = /^\|[\s\-:|]+\|$/;

export function looksLikeSourceCode(text: string): boolean {
  const head = text.trimStart().slice(0, 120);
  return /^#!/.test(head) || /^import\s/m.test(head) || /^const\s+\{/.test(head);
}

/** Parse keyword/command bodyPreview into labeled fields when structured. */
export function parseKeywordFields(text: string): AgentKeywordField[] | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("#")) return null;

  const fields: AgentKeywordField[] = [];
  const labeled = [...trimmed.matchAll(/\*\*([^*]+):\*\*\s*([\s\S]*?)(?=\n\*\*[^*]+:\*\*|\n```|\n##|\n# |\n\*\*[A-Z]|$)/g)];

  if (labeled.length < 2) return null;

  for (const m of labeled) {
    const label = m[1].trim();
    let value = m[2].trim();
    let variant: AgentKeywordField["variant"] = "text";

    if (label === "Example" || label === "Command" || label === "Pattern") variant = "code";
    if (label === "screensByProduct (gợi ý tab)" || label === "Tabs (legacy)") variant = "multiline";

    if (value.startsWith("`") && value.endsWith("`") && !value.includes("\n")) {
      value = value.slice(1, -1);
      variant = "code";
    }

    fields.push({ label, value, variant });
  }

  const codeMatch = trimmed.match(/```(?:bash|powershell|json)?\n([\s\S]*?)```/);
  if (codeMatch && !fields.some((f) => f.label === "Command")) {
    fields.push({ label: "Command", value: codeMatch[1].trim(), variant: "code" });
  }

  return fields.length >= 3 ? fields : null;
}

function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
}

export function parseAgentMarkdown(text: string): AgentBodyBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: AgentBodyBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const fence = trimmed.match(/^```(\w+)?$/);
    if (fence) {
      const lang = fence[1] ?? null;
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "code", lang, text: codeLines.join("\n").trimEnd() });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      i += 1;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      i += 1;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2).trim() });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1].trim())) {
      const headers = parseTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseTableRow(lines[i].trim()));
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paraLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length && lines[i].trim() && !/^#{1,3}\s/.test(lines[i].trim()) && !lines[i].trim().startsWith("|") && !/^```/.test(lines[i].trim()) && !/^[-*]\s+/.test(lines[i].trim())) {
      paraLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "p", text: paraLines.join(" ") });
  }

  return blocks;
}

/** Inline **bold** and `code` → React-safe segments (plain strings + markers). */
export type InlinePart = { kind: "text" | "bold" | "code"; value: string };

export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ kind: "text", value: text.slice(last, m.index) });
    const token = m[0];
    if (token.startsWith("**")) parts.push({ kind: "bold", value: token.slice(2, -2) });
    else parts.push({ kind: "code", value: token.slice(1, -1) });
    last = m.index + token.length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts.length ? parts : [{ kind: "text", value: text }];
}
