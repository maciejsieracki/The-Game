'use strict';

/**
 * R-WEB-AUTOCLEAR-PRIORITY-LIVE-Q1 (zgloszenie wlasciciela 2026-11-01, Rodos: „system mogl budowac farme, a robi trzode”).
 * Rejestr decyzji #1: (E1) farma na heksie BEZ lasu przy rzece -> (E2) wycinka + farma -> (E3) trzoda -> (E4) irygacja.
 *
 * PRZYCZYNA (zmierzona na realnej mapie z nowej gry, ziarno 778899: 1961 heksow `rzeka.obecna`, tylko 1173 w `riverPaths`):
 * picker definiowal „heks z rzeka” (E1/E2/E3) WYLACZNIE przez `map.riverPaths`; centrum miasta / pole obywatela z
 * `rzeka.obecna` poza `riverPaths` nie bylo kandydatem E1, a trzoda stawala wczesniej na innym heksie sciezki rzeki.
 * Farma na tamtym heksie czekala do E5 — za trzoda i irygacja (irygacja ponad % budzetu wstrzymuje E5).
 *
 * KONTRAKT (ten plik):
 *   (a) centrum na rzece z `rzeka.obecna` BEZ wpisu w `riverPaths`: pierwsza budowa = farma NA CENTRUM, zanim padnie jakakolwiek trzoda;
 *   (b) pole obywatela na rzece z `rzeka.obecna` poza `riverPaths`: farma przed jakakolwiek trzoda;
 *   (c) trzoda dopiero PO farmie na tym samym heksie, irygacja po trzodzie (kolejnosc E1 < E3 < E4 zachowana);
 *   (d) heks TYLKO sasiadujacy z rzeka (bez wlasnej rzeki) NIE jest E1 — farma dopiero po E3/E4 (E5), bez zmiany;
 *   (e) tylko „Oswojenie zwierzat” (bez Rolnictwa): trzoda moze byc pierwsza (ABC-5=A, technologia nie blokuje nizszych etapow);
 *   (f) K1 „Zywnosc” i K2 „Zrownowazone” — ta sama kolejnosc.
 *
 * Run z gra/:  node tools/autoclear-priority-q1-test.cjs
 * Mutacja:     AUTOCLEAR_SRC_DIR=<kopia gra/src z mutacja> node tools/autoclear-priority-q1-test.cjs   (test MUSI byc czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AUTOCLEAR_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'autoclear-q1-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

const FULL = ['Rolnictwo', 'Oswojenie zwierząt', 'Gospodarka wodna', 'Irygacja', 'Łowiectwo', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo'];
const W = 24, H = 24, CQ = 12, CR = 12;
const K = (q, r) => `${q},${r}`;
/** `pathRiver` = heksy w `riverPaths`; `flagRiver` = heksy z `rzeka.obecna` BEZ wpisu w `riverPaths` (rzeka widoczna na mapie). */
function makeMap({ pathRiver = [], flagRiver = [], forest = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const [q, r] of pathRiver) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of flagRiver) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of forest) hexes[K(q, r)].nakladka = 'las';
  return {
    szerokoscQ: W, wysokoscR: H, hexes, seed: 7,
    riverPaths: pathRiver.length ? [pathRiver.map(([q, r]) => ({ q, r }))] : [],
  };
}
const CITY = { id: 'c0', ownerId: 0, q: CQ, r: CR, name: 'Rodos', population: 1 };
const TN = [{ q: CQ, r: CR, ownerId: 0, cityId: 'c0', pop: 1, level: 1 }];
const FOCUS_OF = { K1: 'zywnosc', K2: 'zrownowazone' };

/** Symulacja tura po turze (jak gracz: picker per tura, wynik wchodzi do `placed`). */
function sim({ map, worked, profil, techs = FULL, turns = 20, pool0 = 300, income = 25, pct = 33 }) {
  const placed = new Map();
  const workedSet = new Set(worked.map(([q, r]) => K(q, r)));
  let pool = pool0;
  const log = [];
  for (let t = 0; t < turns; t++) {
    const picks = pickAutoImprovements({
      cities: [{ ...CITY, ulepszeniaFocus: FOCUS_OF[profil] }], ownerId: 0, map, territoryNodes: TN,
      placedImprovements: placed, pracaAvailable: pool, unlockedTechs: new Set(techs),
      pracaSurplusThreshold: 30, skipWyrab: true, demandDriven: true, resourceDeficitKeys: [],
      getFocus: () => FOCUS_OF[profil], getOnlyWorked: () => true, getWorkedHexKeys: () => workedSet,
      pracaBudgetPercent: pct, getPracaBudgetPercent: () => pct, civArchetype: 'rzymianie', playerEra: 1,
      foodImprovementStages: () => true, clearingHexKeys: new Set(),
    });
    for (const p of picks) {
      const hk = K(p.q, p.r);
      log.push({ t, key: p.key, hk });
      pool -= p.kosztPraca;
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
    pool += income;
  }
  return { log, placed };
}
const idx = (log, key, hk) => log.findIndex(e => e.key === key && e.hk === hk);
const firstIdx = (log, key) => log.findIndex(e => e.key === key);

// Rzeka NA heksach (12,9),(12,10),(13,10) w `riverPaths`; centrum (12,12) i pole obywatela (11,12) maja WLASNA rzeke bez wpisu w `riverPaths`.
const PATH = [[12, 9], [12, 10], [13, 10]];
const FLAG = [[12, 12], [11, 12]];

for (const profil of ['K1', 'K2']) {
  console.log(`(a,b,c) [${profil}] centrum i pole obywatela na rzece poza riverPaths: farma przed jakakolwiek trzoda`);
  const map = makeMap({ pathRiver: PATH, flagRiver: FLAG });
  const { log } = sim({ map, worked: [...PATH, [11, 12]], profil });
  const firstBydlo = firstIdx(log, 'bydlo');
  const fCenter = idx(log, 'farma', K(12, 12)), fCitizen = idx(log, 'farma', K(11, 12));
  ok(fCenter >= 0 && fCitizen >= 0, `[${profil}] farma stoi na centrum (${fCenter}) i na polu obywatela (${fCitizen}) przy rzece poza riverPaths`);
  ok(firstBydlo < 0 || (fCenter < firstBydlo && fCitizen < firstBydlo),
    `[${profil}] obie farmy (${fCenter}, ${fCitizen}) PRZED pierwsza trzoda (${firstBydlo}) — rejestr #1: E1 < E3`);
  ok(log[0] && log[0].key === 'farma', `[${profil}] pierwsza budowa to farma (jest: ${log[0] && log[0].key}@${log[0] && log[0].hk})`);
  for (const hk of [K(12, 12), K(11, 12)]) {
    const f = idx(log, 'farma', hk), b = idx(log, 'bydlo', hk), c = idx(log, 'irygacja', hk);
    ok(f >= 0 && (b < 0 || b > f) && (c < 0 || c > f), `[${profil}] ${hk}: farma(${f}) przed trzoda(${b}) i irygacja(${c})`);
  }
}

for (const profil of ['K1', 'K2']) {
  console.log(`(c) [${profil}] heks rzeki w riverPaths: farma < trzoda < irygacja (bez zmian)`);
  const map = makeMap({ pathRiver: PATH });
  const { log } = sim({ map, worked: PATH, profil });
  for (const [q, r] of PATH) {
    const hk = K(q, r);
    const a = idx(log, 'farma', hk), b = idx(log, 'bydlo', hk), c = idx(log, 'irygacja', hk);
    ok(a >= 0 && b > a && c > b, `[${profil}] ${hk}: farma(${a}) < bydlo(${b}) < irygacja(${c})`);
  }
}

console.log('(d) heks TYLKO sasiadujacy z rzeka (bez wlasnej rzeki) nie jest E1 — farma po E3/E4 (E5), bez zmiany');
{
  const map = makeMap({ pathRiver: PATH });
  // (11,11) i (13,11) sasiaduja z (12,10)? (12,10)->(11,11),(12,11),(13,10),(11,10),(13,9),(12,9): (11,11) i (12,11) sasiaduja z rzeka.
  const NEAR = [[12, 11]];
  const { log } = sim({ map, worked: [...PATH, ...NEAR], profil: 'K2', turns: 40, pool0: 600 });
  const fRiver = idx(log, 'farma', K(12, 10));
  const fNear = idx(log, 'farma', K(12, 11));
  const iRiver = idx(log, 'irygacja', K(12, 10));
  ok(fRiver >= 0 && fNear > fRiver, `heks przy rzece (12,11): farma(${fNear}) po farmie na rzece (${fRiver})`);
  ok(iRiver >= 0 && fNear > iRiver, `heks przy rzece (12,11): farma(${fNear}) dopiero po irygacji na rzece (${iRiver}) — E5 po E1-E4`);
}

console.log('(e) tylko „Oswojenie zwierzat” (brak Rolnictwa): trzoda moze byc pierwsza (ABC-5=A — technologia nie blokuje nizszych etapow)');
{
  const map = makeMap({ pathRiver: PATH, flagRiver: FLAG });
  const { log } = sim({ map, worked: [...PATH, [11, 12]], profil: 'K2', techs: ['Oswojenie zwierząt'] });
  ok(log.length > 0 && log[0].key === 'bydlo' && firstIdx(log, 'farma') < 0, `bez Rolnictwa: pierwsza budowa to trzoda, zero farm (${log.map(e => e.key).slice(0, 4).join(',')})`);
}

console.log(`\nautoclear-priority-q1-test: ${passed} passed, ${failed} failed`);
fs.rmSync(temp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
