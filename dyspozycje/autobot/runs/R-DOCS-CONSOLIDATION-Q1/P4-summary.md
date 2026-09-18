STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL / DOCUMENTATION AUDIT
TEMAT: R-DOCS-P4-STALE-DUPLICATES-Q1
ROLE: Operator
TASK_ID: t_cfb83f13
RUN_ID: 297
ROUND: 1/5
ATTEMPT: 1
GENERATED_UTC: 2026-09-14T21:54:06Z
WORKSPACE: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
BRANCH: hermes/R-DOCS-CONSOLIDATION-Q1
HEAD: d3689535ce7a7bf210f187c43448a49716774bfa
ROUTING_ACTUAL: gpt-5.6-luna/openai-codex/max/priority
SNAPSHOT_BOUNDARY: 2026-09-14T17:37:55Z
UPSTREAM_P3_SNAPSHOT_BOUNDARY: 2026-09-14T20:08:36Z
PUSH/DEPLOY: NIE WYKONANO

# WERDYKT

Read-only P4 classification is complete for every P2 inventory record. The matrix preserves each P2 source key and metadata, assigns exactly one P4 status, and carries P3 roles/conflicts plus exact duplicate/stale evidence references. No deletion, merge, rename, archive, source edit, index edit, card/board/project mutation, fetch, pull, push, or deploy was performed.

# COUNTS

| P4 status | Records |
|---|---:|
| `ACTIVE_CANONICAL` | 34896 |
| `HISTORY` | 18693 |
| `STALE_CANDIDATE` | 651 |
| `DUPLICATE_CANDIDATE` | 124 |
| `OWNER_DECISION` | 13181 |
| `SEPARATE_PROJECT` | 181 |
| `UNKNOWN_NEEDS_REVIEW` | 16582 |
| **TOTAL** | **84308** |

P2 baseline: 84,308 in-scope records (76,084 local; 8,224 remote) across 32 source roots. The P2 scan finished at `2026-09-14T17:37:55Z`.

# EXCLUSIONS AND UNKNOWNS

P2 exclusions remain outside the matrix: 9,620 excluded candidate records (9,599 local and 21 remote), including 8 non-regular candidates; no excluded record was silently reintroduced. P2 reported 0 unstable/read-error records.
P4 `UNKNOWN_NEEDS_REVIEW`: 16582 records across 536 unique paths. P2 UNKNOWN was 34411 records; the difference is explicitly accounted for by P3/path overrides (history, owner, active architecture deep-dives, stale markers, and exact duplicate secondaries). Full unknown path accounting is in `P4-evidence.json`.

# DUPLICATES

Exact duplicate evidence: 124 The-Game same-source-root SHA-256 groups and 124 secondary candidate records. The companion has 1 internal exact pair but remains wholly `SEPARATE_PROJECT`; it is not a The-Game duplicate verdict. Cross-root same-path/same-hash snapshot replicas are recorded separately (2764 groups; 84036 records) and are not deduplicated by themselves. No filename/title-only duplicate verdict was made.

# STALE CANDIDATES

21 unique paths / 651 inventory records have explicit document-level moved, superseded, retired, or not-to-use markers. Each is a non-destructive candidate only; exact marker lines, P2/current hash readback, and source-root counts are in `P4-evidence.json`. Historical evidence was assigned `HISTORY` instead of `STALE_CANDIDATE` when the source path/content explicitly preserves an archive or transition record.

# OWNER DECISIONS AND CONFLICTS

Owner-decision list: 433 unique owner-record paths; 13305 inventory records are covered by the P3 owner pattern/conflict/proposal list, of which 13181 carry the primary `OWNER_DECISION` status. Unresolved P3 conflicts 1, 4, 5, 6 and 7 remain owner-controlled; no precedence was chosen.

# ARCHITECTURE CORRECTION RULE

P3 correction was applied only as a classification rule: `rust-port/engine/**` is worktree-scoped and requires exact task/topic selection; it produced 0 Markdown-like matrix records. `gra/data/**` remains a documented missing P3 source record and produced 0 matrix records; the P3 map was not edited. `gra/src/**` produced 124 records, with primary live-path promotion only under the explicit rule.

# ROOT AND CATEGORY BREAKDOWNS

The complete deterministic status/root/category structures are in `P4-evidence.json`; category membership is multi-role when P3 assigns more than one role.

| Source root | Records | Active | History | Stale | Duplicate | Owner | Separate | Unknown |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| autoboot-monitor-companion | 181 | 0 | 0 | 0 | 0 | 0 | 181 | 0 |
| github-the-game-origin-docs-index | 2746 | 1157 | 603 | 21 | 4 | 426 | 0 | 535 |
| github-the-game-origin-main | 2745 | 1157 | 603 | 21 | 4 | 425 | 0 | 535 |
| github-the-game-origin-staging | 2733 | 1145 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-documentation-index-checkout | 2746 | 1157 | 603 | 21 | 4 | 426 | 0 | 535 |
| the-game-integration-staging | 2737 | 1149 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-primary | 2757 | 1168 | 603 | 21 | 4 | 429 | 0 | 532 |
| the-game-worktree-01-r-rustreal-01-scaffold-q1 | 2709 | 1121 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-02-r-rustreal-02-state-dto-q1 | 2706 | 1118 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-03-r-rustreal-03-rng-q1 | 2710 | 1122 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-04-r-rustreal-04-hex-terrain-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-05-r-rustreal-05-map-generator-q1-kanban | 2705 | 1117 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-06-r-rustreal-06-improvements-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-07-r-rustreal-07-resource-production-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-08-r-rustreal-08-building-costs-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-09-r-rustreal-09-turn-economy-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-10-r-rustreal-10-city-growth-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-11-r-rustreal-11-unit-epoch-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-12-r-rustreal-12-recruit-upkeep-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-13-r-rustreal-13-pathfinding-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-14-r-rustreal-14-combat-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-15-r-rustreal-15-diplomacy-q1-kanban | 2704 | 1116 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-16-r-rustreal-16-trade-q1-kanban | 2704 | 1116 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-17-r-rustreal-17-barbarians-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-18-r-rustreal-18-ai-turn-q1-kanban | 2705 | 1117 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-19-r-rustreal-19-event-queue-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-20-r-rustreal-20-save-load-q1-kanban | 2736 | 1148 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-21-r-rustreal-21-replay-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-22-r-rustreal-21-replay-q1-r2 | 2736 | 1148 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-23-r-rustreal-22-tauri-bridge-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-24-r-rustreal-23-steam-adapter-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |
| the-game-worktree-25-r-rustreal-24-parity-bench-ci-q1-kanban | 2703 | 1115 | 603 | 21 | 4 | 425 | 0 | 535 |

Category/status breakdown:

| P3/P2 category | Active | History | Stale | Duplicate | Owner | Separate | Unknown |
|---|---:|---:|---:|---:|---:|---:|---:|
| AGENT_START | 31 | 0 | 0 | 0 | 34 | 0 | 0 |
| ARCHITECTURE | 655 | 0 | 0 | 0 | 62 | 0 | 120 |
| CURRENT_HANDOFF | 0 | 31 | 0 | 0 | 62 | 0 | 0 |
| EVIDENCE | 33217 | 31 | 0 | 0 | 0 | 0 | 0 |
| HISTORY | 0 | 18662 | 0 | 0 | 0 | 0 | 0 |
| INTEGRATION_DEPLOY | 31 | 0 | 0 | 0 | 124 | 0 | 0 |
| OWNER_DECISION | 0 | 0 | 31 | 0 | 12682 | 0 | 0 |
| P2_CANONICAL | 869 | 0 | 0 | 0 | 0 | 0 | 0 |
| P2_HISTORY | 0 | 2573 | 0 | 0 | 0 | 0 | 0 |
| P2_UNKNOWN | 0 | 0 | 620 | 124 | 434 | 0 | 16369 |
| PROCESS | 93 | 0 | 0 | 0 | 32 | 0 | 0 |
| REGISTRY | 62 | 0 | 31 | 0 | 12527 | 0 | 0 |
| ROUTING | 0 | 0 | 0 | 0 | 35 | 0 | 0 |
| SEPARATE_PROJECT | 0 | 0 | 0 | 0 | 0 | 181 | 0 |
| UNKNOWN_NEEDS_REVIEW | 0 | 0 | 0 | 0 | 0 | 0 | 93 |

# VERIFICATION

- Matrix lines: 84308; unique `entry_id`: 84308; unique source keys: 84308; valid status enum: PASS.
- Same-root exact duplicate groups: 124 The-Game groups; the one companion pair is explicitly kept separate. Cross-root replica scope is excluded from duplicate status.
- Explicit stale findings: 21 unique paths; primary content/hash readback matches P2 for 21/21.
- Primary source readback: 2757/2757 present; hash/byte drift 0; missing 0.
- Input artifact hashes are captured before and after generation in `P4-evidence.json`; sensitivity scan, trailing-whitespace scan, allowlist check, tracked-diff check and `git diff --check` are recorded there.
- Next gate: independent Evaluator P4 after native readback of this run.

