/**
 * AutoBot — wspólne typy (Evaluator–Operator).
 * R-PROC-AUTOBOT · Spec v1 — 5 modułów · Maciej 2026-08-05
 */

/**
 * Kanoniczne statusy reguł (spec v1 + v2 Protokół AutoBot, Maciej 2026-08-07;
 * REVIEW dodane 2026-08-20 — decyzja właściciela: reguła o niskiej skuteczności
 * nie ma być cicho wycofywana, ma wracać "na tapetę" właściciela).
 * PROTECTED (alias PL: CHRONIONA) — bariery bezpieczeństwa i reguły zatwierdzone
 * wprost przez człowieka; nie podlegają licznikom win/fail ani automatycznemu
 * RETIRED (retireWeakRules pomija wszystko poza ACTIVE — działa "za darmo").
 * Status PROTECTED nadaje WYŁĄCZNIE człowiek, nigdy agent samodzielnie.
 * REVIEW — reguła przekroczyła próg istotności (minRunsForSignificance) z win_rate
 * poniżej deprecateBelowWinRate. NIE jest cicho wycofywana ani przenoszona do
 * quarantine_rules: zostaje w `rules[]`, ale getOperatorSystemRules ją pomija
 * (filtr status !== 'ACTIVE'), więc Operator przestaje ją dostawać. Flaga trafia
 * jawnie do `dyspozycje/PYTANIA-OTWARTE.md` — decyzję (zostaw / popraw warunek
 * stosowania / świadomie wycofaj) podejmuje wyłącznie właściciel.
 */
export type RuleStatusCanonical = 'ACTIVE' | 'RETIRED' | 'QUARANTINE' | 'PROTECTED' | 'REVIEW';

/** Aliasy historyczne — normalizowane przy loadPlaybook */
export type RuleStatusLegacy = 'active' | 'deprecated' | 'candidate';

export type RuleStatus = RuleStatusCanonical | RuleStatusLegacy;

export interface PlaybookThresholds {
  /** Min. win_rate zanim reguła może być promuowana / użyta agresywniej */
  promoteMinWinRate: number;
  /** Poniżej tego win_rate → RETIRED (domyślnie 0.30) */
  deprecateBelowWinRate: number;
  /** Min. liczba runów zanim wolno RETIRED / ogłosić winner */
  minRunsForSignificance: number;
  /** Min. godzin między zmianami progów (time-delay guardrail) */
  thresholdAdjustDelayHours: number;
  /** Min. zdarzeń przed ogłoszeniem zwycięzcy A/B (guardrail data exposure) */
  minEventsForWinner?: number;
  /** Min. godzin opóźnienia przed ogłoszeniem zwycięzcy (domyślnie 48h) */
  evaluationDelayHours?: number;
}

export interface PlaybookRule {
  id: string;
  /** Tekst reguły dla Operatora (spec v1) */
  rule_text: string;
  /** Alias historyczny */
  description?: string;
  status: RuleStatus;
  /** Identyfikator akcji Operatora (np. "implement-fix", "run-lane-tests") */
  actionId?: string;
  /** Spec v1: win_count */
  win_count: number;
  /** Spec v1: fail_count */
  fail_count: number;
  /** Aliasy historyczne — synchronizowane z win_count/fail_count */
  wins?: number;
  losses?: number;
  /** win_count / (win_count + fail_count); 0 gdy brak runów */
  win_rate: number;
  /** Opcjonalne progi lokalne nadpisujące globalne */
  thresholds?: Partial<PlaybookThresholds>;
  lastUpdatedIso: string;
  retiredReason?: string;
  /** Alias historyczny */
  deprecatedReason?: string;
  /**
   * Powód wejścia w status REVIEW (win_rate < próg po N próbach) — patrz
   * RuleStatusCanonical. Ustawiane przez retireWeakRules, czytane przy budowie
   * wpisu do PYTANIA-OTWARTE.md (formatReviewFlagForOpenQuestions).
   */
  reviewReason?: string;
  /**
   * Bariera bezpieczeństwa zatwierdzona wprost przez człowieka (status CHRONIONA
   * w playbook.md, AUTOBOT.md §5). Reguła chroniona nie podlega licznikom ani
   * wycofaniu — retireWeakRules ją pomija, getOperatorSystemRules pokazuje ją
   * zawsze, niezależnie od min_confidence_threshold. Opcjonalne, domyślnie false
   * — wsteczna zgodność z regułami bez tego pola.
   */
  protected?: boolean;
}

/**
 * Rejestr błędów — v2 Protokół AutoBot (Maciej 2026-08-07). Lista "NIGDY WIĘCEJ",
 * odrębna od `rules[]` (liczniki win/fail): tu żyje CHRONOLOGICZNY, czytelny dla
 * człowieka zapis konkretnych pomyłek + ich przyczyny źródłowej, żeby powtórka
 * (recydywa) była natychmiast rozpoznawalna przez porównanie z tą listą.
 */
export interface ErrorLogEntry {
  id: string;
  dateIso: string;
  /** Co się stało — konkretnie, bez ogólników */
  whatHappened: string;
  /** Przyczyna ŹRÓDŁOWA, nie "kto zawinił" — patrz protokół błędu, R-PROC-AUTOBOT-BLAD */
  rootCause: string;
  /** ID reguły zapobiegawczej w rules[] powstałej z tego błędu */
  preventiveRuleId: string;
  /** true = ten błąd już RAZ powtórzył wcześniejszy wpis (recydywa = incydent krytyczny) */
  isRecidivism?: boolean;
}

/**
 * Dziennik wniosków — v2 Protokół AutoBot. Ważniejszy niż same reguły: pokazuje
 * DLACZEGO reguły wyglądają tak, a nie inaczej. Najnowsze na górze.
 */
export interface ConclusionJournalEntry {
  dateIso: string;
  /** Nazwa/ID zadania lub paczki, której dotyczy wpis */
  task: string;
  done: string;
  /** Miara zewnętrzna (nie samoocena) — lub "oczekuje, patrz Sprawy otwarte" */
  outcome: string;
  conclusion: string;
}

/**
 * Sprawy otwarte — zadania, których wyniku nie dało się jeszcze zmierzyć.
 * Przeglądane obowiązkowo na starcie każdej sesji AutoBot (rytuał startowy).
 */
export interface OpenMatter {
  dateIso: string;
  whatIsPending: string;
  /** Konkretna data lub zdarzenie, po którym wynik będzie znany */
  whenExpected: string;
}

export interface Playbook {
  version: number;
  updatedAtIso: string;
  /** Spec v1: próg użycia reguły w prompcie Operatora */
  min_confidence_threshold: number;
  /** Progi globalne (guardrails, significance) */
  thresholds: PlaybookThresholds;
  rules: PlaybookRule[];
  /** Reguły w kwarantannie (win_rate bardzo niski, ale zachowana historia) */
  quarantine_rules: PlaybookRule[];
  /** Atrybuty kontekstu dozwolone w payloadzie Operatora (po feature pruning) */
  operatorContextAttributes: string[];
  /** v2: Rejestr błędów — patrz ErrorLogEntry. Najnowsze na górze (indeks 0). */
  errorLog: ErrorLogEntry[];
  /** v2: Dziennik wniosków — patrz ConclusionJournalEntry. Najnowsze na górze. */
  conclusionsJournal: ConclusionJournalEntry[];
  /** v2: Sprawy otwarte — patrz OpenMatter. */
  openMatters: OpenMatter[];
}

export type ActionRisk = 'safe' | 'elevated' | 'critical' | 'forbidden';

export type OperatorProfile = 'dev' | 'sales' | 'trading';

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
  /** Wynik sukcesu jako score 0–1 dla korelacji w feature pruning */
  successScore?: number;
}

/** Twarde metryki biznesowe / inżynierskie po runie Operatora (Single Source of Truth) */
export interface HardMetrics {
  /** Profil scorera (domyślnie dev w Civ) */
  profile?: OperatorProfile;
  /** Dev: typecheck + testy + merge/deploy gate */
  testsPassed?: number;
  testsFailed?: number;
  typecheckOk?: boolean;
  buildPassed?: boolean;
  linterPassed?: boolean;
  humanMerged?: boolean;
  humanApproved?: boolean;
  playtestOk?: boolean | null;
  regressionDetected?: boolean;
  deployMd5?: string | null;
  /** Sales stub */
  convertedLeads?: number;
  totalContacted?: number;
  /** Trading stub */
  winRateClosed?: number;
  sharpeRatio?: number;
  /** Dowolne dodatkowe KPI */
  custom?: Record<string, number | boolean | null>;
}

/** Waga cechy w kontekście Operatora (po pruning) */
export interface FeatureWeight {
  name: string;
  weight: number;
  enabled: boolean;
}

export interface EvaluationResult {
  id: string;
  runId: string;
  evaluatedAtIso: string;
  metrics: HardMetrics;
  /** Metryka główna przed runem (baseline) */
  metricBefore: Record<string, number>;
  /** Metryka główna po runie */
  metricAfter: Record<string, number>;
  /** performanceScore = f(metricReal) - penaltyComplexity */
  performanceScore: number;
  /** Delta vs baseline / poprzedni run */
  deltas: Record<string, number>;
  success: boolean;
  postmortem: string;
  playbookUpdates: PlaybookUpdate[];
  prunedAttributes: string[];
}

export interface PlaybookUpdate {
  ruleId: string;
  /**
   * 'review' — win_rate poniżej progu po minRunsForSignificance próbach: reguła
   * NIE jest wycofywana, zostaje w rules[] ze statusem REVIEW i trafia jawnie
   * do PYTANIA-OTWARTE.md (decyzja właściciela). Zastąpiło dawne ciche 'retire'
   * dla tej ścieżki (2026-08-20); 'retire'/'quarantine' zostają jako oznaczenia
   * dla świadomego, ręcznego wycofania.
   */
  kind: 'win' | 'loss' | 'retire' | 'deprecate' | 'quarantine' | 'threshold_adjust' | 'reactivate' | 'review';
  detail: string;
}

export interface FeaturePruneReport {
  evaluatedRuns: number;
  keptAttributes: string[];
  prunedAttributes: string[];
  /** atrybut → |korelacja Pearsona| vs success score */
  scores: Record<string, number>;
  /** Zaktualizowana allow-lista wag (opcjonalnie) */
  featureWeights?: FeatureWeight[];
  /** Akcje do zapisu w postmortem log */
  actionsTaken: string[];
}

/** Dashboard JSONL — pola wymagane przez spec v1 */
export interface DashboardLogEntry {
  run_id: string;
  timestamp: string;
  metric_before: number | Record<string, number>;
  metric_after: number | Record<string, number>;
  delta_percentage: number;
  postmortem_reasoning: string;
  action_taken: string;
}

/** Postmortem log — rozszerzenie DashboardLogEntry + aliasy historyczne */
export interface PostmortemLogEntry extends DashboardLogEntry {
  /** Alias historyczny */
  tsIso?: string;
  evaluationId?: string;
  runId?: string;
  success?: boolean;
  deltas?: Record<string, number>;
  postmortem?: string;
  playbookUpdates?: PlaybookUpdate[];
}
