import { useEffect, useState } from "react";
import { tagToTheSvgSlug, theSvgIconUrl } from "../lib/thesvg";
import { MaterialIcon } from "./MaterialIcon";

type StackTagIconProps = {
  tag: string;
  size?: number;
};

export function StackTagIcon({ tag, size = 12 }: StackTagIconProps) {
  const slug = tagToTheSvgSlug(tag);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [tag, slug]);

  if (!slug || failed) {
    return <MaterialIcon name="label" size={size} />;
  }

  return (
    <img
      className="stack-tag-icon"
      src={theSvgIconUrl(slug)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
