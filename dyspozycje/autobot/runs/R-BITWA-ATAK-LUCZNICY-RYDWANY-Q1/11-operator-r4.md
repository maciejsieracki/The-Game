# Operator R4 — production Attack ranged-action trace

**Result: Attack ranged selection and firing are verified in a short, deterministic production-runtime battle. No product defect was reproduced, so no product code was changed.** This closes the outstanding evidence gap from r3 for Atak while retaining the longer engagement/formation limitation below.

## Root cause and result

The earlier 28v28 Chromium trial started the opposing lines 6–8 tiles apart. The correctly configured Attack group had no legal ranged target during the first four rounds, so the picker did not return a target and no shot was appropriate yet. A longer natural-position trial was too slow and timed out at round 6. The prior report’s seven “steady” hits were invalid because doctrines were assigned before scene initialization and reset; those were not Attack evidence.

To isolate the reported condition, I opened the production battle through its UI, clicked **START WALKI**, selected production units from that scene, configured groups with `_setGroupDoctrine`, and moved three real Archers next to one real enemy Archer at a legal range. The temporary harness did not replace the picker, `_doAttack`, `_doRangedAttack`, or damage calculation. It only wrapped them to log their real calls and wrote a watchdog snapshot every 250 ms.

The three shooters all had `rangedBase=true`, `ammoLeft=12`, `rangeBase=3`, derived `range=3`, and an enemy at distance 2. Each production `_pickRangedTargetByPriority` returned the enemy under doctrine `steady` (Atak); each proceeded through `_doAttack` into real `_doRangedAttack`. All three consumed one arrow and reduced defender HP from 16 to 12. The battle ended in round 1 after the target routed. Browser/page errors: zero. Picker traces also record the candidate movement destinations; while a legal target existed, Attack fired rather than moving.

This is positive evidence against a bug where Atak ignores a legal ranged target or never calls the firing path. The no-shot observations in the natural 28v28 opening are explained by range and engagement distance, not a picker bypass. This isolated setup verifies firing once an Attack archer is in range; it does not prove the entire natural deployment/formations reach firing range reliably on every terrain or that all doctrine/roster combinations work.

## Evidence and commands

Run command from `gra/`: `node tools/battle-doctrine-live-r4-test.cjs`.

Artifacts:

- `chromium-live-attack-deterministic-r4.json` — final trace and assertion results.
- `chromium-live-attack-watchdog-r4.json` — latest 250 ms runtime snapshot.
- `chromium-live-attack-hit-r4.png` — active production battle screenshot after HP loss.
- The harness is `gra/tools/battle-doctrine-live-r4-test.cjs`; it is test-only and within the allowlist.

All five live assertions passed: real shooter with ammo/legal range, production picker target, real ranged attack with HP loss and ammo spent, doctrine remains Attack, and no browser errors. `git diff --check` passes. The prior r3 matrix outputs remain contextual evidence only; their action recorder is not proof of production damage.

## Scope and handoff

No `battleScene.ts` edits were warranted. The R3 `10-operator-r3.md` remains the complete prior trace/horizon report. This R4 evidence resolves its outstanding specific question of whether Attack can fire at an in-range target. If the remaining user-facing complaint concerns archers failing to close distance in an ordinary large battle, the next operator should instrument natural formation movement to the first legal firing tile (including terrain-derived range, target path, blockers, and per-activation movement) in a seeded, smaller production roster. Do not label that broader behavior fully closed based solely on this isolated shot.
