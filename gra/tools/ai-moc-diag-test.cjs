'use strict';
/**
 * ai-moc-diag-test.cjs — AI-MOC-NEXT-Q1=B: metryki diagnostyczne Mocy AI.
 * Run from gra/: node tools/ai-moc-diag-test.cjs
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.ai-moc-diag-entry.ts');
const bundle = path.join(__dirname, '.ai-moc-diag-bundle.cjs');

fs.writeFileSync(entry, `
export { buildAiMocDiagRows } from '../src/game/ai-moc-diag';
export { isOwnerClusterCityState } from '../src/game/display-names';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const { buildAiMocDiagRows } = M;

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

const cityStateOpts = {
  cities: [
    { ownerId: 0, startCityState: false },
    { ownerId: 1, startCityState: false },
    { ownerId: 2, startCityState: false },
    { ownerId: 3, startCityState: true },
    { ownerId: 4, startCityState: true },
  ],
};

function isCityStateOwner(ownerId) {
  return M.isOwnerClusterCityState(ownerId, cityStateOpts);
}

const labels = { 0: 'Gracz', 1: 'Rzym', 2: 'Egipt', 3: 'MP-A', 4: 'MP-B' };
const mocMap = { 0: 120, 1: 95, 2: 80, 3: 50, 4: 40 };
const pracaMap = { 0: 30, 1: 22, 2: 15, 3: 5, 4: 3 };
const queueMap = {
  'c0a': 2,
  'c0b': 0,
  'c1a': 1,
  'c2a': 0,
  'c3a': 3,
  'c4a': 0,
};

console.log('\nai-moc-diag-test (AI-MOC-NEXT-Q1=B)\n');

console.log('-- A. Happy: 1 gracz + 2 major AI → 3 wiersze --');
{
  const cities = [
    { ownerId: 0, cityId: 'c0a' },
    { ownerId: 0, cityId: 'c0b' },
    { ownerId: 1, cityId: 'c1a' },
    { ownerId: 2, cityId: 'c2a' },
    { ownerId: 3, cityId: 'c3a' },
    { ownerId: 4, cityId: 'c4a' },
  ];
  const rows = buildAiMocDiagRows({
    ownerIds: [0, 1, 2, 3, 4],
    labelForOwner: (oid) => labels[oid] ?? `oid-${oid}`,
    mocForOwner: (oid) => mocMap[oid] ?? 0,
    pracaPoolForOwner: (oid) => pracaMap[oid] ?? 0,
    cities,
    productionQueueLength: (cid) => queueMap[cid] ?? 0,
    isCityStateOwner,
  });
  eq(rows.length, 3, 'happy: 3 wiersze (gracz + 2 major AI)');
  const byId = Object.fromEntries(rows.map(r => [r.ownerId, r]));
  assert(byId[0] !== undefined, 'happy: gracz obecny');
  assert(byId[1] !== undefined, 'happy: major AI 1 obecny');
  assert(byId[2] !== undefined, 'happy: major AI 2 obecny');
  eq(byId[0].miasta, 2, 'happy: gracz 2 miasta');
  eq(byId[0].kolejkaAktywne, 1, 'happy: gracz 1 miasto z kolejką');
  eq(byId[0].kolejkaPuste, 1, 'happy: gracz 1 miasto bez kolejki');
  eq(byId[0].moc, 120, 'happy: gracz moc');
  eq(byId[0].pracaPool, 30, 'happy: gracz pracaPool');
  eq(byId[1].miasta, 1, 'happy: AI1 1 miasto');
  eq(byId[1].kolejkaAktywne, 1, 'happy: AI1 kolejka aktywna');
  eq(byId[2].kolejkaPuste, 1, 'happy: AI2 kolejka pusta');
  eq(rows[0].ownerId, 0, 'happy: sort po moc — gracz pierwszy (120)');
}

console.log('\n-- B. Edge: pusta lista cities → wiersze z miasta=0 --');
{
  const rows = buildAiMocDiagRows({
    ownerIds: [0, 1],
    labelForOwner: (oid) => labels[oid] ?? `oid-${oid}`,
    mocForOwner: (oid) => mocMap[oid] ?? 0,
    pracaPoolForOwner: (oid) => pracaMap[oid] ?? 0,
    cities: [],
    productionQueueLength: () => 0,
    isCityStateOwner,
  });
  eq(rows.length, 2, 'edge empty cities: 2 wiersze (owners z inputu)');
  eq(rows.every(r => r.miasta === 0), true, 'edge empty cities: miasta=0');
  eq(rows.every(r => r.kolejkaPuste === 0 && r.kolejkaAktywne === 0), true,
    'edge empty cities: kolejki zerowe');
}

console.log('\n-- C. Edge: MP/city-state wykluczone mimo miast --');
{
  const cities = [
    { ownerId: 3, cityId: 'c3a' },
    { ownerId: 4, cityId: 'c4a' },
    { ownerId: 1, cityId: 'c1a' },
  ];
  const rows = buildAiMocDiagRows({
    ownerIds: [0, 1, 3, 4],
    labelForOwner: (oid) => labels[oid] ?? `oid-${oid}`,
    mocForOwner: (oid) => mocMap[oid] ?? 0,
    pracaPoolForOwner: (oid) => pracaMap[oid] ?? 0,
    cities,
    productionQueueLength: (cid) => queueMap[cid] ?? 0,
    isCityStateOwner,
  });
  eq(rows.length, 2, 'edge MP: tylko gracz + major AI 1');
  assert(!rows.some(r => r.ownerId === 3), 'negacja: brak ownerId 3 (MP)');
  assert(!rows.some(r => r.ownerId === 4), 'negacja: brak ownerId 4 (MP)');
  eq(rows.find(r => r.ownerId === 1).miasta, 1, 'edge MP: major AI ma swoje miasto');
}

console.log('\n-- D. Parytet: gracz i AI mają te same pola --');
{
  const cities = [
    { ownerId: 0, cityId: 'c0a' },
    { ownerId: 1, cityId: 'c1a' },
  ];
  const rows = buildAiMocDiagRows({
    ownerIds: [0, 1],
    labelForOwner: (oid) => labels[oid] ?? `oid-${oid}`,
    mocForOwner: (oid) => mocMap[oid] ?? 0,
    pracaPoolForOwner: (oid) => pracaMap[oid] ?? 0,
    cities,
    productionQueueLength: (cid) => queueMap[cid] ?? 0,
    isCityStateOwner,
  });
  const keys = ['ownerId', 'label', 'moc', 'miasta', 'pracaPool', 'kolejkaPuste', 'kolejkaAktywne'];
  for (const r of rows) {
    assert(keys.every(k => Object.prototype.hasOwnProperty.call(r, k)),
      `parytet: wiersz owner ${r.ownerId} ma wszystkie pola`);
  }
}

try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) {}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
