# R-ARMY-STACK-COMMANDER-IDENTITY-Q1 — dispatch

TEMAT: `R-ARMY-STACK-COMMANDER-IDENTITY-Q1` · RUNDA: 1/5 · 2026-10-29 · DOMAIN: GAME
STATUS: **8/11 — Final Control PASS-WITH-NOTES** for the 2026-10-30 active-panel fix; exact integration is next. Receipt: `36-final-control-active-panel-20261030.md`. No Kanban is used in this project per owner decision `docs/decyzje/D-AUTOBOT-BEZ-KANBAN-THE-GAME-20261029.md`.
GOAL: In the map Army panel roster, the actual commander unit among a large stack is unmistakably labeled `Wódz` or `Generał` (and visually marked), so the player can select it. Preserve its actual type, model, combat role, stats, HP, and ordinary-unit labels.
WYZWALACZ: new owner screenshot/report (2026-10-29): army stack shows 89 cards named `Wojownik`; the army marker's star does not identify which individual is the commander.
RELATED HISTORY: `R-ARMY-COMMANDER-UNIT-LABEL-Q1` only proves the battle unit adapter/card label and is insufficient for this map roster surface. Reuse its findings, do not claim it fixes this screen.

## Acceptance

1. Production Army panel renderer marks exactly the commander card; all non-commanders retain ordinary labels.
2. Display title switches Wódz/Generał according to `Akademia wojskowa` using the existing canonical title helper.
3. Selecting the marked card selects the corresponding commander unit ID in the real map panel.
4. Test a large roster with multiple same-type units and verify unique identity, stable ordering/selection, and no stat/model changes; include ordinary Wódz and academy Generał.
5. Real Chromium screenshot and pointer test, source regression/mutation, typecheck/build, independent Evaluator and Final Control PASS.

## 11 stages

1. Registry/dispatch — DONE.
2. Scope/source reconciliation with previous battle-label ticket — DONE; map stack panel is separate from battle card.
3. Implement identity label/marker in Army stack card — DONE.
4. Production renderer and selection tests, large roster — DONE, 89 cards and both titles.
5. Chromium, typecheck/build/regression — DONE; see `operator-report.md`.
6. Independent Evaluator and operator response on active-panel selection — DONE; see `35-operator-evaluator-response-20261030.md`.
7. Independent Defense — PASS-WITH-NOTES for active renderer and exact-ID click-through (2026-10-30).
8. Final Control — PASS-WITH-NOTES; see `36-final-control-active-panel-20261030.md`.
9. Exact integration to main.
10. Robocza deploy, smoke, remote readback.
11. Push, receipt, registry close.

No changes to battle mechanics or commander statistics; no operator merge/deploy/push.
