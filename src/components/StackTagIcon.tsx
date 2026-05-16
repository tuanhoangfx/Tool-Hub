import { useEffect, useState } from "react";
import { tagToTheSvgSlug, theSvgIconSources } from "../lib/thesvg";
import { MaterialIcon } from "./MaterialIcon";

type StackTagIconProps = {
  tag: string;
  size?: number;
};

export function StackTagIcon({ tag, size = 12 }: StackTagIconProps) {
  const slug = tagToTheSvgSlug(tag);
  const sources = slug ? theSvgIconSources(slug) : [];
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [tag, slug]);

  if (!slug || sourceIndex >= sources.length) {
    return <MaterialIcon name="label" size={size} />;
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
