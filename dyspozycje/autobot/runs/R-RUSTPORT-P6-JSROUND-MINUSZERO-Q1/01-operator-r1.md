STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JSROUND-MINUSZERO-Q1 (#231 / #166)
GOAL: Behawioralne pokrycie galezi ujemnego zera w `js_round` (combat.rs, modul `melee_phase`) z porownaniem bit-w-bit (`to_bits`) do wartosci pinowej `Math.round` (pin 07d2fbd72, combat.ts:1159 `finalDmg = Math.round(rawDmg * ctrAtkVsDef)`).
BAZA: f7baa3848 (= origin/rust-port/parity-v2), worktree detached.

ZMIANY/COMMIT: nowy plik `rust-port/engine/tests/p6_js_round_minus_zero.rs` (5 testow). Zero zmian w kodzie produkcyjnym (combat.rs przywrocony po mutacji; `git diff --stat` dla `rust-port/engine/src` pusty). Cargo.lock NIE commitowany (wygenerowany lokalnie, untracked).

WERYFIKACJA PINU (node):
- Object.is(Math.round(-0.4), -0) = true
- Object.is(Math.round(-0.5), -0) = true
- Object.is(Math.round(-0), -0) = true
- Math.round(0.5) = 1, Math.round(1.5) = 2
- Pin combat.ts:1159 i :1181: `Math.round(rawDmg * ctr...)` BEZ `Math.max(1, ...)` (w odroznieniu od battleScene.ts:8989, gdzie `max(1, ...)` ukrywa -0). Galaz -0 jest zatem obserwowalna w pinie i w `resolve_melee_phase` (pole `damage` kroku).

TESTY:
- `cargo test --test p6_js_round_minus_zero`: 5/5 PASS (-0.4 -> -0; -0.5 -> -0; -0.0 -> -0; 0.5 -> +1; 1.5 -> +2).
- MUTACJA (usuniecie galezi -0: `-0.0` -> `0.0` w js_round, combat.rs ok. linia 1378): 3 z 5 testow FAIL (below_half, at_negative_half, negative_zero_input); 2 kontrolne dodatnie PASS. Plik przywrocony z kopii; `git diff --stat` dla src pusty.
- `cargo fmt -- --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: 118 passed, 0 failed, 0 ignored.
- Target CARGO poza repo (scratchpad/target-jsround); do usuniecia po bramkach.

OBSERWACJA (nie naprawiana, poza zakresem): -0 w `js_round` nie zmienia HP celu (`hp -= -0` daje `hp`), wiec jedyny obserwowalny skutek to bit znaku pola `MeleeStep.damage`. Testy sprawdzaja wlasnie to pole.

BLOKADY: brak.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja testu czulosci i zgodnosci wartosci pinowych), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
