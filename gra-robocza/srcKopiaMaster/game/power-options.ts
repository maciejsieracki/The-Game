/**
 * power-options.ts — opcje Moc/Power z power-params.json (Panel-B → Potega-opcje).
 */

import powerParams from '../../data/power-params.json';

export interface PowerOpcje {
  liczyOsadnikWArmii: boolean;
  bitwaWspolczynnikFlat: boolean;
  mnoznikEpokiAktywny: boolean;
  hudEtykietaPl: string;
  hudEtykietaEn: string;
}

type OpcjeFile = {
  opcje?: Record<string, { wartosc?: unknown; typ?: string }>;
};

const DEFAULT: PowerOpcje = {
  liczyOsadnikWArmii: true,
  bitwaWspolczynnikFlat: true,
  mnoznikEpokiAktywny: false,
  hudEtykietaPl: 'Moc',
  hudEtykietaEn: 'Power',
};

function readBool(v: unknown, d: boolean): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['tak', 'true', '1', 'prawda'].includes(v.trim().toLowerCase());
  if (typeof v === 'number') return v !== 0;
  return d;
}

function readStr(v: unknown, d: string): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return d;
}

export function loadPowerOpcje(raw: OpcjeFile = powerParams as OpcjeFile): PowerOpcje {
  const o = raw.opcje ?? {};
  return {
    liczyOsadnikWArmii: readBool(o.liczy_osadnik_w_armii?.wartosc, DEFAULT.liczyOsadnikWArmii),
    bitwaWspolczynnikFlat: readBool(o.bitwa_wspolczynnik_flat?.wartosc, DEFAULT.bitwaWspolczynnikFlat),
    mnoznikEpokiAktywny: readBool(o.mnoznik_epoki_aktywny?.wartosc, DEFAULT.mnoznikEpokiAktywny),
    hudEtykietaPl: readStr(o.hud_etykieta?.wartosc, DEFAULT.hudEtykietaPl),
    hudEtykietaEn: readStr(o.hud_etykieta_en?.wartosc, DEFAULT.hudEtykietaEn),
  };
}

export interface UnitForPowerCount {
  ownerId: number;
  category?: string;
}

/** Liczba jednostek w składniku Armia (P-C1: opcjonalnie bez osadnika). */
export function countUnitsForPowerArmy(
  units: ReadonlyArray<UnitForPowerCount>,
  ownerId: number,
  opcje: PowerOpcje = loadPowerOpcje(),
): number {
  let n = 0;
  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    if (!opcje.liczyOsadnikWArmii && u.category === 'osadnik') continue;
    n++;
  }
  return n;
}
