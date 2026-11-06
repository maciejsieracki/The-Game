STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — wydajność późnej gry
TEMAT: R-WEB-PERF-LATE-GAME-LAG-T86-Q1
RUNDY: 1/5 (obrona)
BAZA: Operator 85103909ecbbe8fc9979d4571fc39ef81c3496a7 (rodzic 56c164df9). SHA obrony podany w raporcie końcowym (commit nie może zawierać własnego hasha).

ODPOWIEDZI NA ZARZUTY
1. Cel p95 < 150 ms niepotwierdzony; refreshFog 3,5x < 5x — PRZYJMUJĘ jako fakt, ODRZUCAM jako wadę poprawki. Dispatch wymaga "zadania >200 ms usunięte LUB zredukowane >=5x"; syncUnitsRender (klik/ruch) spełnia (25-30x). Dalsza redukcja (HUD: updateHud/buildHudState, previewCityEconomy, computeWorkedMagazynYieldsByCity; refreshTerritoryBorderOverlay) to osobny zakres wymagający nowego pomiaru — Q2. NIE_ZMIERZONO: p95 < 150 ms.
2. Brak tury 86 — PRZYJMUJĘ. Wniosek zawężony: "przyczyna zlokalizowana dla skali miast (137 miast/321 jednostek)", NIE dla struktur rosnących z czasem (logi, historia, zdarzenia). Pomiar w realnej turze 80+ = NIE_ZMIERZONO, wymagany w Q2 (harness R-WEB-LONGRUN-100-TURNS lub zapis z tury 80+).
3. Brak SHA w artefakcie — PRZYJMUJĘ. SHA Operatora 85103909ecbbe8fc9979d4571fc39ef81c3496a7 zapisany w BAZA powyżej.
4. Memo nie unieważnia przy zmianie map.hexes — PRZYJMUJĘ. okolica.ts: WeakMap kluczowany obiektem `map.hexes` (fallback `map`), więc podmiana zbioru heksów na tej samej mapie unieważnia cache. Granica opisana w komentarzu w kodzie: dopisanie klucza IN-PLACE do istniejącego hexes nie jest wykrywane; grep po `hexes[...] =` / `delete ...hexes[` w gra/src = 0 trafień. Test perf-sibling-memo: +3 asercje (podmiana hexes => nowy wynik, równy świeżemu, wynik realnie różny) — 13/13 PASS.
5. ai-test tylko liczniki; brak render/visib/path — CZĘŚCIOWO PRZYJMUJĘ. ai-test: pełny log przed (okolica.ts z 56c164df9) vs po (z poprawką) jest identyczny co do bajta (diff), 274/20, te same 20 FAIL (evidence/gate-r2-ai-test-before.txt, gate-r2-ai-test-after.txt; EXIT=1 w obu = dług punktu odniesienia). Dodatkowo: okolica 72/72, okolica-multi-city-overlap 55/55, river-fog-visibility 31/0, tsc EXIT=0. river-path-adjacency: TIMEOUT 280 s (generacja mapy) — NIE_ZMIERZONO. Testy *real-render* (przeglądarka/GPU) nieuruchomione — NIE_ZMIERZONO; zmiana nie dotyka renderu, tylko czystej funkcji okolica.

ZMIANY: gra/src/game/okolica.ts (klucz memo), gra/tools/perf-sibling-memo-test.cjs (+3 asercje), evidence/gate-r2-*.txt, ten plik. Zero zmian w gra/data, rust-port, WERSJE.md.
DEPLOY/PUSH: NIE WYKONANO
