# DNS — zone infi.io.vn (Tino)

Master map: `E:\Dev\Rules\DOMAIN-MIGRATION-infix1-to-infi.md`

## Vercel (A → 76.76.21.21)

| FQDN | Product |
|------|---------|
| `infi.io.vn` | P0004 Tool Hub |
| `www.infi.io.vn` | CNAME `cname.vercel-dns.com` |
| `store.infi.io.vn` | P0022 Infi Store |
| `databox.infi.io.vn` | P0020 Data Box |
| `p0021.infi.io.vn` | P0021 AutoVideo Studio |

Retired: ~~`fanpage.infi.io.vn`~~ — Fanpages on P0016 `chathub.infi.io.vn/fanpages` (DNS removed 2026-06-06).

## VPS (A → 103.82.25.231)

| FQDN | Product |
|------|---------|
| `zaloai.infi.io.vn` | P0016 Chat Center (interim console/API) |
| `chathub.infi.io.vn` | P0016 Chat Center — Fanpages + console |
| `9router.infi.io.vn` | P0007 9router |

## Tino steps

1. https://tino.vn/clientarea/domains — mở zone **infi.io.vn**
2. Tab **Quản lý DNS** → thêm/sửa bản ghi theo bảng trên
3. TTL 10 phút khi test; tăng sau khi ổn định

## Verify

```powershell
Resolve-DnsName infi.io.vn -Type A
Resolve-DnsName store.infi.io.vn -Type A
Resolve-DnsName databox.infi.io.vn -Type A
Resolve-DnsName chathub.infi.io.vn -Type A
```
