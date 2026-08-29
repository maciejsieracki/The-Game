/**
 * Playbook manager — Moduł 3: win/loss, win_rate, RETIRED <30%, getOperatorSystemRules.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Playbook, PlaybookRule, PlaybookUpdate, PlaybookThresholds, RuleStatusCanonical } from './types';

const DEFAULT_PLAYBOOK_PATH = path.resolve(__dirname, '..', 'playbook.json');

/** Normalizacja statusu legacy → kanoniczny (v2: PROTECTED / alias PL CHRONIONA) */
export function normalizeRuleStatus(status: string): RuleStatusCanonical {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'candidate') return 'ACTIVE';
  if (s === 'deprecated') return 'RETIRED';
  if (s === 'quarantine') return 'QUARANTINE';
  if (s === 'retired') return 'RETIRED';
  if (s === 'protected' || s === 'chroniona') return 'PROTECTED';
  if (s === 'review') return 'REVIEW';
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
    reviewReason: raw.reviewReason as string | undefined,
    /** Wsteczna zgodność: brak pola w źródle -> false, nie undefined-crash. */
    protected: (raw.protected as boolean | undefined) ?? false,
  };
}

/** Normalizacja całego playbooka */
export function normalizePlaybook(raw: Record<string, unknown>): Playbook {
  const thresholds = (raw.thresholds as PlaybookThresholds) ?? {
    promoteMinWinRate: 0.6,
    deprecateBelowWinRate: 0.3,
    // v2 Protokół AutoBot (Maciej 2026-08-07): min. 10 zastosowań przed zmianą statusu.
    minRunsForSignificance: 10,
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
    errorLog: (raw.errorLog as Playbook['errorLog']) ?? [],
    conclusionsJournal: (raw.conclusionsJournal as Playbook['conclusionsJournal']) ?? [],
    openMatters: (raw.openMatters as Playbook['openMatters']) ?? [],
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
    // CHRONIONA (protected) — zawsze widoczna dla Operatora, bez względu na
    // min_confidence_threshold i liczbę runów (Maciej 2026-08-07).
    if (r.protected) return true;
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
 * Reguły poniżej deprecateBelowWinRate po osiągnięciu minRunsForSignificance
 * NIE są już cicho wycofywane (decyzja właściciela, 2026-08-20). Zamiast
 * status='RETIRED' + przeniesienia do quarantine_rules, reguła dostaje
 * status='REVIEW' i ZOSTAJE w pb.rules — nic nie znika z pliku ani z historii.
 * getOperatorSystemRules filtruje po status==='ACTIVE', więc REVIEW przestaje
 * być sugerowana Operatorowi (efekt zamierzony), ale jawny wpis trafia do
 * PYTANIA-OTWARTE.md (patrz formatReviewFlagForOpenQuestions + evaluator-agent.ts)
 * zamiast znikać bez śladu.
 *
 * `moveToQuarantine` zostaje w sygnaturze wyłącznie dla zgodności wstecznej
 * wywołań/aliasu (deprecateWeakRules) — nie jest już używany w tej ścieżce,
 * bo REVIEW nigdy nie trafia do quarantine_rules.
 */
export function retireWeakRules(
  pb: Playbook,
  nowIso: string = new Date().toISOString(),
  moveToQuarantine = true,
): PlaybookUpdate[] {
  void moveToQuarantine;
  const t = pb.thresholds;
  const updates: PlaybookUpdate[] = [];

  for (const rule of pb.rules) {
    if (normalizeRuleStatus(rule.status) !== 'ACTIVE') continue;
    // CHRONIONA (protected) — bariera bezpieczeństwa zatwierdzona przez człowieka;
    // nie podlega wycofaniu/przeglądowi bez względu na liczniki (Maciej 2026-08-07).
    if (rule.protected) continue;
    const n = rule.win_count + rule.fail_count;
    if (n < t.minRunsForSignificance) continue;
    if (rule.win_rate < t.deprecateBelowWinRate) {
      rule.status = 'REVIEW';
      rule.reviewReason = `win_rate ${rule.win_rate.toFixed(3)} < ${t.deprecateBelowWinRate} po ${n} próbach — do przeglądu właściciela`;
      rule.lastUpdatedIso = nowIso;
      updates.push({
        ruleId: rule.id,
        kind: 'review',
        detail: `Rule ${rule.id} flagged for owner review (status REVIEW): ${rule.reviewReason}; pozostaje w pb.rules`,
      });
    }
  }

  return updates;
}

/** @deprecated alias retireWeakRules */
export function deprecateWeakRules(
  pb: Playbook,
  nowIso: string = new Date().toISOString(),
): PlaybookUpdate[] {
  return retireWeakRules(pb, nowIso, false);
}

/**
 * Buduje gotowy tekst wpisu do `dyspozycje/PYTANIA-OTWARTE.md` dla reguły,
 * która właśnie przeszła w status REVIEW. Wyłącznie formatowanie (bez I/O na
 * plikach — playbook-manager.ts dziś nie dotyka niczego poza playbook.json);
 * faktyczny zapis (appendFileSync do PYTANIA-OTWARTE.md) robi evaluator-agent.ts,
 * który już ma wzorzec I/O (appendPostmortemLog/appendRunHistory z logging.ts)
 * i jest miejscem, gdzie retireWeakRules jest faktycznie wywoływane.
 *
 * Format celowo NIE jest pełnym ABC (opis + a/b/c) — to nie jest decyzja
 * produktowa z alternatywami, tylko krótka flaga: "ta reguła przestała działać,
 * zdecyduj co dalej". Nagłówek i styl (ID · STATUS: **...**, potem pogrubione
 * "Ustalenie:") dopasowane do istniejącej konwencji krótkich wpisów w pliku
 * (np. `R-DYPLO-9CC7C76C-ZAKRES-NIEUDOKUMENTOWANY`).
 */
export function formatReviewFlagForOpenQuestions(
  rule: PlaybookRule,
  nowIso: string = new Date().toISOString(),
): string {
  const date = nowIso.slice(0, 10);
  const n = rule.win_count + rule.fail_count;
  const reason = rule.reviewReason ?? `win_rate ${rule.win_rate.toFixed(3)} po ${n} próbach`;
  return [
    `## R-AUTOBOT-REGULA-REVIEW-${rule.id} (${date}, AutoBot retireWeakRules) · STATUS: **OTWARTE — DO PRZEGLĄDU WŁAŚCICIELA**`,
    '',
    `**Ustalenie:** reguła \`${rule.id}\` (\`${rule.rule_text}\`) osiągnęła ${reason}. ` +
      'Automat NIE wycofuje jej cicho — status ustawiony na `REVIEW`, reguła zostaje w ' +
      '`playbook.json` (`rules[]`), ale `getOperatorSystemRules` przestaje ją proponować Operatorowi.',
    '',
    '**Do decyzji właściciela:** zostawić bez zmian (wrócić do ACTIVE), poprawić warunek ' +
      'stosowania reguły, albo świadomie wycofać (status RETIRED).',
    '',
    `**Liczniki:** ${rule.win_count}W/${rule.fail_count}L, win_rate=${rule.win_rate.toFixed(3)}.`,
    '',
    '---',
    '',
  ].join('\n');
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
