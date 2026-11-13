# Deployment reconciliation — 2026-09-16

## Scope

- Repository: The-Game
- Board: `the-game-real24`
- Project: `p_9ae9ac64`
- Profile: `default`
- Clean source: `origin/main=329db81ff1622360699fdbb7fc56f2c721121c86`
- Last web source/deploy commit: `f49676987db865b90c7f61872f9ba32e95aa3537`
- Last ROBOCZA entry: `9d22166c` / `R-CITY-NAMES-SHARED-QUEUE-110-Q1`

## Web lane result

No new web deployment was required. The clean product diff from `f4967698` to `origin/main` contains only:

- `gra/tools/recruit-card-manpower-real-render-test.cjs`
- `gra/tools/recruit-card-stock-chip-real-render-test.cjs`

There is no new `gra/src/**` or `gra/data/**` gameplay diff.

Fresh checks in a clean worktree:

- `node ./node_modules/typescript/bin/tsc --noEmit` — PASS
- direct Vite build — PASS, `888` modules
- `node tools/verify-robocza-bundle.cjs` — `VERIFY OK`

Existing served bundle readback:

- file: `gra-robocza/Gra-ROBOCZA.html`
- MD5: `9d22166c7de999a12971a857d8cd3c65`
- SHA-256: `858e6763b77ebb93f7e29e4e5ff71a62d28d6ebc684971f59513f30eee1b116b`
- bytes: `69858494`

Corrected `gra-robocza/ROBOCZA-MANIFEST.json` stale SHA-256, byte count, source commit, scope and note. `WERSJE.md` receives no new release row because no new web bundle was published.

## Rust lane result

R20 local integration was independently rechecked:

- commit: `5dc5fddc5352ab2467efde76136f22403efe2f84`
- `cargo fmt --all -- --check` — PASS
- `cargo test --all-targets` — PASS
- `cargo clippy --all-targets -- -D warnings` — PASS
- `git diff --check` — PASS
- branch pushed: `hermes/R-RUSTREAL-20-SAVE-LOAD-Q1-RECOVERY-R2-20260915`
- remote readback: same commit SHA

Rust remains a separate rewrite lane and was not copied into or published as `gra-robocza` web content.

## Deliberately not done

- no second web bundle/build publication;
- no promotion to `gra-kanon` or `FINALNA`;
- no dispatch of workerless process-only gates;
- no merge of Rust into `main`;
- no changes to the dirty primary checkout.
