# Codex 直挂严格量表全量评测结果

## 评测设置

- 被测角色：Nuwa 示例角色 15 个。
- 题量：每个角色同一套 56 题，合计 840 题。
- 题目结构：RCSS 8 + AMS-GSR 28 + Mini-IPIP 20。
- 生成方式：Codex CLI 直接挂载 Nuwa skill 与 cognitive skill，不使用 MiniMax。
- 证据约束：双方使用同一角色证据包，不搜索外部资料。
- 裁判方式：同一 Codex runner 匿名盲评，输出 x/y/tie。

## 总体结果

| System | Wins | Losses | Ties | Weighted Avg |
|---|---:|---:|---:|---:|
| Nuwa | 347 | 310 | 183 | 465.73 |
| cognitive | 310 | 347 | 183 | 464.54 |

结论：全量严格量表层两者非常接近。Nuwa 在总胜场和加权均分上微弱领先；角色层面 Nuwa 7 个角色占优，cognitive 7 个角色占优，1 个角色打平。

## 分量表结果

| 分量表 | 胜场领先 | Nuwa / cognitive / 平 | Nuwa 加权均分 | cognitive 加权均分 |
|---|---|---:|---:|---:|
| RCSS 认知风格 | Nuwa | 51/39/30 | 477.75 | 473.71 |
| AMS-GSR 学术动机 | cognitive | 163/166/91 | 465.18 | 465.39 |
| Mini-IPIP 人格 | Nuwa | 133/105/62 | 461.68 | 459.67 |

## 角色结果

| Role | 胜场领先 | Nuwa / cognitive / 平 | Nuwa 加权均分 | cognitive 加权均分 |
|---|---|---:|---:|---:|
| Andrej Karpathy | cognitive | 21/24/11 | 462.14 | 461.79 |
| Charlie Munger | Nuwa | 27/13/16 | 467.86 | 458.66 |
| Donald Trump | cognitive | 20/22/14 | 451.43 | 456.25 |
| Elon Musk | cognitive | 21/24/11 | 457.23 | 458.39 |
| Ilya Sutskever | cognitive | 17/22/17 | 452.14 | 458.21 |
| Justin Sun | 平 | 23/23/10 | 450.63 | 464.91 |
| MrBeast | Nuwa | 24/17/15 | 470.54 | 466.61 |
| Nassim Nicholas Taleb | Nuwa | 23/20/13 | 465.45 | 465.54 |
| Naval Ravikant | Nuwa | 21/19/16 | 473.13 | 470.89 |
| Paul Graham | cognitive | 21/32/3 | 472.59 | 480 |
| Richard Feynman | Nuwa | 29/13/14 | 468.93 | 460.54 |
| Steve Jobs | Nuwa | 26/15/15 | 479.38 | 467.86 |
| X Mastery Mentor | cognitive | 23/24/9 | 474.2 | 466.43 |
| Zhang Xuefeng | Nuwa | 29/19/8 | 467.23 | 457.68 |
| Zhang Yiming | cognitive | 22/23/11 | 473.04 | 474.29 |

## 产物

- 合并结果：`docs/evals/runs/codex-mounted-strict56-all-roles-840-combined.json`
- 量表汇总：`docs/evals/runs/codex-mounted-strict56-all-roles-840-scale-summary.md`
