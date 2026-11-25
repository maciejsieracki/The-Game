# R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1: Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 (zadanie #375)
GOAL: komendy mostu `SaveGame` i `LoadGame`, produkcyjny wołający zapisu i odtworzenia `PlayableGame` (U1), odtworzenie `active_seat` (U5), test E2E przez most z round-tripem bajt w bajt.
ZMIANY/COMMIT: gałąź `rust-port-wip/save-load-bridge-q1`, baza `origin/rust-port/parity-v2` = `ee1ceda3ebed21f90ec207f9e541e792738f7abc`. Commity: `24e512c71` (WIP mostu i ścieżki), `4328d87f2` (testy E2E, bramka `cfg(not(test))`), `e060b081c` (testy: zaznaczenie, mock) oraz commit z testem właściciela spoza graczy i z tym raportem. SHA końcowy jest w wyniku Workflow.
TESTY: szczegóły w sekcji Bramki.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (`02-evaluator.md`).
DEPLOY/PUSH: NIE WYKONANO.

## Web najpierw (pin `07d2fbd72`)

- Zapis: `buildSaveGameSnapshot` (`main.ts:37171-37460`). Zapisuje `seed: _gameSeed` (`:37236`), `units`/`cities` w całości (razem z polami miast `oblegane`, `siegeMachines`, `capturedFromOwnerId`, prawem po zdobyciu, polami kapitulacji, a w jednostkach `oblegaCityId`), `exploredByHuman` (`:37229-37239`), `humanOwnerIds` i `activeHumanOwnerId` (`:37241-37242`), `plannedMarches`/`autoMarch` (`:37244`), `cityProd`, `meta.civChronicleByOwner`, `meta.siegeTurnByCity` i `meta.placedWorldWonders` (`:37450`). Nie zapisuje `selectedId`, `warEventLog`, `cityCaptureEventDetails`, `civElimEventDetails`, `marchStop*` ani `movedByPlayerThisTurn`.
- Wczytanie: `restoreGameFromSave` (`main.ts:46225` i dalej). Kolejno: `turn`, `cityProd`, plany marszu (`:46272-46287`, z czyszczeniem `marchStop*` i `movedByPlayerThisTurn`), `playerEverOwnedCityByOwner` odtwarzane z miast (`:46368-46370`), `humanSeats.activeHumanOwnerId = saved.activeHumanOwnerId` (`:46379-46382`), mgła (`:46385-46411`), cuda (`:46459-46461`), migracje (`:46566-46573`), `selectedId = null` (`:47328`), `gameOver = false` (`:47333`). Normalizacja `game/save.ts:727-728`: gdy `activeHumanOwnerId` nie jest liczbą, przyjmowane jest 0, czyli fotel główny.

## Co zrobiono

1. Most (`engine/src/bridge.rs`), zmiany addytywne, `CONTRACT_VERSION` = 1 bez zmian:
   - `EngineCommand::SaveGame` (JSON `{"kind":"save_game"}`) odpowiada `State` (stan się nie zmienia) i siostrzanym polem `saveGame` z tekstem migawki. Nie emituje zdarzenia. Pole siostrzane zamiast nowego wariantu `BridgeResult` z tego samego powodu co D-WIRB-5: `client/tests` dopasowuje `BridgeResult` wyczerpująco.
   - `EngineCommand::LoadGame { save }` (JSON `{"kind":"load_game","save":"…"}`) podmienia sesję i emituje `StateChanged`. Błąd daje `engine_rejected` z prefiksem `load_game:`, a sesja zostaje nietknięta.
   - `EnginePort::save_game` i `load_game` mają domyślne odrzucenie. Obsługują je `CivEngineAdapter` i `MockEngineAdapter`, który rejestruje też wywołania.
2. `PlayableGame::save_snapshot` / `save_json` / `load_json` / `from_save_snapshot` (`playable.rs`) to produkcyjny wołający dla U1:
   - zapis: `with_playable_planned_marches`, `with_playable_siege_wonders` i `with_playable_explored_by_human`, wojna w `state.war` przez `with_war_turn_state`, kolejka faz w `event_queue`, `rng = Rng::from_seed(params.seed)`, `activeHumanOwnerId` dla U5, a reszta stanu w ciele `playable`;
   - wczytanie wyłącznie przez `zapis_loader::load_save_snapshot` (migracje działają w środku), potem `restore_planned_marches`, `restore_siege_wonders` i `restore_explored_by_human`, wojna z `state.war`, pozycje jednostek przeniesionych przez migrację stosu, `odtworz_flage_zwyciestwa_ze_miast` (zdjęty `#[cfg(test)]`, tak jak zapowiadał komentarz), wyczyszczenie pól, których pin nie zapisuje, i aktywny fotel;
   - zapis w trakcie bitwy oblężniczej zwraca jawny błąd `PlayableSaveError::SiegeBattleInProgress`.
3. `save_load.rs`, klucze addytywne: `activeHumanOwnerId` (przy odczycie wartość nie-liczbowa daje fotel główny, jak w webie) i `playable` (`SavedPlayableSession { state, siegeBattlesStarted }`, odczyt ścisły). Zapis bez sesji i bez fotela pomija oba klucze, więc stary format zostaje bajt w bajt.

## Decyzje techniczne (do `REJESTR-RUST.md`)

- **D-SLB-1:** `GameStateDto` nie niesie `PlayableState`, więc pełny stan sesji leży w addytywnym ciele `playable`. Z ciała usuwane są pola, które mają nośnik w formacie weba: `war` (idzie do `state.war`), plany marszu, `oblegane`, `siegeMachinesReady` i `placedWorldWonders`. Dzięki temu odtwarzają je istniejące funkcje `restore_*`. Ciało nie ma też pól, których pin nie zapisuje: zaznaczenia, `captureEvents`, `marchStop*`, `movedByPlayerThisTurn` i `marchAttackTargets` (ostatnie jest odbudowywane z planów).
- **D-SLB-2:** `state` (`GameStateDto`) to walidowany rzut `PlayableState`, wymagany przez format v2. Służy też jako nośnik migracji przy wczytaniu, a pozycje z `moved_units` trafiają do ciała. Cywilizacje rzutu to gracze oraz każdy inny właściciel miasta lub jednostki (nazwa `owner-<id>`).
- **D-SLB-3 (RNG):** web zapisuje `seed` i ten siedzi w `params.seed` ciała. Rust ma deterministyczny strumień bitew `SessionRolls::derive(seed, numer bitwy)`, więc zapisywany jest też licznik `siegeBattlesStarted`. `rng` snapshotu = `Rng::from_seed(seed)`. Pole ma charakter dokumentacyjny: `PlayableGame` nie trzyma innego strumienia.
- **D-SLB-4:** pin nie zapisuje `warEventLog` ani szczegółów zdarzeń, więc po wczytaniu w nowej sesji dziennik jest pusty.
- **D-SLB-5:** ID fotela to `PlayerId` Rust, gdzie fotel główny = 1 (zgodnie z D-FS-5). Brak `activeHumanOwnerId` albo wartość nie będąca liczbą całkowitą ≥ 0 daje fotel główny, jak `save.ts:728`. Fotel nie jest walidowany względem graczy, bo web też tego nie robi.
- **D-SLB-6:** `playerStartHexByOwner` jest przeliczany z pozycji stolicy (`PlayableFogSession::for_new_game`). Web go nie zapisuje, odtwarza mapę z ziarna.
- **D-SLB-7:** `save_load` i `zapis_loader` są w `domain/mod.rs` bramkowane `#[cfg(not(test))]` (moduły ładowane w testach przez `#[path]`). Dlatego nowa ścieżka sesji w `playable.rs` ma tę samą bramkę. `mod.rs` jest poza allowlistą.
- **D-SLB-8:** `LoadGame` w trakcie trwającej bitwy podmienia sesję, a bitwa przepada, tak samo jak przy `CreateSession`.

## Bramki (CARGO_TARGET_DIR poza repo, `CARGO_INCREMENTAL=0`, bez debug info)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 (stan końcowy)
- Pełny `cargo test --all-targets --no-fail-fast` w tle: 556 bloków, 4299 passed, 1 failed, 1 ignored (ignored już wcześniej istniał).
  - Jedyny FAIL dotyczył mojej asercji w nowym teście (scenariusz nie miał zaznaczenia po `AdvanceTurn`). Poprawiłem test (zaznaczenie przed zapisem) i `p4_save_load_bridge` przeszedł 24/24.
  - Potem doszedł 25. test (właściciel spoza graczy). Wynik końcowy: `p4_save_load_bridge` 25/25, `bridge_contract` 10/10.
  - Wszystkie istniejące testy przeszły w pełnym przebiegu, w tym `save_load`, `p4_364_fog_save`, `view_overlays_siege_wonder_save`, `p4_1j_*` i `p6_k5loop_wiring_b`.
  - Po ostatnich zmianach (tylko plik testowy) pełnego przebiegu nie powtarzałem: NIE_ZMIERZONO.
- Klient: nie ruszany (`client/src/lib.rs` bez zmian), więc bramek klienta nie uruchamiałem. Renderer zgodnie z dispatchem nie był uruchamiany.

## Testy E2E (`engine/tests/p4_save_load_bridge.rs`, 25)

Pokrycie:
- kontrakt komend i JSON;
- `StateChanged` przy `LoadGame`;
- round-trip w nowej sesji (`CreateSession`, kilka komend i tur, `SaveGame`, `LoadGame`, stan zgodny, ponowny zapis równy bajt w bajt);
- kolejne komendy bajt w bajt w dwóch wczytanych sesjach i w sesji źródłowej;
- fotel ≠ główny (2) przeżywa zapis i steruje zapytaniami bez fotela;
- normalizacja fotela jak w webie;
- mgła, plany marszu z odbudową celu ataku, filtr planów obcych jednostek;
- `citySiege` i cuda w kluczach weba, nieobecne w ciele;
- pola ZMB/KAP (`capturedFromOwner`, prawo po zdobyciu, `cityProd`, kronika, `siegeCity`, `oblegaCityByUnit`) oraz pusty dziennik;
- flaga miast; wojna w `state.war`;
- licznik RNG bitew (następna bitwa identyczna, inny licznik daje inny strumień);
- zapis w trakcie bitwy jako jawny błąd; wczytanie kończy bitwę;
- zły zapis bez zmian sesji; migracja stosu przenosi jednostki w `PlayableState`;
- właściciel spoza graczy i miast; mock; domyślne odrzucenie portu.

## Mutanty (20/20 zabitych)

Skrypt podmienia jeden fragment na raz i uruchamia `p4_save_load_bridge` + `bridge_contract`. Oryginał jest przywracany po każdym mutancie.

| # | Mutant | Wynik |
|---|---|---|
| M01 | fotel nie odtworzony | zabity |
| M02 | fotel nie zapisany | zabity |
| M03 | plany marszu nie odtworzone | zabity |
| M04 | oblężenia i cuda nie odtworzone | zabity |
| M05 | mgła nie odtworzona | zabity |
| M06 | licznik bitew zerowany | zabity |
| M07 | wojna nie odtworzona | zabity |
| M08 | pozycje z migracji pominięte | zabity |
| M09 | `oblegane` zostaje w ciele | zabity |
| M10 | plany marszu zostają w ciele | zabity |
| M11 | flaga miast nie odtworzona | zabity |
| M12 | `LoadGame` nie podmienia gry | zabity |
| M13 | `SaveGame` bez tekstu | zabity |
| M14 | fotel bez walidacji jak w JS | zabity |
| M15 | ciało sesji gubione przy odczycie | zabity |
| M16 | rzut bez wojny | zabity |
| M17 | pusta kolejka faz po wczytaniu | zabity |
| M18 | mock nie podmienia gry | zabity |
| M19 | właściciel jednostki pominięty w cywilizacjach | zabity po dodaniu testu `jednostka_wlasciciela_spoza_graczy_i_miast_nie_blokuje_zapisu` (pierwszy przebieg: przeżył) |
| M20 | zaznaczenie zostaje w ciele | zabity |

## Zamknięte / zostaje długiem

| Pozycja | Stan |
|---|---|
| U1: produkcyjny wołający `with_playable_*`, `restore_*`, `load_save_snapshot` (plany marszu, `citySiege`, cuda, `exploredByHuman`) | ZAMKNIĘTE |
| U1: pola ZMB/KAP zapisywane przez pin (`capturedFromOwnerId`, prawo po zdobyciu, `cityProd`, `civChronicleByOwner`, pola kapitulacji miasta, `oblegaCityId`) | ZAMKNIĘTE (ciało `playable`) |
| U5: `active_seat` ↔ `activeHumanOwnerId` | ZAMKNIĘTE |
| `odtworz_flage_zwyciestwa_ze_miast` tylko w testach | ZAMKNIĘTE (wołana produkcyjnie) |
| **DL-SLB-1:** zapis w trakcie bitwy oblężniczej (`ActiveSiegeBattle` / `SiegeLoop` / `ProdBody`). W pinie scena bitwy zasłania mapę, a menu zapisu z mapy jest niedostępne; NIE_ZMIERZONO, czy pin pozwala zapisać w trakcie sceny. Rust odrzuca taki zapis jawnym błędem. | DŁUG (osobny temat) |
| **DL-SLB-2:** `warEventLog` / `cityCaptureEventDetails` / `civElimEventDetails`. Pin ich nie zapisuje (D-SLB-4). | Zgodne z pinem, poza zapisem |
| **DL-SLB-3:** `meta.siegeTurnByCity` (pin `main.ts:47266`). Rust nie ma mapy tur oblężenia osobno od `siege_city`; NIE_ZMIERZONO, czy któreś pole `PlayableCitySiege` jej odpowiada. | DŁUG |
| **DL-SLB-4:** zapis w formacie pinu (`units[]`/`cities[]` z polami miast, `humanOwnerIds`, `seed` top-level). Rust zapisuje własny format v2 z ciałem `playable`; wczytywanie zapisów webowych to osobny temat (D-FS-5). | DŁUG |
| **DL-SLB-5:** przełączanie fotela w trakcie gry (`switchActiveHuman`, hot-seat). Brak komendy w moście, a fotel ≠ główny jest testowany tylko przez zapis. | DŁUG |
| **DL-SLB-6:** `last_siege_tick` (raport ostatniego ticka oblężenia) nie jest zapisywany; po wczytaniu jest pusty do następnej tury. Pin nie ma odpowiednika w zapisie. | Odnotowane |
| Klient i Tauri nie wołają jeszcze `SaveGame`/`LoadGame` (brak UI slotów zapisu) | DŁUG (temat klienta) |

## Allowlista

Zmienione pliki:
- `engine/src/bridge.rs`
- `engine/src/domain/save_load.rs`
- `engine/src/domain/playable.rs`
- `engine/tests/bridge_contract.rs`
- nowy `engine/tests/p4_save_load_bridge.rs`
- ten raport

Nie ruszałem: `gra/`, `src-tauri`, `client`, `renderer`, `view-model`, `Cargo.lock`. W trakcie pracy powstał tymczasowy plik testowy (sonda mapy); usunąłem go przed commitem.
