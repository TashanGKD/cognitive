# 角色评测基准尺度参考

日期：2026-05-12

本文用于说明 cognitive 角色相似度评测为什么采用“母池大、评测集可控”的设计，并记录公开基准的 GitHub 星数与每角色题量口径。星数来自 GitHub API 当日查询；题量来自公开 README、数据文件或代码文件。

非 AI 认知与人格测试参考见：`docs/evals/non-ai-cognitive-test-reference.zh.md`。

## 可直接参考的角色评测基准

| 基准 | 仓库星数 | 角色规模 | 每角色题量/样本量 | 对 cognitive 的启发 |
|---|---:|---:|---:|---|
| RoleBench / RoleLLM | 522 | 100 roles；公开数据 168,093 samples | 英文 role-specific instruction 文件为 95 个角色、18,949 条，平均 199.46 条/角色；general instruction 是 1,500 条全局池，不是逐角色固定题 | 最适合作为母池尺度参考：每个角色应有约 200 条角色专属问题，再叠加通用任务面 |
| CharacterEval | 292 | 77 characters | 1,785 段多轮对话，23,020 examples；平均约 23.18 段对话/角色，298.96 examples/角色 | 说明角色评测不能只看单轮题数，多轮样本也能形成高覆盖；但它是中文小说/剧本角色，不是人物认知分身 |
| PersonaGym | 41 | 200 personas | 5 个任务维度，每维默认生成 10 个问题，即 50 questions/persona | 适合锚定“可执行默认评测集”：50 题/角色已经是可解释、可复跑的轻量完整评测 |
| InCharacter | 97 | 32 RPAs | 14 个心理问卷；公开问卷题项合计 572 items/角色 | 它测的是人格量表一致性，不是开放式角色表达；可用于补人格一致性，不适合作为唯一对话题库 |

## 相关但口径不同的角色/社交基准

| 基准 | 仓库星数 | 角色规模 | 每角色题量/样本量 | 口径说明 |
|---|---:|---:|---:|---|
| CharacterBench | 22 | 测试数据中 1,319 个唯一 character_name | 13 个维度文件，每个 250 条，共 3,250 条；平均约 2.46 条/角色 | 广覆盖角色定制评测，深度不在每角色题量，而在维度和裁判模型 |
| SocialBench | 68 | 超过 500 roles | 超过 6,000 questions，超过 30,800 utterances；粗略约 12+ questions/role | 偏社交互动能力，不是单角色深度相似度 |
| MMRole | 101 | 85 characters | 294 test samples，约 3.46 test samples/角色；另有 14,346 dialogues 和 85,456 training samples | 多模态角色扮演数据集，适合参考图文场景，不适合直接决定文本分身题量 |
| Character-LLM / trainable-agents | 628 | 角色智能体训练框架 | 不是固定 benchmark 题库口径 | 更像角色构建/训练框架参考，不作为每角色题量依据 |

## 对当前 Nuwa-vs-cognitive battle 的结论

当前设计保留三层题量：

| 层级 | 每角色题量 | 15 角色总量 | 用途 |
|---|---:|---:|---|
| 母池 | 400 | 6,000 | 对齐 RoleBench 的构建尺度：200 通用任务 + 200 角色专属任务 |
| 强评测集 | 100 | 1,500 | 用于报告、正式 battle、角色间差异分析 |
| 默认执行集 | 50 | 750 | 对齐 PersonaGym 的可复跑评测强度：15 通用 + 35 角色专属，适合日常迭代 |

因此，不建议把 24 题/角色作为正式结论依据。50 题/角色可以作为稳定默认，100 题/角色适合领导报告和关键版本对比，400 题/角色作为抽样母池和覆盖证明。

## 来源

- RoleLLM-public: https://github.com/InteractiveNLP-Team/RoleLLM-public
- RoleBench dataset: https://huggingface.co/datasets/ZenMoore/RoleBench
- CharacterEval: https://github.com/morecry/CharacterEval
- PersonaGym: https://github.com/vsamuel2003/PersonaGym
- InCharacter: https://github.com/Neph0s/InCharacter
- CharacterBench: https://github.com/thu-coai/CharacterBench
- SocialBench: https://github.com/X-PLUG/SocialBench
- MMRole: https://github.com/YanqiDai/MMRole
- Character-LLM / trainable-agents: https://github.com/choosewhatulike/trainable-agents
