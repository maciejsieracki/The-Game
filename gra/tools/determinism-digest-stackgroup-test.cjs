'use strict';
/**
 * determinism-digest-stackgroup-test.cjs — R-WEB-DETERMINISM-DIGEST-NORMALIZE-STACKGROUP-Q1.
 *
 * Test jednostkowy normalizacji digestu (src/game/det-digest-normalize.ts) w Node. Modul jest bundlowany
 * esbuildem W PAMIECI (bez zapisu do repo). Sprawdza:
 *  (a) dwie listy jednostek roznigce sie TYLKO identyfikatorem stackGroupId (Date.now-owym) daja ten sam
 *      znormalizowany JSON (= ten sam digest), a surowe JSON-y sie roznia (przeslanka testu);
 *  (b) rozna struktura grup (te same/rozne grupy) daje INNY znormalizowany JSON;
 *  (c) relacja rownosci zachowana (dwie jednostki w jednej grupie -> ten sam indeks), takze miasta
 *      (siegeArmyGroupId) dostaja ten sam indeks co jednostka tej samej armii;
 *  (d) wejscie nie jest modyfikowane; kolejnosc tablicy zachowana; pola bez stackGroupId bez zmian.
 *
 * Dowod mutacyjny: MODULE_SRC=<abs.ts> wskazuje wariant modulu (np. z normalizacja cofnieta do tozsamosci);
 * wtedy test (a) musi byc CZERWONY (exit 1).
 *
 * Usage (z gra/): node tools/determinism-digest-stackgroup-test.cjs
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const assert = require('assert');

const GRA_DIR = path.resolve(__dirname, '..');
const SRC = process.env.MODULE_SRC || path.join(GRA_DIR, 'src', 'game', 'det-digest-normalize.ts');
const esbuild = require('esbuild');

function loadModule(srcPath) {
  const out = esbuild.buildSync({ entryPoints: [srcPath], bundle: true, format: 'cjs', platform: 'node', write: false, target: 'es2020' });
  const m = new Module(srcPath, null);
  m.filename = srcPath;
  m.paths = Module._nodeModulePaths(path.dirname(srcPath));
  m._compile(out.outputFiles[0].text, srcPath);
  return m.exports;
}

const { normalizeDetDigestStackGroups } = loadModule(SRC);

/** Stan jak w grze: units ze stackGroupId (Date.now-owym) + miasto z siegeArmyGroupId. Parametr `tag` zmienia tylko czas. */
function makeState(tag, layout) {
  const gid = (name) => 'sg0_' + tag + '_' + name;
  const units = [
    { id: 'u10', ownerId: 0, typeId: 'Piechota', q: 1, r: 2, hp: 10, stackGroupId: gid(layout.a) },
    { id: 'u2', ownerId: 0, typeId: 'Lucznik', q: 1, r: 2, hp: 7, stackGroupId: gid(layout.b) },
    { id: 'u7', ownerId: 1, typeId: 'Konnica', q: 4, r: 5, hp: 9 },
  ];
  const cities = [{ id: 'c1', ownerId: 1, siegeArmyGroupId: gid(layout.c) }, { id: 'c2', ownerId: 0 }];
  return { units, cities };
}

function digestOf(state) {
  const n = normalizeDetDigestStackGroups(state.units, state.cities);
  return JSON.stringify({ units: n.units, cities: n.cities });
}

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('PASS ' + name); } catch (e) { failures++; console.log('FAIL ' + name + ' :: ' + String(e.message).split('\n')[0]); }
}

// (a) identyczna struktura, inny czas (Date.now) -> ten sam digest; surowe JSON-y roznia sie.
check('(a) ten sam stan z innym Date.now daje identyczny znormalizowany digest', () => {
  const s1 = makeState('m1abc', { a: 'x1', b: 'x1', c: 'x1' });
  const s2 = makeState('m9zzz', { a: 'x1', b: 'x1', c: 'x1' });
  assert.notStrictEqual(JSON.stringify({ units: s1.units, cities: s1.cities }), JSON.stringify({ units: s2.units, cities: s2.cities }), 'przeslanka: surowe JSON-y powinny sie roznic');
  assert.strictEqual(digestOf(s1), digestOf(s2));
});

// (b) inna struktura grup -> inny digest.
check('(b) inna struktura grup (rozne armie) daje inny digest', () => {
  const same = makeState('t1', { a: 'g', b: 'g', c: 'g' });   // u10 i u2 w jednej grupie
  const diff = makeState('t1', { a: 'g', b: 'h', c: 'g' });   // u2 w innej grupie
  assert.notStrictEqual(digestOf(same), digestOf(diff));
});

// (c) relacja rownosci zachowana, miasto dzieli indeks z armia.
check('(c) relacja rownosci: ta sama grupa -> ten sam indeks, miasto z armia wspoldzieli indeks', () => {
  const s = makeState('t2', { a: 'g', b: 'g', c: 'g' });
  const n = normalizeDetDigestStackGroups(s.units, s.cities);
  assert.strictEqual(n.units[0].stackGroupId, n.units[1].stackGroupId);
  assert.strictEqual(n.cities[0].siegeArmyGroupId, n.units[0].stackGroupId);
  assert.ok(/^g\d+$/.test(n.units[0].stackGroupId));
});

// (d) wejscie nietkniete, kolejnosc tablicy zachowana, pola bez stackGroupId bez zmian.
check('(d) wejscie niemodyfikowane, kolejnosc i pola bez stackGroupId zachowane', () => {
  const s = makeState('t3', { a: 'p', b: 'q', c: 'p' });
  const before = JSON.stringify(s);
  const n = normalizeDetDigestStackGroups(s.units, s.cities);
  assert.strictEqual(JSON.stringify(s), before, 'wejscie zmienione');
  assert.deepStrictEqual(n.units.map(u => u.id), ['u10', 'u2', 'u7']);
  assert.strictEqual('stackGroupId' in n.units[2], false);
  assert.deepStrictEqual(Object.keys(n.units[0]), Object.keys(s.units[0]));
});

// (e) numeracja idzie po stabilnie posortowanym id, nie po kolejnosci tablicy. Mutant numerujacy w kolejnosci
// tablicy daje inne etykiety i ten test pada. Id tekstowe: porownanie leksykalne ('u10' < 'u2'); liczbowe: numeryczne.
check('(e) numeracja grup idzie po id jednostek (sortowanie stabilne), nie po kolejnosci tablicy', () => {
  // Id tekstowe, tablica w kolejnosci [u2, u10]: po sortowaniu leksykalnym u10 idzie pierwsze -> sgA (u10) = g0.
  const txt = normalizeDetDigestStackGroups(
    [{ id: 'u2', stackGroupId: 'sgB_1' }, { id: 'u10', stackGroupId: 'sgA_1' }], []);
  assert.strictEqual(txt.units[1].stackGroupId, 'g0', 'u10 (leksykalnie pierwsze) powinno dostac g0');
  assert.strictEqual(txt.units[0].stackGroupId, 'g1', 'u2 powinno dostac g1');
  // Id liczbowe, tablica w kolejnosci [10, 2]: numerycznie 2 idzie pierwsze -> sgB (id 2) = g0.
  const num = normalizeDetDigestStackGroups(
    [{ id: 10, stackGroupId: 'sgA_1' }, { id: 2, stackGroupId: 'sgB_1' }], []);
  assert.strictEqual(num.units[1].stackGroupId, 'g0', 'id 2 (numerycznie pierwsze) powinno dostac g0');
  assert.strictEqual(num.units[0].stackGroupId, 'g1', 'id 10 powinno dostac g1');
});

if (failures) {
  console.log('determinism-digest-stackgroup-test: CZERWONY (' + failures + ' FAIL)');
  process.exit(1);
}
console.log('determinism-digest-stackgroup-test: ZIELONY (5/5)');
