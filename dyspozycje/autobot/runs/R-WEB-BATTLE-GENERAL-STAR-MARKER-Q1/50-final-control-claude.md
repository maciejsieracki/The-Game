STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1
GOAL: jasna gwiazdka na generale (obie strony) w scenie bitwy; tylko wizualnie, bez zmian reguł/balansu/danych.
ZMIANY/COMMIT: kandydat 5b275ed4611a49a6cf3e74e506c8e747d1c3fdfe (potomek ad422d889: merge-base --is-ancestor = TAK). Diff vs baza: battleScene.ts +1 linia (`this._attachCommanderStar(group, bu)` w `_placeUnitsOneSide`, linia 17905), testy battle-commander-star-test.cjs i battle-commander-star-reset-test.cjs, raporty runs/. Allowlista zachowana (brak main.ts, armyMerge.ts, WERSJE.md, danych). integration_sha = 5b275ed46.

Pokrycie sciezek tworzenia grupy jednostki (buildUnitModel): battleScene.ts 4573 (gwiazdka 4580), 4743 (4750), 5475 (5488), 17898 (17905) = 4/4 z gwiazdka. manualBattle.ts:756 -- modul nieimportowany (dlug, UWAGI).

TESTY (surowe wyjscie, ten FC):
- tsc --noEmit: rc=0.
- battle-commander-star-test: 17 PASS / 0 FAIL.
- battle-commander-star-reset-test: 10 PASS / 0 FAIL; test wywoluje realne `_placeUnitsOneSide` + `_resetDeploySide` (rozstaw, Reset #1, ruch, Reset #2), mutacja na kopii => czerwono.
- 5 bramek: logic-test 213/213; tech-tree-test 20/0; research-test ALL GREEN; unit-replace-test 21/21; combat-test sanity OK (wszystkie rc=0).
- battle-natural-near-range-r6-test: rc=0.

ROZSTRZYGNIECIE ZARZUTOW:
1. Brak zywego Chromium dla Reset -- ODDAL. Reset pokryty testem sceny na realnej funkcji; gwiazdka jest dzieckiem grupy, a jej render (obie strony, 1280x720 i 1400x900) udokumentowany zrzutami r1. Zmiana r2 to jedna linia identyczna z trzema istniejacymi doklejeniami. NIE ZMIERZONO: zrzut Chromium po Reset (harness wejscia r1 nie istnieje juz w repo; nie odtwarzalem).
2. Test nie pokrywal sekwencji -- ODDAL (naprawione w r2 obrony): sekwencja rozstaw -> Reset -> ruch -> Reset zweryfikowana wyzej.
3. Regresja timeoutow -- ODDAL. Zmiana dotyka wylacznie sciezki Reset, ktorej testy battle-* nie wywoluja; Evaluator zmierzyl identyczne timeouty na bazie ad422d889 (collision-arbitration, full-move-strike, neverrout-hold, attack-move-pointer = dlug bazowy, nie regresja); Obrona zmierzyla na wydluzonym limicie 4 testy rc=0 (chariot-r5, near-range-r6, pursuit-move, ranged-approach), ja potwierdzilem near-range-r6 rc=0.
Zadnego NAPRAW.

BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA: (a) NIE ZMIERZONO Chromium po Reset i pelnych 4 timeoutow na wydluzonym limicie (dlug bazowy); (b) manualBattle.ts:756 bez gwiazdki (modul nieimportowany); (c) dlug Rust: REPIN znacznika generala w scenie bitwy; (d) po wdrozeniu rzut oka wlasciciela na gwiazdke w grze.
RUNDY: FC r2 (runda 2/5 tematu).
NASTEPNY KROK: integracja orkiestratora 5b275ed46 -> READY_FOR_DEPLOY (po merge z aktualnym main; wikiBundle bez zmian).
DEPLOY/PUSH: NIE WYKONANO
