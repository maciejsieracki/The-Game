'use strict';
/**
 * mill-river-only-gate-test.cjs — R-WEB-MILL-RIVER-ONLY-GATE-Q1 (decyzja właściciela 2026-11-04 ABC:
 * „Porty: morze LUB rzeka; młyn TYLKO rzeka”). Run z gra/:  node tools/mill-river-only-gate-test.cjs
 * Mutacje: MILLRIVER_SRC_DIR=<kopia gra/src> node tools/mill-river-only-gate-test.cjs
 *
 * (A) Młyn (`mlyn`) ∈ RIVER_ONLY_BUILDING_IDS; Port NIE (Port = morze LUB rzeka, bramka WATER_ACCESS bez zmian).
 * (B) availableProduction: `mlyn` dostępny TYLKO gdy ctx.cityHasRiver === true (brak rzeki / brak flagi → NIE).
 * (C) Wspólna definicja „przy rzece” (isHexNearRiver, jak irygacja): rzeka na heksie/sąsiedzie TAK; jezioro/morze bez rzeki NIE.
 * (D) Stary zapis z już postawionym młynem wczytuje się bez wyjątku (budynek nie znika z builtBuildingIds).
 * (E) Pin main.ts: cityHasRiverAccess = isHexNearRiver(...) i wszystkie wołania ctx mają `cityHasRiver:`.
 * (F) Pin UI: cityPanel.ts pokazuje blokadę „Wymaga rzeki przy mieście” dla RIVER_ONLY_BUILDING_IDS.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.MILLRIVER_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'millriver-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, [
  `export { availableProduction, RIVER_ONLY_BUILDING_IDS } from ${JSON.stringify(SRC + '/game/production')};`,
  `export { WATER_ACCESS_BUILDING_IDS } from ${JSON.stringify(SRC + '/game/building-resource-gate')};`,
  `export { isHexNearRiver } from ${JSON.stringify(SRC + '/map/improvement-build')};`,
].join('\n') + '\n');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA_ROOT, logLevel: 'error',
  nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { availableProduction, RIVER_ONLY_BUILDING_IDS, WATER_ACCESS_BUILDING_IDS, isHexNearRiver } = require(bundle);
let failed = 0;
const ok = (c, m) => { if (c) console.log('  [OK] ' + m); else { failed++; console.error('  [FAIL] ' + m); } };
const K = (q, r) => `${q},${r}`;
function makeMap({ river = [], lake = [] } = {}) {
  const hexes = {};
  for (let q = 0; q < 20; q++) for (let r = 0; r < 20; r++) {
    const edge = q === 0 || r === 0 || q === 19 || r === 19;
    hexes[K(q, r)] = { coords: { q, r }, terenBazowy: edge ? 'morze' : 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  for (const [q, r] of river) hexes[K(q, r)].rzeka = { obecna: true, krawedzie: [] };
  for (const [q, r] of lake) hexes[K(q, r)].terenBazowy = 'morze';
  return { szerokoscQ: 20, wysokoscR: 20, hexes, seed: 1, riverPaths: river.length ? [river.map(([q, r]) => ({ q, r }))] : [] };
}
const map = makeMap({ river: [[10, 10], [10, 11]] });
const RIVER = { q: 10, r: 10 }, RIVER_NB = { q: 9, r: 10 }, DRY = { q: 6, r: 14 };

console.log('(A) Zbiór bramki: młyn tylko rzeka; port nie');
ok(RIVER_ONLY_BUILDING_IDS instanceof Set && RIVER_ONLY_BUILDING_IDS.has('mlyn'), 'RIVER_ONLY_BUILDING_IDS zawiera mlyn');
ok(!(RIVER_ONLY_BUILDING_IDS || new Set()).has('port') && !(RIVER_ONLY_BUILDING_IDS || new Set()).has('port_wielki'), 'porty NIE są w zbiorze „tylko rzeka”');
ok(WATER_ACCESS_BUILDING_IDS.has('port') && !WATER_ACCESS_BUILDING_IDS.has('mlyn'), 'Port nadal w bramce morze/rzeka; mlyn nie');

console.log('(B) availableProduction: młyn wymaga rzeki w zasięgu miasta');
const bData = require('../data/buildings.json');
// Syntetyczna definicja młyna (brak w buildings.json, zastrzeżenie A1 do decyzji właściciela): klon Studni bez
// prerekwizytów i bez awansu. Test NIE wykryje błędu wynikającego z prawdziwej definicji (np. inne id/przedrostek);
// po dodaniu `mlyn` do buildings.json trzeba dopisać asercję na prawdziwym wpisie (patrz (G) — spójność id).
const studnia = bData.find(b => b.id === 'studnia');
const mill = { ...studnia, id: 'mlyn', upgradeFrom: undefined, techUnlock: '-' };
const buildings = [...bData.filter(b => b.id !== 'mlyn'), mill];
const city = { id: 'c1', q: 5, r: 5, ownerId: 0, name: 'T', population: 5, kulturaSkumulowana: 0 };
const mk = (extra) => ({ epoch: 3, builtBuildingIds: [], civBonusy: [], empireResourceStock: { drewno: 999, kamien: 999 }, ...extra });
const ids = (ctx) => availableProduction(city, { buildings, units: [] }, ['Żegluga'], ctx).map(i => i.id);
ok(ids(mk({ cityHasRiver: true })).includes('mlyn'), 'młyn dostępny przy rzece (cityHasRiver=true)');
ok(!ids(mk({ cityHasRiver: false })).includes('mlyn'), 'młyn NIEdostępny bez rzeki (cityHasRiver=false)');
ok(!ids(mk({ cityHasCoastOrRiver: true })).includes('mlyn'), 'samo wybrzeże (cityHasCoastOrRiver) NIE odblokowuje młyna');
ok(!ids(mk({})).includes('mlyn'), 'brak flagi rzeki → młyn NIEdostępny (bezpiecznie domyślnie)');
ok(!ids(mk({ cityHasRiver: false, cityHasCoastOrRiver: true })).includes('mlyn'), 'morze + brak rzeki → młyn NIE');
console.log('(C) Wspólna definicja „przy rzece” (isHexNearRiver)');
ok(isHexNearRiver(map, RIVER.q, RIVER.r) === true, 'heks z rzeką → TAK');
ok(isHexNearRiver(map, RIVER_NB.q, RIVER_NB.r) === true, 'sąsiad rzeki → TAK');
ok(isHexNearRiver(map, DRY.q, DRY.r) === false, 'suchy ląd → NIE');
const lakeMap = makeMap({ lake: [[7, 7]] });
ok(isHexNearRiver(lakeMap, 7, 7) === false, 'jezioro/morze bez rzeki → NIE');
console.log('(D) Stare zapisy z młynem');
let loadOk = true;
try { ids(mk({ cityHasRiver: false, builtBuildingIds: ['mlyn'] })); ids(mk({ cityHasRiver: true, builtBuildingIds: ['mlyn'] })); } catch (_) { loadOk = false; }
ok(loadOk, 'builtBuildingIds zawiera mlyn bez wyjątku (bez rzeki i z rzeką)');
// Bramka działa tylko na LISTĘ dostępnych pozycji: nie może mutować ctx (ani builtBuildingIds) ani zmieniać
// wyniku dla innych budynków. Stan zapisu (JSON przed = JSON po) ma pozostać identyczny.
{
  const ctxOld = mk({ cityHasRiver: false, builtBuildingIds: ['mlyn', 'studnia'] });
  const before = JSON.stringify(ctxOld);
  const outOld = availableProduction(city, { buildings, units: [] }, ['Żegluga'], ctxOld).map(i => i.id);
  ok(JSON.stringify(ctxOld) === before, 'availableProduction nie mutuje ctx/builtBuildingIds (stary zapis z młynem)');
  ok(outOld.every(id => typeof id === 'string'), 'lista dostępnych pozycji dla starego zapisu ma poprawne id');
  const withRiver = ids(mk({ cityHasRiver: true, builtBuildingIds: ['studnia'] })).filter(x => x !== 'mlyn');
  const noRiver = ids(mk({ cityHasRiver: false, builtBuildingIds: ['studnia'] })).filter(x => x !== 'mlyn');
  ok(JSON.stringify(withRiver) === JSON.stringify(noRiver), 'bramka rzeki NIE zmienia dostępności innych budynków (tylko młyn)');
}
console.log('(E) Pin main.ts');
const mainTxt = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(/function cityHasRiverAccess\(city: Pick<City, 'q' \| 'r'>\): boolean \{\s*return isHexNearRiver\(map, city\.q, city\.r\);/.test(mainTxt), 'cityHasRiverAccess = isHexNearRiver(map, q, r)');
const cfgCalls = (mainTxt.match(/cityHasCoastOrRiver: cityHasCoastOrRiverAccess\(/g) || []).length;
const riverCalls = (mainTxt.match(/cityHasRiver: cityHasRiverAccess\(/g) || []).length;
ok(cfgCalls > 0 && riverCalls === cfgCalls, `każde wołanie ctx z cityHasCoastOrRiver ma cityHasRiver (${riverCalls}/${cfgCalls})`);
ok(/getCityHasRiver: \(cityId: string\) => /.test(mainTxt), 'cfg panelu miasta dostaje getCityHasRiver');
console.log('(F) Pin UI');
const panelTxt = fs.readFileSync(path.join(SRC, 'ui', 'cityPanel.ts'), 'utf8');
ok(/Wymaga rzeki przy mieście/.test(panelTxt) && /RIVER_ONLY_BUILDING_IDS\.has\(def\.id\)/.test(panelTxt), 'blokada UI „Wymaga rzeki przy mieście” dla młyna');
console.log('(G) Spójność id „mlyn” (bramka vs. efekty i UI)');
{
  // Zmiana id młyna w buildings.json po stronie danych wyłączyłaby bramkę po cichu — pilnujemy, że wszystkie
  // literały 'mlyn' w src są tym samym id co RIVER_ONLY_BUILDING_IDS (efekt młyna czyta builtIds po 'mlyn').
  const srcFiles = [];
  const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p); else if (/\.ts$/.test(f.name)) srcFiles.push(p);
  } };
  walk(SRC);
  const literalHits = srcFiles.flatMap(f => (fs.readFileSync(f, 'utf8').match(/['"]mlyn['"]/g) || []).map(() => path.basename(f)));
  ok(literalHits.length >= 4, `literały 'mlyn' w src wykryte (${literalHits.length})`);
  const turnEco = fs.readFileSync(path.join(SRC, 'game', 'turn-economy.ts'), 'utf8');
  ok((turnEco.match(/runtimeBuiltIds\.includes\('mlyn'\)/g) || []).length >= 2, 'efekt młyna (turn-economy) czyta runtimeBuiltIds — bramka go nie dotyka');
}
try { fs.rmSync(temp, { recursive: true, force: true }); } catch (_) { /* */ }
console.log(failed === 0 ? 'ALL PASS' : `FAILED=${failed}`);
process.exit(failed === 0 ? 0 : 1);
