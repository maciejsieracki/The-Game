# Independent Evaluator — mixed large-army matrix

**Verdict: PASS-WITH-NOTES. Evaluation gate complete.** Reviewed operator commit
`4a78c6c2f1ac04528d0e394c79f98825a5c0f602` from a detached read-only test checkout.
No product source or harness files were changed by this evaluation. No integration,
deployment, or push was performed.

## Independent rerun

- `node --check gra/tools/battle-large-mixed-doctrine-matrix-test.cjs` — PASS.
- `npm --prefix gra run typecheck` — PASS.
- `node gra/tools/battle-formation-rules-test.cjs` — PASS.
- `node gra/tools/battle-ranged-mounted-doctrine-test.cjs` — PASS, 10/10.
- `node gra/tools/battle-large-mixed-doctrine-matrix-test.cjs` — PASS: 36 scenarios,
  42 active units per side, 5 activations, zero red conditions.
- `BTF_DOCTRINES=steady BTF_LINES=2 BTF_TERRAIN=engaged BTF_TURNS=8 node
  gra/tools/battle-large-mixed-doctrine-matrix-test.cjs` — PASS: both target-priority
  scenarios, 42 units per side, 8 activations, zero red conditions. The same rear-rank
  archer reserve behavior was independently observed; front-rank archers fired.
- `git diff --check HEAD^ HEAD -- gra/tools/battle-large-mixed-doctrine-matrix-test.cjs`
  — PASS.

The matrix writer's tracked `01-matrix.json` was restored to the operator commit after
the reruns; this report is the only untracked evaluator artifact in the operator worktree.

## Review of the harness change

The exemption is limited to an archer/javelin/slinger with more than one configured
ranged line when a lower formation-rank unit of the same role currently occupies the
direct forward lane in the same row, and that exact front unit has recorded a shot.
The baseline cases show the relevance: the earlier red units' straight-ahead slot was
occupied by a same-role front shooter and the fixture freezes enemy positions and health,
so that slot never opens. Requiring every rear reserve to go around its firing front in
this fixture would turn the compact two-line behavior into lateral dispersion.

The exemption does not apply to a one-line formation, an empty direct lane, a different
role, a non-front-rank occupant, or a front unit that did not fire. The one-line cases
remain covered in all three doctrines and two terrain patterns. Other matrix checks for
ranged output, mounted action, illegal attacks, and the compact-lane gate remain enabled.

## Limits and next gate

This is a headless production-logic matrix: enemy movement, damage, rendering, and opening
of a lane after casualties are not simulated. Thus PASS-WITH-NOTES means the original
three conditions are correctly classified as fixture artifacts and the harness still
checks the behaviors it models; it is not evidence of a 42v42 live Chromium battle.
Continue with Final Control, keeping this scope boundary explicit. No product patch is
justified by this rerun.
