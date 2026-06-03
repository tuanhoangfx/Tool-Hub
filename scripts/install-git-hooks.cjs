#!/usr/bin/env node
/**
 * @deprecated Use workspace script: node E:/Dev/Tool/scripts/install-product-git-hooks.cjs --product-root .
 */
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const workspaceScript = path.join(__dirname, "..", "..", "scripts", "install-product-git-hooks.cjs");
console.warn("[hooks] install-git-hooks.cjs is deprecated — delegating to Tool/scripts/install-product-git-hooks.cjs");
execFileSync(
  process.execPath,
  [workspaceScript, "--product-root", process.cwd()],
  { stdio: "inherit" },
);
