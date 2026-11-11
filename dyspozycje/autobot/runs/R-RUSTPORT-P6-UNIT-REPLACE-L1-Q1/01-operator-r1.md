STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L1-Q1 (zadanie 20: awanse INFANTRY 21/23), runda 1/5, Operator
GOAL: uzupelnic brakujace awanse INFANTRY w danych Rust zgodnie z pinem web 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (gra/data/units.json, pole "Zastąp specjalnie"), z testem behawioralnym na wektorach z generatora z pinu.
BAZA: origin/rust-port/parity-v2 = 83ac67875 (checkout detach, bez pusha do rust-port/parity-v2)

ZMIANY/COMMIT:
- rust-port/engine/data/units.json: 21 linii zmienionych (tylko pole "Zastąp specjalnie", 21 jednostek Typ Swordsman/Spearman/Falangite/Offensive; wartosci skopiowane z pinu programowo, `apply_promo.py` w scratchpad). Dowod: po zmianie 0 roznic pola Typ/"Zastąp specjalnie" wzgledem pinu dla 75 jednostek; przed zmiana 21 roznic (wszystkie w typach piechoty).
- rust-port/engine/tests/p6_unit_replace_l1_gen.mjs (nowy): generator wektorow z pliku units.json z pinu (Node 22, bez zaleznosci). Wygenerowano: zrodla=23, krawedzie=53, jednostek=75, techs=7.
- rust-port/engine/tests/p6_unit_replace_l1_vectors/infantry-promotion.json (nowy): wyjscie generatora.
- rust-port/engine/tests/p6_unit_replace_l1.rs (nowy): 3 testy (naglowek/liczby wektorow; zgodnosc Typ i "Zastąp specjalnie" units.json z pinem dla 75 jednostek; dla 53 krawedzi `available_replacements_for` zwraca cel przy otwartych bramkach).
- Cargo.lock: wygenerowany lokalnie, NIE commitowany.
- Plik allowlisty `production_units.rs` nietkniety (logika Rust nie wymagala zmian).

TESTY:
- cargo fmt --check (workspace engine): exit 0 (po rustfmt nowego pliku testu).
- cargo clippy --all-targets -- -D warnings: exit 0.
- cargo test --lib: 37 passed, 0 failed.
- cargo test --test p6_unit_replace_l1: 3 passed, 0 failed.
- Negatywna kontrola: z HEAD units.json test "rust_units_json_promotion_field_matches_pin" pada (Wojownik: Rust "—", pin "Włócznik"), po przywroceniu zielony.
- Testy danych jednostek (32 pliki z `units.json` w tests, wykonane 2026-11-11 w tej rundzie, 289 passed, 2 failed):
  - FAIL p6_1d_civ_bonuses::embedded_data_is_byte_identical_to_data_used_for_vectors (tests/p6_1d_civ_bonuses.rs:161): hash FNV units.json w wektorach p6_1d nie zgadza sie z nowym plikiem.
  - FAIL p6_1d_civ_bonuses::strip_diacritics_matches_web_function_cut_verbatim (tests/p6_1d_civ_bonuses.rs:219): sprzezony z UNITS_JSON (linia 207).
  - Na danych z HEAD ten sam plik p6_1d_civ_bonuses: 14 passed, 0 failed. Czyli obie porazki wynikaja z tej zmiany danych.
- Pelny `cargo test --no-fail-fast` (wszystkie binarki engine, ta sama zmiana): 1569 passed, 2 failed; te 2 porazki to dokladnie ponizsze dwa testy p6_1d_civ_bonuses.rs, nic wiecej nie pada.

BLOKADY:
1. Konflikt z allowlista: obie porazki p6_1d_civ_bonuses.rs wymagaja aktualizacji przypietych wektorow / hasha FNV (`dataFnv.units` w pliku wektorow p6_1d_vectors, poza allowlista tego tematu) albo zgody na zmiane tego testu. Operator nie zmienia plikow spoza allowlisty; decyzja orkiestratora/wlasciciela wymagana (pin danych vs. wektory p6_1d).
2. Test strip_diacritics w tym samym pliku: wymaga wyjasnienia po zaktualizowaniu wektorow (prawdopodobnie ta sama przyczyna: sprzezenie z UNITS_JSON), NIE_ZMIERZONO przyczyny.
3. Dane `units.json` maja tez, zgodnie z dispatchem, byc zweryfikowane przez `R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1` (§2 raportu P6-REPIN-UNIT-REPLACE); ten temat wykonuje te zmiane.

RUNDY: 1/5
NASTEPNY KROK: orkiestrator decyduje o zakresie allowlisty dla p6_1d (aktualizacja hasha/wektorow z pinu 07d2fbd72 albo odrzucenie zmiany danych); po decyzji Operator dopisuje poprawke w tej samej rundzie/ID.
DEPLOY/PUSH: NIE WYKONANO (push do rust-port/parity-v2 zabroniony dispatchem; commit jedynie na galezi roboczej).
