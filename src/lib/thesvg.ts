/** Slug overrides — catalog pages: https://thesvg.org/icon/{slug} */
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
  "9router": "openrouter",
  "9 router": "openrouter",
  openrouter: "openrouter",
  automation: "github-actions",
  "admin ui": "material-ui",
  "admin panel": "material-ui",
  dashboard: "material-ui",
  local: "github",
  workspace: "github",
  custom: "github",
  // playwright variants
  playwright: "playwright",
  "playwright cdp": "playwright",
  // frontend frameworks & tools
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "tailwind": "tailwindcss",
  tailwindcss: "tailwindcss",
  supabase: "supabase",
  // infra
  nginx: "nginx",
  bash: "bash",
  shell: "bash",
  linux: "linux",
  ubuntu: "ubuntu",
  // other common
  python: "python",
  rust: "rust",
  go: "go",
  vue: "vue",
  svelte: "svelte",
  astro: "astro",
  prisma: "prisma",
  redis: "redis",
  postgresql: "postgresql",
  postgres: "postgresql",
  mongodb: "mongodb",
  mysql: "mysql",
  graphql: "graphql",
  trpc: "trpc",
  "drizzle": "drizzle",
};

const LOCAL_ICON_SLUGS = new Set([
  "react",
  "typescript",
  "vite",
  "javascript",
  "npm",
  "github",
  "github-actions",
  "electron",
  "ffmpeg",
  "youtube",
  "zalo",
  "pnpm",
  "docker",
  "java",
  "google",
  "openrouter",
  "openai",
  "material-ui",
  "mui",
  "vercel",
  "microsoft",
  "figma",
  "playwright",
]);

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

/** Bundled copy under /icons/ (see scripts/sync-thesvg-icons.cjs) */
export function theSvgLocalIconUrl(slug: string) {
  return `/icons/${slug}.svg`;
}

/** Remote fallback from theSVG CDN */
export function theSvgRemoteIconUrl(slug: string) {
  return `https://thesvg.org/icons/${slug}/default.svg`;
}

export function theSvgIconSources(slug: string) {
  const sources: string[] = [];
  if (LOCAL_ICON_SLUGS.has(slug)) {
    sources.push(theSvgLocalIconUrl(slug));
  }
  sources.push(theSvgRemoteIconUrl(slug));
  return sources;
}
