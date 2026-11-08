STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-MOVE-PASS-THROUGH-OWN-UNITS-Q1
RUNDA: 2/5 (obrona)

Z1 PRZYJMUJE: main.ts checkBarbCampDestroyedAt - przywrocono `clearedBarbCampHexes.add(keyOf(q, r));` (resztka mutacji). grep MUTATION w gra/src = 0.
Z2 PRZYJMUJE: barb-camp-blacklist-test 19/0 (bylo 18/1). barb-camp-destruction 83/2 = identycznie jak baza 522271468 (2 FAIL zastane).
Z3 PRZYJMUJE CZESCIOWO: pomiar T7 (rep2 21,28): baza -> (23,28), po zmianie -> (21,30). W bazie krok zblizal i do miasta, i do barbarzyncy (remis rownowaznych tras), teraz tie-break idzie ku barbarzyncy, bo rep1 nie blokuje Dijkstry. Nie jest to marsz na stolice wroga. Asercja zaostrzona: dodano warunek, ze krok NIE zbliza do ENEMY_CAPITAL (poza brakiem targetCityId). 24/0.
Z4 CZESCIOWO: ai.ts requestWarMarchPassage - zajetosc przez buildMoveOccupancy (wlasne = przejscie) - PRZYJMUJE. main.ts 7199 to heurystyka wyboru wodza (pusta zajetosc, bez wplywu na ruch), 25294 to hook testowy pathLen - ODRZUCAM jako "podglad gracza"; podglad/zasieg gracza uzywa occupiedForMove (reachableWithMergeTargets). Chromium a-e oraz liczba objazdow AI 60 tur x 3 ziarna: NIE_ZMIERZONO (brak vite build poza repo). Pokrycie zastepcze: move-pass-through-own-units-test 34/0 z mutacjami.

TESTY: tsc EXIT=0; move-pass-through 34/0; barb-camp-blacklist 19/0; barb-city-behavior 178/0; barb-city-capture-cluster 97/0; planned-march 18/0; army-merge-* zielone; ai-war-defend-home 30/0; army-concentration 56/0; ai-army-scattered-merge 33/0; ai-move-range 46/0, collision 12/0; scout-auto-explore 25/0; city-hex-movement 13; trade-routes 96/0; army-stack-ruch 5/0; army-split-movement 4/0; army-consolidation wiring 10/0; war-allin-general-path-barb-defense 24/0.
DEPLOY-PUSH: NIE WYKONANO
