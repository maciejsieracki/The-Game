STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-ARMIA-FOLLOW-AUTOMERGE-Q1
GOAL: REPIN web FALA 569 (R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1): port `followLeaderAutoMergeDecision` (+ `canJoinStackAt`, `ownUnitCountAt` z army-stack-limit.ts) do `rust-port/engine/src/domain/army_follow_auto_merge.rs`, wektory z uruchomionego weba, testy `p6_repin_armia_follow_*`.
ZMIANY/COMMIT: b927607b6 (rust-port/parity-v2 3b15849b5 + 1 commit). Pliki: `rust-port/engine/src/domain/army_follow_auto_merge.rs` (nowy), `domain/mod.rs` (+1 linia), `tests/p6_repin_armia_follow_auto_merge.rs` (nowy), `tests/p6_repin_armia_follow_gen.mjs` (nowy), `tests/p6_repin_armia_follow_vectors.json` (nowy, 3097 scenariuszy), `dyspozycje/rust-port/p6/P6-REPIN-ARMIA-FOLLOW-AUTOMERGE.md` (nowy: pomiar + port + bramki). Push: NIE WYKONANO.
TESTY:
- Wektory: generator Node 22.22 z `git archive origin/main gra/src` (cffe39cb9), 3097 scenariuszy (decyzje web: none 2531, merge 360, limit-blocked 206). Test wektorowy PASS (decyzja + canJoinStackAt).
- `cargo test --test p6_repin_armia_follow_auto_merge`: 6 passed, 0 failed.
- `cargo test --lib`: 22 passed, 0 failed.
- `cargo fmt -- --check`: PASS (rustfmt na nowych plikach).
- `cargo clippy --all-targets -- -D warnings`: PASS.
- Mutacja kontrolna (`<=` -> `<` w can_join_stack_at): 4 testy FAIL; po przywróceniu 6/6 PASS.
- `git diff --check`: czysto.
- Env: CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0, CARGO_TARGET_DIR w worktree (usunięty po bramkach).
BLOKADY: brak. Dług (nie BLOCK): brak wywołania w Rust (`promptMergeIfCoLocated` w web gra/src/main.ts:14518 -> decyzja :14574). Rust ma helper `co_located_for_merge_prompt` (recruitment.rs:560) bez wywołania. Podpięcie do W-serii.
ZALOŻENIA:
- `undefined` (followGeneral/isGeneral) -> `false`; równoważność potwierdzona wektorami z `null`.
- `limit` i64; wartości całkowite dodatnie.
- Brak wspólnej funkcji stack-limit w Rust (siege_enter_city.rs liczy room inline); nie ruszono siege, poza zakresem.
- Dispatch referował `dyspozycje/autobot/runs/.../00-dispatch.md` na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`; w tym worktree nie ma go w kopii, więc raport zapisano w nowym katalogu runu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) weryfikuje commit b927607b6 względem allowlisty i wektorów; potem Final Control; wpięcie monitu do W-serii jako osobny temat.
DEPLOY/PUSH: NIE WYKONANO
