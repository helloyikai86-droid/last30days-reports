# Project instructions

This repository stores Chinese research reports generated from the installed `last30days` Skill.

When asked to create a report:

1. Read `REPORT_SPEC.md` completely.
2. Use the installed `last30days` Skill faithfully. Do not replace its search engine with an improvised web-only summary.
3. Before fresh research, search `reports/archive/` for related prior reports and read relevant matches.
4. Focus on deltas. If a previously covered item has no meaningful change, mention it in one sentence only.
5. Write the requested archive path exactly and never overwrite an existing archive report.
6. Write Chinese throughout except for product names, source titles, and URLs.
7. Keep original links next to every trend or opportunity. Never invent engagement evidence.
8. Never write secrets, browser cookies, tokens, session data, or environment-variable values into repository files.
9. Do not run git commit or git push from the agent. The wrapper script validates, commits, and pushes after generation.

Meaningful change includes accelerated stars/discussion, a major release, new monetization, financing/revenue/user data, important new functionality, movement from niche to mainstream, or a newly visible China localization opportunity.

## GitHub opportunity catalog contract

Every project that appears in a daily Top 10 must have one canonical, reusable detailed analysis in `docs/projects.json`. Repeated appearances reuse and, when evidence changes, update that same analysis; daily JSON files own only date-specific ranking and Star snapshots.

Before publishing catalog data, run:

```powershell
node scripts/sync-canonical-analysis.mjs --date YYYY-MM-DD
node scripts/validate-catalog-analysis.mjs
```

Publishing is blocked when any project is missing one of these fields: `overview`, `what_it_is`, `target_users`, `problem`, `past_solution`, `how_it_works`, `architecture`, `why_hot`, `difference`, `business`, `china_opportunity`, `beginner_guide`, `usage_scenarios`, `use_cases`, `risks`, `inspiration`, `judgment`, `full_analysis`. Placeholder text such as `历史日报恢复` is forbidden.

Every newly discovered project must set `analysis_quality_version: 2`. Explain required background and terms for a non-expert, provide at least three concrete usage scenarios in the form “who / situation / steps / result”, describe the workflow step by step, and write at least 900 Chinese characters of full analysis. Generic fallbacks and repeated text across overview, project description, and workflow fail validation and must be replaced by project-specific research before publishing.

