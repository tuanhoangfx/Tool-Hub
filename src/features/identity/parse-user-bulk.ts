import type { UserManagementRow } from "./userManagementRepository";

export type UserCreateDraft = {
  email: string;
  fullName: string;
  role: UserManagementRow["role"];
  password?: string;
};

export type UserBulkRow = UserCreateDraft & { line: number };

export type UserBulkParseResult = {
  rows: UserBulkRow[];
  errors: { line: number; message: string }[];
};

const HEADER_RE = /^email\s*[|:]\s*(display\s*name|name|full\s*name)\s*([|:]\s*role)?\s*$/i;

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
  const email = (parts[0] ?? "").trim().toLowerCase();
  const fullName = (parts[1] ?? "").trim();
  const role = cleanRole(parts[2]);
  if (!email || !fullName) return null;
  return { email, fullName, role };
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
      errors.push({ line: lineNo, message: "Expected email|display_name|role (role optional)" });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.email)) {
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
    const key = row.email.toLowerCase();
    if (seen.has(key)) {
      invalid.push({ line: row.line, message: `Duplicate email: ${row.email}` });
      continue;
    }
    seen.add(key);
    valid.push({
      email: row.email,
      fullName: row.fullName,
      role: row.role,
    });
  }

  return { valid, invalid };
}

export function formatUserBulkLine(row: UserCreateDraft): string {
  return `${row.email}|${row.fullName}|${row.role}`;
}
