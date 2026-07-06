'use strict';
/** node tools/map-size-count.cjs — liczba heksów per rozmiar mapy */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.map-size-entry.ts');
const bundle = path.join(__dirname, '.map-size-bundle.cjs');

fs.writeFileSync(
  entry,
  `export { ROZMIAR_MENU_LABELS, menuLabelToDims, rozmiarFromMenuLabel, generateMap } from '../src/map/generator';
export { countLandSeaHexes } from '../src/map/gen-helpers';`,
  'utf8',
);

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

console.log('=== Liczba heksów na mapie (The Game) ===\n');
console.log('Źródło wymiarów: map-gen-params.json / e-start-params.json');
console.log('Siatka: prostokąt q=0..W-1, r=0..H-1 → łącznie W×H heksów\n');

let prevArea = null;
const rows = [];

for (const label of M.ROZMIAR_MENU_LABELS) {
  const key = M.rozmiarFromMenuLabel(label);
  const { w, h } = M.menuLabelToDims(label);
  const area = w * h;
  const map = M.generateMap(w, h, 4242, 'kontynenty');
  const total = Object.keys(map.hexes).length;
  const { land, sea } = M.countLandSeaHexes(map.hexes);
  let cls = 'super';
  if (area < 4800) cls = 'mala';
  else if (area < 12000) cls = 'srednia';
  else if (area < 25200) cls = 'duza';
  else if (area < 100000) cls = 'ogromna';

  rows.push({
    label,
    key,
    w,
    h,
    area,
    total,
    land,
    sea,
    cls,
    ratio: prevArea ? area / prevArea : null,
  });
  prevArea = area;
}

console.log(
  'Mapa'.padEnd(14),
  'klucz'.padEnd(14),
  'W×H'.padEnd(12),
  'Heksy'.padStart(8),
  'Ląd~30%'.padStart(10),
  'Morze'.padStart(10),
  'Klasa'.padStart(10),
  '× poprz.'.padStart(10),
);
console.log('-'.repeat(92));

for (const r of rows) {
  console.log(
    r.label.padEnd(14),
    r.key.padEnd(14),
    `${r.w}×${r.h}`.padEnd(12),
    String(r.area).padStart(8),
    String(r.land).padStart(10),
    String(r.sea).padStart(10),
    r.cls.padStart(10),
    (r.ratio ? r.ratio.toFixed(2) + '×' : '—').padStart(10),
  );
}

console.log('\nUwagi:');
console.log('- „Heksy” = W×H (każdy hex istnieje w map.hexes, brzeg = ocean, nie usuwa heksów).');
console.log('- „Ląd~30%” = Kontynenty, domyślny ułamek lądu 30% (seed 4242) — zmienia się z typem świata.');
console.log('- Klasa clusters.ts: progi area <4800 / <12000 / <25200 / <100000 / super.');
