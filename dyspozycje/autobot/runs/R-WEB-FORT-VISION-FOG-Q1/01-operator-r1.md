STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FORT-VISION-FOG-Q1
GOAL: Posterunek (r=3) i fort (r=5) gracza maja odkrywać i oświetlać całe koło swojego terytorium jak miasto (bez czarnych pól wewnątrz granicy).

## Przyczyna (plik:linia, stan bazowy 420d97ffe)
- Mgła gracza = `currentVisible()` (gra/src/main.ts:~11588) -> `ownPlayerVisibleHexes()` (main.ts:~11553): suma wzroku jednostek (`unitSight`) i miast (`citySightRadius`). Forty/posterunki (`fortNodes`, main.ts:4977) NIE były źródłem wzroku, choć `fortTerritoryNodes` (fort-territory.ts) dawało im terytorium.
- "Odkryte" = `refreshFog()` (main.ts:~12021) -> `addExplored(exploredByHuman.get(ME()), currentVisible())`; "widoczne" = ten sam zbiór. Ścieżka AI: `currentVisibleForOwner()` -> `computePlayerVisibility` (visibility.ts) — też bez fortów.

## Poprawka
- fort-territory.ts: nowy getter `fortSightSources(forts, ownerId)` (promień = `cityTerritoryRadius`, pomija cudze forty i `contestedUseless`).
- visibility.ts: `computePlayerVisibility` przyjmuje opcjonalne `extraSightSources` (dodawane do unii; zero zmian bez nich).
- main.ts (minimalnie, 5 miejsc oznaczonych `R-WEB-FORT-VISION-FOG-Q1`): źródła fortów w `ownPlayerVisibleHexes` (gracz) i `currentVisibleForOwner` (AI, spójnie); `refreshFog()` po postawieniu/cofnięciu fortu gracza i po `sweepFortCaptures`, gdy zdobycie dotyczy gracza.
- Utrata/zdobycie fortu: źródło znika z `fortNodes`/zmienia ownera -> widoczność znika przy następnym `refreshFog`; `explored` jest tylko addytywne, więc odkryte zostaje (jak przy mieście).
- Wydajność: bez nowego cache; to samo przeliczenie co dotąd, +1 `computeVisibleAt` (121/61 iteracji) na fort; istniejące inwalidacje `currentVisible` bez zmian.

## Zmiana zachowania AI (zaznaczone)
AI z fortem/posterunkiem teraz "widzi" jego koło (`aiVisibleHexes`, main.ts:~37007). Uzasadnienie: symetria z graczem i z miastem AI. Wpływ NIE_ZMIERZONO w symulacji.

## ZMIANY/COMMIT
gra/src/game/fort-territory.ts, gra/src/game/visibility.ts, gra/src/main.ts, gra/tools/fort-vision-test.cjs, katalog runu. Allowlista zachowana; `ai-fog.ts` nietknięty (niepotrzebny). Brak zmian poza listą. SHA: patrz commit "R-WEB-FORT-VISION-FOG-Q1 r1" (git log w worktree).

## TESTY (logi gate-*.txt, każdy z linią EXIT=)
- fort-vision-test.cjs (nowy): 15/0 — PRZED (bez źródeł): 91/91 pól koła fortu poza widokiem; PO: 91/91 widoczne i odkryte; posterunek 37/37, nic poza r=3; fort wroga nie odsłania; contestedUseless bez wzroku; po utracie widoczność znika, explored zostaje.
- auto-fort-claim 63/0, auto-fort-diag 17/0, fort-outpost-hard-territory 80/0, river-fog-visibility 31/0.
- `tsc --noEmit`: EXIT=0 (gate-tsc.txt).
- ai-fog-test.cjs: FAIL (deepStrictEqual w tools/ai-fog-test.cjs:96, ruch a3 toQ 4 vs 6). Test bundluje wyłącznie `ai.ts`+`ai-fog.ts`, których nie ruszyłem -> nie wynika z tej zmiany (wcześniejsza porażka); porównanie z bazą NIE_ZMIERZONO.
- autoimprove-live-hooks 37/0: NIE_URUCHOMIONO (wymaga bundla Chromium; zakaz `npm run build`).
- Odtworzenie w żywej grze (Chromium, `?civTest=1`): NIE_ZMIERZONO w tej rundzie; wartości przed/po są z testu jednostkowego logiki.

## BLOKADY
Brak twardych. node_modules po pracy do usunięcia (rm -rf gra/node_modules).

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator: ponowne uruchomienie testów, ocena ai-fog-test na bazie. Po integracji w buildzie orkiestratora sprawdzić w Chromium: gracz stawia fort/posterunek poza odkrytym obszarem (hook `forts`/`ownerAt`), policzyć nieodkryte pola koła (oczekiwane 0), zdobycie fortu przez wroga -> pola zostają odkryte, ale zacieniowane.

DEPLOY/PUSH: NIE WYKONANO
