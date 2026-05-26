import { MaterialIcon } from "./MaterialIcon";
import { compactIconSize } from "../lib/ui-scale";

export function EmptyState() {
  return (
    <aside className="detail-panel empty">
      <MaterialIcon name="search_off" size={compactIconSize(28)} />
      <h2>Trong</h2>
      <p>Doi bo loc hoac them repo</p>
    </aside>
  );
}
