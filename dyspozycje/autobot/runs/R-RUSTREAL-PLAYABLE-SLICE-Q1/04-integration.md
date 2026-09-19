# 04 — integration receipt — R-RUSTREAL-PLAYABLE-SLICE-Q1

STATUS: INTEGRATED_LOCAL
DOMAIN: GAME / RUST / TAURI
TEMAT: R-RUSTREAL-PLAYABLE-SLICE-Q1
FINAL_CONTROL: `t_ea768507` / run827 — PASS-WITH-NOTES, product_acceptance=true, READY_FOR_INTEGRATION
INTEGRATION_WORKTREE: `/home/ubuntu/projects/The-Game-rust-playable-slice-integration-20260919`
INTEGRATION_BRANCH: `hermes/integration/R-RUSTREAL-PLAYABLE-SLICE-Q1-20260919`
BASE: `origin/autobot/real24-staging` @ `dca61418522bd309a9b089f6c0d4bf2ef34a6970`
INTEGRATED_COMMIT: `bfec6c68a8259ca82cf805f57c74106e1dfe4a10`

## Integrated allowlist

Only the ten accepted playable-slice paths were applied and committed:

- `rust-port/engine/src/bridge.rs`
- `rust-port/engine/src/domain/mod.rs`
- `rust-port/engine/src/domain/playable.rs`
- `rust-port/engine/src/lib.rs`
- `rust-port/engine/tests/playable_slice.rs`
- `src-tauri/frontend/index.html`
- `src-tauri/frontend/main.js`
- `tests/bridge_contract.cjs`
- `tests/bridge_contract.rs`
- `tests/frontend_contract.cjs`

No `gra/**`, `gra-robocza/**`, `.github/**`, WERSJE, handoff, Cargo.lock or
other unrelated path was committed. The generated `rust-port/engine/Cargo.lock`
was removed as an out-of-allowlist test artifact after the gates.

## Integrated-tree gates

- Rust fmt: PASS
- Rust `cargo test --all-targets --offline`: PASS; all harnesses, playable slice `7/7`, benchmark harnesses `4/4`
- Rust Clippy `-D warnings`: PASS
- frontend/bridge Node syntax: PASS
- frontend contract: PASS
- frontend DOM/Tauri runtime probe: PASS
- Linux `cargo build --manifest-path src-tauri/Cargo.toml --offline`: PASS
- bounded Tauri startup: process alive for 12 seconds; expected timeout `124`
- prewarmed bridge/mock-shell against integrated tree: PASS; Rust `6/6`, frontend PASS, mock-shell `1/1`, mutation controls PASS
- `git diff --check`: PASS

Evidence log: `/tmp/the-game-playable-integration-remedy/gates.log`
Evidence log SHA-256: `13bc31903e1a48e55a6bbc3d69cb5668fd25ffd33c3783ffe0b08b82209bc1d0`

## Boundary

This is a local integration receipt only. The branch has not yet been pushed;
`origin/autobot/real24-staging`, `origin/main`, Windows MSI/NSIS packaging,
installation and deploy remain separate gates.
