import { z } from "zod";

export const SupabaseBindingSchema = z.object({
  toolId: z.string(),
  toolCode: z.string(),
  toolName: z.string(),
  localPath: z.string(),
  workspaceRoot: z.string(),
  envFile: z.string(),
  envKey: z.string(),
  envLabel: z.string(),
  url: z.string(),
  ref: z.string(),
});

export const SupabaseWorkspaceProjectSchema = z.object({
  ref: z.string(),
  url: z.string(),
  labels: z.array(z.string()),
  bindings: z.array(SupabaseBindingSchema),
});

export const SupabaseWorkspaceMapSchema = z.object({
  ok: z.boolean(),
  generatedAt: z.string(),
  summary: z.object({
    projectCount: z.number(),
    toolBindingCount: z.number(),
    toolsScanned: z.number(),
    toolsWithSupabase: z.number(),
  }),
  projects: z.array(SupabaseWorkspaceProjectSchema),
  error: z.string().optional(),
});

export type SupabaseBinding = z.infer<typeof SupabaseBindingSchema>;
export type SupabaseWorkspaceProject = z.infer<typeof SupabaseWorkspaceProjectSchema>;
export type SupabaseWorkspaceMap = z.infer<typeof SupabaseWorkspaceMapSchema>;
