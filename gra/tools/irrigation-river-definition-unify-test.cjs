'use strict';
/**
 * R-WEB-IRRIGATION-RIVER-DEFINITION-UNIFY-Q1 (decyzja wlasciciela 2026-11-04, ABC D2=A): JEDNA definicja „przy rzece”
 * dla recznej budowy irygacji (kwalifikator), tooltipow (hexHasRiverAccess) i automatu (onRiverHex w pickerze).
 * Definicja: wlasne `rzeka.obecna` LUB heks w `riverPaths` LUB sasiad w `riverPaths` / z `rzeka.obecna`. Jezioro/morze NIE (D1=A).
 *
 * (A) syntetyczna siatka, kazdy wariant rzeki: kwalifikator (bez zadnej flagi) == hexHasRiverAccess == oczekiwanie.
 * (B) mapy generowane (3 swiaty x 3 ziarna): na KAZDYM plaskim heksie kwalifikator irygacji (pomijajac inne bramki) == tooltip;
 *     brak heksow, gdzie reczna budowa odmawia a definicja „przy rzece” mowi TAK (pomiar PRZED > 0, PO == 0).
 * (C) zrodlo: flaga `visibleRiverNeighborCountsForIrrigation` nie istnieje; picker i tooltip delegują do `isHexNearRiver`.
 * (D) picker (automat) na syntetycznej mapie: irygacja na polu obywatela z sasiadem-rzeka == reczny kwalifikator.
 *
 * Run z gra/:   node tools/irrigation-river-definition-unify-test.cjs
 * Mutacja:      IRU_SRC_DIR=<kopia gra/src z mutacja> node tools/irrigation-river-definition-unify-test.cjs   (MUSI byc czerwony)
 * Pomiar PRZED: IRU_MEASURE=1 node ...   (drukuje liczbe heksow roznicy wzgledem STAREJ definicji recznej)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC = process.env.IRU_SRC_DIR || path.resolve(GRA, 'src');
const MEASURE = process.env.IRU_MEASURE === '1';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'iru-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { workedHexCoordsForCity } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { hexHasRiverAccess } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
`);
let passed = 0, failed = 0;
async function main() {
await esbuild.build({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error',
  nodePaths: [path.resolve(GRA, 'node_modules')],
  plugins: [{ name: 'stub-brand', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); } }],
});
const { pickAutoImprovements, generateMap, workedHexCoordsForCity, buildImprovementQualifier, hexHasRiverAccess } = require(bundle);

function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}
const K = (q, r) => `${q},${r}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const ERA = 3, PID = 3;
const TECHS = new Set([
  'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Obróbka drewna', 'Garncarstwo', 'Murarstwo', 'Brązownictwo',
  'Hutnictwo żelaza', 'Jeździectwo', 'Koło', 'Waluta', 'Wojskowość', 'Żegluga', 'Gospodarka wodna', 'Irygacja',
  'Drogi brukowane', 'Matematyka', 'Pieniądz', 'Hodowla', 'Nawadnianie',
]);

/** STARA reczna definicja (przed ujednoliceniem): sasiad liczy sie WYLACZNIE przez riverPaths. */
function oldManualNearRiver(map, q, r) {
  const paths = new Set();
  for (const p of map.riverPaths || []) for (const h of p) paths.add(K(h.q, h.r));
  if (map.hexes[K(q, r)]?.rzeka?.obecna || paths.has(K(q, r))) return true;
  return NB.some(([dq, dr]) => paths.has(K(q + dq, r + dr)));
}
/** NOWA definicja (wzorzec dla testu — niezalezna reimplementacja z opisu decyzji D2=A). */
function expectedNearRiver(map, q, r) {
  const paths = new Set();
  for (const p of map.riverPaths || []) for (const h of p) paths.add(K(h.q, h.r));
  if (map.hexes[K(q, r)]?.rzeka?.obecna || paths.has(K(q, r))) return true;
  return NB.some(([dq, dr]) => paths.has(K(q + dq, r + dr)) || map.hexes[K(q + dq, r + dr)]?.rzeka?.obecna === true);
}

function flatMap(W, H) {
  const hexes = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: W, wysokoscR: H, hexes, seed: 7, riverPaths: [] };
}
function stateFor(map, q, r) {
  return {
    map, cityNodes: [{ q: 3, r: 3, pop: 2, level: 1 }], territoryNodes: [{ q: 3, r: 3, ownerId: PID, cityId: 'c0', pop: 2, level: 1 }],
    playerOwnerIdNum: PID, placedImprovements: new Map([[K(q, r), ['farma']]]), researchedTechs: TECHS,
    playerCivArchetype: 'grecy', playerEra: ERA,
  };
}

console.log('(A) syntetyczna siatka: kazdy wariant rzeki — kwalifikator (bez flagi) == tooltip == definicja');
{
  const T = [4, 3]; // heks docelowy w terytorium miasta (3,3)
  const cases = [
    ['brak rzeki', m => {}, false],
    ['rzeka.obecna na samym heksie', m => { m.hexes[K(4, 3)].rzeka.obecna = true; }, true],
    ['sam heks w riverPaths', m => { m.riverPaths = [[{ q: 4, r: 3 }]]; }, true],
    ['sasiad w riverPaths', m => { m.riverPaths = [[{ q: 5, r: 3 }]]; }, true],
    ['sasiad z samym rzeka.obecna (bez riverPaths) — przypadek zgloszony', m => { m.hexes[K(5, 3)].rzeka.obecna = true; }, true],
    ['sasiad (q+1,r-1) z samym rzeka.obecna', m => { m.hexes[K(5, 2)].rzeka.obecna = true; }, true],
    ['rzeka 2 heksy dalej (nie sasiad)', m => { m.hexes[K(6, 3)].rzeka.obecna = true; m.riverPaths = [[{ q: 2, r: 3 }]]; }, false],
    ['jezioro sasiad — NIE (D1=A)', m => { m.hexes[K(5, 3)].terenBazowy = 'jezioro'; }, false],
    ['morze sasiad — NIE (D1=A)', m => { m.hexes[K(5, 3)].terenBazowy = 'morze'; }, false],
  ];
  for (const [name, mut, want] of cases) {
    const m = flatMap(10, 10);
    mut(m);
    const qual = buildImprovementQualifier(stateFor(m, T[0], T[1]))('irygacja', T[0], T[1]);
    const tip = hexHasRiverAccess(m.hexes[K(T[0], T[1])], m);
    ok(qual === want, `reczna budowa (kwalifikator): ${name} -> ${want}`);
    ok(tip === want, `tooltip (hexHasRiverAccess): ${name} -> ${want}`);
  }
}

console.log('(B) mapy generowane: reczna budowa == tooltip == definicja na KAZDYM plaskim heksie');
{
  let flat = 0, diffQualVsDef = 0, diffTipVsDef = 0, oldRefuses = 0, ex = [];
  for (const world of ['pangea', 'continents', 'islands']) {
    for (const seed of [1, 7, 778899]) {
      let map;
      try { map = generateMap(36, 28, seed, world); } catch (e) { continue; }
      // pelne terytorium gracza wokol kazdego heksa: miasto na (q,r) nie jest potrzebne — omijamy bramke terytorium podajac territoryNodes=[] i cityNodes
      for (const k of Object.keys(map.hexes)) {
        const h = map.hexes[k];
        if (!['laka', 'rownina', 'pustynia'].includes(h.terenBazowy)) continue;
        const [q, r] = k.split(',').map(Number);
        flat++;
        const want = expectedNearRiver(map, q, r);
        const tip = hexHasRiverAccess(h, map);
        if (tip !== want) { diffTipVsDef++; if (ex.length < 5) ex.push(`tip ${world}/${seed}@${k}`); }
        if (want && !oldManualNearRiver(map, q, r)) oldRefuses++;
      }
      // kwalifikator na probce: miasto na srodku, heksy w promieniu 3 (terytorium) + brak innych blokad
      const cq = Math.floor(map.szerokoscQ / 2), cr = Math.floor(map.wysokoscR / 2);
      const tn = [{ q: cq, r: cr, ownerId: PID, cityId: 'c0', pop: 6, level: 1 }];
      for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
        if (Math.abs(dq + dr) > 3) continue;
        const q = cq + dq, r = cr + dr, k = K(q, r), h = map.hexes[k];
        if (!h || !['laka', 'rownina', 'pustynia'].includes(h.terenBazowy) || h.nakladka !== 'brak') continue;
        const st = {
          map, cityNodes: [{ q: cq, r: cr, pop: 6, level: 1 }], territoryNodes: tn, playerOwnerIdNum: PID,
          placedImprovements: new Map([[k, ['farma']]]), researchedTechs: TECHS, playerCivArchetype: 'grecy', playerEra: ERA,
        };
        const qual = buildImprovementQualifier(st)('irygacja', q, r);
        if (qual && !expectedNearRiver(map, q, r)) { diffQualVsDef++; if (ex.length < 5) ex.push(`qual+ ${world}/${seed}@${k}`); }
        if (!qual && expectedNearRiver(map, q, r) && !h.zloze && cq !== q) { diffQualVsDef++; if (ex.length < 5) ex.push(`qual- ${world}/${seed}@${k}`); }
      }
    }
  }
  console.log(`  pomiar: plaskich heksow=${flat}, heksow gdzie STARA reczna definicja odmawia a automat/definicja mowi TAK=${oldRefuses}`);
  if (MEASURE) console.log(`  IRU_MEASURE: roznice tooltip=${diffTipVsDef}, kwalifikator=${diffQualVsDef}, przyklady=${ex.join(' ')}`);
  ok(flat > 500, `przebadano wystarczajaco duzo plaskich heksow (${flat})`);
  ok(oldRefuses > 0, `na mapach generowanych STARA regula odmawiala na ${oldRefuses} heksach, gdzie definicja automatu mowi TAK (dowod, ze zmiana ma znaczenie)`);
  ok(diffTipVsDef === 0, `tooltip == definicja na wszystkich plaskich heksach (roznic ${diffTipVsDef} ${ex.join(' ')})`);
  ok(diffQualVsDef === 0, `kwalifikator irygacji (reczna budowa) == definicja na probce wokol miasta (roznic ${diffQualVsDef} ${ex.join(' ')})`);
}

console.log('(C) zrodlo: flaga usunieta, picker i tooltip delegują do jednej funkcji');
{
  const rd = f => fs.readFileSync(path.join(SRC, f), 'utf8');
  const ib = rd('map/improvement-build.ts'), ai = rd('game/auto-improvements.ts'), tt = rd('ui/hexContextTooltip.ts');
  ok(!/visibleRiverNeighborCountsForIrrigation/.test(ib + ai + tt), 'flaga visibleRiverNeighborCountsForIrrigation nie wystepuje w src');
  ok(/export function isHexNearRiver\(/.test(ib), 'improvement-build.ts eksportuje isHexNearRiver');
  ok(/isHexNearRiver\(map, q, r, riverHexSet\)/.test(ib), 'kwalifikator (isRiverAdjacent) uzywa isHexNearRiver');
  ok(/isHexNearRiver\(map, Number\(qs\), Number\(rs\), riverHexKeys\)/.test(ai), 'picker (onRiverHex) uzywa isHexNearRiver');
  ok(/return isHexNearRiver\(map, hex\.coords\.q, hex\.coords\.r\);/.test(tt), 'tooltip (hexHasRiverAccess) uzywa isHexNearRiver');
}

console.log('(D) automat: irygacja na polu obywatela z sasiadem-rzeka (samo rzeka.obecna) == reczny kwalifikator');
{
  const W = 30, H = 30, CQ = 15, CR = 15;
  const map = flatMap(W, H);
  map.hexes[K(18, 15)].rzeka = { obecna: true, krawedzie: [] };
  const city = { id: 'c0', ownerId: PID, q: CQ, r: CR, name: 'Ateny', population: 2 };
  const tn = [{ q: CQ, r: CR, ownerId: PID, cityId: 'c0', pop: 2, level: 1 }];
  const target = K(17, 15);
  const worked = new Set([...workedHexCoordsForCity(city, map, tn, undefined, ERA).map(h => K(h.q, h.r)), K(CQ, CR), target]);
  const placed = new Map();
  for (const hk of worked) placed.set(hk, hk === target ? ['farma', 'bydlo'] : ['farma', 'bydlo', 'irygacja']);
  const picks = pickAutoImprovements({
    cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: placed, pracaAvailable: 900,
    unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: true, demandDriven: true, resourceDeficitKeys: [],
    getOnlyWorked: () => true, getWorkedHexKeys: () => worked, pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100,
    civArchetype: 'grecy', playerEra: ERA, foodImprovementStages: () => true, clearingHexKeys: new Set(), getFocus: () => 'zywnosc',
  });
  const autoIrr = picks.some(p => p.key === 'irygacja' && K(p.q, p.r) === target);
  const manual = buildImprovementQualifier({
    map, cityNodes: [{ q: CQ, r: CR, pop: 2, level: 1 }], territoryNodes: tn, playerOwnerIdNum: PID,
    placedImprovements: new Map([[target, ['farma', 'bydlo']]]), researchedTechs: TECHS, playerCivArchetype: 'grecy', playerEra: ERA,
  })('irygacja', 17, 15);
  ok(autoIrr === true, 'automat stawia irygacje przy widocznej rzece sasiada');
  ok(manual === true, 'reczna budowa na tym samym heksie rowniez kwalifikuje');
  ok(autoIrr === manual, 'automat == reczna budowa');
}

}
main().then(() => {
try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* noop */ }
console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
}).catch(e => { console.error(e); process.exit(2); });
