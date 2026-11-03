/** One-shot conversion of remaining empire Work into tax. No turn automation lives here. */
export interface WorkTaxConversion {
  workRemaining: number;
  workSpent: number;
  taxGained: number;
}

export function taxForWorkAmount(work: number, rate: number): number {
  const safeWork = Number.isFinite(work) ? Math.max(0, Math.floor(work)) : 0;
  const safeRate = Number.isFinite(rate) ? Math.max(0, rate) : 1;
  return Math.floor(safeWork * safeRate);
}

export function ownerCanConvertWorkToTax(
  ownerId: number,
  isHumanOwner: boolean,
  cities: ReadonlyArray<{ id: string; ownerId: number }>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): boolean {
  return isHumanOwner && cities.some(city => city.ownerId === ownerId
    && (builtByCity.get(city.id) ?? []).includes('targowisko'));
}

export function serializePendingWorkTax(pending: ReadonlyMap<number, number>): Array<[number, number]> {
  return [...pending.entries()].filter(([ownerId, amount]) =>
    Number.isFinite(ownerId) && Number.isFinite(amount) && amount > 0);
}

export function restorePendingWorkTax(saved: unknown): Map<number, number> {
  const restored = new Map<number, number>();
  if (!Array.isArray(saved)) return restored;
  for (const row of saved) {
    if (!Array.isArray(row) || row.length !== 2) continue;
    const [ownerId, amount] = row;
    if (Number.isFinite(ownerId) && Number.isFinite(amount) && amount > 0) {
      restored.set(ownerId, amount);
    }
  }
  return restored;
}

export function convertWorkPoolToTax(
  workPool: number,
  requestedWork: number,
  rate: number,
  enabled: boolean,
): WorkTaxConversion {
  const pool = Number.isFinite(workPool) ? Math.max(0, Math.floor(workPool)) : 0;
  const request = Number.isFinite(requestedWork) ? Math.max(0, Math.floor(requestedWork)) : 0;
  const candidateWork = enabled ? Math.min(pool, request) : 0;
  const candidateTax = taxForWorkAmount(candidateWork, rate);
  const workSpent = candidateTax > 0 ? candidateWork : 0;
  return {
    workRemaining: pool - workSpent,
    workSpent,
    taxGained: candidateTax > 0 ? candidateTax : 0,
  };
}

/**
 * Komunikat po akcji zamiany (zawsze zgodny ze stanem: powod odmowy albo realny skutek).
 * `skarbDelta`/`naukaDelta` = zmiana projekcji przychodu/ture z silnika ekonomii (przed -> po).
 * Podatek NIE trafia 1:1 do Skarbca: silnik stosuje korupcje, Mennice, suwak i mnoznik Zamoznosci
 * (zmierzone live: 20 000 Podatku przy 60/20/20 dalo ok. +20 900 Skarbca - Zamoznosc mnozy Skarbiec)
 * Podatek/Nauka/Zamoznosc stolicy (economy.ts, Step 5-8) - komunikat to wprost mowi.
 */
export function workTaxResultMessage(
  conversion: WorkTaxConversion,
  requestedWork: number,
  enabled: boolean,
  poolBefore: number,
  skarbDelta: number,
  naukaDelta: number,
): string {
  if (!enabled) return 'Zamiana Pracy na podatek wymaga Targowiska w imperium.';
  const req = Number.isFinite(requestedWork) ? Math.floor(requestedWork) : 0;
  if (req < 1) return 'Podaj ilość Pracy większą od 0.';
  if (!Number.isFinite(poolBefore) || poolBefore < 1) return 'Brak Pracy w puli imperium - nie ma czego zamienić.';
  if (conversion.workSpent < 1) return 'Przy tym kursie ta ilość Pracy daje 0 Podatku - Praca nie została odjęta.';
  const s = Math.max(0, Math.round(skarbDelta));
  const n = Math.max(0, Math.round(naukaDelta));
  return `Zamieniono ${conversion.workSpent} Pracy na ${conversion.taxGained} Podatku. `
    + `Na koniec tury: +${s} do Skarbca, +${n} do Nauki (wartości z silnika: po korupcji i Mennicy, wg suwaka Podatek/Nauka/Zamożność stolicy; Zamożność dodatkowo mnoży Skarbiec).`;
}

export function executeManualWorkTaxConversion(
  ownerId: number,
  requestedWork: number,
  rate: number,
  enabled: boolean,
  deps: {
    getWorkPool: (ownerId: number) => number;
    setWorkPool: (ownerId: number, value: number) => void;
    queueTax: (ownerId: number, tax: number) => void;
  },
): WorkTaxConversion {
  const conversion = convertWorkPoolToTax(deps.getWorkPool(ownerId), requestedWork, rate, enabled);
  if (conversion.workSpent > 0) {
    deps.setWorkPool(ownerId, conversion.workRemaining);
    deps.queueTax(ownerId, conversion.taxGained);
  }
  return conversion;
}

/**
 * Cala akcja zamiany (wstrzykiwalna, testowalna): projekcja PRZED -> zamiana -> markDirty+refresh
 * (tylko przy sukcesie) -> projekcja PO -> komunikat -> HUD. Kolejnosc jest kontraktem:
 * refresh PRZED zamiana zapisuje baze, markDirty musi poprzedzac refresh PO (bramka `empireEconDirty`).
 */
export function runManualWorkTaxAction(
  ownerId: number,
  requestedWork: number,
  rate: number,
  enabled: boolean,
  io: {
    getWorkPool: (ownerId: number) => number;
    setWorkPool: (ownerId: number, value: number) => void;
    queueTax: (ownerId: number, tax: number) => void;
    refreshRates: () => void;
    markDirty: () => void;
    readRates: () => { skarb: number; nauka: number };
    showMessage: (msg: string) => void;
    updateHud: () => void;
  },
): number {
  const poolBefore = io.getWorkPool(ownerId);
  io.refreshRates();
  const before = io.readRates();
  const conversion = executeManualWorkTaxConversion(ownerId, requestedWork, rate, enabled, io);
  if (conversion.workSpent >= 1) {
    io.markDirty();
    io.refreshRates();
  }
  const after = io.readRates();
  io.showMessage(workTaxResultMessage(conversion, requestedWork, enabled, poolBefore,
    after.skarb - before.skarb, after.nauka - before.nauka));
  io.updateHud();
  return conversion.workSpent;
}
