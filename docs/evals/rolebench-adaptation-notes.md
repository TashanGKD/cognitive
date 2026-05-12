# RoleBench adaptation notes

Date: 2026-05-12

## What Was Checked

- Paper: `RoleLLM: Benchmarking, Eliciting, and Enhancing Role-Playing Abilities of Large Language Models`, Findings ACL 2024.
- Repository: `InteractiveNLP-Team/RoleLLM-public`.
- Dataset: `ZenMoore/RoleBench` on Hugging Face.

RoleBench builds role-playing data through four stages: role profile
construction, Context-Instruct role-specific knowledge extraction, RoleGPT
speaking-style imitation, and role-conditioned instruction tuning. Its published
dataset covers 100 roles and 168,093 samples, with 23,463 instructions split
between general-purpose and role-specific instructions.

The public RoleBench role list does not contain the 15 Nuwa example roles by
name, so there are no same-role official questions to copy for Steve Jobs,
Richard Feynman, Elon Musk, Charlie Munger, and the other Nuwa examples. The
correct adaptation is therefore to reproduce RoleBench's construction pattern,
not to claim direct same-role reuse.

## Mapping Used Here

| RoleBench shape | cognitive seed mapping |
|---|---|
| General-purpose instructions customized into a role voice (`CUS`) | `rolebench_general_instruction`: 24 ordinary tasks per role, covering editing, classification, transformation, calculation, planning, analogy, and constrained generation. |
| Role-specific instructions from Context-Instruct (`SPE`) | `rolebench_role_specific`: 24 role-specific tasks per role, generated from six evidence-derived themes for that role. |
| Role profile construction | Each side first builds a role artifact from the same Nuwa local evidence paths. |
| Speaking-style imitation | Judged through expression DNA and non-genericness, but task correctness remains required. |
| Role-specific knowledge / memory | Judged through role-specific knowledge, cognitive-model fidelity, evidence grounding, and expression DNA. |

## Current Nuwa All-Role Seed

- Roles: 15 Nuwa example roles.
- Tasks per role: 48.
- Total tasks: 720.
- Per role balance: 24 CUS-style general instructions + 24 SPE-style
  role-specific prompts.

This is still a project benchmark, not a full reproduction of RoleBench's
168,093-sample scale. It is, however, materially closer to RoleBench than the
earlier 24-question generic template because every role now has a dedicated
role-specific surface in addition to ordinary instruction following.
