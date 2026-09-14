# 00-dispatch — R-DOCS-P1-SCOPE-Q1

STATUS: PENDING_DISPATCH
DOMAIN: DOCUMENTATION / INFORMATIONAL AUDIT
PARENT TOPIC: R-DOCS-CONSOLIDATION-Q1
PHASE: P1 — zakres audytu

## GOAL

Ustalić i udokumentować kompletny, bezpieczny zakres audytu Markdownów The-Game
na OVH i w relewantnych refach GitHub, wraz z katalogami wyłączonymi z normalnej
dokumentacji. Nie analizować jeszcze duplikatów i nie zmieniać żadnych źródeł.

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
idempotency_key:  R-DOCS-CONSOLIDATION-Q1:P1:OPERATOR:r1
notify:           notify+wake
```

## WORKSPACE

```text
workspace: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
branch:    hermes/R-DOCS-CONSOLIDATION-Q1
base:      origin/main @ 1a355346ef12c7cdbb27dd6fb9d7da2b56c3682b
```

Primary dirty checkout and active worktree are read-only sources:

```text
/home/ubuntu/projects/The-Game
/home/ubuntu/projects/The-Game-real24-current-worktrees/**
/home/ubuntu/projects/The-Game-real24-integration-staging
/home/ubuntu/projects/Autoboot-Monitor
```

GitHub read-only sources: `origin/main` and branch
`docs/agent-documentation-index-20260914`, plus another ref only when the
inventory proves it is relevant to The-Game documentation.

## ALLOWLISTA ARTEFAKTÓW

```text
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1-scope.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1-sources.json
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/01-operator.md
```

Nie edytuj dokumentów źródłowych, kodu, `gra-robocza`, WERSJE, handoffów,
Kanban DB ani innych worktree. Nie wykonuj pushu, merge, deployu, resetu,
clean, stash, rebase, pull ani `git add .`/`git add -A`.

## KRYTERIA KOŃCA OPERATORA

1. Zidentyfikowano główny repozytorium, companion project i relewantne worktree.
2. Zidentyfikowano lokalny zakres OVH oraz GitHub refs i SHA użyte do audytu.
3. Wymieniono wyłączenia: build/cache/dependency/generated/runtime state.
4. Każde źródło ma właściciela i status odczytu; nie ma ukrytego katalogu.
5. Nie zapisano sekretów ani pełnych surowych treści dokumentów.
6. Raport zawiera ograniczenia i `N/D` tam, gdzie brak dowodu.

Po Operatorze osobny Evaluator ma sprawdzić listę i zakres read-only. Nie
uruchamiaj następnej fazy przed Final Control i Orchestrator readback.
