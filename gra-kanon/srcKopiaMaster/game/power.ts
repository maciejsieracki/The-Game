/**
 * power.ts
 * Składniki Potęgi z domeny miasto/ekonomia (B-Power-Q1=A, Q2=B, Q3=A).
 * PURE — lane EKONOMIA. Agregacja → SILNIK → computePotegaNacji().
 */

export interface PowerContributionsCityEconomy {
  /** Ludność absolutna imperium, znorm. [0,1]. */
  ludnosc:    number;
  /** Pula rekrutów (Manpower), znorm. [0,1]. */
  rekruci:    number;
  miasta:     number;
  gospodarka: number;
}

/** Snapshot imperium na koniec tury (jeden wiersz per owner). */
export interface PowerOwnerSnapshot {
  ownerId:           number;
  /** Suma ludków (1–10) — fallback gdy brak pól poboru. */
  population:        number;
  cityCount:         number;
  territoryHexCount: number;
  /** Przyrost Pieniądz/t (średnia z ostatnich tur lub bieżąca). */
  pieniadzPerTurn:   number;
  /** Suma ludności absolutnej imperium (ludzie). */
  ludnoscAbsolutna?: number;
  /** Suma puli rekrutów (Manpower bieżący). */
  rekruci?:          number;
}

function ludnoscRaw(s: PowerOwnerSnapshot): number {
  if (s.ludnoscAbsolutna !== undefined) return s.ludnoscAbsolutna;
  return s.population;
}

function rekruciRaw(s: PowerOwnerSnapshot): number {
  return s.rekruci ?? 0;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function maxOf(all: ReadonlyArray<PowerOwnerSnapshot>, pick: (s: PowerOwnerSnapshot) => number): number {
  let m = 0;
  for (const s of all) m = Math.max(m, pick(s));
  return m;
}

/**
 * Normalizacja składników 0..1 wg decyzji Macieja 2026-06-27.
 * @param owner — imperium liczone
 * @param all   — wszyscy gracze na mapie (AI + human)
 */
export function computePowerContributionsCityEconomy(
  owner: PowerOwnerSnapshot,
  all:   ReadonlyArray<PowerOwnerSnapshot>,
): PowerContributionsCityEconomy {
  if (all.length === 0) {
    return { ludnosc: 0, rekruci: 0, miasta: 0, gospodarka: 0 };
  }

  const maxCities = Math.max(maxOf(all, s => s.cityCount), 1);
  const maxHex  = Math.max(maxOf(all, s => s.territoryHexCount), 1);
  const maxGdp  = Math.max(maxOf(all, s => s.pieniadzPerTurn), 1);
  const maxLudnosc = Math.max(maxOf(all, ludnoscRaw), 1);
  const maxRekruci = Math.max(maxOf(all, rekruciRaw), 1);

  const ludnosc = clamp01(ludnoscRaw(owner) / maxLudnosc);
  const rekruci = clamp01(rekruciRaw(owner) / maxRekruci);

  const cityPart = clamp01(owner.cityCount / maxCities);
  const hexPart  = clamp01(owner.territoryHexCount / maxHex);
  const miasta   = clamp01(0.5 * cityPart + 0.5 * hexPart);

  const gospodarka = clamp01(owner.pieniadzPerTurn / maxGdp);

  return { ludnosc, rekruci, miasta, gospodarka };
}

/** Buduje snapshot z listy miast (helper dla SILNIK). */
export function buildPowerSnapshots(
  rows: ReadonlyArray<{
    ownerId: number;
    population: number;
    cityCount?: number;
    territoryHexCount?: number;
    pieniadzPerTurn?: number;
    ludnoscAbsolutna?: number;
    rekruci?: number;
  }>,
): PowerOwnerSnapshot[] {
  const byOwner = new Map<number, PowerOwnerSnapshot>();
  for (const row of rows) {
    const cur = byOwner.get(row.ownerId) ?? {
      ownerId: row.ownerId,
      population: 0,
      cityCount: 0,
      territoryHexCount: 0,
      pieniadzPerTurn: 0,
      ludnoscAbsolutna: 0,
      rekruci: 0,
    };
    cur.population += row.population;
    if (row.cityCount !== undefined) cur.cityCount = row.cityCount;
    if (row.territoryHexCount !== undefined) cur.territoryHexCount = row.territoryHexCount;
    if (row.pieniadzPerTurn !== undefined) cur.pieniadzPerTurn += row.pieniadzPerTurn;
    if (row.ludnoscAbsolutna !== undefined) cur.ludnoscAbsolutna = row.ludnoscAbsolutna;
    if (row.rekruci !== undefined) cur.rekruci = row.rekruci;
    byOwner.set(row.ownerId, cur);
  }
  return [...byOwner.values()];
}
