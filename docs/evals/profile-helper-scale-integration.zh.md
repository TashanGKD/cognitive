# tashan-profile-helper 量表接入 cognitive 评测

日期：2026-05-13

来源仓库：https://github.com/TashanGKD/tashan-profile-helper

结论：可以接入，但应定义为“认知指纹层”，而不是完整的临床或智力认知测验。该仓库的量表更适合回答：一个数字分身在思考方式、动机结构、人格底盘上是否像目标对象。

## 仓库中可用的量表

| 模块 | 文件 | 题量 | 测量对象 | 对 cognitive 的价值 |
|---|---|---:|---|---|
| RCSS 科研人员认知风格量表 | `doc/researcher-cognitive-style.md` | 8 | 横向整合 vs 垂直深度 | 最直接可用。可测“系统整合型”还是“垂直深钻型”的认知风格 |
| AMS-GSR 学术动机量表 | `doc/academic-motivation-scale.md` | 28 | 求知、成就、体验刺激、认同、内摄、外部、无动机 | 测角色为何行动，补足“像不像”中的动机解释 |
| Mini-IPIP 大五人格 | `doc/mini-ipip-scale.md` | 20 | 外向、宜人、尽责、神经质、开放/智力 | 测表达和互动底色，不直接等于认知能力 |
| MWMS 多维工作动机量表 | `doc/multidimensional-work-motivation-scale.md` | 19 | 工作中的自主/受控/无动机 | 更适合职场或产品型分身；科研角色优先用 AMS-GSR |
| 画像模板 | `profiles/_template.md` | - | 基础身份、能力、当前需求、认知风格、动机、人格 | 可直接作为 cognitive role profile 的结构参考 |

## 如何用于数字分身“像不像”

建议把它变成四个评分面：

| 评分面 | 来源 | 用途 |
|---|---|---|
| 认知风格一致性 | RCSS 的 I、D、CSI | 判断回答是否体现目标角色的整合/深钻倾向 |
| 动机一致性 | AMS-GSR 或 MWMS | 判断回答背后的行动理由是否像目标角色 |
| 人格一致性 | Mini-IPIP | 判断表达、冲突处理、互动姿态是否像目标角色 |
| 能力/场景一致性 | profile helper 的基础身份与能力维度 | 判断回答是否落在目标角色真实能力边界内 |

这四面不替代 RoleBench-shaped 角色专属题，而是给每道题增加一个“认知指纹判分层”。也就是说，同一道回答可以同时看：

1. 任务是否完成；
2. 事实是否越界；
3. 语言是否像；
4. 认知指纹是否像。

## 对现有 15 个 Nuwa 示例角色的用法

对历史人物、公众人物、虚构角色不能直接让本人填量表，因此使用“证据蒸馏评分”：

1. 从同一份角色证据中给目标角色生成量表画像；
2. 每个维度标注 `evidence-derived` 和置信度；
3. Nuwa 与 cognitive 都基于同一画像作答；
4. 裁判按回答是否符合目标量表画像打分。

示例：

| 角色 | RCSS 预期 | 动机预期 | 人格预期 |
|---|---|---|---|
| Richard Feynman | 高整合 + 高深度，CSI 可能接近平衡但双高 | 求知与体验刺激高 | 开放性高，表达外向，低模板化 |
| Steve Jobs | 高整合，偏产品端到端 | 成就/认同驱动高 | 高开放、高控制感、低容忍平庸 |
| Charlie Munger | 高深度 + 高系统整合 | 认同调节强，外部奖励弱 | 低浮夸，高审慎，强逆向判断 |
| Karpathy | 高整合 + 工程深度 | 求知/成就双高 | 开放、清晰、教学倾向强 |

这些不是心理诊断，而是用于 battle 的角色相似度锚点。

## 题量口径澄清

`tashan-profile-helper` 本身不是一个 50 题量表。它包含多套量表：

- RCSS：8 题；
- AMS-GSR：28 题；
- Mini-IPIP：20 题；
- MWMS：19 题。

当前 cognitive 中的“50 题”是我们基于这些量表维度抽象出的**通用认知指纹题组**，不是原始心理测量量表。它的用法是：同一套 50 个通用题干，对每个目标角色分别挂载作答；裁判再根据该角色的证据蒸馏认知指纹评分。因此它是通用题库，不是为某一个角色单独写的题。

每一道题现在都是量表化回答，而不是开放问答：

```json
{"score": 1-7 或 1-5, "reason": "一句角色内理由"}
```

评估时分两层：

1. 单题层：看 `reason` 是否符合角色证据、语气和边界；
2. 总体层：把 `score` 聚合成 RCSS、动机、Mini-IPIP、情境判断、互动表达画像，再看整体画像是否符合该角色的证据蒸馏指纹。

## 建议的新增题量

| 层级 | 每角色新增题量 | 内容 |
|---|---:|---|
| 轻量认知指纹 | 30 | 8 RCSS 风格题 + 10 动机题 + 12 人格/互动题 |
| 标准认知指纹 | 50 | 8 RCSS + 16 动机 + 16 人格 + 10 情境判断 |
| 强认知指纹 | 80 | 完整 RCSS + Mini-IPIP + 动机短版 + 情境判断 |

当前最合适的是“标准认知指纹”：每角色 50 题。它可以和现有 100 题/角色 curated set 并行，形成：

- 100 题 RoleBench-shaped 角色任务；
- 50 题 profile-helper-shaped 认知指纹任务；
- 合计 150 题/角色的强评测版本。

当前已生成的可执行评测资产：

- `docs/evals/profile-helper-generic-cognitive-question-bank-50.json`
- `docs/evals/profile-helper-cognitive-fingerprint-50-seed.json`
- `docs/evals/profile-helper-cognitive-fingerprint-50-report.md`
- 生成脚本：`scripts/evals/build-profile-helper-cognitive-seed.mjs`
- 结果汇总脚本：`scripts/evals/score-profile-helper-questionnaire-results.mjs`
- npm 命令：`npm run eval:build-profile-helper`
- 汇总命令：`npm run eval:score-profile-helper -- --run=<battle-run.json>`

## 接入注意

- RCSS 是项目内构建的科研认知风格量表，适合内部产品评测；对外报告应写成“内部认知风格量表”，不要声称已有大规模信效度验证。
- Mini-IPIP 的来源更成熟，适合放入对外说明。
- AMS-GSR 是基于 AMS 改编的科研版，适合研究生/科研人员，不一定适合所有公众人物；非科研角色可换 MWMS 或只保留动机短题。
- 对真实用户可以自填量表；对公众角色只能做证据推断，并保留置信度。
- 所有量表结果只能用于相似度评估，不用于心理诊断、招聘筛选或医学结论。
