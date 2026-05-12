# Evaluation scripts

This directory contains reproducible utilities for the `cognitive`
benchmark package.

| Script | Purpose |
|---|---|
| `build-nuwa-all-role-complete-seed.mjs` | Builds the 15-role, 6000-task Nuwa seed and evidence audit from a local `../nuwa-skill` checkout. |
| `build-nuwa-curated-role-seed.mjs` | Selects a high-signal 100-task-per-role benchmark from the 6000-task mother pool. |
| `build-profile-helper-cognitive-seed.mjs` | Builds the universal 50-item mounted-role questionnaire bank and the 15-role mounted seed. |
| `score-profile-helper-questionnaire-results.mjs` | Parses JSON scale answers from a profile-helper battle run and summarizes per-role scale profiles. |
| `run-cognitive-battle.mjs` | Single-contestant smoke runner for early task and prompt checks. |
| `run-cognitive-blind-battle.mjs` | Two-contestant blind battle runner for prompt-level comparisons. |
| `run-cognitive-two-stage-battle.mjs` | Fair Nuwa-vs-Tashan runner: both sides first build role artifacts from the same evidence, then answer the same tasks. |
| `generate-codex-mounted-all-nuwa-results.mjs` | Local Codex-mounted pilot generator used to preserve the 15-role trial outputs under `docs/evals/runs/`. |

Generated outputs belong under `docs/evals/runs/`, which is intentionally ignored
by Git. Promote only curated conclusions to `docs/evals/reports/`.
