# Independent evaluator: Ox Chariot and AI era promotion

Date: 2026-10-28 UTC

## Verdict

**PASS for the requested live-tree behavior, with visual rendering unverified.** I independently reproduced the focused promotion/type checks and the building-gate regression suite. The Ox Chariot (`Rydwan (woły)`) is Stone-era, requires Wheel, consumes 25 wood to recruit, and uses 5 wood upkeep. Wheel is a Stone technology with prerequisite Animal Domestication, a wood-access research gate, no required building, and lists the Ox Chariot as its unit unlock. The chariot dispatch in `render/units.ts` routes its Polish and English names to the dedicated Ox Chariot builder.

The AI promotion path runs on a fresh AI owner turn and is skipped for command resumes. Its helper promotes to a later-epoch same-role eligible unit, preserves health percentage, spends movement and the once-per-turn replacement, charges only a positive price difference, and blocks repeat/save-load charges.

## Evidence and reproduction

- `cd gra && node tools/ai-era-unit-promotion-test.cjs` — **12 passed, 0 failed**. This covers live Ox metadata and upkeep resolution, production-gated Bronze replacement availability, promotion effects/cost, save-load idempotency, and fresh-turn/resume call wiring.
- `cd gra && node tools/koszary-gate-test.cjs` — **20/20 passed**. In particular, the Ox is unavailable before Wheel and available after Wheel in Stone without barracks.
- `cd gra && npm run typecheck -- --pretty false` — passed (`tsc --noEmit`).
- Inspected `gra/data/units.json`, `gra/data/tech.json`, production gates in `gra/src/game/production.ts`, AI caller/helper, and the exact-name renderer branch in `gra/src/render/units.ts`.
- Renderer inspection confirms dispatch only. The focused promotion test does not render a scene or compare pixels, so model appearance is not verified.
- `cd gra && node tools/unit-stock-cost-test.cjs` — **40 passed, 18 failed**. The Ox-specific checks pass: it is exempt from horse stock and has `{ drewno: 25 }` recruitment stock cost. The failures are stale expected quantities in unrelated unit-cost assertions (for example, test expects mount horse stock 5 while live code returns 25); they do not implicate Ox-specific assertions.

## Source identity and limits

- Repository: `/workspace/all-topics-candidate`
- Base `HEAD`: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
- The tree was already dirty; verdict applies to these current working-tree bytes, not a commit. No product source or test files were edited by this evaluator.
- SHA-256:
  - `gra/data/units.json`: `0e031b60af2b7db4ad135629c8472f7119e26abd01ba56713c248e51ea7d3c56`
  - `gra/data/tech.json`: `d22e1e753311276775244aa2355f1d65d1eea7e606c8536ce8baf6005e087278`
  - `gra/src/render/braz-rydwan-woly-opus5.ts`: `f8ccce575b65bbd6c920ccec791b68be8d80272f0c9f72f746b8dfab7aa83b3d`
  - `gra/src/render/units.ts`: `de35ac543f224402b04cce460c4d6cc12234c5fd1603117fc2f86d3333bcf404`
  - `gra/src/game/ai-era-unit-promotion.ts`: `18d94e02d39cff4484dfabda54a69850b3298a174b77b3a998c1df7124241f6b`
  - `gra/src/main.ts`: `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d`
  - `gra/tools/ai-era-unit-promotion-test.cjs`: `ca80adff67768b6e1c24bad92d19ea096c0d8a444e5ba075d1994753cecdb4f4`

No deploy or push performed.
