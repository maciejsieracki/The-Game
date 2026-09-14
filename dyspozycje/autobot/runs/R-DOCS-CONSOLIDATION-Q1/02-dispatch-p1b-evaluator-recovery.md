# 02-dispatch — R-DOCS-CARDS-TAGGING-Q1 Evaluator recovery

STATUS: PENDING_DISPATCH
DOMAIN: DOCUMENTATION / KANBAN RECONCILIATION
PARENT: `t_fc2b93bb` — P1B Operator PASS-WITH-NOTES, run 278
RECOVERY OF: `t_11cc108f` — automatic Evaluator, run 279, CRASH
PHASE: P1B — niezależny Evaluator recovery

## GOAL

Niezależnie sprawdzić kompletność i prawidłowość inventory 246/246 kart
`the-game-real24`, mapowania kart do wymaganych dokumentów i aktualizacji
`AGENT-START-HERE.md`. Crash t_11cc108f zachować jako proweniencję; nie
uruchamiać go ponownie, ponieważ native routing nie było kompletne.

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
idempotency_key:  R-DOCS-CARDS-TAGGING-Q1:EVALUATOR:current-anchor:r2
notify:           notify+wake
```

## WORKSPACE

```text
workspace: /home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1
branch:    hermes/R-DOCS-CONSOLIDATION-Q1
base:      1fbf2435847aee84183c72fffaf6c7dc99752ad5
```

Read the five Operator artifacts directly from this workspace and verify the
primary/active source roots read-only. Do not reset, clean, stash, rebase or
pull.

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
dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/05-cards-evaluator.md
```

Nie modyfikuj pięciu artefaktów Operatora ani żadnych kart Kanbana.

## KONTROLE NIEZALEŻNE

1. Ponów board-scoped `list/show/runs` i potwierdź 246/246; sprawdź, czy
   archived zostały uwzględnione, a liczby są snapshotem z `generated_at`.
2. Sprawdź JSONL parse, unikalność task IDs, kompletność pól i zgodność mapy
   z inventory.
3. Wylosuj/wybierz reprezentatywne karty z każdego statusu, historyczne,
   routing-error, owner-hold i zarchiwizowane; odtwórz ich parent/child,
   workspace i evidence.
4. Potwierdź, że karty spoza The-Game są tylko oznaczone OUT_OF_SCOPE, a
   `autobot-monitor` nie został zmieniony.
5. Sprawdź mapowanie każdej karty do `AGENT-START-HERE.md`, odpowiedniego
   procesu, topic evidence i wymaganych dokumentów.
6. Sprawdź The-Game guide: board → project → tenant → assignee → phase → topic,
   klasyfikacje, no-SQL/no-cross-board, readback commands.
7. Zweryfikuj linki, whitespace, sensitivity scan, `git diff --check` i brak
   zmian w kodzie/source docs poza allowlistą Operatora.
8. Uznaj brakujące idempotency/projection fields za jawne routing gaps, nie za
   domyślny sukces.

## WERDYKT

- `PASS` tylko z dowodem wszystkich kontroli;
- `PASS-WITH-NOTES` tylko dla jawnie nieblokującego snapshot driftu;
- każdy brak, niespójność lub routing gap wpływający na mapowanie to numerowany
  zarzut; Defense dopiero po takim zarzucie;
- nie uruchamiaj P2 ani Final Control przed terminalnym wynikiem tej karty i
  kolejnym readbackiem.
