'use strict';
/**
 * fortifications-queue-cleanup-test.cjs
 *
 * R-WEB-FORTIFICATIONS-OLD-SAVE-QUEUE-CLEANUP-Q1 (W32) -- stare zapisy z kilkoma etapami lancucha
 * fortyfikacji (Palisada -> Mury kamienne -> Mury ceglane) W KOLEJCE produkcji.
 *   Q1 kolejka [palisada, mury_kamienne, mury] -> zostaje tylko najwyzszy (mury), dwa usuniete;
 *   Q2 wyzszy etap w MIESCIE zastepuje nizszy w kolejce (palisada usunieta, koszt bez zwrotu);
 *   Q3 wyzszy etap w kolejce zastepuje nizszy w kolejce, nizszy usuniety, wyzszy zostaje;
 *   Q4 pojedynczy etap / brak wyzszego -> bez zmian (ta sama referencja, zero usuniec);
 *   Q5 pozycje spoza lancucha (koszary, fort=Cytadela) nietkniete;
 *   Q6-Q8 petla po miastach (collapseFortificationQueuesInCities) -- zachowanie; Q9-Q10 wpiecie w main.ts -- statyczna weryfikacja.
 *
 * Usage (z gra/): node tools/fortifications-queue-cleanup-test.cjs
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
let pass = 0; let fail = 0;
function assert(c, m) { if (c) { pass++; console.log('  [OK]', m); } else { fail++; console.error('  [FAIL]', m); } }

const RUN = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT = path.join(os.tmpdir(), `fort-queue-${RUN}`);
fs.mkdirSync(OUT, { recursive: true });
process.on('exit', () => { try { fs.rmSync(OUT, { recursive: true, force: true }); } catch { /* best-effort */ } });

const G = GRA.replace(/\\/g, '/');
const entry = path.join(OUT, 'entry.ts');
fs.writeFileSync(entry, `
import * as P from '${G}/src/game/production';
export const collapseFortificationQueue = (P as any).collapseFortificationQueue;
export const collapseFortificationQueuesInCities = (P as any).collapseFortificationQueuesInCities;
`);
const outfile = path.join(OUT, 'bundle.cjs');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile, logLevel: 'silent', loader: { '.json': 'json' } });
const M = require(outfile);

const item = id => ({ kind: 'budynek', id, nazwa: id, koszt: 10 });
const prodOf = ids => ({ kolejka: ids.map(item), postep: 0 });
const ids = p => p.kolejka.map(i => i.id).join(',');
const removedIds = r => r.removed.map(i => i.id).join(',');

// Minimalny katalog lancucha (ta sama semantyka upgradeSkip/upgradeFrom co w buildings.json).
const buildings = [
  { id: 'palisada' },
  { id: 'mury_kamienne', upgradeFrom: 'palisada', upgradeSkip: true },
  { id: 'mury', upgradeFrom: 'mury_kamienne', upgradeSkip: true },
  { id: 'koszary' },
  { id: 'fort' },
];

console.log('\n=== Kolejka fortyfikacji w starym zapisie ===');
{
  const r = M.collapseFortificationQueue(prodOf(['palisada', 'mury_kamienne', 'mury']), [], buildings);
  assert(ids(r.prod) === 'mury' && removedIds(r) === 'palisada,mury_kamienne', 'Q1 kolejka [palisada, mury_kamienne, mury] -> zostaje mury, usunieto palisada+mury_kamienne');
}
{
  const r = M.collapseFortificationQueue(prodOf(['palisada']), ['mury'], buildings);
  assert(ids(r.prod) === '' && removedIds(r) === 'palisada', 'Q2 wyzszy etap w miescie (mury) -> palisada w kolejce usunieta bez zwrotu');
}
{
  const r = M.collapseFortificationQueue(prodOf(['mury_kamienne', 'palisada']), [], buildings);
  assert(ids(r.prod) === 'mury_kamienne' && removedIds(r) === 'palisada', 'Q3 kolejka [mury_kamienne, palisada] -> zostaje wyzszy mury_kamienne, palisada usunieta');
}
{
  const prod = prodOf(['palisada']);
  const r = M.collapseFortificationQueue(prod, [], buildings);
  assert(r.prod === prod && r.removed.length === 0, 'Q4 pojedynczy etap bez wyzszego -> ta sama referencja, zero usuniec');
}
{
  const r = M.collapseFortificationQueue(prodOf(['koszary', 'fort', 'palisada']), ['mury'], buildings);
  assert(ids(r.prod) === 'koszary,fort' && removedIds(r) === 'palisada', 'Q5 koszary i Cytadela (fort) nietkniete; tylko palisada (wyzszy mury w miescie) usunieta');
}

console.log('\n=== Petla po miastach przy wczytaniu ===');
{
  const cityProd = new Map([
    ['A', prodOf(['palisada', 'mury_kamienne', 'mury'])],
    ['B', prodOf(['palisada'])],
    ['C', prodOf(['koszary', 'palisada'])],
  ]);
  const cityBuilt = new Map([['B', ['mury']], ['C', []]]);
  const n = M.collapseFortificationQueuesInCities(cityProd, cityBuilt, buildings);
  assert(n === 3, 'Q6 licznik usunietych pozycji po wszystkich miastach = 3 (A: 2, B: 1, C: 0 -> wynik 3)');
  assert(ids(cityProd.get('A')) === 'mury' && ids(cityProd.get('B')) === '' && ids(cityProd.get('C')) === 'koszary,palisada', 'Q7 wpisy cityProd podmienione: A=mury, B=pusta, C bez zmian (brak wyzszego etapu)');
  const same = prodOf(['koszary']);
  const cp2 = new Map([['X', same]]);
  const n2 = M.collapseFortificationQueuesInCities(cp2, new Map(), buildings);
  assert(n2 === 0 && cp2.get('X') === same, 'Q8 brak usuniec -> zero i ta sama referencja w mapie');
}

console.log('\n=== Wpiecie w wczytywanie (main.ts) ===');
{
  const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
  assert(/collapseFortificationQueuesInCities,/.test(main) && /fortQueueCleanupNotice = collapseFortificationQueuesInCities\(cityProd, cityBuilt, data\.buildings\);/.test(main), 'Q9 w restoreGameFromSave: fortQueueCleanupNotice = collapseFortificationQueuesInCities(cityProd, cityBuilt, data.buildings) (po cityBuilt)');
  assert(/fortQueueCleanupNotice > 0/.test(main) && /zbędn/.test(main) && /Koszt i postęp nie zostały zwrócone/.test(main), 'Q10 jednorazowy komunikat po wczytaniu z tekstem o kosztach i postępie');
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
