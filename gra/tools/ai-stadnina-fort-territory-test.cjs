'use strict';
/**
 * R-WEB-AI-STADNINA-FORT-TERRITORY-SCAN-Q1: skan kandydatow automatu/AI (pickAutoImprovements, auto-improvements.ts)
 * obejmowal tylko pierscien MIASTA (+1); budowa gracza (improvement-build.ts) uznaje tez terytorium fortow/posterunkow.
 * Zloze konia (nakladka `zloze_konia` ORAZ stare zapisy `zloze==='konie'`) w kole fortu poza pierscieniem miasta
 * bylo dla AI niewidoczne. Prawdziwe funkcje. Mutacja: ASF_SRC_DIR=<kopia gra/src> (MUSI byc czerwony).
 * Run z gra/:  node tools/ai-stadnina-fort-territory-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.ASF_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'asf-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { createImprovementBuildApi } from ${JSON.stringify(SRC + '/map/improvement-build')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, decideAITurn, createImprovementBuildApi } = require(bundle);
process.on('exit', () => { try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* */ } });

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } };
const K = (q, r) => `${q},${r}`;
const PID = 0;
const TECHS = new Set(['Jeździectwo', 'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Murarstwo', 'Wojskowość']);

function mkMap(horses) {
  const hexes = {};
  for (let q = -8; q <= 24; q++) for (let r = -10; r <= 10; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  for (const h of horses) {
    if (h.stare) hexes[K(h.q, h.r)].zloze = 'konie'; else hexes[K(h.q, h.r)].nakladka = 'zloze_konia';
  }
  return { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
}
const city = { id: 'c0', ownerId: PID, q: 0, r: 0, name: 'A', population: 1 };
function nodes(kind) {
  return [
    { q: 0, r: 0, ownerId: PID, cityId: 'c0', pop: 1, level: 1 },
    { q: 10, r: 0, pop: 0, level: 1, ownerId: PID, ...(kind === 'fort' ? { isFort: true } : { isOutpost: true }) },
  ];
}
function scenario(kind, horses) {
  const map = mkMap(horses), tn = nodes(kind);
  const st = {
    map, cityNodes: [{ q: 0, r: 0, pop: 1, level: 1 }], territoryNodes: tn, playerOwnerIdNum: PID,
    playerCivArchetype: 'rzymianie', playerEra: 3, researchedTechs: TECHS, horseStockAvailable: 0, tradeRouteKonUnlocked: false,
  };
  const legal = createImprovementBuildApi(st).getQualifyingHexes('stadnina').map(h => K(h.q, h.r)).sort();
  const picks = pickAutoImprovements({
    cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(), pracaAvailable: 900,
    unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: ['kon'],
    getOnlyWorked: () => true, getWorkedHexKeys: () => new Set([K(0, 0)]),
    pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: 3,
    foodImprovementStages: true,
  });
  const ai = picks.filter(p => p.key === 'stadnina').map(p => K(p.q, p.r)).sort();
  const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
  const cmds = decideAITurn(PID, [], [city], map, data, {
    civType: 'rzymianie', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
    placedImprovements: new Map(), improvementTechs: TECHS, pracaAvailable: 900, civEra: 3, resourceDeficitKeys: ['kon'],
  });
  const aiTurn = cmds.filter(c => c.type === 'buildImprovement' && c.key === 'stadnina').map(c => K(c.q, c.r)).sort();
  return { legal, ai, aiTurn, picks };
}

const H = [{ q: 2, r: 0 }, { q: 10, r: 1 }, { q: 11, r: -1, stare: true }, { q: 20, r: 0 }];
for (const kind of ['fort', 'posterunek']) {
  console.log(`(${kind}) zloza: miasto (2,0), w kole (10,1) + stare zapisy (11,-1), poza terytorium (20,0)`);
  const s = scenario(kind, H);
  console.log(`   legalne dla gracza: ${s.legal.join(' ')} | pickAutoImprovements: ${s.ai.join(' ') || '-'} | decideAITurn: ${s.aiTurn.join(' ') || '-'}`);
  ok(s.legal.includes('10,1') && s.legal.includes('11,-1'), `${kind}: gracz moze budowac w kole (10,1) i (11,-1)`);
  ok(!s.legal.includes('20,0') && !s.ai.includes('20,0'), `${kind}: poza terytorium nikt nie buduje`);
  const o = scenario(kind, [{ q: 10, r: 1 }, { q: 11, r: -1, stare: true }]);
  console.log(`   tylko kolo: legalne ${o.legal.length}, picker ${o.ai.length}, decideAITurn ${o.aiTurn.length}`);
  ok(o.legal.length === 2, `${kind}: tylko kolo — gracz legalnie 2`);
  ok(o.ai.length >= 1, `${kind}: tylko kolo — pickAutoImprovements widzi >=1 (${o.ai.join(' ')})`);
  ok(o.aiTurn.length >= 1, `${kind}: tylko kolo — decideAITurn >=1 (${o.aiTurn.join(' ')})`);
}
console.log('(kontrola) w kole fortu poza miastem nie powstaje nic poza stadnina (bez zmiany balansu)');
{
  const s = scenario('fort', [{ q: 10, r: 1 }]);
  const far = s.picks.filter(p => p.key !== 'stadnina' && p.q >= 7);
  ok(far.length === 0, `brak innych pickow w kole fortu (jest ${far.length}: ${far.map(p => p.key + '@' + K(p.q, p.r)).join(' ')})`);
}

// R-WEB-AI-STADNINA-FORT-TERRITORY-SCAN-Q1 (obrona r1): spor terytorialny z WROGIM MIASTEM i rownosc zbiorow gracz vs AI.
console.log('(spor) wrogie miasto zajmuje czesc kola fortu — zbior AI musi byc rowny zbiorowi legalnych heksow gracza');
{
  const mkEnemy = (ex, ey, extraPop) => {
    const map = mkMap([{ q: 8, r: 0 }, { q: 12, r: 0 }, { q: 10, r: 3 }, { q: 10, r: -3 }]);
    const tn = nodes('fort').concat([{ q: ex, r: ey, ownerId: 1, cityId: 'e0', pop: extraPop, level: 1 }]);
    const st = { map, cityNodes: [{ q: 0, r: 0, pop: 1, level: 1 }], territoryNodes: tn, playerOwnerIdNum: PID,
      playerCivArchetype: 'rzymianie', playerEra: 3, researchedTechs: TECHS, horseStockAvailable: 0, tradeRouteKonUnlocked: false };
    const legal = createImprovementBuildApi(st).getQualifyingHexes('stadnina').map(h => K(h.q, h.r)).sort();
    const picks = pickAutoImprovements({
      cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: new Map(), pracaAvailable: 900,
      unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: ['kon'],
      getOnlyWorked: () => true, getWorkedHexKeys: () => new Set([K(0, 0)]), pracaBudgetPercent: 100,
      getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: 3, foodImprovementStages: true,
    });
    const ai = picks.filter(p => p.key === 'stadnina').map(p => K(p.q, p.r)).sort();
    return { legal, ai };
  };
  for (const [ex, ey, pop] of [[14, 0, 8], [10, 6, 8], [12, 2, 3]]) {
    const r = mkEnemy(ex, ey, pop);
    console.log(`   wrog (${ex},${ey}) pop ${pop}: gracz legalne [${r.legal.join(' ')}] | AI [${r.ai.join(' ')}]`);
    const illegalAi = r.ai.filter(k => !r.legal.includes(k));
    ok(illegalAi.length === 0, `wrog (${ex},${ey}): AI nie bierze heksow nielegalnych dla gracza (${illegalAi.join(' ') || 'brak'})`);
    const missed = r.legal.filter(k => !r.ai.includes(k) && k !== '8,0');
    ok(missed.length === 0, `wrog (${ex},${ey}): AI widzi wszystkie legalne heksy kola fortu (pominiete: ${missed.join(' ') || 'brak'})`);
  }
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
