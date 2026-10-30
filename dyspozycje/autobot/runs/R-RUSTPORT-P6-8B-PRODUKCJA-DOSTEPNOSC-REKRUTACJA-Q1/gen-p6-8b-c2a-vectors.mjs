// P6.8B-P1b-c2a (pin 91dc998a): wektory z URUCHOMIONEGO weba dla symboli:
//   manpowerCostOf (production.ts ~1985), setPaused (production.ts ~1990).
// Funkcje importowane z PRAWDZIWEGO modulu production.ts (graf importow ladowany w calosci
// przez repin-b-loader-hooks.mjs; zadnych stubow).
// Uruchomienie (Node 22, z katalogu tego runu):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8b-c2a-vectors.mjs <WEB_ROOT (katalog z gra/, z git archive 91dc998a gra)> \
//        <KATALOG_WYJSCIA> <KATALOG_ROBOCZY_POZA_REPO>
// Kodowanie: calkowita skonczona = JSON number; niecalkowita = {"$f": String(x)};
// NaN/Infinity/-Infinity/-0 = {"$n": "..."}; undefined = {"absent": true}; null = null.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const scratch = presolve(process.argv[4] ?? '');
if (!process.argv[4]) throw new Error('podaj 3. argument: katalog roboczy poza repo');
mkdirSync(outDir, { recursive: true });
mkdirSync(scratch, { recursive: true });

const W = await import(pathToFileURL(join(webRoot, 'gra/src/game/production.ts')).href);
const M = await import(pathToFileURL(join(webRoot, 'gra/src/game/manpower.ts')).href);

const enc = (x) => {
  if (x === undefined) return { absent: true };
  if (typeof x !== 'number') return x;
  if (Object.is(x, -0)) return { $n: '-0' };
  if (Number.isNaN(x)) return { $n: 'NaN' };
  if (x === Infinity) return { $n: 'Infinity' };
  if (x === -Infinity) return { $n: '-Infinity' };
  if (Number.isInteger(x)) return x;
  return { $f: String(x) };
};
const encItem = (it) => {
  const o = { kind: it.kind, id: it.id, nazwa: it.nazwa, koszt: enc(it.koszt) };
  if (it.postep !== undefined) o.postep = enc(it.postep);
  if (it.isGeneral !== undefined) o.isGeneral = it.isGeneral;
  return o;
};

// --- manpowerCostOf ---------------------------------------------------------------
const scoutId = 'Zwiadowca';
const scoutCheck = M.isScoutTypeId(scoutId);
const itemIds = ['Wojownik', 'Miecznik', 'Łucznik', 'Zwiadowca', 'Galera', 'koszary', 'zamek', '', '-', 'nieistnieje'];
const itemKinds = ['jednostka', 'budynek'];
const epokaVals = [1, 2, 3, 4, 0, -1, 1.5, 2.9999, NaN, Infinity, -Infinity];
const maxMultVals = [undefined, 1, 0.5, 2, 0, NaN, -1];
const costMultVals = [undefined, 1, 0, 2, 0.25, NaN, -3];
const manpowerCases = [];
for (const kind of itemKinds) for (const id of itemIds) for (const ep of epokaVals) for (const mm of maxMultVals) for (const cm of costMultVals) {
  const item = { kind, id, nazwa: id, koszt: 1 };
  const out = W.manpowerCostOf(item, ep, mm, cm); // undefined = brak argumentu (domyslne parametry JS)
  manpowerCases.push({
    item: { kind, id },
    epoka: enc(ep),
    maxMult: enc(mm),
    costMult: enc(cm),
    out: enc(out),
  });
}

// --- setPaused --------------------------------------------------------------------
const mkItem = (kind, id, koszt, extra = {}) => ({ kind, id, nazwa: id, koszt, ...extra });
const prodInputs = [
  { kolejka: [], postep: 0 },
  { kolejka: [mkItem('budynek', 'koszary', 30)], postep: 4.5 },
  { kolejka: [mkItem('jednostka', 'Wojownik', 12, { postep: 3 }), mkItem('budynek', 'zamek', 90)], postep: 0 },
  { kolejka: [mkItem('jednostka', 'Wojownik', 12)], postep: 1, rekrutacja: [mkItem('jednostka', 'Łucznik', 8, { isGeneral: true })] },
  { kolejka: [], postep: 0, rekrutacja: [] },
  { kolejka: [], postep: 0, wstrzymana: true },
  { kolejka: [], postep: 0, wstrzymana: false, rekrutacja: [mkItem('jednostka', 'Galera', 20)] },
];
const setPausedCases = [];
for (const p of prodInputs) for (const paused of [true, false]) {
  const out = W.setPaused(structuredClone(p), paused);
  setPausedCases.push({
    input: {
      kolejka: p.kolejka.map(encItem),
      postep: enc(p.postep),
      wstrzymana: enc(p.wstrzymana),
      rekrutacja: p.rekrutacja === undefined ? { absent: true } : p.rekrutacja.map(encItem),
    },
    paused,
    out: {
      kolejka: out.kolejka.map(encItem),
      postep: enc(out.postep),
      wstrzymana: out.wstrzymana,
      rekrutacja: out.rekrutacja === undefined ? { absent: true } : out.rekrutacja.map(encItem),
    },
  });
}

const doc = {
  zrodlo: 'production.ts manpowerCostOf i setPaused @91dc998a (gra/src/game/production.ts); manpower.ts unitManpowerCostForType @91dc998a',
  scoutId,
  scoutCheck,
  manpowerCostOf: manpowerCases,
  setPaused: setPausedCases,
};
writeFileSync(join(outDir, 'p1b-c2a.json'), JSON.stringify(doc, null, 1) + '\n');
console.log('manpowerCostOf', manpowerCases.length, 'setPaused', setPausedCases.length, 'scoutCheck', scoutCheck);
