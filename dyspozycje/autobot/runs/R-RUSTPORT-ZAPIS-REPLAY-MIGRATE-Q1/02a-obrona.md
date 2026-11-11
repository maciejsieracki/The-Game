STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1
GOAL: Obrona Operatora (runda 1) na zarzuty Evaluatora dla migracji checkpointow replayu (migrate_on_load).
ZMIANY/COMMIT: kod obrony w commicie (SHA podane w sekcji "SHA" nizej), allowlista: rust-port/engine/src/domain/replay.rs, rust-port/engine/tests/p6_zapis_replay_migrate.rs, dyspozycje/autobot/runs/R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1/**. Baza kodu: fdd24d04a (tip parity-v2 w chwili startu, jak w dispatchu). Cargo.lock nie commitowany. gra/, origin/main, WERSJE.md nietkniete.
TESTY: patrz sekcja "Bramki" nizej (wyniki EXIT z tej rundy).
BLOKADY: zarzut 1 i zarzut 2 w czesci dotyczacej accessorow: wymagaja decyzji wlasciciela (patrz "Pytanie ABC").
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Final Control (Sonnet) na nowym SHA; decyzja wlasciciela w sprawie zarzutow 1-2 (ABC).
DEPLOY/PUSH: NIE WYKONANO (push tylko do rust-port/zapis-replay-migrate-q1-wip; rust-port/parity-v2 nietkniete, bez integracji).

# Obrona Operatora R1 - R-RUSTPORT-ZAPIS-REPLAY-MIGRATE-Q1

Baza kodu: `fdd24d04a` (tip `origin/rust-port/parity-v2`, zgodnie z dispatchem "f207ea6b1 lub nowszy"; Evaluator zauwazyl ta sama baze - przyjmuje sie, nie jest to zarzut merytoryczny).

## Zarzut 1 - serde Deserialize wczytuje SaveSnapshot bez migracji
**CZESCIOWO PRZYJETY.**
- Poprawka: `ReplayStep` ma teraz reczny `Deserialize`, ktory ustawia wewnetrzna flage `migration_pending = true` dla kazdego kroku z checkpointem (flaga runtime, `serde(skip)` w serializacji, nie wchodzi do porownania). Flaga jest per-krok, nie per-log.
- Bramka: `ReplayLog::replay()` / `playback()` zwracaja `ReplayError::SnapshotsNotMigrated`, jesli ktorykolwiek krok ma `migration_pending`. Dodano publiczne `ReplayLog::migration_pending()` i `ReplayStep::migration_pending()`.
- Nie przyjmuje sie pelnego spelnienia kryterium 1 ("w src/ nie ma deserializacji SaveSnapshot z replayu bez migracji"): `Deserialize` nadal deserializuje `SaveSnapshot` (`ReplayStepWire`, `ReplayWire`), bo serde nie zna epoki wlasciciela. Usuniecie tej deserializacji wymaga decyzji o zrodle epoki (patrz "Pytanie ABC").

## Zarzut 2 - obejscie bramki przez accessory
**CZESCIOWO ODRZUCONY, z dowodem.**
- Probowano bramkowac `snapshot()` i `into_parts()` (zwracanie `None` dla krokow oczekujacych). Zmiana zlamala istniejacy test `tests/replay.rs::replay_log_round_trips_some_snapshot_with_all_snapshot_data` (linie 240-263), ktory wymaga, zeby checkpoint po deserializacji byl dostepny przez `step(0).snapshot()`. Plik `tests/replay.rs` jest poza allowlista dispatchu, wiec nie mozna go zmienic. Zmiane cofnieto.
- Stan: `steps()`, `iter()`, `step(i)`, `ReplayStep::snapshot()`, `into_parts()` zwracaja surowy, niezmigrowany snapshot (kontrakt istniejacego testu). Gwarancja obejmuje odtwarzanie (`replay()`/`playback()`), a stan jest jawnie widoczny przez `migration_pending()`.
- Test wlasny (`p6_zapis_replay_migrate_playback_yields_migrated_state`) pokazuje surowy odczyt 4 wodzow jako KONTROLE, a nie jako dowod poprawnosci.

## Zarzut 3 - from_steps omija flage
**PRZYJETY, naprawiony.**
- Przyczyna: flaga byla na logu, wiec `from_steps` z krokiem zdeserializowanym osobno dostawal `false`.
- Poprawka: flaga zyje w kroku (`ReplayStep::migration_pending`). `from_steps` zachowuje ja w krokach, a `ReplayLog::migration_pending()` liczy ja z krokow. Nowy test `p6_zapis_replay_migrate_from_steps_keeps_pending_gate`: krok zdeserializowany osobno -> `from_steps` -> `playback()` zwraca `SnapshotsNotMigrated` -> `migrate_on_load` -> odtwarzanie daje stan po migracji (generals [10,11,20]).
- Dodatkowo `p6_zapis_replay_migrate_recorded_checkpoint_is_not_blocked`: zywy checkpoint z `ReplayRecorder` (nie z serde) NIE jest blokowany (`migration_pending() == false`), wiec flaga nie psuje zwyklego zapisu.

## Zarzut 4 - migrate_on_load zeruje flage bezwarunkowo; idempotencja
**PRZYJETY w czesci dotyczacej testu, z wyjasnieniem.**
- Flaga jest czyszczona per krok (krok po kroku, razem z jego migracja), a nie globalnie. Dla krokow bez checkpointu nic sie nie dzieje.
- Dodano asercje idempotencji: dwukrotne `migrate_on_load` na tym samym logu z ta sama epoka (2.0) daje w drugim wywolaniu zero degradacji (`demoted_generals` puste), a odtwarzanie daje nadal [10,20] (test `p6_zapis_replay_migrate_per_owner_era_and_idempotent_reload`).
- Swiadomie NIE blokujemy ponownej migracji z INNA epoka: `load_save_snapshot` (zapis_loader.rs) wykonuje `migrate_on_load` za kazdym wczytaniem, wiec replay ma ten sam kontrakt. Zmiana epoki moze dalej degradowac - to zgodne z loaderem.

## Zarzut 5 - zmiana publicznego API (PartialEq, nowy wariant ReplayError)
**CZESCIOWO PRZYJETY (PartialEq naprawiony), wariant ODRZUCONY z dowodem.**
- PartialEq/Eq: `ReplayLog` znowu ma `derive(PartialEq, Eq)` (przywrocone, bo flaga zniknela z logu). `ReplayStep` ma reczne PartialEq/Eq porownujace tylko pola danych (sekwencja, tura, input, rng_state, snapshot) - flaga pending nie wplywa na rownosc. Test: `raw == original` (round-trip z serde rowny oryginalowi z rekordera).
- Wariant `ReplayError::SnapshotsNotMigrated`: przeszukanie calego `rust-port/` (`grep -rn ReplayError`) nie znajduje zadnego exhaustive `match` na `ReplayError` poza `replay.rs` (Display) i nowym testem, ktory porownuje wartosc, a nie matchuje. Wariant jest addytywny w obrebie crate, bez konsumentow w repo.

## Zarzut 6 - testy na recznie zbudowanych wektorach, nie na wektorach pinu
**ODRZUCONY z dowodem.**
- Dispatch (kryteria 1-4) nie wymagal wektorow pinu; wymagal testu behawioralnego na stanie po migracji (kryterium 2), ktory jest.
- Istniejacy test loadera `p6_zapis_loader_migrate.rs` (ta sama konwencja, linie 63-101: `save_text(specs)` + `excess_generals_specs()`) tez buduje wektory recznie. Test replayu jest spojny z nim.

## Pytanie ABC do wlasciciela (decyzja wymagana przed READY_FOR_DEPLOY)
Zarzuty 1 i 2 pokazuja jedna luke, ktorej kod nie zamknie bez decyzji:
- A) Zostawic obecny stan: deserializacja `ReplayLog` z checkpointem zwraca surowy snapshot (dostep przez accessory), ale playback jest zablokowany do `migrate_on_load`. Koszt: kryterium 1 literalnie niespelnione; `tests/replay.rs` zostaje bez zmian.
- B) Usunac `Deserialize` z `ReplayLog`/`ReplayStep` (jedyna sciezka wczytania = `zapis_loader::load_replay_log_json`, ktora migruje od razu z epoka). Koszt: zmiana `tests/replay.rs` (poza allowlista) i ewentualnie innych testow; wymaga nowego tematu.
- Rekomendacja Operatora: B, bo jedyny w pelni spelniony wariant kryterium 1. Decyzja nalezy do wlasciciela (zrodlo epoki i zakres zmian).

## Bramki (ta runda, katalog docelowy poza repo, usunac po zapisie)
Srodowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo.
- `cargo fmt --check` (w `rust-port/engine`): EXIT 0 (po `cargo fmt` na plikach tematu).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: EXIT 0, 28 passed.
- `cargo test --test p6_zapis_replay_migrate --test p6_zapis_loader_migrate --test replay`: EXIT 0 (wszystkie testy w tych plikach zielone, w tym regresja `tests/replay.rs` 6/6).

## Kontrola kryteriow po obronie
- Kryterium 1: NIE SPELNIONE literalnie (deserializacja SaveSnapshot w serde nadal istnieje); mitigacja: bramka playbacku + flaga; patrz ABC.
- Kryterium 2: spelnione (test behawioralny na stanie po migracji, `generals == [10,11,20]`, `units().len() == 4`).
- Kryterium 3: spelnione (zmiany w allowliscie; `tests/replay.rs`, `gra/`, `Cargo.toml`, `Cargo.lock`, `WERSJE.md` nietkniete).
- Kryterium 4: spelnione (bramki EXIT 0, wyzej).

## SHA
Kod obrony: podane w komunikacie Operatora po commicie (HEAD brancha `rust-port/zapis-replay-migrate-q1-wip`). Poprzedni kod R1: 052807e06.
