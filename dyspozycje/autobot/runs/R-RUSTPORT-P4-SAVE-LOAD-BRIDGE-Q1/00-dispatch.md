# R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1 — komendy Save/Load w moście (PlayableGame) i produkcyjny wołający odtworzenia stanu (zadanie #375)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus. Podstawa: `REJESTR-RUST.md` (U1: brak produkcyjnego wołającego zapisu/wczytania `PlayableGame` — `z_playable_*`/`restore_*`/`load_save_snapshot` wołane tylko w testach, tak samo `citySiege`/`plannedMarches`/`placedWorldWonders`; U5: `restore` nie odtwarza `active_seat`), wpisy I6-DLUGI (D-1I6-1…5: E2E przez `CivEngineAdapter::from_game`, bo most nie ma `Load`), DŁUG-364-FOG-SAVE (zapis mgły `exploredByHuman` zintegrowany), ZDOBYCIE-MIASTA-B/KAPITULACJA (DL-2 KAP-DL-2: nowe pola stanu poza zapisem).
BAZA: `origin/rust-port/parity-v2` = `ee1ceda3ebed21f90ec207f9e541e792738f7abc` w dniu dispatchu (wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`). UWAGA: równolegle trwają FQ-SPEED (#401: `client/src/lib.rs`, `playback.rs`, silnik) i MARCH-RESZTA (#402: pętla bitwy) — trzymaj diff `bridge.rs`/`save_load.rs`/`playable.rs` lokalny; `client/src/lib.rs` ruszaj minimalnie.

## GOAL
NAJPIERW web (pin `07d2fbd72`): jak gra zapisuje i wczytuje stan (`git grep -n -i -E "saveGame|loadGame|serialize|buildSave|applySave|activeHumanOwnerId" 07d2fbd72 -- gra/src`, w tym blok wczytania, który odtwarza `activeHumanOwnerId`, i zapis pól oblężenia/bitwy). Następnie:
1. Komendy mostu `SaveGame` i `LoadGame` (addytywnie; `CONTRACT_VERSION` bez zmian albo świadoma decyzja z uzasadnieniem): zapis zwraca migawkę JSON (istniejący `save_load` — `z_playable_*`), wczytanie odtwarza `PlayableGame` przez istniejące `restore_*`/`load_save_snapshot` i migracje (`load_json_with_migration_reports` jako jedyna ścieżka produkcyjna).
2. U5: `restore` odtwarza `active_seat` (jak web `activeHumanOwnerId`); test round-trip na foteli ≠ 0.
3. U1: produkcyjny wołający odtwarzania `citySiege`, `plannedMarches`, `placedWorldWonders`, `exploredByHuman` (mgła) i pól dodanych w ZDOBYCIE-MIASTA-B/KAPITULACJA (te, które pin zapisuje; reszta → dług z numerem i dowodem z pinu).
4. Test E2E przez most: start gry (`CreateSession`) → kilka tur/komend → `SaveGame` → `LoadGame` w nowej sesji → stan i kolejne komendy dają ten sam wynik bajt w bajt (determinizm RNG zapisany wg pinu).
Poza zakresem: zapis w trakcie trwającej bitwy oblężniczej (stan `SiegeLoop`/`ProdBody`) — jeśli pin to zapisuje, opisz jako dług z numerem i zakresem (osobny temat), nie wymyślaj; renderer, `src-tauri`, `gra/`. Pytanie ABC tylko dla odstępstwa gameplay od webu.

## ALLOWLISTA
`rust-port/engine/src/bridge.rs`, `engine/src/domain/save_load.rs`, `engine/src/domain/playable.rs` (tylko pola/restore), `engine/tests/bridge_contract.rs`, nowe `engine/tests/p4_save_load_bridge*.rs`, istniejące testy zapisu (`save_load*` — dopiski), `rust-port/client/src/lib.rs` i `client/tests/*` (tylko jeśli klient musi wołać nowe komendy; minimalnie), `dyspozycje/autobot/runs/R-RUSTPORT-P4-SAVE-LOAD-BRIDGE-Q1/*`. Nie ruszać: `gra/`, `src-tauri`, `view-model`, `renderer/*`, `Cargo.lock`.

## KRYTERIA KOŃCA
`SaveGame`/`LoadGame` w moście z testami E2E (round-trip bajt w bajt, fotel ≠ 0, mgła, planned marches, citySiege, cuda); U1 i U5 zamknięte; mutanty ≥ 12; tabela „zamknięte / zostaje długiem” (z numerami: zapis w trakcie bitwy, pola ZMB/KAP poza pinem).

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`; client fmt/clippy/test tylko jeśli ruszasz klienta i wolne ≥ 10 GB; renderera nie uruchamiaj (bramki client+renderer przy integracji wykonuje orkiestrator). `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` z nazwą tematu, w tle `setsid nohup`, po bramce usuń własny target.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
