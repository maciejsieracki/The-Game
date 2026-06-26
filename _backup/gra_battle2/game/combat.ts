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
 * Snapshot of a unit's stats used inside combat.
 * Matches the real field names from data/units.json.
 * All optional numeric fields may be missing for non-combat units.
 */
export interface CombatUnit {
  /** "Jednostka" field in units.json - unit type name. */
  typNazwa: string;

  /** "Rola (linia)" field: 'Wrecz' | 'Dystans' | 'Flanka' | 'Wsparcie' | 'Morska' */
  rola: string;

  /** "Atak" stat - determines hit chance. */
  Atak: number;

  /** "Obrona" stat - determines dodge/defense side of hit chance. */
  Obrona: number;

  /** "Uderzenie" stat - charge bonus added to damage in round 1 of melee. */
  Uderzenie: number;

  /** "Pancerz" stat - reduces incoming damage. */
  Pancerz: number;

  /** "Przebicie" stat - armour penetration; bypasses Pancerz in damage formula. */
  Przebicie: number;

  /** "Health" stat - max HP. Also the starting HP for this combat instance. */
  Health: number;

  /** "Prog dezercji (% health)" - rout threshold as a fraction [0..1], e.g. 0.25. */
  'Prog dezercji (% health)': number | null;

  /** "Atak dystansowy" stat - ranged attack value; 0 for melee units. */
  'Atak dystansowy': number;

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
// SS5l Core formula functions (exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * hitChance(atk, def) per SS5l:
 *   clamp(50 + (Atak - Obrona) * 5, 10, 90)
 *
 * Returns a value in [10, 90] (integer percentage).
 * A roll of rng()*100 < hitChance means the attack hits.
 */
export function hitChance(atk: number, def: number): number {
  const raw = 50 + (atk - def) * 5;
  return Math.max(10, Math.min(90, raw));
}

/**
 * baseDamage(atk, panc, przeb, uderzenie, isChargeRound) per SS5l:
 *   max(1, Atak - Pancerz + Przebicie) + (isChargeRound ? Uderzenie : 0)
 *
 * Minimum 1 damage always; charge bonus (Uderzenie) added on top in R1.
 */
export function baseDamage(
  atk: number,
  panc: number,
  przeb: number,
  uderzenie: number,
  isChargeRound: boolean,
): number {
  const base = Math.max(1, atk - panc + przeb);
  return base + (isChargeRound ? uderzenie : 0);
}

/**
 * rangeDamage per SS5l phase 1:
 *   max(1, Atak_dystansowy - Pancerz_celu)
 *
 * Used during the ranged phase only.
 */
export function rangeDamage(atkDystansowy: number, pancCelu: number): number {
  return Math.max(1, atkDystansowy - pancCelu);
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
      return 1.5;
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
  return entry ? 0.75 : 1.0;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function routThreshold(unit: CombatUnit): number {
  const pct = unit['Prog dezercji (% health)'];
  if (pct === null || pct === undefined) return 0;
  return pct * unit.Health;
}

function resolveAmmo(unit: CombatUnit, override?: number): number {
  if (override !== undefined) return override;
  const raw = unit['Ilosc pociskow'];
  if (raw === null || raw === undefined || raw === '---' || raw === '') return 0;
  return typeof raw === 'string' ? parseInt(raw, 10) : raw;
}

function isRangedUnit(unit: CombatUnit): boolean {
  return (unit['Atak dystansowy'] ?? 0) > 0;
}

/** Spear/phalanx-type units that negate attacker charge when bracing. */
function negatesCharge(unit: CombatUnit): boolean {
  const n = unit.typNazwa.toLowerCase();
  return (
    n.includes('wlocznik') ||
    n.includes('włócznik') ||
    n.includes('falanga') ||
    n.includes('impi') ||
    n.includes('wloczn')
  );
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
  const rng = opts.rng ?? (() => Math.random());
  const position: AttackerPosition = opts.attackerPosition ?? 'front';
  const maxRounds = opts.maxRounds ?? 30;
  const attackerMoved = opts.attackerMoved ?? true;
  const counters = opts.counters ?? [];
  const terrainData = opts.terrainData ?? [];
  const defenderTerrain = opts.defenderTerrain ?? '';

  const log: string[] = [];
  const routed: ('attacker' | 'defender')[] = [];

  let hpAtk = attacker.Health;
  let hpDef = defender.Health;

  let ammoAtk = resolveAmmo(attacker, opts.attackerAmmo);
  let ammoDef = resolveAmmo(defender, opts.defenderAmmo);

  const routAtk = routThreshold(attacker);
  const routDef = routThreshold(defender);

  let totalRounds = 0;

  // --- Pre-compute shared modifiers ---

  // Flank/rear penalty reduces defender's effective Obrona
  const defPenaltyFrac = flankRearDefensePenalty(defender, position);
  const defEffObrona = Math.max(0, defender.Obrona * (1 - defPenaltyFrac));

  // Counter multipliers
  const ctrAtkVsDef = counterMultiplier(attacker.typNazwa, defender.typNazwa, counters);
  const ctrDefVsAtk = counterMultiplier(defender.typNazwa, attacker.typNazwa, counters);

  // Terrain: defence multiplier for defender
  const terrDefMult = terrainDefenseMultiplier(defenderTerrain, attacker.rola, terrainData);

  // Terrain: river attack penalty for attacker
  const terrRiverMult = terrainRiverAttackMultiplier(defenderTerrain, terrainData);

  // Final effective stats
  const atkEffAtak = attacker.Atak * terrRiverMult;
  const defFinalObrona = defEffObrona * terrDefMult;

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
        const atkDyst = attacker['Atak dystansowy'] * terrRiverMult;
        const hitPct = hitChance(atkEffAtak, defFinalObrona);
        const roll = rng() * 100;
        if (roll < hitPct) {
          const dmg = Math.round(rangeDamage(atkDyst, defender.Pancerz) * ctrAtkVsDef);
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
        const defDyst = defender['Atak dystansowy'];
        const hitPct = hitChance(defender.Atak, attacker.Obrona);
        const roll = rng() * 100;
        if (roll < hitPct) {
          const dmg = Math.round(rangeDamage(defDyst, attacker.Pancerz) * ctrDefVsAtk);
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

      if (meleeRound === 1 && defBracing) {
        log.push('R1[Zwarcie] Szarza zanegowana przez postawe odpierajaca!');
      }

      // Attacker hits defender
      const atkHitPct = hitChance(atkEffAtak, defFinalObrona);
      const atkRoll = rng() * 100;
      if (atkRoll < atkHitPct) {
        const rawDmg = baseDamage(
          attacker.Atak,
          defender.Pancerz,
          attacker.Przebicie,
          attacker.Uderzenie,
          isCharge,
        );
        const finalDmg = Math.round(rawDmg * ctrAtkVsDef);
        hpDef -= finalDmg;
        log.push(
          `R${totalRounds}[${phaseLabel}] ATK trafia (${atkRoll.toFixed(1)}<${atkHitPct}%) -> ${finalDmg} obra${isCharge ? ' (+Uderzenie)' : ''}. Obronca HP: ${hpDef}`,
        );
      } else {
        log.push(
          `R${totalRounds}[${phaseLabel}] ATK chybia (${atkRoll.toFixed(1)}>=${atkHitPct}%).`,
        );
      }

      // Defender counter-attacks simultaneously
      const defHitPct = hitChance(defender.Atak, attacker.Obrona);
      const defRoll = rng() * 100;
      if (defRoll < defHitPct) {
        const rawDmg = baseDamage(
          defender.Atak,
          attacker.Pancerz,
          defender.Przebicie,
          0,     // defender never charges back
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
