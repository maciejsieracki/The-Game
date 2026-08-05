/**
 * Dashboard logger — Moduł 5: strukturalny JSONL pod dashboard.
 */
import * as fs from 'fs';
import * as path from 'path';
import type {
  DashboardLogEntry,
  ExecutionRun,
  PostmortemLogEntry,
  PlaybookUpdate,
} from './types';

const LOG_DIR = path.resolve(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'postmortems.jsonl');
const RUN_HISTORY_FILE = path.join(LOG_DIR, 'run-history.jsonl');

/** Wpis historii runów dla prune / delay (append-only JSONL) */
export interface RunHistoryEntry {
  run: ExecutionRun;
  evaluatedAtIso: string;
  success: boolean;
  performanceScore: number;
}

export function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

/** Zapis wpisu dashboard (spec v1 pola wymagane) */
export function appendDashboardLog(entry: DashboardLogEntry): void {
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
}

export interface PostmortemInput {
  runId: string;
  evaluationId?: string;
  success: boolean;
  metricBefore: number | Record<string, number>;
  metricAfter: number | Record<string, number>;
  deltaPercentage: number;
  postmortemReasoning: string;
  actionTaken: string;
  deltas?: Record<string, number>;
  playbookUpdates?: PlaybookUpdate[];
}

/** Buduje DashboardLogEntry + aliasy historyczne */
export function buildPostmortemEntry(input: PostmortemInput): PostmortemLogEntry {
  const timestamp = new Date().toISOString();
  return {
    run_id: input.runId,
    timestamp,
    metric_before: input.metricBefore,
    metric_after: input.metricAfter,
    delta_percentage: input.deltaPercentage,
    postmortem_reasoning: input.postmortemReasoning,
    action_taken: input.actionTaken,
    tsIso: timestamp,
    evaluationId: input.evaluationId,
    runId: input.runId,
    success: input.success,
    deltas: input.deltas,
    postmortem: input.postmortemReasoning,
    playbookUpdates: input.playbookUpdates,
  };
}

export function appendPostmortemLog(entry: PostmortemLogEntry | PostmortemInput): void {
  const normalized =
    'run_id' in entry && entry.run_id
      ? (entry as PostmortemLogEntry)
      : buildPostmortemEntry(entry as PostmortemInput);
  appendDashboardLog(normalized);
}

export function appendRunHistory(entry: RunHistoryEntry): void {
  ensureLogDir();
  fs.appendFileSync(RUN_HISTORY_FILE, JSON.stringify(entry) + '\n', 'utf8');
}

export function readRunHistory(limit = 500): RunHistoryEntry[] {
  if (!fs.existsSync(RUN_HISTORY_FILE)) return [];
  const lines = fs.readFileSync(RUN_HISTORY_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map(l => JSON.parse(l) as RunHistoryEntry);
}

export function readDashboardLogs(limit = 100): DashboardLogEntry[] {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map(l => JSON.parse(l) as DashboardLogEntry);
}

/** @deprecated alias readDashboardLogs */
export function readPostmortemLogs(limit = 100): PostmortemLogEntry[] {
  return readDashboardLogs(limit) as PostmortemLogEntry[];
}

/** Agregat pod prosty UI */
export function dashboardSummary(limit = 50): {
  runs: number;
  successRate: number;
  avgDeltaPercentage: number;
  lastEntries: DashboardLogEntry[];
} {
  const logs = readDashboardLogs(limit);
  const withSuccess = logs.filter(l => {
    const legacy = l as PostmortemLogEntry;
    return legacy.success !== false;
  });
  const ok = withSuccess.length;
  const deltas = logs.map(l => l.delta_percentage).filter(d => Number.isFinite(d));
  const avgDelta = deltas.length === 0 ? 0 : deltas.reduce((a, b) => a + b, 0) / deltas.length;

  return {
    runs: logs.length,
    successRate: logs.length === 0 ? 0 : ok / logs.length,
    avgDeltaPercentage: avgDelta,
    lastEntries: logs.slice().reverse(),
  };
}
