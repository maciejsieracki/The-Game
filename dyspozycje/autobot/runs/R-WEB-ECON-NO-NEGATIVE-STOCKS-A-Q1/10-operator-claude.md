# R-WEB-ECON-NO-NEGATIVE-STOCKS-A-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-A-Q1
GOAL: czysta, tylko-odczytowa projekcja skarbca (złoto) i spichlerza państwa (żywność) PO ticku tury,
dla dowolnego ownera (gracz i AI, bez gałęzi po ownerId), zgodna z realnym tickiem w testach
porównawczych; projekcja nie mutuje stanu.

ZMIANY/COMMIT:
- baza: c43597936 (origin/main jest jego przodkiem; `git merge origin/main` = Already up to date)
- `gra/src/game/empire-food.ts` (+14): `snapshotEmpireFoodRuntime()` / `restoreEmpireFoodRuntime()` —
  migawka i przywrócenie globalnego cache HUD (`_lastTicks`, `_maxCapByOwner`) wokół wywołania
  `advanceEmpireFood` na kopii stanu. Logika `advanceEmpireFood` NIE zmieniona.
- `gra/src/game/no-negative-stocks.ts` (+97): `projectTreasuryAfterTick`, `projectEmpireFoodAfterTick`,
  `projectNnsAfterTick`, typy `NnsFoodProjectionInput` / `NnsFoodProjection`.
  - Skarbiec: `skarbiec + sumEconomyForOwner(econ, owner).pieniadz − utrzymanieRazem (gdy > 0)`,
    bez podłogi do 0 (symetria z blokiem „Bank treasury” w main.ts).
  - Spichlerz: REALNE `advanceEmpireFood` na klonie `states`; prognoza = `spichlerzStolicy − wojsko`
    (wartość PRZED klamrą do 0 i capem; cap działa tylko w górę, więc nie zmienia znaku). Zwraca też
    `zapasyPoRealne` (wartość zapisywana przez tick) i `glodWojska`.
  - Stan wejściowy (`states`, `econ`) i runtime HUD są przywracane po projekcji (`finally`).
- `gra/tools/no-negative-stocks-projection-test.cjs` (nowy): 47 asercji, 8 scenariuszy + mutacje.
- Nie zmieniono: `turn-economy.ts`, `main.ts`, `gra-robocza/`, `rust-port/`, `WERSJE.md`.
- Commit: patrz pole sha w StructuredOutput (commit zawiera tylko 3 pliki powyżej + ten raport).

TESTY (liczby z surowego wyjścia):
- `npx tsc --noEmit` -> exit 0 (bez błędów)
- `node tools/no-negative-stocks-projection-test.cjs` -> `47 passed, 0 failed`, exit 0
- `node tools/no-negative-stocks-test.cjs` -> `25 passed, 0 failed` (istniejący, bez regresji)
- `node tools/gold-deficit-test.cjs` -> `55 pass, 0 fail`
- `node tools/empire-food-b5-test.cjs` -> `34 pass, 0 fail`
- `node tools/magazyn-food-cap-bez-magazynu-test.cjs` -> `WYNIK: 16 PASS, 0 FAIL`
- `node tools/food-hodowla-test.cjs` -> `24 OK, 0 FAIL`
- `node tools/simple-food-rule-no-toggles-test.cjs` -> `36 OK, 0 FAIL`
- `node tools/logic-test.cjs` -> `LOGIC OK (213/213)`
- `node tools/research-test.cjs` -> `ALL GREEN`
- `node tools/combat-test.cjs` -> `All sanity checks passed.`
- `node tools/mgla-sciezka-inwariant-test.cjs` -> `41 pass, 1 fail` — FAIL dotyczy `src/game/ai.ts`
  (linie 3741, 3776-3777, 3824: zapisy `q/r` jednostki w symulacji AI), NIE pliku tego tematu.
  Zgłoszenie #270 w rejestrze (`mgla-sciezka-inwariant 41/1`, ECHO właściciela) — problem istniał przed
  tym tematem; ten temat nie dodaje zapisów pozycji jednostki (`grep` po zmienionych plikach: brak `.q =`).
  NIE_ZMIERZONO na bazie c43597936 osobno (nie uruchamiałem na czystej bazie; wniosek z treści FAIL i
  z faktu, że zmienione pliki nie przesuwają jednostek).
- NIE uruchomiono pozostałych bramek z §6 R-PROC-AUTOBOT (mapa, AI-budynki, karta encji, bitwa na polu
  itd.) — NIE_ZMIERZONO; Evaluator powinien je uruchomić na kandydacie.

Dowody kryteriów dispatchu:
- (a) projekcja == realny stan po ticku: 8 scenariuszy (S1 nadwyżka; S2 armia zjada spichlerz do < 0;
  S3 skarbiec < 0; S4 oba < 0; S5 stary zapis ujemny; S6 sufit capu 50; S7 parytet owner 0 vs 1;
  S8 wolne tury). Dla każdego: skarbiec proj == realny (bez podłogi); `min(cap, max(0, spichlerzPo))`
  == realny zapas; `glodWojska == (spichlerzPo < 0)`; ręczne wartości oczekiwane.
- (b) brak mutacji: deep-snapshot `states` i `econ` przed/po projekcji oraz `getLastEmpireFoodTick`,
  `getEmpireFoodReserve`, `getEmpireFoodMaxCap` przed/po — bez zmian.
- (c) mutacja: zmiana `pieniadz` o −10 daje 140 zamiast 150; zmiana `utrzymanieRazem` 0→7 daje 143 —
  oczekiwanie wprost (150/143) czerwieni się przy mutacji.
- (d) tsc 0; testy powiązane zielone (lista wyżej).

BLOKADY:
- Projekcja jest odwzorowaniem arytmetyki bloku „Bank treasury” (main.ts), NIE wywołaniem main.ts.
  Test porównuje projekcję z realnym `advanceEmpireFood` (na prawdziwym stanie) i z ręcznie
  arytmetycznym skarbcem; nie uruchamia prawdziwego `endTurn()`. Pełny dowód parytetu z main.ts
  wymaga testu headless na realnym ticku (poza allowlistą tego tematu).
- Projekcja NIE jest jeszcze podpięta do main.ts / UI (blokada „Zakończ turę”, komunikat, równoważenie AI)
  — to podtematy B i C (zgodnie z #367), poza zakresem tego tematu.
- Koszty kolejki rekrutacji/budowy i zakupy poza ticku NIE są w projekcji (nie sprawdzono, czy są
  pobierane w ticku czy przy zleceniu — NIE_ZMIERZONO). Projekcja przyjmuje `econ` jako dane wejściowe.
- Kontrakt wołającego (B): `econ` musi być PO autoracjach (`recomputeCityFoodBalancesInEcon` +
  `refreshEconomyFoodTotals`, jak w main.ts ~39340–39360) — inaczej projekcja zjedzie z realnym tickiem.

RUNDY: 1/5 (bez Obrony; Operator tylko zgłasza do Evaluatora)
Ostatni werdykt: brak (runda pierwsza)

NASTĘPNY KROK: Evaluator (SONNET): niezależny przegląd allowlisty (empire-food.ts snapshot/restore,
no-negative-stocks.ts), uruchomienie pełnych 5 bramek z §6 oraz ocena, czy 8 scenariuszy pokrywa
kryteria (w tym przypadek spichlerz < 0 przy skarbcu > 0 i odwrotnie).

UWAGI-DLA-ORKIESTRATORA:
- Decyzja projektowa do rozstrzygnięcia przez orkiestratora przed podtematem B: prognoza spichlerza
  jest PRZED klamrą do 0 (ujemna = niedobór). Realny tick zapisuje 0 i ustawia `glodWojska`. Blokada
  gracza powinna opierać się na prognozie ujemnej (zgodnie z dispatchem), nie na zapisie.
- Znalezisko poza zakresem: `ai.ts` (linie 3741, 3776-3777, 3824) zapisuje `q/r` jednostek w symulacji
  — to jest przedmiot zgłoszenia #270 / mgla-sciezka-inwariant (41/1). Nie ruszano.
- Nie wywoływano żadnych narzędzi tworzących sesje/zadania ani run_in_background.

DEPLOY/PUSH: NIE WYKONANO
