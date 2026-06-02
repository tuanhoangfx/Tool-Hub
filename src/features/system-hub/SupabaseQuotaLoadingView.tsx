import { SystemTabLoadingView, type SystemTabLoadingViewProps } from "./SystemTabLoadingView";

type SupabaseQuotaLoadingViewProps = Pick<SystemTabLoadingViewProps, "variant">;

export function SupabaseQuotaLoadingView({ variant = "full" }: SupabaseQuotaLoadingViewProps) {
  return <SystemTabLoadingView tab="supabase-quota" variant={variant} />;
}
