# Pre-existing test drift — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1

STATUS: FAIL-PRE-EXISTING-DRIFT
TEMAT: R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1
SCOPE: `gra/tools/unit-resource-upkeep-test.cjs`, `gra/tools/unit-stock-cost-test.cjs`; nie są zmianami tematu i nie zostały zmodyfikowane.

## Kontrola bazy

Dispatch oczekiwał HEAD `47cdca15`, ale faktyczny checkout podczas tej rundy to
branch `backup-unfinished-local-work-2026-08-20`, HEAD `33f8265033c795625b8f1209c148e79f363feb73`;
`47cdca15` nie jest przodkiem bieżącego HEAD. Nie wykonano resetu, checkoutu ani
przełączenia branchu, aby nie usuwać lub nadpisywać cudzej pracy.

## Dowód

Na tym samym worktree, HEAD `47cdca15757efb89d5e634e9e9ddff370925708d`, FALA 300:

- `node tools/unit-resource-upkeep-test.cjs` — **3 passed, 4 failed**. Wszystkie 4 fail są oczekiwaniami ×1 wobec bieżących danych ×5: Wojownik upkeep `2 → 10`, Włócznik upkeep `2 → 10`, Włócznik stock `10 → 50`, dwa Włóczniki upkeep `4 → 20`.
- `node tools/unit-stock-cost-test.cjs` — **41 passed, 17 failed**. Siedemnaście fail dotyczy oczekiwań ×1 wobec kanonicznego skalowania ×5: stała horse stock `5 → 25`, Konnica `{"braz":10,"kon":5} → {"braz":50,"kon":25}`, Rydwan (woły) Brąz `10 → 50`, Wojownik Drewno `10 → 50`, 9 kolejnych oczekiwań `+5 Koni → +25 Koni`, oraz scenariusz graniczny `5 Koni → 25 Koni`.

To jest drift oczekiwań testowych po istniejącym skalowaniu danych/mechaniki ×5,
nie regresja kontraktu rekrutacji bez upkeep. Testy pozostają jawnie czerwone i
nie są raportowane jako PASS; ich osobna naprawa wymaga osobnego tematu/allowlisty.

## Niezależna blokada mieszanych zmian worktree

- `node tools/ai-mp-rekrutacja-build-gate-test.cjs` — **BLOCK/INFRA**, bundling
  zatrzymuje się przed testami, ponieważ zmieniony przez inny temat `gra/src/game/ai.ts`
  importuje `clampPodzialPracyBudynkiPercent`, którego nie eksportuje współdzielony
  `gra/src/game/cities.ts`.
- `npx tsc --noEmit` — **2 błędy pre-existing**: ten sam brak eksportu w `ai.ts` oraz
  niezależny `battleScene.ts(10456,9)` (`number` nieprzypisywalny do `string`).

Nie naprawiano tych błędów, ponieważ dotykają cudzych/mieszanych zmian poza allowlistą.

## Zakres tematu

Tematyczny test AI/MP został doprowadzony do bieżących wartości FALI 300 i jest
zielony: `ai-recruit-upkeep-gate-test.cjs` — **27 passed, 0 failed**. Nowy test
kontraktowy pozostaje zielony: `recruitment-no-upkeep-gate-test.cjs` — **10 passed,
0 failed**.
