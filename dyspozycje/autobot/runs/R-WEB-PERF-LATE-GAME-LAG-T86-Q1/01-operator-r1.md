STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — wydajność późnej gry
TEMAT: R-WEB-PERF-LATE-GAME-LAG-T86-Q1
GOAL: interakcje gracza (klik jednostki, ruch, wejście do miasta, panel miasta) w późnej grze, dużej cywilizacji, mają reagować płynnie (p95 < 150 ms; zadania > 200 ms usunięte lub zredukowane >= 5x).

## Pomiar (PRZED)
Scenariusz: seed 1412026, mapa Standardowy, gracz 40 miast + 6 AI x 15 (137 miast), 180 ulepszeń, +300 jednostek (3/miasto gracza, 2/miasto AI) = 321 jednostek, tura 1 (zasiane, NIE zagrane do T86 — patrz NIE_ZMIERZONO). Chromium headless, SwiftShader, CDP Profiler (200 us). Maszyna współdzielona: load average 18–31 na 4 rdzeniach, więc wartości bezwzględne są zawyżone; liczą się proporcje i przed/po na tej samej maszynie.

Każda interakcja (ruch, wejście do miasta, wybór jednostki) kończy się `refreshFog()` (64 wywołania w main.ts). Koszt jednego `refreshFog` przed: 1214–1719 ms.
TOP wg czasu włącznego (35,5 s / 15 powtórzeń; profil `evidence/profile-before-fog.json`):
1. `computeLostToNearerSiblingByCity` 24,2 s (68%) — wołane z `syncUnitsRender → syncStatChips → _buildBadgeInput → cityGrowthLive → computeView → getExcludeHexKeys → siblingClaimedHexKeysForCity`, czyli RAZ NA KAŻDE MIASTO GRACZA, za każdym razem na liście WSZYSTKICH 137 miast: O(miasta_gracza x wszystkie_miasta x promień^2). Rośnie kwadratowo z rozmiarem cywilizacji, stąd „nie da się grać".
2. `okolicaTiles` (self 12,5 s) i `hexKeysWithinRadius` (6,3 s) — wywoływane z pkt 1 (parsowanie kluczy "q,r" w pętlach).
3. `updateHud/buildHudState` 9,8 s: `projectPlayerFoodProjection → previewCityEconomy` 5,4 s, `computeWorkedMagazynYieldsByCity` 2,9 s, `empireTerritoryResourceRatesForOwner` 2,5 s.
4. `refreshTerritoryBorderOverlay` 1,2 s, `renderBar/refreshMinimap` 2,9/1,6 s.
Draw calls 707, 1,39 mln trójkątów (info, bez zmian).

## Naprawa
`gra/src/game/okolica.ts`: `computeLostToNearerSiblingByCity` jest funkcją czystą; dodano memo (WeakMap po obiekcie mapy, klucz = kolejność + id/q/r/promień/właściciel każdego miasta, max 6 wpisów na mapę). Zero zmian reguł, balansu, danych. Nowy `gra/tools/perf-sibling-memo-test.cjs`, harness `gra/tools/perf-late-game-interaction-live-test.cjs` (zrobiony z perf-large-empire-stress; jego kotwice EOT są zdezaktualizowane na HEAD, więc usunięto instrumentację EOT).

## PO (ta sama maszyna, ten sam seed i scenariusz)
| metryka | przed | po |
|---|---|---|
| `syncUnitsRender` ms/wywołanie | 622 / 731 / 743 / 790 / 1010 | 60 / 30 / 24 / 23 (ok. 25–30x) |
| `refreshFog` ms/wywołanie | 1214 / 1383 / 1408 / 1452 / 1719 | 564 (zimne) / 690 / 367 / 444 (ok. 3,5x) |
| suma profilu 15 powtórzeń | 37,9 s (30,7 s w 1. runie) | 11,3 s (3,3x) |
| `computeLostToNearerSiblingByCity` incl. | 24,2 s | poza top-40 |
Test regresyjny: 40 wywołań w stylu UI = 4,7 ms vs zimne 24 ms (bez memo ok. 980 ms); próg: < 3x jednego zimnego + 20 ms.

## TESTY (logi `evidence/gate-*.txt`, linia EXIT=)
PASS: perf-sibling-memo 10/10, okolica 72/72, multi-city-overlap 55/55, isworkable-silnik 15/15, sibling-exclusion 19/0, city-hex-movement, move-pass-through 34/0, river-terrain-move, terrain-hill-movement, map-road-movement, ai-move-range 46/0, army-split-movement, river-fog-visibility 31/0, tsc --noEmit EXIT=0.
ai-test: 274 passed / 20 failed — identycznie jak punkt odniesienia (hash 274/20 bez zmian).
Pre-existing, identyczne bez mojej zmiany (sprawdzone przez cofnięcie okolica.ts): ai-fog-test (assert W2), okolica-load-reconcile 21/23, okolica-ownership-change-reconcile 12/15. river-path-adjacency: TIMEOUT 280 s (generacja mapy), baseline nie sprawdzony.

## ZMIANY/COMMIT
Allowlista użyta: gra/src/game/okolica.ts; gra/tools/perf-sibling-memo-test.cjs; gra/tools/perf-late-game-interaction-live-test.cjs; dyspozycje/autobot/runs/R-WEB-PERF-LATE-GAME-LAG-T86-Q1/**. SHA: patrz stopka (uzupełniona po commicie).

## BLOKADY / NIE_ZMIERZONO
- NIE_ZMIERZONO: stan z realnej tury 86 (generacja mapy 10–25 min + EOT 30–70 s w tym środowisku; tury nie dograno). Nie odtworzono logów/zdarzeń/historii rosnących w czasie, a tylko skalę miast i jednostek.
- NIE_ZMIERZONO: p95 < 150 ms na realnym GPU. Klatki SwiftShader (uniformMatrix4fv) dominują czas ścienny i są artefaktem środowiska. Cel 150 ms NIE potwierdzony: `refreshFog` nadal 370–560 ms przy obciążeniu 18x na 4 rdzeniach (rzeczywista maszyna prawdopodobnie ok. 3–4x szybsza, nieudowodnione).
- Pozostałe gorące miejsca (rekomendacja na Q2): `updateHud/buildHudState` (`previewCityEconomy` x miasta, `computeWorkedMagazynYieldsByCity`, `okolicaTiles` bez memo), `refreshTerritoryBorderOverlay`; `refreshFog` wołany wielokrotnie na klik.
- Pomiary czasu przez 'mouseup' handler = 0 ms (praca idzie asynchronicznie po animacji), więc nie wnioskować o opóźnieniu kliknięcia z `handlerMs`.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja memo — brak nieaktualnych wyników przy zmianie populacji, właściciela, kolejności; sprawdzenie czy któryś konsument mutuje zwrócone zbiory); rozważyć Q2 na HUD/previewCityEconomy.
DEPLOY/PUSH: NIE WYKONANO
