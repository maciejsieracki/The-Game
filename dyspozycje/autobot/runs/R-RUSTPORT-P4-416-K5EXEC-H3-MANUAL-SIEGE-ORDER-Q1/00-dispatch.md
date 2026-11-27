# R-RUSTPORT-P4-416-K5EXEC-H3-MANUAL-SIEGE-ORDER-Q1 — ręczny rozkaz oblężniczy gracza: `_performSiegeManualOrder` (pin :18435-18475) + `_trySiegeTowerClimb` (:8056) (zadanie #416, krok H3)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/silnik bitwy). Kolejka właściciela (zadania #416–#421, 2026-11-27); realizacja po jednym, po integracji #415.
BAZA: `origin/rust-port/parity-v2` po integracji #415 = `53e4188f2` (`git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`; sprawdź faktyczny SHA).

## STAN ZWERYFIKOWANY NA BAZIE (orkiestrator, 2026-11-27; zasada „najpierw sprawdź, czy dług istnieje")
Dług ISTNIEJE na `53e4188f2`:
- Brak w Rust funkcji odpowiadającej `_performSiegeManualOrder` (pin `battleScene.ts:18435-18475`): `player_order_move.rs` przyjmuje jej WYNIK jako `siege_manual_handled: bool` (wymaganie z wpisu #404: wołający przekazuje pełny wynik, `false` = gałąź `none` :18287-18296), ale nic go nie liczy.
- Brak portu `_trySiegeTowerClimb` (pin :8056): `git grep "fn .*climb"` w `rust-port/engine/src` = 0 trafień.
- Gotowe klocki (istnieją): `siege_tactics_tower.rs` (`siege_ram_tower_step` = pin `_siegeRamTowerStep` :8022; `siege_infantry_to_tower_step` = `_siegeInfantryToTowerStep` :8087), `siege_tactics_approach.rs` (`siege_approach_restricted` :7951, `siege_safe_approach`), `ranged_target_in_range`, `target_in_range`, `can_strike_target_from`, `do_attack`, `player_order_move.rs` (`perform_player_order`, T3) i `player_order_attack.rs` (T4); pole `on_wall_walkway` w `battle_setup_units.rs`.

## GOAL
NAJPIERW web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`): `_performSiegeManualOrder(ru, ord, done)` :18435-18475 — bramka `siegeWallCol >= 0 && ru.side == 'atk' && ord.type != 'move'`, inaczej `false`; maszyny oblężnicze (`isSiegeUnit`: taran przy zamkniętej bramie lub wieża → `_siegeRamTowerStep`, inaczej `false`); `doctrineAuto`; bezczynny strzelec (`ord=none && !doctrineAuto`: strzał `_rangedTargetInRange` jeśli `canShoot` i `shootingEnabled != false`, inaczej `false`); jednostka na pomoście muru (`onWallWalkway`: uderzenie `_targetInRange` albo `done`); `_trySiegeTowerClimb` (:8056); `_siegeInfantryToTowerStep`; ograniczone podejście `attack`/`attackMove` przy `_siegeApproachRestricted` (`_targetInRange` → `_doAttack`; cel; cel = pozycja → `none`; `_siegeSafeApproach`). Zadanie: port do Rust jako czysta funkcja zwracająca decyzję + wynik `handled: bool` zgodny z pinem, z wpięciem wyniku w `perform_player_order` (`siege_manual_handled`) w zakresie testów; port `_trySiegeTowerClimb`.

## DECYZJE TECHNICZNE (orkiestrator, wiążące; D-416-1..4)
- D-416-1: zakres wyłącznie H3 (`_performSiegeManualOrder` + `_trySiegeTowerClimb`). Poza zakresem: tryb ręczny gracza w ciele i kolejka rozkazów UI (T5/H4, #417), wektory bitew w czasie rzeczywistym.
- D-416-2: wzorzec = kod pinu; rozbieżność = jawny raport, nie „poprawka".
- D-416-3: **budżet czasu (wiążący; lekcje #406/#414):** dowód = wektory KROKU wykonane z tekstu pinu na czystej funkcji (jak `attack_order_step_vectors.json` z #415: generator wykonuje `_performSiegeManualOrder` na przygotowanych scenach z murem i wieżami, bez pełnej bitwy w czasie rzeczywistym). Bitew w czasie rzeczywistym NIE generujesz. Cały temat (4 role) ma się zmieścić w ≈ 3 h; przekroczenie = raport z tym, co jest.
- D-416-4: bramki engine fmt/clippy/pełny test; client i renderer tylko jeśli zmieniasz ich pliki (nie powinieneś).

## ALLOWLISTA
nowy `rust-port/engine/src/domain/player_order_siege_manual.rs` + wpis w `mod.rs`; dopiski w `player_order_move.rs` TYLKO w zakresie `siege_manual_handled` i jawnie uzasadnione; nowy `rust-port/engine/tests/p4_416_siege_manual_order.rs`; `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (dopiski: tryb wektorów kroku `siege_manual`, strażnik SHA-256 bez zmian); nowy `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/siege_manual_order_step_vectors.json`; raporty w katalogu runu. Istniejące pliki wektorów bez zmian treści. Plik inny (np. mechaniczna zmiana sygnatury w testach #404/#415): uzasadnij w raporcie.

## KRYTERIA KOŃCA
1. `_performSiegeManualOrder` zgodny z pinem na wektorach kroku we wszystkich gałęziach: bramka wstępna (`siegeWallCol < 0`, strona obrońcy, `move`), taran z otwartą/zamkniętą bramą, wieża, inne maszyny (`false`), strzelec bezczynny (strzał/brak celu/`shootingEnabled=false`), jednostka na pomoście, wspinaczka na wieżę, piechota do wieży, podejście ograniczone `attack`/`attackMove` (cel żywy/martwy/`fadingOut`, cel = pozycja, `_siegeSafeApproach` tak/nie), `false` w pozostałych.
2. `_trySiegeTowerClimb` zgodny z pinem na wektorach kroku.
3. Mutanty ≥ 8 (np. odwrócony warunek bramki, zła gałąź taranu, pominięty `shootingEnabled`, brak `onWallWalkway`, odwrócone `doctrineAuto`, zły `return` w podejściu ograniczonym, cel = pozycja bez `none`) zabite lub jawnie równoważne z uzasadnieniem.
4. Istniejące wektory (45 `vectors.json`, 288 `speed_vectors`, 40+14 `speed_change`, 74 `tower_due_order`, `move_order`, `attack_order`) i pełny `cargo test` engine bez regresji.
5. Raport z liczbami, jawną listą NIE_ZMIERZONO i mapą pozostałych kroków (H4/T5 #417) z numerami linii pinu.

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. Wymagane ≥ 8 GB wolnego, jeden build na raz. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Nie zostawiaj procesów cargo/node w tle po zakończeniu rundy.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, kontrakcie mostu, kliencie i rendererze, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).
