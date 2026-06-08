import { describe, expect, it } from "vitest";
import { parseAgentMarkdown, parseKeywordFields, parseInline } from "./agent-context-body-parser";

describe("parseKeywordFields", () => {
  it("extracts labeled keyword rows", () => {
    const text = `# Ship P00xx

**Khi nào:** Task thường.
**Example:** \`Ship P0020\`
**Skill:** ship-until-done

**Command:**
\`\`\`bash
node gate.mjs
\`\`\``;

    const fields = parseKeywordFields(text);
    expect(fields).not.toBeNull();
    expect(fields!.some((f) => f.label === "Khi nào")).toBe(true);
    expect(fields!.some((f) => f.label === "Example")).toBe(true);
  });
});

describe("parseAgentMarkdown", () => {
  it("parses headings and table", () => {
    const blocks = parseAgentMarkdown(`## Section

| A | B |
|---|---|
| 1 | 2 |
`);
    expect(blocks.some((b) => b.type === "h2")).toBe(true);
    expect(blocks.some((b) => b.type === "table")).toBe(true);
  });
});

describe("parseInline", () => {
  it("splits bold and code", () => {
    const parts = parseInline("Use **Ship** and `gate.mjs`");
    expect(parts.map((p) => p.kind)).toEqual(["text", "bold", "text", "code"]);
  });
});
