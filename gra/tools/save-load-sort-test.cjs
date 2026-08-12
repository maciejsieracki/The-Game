'use strict';
/**
 * save-load-sort-test.cjs — sortowanie listy zapisów w dialogu Wczytaj
 * (compareSaveSlotsDesc w saveLoadDialog.ts).
 *   node tools/save-load-sort-test.cjs
 *
 * Pokrywa: (a) normalne sortowanie po savedAt malejąco -- bez regresji;
 * (b) przypadek brzegowy -- dwa zapisy BEZ savedAt (stare zapisy sprzed
 * wprowadzenia tego pola) sortują się deterministycznie wg numeru tury
 * (malejąco), zamiast losowo/wg kolejności wejściowej.
 * / EN: covers (a) normal savedAt-descending sort -- no regression;
 * (b) edge case -- two saves WITHOUT savedAt (old saves predating that
 * field) sort deterministically by turn number (descending), instead of
 * randomly / by input order.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.save-load-sort-entry.ts');
const OUT = path.join(__dirname, '.save-load-sort-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  "export { compareSaveSlotsDesc } from '../src/ui/saveLoadDialog.ts';\n",
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const { compareSaveSlotsDesc } = require(OUT);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function slot(overrides) {
  return {
    slotId: 'slot',
    label: 'slot',
    tura: 1,
    savedAt: '',
    context: '',
    ...overrides,
  };
}

// --- (a) normalne sortowanie po savedAt malejąco -- bez regresji ---------
{
  const a = slot({ slotId: 'a', savedAt: '2026-08-01T10:00:00.000Z', tura: 5 });
  const b = slot({ slotId: 'b', savedAt: '2026-08-05T10:00:00.000Z', tura: 3 });
  const c = slot({ slotId: 'c', savedAt: '2026-08-03T10:00:00.000Z', tura: 40 });
  const sorted = [a, b, c].sort(compareSaveSlotsDesc);
  assert(
    sorted.map((s) => s.slotId).join(',') === 'b,c,a',
    'savedAt malejąco: oczekiwano b,c,a, otrzymano ' + sorted.map((s) => s.slotId).join(','),
  );
}

// Zapis z savedAt zawsze przed zapisem bez savedAt (niezależnie od tury).
{
  const dated = slot({ slotId: 'dated', savedAt: '2026-01-01T00:00:00.000Z', tura: 1 });
  const undated = slot({ slotId: 'undated', savedAt: '', tura: 999 });
  const sorted = [undated, dated].sort(compareSaveSlotsDesc);
  assert(
    sorted.map((s) => s.slotId).join(',') === 'dated,undated',
    'dated zawsze przed undated, otrzymano ' + sorted.map((s) => s.slotId).join(','),
  );
}

// --- (b) dwa zapisy BEZ savedAt -- sortowanie deterministyczne wg tury ---
{
  const old1 = slot({ slotId: 'old-tura-3', savedAt: '', tura: 3 });
  const old2 = slot({ slotId: 'old-tura-20', savedAt: '', tura: 20 });
  const old3 = slot({ slotId: 'old-tura-11', savedAt: '', tura: 11 });
  // Kolejność wejściowa celowo "z losowego porządku" -- wynik MUSI być
  // stały niezależnie od kolejności wejściowej (deterministyczny wg tury).
  const sortedA = [old1, old2, old3].sort(compareSaveSlotsDesc);
  const sortedB = [old2, old3, old1].sort(compareSaveSlotsDesc);
  const expected = 'old-tura-20,old-tura-11,old-tura-3';
  assert(
    sortedA.map((s) => s.slotId).join(',') === expected,
    'undated wg tury malejąco (A): oczekiwano ' + expected + ', otrzymano ' + sortedA.map((s) => s.slotId).join(','),
  );
  assert(
    sortedB.map((s) => s.slotId).join(',') === expected,
    'undated wg tury malejąco (B, inna kolejność wejściowa): oczekiwano ' + expected + ', otrzymano ' + sortedB.map((s) => s.slotId).join(','),
  );
}

// Mieszana lista: dated + undated razem -- dated zawsze na górze (malejąco
// wg daty), undated na dole posortowane wg tury (malejąco).
{
  const d1 = slot({ slotId: 'd1', savedAt: '2026-08-01T00:00:00.000Z', tura: 1 });
  const d2 = slot({ slotId: 'd2', savedAt: '2026-08-09T00:00:00.000Z', tura: 2 });
  const u1 = slot({ slotId: 'u1', savedAt: '', tura: 7 });
  const u2 = slot({ slotId: 'u2', savedAt: '', tura: 15 });
  const sorted = [u1, d1, u2, d2].sort(compareSaveSlotsDesc);
  const expected = 'd2,d1,u2,u1';
  assert(
    sorted.map((s) => s.slotId).join(',') === expected,
    'lista mieszana: oczekiwano ' + expected + ', otrzymano ' + sorted.map((s) => s.slotId).join(','),
  );
}

console.log('save-load-sort-test: OK (4/4)');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(OUT); } catch { /* ignore */ }
