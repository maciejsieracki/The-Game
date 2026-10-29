# 20 — Independent evaluator

**Final verdict: PASS-WITH-NOTES.** The correction in `21f8f2bd` closes the round-2 behavior gap: after each successful instant end-turn march segment, the runtime synchronizes tracked leader targets, plans newly separated opted-in followers, and adds them to the queue without duplicate entries. The EOT regression exercises a production-helper simulation plus a source assertion that the real instant segment calls synchronization; it is not a full end-turn game integration test. No product files were edited during this evaluation.

## Independent review

Reviewed `00-dispatch.md`, `10-operator.md`, the prior round-2 FAIL in this file, and correction `21f8f2bd`; inspected the candidate at `2a504c8c140d2d0b1c38f34f9254ca76e7ea010e` on base `9f6f7771`.

- `syncGeneralMarchTargets()` first retargets or clears existing tracked marches, then plans opted-in units that do not yet have a march. It excludes generals, garrisoned units, and besiegers. Newly planned followers with movement remaining are queued only if they are not already present in `marchExecQueue`.
- `applyMarchSegmentInstant()` invokes this synchronization after a successful segment, including the march-attack branch. The end-turn loop drains the same queue, so a same-hex follower gets a tracked route once its leader moves; later leader segments update that route instead of creating another. The focused regression exercises same-hex activation, tracking, and one queued entry across subsequent segments. The production source assertion verifies the sync is inside the instant-segment function.
- The Army recruitment panel renders the visible, checked-by-default `Idź do wodza` setting and updates the runtime default on change. Both production completion paths apply the default to newly completed player units: ordinary city production and the recruitment-completion loop used by city and Army-panel recruitment, including queued general recruitment. AI-owned completions do not inherit the player preference.
- The unit action toggles `followGeneral` per unit. Turning it off clears that unit's tracked march; turning it on starts a march when separated, while a co-located opt-in remains enabled until the commander moves. Changing the default does not rewrite existing units.
- The global default and individual unit flags are part of the serialized save object. Runtime load restores a saved boolean and treats an absent/legacy value as enabled. Missing legacy per-unit flags remain absent, so old units are not redirected on load.

## Verification

- `npm run typecheck` — **PASS**.
- `node tools/recruit-rally-default-ui-test.cjs` — **PASS**; production Army panel markup, checked default, explanatory label, and change callback.
- `node tools/recruit-rally-default-save-test.cjs` — **PASS**; global and per-unit roundtrip plus legacy omissions.
- `node tools/general-quick-follow-action-test.cjs` — **20/20 PASS**, including same-hex following and instant end-turn leader movement/retargeting without duplicate follower orders.
- `npm run build` — **PASS** (independently rerun on the reviewed candidate).
- `git diff --check 9f6f7771..HEAD` and worktree `git diff --check` — **PASS**.

No product edits, integration, push, or deployment were performed.
