# Auth gate — design decision

**Locked:** Golden **V2** (modal-only · 3 tabs · header chip).

**Production components (hub-ui):**

- `HubAuthGateModal` — `auth-gate-panel--modal` (**30rem**), backdrop blur **8px**, tabs Sign In / Sign Up / **Anonymous**
- `HubAuthGate` — opens modal directly (no prompt overlay)
- `HubAuthLogoutChip` — header User tab: email + LogOut icon
- `HubAuthGateGoldenPreview` — Design Template live reference
- `formatHubAuthToolInfo` — modal subtitle = `P00xx · Name — tagline`

**Removed after V2 lock:** `HubAuthPrompt` flow, `auth-waiting` prompt (E0001), Offline mode label → **Anonymous**.

**Consumers:** P0004 (2 tabs, non-dismissible), P0020 (3 tabs + Anonymous), P0016, E0001 extension.

**Preview:** P0004 System → Design Template · `packages/hub-ui/examples/GoldenAuthGateScreen.tsx`
