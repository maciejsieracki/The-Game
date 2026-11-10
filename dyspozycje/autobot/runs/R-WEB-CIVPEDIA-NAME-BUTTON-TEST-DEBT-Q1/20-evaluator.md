# Independent evaluator — R-WEB-CIVPEDIA-NAME-BUTTON-TEST-DEBT-Q1

STATUS: PASS

The correction is supported by the product data and adapter: `gra/data/buildings.json` defines Stolarnia's `techUnlock` as `Obróbka drewna`, and `gra/src/ui/entityCards/buildingAdapter.ts` resolves that technology and assigns `linkTo: { kind: 'technology', id: techSlug }` when available. The technology card therefore has one real building cross-link.

I reviewed the test-only diff. It changes Stolarnia's expected cross-link count from 0 to 1 while retaining explicit per-card count assertions and the combined style/hit-area check. Existing unit and improvement counts remain 1. The original native-button and exact-target mouse-click checks remain, and the added Enter check focuses the native Stolarnia name button and asserts that the opened card is exactly `building/stolarnia`. The count gate prevents empty-link vacuous success; no existing assertion was weakened or removed.

Independent real Chromium rerun from `gra/`:

```text
NODE_OPTIONS='--require=/tmp/codex-system-chromium.cjs' node tools/civpedia-karty-nazwa-przyciskiem-test.cjs
28 pass / 0 fail
```

The run passed the building link count and style/hit-area checks, mouse and keyboard target checks, and the existing unit/improvement count and style/hit-area checks. No product source was changed by this evaluation. Browser lock released after the run.
