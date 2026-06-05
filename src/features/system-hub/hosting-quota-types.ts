/** Hosting / deploy quota row — parallel to Supabase `ProjectRow`. */
export type HostingProvider = "vps" | "vercel" | "cloudflare" | "github-pages" | "local" | "other";

export type HostingDeployRow = {
  id: string;
  provider: HostingProvider;
  providerLabel: string;
  /** Host / team / account slug (VPS hostname, Vercel team, …). */
  hostSlug: string;
  name: string;
  /** Short ref: tool code, Vercel project id, VPS IP fragment. */
  ref: string;
  region?: string | null;
  plan?: string | null;
  publicUrl?: string | null;
  toolCodes: string[];
  healthLabel: string;
  status: string;
  driftCount: number;
  linkGap: boolean;
  error?: string;
  /** VPS-only hints */
  serviceKind?: string;
  serviceStatus?: string;
  note?: string;
};
