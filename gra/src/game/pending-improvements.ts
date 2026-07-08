/**
 * pending-improvements.ts — ulepszenia terenu w bieżącej turze (cofanie do endTurn).
 * Pending = wizualnie na mapie + Praca zarezerwowana; po endTurn → committed (bez cofania).
 */
import type { ImprovementKey } from '../render/improvements';
import type { ImprovementActionTyp } from './improvement-tech';

export interface PendingImprovementEntry {
  hexKey: string;
  key: ImprovementKey;
  kosztPraca: number;
  action: ImprovementActionTyp;
}

/** Id wpisu pending: „q,r:kluczUlepszenia". */
export function pendingImprovementId(hexKey: string, improvementKey: string): string {
  return `${hexKey}:${improvementKey}`;
}

export function parsePendingImprovementId(id: string): { hexKey: string; key: string } | null {
  const idx = id.lastIndexOf(':');
  if (idx <= 0) return null;
  return { hexKey: id.slice(0, idx), key: id.slice(idx + 1) };
}

/** Wpisy ulepszeń/wycinek postawionych w tej turze — cofanie do commitTurn(). */
export class PendingImprovementsTurn {
  private readonly entries = new Map<string, PendingImprovementEntry>();

  get size(): number {
    return this.entries.size;
  }

  has(hexKey: string, key: string): boolean {
    return this.entries.has(pendingImprovementId(hexKey, key));
  }

  get(hexKey: string, key: string): PendingImprovementEntry | undefined {
    return this.entries.get(pendingImprovementId(hexKey, key));
  }

  /** Zbiór id do kwalifikacji / podświetlenia cofania w build API. */
  getUndoKeySet(): ReadonlySet<string> {
    return new Set(this.entries.keys());
  }

  add(entry: PendingImprovementEntry): void {
    this.entries.set(pendingImprovementId(entry.hexKey, entry.key), entry);
  }

  remove(hexKey: string, key: string): PendingImprovementEntry | undefined {
    const id = pendingImprovementId(hexKey, key);
    const e = this.entries.get(id);
    if (e) this.entries.delete(id);
    return e;
  }

  /** Koniec tury gracza — pending → committed (brak cofania). */
  commitTurn(): void {
    this.entries.clear();
  }

  toSave(): PendingImprovementEntry[] {
    return [...this.entries.values()];
  }

  static fromSave(rows: PendingImprovementEntry[] | undefined): PendingImprovementsTurn {
    const p = new PendingImprovementsTurn();
    if (rows?.length) {
      for (const e of rows) p.add(e);
    }
    return p;
  }
}
