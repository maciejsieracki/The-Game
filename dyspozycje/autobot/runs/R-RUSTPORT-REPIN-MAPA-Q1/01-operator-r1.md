STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-MAPA-Q1
GOAL: REPIN krok 4d — odświeżenie portu mapgen do `gra/src/map/gen-helpers.ts` pin `edb8fb56` → `91dc998a` (8 hunków poza 3186–4374) oraz regeneracja wektorów M04/M05A/M05B/M16 z weba 91dc998a z 0 rozbieżności.
ZMIANY-COMMIT: baza `fb55afe2` (detached); commit docs: SHA w sekcji „Commit" poniżej. Pliki: `dyspozycje/rust-port/p6/P6-REPIN-MAPA.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-MAPA-Q1/01-operator-r1.md`, logi `gate-*-r1.log`, `gen-*-r1.log`. Kod Rust: 0 zmian (brak SHA z kodem). Wektory w repo: bez zmian (pozostają na pinie edb8fb56).
TESTY:
- Hunki gen-helpers (8 szt.: 5992, 8466, 10352, 10392, 10541, 10693, 10776, 10804): wszystkie = `queue.shift()` → indeks głowy (FIFO identyczne), zmiana niebehawioralna. Brak odpowiednika w Rust (moduły `rivers_*.rs` to szkielety M00); `relief.rs`/`terrain_class.rs` nie cytują tych linii.
- M04 gen na 91dc998a vs stored: tylko meta (sha gen-helpers, liczba linii); dane 0 rozbieżności.
- M05A, M05B: to samo — 0 rozbieżności danych (tylko meta).
- M16 gallery.json: 0 rozbieżności. M16 qualifier.json: 11551 rozbieżności, rules.json: 62 — wszystkie w `kosztPraca`/`work_cost`.
- cargo fmt --check: EXIT=0. cargo clippy --all-targets -D warnings: EXIT=0. cargo test --no-fail-fast: 1265 passed / 0 failed (baseline 1265/0).
- git diff --check: do wykonania przed commitem (patrz sekcja Commit).
BLOKADY: M16 0-rozbieżności NIE osiągnięte. Przyczyna poza allowlistą tematu: `gra/src/game/terrain-improvements.ts` (nowa `terrainImprovementConstructionEraMultiplier` w `scaleTerrainImprovementWorkCost`) i `gra/data/units.json` (Rydwan Epoka/Surowiec). Port leży w `rust-port/engine/src/domain/improvements.rs` (+ kopia units.json) — NIE w allowliście (allowlista: mapgen relief/terrain_class/masks/prims, p6_m04/m05/m16 testy, doc, run dir). Nie ruszano.
RUNDY: 1/5 (ostatni werdykt: —; FAIL → ten sam ID, runda 2 po rozszerzeniu zakresu).
NASTĘPNY KROK: runda 2 (ten sam ID): (a) port §2 do `improvements.rs` i odświeżenie kopii `units.json` w `rust-port/engine/data` — wymaga rozszerzenia allowlisty o `improvements.rs` i kopie danych; (b) po porcie regeneracja M16 z 91dc998a i 0 rozbieżności; (c) zapis do `P6-REPIN-MAPA.md` §5 statusów PORTOWANE. Szczegóły i sumy kontrolne: `dyspozycje/rust-port/p6/P6-REPIN-MAPA.md`.
DEPLOY/PUSH: NIE WYKONANO
