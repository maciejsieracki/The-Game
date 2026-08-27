'use strict';
/**
 * hodowla-las-measure.cjs — SONDA POMIAROWA (nie bramka) dla
 * R-ULEPSZENIA-HODOWLA-LAS-ODBLOKOWANA-Q1.
 *
 * Mierzy PRZED/PO: na ilu heksach KAZDY klucz ulepszenia kwalifikuje sie do budowy,
 * w rozbiciu na heksy Z nakladka Las i BEZ niej. Metoda behawioralna — pelny
 * `buildImprovementQualifier` (ta sama funkcja, ktorej uzywa panel gracza przez
 * `createQualifier` i automat/AI CYWILIZACJI przez `pickAutoImprovements`), nie grep
 * i nie sam predykat blokady.
 *
 * Dwa pomiary rozdzielone, bo kwalifikacja hodowli zalezy od cywilizacji:
 *   - profil `rzym`  (epoka 5): owce, bydlo, stadnina i reszta kluczy
 *   - profil `inkowie` (epoka 5): lama (tylko Inkowie — isLivestockAllowed)
 * `tradeRouteKonUnlocked: true` daje empireUnlocks 'kon', zeby stadnina byla mierzalna
 * takze poza zlozem konia (inaczej na lesie nigdy nie moglaby sie pojawic i pomiar
 * kontrolny dla stadniny bylby pusty z niewlasciwego powodu).
 *
 * Uzycie: node tools/hodowla-las-measure.cjs [--json plik.json]
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.hodowla-las-measure-entry.ts');
const BUNDLE = path.resolve(__dirname, '.hodowla-las-measure-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, outfile: BUNDLE,
  platform: 'node', format: 'cjs', target: 'node18', logLevel: 'silent',
});
const M = require(BUNDLE);
const { Nakladka: N, TerenBazowy: T } = M;

const data = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '..', 'data', 'terrain-improvements.json'), 'utf8'));
const KEYS = Object.keys(data).filter(k => !k.startsWith('_'));

const ALL_TECH = new Set([
  'lowiectwo', 'Łowiectwo', 'rolnictwo', 'Rolnictwo', 'gornictwo', 'Gornictwo', 'Górnictwo',
  'ceramika', 'Ceramika', 'budownictwo', 'Budownictwo', 'kolo', 'Koło', 'zeglarstwo', 'Żeglarstwo',
  'brazownictwo', 'obrobka_kamienia', 'hodowla', 'Hodowla', 'stolarstwo', 'Stolarstwo',
  'jezdziectwo', 'irygacja', 'Irygacja', 'tarasy',
]);

const SEEDS = [90210, 777, 31415, 20260827, 4242];
const TERRAIN_NAME = Object.fromEntries(Object.entries(T).map(([k, v]) => [String(v), k]));

function stateFor(map, civ) {
  const nodes = [];
  for (const k of Object.keys(map.hexes)) {
    const h = map.hexes[k];
    if (!h) continue;
    nodes.push({ q: h.coords.q, r: h.coords.r, ownerId: 0, cityId: 'c0' });
  }
  return {
    map,
    cityNodes: [{ q: 0, r: 0, pop: 9, level: 5 }],
    territoryNodes: nodes,
    playerOwnerIdNum: 0,
    placedImprovements: new Map(),
    researchedTechs: ALL_TECH,
    playerCivArchetype: civ,
    playerEra: 5,
    tradeRouteKonUnlocked: true,
  };
}

/** Pomiar dla jednego profilu cywilizacji: licznik kwalifikacji per klucz, Las vs nie-Las. */
const HODOWLA = ['owce', 'bydlo', 'lama', 'stadnina'];

function measure(civ) {
  const perKey = {};
  const forestTerrainPerKey = {};
  const perSeed = {};
  let lasHexes = 0;
  let innyHexes = 0;
  for (const seed of SEEDS) {
    const map = M.generateMap(36, 28, seed, 'kontynenty');
    const q = M.buildImprovementQualifier(stateFor(map, civ));
    const seedRec = perSeed[seed] = { lasHexes: 0, hodowlaNaLesie: {}, hodowlaPozaLasem: {} };
    for (const k of HODOWLA) { seedRec.hodowlaNaLesie[k] = 0; seedRec.hodowlaPozaLasem[k] = 0; }
    for (const hk of Object.keys(map.hexes)) {
      const h = map.hexes[hk];
      if (!h) continue;
      const las = h.nakladka === N.Las;
      if (las) { lasHexes++; seedRec.lasHexes++; } else innyHexes++;
      for (const key of KEYS) {
        const rec = perKey[key] || (perKey[key] = { las: 0, nieLas: 0 });
        if (!q(key, h.coords.q, h.coords.r)) continue;
        if (las) {
          rec.las++;
          if (HODOWLA.includes(key)) seedRec.hodowlaNaLesie[key]++;
          const b = forestTerrainPerKey[key] || (forestTerrainPerKey[key] = {});
          const tn = TERRAIN_NAME[String(h.terenBazowy)] || String(h.terenBazowy);
          b[tn] = (b[tn] || 0) + 1;
        } else {
          rec.nieLas++;
          if (HODOWLA.includes(key)) seedRec.hodowlaPozaLasem[key]++;
        }
      }
    }
  }
  return { civ, seeds: SEEDS, lasHexes, innyHexes, perKey, forestTerrainPerKey, perSeed };
}

const out = { rzym: measure('rzym'), inkowie: measure('inkowie') };

function dump(label, m) {
  console.log(`\n=== profil ${label} · ziarna ${m.seeds.join(',')} · heksow z Lasem=${m.lasHexes}, bez Lasu=${m.innyHexes}`);
  console.log('klucz'.padEnd(20) + 'kwalifikuje@LAS'.padStart(18) + 'kwalifikuje@BEZ-LASU'.padStart(22));
  for (const key of KEYS) {
    const r = m.perKey[key] || { las: 0, nieLas: 0 };
    console.log(key.padEnd(20) + String(r.las).padStart(18) + String(r.nieLas).padStart(22));
  }
  console.log('  -- rozbicie terenu bazowego pod lasem (tylko hodowla) --');
  for (const k of HODOWLA) {
    const b = m.forestTerrainPerKey[k];
    console.log(`  ${k}: ${b ? JSON.stringify(b) : '{}'}`);
  }
  console.log('  -- per ZIARNO: kwalifikacje hodowli NA LESIE / POZA LASEM --');
  for (const seed of m.seeds) {
    const s = m.perSeed[seed];
    const na = HODOWLA.map(k => `${k}=${s.hodowlaNaLesie[k]}`).join(' ');
    const poza = HODOWLA.map(k => `${k}=${s.hodowlaPozaLasem[k]}`).join(' ');
    console.log(`  seed ${String(seed).padEnd(9)} lasHex=${String(s.lasHexes).padStart(4)} | NA LESIE: ${na} | POZA LASEM: ${poza}`);
  }
}
dump('rzym', out.rzym);
dump('inkowie', out.inkowie);

const jsonArgIdx = process.argv.indexOf('--json');
if (jsonArgIdx > 0 && process.argv[jsonArgIdx + 1]) {
  fs.writeFileSync(process.argv[jsonArgIdx + 1], JSON.stringify(out, null, 2), 'utf8');
  console.log('\nzapisano JSON: ' + process.argv[jsonArgIdx + 1]);
}
