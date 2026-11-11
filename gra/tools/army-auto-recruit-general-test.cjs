'use strict';
// R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1: rekrutacja z panelu Rekrutacja tylko z wybranym generałem;
// nowe jednostki idą do WYBRANEGO generała; śmierć generała; zapis; rekrutacja ręczna nietknięta.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const built = esbuild.buildSync({
  stdin: { contents: "export * from './src/game/recruit-general.ts'; export * from './src/game/production.ts'; export { serializeGame, deserializeGame } from './src/game/save.ts';", resolveDir: root, sourcefile: 'auto-recruit-general-entry.ts' },
  bundle: true, platform: 'node', format: 'cjs', target: 'es2020', write: false, logLevel: 'silent',
});
const mod = { exports: {} };
new Function('module', 'exports', built.outputFiles[0].text)(mod, mod.exports);
const { livingGeneralsOf, resolveRecruitGeneral, recruitRallyStamp, pickRallyGeneral, enqueueRecruitment, advanceRecruitmentGated,
  recruitFollowGeneralForOrder, serializeGame, deserializeGame } = mod.exports;

let pass = 0;
const ok = label => { pass += 1; console.log(`PASS ${label}`); };

const G1 = { id: 'g1', ownerId: 0, q: 1, r: 1, isGeneral: true, hp: 10 };
const G2 = { id: 'g2', ownerId: 0, q: 9, r: 9, isGeneral: true, hp: 10 };
const ENEMY_G = { id: 'eg', ownerId: 1, q: 0, r: 0, isGeneral: true, hp: 10 };
const SOLDIER = { id: 's1', ownerId: 0, q: 5, r: 5, hp: 10 };
const units = [G2, SOLDIER, G1, ENEMY_G];

// 1. Lista i rozstrzyganie wyboru.
assert.deepEqual(livingGeneralsOf(units, 0).map(g => g.id), ['g1', 'g2']); ok('only own living generals are listed (sorted, no enemy, no soldiers)');
assert.deepEqual(livingGeneralsOf([{ ...G1, hp: 0 }, { ...G2, dead: true }, { ...G2, id: 'g3', removed: true }], 0), []); ok('dead/removed generals are not listed');
assert.equal(resolveRecruitGeneral(null, units, 0).status, 'none'); ok('no selection -> none (panel recruiting disabled)');
assert.equal(resolveRecruitGeneral(undefined, units, 0).status, 'none'); ok('undefined selection -> none');
assert.equal(resolveRecruitGeneral('g2', units, 0).status, 'ok'); ok('living own general -> ok');
assert.equal(resolveRecruitGeneral('eg', units, 0).status, 'lost'); ok('enemy general cannot be the recruiting general');
assert.equal(resolveRecruitGeneral('s1', units, 0).status, 'lost'); ok('non-general unit cannot be the recruiting general');
assert.equal(resolveRecruitGeneral('g1', [G2, SOLDIER], 0).status, 'lost'); ok('general that died/vanished -> lost (caller clears selection + notifies)');

// 2. Stempel zamówienia i cel marszu.
assert.deepEqual(recruitRallyStamp('g2'), { followGeneral: true, rallyGeneralId: 'g2' }); ok('panel order stamp = follow + chosen general id');
const nearestFallback = () => G1;
assert.equal(pickRallyGeneral({ ownerId: 0, rallyGeneralId: 'g2' }, units, nearestFallback).id, 'g2'); ok('recruit with rally id goes to the CHOSEN general, not the nearest');
assert.equal(pickRallyGeneral({ ownerId: 0 }, units, nearestFallback).id, 'g1'); ok('manual recruit (no rally id) keeps the nearest-general rule');
assert.equal(pickRallyGeneral({ ownerId: 0, rallyGeneralId: 'g2' }, [G1, SOLDIER], nearestFallback).id, 'g1'); ok('chosen general dead at spawn -> falls back to nearest');
assert.equal(pickRallyGeneral({ ownerId: 0, rallyGeneralId: 'eg' }, units, nearestFallback).id, 'g1'); ok('rally id of a foreign general is ignored');

// 3. Zamówienie ręczne nietknięte (origin city = OFF, army = przełącznik).
assert.equal(recruitFollowGeneralForOrder('city', true), false); ok('manual city order unchanged');
assert.equal(recruitFollowGeneralForOrder('army', true), true); ok('manual Army order unchanged');

// 4. Intencja trwa w kolejce do zrodzenia.
const base = { kind: 'jednostka', id: 'Lucznik', nazwa: 'Łucznik', koszt: 10 };
let prod = { kolejka: [], postep: 0 };
prod = enqueueRecruitment(prod, { ...base, ...recruitRallyStamp('g2') });
prod = enqueueRecruitment(prod, { ...base, followGeneral: false });
const spawned = advanceRecruitmentGated(prod, { population: 10, manpower: 10 }, 1, 2, true);
assert.deepEqual(spawned.completed.map(it => it.rallyGeneralId), ['g2', undefined]); ok('rallyGeneralId survives the recruitment queue; manual item has none');

// 5. Zapis/wczytanie.
const snapshot = { wersja: 3, tura: 1, units: [], cities: [], exploredByHuman: [], gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0,
  recruitGeneralId: 'g2',
  cityProd: { c1: { kolejka: [], postep: 0, rekrutacja: [{ ...base, ...recruitRallyStamp('g2') }] } } };
const loaded = deserializeGame(serializeGame(snapshot));
assert.equal(loaded.recruitGeneralId, 'g2'); ok('save roundtrip keeps the chosen recruiting general');
assert.equal(loaded.cityProd.c1.rekrutacja[0].rallyGeneralId, 'g2'); ok('save roundtrip keeps queued rally general id');
const legacy = deserializeGame(JSON.stringify({ ...snapshot, recruitGeneralId: undefined, wersja: 3 }));
assert.equal(legacy.recruitGeneralId, undefined); ok('legacy save: no chosen general (panel recruiting disabled until chosen; no silent change)');

// 6. Kontrakt wiązania w main.ts / panelu.
const mainSrc = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
const panelSrc = fs.readFileSync(path.join(root, 'src/ui/empireRecruitPanel.ts'), 'utf8');
const ordStart = mainSrc.indexOf('function orderEmpireRecruitment(');
const ordBody = mainSrc.slice(ordStart, mainSrc.indexOf('function empireRecruitCityKoszt(', ordStart));
assert.match(ordBody, /const rallyId = validateRecruitGeneral\(\);\s*if \(!rallyId\) \{\s*return \{ message:/); ok('orderEmpireRecruitment is gated by a chosen living general');
assert.match(ordBody, /rallyGeneralId: rallyId/); ok('orderEmpireRecruitment passes the chosen general into every purchase');
assert.match(mainSrc, /recruitGeneralId = null; \/\/ R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1/); ok('new game clears the selection');
assert.match(mainSrc, /recruitGeneralId = saved\.recruitGeneralId \?\? null;/); ok('load restores the selection');
assert.match(mainSrc, /\.\.\.\(recruitGeneralId \? \{ recruitGeneralId \} : \{\}\)/); ok('save writes the selection');
assert.match(mainSrc, /pickRallyGeneral\(u, units, \(\) => pickNearestLeaderForUnit\(u\)\)/); ok('spawn march targets the chosen general');
assert.match(panelSrc, /recruitingBlockedByGeneral/); ok('panel disables Rekrutuj without a chosen general');
assert.match(panelSrc, /rekrutuje/); ok('panel marks the recruiting general');
console.log(`\n${pass} assertions passed`);
