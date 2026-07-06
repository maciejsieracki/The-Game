/**
 * diplomacy-basket-transfer.ts — transfer tech + surowiec boolean z koszyka PN (P6).
 * Jednostka: UNITS (`diplomacy-unit-transfer.ts`). Hook w main.ts: Integrator F.
 */
import type { ResearchTechDef } from './research';
import { findTech } from './research';

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

  if (ctx.techCatalog?.length) {
    const def = findTech(ctx.techCatalog, id);
    if (!def) {
      return { context: ctx, granted: false, reason: `Nieznana technologia: ${id}` };
    }
  }

  const next = cloneContext(ctx);
  const current = next.researchedByOwner.get(toOwnerId) ?? new Set<string>();
  if (current.has(id)) {
    return { context: ctx, granted: false, reason: 'Technologia już zbadana' };
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
