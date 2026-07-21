/**
 * power-objective.ts — obiektywny POWER imperium (Maciej 2026-06-26, kanon P-A).
 *
 * POWER = suma mierzalnych punktów (bez mnożnika epoki).
 * RESPEKT (dyplomacja) = computeRespekt(powerSelf, powerPartner) w diplomacy.ts.
 *
 * Współczynniki: gra/data/power-params.json
 */

import powerParams from '../../data/power-params.json';

export interface PowerCoefficients {
  jednostkaWojskowa: number;
  /** Legacy flat: pkt × liczba wygranych. P-C2-DEF A: używaj coeff=1 + bitwyPktSum. */
  wygranaBitwa: number;
  ludek: number;
  rekrutEkwJednostki: number;
  miasto: number;
  heksTerytorium: number;
  budynki: number;
  techZbadane: number;
  ulepszenieTerenu: number;
}

export interface EmpirePowerRaw {
  ownerId: number;
  /** Epoka imperium — informacyjnie; nie mnoży Power (P-B odrzucone). */
  epoka: number;
  jednostki: number;
  /** Legacy: liczba wygranych (flat × coeff). P-C2-DEF A: użyj bitwyPktSum zamiast tego. */
  wygraneBitwy: number;
  /** P-C2-DEF A — suma M_pole pokonanego składu (przed walką), bez bonusu underdog. */
  bitwyPktSum?: number;
  /** Suma slotów populacji (ludki) we wszystkich miastach. */
  sumaLudkow: number;
  /** Ekwiwalent jednostek z puli: floor(rekruci / koszt_werbu). Silnik liczy przed wywołaniem. */
  rekrutEkw: number;
  miasta: number;
  heksyTerytorium: number;
  budynki: number;
  techZbadane: number;
  ulepszeniaTerenu: number;
  /**
   * Follow-up „Power-zdobycze" (Maciej 2026-07-21): trwały bonus po ELIMINACJI wroga
   * — CAŁE Power pokonanego w chwili eliminacji, zsumowane (per zwycięzca), nie
   * znika przy buntach/utracie miast. Współczynnik zawsze 1 (wartość to już gotowe
   * punkty Power, nie surowy licznik) — patrz computeObjectivePower. Opcjonalne,
   * `?? 0` w computeObjectivePower dla wstecznej zgodności ze starymi callerami/testami.
   */
  zdobyczePower?: number;
}

export interface PowerComponentBreakdown {
  key: string;
  label: string;
  rawCount: number;
  coefficient: number;
  points: number;
}

export interface ObjectivePowerResult {
  ownerId: number;
  epoka: number;
  mnoznikEpoki: number;
  powerBase: number;
  power: number;
  components: PowerComponentBreakdown[];
}

type ParamsFile = {
  skladniki?: Record<string, { pkt?: number }>;
  mnoznikEpoki?: Record<string, number>;
  opcje?: Record<string, { wartosc?: string | boolean | number }>;
};

/** P-C2-DEF A (Maciej 2026-07-01): pkt z bitwy = suma M_pole wroga przed walką. */
export type BattlePowerModel = 'flat_count' | 'enemy_m_sum';

export function loadBattlePowerModel(raw: ParamsFile = powerParams as unknown as ParamsFile): BattlePowerModel {
  const v = raw.opcje?.bitwa_power_model?.wartosc;
  if (v === 'enemy_m_pre_battle' || v === 'enemy_m_sum') return 'enemy_m_sum';
  return 'flat_count';
}

/** Jedna wygrana — pkt do skumulowania (pure, bez main.ts). */
export function battlePowerPointsFromDefeatedEnemy(enemyFieldM: number): number {
  const m = Number.isFinite(enemyFieldM) ? enemyFieldM : 0;
  return Math.max(0, Math.floor(m));
}

const DEFAULT_COEFF: PowerCoefficients = {
  jednostkaWojskowa: 25,
  wygranaBitwa: 25,
  ludek: 5,
  rekrutEkwJednostki: 5,
  miasto: 50,
  heksTerytorium: 0.5,
  budynki: 5,
  techZbadane: 20,
  ulepszenieTerenu: 5,
};

export function loadPowerCoefficients(raw: ParamsFile = powerParams as unknown as ParamsFile): PowerCoefficients {
  const s = raw.skladniki ?? {};
  const n = (k: string, d: number) => {
    const v = s[k]?.pkt;
    return typeof v === 'number' && v >= 0 ? v : d;
  };
  return {
    jednostkaWojskowa: n('jednostka_wojskowa', DEFAULT_COEFF.jednostkaWojskowa),
    wygranaBitwa: n('wygrana_bitwa', DEFAULT_COEFF.wygranaBitwa),
    ludek: n('ludek', DEFAULT_COEFF.ludek),
    rekrutEkwJednostki: n('rekrut_ekw_jednostki', DEFAULT_COEFF.rekrutEkwJednostki),
    miasto: n('miasto', DEFAULT_COEFF.miasto),
    heksTerytorium: n('heks_terytorium', DEFAULT_COEFF.heksTerytorium),
    budynki: n('budynki', DEFAULT_COEFF.budynki),
    techZbadane: n('tech_zbadane', DEFAULT_COEFF.techZbadane),
    ulepszenieTerenu: n('ulepszenie_terenu', DEFAULT_COEFF.ulepszenieTerenu),
  };
}

/** P-B odrzucone — zawsze 1 (mnożnik epoki nie wpływa na Power). */
export function epokaPowerMultiplier(_epoka?: number): number {
  return 1;
}

function row(
  key: string,
  label: string,
  rawCount: number,
  coefficient: number,
): PowerComponentBreakdown {
  const points = rawCount * coefficient;
  return { key, label, rawCount, coefficient, points };
}

/**
 * Oblicza obiektywny POWER imperium (pure).
 * @param input — surowe liczniki z silnika
 * @param coeff — opcjonalne nadpisanie współczynników (testy / Panel-B)
 */
export function computeObjectivePower(
  input: EmpirePowerRaw,
  coeff: PowerCoefficients = loadPowerCoefficients(),
  battleModel: BattlePowerModel = loadBattlePowerModel(),
): ObjectivePowerResult {
  const bitwyRaw = battleModel === 'enemy_m_sum'
    ? Math.max(0, input.bitwyPktSum ?? 0)
    : Math.max(0, input.wygraneBitwy);
  const bitwyCoeff = battleModel === 'enemy_m_sum' ? 1 : coeff.wygranaBitwa;

  const components: PowerComponentBreakdown[] = [
    row('armia', 'Armia', Math.max(0, input.jednostki), coeff.jednostkaWojskowa),
    row('bitwy', 'Wygrane bitwy', bitwyRaw, bitwyCoeff),
    row('ludki', 'Obywatele', Math.max(0, input.sumaLudkow), coeff.ludek),
    row('rekruci', 'Rekruci (ekw. jedn.)', Math.max(0, input.rekrutEkw), coeff.rekrutEkwJednostki),
    row('miasta', 'Miasta', Math.max(0, input.miasta), coeff.miasto),
    row('terytorium', 'Terytorium (heksy)', Math.max(0, input.heksyTerytorium), coeff.heksTerytorium),
    row('infra', 'Infrastruktura (budynki)', Math.max(0, input.budynki), coeff.budynki),
    row('tech', 'Odkrycia / tech', Math.max(0, input.techZbadane), coeff.techZbadane),
    row('ulepszenia', 'Ulepszenia terenu', Math.max(0, input.ulepszeniaTerenu), coeff.ulepszenieTerenu),
    // Follow-up „Power-zdobycze": wartość to już punkty (nie surowy licznik) -> coeff=1 stały.
    row('zdobycze', 'Zdobycze (eliminacje)', Math.max(0, input.zdobyczePower ?? 0), 1),
  ];

  const powerBase = components.reduce((s, c) => s + c.points, 0);
  const mnoznikEpoki = 1;
  const power = Math.round(powerBase);

  return {
    ownerId: input.ownerId,
    epoka: input.epoka,
    mnoznikEpoki,
    powerBase,
    power,
    components,
  };
}

/** Etykieta pomocnicza dla UI — surowe liczniki per składnik. */
export function formatPowerComponentCount(c: PowerComponentBreakdown): string {
  if (c.key === 'rekruci') return `${c.rawCount} ekw.`;
  if (c.key === 'terytorium') return `${c.rawCount} heks.`;
  return String(c.rawCount);
}
