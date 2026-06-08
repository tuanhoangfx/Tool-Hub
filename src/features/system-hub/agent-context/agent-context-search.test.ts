import { describe, expect, it } from "vitest";
import { pickAgentSearchOpenItem } from "./agent-context-search";
import type { AgentContextItem } from "./types";

const deployRow: AgentContextItem = {
  id: "keyword-deploy",
  kind: "command",
  name: "Deploy P00xx",
  path: "rule.mdc",
  scope: "workspace",
  summary: "Push + production smoke",
  bodyPreview: "",
  lines: 20,
  updatedAt: "",
  tags: ["keyword"],
  keywordGroup: "git",
};

describe("pickAgentSearchOpenItem", () => {
  it("opens exact keyword name", () => {
    const pick = pickAgentSearchOpenItem([deployRow], "Deploy P00xx");
    expect(pick?.id).toBe("keyword-deploy");
  });

  it("ignores weak partial query", () => {
    const other = { ...deployRow, id: "keyword-ship", name: "Ship P00xx" };
    const pick = pickAgentSearchOpenItem([deployRow, other], "de");
    expect(pick).toBeNull();
  });
});
