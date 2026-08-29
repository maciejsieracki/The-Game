/**
 * Minimalny ledger życia dispatchu AutoBot.
 * Jedyny stan trwały to dziewięć pól allowlisty; brak raportu jest zawsze
 * klasyfikowany przez watchdog do TIMEOUT, ZWIS albo BLOCK.
 */

export const LEDGER_STATUSES = [
  'pending',
  'running',
  'completed',
  'interrupted',
  'not_found',
  'timeout',
  'CLOSED',
  'FAIL',
  'BLOCK',
  'TIMEOUT',
  'ZWIS',
] as const;

export type LedgerStatus = (typeof LEDGER_STATUSES)[number];

export interface RoutingStatusLedgerEntry {
  agent_id: string;
  temat: string;
  rola: string;
  runda: number;
  start: string;
  oczekiwany_artefakt: string;
  ostatni_status: LedgerStatus;
  timestamp_zakonczenia: string | null;
  routing_nastepnego_kroku: string;
}

const TERMINAL = new Set<LedgerStatus>([
  'completed',
  'interrupted',
  'not_found',
  'timeout',
  'CLOSED',
  'FAIL',
  'BLOCK',
  'TIMEOUT',
  'ZWIS',
]);

const KEYS = [
  'agent_id',
  'temat',
  'rola',
  'runda',
  'start',
  'oczekiwany_artefakt',
  'ostatni_status',
  'timestamp_zakonczenia',
  'routing_nastepnego_kroku',
] as const;

function assertStatus(status: string): asserts status is LedgerStatus {
  if (!(LEDGER_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Nieznany status ledgeru: ${status}`);
  }
}

function exactEntry(entry: RoutingStatusLedgerEntry): RoutingStatusLedgerEntry {
  const actual = Object.keys(entry).sort().join('|');
  const expected = [...KEYS].sort().join('|');
  if (actual !== expected) throw new Error('Ledger zawiera pole poza allowlistą');
  if (!entry.ostatni_status) throw new Error('Ledger nie może mieć pustego statusu');
  return entry;
}

export function createLedgerEntry(input: {
  agent_id: string;
  temat: string;
  rola: string;
  runda: number;
  start: string;
  oczekiwany_artefakt: string;
}): RoutingStatusLedgerEntry {
  if (!input.agent_id || !input.temat || !input.rola || !input.oczekiwany_artefakt) {
    throw new Error('Ledger wymaga agent_id, temat, rola i oczekiwany_artefakt');
  }
  if (!Number.isInteger(input.runda) || input.runda < 1) throw new Error('runda musi być >= 1');
  return exactEntry({
    ...input,
    ostatni_status: 'pending',
    timestamp_zakonczenia: null,
    routing_nastepnego_kroku: 'spawn → oczekiwanie na raport',
  });
}

export function transition(
  entry: RoutingStatusLedgerEntry,
  status: LedgerStatus,
  now: string,
  routing: string,
): RoutingStatusLedgerEntry {
  assertStatus(status);
  if (!now) throw new Error('Przejście statusu wymaga timestampu');
  return exactEntry({
    ...entry,
    ostatni_status: status,
    timestamp_zakonczenia: TERMINAL.has(status) ? now : null,
    routing_nastepnego_kroku: routing,
  });
}

export function waitForReport(entry: RoutingStatusLedgerEntry): RoutingStatusLedgerEntry {
  if (entry.ostatni_status !== 'pending' && entry.ostatni_status !== 'running') {
    throw new Error('wait wymaga statusu pending albo running');
  }
  return transition(entry, 'running', entry.start, 'wait → wymagany raport terminalny');
}

export function watchdog(
  entry: RoutingStatusLedgerEntry,
  observation: 'completed' | 'interrupted' | 'not_found' | 'timeout' | 'close' | 'silent',
  now: string,
): RoutingStatusLedgerEntry {
  if (observation === 'completed') return transition(entry, 'completed', now, 'Evaluator dla tego samego ID');
  if (observation === 'interrupted') return transition(entry, 'interrupted', now, retryRouting(entry, 'ZWIS'));
  if (observation === 'timeout') return transition(entry, 'TIMEOUT', now, retryRouting(entry, 'TIMEOUT'));
  if (observation === 'silent') return transition(entry, 'ZWIS', now, retryRouting(entry, 'ZWIS'));
  if (observation === 'not_found') return transition(entry, 'BLOCK', now, retryRouting(entry, 'BLOCK'));
  return transition(entry, 'CLOSED', now, 'zamknięcie przebiegu; brak kolejnego dispatchu');
}

export function canDispatchReplacement(entry: RoutingStatusLedgerEntry, observedStatus: string): boolean {
  if (!(LEDGER_STATUSES as readonly string[]).includes(observedStatus)) return false;
  return entry.ostatni_status !== 'pending' && entry.ostatni_status !== 'running';
}

export function retryRouting(entry: RoutingStatusLedgerEntry, verdict: 'FAIL' | 'BLOCK' | 'TIMEOUT' | 'ZWIS'): string {
  if (entry.runda >= 5) return 'LIMIT-5-EXCEEDED → jawna decyzja; zachowaj to samo ID i Operatora';
  return `${verdict} → ten sam temat ${entry.temat}, ten sam Operator, guard rundy → dispatch runda ${entry.runda + 1}`;
}
