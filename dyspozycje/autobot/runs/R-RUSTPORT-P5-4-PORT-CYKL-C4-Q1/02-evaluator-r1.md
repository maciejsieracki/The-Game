STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1
GOAL: Port cyklu C4 (10 modułów: entityCards/* ×7, sciencePicker, scienceHubHud, techDiscoveryNotice) do `src-tauri/frontend-v2/src/ui/` na DTO + kontroler MOCK, harness DOM vs pin `edb8fb56`.
ZMIANY/COMMIT: ocena commitu Operatora `b25bd132` (rodzic `9ec9c9d8`, przodek `origin/rust-port/parity-v2` @ `b2feab36`; 2 nowsze commity P6.1 nie dotykają `frontend-v2`). Evaluator: tylko ten plik.

TESTY (powtórzone przez Evaluatora w czystym checkoutcie `b25bd132`, pin z `git archive edb8fb56 gra/src gra/data` do scratch):
- `npm ci` EXIT=0; `npx tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (self-test 33/15/1, brama `plików=95 trafień=0`, `verify-pin-copies plików=413 niezgodnych=0`); `npx vite build` EXIT=0 (chunk `portCycleC4` 165,31 kB).
- Kalibracja bramy na 10 plikach pinu (własny przebieg per plik): 6+3+10+1+4+6+3+5+0+0 = 38 trafień = raport.
- Diff vs pin policzony samodzielnie (`diff` pin↔v2): registry 20, unitAdapter 19, buildingAdapter 78, improvementAdapter 5, technologyAdapter 14, sciencePicker 66, scienceHubHud 10, techDiscoveryNotice 19 linii zmienionych; `renderer.ts`, `wonderAdapter.ts` `cmp` identyczne. Każda różnica = zastąpiony import / odczyt katalogu / wylistowane miejsca reguł (§2–§4 P5-4); markup, CSS, teksty bez zmian.
- `run-c4.mjs`: 1649 przypadków, 0 różnic, EXIT=0 (jsdomErrors=75 tylko canvas getContext po stronie pinu).
- Własne mutacje (spoza `mutate-c4.mjs`): tekst „Koszt nauki” w sciencePicker + przesunięcie `yieldScale` w buildingAdapter → 212 różnic EXIT=1; CSS `techDiscoveryNotice.ts:255` i `scienceHubHud.ts:163` → 85 różnic EXIT=1. Pliki przywrócone (`git status` czysty).
- `mutate-c4.mjs` 20/20 wykrytych EXIT=0; regresja P5.2 3861/0, P5.3 3618/0.
- Ewaluacja `portCycleC4` z `MOCK_STATIC_CATALOG` (esbuild+jsdom, skrypt scratch): 10 modułów ładuje się bez wyjątku.
- `src/` bez kopii `gra/data` (jedyne JSON-y = mapy ikon P5.1); MOCK oznaczony (`MOCK_BUILDING_CARD_RULES`, `MOCK_STATIC_CATALOG`); `scienceHubSnapshotLogic`/`difficulty-cost`/`improvement-tech` nieimportowane (tylko komentarz w `types.ts`).
- Allowlista: 0 plików poza `src-tauri/frontend-v2/**`, `P5-4-PORT-CYKL-C4.md`, run dir; `package-lock.json` bez zmian; `git diff --check` czysty.

ZARZUTY: brak (lista pusta po realnym sprawdzeniu powyżej).

UWAGI (nieblokujące, do Final Control / rewizji P5-0):
1. ZAŁOŻENIE P5.4-Z3: bez haka `getResearchView` v2 pokazuje koszt bazowy i pusty hub, a pin liczył `scaledResearchCost(…,'standardowa',…,'normal')` (nie tożsamość: `GLOBAL_RESEARCH_COST_MULT`, FALA2) i `buildHubTechEntries`. Harness zawsze podaje DTO, więc ta ścieżka nie jest porównana — udokumentowane, NIE_ZMIERZONO.
2. Z4-4: `StaticCatalogDto.techTerrainUnlockLabels` dubluje istniejące `ResearchViewDto.techs[].terrainUnlockLabels` (P5-0 §6.9) — do ujednolicenia przy rewizji P5-0.
3. Rozmyte parsowanie prereq (`sciencePicker.ts:192-217`) zostaje w UI jako GRANICZNY — wpływa na krawędzie drzewka; zgodność z Rust NIE_ZMIERZONO (udokumentowane).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO
