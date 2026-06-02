import { RegistryMetricBadge } from "../../../components/sales-shell/MetricBadge";
import { resolveAgentKindBadge, resolveAgentScopeBadge } from "../../../lib/badge-registry";
import type { AgentContextItem, AgentContextKind } from "./types";

export function AgentKindBadge({
  kind,
  className = "",
}: {
  kind: AgentContextKind;
  className?: string;
}) {
  return <RegistryMetricBadge spec={resolveAgentKindBadge(kind)} className={className} />;
}

export function AgentScopeBadge({
  scope,
  className = "",
}: {
  scope: AgentContextItem["scope"];
  className?: string;
}) {
  return <RegistryMetricBadge spec={resolveAgentScopeBadge(scope)} className={className} />;
}
