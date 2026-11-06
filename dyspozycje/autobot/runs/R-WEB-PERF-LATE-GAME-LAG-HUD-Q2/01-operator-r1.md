STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — wydajność późnej gry, część 2 (HUD, granice, koniec tury)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
GOAL: refreshFog / updateHud / buildHudState / refreshTerritoryBorderOverlay na ścieżce kliku (ruch, wejście do miasta, wybór) zredukowane >= 5x lub usunięte z ścieżki; endTurn zmierzony i zredukowany; bez zmiany reguł gry i determinizmu AI.

## Metoda pomiaru
Scenariusz jak w Q1 (seed 1412026, 137 miast, 180 ulepszeń, 321 jednostek). Generacja mapy trwa ok. 8 min (limit wywołania 590 s), więc dodano do harnessu tryb PERF_MODE=save|load (zapis slotu IndexedDB w trwałym profilu Chromium + stały port; wczytanie ok. 45 s). Maszyna współdzielona (load average 14 na 4 rdzeniach) -> wartości bezwzględne zawyżone; podaję minimum z N powtórzeń (best-of-N, przybliża koszt bez rywalizacji) oraz profil CDP. Przed = build z origin/main (4905bac05), po = build z poprawkami, ten sam zapis.

## Znalezione wąskie gardła (profil PRZED, wg czasu włącznego)
1. `collectTurnEvents` = 73% updateHud (20,7 s z 28,5 s): dla KAŻDEGO miasta gracza z pustą kolejką `productionAvailabilityCtxForCity` -> `empireActiveResourceLabelsForOwner` (pętla po wszystkich miastach ownera) -> `getCityResourceAccessForCity`, który liczył też `potential` (collectDepositPotential, skan dysku widoczności) mimo że czytane jest tylko `.active`. O(miasta^2 x promień^2) i to kilka razy na klik.
2. `availableProduction`: `civHasReplacementFor` O(jednostki^2) + `stripDiacritics` (normalize) na każde porównanie.
3. `buildRiverHexSet` budowany od zera na każde `isHexNearRiver` (raz na miasto na odświeżenie HUD).
4. `territoryOwnerAt` liczył promień każdego z 137 węzłów dla każdego heksu; `okolicaTiles` składał i parsował stringi; remis w sortowaniu przez `localeCompare`.
5. `refreshTerritoryBorderOverlay` przebudowywał siatkę granic przy KAŻDYM refreshFog.

## Naprawy (wyłącznie wyniki identyczne, zero zmian balansu/danych)
- `resource-access.ts`: `getResourceAccessForCity` liczy tylko `active`.
- `main.ts`: `empireActiveResourceLabelsForOwner` (odblokowania hodowli raz na ownera, nie na miasto); `cityResourceAccessForCityId(id, activeOnly)`; zakres `withOwnerCtxScope/ownerScoped` wokół pętli w `collectTurnEvents` (składniki kontekstu zależne tylko od ownera liczone raz, poza zakresem zachowanie bez zmian); granice przebudowywane tylko gdy zmieniły się heksy per owner lub kolory (dokładne porównanie zbiorów).
- `production.ts`: zbiór zastąpionych jednostek bazowych raz na przebieg; cache `stripDiacritics` (ograniczony).
- `improvement-build.ts`: memo `buildRiverHexSet` (WeakMap po mapie, klucz kontrolny: referencja ścieżek, liczba ścieżek, liczba punktów).
- `territory.ts`: odrzucenie dalekich węzłów po samej odległości (promień <= max(cap, fort, posterunek)).
- `okolica.ts`: `okolicaTiles` bez stringów/parsowania (ta sama kolejność), kolator zamiast localeCompare (ten sam porządek), filtr terytorium po węzłach w sąsiedztwie miasta (nierówność trójkąta).
- `turn-economy.ts`: szybkie pominięcie heksów bez ulepszeń w `computeTerritoryResourceYieldByCity`.
Pliki z allowlisty: gra/src/{main.ts, game/okolica.ts, game/production.ts, game/resource-access.ts, game/turn-economy.ts, map/improvement-build.ts, map/territory.ts}; gra/tools/{perf-late-game-interaction-live-test.cjs, perf-hud-q2-test.cjs}; ten katalog.

## Wyniki PRZED -> PO (best-of-10/12, ms/wywołanie)
| metryka | przed | po | zysk |
|---|---|---|---|
| refreshD1bHud (updateHud) | 647 | 120 | 5,4x |
| refreshFog (całość) | 872 | 225 | 3,9x |
| collectTurnEvents (profil, 15 powt.) | 20 665 ms | 523 ms | ok. 40x |
| suma profilu 15 powt. | 31,1 s | 7,2 s | 4,3x |
| endTurn (czas ścienny, SwiftShader) | 34,6 s | 31,3 s | 1,1x |
| endTurn: updateHud w EOT | 8 951 ms | 1 693 ms | 5,3x |
| endTurn: JS bez renderu (suma - renderLoop) | ok. 20,6 s | ok. 13,5 s | 1,5x |
Surowe dane: evidence/perf-*.json.

## TESTY (evidence/gate-*.txt, linia EXIT=)
Nowy `perf-hud-q2-test.cjs`: 8/8 (równoważność territoryOwnerAt i filtra terytorium z referencją na 137 węzłach, active-only == full.active, unieważnianie memo rzek, budżet szeroki). PASS: perf-sibling-memo 13/0, okolica, multi-city-overlap, isworkable-silnik, epoka-merge-recruit, brick-production 69/0, mill-river all pass, irrigation-river 30/0, building-resource-visibility 15/0, production-overflow 213/0, cities-buildings-production-owner-contract 53/0, hud-skarbiec 34/0, hud-gross-net-rest 752/0, city-hex-movement, move-pass-through 34/0, river-terrain-move, terrain-hill 10/0, map-road 26/0, army-split 4/0, river-fog-visibility 31/0, ai-move-range 46/0, ai-citizen-hex-sibling 19/0, auto-improvements 46/0, autoimprove-irrigation 42/0, territory-border 9/0, fort-outpost-hard-territory 80/0. tsc --noEmit EXIT=0. ai-test 274/20 (te same FAIL co punkt odniesienia).
Te same wyniki jak przed zmianą (pre-existing, potwierdzone w Q1): ai-fog-test (assert), okolica-load-reconcile 21/23, okolica-ownership-change-reconcile 12/15.

## BLOKADY / NIE_ZMIERZONO
- Cel 5x dla `refreshFog` jako całości NIE osiągnięty (3,9x); dla ścieżki HUD 5,4x. Pozostałe: `previewCityEconomy -> assignWorkedTiles` (ok. 25% reszty; ocena plonów per heks, kandydat: memo plonów heksów), `buildEmpireResourceRows`, `refreshMinimap`, `renderBar`.
- NIE_ZMIERZONO: opóźnienie kliknięcia end-to-end dla ruchu/wejścia do miasta/panelu miasta. Po wczytaniu zapisu renderInfo = 28 881 draw calls (świeża gra: 707), SwiftShader zajmuje 90%+ profilu (renderLoop); to artefakt środowiska LUB osobny problem ścieżki wczytywania zapisu (sceny po regenerateWorldForLoad) — wymaga osobnego tematu. Dla kliku „wybór jednostki”: updateHud 3 866 -> 1 025 ms, refreshFog 930 -> 422 ms (4 powt.).
- NIE_ZMIERZONO: wzrost kosztu z numerem tury (historia/logi/zdarzenia); nie zagrano tur do T80+. Stan zasiany (tura 1).
- Brak zmiany `refreshFog` w zakresie koalescencji do rAF (ryzyko dla testów czytających DOM synchronicznie).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (przegląd inwariantów: zakres ownerScoped nie obejmuje mutacji; memo rzek; podzbiór węzłów terytorium).
DEPLOY/PUSH: NIE WYKONANO
