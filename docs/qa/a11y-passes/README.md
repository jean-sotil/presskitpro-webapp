# Manual Accessibility Pass Logs

PRD §11 / §19 require a manual screen-reader pass before each release.
Each release tag drops a dated markdown log here covering NVDA on
Windows + VoiceOver on macOS / iOS. Logs are short — they describe
what was tested, what worked, what didn't, and what was filed.

## File naming

```
<YYYY-MM>-task-<NN>.md      # one-off per-task pass (e.g. task-25 baseline)
<YYYY-MM>-release-<TAG>.md  # release-tag pass
```

## Format

```markdown
# <date> — <pass type>

**Driver:** NVDA <version> on Windows 11 / VoiceOver on macOS Sonoma 14.x
**Routes covered:** /, /pricing, /login, /signup, /onboarding/{1..5},
                    /dashboard, /dashboard/analytics,
                    /dashboard/profile/<id>, /<seeded-slug>

## Summary
- <one-sentence verdict>

## Findings
- [ ] <route> — <issue> — <severity> — <issue link or "fixed in commit X">

## Notes
- <anything worth knowing for the next pass>
```
