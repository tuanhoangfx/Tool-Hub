# Tino DNS — infi.io.vn → Vercel (P0004)

## Vercel (bắt buộc)

| Loại | Host | Giá trị |
|------|------|---------|
| **A** | `@` (apex) | `76.76.21.21` |

Xóa các bản ghi **A** apex trỏ `185.199.x.x` (GitHub Pages) hoặc `216.198.79.1` (cũ).

## Tino (sau đăng nhập)

1. https://tino.vn/clientarea/domains
2. Mở **infi.io.vn** (ID thường: `/clientarea/domains/801146`)
3. Tab **Quản lý DNS**
4. **Chỉnh sửa** bản ghi **A** `@` → `76.76.21.21` (TTL 300–3600)
5. Lưu — đợi propagate (5–60 phút)

## Kiểm tra

```powershell
Resolve-DnsName infi.io.vn -Type A
# Phải thấy 76.76.21.21

(Invoke-WebRequest -Uri "https://infi.io.vn/?tab=system" -UseBasicParsing).Headers.Server
# Phải là Vercel
```

Vercel Domains: https://vercel.com/tuanhoangfxs-projects/tool-hub/settings/domains
