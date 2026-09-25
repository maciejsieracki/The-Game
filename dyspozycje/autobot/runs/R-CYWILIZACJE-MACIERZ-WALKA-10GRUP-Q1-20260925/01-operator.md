STATUS: PASS
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-WALKA-10GRUP-Q1-20260925
GOAL: Podłączenie civ-matrix.json jako źródła prawdy dla mechanizmów walki, ruchu, obrony struktur, desantu i rekrutacji.
ZMIANY/COMMIT: brak commitu; dopisano wyłącznie G8 w gra/data/civ-matrix.json (Grecy i Fenicjanie: walka_atak_morska=0.5, walka_obrona_morska=0.5) oraz test Galery w gra/tools/civ-bonusy-test.cjs. gra/src/game/economy.ts nie ma diffu — pusty artefakt nie występuje.
TESTY: PASS — civ-bonusy-test 36/36; combat-test 6/6; structure-defense-bonus-test 8/8; civ-matrix-greece-test 329/329; civ-matrix-semantic-labels-test 233/233; walka-jeden-kontratak-test 24/24; walka-morale-przewaga-mocy-test 123/123; civ-matrix-meta-roster-wiring-test 63/63; tsc --noEmit (TypeScript 5.9.3); git diff --check.
DANE: paramDefs 93; 15 profili mają komplet 93 wartości; zmiana G8 zwiększa łączną liczbę zmienionych wartości Matrixa z 9 do 13. Pozostałe 13 cywilizacji pozostaje z wartościami morskimi 0.
IMPLEMENTACJA: unitCombatCategory({ typNazwa: 'Galera', rola: 'Morska', counterTyp: 'Naval' }) zwraca morska; civCombatStatMultipliers daje Grekom +0.5 ataku i +0.5 obrony dla Galery; filtr preBattle Greków wzrósł z 4 do 6 modyfikatorów.
BLOKADY: brak. Browser runtime nie był wymagany dla tej wąskiej poprawki danych/testu; deploy/push/merge zabronione.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator — niezależny readback diffu, wygaszonych wpisów civs.json i seamów runtime; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
