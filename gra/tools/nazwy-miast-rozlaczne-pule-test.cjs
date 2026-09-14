'use strict';
/**
 * node tools/nazwy-miast-rozlaczne-pule-test.cjs
 * Bramka danych historycznego tematu nazw miast, zaktualizowana do wspólnej sekwencji.
 *
 * Pilnuje binarnych kryteriów wspólnego kontraktu:
 *  (K1) `miasta_cywilizacji[0]` = `Aszur` dla Asyrii i `Byblos` dla Fenicji, przy czym
 *       `Ninive` i `Tyr` NADAL są na swoich listach (tylko na dalszych pozycjach).
 *  (K2) 100 nazw cywilizacji + 10 istniejących nazw państw-miast tworzy jedną
 *       sekwencję `miasta_cywilizacji`, bez drugiego pola źródłowego.
 *  (K3) pierwszy element jest stolicą; suffix od indeksu 100 zachowuje nazwy
 *       państw-miast i nie może zwrócić indeksu 0.
 *  (K4) brak duplikatów w całej sekwencji.
 *  (K5) `civs.json:nazwyMiast` = wspólna sekwencja z puli.
 *
 * Bramka celowo czyta same dane (bez bundla) — jest odporna na zmiany w `src/`.
 */

const path = require('path');
const pools = require('../data/city-names-pools.json');
const civs = require('../data/civs.json');

let passed = 0;
let failed = 0;
function assert(cond, msg, detail) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg, detail === undefined ? '' : '→ ' + JSON.stringify(detail)); }
}

console.log('nazwy-miast-rozlaczne-pule-test (wspólna sekwencja nazw)\n');
console.log('-- (K1) pierwsze pozycje Asyrii i Fenicji --');

const PIERWSZE = { asyria: 'Aszur', fenicjanie: 'Byblos' };
const NADAL_OBECNE = { asyria: 'Ninive', fenicjanie: 'Tyr' };
for (const id of Object.keys(PIERWSZE)) {
  const cyw = (pools[id] || {}).miasta_cywilizacji || [];
  assert(cyw[0] === PIERWSZE[id], `(K1) ${id}: miasta_cywilizacji[0] = „${PIERWSZE[id]}"`, cyw[0]);
  const stara = NADAL_OBECNE[id];
  const idx = cyw.indexOf(stara);
  assert(idx > 0, `(K1) ${id}: „${stara}" nadal na liście, na dalszej pozycji`, idx);
}

console.log('\n-- (K2/K3/K4) wspólna sekwencja, liczności, duplikaty — WSZYSTKIE cywilizacje --');

const ids = Object.keys(pools);
assert(ids.length === 15, '(K3) 15 cywilizacji w puli', ids.length);

const zleDlugosci = [];
const duplikaty = [];
const drugieZrodla = [];
for (const id of ids) {
  const cyw = pools[id].miasta_cywilizacji || [];
  if (cyw.length !== 110) {
    zleDlugosci.push({ id, wspolna: cyw.length });
  }
  if (new Set(cyw).size !== cyw.length) duplikaty.push({ id, lista: 'miasta_cywilizacji' });
  if (Object.prototype.hasOwnProperty.call(pools[id], 'miasta_panstwa')) {
    drugieZrodla.push(id);
  }
}

assert(zleDlugosci.length === 0,
  '(K2/K3) dokładnie 110 nazw w jednej sekwencji per cywilizacja', zleDlugosci);
assert(duplikaty.length === 0,
  '(K4) brak duplikatów w całej wspólnej sekwencji', duplikaty);
assert(drugieZrodla.length === 0,
  '(K2) brak niezależnego pola miasta_panstwa', drugieZrodla);

console.log('\n-- (K5) synchronizacja civs.json:nazwyMiast --');

const rozjazd = (civs.cywilizacje || [])
  .filter((c) => c.ikonaId && pools[c.ikonaId])
  .filter((c) => JSON.stringify(c.nazwyMiast || []) !== JSON.stringify(pools[c.ikonaId].miasta_cywilizacji))
  .map((c) => c.ikonaId);
assert(rozjazd.length === 0, '(K5) civs.json:nazwyMiast = miasta_cywilizacji dla każdej cywilizacji', rozjazd);

console.log('\n' + passed + ' passed, ' + failed + ' failed  (' + path.basename(__filename) + ')');
process.exit(failed > 0 ? 1 : 0);
