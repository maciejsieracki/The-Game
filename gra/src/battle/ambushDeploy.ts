/**
 * R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 -- geometria rozstawienia bitwy z zasadzki.
 *
 * Czysta logika (bez THREE/DOM) uzywana przez battleScene.ts:
 *  - ambushLineIdeal: "dluga linia" zaskoczonych -- w szeregu (poprzek pola) najwyzej
 *    AMBUSH_FORMATION_MAX_WIDTH jednostek, kolejne szeregi cofaja sie wzdluz osi natarcia;
 *  - ambushFlankCells: zastawiajacy AI rozstawia sie na skrzydlach i z tylu linii wroga,
 *    w granicach strefy, bez nakladania i poza mapa;
 *  - ambushResolveCells: przydzial najblizszych wolnych pol do idealnych pozycji (bez
 *    nakladania, w granicach mapy).
 *
 * Bez zadnych zaleznosci od sceny -- testy: gra/tools/ambush-deploy-geometry-test.cjs.
 */
import { AMBUSH_FORMATION_MAX_WIDTH } from '../game/ambush';

export interface AmbushCell {
  readonly col: number;
  readonly row: number;
}

/** Zakres inkluzywny (kolumny i wiersze pola bitwy). */
export interface AmbushBounds {
  readonly col0: number;
  readonly col1: number;
  readonly row0: number;
  readonly row1: number;
}

export type AmbushFreeFn = (col: number, row: number) => boolean;

function inBounds(c: number, r: number, b: AmbushBounds): boolean {
  return c >= b.col0 && c <= b.col1 && r >= b.row0 && r <= b.row1;
}

/**
 * Idealna dluga linia dla n jednostek. Szereg = `width` kolejnych jednostek w poprzek
 * pola (wiersze midRow-1, midRow, midRow+1 dla width=3); kolejny szereg o `rankStep`
 * kolumn dalej (ku tylom strony zaskoczonej). Zwraca pozycje w kolejnosci indeksu jednostki.
 */
export function ambushLineIdeal(
  n: number,
  frontCol: number,
  rankStep: number,
  midRow: number,
  width: number = AMBUSH_FORMATION_MAX_WIDTH,
): AmbushCell[] {
  const w = Math.max(1, Math.floor(width));
  const half = Math.floor(w / 2);
  const out: AmbushCell[] = [];
  for (let i = 0; i < n; i++) {
    const rank = Math.floor(i / w);
    const file = i % w;
    out.push({ col: frontCol + rank * rankStep, row: midRow + (file - half) });
  }
  return out;
}

/**
 * Przydzial idealnych pozycji do wolnych pol: kazda pozycja bierze siebie, jesli
 * wolna (i w granicach), inaczej najblizsze wolne pole w granicach (pierscienie
 * Chebysheva, przy remisie mniejsze |dwiersz|). Null gdy brak miejsca.
 */
export function ambushResolveCells(
  ideal: ReadonlyArray<AmbushCell>,
  bounds: AmbushBounds,
  isFree: AmbushFreeFn,
): AmbushCell[] | null {
  const taken = new Set<string>();
  const key = (c: number, r: number): string => c + ',' + r;
  const maxR = Math.max(bounds.col1 - bounds.col0, bounds.row1 - bounds.row0) + 1;
  const out: AmbushCell[] = [];
  for (const want of ideal) {
    const c0 = Math.max(bounds.col0, Math.min(bounds.col1, want.col));
    const r0 = Math.max(bounds.row0, Math.min(bounds.row1, want.row));
    let found: AmbushCell | null = null;
    for (let ring = 0; ring <= maxR && found === null; ring++) {
      for (let dc = -ring; dc <= ring && found === null; dc++) {
        for (let dr = -ring; dr <= ring; dr++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
          const c = c0 + dc;
          const r = r0 + dr;
          if (!inBounds(c, r, bounds)) continue;
          if (taken.has(key(c, r)) || !isFree(c, r)) continue;
          found = { col: c, row: r };
          break;
        }
      }
    }
    if (found === null) return null;
    taken.add(key(found.col, found.row));
    out.push(found);
  }
  return out;
}

/**
 * Pozycje zastawiajacego AI: najpierw skrzydla (daleko od wiersza srodkowego), potem
 * pola z tylu linii zaskoczonych (daleko od ich kotwicy frontu). Deterministyczne
 * (remis: mniejszy wiersz, potem mniejsza kolumna). Null gdy wolnych pol za malo.
 */
export function ambushFlankCells(
  n: number,
  bounds: AmbushBounds,
  isFree: AmbushFreeFn,
  midRow: number,
  surprisedFrontCol: number,
): AmbushCell[] | null {
  if (n <= 0) return [];
  const scored: { col: number; row: number; score: number }[] = [];
  for (let r = bounds.row0; r <= bounds.row1; r++) {
    for (let c = bounds.col0; c <= bounds.col1; c++) {
      if (!isFree(c, r)) continue;
      const flank = Math.abs(r - midRow);
      const behind = Math.abs(c - surprisedFrontCol);
      scored.push({ col: c, row: r, score: flank * 2 + behind * 0.5 });
    }
  }
  if (scored.length < n) return null;
  scored.sort((a, b) =>
    (b.score - a.score) || (a.row - b.row) || (a.col - b.col));
  return scored.slice(0, n).map(s => ({ col: s.col, row: s.row }));
}
