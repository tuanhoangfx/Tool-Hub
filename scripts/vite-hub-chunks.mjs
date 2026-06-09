/**
 * Vite manualChunks strategy (vendored from Tool/scripts for standalone Vercel builds).
 */
export function createHubManualChunks(opts = {}) {
  const { features = {} } = opts;

  return function manualChunks(id) {
    if (id.includes("vendor/hub-ui") || id.includes("packages/hub-ui")) {
      return "vendor-hub-ui";
    }
    if (id.includes("vendor/hub-identity") || id.includes("packages/hub-identity")) {
      return "vendor-hub-identity";
    }
    if (id.includes("vendor/hub-load") || id.includes("packages/hub-load")) {
      return "vendor-hub-load";
    }

    for (const [chunkName, matcher] of Object.entries(features)) {
      if (typeof matcher === "string" && id.includes(matcher)) return chunkName;
      if (matcher instanceof RegExp && matcher.test(id)) return chunkName;
      if (typeof matcher === "function" && matcher(id)) return chunkName;
    }

    if (!id.includes("node_modules")) return;

    if (id.includes("@supabase")) return "vendor-supabase";
    if (id.includes("lucide-react")) return "vendor-icons";
    if (id.includes("otpauth")) return "vendor-otpauth";
    if (id.includes("xlsx")) return "vendor-xlsx";
    if (id.includes("react-dom") || /[/\\]react[/\\]/.test(id)) return "vendor-react";
  };
}
