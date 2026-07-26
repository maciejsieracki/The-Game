import type { CivBonusEntry } from './civ-bonuses';
import { applyMultiplier, civCombatStatMultipliers } from './civ-bonuses';
import type { BuildingCombatBonus } from './unit-building-bonuses';
import { mergeBuildingBonusIntoStatMultipliers } from './unit-building-bonuses';
import { applyVeteranFracToCombatUnit } from './veteran';
import combatParamsRaw from '../../data/combat-params.json';

/** Panel-C: stałe walki (export-c.py → combat-params.json). */
const TW = combatParamsRaw.tw_v3;
const COUNTER_MULT = combatParamsRaw.counter_multiplier;

/**
 * combat.ts
 * PURE combat resolver for The Game (4X Civ-style).
 *
 * Canon: SS5l "KANONICZNY MODEL WALKI" in PROJEKT-GRY-master.md.
 * All functions are deterministic given the same rng(); no global state.
 *
 * ASCII-only source file.
 */

// ---------------------------------------------------------------------------
// Data-shape mirrors for JSON data files
// ---------------------------------------------------------------------------

/**
 * A single entry from data/counters.json.
 * Counter bonuses apply +50% to the favoured attacker's damage.
 */
export interface CounterEntry {
  'Typ atakujacy': string;
  'Cel (typ)': string;
  'Bonus': string;
  'Rodzaj (Atak/Obrona)': string;
  'Status': string;
}

/**
 * A single entry from data/terrain-combat.json.
 */
export interface TerrainEntry {
  'Teren': string;
  'Bonus Obrona': string;
  'Delta Zasieg (dystansowi)': string;
  'Efekt specjalny': string;
}

// ---------------------------------------------------------------------------
// Combat-specific unit snapshot
// ---------------------------------------------------------------------------

/**
 * Snapshot of a unit's stats used inside combat (TW v3 EN keys from units.json).
 * Hard input — silnik nie dzieli statow (bez ÷10 / ÷200).
 */
export interface CombatUnit {
  /** "Jednostka" field in units.json - unit type name. */
  typNazwa: string;

  /** "Typ" field in units.json (Miecznik/Wlocznik/Konnica/Lucznik/Rydwan...) used
   *  for counter matching in counterMultiplier; falls back to typNazwa/Jednostka
   *  when "Typ" is missing. Kept separate from typNazwa (display name). */
  counterTyp: string;

  /** "Rola (linia)" field: 'Wrecz' | 'Dystans' | 'Flanka' | 'Wsparcie' | 'Morska' */
  rola: string;

  /** Atak wręcz — +1% trafienia / pkt (Rome 2). */
  meleeAttack: number;

  /** Obrona — −1% trafienia wroga / pkt. */
  meleeDefence: number;

  /** Obrażenia broni — dmg 1:1 po redukcji pancerzem. */
  weaponDamage: number;

  /** Pancerz — redukcja dmg. */
  armor: number;

  /** Przebicie — dmg po redukcji pancerzem. */
  piercing: number;

  /** Szarża — bonus hit+dmg rundy 1 (tylko atakujący). */
  chargeBonus: number;

  /** Zdrowie — max HP. */
  health: number;

  /** "Prog dezercji (% health)" - rout threshold as a fraction [0..1], e.g. 0.25. */
  'Prog dezercji (% health)': number | null;

  /** Atak dystansowy (pilum / łuk) — dmg fazy pocisków. */
  missileAttack: number;

  /** "Zasieg ataku (hex)" - ranged attack reach in hexes; null/string "---" for melee. */
  'Zasieg ataku (hex)': number | string | null;

  /** "Ilosc pociskow" - ammo count for ranged units; null/string "---" for melee. */
  'Ilosc pociskow': number | string | null;

  /** "Ruch w bitwie (heksy)" - movement in battle; kept for completeness. */
  'Ruch w bitwie (heksy)': number | string | null;

  /** "Kara obrony z flanki (%)" - flank defence penalty as integer percent (e.g. 50). */
  'Kara obrony z flanki (%)': number | string | null;

  /** "Kara obrony z tylu (%)" - rear defence penalty as integer percent (e.g. 80). */
  'Kara obrony z tylu (%)': number | string | null;

  /** Whether this is a super-unit. */
  'Super-jednostka'?: string | boolean;

  /** If true the unit ignores the rout threshold and fights to 0 HP (Nieztomny). */
  unbreakable?: boolean;
}

/** Normalize a numeric stat from units.json (handles null, '---', diacritics keys). */
export function combatNormField(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === '---' || v === '—' || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return isNaN(n) ? fallback : n;
}

/**
 * Read one TW stat from a units.json row, with optional legacy Polish column fallback.
 * Use in HUD, tooltips, siege bridges — same source as combatUnitFromDef.
 */
export function unitRowStat(
  def: Record<string, unknown> | null | undefined,
  primary: string,
  legacy?: string,
  fallback = 0,
): number {
  if (!def) return fallback;
  const v = def[primary];
  if (v !== null && v !== undefined && v !== '---' && v !== '—' && v !== '') {
    return combatNormField(v, fallback);
  }
  if (legacy) {
    const lv = def[legacy];
    if (lv !== null && lv !== undefined && lv !== '---' && lv !== '—' && lv !== '') {
      return combatNormField(lv, fallback);
    }
  }
  return fallback;
}

function combatStatField(s: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = s[k];
    if (v !== null && v !== undefined && v !== '---' && v !== '—' && v !== '') return v;
  }
  return undefined;
}

export type CombatUnitFromDefOpts = {
  typNazwa?: string;
  rola?: string;
  /** Current HP in battle; defaults to def `health`. */
  hp?: number;
};

/** Build CombatUnit from units.json row (TW v3 EN fields). */
export function combatUnitFromDef(
  def: Record<string, unknown>,
  opts: CombatUnitFromDefOpts = {},
): CombatUnit {
  const progRaw = combatStatField(def, 'Próg dezercji (% health)', 'Prog dezercji (% health)');
  const prog = progRaw === null || progRaw === undefined
    ? null
    : combatNormField(progRaw, 0.25);
  const maxHp = combatNormField(def['health'] ?? def['Health'], 30);
  return {
    typNazwa: opts.typNazwa ?? String(def['Jednostka'] ?? ''),
    counterTyp: String(def['Typ'] ?? opts.typNazwa ?? def['Jednostka'] ?? ''),
    rola: opts.rola ?? String(def['Rola (linia)'] ?? 'Wrecz'),
    meleeAttack: combatNormField(def['meleeAttack'], 0),
    meleeDefence: combatNormField(def['meleeDefence'], 0),
    weaponDamage: combatNormField(def['weaponDamage'], 0),
    // Legacy PL fallback (Pancerz/Przebicie/Uderzenie): ~25 units.json rows never got the
    // TW v3 EN block authored. Same fallback pattern unitRowStat already uses elsewhere
    // (see battleScene.ts unitRowStat(s, 'chargeBonus', 'Uderzenie', ...)) so they don't
    // fight with armor/piercing/chargeBonus silently defaulted to 0.
    armor: unitRowStat(def, 'armor', 'Pancerz', 0),
    piercing: unitRowStat(def, 'piercing', 'Przebicie', 0),
    chargeBonus: unitRowStat(def, 'chargeBonus', 'Uderzenie', 0),
    health: opts.hp ?? maxHp,
    'Prog dezercji (% health)': prog,
    missileAttack: combatNormField(def['missileAttack'], 0),
    'Zasieg ataku (hex)': (combatStatField(def, 'Zasięg ataku (hex)', 'Zasieg ataku (hex)') ?? null) as number | string | null,
    'Ilosc pociskow': (combatStatField(def, 'Ilość pocisków', 'Ilosc pociskow') ?? null) as number | string | null,
    'Ruch w bitwie (heksy)': (def['Ruch w bitwie (heksy)'] ?? null) as number | string | null,
    'Kara obrony z flanki (%)': combatNormField(def['Kara obrony z flanki (%)'], 50),
    'Kara obrony z tylu (%)': combatNormField(
      combatStatField(def, 'Kara obrony z tyłu (%)', 'Kara obrony z tylu (%)'),
      80,
    ),
    'Super-jednostka': def['Super-jednostka'] as string | boolean | undefined,
  };
}

// ---------------------------------------------------------------------------
// Position / terrain inputs for resolveCombat
// ---------------------------------------------------------------------------

export type AttackerPosition = 'front' | 'flank' | 'rear';

/** Terrain name matching the "Teren" field in terrain-combat.json. */
export type TerrainName = string;

// ---------------------------------------------------------------------------
// Options for resolveCombat
// ---------------------------------------------------------------------------

export interface ResolveCombatOpts {
  /**
   * Terrain the defender occupies.
   * Used to look up defence bonus from terrain-combat.json entries.
   */
  defenderTerrain?: TerrainName;

  /**
   * Pre-parsed terrain entries from data/terrain-combat.json.
   * If omitted, terrain modifiers are skipped.
   */
  terrainData?: TerrainEntry[];

  /**
   * Direction from which the attacker engages the defender.
   * 'front' = no penalty, 'flank' = flank penalty, 'rear' = rear penalty.
   * Default: 'front'.
   */
  attackerPosition?: AttackerPosition;

  /**
   * Pre-parsed counter entries from data/counters.json.
   * If omitted, counter bonuses are skipped.
   */
  counters?: CounterEntry[];

  /**
   * Current ranged ammo for attacker (overrides unit stat).
   */
  attackerAmmo?: number;

  /**
   * Current ranged ammo for defender (overrides unit stat).
   */
  defenderAmmo?: number;

  /**
   * Whether the attacker moved before engaging.
   * Stationary spear/phalanx defenders NEGATE charge when attacker moved.
   * Default: true.
   */
  attackerMoved?: boolean;

  /**
   * Maximum melee rounds before declaring a draw. Default: 30.
   */
  maxRounds?: number;

  /**
   * Deterministic RNG seeded externally; must return float in [0, 1).
   * Default: Math.random. Inject a seeded RNG in tests.
   */
  rng?: () => number;

  /**
   * Bonus obrony ze struktury budowlanej (STEP E -- bonusy obronne za mape/budowle).
   * Wartosc procentowa: 200 = +200% (trojkrotnosc bazowej Obrony).
   * Dotyczy jednostek bronionych przez mur miasta lub obozujacych przy forcie/posterunku.
   * Stosowany MULTIPLIKATYWNIE z bonusem terenu (najwyzszy z bonusow budowlanych wygrywa).
   *
   * Przykladowe wartosci (z terrain-improvements.json + miasto-params.json):
   *   miasto z murem     -> 200  (flaga City.maMur)
   *   fort               -> 100  (improvement 'fort', bonus_obrona_proc: 100)
   *   posterunek         ->  50  (improvement 'posterunek', bonus_obrona_proc: 50)
   *
   * Gdy brak struktury: 0 (brak bonusu).
   */
  structureDefBonusPct?: number;

  /** RDY-01: bonusy cyw atakujacego (civs.json bonusy[], realizuje=walka). */
  attackerCivBonusy?: readonly CivBonusEntry[];

  /** RDY-01: bonusy cyw broniacego. */
  defenderCivBonusy?: readonly CivBonusEntry[];

  /**
   * Sciezki ulepszen jednostek (2026-07-25, unit-building-bonuses.ts): bonus
   * Pancerza (pancerz) i pozostalych statow bojowych (other) ATAKUJACEGO,
   * jako ulamki (0.15 = +15%), wg NAJLEPSZEGO miasta jednostka kiedykolwiek
   * odwiedzila. Domyslnie brak (0/0) -- bezpieczne dla wszystkich istniejacych
   * wywolan. Scalane w te sama strukture mnoznikow co bonusy cyw (patrz
   * mergeBuildingBonusIntoStatMultipliers).
   */
  attackerBuildingBonus?: BuildingCombatBonus;

  /** Jak wyzej, dla broniacego. */
  defenderBuildingBonus?: BuildingCombatBonus;

  /**
   * TRZECI SYSTEM (2026-07-25, game/veteran.ts): ulamek premii doswiadczenia
   * bojowego atakujacego -- 0 (Rekrut) / 0.10 (poziom 2) / 0.20 (Weteran,
   * poziom 3, sufit). Zastosowany na SAMYM POCZATKU resolveCombat, PRZED
   * civ+building mods, przez podmiane parametru attacker/defender na wersje
   * przeskalowana (applyVeteranFracToCombatUnit) -- poniewaz mnozenie
   * ulamkow niezaleznych czynnikow jest przemienne, kolejnosc "baza ->
   * weteran -> civ+building" i "baza -> civ+building -> weteran" daja
   * IDENTYCZNY wynik koncowy, wiec ten punkt wpiecia jest najprostszy z
   * mozliwych i nie wymaga dotykania zadnej formuly walki ponizej. Pancerz
   * (armor) NIGDY nie dostaje tej premii (na zadnym poziomie, patrz
   * applyVeteranFracToCombatUnit); "Prog dezercji (% health)" jest polem
   * ODWROCONYM -- weteran je OBNIZA (latwiej wytrzymac, trudniej
   * zdezerterowac), nie podnosi. Domyslnie 0 -- bezpieczne dla wszystkich
   * istniejacych wywolan/testow (combat-test.cjs pozostaje 6/6 bez zmian).
   */
  attackerVeteranBonusFrac?: number;

  /** Jak wyzej, dla broniacego. */
  defenderVeteranBonusFrac?: number;
}

// ---------------------------------------------------------------------------
// Combat result
// ---------------------------------------------------------------------------

export interface CombatResult {
  winner: 'attacker' | 'defender' | 'draw';
  attackerHpLeft: number;
  defenderHpLeft: number;
  /** Total rounds (ranged rounds + melee rounds). */
  rounds: number;
  /** Which unit(s) routed (fled the battle). */
  routed: ('attacker' | 'defender')[];
  /** Step-by-step log for display in battle preview. */
  log: string[];
}

// ---------------------------------------------------------------------------
// TW v3 Core formula functions (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * hitChanceTw — Total War Rome 2:
 *   clamp(tw_v3.hit_base + meleeAttack - meleeDefence + hitBonus, hit_min, hit_max)
 */
export function hitChanceTw(
  meleeAttack: number,
  meleeDefence: number,
  hitBonus = 0,
): number {
  const raw = TW.hit_base + meleeAttack - meleeDefence + hitBonus;
  return Math.max(TW.hit_min, Math.min(TW.hit_max, raw));
}

/**
 * damageTw — zwarcie TW v3:
 *   max(0, weaponDamage - armor) + piercing + (chargeBonus if charge round)
 */
export function damageTw(
  weaponDamage: number,
  armor: number,
  piercing: number,
  chargeBonus: number,
  isChargeRound: boolean,
): number {
  const base = Math.max(0, weaponDamage - armor) + piercing;
  return base + (isChargeRound ? chargeBonus : 0);
}

/**
 * rangeDamageTw — faza dystansowa (pilum / łuk):
 *   max(1, missileAttack - armor)
 */
export function rangeDamageTw(missileAttack: number, armor: number): number {
  return Math.max(1, missileAttack - armor);
}

/** Alias kompatybilnosci — uzywa TW Rome 2. */
export function hitChance(atk: number, def: number): number {
  return hitChanceTw(atk, def);
}

/** Alias kompatybilnosci — uzywa TW v3 dmg. */
export function baseDamage(
  weaponDamage: number,
  armor: number,
  piercing: number,
  chargeBonus: number,
  isChargeRound: boolean,
): number {
  return damageTw(weaponDamage, armor, piercing, chargeBonus, isChargeRound);
}

/** @deprecated macierz v2 usunieta — alias do rangeDamageTw. */
export function rangeDamage(missileAttack: number, armor: number): number {
  return rangeDamageTw(missileAttack, armor);
}

/**
 * counterMultiplier per SS5k / SS5l:
 *   Returns 1.5 if a confirmed Atak-type counter applies.
 *   Returns 1.0 otherwise.
 *
 * Matching is substring-based, case-insensitive.
 */
export function counterMultiplier(
  attackerType: string,
  defenderType: string,
  counters: CounterEntry[],
): number {
  const aLow = attackerType.toLowerCase();
  const dLow = defenderType.toLowerCase();

  for (const c of counters) {
    if (c['Status'] !== 'potwierdzone') continue;
    if (c['Rodzaj (Atak/Obrona)'] !== 'Atak') continue;

    const cAtk = c['Typ atakujacy'].toLowerCase();
    const cCel = c['Cel (typ)'].toLowerCase();

    const atkMatch = aLow.includes(cAtk) || cAtk.includes(aLow);
    const defAlts = cCel.split('/').map((s) => s.trim());
    const defMatch = defAlts.some((alt) => dLow.includes(alt) || alt.includes(dLow));

    if (atkMatch && defMatch) {
      return COUNTER_MULT;
    }
  }
  return 1.0;
}

/**
 * flankRearDefensePenalty per SS5l / SS5e:
 *   Returns the defence reduction as a fraction in [0, 1).
 *   e.g. 50% flank penalty -> 0.50.
 *
 * Uses the unit's own "Kara obrony z flanki (%)" / "Kara obrony z tylu (%)"
 * fields from units.json (stored as integer percent, e.g. 50 means 50%).
 * Returns 0 if position is 'front' or no penalty is defined.
 */
export function flankRearDefensePenalty(
  unit: CombatUnit,
  position: AttackerPosition,
): number {
  if (position === 'front') return 0;

  const rawField =
    position === 'flank'
      ? unit['Kara obrony z flanki (%)']
      : unit['Kara obrony z tylu (%)'];

  if (rawField === null || rawField === undefined || rawField === '---' || rawField === '') {
    return 0;
  }
  const val = typeof rawField === 'string' ? parseFloat(rawField) : rawField;
  if (isNaN(val)) return 0;
  return val / 100;
}

// ---------------------------------------------------------------------------
// Terrain helpers
// ---------------------------------------------------------------------------

/**
 * normTerrain(s):
 * Strips diacritics and lowercases s so that e.g. 'Wzgorza' and 'Wzgorza'
 * (with or without accents) compare identically.
 * Uses NFD decomposition to separate base letters from combining marks,
 * then removes the combining-mark code-points (U+0300..U+036F).
 * ASCII-range regex used intentionally to keep the source file ASCII-only.
 */
export function normTerrain(s: string): string {
  // NFD-decompose, strip combining diacritical marks (U+0300..U+036F), lowercase.
  // Hex escapes keep this source file ASCII-only.
  return s.normalize('NFD').replace(/[\u0300-\u036F]/g, '').toLowerCase();
}

/**
 * terrainDefenseMultiplier:
 * Returns the multiplier applied to the defender's effective Obrona.
 *
 *   Wzgorza     -> 1.5  (+50% Obrona)
 *   Gory        -> 1.75 (+50-100%, midpoint for auto-resolve)
 *   Las         -> 1.5 ONLY vs Dystans/Flanka attackers
 *   Rzeka       -> 1.0 (penalty is on attacker Atak, not defender Obrona)
 *   Everything else -> 1.0
 */
export function terrainDefenseMultiplier(
  defenderTerrain: TerrainName,
  attackerRola: string,
  terrainData: TerrainEntry[],
): number {
  if (!defenderTerrain || terrainData.length === 0) return 1.0;

  const terrNorm = normTerrain(defenderTerrain);

  const entry = terrainData.find((t) => {
    const tNorm = normTerrain(t['Teren']);
    return tNorm.includes(terrNorm) || terrNorm.includes(tNorm.split(' ')[0] ?? '');
  });

  if (!entry) return 1.0;

  const bonus = entry['Bonus Obrona'];
  if (!bonus || bonus === '+0%' || bonus === '---' || bonus === '') return 1.0;

  const eName = normTerrain(entry['Teren']);

  // Las: +50% ONLY vs ranged / cavalry
  if (eName.includes('las')) {
    const aLow = normTerrain(attackerRola);
    const isRangedOrCav =
      aLow.includes('dystans') ||
      aLow.includes('flanka');
    return isRangedOrCav ? 1.5 : 1.0;
  }

  // Gory (mountains) — has cost 3-4 in data; distinguish from Wzgorza
  if (eName.includes('gory')) {
    return 1.75;
  }

  // Wzgorza (hills)
  if (eName.includes('wzg')) {
    return 1.5;
  }

  // Generic numeric fallback
  const match = bonus.match(/([+-]?\d+)/);
  if (match?.[1]) {
    const pct = parseFloat(match[1]);
    return 1.0 + pct / 100;
  }

  return 1.0;
}

/**
 * terrainRiverAttackMultiplier:
 * Returns 0.75 (i.e. -25% Atak) if attacker is crossing a river per SS5j.
 */
export function terrainRiverAttackMultiplier(
  defenderTerrain: TerrainName,
  terrainData: TerrainEntry[],
): number {
  if (!defenderTerrain || terrainData.length === 0) return 1.0;
  const terrNorm = normTerrain(defenderTerrain);
  const isRiver = terrNorm.includes('rzek') || terrNorm.includes('river');
  if (!isRiver) return 1.0;
  const entry = terrainData.find((t) => normTerrain(t['Teren']).includes('rzek'));
  return entry ? combatParamsRaw.river_attack_mult : 1.0;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function routThreshold(unit: CombatUnit): number {
  const pct = unit['Prog dezercji (% health)'];
  if (pct === null || pct === undefined) return 0;
  return pct * unit.health;
}

function resolveAmmo(unit: CombatUnit, override?: number): number {
  if (override !== undefined) return override;
  const raw = unit['Ilosc pociskow'];
  if (raw === null || raw === undefined || raw === '---' || raw === '') return 0;
  return typeof raw === 'string' ? parseInt(raw, 10) : raw;
}

function isRangedUnit(unit: CombatUnit): boolean {
  return (unit.missileAttack ?? 0) > 0;
}

/** Spear/phalanx-type units that negate attacker charge when bracing.
 *  Matches on counterTyp (the 'Typ' data field: Spearman/Falangite), not the
 *  display name, so elite spear units with non-obvious names (Triari, Mur
 *  tarcz...) brace too — consistent with counterMultiplier's use of counterTyp. */
function negatesCharge(unit: CombatUnit): boolean {
  const t = unit.counterTyp.toLowerCase();
  return t === 'spearman' || t === 'falangite';
}

// ---------------------------------------------------------------------------
// Main resolver - SS5l canonical auto-resolve
// ---------------------------------------------------------------------------

/**
 * resolveCombat
 *
 * Simulates a full battle between attacker and defender following the
 * canonical SS5l model:
 *
 *   Phase 0 (Ranged): units with Atak_dystansowy > 0 and ammo shoot.
 *     Damage: max(1, Atak_dystansowy - Pancerz_celu)
 *     Both sides fire until ammo is exhausted or a rout occurs.
 *
 *   Phase 1 (Szarza / R1 melee):
 *     Attacker damage = max(1, Atak - Pancerz + Przebicie) + Uderzenie
 *     Uderzenie negated if defender is bracing spear/phalanx (did not move).
 *
 *   Phase 2 (Zwarcie / R2+):
 *     Both sides hit simultaneously.
 *     Damage = max(1, Atak - Pancerz + Przebicie)  [no Uderzenie]
 *
 *   Modifiers (all per SS5l table):
 *     - counterMultiplier: x1.5 on damage if counter applies
 *     - flank/rear: reduces defender effective Obrona
 *     - terrain: multiplies defender effective Obrona
 *     - river: multiplies attacker effective Atak by 0.75
 *
 *   Rout: unit flees when currentHP < Prog_dezercji% * Health_startowe
 *         (unbreakable units fight to HP <= 0)
 *
 *   AI controls BOTH sides with the same formula (SS5h-auto).
 *
 * @param attacker  combat stats for the attacking unit
 * @param defender  combat stats for the defending unit
 * @param opts      optional context
 * @returns CombatResult
 */
export function resolveCombat(
  attacker: CombatUnit,
  defender: CombatUnit,
  opts: ResolveCombatOpts = {},
): CombatResult {
  // TRZECI SYSTEM (weterani, game/veteran.ts) -- patrz komentarz przy
  // ResolveCombatOpts.attackerVeteranBonusFrac powyzej dla uzasadnienia,
  // dlaczego wpiecie na samym poczatku (przeslonieciem parametrow) jest
  // rownowazne wpiecu po civ+building mods. Gdy frac=0 (domyslnie) funkcja
  // zwraca WEJSCIOWY obiekt bez zadnej modyfikacji (zero ryzyka szumu
  // zmiennoprzecinkowego dla wszystkich istniejacych wywolan).
  attacker = applyVeteranFracToCombatUnit(attacker, opts.attackerVeteranBonusFrac ?? 0);
  defender = applyVeteranFracToCombatUnit(defender, opts.defenderVeteranBonusFrac ?? 0);

  const rng = opts.rng ?? (() => Math.random());
  const position: AttackerPosition = opts.attackerPosition ?? 'front';
  const maxRounds = opts.maxRounds ?? TW.max_rounds;
  const attackerMoved = opts.attackerMoved ?? true;
  const counters = opts.counters ?? [];
  const terrainData = opts.terrainData ?? [];
  const defenderTerrain = opts.defenderTerrain ?? '';

  const log: string[] = [];
  const routed: ('attacker' | 'defender')[] = [];

  const atkBaseMods = mergeBuildingBonusIntoStatMultipliers(
    civCombatStatMultipliers(opts.attackerCivBonusy, attacker, {
      side: 'attacker',
      terrain: defenderTerrain,
      isChargeRound: false,
    }),
    opts.attackerBuildingBonus,
  );
  const defBaseMods = mergeBuildingBonusIntoStatMultipliers(
    civCombatStatMultipliers(opts.defenderCivBonusy, defender, {
      side: 'defender',
      terrain: defenderTerrain,
      isChargeRound: false,
    }),
    opts.defenderBuildingBonus,
  );

  const atkMelee0 = applyMultiplier(attacker.meleeAttack, atkBaseMods.atk);
  const atkObrona0 = applyMultiplier(attacker.meleeDefence, atkBaseMods.obrona);
  const atkPanc0 = applyMultiplier(attacker.armor, atkBaseMods.pancerz);
  const atkMissile0 = applyMultiplier(attacker.missileAttack ?? 0, atkBaseMods.rangedAtk);

  const defObrona0 = applyMultiplier(defender.meleeDefence, defBaseMods.obrona);
  const defMelee0 = applyMultiplier(defender.meleeAttack, defBaseMods.atk);
  const defPanc0 = applyMultiplier(defender.armor, defBaseMods.pancerz);
  const defMissile0 = applyMultiplier(defender.missileAttack ?? 0, defBaseMods.rangedAtk);

  let hpAtk = Math.round(applyMultiplier(attacker.health, atkBaseMods.health));
  let hpDef = Math.round(applyMultiplier(defender.health, defBaseMods.health));
  const hpAtkStart = hpAtk;
  const hpDefStart = hpDef;

  let ammoAtk = resolveAmmo(attacker, opts.attackerAmmo);
  let ammoDef = resolveAmmo(defender, opts.defenderAmmo);

  const routAtk = routThreshold({ ...attacker, health: hpAtkStart });
  const routDef = routThreshold({ ...defender, health: hpDefStart });

  let totalRounds = 0;

  // --- Pre-compute shared modifiers ---

  // Flank/rear penalty reduces defender's effective Obrona
  const defPenaltyFrac = flankRearDefensePenalty(defender, position);
  const defEffObrona = Math.max(0, defObrona0 * (1 - defPenaltyFrac));

  // Counter multipliers
  const ctrAtkVsDef = counterMultiplier(attacker.counterTyp, defender.counterTyp, counters);
  const ctrDefVsAtk = counterMultiplier(defender.counterTyp, attacker.counterTyp, counters);

  // Terrain: defence multiplier for defender
  const terrDefMult = terrainDefenseMultiplier(defenderTerrain, attacker.rola, terrainData);

  // Terrain: river attack penalty for attacker
  const terrRiverMult = terrainRiverAttackMultiplier(defenderTerrain, terrainData);

  // Structure defence bonus (STEP E): mur +200%, fort +100%, posterunek +50%
  // Applied multiplicatively with terrain bonus.
  // structureDefBonusPct=200 means defender.Obrona is tripled (1 + 200/100 = 3x).
  const structBonusPct = opts.structureDefBonusPct ?? 0;
  const structMult = 1 + Math.max(0, structBonusPct) / 100;

  // Final effective stats (base civ mods; charge-round extras applied in melee)
  const atkEffMelee = atkMelee0 * terrRiverMult;
  const defFinalObrona = defEffObrona * terrDefMult * structMult;

  const atkIsRanged = isRangedUnit(attacker);
  const defIsRanged = isRangedUnit(defender);

  // ---------- Phase 0: Ranged ----------

  if (atkIsRanged || defIsRanged) {
    log.push('=== Faza dystansowa ===');

    while (
      ((atkIsRanged && ammoAtk > 0) || (defIsRanged && ammoDef > 0)) &&
      hpAtk > 0 &&
      hpDef > 0 &&
      routed.length === 0
    ) {
      totalRounds++;
      if (totalRounds > maxRounds) {
        log.push('Limit rund osiagniety w fazie dystansowej.');
        break;
      }

      // Attacker shoots
      if (atkIsRanged && ammoAtk > 0) {
        ammoAtk--;
        const hitPct = hitChanceTw(atkEffMelee, defFinalObrona);
        const roll = rng() * 100;
        if (roll < hitPct) {
          const dmg = Math.round(rangeDamageTw(atkMissile0, defPanc0) * ctrAtkVsDef);
          hpDef -= dmg;
          log.push(
            `R${totalRounds}[Dyst-ATK] trafienie (${roll.toFixed(1)}<${hitPct}%) -> ${dmg} obra. Obronca HP: ${hpDef}`,
          );
        } else {
          log.push(
            `R${totalRounds}[Dyst-ATK] chybienie (${roll.toFixed(1)}>=${hitPct}%).`,
          );
        }
      }

      // Defender shoots back (if alive)
      if (defIsRanged && ammoDef > 0 && hpDef > 0) {
        ammoDef--;
        const hitPct = hitChanceTw(defMelee0, atkObrona0);
        const roll = rng() * 100;
        if (roll < hitPct) {
          const dmg = Math.round(rangeDamageTw(defMissile0, atkPanc0) * ctrDefVsAtk);
          hpAtk -= dmg;
          log.push(
            `R${totalRounds}[Dyst-DEF] trafienie (${roll.toFixed(1)}<${hitPct}%) -> ${dmg} obra. Atakujacy HP: ${hpAtk}`,
          );
        } else {
          log.push(
            `R${totalRounds}[Dyst-DEF] chybienie (${roll.toFixed(1)}>=${hitPct}%).`,
          );
        }
      }

      // Check rout after ranged round
      if (!defender.unbreakable && routDef > 0 && hpDef < routDef) {
        routed.push('defender');
        log.push(`Obronca ucieka po ostrzale! HP ${hpDef} < prog ${routDef}`);
        break;
      }
      if (!attacker.unbreakable && routAtk > 0 && hpAtk < routAtk) {
        routed.push('attacker');
        log.push(`Atakujacy ucieka po ostrzale! HP ${hpAtk} < prog ${routAtk}`);
        break;
      }
      if (hpDef <= 0) { routed.push('defender'); log.push(`Obronca zniszczony.`); break; }
      if (hpAtk <= 0) { routed.push('attacker'); log.push(`Atakujacy zniszczony.`); break; }

      if (!atkIsRanged || ammoAtk <= 0) { if (!defIsRanged || ammoDef <= 0) break; }
    }
  }

  // ---------- Phase 1 & 2: Melee ----------

  if (hpAtk > 0 && hpDef > 0 && routed.length === 0) {
    log.push('=== Faza zwarczia ===');

    // Charge negated if defender is bracing (spear/phalanx, didn't move) and attacker moved
    const defBracing = attackerMoved && negatesCharge(defender);

    let meleeRound = 0;

    while (hpAtk > 0 && hpDef > 0 && routed.length === 0) {
      meleeRound++;
      totalRounds++;

      if (totalRounds > maxRounds) {
        log.push('Limit rund osiagniety -> remis.');
        break;
      }

      const isCharge = meleeRound === 1 && !defBracing;
      const phaseLabel = isCharge ? 'Szarza' : 'Zwarcie';

      const atkRoundMods = mergeBuildingBonusIntoStatMultipliers(
        civCombatStatMultipliers(opts.attackerCivBonusy, attacker, {
          side: 'attacker',
          terrain: defenderTerrain,
          isChargeRound: isCharge,
        }),
        opts.attackerBuildingBonus,
      );
      const defRoundMods = mergeBuildingBonusIntoStatMultipliers(
        civCombatStatMultipliers(opts.defenderCivBonusy, defender, {
          side: 'defender',
          terrain: defenderTerrain,
          isChargeRound: isCharge,
        }),
        opts.defenderBuildingBonus,
      );

      const roundAtkMelee = applyMultiplier(attacker.meleeAttack, atkRoundMods.atk) * terrRiverMult;
      const roundAtkCharge = applyMultiplier(attacker.chargeBonus, atkRoundMods.uderzenie);
      const roundDefMelee = applyMultiplier(defender.meleeAttack, defRoundMods.atk);
      const roundDefObrona = applyMultiplier(defender.meleeDefence, defRoundMods.obrona);
      const roundAtkObrona = applyMultiplier(attacker.meleeDefence, atkRoundMods.obrona);
      const roundAtkPanc = applyMultiplier(attacker.armor, atkRoundMods.pancerz);
      const roundDefPanc = applyMultiplier(defender.armor, defRoundMods.pancerz);

      if (meleeRound === 1 && defBracing) {
        log.push('R1[Zwarcie] Szarża zanegowana przez postawe odpierajaca!');
      }

      const chargeHitBonus = isCharge ? roundAtkCharge : 0;

      // Attacker hits defender
      const atkHitPct = hitChanceTw(roundAtkMelee, defFinalObrona, chargeHitBonus);
      const atkRoll = rng() * 100;
      if (atkRoll < atkHitPct) {
        const rawDmg = damageTw(
          attacker.weaponDamage,
          roundDefPanc,
          attacker.piercing,
          roundAtkCharge,
          isCharge,
        );
        const finalDmg = Math.round(rawDmg * ctrAtkVsDef);
        hpDef -= finalDmg;
        log.push(
          `R${totalRounds}[${phaseLabel}] ATK trafia (${atkRoll.toFixed(1)}<${atkHitPct}%) -> ${finalDmg} obra${isCharge ? ' (+Szarza)' : ''}. Obronca HP: ${hpDef}`,
        );
      } else {
        log.push(
          `R${totalRounds}[${phaseLabel}] ATK chybia (${atkRoll.toFixed(1)}>=${atkHitPct}%).`,
        );
      }

      // Defender counter-attacks simultaneously
      const defHitPct = hitChanceTw(roundDefMelee, roundAtkObrona);
      const defRoll = rng() * 100;
      if (defRoll < defHitPct) {
        const rawDmg = damageTw(
          defender.weaponDamage,
          roundAtkPanc,
          defender.piercing,
          0,
          false,
        );
        const finalDmg = Math.round(rawDmg * ctrDefVsAtk);
        hpAtk -= finalDmg;
        log.push(
          `R${totalRounds}[${phaseLabel}] DEF trafia (${defRoll.toFixed(1)}<${defHitPct}%) -> ${finalDmg} obra. Atakujacy HP: ${hpAtk}`,
        );
      } else {
        log.push(
          `R${totalRounds}[${phaseLabel}] DEF chybia (${defRoll.toFixed(1)}>=${defHitPct}%).`,
        );
      }

      // Rout / death checks
      const defKilled = hpDef <= 0;
      const atkKilled = hpAtk <= 0;
      const defRoutCheck = !defender.unbreakable && routDef > 0 && hpDef < routDef;
      const atkRoutCheck = !attacker.unbreakable && routAtk > 0 && hpAtk < routAtk;

      if ((defRoutCheck || defKilled) && !routed.includes('defender')) {
        routed.push('defender');
        log.push(
          defKilled
            ? `Obronca zniszczony (HP ${hpDef}).`
            : `Obronca ucieka! HP ${hpDef} < prog ${routDef}`,
        );
      }
      if ((atkRoutCheck || atkKilled) && !routed.includes('attacker')) {
        routed.push('attacker');
        log.push(
          atkKilled
            ? `Atakujacy zniszczony (HP ${hpAtk}).`
            : `Atakujacy ucieka! HP ${hpAtk} < prog ${routAtk}`,
        );
      }
    }
  }

  // ---------- Winner ----------

  const atkDown = routed.includes('attacker') || hpAtk <= 0;
  const defDown = routed.includes('defender') || hpDef <= 0;

  let winner: 'attacker' | 'defender' | 'draw';
  if (atkDown && defDown) {
    winner = 'draw';
  } else if (defDown) {
    winner = 'attacker';
  } else if (atkDown) {
    winner = 'defender';
  } else {
    winner = 'draw'; // max rounds
  }

  const winMsg =
    winner === 'attacker'
      ? 'Zwyciestwo ATAKUJACEGO'
      : winner === 'defender'
      ? 'Zwyciestwo OBRONCY'
      : 'REMIS';

  log.push(`=== ${winMsg} | Rundy: ${totalRounds} ===`);
  log.push(`ATK HP: ${Math.max(0, hpAtk)}  DEF HP: ${Math.max(0, hpDef)}`);

  return {
    winner,
    attackerHpLeft: Math.max(0, hpAtk),
    defenderHpLeft: Math.max(0, hpDef),
    rounds: totalRounds,
    routed,
    log,
  };
}
