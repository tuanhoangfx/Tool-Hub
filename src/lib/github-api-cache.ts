import { createMemoFetch, createMemoFetchClear } from "@dev/hub-load";

const FILE_CACHE_TTL_MS = 5 * 60 * 1000;
const API_CACHE_TTL_MS = 5 * 60 * 1000;

export const memoFetchRawFile = createMemoFetch({
  prefix: "p0004:github:raw",
  ttlMs: FILE_CACHE_TTL_MS,
});

export const memoFetchGitHubApi = createMemoFetch({
  prefix: "p0004:github:api",
  ttlMs: API_CACHE_TTL_MS,
});

export const clearGitHubApiCache = createMemoFetchClear("p0004:github:raw");

export function clearCache() {
  clearGitHubApiCache();
  createMemoFetchClear("p0004:github:api")();
}
