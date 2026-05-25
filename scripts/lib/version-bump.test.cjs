const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { bumpPatch, parseSemver } = require("./version-bump.cjs");

describe("version-bump", () => {
  it("bumpPatch increments patch", () => {
    assert.equal(bumpPatch("0.1.0"), "0.1.1");
    assert.equal(bumpPatch("v1.2.9"), "1.2.10");
  });

  it("parseSemver strips v prefix", () => {
    assert.deepEqual(parseSemver("v0.1.0"), { major: 0, minor: 1, patch: 0 });
  });
});
