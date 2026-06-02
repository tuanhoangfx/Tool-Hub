export type UserTableColumnKey =
  | "fullName"
  | "id"
  | "email"
  | "role"
  | "toolCount"
  | "createdAt"
  | "lastActiveAt"
  | "activityCount";

export type UserTableColumnItem = {
  key: UserTableColumnKey;
  label: string;
  /** Cannot be hidden */
  required?: boolean;
};

export const USER_TABLE_COLUMN_ITEMS: UserTableColumnItem[] = [
  { key: "fullName", label: "Name", required: true },
  { key: "id", label: "ID" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "toolCount", label: "Tools" },
  { key: "createdAt", label: "Created" },
  { key: "lastActiveAt", label: "Latest activity" },
  { key: "activityCount", label: "Actions" },
];

const STORAGE_KEY = "tool-hub:users-table-columns";
const ALL_KEYS = new Set(USER_TABLE_COLUMN_ITEMS.map((c) => c.key));

export const DEFAULT_USER_TABLE_COLUMNS = new Set(USER_TABLE_COLUMN_ITEMS.map((c) => c.key));

export function readUserTableColumns(): Set<UserTableColumnKey> {
  if (typeof window === "undefined") return new Set(DEFAULT_USER_TABLE_COLUMNS);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set(DEFAULT_USER_TABLE_COLUMNS);
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set(DEFAULT_USER_TABLE_COLUMNS);
    const next = new Set(parsed.filter((k): k is UserTableColumnKey => ALL_KEYS.has(k as UserTableColumnKey)));
    if (!next.has("fullName")) next.add("fullName");
    return next.size ? next : new Set(DEFAULT_USER_TABLE_COLUMNS);
  } catch {
    return new Set(DEFAULT_USER_TABLE_COLUMNS);
  }
}

export function writeUserTableColumns(columns: Set<UserTableColumnKey>) {
  const next = new Set(columns);
  next.add("fullName");
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  window.dispatchEvent(new CustomEvent("user-table-columns-change"));
}

export function resetUserTableColumns() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("user-table-columns-change"));
}
