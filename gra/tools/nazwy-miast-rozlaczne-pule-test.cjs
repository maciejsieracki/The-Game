'use strict';
/**
 * node tools/nazwy-miast-rozlaczne-pule-test.cjs
 * Bramka tematu R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1.
 *
 * Pilnuje czterech binarnych kryteriów końca tego tematu:
 *  (K1) `miasta_cywilizacji[0]` = `Aszur` dla Asyrii i `Byblos` dla Fenicji, przy czym
 *       `Ninive` i `Tyr` NADAL są na swoich listach (tylko na dalszych pozycjach).
 *  (K2) przecięcie `miasta_panstwa` z `miasta_cywilizacji` jest PUSTE dla każdej cywilizacji
 *       (wzorzec `chinczycy`: państwa-miasta to mniejsze ośrodki i państwa zależne,
 *       nie powtórki stolic).
 *  (K3) dokładnie 100 nazw w `miasta_cywilizacji` i dokładnie 10 w `miasta_panstwa` —
 *       kryterium anty-obejściowe: rozłączność NIE może być osiągnięta skróceniem listy.
 *  (K4) brak duplikatów wewnątrz każdej z list.
 *  (K5) `civs.json:nazwyKlastra` = `miasta_panstwa` (lustro wymuszane przez
 *       `validateCityNamesPools` w `src/game/civ-names.ts`).
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

console.log('nazwy-miast-rozlaczne-pule-test (R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1)\n');
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

console.log('\n-- (K2/K3/K4) rozłączność, liczności, duplikaty — WSZYSTKIE cywilizacje --');

const ids = Object.keys(pools);
assert(ids.length === 15, '(K3) 15 cywilizacji w puli', ids.length);

const kolizje = [];
const zleDlugosci = [];
const duplikaty = [];
for (const id of ids) {
  const cyw = pools[id].miasta_cywilizacji || [];
  const pan = pools[id].miasta_panstwa || [];
  const setCyw = new Set(cyw);
  const wspolne = pan.filter((n) => setCyw.has(n));
  if (wspolne.length) kolizje.push({ id, wspolne });
  if (cyw.length !== 100 || pan.length !== 10) {
    zleDlugosci.push({ id, cyw: cyw.length, pan: pan.length });
  }
  if (new Set(cyw).size !== cyw.length) duplikaty.push({ id, lista: 'miasta_cywilizacji' });
  if (new Set(pan).size !== pan.length) duplikaty.push({ id, lista: 'miasta_panstwa' });
}

assert(kolizje.length === 0,
  '(K2) przecięcie miasta_panstwa × miasta_cywilizacji puste dla każdej cywilizacji', kolizje);
assert(zleDlugosci.length === 0,
  '(K3) dokładnie 100 nazw cywilizacji i 10 nazw państw-miast per cywilizacja', zleDlugosci);
assert(duplikaty.length === 0,
  '(K4) brak duplikatów wewnątrz list', duplikaty);

console.log('\n-- (K5) lustro civs.json:nazwyKlastra --');

const rozjazd = (civs.cywilizacje || [])
  .filter((c) => c.ikonaId && pools[c.ikonaId])
  .filter((c) => JSON.stringify(c.nazwyKlastra || []) !== JSON.stringify(pools[c.ikonaId].miasta_panstwa))
  .map((c) => c.ikonaId);
assert(rozjazd.length === 0, '(K5) civs.json:nazwyKlastra = miasta_panstwa dla każdej cywilizacji', rozjazd);

console.log('\n' + passed + ' passed, ' + failed + ' failed  (' + path.basename(__filename) + ')');
process.exit(failed > 0 ? 1 : 0);
