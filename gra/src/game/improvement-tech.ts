/**
 * improvement-tech.ts — tech gate ulepszeń terenu + logika wycinki lasu (wyrąb).
 * Decyzja Maciej B1-Q1=B (2026-06-29): źródło prawdy bramki = terrain-improvements.json (tech 1:1).
 */
import terrainJson from '../../data/terrain-improvements.json';

export type ImprovementActionTyp = 'wycinka' | 'ulepszenie';

export interface ClearingParams {
  pracaPerTura: number;
  tury: number;
}

export interface ImprovementMeta {
  key: string;
  nazwa: string;
  epoka: number;
  kosztPraca: number;
  /** null = bez wymaganej technologii (wyrąb). */
  techId: string | null;
  typ: ImprovementActionTyp;
  clearing?: ClearingParams;
}

type JsonRow = {
  nazwa?: string;
  epoka?: number;
  koszt_praca?: number;
  tech?: string | null;
  typ?: ImprovementActionTyp;
  wycinka?: { praca_per_tura?: number; tury?: number };
};

const RAW = terrainJson as unknown as Record<string, JsonRow>;

/** Tech z JSON → kanoniczna nazwa z tech.json (aliasy legacy). B1-Q2A 2026-06-29: Rolnictwo/Łowiectwo 1:1. */
export const TECH_CANONICAL: Record<string, string> = {
  'Irygacja':         'Gospodarka wodna',
  'Kalendarz':        'Matematyka',
  '-':                '',
  '':                 '',
};

/** Ulepszenia wymagające AND wielu tech (T-TECH-3 Maciej 2026-06-26). */
export const IMPROVEMENT_MULTI_TECH_REQ: Readonly<Record<string, readonly string[]>> = {
  posterunek: ['Obróbka drewna', 'Murarstwo'],
};

const EPOKA_LABEL: Record<number, string> = {
  1: 'Kamień',
  2: 'Brąz',
  3: 'Żelazo',
};

/** Tekst podglądu wymagań gdy ulepszenie zablokowane (B1-Q3 UX Maciej 2026-06-29). */
export function getImprovementLockHint(
  key: string,
  researched: ReadonlySet<string> | readonly string[],
): string | null {
  const meta = readMeta(key);
  if (!meta) return null;
  if (isImprovementTechUnlocked(key, researched)) return null;

  const parts: string[] = [];
  const multi = IMPROVEMENT_MULTI_TECH_REQ[key];
  if (multi?.length) {
    parts.push('Technologie: «' + multi.join('» + «') + '»');
  } else if (meta.techId) {
    parts.push('Technologia: «' + meta.techId + '»');
  } else if (meta.epoka > 1) {
    parts.push('Epoka min.: ' + (EPOKA_LABEL[meta.epoka] ?? ('' + meta.epoka)));
  }
  if (meta.kosztPraca > 0) {
    parts.push('Koszt: ' + meta.kosztPraca + ' Pracy');
  } else if (meta.typ === 'wycinka') {
    if (meta.kosztPraca > 0) {
      parts.push('Koszt startu: ' + meta.kosztPraca + ' Pracy');
    }
    parts.push('Wycinka ' + (meta.clearing?.tury ?? 3) + ' tury (+' + (meta.clearing?.pracaPerTura ?? 20) + ' Drewna/turę)');
  }
  return parts.length > 0 ? parts.join(' · ') : 'Wymagania nieznane';
}

function normalizeTech(raw: string | null | undefined): string | null {
  if (raw == null || raw === '-' || raw === '') return null;
  return TECH_CANONICAL[raw] ?? raw;
}

function readMeta(key: string): ImprovementMeta | null {
  if (key.startsWith('_')) return null;
  const row = RAW[key];
  if (!row) return null;
  const typ: ImprovementActionTyp = row.typ ?? 'ulepszenie';
  const clearing = row.wycinka
    ? {
        pracaPerTura: row.wycinka.praca_per_tura ?? 20,
        tury: row.wycinka.tury ?? 3,
      }
    : undefined;
  return {
    key,
    nazwa: row.nazwa ?? key,
    epoka: row.epoka ?? 1,
    kosztPraca: row.koszt_praca ?? 0,
    techId: normalizeTech(row.tech ?? null),
    typ,
    clearing,
  };
}

/** Wszystkie klucze ulepszeń (bez _meta). */
export function improvementMetaKeys(): string[] {
  return Object.keys(RAW).filter(k => !k.startsWith('_'));
}

export function getImprovementMeta(key: string): ImprovementMeta | null {
  return readMeta(key);
}

function requiredTechIds(key: string, meta: ImprovementMeta): readonly string[] | null {
  const multi = IMPROVEMENT_MULTI_TECH_REQ[key];
  if (multi?.length) return multi;
  if (meta.techId) return [meta.techId];
  return null;
}

/** Nazwy ulepszeń terenu odblokowywanych przez daną tech (do drzewka nauki). */
export function terrainUnlockLabelsForTech(techName: string): string[] {
  const out: string[] = [];
  for (const key of improvementMetaKeys()) {
    const meta = readMeta(key);
    if (!meta) continue;
    const req = requiredTechIds(key, meta);
    if (req?.includes(techName)) out.push(meta.nazwa);
  }
  return out;
}

export function isImprovementTechUnlocked(
  key: string,
  researched: ReadonlySet<string> | readonly string[],
): boolean {
  const meta = readMeta(key);
  if (!meta) return false;
  const req = requiredTechIds(key, meta);
  if (!req) return true;
  const set = researched instanceof Set ? researched : new Set(researched);
  return req.every(t => set.has(t));
}

export function clearingTotalPraca(key: string): number {
  const m = readMeta(key);
  if (!m?.clearing) return 0;
  return m.clearing.pracaPerTura * m.clearing.tury;
}

/** Stan wycinki na heksie (SILNIK trzyma Map hexKey → state). */
export interface HexClearingState {
  turnsLeft: number;
  pracaPerTurn: number;
  ownerId: number;
}

export function freshClearingState(key: string, ownerId: number): HexClearingState | null {
  const m = readMeta(key);
  if (m?.typ !== 'wycinka' || !m.clearing) return null;
  return {
    turnsLeft: m.clearing.tury,
    pracaPerTurn: m.clearing.pracaPerTura,
    ownerId,
  };
}

/** Tick końca tury — zwraca przyznawaną Pracę (0 gdy skończone). */
export function tickHexClearing(state: HexClearingState): { pracaGrant: number; expired: boolean } {
  if (state.turnsLeft <= 0) return { pracaGrant: 0, expired: true };
  const pracaGrant = state.pracaPerTurn;
  state.turnsLeft -= 1;
  return { pracaGrant, expired: state.turnsLeft <= 0 };
}
