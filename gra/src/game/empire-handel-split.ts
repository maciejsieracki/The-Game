/**
 * empire-handel-split.ts — globalny domyślny podział Daniny/Podatku (DYSPOZYCJA-85-SUWAK=C).
 *
 * Imperium ma jeden domyślny suwak Skarb/Nauka/Zamożność; miasto może mieć opcjonalny override.
 */
import type { City, CityPodzialHandlu } from './cities';
import {
  DEFAULT_PODZIAL_HANDLU,
  normalizePodzialHandlu,
} from './cities';

export function podzialHandluEqual(a: CityPodzialHandlu, b: CityPodzialHandlu): boolean {
  const x = normalizePodzialHandlu(a);
  const y = normalizePodzialHandlu(b);
  return x.procentPieniadz === y.procentPieniadz
    && x.procentNauka === y.procentNauka
    && x.procentLuksus === y.procentLuksus;
}

/** Efektywny podział dla miasta: override lokalny lub domyślny imperium. */
export function resolveCityPodzialHandlu(
  city: Pick<City, 'podzialHandlu' | 'podzialHandluOverride' | 'ownerId'>,
  ownerDefault: CityPodzialHandlu | undefined,
  paramsFallback?: CityPodzialHandlu,
): CityPodzialHandlu {
  if (city.podzialHandluOverride && city.podzialHandlu) {
    return normalizePodzialHandlu(city.podzialHandlu);
  }
  if (ownerDefault) {
    return normalizePodzialHandlu(ownerDefault);
  }
  if (city.podzialHandlu) {
    return normalizePodzialHandlu(city.podzialHandlu);
  }
  return normalizePodzialHandlu(paramsFallback ?? DEFAULT_PODZIAL_HANDLU);
}

/** Migracja starych zapisów (per-miasto bez globalnego) → global + flagi override. */
export function migrateHandelSplitOnLoad(
  cities: ReadonlyArray<City>,
  ownerDefaults: Map<number, CityPodzialHandlu>,
  savedDefaults: ReadonlyArray<[number, CityPodzialHandlu]> | undefined,
): void {
  if (savedDefaults?.length) {
    for (const [oid, split] of savedDefaults) {
      ownerDefaults.set(oid, normalizePodzialHandlu(split));
    }
  } else {
    for (const city of cities) {
      if (!ownerDefaults.has(city.ownerId)) {
        ownerDefaults.set(
          city.ownerId,
          normalizePodzialHandlu(city.podzialHandlu ?? DEFAULT_PODZIAL_HANDLU),
        );
      }
    }
    for (const city of cities) {
      if (city.podzialHandluOverride !== undefined) continue;
      const def = ownerDefaults.get(city.ownerId) ?? DEFAULT_PODZIAL_HANDLU;
      if (!city.podzialHandlu) {
        city.podzialHandluOverride = false;
        continue;
      }
      const differs = !podzialHandluEqual(city.podzialHandlu, def);
      city.podzialHandluOverride = differs;
      if (!differs) {
        delete city.podzialHandlu;
      }
    }
  }

  for (const city of cities) {
    if (!ownerDefaults.has(city.ownerId)) {
      ownerDefaults.set(city.ownerId, { ...DEFAULT_PODZIAL_HANDLU });
    }
    if (city.podzialHandluOverride && city.podzialHandlu) {
      city.podzialHandlu = normalizePodzialHandlu(city.podzialHandlu);
    }
  }
}

export function freshOwnerDefaultPodzialHandlu(): CityPodzialHandlu {
  return { ...DEFAULT_PODZIAL_HANDLU };
}
