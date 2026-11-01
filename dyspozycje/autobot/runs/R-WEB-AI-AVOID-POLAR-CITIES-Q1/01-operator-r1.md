STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-AVOID-POLAR-CITIES-Q1
GOAL: AI nie zakłada miast (stolice startowe, MP, osadnicy/kolonizacja) na heksie polarnym i unika jego sąsiedztwa, gdy są lepsze tereny; gracz bez ograniczeń.

## Diagnoza (PLIK:LINIA, stan przed poprawką)
- Biały heks = `TerenBazowy.Polarny` (`gra/src/types/hex.ts:23`, żywność 0, jednostki lądowe nie wchodzą: `units/setup.ts:660`).
- Stolice/MP: pula kandydatów `ladowe` w `computeClusters` (`map/clusters.ts` ~3441) wykluczała tylko Morze/Góry/PłytkieMorze — Polarny wchodził do puli. Dodatkowo `isSpawnHabitableTerrain` (clusters.ts:363) liczył Polarny jako ląd -> bramka `passesLocalLandGate` przepuszczała polarne heksy. Polarny jest odfiltrowany tylko w `cluster-spawn.ts:75` (`landHexesFromMap`, gracz/rywale tego samego typu) i `startScoring.ts:44` (gracz) — to nie ratowało stolic AI innych typów (`aiStartHexes`).
- Osadnicy/kolonizacja: `findCityFoundingHex` (`game/ai.ts` ~4740) nie wykluczał Polarnego; `canFoundCity` (`cities.ts:1163`) odrzuca tylko wodę i góry. Polarny ma plon 0 (< `ekspansja_min_score_hex`=3) więc po pierwszym mieście praktycznie odpada, ale sąsiedztwo polarne nie było karane.
- Bonusowe miasto trudności (`ai-difficulty-bonus.ts` `pickBonusCityHex`) — poza allowlistą, patrz Blokady.

## Pomiar PRZED (Standardowy 168×120, rzeki wyłączone dla czasu: kontynenty/pangea/wyspy × 5 ziaren: 4242,7777,1001,2024,31337)
Plan startowy (`buildClusterStartPlan`; 56 miejsc/mapę, 15 map; 825 AI/MP): na heksie polarnym 20 (wszystkie AI: pangea 2, wyspy 18; kontynenty 0), promień<=1: 33, promień<=2: 43.
Picker-sim kolonizacji (49 AI, 15 iteracji `planCityFounding`, kontrola `canFoundCity`+terytorium): miasta AI łącznie 3846; na polarnym 20, r<=1 109, r<=2 170 (założone przez osadników na polarnym: 0, r<=1: 76).
## Pomiar PO
Plan: na polarnym 0 (z 20), r<=1 20 (z 33), r<=2 25 (z 43).
Sim: miasta AI 3810 (-0,9%), na polarnym 0, r<=1 36 (z 109), r<=2 51 (z 170); założone przez osadników r<=1: 16 (z 76). Liczba miast AI nie spadła istotnie (szum układu map).
Pozostałe r<=1 po poprawce: głównie mapy Wyspy (małe wyspy w pasie polarnym, ograniczenia separacji stolic/pasma morza — kandydat niepolarny bez naruszenia twardych bramek nie istnieje).

## ZMIANY / COMMIT
- `gra/src/map/clusters.ts`: Polarny poza `ladowe` (fallback do pełnej puli tylko gdy cały ląd polarny, z `console.warn`); `isSpawnHabitableTerrain` wyklucza Polarny; nowe `polarProximityTier` (3 sam, 2 r1, 1 r2) jako PIERWSZY klucz sortowania kandydatów stolic/MP (obie funkcje sortujące) + twardy zakaz tieru 3 w `pickSpawnHexWithCapitalGates` (pomijany dla trybu gracza `requirePlayerMassGate` i gdy pula nie ma niepolarnych).
- `gra/src/game/ai.ts`: `aiPolarNeighbourhoodPenalty` + `findCityFoundingHex`: heks Polarny zakazany, o ile jest kandydat niepolarny (ostatni fallback z logiem); kara rankingowa za polarne sąsiedztwo (pełna r1, połowa r2) TYLKO w rankingu (po progu minScore, więc nie ogranicza liczby miast).
- `gra/data/ai-params.json`: nowy klucz `ekspansja_kara_polarna_sasiedztwo` = 8 (0 wyłącza).
- Nowe testy: `gra/tools/ai-avoid-polar-pick-test.cjs` (syntetyczne P1-P6), `ai-avoid-polar-plan-test.cjs` (plan, twarda asercja 0 polarnych; `--measure` raport), `ai-avoid-polar-sim-test.cjs` (picker-sim, `GRA_ROOT` dla bazy).
- Gracz: bez zmian (`startScoring.ts`, `cluster-spawn.ts`, `cities.ts` nietknięte).
- COMMIT: patrz SHA w końcowej odpowiedzi (commit na gałęzi worktree; PUSH NIE).

## TESTY
- `gate-tsc.txt`: tsc --noEmit EXIT=0.
- `gate-pick.txt`: 16/16 PASS. Mutacje: (a) wyłączony zakaz polarnego -> FAIL P1b/P1c/P4b; (b) wyłączona kara -> FAIL P5b; przywrócono, 16/16.
- `gate-plan.txt`: pangea/wyspy × {4242,7777}: 0 polarnych (przed na tych 4 mapach: 9).
- `gate-sim-before.txt` / `gate-sim-after.txt`: tabele PRZED/PO.
- Regres: 61 testów ai-*/cluster-*/capital-*/mp-spawn/civ-matrix: 47 PASS po poprawce. 14 nie-zielonych: 9 (ai-balans-step3, ai-city-render-batch, ai-dlug-porzadki-q1, ai-fog, ai-home-defense-vs-barbarians, ai-zdobycie-miasta-adiacencja, ai-major-economy, ai-praca-split-parity, civ-matrix-ai-diplomacy-wiring) — identycznie czerwone na HEAD (zmierzone z bazowymi plikami w tym samym worktree, `regress-ai-*.txt`); 3 testy przeglądarkowe (ai-buduje-budynki, ai-general-war-campaign-live, ai-wojny-zwykle-cap-dwa-miasta) wieszają się w sandboxie (Chrome) — NIE_ZMIERZONO; `capital-sep-pangea-test` PASS 3/3 po poprawce (z rzekami, pełny przebieg); `cluster-start-test` >580 s — NIE_ZMIERZONO. `ai-test` z dispatchu: nie ma pliku o tej nazwie (NIE_ZMIERZONO).
- Brak spadku: AI miasta 3846 -> 3810 (picker-sim). Rzeczywisty "turn 100" przez `decideAITurn`: NIE_ZMIERZONO — w harnessie `decideAITurn` nie założył żadnego miasta (patrz obserwacja niżej), więc użyto picker-sim 15 iteracji.

## OBSERWACJA POZA ZAKRESEM (DECYZJA_WYMAGANA)
`hexCityScore` (`ai.ts` ~1212) wyszukuje plon po `t.Teren === hex.terenBazowy`, a w `data/terrain-yields.json` nazwy są z diakrytykami ('Łąka','Równina','Wzgórza'), id w kodzie 'laka','rownina'... — dopasowanie nigdy nie zachodzi -> plon każdego terenu = 0, więc przy `ekspansja_min_score_hex`=3 kolonizacja AI (`planCityFounding`) niemal nie znajduje kandydatów w realnych danych. Sim normalizuje nazwy po stronie testu (przed i po identycznie). Zmiana globalnie wpłynie na tempo ekspansji AI — nie ruszane; wymaga decyzji właściciela/osobnego tematu.

## BLOKADY
- `pickBonusCityHex` (`game/ai-difficulty-bonus.ts`) — poza allowlistą; może teoretycznie wybrać polarne sąsiedztwo stolicy (stolice już nie są polarne). Propozycja: osobny mini-temat.
- Reguła nie ma zakazu w `canFoundCity` (gracz ma pozostać nieograniczony).

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (Sonnet 5.5): odtworzyć `gate-*` i pomiar PRZED/PO (`GRA_ROOT` na bazie HEAD), zweryfikować mutacje i brak regresu; ocenić obserwację hexCityScore.
## DEPLOY/PUSH: NIE WYKONANO
