import { lazy, Suspense, type ReactNode } from "react";
import { HubLoadingView } from "@tool-workspace/hub-ui";
import { Settings } from "lucide-react";

const SystemOverviewPanel = lazy(() =>
  import("./SystemOverviewPanel").then((m) => ({ default: m.SystemOverviewPanel })),
);
const SystemSchemaPanel = lazy(() =>
  import("./SystemSchemaPanel").then((m) => ({ default: m.SystemSchemaPanel })),
);
const SystemSupabaseQuotaPanel = lazy(() =>
  import("./SystemSupabaseQuotaPanel").then((m) => ({ default: m.SystemSupabaseQuotaPanel })),
);
const SystemServerPanel = lazy(() =>
  import("./SystemServerPanel").then((m) => ({ default: m.SystemServerPanel })),
);
const SystemAgentContextPanel = lazy(() =>
  import("./SystemAgentContextPanel").then((m) => ({ default: m.SystemAgentContextPanel })),
);
const DesignTemplateHub = lazy(() =>
  import("./design-template/DesignTemplateHub").then((m) => ({ default: m.DesignTemplateHub })),
);

function PanelFallback() {
  return (
    <div className="flex min-h-[12rem] items-center justify-center">
      <HubLoadingView icon={Settings} ariaLabel="Loading panel" variant="overlay" enabled />
    </div>
  );
}

export function LazySystemOverviewPanel(props: React.ComponentProps<typeof SystemOverviewPanel>) {
  return (
    <Suspense fallback={<PanelFallback />}>
      <SystemOverviewPanel {...props} />
    </Suspense>
  );
}

export function LazySystemSchemaPanel() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <SystemSchemaPanel />
    </Suspense>
  );
}

export function LazySystemSupabaseQuotaPanel() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <SystemSupabaseQuotaPanel />
    </Suspense>
  );
}

export function LazySystemServerPanel(props: React.ComponentProps<typeof SystemServerPanel>) {
  return (
    <Suspense fallback={<PanelFallback />}>
      <SystemServerPanel {...props} />
    </Suspense>
  );
}

export function LazySystemAgentContextPanel() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <SystemAgentContextPanel />
    </Suspense>
  );
}

export function LazyDesignTemplateHub() {
  return (
    <Suspense fallback={<PanelFallback />}>
      <DesignTemplateHub />
    </Suspense>
  );
}

export function SystemPanelSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PanelFallback />}>{children}</Suspense>;
}
