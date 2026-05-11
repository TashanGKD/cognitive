# cognitive skill

This repository is the standalone cognitive Skill package for digital-twin
construction. Its current first module is `cognitive`: a role-likeness
skill that distills a person, role, or expert persona from an evidence packet
into a mounted conversation profile, then answers as an authorized cognitive
projection without claiming to be the real person.

This repository was split out from `TashanGKD/cognitive-ask-platform` so the
platform repository can stay clean while the likeness skill, evaluation assets,
and Nuwa comparison work evolve independently.

## What Is Included

| Path | Purpose |
|---|---|
| `skills/cognitive/` | Main OpenClaw / workspace skill package. |
| `skills-weixin/cognitive/` | Weixin-facing copy with the same contract. |
| `docs/evals/` | RoleBench-inspired benchmark protocol, seeds, evidence audit, and summary report. |
| `scripts/evals/` | Reproducible seed builders and battle runners. |
| `docs/skill-evolution/` | Inheritance audit: what was migrated from the original digital-twin system. |
| `integrations/cognitive-ask-platform/` | Optional patch and test file for wiring this skill back into `cognitive-ask-platform`. |

Generated answers, dry-run JSON, PDFs, and temporary images are intentionally not
tracked. They belong under `docs/evals/runs/`, `tmp/`, or `output/`.

## Skill Scope

The current scope is likeness construction:

- evidence-grounded role profile construction
- expression DNA and speaking-style compression
- decision heuristics and cognitive-model fidelity
- owner / visitor boundary handling
- source-boundary discipline
- repair loop when the role does not feel right

It intentionally does not cover fact freshness, proactive recall timing,
long-term evolution writeback, visitor daily reports, or contradiction logs.

## Benchmark Framing

The Nuwa comparison follows a RoleBench-inspired shape:

1. Use the same local evidence for both systems.
2. Build a role artifact first.
3. Answer the same role-complete task set from the generated artifact.
4. Score not just global preference, but style, cognition, boundaries, and
   non-genericness.
5. Preserve generated artifacts and raw answers for later blind review.

Current pilot result:

| Scope | Nuwa wins | Tashan wins | Ties |
|---|---:|---:|---:|
| 15 Nuwa example roles, 360 tasks | 157 | 130 | 73 |

Treat this as a Codex-mounted pilot, not a third-party formal benchmark.

## Run Locally

Place Nuwa beside this repository:

```powershell
cd D:\数字分身
git clone https://github.com/alchaincyf/nuwa-skill.git nuwa-skill
```

Build the all-role seed:

```powershell
cd D:\数字分身\cognitive
npm run eval:build-nuwa-seed
```

Run a dry-run prompt assembly:

```powershell
npm run eval:two-stage:dry-run -- --tasks=docs/evals/nuwa-role-complete-seed.json --roles="Richard Feynman" --limit=1
```

## Integrate Back Into cognitive-ask-platform

From a clean `cognitive-ask-platform` checkout:

```powershell
Copy-Item -Recurse ..\cognitive\skills\cognitive api-server\templates\empty-twin\workspace\skills\cognitive
Copy-Item -Recurse ..\cognitive\skills-weixin\cognitive api-server\templates\empty-twin\workspace\skills-weixin\cognitive
git apply ..\cognitive\integrations\cognitive-ask-platform\platform-wiring.patch
Copy-Item ..\cognitive\integrations\cognitive-ask-platform\cognitive-eval.test.ts api-server\tests\cognitive-eval.test.ts
```

Then run the platform checks from `cognitive-ask-platform`:

```powershell
cd api-server
npm test -- --run tests/cognitive-eval.test.ts
npm run lint
```
