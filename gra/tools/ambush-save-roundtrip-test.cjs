'use strict';
/**
 * R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (runda 2, zarzut 4): test przez PRAWDZIWE serializeGame /
 * deserializeGame -- pole `ambush` przetrwa zapis i wczytanie; stary zapis bez pola jest OK;
 * śmieci w polu są normalizowane do „brak zasadzki”. Uruchomienie: node gra/tools/ambush-save-roundtrip-test.cjs
 */
const path = require('path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.resolve(__dirname, '.ambush-save-roundtrip-bundle.cjs');
let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log('PASS: ' + name);
  } catch (e) {
    fail++;
    console.log('FAIL: ' + name + ' -- ' + (e && e.message ? e.message : String(e)));
  }
}

esbuild.buildSync({
  entryPoints: [path.join(GRA, 'src/game/save.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});
const { serializeGame, deserializeGame } = require(BUNDLE);

const unit = (over) => Object.assign({
  id: 'u1', typeId: 'Piechota', ownerId: 0, q: 3, r: 4, hp: 10, ruchLeft: 2, isGeneral: true,
}, over);
const makeSave = (units) => ({
  wersja: 3, tura: 12, seed: 7, units, cities: [], exploredByHuman: [], gracze: [],
  humanOwnerIds: [0], activeHumanOwnerId: 0, meta: {},
});

check('pole ambush=true przetrwa serializeGame -> deserializeGame', () => {
  const back = deserializeGame(serializeGame(makeSave([unit({ ambush: true, ruchLeft: 0 })])));
  assert.equal(back.units.length, 1);
  assert.equal(back.units[0].ambush, true);
  assert.equal(back.units[0].ruchLeft, 0);
});

check('jednostka bez zasadzki nie dostaje pola po zapisie i wczytaniu', () => {
  const back = deserializeGame(serializeGame(makeSave([unit({})])));
  assert.equal(back.units[0].ambush, undefined);
  assert.equal('ambush' in back.units[0], false);
});

check('stary zapis bez pola ambush wczytuje się bez zasadzki', () => {
  const json = JSON.stringify(makeSave([unit({})]));
  const back = deserializeGame(json);
  assert.equal(back.units[0].ambush, undefined);
  assert.equal(back.units[0].hp, 10);
});

check('śmieci w polu ambush (null, liczba, napis, false) normalizowane do braku zasadzki', () => {
  for (const junk of [null, 1, 'yes', false]) {
    const back = deserializeGame(serializeGame(makeSave([unit({ ambush: junk })])));
    assert.equal(back.units[0].ambush, undefined, 'junk=' + String(junk));
  }
});

check('zasadzka stosu (dwie jednostki) przetrwa razem przez realny zapis', () => {
  const back = deserializeGame(serializeGame(makeSave([
    unit({ id: 'a', ambush: true, ruchLeft: 0 }),
    unit({ id: 'b', ambush: true, ruchLeft: 0 }),
    unit({ id: 'c', ruchLeft: 2 }),
  ])));
  assert.deepEqual(back.units.map(u => u.ambush === true), [true, true, false]);
});

// R-WEB-ARMY-AMBUSH-REQUIRES-GENERAL-Q1 (zarzut Evaluatora 4): stary zapis z zasadzka stosu BEZ generala
// przechodzi przez PRAWDZIWE deserializeGame, a potem przez reconcileAmbushInWorld (ten sam krok, co main.ts:15325)
// i zasadzka wygasa dla calego stosu; stos z generalem zostaje zastawiony.
const AMB_BUNDLE = path.resolve(__dirname, '.ambush-save-roundtrip-ambush-bundle.cjs');
esbuild.buildSync({
  entryPoints: [path.join(GRA, 'src/game/ambushMove.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: AMB_BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});
const { reconcileAmbushInWorld } = require(AMB_BUNDLE);

check('stary zapis: stos z zasadzka bez generala wygasa przy reconcile po wczytaniu', () => {
  const back = deserializeGame(JSON.stringify(makeSave([
    unit({ id: 'a', ambush: true, ambushAt: '3,4,0', ruchLeft: 0, isGeneral: false }),
    unit({ id: 'b', ambush: true, ambushAt: '3,4,0', ruchLeft: 0, isGeneral: false }),
  ])));
  const cleared = reconcileAmbushInWorld(back.units, []);
  assert.equal(cleared, 2);
  assert.deepEqual(back.units.map(u => u.ambush), [undefined, undefined]);
  assert.deepEqual(back.units.map(u => 'ambushAt' in u), [false, false]);
});

check('stary zapis: stos z zasadzka Z generalem zostaje zastawiony po reconcile', () => {
  const back = deserializeGame(JSON.stringify(makeSave([
    unit({ id: 'g', ambush: true, ambushAt: '3,4,0', ruchLeft: 0, isGeneral: true }),
    unit({ id: 'p', ambush: true, ambushAt: '3,4,0', ruchLeft: 0, isGeneral: false }),
  ])));
  const cleared = reconcileAmbushInWorld(back.units, []);
  assert.equal(cleared, 0);
  assert.deepEqual(back.units.map(u => u.ambush), [true, true]);
});

console.log('Wynik: ' + pass + ' OK, ' + fail + ' FAIL');
if (fail > 0) process.exit(1);
