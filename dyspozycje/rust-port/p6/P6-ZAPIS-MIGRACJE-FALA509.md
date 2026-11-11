# P6-ZAPIS-MIGRACJE-FALA509 — pomiar luk zapisu (runda 2)

Baza: `origin/rust-port/parity-v2` @ `7f38322ae` + commit operatora r1 `e4edcd4ae`. Web: `origin/main` (rewizja z dispatchu, odczyt `git show origin/main:...`).
Oznaczenia: ZMIERZONO = grep/odczyt pliku w tej rundzie; NIE_ZMIERZONO = nie sprawdzone (z podanym powodem).

## 1. Tabela luk

| Pozycja | Web (origin/main) | Rust | Status |
|---|---|---|---|
| `meta.autoBuildEnabled` | `main.ts:46701` `autoBuildFromSaveMeta(saved.meta?.autoBuildEnabled)`; tylko JSON `true` wlacza; brak pola = WYL. | Accessor `SaveMeta::auto_build_enabled` (`save_load.rs`), test przez pelny `SaveSnapshot` (`p6_zapis_migracje_snapshot_flags.rs`). | ZROBIONE do poziomu odczytu zapisu. Konsument w Rust: ZMIERZONO brak — `auto_build_gate::is_auto_build_allowed_for_owner` ma 0 wywolan poza definicja (grep `rust-port/engine/src`). Podpiecie do stanu gry = LUKA (wymaga pola w stanie gry, poza allowlista `types.rs`). |
| `meta.playerEpochWarEnabled` | `main.ts:46706` `typeof === 'boolean' ? v : true` | Accessor `SaveMeta::player_epoch_war_enabled`, test przez `SaveSnapshot`. | ZROBIONE do poziomu odczytu. Konsument: ZMIERZONO brak poza testami (`diplomacy_multiwar::player_epoch_war_enabled` uzywane tylko przez accessor). Podpiecie = LUKA jak wyzej. |
| `warRulesEraWarCountByCiv` (ZAPIS-ERAWAR) | zapis/odczyt `main.ts:35745`, `:44950` | `save_load.rs` `era_war_count_by_civ`, `diplomacy_multiwar::restore_era_war_counts` | ZGODNE, juz zintegrowane — nie duplikowane. |
| Nadmiar wodzow ponad limit epoki | `game/generals.ts:38` `planGeneralLimitDemotions`; wywolanie `main.ts:46568` (wczytanie zapisu), po `kept < generalLimitForEra(epoka wlasciciela)` | `domain/save_migrations.rs` `plan_general_limit_demotions` + `general_flag_from_raw` (NOWY). Zgodnosc: 407 wektorow z uruchomionego weba (Node v22.22.0), `tests/p6_zapis_migracje_generals_vectors.rs`. | PLAN ZROBIONY i zgodny z webem. Podpiecie do wczytania: LUKA. ZMIERZONO: `GameStateDto`/`UnitDto` (`types.rs`) nie niesie `isGeneral` ani kolejnosci narodzin, a `SaveSnapshot` nie czyta klucza `units` w formacie weba (`wersja`/`tura`/`units`/`gracze`, `main.ts:36855`) — format `SnapshotWire` to `version`/`state`/`event_queue`/`rng`. Bez zmiany modelu jednostki w Rust nie ma czego zdemotowac. |
| Siatka stosu >limit (migracja) | `game/army-stack-limit.ts:153` `planOversizedStackSplits` (czysta funkcja); wywolanie przy wczytaniu `main.ts:46573` i na starcie tury `main.ts:37754` | `domain/save_migrations.rs` `plan_oversized_stack_splits` + `StackUnit`/`StackSplitPlan` (NOWY). Zgodnosc: 303 wektory z uruchomionego weba, `tests/p6_zapis_migracje_stack_vectors.rs` (258 przypadkow z ruchami, 1 z nieumieszczonymi, zgodne co do kolejnosci). | PLAN ZROBIONY i zgodny z webem. Wywolanie przy wczytaniu/starcie tury: LUKA (potrzebna mapa `canPlaceAt` = `mapHexPassableForUnit` + `canUnitOccupyCityHex`, ZMIERZONO w `main.ts:4341`; w Rust brak tego zestawu w stanie gry). |
| Niespojny wlasciciel cudu | Web: brak migracji zapisu (0 trafien `wonder.*migr`, `cud.*migr` w `save.ts`/`main.ts` — ZMIERZONO w r1) | — | Zgodnie z dispatchem nie portowano. |
| `plannedMarches` | `planned-march.ts:438-462` (lenient: `destQ/destR` liczbowe, `attackUnitId`/`generalTargetId` niepuste stringi) | `save_load.rs` `lenient_planned_marches`, `web_planned_march`; `pathfinding.rs:2250` `planned_marches_to_save` (eksport) | NIE_ZMIERZONO w tej rundzie: porownanie formatu eksportu `planned_marches_to_save` z `planned-march.ts` nie wykonane (poza zakresem rundy 2; wymaga osobnego wektora). |
| Pola dyplomacji/oblezenia (W1 raw JSON) | — | `WarTurnState` w `meta` (W1, `save_load.rs`) | NIE_ZMIERZONO (zakres poza ta runda). |
| Wektory z weba | — | `tests/p6_zapis_migracje_vectors/` (`generals-demotion.json`, `stack-split.json` + generatory `.mjs`) | ZROBIONE dla obu funkcji planu. Wektory z WEB `SaveSnapshot` (cala sciezka wczytania) — NIE WYKONANO. |

## 2. Zmiany (runda 2)

- `rust-port/engine/src/domain/save_migrations.rs` (nowy): plan demotion wodzow, `general_flag_from_raw`, plan podzialu stosu, testy jednostkowe.
- `rust-port/engine/src/domain/mod.rs`: `pub mod save_migrations;`.
- `rust-port/engine/tests/p6_zapis_migracje_generals_vectors.rs`, `p6_zapis_migracje_stack_vectors.rs` (nowe): wektory z webu.
- `rust-port/engine/tests/p6_zapis_migracje_snapshot_flags.rs` (nowy): flagi `meta` przez pelny `SaveSnapshot` (stary i nowy zapis).
- `rust-port/engine/tests/p6_zapis_migracje_vectors/` (nowy): dane wektorow i generatory Node.

## 3. Otwarte (nastepna runda)

1. Model jednostki w Rust: pole generala (`isGeneral`) i kolejnosc narodzin w `UnitDto` (`types.rs`, poza allowlista r2) — warunek wpiecia demotion do wczytania.
2. Odczyt zapisu w formacie weba (klucze `units`, `gracze`, `meta.ownerEraByOwner`) albo decyzja, ze Rust czyta tylko swoj `SnapshotWire` — warunek testow przez pelny `SaveSnapshot` ze starym zapisem webowym.
3. Mapa `canPlaceAt` (przechodniosc terenu, miasta obcych) w stanie gry — warunek wpiecia siatki stosu.
4. Konsumenci `auto_build_enabled` / `player_epoch_war_enabled` w logice tury.
5. Format `plannedMarches` vs `planned-march.ts` (wektor).

## 4. Runda 3 (ten sam ID; baza `2ad132a1b` + merge `parity-v2` 1079feb9f jako osobny commit)

Stan luk po r3 (nadpisuje wiersze sekcji 1 dla wodzow, stosu i konsumentow flag):

| Pozycja | Stan r3 | Dowod |
|---|---|---|
| Wodzowie ponad limit epoki | PODPIETE do stanu: `UnitDto::is_general` (`#[serde(default, skip_serializing_if)]`, tylko JSON `true` = wodz), `GameStateDto::demote_generals`, `save_migrations::demote_generals_over_limit`, `SaveSnapshot::migrate_on_load`. Kolejnosc narodzin = kolejnosc `state.units()`. | `tests/p6_zapis_migracje_snapshot_load.rs` (stary zapis bez pola bez zmian; nowy zapis: najmlodszy wodz ponad limit traci flage, nikt nie ginie, idempotentne) |
| Siatka stosu > limit | PODPIETA: `save_migrations::enforce_army_stack_limit` (limit `ARMY_STACK_LIMIT`=500 = web `BATTLE_MAX_PER_SIDE`, `battleScene.ts:721`; promien 6), `GameStateDto::relocate_units`, wolana z `migrate_on_load` (web `main.ts:46573`). Start tury (`main.ts:37754`): ta sama funkcja do wolania przez petle tury; `PlayableState` nie ma wodzow ani modelu stosu (tylko `Warrior`), wiec brak miejsca wpiecia = ZALOZENIE. | testy: stos 500 bez zmian, 501 -> jednostka po 500. na (0,2), pomija wode i obce miasto, dopuszcza wlasne miasto, `unplaced` przy braku miejsca |
| Przechodniosc / miasto | ZMIERZONO grepem: `can_unit_occupy_city_hex` ISTNIEJE (`pathfinding.rs:592`) i jest uzyte; `map_hex_passable_for_unit` NIE ma odpowiednika — zastapione `hex_passable` w `save_migrations.rs` (heks na mapie i nie `Water`). ZALOZENIE: `TerrainDto` nie ma gor (web odrzuca tez `Gory`). | `p6_zapis_migracje_split_skips_water_and_foreign_city_hexes` |
| `autoBuildEnabled` | konsument: `SaveSnapshot::auto_build_allowed_for_owner` -> `is_auto_build_allowed_for_owner` (AI zawsze, gracz wg zapisu, brak pola = wyl.) | `..._auto_build_flag_consumer_old_and_new_save` |
| `playerEpochWarEnabled` | `SaveMeta::player_epoch_war_enabled` (brak pola = true). Konsument w logice tury: ZMIERZONO brak (`diplomacy_multiwar` bierze wartosc od wolajacego) — LUKA do tematu podpiecia tury. | j.w. |
| `planned_marches_to_save` | ZMIERZONO odczytem `planned-march.ts:466` vs `pathfinding.rs:2250`: ZGODNE semantycznie (puste -> nic; wpis z `destQ/destR`, `attackUnitId`/`generalTargetId` tylko niepuste; `autoMarch` = pierwszy wpis w kolejnosci wstawienia). Format zapisu `SavedPlannedMarch` (`unitId/destQ/destR/...`) zgodny; kolejnosc kluczy liczbowych JS odtwarza `lenient_planned_marches`. Uwaga: wejscie `&[(String, ..)]` dopuszcza duplikaty kluczy (web `Map` nie) — odpowiedzialnosc wolajacego. Osobnego wektora z weba NIE wygenerowano. | odczyt kodu |
| Pola dyplomacji/oblezenia (W1) | `WarTurnState` w `state.war` jako surowy JSON, round-trip pokryty `p6_wire_war_state_snapshot` (8 ok) | uruchomiony test |

ZALOZENIA r3: epoke wlasciciela dostarcza wywolujacy (`era_for_owner`); `PositionDto` (x, y) = (q, r) planu stosu; zapis w formacie WEB (`wersja/tura/units`) nadal nieczytany przez `SaveSnapshot` — poza zakresem.

### 4a. Odpowiedzi na zarzuty Evaluatora (runda 3, ten sam ID)

- **Zarzut 1 — migracja nie jest automatyczna przy wczytaniu: PRZYJMUJĘ jako dokumentację, ODRZUCAM jako błąd kodu.** Rust nie ma loadera pliku zapisu; `replay.rs` przyjmuje gotowy `SaveSnapshot`. Migracja wymaga `era_for_owner` i listy ludzkich graczy, których `serde` nie ma. Kontrakt wołającego opisano w doc-komentarzu `impl Deserialize for SaveSnapshot` (`save_load.rs`, przed `impl<'de>`). Podpięcie loadera to osobny temat (poza allowlistą tego tematu: `replay.rs`).
- **Zarzut 2 — konsument `playerEpochWarEnabled` nie istnieje w Rust: PRZYJMUJĘ jako lukę do osobnego tematu, bez zmian kodu w tym temacie.** Web konsumuje flagę w `gra/src/game/war-rules-multiwar.ts:67` (wojna epoki gracza, tylko przy fladze ON). Rust ma wyłącznie accessor `SaveMeta::player_epoch_war_enabled` i funkcję `diplomacy_multiwar::player_epoch_war_enabled`. Brak konsumenta w logice tury to nowa reguła wojny, nie migracja zapisu. Proponowany temat: `R-RUSTPORT-P6-WIRE-EPOCH-WAR-FLAG-Q1` (W3 `forced_step` jest w toku pod #221, do rozważenia jako jego część).
- **Zarzut 3 — stała epoka `|_| 1.0` w testach: PRZYJMUJĘ, naprawiono.** Dodano `p6_zapis_migracje_epoch_limit_depends_on_owner_era` (`tests/p6_zapis_migracje_snapshot_load.rs`): gracz era 1 (limit 1) traci wodzów 11 i 12, AI era 3 (limit 3) zachowuje 20–22; liczba jednostek bez zmian.
- **Zarzut 4 — duplikaty kluczy w `planned_marches_to_save`: PRZYJMUJĘ, naprawiono.** Web trzyma `plannedMarches` w `Map` (`gra/src/game/planned-march.ts:466`), więc duplikat klucza nie może wystąpić po stronie webu. Rust przyjmował `&[..]` i przepuszczał duplikaty. Teraz działa semantyka JS `Map`: powtórzony klucz nadpisuje wartość, zachowuje pierwszą pozycję, a `autoMarch` bierze pierwszy klucz z wartością końcową (`pathfinding.rs`, `planned_marches_to_save`). Testy: `tests/p6_zapis_migracje_planned_dedupe.rs` (2 testy). Pole `PlannedMarchDest` i format wyjścia bez zmian.
