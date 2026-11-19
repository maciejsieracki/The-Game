# R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1 — B-WIRA-PIN-3: realne rozbieżności logiki Rust vs pin (11/128 bitew c1 także @1 ms)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus. Podstawa: `…/R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1/` (`01-operator-r1.md` §4.3, `03-final-control.md` §5; generatory kandydatów `01-operator-r1-kandydaci-c1..c3.py`), część A (`…/R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1/`). NAJPIERW web/pin (`battleScene.ts` @ `07d2fbd72`, `git show`), dopiero potem Rust.
BAZA: `origin/rust-port/parity-v2` w chwili startu (SHA = `540be622e` w dniu dispatchu; wpisz faktyczny SHA). `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Zmierzyć i usunąć przyczyny rozbieżności, w których Rust różni się od pinu także przy kroku klatki pinu 1 ms i 0,25 ms (11 ze 128 losowych bitew c1; najczęściej jazda atakująca lub palisada z taranem; przyczyny NIE_ZMIERZONO). Kroki: (1) odtworzyć 11 kandydatów generatorami c1; (2) dla każdego wskazać pierwszy rozjazd (ślad zdarzeń pin @1 ms vs Rust: `WIRING_A_TRACE`, jak w sondzie PIN2) i sklasyfikować przyczynę (logika `_cavalryAction`/palisada/taran/morale itp.); (3) naprawić w Rust wg pinu (każda poprawka z numerem linii pinu); (4) przenieść ≥ 3 rozróżniające przypadki do wektorów (generator `p6_k5loop_wiring_a_gen.mjs`, strażnik SHA pinu, MD5). Rozbieżności wyłącznie z kwantyzacji klatki 16 ms (12 kandydatów c1) NIE są zakresem — to FRAME-QUANT (osobny temat, D-PIN2-2). Gdy przyczyna jest niejednoznaczna lub wymaga gameplay poza webem → STOP i zgłoś.

## ALLOWLISTA
`rust-port/engine/src/domain/siege_tactics_loop.rs`, `engine/src/domain/siege_battle_session.rs` i `siege_battle_adapter*.rs` (tylko poprawki uzasadnione pinem), `engine/tests/p6_k5loop_wiring_a_gen.mjs`, `p6_k5loop_wiring_a_pin.rs`, `p6_k5loop_wiring_a_pin_vectors/*`, `p6_k5loop_wiring_a.rs`, istniejące testy `p6_k5loop_*` dotknięte zmianą (uzasadnić), `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-PIN3-DIVERGENCE-Q1/*`. `bridge.rs` i `siege_battle_apply.rs` należą do WIRING-B — nie ruszać.

## KRYTERIA KOŃCA
Tabela 11 kandydatów: pierwszy rozjazd, przyczyna, poprawka (SHA) albo uzasadniony wyjątek z testem pilnującym. Po poprawkach 128 kandydatów c1 rozbieżnych @1 ms: 0 albo każdy jawnie sklasyfikowany. Dotychczasowe wektory (8 starych + nowe z PIN2) bajt w bajt. Mutanty ≥ 8 (każdy zabity lub jawnie równoważny). Złoty skrót `p6_k5loop_wiring_a` zmieniony tylko z uzasadnieniem w kodzie i raporcie.

## BRAMKI (EXIT 0)
`cargo fmt --all -- --check`; `cargo clippy --all-targets -- -D warnings`; `p6_k5loop_wiring_a`, `p6_k5loop_wiring_a_pin`, `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_*`, `p6_battle_setup*`, `bridge_contract`; pełny `cargo test --all-targets --no-fail-fast` przed werdyktem. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` z nazwą tematu (UNIKALNE nazwy plików i targetów — scratchpad jest współdzielony), w tle `setsid nohup`; po bramce usuń własny target.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak linii Co-Authored-By z nazwą modelu (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; sekcja „Długi”.
