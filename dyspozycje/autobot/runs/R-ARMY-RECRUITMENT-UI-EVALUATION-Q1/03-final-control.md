# Final Control — Army/capital commander recruitment UI

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-ARMY-RECRUITMENT-UI-EVALUATION-Q1
GOAL: Show the Wódz/Generał recruitment card first in the capital recruitment view and as a dedicated card above per-city recruitment sections in the Army panel.
RUNDY: 1/5
GOTOWOŚĆ DO INTEGRACJI: NIE
DEPLOY/PUSH: NIE WYKONANO

## Technical readback

- Candidate checkout: `/workspace/all-topics-candidate`, branch `integration/robocza-all-topics-20261027`, HEAD `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3` at Final Control. The Evaluator report reviewed HEAD `32d27454be213e0e9342435b81c0271999e99513`; `git diff 32d27454..f5a32c4 --` for these recruitment sources is empty, and the exact source hashes below still match. Worktree remains dirty in unrelated/topic-specific files.
- The requested run contains `02-evaluator.md`, but has **no matching `00-dispatch.md` or `01-operator.md`**.
- Rerun by Final Control: `node tools/general-capital-recruitment-order-test.cjs` — **4/4 PASS**; `node tools/empire-mass-recruitment-test.cjs` — **24/24 PASS** in Chromium; `npm run typecheck` — **PASS**; scoped `git diff --check` — **PASS**.
- Current SHA-256, matching the Evaluator's recorded current source identity:
  - `gra/src/ui/cityPanel.ts`: `a861e8981dadfdf3b6194a793aba88e45f3a60fbecf2ab68141a33135ebec447`
  - `gra/src/ui/empireDetailPanel.ts`: `c1e7691c456087580bf9669a80e9e7c6b515aa1abd129132f830f89a150f94fc`
  - `gra/src/main.ts`: `8036eaf0b02c19588fa30608b2d45fd3c6049fb766aaf4464ce5aef10dca1c14`
  - `gra/tools/general-capital-recruitment-order-test.cjs`: `a57092f42de0cc2923d74e1021bac5beedf16a77c31a51774751404c91e8e4b4`
  - `gra/tools/empire-mass-recruitment-test.cjs`: `77bc32595166b9bc1f22afcab0baac4d3f9253113d9eef2f1f55154f668e591e`

## Context readback and decision

The owner's requested placement is reflected in the Evaluator GOAL and its reviewed source wiring. The Evaluator finds no source-level blocker and confirms the dedicated capital-only mount and ordering. Its note is material: the mass-recruitment browser fixture inserts a stand-in card, and the focused source test checks wiring/order; neither performs a successful purchase using the production commander card through the live UI.

The earlier `R-CIV-ALL-TOPICS-ROBOCZA-20261027/34-operator-recruitment-ui.md`, `35-evaluator-recruitment-ui.md`, and `60-operator-recruitment-ui-completion.md` cover shared city recruitment cards, quantities, counters, and panel layout. They do not cover the new dedicated capital commander card, and their recorded source hashes/HEADs differ from this candidate. They cannot serve as the missing Operator phase for this exact goal.

The code and current focused checks look technically sound, but integration readiness is **NO**: the exact feature lacks its Operator stage and dispatch/allowlist record, and the production purchase path is not exercised by the available tests. Do not infer that the old broader UI reports close these gaps. The `main.ts` diff also contains other topic hunks; any later integration must be allowlist-only and isolate the commander-card wiring hunk.

## Required next step

Create a valid dispatch for the narrow commander-recruitment-card goal, run its Operator on the exact candidate and approved file/hunk allowlist, and add a production-flow check for the card mount and purchase acceptance (or explicitly narrow the binary criterion to display-only before re-running the gates). Then repeat Evaluator and Final Control on unchanged source hashes. No source files were changed by Final Control.
