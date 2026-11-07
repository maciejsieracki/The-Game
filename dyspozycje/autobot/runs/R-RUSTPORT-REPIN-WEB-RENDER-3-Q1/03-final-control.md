STATUS: PASS-WITH-NOTES (Final Control r1; technical BLOCK B1 confirmed and handed to the orchestrator; GOAL not reached in rust-port/renderer)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-RENDER-3-Q1
GOAL: REPIN of render 3D-3. Move the `gra/src/render` changes from web `86d510c66` to `9b019a7d8` (FALA 509–532) into the Rust/Tauri port with image parity.

ZMIANY-COMMIT:
- Operator: code `63df58c18`, report `2809a5184`. Branch `rust-repin-web-render-3-q1`. Base `b520768b0` = merge-base = current tip of `origin/rust-port/parity-v2`.
- FC: this file only, on branch `rust-repin-web-render-3-q1-fc` (parent `2809a5184`).
- `git diff --name-only b520768b0 2809a5184` returns 5 files. All are on the allowlist:
  - `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WEB-RENDER-3-Q1/01-operator-r1.md`
  - `dyspozycje/rust-port/p5/P5-REPIN-WEB-RENDER-3.md`
  - `src-tauri/frontend-v2/package.json`: only 2 scripts added, `verify:repin-render3` and `verify:repin-render3:mutate`
  - `src-tauri/frontend-v2/tools/repin-render3-scope.json`
  - `src-tauri/frontend-v2/tools/verify-repin-render3-scope.mjs`
- Protected paths have an empty `git diff --stat`: `frontend-v2/src`, `gra`, `rust-port`, `src-tauri/src`, `WERSJE.md`, `gra-robocza`, `Cargo.*`.
- `git diff --check`: clean.

TESTY (re-run by FC myself on `2809a5184` after `npm ci`):
- `tsc --noEmit`: EXIT=0.
- `npm run check`: EXIT=0 (logic-imports 0 hits; pin 431/0; kblocks 37; UI-2 7/0).
- `verify:repin-render3`: OK (9 web files, 2 anchors), EXIT=0.
- `verify:repin-render3:mutate`: 12/12 killed, EXIT=0.
- Evidence I checked myself:
  - `git diff --stat 86d510c66 9b019a7d8 -- gra/src/render` lists 9 files (1095+/26-), matching the manifest.
  - `frontend-v2/src` contains only `assets`, `controller`, `ui`, `viewmodel`, `main.ts` and `vite-env.d.ts`. It has no `render/`, and `three` appears neither in `package.json` nor in any import.
  - L1: `map_style.rs:272` sets Medium `pixel_ratio_max: 1.5`; the web diff changes `pixelRatioMax` from 1.5 to 2.0.
  - L2: `merge_decor.rs:2` says "ONE non-indexed mesh"; web `mergeDecor.ts` has `indexIdenticalVertices`.
  - L3: `grep UnitRenderer rust-port/renderer/src` returns 0.
- Batch harnesses: these are a zero regression by construction, because `src` is identical to the base. NIE_ZMIERZONO by FC (no new run).
- NIE_ZMIERZONO, honestly marked by the Operator: Chromium, pixel test, draw calls, `run-newgame`.
- Cleanup: `node_modules` removed by explicit path.

ORZECZENIA:
- Evaluator objections: none.
- N1 (run-cycles 6401/1623 on the base): ODDAL. Not caused by this topic, since `src` is identical to `b520768b0`. Recommendation to the orchestrator: check it on parity-v2 as possible debt from merging UI-2-B…G.
- N2 (description of mergeDecor "K, image identical" vs. parity gap L2): ODDAL. It is buffer parity, not image parity. Clarify it in the follow-up topic.
- N3 (NIE_ZMIERZONO for measurements): ODDAL. Measuring is impossible without code in the renderer, and that is forbidden by the allowlist.
- Operator B1: confirmed. The target directory `src-tauri/frontend-v2/src/render/**` does not exist. The port's 3D is `rust-port/renderer` (wgpu), which is outside the allowlist.

BLOKADY: B1, the allowlist does not include `rust-port/renderer/**`. Decision for the orchestrator:
- either a follow-up topic `R-RUSTPORT-REPIN-WEB-RENDER-3-RUST-Q1` (L1 + L2 now, L3 after the unit compositor is ported), with an allowlist of `rust-port/renderer/**` and the `core_web_parity.rs` vector updated to 2.0;
- or ADDENDUM r2.
This is not a product decision.

INTEGRACJA:
- Final SHA: the FC commit on `rust-repin-web-render-3-q1-fc`.
- Fast-forward on `origin/rust-port/parity-v2` (`b520768b0`). No conflicts.
- Order against the parallel `R-RUSTPORT-REPIN-WEB-UI-3-Q1`: either one can go first. Shared file: `package.json`, where both add scripts at the end of `scripts`, so expect a trivial conflict resolved by keeping both sides.

RUNDY: 1/5
NASTĘPNY KROK: Orchestrator integration (FF) and a dispatch of the follow-up topic for L1/L2/L3.
DEPLOY-PUSH: NIE WYKONANO
