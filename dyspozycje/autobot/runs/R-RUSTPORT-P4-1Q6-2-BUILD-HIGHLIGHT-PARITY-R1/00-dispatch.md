# R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1 — podświetlenie budowy przy pustym zbiorze heksów (dług Q6-2)

STATUS: dispatch orkiestratora. Opus (3D). Operator/Obrona/Evaluator/FC Opus.
ZALEŻNOŚĆ: brak (Q6 UNITS zintegrowany w `667fe72e2`, DTO-BRIDGE r1 w `326fd5545`).
BAZA: `origin/rust-port/parity-v2` = `326fd5545` (DODATEK r1, 2026-11-17). Przed startem: `git fetch origin && git checkout -B <gałąź> 326fd5545`.

## GOAL
Rozbieżność od webu znana z Q6-2 (REJESTR-RUST.md, sekcja Q6 UNITS): przy aktywnym trybie budowy z PUSTYM zbiorem heksów web czyści podświetlenie, a Rust pokazuje zasięg ruchu. Naprawić tak, by producent nakładek (`overlays_view.rs`: `build_highlight`, `unit_overlays_view`) zwracał to samo co web we wszystkich trybach podświetlenia budowy.

## PIN (przeczytaj przed zmianą; pin = `07d2fbd72`)
- `gra/src/main.ts:16351-16395` — tryby podświetlenia budowy: `foundCityMode` i `activeWonderId` (`setHighlight(pusty Set)`), `clearHighlight` przy trybie kopalni. Cytuj linie w raporcie.
- Istniejący producent w Rust: `rust-port/engine/src/domain/overlays_view.rs` — `BuildHighlightUi`, `BuildHighlightSources`, `filter_build_highlight_hexes` (~linia 186), `build_highlight` (~223), testy od ~1034.

## ZAKRES
1. Ustal w pinie, który tryb czyści podświetlenie i co dzieje się z `reachable` przy pustym zbiorze. Odtwórz to w `build_highlight` / `unit_overlays_view`, bez zmiany innych trybów.
2. Test `rust-port/engine/tests/p4_1q6_2_build_highlight.rs`: wektory z pinu dla każdego trybu (foundCityMode z pustym zbiorem, activeWonderId z pustym zbiorem, tryb kopalni, zwykły tryb ruchu). Brak generatora → dodaj `p4_1q6_2_gen.mjs` i wynik w `p4_1q6_2_vectors/vectors.json`.
3. Mutacje FAIL: (a) pusty zbiór budowy nie czyści reachable; (b) tryb kopalni czyści podświetlenie budowy; (c) zwykły tryb ruchu traci reachable.

## ALLOWLISTA
`rust-port/engine/src/domain/overlays_view.rs`, `rust-port/engine/tests/p4_1q6_2_build_highlight.rs` (nowy), opcjonalnie `p4_1q6_2_gen.mjs` i `p4_1q6_2_vectors/vectors.json`, katalog runs. Zmiany w rendererze lub view-model: NIE — zapisać w BLOKADACH jako osobny temat.

## BRAMKI (EXIT 0)
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` (engine), `cargo test --test p4_1q6_2_build_highlight`, `cargo test --all-targets --no-fail-fast` (engine; >10 min: w tle z zapisem EXIT do logu).
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie orkiestratora (poza repo), usunąć po bramkach. Nie uruchamiać bramki renderera. Nie commitować `Cargo.lock`.

## KRYTERIA KOŃCA
Zielone bramki, mutacje (a)(b)(c) dają FAIL. Commit jawnym `git add` z allowlisty. Bez linii `Co-Authored-By` z nazwą modelu (#289). Raport `01-operator-r1.md`: STATUS, DOMAIN, TEMAT, GOAL, ZMIANY/COMMIT, TESTY, BLOKADY, RUNDY, NASTĘPNY KROK, DEPLOY/PUSH: NIE WYKONANO. Nie pushować do parity, nie integrować.
