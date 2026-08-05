# R-PROC-AUTOBOT — AutoBot (Evaluator–Operator)

**Status:** 🟢 OBOWIĄZUJE (Maciej 2026-08-05) — scaffold + zasada procesu  
**Źródło:** Maciej — Principal AI Systems Engineer brief (AutoBot / Auto-boc)  
**Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Kod / playbook:** `dyspozycje/autobot/`

---

## Cel

Self-improving agent framework w patternie **Evaluator–Operator**:
- **Operator** wykonuje zadanie według `playbook.json`
- **Evaluator** mierzy twarde metryki, liczy deltę, robi postmortem i aktualizuje playbook

U nas (Civ / Cursor): ta sama logika steruje pracą agentów — nie „jednorazowy fix i zapomnij”, tylko pętla z win/loss i guardrails.

---

## Mapowanie na nasze role

| AutoBot | U nas |
|---------|--------|
| **OperatorAgent** | Implementer (`composer-2.5`) — czyta playbook + dyspozycję, wykonuje kod/testy |
| **EvaluatorAgent** | Adwokat diabła + Grok final (+ metryki: testy PASS/FAIL, playtest OK/BUG, regresje) |
| **playbook.json** | `dyspozycje/autobot/playbook.json` — reguły z win/loss / win_rate |
| **Guardrails** | Zakaz merge→main / deploy bez hasła `deploy` / krytyczne = bramka Macieja |
| **Feature pruning** | Nie pakować do kontekstu Operatora atrybutów bez mocy predykcyjnej (śmieciowy kontekst) |

**Potrójna warstwa** (`R-PROC-POTROJNA-WARSTWA`) = konkretna realizacja Evaluator przed „gotowe”/deploy. AutoBot = szersza pętla uczenia się z playbooka.

---

## Twarde guardrails (NIENEGOCJOWALNE)

1. Operator **NIE** merge do `main`, **NIE** deploy ROBOCZA/KANON/FINALNA bez hasła Macieja.
2. Krytyczne akcje (promocja kanonu, finalna, force-push, kasowanie danych gry) → **mandatory human approval**.
3. „Zwycięzca testu” / zmiana progu w playbooku dopiero po **istotności statystycznej** lub **opóźnieniu czasowym** (nie po 1 runie).
4. Reguły z `win_rate < 30%` (min. N runów) → **deprecate** (nie kasuj historii — status `deprecated`).

---

## Scaffold (ten PR)

```
dyspozycje/autobot/
  playbook.json
  src/types.ts
  src/playbook-manager.ts
  src/operator-agent.ts
  src/evaluator-agent.ts
  src/feature-pruning.ts
  src/guardrails.ts
  src/logging.ts
  logs/
  README.md
```

Następne iteracje (osobne zadania): podpięcie metryk z `WERSJE.md` / testów / playtest rejestru → UI dashboard postmortems.
