# P6.0 — Analiza luk: gameplay web (`gra/src/game/**`) vs Rust (`rust-port/engine`)

Status dokumentu: **WYNIK ANALIZY (zero zmian kodu)**. Pin web: `edb8fb56`. Pin Rust: `origin/rust-port/parity-v2` (e810d0d3 w chwili pomiaru).
Generatory i surowe wyjścia: `dyspozycje/autobot/runs/R-RUSTPORT-P6-0-GAP-ANALYSIS-Q1/` (`inventory_web.py`, `inventory_rust.py`, `web-inventory.tsv`, `rust-inventory.tsv`, `build_gap.py`).

## 0. Metoda i legenda (ANTY-HALUCYNACJA)

- Inwentarz web (LOC, liczba eksportów, importy wewnętrzne) — **skryptowy** (`inventory_web.py` na `git archive edb8fb56 gra/src`).
- Inwentarz Rust (LOC, pub fn/items, testy `#[test]`) — **skryptowy** (`inventory_rust.py` na `rust-port/engine/src`).
- Mapowanie web → Rust (kolumna *rust*, *status*, *punkt P6*) — **RĘCZNE, oparte na nazwie pliku i nazwach funkcji**, zapisane w `mapping-manual.tsv`. Nie przeczytano każdej funkcji; to jest **klasyfikacja wstępna**.
- Status: `PORTOWANE-1:1` **nie został przyznany żadnemu wierszowi** — brak dowodu wektor-po-wektorze. `CZĘŚCIOWO (heur.)` = istnieje moduł Rust o zbieżnej nazwie domeny; `BRAK (heur.)` = brak odpowiednika po nazwie; `NIE-DOTYCZY` = UI/prezentacja/dev-tool/przeglądarka (wg nazwy i ścieżki); `NIE_ZMIERZONO` = nie policzono.
- Kolumna *test_rust* — nazwa testu, którego nazwa wskazuje na tę samą funkcję (lista: `rust-test-list.txt`, 373 testy). `-` = brak takiego testu. Sam wpis nie dowodzi parytetu.
- Wektory referencyjne z uruchomionego weba: **NIE_ZMIERZONO** w tym temacie (zakaz uruchamiania weba i npm w tym temacie). Istniejące wektory JSON po stronie Rust (`rt_*`, `*_parses_and_spot_checks`) są pinowane do danych, nie do zachowania silnika.

## 1. Wskaźniki pokrycia

| Wskaźnik | Wartość |
|---|---|
| Plików w `gra/src/game/**` (git ls-tree edb8fb56) | 183 |
| Wierszy w tabeli §3 | 183 (zgodność sprawdzona przez build_gap.py: brak brakujących i nadmiarowych) |
| LOC niepuste web (gra/src/game) | 64869 |
| Łączna liczba eksportów web | 2872 |
| Pliki klasy SYSTEM+DATA | 155 |
| Pliki klasy UI/DEV (NIE-DOTYCZY wg klasyfikacji) | 28 |
| PORTOWANE-1:1 (z dowodem) | 0 (NIE_ZMIERZONO — brak dowodu per funkcja) |
| Pliki CZĘŚCIOWO (heur.) | 93 |
| Pliki BRAK (heur.) | 62 |
| Pliki NIE-DOTYCZY | 28 |
| Pokrycie plikowe SYSTEM+DATA — CZĘŚCIOWO (heur.) | 93 / 155 = 60.0% |
| Pokrycie plikowe SYSTEM+DATA — BRAK (heur.) | 62 / 155 = 40.0% |
| Pokrycie eksportów SYSTEM+DATA — CZĘŚCIOWO (heur., ważone eksportami) | 1938 / 2564 = 75.6% |
| Pokrycie eksportów SYSTEM+DATA — BRAK (heur.) | 626 / 2564 = 24.4% |
| Pokrycie eksportów SYSTEM+DATA — PORTOWANE-1:1 z dowodem | 0 / 2564 = 0.0% (NIE_ZMIERZONO per funkcja) |

Uwaga o wskaźnikach: wskaźniki heurystyczne są **górną granicą** pokrycia (zbieżność nazwy ≠ równoważność zachowania). Rzeczywisty parytet wymaga testów wektorowych z weba (P6.23), których jeszcze nie ma.

### 1a. Rozkład po punktach P6 (heurystycznie)

| Punkt P6 | CZĘŚCIOWO | BRAK | NIE-DOTYCZY | razem plików |
|---|---|---|---|---|
| - | 0 | 0 | 27 | 27 |
| P6.1 | 14 | 2 | 0 | 16 |
| P6.2 | 1 | 0 | 0 | 1 |
| P6.3 | 1 | 2 | 0 | 3 |
| P6.4 | 0 | 4 | 0 | 4 |
| P6.5 | 2 | 3 | 0 | 5 |
| P6.6 | 2 | 4 | 0 | 6 |
| P6.7 | 7 | 0 | 0 | 7 |
| P6.8 | 14 | 3 | 0 | 17 |
| P6.9 | 2 | 0 | 0 | 2 |
| P6.10 | 1 | 0 | 0 | 1 |
| P6.11 | 8 | 8 | 0 | 16 |
| P6.11-P6.12 | 1 | 0 | 0 | 1 |
| P6.12 | 0 | 8 | 0 | 8 |
| P6.13 | 7 | 8 | 0 | 15 |
| P6.14 | 17 | 7 | 0 | 24 |
| P6.15 | 4 | 5 | 0 | 9 |
| P6.16 | 1 | 0 | 0 | 1 |
| P6.17 | 7 | 2 | 0 | 9 |
| P6.18 | 1 | 5 | 0 | 6 |
| P6.19 | 1 | 0 | 0 | 1 |
| P6.20 | 2 | 0 | 1 | 3 |
| P6.21 | 0 | 1 | 0 | 1 |

## 2. Graf zależności (BRAK / CZĘŚCIOWO)

Krawędzie = importy wewnętrzne z `web-inventory.tsv` (kolumna `importy_wewn`) między plikami SYSTEM/DATA ze statusem BRAK lub CZĘŚCIOWO. Tylko krawędzie, których cel ma status BRAK lub CZĘŚCIOWO (pliki „hubów” wymagane przed wejściem w ich punkt P6).

Liczba krawędzi: 291. Najczęściej importowane pliki (huby, top 15):

| Plik (cel) | status | punkt P6 | importujących (BRAK/CZĘŚC.) |
|---|---|---|---|
| `cities.ts` | CZĘŚCIOWO | P6.6 | 25 |
| `difficulty-cost.ts` | CZĘŚCIOWO | P6.11 | 12 |
| `terrain-improvements.ts` | CZĘŚCIOWO | P6.3 | 12 |
| `diplomacy.ts` | CZĘŚCIOWO | P6.14 | 11 |
| `okolica.ts` | CZĘŚCIOWO | P6.8 | 9 |
| `diplomacy-pn-engine.ts` | CZĘŚCIOWO | P6.14 | 9 |
| `building-stock-cost.ts` | CZĘŚCIOWO | P6.7 | 8 |
| `production.ts` | CZĘŚCIOWO | P6.8 | 8 |
| `diplomacy-value-catalog.ts` | CZĘŚCIOWO | P6.14 | 7 |
| `barbarians.ts` | CZĘŚCIOWO | P6.18 | 6 |
| `economy.ts` | CZĘŚCIOWO | P6.8 | 6 |
| `civ-matrix.ts` | CZĘŚCIOWO | P6.1 | 6 |
| `diplomacy-treaties.ts` | CZĘŚCIOWO | P6.14 | 6 |
| `building-resource-gate.ts` | CZĘŚCIOWO | P6.7 | 5 |
| `research.ts` | CZĘŚCIOWO | P6.17 | 5 |

Pełna lista krawędzi (źródło → cel) jest wyprowadzalna z `web-inventory.tsv` przez `build_gap.py`; nie jest powielana tutaj, aby nie rozdymać dokumentu.

## 3. Tabela luk — wiersz na każdy plik web (183 wierszy)

| # | plik web | klasa | LOC web | N eksp. | odpowiednik Rust | LOC Rust | status | punkt P6 | test Rust | uwagi |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `ai-city-capture-executor.ts` | SYSTEM | 110 | 7 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur.) | P6.11 | - | przejęcie miasta przez AI |
| 2 | `ai-cs-absorption.ts` | SYSTEM | 263 | 10 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | - | wchłanianie city-states |
| 3 | `ai-difficulty-bonus.ts` | SYSTEM | 190 | 14 | data/derived.rs | 578 | CZĘŚCIOWO (heur.) | P6.11 | - | bonusy trudności AI |
| 4 | `ai-expansion.ts` | SYSTEM | 30 | 6 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur.) | P6.11 | - | ekspansja AI |
| 5 | `ai-fog.ts` | SYSTEM | 124 | 10 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | - | mgła wojny dla AI |
| 6 | `ai-major-absorb.ts` | SYSTEM | 73 | 6 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | - | wchłanianie major przez AI |
| 7 | `ai-moc-diag.ts` | DEV | 79 | 4 | - | - | NIE-DOTYCZY | - | - | diagnostyka mocy AI |
| 8 | `ai-production-priorities.ts` | SYSTEM | 25 | 3 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur.) | P6.11 | production_matches_spec_priority_and_skips_already_built_buildings | priorytety produkcji |
| 9 | `ai-resource-needs.ts` | SYSTEM | 135 | 6 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | - | potrzeby zasobowe AI |
| 10 | `ai-threat-mode.ts` | SYSTEM | 42 | 8 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur.) | P6.11 | hex_city_score_enemy_penalty_follows_threat_range_option | tryb zagrożenia |
| 11 | `ai.ts` | SYSTEM | 5656 | 107 | domain/ai_turn.rs | 1298 | CZĘŚCIOWO (heur.) | P6.11-P6.12 | planner_returns_production_then_actions_and_always_ends_the_turn | główny planner AI (5656 LOC) |
| 12 | `alliance-war-obligation.ts` | SYSTEM | 49 | 2 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | alliance_uses_configured_hegemon_threshold | obowiązek wojny sojuszu |
| 13 | `army-concentration.ts` | SYSTEM | 303 | 15 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | - | koncentracja armii |
| 14 | `army-cycle.ts` | SYSTEM | 125 | 3 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.12 | - | cykl armii |
| 15 | `army-starvation.ts` | SYSTEM | 76 | 4 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.12 | - | głód armii |
| 16 | `armyMerge.ts` | SYSTEM | 954 | 48 | domain/recruitment.rs | 260 | BRAK (heur.) | P6.5 | - | łączenie armii |
| 17 | `auto-battle-params.ts` | DATA | 36 | 6 | data/units_combat.rs | 469 | CZĘŚCIOWO (heur.) | P6.13 | auto_battle_params_parses_and_spot_checks | parametry auto-walki |
| 18 | `auto-battle-power.ts` | SYSTEM | 216 | 11 | domain/combat.rs | 467 | CZĘŚCIOWO (heur.) | P6.13 | effective_strength_applies_counters_terrain_and_siege_structures | siła auto-walki |
| 19 | `auto-improvements.ts` | SYSTEM | 997 | 15 | domain/improvements.rs | 425 | CZĘŚCIOWO (heur.) | P6.8 | - | automatyczne ulepszenia |
| 20 | `auto-manage.ts` | SYSTEM | 406 | 8 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.12 | - | auto-zarządzanie |
| 21 | `barbarians.ts` | SYSTEM | 2489 | 52 | domain/barbarians.rs | 925 | CZĘŚCIOWO (heur.) | P6.18 | camp_spawning_is_deterministic_and_honours_city_and_camp_spacing | barbarzyńcy |
| 22 | `battle-loot.ts` | SYSTEM | 81 | 7 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | - | łup bitewny |
| 23 | `battle-summary.ts` | UI | 156 | 7 | - | - | NIE-DOTYCZY | - | - | podsumowanie bitwy (prezentacja) |
| 24 | `border-march-scan.ts` | SYSTEM | 52 | 4 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.14 | - | skan marszu granicą |
| 25 | `braz-access.ts` | DATA | 47 | 5 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur.) | P6.1 | - | dostęp zasobu cywilizacji |
| 26 | `building-cost-tempo.ts` | DATA | 36 | 3 | domain/building_costs.rs | 259 | CZĘŚCIOWO (heur.) | P6.7 | building_table_has_exactly_the_42_canonical_ids_once_each | tempo kosztów budynków |
| 27 | `building-resource-gate.ts` | SYSTEM | 572 | 32 | domain/building_costs.rs | 259 | CZĘŚCIOWO (heur.) | P6.7 | expenditure_requires_both_work_and_all_resources | bramka zasobowa budowy |
| 28 | `building-stock-cost.ts` | SYSTEM | 388 | 24 | domain/building_costs.rs | 259 | CZĘŚCIOWO (heur.) | P6.7 | successful_spend_deducts_effective_work_and_raw_stock_atomically | koszt magazynowy |
| 29 | `building-upgrades.ts` | SYSTEM | 224 | 19 | domain/improvements.rs | 425 | CZĘŚCIOWO (heur.) | P6.8 | - | ulepszanie budynków |
| 30 | `capital-capture.ts` | SYSTEM | 304 | 12 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | - | zdobycie stolicy |
| 31 | `cities.ts` | SYSTEM | 1293 | 80 | domain/state.rs | 172 | CZĘŚCIOWO (heur.) | P6.6 | - | model miast (1293 LOC) |
| 32 | `citizen-resource-upkeep.ts` | SYSTEM | 340 | 12 | domain/resource_production.rs | 150 | CZĘŚCIOWO (heur.) | P6.8 | parse_citizen_resource_upkeep_parses_and_spot_checks | utrzymanie obywateli |
| 33 | `city-defense.ts` | SYSTEM | 169 | 7 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | - | obrona miasta |
| 34 | `city-founding.ts` | SYSTEM | 145 | 11 | domain/state.rs | 172 | CZĘŚCIOWO (heur.) | P6.6 | settler_founds_only_on_a_qualifying_village_and_respects_city_spacing | zakładanie miasta |
| 35 | `city-hex-clear.ts` | SYSTEM | 68 | 4 | domain/terrain.rs | 115 | BRAK (heur.) | P6.6 | - | czyszczenie heksu miasta |
| 36 | `city-hex-movement.ts` | SYSTEM | 78 | 6 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.3 | - | ruch w heksie miasta |
| 37 | `city-names-pool.ts` | DATA | 269 | 23 | data/loader.rs | 217 | CZĘŚCIOWO (heur.) | P6.1 | city_names_pools_json_parses_and_spot_checks | pula nazw miast |
| 38 | `city-state-difficulty.ts` | SYSTEM | 218 | 15 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | - | trudność city-states |
| 39 | `civ-ai-allocation.ts` | SYSTEM | 101 | 10 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | - | alokacja AI cywilizacji |
| 40 | `civ-ai-data.ts` | DATA | 202 | 15 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur.) | P6.1 | civ_ai_json_parses_and_spot_checks | dane AI cywilizacji |
| 41 | `civ-bonuses.ts` | SYSTEM | 335 | 17 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur.) | P6.1 | civs_json_parses_and_spot_checks | bonusy cywilizacji |
| 42 | `civ-entry-epoch.ts` | SYSTEM | 79 | 9 | domain/unit_epoch.rs | 101 | CZĘŚCIOWO (heur.) | P6.1 | - | epoka wejścia cywilizacji |
| 43 | `civ-matrix-semantic.ts` | DATA | 594 | 25 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur.) | P6.1 | civ_matrix_json_parses_and_spot_checks | semantyka macierzy cywilizacji |
| 44 | `civ-matrix.ts` | DATA | 127 | 13 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur.) | P6.1 | civ_matrix_json_parses_and_spot_checks | macierz cywilizacji |
| 45 | `civ-names.ts` | DATA | 177 | 26 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur.) | P6.1 | civs_count_and_ids_match_web_pin | nazwy cywilizacji |
| 46 | `civ-roster.ts` | DATA | 162 | 7 | data/civilizations.rs | 1248 | CZĘŚCIOWO (heur.) | P6.1 | civs_count_and_ids_match_web_pin | lista cywilizacji |
| 47 | `civ-visual.ts` | UI | 103 | 11 | - | - | NIE-DOTYCZY | - | - | wizualizacja cywilizacji |
| 48 | `cluster-start.ts` | SYSTEM | 376 | 5 | domain/map_generator.rs | 1453 | BRAK (heur.) | P6.1 | - | start klastra (poza gra/src/game w mapie) |
| 49 | `combat.ts` | SYSTEM | 1259 | 35 | domain/combat.rs | 467 | CZĘŚCIOWO (heur.) | P6.13 | resolver_returns_deterministic_winner_and_per_unit_losses | walka (1259 LOC) |
| 50 | `conquest-stability.ts` | SYSTEM | 177 | 11 | domain/state.rs | 172 | BRAK (heur.) | P6.6 | - | stabilność podboju |
| 51 | `converters.ts` | SYSTEM | 324 | 20 | domain/types.rs | 453 | CZĘŚCIOWO (heur.) | P6.20 | - | konwertery danych |
| 52 | `culture-religion.ts` | SYSTEM | 1365 | 58 | domain/turn_economy.rs (pole culture, linia 32) | 340 | CZĘŚCIOWO (heur.) | P6.16 | - | Rust ma tylko magazyn culture (turn_economy.rs:32); brak religii i logiki kultury (web: loadCultureParams, culture-religion.ts:235) |
| 53 | `cyna-access.ts` | DATA | 81 | 6 | data/economy_society.rs | 839 | CZĘŚCIOWO (heur.) | P6.8 | - | dostęp zasobu cyna |
| 54 | `danina-nazwa.ts` | DATA | 57 | 7 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | - | nazwa daniny |
| 55 | `defenseBreakdown.ts` | UI | 300 | 12 | - | - | NIE-DOTYCZY | - | - | rozbicie obrony (prezentacja) |
| 56 | `diag-log.ts` | DEV | 150 | 11 | - | - | NIE-DOTYCZY | - | - | logi diagnostyczne |
| 57 | `difficulty-cost.ts` | SYSTEM | 126 | 9 | data/derived.rs | 578 | CZĘŚCIOWO (heur.) | P6.11 | difficulty_is_one_type_across_domain_modules | koszt trudności |
| 58 | `diplomacy-acceptance-points.ts` | SYSTEM | 675 | 16 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | diplomacy_acceptance_points_json_parses_and_spot_checks | punkty akceptacji |
| 59 | `diplomacy-ai-balance.ts` | SYSTEM | 330 | 10 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | bilans AI dyplomacji |
| 60 | `diplomacy-ai-offer-balance.ts` | SYSTEM | 642 | 23 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | bilans ofert AI |
| 61 | `diplomacy-audience-actions.ts` | SYSTEM | 121 | 8 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | akcje audiencji |
| 62 | `diplomacy-barbarian-cooperation.ts` | SYSTEM | 78 | 7 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | - | współpraca z barbarzyńcami |
| 63 | `diplomacy-basket-transfer.ts` | SYSTEM | 255 | 13 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | basket_and_treaty_duration_read_diplomacy_table | transfer koszyka |
| 64 | `diplomacy-border-march.ts` | SYSTEM | 272 | 11 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | - | marsz graniczny |
| 65 | `diplomacy-credibility.ts` | SYSTEM | 627 | 37 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | wiarygodność |
| 66 | `diplomacy-currency-trade.ts` | SYSTEM | 33 | 3 | domain/trade.rs | 1807 | CZĘŚCIOWO (heur.) | P6.15 | - | handel walutą |
| 67 | `diplomacy-deposit-trade.ts` | SYSTEM | 59 | 5 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | - | handel depozytami |
| 68 | `diplomacy-display.ts` | UI | 671 | 34 | - | - | NIE-DOTYCZY | - | - | prezentacja dyplomacji |
| 69 | `diplomacy-economy.ts` | SYSTEM | 281 | 34 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | ekonomia dyplomacji |
| 70 | `diplomacy-factors.ts` | SYSTEM | 187 | 10 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | czynniki dyplomacji |
| 71 | `diplomacy-goods.ts` | SYSTEM | 126 | 7 | domain/trade.rs | 1807 | CZĘŚCIOWO (heur.) | P6.15 | - | towary w dyplomacji |
| 72 | `diplomacy-layers.ts` | UI | 345 | 25 | - | - | NIE-DOTYCZY | - | - | warstwy UI dyplomacji |
| 73 | `diplomacy-locks.ts` | SYSTEM | 314 | 6 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | blokady dyplomacji |
| 74 | `diplomacy-pair-summary.ts` | UI | 106 | 4 | - | - | NIE-DOTYCZY | - | - | podsumowanie pary (prezentacja) |
| 75 | `diplomacy-peace-lock.ts` | SYSTEM | 52 | 4 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | blokada pokoju |
| 76 | `diplomacy-penalty-preview.ts` | UI | 152 | 7 | - | - | NIE-DOTYCZY | - | - | podgląd kar (prezentacja) |
| 77 | `diplomacy-pn-engine.ts` | SYSTEM | 431 | 30 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | silnik PN dyplomacji |
| 78 | `diplomacy-proposals.ts` | SYSTEM | 2605 | 61 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | propozycje dyplomatyczne (2605 LOC) |
| 79 | `diplomacy-rejection-cooldown.ts` | SYSTEM | 75 | 7 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | - | cooldown odrzuceń |
| 80 | `diplomacy-resource-trade-pick.ts` | SYSTEM | 218 | 10 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | - | wybór handlu zasobami |
| 81 | `diplomacy-tech-trade.ts` | SYSTEM | 225 | 8 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | - | handel technologią |
| 82 | `diplomacy-trade-validation.ts` | SYSTEM | 33 | 3 | domain/trade.rs | 1807 | CZĘŚCIOWO (heur.) | P6.15 | - | walidacja handlu |
| 83 | `diplomacy-treaties.ts` | SYSTEM | 406 | 33 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | traktaty |
| 84 | `diplomacy-unit-transfer.ts` | SYSTEM | 65 | 4 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | - | transfer jednostek |
| 85 | `diplomacy-value-catalog.ts` | DATA | 661 | 40 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | canonical_value_catalog_prices_non_quantity_basket_items | katalog wartości |
| 86 | `diplomacy-war-gates.ts` | SYSTEM | 46 | 6 | domain/diplomacy.rs | 3849 | BRAK (heur.) | P6.14 | - | bramki wojenne |
| 87 | `diplomacy.ts` | SYSTEM | 1617 | 45 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | diplomacy_state_serializes_non_empty_pair_map | dyplomacja (1617 LOC) |
| 88 | `display-names.ts` | UI | 288 | 19 | - | - | NIE-DOTYCZY | - | - | nazwy wyświetlane |
| 89 | `economy-upkeep.ts` | SYSTEM | 1083 | 67 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur.) | P6.8 | - | utrzymanie ekonomii |
| 90 | `economy.ts` | SYSTEM | 1243 | 41 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur.) | P6.8 | - | ekonomia (1243 LOC) |
| 91 | `effective-difficulty-for-owner.ts` | SYSTEM | 13 | 1 | data/derived.rs | 578 | CZĘŚCIOWO (heur.) | P6.11 | difficulty_is_one_type_across_domain_modules | trudność właściciela |
| 92 | `embarkation.ts` | SYSTEM | 124 | 10 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.4 | - | wsiadanie na statek |
| 93 | `empire-city-defaults.ts` | SYSTEM | 525 | 24 | domain/state.rs | 172 | BRAK (heur.) | P6.6 | - | domyślne miasta imperium |
| 94 | `empire-diplo-resource-flow.ts` | SYSTEM | 34 | 2 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | - | przepływ zasobów dyplomacji |
| 95 | `empire-food.ts` | SYSTEM | 990 | 42 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur.) | P6.7 | positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once | żywność imperium |
| 96 | `empire-handel-split.ts` | SYSTEM | 79 | 4 | domain/trade.rs | 1807 | BRAK (heur.) | P6.15 | - | podział handlu |
| 97 | `empire-hud-totals.ts` | UI | 93 | 5 | - | - | NIE-DOTYCZY | - | - | sumy HUD |
| 98 | `eot-event-defer.ts` | SYSTEM | 249 | 6 | domain/events.rs | 499 | CZĘŚCIOWO (heur.) | P6.10 | - | odroczenie zdarzeń końca tury |
| 99 | `era-change-notify.ts` | UI | 41 | 8 | - | - | NIE-DOTYCZY | - | - | powiadomienie o epoce |
| 100 | `era-gate-ui.ts` | UI | 133 | 7 | - | - | NIE-DOTYCZY | - | - | bramka epoki w UI |
| 101 | `first-player-city.ts` | SYSTEM | 44 | 5 | domain/playable.rs | 649 | CZĘŚCIOWO (heur.) | P6.1 | - | pierwsze miasto gracza |
| 102 | `forced-war-bronze.ts` | SYSTEM | 258 | 17 | - | - | BRAK (heur.) | P6.12 | - | NOWY SYSTEM: wymuszone wojny (brąz) |
| 103 | `forced-war-common.ts` | SYSTEM | 389 | 17 | - | - | BRAK (heur.) | P6.12 | - | NOWY SYSTEM: wspólne mechanizmy wymuszonych wojen |
| 104 | `forced-war-iron.ts` | SYSTEM | 271 | 17 | - | - | BRAK (heur.) | P6.12 | - | NOWY SYSTEM: wymuszone wojny (żelazo) |
| 105 | `forced-war-stone.ts` | SYSTEM | 151 | 17 | - | - | BRAK (heur.) | P6.12 | - | NOWY SYSTEM: wymuszone wojny (kamień) |
| 106 | `forced-war-waves.ts` | SYSTEM | 275 | 12 | - | - | BRAK (heur.) | P6.12 | - | NOWY SYSTEM: fale wymuszonych wojen |
| 107 | `fort-territory.ts` | SYSTEM | 205 | 9 | domain/terrain.rs | 115 | BRAK (heur.) | P6.3 | - | terytorium fortów |
| 108 | `fsa-autosave.ts` | DEV | 488 | 24 | domain/save_load.rs | 187 | NIE-DOTYCZY | P6.20 | - | autozapis przeglądarkowy (File System Access) |
| 109 | `gold-deficit.ts` | SYSTEM | 216 | 17 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur.) | P6.8 | - | deficyt złota |
| 110 | `growth-happiness.ts` | SYSTEM | 30 | 1 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur.) | P6.7 | hunger_penalty_is_separate_and_never_drops_below_one | wzrost a szczęście |
| 111 | `human-owners.ts` | SYSTEM | 63 | 7 | domain/playable.rs | 649 | CZĘŚCIOWO (heur.) | P6.1 | - | właściciele ludzcy (hot-seat) |
| 112 | `idb-storage.ts` | DEV | 197 | 5 | - | - | NIE-DOTYCZY | - | - | magazyn IndexedDB (przeglądarka) |
| 113 | `improvement-tech.ts` | SYSTEM | 160 | 14 | domain/improvements.rs | 425 | CZĘŚCIOWO (heur.) | P6.17 | improvement_and_wonder_tables_cover_every_entry_once | ulepszenia a technologie |
| 114 | `inca-llama-seed.ts` | SYSTEM | 63 | 3 | domain/map_generator.rs | 1453 | BRAK (heur.) | P6.1 | - | ziarno lam Inków |
| 115 | `livestock-unlock.ts` | SYSTEM | 158 | 13 | domain/improvements.rs | 425 | BRAK (heur.) | P6.17 | - | odblokowanie hodowli |
| 116 | `load-map-source.ts` | SYSTEM | 55 | 2 | domain/save_load.rs | 187 | BRAK (heur.) | P6.21 | - | źródło mapy przy wczytaniu |
| 117 | `manpower.ts` | SYSTEM | 798 | 52 | domain/recruitment.rs | 260 | CZĘŚCIOWO (heur.) | P6.5 | domain_recruitment_reads_the_unit_table_values_without_recomputing_them | manpower (798 LOC) |
| 118 | `map-rebels.ts` | SYSTEM | 78 | 5 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | - | buntownicy na mapie |
| 119 | `mapSiegeDetect.ts` | SYSTEM | 84 | 8 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | - | detekcja oblężenia |
| 120 | `mennica-zloto-grace.ts` | SYSTEM | 98 | 10 | domain/turn_economy.rs | 340 | BRAK (heur.) | P6.8 | - | łaska mennicy |
| 121 | `okolica.ts` | SYSTEM | 760 | 31 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur.) | P6.8 | - | okolica miasta (worked tiles, 760 LOC) |
| 122 | `order.ts` | SYSTEM | 528 | 19 | domain/types.rs | 453 | CZĘŚCIOWO (heur.) | P6.2 | command_wire_shape_is_stable_for_engine_integration | komendy/rozkazy |
| 123 | `owner-epoch.ts` | SYSTEM | 120 | 6 | domain/unit_epoch.rs | 101 | CZĘŚCIOWO (heur.) | P6.1 | - | epoka właściciela |
| 124 | `owner-utils.ts` | SYSTEM | 16 | 1 | domain/player.rs | 23 | CZĘŚCIOWO (heur.) | P6.1 | - | narzędzia właściciela |
| 125 | `pending-improvements.ts` | SYSTEM | 61 | 4 | domain/improvements.rs | 425 | BRAK (heur.) | P6.8 | - | oczekujące ulepszenia |
| 126 | `planned-march.ts` | SYSTEM | 432 | 18 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.4 | - | planowany marsz |
| 127 | `playerState.ts` | SYSTEM | 617 | 27 | domain/playable.rs | 649 | CZĘŚCIOWO (heur.) | P6.1 | - | stan gracza (617 LOC) |
| 128 | `playtestMapaSwiata.ts` | DEV | 232 | 7 | - | - | NIE-DOTYCZY | - | - | playtest (dev-tool) |
| 129 | `playtestMiastoEkonomia.ts` | DEV | 165 | 5 | - | - | NIE-DOTYCZY | - | - | playtest (dev-tool) |
| 130 | `playtestOdskok3v3.ts` | DEV | 272 | 8 | - | - | NIE-DOTYCZY | - | - | playtest (dev-tool) |
| 131 | `playtestWalkaMapy.ts` | DEV | 433 | 17 | - | - | NIE-DOTYCZY | - | - | playtest (dev-tool) |
| 132 | `population-growth-tempo.ts` | DATA | 38 | 3 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur.) | P6.7 | a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn | tempo wzrostu |
| 133 | `population-growth-v85.ts` | SYSTEM | 535 | 35 | domain/city_growth.rs | 479 | CZĘŚCIOWO (heur.) | P6.7 | fractional_growth_accumulates_and_freezes_at_the_population_cap | wzrost populacji v85 |
| 134 | `post-battle-map.ts` | SYSTEM | 507 | 14 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | - | mapa po bitwie |
| 135 | `post-capture-law.ts` | SYSTEM | 154 | 15 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | - | prawo po zdobyciu |
| 136 | `power-objective.ts` | SYSTEM | 259 | 12 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | - | cel mocy AI |
| 137 | `power-options.ts` | DATA | 59 | 4 | data/derived.rs | 578 | CZĘŚCIOWO (heur.) | P6.11 | power_params_parses_and_spot_checks | opcje mocy |
| 138 | `power-ranking.ts` | SYSTEM | 66 | 4 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | - | ranking mocy |
| 139 | `power.ts` | SYSTEM | 101 | 4 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.11 | - | moc (ranking/AI) |
| 140 | `production.ts` | SYSTEM | 2233 | 83 | domain/resource_production.rs | 150 | CZĘŚCIOWO (heur.) | P6.8 | production_matches_spec_priority_and_skips_already_built_buildings | produkcja (2233 LOC) |
| 141 | `r-stawki-strojenie.ts` | DEV | 55 | 9 | - | - | NIE-DOTYCZY | - | - | strojenie stawek (dev-tool) |
| 142 | `rally-point.ts` | SYSTEM | 77 | 7 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.4 | rally_moves_multiple_units_toward_their_shared_camp | punkt zbiórki |
| 143 | `relief-preserving-improvements.ts` | SYSTEM | 40 | 2 | domain/improvements.rs | 425 | BRAK (heur.) | P6.8 | - | ulepszenia zachowujące ulgę |
| 144 | `research.ts` | SYSTEM | 574 | 30 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur.) | P6.17 | research_costs_cover_each_tech_tempo_and_axis_once | badania |
| 145 | `resource-access.ts` | SYSTEM | 322 | 10 | domain/resource_production.rs | 150 | CZĘŚCIOWO (heur.) | P6.8 | - | dostęp do zasobów |
| 146 | `resource-usage-breakdown.ts` | UI | 131 | 5 | - | - | NIE-DOTYCZY | - | - | rozbicie zużycia (prezentacja) |
| 147 | `ruch-swiata-tempo.ts` | DATA | 40 | 3 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur.) | P6.9 | - | tempo ruchu świata |
| 148 | `save-label.ts` | UI | 58 | 4 | - | - | NIE-DOTYCZY | - | - | etykieta zapisu |
| 149 | `save.ts` | SYSTEM | 1040 | 29 | domain/save_load.rs | 187 | CZĘŚCIOWO (heur.) | P6.20 | state_round_trip_preserves_camp_identity_and_visit_memory | zapis (1040 LOC) |
| 150 | `scout-auto-explore.ts` | SYSTEM | 244 | 7 | domain/pathfinding.rs | 498 | BRAK (heur.) | P6.4 | - | auto-eksploracja zwiadowcy |
| 151 | `side-panel-event-link.ts` | UI | 107 | 5 | - | - | NIE-DOTYCZY | - | - | link zdarzenia (prezentacja) |
| 152 | `side-panel-event-priority.ts` | UI | 8 | 1 | - | - | NIE-DOTYCZY | - | - | priorytet zdarzeń (prezentacja) |
| 153 | `siege.ts` | SYSTEM | 774 | 32 | domain/combat.rs | 467 | CZĘŚCIOWO (heur.) | P6.13 | - | oblężenie (774 LOC) |
| 154 | `siegeAi.ts` | SYSTEM | 259 | 18 | domain/ai_turn.rs | 1298 | BRAK (heur.) | P6.13 | - | AI oblężenia |
| 155 | `siegeDefenders.ts` | SYSTEM | 145 | 13 | domain/combat.rs | 467 | BRAK (heur.) | P6.13 | - | obrońcy oblężenia |
| 156 | `siegeMachines.ts` | SYSTEM | 73 | 10 | data/units_combat.rs | 469 | CZĘŚCIOWO (heur.) | P6.13 | city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus | maszyny oblężnicze |
| 157 | `society-breakdown.ts` | UI | 1058 | 53 | - | - | NIE-DOTYCZY | - | - | rozbicie społeczeństwa (prezentacja, 1058 LOC) |
| 158 | `society-inputs.ts` | SYSTEM | 114 | 8 | data/economy_society.rs | 839 | CZĘŚCIOWO (heur.) | P6.8 | parse_society_params_parses_and_spot_checks | wejścia społeczeństwa |
| 159 | `spich-auto-ration-notify.ts` | UI | 28 | 3 | - | - | NIE-DOTYCZY | - | - | powiadomienie o racjonowaniu |
| 160 | `start-preview.ts` | UI | 119 | 4 | - | - | NIE-DOTYCZY | - | - | podgląd startu |
| 161 | `tech-tempo.ts` | DATA | 37 | 3 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur.) | P6.17 | research_costs_cover_each_tech_tempo_and_axis_once | tempo technologii |
| 162 | `tech-tree.ts` | SYSTEM | 142 | 8 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur.) | P6.17 | tech_json_parses | drzewko technologii |
| 163 | `terrain-improvements.ts` | SYSTEM | 437 | 35 | domain/improvements.rs | 425 | CZĘŚCIOWO (heur.) | P6.3 | terrain_improvements_parses_strict_with_farma_and_posterunek | ulepszenia terenu |
| 164 | `trade-routes.ts` | SYSTEM | 1945 | 49 | domain/trade.rs | 1807 | CZĘŚCIOWO (heur.) | P6.15 | - | szlaki handlowe (1945 LOC) |
| 165 | `triumph-city-state.ts` | SYSTEM | 70 | 5 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | - | triumf państwa-miasta |
| 166 | `turn-economy.ts` | SYSTEM | 2782 | 47 | domain/turn_economy.rs | 340 | CZĘŚCIOWO (heur.) | P6.9 | - | ekonomia tury (2782 LOC) |
| 167 | `unit-building-bonuses.ts` | SYSTEM | 488 | 33 | domain/combat.rs | 467 | BRAK (heur.) | P6.5 | - | bonusy budynków jednostek |
| 168 | `unit-card-stats.ts` | UI | 116 | 4 | - | - | NIE-DOTYCZY | - | - | statystyki karty jednostki |
| 169 | `unit-cost-tempo.ts` | DATA | 36 | 3 | domain/recruitment.rs | 260 | CZĘŚCIOWO (heur.) | P6.5 | unit_table_has_one_row_per_units_json_record_and_no_extra_rows | tempo kosztu jednostek |
| 170 | `unit-power.ts` | SYSTEM | 191 | 11 | domain/combat.rs | 467 | CZĘŚCIOWO (heur.) | P6.13 | counters_parses_and_spot_checks | moc jednostki |
| 171 | `unit-replace-context.ts` | SYSTEM | 60 | 2 | domain/recruitment.rs | 260 | BRAK (heur.) | P6.5 | - | kontekst zastąpienia jednostki |
| 172 | `veteran.ts` | SYSTEM | 387 | 32 | domain/combat.rs | 467 | CZĘŚCIOWO (heur.) | P6.13 | veteran_levels_are_complete_and_non_decreasing | weterani |
| 173 | `victory.ts` | SYSTEM | 210 | 19 | domain/events.rs (TurnPhase::Victory, linia 60) | 499 | CZĘŚCIOWO (heur.) | P6.19 | - | Rust ma tylko slot fazy Victory (events.rs:60); brak logiki warunków zwycięstwa (web: checkVictory, victory.ts:204) |
| 174 | `villageRewards.ts` | SYSTEM | 189 | 19 | domain/barbarians.rs | 925 | BRAK (heur.) | P6.18 | - | nagrody wiosek |
| 175 | `visibility.ts` | SYSTEM | 294 | 19 | domain/state.rs | 172 | BRAK (heur.) | P6.6 | - | widoczność |
| 176 | `wealth.ts` | SYSTEM | 228 | 15 | data/economy_society.rs | 839 | CZĘŚCIOWO (heur.) | P6.8 | - | bogactwo |
| 177 | `wiarygodnosc-types.ts` | DATA | 52 | 7 | domain/diplomacy.rs | 3849 | CZĘŚCIOWO (heur.) | P6.14 | - | typy wiarygodności |
| 178 | `wonder-availability.ts` | SYSTEM | 105 | 6 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur.) | P6.17 | wonders_json_parses | dostępność cudów |
| 179 | `wonder-civ-tech.ts` | SYSTEM | 100 | 7 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur.) | P6.17 | wonders_state_keys_match_web_pin | cuda a cywilizacja |
| 180 | `wonder-map-build.ts` | SYSTEM | 62 | 4 | domain/improvements.rs | 425 | BRAK (heur.) | P6.17 | - | budowa cudów na mapie |
| 181 | `wonders-data.ts` | DATA | 279 | 27 | data/buildings_tech.rs | 375 | CZĘŚCIOWO (heur.) | P6.17 | wonders_json_parses | dane cudów |
| 182 | `zelazo-access.ts` | DATA | 79 | 8 | data/economy_society.rs | 839 | CZĘŚCIOWO (heur.) | P6.8 | - | dostęp zasobu żelazo |
| 183 | `zloto-access.ts` | DATA | 129 | 14 | data/economy_society.rs | 839 | CZĘŚCIOWO (heur.) | P6.8 | - | dostęp zasobu złoto |


## 4. Walidacja pomiaru po stronie Rust (pin e810d0d3)

Uruchomione w worktree, `CARGO_INCREMENTAL=0`, osobny `CARGO_TARGET_DIR` (usunięty po zakończeniu). Surowe wyjścia w katalogu runu:

| Bramka | Komenda | Wynik | Plik surowego wyjścia |
|---|---|---|---|
| fmt | `cargo fmt -- --check` (w `rust-port/engine`) | EXIT=0 | `rust-fmt-check.log` |
| clippy | `cargo clippy --all-targets -- -D warnings` | EXIT=0 | `rust-clippy.log` |
| test | `cargo test` | EXIT=0; wszystkie `test result: ok` (łącznie 373 testów wg listy) | `rust-test.log` |
| lista testów | `cargo test -- --list` | 373 testów | `rust-test-list.txt` |

Stan Rust: 28 plików `domain/**`, 9 plików `data/**` (w tym `mod.rs`), `bridge.rs`, `steam_adapter.rs`, `lib.rs`, `logging.rs`, `version.rs`; razem 22 509 linii (łącznie z pustymi/komentarzami; `rust-inventory.tsv` podaje LOC niepuste per plik).

## 5. Lista nowych, nieportowanych systemów oraz rzeczy, których web nie ma a Rust ma

### 5a. Nowe / nieportowane systemy (web ma, Rust nie ma lub ma tylko slot)

| System | Pliki web (LOC niepuste) | Dowód braku w Rust | Uwagi |
|---|---|---|---|
| Wymuszone wojny i fale (forced-war-*) | `forced-war-common.ts` 389, `forced-war-bronze.ts` 258, `forced-war-iron.ts` 271, `forced-war-stone.ts` 151, `forced-war-waves.ts` 275 — razem **1344** | `grep -rli forced rust-port/engine/src` — brak trafień | Plan wskazuje jako nowy, nieportowany system (P6.12). Przed implementacją wymaga decyzji o źródle prawdy (web) i wektorów z weba (NIE_ZMIERZONO). |
| Religia i kultura (culture-religion) | `culture-religion.ts` 1365 | Rust ma jedynie pole `culture` w `domain/turn_economy.rs:32` oraz parametry zaufania zależne od religii w dyplomacji (`domain/diplomacy.rs:247-248, 551`, `wspolna_religia`); brak modułu religii i logiki kultury | P6.16. Rozmiar L. |
| Warunki zwycięstwa | `victory.ts` 210 (`checkVictory`, `victory.ts:204`) | Rust ma jedynie slot `TurnPhase::Victory` (`domain/events.rs:60`) bez logiki | P6.19. Rozmiar S–M. Najmniejszy zysk przy największym ryzyku semantycznym (tryby zwycięstwa). |
| Absorpcja city-states i wsp. | `ai-cs-absorption.ts` 263, `ai-major-absorb.ts` 73 | brak trafień po nazwie w `domain/barbarians.rs` ani `domain/ai_turn.rs` (heur.) | P6.18 / P6.11 |

### 5b. Rzeczy, których web (w `gra/src/game/**`) nie ma, a Rust ma

| Element Rust | Dowód | Komentarz |
|---|---|---|
| `domain/replay.rs` (456 LOC, 47 pub fn) | `grep -rli replay gra/src/game` — brak; trafienia tylko w `map/`, `battle/`, `main.ts` (UI/mapa) | Reprodukowalny replay to wymóg P6.22 — po stronie web brak odpowiednika w `game/`, więc parytet 1:1 nie jest możliwy; wymaga decyzji o specyfikacji (ZAŁOŻENIE do dokumentu: replay jest nową funkcją Rust, testowaną wewnętrznie). |
| `domain/ids.rs` (typowane identyfikatory) | web używa `number` (id) | Konstrukt techniczny Rust, NIE-DOTYCZY parytetu funkcjonalnego. |
| `domain/rng.rs` (generator RNG) | web: mulberry32 w `gra/src/map/gen-helpers.ts` i `map/generator.ts` (nie w `game/`) | Rust ma własny RNG w domenie; parytet sekwencji RNG wymaga wektorów (NIE_ZMIERZONO). |
| `steam_adapter.rs`, `version.rs`, `logging.rs` | brak odpowiednika w `game/` | Platforma/adapter — NIE-DOTYCZY dla gameplay parity. |
| `bridge.rs` | adapter Tauri (`bridge.rs:*`) | NIE-DOTYCZY; wchodzi w P7. |

## 6. Propozycja backlogu P6 (wersja robocza do zatwierdzenia przez orkiestratora)

ZAŁOŻENIA (rozstrzygnięcia luk, zapisane zgodnie z dispatchem): (1) gameplay wzorcem jest web pin `edb8fb56`; (2) forced-war i religia są portowane (nie pomijane); (3) replay (Rust-only) zostaje, ale jego parytet nie jest wymagany; (4) każdy temat implementacyjny ma wektory z weba zebrane w osobnym temacie P6.0-V (NIE_ZMIERZONO do czasu tego tematu).

Rozmiary: S < 300 LOC web, M 300–1000, L 1000–2000, XL > 2000 (wg sumy LOC niepuste z `web-inventory.tsv`). Allowlisty są **propozycją** (ścieżki Rust); każdy temat dostaje własną allowlistę w dispatchu.

| ID tematu | Zakres (punkt P6) | Allowlista Rust (propozycja) | Zależności | Rozmiar | Równoległość |
|---|---|---|---|---|---|
| R-RUSTPORT-P6-1-STAN-STARTOWY | P6.1 seed, hot-seat, właściciele, pierwsze miasto | `domain/playable.rs`, `domain/player.rs`, `domain/unit_epoch.rs`, `domain/state.rs`, `tests/` | P5 zamknięte | M | start |
| R-RUSTPORT-P6-2-KOMENDY | P6.2 walidacja komend (`order.ts`), transakcyjność | `domain/types.rs`, `domain/session.rs`, `tests/` | P6.1 | S | po P6.1 (wspólny `types.rs`) |
| R-RUSTPORT-P6-3-TEREN | P6.3 przechodniość, koszty ruchu, ulepszenia terenu | `domain/terrain.rs`, `domain/improvements.rs`, `domain/pathfinding.rs` | P6.1 | M | po P6.2 |
| R-RUSTPORT-P6-4-JEDNOSTKI-RUCH | P6.4 ruch, zbiórka, zwiad, wsiadanie (`pathfinding.rs`) | `domain/pathfinding.rs`, `domain/recruitment.rs`, `tests/` | P6.3 | L | sekwencyjnie z P6.3 (`pathfinding.rs`) |
| R-RUSTPORT-P6-5-JEDNOSTKI-ZYCIE | P6.5 manpower, HP, upgrade, łączenie armii | `domain/recruitment.rs`, `domain/combat.rs` (tylko bonusy budynków) | P6.4 | M | sekwencyjnie z P6.4 (`recruitment.rs`) |
| R-RUSTPORT-P6-6-MIASTA-ZAKLADANIE | P6.6 zakładanie, granice, domyślne miasta, widoczność | `domain/state.rs`, `domain/terrain.rs` | P6.5 | M | po P6.5 |
| R-RUSTPORT-P6-7-MIASTA-WZROST | P6.7 wzrost populacji, jedzenie, bramki budowy | `domain/city_growth.rs`, `domain/building_costs.rs` | P6.6 | L | sekwencyjnie z P6.6 (`state.rs`) |
| R-RUSTPORT-P6-8-MIASTA-EKONOMIA | P6.8 produkcja, zasoby, utrzymanie, okolica, budynki | `domain/resource_production.rs`, `domain/turn_economy.rs`, `domain/improvements.rs` | P6.7 | XL (wieloetapowy: 8a produkcja, 8b utrzymanie, 8c okolica) | sekwencyjnie z P6.7 |
| R-RUSTPORT-P6-9-TURA | P6.9–P6.10 początek/koniec tury, `eot-event-defer`, tempo | `domain/turn_economy.rs`, `domain/events.rs` | P6.8 | M | po P6.8 (wspólny `turn_economy.rs`) |
| R-RUSTPORT-P6-11-AI | P6.11 priorytety, ekspansja, moc, ranking (`domain/ai_turn.rs` 1298 LOC niepuste; web `ai.ts` 5656 LOC) | `domain/ai_turn.rs`, `domain/power*` (nowy), `data/derived.rs` | P6.9 | XL (11a priorytety, 11b moc/ranking, 11c mgła) | 11a–11c sekwencyjnie (`ai_turn.rs`) |
| R-RUSTPORT-P6-12-AI-WOJNY (NOWY SYSTEM) | P6.12 forced-war (5 plików, 1344 LOC web), cykl armii, głód | `domain/forced_war.rs` (nowy), `domain/ai_turn.rs` (tylko wywołanie) | P6.11 | L | równolegle z P6.13 po P6.11 (różne pliki), sekwencyjnie względem 11 |
| R-RUSTPORT-P6-13-WALKA | P6.13 walka, auto-walka, oblężenie, straty, łup | `domain/combat.rs`, `data/units_combat.rs` | P6.4, P6.9 | L | równolegle z P6.12 |
| R-RUSTPORT-P6-14-DYPLOMACJA | P6.14 relacje, traktaty, audiencje, aneksja, PN | `domain/diplomacy.rs` (3849 LOC Rust — rozbić na 14a propozycje/traktaty, 14b bilans AI, 14c katalog wartości) | P6.9 | XL | 14a–14c sekwencyjnie (`diplomacy.rs`) |
| R-RUSTPORT-P6-15-HANDEL | P6.15 szlaki, handel zasobami/technologią/walutą | `domain/trade.rs` | P6.14 (wspólne typy dyplomacji) | L | po P6.14 (dotyka zachowań dyplomacji) |
| R-RUSTPORT-P6-16-KULTURA-RELIGIA (NOWY ZAKRES) | P6.16 kultura, religia (`culture-religion.ts` 1365) | `domain/culture.rs` (nowy), `domain/turn_economy.rs` (pole culture) | P6.9 | L | równolegle z P6.13/P6.14 (nowy plik) |
| R-RUSTPORT-P6-17-TECHNOLOGIE-CUDA | P6.17 drzewko technologii, cuda (`wonders-data.ts` 279, `tech-tree.ts` 142) | `data/buildings_tech.rs`, `domain/improvements.rs` | P6.8 | M | równolegle z P6.13 (różne pliki) |
| R-RUSTPORT-P6-18-BARBARZYNCY-PANSTWA | P6.18 barbarzyńcy, city-states, nagrody wiosek | `domain/barbarians.rs` | P6.13 (wspólne wywołania walki) | M | po P6.13 |
| R-RUSTPORT-P6-19-ZWYCIESTWO | P6.19 warunki zwycięstwa/porażki (`victory.ts`, slot `events.rs:60`) | `domain/events.rs`, `domain/victory.rs` (nowy) | P6.9, P6.14, P6.17 | S–M | po P6.17 |
| R-RUSTPORT-P6-20-SAVE | P6.20 zapis | `domain/save_load.rs` | P6.1–P6.19 (stan kompletny) | M | po domknięciu stanu |
| R-RUSTPORT-P6-21-LOAD | P6.21 wczytanie, wersjonowanie, błędne pliki | `domain/save_load.rs` | P6.20 | M | sekwencyjnie z P6.20 |
| R-RUSTPORT-P6-22-REPLAY | P6.22 replay (Rust-only, `domain/replay.rs`) | `domain/replay.rs` | P6.20 | M | po P6.20 |
| R-RUSTPORT-P6-23-TESTY | P6.23 testy funkcjonalne i regresyjne per moduł | `rust-port/engine/tests/**` | każdy moduł | L | ciągły, wewnątrz każdego tematu |
| R-RUSTPORT-P6-24-EVALUATOR | P6.24 niezależny Evaluator całości gameplay | brak zmian kodu | P6.1–P6.23 | M | na końcu |

### 6a. Kolejność i krytyczna ścieżka

Krytyczna ścieżka (sekwencyjna): **P6.1 → P6.2 → P6.3 → P6.4 → P6.5 → P6.6 → P6.7 → P6.8 → P6.9 → P6.11 → P6.13 → P6.14 → P6.15 → P6.20 → P6.21 → P6.24**.

Równoległe gałęzie poza ścieżką krytyczną (po zakończeniu P6.9 lub P6.11): P6.12 (forced-war) ‖ P6.13 (walka) ‖ P6.16 (kultura/religia) ‖ P6.17 (technologie/cuda); P6.18 po P6.13; P6.19 po P6.17; P6.22 po P6.20. Tematy dotykające tych samych plików muszą być sekwencyjne: `pathfinding.rs` (P6.4 z P6.3), `recruitment.rs` (P6.5 z P6.4), `state.rs` (P6.6 z P6.5), `turn_economy.rs` (P6.9 z P6.8 i P6.16), `ai_turn.rs` (P6.11 i P6.12 w części wywołań), `diplomacy.rs` (P6.14, 14a–c), `trade.rs` (P6.15, w tym mapowanie `diplomacy-*-trade`).

Równoległość w praktyce: maksymalnie 3–4 tematy jednocześnie w fazach P6.12/P6.13/P6.16/P6.17 (pliki rozłączne); w reszcie sekwencyjnie.

## 7. Zero zmian poza allowlistą — samokontrola

Zmienione/dodane w tym temacie: wyłącznie `dyspozycje/rust-port/p6/P6-0-GAP-ANALYSIS.md` (nowy) oraz `dyspozycje/autobot/runs/R-RUSTPORT-P6-0-GAP-ANALYSIS-Q1/**`. Brak zmian w `gra/**`, `rust-port/**`, `src-tauri/**`. Build Rust był wyłącznie odczytowy (`fmt --check`, `clippy`, `test`, `test --list`) i nie zmienia plików w repo (Cargo.lock nie jest śledzony i nie został dodany do commita).

## 8. NIE_ZMIERZONO (jawna lista)

- Wektory referencyjne z uruchomionego weba dla żadnego modułu (zakaz uruchamiania weba w tym temacie).
- Równoważność funkcji 1:1 (status PORTOWANE-1:1 = 0 wierszy).
- LOC per funkcja po stronie Rust oraz per eksport web → Rust (w tabeli §3 LOC Rust to LOC całego modułu docelowego, nie funkcji).
- Pełna lista krawędzi grafu zależności (wyprowadzalna z `web-inventory.tsv`, nie policzona ręcznie w dokumencie).
- Rozbieżność liczby plików: dispatch i plan mówią ~179, pomiar `git ls-tree -r --name-only edb8fb56 gra/src/game` daje **183**; w dokumencie obowiązuje 183.
