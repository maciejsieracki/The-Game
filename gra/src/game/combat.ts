import type { CivBonusEntry } from './civ-bonuses';
import { applyMultiplier, civCombatStatMultipliers } from './civ-bonuses';
import type { BuildingCombatBonus } from './unit-building-bonuses';
import { mergeBuildingBonusIntoStatMultipliers } from './unit-building-bonuses';
import { applyVeteranFracToCombatUnit } from './veteran';
import { applyArmyHungerStatMultToCombatUnit } from './army-starvation';
import { applyGoldDeficitStatMultToCombatUnit } from './gold-deficit';
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
 *
 * NOTE: the raw JSON key for the ranged-reach delta carries Polish
 * diacritics + a delta glyph (literally "Delta Zasieg (dystansowi)" with a
 * capital Greek delta and an accented e). Written here via \uXXXX escapes
 * so this ASCII-only source file's bytes stay 7-bit, but the PROPERTY NAME
 * at runtime is the real accented string that matches data/terrain-combat.json
 * (and src/data/loader.ts's TerrainCombatDef) -- a plain-ASCII key here would
 * silently never match the real data (this was the original bug: an ASCII
 * 'Delta Zasieg (dystansowi)' key was declared but never read anywhere).
 */
export interface TerrainEntry {
  'Teren': string;
  'Bonus Obrona': string;
  '\u0394 Zasi\u0119g (dystansowi)': string | null;
  'Kawaleria/Rydwan': string | null;
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

/**
 * P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE (Maciej 2026-08-14): zasięg ataku
 * jednostki NA MAPIE ŚWIATA, w heksach mapy. 0 = jednostka zwarcia, wymaga
 * adiacencji (dystans dokładnie 1) — bez zmian względem dotychczasowego
 * zachowania. Czyta WPROST "Zasięg ataku (hex)" z units.json (ten sam wzorzec
 * odczytu co combatUnitFromDef/unitRowStat wyżej) — BEZ domyślnego fallbacku
 * dla jednostek z pustym polem, bo dziś każda jednostka z "Atak dystansowy" >
 * 0 ma to pole wypełnione (zweryfikowane przez skan units.json przy tym
 * zgłoszeniu). NIE mylić z attackRange() w battleScene.ts — tamta funkcja ma
 * WŁASNĄ skalę i fallback dla bitwy taktycznej (inna siatka niż mapa świata).
 * / EN: unit's WORLD-MAP attack reach in map hexes. 0 = melee unit, requires
 * adjacency (distance exactly 1) — unchanged from prior behaviour. Reads
 * "Zasięg ataku (hex)" from units.json DIRECTLY (same read pattern as
 * combatUnitFromDef/unitRowStat above) — NO default fallback for units with
 * an empty field, since today every unit with "Atak dystansowy" > 0 has the
 * field filled in (verified by scanning units.json for this report). NOT to
 * be confused with attackRange() in battleScene.ts — that function has its
 * OWN scale and fallback for the tactical battle grid (a different grid than
 * the world map).
 */
export function unitMapAttackRangeHex(def: Record<string, unknown> | null | undefined): number {
  return unitRowStat(def, 'Zasięg ataku (hex)', 'Zasieg ataku (hex)', 0);
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
   * C-COMBAT-Q2 (Maciej 2026-07-26): gdy podane, ZASTĘPUJE wewnętrznie liczony
   * terrainDefenseMultiplier(defenderTerrain, attacker.rola, terrainData) tą
   * WŁASNĄ wartością przy liczeniu defFinalObrona -- używane przez obronę
   * MIASTA (cityGatedTerrainMultiplier, game/city-defense.ts), gdzie bonus
   * terenu ma liczyć się WYŁĄCZNIE z wzniesienia i WYŁĄCZNIE gdy miasto ma
   * mur, niezależnie od tego, co terrainDefenseMultiplier zwróciłby dla
   * surowego defenderTerrain (np. Las). NIE wpływa na inne użycia
   * defenderTerrain w tej funkcji (kontekst bonusów cyw
   * civCombatStatMultipliers, kara Atak przy przekraczaniu rzeki
   * terrainRiverAttackMultiplier) -- tylko na terrDefMult poniżej. Domyślnie
   * undefined = zachowanie bez zmian (zero regresji dla wszystkich
   * istniejących wywołań, w tym bitwy w polu, która zostaje bez zmian).
   */
  defenderTerrainDefMultOverride?: number;

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

  /**
   * Głód wojska (PYTANIE-85): zapasy państwa < 0 po koszcie armii — osłabienie
   * statów bojowych (bez armor) przez armyHungerStatMult. Stosowane po weteranie.
   */
  attackerArmyHungry?: boolean;

  /** Jak wyżej, dla broniącego. */
  defenderArmyHungry?: boolean;

  /** Mnożnik statów przy głodzie wojska (domyślnie 0.75). */
  armyHungerStatMult?: number;

  /**
   * Deficyt Złota (R-DEFICYT-ZLOTA-KARA-Q1=A, próg R-DEFICYT-ZLOTA-TRIGGER-Q1=B):
   * Skarbiec właściciela < 0 PO zbankowaniu tej tury — osłabienie statów
   * bojowych (bez armor) przez goldDeficitStatMult. Stosowane po weteranie i
   * po głodzie wojska (niezależny czynnik, patrz gold-deficit.ts).
   */
  attackerGoldDeficit?: boolean;

  /** Jak wyżej, dla broniącego. */
  defenderGoldDeficit?: boolean;

  /** Mnożnik statów przy deficycie Złota (domyślnie 0.75). */
  goldDeficitStatMult?: number;

  /**
   * P-AI-MOC-BONUS=A: bonus trudności AI (bonusWalka) — tylko major AI, nie gracz.
   * Mnożnik ataku/obrony/ranged (1.05 = +5%). Domyślnie 1 (brak bonusu).
   */
  attackerDifficultyCombatMult?: number;

  /** Jak wyżej, dla broniącego. */
  defenderDifficultyCombatMult?: number;
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
 * Parse a counters.json "Bonus" cell ("+50%", "+15%", "-25%", "−50%" with the
 * U+2212 minus some rows use) into a fraction, e.g. "+50%" -> 0.5. Returns
 * null when the cell is missing/blank/unparseable so the caller can fall back
 * to a safe default instead of silently treating a bad row as 0% (no bonus).
 */
function parseCounterBonusFrac(raw: unknown): number | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/−/g, '-').replace('%', '');
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n / 100 : null;
}

/**
 * counterMultiplier per SS5k / SS5l (R-KONTRY-BITWA-MIGRACJA-Q1, 2026-08-06):
 *   Returns 1 + (row's own "Bonus" %) if a confirmed Atak-type counter row
 *   matches, e.g. a "+15%" row returns 1.15, "+50%" returns 1.5.
 *   Returns 1.0 when no row matches.
 *
 * Before this change every matching row returned the SAME flat COUNTER_MULT
 * (1.5) regardless of what its own "Bonus" cell said, and a second,
 * independent code path in battleScene.ts (attackerBonusVsType, reading
 * units.json's "Bonus vs <Typ> %" columns directly) supplied the per-pair
 * +15%/+25%/+50% values for the ~14 attacker/defender type pairs that carry
 * a counter bonus, multiplied together with this one (double-counted for
 * the few pairs both paths covered). counters.json now carries EVERY pair
 * (migrated from units.json's columns) with its real percentage in "Bonus",
 * so this single function is the only source of counter bonuses left.
 * Falls back to COUNTER_MULT only if a matched row's "Bonus" cell is
 * missing/unparseable (defensive; keeps old rows without a value working).
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
      const frac = parseCounterBonusFrac(c['Bonus']);
      return frac !== null ? 1 + frac : COUNTER_MULT;
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
 * C-TEREN-IMPL-2=C: wartości % czytane z terrain-combat.json ("Bonus Obrona"),
 * wyjątek: Las (+50% tylko vs Dystans/Flanka — logika warunkowa w kodzie).
 */
function parseDefenseBonusPct(bonus: string | undefined): number | null {
  if (!bonus || bonus === '+0%' || bonus === '---' || bonus === '') return null;
  const match = bonus.match(/([+-]?\d+)/);
  if (!match?.[1]) return null;
  return parseFloat(match[1]);
}

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
  const eName = normTerrain(entry['Teren']);

  // Las: +50% ONLY vs ranged / cavalry (warunek nie jest w samym procencie JSON)
  if (eName.includes('las')) {
    const aLow = normTerrain(attackerRola);
    const isRangedOrCav =
      aLow.includes('dystans') ||
      aLow.includes('flanka');
    return isRangedOrCav ? 1.5 : 1.0;
  }

  const pct = parseDefenseBonusPct(bonus);
  if (pct !== null) return 1.0 + pct / 100;

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

/**
 * Shared "Teren" row lookup for terrainRangeDelta / cavalryTerrainMultiplier.
 *
 * EXACT normalized match only (not terrainDefenseMultiplier's fuzzy
 * includes()-based rule): a substring check here would false-positive match
 * combatTerrainName's 'Plaskie (rownina/laka)' against the JSON 'Las' row,
 * because normTerrain('Plaskie...') literally CONTAINS the substring 'las'
 * ("p-LAS-kie") -- verified with a failing test before this fix. Every real
 * caller passes one of battle-terrain.ts's canonical COMBAT_NAME strings
 * ('Las'/'Wzgorza'/'Gory'/'Rzeka'/'Plaskie (rownina/laka)'), and the first
 * four normalize to an EXACT match with their JSON row (both sides lose the
 * same accents via NFD); 'Plaskie' legitimately finds no row (its own JSON
 * name has an L-with-stroke letter that NFD does not decompose, so the
 * plain-ASCII 'l' COMBAT_NAME uses never matches it byte-for-byte), which is
 * fine -- callers default to 0 / 1 (no delta / no penalty) exactly as Plains
 * data intends.
 */
function findTerrainEntry(terrain: TerrainName, terrainData: TerrainEntry[]): TerrainEntry | undefined {
  if (!terrain || terrainData.length === 0) return undefined;
  const terrNorm = normTerrain(terrain);
  return terrainData.find((t) => normTerrain(t['Teren']) === terrNorm);
}

// Raw JSON key for the ranged-reach delta column (see TerrainEntry doc comment
// above for why this must be the real accented key, not an ASCII alias).
const RANGE_DELTA_KEY = 'Δ Zasięg (dystansowi)' as const;

/**
 * terrainRangeDelta (C-TEREN-Q1 ETAP 2):
 * Reads the "Δ Zasięg (dystansowi)" column of terrain-combat.json for the
 * tile a RANGED unit is STANDING ON (not the target's tile) and returns the
 * signed tile delta to apply to that unit's shooting range this turn.
 *
 *   Las (forest)   -> -1 (zaslona / cover blocks line of sight)
 *   Wzgorza (hills)-> +1 (elevation)
 *   Gory (mountains)-> +1 (elevation)
 *   Everything else (incl. unmatched terrain / empty terrainData) -> 0
 *
 * The data cell uses a unicode minus sign (U+2212) for the negative value
 * ("−1 (zaslona)"), normalised to ASCII '-' before parsing.
 */
export function terrainRangeDelta(
  terrain: TerrainName,
  terrainData: TerrainEntry[],
): number {
  const entry = findTerrainEntry(terrain, terrainData);
  if (!entry) return 0;
  const raw = entry[RANGE_DELTA_KEY];
  if (raw === null || raw === undefined) return 0;
  const s = String(raw).replace(/−/g, '-');
  const match = s.match(/([+-]?\d+)/);
  if (!match?.[1]) return 0;
  return parseInt(match[1], 10);
}

/**
 * cavalryTerrainMultiplier (C-TEREN-Q1 ETAP 3):
 * Reads the "Kawaleria/Rydwan" column of terrain-combat.json and returns the
 * movement-cost MULTIPLIER a MOUNTED unit (cavalry / chariot) pays entering
 * that terrain, relative to the terrain's normal (foot) entry cost:
 *
 *   Las (forest)    -> 2         ("koszt x2 -- mocno spowolnione")
 *   Gory (mountains)-> Infinity  ("NIEDOSTEPNE dla kawalerii/rydwanow")
 *   Everything else (incl. Wzgorza "spowolnione" -- no explicit numeric/block
 *   marker -- and unmatched terrain / empty terrainData) -> 1 (no penalty),
 *   so callers can always multiply this straight into the base entry cost.
 */
export function cavalryTerrainMultiplier(
  terrain: TerrainName,
  terrainData: TerrainEntry[],
): number {
  const entry = findTerrainEntry(terrain, terrainData);
  if (!entry) return 1;
  const raw = entry['Kawaleria/Rydwan'];
  if (!raw) return 1;
  const norm = normTerrain(raw);
  if (norm.includes('niedostepne')) return Infinity;
  const match = raw.match(/[x×]\s*(\d+(?:[.,]\d+)?)/i);
  if (match?.[1]) {
    const n = parseFloat(match[1].replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 1;
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

  const hungerMult = opts.armyHungerStatMult ?? 0.75;
  if (opts.attackerArmyHungry) {
    attacker = applyArmyHungerStatMultToCombatUnit(attacker, hungerMult);
  }
  if (opts.defenderArmyHungry) {
    defender = applyArmyHungerStatMultToCombatUnit(defender, hungerMult);
  }

  const goldDeficitMult = opts.goldDeficitStatMult ?? 0.75;
  if (opts.attackerGoldDeficit) {
    attacker = applyGoldDeficitStatMultToCombatUnit(attacker, goldDeficitMult);
  }
  if (opts.defenderGoldDeficit) {
    defender = applyGoldDeficitStatMultToCombatUnit(defender, goldDeficitMult);
  }

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

  const atkDiffMult = opts.attackerDifficultyCombatMult ?? 1;
  const defDiffMult = opts.defenderDifficultyCombatMult ?? 1;

  const atkMelee0 = applyMultiplier(attacker.meleeAttack, atkBaseMods.atk) * atkDiffMult;
  const atkObrona0 = applyMultiplier(attacker.meleeDefence, atkBaseMods.obrona) * atkDiffMult;
  const atkPanc0 = applyMultiplier(attacker.armor, atkBaseMods.pancerz);
  const atkMissile0 = applyMultiplier(attacker.missileAttack ?? 0, atkBaseMods.rangedAtk) * atkDiffMult;

  const defObrona0 = applyMultiplier(defender.meleeDefence, defBaseMods.obrona) * defDiffMult;
  const defMelee0 = applyMultiplier(defender.meleeAttack, defBaseMods.atk) * defDiffMult;
  const defPanc0 = applyMultiplier(defender.armor, defBaseMods.pancerz);
  const defMissile0 = applyMultiplier(defender.missileAttack ?? 0, defBaseMods.rangedAtk) * defDiffMult;

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

  // Terrain: defence multiplier for defender (C-COMBAT-Q2: city defense
  // callers override this via opts.defenderTerrainDefMultOverride -- see doc
  // comment on that field; every other caller keeps the raw, ungated lookup).
  const terrDefMult = opts.defenderTerrainDefMultOverride ?? terrainDefenseMultiplier(defenderTerrain, attacker.rola, terrainData);

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
