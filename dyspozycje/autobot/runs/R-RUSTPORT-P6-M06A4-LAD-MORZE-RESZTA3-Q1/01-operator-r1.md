STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A4-LAD-MORZE-RESZTA3-Q1
GOAL: Port M06A (web `gen-helpers.ts` 3186-4374, pin `edb8fb56`) do `rust-port/engine/src/domain/mapgen/landsea.rs`. Partia 2 (runda 1): `purgeDesertEnclaveWater` (:4156) PORTOWANY. Temat NIE zamkniety: 15 wierszy RUNDA-2 pozostaje otwartych (patrz dokument).
ZMIANY/COMMIT: SHA w sekcji "Commit" ponizej. Allowlista: `rust-port/engine/src/domain/mapgen/landsea.rs` (funkcja `purge_desert_enclave_water` na koncu pliku, import `mapgen_desert_purge`), `rust-port/engine/src/data/derived.rs` (dopisek na koncu: `MapgenDesertPurgeFile`, `mapgen_desert_purge()`), `rust-port/engine/data/derived/mapgen-desert-purge.json` (nowy), `rust-port/engine/tests/p6_m06a4_landsea.rs` (nowy, 3 testy), `rust-port/engine/tests/p6_m06a4_vectors/web-vectors.json` (nowy, 4991 przypadkow z weba), `dyspozycje/rust-port/p6/P6-M06A4-LAD-MORZE-RESZTA.md` (nowy), run `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A4-LAD-MORZE-RESZTA3-Q1/`. Zero zmian w `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`, `tests/p6_m00_skeleton.rs`, `map_generator.rs`.
TESTY:
- Baza: `origin/rust-port/parity-v2` = `6daf5ed1` (>= `364a5356`, ancestor OK).
- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r1.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r1.log`).
- `cargo test --no-fail-fast`: EXIT=0, 1253 passed, 0 failed (`gate-test-r1.log`). Baseline bazy nie zmierzony ponownie (NIE_ZMIERZONO); oczekiwane 1250 + 3 nowe.
- Nowe testy `p6_m06a4_landsea`: `vectors_meta_pin_and_counts`, `purge_desert_enclave_water_matches_web` (4991 przypadkow, 0 rozbieznosci mapy i liczby), `coverage_matches_threshold_rule_on_both_sides` (pary d=0..6 x p=0..d w pasmie D i N) - zielone.
- `git diff --check`: EXIT=0.
- Wektory: `gen-m06a4-vectors.mjs` uruchomiony na prawdziwym kodzie TS weba (`git archive edb8fb56 gra/src gra/data` w scratchpadzie, poza repo), sha256 gen-helpers = `ab934703...` (zgodne z M06A-M06A3).
BLOKADY: brak technicznych. Zakres partii 2 = 1 symbol (dispatch: 6-8 na partie); pozostale 15 wierszy RUNDA-2 w kolejnych partiach. Wiersz `purgeInlandWaterForMultiLandTyp` zalezy od `trimEnclosedOceanOnly` (web :4701, poza zakresem) - zalozenie Z-3 w dokumencie: najpierw port `trimEnclosedOceanOnly`.
ZALOZENIA: Z-1 (klucze niekanoniczne pomijane), Z-4 (progi `2` i `0.4` w `data/derived/mapgen-desert-purge.json`, nie w kodzie), Z-5 (kolejnosc wstawiania; srodek pierwszy w generatorze, zeby pokrycie opisywalo stan wejsciowy progu). Pelna lista w dokumencie.
MATH: brak `Math.*` w `purgeDesertEnclaveWater`; mnozenie `dryN * 0.4` w `f64` (jak JS).
Dryf po pinie: zaden z 8 hunkow `edb8fb56..origin/main` nie wpada w 3186-4374 (dokument, sekcja "Dryf po pinie").
RUNDY: 1/5 (Operator-impl). Operator-pomiary (weryfikator niezalezny, mutacje strukturalne i graniczne, pomiar trafien na granicach) NIE wykonany w tej rundzie.
NASTEPNY KROK: Operator-pomiary dla partii 2 (mutacje: zamiana `>=` na `>` w obu progach, `pust_n >= 2` -> `> 2`, pominiecie `has_deposit = false`, zmiana `in_desert`, zamiana kolejnosci wstawiania), potem partia 3 (`trimEnclosedOceanOnly` + `purgeInlandWaterForMultiLandTyp`, `applyJaggedCoastNoise`).
DEPLOY/PUSH: NIE WYKONANO

Commit: SHA ponizej (commit w worktree, bez push).
