# Independent re-evaluation — R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1

**Verdict: PASS-WITH-NOTES. Gate 5/11 complete; operator defense is accepted and the run may proceed to Final Control.** Reviewed defense commit `16e02c146d71484bdc29918746434bbac176cc88`. No product source was edited.

## Independent production Chromium rerun

Ran the corrected `battle-manual-queued-order-lifecycle-live-test.cjs` from the operator worktree with a fresh production build and Chromium/WebGL session. The first attempt could not build because an earlier sandbox cleanup had removed the nested `vite/node_modules` from a shared dependency symlink; this was an environment/setup error. After restoring generated dependencies with `npm ci` in the dependency owner, the fresh run completed:

- Vite: 917 modules; bundle 70,029,425 bytes; SHA-256 `2164c747231241b2c148940fa1c6b602a77006c984b3f12f45330b6f42ecac0e`.
- Production mixed battle: 28v28; player roster 20 ranged and 8 mounted/chariots. The commander gate rejected AUTO→MANUAL without a commander.
- First queued cycle: 28/28 activated, queue cleared to zero, 8 units moved.
- Corrected browser harness: **15/15 PASS**, zero page/console errors.
- Second-cycle pointer evidence: issue at round 2 / `turnIdx=14`; `atk27` was eligible for immediate dispatch and absent from the stale queue. `_performPlayerOrder` ran with `immediateBatch=true` and no `_activateUnit` context. `atk27` has `turnOrderIndex=27`; its order began before ordinary activation. Its move completed at `turnIdx=26`, before any ordinary activation of `atk27` (none occurred in the trace).
- Formation offset: click `(31,72)`, `groupId="1"`, `formationOffset={dc:0,dr:-4}`, expected production target `(31,68)`, matching `playerOrder`. Position changed `(30,72)→(31,71)` toward that target.
- Dead queued ID probe: skipped dead `atk0`, removed its marker, activated next live `atk1`; queue empty.

## Independent evidence validation

I separately recomputed the five defense predicates from the fresh saved browser result: immediate dispatch eligibility, immediate execution with no activation context, no ordinary activation of `atk27`, exact group-offset target, and actual position change — **5/5 PASS**. All 15 harness checks were also true in the saved JSON.

- `node --check tools/battle-manual-queued-order-lifecycle-live-test.cjs` — PASS.
- `npm run typecheck` — PASS.
- `git diff --check 2340e5dd..16e02c14` — PASS.
- Fresh rerun artifacts are under `evidence/evaluator-rerun-20261030/`. SHA-256: screenshot `8363af88…`, execution trace `62ef93be…`, result `fb1a37bd…`.

The operator's earlier 14/15 attempt had a strict `turnOrderIndex > turnIdx` assertion. The fresh corrected rerun demonstrates that equality at the boundary is legal and that the reported immediate execution behavior holds. The initial dependency failure is recorded here as a repaired environment problem; it did not alter source or invalidate the successful rerun.

## Scope and next gate

This confirms queue bookkeeping and the tested 28v28 manual-order lifecycle, including a real second-round pointer command and the dead-queue-candidate path. It does not exercise every order type or a full 120-unit battle. No integration, deploy, or push was performed. Final Control is the next gate.
