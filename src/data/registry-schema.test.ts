import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseRegistry } from "./registry-schema";

const minimalRepo = {
  id: "demo",
  code: "P0099",
  name: "Demo",
  repo: "owner/demo",
  branch: "main",
  category: "Web",
  audience: "Test",
  status: "Ready",
  summary: "Demo",
  localPath: "C:/demo",
  tags: ["test"],
  usage: ["pnpm dev"],
  downloadHint: "Clone",
  manifestPath: "tool.manifest.json",
  trackedFiles: ["README.md"],
  scriptFiles: [],
};

describe("parseRegistry", () => {
  it("accepts a valid single-entry registry", () => {
    const result = parseRegistry([minimalRepo]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data[0].id).toBe("demo");
  });

  it("rejects empty array", () => {
    const result = parseRegistry([]);
    expect(result.ok).toBe(false);
  });

  it("rejects non-array root", () => {
    const result = parseRegistry({ repositories: [minimalRepo] });
    expect(result.ok).toBe(false);
  });

  it("rejects entries missing required fields", () => {
    const broken = { ...minimalRepo };
    delete (broken as { id?: string }).id;
    const result = parseRegistry([broken]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.toLowerCase()).toContain("id");
  });

  it("rejects invalid status enum", () => {
    const result = parseRegistry([{ ...minimalRepo, status: "Yolo" }]);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid deployTarget enum", () => {
    const result = parseRegistry([{ ...minimalRepo, deployTarget: "lambda" }]);
    expect(result.ok).toBe(false);
  });

  it("accepts entries with optional fields omitted", () => {
    const result = parseRegistry([minimalRepo]);
    expect(result.ok).toBe(true);
  });

  it("validates the real public/registry.default.json", () => {
    const path = resolve(__dirname, "../../public/registry.default.json");
    const raw = JSON.parse(readFileSync(path, "utf8"));
    const result = parseRegistry(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.length).toBeGreaterThan(0);
  });
});
