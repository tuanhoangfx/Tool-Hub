import { looksLikeEmail, normalizeLoginId } from "@tool-workspace/hub-identity";
import type { UserManagementRow } from "./userManagementRepository";

export type UserCreateDraft = {
  email?: string;
  loginId?: string;
  fullName: string;
  role: UserManagementRow["role"];
  password?: string;
};

export type UserBulkRow = UserCreateDraft & { line: number };

export type UserBulkParseResult = {
  rows: UserBulkRow[];
  errors: { line: number; message: string }[];
};

const HEADER_RE =
  /^(email|login_id|user\s*id)\s*[|:]\s*(display\s*name|name|full\s*name)\s*([|:]\s*role)?\s*$/i;

function splitFields(line: string): string[] {
  const sep = line.includes("|") ? "|" : line.includes(",") ? "," : line.includes(";") ? ";" : null;
  if (!sep) return [];
  return line.split(sep).map((p) => p.trim());
}

function isHeaderLine(raw: string): boolean {
  return HEADER_RE.test(raw.replace(/\s+/g, " "));
}

function cleanRole(value: string | undefined): UserManagementRow["role"] {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "admin" || v === "manager") return v;
  return "user";
}

export function parseUserBulkLine(parts: string[]): UserCreateDraft | null {
  if (parts.length < 2) return null;
  const idOrEmail = (parts[0] ?? "").trim().toLowerCase();
  const fullName = (parts[1] ?? "").trim();
  const role = cleanRole(parts[2]);
  if (!idOrEmail || !fullName) return null;

  if (looksLikeEmail(idOrEmail)) {
    return { email: idOrEmail, fullName, role };
  }
  const loginId = normalizeLoginId(idOrEmail);
  if (!loginId) return null;
  return { loginId, fullName, role };
}

export function parseUserBulkText(text: string): UserBulkParseResult {
  const rows: UserBulkRow[] = [];
  const errors: { line: number; message: string }[] = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i].trim();
    if (!raw || raw.startsWith("#")) continue;
    if (isHeaderLine(raw)) continue;

    const parts = splitFields(raw);
    const parsed = parseUserBulkLine(parts);
    if (!parsed) {
      errors.push({
        line: lineNo,
        message: "Expected login_id|display_name|role or email|display_name|role",
      });
      continue;
    }
    if (parsed.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email)) {
      errors.push({ line: lineNo, message: "Invalid email" });
      continue;
    }
    rows.push({ line: lineNo, ...parsed });
  }

  return { rows, errors };
}

export function validateUserBulkRows(rows: UserBulkRow[]): {
  valid: UserCreateDraft[];
  invalid: { line: number; message: string }[];
} {
  const valid: UserCreateDraft[] = [];
  const invalid: { line: number; message: string }[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const key = (row.loginId ?? row.email ?? "").toLowerCase();
    if (!key) {
      invalid.push({ line: row.line, message: "Missing login_id or email" });
      continue;
    }
    if (seen.has(key)) {
      invalid.push({ line: row.line, message: `Duplicate: ${key}` });
      continue;
    }
    seen.add(key);
    valid.push({
      email: row.email,
      loginId: row.loginId,
      fullName: row.fullName,
      role: row.role,
    });
  }

  return { valid, invalid };
}

export function formatUserBulkLine(row: UserCreateDraft): string {
  const id = row.loginId ?? row.email ?? "";
  return `${id}|${row.fullName}|${row.role}`;
}
