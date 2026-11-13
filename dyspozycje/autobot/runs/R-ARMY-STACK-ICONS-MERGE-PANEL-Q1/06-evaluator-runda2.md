# AutoBot Evaluator — runda 2: dolny viewport gap przy 150%

TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1
RUNDA: 2/5
WERDYKT: **FAIL — dolny margines nadal nie spełnia minimum 24 CSS px.**
DEPLOY/PUSH/COMMIT: NIE WYKONANO

## Niezależne uruchomienie

Uruchomiłem oba testy i bramki z `gra/`:

- `node tools/army-merge-panel-scroll-real-render-test.cjs`: **25/26 PASS**. Asercja 150% / 40 jednostek kończy się `viewport-gap`. Przy DPR 1.5 i viewportcie 600×413 CSS px Chromium zmierzył `box.bottom=389.552551`, zatem dolny odstęp wynosi `413 - 389.552551 = 23.447449 CSS px`. To mniej niż wymagane 24 px. Górny odstęp wynosi `26.983917 px`; body scrolluje do końca, oba CTA pozostają widoczne i klikalne, a pozostałe asercje przechodzą.
- `node tools/army-split-ruch-icons-test.cjs`: **7/7 PASS**.
- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS** (`vite build`, 916 modułów).
- `git diff --check` dla plików allowlisty: **PASS**.

## Integralność testów i zakres

Test scrolla nie został zmodyfikowany, a jego tolerancja nie została poluzowana: asercja marginesu nadal wymaga `gap >= 24 - 0.5` (23.5 px). Zmierzone 23.447449 px odpada nawet przy tej tolerancji; ponadto nie spełnia jawnego minimum 24 px z dispatchu. Ikonowy test również jest niezmieniony. Hash każdego testu zgadza się z `HEAD`.

Jedynym zmienionym plikiem źródłowym z zakresu jest `gra/src/ui/armyMergePanel.ts`; diff dodaje `align-items:flex-start` dla `max-height:500px`. `armyStackHud.ts` niezmieniony. Inne dirty pliki worktree są poza tym zakresem i nie zostały uwzględnione w ocenie.

SHA-256:

- `gra/src/ui/armyMergePanel.ts` — `a7e3424e253641b63368f17614d336faba2ea3ef2d9ca90b39bd6ced3202946c`
- `gra/src/ui/armyStackHud.ts` — `e44b897b3441e06b09682b6484e27ce4ac4eb6803c0a87b973206c8be7b256f9`
- `gra/tools/army-merge-panel-scroll-real-render-test.cjs` — `253e82810f4f35b40d8ba3b662a0ed48d10483d4e8150aeae937af1b5a79be89` (identyczny z `HEAD`)
- `gra/tools/army-split-ruch-icons-test.cjs` — `c5f5b41b120cacae712a85744644054093a38cedc94584dd7df47dddabf752db` (identyczny z `HEAD`)

Nie dopuściłem zmiany do integracji: wymagany dolny viewport gap nie został potwierdzony.
