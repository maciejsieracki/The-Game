# Evidence — H-HANDEL-DOCHOD-WLASNE-ZAGRANICZNE-Q1

Evidence collected from the clean worktree after commit `6acae028d1d745092c61458241469976322c8f5c`.

## Reproducible dependency gate

Command:

```text
npm ci
```

Result: exit 0. Installed 71 packages and audited 72 packages from `gra/package-lock.json`. `esbuild` resolved from the local worktree after being declared in `gra/package.json`. npm reported 5 audit findings (1 moderate, 4 high); no automatic audit fix was run because it could change dependency scope.

## Static and contract gates

```text
node --check tools/reproducible-build-contract-test.cjs  PASS
node --check smoke_test.cjs                               PASS
node --check tools/bundle-wiki-for-game.cjs               PASS
python3 compile check for tools/export-data.py             PASS
npm run typecheck                                          PASS
reproducible-build-contract-test                           6 passed, 0 failed
```

## Trade/economy gates

```text
trade-routes-ownership-income-test.cjs  10 passed, 0 failed
trade-routes-income-test.cjs            122 passed, 0 failed
trade-routes-limit-test.cjs              76 passed, 0 failed
trade-routes-hud-filter-test.cjs         59 passed, 0 failed
cuda-handel-test.cjs                      26 passed, 0 failed
```

## Build gate

```text
npm run build
```

Result: exit 0. `prebuild` ran only `node tools/bundle-wiki-for-game.cjs`; it did not invoke `export-data.py`. Vite transformed 888 modules and produced `dist/index.html` at approximately 69,760.61 kB. A second build produced no change to the tracked `gra/src/data/wikiBundle.json`.

## Repository gate

```text
git diff --check  PASS
git status --short --branch  clean
```

Final readback before report creation:

```text
branch: hermes/H-HANDEL-DOCHOD-WLASNE-ZAGRANICZNE-Q1
HEAD:   6acae028d1d745092c61458241469976322c8f5c
base:   d9363733682e0f3ddfad9e3ae3ff4714bbb24510
ahead:  2 commits
```

The local run did not perform live Kanban dispatch/readback, Desktop runtime verification, push, PR, merge, deploy, or live installation. Those remain the operator/orchestrator gates.
