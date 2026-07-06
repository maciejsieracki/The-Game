/**
 * testBattle.ts
 *
 * DATA + builder for the "T"-key TEST BATTLE (the watched auto-battle).
 *
 * Master's decision (B9): the test-battle COMPOSITION lives in the BATTLE lane,
 * not in main.ts. This module owns:
 *   - a small, readable block of PRESETS (named army compositions + terrain), and
 *   - buildTestArmies(units, preset?) which turns a preset into the two armies
 *     (BattleUnit[] each) that battleScene.ts consumes.
 *
 * battleScene.ts calls buildTestArmies() as a BRIDGE: main.ts still hands the
 * scene its canned 4 Legionista vs 4 Falanga roster on "T"; the scene detects
 * that canned signature and rebuilds BOTH armies from the DEFAULT preset here,
 * so "T" works without touching main.ts. (SILNIK can later make main.ts call
 * buildTestArmies() directly in one line -- out of this lane.)
 *
 * NO THREE.js / DOM here -- pure data + lookups, so it is trivially testable and
 * shares nothing with the renderer. Unit NAMES are the exact "Jednostka" strings
 * from data/units.json (verified); the model CATEGORY is derived the same way as
 * units/setup.ts::categoryOf so battle figures match the world-map look.
 *
 * ASCII-only source file.
 */

import type { BattleUnit } from './battleScene';

// ---------------------------------------------------------------------------
// Tunable counts
// ---------------------------------------------------------------------------

/**
 * Main-infantry count per side for the DEFAULT "rzym_grecja" clash. Bump this
 * one constant to scale the headline battle (20 => 60 per side / 120 total with
 * the three infantry blocks below). Kept obvious + named so it is trivially
 * tunable. The battlefield (battleScene.ts) is sized for up to 60 per side.
 */
export const MAIN_INFANTRY_COUNT = 40;

// ---------------------------------------------------------------------------
// Preset definitions (DATA)
// ---------------------------------------------------------------------------

/** One block of identical units on one side: a unit type + how many. */
export interface PresetBlock {
  /** Exact "Jednostka" name from data/units.json. */
  unitTypeId: string;
  /** How many of this unit to field in this block. */
  count: number;
}

/** A full preset: a human label, the terrain name, and each side's blocks. */
export interface BattlePreset {
  /** Short human label shown in logs / reports. */
  label: string;
  /** Terrain name handed to the combat resolver + the terrain seed. */
  teren: string;
  /** Attacker (left, front faces EAST) blocks. */
  attacker: PresetBlock[];
  /** Defender (right, front faces WEST) blocks. */
  defender: PresetBlock[];
  /** Nazwa cywilizacji atakujacego (pasek mocy HUD). */
  attackerCivLabel?: string;
  /** Nazwa cywilizacji broniacego (pasek mocy HUD). */
  defenderCivLabel?: string;
  attackerCivIconId?: string;
  defenderCivIconId?: string;
}

/** The preset keys understood by buildTestArmies(). */
export type PresetName = 'maly' | 'duzy' | 'rzym_grecja' | 'konnica' | 'oblezenie' | 'maciej_playtest';

/** The DEFAULT preset used by the "T" battle when none is named. */
export const DEFAULT_PRESET: PresetName = 'rzym_grecja';

/**
 * PRESETS -- the test-battle compositions. Unit names are the exact
 * "Jednostka" keys from data/units.json (all verified present):
 *   Legionista, Falanga, Oszczepnik, Wlocznik ("Wlocznik"), Lucznik
 *   ("Lucznik"), Konnica, Rydwan konny.
 */
export const PRESETS: Readonly<Record<PresetName, BattlePreset>> = {
  // 4 vs 4 -- quick sanity clash (Rome vs Greece lead infantry).
  maly: {
    label: 'Maly bój: Legion vs Falanga (4 vs 4)',
    teren: 'Rownina',
    attackerCivLabel: 'Rzymianie',
    defenderCivLabel: 'Grecy',
    attackerCivIconId: 'rzymianie',
    defenderCivIconId: 'grecy',
    attacker: [{ unitTypeId: 'Hastati', count: 4 }],
    defender: [{ unitTypeId: 'Falanga', count: 4 }],
  },

  // The previous big test battle: 20 Legionista + 10 Oszczepnik + 10 Lucznik
  // per side (40 per side, 80 total).
  duzy: {
    label: 'Duza bitwa: 40 vs 40 (mieszane linie)',
    teren: 'Rownina',
    attackerCivLabel: 'Rzymianie',
    defenderCivLabel: 'Grecy',
    attackerCivIconId: 'rzymianie',
    defenderCivIconId: 'grecy',
    attacker: [
      { unitTypeId: 'Hastati', count: 20 },
      { unitTypeId: 'Oszczepnik', count: 10 },
      { unitTypeId: 'Lucznik',    count: 10 },
    ],
    defender: [
      { unitTypeId: 'Hastati', count: 20 },
      { unitTypeId: 'Oszczepnik', count: 10 },
      { unitTypeId: 'Lucznik',    count: 10 },
    ],
  },

  // DEFAULT -- Rzym vs Grecja, 60 per side / 120 total.
  //   GRECJA  = 20 Falanga    + 20 Oszczepnik + 20 Lucznik
  //   RZYM    = 20 Legionista + 20 Oszczepnik + 20 Lucznik
  // The lead-infantry count (Falanga / Legionista) is MAIN_INFANTRY_COUNT so
  // the headline battle scales from one obvious constant. The third block is
  // Lucznik (archers) so the test fields ranged shooters behind the line (the
  // human wants archers in the test, not spearmen). Name "Lucznik" is the
  // accent-stripped form of units.json "Łucznik" -- findUnitRow normalises both.
  rzym_grecja: {
    label: 'Rzym vs Grecja: 64 vs 64 (128 jednostek)',
    teren: 'Rownina',
    attackerCivLabel: 'Rzymianie',
    defenderCivLabel: 'Grecy',
    attackerCivIconId: 'rzymianie',
    defenderCivIconId: 'grecy',
    // RZYM is the ATTACKER (left), GRECJA the DEFENDER (right).
    //   - 20 lead infantry (Legionista / Falanga) + 20 Oszczepnik + 20 Lucznik
    //     (archers), per the human's "archers in the test" request.
    //   - 2 Konnica + 2 Rydwan konny per side; battleScene's arrangeFlankCavalry
    //     pulls mounted units onto the FRONT-rank WINGS (top & bottom rows), so
    //     the horse/chariots sit on the flanks regardless of block order here.
    attacker: [
      { unitTypeId: 'Hastati',   count: MAIN_INFANTRY_COUNT },
      { unitTypeId: 'Oszczepnik',   count: 20 },
      { unitTypeId: 'Lucznik',      count: 20 },
      { unitTypeId: 'Konnica',      count: 2 },
      { unitTypeId: 'Rydwan konny', count: 2 },
    ],
    defender: [
      { unitTypeId: 'Falanga',      count: MAIN_INFANTRY_COUNT },
      { unitTypeId: 'Oszczepnik',   count: 20 },
      { unitTypeId: 'Lucznik',      count: 20 },
      { unitTypeId: 'Konnica',      count: 2 },
      { unitTypeId: 'Rydwan konny', count: 2 },
    ],
  },

  // Cavalry / chariot-heavy clash to showcase mounted units, with a thin
  // infantry anvil so the horse has something to hammer. ~36 per side.
  konnica: {
    label: 'Starcie konnicy: rydwany + jazda',
    teren: 'Rownina',
    attacker: [
      { unitTypeId: 'Rydwan konny', count: 8 },
      { unitTypeId: 'Konnica',      count: 16 },
      { unitTypeId: 'Wlocznik',     count: 12 },
    ],
    defender: [
      { unitTypeId: 'Rydwan konny', count: 8 },
      { unitTypeId: 'Konnica',      count: 16 },
      { unitTypeId: 'Wlocznik',     count: 12 },
    ],
  },
  // Preset oblezniczy: 40 Legionistow atakuje miasto bronione przez 10 Falangow na murze.
  //   ATAKUJACY: 40 Legionistow (wrecz, atak u podnozy muru)
  //   OBRONCA:   10 Falangow (wrecz, stawiani NA koronie muru przez _placeSiegeDefenders)
  // Mur cywilizacji: 'rzym' (domyslna). Bez machin -- obronca +200% bonus muru.
  // Preset oblezniczy: atak machinami (Katapulta, Taran, Wieza obleznicza) + piechota.
  // Obroncy: Falangici (melee, na koronie muru) + Lucznicy (dystansowi, rowniez na murze).
  // Kluze units.json: 'Hastati', 'Katapulta', 'Taran', 'Wieza obleznicza',
  //                   'Falanga', 'Łucznik' (z diakretykiem -- findUnitRow normalizuje).
  oblezenie: {
    label: 'Oblezenie: Legion+Machiny vs Hastati+Lucznicy+Katapulty na murze',
    teren: 'Rownina',
    attacker: [
      { unitTypeId: 'Hastati',            count: 20 },
      { unitTypeId: 'Katapulta',         count: 10 },
      { unitTypeId: 'Taran',             count: 1  },
      { unitTypeId: 'Wieża oblężnicza',  count: 2  },
    ],
    defender: [
      { unitTypeId: 'Hastati',           count: 20 },
      { unitTypeId: 'Łucznik',           count: 20 },
      { unitTypeId: 'Katapulta',         count: 10 },
    ],
  },

  // Playtest Maciej 2026-07-04: 110 vs 110 — roster 6×N + scroll.
  //   RZYM: 60 Hastati + 30 Lucznik + 20 Konnica
  //   GRECJA: 60 Falanga + 30 Lucznik + 20 Konnica
  maciej_playtest: {
    label: 'Playtest Maciej: 110 vs 110 (Hastati/Falanga+Lucznik+Konnica)',
    teren: 'Rownina',
    attackerCivLabel: 'Rzymianie',
    defenderCivLabel: 'Grecy',
    attackerCivIconId: 'rzymianie',
    defenderCivIconId: 'grecy',
    attacker: [
      { unitTypeId: 'Hastati', count: 60 },
      { unitTypeId: 'Łucznik', count: 30 },
      { unitTypeId: 'Konnica', count: 20 },
    ],
    defender: [
      { unitTypeId: 'Falanga', count: 60 },
      { unitTypeId: 'Łucznik', count: 30 },
      { unitTypeId: 'Konnica', count: 20 },
    ],
  },
};

// ---------------------------------------------------------------------------
// Lookups / category mapping
// ---------------------------------------------------------------------------

/** Lowercase + strip Polish diacritics so name matching is accent-tolerant. */
function normalizeForMatch(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[łŁ]/g, 'l') // l with stroke -> l
    .toLowerCase()
    .trim();
}

/**
 * Model CATEGORY key for a unit, mirroring units/setup.ts::categoryOf so the
 * battle figures pick up the same per-line / per-culture models as the world
 * map. Kept self-contained (setup.ts is out of this lane / read-only) and
 * limited to the categories the presets can produce, with a safe 'domyslny'
 * fallback for anything else.
 */
function categoryFor(name: string, role: string, isSuper: boolean): string {
  if (isSuper) return 'super';
  const n = normalizeForMatch(name);
  const r = normalizeForMatch(role);
  if (n.includes('osadnik') || r.includes('osadnik')) return 'osadnik';
  if (n.includes('robotnik') || n.includes('worker') || r.includes('robotnik')) return 'robotnik';
  if (n.includes('zwiadowca') || n.includes('scout') || r.includes('zwiadowca')) return 'zwiadowca';
  if (n.includes('galera') || n.includes('galley') || r.includes('morsk')) return 'galera';
  if (n.includes('rydwan') || n.includes('chariot') || r.includes('rydwan')) return 'rydwan';
  const konnicaKw = ['konnic', 'jezdz', 'jazd', 'kawaler', 'rycerz', 'cavalry', 'horse'];
  if (konnicaKw.some(kw => n.includes(kw) || r.includes(kw))) return 'konnica';
  if (n.includes('falanga') || n.includes('hoplit') || n.includes('phalanx')) return 'falanga';
  if (n.includes('legionist')) return 'legionista';
  const wloczKw = ['wloczn', 'pikinier', 'spear', 'impi'];
  if (wloczKw.some(kw => n.includes(kw) || r.includes(kw))) return 'wlocznik';
  const mieczKw = ['miecz', 'sword', 'gladi', 'khopesh'];
  if (mieczKw.some(kw => n.includes(kw) || r.includes(kw))) return 'miecznik';
  const luczKw = ['luczn', 'archer', 'kusznik', 'crossbow'];
  if (luczKw.some(kw => n.includes(kw) || r.includes(kw))) return 'lucznik';
  const procarKw = ['procarz', 'sling'];
  if (procarKw.some(kw => n.includes(kw) || r.includes(kw))) return 'procarz';
  const oszczepKw = ['oszczep', 'javelin', 'atlatl', 'estolic'];
  if (oszczepKw.some(kw => n.includes(kw) || r.includes(kw))) return 'oszczepnik';
  const maczugKw = ['maczug', 'chaska', 'club', 'mace'];
  if (maczugKw.some(kw => n.includes(kw) || r.includes(kw))) return 'maczuga';
  const toporKw = ['topor', 'axe'];
  if (toporKw.some(kw => n.includes(kw) || r.includes(kw))) return 'topor';
  return 'domyslny';
}

/** Accent/spacing-tolerant lookup of a units.json row by its "Jednostka" name. */
function findUnitRow(units: ReadonlyArray<any>, name: string): any | null {
  if (!Array.isArray(units)) return null;
  const want = normalizeForMatch(name);
  for (const u of units) {
    if (normalizeForMatch(String(u?.['Jednostka'] ?? '')) === want) return u;
    if (normalizeForMatch(String(u?.['Nazwa EN'] ?? '')) === want) return u;
  }
  return null;
}

/** Numeric coercion with a fallback for the dash/blank sentinels in the data. */
function num(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === '' || v === '-' || v === '---' || v === '—') return fallback;
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

/** Max HP from units.json row (TW `health`, fallback legacy `Health`), min 1. */
function rowHealth(row: any): number {
  return Math.max(1, Math.round(num(row?.health ?? row?.['Health'], 10)));
}

// ---------------------------------------------------------------------------
// Army builder
// ---------------------------------------------------------------------------

/** The two armies produced from a preset, ready for battleScene's BattleOpts. */
export interface TestArmies {
  attacker: BattleUnit[];
  defender: BattleUnit[];
  /** Terrain name to pass through as BattleOpts.teren. */
  teren: string;
  /** Human label for the matchup (logs / hint). */
  label: string;
  attackerCivLabel?: string;
  defenderCivLabel?: string;
  attackerCivIconId?: string;
  defenderCivIconId?: string;
}

/** Standard side colours: attacker = warm gold (Rome), defender = blue (Greece). */
const ATK_COLOR = 0xffd54a;
const DEF_COLOR = 0x4060c8;

/**
 * Build one side's BattleUnit[] from its preset blocks, looking up real stats
 * from `units` (the data/units.json array). Unknown unit names are skipped
 * (never crash the test) and reported via the returned `missing` set.
 */
function buildSide(
  blocks: ReadonlyArray<PresetBlock>,
  units: ReadonlyArray<any>,
  idPrefix: string,
  color: number,
  missing: Set<string>,
): BattleUnit[] {
  const out: BattleUnit[] = [];
  let n = 0;
  for (const block of blocks) {
    const row = findUnitRow(units, block.unitTypeId);
    if (!row) { missing.add(block.unitTypeId); continue; }
    // BATTLE DISPLAY in English: show the canonical EN name, fall back to the
    // Polish "Jednostka" (which is also the cross-lane matching key).
    const displayName = String(row['Nazwa EN'] ?? row['Jednostka'] ?? block.unitTypeId);
    const role = String(row['Rola (linia)'] ?? '');
    const isSuper = row['Super-jednostka'] === 'TAK';
    // Model CATEGORY is derived from the POLISH "Jednostka" name (stable model
    // key shared with the world map); the EN displayName is only for show.
    const plName = String(row['Jednostka'] ?? block.unitTypeId);
    const kategoria = categoryFor(plName, role, isSuper);
    const hp = rowHealth(row);
    for (let i = 0; i < block.count; i++) {
      out.push({
        id:         idPrefix + (n++),
        nazwa:      displayName,
        kategoria,
        ownerColor: color,
        stats:      row,
        hp,
        maxHp:      hp,
      });
    }
  }
  return out;
}

/**
 * Build the two test armies for `preset` (default DEFAULT_PRESET = "rzym_grecja")
 * using the supplied data/units.json rows for stats.
 *
 * @param units  The data.units array (raw units.json rows). Required for stats.
 * @param preset Preset name; falls back to the default for unknown values.
 */
export function buildTestArmies(
  units: ReadonlyArray<any>,
  preset: PresetName = DEFAULT_PRESET,
): TestArmies {
  const def = PRESETS[preset] ?? PRESETS[DEFAULT_PRESET];
  const missing = new Set<string>();
  const attacker = buildSide(def.attacker, units ?? [], 'atk', ATK_COLOR, missing);
  const defender = buildSide(def.defender, units ?? [], 'def', DEF_COLOR, missing);
  if (missing.size > 0) {
    // Non-fatal: log which preset unit names were not found in units.json.
    try {
      // eslint-disable-next-line no-console
      console.warn('[testBattle] unit names not found in units.json:', Array.from(missing).join(', '));
    } catch (_) { /* console may be absent in some harnesses */ }
  }
  return {
    attacker,
    defender,
    teren: def.teren,
    label: def.label,
    attackerCivLabel: def.attackerCivLabel,
    defenderCivLabel: def.defenderCivLabel,
    attackerCivIconId: def.attackerCivIconId,
    defenderCivIconId: def.defenderCivIconId,
  };
}

/** Total unit count a preset fields across both sides (for sizing / sanity). */
export function presetTotalUnits(preset: PresetName = DEFAULT_PRESET): number {
  const def = PRESETS[preset] ?? PRESETS[DEFAULT_PRESET];
  const sum = (bs: ReadonlyArray<PresetBlock>) => bs.reduce((a, b) => a + b.count, 0);
  return sum(def.attacker) + sum(def.defender);
}

function attackerHasCatapult(units: ReadonlyArray<BattleUnit>): boolean {
  for (const u of units) {
    const n = normalizeForMatch(String(u.nazwa ?? ''));
    const j = normalizeForMatch(String(u.stats?.['Jednostka'] ?? ''));
    if (n.includes('katapult') || n.includes('catapult') || n.includes('onager')
      || j.includes('katapult') || j.includes('catapult')) return true;
  }
  return false;
}

/**
 * Gdy obl\u0119\u017Cenie bez katapult w armii \u2014 do\u0142\u0105cz machiny z presetu oblezenie
 * (Katapulta + Taran). Mur niszczy tylko katapulta; bez niej scenariusz jest martwy.
 */
export function ensureSiegeMachines(armies: TestArmies, units: ReadonlyArray<any>): TestArmies {
  if (attackerHasCatapult(armies.attacker)) return armies;
  const missing = new Set<string>();
  const siegeBlocks = PRESETS.oblezenie.attacker.filter(b =>
    b.unitTypeId === 'Katapulta' || b.unitTypeId === 'Taran',
  );
  const extras = buildSide(siegeBlocks, units ?? [], 'atk', ATK_COLOR, missing);
  if (extras.length === 0) return armies;
  return {
    ...armies,
    attacker: [...armies.attacker, ...extras],
    label: armies.label + ' (+ machiny obleznicze)',
  };
}
