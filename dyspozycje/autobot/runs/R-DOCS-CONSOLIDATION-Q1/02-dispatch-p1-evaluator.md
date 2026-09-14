# 02-dispatch — R-DOCS-P1-SCOPE-Q1 Evaluator

STATUS: PENDING_DISPATCH
DOMAIN: DOCUMENTATION / INFORMATIONAL AUDIT
PARENT: `t_a490a65d` — P1 Operator PASS, run 275
PHASE: P1 — niezależny Evaluator

## GOAL

Niezależnie zweryfikować, czy P1 rzeczywiście określił kompletny i bezpieczny
zakres audytu Markdownów The-Game na OVH i relewantnych refach GitHub, bez
modyfikowania źródeł i bez przechodzenia do P2.

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
process_phase:    evaluator
completion:       local-only
idempotency_key:  R-DOCS-CONSOLIDATION-Q1:P1:EVALUATOR:r1
notify:           notify+wake
```

## WORKSPACE

```text
workspace: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
branch:    hermes/R-DOCS-CONSOLIDATION-Q1
base:      1a355346ef12c7cdbb27dd6fb9d7da2b56c3682b
parent artifacts:
  dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1-scope.md
  dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1-sources.json
  dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/01-operator.md
```

## KONTROLE NIEZALEŻNE

1. Sprawdź, że trzy artefakty istnieją i są kompletne.
2. Zweryfikuj JSON parse i deklarowane invariants `P1-sources.json`.
3. Odtwórz niezależnie status lokalnego checkoutu, 25 aktywnych worktree,
   companion project, historycznego integration checkoutu oraz trzy remote refs.
4. Sprawdź, że wyłączenia build/cache/dependency/generated/runtime są jawne.
5. Sprawdź, że każdy zakres ma właściciela, status odczytu i ograniczenia/N/D.
6. Zweryfikuj allowlistę i `git diff --check`; nie zmieniaj artefaktów Operatora.
7. Potwierdź, że P1 nie twierdzi, iż audyt duplikatów, źródeł prawdy lub
   konsolidacja zostały już wykonane.

## ALLOWLISTA

```text
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1-scope.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P1-sources.json
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/01-operator.md
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/02-evaluator.md
```

Evaluator jest read-only wobec trzech artefaktów Operatora. Nie modyfikuj
źródeł Markdown, kodu, `gra-robocza`, WERSJE, handoffów, Kanban DB ani innych
worktree. Nie wykonuj pushu, merge, deployu, resetu, clean, stash, rebase ani
pull.

## WERDYKT

- `PASS` tylko po niezależnym potwierdzeniu wszystkich siedmiu kontroli;
- przy każdym braku zapisz numerowany zarzut z plikiem/sekcją i dowodem;
- brak dowodu nie jest PASS;
- jeśli zarzutów brak, nie uruchamiaj Defense — Final Control może przejść
  bezpośrednio po readbacku;
- nie twórz P2 i nie zmieniaj grafu poza terminalnym wynikiem tej karty.
