STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-STORES-Q1
GOAL: magazyny infra/tech/religia w PlayableState + producenci POWER-REST w power_raw_for_owner; odblokowany advance_turn z AI z miastami (W8 r6 klocek 3)
ZMIANY/COMMIT: kod 434796d6b20dff08ffc26ae3b5e26a61d32ec86f na gałęzi rust-port-wip/WIRE-WAR-STORES-r4-op; baza d11c995e6 (zgodnie z DODATKIEM r2; NIE parity-v2). Pliki: domain/{playable.rs, turn_war_inputs.rs, mod.rs}; tests/{p6_wire_war_stores.rs (nowy), p6_wire_war_stores_vectors/save_pre_stores.json (nowy), p6_wire_war_inputs.rs, p6_wire_war_epoch.rs, p6_wire_war_pop.rs (adaptacja oczekiwań)}. Cargo.lock nie commitowany; brak zmian w gra/, WERSJE.md, Cargo.toml.
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib 51/51; testy bramkowe (p6_wire_war_stores 7, pipeline 7, inputs 14, diplo 13, epoch 9, pop 9, p6_brake_inputs 10, p6_power_nozeros 9, p6_power_rest 9, playable_slice 7) wszystkie ok. Pełny cargo test --no-fail-fast (nohup, log /tmp/claude-0/stores-full.log): NIE UKOŃCZONY — ~390 binariów testowych, kompilacja i uruchomienie trwały > 1,5 h przy obciążeniu 4 vCPU współdzielonych z innymi workflow; przerwany po 109 binariach, wszystkie `ok`, 0 FAILED (kolejnosc alfabetyczna; p6_wire_war_* i playable_slice uruchomione osobno, patrz wyżej). Pozostałe binaria: NIE_ZMIERZONO — zmiana dotyka tylko PlayableState (jedyny literał w playable.rs) i power_raw_for_owner, kompilacja wszystkich celów (cargo check/clippy --all-targets) przeszła bez błędów. Evaluator/FC proszeni o pełny przebieg.
BLOKADY: brak
RUNDY: 4/5 (numer wg zadania workflow; dispatch zawiera DODATEK do r2)
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO

## Co zrobiono

1. Sprawdzenie grepem: żaden moduł Rust (domain/) nie niósł budynków per miasto, badań per właściciel ani stanu religii miast (cityBuilt/aiResearchDone/cityRelig) — magazyny musiały powstać. Religia PAŃSTWOWA właściciela NIE jest magazynem: web `ownerReligionForOwnerId` (main.ts:5535) = religia cywilizacji (civs.json), więc jest ODCZYTYWANA z `players[].civilization` przez istniejące `civ_religion_for_key`, bez duplikacji.
2. `PlayableStores` (nowy typ, `PlayableState.stores`, `#[serde(default, skip_serializing_if = "PlayableStores::is_default")]`): `buildings_by_city: BTreeMap<u64, Vec<String>>` (web cityBuilt), `researched_techs_by_owner: BTreeMap<u64, BTreeSet<String>>` (ownerResearchedTechs / aiResearchDone), `religion_by_city: BTreeMap<u64, BTreeMap<String,u32>>` (cityRelig). Pole dodane na poziomie PlayableState (nie PlayableCity), żeby nie łamać literałów PlayableCity w testach poza allowlistą.
3. Zgodność zapisu: WYŁĄCZNIE `#[serde(default)]`, bez migracji. Test `pre_stores_save_loads_with_default_stores` na fixture `save_pre_stores.json` (stan wygenerowany przed dodaniem pola, bez klucza `stores`): ładuje się, stores = default, ponowna serializacja jest równa fixture (pusty magazyn nie trafia do zapisu).
4. Producenci w `power_raw_for_owner`: `budynki` = `count_buildings_for_owner` (id miasta + właściciel z `state.cities`), `tech_zbadane` = `count_tech_for_owner` (człowiek: rozmiar zbioru właściciela; AI: rozmiar wpisu, brak = 0), `miasta_jednosc_religii` = `count_cities_with_dominant_state_religion` z `resolve_city_religion_state(zapisany stan | brak, populacja, religia cywilizacji)` i progiem z `load_religion_params(society-params, Difficulty::Normal)`. Właściciel bez miast => 0 bez wymagania wpisu w `players` (zachowanie sprzed zmiany).
5. `UNPRODUCED_POWER_COMPONENTS` = `[]` (było infra, tech, religia). KNOWN_GAPS[3] przepisany (liczba wpisów nadal 5).
6. Brak cichych zer: puste magazyny budynków i badań = `Provided(0)` UDOKUMENTOWANE w doc `PlayableStores` i KNOWN_GAPS jako realny stan pusty (stan nie symuluje budowy ani badań); religia dla miasta bez wpisu = domyślny stan z cywilizacji (wartość 1 przy cywilizacji z religią i populacji 1).

## Zamiany oczekiwań w istniejących testach (kryterium 4; bez osłabień asercji p6_wire_war_*/p6_power_*)

- `domain::playable::war_pipeline_advance_tests::advance_turn_with_ai_city_fails_explicitly_...` => `advance_turn_with_ai_city_passes_three_turns_after_stores` (oczekiwany `WarTurn("... infra")` => 3 tury Ok, numery 2..=4).
- p6_wire_war_epoch: `next_blocker_is_power_components_missing_reported_explicitly` => `power_components_no_longer_block_after_stores` (Err PowerComponentsMissing => Ok).
- p6_wire_war_inputs: `production_power_inputs_mark_unproduced_components_missing_not_zero` => `..._have_producers_for_all_stored_components` (Missing => Provided(0)/Provided(0)/Provided(1); STRICT expect_err => Ok); `production_path_fails_with_explicit_blockers_...` => `production_path_passes_for_ai_with_cities_after_stores`.
- p6_wire_war_pop: `components_without_state_data_stay_missing_not_zero` => `stored_components_are_provided_after_stores`; `war_turn_with_ai_cities_is_blocked_only_by_infra_tech_religia` => `war_turn_with_ai_cities_passes_strict_after_stores`; usunięty nieużywany import WarTurnError (też w epoch).
- Pozostałe asercje (explicit zero, pin file:line, KNOWN_GAPS.len()==5, terytorium, ludki, kultura) bez zmian.

## Kryteria binarne

1. Zapis sprzed zmiany ładuje się: SPEŁNIONE (test + fixture).
2. Producenci podłączeni, brak cichych zer: SPEŁNIONE (powyżej).
3. 3 tury advance_turn z AI z miastami: SPEŁNIONE (lib test) oraz `three_war_turns_with_ai_cities_pass_strict` (3x run_war_turn na tym samym WarTurnState). Następnego blokera nie stwierdzono w tej ścieżce.
4. Bez osłabień: SPEŁNIONE (lista wyżej).
5. Bramki: patrz TESTY.

## Znane luki / NIE_ZMIERZONO

- Magazyny nie rosną między turami (brak Economy/badań) — jawna luka; w produkcji są puste (budynki 0, tech 0).
- Trudność w religii = `Difficulty::Normal` (StartGameParams ma `difficulty:NOT_IMPLEMENTED`); web używa `_menuDifficulty`. NIE_ZMIERZONO zgodność dla Easy/Hard.
- Czy web przy zakładaniu stolicy/startu AI zasila `aiResearchDone` technologiami startowymi: NIE_ZMIERZONO (produkcyjnie 0).
- Forty/posterunki w terytorium i populacja/kultura bez wzrostu: bez zmian (decyzje (a), (b) dispatchu).
- Test 3 tur przez `advance_turn` jest w lib (pole `state` PlayableGame jest prywatne; miasto AI dodane bezpośrednio w module testowym).
