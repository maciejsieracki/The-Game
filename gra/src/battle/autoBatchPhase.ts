/**
 * Deterministic planning/arbitration primitives for one automatic battle phase.
 *
 * BattleScene owns cloning, animation, combat damage, and routs. This module
 * freezes phase-start occupancy and target IDs so a concurrent animation wave
 * cannot make a later unit depend on an earlier live mutation.
 */

export type AutoBatchPhase = 'atk' | 'def';
export type AutoBatchIntentKind = 'hold' | 'move' | 'attack';

export interface AutoBatchStep {
  col: number;
  row: number;
}

export interface AutoBatchUnitSnapshot {
  id: string;
  side: AutoBatchPhase;
  q: number;
  r: number;
  dead?: boolean;
  fadingOut?: boolean;
  routed?: boolean;
  removed?: boolean;
  acted?: boolean;
  /** Invalid/empty HP is outside the live phase roster even if flags lag. */
  hp?: number;
  /** False only for a unit already outside occupancy bookkeeping. */
  occupies?: boolean;
  /**
   * R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1: klasa arbitrazu kolizji o pole.
   * 'infantry' = piechota wrecz (pieszy, nie-dystansowy, nie-machina), 'ranged' = lucznicy/procarze (dystansowi pierwszego rzutu),
   * 'other' = konnica/rydwany/machiny (reguła bez zmian: stala kolejnosc rosteru). Brak pola = 'other'.
   */
  arbClass?: 'infantry' | 'ranged' | 'other';
}

export interface AutoBatchIntent {
  unitId: string;
  side: AutoBatchPhase;
  kind: AutoBatchIntentKind;
  steps: AutoBatchStep[];
  targetId?: string;
}

export interface AutoBatchResolution extends AutoBatchIntent {
  /** At least one requested step or the requested target was rejected. */
  blocked: boolean;
}

function cellKey(col: number, row: number): string {
  return col + ',' + row;
}

/** Naturalne porownanie ID (atk-2 < atk-10), deterministyczne i niezalezne od lokalizacji. */
export function compareUnitIds(a: string, b: string): number {
  const ax = a.match(/\d+|\D+/g) ?? [];
  const bx = b.match(/\d+|\D+/g) ?? [];
  for (let i = 0; i < Math.min(ax.length, bx.length); i++) {
    const x = ax[i]!;
    const y = bx[i]!;
    if (x === y) continue;
    const xn = /^\d+$/.test(x);
    const yn = /^\d+$/.test(y);
    if (xn && yn) {
      const d = Number(x) - Number(y);
      if (d !== 0) return d;
      return x.length - y.length;
    }
    return x < y ? -1 : 1;
  }
  return ax.length - bx.length;
}

/** Wlacznik arbitrazu (test mutacyjny BASE przelacza na false = zachowanie sprzed tematu). */
const ARB_ENABLED = true;

/**
 * Pierwszenstwo przy kolizji o wolne pole: piechota wrecz przed dystansowymi, w obrebie klasy mniejsze ID.
 * Zwraca true tylko gdy `a` ma SCISLE wyzsze pierwszenstwo niz `b`; konnica/rydwany/machiny ('other') nie biora udzialu
 * (ich regula zostaje: stala kolejnosc rosteru).
 */
export function arbPrecedes(
  a: { id: string; arbClass?: 'infantry' | 'ranged' | 'other' },
  b: { id: string; arbClass?: 'infantry' | 'ranged' | 'other' },
): boolean {
  const inArb = (u: { arbClass?: string }) => u.arbClass === 'infantry' || u.arbClass === 'ranged';
  if (!inArb(a) || !inArb(b)) return false;
  const ca = a.arbClass === 'infantry' ? 0 : 1; // /*ARB_PRIORITY*/
  const cb = b.arbClass === 'infantry' ? 0 : 1;
  return ca !== cb ? ca < cb : compareUnitIds(a.id, b.id) < 0;
}

function copySteps(steps: readonly AutoBatchStep[]): AutoBatchStep[] {
  return steps.map(step => ({ col: step.col, row: step.row }));
}

/**
 * Resolve one side's deterministic AUTO phase.
 *
 * Every intent is evaluated against the same phase-start occupancy map. A tile
 * occupied at phase start remains a hard barrier even when its occupant also
 * intends to move; this prevents path crossing and makes conflicts independent
 * of animation timing. Multiple intents for a newly free tile are resolved in
 * stable roster order, then corrected by precedence (infantry before ranged, lower ID within a class; cavalry/chariots/machines keep roster-order rule). Attack targets are IDs from the same snapshot, never a
 * live lookup performed after another unit in the wave has mutated state.
 */
export function resolveAutoBatchPhase(
  phase: AutoBatchPhase,
  units: readonly AutoBatchUnitSnapshot[],
  intents: readonly AutoBatchIntent[],
): AutoBatchResolution[] {
  const caps = new Map<string, number>();
  const byId = new Map<string, AutoBatchUnitSnapshot>();
  for (const u of units) byId.set(u.id, u);
  let pass = resolveOnce(phase, units, intents, caps);
  if (!ARB_ENABLED) return pass.resolutions;
  // Arbitraz: pierwszenstwo rozstrzygamy iteracyjnie, BEZ zmiany kolejnosci przetwarzania. Gdy jednostka B zostala zablokowana
  // polem zajetym SCIEZKA jednostki A, a B ma pierwszenstwo (piechota > dystansowy, mniejsze ID), A zatrzymuje sie przed tym polem
  // (cap = indeks pola w jej sciezce) i faza liczy sie od nowa. Capy tylko maleja, wiec petla sie konczy.
  for (let iter = 0; iter <= units.length * 2; iter++) {
    let changed = false;
    const accepted = new Map<string, AutoBatchStep[]>();
    for (const r of pass.resolutions) accepted.set(r.unitId, r.steps);
    for (const c of pass.conflicts) {
      const b = byId.get(c.blockedId);
      const a = byId.get(c.claimantId);
      if (!a || !b || !arbPrecedes(b, a)) continue;
      const idx = (accepted.get(a.id) ?? []).findIndex(st => cellKey(st.col, st.row) === c.cell);
      if (idx < 0) continue;
      const cur = caps.get(a.id);
      if (cur === undefined || idx < cur) { caps.set(a.id, idx); changed = true; }
    }
    if (!changed) break;
    pass = resolveOnce(phase, units, intents, caps);
  }
  return pass.resolutions;
}

interface ArbConflict { blockedId: string; claimantId: string; cell: string }

function resolveOnce(
  phase: AutoBatchPhase,
  units: readonly AutoBatchUnitSnapshot[],
  intents: readonly AutoBatchIntent[],
  caps: ReadonlyMap<string, number>,
): { resolutions: AutoBatchResolution[]; conflicts: ArbConflict[] } {
  const conflicts: ArbConflict[] = [];
  const startCell = new Map<string, string>();
  const live = new Map<string, AutoBatchUnitSnapshot>();
  const reserved = new Map<string, string>();

  for (const unit of units) {
    // R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1: zroutowany (uciekajacy) zyje na polu --
    // jest CELEM ataku i sam wykonuje ruch ucieczki, wiec zostaje w `live`.
    if (unit.dead || unit.fadingOut || unit.removed
      || (unit.hp !== undefined && (!Number.isFinite(unit.hp) || unit.hp <= 0))) continue;
    live.set(unit.id, unit);
    if (unit.occupies !== false) { reserved.set(cellKey(unit.q, unit.r), unit.id); startCell.set(cellKey(unit.q, unit.r), unit.id); }
  }

  const intentById = new Map<string, AutoBatchIntent>();
  for (const intent of intents) {
    if (intent.side === phase) intentById.set(intent.unitId, intent);
  }

  const acceptSteps = (
    unit: AutoBatchUnitSnapshot,
    steps: readonly AutoBatchStep[],
  ): { steps: AutoBatchStep[]; blocked: boolean } => {
    let col = unit.q;
    let row = unit.r;
    const accepted: AutoBatchStep[] = [];

    const cap = caps.get(unit.id);
    for (const step of steps) {
      if (cap !== undefined && accepted.length >= cap) return { steps: accepted, blocked: true };
      // Planners should only produce orthogonal steps. Treat malformed external
      // input as blocked instead of allowing a teleport through the barrier.
      if (Math.abs(step.col - col) + Math.abs(step.row - row) !== 1) {
        return { steps: accepted, blocked: true };
      }
      const nextKey = cellKey(step.col, step.row);
      const occupant = reserved.get(nextKey);
      if (occupant !== undefined && occupant !== unit.id) {
        if (startCell.get(nextKey) !== occupant) conflicts.push({ blockedId: unit.id, claimantId: occupant, cell: nextKey });
        return { steps: accepted, blocked: true };
      }
      // Keep every accepted destination reserved until the whole phase ends.
      // The animation wave starts together, so another path cannot claim a tile
      // that this path has already traversed.
      reserved.set(nextKey, unit.id);
      col = step.col;
      row = step.row;
      accepted.push({ col, row });
    }
    return { steps: accepted, blocked: false };
  };

  const resolutions: AutoBatchResolution[] = [];
  for (const unit of units) {
    if (
      unit.side !== phase
      || unit.acted
      || unit.dead
      || unit.fadingOut
      || unit.removed
      || (unit.hp !== undefined && (!Number.isFinite(unit.hp) || unit.hp <= 0))
      || !live.has(unit.id)
    ) continue;

    const fallback: AutoBatchIntent = {
      unitId: unit.id,
      side: phase,
      kind: 'hold',
      steps: [],
    };
    const intent = intentById.get(unit.id) ?? fallback;

    if (intent.kind === 'attack') {
      const target = intent.targetId ? live.get(intent.targetId) : undefined;
      const targetAvailable = Boolean(
        target
        && target.side !== phase,
      );
      if (!targetAvailable) {
        resolutions.push({
          ...intent,
          targetId: undefined,
          kind: 'hold',
          steps: [],
          blocked: true,
        });
        continue;
      }

      const path = acceptSteps(unit, intent.steps);
      if (path.blocked) {
        resolutions.push({
          ...intent,
          targetId: undefined,
          kind: path.steps.length > 0 ? 'move' : 'hold',
          steps: path.steps,
          blocked: true,
        });
        continue;
      }
      resolutions.push({
        ...intent,
        steps: path.steps,
        blocked: false,
      });
      continue;
    }

    if (intent.kind !== 'move' || intent.steps.length === 0) {
      resolutions.push({
        ...intent,
        steps: copySteps(intent.steps),
        blocked: false,
      });
      continue;
    }

    const path = acceptSteps(unit, intent.steps);
    resolutions.push({
      ...intent,
      steps: path.steps,
      blocked: path.blocked,
    });
  }

  return { resolutions, conflicts };
}
