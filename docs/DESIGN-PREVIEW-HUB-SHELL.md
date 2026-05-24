# Tool Hub — Hub Shell Design Preview

## Mở preview

Dev: **http://127.0.0.1:5176/?screen=system&stab=template&dtpl=hub-shell&hsdesign=V1**

Sidebar → **System** → tab **Design Template** → chọn **Hub Shell**.

## 5 phương án (V1–V5)

| ID | Tên | Hướng thiết kế |
|----|-----|----------------|
| **V1** | Unified Sidebar | P0020 H1 — sidebar indigo tối, nav icon, main rộng (workspace hub) |
| **V2** | Classic macOS | Traffic lights + sidebar mỏng — **production hiện tại** |
| **V3** | Search-first | ⌘K trung tâm, chrome tối thiểu, kết quả instant |
| **V4** | Top Nav Tabs | Không sidebar — tab ngang + content full-width |
| **V5** | Bento Dashboard | Home bento metrics + library section cuộn |

## Chốt design

Trả lời trong chat: `Design: V1` (hoặc V2–V5, hoặc merge ý tưởng).

Sau khi chốt mới promote variant vào `App.tsx` production — Design Template giữ làm thư viện tham chiếu.

## Code

- Mock: `src/features/system-hub/design-template/hub-shell/`
- Registry: `src/features/system-hub/design-template/templates.ts`
