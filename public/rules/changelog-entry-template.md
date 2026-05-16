# RELEASE Entry Template

```markdown
## YYYY-MM-DD - Update Title

- Version: `x.y.z`
- Timestamp: YYYY-MM-DD HH:mm (UTC+7)
- Commit: pending
- Type: Feature | Fix | UI | Automation | Docs | Metadata
- Status: Verified
- Release: https://github.com/<owner>/<repo>/releases/tag/vx.y.z

### Changes

- ...
- ...

### Verification

- `corepack pnpm build`
- Result: passed

### Rollback

```powershell
cd E:\Dev\Tool\<Tool-Name>
git revert <commit_hash>
```
```
