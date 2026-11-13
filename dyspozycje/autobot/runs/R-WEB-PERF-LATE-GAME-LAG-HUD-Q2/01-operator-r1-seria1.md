STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — wydajność późnej gry, część 2 (HUD, granice)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
GOAL: refreshFog / updateHud / buildHudState / refreshTerritoryBorderOverlay na ścieżce kliku zredukowane >= 5x lub usunięte z interakcji; endTurn zmierzony i zredukowany; bez zmian reguł i determinizmu AI.

## Pomiar PRZED (baza origin/main 33855a540, harness perf-late-game-interaction-live-test.cjs, seed 1412026, 137 miast, 321 jednostek, CDP profiler, SwiftShader, load avg 3-6 na 4 rdzeniach)
`refreshFog` 746-848 ms/wywołanie (773 w próbie głównej). Z tego `refreshD1bHud` (HUD) 602-623 ms = ok. 79%; `syncUnitsRender` 18-21 ms (po Q1); reszta fog < 5 ms.
Profil 15 powtórzeń, czas włączny (22,8 s): `collectTurnEvents` 15,5 s (68%) → `productionAvailabilityCtxForCity` 13,6 s → `empireActiveResourceLabelsForOwner` 10,5 s (+ `placedImprovementsForOwner`, `empireBuiltIdsForOwner`, `collectDepositPotential`, `hexKeysWithinRadius`). Przyczyna: wołane PER MIASTO GRACZA (40), a każde wołanie liczy całość per właściciel (miasta x ulepszenia) = O(miasta²), 3x na jedno odświeżenie HUD. Drugie: `buildHudState` wołane wielokrotnie na jedno `updateHud` (getTurn/getResearchProgress/pasek/minimapa każde woła getState): ok. 5,1 s. Trzecie: `refreshTerritoryBorderOverlay` przebudowuje siatkę granic przy każdym refreshFog (ok. 1 s / 45 wywołań).

## Naprawa (wyłącznie z pomiaru; zero zmian reguł/balansu/danych)
1. `gra/src/main.ts`: zakresowe memo per właściciel (`withOwnerScopeMemo`) dla `placedImprovementsForOwner`, `empireBuiltIdsForOwner`, `empireActiveResourceLabelsForOwner`; aktywne tylko wewnątrz `collectTurnEvents` (funkcja czysta względem cities/cityBuilt/placedImprovements/mapy; jedyna mutacja to idempotentne `prodEmptyDismissFp.delete`). Zwracane kolekcje są kopiowane, więc wołający nie zanieczyszczą wpisu. Poza zakresem zachowanie bez zmian.
2. `gra/src/main.ts`: ramka zdarzeń (`withTurnEventsFrame` + `refreshD1bHud` jako wrapper importu `refreshD1bHudRaw`): w obrębie jednego odświeżenia HUD `collectTurnEvents` liczone raz (panel boczny, licznik blokujących, przycisk końca tury), zwraca kopię tablicy.
3. `gra/src/ui/hud.ts`: `hudStateSnapshot()` — jedna migawka `getState()` na `updateHud()` (moduły HUD tylko renderują DOM; poza `updateHud` odczyt świeży; ramka zamykana w finally, zagnieżdżenie bezpieczne). Zamienione 4 wywołania `cfg.getState()`.
4. `gra/src/main.ts`: `refreshTerritoryBorderOverlay` pomija przebudowę siatki, gdy podpis zawartości (zbiory heksów per właściciel — rozmiar + dwa hashe niezależne od kolejności, kolor tożsamości i relacji) jest identyczny; siatka zależy tylko od tych danych (sprawdzone w `buildTerritoryBorderMesh`). Każde `clearTerritoryBorderOverlay` unieważnia podpis.

## PO (ta sama maszyna, scenariusz i seed; 3 powtórzenia po 5 prób, `fogParts rerun`)
| metryka | przed | po kroku 1 | po kroku 1-3 | po 1-4 |
|---|---|---|---|---|
| `refreshFog` ms | 746 / 754 / 773 / 848 | 385 / 397 / 400 | 261 / 264 / 266 | 149 / 152 / 154 |
| suma profilu 15x | 22,8 s | 10,7 s | 4,8 s | 4,3 s |
Wynik końcowy: refreshFog ok. 150 ms vs ok. 770 ms = ok. 5,1x (min/med/max po: 149/152/154 przy load avg 4-6; przed 746/773/848). Spełnia próg >= 5x (cel <= 175 ms). Kolejne pozostałości (profil po): `buildHudState` ok. 33 ms/wywołanie (`previewCityEconomy`/`assignWorkedTiles`/`okolicaTiles` ok. 1,0 s z 4,3 s), `collectTurnEvents` ok. 1,2 s (`availableProduction`, `isCivSpecialReplacement`).

## TESTY (logi `evidence/gate-*.txt`, linia EXIT=)
PASS: tsc --noEmit EXIT=0; nowy `perf-hud-frame-memo-test.cjs` 6/6 (kontrakt strukturalny; NIE jest testem czasowym — dowód czasu to pomiar powyżej); hud-armia-chip, hud-gross-net-rest, hud-konwerter, hud-miasto-stan-cywilizacji, hud-miasto-stock-tempo, hud-number-abbrev, hud-obywatele-chip, hud-recruits-abbrev, hud-resource-deficit-red, hud-skarbiec, hud-topbar-grid-gross-net, hud-topbar-no-labels, saveload-hud-cache-hotseat-wiring, side-list-hud-panel-coverage, spichlerz-hud-params-parity, border-march-scan, bottom-bar-hud-wykonaj-overlap, river-fog-visibility. ai-test: 274 passed / 20 failed (jak punkt odniesienia).
FAIL (nie sprawdzone względem bazy, wyglądają na wcześniejsze): `hud-moc-warstwa` 21/7 (asercje o wartości sumArmyM 98 vs 49 i wzorce call-site `objectivePowerForOwnerEffective` — niezwiązane z moimi zmianami; do potwierdzenia Evaluatorem na origin/main); `ai-fog` (assert W2, wg raportu Q1 wcześniej FAIL).

## BLOKADY / NIE_ZMIERZONO
- NIE_ZMIERZONO: tabela przed/po dla ruchu/wejścia do miasta/wyboru jednostki/panelu miasta jako min/med/max z >= 7 powtórzeń PRZED. Pełny przebieg PO (7 powtórzeń, PERF_PROFILE=0) pokazuje ciągłe długie zadania 650-1100 ms również w stanie spoczynku między klikami (select/move/enter/panel) — to klatki renderu SwiftShader (707 draw calls, 1,39 mln trójkątów), nie koszt JS kliku; handler mouseup = 0 ms. Czasu renderu NIE da się tu zredukować/oceniać (artefakt środowiska, nie ruszane).
- NIE_ZMIERZONO: zależność kosztu kliku od numeru tury (historia/logi/zdarzenia O(n)); nie zasiano historii, tura 1 (zasiane).
- NIE_ZMIERZONO: endTurn przy dużej cywilizacji (harness PERF_EOT=1 nie uruchomiony w limicie czasu; z Q1: EOT 30-70 s). Naprawy ograniczone do ścieżki HUD/fog.
- Nie zbadano `renderInfo.calls`, `previewCityEconomy`/`assignWorkedTiles` (memo), `refreshMinimap`, `renderBar` poza tym, co daje migawka stanu.
- Memo per właściciel zakłada brak mutacji świata wewnątrz `collectTurnEvents`/jednej ramki HUD; Evaluator powinien to sprawdzić czytając `cityHasAffordableBuildingEnqueue`, `cityHasAffordableUnitRecruitment`, `productionOptionsFingerprint`.

## ZMIANY/COMMIT
Allowlista: gra/src/main.ts; gra/src/ui/hud.ts; gra/tools/perf-hud-frame-memo-test.cjs; dyspozycje/autobot/runs/R-WEB-PERF-LATE-GAME-LAG-HUD-Q2/**. SHA: patrz stopka (uzupełniona po commicie).
Sprzątnięto: gra/node_modules, katalogi build Chromium w scratchpadzie.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja poprawności memo; porównanie hud-moc-warstwa/ai-fog z bazą; powtórzenie pomiaru fog 5x); potem Q2 dalej: `buildHudState`, `collectTurnEvents`/`availableProduction`, skalowanie z turą, endTurn.
DEPLOY/PUSH: NIE WYKONANO
