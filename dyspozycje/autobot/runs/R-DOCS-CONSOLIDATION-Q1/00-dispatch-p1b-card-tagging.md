# 00-dispatch — R-DOCS-CARDS-TAGGING-Q1

STATUS: PENDING_DISPATCH
DOMAIN: DOCUMENTATION / KANBAN RECONCILIATION
PARENT: `t_9fe791b8` — P1 Final Control PASS, run 277
PHASE: P1B — katalog kart The-Game i mapowanie do dokumentów

## OWNER SCOPE OVERRIDE

Załączony `ABM-CARD-TAGGING-GUIDE.md` jest wzorcem procedury, ale jego
pierwotny zakres ABM jest wyłączony. Ten temat dotyczy wyłącznie:

```text
board:      the-game-real24
project:    p_09e13254
profile:    the-game
tenant:     the-game
```

Nie dotykaj `autobot-monitor`, `p_ffb5c6ad`, `the-game-bugs`, `default` ani
kart innych projektów. Nie przenoś kart między boardami.

## GOAL

Zinwentaryzować i uporządkować wszystkie karty boardu `the-game-real24`, w tym
aktywne, historyczne i zarchiwizowane, oraz powiązać każdą kartę/temat z
wymaganymi dokumentami, dispatchami, raportami i evidence w indeksie
`AGENT-START-HERE.md`. Zachować historię i nie naprawiać niepewnych kart przez
zgadywanie.

## ROUTING

```text
board:            the-game-real24
profile/assignee: the-game
tenant:           the-game
project_id:       p_09e13254
model:            gpt-5.6-luna
provider:         openai-codex
reasoning_effort: max
service_tier:     priority
process_phase:    operator
completion:       local-only
idempotency_key:  R-DOCS-CARDS-TAGGING-Q1:OPERATOR:r1
notify:           notify+wake
```

## WORKSPACE

```text
workspace: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
branch:    hermes/R-DOCS-CONSOLIDATION-Q1
base:      1a355346ef12c7cdbb27dd6fb9d7da2b56c3682b
```

Primary checkout, active worktree and staging are read-only sources. Kanban
readback must always use the explicit board `the-game-real24`.

## INVENTORY — KAŻDA KARTA

Dla każdej karty zapisz programowo:

```text
task_id
topic_key / topic evidence
title
status / archived
project_id
tenant
assignee/profile
process_phase
workspace_kind/path/branch
parents/children
idempotency_key: present/missing/unknown
model/provider/reasoning/service_tier: requested/inherited/actual/unknown
created/updated/completed timestamps
current_run_id and all run IDs
terminal event/result
required documents
report/evidence paths
classification: CONFIRMED | INFERRED | UNKNOWN
```

Zakres obejmuje pełny board, nie tylko `running`, `todo` i `scheduled`. Karty
spoza The-Game zostaw w raporcie zakresowym jako `OUT_OF_SCOPE`, bez modyfikacji.
Nie ujawniaj sekretów, tokenów ani surowych connection strings.

## WYMAGANE ARTEFAKTY

```text
dyspozycje/autobot/R-DOCS-CARDS-TAGGING-GUIDE.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-inventory.jsonl
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-document-map.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/04-cards-operator.md
AGENT-START-HERE.md
```

The-Game guide must adapt the attached ABM rules and explicitly state:
`board → project_id → tenant → assignee → process_phase → topic`, the
classification rules, the no-SQL/no-cross-board boundary, and the required
readback commands.

The document map must contain at least:

```text
card/task ID → stable topic → phase → required documents → evidence path
           → status/classification → routing gaps → next legal action
```

Do not attach the same large file to every card. The canonical inventory and
map are the association layer. After full PASS, Orchestrator may attach the
approved guide/inventory/map to this tagging card and add their links to the
required-document index.

## RECONCILIATION RULES

- Never modify a `RUNNING` card or active claim.
- Do not change historical receipt/event evidence.
- Do not use manual SQL or edit `kanban.db`.
- Do not move cards between boards.
- Do not invent missing project, tenant, topic or idempotency values.
- If a supported CLI/API correction is unambiguous and the card is non-running,
  record before/after and read back the exact target.
- If the field cannot be changed through a supported operation, classify
  `INFRA/UNKNOWN` and preserve the card; do not create a duplicate merely to
  make counts look clean.
- Keep The-Game profiles and ABM profiles separate even when a worker profile
  happens to be `autobotmonitor`.
- Owner HOLDs, process-only gates and historical cards remain visible in the
  map; they are not silently archived.

## BINARY ACCEPTANCE CRITERIA

1. Full board inventory completed, including archived cards or an explicit
   documented limitation with counts.
2. Every card has one classification and a required-document mapping.
3. All The-Game cards are linked in the map to `AGENT-START-HERE.md`, the
   relevant process source, and their topic evidence path; topic-specific
   required docs are listed separately.
4. Unknown/historical/routing-error cards are preserved and enumerated.
5. No cross-board mutation, SQL, deletion, or secret leakage occurred.
6. `AGENT-START-HERE.md` gains a required card-tagging guide and navigation
   section without removing existing source links.
7. Inventory is deterministic, JSONL parses, counts reconcile with Kanban
   readback, and artifacts pass whitespace/link/sensitivity checks.
8. Operator writes a complete handoff for independent Evaluator; no P2 starts
   from this card.

## NEXT GATES

After Operator PASS, create the independent Evaluator with parent this card.
Defense only for numbered objections. After Final Control PASS, Orchestrator
attaches the approved canonical artifacts to this card, verifies links and
readback, then creates P2 with parent on the terminal P1B staging/readback.
