# Dispatch Operator R5 — natural formation, archers and chariots

TEMAT: `R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1`
RUNDA: 5/5
DATA: 2026-10-29
DOMAIN: GAME
BASE: `28639c45b5e1ab3e4f38e6adf2d1ccb29f52a835`
WORKTREE: `/tmp/autobot-battle-closeout`
BRANCH: `autobot/R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1-r2`

## Trigger and scope

Independent evaluator report `13-evaluator-r4-closeout.md` accepts R4 only for a real Attack shot at a manually chosen in-range position. It leaves natural approach, initial formation/ranks, and chariot movement/attack unverified. This operator must close that evidence gap using production Chromium and normal BattleScene placement. Keep this task open if natural approach or chariot actions remain unproven.

## Goal / acceptance criteria

1. Start the production battle through its normal deployment UI with a minimal mixed preset roster that includes true ranged Archers (`rangedBase`, `canShoot`, `range>1`, ammo>0), melee, and at least one real chariot (`Rydwan*`) per observed side. Preserve normal constructor placement; do not manually reposition units after placement.
2. Set/confirm one archer row using the production setup control/setter where supported. Record actual `archerLines`, unit IDs/types, role/rank, initial coordinates and rendered screenshot.
3. Start via the production `START WALKI` control. Set doctrines after initialization through `_setGroupDoctrine`: Attack for the attacking mixed group and Defense for the defenders. Record every activation and ranged picker result with actor, doctrine, rank, `canShoot`, range/ammo, candidate/selected enemy, distance, movement candidate, action, and resulting ammo/HP.
4. Let the natural approach run under a bounded watchdog until the first legal Attack shot or the explicit limit. Report whether archers approach, stall behind blockers, fire at legal range, or spend a turn moving into range.
5. Observe an actual chariot's production move or attack while under Attack. If the scene survives, switch that chariot group to Charge through the production setter and observe its next move/attack. Do not infer chariot behavior from Horseman actions.
6. Make a product change only after a specific natural-placement production defect is reproduced with an actionable trace. If none is proven, leave product code unchanged and report the remaining limitation honestly.
7. Save screenshots, JSON/watchdog traces, exact command/results, and `git diff --check` status in this run folder. No commit, merge, integration, push, or deploy.

## Allowlist and constraints

Allowlisted: this dispatch/report and evidence for this ticket; test-only Vite/Playwright instrumentation in `gra/tools/`; product `gra/src/battle/battleScene.ts` only after reproducing a root cause, with focused regression proof. Keep all existing task files and evidence intact. Do not edit production behavior before evidence. Do not modify `testBattle.ts`, deployment/formation rules, campaign map, strategic AI, morale, stats, or unrelated UI. No fabricated Kanban receipt.

## Prior evidence to preserve

- `11-operator-r4.md` and `chromium-live-attack-deterministic-r4.json` prove a legal in-range Attack shot only after manual repositioning.
- `10-operator-r3.md` / corrected r3 artifacts show a 28v28 natural preset with 30 ranged and 16 mounted but no chariots, and a long-run timeout.
- The old 4/36 matrix reds were activation-horizon artifacts; the matrix's action methods are fixture stubs, not production projectile proof.

## Exit condition

Write `15-operator-r5.md`. Mark the natural approach/chariot portions PASS only if actual production actions and state changes are logged from untouched normal placement. Otherwise mark the exact portion BLOCKED with a concise next evidence step. No product changes without a red-to-green trace.
