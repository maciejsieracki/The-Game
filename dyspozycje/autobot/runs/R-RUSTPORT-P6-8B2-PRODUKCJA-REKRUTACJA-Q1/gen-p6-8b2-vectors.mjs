// P6.8B2-P2 (pin 91dc998a): wektory z URUCHOMIONEGO weba dla symboli production.ts 2004-2541.
// Funkcje z PRAWDZIWEGO modulu production.ts (loader: repin-b-loader-register.mjs z runu
// R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1; zadnych stubow). Dane: PRAWDZIWE
// gra/data/buildings.json i gra/data/units.json z pinu 91dc998a.
// Uruchomienie (Node 22, z katalogu runu 8B, zeby zaladowac loader):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        <ABS>/R-RUSTPORT-P6-8B2-PRODUKCJA-REKRUTACJA-Q1/gen-p6-8b2-vectors.mjs \
//        <WEB_ROOT (katalog z gra/)> <KATALOG_WYJSCIA> <KATALOG_ROBOCZY_POZA_REPO>
// Kodowanie: calkowita skonczona = JSON number; niecalkowita = {"$f": String(x)};
// NaN/Infinity/-Infinity/-0 = {"$n": "..."}; undefined = {"absent": true}; null = null.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
const scratch = presolve(process.argv[4] ?? '');
if (!process.argv[4]) throw new Error('podaj 3. argument: katalog roboczy poza repo');
mkdirSync(outDir, { recursive: true });
mkdirSync(scratch, { recursive: true });

const W = await import(pathToFileURL(join(webRoot, 'gra/src/game/production.ts')).href);
const units = JSON.parse(readFileSync(join(webRoot, 'gra/data/units.json'), 'utf8'));
const buildings = JSON.parse(readFileSync(join(webRoot, 'gra/data/buildings.json'), 'utf8'));
if (!Array.isArray(units) || !Array.isArray(buildings)) throw new Error('units/buildings: oczekiwano tablic');

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
const mkItem = (kind, id, koszt) => ({ kind, id, nazwa: id, koszt });
const encItem = (it) => {
  const o = { kind: it.kind, id: it.id, nazwa: it.nazwa, koszt: enc(it.koszt) };
  if (it.postep !== undefined) o.postep = enc(it.postep);
  if (it.isGeneral !== undefined) o.isGeneral = it.isGeneral;
  return o;
};
const encQueue = (q) => q.map(encItem);
const encProd = (p) => {
  const o = { kolejka: encQueue(p.kolejka), postep: enc(p.postep) };
  if (p.wstrzymana !== undefined) o.wstrzymana = p.wstrzymana;
  if (p.rekrutacja !== undefined) o.rekrutacja = encQueue(p.rekrutacja);
  return o;
};
const SAMPLE_ITEMS = [
  mkItem('jednostka', 'Wojownik', 10), mkItem('jednostka', 'Zwiadowca', 0),
  mkItem('budynek', 'koszary', 30), mkItem('budynek', 'zamek', 120),
  mkItem('jednostka', 'Galera', 7.5), mkItem('budynek', 'nieistnieje', 3),
];

// ---------------------------------------------------------------- 1. kolejka rekrutacji
const PRODS = [
  { kolejka: [], postep: 0 },
  { kolejka: [mkItem('budynek', 'koszary', 30)], postep: 12.5 },
  { kolejka: [mkItem('budynek', 'koszary', 30)], postep: 7, wstrzymana: true, rekrutacja: [mkItem('jednostka', 'Wojownik', 10)] },
  { kolejka: [mkItem('budynek', 'koszary', 30), mkItem('budynek', 'zamek', 120)], postep: 0, rekrutacja: [mkItem('jednostka', 'Galera', 7.5), mkItem('jednostka', 'Wojownik', 10)], wstrzymana: false },
];
const prodCases = [];
for (const p of PRODS) {
  for (const it of SAMPLE_ITEMS) {
    prodCases.push({ op: 'enqueue', prod: encProd(p), item: encItem(it), out: encProd(W.enqueueRecruitment(p, it)) });
  }
  for (let idx = -1; idx <= 3; idx++) {
    prodCases.push({ op: 'dequeue', prod: encProd(p), index: idx, out: encProd(W.dequeueRecruitment(p, idx)) });
  }
}

// ---------------------------------------------------------------- 2. advance / rush
const RQ_SETS = [
  [], [mkItem('jednostka', 'Wojownik', 10)],
  [mkItem('jednostka', 'Wojownik', 10), mkItem('jednostka', 'Galera', 7.5), mkItem('jednostka', 'Zwiadowca', 0)],
];
const advCases = [];
const CITIES = [
  { population: 10, manpower: 100 }, { population: 1, manpower: 0 }, { population: 5 },
  { population: 0, manpower: NaN }, { population: 3, manpower: 2.7 },
];
for (const p of PRODS) for (const rq of RQ_SETS) {
  const prod = { ...p, rekrutacja: rq.length ? rq : undefined };
  for (const max of [undefined, 0, -1, 1, 2, 5, NaN]) {
    const out = max === undefined ? W.advanceRecruitment(prod) : W.advanceRecruitment(prod, max);
    advCases.push({ op: 'advanceRecruitment', prod: encProd(prod), max: max === undefined ? { absent: true } : enc(max),
      out: { prod: encProd(out.prod), completed: encQueue(out.completed) } });
  }
  for (const city of CITIES) for (const epokaV of [1, 2, 3]) for (const paid of [false, true]) {
    const out = W.advanceRecruitmentGated(prod, city, epokaV, 1, paid, 1, 1);
    advCases.push({ op: 'advanceRecruitmentGated', prod: encProd(prod),
      city: { population: enc(city.population), manpower: city.manpower === undefined ? { absent: true } : enc(city.manpower) },
      epoka: epokaV, costAlreadyPaid: paid,
      out: { prod: encProd(out.prod), completed: encQueue(out.completed), population: enc(out.population), manpower: enc(out.manpower) } });
  }
}
const rushCases = [];
for (const p of PRODS) {
  const out = W.rushProduction(p);
  rushCases.push({ op: 'rushProduction', prod: encProd(p),
    out: { prod: encProd(out.prod), completed: out.completed === null ? null : encItem(out.completed) } });
  for (const mod of [undefined, 0, 0.25, -0.5, NaN, Infinity, -Infinity, 2]) {
    const cost = mod === undefined ? W.rushCost(p) : W.rushCost(p, mod);
    rushCases.push({ op: 'rushCost', prod: encProd(p), modifier: mod === undefined ? { absent: true } : enc(mod), out: enc(cost) });
  }
}

// ---------------------------------------------------------------- 3. praca / podzial
const pracaCases = [];
for (const raw of [0, -1, NaN, Infinity, 0.4, 0.5, 1, 1.5, 2.5, 3, 4.2, 5.5, 6, 7.49, 99.9, -Infinity]) {
  pracaCases.push({ op: 'cityPracaInteger', in: enc(raw), out: enc(W.cityPracaInteger(raw)) });
}
for (const total of [0, 1, 2, 3, 6, 7, 10, 13, 100, NaN, -4, 2.6]) {
  for (const u of [0, 0.5, 0.7, 1, 0.33, 0.2, 1.2, -0.3, NaN, Infinity, -Infinity, undefined]) {
    const split = u === undefined ? W.splitPraca(total) : W.splitPraca(total, u);
    pracaCases.push({ op: 'splitPraca', total: enc(total), u: u === undefined ? { absent: true } : enc(u),
      out: { total: enc(split.total), doBudynkow: enc(split.doBudynkow), doPuli: enc(split.doPuli) } });
  }
}
for (const qe of [true, false]) for (const bu of [0, 1, 2, 3]) for (const pu of [0, 1, 4]) {
  const split = { doBudynkow: bu, doPuli: pu };
  pracaCases.push({ op: 'pracaImperialPoolGain', split, queueEmpty: qe, out: enc(W.pracaImperialPoolGain(split, qe)) });
}
const TICK_SETS = [
  [], [{ doBudynkow: 3, doPuli: 2 }], [{ doBudynkow: 3, doPuli: 2 }, { doBudynkow: 1, doPuli: 0 }, { doBudynkow: 0, doPuli: 4 }],
];
for (const ticks of TICK_SETS) for (const qe of [[], [true], [false, true, false], [true, true, true, true]]) for (const paused of [undefined, [], [false, true, false], [true, false, false]]) {
  const options = paused === undefined ? { queueEmpty: qe } : { queueEmpty: qe, paused };
  pracaCases.push({ op: 'previewPracaPoolBrutto', ticks, queueEmpty: qe, paused: paused === undefined ? { absent: true } : paused,
    out: enc(W.previewPracaPoolBrutto(ticks, options)) });
}

// ---------------------------------------------------------------- 4. output split
const outCases = [];
const SHARE_SETS = [
  undefined,
  { produkcja: 1, pieniadz: 1, nauka: 1, rozwoj: 1 },
  { produkcja: 0, pieniadz: 0, nauka: 0, rozwoj: 0 },
  { produkcja: 0.5, pieniadz: 0.3, nauka: 0.2, rozwoj: 0.1 },
  { produkcja: 3, pieniadz: 0, nauka: 0, rozwoj: 0 },
  { produkcja: NaN, pieniadz: 1, nauka: 1, rozwoj: 1 },
  { produkcja: -1, pieniadz: 2, nauka: 1, rozwoj: 1 },
  { produkcja: Infinity, pieniadz: 1, nauka: 1, rozwoj: 1 },
  { produkcja: 0.1, pieniadz: 0.7, nauka: 0.7, rozwoj: 0.333 },
];
const encShares = (sh) => (sh === undefined ? { absent: true } : Object.fromEntries(Object.entries(sh).map(([k, v]) => [k, enc(v)])));
for (const total of [0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 99, 1000, 12345, NaN, -5, Infinity, -Infinity, 0.5, 2.9, 1e6 + 1]) {
  for (const sh of SHARE_SETS) {
    const out = sh === undefined ? W.splitOutput(total) : W.splitOutput(total, sh);
    outCases.push({ op: 'splitOutput', total: enc(total), shares: encShares(sh),
      out: { produkcja: enc(out.produkcja), pieniadz: enc(out.pieniadz), nauka: enc(out.nauka), rozwoj: enc(out.rozwoj) } });
    const sci = sh === undefined ? W.cityScienceOutput(total) : W.cityScienceOutput(total, sh);
    const mon = sh === undefined ? W.cityMoneyOutput(total) : W.cityMoneyOutput(total, sh);
    outCases.push({ op: 'cityScienceMoneyOutput', total: enc(total), shares: encShares(sh), nauka: enc(sci), pieniadz: enc(mon) });
  }
}

// ---------------------------------------------------------------- 5. koszt jednostki
const unitCases = [];
for (const def of units.slice(0, 80)) {
  unitCases.push({ op: 'unitCostMode', name: def.Jednostka, out: W.unitCostMode(def) });
  unitCases.push({ op: 'unitPurchaseCost', name: def.Jednostka, out: enc(W.unitPurchaseCost(def)) });
}
const synthDefs = [
  { Jednostka: 'Syn-A', Epoka: 'Kamień', 'Pieniądz (koszt)': 0, 'Rola (linia)': 'Wsparcie' },
  { Jednostka: 'Syn-B', Epoka: 'Żelazo', 'Pieniądz (koszt)': 7.6, 'Rola (linia)': 'Konnica' },
  { Jednostka: 'Syn-C', Epoka: null, 'Pieniądz (koszt)': NaN, 'Rola (linia)': 'Dystans' },
  { Jednostka: 'Syn-D', Epoka: 'Brąz', 'Pieniądz (koszt)': -3, 'Rola (linia)': 'Wrecz' },
];
for (const d of synthDefs) {
  unitCases.push({ op: 'unitCostMode', synth: d.Jednostka, out: W.unitCostMode(d) });
  unitCases.push({ op: 'unitPurchaseCost', synth: d.Jednostka, out: enc(W.unitPurchaseCost(d)) });
}

// ---------------------------------------------------------------- 6. eraBuildingCatalog (realne dane)
const BUILDING_FIELDS = ['id', 'nazwa', 'kategoria', 'kosztBudowy', 'przyrostKosztu', 'epokaWejscia', 'lokalizacja',
  'upgradeFrom', 'suppressed', 'techUnlock', 'wymaganySurowiec', 'odblokowuje', 'wielokrotny', 'wymagania', 'koszt_surowce'];
const UNIT_FIELDS = ['Jednostka', 'Epoka', 'Tech', 'Typ', 'Nacja', 'Surowiec', 'W zamian za',
  'Zastąp specjalnie', 'Super-jednostka', 'Pieniądz (koszt)', 'Rola (linia)'];
const pickRaw = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k] === undefined ? { absent: true } : (typeof o[k] === 'number' ? enc(o[k]) : o[k])]));
const bIds = buildings.map((b) => b.id);
const allTechs = [...new Set(buildings.map((b) => (b.techUnlock ?? '').toString().trim()).filter((t) => t && t !== '-' && t !== '—'))];
const builtSets = [[], ['koszary'], ['koszary', 'mury'], ['mury', 'fort'], ['cegielnia', 'garncarnia', 'koszary'], bIds.slice(0, 12)];
const stocks = [undefined, {}, { braz: 1 }, { zelazo: 1, drewno: 1, kamien: 1 }, { braz: 0, zelazo: 0, drewno: 0 }];
const queues = [[], [mkItem('budynek', bIds[3], 40)], [mkItem('jednostka', 'Wojownik', 10)]];
const catCases = [];
let ci = 0;
for (const ep of [1, 2, 3, 4, NaN]) for (const bs of builtSets) for (const cap of [true, false, undefined]) for (const st of stocks) {
  ci++;
  const lvl = ci % 2 === 0 ? 2 : 1;
  const q = queues[(ci * 7) % queues.length];
  const techs = ci % 2 === 0 ? allTechs : allTechs.filter((_, i) => i % 3 === 0);
  const ctx = {
    epoch: ep, buildingLevel: lvl, builtBuildingIds: bs, productionQueue: q, isCapital: cap, empireResourceStock: st,
    empireBuiltIds: ci % 3 === 0 ? bIds.slice(5, 9) : undefined, ownerId: ci % 4 === 0 ? 1 : 0, difficulty: 'normal',
  };
  const jsCtx = { ...ctx };
  if (jsCtx.isCapital === undefined) delete jsCtx.isCapital;
  if (jsCtx.empireResourceStock === undefined) delete jsCtx.empireResourceStock;
  if (jsCtx.empireBuiltIds === undefined) delete jsCtx.empireBuiltIds;
  const out = W.eraBuildingCatalog({ buildings, units }, techs, jsCtx);
  catCases.push({
    name: `cat-${ci}`,
    techs,
    ctx: {
      epoch: enc(ep), buildingLevel: enc(lvl), builtBuildingIds: bs, productionQueue: encQueue(q),
      isCapital: cap === undefined ? { absent: true } : cap,
      empireResourceStock: st === undefined ? { absent: true } : Object.fromEntries(Object.entries(st).map(([a, b]) => [a, enc(b)])),
      empireBuiltIds: ctx.empireBuiltIds === undefined ? { absent: true } : ctx.empireBuiltIds,
      ownerId: ctx.ownerId,
    },
    out: out.map((e) => ({ id: e.id, nazwa: e.nazwa, kategoria: e.kategoria, koszt: enc(e.koszt), status: e.status,
      missingTech: e.missingTech, wymagania: e.wymagania,
      locationBlocked: e.locationBlocked === undefined ? { absent: true } : e.locationBlocked })),
  });
}
const buildingsProj = buildings.map((b) => pickRaw(b, BUILDING_FIELDS));
const unitsProj = units.map((u) => pickRaw(u, UNIT_FIELDS));

// ---------------------------------------------------------------- zapis
const write = (name, obj) => {
  const txt = JSON.stringify(obj);
  writeFileSync(join(outDir, name), txt);
  console.log(name, txt.length, 'bytes');
};
write('p2-recruit.json', { prodCases, advCases, rushCases });
write('p2-praca.json', { pracaCases });
write('p2-output.json', { outCases });
write('p2-unit-cost.json', { unitCases });
write('p2-catalog.json', { buildingsProj, unitsProj, catCases });
console.log('counts', { prod: prodCases.length, adv: advCases.length, rush: rushCases.length, praca: pracaCases.length, out: outCases.length, unit: unitCases.length, cat: catCases.length });
