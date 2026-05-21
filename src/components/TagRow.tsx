import { StackTagIcon } from "./StackTagIcon";
import { Tooltip } from "./Tooltip";

type TagRowProps = {
  tags: string[];
  limit?: number;
  iconSize?: number;
};

export function TagRow({ tags, limit, iconSize = 12 }: TagRowProps) {
  const shown = limit ? tags.slice(0, limit) : tags;
  const remaining = tags.length - shown.length;
  if (!shown.length) return null;

  return (
    <div className="tag-row">
      {shown.map((tag) => (
        <span key={tag}>
          <StackTagIcon tag={tag} size={iconSize} />
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <Tooltip title={`${remaining} more`} lines={tags.slice(shown.length)} align="end">
          <span className="tag-more">+{remaining}</span>
        </Tooltip>
      )}
    </div>
  );
}
