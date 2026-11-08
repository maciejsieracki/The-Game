'use strict';
/**
 * node tools/ai-city-yield-test.cjs
 * R-WEB-AI-CITY-YIELD-FIX-Q1: hexCityScore dopasowuje wiersz plonow po ID terenu (TerenBazowy), a nie po
 * etykiecie z diakrytykami. Test na REALNYM data/terrain-yields.json (loadGameData), bez normalizacji po stronie testu.
 * Esbuild bundle poza repo (tmpdir) — bez buildu w gra/.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const GRA = process.env.GRA_ROOT ? path.resolve(process.env.GRA_ROOT) : path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-city-yield-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { hexCityScore, terrainYieldRowForId } from ${JSON.stringify(path.join(GRA, 'src/game/ai.ts'))};
export { loadGameData } from ${JSON.stringify(path.join(GRA, 'src/data/loader.ts'))};
export { TerenBazowy } from ${JSON.stringify(path.join(GRA, 'src/types/hex.ts'))};
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL:', m); } };

const data = M.loadGameData();
const rows = data.terrainYields.terrain_types;
const mkHex = (t) => ({ coords: { q: 0, r: 0 }, terenBazowy: t, nakladka: 'brak', rzeka: { obecna: false, krawedzie: [] } });
// id -> etykieta z JSON (jawny spis; 'Wybrzeże' = plytkie_morze wg economy.ts TERRAIN_NAME_TO_ENUM)
const ID_TO_LABEL = { laka: 'Łąka', rownina: 'Równina', wzgorza: 'Wzgórza', gory: 'Góry', plytkie_morze: 'Wybrzeże',
  morze: 'Morze', pustynia: 'Pustynia', polarny: 'Polarny' };
for (const id of Object.values(M.TerenBazowy)) ok(id in ID_TO_LABEL, `enum id ${id} ma etykiete w tescie`);
for (const label of rows.map(r => r.Teren)) ok(Object.values(ID_TO_LABEL).includes(label), `etykieta JSON ${label} znana`);
for (const [id, label] of Object.entries(ID_TO_LABEL)) {
  const row = M.terrainYieldRowForId(data, id);
  ok(row !== undefined && row.Teren === label, `terrainYieldRowForId(${id}) -> ${label} (jest: ${row && row.Teren})`);
}
// Waga plonu (ekspansja_waga_plonu_heksu): test PELNEGO plonu = waga 1; domyslna waga z ai-params.json osobno.
const withWeight = (w) => ({ ...data, aiParams: { ...data.aiParams, ekspansja_waga_plonu_heksu: { wartosc: w } } });
const scW = (w, id) => M.hexCityScore(mkHex(id), 0, 0, withWeight(w), [], undefined);
const sc = (id) => scW(1, id);
// Kazdy teren o niezerowych plonach w danych dostaje score > 0; Polarny = same zera w danych (legalnie 0).
for (const [id, label] of Object.entries(ID_TO_LABEL)) {
  const row = rows.find(r => r.Teren === label);
  const anyYield = ['Żywność', 'Praca', 'Podatek'].some(k => (row[k] ?? 0) > 0);
  if (id === 'polarny') ok(!anyYield && sc(id) === 0, 'polarny: dane same zera -> score 0');
  else ok(anyYield, `${id}: dane maja niezerowy plon`);
}
ok(sc('laka') === 4, `laka score 4 (zywnosc>=3 +3, handel>=1 +1), jest ${sc('laka')}`);
ok(sc('rownina') === 3, `rownina score 3 (praca>=2 +2, handel +1), jest ${sc('rownina')}`);
ok(sc('wzgorza') === 2, `wzgorza score 2 (praca>=2 +2), jest ${sc('wzgorza')}`);
ok(sc('pustynia') === 1, `pustynia score 1 (handel>=1), jest ${sc('pustynia')}`);
ok(sc('laka') > sc('rownina') && sc('rownina') > sc('wzgorza') && sc('wzgorza') > sc('pustynia') && sc('pustynia') > sc('polarny'),
  'ranking laka > rownina > wzgorza > pustynia > polarny');
// waga 0 = zachowanie sprzed naprawy (plon ignorowany), waga domyslna z ai-params.json = 0.3
ok(M.hexCityScore(mkHex('laka'), 0, 0, withWeight(0), [], undefined) === 0, 'waga 0: plon laki ignorowany (jak przed naprawa)');
ok(data.aiParams.ekspansja_waga_plonu_heksu && data.aiParams.ekspansja_waga_plonu_heksu.wartosc === 0.3, 'ai-params.json: ekspansja_waga_plonu_heksu = 0.3');
ok(Math.abs(M.hexCityScore(mkHex('laka'), 0, 0, data, [], undefined) - 1.2) < 1e-9, 'domyslna waga 0.3: laka = 1.2');
// rzeka NIE jest skalowana wagą plonu
const riverHex = { ...mkHex('laka'), rzeka: { obecna: true, krawedzie: [] } };
ok(Math.abs(M.hexCityScore(riverHex, 0, 0, data, [], undefined) - 3.2) < 1e-9, 'domyslna waga: laka+rzeka = 1.2 + 2 = 3.2 (>= ekspansja_min_score_hex 3)');
// kompatybilnosc: stare/testowe dane z Teren == id dosłownie
const legacy = (w) => ({ ...data, aiParams: { ekspansja_waga_plonu_heksu: { wartosc: w } }, terrainYields: { terrain_types: [{ Teren: 'rownina', Zywnosc: 3, Praca: 2, Handel: 1 }] } });
ok(M.hexCityScore(mkHex('rownina'), 0, 0, legacy(1), [], undefined) === 6, 'legacy Teren==id, waga 1: 6');
console.log(`ai-city-yield-test: ${pass} PASS, ${fail} FAIL`);
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignore */ }
process.exit(fail ? 1 : 0);
