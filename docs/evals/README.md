# cognitive evaluation package

This directory contains the clean, reviewable benchmark materials for the
`cognitive` digital-twin skill. Generated run outputs are intentionally
kept out of Git under `docs/evals/runs/`.

## What To Commit

| Path | Purpose |
|---|---|
| `cognitive-blind-battle.md` | Evaluation protocol, rubric, RoleBench-inspired task shape, and runner notes. |
| `nuwa-all-role-complete-seed.json` | Full Nuwa example-role seed: 15 roles, 24 tasks per role, 360 tasks total. |
| `nuwa-all-role-evidence-audit.md` | Evidence-count audit proving every role is built from local Nuwa references. |
| `rolebench-role-complete-seed.json` | Public RoleBench-style seed for small controlled pilots. |
| `reports/nuwa-vs-tashan-bench-summary.md` | Leadership-facing summary of the current Nuwa vs Tashan result and product read. |
| `../../scripts/evals/` | Reproducible seed builders and benchmark runners. |

## What Not To Commit

`docs/evals/runs/` contains generated answers, generated role artifacts, dry-run
prompts, model-call fragments, and trial reports. Keep it local unless a specific
run is intentionally promoted into `reports/`.

`tmp/` and `output/` contain generated PDFs, rendered pages, and one-off report
assets. They are reproducible and are ignored by Git.

## Current Scope

The benchmark measures whether a constructed role feels like the target role in
complex cognition and natural dialogue. It intentionally does not evaluate:

- fact freshness
- proactive recall timing
- long-term evolution writeback
- visitor daily reports or contradiction logs

Those belong to later digital-twin layers after the likeness layer is stable.
