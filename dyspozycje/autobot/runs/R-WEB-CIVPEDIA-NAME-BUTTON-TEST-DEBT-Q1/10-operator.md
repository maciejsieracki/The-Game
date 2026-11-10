# R-WEB-CIVPEDIA-NAME-BUTTON-TEST-DEBT-Q1 — Operator runda 1

STATUS: PASS — confirmed stale test expectation and corrected it
DOMAIN: GAME
TEMAT: `R-WEB-CIVPEDIA-NAME-BUTTON-TEST-DEBT-Q1`
BAZA: `f293fc643ac3a808b36080935fc08dec94e85fea` (`HEAD` = `origin/main` before the test edit)
ZAKRES: `gra/tools/civpedia-karty-nazwa-przyciskiem-test.cjs` only; product source remains read-only.

## Odtworzenie i klasyfikacja

The registered test ran against the unchanged base and produced **25 pass / 2 fail**. Both failures came from the building-card fixture expecting zero cross-links: it measured the real `Obróbka drewna` link on `building/stolarnia`, then the combined style/hit-area assertion failed because it is gated on that count. The measured link already had a 1px border, no underline, `elementFromPoint` on the button itself, and zero width/height difference. Stolarnia's `techUnlock` is `Obróbka drewna`, and `buildingAdapter` maps a resolvable technology requirement to `linkTo`; this is stale test debt, not a product failure.

The default Playwright launch could not find its configured cached executable at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. This is an environment limitation, not a product result. To run the real-browser harness, a temporary `/tmp`-only Node preload directed Playwright to `/usr/bin/chromium` with `--no-sandbox`. No offline or mocked browser result was recorded. The shim was removed after the run.

## Zmiana i bramki

Corrected the Stolarnia cross-link expectation from 0 to 1 and updated the comment to describe the existing technology link. Kept both the explicit link-count assertion and the combined style/hit-area assertion. Added a positive keyboard check: Enter on the native name button opens the same `building/stolarnia` target. The existing native `<button>`, mouse-click, and target assertions remain intact.

- Unchanged base, real Chromium: **25 pass / 2 fail**, both explained by stale expected count 0 vs measured count 1.
- Corrected test, real Chromium: **28 pass / 0 fail**.
- `node --check tools/civpedia-karty-nazwa-przyciskiem-test.cjs`: PASS.
- No product source changes, no commit, no deployment.
- Browser closed; temporary test bundle/entry cleaned by the harness.

## Następny krok

Independent Evaluator review the narrow test-only diff and confirm the corrected count plus retained mouse, keyboard, native-button, target, style, and hit-area assertions. If accepted, root may integrate the test and this run record; no product fix is indicated.
