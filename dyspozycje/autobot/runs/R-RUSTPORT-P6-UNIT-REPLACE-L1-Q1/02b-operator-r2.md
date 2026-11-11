STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1 (zadanie 20, awanse INFANTRY 21/23)
GOAL: uzupelnic awanse INFANTRY w danych Rust wedlug pinu 07d2fbd72; test behawioralny z wektorow generatora z pinu; r2 = wariant (a) z dodatku orkiestratora (regeneracja wektorow p6_1d z pinu 07d2fbd72, bez recznej edycji hasha).
ZMIANY/COMMIT: baza origin/rust-port/parity-v2 = 33cd715cf (detached). Kod r1 przeniesiony cherry-pickiem adf30a705 -> 27c5fdf11 (bez konfliktow). Commit r2: SHA w `git log -1` galezi wip (patrz nizej). Allowlista r2:
  - rust-port/engine/tests/p6_1d_vectors/web-vectors.json (regeneracja generatorem gen-p61d-web-vectors.mjs z gra/ pinu 07d2fbd72 wyeksportowanego przez git archive poza repo; zmienione tylko: "node" v22.22.0 -> v22.23.4, dataFnv.units 8dc901d9b73e6119 -> 642eb20f6bd9e320, strip.dataStringXor 9b7ebd3960da4b79 -> 660541fd96976da9; wszystkie inne pola identyczne z wektorami edb8fb56; porownanie strukturalne, skrypt poza repo).
  - rust-port/engine/tests/p6_unit_replace_l1.rs (test infantry_promotion_targets_available_in_rust_logic, patrz nizej).
  - NIE zmieniano: rust-port/engine/data/units.json (zawiera juz 21 awansow z r1, zgodne z pinem), p6_1d_civ_bonuses.rs, Cargo.toml/Cargo.lock (Cargo.lock wygenerowany lokalnie, usuniety, niecommitowany), gra/, origin/main, WERSJE.md.
  - Test p6_unit_replace_l1.rs: zmiana z `any` na sprawdzenie per cel. Dla kazdego celu z pinu available_replacements_for (z nacja tego celu jako nacja cywilizacji, jak w r1) musi go zwrocic; kazdy nadmiarowy wynik piechoty spoza listy pinu musi miec ten sam Typ co zrodlo (galezia A web availableReplacementsFor). Pelny dokladny zbior w jednym kontekscie NIE jest mozliwy: bramka nacji zalezy od celu (zob. nacja celu) i pierwsza proba (neutralny kontekst bez nacji) dala 10 brakujacych celow dla Wloczni (Falanga, Triari, Thorakites, ...), wiec odrzucona. Galezie: A = ten sam Typ (zwraca tez np. Wojownik z mieczem i tarcza dla Wojownika - zgodne z web), B = pole `Zastąp specjalnie` (cele z pinu).
  - Uwaga W8: available_replacements_for nie ma wolajacego poza testami (wg dispatchu; NIE_ZMIERZONO w tej rundzie).
TESTY:
  - cargo fmt --check: EXIT 0.
  - cargo clippy --all-targets -- -D warnings: EXIT 0.
  - cargo test --lib: EXIT 0, 37 passed.
  - cargo test --test p6_unit_replace_l1: 3/3 ok (vectors_pin_header_and_counts, rust_units_json_promotion_field_matches_pin, infantry_promotion_targets_available_in_rust_logic).
  - cargo test --test p6_1d_civ_bonuses: 12 ok, 2 FAILED (embedded_data_is_byte_identical_to_data_used_for_vectors :161, strip_diacritics_matches_web_function_cut_verbatim :219).
  - cargo test --no-fail-fast (pelny, w tle): EXIT 101; 372 blokow "test result: ok"; jedyny failujacy binarny: p6_1d_civ_bonuses (te 2 testy). Testy danych units.json (data_compliance, data_units_combat, derived_values, diplomacy, recruitment, p6_repin_*, parity_suite itd.) zielone.
  - Log: scratchpad/full.log (poza repo).
BLOKADY:
  (1) embedded_data_is_byte_identical_to_data_used_for_vectors (:161): wektor dataFnv.units = 642eb20f6bd9e320 (bajty units.json z pinu 07d2fbd72), Rust rust-port/engine/data/units.json = 5049afb95122976d. Rust units.json rozni sie od pinu 07d2fbd72 w 52 miejscach (semantycznie, po JSON): 50 pol wymienionych w dodatku r2 (Tech 27, fieldPower 9, Top3 3, Epoka 2, Historia 2, po 1 w Atak/Obrona/Przebicie/Bonus vs Spearman %/meleeAttack/meleeDefence/piercing) plus teksty Top3/Historia (zaleznie od tych pol). Awanse INFANTRY sa zgodne z pinem (brak roznic w polach awansu). Bajtowa tozsamosc z pinem nie moze zachodzic bez tych 50 zmian.
  (2) strip_diacritics_matches_web_function_cut_verbatim (:219): dataStringXor z pinu 660541fd96976da9 vs Rust b0dbfb9d862bf602 - ta sama przyczyna (inne stringi units.json).
  (3) Recznej edycji hasha nie wykonano (zakaz dispatchu). Regeneracja z pinu NIE daje hasha opisujacego dane Rust, wiec wariant (a) z dodatku r2 nie jest osiagalny samym generatorem.
  (4) Do decyzji ABC wlasciciela (nie rozstrzygam sam):
      A. Wyrownac 50 pol units.json do pinu 07d2fbd72 (zmiana danych balansowych, poza zakresem r2; testy zielone bez zmiany asercji). Rekomendacja dlugoterminowa: Rust ma isc za pinem.
      B. Zmienic generator/test tak, by hash i XOR liczyly dane Rust (jawnie oslabia gwarancje "byte-identical z webem"; wymaga decyzji FC). Tylko jako swiadomy dlug tymczasowy.
  (5) Obserwacja: naglowek wektorow nadal "pin":"edb8fb56" (wpisany przez generator), mimo ze wektory pochodza z 07d2fbd72. Wynik kodu TS (civ-bonuses, civ-matrix, city-names) jest identyczny miedzy pinami poza hashami units; naglowek powinien zostac poprawiony przez generator/wlasciciela, nie recznie.
  (6) 50 rozbieznosci pol: POZA ZAKRESEM, nie poprawiano (zgodnie z dodatkiem r2); wymienione wyzej.
RUNDY: 2/5 (r1 BLOCK, r2 BLOCK); ostatni werdykt r1: BLOCK (hash p6_1d); decyzja wymagana: wybor A albo B z blokady (4).
NASTEPNY KROK: decyzja ABC wlasciciela (A/B). Po decyzji: Evaluator + Final Control na commicie r2 (wip). Nie integrowano, nie pushowano do rust-port/parity-v2.
DEPLOY/PUSH: NIE WYKONANO (deploy/integracja poza zakresem Operatora; push tylko galezi wip).
