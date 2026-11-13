'use strict';
/**
 * fort-outpost-placement-rules-test.cjs
 * R-WEB-FORT-OUTPOST-PLACEMENT-RULES-Q1 (wlasciciel 2026-11-03):
 *   POSTERUNEK -- tylko wlasne terytorium + przyleganie do granicy (>=1 sasiad spoza wlasnego terenu).
 *   FORT       -- gdziekolwiek (takze inna wyspa/kontynent), zachowane reguly techniczne:
 *                 ladowy teren, brak cudzego terytorium, poza wlasnym terenem wymagana wlasna jednostka.
 * Prawdziwe funkcje: isOutpostPlacementAllowed (wspolny predykat), buildImprovementQualifier (panel gracza
 * i automat), planExpansionFortBuilding (AI), straznik tekstowy main.ts.
 * Zmienna PLACEMENT_SRC (opcjonalna) -- inny katalog src (pomiar PRZED / mutacje).
 * Run from gra/:  node tools/fort-outpost-placement-rules-test.cjs
 */
const fs = require('fs');
const path = require('path');
let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

const GRA = path.resolve(__dirname, '..');
const SRC = process.env.PLACEMENT_SRC ? path.resolve(process.env.PLACEMENT_SRC) : path.resolve(GRA, 'src');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const os = require('os');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fort-outpost-placement-'));
const ENTRY = path.join(tmp, 'entry.ts');
const BUNDLE = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(ENTRY, `
export * as FT from ${JSON.stringify(SRC + '/game/fort-territory')};
export { territoryOwnerAt, cityTerritoryRadius } from ${JSON.stringify(SRC + '/map/territory')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { planExpansionFortBuilding } from ${JSON.stringify(SRC + '/game/ai')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent' });
} catch (e) { console.error('bundle failed', e.message || e); process.exit(1); }
const M = require(BUNDLE);
const { FT, territoryOwnerAt, cityTerritoryRadius, buildImprovementQualifier, planExpansionFortBuilding, TerenBazowy, Nakladka } = M;
const isOutpostOk = FT.isOutpostPlacementAllowed || (() => false); // brak funkcji (stan PRZED) -> RED

function mkHex(q, r, teren) {
  return { coords: { q, r }, terenBazowy: teren || TerenBazowy.Rownina, nakladka: Nakladka.Brak,
    rzeka: { obecna: false, krawedzie: [] }, ulepszenie: 'brak', wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null };
}
// Kontynent glowny (q w [-12,12]) + osobna wyspa (centrum 30,0) rozdzielona morzem.
function mkMap() {
  const hexes = {};
  for (let q = -12; q <= 40; q++) for (let r = -12; r <= 12; r++) {
    const land = q <= 12 || (q >= 26 && q <= 34);
    hexes[`${q},${r}`] = mkHex(q, r, land ? TerenBazowy.Rownina : TerenBazowy.Morze);
  }
  return { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
}
const map = mkMap();
const city = { q: 0, r: 0, pop: 1, level: 1 };
const R = cityTerritoryRadius(city);
const mine = { ...city, ownerId: 0 };
const rival = { q: 20, r: 0, pop: 1, level: 1, ownerId: 1 };
const RR = cityTerritoryRadius(rival);
const nodes = [mine, rival];
const mkQ = (units) => buildImprovementQualifier({
  map, cityNodes: [city], territoryNodes: nodes, playerOwnerIdNum: 0,
  researchedTechs: new Set(['Wojskowość', 'Obróbka drewna', 'Murarstwo']), ownUnitHexKeys: new Set(units || []),
});

console.log(`\n--- A: predykat isOutpostPlacementAllowed (promien miasta ${R}) ---`);
assert(typeof FT.isOutpostPlacementAllowed === 'function', 'A0: wspolny predykat istnieje i jest wyeksportowany');
assert(isOutpostOk(R, 0, 0, nodes), 'A1: wlasny heks przy krawedzi (dist=R) OK');
assert(isOutpostOk(0, R, 0, nodes), 'A2: wlasny heks przy krawedzi (inny kierunek) OK');
assert(!isOutpostOk(0, 0, 0, nodes), 'A3: srodek (miasto) -- w glebi -- NIE');
assert(!isOutpostOk(R - 1, 0, 0, nodes), 'A4: heks 1 w glab od krawedzi -- NIE');
assert(!isOutpostOk(1, 0, 0, nodes), 'A5: w glebi terytorium -- NIE');
assert(!isOutpostOk(R + 1, 0, 0, nodes), 'A6: tuz poza terytorium (przylega, ale nie wlasny) -- NIE');
assert(!isOutpostOk(R + 6, 0, 0, nodes), 'A7: daleko poza terytorium -- NIE');
assert(!isOutpostOk(20 - RR, 0, 0, nodes), 'A8: przy cudzej granicy, poza wlasnym terenem -- NIE');
assert(!isOutpostOk(30, 0, 0, nodes), 'A9: inna wyspa -- NIE');
assert(!isOutpostOk(R, 0, 0, []), 'A10: brak wezlow -> NIE');
assert(territoryOwnerAt(R, 0, nodes) === 0 && territoryOwnerAt(R + 1, 0, nodes) !== 0, 'A11: sanity -- granica miasta faktycznie na dist=R');

console.log('\n--- B: panel gracza / automat (buildImprovementQualifier) ---');
{
  const q = mkQ([]);
  assert(q('posterunek', R, 0), 'B1: posterunek przy krawedzi wlasnego terenu OK (bez jednostki)');
  assert(!q('posterunek', 1, 0), 'B2: posterunek w glebi terenu NIE');
  assert(!q('posterunek', 0, 0), 'B2b: posterunek na miescie NIE');
  const qu = mkQ([`${R + 3},0`, `${R + 1},0`, '30,0', `${20 - RR},0`]);
  assert(!qu('posterunek', R + 3, 0), 'B3: posterunek poza terytorium NIE nawet z wlasna jednostka (nadpisuje krok 2)');
  assert(!qu('posterunek', R + 1, 0), 'B3b: posterunek tuz za granica NIE nawet z jednostka');
  assert(!qu('posterunek', 30, 0), 'B4: posterunek na innej wyspie NIE');
  assert(!qu('posterunek', 20 - RR, 0), 'B5: posterunek przy cudzej granicy poza wlasnym terenem NIE');
  // fort
  assert(qu('fort', 30, 0), 'B6: FORT na innej wyspie (z wlasna jednostka) OK');
  assert(qu('fort', R + 3, 0), 'B7: FORT poza terytorium, nieprzylegle (z jednostka) OK');
  assert(q('fort', 1, 0), 'B8: fort we wlasnym terenie (bez jednostki) nadal OK');
  assert(!q('fort', 31, 0), 'B9: fort poza terenem BEZ wlasnej jednostki -- istniejaca regula zachowana');
  assert(!mkQ([`${20},1`])('fort', 20, 1), 'B10: fort w cudzym terytorium NIE (istniejaca regula)');
  assert(!mkQ(['20,10'])('fort', 20, 10), 'B11: fort na morzu NIE (teren dostepny dla budowy)');
  assert(mkQ(['28,3'])('fort', 28, 3), 'B12: fort na lad. innej wyspy (inny heks) OK');
}

console.log('\n--- C: AI -- planExpansionFortBuilding (jednostka poza zasiegiem) ---');
{
  const aiMap = map;
  const aiCity = { id: 'c0', ownerId: 0, q: 0, r: 0, population: 3 };
  const base = { improvementTechs: new Set(['Wojskowość', 'Obróbka drewna', 'Murarstwo']), placedImprovements: new Map(),
    fortNodes: [], pracaAvailable: 1000, territoryNodes: nodes, currentTurn: 10 };
  const unitFar = { id: 'u1', ownerId: 0, q: 30, r: 0, inGarnizon: false };
  const cmd = planExpansionFortBuilding(0, [aiCity], [unitFar], aiMap, base);
  assert(cmd && cmd.key === 'fort' && cmd.q === 30, 'C1: AI z jednostka na innej wyspie stawia FORT (cel zamorski)');
  assert(!cmd || cmd.key !== 'posterunek', 'C2: AI nigdy nie stawia posterunku poza granica wlasnego terenu');
  const noFortTech = { ...base, improvementTechs: new Set(['Obróbka drewna', 'Murarstwo']) };
  const cmd2 = planExpansionFortBuilding(0, [aiCity], [unitFar], aiMap, noFortTech);
  assert(!cmd2 || cmd2.key !== 'posterunek', 'C3: bez techu fortu AI nie stawia posterunku poza terenem');
  const unitIn = { id: 'u2', ownerId: 0, q: R, r: 0, inGarnizon: false };
  const cmd3 = planExpansionFortBuilding(0, [aiCity], [unitIn], aiMap, base);
  assert(!cmd3 || cmd3.key !== 'posterunek' || FT.isOutpostPlacementAllowed(cmd3.q, cmd3.r, 0, nodes), 'C4: wszelki posterunek AI spelnia predykat');
}

{
  // Obrona r1 (zarzut 2): bez techu fortu AI ekspanduje POSTERUNKIEM, ale tylko z heksu wlasnej granicy.
  const aiCity = { id: 'c0', ownerId: 0, q: 0, r: 0, population: 3 };
  const noFort = { improvementTechs: new Set(['Obróbka drewna', 'Murarstwo']), placedImprovements: new Map(),
    fortNodes: [], pracaAvailable: 1000, territoryNodes: nodes, currentTurn: 10 };
  const uBorder = { id: 'u3', ownerId: 0, q: R, r: 0, inGarnizon: false };
  const uDeep = { id: 'u4', ownerId: 0, q: 1, r: 0, inGarnizon: false };
  const uFar = { id: 'u5', ownerId: 0, q: 30, r: 0, inGarnizon: false };
  const c5 = planExpansionFortBuilding(0, [aiCity], [uBorder], map, noFort);
  assert(c5 && c5.key === 'posterunek' && c5.q === R && c5.r === 0, 'C5: bez techu fortu AI stawia posterunek z heksu przy wlasnej granicy');
  assert(!planExpansionFortBuilding(0, [aiCity], [uDeep], map, noFort), 'C6: jednostka w glebi terytorium -> brak posterunku');
  assert(!planExpansionFortBuilding(0, [aiCity], [uFar], map, noFort), 'C7: jednostka poza terenem, bez techu fortu -> brak komendy');
  const withFort = { ...noFort, improvementTechs: new Set(['Wojskowość', 'Obróbka drewna', 'Murarstwo']) };
  const c8 = planExpansionFortBuilding(0, [aiCity], [uFar, uBorder], map, withFort);
  assert(c8 && c8.key === 'fort' && c8.q === 30, 'C8: z techem fortu priorytet ma fort zamorski');
  const noOutpostTech = { ...noFort, improvementTechs: new Set() };
  assert(!planExpansionFortBuilding(0, [aiCity], [uBorder], map, noOutpostTech), 'C9: bez techu posterunku brak komendy');
  const onOutpost = { ...noFort, placedImprovements: new Map([[`${R},0`, ['posterunek']]]) };
  assert(!planExpansionFortBuilding(0, [aiCity], [uBorder], map, onOutpost), 'C10: heks z istniejacym posterunkiem pomijany');
}

console.log('\n--- D: straznik tekstowy (main.ts, ai.ts) -- jedna sciezka predykatu ---');
{
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const imp = fs.readFileSync(path.join(SRC, 'map/improvement-build.ts'), 'utf8');
  const uses = (s) => (s.match(/isOutpostPlacementAllowed\(/g) || []).length;
  assert(uses(main) >= 2, 'D1: main.ts uzywa wspolnego predykatu (straznik gracza + gate AI)');
  assert(uses(imp) >= 1, 'D2: improvement-build.ts (panel/automat) uzywa wspolnego predykatu');
  assert(/OUTPOST_PLACEMENT_DENIED_HINT/.test(main), 'D3: czytelny komunikat odmowy dla gracza');
  assert(!/function\s+isOutpostPlacementAllowed/.test(main + imp), 'D4: brak zduplikowanej implementacji predykatu');
}

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
