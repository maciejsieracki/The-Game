STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TURN-SLOWDOWN-Q2
GOAL: Znaleźć i naprawić przyczyny rosnącego czasu tury i otwarcia miasta w dalszych turach (zgłoszenie: tura 72).
RUNDY: 1/5 · Operator (Opus 5.5 medium) · baza `origin/main` c11f5087

> **ERRATA (runda 2, `02-obrona-r2.md`):**
> - Kryterium (4) liczone na czasie JS NIE jest spełnione: tura ×2,50, panel ×1,84. Wcześniejsze „spełnione” ×1,26 dotyczyło czasu ściennego z narzutem swiftshadera.
> - „Żadna funkcja >5%” jest fałszywe: `computeTerritoryResourceYieldByCity` ma 10,6% czasu JS panelu T73.
> - Pamięć cyfr Mocy jest w `render/unitStatPlate.ts:545`, nie :539.
> - Streszczenia profili z plik:linia są w `evidence/r2-profile-*.txt`.

## (A) Pomiar — konfiguracja
`gra/tools/web-turn-slowdown-measure.cjs`: bundle z Vite (`--minify false`), headless Chromium 1194 (swiftshader), `?memdebug=1`, `__aiBuildingsTestDebug.startNewGame` (Mały, Kontynenty, 6 rywali, 2 miasta-państwa, seed 778899), `Math.random` = mulberry32 (ziarno stałe), tura = `__eraTestDebug.endTurn()` (to samo co przycisk). Gracz nic nie robi poza „Zakończ turę” — tryb przyspieszony (ZAŁOŻENIE: brak trybu obserwatora w grze, AI gra pełną turę). Per turę: czas tury, otwarcie panelu miasta (sync + do 2. klatki), heap, węzły DOM/nasłuchiwacze (CDP `Memory.getDOMCounters`), memdebug, rozmiar i skrót JSON zapisu, rozmiary 149 kolekcji stanu, spis tekstur. Nowy hak tylko-odczyt `__turnSlowdownTestDebug` (main.ts:25014).

## (B/C) Diagnoza (profil CPU tury 72→73, PRZED; czas JS = próbki bez stałego `(program)` ≈8 s swiftshadera)
Czas JS tury: T12 = 739 ms → T72 = 4472 ms (×6,1). Otwarcie+zamknięcie miasta: 225 → 851 ms.

| # | Przyczyna (plik:linia) | Dowód T72 | udział JS tury 72 |
|---|---|---|---|
| P2 | `opts.isProductionAllowed` (main.ts:34282) liczy całe `availableProduction` + `empireActiveResourceLabelsForOwner` (dostęp do surowców wszystkich miast) dla KAŻDEJ pary miasto×kandydat | 2498 ms (T12: 125) | 56% |
| P3 | `placedImprovementsForOwner` (main.ts:4859): `territoryOwnerAtLive` buduje tablicę węzłów wszystkich miast od nowa dla każdego ulepszenia (288 ulepszeń × 40 miast) | 1013 ms (zawiera się w P2) | 23% |
| P1 | `refreshTerritoryBorderOverlay` (main.ts:12814): `currentVisible()` + `fogExploredForRender()` liczone per heks cudzego terytorium | 257 ms w turze, 256 ms przy panelu miasta | 6% tury / 30% miasta |
| P4 | `empireTerritoryResourceRatesForOwner` (main.ts:3254): obrabiane pola liczone dla wszystkich miast mapy, by wziąć tylko miasta ownera (każde `updateHud`) | 407 ms tura / 165 ms miasto | 9% / 19% |

Wykluczone (liczby w `evidence/`): brak kolekcji rosnących bez limitu — wszystkie rosną proporcjonalnie do gry (miasta 10→40, jednostki 14→235, ulepszenia 0→288; `warEventLog` 8). DOM 4–15 tys. i nasłuchiwacze 460–1500 oscylują bez trendu. Zapis 323→461 kB (głównie `mapSnapshot`), `buildSaveGameSnapshot` <0,1 s. Tekstury 14→23: schodki = cache cyfr Mocy `unitStatPlate.ts:539` (kanwa 72×126, max 10) i plakietek 64×64 przy nowych jednostkach — ograniczone, to samo zjawisko co „18→22 w turach 7–9”. Jednorazowe skoki (163 w T82 przebiegu 1, 98 w T5 przerwanego przebiegu): NIE_ZMIERZONO przyczyny, nie powtórzyły się w przebiegach końcowych (T82 = 23).

## (D) Naprawa — `gra/src/main.ts` (wynik obliczeń identyczny)
P1 jednorazowe leniwe zbiory; P2 pamięć per miasto i wejścia ownera tylko w oknie jednego `decideAITurn` (komendy wykonują się po nim — main.ts:35103); P3 użycie policzonego `nodes`; P4 `cities.filter(owner)` + pełna mapa sporów.

## Wyniki po (ta sama konfiguracja, przebieg końcowy PRE vs FIX, `compare-final-pre-vs-fix.txt`)
- Czas JS tury 72: 4472 → 1267 ms (−72%); `isProductionAllowed` 2498 → 13 ms; miasto JS 851 → 400 ms.
- Czas tury (ściana) T70–80 / T10–20: PRZED ×1,45 → PO ×1,26 ✓ (≤1,3).
- Panel miasta do 2. klatki: ×1,66 → ×1,35; sync ×3,35 → ×1,84. Pozostały wzrost rozproszony (HUD `buildHudState`, `okolica` miasta gracza, który rośnie z populacją, `computeLostToNearerSiblingByCity`; żadna funkcja >5%) — naturalny wzrost z liczbą miast (×4), poza zakresem minimalnych poprawek.
- Determinizm: skrót stanu identyczny PRE vs FIX w 81/81 turach (T2–T82). ZAŁOŻENIE: część czasowa `stackGroupId` (`armyMerge.ts:73`, `Date.now()`) normalizowana w skrócie — bez tego dwa przebiegi tego samego kodu różnią się od tury 34.
- Wykresy: `evidence/chart-pre-vs-fix.png`, `evidence/chart-base-vs-fix2.png`.

## Testy
tsc EXIT 0; Vite build EXIT 0; `web-turn-slowdown-test.cjs` (nowy: buildy PRE/FIX z lustra w tmp, 24 tury) **11 OK / 0 FAIL** — D1 skrót identyczny PRE=FIX w 23/23 turach, D2 powtarzalność, K1 `isProductionAllowed` 133,1→3,2 ms, K2 9,5→0,0 ms, K3 `currentVisible` przy panelu 33,5→0,0 ms; logic 213/213, ai-prod-fallback 17/0, ai-city-recovery 7/0, autosave-quota-fail 20/0, city-badge-growth 38/0, city-badge-zoom-lod 67/0, web-memory-leaks 30/0, territory-border 9/0.

## Uwagi
- Swiftshader: stały narzut ~7–9 s/turę `(program)`; na GPU absolutne czasy są niższe, ale wzrost JS jest ten sam.
- Przebieg fix1 zawiesił się po T5 (stos niezebrany); dodany watchdog z `Debugger.pause` — w kolejnych 4 przebiegach brak zawieszeń.
- Console.error „[Wojna wymuszona] DECISION_REQUIRED …” ×50 w każdym przebiegu (także PRZED) — poza zakresem.

ALLOWLISTA: `gra/src/main.ts`; `gra/tools/web-turn-slowdown-{measure,test,chart,compare,jstime,profile-summary}.cjs`; ten run. DEPLOY/PUSH: NIE WYKONANO.
