# 01-operator — R-WEB-SCIENCE-PICKER-ETA-PL-Q1

STATUS: OPERATOR_COMPLETE; awaiting sequential Evaluator and Final Control.
MODEL: Codex Luna high.
BAZA: `main`, `cb17ba9216de6482023ac69e05b1a5369a37316b`.

ZMIANA: `sciencePicker.ts::renderProgress()` now formats positive ETA counts as `1 tura`, `2–4 tury` except `12–14`, and `tur` otherwise. The local helper in `main.ts` is private and returns accusative `turę`, so it was not suitable to reuse. Nonpositive ETA remains `<1 tury`; null research state keeps the existing selection prompt and empty bar. Pool, target, progress percentage, and both ETA locations remain rendered.

ALLOWLISTA / PLIKÓW: only `gra/src/ui/sciencePicker.ts`, the focused test `gra/tools/science-picker-eta-real-render-test.cjs`, this run report, and browser evidence `evidence/science-picker-eta-1-tura.png`. No balance data or queue/root metadata changed.

TESTY:
- `node tools/science-picker-eta-real-render-test.cjs` — PASS, live Chromium through Playwright; checks 0, 1, 2, 5, 12, 21, 22 and null state, target/pool/progress preservation, and uncaught page errors (16 assertions, 0 failures). The Playwright-managed browser was not installed, so the test used system Chromium at `/usr/bin/chromium`.
- Mutation check `SCIENCE_PICKER_ETA_MUTATE=1 node tools/science-picker-eta-real-render-test.cjs` — expected FAIL; forcing all plural counts to `tur` caused the live assertions for 2 and 22 to fail.
- `node ./node_modules/typescript/bin/tsc --noEmit` from `gra/` — PASS (exit 0).
- Screenshot: [`evidence/science-picker-eta-1-tura.png`](evidence/science-picker-eta-1-tura.png), captured from the live picker renderer.

ZMIANY/COMMIT: Operator commits only these allowlisted files as a candidate. No merge, push, or deploy performed. Independent review remains pending.
