#!/usr/bin/env node
/** Recover Tool Hub dev server — see Tool/scripts/lib/hub-dev-recover-core.cjs */
const path = require("node:path");
const { recoverHubDevServer } = require("../../scripts/lib/hub-dev-recover-core.cjs");

recoverHubDevServer({
  productCode: "P0004",
  port: 5176,
  root: path.resolve(__dirname, ".."),
});
