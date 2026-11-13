> HISTORYCZNY SNAPSHOT. Bieżące statusy: [STAN-ZADAN-CODEX-20261110.md](STAN-ZADAN-CODEX-20261110.md), priorytety: [PRIORYTETY-WLASCICIELA-20261110.md](PRIORYTETY-WLASCICIELA-20261110.md), kolejka: [KOLEJKA-AKTYWNA-CODEX-20261110.md](KOLEJKA-AKTYWNA-CODEX-20261110.md). Poniższe aktywne sloty opisują wyłącznie dawny odczyt.

# Codex four-topic queue — frozen local snapshot

## Snapshot and release evidence

Snapshot time: **2026-11-10 11:40:08 UTC**. This is one evidence snapshot; later role or publication changes require a new timestamped refresh.

- `HEAD`, `origin/main`, and direct `git ls-remote origin refs/heads/main`: `43c5487f69ab052820672dfbcddbfed0ab0bb5dc`.
- FALA 607 publication `2da63d941ac704cb8c3e2e1ca37a3d3a8f3979ec` is included in HEAD. Its three topic receipts each report 11/11, source `79a6c778e`, bundle MD5 `2ee58aa298dda83cf3d7fcda7a29382f`, and receipt SHA256 `edbe812b267707e3469c6343054707c87379380abc4a10f6bdc1f353291b99dc`. Remote evidence is Git `ls-remote` + fresh fetch + byte-identical bundle/manifest/START; no HTTP Raw readback is claimed.
- These released topics have left the active slots:

| Topic ID | Stage | Local receipt |
|---|---|---|
| `R-WEB-AI-UNIT-REPLACE-LIMIT-CONFIG-Q1` | 11/11 | `dyspozycje/autobot/runs/R-WEB-AI-UNIT-REPLACE-LIMIT-CONFIG-Q1/90-release-607.json` |
| `R-WEB-UNIT-CARD-RANGED-MULT-Q1` | 11/11 | `dyspozycje/autobot/runs/R-WEB-UNIT-CARD-RANGED-MULT-Q1/90-release-607.json` |
| `R-WEB-TECH-ENCYCLOPEDIA-COST-SYNC-Q1` | 11/11 | `dyspozycje/autobot/runs/R-WEB-TECH-ENCYCLOPEDIA-COST-SYNC-Q1/90-release-607.json` |

- `R-WEB-BATTLE-LOOT-TEST-DEBT-Q1` has completed its scoped battle-loot test fix: Operator 12/0, Evaluator and Final Control PASS, integrated/pushed with remote readback. Its push receipt is `dyspozycje/autobot/runs/R-WEB-BATTLE-LOOT-TEST-DEBT-Q1/90-push-readback.md` (source `6d425e3db985cb109eb8634c69a67c455d142c66`; publication `c9cc33bc8`, present in current main). It closes only battle-loot; other named test failures remain open.
- Cleanup check at snapshot: `git worktree list` showed `/workspace/The-Game` and this checkout; no `/tmp/codex-release-*` or `/tmp/civ-deploy-out` directories; filesystem reported 21 GB free. Parent reported four temporary release directories cleaned.
- No callable scheduler is available. This is a completed manual readback, not a background heartbeat or future-wake claim.

## Active topics — 4/4 at 11:40:08 UTC

The agent roster and run artifacts were checked at this snapshot. Count one slot per topic, regardless of role.

| Slot | Topic ID | Role/status | Evidence and next gate |
|---:|---|---|---|
| 1 | `R-PROC-CODEX-FOUR-TOPICS-20261110` | Operator, correction round 2 | Round 1 Evaluator BLOCK in this run's `20-evaluator.md`; this response addresses its three findings. |
| 2 | `R-WEB-WONDER-HAAMONGA-DOC-SYNC-Q1` | Operator correction active | `30-defense.md` FAIL finds the same unsupported +3 Influence claim in the guide and generated bundle. Operator must correct both, regenerate, and return to Evaluator. |
| 3 | `R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-LIVE-VERIFY-Q1` | Final Control active | Operator and Evaluator PASS with limitations; see `20-evaluator.md`. Final Control is the next sequential role. |
| 4 | `R-WEB-VETERANS-TEST-DEBT-Q1` | Operator active | Dispatch and `01-operator-r1.md` exist. This is the distinct veterans debt, following the completed battle-loot child. |

The recruit topic has a run directory, dispatch registration, evidence, and evaluator report. No topic is counted as active solely because a historical status says so.

## Explicit local ranked backlog — 16 web entries plus 2 deferred

The handover and registry did **not** supply a complete, numerically ranked list. The 16 web entries below are the local operational order, written at this snapshot from the named items/dependencies in those sources; ranks are local ordering, not a claim about source ranking. The two deferred entries follow separately, giving all 18 named items from this queue. A test name without an `R-*` ID is debt only: reproduce/classify it, register a unique topic ID and dispatch, then start it. Active and completed items remain listed to preserve the full queue and their current state.

| Local rank | Topic ID or exact item | Snapshot state | Eligibility / decision |
|---:|---|---|---|
| 1 | `R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1` | WAITING | Eligible when a slot opens and current shared-file dependencies are read back. |
| 2 | `R-WEB-BATTLE-SKIP-TICK-LOOP-UNIFY-Q1` (#202) | WAITING | After rank 1 to serialize battle/siege shared files. |
| 3 | `R-WEB-SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE-Q1` | WAITING — OWNER CONFIRMATION | Hold until owner confirms its summary/assumptions. |
| 4 | `R-WEB-AI-WAR-ARMY-SEEKS-ENEMY-MAIN-ARMY-FIRST-Q1` | WAITING | Eligible after slot opens; serialize `ai.ts` work against other active topics. |
| 5 | `R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1` | WAITING — DEPENDENCY CHECK | Verify prerequisite `R-WEB-DIPLO-ALLIANCE-THRESHOLD-130-TRUST-90-Q1` on current main before dispatch. |
| 6 | `R-WEB-AI-TRADE-PROPOSALS-TO-PLAYER-Q1` | WAITING | Eligible after slot opens; resolve its recorded owner decisions and serialize overlapping `ai.ts` work. |
| 7 | `R-WEB-POLISH-LANGUAGE-AUDIT-Q1` | WAITING | Read back text-queue dependencies and confirm at least 4 GB free before starting. |
| 8 | `R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-LIVE-VERIFY-Q1` | ACTIVE — FINAL CONTROL | See active slot 3 above. |
| 9 | `R-WEB-BATTLE-LOOT-TEST-DEBT-Q1` | COMPLETE — scoped child only | 11/11 push/readback complete. Remaining test debt is separate. |
| 10 | `R-WEB-VETERANS-TEST-DEBT-Q1` | ACTIVE — OPERATOR | See active slot 4 above. |
| 11 | `ai-major-economy-test.cjs` + `pr141-f04-yields-activation-test.cjs` regression debt (no IDs) | WAITING — UNREGISTERED | Reproduce each on current main; verify F-04 acceptance for PR141; register unique topic IDs only for confirmed actionable failures. |
| 12 | D-FOG-F measurement scripts + `glod-wojska-karencja-test.cjs` (no IDs) | WAITING — NEEDS IDENTIFICATION / REPRODUCTION | Identify all three scripts/contracts; reproduce and classify the test; register only after scope is known. |
| 13 | `terminology-trade-vs-tax-test.cjs`, candidate `c6b0a58d5` | BLOCKED | Candidate object and remote ref `web-wip/TERMTAX-test` are missing/deleted; existing test readback is 794/1. Require fresh candidate evidence; do not duplicate the completed terminology topic. |
| 14 | `tech-cards-top5-test.cjs` baseline debt (no ID) | WAITING — UNREGISTERED | Reproduce on current main, then assign a unique test-debt ID if actionable. |
| 15 | `civpedia-karty-nazwa-przyciskiem-test.cjs` baseline debt (no ID) | WAITING — UNREGISTERED | Reproduce on current main, then assign a unique test-debt ID if actionable. |
| 16 | `wonder-transfer-on-conquest-test.cjs` baseline debt (no ID) | WAITING — UNREGISTERED | Reproduce on current main, then assign a unique test-debt ID if actionable. |

Deferred items are outside these 18 local ranks:

| Item | State | Eligibility / decision |
|---|---|---|
| `R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1` (#165) | OWNER-HELD | Do not start until the owner releases the hold / queue is drained. |
| Rust REPIN lane (`rust-port/`, `parity-v2`) | DEFERRED | Start after the web queue ends, with its own dispatch and sparse-checkout. |

## Heartbeat and progression

At each completion or status report, refresh the timestamp, local `HEAD`, remote readback, active topic roles, receipts/artifacts, blockers, and next eligible item. A topic may leave the active set only when its actual evidence reaches the required gate; published work must not remain marked active. There is no callable scheduler here, so no background wake is claimed. After Final Control passes, the authorized flow is main integration → Robocza deployment → push/readback → cleanup → next eligible queue topic, recording 11/11 only when each stage is evidenced.
