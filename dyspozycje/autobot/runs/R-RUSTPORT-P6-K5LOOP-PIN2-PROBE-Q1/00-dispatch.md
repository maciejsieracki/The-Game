# R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 — B-WIRA-PIN-2: sonda morale t. 86 + scenariusze dla mutantów B03/B06/B07

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus. Podstawa: `…/R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1/03-final-control.md` §3–§4 (B-WIRA-PIN-2, długi mutantów), `02a-obrona-r2.md`. NAJPIERW web/pin (`battleScene.ts` @ `07d2fbd72`: `_drainTimers` `:9616-9634`, `_resolveBlowOutcome`, morale/rout), dopiero potem Rust.
BAZA: `origin/rust-port/parity-v2` w chwili startu (SHA = `2e5bf370a`; wpisz faktyczny SHA).

## DECYZJA TECHNICZNA ORKIESTRATORA (D-WIRA-PIN2)
Zgodnie z FC: pierwszy krok to POMIAR, nie wybór drogi. (1) Sonda: stan morale `a0` w t. 86 w scenariuszu `mur_jazda_rzeka` — pin @2 ms vs Rust (wypisz oba ślady zdarzeń do porównania). (2) Jeśli rozjazd jest realną różnicą logiki (`_resolveBlowOutcome`/morale) → napraw w Rust wg pinu. (3) Jeśli to wyłącznie model klatki (remis czasowy 150 vs 156 ms, `_drainTimers` przed kolejką `_raf`) → wybór: (a) oracle dla tego scenariusza = pin @2 ms (wymaga uzasadnienia, że @2 ms to ten sam model czasu co produkcyjny `step`), albo (b) kwantyzacja czasu ciała do klatki 16 ms jako parametr sesji (temat FRAME-QUANT). Wybierz po pomiarze, zapisz w rejestrze. Cel końcowy: `ROZBIEZNE_B_WIRA_PIN_1/2` puste albo jawnie uzasadnione.
Dodatkowo: dopisz scenariusze rozróżniające dla mutantów B03 (trafienie strzału przesunięte o `RANGED_GAP_MS`; łucznik strzelający w oknie lotu pocisku wieży), B06 (`_siegeShooterThreats` bez Δ), B07 (zejście z korony bez Δ; obrońca-strzelec na kaflu z deltą zasięgu ≠ 0), z regeneracją wektorów generatorem `p6_k5loop_wiring_a_gen.mjs` (strażnik SHA, MD5).

## ALLOWLISTA
`rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_pin_vectors/*`, `p6_k5loop_wiring_a.rs`, `engine/src/domain/siege_battle_session.rs`, `engine/src/domain/siege_tactics_loop.rs` (tylko poprawki uzasadnione pinem), `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1/*`. Poza tym nic (bridge.rs należy do WIRING-B).

## KRYTERIA KOŃCA
Raport z pomiarem sondy (ślady pin vs Rust); `mur_jazda_rzeka` bajt w bajt albo jawny, zmierzony wyjątek z testem pilnującym; ≥ 3 nowe scenariusze zabijające B03/B06/B07 (mutanty przerobione i zabite testem); wszystkie dotychczasowe 7 scenariuszy nadal bajt w bajt; MD5 generatora odtwarzalne.

## BRAMKI (EXIT 0)
`cargo fmt --all -- --check`; `cargo clippy --all-targets -- -D warnings`; `p6_k5loop_wiring_a`, `p6_k5loop_wiring_a_pin`, `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_*`, `p6_battle_setup*`, `bridge_contract`; pełny `cargo test --all-targets --no-fail-fast` przed werdyktem. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR`, w tle `setsid nohup`.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
