'use strict';
/**
 * P-SUROWCE-BAZA-DREWNO-KAMIEŃ-GLINA-Q1
 *
 * Dokładne plony bazowe z samego terenu oraz osobny modyfikator rzeki.
 * Dane są statycznym katalogiem, nie stanem zapisu gry — save/load nie wymaga
 * migracji. Uruchom z gra/: node tools/terrain-base-resource-yields-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.terrain-base-resource-yields-entry.ts');
const bundle = path.join(__dirname, '.terrain-base-resource-yields-bundle.cjs');

fs.writeFileSync(entry, `
export { tileYield } from '../src/game/economy';
export { computeWorkedMagazynYieldsByCity } from '../src/game/turn-economy';
export { buildTerritoryNodesFromCities } from '../src/map/territory-work';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

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

const M = require(bundle);
let passed = 0;
let failed = 0;

function ok(condition, message) {
  if (condition) {
    passed++;
    console.log('PASS:', message);
  } else {
    failed++;
    console.error('FAIL:', message);
  }
}

function yields(terenBazowy, extra = {}) {
  return M.tileYield({
    terenBazowy,
    nakladka: M.Nakladka.Brak,
    maRzeke: false,
    ...extra,
  });
}

function resourceTriple(y) {
  return [y.drewno, y.kamien, y.glina];
}

const expected = [
  [M.TerenBazowy.Laka, [0, 0, 2], 'Łąka'],
  [M.TerenBazowy.Rownina, [5, 2, 0], 'Równina'],
  [M.TerenBazowy.Wzgorza, [5, 5, 5], 'Wzgórza'],
  [M.TerenBazowy.Gory, [0, 10, 0], 'Góry'],
];

for (const [terrain, wanted, label] of expected) {
  const got = resourceTriple(yields(terrain));
  ok(JSON.stringify(got) === JSON.stringify(wanted),
    `${label} bez ulepszenia/lasu/rzeki: Drewno/Kamień/Glina = ${wanted.join('/')}`);
}

// Edge case 1: rzeka jest osobnym modyfikatorem — tylko glina +5 (R-BALANS-PAKT-NIEAGRESJI-
// -I-GLINA-Q1, 2026-09-02: baza Łąki 5->2, bonus rzeki 10->5), bez zmiany bazowego
// Drewna/Kamienia i bez przenikania do suchego pola.
const dryMeadow = yields(M.TerenBazowy.Laka);
const riverMeadow = yields(M.TerenBazowy.Laka, { maRzeke: true });
ok(resourceTriple(dryMeadow).join(',') === '0,0,2',
  'edge 1: sucha Łąka zachowuje bazę 0/0/2');
ok(resourceTriple(riverMeadow).join(',') === '0,0,7',
  'edge 1: Rzeka dodaje wyłącznie +5 Gliny (0/0/7)');
ok(riverMeadow.drewno === dryMeadow.drewno && riverMeadow.kamien === dryMeadow.kamien,
  'edge 1: Rzeka nie zmienia Drewna ani Kamienia');

// Edge case 1b (R-BALANS-PAKT-NIEAGRESJI-I-GLINA-Q1, KRYTERIUM 4): Równina — teren
// NIETKNIĘTY tym zleceniem — przy rzece nadal daje wyłącznie Glina=5 (0 bazy + 5 bonus rzeki),
// dowód, że zmiana Łąki nie przecieka do innych terenów.
const riverEquina = yields(M.TerenBazowy.Rownina, { maRzeke: true });
ok(riverEquina.glina === 5,
  'edge 1b: Równina przy rzece: Glina = 5 (0 baza równiny + 5 bonus rzeki), teren nietknięty');

// Edge case 2: las i ulepszenie nie są częścią testu bazy, ale ich osobna
// warstwa nadal działa addytywnie względem nowych wartości bazowych.
const forestMeadow = yields(M.TerenBazowy.Laka, { nakladka: M.Nakladka.Las });
ok(forestMeadow.drewno > dryMeadow.drewno && forestMeadow.glina === dryMeadow.glina,
  'edge 2: Las zmienia Drewno, ale nie bazową Glinę');

// Realna produkcja: centrum miasta przechodzi przez cityWorkedTiles i trafia
// do magazynowego strumienia plonów, bez nakładki, ulepszenia i rzeki.
const city = {
  id: 'terrain-yield-city',
  ownerId: 0,
  q: 0,
  r: 0,
  name: 'Test',
  population: 1,
};
const map = {
  hexes: {
    '0,0': {
      coords: { q: 0, r: 0 },
      terenBazowy: M.TerenBazowy.Wzgorza,
      nakladka: M.Nakladka.Brak,
      rzeka: null,
    },
  },
};
const nodes = M.buildTerritoryNodesFromCities([city]);
const worked = M.computeWorkedMagazynYieldsByCity([city], map, nodes).get(city.id);
ok(worked && worked.drewno === 5 && worked.kamien === 5 && worked.glina === 5,
  'realna produkcja centrum Wzgórz trafia do magazynu jako 5/5/5');

console.log(`\nterrain-base-resource-yields-test: ${passed} pass, ${failed} fail`);
try { fs.unlinkSync(entry); } catch (_) {}
try { fs.unlinkSync(bundle); } catch (_) {}
process.exit(failed ? 1 : 0);
