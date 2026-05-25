import { ToolVersionsPanel } from "../../../overview/ToolVersionsPanel";
import { MOCK_VERSION_HISTORY } from "./mock";

export const TOOL_VERSION_VARIANT_MAP = {
  V1: {
    Component: function HistoryPreview() {
      return (
        <ToolVersionsPanel
          rows={MOCK_VERSION_HISTORY}
          tool={{ code: "P0001-preview", localPath: "E:\\Dev\\Tool\\P0001-GPM-Automation-Console", branch: "main" }}
          canonicalVersion="0.2.34"
        />
      );
    },
    title: "Version history",
    lang: "One row per version · Loc/Pkg/Mnf/GH/CL columns",
  },
} as const;
