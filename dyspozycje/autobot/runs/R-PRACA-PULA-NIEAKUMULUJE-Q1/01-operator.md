# 01-operator — R-PRACA-PULA-NIEAKUMULUJE-Q1

STATUS: BLOCK
TEMAT: R-PRACA-PULA-NIEAKUMULUJE-Q1
RUN: operator kolejnej rundy po BLOCK Evaluatora
WORKTREE: `Civ-clean-main-2026-08-20`
BASE: `47cdca15`
FALA: 300

## Provenance

- Wszystkie działania wykonano wyłącznie w `Civ-clean-main-2026-08-20`; katalog główny `Civ` nie był używany do edycji ani testów.
- Przeczytano: `00-dispatch.md`, poprzedni `01-operator.md`, `02-evaluator.md` tego samego runu.
- Allowlista tej rundy: jeden test `gra/tools/praca-panel-parity-test.cjs` oraz ten raport `01-operator.md`. Nie zmieniano kodu runtime, `00-dispatch` ani `02-evaluator`.
- Worktree ma obce, niezacommitowane zmiany w wielu plikach runtime i dokumentacyjnych. Nie resetowano, nie czyszczono i nie przypisywano tych zmian do tego runu.
- Nie wykonano integracji, commit, deploy ani push.

## Wykonane

- Dodano `gra/tools/praca-panel-parity-test.cjs` jako read-only source/contract gate. Test sprawdza wspólne pola snapshotu miasta i imperium, sumowanie `doPuli`/`doBudynkow`, wiring silnika, upkeep/save-load oraz fixture 0/100, 50/50, 100/0.
- Fixture 50/50 zachowuje sumę 13/turę, akumuluje 6 + 6 przez dwie tury i przechodzi round-trip `playerPracaPool` przez JSON save/load.

## Testy

- `node tools/praca-panel-parity-test.cjs` — PASS, 16/16.
- `node tools/production-overflow-test.cjs` — PASS, 51/51.
- `node tools/praca-split-ui-test.cjs` — PASS, 7/7.
- `node tools/praca-miasto-limit-50-test.cjs` — PASS, 4/4.
- `node tools/ai-praca-split-parity-test.cjs` — PASS, 19/19.
- `gra/node_modules/.bin/tsc.cmd --noEmit` — PASS, 0 błędów.
- `node tools/praca-global-default-live-test.cjs` — FAIL, 3/7: globalne `procentBudynki=0` daje w preview `doBudynkow=5, doPuli=4` zamiast `0/9`; realny `advanceCityEconomy` daje ten sam rozjazd; lokalny override 40% także daje `5` zamiast oczekiwanych `4`.

## Werdykt i blokada

Panel parity, testy domenowe, 50/50 two-turn fixture, save/load fixture i `tsc` są zielone. Nie można jednak zamknąć GOAL jako PASS, ponieważ wymagany live test wykrywa rozjazd globalnego splitu w obu ścieżkach runtime. Dodatkowo obce zmiany w plikach runtime uniemożliwiają bezpieczne przypisanie przyczyny temu ID.

Routowanie: `BLOCK → Evaluator/owner` po udostępnieniu worktree bez obcych zmian albo po jawnej decyzji o pochodzeniu zmian w `turn-economy.ts`, `main.ts`, `cities.ts` i panelach. Następna runda powinna najpierw ustalić, dlaczego przekazany globalny default `{ procentBudynki: 0 }` nie dociera jako efektywny split, następnie ponowić live 0/100, 50/50 przez dwie tury, save/load oraz player/AI/MP.

DEPLOY/PUSH: NIE WYKONANO
