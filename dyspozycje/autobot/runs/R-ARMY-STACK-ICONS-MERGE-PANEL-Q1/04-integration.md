# Integration — R-ARMY-STACK-ICONS-MERGE-PANEL-Q1

STATUS: PASS — INTEGRATED LOCALLY; READY_FOR_DEPLOY.
DOMAIN: GAME
TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1
GOAL: Rozdziel i Połącz mają przeciwne, czytelne kierunki; panel łączenia pozostaje dostępny i przewijalny przy małym viewportcie oraz 150% skali.

## Zmiany i commit

- Zintegrowano wyłącznie cztery pliki zaakceptowane przez Final Control:
  - `gra/src/ui/armyMergePanel.ts`
  - `gra/src/ui/armyStackHud.ts`
  - `gra/tools/army-merge-panel-scroll-real-render-test.cjs`
  - `gra/tools/army-split-ruch-icons-test.cjs`
- Commit produktu: `29c98643` (`fix army merge panel scrolling and action icons`).
- Bazowy HEAD: `32d27454be213e0e9342435b81c0271999e99513`.
- Pozostałe lokalne zmiany w worktree nie weszły do commitu.

## Bramki

- Operator PASS; Evaluator PASS-WITH-NOTES; Final Control TAK do integracji czterech plików.
- `node gra/tools/army-merge-panel-scroll-real-render-test.cjs`: 26/26 PASS.
- `node gra/tools/army-split-ruch-icons-test.cjs`: 7/7 PASS.
- `git diff --cached --check`: PASS.
- 150% jest emulowane przez Chromium DPR 1.5 i odpowiednio zmniejszony viewport CSS; nie jest to ustawienie menu zoom każdej przeglądarki/OS.

DEPLOY/PUSH: NIE WYKONANO.
NASTĘPNY KROK: osobna autoryzacja publikacji do Roboczej.
