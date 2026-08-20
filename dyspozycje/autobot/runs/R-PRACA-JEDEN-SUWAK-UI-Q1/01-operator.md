# AutoBot Operator — R-PRACA-JEDEN-SUWAK-UI-Q1 — runda 5/5

STATUS: DONE — poprawka po BLOCK Evaluatora, bez duplikowania runu
MODEL: gpt-5.6-luna
REASONING: high
TEMAT: R-PRACA-JEDEN-SUWAK-UI-Q1
HEAD: `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`)

## Ledger i routing

- Odczytano ledger Evaluatora z `Civ-clean-main-2026-08-20`: **runda 4/5**, BLOCK; następna runda to **5/5**, więc limit nie został przekroczony.
- Nie utworzono nowego ID ani duplikatu runu.
- Praca wykonana w osobnej sparse izolacji od HEAD `47cdca15`. Obcy diff z `Civ-clean-main-2026-08-20` pozostał nietknięty i nie został skopiowany, zresetowany ani zintegrowany.

## Zakres poprawki

Allowlista: `gra/src/ui/empireDetailPanel.ts`, `gra/tools/praca-split-ui-test.cjs` oraz ten raport.

- Usunięto obie stare ścieżki lokalnego suwaka Pracy: `renderDefaultPodzialPracySection`/`data-praca-key` oraz `renderPracaSplitSection`.
- Pozostawiono jeden nadrzędny renderowany slider `data-praca-empire-split`, jeden stan `procentUlepszenia` i jeden handler `onOwnerDefaultPracaSplitChange`.
- Ustawiono dokładne etykiety `Budynki (0–100%)` oraz `Pula Pracy (0–50%)`.
- Budynki są prezentowane jako wyliczenie `100% − Pula Pracy`; zakres slidera pozostaje `0–50`.
- Test focused został sprowadzony do bezpiecznego, statycznego kontraktu 7 asercji i nie tworzy plików tymczasowych.

## Weryfikacja

- `node tools/praca-split-ui-test.cjs` — **7 pass, 0 fail**.
- `tsc --noEmit` — **PASS**; zależności były dostępne przez lokalny junction `gra/node_modules` tylko w izolacji testowej.
- `git diff --check` — **PASS**.
- Allowlista — **PASS**: zmienione ścieżki kodu/testu to wyłącznie dwa pliki z allowlisty; raport jest artefaktem tego samego runu.
- Provenance — **PASS**: `HEAD = 47cdca15757efb89d5e634e9e9ddff370925708d`.
- Brak `esbuild` — **NOTE**, nie podstawa BLOCK; focused harness nie wymaga esbuild.

INTEGRACJA/COMMIT/DEPLOY/PUSH: NIE WYKONANO
