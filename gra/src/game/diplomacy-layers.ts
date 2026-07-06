/**
 * diplomacy-layers.ts — warstwy dyplomacji D-START-2B / 3A.
 * Uproszczona (klaster, ten sam typ): pokój, wojna, handel.
 * Pełna: istniejący model diplomacy.ts (obcy typ po kontakcie).
 */

import type { AIDiplomacyCommand } from './ai';
import { DIPLOMACY_PARAMS, type Relation } from './diplomacy';

export type DiplomacyLayer = 'simplified' | 'full' | 'pre_contact';

const SIMPLIFIED_CMD = new Set<string>([
  'wypowiedz_wojne',
  'zaproponuj_pokoj',
  'zaproponuj_handel',
]);

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/** Relacja startowa gracz ↔ AI (z modyfikatorem typu). */
export function startRelationForPair(sameType: boolean): Relation {
  const p = DIPLOMACY_PARAMS;
  let zaufanie = p.startZaufanie;
  if (sameType) {
    zaufanie += p.rywalizacjaTenSamTyp_zaufanie;
  } else {
    zaufanie += p.roznicaKulturowa_zaufanie;
  }
  return {
    zaufanie: clamp(zaufanie, 0, 100),
    respekt: p.startRespekt,
    status: 'neutralni',
  };
}

/** Domyślna relacja neutralna (lazy init bez kontekstu typu). */
export function defaultNeutralRelation(): Relation {
  const p = DIPLOMACY_PARAMS;
  return {
    zaufanie: p.startZaufanie,
    respekt: p.startRespekt,
    status: 'neutralni',
  };
}

/**
 * D-START-3A: kontakt = odkryty heks miasta AI lub jednostki AI (mgła).
 */
export function computeDiplomaticContacts(
  explored: ReadonlySet<string>,
  cities: ReadonlyArray<{ ownerId: number; q: number; r: number }>,
  units: ReadonlyArray<{ ownerId: number; q: number; r: number }>,
  playerOwnerId = 0,
): Set<number> {
  const contacted = new Set<number>();
  for (const c of cities) {
    if (c.ownerId === playerOwnerId) continue;
    if (explored.has(hexKey(c.q, c.r))) contacted.add(c.ownerId);
  }
  for (const u of units) {
    if (u.ownerId === playerOwnerId) continue;
    if (explored.has(hexKey(u.q, u.r))) contacted.add(u.ownerId);
  }
  return contacted;
}

/** Backward-compatible overload (testy / stare wywołania). */
export function diplomacyLayerForOwner(
  ownerId: number,
  simplifiedOwners: ReadonlySet<number>,
  foreignTypeOwners?: ReadonlySet<number>,
  contactedOwners?: ReadonlySet<number>,
): DiplomacyLayer {
  if (foreignTypeOwners === undefined || contactedOwners === undefined) {
    return simplifiedOwners.has(ownerId) ? 'simplified' : 'full';
  }
  if (simplifiedOwners.has(ownerId)) return 'simplified';
  if (foreignTypeOwners.has(ownerId) && !contactedOwners.has(ownerId)) {
    return 'pre_contact';
  }
  return 'full';
}

/** Filtruje komendy AI — uproszczony tryb bez sojuszu/trybutu; brak akcji przed kontaktem. */
export function filterDiplomacyCommandsForLayer(
  cmds: AIDiplomacyCommand[] | null | undefined,
  layer: DiplomacyLayer,
): AIDiplomacyCommand[] {
  const list = cmds ?? [];
  if (layer === 'pre_contact') return [];
  if (layer === 'full') return list;
  return list.filter(c => SIMPLIFIED_CMD.has(c.type));
}

/** Etykiety dozwolonych akcji w UI (podgląd v1). */
export function allowedActionsForLayer(layer: DiplomacyLayer): readonly string[] {
  if (layer === 'pre_contact') return ['Brak kontaktu'];
  if (layer === 'simplified') return ['Pokój', 'Wojna', 'Handel'];
  return ['Pełna dyplomacja'];
}

/** Czy gracz może wykonać akcję dyplomatyczną w panelu. */
export function playerDiplomacyActionAllowed(
  layer: DiplomacyLayer,
  action: 'war' | 'peace' | 'trade',
): boolean {
  if (layer === 'pre_contact') return false;
  if (layer === 'simplified') return true;
  return action === 'war' || action === 'peace' || action === 'trade';
}
