/**
 * siegeDefenders.ts — kto broni miasto przy szturmie / zdobyciu (C3-ST-1…3).
 * PURE: bez DOM. Kanon: docs/decyzje/C3-szturm-obrona.md
 */

import type { City } from './cities';
import type { RuntimeUnit } from '../units/setup';
import { collectDefRosterNearCity } from '../units/battleRoster';
import {
  makeMilitia,
  MILITIA_MORALE_FRACTION,
  MILITIA_MORALE_MIN_MARGIN_OVER_FLEE,
  MILITIA_POP_FRACTION,
  MILITIA_ROSTER,
  MILITIA_STRENGTH_FRACTION,
  type SiegeUnit,
} from './siege';
import unitsRaw from '../../data/units.json';

export const GARRISON_BUILDING_ID = 'garnizon';

export type BuildingIdCollection = readonly string[] | ReadonlySet<string>;

export interface CityDefRosterOptions {
  /** Completed building ids; queued production is deliberately not sufficient. */
  completedBuildingIds?: BuildingIdCollection;
  /** Optional queued ids for callers/tests; never consulted as completed state. */
  queuedBuildingIds?: BuildingIdCollection;
  /** Alias for callers whose state adapter names the completed set `builtIds`. */
  builtBuildingIds?: BuildingIdCollection;
  /** Era number (1 Kamien, 2 Braz, 3+ Zelazo) of the CITY OWNER; picks the militia unit types. Default 1. */
  ownerEra?: number;
  /** Override of the units.json rows (tests); default = data/units.json. */
  unitRows?: readonly Record<string, unknown>[];
}

function includesBuilding(
  ids: BuildingIdCollection | undefined,
  buildingId: string,
): boolean {
  if (!ids) return false;
  if ('has' in ids) return ids.has(buildingId);
  return ids.includes(buildingId);
}

/** True only when the completed-building state contains Garnizon. */
export function isGarrisonBuildingCompleted(options?: CityDefRosterOptions): boolean {
  return includesBuilding(
    options?.completedBuildingIds ?? options?.builtBuildingIds,
    GARRISON_BUILDING_ID,
  );
}

/** Jednostki właściciela miasta w promieniu 1 heksa (przy murze / w mieście). */
export function defenderUnitsNearCity(
  city: City,
  units: readonly RuntimeUnit[],
): RuntimeUnit[] {
  return collectDefRosterNearCity(city, units).filter(u => u.ownerId === city.ownerId);
}

/**
 * C3-ST-1: Czy miasto ma kogo bronić przy szturmie?
 * Obrońcy = jednostka właściciela dist≤1 LUB garnizon>0; completed Garnizon
 * additionally contributes virtual militia when eligible population exists.
 * Ludność / populacja bez completed Garnizon ≠ obrońcy.
 */
export function hasCityDefenders(
  city: City,
  units: readonly RuntimeUnit[],
  options?: CityDefRosterOptions,
): boolean {
  if ((city.garnizon ?? 0) > 0) return true;
  if (defenderUnitsNearCity(city, units).length > 0) return true;
  return isGarrisonBuildingCompleted(options) && makeMilitia(city.population ?? 0) !== null;
}

/** C3-ST-2: Szturm może pominąć preBattle / bitwę 3D. */
export function canCaptureCityWithoutBattle(
  city: City,
  units: readonly RuntimeUnit[],
  options?: CityDefRosterOptions,
): boolean {
  return !hasCityDefenders(city, units, options);
}

/** Puste [] ≠ lista ocalałych — wtedy gałąź winner (nie kasuj wszystkich). */
export function survivorsLiveSet(survivors?: ReadonlyArray<{ id: string }>): Set<string> | null {
  if (!survivors || survivors.length === 0) return null;
  return new Set(survivors.map(s => s.id));
}

/** Rekord statów syntetycznej (zbiorczej) Milicji (SS9c) — dla matematyki abstrakcyjnego oblężenia. */
export function militiaDefRecord(m: SiegeUnit): Record<string, unknown> {
  return {
    'Jednostka': 'Milicja',
    meleeAttack: m.Atak,
    meleeDefence: m.Obrona,
    chargeBonus: m.Uderzenie,
    armor: m.Pancerz,
    piercing: m.Przebicie,
    health: m.Health,
    weaponDamage: Math.max(1, m.weaponDamage ?? m.Atak),
    missileAttack: 0,
    'Rola (linia)': m.rola,
    'Prog dezercji (% health)': null,
    'Zasieg ataku (hex)': null,
    'Ilosc pociskow': null,
    'Ruch w bitwie (heksy)': 0,
    'Kara obrony z flanki (%)': 50,
    'Kara obrony z tylu (%)': 80,
    isMilitia: true,
    militiaCount: m.militiaCount ?? 0,
  };
}

export interface VirtualMilitiaUnit extends RuntimeUnit {
  isMilitia: true;
  /** Always 1 — each virtual militiaman is its own battle unit (1 inhabitant = 1 unit). */
  militiaCount: number;
  militiaKind: MilitiaKind;
}

export type MilitiaKind = 'wrecz' | 'dystans';

export interface CityDefRosterResult {
  roster: RuntimeUnit[];
  /** id → def for every virtual militiaman supplied by completed Garnizon. */
  militiaDefs: Map<string, Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Milicja (spec właściciela 2026-11-03, M1–M4) — skład zależny od epoki
// ---------------------------------------------------------------------------

const MELEE_SCALED_KEYS = [
  'meleeAttack', 'meleeDefence', 'weaponDamage', 'chargeBonus', 'armor', 'piercing', 'health',
  'Atak', 'Obrona', 'Uderzenie', 'Pancerz', 'Przebicie', 'Health',
] as const;

const UNIT_ROWS = unitsRaw as unknown as readonly Record<string, unknown>[];

function roundHalfUp(v: number): number {
  return Math.floor(v + 0.5);
}

/** Era number → key of MILITIA_ROSTER (1 Kamień, 2 Brąz, 3+ Żelazo). */
export function militiaEraKey(era: number | undefined): 'kamien' | 'braz' | 'zelazo' {
  const e = Number.isFinite(era) ? Number(era) : 1;
  if (e >= 3) return 'zelazo';
  if (e >= 2) return 'braz';
  return 'kamien';
}

/** Liczba milicjantów = floor(ludność × udział z danych) (dziś 1,0 → 1 mieszkaniec = 1 jednostka). */
export function militiaHeadcount(population: number | undefined): number {
  return Math.floor(Math.max(0, population ?? 0) * MILITIA_POP_FRACTION);
}

/** Podział: połowa wręcz, połowa dystans; nieparzysta → dodatkowa jednostka wręcz. */
export function militiaSplit(count: number): { wrecz: number; dystans: number } {
  const c = Math.max(0, Math.floor(count));
  const wrecz = Math.ceil(c / 2);
  return { wrecz, dystans: c - wrecz };
}

function findUnitRow(
  name: string,
  rows: readonly Record<string, unknown>[],
): Record<string, unknown> | undefined {
  return rows.find(r => r['Jednostka'] === name);
}

/**
 * Definicja jednej jednostki Milicji z wiersza units.json:
 * wręcz = staty × MILITIA_STRENGTH_FRACTION (zaokr. w górę od .5; min 1 gdy oryginał > 0),
 * dystans = PEŁNE staty; w obu przypadkach morale zmniejszone (MILITIA_MORALE_FRACTION)
 * z podłogą 'Morale ucieczki' + margines (żeby jednostka nie była złamana od startu).
 * PURE.
 */
export function buildMilitiaDef(
  row: Readonly<Record<string, unknown>>,
  kind: MilitiaKind,
): Record<string, unknown> {
  const def: Record<string, unknown> = { ...row };
  if (kind === 'wrecz') {
    for (const k of MELEE_SCALED_KEYS) {
      const v = row[k];
      if (typeof v !== 'number' || !Number.isFinite(v)) continue;
      const scaled = roundHalfUp(v * MILITIA_STRENGTH_FRACTION);
      def[k] = v > 0 ? Math.max(1, scaled) : v;
    }
  }
  const base = row['Morale bazowe'];
  const flee = row['Morale ucieczki'];
  if (typeof base === 'number' && Number.isFinite(base)) {
    const fleeN = typeof flee === 'number' && Number.isFinite(flee) ? flee : 0;
    const floor = fleeN + MILITIA_MORALE_MIN_MARGIN_OVER_FLEE;
    def['Morale bazowe'] = Math.min(base, Math.max(roundHalfUp(base * MILITIA_MORALE_FRACTION), floor));
  }
  // fieldPower to cache mocy z eksportu — musi być przeliczony z nowych statów.
  delete def['fieldPower'];
  def['isMilitia'] = true;
  def['militiaKind'] = kind;
  return def;
}

export interface MilitiaSquadMember {
  /** units.json name (model / ikona odpowiednika). */
  typeId: string;
  kind: MilitiaKind;
  def: Record<string, unknown>;
}

/**
 * Skład Milicji miasta: lista pojedynczych milicjantów (najpierw wręcz, potem dystans).
 * Typy wg epoki właściciela (MILITIA_ROSTER). Brak wiersza w danych → najbliższy odpowiednik
 * (Wojownik / Oszczepnik). PURE.
 */
export function buildMilitiaSquad(
  population: number | undefined,
  ownerEra: number | undefined,
  rows: readonly Record<string, unknown>[] = UNIT_ROWS,
): MilitiaSquadMember[] {
  const count = militiaHeadcount(population);
  if (count <= 0) return [];
  const names = MILITIA_ROSTER[militiaEraKey(ownerEra)];
  const { wrecz, dystans } = militiaSplit(count);
  const meleeRow = findUnitRow(names.wrecz, rows) ?? findUnitRow('Wojownik', rows);
  const rangedRow = findUnitRow(names.dystans, rows) ?? findUnitRow('Oszczepnik', rows);
  const out: MilitiaSquadMember[] = [];
  if (meleeRow) {
    const def = buildMilitiaDef(meleeRow, 'wrecz');
    for (let i = 0; i < wrecz; i++) {
      out.push({ typeId: String(meleeRow['Jednostka']), kind: 'wrecz', def: { ...def } });
    }
  }
  if (rangedRow) {
    const def = buildMilitiaDef(rangedRow, 'dystans');
    for (let i = 0; i < dystans; i++) {
      out.push({ typeId: String(rangedRow['Jednostka']), kind: 'dystans', def: { ...def } });
    }
  }
  return out;
}

/** True dla wirtualnego milicjanta (nie istnieje w units[], nie maszeruje). */
export function isMilitiaUnit(u: { id?: unknown }): u is VirtualMilitiaUnit {
  return (u as { isMilitia?: unknown }).isMilitia === true;
}

/**
 * Obrońcy miasta (C1-Q4 / C3-ST-1 + M2): jednostki dist≤1 ORAZ — przy ukończonym budynku
 * Garnizon — Milicja (1 mieszkaniec = 1 jednostka), ZAWSZE jako wsparcie realnych obrońców
 * (dołącza także gdy w mieście są jednostki wojskowe). PURE — caller rejestruje militiaDefs
 * w silniku przed unitDefFor.
 */
export function collectCityDefRoster(
  city: City,
  units: readonly RuntimeUnit[],
  options?: CityDefRosterOptions,
): CityDefRosterResult {
  const roster = defenderUnitsNearCity(city, units);
  const militiaDefs = new Map<string, Record<string, unknown>>();
  if (!isGarrisonBuildingCompleted(options)) return { roster, militiaDefs };

  const squad = buildMilitiaSquad(city.population, options?.ownerEra, options?.unitRows ?? UNIT_ROWS);
  if (squad.length === 0) return { roster, militiaDefs };

  const virtual: VirtualMilitiaUnit[] = squad.map((m, i) => {
    const id = 'militia-' + city.id + '-' + i;
    militiaDefs.set(id, m.def);
    return {
      id,
      ownerId: city.ownerId,
      typeId: m.typeId,
      category: 'domyslny',
      q: city.q,
      r: city.r,
      ruch: 0,
      ruchLeft: 0,
      isMilitia: true,
      militiaCount: 1,
      militiaKind: m.kind,
    };
  });
  return { roster: [...roster, ...virtual], militiaDefs };
}

/** Ile wirtualnych milicjantów jest w składzie. */
export function countMilitia(defRoster: readonly RuntimeUnit[]): number {
  return defRoster.filter(isMilitiaUnit).length;
}

/**
 * Polegli milicjanci → ludność maleje o ich liczbę (min. 1 mieszkaniec zostaje).
 * `fallenIds` = ids wirtualnych milicjantów, którzy zginęli. Zwraca faktyczny ubytek ludności.
 * Mutuje city.population. PURE poza tą mutacją.
 */
export function applyMilitiaPopulationLoss(
  city: City,
  defRoster: readonly RuntimeUnit[],
  fallenIds: ReadonlySet<string>,
): number {
  const fallen = defRoster.filter(u => isMilitiaUnit(u) && fallenIds.has(String(u.id))).length;
  if (fallen <= 0) return 0;
  const before = Math.max(0, city.population ?? 0);
  const after = Math.max(1, before - fallen);
  const loss = Math.max(0, before - after);
  city.population = after;
  return loss;
}

export interface FallenMilitiaInput {
  /** Manual 3D result: survivors list (`undefined` = auto battle). */
  survivors?: ReadonlyArray<{ id: string | number; hp?: number }>;
  /** Defender ids present in the battle event log (`null`/absent = legacy: no log filter). */
  loggedDefenderIds?: ReadonlySet<string> | null;
  /** Auto battle: ids marked dead by the loss-percentage distribution. */
  autoDeadIds?: ReadonlySet<string>;
}

/**
 * Ids of fallen virtual militiamen. Same semantics as post-battle-map.ts: a PARTIAL event
 * log is a partial result, so a militiaman missing from the log is NOT inferred dead.
 * Manual: dead = logged and absent from `survivors` (or hp <= 0). Auto: `autoDeadIds`.
 */
export function fallenMilitiaIds(
  defRoster: readonly RuntimeUnit[],
  input: FallenMilitiaInput,
): Set<string> {
  const fallen = new Set<string>();
  const logged = input.loggedDefenderIds ?? null;
  const live = input.survivors
    ? new Map(input.survivors.map(sv => [String(sv.id), sv.hp] as const))
    : null;
  for (const m of defRoster) {
    if (!isMilitiaUnit(m)) continue;
    const id = String(m.id);
    if (logged && !logged.has(id)) continue;
    if (live) {
      if (!live.has(id) || (live.get(id) ?? 1) <= 0) fallen.add(id);
    } else if (input.autoDeadIds?.has(id)) {
      fallen.add(id);
    }
  }
  return fallen;
}

/** Tytuł strony obrońcy w preBattle (miasto otwarte / szturm). */
export function defenderSideTitle(city: City, defRoster: readonly RuntimeUnit[]): string {
  if (defRoster.length === 0) return 'Brak';
  const militia = countMilitia(defRoster);
  const real = defRoster.length - militia;
  if (militia > 0 && real === 0) return 'Milicja (' + militia + ')';
  if (militia > 0) {
    return (real > 1 ? 'Garnizon (' + real + ')' : defRoster.find(u => !isMilitiaUnit(u))!.typeId)
      + ' + Milicja (' + militia + ')';
  }
  const lead = defRoster[0]!;
  return defRoster.length > 1 ? 'Garnizon (' + defRoster.length + ')' : lead.typeId;
}
