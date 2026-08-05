# AutoBot — Evaluator–Operator (R-PROC-AUTOBOT)

**Status:** OBOWIĄZUJE · scaffold 2026-08-05  
**Decyzja:** [`docs/decyzje/R-PROC-AUTOBOT.md`](../../docs/decyzje/R-PROC-AUTOBOT.md)  
**Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`

## Idea

```
Task → Operator (playbook + guardrails) → ExecutionRun
         ↓
      twarde metryki
         ↓
      Evaluator → delta + postmortem → playbook win/loss / deprecate / prune
         ↓
      logs/postmortems.jsonl → dashboard
```

## Pliki

| Ścieżka | Rola |
|---------|------|
| `playbook.json` | Reguły + thresholds + allow-lista kontekstu |
| `src/types.ts` | `Playbook`, `ExecutionRun`, `EvaluationResult`, … |
| `src/playbook-manager.ts` | win_rate, deprecate &lt;30%, threshold delay |
| `src/operator-agent.ts` | Operator loop + executor hook |
| `src/evaluator-agent.ts` | Metryki → postmortem → update playbook |
| `src/feature-pruning.ts` | Usuwanie atrybutów bez mocy predykcyjnej |
| `src/guardrails.ts` | Zakaz merge/deploy bez człowieka |
| `src/logging.ts` | JSONL postmortems |
| `logs/` | Dane pod UI |

## Guardrails (skrót)

- Operator **nie** merge do `main`, **nie** deploy bez hasła Macieja
- Krytyczne = human approval
- Winner / zmiana progów dopiero po `minRunsForSignificance` + time-delay

## Użycie (stub)

```ts
import { OperatorAgent, EvaluatorAgent } from './src';

const op = new OperatorAgent();
const run = await op.run({
  taskId: 'R-EXAMPLE',
  summary: 'fix X',
  actionId: 'implement-fix',
  context: { taskId: 'R-EXAMPLE', acChecklist: ['…'], noise: true },
});

const ev = new EvaluatorAgent();
const result = ev.evaluate({
  run,
  metrics: { testsPassed: 10, testsFailed: 0, typecheckOk: true },
});
```

## Mapowanie Civ

| AutoBot | Sesja Cursor |
|---------|----------------|
| Operator | Composer implementer |
| Evaluator | Adwokat diabła + Grok (+ testy / playtest) |
| playbook | ten katalog + reguły procesu |

Następny krok produktowy: podpięcie metryk z testów / `WERSJE.md` / rejestru playtest → prosty dashboard z `logs/`.
