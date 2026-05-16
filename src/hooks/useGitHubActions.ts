import { useState } from "react";
import { countOkFiles, formatDate } from "../lib/tooling";
import { createDraftRelease, createGitHubIssue, createVersionSyncPullRequest } from "../services/github";
import type { ResolvedTool } from "../types";

export function useGitHubActions(selectedTool: ResolvedTool | undefined) {
  const [githubToken, setGithubToken] = useState(() => sessionStorage.getItem("github-tool-manager.token") ?? "");
  const [actionStatus, setActionStatus] = useState("");

  function saveToken(value: string) {
    setGithubToken(value);
    if (value) sessionStorage.setItem("github-tool-manager.token", value);
    else sessionStorage.removeItem("github-tool-manager.token");
  }

  async function copyAdminSummary(tool: ResolvedTool) {
    const lines = [
      `${tool.name} (${tool.repo})`,
      `Version: ${tool.version}`,
      `Health: ${tool.healthLabel}`,
      `Files: ${countOkFiles(tool.remote?.files)}`,
      `Updated: ${formatDate(tool.updatedAt)}`,
      "Suggestions:",
      ...tool.suggestions.map((item) => `- ${item}`),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setActionStatus("Da copy repo summary.");
  }

  async function createIssueForSelected() {
    if (!selectedTool || !githubToken) return;
    setActionStatus("Dang tao GitHub issue...");
    const result = await createGitHubIssue(
      selectedTool,
      githubToken,
      `[Tool Manager] Review ${selectedTool.name}`,
      selectedTool.suggestions.map((item) => `- ${item}`).join("\n"),
    );
    setActionStatus(result.ok ? `Da tao issue: ${result.data?.html_url}` : `Issue failed: ${result.error}`);
  }

  async function createDraftReleaseForSelected() {
    if (!selectedTool || !githubToken) return;
    setActionStatus("Dang tao draft release...");
    const result = await createDraftRelease(
      selectedTool,
      githubToken,
      selectedTool.version,
      [`Automated draft from GitHub Tool Manager.`, "", "Checks:", ...selectedTool.suggestions.map((item) => `- ${item}`)].join("\n"),
    );
    setActionStatus(result.ok ? `Da tao draft release: ${result.data?.html_url}` : `Release failed: ${result.error}`);
  }

  async function createVersionSyncPrForSelected() {
    if (!selectedTool || !githubToken) return;
    setActionStatus("Dang tao version sync PR...");
    const result = await createVersionSyncPullRequest(selectedTool, githubToken, selectedTool.version, selectedTool.remote);
    setActionStatus(result.ok ? `Da tao draft PR: ${result.data?.html_url}` : `Version sync PR failed: ${result.error}`);
  }

  return {
    githubToken,
    actionStatus,
    saveToken,
    setActionStatus,
    copyAdminSummary,
    createIssueForSelected,
    createDraftReleaseForSelected,
    createVersionSyncPrForSelected,
  };
}
