'use strict';
/**
 * R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2 (Operator R1): trzoda i irygacja na polach obywateli.
 * Produkcyjny `pickAutoImprovements` z danymi jak w main.ts (getWorkedHexKeys = workedHexCoordsForCity + lostToSibling,
 * foodImprovementStages, polityka % per miasto, rezerwa 30, demandDriven, civ/era, rzeczywista mapa generatora z rzekami).
 *
 * (a) pole obywatela PRZY RZECE + duzy budzet -> farma, trzoda (bydlo) i irygacja zbudowane (kazde takie pole).
 * (b) pole obywatela POZA rzeka (Laka/Rownina, farma stoi) -> trzoda zbudowana; irygacja poza rzeka NIE (data/terrain-improvements.json
 *     `irygacja.warunek`: tylko pole sasiadujace z rzeka lub na rzece) — kazde pole z irygacja jest przy rzece.
 * (c) pole BEZ obywatela -> zadnego ulepszenia zywnosciowego (regula „tylko pola obywateli” bez zmian; wyjatek: wycinka rzeczna).
 * (e) wzrost: wieloturowa symulacja z przybywajacymi obywatelami (E1 ma cel co ture) — trzoda/irygacja startuja w turach 1-3/1-6, kolejnosc etapow zachowana
 * (d) jedno miasto z suwakiem 0% (nigdy nie wyda Pracy) NIE moze zatrzymac etapow E3/E4 dla pozostalych miast
 *     (dawna sonda „etap czeka na Prace” ignorowala % miasta -> wieczne wstrzymanie trzody/irygacji w calym imperium).
 *
 * Run z gra/:   node tools/autoimprove-pasture-irrigation-q2-test.cjs
 * Kod sprzed naprawy: PI_SRC_DIR=<kopia gra/src z HEAD~> node tools/autoimprove-pasture-irrigation-q2-test.cjs   (MUSI byc czerwony)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.PI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-q2-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { computeLostToNearerSiblingByCity } from ${JSON.stringify(SRC + '/game/okolica')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { isHexNearRiver } from ${JSON.stringify(SRC + '/map/improvement-build')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, workedHexCoordsForCity, computeLostToNearerSiblingByCity, generateMap, isHexNearRiver } = require(bundle);

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}
const K = (q, r) => `${q},${r}`;
const ERA = 2, PID = 0, POP = 16, NC = 8, TURNS = 40;
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka',
]);
const FOOD_KEYS = new Set(['farma', 'irygacja', 'tarasy', 'bydlo', 'owce', 'lama', 'lodzie_rybackie', 'warzelnia_soli']);
const SEA = ['morze', 'plytkie_morze', 'wybrzeze'];

/** Pelny przeplyw tury gracza jak w main.ts (picker -> zastosowanie picków -> sync `ulepszenia` na heksie). */
function sim({ seed, zeroCityId, turns = TURNS, pool0 = 30000, refill = 60 }) {
  const map = generateMap(48, 36, seed, 'kontynenty');
  const riverSet = new Set();
  for (const p of map.riverPaths || []) for (const h of p) riverSet.add(K(h.q, h.r));
  const cand = Object.keys(map.hexes).sort().filter(k => riverSet.has(k) && !SEA.includes(map.hexes[k].terenBazowy))
    .map(k => k.split(',').map(Number));
  const cities = [];
  for (const [q, r] of cand) {
    if (cities.every(c => Math.abs(c.q - q) + Math.abs(c.r - r) > 9)) {
      cities.push({ id: `c${String(cities.length).padStart(2, '0')}`, ownerId: PID, q, r, name: 'C', population: POP });
    }
    if (cities.length >= NC) break;
  }
  const tn = cities.map(c => ({ q: c.q, r: c.r, ownerId: PID, cityId: c.id, pop: c.population, level: 1 }));
  const placed = new Map();
  let pool = pool0;
  const outOfCitizen = [];
  const workedAt = () => {
    const lost = computeLostToNearerSiblingByCity(cities, map);
    return new Map(cities.map(c => [c.id, new Set([K(c.q, c.r), ...workedHexCoordsForCity(c, map, tn, lost.get(c.id), ERA).map(h => K(h.q, h.r))])]));
  };
  for (let t = 0; t < turns; t++) {
    pool += refill;
    const wbc = workedAt();
    const picks = pickAutoImprovements({
      cities, ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(placed), pracaAvailable: pool, unlockedTechs: TECHS,
      pracaSurplusThreshold: 30, demandDriven: true, resourceDeficitKeys: [], civArchetype: 'grecy', playerEra: ERA, cityLimitExhausted: false,
      getFocus: () => 'zrownowazone', pracaBudgetPercent: 33,
      getPracaBudgetPercent: c => (zeroCityId && c.id === zeroCityId ? 0 : 33),
      getWorkedHexKeys: c => wbc.get(c.id) ?? new Set(),
      foodImprovementStages: () => true, clearingHexKeys: new Set(),
    });
    let spent = 0;
    for (const p of picks) {
      spent += p.kosztPraca;
      const hk = K(p.q, p.r);
      if (FOOD_KEYS.has(p.key) && !wbc.get(p.cityId)?.has(hk)) outOfCitizen.push(`${p.key}@${hk}`);
      if (p.key === 'wyrab') { map.hexes[hk].nakladka = 'brak'; continue; }
      const layers = [...(placed.get(hk) ?? []), p.key];
      placed.set(hk, layers);
      map.hexes[hk].ulepszenia = [...layers];
    }
    pool -= spent;
  }
  // stan koncowy: pola obywateli wg polozenia wzgledem rzeki
  const wbc = workedAt();
  const rows = [];
  for (const c of cities) {
    for (const hk of wbc.get(c.id)) {
      if (hk === K(c.q, c.r)) continue;
      const [q, r] = hk.split(',').map(Number);
      const h = map.hexes[hk];
      if (!h || SEA.includes(h.terenBazowy)) continue;
      rows.push({ cityId: c.id, hk, near: isHexNearRiver(map, q, r), layers: placed.get(hk) ?? [], teren: h.terenBazowy });
    }
  }
  return { rows, placed, outOfCitizen, pool, cities, map };
}

const FLAT = new Set(['laka', 'rownina']);
const SEED = 1;

console.log('(a)+(b)+(c) mapa z rzekami, duzy budzet, 40 tur, 8 miast po 16 obywateli');
const A = sim({ seed: SEED });
const riverFlat = A.rows.filter(x => x.near && FLAT.has(x.teren) && x.layers.includes('farma'));
const offFlat = A.rows.filter(x => !x.near && FLAT.has(x.teren) && x.layers.includes('farma'));
ok(riverFlat.length >= 20, `pola obywateli przy rzece z farma: ${riverFlat.length} (>=20)`);
ok(riverFlat.every(x => x.layers.includes('bydlo')), `(a) KAZDE pole przy rzece z farma ma trzode (${riverFlat.filter(x => x.layers.includes('bydlo')).length}/${riverFlat.length})`);
ok(riverFlat.every(x => x.layers.includes('irygacja')), `(a) KAZDE pole przy rzece z farma ma irygacje (${riverFlat.filter(x => x.layers.includes('irygacja')).length}/${riverFlat.length})`);
ok(offFlat.length >= 1, `pola obywateli POZA rzeka z farma: ${offFlat.length} (>=1)`);
ok(offFlat.every(x => x.layers.includes('bydlo')), `(b) KAZDE pole poza rzeka z farma ma trzode (${offFlat.filter(x => x.layers.includes('bydlo')).length}/${offFlat.length})`);
ok(offFlat.every(x => !x.layers.includes('irygacja')), '(b) poza rzeka irygacji NIE ma (warunek danych: tylko przy rzece)');
const allIrr = [...A.placed.entries()].filter(([, L]) => L.includes('irygacja')).map(([hk]) => hk);
ok(allIrr.length >= 20 && allIrr.every(hk => { const [q, r] = hk.split(',').map(Number); return isHexNearRiver(A.map, q, r); }), `(b) wszystkie ${allIrr.length} irygacji stoja przy rzece`);
ok(A.outOfCitizen.length === 0, `(c) zero ulepszen zywnosciowych poza polami obywateli (${A.outOfCitizen.length}${A.outOfCitizen.length ? ': ' + A.outOfCitizen.slice(0, 3).join(',') : ''})`);

console.log('(d) jedno miasto z suwakiem 0% nie blokuje trzody/irygacji pozostalych miast');
const D = sim({ seed: SEED, zeroCityId: 'c01', turns: 30 });
const othersRiver = D.rows.filter(x => x.cityId !== 'c01' && x.near && FLAT.has(x.teren) && x.layers.includes('farma'));
ok(othersRiver.length >= 10, `pola przy rzece z farma w pozostalych miastach: ${othersRiver.length} (>=10)`);
ok(othersRiver.every(x => x.layers.includes('bydlo') && x.layers.includes('irygacja')),
  `(d) pozostale miasta: trzoda+irygacja na kazdym polu przy rzece (${othersRiver.filter(x => x.layers.includes('bydlo') && x.layers.includes('irygacja')).length}/${othersRiver.length}), pula ${Math.round(D.pool)}`);
ok(D.rows.filter(x => x.cityId === 'c01').every(x => x.layers.length === 0), '(d) miasto 0% nic nie buduje (suwak respektowany)');

console.log('(e) ROZWIJAJACA SIE cywilizacja (obywatele przybywaja co 2 tury => cel E1 co ture): trzoda i irygacja NIE sa glodzone');
// Commit-sprawca cf236dafc: petla etapow konczyla sie na pierwszym etapie z pickami; przy ciaglym wzroscie E1 mial cel co ture, wiec E3/E4
// startowaly dopiero po ustaniu wzrostu. Harness: tools/autoimprove-pasture-irrigation-q2-bisect.cjs (produkcyjny picker + workedHexCoordsForCity).
{
  const { execFileSync } = require('node:child_process');
  const runBisect = (extraEnv) => {
    const out = execFileSync(process.execPath, [path.join(__dirname, 'autoimprove-pasture-irrigation-q2-bisect.cjs')], {
      env: { ...process.env, PI_SRC_DIR: SRC, ...extraEnv }, encoding: 'utf8', maxBuffer: 1 << 26,
    });
    return JSON.parse(out.trim().split('\n').filter(l => l.startsWith('{')).pop());
  };
  const g = runBisect({});
  ok(g.starved === 0, `(e) faza wzrostu (24 tury): 0 tur z glodzona trzoda/irygacja przy duzej puli (starved=${g.starved})`);
  ok(g.firstPast != null && g.firstPast <= 3, `(e) pierwsza trzoda w turze ${g.firstPast} (<=3), nie po ustaniu wzrostu`);
  ok(g.firstIrr != null && g.firstIrr <= 6, `(e) pierwsza irygacja w turze ${g.firstIrr} (<=6)`);
  ok(g.gapGrow.farmNoPast === 0, `(e) w turze 24 (wzrost trwa) kazda farma na polu obywatela ma trzode (brak: ${g.gapGrow.farmNoPast})`);
  ok(g.orderViol === 0, `(e) kolejnosc wycinka -> farmy -> trzoda -> irygacja: trzoda/irygacja dopiero gdy wyzszy etap wyczerpany (naruszen: ${g.orderViol})`);
  const z = runBisect({ ZERO_CITY: 'c01', LOW_PCT: '0' });
  ok(z.starved === 0 && z.orderViol === 0, `(e) j.w. przy jednym miescie z 0% (starved=${z.starved}, naruszen kolejnosci=${z.orderViol})`);
}

fs.rmSync(temp, { recursive: true, force: true });
console.log(`\nWYNIK: ${passed} OK / ${failed} FAIL`);
process.exit(failed ? 1 : 0);
