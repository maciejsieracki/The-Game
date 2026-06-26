/**
 * generator.ts
 * Deterministyczny generator mapy hex dla The Game.
 *
 * Konwencja heksów: POINTY-TOP aksjalne (q, r).
 * Algorytm: mulberry32 PRNG + 2D value-noise (fBm) → kształt zależny od
 *   TypSwiata (kontynenty/pangea/wyspy), pasma wzgórz/gór, lasy jako nakładka,
 *   trochę pustyni. Następnie: rzeki, złoża mineralne, pozycje startowe.
 *
 * Logika szumu/terenu/rzek/złóż/startów żyje w ./gen-helpers (testowalne,
 * nazwane helpery). Ten plik tylko je składa w jeden przebieg generacji.
 */

import type { GameMap } from '../types/map';
import type { Hex, HexCoords } from '../types/hex';
import { Ulepszenie, Widocznosc, TerenBazowy } from '../types/hex';
import {
  mulberry32,
  buildPermTable,
  fbm,
  defaultShapeParams,
  landMaskAt,
  landMaskKontynenty,
  landMaskPangea,
  landMaskWyspy,
  buildContinentCenters,
  classifyTerrain,
  generateRivers,
  placeDeposits,
  computeStartPositions,
  type StartPosition,
  type TypSwiata,
} from './gen-helpers';

// ---------------------------------------------------------------------------
// Rozmiar mapy + typ wyniku
// ---------------------------------------------------------------------------

/** Mały roboczy rozmiar mapy: ~36×28 heksów (pasuje pod ~6 rywali). */
export const DEFAULT_WIDTH  = 36;
export const DEFAULT_HEIGHT = 28;

/**
 * GameMap rozszerzona o opcjonalne pozycje startowe.
 * Dodatek wstecznie zgodny — przypisywalny do GameMap, wiec main.ts i pozostali
 * konsumenci dzialaja bez zmian; pole `startPositions` jest opcjonalne.
 */
export type GameMapWithStarts = GameMap & {
  /** Deterministyczne pozycje startowe (>=5, parami oddalone >=5) na ladzie. */
  startPositions?: StartPosition[];
};

/**
 * Generuje GameMap deterministycznie ze złożoności ziarna `seed`.
 *
 * @param width   Szerokość mapy w heksach (domyślnie 36)
 * @param height  Wysokość mapy w heksach (domyślnie 28)
 * @param seed    Ziarno PRNG (domyślnie 42); 0 → zostanie użyte 42
 * @param typ     Typ świata: 'kontynenty' (domyślnie) | 'pangea' | 'wyspy'
 */
export function generateMap(
  width  = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  seed   = 42,
  typ: TypSwiata = 'kontynenty',
): GameMapWithStarts {
  // Jeśli seed=0 lub undefined, użyj domyślnego 42
  const effectiveSeed = seed || 42;

  const rand = mulberry32(effectiveSeed);
  const perm = buildPermTable(rand);

  // Parametry ksztaltowania (offsety pobieraja rand() w ustalonej kolejnosci).
  const shape = defaultShapeParams(rand);

  // Centra kontynentów (pobierane z rand() ZAWSZE — zachowuje deterministyczność
  // sekwencji rand, niezależnie od tego czy typ='kontynenty').
  // Liczba centrów: 2-4 w zależności od rozmiaru mapy.
  const nCenters = width * height < 2000 ? 2 : width * height < 6000 ? 3 : 4;
  const continentCenters = buildContinentCenters(rand, nCenters);

  const hexes: Record<string, Hex> = {};

  // ── Przebieg 1: teren bazowy + las (szum → klasyfikacja) ──────────────────
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const coords: HexCoords = { q, r };
      const key = `${q},${r}`;

      // Maska kontynentalna zalezy od TypSwiata.
      let landMask: number;
      if (typ === 'pangea') {
        landMask = landMaskPangea(q, r, width, height, perm, shape.noiseScale);
      } else if (typ === 'wyspy') {
        landMask = landMaskWyspy(q, r, width, height, perm, shape.noiseScale);
      } else {
        // 'kontynenty' — domyslny; kilka oddzielnych mas ladowych
        landMask = landMaskKontynenty(q, r, width, height, continentCenters, perm, shape.noiseScale);
      }

      // Szum bazowy (elevation) + przemnozenie przez maske.
      const elevation = fbm(perm, q * shape.noiseScale, r * shape.noiseScale, 4);
      const elevContinental = elevation * landMask;

      // Szumy pomocnicze (gory/las/pustynia) z offsetami.
      const mtnNoise = fbm(perm, q * shape.mountainScale + shape.offMtnX, r * shape.mountainScale + shape.offMtnY, 3);
      const forNoise = fbm(perm, q * shape.forestScale   + shape.offForX, r * shape.forestScale   + shape.offForY, 3);
      const desNoise = fbm(perm, q * shape.desertScale   + shape.offDesX, r * shape.desertScale   + shape.offDesY, 3);

      const { terenBazowy, nakladka } =
        classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise);

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

  // ── Przebieg 1b: pierscien wybrzeza ─ kazdy lad sasiadujacy z Morzem -> Wybrzeze.
  // Regula: kazdy lad graniczacy z morzem ma >=1 heks wybrzeza (brak ladu wprost przy glebokim morzu).
  {
    const NB: ReadonlyArray<readonly [number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    const toCoast: string[] = [];
    for (const key of Object.keys(hexes)) {
      const h = hexes[key]!;
      if (h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) continue;
      const parts = key.split(','); const q = Number(parts[0]); const r = Number(parts[1]);
      for (const [dq, dr] of NB) {
        const nb = hexes[`${q + dq},${r + dr}`];
        if (nb && nb.terenBazowy === TerenBazowy.Morze) { toCoast.push(key); break; }
      }
    }
    for (const key of toCoast) hexes[key]!.terenBazowy = TerenBazowy.Wybrzeze;
  }

  // ── Przebieg 2: rzeki (deterministyczne sledzenie od Gory/Wzgorza do morza) ─
  const riverPaths = generateRivers(hexes, width, height, rand, {
    maxRivers: 5,
    minLen: 4,
    maxLen: 40,
    margin: 2,
  });

  // ── Przebieg 3: zloza mineralne ─────────────────────────────────────────────
  placeDeposits(hexes, effectiveSeed);

  // ── Przebieg 4: pozycje startowe ────────────────────────────────────────────
  const startPositions = computeStartPositions(hexes, effectiveSeed, {
    minCount: 5,
    minDist: 5,
    absMinDist: 2,
  });

  return { szerokoscQ: width, wysokoscR: height, hexes, seed: effectiveSeed, riverPaths, startPositions };
}

// ---------------------------------------------------------------------------
// API rozmiarowe: generujSwiat(seed, rozmiar, typ)
// ---------------------------------------------------------------------------

/**
 * Rozmiary predefiniowane i ich przybliżone wymiary w heksach.
 * Proporcja width:height ≈ 1.4:1 (ekran poziomy).
 *
 * | Rozmiar    | width × height | Heksów (~) |
 * |------------|----------------|------------|
 * | malenki    |   38 × 26      |   ~988     |
 * | maly       |   54 × 37      |  ~1998     |
 * | standardowy|   84 × 60      |  ~5040     |
 * | duzy       |  120 × 84      |  ~10080    |
 * | ogromny    |  168 × 119     |  ~19992    |
 */
export type RozmiarSwiata = 'malenki' | 'maly' | 'standardowy' | 'duzy' | 'ogromny';

const ROZMIAR_DIMS: Record<RozmiarSwiata, [number, number]> = {
  malenki:     [38,  26],
  maly:        [54,  37],
  standardowy: [84,  60],
  duzy:        [120, 84],
  ogromny:     [168, 119],
};

/**
 * Wygodne API rozmiarowe: generuje GameMapWithStarts na podstawie
 * słownego rozmiaru i typu świata.
 *
 * @param seed    Ziarno PRNG. Jeśli 0 lub undefined, losuje deterministycznie
 *                z Date.now() i zapisuje wylosowany seed w polu map.seed.
 * @param rozmiar Predefiniowany rozmiar: 'malenki'|'maly'|'standardowy'|'duzy'|'ogromny'
 * @param typ     Typ świata: 'kontynenty'|'pangea'|'wyspy' (domyślnie: 'kontynenty')
 * @returns       GameMapWithStarts z wypełnionym polem seed (ważne gdy seed=0)
 */
export function generujSwiat(
  seed: number | undefined,
  rozmiar: RozmiarSwiata,
  typ: TypSwiata = 'kontynenty',
): GameMapWithStarts {
  // Losowy seed gdy 0/undefined
  const effectiveSeed = (seed && seed !== 0) ? seed : ((Date.now() ^ 0xdeadbeef) >>> 0) || 42;
  const [w, h] = ROZMIAR_DIMS[rozmiar];
  return generateMap(w, h, effectiveSeed, typ);
}

// Re-export typów z gen-helpers dla wygody konsumentów
export type { TypSwiata, RozmiarSwiata as RozmiarSwiataType, StartPosition };
export { landMaskAt };
