export type ChangelogEntry = {
  heading: string;       // raw heading line (date - title)
  date?: string;
  title?: string;
  version?: string;
  type?: string;
  status?: string;
  changes: string[];
  verification: string[];
  commit?: string;
};

// Parse a CHANGELOG.md following the workspace Changelog Standard.
// Entries are h2 ("## YYYY-MM-DD - Title") separated by `---` dividers.
export function parseChangelog(text?: string): ChangelogEntry[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const entries: ChangelogEntry[] = [];
  let current: ChangelogEntry | null = null;
  let bucket: "changes" | "verification" | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");

    // New entry on h2
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      if (current) entries.push(current);
      const heading = h2[1].trim();
      const dateMatch = heading.match(/^(\d{4}-\d{2}-\d{2})\s*[-–—]\s*(.*)$/);
      current = {
        heading,
        date: dateMatch?.[1],
        title: dateMatch?.[2] ?? heading,
        changes: [],
        verification: [],
      };
      bucket = null;
      continue;
    }

    if (!current) continue;

    // h3 buckets
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      const tag = h3[1].trim().toLowerCase();
      if (tag.startsWith("change")) bucket = "changes";
      else if (tag.startsWith("verif")) bucket = "verification";
      else bucket = null;
      continue;
    }

    // Metadata bullets
    const meta = line.match(/^-\s*([\w ]+):\s*`?([^`]+)`?$/i);
    if (meta && !bucket) {
      const key = meta[1].trim().toLowerCase();
      const value = meta[2].trim();
      if (key === "version") current.version = value;
      else if (key === "type") current.type = value;
      else if (key === "status") current.status = value;
      else if (key === "commit") current.commit = value;
      continue;
    }

    // Bullet content for buckets
    const bullet = line.match(/^-\s+(.*)$/);
    if (bullet && bucket) {
      if (bucket === "changes") current.changes.push(bullet[1]);
      else if (bucket === "verification") current.verification.push(bullet[1]);
    }
  }

  if (current) entries.push(current);
  return entries;
}
