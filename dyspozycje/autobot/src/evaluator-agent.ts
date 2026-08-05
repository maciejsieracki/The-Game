/**
 * EvaluatorAgent — Moduł 1: twarde metryki → performanceScore → postmortem → playbook.
 */
import { randomUUID } from 'crypto';
import {
  loadPlaybook,
  recordRuleOutcome,
  retireWeakRules,
  savePlaybook,
} from './playbook-manager';
import { pruneFeatureWeights, attributesToWeights } from './feature-pruning';
import { appendPostmortemLog } from './logging';
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

export interface EvaluateOpts {
  run: ExecutionRun;
  metrics: HardMetrics;
  baseline?: HardMetrics;
  playbookPath?: string;
  /** Rule IDs to credit win/loss (default: run.operatorRuleIds) */
  ruleIds?: string[];
  /** Kara za złożoność (0–1) odejmowana od performanceScore */
  complexityPenalty?: number;
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

    const updates: PlaybookUpdate[] = [];
    const ruleIds = opts.ruleIds ?? run.operatorRuleIds;

    for (const id of ruleIds) {
      const u = recordRuleOutcome(pb, id, success);
      if (u) updates.push(u);
    }
    updates.push(...retireWeakRules(pb));

    const prune = pruneFeatureWeights({
      runs: [run],
      featureWeights: attributesToWeights(pb.operatorContextAttributes),
      opts: {
        minRuns: pb.thresholds.minRunsForSignificance,
        correlationThreshold: 0.05,
      },
    });

    if (prune.prunedAttributes.length > 0 && prune.evaluatedRuns >= pb.thresholds.minRunsForSignificance) {
      pb.operatorContextAttributes = prune.keptAttributes;
    }

    savePlaybook(pb, playbookPath);

    const postmortem = [
      success ? 'PASS' : 'FAIL',
      `performanceScore=${performanceScore.toFixed(3)}`,
      run.blockedByGuardrail ? `guardrail: ${run.blockedByGuardrail}` : null,
      `tests ${metrics.testsPassed ?? '?'}/${(metrics.testsPassed ?? 0) + (metrics.testsFailed ?? 0)}`,
      metrics.regressionDetected ? 'REGRESSION' : null,
      `deltas=${JSON.stringify(deltas)}`,
    ]
      .filter(Boolean)
      .join(' · ');

    const actionTaken =
      prune.actionsTaken.length > 0
        ? prune.actionsTaken.join('; ')
        : updates.find(u => u.kind === 'quarantine' || u.kind === 'retire')
          ? updates.map(u => u.detail).join('; ')
          : success
            ? 'No action required'
            : 'Recorded failure';

    const result: EvaluationResult = {
      id: randomUUID(),
      runId: run.id,
      evaluatedAtIso: new Date().toISOString(),
      metrics,
      metricBefore,
      metricAfter,
      performanceScore,
      deltas,
      success,
      postmortem,
      playbookUpdates: updates,
      prunedAttributes: prune.prunedAttributes,
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
