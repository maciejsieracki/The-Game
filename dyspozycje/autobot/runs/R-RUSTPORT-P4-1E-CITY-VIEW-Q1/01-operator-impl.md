# R-RUSTPORT-P4-1E-CITY-VIEW-Q1 — Operator (implementacja), runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1E-CITY-VIEW-Q1
GOAL: producent widoku miast w silniku (PlayableState -> OwnerViewDto / CityViewDto / CityBadgeDto z civ-view-model), wartosci zgodne z webem na pinie 07d2fbd72
ZMIANY/COMMIT: allowlista w §1; commit na galezi rust-port-wip/R-RUSTPORT-P4-1E-CITY-VIEW-Q1 (ten raport jest w tym commicie; SHA podaje wynik Operatora)
TESTY: patrz §5 (bramki z kodami wyjscia), mutacje §6
BLOKADY: brak blokad kodu; NIE_ZMIERZONO i wejscia jawne spoza PlayableState w §7
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

Baza: `origin/rust-port/parity-v2` = `a01363d5f` (gałąź robocza `rust-port-wip/R-RUSTPORT-P4-1E-CITY-VIEW-Q1`
utworzona z `a01363d5f` w izolowanym worktree; `git merge-base --is-ancestor a01363d5f HEAD` = 0).
Typy `civ-view-model` NIE były zmieniane (zero zmian w `rust-port/view-model/**`). Kontrakt: `P4-1-RENDER-DTO-CONTRACT.md` §3.4,
§8 wiersz 1E (odczyt z `origin/claude/rust-sivvrn`).

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/city_view.rs` | NOWY: producent (`owner_views`, `city_views`) + porty małych czystych funkcji webu |
| `rust-port/engine/src/domain/mod.rs` | wyłącznie `pub mod city_view;` (alfabetycznie po `city_towers`) |
| `rust-port/engine/Cargo.toml` | wyłącznie `civ-view-model = { path = "../view-model" }` (D-DTO-1 = A) |
| `rust-port/engine/tests/view_city_pin_vectors.rs` | NOWY: testy (wektory z pinu, przypadki graniczne, błędy, round-trip JSON) |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/01-operator-impl.md` | ten raport |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/*` | generator wektorów z pinu (`gen_city_view_vectors.py`, `harness.cjs`, `scenarios.json`) i skrypt mutacji (`mutacje.py`) |

`Cargo.lock` zmienił się lokalnie (nowa zależność ścieżkowa) — NIE commitowany. Zero zmian w `gra/**`, `rust-port/view-model/**`,
`rust-port/renderer/**`, `src-tauri/**`, `bridge.rs`, `playable.rs`, `save_load.rs`, `state.rs`.

## 2. API

- `owner_views(&PlayableState, &CityViewInputs) -> Result<Vec<OwnerViewDto>, CityViewError>` — wszyscy gracze stanu, rosnąco po `OwnerRef`.
- `city_views(&PlayableState, &CityViewInputs) -> Result<Vec<CityViewDto>, CityViewError>` — kolejność `state.cities` (D-DTO-5); `badge` w środku.
- `CityViewInputs` = to, czego `PlayableState` NIE niesie (stan tylko do odczytu; `playable.rs` poza allowlistą):
  `viewer` (fotel), `fog_active`, `visible_hexes`, `cities: BTreeMap<id, CityViewCityFacts>` (kolejka produkcji, `bunt`/`revoltWarning`,
  `oblegane`, `cityGrowthLive`, `startCityState`), `city_states` (`simplifiedDiplomacyOwners`, `typCityCopyOwners`, `clusterCapitalOwnerIds`),
  `item_stock_cost` (callback `productionItemStockCostForRender`).
- Brak danych = jawny błąd, nie cicha wartość: `MissingCityFacts`, `UnknownOwner` (właściciel/widz spoza `players`; web spadłby na `'grecy'`),
  `IdOutOfRange` (> 2^53−1), `NonFiniteGrowth` (NaN/Inf nie przejdzie przez JSON), `Epoch`, `CivsData`.

## 3. Pole → źródło webu (pin `07d2fbd72`) → źródło Rust

Najpierw przeczytany web, potem Rust. `cities.ts` = `gra/src/render/cities.ts`, `main.ts` = `gra/src/main.ts`.

### OwnerViewDto

| Pole | Web | Rust |
|---|---|---|
| `ownerId` | `City.ownerId` | `PlayablePlayer.id` → `OwnerRef::Player` |
| `color` | `ownerColorFn: civColorFn` (`main.ts:2978`, `:4049-4051`) → `civColorForOwner` (`game/civ-visual.ts:59-70`) → `parseHexColor` (`:22-31`), paleta `OWNER_COLORS_FALLBACK` (`:8-17`) | `civ_color_for_owner` + `parse_hex_color` (port), dane `engine/data/civs.json` |
| `civIconId` | `getCivIconId: civTypeForOwner` (`main.ts:2983`, `:4031-4047`) | `PlayablePlayer.civilization` (konwencja `turn_war_inputs.rs:390`) |
| `bronzeCiv` | `getCiv: ikonaIdToBronzeCiv(civTypeForOwner)` (`main.ts:2955`; `render/bronzeCity.ts:23-40`) | `ikona_id_to_bronze_civ` (port tabeli) |
| `era` | `getEra: empireEpochForOwner` (`main.ts:2949`, `:2419-2422`) | `empire_epoch_for_owner` + `owner_era_facts` + `game_start_era` (`turn_war_epoch.rs`) |
| `isCityState` | `isCityStateOwner: portraitForceCultureIcon` (`main.ts:2989`, `:10442-10449`) → `shouldForceCultureIconForOwner` (`game/display-names.ts:110`) z `ownerCityStateOpts()` (`main.ts:10388-10394`) | `should_force_culture_icon_for_owner` (`state.rs:1270`) z `CityStateFacts` + `startCityState` miast |
| `isBarbarian` | `isBarbarian(ownerId)` (`game/barbarians.ts:54`; resolver `main.ts:10380`) | `false` (gracze `PlayableState` mają `PlayerId ≥ 0`) |
| `ringHex` | `isBarbarian ∨ portraitForceCultureIcon ? null : civRingHexFn` (`main.ts:10381-10383`, `:4080-4082`) | `ring_hex(color)` = `#rrggbb` |
| `displayName` | `getCivDisplayName: civDisplayNameForOwner` (`main.ts:2996`, `:10451-10466`) | `civ_display_name` (port; `ikonaId` ∨ `typCywilizacji`) |
| `mapOutlineKind` | `getMapOutlineKind: cityMapOutlineKindForOwner` (`main.ts:2972`, `:22659-22672`; `isAllianceDealKind` `:22653-22656`; `dealInvolvesOwners` `:22679-22682`) | `map_outline_kind`: `war.diplomacy.relation` + `war.diplomacy.deals` (`sojusz_wojskowy` → `FullAlliance` przez alias serde = `normalizeTreatyKind`) |
| `capitalCityId` | `getCapitalCityId: capitalCityIdForOwner` (`main.ts:2995`, `:34999-35003`) → `oldestCityOfOwner` (`game/capital-capture.ts:73-85`) | `capital_city_id_for_owner`: pierwsze miasto z `is_capital` (konwencja `war_world_view.rs:103`), inaczej najmniejszy `CityId` |
| `relationToViewer` | `relationColorFn` (`main.ts:4065-4068`): `isMe` → `self`, inaczej `getDiploRelation(ME(), o).status` (`:10312-10335`; brak pary = `defaultNeutralRelation` `'neutralni'`, `game/diplomacy-layers.ts:214-221`) | `relation_to_viewer` |

### CityViewDto

| Pole | Web | Rust |
|---|---|---|
| `id`, `ownerId`, `hex` | `City.id` (`'city'+N`), `City.ownerId`, `City.q/r` | `PlayableCity.id/owner_id/position` (`PositionDto(x,y) ≡ (q,r)`, kontrakt §1.4) |
| `population` | `City.population` | `PlayableCity.population` (`u32` → `f64`) |
| `level` | `getLevel` (`main.ts:2956-2959`): `max(1, min(10, population ?? 1))` | `population.clamp(1, 10)` |
| `wallKind` | `getWallKind` (`main.ts:2961-2966`): `cityFortificationKind(cityBuilt)` (`game/city-fortification.ts:29`), `'mur'→'stone'` | `city_fortification_kind(stores.buildings_by_city)` (`siege_city_fortification.rs:35`) + `wall_kind_of` |
| `revolt` | `getRevolt` (`main.ts:2967-2970`): `bunt === true ∨ revoltWarning === true` | `order_bunt ∨ order_revolt_warning` (wejście) |
| `besieged` | `c.oblegane` (`main.ts:17493`) | `CityViewCityFacts.besieged` (wejście) |
| `fogVisible` | `cityFogVisible` (`main.ts:13082-13086`) bez filtra panelu miasta (stan UI) | `!fog ∨ owner == viewer ∨ visible(q,r)` |
| `unitCountOnHex` | `unitCountOnHex` (`main.ts:2901-2907`) | liczba `state.units` na pozycji miasta |

### CityBadgeDto (`_buildBadgeInput`, `cities.ts:875-931`, bez `hoverExpanded`/`lodLevel`)

| Pole | Web | Rust |
|---|---|---|
| `cityName` | `_cityMapLabel` (`cities.ts:862-873`) → `formatCityMapLabel` (`game/display-names.ts:171`) | `format_city_map_label` (`state.rs:1306`) z `viewer`, `isCapital`, `displayName`, `isCityState`, `startCityState` |
| `population` | `city.population ?? 1` | `PlayableCity.population` |
| `defenseTier` | `defenseTierFromWallKind(wallKind)` (`render/cityMapStatChip.ts:379-383`) | `defense_tier` |
| `civIconId` | `getCivIconId(ownerId) ?? 'grecy'` | jak `OwnerViewDto.civIconId` |
| `ownerColor` | `(ownerColorFn ?? ownerColor)(ownerId)` | jak `OwnerViewDto.color` |
| `prodActive` | `front !== null && prod?.wstrzymana !== true` | `front_item` (`production_queue.rs:28`) + `wstrzymana` |
| `prodKind`, `prodId`, `prodItemName` | `front?.kind/id/nazwa ?? null` | z `front_item` |
| `prodCategoryLabel` | `front ? (budynek ? 'Budynek' : 'Jednostka') : null` | jw. |
| `prodPaused` | `prod?.wstrzymana === true` | `wstrzymana == Some(true)` |
| `growthPercent`, `growthStarving` | tylko miasta `playerOwnerId` (`cities.ts:904`): `getCityGrowth` = `cityGrowthLive` (`main.ts:3003`; `ui/cityPanel.ts:1687-1720`) → `procentNaTure`, `!nakarmione` | `CityGrowthLive` (wejście), bramka `owner == viewer` |
| `resourceWarning` | `front` ∧ koszt niepusty → `!canAffordBuildingStock(ownerSurowcePoolFor, koszt)` (`main.ts:2985-2986`, `:9874-9885`; `game/building-stock-cost.ts:115`, `:200`) | `owner_resource_stock_all` (`economy.city_stock`) + `can_afford_building_stock` (`building_costs.rs:582`) + `item_stock_cost` |
| `isCityState` | `isCityStateOwner ?? false` | jak owner |
| `era` | `getEra ?? 1` | jak owner |
| `isCapital` | `_isCapitalCity` (`cities.ts:855-859`): miasto-państwo → `false`, inaczej `capId === city.id` | jw. |

## 4. Wektory z pinu (nie ręczne liczby)

`gen/gen_city_view_vectors.py`: `git archive 07d2fbd72 gra/src gra/data` do katalogu tymczasowego, `tsc` (CommonJS, źródło pinu
bez zmian) dla 11 plików, `node gen/harness.cjs`. Wykonywany kod pinu: `CityRenderer.prototype._isCapitalCity / _cityMapLabel /
_buildBadgeInput` (wołane dokładnie jak w `_syncStatChip`, `cities.ts:944-946`), `formatCityMapLabel`, `shouldForceCultureIconForOwner`,
`frontItem`, `canAffordBuildingStock`, `ownerResourceStockAll`, `cityFortificationKind`, `civColorForOwner`, `ikonaIdToBronzeCiv`,
`oldestCityOfOwner`, `normalizeTreatyKind`, `isBarbarian`, `data/civs.json` pinu. Zaślepka tylko dla modułu `three`
(sprawdzane w teście: `stubbedModules == ["three"]`). Klej `main.ts` (`_cityRenderOpts` i funkcje wołane z niego) jest w harnessie
PRZEPISANY z numerami linii — `main.ts` (47 448 linii, DOM, zamknięcia startu gry) nie daje się załadować w node; to jedyna część
niewykonywana z pinu.

Scenariusze (`gen/scenarios.json`, wejścia; wartości oczekiwane liczy pin): 3 scenariusze, 1+8+5 = 14 właścicieli, 1+10+7 = 18 miast:
- `start_jedno_miasto_bez_kolejki` — brak kolejki produkcji, brak wzrostu (`null`), miasto bez budynków;
- `wielu_wlascicieli_mgla` — mgła (miasto ukryte/widoczne/własne), relacje `wojna/pokoj/sojusz/brak`, sojusz z umowy
  (`sojusz_defensywny` i legacy `sojusz_wojskowy`), NAP (nie-sojusz), miasto-państwo osobno przez `startCityState` (Sparta)
  i osobno przez `simplifiedOwners` (Hattusa),
  nieznana cywilizacja (`player-4`: paleta zapasowa, `displayName = null`, `bronzeCiv = grecja`), stolica zapasowa = najstarsze
  (bez `is_capital`), palisada/mur/fort/`mury_kamienne`, populacja 0 i 12 (poziom 1 i 10), kolejka wstrzymana pusta i niepusta,
  ostrzeżenie surowców prawda/fałsz, pusty koszt, głód, wzrost obcego miasta ignorowany, bunt/ostrzeżenie buntu, oblężenie,
  2 jednostki na heksie miasta;
- `hotseat_drugi_fotel_bez_mgly_braz` — widz = fotel 1 (nie 0), epoka `braz` (era 2), reguła ikony kultury
  (ten sam klucz cywilizacji co widz → miasto-państwo; wyjątek `clusterCapitalOwnerIds`; `typCopyOwners`), miasto fotela 0
  ze `startCityState` widziane z fotela 1 (etykieta zależy od widza — Neapol).

`python3 -I …/gen/gen_city_view_vectors.py --check` → `OK: blok wektorow zgodny z pinem 07d2fbd72` (exit 0).

Dane: `engine/data/civs.json` pochodzi z `edb8fb56`; porównane z `07d2fbd72` dla pól czytanych tu (`ikonaId`, `typCywilizacji`,
`Cywilizacja`, `kolorHex`, 15 wierszy) — identyczne (skrypt w raporcie, §8). Wektory używają `civs.json` pinu, więc zgodność testu
jest też dowodem zgodności danych w tych polach.

## 5. Testy i bramki

`CARGO_TARGET_DIR` poza repo (scratchpad), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, w `rust-port/engine`:

| Bramka | Wynik | Kod wyjścia |
|---|---|---|
| `cargo fmt --check` | czysto | 0 |
| `cargo clippy --all-targets -- -D warnings` | `Finished`, 0 ostrzeżeń | 0 |
| `cargo test --all-targets` (pełny, zmiana zależności) | 3392 passed, 0 failed, 1 ignored (istniejący `e2e::dump_tick1_econ_for_web_generator`, nie z tego tematu) | 0 |
| `cargo test --test view_city_pin_vectors` | 11 passed, 0 failed, 0 ignored | 0 |
| `git diff --check` | czysto | 0 |
| `gen_city_view_vectors.py --check` | `OK: blok wektorow zgodny z pinem 07d2fbd72` | 0 |

Testy `tests/view_city_pin_vectors.rs` (11): 3 scenariusze pinu (struktury równe po deserializacji oczekiwanych wartości do DTO
z `deny_unknown_fields` + równość zbiorów kluczy JSON), pokrycie gałęzi przez wektory, round-trip JSON zwróconych typów, błędy
(`MissingCityFacts`, `UnknownOwner` właściciela i widza, `IdOutOfRange` 2^53, `NonFiniteGrowth` dla miasta widza; NaN obcego
miasta ignorowany jak w pinie). Brak `#[ignore]`, brak osłabionych asercji. `#![forbid(unsafe_code)]` w nowym module; w
`view-model` nienaruszone.

## 6. Test mutacji

`gen/mutacje.py`: 26 mutacji, każda zmienia jedno wyliczenie w `city_view.rs`, uruchamia `cargo test --test view_city_pin_vectors`,
przywraca plik (po przebiegu `cmp` z kopią sprzed przebiegu = identyczne).

Przebieg 1 (24 mutacje, pierwsza wersja scenariuszy): 22 zabite, **2 przeżyły** — `player_owner_id: None` (etykieta bez widza:
żaden wektor nie miał miasta ze `startCityState` obcego dla widza ≠ 0) i `simplified_owners: None` (jedyny właściciel w
`simplifiedOwners` był miastem-państwem także przez `startCityState`). Naprawione wektorami, nie osłabieniem: dodane miasto
Neapol (fotel 0, `startCityState`, widz 1) i właściciel 7 (Hattusa) wyłącznie w `simplifiedOwners`; Sparta została tylko przy
`startCityState`; dodane 2 mutacje (`typ_copy_owners: None`, `cities: None`). Wektory przeliczone generatorem z pinu.

Przebieg 2 (kod końcowy): **26/26 zabitych, 0 przeżyło**, exit 0. Każdy mutant: `cargo test` exit 101. Lista:
defenseTier 2→1; mur→palisada; prodActive bez wstrzymania; wzrost dla obcych; stolica miasta-państwa; poziom min 0; sojusz z umowy
pominięty; ringHex dla miasta-państwa; mgła ukrywa własne miasto; ostrzeżenie odwrócone; pokoj→neutralni; stolica zapasowa =
najmłodsze; bunt `||`→`&&`; brąz słowian; jednostki na heksie `!=`; etykieta bez widza; miasto-państwo bez simplified / bez
typCopy / bez startCityState; kolor bez kolorHex; prodPaused zawsze false; growthStarving odwrócone; oblężenie pominięte; warunek
pustego kosztu odwrócony; epoka startu ignorowana; displayName pominięte.

## 7. NIE_ZMIERZONO / wejścia jawne / założenia

1. **`growthPercent`** — producent webu `cityGrowthLive` → `computeView` panelu miasta (`ui/cityPanel.ts:1687-1720`, z cache
   `getCachedMaxSafePoziomRacji`) NIE jest portowany; `PlayableState` nie symuluje wyżywienia. Producent przyjmuje gotowy
   `CityGrowthLive`. `compute_growth_percent_v85` (`city_growth.rs`) jest jednym z jego składników, ale wejść (`computeView`) w stanie brak — NIE_ZMIERZONO.
2. **Wejścia spoza `PlayableState`** (jawne, nie domyślne): kolejka produkcji (`cityProd`), `cityOrderState` (`bunt`, `revoltWarning`),
   `oblegane`, `startCityState`, zbiory miast-państw, `currentVisible()` (temat P4-1C), koszt surowcowy pozycji kolejki.
3. **`productionItemStockCostForRender`** (`main.ts:9879-9885`: `buildingStockCost(buildings.json)` / `unitStockCost(units.json)`) —
   podawany callbackiem; wyszukiwanie w danych nie jest portowane w tym temacie (dryf `units.json`, zadanie #27).
4. **Epoka właściciela** — `PlayableState` nie niesie epok: człowiek = epoka startu (`EpochSource::DerivedFromStartEra`), AI =
   `gameStartEra()` (fallback jak web przy braku wpisu `ownerEraByOwner`). Luka odziedziczona z WIRE-WAR-EPOKA.
5. **Barbarzyńcy / rebelianci** — `PlayableState` nie ma miast ani graczy `-1`/`-99`; `OwnerViewDto` dla nich nie powstaje,
   `isBarbarian` zawsze `false`. Luka `civIconId` barbarzyńców z P4-1A pozostaje otwarta.
6. **ZAŁOŻENIE**: web `cityFoundOrder('city'+N) = N` ↔ `CityId = N` (gałąź stolicy zapasowej). Wektor pinu potwierdza na `city5`/`city7`.
7. **ZAŁOŻENIE**: `civTypeForOwner` = `PlayablePlayer.civilization` (bez `_menuCivIdByOwner`/`aiOwnerCivMap`); nieznany właściciel = błąd
   zamiast `'grecy'`.
8. `IKONA_TO_BRONZE[...]` w JS dla kluczy prototypu (`constructor`, `toString`) zwraca funkcję, nie `'grecja'`; Rust zwraca `'grecja'`.
   Nieosiągalne dla kluczy z `civs.json`; NIE_ZMIERZONO poza nimi.
9. Kolejność `owners[]` dla wartości `OwnerRef` innych niż gracze — nie dotyczy (brak w stanie).
10. Klej `main.ts` w harnessie = przepis (nie wykonanie) — §4.

## 8. Metoda (komendy)

- `git fetch origin claude/rust-sivvrn rust-port/parity-v2`; `git show origin/claude/rust-sivvrn:…/00-dispatch.md`;
  `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md`.
- `git checkout -b rust-port-wip/R-RUSTPORT-P4-1E-CITY-VIEW-Q1 a01363d5f`.
- Web: `git archive 07d2fbd72 gra/src | tar -x` do scratchpadu; `sed -n` / `grep -n` dla linii cytowanych w §3.
- `civs.json`: `git show 07d2fbd72:gra/data/civs.json` vs `rust-port/engine/data/civs.json`, porównanie 4 pól × 15 wierszy w Pythonie → 0 różnic.
- Wektory: `python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/gen_city_view_vectors.py` (`--check`); `tsc` 6.0.2, node v22.23.4.
- Mutacje: `python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/mutacje.py`.
