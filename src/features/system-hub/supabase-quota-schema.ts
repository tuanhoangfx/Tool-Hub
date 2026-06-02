import { z } from "zod";

export const OrgSchema = z.object({
  slug: z.string(),
  plan: z.string().optional().nullable(),
  entitlements: z.unknown().optional(),
  error: z.string().optional(),
  tokenLabel: z.string().optional().nullable(),
});

export const ProjectSchema = z.object({
  orgSlug: z.string(),
  projectRef: z.string(),
  projectName: z.string(),
  region: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  orgPlan: z.string().optional().nullable(),
  tokenLabel: z.string().optional().nullable(),
  quotaSource: z.enum(["api", "catalog"]).optional(),
  accountId: z.string().optional().nullable(),
  ownerEmail: z.string().optional().nullable(),
  catalogOwner: z.string().optional().nullable(),
  catalogTools: z.array(z.string()).optional(),
  workspaceTools: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  toolBindings: z
    .array(
      z.object({
        toolCode: z.string(),
        toolName: z.string().optional().nullable(),
        envFile: z.string().optional().nullable(),
        envKey: z.string().optional().nullable(),
        envLabel: z.string().optional().nullable(),
        source: z.enum(["workspace", "catalog"]).optional(),
      }),
    )
    .optional(),
  usage: z
    .object({
      apiCounts: z.unknown().optional(),
      apiRequestsCount: z.unknown().optional(),
      diskUtil: z.unknown().optional(),
      health: z.unknown().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export const QuotaPayloadSchema = z.object({
  ok: z.boolean(),
  metricsPhase: z.enum(["catalog", "live"]).optional(),
  generatedAt: z.string().optional(),
  cacheTtlMs: z.number().optional(),
  organizations: z.array(OrgSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  error: z.string().optional(),
  tokenCount: z.number().optional(),
  catalogTotal: z.number().optional(),
  priorityRefs: z.array(z.string()).optional(),
  tokenStats: z
    .array(
      z.object({
        label: z.string(),
        projects: z.number().optional(),
        error: z.string().optional(),
      }),
    )
    .optional(),
});

export type OrgRow = z.infer<typeof OrgSchema>;
export type ProjectRow = z.infer<typeof ProjectSchema>;
export type QuotaPayload = z.infer<typeof QuotaPayloadSchema>;
export type ToolBindingRow = NonNullable<ProjectRow["toolBindings"]>[number];
