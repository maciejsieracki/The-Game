/**
 * AutoBot — wspólne typy (Evaluator–Operator).
 * R-PROC-AUTOBOT · Maciej 2026-08-05
 */

export type RuleStatus = 'active' | 'deprecated' | 'candidate';

export interface PlaybookThresholds {
  /** Min. win_rate zanim reguła może być promuowana / użyta agresywniej */
  promoteMinWinRate: number;
  /** Poniżej tego win_rate → deprecate (domyślnie 0.30) */
  deprecateBelowWinRate: number;
  /** Min. liczba runów zanim wolno deprecate / ogłosić winner */
  minRunsForSignificance: number;
  /** Min. godzin między zmianami progów (time-delay guardrail) */
  thresholdAdjustDelayHours: number;
}

export interface PlaybookRule {
  id: string;
  description: string;
  status: RuleStatus;
  /** Identyfikator akcji Operatora (np. "implement-fix", "run-lane-tests") */
  actionId: string;
  wins: number;
  losses: number;
  /** wins / (wins+losses); 0 gdy brak runów */
  win_rate: number;
  /** Opcjonalne progi lokalne nadpisujące globalne */
  thresholds?: Partial<PlaybookThresholds>;
  lastUpdatedIso: string;
  deprecatedReason?: string;
}

export interface Playbook {
  version: number;
  updatedAtIso: string;
  thresholds: PlaybookThresholds;
  rules: PlaybookRule[];
  /** Atrybuty kontekstu dozwolone w payloadzie Operatora (po feature pruning) */
  operatorContextAttributes: string[];
}

export type ActionRisk = 'safe' | 'elevated' | 'critical' | 'forbidden';

export interface OperatorAction {
  id: string;
  label: string;
  risk: ActionRisk;
  /** Jeśli true — wymaga hasła / aprobaty człowieka przed wykonaniem */
  requiresHumanApproval: boolean;
}

export interface ExecutionRun {
  id: string;
  startedAtIso: string;
  finishedAtIso?: string;
  taskId: string;
  taskSummary: string;
  operatorRuleIds: string[];
  /** Snapshot atrybutów kontekstu użytych przez Operatora */
  contextPayload: Record<string, unknown>;
  actionId: string;
  /** Czy guardrail zablokował wykonanie */
  blockedByGuardrail?: string;
  /** Surowy wynik operacji (logi, ścieżki plików, exit codes) */
  rawOutcome?: Record<string, unknown>;
  success?: boolean;
}

/** Twarde metryki biznesowe / inżynierskie po runie Operatora */
export interface HardMetrics {
  testsPassed?: number;
  testsFailed?: number;
  typecheckOk?: boolean;
  playtestOk?: boolean | null;
  regressionDetected?: boolean;
  deployMd5?: string | null;
  /** Dowolne dodatkowe KPI (np. czas tury, liczba bugów) */
  custom?: Record<string, number | boolean | null>;
}

export interface EvaluationResult {
  id: string;
  runId: string;
  evaluatedAtIso: string;
  metrics: HardMetrics;
  /** Delta vs baseline / poprzedni run */
  deltas: Record<string, number>;
  success: boolean;
  postmortem: string;
  playbookUpdates: PlaybookUpdate[];
  prunedAttributes: string[];
}

export interface PlaybookUpdate {
  ruleId: string;
  kind: 'win' | 'loss' | 'deprecate' | 'threshold_adjust' | 'reactivate';
  detail: string;
}

export interface FeaturePruneReport {
  evaluatedRuns: number;
  keptAttributes: string[];
  prunedAttributes: string[];
  /** atrybut → |korelacja| lub score mocy predykcyjnej */
  scores: Record<string, number>;
}

export interface PostmortemLogEntry {
  tsIso: string;
  evaluationId: string;
  runId: string;
  success: boolean;
  deltas: Record<string, number>;
  postmortem: string;
  playbookUpdates: PlaybookUpdate[];
}
