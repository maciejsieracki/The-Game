# P6.7B - miasta: wzrost, czesc B - koszty budynkow (`building-cost-tempo.ts`, `building-stock-cost.ts`, `building-resource-gate.ts`)

Temat: `R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1` (DOMAIN: GAME), runda 1/5, rola Operator (Sonnet 5.5 medium; rozstrzygniety wyjatek rust-port R-PROC-AUTOBOT.md §5a).
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `c4fa31a2` (spelnione: baza >= `c4fa31a2`; silnik na bazie: 1054 testy, patrz §8).
Artefakty runu (generatory, loader, weryfikator, mutacje, tabela symboli, logi bramek): `dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/`.
Zakres: trzy pliki P6.7B z `gra/src/game/`. Czesc A (`city_growth.rs`, `population-growth-v85.ts` i pokrewne) jest osobnym tematem i NIE jest ruszana (rozlaczne allowlisty).

## 1. Werdykt rundy 1 (stan faktyczny)

| Pytanie | Odpowiedz |
|---|---|
| Co jest portowane? | Wszystkie deklaracje trzech plikow (tabela §3): 68 wierszy; PORTOWANY=60, PORTOWANY-Z-WSTRZYKNIETYMI=8. Slownik statusow zamkniety i wymuszony generatorem `gen-symbols-p67b.py`. |
| Podzial na rundy | Wszystkie trzy pliki zamkniete w RUNDZIE 1 (jedna grupa na runde wg dispatchu = jedna czesc P6.7B); zadne kryterium nie zostalo oslabione. |
| Dowod "PORTOWANY" | Kod Rust + test + wektory z URUCHOMIONEGO weba (pin; PRAWDZIWY kod TS ladowany loaderem, zero stubow logiki) + niezalezny weryfikator Python (335375 sprawdzen, 0 rozbieznosci; w tym 282230 punktow kodowych NFD) + mutacje wykrywane (115/127 wykrytych, 12 nie wykrytych (rownowazne z uzasadnieniem: 12); §6). |
| Mnozniki i dane | Zero literalow balansowych w nowym kodzie: tempo kosztow, progi i slowa epok, FALA2, etykiety, zloza, prerekwizyty, dostep wodny, stale Spichlerza, komunikaty -> `data/derived/building-cost-params.json` (parser `data/derived.rs`); dane Unicode do klucza `stripDiacriticsLower` -> `data/derived/nfd-strip-table.json` (§7, `dowody/grep-literals-r1.txt`). |
| Wymaganie `NIE zmieniaj istniejacych testow` | Spelnione: zero zmian w istniejacych plikach testow, istniejace API `building_costs.rs` (`BuildingCost`, `canonical_building_costs`, `spend_building_cost`...) bez zmian (§8). |
| Zgodnosc z tabelami P3-19 | Port liczy z `buildings.json`/`units.json` te same wartosci, ktore sa splaszczone w `building-stock-costs.json` (42 budynki), `unit-stock-costs.json` (75 jednostek), `building-work-costs.json` (mnoznik ery i Praca bazowa) i `building-work-states.json` (tempo kosztow, tryb normalny): testy `p6_7b_tables.rs` (§5). |
| Co NIE jest zrobione | Integracja z wolajacymi (`production.ts`, `cityPanel.ts`, `main.ts`, `ai.ts`, `turn-economy.ts`) i pozostale eksporty plikow wstrzyknietych (`r-stawki-strojenie.ts`, `zloto-access.ts`, `production.ts`) - jawna lista w §9. |

## 2. Zrodla przeczytane w calosci (liczby linii)

Pin `edb8fb56`, wypakowane `git archive edb8fb56 gra/src gra/data` do wlasnego `mktemp -d` POZA repo (`/tmp/p67b-web.*`). Liczby linii: `wc -l` oraz niepuste (`grep -c .`); dispatch podawal 36/572/388 (niepuste dla dwoch ostatnich zgodne; dla `building-cost-tempo.ts` skrypt `grep -c .` daje 40, a `wc -l` 39, bo ostatnia linia nie konczy sie LF).

| Plik | `wc -l` | niepuste | Przeczytany |
|---|---|---|---|
| `gra/src/game/building-cost-tempo.ts` | 39 | 40 | w calosci (`cat`) |
| `gra/src/game/building-stock-cost.ts` | 420 | 388 | w calosci (`cat -n`, linie 1-420) |
| `gra/src/game/building-resource-gate.ts` | 619 | 572 | w calosci (`cat -n`, linie 1-619) |

Zaleznosci wolane przez te pliki (czytane na potrzeby portu, tylko to, co jest wolane): `zloto-access.ts` w calosci (145 linii); `r-stawki-strojenie.ts` linie 1-62 (stale `R_STAWKI_*` i `scaleStockCostRecord`, l.36-47); `production.ts:655-664` (`isBuildingSupersededByUpgrade`); `data/buildings.json` i `data/units.json` (jako wejscia wektorow); `types/*` nie sa potrzebne (typy tylko). `DECL` skryptu `gen-symbols-p67b.py` skanuje deklaracje poziomu pliku w trzech plikach i wymusza wiersz dla kazdej (§3).

## 2a. Dokumenty obowiazkowe z dispatchu: dowod odczytu i skutki dla portu

Dokumenty pobrane przez `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<sciezka>` (kopie robocze w `/tmp`, poza repo). Czytane tylko fragmenty istotne dla P6.7B; to, czego NIE czytano w calosci, jest nazwane.

| Dokument | Co przeczytano | Skutek dla portu |
|---|---|---|
| `p6/P6-0-GAP-ANALYSIS.md` (435 linii) | §0 (metoda: `PORTOWANE-1:1` tylko z wektorem), §1a (P6.7: 8 plikow), §2 (huby: `building-stock-cost.ts` 8 importujacych, `building-resource-gate.ts` 5, `r-stawki-strojenie.ts` 6), §3 wiersze 26-28 i 141 (`r-stawki-strojenie.ts` -> P6.7, "Rust ma WARTOSCI, nie mechanizm"), §5, §6b (allowlista `domain/building_costs.rs`, rozlaczna z `city_growth.rs`) | Status "CZESCIOWO (heur., domena)" dla trzech plikow zamieniony na status per symbol z wektorem (§3). `scaleStockCostRecord` z `r-stawki-strojenie.ts` portowany jako wejscie (jedna funkcja), reszta pliku - poza zakresem (§9). |
| `p3/P3-22-FLATTEN-STAGE2.md` (441 linii) | §0-§2 (wzorzec tabel `data/derived/*.json`, pozycja 21 "Spichlerz: odplyw x5" = `building-resource-gate.ts:329/:332` jako ETAP 3 magazyn), §4-§5 (tabela bylo/jest, lista zmian testow), §6 (bramki) | Odplyw Spichlerza (25/25) i pozostale stale Spichlerza trafily do `building-cost-params.json` (spichlerz.*). Uklad dokumentu (tabela bylo/jest, lista zmian testow, surowe bramki) przejety. |
| `p2/P2-3-ENTITY-IDS.md` (380 linii) | tabela ID encji (miasto: `string`, `'city' + cities.length`, `cities.ts:1249`), uwaga o `CityId` (`u64`) vs `City.id: String` w P6.6B | Port nie wymaga ID innych niz napis: `StockCitySource::id()` zwraca `&str`; porownanie id jak w JS (UTF-16, §4 Z6). |
| `p2/P2-5-COMMANDS.md` (668 linii) | grep po `build`/`enqueue`/`koszt_surow`/`stock` (kontrakt komendy budowy: koszt Pracy i koszt surowcowy pobierany przy starcie budowy) | Port daje funkcje czyste (`can_afford_building_stock`, `deduct_building_stock_cost_across_cities`); podpiecie pod komende budowy to integracja (§9). |
| `PLAN-PORT-RUST-TAURI-20261020.md` (305 linii) | §P6 (l.197-217: P6.6-P6.8 "Miasta: zalozenie, wzrost populacji, ekonomia/produkcja, budynki i efekty") | Temat jest czescia P6.7 (budynki: koszty i bramki). |
| `LEDGER.md` (211 linii) | naglowek, tabela rund (zasada: wpis orkiestratora po zdarzeniu), wpisy P0/P1 | Brak wymagan dla Operatora poza wpisem orkiestratora; nie edytowano. |
| `p6/P6-6B-MIASTA-ZAKLADANIE-B.md`, run `R-RUSTPORT-P6-6B-...` (w repo) | struktura dokumentu, `gen-p66b-vectors.mjs`, `p66b-loader-*.mjs`, `verify-p66b-vectors.py`, `mutate-p66b.py`, `grep-literals-p66b.py`, `gen-symbols-p66b.py`, `tests/p6_6b_vectors/common.rs` | Wzorzec wykonania (loader ESM bez stubow, wektory z kodowaniem liczb specjalnych, niezalezny weryfikator, mutacje, tabela symboli). Skrypty P6.7B sa nowe, nie kopie. |

Nie czytano w calosci: `P6-5B-JEDNOSTKI-ZYCIE-B.md`, `P6-6A-MIASTA-ZAKLADANIE-A.md` (wskazane w dispatchu jako wzorce wykonania; uzyty wzorzec P6.6B, ktory ten sam uklad ma opisany).

## 2b. Zaleznosci i statusy z poprzednich czesci (zintegrowane na bazie)

| Element | Stan na bazie `c4fa31a2` | Uzycie w P6.7B |
|---|---|---|
| P6.6B `City` (`domain::terrain::city_founding::p6_6b::cities::City`) | `id: String`, `owner_id: i64`, `surowce: Option<BTreeMap<String, f64>>` | `impl StockCitySource for City` (cecha lokalna w `building_costs.rs`, dozwolone przez regule sierot); test `pool`/`spichlerz` uzywaja `StockCity`, ta sama cecha |
| `domain::civ_matrix::js_compat` (`js_max`, `js_min`, `js_math_round`, `js_trim`) | dostepne, `pub` | semantyka `Math.max/min/round` i `String.prototype.trim` (BOM tak, U+0085 nie) |
| `data::derived::{building_work_costs, building_stock_costs, unit_stock_costs, building_work_states}` | tabele P3-19 | tylko do testow zgodnosci (`p6_7b_tables.rs`) |
| `domain/building_costs.rs` (istniejacy, 291 linii) | `BuildingCost`, `canonical_building_costs`, `spend_building_cost` (u32) | NIE zmieniony; nowy kod w `pub mod p6_7b` na koncu pliku |
| `data/derived.rs` | P6.6B konczy sie `display_names_params()` | dopisek na koncu pliku (`// P6.7B`) |

## 3. Tabela symboli (kazda deklaracja ma status)

Kolumny: plik TS, linia deklaracji w pliku TS (pin `edb8fb56`), symbol, status, odpowiednik Rust (`plik:linia`), test (`plik_testu::funkcja`), uwaga. Wygenerowana skryptem `gen-symbols-p67b.py` (plik `symbols-p67b-r1.tsv`); skrypt konczy sie bledem, gdy wiersza brakuje albo wskazuje nieistniejacy symbol/test.

Podsumowanie: 68 wierszy; PORTOWANY=60, PORTOWANY-Z-WSTRZYKNIETYMI=8.

| Plik TS | Linia TS | Symbol | Status | Odpowiednik Rust | Test | Uwaga |
|---|---|---|---|---|---|---|
| building-cost-tempo.ts | 19 | KOSZT_BUDYNKOW_PACE | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:432 (building_cost_pace_multiplier) | p6_7b_cost.rs::constants_match_running_web | dane: building-cost-params.json tempo_kosztow_budynkow; wyniki tempa sa tez splaszczone w building-work-states.json (zgodnosc: tables::pace_matches_flattened_work_states_for_normal_mode) |
| building-cost-tempo.ts | 25 | BuildingCostPace | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:426 (PaceInput) | p6_7b_cost.rs::building_cost_pace_matches_running_web | keyof -> PaceInput::Key; liczba -> PaceInput::Multiplier |
| building-cost-tempo.ts | 33 | applyBuildingCostPace | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:444 (apply_building_cost_pace) | p6_7b_cost.rs::building_cost_pace_matches_running_web | Math.max(1, Math.round(..)); nieznany klucz = NaN |
| building-stock-cost.ts | 21 | BuildingStockCost | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:316 (StockRecord) | p6_7b_cost.rs::building_stock_cost_matches_running_web | alias Partial<Record<string, number>> -> BTreeMap<String, f64> |
| building-stock-cost.ts | 28 | epochCostMultiplier | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:481 (epoch_cost_multiplier); rust-port/engine/src/domain/building_costs.rs:457 (EpochInput) | p6_7b_cost.rs::epoch_cost_multiplier_matches_running_web | progi i slowa epok: building-cost-params.json epoki |
| building-stock-cost.ts | 60 | scaleCostByEpoch | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:501 (scale_cost_by_epoch) | p6_7b_cost.rs::scale_cost_by_epoch_matches_running_web | - |
| building-stock-cost.ts | 74 | buildingEraCostMultiplier | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:512 (building_era_cost_multiplier) | p6_7b_cost.rs::building_era_cost_multiplier_matches_running_web | zgodnosc z building-work-costs.json: tables::era_multiplier_matches_flattened_work_tables |
| building-stock-cost.ts | 84 | buildingStockCost | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/building_costs.rs:545 (building_stock_cost); rust-port/engine/src/domain/building_costs.rs:539 (BuildingStockSource); rust-port/engine/src/domain/building_costs.rs:522 (scale_stock_cost_record) | p6_7b_cost.rs::building_stock_cost_matches_running_web | wstrzykniete: scaleStockCostRecord z r-stawki-strojenie.ts (FALA2 x2) - kopia wejsciowa + mnoznik w building-cost-params.json; zgodnosc z building-stock-costs.json: tables::building_stock_cost_matches_flattened_p3_19_table |
| building-stock-cost.ts | 101 | missingStockFor | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:558 (missing_stock_for) | p6_7b_cost.rs::missing_can_afford_and_deduct_match_running_web | - |
| building-stock-cost.ts | 115 | canAffordBuildingStock | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:577 (can_afford_building_stock) | p6_7b_cost.rs::missing_can_afford_and_deduct_match_running_web | - |
| building-stock-cost.ts | 131 | deductBuildingStockCost | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:594 (deduct_building_stock_cost) | p6_7b_cost.rs::missing_can_afford_and_deduct_match_running_web | nie mutuje wejsc: cost::deduct_does_not_mutate_inputs |
| building-stock-cost.ts | 143 | STOCK_RESOURCE_LABEL | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:611 (stock_resource_labels) | p6_7b_cost.rs::constants_match_running_web | dane: building-cost-params.json magazyn.etykiety |
| building-stock-cost.ts | 164 | EMPIRE_STOCK_RESOURCE_KEYS | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:621 (empire_stock_resource_keys) | p6_7b_cost.rs::constants_match_running_web | dane: building-cost-params.json magazyn.klucze_magazynu_panstwa |
| building-stock-cost.ts | 170 | stockResourceLabel | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:626 (stock_resource_label) | p6_7b_cost.rs::stock_resource_label_matches_running_web | klucz z lancucha prototypow: swiadoma rozbieznosc (cost::prototype_key_lookups_are_a_documented_divergence) |
| building-stock-cost.ts | 190 | StockCitySource | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:640 (StockCitySource); rust-port/engine/src/domain/building_costs.rs:664 (StockCity) | p6_7b_pool.rs::deduct_across_cities_matches_running_web | interfejs -> cecha (implementacja dla City z P6.6B i dla StockCity) |
| building-stock-cost.ts | 200 | ownerResourceStockAll | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:693 (owner_resource_stock_all) | p6_7b_pool.rs::owner_resource_stock_all_matches_running_web | - |
| building-stock-cost.ts | 217 | ownerResourceStock | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:716 (owner_resource_stock) | p6_7b_pool.rs::owner_resource_stock_matches_running_web | - |
| building-stock-cost.ts | 234 | refundBuildingStockCostAcrossCities | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:728 (refund_building_stock_cost_across_cities) | p6_7b_pool.rs::refund_across_cities_matches_running_web | - |
| building-stock-cost.ts | 254 | deductBuildingStockCostAcrossCities | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:742 (deduct_building_stock_cost_across_cities) | p6_7b_pool.rs::deduct_across_cities_matches_running_web | remis po id: porownanie UTF-16 (pool::explicit_utf16_tie_break_matches_running_web) |
| building-stock-cost.ts | 291 | creditOwnerResourceStock | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:776 (credit_owner_resource_stock) | p6_7b_pool.rs::credit_owner_resource_stock_matches_running_web | - |
| building-stock-cost.ts | 324 | assignOwnerResourceStockFromPool | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:816 (assign_owner_resource_stock_from_pool) | p6_7b_pool.rs::assign_from_pool_matches_running_web | - |
| building-stock-cost.ts | 358 | stripDiacriticsLower | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:416 (strip_diacritics_lower); rust-port/engine/src/domain/building_costs.rs:361 (nfd_strip); rust-port/engine/src/domain/building_costs.rs:394 (canonical_order) | p6_7b_nfd.rs::nfd_strip_matches_running_web_for_every_code_point | NFD: dane Unicode nfd-strip-table.json + Hangul algorytmicznie + kolejnosc kanoniczna; przeglad calego Unicode i 6000 napisow losowych |
| building-stock-cost.ts | 368 | MOUNT_UNIT_HORSE_STOCK_COST | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:841 (mount_unit_horse_stock_cost) | p6_7b_cost.rs::constants_match_running_web | dane: building-cost-params.json jednostki.kon_koszt_bazowy |
| building-stock-cost.ts | 369 | MOUNT_UNIT_HORSE_STOCK_KEY | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:846 (mount_unit_horse_stock_key) | p6_7b_cost.rs::constants_match_running_web | dane: building-cost-params.json jednostki.kon_klucz |
| building-stock-cost.ts | 371 | MOUNT_HORSE_EXEMPT_UNIT | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:851 (mount_horse_exempt_unit) | p6_7b_cost.rs::constants_match_running_web | dane: building-cost-params.json jednostki.wyjatek_kon_jednostka |
| building-stock-cost.ts | 374 | UnitStockCostSource | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:858 (UnitStockCostSource) | p6_7b_cost.rs::unit_stock_cost_matches_running_web | - |
| building-stock-cost.ts | 383 | unitRequiresMountHorseStock | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:867 (unit_requires_mount_horse_stock) | p6_7b_cost.rs::unit_stock_cost_matches_running_web | - |
| building-stock-cost.ts | 402 | unitStockCost | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:879 (unit_stock_cost) | p6_7b_cost.rs::unit_stock_cost_matches_running_web | zgodnosc z unit-stock-costs.json: tables::unit_stock_cost_matches_flattened_p3_19_table |
| building-resource-gate.ts | 39 | LABEL_BY_ASCII | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:943 (label_by_ascii) | p6_7b_gate.rs::required_active_labels_match_running_web | dane: building-cost-params.json bramka.etykiety_ascii (etykieta Zlota z jednego zrodla) |
| building-resource-gate.ts | 59 | DEPOSIT_LINKED_BUILDING_LABELS | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1100 (deposit_runtime_gated_building_ids); rust-port/engine/src/domain/building_costs.rs:1063 (building_required_active_labels) | p6_7b_gate.rs::constants_match_running_web | dane: building-cost-params.json bramka.zloza_budynkow |
| building-resource-gate.ts | 104 | CITY_BUILDING_PREREQ | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:964 (city_building_prereq) | p6_7b_gate.rs::constants_match_running_web | dane: building-cost-params.json bramka.prerekwizyty_miasta (napis albo lista) |
| building-resource-gate.ts | 127 | cityBuildingPrereqMet | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/building_costs.rs:993 (city_building_prereq_met); rust-port/engine/src/domain/building_costs.rs:984 (PrereqBuilding); rust-port/engine/src/domain/building_costs.rs:990 (SupersededFn) | p6_7b_gate.rs::city_building_prereq_met_matches_running_web | wstrzykniete: isBuildingSupersededByUpgrade (production.ts) - domkniecie odtwarzajace zapisane wyniki z kontrola argumentow i liczby wywolan |
| building-resource-gate.ts | 143 | WATER_ACCESS_BUILDING_IDS | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:974 (is_water_access_building) | p6_7b_gate.rs::constants_match_running_web | dane: building-cost-params.json bramka.dostep_wodny |
| building-resource-gate.ts | 146 | ASCII_BY_LABEL | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:953 (ascii_by_label) | p6_7b_gate.rs::label_satisfied_matches_running_web | odwrocenie tabeli etykiet; przy powtorzonej etykiecie wygrywa ostatnia (jak Object.fromEntries) |
| building-resource-gate.ts | 151 | ACCESS_ONLY_RESOURCE_LABELS | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1018 (access_only_resource_labels) | p6_7b_gate.rs::constants_match_running_web | deprecated, pusty zbior |
| building-resource-gate.ts | 153 | isAccessOnlyResourceLabel | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1023 (is_access_only_resource_label) | p6_7b_gate.rs::access_only_labels_match_running_web | deprecated, zawsze false |
| building-resource-gate.ts | 158 | empireResourceLabelSatisfied | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1052 (empire_resource_label_satisfied) | p6_7b_gate.rs::label_satisfied_matches_running_web | argumenty _activeLabels i _buildingId nieuzywane, zachowane w sygnaturze |
| building-resource-gate.ts | 168 | empireLabelSatisfied | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1028 (label_satisfied) | p6_7b_gate.rs::label_satisfied_matches_running_web | konwertery: building-cost-params.json bramka.konwertery |
| building-resource-gate.ts | 186 | buildingRequiredActiveLabels | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1063 (building_required_active_labels); rust-port/engine/src/domain/building_costs.rs:1011 (GateBuilding) | p6_7b_gate.rs::required_active_labels_match_running_web | klucz z lancucha prototypow: swiadoma rozbieznosc (cost::prototype_key_lookups_are_a_documented_divergence) |
| building-resource-gate.ts | 201 | buildingResourceGateMet | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1088 (building_resource_gate_met) | p6_7b_gate.rs::resource_gate_matches_running_web | - |
| building-resource-gate.ts | 215 | DEPOSIT_RUNTIME_GATED_BUILDING_IDS | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1100 (deposit_runtime_gated_building_ids) | p6_7b_gate.rs::constants_match_running_web | - |
| building-resource-gate.ts | 220 | SPICHLERZ_RUNTIME_EXCLUDED | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1110 (has_deposit_runtime_gate) | p6_7b_gate.rs::has_deposit_runtime_gate_matches_running_web | dane: building-cost-params.json spichlerz.wykluczone_z_bramki_runtime |
| building-resource-gate.ts | 222 | hasDepositRuntimeGate | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1110 (has_deposit_runtime_gate) | p6_7b_gate.rs::has_deposit_runtime_gate_matches_running_web | - |
| building-resource-gate.ts | 227 | BuildingRuntimeGateOptions | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/building_costs.rs:1129 (BuildingRuntimeGateOptions) | p6_7b_gate.rs::runtime_gate_matches_running_web | wstrzykniete: resolveOwnerZlotoAccess (domkniecie wolajacego) |
| building-resource-gate.ts | 242 | empireLabelSatisfiedAtRuntime | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1028 (label_satisfied) | p6_7b_gate.rs::runtime_gate_matches_running_web | druga kopia tej samej tresci w webie -> jedna implementacja label_satisfied; rownowaznosc dowodzona wektorami obu sciezek |
| building-resource-gate.ts | 254 | mennicaRuntimeGateMet | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/building_costs.rs:1135 (mennica_runtime_gate_met); rust-port/engine/src/domain/building_costs.rs:921 (owner_can_feed_mennica) | p6_7b_gate.rs::owner_can_feed_mennica_matches_running_web | wstrzykniete: ownerCanFeedMennica z zloto-access.ts (kopia wejsciowa, stale w building-cost-params.json) i resolver zlota |
| building-resource-gate.ts | 264 | buildingRuntimeGateMet | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/building_costs.rs:1154 (building_runtime_gate_met) | p6_7b_gate.rs::runtime_gate_matches_running_web | wstrzykniete: resolver zlota |
| building-resource-gate.ts | 285 | filterRuntimeActiveBuiltIds | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/building_costs.rs:1170 (filter_runtime_active_built_ids) | p6_7b_gate.rs::filter_runtime_active_built_ids_matches_running_web | wstrzykniete: resolver zlota; punkt staly Ceramika/Cegla |
| building-resource-gate.ts | 329 | SPICHLERZ_DRAIN_CERAMIKA_PER_TURN | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1230 (spichlerz_drain_ceramika_per_turn) | p6_7b_spichlerz.rs::constants_match_running_web | dane: building-cost-params.json spichlerz.drain_ceramika_na_ture |
| building-resource-gate.ts | 332 | SPICHLERZ_DRAIN_SOL_PER_TURN | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1235 (spichlerz_drain_sol_per_turn) | p6_7b_spichlerz.rs::constants_match_running_web | dane: building-cost-params.json spichlerz.drain_sol_na_ture |
| building-resource-gate.ts | 334 | SpichlerzDrainPayResult | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1215 (SpichlerzDrainPayResult) | p6_7b_spichlerz.rs::pay_drain_matches_running_web | - |
| building-resource-gate.ts | 340 | SpichlerzCityBonusState | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1222 (SpichlerzCityBonusState) | p6_7b_spichlerz.rs::bonus_state_matches_running_web | - |
| building-resource-gate.ts | 362 | cityHasSpichlerzBuilding | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1250 (city_has_spichlerz_building) | p6_7b_spichlerz.rs::city_has_spichlerz_matches_running_web | - |
| building-resource-gate.ts | 370 | paySpichlerzDrainForCity | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1259 (pay_spichlerz_drain_for_city); rust-port/engine/src/domain/building_costs.rs:1310 (spichlerz_drain_dry_run) | p6_7b_spichlerz.rs::pay_drain_matches_running_web | dryRun na miastach tylko do odczytu: spichlerz_drain_dry_run (uzywane przez status nieaktywnego budynku) |
| building-resource-gate.ts | 405 | resolveSpichlerzCityBonusState | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1334 (resolve_spichlerz_city_bonus_state) | p6_7b_spichlerz.rs::bonus_state_matches_running_web | - |
| building-resource-gate.ts | 427 | spichlerzHealthBonus | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1362 (spichlerz_health_bonus) | p6_7b_spichlerz.rs::bonuses_and_yields_match_running_web | dane: building-cost-params.json spichlerz.zdrowie_* |
| building-resource-gate.ts | 434 | spichlerzGrowthBonusPercent | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1374 (spichlerz_growth_bonus_percent) | p6_7b_spichlerz.rs::bonuses_and_yields_match_running_web | dane: building-cost-params.json spichlerz.wzrost_procent_* |
| building-resource-gate.ts | 441 | spichlerzRationFoodCostMultiplier | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1386 (spichlerz_ration_food_cost_multiplier) | p6_7b_spichlerz.rs::bonuses_and_yields_match_running_web | dane: building-cost-params.json spichlerz.racja_mnoznik_* |
| building-resource-gate.ts | 451 | spichlerzHappinessBonusFromJson | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1398 (spichlerz_happiness_bonus_from_json) | p6_7b_spichlerz.rs::bonuses_and_yields_match_running_web | domyslny jsonBonus: building-cost-params.json spichlerz.zadowolenie_json_domyslne |
| building-resource-gate.ts | 463 | builtIdsForSpichlerzYields | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1412 (built_ids_for_spichlerz_yields) | p6_7b_spichlerz.rs::bonuses_and_yields_match_running_web | - |
| building-resource-gate.ts | 502 | SPICHLERZ_EMPIRE_CAP_I | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1240 (spichlerz_empire_cap_i) | p6_7b_spichlerz.rs::constants_match_running_web | dane: building-cost-params.json spichlerz.cap_imperium_i |
| building-resource-gate.ts | 503 | SPICHLERZ_EMPIRE_CAP_II_FULL | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1245 (spichlerz_empire_cap_ii_full) | p6_7b_spichlerz.rs::constants_match_running_web | dane: building-cost-params.json spichlerz.cap_imperium_ii_pelny |
| building-resource-gate.ts | 510 | spichlerzArmyFoodCostMultiplier | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1440 (spichlerz_army_food_cost_multiplier) | p6_7b_spichlerz.rs::army_food_multiplier_matches_running_web | dane: building-cost-params.json spichlerz.armia_*, garnizon_* |
| building-resource-gate.ts | 525 | OwnedBuildingInactiveStatus | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1462 (OwnedBuildingInactiveStatus) | p6_7b_spichlerz.rs::inactive_status_matches_running_web | - |
| building-resource-gate.ts | 533 | formatInactiveTooltip | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:1469 (format_inactive_tooltip) | p6_7b_spichlerz.rs::inactive_status_matches_running_web | dane: building-cost-params.json bramka.komunikaty |
| building-resource-gate.ts | 539 | missingRuntimeResourceLabels | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/building_costs.rs:1482 (missing_runtime_resource_labels) | p6_7b_gate.rs::missing_runtime_labels_match_running_web | wstrzykniete: resolver zlota |
| building-resource-gate.ts | 560 | resolveOwnedBuildingInactiveStatus | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/building_costs.rs:1515 (resolve_owned_building_inactive_status); rust-port/engine/src/domain/building_costs.rs:1504 (InactiveStatusOptions) | p6_7b_spichlerz.rs::inactive_status_matches_running_web | wstrzykniete: resolver zlota; miasta tylko do odczytu |
| building-resource-gate.ts | 318 | MENNICA_ZLOTO_DRAIN_PER_TURN | PORTOWANY | rust-port/engine/src/domain/building_costs.rs:932 (mennica_zloto_drain_per_turn) | p6_7b_gate.rs::constants_match_running_web | re-eksport stalej z zloto-access.ts; dane: building-cost-params.json wejscia_z_innych_modulow_weba |

Wejscia z innych modulow weba (poza zakresem trzech plikow), uzyte przez port:

| Plik TS | Symbol | Rola | Stan w P6.7B |
|---|---|---|---|
| `r-stawki-strojenie.ts` | `R_STAWKI_FALA2_MULT`, `scaleStockCostRecord` | FALA2 x2 dla `koszt_surowce` | funkcja `scale_stock_cost_record` + stala w `building-cost-params.json` (wejscia_z_innych_modulow_weba); sprawdzana posrednio wektorami `buildingStock` (prawdziwy kod weba wola oryginal) |
| `zloto-access.ts` | `ZLOTO_LABEL`, `ZLOTO_STOCK_KEY`, `MENNICA_ZLOTO_DRAIN_PER_TURN`, `ownerCanFeedMennica`, `empireZlotoStock` | bramka i drain Mennicy | stale w `building-cost-params.json`, funkcje `owner_can_feed_mennica`, `empire_zloto_stock` (prywatna); wektory `mennica` z prawdziwego `ownerCanFeedMennica` |
| `production.ts` | `isBuildingSupersededByUpgrade` | domkniecie w `cityBuildingPrereqMet` | wstrzykniete (`SupersededFn`); wektory z PRAWDZIWA funkcja weba, log wywolan sprawdzany w tescie |
| `data/loader.ts` | `BuildingDef` (typ) | ksztalt budynku | `GateBuilding` (tylko pola uzywane: `id`, `epokaWejscia`, `wymaganySurowiec`) |

## 4. Decyzje i zalozenia (zamiast pytan)

- **Z1 (typy liczbowe).** Nowy modul liczy na `f64` (jak JS `number`), a nie na `u32` jak istniejace typy `BuildingCost`; webowe funkcje przyjmuja `NaN`/`Infinity`/ulamki, a wektory porownuje sie bitowo. Istniejace API nie jest zmieniane ani przepinane (zakaz zmiany istniejacych testow).
- **Z2 (ekspozycja modulu).** `pub mod p6_7b` wewnatrz `domain/building_costs.rs`; `domain/mod.rs` juz ma `pub mod building_costs;`, wiec sciezka `civ_engine::domain::building_costs::p6_7b::*` dziala bez zmiany `mod.rs` (zalozenie o re-eksporcie: brak, niepotrzebny).
- **Z3 (rekordy).** `Record<string, number>` = `BTreeMap<String, f64>`; kolejnosc kluczy nie jest modelowana, bo kazdy klucz jest liczony niezaleznie (pobor/kredyt/koszt), a wektory porownuja mapy. Wartosci spoza `number` w rekordach wejsciowych (`koszt_surowce`) maja typ `Option<f64>` (`None` = nie-liczba) i sa pomijane jak w webie (`typeof v === 'number'`). Dla miast (`City.surowce`) wartosci sa zawsze liczbami z typu, wiec galaz "nie-liczba" w `ownerResourceStockAll` jest nieosiagalna typem (zachowano `isFinite`).
- **Z4 (`StockCitySource`).** Interfejs TS -> cecha `StockCitySource` (`id`, `owner_id`, `surowce`, `surowce_mut`) zaimplementowana dla `City` (P6.6B) i `StockCity`. `ownerId` jest `i64` (jak `City.owner_id`); nieliczbowe `ownerId` nie sa modelowane.
- **Z5 (sortowanie JS).** `Array.prototype.sort` z komparatorem `diff`/`id` odtworzone stabilnym sortowaniem przez wstawianie (nie `sort_by`, ktory moze spanikowac na komparatorach z `NaN`). Dla spojnych komparatorow wynik jest identyczny z V8; wektory nie zawieraja `NaN` w sortowanych kluczach (pobor filtruje `> 0`; kredyt/zwrot generowane bez `NaN`), zawieraja `Infinity` (para `Infinity - Infinity = NaN` = remis, jak w JS). Dla komparatorow z `NaN` kolejnosc w V8 jest niezdefiniowana: NIE_ZMIERZONO.
- **Z6 (porownanie `id`).** `a.id < b.id` w JS porownuje jednostki UTF-16; port uzywa `encode_utf16().cmp(..)`, nie bajtow UTF-8. Dowod: wektor `explicit` (`U+FF5E` vs `U+1F600`: kolejnosc UTF-16 inna niz punktow kodowych) i mutant "id jak bajty UTF-8" (§6).
- **Z7 (klucz `stripDiacriticsLower`).** Web robi `normalize('NFD')`, wycina `U+0300-U+036F`, `trim()`, `toLowerCase()`. Rust nie ma NFD w `std`, a `Cargo.toml` jest poza allowlista, wiec: (a) `data/derived/nfd-strip-table.json` - rozklad kanoniczny po wycieciu znakow laczacych dla 2077 punktow kodowych + rangi klas laczenia (ccc) dla znakow laczacych, wygenerowane z uruchomionego Node (`gen-p67b-nfd-table.mjs`, Node v22.22.0, ICU 77.1, Unicode 16.0); (b) Hangul rozkladany algorytmicznie (stale w tabeli); (c) kanoniczne uporzadkowanie znakow laczacych po randze. Dowod: przeglad KAZDEGO punktu kodowego U+0000..U+10FFFF (1 112 064 punktow) przez prawdziwe `unitStockCost` weba + 6000 losowych napisow wieloznakowych (znaki laczace o roznych klasach, Hangul, litery): 0 rozbieznosci, z JEDNYM wyjatkiem klasy opisanym w Z8.
- **Z8 (skosnosc wersji Unicode).** Biblioteka standardowa Rust (nowszy Unicode niz Unicode 16.0 z Node z wektora) zna pary wielka/mala litera, ktorych Node nie zna (np. `U+A7CE`): `toLowerCase` w webie zostawia znak, Rust zamienia. Test `nfd_strip_matches_running_web_for_every_code_point` dopuszcza WYLACZNIE te klase (web zostawia znak bez zmian, Rust daje jego mala litere) i raportuje liczbe takich punktow (28 przy tej bazie); inne rozbieznosci = FAIL. Dla danych gry (klucze surowcow ASCII, nazwy PL) brak wplywu. Ten sam efekt dotknalby kazdego portu `toLowerCase` - jawnie ODNOTOWANE.
- **Z9 (klucze z lancucha prototypow).** `LABEL_BY_ASCII[key]`, `STOCK_RESOURCE_LABEL[key]`, `CITY_BUILDING_PREREQ[id]`, `DEPOSIT_LINKED_BUILDING_LABELS[id]` w webie to indeksowanie zwyklych obiektow: klucz `constructor`/`__proto__`/`toString` trafia w `Object.prototype` (np. `stockResourceLabel('constructor')` zwraca funkcje, `buildingRequiredActiveLabels` dla `id='constructor'` rzuca `TypeError`). Port traktuje klucz spoza tabeli jako brak wpisu. SWIADOMA, udokumentowana rozbieznosc; wektor `protoQuirk` zapisuje, co robi web, a test `prototype_key_lookups_are_a_documented_divergence` utrwala zachowanie Rust (`hasDepositRuntimeGate` i `applyBuildingCostPace` nie roznia sie: `hasOwnProperty`, `NaN`).
- **Z10 (jedno zrodlo stalych Spichlerza i Zlota).** `SPICHLERZ_DRAIN_*`, `SPICHLERZ_EMPIRE_CAP_*`, bonusy i mnozniki Spichlerza, `MENNICA_ZLOTO_DRAIN_PER_TURN`, `ZLOTO_LABEL` maja w Rust JEDNO zrodlo: `building-cost-params.json`. Istniejace klucze `econ-params.json` `budynek_spichlerz_zuzywa_ceramika` / `_ii_zuzywa_sol` / `_ii_zuzywa_ceramika` sa w webie oznaczone jako MARTWE ("zaden kod nie czyta tego pola JSON", `econ-params.json:388,395,402`) i silnik ich nie uzywa; nie sa edytowane (poza allowlista). Etykieta Zlota wystepuje w tabeli raz (`wejscia_z_innych_modulow_weba.zloto_label`), a w tabeli bramki jako token `{zloto_label}` zamieniany przy odczycie (test `params_file_parses_and_has_no_unresolved_tokens`).
- **Z11 (stale z `population-growth-v85.ts` w `cities-params.json`).** Dispatch prosi o zastapienie duplikatow stalych `population-growth-v85.ts` (P6.6B: `cities-params.json` -> `wejscia_z_innych_modulow_weba`: `domyslny_poziom_racji`, `wyzywienie_max`) jednym zrodlem. Trzy pliki P6.7B NIE importuja `population-growth-v85.ts` (jedyna wzmianka to komentarz w `building-resource-gate.ts:359`; `grep -n "population-growth" ` na trzech plikach), a `cities-params.json` jest plikiem P6.6B poza allowlista (dozwolone sa tylko NOWE `data/derived/*.json`). Zastapienie nalezy do tematu portujacego `population-growth-v85.ts` (P6.7A, `city_growth.rs`); P6.7B nic w tym zakresie nie zmienia. Rekomendacja dla integratora: po P6.7A zamienic `wejscia_z_innych_modulow_weba` na odczyt ze zrodla P6.7A.
- **Z12 (liczby strukturalne).** Literaly `0.0` (neutralny element sumy, dolna granica `Math.max(0, x)`), `1.0` (dolna granica `Math.max(1, x)` w kosztach, element neutralny iloczynu `m = 1`) i indeksy sa semantyka kodu weba, nie danymi (`dowody/grep-literals-r1.txt`, klasyfikacja w naglowku). `Some(1.0)` w `GateBuilding.epoka_wejscia` odtwarza `{ id, epokaWejscia: 1 }` z kodu weba; pole nie jest nigdzie czytane.
- **Z13 (parsowanie liczb w wektorach).** `serde_json` bez `float_roundtrip` nie jest dokladny dla duzych wykladnikow, wiec generator zapisuje WSZYSTKO poza bezpiecznymi calkowitymi (`Number.isSafeInteger`) jako `"~<zapis JS>"`, a testy czytaja to przez `str::parse::<f64>`. Wykryte wlasnym przypadkiem testowym (`1e307`) i naprawione w generatorze przed finalnymi wektorami.
- **Z14 (dwie kopie `empireLabelSatisfied*`).** Web ma dwie identyczne funkcje (`empireLabelSatisfied`, `empireLabelSatisfiedAtRuntime`); port ma jedna `label_satisfied`. Rownowaznosc dowodzona wektorami obu sciezek (`labelSatisfied`, `runtimeGate`, `missingLabels`, `filter`).
- **Z15 (`paySpichlerzDrainForCity` na miastach tylko do odczytu).** Web wola funkcje z `dryRun = true` na `readonly` tablicy; Rust ma `pay_spichlerz_drain_for_city(&mut [T], .., dry_run)` oraz `spichlerz_drain_dry_run(&[T], ..)`; test `pay_drain_matches_running_web` sprawdza, ze podglad == wynik `dry_run = true` i brak mutacji miast.
- **Z16 (weryfikacja w przegladarce).** Temat nie jest wizualny (logika i dane); weryfikacja w przegladarce nie dotyczy. Wektory pochodza z uruchomionego kodu TS w Node (nie z przegladarki); roznica silnika (V8 w Node vs Chromium) nie jest tu istotna dla `Math.round`/`normalize`/`toLowerCase` (ten sam V8/ICU w danej wersji, ale wersja Unicode jest zapisana w tabeli NFD, Z7/Z8).

## 5. Testy i wektory

Nowe pliki (`rust-port/engine/tests/`), zadnych zmian istniejacych:

| Plik | Testy | Zakres |
|---|---|---|
| `p6_7b_cost.rs` | 11: `constants_match_running_web`, `building_cost_pace_matches_running_web`, `epoch_cost_multiplier_matches_running_web`, `scale_cost_by_epoch_matches_running_web`, `building_era_cost_multiplier_matches_running_web`, `building_stock_cost_matches_running_web`, `missing_can_afford_and_deduct_match_running_web`, `deduct_does_not_mutate_inputs`, `stock_resource_label_matches_running_web`, `unit_stock_cost_matches_running_web`, `prototype_key_lookups_are_a_documented_divergence` | tempo kosztow, mnozniki epok, koszt surowcowy budynku/jednostki, brakuje/stac/pobor, etykiety, klucze prototypowe |
| `p6_7b_gate.rs` | 11: `constants_match_running_web`, `required_active_labels_match_running_web`, `label_satisfied_matches_running_web`, `access_only_labels_match_running_web`, `resource_gate_matches_running_web`, `has_deposit_runtime_gate_matches_running_web`, `runtime_gate_matches_running_web`, `missing_runtime_labels_match_running_web`, `filter_runtime_active_built_ids_matches_running_web`, `city_building_prereq_met_matches_running_web`, `owner_can_feed_mennica_matches_running_web` | etykiety i zloza, bramka budowy i runtime, punkt staly aktywnych, prerekwizyty miasta, Mennica |
| `p6_7b_nfd.rs` | 2: `nfd_strip_matches_running_web_for_every_code_point`, `nfd_strip_matches_running_web_for_random_sequences` | klucz stripDiacriticsLower: caly Unicode (1 112 064 punkty) i 6000 napisow losowych |
| `p6_7b_pool.rs` | 7: `owner_resource_stock_all_matches_running_web`, `owner_resource_stock_matches_running_web`, `deduct_across_cities_matches_running_web`, `refund_across_cities_matches_running_web`, `credit_owner_resource_stock_matches_running_web`, `assign_from_pool_matches_running_web`, `explicit_utf16_tie_break_matches_running_web` | pula panstwa po miastach: suma, zapas, pobor, zwrot, kredyt z capem, przypisanie z puli, remis UTF-16 |
| `p6_7b_spichlerz.rs` | 7: `constants_match_running_web`, `pay_drain_matches_running_web`, `bonus_state_matches_running_web`, `bonuses_and_yields_match_running_web`, `army_food_multiplier_matches_running_web`, `city_has_spichlerz_matches_running_web`, `inactive_status_matches_running_web` | drain Ceramiki/Soli, stan i bonusy, yields, mnoznik armii, status nieaktywnego budynku |
| `p6_7b_tables.rs` | 10: `params_file_parses_and_has_no_unresolved_tokens`, `pace_and_era_tables_have_valid_shape`, `storage_and_label_tables_are_consistent`, `building_references_exist_in_buildings_json`, `spichlerz_and_unit_parameters_have_valid_shape`, `nfd_strip_table_has_valid_shape`, `building_stock_cost_matches_flattened_p3_19_table`, `unit_stock_cost_matches_flattened_p3_19_table`, `era_multiplier_matches_flattened_work_tables`, `pace_matches_flattened_work_states_for_normal_mode` | ksztalt i spojnosc tabel (bez pinow), zgodnosc z tabelami P3-19 (stock budynkow/jednostek, ery, tempo) |

Wektory (`tests/p6_7b_vectors/*.json`, generator `gen-p67b-vectors.mjs`, URUCHOMIONY kod TS weba przez `p67b-loader-hooks.mjs`; liczby specjalne `"NaN"`/`"Infinity"`/`"-Infinity"`/`"-0"`/`"~<ulamek>"`, ziarno Mulberry32 `0x67b0c0de`):

| Plik | Sekcja | Przypadkow |
|---|---|---|
| `cost.json` | `pace` | 1978 |
| `cost.json` | `epochMult` | 103 |
| `cost.json` | `scaleCost` | 2472 |
| `cost.json` | `eraMult` | 23 |
| `cost.json` | `buildingStock` | 744 |
| `cost.json` | `stock` | 1500 |
| `cost.json` | `labels` | 35 |
| `cost.json` | `units` | 2577 |
| `cost.json` | `protoQuirk` | 8 |
| `nfd.json` | `changed` | 14465 |
| `nfd.json` | `sequences` | 6000 |
| `nfd.json` | `total` (punkty kodowe bez zastepczych) | 1112064 |
| `pool.json` | `ownerAll` | 500 |
| `pool.json` | `ownerOne` | 500 |
| `pool.json` | `deduct` | 900 |
| `pool.json` | `refund` | 700 |
| `pool.json` | `credit` | 1200 |
| `pool.json` | `assign` | 600 |
| `pool.json` | `explicit` | 2 |
| `gate.json` | `required` | 1100 |
| `gate.json` | `labelSatisfied` | 3024 |
| `gate.json` | `accessOnly` | 18 |
| `gate.json` | `resourceGate` | 2000 |
| `gate.json` | `hasRuntimeGate` | 44 |
| `gate.json` | `runtimeGate` | 1800 |
| `gate.json` | `missingLabels` | 1200 |
| `gate.json` | `filter` | 900 |
| `gate.json` | `prereq` | 1608 |
| `gate.json` | `mennica` | 36 |
| `gate.json` | `spDrain` | 1800 |
| `gate.json` | `spState` | 32 |
| `gate.json` | `spBonus` | 16 |
| `gate.json` | `spArmy` | 8 |
| `gate.json` | `spHas` | 40 |
| `gate.json` | `inactive` | 1800 |

Zasady testow: porownanie BITOWE f64 (`to_bits`, `NaN == NaN`); oczekiwania wylacznie z wektorow (zadnych pinow wartosci balansu w testach ksztaltu `p6_7b_tables.rs`); domkniecia wstrzykniete (resolver zlota, `isSuperseded`) odtwarzaja zapisane wyniki, SPRAWDZAJA argumenty i liczbe wywolan; testy ilosciowe pilnuja, by dane nie byly jednostronne (np. bramka przechodzi i nie przechodzi, `inactive` oba wyniki).

Weryfikator niezalezny (`verify-p67b-vectors.py`): NIE uzywa TypeScriptu, Node, generatora ani Rusta; semantyke trzech plikow i wejsc implementuje od nowa w Pythonie z TEKSTU zrodel weba (stale parsowane regexem z `building-cost-tempo.ts`, `building-stock-cost.ts`, `building-resource-gate.ts`, `zloto-access.ts`, `r-stawki-strojenie.ts`), NFD przez `unicodedata` (Unicode 14.0; punkty nieprzypisane w tej wersji pomijane i liczone). Wynik: 335375 sprawdzen, 0 rozbieznosci; w tym 282230 punktow kodowych NFD (§11.5). Test negatywny (`verify-negative-p67b.py`): 9 pojedynczych uszkodzen wektorow, kazde wykryte (§11.6).

## 6. Mutacje (testy wykrywaja zmiany)

Skrypt `mutate-p67b.py`: kazdy mutant zmienia JEDEN fragment (`src/domain/building_costs.rs`, `src/data/derived.rs`, `data/derived/building-cost-params.json`, `data/derived/nfd-strip-table.json`), uruchamia testy `p6_7b_*` (dobrane do fragmentu; dla tabel JSON i parsera wszystkie), PRZYWRACA plik i porownuje skrot SHA-256 z stanem sprzed mutacji (blad i exit 3, gdy rozni sie). Mutanty SEKWENCYJNIE (jedna kompilacja naraz), z limitem czasu 900 s. Po zakonczeniu: `git status` czysty wzgledem stanu przed mutacjami (§10).

Wynik: **115 z 127** mutantow wykrytych; 12 bez wykrycia - kazdy jest mutantem ROWNOWAZNYM (uzasadnienie ponizej), zadnego prawdziwego przezycia.

Przebiegi: part1 (mutanty 0-63), part2 (64-126), part3 (powtorka [8], [52], [73] po dodaniu przypadkow do wektorow: wszystkie trzy WYKRYTE; w part1/part2 wpisy [8], [52] sa nadpisane wynikiem part3, a [73] (mutant sie nie kompilowal) zastapiony nowym mutantem o tym samym numerze).
Mutanty bez wykrycia (kazdy ROWNOWAZNY z uzasadnieniem, zaden nie jest prawdziwym przezyciem):
R1 [5] cost: epoka - bez floor: progi epok w tabeli sa calkowite, a `ordinal >= prog` dla calkowitego progu daje ten sam wynik z floor i bez (`floor(x) >= p <=> x >= p`).
R2 [9] cost: epoka - cyfry nie-ASCII: bajty >= 0x80 w "cyfrach" daja napis, ktorego `parse::<f64>` nie przyjmie (NaN -> mnoznik domyslny), a webowa sciezka slow tez daje mnoznik domyslny (zadne slowo epoki nie zawiera znakow nie-ASCII).
R3 [29] pool: zwrot - tylko dodatnie (`> 0.0` zamiast `is_positive_finite`): niekonczone kwoty odrzuca i tak `credit_owner_resource_stock` (`!amount.is_finite()` -> 0).
R4 [30] pool: przypisanie - tylko dodatnie: jak R3.
R5 [31] pool: pobor - NaN/0 koszt (pominiecie warunku `need <= 0.0`): przy `need <= 0` petla posiadaczy przerywa sie przy pierwszym obrocie bez zmiany stanu.
R6 [37] pool: NaN roznicy nie jest remisem: remis z NaN (para Infinity - Infinity) vs rozstrzyganie po id zamienia kolejnosc tylko miast o zapasie nieskonczonym; odjecie lub dodanie do nieskonczonosci nie zmienia stanu, wiec wynik koncowy jest ten sam.
R7 [39] pool: kredyt - kwota <= 0: kwota 0 lub ujemna daje `to_add <= 0`, a kolejny warunek (`to_add <= 0.0 -> return 0`) zwraca to samo.
R8 [41] pool: kredyt - cap bez dolnej granicy 0: ujemny wynik `min(..)` i tak jest odrzucany przez `to_add <= 0.0 -> return 0`.
R9 [63] gate: Zloto - filtr dodatnich (`is_finite` zamiast `> 0` i skonczone): porownanie `>= drain` (drain > 0) odrzuca zera i liczby ujemne tak samo.
R10 [75] gate: filtr - kolejnosc aktywnych (pusta lista aktywnych budynkow dla bramki): zloza z tabeli wymagaja etykiet Glina/Sol/Drewno/Kamien/Ruda/Zloto, a konwertery (Cegla, Ceramika) spelniaja tylko etykiety Cegla i Ceramika, ktorych `filterRuntimeActiveBuiltIds` nie przekazuje (`wymaganySurowiec` jest tam puste).
R11 [88] sp: stan - II wymaga II: `sol_active` juz zawiera `has_ii`, wiec `ceramika_active && sol_active` implikuje `has_ii`.
R12 [104] tab: slowo epoki (usuniecie "stone"): mnoznik grupy (1) jest rowny domyslnemu, a slowo nieznane daje domyslny.

Surowe wyjscie: `mutation-evidence-r1-part1.txt`, `mutation-evidence-r1-part2.txt` (w katalogu runu), skopiowane ponizej.

```text
# mutation-evidence-r1-part1.txt
WYKRYTY   : [0] cost: tempo - brak dolnej granicy 1 -> 1 testow czerwonych: building_cost_pace_matches_running_web
WYKRYTY   : [1] cost: tempo - nieznany klucz = 1 -> 2 testow czerwonych: building_cost_pace_matches_running_web, prototype_key_lookups_are_a_documented_divergence
WYKRYTY   : [2] cost: tempo - mnoznik liczbowy bez znaku -> 1 testow czerwonych: building_cost_pace_matches_running_web
WYKRYTY   : [3] cost: epoka - prog > -> 8 testow czerwonych: building_era_cost_multiplier_matches_running_web, building_stock_cost_matches_running_web, epoch_cost_multiplier_matches_running_web
WYKRYTY   : [4] cost: epoka - brak progu = 0 -> 8 testow czerwonych: building_stock_cost_matches_running_web, building_era_cost_multiplier_matches_running_web, epoch_cost_multiplier_matches_running_web
PRZEZYL   : [5] cost: epoka - bez floor
WYKRYTY   : [6] cost: epoka - nieskonczona jak 3 -> 3 testow czerwonych: scale_cost_by_epoch_matches_running_web, epoch_cost_multiplier_matches_running_web, unit_stock_cost_matches_running_web
WYKRYTY   : [7] cost: epoka - bez sciezki cyfr -> 3 testow czerwonych: epoch_cost_multiplier_matches_running_web, scale_cost_by_epoch_matches_running_web, unit_stock_cost_matches_running_web
PRZEZYL   : [8] cost: epoka - cyfry puste czesci
PRZEZYL   : [9] cost: epoka - cyfry nie-ASCII
WYKRYTY   : [10] cost: epoka - slowo jako przedrostek -> 3 testow czerwonych: scale_cost_by_epoch_matches_running_web, epoch_cost_multiplier_matches_running_web, unit_stock_cost_matches_running_web
WYKRYTY   : [11] cost: skala - ujemny koszt -> 1 testow czerwonych: scale_cost_by_epoch_matches_running_web
WYKRYTY   : [12] cost: skala - zero -> 1 testow czerwonych: scale_cost_by_epoch_matches_running_web
WYKRYTY   : [13] cost: skala - brak dolnej granicy 1 -> 2 testow czerwonych: scale_cost_by_epoch_matches_running_web, unit_stock_cost_matches_running_web
WYKRYTY   : [14] cost: era budynku - domyslna epoka -> 2 testow czerwonych: building_stock_cost_matches_running_web, building_era_cost_multiplier_matches_running_web
WYKRYTY   : [15] cost: era budynku - round zamiast floor -> 2 testow czerwonych: building_stock_cost_matches_running_web, building_era_cost_multiplier_matches_running_web
WYKRYTY   : [16] cost: rekord FALA2 bez mnoznika -> 2 testow czerwonych: building_stock_cost_matches_running_web, building_stock_cost_matches_flattened_p3_19_table
WYKRYTY   : [17] cost: rekord FALA2 - filtr skonczonosci -> 1 testow czerwonych: building_stock_cost_matches_running_web
WYKRYTY   : [18] cost: rekord FALA2 - brak dolnej granicy 1 -> 1 testow czerwonych: building_stock_cost_matches_running_web
WYKRYTY   : [19] cost: koszt budynku bez mnoznika ery -> 2 testow czerwonych: building_stock_cost_matches_running_web, building_stock_cost_matches_flattened_p3_19_table
WYKRYTY   : [20] cost: brakuje - >= -> 1 testow czerwonych: missing_can_afford_and_deduct_match_running_web
WYKRYTY   : [21] cost: brakuje - odwrocona roznica -> 1 testow czerwonych: missing_can_afford_and_deduct_match_running_web
WYKRYTY   : [22] cost: stac - <= -> 1 testow czerwonych: missing_can_afford_and_deduct_match_running_web
WYKRYTY   : [23] cost: pobor - bez dolnej granicy 0 -> 1 testow czerwonych: missing_can_afford_and_deduct_match_running_web
WYKRYTY   : [24] cost: pobor - pusta baza -> 2 testow czerwonych: deduct_does_not_mutate_inputs, missing_can_afford_and_deduct_match_running_web
WYKRYTY   : [25] cost: etykieta - brak etykiety -> 2 testow czerwonych: prototype_key_lookups_are_a_documented_divergence, stock_resource_label_matches_running_web
WYKRYTY   : [26] pool: suma - tylko skonczone -> 1 testow czerwonych: owner_resource_stock_all_matches_running_web
WYKRYTY   : [27] pool: suma - filtr wlasciciela -> 1 testow czerwonych: owner_resource_stock_all_matches_running_web
WYKRYTY   : [28] pool: zapas - suma -> 4 testow czerwonych: credit_owner_resource_stock_matches_running_web, owner_resource_stock_matches_running_web, inactive_status_matches_running_web
PRZEZYL   : [29] pool: zwrot - tylko dodatnie
PRZEZYL   : [30] pool: przypisanie - tylko dodatnie
PRZEZYL   : [31] pool: pobor - NaN/0 koszt
WYKRYTY   : [32] pool: pobor - zerowi posiadacze -> 1 testow czerwonych: deduct_across_cities_matches_running_web
WYKRYTY   : [33] pool: pobor - kierunek sortowania -> 2 testow czerwonych: deduct_across_cities_matches_running_web, pay_drain_matches_running_web
WYKRYTY   : [34] pool: pobor - remis po id odwrocony -> 2 testow czerwonych: explicit_utf16_tie_break_matches_running_web, pay_drain_matches_running_web
WYKRYTY   : [35] pool: kredyt - remis po id odwrocony -> 4 testow czerwonych: assign_from_pool_matches_running_web, explicit_utf16_tie_break_matches_running_web, credit_owner_resource_stock_matches_running_web
WYKRYTY   : [36] pool: id jak bajty UTF-8 -> 2 testow czerwonych: explicit_utf16_tie_break_matches_running_web, refund_across_cities_matches_running_web
PRZEZYL   : [37] pool: NaN roznicy nie jest remisem
WYKRYTY   : [38] pool: pobor - cala potrzeba -> 2 testow czerwonych: deduct_across_cities_matches_running_web, pay_drain_matches_running_web
PRZEZYL   : [39] pool: kredyt - kwota <= 0
WYKRYTY   : [40] pool: kredyt - cap musi byc skonczony -> 1 testow czerwonych: credit_owner_resource_stock_matches_running_web
PRZEZYL   : [41] pool: kredyt - cap bez dolnej granicy
WYKRYTY   : [42] pool: kredyt - kierunek sortowania -> 2 testow czerwonych: credit_owner_resource_stock_matches_running_web, refund_across_cities_matches_running_web
WYKRYTY   : [43] pool: kredyt - ostatni zamiast pierwszego -> 4 testow czerwonych: explicit_utf16_tie_break_matches_running_web, credit_owner_resource_stock_matches_running_web, assign_from_pool_matches_running_web
WYKRYTY   : [44] pool: kredyt - zero -> 1 testow czerwonych: credit_owner_resource_stock_matches_running_web
WYKRYTY   : [45] pool: przypisanie - bez zerowania -> 1 testow czerwonych: assign_from_pool_matches_running_web
WYKRYTY   : [46] pool: sortowanie niestabilne -> 4 testow czerwonych: credit_owner_resource_stock_matches_running_web, assign_from_pool_matches_running_web, refund_across_cities_matches_running_web
WYKRYTY   : [47] unit: Typ bez trim -> 1 testow czerwonych: unit_stock_cost_matches_running_web
WYKRYTY   : [48] unit: wyjatek bez trim -> 1 testow czerwonych: unit_stock_cost_matches_running_web
WYKRYTY   : [49] unit: Surowiec bez trim -> 1 testow czerwonych: unit_stock_cost_matches_running_web
WYKRYTY   : [50] unit: znacznik braku surowca -> 1 testow czerwonych: unit_stock_cost_matches_running_web
WYKRYTY   : [51] unit: ilosc skonczona -> 1 testow czerwonych: unit_stock_cost_matches_running_web
PRZEZYL   : [52] unit: pusty klucz
WYKRYTY   : [53] unit: kon dodawany do surowca -> 1 testow czerwonych: unit_stock_cost_matches_running_web
WYKRYTY   : [54] unit: kon bez skali ery -> 2 testow czerwonych: unit_stock_cost_matches_running_web, unit_stock_cost_matches_flattened_p3_19_table
WYKRYTY   : [55] nfd: znaki laczace zostaja -> 5 testow czerwonych: epoch_cost_multiplier_matches_running_web, scale_cost_by_epoch_matches_running_web, unit_stock_cost_matches_running_web
WYKRYTY   : [56] nfd: Hangul - samogloska -> 2 testow czerwonych: nfd_strip_matches_running_web_for_random_sequences, nfd_strip_matches_running_web_for_every_code_point
WYKRYTY   : [57] nfd: Hangul - spolgloska koncowa -> 2 testow czerwonych: nfd_strip_matches_running_web_for_random_sequences, nfd_strip_matches_running_web_for_every_code_point
WYKRYTY   : [58] nfd: Hangul - spolgloska poczatkowa -> 2 testow czerwonych: nfd_strip_matches_running_web_for_random_sequences, nfd_strip_matches_running_web_for_every_code_point
WYKRYTY   : [59] nfd: brak kanonicznego uporzadkowania -> 1 testow czerwonych: nfd_strip_matches_running_web_for_random_sequences
WYKRYTY   : [60] nfd: bez malych liter -> 5 testow czerwonych: scale_cost_by_epoch_matches_running_web, epoch_cost_multiplier_matches_running_web, unit_stock_cost_matches_running_web
WYKRYTY   : [61] nfd: trim Rust zamiast JS -> 5 testow czerwonych: epoch_cost_multiplier_matches_running_web, scale_cost_by_epoch_matches_running_web, unit_stock_cost_matches_running_web
WYKRYTY   : [62] gate: Mennica - strict > -> 5 testow czerwonych: filter_runtime_active_built_ids_matches_running_web, missing_runtime_labels_match_running_web, owner_can_feed_mennica_matches_running_web
PRZEZYL   : [63] gate: Zloto - filtr dodatnich
mutantow=64 przezylo/niekompilujace=11
   cost: epoka - bez floor
   cost: epoka - cyfry puste czesci
   cost: epoka - cyfry nie-ASCII
   pool: zwrot - tylko dodatnie
   pool: przypisanie - tylko dodatnie
   pool: pobor - NaN/0 koszt
   pool: NaN roznicy nie jest remisem
   pool: kredyt - kwota <= 0
   pool: kredyt - cap bez dolnej granicy
   unit: pusty klucz
   gate: Zloto - filtr dodatnich
# mutation-evidence-r1-part2.txt
WYKRYTY   : [64] gate: konwerter - bez budynku -> 5 testow czerwonych: missing_runtime_labels_match_running_web, label_satisfied_matches_running_web, resource_gate_matches_running_web
WYKRYTY   : [65] gate: zapas > 0 -> 6 testow czerwonych: filter_runtime_active_built_ids_matches_running_web, label_satisfied_matches_running_web, missing_runtime_labels_match_running_web
WYKRYTY   : [66] gate: etykiety - bez deduplikacji -> 3 testow czerwonych: missing_runtime_labels_match_running_web, required_active_labels_match_running_web, inactive_status_matches_running_web
WYKRYTY   : [67] gate: wymagany surowiec bez trim -> 5 testow czerwonych: required_active_labels_match_running_web, missing_runtime_labels_match_running_web, resource_gate_matches_running_web
WYKRYTY   : [68] gate: wymagany surowiec bez malych liter -> 5 testow czerwonych: missing_runtime_labels_match_running_web, required_active_labels_match_running_web, runtime_gate_matches_running_web
WYKRYTY   : [69] gate: bramka budowy - any -> 1 testow czerwonych: resource_gate_matches_running_web
WYKRYTY   : [70] gate: Mennica runtime - odwrocony resolver -> 4 testow czerwonych: filter_runtime_active_built_ids_matches_running_web, missing_runtime_labels_match_running_web, runtime_gate_matches_running_web
WYKRYTY   : [71] gate: Mennica runtime - zawsze prawda -> 2 testow czerwonych: filter_runtime_active_built_ids_matches_running_web, runtime_gate_matches_running_web
WYKRYTY   : [72] gate: runtime - bez wybudowanych -> 1 testow czerwonych: runtime_gate_matches_running_web
KOMPILACJA: [73] gate: filtr - pomija duplikaty (mutant nie kompiluje sie)
WYKRYTY   : [74] gate: filtr - odwrocona bramka -> 1 testow czerwonych: filter_runtime_active_built_ids_matches_running_web
PRZEZYL   : [75] gate: filtr - kolejnosc aktywnych
WYKRYTY   : [76] gate: prerekwizyt - pusty napis -> 1 testow czerwonych: city_building_prereq_met_matches_running_web
WYKRYTY   : [77] gate: prerekwizyt - and -> 1 testow czerwonych: city_building_prereq_met_matches_running_web
WYKRYTY   : [78] gate: prerekwizyt - brak = niespelniony -> 1 testow czerwonych: city_building_prereq_met_matches_running_web
WYKRYTY   : [79] gate: brakujace etykiety - odwrocone -> 2 testow czerwonych: missing_runtime_labels_match_running_web, inactive_status_matches_running_web
WYKRYTY   : [80] gate: brakujace - Mennica odwrocona -> 2 testow czerwonych: missing_runtime_labels_match_running_web, inactive_status_matches_running_web
WYKRYTY   : [81] gate: Spichlerz wylaczony z bramki -> 2 testow czerwonych: filter_runtime_active_built_ids_matches_running_web, has_deposit_runtime_gate_matches_running_web
WYKRYTY   : [82] sp: drain Ceramiki - strict > -> 1 testow czerwonych: pay_drain_matches_running_web
WYKRYTY   : [83] sp: drain Soli - strict > -> 1 testow czerwonych: pay_drain_matches_running_web
WYKRYTY   : [84] sp: dry-run pobiera -> 1 testow czerwonych: pay_drain_matches_running_web
WYKRYTY   : [85] sp: dry-run - Ceramika -> 2 testow czerwonych: inactive_status_matches_running_web, pay_drain_matches_running_web
WYKRYTY   : [86] sp: stan - Pop bez II -> 1 testow czerwonych: bonus_state_matches_running_web
WYKRYTY   : [87] sp: stan - Sol tylko II -> 1 testow czerwonych: bonus_state_matches_running_web
PRZEZYL   : [88] sp: stan - II wymaga II
WYKRYTY   : [89] sp: zdrowie II -> 1 testow czerwonych: bonuses_and_yields_match_running_web
WYKRYTY   : [90] sp: wzrost II -> 1 testow czerwonych: bonuses_and_yields_match_running_web
WYKRYTY   : [91] sp: racja II -> 1 testow czerwonych: bonuses_and_yields_match_running_web
WYKRYTY   : [92] sp: zadowolenie - domyslna -> 1 testow czerwonych: bonuses_and_yields_match_running_web
WYKRYTY   : [93] sp: yields - tylko jeden -> 1 testow czerwonych: bonuses_and_yields_match_running_web
WYKRYTY   : [94] sp: armia poza terytorium -> 1 testow czerwonych: army_food_multiplier_matches_running_web
WYKRYTY   : [95] sp: armia garnizon -> 1 testow czerwonych: army_food_multiplier_matches_running_web
WYKRYTY   : [96] sp: nieaktywny - brak budynku -> 1 testow czerwonych: inactive_status_matches_running_web
WYKRYTY   : [97] sp: nieaktywny - Sol tylko II -> 1 testow czerwonych: inactive_status_matches_running_web
WYKRYTY   : [98] sp: nieaktywny - separator -> 1 testow czerwonych: inactive_status_matches_running_web
WYKRYTY   : [99] sp: nieaktywny - budynek z opcji -> 1 testow czerwonych: inactive_status_matches_running_web
WYKRYTY   : [100] sp: posiadanie - and -> 1 testow czerwonych: city_has_spichlerz_matches_running_web
WYKRYTY   : [101] tab: tempo normalny -> 3 testow czerwonych: constants_match_running_web, building_cost_pace_matches_running_web, pace_matches_flattened_work_states_for_normal_mode
WYKRYTY   : [102] tab: prog ery 3 -> 7 testow czerwonych: building_era_cost_multiplier_matches_running_web, building_stock_cost_matches_running_web, epoch_cost_multiplier_matches_running_web
WYKRYTY   : [103] tab: prog ery 2 -> 8 testow czerwonych: building_era_cost_multiplier_matches_running_web, building_stock_cost_matches_running_web, epoch_cost_multiplier_matches_running_web
PRZEZYL   : [104] tab: slowo epoki
WYKRYTY   : [105] tab: FALA2 -> 2 testow czerwonych: building_stock_cost_matches_running_web, building_stock_cost_matches_flattened_p3_19_table
WYKRYTY   : [106] tab: koszt koni -> 3 testow czerwonych: constants_match_running_web, unit_stock_cost_matches_running_web, unit_stock_cost_matches_flattened_p3_19_table
WYKRYTY   : [107] tab: drain Ceramiki -> 2 testow czerwonych: constants_match_running_web, pay_drain_matches_running_web
WYKRYTY   : [108] tab: zdrowie II -> 1 testow czerwonych: bonuses_and_yields_match_running_web
WYKRYTY   : [109] tab: racja I -> 1 testow czerwonych: bonuses_and_yields_match_running_web
WYKRYTY   : [110] tab: prerekwizyt Akademii -> 1 testow czerwonych: constants_match_running_web
WYKRYTY   : [111] tab: zloze Kuzni -> 5 testow czerwonych: filter_runtime_active_built_ids_matches_running_web, missing_runtime_labels_match_running_web, required_active_labels_match_running_web
WYKRYTY   : [112] tab: etykieta Stali (bramka) -> 4 testow czerwonych: missing_runtime_labels_match_running_web, label_satisfied_matches_running_web, required_active_labels_match_running_web
WYKRYTY   : [113] tab: drain Mennicy -> 6 testow czerwonych: filter_runtime_active_built_ids_matches_running_web, constants_match_running_web, missing_runtime_labels_match_running_web
WYKRYTY   : [114] tab: komunikat Brak -> 1 testow czerwonych: inactive_status_matches_running_web
WYKRYTY   : [115] tab: konwerter Cegly -> 5 testow czerwonych: missing_runtime_labels_match_running_web, label_satisfied_matches_running_web, resource_gate_matches_running_web
WYKRYTY   : [116] tab: Spichlerz poza bramka -> 2 testow czerwonych: filter_runtime_active_built_ids_matches_running_web, has_deposit_runtime_gate_matches_running_web
WYKRYTY   : [117] tab: dostep wodny -> 1 testow czerwonych: constants_match_running_web
WYKRYTY   : [118] tab: cap Spichlerza -> 1 testow czerwonych: constants_match_running_web
WYKRYTY   : [119] tab: armia poza terytorium -> 1 testow czerwonych: army_food_multiplier_matches_running_web
WYKRYTY   : [120] tab: wyjatek koni -> 3 testow czerwonych: constants_match_running_web, unit_stock_cost_matches_running_web, unit_stock_cost_matches_flattened_p3_19_table
WYKRYTY   : [121] tab: etykieta Zlota (token) -> 4 testow czerwonych: label_satisfied_matches_running_web, missing_runtime_labels_match_running_web, required_active_labels_match_running_web
WYKRYTY   : [122] tab: NFD wpis -> 1 testow czerwonych: nfd_strip_matches_running_web_for_every_code_point
WYKRYTY   : [123] tab: NFD Hangul t_count -> 2 testow czerwonych: nfd_strip_matches_running_web_for_random_sequences, nfd_strip_matches_running_web_for_every_code_point
WYKRYTY   : [124] tab: NFD ranga znaku -> 1 testow czerwonych: nfd_strip_table_has_valid_shape
WYKRYTY   : [125] dr: token Zlota nie zamieniany -> 5 testow czerwonych: label_satisfied_matches_running_web, missing_runtime_labels_match_running_web, required_active_labels_match_running_web
WYKRYTY   : [126] dr: indeks NFD -> 7 testow czerwonych: epoch_cost_multiplier_matches_running_web, scale_cost_by_epoch_matches_running_web, unit_stock_cost_matches_running_web
mutantow=63 przezylo/niekompilujace=4
   gate: filtr - pomija duplikaty [nie kompiluje]
   gate: filtr - kolejnosc aktywnych
   sp: stan - II wymaga II
   tab: slowo epoki
# mutation-evidence-r1-part3.txt
WYKRYTY   : [8] cost: epoka - cyfry puste czesci -> 3 testow czerwonych: epoch_cost_multiplier_matches_running_web, scale_cost_by_epoch_matches_running_web, unit_stock_cost_matches_running_web
WYKRYTY   : [52] unit: pusty klucz -> 1 testow czerwonych: unit_stock_cost_matches_running_web
WYKRYTY   : [73] gate: filtr - dodatkowy wymagany surowiec -> 1 testow czerwonych: filter_runtime_active_built_ids_matches_running_web
mutantow=3 przezylo/niekompilujace=0
```

Mutanty rownowazne (celowo NIE dodane, z uzasadnieniem): (1) usuniecie skrotu `if era_multiplier == 1.0 { return fala2_cost; }` w `building_stock_cost` - wartosci po FALA2 sa calkowite >= 1, wiec mnozenie przez 1 i zaokraglenie nic nie zmienia; (2) usuniecie `js_max(1.0, ..)` z mnoznika ery w `building_stock_cost` - po FALA2 kazda wartosc >= 1, wiec `round(amount * mnoznik) >= 1`; (3) `unwrap_or(f64::NAN)` w `epoch_cost_multiplier` - `parse::<f64>` napisu cyfr ASCII nigdy nie zawodzi (gałąź nieosiagalna); (4) `.rev()` w `ascii_by_label` - etykiety w tabeli sa unikalne (test ksztaltu), wiec kierunek nie ma znaczenia; (5) `if !key.is_empty()` w `building_required_active_labels` - pusty klucz i tak nie ma wpisu w tabeli; (6) `if need <= 0.0 { break; }` -> `<` w pobor - przy `need == 0` kolejny posiadacz dostaje `take = 0`, wartosc zapasu bez zmian.

## 7. Literaly w nowych modulach (zero danych balansowych)

`dowody/grep-literals-r1.txt` (skrypt `grep-literals-p67b.py`): literaly liczbowe i napisowe w `building_costs.rs::p6_7b` i `derived.rs` (od `// P6.7B`), komentarze pominiete. Wszystkie wystapienia to STRUKTURALNE (`0.0`, `1.0`, indeksy `[0]`, `0`/`1` w petlach, napisy `""` jako domyslne `unwrap_or`, format `"{}{}"`, sciezki `include_str!`, komunikaty `expect`) - zadnego mnoznika, progu, etykiety, id budynku ani wartosci balansu (wszystkie w `building-cost-params.json`). Pelne wyjscie w §11.7.

## 8. Tabela bylo/jest i zmiany testow

| Element | Bylo (baza `c4fa31a2`) | Jest |
|---|---|---|
| `domain/building_costs.rs` | 291 linii: `BuildingCost`, `canonical_building_costs`, `spend_building_cost` (u32, Praca = tabela) | te same 291 linii bez zmian + `pub mod p6_7b` (1265 linii) |
| Koszt tempa kosztow budynkow (`applyBuildingCostPace`) | brak (Rust mial tylko wyniki w `building-work-states.json`) | `apply_building_cost_pace`; zgodny z tabela dla trybu `normalny` (195 wierszy, `tables::pace_matches_flattened_work_states_for_normal_mode`) |
| Mnoznik ery / koszt surowcowy budynku i jednostki | tylko splaszczone tabele P3-19 | funkcje 1:1 (`epoch_cost_multiplier`, `scale_cost_by_epoch`, `building_era_cost_multiplier`, `building_stock_cost`, `unit_stock_cost`); zgodne z tabelami P3-19 dla 42 budynkow i 75 jednostek |
| Pula surowcow panstwa po miastach | brak | `owner_resource_stock_all`, `owner_resource_stock`, `deduct/refund/credit/assign_*` |
| Bramki budowy i runtime, prerekwizyty, Spichlerz, status nieaktywnego budynku | brak | `building_resource_gate_met`, `building_runtime_gate_met`, `filter_runtime_active_built_ids`, `city_building_prereq_met`, `pay_spichlerz_drain_for_city`, `resolve_owned_building_inactive_status` i pozostale (§3) |
| Klucz `stripDiacriticsLower` | `civ_bonuses::strip_diacritics` (tylko lacinskie, male litery, bez trim) | `nfd_strip` + tabela Unicode: 0 rozbieznosci na calym Unicode poza klasa Z8 |
| `data/derived.rs` | konczy sie `display_names_params()` | + dopisek `// P6.7B`: `building_cost_params()`, `nfd_strip_lookup()` (+262 linii) |
| Nowe tabele | - | `data/derived/building-cost-params.json` (132 linii), `data/derived/nfd-strip-table.json` (2924 linii) |
| Testy silnika | 1054 | 1102 (+48): `p6_7b_cost` 11, `p6_7b_gate` 11, `p6_7b_nfd` 2, `p6_7b_pool` 7, `p6_7b_spichlerz` 7, `p6_7b_tables` 10 |

Zmiany testow (jawna lista): DODANE 48 testow w 6 nowych plikach + `tests/p6_7b_vectors/common.rs` (modul pomocniczy, nie crate testowy) i 4 pliki wektorow. USUNIETE: 0. ZMIENIONE: 0. OSLABIONE: 0. Istniejace pliki testow nie byly otwierane do edycji.

## 9. NIE_ZMIERZONO / RUNDA-2 (jawna lista)

- **Integracja z wolajacymi** (poza zakresem trzech plikow): `ui/cityPanel.ts addItem()`, `main.ts` (handler `cmd.type === 'build'`), `ai.ts chooseCityProduction (opts.canAfford)`, `production.ts` (`availableProduction`, `applyBuildingCostPace` po ulgach cywilizacji), `turn-economy.ts` (drain Spichlerza/Mennicy co ture). Port daje funkcje czyste; podpiecie pod `GameState` i komendy to osobny temat integracyjny.
- **Pozostale eksporty plikow wstrzyknietych**: `r-stawki-strojenie.ts` (8 eksportow poza `scaleStockCostRecord`: `R_STAWKI_KOSZT_MULT`, `R_STAWKI_FALA1_FALA2_MULT`, `normalizeResearchEra`, `isResearchEraFala2Extra`, `scaleImprovementWorkCost`, `scaledWonderWorkCost`, ...) - RUNDA-2 tematu P6.7 (gap-analysis przypisuje plik do P6.7); `zloto-access.ts` (`countKopalnieZlota`, `empireHasKopalniaZlota`, `ownerHasZlotoStock`, `resolveOwnerZlotoFromStock`, `deductMennicaZlotoDrain`, API legacy) - poza zakresem; `production.ts` (poza `isBuildingSupersededByUpgrade`, ktora jest domknieciem).
- **Klucze z lancucha prototypow** (Z9): swiadoma rozbieznosc, udokumentowana testem.
- **Skosnosc wersji Unicode** (Z8): 28 punktow kodowych, klasa opisana i sprawdzana testem.
- **Sortowanie z komparatorem `NaN`** (Z5): kolejnosc V8 niezdefiniowana - NIE_ZMIERZONO.
- **Nieliczbowe `ownerId`/`City.surowce` o wartosciach nie-liczbowych** (Z3, Z4): nie modelowane typem.
- **Weryfikacja w przegladarce**: nie dotyczy (Z16).
- **Duplikaty stalych** (Z10, Z11): martwe klucze `econ-params.json` i `cities-params.json -> wejscia_z_innych_modulow_weba` poza allowlista; rekomendacja dla integratora w Z11.
- **Sprzatanie `Cargo.lock`**: plik generowany przez `cargo` w worktree jest nieSledzony i NIE jest commitowany.

## 10. Zero zmian poza allowlista - samokontrola

Allowlista: `dyspozycje/rust-port/p6/P6-7B-MIASTA-WZROST-B.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/**`, `rust-port/engine/src/domain/building_costs.rs`, `rust-port/engine/src/data/derived.rs` (dopisek na koncu), `rust-port/engine/data/derived/*.json` (nowe), `rust-port/engine/tests/p6_7b_*.rs`, `rust-port/engine/tests/p6_7b_vectors/**`.

Pliki w indeksie po jawnym `git add` (bez `-A`): 38; poza allowlista: 0 .
Zakazane sciezki (`gra/**`, `bridge.rs`, `Cargo.toml`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`, `tests/p6_m00_skeleton.rs`): 0 w indeksie. `Cargo.lock` i `target/` nie sa w indeksie (plik generowany lokalnie, nieSledzony).

```text
$ git status --short   (stan w chwili skladania dokumentu)
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/01-operator-r1.md
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/build-doc-p67b.py
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/dowody/grep-literals-r1.txt
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/dowody/verify-negative-r1.txt
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/gate-clippy-r1.log
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/gate-fmt-r1.log
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/gate-test-r1.log
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/gen-p67b-nfd-table.mjs
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/gen-p67b-vectors.mjs
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/gen-symbols-p67b.py
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/grep-literals-p67b.py
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/mutate-p67b.py
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/mutation-equivalents-r1.txt
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/mutation-evidence-r1-part1.txt
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/mutation-evidence-r1-part2.txt
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/mutation-evidence-r1-part3.txt
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/nfd-skew-r1.txt
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/p67b-loader-hooks.mjs
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/p67b-loader-register.mjs
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/symbols-p67b-r1.tsv
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/verify-negative-p67b.py
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/verify-p67b-r1.log
A  dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/verify-p67b-vectors.py
A  rust-port/engine/data/derived/building-cost-params.json
A  rust-port/engine/data/derived/nfd-strip-table.json
M  rust-port/engine/src/data/derived.rs
M  rust-port/engine/src/domain/building_costs.rs
A  rust-port/engine/tests/p6_7b_cost.rs
A  rust-port/engine/tests/p6_7b_gate.rs
A  rust-port/engine/tests/p6_7b_nfd.rs
A  rust-port/engine/tests/p6_7b_pool.rs
A  rust-port/engine/tests/p6_7b_spichlerz.rs
A  rust-port/engine/tests/p6_7b_tables.rs
A  rust-port/engine/tests/p6_7b_vectors/common.rs
A  rust-port/engine/tests/p6_7b_vectors/cost.json
A  rust-port/engine/tests/p6_7b_vectors/gate.json
A  rust-port/engine/tests/p6_7b_vectors/nfd.json
A  rust-port/engine/tests/p6_7b_vectors/pool.json
?? rust-port/engine/Cargo.lock

$ git diff --cached --stat   (przed dodaniem tego dokumentu)
 .../01-operator-r1.md                              |   12 +
 .../build-doc-p67b.py                              |  165 ++
 .../dowody/grep-literals-r1.txt                    |   68 +
 .../dowody/verify-negative-r1.txt                  |    9 +
 .../gate-clippy-r1.log                             |    3 +
 .../gate-fmt-r1.log                                |    1 +
 .../gate-test-r1.log                               | 1981 +++++++++++++
 .../gen-p67b-nfd-table.mjs                         |   77 +
 .../gen-p67b-vectors.mjs                           |  688 +++++
 .../gen-symbols-p67b.py                            |  173 ++
 .../grep-literals-p67b.py                          |   47 +
 .../mutate-p67b.py                                 |  255 ++
 .../mutation-equivalents-r1.txt                    |   14 +
 .../mutation-evidence-r1-part1.txt                 |   76 +
 .../mutation-evidence-r1-part2.txt                 |   68 +
 .../mutation-evidence-r1-part3.txt                 |    4 +
 .../nfd-skew-r1.txt                                |    1 +
 .../p67b-loader-hooks.mjs                          |   29 +
 .../p67b-loader-register.mjs                       |    3 +
 .../symbols-p67b-r1.tsv                            |   69 +
 .../verify-negative-p67b.py                        |   93 +
 .../verify-p67b-r1.log                             |    1 +
 .../verify-p67b-vectors.py                         |  898 ++++++
 .../engine/data/derived/building-cost-params.json  |  132 +
 rust-port/engine/data/derived/nfd-strip-table.json | 2924 ++++++++++++++++++++
 rust-port/engine/src/data/derived.rs               |  263 ++
 rust-port/engine/src/domain/building_costs.rs      | 1280 +++++++++
 rust-port/engine/tests/p6_7b_cost.rs               |  335 +++
 rust-port/engine/tests/p6_7b_gate.rs               |  281 ++
 rust-port/engine/tests/p6_7b_nfd.rs                |  110 +
 rust-port/engine/tests/p6_7b_pool.rs               |  138 +
 rust-port/engine/tests/p6_7b_spichlerz.rs          |  228 ++
 rust-port/engine/tests/p6_7b_tables.rs             |  389 +++
 rust-port/engine/tests/p6_7b_vectors/common.rs     |  267 ++
 rust-port/engine/tests/p6_7b_vectors/cost.json     |    1 +
 rust-port/engine/tests/p6_7b_vectors/gate.json     |    1 +
 rust-port/engine/tests/p6_7b_vectors/nfd.json      |    1 +
 rust-port/engine/tests/p6_7b_vectors/pool.json     |    1 +
 38 files changed, 11086 insertions(+)
```

## 11. Surowe, pelne wyjscia bramek r1 (kopie plikow `gate-*-r1.log`, bez wyciec)

### 11.1 `cargo fmt --check` (rust-port/engine; `gate-fmt-r1.log`)

```text
EXIT=0
```

### 11.2 `cargo clippy --all-targets -- -D warnings` (rust-port/engine; `gate-clippy-r1.log`)

```text
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_ad6f5f21-f40-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 2m 49s
EXIT=0
```

### 11.3 `cargo test` (rust-port/engine; `gate-test-r1.log`; suma `passed=1102 failed=0`)

```text
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_ad6f5f21-f40-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 4m 13s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test civilian_units_do_not_receive_combat_orders ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test byte_sums_per_category_match_p1_11 ... ok
test counts_per_extension_match_p1_11 ... ok
test manifest_has_header_and_428_data_rows ... ok
test manifest_dest_paths_are_unique ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_size ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test sha1_matches_known_vectors ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.57s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_destruction_removes_only_the_entered_camp ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_id.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/city_id-693b1037fdbc4b08)

running 6 tests
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test city_id_conversions_round_trip ... ok
test city_id_map_keys_stay_numeric_in_json ... ok
test city_id_ordering_matches_raw_value ... ok
test city_id_serializes_as_bare_number ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat_ai_multipliers.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/combat_ai_multipliers-52898acb951a9ad0)

running 5 tests
test las_row_is_class_a_and_marked_read_by_domain ... ok
test table_has_each_row_once_with_known_class_and_status ... ok
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test accessors_return_the_table_value_not_a_constant ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/counter_multipliers.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/counter_multipliers-c944a65d0a384717)

running 5 tests
test explicit_unit_bonus_overrides_table ... ok
test table_lists_each_type_pair_once_with_finite_positive_multiplier ... ok
test table_type_keys_are_canonical ... ok
test domain_reads_table_and_unknown_types_give_no_bonus ... ok
test table_is_readable_for_every_pair_and_misses_are_none ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test tech_json_parses ... ok
test buildings_json_parses ... ok
test wonders_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test civ_params_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test civs_count_and_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_ai_params ... ok
test rt_auto_battle_params ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_citizen_resource_upkeep ... ok
test rt_city_names_pools ... ok
test rt_civ_ai ... ok
test rt_civ_matrix ... ok
test rt_civ_params ... ok
test rt_civs ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_diplomacy ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_e_start_params ... ok
test collection_id_sets_match_web_pin ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_map_gen_params ... ok
test rt_econ_params ... ok
test rt_power_params ... ok
test rt_resources ... ok
test rt_miasto_params ... ok
test rt_society_params ... ok
test rt_terrain_combat ... ok
test rt_tech ... ok
test rt_buildings ... ok
test rt_terrain_movement ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_wonders ... ok
test rt_terrain_improvements ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_units ... ok
test embedded_raw_counts_match_web_pin ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_ai_params_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_missing_file_is_file_missing ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_unreadable_file_is_io ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.68s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test auto_battle_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test combat_params_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/derived_values-7eb2b3615468dd51)

running 25 tests
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test building_gold_upkeep_has_one_row_per_building_level ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test unit_table_epoch_field_matches_units_json ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok
test unit_table_key_shape_and_positive_integer_values ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test annexation_requires_vassal_economy_orientation ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test production_diplomacy_api_is_public ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok
test terrain_qualification_matches_the_world_map_rules ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test map_golden_vector_matches_typescript_core_contract ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/owner_ref-92f476c7f4239a8a)

running 10 tests
test owner_ref_accessors_and_player_conversion ... ok
test owner_ref_hash_agrees_with_equality ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test camp_id_is_a_transparent_newtype ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_civ_entry_epoch.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1_civ_entry_epoch-c29112b12d237024)

running 8 tests
test civ_entry_epoch_matches_web_vectors ... ok
test civ_entry_label_matches_web_vectors ... ok
test civ_availability_matches_web_vectors_for_every_game_epoch ... ok
test game_epoch_index_matches_web_for_every_probe ... ok
test game_epoch_hud_label_matches_web_vectors ... ok
test civ_ids_available_match_web_roster_vectors ... ok
test strict_epoch_ids_reject_non_canonical_spellings ... ok
test game_epoch_order_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_first_player_city.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1_first_player_city-e31375affc71b1c0)

running 5 tests
test awaiting_first_city_matches_web_for_explicit_owner_one ... ok
test awaiting_first_city_matches_web_for_owner_zero ... ok
test validate_placement_matches_web_vectors ... ok
test hex_in_start_reveal_matches_web_vectors ... ok
test denied_message_matches_web_constant ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_owner_seats.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1_owner_seats-1a3aae5c483a1e2f)

running 6 tests
test human_seats_match_web_vectors ... ok
test human_owner_primary_matches_web ... ok
test hot_seat_cycles_and_skips_unknown_active ... ok
test major_ai_owner_matches_web_vectors ... ok
test stub_constants_are_the_web_sentinels ... ok
test web_owner_minus_five_is_out_of_domain_and_not_representable ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_1_rng_mulberry.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1_rng_mulberry-617bdab005dd8b1f)

running 2 tests
test mulberry32_is_not_the_lcg_stream ... ok
test mulberry32_matches_web_make_rng_vectors_bit_for_bit ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1b_playerstate.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1b_playerstate-7e0df28b40755091)

running 19 tests
test error_missing_cost_for_unknown_tempo_and_mode ... ok
test hot_seat_two_human_owners_have_independent_player_states ... ok
test error_research_step_is_atomic_on_missing_cost ... ok
test parity_cheapest_tie_break_uses_utf16_order ... ok
test parity_constants_and_defaults_match_web ... ok
test parity_gates_available_and_cheapest ... ok
test parity_per_row_functions ... ok
test parity_research_costs_equal_web_scaled_research_cost ... ok
test parity_vectors_use_the_engine_tech_data ... ok
test serde_missing_research_queue_defaults_to_empty ... ok
test table_constants_are_read_from_data_not_literals ... ok
test table_edit_of_research_cost_changes_the_step ... ok
test table_epoch_map_and_sentinels_come_from_data ... ok
test table_every_engine_tech_has_a_research_cost_for_every_axis ... ok
test table_player_state_params_shape ... ok
test table_research_cost_rows_agree_with_tech_json ... ok
test parity_scenarios_from_web ... ok
test parity_parse_prereqs_and_prereqs_met ... ok
test parity_epoch_number ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.51s

     Running tests/p6_1c_braz_access.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1c_braz_access-043839ba2b428854)

running 7 tests
test city_has_piec_hutniczy_matches_web ... ok
test empire_has_kopalnia_miedzi_matches_web ... ok
test normalize_improvement_key_known_keys_equal_data_keys ... ok
test has_braz_access_matches_web ... ok
test normalize_improvement_key_matches_web ... ok
test prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome ... ok
test bootstrap_table_values_equal_web_constants ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/p6_1c_llama_seed.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1c_llama_seed-e56bbca479ca6477)

running 3 tests
test hex_keys_within_radius_matches_web_loop_order ... ok
test hash_pos_matches_web_hash_pos_verbatim ... ok
test seed_inca_llama_deposits_matches_web_for_all_cases ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.62s

     Running tests/p6_1c_start_cluster.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1c_start_cluster-584791c0a8e00ea4)

running 8 tests
test land_hexes_filter_matches_web_rule ... ok
test display_label_for_slot_matches_web ... ok
test constants_and_start_relations_match_web ... ok
test build_cluster_start_plan_matches_web_for_all_cases ... ok
test pick_second_human_start_hex_matches_web ... ok
test second_human_without_legal_hex_yields_no_second_seat_derived_from_code ... ok
test second_human_civ_equal_to_player_civ_is_rejected_like_web ... ok
test vectors_cover_the_branches_of_build_cluster_start_plan ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.81s

     Running tests/p6_1c_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1c_tables-2a37790854995833)

running 4 tests
test braz_table_has_sane_shape_and_consistent_references ... ok
test cluster_table_has_sane_shape ... ok
test start_tables_parse_with_deny_unknown_fields ... ok
test llama_table_has_sane_shape ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1d_city_names.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1d_city_names-4bfda12150196ed9)

running 13 tests
test collect_used_city_names_matches_web ... ok
test city_name_with_suffix_matches_web ... ok
test nazwa_klastra_at_matches_web ... ok
test cluster_rival_from_pool_matches_web ... ok
test pool_length_constants_match_web ... ok
test embedded_pool_data_is_byte_identical_to_data_used_for_vectors ... ok
test rival_pool_index_matches_web ... ok
test pick_next_city_name_from_names_matches_web_for_synthetic_queues ... ok
test state_city_name_at_matches_web ... ok
test suggest_and_ai_founding_names_match_web ... ok
test resolve_state_city_name_matches_web ... ok
test validate_city_names_pools_matches_web ... ok
test pick_capital_foreign_regular_match_web_for_real_pools ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.17s

     Running tests/p6_1d_civ_bonuses.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1d_civ_bonuses-30f5c7450cfc6997)

running 14 tests
test apply_multiplier_matches_web ... ok
test building_cost_discount_matches_web ... ok
test embedded_data_is_byte_identical_to_data_used_for_vectors ... ok
test is_combat_modifier_bonus_matches_web ... ok
test empty_bonus_list_gives_zero_multipliers ... ok
test matrix_bonusy_match_web_for_every_civ_key_variant ... ok
test real_civs_bonuses_convert_without_loss ... ok
test movement_range_siege_wall_multipliers_match_web ... ok
test terrain_forest_detection_matches_web ... ok
test unit_combat_category_matches_web_for_every_unit ... ok
test unit_matches_cel_matches_web_for_every_unit_and_cel ... ok
test strip_diacritics_matches_web_function_cut_verbatim ... ok
test bonus_applies_per_entry_matches_web_for_multi_entry_lists ... ok
test bonus_applies_and_stat_multipliers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 11.08s

     Running tests/p6_1d_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1d_tables-7c67743f1f351b01)

running 4 tests
test city_name_constants_have_consistent_shape ... ok
test diacritics_table_maps_single_chars_outside_ascii ... ok
test rules_have_known_stats_and_param_ids ... ok
test matrix_specs_have_consistent_shape_and_known_param_ids ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1e_civ_matrix.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1e_civ_matrix-d0b7dd9cf60d4be3)

running 21 tests
test ai_params_and_diplomacy_rows_match_web ... ok
test ai_fallback_branches_are_actually_exercised ... ok
test apply_civ_matrix_param_matches_web ... ok
test civ_matrix_param_def_matches_web ... ok
test civ_matrix_param_at_difficulty_matches_web ... ok
test civ_matrix_params_at_difficulty_matches_web_order_and_values ... ok
test civ_matrix_param_matches_web ... ok
test data_files_are_byte_identical_to_web_pin ... ok
test ai_by_typ_resolvers_match_web ... ok
test consumer_status_polarity_band_baseline_match_web_per_parameter ... ok
test every_matrix_cell_parses_exactly_like_js ... ok
test median_matches_web ... ok
test proc_sum_and_apply_proc_match_web ... ok
test param_order_and_rows_match_web_for_every_scenario ... ok
test scale_parameters_are_clamped_and_shifted_only_for_skala ... ok
test every_status_for_every_parameter_matches_web_texts ... ok
test status_visibility_is_true_only_for_real_gameplay ... ok
test profile_by_key_resolution_matches_web ... ok
test synthetic_cell_grid_matches_web ... ok
test ai_profiles_and_norms_match_web ... ok
test snapshot_and_profiles_match_web ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.95s

     Running tests/p6_1e_civ_names.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1e_civ_names-80674a5ae9a4508e)

running 11 tests
test assign_invariants_hold_on_real_roster ... ok
test constants_match_web ... ok
test civ_ids_from_roster_matches_web ... ok
test make_rng_streams_match_web_for_every_seed ... ok
test find_klastra_display_validate_match_web ... ok
test reexports_behave_like_web ... ok
test rotate_preferred_matches_web ... ok
test pool_views_ai_founded_and_validation_match_web ... ok
test pick_active_civ_pool_matches_web ... ok
test assign_ai_civ_types_matches_web ... ok
test start_foreign_rival_state_names_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.25s

     Running tests/p6_1e_js_compat.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1e_js_compat-08e1cb152706a259)

running 8 tests
test intensity_label_matches_web ... ok
test is_integer_and_min_max_clamp_follow_js ... ok
test math_round_matches_js_bit_for_bit ... ok
test number_to_string_matches_js_for_every_vector ... ok
test trim_matches_js_string_trim ... ok
test parameter_label_matches_web ... ok
test formatted_value_matches_web ... ok
test to_fixed_matches_js_for_every_digit_count ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/p6_1e_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_1e_tables-9dc9ef20c17d92b2)

running 7 tests
test parameter_label_dictionary_has_nonempty_entries_and_suffix_rule ... ok
test params_table_is_consistent_with_matrix_and_civs ... ok
test semantic_table_has_text_for_every_status_and_placeholder ... ok
test modules_contain_no_balance_or_data_literals ... ok
test semantic_table_sets_reference_existing_parameters_and_are_disjoint ... ok
test semantic_neutral_band_rules_cover_every_parameter_definition ... ok
test tables_parse_and_are_cached ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_23_fort.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_23_fort-324dd86b69e58eeb)

running 5 tests
test fort_rules_table_references_known_improvements ... ok
test territory_dependencies_match_web ... ok
test fort_node_conversion_and_reservation_match_web ... ok
test takeover_on_city_founded_matches_web ... ok
test evacuation_hex_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s

     Running tests/p6_23_hexmove.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_23_hexmove-a546770c25695422)

running 4 tests
test foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors ... ok
test city_at_hex_and_occupancy_match_web ... ok
test foreign_city_blocks_match_web ... ok
test ai_entry_into_empty_enemy_city_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/p6_23_improvements.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_23_improvements-2f6107250ed9d0bf)

running 10 tests
test constants_match_web ... ok
test era_and_cost_scaling_match_web ... ok
test applying_bonuses_matches_web ... ok
test catalog_key_order_equals_json_file_order_including_meta_rows ... ok
test hex_layer_functions_match_web ... ok
test rules_tables_have_consistent_shape ... ok
test territory_and_ore_yields_match_web ... ok
test normalize_and_lookup_functions_match_web ... ok
test prototype_keys_pass_normalize_like_in_web ... ok
test migration_functions_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.50s

     Running tests/p6_23_order.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_23_order-b99acb8ea5803b82)

running 11 tests
test fallback_params_equal_web_constant ... ok
test engine_society_params_match_web_subset_used_by_vectors ... ok
test compute_order_matches_web ... ok
test load_order_params_matches_web ... ok
test order_effects_matches_web ... ok
test happiness_breakdown_matches_web ... ok
test order_shape_invariants_hold_for_any_table_values ... ok
test evaluate_order_matches_web ... ok
test order_tier_matches_web ... ok
test order_effects_to_yield_mults_matches_web ... ok
test pick_revolt_migration_target_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.64s

     Running tests/p6_23_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_23_tables-6de635983c184b19)

running 3 tests
test teren_ruch_reguly_table_has_nonempty_lists ... ok
test porzadek_params_table_is_complete_and_finite ... ok
test ulepszenia_reguly_table_references_existing_improvements_only ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_4_core.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_4_core-1b564fea4bb5288e)

running 10 tests
test constants_read_from_running_web_match_tables ... ok
test hex_distance_matches_web ... ok
test path_cost_matches_web ... ok
test road_modifier_matches_web_including_floor_and_special_costs ... ok
test terrain_and_embark_costs_match_web_on_maps ... ok
test stack_group_id_matches_web ... ok
test terrain_cost_combinations_match_web ... ok
test compute_reachable_matches_web_order_and_min_move ... ok
test compute_path_matches_web_including_ties_and_edge_destinations ... ok
test visibility_helpers_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.67s

     Running tests/p6_4_embark.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_4_embark-1585566f17a207b0)

running 4 tests
test can_unit_embark_matches_web ... ok
test apply_embark_state_after_move_matches_web ... ok
test water_hex_queries_match_web ... ok
test move_cost_fn_for_matches_web_on_every_map_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.59s

     Running tests/p6_4_march.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_4_march-bae7bfc63cf555d2)

running 6 tests
test save_validation_and_round_trip_match_web ... ok
test fog_frontier_and_fog_plan_match_web ... ok
test truncate_path_to_budget_matches_web_including_min_move ... ok
test execute_march_step_matches_web ... ok
test plan_path_turns_matches_web ... ok
test should_stop_at_obstacle_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.55s

     Running tests/p6_4_rally.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_4_rally-4bbcd32c03f67cc3)

running 3 tests
test launch_leaders_one_per_stack_match_web ... ok
test load_from_save_and_number_parsing_match_web ... ok
test set_clear_and_save_sequences_match_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_4_scout.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_4_scout-573fb211c9224499)

running 5 tests
test explore_scores_match_web ... ok
test run_scouts_auto_explore_matches_web ... ok
test scout_flags_match_web ... ok
test pick_scout_explore_target_matches_web_including_rng_use ... ok
test advance_scout_auto_explore_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 24.25s

     Running tests/p6_4_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_4_tables-d82f71a9bfb2cdbc)

running 4 tests
test neighbour_table_is_six_distinct_adjacent_offsets ... ok
test numeric_rows_have_sane_shape_without_pinning_values ... ok
test table_parses_and_every_row_names_its_web_source ... ok
test text_rows_are_nonempty_and_distinct ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_5a_cost.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5a_cost-a4777603b2625768)

running 4 tests
test js_round_matches_half_up_semantics ... ok
test table_constants_equal_the_running_web_object ... ok
test replace_context_keeps_every_field_and_the_required_stock ... ok
test unit_cost_pace_matches_web_bitwise ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_5a_display.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5a_display-f61d69c84dc8b548)

running 7 tests
test badge_and_veteran_maxima_match_web ... ok
test hp_pool_matches_web_including_nonfinite_and_overfull_hp ... ok
test compute_stack_display_matches_web_order_and_vitals ... ok
test field_power_passes_roster_in_web_order_and_returns_sum ... ok
test unit_at_representative_matches_web ... ok
test stack_vitals_matches_web ... ok
test representative_matches_web_including_utf16_id_order_and_nan_attack ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.82s

     Running tests/p6_5a_ruch.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5a_ruch-0e062d5664866c50)

running 8 tests
test bounce_hex_assignment_matches_web_including_duplicates_and_blocking ... ok
test adjacent_empty_and_split_destinations_match_web ... ok
test hud_actions_match_web ... ok
test bounce_from_origin_and_separate_return_hex_match_web ... ok
test separate_return_matches_web_bitwise ... ok
test unit_with_pooled_ruch_matches_web ... ok
test ruch_pools_match_web_bitwise ... ok
test sync_and_deduct_match_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.62s

     Running tests/p6_5a_stack.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5a_stack-32bcaffc556db8d5)

running 10 tests
test fresh_and_shared_stack_group_ids_match_web_sequence ... ok
test all_defenders_and_wake_stack_match_web ... ok
test garrison_and_field_fortify_transitions_match_web ... ok
test adjacent_army_hexes_and_active_stack_match_web ... ok
test law_garrison_counts_match_web ... ok
test same_stack_group_and_stack_key_match_web ... ok
test stack_group_id_and_render_key_match_web ... ok
test stack_group_id_agrees_with_p64_port_on_the_same_unit ... ok
test transition_chains_match_web_including_both_fortifications_at_once ... ok
test visible_colocated_and_garrison_queries_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.52s

     Running tests/p6_5a_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5a_tables-c73c4ca1005ab433)

running 2 tests
test army_params_parse_and_have_sane_shape ... ok
test tempo_table_parses_and_has_distinct_keys_with_positive_multipliers ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_5b_bonuses.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5b_bonuses-02e0bfe8577aeac4)

running 8 tests
test chain_depth_limit_matches_web ... ok
test building_roles_and_real_game_data_match_web ... ok
test gain_hint_text_matches_web_for_arbitrary_gains ... ok
test stat_multiplier_merge_is_generic_over_any_structural_type ... ok
test stat_multiplier_merge_matches_web ... ok
test unit_progress_badges_and_fractions_match_web ... ok
test city_visit_gain_progress_and_hint_match_web ... ok
test city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.61s

     Running tests/p6_5b_format.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5b_format-8864aed56360906f)

running 5 tests
test locale_compare_table_is_the_measured_primary_order ... ok
test number_to_string_matches_web ... ok
test locale_compare_matches_web_for_ascii ... ok
test citizen_label_matches_web ... ok
test population_formats_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.46s

     Running tests/p6_5b_manpower.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5b_manpower-0a099d61a31307ee)

running 13 tests
test empire_deduct_refund_and_spawn_mutate_like_web ... ok
test city_pool_functions_match_web ... ok
test besieged_location_sort_key_sync_and_civilian_match_web ... ok
test civ_bonus_multipliers_match_web ... ok
test game_default_params_equal_the_running_web_defaults ... ok
test opt_helpers_are_consistent ... ok
test empire_totals_match_web ... ok
test heal_cost_and_cap_match_web ... ok
test era_table_and_citizen_scalars_match_web ... ok
test raw_param_loaders_match_web ... ok
test pool_and_cost_scalars_match_web ... ok
test spawn_and_refund_functions_match_web ... ok
test regen_gain_matches_web_including_default_params ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.95s

     Running tests/p6_5b_replenish.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5b_replenish-11d5c4ac4b77306b)

running 1 test
test replenishment_matches_web_state_results_and_closure_protocol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.49s

     Running tests/p6_5b_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_5b_tables-4f918dda2f6680dd)

running 6 tests
test civilian_set_is_resolved_from_the_table ... ok
test era_table_rows_are_contiguous_and_cover_the_clamp_range ... ok
test tables_are_loaded_from_the_embedded_json_files ... ok
test tables_parse_and_have_the_expected_shape ... ok
test p65a_badge_closures_are_closed_by_the_real_path_badge_port ... ok
test table_constants_equal_the_running_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.29s

     Running tests/p6_6a_conquest.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6a_conquest-230020c5d317bb55)

running 6 tests
test clear_city_culture_mix_removes_both_fields ... ok
test revolt_multiplier_and_deprecated_penalties_match_web ... ok
test thresholds_match_web ... ok
test on_city_captured_culture_matches_web_with_injected_circle ... ok
test building_flags_match_web ... ok
test tick_city_culture_religion_matches_web_with_injected_conversions ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

     Running tests/p6_6a_founding.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6a_founding-99bc07a6ebb0028d)

running 10 tests
test costs_follow_injected_params ... ok
test cost_labels_match_web ... ok
test first_city_is_free_for_any_params ... ok
test evaluate_found_city_affordance_matches_web ... ok
test cost_constants_match_running_web ... ok
test is_subsequent_found_city_matches_web ... ok
test production_params_come_from_data_tables ... ok
test read_param_accepts_only_finite_numbers ... ok
test can_afford_found_city_matches_web ... ok
test pick_source_city_matches_web_including_rand_protocol ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.19s

     Running tests/p6_6a_hexclear.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6a_hexclear-98167207530960b3)

running 4 tests
test clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed ... ok
test apply_city_founding_to_hex_matches_web ... ok
test clear_hex_for_city_center_matches_web ... ok
test keep_set_and_predicate_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/p6_6a_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6a_tables-49f7fae6dbfdf022)

running 6 tests
test default_sight_comes_from_map_gen_params_when_positive ... ok
test founding_costs_are_present_in_miasto_params ... ok
test founding_table_is_well_formed ... ok
test hex_clear_table_is_well_formed ... ok
test visibility_table_is_well_formed ... ok
test conquest_table_is_well_formed ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_6a_visibility.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6a_visibility-0615129695460042)

running 11 tests
test add_explored_and_render_sets_match_web ... ok
test compute_player_visibility_matches_web ... ok
test city_sight_radius_reexport_matches_web ... ok
test compute_visible_along_path_matches_web ... ok
test compute_visible_at_matches_web ... ok
test default_sight_uses_the_data_value_only_when_positive ... ok
test compute_visible_fixed_sight_matches_web ... ok
test constants_match_running_web ... ok
test units_visible_on_map_matches_web ... ok
test key_listings_and_terrain_predicates_match_web ... ok
test unit_sight_resolver_and_compute_visible_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.02s

     Running tests/p6_6b_cities_ensure.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6b_cities_ensure-50bdd28ce75e4eaa)

running 3 tests
test ensure_city_save_defaults_is_idempotent_on_web_outputs ... ok
test ensure_city_save_defaults_matches_web ... ok
test ensure_city_podzial_defaults_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.81s

     Running tests/p6_6b_cities_found.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6b_cities_found-bf324e45fa4c28c4)

running 5 tests
test can_found_city_matches_web ... ok
test found_city_from_village_matches_web ... ok
test found_city_at_matches_web ... ok
test city_name_and_predicates_match_web ... ok
test found_city_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.97s

     Running tests/p6_6b_display.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6b_display-cf51bca517933bcf)

running 13 tests
test format_city_map_label_matches_web ... ok
test clear_city_state_flag_on_capture_matches_web ... ok
test format_entity_display_name_matches_web ... ok
test format_owner_diplo_label_matches_web ... ok
test is_cluster_city_state_slot_matches_web ... ok
test foreign_capital_map_name_matches_web ... ok
test is_technical_owner_label_matches_web ... ok
test labels_match_running_web ... ok
test is_owner_cluster_city_state_matches_web ... ok
test resolve_owner_base_name_matches_web ... ok
test should_force_culture_icon_matches_web ... ok
test sanitize_owner_display_base_matches_web ... ok
test strip_city_state_suffix_matches_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.74s

     Running tests/p6_6b_empire.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6b_empire-0403df939c625d79)

running 6 tests
test podzial_pracy_migration_matches_web ... ok
test podzial_pracy_functions_match_web ... ok
test budowa_profil_functions_match_web ... ok
test poziom_racji_functions_match_web ... ok
test okolica_focus_functions_match_web ... ok
test upgrade_budowa_profil_auto_defaults_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.87s

     Running tests/p6_6b_lists.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6b_lists-76264e548cdf3b61)

running 3 tests
test id_generator_and_loader_match_web_sequence ... ok
test dedupe_matches_web ... ok
test default_nazwa_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_6b_percent.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6b_percent-1f6b6df5d7367a50)

running 10 tests
test clamp_functions_match_web ... ok
test constants_match_running_web ... ok
test adjust_handel_split_matches_web ... ok
test budowa_priority_helpers_match_web ... ok
test normalize_podzial_handlu_matches_web ... ok
test resolve_praca_percent_from_raw_matches_web ... ok
test podzial_pracy_z_procentu_puli_matches_web ... ok
test resolve_effective_ulepszenia_matches_web ... ok
test snap_and_migrate_match_web ... ok
test ulepszenia_policy_and_caps_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.69s

     Running tests/p6_6b_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_6b_tables-30bc19375e8a4aab)

running 5 tests
test display_names_table_is_well_formed ... ok
test cities_defaults_are_consistent_with_each_other ... ok
test cities_table_is_well_formed ... ok
test min_city_distance_comes_from_miasto_params ... ok
test cities_foreign_inputs_agree_with_engine_data ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_7b_cost.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_7b_cost-80a1760ede4a646c)

running 11 tests
test building_stock_cost_matches_running_web ... ok
test constants_match_running_web ... ok
test deduct_does_not_mutate_inputs ... ok
test building_era_cost_multiplier_matches_running_web ... ok
test building_cost_pace_matches_running_web ... ok
test missing_can_afford_and_deduct_match_running_web ... ok
test stock_resource_label_matches_running_web ... ok
test prototype_key_lookups_are_a_documented_divergence ... ok
test scale_cost_by_epoch_matches_running_web ... ok
test epoch_cost_multiplier_matches_running_web ... ok
test unit_stock_cost_matches_running_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.82s

     Running tests/p6_7b_gate.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_7b_gate-63a70dd300e51d76)

running 11 tests
test constants_match_running_web ... ok
test has_deposit_runtime_gate_matches_running_web ... ok
test city_building_prereq_met_matches_running_web ... ok
test access_only_labels_match_running_web ... ok
test filter_runtime_active_built_ids_matches_running_web ... ok
test missing_runtime_labels_match_running_web ... ok
test owner_can_feed_mennica_matches_running_web ... ok
test label_satisfied_matches_running_web ... ok
test runtime_gate_matches_running_web ... ok
test resource_gate_matches_running_web ... ok
test required_active_labels_match_running_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.16s

     Running tests/p6_7b_nfd.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_7b_nfd-74baf59bb3d6c422)

running 2 tests
test nfd_strip_matches_running_web_for_random_sequences ... ok
test nfd_strip_matches_running_web_for_every_code_point ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 5.24s

     Running tests/p6_7b_pool.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_7b_pool-c661d6c651bf7c92)

running 7 tests
test explicit_utf16_tie_break_matches_running_web ... ok
test deduct_across_cities_matches_running_web ... ok
test credit_owner_resource_stock_matches_running_web ... ok
test assign_from_pool_matches_running_web ... ok
test refund_across_cities_matches_running_web ... ok
test owner_resource_stock_matches_running_web ... ok
test owner_resource_stock_all_matches_running_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.97s

     Running tests/p6_7b_spichlerz.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_7b_spichlerz-d9eb5fc77d5e3bbc)

running 7 tests
test city_has_spichlerz_matches_running_web ... ok
test bonus_state_matches_running_web ... ok
test bonuses_and_yields_match_running_web ... ok
test army_food_multiplier_matches_running_web ... ok
test constants_match_running_web ... ok
test pay_drain_matches_running_web ... ok
test inactive_status_matches_running_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.09s

     Running tests/p6_7b_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_7b_tables-9d36b155f7295696)

running 10 tests
test era_multiplier_matches_flattened_work_tables ... ok
test building_references_exist_in_buildings_json ... ok
test building_stock_cost_matches_flattened_p3_19_table ... ok
test pace_and_era_tables_have_valid_shape ... ok
test params_file_parses_and_has_no_unresolved_tokens ... ok
test spichlerz_and_unit_parameters_have_valid_shape ... ok
test storage_and_label_tables_are_consistent ... ok
test nfd_strip_table_has_valid_shape ... ok
test unit_stock_cost_matches_flattened_p3_19_table ... ok
test pace_matches_flattened_work_states_for_normal_mode ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/p6_m00_skeleton.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m00_skeleton-1864ffd75187226a)

running 5 tests
test domain_mod_declares_top_level_skeleton_modules ... ok
test doc_row_lists_expected_counts ... ok
test mapgen_mod_declares_exactly_doc_modules ... ok
test skeleton_headers_name_full_owner_ids_from_table ... ok
test files_exist_and_start_with_owner_doc_header ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m01_climate.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m01_climate-fc8a7dd62f5452ac)

running 7 tests
test desert_assignment_predicate_matches_web ... ok
test climate_band_default_arguments_and_ignored_q_match_web ... ok
test forest_threshold_matches_web_bit_for_bit ... ok
test polar_predicate_matches_web ... ok
test water_terrain_predicate_matches_web_for_every_terrain ... ok
test world_type_and_climate_band_serde_literals_match_web ... ok
test climate_band_sweep_matches_web_for_every_height_and_row ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s

     Running tests/p6_m01_earth_mask.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m01_earth_mask-1779c36a54b4d8e3)

running 10 tests
test derived_mask_file_is_the_single_source_of_mask_data ... ok
test hex_to_norm_edges_match_web ... ok
test mask_dimensions_and_bbox_match_web_bit_for_bit ... ok
test named_constants_match_web_exports ... ok
test bit_at_clamps_out_of_range_coordinates_like_web ... ok
test polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600 ... ok
test sample_template_land_matches_web_on_thousands_of_points ... ok
test sample_template_land_nan_is_sea ... ok
test all_288000_mask_bits_match_the_web_rows ... ok
test hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.59s

     Running tests/p6_m01_params_shape.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m01_params_shape-188a388bb5a09197)

running 9 tests
test climate_is_polar_outside_the_map ... ok
test ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound ... ok
test params_files_parse_and_have_the_expected_shape ... ok
test params_floats_are_parsed_exactly_from_the_raw_json_text ... ok
test subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps ... ok
test template_sampling_is_zero_outside_the_unit_square ... ok
test climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows ... ok
test mask_file_is_well_formed ... ok
test template_land_respects_border_and_polar_buffers_and_yields_binary_values ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s

     Running tests/p6_m01_prims.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m01_prims-963d8aed92ec098f)

running 14 tests
test hex_directions_match_web_in_every_implementation ... ok
test cos_lerp_matches_web_bit_for_bit ... ok
test hex_distance_matches_web_on_the_full_grid_in_every_implementation ... ok
test hex_key_matches_web_format ... ok
test js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range ... ok
test hex_distance_matches_web_for_large_coordinates ... ok
test fbm_matches_web_bit_for_bit_for_all_octave_counts ... ok
test all_three_mulberry32_implementations_match_web_for_every_seed_and_step ... ok
test js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values ... ok
test js_to_int32_follows_ecmascript_to_int32 ... ok
test mulberry32_state_is_the_seed_until_first_draw ... ok
test value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates ... ok
test perm_table_matches_web_for_all_256_entries ... ok
test vectors_come_from_the_pinned_web_run ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.10s

     Running tests/p6_m02_deposit_river.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m02_deposit_river-aa1b079e2438a847)

running 7 tests
test parse_helpers_cover_all_tokens ... ok
test ensure_meta_and_hidden_count_match_web ... ok
test metal_deposit_min_era_table_matches_web ... ok
test deposit_visibility_matches_web ... ok
test river_switch_matches_web ... ok
test river_switch_keys_match_names_the_web_queried ... ok
test river_switch_without_environment_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/p6_m02_float_parse.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m02_float_parse-bdfe4c125f45e686)

running 1 test
test table_floats_are_read_without_rounding_error ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_generator.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m02_generator-aad7149729b35309)

running 4 tests
test normalization_matches_web ... ok
test size_dims_and_order_match_web ... ok
test size_from_menu_label_and_label_to_dims_match_web ... ok
test menu_labels_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_new_game.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m02_new_game-fb7bd264e697cc8f)

running 11 tests
test constants_match_web ... ok
test density_to_label_round_trips_where_web_does ... ok
test clamp_miasta_panstwa_count_matches_web ... ok
test civ_menus_with_rosters_match_web ... ok
test land_fraction_functions_match_web ... ok
test map_size_label_from_dims_matches_web ... ok
test resolve_world_gen_numbers_matches_web ... ok
test tier_functions_match_web ... ok
test per_label_functions_match_web ... ok
test river_map_params_match_web_bitwise ... ok
test world_generation_presets_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.79s

     Running tests/p6_m02_quality.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m02_quality-07b289bbbb867c75)

running 4 tests
test per_label_functions_match_web ... ok
test constants_match_web ... ok
test web_quirk_ignores_z_with_dot ... ok
test tier_to_label_and_preset_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m02_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m02_tables-abfdd889c351ab6b)

running 7 tests
test every_section_names_its_web_source ... ok
test land_and_toggle_tables_are_consistent ... ok
test per_size_menus_cover_every_size ... ok
test river_rules_have_sane_ranges ... ok
test size_tables_are_consistent ... ok
test map_label_thresholds_are_ascending_and_known ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_centers.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m03_centers-e9e6c6c080ae746d)

running 15 tests
test default_shape_params_match_web_and_consume_six_draws ... ok
test continent_center_count_matches_web_for_all_world_types ... ok
test elliptical_mask_matches_web_inside_and_outside_the_map ... ok
test build_continent_centers_matches_web_including_rng_consumption ... ok
test five_zone_centers_match_web_including_rng_consumption ... ok
test island_grid_cell_index_matches_web_including_out_of_range_cells ... ok
test assign_island_grid_indices_keeps_web_map_insertion_order ... ok
test isotropic_helpers_match_web ... ok
test named_constants_match_web_exports ... ok
test pangea_land_t_matches_web_including_clamps_and_non_finite ... ok
test pangea_layout_params_match_web_for_every_field ... ok
test perm_tables_from_seed_match_web ... ok
test pangea_blob_centers_match_web_including_rng_consumption ... ok
test island_centers_match_web_including_rng_consumption ... ok
test voronoi_zone_index_and_second_distance_match_web_with_ties ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s

     Running tests/p6_m03_earth.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m03_earth-527455072c339731)

running 5 tests
test heights_polar_rows_and_land_rows_match_web_for_every_height ... ok
test constants_match_web ... ok
test subsample_grid_and_land_fraction_threshold_match_web_for_all_tier_edges ... ok
test bit_at_matches_web_including_clamped_out_of_range_coordinates ... ok
test widths_inner_width_matches_web_for_every_width ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_edges.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m03_edges-2ed31862d88dc14c)

running 3 tests
test exact_threshold_arguments_exist_in_the_vectors ... ok
test pangea_layout_matches_web_at_exact_threshold_neighbourhoods ... ok
test edge_rect_floor_matches_web_for_maps_wider_than_2000_hexes ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_jsmath.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m03_jsmath-2eef5b60b0adbce2)

running 9 tests
test max_min_follow_javascript_nan_and_signed_zero_rules ... ok
test pow_follows_ecmascript_special_cases ... ok
test atan2_matches_web_bit_for_bit ... ok
test sin_inside_domain_does_not_hit_the_fallback ... ok
test hypot_matches_web_bit_for_bit ... ok
test sin_matches_web_bit_for_bit ... ok
test pow_matches_web_bit_for_bit ... ok
test vectors_distinguish_v8_from_system_libm ... ok
test sin_beyond_reconstructed_domain_panics_in_debug_builds - should panic ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.35s

     Running tests/p6_m03_masks.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m03_masks-92f5032984be63fd)

running 5 tests
test border_dependencies_match_web ... ok
test pangea_blob_score_matches_web_on_fixed_centers ... ok
test masks_are_bounded_and_zero_in_the_hard_ocean_border ... ok
test land_masks_match_web_for_every_type_size_and_seed ... ok
test full_seed_pipeline_reproduces_the_web_land_masks ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 13.18s

     Running tests/p6_m03_strait.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m03_strait-37e3722b9d7677a3)

running 1 test
test strait_vectors_match_web_at_exact_threshold_and_one_ulp_around_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m03_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m03_tables-50e93f9f6b59c4b2)

running 6 tests
test every_table_float_is_parsed_exactly_from_the_raw_text ... ok
test table_has_no_unknown_or_missing_keys ... ok
test border_fade_clamp_is_unreachable_while_table_invariant_holds ... ok
test table_invariants_hold ... ok
test accessors_are_driven_by_the_table_not_by_literals ... ok
test table_parses_and_is_cached ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m04_border.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m04_border-6bff5e3eb79596bf)

running 12 tests
test border_consts_match_web ... ok
test border_grid_tools_match_web ... ok
test is_in_map_border_with_buffer_matches_web ... ok
test lat_buffer_matches_web ... ok
test margin_cap_matches_web ... ok
test margin_scatter_score_matches_web ... ok
test parse_hex_key_edge_keys_match_web ... ok
test parse_hex_key_matches_js_number_for_hexkey_strings ... ok
test set_hex_to_morze_and_laka_match_web ... ok
test fades_and_distances_match_web ... ok
test erosion_hook_matches_web ... ok
test apply_marginal_land_zone_caps_matches_web ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.16s

     Running tests/p6_m04_classify.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m04_classify-421508a5d4a5c685)

running 7 tests
test consts_match_web ... ok
test relief_elev_gates_match_web ... ok
test classify_terrain_flat_matches_web ... ok
test classify_terrain_matches_web ... ok
test hash_int3_matches_web ... ok
test rown_laka_jitter_matches_web ... ok
test terrain_cell_bias_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.06s

     Running tests/p6_m04_reapply.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m04_reapply-8accc2cf3c58125d)

running 4 tests
test reapply_forest_overlay_targeted_inland_cases_match_web ... ok
test forest_replay_hooks_reject_wrong_arguments ... ok
test reapply_land_terrain_matches_web ... ok
test reapply_forest_overlay_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.64s

     Running tests/p6_m04_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m04_tables-4d2b90ef46470e0e)

running 4 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test floats_are_parsed_exactly_from_the_raw_json_text ... ok
test table_parses_with_deny_unknown_fields ... ok
test values_have_sane_shape ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m09_rivals.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m09_rivals-3d2871a7b9753cde)

running 19 tests
test foreign_buffer_gate_matches_web ... ok
test constants_match_web_and_aliases_are_not_separate_numbers ... ok
test half_plane_axis_matches_web_bitwise ... ok
test group_foreign_type_clusters_matches_web ... ok
test cluster_pack_radius_matches_web ... ok
test is_in_half_plane_matches_web ... ok
test hexes_at_distance_matches_web ... ok
test land_pool_near_core_matches_web ... ok
test map_helpers_match_web ... ok
test nearest_legal_land_matches_web ... ok
test hub_chain_matches_web ... ok
test hub_chain_result_does_not_depend_on_seed_as_in_web ... ok
test rival_slots_degenerate_inputs_do_not_panic ... ok
test pack_rival_cities_matches_web ... ok
test shuffle_in_place_matches_web ... ok
test vectors_identify_the_same_maps_as_p6_1c ... ok
test pack_around_capital_matches_web ... ok
test rival_slots_match_web_on_real_maps ... ok
test rival_candidate_hexes_match_web_on_real_maps ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 14.25s

     Running tests/p6_m09_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m09_tables-0380ed37b51ae447)

running 3 tests
test table_parses_with_deny_unknown_fields ... ok
test every_value_has_web_source_and_sane_shape ... ok
test start_city_state_distance_is_not_the_cities_ts_constant ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m10_masses.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m10_masses-1406512a25778485)

running 16 tests
test alias_constants_are_not_separate_numbers ... ok
test constants_match_web ... ok
test local_land_fraction_and_gate_match_web ... ok
test map_size_label_matches_web_and_params_table ... ok
test mass_qualifies_and_indices_match_web ... ok
test player_mass_gate_over_whole_maps_matches_web ... ok
test allocate_typy_to_masses_matches_web ... ok
test reorder_roster_by_preference_matches_web ... ok
test roster_for_start_epoch_matches_web ... ok
test spawn_habitable_terrain_matches_web ... ok
test thresholds_and_caps_match_web ... ok
test types_have_web_shape ... ok
test vectors_identify_the_maps_used ... ok
test group_habitable_masses_and_cache_match_web ... ok
test region_mass_dominance_matches_web ... ok
test development_space_and_mass_gates_match_web ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 9.87s

     Running tests/p6_m10_placement.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m10_placement-0ff78516c0b93780)

running 14 tests
test hooks_match_web ... ok
test pick_center_in_mass_matches_web ... ok
test balance_and_enforce_match_web ... ok
test pick_best_local_land_spawn_matches_web ... ok
test pick_center_in_mass_spread_matches_web ... ok
test pick_tied_spawn_land_candidate_matches_web ... ok
test pick_center_on_land_pool_spread_matches_web ... ok
test pick_center_in_mass_with_land_gate_matches_web ... ok
test sort_spawn_candidates_with_spread_bias_matches_web ... ok
test sort_spawn_land_candidates_matches_web ... ok
test voronoi_and_centroid_match_web ... ok
test player_start_candidates_match_web ... ok
test pick_player_cluster_center_matches_web ... ok
test place_cluster_centers_across_landmasses_matches_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 14.99s

     Running tests/p6_m10_start_scoring.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m10_start_scoring-a1f4519e6663b8a9)

running 4 tests
test reveal_radius_matches_web ... ok
test score_city_start_hex_over_whole_maps_matches_web ... ok
test score_city_start_hex_matches_web ... ok
test find_best_player_start_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.01s

     Running tests/p6_m10_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m10_tables-07a2652eafb05f75)

running 3 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test values_have_sane_shape ... ok
test tables_parse_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m10_v8sort.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m10_v8sort-d4cb86648b856051)

running 2 tests
test js_array_sort_is_stable_for_equal_keys ... ok
test js_array_sort_matches_v8_including_comparator_call_counts ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.39s

     Running tests/p6_m11_gates.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m11_gates-70911875d6c88b8e)

running 11 tests
test for_map_matches_web ... ok
test by_label_matches_web ... ok
test hub_reach_and_body_buffer_match_web ... ok
test capital_separation_gate_and_distance_match_web ... ok
test band_penalty_matches_web ... ok
test preferred_quadrants_match_web ... ok
test quadrant_helpers_match_web ... ok
test rescue_ladder_matches_web ... ok
test hooks_impl_matches_web ... ok
test sea_gates_match_web ... ok
test pick_spawn_hex_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.39s

     Running tests/p6_m11_integration.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m11_integration-9de8c89dfd74ed60)

running 4 tests
test m11_hooks_match_m10_web_hook_vectors ... ok
test m11_hooks_reproduce_m10_candidate_sorting ... ok
test m11_and_m10_vector_maps_are_identical ... ok
test m11_hooks_reproduce_m10_center_placement ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.27s

     Running tests/p6_m11_layout.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m11_layout-cc4df252415db121)

running 10 tests
test centroid_and_far_enough_match_web ... ok
test capital_pos_matches_web ... ok
test assign_types_matches_web ... ok
test build_cluster_cities_matches_web ... ok
test cities_with_land_gate_match_web ... ok
test poisson_pick_cities_matches_web ... ok
test pick_capital_hex_in_region_matches_web ... ok
test layout_with_edge_capital_matches_web ... ok
test simple_fallback_matches_web ... ok
test enforce_local_land_dominance_matches_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 7.79s

     Running tests/p6_m11_repair.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m11_repair-2ea5f9383c7a3744)

running 7 tests
test cluster_helpers_match_web ... ok
test fixtures_have_web_shape_and_variety ... ok
test quarter_spread_matches_web ... ok
test repack_one_matches_web ... ok
test hard_capital_separation_matches_web ... ok
test body_separation_matches_web ... ok
test repack_all_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 13.47s

     Running tests/p6_m11_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m11_tables-c893deff57812197)

running 4 tests
test derived_constants_are_aliases_of_table_fields ... ok
test every_value_has_a_web_source_with_file_and_line ... ok
test table_parses_with_deny_unknown_fields ... ok
test values_have_sane_shape ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m14_range.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m14_range-11a976a1d8c0add9)

running 3 tests
test territory_keys_by_owner_match_web ... ok
test culture_range_matches_web ... ok
test religion_range_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p6_m14_territory.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m14_territory-ba89cbcff9a8795a)

running 8 tests
test city_sight_radius_matches_web ... ok
test city_territory_radius_matches_web ... ok
test axial_distance_matches_web_and_integer_variant ... ok
test owner_tie_goes_to_first_node ... ok
test city_range_for_population_matches_web ... ok
test is_in_territory_matches_web ... ok
test territory_owner_at_matches_web ... ok
test is_player_territory_hex_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.26s

     Running tests/p6_m14_wonder.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m14_wonder-96491650d658ea23)

running 4 tests
test pick_matches_web ... ok
test shape_candidates_are_sorted_land_and_exclude_center ... ok
test list_for_city_matches_web ... ok
test list_for_owner_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.01s

     Running tests/p6_m14_work.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m14_work-1ce45b3a771ecceb)

running 8 tests
test city_center_keys_match_web ... ok
test build_territory_nodes_matches_web ... ok
test reconcile_all_matches_web ... ok
test is_territory_hex_owned_by_matches_web ... ok
test reconcile_for_owner_matches_web ... ok
test reczne_key_legal_matches_web ... ok
test workable_filter_matches_web ... ok
test reconcile_without_reczne_is_noop ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.13s

     Running tests/p6_m15_roads.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m15_roads-00c1796d2d44aacd)

running 8 tests
test constants_match_web ... ok
test has_road_matches_web ... ok
test is_road_key_matches_web ... ok
test collect_road_keys_matches_web_order ... ok
test road_table_shape_and_key_names ... ok
test roads_source_has_no_numeric_data_literals ... ok
test p64_ruch_modifier_agrees_with_roads_module ... ok
test apply_modifier_matches_web_bitwise ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.64s

     Running tests/p6_m16_divergence.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m16_divergence-36f41f9340105fdf)

running 1 test
test web_allows_farm_irrigation_terraces_on_deposit_hexes ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.99s

     Running tests/p6_m16_doc.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m16_doc-a783ecb95132fc08)

running 1 test
test document_has_a_status_row_for_every_web_symbol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m16_gallery.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m16_gallery-40cbda6184b177cf)

running 2 tests
test gallery_combo_eligible_and_show_model_match_web ... ok
test gallery_terrain_eligible_matches_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.18s

     Running tests/p6_m16_qualifier.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m16_qualifier-54c27efc7f24500a)

running 4 tests
test forest_build_block_reason_matches_web ... ok
test api_hex_click_and_on_select_match_web ... ok
test api_qualifying_hexes_and_work_cost_match_web ... ok
test qualifier_bits_match_web_for_every_key_and_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 13.66s

     Running tests/p6_m16_rules.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m16_rules-33e7267e34428bc9)

running 15 tests
test farm_and_owce_base_terrain_match_web ... ok
test can_add_food_layer_matches_web ... ok
test forest_blocking_and_hints_match_web ... ok
test deposit_rules_match_web ... ok
test format_impact_list_matches_web ... ok
test hex_keys_within_radius_matches_web ... ok
test livestock_dependency_matches_web ... ok
test improvement_meta_and_tech_gate_match_web ... ok
test legacy_farm_layer_and_strip_match_web ... ok
test mine_keys_tarasy_civ_and_food_keys_match_web ... ok
test plan_and_remove_legacy_farms_match_web ... ok
test replaced_by_build_and_impact_match_web ... ok
test hex_has_road_matches_web ... ok
test strip_improvements_when_forest_removed_matches_web ... ok
test work_cost_scale_matches_web ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 6.36s

     Running tests/p6_m16_tables.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m16_tables-fd1582fd8a835964)

running 5 tests
test food_and_sector_tables_are_consistent ... ok
test livestock_and_tech_tables_are_consistent ... ok
test rule_keys_are_known_improvements ... ok
test improvement_build_has_no_balance_number_literals ... ok
test terrain_codes_in_tables_are_valid ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m17_rebuild.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m17_rebuild-60f4b8705aae281a)

running 5 tests
test js_keyed_map_orders_array_index_keys_first ... ok
test rebuild_error_class_matches_web_failure_class ... ok
test rebuild_errors_name_the_failing_field ... ok
test serialize_rebuild_serialize_is_stable_without_duplicate_coords ... ok
test rebuild_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s

     Running tests/p6_m17_serialize.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m17_serialize-bc527bf55aa676f5)

running 5 tests
test js_num_writes_integers_without_fraction_and_non_finite_as_null ... ok
test serialize_vectors_touch_every_branch ... ok
test serialize_matches_web_structurally ... ok
test serialize_text_is_byte_identical_to_web_json_stringify ... ok
test snapshot_shape_invariants_hold_for_every_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.34s

     Running tests/p6_m17_validate.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/p6_m17_validate-f52da1b0e7422d55)

running 2 tests
test is_valid_matches_web_for_all_vectors ... ok
test every_serialize_vector_snapshot_has_a_web_validity_vector ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test public_engine_wire_aliases_are_stable ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.77s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test playback_cursor_observes_peek_remaining_and_reset ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test multiple_layers_stack_additively_per_resource ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test copied_state_and_forks_reproduce_independent_streams ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/road_movement_multipliers.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/road_movement_multipliers-10cca6a7ed28e576)

running 3 tests
test road_divisors_are_integers_read_from_the_table ... ok
test road_movement_table_covers_each_constant_once ... ok
test road_floor_row_is_readable_and_positive ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test city_rejects_empty_names_and_zero_population ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test state_rejects_unknown_unit_reference ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/structure_defense_max.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/structure_defense_max-97cd066d284c179b)

running 3 tests
test combined_structures_equal_the_strongest_single_structure ... ok
test no_structure_gives_neutral_multiplier ... ok
test structures_are_ignored_outside_siege ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test land_route_bfs_crosses_desert_field ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test diff_and_serialization_preserve_route_contract ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_credits_income_before_paying_expenses ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok
test pure_preview_does_not_mutate_input_balances ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_ad6f5f21-f40-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 6 tests
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test p6_1_civ_entry_api_is_exercised ... ok
test scout_is_available_in_every_epoch ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test current_and_previous_epochs_are_available ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 11.4 `git diff --cached --check` (indeks po jawnym `git add` plikow tematu; `gate-diffcheck-r1.log`)

```text
EXIT=0
```

### 11.5 Weryfikator Python (`verify-p67b-r1.log`)

```text
sprawdzen=335375 rozbieznosci=0 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
```

### 11.6 Test negatywny weryfikatora (`dowody/verify-negative-r1.txt`)

```text
WYKRYTO  tempo: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
WYKRYTO  mnoznik epoki: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
WYKRYTO  koszt jednostki: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
WYKRYTO  nfd: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
WYKRYTO  pula: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
WYKRYTO  etykiety bramki: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
WYKRYTO  prerekwizyt: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
WYKRYTO  spichlerz drain: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
WYKRYTO  status nieaktywny: exit=1 sprawdzen=335375 rozbieznosci=1 nfd_punktow=282230 nfd_nieprzypisane_w_unicode14=829834
```

### 11.7 Literaly w nowych modulach (`dowody/grep-literals-r1.txt`)

```text
# Literaly liczbowe i napisowe w modulach P6.7B (building_costs.rs::p6_7b, derived.rs); komentarze pominiete
# Klasyfikacja: STRUKTURALNY = elementy neutralne/semantyka JS (0.0, 1.0, indeksy, nazwy pol JSON jako identyfikatory,
# komunikaty expect, formaty szablonow), nie dane ani mnozniki balansu.
# Dane: data/derived/building-cost-params.json; dane Unicode: data/derived/nfd-strip-table.json.
## src/domain/building_costs.rs od linii 307
331: nums=['1'] strs=[] | for i in 1..items.len() {
333: nums=['0', '1'] strs=[] | while j > 0 && cmp(&items[j - 1], &items[j]) == Ordering::Greater {
334: nums=['1'] strs=[] | items.swap(j - 1, j);
335: nums=['1'] strs=[] | j -= 1;
344: nums=['0.0'] strs=[] | } else if diff < 0.0 {
346: nums=['0.0'] strs=[] | } else if diff > 0.0 {
355: nums=['0.0'] strs=[] | v.is_finite() && v > 0.0
380: nums=['0'] strs=[] | if t_index != 0 {
397: nums=['0'] strs=[] | let mut i = 0;
401: nums=['1'] strs=[] | i += 1;
406: nums=['1'] strs=[] | i += 1;
446: nums=['1.0'] strs=[] | 1.0,
502: nums=['0.0'] strs=[] | if !cost.is_finite() || cost < 0.0 {
503: nums=['0.0'] strs=[] | return 0.0;
505: nums=['0.0'] strs=[] | if cost == 0.0 {
506: nums=['0.0'] strs=[] | return 0.0;
508: nums=['1.0'] strs=[] | js_max(1.0, js_math_round(cost * epoch_cost_multiplier(epoch)))
530: nums=['1.0'] strs=[] | out.insert(key.clone(), js_max(1.0, js_math_round(v * fala2)));
548: nums=['1.0'] strs=[] | if era_multiplier == 1.0 {
553: nums=['1.0'] strs=[] | .map(|(key, amount)| (key, js_max(1.0, js_math_round(amount * era_multiplier))))
567: nums=['0.0'] strs=[] | .unwrap_or(0.0);
569: nums=['0.0'] strs=[] | if brak > 0.0 {
585: nums=['0.0'] strs=[] | .unwrap_or(0.0);
600: nums=['0.0'] strs=[] | let have = next.get(key).copied().unwrap_or(0.0);
601: nums=['0.0'] strs=[] | next.insert(key.clone(), js_max(0.0, have - need));
689: nums=['0.0'] strs=[] | .unwrap_or(0.0)
707: nums=['0.0'] strs=[] | let current = pool.get(key).copied().unwrap_or(0.0);
717: nums=['0.0'] strs=[] | let mut total = 0.0;
749: nums=['0.0'] strs=[] | if need.is_nan() || need <= 0.0 {
752: nums=['0'] strs=[] | let mut holders: Vec<usize> = (0..cities.len())
753: nums=['0.0'] strs=[] | .filter(|&i| cities[i].owner_id() == owner_id && city_stock(&cities[i], key) > 0.0)
760: nums=['0.0'] strs=[] | if need <= 0.0 {
783: nums=['0.0'] strs=[] | if !amount.is_finite() || amount <= 0.0 {
784: nums=['0.0'] strs=[] | return 0.0;
786: nums=['0'] strs=[] | let mut owner_cities: Vec<usize> = (0..cities.len())
790: nums=['0.0'] strs=[] | return 0.0;
796: nums=['0.0'] strs=[] | to_add = js_max(0.0, js_min(to_add, cap - current));
798: nums=['0.0'] strs=[] | if to_add <= 0.0 {
799: nums=['0.0'] strs=[] | return 0.0;
806: nums=['0'] strs=[] | let target = owner_cities[0];
810: nums=['0.0'] strs=[] | let current = surowce.get(key).copied().unwrap_or(0.0);
872: nums=[] strs=[''] | if js_trim(unit.typ.as_deref().unwrap_or("")) != params.typ_jezdny {
875: nums=[] strs=[''] | js_trim(unit.jednostka.as_deref().unwrap_or("")) != params.wyjatek_kon_jednostka
885: nums=[] strs=[''] | let raw_name = js_trim(unit.surowiec.as_deref().unwrap_or(""));
895: nums=['0.0'] strs=[] | let current = out.get(&params.kon_klucz).copied().unwrap_or(0.0);
917: nums=['0.0'] strs=[] | .unwrap_or(0.0)
1043: nums=['0.0', '0.0'] strs=[] | if stock.get(ascii_key).copied().unwrap_or(0.0) > 0.0 {
1078: nums=[] strs=[''] | let key = js_trim(building.wymagany_surowiec.as_deref().unwrap_or("")).to_lowercase();
1191: nums=['1.0'] strs=[] | epoka_wejscia: Some(1.0),
1370: nums=['0.0'] strs=[] | 0.0
1382: nums=['0.0'] strs=[] | 0.0
1394: nums=['1.0'] strs=[] | 1.0
1407: nums=['0.0'] strs=[] | 0.0
1446: nums=['1.0'] strs=[] | let mut m = 1.0;
1475: nums=[] strs=['{}{}'] | "{}{}",
1551: nums=['1.0'] strs=[] | epoka_wejscia: Some(1.0),
## src/data/derived.rs od linii 3825
3830: nums=[] strs=['../../data/derived/building-cost-params.json'] | include_str!("../../data/derived/building-cost-params.json");
3833: nums=[] strs=['{zloto_label}'] | pub const BUILDING_COST_ZLOTO_TOKEN: &str = "{zloto_label}";
4009: nums=[] strs=['building-cost-params.json must parse'] | let mut file = parse_building_cost_params().expect("building-cost-params.json must parse");
4026: nums=[] strs=['../../data/derived/nfd-strip-table.json'] | pub const NFD_STRIP_TABLE_JSON: &str = include_str!("../../data/derived/nfd-strip-table.json");
4076: nums=[] strs=['nfd-strip-table.json must parse'] | let file = parse_nfd_strip_table().expect("nfd-strip-table.json must parse");
# linii z literalami: 61
```

## 12. Jak odtworzyc

```bash
# web: git archive edb8fb56 gra/src gra/data -> wlasny mktemp -d poza repo (WEB_ROOT)
cd dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1
# tabela Unicode do klucza stripDiacriticsLower
node gen-p67b-nfd-table.mjs ../../../../rust-port/engine/data/derived/nfd-strip-table.json
# wektory
node --experimental-transform-types --no-warnings --import ./p67b-loader-register.mjs \
  ./gen-p67b-vectors.mjs $WEB_ROOT ../../../../rust-port/engine/tests/p6_7b_vectors
# weryfikator niezalezny i test negatywny
python3 -I verify-p67b-vectors.py $WEB_ROOT ../../../../rust-port/engine/tests/p6_7b_vectors
python3 -I verify-negative-p67b.py $WEB_ROOT ../../../../rust-port/engine/tests/p6_7b_vectors $SCRATCH
# bramki (z rust-port/engine; CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=<wlasny> CARGO_PROFILE_DEV_DEBUG=0)
cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
# mutacje (MUT_CHECK=1 tylko sprawdza fragmenty; MUT_SKIP/MUT_END dziela zakres)
python3 -I ../../dyspozycje/autobot/runs/R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1/mutate-p67b.py
# tabela symboli i literaly
python3 -I gen-symbols-p67b.py $WEB_ROOT ../../../../rust-port/engine > symbols-p67b-r1.tsv
python3 -I grep-literals-p67b.py ../../../../rust-port/engine > dowody/grep-literals-r1.txt
```
