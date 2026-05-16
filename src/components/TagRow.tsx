import { StackTagIcon } from "./StackTagIcon";

type TagRowProps = {
  tags: string[];
  limit?: number;
  iconSize?: number;
};

export function TagRow({ tags, limit, iconSize = 12 }: TagRowProps) {
  const shown = limit ? tags.slice(0, limit) : tags;
  if (!shown.length) return null;

  return (
    <div className="tag-row">
      {shown.map((tag) => (
        <span key={tag}>
          <StackTagIcon tag={tag} size={iconSize} />
          {tag}
        </span>
      ))}
    </div>
  );
}
