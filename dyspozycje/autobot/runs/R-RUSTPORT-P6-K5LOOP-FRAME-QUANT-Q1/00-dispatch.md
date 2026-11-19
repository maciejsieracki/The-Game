# R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1 — zgodność z pinem w produkcyjnej klatce 16 ms (12 kandydatów c1 + `mur_jazda_rzeka` @16)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus. Podstawa: `REJESTR-RUST.md` D-PIN2-2 i wpis PIN3 (D-PIN3-1…5), raporty `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1/` (`01-operator-r1.md` §4, `02-evaluator.md` §3, `03-final-control.md` §3 — lista kandydatów i klasyfikacja), `engine/tests/p6_k5loop_wiring_a_pin.rs` (tabele `ROZBIEZNE_B_WIRA_PIN_2/_3`, bliźniaki `_klatka1`). NAJPIERW web (pin `07d2fbd72`): `gra/src/**/battleScene.ts` — pętla `_raf` / `_drainTimers` / kolejność kroków klatki (`:9416-9634`, szukaj `_raf`, `_drainTimers`, `_schedule`, `localT`), `gra/src/game/` moduł bitwy; dopiero potem Rust.
BAZA: `origin/rust-port/parity-v2` w chwili startu (`0522ad6df` w dniu dispatchu; zawiera PIN3 i I6; wpisz faktyczny SHA). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Przy produkcyjnym kroku klatki 16 ms (`FRAME_MS`, `speedMul = frameMs/16`) wynik Rust ma być bajt w bajt zgodny z pinem dla scenariuszy, które dziś są jawnymi wyjątkami: `mur_jazda_rzeka` @16 ms oraz 12 kandydatów losowych bitew c1 rozbieżnych TYLKO @16 ms (indeksy 120, 122, 154, 155, 157, 161, 162, 189, 190, 191, 204, 217; przy 1 ms zgodni). Kroki:
1. Zdiagnozować w pinie dokładny mechanizm kwantyzacji klatki (kolejność `_drainTimers` przed kolejką `_raf`, jak pin zaokrągla/przenosi `localT`, remisy czasowe cios vs pocisk wieży, kolejność wewnątrz jednej klatki) — czytając kod pinu i wykonując go (generator `p6_k5loop_wiring_a_gen.mjs` wykonuje tekst pinu), nie zgadując.
2. Zmienić model klatki w `siege_tactics_loop.rs` / `siege_battle_session.rs` tak, by odtwarzał pin przy 16 ms, BEZ psucia zgodności przy 1 ms (125/128) i istniejących wektorów (14+8 scenariuszy A, wektory T7a/T7b/PIN2/PIN3, bliźniaki `_klatka1`). Zmiana modelu jest decyzją techniczną — uzasadnij pinem, zapisz w raporcie.
3. Usunąć wyjątki dla 12 kandydatów i `mur_jazda_rzeka` @16 (lub zawęzić do tych, których przyczyną jest MARCH-INCREMENTAL — 118/196/221 zostają, to osobny temat). Jeśli któryś kandydat okaże się inną klasą (nie kwantyzacja) — sklasyfikuj jawnie i zostaw jako wyjątek z numerem długu.
Poza zakresem: MARCH-INCREMENTAL (kandydaci 118/196/221), `client`, `renderer`, nowa mechanika gameplay. Gameplay poza webem → STOP i zgłoś.

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs`, `engine/src/domain/siege_battle_session.rs` (tylko poprawki uzasadnione pinem), generator `engine/tests/p6_k5loop_wiring_a_gen.mjs` (strażnik SHA pinu i MD5 zachować; regeneracja wektorów z MD5 bit w bit), wektory `engine/tests/p6_k5loop_wiring_a_vectors/*`, `engine/tests/p6_k5loop_wiring_a*.rs`, ewentualnie `engine/tests/p6_k5loop_wiring_b*.rs` tylko gdy zmiana modelu klatki zmienia ich oczekiwania (uzasadnić), `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1/*`. Nie ruszać: `bridge.rs`, `city_capture_apply.rs`, `playable.rs` (ZDOBYCIE-MIASTA-B), `client`, `renderer`, `src-tauri`, `gra/`.

## KRYTERIA KOŃCA
Test pin-vs-Rust @16 ms: wszystkie 128 kandydatów zgodnych poza jawną listą (docelowo tylko 118/196/221 jako klasa A); `mur_jazda_rzeka` @16 zgodny bajt w bajt (bez wyjątku); @1 ms nadal ≥125/128; bliźniaki `_klatka1` zgodne; determinizm i niezależność od podziału na `StepSiegeBattle`. Mutanty ≥ 20 w logice kwantyzacji (każdy zabity lub jawnie równoważny) — w tym test czułości: zmiana kolejności `_drainTimers`/`_raf` musi dać FAIL.

## BRAMKI (EXIT 0)
`cargo fmt --all -- --check`; `cargo clippy --all-targets -- -D warnings`; testy dotknięte (`p6_k5loop_wiring_a*`, `p6_k5loop_wiring_b*`, `bridge_contract`, `p6_k5loop_*`, `p6_zdobycie_miasta_a*`); pełny `cargo test --all-targets --no-fail-fast` przed werdyktem (checkout musi zawierać `dyspozycje/`). `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` z nazwą tematu (UNIKALNE nazwy plików — scratchpad współdzielony), w tle `setsid nohup`; po bramce usuń własny target.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Commituj WIP wcześnie (rundy mogą paść z timeoutem). Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
