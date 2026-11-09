'use strict';
/**
 * terrain-improve-farm-availability-test.cjs -- R-WEB-TERRAIN-IMPROVE-FARM-MISSING-ON-HEX-Q1
 * Run z gra/:  node tools/terrain-improve-farm-availability-test.cjs   (PROBE=1 -> tabela diagnostyczna)
 *
 * Odtwarza heks ze zrzutu wlasciciela (Laka + rzeka + zloze Gliny, Farma + Trzoda juz postawione)
 * i porownuje liste "Mozliwe ulepszenia (teren)" (hexContextTooltip) z PRAWDZIWYM kwalifikatorem
 * silnika (buildImprovementQualifier) dla kluczy farma / bydlo / owce / irygacja.
 * Prawdziwe funkcje (esbuild bundle, stub tylko icons/brandAssets), zadnych atrap logiki.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = process.env.TIF_SRC_DIR || path.join(GRA, 'src');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tif-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { buildHexContextTooltipHtml } from ${JSON.stringify(SRC + '/ui/hexContextTooltip')};
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
`);
async function main() {
await esbuild.build({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error',
  nodePaths: [path.join(GRA, 'node_modules')],
  plugins: [{ name: 'stub-brand', setup(b) { b.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); } }],
});
const { buildHexContextTooltipHtml, buildImprovementQualifier } = require(bundle);
fs.rmSync(tmp, { recursive: true, force: true });

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) { passed++; console.log('PASS:', m); } else { failed++; console.error('FAIL:', m); } };

const K = (q, r) => `${q},${r}`;
const CQ = 110, CR = 34, HQ = 113, HR = 34; // miasto (Pompeje) i heks ze zrzutu
function mkHex(q, r, over = {}) {
  return {
    coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak',
    wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    ...over,
  };
}
function mkMap(target) {
  const hexes = {};
  for (let q = 100; q <= 125; q++) for (let r = 25; r <= 45; r++) hexes[K(q, r)] = mkHex(q, r);
  hexes[K(HQ, HR)] = mkHex(HQ, HR, target);
  return { szerokoscQ: 140, wysokoscR: 60, hexes, seed: 1, riverPaths: [] };
}
const city = { q: CQ, r: CR, pop: 8, level: 1, civ: 'rzymianie' };
const TN = [{ ...city, ownerId: 0 }];

/** Nazwy z sekcji "Mozliwe ulepszenia" wg tooltipa. */
function tooltipPossible(map, civ = 'rzymianie') {
  const hex = map.hexes[K(HQ, HR)];
  const html = buildHexContextTooltipHtml({ q: HQ, r: HR, hex, playerCivType: civ, map, currentEra: 1, esc: s => String(s) });
  const names = [...html.matchAll(/<div class="cp-sub cp-possible"><b>([^<]+)<\/b>/g)].map(m => m[1]);
  const built = (html.match(/Ulepszenia postawione[\s\S]*?(?=<div class="cp-yield-head|$)/) || [''])[0];
  return { html, names, built };
}
function engine(map, key) {
  const q = buildImprovementQualifier({
    map, cityNodes: [city], territoryNodes: TN, playerOwnerIdNum: 0, playerCivArchetype: 'rzymianie', playerEra: 1,
    researchedTechs: new Set(['Rolnictwo', 'Irygacja', 'Hodowla', 'Oswojenie zwierząt', 'Nawadnianie']),
  });
  return q(key, HQ, HR);
}
const NAME = { farma: 'Farma', bydlo: 'Trzoda', owce: 'Owce', irygacja: 'Irygacja' };
const river = { rzeka: { obecna: true, krawedzie: [] } };

const S1 = 'S1 Laka+rzeka+glina, Farma+Trzoda postawione (zrzut)';
const SCEN = {
  [S1]: { nakladka: 'zloze_gliny', ...river, ulepszenia: ['farma', 'bydlo'] },
  'S2 Laka goła': {},
  'S3 Laka+rzeka': { ...river },
  'S4 Wzgorza': { terenBazowy: 'wzgorza' },
  'S5 Laka+Las': { nakladka: 'las' },
  'S6 Laka+rzeka+glina (bez ulepszen)': { nakladka: 'zloze_gliny', ...river },
  'S7 Rownina+rzeka+Farma tylko': { terenBazowy: 'rownina', ...river, ulepszenia: ['farma'] },
  'S8 Laka + zloze bydla': { nakladka: 'zloze_bydla' },
};
const result = {};
for (const [name, over] of Object.entries(SCEN)) {
  const map = mkMap(over);
  const t = tooltipPossible(map);
  const row = {};
  for (const k of Object.keys(NAME)) row[k] = { tooltip: t.names.includes(NAME[k]), engine: engine(map, k) };
  result[name] = { t, row };
  if (process.env.PROBE) {
    console.log(name, '\n  tooltip:', t.names.join(', '));
    console.log('  engine :', Object.entries(row).map(([k, v]) => `${k}=${v.engine}`).join(' '));
  }
}

{
  const { t } = result[S1];
  ok(/Farma/.test(t.built) && /Trzoda/.test(t.built), 'S1: sekcja "Ulepszenia postawione" pokazuje Farme I Trzode na jednym heksie');
  ok(!t.names.includes('Farma') && !t.names.includes('Trzoda'), 'S1: Farma/Trzoda postawione => nie sa ponownie oferowane (poprawne)');
  ok(['Irygacja', 'Glinianka', 'Fort', 'Droga', 'Posterunek'].every(n => t.names.some(x => x.startsWith(n))), 'S1: oferta zawiera Irygacja, Glinianka, Fort, Droga, Posterunek (jak na zrzucie)');
  ok(result[S1].row.irygacja.engine === true, 'S1: silnik pozwala dobudowac Irygacje na Farma+Trzoda (stack kanon 2026-09-07)');
}
for (const [name, { row }] of Object.entries(result)) {
  ok(row.farma.tooltip === row.farma.engine, `${name}: Farma tooltip(${row.farma.tooltip}) == silnik(${row.farma.engine})`);
  ok(row.irygacja.tooltip === row.irygacja.engine, `${name}: Irygacja tooltip(${row.irygacja.tooltip}) == silnik(${row.irygacja.engine})`);
}
ok(result['S2 Laka goła'].row.farma.tooltip && result['S3 Laka+rzeka'].row.farma.tooltip && result['S7 Rownina+rzeka+Farma tylko'].row.farma.tooltip === false, 'Farma oferowana na golej Lace i Lace+rzeka; nie oferowana gdy juz stoi');
ok(!result['S4 Wzgorza'].row.farma.tooltip && !result['S5 Laka+Las'].row.farma.tooltip, 'Farma NIE oferowana na Wzgorzach ani pod Lasem (reguly 2026-08-27)');
for (const name of ['S2 Laka goła', 'S3 Laka+rzeka', 'S6 Laka+rzeka+glina (bez ulepszen)', 'S8 Laka + zloze bydla']) {
  const { row } = result[name];
  ok(row.bydlo.tooltip === row.bydlo.engine, `${name}: Trzoda tooltip(${row.bydlo.tooltip}) == silnik(${row.bydlo.engine})`);
}
ok(result['S4 Wzgorza'].row.owce.tooltip === result['S4 Wzgorza'].row.owce.engine, 'S4: Owce tooltip == silnik na Wzgorzach');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
