# 02-dispatch — R-DOCS-CARDS-TAGGING-Q1 Evaluator recovery on default

STATUS: PENDING_DISPATCH
DOMAIN: DOCUMENTATION / KANBAN RECONCILIATION
PARENT: `t_fc2b93bb` — P1B Operator PASS-WITH-NOTES, run 278
RECOVERY OF: `t_11cc108f` — crashed/blocked after deleted `the-game` profile
PHASE: P1B — independent Evaluator recovery

## PROFILE CONSOLIDATION

The owner selected one user profile. This recovery uses the existing default
profile and the existing The-Game project already registered there:

```text
profile:    default
project:    the-game / p_9ae9ac64
board:      the-game-real24
primary:    /home/ubuntu/projects/The-Game
```

Do not create a profile, board or project. Do not use `autobotmonitor`,
`the-game`, `the-game-bugs` or `default` board. The crashed card
`t_11cc108f` remains blocked history and must not be dispatched.

## GOAL

Independently verify the completed P1B inventory of all 247 board cards, the
card-to-document map, The-Game tagging guide and `AGENT-START-HERE.md`, then
produce a terminal Evaluator report. No card, history or source document may be
mutated by the Evaluator.

## ROUTING

```text
board:            the-game-real24
profile/assignee: default
tenant:           the-game
project_id:       p_9ae9ac64
model:            gpt-5.6-luna
provider:         openai-codex
reasoning_effort: max
service_tier:     priority
process_phase:    evaluator
completion:       local-only
idempotency_key:  R-DOCS-CARDS-TAGGING-Q1:EVALUATOR:default:r1
notify:           notify+wake
```

## WORKSPACE

```text
workspace: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
branch:    hermes/R-DOCS-CONSOLIDATION-Q1
base:      1fbf2435847aee84183c72fffaf6c7dc99752ad5
```

## ARTEFAKTY DO SPRAWDZENIA

```text
dyspozycje/autobot/R-DOCS-CARDS-TAGGING-GUIDE.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-inventory.jsonl
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-document-map.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/04-cards-operator.md
AGENT-START-HERE.md
```

Evaluator może zapisać wyłącznie:

```text
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/05-cards-evaluator-default.md
```

## KONTROLE

1. Reconcile live list/show/runs on `the-game-real24` and verify every indexed
   card ID remains present; include archived cards and generated_at semantics.
2. Validate JSONL uniqueness/completeness and map coverage.
3. Check representative cards across all statuses, project anchors, historical
   and routing-error classifications, parent/child links and evidence paths.
4. Confirm the 33 actionable p_9ae9ac64 cards now have assignee `default` and
   that completed/history cards were not rewritten.
5. Confirm p_09e13254 cards are explicitly classified as orphaned/legacy and
   are not silently treated as current default-project cards.
6. Check board/project/profile boundaries, required-document links, guide rules,
   whitespace, sensitivity and `git diff --check`.
7. Do not modify Kanban cards, board databases, project records or source docs.

## VERDICT

`PASS` requires evidence for every control. Any routing/map gap is a numbered
objection; Defense is conditional on such objections. Do not start P2 or Final
Control before this Evaluator reaches a terminal result and the next routing
readback is complete.
