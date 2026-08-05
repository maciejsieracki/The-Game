/**
 * Playbook manager — Moduł 3: win/loss, win_rate, RETIRED <30%, getOperatorSystemRules.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Playbook, PlaybookRule, PlaybookUpdate, PlaybookThresholds, RuleStatusCanonical } from './types';

const DEFAULT_PLAYBOOK_PATH = path.resolve(__dirname, '..', 'playbook.json');

/** Normalizacja statusu legacy → kanoniczny */
export function normalizeRuleStatus(status: string): RuleStatusCanonical {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'candidate') return 'ACTIVE';
  if (s === 'deprecated') return 'RETIRED';
  if (s === 'quarantine') return 'QUARANTINE';
  if (s === 'retired') return 'RETIRED';
  return status as RuleStatusCanonical;
}

/** Normalizacja pojedynczej reguły (aliasy spec v1 ↔ legacy) */
export function normalizeRule(raw: Record<string, unknown>): PlaybookRule {
  const winCount = (raw.win_count as number) ?? (raw.wins as number) ?? 0;
  const failCount = (raw.fail_count as number) ?? (raw.losses as number) ?? 0;
  const ruleText =
    (raw.rule_text as string) ??
    (raw.description as string) ??
    '';

  return {
    id: raw.id as string,
    rule_text: ruleText,
    description: raw.description as string | undefined,
    status: normalizeRuleStatus((raw.status as string) ?? 'ACTIVE'),
    actionId: raw.actionId as string | undefined,
    win_count: winCount,
    fail_count: failCount,
    wins: winCount,
    losses: failCount,
    win_rate: computeWinRate(winCount, failCount),
    thresholds: raw.thresholds as Partial<PlaybookThresholds> | undefined,
    lastUpdatedIso: (raw.lastUpdatedIso as string) ?? new Date().toISOString(),
    retiredReason: (raw.retiredReason as string) ?? (raw.deprecatedReason as string),
    deprecatedReason: raw.deprecatedReason as string | undefined,
  };
}

/** Normalizacja całego playbooka */
export function normalizePlaybook(raw: Record<string, unknown>): Playbook {
  const thresholds = (raw.thresholds as PlaybookThresholds) ?? {
    promoteMinWinRate: 0.6,
    deprecateBelowWinRate: 0.3,
    minRunsForSignificance: 5,
    thresholdAdjustDelayHours: 24,
    minEventsForWinner: 1000,
    evaluationDelayHours: 48,
  };

  const minConfidence =
    (raw.min_confidence_threshold as number) ??
    thresholds.promoteMinWinRate ??
    0.6;

  const rules = ((raw.rules as Record<string, unknown>[]) ?? []).map(normalizeRule);
  const quarantine = ((raw.quarantine_rules as Record<string, unknown>[]) ?? []).map(normalizeRule);

  return {
    version: (raw.version as number) ?? 1,
    updatedAtIso: (raw.updatedAtIso as string) ?? new Date().toISOString(),
    min_confidence_threshold: minConfidence,
    thresholds: {
      ...thresholds,
      minEventsForWinner: thresholds.minEventsForWinner ?? 1000,
      evaluationDelayHours: thresholds.evaluationDelayHours ?? 48,
    },
    rules,
    quarantine_rules: quarantine,
    operatorContextAttributes: (raw.operatorContextAttributes as string[]) ?? [],
  };
}

export function computeWinRate(wins: number, losses: number): number {
  const n = wins + losses;
  return n === 0 ? 0 : wins / n;
}

export function loadPlaybook(filePath: string = DEFAULT_PLAYBOOK_PATH): Playbook {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  const pb = normalizePlaybook(raw);
  syncRuleCounts(pb);
  return pb;
}

function syncRuleCounts(pb: Playbook): void {
  for (const r of [...pb.rules, ...pb.quarantine_rules]) {
    r.win_rate = computeWinRate(r.win_count, r.fail_count);
    r.wins = r.win_count;
    r.losses = r.fail_count;
    if (!r.rule_text && r.description) r.rule_text = r.description;
  }
}

export function savePlaybook(pb: Playbook, filePath: string = DEFAULT_PLAYBOOK_PATH): void {
  pb.updatedAtIso = new Date().toISOString();
  syncRuleCounts(pb);
  fs.writeFileSync(filePath, JSON.stringify(pb, null, 2) + '\n', 'utf8');
}

/** Tylko ACTIVE (alias activeRules) */
export function activeRules(pb: Playbook): PlaybookRule[] {
  return pb.rules.filter(r => normalizeRuleStatus(r.status) === 'ACTIVE');
}

/**
 * Spec v1: reguły dla promptu Operatora — tylko ACTIVE z win_rate ≥ min_confidence_threshold
 * (lub min_confidence jako próg użycia; reguły bez runów mogą być ACTIVE z win_rate=0).
 */
export function getOperatorSystemRules(pb: Playbook): PlaybookRule[] {
  const minConf = pb.min_confidence_threshold;
  return pb.rules.filter(r => {
    const status = normalizeRuleStatus(r.status);
    if (status !== 'ACTIVE') return false;
    const n = r.win_count + r.fail_count;
    if (n === 0) return true;
    return r.win_rate >= minConf;
  });
}

export function recordRuleOutcome(
  pb: Playbook,
  ruleId: string,
  success: boolean,
  nowIso: string = new Date().toISOString(),
): PlaybookUpdate | null {
  const rule = pb.rules.find(r => r.id === ruleId);
  if (!rule || normalizeRuleStatus(rule.status) !== 'ACTIVE') return null;
  if (success) {
    rule.win_count += 1;
    rule.wins = rule.win_count;
  } else {
    rule.fail_count += 1;
    rule.losses = rule.fail_count;
  }
  rule.win_rate = computeWinRate(rule.win_count, rule.fail_count);
  rule.lastUpdatedIso = nowIso;
  return {
    ruleId,
    kind: success ? 'win' : 'loss',
    detail: `win_rate=${rule.win_rate.toFixed(3)} (${rule.win_count}W/${rule.fail_count}L)`,
  };
}

/**
 * RETIRED rules below deprecateBelowWinRate when minRunsForSignificance reached.
 * Opcjonalnie przenosi do quarantine_rules.
 */
export function retireWeakRules(
  pb: Playbook,
  nowIso: string = new Date().toISOString(),
  moveToQuarantine = true,
): PlaybookUpdate[] {
  const t = pb.thresholds;
  const updates: PlaybookUpdate[] = [];
  const remaining: PlaybookRule[] = [];

  for (const rule of pb.rules) {
    if (normalizeRuleStatus(rule.status) !== 'ACTIVE') {
      remaining.push(rule);
      continue;
    }
    const n = rule.win_count + rule.fail_count;
    if (n < t.minRunsForSignificance) {
      remaining.push(rule);
      continue;
    }
    if (rule.win_rate < t.deprecateBelowWinRate) {
      rule.status = 'RETIRED';
      rule.retiredReason = `win_rate ${rule.win_rate.toFixed(3)} < ${t.deprecateBelowWinRate} after ${n} runs`;
      rule.deprecatedReason = rule.retiredReason;
      rule.lastUpdatedIso = nowIso;
      if (moveToQuarantine) {
        rule.status = 'QUARANTINE';
        pb.quarantine_rules.push(rule);
      }
      updates.push({
        ruleId: rule.id,
        kind: moveToQuarantine ? 'quarantine' : 'retire',
        detail: `Retired rule ${rule.id}: ${rule.retiredReason}`,
      });
    } else {
      remaining.push(rule);
    }
  }

  pb.rules = remaining;
  return updates;
}

/** @deprecated alias retireWeakRules */
export function deprecateWeakRules(
  pb: Playbook,
  nowIso: string = new Date().toISOString(),
): PlaybookUpdate[] {
  return retireWeakRules(pb, nowIso, false).map(u => ({
    ...u,
    kind: u.kind === 'quarantine' ? 'deprecate' : u.kind,
  }));
}

/**
 * Adjust global thresholds only after time-delay + significance guardrail.
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
    if (elapsed < delayMs) return null;
  }
  const totalRuns = pb.rules.reduce((s, r) => s + r.win_count + r.fail_count, 0);
  if (totalRuns < pb.thresholds.minRunsForSignificance) return null;
  Object.assign(pb.thresholds, patch);
  pb.updatedAtIso = now.toISOString();
  return {
    ruleId: '*thresholds*',
    kind: 'threshold_adjust',
    detail: JSON.stringify(patch),
  };
}
