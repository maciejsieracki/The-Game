'use strict';
/**
 * node gra/tools/terrain-names-equivalence-test.cjs
 * R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1: dowód równoważności — jedno źródło (src/map/terrain-names.ts)
 * zwraca dokładnie te same mapy, co cztery dawne kopie (snapshot literałów z przed zmiany:
 * ui/hexContextTooltip.ts TEREN_LABEL, map/minimap.ts TEREN_KEY, game/economy.ts TERRAIN_NAME_TO_ENUM,
 * units/setup.ts TERRAIN_MOVEMENT_KEY_ALIASES). Dodatkowo: każdy wpis etykiety z data/terrain-yields.json
 * i każdy klucz data/terrain-movement.json rozwiązuje się tak samo jak przed zmianą.
 * Esbuild bundle w katalogu tymczasowym (bez buildu w gra/).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'terrain-names-eq-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export * from ${JSON.stringify(path.join(GRA, 'src/map/terrain-names.ts'))};
export { TerenBazowy } from ${JSON.stringify(path.join(GRA, 'src/types/hex.ts'))};
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
const { TerenBazowy } = M;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL:', m); } };
const sameMap = (a, b) => {
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
};

// Snapshot dawnych kopii (przed R-WEB-TERRAIN-ID-NAME-MAP-UNIFY-Q1).
const OLD_TEREN_LABEL = {
  laka: 'Łąka', rownina: 'Równina', wzgorza: 'Wzgórza', gory: 'Góry',
  plytkie_morze: 'Płytkie morze', morze: 'Morze', pustynia: 'Pustynia', polarny: 'Polarny',
};
const OLD_TEREN_KEY = {
  laka: 'Laka', rownina: 'Rownina', wzgorza: 'Wzgorza', gory: 'Gory',
  plytkie_morze: 'Wybrzeze', morze: 'Morze', pustynia: 'Pustynia', polarny: 'Polarny',
};
const OLD_DANE_LABEL = {
  'Łąka': 'laka', 'Równina': 'rownina', 'Wzgórza': 'wzgorza', 'Góry': 'gory',
  'Wybrzeże': 'plytkie_morze', 'Morze': 'morze', 'Pustynia': 'pustynia', 'Polarny': 'polarny',
};
const OLD_MOVEMENT_ALIASES = {
  Laka: 'laka', 'Łąka': 'laka', laka: 'laka',
  Rownina: 'rownina', 'Równina': 'rownina', rownina: 'rownina',
  Pustynia: 'pustynia', pustynia: 'pustynia',
  Wybrzeze: 'plytkie_morze', 'Wybrzeże': 'plytkie_morze', wybrzeze: 'plytkie_morze',
  Wzgorza: 'wzgorza', 'Wzgórza': 'wzgorza', wzgorza: 'wzgorza',
  Gory: 'gory', 'Góry': 'gory', gory: 'gory',
  Morze: 'morze', morze: 'morze',
  Polarny: 'polarny', polarny: 'polarny',
};

const allIds = Object.values(TerenBazowy);
ok(allIds.length === 8, `enum TerenBazowy ma 8 wartości (jest ${allIds.length})`);

// 1. Etykiety UI, klucz = id.
const labelNew = {};
for (const id of allIds) labelNew[id] = M.TEREN_LABEL_PL[id];
ok(sameMap(labelNew, OLD_TEREN_LABEL), 'TEREN_LABEL_PL == dawny TEREN_LABEL (hexContextTooltip)');

// 2. Klucze minimapy, klucz = id.
const keyNew = {};
for (const id of allIds) keyNew[id] = M.TEREN_MINIMAP_KEY[id];
ok(sameMap(keyNew, OLD_TEREN_KEY), 'TEREN_MINIMAP_KEY == dawny TEREN_KEY (minimap)');

// 3. Etykieta danych -> id (dokładne dopasowanie, economy).
const danePairs = Object.fromEntries(Object.entries(M.TEREN_DANE_LABEL_TO_ENUM));
ok(sameMap(danePairs, OLD_DANE_LABEL), 'TEREN_DANE_LABEL_TO_ENUM == dawny TERRAIN_NAME_TO_ENUM (economy)');

// 4. Aliasy kosztów ruchu (setup).
const aliasPairs = Object.fromEntries(Object.entries(M.TEREN_MOVEMENT_KEY_ALIASES));
ok(sameMap(aliasPairs, OLD_MOVEMENT_ALIASES), 'TEREN_MOVEMENT_KEY_ALIASES == dawny TERRAIN_MOVEMENT_KEY_ALIASES (setup)');

// 5. Każda etykieta z terrain-yields.json rozwiązuje się tak samo jak przed zmianą.
const yields = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-yields.json'), 'utf8'));
for (const row of yields.terrain_types) {
  const got = M.TEREN_DANE_LABEL_TO_ENUM[row.Teren];
  const want = OLD_DANE_LABEL[row.Teren];
  ok(got === want, `terrain-yields "${row.Teren}" -> ${got} (oczekiwano ${want})`);
}

// 6. Każdy klucz terrain-movement.json rozwiązuje się tak samo jak przed zmianą (ta sama kolejność: wpis w _terrainCosts, potem alias).
const movement = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-movement.json'), 'utf8'));
const enumVals = new Set(allIds);
for (const k of Object.keys(movement.costs)) {
  const got = enumVals.has(k) ? k : M.TEREN_MOVEMENT_KEY_ALIASES[k];
  const want = enumVals.has(k) ? k : OLD_MOVEMENT_ALIASES[k];
  ok(got === want, `terrain-movement klucz "${k}" -> ${got} (oczekiwano ${want})`);
}

// 7. Mapy są zamrożone / klucze spoza mapy nie dają wpisu (zgodnie ze starym zwykłym obiektem).
ok(M.TEREN_DANE_LABEL_TO_ENUM['Płytkie morze'] === undefined, 'etykieta danych "Płytkie morze" nie istnieje (jak dawniej)');
ok(M.TEREN_MOVEMENT_KEY_ALIASES['plytkie_morze'] === undefined, 'alias "plytkie_morze" nie istnieje w aliasach (jak dawniej)');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`terrain-names-equivalence: PASS=${pass} FAIL=${fail}`);
if (fail > 0) process.exit(1);
