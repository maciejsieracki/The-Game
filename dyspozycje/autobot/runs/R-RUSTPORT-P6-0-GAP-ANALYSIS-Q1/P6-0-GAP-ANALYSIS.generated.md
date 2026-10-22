# P6.0 — Analiza luk: gameplay web (`gra/src/game/**`) vs Rust (`rust-port/engine`)

Status dokumentu: **WYNIK ANALIZY, runda 2 (zero zmian kodu)**. Pin web: `edb8fb56`. Pin Rust: `origin/rust-port/parity-v2` (e810d0d3; drzewo `rust-port/engine/src` nie zmienione między e810d0d3 a commitem analizy — `git diff e810d0d3 HEAD -- rust-port` puste).
Generatory i surowe wyjścia: `dyspozycje/autobot/runs/R-RUSTPORT-P6-0-GAP-ANALYSIS-Q1/` (`inventory_web.py`, `inventory_rust.py`, `evidence.py`, `build_gap.py`, `web-inventory.tsv`, `rust-inventory.tsv`, `evidence.tsv`, `rust-anchors.tsv`, `mapping-manual.tsv`, `backlog.tsv`, logi `rust-*.log`).

## 0. Metoda, legenda i ograniczenia (ANTY-HALUCYNACJA)

- Inwentarz web (LOC, liczba eksportów, importy wewnętrzne) — **skryptowy** (`inventory_web.py` na `git archive edb8fb56 gra/src`).
- Inwentarz Rust (LOC, pub fn/items, testy `#[test]`) i kotwice `pierwsza_linia_pub` — **skryptowy** (`inventory_rust.py`, `evidence.py`).
- **Dowód nazwowy (plik:linia po obu stronach)** — **skryptowy** (`evidence.py` → `evidence.tsv`): dla każdego z max 6 pierwszych eksportów pliku web podaje linię jego deklaracji w `gra/src/game/<plik>` oraz deklarację o tej samej nazwie (lub snake_case / UPPER) w `rust-port/engine/src`. Dowód nazwowy dowodzi **zgodności nazwy**, nie równoważności zachowania.
- Mapowanie web → Rust (kolumny *odpowiednik Rust*, *klasa*, *status*, *punkt P6*, *test Rust*) — **RĘCZNE** (`mapping-manual.tsv`), po odczycie nazw i fragmentów kodu wskazanych w kolumnie uwagi; nie przeczytano każdej funkcji.
- **Tiery statusu CZĘŚCIOWO** (generowane przez skrypt, nie ręcznie): `CZĘŚCIOWO (heur., nazwa)` = co najmniej jeden eksport pliku web ma deklarację o tej samej nazwie w Rust (dowód nazwowy w tabeli §3); `CZĘŚCIOWO (heur., domena)` = Rust ma moduł tej domeny, ale ŻADEN eksport nie ma dowodu nazwowego (uznanie domenowe, najsłabszy poziom). `BRAK (heur.)` = brak odpowiednika logiki (dane/parametry w Rust, bez funkcji logiki, nie liczą się jako CZĘŚCIOWO). `ISTNIEJE-NIEZWERYFIKOWANE` = treść pliku wskazuje na pojęcie, którego odpowiednika nie udało się wskazać. `NIE-DOTYCZY` = UI/prezentacja/dev-tool/przeglądarka. Klasa `DATA` (loader/parser JSON) może być CZĘŚCIOWO, gdy Rust parsuje te same dane (test `*_parses_and_spot_checks`).
- Reguła rundy 2: pole danych w strukturze Rust (np. `pole epoka_wejscia`, `zdrowie_bonus_osiedle_pop`) **nie** jest odpowiednikiem logiki funkcji web. Pliki zawierające logikę, dla których w Rust jest tylko pole, są BRAK.
- `PORTOWANE-1:1` **nie został przyznany żadnemu wierszowi** — brak dowodu wektor-po-wektorze.
- Test Rust w kolumnie *test Rust* to nazwa testu o tej samej funkcji (sprawdzona w `rust-test-list.txt`); sama nazwa nie dowodzi parytetu. Pozycje, których nazwa testu dotyczy innej funkcji, mają `-`.
- Wektory referencyjne z uruchomionego weba: **NIE_ZMIERZONO** (zakaz uruchamiania weba i npm w tym temacie).

## 1. Wskaźniki pokrycia (po korekcie rundy 2)

| Wskaźnik | Wartość |
|---|---|
| Plików w `gra/src/game/**` (`git ls-tree -r --name-only edb8fb56 gra/src/game \| wc -l`) | 183 |
| Wierszy w tabeli §3 | 183 (build_gap.py: brak brakujących i nadmiarowych wierszy) |
| LOC niepuste web (gra/src/game) | 64869 |
| Łączna liczba eksportów web | 2872 |
| Pliki klasy SYSTEM+DATA | 159 (eksportów: 2652) |
| Pliki klasy UI/DEV (NIE-DOTYCZY) | 24 |
| PORTOWANE-1:1 (z dowodem) | 0 (NIE_ZMIERZONO — brak dowodu per funkcja) |
| Pliki CZĘŚCIOWO, tier nazwa (dowód nazwowy) | 18 |
| Pliki CZĘŚCIOWO, tier domena (bez dowodu nazwowego) | 70 |
| Pliki BRAK | 70 |
| Pliki ISTNIEJE-NIEZWERYFIKOWANE | 1 |
| Pokrycie plikowe SYSTEM+DATA — CZĘŚCIOWO, wszystkie tiery (górna granica) | 88 / 159 = 55.3% |
| Pokrycie plikowe SYSTEM+DATA — CZĘŚCIOWO tier nazwa (dolna granica dowodowa) | 18 / 159 = 11.3% |
| Pokrycie eksportów SYSTEM+DATA — CZĘŚCIOWO, wszystkie tiery (ważone eksportami) | 1844 / 2652 = 69.5% |
| Pokrycie eksportów SYSTEM+DATA — CZĘŚCIOWO tier nazwa | 595 / 2652 = 22.4% |
| Pokrycie eksportów SYSTEM+DATA — PORTOWANE-1:1 z dowodem | 0 / 2652 = 0.0% (NIE_ZMIERZONO per funkcja) |

Uwaga o wskaźnikach: rząd wielkości jest niepewny. Górna granica (wszystkie tiery) i dolna granica dowodowa (tier nazwa) różnią się wielokrotnie — to jest właściwy zakres niepewności; pojedynczy procent nie jest wiarygodnym wskaźnikiem parytetu. Rzeczywisty parytet wymaga testów wektorowych z weba (P6.23), których jeszcze nie ma.

### 1a. Rozkład statusów po punktach P6 (wg punktu głównego, pierwszy token przed `-`)

| Punkt P6 | CZĘŚC. nazwa | CZĘŚC. domena | BRAK | ISTN.-NIEZW. | NIE-DOTYCZY | razem |
|---|---|---|---|---|---|---|
| P6.1 | 0 | 13 | 3 | 0 | 0 | 16 |
| P6.2 | 1 | 0 | 0 | 0 | 0 | 1 |
| P6.3 | 1 | 0 | 2 | 0 | 0 | 3 |
| P6.4 | 0 | 0 | 4 | 0 | 0 | 4 |
| P6.5 | 0 | 2 | 3 | 0 | 0 | 5 |
| P6.6 | 0 | 2 | 4 | 0 | 0 | 6 |
| P6.7 | 1 | 7 | 0 | 0 | 0 | 8 |
| P6.8 | 1 | 11 | 6 | 0 | 0 | 18 |
| P6.9 | 1 | 1 | 0 | 0 | 0 | 2 |
| P6.10 | 0 | 1 | 1 | 0 | 0 | 2 |
| P6.11 | 2 | 6 | 9 | 0 | 0 | 17 |
| P6.12 | 0 | 0 | 8 | 0 | 0 | 8 |
| P6.13 | 2 | 5 | 8 | 0 | 0 | 15 |
| P6.14 | 6 | 11 | 7 | 1 | 0 | 25 |
| P6.15 | 1 | 3 | 5 | 0 | 0 | 9 |
| P6.16 | 0 | 0 | 1 | 0 | 0 | 1 |
| P6.17 | 1 | 6 | 2 | 0 | 0 | 9 |
| P6.18 | 1 | 0 | 5 | 0 | 0 | 6 |
| P6.19 | 0 | 0 | 1 | 0 | 0 | 1 |
| P6.20 | 0 | 2 | 0 | 0 | 1 | 3 |
| P6.21 | 0 | 0 | 1 | 0 | 0 | 1 |
| - | 0 | 0 | 0 | 0 | 23 | 23 |

## 2. Graf zależności (BRAK / CZĘŚCIOWO / ISTNIEJE-NIEZWERYFIKOWANE)

Krawędzie = importy wewnętrzne z `web-inventory.tsv` (kolumna `importy_wewn`) od plików SYSTEM/DATA o statusie BRAK, CZĘŚCIOWO lub ISTNIEJE-NIEZWERYFIKOWANE do plików tych samych statusów.

Liczba krawędzi: 308. Najczęściej importowane pliki (huby, top 15):

| Plik (cel) | status | punkt P6 | importujących |
|---|---|---|---|
| `cities.ts` | CZĘŚCIOWO (heur., domena) | P6.6 | 26 |
| `difficulty-cost.ts` | CZĘŚCIOWO (heur., domena) | P6.11 | 12 |
| `diplomacy.ts` | CZĘŚCIOWO (heur., nazwa) | P6.14 | 12 |
| `terrain-improvements.ts` | CZĘŚCIOWO (heur., nazwa) | P6.3 | 12 |
| `okolica.ts` | CZĘŚCIOWO (heur., domena) | P6.8 | 9 |
| `diplomacy-pn-engine.ts` | CZĘŚCIOWO (heur., nazwa) | P6.14 | 9 |
| `building-stock-cost.ts` | CZĘŚCIOWO (heur., domena) | P6.7 | 8 |
| `production.ts` | CZĘŚCIOWO (heur., domena) | P6.8 | 8 |
| `barbarians.ts` | CZĘŚCIOWO (heur., nazwa) | P6.18 | 7 |
| `diplomacy-value-catalog.ts` | CZĘŚCIOWO (heur., domena) | P6.14 | 7 |
| `r-stawki-strojenie.ts` | CZĘŚCIOWO (heur., domena) | P6.7 | 6 |
| `economy.ts` | CZĘŚCIOWO (heur., domena) | P6.8 | 6 |
| `civ-matrix.ts` | CZĘŚCIOWO (heur., domena) | P6.1 | 6 |
| `diplomacy-treaties.ts` | CZĘŚCIOWO (heur., nazwa) | P6.14 | 6 |
| `building-resource-gate.ts` | CZĘŚCIOWO (heur., domena) | P6.7 | 5 |

Pełna lista krawędzi (źródło → cel) jest wyprowadzalna z `web-inventory.tsv` przez `build_gap.py`. Uwaga: importy są wyłącznie po nazwie bazowej pliku (`basename`), więc krawędź może być fałszywie dodatnia przy kolizji nazw między katalogami.

## 3. Tabela luk — wiersz na każdy plik web (183 wierszy)

Kolumny dowodu: *dowód web* = linia deklaracji pierwszego eksportu pliku web; *dowód Rust* = (a) trafienie nazwowe `plik:linia` tej samej nazwy, albo (b) kotwica modułu docelowego `plik:linia (pierwszy pub)`. Obie kolumny są **lokalizatorami**, nie dowodem równoważności.

| # | plik web | klasa | LOC web | N eksp. | odpowiednik Rust | LOC Rust | status | punkt P6 | dowód web (plik:linia) | dowód Rust (plik:linia) | test Rust | uwagi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `ai-city-capture-executor.ts` | SYSTEM | 110 | 7 | - | - | BRAK (heur.) | P6.11 | gra/src/game/ai-city-capture-executor.ts:24 (AiCityMoveCity) | - | - | Logika ruchu/zdobycia miasta przez AI (executeAiCityMove, ai-city-capture-executor.ts:75). Jedyny trafień w Rust to komentarz domain/ai_turn.rs:1193 ('engine resolves capture'), nie logika |
| 2 | `ai-cs-absorption.ts` | SYSTEM | 263 | 10 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | gra/src/game/ai-cs-absorption.ts:15 (AiCsAbsorptionParams) | domain/barbarians.rs:15 (pierwszy pub: HexCoord) | - | wchłanianie city-states |
| 3 | `ai-difficulty-bonus.ts` | SYSTEM | 190 | 14 | data/derived.rs | 578 | CZĘŚCIOWO (heur., domena) | P6.11 | gra/src/game/ai-difficulty-bonus.ts:15 (AI_DIFFICULTY_BONUS_UNIT_TYPE) | data/derived.rs:16 (pierwszy pub: UNIT_STOCK_COSTS_JSON) | - | bonusy trudności AI |
| 4 | `ai-expansion.ts` | SYSTEM | 30 | 6 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur., domena) | P6.11 | gra/src/game/ai-expansion.ts:7 (EKSPANSJA_KLASTR_BYPASS) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | ekspansja AI |
| 5 | `ai-fog.ts` | SYSTEM | 124 | 10 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | gra/src/game/ai-fog.ts:20 (AiFogTarget) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | mgła wojny dla AI |
| 6 | `ai-major-absorb.ts` | SYSTEM | 73 | 6 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | gra/src/game/ai-major-absorb.ts:13 (AI_MAJOR_ABSORB_MIN_TURN) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | wchłanianie major przez AI |
| 7 | `ai-moc-diag.ts` | DEV | 79 | 4 | - | - | NIE-DOTYCZY | - | gra/src/game/ai-moc-diag.ts:9 (AiMocDiagCity) | - | - | diagnostyka mocy AI |
| 8 | `ai-production-priorities.ts` | SYSTEM | 25 | 3 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur., domena) | P6.11 | gra/src/game/ai-production-priorities.ts:6 (AiProductionPriorityProfile) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | production_matches_spec_priority_and_skips_already_built_buildings | priorytety produkcji |
| 9 | `ai-resource-needs.ts` | SYSTEM | 135 | 6 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | gra/src/game/ai-resource-needs.ts:30 (BuildingStockCostLookup) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | potrzeby zasobowe AI |
| 10 | `ai-threat-mode.ts` | SYSTEM | 42 | 8 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur., domena) | P6.11 | gra/src/game/ai-threat-mode.ts:13 (AI_THREAT_MAJOR_DEV_BOOST) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | hex_city_score_enemy_penalty_follows_threat_range_option | tryb zagrożenia |
| 11 | `ai.ts` | SYSTEM | 5656 | 107 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur., nazwa) | P6.11-P6.12 | gra/src/game/ai.ts:4573 (AGRESJA_AGRESYWNY_PROG) | domain/ai_turn.rs:440 (AICity) | planner_returns_production_then_actions_and_always_ends_the_turn | główny planner AI (5656 LOC) |
| 12 | `alliance-war-obligation.ts` | SYSTEM | 49 | 2 | domain/diplomacy.rs | 3849 | ISTNIEJE-NIEZWERYFIKOWANE | P6.14 | gra/src/game/alliance-war-obligation.ts:7 (AllianceWarObligationInput) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | Web: shouldHonorAllianceWarObligation (alliance-war-obligation.ts:39), 15 wystąpień 'obligation'/'honor' w pliku (zarzut 'brak słów' odrzucony dowodem). Rust: grep -i obligat w rust-port/engine/src = 0 trafień; jedyne pokrewne: stałe sojuszu (domain/diplomacy.rs:242-256). Test alliance_uses_configured_hegemon_threshold (tests/diplomacy.rs:463) NIE dowodzi zachowania i nie jest liczony jako test_rust |
| 13 | `army-concentration.ts` | SYSTEM | 303 | 15 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | gra/src/game/army-concentration.ts:13 (ARMY_CONCENTRATION_MIN_UNITS) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | koncentracja armii |
| 14 | `army-cycle.ts` | SYSTEM | 125 | 3 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.12 | gra/src/game/army-cycle.ts:58 (cyclablePlayerArmyLeadsBase) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | cykl armii |
| 15 | `army-starvation.ts` | SYSTEM | 76 | 4 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.12 | gra/src/game/army-starvation.ts:19 (StarvationResult) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | głód armii |
| 16 | `armyMerge.ts` | SYSTEM | 954 | 48 | domain/recruitment.rs | 260 | BRAK (heur.) | P6.5 | gra/src/game/armyMerge.ts:483 (SplitDestHex) | domain/recruitment.rs:11 (pierwszy pub: ResourceStock) | - | łączenie armii |
| 17 | `auto-battle-params.ts` | DATA | 36 | 6 | data/units_combat.rs | 469 | CZĘŚCIOWO (heur., nazwa) | P6.13 | gra/src/game/auto-battle-params.ts:18 (AutoBattleParamsFile) | data/units_combat.rs:373 (AutoBattleParamsFile) | auto_battle_params_parses_and_spot_checks | parametry auto-walki |
| 18 | `auto-battle-power.ts` | SYSTEM | 216 | 11 | domain/combat.rs | 467 | CZĘŚCIOWO (heur., domena) | P6.13 | gra/src/game/auto-battle-power.ts:17 (AutoBattleResolveResult) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | effective_strength_applies_counters_terrain_and_siege_structures | siła auto-walki |
| 19 | `auto-improvements.ts` | SYSTEM | 997 | 15 | domain/improvements.rs | 425 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/auto-improvements.ts:56 (AI_IMPROVEMENT_PRIORITY) | domain/improvements.rs:6 (pierwszy pub: TerrainType) | - | automatyczne ulepszenia |
| 20 | `auto-manage.ts` | SYSTEM | 406 | 8 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.12 | gra/src/game/auto-manage.ts:204 (AutoManageDecision) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | auto-zarządzanie |
| 21 | `barbarians.ts` | SYSTEM | 2489 | 52 | domain/barbarians.rs | 925 | CZĘŚCIOWO (heur., nazwa) | P6.18 | gra/src/game/barbarians.ts:49 (BARBARIAN_OWNER_ID) | domain/barbarians.rs:156 (BarbCamp) | camp_spawning_is_deterministic_and_honours_city_and_camp_spacing | barbarzyńcy |
| 22 | `battle-loot.ts` | SYSTEM | 81 | 7 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | gra/src/game/battle-loot.ts:21 (BattleLoot) | data/units_combat.rs:278 (BattleLoot) | - | łup bitewny |
| 23 | `battle-summary.ts` | UI | 156 | 7 | - | - | NIE-DOTYCZY | - | gra/src/game/battle-summary.ts:29 (BattleSummarySide) | - | - | podsumowanie bitwy (prezentacja) |
| 24 | `border-march-scan.ts` | SYSTEM | 52 | 4 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.14 | gra/src/game/border-march-scan.ts:9 (BorderMarchPair) | domain/pathfinding.rs:13 (pierwszy pub: COST_SCALE) | - | skan marszu granicą |
| 25 | `braz-access.ts` | DATA | 47 | 5 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/braz-access.ts:12 (KOPALNIA_MIEDZI_KEY) | data/civilizations.rs:11 (pierwszy pub: Num) | - | dostęp zasobu cywilizacji |
| 26 | `building-cost-tempo.ts` | DATA | 36 | 3 | domain/building_costs.rs | 259 | CZĘŚCIOWO (heur., domena) | P6.7 | gra/src/game/building-cost-tempo.ts:25 (BuildingCostPace) | domain/building_costs.rs:14 (pierwszy pub: ResourceStock) | building_table_has_exactly_the_42_canonical_ids_once_each | tempo kosztów budynków |
| 27 | `building-resource-gate.ts` | SYSTEM | 572 | 32 | domain/building_costs.rs | 259 | CZĘŚCIOWO (heur., domena) | P6.7 | gra/src/game/building-resource-gate.ts:151 (ACCESS_ONLY_RESOURCE_LABELS) | domain/building_costs.rs:14 (pierwszy pub: ResourceStock) | expenditure_requires_both_work_and_all_resources | bramka zasobowa budowy |
| 28 | `building-stock-cost.ts` | SYSTEM | 388 | 24 | domain/building_costs.rs | 259 | CZĘŚCIOWO (heur., domena) | P6.7 | gra/src/game/building-stock-cost.ts:21 (BuildingStockCost) | domain/building_costs.rs:14 (pierwszy pub: ResourceStock) | successful_spend_deducts_effective_work_and_raw_stock_atomically | koszt magazynowy |
| 29 | `building-upgrades.ts` | SYSTEM | 224 | 19 | domain/improvements.rs | 425 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/building-upgrades.ts:216 (BUILDING_GROUP_FALLBACK) | domain/improvements.rs:6 (pierwszy pub: TerrainType) | - | ulepszanie budynków |
| 30 | `capital-capture.ts` | SYSTEM | 304 | 12 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | gra/src/game/capital-capture.ts:147 (CapitalCaptureEventKind) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | - | zdobycie stolicy |
| 31 | `cities.ts` | SYSTEM | 1293 | 80 | domain/state.rs | 172 | CZĘŚCIOWO (heur., domena) | P6.6 | gra/src/game/cities.ts:469 (AI_FIXED_PROCENT_BUDYNKI) | domain/state.rs:9 (pierwszy pub: GameStateDto) | - | model miast (1293 LOC) |
| 32 | `citizen-resource-upkeep.ts` | SYSTEM | 340 | 12 | domain/resource_production.rs | 150 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/citizen-resource-upkeep.ts:127 (CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING) | domain/resource_production.rs:7 (pierwszy pub: ResourceKey) | parse_citizen_resource_upkeep_parses_and_spot_checks | utrzymanie obywateli |
| 33 | `city-defense.ts` | SYSTEM | 169 | 7 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | gra/src/game/city-defense.ts:38 (CityDefenseBonusParams) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | - | obrona miasta |
| 34 | `city-founding.ts` | SYSTEM | 145 | 11 | domain/state.rs | 172 | CZĘŚCIOWO (heur., domena) | P6.6 | gra/src/game/city-founding.ts:53 (AI_FOUNDING_SOURCE_MIN_POP) | domain/state.rs:9 (pierwszy pub: GameStateDto) | settler_founds_only_on_a_qualifying_village_and_respects_city_spacing | zakładanie miasta |
| 35 | `city-hex-clear.ts` | SYSTEM | 68 | 4 | domain/terrain.rs | 115 | BRAK (heur.) | P6.6 | gra/src/game/city-hex-clear.ts:24 (CITY_KEEP_IMPROVEMENT_KEYS) | domain/terrain.rs:9 (pierwszy pub: TerrainType) | - | czyszczenie heksu miasta |
| 36 | `city-hex-movement.ts` | SYSTEM | 78 | 6 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.3 | gra/src/game/city-hex-movement.ts:9 (CityHexRef) | domain/pathfinding.rs:13 (pierwszy pub: COST_SCALE) | - | ruch w heksie miasta |
| 37 | `city-names-pool.ts` | DATA | 269 | 23 | data/loader.rs | 217 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/city-names-pool.ts:22 (CITY_NAMES_POOL_COMMON_LEN) | data/loader.rs:51 (pierwszy pub: LoadError) | city_names_pools_json_parses_and_spot_checks | pula nazw miast |
| 38 | `city-state-difficulty.ts` | SYSTEM | 218 | 15 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | gra/src/game/city-state-difficulty.ts:83 (CITY_STATE_PLAYER_WAR_CHANCE) | domain/barbarians.rs:15 (pierwszy pub: HexCoord) | - | trudność city-states |
| 39 | `civ-ai-allocation.ts` | SYSTEM | 101 | 10 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | gra/src/game/civ-ai-allocation.ts:32 (AI_IMPROVEMENT_AUTOMATION_PERCENT) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | alokacja AI cywilizacji |
| 40 | `civ-ai-data.ts` | DATA | 202 | 15 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/civ-ai-data.ts:16 (CivAiProfile) | data/civilizations.rs:11 (pierwszy pub: Num) | civ_ai_json_parses_and_spot_checks | dane AI cywilizacji |
| 41 | `civ-bonuses.ts` | SYSTEM | 335 | 17 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/civ-bonuses.ts:13 (CivBonusEntry) | data/civilizations.rs:11 (pierwszy pub: Num) | civs_json_parses_and_spot_checks | bonusy cywilizacji |
| 42 | `civ-entry-epoch.ts` | SYSTEM | 79 | 9 | - | - | BRAK (heur.) | P6.1 | gra/src/game/civ-entry-epoch.ts:13 (CivEntryEpochRow) | - | - | Logika getCivEpokaWejscia (civ-entry-epoch.ts:27) i isCivAvailableAtGameEpoch: brak w Rust. Rust ma tylko pole danych epoka_wejscia (data/civilizations.rs:86). Mapowanie na domain/unit_epoch.rs (dostępność jednostek) odrzucone |
| 43 | `civ-matrix-semantic.ts` | DATA | 594 | 25 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/civ-matrix-semantic.ts:13 (CIV_MATRIX_SEMANTIC_DIFFICULTY) | data/civilizations.rs:11 (pierwszy pub: Num) | civ_matrix_json_parses_and_spot_checks | semantyka macierzy cywilizacji |
| 44 | `civ-matrix.ts` | DATA | 127 | 13 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/civ-matrix.ts:32 (CivMatrixData) | data/civilizations.rs:11 (pierwszy pub: Num) | civ_matrix_json_parses_and_spot_checks | macierz cywilizacji |
| 45 | `civ-names.ts` | DATA | 177 | 26 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/civ-names.ts:35 (CityNamesPoolEntry) | data/civilizations.rs:11 (pierwszy pub: Num) | civs_count_and_ids_match_web_pin | nazwy cywilizacji |
| 46 | `civ-roster.ts` | DATA | 162 | 7 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/civ-roster.ts:28 (AssignAiCivInput) | data/civilizations.rs:11 (pierwszy pub: Num) | civs_count_and_ids_match_web_pin | lista cywilizacji |
| 47 | `civ-visual.ts` | UI | 103 | 11 | - | - | NIE-DOTYCZY | - | gra/src/game/civ-visual.ts:8 (OWNER_COLORS_FALLBACK) | - | - | wizualizacja cywilizacji |
| 48 | `cluster-start.ts` | SYSTEM | 376 | 5 | domain/map_generator.rs | 1453 | BRAK (heur.) | P6.1 | gra/src/game/cluster-start.ts:83 (BuildClusterStartInput) | domain/map_generator.rs:21 (pierwszy pub: WorldType) | - | start klastra (poza gra/src/game w mapie) |
| 49 | `combat.ts` | SYSTEM | 1259 | 35 | domain/combat.rs | 467 | CZĘŚCIOWO (heur., nazwa) | P6.13 | gra/src/game/combat.ts:240 (AttackerPosition) | domain/combat.rs:160 (CombatResult) | resolver_returns_deterministic_winner_and_per_unit_losses | walka (1259 LOC) |
| 50 | `conquest-stability.ts` | SYSTEM | 177 | 11 | domain/state.rs | 172 | BRAK (heur.) | P6.6 | gra/src/game/conquest-stability.ts:34 (CityCaptureCultureOpts) | domain/state.rs:9 (pierwszy pub: GameStateDto) | - | stabilność podboju |
| 51 | `converters.ts` | SYSTEM | 324 | 20 | domain/types.rs | 453 | CZĘŚCIOWO (heur., domena) | P6.20 | gra/src/game/converters.ts:133 (CONVERTER_ERA_SCALING_PCT) | domain/types.rs:8 (pierwszy pub: ValidationError) | - | konwertery danych |
| 52 | `culture-religion.ts` | SYSTEM | 1365 | 58 | - | - | BRAK (heur.) | P6.16 | gra/src/game/culture-religion.ts:734 (CityCaptureReligionOpts) | - | - | Brak modułu religii i logiki kultury w Rust. Tylko pole magazynu culture: domain/turn_economy.rs:32 (dane, nie logika) oraz parametry religii/zaufania w dyplomacji (domain/diplomacy.rs:247-248, 551). Web: loadCultureParams, culture-religion.ts:235 |
| 53 | `cyna-access.ts` | SYSTEM | 81 | 6 | - | - | BRAK (heur.) | P6.8 | gra/src/game/cyna-access.ts:23 (KOPALNIA_CYNY_KEY) | - | - | Logika dostępu: hasCynaAccess (cyna-access.ts:79). Rust data/economy_society.rs zawiera tylko struktury parametrów i parse_* (bez hasCynaAccess) |
| 54 | `danina-nazwa.ts` | DATA | 57 | 7 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | gra/src/game/danina-nazwa.ts:15 (DaninaLabel) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | nazwa daniny |
| 55 | `defenseBreakdown.ts` | UI | 300 | 12 | - | - | NIE-DOTYCZY | - | gra/src/game/defenseBreakdown.ts:269 (CityDefenseBreakdownOpts) | - | - | rozbicie obrony (prezentacja) |
| 56 | `diag-log.ts` | DEV | 150 | 11 | - | - | NIE-DOTYCZY | - | gra/src/game/diag-log.ts:8 (DiagEntry) | - | - | logi diagnostyczne |
| 57 | `difficulty-cost.ts` | SYSTEM | 126 | 9 | data/derived.rs | 578 | CZĘŚCIOWO (heur., domena) | P6.11 | gra/src/game/difficulty-cost.ts:41 (GLOBAL_RESEARCH_COST_MULT) | data/derived.rs:16 (pierwszy pub: UNIT_STOCK_COSTS_JSON) | difficulty_is_one_type_across_domain_modules | koszt trudności |
| 58 | `diplomacy-acceptance-points.ts` | SYSTEM | 675 | 16 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-acceptance-points.ts:33 (AcceptanceSideBalance) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | diplomacy_acceptance_points_json_parses_and_spot_checks | punkty akceptacji |
| 59 | `diplomacy-ai-balance.ts` | SYSTEM | 330 | 10 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-ai-balance.ts:27 (AiResourceTradeClampCtx) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | bilans AI dyplomacji |
| 60 | `diplomacy-ai-offer-balance.ts` | SYSTEM | 642 | 23 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-ai-offer-balance.ts:74 (AI_OFFER_PW_BALANCE_TOLERANCE_PN) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | bilans ofert AI |
| 61 | `diplomacy-audience-actions.ts` | SYSTEM | 121 | 8 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-audience-actions.ts:20 (AUDIENCE_BASIC_IDS) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | akcje audiencji |
| 62 | `diplomacy-barbarian-cooperation.ts` | SYSTEM | 78 | 7 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | gra/src/game/diplomacy-barbarian-cooperation.ts:25 (BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | współpraca z barbarzyńcami |
| 63 | `diplomacy-basket-transfer.ts` | SYSTEM | 255 | 13 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., nazwa) | P6.14 | gra/src/game/diplomacy-basket-transfer.ts:20 (BasketTransferContext) | domain/diplomacy.rs:2156 (BasketTransferContext) | - | Test basket_and_treaty_duration_read_diplomacy_table (tests/derived_values.rs:911) dotyczy czasu trwania traktatu, nie transferu koszyka: ODRZUCONY jako dowód (zarzut 14 przyjęty) |
| 64 | `diplomacy-border-march.ts` | SYSTEM | 272 | 11 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | gra/src/game/diplomacy-border-march.ts:34 (BorderMarchCheckContext) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | marsz graniczny |
| 65 | `diplomacy-credibility.ts` | SYSTEM | 627 | 37 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-credibility.ts:483 (CREDIBILITY_EVENT_LABELS_PL) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | wiarygodność |
| 66 | `diplomacy-currency-trade.ts` | SYSTEM | 33 | 3 | domain/trade.rs | 1807 | CZĘŚCIOWO (heur., domena) | P6.15 | gra/src/game/diplomacy-currency-trade.ts:7 (HANDEL_KURS_RELACJA_BAZA) | domain/trade.rs:22 (pierwszy pub: serialize) | - | handel walutą |
| 67 | `diplomacy-deposit-trade.ts` | SYSTEM | 59 | 5 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | gra/src/game/diplomacy-deposit-trade.ts:17 (HANDEL_KURS_RELACJA_BAZA) | domain/trade.rs:22 (pierwszy pub: serialize) | - | handel depozytami |
| 68 | `diplomacy-display.ts` | UI | 671 | 34 | - | - | NIE-DOTYCZY | - | gra/src/game/diplomacy-display.ts:439 (BasketItemFormatCtx) | - | - | prezentacja dyplomacji |
| 69 | `diplomacy-economy.ts` | SYSTEM | 281 | 34 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-economy.ts:263 (AI_AUDIENCE_REQUEST_COOLDOWN_TURNS) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | ekonomia dyplomacji |
| 70 | `diplomacy-factors.ts` | SYSTEM | 187 | 10 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-factors.ts:97 (BreakdownPeaceTier) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | czynniki dyplomacji |
| 71 | `diplomacy-goods.ts` | SYSTEM | 126 | 7 | domain/trade.rs | 1807 | CZĘŚCIOWO (heur., domena) | P6.15 | gra/src/game/diplomacy-goods.ts:22 (OwnerGoodsIndexInput) | domain/trade.rs:22 (pierwszy pub: serialize) | - | towary w dyplomacji |
| 72 | `diplomacy-layers.ts` | SYSTEM | 345 | 25 | - | - | BRAK (heur.) | P6.14 | gra/src/game/diplomacy-layers.ts:344 (AUDIENCE_LOCK_NOTE_CITY_STATE) | - | - | Zawiera logikę gry: startRelationForPair (diplomacy-layers.ts:42), używane w cluster-start.ts:230 (relacja startowa). Rust: brak funkcji (grep start_relation/startowa w src: tylko pola danych data/economy_society_part2.rs:362) |
| 73 | `diplomacy-locks.ts` | SYSTEM | 314 | 6 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-locks.ts:43 (DiplomacyActionLockContext) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | blokady dyplomacji |
| 74 | `diplomacy-pair-summary.ts` | UI | 106 | 4 | - | - | NIE-DOTYCZY | - | gra/src/game/diplomacy-pair-summary.ts:82 (DealPartnerKind) | - | - | podsumowanie pary (prezentacja) |
| 75 | `diplomacy-peace-lock.ts` | SYSTEM | 52 | 4 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-peace-lock.ts:11 (PEACE_TREATY_LOCK_TURNS) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | blokada pokoju |
| 76 | `diplomacy-penalty-preview.ts` | UI | 152 | 7 | - | - | NIE-DOTYCZY | - | gra/src/game/diplomacy-penalty-preview.ts:25 (DiploPenaltyLine) | - | - | podgląd kar (prezentacja) |
| 77 | `diplomacy-pn-engine.ts` | SYSTEM | 431 | 30 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., nazwa) | P6.14 | gra/src/game/diplomacy-pn-engine.ts:107 (BasketItem) | domain/diplomacy.rs:1722 (BasketItem) | - | silnik PN dyplomacji |
| 78 | `diplomacy-proposals.ts` | SYSTEM | 2605 | 61 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., nazwa) | P6.14 | gra/src/game/diplomacy-proposals.ts:62 (AI_TRADE_GOLD_MAX) | domain/diplomacy.rs:2817 (DiplomaticProposal) | - | propozycje dyplomatyczne (2605 LOC) |
| 79 | `diplomacy-rejection-cooldown.ts` | SYSTEM | 75 | 7 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | gra/src/game/diplomacy-rejection-cooldown.ts:12 (AI_REJECTED_OFFER_COOLDOWN_TURNS) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | cooldown odrzuceń |
| 80 | `diplomacy-resource-trade-pick.ts` | SYSTEM | 218 | 10 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | gra/src/game/diplomacy-resource-trade-pick.ts:14 (QuantityTradableOption) | domain/trade.rs:22 (pierwszy pub: serialize) | - | wybór handlu zasobami |
| 81 | `diplomacy-tech-trade.ts` | SYSTEM | 225 | 8 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | gra/src/game/diplomacy-tech-trade.ts:80 (TechTradeDirection) | domain/trade.rs:22 (pierwszy pub: serialize) | - | handel technologią |
| 82 | `diplomacy-trade-validation.ts` | SYSTEM | 33 | 3 | domain/trade.rs | 1807 | CZĘŚCIOWO (heur., domena) | P6.15 | gra/src/game/diplomacy-trade-validation.ts:7 (TradeBasketMode) | domain/trade.rs:22 (pierwszy pub: serialize) | - | walidacja handlu |
| 83 | `diplomacy-treaties.ts` | SYSTEM | 406 | 33 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., nazwa) | P6.14 | gra/src/game/diplomacy-treaties.ts:123 (ActiveDeal) | domain/diplomacy.rs:1441 (ActiveDeal) | - | traktaty |
| 84 | `diplomacy-unit-transfer.ts` | SYSTEM | 65 | 4 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | gra/src/game/diplomacy-unit-transfer.ts:24 (SpawnTransferredUnitReason) | domain/diplomacy.rs:3885 (SpawnTransferredUnitReason) | - | transfer jednostek |
| 85 | `diplomacy-value-catalog.ts` | DATA | 661 | 40 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/diplomacy-value-catalog.ts:136 (BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | canonical_value_catalog_prices_non_quantity_basket_items | katalog wartości |
| 86 | `diplomacy-war-gates.ts` | SYSTEM | 46 | 6 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., nazwa) | P6.14 | gra/src/game/diplomacy-war-gates.ts:26 (CurrencyPayloadSlice) | domain/diplomacy.rs:2726 (isCurrencyProposalForbiddenDuringWar) | war_currency_gate_allows_only_peace_settlements | web isCurrencyProposalForbiddenDuringWar (diplomacy-war-gates.ts:46) ~ Rust is_currency_proposal_forbidden_during_war (domain/diplomacy.rs:2726), wyjątek Peace/TributeOffer ~ pokoj/trybut_oferta. Test: tests/diplomacy.rs:549. Zgodność nazwy i wyjątku po odczycie kodu; bez wektorów z weba (NIE_ZMIERZONO) |
| 87 | `diplomacy.ts` | SYSTEM | 1617 | 45 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., nazwa) | P6.14 | gra/src/game/diplomacy.ts:1087 (AIDiplomacyContext) | domain/diplomacy.rs:1011 (AIDiplomacyContext) | diplomacy_state_serializes_non_empty_pair_map | dyplomacja (1617 LOC) |
| 88 | `display-names.ts` | UI | 288 | 19 | - | - | NIE-DOTYCZY | - | gra/src/game/display-names.ts:8 (CITY_STATE_LABEL) | - | - | nazwy wyświetlane |
| 89 | `economy-upkeep.ts` | SYSTEM | 1083 | 67 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/economy-upkeep.ts:679 (BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE) | domain/turn_economy.rs:21 (pierwszy pub: ResourceStock) | - | utrzymanie ekonomii |
| 90 | `economy.ts` | SYSTEM | 1243 | 41 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/economy.ts:513 (BUILDING_HAPPINESS_BASE_PER_BUILDING) | domain/turn_economy.rs:21 (pierwszy pub: ResourceStock) | - | ekonomia (1243 LOC) |
| 91 | `effective-difficulty-for-owner.ts` | SYSTEM | 13 | 1 | data/derived.rs | 578 | CZĘŚCIOWO (heur., domena) | P6.11 | gra/src/game/effective-difficulty-for-owner.ts:8 (effectiveGameDifficultyForOwnerPure) | data/derived.rs:16 (pierwszy pub: UNIT_STOCK_COSTS_JSON) | difficulty_is_one_type_across_domain_modules | trudność właściciela |
| 92 | `embarkation.ts` | SYSTEM | 124 | 10 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.4 | gra/src/game/embarkation.ts:28 (EMBARK_DEFENSE_MULT) | domain/pathfinding.rs:13 (pierwszy pub: COST_SCALE) | - | wsiadanie na statek |
| 93 | `empire-city-defaults.ts` | SYSTEM | 525 | 24 | domain/state.rs | 172 | BRAK (heur.) | P6.6 | gra/src/game/empire-city-defaults.ts:354 (AI_DEFAULT_BUDOWA_TRYB) | domain/state.rs:9 (pierwszy pub: GameStateDto) | - | domyślne miasta imperium |
| 94 | `empire-diplo-resource-flow.ts` | SYSTEM | 34 | 2 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | gra/src/game/empire-diplo-resource-flow.ts:10 (DiploResourceFlow) | domain/trade.rs:22 (pierwszy pub: serialize) | - | przepływ zasobów dyplomacji |
| 95 | `empire-food.ts` | SYSTEM | 990 | 42 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur., domena) | P6.7 | gra/src/game/empire-food.ts:762 (AutoBalanceRationsOpts) | domain/city_growth.rs:14 (pierwszy pub: DEFAULT_POPULATION_CAP) | positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once | żywność imperium |
| 96 | `empire-handel-split.ts` | SYSTEM | 79 | 4 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | gra/src/game/empire-handel-split.ts:82 (freshOwnerDefaultPodzialHandlu) | domain/trade.rs:22 (pierwszy pub: serialize) | - | podział handlu |
| 97 | `empire-hud-totals.ts` | UI | 93 | 5 | - | - | NIE-DOTYCZY | - | gra/src/game/empire-hud-totals.ts:31 (CitySixStatValues) | - | - | sumy HUD |
| 98 | `eot-event-defer.ts` | SYSTEM | 249 | 6 | domain/events.rs | 499 | CZĘŚCIOWO (heur., domena) | P6.10 | gra/src/game/eot-event-defer.ts:77 (DIPLOMACY_MSG_PREFIX) | domain/events.rs:18 (pierwszy pub: PHASE_COUNT) | - | odroczenie zdarzeń końca tury |
| 99 | `era-change-notify.ts` | UI | 41 | 8 | - | - | NIE-DOTYCZY | - | gra/src/game/era-change-notify.ts:9 (ERA_CHANGE_NOTIFY) | - | - | powiadomienie o epoce |
| 100 | `era-gate-ui.ts` | UI | 133 | 7 | - | - | NIE-DOTYCZY | - | gra/src/game/era-gate-ui.ts:69 (ComputeEraGateInfoParams) | - | - | bramka epoki w UI |
| 101 | `first-player-city.ts` | SYSTEM | 44 | 5 | domain/playable.rs | 649 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/first-player-city.ts:9 (CityOwnerRef) | domain/playable.rs:13 (pierwszy pub: PLAYABLE_STATE_VERSION) | - | pierwsze miasto gracza |
| 102 | `forced-war-bronze.ts` | SYSTEM | 258 | 17 | - | - | BRAK (heur.) | P6.12 | gra/src/game/forced-war-bronze.ts:95 (BronzeForcedWarEligibilityInput) | - | - | NOWY SYSTEM: wymuszone wojny (brąz) |
| 103 | `forced-war-common.ts` | SYSTEM | 389 | 17 | - | - | BRAK (heur.) | P6.12 | gra/src/game/forced-war-common.ts:149 (ForcedWarEraTag) | - | - | NOWY SYSTEM: wspólne mechanizmy wymuszonych wojen |
| 104 | `forced-war-iron.ts` | SYSTEM | 271 | 17 | - | - | BRAK (heur.) | P6.12 | gra/src/game/forced-war-iron.ts:83 (EPOKA_ZELAZO_NUMER) | - | - | NOWY SYSTEM: wymuszone wojny (żelazo) |
| 105 | `forced-war-stone.ts` | SYSTEM | 151 | 17 | - | - | BRAK (heur.) | P6.12 | gra/src/game/forced-war-stone.ts:51 (PickStoneForcedWarTargetOpts) | - | - | NOWY SYSTEM: wymuszone wojny (kamień) |
| 106 | `forced-war-waves.ts` | SYSTEM | 275 | 12 | - | - | BRAK (heur.) | P6.12 | gra/src/game/forced-war-waves.ts:9 (ForcedWarWave) | - | - | NOWY SYSTEM: fale wymuszonych wojen |
| 107 | `fort-territory.ts` | SYSTEM | 205 | 9 | domain/terrain.rs | 115 | BRAK (heur.) | P6.3 | gra/src/game/fort-territory.ts:30 (FortImprovementType) | domain/terrain.rs:9 (pierwszy pub: TerrainType) | - | terytorium fortów |
| 108 | `fsa-autosave.ts` | DEV | 488 | 24 | domain/save_load.rs | 187 | NIE-DOTYCZY | P6.20 | gra/src/game/fsa-autosave.ts:127 (FSA_AUTOSAVE_FILE_PREFIX) | domain/save_load.rs:34 (pierwszy pub: CURRENT_SNAPSHOT_VERSION) | - | autozapis przeglądarkowy (File System Access) |
| 109 | `gold-deficit.ts` | SYSTEM | 216 | 17 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/gold-deficit.ts:36 (GoldDeficitParams) | domain/turn_economy.rs:21 (pierwszy pub: ResourceStock) | - | deficyt złota |
| 110 | `growth-happiness.ts` | SYSTEM | 30 | 1 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur., domena) | P6.7 | gra/src/game/growth-happiness.ts:24 (computeGrowthHappinessNetto) | domain/city_growth.rs:14 (pierwszy pub: DEFAULT_POPULATION_CAP) | hunger_penalty_is_separate_and_never_drops_below_one | wzrost a szczęście |
| 111 | `human-owners.ts` | SYSTEM | 63 | 7 | domain/playable.rs | 649 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/human-owners.ts:21 (HUMAN_OWNER_PRIMARY) | domain/playable.rs:13 (pierwszy pub: PLAYABLE_STATE_VERSION) | - | właściciele ludzcy (hot-seat) |
| 112 | `idb-storage.ts` | DEV | 197 | 5 | - | - | NIE-DOTYCZY | - | gra/src/game/idb-storage.ts:128 (idbGetItem) | - | - | Backend zapisu przeglądarkowego; importowany przez save.ts:80 (idbGetItem/idbSetItem). Ryzyko dla P6.20 (zapis): odpowiednik semantyczny w Rust to domain/save_load.rs (format, nie backend) |
| 113 | `improvement-tech.ts` | SYSTEM | 160 | 14 | domain/improvements.rs | 425 | CZĘŚCIOWO (heur., domena) | P6.17 | gra/src/game/improvement-tech.ts:10 (ClearingParams) | domain/improvements.rs:6 (pierwszy pub: TerrainType) | improvement_and_wonder_tables_cover_every_entry_once | ulepszenia a technologie |
| 114 | `inca-llama-seed.ts` | SYSTEM | 63 | 3 | domain/map_generator.rs | 1453 | BRAK (heur.) | P6.1 | gra/src/game/inca-llama-seed.ts:18 (LLAMA_PER_START) | domain/map_generator.rs:21 (pierwszy pub: WorldType) | - | ziarno lam Inków |
| 115 | `livestock-unlock.ts` | SYSTEM | 158 | 13 | domain/improvements.rs | 425 | BRAK (heur.) | P6.17 | gra/src/game/livestock-unlock.ts:12 (LIVESTOCK_IMPROVEMENT_KEYS) | domain/improvements.rs:6 (pierwszy pub: TerrainType) | - | odblokowanie hodowli |
| 116 | `load-map-source.ts` | SYSTEM | 55 | 2 | domain/save_load.rs | 187 | BRAK (heur.) | P6.21 | gra/src/game/load-map-source.ts:15 (LoadMapSourceResult) | domain/save_load.rs:34 (pierwszy pub: CURRENT_SNAPSHOT_VERSION) | - | źródło mapy przy wczytaniu |
| 117 | `manpower.ts` | SYSTEM | 798 | 52 | domain/recruitment.rs | 260 | CZĘŚCIOWO (heur., domena) | P6.5 | gra/src/game/manpower.ts:37 (CityManpowerSnapshot) | domain/recruitment.rs:11 (pierwszy pub: ResourceStock) | domain_recruitment_reads_the_unit_table_values_without_recomputing_them | manpower (798 LOC) |
| 118 | `map-rebels.ts` | SYSTEM | 78 | 5 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | gra/src/game/map-rebels.ts:14 (EPOKA_SREDNIOWIECZE) | domain/barbarians.rs:15 (pierwszy pub: HexCoord) | - | buntownicy na mapie |
| 119 | `mapSiegeDetect.ts` | SYSTEM | 84 | 8 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | gra/src/game/mapSiegeDetect.ts:12 (MapSiegeContext) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | - | detekcja oblężenia |
| 120 | `mennica-zloto-grace.ts` | SYSTEM | 98 | 10 | domain/turn_economy.rs | 340 | BRAK (heur.) | P6.8 | gra/src/game/mennica-zloto-grace.ts:14 (MENNICA_ZLOTO_GRACE_TURNS) | domain/turn_economy.rs:21 (pierwszy pub: ResourceStock) | - | łaska mennicy |
| 121 | `okolica.ts` | SYSTEM | 760 | 31 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/okolica.ts:192 (AssignOptions) | domain/city_growth.rs:14 (pierwszy pub: DEFAULT_POPULATION_CAP) | - | okolica miasta (worked tiles, 760 LOC) |
| 122 | `order.ts` | SYSTEM | 528 | 19 | domain/types.rs | 453 | CZĘŚCIOWO (heur., nazwa) | P6.2 | gra/src/game/order.ts:87 (Difficulty) | domain/types.rs:497 (Difficulty) | command_wire_shape_is_stable_for_engine_integration | komendy/rozkazy |
| 123 | `owner-epoch.ts` | SYSTEM | 120 | 6 | domain/unit_epoch.rs | 101 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/owner-epoch.ts:51 (allEraTechsResearched) | domain/unit_epoch.rs:5 (pierwszy pub: Epoch) | - | epoka właściciela |
| 124 | `owner-utils.ts` | SYSTEM | 16 | 1 | domain/player.rs | 23 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/owner-utils.ts:12 (isMajorAiOwner) | domain/player.rs:7 (pierwszy pub: Player) | - | narzędzia właściciela |
| 125 | `pending-improvements.ts` | SYSTEM | 61 | 4 | domain/improvements.rs | 425 | BRAK (heur.) | P6.8 | gra/src/game/pending-improvements.ts:8 (PendingImprovementEntry) | domain/improvements.rs:6 (pierwszy pub: TerrainType) | - | oczekujące ulepszenia |
| 126 | `planned-march.ts` | SYSTEM | 432 | 18 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.4 | gra/src/game/planned-march.ts:22 (AutoMarchSave) | domain/pathfinding.rs:13 (pierwszy pub: COST_SCALE) | - | planowany marsz |
| 127 | `playerState.ts` | SYSTEM | 617 | 27 | domain/playable.rs | 649 | CZĘŚCIOWO (heur., domena) | P6.1 | gra/src/game/playerState.ts:56 (EmpireResearchGate) | domain/playable.rs:13 (pierwszy pub: PLAYABLE_STATE_VERSION) | - | stan gracza (617 LOC) |
| 128 | `playtestMapaSwiata.ts` | DEV | 232 | 7 | - | - | NIE-DOTYCZY | - | gra/src/game/playtestMapaSwiata.ts:31 (PLAYTEST_MAPA_AI_OWNER) | - | - | playtest (dev-tool) |
| 129 | `playtestMiastoEkonomia.ts` | DEV | 165 | 5 | - | - | NIE-DOTYCZY | - | gra/src/game/playtestMiastoEkonomia.ts:20 (PLAYTEST_MIASTO_HINT) | - | - | playtest (dev-tool) |
| 130 | `playtestOdskok3v3.ts` | DEV | 272 | 8 | - | - | NIE-DOTYCZY | - | gra/src/game/playtestOdskok3v3.ts:300 (PLAYTEST_ODSKOK_HINT) | - | - | playtest (dev-tool) |
| 131 | `playtestWalkaMapy.ts` | DEV | 433 | 17 | - | - | NIE-DOTYCZY | - | gra/src/game/playtestWalkaMapy.ts:492 (PLAYTEST_BITWA_DUZA_HINT) | - | - | playtest (dev-tool) |
| 132 | `population-growth-tempo.ts` | DATA | 38 | 3 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur., domena) | P6.7 | gra/src/game/population-growth-tempo.ts:21 (WZROST_LUDNOSCI_PACE) | domain/city_growth.rs:14 (pierwszy pub: DEFAULT_POPULATION_CAP) | a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn | tempo wzrostu |
| 133 | `population-growth-v85.ts` | SYSTEM | 535 | 35 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur., nazwa) | P6.7 | gra/src/game/population-growth-v85.ts:572 (ApplyCentralFoodGrowthOpts) | domain/city_growth.rs:172 (FractionalGrowthResult) | fractional_growth_accumulates_and_freezes_at_the_population_cap | wzrost populacji v85 |
| 134 | `post-battle-map.ts` | SYSTEM | 507 | 14 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | gra/src/game/post-battle-map.ts:23 (BattleStartPos) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | - | mapa po bitwie |
| 135 | `post-capture-law.ts` | SYSTEM | 154 | 15 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | gra/src/game/post-capture-law.ts:23 (POST_CAPTURE_FRESH_TURNS) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | - | prawo po zdobyciu |
| 136 | `power-objective.ts` | SYSTEM | 259 | 12 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | gra/src/game/power-objective.ts:94 (BattlePowerModel) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | cel mocy AI |
| 137 | `power-options.ts` | DATA | 59 | 4 | data/derived.rs | 578 | CZĘŚCIOWO (heur., nazwa) | P6.11 | gra/src/game/power-options.ts:7 (PowerOpcje) | data/units_combat.rs:478 (PowerOpcje) | power_params_parses_and_spot_checks | opcje mocy |
| 138 | `power-ranking.ts` | SYSTEM | 66 | 4 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | gra/src/game/power-ranking.ts:42 (AbsolutePowerRank) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | ranking mocy |
| 139 | `power.ts` | SYSTEM | 101 | 4 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | gra/src/game/power.ts:7 (PowerContributionsCityEconomy) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | moc (ranking/AI) |
| 140 | `production.ts` | SYSTEM | 2233 | 83 | domain/resource_production.rs | 150 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/production.ts:1719 (AdvanceProductionResult) | domain/resource_production.rs:7 (pierwszy pub: ResourceKey) | production_matches_spec_priority_and_skips_already_built_buildings | produkcja (2233 LOC) |
| 141 | `r-stawki-strojenie.ts` | SYSTEM | 55 | 9 | domain/recruitment.rs:215 domain/building_costs.rs:114 | 260 | CZĘŚCIOWO (heur., domena) | P6.7 | gra/src/game/r-stawki-strojenie.ts:12 (R_STAWKI_FALA1_FALA2_MULT) | domain/recruitment.rs:11 (pierwszy pub: ResourceStock) | - | Rust ma WARTOŚCI (JSON derived: unit-gold-costs, unit-stock-costs, building-work/stock-costs), nie mechanizm skalowania. Web importuje logikę gry: production.ts:84, economy-upkeep.ts:59, difficulty-cost.ts:32, terrain-improvements.ts:9, population-growth-v85.ts:21, building-stock-cost.ts:1, main.ts:1280 |
| 142 | `rally-point.ts` | SYSTEM | 77 | 7 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.4 | gra/src/game/rally-point.ts:12 (RallyPoint) | domain/pathfinding.rs:13 (pierwszy pub: COST_SCALE) | rally_moves_multiple_units_toward_their_shared_camp | punkt zbiórki |
| 143 | `relief-preserving-improvements.ts` | SYSTEM | 40 | 2 | domain/improvements.rs | 425 | BRAK (heur.) | P6.8 | gra/src/game/relief-preserving-improvements.ts:42 (preservesHillRelief) | domain/improvements.rs:6 (pierwszy pub: TerrainType) | - | ulepszenia zachowujące ulgę |
| 144 | `research.ts` | SYSTEM | 574 | 30 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur., domena) | P6.17 | gra/src/game/research.ts:113 (AdvanceResult) | domain/turn_economy.rs:21 (pierwszy pub: ResourceStock) | research_costs_cover_each_tech_tempo_and_axis_once | badania |
| 145 | `resource-access.ts` | SYSTEM | 322 | 10 | domain/resource_production.rs | 150 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/resource-access.ts:243 (CITY_PANEL_RANGE_DEPOSIT_LABELS) | domain/resource_production.rs:7 (pierwszy pub: ResourceKey) | - | dostęp do zasobów |
| 146 | `resource-usage-breakdown.ts` | UI | 131 | 5 | - | - | NIE-DOTYCZY | - | gra/src/game/resource-usage-breakdown.ts:66 (ResourceUsageBreakdown) | - | - | rozbicie zużycia (prezentacja) |
| 147 | `ruch-swiata-tempo.ts` | DATA | 40 | 3 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur., domena) | P6.9 | gra/src/game/ruch-swiata-tempo.ts:23 (RUCH_SWIATA_PACE) | domain/turn_economy.rs:21 (pierwszy pub: ResourceStock) | - | tempo ruchu świata |
| 148 | `save-label.ts` | UI | 58 | 4 | - | - | NIE-DOTYCZY | - | gra/src/game/save-label.ts:10 (DefaultSaveLabelInput) | - | - | etykieta zapisu |
| 149 | `save.ts` | SYSTEM | 1040 | 29 | domain/save_load.rs | 187 | CZĘŚCIOWO (heur., domena) | P6.20 | gra/src/game/save.ts:166 (AUTOSAVE_SLOT_ID) | domain/save_load.rs:34 (pierwszy pub: CURRENT_SNAPSHOT_VERSION) | state_round_trip_preserves_camp_identity_and_visit_memory | Zapis (1040 LOC). Zależność: idb-storage.ts:80 (backend przeglądarkowy, NIE-DOTYCZY w Rust, ale determinuje semantykę zapisu/odczytu w P6.20) |
| 150 | `scout-auto-explore.ts` | SYSTEM | 244 | 7 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.4 | gra/src/game/scout-auto-explore.ts:199 (advanceScoutAutoExplore) | domain/pathfinding.rs:13 (pierwszy pub: COST_SCALE) | - | auto-eksploracja zwiadowcy |
| 151 | `side-panel-event-link.ts` | UI | 107 | 5 | - | - | NIE-DOTYCZY | - | gra/src/game/side-panel-event-link.ts:42 (SidePanelEventLink) | - | - | link zdarzenia (prezentacja) |
| 152 | `side-panel-event-priority.ts` | SYSTEM | 8 | 1 | - | - | BRAK (heur.) | P6.10 | gra/src/game/side-panel-event-priority.ts:7 (isBlockingSidePanelEvent) | - | - | Ryzyko gry: isBlockingSidePanelEvent (side-panel-event-priority.ts:7) używany w main.ts:14264 do blokowania końca tury. Rust: grep -i blocking w rust-port/engine/src = 0 trafień. Klasa zmieniona z UI na SYSTEM (zarzut 15) |
| 153 | `siege.ts` | SYSTEM | 774 | 32 | domain/combat.rs | 467 | CZĘŚCIOWO (heur., domena) | P6.13 | gra/src/game/siege.ts:360 (CityDefenseBonus) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | - | oblężenie (774 LOC) |
| 154 | `siegeAi.ts` | SYSTEM | 259 | 18 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.13 | gra/src/game/siegeAi.ts:148 (AISiegeDecision) | domain/ai_turn.rs:29 (pierwszy pub: default_min_city_distance_value) | - | AI oblężenia |
| 155 | `siegeDefenders.ts` | SYSTEM | 145 | 13 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | gra/src/game/siegeDefenders.ts:13 (BuildingIdCollection) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | - | obrońcy oblężenia |
| 156 | `siegeMachines.ts` | SYSTEM | 73 | 10 | data/units_combat.rs | 469 | CZĘŚCIOWO (heur., domena) | P6.13 | gra/src/game/siegeMachines.ts:15 (SIEGE_MACHINE_TYPE_ID) | data/units_combat.rs:15 (pierwszy pub: UNITS_JSON) | city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus | maszyny oblężnicze |
| 157 | `society-breakdown.ts` | SYSTEM | 1058 | 53 | domain/ids.rs:45 | 105 | BRAK (heur.) | P6.8 | gra/src/game/society-breakdown.ts:201 (FALLBACK_REVOLT_PARAMS) | domain/ids.rs:13 (pierwszy pub: new) | - | Zawiera logikę gry: pickOsiedlePopBonus (society-breakdown.ts:312) używany w turn-economy.ts:453 (i :170 import). Rust: brak funkcji osiedla (grep osiedle: tylko pola danych data/economy_society.rs:422,461,654). Stała REBEL_FACTION_OWNER_ID=-99 (society-breakdown.ts:206) ma odpowiednik LEGACY_REBEL_OWNER_ID (domain/ids.rs:45), ale używana w human-owners.ts:18 i post-capture-law.ts:17,58,170 |
| 158 | `society-inputs.ts` | SYSTEM | 114 | 8 | data/economy_society.rs | 839 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/society-inputs.ts:45 (CultureMixLine) | data/economy_society.rs:10 (pierwszy pub: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik) | parse_society_params_parses_and_spot_checks | wejścia społeczeństwa |
| 159 | `spich-auto-ration-notify.ts` | UI | 28 | 3 | - | - | NIE-DOTYCZY | - | gra/src/game/spich-auto-ration-notify.ts:8 (AUTO_RATION_EVENT_COPY) | - | - | powiadomienie o racjonowaniu |
| 160 | `start-preview.ts` | UI | 119 | 4 | - | - | NIE-DOTYCZY | - | gra/src/game/start-preview.ts:39 (BuildStartPreviewInput) | - | - | podgląd startu |
| 161 | `tech-tempo.ts` | DATA | 37 | 3 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur., nazwa) | P6.17 | gra/src/game/tech-tempo.ts:22 (TEMPO_GRY) | data/buildings_tech.rs:371 (TempoGry) | research_costs_cover_each_tech_tempo_and_axis_once | tempo technologii |
| 162 | `tech-tree.ts` | SYSTEM | 142 | 8 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur., domena) | P6.17 | gra/src/game/tech-tree.ts:17 (TECH_TREE_MODEL_LINEAR) | data/buildings_tech.rs:23 (pierwszy pub: BUILDINGS_JSON) | tech_json_parses | drzewko technologii |
| 163 | `terrain-improvements.ts` | SYSTEM | 437 | 35 | domain/improvements.rs | 425 | CZĘŚCIOWO (heur., nazwa) | P6.3 | gra/src/game/terrain-improvements.ts:445 (FARMA_POTENTIAL_FOOD_BONUS) | data/terrain_map.rs:75 (ImprovementBonus) | terrain_improvements_parses_strict_with_farma_and_posterunek | ulepszenia terenu |
| 164 | `trade-routes.ts` | SYSTEM | 1945 | 49 | domain/trade.rs | 1807 | CZĘŚCIOWO (heur., nazwa) | P6.15 | gra/src/game/trade-routes.ts:179 (CityConnectionResult) | domain/trade.rs:473 (CityConnectionResult) | - | szlaki handlowe (1945 LOC) |
| 165 | `triumph-city-state.ts` | SYSTEM | 70 | 5 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | gra/src/game/triumph-city-state.ts:11 (TRIUMPH_CS_HINT_MS) | domain/barbarians.rs:15 (pierwszy pub: HexCoord) | - | triumf państwa-miasta |
| 166 | `turn-economy.ts` | SYSTEM | 2782 | 47 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur., nazwa) | P6.9 | gra/src/game/turn-economy.ts:1097 (CityEconomyTick) | domain/types.rs:497 (Difficulty) | - | ekonomia tury (2782 LOC) |
| 167 | `unit-building-bonuses.ts` | SYSTEM | 488 | 33 | domain/combat.rs | 467 | BRAK (heur.) | P6.5 | gra/src/game/unit-building-bonuses.ts:67 (ARMOR_BUILDING_IDS) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | - | bonusy budynków jednostek |
| 168 | `unit-card-stats.ts` | UI | 116 | 4 | - | - | NIE-DOTYCZY | - | gra/src/game/unit-card-stats.ts:16 (UnitCardCombatBases) | - | - | statystyki karty jednostki |
| 169 | `unit-cost-tempo.ts` | DATA | 36 | 3 | domain/recruitment.rs | 260 | CZĘŚCIOWO (heur., domena) | P6.5 | gra/src/game/unit-cost-tempo.ts:19 (KOSZT_JEDNOSTEK_PACE) | domain/recruitment.rs:11 (pierwszy pub: ResourceStock) | unit_table_has_one_row_per_units_json_record_and_no_extra_rows | tempo kosztu jednostek |
| 170 | `unit-power.ts` | SYSTEM | 191 | 11 | domain/combat.rs | 467 | CZĘŚCIOWO (heur., domena) | P6.13 | gra/src/game/unit-power.ts:36 (PowerBreakdown) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | counters_parses_and_spot_checks | moc jednostki |
| 171 | `unit-replace-context.ts` | SYSTEM | 60 | 2 | domain/recruitment.rs | 260 | BRAK (heur.) | P6.5 | gra/src/game/unit-replace-context.ts:50 (ReplaceAvailabilityCtxParams) | domain/recruitment.rs:11 (pierwszy pub: ResourceStock) | - | kontekst zastąpienia jednostki |
| 172 | `veteran.ts` | SYSTEM | 387 | 32 | domain/combat.rs | 467 | CZĘŚCIOWO (heur., domena) | P6.13 | gra/src/game/veteran.ts:71 (VETERAN_BONUS_FRAC) | domain/combat.rs:8 (pierwszy pub: CounterBonus) | veteran_levels_are_complete_and_non_decreasing | weterani |
| 173 | `victory.ts` | SYSTEM | 210 | 19 | - | - | BRAK (heur.) | P6.19 | gra/src/game/victory.ts:38 (DOMINACJA_WYMAGA_OSTATNIEJ_EPOKI) | - | - | Brak logiki warunków zwycięstwa. Rust ma tylko slot fazy TurnPhase::Victory (domain/events.rs:60), bez warunków. Web: victoryModeAllowsDominacja (victory.ts:57), stałe progu dominacji (victory.ts:35-39) |
| 174 | `villageRewards.ts` | SYSTEM | 189 | 19 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | gra/src/game/villageRewards.ts:66 (PickVillageRewardOptions) | domain/barbarians.rs:15 (pierwszy pub: HexCoord) | - | nagrody wiosek |
| 175 | `visibility.ts` | SYSTEM | 294 | 19 | domain/state.rs | 172 | BRAK (heur.) | P6.6 | gra/src/game/visibility.ts:263 (ComputePlayerVisibilityOptions) | domain/state.rs:9 (pierwszy pub: GameStateDto) | - | widoczność |
| 176 | `wealth.ts` | SYSTEM | 228 | 15 | data/economy_society.rs | 839 | CZĘŚCIOWO (heur., nazwa) | P6.8 | gra/src/game/wealth.ts:31 (Difficulty) | domain/types.rs:497 (Difficulty) | - | bogactwo |
| 177 | `wiarygodnosc-types.ts` | DATA | 52 | 7 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur., domena) | P6.14 | gra/src/game/wiarygodnosc-types.ts:11 (WIARYGODNOSC_SKALA_MAX) | domain/diplomacy.rs:11 (pierwszy pub: MAX_TRUST) | - | typy wiarygodności |
| 178 | `wonder-availability.ts` | SYSTEM | 105 | 6 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur., domena) | P6.17 | gra/src/game/wonder-availability.ts:20 (WonderBlockReason) | data/buildings_tech.rs:23 (pierwszy pub: BUILDINGS_JSON) | wonders_json_parses | dostępność cudów |
| 179 | `wonder-civ-tech.ts` | SYSTEM | 100 | 7 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur., domena) | P6.17 | gra/src/game/wonder-civ-tech.ts:13 (TechEpochMap) | data/buildings_tech.rs:23 (pierwszy pub: BUILDINGS_JSON) | wonders_state_keys_match_web_pin | cuda a cywilizacja |
| 180 | `wonder-map-build.ts` | SYSTEM | 62 | 4 | domain/improvements.rs | 425 | BRAK (heur.) | P6.17 | gra/src/game/wonder-map-build.ts:16 (WonderBuildAdvanceResult) | domain/improvements.rs:6 (pierwszy pub: TerrainType) | - | budowa cudów na mapie |
| 181 | `wonders-data.ts` | DATA | 279 | 27 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur., domena) | P6.17 | gra/src/game/wonders-data.ts:75 (WonderAbsolutMeta) | data/buildings_tech.rs:23 (pierwszy pub: BUILDINGS_JSON) | wonders_json_parses | dane cudów |
| 182 | `zelazo-access.ts` | SYSTEM | 79 | 8 | - | - | BRAK (heur.) | P6.8 | gra/src/game/zelazo-access.ts:19 (KOPALNIA_KEY) | - | - | Logika dostępu: hasZelazoAccess (zelazo-access.ts:79), używana w main.ts:891 i trade-routes.ts:1812. Rust data/economy_society.rs zawiera tylko parametry i parse_* (bez hasZelazoAccess) |
| 183 | `zloto-access.ts` | DATA | 129 | 14 | data/economy_society.rs | 839 | CZĘŚCIOWO (heur., domena) | P6.8 | gra/src/game/zloto-access.ts:19 (KOPALNIA_ZLOTA_KEY) | data/economy_society.rs:10 (pierwszy pub: EconParamsEkonomiaMiastaProgWzrostuWspolczynnik) | - | dostęp zasobu złoto |

## 4. Walidacja pomiaru po stronie Rust (pin e810d0d3, runda 2)

Uruchomione w worktree `wf_7d66f2d3-e42-3` na drzewie `rust-port/engine` (zero różnic względem e810d0d3: `git diff e810d0d3 HEAD -- rust-port` puste), `CARGO_INCREMENTAL=0`, osobny `CARGO_TARGET_DIR` w katalogu scratch (usunięty po zakończeniu). Pełne, nieskracane wyjścia z liniami `EXIT=` są w katalogu runu:

| Bramka | Komenda | Wynik | Surowe wyjście (pełne) |
|---|---|---|---|
| fmt | `cargo fmt --manifest-path rust-port/engine/Cargo.toml -- --check` | EXIT=0 | `rust-fmt-check.log` |
| clippy | `cargo clippy --manifest-path rust-port/engine/Cargo.toml --all-targets -- -D warnings` | EXIT=0 (`Finished`, 0 ostrzeżeń) | `rust-clippy.log` |
| test | `cargo test --manifest-path rust-port/engine/Cargo.toml` | EXIT=0; 40 suit `test result: ok`; **373 passed, 0 failed** | `rust-test.log` |
| lista | `cargo test --manifest-path rust-port/engine/Cargo.toml -- --list` | EXIT=0; 373 testów (`: test`) | `rust-test-list.txt` |

Stan Rust: `domain/**` (28 plików), `data/**` (9 plików razem z `mod.rs`), `bridge.rs`, `steam_adapter.rs`, `lib.rs`, `logging.rs`, `version.rs`; `rust-inventory.tsv` podaje LOC niepuste i liczbę pub fn/items/testów per plik (skrypt `inventory_rust.py`).

Wcześniejsze logi z rundy 1 zostały zastąpione pełnymi wyjściami z tej rundy (poprzednie `rust-fmt-check.log` miało tylko 7 bajtów bez komendy i bez linii komendy).

## 5. Lista nowych, nieportowanych systemów oraz rzeczy, których web nie ma a Rust ma

Każdy dowód braku poniżej to komenda wykonana w tej rundzie. „Brak trafień” oznacza 0 linii wyjścia.

### 5a. Nowe / nieportowane systemy (web ma, Rust nie ma lub ma tylko slot/pole danych)

| System | Pliki web (LOC niepuste, `web-inventory.tsv`) | Dowód w Rust | Status tabeli §3 | Uwagi |
|---|---|---|---|---|
| Wymuszone wojny i fale (`forced-war-*`) | `forced-war-common.ts`, `forced-war-bronze.ts`, `forced-war-iron.ts`, `forced-war-stone.ts`, `forced-war-waves.ts` — razem 5 plików, **1344 LOC niepuste**; `forced-war-waves` importowany przez `ai.ts` (import w pliku `ai.ts`) | `grep -rni forced rust-port/engine/src` — **0 trafień** | BRAK (heur.), P6.12 | Plan wskazuje jako nowy, nieportowany system. Źródło prawdy: web (pin edb8fb56). Wektory z weba: NIE_ZMIERZONO. |
| Religia i kultura | `culture-religion.ts` (1365 LOC, 58 eksportów) | Rust: pole `culture` w `domain/turn_economy.rs:32` (magazyn, bez logiki) oraz pola zaufania zależne od religii w `domain/diplomacy.rs:247-248` (`same_religion_trust_per_turn`, `different_religion_trust_per_turn`) i wariant `wspolna_religia` w `domain/diplomacy.rs:551`. Brak modułu religii i brak logiki kultury (`grep -rni religi rust-port/engine/src/domain` — brak funkcji religii). | BRAK (heur.), P6.16 | Parametry dyplomacji nie są logiką religii web. Rozmiar L. |
| Warunki zwycięstwa | `victory.ts` (`checkVictory`, `victory.ts:204`; progi `victory.ts:32-39`) | Rust: tylko slot fazy `TurnPhase::Victory` (`domain/events.rs:60`), bez warunków | BRAK (heur.), P6.19 | Najmniejszy zysk przy największym ryzyku semantycznym (tryby zwycięstwa). |
| Absorpcja city-states i wsp. | `ai-cs-absorption.ts` (263 LOC), `ai-major-absorb.ts` (73 LOC) | brak trafień po nazwie w `domain/barbarians.rs` ani `domain/ai_turn.rs` | BRAK (heur.), P6.18 / P6.11 | — |
| Przejęcie miasta przez AI | `ai-city-capture-executor.ts` (`executeAiCityMove`, `:75`) | jedyny trafień: komentarz `domain/ai_turn.rs:1193` („engine resolves capture”) — nie logika | BRAK (heur.), P6.11 | Korekta rundy 2 (zarzut 6). |
| Obowiązek wojny sojuszu | `alliance-war-obligation.ts` (`shouldHonorAllianceWarObligation`, `:39`) | `grep -rni obligat rust-port/engine/src` — 0 trafień | ISTNIEJE-NIEZWERYFIKOWANE, P6.14 | Korekta rundy 2 (zarzut 9). |
| Start relacji dyplomatycznej | `diplomacy-layers.ts` (`startRelationForPair`, `:42`), używane w `cluster-start.ts:230` | `grep -rni start_relation\|startowa rust-port/engine/src` — tylko pola danych `data/economy_society_part2.rs:362` | BRAK (heur.), P6.14 | Korekta rundy 2 (zarzut 3). |
| Blokada końca tury przez zdarzenia paneli | `side-panel-event-priority.ts` (`isBlockingSidePanelEvent`, `:7`), używane w `main.ts:14264` | `grep -rni blocking rust-port/engine/src` — 0 trafień | BRAK (heur.), P6.10 | Korekta rundy 2 (zarzut 15). |

### 5b. Rzeczy, których web (w `gra/src/game/**`) nie ma, a Rust ma

| Element Rust | Dowód | Komentarz |
|---|---|---|
| `domain/replay.rs` | `grep -rli replay gra/src/game` — **0 trafień** (trafienia w web tylko w `map/`, `battle/`, `main.ts`) | Replay jest Rust-only. Zakładamy (ZAŁOŻENIE), że jest nową funkcją Rust testowaną wewnętrznie; parytet z web nie jest wymagany (P6.22). |
| `domain/ids.rs` (typowane identyfikatory) | konstrukt Rust (`Owner` enum); web używa liczb | NIE-DOTYCZY parytetu funkcjonalnego, ale `LEGACY_REBEL_OWNER_ID = -99` (`domain/ids.rs:45`) to odpowiednik stałej web `REBEL_FACTION_OWNER_ID` (`society-breakdown.ts:206`). |
| `domain/rng.rs` | web: mulberry32 w `gra/src/map/gen-helpers.ts` i `gra/src/map/generator.ts` (`grep -rln mulberry32 gra/src`), nie w `game/` | Sekwencja RNG wymaga wektorów z weba (NIE_ZMIERZONO). |
| `steam_adapter.rs`, `version.rs`, `logging.rs` | brak odpowiednika w `game/` | Platforma/adapter — NIE-DOTYCZY dla gameplay parity. |
| `bridge.rs` | adapter Tauri | NIE-DOTYCZY; wchodzi w P7. |

## 6b. Propozycja backlogu P6 — rozmiary i kolizje (wyliczone skryptem)

Rozmiar = suma LOC niepuste plików web, których **punkt główny** (pierwszy punkt przed `-` w `mapping-manual.tsv`) należy do zakresu tematu. Progi: S < 300, M 300–999, L 1000–1999, XL ≥ 2000 LOC web. Tematy bez plików web (P6-22 replay, P6-23, P6-24) nie mają rozmiaru web.

| ID tematu | punkty | pliki web | LOC web (suma) | rozmiar | allowlista Rust | zależności | równoległość |
|---|---|---|---|---|---|---|---|
| R-RUSTPORT-P6-1-STAN-STARTOWY | P6.1 | 16 | 3291 | XL | domain/playable.rs, domain/player.rs, domain/unit_epoch.rs, domain/state.rs, tests/p6_1_stan_startowy.rs (nowy) | P5 zamknięte | start |
| R-RUSTPORT-P6-2-KOMENDY | P6.2 | 1 | 528 | M | domain/types.rs, domain/session.rs, tests/p6_2_komendy.rs (nowy) | P6.1 | po P6.1 (wspólny types.rs) |
| R-RUSTPORT-P6-3-TEREN | P6.3 | 3 | 720 | M | domain/terrain.rs, domain/improvements.rs, domain/pathfinding.rs, tests/p6_3_teren.rs (nowy) | P6.2 | sekwencyjnie z P6-4 (pathfinding.rs) |
| R-RUSTPORT-P6-4-JEDNOSTKI-RUCH | P6.4 | 4 | 877 | M | domain/pathfinding.rs, domain/recruitment.rs, tests/p6_4_ruch.rs (nowy) | P6.3 | sekwencyjnie z P6-3 i P6-5 |
| R-RUSTPORT-P6-5-JEDNOSTKI-ZYCIE | P6.5 | 5 | 2336 | XL | domain/recruitment.rs, domain/combat.rs (tylko bonusy budynków), tests/p6_5_jednostki.rs (nowy) | P6.4 | sekwencyjnie z P6-4 |
| R-RUSTPORT-P6-6-MIASTA-ZAKLADANIE | P6.6 | 6 | 2502 | XL | domain/state.rs, domain/terrain.rs, tests/p6_6_miasta.rs (nowy) | P6.5 | po P6-5 (state.rs) |
| R-RUSTPORT-P6-7-MIASTA-WZROST | P6.7 | 8 | 2644 | XL | domain/city_growth.rs, domain/building_costs.rs, tests/p6_7_wzrost.rs (nowy) | P6.6 | sekwencyjnie z P6-6 |
| R-RUSTPORT-P6-8-MIASTA-EKONOMIA | P6.8 | 18 | 9306 | XL | domain/resource_production.rs, domain/turn_economy.rs, domain/improvements.rs, tests/p6_8_ekonomia.rs (nowy) | P6.7 | sekwencyjnie z P6-7; XL: podział 8a produkcja / 8b utrzymanie / 8c okolica |
| R-RUSTPORT-P6-9-TURA | P6.9, P6.10 | 4 | 3079 | XL | domain/turn_economy.rs, domain/events.rs, tests/p6_9_tura.rs (nowy) | P6.8 | po P6-8 (turn_economy.rs) |
| R-RUSTPORT-P6-11-AI | P6.11 | 17 | 7413 | XL | domain/ai_turn.rs, domain/power.rs (nowy), data/derived.rs, tests/p6_11_ai.rs (nowy) | P6.9 | 11a–11c sekwencyjnie (ai_turn.rs) |
| R-RUSTPORT-P6-12-AI-WOJNY | P6.12 | 8 | 1951 | L | domain/forced_war.rs (nowy), domain/ai_turn.rs (tylko wywołanie), tests/p6_12_wojny.rs (nowy) | P6.11 (wspólny ai_turn.rs) | równolegle z P6-13/P6-16/P6-17 (rozłączne allowlisty, patrz §6b-i) |
| R-RUSTPORT-P6-13-WALKA | P6.13 | 15 | 4639 | XL | domain/combat.rs, data/units_combat.rs, tests/p6_13_walka.rs (nowy) | P6.4, P6.9 | równolegle z P6-12/P6-16/P6-17 (rozłączne allowlisty) |
| R-RUSTPORT-P6-14-DYPLOMACJA | P6.14 | 25 | 10295 | XL | domain/diplomacy.rs, tests/p6_14_dyplomacja.rs (nowy); podział 14a propozycje/traktaty, 14b bilans AI, 14c katalog wartości | P6.9 | 14a–14c sekwencyjnie (diplomacy.rs) |
| R-RUSTPORT-P6-15-HANDEL | P6.15 | 9 | 2752 | XL | domain/trade.rs, tests/p6_15_handel.rs (nowy) | P6.14 | po P6-14 |
| R-RUSTPORT-P6-16-KULTURA-RELIGIA | P6.16 | 1 | 1365 | L | domain/culture.rs (nowy), domain/turn_economy.rs (tylko pole culture), tests/p6_16_kultura.rs (nowy) | P6.9 | równolegle z P6-12/P6-13/P6-17 (turn_economy.rs po P6-9) |
| R-RUSTPORT-P6-17-TECHNOLOGIE-CUDA | P6.17 | 9 | 1617 | L | data/buildings_tech.rs, domain/improvements.rs (po P6-8), tests/p6_17_tech.rs (nowy) | P6.8 | równolegle z P6-12/P6-13/P6-16 (improvements.rs po P6-8) |
| R-RUSTPORT-P6-18-BARBARZYNCY-PANSTWA | P6.18 | 6 | 3307 | XL | domain/barbarians.rs, tests/p6_18_barbarzyncy.rs (nowy) | P6.13 | po P6-13 |
| R-RUSTPORT-P6-19-ZWYCIESTWO | P6.19 | 1 | 210 | S | domain/events.rs, domain/victory.rs (nowy), tests/p6_19_zwyciestwo.rs (nowy) | P6.9, P6.14, P6.17 | po P6-17 |
| R-RUSTPORT-P6-20-SAVE | P6.20 | 3 | 1852 | L | domain/save_load.rs, tests/p6_20_zapis.rs (nowy) | P6.1–P6.19 | po domknięciu stanu |
| R-RUSTPORT-P6-21-LOAD | P6.21 | 1 | 55 | S | domain/save_load.rs, tests/p6_21_wczytanie.rs (nowy) | P6.20 | sekwencyjnie z P6-20 |
| R-RUSTPORT-P6-22-REPLAY | P6.22 | 0 | 0 | n/d (bez plików web) | domain/replay.rs, tests/p6_22_replay.rs (nowy) | P6.20 | po P6-20 |
| R-RUSTPORT-P6-23-TESTY (REGUŁA, nie równoległy temat) | P6.23 | 0 | 0 | n/d (bez plików web) | brak wspólnych plików tests/ (tests/p6_* są per temat) | każdy temat | wewnątrz każdego tematu; autotests Cargo domyślne, każdy plik tests/*.rs to osobny crate, brak [[test]] w Cargo.toml |
| R-RUSTPORT-P6-24-EVALUATOR | P6.24 | 0 | 0 | n/d (bez plików web) | brak zmian kodu | P6.1–P6.23 | na końcu |

### 6b-i. Kontrola kolizji allowlist (skrypt)

Dla każdej pary tematów zbiór wspólnych ścieżek Rust (bez plików testów `tests/p6_*`, które są nowe i per temat). Para z niepustym przecięciem nie może być oznaczona jako równoległa.

| temat A | temat B | wspólne ścieżki | czy oznaczone równoległe |
|---|---|---|---|
| R-RUSTPORT-P6-1-STAN-STARTOWY | R-RUSTPORT-P6-6-MIASTA-ZAKLADANIE | `domain/state.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-3-TEREN | R-RUSTPORT-P6-4-JEDNOSTKI-RUCH | `domain/pathfinding.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-3-TEREN | R-RUSTPORT-P6-6-MIASTA-ZAKLADANIE | `domain/terrain.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-3-TEREN | R-RUSTPORT-P6-8-MIASTA-EKONOMIA | `domain/improvements.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-3-TEREN | R-RUSTPORT-P6-17-TECHNOLOGIE-CUDA | `domain/improvements.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-4-JEDNOSTKI-RUCH | R-RUSTPORT-P6-5-JEDNOSTKI-ZYCIE | `domain/recruitment.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-5-JEDNOSTKI-ZYCIE | R-RUSTPORT-P6-13-WALKA | `domain/combat.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-8-MIASTA-EKONOMIA | R-RUSTPORT-P6-9-TURA | `domain/turn_economy.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-8-MIASTA-EKONOMIA | R-RUSTPORT-P6-16-KULTURA-RELIGIA | `domain/turn_economy.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-8-MIASTA-EKONOMIA | R-RUSTPORT-P6-17-TECHNOLOGIE-CUDA | `domain/improvements.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-9-TURA | R-RUSTPORT-P6-16-KULTURA-RELIGIA | `domain/turn_economy.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-9-TURA | R-RUSTPORT-P6-19-ZWYCIESTWO | `domain/events.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-11-AI | R-RUSTPORT-P6-12-AI-WOJNY | `domain/ai_turn.rs` | nie (sekwencyjnie) |
| R-RUSTPORT-P6-20-SAVE | R-RUSTPORT-P6-21-LOAD | `domain/save_load.rs` | nie (sekwencyjnie) |

Wynik kontroli równoległości (P6-12 ‖ P6-13 ‖ P6-16 ‖ P6-17): brak wspólnych ścieżek; zbiory allowlist są rozłączne.

## 6a. Kolejność i krytyczna ścieżka (runda 2)

Zależności są brane WYŁĄCZNIE z kolumny „zależności” tabeli §6b (`backlog.tsv`). Poprzednia ścieżka `P6.9 → P6.11 → P6.13 → P6.14` nie wynikała z tej tabeli (zarzut 13); usunięto ją.

**Krytyczna ścieżka (łańcuch zależności, bez wag):**
P6.1 → P6.2 → P6.3 → P6.4 → P6.5 → P6.6 → P6.7 → P6.8 → P6.9 → P6.14 → P6.15 → P6.20 → P6.21 → P6.24.

**Gałęzie poza ścieżką, które muszą się zakończyć przed P6.20** (P6.20 zależy od P6.1–P6.19):
- P6.11 (po P6.9) → P6.12 (po P6.11);
- P6.13 (po P6.4 i P6.9) → P6.18 (po P6.13);
- P6.16 (po P6.9);
- P6.17 (po P6.8) → P6.19 (po P6.9, P6.14, P6.17).
P6.22 (replay) — po P6.20.

**Równoległość (sprawdzona skryptem, §6b-i):** P6.12 ‖ P6.13 ‖ P6.16 ‖ P6.17 po osiągnięciu ich wspólnych zależności; ich allowlisty Rust są rozłączne (wynik kontroli w §6b-i). P6.11 i P6.12 dzielą `domain/ai_turn.rs` — sekwencyjnie. Pozostałe pary dzielące pliki są sekwencyjne: `pathfinding.rs` (P6.3/P6.4), `recruitment.rs` (P6.4/P6.5), `state.rs` (P6.5/P6.6), `turn_economy.rs` (P6.8/P6.9, P6.16 po P6.9), `improvements.rs` (P6.8 przed P6.17), `diplomacy.rs` (P6.14, podział 14a–14c), `trade.rs` (P6.15).

**Testy (zarzut 13):** P6.23 NIE jest tematem równoległym. Reguła: każdy temat dodaje WYŁĄCZNIE nowe pliki `rust-port/engine/tests/p6_<id>_*.rs` i nie edytuje wspólnych plików testów. Cargo używa domyślnych `autotests` (brak `[[test]]` w `Cargo.toml`, sprawdzone), więc każdy plik `tests/*.rs` jest osobnym crate'em i nowe pliki nie kolidują. Dlatego cztery równoległe tematy nie dotykają wspólnego pliku testów.

**Rozmiary i zakresy:** patrz §6b (skryptowo). Tematy P6.8 (XL) i P6.11 (XL, 11a–11c) są wieloetapowe i wymagają podziału w dispatchu.

## 7. Zero zmian poza allowlistą — samokontrola (runda 2)

Zmienione/dodane w tym temacie: `dyspozycje/rust-port/p6/P6-0-GAP-ANALYSIS.md` (nowy) i `dyspozycje/autobot/runs/R-RUSTPORT-P6-0-GAP-ANALYSIS-Q1/**`. Brak zmian w `gra/**`, `rust-port/**`, `src-tauri/**`. Cargo uruchomiony z `CARGO_TARGET_DIR` poza repo; `Cargo.lock` nie został dodany do commita (sprawdzane `git status` przed commitem). Nie uruchamiano weba ani npm.

## 8. NIE_ZMIERZONO (jawna lista)

- Wektory referencyjne z uruchomionego weba dla żadnego modułu (zakaz uruchamiania weba w tym temacie).
- Równoważność funkcji 1:1 (status PORTOWANE-1:1 = 0 wierszy). Dowody nazwowe (§3, `evidence.tsv`) potwierdzają zgodność nazwy, nie zachowania.
- LOC per funkcja po obu stronach; w §3 LOC Rust to LOC całego modułu docelowego.
- Pełne pokrycie dowodem plik:linia dla wszystkich eksportów: `evidence.tsv` obejmuje max 6 pierwszych eksportów na plik; reszta eksportów nie ma dowodu nazwowego.
- Rozbieżność liczby plików: dispatch i plan mówią ~179; pomiar `git ls-tree -r --name-only edb8fb56 gra/src/game` daje **183**; w dokumencie obowiązuje 183.

## 9. Odpowiedzi na zarzuty Evaluatora (runda 1 → runda 2)

Każdy zarzut ma werdykt: PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód). Dowody web i Rust wykonano w tej rundzie na `git archive edb8fb56` i drzewie `rust-port/engine/src` (e810d0d3).

1. **PRZYJMUJĘ.** `r-stawki-strojenie.ts` klasa DEV → SYSTEM, status CZĘŚCIOWO (tier domena): Rust ma wartości (`domain/recruitment.rs:215`, `domain/building_costs.rs:114`), nie mechanizm skalowania. Importy logiki gry potwierdzone: `production.ts:84`, `economy-upkeep.ts:59`, `difficulty-cost.ts:32`, `terrain-improvements.ts:9`, `population-growth-v85.ts:21`, `building-stock-cost.ts:1`, `main.ts:1280`.
2. **PRZYJMUJĘ.** `society-breakdown.ts` klasa UI → SYSTEM, status BRAK: `pickOsiedlePopBonus` (`society-breakdown.ts:312`) używany w `turn-economy.ts:453` (import `:170`); Rust nie ma funkcji osiedla (pola danych `data/economy_society.rs:422, 461, 654`). `REBEL_FACTION_OWNER_ID` (`society-breakdown.ts:206`) → `LEGACY_REBEL_OWNER_ID` (`domain/ids.rs:45`); użycia `human-owners.ts:18` i `post-capture-law.ts:17, 58, 170` odnotowane.
3. **PRZYJMUJĘ.** `diplomacy-layers.ts` klasa UI → SYSTEM, status BRAK: `startRelationForPair` (`diplomacy-layers.ts:42`) używany w `cluster-start.ts:230`; Rust nie ma funkcji relacji startowej (pole `economy_society_part2.rs:362` bez logiki).
4. **PRZYJMUJĘ.** `diplomacy-war-gates.ts` BRAK → CZĘŚCIOWO (tier nazwa): `isCurrencyProposalForbiddenDuringWar` (`diplomacy-war-gates.ts:46`) ↔ `is_currency_proposal_forbidden_during_war` (`domain/diplomacy.rs:2726`), wyjątek pokój/trybut zgodny; test `war_currency_gate_allows_only_peace_settlements` (`tests/diplomacy.rs:549`) dodany jako test Rust.
5. **PRZYJMUJĘ.** `cyna-access.ts` i `zelazo-access.ts` (klasa SYSTEM) → BRAK. Logika: `hasCynaAccess` (`cyna-access.ts:79`), `hasZelazoAccess` (`zelazo-access.ts:79`). Rust `data/economy_society.rs` ma tylko parametry i `parse_*`.
6. **PRZYJMUJĘ.** `ai-city-capture-executor.ts` → BRAK. Logika: `executeAiCityMove` (`ai-city-capture-executor.ts:75`). Jedyny trafień w Rust to komentarz `domain/ai_turn.rs:1193`.
7. **PRZYJMUJĘ.** `culture-religion.ts` → BRAK (Rust: pole `culture`, `domain/turn_economy.rs:32`, bez logiki). `victory.ts` → BRAK (Rust: slot `TurnPhase::Victory`, `domain/events.rs:60`, bez warunków). Zmieniono też legendę w §0: CZĘŚCIOWO wymaga funkcji logiki w Rust, pole danych nie wystarcza.
8. **PRZYJMUJĘ.** `civ-entry-epoch.ts` → BRAK. `getCivEpokaWejscia` (`civ-entry-epoch.ts:27`) i `isCivAvailableAtGameEpoch` nie mają odpowiednika w Rust; `epoka_wejscia` to tylko pole danych (`data/civilizations.rs:86`). Mapowanie na `domain/unit_epoch.rs` odrzucone.
9. **PRZYJMUJĘ CZĘŚCIOWO, ODRZUCAM CZĘŚĆ FAKTYCZNĄ.** Status zmieniono na ISTNIEJE-NIEZWERYFIKOWANE i usunięto test `alliance_uses_configured_hegemon_threshold` z kolumny testów (nie dowodzi zachowania). ODRZUCONO twierdzenie „brak słów obligation/honor w tym pliku”: `grep -ci 'obligation\|honor' gra/src/game/alliance-war-obligation.ts` = 15 (np. `shouldHonorAllianceWarObligation`, `:39`). ODRZUCONO też brak odpowiednika: w tej rundzie zweryfikowano to tylko w jedną stronę (`grep -rni obligat rust-port/engine/src` = 0), więc status to ISTNIEJE-NIEZWERYFIKOWANE, nie BRAK.
10. **PRZYJMUJĘ.** Dodano kolumny „dowód web (plik:linia)” i „dowód Rust (plik:linia)” dla wszystkich 183 wierszy (§3), generowane przez `evidence.py` i `build_gap.py`. Każdy wiersz ma lokalizator po obu stronach. Ograniczenie jawnie opisane: dowód nazwowy (trafienie tej samej nazwy w Rust) istnieje tylko dla części wierszy (liczbę podaje §1 jako tier „nazwa”); dla pozostałych kotwica modułu docelowego. Kotwica NIE jest dowodem równoważności.
11. **PRZYJMUJĘ.** Wszystkie 9 wskazanych wierszy (1–9) zreklasyfikowano (§9 pkt 1–9). Wskaźniki przeliczone skryptem po korektach i podane jako zakres: górna granica (wszystkie tiery) oraz dolna granica dowodowa (tier nazwa). Nie identyfikuję „próbki 30 wierszy” Evaluatora z numerami, więc nie mogę potwierdzić, że pozostałe pozycje tej próbki są poprawne; zakres niepewności jest podany w §1 zamiast pojedynczego procentu.
12. **PRZYJMUJĘ.** Rozmiary S/M/L/XL nie są już wpisywane ręcznie; §6b wylicza je skryptem z `web-inventory.tsv` (suma LOC niepuste plików, których punkt główny należy do tematu), progi podane w §6b. Stare wartości z tabeli rundy 1 zostały usunięte.
13. **PRZYJMUJĘ.** Kolizja `tests/**` rozwiązana regułą per temat (`tests/p6_<id>_*.rs`, §6a), co potwierdza brak `[[test]]` w `Cargo.toml`. Ścieżka krytyczna przepisana z tabeli §6b: `P6.11` i `P6.13` nie są na niej, a są gałęziami, które muszą się zakończyć przed P6.20. Kontrola kolizji allowlist jest skryptowa (§6b-i); P6-12 ‖ P6-13 ‖ P6-16 ‖ P6-17 mają rozłączne allowlisty.
14. **PRZYJMUJĘ.** `diplomacy-basket-transfer.ts`: test `basket_and_treaty_duration_read_diplomacy_table` (`tests/derived_values.rs:911`) dotyczy czasu trwania traktatu, nie transferu koszyka; kolumna testu ustawiona na `-`.
15. **PRZYJMUJĘ.** Dodano ryzyka: `idb-storage.ts` jest importowany przez `save.ts:80` (ryzyko dla P6.20); `side-panel-event-priority.ts` (`isBlockingSidePanelEvent`, `:7`) blokuje koniec tury (`main.ts:14264`), klasa zmieniona na SYSTEM, status BRAK, punkt P6.10.

Wniosek rundy 2: wszystkie 15 zarzutów rozpatrzone; jedyne częściowe odrzucenie to zarzut 9 (część faktyczna o słowach w pliku). Brak PORTOWANE-1:1. Deploy/push: NIE WYKONANO.
