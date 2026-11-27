# R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1 — tryb ręczny gracza w ciele bitwy, część A: stan i wykonanie rozkazów (zadanie #417A, krok H4/T5)

STATUS: dispatch orkiestratora. **Modele (decyzja właściciela 2026-11-27): Operator = Sonnet 5.5, Obrona = Sonnet 5.5 (zawsze ten sam model co Operator), Evaluator = Sonnet 5.5, Final Control = Sonnet 5.5** — to praca programistyczna wokół 3D (silnik), nie grafika. Skrypt `r-rustport-generic-sonnet-wf.js`. Praca w dwóch częściach: to jest część A; część B (#422) = wektory bitew z rozkazem gracza + wołający produkcyjny, startuje po integracji A.
BAZA: `origin/rust-port/parity-v2` po integracji #416 = `617185ba8` (`git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`; sprawdź faktyczny SHA).

## STAN ZWERYFIKOWANY NA BAZIE (orkiestrator, 2026-11-27; zasada „najpierw sprawdź, czy dług istnieje")
Dług ISTNIEJE na `617185ba8`:
- `ProdOps` (`rust-port/engine/src/domain/siege_tactics_loop.rs`, ok. :1616 i :6030) trzyma `player_order: PlayerOrder::None` na stałe; `ProdOps::perform_player_order` (:1630) zwraca tylko `perform_player_order_returns(self.player_order)`, bez wykonania treści rozkazu. Ciało odcina tryb ręczny jawnym tagiem `tryb-reczny` PRZED maszyną (:5898); `manual_mode: false` jest wpisane na sztywno w `siege_battle_session.rs:1117` i `siege_battle_adapter_body.rs:454`.
- Gotowe klocki (zintegrowane, mają wektory z pinu): `player_order_move.rs` (`perform_player_order`: `hold`/`none`/`move`, #404), `player_order_attack.rs` (`attack`/`attackMove`, #415), `player_order_siege_manual.rs` (`_performSiegeManualOrder`, #416), `player_order_move_gate.rs`, `player_order_queue.rs` (`execute_units_immediate`, trait `PlayerOrderExec`, #266), `siege_tactics_turnseq.rs` (`activation_done`, `queued_order_ids`, `player_unit_idle`), `siege_tactics_activate.rs` (:238 gałąź `scene.manual_mode && scene.is_player_side` → `perform_player_order`).
- Dług przeniesiony z #416 (Evaluator N1/N2, wiążące dla H4): wyniki `_rangedTargetInRange`, `_targetInRange`, `_siegeSafeApproach` były w wektorach #416 brane z pinu (`PinTargets`), nie z portów Rust — porty: `siege_tactics_doctrine_target.rs:330/368`, `siege_tactics_approach.rs:231`.

## GOAL (część A)
NAJPIERW web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`/`git grep`): `_isUnitDoctrineAuto` :17621-17640, `_activateUnit` :6024-6110 (wejście do `_performPlayerOrder` :6068, reset rozkazu :6093), `_performPlayerOrder` :18280-18428, `_executeUnitsImmediate` :18578-18614, `_ensureGroupMeta` :17586, ustawianie `ru.playerOrder` (`git grep -n "playerOrder ="`).
Zadanie: w ciele bitwy (`ProdBody`/`ProdOps`) dodaj **stan trybu ręcznego i wykonanie rozkazów gracza**: (1) stan per jednostka `player_order` (typ `PlayerOrder` z #404/#415) zamiast stałego `None` oraz flaga `manual_mode`/`is_player_side` sterowalna przez API ciała (domyślnie wyłączona — dotychczasowe zachowanie i WSZYSTKIE istniejące wektory bez zmian); (2) `ProdOps::perform_player_order` liczy prawdziwy wynik przez `perform_player_order` (T3/T4/H3) z **prawdziwymi predykatami** (porty Rust zamiast wartości z pinu: warunek wpięcia z #416 N1) i aplikuje skutki (ruch/atak/oblężenie ręczne) w ciele; (3) ciało implementuje `PlayerOrderExec` dla kolejki `execute_units_immediate` (busy-gate, `mark_acted`, odświeżenie wizualiów kolejki); (4) tag `tryb-reczny` zostaje wyłącznie dla przypadków jawnie niepokrytych — wymień je w raporcie.

## DECYZJE TECHNICZNE (orkiestrator, wiążące; D-417A-1..4)
- D-417A-1: zakres = stan + wykonanie + kolejka w ciele. Poza zakresem (część B, #422): wektory bitew w czasie rzeczywistym z rozkazem gracza, wołający produkcyjny (API sesji dla UI), decyzja o ścieżce atomowej `move_order_exec && !march_incremental`.
- D-417A-2: wzorzec = kod pinu; rozbieżność = jawny raport, nie „poprawka". Nowy kod w NOWYM module (np. `siege_prod_manual.rs`) + minimalne, uzasadnione dopiski w `siege_tactics_loop.rs` (plik ma >10 tys. linii — nie przebudowuj).
- D-417A-3: **dowód = wektory KROKU z wykonania tekstu pinu na czystych funkcjach** (jak `attack_order_step_vectors.json`), bez bitew w czasie rzeczywistym (30–80 s każda; pin :6093 zeruje `playerOrder` w AUTO, a doktryna emituje tylko `move`, więc bitwy z rozkazem gracza to część B). Strażnik SHA-256 generatora `3eeeb760…` ma pozostać bez zmian; nowe tryby za flagą środowiska.
- D-417A-4: **mutanty zawsze na pliku produkcyjnym, nie na kopii funkcji w teście** (zasada z Przebiegu #416). Bramki engine fmt/clippy/pełny test.
- Budżet: cały temat (4 role) ≈ 3 h; przekroczenie = raport z tym, co jest.

## ALLOWLISTA
nowy `rust-port/engine/src/domain/siege_prod_manual.rs` (lub zbliżona nazwa) + wpis w `mod.rs`; uzasadnione dopiski w `siege_tactics_loop.rs` (`ProdOps.player_order`, `ProdBody` — tylko to, co konieczne), ewentualnie `siege_battle_adapter_body.rs`/`siege_battle_session.rs` TYLKO dla przekazania flagi (domyślnie wyłączona); nowy `rust-port/engine/tests/p4_417a_manual_mode_state.rs`; `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (dopiski za flagą, strażnik SHA-256 bez zmian); nowe pliki wektorów w `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/`; raporty w katalogu runu. Istniejące pliki wektorów bez zmian treści. Plik spoza listy: uzasadnij w raporcie.

## KRYTERIA KOŃCA
1. Z `manual_mode` wyłączonym zachowanie ciała i wszystkie istniejące wektory (45 `vectors.json`, 288 `speed_vectors`, 40+14 `speed_change`, 74 `tower_due_order`, `move_order`, `attack_order`, `siege_manual_order`) bez regresji; pełny `cargo test` engine zielony.
2. Z `manual_mode` włączonym `ProdOps::perform_player_order` zgodny z pinem na wektorach kroku dla rozkazów `hold`/`none`/`move`/`attack`/`attackMove`/oblężenie ręczne, z predykatami liczonymi portami Rust; porównanie `fx` dla `_siegeSafeApproach` nie jest tautologią.
3. Kolejka `execute_units_immediate` wykonuje rozkazy na ciele (busy-gate, `acted`, odświeżenie wizualiów) zgodnie z pinem na wektorach kroku.
4. Progi pokrycia rozbite na podprzyczyny (`dead`, `fadingOut`, `routed`, cel = pozycja także dla `attack`) — warunek z Obrony #416.
5. Mutanty ≥ 10 na pliku produkcyjnym zabite lub jawnie równoważne z uzasadnieniem.
6. Raport z liczbami, jawną listą NIE_ZMIERZONO i mapą kroków części B (#422) z numerami linii pinu.

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. Wymagane ≥ 8 GB wolnego, jeden build na raz. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Nie zostawiaj procesów cargo/node w tle po zakończeniu rundy.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, kontrakcie mostu, kliencie i rendererze, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).
