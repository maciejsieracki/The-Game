/**
 * diplomacy-basket-transfer.ts — transfer tech + surowiec boolean z koszyka PN (P6).
 * Jednostka: UNITS (`diplomacy-unit-transfer.ts`). Hook w main.ts: Integrator F.
 */
import type { ResearchTechDef } from './research';
import { epochGateMet, epochTierGateMet, findTech, prerequisitesOf } from './research';

/** Trwały dostęp boolean do surowca (od grantora u grantee). */
export interface SurowiecBooleanGrant {
  id: string;
  granterOwnerId: number;
  granteeOwnerId: number;
  /** Klucz ASCII, np. drewno, zelazo — zgodny z diplomacy-value-catalog. */
  rawKey: string;
  active: boolean;
}

/** Stan przekazywany przez Integratora (save/load). */
export interface BasketTransferContext {
  /** ownerId → zbadane tech id (Technologia z tech.json). */
  researchedByOwner: ReadonlyMap<number, ReadonlySet<string>>;
  surowiecBooleanGrants: readonly SurowiecBooleanGrant[];
  /** Opcjonalna walidacja tech względem tech.json. */
  techCatalog?: readonly ResearchTechDef[];
}

export interface GrantTechResult {
  context: BasketTransferContext;
  granted: boolean;
  reason?: string;
}

export interface GrantSurowiecResult {
  context: BasketTransferContext;
  granted: boolean;
  grantId?: string;
  reason?: string;
}

let _grantSeq = 0;

/** Reset licznika id (testy). */
export function resetBasketTransferGrantSeq(n = 0): void {
  _grantSeq = n;
}

function nextGrantId(prefix: string): string {
  _grantSeq += 1;
  return `${prefix}_${_grantSeq}`;
}

function cloneContext(ctx: BasketTransferContext): BasketTransferContext {
  const researched = new Map<number, ReadonlySet<string>>();
  for (const [oid, set] of ctx.researchedByOwner.entries()) {
    researched.set(oid, new Set(set));
  }
  return {
    researchedByOwner: researched,
    surowiecBooleanGrants: [...ctx.surowiecBooleanGrants],
    techCatalog: ctx.techCatalog,
  };
}

/**
 * Dodaje techId do zbadanych odbiorcy (bez kosztu nauki).
 * Id tech = pole Technologia (kanon research.ts). No-op gdy już zbadane.
 */
export function grantTechToOwner(
  techId: string,
  toOwnerId: number,
  ctx: BasketTransferContext,
): GrantTechResult {
  const id = techId.trim();
  if (!id) {
    return { context: ctx, granted: false, reason: 'Brak identyfikatora technologii' };
  }

  let def: ResearchTechDef | undefined;
  if (ctx.techCatalog?.length) {
    def = findTech(ctx.techCatalog, id);
    if (!def) {
      return { context: ctx, granted: false, reason: `Nieznana technologia: ${id}` };
    }
  }

  const next = cloneContext(ctx);
  const current = next.researchedByOwner.get(toOwnerId) ?? new Set<string>();
  if (current.has(id)) {
    return { context: ctx, granted: false, reason: 'Technologia już zbadana' };
  }

  // P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE (2026-08-09): odbiorca musi mieć zbadane
  // prerekwizyty drzewka i spełnioną bramkę epoki/tieru, dokładnie jak przy normalnym
  // badaniu (research.ts::canResearch) — bez bramki budynku/ulepszenia, bo dar
  // dyplomatyczny nie wymaga posiadania konkretnego budynku, tylko pozycji w drzewku.
  // Gated za `ctx.techCatalog` tak samo jak walidacja „nieznana technologia" wyżej —
  // wołający bez katalogu (np. stare testy) świadomie pomija tę walidację.
  if (def && ctx.techCatalog) {
    const prereqsMet = prerequisitesOf(def).every((p) => current.has(p));
    const epochOk = epochGateMet(def, ctx.techCatalog, current);
    const tierOk = epochTierGateMet(def, ctx.techCatalog, current);
    if (!prereqsMet || !epochOk || !tierOk) {
      return { context: ctx, granted: false, reason: `Brak wymaganych prerekwizytów/epoki: ${id}` };
    }
  }

  const updated = new Set(current);
  updated.add(id);
  (next.researchedByOwner as Map<number, ReadonlySet<string>>).set(toOwnerId, updated);

  return { context: next, granted: true };
}

/**
 * Przyznaje grantee trwały dostęp boolean do surowca u grantora.
 * Duplikat aktywnego grantu dla tej samej trójki → no-op.
 */
export function grantSurowiecBooleanAccess(
  rawKey: string,
  fromOwner: number,
  toOwner: number,
  ctx: BasketTransferContext,
): GrantSurowiecResult {
  const key = rawKey.trim().toLowerCase();
  if (!key) {
    return { context: ctx, granted: false, reason: 'Brak klucza surowca' };
  }
  if (fromOwner === toOwner) {
    return { context: ctx, granted: false, reason: 'Grantor = odbiorca' };
  }

  const exists = ctx.surowiecBooleanGrants.some(
    g =>
      g.active
      && g.granterOwnerId === fromOwner
      && g.granteeOwnerId === toOwner
      && g.rawKey === key,
  );
  if (exists) {
    return { context: ctx, granted: false, reason: 'Aktywny grant już istnieje' };
  }

  const grantId = nextGrantId('sraw');
  const grant: SurowiecBooleanGrant = {
    id: grantId,
    granterOwnerId: fromOwner,
    granteeOwnerId: toOwner,
    rawKey: key,
    active: true,
  };

  const next = cloneContext(ctx);
  next.surowiecBooleanGrants = [...next.surowiecBooleanGrants, grant];

  return { context: next, granted: true, grantId };
}

/** Czy grantee ma aktywny dostęp do surowca u grantora. */
export function hasSurowiecBooleanAccess(
  rawKey: string,
  fromOwner: number,
  toOwner: number,
  ctx: BasketTransferContext,
): boolean {
  const key = rawKey.trim().toLowerCase();
  return ctx.surowiecBooleanGrants.some(
    g =>
      g.active
      && g.granterOwnerId === fromOwner
      && g.granteeOwnerId === toOwner
      && g.rawKey === key,
  );
}

/** Pusty kontekst (nowa gra / test). */
export function createEmptyBasketTransferContext(
  techCatalog?: readonly ResearchTechDef[],
): BasketTransferContext {
  return {
    researchedByOwner: new Map(),
    surowiecBooleanGrants: [],
    techCatalog,
  };
}

// ---------------------------------------------------------------------------
// C-DYP-SUROWCE-Q1=B (2026-07-23): transfer ILOŚCIOWY surowca miejskiego
// (pozycja koszyka surowiec_ilosc) — fizycznie przenosi sztuki z City.surowce
// dawcy do City.surowce biorcy, w odróżnieniu od grantSurowiecBooleanAccess
// powyżej (to tylko trwały DOSTĘP, bez ruchu sztuk).
// ---------------------------------------------------------------------------

/** Lekka referencja do miasta — tylko pola potrzebne do transferu ilościowego. */
export interface ResourceIloscCityRef {
  id: string;
  ownerId: number;
  surowce: Readonly<Record<string, number>>;
}

export type ResourceIloscTransferReason =
  | 'brak_ilosci'
  | 'brak_zapasow_dawcy'
  | 'brak_miasta_odbiorcy'
  | 'dawca_rowny_biorcy';

export interface ResourceIloscTransferResult {
  /** Nowa tablica miast (immutable) — tylko dotknięte miasta dostają nowy obiekt `surowce`. */
  cities: ResourceIloscCityRef[];
  /** Ile sztuk faktycznie przeniesiono (może być < totalUnits, jeśli dawca miał mniej). */
  moved: number;
  reason?: ResourceIloscTransferReason;
}

/**
 * Przenosi `totalUnits` sztuk surowca `surowiecKey` z miast `fromOwnerId` do JEDNEGO
 * miasta `toOwnerId` (stolica biorcy — `capitalCityId` — lub pierwsze miasto biorcy
 * w przekazanej tablicy `cities`, gdy stolica nie istnieje/nie należy do biorcy).
 *
 * Deterministyczne odejmowanie: miasta dawcy posortowane malejąco po aktualnym
 * zapasie surowca (remis rozstrzyga id miasta rosnąco), zbiera aż do `totalUnits`
 * lub wyczerpania zapasów (nigdy nie schodzi poniżej 0 — realny transfer może być
 * mniejszy niż żądany, patrz `moved`; wołający — main.ts — ogranicza ofertę do
 * realnego zapasu (sztuki wprost, R-DYP-PAKIET-USUN 2026-08-08) PRZED zawarciem
 * umowy, więc to tylko defensywny fallback).
 * Pure: nie mutuje wejściowej tablicy `cities`, zwraca nową.
 */
export function transferSurowiecIlosc(
  surowiecKey: string,
  totalUnits: number,
  fromOwnerId: number,
  toOwnerId: number,
  capitalCityId: string | null | undefined,
  cities: readonly ResourceIloscCityRef[],
): ResourceIloscTransferResult {
  const key = surowiecKey.trim().toLowerCase();
  if (!key || !Number.isFinite(totalUnits) || totalUnits <= 0) {
    return { cities: [...cities], moved: 0, reason: 'brak_ilosci' };
  }
  if (fromOwnerId === toOwnerId) {
    return { cities: [...cities], moved: 0, reason: 'dawca_rowny_biorcy' };
  }

  const donors = cities
    .filter(c => c.ownerId === fromOwnerId)
    .slice()
    .sort((a, b) => (b.surowce[key] ?? 0) - (a.surowce[key] ?? 0) || a.id.localeCompare(b.id));

  const nowySurowiec = new Map<string, number>(); // cityId -> nowa ilość surowca (tylko dotknięte)
  let remaining = totalUnits;
  let moved = 0;
  for (const city of donors) {
    if (remaining <= 0) break;
    const have = city.surowce[key] ?? 0;
    if (have <= 0) continue;
    const take = Math.min(have, remaining);
    nowySurowiec.set(city.id, have - take);
    remaining -= take;
    moved += take;
  }

  if (moved <= 0) {
    return { cities: [...cities], moved: 0, reason: 'brak_zapasow_dawcy' };
  }

  const recipientCandidates = cities.filter(c => c.ownerId === toOwnerId);
  const recipient =
    (capitalCityId ? recipientCandidates.find(c => c.id === capitalCityId) : undefined)
    ?? recipientCandidates[0];

  if (!recipient) {
    return { cities: [...cities], moved: 0, reason: 'brak_miasta_odbiorcy' };
  }

  nowySurowiec.set(recipient.id, (recipient.surowce[key] ?? 0) + moved);

  const next = cities.map(c => {
    const nv = nowySurowiec.get(c.id);
    if (nv === undefined) return c;
    return { ...c, surowce: { ...c.surowce, [key]: nv } };
  });

  return { cities: next, moved };
}
