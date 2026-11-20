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
// Zaslepki (zapisywane w dzienniku `log`, gdy to krok domenowy): UI (`showHintMessage`, panele, render),
// `wasIndependentCityStateBeforeCapture` (false: brak miast-panstw w stanie Rust), `beginWonderTransferWatch` /
// `settleWonderTransfer` (brak cudow w scenariuszach), `triggerRebelProtectionWarConsequence`,
// `clearCityStateFlagOnCapture` (false), `maybeResolveRegularWarOnCityCapture`, `recordWarCityLossForPair`,
// `seedCityOwnerDefaults`, `syncCityGarnizon`, `runCapitalCapturePlunder` (null: miasta scenariuszy nie sa stolicami),
// `recordCityCaptureEvent`, `applyLiveSafeRationForCity`, `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines`.
// Te kroki maja wlasne wektory (Q3-Q8, ZDOBYCIE-MIASTA-A/B); tu liczy sie ich KOLEJNOSC i WARUNEK wywolania.
// `cityProd` puste (kolejka produkcji: wektory B).
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
const EXPECTED_SHA256 = process.env.KAP_SHA256_OVERRIDE ?? '376cbfc6e7a6ae510eb41af3be611278aaa11b848a07ab7cb1656cdb14d9162c';
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
].join('\n\n');

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
function recordWarCityLossForPair(..._a: any[]) { L('recordWarCityLossForPair'); }
function sanitizeBuildQueue(p: any) { L('sanitizeBuildQueue'); throw new Error('cityProd pusty w scenariuszach'); }
function seedCityOwnerDefaults(_c: any) { L('seedCityOwnerDefaults'); }
function enterCityAfterSurrender(u: any, c: any, n: number, d: any) { L('enterCityAfterSurrender'); return SEC.enterCityAfterSurrender(u, c, n, d); }
function syncCityGarnizon(_c: any) { L('syncCityGarnizon'); }
function runCapitalCapturePlunder(..._a: any[]) { L('runCapitalCapturePlunder'); return null; }
function buildCityCaptureReportRows(_i: any) { return []; }
function capturePopLossReportRow(_l: number) { return null; }
function recordCityCaptureEvent(a: any) { L('recordCityCaptureEvent'); __events.push({ cityId: a.cityId, oldOwner: a.oldOwner, newOwner: a.newOwner, eliminatedCivLabel: a.eliminatedCivLabel }); }
function civLabelForOwner(o: number) { return 'owner' + o; }
function captureReportOneLine(_r: any) { return ''; }
function mocLabel() { return 'Moc'; }
function applyLiveSafeRationForCity(_id: string) { L('applyLiveSafeRationForCity'); }
function tickSiegeMachinesForCity(_c: any) {}
function maybeAiAssaultAfterMachines(..._a: any[]) {}
function armyStackLimit() { return BATTLE_MAX_PER_SIDE; }
function getDiploRelation(a: number, b: number) { return { status: __war.has(Math.min(a, b) + '_' + Math.max(a, b)) ? 'wojna' : 'pokoj' }; }
function isBarbarian(o: number) { return o === BARBARIAN_OWNER_ID; }
function effectiveGameDifficultyForOwner(_o: number) { return 'normal'; }
function n3(econ: any) {
${N3.text}
}
return { n3, resolveSiegeSurrender, log: () => __log.splice(0), setTurn: (t: number) => { turn = t; } };
`;
const ENV_JS = ts.transpileModule(ENV_TS, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

const BARB = 999999;
function mkEnv(sc) {
  const cities = sc.cities.map(c => ({ ...c }));
  const units = sc.units.map(u => ({ ...u }));
  const war = new Set(sc.war.map(([a, b]) => Math.min(a, b) + '_' + Math.max(a, b)));
  const siegeTurnByCity = new Map();
  const siegeBesiegerByCity = new Map();
  const siegeAiStateByKey = new Map();
  const cityProd = new Map();
  const cityBuilt = new Map();
  const playerEverOwnedCityByOwner = new Set();
  const civChronicleByOwner = new Map();
  const events = [];
  const data = { units: UNITS, buildings: [], econParams: ECON };
  const env = new Function(
    'cities', 'units', 'siegeTurnByCity', 'siegeBesiegerByCity', 'siegeAiStateByKey', 'cityProd', 'cityBuilt',
    'playerEverOwnedCityByOwner', 'civChronicleByOwner', 'turn', 'selectedId', 'unitRenderer', 'cityRenderer',
    '_cityRenderOpts', 'data', 'capitalCaptureReportSlot', 'BATTLE_MAX_PER_SIDE', 'BARBARIAN_OWNER_ID', '__war', '__events',
    'PCL', 'ES', 'SEC', 'siegeStarvationState', 'siegeDefenderUnits', 'applyArmyStarvationHpLoss', 'buildEmpireFoodParams',
    'getCityFood', 'hexDistance', 'isCivilianUnit', 'CAPTURE_POP_LOSS', 'console',
    ENV_JS,
  )(
    cities, units, siegeTurnByCity, siegeBesiegerByCity, siegeAiStateByKey, cityProd, cityBuilt,
    playerEverOwnedCityByOwner, civChronicleByOwner, sc.turn, null, makeStub('unitRenderer'), makeStub('cityRenderer'),
    () => ({}), data, null, MAX_PER_SIDE, BARB, war, events,
    PCL, ES, SEC, SS.siegeStarvationState, SS.siegeDefenderUnits, AS.applyArmyStarvationHpLoss, EF.buildEmpireFoodParams,
    TE.getCityFood, SETUP.hexDistance, SETUP.isCivilianUnit, CITIES_MOD.CAPTURE_POP_LOSS, { log() {}, warn() {}, error(...a) { throw new Error('console.error: ' + a.join(' ')); } },
  );
  return { env, cities, units, siegeTurnByCity, playerEverOwnedCityByOwner, civChronicleByOwner, events };
}

const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
const CITY_KEYS = ['id', 'ownerId', 'population', 'oblegane', 'oblegajacyOwnerId', 'siegeCapitulationPending', 'siegeStarveStartMaxHp',
  'magazynZywnosci', 'capturedFromOwnerId', 'foundedBy', 'postCaptureLawTurnsRemaining', 'wasRebellionReconquest'];
const UNIT_KEYS = ['id', 'ownerId', 'typeId', 'q', 'r', 'hp', 'hpMax', 'oblegaCityId'];
function snapshot(st) {
  return {
    cities: st.cities.map(c => pick(c, CITY_KEYS)),
    units: st.units.map(u => pick(u, UNIT_KEYS)),
    everOwned: [...st.playerEverOwnedCityByOwner].sort((a, b) => a - b),
    chronicle: [...st.civChronicleByOwner.entries()].sort((a, b) => a[0] - b[0]),
    events: st.events.splice(0),
  };
}

// Jednostki: kategoria `piechota`, typ `Wojownik` (units.json pinu). Wlasciciel gracza = 0 (Rust: 1, D-ZMA-5).
const W = 'Wojownik';
const unit = (id, ownerId, q, r, extra = {}) => ({ id, ownerId, typeId: W, category: 'piechota', q, r, ...extra });
const city = (id, ownerId, q, r, extra = {}) => ({ id, ownerId, name: 'M' + id, q, r, population: 3, oblegane: true, ...extra });
const base = (over) => ({ turn: 5, turns: 2, war: [[0, 101]], ...over });
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
  // Dwa miasta w jednym ticku (kolejnosc `cities`); drugie nie oblegane.
  base({ name: 'dwa_miasta', war: [[0, 101], [0, 102]], cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 }), city('905', 102, 9, 9, { oblegajacyOwnerId: 0, population: 5 }), city('910', 101, 0, 0, { oblegane: false })],
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' }), unit('7002', 0, 10, 9, { oblegaCityId: '905' })] }),
  // Obca (trzecia) jednostka na heksie miasta blokuje wejscie (Z4 planSurrenderEntry).
  base({ name: 'wejscie_zablokowane', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('7001', 0, 5, 3, { oblegaCityId: '900' }), unit('7201', 103, 4, 3, { category: 'osadnik', typeId: 'Osadnik' })] }),
  // Obroncy starego wlasciciela na heksie (cywil -> nie garnizon, ale usuwany przy przejeciu).
  base({ name: 'cywil_obroncy', cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })],
    units: [unit('8001', 101, 4, 3, { category: 'osadnik', typeId: 'Osadnik' }), unit('7001', 0, 5, 3, { oblegaCityId: '900' })] }),
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
  const st = mkEnv(base({ cities: [city('900', 101, 4, 3, { oblegajacyOwnerId: 0 })], units: [] }));
  st.env.log();
  st.env.resolveSiegeSurrender('999');
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
