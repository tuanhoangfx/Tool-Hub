import { BookOpen, Command, GitBranch, Layers, ShieldCheck, Sparkles, SquareStack, Zap } from "lucide-react";
import {
  HubBulkActionButton,
  compactIconSize,
} from "@tool-workspace/hub-ui";

import { AGENT_KEYWORD_PRESETS } from "./agent-context-filter-defs";

type Props = {
  hasSelection: boolean;
  selectedCount: number;
  onOpenSelected: () => void;
  onApplyPreset: (preset: (typeof AGENT_KEYWORD_PRESETS)[keyof typeof AGENT_KEYWORD_PRESETS]) => void;
  onOnboarding: () => void;
  onOpenSkillsCatalog?: () => void;
};

/** Golden row-2 actions — selection bulk + keyword filter presets (not toolbar row 1). */
export function AgentContextDirectoryBulkActions({
  hasSelection,
  selectedCount,
  onOpenSelected,
  onApplyPreset,
  onOnboarding,
  onOpenSkillsCatalog,
}: Props) {
  return (
    <>
      <HubBulkActionButton
        icon={<SquareStack size={14} aria-hidden />}
        label="Open selected"
        title="Open detail for the first selected item"
        tone="indigo"
        disabled={!hasSelection}
        selectedCount={hasSelection ? selectedCount : undefined}
        onClick={onOpenSelected}
      />
      <HubBulkActionButton
        icon={<BookOpen size={14} aria-hidden />}
        label="Onboarding"
        title="Keyword guide + infra stack + 5 core skills"
        tone="emerald"
        onClick={onOnboarding}
      />
      {onOpenSkillsCatalog ? (
        <HubBulkActionButton
          icon={<Sparkles size={14} aria-hidden />}
          label="Skills catalog"
          title="UI skills registry from ui-patterns.catalog.json"
          tone="amber"
          onClick={onOpenSkillsCatalog}
        />
      ) : null}
      <HubBulkActionButton
        icon={<Command size={compactIconSize(14)} aria-hidden />}
        label="Keywords"
        title="All 16 ship/pattern keywords"
        tone="neutral"
        onClick={() => onApplyPreset(AGENT_KEYWORD_PRESETS.allKeywords)}
      />
      <HubBulkActionButton
        icon={<GitBranch size={compactIconSize(14)} aria-hidden />}
        label="Git"
        title="Git · Push · Deploy · Release"
        tone="neutral"
        onClick={() => onApplyPreset(AGENT_KEYWORD_PRESETS.git)}
      />
      <HubBulkActionButton
        icon={<ShieldCheck size={14} aria-hidden />}
        label="Verify"
        title="Ship · Loop · Fix · Smoke"
        tone="neutral"
        onClick={() => onApplyPreset(AGENT_KEYWORD_PRESETS.verify)}
      />
      <HubBulkActionButton
        icon={<Layers size={14} aria-hidden />}
        label="Pattern"
        title="Directory · Inbox · Dashboard · …"
        tone="neutral"
        onClick={() => onApplyPreset(AGENT_KEYWORD_PRESETS.pattern)}
      />
      <HubBulkActionButton
        icon={<Zap size={compactIconSize(14)} aria-hidden />}
        label="Supabase"
        title="Migrate P00xx"
        tone="neutral"
        onClick={() => onApplyPreset(AGENT_KEYWORD_PRESETS.supabase)}
      />
    </>
  );
}
