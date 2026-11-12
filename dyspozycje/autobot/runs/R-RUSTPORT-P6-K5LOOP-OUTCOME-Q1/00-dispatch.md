# DISPATCH R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1 (runda 1)

TEMAT: K5LOOP-OUTCOME — `_resolveBlowOutcome` (morale, rout, engaged po ciosie), `_targetInRange`, `BLOW_HIT_T` (zadanie #109). Warunek wstępny dla WYLOM (#98), który zwrócił BLOCK.
DOMENA: GAME. Baza: 23e33793e (czubek origin/rust-port/parity-v2). Worktree na `wip/R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/battle/battleScene.ts` — `_resolveBlowOutcome`, `_targetInRange`, `BLOW_HIT_T` (użyj `grep -n`). UWAGA: `gra/src/main.ts` nie zawiera tych funkcji.

KROK 0 (obowiązkowy): `git grep` w `rust-port/engine/src` na `resolve_blow_outcome`, `target_in_range`, `BLOW_HIT_T`, `unported` w `siege_tactics_loop.rs` (komentarze ok. L375-377 i L777-780 wskazują brakujące efekty po ciosie). Jeśli już podpięte — zamknij PASS z dowodem.

GOAL: efekty po ciosie (morale, rout, engaged) w produkcyjnej ścieżce `ProdBody::strike` zgodnie z pinem; usuń `unported` dla tych efektów.

ALLOWLISTA:
- rust-port/engine/src/domain/siege_tactics_loop.rs
- rust-port/engine/src/domain/siege_tactics_blow.rs (tylko wywołanie `resolve_outcome`, jeśli potrzebne)
- rust-port/engine/tests/p6_k5loop_outcome*.rs (nowy test)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-OUTCOME-Q1/01-operator-r1.md

KRYTERIA KOŃCA:
1. Produkcyjne wołanie `resolve_outcome`/odpowiednika w `strike` (numer linii Rust i pin battleScene.ts).
2. Test z wektorami pinu (generator .mjs, strażnik SHA-256 wyciętych fragmentów), liczniki niepustości > 0.
3. Brak `#[ignore]`, brak osłabionych asercji, brak martwego wrappera.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; nowy test; `cargo test --test 'p6_siege*'`.
5. Jeśli efekt wymaga zależności spoza allowlisty — BLOCK z dowodem, bez zmian w kodzie.

NIE WOLNO: pushować do parity, integrować, dotykać `gra/`/`origin/main`, commitować `Cargo.lock`, `git add -A`. Commit bez nazwy modelu; ostatnia linia: `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
