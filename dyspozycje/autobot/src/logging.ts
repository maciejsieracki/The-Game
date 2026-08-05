/**
 * Structured logging — postmortemy i delty pod prosty dashboard.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { PostmortemLogEntry } from './types';

const LOG_DIR = path.resolve(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'postmortems.jsonl');

export function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function appendPostmortemLog(entry: PostmortemLogEntry): void {
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
}

export function readPostmortemLogs(limit = 100): PostmortemLogEntry[] {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  const slice = lines.slice(-limit);
  return slice.map(l => JSON.parse(l) as PostmortemLogEntry);
}

/** Agregat pod prosty UI: success rate + ostatnie delty */
export function dashboardSummary(limit = 50): {
  runs: number;
  successRate: number;
  lastPostmortems: PostmortemLogEntry[];
} {
  const logs = readPostmortemLogs(limit);
  const ok = logs.filter(l => l.success).length;
  return {
    runs: logs.length,
    successRate: logs.length === 0 ? 0 : ok / logs.length,
    lastPostmortems: logs.slice().reverse(),
  };
}
