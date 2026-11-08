# Integration — ready subset for Robocza, 2026-10-28

STATUS: READY_FOR_DEPLOY_WITH_NOTES
DOMAIN: GAME
BASE: `0b28d67fe6fae0bfbf9be39bd0ec84130080fb4d` (`origin/main` at integration start)
BRANCH: `integration/robocza-ready-subset-20261028`

## Included, narrowly integrated

- Wódz/generał roster selector: Stone Warrior before Wheel, Ox Chariot after Wheel; Bronze approved national/generic chariot when recruitable, otherwise best eligible infantry/cavalry excluding chariots; Iron best currently recruitable cavalry. Existing era, tech, Barracks, capital, stock, manpower and limit gates remain.
- Capital commander card is visible at the top of the Army recruitment panel; ordinary city rows do not duplicate it. Queued leader label displays only Wódz/Generał.
- Battle defaults place infantry first, ranged units behind, mounted units on the wings. Atak advances in a paced line, Obrona holds, and Szturm independently selects nearest targets.

## Verification on the exact candidate

- Leader roster: 137 checks PASS.
- Capital commander recruitment transaction and ordering: PASS (including Chromium click and purchase gates).
- Army mass recruitment panel: 30/30 PASS in Chromium.
- Formation rules: PASS.
- Multi-unit Atak/Obrona/Szturm: 12/12 PASS.
- TypeScript: PASS.
- Vite single-file production build: PASS, 916 modules; output 69,924.29 kB before Robocza stamp.
- Scoped diff check: PASS.
- Independent Final Control: PASS-WITH-NOTES; report in `dyspozycje/autobot/runs/FINAL-CONTROL-READY-SUBSET-20261028/01-final-control.md`.

## Excluded from this release

- Commander star/emblem sizing: Final Control readiness boundary not met (missing valid dispatch in its run); remains outside the release.
- AI maritime target priority and continued landing/march: live test 33/34. AI embarks after muster, but does not resume movement or disembark in the tested turns. Not ready.
- Five-turn AI muster/march: independently passed as a separate topic, but not added to this allowlist; can be integrated after the exact release worktree is revalidated.
- Large-empire/performance retest: deliberately deferred until after the smaller changes are published.

## Final Control identity correction

Final Control initially carried forward `99bb834c` from an older report. Its addendum verified that the exact worktree and `origin/main` base were `0b28d67fe6fae0bfbf9be39bd0ec84130080fb4d`; it also recorded SHA-256 fingerprints for the six source files and five focused tests. The correction is recorded in `FINAL-CONTROL-READY-SUBSET-20261028/01-final-control.md`.

Source integration commit: `f48894231b7dfeb3d1726ac7a3deba11a8c7a3f0`. The local bundle and manifest are prepared and verified; remote publication/readback and final push remain.
