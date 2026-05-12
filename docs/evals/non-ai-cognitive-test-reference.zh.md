# 非 AI 认知与人格测试参考

日期：2026-05-13

本文记录可迁移到 cognitive 数字分身评测的非 AI 测试。这里的“认知测试”不按医学诊断理解，而按“能否形成角色认知指纹”理解：人格、价值观、决策偏好、风险态度、社会认知、解释风格和道德判断。

## 推荐优先接入

| 测试/量表 | 常见题量 | 测什么 | 适合 cognitive 的用法 | 注意 |
|---|---:|---|---|---|
| Big Five / BFI-2 | 60；短版 30；超短版 15 | 五大人格：开放性、尽责性、外向性、宜人性、神经质 | 作为角色稳定人格向量，比较“角色卡预期画像”和模型回答画像 | 适合补充一致性，不足以单独判断“像不像” |
| HEXACO | 100；短版 60 | 诚实-谦逊、情绪性、外向性、宜人性、尽责性、开放性 | 比 Big Five 多一个 honesty-humility 维度，适合测商业人物、公众人物的价值边界 | 需要避免把量表结果当真实人格诊断 |
| IPIP item pool | 多套开放题库 | 开放人格题项池，可映射 Big Five/HEXACO 等 | 适合做开源、可复刻的“人格一致性”题库 | 需要自行选题和校准，不是单一标准测试 |
| Moral Foundations Questionnaire | 30 | 关怀、公平、忠诚、权威、圣洁等道德基础 | 适合测角色在伦理冲突、组织忠诚、风险代价上的判断轮廓 | 对学术/产品人物可用；对虚构角色也可用 |
| Schwartz / PVQ 价值观问卷 | 常见 40；也有短版 | 自我超越、保守、开放变化、自我提升等价值结构 | 适合判断角色“为什么做选择”，补齐单纯语气模仿不足 | 题目需要角色化改写，避免机械问卷感 |
| Need for Cognition | 常见 18 | 是否享受复杂思考、推理和认知努力 | 适合区分 Feynman、Munger、Karpathy 这类认知型角色 | 对娱乐型角色作用较弱 |
| Cognitive Reflection Test | 3；扩展版更多 | 直觉冲动 vs 反思推理 | 可作为小型决策风格探针，观察角色是否会先反问、建模、校验 | 经典 3 题太短且容易被记忆污染，只适合辅助 |
| Interpersonal Reactivity Index | 28 | 共情：观点采择、同情关怀、个人痛苦、想象 | 适合测陪伴型、导师型、创作者型角色的互动风格 | 不宜用于要求“真实情感能力”的结论 |
| Reading the Mind in the Eyes Test | 36 | 通过眼部线索判断他人心理状态 | 可借鉴为社会认知维度，但文本分身里更适合改造成“读场景意图”题 | 原始图片题不适合纯文本直接复用 |
| Situational Judgment Test | 不固定 | 情境判断、优先级、职业行为 | 最适合产品化：把角色放进真实冲突情境，看决策是否像该角色 | 需要为每个角色构建标准答案或偏好锚点 |

## 可作为认知任务补充

| 任务 | 常见形式 | 可测能力 | 在角色评测中的价值 |
|---|---|---|---|
| Stroop task | 颜色词干扰 | 抑制控制、自动反应控制 | 对文本生成模型价值有限，可改造成“冲突信息下是否稳住角色原则” |
| Trail Making Test | 连线切换 | 注意、切换、执行功能 | 临床筛查味道重，不建议直接作为数字分身主评测 |
| Iowa Gambling Task | 风险-收益决策 | 长期收益、风险学习 | 可改造成商业/投资/创业角色的连续决策题 |
| Balloon Analogue Risk Task | 气球风险任务 | 风险偏好 | 可转成“逐步加码还是收手”的文本情境题 |
| Remote Associates Test | 三词联想 | 创造性联想 | 可测角色是否用自己的知识结构产生关联，而不是泛泛联想 |

## 不建议作为主评测

| 测试 | 原因 |
|---|---|
| MMSE | 医学认知筛查，版权/授权口径复杂，目标是认知障碍筛查，不是角色相似度 |
| MoCA | 医学筛查属性强，存在授权要求；不适合拿来评价数字分身“像不像” |
| Raven's Progressive Matrices | 非语言智力测验，版权/授权限制明显；更测抽象推理，不测角色认知风格 |
| 原版临床心理诊断量表 | 伦理和解释风险高，容易被误读为诊断，不适合产品报告 |

## 建议接入方式

建议采用“三层认知指纹”：

| 层级 | 题量建议 | 内容 |
|---|---:|---|
| 人格/价值观短测 | 20-30 | BFI/IPIP + Moral Foundations/PVQ 的角色化改写 |
| 决策风格情境题 | 15-25 | SJT、风险选择、长期主义/短期主义、边界判断 |
| 社会认知与表达题 | 15-25 | 共情、读意图、反驳、劝说、拒绝、解释复杂问题 |

这样每个角色额外增加 50-80 道“非 AI 来源的认知指纹题”即可，不需要照搬临床或心理学原始量表。它们应作为当前 RoleBench-shaped 题库的补充维度，而不是替代 RoleBench-style 的角色专属问题。

## 来源

- BFI-2: Soto & John, The next Big Five Inventory, Journal of Personality and Social Psychology, 2017.
- HEXACO-PI-R: https://hexaco.org/
- IPIP: https://ipip.ori.org/
- Moral Foundations Questionnaire: https://moralfoundations.org/questionnaires/
- Schwartz value survey / PVQ: Schwartz, Universals in the content and structure of values, 1992；Portrait Values Questionnaire.
- Need for Cognition: Cacioppo, Petty & Kao, 1984.
- Cognitive Reflection Test: Frederick, Cognitive Reflection and Decision Making, 2005.
- Interpersonal Reactivity Index: Davis, Measuring individual differences in empathy, 1983.
- Reading the Mind in the Eyes Test: Baron-Cohen et al., 2001.
- PEBL psychological test battery: https://pebl.sourceforge.net/
