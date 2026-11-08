# Independent Evaluator — Defense r2 — R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1

Verdict: **PASS-WITH-NOTES**. The three representativeness gaps from the first review are addressed by updated production-scene evidence; no product files were changed by this evaluator.

## Independent checks

- `TMPDIR=/workspace/tmp-melee-eval-r2 node gra/tools/battle-manual-melee-browser-test.cjs` — **PASS**. The latest trace reports a 28v28 scene with 20 Warriors, 20 ranged units and 16 mounted units total. `probeFixture.warriorDataRow` is `Wojownik (Kamień)` and `sceneRoleFlagsOverridden=false`.
- The browser trace records the real Warrior starting at distance 3, moving two fields to adjacency, then attacking on the following activation in the production `BattleScene`. Atak: 3 melee strikes, 2 HP-loss events, 2 infantry moves and 4 archer shots. Szturm: 2 melee strikes, 1 HP-loss event and 1 archer shot. Mounted control: 14 actions. Browser/page errors: 0.
- `TMPDIR=/workspace/tmp-melee-eval-r2-logic node gra/tools/battle-melee-attack-doctrine-test.cjs` — **PASS**. Paired 24v24 Atak/Szturm reaches adjacency and attacks; each produces 72 method-level melee events / 720 HP loss in the controlled adapter; empty-target remains a no-op.
- `npm --prefix gra run typecheck` — **PASS**.
- `git diff --check` — **PASS**.

## Notes

The browser test keeps the full 28-unit-per-side roster and real production role data, but deterministically activates representative probes rather than advancing every unit through an entire 28v28 battle. It now closes the earlier gaps for genuine Warrior classification, movement from distance 3 to contact, and ranged/mounted actions. It is not a large-battle performance or full-turn simulation test.

No merge, deployment or push was performed.
