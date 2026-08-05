/**
 * diplomacy-audience-actions.ts — budowa listy akcji audiencji z katalogu JSON
 * (D-DYPLO-KATALOG-Q1=A, D-DYPLO-AKCJE-SZARE-Q1=B+C).
 *
 * Pure moduł: zero DOM. SILNIK (main.ts) zbiera kontekst blokad i woła
 * `buildAudienceActionsList`.
 */

import {
  audienceRestrictedActionLockNote,
  playerDiplomacyActionAllowed,
  type DiplomacyLayer,
} from './diplomacy-layers';
import {
  resolveDiplomacyActionLock,
  type DiplomacyActionLockContext,
} from './diplomacy-locks';

/** D3-Q4 poboczni + warstwa uproszczona — pokój, wojna, handel (szlaki+wymiana), NAP, wchłonięcie. */
export const AUDIENCE_BASIC_IDS: ReadonlySet<string> = new Set(['2', '5', '14', '10', '11', '15']);

export function diplomacyActionIdFromLabel(akcja: string): string {
  const m = /^(\d+)/.exec(akcja);
  return m ? m[1]! : akcja;
}

export interface AudienceActionBuilt {
  id: string;
  label: string;
  enabled: boolean;
  tooltip?: string;
  opis?: string;
  locked?: boolean;
  lockNote?: string;
  active?: boolean;
}

export interface BuildAudienceActionsOpts {
  akcje: ReadonlyArray<Record<string, string>>;
  ownerId: number;
  restrictToBasicActions: boolean;
  simplifiedOwners: ReadonlySet<number>;
  layer: DiplomacyLayer;
  lockCtxBase: Omit<DiplomacyActionLockContext, 'actionId'>;
}

/**
 * Pełny katalog z `akcje_dyplomatyczne` (bez id '1' — kontakt osobno).
 * Ograniczenia MP / uproszczona warstwa → `locked` + `lockNote`, NIE pomijanie wpisu.
 */
export function buildAudienceActionsList(opts: BuildAudienceActionsOpts): AudienceActionBuilt[] {
  const { akcje, ownerId, restrictToBasicActions, simplifiedOwners, layer, lockCtxBase } = opts;
  const out: AudienceActionBuilt[] = [];

  for (const row of akcje) {
    const raw = row['Akcja'] ?? '';
    const id = diplomacyActionIdFromLabel(raw);
    if (id === '1') continue;

    const label = raw.replace(/^\d+\.\s*/, '');
    let enabled = true;
    let tooltip = row['Opis'] ?? '';
    let locked: boolean | undefined;
    let lockNote: string | undefined;
    let active: boolean | undefined;

    if (restrictToBasicActions && !AUDIENCE_BASIC_IDS.has(id)) {
      locked = true;
      enabled = false;
      lockNote = audienceRestrictedActionLockNote(ownerId, simplifiedOwners);
      tooltip = lockNote;
    } else if (id === '11' && !playerDiplomacyActionAllowed(layer, 'war')) {
      locked = true;
      enabled = false;
      lockNote = 'Niedostępne';
      tooltip = lockNote;
    } else if ((id === '5' || id === '14') && !playerDiplomacyActionAllowed(layer, 'trade')) {
      locked = true;
      enabled = false;
      lockNote = 'Handel niedostępny';
      tooltip = lockNote;
    } else {
      const result = resolveDiplomacyActionLock({ actionId: id, ...lockCtxBase });
      locked = result.locked;
      enabled = !result.locked;
      lockNote = result.note || undefined;
      tooltip = result.note || tooltip;
      active = result.active;
    }

    out.push({ id, label, enabled, tooltip, opis: row['Opis'], locked, lockNote, active });
  }
  return out;
}

/** Stały wiersz powodu pod nazwą akcji w kolumnie „Możliwe umowy" (oś C). */
export function audienceActionStatusNote(
  action: Pick<AudienceActionBuilt, 'locked' | 'enabled' | 'lockNote' | 'tooltip' | 'active'>,
  onTable = false,
): string {
  if (onTable) return 'na stole — Przyjmij w PN';
  if (action.active) return 'już zawarta';
  if (action.locked || !action.enabled) {
    return action.lockNote || action.tooltip || 'Niedostępne';
  }
  return '';
}

/** Skrócony powód blokady pod ikoną paska szybkich akcji (oś C). */
export function audienceActionBarLockNote(
  action: Pick<AudienceActionBuilt, 'enabled' | 'lockNote' | 'tooltip' | 'locked'> | undefined,
): string {
  if (!action || action.enabled) return '';
  return action.lockNote || action.tooltip || 'Niedostępne';
}
