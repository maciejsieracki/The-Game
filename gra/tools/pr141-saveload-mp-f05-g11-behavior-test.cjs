'use strict';
/**
 * R-PR141-CODEX-SAVELOAD-20261017 round 1 bounded source-execution repro.
 * No game boot, DOM, world generation, end turn, or product mutation.
 * Runs the real save serializer/deserializer, and executes exact current source
 * functions/statements for the same-map pause path and selected restore blocks.
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');
const civsData = require('../data/civs.json');

const GRA = path.resolve(__dirname, '..');
const MAIN = path.join(GRA, 'src/main.ts');
const source = fs.readFileSync(MAIN, 'utf8');
const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
const artifacts = [
  ['main.ts', MAIN],
  ['save.ts', path.join(GRA, 'src/game/save.ts')],
  ['manpower.ts', path.join(GRA, 'src/game/manpower.ts')],
  ['civ-bonuses.ts', path.join(GRA, 'src/game/civ-bonuses.ts')],
  ['production.ts', path.join(GRA, 'src/game/production.ts')],
  ['economy.ts', path.join(GRA, 'src/game/economy.ts')],
  ['civ-matrix.ts', path.join(GRA, 'src/game/civ-matrix.ts')],
];
for (const [name, file] of artifacts) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  console.log(`SOURCE_SHA256 ${name} ${hash}`);
}
console.log(`SOURCE_SHA256 main-in-memory ${sourceHash}`);

function balancedEnd(text, openIndex, open = '{', close = '}') {
  let depth = 0, quote = null, lineComment = false, blockComment = false, escape = false;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (lineComment) { if (ch === '\n') lineComment = false; continue; }
    if (blockComment) { if (ch === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && next === '/') { lineComment = true; i++; continue; }
    if (ch === '/' && next === '*') { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === open) depth++;
    if (ch === close && --depth === 0) return i + 1;
  }
  throw new Error(`unclosed ${open}${close} block at ${openIndex}`);
}
function extractFunction(signature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `source function found: ${signature}`);
  const open = source.indexOf('{', start);
  const end = balancedEnd(source, open);
  return { text: source.slice(start, end), start, end };
}
function extractAssignmentBlock(signature, assignment, trailing = ';') {
  const fn = extractFunction(signature);
  const start = source.indexOf(assignment, fn.start);
  assert(start >= fn.start && start < fn.end, `restore statement found: ${assignment}`);
  if (trailing === ';') {
    const end = source.indexOf(';', start) + 1;
    assert(end > start && end <= fn.end, `statement end found: ${assignment}`);
    return source.slice(start, end);
  }
  const open = source.indexOf('{', start);
  const end = balancedEnd(source, open);
  return source.slice(start, end);
}
function stripTypeAssertions(code) {
  return code.replace(/\s+as\s+(?:CityProduction|NewGameParams|SaveGame)\b/g, '');
}
function transpileFunction(text) {
  return esbuild.transformSync(text, { loader: 'ts', format: 'cjs', target: 'node18' }).code;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-saveload-r1-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
const absImport = (p) => p.replace(/\\/g, '/');
fs.writeFileSync(entry, [
  `export { serializeGame, deserializeGame, SAVE_VERSION } from '${absImport(path.join(GRA, 'src/game/save.ts'))}';`,
  `export { civManpowerMults, civManpowerMatrixMults, manpowerRegenGain } from '${absImport(path.join(GRA, 'src/game/manpower.ts'))}';`,
  `export { civMatrixBonusyForCivKey, civMovementMultiplier } from '${absImport(path.join(GRA, 'src/game/civ-bonuses.ts'))}';`,
  `export { unitMoneyCost } from '${absImport(path.join(GRA, 'src/game/production.ts'))}';`,
  `export { civBonusyForCivKey } from '${absImport(path.join(GRA, 'src/game/economy.ts'))}';`,
  `export { loadCivMatrix } from '${absImport(path.join(GRA, 'src/game/civ-matrix.ts'))}';`,
].join('\n'));
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'silent' });
const lib = require(bundle);

function check(label, fn) {
  try { fn(); console.log(`PASS ${label}`); return true; }
  catch (e) { console.log(`FAIL ${label}: ${e.message}`); failures++; return false; }
}
let failures = 0;
try {
  check('real SAVE_VERSION is v3', () => assert.equal(lib.SAVE_VERSION, 3));

  // Tiny but schema-shaped v3 fixture. Its second human is Egypt; primary is Zulu.
  const before = {
    wersja: lib.SAVE_VERSION,
    tura: 9,
    seed: 424242,
    units: [{ id: 'u-egypt-chariot', ownerId: 7, typeId: 'Rydwan', typNazwa: 'Rydwan',
      kategoria: 'rydwany', q: 2, r: 3, ruch: 3, ruchLeft: 2 }],
    cities: [{ id: 'c-7', ownerId: 7, nazwa: 'Thebes', q: 4, r: 4, ludki: 5, manpower: 375 }],
    exploredByHuman: [[0, ['0,0']], [7, ['4,4']]],
    gracze: [[0, { era: 2 }], [7, { era: 2 }]],
    humanOwnerIds: [0, 7],
    activeHumanOwnerId: 0,
    cityProd: { 'c-7': { kolejka: [{ kind: 'jednostka', id: 'Impi', nazwa: 'Impi', koszt: 100, postep: 27 }],
      postep: 11, rekrutacja: [{ kind: 'jednostka', id: 'Impi', nazwa: 'Impi', koszt: 100, postep: 23 }] } },
    meta: { newGameParams: { civId: 'zulusi', civId2: 'egipt', seed: 424242,
      mapSize: 'Standardowy', worldType: 'Kontynenty', typSwiata: 'kontynenty' },
      aiOwnerCivMap: [] },
  };
  const decoded = lib.deserializeGame(lib.serializeGame(before));
  check('actual serialize→deserialize preserves hotseat and local state', () => {
    assert.deepEqual(decoded.humanOwnerIds, [0, 7]);
    assert.equal(decoded.activeHumanOwnerId, 0);
    assert.equal(decoded.meta.newGameParams.civId2, 'egipt');
    assert.equal(decoded.units[0].ownerId, 7);
    assert.equal(decoded.units[0].typeId, 'Rydwan');
    assert.equal(decoded.units[0].ruchLeft, 2);
    assert.equal(decoded.cities[0].manpower, 375);
    assert.equal(decoded.cityProd['c-7'].rekrutacja[0].postep, 23);
    assert.equal(decoded.cityProd['c-7'].kolejka[0].postep, 27);
    assert.equal(Object.hasOwn(decoded, 'humanCivByOwner'), false);
    assert.equal(JSON.stringify(decoded).includes('derivedMatrixMultiplier'), false);
  });

  // Execute exact current newGameParamsForLoad function. Stored path returns before
  // its fallback-only map-quality helpers, so no synthetic replacement is involved.
  const paramsFn = extractFunction('function newGameParamsForLoad(saved: SaveGame): NewGameParams | null');
  const paramsCode = transpileFunction(paramsFn.text) + '\nreturn newGameParamsForLoad;';
  const newGameParamsForLoad = new Function('_gameSeed', paramsCode)(424242);
  const loadParams = newGameParamsForLoad(decoded);
  check('current save metadata provides same-map load params with civId2', () => {
    assert.equal(loadParams.civId, 'zulusi');
    assert.equal(loadParams.civId2, 'egipt');
    assert.equal(loadParams.seed, 424242);
  });

  const rebuildFn = extractFunction('function loadNeedsMapRebuild(');
  const rebuildCode = transpileFunction(rebuildFn.text) + '\nreturn loadNeedsMapRebuild;';
  const loadNeedsMapRebuild = new Function('_menuMapSize', '_menuTypSwiata', '_gameSeed', 'typSwiataFromMenuLabel', rebuildCode)(
    'Standardowy', 'kontynenty', 424242, () => 'kontynenty');
  const mustRebuild = loadNeedsMapRebuild(loadParams, 424242, true);
  check('real pause-load predicate selects no-map-rebuild branch', () => assert.equal(mustRebuild, false));

  // Use the exact map-reset statement inside current applyMenuParams.
  const applyFn = extractFunction('function applyMenuParams(params: NewGameParams): void');
  const reset = '_menuCivIdByOwner = new Map([[HUMAN_OWNER_PRIMARY, _menuCivId]]);';
  const resetAt = source.indexOf(reset, applyFn.start);
  assert(resetAt >= applyFn.start && resetAt < applyFn.end, 'exact current applyMenuParams owner-map reset exists');
  let ownerMap = new Map([[0, 'zulusi'], [7, 'egipt']]); // stale prior runtime value before load
  ownerMap = new Function('_menuCivIdByOwner', 'HUMAN_OWNER_PRIMARY', '_menuCivId', `${reset}\nreturn _menuCivIdByOwner;`)(ownerMap, 0, loadParams.civId);
  check('applyMenuParams exact statement resets map to primary only', () => {
    assert.deepEqual(Array.from(ownerMap.entries()), [[0, 'zulusi']]);
  });

  const restoreSig = 'function restoreGameFromSave(saved: SaveGame): void';
  const humanSeatsStatement = extractAssignmentBlock(restoreSig, 'humanSeats = {', ';');
  const restoreFnSource = extractFunction(restoreSig);
  const civMapRestoreCall = 'restoreHumanCivOwnerMaps(saved, humanSeats.humanOwnerIds);';
  check('restoreGameFromSave invokes human civ restoration after rebuilding seats', () => {
    const seatsAt = source.indexOf(humanSeatsStatement, restoreFnSource.start);
    const mapCallAt = source.indexOf(civMapRestoreCall, restoreFnSource.start);
    assert(seatsAt >= restoreFnSource.start && mapCallAt > seatsAt && mapCallAt < restoreFnSource.end);
  });
  const restoreSeats = new Function('humanSeats', 'saved', `${humanSeatsStatement}\nreturn humanSeats;`)(
    { humanOwnerIds: [], activeHumanOwnerId: -1 }, decoded);
  check('exact restore statement restores both hotseat IDs and active owner', () => {
    assert.deepEqual(restoreSeats, { humanOwnerIds: [0, 7], activeHumanOwnerId: 0 });
  });

  // Run the exact production helper called immediately after that restore statement.
  // It gets real saved params / human owner IDs and isolated mutable closure state.
  const civRestoreFn = extractFunction('function restoreHumanCivOwnerMaps(saved: SaveGame, humanOwnerIds: readonly number[]): void');
  const civRestoreCode = transpileFunction(civRestoreFn.text) +
    '\nreturn { restoreHumanCivOwnerMaps, get ownerMap(){return _menuCivIdByOwner;}, get playerTypes(){return playerCivTypeByHuman;}, get playerBonuses(){return playerCivBonusyByHuman;} };';
  const civRestore = new Function('_menuCivId', 'player', 'data', 'HUMAN_OWNER_PRIMARY',
    'playerCivTypeByHuman', 'playerCivBonusyByHuman', civRestoreCode)(
    loadParams.civId, { civType: 'zulusi', civBonusy: [] }, { civs: civsData }, 0,
    new Map([[0, 'stale'], [7, 'stale']]), new Map([[0, []], [7, []]]));
  civRestore.restoreHumanCivOwnerMaps(decoded, restoreSeats.humanOwnerIds);
  ownerMap = civRestore.ownerMap;
  check('restore helper assigns saved secondary civ without hardcoded owner ID', () => {
    assert.equal(ownerMap.get(7), 'egipt');
    assert.equal(ownerMap.get(42), undefined);
    assert.equal(civRestore.playerTypes.get(7), 'egipt');
  });
  civRestore.restoreHumanCivOwnerMaps({ ...decoded, humanOwnerIds: [0, 42] }, [0, 42]);
  check('restore helper maps an arbitrary runtime secondary owner ID', () => {
    assert.equal(civRestore.ownerMap.get(42), 'egipt');
    assert.equal(civRestore.ownerMap.has(7), false);
  });
  civRestore.restoreHumanCivOwnerMaps(decoded, restoreSeats.humanOwnerIds);
  ownerMap = civRestore.ownerMap;

  // Execute the actual unit and production restore statements from restoreGameFromSave.
  const restoreFn = extractFunction(restoreSig);
  const unitAnchor = 'units.length = 0;';
  const unitStart = source.indexOf(unitAnchor, restoreFn.start);
  const unitEndMarker = 'syncAllRuntimeUnitHpState();';
  const unitEnd = source.indexOf(unitEndMarker, unitStart) + unitEndMarker.length;
  assert(unitStart > restoreFn.start && unitEnd > unitStart && unitEnd <= restoreFn.end, 'bounded actual unit restore statements found');
  const unitSnippet = source.slice(unitStart, source.indexOf(unitEndMarker, unitStart));
  const restoredUnits = [{ id: 'stale', ownerId: 3 }];
  new Function('units', 'saved', unitSnippet)(restoredUnits, decoded);
  check('actual restore unit statements replace stale runtime unit state', () => {
    assert.equal(restoredUnits.length, 1);
    assert.equal(restoredUnits[0].ownerId, 7);
    assert.equal(restoredUnits[0].typeId, 'Rydwan');
  });

  const prodAnchor = 'cityProd.clear();';
  const prodStart = source.indexOf(prodAnchor, restoreFn.start);
  const prodIf = source.indexOf('if (saved.cityProd) {', prodStart);
  const prodEnd = balancedEnd(source, source.indexOf('{', prodIf));
  assert(prodStart > restoreFn.start && prodEnd <= restoreFn.end, 'bounded actual cityProd restore statements found');
  const prodSnippet = stripTypeAssertions(source.slice(prodStart, prodEnd));
  const restoredProd = new Map([['stale-city', { kolejka: [] }]]);
  new Function('cityProd', 'saved', prodSnippet)(restoredProd, decoded);
  check('actual restore cityProd statements preserve paid recruitment queue', () => {
    assert.equal(restoredProd.has('stale-city'), false);
    assert.equal(restoredProd.get('c-7').rekrutacja[0].postep, 23);
    assert.equal(restoredProd.get('c-7').kolejka[0].postep, 27);
  });

  // Call actual current civTypeForOwner closure with the runtime map after the reset
  // and the real loaded seat. This is the observable source-level red reproduction.
  const civTypeFn = extractFunction('function civTypeForOwner(ownerId: number): string');
  const aiOwnerCivMap = new Map([[99, 'chinczycy']]);
  const resolveCiv = new Function('_menuCivIdByOwner', 'isMeSafe', 'player', '_menuCivId', 'aiOwnerCivMap',
    `${transpileFunction(civTypeFn.text)}\nreturn civTypeForOwner;`)(ownerMap, (id) => id === 0, { civType: 'zulusi' }, 'zulusi', aiOwnerCivMap);
  const actualSecondaryCiv = resolveCiv(7);
  check('actual per-owner resolver returns saved secondary civ after restore', () => {
    assert.equal(actualSecondaryCiv, 'egipt');
    assert.equal(resolveCiv(99), 'chinczycy');
  });

  // The saved second civ resolves the same when that seat, rather than primary,
  // is active. The resolver's owner map must outrank active-player fallback.
  const activeSecondaryResolve = new Function('_menuCivIdByOwner', 'isMeSafe', 'player', '_menuCivId', 'aiOwnerCivMap',
    `${transpileFunction(civTypeFn.text)}\nreturn civTypeForOwner;`)(ownerMap, (id) => id === 7, { civType: 'zulusi' }, 'zulusi', aiOwnerCivMap);
  check('secondary owner civ remains stable when secondary seat is active', () => {
    assert.equal(activeSecondaryResolve(7), 'egipt');
    assert.equal(activeSecondaryResolve(0), 'zulusi');
  });

  // A historical save without civId2 cannot recover the old selection; safely map
  // its restored secondary owner to the primary civ and do not synthesize AI state.
  const legacySaved = { ...decoded, humanOwnerIds: [0, 42], meta: { ...decoded.meta,
    newGameParams: { ...decoded.meta.newGameParams, civId2: undefined } } };
  const legacyMapBox = new Function('_menuCivId', 'player', 'data', 'HUMAN_OWNER_PRIMARY', 'playerCivTypeByHuman', 'playerCivBonusyByHuman',
    `let _menuCivIdByOwner = new Map();\n${transpileFunction(civRestoreFn.text)}\nreturn function(saved, ids){restoreHumanCivOwnerMaps(saved, ids); return _menuCivIdByOwner;};`)(
    'zulusi', { civType: 'zulusi', civBonusy: [] }, { civs: civsData }, 0, new Map(), new Map());
  const legacyOwnerMap = legacyMapBox(legacySaved, [0, 42]);
  const legacyResolve = new Function('_menuCivIdByOwner', 'isMeSafe', 'player', '_menuCivId', 'aiOwnerCivMap',
    `${transpileFunction(civTypeFn.text)}\nreturn civTypeForOwner;`)(legacyOwnerMap, () => false, { civType: 'zulusi' }, 'zulusi', aiOwnerCivMap);
  check('legacy save without civId2 falls back to primary and preserves AI roster', () => {
    assert.equal(legacyResolve(42), 'zulusi');
    assert.equal(legacyResolve(99), 'chinczycy');
    assert.equal(legacyOwnerMap.has(99), false);
  });

  // Relevant pure consumers are real module exports. Feed both the resolver result
  // and expected saved civ to show what mapping controls; these are bounded module
  // checks, not whole turn/battle acceptance.
  const civKeyFn = extractFunction('function civKeyForOwnerId(ownerId: number): string');
  const ownerMpFn = extractFunction('function civManpowerMultsForOwner(ownerId: number) {');
  const ownerMpResolver = new Function('_menuCivIdByOwner', 'player', 'aiOwnerCivMap', 'civBonusyForCivKey', 'data', 'loadCivMatrix',
    'civManpowerMults', 'civManpowerMatrixMults',
    `${transpileFunction(civKeyFn.text)}\n${transpileFunction(ownerMpFn.text)}\nreturn civManpowerMultsForOwner;`)(
    ownerMap, { civType: 'zulusi', civBonusy: [] }, aiOwnerCivMap, lib.civBonusyForCivKey,
    { civs: civsData }, lib.loadCivMatrix, lib.civManpowerMults, lib.civManpowerMatrixMults);
  const secondaryMpActual = ownerMpResolver(7);
  const egyptLegacyMp = lib.civManpowerMults(lib.civBonusyForCivKey('egipt', civsData));
  const secondaryMpExpected = lib.civManpowerMatrixMults('egipt', undefined, egyptLegacyMp);
  const egiptBonuses = lib.civMatrixBonusyForCivKey(actualSecondaryCiv);
  const secondaryChariotMoveActual = lib.civMovementMultiplier(egiptBonuses, { typNazwa: 'Rydwan', rola: 'rydwany' });
  const egyptMovementExpected = lib.civMovementMultiplier(lib.civMatrixBonusyForCivKey('egipt'), { typNazwa: 'Rydwan', rola: 'rydwany' });
  const egyptNonChariotMovement = lib.civMovementMultiplier(lib.civMatrixBonusyForCivKey('egipt'), { typNazwa: 'Łucznik', rola: 'piechota' });
  check('actual secondary-owner MP consumer resolves saved Egyptian multipliers', () => {
    assert.deepEqual(secondaryMpActual, secondaryMpExpected);
  });
  check('actual secondary-owner chariot movement consumer resolves Egyptian movement', () => {
    assert.equal(secondaryChariotMoveActual, egyptMovementExpected);
    assert.equal(egyptNonChariotMovement, 1);
  });
  console.log(`CONSUMER_TRACE secondaryOwner=7 savedCiv=egipt resolvedCiv=${actualSecondaryCiv}`);
  console.log(`CONSUMER_TRACE mpResolved=${JSON.stringify(secondaryMpActual)} mpExpectedEgypt=${JSON.stringify(secondaryMpExpected)}`);
  console.log(`CONSUMER_TRACE egyptChariotMoveResolved=${secondaryChariotMoveActual} expected=${egyptMovementExpected}`);

  // Primary Zulu remains resolvable and current G11 module behavior can be recomputed
  // from current source data after save/load, with Impi-only negative control.
  const zuluBonuses = lib.civMatrixBonusyForCivKey(resolveCiv(0));
  const impiCost = lib.unitMoneyCost(100, zuluBonuses, undefined, 0, 'normal', 'Impi');
  const nonImpiCost = lib.unitMoneyCost(100, zuluBonuses, undefined, 0, 'normal', 'Archer');
  check('real G11 pricing consumer retains Impi-only targeting after roundtrip', () => {
    assert.equal(typeof impiCost, 'number');
    assert.equal(nonImpiCost, 100);
    assert(impiCost <= 100);
  });
  console.log(`CONSUMER_TRACE primary=zulu impiCost=${impiCost} nonImpiCost=${nonImpiCost}`);

  if (failures) {
    console.log(`RESULT RED_REPRO_CONFIRMED ${failures} failing assertion(s); current source does not restore the secondary human civ mapping.`);
    process.exitCode = 1;
  } else {
    console.log('RESULT BOUNDED_SOURCE_EXECUTION_PASS; this does not prove full-game save/load.');
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
