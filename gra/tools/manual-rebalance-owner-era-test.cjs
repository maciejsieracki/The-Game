'use strict';
/**
 * manual-rebalance-owner-era-test.cjs -- R-WEB-MANUAL-REBALANCE-OWNER-ERA-Q1
 *
 * Tryb reczny: po zmianie populacji `applyPostCentralPopulationGrowth` (population-growth-v85.ts)
 * wola `rebalanceWorkersAfterPopulationChange`. Ranking pol (seed z auto przy pustym `okolicaReczne`)
 * ma uzywac EPOKI WLASCICIELA miasta (ownerEraByOwner), jak pozostale sciezki
 * (yieldOfMapHex / cityWorkedTilesForEconomy), a nie domyslnej Kamien.
 *
 * Prawdziwe funkcje silnika (esbuild). Scenariusz: pop 1 -> 2, reczne puste, okolica z 3 ulepszeniami
 * o roznym tempie wzrostu plonu (fokus zrownowazony):
 *   kopalnia_zlota (17/19/21), kopalnia_miedzi (12/14/16), oboz_lowiecki (10/14/18)  [Kamien/Braz/Zelazo]
 * Kamien: top2 = zloto+miedz. Zelazo: top2 = zloto+oboz.
 * Mutacja MUTATE=noera: usuwa przekazanie epoki w population-growth-v85.ts -> test musi spasc.
 * Run: cd gra && node tools/manual-rebalance-owner-era-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));

const mode = process.env.MUTATE || '';
const POP_SRC = path.join(GRA, 'src/game/population-growth-v85.ts');
const MUT = path.join(GRA, 'src/game/.manual-rebalance-owner-era-mutated.ts');
const ENTRY = path.join(__dirname, '.manual-rebalance-owner-era-entry.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-rebalance-era-'));
let popModule = '../src/game/population-growth-v85';
if (mode) {
  const src = fs.readFileSync(POP_SRC, 'utf8');
  if (mode !== 'noera') throw new Error('nieznana mutacja: ' + mode);
  // usun przekazanie epoki do rebalansu (stan sprzed poprawki)
  const needle = 'excludeHexKeysByCity?.get(city.id),\n          ownerEra,\n';
  if (!src.includes(needle)) throw new Error('mutacja nie zadzialala');
  const out = src.replace(needle, 'excludeHexKeysByCity?.get(city.id),\n');
  fs.writeFileSync(MUT, out, 'utf8');
  popModule = '../src/game/.manual-rebalance-owner-era-mutated';
}
const cleanup = () => {
  for (const f of [ENTRY, MUT]) if (fs.existsSync(f)) fs.unlinkSync(f);
  fs.rmSync(TMP, { recursive: true, force: true });
};
process.on('exit', cleanup);
fs.writeFileSync(ENTRY, `
export { applyPostCentralPopulationGrowth } from '${popModule}';
export { buildTerritoryNodesFromCities } from '../src/game/okolica';
`, 'utf8');
const BUNDLE = path.join(TMP, 'bundle.cjs');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
});
const M = require(BUNDLE);

let pass = 0, fail = 0;
const ok = (c, l) => { if (c) pass++; else { fail++; console.error('FAIL:', l); } };

function runGrowth(ownerEra) {
  const hexes = {};
  for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', rzeka: { obecna: false, krawedzie: [] } };
  }
  hexes['1,0'].ulepszenia = ['kopalnia_zlota'];
  hexes['0,1'].ulepszenia = ['kopalnia_miedzi'];
  hexes['-1,1'].ulepszenia = ['oboz_lowiecki'];
  const map = { hexes, riverPaths: [] };
  const city = {
    id: 'c1', name: 'T', ownerId: 0, q: 0, r: 0, population: 1, poziomRacji: 1,
    rationMigratedV114: true, wzrostUlamkowy: 0.99, turyBezDoplaty: 0, manpower: 0,
    okolicaTryb: 'reczny', okolicaFocus: 'zrownowazone', okolicaReczne: {},
  };
  const tick = {
    cityId: 'c1', ownerId: 0, oblegany: false, zywnoscBrutto: 12, kosztRacji: 0, bilansLokalny: 12, zdrowie: 0,
    spichlerzCeramika: false, spichlerzSol: false, maSpichlerz: false, maSpichlerzII: false,
  };
  M.applyPostCentralPopulationGrowth({
    cities: [city],
    econ: { perCity: [tick], growth: 0, starved: 0 },
    efResult: { perOwner: [{ perCityRows: [{ cityId: 'c1' }], fedByCityId: new Map([['c1', true]]) }] },
    map,
    territoryNodes: M.buildTerritoryNodesFromCities([city]),
    econParams: { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 },
    rationParams: { r0: 0, r1: 6, r2: 12, r3: 20, r4: 30, r5: 42, r6: 56 },
    ownerEraByOwner: ownerEra === undefined ? undefined : new Map([[0, ownerEra]]),
  });
  return city;
}

const keys = c => Object.keys(c.okolicaReczne).filter(k => c.okolicaReczne[k] > 0).sort();
const c1 = runGrowth(1);
ok(c1.population === 2, `pop wzrosla 1->2 (era1), got=${c1.population}`);
ok(keys(c1).join('|') === ['0,1', '1,0'].join('|'), `Kamien: top2 = zloto(1,0)+miedz(0,1), got=${keys(c1)}`);
const cU = runGrowth(undefined);
ok(keys(cU).join('|') === keys(c1).join('|'), `brak ownerEraByOwner = Kamien (zgodnosc wsteczna), got=${keys(cU)}`);
const c3 = runGrowth(3);
ok(c3.population === 2, `pop wzrosla 1->2 (era3), got=${c3.population}`);
ok(keys(c3).join('|') === ['-1,1', '1,0'].join('|'), `Zelazo: top2 = zloto(1,0)+oboz(-1,1) (epoka wlasciciela w rankingu), got=${keys(c3)}`);

console.log(`manual-rebalance-owner-era: pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
