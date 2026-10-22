# P3.21 — CityId dla identyfikatorów miast w `domain/**`

TEMAT: R-RUSTPORT-P3-21-CITYID-Q1
BAZA: `origin/rust-port/parity-v2` @ `6d77d02e` (detach).
ALLOWLISTA KODU: `rust-port/engine/src/domain/ai_turn.rs`, `rust-port/engine/src/domain/barbarians.rs`, `rust-port/engine/tests/ai_turn.rs`, `rust-port/engine/tests/barbarians.rs`, `rust-port/engine/tests/city_id.rs` (NOWY). `bridge.rs` bez zmian (brak trafień na ID miast). Zero zmian w `data/**`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`.

## 1. Stan wyjściowy — `CityId` już istnieje

- `rust-port/engine/src/domain/ids.rs:37` — `id_type!(CityId)` (newtype `u64`, `#[serde(transparent)]`, jak `PlayerId`/`CampId`/`UnitId`). Eksport: `domain/mod.rs:30` (`pub use ids::{CampId, CityId, OwnerRef, PlayerId, UnitId}`).
- Już na `CityId` przed tym tematem (grep `CityId` w `src/`): `types.rs` (`GameState` city ids, `ValidationError`), `state.rs`, `playable.rs:294` (`PlayableCity.id`), `ai_turn.rs:426` (`AiCity.id`), `barbarians.rs:133` (`CitySnapshot.id`), `lib.rs:51` (re-export).

## 2. Tabela decyzji „CityId / bez zmiany”

Kryterium: surowe `u64`/`i64`/`usize` jako ID miasta w `rust-port/engine/src/domain/**`. Stan PRZED = `6d77d02e`, PO = bieżący commit.

| # | Miejsce (PRZED) | Decyzja | Uzasadnienie |
|---|---|---|---|
| C1 | `ai_turn.rs:579` `AiTurnOptions.city_buildings: BTreeMap<u64, BTreeSet<String>>` | ZMIENIONE → `BTreeMap<CityId, _>` | Klucz = ID miasta (`city.id.get()` w starym `:903`). JSON bez zmian: klucz mapy serializuje się jako liczba (test `city_id_map_keys_stay_numeric_in_json`). |
| C2 | `ai_turn.rs:710` `AiCommand::Build { city_id: u64 }` (`cityId`) | ZMIENIONE → `CityId` | Pole komendy AI dla miasta. Serializacja liczbowa bez zmian (transparent). |
| C3 | `ai_turn.rs:865` `choose_city_production(input, city_id: u64)` | ZMIENIONE → `CityId` | Porównanie `city.id == city_id` zamiast `city.id.get() == city_id`. |
| C4 | `ai_turn.rs:870` `choose_production(input, city_id: u64)` | ZMIENIONE → `CityId` | Publiczna ścieżka zachowana, sygnatura typu ID. Brak wywołań poza domeną/testami (grep). |
| C5 | `ai_turn.rs:903` `city_buildings.get(&city.id.get())` | ZMIENIONE → `get(&city.id)` | Konsekwencja C1. |
| C6 | `ai_turn.rs:1060` `Build { city_id: city.id.get() }` | ZMIENIONE → `city_id: city.id` | Konsekwencja C2. |
| C7 | `ai_turn.rs:447` `AiCity::new(id: u64, ..)` | BEZ ZMIANY SYGNATURY (CTOR-WRAP) | Konstruktor owija surowe ID w `CityId::new(id)` (wzorzec P3.20/P3-4C). |
| C8 | `barbarians.rs:138` `CitySnapshot::new(id: u64, ..)` | BEZ ZMIANY SYGNATURY (CTOR-WRAP) | Jak C7: `id: CityId::new(id)`. |
| C9 | `barbarians.rs:198` `BarbUnit.cleared_city_ids: BTreeSet<u64>` | ZMIENIONE → `BTreeSet<CityId>` | Zbiór ID miast. Serde: lista liczb bez zmian (test `barbarian_cleared_cities_round_trip_as_numbers`). |
| C10 | `barbarians.rs:800, 865` `contains(&city.id.get())`, `insert(city.id.get())` | ZMIENIONE → `city.id` | Konsekwencja C9. |
| C11 | `barbarians.rs:917` `BarbCityGarrison.city_id: u64` | ZMIENIONE → `CityId` | ID miasta barbarzyńskiego. JSON liczbowy bez zmian (test `barbarian_city_garrison_json_keeps_numeric_city_id`). |
| C12 | `barbarians.rs:925` `BarbCityGarrisonSpawn.city_id: u64` | ZMIENIONE → `CityId` | Jak C11; `city_id: city.city_id` w `tick_barbarian_city_garrisons` przechodzi bez zmian kodu. |
| C13 | `trade.rs` `TradeCity.id: String`, `TradeRoute.from_city_id/to_city_id: String`, `ViaCity`/`viaCityId: String`, `trade_route_id(&str,&str,..)`, `trade_route_pair_key`, `contains_building(city_id: &str)`, `city_has_port(&str)`, `trade_route_limit_for_city(&str)` | BEZ ZMIANY (tekst) | Wyjątek z dispatchu: ID miasta w kontrakcie web/trade jest TEKSTEM (`fromCityId`, `toCityId`, `viaCityId`, `cityId` jako string, klucze `BTreeMap<&str,_>`, budowa `format!("{from}->{to}:{medium}")`). Zmiana na `CityId` zmieniłaby kontrakt JSON i format identyfikatora trasy. Kandydat na osobny temat (ujednolicenie ID tras/miast w web). |
| C14 | `diplomacy.rs` `capital_city_id: Option<&str>` (2470, 2574) | BEZ ZMIANY | Tekst (ID stolicy w kontrakcie web), jak C13. |
| C15 | `diplomacy.rs` `ActiveDeal`/`DiplomaticProposal` `id: String` oraz `grant.id` | BEZ ZMIANY | ID transakcji/grantu, nie miasta. |
| C16 | `ai_turn.rs:491` `ProductionItem.id: String` | BEZ ZMIANY | ID pozycji produkcji (budynek/jednostka), nie miasta. |
| C17 | `playable.rs:424` `CityId::new(CAPITAL_ID)` | BEZ ZMIANY | Już `CityId`. |
| C18 | `ai_turn.rs` `AiUnit::new(id: u64)`, `barbarians.rs` `BarbUnit::new(id: u64)`, `combat.rs` `id: u64`, `playable.rs:472` `add_player(id: u64)` | BEZ ZMIANY | ID jednostek i gracza, nie miasta (P3-4C §1b). |
| C19 | `barbarians.rs` `BarbCamp::new(id: u64)` | BEZ ZMIANY | ID obozu, `CampId` (P3-20). |
| C20 | `state.rs`, `types.rs` `city_ids: Vec<CityId>` | BEZ ZMIANY | Już `CityId`. |

## 3. Binarne kryterium (po zmianie)

Komenda (katalog `rust-port/engine`):

```bash
grep -rnE '(city|City)\w*\s*:\s*(Option<)?(u64|i64|usize|u32)\b|BTreeSet<u64>|BTreeMap<u64|fn \w*city\w*\([^)]*u64' src/domain src/bridge.rs
```

Wynik: 6 trafień, wszystkie NIE-ID miast (`min_city_distance: u32` C-parametr odległości, `city_count: usize` licznik, `min_distance_from_city: u32` parametr, `with_capacity(usize|u32)` pojemności buforów). Zero surowych ID miast w `domain/**`.

Przed zmianą ta sama komenda dała trafienia: `ai_turn.rs:579, 710, 865, 870`, `barbarians.rs:198, 917, 925` (plus klucz `city.id.get()` w 903/1060 i `cleared_city_ids` 800/806–808/865).

## 4. Kontrakt JSON / zapisy / parity

- `CityId` jest `#[serde(transparent)]` → każda zmieniona struktura serializuje się identycznie (liczba). Mapy `BTreeMap<CityId,_>` mają liczbowe klucze JSON (test `city_id_map_keys_stay_numeric_in_json`).
- Zmieniono tylko konstrukcje typów; wartości, kolejność (`Ord` jak `u64`) i kształt DTO bez zmian. `parity_suite`, `save_load`, `state_dto`, `ai_turn`, `barbarians` przechodzą bez zmiany oczekiwań (tylko konstrukcje w testach: `CityId::new(n)` zamiast literału `n`).
- `bridge.rs`: brak trafień ID miast, bez zmian.
- Testy: NIE osłabiano asercji. Zmiany w testach są wyłącznie konwersjami literałów na `CityId::new(..)`.

## 5. Nowe testy

`rust-port/engine/tests/city_id.rs` (7 testów): JSON `CityId` = liczba; konwersje `From<u64>`/`new`/`get`/`Display`; porządek sortowania; klucze map liczbowe; `BarbCityGarrison`/`BarbCityGarrisonSpawn` JSON z liczbowym `city_id`; `cleared_city_ids` round-trip jako liczby; rozróżnienie typów (`PlayerId` vs `CityId`, ta sama wartość surowa).

## 6. Surowe wyjścia gate (pełne, `echo EXIT`)

Procedura: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_35cb5300-073-1`, cargo w `rust-port/engine`. `Cargo.lock` wygenerowany przez cargo, NIE commitowany (usunięty po testach).

Pliki logów (surowe, pełne): `dyspozycje/autobot/runs/R-RUSTPORT-P3-21-CITYID-Q1/fmt.log`, `clippy.log`, `test.log`.

### 6.1 `cargo fmt --check`

```text
EXIT=0
```

Uwaga: `cargo fmt --check` nie wypisuje nic przy zgodności; `EXIT=0` jest pełnym wynikiem.

### 6.2 `cargo clippy --all-targets -- -D warnings`

```text
    Finished `dev` profile [unoptimized] target(s) in 0.12s
EXIT=0
```

Pełny build z ostrzeżeniami (pierwszy przebieg, bez cache) zakończył się `Finished ... in 30.12s` i `EXIT=0`, bez ostrzeżeń (pełny log przebiegu z kompilacją nie został zachowany w pliku; powtórzony przebieg z cache: wynik powyżej).

### 6.3 `cargo test`

Pełny surowy log (wszystkie 414 linii `test ...`, wszystkie binarki testowe, doc-tests): `dyspozycje/autobot/runs/R-RUSTPORT-P3-21-CITYID-Q1/test.log`. Poniżej surowe linie `test result` i `EXIT` (bez linii `Running` przeciętych ścieżek):

```text
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (src/lib.rs)
test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (ai_turn)
test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.23s   (assets_manifest)
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (barbarians)
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (bridge_add_player)
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (building_costs)
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (city_growth)
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (city_id, NOWY)
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (combat)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (combat_ai_multipliers)
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (data_buildings_tech)
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s   (data_civilizations)
test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s   (data_compliance)
test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s   (data_economy_society)
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s   (data_loader)
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (data_terrain_map)
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s   (data_units_combat)
test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s   (derived_values)
test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s   (diplomacy)
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (events)
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (hex_terrain)
test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (improvements)
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s   (map_generator)
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (owner_ref)
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s   (parity_suite)
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (pathfinding)
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (playable_slice)
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s   (recruitment)
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (replay)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (resource_production)
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (rng)
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (save_load)
test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (smoke)
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (state_dto)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (steam_adapter)
test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (terrain_movement_fix)
test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s   (trade)
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (turn_economy)
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (unit_epoch)
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s   (doc-tests)
EXIT=0
```

Podsumowanie testów: suma `passed=374 failed=0` (baseline ≥ 367 spełniony; 7 nowych testów w `city_id.rs`, 367 istniejących).

## 7. Commit

Patrz run `R-RUSTPORT-P3-21-CITYID-Q1` (commit w worktree, bez push). DEPLOY/PUSH: NIE WYKONANO.
