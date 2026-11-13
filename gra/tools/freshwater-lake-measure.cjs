'use strict';
/**
 * freshwater-lake-measure.cjs — R-WEB-FRESHWATER-ACCESS-LAKE-Q1 (pomiar jezior generatora, read-only).
 *
 * Dla każdej mapy (typ x rozmiar x ziarno) generuje mapę (bez rzek: nie zmieniają ląd/morze),
 * liczy heksy jeziora (getLakeHexSet z src/map/freshwater.ts) i pozycje startowe (buildClusterStartPlan)
 * w zasięgu jeziora. Bundle w mktemp poza gra/, BEZ `npm run build`/`dev`.
 *
 * Użycie (z gra/):
 *   node tools/freshwater-lake-measure.cjs --types kontynenty,pangea,wyspy --sizes Mały,Standardowy --seeds 11,222,3333
 *   node tools/freshwater-lake-measure.cjs --types ziemia --sizes Mały,Standardowy --seeds 11
 * Linie JSON na stdout (jedna na mapę); typy dostępne w kodzie: kontynenty, pangea, wyspy, ziemia
 * (typu „archipelag” generator NIE ma — wyspy pokrywają ten przypadek).
 * Pojedyncza mapa Standard: do ~490 s; używaj odczepionych procesów dla pełnej serii.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return def;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith('--') ? def : v;
}
const GRA = path.resolve(__dirname, '..');
const TYPES = String(arg('types', 'kontynenty,pangea,wyspy')).split(',');
const SIZES = String(arg('sizes', 'Mały,Standardowy')).split(',');
const SEEDS = String(arg('seeds', '11,222,3333')).split(',').map(Number);
const EPOCH = 'kamien';

const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lakemeasure-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
const rel = (p) => JSON.stringify(path.join(GRA, p).replace(/\\/g, '/'));
fs.writeFileSync(entry, `
export { buildClusterStartPlan } from ${rel('src/game/cluster-start')};
export { generateMap, ROZMIAR_DIMS, rozmiarFromMenuLabel } from ${rel('src/map/generator')};
export { setRiverGenPhaseOverride, setRiverGenEnabledOverride } from ${rel('src/map/riverGenSwitch')};
export { defaultLandFractionForTyp } from ${rel('src/map/gen-helpers')};
export { getLakeHexSet, isLakeAdjacent } from ${rel('src/map/freshwater')};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA,
  logLevel: 'silent', nodePaths: [path.join(GRA, 'node_modules')],
});
const M = require(bundle);
try { M.setRiverGenPhaseOverride('main'); } catch (_) { /* starsze commity */ }
try { M.setRiverGenEnabledOverride(false); } catch (_) { /* starsze commity */ }

const civs = JSON.parse(fs.readFileSync(path.join(GRA, 'data/civs.json'), 'utf8'));
const eStart = JSON.parse(fs.readFileSync(path.join(GRA, 'data/e-start-params.json'), 'utf8'));

function scaleParams(label) {
  const sk = eStart.skala_mapy && eStart.skala_mapy[label];
  const rywale = sk ? sk.miasta_panstwa : 6;
  let typy = sk ? sk.typy_cywilizacji : 6;
  const pe = sk && sk.typy_cywilizacji_per_epoka && sk.typy_cywilizacji_per_epoka[EPOCH];
  if (pe) typy = pe.default;
  return { rywale, typy };
}
const isWater = (t) => t === 'morze' || t === 'plytkie_morze';

let mapsWithLake = 0, total = 0, lakeHexTotal = 0, startsTotal = 0, startsInLake = 0;
for (const sizeLabel of SIZES) {
  const rozmiar = M.rozmiarFromMenuLabel(sizeLabel);
  const [w, h] = M.ROZMIAR_DIMS[rozmiar];
  const { rywale, typy } = scaleParams(sizeLabel);
  for (const typ of TYPES) {
    for (const seed of SEEDS) {
      const t0 = Date.now();
      const map = M.generateMap(w, h, seed, typ, {
        landFraction: M.defaultLandFractionForTyp(typ),
        mapSizeMenuLabel: sizeLabel,
        worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
      });
      const lake = M.getLakeHexSet(map);
      let waterHex = 0;
      for (const k in map.hexes) if (isWater(map.hexes[k].terenBazowy)) waterHex++;
      const plan = M.buildClusterStartPlan({
        map, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: rywale, aktywneTypy: typy, startEpochId: EPOCH,
      });
      const starts = [{ q: plan.playerStartHex.q, r: plan.playerStartHex.r }];
      for (const fc of plan.foreignTypeClusters) for (const p of fc.positions) starts.push({ q: p.q, r: p.r });
      for (const p of plan.pendingSameTypeRivalHexes || []) starts.push({ q: p.q, r: p.r });
      const inLake = starts.filter((s) => M.isLakeAdjacent(map, s.q, s.r)).length;
      total++; if (lake.size > 0) mapsWithLake++;
      lakeHexTotal += lake.size; startsTotal += starts.length; startsInLake += inLake;
      console.log(JSON.stringify({
        typ, sz: sizeLabel.toLowerCase(), seed, hexes: Object.keys(map.hexes).length, waterHex, lakeHex: lake.size,
        starts: starts.length, startsLake: inLake, ms: Date.now() - t0,
      }));
    }
  }
}
console.log(JSON.stringify({ SUMA: { maps: total, mapsWithLake, lakeHexTotal, startsTotal, startsInLake } }));
fs.rmSync(tmp, { recursive: true, force: true });
