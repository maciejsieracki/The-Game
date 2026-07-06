/**
 * terrain-improvements.ts
 * Bonusy ulepszeń terenu → plony heksa (B1-Q11=A, 15 typów z terrain-improvements.json).
 * PURE — lane EKONOMIA.
 */
import improvementsJson from '../../data/terrain-improvements.json';
import { Nakladka } from '../types/hex';
import type { TileYield } from './economy';

export type ImprovementBonusKey =
  | 'zywnosc' | 'praca' | 'handel' | 'pieniadz' | 'drewno' | 'kamien';

export type ImprovementBonus = Partial<Record<ImprovementBonusKey, number>>;

type ImprovementRow = { bonus?: ImprovementBonus; nazwa?: string };

const IMPROVEMENTS = improvementsJson as Record<string, ImprovementRow>;

/** Legacy klucze przed kanonem żywność+hodowla (save / stary enum). */
const LEGACY_KEY_ALIASES: Readonly<Record<string, string>> = {
  pastwisko: 'bydlo',
};

/** Klucze z JSON (bez _meta). */
export const IMPROVEMENT_KEYS: readonly string[] = Object.keys(IMPROVEMENTS)
  .filter(k => !k.startsWith('_'));

export function normalizeImprovementKey(raw: string | undefined | null): string | undefined {
  if (!raw || raw === 'brak') return undefined;
  const key = LEGACY_KEY_ALIASES[raw] ?? raw;
  return IMPROVEMENTS[key]?.bonus !== undefined || IMPROVEMENTS[key]
    ? key
    : (IMPROVEMENTS[raw] ? raw : undefined);
}

export function improvementBonusForKey(key: string): ImprovementBonus {
  const row = IMPROVEMENTS[key];
  if (!row?.bonus) return {};
  return { ...row.bonus };
}

/**
 * Dodaje bonus ulepszenia do plonów heksa.
 * pieniadz z JSON → handel (TileYield nie ma osobnego pieniadz na polu).
 */
export function applyImprovementBonus(yld: TileYield, improvementKey: string | undefined): void {
  if (!improvementKey) return;
  const b = improvementBonusForKey(improvementKey);
  if (b.zywnosc) yld.zywnosc += b.zywnosc;
  if (b.praca)   yld.praca   += b.praca;
  if (b.handel)  yld.handel  += b.handel;
  if (b.pieniadz) yld.handel += b.pieniadz;
  if (b.drewno)  yld.drewno  += b.drewno;
  if (b.kamien)  yld.kamien  += b.kamien;
}

/** Suma bonusów wielu warstw ulepszeń na jednym heksie (kanon §3). */
export function applyImprovementBonuses(yld: TileYield, improvementKeys: readonly string[]): void {
  for (const key of improvementKeys) {
    applyImprovementBonus(yld, key);
  }
}

/** Złoże zwierzęce hodowlane na mapie = implicit warstwa ulepszenia (kanon Maciej 2026-06-26). */
export function foodLayerFromAnimalDeposit(nakladka?: Nakladka): string | null {
  if (nakladka === Nakladka.ZlozeBydla) return 'bydlo';
  if (nakladka === Nakladka.ZlozeOwiec) return 'owce';
  return null;
}

/**
 * Warstwy ulepszeń na heksie (jawnie postawione — ABC-18: złoże bez pastwiska nie daje plonów).
 */
export function improvementKeysForHex(
  hex: {
    ulepszenie?: unknown;
    ulepszenia?: readonly string[] | null;
    nakladka?: Nakladka;
  },
): string[] {
  if (hex.ulepszenia?.length) {
    const keys = hex.ulepszenia
      .map(k => normalizeImprovementKey(String(k)))
      .filter((k): k is string => !!k);
    return [...new Set(keys)];
  }
  const single = normalizeImprovementKey(String(hex.ulepszenie ?? 'brak'));
  return single ? [single] : [];
}

export function improvementDisplayName(key: string): string {
  return IMPROVEMENTS[key]?.nazwa ?? key;
}
