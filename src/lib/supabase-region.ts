/** Supabase AWS region metadata — keep in sync with Tool/P0020-Workspace-Notes/src/lib/supabase-region.ts */
export type SupabaseRegionMeta = {
  region: string;
  countryCode: string;
  label: string;
  flag: string;
};

const REGION_BY_ID: Record<string, { countryCode: string; label: string }> = {
  "ap-southeast-1": { countryCode: "SG", label: "Singapore" },
  "ap-southeast-2": { countryCode: "AU", label: "Sydney" },
  "ap-northeast-1": { countryCode: "JP", label: "Tokyo" },
  "ap-northeast-2": { countryCode: "KR", label: "Seoul" },
  "ap-south-1": { countryCode: "IN", label: "Mumbai" },
  "eu-central-1": { countryCode: "DE", label: "Frankfurt" },
  "eu-central-2": { countryCode: "CH", label: "Zurich" },
  "eu-west-1": { countryCode: "IE", label: "Ireland" },
  "eu-west-2": { countryCode: "GB", label: "London" },
  "eu-west-3": { countryCode: "FR", label: "Paris" },
  "eu-north-1": { countryCode: "SE", label: "Stockholm" },
  "us-east-1": { countryCode: "US", label: "N. Virginia" },
  "us-east-2": { countryCode: "US", label: "Ohio" },
  "us-west-1": { countryCode: "US", label: "N. California" },
  "us-west-2": { countryCode: "US", label: "Oregon" },
  "ca-central-1": { countryCode: "CA", label: "Canada" },
  "sa-east-1": { countryCode: "BR", label: "São Paulo" },
};

/** ISO 3166-1 alpha-2 → regional indicator emoji pair (e.g. SG → 🇸🇬). */
export function countryCodeToFlagEmoji(countryCode: string): string {
  const cc = countryCode.trim().toUpperCase();
  if (cc.length !== 2 || /[^A-Z]/.test(cc)) return "🌐";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)));
}

export function resolveRegionMeta(region: string | null | undefined): SupabaseRegionMeta {
  const key = (region ?? "").trim();
  if (!key) return { region: "—", countryCode: "", label: "Unknown", flag: "🌐" };
  const row = REGION_BY_ID[key];
  if (!row) return { region: key, countryCode: "", label: key, flag: "🌐" };
  return { region: key, countryCode: row.countryCode, label: row.label, flag: countryCodeToFlagEmoji(row.countryCode) };
}

export function regionFlag(region: string | null | undefined) {
  return resolveRegionMeta(region).flag;
}

export function regionDisplay(region: string | null | undefined) {
  const meta = resolveRegionMeta(region);
  if (meta.region === "—") return "—";
  return `${meta.flag} ${meta.region} · ${meta.label}`;
}

export function regionShort(region: string | null | undefined) {
  const meta = resolveRegionMeta(region);
  if (meta.region === "—") return "—";
  return `${meta.flag} ${meta.label}`;
}
