import { z } from "zod";
import type { ToolRepository } from "../types";

const RepoStatusSchema = z.enum(["Ready", "Needs review", "Experimental", "Archived", "Active", "Beta", "Draft"]);

const DeployTargetSchema = z.enum(["github-pages", "vercel", "vps", "github-release", "local"]);

export const ToolRepositorySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  repo: z.string(),
  branch: z.string().min(1),
  remoteEnabled: z.boolean().optional(),
  localVersion: z.string().optional(),
  category: z.string().min(1),
  audience: z.string().min(1),
  status: RepoStatusSchema,
  summary: z.string(),
  localPath: z.string(),
  tags: z.array(z.string()),
  usage: z.array(z.string()),
  appUrl: z.string().optional(),
  localUrl: z.string().optional(),
  icon: z.string().optional(),
  deployTarget: DeployTargetSchema.optional(),
  downloadHint: z.string(),
  manifestPath: z.string().min(1),
  trackedFiles: z.array(z.string()),
  scriptFiles: z.array(z.string()),
}) satisfies z.ZodType<ToolRepository>;

export const RegistrySchema = z.array(ToolRepositorySchema).min(1);

export type RegistryParseResult =
  | { ok: true; data: ToolRepository[] }
  | { ok: false; error: string };

export function parseRegistry(raw: unknown): RegistryParseResult {
  const result = RegistrySchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  const where = issue.path.length > 0 ? ` at ${issue.path.join(".")}` : "";
  return { ok: false, error: `${issue.message}${where}` };
}
