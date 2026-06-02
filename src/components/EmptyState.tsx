import { MaterialIcon } from "./MaterialIcon";
import { compactIconSize } from "../lib/ui-scale";

export type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "No results",
  description = "Try adjusting filters or refresh the data source.",
}: EmptyStateProps) {
  return (
    <aside className="detail-panel empty">
      <MaterialIcon name="search_off" size={compactIconSize(28)} />
      <h2>{title}</h2>
      <p>{description}</p>
    </aside>
  );
}
