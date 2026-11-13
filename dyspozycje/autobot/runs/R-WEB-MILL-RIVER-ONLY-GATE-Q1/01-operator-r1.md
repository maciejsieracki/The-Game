STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-MILL-RIVER-ONLY-GATE-Q1
GOAL: Młyn (`mlyn`) wymaga rzeki w zasięgu miasta (ta sama definicja „przy rzece” co irygacja, `isHexNearRiver`); Port = morze LUB rzeka (bez zmian). Decyzja właściciela 2026-11-04.
ZMIANY/COMMIT: kod + test + logi: 25c527889 (gałąź: detached origin/main ee269b6ed). Allowlista: production.ts, cityPanel.ts (UI), NOWY tools/mill-river-only-gate-test.cjs, run dir. POZA allowlistą: gra/src/main.ts (wiring `cityHasRiverAccess`, mapa żyje tylko w main.ts; zgłoszone do FC). Brak zmian w auto-improvements.ts, gra-robocza/, WERSJE.md, rust-port/, src-tauri/, battle/.

POMIAR PRZED:
- Młyn NIE MA definicji budynku w data/buildings.json (grep `mlyn`: 0 trafień). Występuje tylko jako `built.includes('mlyn')` (turn-economy.ts:2007, 2585; cityPanel.ts:1246) i klucze ekonomii `budynek_mlyn_*` (econ-params.json:257, 264). Zatem młyn nie jest budowalny przez gracza, AI ani automat — brak bramki do „naprawy” w danych.
- Brak wzmianki o młynie w ai.ts, auto-improvements.ts i w ścieżkach budowy.
- Port: production.ts (bramka WATER_ACCESS_BUILDING_IDS, Port/Port wielki) + main.ts:5386 `cityHasCoastOrRiverAccess = isCoastalCity || cityHasWaterAccess` — już zgodny z decyzją (morze LUB rzeka).
- cityHasWaterAccess (turn-economy.ts:419+) liczy także jeziora; dla młyna użyto `isHexNearRiver` (bez jezior), zgodnie z dispatchem.

NAPRAWA:
- production.ts: `RIVER_ONLY_BUILDING_IDS = {'mlyn'}` (przed RECRUIT_UNITS_PER_TURN, ~l.173); ctx.cityHasRiver?; bramka w availableProduction (~l.998): `RIVER_ONLY && ctx.cityHasRiver !== true → continue`.
- main.ts: import isHexNearRiver; `cityHasRiverAccess(city)` = isHexNearRiver(map, q, r) (~l.5398); `cityHasRiver:` przy 7 wywołaniach ctx (l.6848, 6879, 9016, 16927, 36995, 38365, 39841); cfg `getCityHasRiver` (~l.7948).
- cityPanel.ts: typ cfg getCityHasRiver (~l.506), ctx cityHasRiver (~l.8873), chip „Wymaga rzeki przy mieście” (~l.6974), import RIVER_ONLY_BUILDING_IDS.
- Stare zapisy: builtBuildingIds z `mlyn` wczytuje się bez wyjątku (test D); żaden budynek nie jest usuwany.

TESTY:
- NOWY tools/mill-river-only-gate-test.cjs: PRZED 9 FAIL (RED) → PO ALL PASS (GREEN). Log: dyspozycje/autobot/runs/R-WEB-MILL-RIVER-ONLY-GATE-Q1/gate-mill-river-only-green.txt (EXIT=0).
- Mutacja 1 (bramka production wyłączona): 4 FAIL. Mutacja 2 (cityHasRiverAccess = morze/rzeka): 1 FAIL (pin main.ts).
- tsc --noEmit (gra/, po `npm ci --ignore-scripts`): EXIT=0 (gate-tsc.txt). `git diff --check`: czysto.
- Regresje (33 istniejące testy *mill/port/water/irrigation/building/deposit/naval/upgrade/recruit/trade-sea*): kody wyjścia PRZED = PO (log: gate-regression-before-after.txt). Nie-zerowe, istniejące przed tematem: autoimprove-irrigation-after-farms (124, timeout), deposit-coast (124, timeout), building-detail-card-entitycard-migration (1), pr141-f04-building-speed-activation (1).
- NIE_ZMIERZONO: test `naval-deposit-gate` (brak pliku w gra/tools); testy real-render (wymagają vite build — zakaz w gra/); Chromium nie uruchomiono (brak zmiany wizualnej poza etykietą chipa, nieprzetestowanej w przeglądarce).

ZAŁOŻENIA:
- A1: Brak definicji młyna = bramka jest nieaktywna w grze (zero zmiany zachowania). Gdy właściciel zdefiniuje `mlyn` w buildings.json, bramka działa od razu.
- A2: Blokada UI pokazuje się tylko dla id `mlyn` (zbiór RIVER_ONLY_BUILDING_IDS).

BLOKADY:
- Właściciel: czy dodać budynek Młyn do buildings.json (aktualnie nie istnieje; dispatch zakłada, że można go budować). Nie rozstrzygane tutaj.
- Allowlista: main.ts poza listą (wiring wymagany) — do akceptacji Final Control.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R1) → Final Control; decyzja właściciela o definicji młyna.
DEPLOY/PUSH: NIE WYKONANO
