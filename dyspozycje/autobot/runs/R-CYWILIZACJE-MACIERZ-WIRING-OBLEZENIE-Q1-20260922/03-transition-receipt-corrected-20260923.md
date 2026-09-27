TRANSITION RECEIPT
TEMAT: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
FROM: Final Control corrected whole topic
TO: Existing workerless INTEGRATION_REQUIRED gate / Orchestrator
DATE: 2026-09-23
STATUS: PASS-WITH-NOTES — product acceptance=true
RUNDY: 2/5

TECHNICAL READBACK:
- Task worktree: `/home/ubuntu/projects/The-Game-civ-matrix-wiring-oblezenie-20260922`.
- Dispatch HEAD: `f52f3b76`; current readback HEAD: `389d6b19`.
- The HEAD advance is a separate docs-only integration-gate commit; the eight-path product diff is unchanged and remains within the approved allowlist.
- `git diff --check`: exit 0; no commit/push/merge/deploy performed by this Final Control.

CONTEXT READBACK:
- Prior Final Control FAIL identified the live AI siege defender-strength omission.
- Narrow Operator correction and independent Evaluator PASS are present in `narrow-correction-20260923/`.
- Direct audit confirms both AI callers use the defending city's nullable civKey, the two city-defense matrix parameters reach the AI strength estimate, and structure is applied once in the AI heuristic only.
- Direct audit confirms defender ownership for city/wall defense, attacker ownership for siege-machine damage, and no defender sortie path that calls wall/gate destruction.
- Matrix readback: 45/45 cells equal INPUT; 20 changed `(civKey, field)` paths versus origin/main, no non-Oblężenie field drift, zero intersection with the 19 Manpower paths.

VERDICT:
- No blocking objection remains.
- PASS-WITH-NOTES records only the intentional AI-heuristic vs real-battle scope difference (Obrona+Pancerz in the estimate versus defensive component in the real battle), plus the pre-existing unrelated baseline test failures.
- Required tests are green: tsc; wiring 83/0; siege AI 17/0; logic 213/213; city-defense 34/0; defense breakdown 44/0; fortify 41/0; mur 29/0; militia siege 8/0; diff-check.
- Baseline notes remain: empire 115/1 and koszty 126/3, reproduced unchanged.

LEGAL SUCCESSOR:
Reuse exactly one existing `05-integration-gate.md` gate, marked `INTEGRATION_PENDING`, blocked, workerless/unassigned. Do not dispatch it. Merge, push, and deploy remain owner-authorized actions outside this phase.
DEPLOY/PUSH: NIE WYKONANO.
