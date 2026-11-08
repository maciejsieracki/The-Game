'use strict';
/**
 * R-WEB-AI-STADNINA-FORT-TERRITORY-SCAN-Q1 (obrona): pomiar na REALNYCH mapach (generateMap, 3 ziarna) zamiast pelnej gry
 * w przegladarce (~50 min/bieg). Dla kazdego zloza konia: wlasny fort w odleglosci 1, miasto w odleglosci 8 (zloze poza
 * pierscieniem miasta, w kole fortu). Liczy: legalne dla gracza vs pickAutoImprovements (stadnina). Run z gra/:
 *   node tools/ai-stadnina-fort-realmap-sim.cjs [--seeds 1,2,3]
 */
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.join(ROOT, 'node_modules', 'esbuild'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'asfr-'));
const entry = path.join(temp, 'e.ts'), bundle = path.join(temp, 'b.cjs');
const S = f => JSON.stringify(path.join(ROOT, 'src', f));
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${S('game/auto-improvements')};
export { createImprovementBuildApi } from ${S('map/improvement-build')};
export { hexHasHorseDeposit } from ${S('game/terrain-improvements')};
export { generateMap } from ${S('map/generator')};
export { setRiverGenPhaseOverride } from ${S('map/riverGenSwitch')};
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: ROOT, logLevel: 'error', nodePaths: [path.join(ROOT, 'node_modules')] });
const M = require(bundle);
process.on('exit', () => { try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* */ } });
M.setRiverGenPhaseOverride('main');
const ai = process.argv.indexOf('--seeds');
const seeds = (ai >= 0 ? process.argv[ai + 1] : '1,2,3').split(',').map(Number);
const TECHS = new Set(['Jeździectwo', 'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Murarstwo', 'Wojskowość']);
const K = (q, r) => `${q},${r}`;
let totLegal = 0, totAi = 0, totDep = 0, extra = 0;
for (const seed of seeds) {
  const map = M.generateMap(100, 70, seed, 'kontynenty');
  const deps = Object.values(map.hexes).filter(h => M.hexHasHorseDeposit(h));
  let legalN = 0, aiN = 0, tried = 0, aiIllegal = 0;
  for (const dh of deps.slice(0, 40)) {
    const { q, r } = dh.coords;
    const cq = q + 8, cr = r;
    if (!map.hexes[K(cq, cr)]) continue;
    tried++;
    const city = { id: 'c0', ownerId: 0, q: cq, r: cr, name: 'A', population: 1 };
    const tn = [{ q: cq, r: cr, ownerId: 0, cityId: 'c0', pop: 1, level: 1 }, { q: q + 1, r, pop: 0, level: 1, ownerId: 0, isFort: true }];
    const st = { map, cityNodes: [{ q: cq, r: cr, pop: 1, level: 1 }], territoryNodes: tn, playerOwnerIdNum: 0,
      playerCivArchetype: 'rzymianie', playerEra: 3, researchedTechs: TECHS, horseStockAvailable: 0, tradeRouteKonUnlocked: false };
    const legal = new Set(M.createImprovementBuildApi(st).getQualifyingHexes('stadnina').map(h => K(h.q, h.r)));
    const picks = M.pickAutoImprovements({
      cities: [city], ownerId: 0, map, territoryNodes: tn, placedImprovements: new Map(), pracaAvailable: 900,
      unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: ['kon'],
      getOnlyWorked: () => true, getWorkedHexKeys: () => new Set([K(cq, cr)]), pracaBudgetPercent: 100,
      getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: 3, foodImprovementStages: true,
    }).filter(p => p.key === 'stadnina').map(p => K(p.q, p.r));
    legalN += legal.size; aiN += picks.length; aiIllegal += picks.filter(k => !legal.has(k)).length;
  }
  console.log(`seed ${seed}: zlozy konia ${deps.length}, scenariuszy ${tried}, legalne dla gracza ${legalN}, picker AI ${aiN}, AI-nielegalne ${aiIllegal}`);
  totLegal += legalN; totAi += aiN; totDep += tried; extra += aiIllegal;
}
console.log(`SUMA: scenariuszy ${totDep}, gracz ${totLegal}, AI ${totAi}, AI-nielegalne ${extra}`);
