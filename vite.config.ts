import path from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import { loadEnv } from "vite";

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const hubUiRoot = path.resolve(toolRoot, "../../packages/hub-ui/src");
const hubIdentityRoot = path.resolve(toolRoot, "../../packages/hub-identity/src");
const hubLoadRoot = path.resolve(toolRoot, "vendor/hub-load/src");
const devRoot = path.resolve(toolRoot, "../..");

const require = createRequire(import.meta.url);

type DevMiddlewareFactory = (opts: { cwd: string; mode?: string; loadEnv?: typeof loadEnv }) => (
  req: unknown,
  res: unknown,
  next: () => void,
) => void;

function loadDevMiddleware(): {
  createSupabaseApiProxy: DevMiddlewareFactory;
  createQuotaMiddleware: DevMiddlewareFactory;
  createWorkspaceRefreshMiddleware: DevMiddlewareFactory;
} {
  try {
    return {
      createSupabaseApiProxy: require("./scripts/lib/supabase-api-proxy.cjs").createSupabaseApiProxy,
      createQuotaMiddleware: require("./scripts/lib/supabase-quota-fetch.cjs").createQuotaMiddleware,
      createWorkspaceRefreshMiddleware: require("./scripts/lib/workspace-refresh.cjs").createWorkspaceRefreshMiddleware,
    };
  } catch {
    const noop: DevMiddlewareFactory = () => () => {};
    return {
      createSupabaseApiProxy: noop,
      createQuotaMiddleware: noop,
      createWorkspaceRefreshMiddleware: noop,
    };
  }
}

const { createSupabaseApiProxy, createQuotaMiddleware, createWorkspaceRefreshMiddleware } =
  loadDevMiddleware();

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      {
        name: "supabase-management-api-proxy",
        configureServer(server) {
          server.middlewares.use(createWorkspaceRefreshMiddleware({ cwd: process.cwd() }));
          server.middlewares.use(
            require("./scripts/lib/agent-manifest-sync.cjs").createAgentManifestSyncMiddleware({
              cwd: process.cwd(),
            }),
          );
          server.middlewares.use(createSupabaseApiProxy({ mode, cwd: process.cwd(), loadEnv }));
          server.middlewares.use(createQuotaMiddleware({ cwd: process.cwd() }));
          server.middlewares.use(require("./scripts/lib/local-health-proxy.cjs").createLocalHealthMiddleware());
          server.middlewares.use(
            require("./scripts/lib/hub-dev-recover-proxy.cjs").createHubDevRecoverMiddleware(),
          );
          server.middlewares.use(
            require("./scripts/lib/hub-create-users-proxy.cjs").createHubCreateUsersMiddleware({
              cwd: process.cwd(),
              mode,
              loadEnv,
            }),
          );
          server.middlewares.use(
            require("./scripts/lib/legacy-public-gone.cjs").createLegacyPublicGoneMiddleware(
              path.join(toolRoot, "public"),
            ),
          );
        },
      },
    ],
    server: {
      host: "127.0.0.1",
      port: 5176,
      strictPort: true,
      fs: {
        allow: [toolRoot, hubUiRoot, hubIdentityRoot, hubLoadRoot, devRoot],
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "lucide-react"],
      exclude: ["@tool-workspace/hub-ui"],
      holdUntilCrawlEnd: false,
    },
    esbuild: {
      target: "es2022",
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@dev/hub-load": hubLoadRoot,
        "@tool-workspace/hub-ui": hubUiRoot,
        "@tool-workspace/hub-identity": hubIdentityRoot,
      },
    },
    test: {
      exclude: [...configDefaults.exclude, "scripts/**/*.test.cjs", "vendor/**"],
    },
  };
});
