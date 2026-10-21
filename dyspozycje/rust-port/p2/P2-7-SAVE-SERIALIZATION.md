# P2.7 — Katalog kształtu zapisu stanu gry: web vs `rust-port/engine`

**Temat:** `R-RUSTPORT-P2-7-SAVE-SERIALIZATION-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Status:** katalog faktów, NIE decyzja projektowa o formacie docelowym (decyzja w P2.2/P2.11).

**Piny:**
- web: `main` = `edb8fb56` (odczyt `git show edb8fb56:gra/src/...`).
- Rust: `rust-port/parity-v2` = `9e33fc77` (odczyt `git show rust-port/parity-v2:rust-port/engine/src/...`).

## 1. Ścieżka serializacji po stronie web

| Krok | Miejsce (`edb8fb56`) | Rola |
|---|---|---|
| Typ `SaveGame` | `gra/src/game/save.ts:336` | interfejs zapisu (pola opcjonalne i wymagane) |
| Wersja formatu | `gra/src/game/save.ts:116` | `SAVE_VERSION = 3` (bez migracji v2→v3, komentarz `save.ts` ~l.105-115) |
| Budowa snapshotu | `gra/src/main.ts:30415` `buildSaveGameSnapshot` | jedyne miejsce składające obiekt zapisu (literał obiektu, l.30476-30682) |
| Serializacja JSON | `gra/src/game/save.ts:520` `serializeGame` | `SaveGame → string` |
| Deserializacja | `gra/src/game/save.ts:666` `deserializeGame` | czyta **wszystkie 22** top-level kluczy (l.666-735); `meta` przekazywane w całości (`save.ts:724`, `meta: obj.meta`), bez whitelisty pól wewnątrz `meta` |
| Trwały magazyn | `save.ts` header + `idb-storage.ts` | IndexedDB (nowe zapisy), fallback localStorage pod tym samym kluczem |
| Odtworzenie stanu | `gra/src/main.ts:38334` `restoreGameFromSave` | czyta `saved.meta?.*` m.in. l.38744-38745 (forced-war), l.39057-39059 (`pendingDiplomacyInbox`) |

## 2. Pełna lista top-level kluczy stanu web (22) z dowodem i statusem w Rust

Status: **OK** = odpowiednik istnieje w Rust *w strukturze kompilowanej do crate `civ_engine`*; **CZĘŚCIOWO** = istnieje pole/typ o zbliżonej roli, bez pełnego zakresu pól; **BRAK** = brak odpowiednika w żadnej strukturze serializowalnej Rust.

| # | Klucz (web) | Dowód web (`main.ts` l. / typ) | Odpowiednik Rust (`parity-v2`) | Status |
|---|---|---|---|---|
| 1 | `wersja` | 30478 (`SAVE_VERSION`=3) | `SaveSnapshot.version` (u16, `CURRENT_SNAPSHOT_VERSION = 2`, `domain/save_load.rs`) | CZĘŚCIOWO (inna numeracja: 2 vs 3) |
| 2 | `tura` | 30479 | `GameStateDto.turn: TurnDto` (`domain/state.rs`) | CZĘŚCIOWO |
| 3 | `seed` | 30480 | `StartGameParams.seed: u32` (`domain/playable.rs:103`, derive Serialize/Deserialize), zagnieżdżone w `PlayableState.params` (`playable.rs:324`); poza `GameStateDto`/`SaveSnapshot`. Osobno `ReplayLog.seed` (`domain/replay.rs:140`) | CZĘŚCIOWO |
| 4 | `units` | 30481 (`RuntimeUnit[]`) | `GameStateDto.units: Vec<UnitDto>`; `UnitDto` = id, owner_id, kind (Settler/Warrior/Scout), position (`domain/types.rs:404-420`) | CZĘŚCIOWO (4 pola; zakres pól web nie porównywany w tym temacie) |
| 5 | `cities` | 30482 (`City[]`) | `GameStateDto.cities: Vec<CityDto>`; `CityDto` = id, owner_id, name, position, population (`types.rs:327-335`) | CZĘŚCIOWO |
| 6 | `exploredByHuman` | 30483 | brak | BRAK |
| 7 | `gracze` | 30484 (`GraczSaveV3[]`, skarbiec/ekonomia per właściciel) | `PlayablePlayer` = id, name, civilization, is_human (`domain/playable.rs:284-289`); brak skarbca/ekonomii. (`CivilizationDto` `types.rs:257-265` bez pól gracza) | CZĘŚCIOWO (korekta własna: wcześniej BRAK) |
| 8 | `humanOwnerIds` | 30485 | `PlayablePlayer.is_human: bool` (`playable.rs:288`, derive Serialize/Deserialize, eksport `lib.rs:27-31`); brak listy/zbioru ID ludzkich właścicieli | CZĘŚCIOWO |
| 9 | `activeHumanOwnerId` | 30486 | brak. Dowód zerowy: `git grep -niE 'active_human'` i `'human_owner'` na `rust-port/parity-v2 -- rust-port` = 0 trafień (`is_human` tylko: `playable.rs:288,421,480`, `bridge.rs:344`, `tests/playable_slice.rs:28`) | BRAK |
| 10 | `autoMarch` | 30487 | brak | BRAK |
| 11 | `plannedMarches` | 30488 | brak | BRAK |
| 12 | `rallyPoints` | 30489 | brak | BRAK |
| 13 | `cityProd` | 30490 | brak (`resource_production.rs`, `turn_economy.rs` nie są w DTO) | BRAK |
| 14 | `cityBuilt` | 30491 | brak | BRAK |
| 15 | `aiResearchDone` | 30492 | brak | BRAK |
| 16 | `diploRelations` | 30493 | `Relation` (`diplomacy.rs:104`) i `DiplomacyState` (`diplomacy.rs:1611`), oba derive Serialize/Deserialize; poza `GameStateDto` | CZĘŚCIOWO (korekta własna: wcześniej BRAK) |
| 17 | `tradeRoutes` | 30494 | `TradeRoute` (`trade.rs:392`, derive Serialize/Deserialize); poza `GameStateDto` | CZĘŚCIOWO (korekta własna: wcześniej BRAK) |
| 18 | `meta` | 30495-30671 (94 pozycje, sekcja 3) | brak kontenera `meta` w Rust. Wartości per-klucz: `DiploPairMeta` (`diplomacy.rs:1189-1190`, derive Serialize/Deserialize) dla `diplomacyPairMeta`; `BarbCamp` (`barbarians.rs:153`, derive) dla `barbCamps` | BRAK (kontener); CZĘŚCIOWO dla 2 kluczy |
| 19 | `mapQuality` | 30672 | brak (pole renderu/UI) | BRAK (POZA DOMENĄ, do klasyfikacji w P2.2) |
| 20 | `renderQuality` | 30673 | brak (pole renderu/UI) | BRAK (POZA DOMENĄ) |
| 21 | `mapDetailQuality` | 30674 | brak (pole renderu/UI) | BRAK (POZA DOMENĄ) |
| 22 | `mapSnapshot` | 30682 (`serializeMapForSave(map)`) | `MapDto { width, height, tiles: Vec<TileDto> }` (`types.rs:172-178`) | CZĘŚCIOWO (struktura istnieje; format kolumnowy web nie porównywany polem po polu) |

Uwaga: `save.ts` deklaruje też pola opcjonalne `explored` (ok. l.387), `gracz` (ok. l.390), `cityProd` (ok. l.396), `cityBuilt`, `mapSnapshot` (ok. l.455) i inne (interfejs `SaveGame`, `save.ts:336-~460`); builder `main.ts` ich nie ustawia poza wymienionymi w tabeli. Źródłem prawdy dla kształtu zapisu jest literał z `buildSaveGameSnapshot` (l.30476-30682).

## 3. Sekcja `meta` (kompletna lista kluczy web, `main.ts:30495-30671`)

Liczba pozycji: **94** (89 wpisów `klucz: wartość` + 5 skróconych `klucz,` — `savedAt`, `playerPracaPool`, `veteranEnemyEducationShown`, `negotiationSeq`, `clusterPlacement`), weryfikacja: 10-spacjowe wcięcie w zakresie `main.ts:30495-30671`. (Wcześniej błędnie „~88”.)

Status w Rust: kontener `meta` **nie istnieje** (żadna struktura nie zbiera tych pól). Per klucz: **CZĘŚCIOWO** dla `diplomacyPairMeta` (`DiploPairMeta`, `diplomacy.rs:1190`) i `barbCamps` (`BarbCamp`, `barbarians.rs:153`); dla pozostałych **BRAK** — ale dowód zerowy (§8) obejmuje tylko wymienione tam stemy. Pozostałe klucze BRAK są **do potwierdzenia per klucz w P2.2** (trafienia grep dla stemów takich jak `siege`, `wiarygod`, `relig`, `skarbiec`, `improvement` nie zostały sklasyfikowane w tym temacie).

`label` 30496 · `savedAt` 30497 · `saveOrigin` 30498 · `newGameParams` 30499 · `loadMapSize` 30502 · `loadTypSwiata` 30503 · `loadCivId` 30504 · `loadLandFraction` 30505 · `empireFoodStates` 30506 · `goldDeficitStates` 30507 · `ownerDefaultPodzialHandlu` 30508 · `ownerDefaultPodzialPracy` 30511 · `ownerDefaultOkolicaFocus` 30514 · `ownerDefaultBudowaProfil` 30515 · `ownerDefaultPoziomRacji` 30518 · `ulepszeniaEmpireByOwner` 30519 · `mennicaZlotoGrace` 30520 · `playerPracaPool` 30521 · `budowaListaBiblioteka` 30522 · `siegeTurnByCity` 30527 · `siegeBesiegerByCity` 30528 · `siegeAiStateByKey` 30529 · `pendingDiplomacyInbox` 30530 · `interHumanDiplomacyInbox` 30532 · `aiOneShotGiftLastTurn` 30533 · `aiTradeAgreementLastProposalTurn` 30534 · `aiAiTradeAgreementLastTurn` 30535 · `aiResourceTradeLastProposalTurn` 30536 · `aiAudienceLastRequestTurn` 30537 · `diplomaticContactEstablished` 30540 · `diplomaticallyDiscoveredOwners` 30544 · `diplomaticDiscoveryPopupShown` 30548 · `veteranEnemyEducationShown` 30552 · `diplomacyDeals` 30553 · `negotiationTable` 30556 · `negotiationSeq` 30557 · `rejectedOfferCooldowns` 30558 · `diplomacyPairMeta` 30559 · `diplomacyFactorLog` 30560 · `wiarygodnoscZdarzeniaByOwner` 30565 · `wiarygodnoscStrumienByOwner` 30566 · `wiarygodnoscOstatniaWojnaTuraByOwner` 30570 · `wiarygodnoscP4MilestonesByOwner` 30571-30572 · `wiarygodnoscN7ActivePairs` 30572 · `aiOwnerCivMap` 30573 · `ownerDisplayName` 30574 · `zlozeGrants` 30575 · `surowiecBooleanGrants` 30576 · `battlePowerPtsByOwner` 30577 · `capitalCityIdByOwner` 30578 · `aiSkarbiecByOwner` 30581 · `aiTargetMemoryByOwner` 30582 · `aiPracaPoolByOwner` 30583 · `aiNaukaPoolByOwner` 30584 · `aiBadanaByOwner` 30585 · `aiSurplusRedirectedOwners` 30594 · `aiSliderStateByOwner` 30601 · `zdobyczePowerByOwner` 30602 · `bronzeForceWarPendingOwners` 30606 · `bronzeEraEnterTurnByOwner` 30611 · `bronzeForceWarCycleOwners` 30612 · `bronzeForceWarRestUntilByOwner` 30613 · `bronzeForceWarActiveByPairKey` 30614 · `regularWarCapturedByPairKey` 30618 · `stoneForceWarPendingOwners` 30619 · `stoneForceWarCycleOwners` 30620 · `stoneForceWarRestUntilByOwner` 30621 · `stoneForceWarActiveByPairKey` 30622 · `ironForceWarPendingOwners` 30623 · `ironEraEnterTurnByOwner` 30628 · `ironForceWarCycleOwners` 30629 · `ironForceWarRestUntilByOwner` 30630 · `ironForceWarActiveByPairKey` 30631 · **`forcedWarWavesByPairKey` 30634** · `lootedVillageHexKeys` 30635 · `eliminatedOwners` 30636 · `ownerEraByOwner` 30637 · `ownerStartEraByOwner` 30638 · `placedImprovements` 30639 · `fortNodes` 30645 · `hexClearingStates` 30646 · `pendingImprovementsTurn` 30647 · `completedWorldWonders` 30648 · `placedWorldWonders` 30649 · `wonderBuildSites` 30650 · `simplifiedDiplomacyOwners` 30654 · `foreignTypeOwners` 30655 · `typCityCopyOwners` 30656 · `clusterCapitalOwnerIds` 30657 · `clusterPlacement` 30658 · `barbCamps` 30661 · `clearedBarbCampHexes` 30665 · `cityRelig` 30669 · `autoManageCities` 30670.

Uwaga: pozycje `wiarygodnosc*P4*`/`N7` (30571-30572) i `veteranEnemyEducationShown`, `negotiationSeq`, `playerPracaPool` są w tym samym literale; ich numery linii podano orientacyjnie (przecinające się wpisy wieloliniowe) — dowód = zakres `main.ts:30495-30671`.

## 4. Gap `meta.forcedWarWavesByPairKey` — potwierdzenie wprost (nie z audytu)

**Web (`edb8fb56`), TAK, pole istnieje:**
- Deklaracja stanu: `gra/src/main.ts:2013` — `const forcedWarWavesByPairKey = new Map<string, ForcedWarWaveState>();`
- Zapis: `gra/src/main.ts:30634` — `forcedWarWavesByPairKey: serializeForcedWarWaves(forcedWarWavesByPairKey)`, w `meta` (sekcja 3).
- Serializer: `gra/src/game/forced-war-waves.ts:237-245` — `Array<[string, ForcedWarWaveState]>` (klucz pary + stan).
- Odczyt: `gra/src/game/forced-war-waves.ts:247` `restoreForcedWarWaves`; użycie `gra/src/main.ts:38744-38745`.
- Kształt (`forced-war-waves.ts`):
  - `ForcedWarWaveState` (l.27-31): `{ nextWaveId: number; waves: ForcedWarWave[]; history: ForcedWarWaveHistory[] }`.
  - `ForcedWarWave` (l.9-17): `id: string; targetCityId: string; unitIds: readonly string[]; originHex: {q,r}; rallyPoint: {q,r}; approachSector: number; createdTurn: number`.
  - `ForcedWarWaveHistory` (l.19-26): pola `targetCityId, originHex, rallyPoint, approachSector, createdTurn` (restore nie odtwarza `id`/`unitIds` w historii).
  - Przy wczytaniu wpisy bez poprawnych pól są odrzucane (filtr w `restoreForcedWarWaves`).

**Rust (`rust-port/parity-v2`), NIE, brak odpowiednika:**
- `git grep -i forced` w `rust-port/` daje wyłącznie trafienie `enforced` w `rust-port/engine/tests/smoke.rs:21` (fałszywy trafienie słowa). Brak struktury, pola ani funkcji związanej z forced-war/fale.
- Brak typu meta w jakiejkolwiek strukturze serializowalnej Rust.

**Wniosek:** gap potwierdzony wprost na kodzie obu pinów. Kształt pola jak wyżej; Rust: BRAK.

## 5. Stan serializacji po stronie Rust (`parity-v2`) — co faktycznie istnieje

Anty-halucynacyjnie: serializacja w Rust **istnieje**, rozproszona, z `#[derive(Serialize, Deserialize)]`:
- `domain/state.rs:6-9` `GameStateDto` (`#[serde(try_from = "RawGameStateDto")]`): `map, civilizations, cities, units, turn`.
- `domain/save_load.rs` `SaveSnapshot` (`#[derive(Serialize)]`, custom `Deserialize`): `version, state, event_queue, rng`; wersja 1 → migracja (`migrate_v1`), wersja 2 = aktualna; inne wersje odrzucane.
- `domain/types.rs`: `PositionDto`, `TileDto`, `MapDto`, `CivilizationDto`, `CityDto`, `UnitDto`, `UnitKindDto` (Serialize/Deserialize).
- `domain/session.rs:43-44` `GameState { turn, players }`, `domain/player.rs:6-7` `Player { id, name }` (Serialize/Deserialize).
- `domain/replay.rs` używa `SaveSnapshot` (pole `snapshot: Option<SaveSnapshot>`).
- `domain/playable.rs` (12 wystąpień derive Serialize/Deserialize, eksport `lib.rs:27-31`): `PlayableState` (`playable.rs:321`, `#[serde(rename_all="camelCase")]`, „state DTO sent to the Tauri frontend”) zawiera `state_version, session_id, params: StartGameParams, map, players: Vec<PlayablePlayer>, cities: Vec<PlayableCity>, units: Vec<PlayableUnit>, selected_unit_id, turn, phase, last_advanced_phases, status`. To DTO UI/Tauri, NIE format zapisu `SaveSnapshot`; traktowane jako źródło odpowiedników w §2 (seed, gracze, humanOwnerIds, tura, units, cities).
- Typy domenowe z serde będące analogami kluczy web (nie wchodzą do `GameStateDto`/`SaveSnapshot`): `Relation` (`diplomacy.rs:104`), `DiplomacyState` (`diplomacy.rs:1611`), `ActiveDeal` (`diplomacy.rs:1441`), `DiploPairMeta` (`diplomacy.rs:1190`), `TradeRoute` (`trade.rs:392`), `BarbCamp` (`barbarians.rs:153`).
- Moduły domeny z serde: `ai_turn.rs`, `barbarians.rs`, `building_costs.rs`, `city_growth.rs`, `combat.rs`, `diplomacy.rs`, `events.rs`, `trade.rs`, `playable.rs` i inne.

**Zastrzeżenie krytyczne (kompilacja):** `save_load.rs` i `replay.rs` NIE są zadeklarowane w `rust-port/engine/src/domain/mod.rs` ani w `src/lib.rs` (`lib.rs` ma tylko `pub mod domain;` i re-exporty). Są kompilowane WYŁĄCZNIE jako moduły ścieżkowe w testach: `tests/save_load.rs:5-6`, `tests/replay.rs:5-9` (`#[path = "../src/domain/save_load.rs"]`). `bridge.rs` (`EngineCommand`) nie ma żadnej referencji w `lib.rs`, `domain/mod.rs` ani `tests/`. Wniosek: format `SaveSnapshot` i bridge nie są częścią biblioteki `civ_engine` w obecnym stanie `parity-v2`.

## 6. Wynik kluczowy dla P2.7 / P2.11: pola web BRAKUJĄCE w strukturze Rust

Status BRAK (brak odpowiednika w żadnej strukturze serializowalnej Rust, z dowodem §8 lub do potwierdzenia):
- Top-level: `exploredByHuman`, `activeHumanOwnerId`, `autoMarch`, `plannedMarches`, `rallyPoints`, `cityProd`, `cityBuilt`, `aiResearchDone`, `meta` (kontener), `mapQuality`, `renderQuality`, `mapDetailQuality` (ostatnie trzy: pola renderu, do klasyfikacji w P2.2).
- `meta`: 92 z 94 pozycji (wszystkie poza `diplomacyPairMeta` i `barbCamps`), w szczególności `forcedWarWavesByPairKey` (potwierdzony BRAK, §4 i §8), `*ForceWar*`, `regularWarCapturedByPairKey`, `wiarygodnosc*`, `diplomacy*` (poza `diplomacyPairMeta`), `ai*ByOwner`, `clearedBarbCampHexes`, `cityRelig`, `autoManageCities`, `fortNodes`, `placedImprovements`, `completedWorldWonders`, `placedWorldWonders`, `wonderBuildSites`, `budowaListaBiblioteka`, `newGameParams` — część z nich wymaga per-klucz potwierdzenia w P2.2 (§3).

Częściowo (CZĘŚCIOWO): `wersja` (inna numeracja), `tura`, `seed`, `gracze`, `humanOwnerIds`, `units` (4 pola), `cities` (5 pól), `diploRelations`, `tradeRoutes`, `mapSnapshot` (struktura bez zweryfikowanego formatu pól), `meta.diplomacyPairMeta`, `meta.barbCamps`.

## 7. Ograniczenia tego katalogu

- Nie porównano pól `RuntimeUnit`/`City` web z `UnitDto`/`CityDto` Rust polem po polu (zakres P2.2/P2.3).
- Nie zweryfikowano `cargo test` (zakaz nowego kodu Rust w temacie; katalog oparty o odczyt plików na pinach).
- Nie oceniano, czy `mapSnapshot` web jest zgodny z `MapDto`; oznaczono tylko istnienie struktury.
- Stan `git` w repo: niezacommitowana zmiana innego tematu (`P2-9-ASSET-DATA-MAPPING.md`) nie była modyfikowana.

## 8. Dowody zerowe i trafienia niesklasyfikowane (runda 2, grep)

Komenda: `git grep -ciE '<stem>' rust-port/parity-v2 -- rust-port` (suma po plikach, pin `9e33fc77`).

Zero trafień (dowód BRAK): `explored` (exploredByHuman), `auto_?march`, `planned_?march`, `diplo_?relation`, `forced_?war|force_?war|forcewar|wave` (forcedWarWavesByPairKey, także wszystkie `*ForceWar*`; zero dla każdego wariantu nazwy), `negotiat`, `fort_?node`, `eliminated`, `veteran`, `looted_?village`, `auto_?manage`, `placed_?improvement`, `active_?human`, `human_?owner`, `ai_?research`, `city_built`. Uwaga: `city_?prod` nie daje wiarygodnego wyniku (trafia `choose_city_production` w `ai_turn.rs:816`, funkcja AI, nie pole stanu) — `cityProd` pozostaje BRAK z uzasadnieniem: brak pola stanu produkcji miast w żadnej strukturze serde.

Trafienia niezerowe, NIEROZSTRZYGNIĘTE w tym temacie (nie wolno ich traktować jako dowodu BRAK): `siege` 16, `wiarygod|credib` 25, `relig` 16, `skarbiec|treasury` 40, `barb_?camp` 32, `improvement` 147, `clear` 30, `deficit` 6, `wonder` 6, `rally` 9, `mennica|mint` 2, `praca` 3, `map/render/detail_quality` 22. Te stemy odpowiadają kluczom `meta` oznaczonym w §3 jako „do potwierdzenia w P2.2”.

Stemy niezerowe już zaklasyfikowane: `trade_route` (`TradeRoute`, `trade.rs:392`), `Relation`/`DiplomacyState` (`diplomacy.rs:104,1611`), `DiploPairMeta` (`diplomacy.rs:1190`), `BarbCamp` (`barbarians.rs:153`), `StartGameParams.seed` (`playable.rs:103`), `PlayablePlayer.is_human` (`playable.rs:288`).
