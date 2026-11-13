# R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1 — rozpoznanie pól i migracji zapisu (P6.20–P6.22)

Status: rozpoznanie, BEZ zmian kodu. Baza: `5e8b116e8` (czubek `origin/rust-port/parity-v2`, dispatch).
Pin (tylko odczyt): `07d2fbd72` — `gra/src/game/save.ts`, `gra/src/main.ts`.
Plan §0b: `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` (gałąź `claude/rust-sivvrn`, NIE w bazie; odczytany przez `git show origin/claude/rust-sivvrn:...`).

Konwencja: `pin = 07d2fbd72:plik:linia`, `rust = rust-port/engine/src/...:linia`. Pozycje bez dowodu linii = NIE_ZMIERZONO.

## 1. Architektura zapisu — różnica fundamentalna

| Aspekt | Pin (web) | Rust | Status |
|---|---|---|---|
| Wersja formatu | `wersja`, `SAVE_VERSION = 3` (pin `save.ts:116`, serializacja `save.ts:533-536` nadpisuje `wersja`) | klucz `version`, `CURRENT_SNAPSHOT_VERSION = 2` (rust `save_load.rs:62`); brak `version` → `MissingVersion` (`save_load.rs:792`) | INNY |
| Kształt koperty | płaski `SaveGame`: `units`, `cities`, `exploredByHuman`, `gracze`, ... (pin `save.ts:336-470`) | `SnapshotWire` z `state: GameStateDto` (wymagane), `event_queue`, `rng`, `meta`, `plannedMarches`, `autoMarch`, `gracze` (rust `save_load.rs:532-550`); `RawSnapshot` deserializuje tylko te klucze (`save_load.rs:784-830`) | INNY — brak ścieżki web `SaveGame` → `SaveSnapshot` |
| Wersja v1 Rust | — | `migrate_v1` (`save_load.rs:863`), dotyczy wyłącznie snapshotu v1 Rust, nie web | nie dotyczy webu |
| Gate wersji web | `ver < 3` → `IncompatibleSaveFormatError`, BEZ migracji v2→v3 (pin `save.ts:696-699`, gate `save.ts:705-706`); `ver > SAVE_VERSION` → błąd (`save.ts:708`) | brak odpowiednika dla webu | BRAK |
| Ścieżki ładowania | `deserializeGame` (`save.ts:679`) | `zapis_loader::load_save_snapshot` (`zapis_loader.rs:43-48`) i `ReplayLog::load_json_with_migration_reports` (`replay.rs:199-215`) — jedyne produkcyjne | — |

**Wniosek:** plik zapisu z weba (`wersja:3`, płaskie klucze) NIE przejdzie przez `load_save_snapshot` — zabraknie `version` i `state`. Rust ma tylko własny format koperty. Każde pole z tabeli §2 dotyczy więc danych w `meta` (który jest przenoszony) albo wymaga nowej warstwy mapującej. Decyzja o tej warstwie jest poza zakresem rozpoznania (patrz §5, pytanie D1).

## 2. Pola zapisu: pin → Rust

Legenda statusu: JEST (odczyt i/lub zapis zaimplementowane w Rust), CZĘŚCIOWO (tylko passthrough albo tylko odczyt), BRAK (brak w Rust), INNY (inny typ/klucz), NIE_ZMIERZONO.

### 2a. Pola top-level (pin `SaveGame`)

| Pole | Pin (zapis / odczyt) | Rust | Status |
|---|---|---|---|
| `wersja` | `save.ts:338`, `save.ts:533-536`, odczyt `save.ts:691` | `save_load.rs:532-535` (klucz `version`) | INNY |
| `tura` | `save.ts:341` | NIE_ZMIERZONO (pole w `GameStateDto`/`TurnDto`, `state.rs:12-17`; nie porównywano typów) | NIE_ZMIERZONO |
| `seed` | `save.ts:347` | NIE_ZMIERZONO | NIE_ZMIERZONO |
| `units` / `cities` | `save.ts:350`, `save.ts:353` | w `GameStateDto` (`state.rs:12`, `units()` `state.rs:209`) | CZĘŚCIOWO (typy inne: `RuntimeUnit` web vs `UnitDto`) |
| `exploredByHuman` (v3) | `save.ts:363` | 0 trafień w modułach zapisu | BRAK |
| `gracze` (v3) | `save.ts:371` | passthrough `gracze: Option<Value>` (`save_load.rs` pole `gracze`, `SnapshotWire` `save_load.rs:557`); epoka z `gracze[].era` (`owner_eras_from_save` `save_load.rs:564-569`) | CZĘŚCIOWO (tylko epoka) |
| `humanOwnerIds` / `activeHumanOwnerId` (v3) | `save.ts:374`, `save.ts:377`; zapis `main.ts:37241` | 0 trafień w `save_load.rs`/`save_migrations.rs`/`replay.rs`/`zapis_loader.rs` | BRAK (w domenie są, nie w kopercie) |
| `explored` / `gracz` (v2, deprecated) | `save.ts:387`, `save.ts:390` | — | BRAK celowo (pin odrzuca v<3) |
| `cityProd` / `cityBuilt` | `save.ts:396`, `save.ts:401` | 0 trafień w modułach zapisu | BRAK (top-level nie ma flatten, klucze są gubione przy round-trip, `save_load.rs:532-560`) |
| `aiResearchDone` | `save.ts:407` | 0 trafień | BRAK |
| `diploRelations` | `save.ts:412` | 0 trafień | BRAK |
| `autoMarch` | `save.ts:418` | `SaveSnapshot.auto_march` `save_load.rs:133` (pole), `SavedAutoMarch` `save_load.rs:147-170` | JEST |
| `plannedMarches` | `save.ts:421` | `planned_marches` `save_load.rs:130` + `SavedPlannedMarch` `save_load.rs:326` | JEST |
| `recruitFollowGeneralDefault` / `recruitGeneralId` / `recruitGeneralNoticeShown` | `save.ts:429`, `save.ts:432`, `save.ts:434` | 0 trafień (`recruitGeneralId` 0 w całym `rust-port/engine/src`) | BRAK |
| `rallyPoints` | `save.ts:437` | domena: `rust-port/engine/src/domain/pathfinding.rs:1574` (`rally_points_to_save`), `:1605`, `:1682` (`rally_points_from_save`); w `pathfinding.rs` 5 trafień (1573, 1574, 1605, 1681, 1682); testy `tests/p6_4_rally.rs`; 0 trafień w modułach zapisu | CZĘŚCIOWO (domena JEST, brak w kopercie) |
| `meta` | `save.ts:440` | `meta: Option<SaveMeta>` `save_load.rs:545`, `SaveMeta` `save_load.rs:177` | JEST (szczegóły §2b) |
| `tradeRoutes` | `save.ts:447` | 0 trafień w modułach zapisu | BRAK |
| `mapQuality` / `renderQuality` / `mapDetailQuality` | `save.ts:450`, `:452`, `:454` | 0 trafień w modułach zapisu | BRAK (dot. UI, niski priorytet) |
| `mapSnapshot` (P-WCZYTYWANIE) | `save.ts:468`; zapis `main.ts:37483`; walidacja `save.ts:745-751` | domena: `rust-port/engine/src/domain/map_snapshot.rs:318` (`serialize_map_for_save`), `:613` (`is_valid_map_snapshot`); brak pola w kopercie `SnapshotWire` (0 trafień w `save_load.rs`/`save_migrations.rs`) | CZĘŚCIOWO (port domeny JEST, brak pola w kopercie) |

### 2b. Pola `meta` (pin `buildSaveGameSnapshot`, `main.ts:37171`, blok `meta` od `main.ts:37253`)

Rust `SaveMeta` zachowuje nieznane klucze przez `#[serde(flatten)] extra` (`save_load.rs:203-205`), więc każde pole poniżej przeżywa round-trip. Jawny odczyt/zapis dotyczy tylko kluczy wymienionych w kolumnie „Rust”.

| Pole (pin) | Pin zapis | Pin odczyt | Rust | Status |
|---|---|---|---|---|
| `battleModeSettingVersion` | `main.ts:37257` | — | `save_load.rs:179-183`, accessory `save_load.rs:285-296` | JEST |
| `newGameParams` | `main.ts:37258` | — | `save_load.rs` pole `new_game_params`, `battle_always_manual` `save_load.rs:295` | JEST |
| `autoBuildEnabled` (§0b P6.20–22) | `main.ts:37328` | `main.ts:47163` (`autoBuildFromSaveMeta`; default WYŁ., `auto-build-gate.ts:9`) | `save_load.rs:303-307` (`auto_build_enabled`), `auto_build_gate.rs:42-43` (tylko JSON `true`) | JEST (odczyt); zapis: brak producenta w Rust (passthrough) |
| `playerEpochWarEnabled` (§0b P6.20–22) | `main.ts:37334` (tylko gdy `isWarEpochPlayerFirstEnabled()`) | `main.ts:47190` (default `true`) | `save_load.rs:309-317`, `diplomacy_multiwar.rs:209-211` (`unwrap_or(true)`) | JEST (odczyt, default zgodny); zapis: brak producenta |
| `warRulesEraWarCountByCiv` | `main.ts:37413` (gated `isWarRulesMultiwarEnabled`) | — | pole `era_war_count_by_civ` `save_load.rs:200`, `restore_era_war_counts` w `diplomacy_multiwar` | JEST |
| `warRulesForcedEraDeclared` | `main.ts:37409` (gated) | — | passthrough `extra` | CZĘŚCIOWO |
| `ownerEraByOwner` (AI) | `main.ts:37438` | — | `save_load.rs:223-225` (`owner_era_entries`), `owner_eras_from_save` `save_load.rs:564-580` | JEST |
| `ownerStartEraByOwner` | `main.ts:37439` | — | passthrough; `start_era_fallback` `save_load.rs:231` | CZĘŚCIOWO |
| `eliminatedOwners` | `main.ts:37437` | `main.ts:46469-46472` | passthrough w `SaveMeta` (0 odczytów w `save_load.rs`/`save_migrations.rs`); logika i jawne wejście w domenie: `domain/eliminacja.rs:4-26` (zbiór `wyeliminowani`), `domain/brake_inputs.rs:178`, `domain/war_turn_forced.rs:81` | CZĘŚCIOWO (domena JEST; w zapisie tylko passthrough) |
| `wonderBuildSites` | `main.ts:37451` | `main.ts:46462-46463` (surowy `slice()`, BEZ migracji) | 0 trafień w `rust-port/engine/src` | BRAK |
| `forcedWarWavesByPairKey` (§0c kolejka poz. 8) | `main.ts:37434` (`serializeForcedWarWaves`) | `main.ts:46690` (`restoreForcedWarWaves`) | `war_forced_waves.rs:469` (`serialize_forced_war_waves`), `:522` (`restore_forced_war_waves`); wołane tylko z `ai_war_march_plan.rs:251` i testów `p6_forced_war_g3*.rs`; NIE wpięte w `SaveMeta`/`SaveSnapshot` (klucz tylko passthrough `save_load.rs:203-205`); komentarz `war_turn_forced.rs:13` potwierdza, że fale nie są mutowane | CZĘŚCIOWO |
| `forcedEraPeaceUntilNextEraByPairKey` | `main.ts:37431` (`serializeForcedEraPeaceLocks`) | — | passthrough | CZĘŚCIOWO |
| `ironForceWar*`, `stoneForceWar*`, `bronzeForceWar*` (pendingOwners/cycleOwners/restUntil/activeByPairKey) | `main.ts:37387-37430` (zakres) | — | passthrough; `war_turn_forced.rs:145-205` operuje na `active_by_pair_key` z stanu domeny | CZĘŚCIOWO |
| `lootedVillageHexKeys`, `aiGeneralWarCampaignByOwner` | `main.ts:37435-37436` | — | passthrough | CZĘŚCIOWO |
| `pracaPoolByHuman`, `playerPracaPool`, `ownerDefault*` (praca/okolica/budowa/racja), `ulepszeniaEmpireByOwner`, `mennicaZlotoGrace` | `main.ts:37193-37226` (zakres) | — | 0 trafień jawnych w modułach zapisu (tylko passthrough) | BRAK logiki (passthrough) |
| `zlozeGrants`, `surowiecBooleanGrants`, `civChronicleByOwner`, `aiTargetMemoryByOwner` i ~40 kluczy AI/dyplomacji | `main.ts:37300-37420` (zakres) | — | passthrough; nie czytane w Rust | CZĘŚCIOWO (dane bez odczytu) |

Uwaga: pełna lista kluczy `meta` (pin ~180 pozycji) nie była weryfikowana linia-po-linii; pozycje oznaczone „zakres” są oparte na odczycie bloku `main.ts:37253-37440`.

## 3. Migracje wczytania — pin vs Rust

Pin: kolejność w `restoreGameFromSave` (`main.ts:46225`): najpierw degradacja wodzów (`main.ts:47024-47026`), potem siatka stosu (`main.ts:47031`). Rust `migrate_loaded_state` (`save_migrations.rs:338-348`) robi to samo w tej samej kolejności.

| Migracja | Pin (plik:linia) | Rust (plik:linia) | Status |
|---|---|---|---|
| Nadmiar wodzów ponad limit epoki (R-WEB-GENERALS-OVER-LIMIT-Q1) | `main.ts:47024-47026` (`planGeneralLimitDemotions`), limit `generalLimitForEra` | `plan_general_limit_demotions` `save_migrations.rs:58-81`; `demote_generals_over_limit` `save_migrations.rs:256-277`; wołane przez `migrate_loaded_state` `save_migrations.rs:342`; epoka z `owner_eras` `save_load.rs:690-698` | JEST (tylko przy wczytaniu) |
| Siatka stosu > limit, przy wczytaniu | `main.ts:47031` (`enforceArmyStackLimit('wczytanie zapisu')`), limit `BATTLE_MAX_PER_SIDE` = `MAX_PER_SIDE` (pin `gra/src/battle/battleScene.ts:721,723`); `main.ts:4358-4359` to funkcja `armyStackLimit()`, nie definicja stałej | `enforce_army_stack_limit` `save_migrations.rs:282-`; `ARMY_STACK_LIMIT = 500` `save_migrations.rs:221`, `ARMY_STACK_MAX_RADIUS = 6` `save_migrations.rs:224`; wołane `save_migrations.rs:344` | JEST (load); limit 500 zgodny z pinem co do wartości: TAK (zmierzone: pin `MAX_PER_SIDE = 500`, `gra/src/battle/battleScene.ts:721`) |
| Siatka stosu na STARCIE TURY (siatka bezpieczeństwa) | `main.ts:38138` (`enforceArmyStackLimit('start tury')`) | BRAK — jedyny wołający `enforce_army_stack_limit` to `migrate_loaded_state` (grep: 0 wywołań w `advance_turn`/pipeline tury) | BRAK |
| Playerowa epoka wojny (`playerEpochWarEnabled`) | `main.ts:47190` | `save_load.rs:309-317` (odczyt, default true) | JEST (odczyt) |
| `autoBuildEnabled` | `main.ts:47163` | `save_load.rs:303-307` | JEST (odczyt) |
| Niespójny właściciel cudu (`wonderBuildSites`) | pin: BRAK migracji (`main.ts:46462-46463` surowy odczyt) — §0b: „web: NIE wykonana” | BRAK | BRAK (po obu stronach; nic do portu, patrz D3) |
| Usunięcie farm na lesie (R-ULEPSZENIA-FARMA-LESIE) | `save.ts:575` (`migrateLegacyFarmsOnForestInSave`), wołane w `deserializeGame` `save.ts:759` | port helperów JEST: `domain/improvement_build.rs:305` (`is_legacy_farm_on_forest_layer`), `:313` (`strip_legacy_farm_on_forest`), test `tests/p6_m16_rules.rs:55,63`; wpięcia w `migrate_loaded_state` BRAK (0 trafień w `save_load.rs`/`save_migrations.rs`) | CZĘŚCIOWO (port JEST, brak wpięcia w wczytanie) — poza §0b, zgłaszam jako lukę |
| Odrzucenie zapisu v<3 (ABC-4) | `save.ts:705-706` | BRAK odpowiednika (Rust nie zna `wersja`) | BRAK (kontrakt różny; patrz D1) |
| Migracja v1→v2 snapshotu | — (nie dotyczy webu) | `migrate_v1` `save_load.rs:863`, gałąź `LEGACY_SNAPSHOT_VERSION` `save_load.rs:800-803` | JEST (Rust-only) |

## 4. Zgodność z §0b planu

Wiersz §0b „P6.20–22 zapis” (plan, gałąź `claude/rust-sivvrn`) wymienia: nadmiar wodzów, siatkę stosu, `playerEpochWarEnabled`, `autoBuildEnabled`, niespójnego właściciela cudu. Dodatkowo kolejka §0c poz. 8 (`R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1`) wymienia `forcedWarWavesByPairKey`.

| Pozycja planu | Stan w Rust |
|---|---|
| nadmiar wodzów | JEST (load) |
| siatka stosu | CZĘŚCIOWO — tylko przy wczytaniu, brak na starcie tury |
| `playerEpochWarEnabled` | odczyt JEST, brak producenta zapisu |
| `autoBuildEnabled` | odczyt JEST, brak producenta zapisu |
| niespójny właściciel cudu | BRAK (także w pinie) |
| `forcedWarWavesByPairKey` | CZĘŚCIOWO — funkcje serialize/restore są, nie wpięte w zapis |

Plan §0b nie wymienia: `humanOwnerIds`/`activeHumanOwnerId`, `exploredByHuman`, `cityProd`/`cityBuilt`, `tradeRoutes`, `mapSnapshot`, `rallyPoints`, `recruitGeneralId` — wszystkie BRAK w kopercie Rust (§2a). Ta rozbieżność jest istotna: plan zakłada, że „zapis” to głównie `meta`, a top-level pola web są poza zakresem. To jest decyzja do potwierdzenia (D1).

## 5. Braki (lista z plik:linia)

1. Brak ścieżki wczytania zapisu web (`wersja:3`) — `save_load.rs:532-550` oczekuje `version`/`state`; `save_load.rs:792` zwraca `MissingVersion`.
2. Brak siatki stosu na starcie tury — pin `main.ts:38138`; w Rust `enforce_army_stack_limit` (`save_migrations.rs:282`) wołane tylko z `migrate_loaded_state` (`save_migrations.rs:344`).
3. Brak wpięcia `forcedWarWavesByPairKey` do zapisu — pin `main.ts:37434`/`:46690`; Rust `war_forced_waves.rs:469`/`:522` bez wołającego w zapisie.
4. Brak producentów zapisu `playerEpochWarEnabled` i `autoBuildEnabled` w Rust (tylko odczyt, `save_load.rs:303-317`).
5. Brak top-level pól web w kopercie: `humanOwnerIds`, `activeHumanOwnerId`, `exploredByHuman`, `cityProd`, `cityBuilt`, `aiResearchDone`, `diploRelations`, `tradeRoutes`, `mapSnapshot`, `rallyPoints`, `mapQuality`, `recruitGeneralId` (§2a).
6. Brak migracji farm-na-lesie — pin `save.ts:575`.
7. Brak odpowiednika gate `wersja < 3` — pin `save.ts:705-706`.
8. `wonderBuildSites` — brak po obu stronach (pin `main.ts:37451`, `:46462`); wg §0b to nie jest funkcja webu do przeniesienia (D3).
9. Top-level klucze web gubione przy round-trip Rust (brak `flatten` w `SnapshotWire`, `save_load.rs:532-560`) — ryzyko utraty danych, jeśli zapis web trafi do Rust.

## 6. Propozycja podziału na tematy wykonawcze

Zależności: D1 (decyzja o formacie) blokuje wszystko poza migracjami na `SaveMeta`.

| # | Temat | Zakres | Zależność | Szacunek rund |
|---|---|---|---|---|
| T0 | DECYZJA D1: format zapisu web vs Rust | pytanie ABC do właściciela (§7) | — | 0 (decyzja) |
| T1 | Siatka stosu na starcie tury | wpięcie `enforce_army_stack_limit` (`save_migrations.rs:282`) do advance tury; pin `main.ts:38138`; wektory na limit `BATTLE_MAX_PER_SIDE` | brak | NIE_ZMIERZONO (1 funkcja istnieje, wpięcie w pipeline tury nieoszacowane) |
| T2 | Producenci `playerEpochWarEnabled` / `autoBuildEnabled` w zapisie | zapis z `SaveSnapshot` do `SaveMeta.extra` | T0 | NIE_ZMIERZONO |
| T3 | `forcedWarWavesByPairKey` w zapisie | wpięcie `serialize_forced_war_waves`/`restore_forced_war_waves` (`war_forced_waves.rs:469/522`) do `SaveMeta` i do pipeline wojny | T0; wspólne z kolejką poz. 5 | NIE_ZMIERZONO |
| T4 | Top-level pola web w kopercie | `cityProd`, `cityBuilt`, `tradeRoutes`, `humanOwnerIds`, ... | T0 (bez T0 nie ma sensu) | NIE_ZMIERZONO |
| T5 | Wpięcie migracji farm-na-lesie (zakres ZREDUKOWANY: port helperów JEST) | `improvement_build.rs:305/313` → wołający w `migrate_loaded_state`; pin `save.ts:575/759` | T0 (lub niezależnie) | NIE_ZMIERZONO (jedno miejsce wpięcia + test; bez pomiaru rund) |
| T6 | Testy round-trip zapisu web | wektory z pina `save.ts:533/679` | T0 | NIE_ZMIERZONO |

Szacunek rund: NIE_ZMIERZONO przez Operatora. Szacunek PLANU (nie pomiar): `PLAN-PORT-RUST-TAURI-20261020.md` §0c poz. 8 (`R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1`) podaje „2–3” rundy dla CAŁEJ pozycji (T1–T6 plus `forcedWarWavesByPairKey`), bez podziału na T1–T6. Podział po T0 (D1) może ten szacunek zmienić. Liczb per-temat nie zgadywano (dispatch). Dla T1–T3 można oszacować po przeczytaniu hunków pipeline tury (`turn_*.rs`) w rundzie wykonawczej.

## 7. Pytania do właściciela (ABC)

- **D1 — format zapisu.** A) Rust czyta web `SaveGame` v3 przez warstwę mapującą (zachowuje pliki webu, większy zakres T4). B) Rust ma własny format; zapisy web nie są wymagane (T4 znika, ale plan §0b „wsteczna kompatybilność” wymaga decyzji). C) Mieszany: mapowanie tylko `meta` + pola gry. Rekomendacja Operatora: C. To OPINIA, nie wynik pomiaru: koszt wariantów A/B/C NIE_ZMIERZONO. Jedyne liczby osadzone w tym rozpoznaniu: 11 wierszy BRAK w §2a (w tym `explored`/`gracz`, odrzucane celowo) oraz 9 pozycji zakresu w §5; T4 (top-level pola web) nie został wyceniony. Kontekst: `save_load.rs:532-550`, `save.ts:336-470`.
- **D2 — siatka stosu na starcie tury.** Czy wpinamy ją w tym temacie (T1), czy zostawiamy na próg wczytania? Rekomendacja: wpiąć (pin `main.ts:38138` to część zachowania gry).
- **D3 — `wonderBuildSites`.** Web nie ma migracji (§0b: NIE wykonana). Czy Rust ma być „mądrzejszy” niż web? Rekomendacja: nie; zgodność z pinem.

## 8. Ograniczenia rozpoznania

- Nie wykonano `cargo` (dispatch: rozpoznanie bez testów; TESTY: NIE DOTYCZY).
- Lista kluczy `meta` pinu nie zweryfikowana linia-po-linii (§2b).
- Plan §0b odczytany z gałęzi `claude/rust-sivvrn`, nie z bazy — linie planu nie są cytowane w bazie.
- Typy pól (np. `tura`, `seed`, `units`) nie porównywane z `GameStateDto` — NIE_ZMIERZONO.
- Kryterium 1 dispatchu NIE jest spełnione w całości: §2b opisuje klucze `meta` zbiorczo (~180 wg szacunku, bez linii na klucz). Grep `^\s+ident:` w `main.ts:37253-37440` daje 93 dopasowania; to NIE jest liczba kluczy meta (zawiera klucze zagnieżdżone i nie-meta). Pełna tabela per-klucz = NIE_ZMIERZONO, do rundy wykonawczej.
- Dryf numeracji pina: komentarze Rust cytują `main.ts:46701` (autoBuild) i `main.ts:46706` (playerEpochWarEnabled): `rust-port/engine/src/domain/save_load.rs:303`, `:309`; `rust-port/engine/tests/p6_zapis_migracje_meta_flags.rs:2-3`; `rust-port/engine/tests/p6_zapis_migracje_snapshot_flags.rs:3`. W pinie `07d2fbd72` te odczyty są pod `main.ts:47163` i `:47190`. Komentarze są nieaktualne; NIE poprawiane w tej rundzie (poza allowlistą).
