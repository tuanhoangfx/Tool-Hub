import {
  pinHubDirectoryIds,
  readHubDirectoryPinnedIds,
  toggleHubDirectoryPinnedId,
} from "@tool-workspace/hub-ui";

const SCOPE = "dashboard-screens" as const;

export function readPinnedScreenIds(): Set<string> {
  return readHubDirectoryPinnedIds(SCOPE);
}

export function togglePinnedScreenId(id: string): Set<string> {
  return toggleHubDirectoryPinnedId(SCOPE, id);
}

export function pinScreenIds(ids: Iterable<string>): Set<string> {
  return pinHubDirectoryIds(SCOPE, ids);
}
