# R-RUSTPORT-P4-1I6-DLUGI-Q1 — długi klienta bitwy oblężniczej: producent BattleSetupDto w moście, typowane błędy, porzucenie bitwy po błędzie startu

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus. Podstawa: `REJESTR-RUST.md` wpis „SIEGE-BATTLE-CLIENT (I6) ZINTEGROWANE” (długi D-1I6-SETUP, D-1I6-ERR, D-1I6-ABORT-E2E, D-1I6-ORPHAN, D-1I6-FIXTURE, D-1I6-SPAWN-FACING, D-1I6-DOC), raport `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1/03-final-control.md` (§3 Z3/Z4/F1, §5), kod `rust-port/client/src/lib.rs` (`start_siege_storm`, `compose_siege_battle_setup`), `rust-port/engine/src/bridge.rs` (komendy `StartSiegeStorm`/`StepSiegeBattle`/`SkipSiegeBattle`/`FinishSiegeBattle`, `siegeBattle` w `BridgeResponse`). NAJPIERW web (pin `07d2fbd72`): jak `startSiegeStormBattle`/`bs.play` buduje scenę bitwy z oblężenia (`main.ts` ok. `:36596-36790`, `battleScene.ts` setup/spawn), skąd bierze układ jednostek, mur, wieże, kierunek spawnu; dopiero potem Rust.
BAZA: `origin/rust-port/parity-v2` w chwili startu (`0522ad6df` w dniu dispatchu; wpisz faktyczny SHA). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Zamknąć długi I6 tak, by klient nie musiał sam składać sceny bitwy ani gubić błędów:
1. D-1I6-SETUP: odpowiedź mostu na `StartSiegeStorm` zawiera `BattleSetupDto` (producent w silniku wg pinu, z istniejących komponentów: `BattleSetupDto` T5a `BATTLE-SETUP`, `compose`/adapter z P4-1G Q4), klient używa go zamiast `compose_siege_battle_setup` z ramki; zachować zgodność wsteczną kontraktu (addytywnie, `CONTRACT_VERSION` bez zmian, albo świadoma decyzja z uzasadnieniem w raporcie).
2. D-1I6-ERR: `SiegeBattleError` jako typ (kod + dane), nie tekst; klient mapuje na swój błąd.
3. D-1I6-ORPHAN + D-1I6-ABORT-E2E: gdy `Setup`/`Adapter` po stronie klienta zawiedzie po starcie bitwy w silniku, bitwa nie zostaje otwarta — komenda mostu (np. `AbortSiegeBattle`) zamyka ją, a `Aborted` jest osiągalne end-to-end przez most. Sprawdź w pinie, czy gałąź istnieje (nie wymyślaj gameplayu; jeśli web nie ma odpowiednika, zapisz to jako decyzję techniczną).
4. D-1I6-DOC (doc-komentarz `last_siege_battle_view` po `Aborted`), D-1I6-FIXTURE/D-1I6-SPAWN-FACING — tylko gdy pin rozstrzyga jednoznacznie; reszta zostaje długiem z numerem.
Poza zakresem: `renderer`, `src-tauri`, `gra/`, pętla taktyczna (`siege_tactics_loop.rs`, `siege_battle_session.rs` — FRAME-QUANT), `city_capture_apply.rs`/`playable.rs` (ZDOBYCIE-MIASTA-B), save/load. Gameplay poza webem → STOP i zgłoś.

## ALLOWLISTA
`rust-port/engine/src/bridge.rs`, `engine/src/domain/siege_battle_apply.rs` (tylko jeśli konieczne dla typu błędu / producenta setupu; uwaga: ZDOBYCIE-MIASTA-B może go dotykać — minimalny diff), `engine/tests/bridge_contract.rs`, nowe `engine/tests/p4_1i6_dlugi*.rs`, `rust-port/client/src/lib.rs`, `client/tests/siege_battle_client.rs`, nowe `client/tests/*` dla tego tematu, `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-DLUGI-Q1/*`. Nie ruszać: `renderer`, `view-model` (chyba że brakujący typ DTO — wtedy minimalnie i uzasadnić), `src-tauri`, `gra/`.

## KRYTERIA KOŃCA
E2E przez most: start szturmu → odpowiedź niesie `BattleSetupDto` zgodny z pinem; klient odtwarza bitwę bez własnej kompozycji sceny; błąd silnika jako typ; po błędzie po stronie klienta bitwa jest zamykana w silniku (test, że nie zostaje otwarta); `Aborted` osiągalne przez most. Mutanty ≥ 15 (każdy zabity lub jawnie równoważny). Tabela „zamknięte / zostaje długiem” dla D-1I6-*.

## BRAMKI (EXIT 0)
engine: `cargo fmt --all -- --check`; `cargo clippy --all-targets -- -D warnings`; `bridge_contract`, `p6_k5loop_wiring_b*`, `p6_zdobycie_miasta_a*`, nowe testy; client: fmt, clippy `-D warnings`, `cargo test` (`engine_bridge_renderer`, `siege_battle_client`); renderer (gpu OFF) — kompilacja jako zależność; pełny `cargo test --all-targets --no-fail-fast` silnika przed werdyktem (checkout musi zawierać `dyspozycje/`). `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` z nazwą tematu, w tle `setsid nohup`; po bramce usuń własny target. Gate dysku: pełna bramka klienta wymaga renderera — tylko przy ≥ 12 GB wolnego, inaczej opisz jako NIE ODTWORZONO.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
