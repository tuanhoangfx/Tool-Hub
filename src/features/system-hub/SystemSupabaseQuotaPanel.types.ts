export type OrgRow = {
  slug: string;
  plan?: string | null;
  entitlements?: unknown;
  error?: string;
};

export type ProjectRow = {
  orgSlug: string;
  projectRef: string;
  projectName: string;
  region?: string | null;
  plan?: string | null;
  addons?: unknown;
  usage?: {
    apiCounts?: unknown;
    apiRequestsCount?: unknown;
    diskUtil?: unknown;
    diskConfig?: unknown;
    health?: unknown;
    orgUsage?: unknown;
  };
  error?: string;
};

export type QuotaPayload = {
  ok: boolean;
  generatedAt?: string;
  cacheTtlMs?: number;
  organizations?: OrgRow[];
  projects?: ProjectRow[];
  error?: string;
};
