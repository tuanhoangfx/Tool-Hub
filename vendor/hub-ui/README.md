# @tool-workspace/hub-ui

Shared Hub shell UI for P0004, P0020, and other workspace tools.

## Install (per app)

```json
"@tool-workspace/hub-ui": "file:../../../packages/hub-ui"
```

Vite alias (recommended):

```ts
resolve: {
  alias: {
    "@tool-workspace/hub-ui": path.resolve(__dirname, "../../packages/hub-ui/src"),
  },
},
```

## CSS

```css
@import "@tool-workspace/hub-ui/styles/hub-check-indicator.css";
```

## DisplayPrefs

Apps wrap `HubDisplayPrefs` with local `readPrefs` / `patchPrefs` (URL or router). See `Tool/P0004-Tool-Hub` and `Tool/P0020-Data-Box` `DisplayPrefs.tsx` adapters.
