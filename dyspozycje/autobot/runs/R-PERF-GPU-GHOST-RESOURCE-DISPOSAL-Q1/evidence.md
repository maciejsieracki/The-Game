# Verification evidence

## Focused lifecycle regression

Command: `node gra/tools/web-memory-leaks-test.cjs`

Result: **55 passed, 0 failed**. Covered owned-resource disposal and deduplication; fresh source material disposal when replaced by a ghost clone; cloned material disposal on ghost removal; shared geometry/material preservation; fresh wyrab marker geometry/material disposal; city wall-ring and tin-mine cache survival; and main lifecycle wiring for ghost removal, marker replacement, state rebuild, and clearing/reset.

## Chromium / WebGL renderer counter

Command: `node gra/tools/transient-webgl-resource-smoke.cjs`

Result:

```json
{"liveBaseline":1,"afterTransientCycles":1,"afterLiveRemoval":1,"sharedGeometryStillUsable":true}
```

The one geometry is intentionally retained in a shared cache, so the renderer count remains one after its live scene owner is removed. Across 120 synthetic add/render/remove/dispose cycles, the transient geometry count returns to that same baseline every time. This is a focused GPU-counter smoke, not a whole-game memory benchmark.

## Other checks

- `npm run typecheck --prefix gra` — passed.
- `npm run build --prefix gra` — passed.
- `git diff --check` — passed.
