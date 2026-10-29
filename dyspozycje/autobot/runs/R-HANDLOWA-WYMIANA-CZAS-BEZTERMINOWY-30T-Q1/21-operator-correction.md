# 21 — Operator correction after evaluator scope finding

- Finding: shared duration markup applied the cyclic exchange max-30 and permanent option to `hasResourceAccess` baskets too.
- Fix: the UI now selects the new controls only when access is absent and the basket is in per-turn quantity exchange (or its preselection mode). Resource-access controls retain the prior max 20 and legacy `+100` stepper, with no `Bezterminowo` button.
- Validation also keeps the 20-turn cap for access-mode forms and the 30-turn cap for cyclic quantity exchange.
- Regression: `diplomacy-cyclic-trade-duration-ui-test.cjs` checks cyclic max-30/permanent and access max-20/no-permanent; 12/12 PASS.
- `npm run typecheck` PASS; cyclic domain test 53/53 PASS; `git diff --check` PASS.
- Status: ready for Evaluator re-review. No Final Control, merge, push, or deployment yet.
