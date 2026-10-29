# Operator report — R-ARMY-STACK-COMMANDER-IDENTITY-Q1

## Change

- The map Army stack state builder now derives the commander card title from the runtime `isGeneral` flag and the canonical `armyLeaderTitle(empireBuiltIdsForOwner(...))` helper.
- The commander card displays `Wódz` or `Generał`, retains the actual unit type as a secondary line, and has a gold star, highlighted border, accessible label, and tooltip.
- `data-unit` and the existing click/Enter handler are unchanged, so selecting the leader resolves to the original runtime unit ID. Unit icon, movement, HP, combat body, and ordinary card labels remain as before.
- This is the map stack roster, distinct from the previously covered BattleScene card.

## Verification

- `node tools/army-stack-commander-identity-test.cjs` — PASS (3/3): Chromium rendered 89 same-type cards; pointer selected the exact leader ID for both Wódz and Generał; only one marked card existed; ordinary labels and type remained; movement/stats remained; a mutation disabling `isGeneral` mapping was rejected.
- `node ./node_modules/typescript/bin/tsc --noEmit` — PASS.
- `node ./node_modules/vite/bin/vite.js build --outDir /tmp/army-stack-commander-identity-build --emptyOutDir` — PASS (917 modules transformed, production bundle emitted outside the repository).
- `git diff --check` — PASS.

## Handoff

Implementation and operator checks are complete. Independent Evaluator, Operator Defense if needed, Final Control, integration, deployment, and push remain outside this operator assignment.
