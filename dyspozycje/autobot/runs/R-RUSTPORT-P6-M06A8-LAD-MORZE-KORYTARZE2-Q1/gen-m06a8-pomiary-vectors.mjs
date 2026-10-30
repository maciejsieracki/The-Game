// Generator wektorow uzupelniajacych (Operator-pomiary r1, P6.M06A8). Ten sam mechanizm co
// gen-m06a8-landsea-vectors.mjs: INSTRUMENTOWANA kopia gen-helpers.ts (export groupDryLandMassKeys;
// wywolanie fillPangeaAnnularSeaCorridors na koncu ensurePangeaSingleContinent -> 0).
// Rodziny (prefiksy nazw przypadkow sa osobne, nie zmieniaja wektorow bazowych):
//   skala-N     - mapy o N > 18 (N = clamp(round(16 + 6*sqrt(w*h/20160)), 18, 48)); G = N-1/N/N+1;
//                 w tym N = 48 (clamp gorny). Hexy tylko w 3 wierszach (reszta mapy pusta).
//   niekanon    - klucz "x,0" obok kanonicznego heksa (ZALOZENIE Z2 w praktyce): 6 kierunkow.
//   iter-cap    - lancuch 14 wysp (1 heks kazda) -> kazda iteracja scala jedna wyspe; cap 12 wiazacy.
//
// Uzycie (z katalogu tego pliku):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a8-pomiary-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-m06a8-pomiary-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>');
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
  if (instrSrc === before) throw new Error('instrumentacja fill nie zadzialala');
}
const instrPath = `${mapDir}/gen-helpers.m06a8-pomiary-instr.ts`;
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

const scaleN = (w, h) => {
  const mapScale = Math.sqrt((w * h) / 20160);
  return Math.max(18, Math.min(48, Math.round(16 + mapScale * 6)));
};

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

// --- skala-N: N > 18 (w 3 wierszach hexow; mapa w,h podana tylko parametrami) ---
for (const h of [300, 1000, 10000, 20000]) {
  for (const a of [2, 3]) {
    for (let G = 1; G <= 80; G++) {
      const w = a + G + 1;
      const N = scaleN(w, h);
      if (G < N - 1 || G > N + 1) continue;
      const entries = [];
      for (let r = 0; r < 3; r++) for (let q = 0; q < w; q++) {
        const tb = q < a ? TerenBazowy.Laka : (q < a + G ? TerenBazowy.PlytkieMorze : TerenBazowy.Laka);
        entries.push([`${q},${r}`, TB_TO_RUST[tb]]);
      }
      cases.push(runCase(idOf('skala-N'), 'skala-N', w, h, entries));
    }
  }
}

// --- niekanon: "x,0" obok kanonicznego heksa w 6 kierunkach (Z2: klucz nie rozwija sasiedztwa) ---
const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
for (const [dq, dr] of dirs) {
  cases.push(runCase(idOf('niekanon'), 'niekanon', 4, 4, [
    ['x,0', 'Gory'],
    [`${dq},${dr}`, 'Gory'],
    ['2,2', 'Morze'],
  ]));
}
cases.push(runCase(idOf('niekanon'), 'niekanon', 4, 4, [
  ['0,0', 'Laka'], ['x,0', 'Gory'], ['1,0', 'Gory'], ['2,0', 'Morze'], ['3,0', 'Gory'],
]));
cases.push(runCase(idOf('niekanon'), 'niekanon', 4, 4, [
  ['x,0', 'Gory'], ['1,0', 'Gory'], ['2,0', 'Morze'], ['3,0', 'Gory'],
]));

// --- iter-cap: 14 wysp (1 heks) w jednym wierszu za pasem 1 wody; kazda iteracja scala jedna ---
{
  const mainW = 5;
  const islands = 14;
  const w = mainW + 2 * islands + 1;
  const h = 3;
  const entries = [];
  for (let r = 0; r < h; r++) for (let q = 0; q < mainW; q++) entries.push([`${q},${r}`, 'Laka']);
  for (let i = 0; i < islands; i++) {
    const q = mainW + 2 * i;
    entries.push([`${q},0`, 'Gory']);
    if (i < islands - 1) entries.push([`${q + 1},0`, 'Morze']);
  }
  cases.push(runCase(idOf('iter-cap'), 'iter-cap', w, h, entries));
}

// --- iter-gap: wyspy 1-heksowe za pasem G = N = 18 wody (sciezka ma N krokow; cap N-2 musi byc widoczny) ---
for (const islands of [3, 14]) {
  const mainW = 5;
  const gap = 18;
  const w = mainW + islands * (gap + 1);
  const h = 3;
  if (scaleN(w, h) !== gap) throw new Error(`iter-gap: N=${scaleN(w, h)} != ${gap}`);
  const entries = [];
  for (let r = 0; r < h; r++) for (let q = 0; q < mainW; q++) entries.push([`${q},${r}`, 'Laka']);
  for (let i = 0; i < islands; i++) {
    const base = mainW + i * (gap + 1);
    for (let j = 0; j < gap; j++) entries.push([`${base + j},0`, 'PlytkieMorze']);
    entries.push([`${base + gap},0`, 'Gory']);
  }
  cases.push(runCase(idOf('iter-gap'), 'iter-gap', w, h, entries));
}

const out = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06A8-LAD-MORZE-KORYTARZE2-Q1 (Operator-pomiary r1)',
    zrodlo: 'gra/src/map/gen-helpers.ts groupDryLandMassKeys :4338 / ensurePangeaSingleContinent :4375 (instr. copy; fill :4595 = 0)',
    zrodlo_sha256: sha(originalSrc),
    liczba_przypadkow: cases.length,
    rodziny: ['skala-N', 'niekanon', 'iter-cap', 'iter-gap'],
    uwaga: 'Ta sama semantyka pól co ensure-vectors.json: order, group, converted, after (Object.keys).',
  },
  cases,
};
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/pomiary-r1-vectors.json`, JSON.stringify(out));
console.log(`przypadkow: ${cases.length}`);
const byN = {};
for (const c of cases) byN[c.n_most] = (byN[c.n_most] || 0) + 1;
console.log(`rozklad N: ${JSON.stringify(byN)}`);
