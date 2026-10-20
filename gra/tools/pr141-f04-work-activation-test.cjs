'use strict';

// Run from gra/: node tools/pr141-f04-work-activation-test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-f04-work-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
const shim = path.join(tmp, 'civ-matrix.ts');
const matrixPath = path.resolve(__dirname, '..', 'data/civ-matrix.json');
const matrixBytesBefore = fs.readFileSync(matrixPath);
const src = path.resolve(__dirname, '..', 'src');
fs.writeFileSync(entry, [
  `export { cityYieldPerTurn, loadEconParams } from ${JSON.stringify(path.join(src, 'game/economy'))};`,
  `export { loadCivMatrix } from ${JSON.stringify(path.join(src, 'game/civ-matrix'))};`,
  `export { TerenBazowy, Nakladka } from ${JSON.stringify(path.join(src, 'types/hex'))};`,
  `export { splitPraca } from ${JSON.stringify(path.join(src, 'game/production'))};`,
  `export { toEconomyCity } from ${JSON.stringify(path.join(src, 'game/turn-economy'))};`,
].join('\n'), 'utf8');
fs.writeFileSync(shim, `
import actual from ${JSON.stringify(matrixPath)};
export function civMatrixParam(civ: string, id: string): number {
  const override = (globalThis as any).__pr141WorkOverrides?.[civ];
  if (override && Object.prototype.hasOwnProperty.call(override, id)) return override[id];
  const row = actual.cywilizacje.find((r: any) => r.ikonaId === civ || r.typCywilizacji === civ || r.Cywilizacja === civ);
  return row?.params?.[id] ?? actual.defaults?.[id] ?? 0;
}
export function civMatrixParamDef(id: string): any { return actual.paramDefs?.[id]; }
export function applyCivMatrixParam(base: number, civ: string, id: string): number {
  const value = civMatrixParam(civ, id);
  switch (civMatrixParamDef(id)?.formula ?? 'mul_proc') { case 'mul_abs': return base * value; case 'add': return base + value; case 'flag': case 'skala': case 'stat_abs': return value; default: return base * (1 + value); }
}
export function civMatrixParamAtDifficulty(civ: string, id: string) { return civMatrixParam(civ, id); }
export function civMatrixParamsAtDifficulty(civ: string) { return Object.fromEntries(Object.keys(actual.paramDefs).map((id: string) => [id, civMatrixParam(civ, id)])); }
export function loadCivMatrix() { return actual; }
`, 'utf8');
const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

function extractFunction(source, name) {
  const match = new RegExp(`function ${name}\\s*\\(`).exec(source);
  assert.ok(match, `main.ts contains ${name}`);
  const open = source.indexOf('{', match.index);
  let depth = 0, quote = null, escape = false, lineComment = false, blockComment = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i], next = source[i + 1];
    if (lineComment) { if (ch === '\n') lineComment = false; continue; }
    if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (ch === '\\') { escape = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === '/' && next === '/') { lineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { blockComment = true; i++; continue; }
    if (ch === '\"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}
const civTypeFn = extractFunction(mainSource, 'civTypeForOwner');
const civKeyFn = extractFunction(mainSource, 'civKeyForOwnerId');
const transpile = text => esbuild.transformSync(text, { loader: 'ts', format: 'cjs', target: 'node18' }).code;
(async () => {
try {
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.json': 'json', '.ts': 'ts' }, outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'),
    plugins: [{ name: 'single-field-virtual-matrix', setup(build) { build.onResolve({ filter: /(?:^|\/)civ-matrix$/ }, () => ({ path: shim })); } }], logLevel: 'silent' });
  const M = require(bundle);
  const matrix = M.loadCivMatrix();
  assert.equal(matrix.paramDefs.eko_praca_proc.formula, 'mul_proc', 'approved field is a raw mul_proc');
  assert.equal(matrix.paramDefs.eko_praca_proc.jednostka, 'ulamek', 'source unit is a fraction');
  const paramsRaw = require('../data/econ-params.json');
  const params = M.loadEconParams(paramsRaw, 'normal');
  const tile = { terenBazowy: M.TerenBazowy.Rownina, nakladka: M.Nakladka.Brak, maRzeke: false };
  const tiles = Array.from({ length: 50 }, () => tile);
  const cityShape = { id: 'work-activation', ownerId: 0, population: 2,
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy: { procentBudynki: 60 }, specjalisci: [] };
  const ctx = { wojskoZuzycieZywnosci: 0, strataFraction: 0, maMlyn: false, maCegielnia: false,
    maTargowisko: false, maMennica: false, mennicaMnoznik: 1, maBiblioteka: false, walutaOdkryta: false };
  const keys = matrix.cywilizacje.map(row => row.ikonaId);
  const civData = require('../data/civs.json');
  assert.equal(keys.length, 15, 'consumer fixtures cover all 15 source civilization rows');
  const ownerMap = new Map([[0, keys[0]], [7, keys[1]], [42, keys[2]]]);
  const aiMap = new Map(matrix.cywilizacje.slice(3).map((row, i) => [99 + i, row.ikonaId]));
  const resolveOwnerKey = (activeId) => new Function('_menuCivIdByOwner', 'isMeSafe', 'player', '_menuCivId', 'aiOwnerCivMap', 'playerCivTypeByHuman', 'data', 'loadCivMatrix', 'HUMAN_OWNER_PRIMARY',
    `${transpile(civTypeFn)}\n${transpile(civKeyFn)}\nreturn civKeyForOwnerId;`)(
      ownerMap, id => id === activeId, { civType: activeId === 7 ? keys[1] : keys[0] }, keys[0], aiMap,
      new Map(), { civs: civData }, () => matrix, 0);
  let positive = 0;
  let negative = 0;
  let zero = 0;
  const unrelated = ['pieniadz', 'zywnosc', 'nauka', 'luksus', 'zadowolenie', 'zywnoscBrutto',
    'handelBrutto', 'pracaTerenu', 'pracaBudynkow', 'pieniadzZPracy', 'pieniadzBudynkow', 'drewnoTerenu', 'kamienTerenu'];
  const neutralCity = M.toEconomyCity(cityShape, params, false, 0, {}, undefined, undefined, undefined);
  const neutral = M.cityYieldPerTurn(neutralCity, tiles, [], params, ctx);
  for (const [index, row] of matrix.cywilizacje.entries()) {
    const raw = row.params.eko_praca_proc;
    if (raw > 0) positive++;
    else if (raw < 0) negative++;
    else zero++;
    const ownerId = index < 3 ? [0, 7, 42][index] : 99 + index - 3;
    const resolvedKey = resolveOwnerKey(7)(ownerId);
    assert.equal(resolvedKey, row.ikonaId, `${row.ikonaId}: actual owner helper resolves fixture key`);
    globalThis.__pr141WorkOverrides = { [row.ikonaId]: { eko_praca_proc: 0 } };
    const ownerCity = M.toEconomyCity({ ...cityShape, ownerId }, params, false, 0, {}, undefined, undefined, resolvedKey);
    const sameOwnerBaseline = M.cityYieldPerTurn(ownerCity, tiles, [], params, ctx);
    globalThis.__pr141WorkOverrides = { [row.ikonaId]: { eko_praca_proc: raw } };
    const result = M.cityYieldPerTurn(ownerCity, tiles, [], params, ctx);
    const expected = Math.max(0, Math.round(sameOwnerBaseline.praca * (1 + raw)));
    assert.equal(result.praca, expected, `${row.ikonaId}: raw coefficient applies once before integer rounding`);
    for (const field of unrelated) assert.equal(result[field], sameOwnerBaseline[field], `${row.ikonaId}: isolated work perturbation preserves ${field} at same owner-source baseline`);
    const split = M.splitPraca(result.praca, cityShape.podziałPracy.procentBudynki / 100);
    assert.equal(split.total, result.praca, `${row.ikonaId}: downstream split receives adapted integer work`);
    assert.equal(split.doBudynkow + split.doPuli, result.praca, `${row.ikonaId}: split preserves total work`);
  }
  assert.ok(positive > 0 && negative > 0 && zero > 0, 'source fixture includes positive, negative, and zero values');

  // No owner key is neutral; it must not silently borrow Greek's +2% coefficient.
  assert.equal(neutral.praca, M.cityYieldPerTurn(neutralCity, tiles, [], params, ctx).praca);
  globalThis.__pr141WorkOverrides = {};
  const romanCity = M.toEconomyCity(cityShape, params, false, 0, {}, undefined, undefined, 'rzymianie');
  const roman = M.cityYieldPerTurn(romanCity, tiles, [], params, ctx);
  assert.equal(roman.praca, neutral.praca, 'approved source zero overrides any legacy fallback');
  const greekCity = M.toEconomyCity(cityShape, params, false, 0, {}, undefined, undefined, 'grecy');
  assert.notEqual(roman.praca, M.cityYieldPerTurn(greekCity, tiles, [], params, ctx).praca,
    'wrong-owner control distinguishes source-zero Roman from Greek');

  // mul_proc is not difficulty-scaled; difficulty remains relevant to unrelated economy parameters only.
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const atDifficulty = M.loadEconParams(paramsRaw, difficulty);
    globalThis.__pr141WorkOverrides = { fenicjanie: { eko_praca_proc: 0 } };
    const difficultyCity = M.toEconomyCity(cityShape, atDifficulty, false, 0, {}, undefined, undefined, 'fenicjanie');
    const difficultyBaseline = M.cityYieldPerTurn(difficultyCity, tiles, [], atDifficulty, ctx);
    globalThis.__pr141WorkOverrides = { fenicjanie: { eko_praca_proc: 0.05 } };
    const result = M.cityYieldPerTurn(difficultyCity, tiles, [], atDifficulty, ctx);
    assert.equal(result.praca, Math.round(difficultyBaseline.praca * 1.05), `${difficulty}: raw coefficient is not difficulty-scaled`);
  }

  // Execute the exact main.ts owner functions with menu-seat and AI owner maps.
  for (const activeId of [0, 7]) {
    const resolve = resolveOwnerKey(activeId);
    assert.equal(resolve(0), keys[0], `active human ${activeId}: primary seat resolves its own key`);
    assert.equal(resolve(7), keys[1], `active human ${activeId}: second seat resolves its own key`);
    assert.equal(resolve(42), keys[2], `active human ${activeId}: other seat-map owner resolves independently`);
    assert.equal(resolve(99), matrix.cywilizacje[3].ikonaId, `active human ${activeId}: AI owner uses AI map`);
  }
  globalThis.__pr141WorkOverrides = {};
  const resolve = resolveOwnerKey(7);
  const seatCases = [[0, keys[0]], [7, keys[1]], [42, keys[2]], [99, matrix.cywilizacje[3].ikonaId]];
  for (const [ownerId, key] of seatCases) {
    const routedCity = M.toEconomyCity({ ...cityShape, ownerId }, params, false, 0, {}, undefined, undefined, resolve(ownerId));
    const result = M.cityYieldPerTurn(routedCity, tiles, [], params, ctx);
    const raw = matrix.cywilizacje.find(row => row.ikonaId === key).params.eko_praca_proc;
    assert.equal(result.praca, Math.round(neutral.praca * (1 + raw)), `actual owner ${ownerId}/${key} routes into work consumer`);
  }
  assert.equal(resolve(1234), '', 'unmapped owner has no civ key and cannot borrow the presentation fallback');
  const human2 = M.cityYieldPerTurn(M.toEconomyCity({ ...cityShape, ownerId: 7 }, params, false, 0, {}, undefined, undefined, resolve(7)), tiles, [], params, ctx);
  const wrongGreek = M.cityYieldPerTurn(M.toEconomyCity({ ...cityShape, ownerId: 7 }, params, false, 0, {}, undefined, undefined, keys[0]), tiles, [], params, ctx);
  assert.notEqual(human2.praca, wrongGreek.praca, 'hot-seat second-human source key changes the actual work output from Greek fallback');
  const panel = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui', 'cityPanel.ts'), 'utf8');
  assert.match(panel, /ownerDefaultPodzial,\s*undefined,\s*cfg\.getCivKey\?\.\(city\.ownerId\),/,
    'CityPanel forwarding remains connected to the bounded adapter path');

  console.log(`PASS: F04 work activation for ${keys.length} owners (${positive} positive, ${negative} negative, ${zero} zero), split preservation, neutral/mismatch controls, difficulty invariance, and panel owner route`);
} finally {
  assert.deepEqual(fs.readFileSync(matrixPath), matrixBytesBefore, 'approved civ-matrix source file remains unchanged by virtual single-field perturbations');
  fs.rmSync(tmp, { recursive: true, force: true });
}
})().catch(error => { console.error(error); process.exitCode = 1; });
