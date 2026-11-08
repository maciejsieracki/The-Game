STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — ruch i wyznaczanie ścieżki: przejście przez własne jednostki
TEMAT: R-WEB-MOVE-PASS-THROUGH-OWN-UNITS-Q1
GOAL: przez WŁASNE jednostki wolno przechodzić (koszt terenu jak zwykle), przez OBCE (każdy inny właściciel: wojna, pokój, państwa-miasta, barbarzyńcy) nie; połączenie proponowane tylko gdy ruch KOŃCZY się na własnej jednostce; parytet gracz/AI/barbarzyńcy.

## Pomiar PRZED (plik:linia, baza origin/main 522271468)
- Wszystkie ścieżki szły przez `computePath`/`computeReachable` (`gra/src/units/setup.ts`) z zbiorem `occupied` = WSZYSTKIE jednostki (własne i obce): `main.ts` `occupiedForMove` (ok. 13356; użycia: podgląd trasy, klik-ruch `beginMoveSelectedUnitTo`, `planMarchTo`, `executeMarchSegmentForUnit`, `applyMarchSegmentInstant`), `ai.ts` `occupiedExcluding` (891), `barbarians.ts` `occupiedExcluding` (751), `scout-auto-explore.ts` `occupiedExcept` (73), egzekutor AI `main.ts` ~39560 (`blockedKeys` = wszystkie jednostki), planer wojny `warAllInCapital.ts` (`isFreeFor`/`extendWalk`).
- Skutek: własna jednostka w wąskim przejściu = objazd lub brak trasy; obce blokowały tak samo (brak rozróżnienia).
- Propozycja łączenia: `promptMergeIfCoLocated` (`main.ts` ~13525) po ruchu, gdy `coLocatedForMergePrompt` ma rezydentów na heksie końcowym — czyli zależy wyłącznie od heksu KOŃCA ruchu (OK, nie wymagało zmian).
- Ruch Chromium PRZED (scenariusze a–e): NIE_ZMIERZONO (patrz Blokady). Odpowiednik na poziomie funkcji: test nowy, sekcje A–D (mutacja M1 odtwarza stan PRZED i czerwieni A1/B1/C1).

## Zmiany (jedna wspólna zajętość ruchu)
- `gra/src/units/setup.ts`: `MoveOccupancy` (Set = TYLKO obce jednostki/miasta zablokowane + `passThrough` = heksy z własnymi jednostkami), `buildMoveOccupancy`, `cloneMoveOccupancy`, `endBlockedKeys`, `isPassThroughHex`, `trimSegmentEndOffPassThrough`; `computeReachable` przechodzi przez heksy `passThrough`, ale nie zalicza ich do zasięgu (nie wolno tam stanąć). `computePath` bez zmian logiki (własne nie są w zbiorze blokad; cel zawsze dozwolony = łączenie).
- `gra/src/game/planned-march.ts`: segment skrócony budżetem nie kończy się na heksie z własną jednostką (`planPathTurns`, `shouldStopAtObstacle`); gdy w zasięgu jest tylko heks własny, powód postoju `obstacle` ("własna jednostka na trasie — brak wolnego heksu w zasięgu").
- `gra/src/main.ts`: `occupiedForMove` buduje `MoveOccupancy` (+ obce miasta blokują zawsze); klik-ruch przycina skrócony ruch; egzekutor komendy move AI używa `occupiedForMove` (parytet) i dopuszcza stos przyjazny na celu.
- `gra/src/game/ai-city-capture-executor.ts`: kopia zachowuje `passThrough`, przycięcie skróconej trasy nie kończy się na heksie własnym.
- `gra/src/game/ai.ts`, `barbarians.ts`: `occupiedExcluding` → `buildMoveOccupancy`; `firstStep` ucina krok do heksu wolnego (`endBlockedKeys`); `planWarAllInCapital` dostaje `passThrough`.
- `gra/src/game/warAllInCapital.ts`: `nav.passThrough` — `extendWalk` może przejść przez własne, trasa nie kończy się na zajętym heksie.
- `gra/src/game/city-hex-movement.ts`: `addForeignCityBlocks` zachowuje `passThrough` (obce miasto zawsze blokuje).
- `gra/src/game/scout-auto-explore.ts`: obce blokują, własne = przejście, bez zatrzymania na własnej.
- NOWY test `gra/tools/move-pass-through-own-units-test.cjs` (34 asercje + 3 mutacje realnego źródła).
- Testy zaktualizowane z uzasadnieniem: `ai-move-range-test.cjs`, `ai-move-full-range-test.cjs` (tekst mutowanego fragmentu `firstStep` zmienił się na `endBlockedKeys(occ)`), `war-allin-general-path-barb-defense-test.cjs` T7 (rep2 to drugi obrońca domu; remis równoważnych tras ku barbarzyńcy rozstrzyga się inaczej, gdy własne nie blokują Dijkstry; asercja dopuszcza kierunek miasto zbiórki LUB barbarzyńca, nadal NIE stolica).
- Limity stosu: w kodzie nie istnieje limit stosu/przepełnienia (ZMIERZONE: brak STACK_LIMIT/maxStack w logice ruchu); zakończenie ruchu na heksie, który nie przyjmie jednostki (obce miasto) zostaje zablokowane jak dotąd.

## TESTY (logi: `gate-*.txt` w katalogu runu, jedna linia EXIT=)
- `npx tsc --noEmit`: EXIT=0 (`gate-tsc.txt`).
- Nowy test: 34 OK / 0 FAIL (`gate-new-test.txt`); mutacje: M1 przywrócona blokada własnych → A1/B1/C1 CZERWONE; M2 zniesiona blokada obcych → A2/B7/C3/D2 CZERWONE; M3 segment kończący się na własnej (propozycja łączenia przy przejściu) → B3/B4 CZERWONE.
- Regresje PRZED vs PO (worktree bazowy origin/main vs zmiany): `ai-test` 274/20 vs 274/20; `army-concentration`, `army-consolidation`, `army-merge-*` (bounce, colocated, dismiss-bounce, separate-return, mainguard, stackgroupid), `army-split-movement`, `army-stack-ruch`, `ai-army-scattered-merge`, `ai-war-defend-home`, `ai-move-range`, `ai-move-range-collision`, `barb-*` (blacklist, city-behavior, capture-cluster, owner-contract), `border-march-scan`, `city-hex-movement`, `map-road-movement`, `march-attack-queue-persist`, `planned-march`, `rally-point-automarch`, `river-terrain-move`, `scout-auto-explore`, `terrain-hill-movement`, `trade-routes*` — EXIT=0 PO. `ai-move-full-range` 20/0 (wykorzystanie ruchu 84,8% vs 84,5%; czas decyzji 2,69 vs 2,96 ms/ruch — bez wzrostu). `war-allin-general-path-barb-defense` 24/0 po aktualizacji T7.
- Te same czerwone PRZED i PO (pre-istniejące, bez zmiany liczb): `ai-march-avoid-foreign-territory` (C7), `army-stack-commander-identity`, `barb-camp-destruction` (2 FAIL), `egypt-movement-precedence`.
- Determinizm `war-allin-capital-quick` (dwa przebiegi PO identyczne): hashe ZMIENIONE w scenariuszach OFF/aiVsAi/noLandPath (uzasadniona zmiana — AI przechodzi przez własne jednostki), BEZ zmian: `aiVsPlayer 0b2afc75febaa727`, `barbarians c879b6d48293589c`.

## BLOKADY
- NIE_ZMIERZONO: scenariusze Chromium (`?civTest=1`, a–e) PRZED i PO oraz testy żywe (`player-moves-before-ai-turn` część [L], `river-path-adjacency` — przekroczenie czasu także na bazie); wymagają vite build poza repo; pominięte w tej rundzie. Test strukturalny `player-moves-before-ai-turn` [S] PASS.
- NIE_ZMIERZONO: liczba wymuszonych objazdów własnych jednostek w 60 turach / 3 ziarna (przed vs po). Pośredni dowód: `ai-move-full-range` (sim 6 ziaren x 3 typy x 100 tur) bez spadku wykorzystania ruchu i czasu.
- Braki do kontroli Evaluatora: `ai.ts` l.4589 (diagnostyka objazdu strażnika) nadal liczy trasę z zajętością wszystkich jednostek (tylko prośba o przemarsz, nie ruch); `main.ts` podgląd `7199`/`25295` używa pustego zbioru (bez zmian).
- Podgląd hover: korzysta z tego samego `planPathTurns` (przejście przez własne widoczne w trasie).

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (weryfikacja kodu + scenariusze Chromium a–e oraz pomiar objazdów własnych AI), następnie Final Control.
## DEPLOY/PUSH: NIE WYKONANO
## COMMIT: patrz poniżej (SHA dopisany po commicie)
