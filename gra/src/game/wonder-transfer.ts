/**
 * wonder-transfer.ts — R-WEB-WONDER-TRANSFER-ON-CONQUEST-Q1 (decyzja właściciela 2026-11-07, wariant B).
 *
 * ZASADA (jedna, dla miasta i hexa poza miastem): ukończony cud świata należy do cywilizacji, która
 * KONTROLUJE TERYTORIUM jego hexa (territoryOwnerAt: najbliższe miasto w zasięgu, fort/posterunek
 * tylko na terenie wolnym od miast). Własność zmienia się WYŁĄCZNIE przy zdarzeniu zmiany właściciela
 * miasta/węzła (podbój, kapitulacja głodowa, cesja w pokoju, aneksja miasta-państwa, rewolta, odbicie):
 *  - migawka PRZED zdarzeniem: właściciel terytorium każdego cudu;
 *  - migawka PO zdarzeniu: to samo;
 *  - cud przechodzi tylko gdy PRZED == pw.ownerId (spójny stan) i PO != PRZED i PO != null.
 * Dzięki temu NIE ma masowego przepisywania zapisów z niespójną własnością (cud na hexie obcego
 * terytorium, ale z innym ownerId): taki cud zostaje nietknięty, dopóki nie dojdzie do zdarzenia
 * dotyczącego jego rzeczywistego właściciela. Czysta logika, bez zależności od main.ts.
 */

export interface TransferableWonder {
  wonderId: string;
  q: number;
  r: number;
  ownerId: number;
}

export interface WonderTransfer {
  wonderId: string;
  q: number;
  r: number;
  fromOwnerId: number;
  toOwnerId: number;
}

export type WonderTerritorySnapshot = Map<string, number | null>;

/** Migawka: wonderId -> właściciel terytorium hexa cudu (null = poza każdym zasięgiem). */
export function snapshotWonderTerritoryOwners(
  wonders: ReadonlyArray<TransferableWonder>,
  territoryOwnerAt: (q: number, r: number) => number | null,
): WonderTerritorySnapshot {
  const out: WonderTerritorySnapshot = new Map();
  for (const w of wonders) out.set(w.wonderId, territoryOwnerAt(w.q, w.r));
  return out;
}

/** Plan przeniesień (bez mutacji): porównanie migawek PRZED/PO zdarzeniu zmiany właściciela. */
export function planWonderTransfers(
  wonders: ReadonlyArray<TransferableWonder>,
  before: WonderTerritorySnapshot,
  after: WonderTerritorySnapshot,
): WonderTransfer[] {
  const plan: WonderTransfer[] = [];
  for (const w of wonders) {
    const b = before.get(w.wonderId);
    const a = after.get(w.wonderId);
    if (b === undefined || a === undefined || a === null) continue;
    if (b !== w.ownerId) continue; // niespójny stan -> nie zgadujemy
    if (a === b) continue;
    plan.push({ wonderId: w.wonderId, q: w.q, r: w.r, fromOwnerId: w.ownerId, toOwnerId: a });
  }
  return plan;
}

/** Stosuje plan na liście cudów (mutuje ownerId). Zwraca liczbę przeniesionych. Idempotentne. */
export function applyWonderTransfers(
  wonders: TransferableWonder[],
  plan: ReadonlyArray<WonderTransfer>,
): number {
  let n = 0;
  for (const t of plan) {
    const w = wonders.find(x => x.wonderId === t.wonderId);
    if (!w || w.ownerId !== t.fromOwnerId) continue;
    w.ownerId = t.toOwnerId;
    n++;
  }
  return n;
}
