# DISPATCH R-RUSTPORT-P6-ZLOZA-B-PORT-Q1 (runda 1)

TEMAT: ZLOZA-B: port realizacji koszyka (transferBasketItems) — implementacja
DOMENA: GAME (implementacja). BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-ZLOZA-B-PORT-Q1`. Przed startem: `git checkout --detach 5e8b116e8` w worktree (ten SHA ma pierwszeństwo nad wszelkimi innymi).
Pin (tylko odczyt): `git show 07d2fbd72:<ścieżka>`.

## GOAL
Wdrożyć port `transferBasketItems` (pin `gra/src/main.ts:12566`) do Rust, zgodnie z sekcją ZLOZA-B (2a) w `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1-ROZPOZNANIE.md`. W Rust brak odpowiednika (koszyk `BasketItemKind::Deposit` tylko w wycenie, diplomacy.rs:2002). Parytet z wersją webową: gameplay wdrażamy 1:1 wg pina `07d2fbd72` (`gra/src`). Nie zmieniać zachowania poza pinem. Dostarczyć funkcję domenową z wektorami z pina (generator .mjs wykonujący pin). Wpięcie w produkcję (ZŁOŻA-C/wiring) NIE jest w zakresie tego tematu.

## ALLOWLISTA
- `rust-port/engine/src/domain/diplomacy*.rs (zmiany tylko w zakresie koszyka złóż; nowy moduł dopuszczalny, np. diplomacy_basket.rs)`
- `rust-port/engine/src/domain/mod.rs (wyłącznie deklaracja nowego modułu)`
- `rust-port/engine/tests/p6_zloza_basket*.rs (NOWE)`
- `rust-port/engine/tests/p6_zloza_basket_gen.mjs (NOWY)`
- `rust-port/engine/tests/p6_zloza_basket_vectors/** (NOWE)`
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: `gra/**`, `Cargo.toml`, `Cargo.lock`, push do parity, wpinanie w produkcję (poza zakresem), osłabianie asercji, `#[ignore]`.

## KRYTERIA KOŃCA
1) Wektory z pina generowane generatorem (SHA fragmentu pina w teście). 2) fmt, clippy -D warnings, cargo test --lib, nowe testy zielone. 3) Pełny cargo test --no-fail-fast przed FC: 0 failed. 4) Brak wpięcia w produkcję (test przy FC sprawdza to grepem).

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY (kody wyjścia)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Pełna bramka przed commitem. Commit bez linii Co-Authored-By z nazwą modelu, z `Claude-Session`. RUNDY: 1/5.
