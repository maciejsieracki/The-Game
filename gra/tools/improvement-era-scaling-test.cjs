'use strict';
/**
 * improvement-era-scaling-test.cjs -- R-WEB-IMPROVEMENT-ERA-SCALING-Q1 (decyzja wlasciciela 2026-11-03)
 *
 * (1) Plony ulepszen terenu: Zywnosc/Praca/Handel/Pieniadz (tylko wartosci > 0) rosna o +1 za epoke
 *     ponad Kamien (Kamien +0, Braz +1, Zelazo +2), wg AKTUALNEJ epoki wlasciciela.
 * (2) Produkcja surowca (`surowiec_ilosc_tura`) x1,5 za epoke (Math.round) dla WSZYSTKICH ulepszen
 *     surowcowych (takze Glinianka, Warzelnia, Stadnina, kopalnie, Kopalnia zlota).
 * Prawdziwe funkcje silnika/UI (esbuild); tabele oczekiwanych wartosci wpisane na sztywno.
 * Mutacje (MUTATE=yield|resource|pieniadz|zloto) lamia test.
 * Run: cd gra && node tools/improvement-era-scaling-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const TMP = fs.mkdtempSync('/dev/shm/imp-era-scaling-');
const ENTRY = path.join(__dirname, '.improvement-era-scaling-entry.ts');
const MUT = path.join(GRA, 'src/game/.improvement-era-scaling-mutated.ts');
const mode = process.env.MUTATE || '';
let terrainModule = '../src/game/terrain-improvements';
if (mode) {
  let src = fs.readFileSync(path.join(GRA, 'src/game/terrain-improvements.ts'), 'utf8');
  const before = src;
  if (mode === 'yield') src = src.replace('return base + (era - 1);', 'return base + 2 * (era - 1);');
  if (mode === 'resource') src = src.replace('Math.pow(1.5, normalizedEra - 1)', 'Math.pow(1.4, normalizedEra - 1)');
  if (mode === 'pieniadz') src = src.replace("new Set(['zywnosc', 'praca', 'handel', 'pieniadz'])", "new Set(['zywnosc', 'praca', 'handel'])");
  if (mode === 'zloto') src = src.replace("'warzelnia_soli', 'stadnina', 'kopalnia_zlota',\n]);", "'warzelnia_soli', 'stadnina',\n]);");
  if (src === before) throw new Error('mutacja nie zadzialala: ' + mode);
  fs.writeFileSync(MUT, src, 'utf8');
  terrainModule = '../src/game/.improvement-era-scaling-mutated';
}
const cleanup = () => {
  for (const f of [ENTRY, MUT]) if (fs.existsSync(f)) fs.unlinkSync(f);
  fs.rmSync(TMP, { recursive: true, force: true });
};
process.on('exit', cleanup);
fs.writeFileSync(ENTRY, `
export * from '${terrainModule}';
export { tileYield } from '../src/game/economy';
export { computeTerritoryResourceYieldByCity, hexToWorkedTile, cityWorkedTilesForEconomy } from '../src/game/turn-economy';
export { buildTerritoryNodesFromCities } from '../src/map/territory-work';
export { yieldOfMapHex, collectWorkedHexOwnerMap, collectWorkedHexKeysForOwner, seedReczneFromAuto } from '../src/game/okolica';
export { buildHexContextTooltipHtml } from '../src/ui/hexContextTooltip';
`, 'utf8');
const BUNDLE = path.join(TMP, 'bundle.cjs');
(async () => {
await esbuild.build({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  plugins: [{ name: 'stub-brand', setup(b) {
    b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: path.join(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts') }));
  } }],
});
const M = require(BUNDLE);
const data = require('../data/terrain-improvements.json');

let passed = 0;
let failed = 0;
function ok(c, m) { if (c) { passed++; console.log('PASS:', m); } else { failed++; console.error('FAIL:', m); } }
function eq(a, e, m) { ok(JSON.stringify(a) === JSON.stringify(e), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(e)})`); }

// ---- (1) PLONY: tabela [Kamien, Braz, Zelazo] ----
const T = (a) => [a, a + 1, a + 2];
const FLAT = (a) => [a, a, a];
const YIELD_TABLE = {
  farma:           { zywnosc: T(3), praca: T(3), handel: T(3) },
  irygacja:        { zywnosc: T(5), praca: T(2), handel: T(2) },
  bydlo:           { zywnosc: T(2), praca: T(4), handel: T(3) },
  owce:            { zywnosc: T(1), praca: T(2), handel: T(2) },
  lama:            { zywnosc: T(1), praca: T(3), handel: T(3) },
  stadnina:        { praca: T(2), handel: T(2) },
  glinianka:       { praca: T(1), glina: FLAT(10), handel: T(2) },
  kamieniolom:     { praca: T(1), kamien: FLAT(5), handel: T(2) },
  oboz_lowiecki:   { zywnosc: T(1), pieniadz: T(1), praca: T(1), handel: T(2) },
  wyrab:           { handel: T(1) },
  tartak:          { praca: T(3), handel: T(3) },
  tarasy:          { zywnosc: T(3), praca: T(2), handel: T(2) },
  lodzie_rybackie: { zywnosc: T(2), praca: T(3), handel: T(3) },
  warzelnia_soli:  { pieniadz: T(1), zywnosc: T(1), praca: T(1), handel: T(3) },
  droga:           { handel: T(2) },
  droga_brukowana: { handel: T(3) },
  kopalnia_miedzi: { praca: T(2), handel: T(5) },
  kopalnia_zelaza: { praca: T(2), handel: T(5) },
  kopalnia_cyny:   { praca: T(2), handel: T(5) },
  kopalnia_zlota:  { praca: T(2), handel: T(10) },
  fort:            {},
  posterunek:      {},
};
function sortKeys(o) { return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))); }
console.log('-- (1) improvementBonusForKey: tabela wszystkich ulepszen x 3 epoki --');
for (const key of Object.keys(YIELD_TABLE)) {
  for (let era = 1; era <= 3; era++) {
    const want = {};
    for (const [stat, arr] of Object.entries(YIELD_TABLE[key])) want[stat] = arr[era - 1];
    eq(sortKeys(M.improvementBonusForKey(key, era)), sortKeys(want), `${key} epoka ${era}`);
  }
}
const jsonKeys = Object.keys(data).filter(k => !k.startsWith('_') && data[k] && typeof data[k] === 'object' && 'bonus' in data[k]);
eq(jsonKeys.filter(k => !(k in YIELD_TABLE)), [], 'tabela pokrywa WSZYSTKIE ulepszenia z JSON');
eq(data.farma.bonus, { zywnosc: 3, praca: 3, handel: 3 }, 'JSON baz nietkniety (skalowanie w kodzie)');
eq(M.improvementBonusForKey('farma'), { zywnosc: 3, praca: 3, handel: 3 }, 'brak epoki = Kamien');
eq(M.improvementBonusForKey('farma', 99), { zywnosc: 3, praca: 3, handel: 3 }, 'epoka spoza 1-3 = Kamien (bezpiecznie)');
eq(M.improvementYieldForEra('farma', 'zywnosc', 0, 3), 0, 'baza 0 nie rosnie');
eq(M.improvementYieldForEra('farma', 'zywnosc', -1, 3), -1, 'baza ujemna nie rosnie');
eq(M.improvementYieldForEra('tartak', 'drewno', 5, 3), 5, 'drewno bez zmian');
eq(M.improvementYieldForEra('glinianka', 'glina', 10, 3), 10, 'glina bez zmian');

console.log('-- (1b) tileYield (silnik) -- delta ulepszenia na polu, wlascicielEra --');
const BASE = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
function delta(keys, era) {
  const b = M.tileYield({ ...BASE });
  const w = M.tileYield({ ...BASE, ulepszeniaKeys: keys, ulepszenieKey: keys[0], wlascicielEra: era });
  return { zywnosc: w.zywnosc - b.zywnosc, praca: w.praca - b.praca, handel: w.handel - b.handel };
}
for (const [era, v] of [[undefined, 3], [1, 3], [2, 4], [3, 5]]) {
  eq(delta(['farma'], era), { zywnosc: v, praca: v, handel: v }, `Farma na polu, epoka ${era}`);
}
eq(delta(['farma', 'irygacja'], 3), { zywnosc: 5 + 7, praca: 5 + 4, handel: 5 + 4 },
  'Farma+Irygacja (warstwy) epoka 3 -- kazde ulepszenie skaluje sie osobno');
eq(delta(['oboz_lowiecki'], 1).handel, 3, 'Oboz lowiecki handel+pieniadz epoka 1 = 3');
eq(delta(['oboz_lowiecki'], 2).handel, 5, 'Oboz lowiecki handel+pieniadz epoka 2 = 5');
eq(delta(['oboz_lowiecki'], 3).handel, 7, 'Oboz lowiecki handel+pieniadz epoka 3 = 7');
eq(delta(['fort'], 3), { zywnosc: 0, praca: 0, handel: 0 }, 'Fort bez plonu w Zelazie');
eq(delta(['posterunek'], 3), { zywnosc: 0, praca: 0, handel: 0 }, 'Posterunek bez plonu w Zelazie');
const hexPlot = { coords: { q: 1, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenia: ['farma'], rzeka: { obecna: false, krawedzie: [] } };
eq(M.tileYield(M.hexToWorkedTile(hexPlot, 3)).zywnosc - M.tileYield(M.hexToWorkedTile(hexPlot, 1)).zywnosc, 2,
  'hexToWorkedTile przenosi epoke (Zelazo +2 Zywnosc)');
const mapPlot = { hexes: { '1,0': hexPlot } };
eq(M.yieldOfMapHex(mapPlot, 1, 0, 3).zywnosc - M.yieldOfMapHex(mapPlot, 1, 0).zywnosc, 2,
  'yieldOfMapHex (ranking pol AI/auto) uwzglednia epoke');

console.log('-- (1c) pelna sciezka tury: pola obrabiane miasta owner 0 (gracz) i owner 1 (AI), ta sama epoka --');
function worldFor(ownerId) {
  const hexes = {};
  for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', rzeka: { obecna: false, krawedzie: [] } };
  }
  hexes['0,0'].ulepszenia = ['farma'];
  const cities = [{ id: 'c', ownerId, q: 0, r: 0, population: 1 }];
  return { map: { hexes, riverPaths: [] }, cities };
}
function workedYields(ownerId, era) {
  const { map, cities } = worldFor(ownerId);
  const nodes = M.buildTerritoryNodesFromCities(cities);
  return M.cityWorkedTilesForEconomy(cities[0], map, nodes, undefined, era).map(t => M.tileYield(t));
}
for (const era of [1, 2, 3]) eq(workedYields(0, era), workedYields(1, era), `gracz == AI, epoka ${era}`);
eq(workedYields(0, 3)[0].zywnosc - workedYields(0, 1)[0].zywnosc, 2, 'centrum z Farma: Zelazo daje +2 Zywnosc vs Kamien (cityWorkedTilesForEconomy)');

console.log('-- (2) PRODUKCJA SUROWCA: tabela x1,5/epoke (Math.round) --');
const RES = {
  tartak: ['drewno', [50, 75, 113]], kamieniolom: ['kamien', [50, 75, 113]],
  glinianka: ['glina', [50, 75, 113]], warzelnia_soli: ['sol', [50, 75, 113]],
  stadnina: ['kon', [25, 38, 56]],
  kopalnia_miedzi: ['ruda', [20, 30, 45]], kopalnia_zelaza: ['ruda_zelaza', [20, 30, 45]],
  kopalnia_cyny: ['ruda_cyny', [20, 30, 45]],
  kopalnia_zlota: ['zloto', [1, 2, 2]],
};
for (const [key, [res, arr]] of Object.entries(RES)) {
  for (let era = 1; era <= 3; era++) {
    const r = M.territoryResourceYieldForImprovement(key, null, era);
    eq(r && [r.resourceKey, r.amount], [res, arr[era - 1]], `${key} -> ${res}, epoka ${era}`);
  }
  eq(M.territoryResourceYieldForImprovement(key, null, undefined)?.amount, arr[0], `${key} bez epoki = baza`);
}
eq(M.resourceProductionAmountForEra('tartak', 50, 3), 113, 'Tartak nie jest skalowany podwojnie (113, nie 169)');
eq(M.resourceProductionAmountForEra('farma', 7, 3), 7, 'ulepszenie nie-surowcowe: produkcja bez zmian');
function territory(ownerId, era) {
  const keys = Object.keys(RES);
  const hexes = {};
  const POS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2]];
  keys.forEach((k, i) => { hexes[`${POS[i][0]},${POS[i][1]}`] = { coords: { q: POS[i][0], r: POS[i][1] }, ulepszenie: k }; });
  const cities = [{ id: 'c0', ownerId, q: 0, r: 0, population: 1 }];
  const nodes = M.buildTerritoryNodesFromCities(cities);
  return M.computeTerritoryResourceYieldByCity(cities, { hexes, riverPaths: [] }, nodes, () => era).get('c0') || {};
}
for (const era of [1, 2, 3]) eq(territory(0, era), territory(1, era), `produkcja surowca: gracz == AI, epoka ${era}`);
eq(sortKeys(territory(0, 3)),
  sortKeys({ drewno: 113, kamien: 113, glina: 113, sol: 113, kon: 56, ruda: 45, ruda_zelaza: 45, ruda_cyny: 45, zloto: 2 }),
  'pelna sciezka tury: suma surowcow epoka 3');

console.log('-- (3) UI: tooltip hexa pokazuje plony i produkcje dla biezacej epoki --');
const HEX = { coords: { q: 5, r: 5 }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak', ulepszenia: ['farma'], rzeka: { obecna: false, krawedzie: [] } };
const HEX2 = { coords: { q: 6, r: 5 }, terenBazowy: 'wzgorza', nakladka: 'las', ulepszenie: 'brak', ulepszenia: ['tartak'], rzeka: { obecna: false, krawedzie: [] } };
for (const era of [1, 2, 3]) {
  const plain = M.buildHexContextTooltipHtml({ q: 5, r: 5, hex: HEX, esc: s => s, currentEra: era }).replace(/<[^>]+>/g, '');
  const m = /Farma\s*\(postawione\)\s*→ plony miasta:\s*([\d\s·]+)/.exec(plain);
  const nums = m ? m[1].match(/\d+/g).map(Number) : null;
  eq(nums, [2 + era, 2 + era, 2 + era], `tooltip Farma epoka ${era}`);
  const plain2 = M.buildHexContextTooltipHtml({ q: 6, r: 5, hex: HEX2, esc: s => s, currentEra: era }).replace(/<[^>]+>/g, '');
  ok(plain2.includes(`+${[50, 75, 113][era - 1]} Drewno/t`), `tooltip Tartak produkcja epoka ${era}`);
}

console.log('-- (4) ranking pol (okolica.ts) uzywa epoki wlasciciela, jak silnik --');
{
  const mk = (teren, ul) => ({ coords: { q: 0, r: 0 }, terenBazowy: teren, nakladka: 'brak', ulepszenie: 'brak', ulepszenia: ul ? [ul] : [], rzeka: { obecna: false, krawedzie: [] } });
  const hexes = {};
  const put = (q, r, h) => { hexes[`${q},${r}`] = { ...h, coords: { q, r } }; };
  put(0, 0, mk('rownina'));
  put(1, 0, mk('wzgorza', 'kopalnia_zelaza')); // era 1: 11, era 3: 15
  put(-1, 0, mk('pustynia', 'farma'));          // era 1: 10, era 3: 16 -> ranking odwraca sie z epoka
  const map = { hexes, riverPaths: [] };
  const base = M.yieldOfMapHex(map, 1, 0, 1);
  const f1 = M.yieldOfMapHex(map, -1, 0, 1);
  const f3 = M.yieldOfMapHex(map, -1, 0, 3);
  const sum = (y) => (y.zywnosc || 0) + (y.praca || 0) + (y.handel || 0);
  ok(sum(f3) > sum(f1), `yieldOfMapHex: ulepszony heks rosnie z epoka (${sum(f1)} -> ${sum(f3)})`);
  // wspolna sciezka: eraForOwner przekazuje epoke do rankingu
  const city = { id: 'c0', ownerId: 0, q: 0, r: 0, population: 1, okolicaFocus: 'imperium', okolicaTryb: 'auto' };
  const calls = [];
  const seen = (era) => {
    const got = M.collectWorkedHexOwnerMap([city], map, { eraForOwner: (o) => { calls.push([o, era]); return era; } });
    return [...got.keys()].sort();
  };
  seen(3);
  ok(calls.length > 0 && calls.every(c => c[1] === 3), 'collectWorkedHexOwnerMap wola eraForOwner dla wlasciciela miasta');
  const e1 = M.seedReczneFromAuto(city, map, undefined, undefined, 1);
  const e3 = M.seedReczneFromAuto(city, map, undefined, undefined, 3);
  eq(Object.keys(e1), ['1,0'], 'epoka 1: wybrany heks z Kopalnia zelaza (11 > 10)');
  eq(Object.keys(e3), ['-1,0'], 'epoka 3: wybrany heks z Farma (16 > 15) -- ranking zalezy od epoki');
  eq(Object.keys(e3), seen(3).filter(k => k !== '0,0'), 'seedReczneFromAuto(era 3) == wybor silnika (collectWorkedHexOwnerMap era 3)');
  eq(Object.keys(e1), seen(1).filter(k => k !== '0,0'), 'seedReczneFromAuto(era 1) == wybor silnika (era 1)');
}

console.log(`\n${passed} PASS, ${failed} FAIL`);
process.exitCode = failed ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(2); });
