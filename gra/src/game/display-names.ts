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

/**
 * R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 — ECHO właściciela = wariant A:
 * „oznaczenie miasta-państwa znika przy KAŻDYM przejęciu miasta-państwa, także zbrojnym".
 *
 * DLACZEGO TO ISTNIEJE: `isOwnerClusterCityState` (wyżej) uznaje ownera za miasto-państwo
 * także wtedy, gdy KTÓREKOLWIEK z jego miast ma `startCityState`. Zdobyte miasto
 * miasta-państwa wnosiło więc tę flagę do zdobywcy — pełna cywilizacja po podboju była
 * traktowana jak miasto-państwo (wypadała z listy potęg `power-ranking.ts`, traciła portret
 * władcy w dyplomacji i była wykluczana z wojny wymuszonej epoki Kamienia przez guard
 * `!typCityCopyOwners.has(...)`/`isOwnerClusterCityState`). Przed tym tematem flaga gasła
 * WYŁĄCZNIE przy pokojowym wchłonięciu (`annexCityStateToOwner` w `main.ts`).
 *
 * Gasimy oznaczenie na MIEŚCIE, nie na właścicielu — zbiory spawnowe
 * (`simplifiedOwners` / `typCopyOwners`) zostają nietknięte, więc PRAWDZIWE miasta-państwa
 * dalej są miastami-państwami, także po utracie części swoich miast. Mechanizm nie jest
 * wyłączany; przestaje tylko zarażać zdobywcę.
 *
 * Wołający: `main.ts`, na KAŻDEJ ścieżce zmiany właściciela miasta przez przejęcie
 * (podbój bojowy/szturm/wejście do pustego miasta, kapitulacja głodowa oblężenia,
 * pokojowe wchłonięcie). Rebelia (`REBEL_FACTION_OWNER_ID = -99`) celowo NIE jest tu
 * wołana: `isOwnerClusterCityState` zwraca `false` dla `ownerId <= 0`, więc frakcja
 * rebeliantów nie może się zarazić, a miasto po odbiciu wraca do właściciela ścieżką
 * podboju bojowego, która flagę i tak gasi.
 *
 * @returns `true`, gdy flaga faktycznie zgasła — wołający wie wtedy, że musi odświeżyć
 *          cache etykiet (`markCityStateDirty`). `false` = nic się nie zmieniło.
 */
export function clearCityStateFlagOnCapture(
  city: { startCityState?: boolean },
): boolean {
  if (city.startCityState !== true) return false;
  city.startCityState = false;
  return true;
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

/**
 * Kontekst etykiety miasta na mapie (MAP-UX-CLUSTER-LABEL-Q1 = B+C, Maciej 2026-08-06).
 * Bez tych opcji `formatCityMapLabel` zachowuje się jak dotąd (nazwa miasta + dopisek MP) —
 * panel miasta (`cityPanel.ts`) woła go bez opcji i nic tam się nie zmienia.
 */
export interface CityMapLabelOpts {
  /** ownerId gracza — jego miasta ZAWSZE pokazują własną nazwę. Domyślnie 0. */
  playerOwnerId?: number;
  /**
   * Czy TO miasto jest stolicą swojego państwa.
   * Jedno źródło prawdy: `capitalCityIdForOwner(ownerId) === city.id` (main.ts).
   */
  isCapital?: boolean;
  /** Nazwa cywilizacji właściciela (civs.json → kolumna `Cywilizacja`). */
  civDisplayName?: string;
  /**
   * Czy właściciel to miasto-państwo klastra (render: `options.isCityStateOwner`).
   * Blokuje podmianę nazwy na nazwę cywilizacji — MP zostaje bez zmian.
   * NIE wpływa na dopisek „· miasto-państwo” (ten dalej z `city.startCityState`).
   */
  isCityStateOwner?: boolean;
}

/**
 * Etykieta miasta na mapie / tooltipie.
 *
 * MAP-UX-CLUSTER-LABEL-Q1 = B+C: stolica OBCEGO państwa (nie gracz, nie miasto-państwo)
 * dostaje nazwę cywilizacji na plakietce — mapowanie ownerId→cywilizacja przychodzi
 * z zewnątrz (`civDisplayName`), a wybór nazwy robi ta sama `resolveOwnerBaseName`, której
 * używa dyplomacja/HUD (gałąź `isClusterCapital`). Brak nazwy cywilizacji → fallback na nazwę
 * miasta (stare zachowanie).
 *
 * R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 (Maciej 2026-09-04) zmienia JEDEN element tamtej
 * decyzji: plakietka obcej stolicy pokazuje NAZWĘ MIASTA (`foreignCapitalMapName` niżej).
 * Runda 1 próbowała dwóch członów („Xi'an · Chińczycy”) — pomiar prawdziwym fontem wobec
 * budżetu `cityMapStatChip.ts:769` pokazał 14/15 stolic przyciętych (u Zulusów człon
 * cywilizacji znikał w całości), więc ECHO właściciela brzmi: „Sama nazwa miasta, bez
 * cywilizacji”. To TRZECI stan, nie powrót do stanu sprzed tematu: przedtem plakietka
 * niosła nazwę CYWILIZACJI. Znakiem stolicy zostaje korona, znakiem przynależności kolor
 * terytorium. Korona, marker, liczba populacji, etykiety miast-państw, zwykłych obcych
 * miast i miast gracza — bez zmian.
 */
export function formatCityMapLabel(
  city: {
    name: string;
    ownerId: number;
    startCityState?: boolean;
  },
  opts?: CityMapLabelOpts,
): string {
  const playerOwnerId = opts?.playerOwnerId ?? 0;
  const isForeign = city.ownerId !== playerOwnerId;
  const isCityState = isForeign && !!city.startCityState;
  const isCityStateOwner = opts?.isCityStateOwner === true;

  if (isForeign && opts?.isCapital === true && !isCityState && !isCityStateOwner) {
    const base = foreignCapitalMapName(city.name, opts.civDisplayName);
    if (base) {
      return formatEntityDisplayName({ baseName: base, isCityState: false });
    }
  }

  return formatEntityDisplayName({
    baseName: city.name,
    isCityState,
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

/** Człon etykiety po odsianiu placeholderów technicznych i dopisku „· miasto-państwo”. */
function cleanDisplayPart(value: string | null | undefined): string | undefined {
  return value && !isTechnicalOwnerLabel(value) ? stripCityStateSuffix(value) : undefined;
}

/**
 * R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 2 (ECHO „Sama nazwa miasta, bez
 * cywilizacji”) — nazwa na plakietce obcej stolicy NA MAPIE.
 *
 * DLACZEGO OSOBNA FUNKCJA, A NIE ZMIANA GAŁĘZI `isClusterCapital` w `resolveOwnerBaseName`:
 * tamta gałąź ma DWÓCH wołających — mapę (`formatCityMapLabel` wyżej) i `ownerDiploLabel`
 * w `main.ts` (nazwa państwa w dyplomacji/HUD). W dyplomacji identyfikujemy PAŃSTWO, więc
 * „Hetyci” musi tam zostać; MIASTO pokazuje wyłącznie mapa. Zmiana samej gałęzi przeniosłaby
 * „Hattusa” do dyplomacji — zakres, o który nikt nie prosił. Opt-in `clusterCapitalWithCityName`
 * z rundy 1 został usunięty, bo po uproszczeniu do jednego członu nie miał drugiego konsumenta.
 *
 * Degradacja: brak realnej nazwy miasta (placeholder `Rywal N`/`AI N`/`oid-N`) → nazwa
 * cywilizacji, jak przed tematem. Pusty wynik = wołający zostaje przy nazwie miasta.
 */
export function foreignCapitalMapName(
  cityName?: string,
  civDisplayName?: string,
): string {
  return cleanDisplayPart(cityName) ?? cleanDisplayPart(civDisplayName) ?? '';
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

  const cleanCity = cleanDisplayPart(cityName);
  const cleanCiv = cleanDisplayPart(civDisplayName);
  const cleanCached = cleanDisplayPart(cached);

  // Dyplomacja/HUD: stolica obcego klastra identyfikuje PAŃSTWO — nazwa nacji, bez zmian.
  // Etykieta na MAPIE ma własną ścieżkę (`foreignCapitalMapName` wyżej), bo tam pokazujemy
  // MIASTO (R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 2).
  if (isClusterCapital && cleanCiv) {
    return cleanCiv;
  }
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
