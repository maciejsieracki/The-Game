/**
 * Self-Pruning — Moduł 2: pruneFeatureWeights()
 * Historia N runów → korelacja vs success → usuń |corr| < 0.05 z kontekstu Operatora.
 */
import type { ExecutionRun, FeaturePruneReport, FeatureWeight } from './types';

export interface PruneSuggestOpts {
  minRuns: number;
  /** |corr| poniżej → prune (domyślnie 0.05) */
  correlationThreshold: number;
}

export interface PruneFeatureWeightsInput {
  /** Historia ostatnich N runów: atrybuty kontekstu vs wynik */
  runs: ExecutionRun[];
  /** Aktualna allow-lista / wagi cech */
  featureWeights: FeatureWeight[];
  opts?: Partial<PruneSuggestOpts>;
}

/** Pearson correlation między wartościami numerycznymi a success score */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const x = xs.slice(0, n);
  const y = ys.slice(0, n);
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - meanX;
    const dy = y[i]! - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return num / den;
}

function featureValue(payload: Record<string, unknown>, attr: string): number {
  const v = payload[attr];
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v != null && v !== '') return 1;
  return 0;
}

function runSuccessScore(run: ExecutionRun): number {
  if (run.successScore != null) return run.successScore;
  if (run.success === true) return 1;
  if (run.success === false) return 0;
  return 0.5;
}

/**
 * Wymagana nazwa spec: pruneFeatureWeights()
 * 1. Historia ostatnich N runów
 * 2. Feature importance / correlation vs success score
 * 3. |corr| < threshold → usuń z domyślnego kontekstu Operatora
 * 4. Zwraca report + nową allow-listę wag + actionsTaken do postmortem
 */
export function pruneFeatureWeights(input: PruneFeatureWeightsInput): FeaturePruneReport {
  const opts: PruneSuggestOpts = {
    minRuns: input.opts?.minRuns ?? 5,
    correlationThreshold: input.opts?.correlationThreshold ?? 0.05,
  };

  const finished = input.runs.filter(r => r.finishedAtIso);
  const evaluatedRuns = finished.length;
  const scores: Record<string, number> = {};
  const actionsTaken: string[] = [];
  const keptAttributes: string[] = [];
  const prunedAttributes: string[] = [];
  const featureWeights: FeatureWeight[] = [];

  const successScores = finished.map(runSuccessScore);

  for (const fw of input.featureWeights) {
    const attr = fw.name;
    const featureVals = finished.map(r => featureValue(r.contextPayload ?? {}, attr));
    const corr = pearsonCorrelation(featureVals, successScores);
    scores[attr] = Math.abs(corr);

    const shouldPrune =
      evaluatedRuns >= opts.minRuns && Math.abs(corr) < opts.correlationThreshold;

    if (shouldPrune) {
      prunedAttributes.push(attr);
      actionsTaken.push(`Removed feature ${attr}`);
      featureWeights.push({ name: attr, weight: fw.weight, enabled: false });
    } else {
      keptAttributes.push(attr);
      featureWeights.push({ name: attr, weight: fw.weight, enabled: true });
    }
  }

  return {
    evaluatedRuns,
    keptAttributes,
    prunedAttributes,
    scores,
    featureWeights,
    actionsTaken,
  };
}

/** @deprecated Użyj pruneFeatureWeights — zachowane dla kompatybilności */
export function suggestAttributePruning(
  candidateAttributes: string[],
  runs: ExecutionRun[],
  opts: { minRuns: number; nearZeroScore: number },
): FeaturePruneReport {
  const weights: FeatureWeight[] = candidateAttributes.map(name => ({
    name,
    weight: 1,
    enabled: true,
  }));
  return pruneFeatureWeights({
    runs,
    featureWeights: weights,
    opts: { minRuns: opts.minRuns, correlationThreshold: opts.nearZeroScore },
  });
}

/** Odetnij payload Operatora do allow-listy (+ opcjonalnie dynamiczny prune z historii). */
export function pruneContextPayload(
  context: Record<string, unknown>,
  allowList: string[],
  recentRuns: ExecutionRun[],
): { payload: Record<string, unknown>; report: FeaturePruneReport } {
  const weights: FeatureWeight[] = allowList.map(name => ({ name, weight: 1, enabled: true }));
  const report = pruneFeatureWeights({
    runs: recentRuns,
    featureWeights: weights,
    opts: { minRuns: 5, correlationThreshold: 0.05 },
  });
  const effective =
    report.prunedAttributes.length > 0 && report.evaluatedRuns >= 5
      ? report.keptAttributes
      : allowList;
  const payload: Record<string, unknown> = {};
  for (const key of effective) {
    if (key in context) payload[key] = context[key];
  }
  return { payload, report };
}

/** Konwersja string[] → FeatureWeight[] */
export function attributesToWeights(attrs: string[]): FeatureWeight[] {
  return attrs.map(name => ({ name, weight: 1, enabled: true }));
}
