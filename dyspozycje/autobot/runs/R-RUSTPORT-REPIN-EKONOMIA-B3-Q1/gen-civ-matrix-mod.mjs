// REPIN-EKONOMIA-B3 (R2, zarzut Evaluatora nr 2): generator fixture civ_matrix_mod.json.
// Wejscie: PRAWDZIWA macierz z weba 91dc998a (gra/data/civ-matrix.json, kopia w rust-port/engine/data/civ-matrix.json).
// Wyjscie: ta sama macierz z 9 podniesionymi komorkami `params` (3 cywilizacje x 3 parametry),
// formatowanie JSON.stringify(_, null, 1) bez koncowego newline (jak commitowany plik).
// Uruchomienie (Node 22, z katalogu tego runu):
//   node ./gen-civ-matrix-mod.mjs <realna civ-matrix.json> <wyjscie civ_matrix_mod.json>
// Weryfikacja: wynik musi byc bajt-w-bajt identyczny z tests/p6_repin_b3_vectors/civ_matrix_mod.json (cmp).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve as presolve } from 'node:path';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) throw new Error('uzycie: node gen-civ-matrix-mod.mjs <in> <out>');
const m = JSON.parse(readFileSync(presolve(inPath), 'utf8'));

// [cywilizacja, parametr, wartosc_realna_oczekiwana, wartosc_mod]
const CHANGES = [
  ['Grecy', 'eko_pieniadz_port_proc', 0.15, 0.4],
  ['Grecy', 'wealth_cap_proc', 0, 0.2],
  ['Grecy', 'wealth_mnoznik_proc', 0, -0.3],
  ['Rzymianie', 'eko_pieniadz_port_proc', 0, 0.4],
  ['Rzymianie', 'wealth_cap_proc', 0, 0.2],
  ['Rzymianie', 'wealth_mnoznik_proc', 0, -0.3],
  ['Inkowie', 'eko_pieniadz_port_proc', 0, 0.4],
  ['Inkowie', 'wealth_cap_proc', 0, 0.2],
  ['Inkowie', 'wealth_mnoznik_proc', 0, -0.3],
];

for (const [civ, key, expected, next] of CHANGES) {
  const row = m.cywilizacje.find((r) => r.Cywilizacja === civ);
  if (!row) throw new Error(`brak cywilizacji ${civ}`);
  if (row.params[key] !== expected) throw new Error(`${civ}.${key}: oczekiwano ${expected}, jest ${row.params[key]}`);
  row.params[key] = next;
}
writeFileSync(presolve(outPath), JSON.stringify(m, null, 1));
console.log(`zmienionych komorek: ${CHANGES.length}`);
