# Design Decision — Hub Tool Card

**Date:** 2026-05-24  
**Locked:** V4 Quiet badges + V3 Status dot (avatar)

## Production

`src/features/hub/HubToolCard.tsx`

## Included

- Tint meta icons (~72% opacity)
- Quiet badge chips with colored dots (Ready, drift, link gap, online port)
- 8px health dot on avatar: red (drift) → amber (link gaps) → green (port online) → slate (default)

## Excluded

- Bento / rail / spectrum layouts
- Soft accent top border (V5)
- Baseline grey-only icons (V1)
