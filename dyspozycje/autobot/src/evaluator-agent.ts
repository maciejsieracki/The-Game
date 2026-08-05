/**
 * EvaluatorAgent — metryki twarde → delta → postmortem → update playbook.
 */
import { randomUUID } from 'crypto';
import {
  deprecateWeakRules,
  loadPlaybook,
  recordRuleOutcome,
  savePlaybook,
} from './playbook-manager';
import { suggestAttributePruning } from './feature-pruning';
import { appendPostmortemLog } from './logging';
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
  return true;
}

export class EvaluatorAgent {
  evaluate(opts: EvaluateOpts): EvaluationResult {
    const { run, metrics, baseline, playbookPath } = opts;
    const pb = loadPlaybook(playbookPath);
    const success = inferSuccess(metrics, run);
    const deltas = computeDeltas(metrics, baseline);
    const updates: PlaybookUpdate[] = [];
    const ruleIds = opts.ruleIds ?? run.operatorRuleIds;

    for (const id of ruleIds) {
      const u = recordRuleOutcome(pb, id, success);
      if (u) updates.push(u);
    }
    updates.push(...deprecateWeakRules(pb));

    const prune = suggestAttributePruning(pb.operatorContextAttributes, [run], {
      minRuns: pb.thresholds.minRunsForSignificance,
      nearZeroScore: 0.05,
    });
    // Feature pruning applies to future Operator payloads; persist allow-list when enough data
    if (prune.prunedAttributes.length > 0 && prune.evaluatedRuns >= pb.thresholds.minRunsForSignificance) {
      pb.operatorContextAttributes = prune.keptAttributes;
    }

    savePlaybook(pb, playbookPath);

    const postmortem = [
      success ? 'PASS' : 'FAIL',
      run.blockedByGuardrail ? `guardrail: ${run.blockedByGuardrail}` : null,
      `tests ${metrics.testsPassed ?? '?'}/${(metrics.testsPassed ?? 0) + (metrics.testsFailed ?? 0)}`,
      metrics.regressionDetected ? 'REGRESSION' : null,
      `deltas=${JSON.stringify(deltas)}`,
    ].filter(Boolean).join(' · ');

    const result: EvaluationResult = {
      id: randomUUID(),
      runId: run.id,
      evaluatedAtIso: new Date().toISOString(),
      metrics,
      deltas,
      success,
      postmortem,
      playbookUpdates: updates,
      prunedAttributes: prune.prunedAttributes,
    };

    appendPostmortemLog({
      tsIso: result.evaluatedAtIso,
      evaluationId: result.id,
      runId: run.id,
      success,
      deltas,
      postmortem,
      playbookUpdates: updates,
    });

    return result;
  }
}
