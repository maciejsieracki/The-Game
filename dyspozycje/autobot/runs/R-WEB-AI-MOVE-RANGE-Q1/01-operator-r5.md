STATUS: DECISION_REQUIRED (kryterium 3 czasu tury NIE spelnione na endTurn w Chromium: pooled x1,12; poprawki 2 i 3 wykonane z testami)
DOMAIN: GAME
TEMAT: R-WEB-AI-MOVE-RANGE-Q1
GOAL: AI, miasta-panstwa i barbarzyncy ida w jednej turze pelnym budzetem ruchu jak gracz (nie 1 heks).
BAZA: bba8a7cf (r4 na wierzchu fe50dd23). Commit r5 na wierzchu. Brak push, brak deploy, brak zmian WERSJE.md.
RUNDY: 5/5 (OSTATNIA). Po tej rundzie brak dalszych rund; decyzja orkiestratora wymagana.

## Decyzja 1 (kryterium czasu) -- POMIAR, NIE SPELNIONE
Metoda: `gra/tools/web-turn-slowdown-measure.cjs` (realny bundle Vite, headless Chromium `/opt/pw-browsers/chromium-1194`, realne "Zakoncz ture" = `__eraTestDebug.endTurn()`, seed 778899, 12 tur, zwykla gra bez wymuszonej wojny). PRE = `git archive fcd86933 gra` zbudowany w scratchpadzie (`dist-pre`), POST = `dist-r5` (ten commit). Logi CSV: scratchpad `out-pre/pre-turns.csv`, `out-pre/pre2-turns.csv`, `out-post/post-turns.csv`, `out-post/post2-turns.csv`.

| bieg | mediana endTurnMs PRE (n=11) | mediana POST (n=11) | x |
|---|---|---|---|
| 1 | 8408 | 9650 | 1,147 |
| 2 | 7913 | 9179 | 1,160 |
| razem | 8221 (n=22) | 9232 (n=22) | 1,123 |

Determinizm (2 przebiegi, ten sam finalHash): PRE 55db05ea x2, POST 0234a677 x2 -- OK. Hashe PRE != POST sa ZAMIERZONE (zmiana zasiegu).
Wniosek: prog x1,10 PRZEKROCZONY (x1,12 razem, x1,15-1,16 w kazdym biegu osobno; rozrzut biegow PRE 6,5-9,4 s, POST 8,0-11,0 s, wiec wynik jest zgodny kierunkowo, ale granica 1,10 nie jest pewnie dotrzymana).
Optymalizacja NIE wykonana w r5: najkosztowniejszym skladnikiem jest `computePath` (units/setup.ts, Dijkstra ze string-keyed Map, r4 profil), wspolny rdzen poza allowlista; zmiana z zachowaniem hashy wymaga osobnego tematu (parytet hashy na wielu seedach). Nie dowiezione w tej rundzie -- zglaszam jako decyzje (a) zaakceptowac x1,12 (koszt wynika z tego, ze jednostki faktycznie docieraja do celu i walcza) albo (b) osobny temat: optymalizacja computePath / cache per tura z parytetem hashy.

## Decyzja 2 (kolizje barbarzyncow) -- WYKONANA
- `gra/src/game/ai-move-range.ts`: nowe pure helpery `buildHexOccupancy` (licznik zajetosci per tura) i `claimHexForMove` (odmawia, gdy heks docelowy zajety; przy sukcesie przenosi licznik).
- `gra/src/main.ts` (~36271-36313): licznik `barbOcc` budowany RAZ przed petla komend barbarzyncow; galezie `move` i `raid` wołaja `claimHexForMove` PRZED zmiana pozycji i PRZED efektami (przejecie miasta, zniszczenie ulepszenia). Import linia 263.
- Test: `gra/tools/ai-move-range-collision-test.cjs` (NOWY): 13 passed / 0 failed. Sekcje: A (dwa barbarzyncy, ten sam heks -> druga odrzucona), B (heks zwolniony wczesniej w turze dostepny), C (stos: heks zwalniany dopiero po wyjsciu obu), D (wiazanie: 2 wywolania guardu w main.ts, 1 licznik per tura), E (mutacja: guard usuniety -> A czerwi, mutacja faktycznie zmienia wynik).
- Zakres: sprawdzany jest heks docelowy komendy (snapshot `occupied` z decideBarbarianMoves nie jest aktualizowany w turze; licznik to naprawia). NIE_ZMIERZONO: pelna gra z dwoma barbarzyncami kolidujacymi w jednym ticku (test sprawdza logike guardu na prawdziwym zrodle, nie cala main.ts).

## Decyzja 3 (bonusy odwiedzin miast dla barbarzyncow) -- WYKONANA (wariant: heks docelowy)
Dowody:
- `applyCityVisitBonusesAlongPath` (main.ts:10893) nalicza bonus tylko gdy `u.ownerId === city.ownerId`; AI wola go na trasie (main.ts:35581). Galaz `move` barbarzyncow (main.ts ~36289) NIE wolala go wcześniej.
- Miasta barbarzynskie tworzone bez budynkow; ale `cityBuilt` NIE jest czyszczone przy przejeciu miasta (brak `cityBuilt.delete` w main.ts; jedyne zapisy: main.ts:3913, 38524, 38758, 39264). Miasto przejete przez barbarzyncow zachowuje budynki -> bonus ma realny efekt.
- Zmiana: po zakonczeniu ruchu/przejeciu (galaz `move`) wolane `applyCityVisitBonusesAtHex(bu, toQ, toR, false)` + `syncUnitsRender()` (main.ts ~36296). Bonus dziala tylko dla wlasnego miasta barbarzyncy.
- ZALOZENIE: komenda barbarzyncy niesie tylko koncowy krok (`decideBarbarianMoves` zwraca `toQ/toR`, nie trase), wiec bonus sprawdzany jest na heksie docelowym, nie na pelnej trasie jak u AI. Przejscie PRZEZ wlasne miasto barbarzyncy w jednej turze NIE daje bonusu -- NIE_ZMIERZONO (wymagaloby dodania trasy do BarbCmdMove, inwazyjne dla ~10 wywolan firstStep).
- Efekt gry: zero dla miast barbarzynskich bez budynkow; dla przejetych miast z budynkami -- bonus pancerza/parametrow jak u AI.

## Testy (r5, commit na wierzchu)
- `npx tsc --noEmit`: exit 0.
- Vite bezposredni build (`node node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-r5`): exit 0, 69 871 kB.
- `ai-move-range-collision-test.cjs`: 13 passed, 0 failed (NOWY).
- `ai-move-range-test.cjs`: 46 passed, 0 failed.
- `war-allin-capital-test.cjs`: 95 passed, 0 failed.
- `barbarzyncy-krazenie-test.cjs`: 249 passed, 0 failed.
- `logic-test.cjs`: LOGIC OK 213/213.
- `barb-city-behavior-test.cjs`: 178 passed, 0 failed.
- `ai-test.cjs`: 276 passed, 18 failed (baseline dispatchu bez zmiany).
- `git diff --check`: czysto.

## Pliki poza allowlista
Brak. Zmienione: gra/src/game/ai-move-range.ts (allowlista: modul pomocniczy z r3), gra/src/main.ts (okablowanie), gra/tools/ai-move-range-collision-test.cjs (NOWY, allowlista), dyspozycje/autobot/runs/R-WEB-AI-MOVE-RANGE-Q1/01-operator-r5.md.

## BLOKADY
1. Kryterium 3 (czas tury endTurn x1,10): NIE spelnione (x1,12 pooled, n=22 na strone). Decyzja orkiestratora (a) lub (b) jak wyzej.
2. Pelna gra z kolizjami barbarzyncow i bonusem przez trase: NIE_ZMIERZONO.

NASTEPNY KROK: decyzja orkiestratora dla kryterium 3; potem Evaluator r5 na nowy SHA (commit r5).
DEPLOY/PUSH: NIE WYKONANO
