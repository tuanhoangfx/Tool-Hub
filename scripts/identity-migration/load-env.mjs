import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(__dirname, "../..");
const databoxRoot = path.resolve(hubRoot, "../P0020-Workspace-Notes");
const sharedEnv = path.resolve(hubRoot, "../../.env.shared");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export function loadMigrationEnv() {
  const shared = parseEnvFile(sharedEnv);
  const hubEnv = { ...shared, ...parseEnvFile(path.join(hubRoot, ".env.local")), ...parseEnvFile(path.join(hubRoot, ".env")) };
  const boxEnv = { ...shared, ...parseEnvFile(path.join(databoxRoot, ".env.local")), ...parseEnvFile(path.join(databoxRoot, ".env")) };

  const hubUrl = hubEnv.HUB_SUPABASE_URL || hubEnv.VITE_SUPABASE_URL;
  const hubServiceKey =
    hubEnv.HUB_SUPABASE_SERVICE_ROLE_KEY ||
    hubEnv.SUPABASE_SERVICE_ROLE_KEY ||
    hubEnv.VITE_SUPABASE_SERVICE_ROLE_KEY;

  const sourceUrl = boxEnv.DATABOX_SUPABASE_URL || boxEnv.VITE_SUPABASE_URL || "https://yhnqwxejjkfgmjmiquhb.supabase.co";
  const sourceServiceKey =
    boxEnv.DATABOX_SUPABASE_SERVICE_ROLE_KEY ||
    boxEnv.SUPABASE_SERVICE_ROLE_KEY ||
    boxEnv.VITE_SUPABASE_SERVICE_ROLE_KEY;

  return {
    hubRoot,
    databoxRoot,
    hubUrl,
    hubServiceKey,
    sourceRef: boxEnv.DATABOX_SOURCE_REF || "yhnqwxejjkfgmjmiquhb",
    sourceUrl: sourceUrl || "https://yhnqwxejjkfgmjmiquhb.supabase.co",
    sourceServiceKey,
    exportDir: path.join(hubRoot, "scripts/identity-migration/.exports"),
  };
}
