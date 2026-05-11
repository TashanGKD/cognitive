# cognitive-ask-platform integration

This directory contains the optional wiring needed to mount
`cognitive` inside `TashanGKD/cognitive-ask-platform`.

It is kept as integration material rather than committed directly into the
platform repository so the platform can remain on its original baseline until
the skill is ready to be integrated.

## Files

| File | Purpose |
|---|---|
| `platform-wiring.patch` | Adds skill discovery, provisioner defaults, visitor-wrapper priority, JSON-safe template rendering, and frontend `persona` category support. |
| `cognitive-eval.test.ts` | Focused platform test file for the skill package and benchmark seeds. |

## Apply

From a clean `cognitive-ask-platform` checkout:

```powershell
Copy-Item -Recurse ..\cognitive\skills\cognitive api-server\templates\empty-twin\workspace\skills\cognitive
Copy-Item -Recurse ..\cognitive\skills-weixin\cognitive api-server\templates\empty-twin\workspace\skills-weixin\cognitive
git apply ..\cognitive\integrations\cognitive-ask-platform\platform-wiring.patch
Copy-Item ..\cognitive\integrations\cognitive-ask-platform\cognitive-eval.test.ts api-server\tests\cognitive-eval.test.ts
```
