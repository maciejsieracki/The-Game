STATUS: BLOCK (technical, potwierdzony). Operator-pomiary na commicie 716b828a (kod a7590add). Bez zmian w kodzie i testach.
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-LOGIKA-CIV-Q1
GOAL: Niezależna weryfikacja r1 (gate'y, 10 czerwonych per test) i pomiar jakości testów mutacjami; decyzja o dalszym kroku wg ZAŁOŻEŃ.
ZMIANY-COMMIT: brak zmian w kodzie/testach/wektorach. Dodane wyłącznie: ten raport, `baseline-failed.txt`, logi `*-r2-verify.log`, `mutants-r2.log`, `mutants-r2-compile-errors.log` (wszystkie w run folderze). Baza: 716b828a.
TESTY:
- fmt `cargo fmt --all -- --check`: EXIT=0 (fmt-r2-verify.log).
- clippy `--all-targets -- -D warnings`: EXIT=0 (clippy-r2-verify.log).
  - ODCHYLENIE OD BRAMKI: `--locked` odrzucone, bo `rust-port/engine` nie ma śledzonego `Cargo.lock` ("cannot create the lock file ... --locked"). Gate uruchomiono bez `--locked`. Lockfile wygenerowany lokalnie jest nieśledzony i NIE jest commitowany.
- `cargo test --no-fail-fast --all-targets`: EXIT=101, 1208 passed / 10 failed (test-r2-verify.log). Zgodne z raportem Operatora (1208/10). Poprawka do raportu Operatora: lista czerwonych to p6_1d×1, p6_1e_civ_matrix×1, p6_1e_tables×2, p6_4_core×2, p6_4_embark×1, p6_4_march×3 = 10 (raport podawał p6_4 ×7 i „p6_4_vectors ×2"; faktycznie p6_4 = 6 testów w binarkach core/embark/march).
- Cel REPIN (12 testów): 11 zielonych; jedyny czerwony celowy `bonus_applies_and_stat_multipliers_match_web` (tests/p6_1d_civ_bonuses.rs:339, `nonzero_records > 300`, wynik 106). Porównania per rekord w tym teście przechodzą.
- Pozostałe czerwone (wymuszone przez web 91dc998a, zgodnie z raportem): p6_1e_civ_matrix.rs:1296; p6_1e_tables.rs:113 i :178; p6_4_core.rs:135,160; p6_4_embark (move_cost_fn_for_matches_web_on_every_map_hex, tests/p6_4_vectors/common.rs:66); p6_4_march.rs:61,135 oraz execute_march_step_matches_web (common.rs:66).
- Incydent środowiskowy: w trakcie mutacji dysk zapełnił się (`No space left on device`, mutants-r2-compile-errors.log). Zwolniono wyłącznie artefakty własnego crate'a (`cargo clean -p civ-engine` z własnym CARGO_TARGET_DIR). Wpisy `KILLED(compile-error)` dla mutantów 22/23/24 z pierwszych przebiegów są NIEWAŻNE; ostateczny wynik dla każdego ID to ostatni wpis w mutants-r2.log (22 KILLED, 23 KILLED, 24 SURVIVED).
MUTACJE (28 mutantów, 6 binarek: p6_1d_civ_bonuses, p6_1e_civ_matrix, p6_1e_tables, p6_4_core, p6_4_embark, p6_4_march; wynik KILLED = nowa czerwona asercja poza bazowymi 10):
- Zabite (15): 1, 3, 4, 8, 9, 10, 11, 14, 15, 17, 18, 19, 22, 23, 28.
- Przeżyte, równoważne w kodzie lub danych (4): 5 (realizuje sprawdzone już w is_known_matrix_combat_entry, civ_bonuses.rs:282 vs 411–418); 12, 13 (wykluczone_g1=[walka_atak_lukownicy]; parametr = 0 we wszystkich 15 wierszach data/civ-matrix.json i nie jest w zerowe_markery, więc wpis i tak nie powstaje); 24 (js_math_round: dla x=±0 wynik = x w obu gałęziach, civ_matrix.rs:60).
- Przeżyte, równoważne przy wejściu z JSON (ZAŁOŻENIE, 3): 6 (is_known realizuje; wpisy z macierzy zawsze mają realizuje=walka), 7 (NaN/Inf nieosiągalne z JSON), 27 (civ_matrix.rs:1006 filter is_finite).
- Przeżyte, LUKA TESTOWA (6): 2 (rola GALERA w unit_combat_category), 16 (wyjatki_civ cel dla egipt/walka_ruch_bitwa_proc), 20 i 21 (filtr EGIPT_POMIJANE w civ_bonuses.rs:563), 25 i 26 (dopasowanie civ_key po ikonaId w civ_matrix.rs:314–318 i 1467–1471).
- Wynik: 15/28 zabite (54%); po odjęciu równoważnych 22 mutanty niezabite są oceniane; 6 luk wymaga testów dopisywanych (append-only).
BLOKADY: (1) 4 asercje kodyfikujące edb8fb56 (p6_1d:339, p6_1e_civ_matrix:1296, p6_1e_tables:113, :178) — nie edytowano, bo edycja osłabia test; (2) wektory p6_4 nadal z edb8fb56 (regeneracja z 91dc998a poza allowlistą); (3) src/data/derived.rs poza allowlistą.
ZAŁOŻENIA (rozstrzygnięte bez pytań):
- Z1: wyjątek allowlisty dla derived.rs (tylko pola schematu, bez logiki) uznajemy za dopuszczalny do potwierdzenia przez FC.
- Z2: 4 asercje z edb8fb56 zostają bez zmian (zasada „testy tylko dopiski"); ich czerwień jest udokumentowaną regresją pinu, nie błędem portu.
- Z3: runda 2 = regeneracja p6_4 z 91dc998a (generator z runu, kontrola bajt-w-bajt na 91dc998a) oraz dopisanie testów append-only domykających 6 luk mutacyjnych.
RUNDY: 1/5 (pomiary na r1; kod nie zmieniony)
NASTĘPNY KROK: Final Control: potwierdzić Z1 i Z2; runda 2 wg Z3. Bramka „12 zielonych" nie jest jeszcze spełniona (1 cel czerwony + 9 regresji pinu).
DEPLOY/PUSH: NIE WYKONANO
