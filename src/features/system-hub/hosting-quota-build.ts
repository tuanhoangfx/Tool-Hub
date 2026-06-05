import inventory from "../../data/vps-inventory.json";
import { deployLabel } from "../../lib/tooling";
import type { ResolvedTool } from "../../types";
import type { HostingDeployRow, HostingProvider } from "./hosting-quota-types";

type VpsInventory = typeof inventory;

const HOSTING_TARGETS = new Set(["vps", "vercel", "cloudflare"]);

function normalizeProvider(target?: string): HostingProvider {
  if (target === "vps" || target === "vercel" || target === "cloudflare") return target;
  if (target === "github-pages") return "github-pages";
  if (target === "local") return "local";
  return "other";
}

function toolByCode(tools: ResolvedTool[], code: string) {
  return tools.find((t) => t.code === code);
}

function rowHealth(tool: ResolvedTool | undefined): Pick<HostingDeployRow, "healthLabel" | "status" | "driftCount" | "linkGap" | "error"> {
  if (!tool) {
    return { healthLabel: "—", status: "—", driftCount: 0, linkGap: false };
  }
  return {
    healthLabel: tool.healthLabel || tool.status || "—",
    status: tool.status,
    driftCount: tool.driftAlerts.length,
    linkGap: tool.driftAlerts.length > 0,
    error: tool.driftAlerts[0],
  };
}

function buildVpsRows(tools: ResolvedTool[], inv: VpsInventory): HostingDeployRow[] {
  const rows: HostingDeployRow[] = [];
  const seenCodes = new Set<string>();

  for (const svc of inv.services ?? []) {
    if (!svc.code) continue;
    seenCodes.add(svc.code);
    const tool = toolByCode(tools, svc.code);
    const health = rowHealth(tool);
    rows.push({
      id: `vps:svc:${svc.code}`,
      provider: "vps",
      providerLabel: deployLabel("vps"),
      hostSlug: inv.hostname || inv.provider,
      name: svc.name || svc.code,
      ref: svc.code,
      region: inv.provider,
      plan: inv.spec ? `${inv.spec.cpus} CPU · ${inv.spec.ramGb} GB RAM` : null,
      publicUrl: svc.publicUrl ?? tool?.appUrl ?? tool?.localUrl,
      toolCodes: [svc.code],
      ...health,
      serviceKind: svc.kind,
      serviceStatus: (svc as { status?: string }).status,
    });
  }

  for (const extra of inv.extras ?? []) {
    const code = extra.toolCode;
    if (!code || seenCodes.has(code)) continue;
    seenCodes.add(code);
    const tool = toolByCode(tools, code);
    const health = rowHealth(tool);
    rows.push({
      id: `vps:extra:${extra.id}`,
      provider: "vps",
      providerLabel: deployLabel("vps"),
      hostSlug: inv.hostname || inv.provider,
      name: extra.name,
      ref: code,
      region: inv.provider,
      plan: extra.status ?? null,
      publicUrl: tool?.appUrl,
      toolCodes: [code],
      ...health,
      serviceKind: extra.kind,
      serviceStatus: extra.status,
      note: extra.note,
    });
  }

  for (const tool of tools) {
    if (tool.deployTarget !== "vps" || !tool.code || seenCodes.has(tool.code)) continue;
    const health = rowHealth(tool);
    rows.push({
      id: `vps:tool:${tool.id}`,
      provider: "vps",
      providerLabel: deployLabel("vps"),
      hostSlug: inv.hostname || inv.provider,
      name: tool.name,
      ref: tool.code,
      region: inv.provider,
      plan: "Catalog only",
      publicUrl: tool.appUrl ?? tool.localUrl,
      toolCodes: [tool.code],
      ...health,
      note: "On VPS deploy target but not listed in vps-inventory snapshot",
    });
  }

  return rows;
}

function buildVercelRows(tools: ResolvedTool[]): HostingDeployRow[] {
  const rows: HostingDeployRow[] = [];
  for (const tool of tools) {
    if (tool.deployTarget !== "vercel" && !tool.remote?.manifest?.vercel?.project) continue;
    const vercel = tool.remote?.manifest?.vercel;
    const health = rowHealth(tool);
    rows.push({
      id: `vercel:${tool.id}`,
      provider: "vercel",
      providerLabel: deployLabel("vercel"),
      hostSlug: vercel?.team?.trim() || "vercel",
      name: vercel?.project?.trim() || tool.name,
      ref: vercel?.projectId?.trim() || tool.code,
      region: vercel?.productionBranch ?? null,
      plan: vercel?.productionUrl ? "Production" : "Preview",
      publicUrl: vercel?.productionUrl ?? vercel?.previewUrl ?? tool.appUrl,
      toolCodes: [tool.code],
      ...health,
    });
  }
  return rows;
}

function buildOtherHostingRows(tools: ResolvedTool[]): HostingDeployRow[] {
  const rows: HostingDeployRow[] = [];
  for (const tool of tools) {
    const target = tool.deployTarget;
    if (!target || HOSTING_TARGETS.has(target) || target === "github-release") continue;
    const p = normalizeProvider(target);
    if (p === "other" && target !== "github-pages" && target !== "local") continue;
    const health = rowHealth(tool);
    rows.push({
      id: `host:${tool.id}`,
      provider: p,
      providerLabel: deployLabel(target),
      hostSlug: target,
      name: tool.name,
      ref: tool.code,
      region: tool.category,
      plan: tool.status,
      publicUrl: tool.appUrl ?? tool.localUrl,
      toolCodes: [tool.code],
      ...health,
    });
  }
  return rows;
}

/** Build hosting quota rows from workspace tools + VPS inventory snapshot. */
export function buildHostingDeployRows(tools: ResolvedTool[]): HostingDeployRow[] {
  const inv = inventory as VpsInventory;
  return [...buildVpsRows(tools, inv), ...buildVercelRows(tools), ...buildOtherHostingRows(tools)];
}

export function hostingRowsForQuotaTab(rows: HostingDeployRow[]): HostingDeployRow[] {
  return rows.filter((r) => r.provider === "vps" || r.provider === "vercel" || r.provider === "cloudflare");
}
