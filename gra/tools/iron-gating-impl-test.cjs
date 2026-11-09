'use strict';
/**
 * iron-gating-impl-test.cjs -- R-WEB-TECH-IRON-GATING-IMPL-Q1.
 * Decyzja wlasciciela 2026-11-09: Hutnictwo zelaza = surowiec zelazo + Kopalnia/Odlewnia/Kuznia
 * (bez jednostek epoki Zelaza); WSZYSTKIE jednostki epoki Zelaza (poza Katapulta) rekrutuje
 * dopiero Sztuka wojenna (prereq: Oblezenictwo + Obrobka zelaza + Hutnictwo zelaza).
 * Uruchom z gra/:  node tools/iron-gating-impl-test.cjs
 * Pure logic (esbuild bundle production.ts + research.ts, prawdziwe dane JSON).
 */
const fs = require('fs');
const path = require('path');
const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[iron-gating-impl-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY = path.resolve(__dirname, '.iron-gating-impl-entry.ts');
const BUNDLE = path.resolve(__dirname, '.iron-gating-impl-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { availableProduction } from '../src/game/production';
export { parsePrerequisites, canResearch, availableTechs } from '../src/game/research';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'] });
} catch (e) { console.error('bundling failed:\n', e.message || e); process.exit(1); }
const M = require(BUNDLE);
fs.unlinkSync(ENTRY);
fs.unlinkSync(BUNDLE);

const techJson = require('../data/tech.json');
const TECHS_DEF = techJson.technologie;
const unitsList = Object.values(require('../data/units.json'));
const buildings = require('../data/buildings.json');
const BLD = Array.isArray(buildings) ? buildings : Object.values(buildings);
const improvements = require('../data/terrain-improvements.json');

let passed = 0, failed = 0;
function assert(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + (extra ? ' -- ' + extra : '')); }
}
const SW = 'Sztuka wojenna';
const techDef = n => TECHS_DEF.find(t => t.Technologia === n);

console.log('\n[iron-gating-impl-test]\n');

console.log('1. units.json: 24 jednostki epoki Zelaza -> Tech = Sztuka wojenna, Katapulta -> Oblezenictwo');
const iron = unitsList.filter(u => u.Epoka === 'Żelazo');
assert(iron.length === 25, '25 jednostek epoki Zelaza w danych', 'got=' + iron.length);
const ironNoCat = iron.filter(u => u.Jednostka !== 'Katapulta');
assert(ironNoCat.length === 24, '24 jednostki bez Katapulty', 'got=' + ironNoCat.length);
for (const u of ironNoCat) assert(u.Tech === SW, `${u.Jednostka}: Tech = Sztuka wojenna`, 'got=' + u.Tech);
const kat = iron.find(u => u.Jednostka === 'Katapulta');
assert(kat && kat.Tech === 'Oblężnictwo', 'Katapulta zostaje na Oblezenictwie', 'got=' + (kat && kat.Tech));
const hieros = iron.find(u => u.Jednostka.startsWith('Hieros Lochos'));
assert(hieros && hieros.Tech === SW, 'Hieros Lochos ma teraz Tech = Sztuka wojenna');

console.log('\n2. Surowiec zelazo, Kopalnia, Odlewnia, Kuznia zostaja na Hutnictwie zelaza');
const hut = techDef('Hutnictwo żelaza');
assert(hut['Odblokowuje surowiec.'] === 'żelazo', 'Hutnictwo odblokowuje surowiec zelazo');
assert(hut.awansDoEpoki === 3, 'Hutnictwo zachowuje awansDoEpoki 3');
assert(!/Jednostki:/.test(hut['Odblokowuje budynek'] || ''), 'Hutnictwo: opis bez listy jednostek', hut['Odblokowuje budynek']);
assert(/Odlewnia żelaza/.test(hut['Odblokowuje budynek']) && /Kuźnia żelaza/.test(hut['Odblokowuje budynek']), 'Hutnictwo: opis zawiera Odlewnie i Kuznie zelaza');
const odlewnia = BLD.find(b => b.id === 'odlewnia_zelaza');
const kuznia = BLD.find(b => b.id === 'kuznia_zelaza');
assert(odlewnia && odlewnia.techUnlock === 'Hutnictwo żelaza', 'odlewnia_zelaza techUnlock = Hutnictwo zelaza');
assert(kuznia && kuznia.techUnlock === 'Hutnictwo żelaza', 'kuznia_zelaza techUnlock = Hutnictwo zelaza');
const kopalnia = improvements.kopalnia_zelaza;
assert(kopalnia && kopalnia.tech === 'Hutnictwo żelaza', 'kopalnia_zelaza tech = Hutnictwo zelaza', 'got=' + (kopalnia && kopalnia.tech));
const obr = techDef('Obróbka żelaza');
assert(!/Jednostki:/.test(obr['Odblokowuje budynek'] || ''), 'Obrobka zelaza: opis bez listy jednostek', obr['Odblokowuje budynek']);

console.log('\n3. Sztuka wojenna: prereq Oblezenictwo + Obrobka zelaza + Hutnictwo zelaza; opis jednostek');
const sw = techDef(SW);
const pre = M.parsePrerequisites(sw['Wymaga (prereq)']);
for (const p of ['Oblężnictwo', 'Obróbka żelaza', 'Hutnictwo żelaza']) assert(pre.includes(p), 'prereq zawiera ' + p, JSON.stringify(pre));
assert(/Akademia wojskowa/.test(sw['Odblokowuje budynek']), 'Sztuka wojenna nadal odblokowuje Akademie wojskowa');
for (const u of ironNoCat) assert(sw['Odblokowuje budynek'].includes(u.Jednostka), `opis Sztuki wojennej wymienia: ${u.Jednostka}`);

console.log('\n4. Brak cyklu: prereq techow + wymagany budynek -> techUnlock budynku');
{
  const byName = new Map(BLD.map(b => [(b.nazwa || '').toLowerCase(), b]));
  const edges = new Map();
  for (const t of TECHS_DEF) {
    const deps = M.parsePrerequisites(t['Wymaga (prereq)']).slice();
    const rb = t['wymagany budynek'];
    if (rb) {
      const b = byName.get(String(rb).toLowerCase());
      if (b && b.techUnlock) deps.push(b.techUnlock);
    }
    edges.set(t.Technologia, deps);
  }
  const state = new Map(); let cycle = null;
  const dfs = (n, stack) => {
    if (cycle) return;
    if (state.get(n) === 2) return;
    if (state.get(n) === 1) { cycle = [...stack, n].join(' -> '); return; }
    state.set(n, 1);
    for (const d of edges.get(n) || []) dfs(d, [...stack, n]);
    state.set(n, 2);
  };
  for (const n of edges.keys()) dfs(n, []);
  assert(!cycle, 'graf zaleznosci techow bez cyklu', cycle);
}

console.log('\n5. Rekrutacja: zablokowana bez Sztuki wojennej, odblokowana z nia (availableProduction)');
const BASE_TECHS = ['Brazownictwo', 'Brązownictwo', 'Hutnictwo żelaza', 'Obróbka żelaza', 'Oblężnictwo'];
const ctxFor = nacja => ({
  epoch: 3, civUnitNacja: nacja, civBonusy: [],
  builtBuildingIds: ['odlewnia_zelaza', 'koszary'],
  placedImprovements: null, hasKopalniaNaZlozuZelaza: true,
  empireResourceStock: { braz: 500, zelazo: 500, drewno: 500 },
  ownerId: 0, aliveUnitTypeNames: new Set(),
});
const CITY = { id: 'c1', ownerId: 0, q: 0, r: 0 };
const DATA = { buildings: [], units: unitsList };
const ids = items => new Set(items.map(i => i.id));
let withoutOk = 0, withOk = 0;
for (const u of ironNoCat) {
  const without = ids(M.availableProduction(CITY, DATA, BASE_TECHS, ctxFor(u.Nacja)));
  const withSW = ids(M.availableProduction(CITY, DATA, [...BASE_TECHS, SW], ctxFor(u.Nacja)));
  assert(!without.has(u.Jednostka), `${u.Jednostka}: brak w rekrutacji bez Sztuki wojennej (Hutnictwo+Obrobka+Oblezenictwo)`);
  assert(withSW.has(u.Jednostka), `${u.Jednostka}: dostepna w rekrutacji ze Sztuka wojenna`);
}
{
  const withKat = ids(M.availableProduction(CITY, DATA, BASE_TECHS, ctxFor('Grecja')));
  assert(withKat.has('Katapulta'), 'Katapulta rekrutowana bez Sztuki wojennej (tylko Oblezenictwo)');
  const noObl = ids(M.availableProduction(CITY, DATA, BASE_TECHS.filter(t => t !== 'Oblężnictwo'), ctxFor('Grecja')));
  assert(!noObl.has('Katapulta'), 'Katapulta zablokowana bez Oblezenictwa');
  const onlyHut = ids(M.availableProduction(CITY, DATA, ['Brazownictwo', 'Brązownictwo', 'Hutnictwo żelaza'], ctxFor('Grecja')));
  const anyIron = [...onlyHut].filter(id => ironNoCat.some(u => u.Jednostka === id));
  assert(anyIron.length === 0, 'po samym Hutnictwie: zero jednostek epoki Zelaza (poza Katapulta)', anyIron.join(','));
  const bronze = [...onlyHut].filter(id => unitsList.some(u => u.Jednostka === id && u.Epoka === 'Brąz'));
  assert(bronze.length > 0, 'po samym Hutnictwie: lista rekrutacji NIE jest pusta (jednostki Brazu)', 'n=' + bronze.length);
}

console.log('\n6. Badanie: Sztuka wojenna wymaga Hutnictwa i Obrobki (canResearch)');
{
  const allBut = TECHS_DEF.map(t => t.Technologia).filter(n => !['Sztuka wojenna'].includes(n));
  const st = (list) => ({ ukonczone: list, biezace: null, postep: 0 });
  assert(M.canResearch(st(allBut), TECHS_DEF, SW), 'z kompletem prereq Sztuka wojenna jest badalna');
  for (const miss of ['Oblężnictwo', 'Obróbka żelaza', 'Hutnictwo żelaza']) {
    assert(!M.canResearch(st(allBut.filter(n => n !== miss)), TECHS_DEF, SW), `bez ${miss} Sztuka wojenna NIE jest badalna`);
  }
}

console.log(`\n[iron-gating-impl-test] ${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
