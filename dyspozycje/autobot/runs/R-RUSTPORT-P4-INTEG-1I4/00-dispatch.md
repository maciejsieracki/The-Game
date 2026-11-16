# DISPATCH R-RUSTPORT-P4-INTEG-1I4 (runda 1) — integracja FC I4 BATTLE-CONSUMER na parity (#293, PRIO-3D-9)

MODEL: OPUS (temat 3D, renderer). BAZA: `origin/rust-port/parity-v2` = `9a71caf8a` (zawiera 1F3, 1F4, 1F5, F6, I2, I3). Worktree detached.
ŹRÓDŁO: FC I4 = `54fa4c704` (PASS-WITH-NOTES; kod `cb1f45508`; łańcuch 54fa4c704 → 7d02b0235 → cb1f45508 → e33dd639d → 2fd81ed76 → 84bfcfe84 → baza 0deb9a075, który jest na parity). Merge-tree I4 -> 9a71caf8a: CZYSTY.

## ZAKRES
1. `git merge --no-ff 54fa4c704` na worktree z 9a71caf8a. Jeśli konflikt — zachować obie strony; nie zmieniać semantyki.
2. Pliki I4 (renderer): `rust-port/renderer/src/battle/playback.rs`, `rust-port/renderer/src/battle/mod.rs` (+ `pub mod playback;`), `rust-port/renderer/tests/battle_playback.rs`, raport.

## BRAMKI
- rust-port/renderer: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny).
- rust-port/engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast` w tle (setsid nohup). 
- Zmienne: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie. df >= 8 GB przed każdą bramką.

## NIE ROBIĆ
- Nie zmieniać kodu I4 poza konfliktem. Nie pushować do parity. Nie commitować Cargo.lock. Nie używać git add -A.
- Uwagi FC (do rejestru, nie do naprawy): apply_snapshot musi być wołane po FF przez sterownik P5; brak wołającego produkcyjnego; Kill ustawia HP=0 (rewizja w I5).

## KRYTERIA KOŃCA
- Bramki zielone w renderer i engine; zwróć SHA merge, EXIT każdej bramki, sumy test result, konflikty, verdict PASS albo FAIL/BLOCK.
