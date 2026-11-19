/**
 * R-WEB-TERRITORY-FORT-RING-IMPROVEMENTS-NOT-TRANSFERRED-Q1 (ABC C, 2026-11-19), runda 3.
 * Testy PRAWDZIWEGO kodu (map/territory.ts + game/fort-territory.ts, bundle esbuild):
 *  - predykat ochrony (fortRingShield) = wlasciciel ulepszenia == wlasciciel fortu;
 *  - fortRingHasOwnImprovement: heks samego fortu pominiety, tylko WLASNE ulepszenia w pierscieniu;
 *  - fortRingBuildBlockReason: blokada budowy w pierscieniu WLASNEGO fortu na cudzym terytorium;
 *  - resolveImprovementOwners: zapis ma pierwszenstwo, stary zapis = przyblizenie, bez NaN/undefined;
 *  - dwa forty i mutacja: wynik spojny z territoryOwnerAt.
 */
const fs = require('fs');
const path = require('path');
let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.territory-owner-entry.ts');
const BUNDLE = path.resolve(__dirname, '.territory-owner-bundle.cjs');
fs.writeFileSync(ENTRY, `
export * as FT from ${JSON.stringify(SRC + '/game/fort-territory')};
export * from ${JSON.stringify(SRC + '/map/territory')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
} catch (e) { console.error('bundle failed', e.message || e); process.exit(1); }
const M = require(BUNDLE);
const { FT, territoryOwnerAt, fortRingShield, fortRingHasOwnImprovement, fortRingBuildBlockReason,
  resolveImprovementOwners, FORT_RING_BUILD_BLOCK_REASON, cityTerritoryRadius, territoryOwnerLookup } = M;

const mapOf = (entries) => new Map(entries);
const hasL = (m) => (hk) => m.has(hk);

console.log('\n--- OWN-1: predykat ochrony = wlasciciel ulepszenia == wlasciciel fortu ---');
{
  const m = mapOf([['2,0', 0], ['3,0', 1]]);
  const sh = fortRingShield(m, hasL(mapOf([['2,0', 1], ['3,0', 1]])));
  eq(sh(2, 0, 0), true, 'OWN-1a: ulepszenie wlasciciela fortu (0) chroni heks');
  eq(sh(3, 0, 0), false, 'OWN-1b: ulepszenie STAREGO MIASTA (1) nie chroni heksu przed fortem 0');
  eq(sh(4, 0, 0), false, 'OWN-1c: brak wpisu -> brak ochrony');
  eq(fortRingShield(m, () => false)(2, 0, 0), false, 'OWN-1d: wpis w rejestrze bez warstw -> brak ochrony');
}

console.log('\n--- OWN-2: fortRingHasOwnImprovement (srodek fortu pominiety, tylko wlasne ulepszenia) ---');
{
  const fort = { q: 0, r: 0, ownerId: 0, type: 'fort' };
  eq(fortRingHasOwnImprovement(fort, mapOf([['0,0', 0]])), false, 'OWN-2a: sam fort na srodku (0,0) -> brak pierscienia');
  eq(fortRingHasOwnImprovement(fort, mapOf([['2,0', 1]])), false, 'OWN-2b: ulepszenie obcego wlasciciela w pierscieniu -> false');
  eq(fortRingHasOwnImprovement(fort, mapOf([['2,0', 0]])), true, 'OWN-2c: wlasne ulepszenie (2,0) w pierscieniu -> true');
  eq(fortRingHasOwnImprovement(fort, mapOf([['5,0', 0]])), true, 'OWN-2d: granica promienia fortu (5,0) -> true');
  eq(fortRingHasOwnImprovement(fort, mapOf([['6,0', 0]])), false, 'OWN-2e: poza promieniem (6,0) -> false');
  const post = { q: 0, r: 0, ownerId: 0, type: 'posterunek' };
  eq(fortRingHasOwnImprovement(post, mapOf([['3,0', 0]])), true, 'OWN-2f: posterunek r=3, granica (3,0) -> true');
  eq(fortRingHasOwnImprovement(post, mapOf([['4,0', 0]])), false, 'OWN-2g: posterunek r=3, (4,0) poza promieniem -> false');
}

console.log('\n--- OWN-3: blokada budowy w pierscieniu WLASNEGO fortu na cudzym terytorium ---');
{
  // Fort gracza (0) na (0,0). Miasto AI (1) na (9,0). Miasto gracza (0) na (-2,0).
  const fort = { q: 0, r: 0, ownerId: 0, type: 'fort', builtAtTurn: 1, seq: 0 };
  const aiCity = { q: 9, r: 0, pop: 10, level: 1, ownerId: 1 };
  const ownCity = { q: -2, r: 0, pop: 10, level: 1, ownerId: 0 };
  const nodes = [aiCity, ownCity].concat(FT.fortTerritoryNodes([fort]));
  console.log(`  info: owner(3,0)=${territoryOwnerAt(3, 0, nodes)} owner(4,0)=${territoryOwnerAt(4, 0, nodes)} r(ownCity)=${cityTerritoryRadius(ownCity)} r(aiCity)=${cityTerritoryRadius(aiCity)} r(fort)=${cityTerritoryRadius(fort)}`);
  assert(territoryOwnerAt(4, 0, nodes) === 1, 'OWN-3-setup: (4,0) nalezy do miasta AI (1)');
  eq(fortRingBuildBlockReason(4, 0, 0, nodes), FORT_RING_BUILD_BLOCK_REASON, 'OWN-3a: budowa wlasciciela fortu na (4,0) (w pierscieniu, cudze miasto) -> powod');
  eq(fortRingBuildBlockReason(0, 0, 0, nodes), null, 'OWN-3b: srodek fortu (wlasne terytorium) -> brak blokady');
  eq(fortRingBuildBlockReason(4, 0, 1, nodes), null, 'OWN-3c: budujacy bez fortu w pierscieniu (AI 1) -> brak blokady');
  eq(fortRingBuildBlockReason(8, 0, 0, nodes), null, 'OWN-3d: heks poza pierscieniem fortu (8,0) -> brak blokady');
  eq(fortRingBuildBlockReason(4, 0, 0, [aiCity, ownCity]), null, 'OWN-3e: bez fortu gracza -> brak blokady');
  eq(territoryOwnerAt(3, 0, nodes) === 0 ? fortRingBuildBlockReason(3, 0, 0, nodes) : 'skip', null, 'OWN-3f: heks wlasnego terytorium w pierscieniu -> brak blokady (jesli owner=0)');
}

console.log('\n--- OWN-4: rejestr wlascicieli przy wczytaniu (resolveImprovementOwners) ---');
{
  const keys = ['1,1', '2,2', '3,3'];
  const saved = [['1,1', 0], ['2,2', 1]];
  const r1 = resolveImprovementOwners(keys, saved, () => 7);
  eq(r1.get('1,1'), 0, 'OWN-4a: zapis ma pierwszenstwo (1,1 -> 0)');
  eq(r1.get('2,2'), 1, 'OWN-4b: zapis ma pierwszenstwo (2,2 -> 1)');
  eq(r1.get('3,3'), 7, 'OWN-4c: brak w zapisie -> przyblizenie ownerAt (7)');
  const r2 = resolveImprovementOwners(keys, undefined, (q) => (q === 3 ? null : q + 1));
  eq(r2.get('1,1'), 2, 'OWN-4d: stary zapis (bez rejestru) -> przyblizenie ownerAt(1,1)=2');
  eq(r2.has('3,3'), false, 'OWN-4e: stary zapis, ownerAt=null (poza zasiegiem) -> brak wpisu');
  const r3 = resolveImprovementOwners(['1,1'], [['1,1', NaN], ['1,1', undefined]], null);
  eq(r3.size, 0, 'OWN-4f: NaN/undefined w zapisie -> pominiete, bez NaN/undefined');
  eq(resolveImprovementOwners(['1,1'], undefined, null).size, 0, 'OWN-4g: stary zapis bez ownerAt -> pusty rejestr');
  assert([...r1.values(), ...r2.values()].every(v => Number.isFinite(v)), 'OWN-4h: wszystkie wartosci skonczone');
}

console.log('\n--- OWN-5: dwa forty, spojnie z territoryOwnerAt i lookup ---');
{
  // Fort A (gracz 0, wczesniej) na (0,0) z WLASNYM ulepszeniem (2,0); fort B (AI 2, pozniej) na (4,0) bez ulepszen.
  // Miasto AI 1 na (9,0) pop 10. Heks (2,0): wygrywa A (wczesniejszy), jego ulepszenie chroni heks.
  const reg = mapOf([['2,0', 0]]);
  const fA = { q: 0, r: 0, ownerId: 0, type: 'fort', builtAtTurn: 1, seq: 0 };
  const fB = { q: 4, r: 0, ownerId: 2, type: 'fort', builtAtTurn: 2, seq: 1 };
  const shieldFor = (f) => (fortRingHasOwnImprovement(f, reg) ? fortRingShield(reg, hasL(reg)) : undefined);
  const nodes = [{ q: 9, r: 0, pop: 10, level: 1, ownerId: 1 }].concat(FT.fortTerritoryNodes([fA, fB], shieldFor));
  eq(territoryOwnerAt(2, 0, nodes), 0, 'OWN-5a: sporny heks (2,0) z ulepszeniem A -> A (0)');
  const pads = [];
  for (let k = 0; k < 12; k++) pads.push({ q: 40 + k, r: 40, pop: 1, level: 1, ownerId: 3 });
  const all = nodes.concat(pads);
  const lk = territoryOwnerLookup(all);
  eq(lk(2, 0), territoryOwnerAt(2, 0, all), 'OWN-5b: lookup zgodny z territoryOwnerAt (sporny heks)');
  eq(lk(3, 0), territoryOwnerAt(3, 0, all), 'OWN-5c: lookup zgodny z territoryOwnerAt (heks bez ulepszenia)');
}

console.log('\n--- OWN-6: mutacja (predykat zawsze false) oddaje heks miastu AI ---');
{
  const fort = { q: 0, r: 0, ownerId: 0, type: 'fort', builtAtTurn: 1, seq: 0 };
  const nodes = [{ q: 9, r: 0, pop: 10, level: 1, ownerId: 1 }].concat(FT.fortTerritoryNodes([fort], () => () => false));
  eq(territoryOwnerAt(2, 0, nodes), 1, 'OWN-6a: mutacja bez ochrony -> miasto AI (1), OWN-5a byłby czerwony');
}

console.log('\n--- OWN-7: straznik zrodla main.ts / improvement-build.ts ---');
{
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  const ib = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'map', 'improvement-build.ts'), 'utf8');
  assert(/fortRingHasOwnImprovement\(f, improvementOwnerByHex\)/.test(main), 'OWN-7a: buildAllTerritoryNodes podpina predykat tylko przy wlasnym ulepszeniu w pierscieniu');
  assert(/resolveImprovementOwners\(/.test(main), 'OWN-7b: wczytanie zapisu przez resolveImprovementOwners');
  assert(/fortRingBuildBlockReason\(req\.q, req\.r, 0, buildAllTerritoryNodes\(\)\)/.test(main), 'OWN-7c: applyBuildRequest stosuje ta sama blokade');
  assert(/fortRingBuildBlockReason\(q, r, playerOwnerIdNum, territoryNodes\)/.test(ib), 'OWN-7d: qualifies() stosuje blokade (gracz/AI/autopilot)');
}

console.log(`\n=== territory-improvement-owner-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
