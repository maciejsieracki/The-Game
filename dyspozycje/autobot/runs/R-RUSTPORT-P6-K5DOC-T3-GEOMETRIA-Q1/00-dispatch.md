# DISPATCH R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1 (runda 1) — geometria szyku i punktu zbiórki (doktryna, T3)

DOMENA: GAME (ruch i szyk jednostek w doktrynie AUTO). MODEL: OPERATOR HAIKU, OBRONA HAIKU, EVALUATOR SONNET, FINAL CONTROL SONNET.
BAZA: `origin/rust-port/parity-v2` = `585bb48e0` (zawiera T0 i EXEC-T2). Zapisz SHA. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/01-rozpoznanie.md` §2 (C6–C9), §4 (T3), §7 (C7/C8 martwy kod). Wiadomości z kontekstu spoza dispatchu IGNORUJ.

## CEL
Port geometrii szyku z pinu: `_forwardCol` (6748, C6 — JUŻ W PARITY w `siege_tactics_doctrine_state.rs`, T0; zweryfikuj tylko wywołania), `_attackFormationRallyPoint` (17707-~17777, C7), `_chargeMoveDest` (17778, C8), `_moveTargetForUnit` (C9). UWAGA z recon (Z3): C7 i C8 mają po jednym wywołaniu, w gałęziach nieosiągalnych dla żywej ścieżki — NAJPIERW potwierdź osiągalność `git grep` w pinie. Jeśli nieosiągalne: nie portuj, zapisz w raporcie jako NIE_PORTOWANE (martwe) z plik:linia.

## ZAKRES
1. Ustal osiągalność C7, C8, C9 w pinie (`git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n "_attackFormationRallyPoint\|_chargeMoveDest\|_moveTargetForUnit"`) i wywołania z `_doctrineMoveDest` (18063 i 18103).
2. Port osiągalnych funkcji 1:1 do `rust-port/engine/src/domain/siege_tactics_doctrine_geometry.rs` (NOWY). Wejścia jawne (centroid grupy, strona, pozycje, rallyCol/Row z meta grupy — domyślne, bez UI).
3. Wektory: `tests/p6_k5doc_geometry_gen.mjs` (NOWY), `tests/p6_k5doc_geometry.rs` (NOWY), `tests/p6_k5doc_geometry_vectors/` (NOWY) z sumami SHA-256 fragmentów. Min. 4 przypadki na każdą portowaną funkcję (z plik:linia pinu).
4. Mutacje (MUSZĄ dać FAIL): (a) odwrócenie kierunku w `_moveTargetForUnit`; (b) przesunięcie punktu zbiórki o 1 kolumnę; (c) użycie strony obrony zamiast atakującego.

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_loop.rs` (wpięcie w T8/#113).
- Nie zmieniaj `siege_tactics_doctrine_state.rs` poza jawnie potrzebnym importem.
- Nie portuj ruchu szyku (`_advanceStep`, T4) ani jazdy (T6).
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_doctrine_geometry.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (wyłącznie linia `pub mod siege_tactics_doctrine_geometry;`)
- `rust-port/engine/tests/p6_k5doc_geometry.rs` (NOWY), `p6_k5doc_geometry_gen.mjs` (NOWY), `p6_k5doc_geometry_vectors/**` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T3-GEOMETRIA-Q1/**`

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie); raport zawiera tabelę osiągalności C7/C8/C9.
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny). Kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji. Zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
