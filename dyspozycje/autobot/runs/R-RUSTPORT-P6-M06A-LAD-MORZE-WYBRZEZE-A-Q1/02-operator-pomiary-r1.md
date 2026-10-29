STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1
GOAL: Pomiary rundy 1 (weryfikator niezalezny, mutacje, granice, gate'y) dla podzbioru portu landsea.rs z commita 3621f07c / de75c557.
ZMIANY/COMMIT: pomiary w run dir (mut-runner-m06a.py, mutations-r1.log, verify-regen-r1.log, gate-*-r1-verifier.log, ten raport) + sekcja "Pomiary rundy 1" w dyspozycje/rust-port/p6/P6-M06A-LAD-MORZE-WYBRZEZE-A.md. Kod (landsea.rs) BEZ zmian (przywrocony git checkout, SHA zgodne z HEAD). Cargo.lock untracked, niezacommitowany.
TESTY:
- cargo fmt -- --check: EXIT=0 (gate-fmt-r1-verifier.log)
- cargo clippy --all-targets -- -D warnings: EXIT=0 (gate-clippy-r1-verifier.log)
- cargo test (pelny silnik): EXIT=0, 1224 passed, 0 failed; p6_m06a_landsea 10/10 (gate-test-r1-verifier.log)
- git diff --check: czysty
- weryfikator: regeneracja wektorow z pinu edb8fb56 (gen-m06a-vectors.mjs, kopia git archive poza repo): sha256 07dfd5dc... identyczny bajtowo z web-vectors.json (verify-regen-r1.log)
- przeglad zrodla vs kod (reczny, z gra/src/map/gen-helpers.ts @ edb8fb56): isLandTerrain :3234, isWaterTerrainLocal :152, ERODE_TERRAIN_ORDER :3279 (= JSON), defaultLandFractionForTyp :3254 (= JSON), applyCoastRing :3894, applyDoubleCoastRing :3923, findDryLandTouchingSea :3949, sanitizeCoastHexes :3975, oceanConnectedWaterKeys :4026, findInlandWaterHexes :4109, findInlandSeaHexes :4123 - zgodne z landsea.rs.
- dryf po pinie w zakresie 3186-4374: git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts = 8 hunkow, wszystkie w liniach 5992-10811 (poza zakresem). Potwierdzone.
MUTACJE (mut-runner-m06a.py, 48 mutantow, mutations-r1.log): KILLED 43; TIMEOUT 1; SURVIVED 4.
- SURVIVED ekwiwalentne (dowod): erode-rank-rposition-EQUIV (ERODE_TERRAIN_ORDER nie ma duplikatow, 6 unikalnych wpisow); neighbor-negate-both-EQUIV (HEX_DIRECTIONS prims.rs:32 domkniete na negacje, wszystkie uzycia to zliczanie/any, niezalezne od kolejnosci).
- TIMEOUT ocean-bfs-no-visited: usuniecie sprawdzenia odwiedzin daje nieskonczona petle w BFS; test nie konczy sie w 240 s. Wykrycie przez zawieszenie, nie przez asercje.
- SURVIVED NIEROZSTRZYGNIETE (LUKA TESTOWA): ring-no-deposit-clear, ring-no-overlay-clear. Usuniecie `h.overlay = Brak` / `h.has_deposit = false` w applyCoastRing nie zmienia wynikow. Przyczyna: w 172 wektorach zadne Morze nie ma nakladki ani zloza (pomiar: 0 heksow Morze z overlay != brak, 0 z has_deposit). Galezi nie pokrywa zaden przypadek.
- Mutanty strukturalne (zabite): sanitize-no-seeds, sanitize-no-bfs, ocean-seed-no-pred, ocean-bfs-no-pred, ocean-edge-*, touch-dry-skip-check, ring-src-shallow, coastal-*-guard, inland-*-invert.
POMIAR TRAFIEN NA GRANICACH (vectors): morze_n=0/1/2 -> 2206/1681/1123 (prog `>0` dla coastal_land, N-1/N/N+1 pokryte); land_n=0/1/2 -> 2494/2071/1155 (coastal_morse); ocean: woda na q=0/1/W-2/W-1 -> 102/98/100/106 map, na r=0/1/H-2/H-1 -> 125/96/99/112 map; sanitize ret>0: 44 map; apply_double ret>0: 114 map; findDryLandTouchingSea niepuste: 106 map; findInlandWater niepuste: 35; findInlandSea niepuste: 54.
BLOKADY: luka testowa w pierscieniu (overlay/zloze przy Morzu) - wymaga poprawki kodu testow w rundzie 2 (nie w tej roli).
PROCES: jedna partia mutacji przekroczyla 590 s i zostala przeniesiona w tlo przez harness; proces zakonczony w pierwszym planie (ten sam wynik, plik przywrocony). Pierwsza wersja runnera zawiesila sie na pipe po timeoutcie; poprawiona (start_new_session + killpg). Hung test binary zabity, landsea.rs przywrocony z HEAD (SHA 58946159... zgodne).
RUNDY: 1/5 (Operator-pomiary)
NASTEPNY KROK: Operator-impl runda 2 (ten sam temat): (a) dodac do generatora mapy specjalna z Morze obok ladu, z nakladka 'las' i zlozem, wygenerowac wektor z weba (pin edb8fb56), dodac asercje w apply_coast_ring/apply_double_coast_ring i test; nie oslabiac istniejacych; (b) po tym ponowic mutacje ring-no-deposit-clear i ring-no-overlay-clear (oczekiwane KILLED); (c) dokonczyc RUNDA-2 (25 wierszy) wg P6-M06A. Potem Operator-pomiary (r2).
DEPLOY/PUSH: NIE WYKONANO
