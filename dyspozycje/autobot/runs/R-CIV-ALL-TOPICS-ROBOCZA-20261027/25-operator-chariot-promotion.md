# Operator validation: ox chariot era and AI era promotion

Date: 2026-10-28 UTC

## Source identity

- Repository: `/workspace/all-topics-candidate`
- Base `HEAD`: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
- Working tree was already dirty at inspection. Validation applies to the live working-tree sources listed below, not to a commit.
- SHA-256:
  - `gra/data/units.json`: `0e031b60af2b7db4ad135629c8472f7119e26abd01ba56713c248e51ea7d3c56`
  - `gra/src/render/braz-rydwan-woly-opus5.ts`: `f8ccce575b65bbd6c920ccec791b68be8d80272f0c9f72f746b8dfab7aa83b3d`
  - `gra/src/render/units.ts`: `de35ac543f224402b04cce460c4d6cc12234c5fd1603117fc2f86d3333bcf404`
  - `gra/src/game/ai-era-unit-promotion.ts`: `18d94e02d39cff4484dfabda54a69850b3298a174b77b3a998c1df7124241f6b`
  - `gra/tools/ai-era-unit-promotion-test.cjs`: `ca80adff67768b6e1c24bad92d19ea096c0d8a444e5ba075d1994753cecdb4f4`

## Findings

The Ox Chariot (`Rydwan (woły)`) metadata is internally consistent for Stone availability gated by Wheel, with wood recruitment and wood upkeep (5). The dedicated test also resolves runtime upkeep as `{ drewno: 5 }`. Renderer dispatch still routes the named unit to its dedicated builder; the touched render changes update its era comments to late Stone. No visual screenshot/render assertion is included in this focused test, so validation here establishes dispatch wiring and compilation rather than inspecting pixels.

AI era promotion is invoked once on a fresh AI owner turn and skipped for resumed command execution. The helper selects a newer same-role eligible unit, preserves health percentage, consumes the turn's replacement and movement, charges only the positive unit-cost difference, and remains idempotent across repeated/save-loaded calls.

## Checks

- `cd gra && node tools/ai-era-unit-promotion-test.cjs` — passed, 12 assertions, 0 failures.
- `cd gra && npm run typecheck -- --pretty false` — passed (`tsc --noEmit`).

No product source or test files were edited during this validation. No deploy or push performed.
