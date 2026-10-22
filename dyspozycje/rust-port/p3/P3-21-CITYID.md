# P3.21 — CityId dla identyfikatorów miast w `domain/**`

TEMAT: R-RUSTPORT-P3-21-CITYID-Q1
BAZA: `origin/rust-port/parity-v2` = `6d77d02e` (zweryfikowane: `git rev-parse --short origin/rust-port/parity-v2` → `6d77d02e`).
COMMIT OPERATORA (runda 1): `b91cf606` (detached, nie wypchnięty). Runda 2 (odpowiedź na zarzuty Evaluatora): commit poprawkowy na `b91cf606` — SHA w raporcie Operatora (`git log -1 --format=%H`).
ALLOWLISTA KODU: `rust-port/engine/src/domain/ai_turn.rs`, `rust-port/engine/src/domain/barbarians.rs`, `rust-port/engine/tests/ai_turn.rs`, `rust-port/engine/tests/barbarians.rs`, `rust-port/engine/tests/city_id.rs` (NOWY). `bridge.rs` bez zmian (brak trafień na ID miast). Zero zmian w `data/**`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`.

## 0. Odtworzenie stanu i przeczytane źródła (runda 2)

- Stan odtworzony: `git checkout --detach b91cf606` w worktree `wf_35cb5300-073-3`; `git diff 6d77d02e b91cf606 --stat` = 9 plików (5 kodu/testów + dokument + logi), zgodnie z allowlistą.
- Przeczytane źródła wymagane dispatchem (runda 2, zarzut 2):
  - `p3/P3-20-OWNERREF-CAMPID.md` §2 (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/rust-port/p3/P3-20-OWNERREF-CAMPID.md`). Wzorzec użyty tutaj: tabela „ZMIENIONE / BEZ ZMIANY SYGNATURY (CTOR-WRAP) / POZOSTAWIONE” z kolumną uzasadnienia. Z tego dokumentu przyjęto: wiersz CITY (`ai_turn.rs:579` `city_buildings`, `BarbCityGarrison.city_id`, `BarbCityGarrisonSpawn.city_id`, `BarbUnit.cleared_city_ids`) jako „kandydat P3.21”, oraz zasadę, że CTOR-WRAP nie zmienia sygnatur konstruktorów (C7, C8).
  - `p2/P2-3-ENTITY-IDS.md` §1.1 (ten sam origin): web ID miasta to `string` (`gra/src/game/cities.ts:835` `id: string`, nadawany `'city' + cities.length`); §1.2: Rust `CityId` = newtype `u64` (`rust-port/engine/src/domain/ids.rs:37`). To potwierdza, że ID miast po stronie web są TEKSTEM (patrz C13/C14).
  - `p3/P3-13-GATE-FINAL-CONTROL.md` (ten sam origin), wiersz CITY (linia 129): 7 miejsc, kategoria „P6 — niskie”, zgodne z zakresem tego tematu.
- Dispatch: `dyspozycje/autobot/runs/R-RUSTPORT-P3-21-CITYID-Q1/00-dispatch.md` NIE istnieje w żadnym zdalnym refie: `git ls-tree -r --name-only origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 -- dyspozycje/autobot/runs/R-RUSTPORT-P3-21-CITYID-Q1` i to samo na `origin/rust-port/parity-v2` zwracają puste wyniki. Dispatch jest niecommitowanym plikiem w głównym checkoutcie `/home/user/The-Game/dyspozycje/autobot/runs/R-RUSTPORT-P3-21-CITYID-Q1/00-dispatch.md`. Założenie (nie zweryfikowane commitem): jego treść jest tą samą, którą odczytał Operator i Evaluator z tej kopii.

## 1. Stan wyjściowy — `CityId` już istnieje

- `rust-port/engine/src/domain/ids.rs:37` — `id_type!(CityId)` (newtype `u64`, `#[serde(transparent)]`, jak `PlayerId`/`CampId`/`UnitId`). Eksport: `domain/mod.rs:30` (`pub use ids::{CampId, CityId, OwnerRef, PlayerId, UnitId}`).
- Już na `CityId` przed tym tematem: `types.rs` (`GameState` city ids, `ValidationError`), `state.rs`, `playable.rs:294` (`PlayableCity.id`), `ai_turn.rs:426` (`AiCity.id`), `barbarians.rs:133` (`CitySnapshot.id`), `lib.rs:51` (re-export).

## 2. Tabela decyzji „CityId / bez zmiany”

Kryterium: surowe `u64`/`i64`/`usize`/`u32` jako ID miasta w `rust-port/engine/src/domain/**` (oraz `src/bridge.rs`). Stan PRZED = `6d77d02e`, PO = commit poprawkowy.

| # | Miejsce (PRZED) | Decyzja | Uzasadnienie |
|---|---|---|---|
| C1 | `ai_turn.rs:579` `AiTurnOptions.city_buildings: BTreeMap<u64, BTreeSet<String>>` | ZMIENIONE → `BTreeMap<CityId, _>` | Klucz = ID miasta (`city.id.get()` w starym kodzie). JSON bez zmian: klucz mapy serializuje się jako liczba (test `city_id_map_keys_stay_numeric_in_json`, `tests/city_id.rs`). |
| C2 | `ai_turn.rs:710` `AiCommand::Build { city_id: u64 }` (`cityId`) | ZMIENIONE → `CityId` | Pole komendy AI dla miasta. Serializacja liczbowa bez zmian (transparent). |
| C3 | `ai_turn.rs:865` `choose_city_production(input, city_id: u64)` | ZMIENIONE → `CityId` | Porównanie `city.id == city_id` zamiast `city.id.get() == city_id`. |
| C4 | `ai_turn.rs:870` `choose_production(input, city_id: u64)` | ZMIENIONE → `CityId` | Publiczna ścieżka zachowana, sygnatura typu ID. Brak wywołań poza domeną/testami (grep). |
| C5 | `ai_turn.rs:903` `city_buildings.get(&city.id.get())` | ZMIENIONE → `get(&city.id)` | Konsekwencja C1. |
| C6 | `ai_turn.rs:1060` `Build { city_id: city.id.get() }` | ZMIENIONE → `city_id: city.id` | Konsekwencja C2. |
| C7 | `ai_turn.rs:447` `AiCity::new(id: u64, ..)` | BEZ ZMIANY SYGNATURY (CTOR-WRAP) | Konstruktor owija surowe ID w `CityId::new(id)` (wzorzec P3-20 §2 / P3-4C). |
| C8 | `barbarians.rs:138` `CitySnapshot::new(id: u64, ..)` | BEZ ZMIANY SYGNATURY (CTOR-WRAP) | Jak C7. |
| C9 | `barbarians.rs:198` `BarbUnit.cleared_city_ids: BTreeSet<u64>` | ZMIENIONE → `BTreeSet<CityId>` | Zbiór ID miast. Serde: lista liczb bez zmian (test `barbarian_cleared_cities_round_trip_as_numbers`). |
| C10 | `barbarians.rs:800, 865` `contains(&city.id.get())`, `insert(city.id.get())` | ZMIENIONE → `city.id` | Konsekwencja C9. |
| C11 | `barbarians.rs:917` `BarbCityGarrison.city_id: u64` | ZMIENIONE → `CityId` | ID miasta barbarzyńskiego. JSON liczbowy bez zmian (test `barbarian_city_garrison_json_keeps_numeric_city_id`). |
| C12 | `barbarians.rs:925` `BarbCityGarrisonSpawn.city_id: u64` | ZMIENIONE → `CityId` | Jak C11. |
| C13 | `trade.rs:238` `TradeCity.id: String`; `trade.rs:394` `TradeRoute.id: String`; `trade.rs:396` `from_city_id: String` (`fromCityId`); `trade.rs:398` `to_city_id: String`; `trade.rs:1601` `via_city_id: String` (`viaCityId`); `trade.rs:290–330`, `620`, `872`, `876` funkcje z parametrami `&str` | BEZ ZMIANY (tekst) | Dowód po stronie web (`gra/`, tylko odczyt): `gra/src/game/trade-routes.ts:102` `fromCityId: string`; `gra/src/game/trade-routes.ts:792` `tradeRouteId(fromCityId: string, toCityId: string, …): string` z formatem `` `${fromCityId}->${toCityId}:${medium}` `` (linia 793); `gra/src/game/trade-routes.ts:1845` `viaCityId: string`; `gra/src/game/cities.ts:835` `id: string` (ID miasta). Zmiana na `CityId` zmieniłaby kontrakt JSON (`fromCityId` jako string) i format identyfikatora trasy. Kandydat na osobny temat (ujednolicenie ID miast/tras w kontrakcie). |
| C14 | `diplomacy.rs:2470` i `2574` `capital_city_id: Option<&str>` | BEZ ZMIANY (tekst) | Dowód: `gra/src/game/danina-nazwa.ts:48` `capitalCityId: string \| null \| undefined`; `gra/src/game/diplomacy-basket-transfer.ts:238` (to samo); `gra/src/main.ts:28389` `capitalCityIdForOwner(...): string \| null`. |
| C15 | `diplomacy.rs:2404–2405` `CityResourceState.id: String` | BEZ ZMIANY (tekst) | ID miasta w stanie zasobów; kontrakt web tekstowy (jak C13, `gra/src/game/cities.ts:835`). |
| C16 | `ai_turn.rs:490–491` `ProductionItem.id: String` | BEZ ZMIANY | ID pozycji produkcji (budynek/jednostka), nie miasta. |
| C17 | `trade.rs:1875–1876` `RawTradeParameters.city_economy: BTreeMap<String, RawParamRow>` (`ekonomia_miasta`) | BEZ ZMIANY | Klucze tekstowe z danych JSON (`data/**`), nie ID miasta w stanie gry. Poza zakresem i poza allowlistą danych. |
| C18 | `diplomacy.rs:2455` `cities: Vec<CityResourceState>` | BEZ ZMIANY | Kolekcja struktur (C15), nie ID. |
| C19 | `diplomacy.rs:2489` `donor_indexes: Vec<usize>` | BEZ ZMIANY | Indeksy w wektorze miast, nie ID miasta. |
| C20 | `ai_turn.rs:939` `city_count: usize` | BEZ ZMIANY | Licznik miast, nie ID. |
| C21 | `ai_turn.rs:766` `hex_city_score(…, threat_range: u32)` | BEZ ZMIANY | Nazwa funkcji zawiera „city”, parametry to zasięg/punktacja, nie ID. |
| C22 | `playable.rs:424` `CityId::new(CAPITAL_ID)` | BEZ ZMIANY | Już `CityId`. |
| C23 | `ai_turn.rs` `AiUnit::new(id: u64)`, `barbarians.rs` `BarbUnit::new(id: u64)`, `combat.rs` `id: u64`, `playable.rs:472` `add_player(id: u64)` | BEZ ZMIANY | ID jednostek i gracza, nie miasta (P3-4C §1b). |
| C24 | `barbarians.rs` `BarbCamp::new(id: u64)` | BEZ ZMIANY | ID obozu, `CampId` (P3-20). |
| C25 | `ai_turn.rs:491` / `diplomacy.rs` `ActiveDeal`, `DiplomaticProposal`, `grant.id: String` | BEZ ZMIANY | ID transakcji/grantu, nie miasta. |
| C26 | `state.rs`, `types.rs` `city_ids: Vec<CityId>` | BEZ ZMIANY | Już `CityId`. |

## 3. Binarne kryterium (po zmianie, szerokie zapytanie)

Zapytanie szersze niż w rundzie 1: pojedyncze deklaracje z `cit*`/`cities`, kolekcje (`BTreeSet`/`BTreeMap`/`HashMap`/`HashSet`/`Vec`/`Option`) na typach numerycznych, sygnatury funkcji z `cit*`, deklaracje wieloliniowe. Katalog `rust-port/engine`.

```bash
rg -n -U -i '\bcit(y|ies)\w*\s*:\s*(Option<\s*)?(u64|i64|usize|u32)\b' src/domain src/bridge.rs
rg -n -i '(BTreeSet|BTreeMap|HashMap|HashSet|Vec|Option)<\s*(u64|i64|usize|u32)\s*(,|>)' src/domain src/bridge.rs | rg -i 'cit'
rg -n -U -i 'fn \w*cit\w*\([^)]*\b(u64|i64|usize|u32)\b' src/domain src/bridge.rs
rg -n -U -i '\n\s*\w*cit\w*\s*:\s*(Option<)?(u64|i64|usize|u32)\b' src/domain src/bridge.rs
rg -n -U -i 'cit\w*\s*:\s*(BTreeSet|BTreeMap|Vec|HashMap)<' src/domain src/bridge.rs
```

Wynik po zmianie (linie z terminala, bez zmiany treści; na początku linii numer `(n)` dodany przez Operatora tylko do grupowania wyniku wg zapytań 1–5):

```text
(1) src/domain/ai_turn.rs:939:    city_count: usize,
(2) src/domain/diplomacy.rs:2489:    let mut donor_indexes: Vec<usize> = cities
(3) src/domain/replay.rs:185:    pub fn with_capacity(seed: u32, capacity: usize) -> Self {
    src/domain/replay.rs:320:    pub fn with_capacity(seed: u32, capacity: usize) -> Self {
    src/domain/events.rs:349:    pub fn with_capacity(capacity: usize) -> Self {
    src/domain/ai_turn.rs:766:pub fn hex_city_score(
    src/domain/ai_turn.rs:771:    threat_range: u32,
(4) src/domain/ai_turn.rs:938:    garrisoned: bool,
    src/domain/ai_turn.rs:939:    city_count: usize,
(5) src/domain/barbarians.rs:198: pub cleared_city_ids: BTreeSet<CityId>,
    src/domain/barbarians.rs:934: pub cities: Vec<BarbCityGarrison>,
    src/domain/playable.rs:327:    pub cities: Vec<PlayableCity>,
    src/domain/trade.rs:985:    let city_by_id: BTreeMap<&str, &TradeCity> =
    src/domain/trade.rs:987:    let mut cities_by_owner: BTreeMap<PlayerId, Vec<&TradeCity>> = BTreeMap::new();
    src/domain/trade.rs:1283: let player_cities: Vec<_> = cities
    src/domain/trade.rs:1287: let partner_cities: Vec<_> = cities
    src/domain/trade.rs:1876: pub city_economy: BTreeMap<String, RawParamRow>,
    src/domain/ai_turn.rs:579: pub city_buildings: BTreeMap<CityId, BTreeSet<String>>,
    src/domain/ai_turn.rs:653: pub cities: Vec<AiCity>,
    src/domain/types.rs:262: city_ids: Vec<CityId>,
    src/domain/diplomacy.rs:2455: pub cities: Vec<CityResourceState>,
```

Interpretacja:
- (1)–(4): `city_count: usize` (licznik), `donor_indexes: Vec<usize>` (indeksy), `with_capacity` (pojemności), `hex_city_score(threat_range: u32)` (zasięg). Żadne nie jest ID miasta. Brak surowych ID miast.
- (5): wszystkie trafienia to kolekcje struktur (`Vec<…City…>`) lub już `CityId`, albo teksty (`BTreeMap<&str, _>` w trade, C13; `city_economy` z kluczami JSON, C17).
- Zapytanie z `rg -U` i wielu linii nie znalazło dodatkowych deklaracji z surowym numerem jako ID miasta.

Dla porównania: runda 1 ta sama intencja (ograniczona do `city…: u64`) dawała przed zmianą trafienia `ai_turn.rs:579, 710, 865, 870`, `barbarians.rs:198, 917, 925`. Po zmianie zero.

## 4. Kontrakt JSON / zapisy / parity

- `CityId` jest `#[serde(transparent)]` → każda zmieniona struktura serializuje się identycznie (liczba). Mapy `BTreeMap<CityId,_>` mają liczbowe klucze JSON (test `city_id_map_keys_stay_numeric_in_json`).
- Zmieniono tylko konstrukcje typów; wartości, kolejność (`Ord` jak `u64`) i kształt DTO bez zmian. `parity_suite`, `save_load`, `state_dto`, `ai_turn`, `barbarians` przechodzą bez zmiany oczekiwań (w testach tylko `CityId::new(n)` zamiast literału `n`).
- `bridge.rs`: brak trafień ID miast, bez zmian.
- Testy: NIE osłabiano asercji. Zmiany w testach są wyłącznie konwersjami literałów na `CityId::new(..)`.

## 5. Nowe testy

`rust-port/engine/tests/city_id.rs` — 6 testów (runda 2: usunięto test `player_and_city_ids_are_distinct_types`, który nic nie dowodził; jego asercja `PlayerId::new(3).get() == CityId::new(3).get()` porównywała surowe `u64`):
- `city_id_serializes_as_bare_number`
- `city_id_conversions_round_trip`
- `city_id_ordering_matches_raw_value`
- `city_id_map_keys_stay_numeric_in_json`
- `barbarian_city_garrison_json_keeps_numeric_city_id`
- `barbarian_cleared_cities_round_trip_as_numbers`

Rozróżnienie typów (`PlayerId` ≠ `CityId`) dowodzone kompilatorem, nie runtime. Dowód negatywny (plik tymczasowy `tests/zz_neg_tmp.rs`, usunięty po teście, NIE w commicie):

```text
$ cargo test --manifest-path …/rust-port/engine/Cargo.toml --test zz_neg_tmp --no-run
   Compiling civ-engine v0.1.0 (…/rust-port/engine)
error[E0308]: mismatched types
 --> tests/zz_neg_tmp.rs:4:21
  |
4 |     let _: CityId = PlayerId::new(3);
  |            ------   ^^^^^^^^^^^^^^^^ expected `CityId`, found `PlayerId`
  |            |
  |            expected due to this

For more information about this error, try `rustc --explain E0308`.
error: could not compile `civ-engine` (test "zz_neg_tmp") due to 1 previous error
EXIT=101
```

Brak `From`/`Into` między typami ID (grep: `grep -rn 'impl.*for CityId\|impl.*for PlayerId' rust-port/engine/src/domain/ids.rs` — potwierdzić w rundzie kontroli).

## 6. Surowe wyjścia gate (pełne, `echo EXIT`)

Procedura: cold build, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_35cb5300-073-3` (katalog usunięty przed clippy, więc clippy jest od zimnego cache), cargo w `rust-port/engine`. `Cargo.lock` wygenerowany przez cargo, NIE commitowany.

Pliki logów (surowe, pełne, `git add -f`): `dyspozycje/autobot/runs/R-RUSTPORT-P3-21-CITYID-Q1/fmt.log`, `clippy.log`, `test.log`.

### 6.1 `cargo fmt --check` — plik `fmt.log` (cała zawartość)

```text
EXIT=0
```

### 6.2 `cargo clippy --all-targets -- -D warnings` — plik `clippy.log` (cała zawartość, 20 linii, przebieg zimny)

```text
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
   Compiling serde_core v1.0.229
   Compiling zmij v1.0.23
    Checking once_cell v1.21.4
   Compiling serde v1.0.229
   Compiling serde_json v1.0.154
    Checking tracing-core v0.1.36
    Checking itoa v1.0.18
    Checking memchr v2.8.3
   Compiling syn v3.0.9
   Compiling syn v2.0.119
    Checking pin-project-lite v0.2.17
   Compiling serde_derive v1.0.229
   Compiling tracing-attributes v0.1.31
    Checking tracing v0.1.44
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_35cb5300-073-3/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 37.14s
EXIT=0
```

Wynik: `EXIT=0`, 0 linii `warning` (`grep -c warning clippy.log` → `0`).

### 6.3 `cargo test` — plik `test.log` (cały surowy log, 626 linii)

Plik: `dyspozycje/autobot/runs/R-RUSTPORT-P3-21-CITYID-Q1/test.log`, sha256 `a8cebd6e5a877736948d002f2c086edde985acf575066c9c5b73ebd6a28b700b`, 626 linii, 0 linii `warning`, 0 `FAILED`/`panicked`. Poniżej surowe wiersze `Running`/`test result` z tego pliku (ścieżki binarek w nawiasach usunięte; reszta bez zmian):

```text
     Running unittests src/lib.rs
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/ai_turn.rs
test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/assets_manifest.rs
test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.79s
     Running tests/barbarians.rs
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/bridge_add_player.rs
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/building_costs.rs
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
     Running tests/city_growth.rs
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/city_id.rs
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/combat.rs
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/combat_ai_multipliers.rs
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/data_buildings_tech.rs
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/data_civilizations.rs
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
     Running tests/data_compliance.rs
test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s
     Running tests/data_economy_society.rs
test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/data_loader.rs
test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.31s
     Running tests/data_terrain_map.rs
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/data_units_combat.rs
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
     Running tests/derived_values.rs
test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s
     Running tests/diplomacy.rs
test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
     Running tests/events.rs
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/hex_terrain.rs
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/improvements.rs
test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/map_generator.rs
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
     Running tests/owner_ref.rs
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/parity_suite.rs
test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
     Running tests/pathfinding.rs
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/playable_slice.rs
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/recruitment.rs
test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s
     Running tests/replay.rs
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/resource_production.rs
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/rng.rs
test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/save_load.rs
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/smoke.rs
test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/state_dto.rs
test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/steam_adapter.rs
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/terrain_movement_fix.rs
test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/trade.rs
test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/turn_economy.rs
test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
     Running tests/unit_epoch.rs
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
   Doc-tests civ_engine
test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s
EXIT=0
```

Suma z tych wierszy: `passed=373 failed=0` (baseline 367 + 6 nowych testów w `city_id.rs`; poprzednio w dokumencie błędnie „374 / 7”).

## 7. Commit i blokady

- Commit: patrz SHA w raporcie Operatora (rundy 1 `b91cf606`, runda 2 — poprawkowy). Bez push. Pliki dodane jawnie (`git add` po ścieżkach), bez `-A`; `Cargo.lock` nie commitowany.
- Katalog `CARGO_TARGET_DIR` usunięty po zakończeniu testów.
- DEPLOY/PUSH: NIE WYKONANO.
