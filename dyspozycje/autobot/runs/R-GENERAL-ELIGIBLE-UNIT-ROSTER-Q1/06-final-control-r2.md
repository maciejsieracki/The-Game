# AutoBot Final Control — leader roster R2

**Verdict: PASS-WITH-NOTES — ready for narrow integration.** This is not READY_FOR_DEPLOY.

## Contract and scope

I checked `01-dispatch-implementation.md`, the R2 Operator report, the R2 Evaluator report, and the owner decisions Q2=A / Q3=B. The approved behavior is present in the current candidate:

- Stone leader is Warrior before Wheel and Ox Chariot after Wheel.
- Bronze prefers the approved civilization-specific chariot, or generic horse chariot; before its required technology/building is available, fallback chooses the strongest currently recruitable eligible infantry/cavalry and excludes every chariot.
- Iron chooses the strongest currently recruitable mounted cavalry equivalent.
- Classes `Dystans` and `Oblężnicza` are excluded; cavalry/chariots with `missileAttack` remain eligible by category.
- Existing era, technology, Barracks/building-upgrade, capital, manpower, stock, and commander-limit gates remain in force.

## Independent verification

Executed against `/workspace/all-topics-candidate` at HEAD `0b28d67fe6fae0bfbf9be39bd0ec84130080fb4d` with the shared dirty candidate:

- `node gra/tools/general-eligible-unit-roster-test.cjs` — **PASS, 137 checks**, including the prior-era Ox Chariot boundary against Q3=B, all 15 civilizations across three eras, exclusions, and unlock switching.
- `node gra/tools/general-capital-recruitment-order-test.cjs` — **PASS, 0 failures**, including the production card click, purchase preflight, capital-only rule, era limit, payment, manpower, stock, queue, and Wheel-aware Stone selection.
- `cd gra && npm run typecheck` — **PASS**.
- `git diff --check` on the roster allowlist — **PASS**.

Candidate SHA-256:

- `gra/src/game/generals.ts`: `401ea4782a57817f01d4a19d87e758ccbd2817bfe4d3ea57eeec6e8eeafb6673`
- `gra/src/main.ts`: `bda6e2f320b944cc2c29330af795aa00d9355273949ec4455127184e898f1900`
- `gra/tools/general-eligible-unit-roster-test.cjs`: `e4dde85f1ecd5309e1a5de5b4b1441a0dd5c6b7fc1525d97787eb8ae2cfac4c9`
- `gra/tools/general-capital-recruitment-order-test.cjs`: `626e50713a725d1b837fa9da4ee3ab0873df1144cc39073081f71e1716088ecd`

## Integration boundary and notes

The selector and its focused test pass. `main.ts` also contains concurrent unrelated Army UI and naval-AI hunks; they are outside this verdict. Integration must extract only the `bestGeneralUnitForOwner()` selector and its import/helper needs, plus the allowed focused tests. Do not copy or stage all of `main.ts` or attribute the other hunks to this roster topic.

The general purchase test verifies the Stone Warrior card path and the roster suite verifies Celtic chariot technology/Barracks boundaries through the production selector. It does not browser-click a Bronze national-chariot offer in a complete game boot. The dispatch's focused selector and shared purchase-gate criteria pass; this is a release-playtest limitation, not an observed defect.

No product files were edited by Final Control. No integration, commit, push, or deploy was performed.
