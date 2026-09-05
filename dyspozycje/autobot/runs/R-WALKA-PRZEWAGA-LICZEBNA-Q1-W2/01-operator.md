# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2
MODEL+EFFORT: Sonnet 5, effort medium (C-052)
GOAL: bitwa taktyczna 3D — (1) obrońca kontratakuje tylko PIERWSZEGO atakującego
w danej turze, bez wyjątku dla fortyfikacji i miast; (2) startowa kara morale
`min(65%, 50%·log10(r))`, `r` = stosunek MOCY ważonej bieżącym HP, liczona RAZ.

## ZMIANY/COMMIT

Baza: `487b0cfc`. Gałąź `autobot/R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2`. Wyłącznie allowlista:

- `gra/src/game/combat.ts` — `DefenderCounterBudget` (budżet kontrataków w skali
  TURY), `startingMoralePenaltyFrac`, `hpWeightedFieldPower`, `powerAdvantage`,
  `applyStartingMoralePenalty`, `loadStartingMoralePowerParams`.
- `gra/src/battle/battleScene.ts` — pole `_counterBudget`; reset w `_beginTurn`;
  guard `canCounter` w `_defenderCounters`; `consume` w `_doMeleeAttack`; nowa
  metoda `_applyStartingMoralePowerPenalty()` wołana raz w `_startBattle`.
- `gra/data/combat-params.json` — `morale_przewaga_mocy.wspolczynnik_proc = 50`,
  `sufit_proc = 65` (dwa nazwane pola, nie magiczne wartości w kodzie).
- NOWE bramki: `gra/tools/walka-jeden-kontratak-test.cjs`,
  `gra/tools/walka-morale-przewaga-mocy-test.cjs`.

`auto-battle-power.ts` i `auto-battle-params.json` (węzeł W1) **tylko czytane** —
`isFieldBattleUnit` importowany; zero modyfikacji. `git diff --check` czysto.

## POZIOM WPIĘCIA (anty-samooszukiwanie, tryb 2)

GOAL 1 wpięty na poziomie TURY (`battleScene`), nie w pętli rund `resolveCombat`.
Pętla `resolveCombat:1049-1064` jest **nietknięta** — CZĘŚĆ E bramki 1 uruchamia
prawdziwy `resolveCombat` i asertuje `linie DEF === linie ATK` (12 rund melee,
12 kontrataków): wewnątrz JEDNEGO starcia kontratak nadal pada w każdej rundzie.

## TESTY

Trzy obowiązkowe przebiegi:

- **(a) czysta baza** (`git stash` samych źródeł, bramki zostają): gate 1 exit=1
  „nie eksportuje DefenderCounterBudget”; gate 2 exit=1 „nie eksportuje
  startingMoralePenaltyFrac”. Obie CZERWONE.
- **(b) po zmianie**: `walka-jeden-kontratak-test` 24/24, `walka-morale-przewaga-mocy-test`
  68/68.
- **(c) mutacja punktu 5** (dopisane `u.moraleMax *= (1-frac)`): kryterium 4
  CZERWIENIEJE — 63/68, w tym „ułamek morale słabszej strony startuje poniżej
  100%” pokazuje **100.0%**, czyli dokładnie zniweczony efekt z dispatchu.
  Dodatkowo mutacje GOAL 1: usunięcie `canCounter` → 23/24; usunięcie
  `beginTurn()` → 23/24. Wszystko przywrócone.

Bramki referencyjne: `logic` 213/213, `tech-tree` 19/19, `research` 33/33,
`unit-replace` 13/13, `combat` 6/6. Kryterium 8: `battle-roster` 7/7,
`battle-summary` OK, `battle-hp-display` 7/7, `teren-walki-etapy` 33/33,
`army-hunger-combat` 13/13. **Żadna istniejąca bramka nie wymagała aktualizacji
zaszytych wartości.** `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów.

## BLOKADY

- `map-field-battle-test.cjs` exit=1, `TypeError: import_meta.glob is not a function`
  — potwierdzone samodzielnie jako identycznie czerwone na czystej bazie (przy
  zestashowanych zmianach). Znana INFRA, temat
  `P-BRAMKA-MAP-FIELD-BATTLE-INFRA-CZERWONA-Q1`. Nie jest defektem tej pracy.

## NOTY (stąd PASS-WITH-NOTES)

1. `combat-params.json` jest opisany jako generowany z `panele-sterowania/export-c.py`;
   nowa sekcja dopisana ręcznie, bo generator jest poza allowlistą. Do rozstrzygnięcia
   przez orkiestratora, czy zakładać osobny temat na dopisanie mapowania.
2. Kara nie jest klampowana do `fleeMorale`: przy sufi­cie 65% i wysokim progu ucieczki
   jednostka może startować poniżej progu. Dyspozycja tego nie rozstrzyga („startuje
   BLIŻEJ progu ucieczki”), więc zostawione zgodnie z literą GOAL 2.
3. Brak weryfikacji w żywej przeglądarce — temat jest arytmetyczny, nie wizualny/UX.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high) — `02-evaluator.md`
DEPLOY/PUSH: NIE WYKONANO
