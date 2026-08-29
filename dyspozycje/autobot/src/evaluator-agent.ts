/**
 * EvaluatorAgent — Moduł 1: twarde metryki → performanceScore → postmortem → playbook.
 */
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadPlaybook,
  recordRuleOutcome,
  retireWeakRules,
  savePlaybook,
  formatReviewFlagForOpenQuestions,
} from './playbook-manager';
import { pruneFeatureWeights, attributesToWeights } from './feature-pruning';
import { appendPostmortemLog, appendRunHistory, readRunHistory } from './logging';
import { canDeclareWinner } from './guardrails';
import {
  computePerformanceScore,
  extractMetricSnapshot,
  computeDeltaPercentage,
} from './hard-metrics';
import type {
  EvaluationResult,
  ExecutionRun,
  HardMetrics,
  PlaybookUpdate,
} from './types';

/**
 * `dyspozycje/PYTANIA-OTWARTE.md` — dwa poziomy w górę od src/ (i od dist/, ten
 * sam katalog `autobot`), patrz DEFAULT_PLAYBOOK_PATH w playbook-manager.ts dla
 * analogicznego wzorca (tam jeden poziom do `dyspozycje/autobot/playbook.json`).
 */
const OPEN_QUESTIONS_PATH = path.resolve(__dirname, '..', '..', 'PYTANIA-OTWARTE.md');

/**
 * Dopisuje flagę REVIEW do PYTANIA-OTWARTE.md. I/O na plikach żyje tutaj (nie w
 * playbook-manager.ts, które dziś zapisuje wyłącznie playbook.json) — evaluator-agent.ts
 * jest miejscem, gdzie retireWeakRules jest faktycznie wywoływane, i już ma wzorzec
 * append-only I/O (appendPostmortemLog/appendRunHistory w logging.ts).
 */
function appendReviewFlagsToOpenQuestions(entries: string[]): void {
  if (entries.length === 0) return;
  fs.appendFileSync(OPEN_QUESTIONS_PATH, entries.join('\n') + '\n', 'utf8');
}

export interface EvaluateOpts {
  run: ExecutionRun;
  metrics: HardMetrics;
  baseline?: HardMetrics;
  playbookPath?: string;
  /** Rule IDs to credit win/loss (default: run.operatorRuleIds) */
  ruleIds?: string[];
  /** Kara za złożoność (0–1) odejmowana od performanceScore */
  complexityPenalty?: number;
  /**
   * Smoke / testy: omija bramkę evaluation delay przed retire/prune.
   * Produkcja Civ: zawsze false (domyślnie).
   */
  allowPlaybookMutation?: boolean;
}

function metricNumber(m: HardMetrics, key: keyof HardMetrics): number {
  const v = m[key];
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return 0;
}

export function computeDeltas(current: HardMetrics, baseline?: HardMetrics): Record<string, number> {
  if (!baseline) {
    return {
      testsPassed: current.testsPassed ?? 0,
      testsFailed: current.testsFailed ?? 0,
    };
  }
  return {
    testsPassed: metricNumber(current, 'testsPassed') - metricNumber(baseline, 'testsPassed'),
    testsFailed: metricNumber(current, 'testsFailed') - metricNumber(baseline, 'testsFailed'),
    typecheckOk: metricNumber(current, 'typecheckOk') - metricNumber(baseline, 'typecheckOk'),
    regressionDetected:
      metricNumber(current, 'regressionDetected') - metricNumber(baseline, 'regressionDetected'),
  };
}

export function inferSuccess(metrics: HardMetrics, run: ExecutionRun): boolean {
  if (run.blockedByGuardrail) return false;
  if (run.success === false) return false;
  if (metrics.testsFailed && metrics.testsFailed > 0) return false;
  if (metrics.typecheckOk === false) return false;
  if (metrics.regressionDetected === true) return false;
  if (metrics.playtestOk === false) return false;
  const score = computePerformanceScore(metrics, 0);
  return score > 0;
}

export class EvaluatorAgent {
  evaluate(opts: EvaluateOpts): EvaluationResult {
    const { run, metrics, baseline, playbookPath, complexityPenalty = 0 } = opts;
    const pb = loadPlaybook(playbookPath);
    const success = inferSuccess(metrics, run);
    const deltas = computeDeltas(metrics, baseline);
    const { metricBefore, metricAfter } = extractMetricSnapshot(metrics, baseline);
    const performanceScore = computePerformanceScore(metrics, complexityPenalty);
    const deltaPercentage = computeDeltaPercentage(metricBefore, metricAfter);
    const evaluatedAtIso = new Date().toISOString();

    const updates: PlaybookUpdate[] = [];
    const ruleIds = opts.ruleIds ?? run.operatorRuleIds;

    // Historia runów — zawsze append (źródło dla prune + delay)
    appendRunHistory({
      run,
      evaluatedAtIso,
      success,
      performanceScore,
    });

    const history = readRunHistory();
    const historyRuns = history.map(h => h.run);
    const minRuns = pb.thresholds.minRunsForSignificance;
    const runsForPrune =
      historyRuns.length >= minRuns
        ? historyRuns.slice(-Math.max(historyRuns.length, minRuns))
        : historyRuns;

    // recordRuleOutcome — zawsze (bez bramki delay)
    for (const id of ruleIds) {
      const u = recordRuleOutcome(pb, id, success);
      if (u) updates.push(u);
    }

    let playbookMutationDeferred: string | undefined;
    let pruneActions: string[] = [];
    let prunedAttributes: string[] = [];

    const canMutatePlaybook =
      opts.allowPlaybookMutation === true ||
      canDeclareWinner({
        eventCount: history.length,
        minEvents: pb.thresholds.minEventsForWinner ?? 1000,
        firstEventAtIso: history[0]?.evaluatedAtIso ?? run.startedAtIso,
        minDelayHours: pb.thresholds.evaluationDelayHours ?? 48,
      }).ok;

    if (canMutatePlaybook) {
      const reviewUpdates = retireWeakRules(pb);
      updates.push(...reviewUpdates);

      if (reviewUpdates.length > 0) {
        const flagEntries = reviewUpdates
          .filter(u => u.kind === 'review')
          .map(u => pb.rules.find(r => r.id === u.ruleId))
          .filter((r): r is NonNullable<typeof r> => r != null)
          .map(r => formatReviewFlagForOpenQuestions(r, evaluatedAtIso));
        appendReviewFlagsToOpenQuestions(flagEntries);
      }

      const prune = pruneFeatureWeights({
        runs: runsForPrune,
        featureWeights: attributesToWeights(pb.operatorContextAttributes),
        opts: {
          minRuns: minRuns,
          correlationThreshold: 0.05,
        },
      });

      prunedAttributes = prune.prunedAttributes;
      pruneActions = prune.actionsTaken;

      if (prune.prunedAttributes.length > 0 && prune.evaluatedRuns >= minRuns) {
        pb.operatorContextAttributes = prune.keptAttributes;
      }
    } else {
      const delayResult = canDeclareWinner({
        eventCount: history.length,
        minEvents: pb.thresholds.minEventsForWinner ?? 1000,
        firstEventAtIso: history[0]?.evaluatedAtIso ?? run.startedAtIso,
        minDelayHours: pb.thresholds.evaluationDelayHours ?? 48,
      });
      playbookMutationDeferred = delayResult.reason;
    }

    savePlaybook(pb, playbookPath);

    const postmortemParts = [
      success ? 'PASS' : 'FAIL',
      `performanceScore=${performanceScore.toFixed(3)}`,
      run.blockedByGuardrail ? `guardrail: ${run.blockedByGuardrail}` : null,
      `tests ${metrics.testsPassed ?? '?'}/${(metrics.testsPassed ?? 0) + (metrics.testsFailed ?? 0)}`,
      metrics.regressionDetected ? 'REGRESSION' : null,
      `deltas=${JSON.stringify(deltas)}`,
      playbookMutationDeferred ? `playbookMutationDeferred: ${playbookMutationDeferred}` : null,
    ];

    const postmortem = postmortemParts.filter(Boolean).join(' · ');

    const actionTaken =
      pruneActions.length > 0
        ? pruneActions.join('; ')
        : updates.find(u => u.kind === 'retire' || u.kind === 'quarantine')
          ? updates.map(u => u.detail).join('; ')
          : success
            ? 'No action required'
            : 'Recorded failure';

    const result: EvaluationResult = {
      id: randomUUID(),
      runId: run.id,
      evaluatedAtIso,
      metrics,
      metricBefore,
      metricAfter,
      performanceScore,
      deltas,
      success,
      postmortem,
      playbookUpdates: updates,
      prunedAttributes,
    };

    appendPostmortemLog({
      runId: run.id,
      evaluationId: result.id,
      success,
      metricBefore,
      metricAfter,
      deltaPercentage,
      postmortemReasoning: postmortem,
      actionTaken,
      deltas,
      playbookUpdates: updates,
    });

    return result;
  }
}

export { computePerformanceScore } from './hard-metrics';
