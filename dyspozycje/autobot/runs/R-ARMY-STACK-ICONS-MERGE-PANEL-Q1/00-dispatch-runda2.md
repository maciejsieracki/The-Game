# AutoBot dispatch — runda 2: dolny viewport gap przy 150%

TEMAT: R-ARMY-STACK-ICONS-MERGE-PANEL-Q1
RUNDA: 2/5
DOMAIN: GAME
MODEL + EFFORT: Operator GPT-6 Luna Medium / Evaluator GPT-6 Luna Medium / Final Control GPT-6 Luna Medium

## WYZWALACZ
Niezależny czysty rerun z worktree na `f5a32c4e` wykazał 25/26 zamiast wcześniejszego 26/26. Przy skali emulowanej przez Chromium DPR 1.5 i CSS viewport 600×413, panel ma `bottom=390.844`, czyli dolny odstęp ok. 22.16 px, mniejszy niż kontrakt 24 px. Wszystkie CTA pozostały widoczne i klikalne, ale warunek stałego marginesu zawiódł.

## GOAL
Naprawić geometrię panelu tak, aby margines od góry i dołu wynosił co najmniej 24 CSS px, również przy DPR 1.5/viewport 600×413, zachowując wewnętrzny scroll, osiągalność wszystkich wierszy i widoczność/klikalność CTA.

## KRYTERIA
- `army-merge-panel-scroll-real-render-test.cjs` przechodzi wszystkie 26 asercji, w szczególności dolny i górny viewport gap przy DPR 1.5.
- `army-split-ruch-icons-test.cjs` przechodzi 7/7.
- TypeScript, scoped diff-check oraz build przechodzą.
- Żaden test nie jest osłabiany ani nie zmienia się tolerancji poniżej 24 px.

## ALLOWLISTA
- `gra/src/ui/armyMergePanel.ts`
- `gra/src/ui/armyStackHud.ts` tylko jeśli wymagany przez wspólny layout
- `gra/tools/army-merge-panel-scroll-real-render-test.cjs`
- `gra/tools/army-split-ruch-icons-test.cjs`
- raporty tej rundy

## GRANICE
Nie dotykać pozostałych dirty plików, nie zmieniać zakresu integracji. Bez commit/push/deploy.
