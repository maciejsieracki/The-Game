/**
 * diplomacy-deposit-trade.ts — cennik dostępu do złoża (handel dyplomatyczny v1).
 * Maciej 2026-06-30: ceny bazowe w PN (¤ = Praca przy Rel 100); kurs Rel/100.
 */
import diplomacyJson from '../../data/diplomacy.json';

/** Bazowe ceny dostępu do jednego złoża (¤ = Praca @ Relacja 100). Panel-D / diplomacy.json. */
export const HANDEL_ZLOZE_CENA_BAZA: Readonly<Record<string, number>> = Object.freeze({
  glina: 50,
  sol: 50,
  konie: 100,
  wegiel: 100,
  miedz: 120,
  zelazo: 150,
});

export const HANDEL_KURS_RELACJA_BAZA = 100;

type HandelZlozeBlock = { cena_baza?: Record<string, number>; kurs_relacja_baza?: number };

function loadHandelZlozeFromJson(): {
  cena: Record<string, number>;
  kursBaza: number;
} {
  const block = (diplomacyJson as { handel_zloze?: HandelZlozeBlock }).handel_zloze;
  const cena = { ...HANDEL_ZLOZE_CENA_BAZA };
  if (block?.cena_baza && typeof block.cena_baza === 'object') {
    for (const [k, v] of Object.entries(block.cena_baza)) {
      if (typeof v === 'number' && Number.isFinite(v)) cena[k] = v;
    }
  }
  const kursBaza =
    typeof block?.kurs_relacja_baza === 'number' && block.kurs_relacja_baza > 0
      ? block.kurs_relacja_baza
      : HANDEL_KURS_RELACJA_BAZA;
  return { cena, kursBaza };
}

const _loaded = loadHandelZlozeFromJson();

/** Efektywna cena (¤ lub Praca) za dostęp do złoża przy danej Relacji. */
export function diplomacyDepositEffectivePrice(
  zlozeId: string,
  relacja: number,
  cenaBaza: Record<string, number> = _loaded.cena,
  kursRelacjaBaza: number = _loaded.kursBaza,
): number | null {
  const base = cenaBaza[zlozeId.trim().toLowerCase()];
  if (base == null || !Number.isFinite(base)) return null;
  const rel = Math.max(1, relacja);
  return Math.ceil(base * (kursRelacjaBaza / rel));
}

/** Barter złoże↔złoże: wymagana wartość oddana (PN) po kursie Relacji. */
export function diplomacyDepositBarterRequiredValue(
  targetValue: number,
  relacja: number,
  kursRelacjaBaza: number = _loaded.kursBaza,
): number {
  const rel = Math.max(1, relacja);
  return Math.ceil(targetValue * (kursRelacjaBaza / rel));
}

export function diplomacyDepositBasePrice(zlozeId: string): number | null {
  const v = _loaded.cena[zlozeId.trim().toLowerCase()];
  return v != null && Number.isFinite(v) ? v : null;
}
