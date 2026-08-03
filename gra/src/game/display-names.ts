/**
 * display-names.ts — etykiety państw vs miast-państw klastra (Maciej 2026-07-07).
 *
 * Pełna cywilizacja / imperium: sama nazwa (np. „Ateny”, „Rzym”).
 * Miasto-państwo z klastra startowego: „Sparta · miasto-państwo”.
 */

export const CITY_STATE_LABEL = 'miasto-państwo';
export const CITY_STATE_SEPARATOR = ' · ';

export interface EntityDisplayCtx {
  baseName: string;
  isCityState?: boolean;
}

/** Etykieta UI z opcjonalnym dopiskiem miasta-państwa. */
export function formatEntityDisplayName(ctx: EntityDisplayCtx): string {
  const base = (ctx.baseName ?? '').trim();
  if (!base) return '';
  if (ctx.isCityState) {
    return `${base}${CITY_STATE_SEPARATOR}${CITY_STATE_LABEL}`;
  }
  return base;
}

/** Usuwa dopisek z legacy zapisów / podwójnego formatowania. */
export function stripCityStateSuffix(name: string): string {
  const suffix = `${CITY_STATE_SEPARATOR}${CITY_STATE_LABEL}`;
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

/** Slot spawnu klastra — rywale tego samego typu + kopie obcego typu (nie stolica). */
export function isClusterCityStateSlot(slot: {
  isSameTypeRival?: boolean;
  isClusterCapital?: boolean;
  isPlayerCapital?: boolean;
}): boolean {
  if (slot.isPlayerCapital) return false;
  if (slot.isSameTypeRival) return true;
  return !slot.isClusterCapital;
}

export interface OwnerCityStateOpts {
  simplifiedOwners?: ReadonlySet<number>;
  typCopyOwners?: ReadonlySet<number>;
  cities?: ReadonlyArray<{ ownerId: number; startCityState?: boolean }>;
}

/** Czy owner to miasto-państwo klastra (nie pełne imperium). ownerId 0 = gracz → zawsze false. */
export function isOwnerClusterCityState(
  ownerId: number,
  opts?: OwnerCityStateOpts,
): boolean {
  if (ownerId <= 0) return false;
  if (opts?.simplifiedOwners?.has(ownerId)) return true;
  if (opts?.typCopyOwners?.has(ownerId)) return true;
  if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;
  return false;
}

export interface ForceCultureIconOpts extends OwnerCityStateOpts {
  /** Stolice klastrów obcych typów — pełne imperia, portret władcy OK. */
  clusterCapitalOwnerIds?: ReadonlySet<number>;
  /** ikonaId gracza (civs.json). */
  playerCivKey?: string;
  /** ikonaId rozmówcy (civs.json). */
  ownerCivKey?: string;
}

/**
 * R-MP-PORTRET — czy medalion ma pokazać symbol kultury zamiast portretu-zdjęcia władcy.
 * Miasto-państwo klastra + fallback: AI o tym samym ikonaId co gracz (rywale tego samego
 * typu), gdy meta/sety sejwu zawiodą i isOwnerClusterCityState zwróci false.
 */
export function shouldForceCultureIconForOwner(
  ownerId: number,
  opts?: ForceCultureIconOpts,
): boolean {
  if (ownerId <= 0) return false;
  if (isOwnerClusterCityState(ownerId, opts)) return true;
  const playerKey = (opts?.playerCivKey ?? '').trim();
  const ownerKey = (opts?.ownerCivKey ?? '').trim();
  if (
    playerKey
    && ownerKey
    && playerKey === ownerKey
    && !opts?.clusterCapitalOwnerIds?.has(ownerId)
  ) {
    return true;
  }
  return false;
}

/** Etykieta miasta na mapie / tooltipie. */
export function formatCityMapLabel(city: {
  name: string;
  ownerId: number;
  startCityState?: boolean;
}): string {
  return formatEntityDisplayName({
    baseName: city.name,
    isCityState: city.ownerId !== 0 && !!city.startCityState,
  });
}

/** Etykieta dyplomacji / HUD dla ownera AI. */
export function formatOwnerDiploLabel(
  baseName: string,
  ownerId: number,
  opts?: Parameters<typeof isOwnerClusterCityState>[1],
): string {
  return formatEntityDisplayName({
    baseName: stripCityStateSuffix(baseName),
    isCityState: isOwnerClusterCityState(ownerId, opts),
  });
}

/** Placeholder z fallbacku nazw klastra — nie pokazywać graczowi w UI dyplomacji. */
export function isTechnicalOwnerLabel(name: string | null | undefined): boolean {
  const t = (name ?? '').trim();
  if (!t) return true;
  if (/^Rywal \d+$/i.test(t)) return true;
  if (/^AI \d+$/i.test(t)) return true;
  if (/^oid-\d+$/i.test(t)) return true;
  return false;
}

export interface ResolveOwnerBaseNameInput {
  ownerId: number;
  cached?: string;
  cityName?: string;
  civDisplayName?: string;
  isCityState: boolean;
  isClusterCapital?: boolean;
}

/**
 * Bazowa nazwa państwa przed dopiskiem „· miasto-państwo”.
 * Miasta-państwa → „[miasto] · [kultura]” (R-MP-PORTRET, Maciej 2026-07-24 — samo miasto nie
 * odróżniało 10-11 MP tej samej kultury; formatEntityDisplayName dokleja „· miasto-państwo”,
 * więc pełna etykieta wychodzi „Sparta · Grecja · miasto-państwo”). Brak nazwy miasta → sama
 * kultura („Grecja · miasto-państwo”); brak kultury → sama nazwa miasta (stare zachowanie).
 * Stolice obcych klastrów → nazwa nacji; reszta → cache/miasto.
 */
export function resolveOwnerBaseName(input: ResolveOwnerBaseNameInput): string {
  const {
    ownerId,
    cached,
    cityName,
    civDisplayName,
    isCityState,
    isClusterCapital = false,
  } = input;

  const cleanCity = cityName && !isTechnicalOwnerLabel(cityName)
    ? stripCityStateSuffix(cityName)
    : undefined;
  const cleanCiv = civDisplayName && !isTechnicalOwnerLabel(civDisplayName)
    ? stripCityStateSuffix(civDisplayName)
    : undefined;
  const cleanCached = cached && !isTechnicalOwnerLabel(cached)
    ? stripCityStateSuffix(cached)
    : undefined;

  if (isClusterCapital && cleanCiv) return cleanCiv;
  if (isCityState && cleanCity && cleanCiv && cleanCity !== cleanCiv) {
    return `${cleanCity}${CITY_STATE_SEPARATOR}${cleanCiv}`;
  }
  if (isCityState && cleanCiv) return cleanCiv;
  if (isCityState && cleanCity) return cleanCity;
  if (!isCityState && cleanCiv) return cleanCiv;
  if (cleanCached) return cleanCached;
  if (cleanCity) return cleanCity;
  if (cleanCiv) return cleanCiv;
  if (cached?.trim()) return stripCityStateSuffix(cached);
  if (cityName?.trim()) return stripCityStateSuffix(cityName);
  // UI nigdy nie powinno widzieć „AI N" — brak danych → pusty string (main.ts dobiera pulę / filtruje).
  return '';
}

/**
 * Ostatnia bramka przed UI — odrzuca placeholdery techniczne (AI N, Rywal N, oid-N).
 * Gdy baza pusta/techniczna, zwraca nazwę kultury (dla miast-państw bez miasta na mapie).
 */
export function sanitizeOwnerDisplayBase(
  base: string,
  civDisplayName?: string,
): string {
  const trimmed = (base ?? '').trim();
  if (trimmed && !isTechnicalOwnerLabel(trimmed)) return stripCityStateSuffix(trimmed);
  const civ = civDisplayName && !isTechnicalOwnerLabel(civDisplayName)
    ? stripCityStateSuffix(civDisplayName)
    : undefined;
  return civ ?? '';
}
