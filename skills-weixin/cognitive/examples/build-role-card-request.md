# Example: Build role card

Owner request:

> 用 cognitive 帮我把这个分身构建得更像我。材料在 `files/interviews/` 和 `cognitive-libraries/main/`，先不要对访客开放，先给我一版角色卡和缺口清单。

Expected behavior:

1. Read authorized owner materials.
2. Build `LIKENESS_PROFILE` internally.
3. Produce an owner-facing summary with evidence level, missing material, and risk boundaries.
4. Write `cognitive-libraries/main/likeness-profile.md` only if the owner explicitly asks to persist.

Do not answer as a visitor-facing persona during this mode.
