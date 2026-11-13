STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1 (#15 / T-A): przepustowosc brazu per epoka, runda 2 (dodatek r2 z dispatchu)
GOAL: brąz per epoka 1:1 z pinu 07d2fbd72: wiersze `budynek_huta_braz_epoka2_przepustowosc` (50) i `budynek_huta_braz_epoka3_przepustowosc` (75) przez `throughputEraParamKeys` na 3 recepturach brazu; brak mnożnika m(e) dla brazu; `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` = 3 wpisy (bez brazu).
ZMIANY/COMMIT: baza 0ca58770e (detach). Commit kodu i raportu: SHA w sekcji DEPLOY/PUSH (brak push). Allowlista:
  - rust-port/engine/src/domain/turn_economy_resources.rs: pole `throughput_era_param_keys` w `ConverterRecipe`; `converter_throughput_era_param_key` (web converterThroughputEraParamKey, converters.ts:177-185); `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` 6 -> 3 (converters.ts:148-152); `converter_throughputs_for_era` na sciezke ticku (turn-economy.ts:2463-2490: fallback brazu = baza huty).
  - rust-port/engine/data/econ-params.json: +2 wiersze brazu (kopia bloku pina gra/data/econ-params.json:369-382). POZA allowlista (wpis w dodatku r2, pkt 2).
  - rust-port/engine/src/data/economy_society.rs: +2 pola `budynek_huta_braz_epoka{2,3}_przepustowosc` w typowanym `EconParams` (deny_unknown_fields). Uzasadnienie (allowlista src/data/** dla kluczy przepustowosci): te klucze SA czytane przez ten plik; bez pola ladowanie econ-params pada (testy data_compliance / data_loader / data_economy_society / p6_7a_growth).
  - rust-port/engine/tests/p6_ekonomia_braz_era.rs (NOWY, 9 testow), p6_ekonomia_braz_era_gen.mjs (NOWY, generator wykonujacy tekst pina: converters.ts, citizen-consumption-era.ts, 2 lambdy turn-economy.ts 1503/2484, stripTypeScriptTypes), p6_ekonomia_braz_era_vectors/braz.json (wygenerowane; fragmentSha256 = f0e28920dedcd63f6b5b0207facd5b574a33e03087ab7f13b204257df69ef318, testowane w tescie).
  - rust-port/engine/tests/p6_turn_econ_res_pipeline.rs (allowlista r2): oczekiwania brazu zmienione wg pina: eraCases dla brazu (plaski, bez m(e)) i test `converter_throughputs_for_era_match_web_vectors` (brazy z wierszy epok 50/75; wczesniej 50*m(e)). Pozostale asercje bez zmian; liczba sprawdzen brazu = 3 * liczba epok.
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1/02-operator-r2.md (ten raport).
  - Cargo.lock NIE commitowany (niesledzony, wygenerowany przez cargo).
  Przeliczone wartosci brazu (pin): era<=1/NaN/Inf/2.x -> 50; era>=3 (floor) -> 75; cegielnia/garncarnia/odlewnie zelaza bez zmian.
TESTY (kody wyjscia / wyniki):
  - `cargo fmt --check` (caly crate): exit 0.
  - `cargo clippy --all-targets -- -D warnings`: exit 0 (po poprawce `map_or(true,..)` -> `is_none_or`).
  - `cargo test --lib`: 110 passed, 0 failed.
  - `cargo test --test p6_ekonomia_braz_era`: 9 passed (SHA fragmentu, rekordy receptur, klucze epok N-1/N/N+1, progi, econ-params, zgodnosc ze sciezka 1 i 2 wektorow).
  - `cargo test --test p6_turn_econ_res_pipeline`: 8 passed. `p6_repin_ekon_f_converters`: passed.
  - PELNY `cargo test --no-fail-fast` (uruchomiony z poprawka testu p6_adv_city_econ_pipeline, PRZED jej wycofaniem): 3304 passed, 6 failed (5 binarek, lista ponizej). Po wycofaniu poza-allowlistowej zmiany w p6_adv_city_econ_pipeline.rs dochodzi 1 failed (`converter_throughputs_for_era_match_running_web`) -> razem 7 failed.
  - Failing (wszystkie przez stare wektory brazu z pina 4bbef081d, nie przez zmiane kodu produkcyjnego):
      p6_adv_city_econ_pipeline: advance_resources_match_running_web; converter_throughputs_for_era_match_running_web (vectors p6_adv_city_econ_vectors/advance.json)
      p6_adv_q4_preview: preview_pipeline_matches_running_web (rich-53 ceramika owner 1: rust=50 web=33 -> nizsza produkcja drewna/brazu w web)
      p6_adv_q5_tick: whole_advance_city_economy_matches_running_web, zloto_resolver_is_snapshot_before_drain_z_q4_3 (live-32 garncarniaSurplusZadowolenie rust=1.0 web=0.0)
      p6_adv_q6_wire: game_economy_wiring_matches_running_web (wire-30 b0 surowce po.braz rust=40 web=65)
      p6_empirefood_e2e: empire_food_block_matches_running_web (ef-13 city surowce po.braz rust=65 web=90)
  - Naprawione w tej rundzie: data_compliance (2), data_loader (2), data_economy_society (1), p6_7a_growth population_cap (1) -- przez pole w EconParams.
BLOKADY:
  1. [KRYTYCZNA, wymaga decyzji orkiestratora] Wektory `running web` (p6_adv_city_econ_vectors/advance.json, p6_adv_q4/q5/q6 vectors, p6_empirefood_vectors) zostaly wygenerowane na webie z pina 4bbef081d, gdzie brąz = huta*m(e). Pin 07d2fbd72 zmienia brąz (wiersze per epoka). Te 7 testow jest CZERWONYCH wlasciwie (wartosci stare), ale ich naprawa wymaga regeneracji wektorow z pina 07d2fbd72. Generatory (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1/gen-p6-adv-city-econ-vectors.mjs` i pozostale gen-*) maja PIN zaszyty na 4bbef081d i sa poza allowlista; pliki wektorow tez. Operator NIE poprawia asercji ani wektorow (zakaz osłabiania). Potrzebna decyzja: rozszerzyc allowlist o katalogi wektorow p6_adv_*/p6_empirefood_* i generatory, z PIN=07d2fbd72 -> nowa runda regeneracji.
  2. Poza-allowlistowa zmiana tymczasowo wprowadzona w `tests/p6_adv_city_econ_pipeline.rs` (dopisanie wierszy brazu do econ i oczekiwan brazu wg pina dla `converter_throughputs_for_era_match_running_web`) -- WYCOFANA (git checkout), zeby nie wykraczac poza allowlist. Propozycja do rozwazenia przy regeneracji (blokada 1).
  3. ROZBIEZNOSC Z PINEM (jawna, nieosiagalna w produkcji): sciezka podgladu (turn-economy.ts:1503, fallback = throughputFallback receptury) vs sciezka ticku (turn-economy.ts:2484, fallback = baza huty) daja rozne brazy, gdy raw nie ma wierszy brazu a nadpisuje huta (huta=30: podglad 50, tick 30). W econ-params wiersze zawsze sa, wiec nieosiagalne w produkcji. Rust implementuje sciezke ticku; podglad (path1) pokryty testem jako rozbieznosc znana (`known_divergence_huta_only_is_reported_not_hidden`). Dla huta_only zgodnosc path1 pominieta w tescie.
  4. Zmiana wartosci brazu w tescie `p6_turn_econ_res_pipeline.rs` (eraCases/throughputs_for_era) -- zgodna z pinem; stare wektory `out` dla brazu nie sa juz porownywane (sprawdzane wzorem pina).
  5. NIE_ZMIERZONO: bramki z kodami dla `cargo test --no-fail-fast` na stanie po wycofaniu zmiany poza allowlista (ostatni pelny przebieg z zmiana); nie uruchomiono ponownie po wycofaniu (jedyna roznica: 1 test thr).
RUNDY: 2/5 (r1 FAIL na FC; r2 = ten raport). Decyzja wymagana: patrz BLOKADA 1.
NASTEPNY KROK: orkiestrator decyduje o rozszerzeniu allowlisty i regeneracji wektorow running-web z pina 07d2fbd72 (7 testow w 5 binarkach); po regeneracji pelny `cargo test --no-fail-fast` 0 failed -> FC.
DEPLOY/PUSH: NIE WYKONANO (brak push). Commit lokalny na gałęzi `wip/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1-r2` (baza 0ca58770e). Uwaga: gałąź `wip/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1` JUŻ ISTNIEJE z cudzą historią (b4833db8c, ZLOZA-B; zawiera 02a-obrona.md z poprzedniej próby r2 zablokowanej dyskiem) i NIE została nadpisana.
