# REPIN-DANE-20261029 — krok 1 odświeżenia portu (temat `R-RUSTPORT-REPIN-DANE-Q1`, runda 1/5)

**Baza:** `origin/rust-port/parity-v2` = `bb74ff9d` (detached). **Cel danych:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` (origin/main, pin docelowy). **Status:** KROK 1a WYKONANY (podmiana 4 kopii bajtowych), KROK 1b–1e NIEWYKONANE (czerwone testy, regeneracja wektorów i derived nie wykonane w tej rundzie). Zakres tematu: `dyspozycje/rust-port/REPIN-DELTA-20261029.md` §5 krok 1.

## 1. Kopie bajtowe (kryterium binarne A)

| Plik (`rust-port/engine/data/`) | sha256 PRZED (pin `edb8fb56`, = baza) | sha256 PO (= `91dc998a:gra/data/...`) | Status |
|---|---|---|---|
| `civs.json` | `72a5027ee645a92d2b2ee1b22d095f21c9ad3f0ac59cecb53cbf352b2ac03d5d` | `eea384b7d62301e7c3b2b54ce76198a321df9517cb0560b050d14b0ea23f30e3` | ZMIENIONY |
| `units.json` | `d2f9916011c2adc151dd1df818631b4426d3df1ae9b5ca2d7c3c8f99c9a625fe` | `0e031b60af2b7db4ad135629c8472f7119e26abd01ba56713c248e51ea7d3c56` | ZMIENIONY |
| `econ-params.json` | `843517551c050dfb56a09a3b268d898078b9fe5b801a0a6a74d0bf93358e0c34` | `7806a53b191dc5844c9b2fb31e71445737958562aa5ca695c903731c67e489e3` | ZMIENIONY |
| `ui-params.json` | `19d1e1a597369cbf500b90d26bce3e72cbadb1dc69b645a8aaef6544ec2fd30e` | `e2dfbd2a08deef60f3ee87d9787e5a866ea005e2d0ec2e089806072f1f4ea58e` | ZMIENIONY |

Weryfikacja: `git show 91dc998a5f1b51ad29e0f4785edfd45655445c53:gra/data/<plik>.json | sha256sum` = kolumna PO (zgodne z `REPIN-DELTA` §2a). Kryterium A: SPEŁNIONE dla 4 plików w `engine/data`.

Kopia w `src-tauri/frontend-v2/tools/pin-manifest.json` (`armyMergePanel.ts`) NIE była ruszana (poza zakresem kroku 1; należy do UI, krok 5).

## 2. Pomiar testów (`cargo test --locked --all-targets --no-fail-fast`, `rust-port/engine`)

Komenda bazy (przed podmianą): `passed 1207, failed 0` (log: scratch `test-r1-baseline.log`, EXIT=0).
Po podmianie 4 plików: `passed 1151, failed 56` (suma 1207 = baza, ZERO testów usuniętych; EXIT=101).
Gate fmt: `cargo fmt --all -- --check` EXIT=0. Gate clippy: `cargo clippy --locked --all-targets -- -D warnings` EXIT=0 (zmiany tylko w JSON, brak zmian w `.rs`).

Uwaga o `Cargo.lock`: w repo go nie ma; wygenerowano lokalnie (`cargo generate-lockfile`), NIE commitowany (plik untracked).

### 2a. Grupy czerwonych testów (56, 15 binariów) — przyczyny techniczne (dowód = log)

| Grupa | Plik danych | Binaria / testy | Przyczyna (dowód) |
|---|---|---|---|
| A. civs schema | `civs.json` | `data_civilizations` (2), `data_compliance` (civs_count, rt_civs, all_29), `p6_1d_city_names` (2), `p6_1d_civ_bonuses` (3), `p6_1e_civ_matrix` (~24), `p6_1e_civ_names` (2), `p6_1e_tables` (1), `p6_m09_rivals` (2), `p6_m12_compute` (5), `p6_m12_spawn` (6) | Web USUNĄŁ z obiektu cywilizacji klucze `Bonus startowy`, `Bonusy/minusy (do dopracowania)`, `bonusy`, `mnoznikHandelPieniadz` (diff: `-` w civs.json). Struktura `CywilizacjeItem` (`rust-port/engine/src/data/civilizations.rs:44-70`, `deny_unknown_fields`) wymaga ich → `missing field \`Bonus startowy\`` (line 147). Usunięcie `bonusy` przenosi logikę bonusów cywilizacji do innego źródła weba (`gra/src/game/civ-bonuses.ts` +106/-98, `civ-ai-data.ts`) → **zmiana wymaga logiki = osobny temat (BLOKADA)**, nie tylko schematu. |
| B. econ schema | `econ-params.json` | `data_economy_society` (1), `data_compliance` (rt_econ_params), `data_loader`, `p6_7a_growth` (population_cap, `src/domain/city_growth.rs:866`) | Klucz `targowisko_praca_na_pieniadz_mnoznik` usunięty, dodany `targowisko_praca_na_podatek_kurs` (struct `rust-port/engine/src/data/economy_society.rs:172-173`, `deny_unknown_fields`) → `unknown field`. Dodatkowo web zmienia regułę Mennicy (`mennica_mnoznik_po_walucie` easy 2→1.62, hard 1→1.38; mnożnik tylko podatku, nie handlu) = **zmiana logiki (BLOKADA)**, nie tylko danych. |
| C. units / derived | `units.json` | `data_units_combat` (`units_parses_and_spot_checks`: left 11 / right 10), `derived_values` (3: `unit_table_*` — Rydwan (woły): epoka Brąz→Kamień, surowiec Brąz→Drewno), `p6_7b_tables` (`unit_stock_cost_matches_flattened_p3_19_table`: Rydwan `{"drewno":25}` vs `{"braz":50}`) | Zmiana 4 wierszy w `units.json` (Rydwan (woły): Epoka, Surowiec, Dostępna w epokach, Utrzymanie surowiec). Tabele `derived/unit-stock-costs.json`, `unit-food.json`, `unit-gold-costs.json`, `unit-gold-states.json` (+ `storage-caps.json`) cytują `gra/data/units.json` i NIE są przeliczone → czerwone. |
| D. pin-hash | `civs.json` (embedded) | `p6_1d_city_names` (`embedded_pool_data_is_byte_identical…`), `p6_1d_civ_bonuses` (`embedded_data_is_byte_identical…`), `p6_1e_civ_matrix` (`data_files_are_byte_identical_to_web_pin`) | Oczekiwany hash testu `62b5f5878fa4d651` ≠ `494c9a51c023f9f7` (hash nowej kopii). Stała pinu w teście do zmiany RAZEM z regeneracją wektorów (nie w tej rundzie). |
| E. diakrytyki | `civs.json` (nazwy) | `p6_1d_civ_bonuses:210` `strip_diacritics_matches_web_function_cut_verbatim` (left 4033 / right 4303) | Liczba znaków po obcięciu różni się od wektora z webu; wektor wymaga regeneracji z `91dc998a`. Przyczyna techniczna do potwierdzenia w rundzie 2 (NIE_ZMIERZONO). |
| F. ui-params | `ui-params.json` | (nie zidentyfikowano osobnego testu czerwonego) | Dodano 2 wpisy (`deals_end_turn_gate`, `player_epoch_war`). Rust nie cytuje ich w testach w tej rundzie; wpływ na `data_loader` (liczba/lista) jest częścią grupy B/A (NIE_ZMIERZONO osobno). |

Lista 56 czerwonych testów: `grep -E '^test .* FAILED$' /home/user/scratch_repin/test-r1-after-swap.log` (surowy log z EXIT=101).

## 3. Derived (krok 1, pkt 2 planu)

Tabele `rust-port/engine/data/derived/*.json` citujące pełną ścieżkę zmienionych plików (`grep -l`): `storage-caps.json`, `unit-food.json`, `unit-gold-costs.json`, `unit-gold-states.json`, `unit-stock-costs.json`.
- **Przeliczone:** 0.
- **Pozostawione (z uzasadnieniem):** wszystkie 5 — przeliczenie wymaga regeneracji z uruchomionego weba `91dc998a` (generator per tabela), nie wykonane w tej rundzie. Tabela jest źródłem prawdy balansu; nie edytowano wzorem.
- Pole `pin_web` / stemple pinu w niezmienionych tabelach i manifestach: NIE ZMIENIANO (zgodnie z dispatchem).

## 4. Wektory `tests/*_vectors/*.json`

Przeliczone: 0. Wymagane (wg grup A–E): `p6_1d_vectors/web-vectors.json`, `p6_1e_vectors/web-vectors.json`, `p6_1b_vectors/web-vectors.json`, `p6_m10_vectors/web-vectors.json`, `p6_m12_vectors/*`, `p6_7a_vectors/*`, `p6_7b_vectors/*`, `data_*`. Generator: skrypty runów zespołu (`R-RUSTPORT-P6-*`/`P3-*`) na `git archive 91dc998a gra/src gra/data` w `mktemp -d` poza repo — NIE_ZMIERZONO (nie uruchomiono w tej rundzie).

## 5. Zmiany w kodzie Rust

Brak (`.rs` nietknięte). Kandydaci do minimalnej zmiany schematu (runda 2, po decyzji o logice): `CywilizacjeItem` (pola usunięte w webie → `Option` + `serde(default)` lub usunięcie) i `EconParams` (`targowisko_praca_na_pieniadz_mnoznik` → `targowisko_praca_na_podatek_kurs`). Każde takie pole oznaczone jako "zmiana wymaga logiki" przenieść do osobnego tematu.

## 6. Założenia rozstrzygające luki (zamiast pytań)

- Z-A: „odświeżenie danych” = bajtowa podmiana 4 kopii + minimalny schemat tylko gdy to czysto strukturalne (rename/usunięcie pola). Zmiany reguł (Mennica, bonusy cywilizacji przeniesione z `civs.json`) = osobny temat.
- Z-B: czerwone testy po podmianie są ZNANE i zmierzone (sekcja 2a); nie są osłabiane ani usuwane.
- Z-C: pin przesuwany jednym ruchem po krokach 1–5 (REPIN-DELTA §6); w tym temacie pin nie zmieniony.

## 7. Podsumowanie stanu (dla orkiestratora)

- Kryterium A (4 pliki bajtowo = `91dc998a`): SPEŁNIONE.
- Kryterium B (lista czerwonych per grupa z dowodem): SPEŁNIONE (sekcja 2a).
- Kryterium C (każda grupa zielona po regeneracji, 0 rozbieżności): NIESPEŁNIONE — runda 2.
- Kryterium D (derived przeliczone vs pozostawione): opisane, przeliczone 0/5.
- Gate: fmt EXIT=0, clippy EXIT=0, test 1207 = baza (0 usuniętych), 56 czerwonych.

## 7b. Pomiar niezależny (wywołanie Operatora-pomiarów, ten sam temat, runda 1/5)

Baza pracy: `7bd0bbad` (raport Operatora-impl) na `44a24509` (podmiana 4 kopii) na `bb74ff9d`. Pliki danych nie były zmieniane w tym wywołaniu (po testach kontrolnych przywrócone do `7bd0bbad`; `git status` czysty poza lokalnym `Cargo.lock`).

**Kryterium A (bajtowo):** sha256 4 plików w `rust-port/engine/data/` = `91dc998a:gra/data/*.json` — zgodne (civs `eea384b7…30e3`, units `0e031b60…7d3c56`, econ-params `7806a53b…89e3`, ui-params `e2dfbd2a…58e`). SPEŁNIONE.

**Lokalny `Cargo.lock`:** w worktree go nie było (plik nieśledzony, poprzedni wygenerowany lokalnie u Operatora); wygenerowany ponownie `cargo generate-lockfile` (17 pakietów, log `genlock-pomiar.log`). Nie commitowany.

**Bramki (surowe logi, EXIT):**
- `cargo fmt --all -- --check`: EXIT=0 (`fmt-pomiar.log`).
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0 (`clippy-pomiar.log`).
- `cargo test --locked --all-targets --no-fail-fast` na danych z 91dc998a: EXIT=101, sumarycznie passed 1151, failed 56 (`test-pomiar.log`; 159 binariów/sekcji `Running`, 56 linii `FAILED`). Zgodne z raportem Operatora.
- Kontrola negatywna (dane z bazy `bb74ff9d` przywrócone, reszta identyczna): EXIT=0, passed 1207, failed 0 (`test-control-base-pomiar.log`). Dowodzi, że 56 czerwonych wynika wyłącznie z podmiany 4 plików danych, a nie z lokalnego środowiska.

**Weryfikacja grup z §2a:** lista 56 czerwonych testów zgodna z grupami A–E (A: `civs_*`, `*_match_web`, `build_cluster_*`, `compute_clusters_*`, `rt_civs`, `real_civs_bonuses_convert_without_loss` i pokrewne; B: `rt_econ_params`, `parse_econ_params_*`, `population_cap_matches_web`, `loads_all_29_files_from_data_dir`; C: `units_parses_and_spot_checks`, `unit_table_*`, `unit_stock_cost_matches_flattened_p3_19_table`; D: 3 testy `*byte_identical*`; E: `strip_diacritics_matches_web_function_cut_verbatim`). Przyczyna techniczna nie została ponownie rozbita per test; źródła błędów w §2a są zgodne z treścią logów na poziomie nazw testów. Nie zmierzono ponownie każdego komunikatu błędu.

**Derived / wektory (bez zmian w tym wywołaniu):** przeliczone 0/5 derived i 0 wektorów. Regeneracja wymaga generatora z uruchomionego weba `91dc998a` — NIE_ZMIERZONO w tym wywołaniu; przeniesione do rundy 2.

**Wniosek:** Kryteria B i D (dokument, lista czerwonych) spełnione; kryterium C (zielone po regeneracji) NIESPEŁNIONE — runda 2 wymagana. Status tematu: BLOCK (techniczny, runda 1/5), bez zmiany względem raportu Operatora-impl. DEPLOY/PUSH: NIE WYKONANO.

## 8. Runda 2 (Operator-impl, `R-RUSTPORT-REPIN-DANE-Q1` r2/5)

**Baza r2:** `7d515368` (pomiary r1) na `44a24509` (dane) na `bb74ff9d`. Dane `engine/data/{civs,units,econ-params,ui-params}.json` bez zmian w r2 (sha256 jak w sekcji 1). **Wynik:** `passed 1195, failed 12` (suma 1207 = baza r1, zero usunietych testow). Logi: `test-r2.log` (EXIT=101), `fmt-r2.log` (EXIT=0), `clippy-r2.log` (EXIT=0).

### 8.1 Zmiany w schemacie (commit C1)

- `rust-port/engine/src/data/civilizations.rs`: `bonus_startowy`, `bonusy_minusy_do_dopracowania`, `mnoznik_handel_pieniadz`, `bonusy` -> `Option<...>` z `serde(default, skip_serializing_if = "Option::is_none")`. Podstawa: web `gra/src/data/loader.ts:218-227` typuje te pola jako opcjonalne (`?`), a runtime czyta `row.bonusy ?? []` (`gra/src/game/economy.ts:776`, `civ-bonuses.ts` `bonusy ?? []`). Round-trip zachowany (brak klucza = brak klucza).
- `rust-port/engine/src/data/economy_society.rs`: pole `targowisko_praca_na_pieniadz_mnoznik` -> `targowisko_praca_na_podatek_kurs` (typ bez zmian).
- `EconParamsGlobalneMennicaMnoznikPoWalucie`: `easy`, `hard` z `i64` na `f64` (web 91dc998a: 1.62 / 1.38).
- Testy: `tests/data_civilizations.rs` (48 wpisow bonusow / 15 list / mnoznik 2.3 -> asercja, ze 15/15 obiektow nie ma kluczy = None; 0 list), `tests/p6_1d_civ_bonuses.rs` (`civ.bonusy.iter().flatten()`; prog `checked >= 40` -> `checked == 0`), `tests/data_units_combat.rs` (epoki Kamien 10->11, Braz 40->39; zmierzone `units.json` 91dc998a), `tests/recruitment.rs` (Rydwan (woly) stock `braz` 50 -> `drewno` 25; zrodlo: derived 91dc998a).

### 8.2 Derived (commit C2) - lista przeliczonych vs pozostawionych

Generatory uruchomione na danych 91dc998a (`git archive` do katalogu tymczasowego poza repo). **Kontrola przed kazdym uruchomieniem:** generator na danych `edb8fb56` odtwarza committed plik bajt-w-bajt.

| Tabela | Generator | Kontrola edb8fb56 | Wynik 91dc998a | Decyzja |
|---|---|---|---|---|
| `unit-stock-costs.json` | `gen-web.mjs` (P3-19) | identyczna | diff 1 rekord: Rydwan (woly) (Kamien, Drewno 25/5) | PRZELICZONA |
| `unit-food.json` | `gen-round4.mjs` | identyczna | diff tylko rekord Rydwan (woly) (linie 664-754) | PRZELICZONA |
| `unit-gold-costs.json` | `gen-work-gold.mjs` | identyczna | diff 6 linii: Rydwan Braz 30/24 -> Kamien 15/12 | PRZELICZONA (funkcje zrodlowe bez zmian: `production.ts:255-289` 0 hunkow, `economy-upkeep.ts` 0 zmian, `units/setup.ts` 0 zmian) |
| `storage-caps.json` | `gen-round4.mjs` | identyczna | identyczna | pozostawiona (bez zmian danych) |
| `building-gold-upkeep.json`, `racje.json`, `research-costs.json`, `wonder-work.json` | `gen-round4.mjs` | identyczna | identyczna | pozostawione (bez zmian) |
| `improvement-work.json` | `gen-round4.mjs` | identyczna | identyczna | pozostawiona; ZALOZENIE: `terrain-improvements.ts` zmienione w 91dc998a (hunki 70-114), wynik generatora nie dowodzi zgodnosci z nowa logika - do tematu logiki |
| `unit-gold-states.json` | `gen-round4.mjs` | identyczna | diff 64 linie (Rydwan) | NIE PRZELICZONA: `production.ts` hunki 583-587 (`unitMoneyCost`) i 628-640 (`civRecruitmentDiscount`) = zmiana logiki; przeliczenie generatorem edb8fb56 kodowaloby stara logike. Diff dostepny do tematu logiki |
| `building-work-states.json` | `gen-round4.mjs` | identyczna | diff 6828 linii (znizka cywilizacji z civs.json = 0; `production.ts` hunk 562 = zmiana `buildingWorkCost`) | NIE PRZELICZONA: zmiana logiki + danych (BLOKADA) |

Meta `zrodlo` przeliczonych tabel: zaktualizowane (dane 91dc998a, logika edb8fb56 zweryfikowana diffem). Pin w niezmienionych tabelach i manifestach: NIE ZMIENIANO.

### 8.3 Wektory (commit C3)

| Plik | Generator | Kontrola edb8fb56 | Decyzja |
|---|---|---|---|
| `tests/p6_1e_vectors/web-vectors.json` | `gen-p61e-web-vectors.mjs` (`--experimental-transform-types`) | bajt-w-bajt identyczna | REGENEROWANA z 91dc998a |
| `tests/p6_1d_vectors/web-vectors.json` | `gen-p61d-web-vectors.mjs` (`--experimental-strip-types`) | bajt-w-bajt identyczna (po poprawce `?? []`, patrz 8.4) | REGENEROWANA z 91dc998a |
| `p6_1b`, `p6_1c`, `p6_m09`, `p6_m10`, `p6_m11`, `p6_m12`, `p6_7a`, `p6_7b` | - | - | NIE REGENEROWANE: testy tych grup zielone bez regeneracji |

Hash pinu: stala `62b5f5878fa4d651` w wektorach edb8fb56; po regeneracji wektory niosa `494c9a51c023f9f7` = fnv1a64(`civs.json` 91dc998a). Testy `embedded_*` i `data_files_are_byte_identical_to_web_pin` sa zielone bez zmiany stalej w kodzie testu.

### 8.4 Zmiana w generatorze (run-folder, allowlista `runs/**`)

`dyspozycje/autobot/runs/R-RUSTPORT-P6-1D-CIV-BONUSY-NAZWY-Q1/gen-p61d-web-vectors.mjs`: `civ.bonusy` -> `civ.bonusy ?? []` (dwa miejsca). Bez tej poprawki generator wywala sie na 91dc998a (`Cannot read properties of undefined`). Na edb8fb56 zachowanie identyczne (kontrola bajt-w-bajt po poprawce).

### 8.5 Wyniki testow: per test

Kolumna "grupa r1" = przyczyna pierwotnego czerwonego (z `t0.log`). Wszystkie 56 czerwonych r1 maja status r2 w tabeli; 5 wierszy ponizej tabeli to testy, ktore byly ZIELONE w r1 i staly sie czerwone po regeneracji wektorow p6_1d (wektory r1 opisywaly logike edb8fb56, wiec ukrywaly dryf logiki).

| # | test | grupa r1 | status po rundzie 2 | przyczyna / dowod |
|---|---|---|---|---|
| 1 | `civs_json_parses_and_spot_checks` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 2 | `all_29_data_files_parse_with_rust_modules` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 3 | `civs_count_and_ids_match_web_pin` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 4 | `rt_civs` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 5 | `rt_econ_params` | B (econ-params.json: targowisko_praca_na_pieniadz_mnoznik) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 6 | `parse_econ_params_parses_and_spot_checks` | B (econ-params.json: targowisko_praca_na_pieniadz_mnoznik) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 7 | `loads_all_29_files_from_data_dir` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 8 | `neg_missing_file_is_file_missing` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 9 | `neg_every_listed_file_is_required_by_load_all` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 10 | `units_parses_and_spot_checks` | C (units.json / derived: Rydwan (woly)) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 11 | `unit_table_epoch_field_matches_units_json` | C (units.json / derived: Rydwan (woly)) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 12 | `unit_table_keeps_the_units_json_base_as_provenance` | C (units.json / derived: Rydwan (woly)) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 13 | `unit_table_key_shape_and_positive_integer_values` | C (units.json / derived: Rydwan (woly)) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 14 | `embedded_pool_data_is_byte_identical_to_data_used_for_vectors` | D (pin hash danych w wektorach) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 15 | `validate_city_names_pools_matches_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 16 | `embedded_data_is_byte_identical_to_data_used_for_vectors` | D (pin hash danych w wektorach) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 17 | `real_civs_bonuses_convert_without_loss` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 18 | `strip_diacritics_matches_web_function_cut_verbatim` | E (strip_diacritics: wektor) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 19 | `ai_profiles_and_norms_match_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | CZERWONY (logika) | LOGIKA: web civ-ai-data.ts (fallback -> undefined; resolveArchetypeAggressionWithDifficulty) i civ-matrix-semantic.ts (statusy BLOCKED/UNWIRED/REAL_GAMEPLAY, opisy) != port |
| 20 | `ai_params_and_diplomacy_rows_match_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 21 | `ai_fallback_branches_are_actually_exercised` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 22 | `ai_by_typ_resolvers_match_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | CZERWONY (logika) | LOGIKA: web civ-ai-data.ts (fallback -> undefined; resolveArchetypeAggressionWithDifficulty) i civ-matrix-semantic.ts (statusy BLOCKED/UNWIRED/REAL_GAMEPLAY, opisy) != port |
| 23 | `apply_civ_matrix_param_matches_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 24 | `civ_matrix_param_at_difficulty_matches_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 25 | `civ_matrix_param_def_matches_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 26 | `data_files_are_byte_identical_to_web_pin` | D (pin hash danych w wektorach) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 27 | `civ_matrix_params_at_difficulty_matches_web_order_and_values` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 28 | `consumer_status_polarity_band_baseline_match_web_per_parameter` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | CZERWONY (logika) | LOGIKA: web civ-ai-data.ts (fallback -> undefined; resolveArchetypeAggressionWithDifficulty) i civ-matrix-semantic.ts (statusy BLOCKED/UNWIRED/REAL_GAMEPLAY, opisy) != port |
| 29 | `civ_matrix_param_matches_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 30 | `every_status_for_every_parameter_matches_web_texts` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | CZERWONY (logika) | LOGIKA: web civ-ai-data.ts (fallback -> undefined; resolveArchetypeAggressionWithDifficulty) i civ-matrix-semantic.ts (statusy BLOCKED/UNWIRED/REAL_GAMEPLAY, opisy) != port |
| 31 | `every_matrix_cell_parses_exactly_like_js` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 32 | `param_order_and_rows_match_web_for_every_scenario` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 33 | `scale_parameters_are_clamped_and_shifted_only_for_skala` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 34 | `proc_sum_and_apply_proc_match_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 35 | `snapshot_and_profiles_match_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | CZERWONY (logika) | LOGIKA: web civ-ai-data.ts (fallback -> undefined; resolveArchetypeAggressionWithDifficulty) i civ-matrix-semantic.ts (statusy BLOCKED/UNWIRED/REAL_GAMEPLAY, opisy) != port |
| 36 | `synthetic_cell_grid_matches_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | CZERWONY (logika) | LOGIKA: web civ-ai-data.ts (fallback -> undefined; resolveArchetypeAggressionWithDifficulty) i civ-matrix-semantic.ts (statusy BLOCKED/UNWIRED/REAL_GAMEPLAY, opisy) != port |
| 37 | `profile_by_key_resolution_matches_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | CZERWONY (logika) | LOGIKA: web civ-ai-data.ts (fallback -> undefined; resolveArchetypeAggressionWithDifficulty) i civ-matrix-semantic.ts (statusy BLOCKED/UNWIRED/REAL_GAMEPLAY, opisy) != port |
| 38 | `assign_invariants_hold_on_real_roster` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 39 | `civ_ids_from_roster_matches_web` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 40 | `params_table_is_consistent_with_matrix_and_civs` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 41 | `population_cap_matches_web` | B (econ-params.json: targowisko_praca_na_pieniadz_mnoznik) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 42 | `unit_stock_cost_matches_flattened_p3_19_table` | C (units.json / derived: Rydwan (woly)) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 43 | `rival_slots_degenerate_inputs_do_not_panic` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 44 | `rival_slots_match_web_on_real_maps` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 45 | `compute_clusters_matches_web_maps_1101_to_2500_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 46 | `compute_clusters_matches_web_maps_2501_to_5000_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 47 | `compute_clusters_matches_web_maps_501_to_1100_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 48 | `compute_clusters_matches_web_maps_over_5000_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 49 | `compute_clusters_matches_web_maps_up_to_500_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 50 | `build_cluster_spawn_plan_matches_web_maps_1101_to_2500_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 51 | `build_cluster_spawn_plan_matches_web_maps_over_2500_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 52 | `build_cluster_spawn_plan_matches_web_maps_501_to_1100_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 53 | `build_cluster_spawn_plan_matches_web_maps_up_to_500_hexes` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 54 | `spawn_plan_without_land_falls_back_to_origin_and_player_name` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 55 | `to_start_plan_keeps_every_field_and_drops_only_placement` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 56 | `rust_spawn_plan_reproduces_p6_1c_web_spawn_plans` | A (civs.json: brak pol Bonus startowy / bonusy / mnoznikHandelPieniadz) | ZIELONY | usuniety blad parsowania / drift danych (zob. grupa) |
| 57 | `is_combat_modifier_bonus_matches_web` | p6_1d (wektor regenerowany) | CZERWONY (logika), NOWY w r2 | LOGIKA: `civ-bonuses.ts` isCombatModifierBonus (hunk -377,3 +387,1) != `civ_bonuses.rs`; dowod `tests/p6_1d_civ_bonuses.rs:455` (`piechota` wartosc 0.0) |
| 58 | `matrix_bonusy_match_web_for_every_civ_key_variant` | p6_1d | CZERWONY (logika), NOWY w r2 | LOGIKA: `civMatrixBonusyForCivKey` (hunki 288-320); `tests/p6_1d_civ_bonuses.rs:381`, klucz `grecy` |
| 59 | `movement_range_siege_wall_multipliers_match_web` | p6_1d | CZERWONY (logika), NOWY w r2 | LOGIKA: `civMovementMultiplier` (hunk +335,7; usunieta `applyWalkBonus`); `tests/p6_1d_civ_bonuses.rs:402` (1.07 vs 1.0) |
| 60 | `bonus_applies_per_entry_matches_web_for_multi_entry_lists` | p6_1d | CZERWONY (logika), NOWY w r2 | LOGIKA: `bonusApplies` (hunki 142-181); `tests/p6_1d_civ_bonuses.rs:357` |
| 61 | `bonus_applies_and_stat_multipliers_match_web` | p6_1d | CZERWONY (logika), NOWY w r2 | LOGIKA: `bonusApplies` / `civCombatStatMultipliers` (hunki 189-196); `tests/p6_1d_civ_bonuses.rs:319` |

Rozklad 56 wierszy r1 wg przyczyny pierwotnej: A (civs.json: brak kluczy, 44 testy laduja dane), B (econ-params: 3 wiersze + `population_cap`), C (units/derived: 5 wierszy + `unit_stock_cost`), D (hash pinu: 3), E (strip_diacritics: 1). Przyczyny grupy A dotycza pierwszego bledu parsowania civs.json blokujacego kazdy test ladujacy dane; po usunieciu tego bledu 7 z nich ujawnia logike (p6_1e), reszta jest zielona.

### 8.6 Odpowiedzi na zarzuty (runda 2)

1. **Cel niespelniony, BLOCK bez dowodu technicznego** - PRZYJMUJE. Wykonano: schemat (C1), derived 3/5 przeliczone z kontrola (C2), wektory p6_1d/p6_1e regenerowane z 91dc998a z kontrola (C3). Czerwone spadly z 56 do 12. Pozostale 12 ma dowod logiki (8.5), nie danych: BLOCK technicznie uzasadniony, do osobnego tematu.
2. **Mennica: brak dowodu, ze Rust wykonuje logike** - PRZYJMUJE (sprawdzone). `grep -rn mennica_mnoznik rust-port/engine/src rust-port/engine/tests rust-port/engine/benches`: trafienia to definicje pol w `economy_society.rs:287-288` i wektor `p6_7a_vectors/params.json` (nieczytany przez logike, zielony). Konsumenci istnieja po stronie weba: `gra/src/game/economy.ts:236`, `gra/src/game/turn-economy.ts:308`. Czerwone econ w r1 byly bledem parsowania (`unknown field`, `1.62 expected i64`), nie logiki; po zmianie typu/nazwy zielone. Osobny temat (port logiki Mennicy) pozostaje, z dowodem: 0 konsumentow w Rust.
3. **Bonusy cywilizacji: brak sprawdzenia Option + serde(default)** - PRZYJMUJE. Zrobione (8.1). Parsowanie civs.json zielone; 5 testow `p6_1d_civ_bonuses` jest czerwonych z powodu logiki `civ-bonuses.ts`, nie parsowania (8.5).
4. **Brak rozbicia per test; E i F NIE_ZMIERZONO** - PRZYJMUJE. Tabela per test (8.5). E (`strip_diacritics`, 4033 vs 4303): przyczyna = wektor `dataStringCount`/xor z edb8fb56; zielone po regeneracji. F (ui-params): `parse_ui_params` (`economy_society_part2.rs`) i `data_compliance.rs` zielone; nowe wpisy `deals_end_turn_gate`, `player_epoch_war` nie maja czerwonego testu.
5. **Derived 0/5, wektory 0, generator nieuruchomiony** - PRZYJMUJE. Generatory uruchomione z kontrola bajt-w-bajt (8.2, 8.3). Przeliczone: 3 derived + 2 wektory. Pozostawione z uzasadnieniem: 2 derived (zmiana logiki, 8.2), `storage-caps` i pozostale identyczne. ZALOZENIE: `improvement-work.json` nie zweryfikowany wobec zmienionej logiki terenu.
6. **Proces: WIP commit 44a24509 z 56 czerwonymi, dispatch "commit po grupie"** - CZESCIOWO PRZYJMUJE. Commity rozdzielone wg grup (C1 schemat, C2 derived, C3 wektory, C4 dokument/logi). Pojedynczy commit nie jest zielony sam (np. C1 bez C3 zostawia czerwone wektory); zielony jest dopiero stan koncowy. Opisane w `03-operator-r2.md`.
7. **Dwie sekcje `## 7`** - PRZYJMUJE. Druga przemianowana na `## 7b` (commit C4).
8. **Kontrola negatywna 1207/0 wartosciowa, ale nie zastepuje pracy** - PRZYJMUJE: praca wykonana; kontrola z r1 (baza 1207/0) nadal wazna, liczba testow bazy bez zmian.

### 8.7 Stan koncowy r2 (dla orkiestratora)

- Kryterium A (4 pliki = 91dc998a): SPELNIONE (bez zmian w r2).
- Kryterium B (lista czerwonych per grupa z dowodem): SPELNIONE (8.5).
- Kryterium C (zielone po regeneracji): NIESPELNIONE - 12 czerwonych, wszystkie logiczne (zmiana reguly web, nie danych). Wymaga osobnego tematu: port `civ-bonuses.ts`, `civ-ai-data.ts`, `civ-matrix-semantic.ts` do Rust (BLOKADA).
- Kryterium D (derived przeliczone vs pozostawione): SPELNIONE (8.2), z 2 pozycjami BLOKADA logiki.
- Gate: fmt EXIT=0, clippy EXIT=0, test 1195/12 (baza 1207).
- DEPLOY/PUSH: NIE WYKONANO.
