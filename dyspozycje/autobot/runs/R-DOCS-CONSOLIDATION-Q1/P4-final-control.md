STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL
TEMAT: R-DOCS-P4-STALE-DUPLICATES-Q1
TASK_ID: t_b9af8ac8
RUN_ID: 304
ATTEMPT: 1
ROLE: Final Control
ROUND: 1/5
GENERATED_UTC: 2026-09-14T23:29:39+00:00

PARENTS AND PROVENANCE
- Evaluator: t_56e2566c, native run 300, terminal FAIL with one material objection: current primary drift in exactly two records.
- Valid Defense routing repair: t_3364295a, native run 302, terminal PASS-WITH-NOTES, attempt 2; native route gpt-5.6-luna/openai-codex/max/priority; created/claimed/spawned native events are present.
- Operator recovery: t_72f7cf59, native run 298, terminal PASS-WITH-NOTES.
- Invalid prior Defense: t_ebb341ae/run 301 is history only; its created event and argv omitted reasoning_effort/service_tier/process_phase and it is not used as current Defense evidence.
- Current route readback: live worker argv matches gpt-5.6-luna/openai-codex/ultra/priority; task created route is final-control/ultra/priority.

SNAPSHOT BOUNDARY
- Frozen P2 snapshot boundary: 2026-09-14T17:37:55Z; P2 manifest generated_at: 2026-09-14T17:33:31Z.
- Frozen P4 matrix: 84308 JSONL records, 153698667 bytes, SHA-256 d398e05512c3628984f0104b42df1b5bfbcbcebdf8a60c302496ffe68b4abd4f; snapshot-scoped only.
- No new P2 snapshot was authorized or created. The two current files must not be treated as live-current values of the frozen matrix.

OBJECTION 1 — DISPOSITION
- ACCEPTED FACTUALLY: a current primary readback reproduces exactly 2 drifted records among 2757 present records; missing=0, read_errors=0.
- Current drift paths: dyspozycje/PYTANIA-OTWARTE.md and dyspozycje/REJESTR-PROSB-I-ZADAN.md. Exact P2/current/Defense-302 metadata is in P4-final-control-evidence.json.
- Defense 302 recorded two equal full passes and 7 samples over 120 seconds with unstable=0 and drift=2. This Final Control independently reproduced two equal passes and a fresh 7-sample/120-second window with unstable=0 and drift=2.
- Exact origin, author and commit remain UNVERIFIED. No owner precedence or semantic meaning was inferred. The changes are classified only as explainable post-snapshot working-tree drift; no source repair and no new snapshot.

INDEPENDENT P2/P4 READBACK
- P2 inventory: 84308 records, 32 source roots, local=76084, remote=8224; classifications={"CANONICAL": 13740, "EVIDENCE": 33217, "HISTORY": 2759, "SEPARATE_PROJECT": 181, "UNKNOWN": 34411}.
- P4 status counts: {"ACTIVE_CANONICAL": 34896, "DUPLICATE_CANDIDATE": 124, "HISTORY": 18693, "OWNER_DECISION": 13181, "SEPARATE_PROJECT": 181, "STALE_CANDIDATE": 651, "UNKNOWN_NEEDS_REVIEW": 16582}.
- Exact same-root SHA-256 duplicate evidence: The-Game groups=124, companion excluded groups=1, cross-root replica groups=2764, cross-root replica records=84036. Filename/title alone was not used.
- Explicit stale evidence: paths=21, records=651, primary hash matches=21/21; candidate only, not deletion.
- Owner decision evidence: preserved list paths=433, owner-pattern records=13305, OWNER_DECISION matrix records=13181; unresolved P3 conflicts=[1, 4, 5, 6, 7]; precedence selected=false.
- Unknown accounting and all per-status/per-category/per-root counts are in the evidence JSON; no P5/P6 recommendation was made.

MUTATION AND DELIVERY BOUNDARY
- This run used read-only source/P2/P3/P4/native readbacks and wrote only the three allowlisted Final Control artifacts below.
- No source document, AGENT-START-HERE, index, code, gra/, card, board, project DB or remote ref was changed by this run. No fetch, pull, push, merge, deploy, READY_FOR_DEPLOY, P5 or P6.
- Delivery subscription is present with delivery_mode=notify+wake. Native readback exposes no notify/ping event proof (last_ping_event_id=0); this is recorded as not exposed, not inferred.

BLOCKADY
- Exact origin/author/commit of both post-snapshot drifts is unresolved.
- Any live consolidation or new inventory needs an explicit owner/orchestrator decision and a new authorized P2 snapshot.
- Native notify event proof is not exposed by the current readback; subscription presence and claimed+spawned wake evidence are separate facts.

NEXT GATE
No P5/P6, integration or deploy. Await owner/orchestrator decision for any new authorized snapshot; only then may a later gate evaluate live-current content.

ROUTING_ACTUAL: gpt-5.6-luna/openai-codex/ultra/priority
PUSH/DEPLOY: NIE WYKONANO
WORKSPACE: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
BRANCH: hermes/R-DOCS-CONSOLIDATION-Q1
PROFILE: default
PROJECT_ID: p_9ae9ac64
COMPLETION_CONTRACT: local-only
