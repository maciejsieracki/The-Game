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
