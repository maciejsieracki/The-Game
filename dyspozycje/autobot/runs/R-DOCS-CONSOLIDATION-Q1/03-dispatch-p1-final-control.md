# 03-dispatch — R-DOCS-P1-SCOPE-Q1 Final Control

STATUS: PENDING_DISPATCH
DOMAIN: DOCUMENTATION / INFORMATIONAL AUDIT
PARENT: `t_44f12fa4` — P1 Evaluator PASS-WITH-NOTES, run 276
PHASE: P1 — Final Control

## GOAL

Niezależnie rozstrzygnąć, czy P1 jest gotowy do zamknięcia mimo jawnie
udokumentowanego driftu live po snapshotach. Potwierdzić, że zakres, artefakty,
allowlista, wyłączenia i ograniczenia są wystarczające jako wejście do osobnej
fazy katalogowania kart The-Game, bez uruchamiania P2 przed tą fazą.

## ROUTING

```text
board:            the-game-real24
profile/assignee: the-game
tenant:           the-game
project_id:       p_09e13254
model:            gpt-5.6-luna
provider:         openai-codex
reasoning_effort: ultra
service_tier:     priority
process_phase:    final-control
completion:       local-only
idempotency_key:  R-DOCS-CONSOLIDATION-Q1:P1:FINAL-CONTROL:r1
notify:           notify+wake
```

## WORKSPACE

```text
workspace: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
branch:    hermes/R-DOCS-CONSOLIDATION-Q1
base:      1a355346ef12c7cdbb27dd6fb9d7da2b56c3682b
```

## DOWODY DO SPRAWDZENIA

- P1 Operator `t_a490a65d`, run 275;
- P1 Evaluator `t_44f12fa4`, run 276;
- `P1-scope.md`, `P1-sources.json`, `01-operator.md`, `02-evaluator.md`;
- live readback źródeł i workspace, bez modyfikacji aktywnego primary checkoutu;
- drift zapisany przez Evaluatora: companion snapshot 216 vs live 217 oraz
  zmienne registry/worktree counts.

## KRYTERIA KOŃCA

1. Każdy z czterech raportów istnieje i wskazuje rzeczywisty zakres.
2. Drift ma jawny timestamp/snapshot semantics i nie jest przedstawiany jako
   brak audytu.
3. Zakres zawiera board `the-game-real24`, project `p_09e13254`, primary,
   worktree, staging, companion oraz relewantne GitHub refs.
4. Wyłączenia i ograniczenia `N/D` są jawne.
5. Allowlista P1 została zachowana; brak zmian w kodzie i źródłowej dokumentacji.
6. Final Control potwierdza, że Defense nie była wymagana: Evaluator nie miał
   numerowanych zarzutów.
7. Następną bramką jest osobna faza `R-DOCS-CARDS-TAGGING-Q1`, nie P2.

## ALLOWLISTA

```text
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1-scope.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1-sources.json
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/01-operator.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/02-evaluator.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/03-final-control.md
```

Nie modyfikuj raportów Operatora/Evaluatora, źródeł Markdown, kodu,
`gra-robocza`, WERSJE, handoffów, Kanban DB ani innych worktree. Nie wykonuj
pushu, merge, deployu, resetu, clean, stash, rebase ani pull.

## WERDYKT

`PASS` tylko wtedy, gdy drift jest poprawnie opisany jako snapshot drift i nie
podważa zakresu P1. Przy materialnej luce zapisz numerowany zarzut/`BLOCK`; nie
uruchamiaj katalogowania kart ani P2 przed recovery P1.
