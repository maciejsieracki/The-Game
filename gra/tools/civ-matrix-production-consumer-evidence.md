# Production civ-matrix consumer evidence

Date: 2026-09-24
Kanban: t_60f63d49
Base: a8c9cf6c181f688201dd45e6a5871da1b0eb1301

Runtime wiring:
- `gra/src/game/production.ts` consumes all five exact parameter IDs.
- `gra/src/main.ts` resolves `civKeyForOwnerId(ownerId)` for player, AI, and city-state owners and passes `ProductionMatrixOptions` into production/recruitment item creation, auto-build/auto-manager selection, AI `availableProduction`, and live turn advancement.
- `gra/src/ui/cityPanel.ts` passes the owner civ key into availability/cost preview and `rushCost`.
- No civ values were duplicated; resolution remains in `civ-matrix.ts`/`civ-matrix.json`.
- Legacy building and recruitment discounts are not double-stacked when matrix options are present.
- Recruitment carries fractional throughput in `CityProduction.rekrutacjaPostep`.

Focused runtime test:

    ESBUILD_MODULE=/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-produkcja-20260923/gra/node_modules/esbuild node tools/civ-matrix-production-consumer-test.cjs

Result: 19 passed, 0 failed.

Real runtime integration gate (Evaluator correction):

    node tools/civ-matrix-production-runtime-live-test.cjs

Result: 112 passed, 0 failed in a real Vite bundle and headless Chromium.

Coverage includes:
- real `main.ts` owner resolution for player and AI, plus the city-state marker path;
- real `runWorldEndTurn()` production call-sites for every live owner;
- live auto-build selection through the real owner context, with the Roman matrix building-cost adjustment compared with a no-matrix baseline;
- live AI/city-state owner path exercises the same `availableProduction` callback wiring used by the decision loop;
- real city-panel opening, owner civ-key readback, and matrix-priced Wykup action;
- all 15 civ rows and all five exact production parameters consumed by the bundled resolver;
- actual neutral, +20% building-cost, and +10% unit-cost matrix rows;
- the focused pure-consumer gate still retains explicit neutral and +/-10% assertions.

Coverage includes:
- 15 civ rows loaded from `data/civ-matrix.json`.
- neutral, +10%, and -10% injected resolver scenarios (focused gate only).
- building work cost, unit purchase cost, building/unit production speed, fractional recruitment throughput, and rush cost.
- all five exact parameter IDs observed through the runtime resolver.

Additional gates:

    node tools/logic-test.cjs                       LOGIC OK (213/213)
    absolute tsc --noEmit                           no new errors in modified production/civ-matrix/cityPanel modules; repository has pre-existing unrelated audio/Three.js errors
    git diff --check                                PASS
    JSON.parse(data/civ-matrix.json)                PASS

The test bundle and temporary esbuild symlink were removed after execution. No commit, push, merge, deploy, data-file, `ai_*`, or save-schema changes were made.
