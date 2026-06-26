/**
 * clusters.ts  (lane Civ-MAPA)
 * Rozmieszczenie klastrów typów cywilizacji na mapie.
 *
 * FORMAT (konsumowany przez AI/SILNIK):
 *   ClusterCity       — pojedyncze miasto w klastrze (pozycja + czy stolica)
 *   TypeCluster       — klaster jednego typu (środek Voronoi + lista miast)
 *   ClusterPlacement  — pełny wynik rozmieszczenia dla całej mapy
 *
 * Funkcja computeClusters() jest CZYSTA (bez THREE/DOM/efektów ubocznych).
 * Algorytm: Voronoi środki typów (greedy/Poisson min 15 pól) → per-region Poisson-disk miast (min_dist adaptacyjny do mapy).
 * Deterministyczna: mulberry32 (ten sam seed → ten sam wynik).
 *
 * Skala aktywnych typów (heurystyka wg area = W×H):
 *   < 1200  → mała  → 3 typy
 *   < 3000  → średnia → 5 typów
 *   < 6300  → duża → 7 typów
 *   ≥ 6300  → ogromna → 9 typów
 *
 * Własność: Civ-MAPA rozmieszcza (computeClusters), SILNIK osadza w pętli tury,
 *           AI ekspanduje rywali wewnątrz regionu swojego typu.
 */

import { mulberry32, hexDistanceAxial, isLandTerrain } from './gen-helpers';
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';

// ---------------------------------------------------------------------------
// Klucze typów z civs.json (kolejność = roster, ikonaId z JSON)
// ---------------------------------------------------------------------------
const ROSTER_KLUCZE: string[] = [
  'grecy',
  'rzymianie',
  'chinczycy',
  'inkowie',
  'zulusi',
  'egipt',
  'sumerowie',
  'celtowie',
  'germanie',
];

// ---------------------------------------------------------------------------
// FORMAT — interfejsy (eksport dla AI/SILNIK)
// ---------------------------------------------------------------------------

/** Pojedyncze miasto w klastrze. */
export interface ClusterCity {
  q: number;
  r: number;
  isCapital: boolean; // stolica = miasto najbliższe środka regionu
}

/** Klaster jednego typu cywilizacji. */
export interface TypeCluster {
  typIndex: number;           // 0..N-1 (indeks w tablicy aktywnych typów)
  typ: string;                // klucz z civs.json (np. 'grecy', 'rzym')
  centrum: { q: number; r: number }; // środek regionu Voronoi (ziarno klastra)
  miasta: ClusterCity[];      // do rywaleNaKlaster+1 miast (1 stolica + rywale)
}

/** Pełny wynik rozmieszczenia klastrów dla całej mapy. */
export interface ClusterPlacement {
  rozmiarMapy: 'mala' | 'srednia' | 'duza' | 'ogromna';
  aktywneTypy: number;        // 3/5/7/9
  minDystans: number;         // min odległość między miastami w klastrze (adaptacyjny: mala=4/srednia=6/duza=8/ogromna=9)
  playerTypIndex: number;     // indeks klastra gracza (zawsze 0)
  klastry: TypeCluster[];
}

// ---------------------------------------------------------------------------
// Heurystyka rozmiaru mapy
// ---------------------------------------------------------------------------

function mapSizeLabel(w: number, h: number): 'mala' | 'srednia' | 'duza' | 'ogromna' {
  const area = w * h;
  if (area < 1200) return 'mala';      // np. 36×28 = 1008 → mała (default preview)
  if (area < 3000) return 'srednia';   // np. 50×55 = 2750 → średnia
  if (area < 6300) return 'duza';      // np. 80×75 = 6000 → duża
  return 'ogromna';                    // ≥ 6300
}

function aktywneTypyFromSize(label: 'mala' | 'srednia' | 'duza' | 'ogromna'): number {
  // Mała: 3 typy / Średnia: 5 / Duża: 7 / Ogromna: 9
  const lut: Record<string, number> = { mala: 3, srednia: 5, duza: 7, ogromna: 9 };
  return lut[label]!;
}

/**
 * min_dist adaptacyjny do mapy (mniejsza=gęściej); ~10 miast/klaster na każdym rozmiarze.
 * EKONOMIA/Maciej owns wartości.
 */
function minDystansFromSize(label: 'mala' | 'srednia' | 'duza' | 'ogromna'): number {
  const lut: Record<string, number> = { mala: 4, srednia: 6, duza: 8, ogromna: 9 };
  return lut[label]!;
}

// ---------------------------------------------------------------------------
// COMPUTECLUSTERS — główna funkcja (czysta)
// ---------------------------------------------------------------------------

/**
 * Wyznacza rozmieszczenie klastrów typów na mapie.
 *
 * @param map       Mapa hex z generatora (GameMap).
 * @param opts.seed               Ziarno (domyślnie 42).
 * @param opts.aktywneTypy        Nadpisuje heurystykę wg rozmiaru (3/5/7/9).
 * @param opts.playerTyp          Klucz typu gracza z civs.json (domyślnie 'grecy').
 * @param opts.minDystans         Min odległość heksów między miastami w klastrze (domyślnie: adaptacyjny wg rozmiaru mapy mala=4/srednia=6/duza=8/ogromna=9).
 * @param opts.rywaleNaKlaster    Liczba miast AI w klastrze (domyślnie 9; razem z kapitałem = 10).
 * @param opts.minDystansKlastrow Min odległość między środkami różnych klastrów (domyślnie 15).
 */
export function computeClusters(
  map: GameMap,
  opts?: {
    seed?: number;
    aktywneTypy?: number;
    playerTyp?: string;
    minDystans?: number;
    rywaleNaKlaster?: number;
    minDystansKlastrow?: number;
  },
): ClusterPlacement {
  const seed             = opts?.seed ?? 42;
  const playerTypKlucz   = opts?.playerTyp ?? ROSTER_KLUCZE[0]!;
  const rywaleNaKlaster  = opts?.rywaleNaKlaster ?? 9;
  const minDystKlastrow  = opts?.minDystansKlastrow ?? 15;

  const rand = mulberry32(seed);

  // --- Wymiary mapy ---
  const allHexes = Object.values(map.hexes);
  let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
  for (const h of allHexes) {
    if (h.coords.q < minQ) minQ = h.coords.q;
    if (h.coords.q > maxQ) maxQ = h.coords.q;
    if (h.coords.r < minR) minR = h.coords.r;
    if (h.coords.r > maxR) maxR = h.coords.r;
  }
  const W = maxQ - minQ + 1;
  const H = maxR - minR + 1;

  const rozmiarMapy = mapSizeLabel(W, H);
  const aktywneTypy = opts?.aktywneTypy ?? aktywneTypyFromSize(rozmiarMapy);
  // min_dist adaptacyjny do mapy (mniejsza=gęściej); ~10 miast/klaster na każdym rozmiarze.
  // EKONOMIA/Maciej owns wartości. opts.minDystans (jeśli podany) nadpisuje.
  const minDystans       = opts?.minDystans ?? minDystansFromSize(rozmiarMapy);
  const nTypy = Math.min(aktywneTypy, ROSTER_KLUCZE.length);

  // --- Pola lądowe (zamieszkiwalne — bez Morza i bez Gór) ---
  const ladowe: Array<{ q: number; r: number }> = [];
  for (const h of allHexes) {
    if (h.terenBazowy !== TerenBazowy.Morze && h.terenBazowy !== TerenBazowy.Gory) {
      ladowe.push({ q: h.coords.q, r: h.coords.r });
    }
  }

  if (ladowe.length === 0) {
    // Fallback: brak lądu — zwróć pustą strukturę
    return {
      rozmiarMapy, aktywneTypy: nTypy, minDystans,
      playerTypIndex: 0, klastry: [],
    };
  }

  // Tasowanie lądowych pól (dla losowego wyboru środków)
  const shuffledLad = ladowe.slice();
  for (let i = shuffledLad.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffledLad[i]!;
    shuffledLad[i] = shuffledLad[j]!;
    shuffledLad[j] = tmp;
  }

  // --- ŚRODKI TYPÓW (greedy Poisson z min_dystans_klastrow = 15) ---
  // Gracz zawsze aktywny (playerTypIndex = 0).
  const centrumy: Array<{ q: number; r: number }> = [];

  // Priorytetowo wybieramy środek gracza — pierwsze pasujące pole z tasowanej listy
  // z marginesem od brzegu (≥ minDystKlastrow/2)
  const marginBrzeg = Math.floor(minDystKlastrow / 3);

  function dalekoOdBrzegow(q: number, r: number): boolean {
    return (
      q - minQ >= marginBrzeg && maxQ - q >= marginBrzeg &&
      r - minR >= marginBrzeg && maxR - r >= marginBrzeg
    );
  }

  // Pierwszy środek = gracz
  for (const c of shuffledLad) {
    if (dalekoOdBrzegow(c.q, c.r)) {
      centrumy.push(c);
      break;
    }
  }
  if (centrumy.length === 0) centrumy.push(shuffledLad[0]!); // fallback

  // Kolejne środki (rywale) — greedy, min minDystKlastrow od istniejących
  const maxProb = shuffledLad.length;
  let attempt = 0;
  while (centrumy.length < nTypy && attempt < maxProb) {
    const c = shuffledLad[attempt]!;
    attempt++;
    const tooClose = centrumy.some(
      p => hexDistanceAxial(c.q, c.r, p.q, p.r) < minDystKlastrow,
    );
    if (!tooClose && dalekoOdBrzegow(c.q, c.r)) {
      centrumy.push(c);
    }
  }
  // Fallback jeśli za mało środków z ograniczeniem brzegu — luzujemy
  if (centrumy.length < nTypy) {
    attempt = 0;
    while (centrumy.length < nTypy && attempt < maxProb) {
      const c = shuffledLad[attempt]!;
      attempt++;
      const tooClose = centrumy.some(
        p => hexDistanceAxial(c.q, c.r, p.q, p.r) < minDystKlastrow,
      );
      if (!tooClose) centrumy.push(c);
    }
  }

  // --- Roster typów — gracz na pozycji 0, reszta bez powtórzeń ---
  const playerIdx = ROSTER_KLUCZE.indexOf(playerTypKlucz);
  const playerKlucz = playerIdx >= 0 ? playerTypKlucz : ROSTER_KLUCZE[0]!;

  // Buduj listę aktywnych kluczy typów (gracz pierwszy)
  const rosterBezGracza = ROSTER_KLUCZE.filter(k => k !== playerKlucz);
  // Tasuj resztę losowo (używamy dalszych rand())
  for (let i = rosterBezGracza.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = rosterBezGracza[i]!;
    rosterBezGracza[i] = rosterBezGracza[j]!;
    rosterBezGracza[j] = tmp;
  }
  const aktywneKlucze: string[] = [playerKlucz, ...rosterBezGracza.slice(0, nTypy - 1)];

  // --- VORONOI: każdy lądowy hex → najbliższy środek ---
  // Mapa: centrum_index → lista hex w regionie
  const regiony: Array<Array<{ q: number; r: number }>> = Array.from({ length: centrumy.length }, () => []);

  for (const h of ladowe) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let ci = 0; ci < centrumy.length; ci++) {
      const d = hexDistanceAxial(h.q, h.r, centrumy[ci]!.q, centrumy[ci]!.r);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = ci;
      }
    }
    regiony[bestIdx]!.push(h);
  }

  // --- MIASTA W KLASTRZE: Poisson-disk, max rywaleNaKlaster+1, min_dystans ---
  const klastry: TypeCluster[] = [];
  const totMiastPerKlaster: number[] = [];

  for (let ci = 0; ci < centrumy.length; ci++) {
    const centrum = centrumy[ci]!;
    const region = regiony[ci]!;
    const maxMiast = rywaleNaKlaster + 1; // do 10 (1 stolica + 9 rywali)

    // Tasuj pola regionu losowo (nowy tasowanie na każdy klaster)
    const shuffledRegion = region.slice();
    for (let i = shuffledRegion.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = shuffledRegion[i]!;
      shuffledRegion[i] = shuffledRegion[j]!;
      shuffledRegion[j] = tmp;
    }

    // Greedy Poisson-disk: zachłannie dodawaj z min_dystans
    const picked: Array<{ q: number; r: number }> = [];
    for (const c of shuffledRegion) {
      if (picked.length >= maxMiast) break;
      const tooClose = picked.some(
        p => hexDistanceAxial(c.q, c.r, p.q, p.r) < minDystans,
      );
      if (!tooClose) picked.push(c);
    }

    // Jeśli za mało miast przy pełnym min_dystans → luzuj (nie mniej niż 3)
    if (picked.length < 2) {
      const luzMinDyst = Math.max(3, minDystans - 3);
      for (const c of shuffledRegion) {
        if (picked.length >= maxMiast) break;
        const already = picked.some(p => p.q === c.q && p.r === c.r);
        if (already) continue;
        const tooClose = picked.some(
          p => hexDistanceAxial(c.q, c.r, p.q, p.r) < luzMinDyst,
        );
        if (!tooClose) picked.push(c);
      }
    }

    // Stolica = miasto najbliższe środka regionu
    let capitalIdx = 0;
    let capitalDist = Infinity;
    for (let pi = 0; pi < picked.length; pi++) {
      const d = hexDistanceAxial(picked[pi]!.q, picked[pi]!.r, centrum.q, centrum.r);
      if (d < capitalDist) {
        capitalDist = d;
        capitalIdx = pi;
      }
    }

    const miasta: ClusterCity[] = picked.map((pos, idx) => ({
      q: pos.q,
      r: pos.r,
      isCapital: idx === capitalIdx,
    }));

    totMiastPerKlaster.push(picked.length);

    klastry.push({
      typIndex: ci,
      typ: aktywneKlucze[ci] ?? `typ${ci}`,
      centrum,
      miasta,
    });
  }

  // Logowanie diagnostyczne (tylko w dev — nie blokuje funkcji)
  if (typeof console !== 'undefined') {
    for (let ci = 0; ci < klastry.length; ci++) {
      const k = klastry[ci]!;
      if (k.miasta.length < rywaleNaKlaster + 1) {
        console.warn(
          `[clusters] Klaster '${k.typ}' (region ${ci}): tylko ${k.miasta.length}/${rywaleNaKlaster + 1} miast` +
          ` (region za mały: ${regiony[ci]!.length} pol ladowych)`,
        );
      }
    }
  }

  return {
    rozmiarMapy,
    aktywneTypy: nTypy,
    minDystans,
    playerTypIndex: 0,
    klastry,
  };
}
