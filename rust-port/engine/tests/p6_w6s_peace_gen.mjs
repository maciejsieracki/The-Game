// R-RUSTPORT-P6-W6S-CITY-PEACE-Q1: generator wektorów z URUCHOMIONEGO weba (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75).
//
// Uzycie (katalogi robocze POZA repo; Node 22):
//   WEB_ROOT=<katalog z gra/src i gra/data, np. wynik `git archive <pin> gra/src gra/data`> \
//   ESBUILD=<sciezka do binarki esbuild 0.24.x> BUILD_DIR=<pusty katalog roboczy poza repo> \
//   node rust-port/engine/tests/p6_w6s_peace_gen.mjs > rust-port/engine/tests/p6_w6s_peace_vectors/vectors.json
//
// Skrypt sam buduje bundle web (esbuild, format cjs) w BUILD_DIR, ładuje go i generuje wektory.
// Biblioteka `three` (tylko renderowanie, nie blok AI) jest zastąpiona stubem; nazwy eksportów
// stubu są wyciągane z użyć `THREE.<Nazwa>` w WEB_ROOT/gra/src.

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const WEB_ROOT = process.env.WEB_ROOT;
const ESBUILD = process.env.ESBUILD;
const BUILD_DIR = process.env.BUILD_DIR;
if (!WEB_ROOT || !ESBUILD || !BUILD_DIR) {
  process.stderr.write('ustaw WEB_ROOT, ESBUILD i BUILD_DIR (patrz nagłówek skryptu)\n');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// 1. Bundle weba (esbuild) poza repo.
// ---------------------------------------------------------------------------
function listTs(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listTs(p, acc);
    else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const threeNames = new Set();
for (const f of listTs(path.join(WEB_ROOT, 'gra', 'src'))) {
  const txt = fs.readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/THREE\.([A-Za-z_][A-Za-z0-9_]*)/g)) threeNames.add(m[1]);
}
const threeDir = path.join(BUILD_DIR, 'node_modules', 'three');
fs.mkdirSync(threeDir, { recursive: true });
fs.writeFileSync(
  path.join(threeDir, 'index.js'),
  `const names = ${JSON.stringify([...threeNames].sort())};
const mk = () => {
  const s = new Proxy(function () {}, {
    get: (_t, k) => (k === '__esModule' || typeof k === 'symbol' ? undefined : s),
    set: () => true,
    apply: () => s,
    construct: () => s,
  });
  return s;
};
const exp = {};
for (const n of names) exp[n] = mk();
exp.__esModule = true;
module.exports = exp;
`,
);
fs.writeFileSync(
  path.join(BUILD_DIR, 'tsconfig.json'),
  JSON.stringify({ compilerOptions: { paths: { '@web/*': [path.join(WEB_ROOT, 'gra', 'src', '*')] } } }),
);
const entry = path.join(BUILD_DIR, 'entry.ts');
fs.writeFileSync(
  entry,
  "import * as AI from '@web/game/ai';\nimport * as PROF from '@web/game/diplomacy-war-peace-profile';\nexport { AI, PROF };\n",
);
const bundle = path.join(BUILD_DIR, 'web.cjs');
execFileSync(
  ESBUILD,
  [
    entry,
    '--bundle',
    '--platform=node',
    '--format=cjs',
    '--target=node22',
    `--tsconfig=${path.join(BUILD_DIR, 'tsconfig.json')}`,
    `--outfile=${bundle}`,
    '--log-level=warning',
  ],
  { env: { ...process.env, NODE_PATH: path.join(BUILD_DIR, 'node_modules') }, stdio: ['ignore', 'inherit', 'inherit'] },
);
const { AI, PROF } = createRequire(import.meta.url)(bundle);

// ---------------------------------------------------------------------------
// 2. Wektory.
// ---------------------------------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261108);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const out = {
  pure: { rwProg: [], waga: [], pickOddania: [], pickZadania: [], profil: [] },
  decide: [],
};

// 0. resolveWarPeaceProfile per cywilizacja.
const civKeys = [
  null, 'gracz-nieznany', 'grecy', 'rzymianie', 'chinczycy', 'inkowie', 'zulusi', 'egipt', 'sumer',
  'celtowie', 'germanie', 'harappa', 'hetyci', 'slowianie', 'babilonia', 'asyria', 'fenicjanie',
];
// Liczby jako napisy (String(x)): str::parse::<f64>() w tescie daje dokładnie tę samą wartość.
const asStr = (p) => {
  const o = {};
  for (const k of Object.keys(p)) o[k] = typeof p[k] === 'number' ? String(p[k]) : p[k];
  return o;
};
for (const k of civKeys) {
  out.pure.profil.push({ civ: k, profile: asStr(PROF.resolveWarPeaceProfile(k)) });
}

// 1. aiMiastoPrzekazRwProg
for (const agr of [undefined, 0, 1, 3, 4, 5, 6, 7, 9, 10, 2.5]) {
  out.pure.rwProg.push({ agr: agr ?? null, v: AI.aiMiastoPrzekazRwProg(agr) });
}
// 2. aiMiastoWagaOddawanego
for (const eks of [undefined, 0, 1, 2, 3, 4, 5, 6, 8, 10, 2.5]) {
  out.pure.waga.push({ eks: eks ?? null, v: AI.aiMiastoWagaOddawanego(eks) });
}
// 3. aiPickMiastoDoOddania: granice cena/waga
const mkCity = (id, pn, zak = false) => ({ cityId: id, cityPn: pn, zakazane: zak });
for (const eks of [undefined, 0, 3, 5, 10]) {
  const waga = AI.aiMiastoWagaOddawanego(eks);
  for (const cena of [undefined, 400, 625, 750, 1250]) {
    const cenaEff = cena ?? AI.AI_MIASTO_CENA_POKOJU_PN;
    const t = Math.ceil(cenaEff / waga);
    for (const minMiast of [undefined, 2, 3]) {
      const pns = [t - 2, t - 1, t, t + 1, 1, 900];
      for (const len of [1, 2, 3, 4]) {
        const list = pns.slice(0, len).map((pn, i) => ({ ...mkCity('p' + i, pn, i === 4), zakazane: i === 4 }));
        const opts = {};
        if (minMiast !== undefined) opts.minMiast = minMiast;
        if (cena !== undefined) opts.cenaPn = cena;
        const hasOpts = Object.keys(opts).length > 0;
        const r = AI.aiPickMiastoDoOddania(list, eks, hasOpts ? opts : undefined);
        out.pure.pickOddania.push({
          eks: eks ?? null,
          cena: cena ?? null,
          minMiast: minMiast ?? null,
          miasta: list,
          out: r ? r.cityId : null,
        });
      }
    }
  }
}
// 4. aiPickMiastoDoZadania
for (const pns of [[499, 500, 501], [500], [499], [1200, 500, 700], [500, 500], [499, 900, 510, 200]]) {
  const list = pns.map((pn, i) => mkCity('q' + i, pn, i === 2));
  const r = AI.aiPickMiastoDoZadania(list);
  out.pure.pickZadania.push({ miasta: list, out: r ? r.cityId : null });
}

// 5. Blok decideAIDiplomacy (N1a/N1b).
function mkRel(o) {
  return {
    partnerId: o.partnerId,
    respektWzgledny: o.rw,
    stanWojny: o.stanWojny,
    relation: { zaufanie: 0, respekt: 0 },
    turnsAtWar: o.turnsAtWar,
    lostCitiesInWar: o.lost,
    zdobyteMiastaPartnera: o.zdobyte,
    turnsSinceCityChange: o.tsc,
    miastaPartnera: o.miastaPartnera,
    isMinorCivPartner: o.minorPartner,
  };
}
const cityOut = (cmds) => {
  const c = cmds.find((x) => x.type === 'oferuj_miasto_za_pokoj' || x.type === 'zada_miasto_za_pokoj');
  if (!c) return null;
  if (c.type === 'oferuj_miasto_za_pokoj') {
    return { kind: 'oferuj', cityId: c.cityId, cityPn: c.cityPn, cityWeight: c.cityWeight, powod: c.powod };
  }
  return { kind: 'zada', cityId: c.cityId, cityPn: c.cityPn, cityWeight: null, powod: c.powod };
};
const rwGrid = [0.0, 0.05, 0.1, 0.15, 0.16, 0.2, 0.25, 0.3, 0.4, 0.45, 0.5, 0.6, 0.65, 0.69, 0.7, 0.71, 0.8, 0.95, 1.0];
const turnsGrid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 19, 20, 21, 40, 100, 199, 200, 201];
const lostGrid = [0, 1, 2, 3, 4];
const zdobyteGrid = [0, 1, 2];
const tscGrid = [undefined, 0, 10, 29, 30, 60, 130];
const agrGrid = [undefined, 0, 4, 5, 6, 9, 10];
const ekspGrid = [undefined, 1, 3, 5, 9];
const cityPnGrid = [100, 300, 400, 480, 499, 500, 501, 520, 800, 1500];
const civGrid = [
  undefined, 'zulusi', 'chinczycy', 'grecy', 'egipt', 'rzymianie', 'inkowie', 'fenicjanie', 'harappa', 'nieznana-cywilizacja',
];
const partnerGrid = ['0', '0', '0', '0', '0', '0', '0', '0', '1', 'ai2'];
function randCities(n, prefix) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push({ cityId: prefix + i, cityPn: pick(cityPnGrid), zakazane: rnd() < 0.15 });
  return arr;
}
const rwExtra = [0.1499, 0.1501, 0.2, 0.32, 0.37, 0.5, 0.55, 0.62, 0.74, 0.9];
for (let k = 0; k < 2600; k++) {
  const rw = k < rwGrid.length * 3 ? rwGrid[k % rwGrid.length] : pick(rwGrid.concat(rwExtra)) + (rnd() < 0.3 ? 0.01 : 0);
  const o = {
    rw,
    civ: pick(civGrid) ?? null,
    stanWojny: rnd() < 0.85,
    partnerId: pick(partnerGrid),
    turnsAtWar: pick(turnsGrid),
    lost: pick(lostGrid),
    zdobyte: pick(zdobyteGrid),
    tsc: pick(tscGrid),
    agr: pick(agrGrid),
    eks: pick(ekspGrid),
    minorSelf: rnd() < 0.08,
    minorPartner: rnd() < 0.08,
    miastaAI: randCities(Math.floor(rnd() * 5), 'a'),
    miastaPartnera: randCities(Math.floor(rnd() * 5), 'g'),
  };
  const inp = {
    relacje: [mkRel(o)],
    agresja: 0.5,
    agresywnoscRaw: o.agr,
    ekspansywnosc: o.eks,
    isMinorCivSelf: o.minorSelf,
    myTypCywilizacji: o.civ ?? undefined,
    miastaAI: o.miastaAI,
    currentTurn: 50,
    sklonnoscDoPodboju: 2,
    skarbiecGold: 0,
  };
  let cmds = [];
  try {
    cmds = AI.decideAIDiplomacy(inp);
  } catch (e) {
    cmds = [{ type: 'ERROR', powod: String(e && e.message) }];
  }
  out.decide.push({ in: o, out: cityOut(cmds), first: cmds.length ? cmds[0].type : null });
}

process.stdout.write(JSON.stringify(out));
