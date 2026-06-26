/**
 * gen-helpers.ts
 * Reuzywalne, deterministyczne (seedowane) helpery dla generatora mapy.
 *
 * Wydzielone z generator.ts, by:
 *   - logika szumu -> teren byla nazwana i testowalna,
 *   - zloza mineralne mialy jasne reguly per teren,
 *   - rzeki i pozycje startowe powstawaly deterministycznie z ziarna.
 *
 * Konwencja heksow: POINTY-TOP aksjalne (q, r). s = -q - r.
 * Wszystkie funkcje sa czyste (pure) — bez DOM/THREE/efektow ubocznych.
 */

import type { Hex } from '../types/hex';
import { TerenBazowy, Nakladka } from '../types/hex';

// ===========================================================================
// 0. TYP SWIATA
// ===========================================================================

/**
 * Typ swiata okreslajacy ksztalt ladu.
 *   - 'kontynenty': kilka wiekszych, oddzielnych mas ladowych (domyslny).
 *   - 'pangea'    : jeden duzy kontynent w centrum.
 *   - 'wyspy'     : archipelag — duzo malych wysp.
 */
export type TypSwiata = 'kontynenty' | 'pangea' | 'wyspy';

// ===========================================================================
// 1. PRNG — mulberry32 (deterministyczny, szybki, dobra dystrybucja)
// ===========================================================================

/**
 * Mulberry32: deterministyczny generator [0,1) z 32-bitowego ziarna.
 * Te same ziarno -> ta sama sekwencja liczb na kazdej platformie.
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ===========================================================================
// 2. Value noise 2D — permutacja + interpolacja cosinusowa + fBm
// ===========================================================================

/** Buduje 256-elementowa tablice permutacji metoda Fishera-Yatesa z `rand`. */
export function buildPermTable(rand: () => number): Uint8Array {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i]!; p[i] = p[j]!; p[j] = tmp;
  }
  return p;
}

/** Interpolacja cosinusowa miedzy a i b dla t w [0,1]. */
export function cosLerp(a: number, b: number, t: number): number {
  const f = (1 - Math.cos(t * Math.PI)) * 0.5;
  return a * (1 - f) + b * f;
}

/** 2D value noise w punkcie (x,y) z tablicy permutacji p. Zwraca [0,1]. */
export function valueNoise2D(p: Uint8Array, x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // hash(xi,yi) -> pseudolosowa wartosc w [0,1]
  const hash = (ix: number, iy: number) => ((p[(p[ix & 255]! + iy) & 255]!) / 255);

  const v00 = hash(xi,     yi);
  const v10 = hash(xi + 1, yi);
  const v01 = hash(xi,     yi + 1);
  const v11 = hash(xi + 1, yi + 1);

  const top    = cosLerp(v00, v10, xf);
  const bottom = cosLerp(v01, v11, xf);
  return cosLerp(top, bottom, yf);
}

/** Fractal Brownian Motion: sumuje `octaves` oktaw value-noise. Zwraca [0,1]. */
export function fbm(p: Uint8Array, x: number, y: number, octaves = 4): number {
  let value = 0, amplitude = 0.5, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value    += valueNoise2D(p, x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude  *= 0.5;
    frequency  *= 2.0;
  }
  return value / maxValue;
}

// ===========================================================================
// 3. Geometria heksów (pointy-top aksjalne)
// ===========================================================================

/** Szesc kierunkow sasiadow aksjalnych (pointy-top). */
export const HEX_DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [+1,  0], [+1, -1], [0, -1],
  [-1,  0], [-1, +1], [0, +1],
] as const;

/**
 * Aksjalna (szescienna) odleglosc heksowa miedzy (aq,ar) a (bq,br).
 * W cube coords: s = -q - r. Odleglosc = max(|dq|,|dr|,|ds|).
 * Samodzielna kopia — spojna z hexDistance() z units/setup.ts.
 */
export function hexDistanceAxial(aq: number, ar: number, bq: number, br: number): number {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
}

/** Klucz heksa "q,r" — zgodny z GameMap.hexes. */
export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

// ===========================================================================
// 4. Maska kontynentalna — ORYGINALNA + warianty per TypSwiata
// ===========================================================================

/** Parametry ksztaltowania ladu/biomow (skale szumow itp.). */
export interface ShapeParams {
  noiseScale: number;
  mountainScale: number;
  forestScale: number;
  desertScale: number;
  /** Offsety, by gory/las/pustynia nie pokrywaly sie idealnie. */
  offMtnX: number; offMtnY: number;
  offForX: number; offForY: number;
  offDesX: number; offDesY: number;
}

/**
 * Domyslne parametry ksztaltowania, z deterministycznymi offsetami z `rand`.
 * Wywolaj RAZ na poczatku generacji (kolejnosc rand() ma znaczenie!).
 */
export function defaultShapeParams(rand: () => number): ShapeParams {
  return {
    noiseScale:    0.13,
    mountainScale: 0.22,
    forestScale:   0.19,
    desertScale:   0.17,
    offMtnX: rand() * 500, offMtnY: rand() * 500,
    offForX: rand() * 500, offForY: rand() * 500,
    offDesX: rand() * 500, offDesY: rand() * 500,
  };
}

/**
 * Eliptyczna maska ladowa — ORYGINALNA (domyslna dla 'kontynenty').
 * 1 w centrum, 0 przy krawedziach.
 */
export function landMaskAt(q: number, r: number, width: number, height: number): number {
  const cx = (width  - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, 1 - Math.pow(dist / 0.85, 2.0));
}

// ---------------------------------------------------------------------------
// Parametry centrów kontynentów (generowane deterministycznie z rand).
// ---------------------------------------------------------------------------

export interface ContinentCenter {
  nq: number; // znormalizowane polozenie q w [0,1]
  nr: number; // znormalizowane polozenie r w [0,1]
  radius: number; // promien wplywu (znormalizowany)
}

/**
 * Generuje N deterministycznych centrow kontynentow.
 * Centra sa rozmieszczone w srodkowej 70% mapy (nie przy krawedzi).
 */
export function buildContinentCenters(rand: () => number, n: number): ContinentCenter[] {
  const centers: ContinentCenter[] = [];
  const margin = 0.15;
  for (let i = 0; i < n; i++) {
    centers.push({
      nq: margin + rand() * (1 - 2 * margin),
      nr: margin + rand() * (1 - 2 * margin),
      radius: 0.28 + rand() * 0.12, // promien 28-40% mapy
    });
  }
  return centers;
}

/**
 * Maska ladowa dla trybu 'kontynenty':
 *   Kilka (2-4) oddzielnych ośrodków lądowych; poza nimi — morze.
 *   Efekt: kilka wyraźnie oddzielonych kontynentalnych mas.
 *
 * Algorytm: dla każdego centrum radialny spadek; finalna maska =
 *   max wartość spośród wszystkich centrów (efekt "wysp"), dodatkowo
 *   przybliżona maska krawędziowa by brzegi były morzem.
 */
export function landMaskKontynenty(
  q: number, r: number,
  width: number, height: number,
  centers: ContinentCenter[],
  perm: Uint8Array,
  noiseScale: number,
): number {
  const nq = q / (width  - 1);
  const nr = r / (height - 1);

  // Maska krawędziowa — wygasza ląd przy brzegach mapy
  const edgeQ = Math.min(nq, 1 - nq) / 0.12;
  const edgeR = Math.min(nr, 1 - nr) / 0.10;
  const edgeMask = Math.min(1, edgeQ) * Math.min(1, edgeR);

  let best = 0;
  for (const c of centers) {
    const dq = nq - c.nq;
    const dr = nr - c.nr;
    const dist = Math.sqrt(dq * dq + dr * dr);
    // Radialny spadek Gaussowski
    const radial = Math.max(0, 1 - Math.pow(dist / c.radius, 1.8));
    if (radial > best) best = radial;
  }

  // Lekki szum deformujący granicę kontynentów
  const warp = fbm(perm, q * noiseScale * 0.7 + 100, r * noiseScale * 0.7 + 100, 3) * 0.25;
  return Math.min(1, Math.max(0, (best + warp - 0.12) * edgeMask));
}

/**
 * Maska ladowa dla trybu 'pangea':
 *   Jeden duzy kontynent — silny centralny bias.
 *   Masy ladowej jest dużo, morze tylko przy krawędziach.
 */
export function landMaskPangea(
  q: number, r: number,
  width: number, height: number,
  perm: Uint8Array,
  noiseScale: number,
): number {
  const cx = (width  - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Szeroki radialny spadek — Pangea zajmuje ~70% powierzchni
  const radial = Math.max(0, 1 - Math.pow(dist / 1.05, 1.4));

  // Szum deformujacy brzegi
  const warp = fbm(perm, q * noiseScale * 0.6 + 200, r * noiseScale * 0.6 + 200, 3) * 0.30;
  return Math.min(1, Math.max(0, radial + warp - 0.05));
}

/**
 * Maska ladowa dla trybu 'wyspy':
 *   Duzej skali szum jako jedyna maska — wiele malych, izolowanych wysp.
 *   Brak centralnego biasu — wyspy rozrzucone losowo po całej mapie.
 *   Próg morze/ląd wyższy niż normalnie (classifyTerrain tego nie wie,
 *   więc PODNOSIMY wartość maski wysp, by compensate za niższy próg).
 */
export function landMaskWyspy(
  q: number, r: number,
  width: number, height: number,
  perm: Uint8Array,
  noiseScale: number,
): number {
  // Maska krawędziowa — wyspy też nie sięgają samego brzegu
  const nq = q / (width  - 1);
  const nr = r / (height - 1);
  const edgeQ = Math.min(nq, 1 - nq) / 0.08;
  const edgeR = Math.min(nr, 1 - nr) / 0.08;
  const edgeMask = Math.min(1, edgeQ) * Math.min(1, edgeR);

  // Drobniejszy szum (wyższa skala) = mniejsze wyspy
  const coarse = fbm(perm, q * noiseScale * 1.1 + 300, r * noiseScale * 1.1 + 300, 4);
  const fine   = fbm(perm, q * noiseScale * 2.2 + 400, r * noiseScale * 2.2 + 400, 3) * 0.3;

  // Konwertuj [0,1] noise na "wyspa/morze":
  //   wartości > 0.5 → ląd; < 0.5 → morze.
  //   Podnosimy o 0.10 by wyspy były mniejsze i bardziej izolowane.
  return Math.min(1, Math.max(0, (coarse + fine - 0.50) * 1.6 * edgeMask));
}

/** Wynik klasyfikacji jednego heksa: teren bazowy + nakladka lesna. */
export interface TerrainResult {
  terenBazowy: TerenBazowy;
  nakladka: Nakladka;
}

/**
 * Klasyfikuje teren jednego heksa na podstawie szumow i maski ladu.
 * Zachowuje DOKLADNIE logike z oryginalnego generator.ts (te same progi),
 * jedynie wydzielona do nazwanej, testowalnej funkcji.
 *
 * @param elevContinental elevation * landMask (juz po przemnozeniu)
 * @param landMask        surowa maska ladu w tym heksie
 * @param mtnNoise        szum gor [0,1]
 * @param forNoise        szum lasu [0,1]
 * @param desNoise        szum pustyni [0,1]
 */
export function classifyTerrain(
  elevContinental: number,
  landMask: number,
  mtnNoise: number,
  forNoise: number,
  desNoise: number,
): TerrainResult {
  let terenBazowy: TerenBazowy;
  let nakladka: Nakladka = Nakladka.Brak;

  if (elevContinental < 0.07) {
    terenBazowy = TerenBazowy.Morze;
  } else if (elevContinental < 0.14) {
    terenBazowy = TerenBazowy.Wybrzeze;
  } else {
    const isHighlands = mtnNoise > 0.60 && landMask > 0.25;
    const isMountain  = mtnNoise > 0.75 && landMask > 0.30;

    if (isMountain && elevContinental > 0.20) {
      terenBazowy = TerenBazowy.Gory;
    } else if (isHighlands && elevContinental > 0.16) {
      terenBazowy = TerenBazowy.Wzgorza;
    } else if (desNoise > 0.63 && elevContinental > 0.18 && elevContinental < 0.45) {
      terenBazowy = TerenBazowy.Pustynia;
    } else if (elevContinental > 0.35) {
      terenBazowy = TerenBazowy.Rownina;
    } else {
      terenBazowy = TerenBazowy.Laka;
    }

    // Las (nie na pustyni, nie na gorach)
    if (
      terenBazowy !== TerenBazowy.Gory &&
      terenBazowy !== TerenBazowy.Pustynia &&
      forNoise > 0.58 &&
      elevContinental > 0.20
    ) {
      nakladka = Nakladka.Las;
    }
  }

  return { terenBazowy, nakladka };
}

/** Czy teren bazowy jest ladem nadajacym sie pod osadnika (Laka/Rownina/Wzgorza/Pustynia)? */
export function isLandTerrain(tb: TerenBazowy): boolean {
  return (
    tb === TerenBazowy.Laka ||
    tb === TerenBazowy.Rownina ||
    tb === TerenBazowy.Wzgorza ||
    tb === TerenBazowy.Pustynia
  );
}

// ===========================================================================
// 5. Rzeki — deterministyczne sledzenie w dol (descend lowest elevation rank)
// ===========================================================================

/** Ranking wysokosci terenu (nizszy = nizej nad poziomem morza). */
export const ELEVATION_RANK: Record<TerenBazowy, number> = {
  [TerenBazowy.Morze]:    0,
  [TerenBazowy.Wybrzeze]: 1,
  [TerenBazowy.Laka]:     2,
  [TerenBazowy.Pustynia]: 3,
  [TerenBazowy.Rownina]:  4,
  [TerenBazowy.Wzgorza]:  5,
  [TerenBazowy.Gory]:     6,
};

/**
 * Sledzi rzeke od (sq,sr) schodzac do najnizszego sasiada az do morza/krawedzi.
 * Deterministyczne: wsrod rownorzednych sasiadow bierze pierwszego.
 * Zwraca sciezke wspolrzednych (wlacznie ze zrodlem).
 */
export function traceRiver(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  maxLen = 40,
): Array<{ q: number; r: number }> {
  const path: Array<{ q: number; r: number }> = [{ q: sq, r: sr }];
  const visited = new Set<string>([hexKey(sq, sr)]);
  let cq = sq, cr = sr;

  for (let step = 0; step < maxLen; step++) {
    const curHex = hexes[hexKey(cq, cr)];
    if (!curHex) break;
    if (curHex.terenBazowy === TerenBazowy.Morze) break;

    let bestRank = ELEVATION_RANK[curHex.terenBazowy];
    let bestNeighbors: Array<[number, number]> = [];

    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const key = hexKey(nq, nr);
      if (visited.has(key)) continue;
      const nhex = hexes[key];
      if (!nhex) continue;
      const rank = ELEVATION_RANK[nhex.terenBazowy];
      if (rank < bestRank) {
        bestRank = rank;
        bestNeighbors = [[nq, nr]];
      } else if (rank === bestRank) {
        bestNeighbors.push([nq, nr]);
      }
    }

    if (bestNeighbors.length === 0) break; // utknelismy w lokalnym minimum
    const next = bestNeighbors[0]!;
    path.push({ q: next[0], r: next[1] });
    visited.add(hexKey(next[0], next[1]));
    cq = next[0];
    cr = next[1];

    const nHex = hexes[hexKey(cq, cr)];
    if (nHex && nHex.terenBazowy === TerenBazowy.Morze) break;
  }
  return path;
}

/**
 * Generuje do `maxRivers` rzek z gor/wzgorz i oznacza heksy rzeki.
 * Deterministyczne: wybor zrodel oparty na `rand` i staonly offsecie proby.
 * Mutuje hexes (ustawia rzeka.obecna=true na trasie) i zwraca liste tras.
 */
export function generateRivers(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  rand: () => number,
  opts: { maxRivers?: number; minLen?: number; maxLen?: number; margin?: number } = {},
): { q: number; r: number }[][] {
  const maxRivers = opts.maxRivers ?? 2;
  const minLen    = opts.minLen ?? 4;
  const maxLen    = opts.maxLen ?? 40;
  const margin    = opts.margin ?? 2;

  // Zbierz kandydatow na zrodla: Gory i Wzgorza z wnetrza mapy.
  const riverSources: Array<[number, number]> = [];
  for (let r = margin; r < height - margin; r++) {
    for (let q = margin; q < width - margin; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex) continue;
      const t = hex.terenBazowy;
      if (t === TerenBazowy.Gory || t === TerenBazowy.Wzgorza) {
        riverSources.push([q, r]);
      }
    }
  }

  const riverPaths: { q: number; r: number }[][] = [];
  const usedHexKeys = new Set<string>();
  const total = riverSources.length;

  if (total > 0) {
    const step = Math.max(1, Math.floor(total / 8));

    for (let river = 0; river < maxRivers; river++) {
      let best: Array<{ q: number; r: number }> = [];

      for (let attempt = 0; attempt < 8; attempt++) {
        const seedOffset = Math.floor(rand() * total);
        const idx = (seedOffset + attempt * step) % total;
        const src = riverSources[idx];
        if (!src) continue;
        const srcKey = hexKey(src[0], src[1]);
        if (usedHexKeys.has(srcKey)) continue;

        const candidate = traceRiver(hexes, src[0], src[1], maxLen);
        if (candidate.length > best.length) best = candidate;
      }

      if (best.length >= minLen) {
        riverPaths.push(best);
        for (const { q, r } of best) {
          const hex = hexes[hexKey(q, r)];
          if (hex) hex.rzeka = { obecna: true, krawedzie: [] };
          usedHexKeys.add(hexKey(q, r));
        }
      }
    }
  }

  // Fallback: jesli nic nie wygenerowano, falista linia przez srodek.
  if (riverPaths.length === 0) {
    const fallback: Array<{ q: number; r: number }> = [];
    const midR = Math.floor(height / 2);
    for (let q = 0; q < width; q += 2) {
      const r = midR + (q % 4 === 0 ? -1 : 1);
      fallback.push({ q, r });
      const hex = hexes[hexKey(q, r)];
      if (hex) hex.rzeka = { obecna: true, krawedzie: [] };
    }
    if (fallback.length >= minLen) riverPaths.push(fallback);
  }

  return riverPaths;
}

// ===========================================================================
// 6. Zloza mineralne — reguly per teren
// ===========================================================================

/**
 * Hex z opcjonalnym polem `zloze` na potrzeby zloz nie majacych reprezentacji
 * w enumie Nakladka (np. wegiel). Pole jest OPCJONALNE i wstecznie zgodne —
 * nie wymaga zmiany typu Hex w src/types/hex.ts. Kod nie znajacy `zloze`
 * dziala bez zmian.
 */
export type HexWithZloze = Hex & { zloze?: string };

/**
 * Regula zloza: jaka Nakladke (lub znacznik `zloze`) i na jakim terenie.
 * - ruda  -> Nakladka.ZlozeRudy  na Wzgorza/Gory
 * - glina -> Nakladka.ZlozeGliny na Laka, Wybrzeze (brzeg) lub dowolny lad z rzeka
 * - konie -> Nakladka.ZlozeKonia na Rownina
 * - wegiel-> brak enumu: znacznik hex.zloze='wegiel' na Gory
 */
export interface DepositRule {
  id: 'ruda' | 'glina' | 'konie' | 'wegiel';
  /** Wartosc Nakladka do ustawienia (lub null gdy uzywamy pola `zloze`). */
  nakladka: Nakladka | null;
  /** Predykat: czy ten heks moze przyjac to zloze. */
  allowedOn: (hex: Hex) => boolean;
  /** Rzadkosc: ulamek pasujacych heksow, ktore dostana zloze (0..1). */
  rarity: number;
}

/** Predykaty terenu dla zloz (eksport — uzywane w testach). */
export const DEPOSIT_RULES: DepositRule[] = [
  {
    id: 'ruda',
    nakladka: Nakladka.ZlozeRudy,
    allowedOn: (h) => h.terenBazowy === TerenBazowy.Wzgorza || h.terenBazowy === TerenBazowy.Gory,
    rarity: 0.12,
  },
  {
    id: 'glina',
    nakladka: Nakladka.ZlozeGliny,
    allowedOn: (h) =>
      h.terenBazowy === TerenBazowy.Laka ||
      h.terenBazowy === TerenBazowy.Wybrzeze ||
      (isLandTerrain(h.terenBazowy) && h.rzeka?.obecna === true),
    rarity: 0.10,
  },
  {
    id: 'konie',
    nakladka: Nakladka.ZlozeKonia,
    allowedOn: (h) => h.terenBazowy === TerenBazowy.Rownina,
    rarity: 0.10,
  },
  {
    id: 'wegiel',
    nakladka: null, // brak w enumie Nakladka -> znacznik hex.zloze
    allowedOn: (h) => h.terenBazowy === TerenBazowy.Gory,
    rarity: 0.10,
  },
];

/**
 * Rozmieszcza zloza mineralne deterministycznie i rzadko.
 *
 * Zasady (par. reguly powyzej):
 *   - kazdy heks moze miec NAJWYZEJ jedno zloze;
 *   - las (Nakladka.Las) nie jest nadpisywany (zloze tylko na "Brak");
 *   - dla danego ziarna wynik jest identyczny (sortowanie po kluczu + PRNG).
 *
 * Mutuje hexes: ustawia hex.nakladka (ruda/glina/konie) albo hex.zloze (wegiel).
 * Zwraca licznik rozmieszczonych zloz per typ.
 *
 * @param hexes mapa heksow do zmodyfikowania
 * @param seed  ziarno deterministyczne (oddzielny strumien od reszty generacji)
 * @param rules reguly zloz (domyslnie DEPOSIT_RULES)
 */
export function placeDeposits(
  hexes: Record<string, Hex>,
  seed: number,
  rules: DepositRule[] = DEPOSIT_RULES,
): Record<string, number> {
  // Wlasny, oddzielny strumien losowy — niezalezny od kolejnosci innych rand().
  const rand = mulberry32((seed ^ 0x9e3779b9) >>> 0);

  // Deterministyczna kolejnosc iteracji: sortuj klucze "q,r" numerycznie.
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number);
    const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? (aq! - bq!) : (ar! - br!);
  });

  const counts: Record<string, number> = { ruda: 0, glina: 0, konie: 0, wegiel: 0 };

  for (const key of keys) {
    const hex = hexes[key] as HexWithZloze | undefined;
    if (!hex) continue;
    // Nie nadpisuj lasu ani istniejacych nakladek; jedno zloze na heks.
    if (hex.nakladka !== Nakladka.Brak) continue;
    if (hex.zloze) continue;

    for (const rule of rules) {
      if (!rule.allowedOn(hex)) continue;
      // Rzut PRNG dla kazdej pasujacej reguly — deterministyczny przy danym seed.
      if (rand() < rule.rarity) {
        if (rule.nakladka !== null) {
          hex.nakladka = rule.nakladka;
        } else {
          hex.zloze = rule.id;
        }
        counts[rule.id] = (counts[rule.id] ?? 0) + 1;
        break; // jedno zloze na heks
      }
    }
  }

  return counts;
}

// ===========================================================================
// 7. Pozycje startowe — Poisson-disk-like, deterministyczne, zbalansowane
// ===========================================================================

/** Pojedyncza pozycja startowa na ladzie. */
export interface StartPosition {
  q: number;
  r: number;
}

/**
 * Zwraca >= minCount pozycji startowych na ladzie, parami oddalonych
 * o co najmniej minDist (heks-distance). Deterministyczne dla danego seed.
 *
 * Algorytm (Poisson-disk-like, zachlanny):
 *   1. Zbierz wszystkie ladowe heksy (isLandTerrain), posortuj deterministycznie.
 *   2. Przetasuj Fishera-Yatesa seedowanym PRNG (rownomierny rozrzut, nie tylko
 *      lewy-gorny rog).
 *   3. Zachlannie dodawaj kandydatow oddalonych >= minDist od juz wybranych.
 *   4. Jesli nie uzbierano minCount, stopniowo luzuj minDist (>= absMinDist),
 *      by zawsze zwrocic minCount pozycji (o ile na mapie jest tyle ladu).
 *
 * @returns posortowana wg q,r lista pozycji (stabilna kolejnosc wyjscia).
 */
export function computeStartPositions(
  hexes: Record<string, Hex>,
  seed: number,
  opts: { minCount?: number; minDist?: number; absMinDist?: number } = {},
): StartPosition[] {
  const minCount   = opts.minCount ?? 5;
  const minDist    = opts.minDist ?? 5;
  const absMinDist = opts.absMinDist ?? 2;

  // 1. Ladowe heksy w deterministycznej kolejnosci.
  const land: StartPosition[] = [];
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number);
    const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? (aq! - bq!) : (ar! - br!);
  });
  for (const key of keys) {
    const hex = hexes[key];
    if (hex && isLandTerrain(hex.terenBazowy)) {
      land.push({ q: hex.coords.q, r: hex.coords.r });
    }
  }
  if (land.length === 0) return [];

  // 2. Seedowane tasowanie (oddzielny strumien losowy).
  const rand = mulberry32((seed ^ 0x85ebca6b) >>> 0);
  const shuffled = land.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffled[i]!; shuffled[i] = shuffled[j]!; shuffled[j] = tmp;
  }

  // 3/4. Zachlanny dobor z luzowaniem minDist az do minCount.
  function greedyPick(dist: number): StartPosition[] {
    const picked: StartPosition[] = [];
    for (const c of shuffled) {
      const tooClose = picked.some(p => hexDistanceAxial(c.q, c.r, p.q, p.r) < dist);
      if (!tooClose) picked.push(c);
    }
    return picked;
  }

  let result: StartPosition[] = [];
  for (let d = minDist; d >= absMinDist; d--) {
    result = greedyPick(d);
    if (result.length >= minCount) {
      // Przytnij do "ladnej" liczby, ale zachowaj te z najwyzszym dystansem:
      // greedyPick juz daje pozycje >= d; zostawiamy wszystkie >= minCount.
      break;
    }
  }

  // Jesli nawet przy absMinDist nie ma minCount (bardzo malo ladu),
  // dolacz pozostale ladowe heksy zachowujac maksymalny mozliwy rozrzut.
  if (result.length < minCount) {
    const have = new Set(result.map(p => hexKey(p.q, p.r)));
    for (const c of shuffled) {
      if (result.length >= minCount) break;
      const k = hexKey(c.q, c.r);
      if (!have.has(k)) { result.push(c); have.add(k); }
    }
  }

  // Stabilna kolejnosc wyjscia: sortuj wg q,r.
  result.sort((a, b) => (a.q !== b.q ? a.q - b.q : a.r - b.r));
  return result;
}
