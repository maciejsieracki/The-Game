# 01-change-intent — AF4 fresh current-base integration

STATUS: INTEGRATION_PENDING
OWNER AUTHORIZATION: continue the open unit-sort/building-costs topics and push
only after current-base verification.

## Source and evidence

- Kanban process gates: `t_34f5bbcd` (building costs), `t_a8fe0b73` (unit sort);
- approved parents: building costs Final Control `t_ee41216b/run677`;
- approved parents: unit sort Final Control `t_b059ba6d/run655`;
- stale source worktrees were based on `25133ccb9367b1e0cc11e561065dfef08bed3f40`;
- integration base is current `origin/main=c08b3db14292221cad0a4e7a70608e9d09ee9afd`.

## Allowlist

Building-cost candidate:
- `gra/src/game/building-stock-cost.ts`;
- `gra/src/game/economy-upkeep.ts`;
- `gra/src/game/production.ts`;
- `gra/tools/building-epoch-cost-implementation-test.cjs`.

Unit-sort candidate:
- `gra/src/game/unit-power.ts`;
- `gra/src/main.ts`;
- `gra/src/ui/cityPanel.ts`;
- `gra/tools/unit-power-sort-test.cjs`.

Process-only artifacts are limited to this receipt and final verification records.
Do not copy stale `WERSJE.md`, `KANAL-PRACA.md`, `gra-robocza/**`, rally files,
or unrelated source/test changes from the old worktrees.

## Scope

Apply only the exact approved hunks. Building costs centralize the owner-approved
Stone ×1 / Bronze ×2 / Iron+ ×4 era multiplier across building stock, upkeep and
Praca cost. Unit sort adds stable descending field-power ordering at the approved
presentation call-sites without mutating the source roster.

## Exclusions

No broad economy rebalance, no new AI behavior, no Rust changes, no rally changes,
no KANON/FINALNA promotion, and no merge/push until the current-base gates pass.

## Regression gates

- focused building-cost implementation test;
- focused unit-power sort test;
- project-local TypeScript;
- existing logic regression;
- syntax checks for focused tests;
- direct Vite build;
- verifier/manifest/hash/readback only after integration.
