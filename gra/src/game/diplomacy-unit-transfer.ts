/**
 * diplomacy-unit-transfer.ts — P6: spawn jednostki z koszyka wymiany PN.
 * Koszt PN = Pieniądz (koszt) z units.json (katalog diplomacy-value-catalog).
 */
import { diplomacyPnJednostka } from './diplomacy-value-catalog';
import { categoryOf } from '../units/setup';
import type { RuntimeUnit } from '../units/setup';

export interface UnitTransferContext {
  /** Bieżąca lista jednostek — mutowana przez wynik spawnu. */
  units: RuntimeUnit[];
  /** ownerId → heks stolicy (centrum miasta). */
  capitalHexByOwner: ReadonlyMap<number, { q: number; r: number }>;
  /** Alokacja unikalnego id (Integrator podaje z main). */
  allocateUnitId: () => string;
  /** Definicja typu z units.json (GameData.units row). */
  getUnitDef: (typeId: string) => {
    Ruch?: number;
    'Rola (linia)'?: string;
    'Super-jednostka'?: string;
  } | undefined;
}

export type SpawnTransferredUnitReason = 'unknown_type' | 'no_capital';

export interface SpawnTransferredUnitResult {
  ok: boolean;
  unit?: RuntimeUnit;
  units: RuntimeUnit[];
  pnCost: number | null;
  reason?: SpawnTransferredUnitReason;
}

/**
 * Tworzy 1 jednostkę u odbiorcy po akceptacji dealu.
 * Pozycja: `nearHex` gdy podany, inaczej heks stolicy odbiorcy (`capitalHexByOwner`).
 */
export function spawnTransferredUnit(
  unitTypeId: string,
  toOwnerId: number,
  nearHex: { q: number; r: number } | null | undefined,
  ctx: UnitTransferContext,
): SpawnTransferredUnitResult {
  const pnCost = diplomacyPnJednostka(unitTypeId);
  const def = ctx.getUnitDef(unitTypeId);
  if (!def || pnCost == null) {
    return { ok: false, units: ctx.units, pnCost: null, reason: 'unknown_type' };
  }

  const placement = nearHex ?? ctx.capitalHexByOwner.get(toOwnerId) ?? null;
  if (!placement) {
    return { ok: false, units: ctx.units, pnCost, reason: 'no_capital' };
  }

  const ruch = typeof def.Ruch === 'number' && def.Ruch > 0 ? def.Ruch : 2;
  const role = def['Rola (linia)'] ?? '';
  const isSuper = def['Super-jednostka'] === 'TAK';

  const unit: RuntimeUnit = {
    id: ctx.allocateUnitId(),
    ownerId: toOwnerId,
    typeId: unitTypeId,
    category: categoryOf(unitTypeId, role, isSuper),
    q: placement.q,
    r: placement.r,
    ruch,
    ruchLeft: ruch,
  };

  const units = [...ctx.units, unit];
  ctx.units = units;

  return { ok: true, unit, units, pnCost };
}
