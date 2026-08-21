# 02-evaluator — R-PRACA-PULA-NIEAKUMULUJE-Q1

STATUS: BLOCK
TEMAT: R-PRACA-PULA-NIEAKUMULUJE-Q1
RUN: runda 4/5, niezależny Evaluator Luna High
GOAL: Zweryfikować akumulację Puli Pracy, spójność preview/end-turn, paneli, 50/50, save/load/parity oraz typecheck.

## Werdykt

**BLOCK — nie ma podstaw do PASS ani PASS-WITH-NOTES.** Weryfikacja funkcjonalna zawiera twardy FAIL dla wymaganego globalnego 0% budynków, a checkout nie spełnia izolacji/allowlisty. Ten sam pełny ID wraca do tego samego Operatora; nie duplikować runu.

## Checkout, baza i realny diff

- Checkout: `Civ-clean-main-2026-08-20`.
- HEAD/base: `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`).
- Branch: `work/clean-main-2026-08-20`, tracking `origin/main`.
- `git status` względem HEAD pokazuje 29 zmienionych śledzonych ścieżek oraz liczne nieśledzone katalogi/runy/testy.
- Zmiany obejmują m.in. `gra/src/main.ts`, `gra/src/ui/cityPanel.ts`, `gra/src/game/cities.ts`, `gra/src/game/economy-upkeep.ts`, `gra/src/game/empire-city-defaults.ts`, `gra/src/ui/empireDetailPanel.ts` oraz wiele obcych plików runtime, UI, dokumentacji i testów; weryfikacja nie może przypisać ich autorstwa temu ID.
- Deklarowana allowlista Operatora w `01-operator.md` to tylko `gra/tools/praca-panel-parity-test.cjs` oraz raport Operatora. Stan faktyczny zawiera zmiany poza tą allowlistą; Operator sam odnotował obce zmiany i nie przypisał ich temu runowi.
- Obcy diff UI technologii (`scienceHubHud.ts`, `techDiscoveryNotice.ts`, `techTreeView.ts` i powiązane ścieżki) pozostawiono poza zakresem merytorycznym zgodnie z dyspozycją; nie wpływa on na poniższy FAIL.
- Nie wykonano commit/integracji/deploy/push.

## Testy wykonane niezależnie

| Bramka | Wynik | Dowód |
|---|---:|---|
| focused panel parity | PASS | `node tools/praca-panel-parity-test.cjs` → **16/16**, nie 22/22 |
| globalny 0% budynków, preview/end-turn | **FAIL** | `node tools/praca-global-default-live-test.cjs` → **3 passed, 4 failed**; preview i `advanceCityEconomy`: `doBudynkow=5 doPuli=4`, oczekiwane `0/9`; override 40%: `5`, oczekiwane `4` |
| 50/50 / overflow contract | PASS | `node tools/production-overflow-test.cjs` → **51/51** |
| AI split parity | PASS | `node tools/ai-praca-split-parity-test.cjs` → **19/19** |
| split UI | PASS | `node tools/praca-split-ui-test.cjs` → **7/7** |
| TypeScript | PASS | `node_modules/.bin/tsc.cmd --noEmit` z `gra/` → exit 0, 0 błędów |

Focused parity test ma deterministyczną fixture 0/100, 50/50 i 100/0, dwie tury 50/50 oraz JSON round-trip `playerPracaPool`; te przypadki przechodzą jako fixture/source contract. Nie jest to jednak dowód poprawnego live resolvera, ponieważ niezależny live test nadal reprodukuje 0% bug. Nie ma dowodu runtime save/load oraz player/AI/MP parity po realnych turach.

## Dodatkowe bramki wykonane niezależnie

- `node tools/praca-limit-50-test.cjs` — PASS, **23/23**.
- `node tools/praca-miasto-limit-50-test.cjs` — PASS, **4/4**.
- `node tools/empire-praca-panel-coverage-test.cjs` — PASS, **15/15**.
- `node tools/empire-panel-split-test.cjs` — PASS, **25/25**.
- `node tools/upkeep-test.cjs` — PASS, **73/73**.
- `node tools/ulepszenia-praca-percent-test.cjs` — PASS, **28/28**.
- `node tools/save-load-sort-test.cjs` — PASS, **4/4**; `save-label-test.cjs` — PASS. Są to bramki poboczne dialogu, nie runtime E2E Work-pool.

## Ustalenia techniczne

- Akumulacja puli i kolejność są logicznie spięte: `main.ts` dodaje `poolGain`/overflow po ticku miasta, odejmuje upkeep raz po pętli miast, a dopiero potem dzieli wspólną pulę na budynki/ulepszenia. Fixture 50/50 potwierdza 6 + 6 przez dwie tury.
- Globalny stan dociera do `resolveCityPodzialPracy`, preview oraz `advanceCityEconomy`. Live FAIL nie wygląda już na sam cache-staleness: `clampPodzialPracyBudynkiPercent()` ma minimum **50% budynków**, więc wejście globalne `{ procentBudynki: 0 }` zostaje znormalizowane do 50/50. Przy Pracy 9 daje to `round(9×0.5)=5` i `4` do puli. Ten sam clamp odrzuca lokalne 40%.
- To ujawnia konflikt kontraktów: dispatch wymaga testowalnego globalnego 0/100, natomiast aktualna polityka limitu 50% wymusza minimum 50% budynków. Nie wolno rozstrzygać tego przez cichy patch bez decyzji owner-a/ABC.
- Panel miasta i panel imperium czytają wspólne pola snapshotu (`pracaPula`, `pracaBudynki`, `pracaUpkeep`); kontrakty źródłowe przechodzą. Nie jest to dowód pełnego runtime UI po realnej turze.
- `playerPracaPool`, `ownerDefaultPodzialPracy` oraz migracja legacy są obecne w snapshot/load. Dostępny test robi JSON round-trip fixture, ale nie ma niezależnego E2E: realne dwie tury → zapis → load → dalsza akumulacja dla player/AI/MP.

## Kryteria 0/100 i 50/50

- Globalne 0% budynków = **FAIL**: preview i end-turn nie pokazują/nie liczą `0/9`; obie ścieżki zwracają `5/4`.
- 50/50 = **PASS tylko dla fixture/kontraktu**: suma i akumulacja 6 + 6 przez dwie tury oraz JSON fixture przechodzą. Brak niezależnego end-to-end runtime save/load/parity.
- `tsc` i testy sąsiednie są zielone, ale nie znoszą FAIL-a kryterium głównego ani problemu izolacji.

## BLOKADY

1. Twardy FAIL live resolvera globalnego splitu: oczekiwane `0/9`, faktyczne `5/4` w preview i end-turn.
2. Nierozstrzygnięty konflikt kanonu: wymagane 0/100 kontra aktywny hard cap minimum 50% budynków, potwierdzony testem `praca-miasto-limit-50-test.cjs`.
3. Worktree ma obce zmiany poza allowlistą, w tym w plikach krytycznych dla tej weryfikacji; nie da się wiarygodnie przypisać ich autorstwa temu ID.
4. Brak pełnego runtime save/load/parity po realnych turach dla player/AI/MP.

## Routing

`BLOCK → ten sam Operator, ten sam pełny ID R-PRACA-PULA-NIEAKUMULUJE-Q1`.

Najpierw owner powinien jawnie rozstrzygnąć, czy w tym runie globalne 0/100 jest legalnym przypadkiem, czy obowiązuje cap 50% z osobnego kontraktu. Następnie Operator powinien pracować w faktycznie czystej izolacji albo otrzymać jawne przypisanie pochodzenia zmian i dostarczyć uzgodniony live test, live 50/50 przez dwie tury, runtime save/load oraz player/AI/MP parity. Po tym samym ID uruchomić ponownie Evaluatora; nie tworzyć nowego runu.

ZMIANY/COMMIT: brak zmian kodu; zapisano wyłącznie ten raport Evaluatora.
DEPLOY/PUSH: NIE WYKONANO
