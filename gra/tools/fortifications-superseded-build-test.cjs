'use strict';
/**
 * fortifications-superseded-build-test.cjs
 *
 * R-WEB-UI-FORTIFICATIONS-HIDE-SUPERSEDED-WALL-BUILD-OPTIONS-Q1 (2026-11-14): nowa budowa etapu lancucha
 * fortyfikacji (Palisada -> Mury kamienne -> Mury ceglane) znika z listy "Dostepne do budowy" i z wyborow
 * automatow, gdy odblokowany jest tech KTOREGOKOLWIEK wyzszego etapu. Ulepszenie juz zbudowanego nizszego
 * etapu zostaje (awans). Cytadela (fort) i baszta bez zmian.
 *
 * Sprawdza: (a) czysta funkcje isFortificationSupersededForBuild, (b) macierz techy x miasto dla listy
 * budowy (availableProduction + buildableProduction z zasobami), (d) ulepszenia zostaja, (c) bramka
 * silnika (uzywana przez AI i wybory automatow) nie przepuszcza przestarzalego muru.
 *
 * Usage (z gra/): node tools/fortifications-superseded-build-test.cjs
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
let pass = 0; let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  [OK]', m); } else { fail++; console.error('  [FAIL]', m); } }

const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT = path.join(os.tmpdir(), `fort-superseded-${RUN}-${TMPDIR_RUN_ID}`);
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ } });

const G = GRA.replace(/\\/g, '/');
const entry = path.join(OUT, 'entry.ts');
fs.writeFileSync(entry, `
import * as P from '${G}/src/game/production';
import * as U from '${G}/src/game/building-upgrades';
export const availableProduction = P.availableProduction;
export const buildableProduction = P.buildableProduction;
export const isFortificationSupersededForBuild = U.isFortificationSupersededForBuild;
`);
const outfile = path.join(OUT, 'bundle.cjs');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent', loader: { '.json': 'json' } });
const M = require(outfile);

const bRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const buildings = Array.isArray(bRaw) ? bRaw : (bRaw.budynki || bRaw.buildings || bRaw);
const data = { buildings, units: [] };
const T_OD = 'Obróbka drewna';
const T_MUR = 'Murarstwo';
const T_BUD = 'Budownictwo';
const city = { id: 'c1', name: 'Test', ownerId: 0 };
const WALLS = ['palisada', 'mury_kamienne', 'mury'];
const RICH = { drewno: 100000, kamien: 100000, cegla: 100000, glina: 100000, zelazo: 100000 };

const TECH_SETS = [
  { name: 'nic', techs: [] },
  { name: 'Obróbka drewna', techs: [T_OD] },
  { name: '+Murarstwo', techs: [T_OD, T_MUR] },
  { name: '+Budownictwo', techs: [T_OD, T_MUR, T_BUD] },
];
const CITY_STATES = [
  { name: 'miasto bez muru', built: [] },
  { name: 'z palisada', built: ['palisada'] },
  { name: 'z murami kamiennymi', built: ['mury_kamienne'] },
];

// Oczekiwana macierz: ktore mury sa oferowane (nowa budowa LUB awans z zbudowanego nizszego etapu).
const EXPECT = {
  'nic|miasto bez muru': [],
  'nic|z palisada': [],
  'nic|z murami kamiennymi': [],
  'Obróbka drewna|miasto bez muru': ['palisada'],
  'Obróbka drewna|z palisada': [],
  'Obróbka drewna|z murami kamiennymi': [],
  '+Murarstwo|miasto bez muru': ['mury_kamienne'],
  '+Murarstwo|z palisada': ['mury_kamienne'],
  '+Murarstwo|z murami kamiennymi': [],
  '+Budownictwo|miasto bez muru': ['mury'],
  // Awans (nie nowa budowa): palisada stoi -> Mury kamienne i Mury ceglane pozostaja ulepszeniami (dispatch d).
  '+Budownictwo|z palisada': ['mury_kamienne', 'mury'],
  '+Budownictwo|z murami kamiennymi': ['mury'],
};

const wallsOffered = list => WALLS.filter(id => list.some(it => it.id === id && it.kind === 'budynek'));

console.log('\n=== (a) funkcja czysta isFortificationSupersededForBuild ===');
{
  const sup = (id, techs) => M.isFortificationSupersededForBuild(id, new Set(techs), buildings);
  assert(sup('palisada', []) === false, 'a1 palisada bez zadnego techu: nie znika');
  assert(sup('palisada', [T_OD]) === false, 'a2 palisada przy samej Obróbce drewna: nie znika');
  assert(sup('palisada', [T_OD, T_MUR]) === true, 'a3 palisada po Murarstwie: znika');
  assert(sup('palisada', [T_BUD]) === true, 'a4 palisada po samym Budownictwie: znika (mury wyzej w lancuchu)');
  assert(sup('mury_kamienne', [T_OD, T_MUR]) === false, 'a5 mury kamienne po Murarstwie: nie znikaja');
  assert(sup('mury_kamienne', [T_OD, T_MUR, T_BUD]) === true, 'a6 mury kamienne po Budownictwie: znikaja');
  assert(sup('mury', [T_OD, T_MUR, T_BUD]) === false, 'a7 mury ceglane (koniec lancucha): nigdy nie znikaja');
  assert(sup('fort', [T_OD, T_MUR, T_BUD]) === false, 'a8 cytadela bez zmian');
  assert(sup('baszta', [T_OD, T_MUR, T_BUD]) === false, 'a9 baszta bez zmian');
}

console.log('\n=== (b) macierz: lista budowy (availableProduction) x techy x miasto ===');
for (const ts of TECH_SETS) {
  for (const cs of CITY_STATES) {
    const key = `${ts.name}|${cs.name}`;
    const list = M.availableProduction(city, data, ts.techs, {
      epoch: 3, builtBuildingIds: cs.built, productionQueue: [], empireResourceStock: RICH,
    });
    const got = wallsOffered(list);
    assert(JSON.stringify(got) === JSON.stringify(EXPECT[key]),
      `b ${key}: oferta=[${got.join(',')}] oczekiwano=[${EXPECT[key].join(',')}]`);
  }
}

console.log('\n=== (b2) lista gracza (buildableProduction, showResourceGatedBuildings) zgodna z macierza ===');
for (const ts of TECH_SETS) {
  for (const cs of CITY_STATES) {
    const key = `${ts.name}|${cs.name}`;
    const list = M.buildableProduction(city, data, ts.techs, {
      epoch: 3, builtBuildingIds: cs.built, productionQueue: [], empireResourceStock: RICH,
      showResourceGatedBuildings: true,
    });
    const got = wallsOffered(list);
    assert(JSON.stringify(got) === JSON.stringify(EXPECT[key]), `b2 ${key}: lista=[${got.join(',')}]`);
  }
}

console.log('\n=== (d) ulepszenie zbudowanego nizszego etapu nadal dostepne (awans) ===');
{
  const l1 = M.availableProduction(city, data, [T_OD, T_MUR], {
    epoch: 3, builtBuildingIds: ['palisada'], productionQueue: [], empireResourceStock: RICH,
  });
  assert(l1.some(it => it.id === 'mury_kamienne'), 'd1 palisada stoi + Murarstwo: ulepszenie na Mury kamienne widoczne');
  const l2 = M.availableProduction(city, data, [T_OD, T_MUR, T_BUD], {
    epoch: 3, builtBuildingIds: ['mury_kamienne'], productionQueue: [], empireResourceStock: RICH,
  });
  assert(l2.some(it => it.id === 'mury'), 'd2 mury kamienne stoja + Budownictwo: ulepszenie na Mury ceglane widoczne');
  const l3 = M.availableProduction(city, data, [T_OD, T_MUR, T_BUD], {
    epoch: 3, builtBuildingIds: ['palisada'], productionQueue: [], empireResourceStock: RICH,
  });
  assert(l3.some(it => it.id === 'mury'), 'd3 palisada stoi + Budownictwo: przeskok na Mury ceglane widoczny');
}

console.log('\n=== (c) wybory AI / automatow: brama silnika nie przepuszcza przestarzalego muru ===');
{
  const palisadaAllowed = M.availableProduction(city, data, [T_OD, T_MUR], {
    epoch: 1, builtBuildingIds: [], productionQueue: [], empireResourceStock: RICH,
  }).some(it => it.id === 'palisada');
  assert(palisadaAllowed === false, 'c1 brama: palisada zablokowana po Murarstwie (miasto bez muru)');
  const kamienneAllowed = M.availableProduction(city, data, [T_OD, T_MUR, T_BUD], {
    epoch: 2, builtBuildingIds: [], productionQueue: [], empireResourceStock: RICH,
  }).some(it => it.id === 'mury_kamienne');
  assert(kamienneAllowed === false, 'c2 brama: mury kamienne zablokowane po Budownictwie');
}

console.log(`\n=== wynik: ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
