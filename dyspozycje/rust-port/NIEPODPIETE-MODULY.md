# NIEPODPIETE-MODULY — moduły domain i funkcje `pub fn` bez produkcyjnego wołającego

Temat: `R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1` (runda 1/5, Operator HAIKU, dokumentacyjny, bez `cargo`).
Baza: `1027c2aa1` (= `origin/rust-port/parity-v2` po AUDYT-PARYTETU). Zakres: `rust-port/engine/src/domain/**`.

## 0. Metoda i ograniczenia

- Skrypt: `dyspozycje/autobot/runs/R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1/dowody/skrypt-niepodpiete.py`; surowy wynik: `dowody/niepodpiete-surowe.tsv`.
- Korpus wołań: wszystkie `*.rs` pod `rust-port/` z pominięciem katalogów `tests/`, `benches/`, `target/`; z korpusu usunięte komentarze i bloki `#[cfg(test)]`; linie `use`/`pub use` i linie definicji `fn` nie liczą się jako wołanie.
- Funkcja bez wołającego: identyfikator nazwy nie występuje w żadnej innej linii korpusu (także w swoim pliku). Liczenie po nazwie (bez typu): nazwa wspólna dla kilku typów (np. `from_tiles`) może zawyżać liczbę wołań, czyli zaniżać listę — to kierunek bezpieczny. Wołania przez makra i ścieżki ze stringów: NIE_ZMIERZONO.
- Moduł bez wołającego: stem pliku nie występuje jako token w żadnym innym pliku korpusu (linie `mod stem` pominięte; komentarze usunięte). Wariant poprzedni (`dowody/02-moduly-domain-wolajacy.tsv` z AUDYT-PARYTETU) liczył komentarze i obcinał po `#[cfg(test)]`, więc jego lista 34 nie jest porównywalna wprost.
- Tylko `pub fn` (nie `pub(crate) fn`). Pomiar nie sprawdza, czy zero-wołający kod jest celowo zostawiony (np. API biblioteki).
- Przypisanie tematów (kolumna TEMAT) to **heurystyka po nazwie modułu**, nie wiązanie potwierdzone przez dispatch. Reguły są w `gen-raport.py` (`TOPIC_RULES`, `STATIC_TOPIC`); powód dopasowania każdej pozycji jest w kolumnie UZASADNIENIE (§2 dla modułów, §3 dla funkcji).
- Druga, niezależna metoda (git grep, bez pythona): `dowody/verify-git-grep.sh` + `dowody/verify-classify.py`, wyniki w §8.

## 1. Liczby i komendy (kontrola zgodności)

| Miara | Wartość | Komenda / źródło |
|---|---|---|
| Pliki `domain/**/*.rs` | 243 | `python3 -I dowody/skrypt-niepodpiete.py . dowody/niepodpiete-surowe.tsv` (wiersz `pliki domain`) |
| Definicje `pub fn` w domain (bez `#[cfg(test)]`) | 3255 | j.w., wiersz `definicje pub fn` |
| **Funkcje `pub fn` bez wołającego produkcyjnego** | **886** | `awk -F'\t' '$1=="FN"' dowody/niepodpiete-surowe.tsv \| wc -l` |
| **Moduły domain bez wołającego produkcyjnego** | **46** | `awk -F'\t' '$1=="MOD"' dowody/niepodpiete-surowe.tsv \| wc -l` |

Liczbę z tabeli §3 sprawdza się tą samą komendą `awk` (liczba wierszy `FN` = liczba wierszy tabeli §3).

## 2. Moduły domain bez wołającego produkcyjnego (46)

| # | Plik (`ścieżka:linia` = 1) | Moduł | TEMAT (propozycja) | UZASADNIENIE |
|---|---|---|---|---|
| 1 | `rust-port/engine/src/domain/ai_era_unit_promotion.rs:1` | `ai_era_unit_promotion` | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 2 | `rust-port/engine/src/domain/ai_move_range.rs:1` | `ai_move_range` | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 3 | `rust-port/engine/src/domain/ai_peace_city_offer.rs:1` | `ai_peace_city_offer` | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 4 | `rust-port/engine/src/domain/ai_war_march_plan.rs:1` | `ai_war_march_plan` | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 5 | `rust-port/engine/src/domain/army_consolidation.rs:1` | `army_consolidation` | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 6 | `rust-port/engine/src/domain/army_follow_auto_merge.rs:1` | `army_follow_auto_merge` | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 7 | `rust-port/engine/src/domain/auto_improvements/relief_preserving.rs:1` | `relief_preserving` | brak tematu: RELIEF-WIRING | nazwa modulu (heurystyka) |
| 8 | `rust-port/engine/src/domain/battle_mode.rs:1` | `battle_mode` | brak tematu: TRYB-BITWY-WIRING | nazwa modulu (heurystyka) |
| 9 | `rust-port/engine/src/domain/diplomacy_locks.rs:1` | `diplomacy_locks` | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 10 | `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs:1` | `diplomacy_rejection_cooldown` | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 11 | `rust-port/engine/src/domain/diplomacy_war_gates.rs:1` | `diplomacy_war_gates` | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 12 | `rust-port/engine/src/domain/economy_city_terrain.rs:1` | `economy_city_terrain` | brak tematu: EKONOMIA-TEREN-WIRING | nazwa modulu (heurystyka) |
| 13 | `rust-port/engine/src/domain/formation_rules.rs:1` | `formation_rules` | brak tematu: FORMACJE-WIRING | nazwa modulu (heurystyka) |
| 14 | `rust-port/engine/src/domain/general_quick_follow.rs:1` | `general_quick_follow` | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 15 | `rust-port/engine/src/domain/map_snapshot.rs:1` | `map_snapshot` | brak tematu: SNAPSHOT-MAPY-WIRING (lub #119 indeks) | nazwa modulu (heurystyka) |
| 16 | `rust-port/engine/src/domain/mapgen/cluster_compute.rs:1` | `cluster_compute` | brak tematu: MAPGEN-KLASTRY-WIRING | klastry mapgen |
| 17 | `rust-port/engine/src/domain/mapgen/deposits.rs:1` | `deposits` | #104 ZLOZA-WIRING | zloza (deactivate_zloze_grants) |
| 18 | `rust-port/engine/src/domain/mapgen/rivers_b/quotas.rs:1` | `quotas` | brak tematu: MAPGEN-KWOTY-WIRING | nazwa modulu (heurystyka) |
| 19 | `rust-port/engine/src/domain/mapgen/rivers_c.rs:1` | `rivers_c` | brak tematu: RZEKI-MAPGEN-WIRING | generator rzek |
| 20 | `rust-port/engine/src/domain/mapgen/rivers_d.rs:1` | `rivers_d` | brak tematu: RZEKI-MAPGEN-WIRING | generator rzek |
| 21 | `rust-port/engine/src/domain/mapgen/rivers_e1.rs:1` | `rivers_e1` | brak tematu: RZEKI-MAPGEN-WIRING | generator rzek |
| 22 | `rust-port/engine/src/domain/mapgen/rivers_e2.rs:1` | `rivers_e2` | brak tematu: RZEKI-MAPGEN-WIRING | generator rzek |
| 23 | `rust-port/engine/src/domain/mapgen/villages.rs:1` | `villages` | brak tematu: WIOSKI-WIRING | nazwa modulu (heurystyka) |
| 24 | `rust-port/engine/src/domain/replay.rs:1` | `replay` | brak tematu: REPLAY-WIRING | replay |
| 25 | `rust-port/engine/src/domain/roads.rs:1` | `roads` | brak tematu: DROGI-WIRING | nazwa modulu (heurystyka) |
| 26 | `rust-port/engine/src/domain/siege_city_fortification.rs:1` | `siege_city_fortification` | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 27 | `rust-port/engine/src/domain/siege_engine_build.rs:1` | `siege_engine_build` | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 28 | `rust-port/engine/src/domain/siege_nearby_lock.rs:1` | `siege_nearby_lock` | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 29 | `rust-port/engine/src/domain/siege_sortie.rs:1` | `siege_sortie` | #115 ZDOBYCIE-MIASTA-WIRING | wyjazd z miasta oblezonego |
| 30 | `rust-port/engine/src/domain/siege_tactics_autobatch.rs:1` | `siege_tactics_autobatch` | #97 K5-LOOP-AUTO | tryb AUTO bez oblezenia (nazwa modulu) |
| 31 | `rust-port/engine/src/domain/siege_tactics_blow_env.rs:1` | `siege_tactics_blow_env` | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 32 | `rust-port/engine/src/domain/siege_tactics_breach.rs:1` | `siege_tactics_breach` | #98 K5-LOOP-WYLOM | wylom w pętli (nazwa modulu) |
| 33 | `rust-port/engine/src/domain/siege_tactics_class_adapters.rs:1` | `siege_tactics_class_adapters` | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 34 | `rust-port/engine/src/domain/siege_tactics_loop.rs:1` | `siege_tactics_loop` | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 35 | `rust-port/engine/src/domain/siege_transfer.rs:1` | `siege_transfer` | #115 ZDOBYCIE-MIASTA-WIRING | skutki przejecia miasta |
| 36 | `rust-port/engine/src/domain/trade_flow_apply.rs:1` | `trade_flow_apply` | brak tematu: HANDEL-PRZEPLYW-WIRING | stosowanie przeplywu handlu |
| 37 | `rust-port/engine/src/domain/turn_economy_inputs_civ.rs:1` | `turn_economy_inputs_civ` | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 38 | `rust-port/engine/src/domain/turn_economy_inputs_native.rs:1` | `turn_economy_inputs_native` | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 39 | `rust-port/engine/src/domain/turn_economy_post.rs:1` | `turn_economy_post` | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 40 | `rust-port/engine/src/domain/turn_economy_preview.rs:1` | `turn_economy_preview` | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 41 | `rust-port/engine/src/domain/turn_economy_wire.rs:1` | `turn_economy_wire` | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 42 | `rust-port/engine/src/domain/war_turn_ai_ai.rs:1` | `war_turn_ai_ai` | brak tematu: NIEPODPIETE-WAR_TURN_AI_AI-WIRING | brak dopasowania |
| 43 | `rust-port/engine/src/domain/war_turn_forced.rs:1` | `war_turn_forced` | #120 CRED-HAK-WYPOWIEDZENIE | wymuszone wojny (declare_forced_wars) |
| 44 | `rust-port/engine/src/domain/wonder_placement.rs:1` | `wonder_placement` | brak tematu: CUDA-PLACEMENT-WIRING | nazwa modulu (heurystyka) |
| 45 | `rust-port/engine/src/domain/work_tax.rs:1` | `work_tax` | brak tematu: PODATEK-PRACY-WIRING | nazwa modulu (heurystyka) |
| 46 | `rust-port/engine/src/domain/zapis_loader.rs:1` | `zapis_loader` | brak tematu: ZAPIS-LOADER-WIRING | loader zapisu |

## 3. Funkcje `pub fn` bez wołającego produkcyjnego (886)

Format: `plik:linia` definicji | moduł | funkcja | wołania produkcyjne = 0 | TEMAT (propozycja) | UZASADNIENIE (reguła dopasowania modułu).

| # | Definicja (plik:linia) | Moduł | Funkcja | Wołania | TEMAT (propozycja) | UZASADNIENIE |
|---|---|---|---|---|---|---|
| 1 | `rust-port/engine/src/domain/ai_era_unit_promotion.rs:62` | `ai_era_unit_promotion` | `promote_ai_unit_for_era` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 2 | `rust-port/engine/src/domain/ai_general_war_campaign.rs:92` | `ai_general_war_campaign` | `find_ai_war_land_reachability` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 3 | `rust-port/engine/src/domain/ai_general_war_campaign.rs:131` | `ai_general_war_campaign` | `ai_war_target_has_reachable_land_neighbor` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 4 | `rust-port/engine/src/domain/ai_general_war_campaign.rs:190` | `ai_general_war_campaign` | `reconcile_ai_general_war_campaign` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 5 | `rust-port/engine/src/domain/ai_general_war_campaign.rs:253` | `ai_general_war_campaign` | `record_ai_general_gather_turn` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 6 | `rust-port/engine/src/domain/ai_general_war_campaign.rs:277` | `ai_general_war_campaign` | `ai_general_campaign_to_save` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 7 | `rust-port/engine/src/domain/ai_general_war_campaign.rs:344` | `ai_general_war_campaign` | `restore_ai_general_campaigns` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 8 | `rust-port/engine/src/domain/ai_move_range.rs:65` | `ai_move_range` | `farthest_step_within_budget` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 9 | `rust-port/engine/src/domain/ai_move_range.rs:91` | `ai_move_range` | `build_hex_occupancy` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 10 | `rust-port/engine/src/domain/ai_move_range.rs:105` | `ai_move_range` | `claim_hex_for_move` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 11 | `rust-port/engine/src/domain/ai_peace_city_offer.rs:217` | `ai_peace_city_offer` | `decide_city_offer` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 12 | `rust-port/engine/src/domain/ai_turn.rs:201` | `ai_turn` | `with_resource` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 13 | `rust-port/engine/src/domain/ai_turn.rs:282` | `ai_turn` | `from_tiles` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 14 | `rust-port/engine/src/domain/ai_turn.rs:299` | `ai_turn` | `tile_mut` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 15 | `rust-port/engine/src/domain/ai_turn.rs:468` | `ai_turn` | `with_built_buildings` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 16 | `rust-port/engine/src/domain/ai_turn.rs:477` | `ai_turn` | `with_production` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 17 | `rust-port/engine/src/domain/ai_turn.rs:637` | `ai_turn` | `without_production` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 18 | `rust-port/engine/src/domain/ai_turn.rs:672` | `ai_turn` | `with_options` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 19 | `rust-port/engine/src/domain/ai_turn.rs:761` | `ai_turn` | `read_archetype_mods` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 20 | `rust-port/engine/src/domain/ai_turn.rs:798` | `ai_turn` | `score_city_site` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 21 | `rust-port/engine/src/domain/ai_turn.rs:870` | `ai_turn` | `choose_production` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 22 | `rust-port/engine/src/domain/ai_turn.rs:1092` | `ai_turn` | `plan_turn` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 23 | `rust-port/engine/src/domain/ai_turn.rs:1096` | `ai_turn` | `decide_turn` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 24 | `rust-port/engine/src/domain/ai_war_march_plan.rs:259` | `ai_war_march_plan` | `plan_war_march` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 25 | `rust-port/engine/src/domain/ai_zakup_jednostki.rs:64` | `ai_zakup_jednostki` | `load_ai_purchase_reserve_params` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 26 | `rust-port/engine/src/domain/ai_zakup_jednostki.rs:209` | `ai_zakup_jednostki` | `ai_purchase_resource_needs` | 0 | brak tematu: AI-WIRING-PRZEGLAD | AI bez wolajacego |
| 27 | `rust-port/engine/src/domain/alliance_war_obligation.rs:59` | `alliance_war_obligation` | `should_honor_alliance_war_obligation` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | obowiazek wojny sojuszu |
| 28 | `rust-port/engine/src/domain/alliance_war_obligation.rs:177` | `alliance_war_obligation` | `alliance_obligations_for_war_declaration` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | obowiazek wojny sojuszu |
| 29 | `rust-port/engine/src/domain/alliance_war_obligation.rs:200` | `alliance_war_obligation` | `is_defensive_alliance_war_obligation` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | obowiazek wojny sojuszu |
| 30 | `rust-port/engine/src/domain/alliance_war_obligation.rs:208` | `alliance_war_obligation` | `treaties_broken_by_refusal` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | obowiazek wojny sojuszu |
| 31 | `rust-port/engine/src/domain/alliance_war_obligation.rs:251` | `alliance_war_obligation` | `treaties_broken_by_war` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | obowiazek wojny sojuszu |
| 32 | `rust-port/engine/src/domain/army_consolidation.rs:53` | `army_consolidation` | `army_consolidation_max_per_hex` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 33 | `rust-port/engine/src/domain/army_consolidation.rs:58` | `army_consolidation` | `army_consolidation_home_group_size` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 34 | `rust-port/engine/src/domain/army_consolidation.rs:63` | `army_consolidation` | `army_consolidation_rally_search_hex` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 35 | `rust-port/engine/src/domain/army_consolidation.rs:68` | `army_consolidation` | `is_army_consolidation_enabled` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 36 | `rust-port/engine/src/domain/army_consolidation.rs:122` | `army_consolidation` | `pick_rally_city` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 37 | `rust-port/engine/src/domain/army_consolidation.rs:136` | `army_consolidation` | `build_rally_candidates` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 38 | `rust-port/engine/src/domain/army_consolidation.rs:165` | `army_consolidation` | `assign_rally_targets` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 39 | `rust-port/engine/src/domain/army_consolidation.rs:203` | `army_consolidation` | `war_army_count` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 40 | `rust-port/engine/src/domain/army_consolidation.rs:213` | `army_consolidation` | `split_into_war_armies` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 41 | `rust-port/engine/src/domain/army_follow_auto_merge.rs:82` | `army_follow_auto_merge` | `follow_leader_auto_merge_decision` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 42 | `rust-port/engine/src/domain/army_leadership.rs:69` | `army_leadership` | `army_leader_title_text` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 43 | `rust-port/engine/src/domain/army_leadership.rs:84` | `army_leadership` | `army_leader_title` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 44 | `rust-port/engine/src/domain/army_leadership.rs:95` | `army_leadership` | `army_leader_morale_bonus_frac` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 45 | `rust-port/engine/src/domain/army_leadership.rs:110` | `army_leadership` | `morale_with_army_leader_bonus` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 46 | `rust-port/engine/src/domain/army_leadership.rs:146` | `army_leadership` | `commanders_to_withdraw_after_army_break` | 0 | brak tematu: ARMIA-WIRING | armia (konsolidacja, auto-merge) |
| 47 | `rust-port/engine/src/domain/auto_improvements.rs:264` | `auto_improvements` | `fresh_surplus_report` | 0 | brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-WIRING | brak dopasowania |
| 48 | `rust-port/engine/src/domain/auto_improvements.rs:314` | `auto_improvements` | `is_city_limit_exhausted` | 0 | brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-WIRING | brak dopasowania |
| 49 | `rust-port/engine/src/domain/auto_improvements/auto_build_gate.rs:47` | `auto_improvements/auto_build_gate` | `auto_build_from_new_game_param` | 0 | brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-AUTO_BUILD_GATE-WIRING | brak dopasowania |
| 50 | `rust-port/engine/src/domain/auto_improvements/pick.rs:123` | `auto_improvements/pick` | `pick_auto_improvements` | 0 | brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-PICK-WIRING | brak dopasowania |
| 51 | `rust-port/engine/src/domain/auto_improvements/relief_preserving.rs:32` | `auto_improvements/relief_preserving` | `preserves_hill_relief` | 0 | brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-RELIEF_PRESERVING-WIRING | brak dopasowania |
| 52 | `rust-port/engine/src/domain/barbarians.rs:112` | `barbarians` | `from_tiles` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 53 | `rust-port/engine/src/domain/barbarians.rs:224` | `barbarians` | `with_camp` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 54 | `rust-port/engine/src/domain/barbarians.rs:229` | `barbarians` | `with_health` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 55 | `rust-port/engine/src/domain/barbarians.rs:317` | `barbarians` | `barbarians_enabled` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 56 | `rust-port/engine/src/domain/barbarians.rs:321` | `barbarians` | `barbarian_units_per_camp_for_difficulty` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 57 | `rust-port/engine/src/domain/barbarians.rs:330` | `barbarians` | `migrate_barbarians_level` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 58 | `rust-port/engine/src/domain/barbarians.rs:520` | `barbarians` | `destroy_camp_at` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 59 | `rust-port/engine/src/domain/barbarians.rs:551` | `barbarians` | `can_capture_empty_city` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 60 | `rust-port/engine/src/domain/barbarians.rs:903` | `barbarians` | `decide_moves` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 61 | `rust-port/engine/src/domain/barbarians.rs:938` | `barbarians` | `tick_barbarian_city_garrisons` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 62 | `rust-port/engine/src/domain/barbarians.rs:986` | `barbarians` | `spawn_barbarian_camps` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 63 | `rust-port/engine/src/domain/barbarians.rs:996` | `barbarians` | `tick_barbarian_camps` | 0 | brak tematu: NIEPODPIETE-BARBARIANS-WIRING | brak dopasowania |
| 64 | `rust-port/engine/src/domain/battle_mode.rs:46` | `battle_mode` | `player_battle_automatic_only_from_save` | 0 | brak tematu: TRYB-BITWY-WIRING | nazwa modulu (heurystyka) |
| 65 | `rust-port/engine/src/domain/brake_inputs.rs:110` | `brake_inputs` | `gate_facts_for` | 0 | brak tematu: NIEPODPIETE-BRAKE_INPUTS-WIRING | brak dopasowania |
| 66 | `rust-port/engine/src/domain/brake_inputs.rs:174` | `brake_inputs` | `contacts_for` | 0 | brak tematu: NIEPODPIETE-BRAKE_INPUTS-WIRING | brak dopasowania |
| 67 | `rust-port/engine/src/domain/brake_power_improvements.rs:34` | `brake_power_improvements` | `improvement_count_for_build_hex` | 0 | brak tematu: NIEPODPIETE-BRAKE_POWER_IMPROVEMENTS-WIRING | brak dopasowania |
| 68 | `rust-port/engine/src/domain/brake_power_producers.rs:77` | `brake_power_producers` | `no_producer_keys` | 0 | brak tematu: NIEPODPIETE-BRAKE_POWER_PRODUCERS-WIRING | brak dopasowania |
| 69 | `rust-port/engine/src/domain/brake_power_rest.rs:60` | `brake_power_rest` | `rest_no_producer_keys` | 0 | brak tematu: NIEPODPIETE-BRAKE_POWER_REST-WIRING | brak dopasowania |
| 70 | `rust-port/engine/src/domain/brake_power_rest.rs:140` | `brake_power_rest` | `set_size` | 0 | brak tematu: NIEPODPIETE-BRAKE_POWER_REST-WIRING | brak dopasowania |
| 71 | `rust-port/engine/src/domain/brake_power_rest.rs:166` | `brake_power_rest` | `dominant_status_web` | 0 | brak tematu: NIEPODPIETE-BRAKE_POWER_REST-WIRING | brak dopasowania |
| 72 | `rust-port/engine/src/domain/brake_power_rest.rs:175` | `brake_power_rest` | `has_pin_file_line_ref` | 0 | brak tematu: NIEPODPIETE-BRAKE_POWER_REST-WIRING | brak dopasowania |
| 73 | `rust-port/engine/src/domain/building_costs.rs:72` | `building_costs` | `resource_costs` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 74 | `rust-port/engine/src/domain/building_costs.rs:76` | `building_costs` | `validate_expenditure` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 75 | `rust-port/engine/src/domain/building_costs.rs:217` | `building_costs` | `work_cost_for_level` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 76 | `rust-port/engine/src/domain/building_costs.rs:599` | `building_costs` | `deduct_building_stock_cost` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 77 | `rust-port/engine/src/domain/building_costs.rs:616` | `building_costs` | `stock_resource_labels` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 78 | `rust-port/engine/src/domain/building_costs.rs:626` | `building_costs` | `empire_stock_resource_keys` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 79 | `rust-port/engine/src/domain/building_costs.rs:631` | `building_costs` | `stock_resource_label` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 80 | `rust-port/engine/src/domain/building_costs.rs:733` | `building_costs` | `refund_building_stock_cost_across_cities` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 81 | `rust-port/engine/src/domain/building_costs.rs:851` | `building_costs` | `mount_unit_horse_stock_key` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 82 | `rust-port/engine/src/domain/building_costs.rs:856` | `building_costs` | `mount_horse_exempt_unit` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 83 | `rust-port/engine/src/domain/building_costs.rs:937` | `building_costs` | `mennica_zloto_drain_per_turn` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 84 | `rust-port/engine/src/domain/building_costs.rs:1023` | `building_costs` | `access_only_resource_labels` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 85 | `rust-port/engine/src/domain/building_costs.rs:1028` | `building_costs` | `is_access_only_resource_label` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 86 | `rust-port/engine/src/domain/building_costs.rs:1057` | `building_costs` | `empire_resource_label_satisfied` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 87 | `rust-port/engine/src/domain/building_costs.rs:1105` | `building_costs` | `deposit_runtime_gated_building_ids` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 88 | `rust-port/engine/src/domain/building_costs.rs:1328` | `building_costs` | `spichlerz_empire_cap_i` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 89 | `rust-port/engine/src/domain/building_costs.rs:1333` | `building_costs` | `spichlerz_empire_cap_ii_full` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 90 | `rust-port/engine/src/domain/building_costs.rs:1483` | `building_costs` | `spichlerz_happiness_bonus_from_json` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 91 | `rust-port/engine/src/domain/building_costs.rs:1603` | `building_costs` | `resolve_owned_building_inactive_status` | 0 | brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | brak dopasowania |
| 92 | `rust-port/engine/src/domain/city_growth.rs:659` | `city_growth` | `apply_growth_threshold_pace` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 93 | `rust-port/engine/src/domain/city_growth.rs:770` | `city_growth` | `is_research_era_fala2_extra` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 94 | `rust-port/engine/src/domain/city_growth.rs:821` | `city_growth` | `scaled_wonder_food_cost` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 95 | `rust-port/engine/src/domain/city_growth.rs:958` | `city_growth` | `resolve_population_cap_matrix_delta` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 96 | `rust-port/engine/src/domain/city_growth.rs:1190` | `city_growth` | `format_wyzwienie_label` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 97 | `rust-port/engine/src/domain/city_growth.rs:1781` | `city_growth` | `apply_central_food_population_growth` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 98 | `rust-port/engine/src/domain/city_growth.rs:2094` | `city_growth` | `get_empire_food_reserve` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 99 | `rust-port/engine/src/domain/city_growth.rs:2099` | `city_growth` | `get_empire_food_max_cap` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 100 | `rust-port/engine/src/domain/city_growth.rs:2104` | `city_growth` | `is_army_hungry` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 101 | `rust-port/engine/src/domain/city_growth.rs:2114` | `city_growth` | `is_army_starving` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 102 | `rust-port/engine/src/domain/city_growth.rs:2124` | `city_growth` | `get_army_starvation_countdown` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 103 | `rust-port/engine/src/domain/city_growth.rs:2137` | `city_growth` | `get_last_empire_food_tick` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 104 | `rust-port/engine/src/domain/city_growth.rs:2147` | `city_growth` | `clear_last_empire_food_ticks` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 105 | `rust-port/engine/src/domain/city_growth.rs:2154` | `city_growth` | `get_empire_food_split` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 106 | `rust-port/engine/src/domain/city_growth.rs:2159` | `city_growth` | `clamp_food_split_pct` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 107 | `rust-port/engine/src/domain/city_growth.rs:2164` | `city_growth` | `get_city_food_split` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 108 | `rust-port/engine/src/domain/city_growth.rs:2172` | `city_growth` | `compute_empire_food_net_delta` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 109 | `rust-port/engine/src/domain/city_growth.rs:2177` | `city_growth` | `compute_empire_food_net_delta_from_city_foods` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 110 | `rust-port/engine/src/domain/city_growth.rs:2189` | `city_growth` | `compute_empire_food_max_cap` | 0 | brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | brak dopasowania |
| 111 | `rust-port/engine/src/domain/city_names.rs:82` | `city_names` | `rival_pool_index` | 0 | brak tematu: NIEPODPIETE-CITY_NAMES-WIRING | brak dopasowania |
| 112 | `rust-port/engine/src/domain/city_names.rs:173` | `city_names` | `collect_used_city_names` | 0 | brak tematu: NIEPODPIETE-CITY_NAMES-WIRING | brak dopasowania |
| 113 | `rust-port/engine/src/domain/civ_bonuses.rs:359` | `civ_bonuses` | `civ_combat_stat_multipliers` | 0 | brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | brak dopasowania |
| 114 | `rust-port/engine/src/domain/civ_bonuses.rs:429` | `civ_bonuses` | `civ_matrix_bonusy_for_civ_key` | 0 | brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | brak dopasowania |
| 115 | `rust-port/engine/src/domain/civ_bonuses.rs:549` | `civ_bonuses` | `civ_embarkation_movement_multiplier` | 0 | brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | brak dopasowania |
| 116 | `rust-port/engine/src/domain/civ_bonuses.rs:572` | `civ_bonuses` | `civ_attack_range_multiplier` | 0 | brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | brak dopasowania |
| 117 | `rust-port/engine/src/domain/civ_bonuses.rs:583` | `civ_bonuses` | `civ_siege_attack_multiplier` | 0 | brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | brak dopasowania |
| 118 | `rust-port/engine/src/domain/civ_bonuses.rs:594` | `civ_bonuses` | `civ_wall_defense_multiplier` | 0 | brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | brak dopasowania |
| 119 | `rust-port/engine/src/domain/civ_bonuses.rs:629` | `civ_bonuses` | `building_cost_after_civ_discount` | 0 | brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | brak dopasowania |
| 120 | `rust-port/engine/src/domain/civ_bonuses.rs:641` | `civ_bonuses` | `is_combat_modifier_bonus` | 0 | brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | brak dopasowania |
| 121 | `rust-port/engine/src/domain/civ_matrix.rs:415` | `civ_matrix` | `civ_matrix_apply_proc` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 122 | `rust-port/engine/src/domain/civ_matrix.rs:513` | `civ_matrix` | `embedded_sources` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 123 | `rust-port/engine/src/domain/civ_matrix.rs:546` | `civ_matrix` | `civ_ai_aggression_norm` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 124 | `rust-port/engine/src/domain/civ_matrix.rs:635` | `civ_matrix` | `civ_ai_profile_for_typ` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 125 | `rust-port/engine/src/domain/civ_matrix.rs:646` | `civ_matrix` | `civ_params_for` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 126 | `rust-port/engine/src/domain/civ_matrix.rs:657` | `civ_matrix` | `is_kopia_typu_obronna` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 127 | `rust-port/engine/src/domain/civ_matrix.rs:687` | `civ_matrix` | `diplomacy_per_nacja_for_typ` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 128 | `rust-port/engine/src/domain/civ_matrix.rs:698` | `civ_matrix` | `resolve_archetype_aggression` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 129 | `rust-port/engine/src/domain/civ_matrix.rs:743` | `civ_matrix` | `resolve_archetype_trade` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 130 | `rust-port/engine/src/domain/civ_matrix.rs:769` | `civ_matrix` | `nastawienie_bazowe_zaufanie_delta` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 131 | `rust-port/engine/src/domain/civ_matrix.rs:1055` | `civ_matrix` | `civ_matrix_semantic_parameter_ids` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 132 | `rust-port/engine/src/domain/civ_matrix.rs:1060` | `civ_matrix` | `civ_matrix_semantic_civilizations` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 133 | `rust-port/engine/src/domain/civ_matrix.rs:1447` | `civ_matrix` | `civ_matrix_semantic_baseline` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 134 | `rust-port/engine/src/domain/civ_matrix.rs:1455` | `civ_matrix` | `civ_matrix_semantic_baseline_full` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 135 | `rust-port/engine/src/domain/civ_matrix.rs:1543` | `civ_matrix` | `build_civ_matrix_semantic_snapshot` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 136 | `rust-port/engine/src/domain/civ_matrix.rs:1568` | `civ_matrix` | `status_allows_default_visibility` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 137 | `rust-port/engine/src/domain/civ_matrix.rs:1573` | `civ_matrix` | `civ_matrix_parameter_label_pl` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 138 | `rust-port/engine/src/domain/civ_matrix.rs:1589` | `civ_matrix` | `civ_matrix_formatted_value` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 139 | `rust-port/engine/src/domain/civ_matrix.rs:1618` | `civ_matrix` | `civ_matrix_intensity_label` | 0 | brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | brak dopasowania |
| 140 | `rust-port/engine/src/domain/civ_names.rs:222` | `civ_names` | `state_city_name` | 0 | brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | brak dopasowania |
| 141 | `rust-port/engine/src/domain/civ_names.rs:248` | `civ_names` | `validate_nazwy_klastra` | 0 | brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | brak dopasowania |
| 142 | `rust-port/engine/src/domain/civ_names.rs:274` | `civ_names` | `get_miasta_cywilizacji` | 0 | brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | brak dopasowania |
| 143 | `rust-port/engine/src/domain/civ_names.rs:282` | `civ_names` | `get_miasta_panstwa` | 0 | brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | brak dopasowania |
| 144 | `rust-port/engine/src/domain/civ_names.rs:297` | `civ_names` | `pick_ai_founded_city_name` | 0 | brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | brak dopasowania |
| 145 | `rust-port/engine/src/domain/civ_names.rs:334` | `civ_names` | `civ_ids_from_roster` | 0 | brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | brak dopasowania |
| 146 | `rust-port/engine/src/domain/civ_names.rs:452` | `civ_names` | `rotate_preferred_for_repair_seed` | 0 | brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | brak dopasowania |
| 147 | `rust-port/engine/src/domain/civ_names.rs:467` | `civ_names` | `assign_ai_civ_types` | 0 | brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | brak dopasowania |
| 148 | `rust-port/engine/src/domain/combat.rs:70` | `combat` | `with_counter` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 149 | `rust-port/engine/src/domain/combat.rs:132` | `combat` | `with_seed` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 150 | `rust-port/engine/src/domain/combat.rs:731` | `combat` | `path_a_max_pp` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 151 | `rust-port/engine/src/domain/combat.rs:736` | `combat` | `path_b_max_pp` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 152 | `rust-port/engine/src/domain/combat.rs:822` | `combat` | `building_progress_would_change` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 153 | `rust-port/engine/src/domain/combat.rs:843` | `combat` | `apply_city_visit_bonus_gain` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 154 | `rust-port/engine/src/domain/combat.rs:896` | `combat` | `format_building_bonus_gain_hint` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 155 | `rust-port/engine/src/domain/combat.rs:935` | `combat` | `unit_building_bonus_label` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 156 | `rust-port/engine/src/domain/combat.rs:970` | `combat` | `building_combat_bonus_for_unit` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 157 | `rust-port/engine/src/domain/combat.rs:1030` | `combat` | `merge_building_bonus_into_stat_multipliers` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 158 | `rust-port/engine/src/domain/combat.rs:1146` | `combat` | `resolve_ranged_phase` | 0 | brak tematu: NIEPODPIETE-COMBAT-WIRING | brak dopasowania |
| 159 | `rust-port/engine/src/domain/credibility.rs:427` | `credibility` | `credibility_band` | 0 | brak tematu: NIEPODPIETE-CREDIBILITY-WIRING | brak dopasowania |
| 160 | `rust-port/engine/src/domain/credibility.rs:490` | `credibility` | `credibility_sum` | 0 | brak tematu: NIEPODPIETE-CREDIBILITY-WIRING | brak dopasowania |
| 161 | `rust-port/engine/src/domain/credibility.rs:747` | `credibility` | `total_of` | 0 | brak tematu: NIEPODPIETE-CREDIBILITY-WIRING | brak dopasowania |
| 162 | `rust-port/engine/src/domain/credibility.rs:854` | `credibility` | `note_war_entered` | 0 | brak tematu: NIEPODPIETE-CREDIBILITY-WIRING | brak dopasowania |
| 163 | `rust-port/engine/src/domain/credibility.rs:1085` | `credibility` | `to_meta` | 0 | brak tematu: NIEPODPIETE-CREDIBILITY-WIRING | brak dopasowania |
| 164 | `rust-port/engine/src/domain/diplomacy.rs:100` | `diplomacy` | `is_war` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 165 | `rust-port/engine/src/domain/diplomacy.rs:159` | `diplomacy` | `clamped_for_war` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 166 | `rust-port/engine/src/domain/diplomacy.rs:188` | `diplomacy` | `as_tuple` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 167 | `rust-port/engine/src/domain/diplomacy.rs:691` | `diplomacy` | `is_relation_at_war` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 168 | `rust-port/engine/src/domain/diplomacy.rs:810` | `diplomacy` | `relation_tier` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 169 | `rust-port/engine/src/domain/diplomacy.rs:901` | `diplomacy` | `initial_relation` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 170 | `rust-port/engine/src/domain/diplomacy.rs:1212` | `diplomacy` | `ai_stance` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 171 | `rust-port/engine/src/domain/diplomacy.rs:1237` | `diplomacy` | `reset_pair_meta_for_turn` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 172 | `rust-port/engine/src/domain/diplomacy.rs:1337` | `diplomacy` | `apply_pn_trust` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 173 | `rust-port/engine/src/domain/diplomacy.rs:1376` | `diplomacy` | `tick_goodwill` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 174 | `rust-port/engine/src/domain/diplomacy.rs:1673` | `diplomacy` | `ensure_relation` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 175 | `rust-port/engine/src/domain/diplomacy.rs:1714` | `diplomacy` | `add_deal` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 176 | `rust-port/engine/src/domain/diplomacy.rs:1975` | `diplomacy` | `quantity_resource_pn` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 177 | `rust-port/engine/src/domain/diplomacy.rs:2010` | `diplomacy` | `sum_basket_pn` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 178 | `rust-port/engine/src/domain/diplomacy.rs:2145` | `diplomacy` | `resolve_proposal_pn` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 179 | `rust-port/engine/src/domain/diplomacy.rs:2350` | `diplomacy` | `grant_tech_to_owner` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 180 | `rust-port/engine/src/domain/diplomacy.rs:2412` | `diplomacy` | `grant_surowiec_boolean_access` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 181 | `rust-port/engine/src/domain/diplomacy.rs:2436` | `diplomacy` | `has_surowiec_boolean_access` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 182 | `rust-port/engine/src/domain/diplomacy.rs:2463` | `diplomacy` | `with_resources` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 183 | `rust-port/engine/src/domain/diplomacy.rs:2611` | `diplomacy` | `transfer_surowiec_ilosc` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 184 | `rust-port/engine/src/domain/diplomacy.rs:2732` | `diplomacy` | `wire_name` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 185 | `rust-port/engine/src/domain/diplomacy.rs:2995` | `diplomacy` | `strip_withdrawn_resource_access_items` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 186 | `rust-port/engine/src/domain/diplomacy.rs:3035` | `diplomacy` | `sweetener_net_pn` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 187 | `rust-port/engine/src/domain/diplomacy.rs:3054` | `diplomacy` | `sweetener_ease_points` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 188 | `rust-port/engine/src/domain/diplomacy.rs:3180` | `diplomacy` | `evaluate_proposal` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 189 | `rust-port/engine/src/domain/diplomacy.rs:4087` | `diplomacy` | `spawn_transferred_unit` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 190 | `rust-port/engine/src/domain/diplomacy.rs:4190` | `diplomacy` | `deactivate_zloze_grants_for_deal` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 191 | `rust-port/engine/src/domain/diplomacy.rs:4218` | `diplomacy` | `sync_relation_status_from_deals` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 192 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:104` | `diplomacy_aggressor` | `przyczyna_wypowiedzenia` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 193 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:188` | `diplomacy_aggressor` | `mnoznik_willingness_ally` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 194 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:197` | `diplomacy_aggressor` | `delta_relacji_sojusz` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 195 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:283` | `diplomacy_aggressor` | `reset` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 196 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:294` | `diplomacy_aggressor` | `do_tury_flagi_agresora` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 197 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:304` | `diplomacy_aggressor` | `ma_casus_belli_aktywne` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 198 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:309` | `diplomacy_aggressor` | `zarejestruj_wypowiedzenie` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 199 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:320` | `diplomacy_aggressor` | `zarejestruj_casus_belli` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 200 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:331` | `diplomacy_aggressor` | `to_save_meta` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 201 | `rust-port/engine/src/domain/diplomacy_aggressor.rs:354` | `diplomacy_aggressor` | `from_save_meta` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 202 | `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs:148` | `diplomacy_ai_forced_peace` | `is_forced_peace_due_default` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 203 | `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs:165` | `diplomacy_ai_forced_peace` | `is_forced_peace_eligible_pair` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 204 | `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs:179` | `diplomacy_ai_forced_peace` | `requester_share` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 205 | `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs:189` | `diplomacy_ai_forced_peace` | `is_clearly_losing` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 206 | `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs:450` | `diplomacy_ai_forced_peace` | `ai_ai_peace_required_pn` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 207 | `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs:730` | `diplomacy_ai_forced_peace` | `run_ai_ai_peace_tick` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 208 | `rust-port/engine/src/domain/diplomacy_locks.rs:190` | `diplomacy_locks` | `resolve_diplomacy_action_lock` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 209 | `rust-port/engine/src/domain/diplomacy_multiwar.rs:95` | `diplomacy_multiwar` | `forced_era_tag_from_powod` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 210 | `rust-port/engine/src/domain/diplomacy_multiwar.rs:173` | `diplomacy_multiwar` | `evaluate_era_forced_war_gate` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 211 | `rust-port/engine/src/domain/diplomacy_multiwar.rs:284` | `diplomacy_multiwar` | `weariness_peace_price_factor` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 212 | `rust-port/engine/src/domain/diplomacy_multiwar.rs:373` | `diplomacy_multiwar` | `to_hash_map` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 213 | `rust-port/engine/src/domain/diplomacy_multiwar.rs:398` | `diplomacy_multiwar` | `record_era_forced_war_participation` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 214 | `rust-port/engine/src/domain/diplomacy_multiwar.rs:433` | `diplomacy_multiwar` | `restore_era_war_counts` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 215 | `rust-port/engine/src/domain/diplomacy_multiwar_gate.rs:43` | `diplomacy_multiwar_gate` | `as_web_str` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 216 | `rust-port/engine/src/domain/diplomacy_multiwar_gate.rs:71` | `diplomacy_multiwar_gate` | `is_war_march_open_for_pair` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 217 | `rust-port/engine/src/domain/diplomacy_multiwar_gate.rs:77` | `diplomacy_multiwar_gate` | `is_war_treaty_blocked` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 218 | `rust-port/engine/src/domain/diplomacy_multiwar_gate.rs:126` | `diplomacy_multiwar_gate` | `pick_player_reference_city` | 0 | #106 R7K7C-WIRING | dyplomacja wielowojenna (deltas dyplomacji) |
| 219 | `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs:26` | `diplomacy_rejection_cooldown` | `reject_cooldown_key_for` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 220 | `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs:65` | `diplomacy_rejection_cooldown` | `negotiation_partner_owner_id` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 221 | `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs:74` | `diplomacy_rejection_cooldown` | `is_offer_rejected_on_cooldown` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 222 | `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs:88` | `diplomacy_rejection_cooldown` | `record_rejected_offer` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 223 | `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs:111` | `diplomacy_rejection_cooldown` | `prune_expired_rejected_offers` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 224 | `rust-port/engine/src/domain/diplomacy_siege_war_gate.rs:88` | `diplomacy_siege_war_gate` | `siege_battle_side_owners` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 225 | `rust-port/engine/src/domain/diplomacy_siege_war_gate.rs:195` | `diplomacy_siege_war_gate` | `is_siege_still_valid` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 226 | `rust-port/engine/src/domain/diplomacy_siege_war_gate.rs:229` | `diplomacy_siege_war_gate` | `auto_siege_candidate_for_scan` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 227 | `rust-port/engine/src/domain/diplomacy_tick_war_brake.rs:32` | `diplomacy_tick_war_brake` | `is_diplo_tick_war_brake_enabled` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 228 | `rust-port/engine/src/domain/diplomacy_tick_war_brake.rs:106` | `diplomacy_tick_war_brake` | `crisis_pair_key` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 229 | `rust-port/engine/src/domain/diplomacy_tick_war_brake.rs:213` | `diplomacy_tick_war_brake` | `trade_trust_bonus_per_tura` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 230 | `rust-port/engine/src/domain/diplomacy_tick_war_brake.rs:238` | `diplomacy_tick_war_brake` | `parse_crisis_counters` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 231 | `rust-port/engine/src/domain/diplomacy_truce.rs:137` | `diplomacy_truce` | `filter_alliance_obligations_respecting_peace_lock` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 232 | `rust-port/engine/src/domain/diplomacy_truce.rs:207` | `diplomacy_truce` | `is_truce_breach` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 233 | `rust-port/engine/src/domain/diplomacy_truce.rs:213` | `diplomacy_truce` | `pair_meta_to_save` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 234 | `rust-port/engine/src/domain/diplomacy_truce_end.rs:45` | `diplomacy_truce_end` | `truce_end_offer_target` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 235 | `rust-port/engine/src/domain/diplomacy_truce_end.rs:63` | `diplomacy_truce_end` | `is_truce_window_breach` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 236 | `rust-port/engine/src/domain/diplomacy_truce_end.rs:104` | `diplomacy_truce_end` | `ai_truce_or_peace_mode` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 237 | `rust-port/engine/src/domain/diplomacy_truce_end.rs:132` | `diplomacy_truce_end` | `peace_finalize_gives_trust_event` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 238 | `rust-port/engine/src/domain/diplomacy_truce_flow.rs:96` | `diplomacy_truce_flow` | `set_status` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 239 | `rust-port/engine/src/domain/diplomacy_truce_flow.rs:163` | `diplomacy_truce_flow` | `propose` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 240 | `rust-port/engine/src/domain/diplomacy_truce_flow.rs:203` | `diplomacy_truce_flow` | `offers_for` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 241 | `rust-port/engine/src/domain/diplomacy_truce_flow.rs:212` | `diplomacy_truce_flow` | `respond_to_truce_end_offer` | 0 | #106 R7K7C-WIRING | rozejmy (deltas dyplomacji) |
| 242 | `rust-port/engine/src/domain/diplomacy_war_gates.rs:36` | `diplomacy_war_gates` | `is_nap_blocking_war_declaration` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 243 | `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:216` | `diplomacy_war_peace_profile` | `zdrowie_baza_z_ai_params` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 244 | `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:457` | `diplomacy_war_peace_profile` | `war_weariness_share` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 245 | `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:544` | `diplomacy_war_peace_profile` | `ai_peace_signals` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 246 | `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:631` | `diplomacy_war_peace_profile` | `evaluate_peace_ai_gate` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 247 | `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:719` | `diplomacy_war_peace_profile` | `war_state_for_pair` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 248 | `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:750` | `diplomacy_war_peace_profile` | `rel_war_fields` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 249 | `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:774` | `diplomacy_war_peace_profile` | `proposal_war_state` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 250 | `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:792` | `diplomacy_war_peace_profile` | `brake_war_params` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | dyplomacja i wojna (haki P4) |
| 251 | `rust-port/engine/src/domain/economy_city_fns.rs:99` | `economy_city_fns` | `sum_building_happiness` | 0 | brak tematu: NIEPODPIETE-ECONOMY_CITY_FNS-WIRING | brak dopasowania |
| 252 | `rust-port/engine/src/domain/economy_city_fns.rs:174` | `economy_city_fns` | `production_progress` | 0 | brak tematu: NIEPODPIETE-ECONOMY_CITY_FNS-WIRING | brak dopasowania |
| 253 | `rust-port/engine/src/domain/economy_city_fns.rs:241` | `economy_city_fns` | `building_gives_happiness` | 0 | brak tematu: NIEPODPIETE-ECONOMY_CITY_FNS-WIRING | brak dopasowania |
| 254 | `rust-port/engine/src/domain/economy_city_fns.rs:261` | `economy_city_fns` | `civ_bonusy_for_civ_key` | 0 | brak tematu: NIEPODPIETE-ECONOMY_CITY_FNS-WIRING | brak dopasowania |
| 255 | `rust-port/engine/src/domain/economy_city_terrain.rs:168` | `economy_city_terrain` | `build_terrain_yields` | 0 | brak tematu: EKONOMIA-TEREN-WIRING | nazwa modulu (heurystyka) |
| 256 | `rust-port/engine/src/domain/economy_city_terrain.rs:184` | `economy_city_terrain` | `terrain_modifier` | 0 | brak tematu: EKONOMIA-TEREN-WIRING | nazwa modulu (heurystyka) |
| 257 | `rust-port/engine/src/domain/economy_yield.rs:58` | `economy_yield` | `mnoznik_handel_pieniadz_for_civ` | 0 | brak tematu: NIEPODPIETE-ECONOMY_YIELD-WIRING | brak dopasowania |
| 258 | `rust-port/engine/src/domain/economy_yield.rs:68` | `economy_yield` | `mnoznik_handel_pieniadz_for_civ_by_difficulty` | 0 | brak tematu: NIEPODPIETE-ECONOMY_YIELD-WIRING | brak dopasowania |
| 259 | `rust-port/engine/src/domain/economy_yield.rs:89` | `economy_yield` | `civ_economy_yield_multipliers` | 0 | brak tematu: NIEPODPIETE-ECONOMY_YIELD-WIRING | brak dopasowania |
| 260 | `rust-port/engine/src/domain/economy_yield.rs:738` | `economy_yield` | `city_yield_per_turn_from_worked` | 0 | brak tematu: NIEPODPIETE-ECONOMY_YIELD-WIRING | brak dopasowania |
| 261 | `rust-port/engine/src/domain/economy_yield.rs:886` | `economy_yield` | `city_terrain_sums_imp` | 0 | brak tematu: NIEPODPIETE-ECONOMY_YIELD-WIRING | brak dopasowania |
| 262 | `rust-port/engine/src/domain/events.rs:255` | `events` | `event_mut` | 0 | brak tematu: NIEPODPIETE-EVENTS-WIRING | brak dopasowania |
| 263 | `rust-port/engine/src/domain/events.rs:259` | `events` | `into_event` | 0 | brak tematu: NIEPODPIETE-EVENTS-WIRING | brak dopasowania |
| 264 | `rust-port/engine/src/domain/events.rs:357` | `events` | `from_events` | 0 | brak tematu: NIEPODPIETE-EVENTS-WIRING | brak dopasowania |
| 265 | `rust-port/engine/src/domain/events.rs:420` | `events` | `push_entry` | 0 | brak tematu: NIEPODPIETE-EVENTS-WIRING | brak dopasowania |
| 266 | `rust-port/engine/src/domain/events.rs:455` | `events` | `drain_turn` | 0 | brak tematu: NIEPODPIETE-EVENTS-WIRING | brak dopasowania |
| 267 | `rust-port/engine/src/domain/events.rs:460` | `events` | `drain_phase` | 0 | brak tematu: NIEPODPIETE-EVENTS-WIRING | brak dopasowania |
| 268 | `rust-port/engine/src/domain/events.rs:479` | `events` | `is_ordered` | 0 | brak tematu: NIEPODPIETE-EVENTS-WIRING | brak dopasowania |
| 269 | `rust-port/engine/src/domain/formation_rules.rs:146` | `formation_rules` | `classify_initial_battle_role` | 0 | brak tematu: FORMACJE-WIRING | nazwa modulu (heurystyka) |
| 270 | `rust-port/engine/src/domain/formation_rules.rs:211` | `formation_rules` | `initial_battle_formation` | 0 | brak tematu: FORMACJE-WIRING | nazwa modulu (heurystyka) |
| 271 | `rust-port/engine/src/domain/formation_rules.rs:309` | `formation_rules` | `initial_battle_slots` | 0 | brak tematu: FORMACJE-WIRING | nazwa modulu (heurystyka) |
| 272 | `rust-port/engine/src/domain/formation_rules.rs:423` | `formation_rules` | `compact_line_allows_advance` | 0 | brak tematu: FORMACJE-WIRING | nazwa modulu (heurystyka) |
| 273 | `rust-port/engine/src/domain/fort_territory.rs:51` | `fort_territory` | `backfill_fort_order` | 0 | brak tematu: NIEPODPIETE-FORT_TERRITORY-WIRING | brak dopasowania |
| 274 | `rust-port/engine/src/domain/fort_territory.rs:70` | `fort_territory` | `fort_territory_nodes` | 0 | brak tematu: NIEPODPIETE-FORT_TERRITORY-WIRING | brak dopasowania |
| 275 | `rust-port/engine/src/domain/fort_territory.rs:91` | `fort_territory` | `is_hex_in_foreign_fort_territory` | 0 | brak tematu: NIEPODPIETE-FORT_TERRITORY-WIRING | brak dopasowania |
| 276 | `rust-port/engine/src/domain/fort_territory.rs:134` | `fort_territory` | `apply_fort_capture_by_occupation` | 0 | brak tematu: NIEPODPIETE-FORT_TERRITORY-WIRING | brak dopasowania |
| 277 | `rust-port/engine/src/domain/fort_territory.rs:197` | `fort_territory` | `fort_sight_sources` | 0 | brak tematu: NIEPODPIETE-FORT_TERRITORY-WIRING | brak dopasowania |
| 278 | `rust-port/engine/src/domain/general_quick_follow.rs:47` | `general_quick_follow` | `general_quick_follow_action_label` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 279 | `rust-port/engine/src/domain/general_quick_follow.rs:58` | `general_quick_follow` | `plan_enabled_general_follow_marches` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 280 | `rust-port/engine/src/domain/general_quick_follow.rs:122` | `general_quick_follow` | `issue_general_quick_follow` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 281 | `rust-port/engine/src/domain/general_quick_follow.rs:181` | `general_quick_follow` | `from_entries` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 282 | `rust-port/engine/src/domain/general_quick_follow.rs:190` | `general_quick_follow` | `to_save` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 283 | `rust-port/engine/src/domain/general_quick_follow.rs:196` | `general_quick_follow` | `follow_off_clears` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 284 | `rust-port/engine/src/domain/general_quick_follow.rs:202` | `general_quick_follow` | `is_general_follow` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 285 | `rust-port/engine/src/domain/general_quick_follow.rs:274` | `general_quick_follow` | `plan_tracked_general_follow_march` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 286 | `rust-port/engine/src/domain/general_quick_follow.rs:377` | `general_quick_follow` | `sync_general_march_targets` | 0 | brak tematu: GENERAL-FOLLOW-WIRING | nazwa modulu (heurystyka) |
| 287 | `rust-port/engine/src/domain/generals.rs:74` | `generals` | `stone_general_unit_id` | 0 | brak tematu: NIEPODPIETE-GENERALS-WIRING | brak dopasowania |
| 288 | `rust-port/engine/src/domain/generals.rs:97` | `generals` | `attempt_general_purchase` | 0 | brak tematu: NIEPODPIETE-GENERALS-WIRING | brak dopasowania |
| 289 | `rust-port/engine/src/domain/generals.rs:250` | `generals` | `plan_deferred_general_march_batch` | 0 | brak tematu: NIEPODPIETE-GENERALS-WIRING | brak dopasowania |
| 290 | `rust-port/engine/src/domain/improvement_build.rs:295` | `improvement_build` | `strip_improvements_when_forest_removed` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 291 | `rust-port/engine/src/domain/improvement_build.rs:407` | `improvement_build` | `remove_legacy_farms_on_forest` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 292 | `rust-port/engine/src/domain/improvement_build.rs:437` | `improvement_build` | `is_stadnina_blocked_on_forest` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 293 | `rust-port/engine/src/domain/improvement_build.rs:457` | `improvement_build` | `get_improvement_forest_block_hint` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 294 | `rust-port/engine/src/domain/improvement_build.rs:601` | `improvement_build` | `format_improvement_build_impact_list` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 295 | `rust-port/engine/src/domain/improvement_build.rs:619` | `improvement_build` | `is_mine_improvement_key` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 296 | `rust-port/engine/src/domain/improvement_build.rs:624` | `improvement_build` | `is_tarasy_civ` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 297 | `rust-port/engine/src/domain/improvement_build.rs:745` | `improvement_build` | `has_animal_deposit` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 298 | `rust-port/engine/src/domain/improvement_build.rs:808` | `improvement_build` | `is_livestock_unlocked_for_placement` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 299 | `rust-port/engine/src/domain/improvement_build.rs:857` | `improvement_build` | `is_improvement_visible_in_build_panel` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 300 | `rust-port/engine/src/domain/improvement_build.rs:1051` | `improvement_build` | `build_improvement_qualifier` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 301 | `rust-port/engine/src/domain/improvement_build.rs:1192` | `improvement_build` | `road_build_block_reason` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 302 | `rust-port/engine/src/domain/improvement_build.rs:1477` | `improvement_build` | `gallery_combo_show_model` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 303 | `rust-port/engine/src/domain/improvement_build.rs:1583` | `improvement_build` | `get_forest_build_block_reason` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 304 | `rust-port/engine/src/domain/improvement_build.rs:1654` | `improvement_build` | `create_improvement_build_api` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 305 | `rust-port/engine/src/domain/improvement_build.rs:1718` | `improvement_build` | `has_hex_click_handler` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 306 | `rust-port/engine/src/domain/improvement_build.rs:1725` | `improvement_build` | `get_work_cost` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 307 | `rust-port/engine/src/domain/improvement_build.rs:1732` | `improvement_build` | `can_build` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 308 | `rust-port/engine/src/domain/improvement_build.rs:1737` | `improvement_build` | `get_qualifying_hexes` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 309 | `rust-port/engine/src/domain/improvement_build.rs:1784` | `improvement_build` | `handle_hex_click` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | brak dopasowania |
| 310 | `rust-port/engine/src/domain/improvements.rs:747` | `improvements` | `migrate_improvement_layers` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 311 | `rust-port/engine/src/domain/improvements.rs:870` | `improvements` | `improvement_bonus_for_key` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 312 | `rust-port/engine/src/domain/improvements.rs:907` | `improvements` | `apply_improvement_bonus` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 313 | `rust-port/engine/src/domain/improvements.rs:923` | `improvements` | `apply_improvement_bonuses` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 314 | `rust-port/engine/src/domain/improvements.rs:1009` | `improvements` | `food_layer_from_animal_deposit` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 315 | `rust-port/engine/src/domain/improvements.rs:1049` | `improvements` | `hex_has_covering_terrain_improvement` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 316 | `rust-port/engine/src/domain/improvements.rs:1080` | `improvements` | `hex_suppresses_deposit_overlay` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 317 | `rust-port/engine/src/domain/improvements.rs:1119` | `improvements` | `is_livestock_improvement_key` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 318 | `rust-port/engine/src/domain/improvements.rs:1218` | `improvements` | `parse_pending_improvement_id` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 319 | `rust-port/engine/src/domain/improvements.rs:1252` | `improvements` | `undo_key_set` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 320 | `rust-port/engine/src/domain/improvements.rs:1274` | `improvements` | `commit_turn` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 321 | `rust-port/engine/src/domain/improvements.rs:1280` | `improvements` | `to_save` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 322 | `rust-port/engine/src/domain/improvements.rs:1288` | `improvements` | `from_save` | 0 | brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | brak dopasowania |
| 323 | `rust-port/engine/src/domain/map_generator.rs:166` | `map_generator` | `land_tiles` | 0 | brak tematu: NIEPODPIETE-MAP_GENERATOR-WIRING | brak dopasowania |
| 324 | `rust-port/engine/src/domain/map_generator.rs:174` | `map_generator` | `terrain_counts` | 0 | brak tematu: NIEPODPIETE-MAP_GENERATOR-WIRING | brak dopasowania |
| 325 | `rust-port/engine/src/domain/map_snapshot.rs:318` | `map_snapshot` | `serialize_map_for_save` | 0 | brak tematu: SNAPSHOT-MAPY-WIRING (lub #119 indeks) | nazwa modulu (heurystyka) |
| 326 | `rust-port/engine/src/domain/map_snapshot.rs:463` | `map_snapshot` | `build_game_map_from_snapshot` | 0 | brak tematu: SNAPSHOT-MAPY-WIRING (lub #119 indeks) | nazwa modulu (heurystyka) |
| 327 | `rust-port/engine/src/domain/map_snapshot.rs:613` | `map_snapshot` | `is_valid_map_snapshot` | 0 | brak tematu: SNAPSHOT-MAPY-WIRING (lub #119 indeks) | nazwa modulu (heurystyka) |
| 328 | `rust-port/engine/src/domain/mapgen/cluster_compute.rs:189` | `mapgen/cluster_compute` | `to_start_plan` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 329 | `rust-port/engine/src/domain/mapgen/cluster_compute.rs:1343` | `mapgen/cluster_compute` | `build_cluster_spawn_plan` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 330 | `rust-port/engine/src/domain/mapgen/cluster_layout.rs:152` | `mapgen/cluster_layout` | `cluster_city_state_radius` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 331 | `rust-port/engine/src/domain/mapgen/cluster_layout.rs:196` | `mapgen/cluster_layout` | `capital_max_sea_dist_for_map` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 332 | `rust-port/engine/src/domain/mapgen/cluster_layout.rs:204` | `mapgen/cluster_layout` | `cluster_cohesion_max_hex` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 333 | `rust-port/engine/src/domain/mapgen/cluster_layout.rs:272` | `mapgen/cluster_layout` | `capital_min_separation_for_map` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 334 | `rust-port/engine/src/domain/mapgen/cluster_layout.rs:418` | `mapgen/cluster_layout` | `cluster_center_placement_sep_for_map` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 335 | `rust-port/engine/src/domain/mapgen/cluster_layout.rs:868` | `mapgen/cluster_layout` | `poisson_pick_cities` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 336 | `rust-port/engine/src/domain/mapgen/cluster_layout.rs:970` | `mapgen/cluster_layout` | `is_far_enough` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 337 | `rust-port/engine/src/domain/mapgen/cluster_mass.rs:903` | `mapgen/cluster_mass` | `min_mass_hexes_for_spawn` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 338 | `rust-port/engine/src/domain/mapgen/cluster_mass.rs:958` | `mapgen/cluster_mass` | `region_mass_dominance_frac` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 339 | `rust-port/engine/src/domain/mapgen/cluster_mass.rs:988` | `mapgen/cluster_mass` | `qualifying_mass_threshold` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 340 | `rust-port/engine/src/domain/mapgen/cluster_mass.rs:1078` | `mapgen/cluster_mass` | `region_mass_dominance` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 341 | `rust-port/engine/src/domain/mapgen/cluster_mass.rs:1854` | `mapgen/cluster_mass` | `pick_center_in_mass` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 342 | `rust-port/engine/src/domain/mapgen/cluster_mass.rs:1891` | `mapgen/cluster_mass` | `pick_center_in_mass_with_land_gate` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 343 | `rust-port/engine/src/domain/mapgen/cluster_mass.rs:2734` | `mapgen/cluster_mass` | `start_reveal_radius_for_difficulty` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 344 | `rust-port/engine/src/domain/mapgen/cluster_mass.rs:2817` | `mapgen/cluster_mass` | `find_best_player_start_hex` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 345 | `rust-port/engine/src/domain/mapgen/cluster_rivals.rs:643` | `mapgen/cluster_rivals` | `build_same_type_rival_slots` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 346 | `rust-port/engine/src/domain/mapgen/cluster_rivals.rs:687` | `mapgen/cluster_rivals` | `build_same_type_rival_candidate_hexes` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 347 | `rust-port/engine/src/domain/mapgen/landsea.rs:64` | `mapgen/landsea` | `is_land_terrain` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 348 | `rust-port/engine/src/domain/mapgen/landsea.rs:72` | `mapgen/landsea` | `is_land_or_coast` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 349 | `rust-port/engine/src/domain/mapgen/landsea.rs:461` | `mapgen/landsea` | `remove_inland_sea_pools` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 350 | `rust-port/engine/src/domain/mapgen/landsea.rs:474` | `mapgen/landsea` | `enforce_latitudinal_ocean_buffer` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 351 | `rust-port/engine/src/domain/mapgen/landsea.rs:542` | `mapgen/landsea` | `apply_climate_bands_to_hexes` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 352 | `rust-port/engine/src/domain/mapgen/landsea.rs:577` | `mapgen/landsea` | `enforce_earth_template_on_hexes` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 353 | `rust-port/engine/src/domain/mapgen/landsea.rs:608` | `mapgen/landsea` | `purge_desert_enclave_water` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 354 | `rust-port/engine/src/domain/mapgen/landsea.rs:738` | `mapgen/landsea` | `purge_inland_water_for_multi_land_typ` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 355 | `rust-port/engine/src/domain/mapgen/landsea.rs:867` | `mapgen/landsea` | `assign_continent_indices` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 356 | `rust-port/engine/src/domain/mapgen/landsea.rs:1082` | `mapgen/landsea` | `rebalance_land_fraction_with_margins` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 357 | `rust-port/engine/src/domain/mapgen/landsea.rs:1291` | `mapgen/landsea` | `apply_land_fraction_by_continent` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 358 | `rust-port/engine/src/domain/mapgen/landsea.rs:1794` | `mapgen/landsea` | `rebalance_land_fraction_pangea` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 359 | `rust-port/engine/src/domain/mapgen/landsea.rs:2095` | `mapgen/landsea` | `top_up_pangea_land_fraction_default` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 360 | `rust-port/engine/src/domain/mapgen/landsea.rs:2115` | `mapgen/landsea` | `rebalance_land_sea_ratio` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 361 | `rust-port/engine/src/domain/mapgen/landsea.rs:2256` | `mapgen/landsea` | `max_ocean_bay_depth` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 362 | `rust-port/engine/src/domain/mapgen/landsea.rs:2271` | `mapgen/landsea` | `purge_relief_valley_water` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 363 | `rust-port/engine/src/domain/mapgen/landsea.rs:2314` | `mapgen/landsea` | `trim_deep_ocean_bays` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 364 | `rust-port/engine/src/domain/mapgen/landsea.rs:2347` | `mapgen/landsea` | `finalize_coast_and_inland_water_default` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 365 | `rust-port/engine/src/domain/mapgen/landsea.rs:2463` | `mapgen/landsea` | `thicken_coast_and_smooth_inlets_default` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 366 | `rust-port/engine/src/domain/mapgen/landsea.rs:2475` | `mapgen/landsea` | `flatten_false_coastal_river_notches` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 367 | `rust-port/engine/src/domain/mapgen/landsea.rs:2589` | `mapgen/landsea` | `enforce_target_dry_land_fraction_default` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 368 | `rust-port/engine/src/domain/mapgen/landsea.rs:2739` | `mapgen/landsea` | `finalize_land_mass_after_coast_default` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 369 | `rust-port/engine/src/domain/mapgen/masks.rs:841` | `mapgen/masks` | `default_shape_params` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 370 | `rust-port/engine/src/domain/mapgen/masks.rs:858` | `mapgen/masks` | `land_mask_at` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 371 | `rust-port/engine/src/domain/mapgen/masks.rs:891` | `mapgen/masks` | `kontynenty_zone_count` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 372 | `rust-port/engine/src/domain/mapgen/masks.rs:896` | `mapgen/masks` | `continent_center_count` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 373 | `rust-port/engine/src/domain/mapgen/masks.rs:1002` | `mapgen/masks` | `build_five_zone_continent_centers` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 374 | `rust-port/engine/src/domain/mapgen/masks.rs:1079` | `mapgen/masks` | `land_mask_kontynenty` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 375 | `rust-port/engine/src/domain/mapgen/masks.rs:1223` | `mapgen/masks` | `build_pangea_blob_centers` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 376 | `rust-port/engine/src/domain/mapgen/masks.rs:1314` | `mapgen/masks` | `land_mask_pangea` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 377 | `rust-port/engine/src/domain/mapgen/masks.rs:1376` | `mapgen/masks` | `build_sixteen_grid_island_centers` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 378 | `rust-port/engine/src/domain/mapgen/masks.rs:1431` | `mapgen/masks` | `assign_island_grid_indices` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 379 | `rust-port/engine/src/domain/mapgen/masks.rs:1443` | `mapgen/masks` | `land_mask_wyspy` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 380 | `rust-port/engine/src/domain/mapgen/masks.rs:1501` | `mapgen/masks` | `ziemia_land_centers` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 381 | `rust-port/engine/src/domain/mapgen/masks.rs:1515` | `mapgen/masks` | `land_mask_ziemia` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 382 | `rust-port/engine/src/domain/mapgen/params.rs:408` | `mapgen/params` | `default_player_civ_id` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 383 | `rust-port/engine/src/domain/mapgen/params.rs:413` | `mapgen/params` | `default_start_epoch_id` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 384 | `rust-port/engine/src/domain/mapgen/params.rs:448` | `mapgen/params` | `rywale_menu_for_map_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 385 | `rust-port/engine/src/domain/mapgen/params.rs:479` | `mapgen/params` | `typ_swiata_from_menu_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 386 | `rust-port/engine/src/domain/mapgen/params.rs:535` | `mapgen/params` | `default_render_quality` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 387 | `rust-port/engine/src/domain/mapgen/params.rs:545` | `mapgen/params` | `default_map_detail_quality` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 388 | `rust-port/engine/src/domain/mapgen/params.rs:565` | `mapgen/params` | `quality_tier_to_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 389 | `rust-port/engine/src/domain/mapgen/params.rs:590` | `mapgen/params` | `bundled_map_quality_from_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 390 | `rust-port/engine/src/domain/mapgen/params.rs:595` | `mapgen/params` | `is_large_map_menu_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 391 | `rust-port/engine/src/domain/mapgen/params.rs:620` | `mapgen/params` | `density_tier_to_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 392 | `rust-port/engine/src/domain/mapgen/params.rs:657` | `mapgen/params` | `world_generation_preset_from_labels` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 393 | `rust-port/engine/src/domain/mapgen/params.rs:722` | `mapgen/params` | `river_grid_trace_min_len` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 394 | `rust-port/engine/src/domain/mapgen/params.rs:962` | `mapgen/params` | `land_fraction_percent_opts` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 395 | `rust-port/engine/src/domain/mapgen/params.rs:979` | `mapgen/params` | `default_land_fraction_percent_for_typ` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 396 | `rust-port/engine/src/domain/mapgen/params.rs:996` | `mapgen/params` | `resolve_land_fraction` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 397 | `rust-port/engine/src/domain/mapgen/params.rs:1007` | `mapgen/params` | `scale_max_rivers_for_land` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 398 | `rust-port/engine/src/domain/mapgen/params.rs:1029` | `mapgen/params` | `resolve_world_gen_numbers` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 399 | `rust-port/engine/src/domain/mapgen/params.rs:1080` | `mapgen/params` | `max_typy_cywilizacji_menu` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 400 | `rust-port/engine/src/domain/mapgen/params.rs:1260` | `mapgen/params` | `default_miasta_panstwa_from_map_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 401 | `rust-port/engine/src/domain/mapgen/params.rs:1270` | `mapgen/params` | `miasta_panstwa_menu_for_map_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 402 | `rust-port/engine/src/domain/mapgen/params.rs:1281` | `mapgen/params` | `default_civ_types_from_map_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 403 | `rust-port/engine/src/domain/mapgen/params.rs:1297` | `mapgen/params` | `civ_types_menu_for_map_label` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 404 | `rust-port/engine/src/domain/mapgen/params.rs:1366` | `mapgen/params` | `visible_zloze` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 405 | `rust-port/engine/src/domain/mapgen/params.rs:1372` | `mapgen/params` | `ensure_deposit_era_meta` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 406 | `rust-port/engine/src/domain/mapgen/params.rs:1387` | `mapgen/params` | `count_hidden_metal_deposits` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 407 | `rust-port/engine/src/domain/mapgen/params.rs:1419` | `mapgen/params` | `river_gen_storage_key` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 408 | `rust-port/engine/src/domain/mapgen/params.rs:1424` | `mapgen/params` | `river_gen_phase_storage_key` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 409 | `rust-port/engine/src/domain/mapgen/params.rs:1429` | `mapgen/params` | `river_gen_url_param` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 410 | `rust-port/engine/src/domain/mapgen/params.rs:1434` | `mapgen/params` | `river_gen_phase_url_param` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 411 | `rust-port/engine/src/domain/mapgen/params.rs:1472` | `mapgen/params` | `set_enabled_override` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 412 | `rust-port/engine/src/domain/mapgen/params.rs:1477` | `mapgen/params` | `set_phase_override` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 413 | `rust-port/engine/src/domain/mapgen/params.rs:1483` | `mapgen/params` | `get_enabled` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 414 | `rust-port/engine/src/domain/mapgen/params.rs:1513` | `mapgen/params` | `is_main_only` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 415 | `rust-port/engine/src/domain/mapgen/params.rs:1519` | `mapgen/params` | `is_full` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 416 | `rust-port/engine/src/domain/mapgen/prims.rs:397` | `mapgen/prims` | `climate_forest_threshold` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 417 | `rust-port/engine/src/domain/mapgen/prims.rs:419` | `mapgen/prims` | `earth_polar_ocean_ref_rows` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 418 | `rust-port/engine/src/domain/mapgen/prims.rs:424` | `mapgen/prims` | `earth_polar_ocean_ref_inner_h` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 419 | `rust-port/engine/src/domain/mapgen/prims.rs:508` | `mapgen/prims` | `earth_mask_width` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 420 | `rust-port/engine/src/domain/mapgen/prims.rs:513` | `mapgen/prims` | `earth_mask_height` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 421 | `rust-port/engine/src/domain/mapgen/relief.rs:318` | `mapgen/relief` | `continent_center_square` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 422 | `rust-port/engine/src/domain/mapgen/relief.rs:718` | `mapgen/relief` | `apply_relief_by_noise_rank` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 423 | `rust-port/engine/src/domain/mapgen/relief.rs:749` | `mapgen/relief` | `min_river_sources_per_water_cell` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 424 | `rust-port/engine/src/domain/mapgen/relief.rs:767` | `mapgen/relief` | `deprecated_min_mountains_iron_cell` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 425 | `rust-port/engine/src/domain/mapgen/relief.rs:772` | `mapgen/relief` | `deprecated_min_highlands_copper_cell` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 426 | `rust-port/engine/src/domain/mapgen/relief.rs:777` | `mapgen/relief` | `water_coverage_cell_size` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 427 | `rust-port/engine/src/domain/mapgen/relief.rs:792` | `mapgen/relief` | `relief_coverage_cell_size` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 428 | `rust-port/engine/src/domain/mapgen/relief.rs:797` | `mapgen/relief` | `fair_play_resource_cell_size` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 429 | `rust-port/engine/src/domain/mapgen/relief.rs:869` | `mapgen/relief` | `cell_has_relief_package` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 430 | `rust-port/engine/src/domain/mapgen/relief.rs:887` | `mapgen/relief` | `cell_can_host_deposit_package` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 431 | `rust-port/engine/src/domain/mapgen/relief.rs:900` | `mapgen/relief` | `eligible_forest_land_count` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 432 | `rust-port/engine/src/domain/mapgen/relief.rs:986` | `mapgen/relief` | `assert_relief_grid_coverage` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 433 | `rust-port/engine/src/domain/mapgen/relief.rs:1236` | `mapgen/relief` | `force_relief_in_cell` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 434 | `rust-port/engine/src/domain/mapgen/relief.rs:1402` | `mapgen/relief` | `cap_relief_overflow_in_cell` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 435 | `rust-port/engine/src/domain/mapgen/relief.rs:1810` | `mapgen/relief` | `cap_relief_cluster_size_safety_net` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 436 | `rust-port/engine/src/domain/mapgen/relief.rs:2163` | `mapgen/relief` | `ensure_relief_grid_coverage` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 437 | `rust-port/engine/src/domain/mapgen/relief.rs:2269` | `mapgen/relief` | `grow_mountain_ranges` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 438 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:77` | `mapgen/rivers_a` | `medium_tributary_min_net_len` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 439 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:89` | `mapgen/rivers_a` | `main_river_coast_mouth_max_gap_for_dims` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 440 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:151` | `mapgen/rivers_a` | `purge_ocean_inside_earth_land_mask` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 441 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:195` | `mapgen/rivers_a` | `purge_stray_land_outside_earth_mask` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 442 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:236` | `mapgen/rivers_a` | `split_adjacent_river_chains` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 443 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:282` | `mapgen/rivers_a` | `river_path_has_revisited_hex` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 444 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:397` | `mapgen/rivers_a` | `land_river_render_path` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 445 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:425` | `mapgen/rivers_a` | `count_medium_inland_land_hexes` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 446 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:436` | `mapgen/rivers_a` | `medium_river_render_path` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 447 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:450` | `mapgen/rivers_a` | `coastal_river_render_path` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 448 | `rust-port/engine/src/domain/mapgen/rivers_a.rs:532` | `mapgen/rivers_a` | `river_hex_key` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 449 | `rust-port/engine/src/domain/mapgen/rivers_a/grow.rs:116` | `mapgen/rivers_a/grow` | `from_keys` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 450 | `rust-port/engine/src/domain/mapgen/rivers_a/grow.rs:155` | `mapgen/rivers_a/grow` | `add_path` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 451 | `rust-port/engine/src/domain/mapgen/rivers_a/profile.rs:45` | `mapgen/rivers_a/profile` | `river_profile_hook` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 452 | `rust-port/engine/src/domain/mapgen/rivers_a/profile.rs:54` | `mapgen/rivers_a/profile` | `reset_river_profile_stats` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 453 | `rust-port/engine/src/domain/mapgen/rivers_a/profile.rs:115` | `mapgen/rivers_a/profile` | `format_river_profile_report` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 454 | `rust-port/engine/src/domain/mapgen/rivers_b/edges.rs:211` | `mapgen/rivers_b/edges` | `mark_river_transit_edges_on_path` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 455 | `rust-port/engine/src/domain/mapgen/rivers_b/extend.rs:82` | `mapgen/rivers_b/extend` | `extend_river_to_minimum_length` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 456 | `rust-port/engine/src/domain/mapgen/rivers_b/quotas.rs:9` | `mapgen/rivers_b/quotas` | `cap_river_quotas` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 457 | `rust-port/engine/src/domain/mapgen/rivers_b/sources.rs:17` | `mapgen/rivers_b/sources` | `collect_foothill_river_sources` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 458 | `rust-port/engine/src/domain/mapgen/rivers_b/sources.rs:54` | `mapgen/rivers_b/sources` | `collect_plain_spring_sources` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 459 | `rust-port/engine/src/domain/mapgen/rivers_b/sources.rs:91` | `mapgen/rivers_b/sources` | `collect_river_sources` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 460 | `rust-port/engine/src/domain/mapgen/rivers_b/sources.rs:115` | `mapgen/rivers_b/sources` | `pick_spread_river_sources` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 461 | `rust-port/engine/src/domain/mapgen/rivers_b/trace.rs:206` | `mapgen/rivers_b/trace` | `trace_river_for_grid_fill` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 462 | `rust-port/engine/src/domain/mapgen/rivers_b/trace_coast.rs:30` | `mapgen/rivers_b/trace_coast` | `trace_river_from_coast` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 463 | `rust-port/engine/src/domain/mapgen/terrain_class.rs:489` | `mapgen/terrain_class` | `is_in_latitudinal_ocean_buffer` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 464 | `rust-port/engine/src/domain/mapgen/terrain_class.rs:669` | `mapgen/terrain_class` | `reapply_forest_overlay` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 465 | `rust-port/engine/src/domain/mapgen/terrain_class.rs:807` | `mapgen/terrain_class` | `reapply_land_terrain` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 466 | `rust-port/engine/src/domain/mapgen/terrain_class.rs:1110` | `mapgen/terrain_class` | `is_in_map_margin_zone` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 467 | `rust-port/engine/src/domain/mapgen/terrain_class.rs:1133` | `mapgen/terrain_class` | `map_center_radial_bias` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 468 | `rust-port/engine/src/domain/mapgen/terrain_class.rs:1198` | `mapgen/terrain_class` | `count_map_border_hexes` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 469 | `rust-port/engine/src/domain/mapgen/terrain_class.rs:1213` | `mapgen/terrain_class` | `find_land_in_map_border` | 0 | brak tematu: MAPGEN-WIRING | generator mapy |
| 470 | `rust-port/engine/src/domain/okolica/manual.rs:124` | `okolica/manual` | `adjust_tile_worker` | 0 | brak tematu: NIEPODPIETE-OKOLICA-MANUAL-WIRING | brak dopasowania |
| 471 | `rust-port/engine/src/domain/okolica/manual.rs:215` | `okolica/manual` | `toggle_tile_worker` | 0 | brak tematu: NIEPODPIETE-OKOLICA-MANUAL-WIRING | brak dopasowania |
| 472 | `rust-port/engine/src/domain/okolica/sasiedztwo.rs:98` | `okolica/sasiedztwo` | `collect_worked_hex_keys_for_owner` | 0 | brak tematu: NIEPODPIETE-OKOLICA-SASIEDZTWO-WIRING | brak dopasowania |
| 473 | `rust-port/engine/src/domain/okolica/sasiedztwo.rs:129` | `okolica/sasiedztwo` | `collect_worked_hex_owner_map` | 0 | brak tematu: NIEPODPIETE-OKOLICA-SASIEDZTWO-WIRING | brak dopasowania |
| 474 | `rust-port/engine/src/domain/pathfinding.rs:193` | `pathfinding` | `from_tiles` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 475 | `rust-port/engine/src/domain/pathfinding.rs:275` | `pathfinding` | `terrain_movement_cost` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 476 | `rust-port/engine/src/domain/pathfinding.rs:323` | `pathfinding` | `field_qualification` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 477 | `rust-port/engine/src/domain/pathfinding.rs:327` | `pathfinding` | `qualify_tile` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 478 | `rust-port/engine/src/domain/pathfinding.rs:385` | `pathfinding` | `find_path` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 479 | `rust-port/engine/src/domain/pathfinding.rs:598` | `pathfinding` | `can_ai_enter_empty_enemy_city` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 480 | `rust-port/engine/src/domain/pathfinding.rs:639` | `pathfinding` | `add_foreign_city_blocks` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 481 | `rust-port/engine/src/domain/pathfinding.rs:651` | `pathfinding` | `add_foreign_city_block_coords` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 482 | `rust-port/engine/src/domain/pathfinding.rs:883` | `pathfinding` | `from_keys` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 483 | `rust-port/engine/src/domain/pathfinding.rs:1355` | `pathfinding` | `embark_tech` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 484 | `rust-port/engine/src/domain/pathfinding.rs:1360` | `pathfinding` | `embark_defense_mult` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 485 | `rust-port/engine/src/domain/pathfinding.rs:1365` | `pathfinding` | `embarked_water_move_cost` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 486 | `rust-port/engine/src/domain/pathfinding.rs:1386` | `pathfinding` | `move_cost_fn_for` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 487 | `rust-port/engine/src/domain/pathfinding.rs:1421` | `pathfinding` | `apply_embark_state_after_move` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 488 | `rust-port/engine/src/domain/pathfinding.rs:1437` | `pathfinding` | `nearest_free_water_hex` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 489 | `rust-port/engine/src/domain/pathfinding.rs:1493` | `pathfinding` | `from_entries` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 490 | `rust-port/engine/src/domain/pathfinding.rs:1539` | `pathfinding` | `set_rally_point` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 491 | `rust-port/engine/src/domain/pathfinding.rs:1553` | `pathfinding` | `clear_rally_point` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 492 | `rust-port/engine/src/domain/pathfinding.rs:1558` | `pathfinding` | `rally_launch_leader_ids` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 493 | `rust-port/engine/src/domain/pathfinding.rs:1574` | `pathfinding` | `rally_points_to_save` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 494 | `rust-port/engine/src/domain/pathfinding.rs:1682` | `pathfinding` | `rally_points_from_save` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 495 | `rust-port/engine/src/domain/pathfinding.rs:1773` | `pathfinding` | `truncate_path_at_fog_frontier` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 496 | `rust-port/engine/src/domain/pathfinding.rs:2061` | `pathfinding` | `execute_march_step` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 497 | `rust-port/engine/src/domain/pathfinding.rs:2170` | `pathfinding` | `planned_marches_from_save` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 498 | `rust-port/engine/src/domain/pathfinding.rs:2305` | `pathfinding` | `clear_scout_auto_explore` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 499 | `rust-port/engine/src/domain/pathfinding.rs:2336` | `pathfinding` | `score_hex_for_explore` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 500 | `rust-port/engine/src/domain/pathfinding.rs:2583` | `pathfinding` | `run_scouts_auto_explore` | 0 | brak tematu: NIEPODPIETE-PATHFINDING-WIRING | brak dopasowania |
| 501 | `rust-port/engine/src/domain/playable.rs:547` | `playable` | `power_record_battle_win` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 502 | `rust-port/engine/src/domain/playable.rs:554` | `playable` | `power_record_city_capture` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 503 | `rust-port/engine/src/domain/playable.rs:566` | `playable` | `power_clear_eliminated_owner` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 504 | `rust-port/engine/src/domain/playable.rs:757` | `playable` | `pending_phase_count` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 505 | `rust-port/engine/src/domain/playable.rs:850` | `playable` | `set_human_treasury` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 506 | `rust-port/engine/src/domain/playable.rs:860` | `playable` | `set_owner_treasury` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 507 | `rust-port/engine/src/domain/playable.rs:873` | `playable` | `set_owner_praca_pool` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 508 | `rust-port/engine/src/domain/playable.rs:890` | `playable` | `set_capital_stock` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 509 | `rust-port/engine/src/domain/playable.rs:904` | `playable` | `set_replace_unit_state` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 510 | `rust-port/engine/src/domain/playable.rs:942` | `playable` | `replace_unit` | 0 | brak tematu: NIEPODPIETE-PLAYABLE-WIRING | brak dopasowania |
| 511 | `rust-port/engine/src/domain/player.rs:20` | `player` | `is_major_ai_owner` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 512 | `rust-port/engine/src/domain/player.rs:59` | `player` | `is_active_human` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 513 | `rust-port/engine/src/domain/player.rs:64` | `player` | `is_ai_owner` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 514 | `rust-port/engine/src/domain/player.rs:73` | `player` | `next_human_seat` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 515 | `rust-port/engine/src/domain/player.rs:84` | `player` | `is_hot_seat` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 516 | `rust-port/engine/src/domain/player.rs:96` | `player` | `is_awaiting_first_player_city` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 517 | `rust-port/engine/src/domain/player.rs:111` | `player` | `is_hex_in_start_reveal` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 518 | `rust-port/engine/src/domain/player.rs:125` | `player` | `validate_first_player_city_placement` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 519 | `rust-port/engine/src/domain/player.rs:229` | `player` | `is_era_advance_tech` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 520 | `rust-port/engine/src/domain/player.rs:239` | `player` | `dequeue_research_target` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 521 | `rust-port/engine/src/domain/player.rs:256` | `player` | `clear_research_queue` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 522 | `rust-port/engine/src/domain/player.rs:261` | `player` | `get_research_plan_snapshot` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 523 | `rust-port/engine/src/domain/player.rs:583` | `player` | `research_step` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 524 | `rust-port/engine/src/domain/player.rs:706` | `player` | `set_player_research_target` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 525 | `rust-port/engine/src/domain/player.rs:727` | `player` | `get_research_state` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 526 | `rust-port/engine/src/domain/player.rs:776` | `player` | `enqueue_research_target` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 527 | `rust-port/engine/src/domain/player.rs:819` | `player` | `ensure` | 0 | brak tematu: NIEPODPIETE-PLAYER-WIRING | brak dopasowania |
| 528 | `rust-port/engine/src/domain/production_queue.rs:28` | `production_queue` | `front_item` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | brak dopasowania |
| 529 | `rust-port/engine/src/domain/production_queue.rs:33` | `production_queue` | `eta_turns` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | brak dopasowania |
| 530 | `rust-port/engine/src/domain/production_queue.rs:63` | `production_queue` | `unit_recruitment_capacity_per_turn` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | brak dopasowania |
| 531 | `rust-port/engine/src/domain/production_queue.rs:251` | `production_queue` | `dequeue` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | brak dopasowania |
| 532 | `rust-port/engine/src/domain/production_queue.rs:330` | `production_queue` | `promote_to_front` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | brak dopasowania |
| 533 | `rust-port/engine/src/domain/production_queue.rs:356` | `production_queue` | `insert_at_front` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | brak dopasowania |
| 534 | `rust-port/engine/src/domain/production_queue.rs:394` | `production_queue` | `advance_production` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | brak dopasowania |
| 535 | `rust-port/engine/src/domain/production_units.rs:36` | `production_units` | `newest_available_same_type_unit` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 536 | `rust-port/engine/src/domain/production_units.rs:142` | `production_units` | `upgrade_composition_lines` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 537 | `rust-port/engine/src/domain/production_units.rs:158` | `production_units` | `city_has_biblioteka_line` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 538 | `rust-port/engine/src/domain/production_units.rs:163` | `production_units` | `city_has_amfiteatr_line` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 539 | `rust-port/engine/src/domain/production_units.rs:168` | `production_units` | `city_has_mur_line` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 540 | `rust-port/engine/src/domain/production_units.rs:197` | `production_units` | `building_structural_defense_bonus_line` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 541 | `rust-port/engine/src/domain/production_units.rs:217` | `production_units` | `city_has_palac_line` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 542 | `rust-port/engine/src/domain/production_units.rs:267` | `production_units` | `group_built_building_ids` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 543 | `rust-port/engine/src/domain/production_units.rs:433` | `production_units` | `building_item` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 544 | `rust-port/engine/src/domain/production_units.rs:451` | `production_units` | `unit_item` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 545 | `rust-port/engine/src/domain/production_units.rs:559` | `production_units` | `default_unit_cost` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 546 | `rust-port/engine/src/domain/production_units.rs:577` | `production_units` | `default_cost_by_role` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 547 | `rust-port/engine/src/domain/production_units.rs:2079` | `production_units` | `unit_stock_shortfall_label` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 548 | `rust-port/engine/src/domain/production_units.rs:2131` | `production_units` | `building_stat_summary_lines` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 549 | `rust-port/engine/src/domain/production_units.rs:2285` | `production_units` | `building_gold_purchase_cost` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 550 | `rust-port/engine/src/domain/production_units.rs:2330` | `production_units` | `apply_completed_building_ids` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 551 | `rust-port/engine/src/domain/production_units.rs:2359` | `production_units` | `building_unlock_flag_for` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 552 | `rust-port/engine/src/domain/production_units.rs:2396` | `production_units` | `civ_special_unit_name_tokens` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 553 | `rust-port/engine/src/domain/production_units.rs:2434` | `production_units` | `unit_matches_special_name` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 554 | `rust-port/engine/src/domain/production_units.rs:2463` | `production_units` | `population_cost_of` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 555 | `rust-port/engine/src/domain/production_units.rs:2480` | `production_units` | `manpower_cost_of` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 556 | `rust-port/engine/src/domain/production_units.rs:2502` | `production_units` | `set_paused` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 557 | `rust-port/engine/src/domain/production_units.rs:2656` | `production_units` | `available_replacements_for` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 558 | `rust-port/engine/src/domain/production_units.rs:3104` | `production_units` | `epoch_number_to_name` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 559 | `rust-port/engine/src/domain/production_units.rs:3123` | `production_units` | `enqueue_recruitment` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 560 | `rust-port/engine/src/domain/production_units.rs:3133` | `production_units` | `dequeue_recruitment` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 561 | `rust-port/engine/src/domain/production_units.rs:3166` | `production_units` | `advance_recruitment` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 562 | `rust-port/engine/src/domain/production_units.rs:3194` | `production_units` | `advance_recruitment_gated` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 563 | `rust-port/engine/src/domain/production_units.rs:3256` | `production_units` | `rush_cost` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 564 | `rust-port/engine/src/domain/production_units.rs:3290` | `production_units` | `rush_production` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 565 | `rust-port/engine/src/domain/production_units.rs:3359` | `production_units` | `preview_praca_pool_brutto` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 566 | `rust-port/engine/src/domain/production_units.rs:3376` | `production_units` | `unit_cost_mode` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 567 | `rust-port/engine/src/domain/production_units.rs:3382` | `production_units` | `unit_purchase_cost` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 568 | `rust-port/engine/src/domain/production_units.rs:3401` | `production_units` | `buildable_production` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 569 | `rust-port/engine/src/domain/production_units.rs:3413` | `production_units` | `purchasable_units` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 570 | `rust-port/engine/src/domain/production_units.rs:3556` | `production_units` | `era_building_catalog` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 571 | `rust-port/engine/src/domain/production_units.rs:3751` | `production_units` | `city_science_output` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 572 | `rust-port/engine/src/domain/production_units.rs:3756` | `production_units` | `city_money_output` | 0 | brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | brak dopasowania |
| 573 | `rust-port/engine/src/domain/recruitment.rs:72` | `recruitment` | `stock_costs` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 574 | `rust-port/engine/src/domain/recruitment.rs:80` | `recruitment` | `resource_upkeep_costs` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 575 | `rust-port/engine/src/domain/recruitment.rs:388` | `recruitment` | `stack_key` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 576 | `rust-port/engine/src/domain/recruitment.rs:489` | `recruitment` | `same_stack_group` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 577 | `rust-port/engine/src/domain/recruitment.rs:520` | `recruitment` | `assign_shared_stack_group_id` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 578 | `rust-port/engine/src/domain/recruitment.rs:560` | `recruitment` | `co_located_for_merge_prompt` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 579 | `rust-port/engine/src/domain/recruitment.rs:588` | `recruitment` | `adjacent_visible_army_hexes` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 580 | `rust-port/engine/src/domain/recruitment.rs:630` | `recruitment` | `active_unit_stack` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 581 | `rust-port/engine/src/domain/recruitment.rs:647` | `recruitment` | `enter_garnizon` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 582 | `rust-port/engine/src/domain/recruitment.rs:670` | `recruitment` | `enter_field_fortify` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 583 | `rust-port/engine/src/domain/recruitment.rs:690` | `recruitment` | `all_defenders_fortified_in_garnizon` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 584 | `rust-port/engine/src/domain/recruitment.rs:695` | `recruitment` | `wake_stack_for_move_order` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 585 | `rust-port/engine/src/domain/recruitment.rs:798` | `recruitment` | `compute_stack_display` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 586 | `rust-port/engine/src/domain/recruitment.rs:845` | `recruitment` | `unit_at_representative` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 587 | `rust-port/engine/src/domain/recruitment.rs:901` | `recruitment` | `find_split_dest_hexes` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 588 | `rust-port/engine/src/domain/recruitment.rs:927` | `recruitment` | `assign_bounce_hexes_for_units` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 589 | `rust-port/engine/src/domain/recruitment.rs:1009` | `recruitment` | `find_bounce_hex_from_origin` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 590 | `rust-port/engine/src/domain/recruitment.rs:1020` | `recruitment` | `compute_separate_return` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 591 | `rust-port/engine/src/domain/recruitment.rs:1038` | `recruitment` | `resolve_separate_return_hex` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 592 | `rust-port/engine/src/domain/recruitment.rs:1069` | `recruitment` | `stack_hud_merge_split_actions` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 593 | `rust-port/engine/src/domain/recruitment.rs:1278` | `recruitment` | `deduct_stack_ruch_left` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 594 | `rust-port/engine/src/domain/recruitment.rs:1289` | `recruitment` | `unit_with_stack_ruch` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 595 | `rust-port/engine/src/domain/recruitment.rs:1305` | `recruitment` | `unit_with_planning_stack_ruch` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 596 | `rust-port/engine/src/domain/recruitment.rs:1365` | `recruitment` | `koszt_jednostek_pace_keys` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 597 | `rust-port/engine/src/domain/recruitment.rs:1393` | `recruitment` | `build_replace_availability_ctx` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 598 | `rust-port/engine/src/domain/recruitment.rs:1766` | `recruitment` | `civ_manpower_regen_mult` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 599 | `rust-port/engine/src/domain/recruitment.rs:1916` | `recruitment` | `sync_live_unit_hp` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 600 | `rust-port/engine/src/domain/recruitment.rs:1940` | `recruitment` | `replenishment_unit_sort_key` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 601 | `rust-port/engine/src/domain/recruitment.rs:2125` | `recruitment` | `format_obywatele_label` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 602 | `rust-port/engine/src/domain/recruitment.rs:2255` | `recruitment` | `city_manpower_snapshot` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 603 | `rust-port/engine/src/domain/recruitment.rs:2326` | `recruitment` | `can_afford_unit_manpower` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 604 | `rust-port/engine/src/domain/recruitment.rs:2406` | `recruitment` | `refund_manpower_to_empire` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 605 | `rust-port/engine/src/domain/recruitment.rs:2448` | `recruitment` | `can_afford_unit_manpower_empire` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 606 | `rust-port/engine/src/domain/recruitment.rs:2494` | `recruitment` | `try_deduct_unit_spawn_costs_empire` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 607 | `rust-port/engine/src/domain/recruitment.rs:2581` | `recruitment` | `default_refund_pop_cost` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 608 | `rust-port/engine/src/domain/recruitment.rs:2586` | `recruitment` | `refund_unit_spawn_to_city` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 609 | `rust-port/engine/src/domain/recruitment.rs:2631` | `recruitment` | `spend_manpower` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 610 | `rust-port/engine/src/domain/recruitment.rs:2840` | `recruitment` | `format_manpower` | 0 | brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | brak dopasowania |
| 611 | `rust-port/engine/src/domain/replay.rs:111` | `replay` | `into_parts` | 0 | brak tematu: REPLAY-WIRING | replay |
| 612 | `rust-port/engine/src/domain/replay.rs:199` | `replay` | `load_json_with_migration_reports` | 0 | brak tematu: REPLAY-WIRING | replay |
| 613 | `rust-port/engine/src/domain/replay.rs:257` | `replay` | `from_steps` | 0 | brak tematu: REPLAY-WIRING | replay |
| 614 | `rust-port/engine/src/domain/replay.rs:343` | `replay` | `playback` | 0 | brak tematu: REPLAY-WIRING | replay |
| 615 | `rust-port/engine/src/domain/replay.rs:398` | `replay` | `rng_mut` | 0 | brak tematu: REPLAY-WIRING | replay |
| 616 | `rust-port/engine/src/domain/replay.rs:415` | `replay` | `record_input` | 0 | brak tematu: REPLAY-WIRING | replay |
| 617 | `rust-port/engine/src/domain/replay.rs:419` | `replay` | `record_input_with_snapshot` | 0 | brak tematu: REPLAY-WIRING | replay |
| 618 | `rust-port/engine/src/domain/replay.rs:445` | `replay` | `into_log` | 0 | brak tematu: REPLAY-WIRING | replay |
| 619 | `rust-port/engine/src/domain/replay.rs:477` | `replay` | `is_finished` | 0 | brak tematu: REPLAY-WIRING | replay |
| 620 | `rust-port/engine/src/domain/replay.rs:481` | `replay` | `peek` | 0 | brak tematu: REPLAY-WIRING | replay |
| 621 | `rust-port/engine/src/domain/replay.rs:496` | `replay` | `next_input` | 0 | brak tematu: REPLAY-WIRING | replay |
| 622 | `rust-port/engine/src/domain/replay.rs:504` | `replay` | `rng_mut` | 0 | brak tematu: REPLAY-WIRING | replay |
| 623 | `rust-port/engine/src/domain/replay.rs:508` | `replay` | `reset` | 0 | brak tematu: REPLAY-WIRING | replay |
| 624 | `rust-port/engine/src/domain/resource_access.rs:119` | `resource_access` | `empire_has_kopalnia_na_zlozu_cyny` | 0 | brak tematu: NIEPODPIETE-RESOURCE_ACCESS-WIRING | brak dopasowania |
| 625 | `rust-port/engine/src/domain/resource_access.rs:149` | `resource_access` | `has_cyna_access` | 0 | brak tematu: NIEPODPIETE-RESOURCE_ACCESS-WIRING | brak dopasowania |
| 626 | `rust-port/engine/src/domain/resource_access.rs:260` | `resource_access` | `resolve_owner_zloto_from_stock` | 0 | brak tematu: NIEPODPIETE-RESOURCE_ACCESS-WIRING | brak dopasowania |
| 627 | `rust-port/engine/src/domain/resource_access.rs:282` | `resource_access` | `placed_improvements_with_zloto_trade_grant` | 0 | brak tematu: NIEPODPIETE-RESOURCE_ACCESS-WIRING | brak dopasowania |
| 628 | `rust-port/engine/src/domain/resource_access.rs:342` | `resource_access` | `culture_mix_breakdown` | 0 | brak tematu: NIEPODPIETE-RESOURCE_ACCESS-WIRING | brak dopasowania |
| 629 | `rust-port/engine/src/domain/resource_access/active_access.rs:112` | `resource_access/active_access` | `hex_deposit_display_label` | 0 | brak tematu: NIEPODPIETE-RESOURCE_ACCESS-ACTIVE_ACCESS-WIRING | brak dopasowania |
| 630 | `rust-port/engine/src/domain/resource_access/active_access.rs:117` | `resource_access/active_access` | `hex_hidden_deposit_hint` | 0 | brak tematu: NIEPODPIETE-RESOURCE_ACCESS-ACTIVE_ACCESS-WIRING | brak dopasowania |
| 631 | `rust-port/engine/src/domain/resource_access/active_access.rs:478` | `resource_access/active_access` | `get_resource_access_for_city` | 0 | brak tematu: NIEPODPIETE-RESOURCE_ACCESS-ACTIVE_ACCESS-WIRING | brak dopasowania |
| 632 | `rust-port/engine/src/domain/resource_production.rs:151` | `resource_production` | `resolve_citizen_resource_coverage` | 0 | brak tematu: NIEPODPIETE-RESOURCE_PRODUCTION-WIRING | brak dopasowania |
| 633 | `rust-port/engine/src/domain/resource_production.rs:240` | `resource_production` | `citizen_upkeep_display_lines` | 0 | brak tematu: NIEPODPIETE-RESOURCE_PRODUCTION-WIRING | brak dopasowania |
| 634 | `rust-port/engine/src/domain/rng.rs:77` | `rng` | `gen_range` | 0 | brak tematu: NIEPODPIETE-RNG-WIRING | brak dopasowania |
| 635 | `rust-port/engine/src/domain/roads.rs:26` | `roads` | `road_min_move_cost` | 0 | brak tematu: DROGI-WIRING | nazwa modulu (heurystyka) |
| 636 | `rust-port/engine/src/domain/roads.rs:103` | `roads` | `collect_road_keys` | 0 | brak tematu: DROGI-WIRING | nazwa modulu (heurystyka) |
| 637 | `rust-port/engine/src/domain/save_load.rs:258` | `save_load` | `with_era_war_counts` | 0 | brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | brak dopasowania |
| 638 | `rust-port/engine/src/domain/save_load.rs:274` | `save_load` | `with_battle_mode_setting_version` | 0 | brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | brak dopasowania |
| 639 | `rust-port/engine/src/domain/save_load.rs:280` | `save_load` | `with_new_game_params` | 0 | brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | brak dopasowania |
| 640 | `rust-port/engine/src/domain/save_load.rs:288` | `save_load` | `battle_mode_setting_value` | 0 | brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | brak dopasowania |
| 641 | `rust-port/engine/src/domain/save_load.rs:678` | `save_load` | `web_meta` | 0 | brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | brak dopasowania |
| 642 | `rust-port/engine/src/domain/save_load.rs:702` | `save_load` | `migrate_on_load_with_era_override_for_test` | 0 | brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | brak dopasowania |
| 643 | `rust-port/engine/src/domain/save_load.rs:711` | `save_load` | `auto_build_allowed_for_owner` | 0 | brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | brak dopasowania |
| 644 | `rust-port/engine/src/domain/save_load.rs:760` | `save_load` | `into_parts` | 0 | brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | brak dopasowania |
| 645 | `rust-port/engine/src/domain/siege_capture_events.rs:140` | `siege_capture_events` | `record_civ_elim_event` | 0 | #115 ZDOBYCIE-MIASTA-WIRING | zdobycie miasta |
| 646 | `rust-port/engine/src/domain/siege_city_fortification.rs:35` | `siege_city_fortification` | `city_fortification_kind` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 647 | `rust-port/engine/src/domain/siege_city_fortification.rs:66` | `siege_city_fortification` | `melee_blocked_by_wall` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 648 | `rust-port/engine/src/domain/siege_engine_build.rs:127` | `siege_engine_build` | `siege_engine_quota` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 649 | `rust-port/engine/src/domain/siege_engine_build.rs:132` | `siege_engine_build` | `siege_engine_build_option` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 650 | `rust-port/engine/src/domain/siege_nearby_lock.rs:55` | `siege_nearby_lock` | `besiege_army_groups` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 651 | `rust-port/engine/src/domain/siege_nearby_lock.rs:76` | `siege_nearby_lock` | `besiege_lock_targets` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 652 | `rust-port/engine/src/domain/siege_no_breach.rs:27` | `siege_no_breach` | `siege_no_breach_max_rounds_from_data` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 653 | `rust-port/engine/src/domain/siege_no_breach.rs:53` | `siege_no_breach` | `siege_no_breach_cap` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 654 | `rust-port/engine/src/domain/siege_sortie.rs:115` | `siege_sortie` | `plan_last_stand_sortie` | 0 | #115 ZDOBYCIE-MIASTA-WIRING | wyjazd z miasta oblezonego |
| 655 | `rust-port/engine/src/domain/siege_starvation.rs:220` | `siege_starvation` | `siege_defender_units` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 656 | `rust-port/engine/src/domain/siege_surrender.rs:90` | `siege_surrender` | `besieger_owner_for_city` | 0 | #115 ZDOBYCIE-MIASTA-WIRING | kapitulacja miasta |
| 657 | `rust-port/engine/src/domain/siege_surrender.rs:143` | `siege_surrender` | `surrender_tick_action` | 0 | #115 ZDOBYCIE-MIASTA-WIRING | kapitulacja miasta |
| 658 | `rust-port/engine/src/domain/siege_surrender.rs:194` | `siege_surrender` | `transfer_removal_ids` | 0 | #115 ZDOBYCIE-MIASTA-WIRING | kapitulacja miasta |
| 659 | `rust-port/engine/src/domain/siege_tactics_activate.rs:216` | `siege_tactics_activate` | `activate_unit` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 660 | `rust-port/engine/src/domain/siege_tactics_activate.rs:498` | `siege_tactics_activate` | `ram_tower` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 661 | `rust-port/engine/src/domain/siege_tactics_approach.rs:117` | `siege_tactics_approach` | `siege_shooter_threats` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 662 | `rust-port/engine/src/domain/siege_tactics_approach.rs:241` | `siege_tactics_approach` | `siege_safe_approach_goal` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 663 | `rust-port/engine/src/domain/siege_tactics_autobatch.rs:296` | `siege_tactics_autobatch` | `planning_move` | 0 | #97 K5-LOOP-AUTO | tryb AUTO bez oblezenia (nazwa modulu) |
| 664 | `rust-port/engine/src/domain/siege_tactics_autobatch.rs:318` | `siege_tactics_autobatch` | `planning_attack` | 0 | #97 K5-LOOP-AUTO | tryb AUTO bez oblezenia (nazwa modulu) |
| 665 | `rust-port/engine/src/domain/siege_tactics_autobatch.rs:324` | `siege_tactics_autobatch` | `units_from_seq_refs` | 0 | #97 K5-LOOP-AUTO | tryb AUTO bez oblezenia (nazwa modulu) |
| 666 | `rust-port/engine/src/domain/siege_tactics_autobatch.rs:346` | `siege_tactics_autobatch` | `begin_auto_batch_turn_from_current_state` | 0 | #97 K5-LOOP-AUTO | tryb AUTO bez oblezenia (nazwa modulu) |
| 667 | `rust-port/engine/src/domain/siege_tactics_autobatch.rs:765` | `siege_tactics_autobatch` | `halt_auto_battle_turn` | 0 | #97 K5-LOOP-AUTO | tryb AUTO bez oblezenia (nazwa modulu) |
| 668 | `rust-port/engine/src/domain/siege_tactics_autobatch.rs:782` | `siege_tactics_autobatch` | `fire_timers` | 0 | #97 K5-LOOP-AUTO | tryb AUTO bez oblezenia (nazwa modulu) |
| 669 | `rust-port/engine/src/domain/siege_tactics_blow_env.rs:145` | `siege_tactics_blow_env` | `blow_hit_arc` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 670 | `rust-port/engine/src/domain/siege_tactics_blow_env.rs:172` | `siege_tactics_blow_env` | `attacker_river_mult_by_name` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 671 | `rust-port/engine/src/domain/siege_tactics_blow_env.rs:179` | `siege_tactics_blow_env` | `blow_env_for` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 672 | `rust-port/engine/src/domain/siege_tactics_blow_full.rs:309` | `siege_tactics_blow_full` | `attacker_from_cu` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 673 | `rust-port/engine/src/domain/siege_tactics_blow_full.rs:323` | `siege_tactics_blow_full` | `defender_from_cu` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 674 | `rust-port/engine/src/domain/siege_tactics_blow_full.rs:333` | `siege_tactics_blow_full` | `single_blow_full` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 675 | `rust-port/engine/src/domain/siege_tactics_blow_full.rs:340` | `siege_tactics_blow_full` | `is_kill` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 676 | `rust-port/engine/src/domain/siege_tactics_breach.rs:63` | `siege_tactics_breach` | `to_approach_state` | 0 | #98 K5-LOOP-WYLOM | wylom w pętli (nazwa modulu) |
| 677 | `rust-port/engine/src/domain/siege_tactics_breach.rs:103` | `siege_tactics_breach` | `attack_wall_tile` | 0 | #98 K5-LOOP-WYLOM | wylom w pętli (nazwa modulu) |
| 678 | `rust-port/engine/src/domain/siege_tactics_breach.rs:121` | `siege_tactics_breach` | `wall_attack_allowed` | 0 | #98 K5-LOOP-WYLOM | wylom w pętli (nazwa modulu) |
| 679 | `rust-port/engine/src/domain/siege_tactics_breach.rs:137` | `siege_tactics_breach` | `attack_gate` | 0 | #98 K5-LOOP-WYLOM | wylom w pętli (nazwa modulu) |
| 680 | `rust-port/engine/src/domain/siege_tactics_breach.rs:153` | `siege_tactics_breach` | `tower_climb_enter_wall` | 0 | #98 K5-LOOP-WYLOM | wylom w pętli (nazwa modulu) |
| 681 | `rust-port/engine/src/domain/siege_tactics_breach.rs:166` | `siege_tactics_breach` | `skip_instant_fallback` | 0 | #98 K5-LOOP-WYLOM | wylom w pętli (nazwa modulu) |
| 682 | `rust-port/engine/src/domain/siege_tactics_class_adapters.rs:54` | `siege_tactics_class_adapters` | `class_flags` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 683 | `rust-port/engine/src/domain/siege_tactics_class_adapters.rs:64` | `siege_tactics_class_adapters` | `approach_unit` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 684 | `rust-port/engine/src/domain/siege_tactics_class_adapters.rs:78` | `siege_tactics_class_adapters` | `tower_unit` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 685 | `rust-port/engine/src/domain/siege_tactics_class_adapters.rs:96` | `siege_tactics_class_adapters` | `activate_unit` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 686 | `rust-port/engine/src/domain/siege_tactics_clock.rs:119` | `siege_tactics_clock` | `advance_v_clock` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 687 | `rust-port/engine/src/domain/siege_tactics_endcheck.rs:109` | `siege_tactics_endcheck` | `update_stall_watch` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 688 | `rust-port/engine/src/domain/siege_tactics_inputs_pos.rs:242` | `siege_tactics_inputs_pos` | `battle_unit_difficulty_combat_mult` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 689 | `rust-port/engine/src/domain/siege_tactics_inputs_unit.rs:409` | `siege_tactics_inputs_unit` | `to_combat_unit` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 690 | `rust-port/engine/src/domain/siege_tactics_inputs_wall.rs:83` | `siege_tactics_inputs_wall` | `wall_defense_totals` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 691 | `rust-port/engine/src/domain/siege_tactics_loop.rs:206` | `siege_tactics_loop` | `winner_label` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 692 | `rust-port/engine/src/domain/siege_tactics_unit.rs:83` | `siege_tactics_unit` | `is_out` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 693 | `rust-port/engine/src/domain/siege_tactics_unit.rs:88` | `siege_tactics_unit` | `is_broken` | 0 | #113 K5LOOP-WIRING | pętla taktyczna oblezenia, finalne wpiecie (nazwa modulu) |
| 694 | `rust-port/engine/src/domain/siege_turn.rs:47` | `siege_turn` | `starvation_food` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 695 | `rust-port/engine/src/domain/siege_turn.rs:56` | `siege_turn` | `next_siege_turn` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 696 | `rust-port/engine/src/domain/siege_turn.rs:69` | `siege_turn` | `siege_city_turn` | 0 | #113 K5LOOP-WIRING | oblezenie (inne moduly siege_*) |
| 697 | `rust-port/engine/src/domain/society_breakdown/order.rs:103` | `society_breakdown/order` | `fallback_revolt_params` | 0 | brak tematu: NIEPODPIETE-SOCIETY_BREAKDOWN-ORDER-WIRING | brak dopasowania |
| 698 | `rust-port/engine/src/domain/society_breakdown/order.rs:199` | `society_breakdown/order` | `order_contribution_pct` | 0 | brak tematu: NIEPODPIETE-SOCIETY_BREAKDOWN-ORDER-WIRING | brak dopasowania |
| 699 | `rust-port/engine/src/domain/society_breakdown/order.rs:346` | `society_breakdown/order` | `revolt_warning_message` | 0 | brak tematu: NIEPODPIETE-SOCIETY_BREAKDOWN-ORDER-WIRING | brak dopasowania |
| 700 | `rust-port/engine/src/domain/start_position.rs:302` | `start_position` | `build_cluster_start_plan` | 0 | brak tematu: NIEPODPIETE-START_POSITION-WIRING | brak dopasowania |
| 701 | `rust-port/engine/src/domain/start_position.rs:540` | `start_position` | `from_web_value` | 0 | brak tematu: NIEPODPIETE-START_POSITION-WIRING | brak dopasowania |
| 702 | `rust-port/engine/src/domain/start_position.rs:606` | `start_position` | `seed_inca_llama_deposits` | 0 | brak tematu: NIEPODPIETE-START_POSITION-WIRING | brak dopasowania |
| 703 | `rust-port/engine/src/domain/state.rs:338` | `state` | `found_city_work_cost` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 704 | `rust-port/engine/src/domain/state.rs:343` | `state` | `found_city_population_cost` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 705 | `rust-port/engine/src/domain/state.rs:348` | `state` | `ai_founding_source_min_pop` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 706 | `rust-port/engine/src/domain/state.rs:399` | `state` | `pick_source_city_for_founding` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 707 | `rust-port/engine/src/domain/state.rs:477` | `state` | `evaluate_found_city_affordance` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 708 | `rust-port/engine/src/domain/state.rs:546` | `state` | `can_afford_found_city` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 709 | `rust-port/engine/src/domain/state.rs:575` | `state` | `found_city_cost_label` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 710 | `rust-port/engine/src/domain/state.rs:623` | `state` | `on_city_captured_culture` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 711 | `rust-port/engine/src/domain/state.rs:785` | `state` | `conquest_unstable_happiness_penalty` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 712 | `rust-port/engine/src/domain/state.rs:794` | `state` | `conquest_no_garrison_law_penalty` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 713 | `rust-port/engine/src/domain/state.rs:884` | `state` | `build_unit_sight_resolver` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 714 | `rust-port/engine/src/domain/state.rs:952` | `state` | `compute_visible_along_path` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 715 | `rust-port/engine/src/domain/state.rs:971` | `state` | `compute_visible` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 716 | `rust-port/engine/src/domain/state.rs:996` | `state` | `all_hex_keys` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 717 | `rust-port/engine/src/domain/state.rs:1006` | `state` | `all_reveal_land_keys` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 718 | `rust-port/engine/src/domain/state.rs:1020` | `state` | `all_dry_land_keys` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 719 | `rust-port/engine/src/domain/state.rs:1029` | `state` | `explored_set_for_render` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 720 | `rust-port/engine/src/domain/state.rs:1067` | `state` | `compute_player_visibility` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 721 | `rust-port/engine/src/domain/state.rs:1120` | `state` | `units_visible_on_map` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 722 | `rust-port/engine/src/domain/state.rs:1201` | `state` | `is_cluster_city_state_slot` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 723 | `rust-port/engine/src/domain/state.rs:1270` | `state` | `should_force_culture_icon_for_owner` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 724 | `rust-port/engine/src/domain/state.rs:1306` | `state` | `format_city_map_label` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 725 | `rust-port/engine/src/domain/state.rs:1337` | `state` | `format_owner_diplo_label` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 726 | `rust-port/engine/src/domain/state.rs:1423` | `state` | `resolve_owner_base_name` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 727 | `rust-port/engine/src/domain/state.rs:1475` | `state` | `sanitize_owner_display_base` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 728 | `rust-port/engine/src/domain/state.rs:1853` | `state` | `empty_budowa_lista_biblioteka` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 729 | `rust-port/engine/src/domain/state.rs:1924` | `state` | `budowa_typ_focus` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 730 | `rust-port/engine/src/domain/state.rs:1971` | `state` | `min_procent_puli_imperium_zasada3_nadwyzka` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 731 | `rust-port/engine/src/domain/state.rs:1976` | `state` | `podzial_pracy_pula_lbl` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 732 | `rust-port/engine/src/domain/state.rs:1981` | `state` | `podzial_pracy_pula_lbl_pelna` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 733 | `rust-port/engine/src/domain/state.rs:1986` | `state` | `podzial_pracy_pula_tip` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 734 | `rust-port/engine/src/domain/state.rs:1996` | `state` | `default_procent_rozwoj` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 735 | `rust-port/engine/src/domain/state.rs:2075` | `state` | `default_budowa_lista_nazwa` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 736 | `rust-port/engine/src/domain/state.rs:2127` | `state` | `load_budowa_lista_biblioteka` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 737 | `rust-port/engine/src/domain/state.rs:2171` | `state` | `dedupe_budowa_lista` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 738 | `rust-port/engine/src/domain/state.rs:2184` | `state` | `is_auto_budowa_tryb` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 739 | `rust-port/engine/src/domain/state.rs:2308` | `state` | `compute_ai_improvement_budget_cap_for_owner` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 740 | `rust-port/engine/src/domain/state.rs:2331` | `state` | `resolve_effective_ulepszenia` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 741 | `rust-port/engine/src/domain/state.rs:2381` | `state` | `procent_puli_imperium_z_budynkow` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 742 | `rust-port/engine/src/domain/state.rs:2386` | `state` | `podzial_pracy_z_procentu_puli` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 743 | `rust-port/engine/src/domain/state.rs:2435` | `state` | `adjust_handel_split` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 744 | `rust-port/engine/src/domain/state.rs:2566` | `state` | `ensure_city_save_defaults` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 745 | `rust-port/engine/src/domain/state.rs:2672` | `state` | `was_independent_city_state_before_capture` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 746 | `rust-port/engine/src/domain/state.rs:2851` | `state` | `found_city` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 747 | `rust-port/engine/src/domain/state.rs:2935` | `state` | `found_city_from_village` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 748 | `rust-port/engine/src/domain/state.rs:3072` | `state` | `apply_podzial_pracy_local_change` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 749 | `rust-port/engine/src/domain/state.rs:3095` | `state` | `migrate_podzial_pracy_on_load` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 750 | `rust-port/engine/src/domain/state.rs:3160` | `state` | `resolve_city_okolica_focus` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 751 | `rust-port/engine/src/domain/state.rs:3175` | `state` | `broadcast_okolica_focus_to_owner_cities` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 752 | `rust-port/engine/src/domain/state.rs:3189` | `state` | `migrate_okolica_focus_on_load` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 753 | `rust-port/engine/src/domain/state.rs:3233` | `state` | `fresh_owner_default_okolica_focus` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 754 | `rust-port/engine/src/domain/state.rs:3254` | `state` | `resolve_city_budowa_profil` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 755 | `rust-port/engine/src/domain/state.rs:3291` | `state` | `migrate_budowa_profil_on_load` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 756 | `rust-port/engine/src/domain/state.rs:3369` | `state` | `fresh_owner_default_budowa_profil_for_owner` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 757 | `rust-port/engine/src/domain/state.rs:3384` | `state` | `upgrade_budowa_profil_auto_defaults_on_load` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 758 | `rust-port/engine/src/domain/state.rs:3427` | `state` | `resolve_city_poziom_racji` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 759 | `rust-port/engine/src/domain/state.rs:3439` | `state` | `broadcast_poziom_racji_to_owner_cities` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 760 | `rust-port/engine/src/domain/state.rs:3453` | `state` | `broadcast_auto_wyzywienie_to_owner_cities` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 761 | `rust-port/engine/src/domain/state.rs:3463` | `state` | `migrate_poziom_racji_on_load` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 762 | `rust-port/engine/src/domain/state.rs:3507` | `state` | `fresh_owner_default_poziom_racji` | 0 | brak tematu: NIEPODPIETE-STATE-WIRING | brak dopasowania |
| 763 | `rust-port/engine/src/domain/terrain.rs:191` | `terrain` | `from_web_value` | 0 | brak tematu: NIEPODPIETE-TERRAIN-WIRING | brak dopasowania |
| 764 | `rust-port/engine/src/domain/terrain.rs:316` | `terrain` | `is_hex_reserved_by_rival_fort` | 0 | brak tematu: NIEPODPIETE-TERRAIN-WIRING | brak dopasowania |
| 765 | `rust-port/engine/src/domain/terrain.rs:350` | `terrain` | `apply_fort_takeover_on_city_founded` | 0 | brak tematu: NIEPODPIETE-TERRAIN-WIRING | brak dopasowania |
| 766 | `rust-port/engine/src/domain/terrain.rs:410` | `terrain` | `find_evacuation_hex_outside_city` | 0 | brak tematu: NIEPODPIETE-TERRAIN-WIRING | brak dopasowania |
| 767 | `rust-port/engine/src/domain/terrain.rs:480` | `terrain` | `city_keeps_improvement` | 0 | brak tematu: NIEPODPIETE-TERRAIN-WIRING | brak dopasowania |
| 768 | `rust-port/engine/src/domain/terrain.rs:488` | `terrain` | `city_keep_improvement_keys` | 0 | brak tematu: NIEPODPIETE-TERRAIN-WIRING | brak dopasowania |
| 769 | `rust-port/engine/src/domain/terrain.rs:531` | `terrain` | `apply_city_founding_to_hex` | 0 | brak tematu: NIEPODPIETE-TERRAIN-WIRING | brak dopasowania |
| 770 | `rust-port/engine/src/domain/territory.rs:330` | `territory` | `make_territory_workable_filter` | 0 | brak tematu: NIEPODPIETE-TERRITORY-WIRING | brak dopasowania |
| 771 | `rust-port/engine/src/domain/territory.rs:352` | `territory` | `is_reczne_key_legal` | 0 | brak tematu: NIEPODPIETE-TERRITORY-WIRING | brak dopasowania |
| 772 | `rust-port/engine/src/domain/territory.rs:499` | `territory` | `collect_culture_range_hex_keys` | 0 | brak tematu: NIEPODPIETE-TERRITORY-WIRING | brak dopasowania |
| 773 | `rust-port/engine/src/domain/territory.rs:529` | `territory` | `collect_religion_range_hex_keys` | 0 | brak tematu: NIEPODPIETE-TERRITORY-WIRING | brak dopasowania |
| 774 | `rust-port/engine/src/domain/trade.rs:206` | `trade` | `from_tiles` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 775 | `rust-port/engine/src/domain/trade.rs:220` | `trade` | `with_dimensions` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 776 | `rust-port/engine/src/domain/trade.rs:934` | `trade` | `find_city_connection` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 777 | `rust-port/engine/src/domain/trade.rs:981` | `trade` | `find_city_connection_with_params` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 778 | `rust-port/engine/src/domain/trade.rs:1006` | `trade` | `create_trade_route` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 779 | `rust-port/engine/src/domain/trade.rs:1156` | `trade` | `refresh_trade_routes` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 780 | `rust-port/engine/src/domain/trade.rs:1449` | `trade` | `cities_have_trade_connection` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 781 | `rust-port/engine/src/domain/trade.rs:1491` | `trade` | `diagnose_missing_trade_route_for_partner` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 782 | `rust-port/engine/src/domain/trade.rs:1728` | `trade` | `compute_trade_route_income_by_city` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 783 | `rust-port/engine/src/domain/trade.rs:1957` | `trade` | `first_trade_route_resource_grant` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 784 | `rust-port/engine/src/domain/trade.rs:2018` | `trade` | `compute_trade_route_resource_flow` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 785 | `rust-port/engine/src/domain/trade.rs:2108` | `trade` | `diff_trade_routes` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 786 | `rust-port/engine/src/domain/trade.rs:2148` | `trade` | `load_trade_route_params` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 787 | `rust-port/engine/src/domain/trade.rs:2196` | `trade` | `load_trade_route_resource_flow_params` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 788 | `rust-port/engine/src/domain/trade.rs:2214` | `trade` | `tradeRouteId` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 789 | `rust-port/engine/src/domain/trade.rs:2219` | `trade` | `tradeRoutePairKey` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | handel |
| 790 | `rust-port/engine/src/domain/trade_flow_apply.rs:22` | `trade_flow_apply` | `apply_trade_route_resource_flows` | 0 | brak tematu: HANDEL-PRZEPLYW-WIRING | stosowanie przeplywu handlu |
| 791 | `rust-port/engine/src/domain/turn_economy.rs:51` | `turn_economy` | `with_resource` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 792 | `rust-port/engine/src/domain/turn_economy.rs:148` | `turn_economy` | `has_deficit` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 793 | `rust-port/engine/src/domain/turn_economy.rs:240` | `turn_economy` | `balances_mut` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 794 | `rust-port/engine/src/domain/turn_economy.rs:489` | `turn_economy` | `build_gold_deficit_params` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 795 | `rust-port/engine/src/domain/turn_economy.rs:577` | `turn_economy` | `is_gold_deficit` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 796 | `rust-port/engine/src/domain/turn_economy.rs:582` | `turn_economy` | `is_gold_deficit_starving` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 797 | `rust-port/engine/src/domain/turn_economy.rs:589` | `turn_economy` | `gold_deficit_countdown` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 798 | `rust-port/engine/src/domain/turn_economy.rs:598` | `turn_economy` | `last_gold_deficit_tick` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 799 | `rust-port/engine/src/domain/turn_economy.rs:1158` | `turn_economy` | `food_storage_capacity` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 800 | `rust-port/engine/src/domain/turn_economy.rs:1238` | `turn_economy` | `apply_food` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 801 | `rust-port/engine/src/domain/turn_economy.rs:1279` | `turn_economy` | `global_resource_capacity_per_type` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 802 | `rust-port/engine/src/domain/turn_economy.rs:1288` | `turn_economy` | `on_city_lost` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 803 | `rust-port/engine/src/domain/turn_economy.rs:1302` | `turn_economy` | `on_city_conquered` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 804 | `rust-port/engine/src/domain/turn_economy.rs:1414` | `turn_economy` | `owner_storage_params_for_era` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 805 | `rust-port/engine/src/domain/turn_economy.rs:1849` | `turn_economy` | `unit_recruit_upkeep_reserve` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 806 | `rust-port/engine/src/domain/turn_economy.rs:1898` | `turn_economy` | `can_afford_unit_recruit_full` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 807 | `rust-port/engine/src/domain/turn_economy.rs:1906` | `turn_economy` | `is_unit_recruit_stock_chip_missing` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 808 | `rust-port/engine/src/domain/turn_economy.rs:1917` | `turn_economy` | `pick_unit_recruit_hint` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 809 | `rust-port/engine/src/domain/turn_economy.rs:1948` | `turn_economy` | `preview_owner_total_resource_upkeep` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 810 | `rust-port/engine/src/domain/turn_economy.rs:2182` | `turn_economy` | `military_food_consumption` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 811 | `rust-port/engine/src/domain/turn_economy.rs:2228` | `turn_economy` | `building_upkeep_for_built_ids` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 812 | `rust-port/engine/src/domain/turn_economy_health.rs:177` | `turn_economy_health` | `city_has_water_access` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 813 | `rust-port/engine/src/domain/turn_economy_inputs_civ.rs:15` | `turn_economy_inputs_civ` | `build_owner_civ_map` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 814 | `rust-port/engine/src/domain/turn_economy_inputs_podzial.rs:38` | `turn_economy_inputs_podzial` | `init_owner_default_podzial_handlu` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 815 | `rust-port/engine/src/domain/turn_economy_inputs_podzial.rs:59` | `turn_economy_inputs_podzial` | `init_owner_default_podzial_pracy` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 816 | `rust-port/engine/src/domain/turn_economy_post.rs:72` | `turn_economy_post` | `run_gold_deficit_step` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 817 | `rust-port/engine/src/domain/turn_economy_post.rs:195` | `turn_economy_post` | `growth_inputs_from_order_lane` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 818 | `rust-port/engine/src/domain/turn_economy_post.rs:245` | `turn_economy_post` | `run_post_central_growth` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 819 | `rust-port/engine/src/domain/turn_economy_post.rs:394` | `turn_economy_post` | `apply_praca_upkeep_post` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 820 | `rust-port/engine/src/domain/turn_economy_post.rs:426` | `turn_economy_post` | `pop_cap_params_of` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 821 | `rust-port/engine/src/domain/turn_economy_preview.rs:59` | `turn_economy_preview` | `simulate_resource_pipeline_for_preview` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 822 | `rust-port/engine/src/domain/turn_economy_resources.rs:227` | `turn_economy_resources` | `run_converter` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 823 | `rust-port/engine/src/domain/turn_economy_upkeep.rs:236` | `turn_economy_upkeep` | `unit_rows_from_json_str` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 824 | `rust-port/engine/src/domain/turn_economy_wire.rs:135` | `turn_economy_wire` | `apply_treasury` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 825 | `rust-port/engine/src/domain/turn_economy_wire.rs:144` | `turn_economy_wire` | `apply_science` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 826 | `rust-port/engine/src/domain/turn_economy_wire.rs:234` | `turn_economy_wire` | `run_economy_tick_for_game` | 0 | brak tematu: TURN-ECONOMY-WIRING | tura ekonomii |
| 827 | `rust-port/engine/src/domain/turn_war_dipl_steps.rs:999` | `turn_war_dipl_steps` | `apply_dipl_deltas_to_state` | 0 | brak tematu: NIEPODPIETE-TURN_WAR_DIPL_STEPS-WIRING | brak dopasowania |
| 828 | `rust-port/engine/src/domain/turn_war_inputs.rs:150` | `turn_war_inputs` | `web_owner_id` | 0 | brak tematu: NIEPODPIETE-TURN_WAR_INPUTS-WIRING | brak dopasowania |
| 829 | `rust-port/engine/src/domain/turn_war_inputs.rs:155` | `turn_war_inputs` | `rust_owner_id` | 0 | brak tematu: NIEPODPIETE-TURN_WAR_INPUTS-WIRING | brak dopasowania |
| 830 | `rust-port/engine/src/domain/turn_war_inputs.rs:160` | `turn_war_inputs` | `start_epoch_number` | 0 | brak tematu: NIEPODPIETE-TURN_WAR_INPUTS-WIRING | brak dopasowania |
| 831 | `rust-port/engine/src/domain/types.rs:811` | `types` | `evaluate_order` | 0 | brak tematu: NIEPODPIETE-TYPES-WIRING | brak dopasowania |
| 832 | `rust-port/engine/src/domain/types.rs:873` | `types` | `happiness_breakdown` | 0 | brak tematu: NIEPODPIETE-TYPES-WIRING | brak dopasowania |
| 833 | `rust-port/engine/src/domain/unit_epoch.rs:109` | `unit_epoch` | `available_units` | 0 | brak tematu: NIEPODPIETE-UNIT_EPOCH-WIRING | brak dopasowania |
| 834 | `rust-port/engine/src/domain/unit_epoch.rs:196` | `unit_epoch` | `format_civ_entry_epoch_label` | 0 | brak tematu: NIEPODPIETE-UNIT_EPOCH-WIRING | brak dopasowania |
| 835 | `rust-port/engine/src/domain/unit_epoch.rs:213` | `unit_epoch` | `game_epoch_hud_label` | 0 | brak tematu: NIEPODPIETE-UNIT_EPOCH-WIRING | brak dopasowania |
| 836 | `rust-port/engine/src/domain/unit_health.rs:127` | `unit_health` | `unit_health_value` | 0 | brak tematu: NIEPODPIETE-UNIT_HEALTH-WIRING | brak dopasowania |
| 837 | `rust-port/engine/src/domain/unit_health.rs:219` | `unit_health` | `as_get_max_hp` | 0 | brak tematu: NIEPODPIETE-UNIT_HEALTH-WIRING | brak dopasowania |
| 838 | `rust-port/engine/src/domain/unit_power.rs:93` | `unit_power` | `ranged_shot_damage` | 0 | brak tematu: NIEPODPIETE-UNIT_POWER-WIRING | brak dopasowania |
| 839 | `rust-port/engine/src/domain/unit_replace.rs:50` | `unit_replace` | `ai_replace_keeps_army_class` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 840 | `rust-port/engine/src/domain/unit_replace.rs:64` | `unit_replace` | `unit_replace_full_cost` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 841 | `rust-port/engine/src/domain/unit_replace.rs:88` | `unit_replace` | `can_afford_unit_replace` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 842 | `rust-port/engine/src/domain/unit_replace.rs:100` | `unit_replace` | `merge_stock_paid` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 843 | `rust-port/engine/src/domain/unit_replace.rs:111` | `unit_replace` | `ai_unit_replace_cap` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 844 | `rust-port/engine/src/domain/unit_replace.rs:129` | `unit_replace` | `ai_unit_replace_max_fraction_from_params` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 845 | `rust-port/engine/src/domain/unit_replace.rs:142` | `unit_replace` | `ai_unit_replace_max_fraction_from_json` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 846 | `rust-port/engine/src/domain/unit_replace.rs:162` | `unit_replace` | `plan_ai_unit_replace_order` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 847 | `rust-port/engine/src/domain/unit_replace.rs:196` | `unit_replace` | `ai_replace_reserve_ok` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | brak dopasowania |
| 848 | `rust-port/engine/src/domain/unit_replace_defs.rs:237` | `unit_replace_defs` | `production_base_gold` | 0 | brak tematu: NIEPODPIETE-UNIT_REPLACE_DEFS-WIRING | brak dopasowania |
| 849 | `rust-port/engine/src/domain/war_all_in_capital.rs:46` | `war_all_in_capital` | `set_war_all_in_capital_override` | 0 | brak tematu: NIEPODPIETE-WAR_ALL_IN_CAPITAL-WIRING | brak dopasowania |
| 850 | `rust-port/engine/src/domain/war_all_in_capital.rs:56` | `war_all_in_capital` | `is_war_all_in_capital_enabled` | 0 | brak tematu: NIEPODPIETE-WAR_ALL_IN_CAPITAL-WIRING | brak dopasowania |
| 851 | `rust-port/engine/src/domain/war_all_in_capital.rs:87` | `war_all_in_capital` | `prefer_sea_reachable_war_targets` | 0 | brak tematu: NIEPODPIETE-WAR_ALL_IN_CAPITAL-WIRING | brak dopasowania |
| 852 | `rust-port/engine/src/domain/war_all_in_capital.rs:197` | `war_all_in_capital` | `nearest_target` | 0 | brak tematu: NIEPODPIETE-WAR_ALL_IN_CAPITAL-WIRING | brak dopasowania |
| 853 | `rust-port/engine/src/domain/war_all_in_capital.rs:217` | `war_all_in_capital` | `classify_war_target_routes` | 0 | brak tematu: NIEPODPIETE-WAR_ALL_IN_CAPITAL-WIRING | brak dopasowania |
| 854 | `rust-port/engine/src/domain/war_era_pool.rs:96` | `war_era_pool` | `is_player_era_war_slot_free` | 0 | brak tematu: NIEPODPIETE-WAR_ERA_POOL-WIRING | brak dopasowania |
| 855 | `rust-port/engine/src/domain/war_forced_bronze.rs:53` | `war_forced_bronze` | `pick_bronze_forced_war_target_id` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_BRONZE-WIRING | brak dopasowania |
| 856 | `rust-port/engine/src/domain/war_forced_bronze.rs:68` | `war_forced_bronze` | `serialize_bronze_forced_war_state` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_BRONZE-WIRING | brak dopasowania |
| 857 | `rust-port/engine/src/domain/war_forced_bronze.rs:73` | `war_forced_bronze` | `restore_bronze_forced_war_state` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_BRONZE-WIRING | brak dopasowania |
| 858 | `rust-port/engine/src/domain/war_forced_common.rs:64` | `war_forced_common` | `count_active_wars_excluding` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_COMMON-WIRING | brak dopasowania |
| 859 | `rust-port/engine/src/domain/war_forced_iron.rs:53` | `war_forced_iron` | `is_iron_era_entry` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_IRON-WIRING | brak dopasowania |
| 860 | `rust-port/engine/src/domain/war_forced_iron.rs:58` | `war_forced_iron` | `pick_iron_forced_war_target_id` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_IRON-WIRING | brak dopasowania |
| 861 | `rust-port/engine/src/domain/war_forced_iron.rs:73` | `war_forced_iron` | `serialize_iron_forced_war_state` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_IRON-WIRING | brak dopasowania |
| 862 | `rust-port/engine/src/domain/war_forced_iron.rs:78` | `war_forced_iron` | `restore_iron_forced_war_state` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_IRON-WIRING | brak dopasowania |
| 863 | `rust-port/engine/src/domain/war_forced_stone.rs:39` | `war_forced_stone` | `pick_stone_forced_war_target_id` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_STONE-WIRING | brak dopasowania |
| 864 | `rust-port/engine/src/domain/war_forced_waves.rs:403` | `war_forced_waves` | `prune_forced_war_waves` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_WAVES-WIRING | brak dopasowania |
| 865 | `rust-port/engine/src/domain/war_forced_waves.rs:460` | `war_forced_waves` | `empty_forced_war_wave_state` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_WAVES-WIRING | brak dopasowania |
| 866 | `rust-port/engine/src/domain/war_forced_waves.rs:469` | `war_forced_waves` | `serialize_forced_war_waves` | 0 | brak tematu: NIEPODPIETE-WAR_FORCED_WAVES-WIRING | brak dopasowania |
| 867 | `rust-port/engine/src/domain/war_home_defense.rs:205` | `war_home_defense` | `reset` | 0 | brak tematu: NIEPODPIETE-WAR_HOME_DEFENSE-WIRING | brak dopasowania |
| 868 | `rust-port/engine/src/domain/war_target_select.rs:147` | `war_target_select` | `nearest_war_city_target` | 0 | brak tematu: NIEPODPIETE-WAR_TARGET_SELECT-WIRING | brak dopasowania |
| 869 | `rust-port/engine/src/domain/war_turn_ai_ai.rs:35` | `war_turn_ai_ai` | `peace_allowed_for_turns` | 0 | brak tematu: NIEPODPIETE-WAR_TURN_AI_AI-WIRING | brak dopasowania |
| 870 | `rust-port/engine/src/domain/war_turn_ai_ai.rs:84` | `war_turn_ai_ai` | `run_ai_ai_peace_turn` | 0 | brak tematu: NIEPODPIETE-WAR_TURN_AI_AI-WIRING | brak dopasowania |
| 871 | `rust-port/engine/src/domain/war_turn_ai_ai.rs:168` | `war_turn_ai_ai` | `run_ai_ai_weariness_turn` | 0 | brak tematu: NIEPODPIETE-WAR_TURN_AI_AI-WIRING | brak dopasowania |
| 872 | `rust-port/engine/src/domain/war_turn_declare.rs:134` | `war_turn_declare` | `declare_from_assignments` | 0 | brak tematu: NIEPODPIETE-WAR_TURN_DECLARE-WIRING | brak dopasowania |
| 873 | `rust-port/engine/src/domain/war_turn_declare.rs:150` | `war_turn_declare` | `mark_era_enter_turn` | 0 | brak tematu: NIEPODPIETE-WAR_TURN_DECLARE-WIRING | brak dopasowania |
| 874 | `rust-port/engine/src/domain/war_turn_declare.rs:236` | `war_turn_declare` | `is_era_peace_blocked` | 0 | brak tematu: NIEPODPIETE-WAR_TURN_DECLARE-WIRING | brak dopasowania |
| 875 | `rust-port/engine/src/domain/war_turn_declare.rs:458` | `war_turn_declare` | `run_ai_purchase_commands` | 0 | brak tematu: NIEPODPIETE-WAR_TURN_DECLARE-WIRING | brak dopasowania |
| 876 | `rust-port/engine/src/domain/war_turn_forced.rs:231` | `war_turn_forced` | `forced_war_step` | 0 | #120 CRED-HAK-WYPOWIEDZENIE | wymuszone wojny (declare_forced_wars) |
| 877 | `rust-port/engine/src/domain/war_world_view.rs:230` | `war_world_view` | `siege_units` | 0 | brak tematu: NIEPODPIETE-WAR_WORLD_VIEW-WIRING | brak dopasowania |
| 878 | `rust-port/engine/src/domain/war_world_view.rs:242` | `war_world_view` | `enter_cities` | 0 | brak tematu: NIEPODPIETE-WAR_WORLD_VIEW-WIRING | brak dopasowania |
| 879 | `rust-port/engine/src/domain/war_world_view.rs:258` | `war_world_view` | `forced_war_neighbors` | 0 | brak tematu: NIEPODPIETE-WAR_WORLD_VIEW-WIRING | brak dopasowania |
| 880 | `rust-port/engine/src/domain/wonder_placement.rs:104` | `wonder_placement` | `list_qualifying_wonder_hexes_for_owner` | 0 | brak tematu: CUDA-PLACEMENT-WIRING | nazwa modulu (heurystyka) |
| 881 | `rust-port/engine/src/domain/wonder_placement.rs:132` | `wonder_placement` | `pick_wonder_hex_for_city` | 0 | brak tematu: CUDA-PLACEMENT-WIRING | nazwa modulu (heurystyka) |
| 882 | `rust-port/engine/src/domain/work_tax.rs:68` | `work_tax` | `owner_can_convert_work_to_tax` | 0 | brak tematu: PODATEK-PRACY-WIRING | nazwa modulu (heurystyka) |
| 883 | `rust-port/engine/src/domain/work_tax.rs:86` | `work_tax` | `serialize_pending_work_tax` | 0 | brak tematu: PODATEK-PRACY-WIRING | nazwa modulu (heurystyka) |
| 884 | `rust-port/engine/src/domain/work_tax.rs:98` | `work_tax` | `restore_pending_work_tax` | 0 | brak tematu: PODATEK-PRACY-WIRING | nazwa modulu (heurystyka) |
| 885 | `rust-port/engine/src/domain/work_tax.rs:170` | `work_tax` | `execute_manual_work_tax_conversion` | 0 | brak tematu: PODATEK-PRACY-WIRING | nazwa modulu (heurystyka) |
| 886 | `rust-port/engine/src/domain/zapis_loader.rs:43` | `zapis_loader` | `load_save_snapshot` | 0 | brak tematu: ZAPIS-LOADER-WIRING | loader zapisu |

## 4. Rozkład tematów (propozycja, liczba pozycji funkcji)

| TEMAT | Funkcje |
|---|---|
| brak tematu: MAPGEN-WIRING | 142 |
| #120 CRED-HAK-WYPOWIEDZENIE | 72 |
| brak tematu: NIEPODPIETE-STATE-WIRING | 60 |
| brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | 38 |
| brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | 38 |
| brak tematu: TURN-ECONOMY-WIRING | 36 |
| #113 K5LOOP-WIRING | 35 |
| brak tematu: NIEPODPIETE-PATHFINDING-WIRING | 27 |
| brak tematu: AI-WIRING-PRZEGLAD | 26 |
| #106 R7K7C-WIRING | 21 |
| brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | 20 |
| brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | 19 |
| brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | 19 |
| brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | 19 |
| brak tematu: NIEPODPIETE-PLAYER-WIRING | 17 |
| brak tematu: HANDEL-PRZEPLYW-WIRING | 17 |
| brak tematu: ARMIA-WIRING | 15 |
| brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | 13 |
| brak tematu: REPLAY-WIRING | 13 |
| brak tematu: NIEPODPIETE-BARBARIANS-WIRING | 12 |
| brak tematu: NIEPODPIETE-COMBAT-WIRING | 11 |
| brak tematu: NIEPODPIETE-PLAYABLE-WIRING | 10 |
| brak tematu: GENERAL-FOLLOW-WIRING | 9 |
| brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | 9 |
| brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | 8 |
| brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | 8 |
| brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | 8 |
| brak tematu: NIEPODPIETE-EVENTS-WIRING | 7 |
| brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | 7 |
| brak tematu: NIEPODPIETE-TERRAIN-WIRING | 7 |
| #97 K5-LOOP-AUTO | 6 |
| #98 K5-LOOP-WYLOM | 6 |
| brak tematu: NIEPODPIETE-CREDIBILITY-WIRING | 5 |
| brak tematu: NIEPODPIETE-ECONOMY_YIELD-WIRING | 5 |
| brak tematu: NIEPODPIETE-FORT_TERRITORY-WIRING | 5 |
| brak tematu: NIEPODPIETE-RESOURCE_ACCESS-WIRING | 5 |
| #115 ZDOBYCIE-MIASTA-WIRING | 5 |
| brak tematu: NIEPODPIETE-WAR_ALL_IN_CAPITAL-WIRING | 5 |
| brak tematu: NIEPODPIETE-BRAKE_POWER_REST-WIRING | 4 |
| brak tematu: NIEPODPIETE-ECONOMY_CITY_FNS-WIRING | 4 |
| brak tematu: FORMACJE-WIRING | 4 |
| brak tematu: NIEPODPIETE-TERRITORY-WIRING | 4 |
| brak tematu: NIEPODPIETE-WAR_FORCED_IRON-WIRING | 4 |
| brak tematu: NIEPODPIETE-WAR_TURN_DECLARE-WIRING | 4 |
| brak tematu: PODATEK-PRACY-WIRING | 4 |
| brak tematu: NIEPODPIETE-GENERALS-WIRING | 3 |
| brak tematu: SNAPSHOT-MAPY-WIRING (lub #119 indeks) | 3 |
| brak tematu: NIEPODPIETE-RESOURCE_ACCESS-ACTIVE_ACCESS-WIRING | 3 |
| brak tematu: NIEPODPIETE-SOCIETY_BREAKDOWN-ORDER-WIRING | 3 |
| brak tematu: NIEPODPIETE-START_POSITION-WIRING | 3 |
| brak tematu: NIEPODPIETE-TURN_WAR_INPUTS-WIRING | 3 |
| brak tematu: NIEPODPIETE-UNIT_EPOCH-WIRING | 3 |
| brak tematu: NIEPODPIETE-WAR_FORCED_BRONZE-WIRING | 3 |
| brak tematu: NIEPODPIETE-WAR_FORCED_WAVES-WIRING | 3 |
| brak tematu: NIEPODPIETE-WAR_TURN_AI_AI-WIRING | 3 |
| brak tematu: NIEPODPIETE-WAR_WORLD_VIEW-WIRING | 3 |
| brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-WIRING | 2 |
| brak tematu: NIEPODPIETE-BRAKE_INPUTS-WIRING | 2 |
| brak tematu: NIEPODPIETE-CITY_NAMES-WIRING | 2 |
| brak tematu: EKONOMIA-TEREN-WIRING | 2 |
| brak tematu: NIEPODPIETE-MAP_GENERATOR-WIRING | 2 |
| brak tematu: NIEPODPIETE-OKOLICA-MANUAL-WIRING | 2 |
| brak tematu: NIEPODPIETE-OKOLICA-SASIEDZTWO-WIRING | 2 |
| brak tematu: NIEPODPIETE-RESOURCE_PRODUCTION-WIRING | 2 |
| brak tematu: DROGI-WIRING | 2 |
| brak tematu: NIEPODPIETE-TYPES-WIRING | 2 |
| brak tematu: NIEPODPIETE-UNIT_HEALTH-WIRING | 2 |
| brak tematu: CUDA-PLACEMENT-WIRING | 2 |
| brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-AUTO_BUILD_GATE-WIRING | 1 |
| brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-PICK-WIRING | 1 |
| brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-RELIEF_PRESERVING-WIRING | 1 |
| brak tematu: TRYB-BITWY-WIRING | 1 |
| brak tematu: NIEPODPIETE-BRAKE_POWER_IMPROVEMENTS-WIRING | 1 |
| brak tematu: NIEPODPIETE-BRAKE_POWER_PRODUCERS-WIRING | 1 |
| brak tematu: NIEPODPIETE-RNG-WIRING | 1 |
| brak tematu: NIEPODPIETE-TURN_WAR_DIPL_STEPS-WIRING | 1 |
| brak tematu: NIEPODPIETE-UNIT_POWER-WIRING | 1 |
| brak tematu: NIEPODPIETE-UNIT_REPLACE_DEFS-WIRING | 1 |
| brak tematu: NIEPODPIETE-WAR_ERA_POOL-WIRING | 1 |
| brak tematu: NIEPODPIETE-WAR_FORCED_COMMON-WIRING | 1 |
| brak tematu: NIEPODPIETE-WAR_FORCED_STONE-WIRING | 1 |
| brak tematu: NIEPODPIETE-WAR_HOME_DEFENSE-WIRING | 1 |
| brak tematu: NIEPODPIETE-WAR_TARGET_SELECT-WIRING | 1 |
| brak tematu: ZAPIS-LOADER-WIRING | 1 |

Suma wierszy: `886` (= liczba wierszy `FN` w TSV).

## 5. Kolejność zależności (propozycja, NIE_ZMIERZONO w pełnym grafie)

**Zmierzone:** krawędzie między pozycjami tabeli §3 = **0**. Dowód: pozycja jest na liście tylko wtedy, gdy jej nazwa nie występuje jako token w żadnej linii korpusu poza definicją; gdyby ciało pozycji A wołało pozycję B, nazwa B miałaby licznik > 0 i B nie trafiłaby na listę. Zależności między zero-wołającymi pozycjami więc NIE wynikają z korpusu wywołań; kolejność jest ustalana względem funkcji już wołanych (NIE_ZMIERZONO w pełnym grafie, bo nie liczono zależności od funkcji prywatnych ani pub(crate)).

Propozycja fal (HIPOTEZA, nie zweryfikowana w kodzie; oparta na nazwach tematów z listy #96–#140, nie na AUDYT-PARYTETU-RANO §4 — tam nie zweryfikowano):

1. Fala 1 (dyplomacja i zasoby): #104 ZLOZA-WIRING, #106 R7K7C-WIRING, #120 CRED-HAK-WYPOWIEDZENIE — hipoteza: tematy wojny/dyplomacji są wołane przez resztę tury.
2. Fala 2 (oblężenie, pętla): #97 K5-LOOP-AUTO, #98 K5-LOOP-WYLOM, #116 TOWER-TARGET, potem #109 / #107 / #108 / #112 (kontrakty pętli), wreszcie #113 K5LOOP-WIRING jako finał pętli.
3. Fala 3 (zdobycie i eliminacja): #115 ZDOBYCIE-MIASTA-WIRING po fali 2 (hipoteza: przejęcie korzysta z pętli bitwy), #114 ELIMINACJA-GRACZA po #115.
4. Fala 4 (ekonomia, mapgen, reszta): tematy `brak tematu` — kolejność NIE_ZMIERZONA.

Poza kolejnością: **#119 NIEPODPIETE-MODULY-INDEKS nie jest krokiem wpięcia** — to ten dokument (indeks). Usunięty z fal. Aktualizacja indeksu po każdej fali to osobna czynność, nie wpięcie funkcji.

## 6. Brak tematu — propozycje nazw

Pozycje z `brak tematu:` wymagają decyzji właściciela, czy powstają nowe tematy (dispatch: „brak tematu z propozycją nazwy”). Nie są przypisane do istniejących zadań #96–#140. Tabela: propozycja nazwy, liczba funkcji i moduły, które ją generują.

| Propozycja nazwy | Funkcje | Moduły |
|---|---|---|
| brak tematu: MAPGEN-WIRING | 142 | `mapgen/cluster_compute`, `mapgen/cluster_layout`, `mapgen/cluster_mass`, `mapgen/cluster_rivals`, `mapgen/landsea`, `mapgen/masks`, `mapgen/params`, `mapgen/prims`, `mapgen/relief`, `mapgen/rivers_a`, `mapgen/rivers_a/grow`, `mapgen/rivers_a/profile`, `mapgen/rivers_b/edges`, `mapgen/rivers_b/extend`, `mapgen/rivers_b/quotas`, `mapgen/rivers_b/sources`, `mapgen/rivers_b/trace`, `mapgen/rivers_b/trace_coast`, `mapgen/terrain_class` |
| brak tematu: NIEPODPIETE-STATE-WIRING | 60 | `state` |
| brak tematu: NIEPODPIETE-PRODUCTION_UNITS-WIRING | 38 | `production_units` |
| brak tematu: NIEPODPIETE-RECRUITMENT-WIRING | 38 | `recruitment` |
| brak tematu: TURN-ECONOMY-WIRING | 36 | `turn_economy`, `turn_economy_health`, `turn_economy_inputs_civ`, `turn_economy_inputs_podzial`, `turn_economy_post`, `turn_economy_preview`, `turn_economy_resources`, `turn_economy_upkeep`, `turn_economy_wire` |
| brak tematu: NIEPODPIETE-PATHFINDING-WIRING | 27 | `pathfinding` |
| brak tematu: AI-WIRING-PRZEGLAD | 26 | `ai_era_unit_promotion`, `ai_general_war_campaign`, `ai_move_range`, `ai_peace_city_offer`, `ai_turn`, `ai_war_march_plan`, `ai_zakup_jednostki` |
| brak tematu: NIEPODPIETE-IMPROVEMENT_BUILD-WIRING | 20 | `improvement_build` |
| brak tematu: NIEPODPIETE-BUILDING_COSTS-WIRING | 19 | `building_costs` |
| brak tematu: NIEPODPIETE-CITY_GROWTH-WIRING | 19 | `city_growth` |
| brak tematu: NIEPODPIETE-CIV_MATRIX-WIRING | 19 | `civ_matrix` |
| brak tematu: NIEPODPIETE-PLAYER-WIRING | 17 | `player` |
| brak tematu: HANDEL-PRZEPLYW-WIRING | 17 | `trade`, `trade_flow_apply` |
| brak tematu: ARMIA-WIRING | 15 | `army_consolidation`, `army_follow_auto_merge`, `army_leadership` |
| brak tematu: NIEPODPIETE-IMPROVEMENTS-WIRING | 13 | `improvements` |
| brak tematu: REPLAY-WIRING | 13 | `replay` |
| brak tematu: NIEPODPIETE-BARBARIANS-WIRING | 12 | `barbarians` |
| brak tematu: NIEPODPIETE-COMBAT-WIRING | 11 | `combat` |
| brak tematu: NIEPODPIETE-PLAYABLE-WIRING | 10 | `playable` |
| brak tematu: GENERAL-FOLLOW-WIRING | 9 | `general_quick_follow` |
| brak tematu: NIEPODPIETE-UNIT_REPLACE-WIRING | 9 | `unit_replace` |
| brak tematu: NIEPODPIETE-CIV_BONUSES-WIRING | 8 | `civ_bonuses` |
| brak tematu: NIEPODPIETE-CIV_NAMES-WIRING | 8 | `civ_names` |
| brak tematu: NIEPODPIETE-SAVE_LOAD-WIRING | 8 | `save_load` |
| brak tematu: NIEPODPIETE-EVENTS-WIRING | 7 | `events` |
| brak tematu: NIEPODPIETE-PRODUCTION_QUEUE-WIRING | 7 | `production_queue` |
| brak tematu: NIEPODPIETE-TERRAIN-WIRING | 7 | `terrain` |
| brak tematu: NIEPODPIETE-CREDIBILITY-WIRING | 5 | `credibility` |
| brak tematu: NIEPODPIETE-ECONOMY_YIELD-WIRING | 5 | `economy_yield` |
| brak tematu: NIEPODPIETE-FORT_TERRITORY-WIRING | 5 | `fort_territory` |
| brak tematu: NIEPODPIETE-RESOURCE_ACCESS-WIRING | 5 | `resource_access` |
| brak tematu: NIEPODPIETE-WAR_ALL_IN_CAPITAL-WIRING | 5 | `war_all_in_capital` |
| brak tematu: NIEPODPIETE-BRAKE_POWER_REST-WIRING | 4 | `brake_power_rest` |
| brak tematu: NIEPODPIETE-ECONOMY_CITY_FNS-WIRING | 4 | `economy_city_fns` |
| brak tematu: FORMACJE-WIRING | 4 | `formation_rules` |
| brak tematu: NIEPODPIETE-TERRITORY-WIRING | 4 | `territory` |
| brak tematu: NIEPODPIETE-WAR_FORCED_IRON-WIRING | 4 | `war_forced_iron` |
| brak tematu: NIEPODPIETE-WAR_TURN_DECLARE-WIRING | 4 | `war_turn_declare` |
| brak tematu: PODATEK-PRACY-WIRING | 4 | `work_tax` |
| brak tematu: NIEPODPIETE-GENERALS-WIRING | 3 | `generals` |
| brak tematu: SNAPSHOT-MAPY-WIRING (lub #119 indeks) | 3 | `map_snapshot` |
| brak tematu: NIEPODPIETE-RESOURCE_ACCESS-ACTIVE_ACCESS-WIRING | 3 | `resource_access/active_access` |
| brak tematu: NIEPODPIETE-SOCIETY_BREAKDOWN-ORDER-WIRING | 3 | `society_breakdown/order` |
| brak tematu: NIEPODPIETE-START_POSITION-WIRING | 3 | `start_position` |
| brak tematu: NIEPODPIETE-TURN_WAR_INPUTS-WIRING | 3 | `turn_war_inputs` |
| brak tematu: NIEPODPIETE-UNIT_EPOCH-WIRING | 3 | `unit_epoch` |
| brak tematu: NIEPODPIETE-WAR_FORCED_BRONZE-WIRING | 3 | `war_forced_bronze` |
| brak tematu: NIEPODPIETE-WAR_FORCED_WAVES-WIRING | 3 | `war_forced_waves` |
| brak tematu: NIEPODPIETE-WAR_TURN_AI_AI-WIRING | 3 | `war_turn_ai_ai` |
| brak tematu: NIEPODPIETE-WAR_WORLD_VIEW-WIRING | 3 | `war_world_view` |
| brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-WIRING | 2 | `auto_improvements` |
| brak tematu: NIEPODPIETE-BRAKE_INPUTS-WIRING | 2 | `brake_inputs` |
| brak tematu: NIEPODPIETE-CITY_NAMES-WIRING | 2 | `city_names` |
| brak tematu: EKONOMIA-TEREN-WIRING | 2 | `economy_city_terrain` |
| brak tematu: NIEPODPIETE-MAP_GENERATOR-WIRING | 2 | `map_generator` |
| brak tematu: NIEPODPIETE-OKOLICA-MANUAL-WIRING | 2 | `okolica/manual` |
| brak tematu: NIEPODPIETE-OKOLICA-SASIEDZTWO-WIRING | 2 | `okolica/sasiedztwo` |
| brak tematu: NIEPODPIETE-RESOURCE_PRODUCTION-WIRING | 2 | `resource_production` |
| brak tematu: DROGI-WIRING | 2 | `roads` |
| brak tematu: NIEPODPIETE-TYPES-WIRING | 2 | `types` |
| brak tematu: NIEPODPIETE-UNIT_HEALTH-WIRING | 2 | `unit_health` |
| brak tematu: CUDA-PLACEMENT-WIRING | 2 | `wonder_placement` |
| brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-AUTO_BUILD_GATE-WIRING | 1 | `auto_improvements/auto_build_gate` |
| brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-PICK-WIRING | 1 | `auto_improvements/pick` |
| brak tematu: NIEPODPIETE-AUTO_IMPROVEMENTS-RELIEF_PRESERVING-WIRING | 1 | `auto_improvements/relief_preserving` |
| brak tematu: TRYB-BITWY-WIRING | 1 | `battle_mode` |
| brak tematu: NIEPODPIETE-BRAKE_POWER_IMPROVEMENTS-WIRING | 1 | `brake_power_improvements` |
| brak tematu: NIEPODPIETE-BRAKE_POWER_PRODUCERS-WIRING | 1 | `brake_power_producers` |
| brak tematu: NIEPODPIETE-RNG-WIRING | 1 | `rng` |
| brak tematu: NIEPODPIETE-TURN_WAR_DIPL_STEPS-WIRING | 1 | `turn_war_dipl_steps` |
| brak tematu: NIEPODPIETE-UNIT_POWER-WIRING | 1 | `unit_power` |
| brak tematu: NIEPODPIETE-UNIT_REPLACE_DEFS-WIRING | 1 | `unit_replace_defs` |
| brak tematu: NIEPODPIETE-WAR_ERA_POOL-WIRING | 1 | `war_era_pool` |
| brak tematu: NIEPODPIETE-WAR_FORCED_COMMON-WIRING | 1 | `war_forced_common` |
| brak tematu: NIEPODPIETE-WAR_FORCED_STONE-WIRING | 1 | `war_forced_stone` |
| brak tematu: NIEPODPIETE-WAR_HOME_DEFENSE-WIRING | 1 | `war_home_defense` |
| brak tematu: NIEPODPIETE-WAR_TARGET_SELECT-WIRING | 1 | `war_target_select` |
| brak tematu: ZAPIS-LOADER-WIRING | 1 | `zapis_loader` |

Liczba propozycji „brak tematu” (różne nazwy): 78.

## 7. Czego nie zrobiono (NIE_ZMIERZONO)

- Korpus skryptu obejmuje wszystkie `*.rs` pod `rust-port/` bez `tests/`, `benches/`, `target/` (czyli także `src/bin` i `build.rs`, jeśli są). NIE_ZMIERZONO: wołania z makr (`macro_rules!`), ścieżki budowane z tekstu, FFI i serde (nazwy w JSON).
- Liczenie po nazwie: nie wiadomo, ile pozycji z §3 jest błędnie zerowych (wołanie z innego typu o tej samej nazwie zawyżałoby licznik, więc takie pozycje wypadłyby z listy). Miary: liczba nazw `pub fn` definiowanych w domain więcej niż raz (ryzyko, bez liczby błędów): NIE_ZMIERZONO w pełni; patrz §8.
- Komentarze i bloki `#[cfg(test)]` są usuwane z korpusu przez skrypt; `git grep` (§8) ich nie usuwa i to rozdziela oba pomiary.
- Rozbieżność komentarz vs kod: patrz §8, punkt 3.
- Nie sprawdzono, czy funkcje zero-wołające są wołane z renderera przez FFI/serde (korpus obejmuje `rust-port/renderer`, ale nie analizowano typów).
- Nie uruchamiano `cargo` (dispatch: temat dokumentacyjny).
- Nie zweryfikowano, czy zadania #96–#140 są nadal `pending` (stan z listy zadań sesji, poza repo).

## 8. Weryfikacja niezależną metodą (git grep) i rozbieżności

Dispatch wymagał `git grep`; skrypt python jest drugą metodą. Wyniki są w `dowody/verify-git-grep.tsv` i `dowody/verify-classify.txt`.

1. `bash dowody/verify-git-grep.sh dowody/niepodpiete-surowe.tsv dowody/verify-git-grep.tsv` — nazw unikalnych wśród wierszy FN: **873** (886 wierszy, bo jedna nazwa bywa w kilku plikach); **744** nazw ma 0 linii git grep po wykluczeniu definicji `fn` i `use` (potwierdzone wprost, bez skryptu); **129** nazw ma >0 linii.
2. `python3 -I dowody/verify-classify.py dowody/verify-git-grep.tsv` — klasy 129 nazw z trafieniami: komentarz 109; komentarz + kod 13; kod 5; dane (JSON, poza .rs) 1; dane + komentarz 1. Trafienia „kod” leżą w blokach `#[cfg(test)]` albo w testach w `src/`, skrypt je pomija zgodnie z definicją „produkcyjny wołający”. Przykład ręcznie: `rust-port/engine/src/domain/war_turn_ai_ai.rs:196-198` (`peace_allowed_for_turns`) to asercje w testach. Klasyfikacja jest heurystyczna (linie `kod` nie są każda sprawdzona ręcznie): wskazuje, że 129 nazw z trafieniami ma je w komentarzach, danych lub testach, a skrypt je zgodnie z definicją pomija. NIE_ZMIERZONO: wołania przez makro lub FFI.
3. **Rozbieżność komentarz vs kod:** `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs:726` (DEPRECATED przy `run_ai_ai_peace_tick`) pisze, że „produkcja (`war_turn_ai_ai::run_ai_ai_peace_turn`) i testy korzystają” z V2. Git grep: `run_ai_ai_peace_turn` ma definicję w `war_turn_ai_ai.rs:84`, wzmianki w dokumentacji modułu (`war_turn_ai_ai.rs:10`) i wołania wyłącznie w `rust-port/engine/tests/p6_wire_war_siege_aiai*.rs`. Produkcyjnego wołającego nie ma; funkcja jest w tabeli §3. Komentarz w linii 726 jest niezgodny z kodem. Nie zmieniono kodu Rust (poza allowlistą); naprawa komentarza to osobna pozycja.
4. Ryzyko liczenia po nazwie (zawyżanie listy w kierunku bezpiecznym, pomijanie pozycji nie): w `domain` nazw `pub fn` definiowanych więcej niż raz jest **146**, obejmują **532** definicje (git grep, bez wykluczenia `cfg(test)`; liczba 3255 definicji jest ta sama co w skrypcie). **Ile pozycji z §3 jest błędnie zerowych przez nazwę: NIE_ZMIERZONO** — wymagałoby rozróżnienia typów (np. metody `.new()`), czego metoda nie robi.
