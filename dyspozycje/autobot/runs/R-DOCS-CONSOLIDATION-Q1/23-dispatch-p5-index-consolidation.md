STATUS: DISPATCHED
DOMAIN: INFORMATIONAL
TEMAT: R-DOCS-P5-INDEX-CONSOLIDATION-Q1
TASK_ID: t_518149f7
RUN_ID: 328
ROLE: Operator
ROUND: 1/5
GENERATED_UTC: 2026-09-15T09:16:46Z

TRIGGER
Owner authorization in the current Kanban task: finish and secure the documentation package before starting the code rewrite. Parent P4 `t_b9af8ac8` / run 304 is terminal `PASS-WITH-NOTES`; P5 is authorized here as an index-only continuation over the frozen P2/P3/P4 evidence. No new P2 inventory is authorized or created.

GOAL
Convert the verified P2/P3/P4 documentation audit into a canonical, navigable index/entrypoint package without deleting, merging, renaming, or silently changing source or history documents.

BINARY ACCEPTANCE
1. Every Markdown link and canonical source pointer used by `AGENT-START-HERE.md` and `docs/procesy/INDEX-PROCESU.md` resolves against this worktree, or is explicitly marked as a non-link pattern/external boundary.
2. P2/P3/P4 counts and the `OWNER_DECISION` and `UNKNOWN_NEEDS_REVIEW` classes remain visible; stale and duplicate findings remain candidates only.
3. The current identity is explicit: profile `default`, project `p_9ae9ac64`, board `the-game-real24`, tenant `the-game`.
4. `git diff --check`, link/fence checks, sensitivity scan, and input-hash readback pass; the P5 report names all changed paths, unchanged input hashes, unresolved decisions, and the next legal P6 gate.
5. Only the two allowlisted index/entrypoint files and new P5 run artifacts change. No P6, integration, push, merge, or deploy is performed.

ALLOWLIST
- `AGENT-START-HERE.md`
- `docs/procesy/INDEX-PROCESU.md`
- new files in `dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/`:
  - `23-dispatch-p5-index-consolidation.md`
  - `P5-index-consolidation.md`
  - `P5-evidence.json`
  - `P5-transition-receipt.json`

INPUTS PRESERVED READ-ONLY
- P2 inventory/manifest/summary/exclusions and P2 Final Control evidence.
- P3 source-of-truth map, conflicts, evidence, and Final Control artifacts.
- P4 stale/duplicate matrix, summary, evidence, and Final Control artifacts.
- `README.md`, `docs/decyzje/R-PROC-AUTOBOT.md`, active AutoBot README, handoff, registry, and ABC register.
- Native profile/project/board readback and read-only Git/remote-ref readback.

ROUTING AND WORKSPACE
- profile: `default`
- project: `the-game` / `The Game Box`
- project_id: `p_9ae9ac64`
- board: `the-game-real24`
- tenant: `the-game`
- workspace: `/home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1`
- branch: `hermes/R-DOCS-CONSOLIDATION-Q1`
- base HEAD at dispatch: `d3689535ce7a7bf210f187c43448a49716774bfa`
- completion contract: `local-only`
- status entries before P5 artifacts: `64` (pre-existing dirty evidence is preserved)

METHOD
1. Read the entrypoint and process index, then correct only stale P1B/current-routing text and add verified P2/P3/P4/P5 navigation.
2. Keep README as the universal source named by README itself; treat AGENT as the project-local extended navigator without silently resolving P3 owner conflict 1.
3. Record the frozen snapshot boundary, counts, current-vs-snapshot distinction, duplicate/stale/unknown accounting, and unresolved P3 conflicts.
4. Check every actual Markdown link and every exact pointer used by the two entrypoints. Keep path globs and external companion paths as explicit code-pattern boundaries, not guessed links.
5. Write the P5 report, machine evidence, and a transition receipt. Hash all preserved inputs and the final index files; do not include a self-referential hash.
6. Perform final Git/sensitivity/hygiene/readback checks and hand off the same task with a terminal Kanban report.

NEXT GATE
Terminal P5 readback, then independent Evaluator P5 and Final Control P5. Only after those terminal gates may the orchestrator open P6 as a non-destructive consolidation plan. P6 still requires explicit owner decisions for unresolved conflicts and does not authorize deletion, merging, publication, integration, or deploy.

PUSH/DEPLOY: NIE WYKONANO
