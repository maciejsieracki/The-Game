STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-25-MAPA-GAP-Q1
GOAL: Analiza luk (bez portowania kodu) dla `gra/src/map/` (pin `edb8fb56`) vs Rust; wiersz na plik i na eksport; backlog `P6.M-*` z allowlistami, kolizjami i kolejnoscia.
ZMIANY/COMMIT: `dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md` (nowy) + `dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/**` (skrypty, dane, logi). Zero zmian w kodzie, `gra/**`, `src-tauri/**`, `rust-port/**`. SHA: patrz `git log` worktree (commit lokalny, bez push).
TESTY: `cargo fmt --check` EXIT=0 (`gate-fmt.log`); `cargo clippy --all-targets -- -D warnings` EXIT=0 (`gate-clippy.log`); `cargo test` EXIT=0, 478 passed / 0 failed (`gate-test.log`). `verify_gap.py`: 25 plikow = 25 wierszy §3; 606 eksportow (niezalezny regex) = 606 wierszy §4; 26 unikalnych tematow M* (`verify_gap.out.txt`). Kontrola krzyzowa eksportow runtime w uruchomionym webie: zgodna dla wszystkich modulow, ktore daja sie zaladowac (22/22).
BLOKADY: brak. Notatki: (1) dispatch mowil 27 plikow, pin ma 25 (sprawdzone `git ls-tree` i `find`); (2) `improvement-build.ts`, `genWorker.ts`, `mapGenAsync.ts` nie laduja sie w Node (`three`/worker) - tylko liczba statyczna; (3) wektory z weba liczone na uruchomionym kodzie (Node 22 + loader), nie z pamieci.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Haiku 5.5). Najwazniejsze ustalenia do sprawdzenia: (a) `generate_map` w Rust NIE jest portem `generateMap` - rowny teren tylko 22-43% hexow na 5 mapach z `maps.json` (`cmp_generate_map_vs_web.out.txt`); (b) rdzen deterministyczny zgodny (Mulberry32 19200/19200, klimat 17000/17000, maski, dane maski Ziemi 288000 bitow); (c) minimalny wycinek odblokowujacy P6.1C RUNDA-2 = temat M09 (15 deklaracji `clusters.ts`, 384 LOC, `callgraph-rivals.txt`); (d) pulapka stalych `MIN_DIST_START_CITY_STATE`=5 vs `MIN_CITY_DISTANCE_START_CITY_STATE`=3.
DEPLOY/PUSH: NIE WYKONANO
