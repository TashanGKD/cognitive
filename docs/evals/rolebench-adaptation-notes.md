# RoleBench adaptation notes

Date: 2026-05-12

Related scale reference in Chinese:
`docs/evals/benchmark-scale-reference.zh.md`.

## What Was Checked

- Paper: `RoleLLM: Benchmarking, Eliciting, and Enhancing Role-Playing Abilities of Large Language Models`, Findings ACL 2024.
- Repository: `InteractiveNLP-Team/RoleLLM-public`.
- Dataset: `ZenMoore/RoleBench` on Hugging Face.

RoleBench builds role-playing data through four stages: role profile
construction, Context-Instruct role-specific knowledge extraction, RoleGPT
speaking-style imitation, and role-conditioned instruction tuning. Its published
dataset covers 100 roles and 168,093 samples, with 23,463 instructions split
between general-purpose and role-specific instructions.

In the English RoleBench instruction files, `nums.jsonl` lists 95
role-specific files with 18,949 instructions, or 199.46 role-specific
instructions per role on average. The general-instruction pool contains 1500
global instructions. The public RoleBench role list does not contain the 15 Nuwa
example roles by name, so there are no same-role official questions to copy for
Steve Jobs, Richard Feynman, Elon Musk, Charlie Munger, and the other Nuwa
examples. The correct adaptation is therefore to reproduce RoleBench's
construction pattern and match the role-specific scale, not to claim direct
same-role reuse.

## Mapping Used Here

| RoleBench shape | cognitive seed mapping |
|---|---|
| General-purpose instructions customized into a role voice (`CUS`) | `rolebench_general_instruction`: 200 ordinary tasks per role, covering editing, classification, transformation, calculation, planning, analogy, and constrained generation. |
| Role-specific instructions from Context-Instruct (`SPE`) | `rolebench_role_specific`: 200 role-specific tasks per role, generated from evidence-derived themes for that role. |
| Role profile construction | Each side first builds a role artifact from the same Nuwa local evidence paths. |
| Speaking-style imitation | Judged through expression DNA and non-genericness, but task correctness remains required. |
| Role-specific knowledge / memory | Judged through role-specific knowledge, cognitive-model fidelity, evidence grounding, and expression DNA. |

## Current Nuwa All-Role Seed

- Roles: 15 Nuwa example roles.
- Tasks per role: 400.
- Total tasks: 6000.
- Per role balance: 200 CUS-style general instructions + 200 SPE-style
  role-specific prompts.

This is still a project benchmark, not a full reproduction of RoleBench's
168,093-sample scale. It is, however, materially closer to RoleBench than the
earlier 24-question and 48-question templates because every role now reaches
the roughly 200 role-specific-instruction scale observed in the English
RoleBench files, while also receiving a same-sized CUS-style general-instruction
surface for fair battle aggregation.
