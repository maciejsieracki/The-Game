# CYWILIZACJE → MASTER : moduły AI gotowe do wpięcia (handoff + instrukcja + DoD)

Data: 2026-06-25 | Od: **CYWILIZACJE** | Dla: **MASTER (integracja/silnik)** | Status: **GOTOWE DO WPIĘCIA**

Wszystkie moduły są CZYSTE (no DOM/THREE), przetestowane własnymi harnessami, NIEwpięte do `main.ts` (wpięcie = master). Poniżej API + dokładna instrukcja wpięcia w pętlę tury + DoD.

## Moduły i API (gra/src/game/)

### ai.ts — strategia rywala NA MAPIE
- `decideAITurn(playerId, units, cities, map, data, opts?) -> AICommand[]`
  - `opts`: `{ civType?, cityBuildings?, poziomTrudnosci?: 1|2|3, canAfford?, clusterCenter?, clusterRadius? }`
  - `canAfford?(cityId,buildingId)=>boolean` — OPCJONALNY gate budzetu (pkt5); silnik/EKONOMIA dostarcza (koszt vs skarbiec). Gdy brak -> bez filtra. Gdy wszystko odfiltrowane -> fallback (produkcja nie blokowana).
  - `clusterCenter?{q,r}` + `clusterRadius?` — OPCJONALNY bias ekspansji w obrebie klastra typu (pkt3); MAPA dostarcza pozycje. Gdy brak -> obecne zachowanie.
  - `AICommand`: `{type:'build',cityId,buildingId}` | `{type:'move',unitId,toQ,toR}` | `{type:'attack',unitId,targetUnitId}` | `{type:'foundCity',unitId}` | `{type:'endTurn'}`
  - Silnik: w turze gracza‑AI woła raz, potem WYKONUJE komendy po kolei aż do `endTurn`.
- `loadDifficultyParams(data, poziom:1|2|3=2) -> { bonusProdukcja, bonusNauka, startoweJednostki, startoweMiasta, bonusWalka }`
  - `bonusProdukcja` jest już uwzględniony w `decideAITurn` (score produkcji). POZOSTAŁE pola silnik stosuje sam: `startoweJednostki`/`startoweMiasta` przy spawnie startowym AI, `bonusWalka` w resolverze walki, `bonusNauka` w produkcji nauki AI.
- `chooseAIResearch(techData, ukonczone:Set|string[], opts?) -> string|null`
  - Silnik: gdy slot badań AI pusty → `const t = chooseAIResearch(data.tech, new Set(rs.ukonczone), { mods, myCitiesCount, underThreat, allBuiltBuildings }); if (t) rs = startResearch(rs, t);`

### victory.ts — warunki zwycięstwa
- `checkVictory({ players, cities, gracz, epokaKoncowa?, naukaUkonczona?, liczbaOsadnikow? }) -> VictoryResult|null`
  - Silnik: po KAŻDEJ turze dla każdego żywego gracza; `VictoryResult{winner, rodzaj:'dominacja'|'nauka'|'przegrana'}` → ekran końca.
  - `players` = rzut: `{id:number, typCywilizacji:string, ai:boolean}`; `epokaKoncowa`/`naukaUkonczona` z silnika.

### barbarians.ts — neutralni (owner -1)
- `barbariansActive(turn, params)`, `loadBarbParams(data)`, `spawnCamps(map, existing, cities, params, seed)`, `tickCamps(camps, barbUnits, allUnits, map, params) -> {camps, spawns}`, `decideBarbarianMoves(barbUnits, playerUnits, cities, camps, map, params) -> BarbCommand[]`
  - Silnik trzyma `camps: BarbCamp[]` w stanie gry. Co turę (gdy `barbariansActive`): `spawnCamps` (jeśli < max) → `tickCamps` (twórz jednostki z `spawns`, ownerId=-1) → `decideBarbarianMoves` (wykonaj move/attack). `loadBarbParams` ma FALLBACK (klucze `barbarzyncy_*` można dodać do panelu później).

## Instrukcja wpięcia (handler tury AI, „N")
1. Dla każdego gracza‑AI: `cmds = decideAITurn(id, units, cities, map, data, {civType, cityBuildings, poziomTrudnosci})` → wykonaj `cmds`.
2. Badania AI: jeśli slot pusty → `chooseAIResearch(...)` → `startResearch`.
3. Barbarzyńcy: `spawnCamps`/`tickCamps`/`decideBarbarianMoves` jak wyżej.
4. Po turze: `checkVictory(...)` dla każdego gracza → ekran końca jeśli wynik.
5. Spawn startowy / trudność: `loadDifficultyParams` (startowe_* + bonus_walka + bonus_nauka).

## DoD (kryteria odbioru)
- Build OK (`npx vite build --outDir /tmp/civ-dist`), tsc bez błędów dla tych modułów.
- Testy zielone: `node tools/ai-test.cjs` (69/0), `node tools/research-test.cjs` (33/0), `node tools/barbarians-test.cjs` (53/0).
- W grze: AI co turę buduje/rusza się/atakuje/zakłada; jednostki bez celu NIE stoją (fallback); barbarzyńcy spawnują i atakują; sprawdzenie zwycięstwa działa; różne poziomy trudności dają różnicę.
- Sędzia mastera wg powyższego DoD przed kanonem.

## OTWARTE (nie blokują wpięcia core, ale do uzupełnienia)
- pkt3 ekspansja klastrowa (~9 typu): czeka na format startowego rozmieszczenia od MAPA.
- pkt5 kontrola budżetu produkcji (koszt vs skarbiec): czeka na kontrakt od EKONOMIA.
- `barbarzyncy_*` w panelu (teraz FALLBACK).
Te trzy są addytywne — można wpiąć core teraz, dopiąć je później.
