# Operator response to Evaluator — active commander panel

**Stan: etap 6/11 — uwaga o selekcji sprawdzona i uzupełniona testem.**

Evaluator's note is valid for the first R4 run: it rendered production HTML with synthetic stack
cards but did not click the live active SidePanelHud. I extended
`tools/army-stack-commander-identity-test.cjs` to mount the actual production `createSidePanelHud`
in Chromium, pass it the active-panel HTML from `buildUnitContextTooltipHtml`, click the uniquely
marked commander card, and assert the real component's `onContextSelectUnit` callback receives
the exact commander ID for both `Wódz` and `Generał`. The test also checks `main.ts` still routes
that callback through `selectPlayerUnit(id, true, unitSideDetailExpanded)`.

Verification: **8/8 scenarios PASS**, including two Chromium click-through cases. The Evaluator's
remaining boundary still applies: this is the real production side-panel component and callback,
but not a booted full campaign that executes `selectPlayerUnit` against a live world state. That
limitation is retained in the record; it does not undo the proven display and component selection
path.

No product changes after the Evaluator's run, no merge, and no deploy/push. Next: independent
Operator Defense and Final Control on the stabilized diff.
