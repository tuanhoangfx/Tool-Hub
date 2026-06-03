import type { ReactNode } from "react";
import { AppTabHeader } from "../../components/sales-shell/AppTabHeader";
import { readSystemTab, SYSTEM_TAB_ITEMS } from "./components/SystemTabs";

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
  const tab = readSystemTab();
  const item = SYSTEM_TAB_ITEMS.find((row) => row.id === tab) ?? SYSTEM_TAB_ITEMS[0];
  const Icon = item.icon;
  const metaItems =
    tab === "template"
      ? [{ icon: Icon, value: "5 layouts · pick V1–V5 below" }]
      : tab === "server"
        ? [{ icon: Icon, value: "CloudFly VPS · P0006 / P0007 inventory" }]
        : tab === "agent"
          ? [{ icon: Icon, value: "Read-only · workspace rules & skills" }]
          : [];

  return (
    <AppTabHeader
      ariaLabel={`${item.label} header`}
      titleIcon={Icon}
      titleIconClass="text-violet-400"
      title={item.label}
      pinSticky={pinSticky}
      dividerBelow={dividerBelow}
      embedded={embedded}
      metaItems={metaItems}
      centerStats={[]}
      actions={actions}
    />
  );
}
