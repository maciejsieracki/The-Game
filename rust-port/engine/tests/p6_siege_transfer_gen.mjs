// R-RUSTPORT-P6-SIEGE-TRANSFER-Q3-Q1 (r2): generator wektorow galezi Transfer ORAZ skutkow przejecia miasta.
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, pliki tylko do odczytu, poza repo):
//   * gra/src/main.ts: besiegerOwnerForCity, resolveSiegeSurrender (galaz newOwner, do enterCityAfterSurrender),
//     parseWonderProdId, sanitizeProductionQueue (closure, main.ts:5123), stala WONDER_PROD_PREFIX;
//   * gra/src/units/setup.ts: hexDistance;
//   * gra/src/game/display-names.ts: clearCityStateFlagOnCapture;
//   * gra/src/game/production.ts: sanitizeBuildQueue, filterQueue, dropFrontItem;
//   * gra/src/game/cities.ts: applyCapturePopulationLoss, stampCityFounderOnCapture, stala CAPTURE_POP_LOSS;
//   * gra/data/miasto-params.json: wartosc capture_pop_loss (dla CAPTURE_POP_LOSS).
//   * (Q4-Q1 r2) gra/src/game/post-capture-law.ts: applyPostCaptureLawOnCapture, isRebellionReconquest, stale
//     POST_CAPTURE_FRESH_TURNS / POST_CAPTURE_REBELLION_RECONQUEST_TURNS;
//   * (Q4-Q1 r2) gra/src/game/society-breakdown.ts: stala REBEL_FACTION_OWNER_ID;
//   * (Q4-Q1 r2) gra/src/game/barbarians.ts: isBarbarian, stala BARBARIAN_OWNER_ID;
//   * (Q4-Q1 r2) gra/src/main.ts: triggerRebelProtectionWarConsequence (wycinane z zagniezdzenia closure).
//   Atrapa ownerDeclareWarOn NIE jest stubem bez danych: zapisuje argumenty do `declareWar` (wektor transfer).
//
// Wykonywane REALNIE (wycinane po nazwie, typy zdejmowane przez node:module.stripTypeScriptTypes, uruchamiane w `with`
// na Proxy): wszystkie funkcje wymienione wyzej. Nie ma stubow dla applyCapturePopulationLoss, sanitizeBuildQueue,
// sanitizeProductionQueue ani filterQueue.
//
// Jawne wejscia scenariusza (NIE logika weba, tylko dane przekazywane do wykonywanych funkcji):
//   * wonderGateOk(ownerId, wid) - tabela scenariusza `wonderOk` (nie zapisuje sie w `calls`);
//   * setOwnerPracaPool / ownerPracaPool - mapa puli Pracy; wynik to zapisane wartosci (`praca`), nie wolania;
//   * data.buildings (lokalizacja 'stolica'), capitalCityIdForOwner, cityProd - dane scenariusza.
// Identyfikator spoza `vars`/wycinkow trafia do atrapy, ktora ZAPISUJE wolanie w `calls` i zwraca undefined.
// Lista takich wolan (poza tabela TRANSFER_EFFECTS) jest blad generatora. W wektorach efektow (`effects.*`)
// `calls` musi byc puste - to dowod, ze zadna z wykonywanych funkcji nie zawiera atrapy.
// Sentinel `Stop` przerywa resolveSiegeSurrender w miejscu enterCityAfterSurrender (po splice obroncow i population).
//
// Uzycie (dziewiec plikow wejsciowych spoza repo, wynik na stdout):
//   node tests/p6_siege_transfer_gen.mjs <main.ts@pin> <units/setup.ts@pin> <display-names.ts@pin> \
//     <production.ts@pin> <cities.ts@pin> <miasto-params.json@pin> <post-capture-law.ts@pin> \
//     <society-breakdown.ts@pin> <barbarians.ts@pin> > tests/p6_siege_transfer_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const [mainPath, setupPath, displayPath, prodPath, citiesPath, paramsPath, postLawPath, societyPath, barbPath] = process.argv.slice(2);
if (!mainPath || !setupPath || !displayPath || !prodPath || !citiesPath || !paramsPath || !postLawPath || !societyPath || !barbPath) {
  throw new Error('uzycie: gen.mjs <main.ts> <units/setup.ts> <display-names.ts> <production.ts> <cities.ts> <miasto-params.json> <post-capture-law.ts> <society-breakdown.ts> <barbarians.ts>');
}
const readLines = p => readFileSync(p, 'utf8').split('\n');
const mainLines = readLines(mainPath);
const setupLines = readLines(setupPath);
const displayLines = readLines(displayPath);
const prodLines = readLines(prodPath);
const citiesLines = readLines(citiesPath);
const postLawLines = readLines(postLawPath);
const societyLines = readLines(societyPath);
const barbLines = readLines(barbPath);
const miastoParams = JSON.parse(readFileSync(paramsPath, 'utf8'));

function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

// Stała `const NAME ... ;` (jednolinijkowa lub wieloliniowa, kończąca się średnikiem).
function extractConst(lines, name) {
  const re = new RegExp(`^\\s*(export )?const ${name}\\b`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak stalej ${name}`);
  let end = start;
  while (!lines[end].trimEnd().endsWith(';')) end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

const SRC = {
  WONDER_PROD_PREFIX: extractConst(mainLines, 'WONDER_PROD_PREFIX'),
  CAPTURE_POP_LOSS: extractConst(citiesLines, 'CAPTURE_POP_LOSS'),
  hexDistance: extractFn(setupLines, 'hexDistance'),
  besiegerOwnerForCity: extractFn(mainLines, 'besiegerOwnerForCity'),
  clearCityStateFlagOnCapture: extractFn(displayLines, 'clearCityStateFlagOnCapture'),
  resolveSiegeSurrender: extractFn(mainLines, 'resolveSiegeSurrender'),
  parseWonderProdId: extractFn(mainLines, 'parseWonderProdId'),
  sanitizeProductionQueue: extractFn(mainLines, 'sanitizeProductionQueue'),
  sanitizeBuildQueue: extractFn(prodLines, 'sanitizeBuildQueue'),
  filterQueue: extractFn(prodLines, 'filterQueue'),
  dropFrontItem: extractFn(prodLines, 'dropFrontItem'),
  stampCityFounderOnCapture: extractFn(citiesLines, 'stampCityFounderOnCapture'),
  applyCapturePopulationLoss: extractFn(citiesLines, 'applyCapturePopulationLoss'),
  POST_CAPTURE_FRESH_TURNS: extractConst(postLawLines, 'POST_CAPTURE_FRESH_TURNS'),
  POST_CAPTURE_REBELLION_RECONQUEST_TURNS: extractConst(postLawLines, 'POST_CAPTURE_REBELLION_RECONQUEST_TURNS'),
  isRebellionReconquest: extractFn(postLawLines, 'isRebellionReconquest'),
  applyPostCaptureLawOnCapture: extractFn(postLawLines, 'applyPostCaptureLawOnCapture'),
  REBEL_FACTION_OWNER_ID: extractConst(societyLines, 'REBEL_FACTION_OWNER_ID'),
  BARBARIAN_OWNER_ID: extractConst(barbLines, 'BARBARIAN_OWNER_ID'),
  isBarbarian: extractFn(barbLines, 'isBarbarian'),
  triggerRebelProtectionWarConsequence: extractFn(mainLines, 'triggerRebelProtectionWarConsequence'),
};

class Stop extends Error {}
const GLOBALS = new Set(['Math', 'Number', 'Object', 'Array', 'JSON', 'Map', 'Set', 'String', 'Boolean',
  'console', 'undefined', 'NaN', 'Infinity', 'Error', 'Symbol']);

function load(names, vars, calls) {
  const code = names.map(n => stripTypeScriptTypes(SRC[n])).join('\n');
  const body = `with (S) {\n${code}\nreturn { ${names.join(', ')} };\n}`;
  const scope = new Proxy({}, {
    has: (_t, k) => typeof k === 'string' && !GLOBALS.has(k),
    get: (_t, k) => {
      if (k === Symbol.unscopables) return undefined;
      if (k in vars) return vars[k];
      return deepStub(String(k), calls);
    },
  });
  return new Function('S', body)(scope);
}

function deepStub(name, calls) {
  return new Proxy(function () {}, {
    get: (_t, k) => {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'length') return 0;
      return deepStub(`${name}.${String(k)}`, calls);
    },
    apply: () => { calls.push(name); return undefined; },
  });
}

function makeRnd(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OWNERS = [0, 1, 2, 3];
const OWNERS_ALL = [0, 1, 2, 3, 9];
const OPT_OWNERS = [undefined, 0, 1, 2, 3, 9];
const POPS = [0, 0.4, 1, 1.5, 2.7, 12, 25, 40, 100, NaN];
const POSTEPS = [undefined, 0, 1, 2.5, 3, 7];
const ITEM_IDS = ['palac', 'mennica', 'mur', 'zbrojownia', 'lucznik', '__wonder__:w1', '__wonder__:w2', '__wonder__:w3', '__wonder__:', '__wonder__:w9', 'nieznany'];
const BUILDINGS = [
  { id: 'palac', lokalizacja: 'stolica' },
  { id: 'mennica', lokalizacja: 'stolica' },
  { id: 'mur', lokalizacja: 'miasto' },
  { id: 'zbrojownia', lokalizacja: 'miasto' },
];
const enc = v => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v === undefined ? null : v);
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
const flag = rnd => pick(rnd, [true, false, undefined]);

function makeEnemy(rnd, forced) {
  const table = {};
  for (const a of OWNERS_ALL) for (const b of OWNERS_ALL) table[`${a}-${b}`] = rnd() < 0.5;
  if (forced) table[`${forced[0]}-${forced[1]}`] = true;
  return { enemy: (a, b) => table[`${a}-${b}`] };
}

function makeProd(rnd) {
  const n = Math.floor(rnd() * 5);
  const kolejka = [];
  for (let k = 0; k < n; k++) {
    const id = pick(rnd, ITEM_IDS);
    const kind = id === 'lucznik' || rnd() < 0.2 ? 'jednostka' : 'budynek';
    kolejka.push({ kind, id, nazwa: id, koszt: 10, postep: pick(rnd, POSTEPS) });
  }
  return { kolejka, postep: pick(rnd, [0, 1, 3, 4]) };
}

function makeWonderOk(rnd) {
  return { w1: rnd() < 0.5, w2: rnd() < 0.5, w3: rnd() < 0.5 };
}

const itemOut = i => ({ kind: i.kind, id: i.id, postep: enc(i.postep) });
const prodOut = p => (p ? { kolejka: p.kolejka.map(itemOut), postep: enc(p.postep) } : null);
const poolOut = pool => Object.fromEntries([...pool.entries()].sort((a, b) => a[0] - b[0]));

// Uruchomienie galezi Transfer: stan miasta/jednostek/kolejki po przerwaniu oraz zalogowane wolania.
function runTransfer(scn) {
  const calls = [];
  const pool = new Map();
  const warCalls = [];
  const city = {
    id: 'c', name: 'C', q: scn.cityQ, r: scn.cityR, ownerId: scn.cityOwner, population: scn.pop,
    startCityState: scn.startCityState, foundedByOwner: scn.foundedByOwner, rebelState: scn.rebelState,
    foundedBy: scn.foundedBy, capturedFromOwnerId: scn.capturedFromOwnerId,
    rebelPreviousOwnerId: scn.rebelPreviousOwnerId,
    postCaptureLawTurnsRemaining: scn.postCaptureLawTurnsRemaining,
    wasRebellionReconquest: scn.wasRebellionReconquest,
    rebelProtectionTurnsRemaining: scn.rebelProtectionTurnsRemaining,
    revoltGraceRemaining: scn.revoltGraceRemaining,
  };
  const units = scn.units.map(u => ({ ...u }));
  const siegeBesiegerByCity = new Map([['c', scn.besieger]]);
  const cityProd = new Map(scn.prod ? [['c', scn.prod]] : []);
  const vars = {
    cities: [city], units, siegeBesiegerByCity, cityProd, miastoParams,
    siegeTurnByCity: new Map(), siegeAiStateByKey: new Map(),
    data: { buildings: BUILDINGS },
    capitalCityIdForOwner: () => (scn.isNewCapital ? 'c' : 'x'),
    wonderGateOk: (_ownerId, wid) => scn.wonderOk[wid] === true,
    setOwnerPracaPool: (o, v) => { pool.set(o, v); },
    ownerPracaPool: o => pool.get(o) ?? 0,
    areEnemyOwners: (a, b) => { calls.push('areEnemyOwners'); return scn.enemy(a, b); },
    wasIndependentCityStateBeforeCapture: () => { calls.push('wasIndependentCityStateBeforeCapture'); return scn.wasIndependent; },
    enterCityAfterSurrender: () => { calls.push('enterCityAfterSurrender'); throw new Stop(); },
    showHintMessage: () => { calls.push('showHintMessage'); },
    // Q4-Q1 r2: ownerDeclareWarOn jest atrapa z ZAPISEM argumentow (nie wykonuje dyplomacji; to CallerSide).
    ownerDeclareWarOn: (attackerId, defenderId, force = false, cause = undefined) => {
      calls.push('ownerDeclareWarOn');
      warCalls.push({ attacker: attackerId, defender: defenderId, force: force === true, cause: cause ?? null });
    },
  };
  const fns = load([
    'hexDistance', 'besiegerOwnerForCity', 'clearCityStateFlagOnCapture', 'WONDER_PROD_PREFIX', 'CAPTURE_POP_LOSS',
    'stampCityFounderOnCapture', 'applyCapturePopulationLoss', 'parseWonderProdId', 'sanitizeBuildQueue',
    'filterQueue', 'dropFrontItem', 'sanitizeProductionQueue', 'resolveSiegeSurrender',
    // Q4-Q1 r2: prawdziwe wykonanie Prawa po przejeciu i wojny rebeliantow (dawniej stub w `calls`).
    'POST_CAPTURE_FRESH_TURNS', 'POST_CAPTURE_REBELLION_RECONQUEST_TURNS', 'REBEL_FACTION_OWNER_ID',
    'BARBARIAN_OWNER_ID', 'isBarbarian', 'isRebellionReconquest', 'applyPostCaptureLawOnCapture',
    'triggerRebelProtectionWarConsequence',
  ], vars, calls);
  let branch = 'none';
  try {
    fns.resolveSiegeSurrender('c');
  } catch (e) {
    if (!(e instanceof Stop)) throw e;
    branch = 'transfer';
  }
  return { branch, city, units, calls, warCalls, pool, prodAfter: cityProd.get('c') ?? null };
}

const rTr = makeRnd(0x51e6f001);
const transfer = [];
for (let i = 0; i < 160; i++) {
  // Q4-Q1 r2: ~30% miast nalezy do rebeliantow (-99, REBEL_FACTION_OWNER_ID) - wtedy odbicie po buncie jest mozliwe.
  const isRebel = rTr() < 0.3;
  const cityOwner = isRebel ? -99 : pick(rTr, OWNERS);
  let besieger = pick(rTr, OWNERS_ALL);
  if (besieger === cityOwner) besieger = (cityOwner + 1) % 4;
  const { enemy } = makeEnemy(rTr, [besieger, cityOwner]);
  const cityQ = Math.floor(rTr() * 3);
  const cityR = Math.floor(rTr() * 3);
  const n = Math.floor(rTr() * 7);
  const units = [];
  for (let k = 0; k < n; k++) {
    const onCity = rTr() < 0.45;
    units.push({
      id: `u${i}_${k}`,
      ownerId: pick(rTr, OWNERS),
      q: onCity ? cityQ : Math.floor(rTr() * 3),
      r: onCity ? cityR : Math.floor(rTr() * 3),
    });
  }
  const scn = {
    cityOwner, besieger, cityQ, cityR, units,
    pop: pick(rTr, POPS),
    startCityState: flag(rTr),
    foundedByOwner: flag(rTr),
    rebelState: isRebel ? pick(rTr, [true, true, false]) : flag(rTr),
    wasIndependent: rTr() < 0.5,
    enemy,
    foundedBy: pick(rTr, OPT_OWNERS),
    capturedFromOwnerId: pick(rTr, OPT_OWNERS),
    // Odbicie po buncie: poprzedni wlasciciel = zdobywca (polowa miast rebeliantow).
    rebelPreviousOwnerId: isRebel && rTr() < 0.5 ? besieger : pick(rTr, OPT_OWNERS),
    prod: rTr() < 0.6 ? makeProd(rTr) : null,
    isNewCapital: rTr() < 0.3,
    wonderOk: makeWonderOk(rTr),
    // Q4-Q1 r2: pola Prawa po przejeciu i okna ochrony rebeliantow (wejscie wykonywanego pinu).
    postCaptureLawTurnsRemaining: pick(rTr, [undefined, 3, 10]),
    wasRebellionReconquest: flag(rTr),
    rebelProtectionTurnsRemaining: pick(rTr, [undefined, 0, 0.5, 5, 20]),
    revoltGraceRemaining: pick(rTr, [undefined, null, 2]),
  };
  const r = runTransfer(scn);
  if (r.branch !== 'transfer') throw new Error(`transfer ${i}: oczekiwano galezi transfer, jest ${r.branch}`);
  transfer.push({
    input: {
      cityOwner, besieger, cityQ, cityR,
      pop: enc(scn.pop),
      startCityState: enc(scn.startCityState),
      foundedByOwner: enc(scn.foundedByOwner),
      rebelState: enc(scn.rebelState),
      foundedBy: enc(scn.foundedBy),
      capturedFromOwnerId: enc(scn.capturedFromOwnerId),
      rebelPreviousOwnerId: enc(scn.rebelPreviousOwnerId),
      wasIndependent: scn.wasIndependent,
      units: scn.units,
      prod: prodOut(scn.prod),
      isNewCapital: scn.isNewCapital,
      wonderOk: scn.wonderOk,
      postCaptureLawTurnsRemaining: enc(scn.postCaptureLawTurnsRemaining),
      wasRebellionReconquest: enc(scn.wasRebellionReconquest),
      rebelProtectionTurnsRemaining: enc(scn.rebelProtectionTurnsRemaining),
      revoltGraceRemaining: enc(scn.revoltGraceRemaining),
      enemyPairs: OWNERS_ALL.flatMap(a => OWNERS_ALL.map(b => [a, b, enemy(a, b)])),
    },
    expect: {
      branch: r.branch,
      ownerId: r.city.ownerId,
      population: enc(r.city.population),
      startCityState: enc(r.city.startCityState),
      foundedByOwner: enc(r.city.foundedByOwner),
      rebelState: enc(r.city.rebelState),
      foundedBy: enc(r.city.foundedBy),
      capturedFromOwnerId: enc(r.city.capturedFromOwnerId),
      postCaptureLawTurnsRemaining: enc(r.city.postCaptureLawTurnsRemaining),
      wasRebellionReconquest: enc(r.city.wasRebellionReconquest),
      rebelPreviousOwnerId: enc(r.city.rebelPreviousOwnerId),
      rebelProtectionTurnsRemaining: enc(r.city.rebelProtectionTurnsRemaining),
      revoltGraceRemaining: enc(r.city.revoltGraceRemaining),
      // Wywolania ownerDeclareWarOn (triggerRebelProtectionWarConsequence): 0 albo 1 element.
      declareWar: r.warCalls,
      unitIdsAfter: r.units.map(u => u.id),
      praca: poolOut(r.pool),
      production: prodOut(r.prodAfter),
      calls: r.calls,
    },
  });
}

// --- wektory skutkow bezposrednio: applyCapturePopulationLoss i sanitizeProductionQueue(newOwner) ---
const rEf = makeRnd(0x7b3c2a11);
const popLoss = [];
for (let i = 0; i < 120; i++) {
  const prevOwner = pick(rEf, OWNERS);
  const newOwner = pick(rEf, OWNERS_ALL);
  const pop = pick(rEf, POPS);
  const foundedBy = pick(rEf, OPT_OWNERS);
  const foundedByOwner = flag(rEf);
  const capturedFromOwnerId = pick(rEf, OPT_OWNERS);
  const rebelPrevOwnerSnapshot = pick(rEf, OPT_OWNERS);
  const input = {
    prevOwner, newOwner, pop: enc(pop), foundedBy: enc(foundedBy), foundedByOwner: enc(foundedByOwner),
    capturedFromOwnerId: enc(capturedFromOwnerId), rebelPrevOwnerSnapshot: enc(rebelPrevOwnerSnapshot),
  };
  const calls = [];
  const city = { population: pop, foundedBy, foundedByOwner, capturedFromOwnerId };
  const fns = load(['CAPTURE_POP_LOSS', 'stampCityFounderOnCapture', 'applyCapturePopulationLoss'], { miastoParams }, calls);
  const loss = fns.applyCapturePopulationLoss(city, newOwner, prevOwner, rebelPrevOwnerSnapshot);
  if (calls.length) throw new Error(`popLoss ${i}: atrapa w wykonaniu: ${calls.join(',')}`);
  popLoss.push({
    input,
    expect: { loss: enc(loss), population: enc(city.population), capturedFromOwnerId: enc(city.capturedFromOwnerId), foundedBy: enc(city.foundedBy) },
  });
}

const queue = [];
for (let i = 0; i < 120; i++) {
  const owner = pick(rEf, OWNERS);
  const prod = makeProd(rEf);
  const wonderOk = makeWonderOk(rEf);
  const input = { owner, prod: prodOut(prod), wonderOk };
  const calls = [];
  const pool = new Map();
  const vars = {
    wonderGateOk: (_ownerId, wid) => wonderOk[wid] === true,
    setOwnerPracaPool: (o, v) => { pool.set(o, v); },
    ownerPracaPool: o => pool.get(o) ?? 0,
  };
  const fns = load(['WONDER_PROD_PREFIX', 'parseWonderProdId', 'sanitizeBuildQueue', 'filterQueue', 'dropFrontItem', 'sanitizeProductionQueue'], vars, calls);
  const out = fns.sanitizeProductionQueue(owner, prod);
  if (calls.length) throw new Error(`queue ${i}: atrapa w wykonaniu: ${calls.join(',')}`);
  queue.push({ input, expect: { ...prodOut(out), praca: pool.get(owner) ?? 0 } });
}

// Stala CAPTURE_POP_LOSS i prefiks cudow z pinu (wykonane tym samym wycinaniem).
const consts = load(['WONDER_PROD_PREFIX', 'CAPTURE_POP_LOSS'], { miastoParams }, []);

const out = {
  source: 'gra/src/main.ts (resolveSiegeSurrender, sanitizeProductionQueue, parseWonderProdId, WONDER_PROD_PREFIX, besiegerOwnerForCity), '
    + 'gra/src/units/setup.ts (hexDistance), gra/src/game/display-names.ts (clearCityStateFlagOnCapture), '
    + 'gra/src/game/production.ts (sanitizeBuildQueue, filterQueue, dropFrontItem), gra/src/game/cities.ts '
    + '(applyCapturePopulationLoss, stampCityFounderOnCapture, CAPTURE_POP_LOSS), gra/data/miasto-params.json, '
    + 'gra/src/game/post-capture-law.ts (applyPostCaptureLawOnCapture, isRebellionReconquest, stale), '
    + 'gra/src/game/society-breakdown.ts (REBEL_FACTION_OWNER_ID), gra/src/game/barbarians.ts (isBarbarian, BARBARIAN_OWNER_ID), '
    + 'triggerRebelProtectionWarConsequence (main.ts) '
    + '@ 07d2fbd72f758705f8e1d59cc4968027ffbafe75; wykonanie wycinkow (bez stubow tych funkcji; ownerDeclareWarOn = atrapa z zapisem argumentow)',
  capturePopLoss: consts.CAPTURE_POP_LOSS,
  wonderPrefix: consts.WONDER_PROD_PREFIX,
  capitalBuildings: BUILDINGS.filter(b => b.lokalizacja === 'stolica').map(b => b.id),
  transfer,
  effects: { popLoss, queue },
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
