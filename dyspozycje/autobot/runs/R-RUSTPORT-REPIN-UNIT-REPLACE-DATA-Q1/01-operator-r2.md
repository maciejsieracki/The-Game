STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1 (zadanie #153, L-1), runda 2/5 (dodatek r2 po FAIL FC r1)
GOAL: uzupełnić pole "Zastąp specjalnie" dla 21 jednostek piechoty w rust-port/engine/data/units.json (bajt-w-bajt z pinu 07d2fbd72) i doprowadzić strażników hashy w p6_1d_civ_bonuses do zgodności z nowym units.json bez zmiany wektorów.
BAZA: a53d46932 (kod r1: units.json + p6_repin_unit_replace_data.rs; ancestry z cfa1edd31 potwierdzone). Worktree: wip/R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1 od a53d46932.
ZMIANY/COMMIT: c16f90ca6 (r2, tylko rust-port/engine/tests/p6_1d_vectors/web-vectors.json, 1 linia, pola hashy):
  - dataFnv.units: 8dc901d9b73e6119 -> 5049afb95122976d
  - strip.dataStringXor: 9b7ebd3960da4b79 -> b0dbfb9d862bf602
  - units.json i p6_repin_unit_replace_data.rs bez zmian w r2 (kod r1 w a53d46932).
  - Diff web-vectors.json (JSON-owy, porownanie wartosc po wartosci) pokazuje WYLACZNIE te dwie zmiany; wszystkie tablice wektorow identyczne z baza.
  - Diff units.json cfa1edd31..HEAD po odfiltrowaniu linii z kluczem "Zastąp specjalnie": 0 linii (42 linie zmienione = 21 usunietych + 21 dodanych tego pola).
  - Hashe wyliczone skryptem Python (odtwarza algorytm testu: FNV-1a64 bajtow pliku; XOR FNV-1a64 po stringach civs.json+units.json z `s + "\0" + strip(s)`). Kontrola: skrypt na units.json z cfa1edd31 daje 8dc901d9b73e6119 i 9b7ebd3960da4b79 (zgodne ze starymi wartosciami), na nowym daje 5049afb95122976d i b0dbfb9d862bf602 (zgodne z dispatchem). Generator gen-p61d-web-vectors.mjs NIE uzyty (NIE_ZMIERZONO generatora: brak pliku w repo).
TESTY (wszystko EXIT 0, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: 100 passed, 0 failed
  - cargo test --test p6_1d_civ_bonuses: 14 passed, 0 failed (w tym embedded_data_is_byte_identical_to_data_used_for_vectors i strip_diacritics_matches_web_function_cut_verbatim)
  - cargo test --test p6_repin_unit_replace_data: 3 passed, 0 failed
  - cargo test --no-fail-fast (pelny): 3264 passed, 0 failed, 1 ignored (e2e::dump_tick1_econ_for_web_generator w tests/p6_order_lane.rs:1531, #[ignore] istnieje przed ta runda, plik nietkniety), 453 binarek testowych.
  - Brak nowych #[ignore] i brak oslabionych asercji w tej rundzie.
BLOKADY: brak. Cargo.lock wygenerowany przez cargo, nie commitowany (untracked).
RUNDY: 2/5
NASTEPNY KROK: FC r2 (weryfikacja: diff web-vectors = tylko pola hashy, bramki jw.), potem integracja orkiestratora (po FC) — bez merge przez Operatora.
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje do rust-port/parity-v2; brak push tej gałęzi roboczej w tej rundzie).
