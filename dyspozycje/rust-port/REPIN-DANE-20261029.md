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

## 7. Pomiar niezależny (wywołanie Operatora-pomiarów, ten sam temat, runda 1/5)

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
