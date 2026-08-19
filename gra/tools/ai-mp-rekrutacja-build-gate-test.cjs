'use strict';
/**
 * P-AI-PANSTWA-MIASTA-REKRUTACJA-JAKO-BUDYNKI — bramka AI/MP vs kolejka Pracy.
 * P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1=B: jednostki tylko przez Skarbiec
 * (purchaseRecruitmentUnit → rekrutacja[]), nigdy w kolejce budynków (kolejka[]).
 *
 * Uruchomienie: cd gra && node tools/ai-mp-rekrutacja-build-gate-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const entry = path.resolve(__dirname, '.ai-mp-rekrutacja-build-gate-entry.ts');
const bundle = path.resolve(__dirname, '.ai-mp-rekrutacja-build-gate-bundle.cjs');

fs.writeFileSync(entry, `
  export {
    enqueue,
    enqueueRecruitment,
    sanitizeBuildQueue,
    buildableProduction,
    purchasableUnits,
  } from '../src/game/production';
  export {
    chooseCityProduction,
    decideAITurn,
    decideDefensiveCopyTurn,
    shouldAIPurchaseUnit,
    buildCandidateIds,
    pickExecutableCandidate,
    loadDifficultyParams,
  } from '../src/game/ai';
  export { pickAutoBuildItem } from '../src/game/auto-manage';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: bundle,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (error) {
  console.error('[ai-mp-rekrutacja-build-gate-test] bundling failed:', error.message || error);
  process.exit(1);
}

const M = require(bundle);
const {
  enqueue,
  enqueueRecruitment,
  sanitizeBuildQueue,
  buildableProduction,
  purchasableUnits,
  chooseCityProduction,
  shouldAIPurchaseUnit,
  pickAutoBuildItem,
  loadDifficultyParams,
} = M;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else {
    failed++;
    console.error('FAIL:', msg);
  }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

const building = { kind: 'budynek', id: 'spichlerz', nazwa: 'Spichlerz', koszt: 20 };
const unitFront = { kind: 'jednostka', id: 'Wojownik', nazwa: 'Wojownik', koszt: 40 };
const paidRecruit = { ...unitFront, koszt: 40 };

console.log('\n-- T1: enqueue odrzuca jednostkę (AI/MP nie mogą wrzucić do kolejki Pracy) --');
{
  const base = { kolejka: [building], postep: 3 };
  const out = enqueue(base, unitFront);
  eq(out.kolejka.length, 1, 'T1a: kolejka bez nowej jednostki');
  eq(out.kolejka[0].id, 'spichlerz', 'T1b: budynek zostaje');
  assert(!out.kolejka.some(it => it.kind === 'jednostka'), 'T1c: brak jednostki w kolejka');
}

console.log('\n-- T2: zakup idzie do rekrutacja[], nie do kolejka --');
{
  const base = { kolejka: [building], postep: 0 };
  const out = enqueueRecruitment(base, paidRecruit);
  eq(out.rekrutacja?.length, 1, 'T2a: opłacona jednostka w rekrutacja');
  eq(out.kolejka.length, 1, 'T2b: kolejka budynków nietknięta');
  assert(!out.kolejka.some(it => it.kind === 'jednostka'), 'T2c: kolejka nadal bez jednostki');
}

console.log('\n-- T3: migracja legacy jednostek (scenariusz zdobycia / stary save) --');
{
  const legacy = {
    kolejka: [unitFront, { ...unitFront, id: 'Łucznik', nazwa: 'Łucznik', postep: 5 }, building],
    postep: 11,
    rekrutacja: [paidRecruit],
  };
  const migrated = sanitizeBuildQueue(legacy);
  eq(migrated.prod.kolejka.length, 1, 'T3a: tylko budynek w kolejce');
  eq(migrated.prod.kolejka[0].id, 'spichlerz', 'T3b: budynek zachowany');
  eq(migrated.refundedPraca, 16, 'T3c: zwrot postępu legacy jednostek');
  eq(migrated.prod.rekrutacja?.[0]?.id, 'Wojownik', 'T3d: legalna rekrutacja zachowana');
  assert(!migrated.prod.kolejka.some(it => it.kind === 'jednostka'), 'T3e: zero jednostek w kolejka');
}

console.log('\n-- T4: katalog budowy vs rekrutacja (UI/silnik) --');
{
  const city = { id: 'c1', ownerId: 3, q: 1, r: 1, name: 'MP', population: 3 };
  const data = {
    buildings: [{ id: 'spichlerz', nazwa: 'Spichlerz', epokaWejscia: 1, maksPoziom: 1, techUnlock: '' }],
    units: [{ Jednostka: 'Wojownik', Typ: 'Melee', Epoka: 'Kamień' }],
  };
  const ctx = { epoch: 1, builtBuildingIds: [], productionQueue: [] };
  const buildables = buildableProduction(city, data, [], ctx);
  const purchasable = purchasableUnits(city, data, [], ctx);
  assert(buildables.every(it => it.kind === 'budynek'), 'T4a: buildableProduction tylko budynki');
  assert(purchasable.every(it => it.kind === 'jednostka'), 'T4b: purchasableUnits tylko jednostki');
  assert(!buildables.some(it => it.id === 'Wojownik'), 'T4c: Wojownik nie w katalogu budowy');
}

console.log('\n-- T5: pickAutoBuildItem nigdy nie zwraca jednostki --');
{
  const city = {
    id: 'c1', ownerId: 3, q: 1, r: 1, name: 'MP', population: 3,
    budowaTryb: 'priorytet', budowaProfil: 'zrownowazone',
  };
  const prod = { kolejka: [], postep: 0 };
  const data = {
    buildings: [
      { id: 'spichlerz', nazwa: 'Spichlerz', epokaWejscia: 1, maksPoziom: 1, techUnlock: '', kategoria: 'gospodarczy' },
      { id: 'koszary', nazwa: 'Koszary', epokaWejscia: 1, maksPoziom: 1, techUnlock: '', kategoria: 'wojskowy' },
    ],
    units: [{ Jednostka: 'Wojownik', Typ: 'Melee', Epoka: 'Kamień' }],
  };
  const pick = pickAutoBuildItem(city, prod, data, {
    unlockedTechs: [],
    ownerSurowcePool: {},
    ctx: { epoch: 1, builtBuildingIds: [], productionQueue: [] },
  });
  assert(pick === null || pick.kind === 'budynek', 'T5: auto-budowa zwraca null lub budynek');
}

console.log('\n-- T6: kontrakt egzekucji AI/MP w main.ts --');
{
  const mainSource = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const aiUnitBranch = mainSource.slice(
    mainSource.indexOf("} else if (item.kind === 'jednostka')"),
    mainSource.indexOf('                  }\n                  continue;', mainSource.indexOf("} else if (item.kind === 'jednostka')")),
  );
  assert(aiUnitBranch.includes('purchaseRecruitmentUnit(cmd.cityId, candId, item.koszt, ownerId)'),
    'T6a: AI/MP jednostka → purchaseRecruitmentUnit');
  assert(!aiUnitBranch.includes('enqueue(prod0, item)'),
    'T6b: AI/MP NIE woła enqueue(prod0, item) dla jednostki');
  const captureBlock = mainSource.slice(
    mainSource.indexOf('P-AI-PANSTWA-MIASTA-REKRUTACJA-JAKO-BUDYNKI'),
    mainSource.indexOf('P-AI-PANSTWA-MIASTA-REKRUTACJA-JAKO-BUDYNKI') + 800,
  );
  assert(captureBlock.includes('sanitizeBuildQueue(prodCapture)'),
    'T6c: zdobycie miasta migruje legacy jednostki z kolejki Pracy');
}

console.log('\n-- T7: chooseCityProduction MP/AI planuje jednostki (egzekucja = zakup, nie Praca) --');
{
  const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
  const map = { width: 4, height: 4, hexes: {} };
  for (let q = 0; q < 4; q++) {
    for (let r = 0; r < 4; r++) {
      map.hexes[`${q},${r}`] = { q, r, terenBazowy: 'Równina', nakladka: 0 };
    }
  }
  const city = { id: 'mp1', ownerId: 7, q: 1, r: 1, name: 'MP', population: 4 };
  const data = {
    buildings: [
      { id: 'spichlerz', nazwa: 'Spichlerz' },
      { id: 'mury', nazwa: 'Mury' },
      { id: 'koszary', nazwa: 'Koszary' },
    ],
    units: [
      { Jednostka: 'Wojownik', Typ: 'Melee', Epoka: 'Kamień', Rola: 'Wręcz' },
      { Jednostka: 'Łucznik', Typ: 'Ranged', Epoka: 'Kamień', Rola: 'Dystans' },
    ],
    terrainYields: { terrain_types: [{ Teren: 'Równina', Zywnosc: 2, Praca: 1 }] },
    aiParams: {},
  };
  const diff = loadDifficultyParams(data, 2);
  const pick = chooseCityProduction('mp1', [city], [], 7, data, ZERO, {
    defensiveCopy: true,
    cityBuildings: { mp1: ['spichlerz'] },
    canAfford: () => true,
  }, map, diff);
  assert(pick === 'Wojownik' || pick === 'mury', 'T7a: MP defensiveCopy priorytet garnizon/mury');
  eq(shouldAIPurchaseUnit({
    atWar: false, treasury: 500, reserve: 100, goldCost: 40,
    hasManpower: true, boughtThisTurn: 0, maxPerTurn: 1,
  }), true, 'T7b: poza wojną AI kupuje jak gracz (wojna nie jest bramką)');
  eq(shouldAIPurchaseUnit({
    atWar: true, treasury: 500, reserve: 100, goldCost: 40,
    hasManpower: true, boughtThisTurn: 0, maxPerTurn: 1,
  }), true, 'T7c: w wojnie AI nadal kupuje przez tę samą bramkę Skarbca/Manpower');
}

console.log(`\nai-mp-rekrutacja-build-gate-test: ${passed} passed, ${failed} failed`);

try { fs.unlinkSync(entry); } catch (_) {}
try { fs.unlinkSync(bundle); } catch (_) {}

process.exit(failed > 0 ? 1 : 0);
