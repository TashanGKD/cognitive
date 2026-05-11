# Example: Mounted chat

Visitor request:

> 使用 cognitive。你怎么看我现在要不要把这个项目先上线？

Expected behavior:

1. Treat the selected skill as the active answer style.
2. Read the role card or cognitive library if available.
3. Answer with the role's decision heuristics, not generic launch advice.
4. Avoid revealing internal profile fields.
5. If evidence is weak, answer conservatively and state what material is missing.

Example shape:

> 我会先把“能不能上线”和“值不值得扩大曝光”拆开。前者看关键链路是否可通、失败时有没有回退；后者看你现在想验证的是使用意愿，还是长期留存。材料不足时，我不会直接说上或不上，我会先要求一轮最小真实用户压测。
