# 02a-obrona — R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1 (runda 1, obrona Operatora)

STATUS: DECISION_REQUIRED (bez zmian kodu; zarzuty 1-3, 7 przyjęte, 4-6 i 8 przyjęte z uzupełnieniem pomiarem)
DOMAIN: GAME
TEMAT: R-RUSTPORT-ZAPIS-LOADER-MIGRATE-Q1
BAZA KODU: `a4087f332` (`rust-port/`, identyczne w `97a9b522e`; `git diff a4087f332 97a9b522e -- rust-port` = pusty)
ZMIANY/COMMIT: brak zmian kodu. Dodany wyłącznie ten plik. Usunięty nieśledzony wygenerowany `rust-port/engine/Cargo.lock`. Eksperyment `pub mod save_load; pub mod replay;` w `src/domain/mod.rs` cofnięty (przywrócony z kopii).

## Odpowiedzi na zarzuty

1. **Diagnoza potwierdzona** — PRZYJMUJĘ. Ponowny grep (`git grep -n "from_str::<SaveSnapshot>\|migrate_on_load" -- rust-port/engine/src`) daje trafienia tylko w `save_load.rs:575` (definicja) i `save_load.rs:640` (komentarz). Wzmianki w `war_turn_state.rs:21` nie sprawdzałem ponownie.

2. **Brak `save_load` i `replay` w bibliotece** — PRZYJMUJĘ. Ponowny eksperyment z przechwyconym kodem wyjścia: dopisanie `pub mod save_load;` i `pub mod replay;` do `src/domain/mod.rs`, potem `cargo check --lib` → **EXIT 0, 0 linii `^error`**. Blokadą nie jest kompilacja, tylko allowlista (`domain/mod.rs` poza allowlistą) i decyzja o API loadera. Poprzedni wniosek z raportu 01 był słabiej udokumentowany; teraz ma dowód.

3. **Kryterium 2 niespełnione, brak testu `p6_zapis_loader_migrate*`** — PRZYJMUJĘ. Kryterium 2 nie jest spełnione. Kryterium 1 spełnione tylko trywialnie (brak ścieżek produkcyjnych). Istniejące 10 testów `p6_zapis_migracje_snapshot_load` wywołuje `migrate_on_load` bezpośrednio, nie przez loader, więc nie zastępują kryterium 2.

4. **Operator nie uruchomił clippy ani `cargo test --lib` (NIE_ZMIERZONO)** — PRZYJMUJĘ i uzupełniam pomiarem na `97a9b522e` (kod identyczny z `a4087f332`), z kodami wyjścia:
   - `cargo fmt --check` → **EXIT 0**
   - `cargo clippy --all-targets -- -D warnings` → **EXIT 0** (`Finished dev profile`)
   - `cargo test --lib` → **EXIT 0**, `28 passed; 0 failed; 0 ignored`
   - `cargo test --test p6_zapis_migracje_snapshot_load` → **EXIT 0**, `10 passed; 0 failed; 0 ignored`
   - Zmienne: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; target usunięty po bramkach.
   - Test `p6_zapis_loader_migrate*` nie został napisany (brak loadera), więc nie uruchamiany.

5. **Słaby dowód eksperymentu (brak exit code)** — PRZYJMUJĘ i uzupełniam: patrz pkt 2, EXIT 0 zmierzony, zmiana cofnięta.

6. **Allowlista zachowana** — PRZYJMUJĘ. Potwierdzam `git diff --stat a4087f332 be9db6116` = jeden plik (`01-operator-r1.md`, +43). Brak `#[ignore]` i osłabionych asercji w zakresie tematu. Wpis `tests/p6_order_lane.rs:1530` przyjmuję z raportu Evaluatora, nie weryfikowałem go ponownie, bo jest poza tematem.

7. **DECISION_REQUIRED zasadne** — PRZYJMUJĘ. Kryterium 2 wymaga zmiany `domain/mod.rs` (poza allowlistą) i nowego publicznego API loadera, czyli decyzji właściciela. Operator nie wybiera A/B. Rekomendacja A z raportu 01 pozostaje: rozszerzyć allowlistę o `domain/mod.rs` i nowy plik loadera, test behawioralny na starym zapisie. Pomiar z pkt 2 pokazuje, że wariant A jest technicznie możliwy (kompiluje się bez błędów). Warningi `dead_code` przy `-D warnings` dla nowego kodu nie były mierzone (NIE_ZMIERZONO).

8. **Nieśledzony `Cargo.lock` i commit Evaluatora** — PRZYJMUJĘ. `Cargo.lock` usunięty z worktree i nie jest skomitowany. Commit `97a9b522e` zawiera wyłącznie `02-evaluator.md` (+28), nie kod. Commit lokalny, bez push.

## Stan po obronie
- Werdykt tematu: **DECISION_REQUIRED** (bez zmian). Potrzebne A/B od właściciela; po A nowy dispatch z rozszerzoną allowlistą.
- Nie wykonano: push, integracja, deploy, zmiana `gra/`, zmiany w `origin/main`. `rust-port/parity-v2` nietknięte.
- Procesowe: logi bramek zapisane poza repo w `/home/user/` (usunięte po pomiarze); `/tmp/x` użyty jako śmieciowy plik przy `cargo fmt` (usunięty).

NASTĘPNY KROK: orkiestrator — pytanie ABC do właściciela (A/B), zgodnie z raportem 01.
DEPLOY/PUSH: NIE WYKONANO
