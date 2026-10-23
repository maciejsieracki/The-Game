STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-34-ANCHORS-DOM-Q1
GOAL: RR-T8e (P4-25 §2.3/§6) — etykiety DOM R4, R5, R15a, R15b rysowane w Rust na `Canvas2dLite` (układ bloków/flex, cienie, emoji wg D-TXT-3, wspólny mechanizm float label), zweryfikowane z Chromium 141 na prawdziwym DOM/CSS weba.
ZMIANY/COMMIT: baza `origin/rust-port/parity-v2` @ df3027b7; nowe `rust-port/renderer/src/labels/{mod,layout,shape,paint,anchor,style}.rs`; `src/lib.rs` +1 linia `pub mod labels;`; `tests/labels_{layout,scenes,anchors}.rs`; `tests/fixtures/labels/**` (2 898 057 B, manifest sha256, generator `gen.mjs`); `dyspozycje/rust-port/p4/P4-34-ANCHORS-DOM.md`; ten katalog (dowody). Bez zmian `Cargo.toml`/`Cargo.lock`, `gra/**`, `src-tauri/**`, `engine/**`, `raster/**`. SHA: `git log -1` w worktree (commit tej rundy).
TESTY: fmt/clippy (oba warianty)/test stable/test 1.87.0 — wszystkie EXIT=0 (`dowody/01-gates.log`); układ bit w bit: 45 scen (87 fragmentów) + 1 984 etykiet przeglądu, 0 różnic; piksele 45/45 w progach (SSIM min 0,9873, mean max 0,92, px>16 max 3,42 %), bez wyjątków; kotwice/animacja bit w bit (24+18+12+12+21+48); determinizm 8/8 identycznych (1.87.0/1.97.0 × debug/release × 2); mutacje 29/29 zabite; referencje Chromium odtworzone drugi raz — manifest identyczny.
BLOKADY: brak. Uwagi: dysk współdzielony bliski zapełnienia (jeden przebieg mutacji odrzucony, opisany w P4-34 §7); ocena wzrokowa w scenie GPU — NIE_ZMIERZONO (lista w P4-34 §10).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R-RUSTPORT-P4-34-ANCHORS-DOM-Q1, runda 1)
DEPLOY/PUSH: NIE WYKONANO
