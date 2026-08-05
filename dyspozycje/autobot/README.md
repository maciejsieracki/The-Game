# AutoBot — Evaluator–Operator (R-PROC-AUTOBOT)

**Status:** ⛔ **TWARDA REGUŁA** — **KAŻDA praca agenta wyłącznie tędy** (Maciej 2026-08-05)  
**Decyzja:** [`docs/decyzje/R-PROC-AUTOBOT.md`](../../docs/decyzje/R-PROC-AUTOBOT.md)  
**Reguła Cursor (alwaysApply):** `.cursor/rules/autobot-evaluator-operator.mdc`

> Operator → Evaluator → Grok final. **ZAKAZ** omijania pętli.

**Evaluator — SCOPE:** przed werdyktem sprawdza, czy diff dotyczy **wyłącznie** zgłoszonego problemu/AC i nie wprowadza ubocznych zmian ani regresji w innych miejscach (`rule_105`, `R-PROC-AUTOBOT-EVAL-SCOPE`). Naruszenie SCOPE → FAIL.

**Evaluator — STRICT (Maciej „2”, 2026-08-05):** luki testów, brak asercji AC, czerwone testy tematu lub `tsc≠0` → **FAIL** (nie PASS-WITH-NOTES). PASS-WITH-NOTES tylko dla wąskiej listy wyjątków procesowych (`rule_106`, `R-PROC-AUTOBOT-EVAL-STRICT`).

**Evaluator — STRICT-EDGE (Maciej „2 Jeszcze twardszy”, 2026-08-05):** testy tematu tylko happy-path bez edge/negacji/repro buga → **FAIL #7** (`rule_107`, `R-PROC-AUTOBOT-EVAL-STRICT-EDGE`).

**Evaluator — STRICT-PARITY (Maciej „2 = Tylko A (parytet)”, 2026-08-05):** asymetria gracz/AI/MP (`ownerId === 0` / `isPlayer`) bez decyzji ABC lub bez testu parytetu → **FAIL #8** (`rule_108`, `R-PROC-AUTOBOT-EVAL-STRICT-PARITY`).

## Architektura — 5 modułów

```
┌─────────────────────────────────────────────────────────────────┐
│                         TASK / DYSPOZYCJA                        │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 3: Playbook (playbook.json + playbook-manager.ts)          │
│  rules[ACTIVE] · win_rate · min_confidence_threshold · RETIRED   │
│  getOperatorSystemRules() → prompt Operatora                      │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 4: Guardrails (guardrails.ts)                            │
│  Prod Isolation · HITL · canDeclareWinner / assertEvaluationDelay│
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 2: Self-Pruning (feature-pruning.ts)                       │
│  pruneFeatureWeights() → |corr| < 0.05 → usuń z kontekstu         │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  OperatorAgent → ExecutionRun                                    │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 1: Hard Metric Evaluator (evaluator-agent + hard-metrics) │
│  performanceScore = f(metricReal) - penaltyComplexity            │
│  Dev / Sales / Trading profile scorers                           │
└───────────────────────────────┬─────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODUŁ 5: Dashboard Logger (logging.ts)                          │
│  JSONL: run_id · metric_before/after · delta_percentage · …      │
└─────────────────────────────────────────────────────────────────┘
```

## Moduły (pliki)

| # | Moduł | Pliki | Odpowiedzialność |
|---|-------|-------|------------------|
| 1 | Hard Metric Evaluator | `src/hard-metrics.ts`, `src/evaluator-agent.ts` | Twarde metryki (SSOT), `computePerformanceScore`, profile Dev/Sales/Trading |
| 2 | Self-Pruning | `src/feature-pruning.ts` | `pruneFeatureWeights()` — korelacja vs success, usuń słabe cechy |
| 3 | Playbook | `playbook.json`, `src/playbook-manager.ts` | `ACTIVE`/`RETIRED`/`QUARANTINE`, `getOperatorSystemRules()` |
| 4 | Guardrails | `src/guardrails.ts` | Prod isolation, HITL, data exposure delay |
| 5 | Dashboard Logger | `src/logging.ts`, `logs/postmortems.jsonl` | Strukturalny JSONL pod dashboard |

## Playbook (spec v1)

```json
{
  "min_confidence_threshold": 0.60,
  "rules": [
    {
      "id": "rule_101",
      "rule_text": "...",
      "win_count": 12,
      "fail_count": 2,
      "win_rate": 0.85,
      "status": "ACTIVE"
    }
  ],
  "quarantine_rules": []
}
```

- Statusy: `ACTIVE` | `RETIRED` | `QUARANTINE` (aliasy `active`/`deprecated` mapowane przy load)
- `win_rate < 0.30` (przy min runs) → `RETIRED` / `quarantine_rules`
- `getOperatorSystemRules(playbook)` → tylko ACTIVE z `win_rate ≥ min_confidence_threshold`

## Guardrails (skrót)

- **Prod Isolation:** `env === 'production'` → throw/block destrukcyjne akcje Operatora
- **HITL:** PR/draft OK; **ZAKAZ** merge main, mass mail, real money; deploy = `humanApproved` + `deployPassword`
- **Data Exposure:** winner dopiero gdy `N ≥ minEvents` **LUB** `elapsed ≥ 48h` (`canDeclareWinner`)

## Użycie

```ts
import { OperatorAgent, EvaluatorAgent, computePerformanceScore } from './src';

const op = new OperatorAgent();
const run = await op.run({
  taskId: 'R-EXAMPLE',
  summary: 'fix X',
  actionId: 'run-lane-tests',
  context: { taskId: 'R-EXAMPLE', acChecklist: ['…'] },
});

const ev = new EvaluatorAgent();
const result = ev.evaluate({
  run,
  metrics: {
    profile: 'dev',
    testsPassed: 10,
    testsFailed: 0,
    typecheckOk: true,
    buildPassed: true,
    linterPassed: true,
    humanApproved: true,
  },
  complexityPenalty: 0.05,
});
// result.performanceScore, result.metricBefore, result.metricAfter
```

## Testy

```bash
# Typecheck
node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json

# Smoke (6 scenariuszy)
node dyspozycje/autobot/tools/autobot-smoke.cjs
```

## Mapowanie Civ

| AutoBot | Sesja Cursor |
|---------|----------------|
| Operator | Composer implementer |
| Evaluator | Adwokat diabła + Grok (+ testy) · **SCOPE** — diff tylko do tematu (`rule_105`) · **STRICT** — luki testów → FAIL (`rule_106`) · **STRICT-EDGE** — happy-path-only → FAIL (`rule_107`) · **STRICT-PARITY** — asymetria gracz/AI/MP → FAIL (`rule_108`) |
| playbook | ten katalog + reguły procesu |
| Dev scorer | typecheck + testy + deploy gate |

Następny krok: podpięcie metryk z `WERSJE.md` / testów → dashboard z `logs/`.
