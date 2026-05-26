import { useEffect, useState } from "react";
import { compactIconSize } from "../lib/ui-scale";
import { tagToTheSvgSlug, theSvgIconSources } from "../lib/thesvg";

type StackTagIconProps = {
  tag: string;
  size?: number;
};

const PALETTE = ["#e56a4a","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899","#14b8a6","#f97316"];

function tagColor(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (Math.imul(31, h) + tag.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function StackTagIcon({ tag, size = compactIconSize(12) }: StackTagIconProps) {
  const slug = tagToTheSvgSlug(tag);
  const sources = slug ? theSvgIconSources(slug) : [];
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [tag, slug]);

  if (!slug || sourceIndex >= sources.length) {
    return (
      <span
        className="tag-icon-initial"
        style={{ width: size, height: size, background: tagColor(tag), fontSize: Math.max(6, Math.floor(size * 0.65)) }}
        aria-hidden="true"
      >
        {tag.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className="stack-tag-icon"
      src={sources[sourceIndex]}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}
