# Independent evaluation — R-ARMY-RECRUITMENT-UI-20261028 — round 3

Verdict: **PASS-WITH-NOTES**. The round-3 scope objection is resolved. The dedicated Army commander card is backed by the production renderer and the active player's capital lookup is now explicitly covered by a source assertion against `main.ts`. The browser harness does not execute the full game boot; the operator clearly records that limitation, as the dispatch allows.

## Verification

I independently ran the round-3 checks from `gra/`:

- `node tools/general-capital-recruitment-order-test.cjs` — **PASS, 0 failures** (19 assertions).
- `node tools/empire-mass-recruitment-test.cjs` — **PASS, 30 assertions** in Chromium.
- `npm run typecheck` — **PASS**.
- Scoped `git diff --check` for the dispatch files — **PASS**.

The updated mass-recruitment test asserts the exact production `main.ts` callback resolves `capitalCityIdForOwner(ME())` and passes that ID to `mountGeneralRecruitmentCardForArmy`. Its Chromium fixture mounts the production Army and CityPanel renderers for 24 synthetic city rows and verifies one commander card above the city list, no duplicate in the capital city card, a single purchase button and one callback on click. The separate transaction test exercises the production purchase/preflight path and verifies one queue insertion and one resource deduction, plus capital and era-limit rejections.

## Notes and limits

- The Chromium harness uses synthetic city data and a configured callback to mount the production card. The `main.ts` boot wiring is checked at source level, not by rendering a full game boot. This boundary is stated in the operator report and matches the dispatch criterion.
- The test invokes the card button with DOM `.click()` because the long city-list layout overlaps pointer coordinates. This verifies the registered click handler and transaction callback, but is not a pointer-coordinate/UI hit-target test.
- This is a local verification only. No commit, push, merge, or deploy was performed in this run.

## Revision identity and hashes

- Repository: `/workspace/all-topics-candidate`
- HEAD: `f5a32c4e5f01bb6a3eb7276bcd614bc39c264ca3`
- Dispatch r3 SHA-256: `f6e117cee1cceab88b31d8556ae4c0c00f183e559a5c9edd24fad98d89e6eb62`
- `gra/src/ui/cityPanel.ts`: `6a5cfb3853b5dbb69dd43be0eb8405625039a2e869d830b0c824bfaf9f9d3cd4`
- `gra/src/ui/empireDetailPanel.ts`: `c1e7691c456087580bf9669a80e9e7c6b515aa1abd129132f830f89a150f94fc`
- `gra/src/main.ts`: `8036eaf0b02c19588fa30608b2d45fd3c6049fb766aaf4464ce5aef10dca1c14`
- `gra/tools/general-capital-recruitment-order-test.cjs`: `6cd0cdba54efbf1a4cea78e06a108375652e97246f164f76a8bdd627e7bf024a`
- `gra/tools/empire-mass-recruitment-test.cjs`: `3466f442b2bc3aaacc71b771bb86050b39af2c7430f9b713cc4feb24685f4535`

No product source was changed by this evaluation.
