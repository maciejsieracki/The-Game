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

---

## Spec v1 — 5 modułów (2026-08-05)

Pełna implementacja w `dyspozycje/autobot/`:

| Moduł | Plik(i) | Kluczowe API |
|-------|---------|--------------|
| **1. Hard Metric Evaluator** | `src/hard-metrics.ts`, `src/evaluator-agent.ts` | `computePerformanceScore(metrics, complexityPenalty)` · `DevProfileScorer` / `SalesProfileScorer` / `TradingProfileScorer` · `EvaluationResult.performanceScore`, `metricBefore`/`metricAfter` |
| **2. Self-Pruning** | `src/feature-pruning.ts` | `pruneFeatureWeights()` — Pearson corr vs success; \|corr\| < 0.05 → usuń z kontekstu; `action_taken: "Removed feature X"` |
| **3. Playbook** | `playbook.json`, `src/playbook-manager.ts` | `rules[].rule_text`, `win_count`/`fail_count`, status `ACTIVE`\|`RETIRED`\|`QUARANTINE`, `min_confidence_threshold`, `quarantine_rules`, `getOperatorSystemRules()` |
| **4. Guardrails** | `src/guardrails.ts` | `assertProdIsolation` · HITL (no merge/mass-mail/real-money) · `canDeclareWinner` / `assertEvaluationDelay` (N≥1000 **LUB** ≥48h) |
| **5. Dashboard Logger** | `src/logging.ts` | JSONL: `run_id`, `timestamp`, `metric_before`, `metric_after`, `delta_percentage`, `postmortem_reasoning`, `action_taken` |

**Bramki jakości:** `node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json` · `node dyspozycje/autobot/tools/autobot-smoke.cjs`

**Reguły Civ w playbook:** triple-layer (rule_101), numer-abc-deploy (rule_102), no-npm-run-build (rule_103), lane-no-main-ts (rule_104).
