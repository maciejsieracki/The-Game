/**
 * Playbook manager — win/loss, win_rate, deprecate <30%, threshold adjust z guardrailem.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Playbook, PlaybookRule, PlaybookUpdate, PlaybookThresholds } from './types';

const DEFAULT_PLAYBOOK_PATH = path.resolve(__dirname, '..', 'playbook.json');

export function computeWinRate(wins: number, losses: number): number {
  const n = wins + losses;
  return n === 0 ? 0 : wins / n;
}

export function loadPlaybook(filePath: string = DEFAULT_PLAYBOOK_PATH): Playbook {
  const raw = fs.readFileSync(filePath, 'utf8');
  const pb = JSON.parse(raw) as Playbook;
  for (const r of pb.rules) {
    r.win_rate = computeWinRate(r.wins, r.losses);
  }
  return pb;
}

export function savePlaybook(pb: Playbook, filePath: string = DEFAULT_PLAYBOOK_PATH): void {
  pb.updatedAtIso = new Date().toISOString();
  for (const r of pb.rules) {
    r.win_rate = computeWinRate(r.wins, r.losses);
  }
  fs.writeFileSync(filePath, JSON.stringify(pb, null, 2) + '\n', 'utf8');
}

export function activeRules(pb: Playbook): PlaybookRule[] {
  return pb.rules.filter(r => r.status === 'active');
}

export function recordRuleOutcome(
  pb: Playbook,
  ruleId: string,
  success: boolean,
  nowIso: string = new Date().toISOString(),
): PlaybookUpdate | null {
  const rule = pb.rules.find(r => r.id === ruleId);
  if (!rule || rule.status === 'deprecated') return null;
  if (success) rule.wins += 1;
  else rule.losses += 1;
  rule.win_rate = computeWinRate(rule.wins, rule.losses);
  rule.lastUpdatedIso = nowIso;
  return {
    ruleId,
    kind: success ? 'win' : 'loss',
    detail: `win_rate=${rule.win_rate.toFixed(3)} (${rule.wins}W/${rule.losses}L)`,
  };
}

/**
 * Deprecate rules below deprecateBelowWinRate when minRunsForSignificance reached.
 */
export function deprecateWeakRules(
  pb: Playbook,
  nowIso: string = new Date().toISOString(),
): PlaybookUpdate[] {
  const t = pb.thresholds;
  const updates: PlaybookUpdate[] = [];
  for (const rule of pb.rules) {
    if (rule.status !== 'active') continue;
    const n = rule.wins + rule.losses;
    if (n < t.minRunsForSignificance) continue;
    if (rule.win_rate < t.deprecateBelowWinRate) {
      rule.status = 'deprecated';
      rule.deprecatedReason = `win_rate ${rule.win_rate.toFixed(3)} < ${t.deprecateBelowWinRate} after ${n} runs`;
      rule.lastUpdatedIso = nowIso;
      updates.push({
        ruleId: rule.id,
        kind: 'deprecate',
        detail: rule.deprecatedReason,
      });
    }
  }
  return updates;
}

/**
 * Adjust global thresholds only after time-delay + significance guardrail.
 * Returns null if blocked.
 */
export function maybeAdjustThresholds(
  pb: Playbook,
  patch: Partial<PlaybookThresholds>,
  lastAdjustIso: string | null,
  now: Date = new Date(),
): PlaybookUpdate | null {
  const delayMs = pb.thresholds.thresholdAdjustDelayHours * 3600_000;
  if (lastAdjustIso) {
    const elapsed = now.getTime() - Date.parse(lastAdjustIso);
    if (elapsed < delayMs) {
      return null;
    }
  }
  const totalRuns = pb.rules.reduce((s, r) => s + r.wins + r.losses, 0);
  if (totalRuns < pb.thresholds.minRunsForSignificance) {
    return null;
  }
  Object.assign(pb.thresholds, patch);
  pb.updatedAtIso = now.toISOString();
  return {
    ruleId: '*thresholds*',
    kind: 'threshold_adjust',
    detail: JSON.stringify(patch),
  };
}
