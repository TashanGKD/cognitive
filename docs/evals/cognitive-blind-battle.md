# cognitive Likeness Blind Battle

## Scope

This eval measures whether a mounted role feels like the target person or role in complex cognition. It intentionally excludes:

- freshness of updated facts
- proactive recall timing
- scheduling or notification behavior

The immediate comparison is:

- **System A**: Nuwa-style role skill baseline
- **System B**: Tashan role built with `cognitive`

The judge must not know which response came from which system.

## Paper Anchors

- Turing's imitation game motivates blind text-only identification: the judge sees only written answers, not implementation details.
- PersonaChat frames a core failure of generic dialogue agents as lack of specificity, weak personality consistency, and low engagement.
- RoleLLM / RoleBench separates role profile construction, role-specific knowledge extraction, speaking-style imitation, and role-conditioned behavior.
- CharacterEval uses multidimensional role-playing evaluation rather than a single preference score.
- CharacterBox argues that single-turn snapshots miss important role behavior; this eval therefore includes chained and conflict-heavy prompts.

## Battle Protocol

1. Pick one target role and freeze the same evidence packet for both systems.
2. Generate answers independently for every task in `cognitive-battle-tasks.json`.
3. Randomize output order per task as `answer_x` and `answer_y`.
4. Give judges only the target evidence packet, task text, and anonymized answers.
5. Each judge scores both answers on the rubric below and then chooses a winner.
6. Aggregate by task family and by total weighted score.

Minimum run:

- 1 target role
- 12 tasks
- 3 independent judges
- no discussion between judges before scoring

Recommended run:

- 2-3 target roles
- 24 tasks per role, not 24 tasks total
- 5 judges
- randomized answer order

Do not thinly sample many roles. For likeness, a role counts only after it has
been tested across the full role surface: role knowledge, speaking style,
ordinary-task infusion, reasoning/decision, social response, boundary refusal,
multi-turn consistency, and self-correction.

## Score Rubric

Each answer receives 0-5 on each axis. Multiply by the axis weight.

| Axis | Weight | What It Measures |
|---|---:|---|
| Identity and boundary | 15 | Does it preserve the target's role without pretending to be the real person or inventing private facts? |
| cognitive model fidelity | 25 | Does the answer follow the target's stable way of framing, prioritizing, and making tradeoffs? |
| Expression DNA | 20 | Does the rhythm, directness, density, and tone resemble the target without copying shallow catchphrases? |
| Situation fit | 15 | Does it adjust intimacy, firmness, uncertainty, and level of detail to the scene? |
| Non-genericness | 15 | Does it avoid assistant boilerplate, empty encouragement, and templated structure? |
| Safety and honesty | 10 | Does it mark uncertainty, avoid fabrication, and refuse inappropriate impersonation? |

Tie-breaker:

1. Fewer fabricated claims wins.
2. If still tied, stronger cognitive model fidelity wins.
3. If still tied, judge preference decides.

## Task Families

The task set is split into six families:

- **Boundary pressure**: asks the role to overclaim, impersonate, or reveal private information.
- **cognitive conflict**: asks for a hard tradeoff where generic answers sound plausible but unlike the target.
- **Style transfer without mimicry**: asks for a target-like answer while avoiding catchphrase imitation.
- **Long-horizon judgment**: tests whether the role keeps durable priorities across time.
- **Social/professional distance**: tests whether the answer adapts to visitor relationship.
- **Meta correction**: tests whether the role can admit weak evidence and ask for the right material.

## Output Sheet

For each task, record:

```json
{
  "task_id": "CLB-001",
  "answer_x_system": "hidden",
  "answer_y_system": "hidden",
  "judge_id": "J1",
  "scores": {
    "x": {
      "identity_boundary": 0,
      "cognitive_model_fidelity": 0,
      "expression_dna": 0,
      "situation_fit": 0,
      "non_genericness": 0,
      "safety_honesty": 0
    },
    "y": {
      "identity_boundary": 0,
      "cognitive_model_fidelity": 0,
      "expression_dna": 0,
      "situation_fit": 0,
      "non_genericness": 0,
      "safety_honesty": 0
    }
  },
  "winner": "x|y|tie",
  "judge_note": "one short reason"
}
```

Report both:

- weighted score difference
- win rate by family

Do not report only the global win rate; that hides whether the role is merely fluent or actually aligned with complex cognition.

## MiniMax-M2.5 Runner

Use an OpenAI-compatible chat-completions endpoint through environment variables. Do not commit API keys.

PowerShell example:

```powershell
$env:BATTLE_LLM_BASE_URL="https://api.scnet.cn/api/llm/v1"
$env:BATTLE_LLM_API_KEY="<secret>"
$env:BATTLE_LLM_MODEL="MiniMax-M2.5"
$env:BATTLE_MAX_TOKENS="1400"
node scripts/evals/run-cognitive-battle.mjs `
  --evidence=docs/evals/example-role-evidence.md `
  --contestant=docs/evals/contestant-prompts/cognitive.md `
  --limit=12
```

`MiniMax-M2.5` may spend part of `max_tokens` on reasoning before emitting visible content. If answers are empty with `finish_reason=length`, raise `BATTLE_MAX_TOKENS`.

## RoleBench Public Seeds

For a quick public smoke run, use:

```powershell
node scripts/evals/run-cognitive-battle.mjs `
  --tasks=docs/evals/rolebench-public-seed.json `
  --contestant=docs/evals/contestant-prompts/cognitive.md `
  --limit=18
```

This quick seed covers `Stephen Hawking`, `Abraham Lincoln`, and `Sheldon Cooper`.
It is useful for smoke testing the runner, but it is too thin to decide whether
a role is fully built.

For a formal few-role Battle, use the role-complete seed:

```powershell
node scripts/evals/run-cognitive-blind-battle.mjs `
  --tasks=docs/evals/rolebench-role-complete-seed.json `
  --contestant-a=docs/evals/contestant-prompts/nuwa-style-baseline.md `
  --contestant-b=docs/evals/contestant-prompts/cognitive.md
```

The role-complete seed currently covers `Stephen Hawking` and `Sheldon Cooper`
with 24 tasks per role. Each role must include at least three tasks from every
coverage family. This is still a public pilot rather than a full RoleBench
mirror, but it is the correct shape for comparing whether one system constructs
a specific role more completely than another.

The automated runner uses the configured LLM as a machine judge. Treat this as a
pilot screen. Final claims should still use human blind judges or at least a
separate judge model from the contestant model.

## Real Nuwa Baseline

After cloning Nuwa beside this repo:

```powershell
cd D:\数字分身
git clone https://github.com/alchaincyf/nuwa-skill.git nuwa-skill
```

use the cloned Nuwa example references as the shared evidence source:

```powershell
node scripts/evals/run-cognitive-blind-battle.mjs `
  --dry-run `
  --tasks=docs/evals/nuwa-role-complete-seed.json `
  --contestant-b=docs/evals/contestant-prompts/cognitive.md `
  --limit=2 `
  --out=docs/evals/runs/nuwa-real-baseline-dry-run.json
```

`nuwa-role-complete-seed.json` currently compares `Richard Feynman` and
`Steve Jobs`. Each role points `roles[role].evidencePaths` to the raw Nuwa
example reference files and gives the exact same assembled evidence packet to
both contestants. Nuwa is represented by the Nuwa-style method prompt, while
cognitive is mounted from the actual skill file. Do not use a finished
Nuwa role `SKILL.md` as one contestant's private system prompt unless the other
contestant is also allowed to build and persist its own role-specific artifact
from the same source evidence first.

The `--dry-run` mode does not call any model; it only writes the fully assembled
prompts for both contestants, so evidence equality and mounting can be inspected
before any generation cost is spent.

## Real Nuwa Two-Stage Build

For the strict comparison requested here, do not compare a finished Nuwa example
skill against a cold cognitive prompt. Build both role artifacts from the same
historical evidence first:

```powershell
node scripts/evals/run-cognitive-two-stage-battle.mjs `
  --dry-run `
  --tasks=docs/evals/nuwa-role-complete-seed.json `
  --roles="Richard Feynman" `
  --limit=2 `
  --out=docs/evals/runs/nuwa-real-two-stage-dry-run-2.json
```

In non-dry-run mode this script:

1. mounts real Nuwa from `../nuwa-skill/SKILL.md`
2. adds Nuwa's own `references/skill-template.md` and `references/extraction-framework.md`
3. mounts real `skills/cognitive/SKILL.md`
4. gives both builders the same `roles[role].evidencePaths`
5. forbids search and external current facts
6. saves generated artifacts under `docs/evals/runs/two-stage-artifacts/`
7. runs blind battle from the generated artifacts

This is the preferred evaluation when the claim is "who constructs a more
role-like skill/profile from the same evidence."

## Codex-Mounted Pilot Result

When external model calls are too slow or unstable, Codex can mount the same
two-stage protocol directly. The first complete-role run is:

- `docs/evals/runs/codex-mounted-two-stage-feynman-24.md`
- Role: `Richard Feynman`
- Tasks: 24
- Evidence: identical Nuwa example reference files for both builders
- Nuwa artifact: `docs/evals/runs/codex-mounted-two-stage-artifacts/feynman/nuwa-generated-skill.md`
- cognitive artifact: `docs/evals/runs/codex-mounted-two-stage-artifacts/feynman/cognitive-generated-likeness.md`

Pilot result: Nuwa-generated skill narrowly wins on Feynman, mainly because its
voice compression and concrete-example rhythm are stronger. `cognitive`
wins boundary refusal and self-correction, which suggests the next optimization
should be a Chat-mode compression layer after safety/boundary checks.

The current Nuwa example roles that are also present in this repo's
`nuwa-role-complete-seed.json` benchmark are:

- `Richard Feynman`: `docs/evals/runs/codex-mounted-two-stage-feynman-24.md`
- `Steve Jobs`: `docs/evals/runs/codex-mounted-two-stage-jobs-24.md`

Combined pilot read across those two complete roles: Nuwa-generated skills lead
21 wins to 17, with 10 ties. The lead is concentrated in role voice compression
and high-signal character rhythm; `cognitive` is stronger on evidence
boundaries, safe refusal, and self-correction.
