# Workspace Design Standard

This document defines the canonical structure and UI design standard for tools in the shared workspace.
Primary baseline reference: normalized layout/style specifications defined in this standard, independent of any single source project.

## Canonical shared artifacts

- Base CSS (design baseline): `E:\Dev\Rules\standards\workspace-design-base.css`
- Compact datetime field (full contract): `E:\Dev\Rules\standards\Datetime_Picker_Standard.md`
- Shared UI root (optional): `E:\Dev\Rules\shared-ui`
- Rules root: `E:\Dev\Rules`

## Scope of normalization

Normalization in this standard covers:

- Application shell layout
- Top section metrics/cards
- Primary data table header + filters + actions
- Table row density, action icons, and status visual language
- Right-panel Workflow/Run History/Console framing
- Modal sizing/alignment conventions

This is a **UI system contract**, not only a visual suggestion.

## Naming policy

- This standard is vendor/tool agnostic and must not be documented with product-specific naming.
- Existing class names containing `profile-*` are treated as backward-compatible aliases in legacy codebases.
- For new implementations, prefer neutral naming in component docs and UI labels (for example: `table`, `records`, `items`, `rows`).

## Structure standard (from the primary data table upward)

- **Shell split:** 6/4 panel rhythm (left data table, right workflow/runtime tools).
- **Top metrics row:** fixed 4-column grid, equal card height, icon-left/content-right composition.
- **Primary table header stack order (required):**
  1) title row (`table-header-top`)
  2) stats row (`table-header-stats`)
  3) filters row (`table-header-filters`)
  4) actions row (`table-header-actions`)
- **Header action button palette:** semantic and stable ordering (`Run`, `Close`, `New`, `Delete`).
- **Table action column:** normalized compact icon-buttons (`table-action-btn*`) reused across views.

## Table behavior + density standard

- Header row height: compact (`~34-36px`)
- Body row height: dense (`~42px`)
- Column heading style: icon + label, consistent color mapping by semantic column type. Header labels use sentence case (`text-transform: none`); do not default to all caps in table clones.
- **Semantic status/table cells:** Primary operational status columns (Drive Library metadata state, Profile/channel status in GPM Reference, comparable tables) render as **inline icon + plain text label** aligned with `.status` patterns in baseline CSS. Avoid capsule/pill chrome for those cells unless an exception is called out explicitly in screen-level notes.
- Plain identifier columns (`Group`, `ID`, comparable): match GPM Profile body cells — **plain text**, no capsule badge styling.
- No per-screen custom action-icon systems; reuse shared `table-action-*` classes.

### Row selection contract

- `row-select-table` defaults to Excel-style multi-select unless the screen explicitly documents `single-select`.
- Required gestures for multi-select tables:
  - Click: select one row.
  - `Ctrl/Cmd + Click`: add/remove a row from current selection.
  - `Shift + Click`: select contiguous range from last anchor row.
  - Mouse drag (press + sweep rows): extend contiguous range from anchor.
  - `Ctrl/Cmd + A`: select all rows in the current filtered dataset.
- Single-select tables (for example channel queue primary list) are exempt and must ignore additive/range gestures.
- Multi-select action bars must reflect current selected count and keep destructive actions disabled when selection is empty.
- Group management screens must use the same table grammar (`table-header-top`, filter row, `row-select-table`, shared action buttons) instead of ad-hoc list UIs.

## Table blueprint (clone template)

Use this structure when cloning a new table so layout and behavior stay consistent:

```tsx
<section className="shell">
  <header className="table-header-top">{/* title + counter */}</header>
  <div className="table-header-stats">{/* 4 metric cards */}</div>
  <div className="table-header-filters">{/* search + dropdowns */}</div>
  <div className="table-header-actions">{/* Run / Close / New / Delete */}</div>

  <div className="table-wrap">
    <table className="row-select-table">
      <thead>{/* table-col-head with icon + label */}</thead>
      <tbody>{/* data rows */}</tbody>
    </table>
  </div>

  <footer className="table-footer">{/* pagination + range + page size */}</footer>
</section>
```

Required class groups:

- Header stack: `table-header-top`, `table-header-stats`, `table-header-filters`, `table-header-actions`
- Column heading: `table-col-head`
- Action cell: `table-action-icons`, `table-action-btn`, `table-action-run/export/import/copy/reset/close`
- Density: `row-select-table`
- Scrolling container: `table-wrap`

## Required table states (state spec)

Every table clone must define visual/behavior handling for:

- `default`: normal rows and actions
- `hover`: row and action hover feedback
- `selected`: active row(s) with clear contrast
- `loading`: skeleton/spinner while data is pending
- `empty`: explicit empty-state row/panel
- `error`: fetch/runtime error state
- `disabled`: action buttons not available
- `sort`: `none | asc | desc` indicator on sortable columns
- `pagination`: first/prev/next/last + page size + row range text
- `focus`: keyboard-visible focus ring for interactive controls

Accessibility minimum:

- Action icon buttons must have `aria-label`
- Keyboard navigation must support `Tab` and `Enter/Space` on actionable controls
- Interactive elements must expose visible `:focus-visible`

## Filter/dropdown standard

Two sanctioned patterns:

1. **`SmartFilterDropdown`** (single value or multi with sentinel `value: "all"` in the options array): reuse for queues, pagination-size style controls, and any filter that toggles exclusively off a fixed `All` token.
2. **`MultiSelectDropdown` profile-style (primary table filters):** reference behavior for **Group + Status** (and equivalent dimension + status) on the primary records table. Contract:
   - Root classes: `smart-dropdown multi-select-dropdown` (plus `open` when expanded).
   - **Empty `values` array** means no restriction (show all rows). This replaces encoding `All` as a fake option value.
   - First row in the menu is an explicit **All** action that clears `values` to `[]` (checkmark when empty).
   - Other rows are multi-toggle; selected options show a check in the left zone.
   - Trigger label: show the filter name when nothing selected; single selection shows that option’s label; multiple selections show `N {summaryLabel}` (for example `3 groups`, `2 statuses`).
   - `defaultTone` on the trigger when empty (for example `group` for Group, `status` for Status).
   - Search field inside the menu; placeholder per filter (for example `Search groups…`).

Icon semantics (required for both patterns where applicable):

- **All** row: **globe-style global icon** (`Globe2` or equivalent mapped to `.dropdown-option-icon.all` in baseline CSS), not a generic list-filter glyph.
- **Group** (and other named buckets): `group` tone → layered/group icon; dynamic option values without a fixed semantic icon use **colored dots** (`dotTone` / `.dropdown-option-dot.*`) per baseline tokens.
- **Platform** (or second categorical dimension): `platform` tone → globe icon on the option row; dots for dynamic values as above.
- **Source** dimension (Local/Drive): `source` tone → drive/storage icon on trigger/header; option rows keep semantic `local`/`drive` icons.
- **Status** filter header tone: `status` → check-circle icon; enumerated status values use fixed tones **`ready` / `opening` / `running` / `failed`** so markers stay consistent between dropdown and table cells (`CheckCircle2`, `RefreshCw`, `Play`, `XCircle` per baseline).
- **Table-filter default trigger labels (`Status`, `Source`/`Platform`)** must follow table column heading style: neutral label text (same visual tone as `.table-col-head` text), semantic color on icon only.
- **Source semantics (required):** labels remain neutral text (`var(--text)`/default body color). Differentiate Local vs Drive by icon shape/color only; do not color the source label text.
- **Stream Config mode dropdowns** (Run mode, Publish mode, Source type via `SmartFilterDropdown`): apply the **same neutral-label rule** as Source for trigger + menu rows; semantic tone affects **icons only** (`.dropdown-option-icon.*`). Baseline MUST define `.dropdown-option-icon.scheduled` in the amber group with `opening` / `pending` / `partial` wherever Calendar/scheduling tones are reused.
- Option selected state must render a check icon in the selector column (not plain text glyphs).

Other shared rules:

- Reuse one of the two contracts above per table; do not invent a third ad-hoc filter menu per screen.
- Trigger fallback label must match the table column/filter name (for example: `Group`, `Status`, `Resolution`, `Platform`).
- Trigger: compact height (`32px`), right-aligned chevron, rotate on open.
- Menu: `top: calc(100% + 6px)`, padded container with search.
- Option row: two-zone layout (selector + label), compact density.
- Width policy (required):
  - Table filter rows: `180px` per dropdown column (`table-header-filters` pattern).
  - Config forms (source/run/schedule mode fields): `~190px` per mode dropdown.
  - Dropdown menu width must be adaptive (`max(100%, 180px)`) with capped max width (`~240px`) to avoid oversizing.
  - These values should be tokenized in CSS variables; avoid ad-hoc hardcoded widths.

## Compact datetime field (custom picker)

For any form that needs a **themed** local date + time value, use the **non-native** compact picker defined in **`Datetime_Picker_Standard.md`** (wire format `YYYY-MM-DDTHH:mm`, stable `schedule-datetime` / `schedule-dp-*` class registry, styles in `workspace-design-base.css`). Do not use `<input type="datetime-local">` when the product requires matching shell theming or consistent popover behavior in Electron/Chromium.

Reference React implementation: `E:\Dev\Tool\YT-Multistream-Console\src\components\ScheduleDatetimeField.tsx` (copy into new tools or extract a shared package).

## Pagination footer standard

- Pagination controls (`first/prev/page/next/last`) must be grouped inside a rounded, bordered cluster (`pagination-actions`) to preserve visual hierarchy across tables.
- `Rows per page` uses native `select` control in `pagination-meta` for table views aligned with GPM Profile pattern.
- Range text (`1-100 of N`) is optional and may be omitted when table already exposes total count in header/top summary.

## Typography and spacing

- Font stack: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Tokenized type scale:
  - `title-1`: `20px / 850`
  - `title-2`: `15px / 760`
  - `body`: `12px / 760`
  - `meta`: `11px / 700`
  - `caption`: `10px / 760`
- Tokenized spacing scale:
  - `space-1`: `4px`
  - `space-2`: `8px`
  - `space-3`: `12px`
  - `space-4`: `16px`

No ad-hoc spacing/typography values unless documented exception exists.

## Theming and platform tone

- Platform tone classes must exist for all mapped platforms in app logic.
- If code maps a platform class (example: `workflow-platform-higgsfield`), design baseline must include matching CSS token variables.
- Missing tone class is treated as design-contract drift and must be fixed in the same change.

## Tool generation boundaries

- Tools should import style primitives through canonical baseline path above.
- Avoid hard-coded absolute paths to app-specific files outside repository unless explicitly approved.
- If a standard references a file, the file must exist and be readable.

## Validation expectations

Tools/scripts may validate presence of:

- `E:\Dev\Rules\rules\Working_Rules.md`
- `E:\Dev\Rules\workspace.manifest.json`
- `E:\Dev\Rules\standards\Workspace_Design_Standard.md`
- `E:\Dev\Rules\standards\Datetime_Picker_Standard.md`
- `E:\Dev\Rules\standards\workspace-design-base.css`

When UI output diverges:
1) validate baseline artifacts and import paths,
2) validate component class mapping,
3) then adjust feature logic.

## Acceptance checklist (pass/fail)

Before marking a cloned table as standardized, confirm all checks pass:

- [ ] Header stack uses all 4 required rows in correct order
- [ ] Stats row is 4-column layout and cards keep equal visual height
- [ ] Table header/body density matches standard (`~34-36px` / `~42px`)
- [ ] Action column uses `table-action-btn*` classes (no custom button system)
- [ ] Column headings use icon + label (`table-col-head`)
- [ ] Loading/empty/error/disabled states are implemented
- [ ] Pagination controls and row range text are present
- [ ] Keyboard + focus-visible + aria-label behavior is verified
- [ ] Any mapped platform tone class exists in baseline CSS
- [ ] Dropdown parity verified against shared SmartFilterDropdown contract (trigger/menu/options/check icon/all-reset behavior)
- [ ] Dropdown fallback labels match filter names (`Group/Status/Platform`) and reset option uses `All`
- [ ] Screens that include a compact datetime field follow `Datetime_Picker_Standard.md` (classes + baseline CSS + no raw `datetime-local` when themed UX is required)

