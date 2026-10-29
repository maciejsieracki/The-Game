STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1
GOAL: Port gen-helpers.ts 3186-4374 do landsea.rs (caly zakres).
ROLA: Final Control (runda 2 po obronie), badany stan: fd117d6a (baza ec1a8552; kolejnosc: de75c557/3621f07c -> 8ab29f9a -> fd117d6a).

BRAMKI (odtworzone samodzielnie, cargo w rust-port/engine):
- cargo fmt -- --check: EXIT=0
- cargo clippy --all-targets -- -D warnings: EXIT=0
- cargo test: EXIT=0, 0 failed; p6_m06a_landsea 13/13 (1227 total wg logu obrony)
- git diff --check ec1a8552..HEAD: jedyna uwaga to pusty wiersz na koncu gate-test-r1.log (log, nie kod) - kosmetyka
- Allowlista: poza runs/R-...M06A i dokumentem P6-M06A tylko mapgen-landsea.json, derived.rs (dopisek), landsea.rs, p6_m06a_landsea.rs, web-vectors.json. Zero usunietych linii w p6_m06a_landsea.rs (brak oslabienia testow). Cargo.lock niezacommitowany.

WERDYKT ZARZUTOW:
1. Luka pierscienia (nakladka/zloze na Morzu): ODDAL (naprawione w r2). Mapy coast_overlay_deposit/orphan, edge_top_sea, edge_left_sea; ring-no-overlay-clear i ring-no-deposit-clear = KILLED (mutations-r2.log, sprawdzone).
2. Zakres: NAPRAW. 25 wierszy RUNDA-2 (m.in. applyLandFractionByScore, rebalance*, applyLandFractionByContinent, removeInlandWaterPools, purgeDesertEnclaveWater, applyJaggedCoastNoise, removeSmallInlandWaterPools, removeInlandSeaPools, enforceLatitudinalOceanBuffer) nadal nieportowane; obrona sama to przyznaje. GOAL = caly zakres, tematu nie wolno zamknac. Wykaz Math.* i zaleznosci dodany, ale port pozostaje do wykonania.
3. 29 vs 47 wierszy: ODDAL - zalozenie zapisane w dokumencie (29 = eksporty, 47 deklaracji top-level).
4. Luki mutantow: ODDAL - 10 mutantow dodanych, wszystkie KILLED; mutanty set_hex_to_morze (M04) poza allowlista. Bilans r2: 55 KILLED, 1 TIMEOUT, 2 SURVIVED ekwiwalentne z dowodem.
5. TIMEOUT ocean-bfs-no-visited / watchdog: ODDAL - zalecenie CI w dokumencie, watchdog poza zakresem.
6. run_in_background w r1: ODDAL - fakt historyczny, r2 w pierwszym planie.
Do decyzji czlowieka: brak.

BLOKADY: zarzut 2 (NAPRAW) - port 24 symboli w zakresie + ensurePangeaSingleContinent :4375.
RUNDY: 2/5 zuzyte. Nastepna: Operator-impl runda 3.
NASTEPNY KROK: Operator-impl r3 na RUNDA-2 wg zaleznosci (mulberry32/fbm/hashInt3/buildPermTable, potem predykaty wysokiego poziomu), wektory graniczne N-1/N/N+1, mutanty strukturalne; baza = SHA commita FC. Integracja do origin/rust-port/parity-v2 dopiero po PASS koncowym; gałąź jest potomkiem ec1a8552 (parity-v2 od tego czasu ruszyl, zmian w landsea.rs brak) - rebase/merge przy integracji.
DEPLOY/PUSH: NIE WYKONANO
