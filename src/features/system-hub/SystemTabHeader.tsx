import { Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { AppTabHeader } from "../../components/sales-shell/AppTabHeader";

type SystemTabHeaderProps = {
  pinSticky?: boolean;
  dividerBelow?: boolean;
  embedded?: boolean;
  actions?: ReactNode;
};

export function SystemTabHeader({
  pinSticky = true,
  dividerBelow = true,
  embedded = false,
  actions,
}: SystemTabHeaderProps) {
  return (
    <AppTabHeader
      ariaLabel="System header"
      titleIcon={Settings2}
      titleIconClass="text-violet-400"
      title="System"
      pinSticky={pinSticky}
      dividerBelow={dividerBelow}
      embedded={embedded}
      metaItems={[]}
      centerStats={[]}
      actions={actions}
    />
  );
}
