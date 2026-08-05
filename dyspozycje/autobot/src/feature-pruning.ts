/**
 * Feature pruning — usuń atrybuty kontekstu bez mocy predykcyjnej vs sukces.
 */
import type { ExecutionRun, FeaturePruneReport } from './types';

export interface PruneSuggestOpts {
  minRuns: number;
  /** |score| poniżej → prune */
  nearZeroScore: number;
}

/**
 * Prosty score: różnica średniej wartości numerycznej / obecności atrybutu
 * między runami success vs fail. Near-zero → brak mocy predykcyjnej.
 */
export function suggestAttributePruning(
  candidateAttributes: string[],
  runs: ExecutionRun[],
  opts: PruneSuggestOpts,
): FeaturePruneReport {
  const finished = runs.filter(r => r.success !== undefined && r.finishedAtIso);
  const scores: Record<string, number> = {};

  for (const attr of candidateAttributes) {
    const withAttr = finished.filter(r => attr in (r.contextPayload ?? {}));
    if (withAttr.length === 0) {
      scores[attr] = 0;
      continue;
    }
    const succ = withAttr.filter(r => r.success);
    const fail = withAttr.filter(r => !r.success);
    const avg = (xs: ExecutionRun[]) => {
      if (xs.length === 0) return 0;
      let s = 0;
      for (const r of xs) {
        const v = r.contextPayload[attr];
        if (typeof v === 'number') s += v;
        else if (typeof v === 'boolean') s += v ? 1 : 0;
        else if (v != null && v !== '') s += 1;
      }
      return s / xs.length;
    };
    scores[attr] = Math.abs(avg(succ) - avg(fail));
  }

  const evaluatedRuns = finished.length;
  const keptAttributes: string[] = [];
  const prunedAttributes: string[] = [];

  for (const attr of candidateAttributes) {
    const score = scores[attr] ?? 0;
    if (evaluatedRuns >= opts.minRuns && score < opts.nearZeroScore) {
      prunedAttributes.push(attr);
    } else {
      keptAttributes.push(attr);
    }
  }

  return { evaluatedRuns, keptAttributes, prunedAttributes, scores };
}

/** Odetnij payload Operatora do allow-listy (+ opcjonalnie dynamiczny prune z historii). */
export function pruneContextPayload(
  context: Record<string, unknown>,
  allowList: string[],
  recentRuns: ExecutionRun[],
): { payload: Record<string, unknown>; report: FeaturePruneReport } {
  const report = suggestAttributePruning(allowList, recentRuns, {
    minRuns: 5,
    nearZeroScore: 0.05,
  });
  const effective = report.prunedAttributes.length > 0 && report.evaluatedRuns >= 5
    ? report.keptAttributes
    : allowList;
  const payload: Record<string, unknown> = {};
  for (const key of effective) {
    if (key in context) payload[key] = context[key];
  }
  return { payload, report };
}
