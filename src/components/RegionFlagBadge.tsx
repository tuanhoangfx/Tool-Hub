import { resolveRegionMeta } from "../lib/supabase-region";

const FLAGCDN = "https://flagcdn.com";

export function flagCdnUrl(countryCode: string, width = 16, height = 12): string {
  const code = countryCode.trim().toLowerCase();
  if (!code || !/^[a-z]{2}$/.test(code)) return `${FLAGCDN}/${width}x${height}/un.png`;
  return `${FLAGCDN}/${width}x${height}/${code}.png`;
}

type RegionFlagBadgeProps = {
  region: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
};

/** PNG flag badge via flagcdn.com — same pattern as P0021 AutoVideo Studio. */
export function RegionFlagBadge({ region, size = "sm", className }: RegionFlagBadgeProps) {
  const meta = resolveRegionMeta(region);
  const dim = size === "md" ? "24x18" : "16x12";
  const [w, h] = dim.split("x").map(Number);
  const sizeClass = size === "md" ? "h-[18px] w-6" : "h-3 w-4";

  return (
    <span
      className={
        className ??
        `${sizeClass} shrink-0 overflow-hidden rounded-[2px] border border-white/10 bg-cover bg-center shadow-[0_0_0_1px_rgba(0,0,0,0.18)]`
      }
      style={{
        backgroundImage: meta.countryCode
          ? `url("${flagCdnUrl(meta.countryCode, w, h)}")`
          : `url("${flagCdnUrl("", w, h)}")`,
      }}
      title={meta.label}
      aria-label={meta.label}
    />
  );
}

type RegionInlineProps = {
  region: string | null | undefined;
  variant?: "full" | "short";
  className?: string;
};

export function RegionInline({ region, variant = "full", className }: RegionInlineProps) {
  const meta = resolveRegionMeta(region);
  if (meta.region === "—") return <span className={className}>—</span>;

  const text = variant === "short" ? meta.label : `${meta.region} · ${meta.label}`;

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className ?? ""}`}>
      <RegionFlagBadge region={region} />
      <span className="truncate">{text}</span>
    </span>
  );
}
