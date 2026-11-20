// R-RUSTPORT-P6-KAPITULACJA-Q1 (W3/W4/W5): generator wektorow kapitulacji glodowej oblezenia
// (`rust-port/engine/src/domain/siege_surrender.rs::run_siege_turn`, `city_capture_apply.rs::apply_siege_capitulation`,
// wolane z `PlayableGame::advance_turn`, faza Economy).
//
// ORAKUL = WYKONANIE TEKSTU PINU 07d2fbd72 (git show, bez kopii logiki). Z `gra/src/main.ts` wycinane po nazwie i
// wykonywane po zdjeciu typow: blok N3 „TURA OBLEZENIA” (petla `for (const tick of econ.perCity)`, `:38815-38877`),
// `besiegerOwnerForCity` (`:17634`), `handleSiegeCapitulationPhase` (`:17646`), `resolveSiegeSurrender` (`:17662`),
// `endMapSiege` (`:17880`), `areEnemyOwners` (`:13129`), `unitHealth` (`:33093`), `normFieldVal` (`:32993`); z
// `gra/src/game/cities.ts`: `applyCapturePopulationLoss`, `stampCityFounderOnCapture`. Moduly ladowane w calosci:
// `siege-starvation.ts`, `army-starvation.ts`, `siege-enter-city.ts`, `post-capture-law.ts`,
// `ui/eliminationSpectacle.ts`, `game/empire-food.ts` (`buildEmpireFoodParams`), `game/turn-economy.ts`
// (`getCityFood`), `units/setup.ts` (`hexDistance`, `isCivilianUnit`), `gra/data/units.json`, `gra/data/econ-params.json`.
//
// Obrona r1 (Z1, Evaluator r1): kroki przejecia, ktore runda 1 zaslepiala, sa WYKONYWANE z tekstu pinu:
// `runCapitalCapturePlunder` (`main.ts:35558`), `recordWarCityLossForPair` (`:11543`) z `diploEnsureWarStart`,
// `getDiploPairMeta`, `setDiploPairMeta`, `sanitizeProductionQueue` (`:5123`) z `parseWonderProdId`,
// `capitalCityIdForOwner` (`:34999`), `buildCityCaptureReportRows`, `captureReportOneLine`, `captureReportShortLine`,
// `mirrorCaptureReportRowsForVictim`, `recordCityCaptureEvent`, `recordCivElimEvent` (wyciete z `main.ts`),
// `capturePopLossReportRow` (`cities.ts`); moduly w calosci: `capital-capture.ts`, `production.ts`,
// `diplomacy-war-peace-profile.ts`, `diplomacy-pn-engine.ts` (`diploPairKey`, `freshDiploPairMeta`),
// `ui/power-labels.ts`, `retained-side-panel-events.ts`, `building-stock-cost.ts`, `society-breakdown.ts`,
// `gra/data/buildings.json`.
// Klej (domkniecia `main.ts` nieladowalne bez calej gry; przepisane z cytatem linii): akcesory zasobow
// `ownerTreasury`/`setOwnerTreasury`/`ownerPracaPool`/`setOwnerPracaPool`/`ownerResearchedTechs`/`addOwnerResearchedTechs`
// (`:34864-34990`, `Math.max(0, v)`), `eliminateOwner` (`:35348`, w zakresie stanu: `eliminatedOwners`,
// `disbandOwnerUnits`, pule AI, `capitalCityIdByOwner`, `zdobyczePowerByOwner`, relacje i meta par).
// Wejscia odpowiadajace stanowi Rust (pol brak w `PlayableState`): pula nauki = 0 (`naukaPool` w `not_applied`),
// brak akcesorow Spichlerza (opcjonalne w `OwnerResourceAccess`; `spichlerz` w `not_applied`), `cityBuilt` puste,
// `buildObjectivePowerForOwner(oldOwner).power` = `lostPower` scenariusza (moc liczona przez producentow POWER-*, ktore
// maja wlasne wektory; wartosc = wynik Rust dla tego stanu), `shouldShowPlayerTriumphCityStateUnification` = false,
// `buildSpectacleForElimination` = undefined (spektakl poza stanem).
// Zaslepki UI (bez skutku w stanie): `showHintMessage`, panele, render, `markCityStateDirty`.
// Pozostale kroki bez pola w stanie Rust (zapisywane w dzienniku `log`): `wasIndependentCityStateBeforeCapture`
// (false), `beginWonderTransferWatch`/`settleWonderTransfer` (brak cudow), `triggerRebelProtectionWarConsequence`,
// `clearCityStateFlagOnCapture` (false), `maybeResolveRegularWarOnCityCapture`, `seedCityOwnerDefaults`,
// `syncCityGarnizon`, `applyLiveSafeRationForCity`, `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines`.
//
// Uruchomienie: node rust-port/engine/tests/p6_kapitulacja_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_kapitulacja_vectors/vectors.json + MD5 na stdout.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const EXPECTED_SHA256 = process.env.KAP_SHA256_OVERRIDE ?? '17b8f1fb42402207df7284aede2b604bf3a5c5fa0545f33cf8e597c8463e78a9';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const ts = createRequire(import.meta.url)(TS_JS);

const showCache = new Map();
const show = (p) => {
  if (showCache.has(p)) return showCache.get(p);
  let out = null;
  try {
    out = execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 1 << 27, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { out = null; }
  showCache.set(p, out);
  return out;
};

function makeStub(name = 'stub') {
  const cache = Object.create(null);
  const fn = function () {};
  return new Proxy(fn, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return (hint) => (hint === 'string' ? '' : 0);
      if (p === Symbol.iterator) return function* () {};
      if (p === 'then') return undefined;
      if (p === 'length') return 0;
      if (p === 'toString') return () => '';
      if (p === 'valueOf') return () => 0;
      if (p === 'prototype') return t.prototype;
      if (!(p in cache)) cache[p] = makeStub(`${name}.${String(p)}`);
      return cache[p];
    },
    set(t, p, v) { cache[p] = v; return true; },
    apply() { return makeStub(`${name}()`); },
    construct() { return makeStub(`new ${name}`); },
    has() { return true; },
  });
}
globalThis.window = makeStub('window');
globalThis.document = makeStub('document');
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
Math.random = () => { throw new Error('Math.random w zastosowaniu wyniku (oczekiwane: brak)'); };

const hash = createHash('sha256');
const hashed = new Set();
const transpile = (p, src) => ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, preserveConstEnums: true, isolatedModules: true },
  fileName: p,
}).outputText
  .replace(/import\.meta\.glob/g, '(() => ({}))')
  .replace(/import\.meta/g, "({ env: { DEV: false, PROD: true, MODE: 'production', BASE_URL: '/' }, url: 'file:///pin/' })");
const modCache = new Map();
function load(p) {
  if (modCache.has(p)) return modCache.get(p).exports;
  const src = show(p);
  if (src === null) throw new Error('brak w pinie: ' + p);
  if (!hashed.has(p)) { hashed.add(p); hash.update(p + '\n' + src); }
  const mod = { exports: {} };
  modCache.set(p, mod);
  if (p.endsWith('.json')) { mod.exports = JSON.parse(src); return mod.exports; }
  const req = (spec) => {
    if (spec === 'three' || spec.startsWith('three/')) return makeStub('THREE');
    if (/[?](raw|url|worker)/.test(spec) || /\.(css|svg|png|jpg|glsl|txt|md|mp3|ogg|wav)$/.test(spec)) return { __esModule: true, default: '' };
    if (!spec.startsWith('.')) return makeStub(spec);
    const base = posix.normalize(posix.join(posix.dirname(p), spec.replace(/\.ts$/, '')));
    for (const c of [base + '.ts', base, base + '/index.ts']) {
      if ((c.endsWith('.ts') || c.endsWith('.json')) && show(c) !== null) return load(c);
    }
    throw new Error('nie rozwiazano ' + spec + ' z ' + p);
  };
  new Function('module', 'exports', 'require', transpile(p, src))(mod, mod.exports, req);
  return mod.exports;
}

const SS = load('gra/src/game/siege-starvation.ts');
const AS = load('gra/src/game/army-starvation.ts');
const SEC = load('gra/src/game/siege-enter-city.ts');
const PCL = load('gra/src/game/post-capture-law.ts');
const ES = load('gra/src/ui/eliminationSpectacle.ts');
const EF = load('gra/src/game/empire-food.ts');
const TE = load('gra/src/game/turn-economy.ts');
const SETUP = load('gra/src/units/setup.ts');
const UNITS = load('gra/data/units.json');
const ECON = load('gra/data/econ-params.json');
const PROD = load('gra/src/game/production.ts');
const BLD = load('gra/data/buildings.json');
const CC = load('gra/src/game/capital-capture.ts');
const DWP = load('gra/src/game/diplomacy-war-peace-profile.ts');
const PNE = load('gra/src/game/diplomacy-pn-engine.ts');
const PL = load('gra/src/ui/power-labels.ts');
const RSP = load('gra/src/game/retained-side-panel-events.ts');
const BSC = load('gra/src/game/building-stock-cost.ts');
const SB = load('gra/src/game/society-breakdown.ts');
const hashText = (p) => { const src = show(p); if (src === null) throw new Error('brak w pinie: ' + p); if (!hashed.has(p)) { hashed.add(p); hash.update(p + '\n' + src); } return src; };
const MAIN_LINES = hashText('gra/src/main.ts').split('\n');
const CITIES_LINES = hashText('gra/src/game/cities.ts').split('\n');
const BATTLE_SCENE = hashText('gra/src/battle/battleScene.ts');
const shaHex = hash.digest('hex');
if (EXPECTED_SHA256 !== 'UZUPELNIJ' && shaHex !== EXPECTED_SHA256) {
  throw new Error(`SHA-256 tekstu pinu ${shaHex} != ${EXPECTED_SHA256}`);
}
const MAX_PER_SIDE = Number(/const MAX_PER_SIDE = (\d+);/.exec(BATTLE_SCENE)[1]);
// `CAPTURE_POP_LOSS` (`cities.ts:1230`): czytany z modulu (miasto-params), nie z tekstu.
const CITIES_MOD = (() => { try { return load('gra/src/game/cities.ts'); } catch (e) { return { __err: String(e) }; } })();
const sameJson = (pinObj, rustPath) => JSON.stringify(pinObj) === JSON.stringify(JSON.parse(readFileSync(join(here, '..', rustPath), 'utf8')));
const dataSame = { econParams: sameJson(ECON, 'data/econ-params.json') };

function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\b`);
  const start = lines.findIndex(l => re.test(l));
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}
// Blok N3: `for (const tick of econ.perCity) {` po znaczniku `N3: TURA OBLEZENIA` do klamry na tym samym wcieciu.
function extractN3() {
  const mark = MAIN_LINES.findIndex(l => l.includes('N3: TURA OBLEZENIA'));
  const start = MAIN_LINES.findIndex((l, i) => i > mark && /for \(const tick of econ\.perCity\) \{/.test(l));
  const indent = MAIN_LINES[start].match(/^\s*/)[0];
  let end = start + 1;
  while (MAIN_LINES[end] !== indent + '}') end++;
  return { text: MAIN_LINES.slice(start, end + 1).join('\n'), lines: [start + 1, end + 1] };
}
const N3 = extractN3();
const renamePin = (src, name) => src.replace(new RegExp(`function ${name}\\(`), `function ${name}__pin(`);
const FN_SRC = [
  extractFn(MAIN_LINES, 'normFieldVal'),
  extractFn(MAIN_LINES, 'unitHealth'),
  renamePin(extractFn(MAIN_LINES, 'areEnemyOwners'), 'areEnemyOwners'),
  renamePin(extractFn(MAIN_LINES, 'besiegerOwnerForCity'), 'besiegerOwnerForCity'),
  extractFn(MAIN_LINES, 'handleSiegeCapitulationPhase'),
  extractFn(MAIN_LINES, 'resolveSiegeSurrender'),
  renamePin(extractFn(MAIN_LINES, 'endMapSiege'), 'endMapSiege'),
  renamePin(extractFn(CITIES_LINES, 'applyCapturePopulationLoss'), 'applyCapturePopulationLoss'),
  extractFn(CITIES_LINES, 'stampCityFounderOnCapture'),
  // Obrona r1 (Z1): kroki przejecia wykonywane z tekstu pinu.
  renamePin(extractFn(MAIN_LINES, 'runCapitalCapturePlunder'), 'runCapitalCapturePlunder'),
  renamePin(extractFn(MAIN_LINES, 'recordWarCityLossForPair'), 'recordWarCityLossForPair'),
  extractFn(MAIN_LINES, 'diploEnsureWarStart'),
  extractFn(MAIN_LINES, 'getDiploPairMeta'),
  extractFn(MAIN_LINES, 'setDiploPairMeta'),
  renamePin(extractFn(MAIN_LINES, 'sanitizeProductionQueue'), 'sanitizeProductionQueue'),
  extractFn(MAIN_LINES, 'parseWonderProdId'),
  extractFn(MAIN_LINES, 'capitalCityIdForOwner'),
  extractFn(MAIN_LINES, 'buildCityCaptureReportRows'),
  extractFn(MAIN_LINES, 'captureReportOneLine'),
  extractFn(MAIN_LINES, 'captureReportShortLine'),
  extractFn(MAIN_LINES, 'mirrorCaptureReportRowsForVictim'),
  renamePin(extractFn(MAIN_LINES, 'recordCityCaptureEvent'), 'recordCityCaptureEvent'),
  extractFn(MAIN_LINES, 'recordCivElimEvent'),
  extractFn(CITIES_LINES, 'capturePopLossReportRow'),
].join('\n\n');
const WONDER_PROD_PREFIX = /const WONDER_PROD_PREFIX = '([^']*)';/.exec(MAIN_LINES.join('\n'))[1];

// Srodowisko domkniecia `main.ts` (zmienne i zaslepki); `__log` = dziennik krokow domenowych.
const ENV_TS = `
const __log: string[] = [];
const L = (n: string) => { __log.push(n); };
function besiegerOwnerForCity(city: any) { L('besiegerOwnerForCity'); return besiegerOwnerForCity__pin(city); }
function endMapSiege(id: string) { L('endMapSiege'); return endMapSiege__pin(id); }
function applyCapturePopulationLoss(c: any, n: number, p: number, r?: number) { L('applyCapturePopulationLoss'); return applyCapturePopulationLoss__pin(c, n, p, r); }
function areEnemyOwners(a: number, b: number) { L('areEnemyOwners'); return areEnemyOwners__pin(a, b); }
${FN_SRC}
function showHintMessage(..._a: any[]) {}
function syncSiegePanelMeta(_c: any) {}
function updateSiegeMapPanelTurn(..._a: any[]) {}
function refreshSiegeMarkers() {}
function hideSiegeMapPanel() {}
function getActiveSiegeCityId() { return null; }
function clearSiegeMachines(c: any) { delete c.siegeMachines; }
function siegeAiKey(a: number, b: string) { return a + ':' + b; }
function syncUnitsRender() {}
function refreshFog() {}
function updateHud() {}
function refreshD1bHud() {}
function markCityStateDirty() {}
function syncGarnizonForCity(_c: any) {}
function wasIndependentCityStateBeforeCapture(_c: any) { L('wasIndependentCityStateBeforeCapture'); return false; }
function beginWonderTransferWatch() { L('beginWonderTransferWatch'); return null; }
function settleWonderTransfer(_w: any) { L('settleWonderTransfer'); }
function applyPostCaptureLawOnCapture(c: any, n: number, o: number) { L('applyPostCaptureLawOnCapture'); return PCL.applyPostCaptureLawOnCapture(c, n, o); }
function triggerRebelProtectionWarConsequence(..._a: any[]) { L('triggerRebelProtectionWarConsequence'); }
function noteCityCapture(m: any, o: number, n: number, t: number) { L('noteCityCapture'); return ES.noteCityCapture(m, o, n, t); }
function clearCityStateFlagOnCapture(_c: any) { L('clearCityStateFlagOnCapture'); return false; }
function maybeResolveRegularWarOnCityCapture(..._a: any[]) { L('maybeResolveRegularWarOnCityCapture'); }
// Obrona r1 (Z1): kroki wykonywane z tekstu pinu; dziennik zapisuje tylko wywolania z 'resolveSiegeSurrender'
// (glebokosc '__depth'); wywolania wewnetrzne (np. 'recordCityCaptureEvent' z wnetrza 'runCapitalCapturePlunder') nie.
let __depth = 0;
function __step(name: string, f: () => any): any { if (__depth === 0) L(name); __depth++; try { return f(); } finally { __depth--; } }
function recordWarCityLossForPair(o: number, n: number) { return __step('recordWarCityLossForPair', () => recordWarCityLossForPair__pin(o, n)); }
function sanitizeBuildQueue(p: any) { return __step('sanitizeBuildQueue', () => PROD.sanitizeBuildQueue(p)); }
function sanitizeProductionQueue(o: number, p: any) { __depth++; try { return sanitizeProductionQueue__pin(o, p); } finally { __depth--; } }
function filterQueue(p: any, f: any) { return PROD.filterQueue(p, f); }
function wonderGateOk(_o: number, _w: string): boolean { throw new Error('wonderGateOk: brak cudow w kolejkach scenariuszy'); }
function runCapitalCapturePlunder(c: any, o: number, n: number) { return __step('runCapitalCapturePlunder', () => runCapitalCapturePlunder__pin(c, o, n)); }
function recordCityCaptureEvent(a: any) { return __step('recordCityCaptureEvent', () => recordCityCaptureEvent__pin(a)); }
function seedCityOwnerDefaults(_c: any) { L('seedCityOwnerDefaults'); }
function enterCityAfterSurrender(u: any, c: any, n: number, d: any) { L('enterCityAfterSurrender'); return SEC.enterCityAfterSurrender(u, c, n, d); }
function syncCityGarnizon(_c: any) { L('syncCityGarnizon'); }
// 'main.ts:34864-34990' (akcesory; gracz = 'playerStateByHuman', AI = mapy 'ai*ByOwner'; tu jedna mapa per zasob).
function ownerTreasury(o: number) { return __treasury.get(o) ?? 0; }
function setOwnerTreasury(o: number, v: number) { __treasury.set(o, Math.max(0, v)); }
function ownerPracaPool(o: number) { return __praca.get(o) ?? 0; }
function setOwnerPracaPool(o: number, v: number) { __praca.set(o, Math.max(0, v)); }
function ownerResearchedTechs(o: number) { return __techs.get(o) ?? new Set(); }
function addOwnerResearchedTechs(o: number, ids: Iterable<string>) { if (!__techs.has(o)) __techs.set(o, new Set()); for (const id of ids) __techs.get(o).add(id); }
const capitalCaptureResourceAccess = {
  getTreasury: ownerTreasury, setTreasury: setOwnerTreasury,
  getPracaPool: ownerPracaPool, setPracaPool: setOwnerPracaPool,
  getNaukaPool: (_o: number) => 0, setNaukaPool: (_o: number, _v: number) => {},
  getResearchedTechs: ownerResearchedTechs, addResearchedTechs: addOwnerResearchedTechs,
};
function buildObjectivePowerForOwner(o: number) { return { power: __lostPower[o] ?? 0 }; }
function buildSpectacleForElimination(..._a: any[]) { return undefined; }
function shouldShowPlayerTriumphCityStateUnification(_a: any) { return false; }
function civKeyForOwnerId(_o: number) { return ''; }
function civDisplayNameForOwner(_o: number) { return null; }
function showTriumphCityStateNotice(_a: any) {}
const typCityCopyOwners = new Set<number>();
const aiOwnerCivMap = new Map<number, string>();
// 'eliminateOwner' ('main.ts:35348-35470') w zakresie stanu.
function eliminateOwner(o: number) {
  if (o === 0 || eliminatedOwners.has(o)) return;
  eliminatedOwners.add(o);
  const remaining = CC.disbandOwnerUnits(units, o);
  units.length = 0;
  units.push(...remaining);
  __treasury.delete(o); __praca.delete(o); __techs.delete(o);
  capitalCityIdByOwner.delete(o);
  zdobyczePowerByOwner.delete(o);
  for (const k of [...__war]) if (k.split('_').map(Number).includes(o)) __war.delete(k);
  for (const k of [...diplomacyPairMeta.keys()]) if (k.split('_').map(Number).includes(o)) diplomacyPairMeta.delete(k);
}
const CITY_CAPTURE_EVENT_PREFIX = 'capture-';
const warEventDetailOwners = [
  { idPrefix: CITY_CAPTURE_EVENT_PREFIX, details: cityCaptureEventDetails },
  { idPrefix: 'elim-cs-', details: civElimEventDetails },
];
function trimWarEventLog(): void { trimSidePanelEventLog(warEventLog, 8, warEventDetailOwners); }
function civLabelForOwner(o: number) { return 'owner' + o; }
function mocLabel() { return PL.mocLabel(); }
function applyLiveSafeRationForCity(_id: string) { L('applyLiveSafeRationForCity'); }
function tickSiegeMachinesForCity(_c: any) {}
function maybeAiAssaultAfterMachines(..._a: any[]) {}
function armyStackLimit() { return BATTLE_MAX_PER_SIDE; }
function getDiploRelation(a: number, b: number) { return { status: __war.has(diploPairKey(a, b)) ? 'wojna' : 'pokoj' }; }
function isBarbarian(o: number) { return o === BARBARIAN_OWNER_ID; }
function effectiveGameDifficultyForOwner(_o: number) { return 'normal'; }
function n3(econ: any) {
${N3.text}
}
return { n3, resolveSiegeSurrender, log: () => __log.splice(0), setTurn: (t: number) => { turn = t; } };
`;
const ENV_JS = ts.transpileModule(ENV_TS, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

const BARB = 999999;
// Klucz pary pinu (`diploPairKey`, `diplomacy-pn-engine.ts:139`) — wykonywany z modulu.
const pairKeyPin = (a, b) => PNE.diploPairKey(a, b);
function mkEnv(sc) {
  const cities = sc.cities.map(c => ({ ...c }));
  const units = sc.units.map(u => ({ ...u }));
  const war = new Set(sc.war.map(([a, b]) => pairKeyPin(a, b)));
  const siegeTurnByCity = new Map();
  const siegeBesiegerByCity = new Map();
  const siegeAiStateByKey = new Map();
  const cityProd = new Map(Object.entries(sc.prod ?? {}).map(([c, p]) => ['city' + c, JSON.parse(JSON.stringify(p))]));
  const cityBuilt = new Map();
  const playerEverOwnedCityByOwner = new Set();
  const civChronicleByOwner = new Map();
  const capitalCityIdByOwner = new Map((sc.capitals ?? []).map(([o, c]) => [o, 'city' + c]));
  const treasury = new Map(sc.treasury ?? []);
  const praca = new Map(sc.praca ?? []);
  const techs = new Map((sc.techs ?? []).map(([o, t]) => [o, new Set(t)]));
  const diplomacyPairMeta = new Map();
  const eliminatedOwners = new Set();
  const zdobyczePowerByOwner = new Map();
  const warEventLog = [];
  const cityCaptureEventDetails = new Map();
  const civElimEventDetails = new Map();
  const eliminationSpectacleByLabel = new Map();
  const data = { units: UNITS, buildings: BLD, econParams: ECON };
  const env = new Function(
    'cities', 'units', 'siegeTurnByCity', 'siegeBesiegerByCity', 'siegeAiStateByKey', 'cityProd', 'cityBuilt',
    'playerEverOwnedCityByOwner', 'civChronicleByOwner', 'turn', 'selectedId', 'unitRenderer', 'cityRenderer',
    '_cityRenderOpts', 'data', 'capitalCaptureReportSlot', 'BATTLE_MAX_PER_SIDE', 'BARBARIAN_OWNER_ID', '__war',
    'PCL', 'ES', 'SEC', 'siegeStarvationState', 'siegeDefenderUnits', 'applyArmyStarvationHpLoss', 'buildEmpireFoodParams',
    'getCityFood', 'hexDistance', 'isCivilianUnit', 'CAPTURE_POP_LOSS', 'console',
    'PROD', 'CC', 'PL', 'capitalCityIdByOwner', '__treasury', '__praca', '__techs', '__lostPower', 'diplomacyPairMeta',
    'eliminatedOwners', 'zdobyczePowerByOwner', 'warEventLog', 'cityCaptureEventDetails', 'civElimEventDetails',
    'eliminationSpectacleByLabel', 'trimSidePanelEventLog', 'EMPIRE_STOCK_RESOURCE_KEYS', 'stockResourceLabel',
    'applyBarbarianAwareCapitalCapturePlunder', 'barbarianCapturedPowerGain', 'oldestCityOfOwner', 'REBEL_FACTION_OWNER_ID',
    'recordWarCityLoss', 'diploPairKey', 'freshDiploPairMeta', 'WONDER_PROD_PREFIX',
    ENV_JS,
  )(
    cities, units, siegeTurnByCity, siegeBesiegerByCity, siegeAiStateByKey, cityProd, cityBuilt,
    playerEverOwnedCityByOwner, civChronicleByOwner, sc.turn, null, makeStub('unitRenderer'), makeStub('cityRenderer'),
    () => ({}), data, null, MAX_PER_SIDE, BARB, war,
    PCL, ES, SEC, SS.siegeStarvationState, SS.siegeDefenderUnits, AS.applyArmyStarvationHpLoss, EF.buildEmpireFoodParams,
    TE.getCityFood, SETUP.hexDistance, SETUP.isCivilianUnit, CITIES_MOD.CAPTURE_POP_LOSS, { log() {}, warn() {}, error(...a) { throw new Error('console.error: ' + a.join(' ')); } },
    PROD, CC, PL, capitalCityIdByOwner, treasury, praca, techs, sc.lostPower ?? {}, diplomacyPairMeta,
    eliminatedOwners, zdobyczePowerByOwner, warEventLog, cityCaptureEventDetails, civElimEventDetails,
    eliminationSpectacleByLabel, RSP.trimSidePanelEventLog, BSC.EMPIRE_STOCK_RESOURCE_KEYS, BSC.stockResourceLabel,
    CC.applyBarbarianAwareCapitalCapturePlunder, CC.barbarianCapturedPowerGain, CC.oldestCityOfOwner, SB.REBEL_FACTION_OWNER_ID,
    DWP.recordWarCityLoss, PNE.diploPairKey, PNE.freshDiploPairMeta, WONDER_PROD_PREFIX,
  );
  return { env, cities, units, siegeTurnByCity, playerEverOwnedCityByOwner, civChronicleByOwner, capitalCityIdByOwner, treasury,
    praca, techs, war, diplomacyPairMeta, eliminatedOwners, zdobyczePowerByOwner, warEventLog, cityCaptureEventDetails,
    civElimEventDetails, cityProd };
}

const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
const CITY_KEYS = ['id', 'ownerId', 'population', 'oblegane', 'oblegajacyOwnerId', 'siegeCapitulationPending', 'siegeStarveStartMaxHp',
  'magazynZywnosci', 'capturedFromOwnerId', 'foundedBy', 'postCaptureLawTurnsRemaining', 'wasRebellionReconquest'];
const UNIT_KEYS = ['id', 'ownerId', 'typeId', 'q', 'r', 'hp', 'hpMax', 'oblegaCityId'];
const sortedMap = (m) => [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
function snapshot(st) {
  return {
    cities: st.cities.map(c => pick(c, CITY_KEYS)),
    units: st.units.map(u => pick(u, UNIT_KEYS)),
    everOwned: [...st.playerEverOwnedCityByOwner].sort((a, b) => a - b),
    chronicle: [...st.civChronicleByOwner.entries()].sort((a, b) => a[0] - b[0]),
    // Obrona r1 (Z1): stan krokow przejecia wykonanych z tekstu pinu.
    capitals: sortedMap(st.capitalCityIdByOwner),
    treasury: sortedMap(st.treasury),
    praca: sortedMap(st.praca),
    techs: sortedMap(st.techs).map(([o, s]) => [o, [...s].sort()]),
    war: [...st.war].sort(),
    pairMeta: sortedMap(st.diplomacyPairMeta),
    eliminated: [...st.eliminatedOwners].sort((a, b) => a - b),
    zdobycze: sortedMap(st.zdobyczePowerByOwner),
    cityProd: sortedMap(st.cityProd),
    captureEvents: JSON.parse(JSON.stringify({ warEventLog: st.warEventLog, city: Object.fromEntries(sortedMap(st.cityCaptureEventDetails)),
      civElim: Object.fromEntries(sortedMap(st.civElimEventDetails)) })),
  };
}

// Jednostki: kategoria `piechota`, typ `Wojownik` (units.json pinu). Wlasciciel gracza = 0 (Rust: 1, D-ZMA-5).
// Id miast `city` + N (`cityFoundOrder`, `capital-capture.ts:67`; Rust `plunder_id`).
const W = 'Wojownik';
const unit = (id, ownerId, q, r, extra = {}) => {
  const e = { ...extra };
  if (e.oblegaCityId !== undefined) e.oblegaCityId = 'city' + e.oblegaCityId;
  return { id, ownerId, typeId: W, category: 'piechota', q, r, ...e };
};
const city = (id, ownerId, q, r, extra = {}) => ({ id: 'city' + id, ownerId, name: 'M' + id, q, r, population: 3, oblegane: true, ...extra });
// Domyslnie ofiara (101) ma druga, wyznaczona stolice `city910` (0,0): kapitulacja miasta 900 = zwykle miasto (bez lupu).
const base = (over) => {
  const sc = { turn: 5, turns: 2, war: [[0, 101]], capitals: [[101, 910]], ...over };
  if (!over.noVictimCapital && !sc.cities.some(c => c.id === 'city910')) sc.cities = [...sc.cities, city('910', 101, 0, 0, { oblegane: false })];
  delete sc.noVictimCapital;
  return sc;
};
const CAP_ONLY = BLD.filter(b => b.lokalizacja === 'stolica').map(b => b.id);
const NORMAL_B = BLD.find(b => !b.lokalizacja && b.id).id;
const bq = (id, extra = {}) => ({ kind: 'budynek', id, nazwa: id, koszt: 50, ...extra });
const scenarios = [
  // W3: bez garnizonu, zapasy 0 -> tura 1 flaga, tura 2 przejecie przez gracza (oblegajacyOwnerId).
  base({ name: 'legacy_gracz', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' }), unit('7002', 0, 5, 3, { oblegaCityId: '900' }), unit('7003', 0, 3, 3, { oblegaCityId: '900' })] }),
  // W4: pokoj (brak wojny) -> tura 2 koniec oblezenia bez przejecia.
  base({ name: 'pokoj', war: [], cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })], units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // W4: brak oblegajacego (brak pola, brak sasiada obcego).
  base({ name: 'brak_oblegajacego', cities: [city('900', 101, 4, 3)], units: [unit('8001', 101, 7, 7)] }),
  // W4: oblegajacy z sasiedztwa (fallback `besiegerOwnerForCity`, kolejnosc `units`).
  base({ name: 'sasiad_fallback', cities: [city('900', 101, 4, 3)], units: [unit('7001', 0, 4, 4, { oblegaCityId: '900' }), unit('7101', 102, 5, 2)] }),
  // Zapasy > 0: brak decyzji.
  base({ name: 'zapasy', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0, magazynZywnosci: 12 })], units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Flaga z zapisu przy zapasach > 0: przejecie w pierwszym ticku.
  base({ name: 'flaga_z_zapisu', turns: 1, cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0, magazynZywnosci: 5, siegeCapitulationPending: true })],
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // AI-AI.
  base({ name: 'ai_ai', war: [[101, 102]], cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 102 })], units: [unit('7101', 102, 5, 3, { oblegaCityId: '900' })] }),
  // W4: `oblegajacyOwnerId` bez sasiedniej jednostki (armia 2 heksy od miasta) - przejecie i wejscie stosu.
  base({ name: 'oblegajacy_bez_sasiada', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('7001', 0, 6, 3, { oblegaCityId: '900' }), unit('7002', 0, 6, 3, { oblegaCityId: '900' }), unit('7101', 102, 5, 3)] }),
  // Ludnosc 0: `applyCapturePopulationLoss` bez straty, potem `Math.max(1, population)`.
  base({ name: 'ludnosc_0', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0, population: 0 })], units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Ludnosc 1: brak straty (max(1)).
  base({ name: 'ludnosc_1', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0, population: 1 })], units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Odbicie: capturedFromOwnerId === newOwner -> brak straty.
  base({ name: 'odbicie', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0, capturedFromOwnerId: 0, population: 4 })], units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Garnizon: start glodu, atrycja HP, kapitulacja < 50% (bez wojska przy tym tempie: 6 tur).
  base({ name: 'garnizon_glod', turns: 12, cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('8001', 101, 4, 3), unit('8002', 101, 4, 3, { hp: 20 }), unit('7001', 0, 5, 3, { oblegaCityId: '900' }), unit('7002', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Garnizon slaby: jednostka ginie z glodu -> pusty garnizon -> kapitulacja.
  base({ name: 'garnizon_ginie', turns: 4, cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('8001', 101, 4, 3, { hp: 1 }), unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Garnizon: jedna jednostka ginie z glodu, reszta trzyma (splice zniszczonych bez kapitulacji).
  base({ name: 'garnizon_jeden_ginie', turns: 3, cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('8001', 101, 4, 3, { hp: 1 }), unit('8002', 101, 4, 3), unit('8003', 101, 4, 3), unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Obronca z hp 0 (zapis): `siegeDefenderUnits` go pomija -> sciezka bez garnizonu.
  base({ name: 'obronca_hp_0', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('8001', 101, 4, 3, { hp: 0 }), unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Dwa miasta w jednym ticku (kolejnosc `cities`); drugie nie oblegane.
  base({ name: 'dwa_miasta', war: [[0, 101], [0, 102]], cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 }), city('905', 102, 9, 9, { oblegajacyOwnerId: 0, population: 5 }), city('910', 101, 0, 0, { oblegane: false })],
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' }), unit('7002', 0, 10, 9, { oblegaCityId: '905' })] }),
  // Obca (trzecia) jednostka na heksie miasta blokuje wejscie (Z4 planSurrenderEntry).
  base({ name: 'wejscie_zablokowane', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' }), unit('7201', 103, 4, 3, { category: 'osadnik', typeId: 'Osadnik' })] }),
  // Obroncy starego wlasciciela na heksie (cywil -> nie garnizon, ale usuwany przy przejeciu).
  base({ name: 'cywil_obroncy', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('8001', 101, 4, 3, { category: 'osadnik', typeId: 'Osadnik' }), unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // --- Obrona r1 (Z1): kroki przejecia wykonywane z tekstu pinu -------------------------------------------------------
  // Przejecie STOLICY (cywilizacja przezywa): lup skarbca, pula Pracy przepada, sukcesja stolicy na `city901`; kolejka z
  // Palacem (`lokalizacja:'stolica'`) — miasto NIE jest nowa stolica gracza (`city950`), Palac znika, postep do zdobywcy;
  // meta pary (`recordWarCityLossForPair`) i karta zdarzenia (`recordCityCaptureEvent` ze srodka `runCapitalCapturePlunder`).
  base({ name: 'stolica_przejecie', noVictimCapital: true, capitals: [[101, 900], [0, 950]],
    cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 }), city('901', 101, 9, 0, { oblegane: false }), city('950', 0, 0, 8, { oblegane: false })],
    treasury: [[0, 5], [101, 40]], praca: [[0, 3], [101, 7]], techs: [[0, ['t_a']], [101, ['t_a', 't_b']]],
    prod: { 900: { kolejka: [bq(CAP_ONLY[1]), bq(NORMAL_B, { postep: 3 })], postep: 6 } },
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' }), unit('7002', 0, 5, 3, { oblegaCityId: '900' })] }),
  // E09: wyznaczona stolica ofiary to `city905`, a zdobywane `city900` jest jej NAJSTARSZYM miastem — bez mapy stolic
  // (fallback „najstarsze”) byloby przejeciem stolicy; z mapa: zwykle miasto. Gracz bez wyznaczonej stolicy, ale ze
  // starszym miastem `city120`: Palac w kolejce znika (miasto nie jest jego najstarszym).
  base({ name: 'stolica_gdzie_indziej', noVictimCapital: true, capitals: [[101, 905]],
    cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 }), city('905', 101, 9, 0, { oblegane: false }), city('120', 0, 0, 8, { oblegane: false })],
    treasury: [[0, 5], [101, 40]], praca: [[0, 3], [101, 7]],
    prod: { 900: { kolejka: [bq(NORMAL_B), bq(CAP_ONLY[0], { postep: 4 })], postep: 2 } },
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Kolejka: gracz bez miast — przejete miasto staje sie jego stolica (`capitalCityIdForOwner` -> najstarsze), Palac
  // zostaje w kolejce.
  base({ name: 'kolejka_nowa_stolica_gracza',
    cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    praca: [[0, 3], [101, 7]],
    prod: { 900: { kolejka: [bq(CAP_ONLY[1]), bq(NORMAL_B, { postep: 3 })], postep: 6 } },
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // ELIMINACJA: ostatnie miasto ofiary (wyznaczona stolica). Skarbiec, pula Pracy, technologie do zdobywcy; jednostka
  // ofiary daleko od miasta znika (`disbandOwnerUnits`); relacja i meta pary skasowane; karta ELIMINACJA.
  // `lostPower` = moc ofiary policzona przez Rust dla tego stanu (producenci mocy: wektory POWER-*).
  base({ name: 'eliminacja', noVictimCapital: true, capitals: [[101, 900], [0, 950]], lostPower: { 101: 228 },
    cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 }), city('950', 0, 0, 8, { oblegane: false })],
    treasury: [[0, 5], [101, 40]], praca: [[0, 3], [101, 7]], techs: [[0, ['t_a']], [101, ['t_a', 't_b']]],
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' }), unit('8009', 101, 9, 8)] }),
  // Z2: jednostki starego wlasciciela POZA heksem miasta (sasiedni heks i daleko) przezywaja kapitulacje; cywil na heksie
  // miasta (nie garnizon) jest usuwany.
  base({ name: 'obroncy_poza_heksem', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('8001', 101, 4, 3, { category: 'osadnik', typeId: 'Osadnik' }), unit('8002', 101, 3, 3), unit('8003', 101, 8, 8),
      unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
  // Z3: wojskowa jednostka OBCA (trzecia strona) na heksie miasta nie jest garnizonem (`siegeDefenderUnits`, filtr
  // wlasciciela, `siege-starvation.ts:72-79`): sciezka bez garnizonu (flaga -> przejecie).
  base({ name: 'obcy_wojskowy_na_heksie', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('7301', 103, 4, 3), unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
];

const tickCases = scenarios.map((sc) => {
  const st = mkEnv(sc);
  st.env.log();
  const turnsOut = [];
  for (let t = 0; t < sc.turns; t++) {
    // Tura rosnie o 1 na tick (Rust: `advance_turn` po fazie Economy podbija `turn`).
    st.env.setTurn(sc.turn + t);
    const econ = { perCity: st.cities.map(c => ({ cityId: c.id, oblegany: c.oblegane === true, obleganyGlod: false, magazynPoTurze: undefined })) };
    st.env.n3(econ);
    turnsOut.push({ log: st.env.log(), ...snapshot(st) });
  }
  return { ...sc, out: turnsOut };
});
// `resolveSiegeSurrender` na nieistniejacym miescie (galaz `!city`).
const noCity = (() => {
  const st = mkEnv(base({ noVictimCapital: true, capitals: [], cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })], units: [] }));
  st.env.log();
  st.env.resolveSiegeSurrender('city999');
  return { log: st.env.log(), ...snapshot(st) };
})();

// Wejscia czytane przez Rust z danych (porownanie z danymi Rust w tescie).
const getMaxHp = (typeId) => {
  const def = UNITS.find(u => u.Jednostka === typeId) ?? {};
  const v = def['health'] ?? def['Health'];
  return v;
};
const params = {
  maxPerSide: MAX_PER_SIDE,
  capturePopLoss: CITIES_MOD.CAPTURE_POP_LOSS ?? null,
  citiesModErr: CITIES_MOD.__err ?? null,
  glodFrac: { easy: EF.buildEmpireFoodParams(ECON, 'easy').glodWojskaHpFrac, normal: EF.buildEmpireFoodParams(ECON, 'normal').glodWojskaHpFrac, hard: EF.buildEmpireFoodParams(ECON, 'hard').glodWojskaHpFrac },
  healthWojownik: getMaxHp(W),
  n3Lines: N3.lines,
};

const out = { pin: PIN, pinSha256: shaHex, dataSame, params, tickCases, noCity };
const dir = join(here, 'p6_kapitulacja_vectors');
mkdirSync(dir, { recursive: true });
const text = JSON.stringify(out, null, 1) + '\n';
writeFileSync(join(dir, 'vectors.json'), text);
console.log('pinSha256', shaHex, 'md5', createHash('md5').update(text).digest('hex'), 'cases', tickCases.length, 'dataSame', JSON.stringify(dataSame), 'params', JSON.stringify(params));
