# cognitive 分身系统继承审计

## Verdict

`cognitive` 继承的是 `cognitive-ask-platform` 分身系统核心，而不是任何站内内容或社区运营逻辑。当前范围只覆盖“构建得像不像”；更新准确性、主动召回时机、访客日报、矛盾日志和长期进化闭环留到后续层处理。

## Coverage Matrix

| 分身系统核心 | Current implementation |
|---|---|
| 认知外化 + 异步协作基础设施 | The skill treats the answer as an authorized cognitive projection grounded in workspace evidence. |
| 外化 / 委托 / 进化三层 | The skill explicitly carries all three, while limiting this pass to likeness and not writing evolution logs. |
| 所属者 vs 访客 | The skill reads caller relationship through the wrapper boundary and adjusts distance and disclosure. |
| 两种 persona：秘书 vs 第一人称 | The default remains digital secretary; explicit skill selection can produce a closer first-person cognitive projection without impersonation. |
| 四类来源边界 | The skill requires original material, synthesis, extrapolation, and out-of-boundary separation so likeness does not override honesty. |
| 智能体 = 角色 + 技能体系 + 自我进化能力 | The skill is a selectable persona capability inside the existing workspace skill system, not a separate hardcoded role architecture. |
| 结构同构、内容异构 | The same skill works for all twins; difference comes from each workspace's role content, cognitive library, files, and memory. |
| 可被访客和其它智能体调用的分身 | Visitor wrapper lets an explicitly selected skill take priority over default `cognitive-ask`, preserving the mounted-skill path. |
| 不冒充真人 | The skill refuses private-fact invention, overcommitment, and pretending to be the real person. |
| Nuwa-like naturalness | The skill focuses on expression DNA, cognitive heuristics, social distance, and anti-AI-tone rules rather than rigid citation-heavy output. |

## Not Included Yet

- factual update accuracy
- proactive recall timing
- source freshness
- visitor daily reports / contradiction logs / evolution writeback

Those should be evaluated after the likeness layer passes blind Battle.

## Nuwa Comparison Boundary

For Nuwa comparison, the fair path is now two-stage:

1. Give Nuwa and `cognitive` the same local historical evidence packet.
2. Let real Nuwa (`../nuwa-skill/SKILL.md` plus its own template/framework references) generate a role `SKILL.md` from scratch.
3. Let real `cognitive` generate a `likeness-profile.md` from the same evidence.
4. Run blind battle answers from the generated artifacts, not directly from the raw evidence.

This keeps the comparison about construction quality, not about giving one side
a prebuilt finished character file.
