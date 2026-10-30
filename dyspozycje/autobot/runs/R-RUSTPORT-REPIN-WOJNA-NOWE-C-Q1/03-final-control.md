STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-C-Q1
GOAL: REPIN krok 2a, czesc C: ai_move_range.rs, diplomacy_tick_war_brake.rs (web 91dc998a)
ZMIANY/COMMIT: oceniany `0db71e85` (kod `7f2f5d2f`); ten plik + logi fc-*.log w osobnym commicie docs.
WERDYKT ZARZUTOW:
- Z1 (NaN progu): ODDAL. `!(zaufanie <= prog)` w advance_crisis_counter; mutacja przywracajaca stara forme -> `crisis_counter_hysteresis_and_thresholds` FAILED (zmierzone).
- Z2 (pow(-1, inf)): ODDAL. `base.abs() == 1.0`; mutacja na `base == 1.0` -> `krok_edge_cases_explicit` FAILED (zmierzone).
- Z3 (panika sort_by): ODDAL. Komparator calkowity, NaN na koncu, ZALOZENIE Z9 w dokumencie; test `sort_crisis_queue_nan_counters_total_order_no_panic` ok.
- Z4 (kolejnosc parse): ODDAL. Deklaracja kolejnosci usunieta, ZALOZENIE Z7 (zbior par); test permutation_invariant ok.
- Uwaga 23 mutacji: ODDAL. 31/31 powtorzone na r2 (30 ZABITYCH + R13 rownowazna, dowod z kodu); logi mut-c-r2-*.log w repo; wlasne 2 mutacje FC zabite.
TESTY (u mnie, na 0db71e85): fmt EXIT=0; clippy -D warnings EXIT=0; cargo test --no-fail-fast EXIT=0, 1349 passed / 0 failed; git diff --check 80e233c3..0db71e85 czysty.
ALLOWLISTA: `git diff --name-only 80e233c3..0db71e85` = tylko ai_move_range.rs, diplomacy_tick_war_brake.rs, mod.rs, data/derived/diplomacy-tick-params.json, tests/p6_repin_wojna_c_*, wektory, P6-REPIN-WOJNA-NOWE-C.md, runs/**. Zero gra/**, Cargo.toml, WERSJE.md; Cargo.lock nieSledzony.
KOLEJNOSC: baza pracy 80e233c3; origin/rust-port/parity-v2 = db72e298 (8 commitow dalej: M06A6/M06A7/EKONOMIA-B). parity-v2 NIE dotknal mod.rs, data/derived ani tests wzgledem 80e233c3 -> brak kolizji plikow; integrowac merge'em PO db72e298, potem powtorzyc bramki na wyniku.
BLOKADY: brak
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora (merge na aktualny parity-v2 + bramki), potem WOJNA-ZMIANY
DEPLOY/PUSH: NIE WYKONANO
