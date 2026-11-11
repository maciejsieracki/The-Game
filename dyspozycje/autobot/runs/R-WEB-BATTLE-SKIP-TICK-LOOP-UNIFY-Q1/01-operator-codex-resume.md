# Operator resume — shared AUTO / Skip frame ticks

Candidate is ready for independent evaluation on branch `codex/skip-resume`, based on `638e90bea`. The baseline source hash was `073f4fdec59ac655fdef7c33a2ccb248d1e1f449df0147c5b964e6dd87e2be02`; candidate `gra/src/battle/battleScene.ts` hash is `d2e3cdd361184375888fb627338745af06f28f22f0eabc4707b98f51e8cb193a`.

The cause was the different simulation cadence: AUTO advanced its virtual clock from a capped wall-frame delta scaled by battle speed, while Skip always advanced in fixed 16 ms steps. The candidate routes both paths through `_scaledWallDelta`, which applies the shared clamp and speed multiplier. Fast-forward now derives its tick from the shared 16 ms base frame, and processes a snapshot of callbacks queued by the prior frame so callbacks created during the current tick wait for the next tick.

## Reproduction

Actual scene tests used the Vite build served over local HTTP and `/usr/bin/chromium`; no `file://` access. Every browser `evaluate` pumped at most 200 synthetic frames. Seed 1, `?playtest=oblezenie-duze`, and speed index 3 (8x) were used for the breach test. JSON result rows and per-chunk round/HP/breach checkpoints are in `evidence/`.

Baseline AUTO and Skip diverged at round 400 with a breach. AUTO ended with attacker 26 lost / 2,651 HP and defender 7 lost / 807 HP. Skip ended with attacker 26 lost / 2,593 HP and defender 8 lost / 789 HP. The baseline Skip was rerun with speed index 3 and the pre-candidate source; its result remained 26/8 losses and 2,593/789 HP.

Candidate AUTO and Skip now agree at round 400, defender victory, breach true, attacker 26 lost / 2,651 HP, defender 7 lost / 807 HP. Virtual time differs by 1 ms (9,134,081 vs 9,134,080 ms).

## Regressions

The siege without engines (`&bare=1`, test cap 150) ended as a draw in both paths at round 150, without a breach or losses: attacker 988 HP, defender 1,008 HP.

The field battle (`?playtest=bitwa-duza`, seed 1, speed index 3) passed all six live parity assertions. Both paths ended at round 12 with defender victory, attacker 17 losses / 181 HP, defender 11 losses / 505 HP, and 42,496 ms virtual time.

Manual Skip during an in-progress player move passed D0–D3: the move was busy and not yet acted, the battle finished without JS errors, and the unit was not activated twice in the same turn. The control path reproduced the old duplicate activation and had a different winner.

## Gates

- `node tools/battle-skip-siege-parity-test.cjs`: 17 pass, 0 fail.
- `node tools/battle-skip-equals-auto-resolve-test.cjs` static checks: 10 pass, 0 fail; manual D0–D3: pass; field live assertions: 6 pass, 0 fail.
- `npm run typecheck`: pass.
- HTTP Chromium breach parity: candidate pass; baseline fail reproduced.
- HTTP Chromium no-breach150 parity: pass.

No deployment or merge was performed. Historical BATSKIP589 and no-breach150/600 behavior was left intact.
