/** Slug overrides for tags that do not match theSVG icon ids. See https://thesvg.org/icon/{slug} */
const TAG_SLUG_MAP: Record<string, string> = {
  react: "react",
  typescript: "typescript",
  vite: "vite",
  javascript: "javascript",
  js: "javascript",
  "node.js": "npm",
  nodejs: "npm",
  node: "npm",
  github: "github",
  "github pages": "github",
  "github public raw api": "github",
  electron: "electron",
  ffmpeg: "ffmpeg",
  youtube: "youtube",
  zalo: "zalo",
  "zca-js": "javascript",
  pnpm: "pnpm",
  docker: "docker",
  java: "java",
  "gpm api": "google",
};

function slugifyTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function tagToTheSvgSlug(tag: string): string | null {
  const key = tag.trim().toLowerCase();
  if (TAG_SLUG_MAP[key]) return TAG_SLUG_MAP[key];
  const slug = slugifyTag(tag);
  return slug.length >= 2 ? slug : null;
}

/** SVG file served by theSVG (icon page: https://thesvg.org/icon/{slug}) */
export function theSvgIconUrl(slug: string) {
  return `https://thesvg.org/icons/${slug}/default.svg`;
}
