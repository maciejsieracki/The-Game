/**
 * generator.ts
 * Deterministyczny generator mapy hex dla The Game.
 *
 * Konwencja heksów: POINTY-TOP aksjalne (q, r).
 * Algorytm: mulberry32 PRNG + 2D value-noise (fBm, 3 oktawy)
 * → płynny kontynent w środku, morze przy krawędziach,
 *   pasma wzgórz/gór, lasy jako nakładka, trochę pustyni.
 */

import type { GameMap } from '../types/map';
import type { Hex, HexCoords } from '../types/hex';
import { TerenBazowy, Nakladka, Ulepszenie, Widocznosc } from '../types/hex';

// ---------------------------------------------------------------------------
// PRNG — mulberry32 (deterministyczny, szybki, dobra dystrybucja)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Value noise 2D — siatka permutacji + interpolacja cosinusowa
// ---------------------------------------------------------------------------

function buildPermTable(rand: () => number): Uint8Array {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i]!; p[i] = p[j]!; p[j] = tmp;
  }
  return p;
}

function cosLerp(a: number, b: number, t: number): number {
  const f = (1 - Math.cos(t * Math.PI)) * 0.5;
  return a * (1 - f) + b * f;
}

function valueNoise2D(p: Uint8Array, x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // hash(xi,yi) → pseudo-random gradient value in [0,1]
  const hash = (ix: number, iy: number) => ((p[(p[ix & 255]! + iy) & 255]!) / 255);

  const v00 = hash(xi,     yi);
  const v10 = hash(xi + 1, yi);
  const v01 = hash(xi,     yi + 1);
  const v11 = hash(xi + 1, yi + 1);

  const top    = cosLerp(v00, v10, xf);
  const bottom = cosLerp(v01, v11, xf);
  return cosLerp(top, bottom, yf);
}

function fbm(p: Uint8Array, x: number, y: number, octaves = 4): number {
  let value = 0, amplitude = 0.5, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value    += valueNoise2D(p, x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude  *= 0.5;
    frequency  *= 2.0;
  }
  return value / maxValue;
}

// ---------------------------------------------------------------------------
// Główna funkcja generatora
// ---------------------------------------------------------------------------

/** Mały roboczy rozmiar mapy: ~36×28 heksów (pasuje pod ~6 rywali). */
export const DEFAULT_WIDTH  = 36;
export const DEFAULT_HEIGHT = 28;

/** Generuje GameMap deterministycznie ze złożoności ziarna `seed`. */
export function generateMap(
  width  = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  seed   = 42,
): GameMap {
  const rand = mulberry32(seed);
  const perm = buildPermTable(rand);

  // Skala szumu — większa = płynniejsze przejścia
  const NOISE_SCALE      = 0.13;
  const MOUNTAIN_SCALE   = 0.22;
  const FOREST_SCALE     = 0.19;
  const DESERT_SCALE     = 0.17;

  // Offset sumu żeby góry i las nie pokrywały się idealnie
  const offMtnX = rand() * 500;
  const offMtnY = rand() * 500;
  const offForX = rand() * 500;
  const offForY = rand() * 500;
  const offDesX = rand() * 500;
  const offDesY = rand() * 500;

  const hexes: Record<string, Hex> = {};

  // Środek mapy (dla maski kontynentalnej — elipsa)
  const cx = (width  - 1) / 2;
  const cy = (height - 1) / 2;

  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const coords: HexCoords = { q, r };
      const key = `${q},${r}`;

      // ── Maska odległości od brzegu (elipsa) ──────────────────────────
      const dx = (q - cx) / (cx + 0.5);
      const dy = (r - cy) / (cy + 0.5);
      // dist=0 w centrum, dist=1 na granicy ellipsy
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Maska lądowa: 1 w centrum, 0 na krawędziach (gradient)
      const landMask = Math.max(0, 1 - Math.pow(dist / 0.85, 2.0));

      // ── Szum bazowy (elevation) ───────────────────────────────────────
      const nx = q * NOISE_SCALE;
      const ny = r * NOISE_SCALE;
      const elevation = fbm(perm, nx, ny, 4);

      // Łączymy szum z maską — by brzegi były morzem
      const elevContinental = elevation * landMask;

      // ── Szum gór ─────────────────────────────────────────────────────
      const mtnNoise = fbm(perm, q * MOUNTAIN_SCALE + offMtnX, r * MOUNTAIN_SCALE + offMtnY, 3);

      // ── Szum lasu ────────────────────────────────────────────────────
      const forNoise = fbm(perm, q * FOREST_SCALE + offForX, r * FOREST_SCALE + offForY, 3);

      // ── Szum pustyni ─────────────────────────────────────────────────
      const desNoise = fbm(perm, q * DESERT_SCALE + offDesX, r * DESERT_SCALE + offDesY, 3);

      // ── Klasyfikacja terenu ───────────────────────────────────────────
      let terenBazowy: TerenBazowy;
      let nakladka: Nakladka = Nakladka.Brak;

      if (elevContinental < 0.07) {
        // Głębokie morze przy krawędziach
        terenBazowy = TerenBazowy.Morze;
      } else if (elevContinental < 0.14) {
        // Wąski pas wybrzeża
        terenBazowy = TerenBazowy.Wybrzeze;
      } else {
        // Teren lądowy — dalej dzielimy na podstawie szumu gór i elevation
        const isHighlands = mtnNoise > 0.60 && landMask > 0.25;
        const isMountain  = mtnNoise > 0.75 && landMask > 0.30;

        if (isMountain && elevContinental > 0.20) {
          terenBazowy = TerenBazowy.Gory;
        } else if (isHighlands && elevContinental > 0.16) {
          terenBazowy = TerenBazowy.Wzgorza;
        } else if (desNoise > 0.63 && elevContinental > 0.18 && elevContinental < 0.45) {
          // Pustynia — ciepłe, płaskie rejony wnętrza kontynentu
          terenBazowy = TerenBazowy.Pustynia;
        } else if (elevContinental > 0.35) {
          terenBazowy = TerenBazowy.Rownina;
        } else {
          terenBazowy = TerenBazowy.Laka;
        }

        // Nakładka — las (nie na pustyni, nie na górach)
        if (
          terenBazowy !== TerenBazowy.Gory &&
          terenBazowy !== TerenBazowy.Pustynia &&
          forNoise > 0.58 &&
          elevContinental > 0.20
        ) {
          nakladka = Nakladka.Las;
        }
      }

      hexes[key] = {
        coords,
        terenBazowy,
        nakladka,
        ulepszenie:  Ulepszenie.Brak,
        wlasciciel:  null,
        wioska:      { istnieje: false, ludnosc: 0 },
        widocznosc:  {} as Record<string, Widocznosc>,
        rzeka:       { obecna: false, krawedzie: [] },
      };
    }
  }

  return { szerokoscQ: width, wysokoscR: height, hexes, seed };
}
