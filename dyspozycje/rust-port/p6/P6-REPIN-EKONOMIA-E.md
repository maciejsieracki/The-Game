# P6-REPIN-EKONOMIA-E — Spichlerz z JSON + stawka utrzymania obywateli per epoka

Temat: `R-RUSTPORT-REPIN-EKONOMIA-E-SPICHLERZ-STAWKA-Q1`. Pin weba: `4bbef081d` (delta `dc8a3adc` → `4bbef081d`, kroki 1–2 z `REPIN-DELTA-3.md` §3a).
Baza Rust: `origin/rust-port/parity-v2` @ `a6f1149cc`. Dowód równoważności: wektory z URUCHOMIONEGO weba (esbuild, `git archive 4bbef081d`, zero buildu w `gra/`):
`tests/p6_repin_ekonomia_e_vectors/{citizen,spichlerz}.json`, generator `runs/R-RUSTPORT-REPIN-EKONOMIA-E-SPICHLERZ-STAWKA-Q1/gen-repin-ekonomia-e-vectors.mjs` (odtwarzalny: dwa przebiegi dają bajtowo ten sam wynik).
Skróty: `rp` = `rust-port/engine/src/domain/resource_production.rs`, `bc` = `.../src/domain/building_costs.rs` (moduł `p6_7b`), `es` = `.../src/data/economy_society.rs`.
Numery linii Rust wg commita z tego tematu (HEAD pliku); numery linii weba wg `4bbef081d`.

## 1. Dane (krok 1)

| Plik (web `gra/data/`) | Zmiana weba | Rust | Status |
|---|---|---|---|
| `citizen-resource-upkeep.json:10` | pole `stawkaNaObywatela` 1/2/3 w wierszach epok | `rust-port/engine/data/citizen-resource-upkeep.json` (kopia z pinu), pole `es:770` (`Option<f64>`, `default`, zapis całkowitych jako int `es:741`) | PORT |
| `citizen-resource-upkeep.json:2` | `_opis` (tekst) | ta sama kopia; `opis: String` deserializowany, Rust nie czyta treści | PORT (tekst) |
| `econ-params.json:388,395,402` | `opis` 3 kluczy Spichlerza (wartości 25/25/25 BEZ zmian; klucze teraz czytane) | `data/econ-params.json` (kopia z pinu); wartości czyta `bc:1290` | PORT (tekst) + loader |
| `ai-params.json:285,290,295` | 3× `opis` (R-WEB-PEACE-RULES-Q1) | `data/ai-params.json` (kopia z pinu); Rust czyta tylko `wartosc` | PORT (tekst; zero zmiany zachowania) |
| `war-rules-params.json` | `maxEraForcedWarsPerEra: null`, `maxEraForcedWarsPerCivPerEra`, `enabledForcedWarEras` | brak pliku i brak loadera w Rust (`git grep -n 'war-rules-params\|maxEraForcedWars' rust-port/engine` = 0 trafień); wojna/pokój to osobne tematy | NIE-DOTYCZY |
| `terrain-improvements.json` (48 linii: zasięgi fortu 10→5 / posterunku 5→3, `surowiec_ilosc_tura` 200→50, warunki pastwisk) | wartości terytorium + auto-ulepszenia | Rust czyta je w `domain/terrain.rs:280-285` (zasięg fortu/posterunku), `domain/improvements.rs:906` (`surowiec_ilosc_tura`); to zakres ZAMKNIĘTY „forty/terytorium, 8I” i pliki spoza allowlisty | NIE-DOTYCZY w tym temacie (plik w Rust pozostaje == `dc8a3adc`; weryfikator to sprawdza). Do osobnego tematu terytorium/8I. |

## 2. Ekonomia (krok 2): tabela zmiana → web → Rust → test → status

### 2a. `citizen-resource-upkeep.ts` (26 hunków)

| Hunk web (`citizen-resource-upkeep.ts:linia`) | Rust | Test | Status |
|---|---|---|---|
| 24, 41, 81, 83, 136, 156, 285, 290, 348 (komentarze), 107, 161, 202 (JSDoc/typ) | komentarze/dokumentacja: `rp:173-190`, doc-comment funkcji | — | NIE-DOTYCZY (komentarz; zachowanie niesie kod poniżej) |
| 107–112 `stawkaNaObywatela?: number` (interfejs wiersza) | `es:770` | `p6_repin_ekonomia_e_citizen::real_file_has_era_rates_one_two_three`, `missing_rate_field_parses_as_none_and_round_trips` | PORT |
| 166, 168, 171, 173 `citizenUpkeepRowForEra` (wspólny wybór wiersza; remis epoki: pierwszy wiersz) | `rp:230` `citizen_upkeep_row_for_era` (pusta tabela → `None`; remis przy „najbliższa ≤” = pierwszy wiersz, jak stabilny `sort` weba) | `rate_and_required_grid_match_web` (135), `coverage_drain_lines_match_running_web` (2480; warianty `unsorted-dup`, `dup-below`, `only-high`, `empty`), mutanty E-M05..E-M10 | PORT |
| 181 `citizenRequiredResourcesForEra` przez wiersz | `rp:259` | j.w. + istniejący `p6_8d_citizen_upkeep::era_required_lists_match_web` | PORT |
| 194–197 `citizenUpkeepRateForEra` (brak/NaN/ujemna → fallback 1,0; zero poprawne) | `rp:269` `citizen_upkeep_rate_for_era`, `rp:189` `CITIZEN_UPKEEP_RATE_PER_CITIZEN` (fallback) | j.w. + `nonfinite_and_negative_row_rates_fall_back`, `edge_n_minus_1_n_plus_1_real_table_bronze`; mutanty E-M01..E-M04 | PORT |
| 234 `population?: number` (3. arg) | `rp:298` `population: Option<f64>` | `coverage_drain_lines_match_running_web` | PORT |
| 240, 252 bramka z populacją `haveOk >= floor(pop·stawka)`, bez populacji `haveOk > 0` | `rp:306,311,316` | j.w.; mutanty E-M12..E-M17, E-M23, E-M24 | PORT (E-M13 równoważny, §4) |
| 264 `ratePerCitizen` w wyniku coverage | `rp:198` `rate_per_citizen: Option<f64>`, ustawiane w `resolve_*` i `compute_*` | j.w.; E-M18, E-M21 | PORT |
| 309, 321 `compute…Drain`: `need = floor(pop·stawka_epoki)` | `rp:351-352` | j.w.; E-M11, E-M22 | PORT |
| 337 zwrot `ratePerCitizen` z drenażu | `rp:339` (`coverage.rate_per_citizen`) | j.w. | PORT |
| 401, 405, 409 `citizenUpkeepDisplayLines` stawka z `coverage.ratePerCitizen ?? 1,0` | `rp:387-396` | `display_lines_use_rate_from_coverage_like_web` (360) i w pętli głównej; E-M19, E-M20 | PORT |

### 2b. `building-resource-gate.ts` (10 hunków) i `turn-economy.ts` (15 hunków)

| Hunk web | Rust | Test | Status |
|---|---|---|---|
| gate:38 (import `loadThroughput`, `Difficulty`, `RawConverterParamsJson`) | `bc:1271` `load_throughput` (port `converters.ts:35-45`; Rust nie ma modułu converters → funkcja w `p6_7b`) | `load_throughput_matches_running_web` (144) | PORT |
| gate:330 (44 linie: `SPICHLERZ_DRAIN_JSON_KEY_*`, `FALLBACK`, `SpichlerzDrainParams`, `loadSpichlerzDrainParams`, `spichlerzCeramikaDrainAmount`; usunięte stałe `SPICHLERZ_DRAIN_*_PER_TURN`) | `bc:1242-1244`, `bc:1248`, `bc:1252`, `bc:1290`, `bc:1315`; usunięte `spichlerz_drain_{ceramika,sol}_per_turn()` (jedyny wołający: test p6_7b, zaktualizowany) | `constants_and_keys_match_web`, `load_params_matches_running_web` (92), `ceramika_amount_matches_running_web` (42), `real_econ_params_keys_match_pin_and_resolve_to_25`; S-M07..S-M10, S-M13..S-M15 | PORT |
| gate:415 (`dryRun` bez domyślnej, +`params`) | `bc:1347` `pay_spichlerz_drain_for_city(.., dry_run, &SpichlerzDrainParams)`, `bc:1394` `spichlerz_drain_dry_run(.., &params)` | `pay_and_inactive_status_match_running_web` (1435 × {dry, real}), `edges_n_minus_1_n_n_plus_1` | PORT |
| gate:424, 426, 429, 435, 438 (`ceramikaAmount`, `params.solII`) | `bc:1366` (kwota Ceramiki), `bc:1409` (dry-run), sól `drain_params.sol_ii` | j.w.; S-M01..S-M06, S-M11, S-M17, S-M18 | PORT |
| gate:614, 627 (`drainParams` wymagane w `resolveOwnedBuildingInactiveStatus`) | `bc:1599` `InactiveStatusOptions.drain_params`, `bc:1622` | `pay_and_inactive_status_match_running_web` (inactive × 2); S-M12 | PORT |
| turn-economy:127, 131 (importy) | brak odpowiednika | — | NIE-DOTYCZY: `git grep -nE 'tick_empire_resource\|simulate_ceramika\|computeGarncarnia\|advance_city_economy' rust-port/engine/src` = 0 trafień (pipeline zasobów `turn-economy.ts` nie jest portowany) |
| turn-economy:1356, 1358, 1367, 1374, 1406, 1547, 1567, 1583, 1708, 1797, 2477, 2495, 2499 (przekazywanie `drainParams` w `resolveSpichlerzForCity`, `simulateCeramikaAfterSpichlerzDrains`, `simulateResourcePipelineForPreview`, `computeGarncarniaSurplusZadowolenieByOwner`, `tickEmpireResourcePipeline`, `advanceCityEconomy`) | brak odpowiednika w Rust; rdzeń (`paySpichlerzDrainForCity`, `spichlerzCeramikaDrainAmount`, `loadSpichlerzDrainParams`) przeniesiony w §2b wyżej; `data.econParams` → `load_spichlerz_drain_params(Some(&raw), difficulty)` gotowe do podpięcia przy porcie pipeline'u | — | NIE-DOTYCZY (brak kodu docelowego; do portu pipeline'u zasobów) |

## 3. Założenia (ZAŁOŻENIE)

1. Allowlista nie zawiera istniejących `tests/p6_7b_spichlerz.rs` i `tests/p6_8d_citizen_upkeep.rs` — oba MUSIAŁY zostać zaktualizowane (zmiana sygnatur publicznych funkcji): `p6_7b_spichlerz.rs` przekazuje `SpichlerzDrainParams::FALLBACK` (wartość 25 = wektory z pinu `edb8fb56`), `p6_8d_citizen_upkeep.rs` zeruje `stawka_na_obywatela` w `table()` (stare wektory liczone przy stawce jednolitej 1,0 pozostają regresją ścieżki fallback). Zmiana minimalna, bez zmiany oczekiwań.
2. `data/ai-params.json` skopiowano w całości z pinu (zmieniły się wyłącznie 3 teksty `opis`; jedno źródło prawdy).
3. `stawkaNaObywatela` w JSON nie będący liczbą (napis/bool) powoduje błąd deserializacji (loader jest ścisły, `deny_unknown_fields`/typy); web w takim przypadku użyłby fallbacku. Dane z pinu mają liczby, więc różnica nie występuje; gałąź „nie-liczba → fallback” pokryta jest przez tabele budowane w teście (`None`).
4. `Cargo.lock` wygenerowany przez build jest nieśledzony i nie wchodzi do commitów (`Cargo.toml` poza allowlistą).
5. Wektory `raw` dla `loadSpichlerzDrainParams` przechodzą przez `JSON.stringify` (NaN/Infinity → `null`, −0 → `0`); web i Rust dają ten sam fallback; znak zera porównywany wartościowo (jawnie w teście).
6. Znany wcześniej rozjazd (pre-existing, naprawiony przy okazji): dla duplikatu `epoka` bez dokładnego trafienia stary kod Rust (`max_by_key`) wybierał OSTATNI wiersz, web (stabilny sort) PIERWSZY. Naprawione w `rp:230`; pokrywa wariant `dup-below` i mutanty E-M06/E-M07.

## 4. Weryfikacja

- Nowe testy: `p6_repin_ekonomia_e_citizen` (7), `p6_repin_ekonomia_e_spichlerz` (7). Wektory: citizen 2480 + display 360 + rateGrid 135 (9 wariantów tabeli: real/NaN-Inf-ujemne/własne stawki z lukami/brak pola/złe typy/pusta/nieposortowana z duplikatem/duplikat poniżej/tylko wysokie epoki); spichlerz params 92, throughput 144, amount 42, pay 1435 (× dry i realny) + inactive (× 2 budynki).
- Brzegi N−1/N/N+1: `edge_n_minus_1_n_plus_1_real_table_bronze` (Brąz N=14, Żelazo N=21), `edges_n_minus_1_n_n_plus_1` (próg Ceramiki I/II i Soli), plus siatka wektorów (`minus1`, `exact`, `plus1`).
- NaN/brakujące klucze: era NaN/±Inf, pop NaN/±Inf, stan NaN/±Inf, stawka NaN/±Inf/ujemna, klucz brak/null/liczba/napis/tablica/obiekt pusty/złe typy.
- Mutacje (logi `mut-*.log`): 25 (citizen) + 19 (Spichlerz) + 4 (dane) = 48; 45 ZABITYCH, 3 PRZEŻYŁY — wszystkie RÓWNOWAŻNE:
  - E-M13 (`pop > 0` w bramce coverage): dla `pop <= 0` `need <= 0`, a `have >= 0` zawsze (`positive_stock` ≥ 0) → bramka identyczna;
  - S-M16 (brak `as_object` w wierszu): `serde_json::Value::get(&str)` na nie-obiekcie zwraca `None` → ten sam fallback;
  - S-M19 (brak `is_finite` w `load_throughput`): `serde_json` nie reprezentuje NaN/±Inf (JSON ich nie zawiera, `1e999` to błąd parsowania) → `as_f64` zawsze skończone.
- Niezależny weryfikator Python (`python3 -I verify-e.py`): reimplementacja z opisu + porównanie z wektorami weba (2480+360+135+92+144+42+1435 przypadków, 0 rozbieżności), oraz pliki danych == pin (`git show 4bbef081d:gra/data/...`) i `terrain-improvements.json` == `dc8a3adc`. Test negatywny (zmieniony fallback) wykrywa rozbieżności.
- Bramki: `gate-fmt.txt`, `gate-clippy.txt` (`--all-targets -- -D warnings`), `gate-test.txt` (pełny `cargo test -j 2 --no-fail-fast`: 262 binaria, 1995 testów, 0 failed), `git diff --check` czysty.
