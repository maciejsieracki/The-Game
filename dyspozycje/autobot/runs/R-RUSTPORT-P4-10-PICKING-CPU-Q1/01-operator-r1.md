STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-10-PICKING-CPU-Q1
GOAL: RR-T3 — picking CPU (piksel → heks/jednostka) w `rust-port/renderer/src/pick/**`, 1:1 z webem (`picker.ts`, `camera.ts`, `hexutil.ts`, `scene.ts`, `main.ts` `pickHexAt`/`pickMapTarget`) wraz z dziwactwami P4-3 §3.5–3.8 (D-RR-3: odtworzone 1:1).
ZMIANY/COMMIT: `src/pick.rs` → `src/pick/mod.rs` + `src/pick/{three,hex,camera,raycast,terrain}.rs`; `tests/pick_golden.rs`; `tests/fixtures/pick/{golden_pick,scenes,geometry,math}.json, gen.ts, README.md`; `dyspozycje/rust-port/p4/P4-10-PICKING-CPU.md`; ten raport. `lib.rs`, `Cargo.toml`, `Cargo.lock` bez zmian. SHA kodu: `83fb9309` (commit w worktree, bez push); dokumentacja w osobnym commicie.
TESTY: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0; `cargo test --locked --all-targets` EXIT=0 (pick_golden 7/7); dodatkowo clippy `--features gpu` EXIT=0. Złoty zestaw: 20 174/20 174 punktów zgodnych (100%), 275 promieni + 55×3 macierze kamery + 380 macierzy instancji + 6 geometrii pryzmów bitowo równe Three.js; 1 233 `worldToAxial` (oba warianty), 23 `Math.round`, 6 NDC. Test mutacyjny: 9/9 mutacji wykrytych. Pełne surowe logi: P4-10 §8.
BLOKADY: brak. `NIE_ZMIERZONO` (P4-10 §5): realna scena gry i realne modele jednostek (harness = moduły weba + dosłowne kopie, jednostki syntetyczne), libm Windows/macOS, wydajność na mapach 320k, gałęzie `UnresolvedTopFace`/`FirstVisibleHit` (nieosiągalne).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5 medium) — ocena P4-10 i kodu; weryfikacja na realnym webie wg P4-10 §5 pkt 1–3 po zgodzie właściciela na harness.
DEPLOY/PUSH: NIE WYKONANO
