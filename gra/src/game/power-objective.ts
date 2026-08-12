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
  kulturaImperium: number;
  religiaJednosc: number;
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
  /** KULT-04 A — suma kulturaSkumulowana imperium. */
  kulturaImperium?: number;
  /** KULT-04 A — liczba miast z dominującą wiarą państwa. */
  miastaJednoscReligii?: number;
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
  /**
   * P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): true wyłącznie dla Armii i Rekrutów — źródło
   * prawdy to `skladniki.<klucz>.wojskowy` w power-params.json (patrz loadMilitaryComponentKeys),
   * reszta domyślnie false. Karmi przełącznik widoku Moc całkowita/gospodarcza/militarna w
   * Rankingu Mocy (filtruje TĘ SAMĄ listę components, nie osobny silnik liczenia).
   * / EN: true only for Army and Recruits — source of truth is `skladniki.<key>.wojskowy` in
   * power-params.json (see loadMilitaryComponentKeys), everything else defaults false. Feeds the
   * Total/Economic/Military Power ranking view toggle (filters this SAME components list, no
   * separate calculation engine).
   */
  military: boolean;
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
  skladniki?: Record<string, { pkt?: number; wojskowy?: boolean }>;
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

/**
 * P-MOC-BALANS-WAGI (Maciej 2026-08-12): fallback musi zostać SPÓJNY z power-params.json
 * (wzorzec tego pliku — patrz loadPowerCoefficients niżej). Zmienione: jednostkaWojskowa
 * 25→2.5 (÷10), rekrutEkwJednostki 5→10 (×2), techZbadane 20→80 (×4), heksTerytorium
 * 0.5→1.0 (×2). wygranaBitwa (25) NIE zmienione tutaj — to fallback dormant pola JSON
 * `wygrana_bitwa.pkt`, używane tylko w nieaktywnej dziś ścieżce flat_count; aktywny
 * współczynnik bitwy (i „zdobycze") to hardcoded stałe w computeObjectivePower niżej
 * (bitwyCoeff, coeff „zdobycze"), 1→2 tą samą decyzją — patrz tam.
 * / EN: fallback must stay CONSISTENT with power-params.json (this file's own pattern —
 * see loadPowerCoefficients below). Changed: jednostkaWojskowa 25→2.5 (÷10),
 * rekrutEkwJednostki 5→10 (×2), techZbadane 20→80 (×4), heksTerytorium 0.5→1.0 (×2).
 * wygranaBitwa (25) NOT changed here — it is the fallback for the dormant JSON
 * `wygrana_bitwa.pkt` field, only used on the inactive flat_count path; the active battle
 * coefficient (and "zdobycze") are hardcoded constants in computeObjectivePower below
 * (bitwyCoeff, "zdobycze" coeff), 1→2 by the same decision — see there.
 */
const DEFAULT_COEFF: PowerCoefficients = {
  jednostkaWojskowa: 2.5,
  wygranaBitwa: 25,
  ludek: 5,
  rekrutEkwJednostki: 10,
  miasto: 50,
  heksTerytorium: 1.0,
  budynki: 5,
  techZbadane: 80,
  ulepszenieTerenu: 5,
  kulturaImperium: 0.5,
  religiaJednosc: 25,
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
    kulturaImperium: n('kultura_imperium', DEFAULT_COEFF.kulturaImperium),
    religiaJednosc: n('religia_jednosc', DEFAULT_COEFF.religiaJednosc),
  };
}

/** P-B odrzucone — zawsze 1 (mnożnik epoki nie wpływa na Power). */
export function epokaPowerMultiplier(_epoka?: number): number {
  return 1;
}

/**
 * P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): mapowanie breakdown.key (skrócone identyfikatory
 * używane w PowerComponentBreakdown/ObjectivePowerResult.components) -> klucz JSON w
 * power-params.json::skladniki. „zdobycze" nie ma odpowiednika w JSON (coeff hardcoded w
 * computeObjectivePower, patrz niżej) -> zawsze traktowane jako niewojskowe (brak wpisu w
 * mapie = false w loadMilitaryComponentKeys).
 * / EN: maps breakdown.key (short ids used in PowerComponentBreakdown/ObjectivePowerResult.
 * components) -> the JSON key in power-params.json::skladniki. "zdobycze" has no JSON
 * counterpart (its coeff is hardcoded in computeObjectivePower, see below) -> always
 * non-military (missing map entry = false in loadMilitaryComponentKeys).
 */
const SKLADNIK_KEY_BY_COMPONENT: Record<string, string> = {
  armia: 'jednostka_wojskowa',
  bitwy: 'wygrana_bitwa',
  ludki: 'ludek',
  rekruci: 'rekrut_ekw_jednostki',
  miasta: 'miasto',
  terytorium: 'heks_terytorium',
  infra: 'budynki',
  tech: 'tech_zbadane',
  ulepszenia: 'ulepszenie_terenu',
  kultura: 'kultura_imperium',
  religia: 'religia_jednosc',
};

/**
 * P-MOC-PODZIAL-WIDOK (Maciej 2026-08-12): zbiór breakdown-key'y oznaczonych `wojskowy: true`
 * w power-params.json (dziś: Armia + Rekruci). Karmi filtr widoku Moc całkowita/gospodarcza/
 * militarna w Rankingu Mocy (`PowerComponentBreakdown.military`) — JSON jest źródłem prawdy,
 * tak jak dla `pkt`.
 * / EN: set of breakdown-keys tagged `wojskowy: true` in power-params.json (today: Army +
 * Recruits). Feeds the Total/Economic/Military ranking view filter (`PowerComponentBreakdown.
 * military`) — JSON is the source of truth, same as for `pkt`.
 */
export function loadMilitaryComponentKeys(raw: ParamsFile = powerParams as unknown as ParamsFile): Set<string> {
  const s = raw.skladniki ?? {};
  const out = new Set<string>();
  for (const [componentKey, jsonKey] of Object.entries(SKLADNIK_KEY_BY_COMPONENT)) {
    if (s[jsonKey]?.wojskowy === true) out.add(componentKey);
  }
  return out;
}

function row(
  key: string,
  label: string,
  rawCount: number,
  coefficient: number,
  military: boolean,
): PowerComponentBreakdown {
  const points = rawCount * coefficient;
  return { key, label, rawCount, coefficient, points, military };
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
  militaryKeys: Set<string> = loadMilitaryComponentKeys(),
): ObjectivePowerResult {
  const bitwyRaw = battleModel === 'enemy_m_sum'
    ? Math.max(0, input.bitwyPktSum ?? 0)
    : Math.max(0, input.wygraneBitwy);
  // P-MOC-BALANS-WAGI (Maciej 2026-08-12): "Wygrane bitwy (dziś wsp. 1) → razy dwa" — jego "1"
  // opisuje TEN hardcoded coeff aktywnej ścieżki enemy_m_sum (nie dormant JSON `wygrana_bitwa.
  // pkt`=25, patrz komentarz przy DEFAULT_COEFF) -> 1 → 2.
  // / EN: "Wygrane bitwy (currently coeff 1) → times two" — his "1" describes THIS hardcoded
  // coeff on the active enemy_m_sum path (not the dormant JSON `wygrana_bitwa.pkt`=25, see the
  // DEFAULT_COEFF comment) -> 1 → 2.
  const bitwyCoeff = battleModel === 'enemy_m_sum' ? 2 : coeff.wygranaBitwa;

  const components: PowerComponentBreakdown[] = [
    row('armia', 'Armia', Math.max(0, input.jednostki), coeff.jednostkaWojskowa, militaryKeys.has('armia')),
    row('bitwy', 'Wygrane bitwy', bitwyRaw, bitwyCoeff, militaryKeys.has('bitwy')),
    row('ludki', 'Obywatele', Math.max(0, input.sumaLudkow), coeff.ludek, militaryKeys.has('ludki')),
    row('rekruci', 'Rekruci (ekw. jedn.)', Math.max(0, input.rekrutEkw), coeff.rekrutEkwJednostki, militaryKeys.has('rekruci')),
    row('miasta', 'Miasta', Math.max(0, input.miasta), coeff.miasto, militaryKeys.has('miasta')),
    row('terytorium', 'Terytorium (heksy)', Math.max(0, input.heksyTerytorium), coeff.heksTerytorium, militaryKeys.has('terytorium')),
    row('infra', 'Infrastruktura (budynki)', Math.max(0, input.budynki), coeff.budynki, militaryKeys.has('infra')),
    row('tech', 'Odkrycia / tech', Math.max(0, input.techZbadane), coeff.techZbadane, militaryKeys.has('tech')),
    row('ulepszenia', 'Ulepszenia terenu', Math.max(0, input.ulepszeniaTerenu), coeff.ulepszenieTerenu, militaryKeys.has('ulepszenia')),
    row('kultura', 'Kultura imperium', Math.max(0, input.kulturaImperium ?? 0), coeff.kulturaImperium, militaryKeys.has('kultura')),
    row('religia', 'Jedność religii (miasta)', Math.max(0, input.miastaJednoscReligii ?? 0), coeff.religiaJednosc, militaryKeys.has('religia')),
    // Follow-up „Power-zdobycze": wartość to już punkty (nie surowy licznik) -> coeff stały,
    // niewojskowe (P-MOC-PODZIAL-WIDOK: brak wpisu w JSON = gospodarcze). P-MOC-BALANS-WAGI
    // (Maciej 2026-08-12): "Zdobycze (dziś wsp. 1) → razy dwa" -> coeff 1 → 2.
    // / EN: value is already points (not a raw count) -> fixed coeff, non-military (no JSON
    // entry = economic). P-MOC-BALANS-WAGI: coeff 1 → 2.
    row('zdobycze', 'Zdobycze (eliminacje)', Math.max(0, input.zdobyczePower ?? 0), 2, false),
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
