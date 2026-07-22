/**
 * siegeMachines.ts — kolejka machin oblężniczych (C3-Q8=C, OBL-S5).
 * Pure helpers; stan trzymany na City.siegeMachines (SILNIK).
 */

export type SiegeMachineKind = 'taran' | 'wieza';

export interface SiegeMachinesState {
  queue: SiegeMachineKind[];
  ready: SiegeMachineKind[];
  /** Postęp budowy (1.0 = jedna maszyna z kolejki). */
  buildProgress: number;
}

export const SIEGE_MACHINE_TYPE_ID: Record<SiegeMachineKind, string> = {
  taran: 'Taran',
  wieza: 'Wieża oblężnicza',
};

export function ensureSiegeMachines(
  city: { siegeMachines?: SiegeMachinesState },
): SiegeMachinesState {
  if (!city.siegeMachines) {
    city.siegeMachines = { queue: [], ready: [], buildProgress: 0 };
  }
  return city.siegeMachines;
}

export function queueSiegeMachine(
  city: { siegeMachines?: SiegeMachinesState },
  kind: SiegeMachineKind,
  maxQueue = 4,
): boolean {
  const m = ensureSiegeMachines(city);
  if (m.queue.length >= maxQueue) return false;
  m.queue.push(kind);
  return true;
}

/** C3-Q8=C: tempo ∝ liczba oblegających (1 + floor(n/10) postępu/turę). */
export function advanceSiegeMachineBuild(
  city: { siegeMachines?: SiegeMachinesState },
  besiegerCount: number,
): number {
  const m = ensureSiegeMachines(city);
  const rate = 1 + Math.floor(Math.max(0, besiegerCount) / 10);
  m.buildProgress += rate;
  let completed = 0;
  while (m.buildProgress >= 1 && m.queue.length > 0) {
    m.buildProgress -= 1;
    m.ready.push(m.queue.shift()!);
    completed++;
  }
  return completed;
}

export function consumeReadyMachines(
  city: { siegeMachines?: SiegeMachinesState },
): SiegeMachineKind[] {
  const m = ensureSiegeMachines(city);
  const out = m.ready.slice();
  m.ready.length = 0;
  return out;
}

/** #50: podgląd gotowych machin bez ich zużycia — do rosteru preBattle, przed potwierdzeniem szturmu. */
export function peekReadyMachines(
  city: { siegeMachines?: SiegeMachinesState },
): SiegeMachineKind[] {
  const m = ensureSiegeMachines(city);
  return m.ready.slice();
}

export function clearSiegeMachines(city: { siegeMachines?: SiegeMachinesState }): void {
  delete city.siegeMachines;
}

export function formatMachinesLabel(m?: SiegeMachinesState): string {
  if (!m) return 'brak';
  const q = m.queue.map(k => (k === 'taran' ? 'Taran' : 'Wieża')).join(', ') || '—';
  const r = m.ready.map(k => (k === 'taran' ? 'Taran' : 'Wieża')).join(', ') || '—';
  return 'kolejka: ' + q + ' · gotowe: ' + r;
}
