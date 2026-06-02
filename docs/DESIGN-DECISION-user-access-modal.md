# Design decision: User & tool access modal

**Locked:** V1 — Hub tool-detail modal + left TOC  
**Production:** `features/identity/UserAccessModal.tsx`

## Chosen layout (V1)

- Portal modal: `modal-shell--tool-detail` (same shell as tool detail in System)
- Left TOC: User · Tool access · Legacy projects · Summary
- Tool access section: `FilterBar` + table (Links panel pattern)
- Filters: search, **Access** (granted / not granted), **Category** (faceted counts)
- Admin: implicit all tools; manager view-only; admin edits grants via Save

## Removed after lock

- `user-access-modal-mock.tsx`
- Design Template registry entry (`design-registry.ts` → empty)

## Filter standard

See `docs/FILTER-BAR-PANEL.md` and rule `p0004-filter-hub-contract.mdc` — embedded tables use the same contract as **Links** (`ToolLinksPanel`).
