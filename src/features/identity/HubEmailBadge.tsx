import { Mail } from "lucide-react";
import { CopyMetaChip, HUB_EMAIL_COPY_CHIP_CLASS } from "../../components/CopyMetaChip";

/** Email badge — 100% P0020 2FA Account chip (Mail + sky pill, click to copy). */
export function HubEmailBadge({ email, className = "" }: { email: string; className?: string }) {
  const value = email.trim();
  if (!value) {
    return <span className={`hub-users-cell-muted ${className}`.trim()}>—</span>;
  }

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      <CopyMetaChip
        icon={<Mail size={11} />}
        label={value}
        value={value}
        tone="cyan"
        title="Copy email"
        className={HUB_EMAIL_COPY_CHIP_CLASS}
        labelClassName="truncate text-left"
      />
    </div>
  );
}
