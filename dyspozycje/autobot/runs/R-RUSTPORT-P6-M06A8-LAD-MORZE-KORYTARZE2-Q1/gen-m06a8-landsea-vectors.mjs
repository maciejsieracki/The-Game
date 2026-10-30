// Generator wektorow P6.M06A8 (partia 1): groupDryLandMassKeys (gen-helpers.ts :4338, prywatna)
// i ensurePangeaSingleContinent (:4375, export). Obie uruchamiane z INSTRUMENTOWANEJ KOPII
// gen-helpers.ts. Jedyne zmiany instrumentacji:
//   (a) `export` przed `function groupDryLandMassKeys(`;
//   (b) wywolanie fillPangeaAnnularSeaCorridors na koncu ensurePangeaSingleContinent
//       zastapione `0` (RUNDA-2: fill :4595 nie jest jeszcze portowany; w Rust przekazywany jako hook).
// Reszta kodu weba (BFS, mosty, sciezka wody) jest uruchamiana bez zmian.
//
// Uzycie (z katalogu tego pliku):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a8-landsea-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>
// WEB_ROOT = wyeksportowany pin edb8fb56 (gra/src, gra/data) rozpakowany POZA repo.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-m06a8-landsea-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const originalSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');

let instrSrc = originalSrc;
{
  const before = instrSrc;
  instrSrc = instrSrc.replace('\nfunction groupDryLandMassKeys(', '\nexport function groupDryLandMassKeys(');
  if (instrSrc === before) throw new Error('instrumentacja groupDryLandMassKeys nie zadzialala');
}
{
  const before = instrSrc;
  instrSrc = instrSrc.replace(
    '  converted += fillPangeaAnnularSeaCorridors(hexes, width, height);\n  return converted;\n}\n\nfunction pangeaLandCentroid',
    '  converted += 0;\n  return converted;\n}\n\nfunction pangeaLandCentroid',
  );
  if (instrSrc === before) throw new Error('instrumentacja fill (koniec ensurePangeaSingleContinent) nie zadzialala');
}
const instrPath = `${mapDir}/gen-helpers.m06a8-instr.ts`;
writeFileSync(instrPath, instrSrc);

const GI = await import(pathToFileURL(instrPath).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy, Nakladka } = H;

const TB_TO_RUST = {
  [TerenBazowy.Laka]: 'Laka',
  [TerenBazowy.Rownina]: 'Rownina',
  [TerenBazowy.Wzgorza]: 'Wzgorza',
  [TerenBazowy.Gory]: 'Gory',
  [TerenBazowy.PlytkieMorze]: 'PlytkieMorze',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Polarny]: 'Polarny',
};
const RUST_TO_TB = Object.fromEntries(Object.entries(TB_TO_RUST).map(([tb, n]) => [n, tb]));
const LAND_TBS = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory, TerenBazowy.Pustynia];

// Deterministyczny PRNG (mulberry32) - wejscia wektorow sa powtarzalne.
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Buduje obiekt hexes w podanej kolejnosci wstawiania (Object.keys = kolejnosc wstawiania).
const buildHexes = (order) => {
  const hexes = {};
  for (const [key, tbName] of order) {
    const [q, r] = key.split(',').map(Number);
    hexes[key] = {
      coords: { q, r },
      terenBazowy: RUST_TO_TB[tbName],
      nakladka: Nakladka.Brak,
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return hexes;
};

const hexKeyOf = (q, r) => `${q},${r}`;
const scaleN = (w, h) => {
  const mapScale = Math.sqrt((w * h) / 20160);
  return Math.max(18, Math.min(48, Math.round(16 + mapScale * 6)));
};

// Uruchamia oba symbole na jednym wejsciu; zwraca wynik do zapisu.
const runCase = (id, family, w, h, order) => {
  const groups = GI.groupDryLandMassKeys(buildHexes(order)).map((g) => g.slice());
  const hexesE = buildHexes(order);
  const converted = GI.ensurePangeaSingleContinent(hexesE, w, h);
  const after = Object.keys(hexesE).map((k) => [k, TB_TO_RUST[hexesE[k].terenBazowy]]);
  return { id, family, w, h, n_most: scaleN(w, h), order, group: groups, converted, after };
};

const cases = [];
let nextId = 0;
const idOf = (fam) => `${fam}-${String(nextId++).padStart(5, '0')}`;

// --- Rodzina A: losowe mapy 3..20 x 3..20, rozne progi ladu, kolejnosc wstawiania tasowana ---
{
  const rnd = mulberry32(0x6a08);
  for (let i = 0; i < 160; i++) {
    const w = 3 + Math.floor(rnd() * 18);
    const h = 3 + Math.floor(rnd() * 18);
    const pLand = 0.2 + rnd() * 0.6;
    const pShallow = rnd();
    const entries = [];
    for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
      const land = rnd() < pLand;
      const tb = land
        ? LAND_TBS[Math.floor(rnd() * LAND_TBS.length)]
        : (rnd() < pShallow ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze);
      entries.push([hexKeyOf(q, r), TB_TO_RUST[tb]]);
    }
    if (i % 3 === 0) {
      for (let j = entries.length - 1; j > 0; j--) {
        const k = Math.floor(rnd() * (j + 1));
        [entries[j], entries[k]] = [entries[k], entries[j]];
      }
    }
    cases.push(runCase(idOf('losowe'), 'losowe', w, h, entries));
  }
}

// --- Rodzina B: granica mostu N-1 / N / N+1 (w = h = s), obca masa po drugiej stronie pasa wody ---
// Lad glowny = kolumny 0..a-1 (pelna wysokosc), pas wody G kolumn, obca kolumna pelnej wysokosci.
// G = N: obca masa dosiegalna (dist = N, BFS rozwija dist <= N); G = N+1: dist = N+1 > N, nie.
{
  for (let s = 6; s <= 40; s++) {
    const N = scaleN(s, s);
    for (const G of [N - 1, N, N + 1]) {
      for (const a of [2, 3]) {
        const w = a + G + 1;
        const h = s;
        const entries = [];
        for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
          const tb = q < a ? TerenBazowy.Laka : (q < a + G ? TerenBazowy.PlytkieMorze : TerenBazowy.Laka);
          entries.push([hexKeyOf(q, r), TB_TO_RUST[tb]]);
        }
        cases.push(runCase(idOf('granica-mostu'), 'granica-mostu', w, h, entries));
      }
    }
  }
}

// --- Rodzina C: prog rozmiaru obcej masy T = max(60, floor(main*0.25)) -> rozmiary T-1 / T / T+1 ---
// Lad glowny: a kolumn x 3 wiersze (main = 3a). Pas wody 20 kolumn (poza zasiegiem mostu).
// Obca masa: pozioma linia w wierszu 0 o dlugosci F.
{
  for (const a of [10, 40, 100, 110]) {
    const main = a * 3;
    const T = Math.max(60, Math.floor(main * 0.25));
    for (const F of [T - 1, T, T + 1]) {
      const h = 3;
      const gap = 20;
      const w = a + gap + F + 1;
      const entries = [];
      for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
        let tb;
        if (q < a) tb = TerenBazowy.Laka;
        else if (q < a + gap) tb = TerenBazowy.Morze;
        else if (r === 0 && q < a + gap + F) tb = TerenBazowy.Gory;
        else tb = TerenBazowy.Morze;
        entries.push([hexKeyOf(q, r), TB_TO_RUST[tb]]);
      }
      cases.push(runCase(idOf('prog-masy'), 'prog-masy', w, h, entries));
    }
  }
}

// --- Rodzina D: wiele wysp (petla iteracji, sortowanie po dlugosci) ---
{
  const rnd = mulberry32(0x51ab);
  for (let i = 0; i < 30; i++) {
    const w = 14 + Math.floor(rnd() * 10);
    const h = 14 + Math.floor(rnd() * 10);
    const entries = [];
    for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
      const isl = ((q >> 2) + (r >> 2)) % 3 === 0 && rnd() < 0.85;
      entries.push([hexKeyOf(q, r), TB_TO_RUST[isl ? TerenBazowy.Laka : TerenBazowy.Morze]]);
    }
    cases.push(runCase(idOf('wyspy'), 'wyspy', w, h, entries));
  }
}

// --- Przypadki brzegowe: puste, jeden heks, same wody, niekanoniczny klucz, zerowy rozmiar ---
cases.push(runCase(idOf('brzeg'), 'brzeg', 1, 1, []));
cases.push(runCase(idOf('brzeg'), 'brzeg', 1, 1, [['0,0', 'Laka']]));
cases.push(runCase(idOf('brzeg'), 'brzeg', 2, 2, [['0,0', 'Morze'], ['1,0', 'Morze']]));
cases.push(runCase(idOf('brzeg'), 'brzeg', 3, 1, [['0,0', 'Laka'], ['1,0', 'Laka'], ['2,0', 'Laka']]));
cases.push(runCase(idOf('brzeg'), 'brzeg', 4, 1, [['0,0', 'Laka'], ['x,0', 'Gory'], ['3,0', 'Gory']]));
cases.push(runCase(idOf('brzeg'), 'brzeg', 0, 0, [['0,0', 'Laka'], ['5,5', 'Gory']]));

const out = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1',
    zrodlo: 'gra/src/map/gen-helpers.ts groupDryLandMassKeys :4338 / ensurePangeaSingleContinent :4375 (instr. copy; fill :4595 zastapiony 0)',
    zrodlo_sha256: sha(originalSrc),
    liczba_przypadkow: cases.length,
    rodziny: ['losowe', 'granica-mostu', 'prog-masy', 'wyspy', 'brzeg'],
    uwaga: 'after[] = terenBazowy po ensurePangeaSingleContinent w kolejnosci Object.keys; converted = zwrot web; group = wynik groupDryLandMassKeys.',
  },
  cases,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/ensure-vectors.json`, JSON.stringify(out));
console.log(`przypadkow: ${cases.length}`);
