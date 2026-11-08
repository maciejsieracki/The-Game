# Evaluator — Army/Capital commander recruitment UI

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-ARMY-RECRUITMENT-UI-EVALUATION-Q1
GOAL: The capital recruitment view exposes Wódz/Generał at the top, and the main Army view exposes a dedicated commander card above its per-city recruitment sections while retaining each city's shared recruitment cards and counters.
ZMIANY/COMMIT: Review-only; no product or test edits. Candidate HEAD `32d27454be213e0e9342435b81c0271999e99513` (`integration/robocza-all-topics-20261027`), with a dirty working tree.

## Independent findings

- `mountGeneralRecruitmentCardForArmy()` renders the special offer using the common `buildUnitRecruitCard`, caps quantity at 1, and displays the era-dependent Wódz/Generał label, alive/limit/queue counts, manpower, stock and disabled reason.
- The offer provider returns an offer only for the owner's capital. Non-capital city recruitment lists therefore do not receive a commander row.
- In the city recruitment list the commander card is mounted before ordinary recruitable units. In the main Army panel, `mountGeneralRecruitment` mounts a separate capital offer into the dedicated card above the city list. This matches the two requested entry points.
- The purchase callback enters the existing `purchaseRecruitmentUnit(..., { isGeneral: true })` transaction. Resource/manpower/stock checks are performed before mutation in the shared purchase path.
- No source-level blocker was found in the reviewed wiring. The existing Army mass-recruitment fixture inserts a stand-in commander card through its mount callback; it does not execute the production commander card or complete an actual in-game purchase. The focused source test also checks ordering/wiring, not live era transitions or purchase acceptance. This is a coverage note, not a reproduced defect.

## Verification

- `node gra/tools/general-capital-recruitment-order-test.cjs` — 4/4 PASS.
- `node gra/tools/empire-mass-recruitment-test.cjs` — 24/24 PASS in Chromium.
- `git diff --check` for reviewed files — PASS.
- Exact SHA-256 at review time:
  - `gra/src/ui/cityPanel.ts`: `a861e8981dadfdf3b6194a793aba88e45f3a60fbecf2ab68141a33135ebec447`
  - `gra/src/ui/empireDetailPanel.ts`: `c1e7691c456087580bf9669a80e9e7c6b515aa1abd129132f830f89a150f94fc`
  - `gra/src/main.ts`: `8036eaf0b02c19588fa30608b2d45fd3c6049fb766aaf4464ce5aef10dca1c14`
  - `gra/tools/general-capital-recruitment-order-test.cjs`: `a57092f42de0cc2923d74e1021bac5beedf16a77c31a51774751404c91e8e4b4`
  - `gra/tools/empire-mass-recruitment-test.cjs`: `77bc32595166b9bc1f22afcab0baac4d3f9253113d9eef2f1f55154f668e591e`

BLOKADY: No blocking defect found for the requested display/wiring. End-to-end purchase through the live production UI is not established by these tests.
NASTĘPNY KROK: Final Control should confirm the narrow UI contract and the remaining limitation. Keep separate from unfinished battle formation and AI campaign work.
DEPLOY/PUSH: NIE WYKONANO.
