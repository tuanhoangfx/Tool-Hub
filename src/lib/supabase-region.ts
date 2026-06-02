/** Supabase AWS region metadata — region id → ISO country for flagcdn badges. */
export type SupabaseRegionMeta = {
  region: string;
  countryCode: string;
  label: string;
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

export function resolveRegionMeta(region: string | null | undefined): SupabaseRegionMeta {
  const key = (region ?? "").trim();
  if (!key) return { region: "—", countryCode: "", label: "Unknown" };
  const row = REGION_BY_ID[key];
  if (!row) return { region: key, countryCode: "", label: key };
  return { region: key, countryCode: row.countryCode, label: row.label };
}

/** Chart / filter grouping label (city name). */
export function regionChartLabel(region: string | null | undefined): string {
  const meta = resolveRegionMeta(region);
  return meta.region === "—" ? "—" : meta.label;
}
