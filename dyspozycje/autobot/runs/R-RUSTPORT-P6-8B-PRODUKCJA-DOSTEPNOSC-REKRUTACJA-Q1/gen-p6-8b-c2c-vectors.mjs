// P6.8B-P1b-c2c (pin 91dc998a): wektory z URUCHOMIONEGO weba dla symbolu:
//   availableProduction (production.ts ~923-1135) -- wywolany na PRAWDZIWYM production.ts
//   (graf importow ladowany w calosci przez repin-b-loader-hooks.mjs; zadnych stubow).
// Dane: PRAWDZIWE `gra/data/buildings.json` i `gra/data/units.json` z pinu.
// Konteksty: deterministyczna siatka wariantow (ponizej); brak pola = `undefined` (kod JS pomija klucz).
// Uruchomienie (Node 22, z katalogu tego runu):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-p6-8b-c2c-vectors.mjs <WEB_ROOT (katalog z gra/, z git archive 91dc998a gra)> \
//        <KATALOG_WYJSCIA> <KATALOG_ROBOCZY_POZA_REPO>
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
const unitNames = units.map((u) => u.Jednostka);
if (new Set(unitNames).size !== unitNames.length) throw new Error('Jednostka nie jest unikalna');
const galera = units.find((u) => u.Jednostka === 'Galera');
if (!galera) throw new Error('brak Galera w units.json');
const unitsSynth = [
  ...units,
  { ...galera, Jednostka: 'Wojownik próbny', Typ: 'Swordsman', Nacja: '', Epoka: 'Kamień', Tech: '-', Surowiec: 'Drewno',
    'W zamian za': 'Wojownik', 'Zastąp specjalnie': '—', 'Super-jednostka': '—', 'Pieniądz (koszt)': 5 },
];
const datasets = { real: units, synth: unitsSynth };
const bIds = buildings.map((b) => b.id);
if (new Set(bIds).size !== bIds.length) throw new Error('id budynku nie jest unikalne (findBuilding = pierwszy)');

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
const UNIT_FIELDS = ['Jednostka', 'Epoka', 'Tech', 'Typ', 'Nacja', 'Surowiec', 'W zamian za',
  'Zastąp specjalnie', 'Super-jednostka', 'Pieniądz (koszt)', 'Rola (linia)'];
const BUILDING_FIELDS = ['id', 'nazwa', 'kosztBudowy', 'przyrostKosztu', 'epokaWejscia', 'lokalizacja',
  'upgradeFrom', 'suppressed', 'techUnlock', 'wymaganySurowiec', 'odblokowuje'];
const pickRaw = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k] === undefined ? { absent: true } : o[k]]));
const unitsProj = units.map((u) => pickRaw(u, UNIT_FIELDS));
const buildingsProj = buildings.map((b) => pickRaw(b, BUILDING_FIELDS));

const allTechs = [...new Set(units.map((u) => (u.Tech ?? '').toString().trim()))]
  .filter((t) => t && t !== '-' && t !== '—');
const bTechs = buildings.map((b) => (b.techUnlock ?? '').toString().trim())
  .filter((t) => t && t !== '-' && t !== '\u2014');
allTechs.push(...new Set(bTechs.filter((t) => !allTechs.includes(t))));
const halfTechs = allTechs.filter((_, i) => i % 2 === 0);
const pick = (arr, k, off = 0) => arr.filter((_, i) => (i + off) % k === 0);
const superNames = units.filter((u) => u['Super-jednostka'] === 'TAK').map((u) => u.Jednostka);
const mkItem = (kind, id, koszt) => ({ kind, id, nazwa: id, koszt });

// Siatka kontekstow (deterministyczna). Kazdy: JS-owy obiekt ctx (bez undefined = brak klucza).
const CTX = [];
const epochs = [1, 2, 3, 4];
const builtSets = [
  [], ['koszary'], ['koszary', 'mury'], ['akademia_wojskowa'], ['koszary', 'palisada'],
  ['mury', 'fort'], ['cegielnia', 'garncarnia', 'koszary'],
];
const stocks = [undefined, {}, { braz: 1 }, { zelazo: 1, drewno: 1 }, { braz: 0, zelazo: 0, drewno: 0 }];
const civs = [
  { civUnitNacja: 'Grecja' }, { civUnitNacja: 'Rzym' }, { civKey: 'grecy', civUnitNacja: 'Rzym' },
  { civKey: null, civUnitNacja: 'Grecja' }, {}, { civUnitNacja: '' },
];
for (let i = 0; i < 320; i++) {
  const h = (i * 2654435761) >>> 0; // deterministyczne mieszanie indeksow
  const bit = (n) => ((h >>> n) & 1) === 1;
  const ctx = {
    epoch: epochs[(h >>> 3) % 4],
    buildingLevel: [1, 2, 3, NaN, 0.5][(h >>> 5) % 5],
    builtBuildingIds: [...builtSets[(h >>> 7) % builtSets.length], ...pick(bIds, 3 + ((h >>> 9) % 6), (h >>> 12) % 5).slice(0, 4)],
    techs: [allTechs, halfTechs, [], allTechs, halfTechs][(h >>> 15) % 5],
    ...civs[(h >>> 17) % civs.length],
    cityHasCoastOrRiver: bit(20),
    showStockGatedUnits: bit(21),
    showResourceGatedBuildings: bit(22),
    aliveUnitTypeNames: bit(23) ? superNames.slice(0, 2 + ((h >>> 24) % 3)) : undefined,
    empireBuiltIds: bit(25) ? pick(bIds, 2 + ((h >>> 26) % 4), (h >>> 28) % 3) : undefined,
    empireResourceStock: stocks[(h >>> 10) % stocks.length],
    isCapital: [true, false, undefined][(h >>> 30) % 3],
    productionQueue: bit(4) && bit(6)
      ? [mkItem('budynek', bIds[(i * 3) % bIds.length], 40)]
      : (bit(8) ? [mkItem('jednostka', unitNames[(i * 5) % unitNames.length], 9)] : []),
  };
  CTX.push({ name: `ctx-${i}`, ctx });
}

// Konteksty lancuchow ulepszen (upgradeFrom): [poprzednik+ulepszenie], [poprzednik], [ulepszenie w kolejce].
for (const b of buildings.filter((x) => (x.upgradeFrom ?? '').trim() !== '')) {
  const from = b.upgradeFrom.trim();
  const base = { epoch: 4, buildingLevel: 1, techs: allTechs, civUnitNacja: 'Grecja', cityHasCoastOrRiver: true,
    showStockGatedUnits: false, showResourceGatedBuildings: false, isCapital: true,
    empireResourceStock: { braz: 1, zelazo: 1, drewno: 1 }, productionQueue: [] };
  CTX.push({ name: `up-${b.id}-both`, ctx: { ...base, builtBuildingIds: [from, b.id] } });
  CTX.push({ name: `up-${b.id}-from`, ctx: { ...base, builtBuildingIds: [from] } });
  CTX.push({ name: `up-${b.id}-queue`, ctx: { ...base, builtBuildingIds: [from], productionQueue: [mkItem('budynek', b.id, 30)] } });
}

// Kodowanie kontekstu do JSON (pola undefined -> absent; NaN -> $n; tablice/obiekty bez zmian).
const encCtx = (ctx) => {
  const o = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v === undefined) { o[k] = { absent: true }; continue; }
    if (k === 'productionQueue') { o[k] = v.map((it) => ({ kind: it.kind, id: it.id, nazwa: it.nazwa, koszt: enc(it.koszt) })); continue; }
    if (k === 'aliveUnitTypeNames') { o[k] = [...v]; continue; }
    if (k === 'empireResourceStock') { o[k] = v === null ? null : Object.fromEntries(Object.entries(v).map(([a, b]) => [a, enc(b)])); continue; }
    if (typeof v === 'number') { o[k] = enc(v); continue; }
    o[k] = v;
  }
  return o;
};

const cases = [];
for (const [dsName, dsUnits] of Object.entries(datasets))
for (const c of CTX) {
  const ctx = { ...c.ctx };
  // Kopia do wywolania: alive/empireBuiltIds jako Set/tablica zgodnie z typem webowym (readonly string[]).
  if (ctx.aliveUnitTypeNames !== undefined) ctx.aliveUnitTypeNames = new Set(ctx.aliveUnitTypeNames);
  const techs = ctx.techs;
  delete ctx.techs;
  const out = W.availableProduction({}, { buildings, units: dsUnits }, techs, ctx);
  cases.push({
    ds: dsName,
    ctx: c.name,
    out: out.map((it) => [it.kind, it.id, it.nazwa === it.id ? true : it.nazwa, enc(it.koszt)]),
  });
}

const doc = {
  zrodlo: 'production.ts availableProduction (@91dc998a, ~923-1135) z buildings.json/units.json @91dc998a; uruchomione z pinu (repin-b-loader-hooks)',
  allTechs,
  halfTechs,
  unitsProj,
  unitsProjSynth: unitsSynth.map((u) => pickRaw(u, UNIT_FIELDS)),
  buildingsProj,
  ctxs: CTX.map((c) => ({ name: c.name, ctx: encCtx(c.ctx), techs: c.ctx.techs === allTechs ? 'ALL' : (c.ctx.techs === halfTechs ? 'HALF' : (c.ctx.techs ?? []).length === 0 ? 'NONE' : 'OTHER') })),
  cases,
};
writeFileSync(join(outDir, 'p1b-c2c.json'), JSON.stringify(doc) + '\n');
const nonEmpty = cases.filter((c) => c.out.length > 0).length;
const kinds = cases.reduce((acc, c) => acc + c.out.filter((x) => x[0] === 'budynek').length, 0);
console.log('cases', cases.length, 'nonEmpty', nonEmpty, 'budynekItems', kinds, 'units', units.length, 'buildings', buildings.length);
