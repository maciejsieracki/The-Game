STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-TURN-ECONOMY-RESOURCES-Q1
GOAL: pipeline zasobów per tura z weba (pin 4bbef081d) z produkcyjnym wywołującym `pay_spichlerz_drain_for_city`/`load_spichlerz_drain_params`; parytet z URUCHOMIONEGO weba.

ZMIANY/COMMIT: SHA w sekcji końcowej (commit raportu). Nowe: `rust-port/engine/src/domain/turn_economy_resources.rs`, `tests/p6_turn_econ_res_pipeline.rs`, `tests/p6_turn_econ_res_vectors/pipeline.json` (461 scen., 4095 konwerterów, 192 era, 144 inflow; odtwarzalne bajt w bajt z `git archive 4bbef081d`), `dyspozycje/rust-port/p6/P6-TURN-ECONOMY-RESOURCES.md`, generator, weryfikator Python `-I`, mutacje, `hunki-turn-economy-ts.tsv`, logi `gate-*.txt`. Poza allowlistą: 1 linia `pub mod` w `domain/mod.rs` (ZAŁOŻENIE: konieczna do rejestracji modułu). `Cargo.lock` wygenerowany, niecommitowany.
(1) Hunki: wszystkie 15 hunków `turn-economy.ts` (nawlekanie `SpichlerzDrainParams`) są zasobowe.
(2)(3) Port `tickEmpireResourcePipeline` (3 fazy), konwerterów, bonusu Garncarni, Stolarni; wołający `run_city_economy_resource_phase` (web :2476-2500) — ZAŁOŻENIE: brak portu `advanceCityEconomy`, to jest jego punkt wejścia; testy wołają go na produkcyjnym `state::City`.
NIE PORTOWANE: `simulateResourcePipelineForPreview` (podgląd HUD; wymaga terytorium/mapy) — NIE_ZMIERZONO.

TESTY: nowe 6/6 zielone (web↔Rust bitowo, w tym stan „brak surowca → brak bonusów ludności”, N-1/N/N+1 Spichlerz I/II, Ceramika/Sól osobno). Weryfikator Python (`python3 -I`): conv 4095, era 192, inflow 144, pipeline 227 scen. bez resolvera — 0 rozbieżności; 234 scen. z resolverem tylko web↔Rust. Mutacje: 40, zabite 32, 8 równoważnych z dowodem plik:linia (100% nierównoważnych; 80% brutto), logi `mut-M*.log`. Pełny `cargo test -j 2` w shardach (`gate-test-lib/s0-s4.txt`): PO = 2027 passed / 0 failed (EXIT=0 we wszystkich). PRZED (cfa1d9974, częściowy `git archive rust-port`, `gate-base-s*.txt`): 2021 passed + 6 padających wyłącznie z braku plików poza `rust-port` (p6_m00_skeleton, p6_m16_doc — w pełnym worktree przechodzą); różnica PO−PRZED = +6 nowych testów, brak regresu. Rozjazd z dispatchową bazą 2015: NIE_ZMIERZONO (metoda liczenia nieznana). fmt/clippy `-D warnings --all-targets`/`git diff --check`: EXIT=0 (`gate-fmt/clippy/diffcheck.txt`). Po ostatniej refaktoryzacji clippy (2 drobne zmiany w nowym pliku) przebiegł ponownie nowy test + M03; pełne shardy nie były powtórzone (zmiana dotyczy tylko nowego modułu).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R1 (zweryfikować mapowanie hunków, równoważność M03/M15/M17/M20/M23/M35-37, brak portu podglądu jako akceptowalny zakres).
DEPLOY/PUSH: NIE WYKONANO
