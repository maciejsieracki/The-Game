# P6.M02 - Parametry nowej gry generatora mapy (R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1)

**Status:** runda 1/5, rola Operator. **DOMAIN:** GAME. **Pin web:** `edb8fb56`. **Baza Rust:** `origin/rust-port/parity-v2` @ `1570419b` (baseline 595 testow; po zmianie 624 = 595 + 29 nowych).
**Artefakty biegu:** `dyspozycje/autobot/runs/R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1/` (generator wektorow `gen-m02-vectors.mjs` + loader `m02-loader-*.mjs`, niezalezny weryfikator `verify-m02-vectors.py`, skazenie wektorow `tamper-vectors.py`, logi bramek `gate-*-r1.log`, `verify-m02-r1.log`, `mutation-evidence-r1.txt`, `grep-literals-r1.txt`, `gen-m02-r1.log`, `gen-m02-regen-cmp.log`).
**Zakres web (pin, PELNE odczytane pliki):** `deposit-era.ts` 46 linii (1-46), `riverGenSwitch.ts` 83 (1-83), `newGameMapDefaults.ts` 743 (1-743), `generator.ts` 848 linii (odczytane 755-848: zakresy 762-818 i 844 + naglowek sekcji; reszta pliku = M01/M18, nie w zakresie). Zaleznosci przeczytane: `data/map-gen-params-loader.ts` 246, `data/e-start-params-loader.ts` 170, `util/norm-pl-label.ts` 10, `game/civ-entry-epoch.ts` (linie 1-60 z 88; funkcje juz zportowane w P6.1), `gen-helpers.ts:3253-3262` (`defaultLandFractionForTyp`).

## 0. ZALOZENIA (luki rozstrzygniete bez pytan do wlasciciela)

1. **Czyste funkcje, brak DOM.** `riverGenSwitch.ts` czyta `location.search` i `localStorage`. Port nie dotyka srodowiska: `RiverGenSwitch::get_enabled(url_param, storage_value)` / `get_phase(...)` dostaja juz wyluskane lancuchy (`new URLSearchParams(location.search).get(...)`, `localStorage.getItem(...)`), a kolejnosc pierwszenstwa (nadpisanie > URL > magazyn > domyslne) jest 1:1. Klucze `RIVER_GEN_STORAGE_KEY`/`RIVER_GEN_PHASE_STORAGE_KEY` i nazwy parametrow URL = warstwa powloki (NIE-DOTYCZY); wektor z weba potwierdza, ze URL/magazyn byly uzyte (`river-switch.json`, 2 028 przypadkow z prawdziwego `getRiverGen*` z podstawionymi `location`/`localStorage`).
2. **Stan modulowy -> jawna struktura.** `_override`/`_phaseOverride` to `RiverGenSwitch { enabled_override, phase_override }` z setterami (`set_enabled_override`, `set_phase_override`).
3. **Stale balansowe/tekstowe z KODU weba -> `data/derived/mapgen-nowa-gra.json`** (parser i struktury `deny_unknown_fields` na koncu `src/data/derived.rs`, dopisek addytywny). Tabele Panel-A i Panel-E zostaja tam, gdzie sa (`data/map-gen-params.json` -> `data/terrain_map.rs`, `data/e-start-params.json` -> `data/economy_society_part2.rs`; DANE-JUZ-W-RUST). Kod `params.rs` nie ma literalow balansowych (`grep-literals-r1.txt`: zostaja tylko indeksy `[0]..[5]`, porownania `> 0`/`>= 0`, `+/- 1` strukturalne w `tripleFromDefault` i dolny indeks menu `unwrap_or(1)`).
4. **Adaptery zaleznosci (nie sa tematem M02, ale port jest bez nich niewykonywalny):** `e_start_rywale_ai`, `e_start_miasta_panstwa`, `e_start_typy_cywilizacji`, `e_start_typy_per_epoka`, `norm_start_epoch_id` (z `data/e-start-params-loader.ts`) oraz dostep do `map-gen-params.json` (`map_gen_default_rywale`, mnozniki/progi). Dopasowanie wiersza Panel-E (`skalaRow`) = `normPlMenuLabel(klucz) == normPlMenuLabel(etykieta)` na szesciu kluczach z `rozmiary.etykiety_menu` (te same, w tej samej kolejnosci, co klucze `skala_mapy`).
5. **`defaultLandFractionForTyp` (gen-helpers.ts:3254, zakres M01).** Potrzebne do `defaultLandFractionPercentForTyp` i `resolveLandFraction`. Dane (0.60/0.30/0.50/0.21) sa w `mapgen-nowa-gra.json` (`typ_swiata.udzial_ladu`), funkcja `default_land_fraction_for_typ` w `params.rs`. **Do uzgodnienia przez orkiestratora z M01:** jesli M01 portuje te funkcje, `params.rs` powinien ja importowac i usunac kopie (kopia jest zabezpieczona wektorami z weba przez `resolve_land_fraction`/`default_land_fraction_percent_for_typ`).
6. **Fallbacki `map-gen-params-loader.ts` (FALLBACK_*)** nie sa portowane: dane JSON sa kompletne, a parser typowany (`deny_unknown_fields`, pola wymagane) zamienia brak klucza w blad parsowania zamiast cichego fallbacku. Gałąź nieosiagalna przy poprawnych danych (NIE-DOTYCZY, uzasadnienie w sekcji 1.3).
7. **Typ swiata** = istniejacy `domain::map_generator::WorldType` (nie tworze nowego). Rozmiar = nowy `RozmiarSwiata`, etykieta mapy = `MapSizeLabel` (web ma dwa rozne typy).
8. **`Math.round` weba** = `improvements::js_round` (`pub(crate)`, istniejacy, polowki w strone +inf); reszta arytmetyki f64 identyczna jak w JS, wyniki porownane BITOWO (floaty w wektorach jako 16 cyfr hex IEEE-754, bo `serde_json` bez `float_roundtrip` czyta niecalkowite f64 z bledem 1 ulp - lekcja P6.4). Tabela JSON ma wlasny test, ze jej liczby czytane sa bez bledu (`p6_m02_float_parse`).
9. **Warunek `epochId` falsy** (`clampTypyTripleToEpoch`: `!epochId`) odwzorowany: pusty lancuch = brak przycinania. Pozostale `undefined`/domyslne argumenty weba = `Option` w Rust; `None` -> epoka domyslna z tabeli (`kamien`, a dla `aktywneTypyFromMapLabel` `zelazo`).

## 1. Zakres i wynik binarny

Statusy: **PORT** = port 1:1 + test + wektor z uruchomionego weba, 0 rozbieznosci (Python niezalezny: 20 070 sprawdzen, 0 rozbieznosci); **DANE** = DANE-JUZ-W-RUST (z dowodem); **N/D** = NIE-DOTYCZY; **R2** = RUNDA-2 (brak pozycji).

### 1.1 `deposit-era.ts` (46 linii)

| Symbol (web) | Status | Rust | Test / dowod |
|---|---|---|---|
| `DepositEraHex` (typ) | PORT | `DepositEraHex { zloze, zloze_min_era }` (`zloze == ''` traktowane jak brak, jak `!hex.zloze`) | `p6_m02_deposit_river::deposit_visibility_matches_web` |
| `METAL_DEPOSIT_MIN_ERA` | DANE + PORT dostepu | dane: `map-gen-params.json metal_deposit_min_era` (`terrain_map.rs:393`), dostep `metal_deposit_min_era(klucz)` | `metal_deposit_min_era_table_matches_web` (4 klucze z uruchomionego weba) |
| `zlozeMinEraFor` | PORT | `zloze_min_era_for` | `deposit_visibility_matches_web` (153 hexy x 8 er) |
| `isDepositVisible` | PORT | `is_deposit_visible` (regula "wegiel nigdy" z tabeli `zloza_epoka.nigdy_widoczne`) | j.w. |
| `visibleZloze` | PORT | `visible_zloze` | j.w. |
| `ensureDepositEraMeta` | PORT | `ensure_deposit_era_meta(&mut BTreeMap<..>)` | `ensure_meta_and_hidden_count_match_web` |
| `countHiddenMetalDeposits` | PORT | `count_hidden_metal_deposits` | j.w. (8 er x przed/po) |

### 1.2 `generator.ts:762-818`, `:844`

| Symbol (web) | Status | Rust | Test / dowod |
|---|---|---|---|
| `RozmiarSwiata` (775) | PORT | `RozmiarSwiata` (+ `key`/`from_key`) | `p6_m02_generator::size_dims_and_order_match_web` |
| `ROZMIAR_DIMS` (778) | DANE + PORT dostepu | dane `map-gen-params.json generator.rozmiar_dims` (`terrain_map.rs:361`), `rozmiar_dims(rozmiar)` | `size_dims_and_order_match_web` (6 rozmiarow z uruchomionego weba; wczesniej pinowany tylko `standardowy`) |
| `ROZMIAR_MENU_LABELS` (781) | PORT (dane w tabeli) | `rozmiar_menu_labels()` <- `rozmiary.etykiety_menu` (uzywane tez do dopasowania wiersza Panel-E) | `menu_labels_match_web` |
| `normMenuLabel` (prywatna) | PORT | `norm_pl_menu_label` | `normalization_matches_web` (wektory dla 68 etykiet) |
| `rozmiarFromMenuLabel` (798) | PORT | `rozmiar_from_menu_label` (reguly w kolejnosci z tabeli `rozmiary.rozpoznawanie`) | `size_from_menu_label_and_label_to_dims_match_web` |
| `rozmiarToDims` (809) | PORT | `rozmiar_to_dims` | `size_dims_and_order_match_web` |
| `menuLabelToDims` (815) | PORT | `menu_label_to_dims` | `size_from_menu_label_and_label_to_dims_match_web` |
| `RozmiarSwiataType` (844, re-eksport aliasu typu) | N/D | ten sam typ `RozmiarSwiata` | alias typu, brak zachowania |

### 1.3 `newGameMapDefaults.ts` (743 linie)

| Symbol (web) | Status | Rust | Test / dowod |
|---|---|---|---|
| `MapSizeLabel` | PORT | `MapSizeLabel` | `p6_m02_new_game::map_size_label_from_dims_matches_web` |
| `TYP_SWIATA_MENU_LABELS` | N/D (UI) | etykiety zostaja w tabeli (`typ_swiata.etykiety_menu`) dla powloki | - |
| `TYP_SWIATA_TO_ENGINE`, `normLabel` (prywatne) | PORT | tabela `typ_swiata.z_etykiety`, `norm_pl_menu_label` | `per_label_functions_match_web` (`typSwiataFromMenuLabel`) |
| `mapSizeLabelFromDims` | PORT | `map_size_label_from_dims` (progi pola z tabeli) | `map_size_label_from_dims_matches_web` (216 wymiarow, w tym granice 4799/4800/.../100001) |
| `mapSizeLabelFromMenuLabel` | PORT | `map_size_label_from_menu_label` | `per_label_functions_match_web` |
| `aktywneTypyFromMapLabel` | PORT | `aktywne_typy_from_map_label(label, epoch: Option)` | `per_label_functions_match_web` (16 epok x 68 etykiet) |
| `defaultRywaleFromMapLabel` | PORT | `default_rywale_from_map_label` | j.w. |
| `RywaleMenuBundle` | PORT | `MenuBundle` | j.w. |
| `rywaleMenuForMapLabel` | PORT | `rywale_menu_for_map_label` | j.w. |
| `typSwiataFromMenuLabel` | PORT | `typ_swiata_from_menu_label -> WorldType` | j.w. |
| `DEFAULT_PLAYER_CIV_ID`, `DEFAULT_START_EPOCH_ID` | DANE + PORT dostepu | `e-start-params.json defaulty`; `default_player_civ_id()`, `default_start_epoch_id()` | `constants_match_web` |
| `QualityTier`, `QUALITY_MENU_LABELS`, `DEFAULT_RENDER_QUALITY`, `DEFAULT_MAP_DETAIL_QUALITY`, `qualityTierFromLabel`, `qualityTierToLabel`, `BundledMapQualityPreset`, `bundledMapQualityPreset`, `bundledMapQualityFromLabel`, `isLargeMapMenuLabel` | N/D (UI) | jakosc renderu/podpowiedz FPS; nie wplywa na stan gry. Wspolna `normQualityLabel` jest portowana (`norm_quality_label`), bo uzywa jej `densityTierFromLabel` | `normalization_matches_web` (quality) |
| `DensityTier` | PORT | `DensityTier` | `per_label_functions_match_web` |
| `DENSITY_MENU_LABELS` | N/D (UI) | etykiety w tabeli (`gestosc.etykiety_menu`) uzywane przez `density_tier_to_label` | `constants_match_web` |
| `densityTierFromLabel` | PORT | `density_tier_from_label` | `per_label_functions_match_web` |
| `densityTierToLabel` | PORT | `density_tier_to_label` | `constants_match_web` |
| `WorldGenerationPreset` | PORT | `WorldGenerationPreset` | `world_generation_presets_match_web` |
| `DEFAULT_WORLD_DENSITY` | PORT | `default_world_density` (tabela `gestosc.domyslny_preset`) | `constants_match_web` |
| `worldGenerationPresetFromLabels` | PORT | `world_generation_preset_from_labels` (relief: `relief \|\| rivers \|\| 'Normalnie'`) | `world_generation_presets_match_web` (9 presetow) |
| `densityMultiplier` | PORT (dane Panel-A) | `density_multiplier` | `tier_functions_match_web` (bity) |
| `maxRiversFromDensity` | PORT (dane Panel-A) | `max_rivers_from_density` | j.w. |
| `RIVER_SCALE_BY_SIZE` (prywatna) | PORT | `river_scale_by_size` (dane `river_scale`) | `per_label_functions_match_web` (`maxRiversForMapAndDensity`) |
| `maxRiversForMapAndDensity` (`@deprecated`, uzywana przez `resolveWorldGenNumbers`) | PORT | `max_rivers_for_map_and_density` | `per_label_functions_match_web`, `resolve_world_gen_numbers_matches_web` |
| `riverMinPathLengthForTier` | PORT | `river_min_path_length_for_tier` (tabela `rzeki.min_dlugosc_tier`) | `tier_functions_match_web` |
| `riverGridCellSizeForTier` | PORT | `river_grid_cell_size_for_tier` | j.w. |
| `riverGridTraceMinLen` | PORT | `river_grid_trace_min_len(catalog, tier)` (41 x 3 + tier domyslny) | j.w. |
| `RIVER_REF_AREA` | PORT | `river_ref_area()` | `constants_match_web` |
| `riverMapAreaScale` | PORT | `river_map_area_scale` (bity) | `river_map_params_match_web_bitwise` |
| `RiverMapParams` | PORT | `RiverMapParams` (20 pol) | j.w. (wektor sprawdza liczbe pol = 18 calkowitych + 2 f64) |
| `resolveRiverMapParams` | PORT | `resolve_river_map_params` (kazda regula z `rzeki.*`) | j.w. (93 wektory: 3 tiery x 31 rozmiarow, w tym 0, 1, granice 40, 1.35) |
| `resolveRiverTraceForMap` | PORT | `resolve_river_trace_for_map` | `per_label_functions_match_web` |
| `riverTraceLimitsForMap` | PORT | `river_trace_limits_for_map` (tabela `rzeki.limity_trasy_legacy`) | j.w. |
| `RESOURCE_BASELINE_RARITY_MULT` | DANE + PORT dostepu | `map-gen-params.json baseline_rarity_mult`; `resource_baseline_rarity_mult()` | `constants_match_web` (bity) |
| `desertNoiseThresholdFromTier`, `forestNoiseThresholdFromTier` (`max(0.32, prog - 0.12)` z tabeli), `mountainNoiseThresholdFromTier`, `highlandNoiseThresholdFromTier` | PORT (dane Panel-A) | `*_noise_threshold_from_tier` | `tier_functions_match_web` (bity) |
| `WorldGenOptions` | PORT | `WorldGenOptions` (+ `Difficulty`) | `resolve_world_gen_numbers_matches_web` |
| `LAND_FRACTION_PERCENT_OPTS`, `LandFractionPercent` | PORT | tabela `udzial_ladu.opcje_procent`; `land_fraction_percent_opts()`; typ jako `i64` z opcji | `constants_match_web` |
| `defaultLandFractionPercentForTyp` | PORT | `default_land_fraction_percent_for_typ` | `land_fraction_functions_match_web` |
| `resolveLandFraction` | PORT | `resolve_land_fraction` (clamp 0.15-0.85 z tabeli; NaN/inf -> domyslny) | `land_fraction_functions_match_web` (4 typy x 15 wartosci, bity) |
| `scaleMaxRiversForLand` (`@deprecated`, zwraca `configuredMax`) | PORT | `scale_max_rivers_for_land` | `tier_functions_match_web` |
| `resolveWorldGenNumbers` | PORT | `resolve_world_gen_numbers -> WorldGenNumbers` | `resolve_world_gen_numbers_matches_web` (10 wariantow opcji, bity) |
| `MAX_MIAST_PANSTWA` | PORT (tabela) | `max_miast_panstwa()` | `constants_match_web` |
| `clampMiastaPanstwaCount` | PORT | `clamp_miasta_panstwa_count(raw: f64, allow_zero)` | `clamp_miasta_panstwa_count_matches_web` (NaN, +-inf, ulamki, `Number('abc')`, `Number(null)`...) |
| `MAX_TYPY_CYWILIZACJI_MENU` | PORT (tabela) | `max_typy_cywilizacji_menu()` | `constants_match_web` |
| `maxCivTypesForStartEpoch` | PORT | `max_civ_types_for_start_epoch` (uzywa `unit_epoch::civ_ids_available_at_game_epoch` z P6.1) | `civ_menus_with_rosters_match_web` (816 przypadkow, w tym prawdziwy `civs.json`) |
| `clampTypyTripleToEpoch` (prywatna) | PORT | `clamp_typy_triple_to_epoch` | j.w. |
| `MAP_MENU_TIER_ORDER`, `MIASTA_PANSTWA_MENU_BY_TIER`, `TYPY_CYWILIZACJI_DEFAULT_BY_TIER` (prywatne) | PORT (tabele) | `rozmiary.kolejnosc`, `miasta_panstwa.menu_wg_rozmiaru`, `typy_cywilizacji.domyslne_wg_rozmiaru_fallback` | `per_label_functions_match_web` (galaz fallbacku: etykiety spoza Panel-E) |
| `EPOCH_CIV_TYPE_POOL` | PORT (tabela) | `epoch_civ_type_pool(StartEpochId)` | `constants_match_web` |
| `normStartEpochId` (prywatna) | PORT | `norm_start_epoch_id` (aliasy z tabeli) | `per_label_functions_match_web` (16 zapisow epoki: `Braz`, ` zelazo `, `Żelazo`, `iron`...) |
| `tripleFromDefault`, `fallbackTypyTriple`, `mapMenuTierIndex`, `miastaPanstwaTriple`, `typyCywilizacjiTriple`, `menuBundleFromTriple` (prywatne) | PORT | `triple_from_default`, `fallback_typy_triple`, `map_menu_tier_index`, `miasta_panstwa_triple`, (alias na `civ_types_triple_for_map_label`), `menu_bundle_from_triple` | `per_label_functions_match_web` |
| `civTypesTripleForMapLabel` | PORT | `civ_types_triple_for_map_label` | j.w. |
| `defaultMiastaPanstwaFromMapLabel` | PORT | `default_miasta_panstwa_from_map_label` | j.w. |
| `miastaPanstwaMenuForMapLabel` | PORT | `miasta_panstwa_menu_for_map_label` | j.w. |
| `CivTypesMenuBundle` | PORT | `MenuBundle` | j.w. |
| `defaultCivTypesFromMapLabel` | PORT | `default_civ_types_from_map_label(label, epoch, roster)` | `civ_menus_with_rosters_match_web` |
| `civTypesMenuForMapLabel` | PORT | `civ_types_menu_for_map_label(label, epoch, roster)` | j.w. |
| `menuLabelToDims`, `rozmiarFromMenuLabel` (re-eksporty, 743) | PORT (alias) | te same funkcje (sekcja 1.2) | `p6_m02_generator` |

**Fallbacki `map-gen-params-loader.ts` (N/D):** `FALLBACK_*` i warunki `typeof v === 'number' && v > 0 ? v : FALLBACK` sa nieosiagalne przy dostarczonym `map-gen-params.json` (komplet kluczy, wartosci > 0); wektory z uruchomionego weba na tych samych danych zgodne z Rust. Jesli dane zostana uszkodzone, Rust zglasza blad parsowania (zamiast cichego fallbacku) - swiadoma roznica.

### 1.4 `riverGenSwitch.ts` (83 linie)

| Symbol (web) | Status | Rust | Test / dowod |
|---|---|---|---|
| `RIVER_GEN_STORAGE_KEY`, `RIVER_GEN_PHASE_STORAGE_KEY` | N/D | klucz `localStorage` przegladarki (warstwa powloki); wartosci potwierdzone w wektorze (`keys`) | `gen-m02-vectors.mjs` zapis kluczy, Python `storage keys` |
| `RiverGenPhase` | PORT | `RiverGenPhase` (napisy z tabeli `rzeki_przelacznik.fazy`) | `p6_m02_deposit_river::river_switch_matches_web` |
| `setRiverGenEnabledOverride`, `setRiverGenPhaseOverride` | PORT | `RiverGenSwitch::set_enabled_override`, `set_phase_override` | j.w. (3 x 4 nadpisan) |
| `parse01`, `parsePhase` (prywatne) | PORT | `parse01`, `parse_phase` | `parse_helpers_cover_all_tokens` + 2 028 wektorow |
| `getRiverGenEnabled` | PORT | `RiverGenSwitch::get_enabled(url, storage)` | `river_switch_matches_web`, `river_switch_without_environment_matches_web` |
| `getRiverGenPhase` | PORT | `get_phase` | j.w. |
| `isRiverGenMainOnly`, `isRiverGenFull` | PORT | `is_main_only`, `is_full` | j.w. |

**Bilans:** 0 pozycji RUNDA-2; N/D wylacznie UI/powloka (`TYP_SWIATA_MENU_LABELS`, 10 symboli jakosci renderu, `DENSITY_MENU_LABELS`, 2 klucze `localStorage`, alias typu `RozmiarSwiataType`) i nieosiagalne fallbacki.

## 2. Zaobserwowane zachowania weba odwzorowane 1:1 (NIE bledy portu)

Wszystkie z uruchomionego weba; port je zachowuje, bo celem jest parytet. Do ewentualnej decyzji wlasciciela poza tym tematem:

- **`densityTierFromLabel('Dużo')` zwraca `medium`, nie `high`.** Funkcja uzywa `normQualityLabel`, ktory (inaczej niz `normPlMenuLabel`) NIE zamienia `ż->z`, wiec `Dużo -> "duo"` i trafia na wartosc domyslna. Efekt: wybor "Dużo" w kreatorze dla gestosci surowcow/rzek/pustyni/lasu/reliefu nie daje tieru `high`. (`low`/`Mało` dziala.) Wektor: `perLabel[label="Dużo"].density = "medium"`; test `density_to_label_round_trips_where_web_does`.
- **`isLargeMapMenuLabel('Duży')` zwraca `false`** z tej samej przyczyny (UI, N/D).
- **`mapSizeLabelFromMenuLabel('Standardowy') = 'duza'`** (pole 168x120 = 20 160 < 25 200), co przesuwa domyslna liczbe rywali i skale rzek wzgledem nazwy menu (progi x4 po zmianie rozmiarow map).
- **`rywaleMenuForMapLabel` dla etykiety spoza Panel-E** (np. `Mało`) zwraca puste `opts` (domyslna liczba rywali z fallbacku `mapa_skala.domyslni_rywale` jest wieksza niz gorna granica z `aktywneTypy`), `domyslny = 0`.
- `mapGenDefaultRywale` z `map-gen-params.json mapa_skala` ma wartosci 12-30 (inne niz `FALLBACK_RYWALE` w loaderze 2-10); liczy sie JSON.

## 3. Tabela "bylo / jest"

| Obszar | Bylo (base `1570419b`) | Jest |
|---|---|---|
| `domain/mapgen/params.rs` | 3 linie komentarza `//!` (szkielet M00) | modul logiki (~1 390 linii po `cargo fmt`; port czterech plikow web) |
| `data/derived.rs` | 1 786 linii, tabele P3/P6.1C | + ~400 linii na koncu: struktury i parser `mapgen-nowa-gra.json` (`MAPGEN_NOWA_GRA_JSON`, `parse_mapgen_nowa_gra`, `mapgen_nowa_gra`) |
| `data/derived/` | 33 pliki | + `mapgen-nowa-gra.json` |
| Funkcje rozmiaru/parametrow nowej gry w Rust | tylko dane (`rozmiar_dims`, `domyslni_rywale` bez funkcji wyboru) | pelny port (sekcja 1) |
| Testy (baseline) | 595 | 624 (+29) |
| Pokrycie wymiarow map | test pinowal tylko `standardowy` | 6 rozmiarow z weba |

## 4. Zmiany w testach

- **Nowe (29):** `p6_m02_generator` (4), `p6_m02_new_game` (11), `p6_m02_deposit_river` (6), `p6_m02_tables` (7, ksztalt tabeli bez pinow wartosci), `p6_m02_float_parse` (1).
- **Zmienione istniejace:** zero (zaden plik testowy spoza `p6_m02_*` nie byl edytowany).
- **Regresja z konstrukcji (BLOKADA-NOTA, decyzja orkiestratora):** `tests/p6_m00_skeleton.rs::files_exist_and_are_empty_doc_only` wymaga, by KAZDA linia `domain/mapgen/*.rs` (poza `mod.rs`) zaczynala sie od `//!`. Wypelnienie `params.rs` kodem (cel tego tematu) lamie ten test z samej definicji - dotyczy kazdego tematu M*, ktory wypelni swoj plik. Test jest poza allowlista (zakaz zmian), wiec zostawiony bez zmian. Rekomendacja: orkiestrator przy integracji wypelnionych szkieletow zmienia warunek na "plik doc-only ALBO ma naglowek `Temat wlasciciel:` z ID wlasciciela" (pozostale dwa testy M00 przechodza; wlasciciel w naglowku `params.rs` zgodny z tabela P6-25 §6: `//! Temat wlasciciel: R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1.`).

## 5. Bramki (surowe, PELNE wyjscia w plikach runu; `echo "EXIT=$?"`)

Build: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_8ae2c889-684-1`, cargo w `rust-port/engine`.

`cargo fmt --check` (`gate-fmt-r1.log`, caly plik):
```
EXIT=0
```

`cargo clippy --all-targets -- -D warnings` (`gate-clippy-r1.log`, caly plik):
```
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_8ae2c889-684-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 0.18s
EXIT=0
```
(pierwszy przebieg tej samej tresci kodu wykryl 4x `clippy::manual_contains`; poprawione, drugi przebieg czysty.)

`cargo test --no-fail-fast` (`gate-test-r1.log`, 1 103 linie, caly plik): **623 passed, 1 failed**, `EXIT=101`. Jedyny czerwony: `p6_m00_skeleton::files_exist_and_are_empty_doc_only` (sekcja 4, nie jest bledem portu). Testy M02: `p6_m02_deposit_river` 6 ok, `p6_m02_float_parse` 1 ok, `p6_m02_generator` 4 ok, `p6_m02_new_game` 11 ok, `p6_m02_tables` 7 ok.

Wektory i weryfikator: `verify-m02-r1.log` -> `RAZEM: 20070 sprawdzen, rozbieznosci: 0`, `EXIT=0`. Powtarzalnosc: `gen-m02-regen-cmp.log` (regeneracja daje pliki bajt-w-bajt identyczne z zacommitowanymi).

## 6. Mutacje (`mutation-evidence-r1.txt`)

8 mutacji Rust (po kazdej stan przywrocony z kopii) - wykryte: zmiana wartosci w tabeli JSON (`min_dlugosc_tier`), odwrocenie `max->min` w progu lasu, odwrocona kolejnosc regul rozmiaru, wylaczenie reguly "wegiel nigdy widoczny", zmiana domyslnej fazy rzek, `>= 40 -> > 40`, `round -> floor` w `maxRiversForMapAndDensity`. Mutacja 6 (`round -> floor` w `tributaryCell`) jest **rownowazna** (`max(3, ...)` daje 3 dla komorek 10/5/5), odnotowana jako taka i niezaliczona jako dowod. Python: skazona kopia wektorow -> 6 rozbieznosci, `EXIT=1`.

## 7. NIE_ZMIERZONO (jawnie)

- Zachowanie dla kluczy z prototypu obiektu (`zloze = 'constructor'`/`'__proto__'`/`'toString'`): `METAL_DEPOSIT_MIN_ERA[z]` zwraca w webie funkcje, nie liczbe; port tego nie odwzorowuje (poza realnymi danymi zloz).
- `String.prototype.trim()`/`toLowerCase()` dla znakow poza ASCII i polskimi (np. `﻿`, `İ`): Rust `trim()`/`to_lowercase()` moga sie roznic; wektory zawieraja ASCII + polskie litery + spacje.
- Pojedyncze `w`/`h` nieparzyste lub niecalkowite w `resolveRiverMapParams` (port przyjmuje `i64`; web przyjmuje dowolne `number`).
- Zgodnosc z M01 co do `defaultLandFractionForTyp` (zalozenie 5) - zalezy od zakresu tamtego tematu.
- `gen-helpers.ts` re-eksport `RiverMapParams`/`WorldGenOptions` (`gen-helpers.ts:33`, `generator.ts:117`) - instrukcje re-eksportu naleza do M01/M18; typy zdefiniowane tutaj.

## 8. Zero zmian poza allowlista - samokontrola

Zmienione/dodane: `rust-port/engine/src/domain/mapgen/params.rs`, `rust-port/engine/data/derived/mapgen-nowa-gra.json`, `rust-port/engine/src/data/derived.rs` (dopisek na koncu, zgodnie z uwaga dispatchu), `rust-port/engine/tests/p6_m02_*.rs` (5 plikow), `rust-port/engine/tests/p6_m02_vectors/*.json` (5 plikow), `dyspozycje/rust-port/p6/P6-M02-PARAMETRY-NOWEJ-GRY.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1/**`. Bez zmian: `bridge.rs`, `Cargo.toml`, `Cargo.lock` (niezacommitowany), `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `domain/mod.rs`, `domain/mapgen/mod.rs`, `tests/p6_m00_skeleton.rs`.
