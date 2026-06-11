import { Tag } from "lucide-react";
import { formatTabHeaderTimestamp, type TabHeaderMetaItem } from "@tool-workspace/hub-ui";
import { APP_VERSION } from "./app-meta";

export { formatTabHeaderTimestamp };

/** Left rail meta after Session — matches Hub (`v4.x · hh:mm dd/mm/yy`). */
export function buildVersionMetaItems(releaseTimestamp: string): TabHeaderMetaItem[] {
  return [
    {
      icon: Tag,
      value: `v${APP_VERSION} · ${releaseTimestamp}`,
    },
  ];
}
