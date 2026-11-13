# R-WEB-UNIT-CARD-RANGED-MULT-Q1 — Final Control (2026-11-10)

**STATUS: PASS-WITH-NOTES**

Final Control independently reviewed the scoped changes for the eight `fieldPower`
cache entries, the unit-card combat identity and ranged multiplier fields, the
projectile multiplier label, and the `unitCardCombatFor` hunk in `main.ts`.

## Findings

- `gra/data/units.json` has exactly eight changed values, each only in `fieldPower`:
  two Procarz rows now have 16; six foot Łucznik rows now have 19, 18, 19, 14, 18,
  and 19. The new targeted test independently computes each card's field power and
  confirms equality with `armyFieldPower` and the cached value. The regeneration
  script uses canonical `fieldPower()` and updates only those eight fields.
- `unitCardCombatFor` adds only `Typ` and `Jednostka` from the unit definition to the
  existing combat-card input. Those values are carried by `unitCardCombatDisplay`
  and used to resolve the existing `rangedDamageMultFor` classification.
- The expanded tooltip keeps the numeric “Atak dystansowy” stat and appends
  `×N obrażeń pocisku` when the multiplier exceeds 1. This preserves the base attack
  value while explicitly communicating the projectile damage multiplier.
- The scoped `main.ts` diff contains only the two identity fields inside
  `unitCardCombatFor`. `ai-army-composition.ts` and `unit-power.ts` have no changes.

## Validation

All checks passed:

- `node tools/unit-card-ranged-mult-test.cjs` — all eight ranged rows match the
  runtime multiplier, card field power, `armyFieldPower`, and `units.json` cache;
  Oszczepnik remains at ×1 with unchanged cache.
- `node tools/ranged-damage-mult-test.cjs` — PASS, including unchanged non-target
  ranged classes and projectile damage cases.
- `node tools/unit-power-test.cjs` — 6/6 PASS.
- `node tools/unit-context-card-test.cjs` — 29/29 PASS.
- `node tools/unit-power-sort-test.cjs` — 13/13 PASS.
- `npm run typecheck` — PASS (`tsc --noEmit`).
- `git diff --check` — PASS.

## Note

The Node card test verifies the multiplier value exposed by the card model and the
field-power calculation; the existing context-card test does not assert the rendered
`×N obrażeń pocisku` text. I verified that label statically in the renderer. No
Chromium/HTML rendering test was run under the session constraint, so exact rendered
HTML remains unverified. This is a validation limitation rather than a code defect
found in the scoped diff.

The shared worktree also contains changes for other task IDs; those wiki/process and
other out-of-scope files were not reviewed or approved by this Final Control.
