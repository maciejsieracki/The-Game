# Operator report — R-ARMY-RECRUITMENT-UI-20261028

Status: **operator complete; ready for independent evaluation**. No product code was changed in this run. I changed only the two allowlisted tests; no commit, push, merge, or deploy was made.

## What changed

- `gra/tools/general-capital-recruitment-order-test.cjs` now mounts the real `mountGeneralRecruitmentCardForArmy` component in Chromium. A real click on its production button invokes the exact `purchaseRecruitmentUnit` body extracted from `main.ts`, including the exact `attemptGeneralPurchase`, era-limit, and slot-count helpers extracted from `game/generals.ts`.
- The purchase test confirms one queued commander entry, one deduction of offered gold, the displayed manpower amount, and the unit's wood cost; it also checks the commander label, a single dirty-state mark, non-capital rejection, the current-era limit, and the increased commander limit in the next era.
- `gra/tools/empire-mass-recruitment-test.cjs` no longer mounts fabricated commander markup. The Army panel test now calls the production CityPanel commander renderer and confirms the real recruit card is before city recruitment sections.

## Verification

Commands run from `gra/`:

- `node tools/general-capital-recruitment-order-test.cjs` — **19 passed, 0 failed**.
- `node tools/empire-mass-recruitment-test.cjs` — **25 passed, 0 failed**.
- `node ./node_modules/typescript/bin/tsc --noEmit` — passed, no diagnostics.
- `git diff --check -- gra/tools/general-capital-recruitment-order-test.cjs gra/tools/empire-mass-recruitment-test.cjs gra/src/ui/cityPanel.ts gra/src/ui/empireDetailPanel.ts` — passed.

## Fixtures and limits

The browser uses a minimal `Wojownik` data fixture and an offer fixture to focus on the production card interaction. The purchase transaction itself is not mocked: the exact production purchase and commander-preflight function bodies run in a Node harness. Engine-owned state/economy dependencies (`treasury`, resource pool, Manpower deduction, stock deduction, queue persistence, HUD refresh, and dirty marking) are small explicit test doubles, so this does not exercise a full live game save or the complete `main.ts` startup.

The production offer builder is not executed end-to-end. The test asserts its capital check and that it selects via `purchasableUnits` with the current owner's unlocked technologies and `productionAvailabilityCtxForCity`; it also checks the existing production source still gates by era, technology, and Barracks/Academy. Thus those candidate-availability checks are source-level, while capital/commander-limit preflight and the successful purchase transaction are executed. The Army layout test's per-city ordinary card rows remain simple layout fixtures; only the commander card is production-rendered there.

## SHA-256 at operator completion

| File | SHA-256 |
| --- | --- |
| `gra/tools/general-capital-recruitment-order-test.cjs` | `fa3635cca56d76f12560a94fa505a29b06c065364c58916faa7b3c8327106fee` |
| `gra/tools/empire-mass-recruitment-test.cjs` | `9ff6de2271adf1b218f867fe7265d3e7a84efda28f82bbca70a46f8e3cee6a3c` |
| `gra/src/ui/cityPanel.ts` (unchanged by this operator) | `a861e8981dadfdf3b6194a793aba88e45f3a60fbecf2ab68141a33135ebec447` |
| `gra/src/ui/empireDetailPanel.ts` (unchanged by this operator) | `c1e7691c456087580bf9669a80e9e7c6b515aa1abd129132f830f89a150f94fc` |
