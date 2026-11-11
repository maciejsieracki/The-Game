'use strict';
/**
 * iron-gating-impl-test.cjs -- R-WEB-TECH-IRON-GATING-IMPL-Q1.
 * Decyzja wlasciciela 2026-11-09: Hutnictwo zelaza = surowiec zelazo + Kopalnia/Odlewnia/Kuznia
 * (bez jednostek epoki Zelaza); WSZYSTKIE jednostki epoki Zelaza, w tym Katapulta, wymagaja
 * Sztuki wojennej. Konnica i Jeździec chiński przechodzą do Żelaza.
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
export { availableProduction, availableReplacementsFor } from '../src/game/production';
export { advanceRecruitmentGated } from '../src/game/production';
export { parsePrerequisites, canResearch, availableTechs } from '../src/game/research';
export { chooseAIResearch } from '../src/game/ai';
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

console.log('1. units.json: kazda jednostka epoki Zelaza -> Tech = Sztuka wojenna');
const iron = unitsList.filter(u => u.Epoka === 'Żelazo');
assert(iron.length === 27, '27 jednostek epoki Zelaza po przesunieciu konnicy', 'got=' + iron.length);
for (const u of iron) assert(u.Tech === SW, `${u.Jednostka}: Tech = Sztuka wojenna`, 'got=' + u.Tech);
const kat = iron.find(u => u.Jednostka === 'Katapulta');
assert(kat && kat.Tech === SW, 'Katapulta wymaga Sztuki wojennej', 'got=' + (kat && kat.Tech));
for (const name of ['Konnica', 'Jeździec chiński']) {
  const u = unitsList.find(row => row.Jednostka === name);
  assert(u && u.Epoka === 'Żelazo' && u.Tech === SW, `${name}: Żelazo/Sztuka wojenna`, u && `${u.Epoka}/${u.Tech}`);
}
for (const [name, era, tech] of [
  ['Rydwan (woły)', 'Kamień', 'Koło'], ['Rydwan konny', 'Brąz', 'Jeździectwo'],
  ['Rydwan egipski', 'Brąz', 'Jeździectwo'], ['Rydwan sumeryjski', 'Brąz', 'Jeździectwo'],
  ['Rydwan mykeński', 'Brąz', 'Jeździectwo'], ['Rydwan Shang', 'Brąz', 'Jeździectwo'],
  ['Rydwan celtycki', 'Żelazo', SW], ['Rydwan Kapadokijski', 'Brąz', 'Jeździectwo'],
]) {
  const u = unitsList.find(row => row.Jednostka === name);
  assert(u && u.Epoka === era && u.Tech === tech, `${name}: zachowuje epoke/tech`, u && `${u.Epoka}/${u.Tech}`);
}
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
for (const u of iron) assert(sw['Odblokowuje budynek'].includes(u.Jednostka), `opis Sztuki wojennej wymienia: ${u.Jednostka}`);
assert(!/Katapulta/.test(techDef('Oblężnictwo')['Odblokowuje budynek']), 'Oblężnictwo nie wymienia juz Katapulty');

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

console.log('\n5. Produkcja i Zastap: bramki ery/techu dla jazdy i calej epoki Zelaza');
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
for (const u of iron) {
  const without = ids(M.availableProduction(CITY, DATA, BASE_TECHS, ctxFor(u.Nacja)));
  const withSW = ids(M.availableProduction(CITY, DATA, [...BASE_TECHS, SW], ctxFor(u.Nacja)));
  if (u.Typ === 'Siege') {
    assert(!without.has(u.Jednostka) && !withSW.has(u.Jednostka), `${u.Jednostka}: wykluczona z rekrutacji miejskiej`);
  } else {
    assert(!without.has(u.Jednostka), `${u.Jednostka}: brak w rekrutacji bez Sztuki wojennej (Hutnictwo+Obrobka+Oblezenictwo)`);
    assert(withSW.has(u.Jednostka), `${u.Jednostka}: dostepna w rekrutacji ze Sztuka wojenna`);
  }
}
{
  const noSW = ids(M.availableReplacementsFor('Konnica', DATA, BASE_TECHS, ctxFor('Chiny')));
  const withSW = ids(M.availableReplacementsFor('Konnica', DATA, [...BASE_TECHS, SW], ctxFor('Chiny')));
  assert(!noSW.has('Jeździec chiński'), 'Zastap blokuje Jezdzca chinskiego przed Sztuka wojenna');
  assert(withSW.has('Jeździec chiński'), 'Zastap udostepnia Jezdzca chinskiego po Sztuce wojennej');
  const bronzeItems = ids(M.availableProduction(CITY, DATA, [...BASE_TECHS, SW], { ...ctxFor('Grecja'), epoch: 2 }));
  assert(!bronzeItems.has('Konnica') && !bronzeItems.has('Jeździec chiński'), 'nowa rekrutacja konnicy jest zablokowana przed Żelazem');
  const alreadyPaid = M.advanceRecruitmentGated({ kolejka: [], postep: 0,
    rekrutacja: [{ kind: 'jednostka', id: 'Konnica', nazwa: 'Konnica', koszt: 22 }] },
  { population: 5, manpower: 5 }, 2, 1, true);
  assert(alreadyPaid.completed.some(item => item.id === 'Konnica'), 'stara oplacona kolejka Konnicy zachowuje prawo do ukonczenia po aktualizacji danych');
  const onlyHut = ids(M.availableProduction(CITY, DATA, ['Brazownictwo', 'Brązownictwo', 'Hutnictwo żelaza'], ctxFor('Grecja')));
  const anyIron = [...onlyHut].filter(id => iron.some(u => u.Jednostka === id));
  assert(anyIron.length === 0, 'po samym Hutnictwie: zero jednostek epoki Zelaza', anyIron.join(','));
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

console.log('\n7. AI: priorytet badan (chooseAIResearch) — Hutnictwo zachowuje dotychczasowa wage, niezalezna od tekstu jednostek');
{
  const hutPrereq = (hutDef => (hutDef['Wymaga (prereq)'] || '').split('+').map(s => s.trim()).filter(Boolean))(techDef('Hutnictwo żelaza'));
  // Porownawczy kontrolny kafelek: Mury+Tartak (mid 30+70, floor 10, tie-break 30-11) = 129; early = 109.
  const control = { Technologia: 'KONTROLA-Mury-Tartak', Epoka: 'Brąz', Poziom: 3, 'Wymaga (prereq)': null,
    'Koszt nauki': 11, 'Odblokowuje budynek': 'Mury; Tartak' };
  const hut = techDef('Hutnictwo żelaza');
  const pickWith = (tech, opts) => M.chooseAIResearch([tech, control], hutPrereq, opts);
  // Dotychczasowa waga Hutnictwa (mid): wojsko 80 + ekspansja 40 + podloga 10 = 130 > 129 -> wybór Hutnictwa.
  assert(pickWith(hut, { myCitiesCount: 3 }) === 'Hutnictwo żelaza', 'mid (3 miasta): AI wybiera Hutnictwo zelaza przed kontrolą 129');
  // Wczesna faza: 40 + 60 + 10 = 110 > 109.
  assert(pickWith(hut, { myCitiesCount: 1 }) === 'Hutnictwo żelaza', 'early (1 miasto): AI wybiera Hutnictwo zelaza przed kontrolą 109');
  // Zagrozenie: 100 + 40 + 10 = 150 > 129.
  assert(pickWith(hut, { myCitiesCount: 3, underThreat: true }) === 'Hutnictwo żelaza', 'pod zagrozeniem: Hutnictwo zelaza wybrane');
  // Niezaleznosc od tekstu: bez listy jednostek w opisie priorytet pozostaje ten sam.
  const hutNoText = { ...hut, 'Odblokowuje budynek': '' };
  assert(pickWith(hutNoText, { myCitiesCount: 3 }) === 'Hutnictwo żelaza', 'Hutnictwo bez tekstu „Odblokowuje” nadal wybierane (waga nie zalezy od opisu)');
  // Sztuka wojenna dostaje wage z wojska/ekspansji dopiero po prereq (nie wybierana bez Hutnictwa i Obrobki).
  const sw = techDef('Sztuka wojenna');
  const swPick = M.chooseAIResearch([sw, control], ['Oblężnictwo', 'Hutnictwo żelaza'], { myCitiesCount: 3 });
  assert(swPick !== 'Sztuka wojenna', 'AI nie wybiera Sztuki wojennej bez Obrobki zelaza (prereq)');
  // Sztuka wojenna z komplet prereq: 80 + 40 + 10 + (30-koszt)>129? Sprawdzamy tylko, ze jest wybierana.
  const swReady = M.chooseAIResearch([sw, control], ['Oblężnictwo', 'Hutnictwo żelaza', 'Obróbka żelaza'], { myCitiesCount: 3 });
  assert(swReady === 'Sztuka wojenna', 'AI wybiera Sztuke wojenna po komplecie prereq (Oblezenictwo+Obrobka+Hutnictwo)', 'got=' + swReady);
}
{
  // Symulacja zachlannego badania AI na prawdziwych danych: bez zawieszenia, Sztuka wojenna dosiegalna.
  const done = new Set();
  const order = [];
  let stalled = false;
  for (let i = 0; i < 200 && !done.has('Sztuka wojenna'); i++) {
    const pick = M.chooseAIResearch(TECHS_DEF, done, { myCitiesCount: 3, techData: TECHS_DEF });
    if (pick === null) { stalled = true; break; }
    order.push(pick); done.add(pick);
  }
  assert(!stalled, 'symulacja badan AI nie zawiesza sie przed Sztuka wojenna', 'steps=' + order.length);
  assert(done.has('Sztuka wojenna'), 'symulacja badan AI dochodzi do Sztuki wojennej', 'steps=' + order.length);
  const iHut = order.indexOf('Hutnictwo żelaza'), iObr = order.indexOf('Obróbka żelaza'), iSW = order.indexOf('Sztuka wojenna');
  assert(iHut >= 0 && iObr >= 0 && iHut < iSW && iObr < iSW, 'w symulacji Hutnictwo i Obrobka zelaza badane przed Sztuka wojenna', `H=${iHut} O=${iObr} SW=${iSW}`);
  console.log('   (kolejnosc AI, pierwsze 40: ' + order.slice(0, 40).join(' -> ') + ')');
}

console.log(`\n[iron-gating-impl-test] ${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
