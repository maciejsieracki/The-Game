/**
 * Hard Metric Evaluator — profile scorers (Single Source of Truth).
 * Moduł 1: performanceScore = f(metricReal) - penaltyComplexity
 */
import type { HardMetrics, OperatorProfile } from './types';

/** Interfejs profilowego scorera */
export interface ProfileScorer {
  profile: OperatorProfile;
  /** Główna metryka sukcesu 0–1 (lub wartość rzeczywista do normalizacji) */
  score(metrics: HardMetrics): number;
  /** Nazwa metryki głównej (do metricBefore/metricAfter) */
  primaryMetricKey: string;
}

/** Dev: prSuccessRate = typecheckOk && testsFailed===0 && humanApproved/merge proxy */
export class DevProfileScorer implements ProfileScorer {
  readonly profile = 'dev' as const;
  readonly primaryMetricKey = 'prSuccessRate';

  score(metrics: HardMetrics): number {
    const typecheckOk = metrics.typecheckOk !== false;
    const testsOk = (metrics.testsFailed ?? 0) === 0;
    const buildOk = metrics.buildPassed !== false;
    const linterOk = metrics.linterPassed !== false;
    const humanOk =
      metrics.humanMerged === true ||
      metrics.humanApproved === true ||
      metrics.humanMerged === undefined && metrics.humanApproved === undefined;

    const prSuccessRate =
      (typecheckOk ? 1 : 0) *
      (testsOk ? 1 : 0) *
      (buildOk ? 1 : 0) *
      (linterOk ? 1 : 0) *
      (humanOk ? 1 : 0);

    if (metrics.regressionDetected) return 0;
    if (metrics.playtestOk === false) return prSuccessRate * 0.5;

    return prSuccessRate;
  }
}

/** Sales stub: conversionRate = convertedLeads / totalContacted */
export class SalesProfileScorer implements ProfileScorer {
  readonly profile = 'sales' as const;
  readonly primaryMetricKey = 'conversionRate';

  score(metrics: HardMetrics): number {
    const contacted = metrics.totalContacted ?? 0;
    if (contacted <= 0) return 0;
    const converted = metrics.convertedLeads ?? 0;
    return Math.min(1, converted / contacted);
  }
}

/** Trading stub: winRateClosed lub sharpe jako proxy */
export class TradingProfileScorer implements ProfileScorer {
  readonly profile = 'trading' as const;
  readonly primaryMetricKey = 'winRateClosed';

  score(metrics: HardMetrics): number {
    if (metrics.sharpeRatio != null && metrics.sharpeRatio > 0) {
      return Math.min(1, metrics.sharpeRatio / 3);
    }
    const wr = metrics.winRateClosed;
    if (wr != null) return Math.min(1, Math.max(0, wr));
    return 0;
  }
}

const SCORERS: Record<OperatorProfile, ProfileScorer> = {
  dev: new DevProfileScorer(),
  sales: new SalesProfileScorer(),
  trading: new TradingProfileScorer(),
};

export function getProfileScorer(profile: OperatorProfile = 'dev'): ProfileScorer {
  return SCORERS[profile];
}

/**
 * performanceScore = f(metricReal) - penaltyComplexity
 * metricReal = score profilowy (0–1); penaltyComplexity ∈ [0, 1]
 */
export function computePerformanceScore(
  metrics: HardMetrics,
  complexityPenalty: number = 0,
): number {
  const profile = metrics.profile ?? 'dev';
  const scorer = getProfileScorer(profile);
  const metricReal = scorer.score(metrics);
  const penalty = Math.max(0, Math.min(1, complexityPenalty));
  return Math.max(0, metricReal - penalty);
}

/** Ekstrakcja metricBefore/metricAfter jako Record dla EvaluationResult */
export function extractMetricSnapshot(
  metrics: HardMetrics,
  baseline?: HardMetrics,
): { metricBefore: Record<string, number>; metricAfter: Record<string, number> } {
  const profile = metrics.profile ?? 'dev';
  const scorer = getProfileScorer(profile);
  const key = scorer.primaryMetricKey;
  const after = scorer.score(metrics);
  const before = baseline ? scorer.score(baseline) : 0;
  return {
    metricBefore: { [key]: before },
    metricAfter: { [key]: after },
  };
}

export function computeDeltaPercentage(
  metricBefore: Record<string, number>,
  metricAfter: Record<string, number>,
): number {
  const keys = new Set([...Object.keys(metricBefore), ...Object.keys(metricAfter)]);
  if (keys.size === 0) return 0;
  let sumBefore = 0;
  let sumAfter = 0;
  for (const k of keys) {
    sumBefore += metricBefore[k] ?? 0;
    sumAfter += metricAfter[k] ?? 0;
  }
  if (sumBefore === 0) return sumAfter === 0 ? 0 : 100;
  return ((sumAfter - sumBefore) / Math.abs(sumBefore)) * 100;
}
