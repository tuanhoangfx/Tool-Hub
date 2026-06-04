# CHANGELOG Entry Template

Use for **every** version bump (Patch / Minor / Major) in `Tool/P00xx-*` and `Extension/E00xx-*`.

**Prepend** at top of `CHANGELOG.md` (below the `# Changelog` title). One block per bump.

**Forbidden:** title-only entries like "Git commit version stamp" with empty or generic Changes.

```markdown
## YYYY-MM-DD - Short title (what changed)

- Version: `x.y.z`
- Type: Patch | Minor | Major
- Product: P0004
- Prompt: One-line summary of the user task / request for this bump
- Commit: pending
- Status: Draft
- Release: (after Release keyword only — GitHub release URL)

### Changes

- Specific bullet: feature, file, or behavior changed
- Another concrete change

### Verification

- `corepack pnpm build` — passed
- Browser: http://127.0.0.1:5176/ — smoke OK (if UI)

### Rollback

```powershell
cd E:\Dev\Tool\<Tool-Name>
git checkout vX.Y.Z
# or after commit: git revert <commit_hash>
```
```

## After Git (commit)

1. Run: `powershell -File E:\Dev\Tool\scripts\stamp-changelog-commit.ps1`
2. If `CHANGELOG.md` changed: `git add CHANGELOG.md && git commit --amend --no-edit` (only if not pushed)
3. Commit message: `{CODE} v{x.y.z}: {short title}`

## After Release

- Set `Status: Verified`
- Set `Release: https://github.com/.../releases/tag/vx.y.z`
- Copy top entry into `gh release create --notes`

Rule: `.cursor/rules/dev-workspace-compact.mdc` §0
