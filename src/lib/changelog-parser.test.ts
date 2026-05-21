import { describe, expect, it } from "vitest";
import { parseChangelog } from "./changelog-parser";

describe("parseChangelog", () => {
  it("returns empty array for empty input", () => {
    expect(parseChangelog()).toEqual([]);
    expect(parseChangelog("")).toEqual([]);
  });

  it("parses a single entry with metadata, changes and verification", () => {
    const text = [
      "# Changelog",
      "",
      "## 2026-05-20 - Initial release",
      "",
      "- Version: `0.1.0`",
      "- Type: Feature",
      "- Status: Ready",
      "",
      "### Changes",
      "",
      "- Added catalog view",
      "- Added system tab",
      "",
      "### Verification",
      "",
      "- Build passes",
      "",
    ].join("\n");

    const [entry] = parseChangelog(text);
    expect(entry.date).toBe("2026-05-20");
    expect(entry.title).toBe("Initial release");
    expect(entry.version).toBe("0.1.0");
    expect(entry.type).toBe("Feature");
    expect(entry.status).toBe("Ready");
    expect(entry.changes).toEqual(["Added catalog view", "Added system tab"]);
    expect(entry.verification).toEqual(["Build passes"]);
  });

  it("parses multiple entries in order", () => {
    const text = [
      "## 2026-01-01 - First",
      "- Version: `0.1.0`",
      "### Changes",
      "- A",
      "",
      "## 2026-02-01 - Second",
      "- Version: `0.2.0`",
      "### Changes",
      "- B",
    ].join("\n");

    const entries = parseChangelog(text);
    expect(entries).toHaveLength(2);
    expect(entries[0].title).toBe("First");
    expect(entries[1].title).toBe("Second");
    expect(entries[1].changes).toEqual(["B"]);
  });

  it("ignores bullets outside known buckets", () => {
    const text = [
      "## 2026-03-01 - Notes",
      "- Random: stray",
      "### Changes",
      "- Real change",
    ].join("\n");
    const [entry] = parseChangelog(text);
    expect(entry.changes).toEqual(["Real change"]);
  });

  it("handles entries without changes/verification sections", () => {
    const text = "## 2026-04-01 - Header only\n- Version: `0.3.0`\n";
    const [entry] = parseChangelog(text);
    expect(entry.version).toBe("0.3.0");
    expect(entry.changes).toEqual([]);
    expect(entry.verification).toEqual([]);
  });
});
