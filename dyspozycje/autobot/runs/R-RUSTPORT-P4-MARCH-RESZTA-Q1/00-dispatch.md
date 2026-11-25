# R-RUSTPORT-P4-MARCH-RESZTA-Q1 — pozostałe marsze bitwy oblężniczej krok po kroku (zadanie #402)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus. Podstawa: `REJESTR-RUST.md` wpis „MARCH-INCREMENTAL … ZINTEGROWANE” (D-MI-1…3, długi MARCH-INCREMENTAL-RESZTA, duplikat kodu atomowego, N1 `debug_assert` jednoslotowy `ProdBody::march`).
BAZA: `origin/rust-port/parity-v2` = `ee1ceda3ebed21f90ec207f9e541e792738f7abc` w dniu dispatchu (wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`). UWAGA: równolegle trwa FQ-SPEED (#401, zmiany w `siege_tactics_clock.rs`/`siege_battle_session.rs`/`playback.rs`, drobnie w `siege_tactics_loop.rs`) — trzymaj diff w pętli minimalny i lokalny do funkcji marszu, żeby merge-tree był czysty.

## GOAL
NAJPIERW web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`): marsze `_siegeWalkTo`, `_fallBackStep`, `_fleeStep`, `_rangedBackStep`, `_kiteStep`, `_rangedApproachStep` i kroki kawalerii działają krok po kroku (decyzja w chwili kroku, koniec kroku w fazie kroków `_raf` po `_drainTimers`, przerwa `_schedule(STEP_GAP_MS)`), tak jak `_advanceStep`/`_rangedForwardStep` już zrobione w MARCH-INCREMENTAL (D-MI-1/2). Silnik liczy je dziś atomowo (`siege_tactics_loop.rs`). Zadanie:
1. Dla każdej z tych ścieżek sprawdź w pinie, czy marsz jest incrementalny; port przez ten sam mechanizm (`ProdBody::march`, `MarchStage`) jak w D-MI-1/2; ścieżki, które w pinie są atomowe (jeśli są), zostają i dostają jawną notatkę.
2. Pokrycie: wektory/kandydaci pinu, w których rout/śmierć/zmiana celu wypada w oknie takiego marszu (dziś NIE_ZMIERZONO) — zmierz generatorem (`p6_k5loop_wiring_a_gen.mjs`; rozszerzenie dozwolone) i dodaj przypadki; c1 musi pozostać 128/128 @1 i @16 ms, 45 dotychczasowych wektorów bajt w bajt.
3. Sprzątanie długu: usuń duplikat kodu atomowego (`march_incremental=false`) po przejściu wszystkich ścieżek, o ile testy poza sesją (lib) go nie wymagają — w przeciwnym razie zostaw z uzasadnieniem; dodaj `debug_assert` na jednoslotowy `ProdBody::march` (N1).
Poza zakresem: FQ-SPEED (speedMul ≠ 1), LANDAT (zrobione), renderer, `gra/`, `src-tauri`.

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs`, `siege_tactics_actions.rs`, `siege_tactics_atk.rs`, `siege_tactics_atk_b.rs`, `siege_battle_session.rs` (minimalnie), `engine/tests/p6_k5loop_wiring_a_pin.rs`, `engine/tests/p6_k5loop_wiring_a_gen.mjs` + wektory `p6_k5loop_wiring_a_pin_vectors/` (nowe dopisane, stare bajt w bajt), nowe `engine/tests/p4_march_reszta*.rs`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-MARCH-RESZTA-Q1/*`. Nie ruszać: `gra/`, `src-tauri`, `view-model`, `renderer/*`, `client/*` (chyba że test klienta wymaga — uzasadnij), `Cargo.lock`.

## KRYTERIA KOŃCA
Każda ścieżka marszu: zgodna z pinem (krokowo albo jawnie atomowa wg pinu), c1 128/128 @1/@16, 45/45 wektorów, nowe przypadki z routem w oknie marszu zmierzone i zielone, mutanty ≥ 15 (zabite lub jawnie równoważne), tabela „zamknięte / zostaje długiem”.

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. Zmiana strumienia akcji ⇒ client i renderer też, ALE bramki client+renderer dla tego tematu wykonuje orkiestrator przy integracji (dysk: równolegle trwają inne buildy) — Operator uruchamia client tylko przy ≥ 10 GB wolnego, renderera nie uruchamia. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` z nazwą tematu, w tle `setsid nohup`, po bramce usuń własny target.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.

## DODATEK r1 (wznowienie po pauzie dyskowej, 2026-11-25 ~14:30)
Pierwsza próba Operatora została zatrzymana z powodu braku miejsca na dysku (stan zabezpieczony). **Zacznij od jego pracy:** `git fetch origin rust-port-wip/march-reszta-q1 rust-port-wip/march-reszta-q1-dirty`; gałąź `rust-port-wip/march-reszta-q1` (`e639275ee`, 2 commity WIP, baza = parity `ee1ceda3e`) zawiera dotychczasowy kod; commit `f8b4744ac` w `rust-port-wip/march-reszta-q1-dirty` to stash niezacommitowanych zmian `siege_tactics_loop.rs` (zastosuj: `git cherry-pick`/`git stash apply f8b4744ac` albo odczytaj diff `git diff e639275ee f8b4744ac`). BAZA nadal `origin/rust-port/parity-v2` = `ee1ceda3e` (sprawdź SHA). Dysk: równolegle tylko Obrony FQ-SPEED i SAVE-LOAD-BRIDGE — własny `CARGO_TARGET_DIR`, usuń go po każdej bramce; nie uruchamiaj więcej niż jednego builda naraz. Reszta dispatchu bez zmian.
