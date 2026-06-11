# Workspace tool codes (`E:\Dev\Tool`)



Mã **P00xx** là duy nhất trong workspace. Tên folder = `{code}-{slug}`.



| Code | Folder | GitHub repo | Ghi chú |

|------|--------|-------------|---------|

| P0001 | P0001-GPM-Automation-Console | tuanhoangfx/GPM-Automation-Console | Desktop GPM |

| P0002 | P0002-YT-Multistream-Console | tuanhoangfx/YT-Multistream-Console | Desktop YT |

| P0004 | P0004-Tool-Hub | tuanhoangfx/Tool-Hub | **Tool Hub** — catalog |

| P0007 | P0007-9router-infra | tuanhoangfx/9router-infra | Infra |

| P0008 | P0008-Sales-Console | tuanhoangfx/Sales-Console | Sales |

| P0009 | P0009-Mie-Hair-Performance | tuanhoangfx/P0009-Mie-Hair-Performance | Web app |

| P0011 | P0011-Infix1-Mail | tuanhoangfx/P0011-Infix1-Mail | **Infix1 Mail** — CF Workers Plan 1 webmail (`infix1.io.vn`) |

| P0012 | P0012-Apps-Script-Sync | tuanhoangfx/Apps-Script-Sync | clasp monorepo |

| P0013 | P0013-czp-youtube-tda-team | tuanhoangfx/P0001-czp-youtube-tda-team | YouTube TDA |

| P0015 | P0015-student-id-generator-v2 | tuanhoangfx/P0005-student-id-generator-v2 | Static HTML generator |

| P0019 | P0019-Work-Performance | tuanhoangfx/-Work-Performance | Infi task manager |

| P0020 | P0020-Data-Box | tuanhoangfx/Tool-Manager | **Tool Manager** — https://tool-manager-zeta.vercel.app |

| P0021 | P0021-AutoVideo-Studio | tuanhoangfx/AutoVideo-Studio | **AutoVideo Studio** — auto-gen video (script→ảnh→voice→MP4) |

| P0022 | P0022-Infi-Store | tuanhoangfx/P0022-Infi-Store | **Infi Store** — e-commerce showcase (AuraTech) |

| P0023 | P0023-Fanpage-Dashboard | tuanhoangfx/P0023-Fanpage-Dashboard | **Fanpage Dashboard** — Facebook Graph API metrics & posts |



| P0016 | P0016-ChatCenter | tuanhoangfx/chat-center | **Chat Center** — monorepo console :5186 + worker :3921 (Zalo/Messenger/Telegram) |

**Mã tiếp theo:** P0025



**P0005 / P0006 (retired 2026-06):** Zalo bot → **P0016-ChatCenter** (self-contained monorepo, v1.1.0+). Code `P0005`/`P0006` không còn folder local.

**P0014 / P0017 / P0018 / P0024 (2026-06-05):** Đã gỡ folder local Hub Shell (:5184), ChatHubAI clones và AI Project Manager. Hub UI: **P0004**; chat platform: **P0016-ChatCenter**.

**P0011 (2026-06-04):** Tái sử dụng mã cho **Infix1 Mail** (thay Tool-Control-Center đã gỡ 2026-05-22).



**Clone bỏ qua** (`workspace.roots.json → clone.exclude`): repo archived / đã gỡ.



Quét catalog: `cd P0004-Tool-Hub && corepack pnpm scan:local`

