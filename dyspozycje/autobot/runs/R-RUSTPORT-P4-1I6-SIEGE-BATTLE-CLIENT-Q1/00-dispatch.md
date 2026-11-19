# R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1 — #371 klient: renderer jako produkcyjny wołający komend bitwy oblężniczej (StartSiegeStorm → odtwarzanie → Finish)

STATUS: dispatch orkiestratora. Opus (grafika/renderer/klient), wszystkie etapy Opus. Podstawa: `…/R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1/` (`01-operator-r1.md`, `02a-obrona.md`, `03-final-control.md` — komendy mostu `StartSiegeStorm`/`StepSiegeBattle`/`SkipSiegeBattle`/`FinishSiegeBattle`, odpowiedź w polu `siegeBattle` obok `result`, D-WIRB-6 v2: akcje z `t0` > ramka wstrzymywane do odpowiedzi, której ramka je dogoniła), `…/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1/` (`result.capture`), I4/I5a/I5b (`renderer/src/battle/playback.rs`, `check_order`/`OutOfOrder`), `client/src/lib.rs` (`RenderClient`, `ClientUiState`). NAJPIERW web (pin `07d2fbd72`, `git show 07d2fbd72:gra/src/main.ts`): przepływ `launchSiegeStormFromMap` (`:36799-37024`) → `new BattleScene(...)`/`bs.play()` → UI bitwy (pasek, Pomiń) → `finishSiegeStormBattle` (`:36596-36790`) → `afterSiegeUi` i odświeżenie mapy; dopiero potem Rust.
BAZA: `origin/rust-port/parity-v2` w chwili startu (SHA = `a5fdb91b8` w dniu dispatchu; wpisz faktyczny SHA). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Klient (`rust-port/client`) jest produkcyjnym wołającym komend bitwy oblężniczej mostu i karmi nimi odtwarzanie bitwy w rendererze (headless, feature `gpu` wyłączony — bez GPU w CI):
1. API klienta (`RenderClient`): `start_siege_storm`, `step_siege_battle(wall_ms)`, `skip_siege_battle`, `finish_siege_battle` — odpowiedzi `siegeBattle` (akcje + ramka) przekazywane do sceny bitwy renderera (`BattleScene`/`playback.rs`) z zachowaniem kontraktu kolejności (`check_order`); po `Finish` klient odświeża mapę (`on_state_changed`) i obsługuje `result.capture`/`Aborted`/`NotFinished` wg D-WIRB-8.
2. Mapowanie stanu UI bitwy z webu (Pomiń, koniec bitwy, wynik) na API klienta — tylko to, co web robi w ścieżce szturmu oblężniczego; nic poza webem.
3. Test E2E (headless): `CreateSession` → szturm przez klienta → N kroków (16 ms i nieregularne) → `Skip` → `Finish`; brak `OutOfOrder`, akcje nie giną (suma = suma sesji), stan mapy po zdobyciu miasta zgodny z mostem; determinizm.
Poza zakresem: Tauri glue (`src-tauri`, CI Windows), tryb ręczny bitwy (generał atakującego → `ManualModeNotPorted`), kapitulacja, przejęcie bez bitwy, `spectacle`. Gameplay poza webem → STOP i zgłoś.

## ALLOWLISTA
`rust-port/client/src/lib.rs`, `client/tests/*` (nowy `siege_battle_client.rs`; `engine_bridge_renderer.rs` tylko adaptacja), `rust-port/renderer/src/battle/playback.rs` i `renderer/src/battle/mod.rs` (tylko jeśli kontrakt odtwarzania wymaga małej, uzasadnionej zmiany — preferuj adapter w kliencie), nowe testy `renderer/tests/battle_playback_client*.rs`, `rust-port/view-model/*` tylko gdy DTO wymaga (uzasadnić), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I6-SIEGE-BATTLE-CLIENT-Q1/*`. Nie ruszać: `engine/*`, `src-tauri`, `gra/`, GPU/wgpu (`feature gpu`).

## KRYTERIA KOŃCA
E2E klienta zielony w trybie headless; kontrakt `check_order` bez naruszeń (kroki 16 ms, nieregularne, Skip, Finish); sprzątanie bitwy po `Aborted`; stan UI klienta (`ClientUiState`) spójny po bitwie; mutanty ≥ 12 (każdy zabity lub jawnie równoważny); tabela „zastosowano / poza zakresem” względem `finishSiegeStormBattle`/`afterSiegeUi`.

## BRAMKI (EXIT 0)
`rust-port/client`: `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; `rust-port/renderer` (feature gpu OFF): fmt, clippy `-D warnings`, testy dotknięte + `battle_playback_*`; `engine`: `bridge_contract` i testy `p6_k5loop_wiring_b*` bez zmian zielone. Dysk: renderer wymaga ≥ 12 GB wolnego, brak równoległych buildów renderera. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` z nazwą tematu (UNIKALNE nazwy), w tle `setsid nohup`; po bramce usuń własny target. Checkout z `dyspozycje/`.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
