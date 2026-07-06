/**
 * siegeCampSync.ts — pomocnik dla INTEGRATOR: mapowanie machin → heksy obozów (OBL-S6).
 */
import type { SiegeMachineKind } from '../game/siegeMachines';

/** Gotowe machiny z City.siegeMachines (OBL-S5 stan silnika). */
export function readyMachinesForCity(
  city: { siegeMachines?: { ready: SiegeMachineKind[] } },
): SiegeMachineKind[] {
  return city.siegeMachines?.ready ?? [];
}

/** Rozdziela gotowe machiny round-robin po heksach obozów sąsiadujących z miastem. */
export function machinesByCampHex(
  campHexes: string[],
  ready: SiegeMachineKind[],
): Map<string, SiegeMachineKind[]> {
  const out = new Map<string, SiegeMachineKind[]>();
  if (campHexes.length === 0 || ready.length === 0) return out;
  ready.forEach((kind, i) => {
    const hk = campHexes[i % campHexes.length]!;
    const list = out.get(hk) ?? [];
    list.push(kind);
    out.set(hk, list);
  });
  return out;
}

/** hexKey -> ownerId atakującego (pierwsza jednostka na tym heksie). */
export function campOwnerByHex(
  campHexes: string[],
  units: ReadonlyArray<{ q: number; r: number; ownerId: number }>,
  keyOf: (q: number, r: number) => string,
  cityOwnerId: number,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const hk of campHexes) {
    const parts = hk.split(',');
    if (parts.length !== 2) continue;
    const q = parseInt(parts[0]!, 10);
    const r = parseInt(parts[1]!, 10);
    if (isNaN(q) || isNaN(r)) continue;
    const u = units.find(u => u.q === q && u.r === r && u.ownerId !== cityOwnerId);
    if (u) out.set(hk, u.ownerId);
  }
  return out;
}
