# 03-dispatch — R-DOCS-CARDS-TAGGING-Q1 Defense on default

STATUS: PENDING_DISPATCH
DOMAIN: DOCUMENTATION / KANBAN RECONCILIATION
PARENT: `t_9bed9920` — P1B Evaluator FAIL, run 281
PHASE: Defense recovery on default

## GOAL

Odpowiedzieć na trzy numerowane zarzuty Evaluatora i poprawić wyłącznie
allowlisted dokumenty/inventory, bez modyfikowania kart, boardu, project DB,
receiptów ani historii.

## ROUTING

```text
board:            the-game-real24
profile/assignee: default
project_id:       p_9ae9ac64
tenant:           the-game
model:            gpt-5.6-luna
provider:         openai-codex
reasoning_effort: max
service_tier:     priority
process_phase:    defense
completion:       local-only
idempotency_key:  R-DOCS-CARDS-TAGGING-Q1:DEFENSE:default:r1
notify:           notify+wake
```

## WORKSPACE

```text
workspace: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
branch:    hermes/R-DOCS-CONSOLIDATION-Q1
base:      e75776260286b23078f0c7fcc0836b73a1a0f41c
```

## ODPOWIEDZI NA ZARZUTY

### 1 — `p_09e13254` jako current/in-scope

Przelabeluj w inventory/mapie i The-Game guide wszystkie karty z
`p_09e13254` jako `LEGACY_ORPHANED`/`INFRA`, nie jako bieżący anchor default.
Zachowaj ich task ID, historię, evidence i relacje. Bieżący anchor to
`default/the-game/p_9ae9ac64`. Uzupełnij `AGENT-START-HERE.md`, aby nie wskazywał
p09 jako aktywnego projektu. Nie zmieniaj tasków Kanbana.

### 2 — brak `generated_at`

Wykonaj nowy, jawnie oznaczony read-only snapshot boardu i zapisz dokładny
UTC `generated_at` z momentu rozpoczęcia. Dodaj metadane snapshotu do inventory
oraz mapy/raportu tak, aby populacja i granica czasu były jednoznaczne. Nie
udawaj, że timestamp jest historyczny; oznacz poprzedni inventory jako
snapshot poprzedni i zapisz nową populację/wyjątki.

### 3 — projekcja receiptów

Nie wymyślaj brakujących `idempotency_key`/`current_run_id`. Oznacz w guide,
inventory i mapie `projection_gap: unknown`, podaj źródło (`show`, `runs`,
event/native projection) i konsekwencję: brak retry/duplikatu bez dodatkowego
readbacku. Zachowaj pozytywne dowody z `runs` i argv osobno.

## ALLOWLISTA

```text
dyspozycje/autobot/R-DOCS-CARDS-TAGGING-GUIDE.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-inventory.jsonl
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1B-card-document-map.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/04-cards-operator.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/05-cards-evaluator-default.md
AGENT-START-HERE.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/06-cards-defense-default.md
```

Nie zmieniaj kart, boardu, `kanban.db`, project DB, kodu, `gra-robocza`,
WERSJE, handoffów ani innych worktree. Nie wykonuj pushu, merge, deployu,
resetu, clean, stash, rebase ani pull.

## DOWODY KOŃCA

- JSONL/mapa parse, unique IDs i map coverage;
- nowy `generated_at` i jasno opisany snapshot boundary;
- p09 oznaczony legacy/orphaned, p9ae jako current default anchor;
- receipt gaps jawne i nieuzupełniane domysłem;
- linki, sensitivity, whitespace i `git diff --check` PASS;
- osobna odpowiedź `PRZYJMUJĘ`/`ODRZUCAM` dla zarzutów 1–3.

Po terminalnym Defense Orchestrator wykona readback i utworzy aktualny Final
Control na `default`; P2 nadal pozostaje zablokowany.
