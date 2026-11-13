/**
 * R-WEB-AI-ARMY-COMPOSITION-PER-CIV-Q1 — program składu armii AI per cywilizacja.
 *
 * Czysty moduł (jedyny import: epochNumber z production.ts): klasyfikacja jednostek w trzy klasy
 * (wręcz / dystans / konnica+rydwany), wczytanie celu składu z parametrów AI
 * (`sklad_armii_<civ>_{wrecz,dystans,konnica}` w ai-params.json), liczenie
 * składu armii i wybór klasy najbardziej niedoreprezentowanej względem celu.
 *
 * Reguły (dispatch, tabela zatwierdzona przez właściciela):
 *  - suma celu = 100, wręcz >= 50 (inaczej cel jest NIEWAŻNY -> zachowanie legacy);
 *  - brak dostępu do klasy (tech/epoka/surowiec/limit) NIE blokuje rekrutacji:
 *    brakujący udział przechodzi na wręcz;
 *  - machiny oblężnicze, cywile (zwiadowca) i okręty są poza procentami.
 */

import { epochNumber } from './production';

export type ArmyClass = 'wrecz' | 'dystans' | 'konnica';

export const ARMY_CLASSES: readonly ArmyClass[] = ['wrecz', 'dystans', 'konnica'];

/** Minimalny udział jednostek wręcz dla KAŻDEJ cywilizacji (%). */
export const ARMY_MIN_MELEE_PCT = 50;

export type ArmyCompositionTarget = Record<ArmyClass, number>;

export type ArmyClassCounts = Record<ArmyClass, number>;

/** Minimalny kształt definicji jednostki potrzebny temu modułowi (UnitDef jest nadzbiorem). */
export interface CompositionUnitDef {
  Jednostka: string;
  Typ?: string | null;
  Epoka?: unknown;
  Klasa?: string | null;
  Nacja?: string | null;
  fieldPower?: number | null;
  'Super-jednostka'?: string | null;
  'Pieniądz (koszt)'?: number | null;
}

/** Typ (units.json) -> klasa składu. Siege / Civilian / Naval / nieznane -> null (poza procentami). */
export function armyClassOfTyp(typ: string | null | undefined): ArmyClass | null {
  switch ((typ ?? '').trim()) {
    case 'Swordsman':
    case 'Spearman':
    case 'Falangite':
    case 'Offensive':
      return 'wrecz';
    case 'Distance':
    case 'Slinger':
      return 'dystans';
    case 'Mount': // konnica i rydwany liczone razem
      return 'konnica';
    default:
      return null;
  }
}

export function armyClassOfUnit(def: { Typ?: string | null } | null | undefined): ArmyClass | null {
  return def ? armyClassOfTyp(def.Typ) : null;
}

/** Klucze parametrów AI dla danej cywilizacji (civ = ikonaId, np. 'inkowie'). */
export function armyCompositionParamKeys(civKey: string): Record<ArmyClass, string> {
  return {
    wrecz: `sklad_armii_${civKey}_wrecz`,
    dystans: `sklad_armii_${civKey}_dystans`,
    konnica: `sklad_armii_${civKey}_konnica`,
  };
}

/** Walidacja celu: skończone liczby >= 0, suma 100, wręcz >= 50. */
export function isValidArmyCompositionTarget(t: ArmyCompositionTarget | null | undefined): t is ArmyCompositionTarget {
  if (!t) return false;
  for (const c of ARMY_CLASSES) {
    if (typeof t[c] !== 'number' || !Number.isFinite(t[c]) || t[c] < 0) return false;
  }
  if (Math.abs(t.wrecz + t.dystans + t.konnica - 100) > 1e-9) return false;
  return t.wrecz >= ARMY_MIN_MELEE_PCT;
}

/**
 * Wczytuje cel składu. `readParam` zwraca wartość liczbową lub undefined gdy brak.
 * Brak któregokolwiek pola albo cel niepoprawny -> null (wołający zostaje przy zachowaniu legacy).
 */
export function loadArmyCompositionTarget(
  civKey: string | undefined | null,
  readParam: (key: string) => number | undefined,
): ArmyCompositionTarget | null {
  if (!civKey) return null;
  const keys = armyCompositionParamKeys(civKey);
  const w = readParam(keys.wrecz);
  const d = readParam(keys.dystans);
  const k = readParam(keys.konnica);
  if (w === undefined || d === undefined || k === undefined) return null;
  const target: ArmyCompositionTarget = { wrecz: Number(w), dystans: Number(d), konnica: Number(k) };
  return isValidArmyCompositionTarget(target) ? target : null;
}

/** Liczy skład: jednostki na mapie + jednostki już opłacone w kolejkach + zakupy z tej tury. */
export function countArmyClasses(
  unitTypeIds: Iterable<string>,
  defsByName: ReadonlyMap<string, CompositionUnitDef>,
): ArmyClassCounts {
  const counts: ArmyClassCounts = { wrecz: 0, dystans: 0, konnica: 0 };
  for (const id of unitTypeIds) {
    const cls = armyClassOfUnit(defsByName.get(id));
    if (cls) counts[cls] += 1;
  }
  return counts;
}

/**
 * Kolejność klas do rekrutacji: pierwsza = najbardziej niedoreprezentowana względem celu
 * (deficyt = cel% * (N+1) - liczba), potem pozostałe malejąco po deficycie; remis -> wręcz pierwsza.
 * Klasy niedostępne (`available[c] === false`) oddają swój cel klasie wręcz. Klasy z celem 0
 * nigdy nie są wybierane jako pierwsze (Inkowie: 0 konnicy).
 * Zwraca WYŁĄCZNIE klasy dostępne z celem > 0 (wręcz zawsze, jeśli dostępna).
 */
export function orderArmyClassesByDeficit(
  target: ArmyCompositionTarget,
  counts: ArmyClassCounts,
  available: Record<ArmyClass, boolean>,
): ArmyClass[] {
  const eff: ArmyCompositionTarget = { wrecz: target.wrecz, dystans: target.dystans, konnica: target.konnica };
  for (const c of ['dystans', 'konnica'] as const) {
    if (!available[c]) {
      eff.wrecz += eff[c];
      eff[c] = 0;
    }
  }
  const total = counts.wrecz + counts.dystans + counts.konnica;
  const deficit = (c: ArmyClass): number => (eff[c] / 100) * (total + 1) - counts[c];
  const order: ArmyClass[] = [];
  for (const c of ARMY_CLASSES) {
    if (eff[c] > 0 && (available[c] || c === 'wrecz')) order.push(c);
  }
  order.sort((a, b) => {
    const diff = deficit(b) - deficit(a);
    if (Math.abs(diff) > 1e-9) return diff;
    return ARMY_CLASSES.indexOf(a) - ARMY_CLASSES.indexOf(b);
  });
  return order;
}

function epochRank(epoka: unknown): number {
  return epochNumber(epoka == null ? null : String(epoka));
}

/**
 * Najlepsza jednostka klasy spośród DOSTĘPNYCH (już przefiltrowanych przez tech/epokę/limity):
 * najnowsza epoka -> jednostka specjalna cywilizacji (Klasa 'Specjalna' z Nacją) -> większa
 * fieldPower -> tańsza -> nazwa. Super-jednostki (limit 1, osobna logika) są pomijane.
 */
export function bestUnitForArmyClass(
  cls: ArmyClass,
  allowed: readonly CompositionUnitDef[],
): CompositionUnitDef | null {
  let best: CompositionUnitDef | null = null;
  const key = (u: CompositionUnitDef): [number, number, number, number] => [
    epochRank(u.Epoka),
    (u.Klasa ?? '').trim() === 'Specjalna' && (u.Nacja ?? '').toString().trim() !== '' ? 1 : 0,
    Number(u.fieldPower ?? 0),
    -Number(u['Pieniądz (koszt)'] ?? 0),
  ];
  for (const u of allowed) {
    if (armyClassOfUnit(u) !== cls) continue;
    if ((u.Klasa ?? '').trim() === 'Super' || (u['Super-jednostka'] ?? '').toString().trim() === 'TAK') continue;
    if (best === null) { best = u; continue; }
    const a = key(u);
    const b = key(best);
    let better = false;
    for (let i = 0; i < a.length; i++) {
      if (a[i]! !== b[i]!) { better = a[i]! > b[i]!; break; }
      if (i === a.length - 1) better = u.Jednostka < best.Jednostka;
    }
    if (better) best = u;
  }
  return best;
}

/**
 * Łańcuch id jednostek do rekrutacji w kolejności prób: [klasa o największym deficycie,
 * wręcz (brak dostępu/surowca -> wręcz), pozostałe klasy wg deficytu]. Bez duplikatów.
 */
export function planCompositionRecruitChain(
  target: ArmyCompositionTarget,
  counts: ArmyClassCounts,
  allowed: readonly CompositionUnitDef[],
): string[] {
  const best: Partial<Record<ArmyClass, CompositionUnitDef>> = {};
  for (const c of ARMY_CLASSES) {
    const u = bestUnitForArmyClass(c, allowed);
    if (u) best[c] = u;
  }
  const available: Record<ArmyClass, boolean> = {
    wrecz: !!best.wrecz, dystans: !!best.dystans, konnica: !!best.konnica,
  };
  const order = orderArmyClassesByDeficit(target, counts, available);
  const chainClasses: ArmyClass[] = [];
  if (order.length > 0) chainClasses.push(order[0]!);
  if (available.wrecz) chainClasses.push('wrecz');
  for (const c of order) chainClasses.push(c);
  const ids: string[] = [];
  for (const c of chainClasses) {
    const u = best[c];
    if (u && !ids.includes(u.Jednostka)) ids.push(u.Jednostka);
  }
  return ids;
}
