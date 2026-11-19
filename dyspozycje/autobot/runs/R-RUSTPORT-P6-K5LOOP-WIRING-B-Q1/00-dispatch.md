# R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 — #369 K5LOOP-WIRING część B: komendy mostu sesji bitwy oblężniczej + zastosowanie wyniku do PlayableState

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (linia K5/most, grafika→renderer). Podstawa: część A (`SiegeBattleSession`, zintegrowana: parity-v2 `2e5bf370a`, raporty `…/R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1/` — w szczególności `03-final-control.md` §3–§4 „Długi”), rozpoznanie `…/R-RUSTPORT-P6-K5LOOP-WIRING-ROZP-Q1/00-rozpoznanie.md` (§4 D-WIR-*). NAJPIERW web (pin `07d2fbd72`, `git show 07d2fbd72:gra/src/main.ts`): `launchSiegeStormFromMap` (`main.ts:36799-37024`), `finishSiegeStormBattle` (`:36596-36790`, w tym `afterSiegeUi`), `opts.onCityCaptured` (`:34414-34444`, `:34683-34730`); dopiero potem Rust.
BAZA: `origin/rust-port/parity-v2` w chwili startu (SHA = `2e5bf370a` w dniu dispatchu; wpisz faktyczny SHA). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Sesja bitwy oblężniczej (`SiegeBattleSession`: start/step/skip/finish) dostępna z mostu (`engine/src/bridge.rs`, `EngineCommand`, addytywnie, `CONTRACT_VERSION` bez zmian) i z wynikiem zastosowanym do `PlayableState` jak w webie:
- komendy `StartSiegeStorm{city_id | attacker/defender selekcja wg `launchSiegeStormFromMap`}`, `StepSiegeBattle{wall_ms}`, `SkipSiegeBattle`, `FinishSiegeBattle`; odpowiedzi niosą `Vec<BattleActionDto>`/`BattleFrameDto` (konsument: `renderer/src/battle/playback.rs`, I5a/I5b) — bez nowego formatu, jeśli istniejący wystarcza (decyzja techniczna wg webu);
- RNG z `PlayableState.params.seed` (D-WIR-5) i numeru bitwy; sesja przeżywa między komendami w `PlayableGame` (nie w DTO stanu), zapis/odczyt bitwy w toku poza zakresem (jawnie: błąd `BattleInProgress` przy Save/AdvanceTurn, wg webu);
- zastosowanie wyniku: HP i straty jednostek obu stron, zużyte machiny, status oblężenia (`citySiege`) — dokładnie jak `finishSiegeStormBattle` bez gałęzi zdobycia miasta; gałąź zdobycia = typowany hak/wynik `CityCaptureRequested` dla T8 (#354 ZDOBYCIE-MIASTA-WIRING), NIE wołaj `apply_transfer_with_effects` tutaj (granica T8);
- długi z T7a do zamknięcia tutaj: D-ADP-11 (sojusz = umowa; PlayableState bez `deals` — synchronizacja statusu sojuszu/umów), D-ADP-L-BARB (barbarzyńcy, `PlayerId` u64) — decyzja techniczna wg webu, wpis do `REJESTR-RUST.md`; jeśli web nie rozstrzyga → STOP i zgłoś (ABC tylko dla odstępstwa).

## ALLOWLISTA
`rust-port/engine/src/bridge.rs`, `engine/src/domain/siege_battle_session.rs` (tylko minimalne API wymagane mostem), nowy `engine/src/domain/siege_battle_apply.rs` (+ `domain/mod.rs` tylko `pub mod`), `engine/src/domain/playable.rs`/stan (tylko pola konieczne dla trwającej bitwy i wyniku — uzasadnić pinem), `engine/tests/bridge_contract.rs`, nowe `engine/tests/p6_k5loop_wiring_b*.rs` (+ generator TS `p6_k5loop_wiring_b_gen.mjs` z strażnikiem SHA pinu, jeśli wynik zastosowania wymaga wektorów), `view-model/*` tylko gdy DTO odpowiedzi wymaga (uzasadnić), `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1/*`. Poza allowlistą (renderer GPU, client, src-tauri, `gra/`) — nie ruszać.

## KRYTERIA KOŃCA
Test end-to-end przez most: `CreateSession` → `StartSiegeStorm` → `StepSiegeBattle`×N / `SkipSiegeBattle` → `FinishSiegeBattle`; stan po wyniku zgodny z wektorami pinu (HP/straty/machiny; generator wykonujący tekst pinu, nie ręczne liczby); komendy poza fazą → jawne błędy (nie panika); determinizm (ten sam seed → ten sam wynik, niezależność od podziału na `StepSiegeBattle`); kontrakt JSON addytywny (stare komendy bez zmian, `bridge_contract` zielony). Mutanty ≥ 15 (każdy zabity lub jawnie równoważny). Rejestr: tabela „zastosowano / hak T8 / poza zakresem”.

## BRAMKI (EXIT 0)
`rust-port/engine`: `cargo fmt --all -- --check`; `cargo clippy --all-targets -- -D warnings`; testy dotknięte + `bridge_contract`, `p6_k5loop_wiring_a`, `p6_k5loop_wiring_a_pin`, `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_*`, `p6_battle_setup*`; pełny `cargo test --all-targets --no-fail-fast` przed werdyktem. Budowanie: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR`, w tle `setsid nohup` z odczytem EXIT.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Gameplay poza webem → STOP. Commituj WIP wcześnie (rundy mogą paść z timeoutem). Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
