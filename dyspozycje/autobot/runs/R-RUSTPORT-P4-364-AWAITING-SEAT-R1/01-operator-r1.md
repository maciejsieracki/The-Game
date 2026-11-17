# R-RUSTPORT-P4-364-AWAITING-SEAT-R1 — Operator r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-AWAITING-SEAT-R1
GOAL: `awaiting_first_city(state, owner)` odpowiada webowi (`isAwaitingFirstPlayerCity(ownerId)`) dla KAZDEGO fotela; stan per wlasciciel w `PlayableState`.
ZMIANY/COMMIT: gałąź `rust-port-wip/p4-364-awaiting-seat-r1`, baza `326fd5545`; commit: patrz `git log` gałęzi (SHA podany w wyniku Operatora dla orkiestratora). Pliki: `rust-port/engine/src/domain/playable.rs`, `rust-port/engine/src/domain/overlays_view.rs`, `rust-port/engine/src/domain/dto_bridge.rs` (tylko komentarz D-BR-1), `rust-port/engine/tests/p4_364_awaiting_seat.rs` (nowy), ten raport.
TESTY: patrz §Bramki.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## Pin (`07d2fbd72`)
- `gra/src/main.ts:3042` `let playerEverOwnedCityByOwner: Set<number> = new Set<number>();`
- `:12882-12884` `function isAwaitingFirstPlayerCity(ownerId: number = ME()): boolean { return computeAwaitingFirstPlayerCity(playerEverOwnedCityByOwner.has(ownerId), cities, ownerId); }`
- zapis `add`: `:16508` (założenie, `ME()`), `:17816` (kapitulacja, `newOwner`), `:36218` (zdobycie, `atkOwner`), `:45645-45646` i `:45877-45878` (nowa gra: `clear()` + `HUMAN_OWNER_PRIMARY`), `:46368-46370` (wczytanie: `clear()` + fotele `saved.humanOwnerIds` z miastem).
- odczyt fotela głównego: `:34022`, `:43472` `graczKiedysMialMiasto: playerEverOwnedCityByOwner.has(HUMAN_OWNER_PRIMARY)`.
- `:13074-13080` `startRevealKeysForRiverFog()`: `if (!isAwaitingFirstPlayerCity() || meStartHex === null) return undefined;`.
- Pin NIE zapisuje zbioru (odtwarza go przy wczytaniu, `:46368-46370`).

## Zmiany
1. `PlayableState.player_ever_owned_city: BTreeSet<PlayerId>` z `#[serde(default, skip_serializing)]`.
2. Metody `PlayableState`: `ever_owned_city(owner)` (= web `Set.has`), `record_ever_owned_city(owner)` (= web `Set.add`), `player_ever_owned_city_by_owner()` (pełny zbiór pinu, np. argument `dto_bridge::*`), `is_awaiting_first_city(owner)` (= web `isAwaitingFirstPlayerCity(owner)` przez istniejący `player::is_awaiting_first_player_city`).
3. `overlays_view::awaiting_first_city(state, owner)` → `state.is_awaiting_first_city(owner)` (dotąd czytał jedną flagę `gracz_kiedys_mial_miasto` dla każdego fotela).
4. Utrzymanie: konstruktory (`PlayableState::empty`, `PlayableGame::new`) — pusty zbiór (wpis fotela głównego = flaga, pin `:45645-45646`); faza Victory w `advance_turn` (ten sam punkt synchronizacji co flaga `gracz_kiedys_mial_miasto`): `record_ever_owned_city` dla każdego właściciela miasta; migawka/przywrócenie zbioru przy niekompletnej kolejce faz (jak flaga); `odtworz_flage_zwyciestwa_ze_miast` (cfg(test)) odtwarza też pozostałe fotele ludzkie z miastem (`:46369-46370`).
5. `dto_bridge.rs`: tylko komentarz D-BR-1 (API bez zmian; wołający może podać `state.player_ever_owned_city_by_owner()`).

## Decyzje techniczne Operatora (do potwierdzenia przez orkiestratora / Evaluatora)
- **D-AS-2 (jedno źródło na fakt):** wpis fotela głównego (`HUMAN_PLAYER_ID`) to istniejąca flaga `gracz_kiedys_mial_miasto`, a `player_ever_owned_city` trzyma pozostałych właścicieli; `ever_owned_city`/`record_ever_owned_city` ukrywają podział. Powód: (a) pin sam czyta flagę jako `Set.has(HUMAN_OWNER_PRIMARY)` (`:34022`, `:43472`), więc to ten sam fakt; (b) testy spoza allowlisty ustawiają flagę bezpośrednio i oczekują od niej zachowania fotela głównego (`tests/view_overlays_reach_path.rs:83` — flaga `true` bez miast ⇒ zasięg; `:282` — flaga `false` na stanie z nowej gry ⇒ oczekiwanie); przy fotelu głównym w zbiorze `:282` dawałby FAIL (zbiór {1} z konstruktora), a porównania pełnego stanu po wczytaniu (`tests/p4_1j_planned_march_state.rs:194-198`, `:221-226`, `tests/p6_stan_ulepszenia.rs:278`, `tests/view_overlays_siege_wonder_save.rs:163`, `:189`) wymagałyby serializacji zbioru. Mutacja (a) z dispatchu („pole czytane tylko dla fotela 0”) nadal daje FAIL.
- **D-AS-3 (`skip_serializing` obok `default`):** dispatch zabrania zmiany kontraktu JSON; `PlayableState` to DTO wysyłane do frontu po każdej komendzie, więc zapis pola zmieniłby JSON każdej gry z drugim właścicielem. Pin nie zapisuje zbioru, więc nieserializowanie jest zgodne z pinem (jak `#[serde(skip)]` flagi). `default` zostaje (dispatch D-AS-1): ładuje stare zapisy i ewentualny jawny klucz.

## Zmiana formatu zapisu: NIE
Klucz `playerEverOwnedCity` nie pojawia się w JSON (`skip_serializing`); stare zapisy/golden (`old_state_pre_pop.json`, `save_pre_stores.json`, `pre-etap2-state.json`) ładują się i reserializują bez zmian (pełny `cargo test`). Kontrakt mostu JSON: bez zmian.

## Testy (`rust-port/engine/tests/p4_364_awaiting_seat.rs`, 6 testów)
- `awaiting_per_seat_matches_pinned_web_vectors` — 12 przypadków URUCHOMIONEGO pinu (`p4_364_dto_bridge_vectors/vectors.json`, `expected.awaiting`), fotele 0 i 1, z miastem i bez, z wpisem i bez; zbiór zapisany w STANIE, odczyt `PlayableState::is_awaiting_first_city` i `dto_bridge::is_awaiting_first_city(&state, me, &state.player_ever_owned_city_by_owner())`; strażnik pokrycia gałęzi.
- `reachable_reads_awaiting_of_active_seat` — `overlays.reachable` dla aktywnego fotela 1 i 2: brak wpisu ⇒ pusto; wpis INNEGO fotela ⇒ pusto; własny wpis ⇒ zasięg; własne miasto ⇒ zasięg.
- `new_game_records_only_primary_seat` — pin `:45645-45646`.
- `first_city_of_second_seat_is_recorded_on_turn` — miasto właściciela 2 + `advance_turn` ⇒ wpis; utrata miasta potem nie przywraca oczekiwania; kontrola bez miasta ⇒ nadal czeka.
- `old_save_without_field_loads_and_json_has_no_new_key` — brak klucza w JSON, wczytanie stanu bez pola i starego zapisu `old_state_pre_pop.json`, jawny klucz przyjęty.
- `fog_off_no_reveal_awaiting` — `build_fog_layers` ze zbiorem ze stanu, fotel 2 aktywny i czeka: mgła ON ⇒ klucze rzek; mgła OFF ⇒ `fog_active=false`, `river_reveal_keys=None`, `reveal_all_land=false`; wpis fotela 2 ⇒ `None`. Wektory renderera bez zmian.

## Mutacje (skrypt w scratchpadzie, plik przywrócony i porównany `cmp`)
| Mutacja | Zmiana | Wynik `cargo test --test p4_364_awaiting_seat` |
|---|---|---|
| (a) tylko fotel główny | `ever_owned_city`: gałąź `else` → `false` | EXIT 101, 4 FAIL (`awaiting_per_seat…`, `reachable_reads…`, `first_city…`, `old_save…`) |
| (b) brak zapisu w turze | pętla `record_ever_owned_city` w fazie Victory usunięta | EXIT 101, 1 FAIL (`first_city_of_second_seat_is_recorded_on_turn`) |
| (c) bez `default` | `#[serde(skip_serializing)]` | EXIT 101, 1 FAIL (`old_save_without_field_loads_and_json_has_no_new_key`) |
| (c2) bez atrybutu | atrybut serde usunięty | EXIT 101, 1 FAIL (`old_save_without_field_loads_and_json_has_no_new_key`) |

## Bramki (engine, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p4_364_awaiting_seat`: EXIT 0 (6 passed)
- `cargo test --all-targets --no-fail-fast`: EXIT 0 (524 bloków `test result`, 3908 passed, 0 failed, 1 ignored; w tym golden zapisów `p4_1j_planned_march_state`, `p6_stan_ulepszenia`, `view_overlays_siege_wonder_save`, `view_overlays_reach_path`)
- `git diff --check`: czysto. `Cargo.lock` nie commitowany.

## Uwagi poza zakresem
- `advance_turn` z DWOMA fotelami ludzkimi (`is_human`) i miastem drugiego fotela kończy się `WarTurn("war turn: brak wejsc mocy wlasciciela 1")` (`turn_war_pipeline.rs:292`) — istniejące ograniczenie fazy wojny dla hotseat, nie z tego tematu; test tury używa właściciela 2 jako AI (pin zapisuje wpis dla każdego zdobywcy, także AI: `:17816`, `:36218`).
- Rust nie ma produkcyjnej ścieżki założenia/zdobycia miasta; zapis wpisu odbywa się w fazie Victory (ten sam punkt co dotychczasowa flaga). Po wpięciu założenia/zdobycia (`siege_transfer_q5::record_player_ever_owned_city`) wołający powinien użyć `PlayableState::record_ever_owned_city`.
- Brak produkcyjnej ścieżki wczytania `PlayableState` (odtworzenie zbioru ze miast jest `cfg(test)`, jak dla flagi).
