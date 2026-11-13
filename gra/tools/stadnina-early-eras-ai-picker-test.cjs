'use strict';
/**
 * stadnina-early-eras-ai-picker-test.cjs -- BEHAVIOURALNY dowod zgodnosci AI i auto-ulepszen
 * R-WEB-STABLE-STADNINA-ONLY-ON-HORSE-DEPOSIT-EARLY-ERAS-Q1 (2026-11-09).
 *
 * Reguła: w epokach 1–2 stadnina tylko na złożu konia; od epoki 3 poza złożem po odblokowaniu Konia
 * imperium (magazyn 'kon' >= 50 w tym scenariuszu; trasy handlowej picker nie zna).
 *
 * Woła PRAWDZIWE funkcje (zbundlowane esbuild): pickAutoImprovements (auto-improvements.ts, ścieżka
 * automatu gracza i AI) oraz decideAITurn (ai.ts, zakup/budowa AI). Nie czyta źródła regexem.
 * Mutacja: ASBP_SRC_DIR=<kopia gra/src z usuniętą bramką epoki> -> testy MUSZĄ być czerwone.
 *
 * Run z gra/:  node tools/stadnina-early-eras-ai-picker-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.ASBP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'asbp-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { decideAITurn } from ${JSON.stringify(SRC + '/game/ai')};
export { getStadninaBuildBlockReason } from ${JSON.stringify(SRC + '/map/improvement-build')};
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { pickAutoImprovements, decideAITurn, getStadninaBuildBlockReason } = require(bundle);
process.on('exit', () => { try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* */ } });

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } };
const K = (q, r) => `${q},${r}`;
const PID = 0;
const TECHS = new Set(['Jeździectwo', 'Łowiectwo', 'Rolnictwo', 'Oswojenie zwierząt', 'Murarstwo', 'Wojskowość']);
const DEPOSIT = { q: 10, r: 1 };

function mkMap(withDeposit = true) {
  const hexes = {};
  for (let q = -8; q <= 24; q++) for (let r = -10; r <= 10; r++) {
    hexes[K(q, r)] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  if (withDeposit) hexes[K(DEPOSIT.q, DEPOSIT.r)].nakladka = 'zloze_konia';
  return { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
}
// Miasto (0,0) + fort (10,0): kolo fortu zawiera złoże konia (10,1) i wiele otwartych Równin bez złoża.
function scenario(era, horseStock, placed = new Map()) {
  const map = mkMap();
  const tn = [
    { q: 0, r: 0, ownerId: PID, cityId: 'c0', pop: 1, level: 1 },
    { q: 10, r: 0, pop: 0, level: 1, ownerId: PID, isFort: true },
  ];
  const city = { id: 'c0', ownerId: PID, q: 0, r: 0, name: 'A', population: 1, surowce: { kon: horseStock } };
  const picks = pickAutoImprovements({
    cities: [city], ownerId: PID, map, territoryNodes: tn, placedImprovements: placed, pracaAvailable: 900,
    unlockedTechs: TECHS, pracaSurplusThreshold: 0, skipWyrab: false, demandDriven: true, resourceDeficitKeys: ['kon'],
    getOnlyWorked: () => true, getWorkedHexKeys: () => new Set([K(0, 0)]),
    pracaBudgetPercent: 100, getPracaBudgetPercent: () => 100, civArchetype: 'rzymianie', playerEra: era,
    foodImprovementStages: true,
  });
  const aiStad = picks.filter(p => p.key === 'stadnina').map(p => K(p.q, p.r)).sort();
  const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
  const cmds = decideAITurn(PID, [], [city], map, data, {
    civType: 'rzymianie', poziomTrudnosci: 2, defensiveCopy: false, cityBuildings: {}, territoryNodes: tn,
    placedImprovements: placed, improvementTechs: TECHS, pracaAvailable: 900, civEra: era, resourceDeficitKeys: ['kon'],
    horseStockAvailable: horseStock,
  });
  const aiTurnStad = cmds.filter(c => c.type === 'buildImprovement' && c.key === 'stadnina').map(c => K(c.q, c.r)).sort();
  return { aiStad, aiTurnStad };
}
const onlyDeposit = (arr) => arr.every(k => k === K(DEPOSIT.q, DEPOSIT.r));
const openOnes = (arr) => arr.filter(k => k !== K(DEPOSIT.q, DEPOSIT.r));

console.log('(A) epoki 1 i 2: magazyn 50 poza złożem NIE odblokowuje stadniny (automat i AI)');
for (const era of [1, 2]) {
  const s = scenario(era, 50);
  console.log(`   epoka ${era}: pickAutoImprovements [${s.aiStad.join(' ') || '-'}] | decideAITurn [${s.aiTurnStad.join(' ') || '-'}]`);
  ok(openOnes(s.aiStad).length === 0, `epoka ${era}: automat nie stawia stadniny poza złożem (${openOnes(s.aiStad).join(' ') || 'brak'})`);
  ok(openOnes(s.aiTurnStad).length === 0, `epoka ${era}: decideAITurn nie stawia stadniny poza złożem (${openOnes(s.aiTurnStad).join(' ') || 'brak'})`);
  ok(s.aiStad.includes(K(DEPOSIT.q, DEPOSIT.r)), `epoka ${era}: automat nadal stawia stadninę NA złożu konia`);
}

console.log('(B) epoka 3 i wyżej: magazyn 50 odblokowuje stadninę poza złożem (automat i AI)');
for (const era of [3, 4]) {
  const s = scenario(era, 50);
  console.log(`   epoka ${era}: pickAutoImprovements [${s.aiStad.join(' ') || '-'}] | decideAITurn [${s.aiTurnStad.join(' ') || '-'}]`);
  ok(openOnes(s.aiStad).length === 0, `[R-WEB-IRON-STUD-ADJACENCY-Q1: bez sąsiedniej stadniny -> 0] epoka ${era}: automat NIE stawia stadniny poza złożem bez sąsiada (${openOnes(s.aiStad).length} heksów)`);
  ok(openOnes(s.aiTurnStad).length === 0, `[R-WEB-IRON-STUD-ADJACENCY-Q1: bez sąsiedniej stadniny -> 0] epoka ${era}: decideAITurn NIE stawia stadniny poza złożem bez sąsiada (${openOnes(s.aiTurnStad).length} heksów)`);
}

console.log('(B2) R-WEB-IRON-STUD-ADJACENCY-Q1: zbudowana stadnina (1,0) w promieniu miasta -> AI stawia stadninę TYLKO na sześciu sąsiadach (1,0), bez łańcucha');
{
  const STUD = K(1, 0);
  const NEIGH = new Set([K(2, 0), K(2, -1), K(1, -1), K(0, 1), K(1, 1), K(0, 0)]);
  const s = scenario(3, 50, new Map([[STUD, ['stadnina']]]));
  console.log(`   epoka 3 + zbudowana (9,0): pickAutoImprovements [${s.aiStad.join(' ') || '-'}] | decideAITurn [${s.aiTurnStad.join(' ') || '-'}]`);
  ok(openOnes(s.aiStad).length >= 1, `automat stawia stadninę poza złożem przy zbudowanej sąsiedniej (${openOnes(s.aiStad).length} heksów)`);
  ok(openOnes(s.aiStad).every(k => NEIGH.has(k) || k === STUD), `automat: każda stadnina poza złożem jest na BEZPOŚREDNIM sąsiedzie (1,0) (brak łańcucha)`);
  ok(openOnes(s.aiTurnStad).length >= 1, `decideAITurn stawia stadninę poza złożem przy zbudowanej sąsiedniej (${openOnes(s.aiTurnStad).length} heksów)`);
  ok(openOnes(s.aiTurnStad).every(k => NEIGH.has(k)), `decideAITurn: każda stadnina poza złożem jest na BEZPOŚREDNIM sąsiedzie (1,0) (brak łańcucha)`);
}

console.log('(C) regresja: bez odblokowania Konia (magazyn 0) poza złożem nie ma stadniny w żadnej epoce');
for (const era of [1, 3]) {
  const s = scenario(era, 0);
  ok(openOnes(s.aiStad).length === 0, `epoka ${era}, magazyn 0: automat bez stadniny poza złożem`);
  ok(openOnes(s.aiTurnStad).length === 0, `epoka ${era}, magazyn 0: decideAITurn bez stadniny poza złożem`);
}

console.log('(D) kontrola: w epokach 1–2 złoże konia nadal wystarcza (wszystkie wybrane stadniny na złożu)');
for (const era of [1, 2]) {
  const s = scenario(era, 0);
  ok(s.aiStad.length >= 1 && onlyDeposit(s.aiStad), `epoka ${era}, magazyn 0: automat stawia stadninę tylko na złożu (${s.aiStad.join(' ') || '-'})`);
}

console.log('(E) komunikat „brak stadniny" zależy od epoki (getStadninaBuildBlockReason, bez złoża w terytorium)');
{
  const reason = (era, stock) => {
    const map = mkMap(false);
    const tn = [
      { q: 0, r: 0, ownerId: PID, cityId: 'c0', pop: 1, level: 1 },
      { q: 10, r: 0, pop: 0, level: 1, ownerId: PID, isFort: true },
    ];
    return getStadninaBuildBlockReason({
      map, cityNodes: [{ q: 0, r: 0, pop: 1, level: 1 }], territoryNodes: tn, playerOwnerIdNum: PID,
      playerCivArchetype: 'rzymianie', playerEra: era, researchedTechs: TECHS,
      horseStockAvailable: stock, tradeRouteKonUnlocked: false,
    }) || '';
  };
  const r1 = reason(1, 80);
  console.log(`   epoka 1, magazyn 80: „${r1}"`);
  ok(/złoże konia/.test(r1) && !/magazynie/.test(r1) && /Żelaza/.test(r1),
    'epoka 1 z magazynem 80: komunikat wymaga złoża konia i NIE sugeruje magazynu (jest tylko epoka Żelaza)');
  const r2 = reason(2, 80);
  ok(!/magazynie/.test(r2), 'epoka 2 z magazynem 80: komunikat NIE sugeruje magazynu');
  const r3 = reason(3, 49);
  console.log(`   epoka 3, magazyn 49: „${r3}"`);
  ok(/magazynie imperium, masz 49/.test(r3), 'epoka 3 z magazynem 49: komunikat podaje próg magazynu (od epoki Żelaza)');
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
