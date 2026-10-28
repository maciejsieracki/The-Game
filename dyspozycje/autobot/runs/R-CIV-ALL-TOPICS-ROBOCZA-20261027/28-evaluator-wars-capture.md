# Evaluator: forced wars, peace lock, empty-city capture

Date: 2026-10-28 UTC
Candidate: `/workspace/all-topics-candidate`
HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`
Working tree: dirty; the reviewed behavior is in the working-tree diff.
Review basis: Operator report `23-operator-wars-capture.md`; current source and focused tests.
Scoped diff SHA-256 (binary diff of common/era forced-war modules, peace lock, main/save, AI capture executor/AI, and the two focused tests): `403ad9c18d1890dd17b479adad84afcc816cf798ae32b0760138d825d5c276a2`.

## Verdict: PASS-WITH-NOTES

The inspected implementation matches the selected rules:

- Ordinary peace sets the shared treaty lock to 10 turns (`PEACE_TREATY_LOCK_TURNS = 10`); ordinary calls to `finalizePeaceTreatyBetween` omit an override. Forced-war endings use the forced-war cooldown override.
- The 20-turn duration check is attached to the Stone, Bronze, and Iron active forced-war maps. It resolves peace on the first fresh turn where `currentTurn - startTurn >= 20`. Ordinary wars do not enter these maps and are not affected by this timer.
- On peace while an era-forced pair is still active, the code records the declaring attacker and its current era. `isPeaceLockedBetween` combines that lock with the ordinary treaty lock. The extra lock expires when that attacker advances to a later era. It is serialized/restored through save metadata.
- Empty-city capture rechecks live war status in the shared player capture path and in AI move execution. The AI executor's production caller passes the current diplomacy check. Starvation surrender also rechecks war status before changing ownership and cancels the siege after peace.

The focused tests in the Operator report cover the three era modules, duration/threshold ordering and save-lock helpers, AI plan-then-peace rejection, and source wiring. Their recorded results support the source review; this evaluator did not rerun tests or boot a browser scenario.

## Notes and limits

The per-pair forced-era lock is released only by advancement of the declaring attacker. For Iron, the existing game has no later era, so an Iron forced-war peace lock persists indefinitely. This is called out in the Operator report and follows the implemented “until next era” rule while Iron remains terminal; it should be revisited if a later era is added.

The AI capture executor treats an omitted `canEngageOwner` callback as permission for compatibility. The actual production call supplies the live callback, and the focused integration test covers it, but future callers must continue supplying that callback. The integration test also uses source-pattern assertions for the main wiring and does not prove every browser interaction. The Operator report separately notes no full UI-driven active-lock save/reload or live 20-turn runtime run.

No defect against the stated choices was found in the reviewed paths. This verdict is bound to the HEAD and working-tree diff above; it does not certify unrelated modifications present in the dirty tree.
