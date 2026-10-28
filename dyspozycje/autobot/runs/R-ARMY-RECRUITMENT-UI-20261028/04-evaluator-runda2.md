# Independent evaluation — R-ARMY-RECRUITMENT-UI-20261028 — round 2

Verdict: **OBJECTION — behavior and regression coverage pass; scope is not compliant with the dispatch allowlist.**

## Verified behavior

- `mountCityRecruitmentCardsForArmy` now mounts only ordinary purchasable units. The dedicated commander card is rendered through `mountGeneralRecruitmentCardForArmy`, above the city sections.
- The Chromium test bundles the production `empireDetailPanel.ts` and `cityPanel.ts` modules. It invokes the production Army section renderer/control mount, mounts the production commander card, and invokes `mountCityRecruitmentCardsForArmy` for all 24 fixture city IDs. It observes exactly one commander card, none inside the capital city target, ordinary production CityPanel cards, and commander-before-city DOM order. The 24-city fixture is synthetic, but the two card renderers and Army section/control rendering are production code.
- Source inspection confirms production `main.ts` configures the Army mount callbacks, including resolving the active owner's capital for the dedicated commander card. The current production composition therefore has the duplicate removed.
- `node tools/general-capital-recruitment-order-test.cjs` — **PASS (0 failures)**.
- `node tools/empire-mass-recruitment-test.cjs` — **27 passed, 0 failed**.
- `node ./node_modules/typescript/bin/tsc --noEmit` — **PASS**, no diagnostics.
- Scoped `git diff --check`, including the changed `main.ts` wiring — **PASS**.

The purchase harness continues to click the actual production card and run the extracted production purchase/preflight code, with persistence/economy dependencies supplied as test doubles. Its checks cover exactly one queue insertion and one set of deductions, and capital/era-limit rejection.

## Blocking scope finding

The dispatch allowlist does not include `gra/src/main.ts`. However, the working diff adds a `mountGeneralRecruitment` callback there (and imports `mountGeneralRecruitmentCardForArmy`) to make the new Army-level target render in production. This is required wiring, but it is still a product change outside the declared allowlist. The round-2 report's statement that only allowlisted files were edited is therefore inaccurate. The test injects its own `mountGeneralRecruitment` callback, so it does not itself validate that production boot wiring; source inspection confirms that wiring is present, but it does not cure the scope violation.

The `main.ts` diff also contains other hunks outside this run's stated scope that are part of the already-dirty shared working tree; this evaluation does not attribute those existing changes to round 2. The newly added Army callback is directly related to this change and is unambiguously outside the run allowlist.

## Revision identity and hashes

- Repository: `/workspace/all-topics-candidate`
- Base `HEAD`: `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3`
- Current source/test SHA-256:
  - `gra/src/ui/cityPanel.ts`: `6a5cfb3853b5dbb69dd43be0eb8405625039a2e869d830b0c824bfaf9f9d3cd4`
  - `gra/src/ui/empireDetailPanel.ts`: `c1e7691c456087580bf96608b2d45fd3c604aa1abd129132f830f89a150f94fc`
  - `gra/src/main.ts`: `8036eaf0b02c19588fa30608b2d45fd3c6049fb766aaf4464ce5aef10dca1c14`
  - `gra/tools/empire-mass-recruitment-test.cjs`: `edaf8154009e180739df86e1c80cd6e767a0b6b65ca799d1e84f2bdb0d20f438`
  - `gra/tools/general-capital-recruitment-order-test.cjs`: `6cd0cdba54efbf1a4cea78e06a108375652e97246f164f76a8bdd627e7bf024a`

No product files were changed by this evaluation. No commit, push, merge, or deploy was performed.
