# R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1 - raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1
GOAL: P6.8E - `gra/src/game/economy-upkeep.ts` (1174 LOC, 42 fn; pin 91dc998a) przeniesiony do Rust w partiach 8E-P1 (34 sym.) i 8E-P2 (37 sym.). Wektory z uruchomionego weba, bitowe porownanie f64, mutacje galezi sterujacych.
ZMIANY/COMMIT:
- `1bd9f9d8a` - feat(rust-port): P6.8E-P1 (magazyny, pula panstwa, parametry B; 34 sym.)
- `a027eff6b` - feat(rust-port): P6.8E-P2 (utrzymanie budynkow/jednostek, zywnosc, saldo; 37 sym.)
- Baza: `origin/rust-port/parity-v2` = `1dd3c12c6` (zgodnie z dispatchem: >= `1dd3c12c6`).
- Allowlista (wg dispatchu, rozszerzona o plik implementacji): `rust-port/engine/src/domain/turn_economy.rs` (moduly `economy_upkeep_p1`, `economy_upkeep_p2` na koncu pliku); `rust-port/engine/tests/p6_8e_upkeep_p1.rs`, `rust-port/engine/tests/p6_8e_upkeep_p2.rs` (NOWE); `rust-port/engine/tests/p6_8e_vectors/economy_upkeep_p1.json`, `.../economy_upkeep_p2.json` (NOWE, z pinu 91dc998a); `dyspozycje/autobot/runs/R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1/**` (generatory + ten raport).
- Zmiana istniejacej funkcji: tylko `fn read_num` -> `pub fn read_num` (P1, do reuzycia w P2). `city_growth.rs:844` NIE zmieniano (mnoznik reuzywany).
- Poza zakresem (nietkniete): `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. Pin 91dc998a nie przesuniety. `Cargo.lock` (wygenerowany przez cargo) NIE zacommitowany.
- PUSH: NIE WYKONANO.

TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (po rustfmt na zmienionych plikach).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (0 ostrzezen).
- `cargo test --test p6_8e_upkeep_p1`: 13 passed, 0 failed (EXIT=0).
- `cargo test --test p6_8e_upkeep_p2`: 12 passed, 0 failed (EXIT=0).
- `cargo test --no-fail-fast` (wszystkie 241 binarek testowych, uruchomione pojedynczo po `cargo test --no-run`): wszystkie RC=0 (0 FAILED). Logi: /tmp/p68e-all-1.log, /tmp/p68e-all-121.log (poza repo).
- `cargo test --doc`: EXIT=0.
- `git diff --check`: czysty.
- Baseline PRZED zmiana (`1dd3c12c6`): nie mierzono osobno pelnej liczby testow; sprawdzono, ze po zmianach wszystkie binarki sa zielone (zmiany sa addytywne poza `read_num` -> `pub`).
- Wektory: generator `gen-p6-8e-vectors.mjs` (P1: 15 tablic przypadkow: magazyny, pula panstwa, reconcile, parametry) i `gen-p6-8e-vectors-p2.mjs` (P2: 20 tablic przypadkow: utrzymanie, zywnosc, saldo, rekrutacja; liczby przypadkow - w wygenerowanych JSON). Uruchomione na `git archive 91dc998a gra/src gra/data` w katalogu tymczasowym (`/tmp/p68e-web.RZeY`, do usuniecia), Node v22.22.0, `--experimental-transform-types`, loader hooks; bez `npm run build/dev`, bez zapisu do `gra/`.
- Wynik bitowy: 0 rozbieznosci dla wszystkich asercji BITOWYCH; jedyne tolerancje to jawnie opisana rozbieznosc 1-2 ulp dla epok ulamkowych (patrz BLOKADY/NOTY).
- Mutacje galezi (P1, skrypt `mutate_p1.sh` w runie): M1 prog zera clamp - zabita; M2 tie-break po id - zabita; M3 komparator NaN->Less - PRZEZYLA (ROWNOWAZNE: NaN powstaje tylko dla dwoch miast Inf; wtedy wszyscy posiadacze klucza koncza jako NaN niezaleznie od kolejnosci); M4 floor liczby miast - zabita; M5 read_num bez isFinite - zabita; M6 Math.min -> min Rust - zabita; M7 pominiecie add==0 - zabita; M8 brak klucza zywnosc w nadwyzce podboju - zabita.
- Mutacje galezi (P2, `mutate_p2.sh`): M9 kategoria zero - zabita; M10 camping - zabita; M11 floor FALA2 - zabita (po dodaniu flat ulamkowych i epok syntetycznych); M12 odwrocona bramka hintu - zabita; M13 prefiks Utrzymanie - zabita; M14 fallback `??` zywnosci - zabita; M15 `|| 1` - zabita; M16 deficyt <= - zabita; M17 galaz turns===1 - zabita; M18 add > 0 - zabita; M19 clamp poziomu - zabita; M20 domyslne terytorium - zabita.
- Przywrocenie pliku po mutacjach: `cmp` z kopia - OK (kazdorazowo).

BLOKADY:
- NOTA-1 (rozbieznosc 1 ulp, symbol P6.7A): `magazynEraMultiplier` (reuzywany z `city_growth::p6_7a`) dla epok ulamkowych > 1 daje `powf` (Rust) zamiast `Math.pow` (V8): np. epoka 4.5 -> 11.313708498984761 vs 11.31370849898476 (1 ulp). Epoka gry jest calkowita, wiec asercja bitowa obowiazuje dla calkowitych; ulamkowe testowane z limitem 1-2 ulp (`known_fractional_era_pow_gap`, `owner_capacity_and_era_match_web`). Naprawa wymaga zmiany P6.7A (`city_growth.rs`, poza allowlista tego tematu) - decyzja orkiestratora.
- NOTA-2: `stripDiacriticsLower` (TS) nie jest wystawiony jako osobny symbol Rust - prywatny `strip_diacritics_lower` w `building_costs::p6_7b` (poza allowlista). Jego jedyny konsument `unitResourceUpkeep` przechodzi przez `unit_stock_cost` (ta sama normalizacja NFD, ten sam `scaleCostByEpoch`, bez pola Typ). Wektory `unitResourceUpkeep` (84 przypadki, w tym nazwy z diakrytykami i `-`) sa zielone. Do domkniecia: `pub` na tej funkcji w osobnym temacie.
- NOTA-3: `UnitResourceUpkeepLike` -> `UnitTypeRef`; `OwnerCappedResourceKey` i `OWNER_CAPPED_RESOURCE_KEY_SET` - bez odpowiednika (typ TS-only / wewnetrzny Set), oznaczone NIE-DOTYCZY w tabeli.
- NOTA-4 (zalozenie Z-10, rozstrzygniete bez pytania): `RawEconRow` modelowany jako `BTreeMap<difficulty, RawCell>`, gdzie `RawCell::Num(f64)` obejmuje takze NaN/Inf (odrzucane przez `readNum`) i `RawCell::Other` = nie-liczba/null/brak. Trudnosc spoza unii `easy|normal|hard` jest bledem typu po stronie webu (w Rust: enum).
- NOTA-5 (zalozenie Z-11): `Math.round` -> `f64::round` tylko dla dodatnich argumentow (`unitUpkeep`: `base > 0` wczesniej) - rownowazne.
- NOTA-6 (zalozenie Z-12): sortowanie `reconcileOwnerResourceCaps` - komparator V8 (NaN -> Equal), `sort_by` stabilny; remis po `id` porownywany bajtowo (id ASCII w danych; dla nie-ASCII porownanie UTF-16 vs UTF-8 moze sie roznic - poza zakresem danych).
- NOTA-7: klucze `__proto__` w `applyResourceIntake` (JS: przypisanie do prototypu) - poza zakresem (klucze z resources.json).
- Brak DECISION_REQUIRED: wszystkie luki rozstrzygniete zalozeniem w tym raporcie.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja wektorow z pinu 91dc998a, mutacji i zakresu allowlisty) -> Final Control -> integracja orkiestratora (poza tym tematem). Kolejna partia tematu: brak (8E-P1 i 8E-P2 wykonane).
DEPLOY/PUSH: NIE WYKONANO

## Tabela symboli (71 z §11 `P6-8-MIASTA-PODZIAL.md`, partie 8E-P1/8E-P2)

Legenda: PORTOWANE = obecny w `turn_economy.rs` (modul `economy_upkeep_p1`/`economy_upkeep_p2`); REUZYTE = istniejacy symbol Rust, bez duplikatu; NIE-DOTYCZY = typ/struktura TS bez odpowiednika (uzasadnienie w kolumnie); NIE-WYSTAWIONY = wykonany przez reuse, ale bez publicznego symbolu (NOTA-2).

| plik:linia (91dc998a) | symbol | rodzaj | LOC | partia | status | Rust / uwagi |
|---|---|---|---|---|---|---|
| `economy-upkeep.ts:65` | `Difficulty` | type | 67 | 8E-P1 | PORTOWANE | enum Difficulty (economy_upkeep_p1) |
| `economy-upkeep.ts:68` | `RawEconRow` | type | 3 | 8E-P1 | PORTOWANE | alias RawRow (economy_upkeep_p1) |
| `economy-upkeep.ts:71` | `RawEconParamsForUpkeep` | type | 6 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`raw_econ_params_for_upkeep`) |
| `economy-upkeep.ts:77` | `readNum` | fn | 24 | 8E-P1 | PORTOWANE | read_num (pub, economy_upkeep_p1) |
| `economy-upkeep.ts:101` | `StorageParams` | type | 7 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`storage_params`) |
| `economy-upkeep.ts:108` | `DEFAULT_STORAGE_PARAMS` | const | 10 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`default_storage_params`) |
| `economy-upkeep.ts:118` | `loadStorageParams` | fn | 17 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`load_storage_params`) |
| `economy-upkeep.ts:135` | `foodStorageCapacity` | fn | 8 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`food_storage_capacity`) |
| `economy-upkeep.ts:143` | `readCityFoodBuffer` | fn | 16 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`read_city_food_buffer`) |
| `economy-upkeep.ts:159` | `resourceStorageCapacityPerType` | fn | 5 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`resource_storage_capacity_per_type`) |
| `economy-upkeep.ts:164` | `ClampResult` | type | 11 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`clamp_result`) |
| `economy-upkeep.ts:175` | `clampStore` | fn | 19 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`clamp_store`) |
| `economy-upkeep.ts:194` | `CityStores` | type | 6 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`city_stores`) |
| `economy-upkeep.ts:200` | `emptyCityStores` | fn | 12 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`empty_city_stores`) |
| `economy-upkeep.ts:212` | `applyFood` | fn | 10 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`apply_food`) |
| `economy-upkeep.ts:222` | `ResourceOverflow` | type | 9 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`resource_overflow`) |
| `economy-upkeep.ts:231` | `applyResourceIntake` | fn | 30 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`apply_resource_intake`) |
| `economy-upkeep.ts:261` | `globalResourceCapacityPerType` | fn | 16 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`global_resource_capacity_per_type`) |
| `economy-upkeep.ts:277` | `onCityLost` | fn | 15 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`on_city_lost`) |
| `economy-upkeep.ts:292` | `onCityConquered` | fn | 53 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`on_city_conquered`) |
| `economy-upkeep.ts:345` | `OwnerStorageParams` | type | 29 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`owner_storage_params`) |
| `economy-upkeep.ts:374` | `DEFAULT_OWNER_STORAGE_PARAMS` | const | 18 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`default_owner_storage_params`) |
| `economy-upkeep.ts:392` | `magazynEraMultiplier` | fn | 13 | 8E-P1 | REUZYTE | city_growth::p6_7a::magazyn_era_multiplier (P6.7A, bez duplikatu) |
| `economy-upkeep.ts:405` | `OWNER_CAPPED_RESOURCE_KEYS` | const | 6 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`owner_capped_resource_keys`) |
| `economy-upkeep.ts:411` | `OwnerCappedResourceKey` | type | 2 | 8E-P1 | NIE-DOTYCZY | typ TS-only (unia literalow); Rust: is_owner_capped_resource_key(&str) |
| `economy-upkeep.ts:413` | `OWNER_CAPPED_RESOURCE_KEY_SET` | const | 3 | 8E-P1 | NIE-DOTYCZY | wewnetrzny Set webu; Rust: slice + contains |
| `economy-upkeep.ts:416` | `isOwnerCappedResourceKey` | fn | 8 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`is_owner_capped_resource_key`) |
| `economy-upkeep.ts:424` | `loadOwnerStorageParams` | fn | 24 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`load_owner_storage_params`) |
| `economy-upkeep.ts:448` | `ownerResourceCapacityPerType` | fn | 16 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`owner_resource_capacity_per_type`) |
| `economy-upkeep.ts:464` | `ownerStorageParamsForEra` | fn | 12 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`owner_storage_params_for_era`) |
| `economy-upkeep.ts:476` | `CityResourceHolder` | type | 24 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`city_resource_holder`) |
| `economy-upkeep.ts:500` | `reconcileOwnerResourceCaps` | fn | 74 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`reconcile_owner_resource_caps`) |
| `economy-upkeep.ts:574` | `UpkeepParams` | type | 10 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`upkeep_params`) |
| `economy-upkeep.ts:584` | `DEFAULT_UPKEEP_PARAMS` | const | 14 | 8E-P1 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`default_upkeep_params`) |
| `economy-upkeep.ts:598` | `loadUpkeepParams` | fn | 18 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`load_upkeep_params`) |
| `economy-upkeep.ts:616` | `BuildingInstanceLike` | type | 21 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`building_instance_like`) |
| `economy-upkeep.ts:637` | `buildingUpkeep` | fn | 22 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`building_upkeep`) |
| `economy-upkeep.ts:659` | `totalBuildingUpkeep` | fn | 20 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`total_building_upkeep`) |
| `economy-upkeep.ts:679` | `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE` | const | 7 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`building_resource_upkeep_units_per_type`) |
| `economy-upkeep.ts:686` | `buildingResourceUpkeep` | fn | 15 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`building_resource_upkeep`) |
| `economy-upkeep.ts:701` | `addResourceCosts` | fn | 12 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`add_resource_costs`) |
| `economy-upkeep.ts:713` | `totalBuildingResourceUpkeep` | fn | 13 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`total_building_resource_upkeep`) |
| `economy-upkeep.ts:726` | `buildingResourceUpkeepForBuiltIds` | fn | 14 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`building_resource_upkeep_for_built_ids`) |
| `economy-upkeep.ts:740` | `previewOwnerBuildingResourceUpkeep` | fn | 22 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`preview_owner_building_resource_upkeep`) |
| `economy-upkeep.ts:762` | `stripDiacriticsLower` | fn | 5 | 8E-P2 | NIE-WYSTAWIONY | prywatny strip_diacritics_lower w building_costs::p6_7b (poza allowlista); klucz uzyty przez unit_stock_cost (ta sama sciezka NFD) |
| `economy-upkeep.ts:767` | `UnitResourceUpkeepSource` | type | 7 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_resource_upkeep_source`) |
| `economy-upkeep.ts:774` | `UnitResourceUpkeepLike` | type | 10 | 8E-P2 | PORTOWANE | struct UnitTypeRef (economy_upkeep_p2) |
| `economy-upkeep.ts:784` | `unitResourceUpkeep` | fn | 33 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_resource_upkeep`) |
| `economy-upkeep.ts:817` | `UNIT_RECRUIT_UPKEEP_RESERVE_TURNS` | const | 6 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_recruit_upkeep_reserve_turns`) |
| `economy-upkeep.ts:823` | `UNIT_RECRUIT_STOCK_ONLY_HINT` | const | 8 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_recruit_stock_only_hint`) |
| `economy-upkeep.ts:831` | `unitRecruitUpkeepReserve` | fn | 21 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_recruit_upkeep_reserve`) |
| `economy-upkeep.ts:852` | `canAffordUnitRecruitStock` | fn | 14 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`can_afford_unit_recruit_stock`) |
| `economy-upkeep.ts:866` | `canAffordUnitRecruitFull` | const | 7 | 8E-P2 | PORTOWANE | can_afford_unit_recruit_full (alias) |
| `economy-upkeep.ts:873` | `isUnitRecruitStockChipMissing` | fn | 14 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`is_unit_recruit_stock_chip_missing`) |
| `economy-upkeep.ts:887` | `pickUnitRecruitHint` | fn | 8 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`pick_unit_recruit_hint`) |
| `economy-upkeep.ts:895` | `totalUnitResourceUpkeep` | fn | 12 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`total_unit_resource_upkeep`) |
| `economy-upkeep.ts:907` | `previewOwnerTotalResourceUpkeep` | fn | 20 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`preview_owner_total_resource_upkeep`) |
| `economy-upkeep.ts:927` | `DEFAULT_UNIT_UPKEEP_BY_CATEGORY` | const | 21 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`default_unit_upkeep_by_category`) |
| `economy-upkeep.ts:948` | `UnitUpkeepTable` | type | 3 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_upkeep_table`) |
| `economy-upkeep.ts:951` | `UnitUpkeepLike` | type | 11 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_upkeep_like`) |
| `economy-upkeep.ts:962` | `unitUpkeep` | fn | 18 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_upkeep`) |
| `economy-upkeep.ts:980` | `totalUnitUpkeep` | fn | 18 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`total_unit_upkeep`) |
| `economy-upkeep.ts:998` | `buildUnitUpkeepTable` | fn | 32 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`build_unit_upkeep_table`) |
| `economy-upkeep.ts:1030` | `UnitFoodTable` | type | 3 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_food_table`) |
| `economy-upkeep.ts:1033` | `UnitFoodLike` | type | 19 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_food_like`) |
| `economy-upkeep.ts:1052` | `unitFoodPerTurn` | fn | 25 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`unit_food_per_turn`) |
| `economy-upkeep.ts:1077` | `buildUnitFoodTable` | fn | 23 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`build_unit_food_table`) |
| `economy-upkeep.ts:1100` | `militaryFoodConsumption` | fn | 17 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`military_food_consumption`) |
| `economy-upkeep.ts:1117` | `UpkeepBalance` | type | 20 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`upkeep_balance`) |
| `economy-upkeep.ts:1137` | `upkeepBalance` | fn | 24 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`upkeep_balance`) |
| `economy-upkeep.ts:1161` | `buildingUpkeepForBuiltIds` | fn | 14 | 8E-P2 | PORTOWANE | turn_economy::economy_upkeep_p1/p2 (`building_upkeep_for_built_ids`) |

Podsumowanie: PORTOWANE 67, REUZYTE 1, NIE-WYSTAWIONY 1, NIE-DOTYCZY 2, BRAK 0 (z 71).
