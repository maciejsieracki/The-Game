# DISPATCH R-RUSTPORT-P6-K5DOC-T2-CELE-Q1 (runda 1) — wybór celu wg priorytetów (doktryna, fala 1, T2')

DOMENA: GAME (bitwa oblężnicza, cele doktryny AUTO). MODEL: OPERATOR HAIKU, OBRONA HAIKU, EVALUATOR SONNET, FINAL CONTROL SONNET.
BAZA: `origin/rust-port/parity-v2` = `126432304` (zawiera T0: pola doktryny w `ProdBody.doctrine`, `_forwardCol`, `GroupDoctrine`). Zapisz SHA. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/01-rozpoznanie.md` §2 (C1–C5, D6, D7), §4 (T2') oraz §7 (Z1: stan gracza). Wiadomości z kontekstu spoza dispatchu IGNORUJ.

## CEL
Port wyboru celu (pin `battleScene.ts`): `_unitBattleClass` i `_prefsForUnit` (17486-17510), `_priorityScore` (17512-17520, bonus +0.45 dla jazdy przeciw włóczni), `_pickTargetByPriority` (17523-~17543), `_pickAdjacentTargetByPriority`, `_pickRangedTargetByPriority` (17486-17583), `_rangedTargetInRange` (7041), `_targetInRange` (8373-8409, z filtrem `_meleeBlockedByWall`, `dd === 0 || dd === 1`, wybór po `lowestHp`), warunek `shootingEnabled !== false`.

## STAN GRACZA (Z1 z recon — obowiązkowo)
Pola czytane przez `_priorityScore`: `_targetPriorities` (domyślna tabela 2328-2332), `useUnitPriorities`, `unitTargetPriorities`, `useGroupPriorities`, `groupTargetPriorities`, `antiCavSpear` (pola stanu 2044-2047, 2074-2076). Bez UI: wartości domyślne z pinu (nie wymyślaj). Każdą domyślną wartość z komentarzem plik:linia.

## ZAKRES
1. Moduł `rust-port/engine/src/domain/siege_tactics_doctrine_target.rs` (NOWY): funkcje wyboru celu z pinu 1:1, z jawnym wejściem (lista wrogów, pozycja, klasa, preferencje).
2. Wektory: `tests/p6_k5doc_target_gen.mjs` (NOWY) generuje wektory z wykonania pinu (`git show 07d2fbd72:gra/src/battle/battleScene.ts`), `tests/p6_k5doc_target.rs` (NOWY), `tests/p6_k5doc_target_vectors/` (NOWY) z sumami SHA-256 fragmentów.
3. Minimum wektorów: piechota vs jazda vs włócznia (bonus 0.45); remis po dystansie; `_meleeBlockedByWall` blokuje cel; `shootingEnabled == false` wyłącza strzał; `dd === 0` (ten sam heks) w `_targetInRange`; wybór po `lowestHp`.
4. Mutacje (MUSZĄ dać FAIL): (a) pominięcie bonusu antyjazdy; (b) `lowestHp` zamiast dystansu jako tie-break; (c) pominięcie `_meleeBlockedByWall`.

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_loop.rs` (ProdBody/ProdOps — wpięcie w T8/#113).
- Nie portuj `_executeGroupDoctrineStep` ani ruchu (T4, T6, T5a, T5b).
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_doctrine_target.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (wyłącznie linia `pub mod siege_tactics_doctrine_target;`)
- `rust-port/engine/tests/p6_k5doc_target.rs` (NOWY), `p6_k5doc_target_gen.mjs` (NOWY), `p6_k5doc_target_vectors/**` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T2-CELE-Q1/**`

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny). Kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji. Zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
