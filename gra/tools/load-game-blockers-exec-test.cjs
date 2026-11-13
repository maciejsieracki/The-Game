'use strict';
/**
 * load-game-blockers-exec-test.cjs -- R-WEB-LOAD-GAME-REGRESSION-Q1, runda 5, punkt (c).
 *
 * WYKONAWCZY test blokad wczytywania: wyciaga PRAWDZIWE ciala funkcji z gra/src/main.ts
 *   resetEndTurnBlockers, prepareSessionForLoad, healStaleEndTurnBlockers,
 *   canPlayerInitiateEndTurn (+ helpery kolejki bitew), bundluje PRAWDZIWA kolejke
 *   gra/src/ui/preBattle.ts (esbuild + jsdom) i uruchamia je w fabryce z podstawionym stanem.
 * Funkcje UI, ktorych nie da sie zbundlowac (resetStuckInteractiveState, popOverlay, ...),
 * sa zaslepkami no-op -- nie wplywaja na blokady konca tury.
 *
 * Scenariusze:
 *   L1  kolejka niepusta (bitwa AI odlozona przy otwartej audiencji, audiencja zamknieta bez flusha)
 *       + endTurnInProgress / aiCmdResume / aiTurnAwaitingBattle ustawione -> prepareSessionForLoad()
 *       => kolejka pusta, blokady zresetowane, canPlayerInitiateEndTurn() === true
 *   L2  otwarty ekran bitwy (reczny) + kolejka niepusta -> prepareSessionForLoad()
 *       => isPreBattleOpen() === false, canPlayerInitiateEndTurn() === true
 *   L3  aiTurnAwaitingBattle=true, aiCmdResume ustawiony -> prepareSessionForLoad()
 *       => canPlayerInitiateEndTurn() === true
 *   K1  kontrola: BEZ wczytania ta sama sytuacja L1 blokuje koniec tury (false); otwarty ekran
 *       bitwy tez blokuje (legalna blokada).
 *   M1  mutacja: resetEndTurnBlockers bez clearDeferredAutoPreBattleQueue() -> L1 musi czerwienic.
 *   M2  mutacja: resetEndTurnBlockers bez hidePreBattle() -> L2 musi czerwienic.
 *   M3  mutacja: resetEndTurnBlockers bez zerowania aiCmdResume -> L3 musi czerwienic.
 *
 * Ograniczenie: sprawdza warstwe blokad (funkcje z main.ts), NIE pelny loadGameFromSlot
 * (ten jest sprawdzany w Chromium przez load-game-regression-e2e.cjs).
 *
 * Usage (z gra/): node tools/load-game-blockers-exec-test.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.error('  FAIL ' + label); }
}

const GRA = path.join(__dirname, '..');
const MAIN_SRC = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'load-blockers-'));

function findFn(src, header, indent = '    ') {
  const start = src.indexOf(header);
  if (start < 0) return null;
  const endMarker = '\n' + indent + '}\n';
  const end = src.indexOf(endMarker, start);
  if (end < 0) throw new Error('[extract] brak konca funkcji: ' + header);
  return { start, end: end + endMarker.length - 1 };
}
function extractFn(src, header) {
  const r = findFn(src, header);
  return r ? src.slice(r.start, r.end) : null;
}
function replaceFn(src, header, fn) {
  const r = findFn(src, header);
  if (!r) throw new Error('[mutant] brak funkcji ' + header);
  return src.slice(0, r.start) + fn(src.slice(r.start, r.end)) + src.slice(r.end);
}
function dropOnce(text, needle) {
  const n = text.split(needle).length - 1;
  if (n !== 1) throw new Error('[mutant] needle x' + n + ': ' + needle);
  return text.replace(needle, '');
}

const FN_HEADERS = [
  'function flushDeferredPreBattleSafely(where: string): void {',
  'function scheduleDeferredPreBattleQueueWatchdog(): void {',
  'function maybeScheduleDeferredPreBattleQueueWatchdog(): void {',
  'function healStaleEndTurnBlockers(): void {',
  'function canPlayerInitiateEndTurn(): boolean {',
  'function hintEndTurnBlocked(): void {',
  'function healStuckDeferredPreBattleQueueOnEndTurnAttempt(): void {',
  'function resetEndTurnBlockers(reason: string): void {',
  'function prepareSessionForLoad(): void {',
];
// Zmienne `let` z main.ts czytane/zapisywane przez wyciagniete ciala.
const STATE = [
  ['deferredPreBattleWatchdogTimer', 'null'], ['endTurnInProgress', 'false'], ['endTurnStartedAt', '0'],
  ['activeWorldEndTurnPipeline', 'false'],
  ['battleUiResolving', 'false'], ['aiCmdResume', 'null'], ['aiTurnAwaitingBattle', 'false'],
  ['playtestWalkaActive', 'false'], ['gameOver', 'false'], ['galleryOn', 'false'],
  ['bitwaDuzaActive', 'false'], ['playtestMiastoActive', 'false'], ['foundCityMode', 'false'],
  ['buildModeOpen', 'false'], ['activeImprovementKey', 'null'], ['revealAllLand', 'false'],
  ['pendingEraChangeToastForNextTurn', 'null'],
];
// Zaslepki UI wolane przez prepareSessionForLoad (no-op: nie dotycza blokad).
const STUBS = [
  'resetStuckInteractiveState', 'popOverlay', 'hideSiegeMapPanel', 'hideCityAttackChoice',
  'clearSiegeHtmlLabels', 'resetMapOverlayToggleDefaults', 'clearBuildModeVisuals', 'diagInfo',
  'pruneStaleAiTradeOffersAwaitingPlayer', 'hasBlockingAiTradeOfferForPlayer',
].map((n) => 'const ' + n + ' = (..._a: any[]): void => {};').join('\n  ');

function buildFactory(mainSrc) {
  const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
  const bodies = [];
  const present = [];
  for (const h of FN_HEADERS) {
    const t = extractFn(mainSrc, h);
    if (t === null) continue; // helper nieobecny w tej bazie (np. DEADLOCK) -- pomijany
    bodies.push(t);
    present.push(h.match(/function (\w+)/)[1]);
  }
  const stateDecl = STATE.map(([n, v]) => 'let ' + n + ': any = ' + v + ';').join('\n  ');
  const stateAcc = STATE.map(([n]) => 'get ' + n + '() { return ' + n + '; }, set ' + n + '(v: any) { ' + n + ' = v; },').join('\n    ');
  const prog = [
    'function __factory(deps: any) {',
    '  const { isPreBattleOpen, hidePreBattle, hasPendingAutoPreBattle, oldestPendingAutoPreBattleAgeMs,',
    '    clearDeferredAutoPreBattleQueue, flushDeferredAutoPreBattle, isDiplomacyAudienceOpen, isArmyMergePanelOpen,',
    '    isAwaitingFirstPlayerCity, isTurnTransitionActive, endTurnTransition, showHintMessage,',
    '    switchActiveHuman, beginOnboardingFoundCity, endActiveHumanTurn, humanSeats, window, console,',
    '    isBattleSceneOpen, isPostBattleSummaryOpen } = deps;',
    '  let seatsFinishedThisRound: Set<number> = new Set<number>();',
    '  ' + stateDecl,
    '  ' + STUBS,
    bodies.join('\n\n'),
    '  return {',
    '    api: { ' + present.join(', ') + ' },',
    '    S: {',
    '    ' + stateAcc,
    '    get seatsFinishedThisRound() { return seatsFinishedThisRound; },',
    '    },',
    '  };',
    '}',
  ].join('\n');
  const js = esbuild.transformSync(prog, { loader: 'ts' }).code;
  return new Function(js + '\nreturn __factory;')();
}

async function loadPreBattle() {
  const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
  const { JSDOM } = require(path.join(GRA, 'node_modules', 'jsdom'));
  const stub = (name, text) => { const p = path.join(TMP, name); fs.writeFileSync(p, text, 'utf8'); return p; };
  const brand = stub('brand.ts', [
    "export function terrainIconSvg() { return ''; }", "export function civIconSvg() { return ''; }",
    "export function brandIconSvg() { return ''; }", "export function unitIconSvg() { return ''; }",
  ].join('\n'));
  const leader = stub('leader.ts', 'export function leaderPortraitUrl() { return null; }\nexport function leaderName() { return ""; }\n');
  const audio = stub('audio.ts', 'export function startPreBattleMusic() {}\nexport function stopPreBattleMusic() {}\n');
  const hud = stub('hud.ts', 'export function setArmyStackHudSuppressed() {}\n');
  const entry = path.join(TMP, 'entry.ts');
  const preBattlePath = path.join(GRA, 'src', 'ui', 'preBattle.ts').split(path.sep).join('/');
  fs.writeFileSync(entry, [
    'export {',
    '  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,',
    '  hasPendingAutoPreBattle, oldestPendingAutoPreBattleAgeMs, clearDeferredAutoPreBattleQueue,',
    "} from '" + preBattlePath + "';",
  ].join('\n'), 'utf8');
  const out = path.join(TMP, 'bundle.cjs');
  const plugin = {
    name: 'stub-load-blockers',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: brand }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: brand }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: leader }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({ path: audio }));
      build.onResolve({ filter: /hud$/ }, () => ({ path: hud }));
    },
  };
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out,
    absWorkingDir: GRA, logLevel: 'silent', plugins: [plugin] });
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  return require(out);
}

// Falszywy zegar (watchdog kolejki uzywa window.setTimeout).
const clock = { now: 1000000, timers: [], nextId: 1 };
Date.now = () => clock.now;
const fakeWindow = {
  setTimeout(fn, ms) { const id = clock.nextId++; clock.timers.push({ id, at: clock.now + (ms || 0), fn }); return id; },
  clearTimeout(id) { clock.timers = clock.timers.filter((t) => t.id !== id); },
};

function makeEnv(PB, factory) {
  const env = { audience: false, transition: false, hints: [], endTurnCalls: [] };
  PB.configurePreBattle({ isOtherEndTurnModalOpen: () => env.audience });
  const humanSeats = { humanOwnerIds: [0], activeHumanOwnerId: 0 };
  const inst = factory({
    isPreBattleOpen: PB.isPreBattleOpen, hidePreBattle: PB.hidePreBattle,
    hasPendingAutoPreBattle: PB.hasPendingAutoPreBattle, oldestPendingAutoPreBattleAgeMs: PB.oldestPendingAutoPreBattleAgeMs,
    clearDeferredAutoPreBattleQueue: PB.clearDeferredAutoPreBattleQueue, flushDeferredAutoPreBattle: PB.flushDeferredAutoPreBattle,
    isDiplomacyAudienceOpen: () => env.audience, isArmyMergePanelOpen: () => false,
    isBattleSceneOpen: () => false, isPostBattleSummaryOpen: () => false,
    isAwaitingFirstPlayerCity: () => false, isTurnTransitionActive: () => env.transition,
    endTurnTransition: () => {}, showHintMessage: (m) => { env.hints.push(m); },
    switchActiveHuman: (id) => { humanSeats.activeHumanOwnerId = id; }, beginOnboardingFoundCity: () => {},
    endActiveHumanTurn: (id) => { env.endTurnCalls.push(id); }, humanSeats, window: fakeWindow,
    console: { log: () => {}, warn: () => {}, error: () => {} },
  });
  env.api = inst.api;
  env.S = inst.S;
  return env;
}

function battleInfo(label) {
  return {
    atakujacy: { nazwa: 'Barbarzyncy', ownerId: 99, units: [{ nazwa: 'Wojownik ' + label, kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }] },
    obronca: { nazwa: 'Osada', ownerId: 0, units: [{ nazwa: 'Milicja', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }] },
    teren: 'Rownina', szanseAtkPct: 30, miejsce: 'Bitwa ' + label, tura: 43, canRetreat: false,
  };
}
const cb = () => ({ onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} });

function resetPre(PB) {
  PB.configurePreBattle({ isOtherEndTurnModalOpen: () => false });
  PB.hidePreBattle();
  PB.clearDeferredAutoPreBattleQueue();
  clock.timers.length = 0;
}

/** Stan po zakonczeniu tury z zaleglosciami: kolejka niepusta, blokady ustawione. */
function setupStuckQueue(PB, env) {
  env.audience = true;
  PB.showPreBattle(battleInfo('WOJNA1'), cb(), { auto: true });   // odlozona: audiencja otwarta
  env.audience = false;                                            // audiencja zamknieta BEZ flusha
  env.S.endTurnInProgress = true;
  env.S.aiCmdResume = { stub: true };
  env.S.aiTurnAwaitingBattle = true;
}

function runScenario(PB, factory, scen) {
  resetPre(PB);
  const env = makeEnv(PB, factory);
  if (scen === 'L1') setupStuckQueue(PB, env);
  if (scen === 'L2') { PB.showPreBattle(battleInfo('LEGALSHOWN'), cb(), { auto: false }); PB.showPreBattle(battleInfo('LEGALQUEUED'), cb(), { auto: true }); }
  if (scen === 'L3') { env.S.aiTurnAwaitingBattle = true; env.S.aiCmdResume = { stub: true }; env.S.endTurnInProgress = true; }
  return env;
}

async function main() {
  const PB = await loadPreBattle();
  const factory = buildFactory(MAIN_SRC);

  console.log('-- L1: kolejka niepusta + blokady -> prepareSessionForLoad');
  let env = runScenario(PB, factory, 'L1');
  ok(PB.hasPendingAutoPreBattle() === true, 'L1 przed: kolejka odlozonych bitew niepusta');
  ok(env.api.canPlayerInitiateEndTurn() === false, 'L1 przed: koniec tury zablokowany (stan wyjsciowy)');
  env.api.prepareSessionForLoad();
  ok(PB.hasPendingAutoPreBattle() === false, 'L1 po load: kolejka wyczyszczona');
  ok(env.S.endTurnInProgress === false && env.S.aiCmdResume === null && env.S.aiTurnAwaitingBattle === false,
    'L1 po load: endTurnInProgress/aiCmdResume/aiTurnAwaitingBattle zresetowane');
  ok(env.api.canPlayerInitiateEndTurn() === true, 'L1 po load: canPlayerInitiateEndTurn() === true');

  console.log('-- L2: otwarty ekran bitwy + kolejka -> prepareSessionForLoad');
  env = runScenario(PB, factory, 'L2');
  ok(PB.isPreBattleOpen() === true, 'L2 przed: ekran bitwy otwarty');
  env.api.prepareSessionForLoad();
  ok(PB.isPreBattleOpen() === false, 'L2 po load: ekran bitwy zamkniety');
  ok(PB.hasPendingAutoPreBattle() === false, 'L2 po load: kolejka pusta');
  ok(env.api.canPlayerInitiateEndTurn() === true, 'L2 po load: canPlayerInitiateEndTurn() === true');

  console.log('-- L3: aiTurnAwaitingBattle + aiCmdResume (bez kolejki) -> prepareSessionForLoad');
  env = runScenario(PB, factory, 'L3');
  // Bez kolejki i bez otwartego ekranu healStaleEndTurnBlockers() (wolany przez canPlayer...)
  // sam zdejmuje osierocone flagi -- stan wyjsciowy NIE jest blokada (zachowanie bazy, nie bug).
  console.log('  info L3 przed (healStale sprząta osierocone flagi): canPlayer=' + env.api.canPlayerInitiateEndTurn());
  env.api.prepareSessionForLoad();
  ok(env.api.canPlayerInitiateEndTurn() === true, 'L3 po load: canPlayerInitiateEndTurn() === true');

  console.log('-- K1: kontrola bez wczytania -- blokada musi zostac');
  env = runScenario(PB, factory, 'L1');
  ok(env.api.canPlayerInitiateEndTurn() === false, 'K1 bez load: koniec tury nadal zablokowany (kolejka+blokady)');
  resetPre(PB);
  PB.showPreBattle(battleInfo('WOJNA2'), cb(), { auto: false });
  env = makeEnv(PB, factory);
  ok(env.api.canPlayerInitiateEndTurn() === false, 'K1b bez load: otwarty ekran bitwy blokuje (legalna blokada)');

  console.log('-- mutacje (kazda musi czerwienic swoj scenariusz)');
  const mutants = [
    ['M1 bez clearDeferredAutoPreBattleQueue', 'L1', (src) => replaceFn(src, 'function resetEndTurnBlockers(reason: string): void {', (f) => dropOnce(f, 'clearDeferredAutoPreBattleQueue();'))],
    ['M2 bez hidePreBattle', 'L2', (src) => replaceFn(src, 'function resetEndTurnBlockers(reason: string): void {', (f) => dropOnce(f, 'if (isPreBattleOpen()) hidePreBattle();'))],
  ];
  // M3 (bez aiCmdResume=null w resetEndTurnBlockers) jest mutantem RÓWNOWAŻNYM w bazie:
  // healStaleEndTurnBlockers() zdejmuje osierocony aiCmdResume bez kolejki i ekranu, więc
  // koniec tury po wczytaniu zostaje odblokowany. Test to dokumentuje (nie udaje czerwieni).
  {
    const m3Src = replaceFn(MAIN_SRC, 'function resetEndTurnBlockers(reason: string): void {', (f) => dropOnce(f, '      aiCmdResume = null;\n'));
    const e3 = runScenario(PB, buildFactory(m3Src), 'L3');
    e3.api.prepareSessionForLoad();
    ok(e3.api.canPlayerInitiateEndTurn() === true, 'M3 (bez aiCmdResume=null) RÓWNOWAZNA: po load nadal odblokowane (healStale)');
  }
  for (const [name, scen, mutate] of mutants) {
    const mf = buildFactory(mutate(MAIN_SRC));
    const e2 = runScenario(PB, mf, scen);
    if (scen === 'L2') { /* ekran otwarty przed wczytaniem */ }
    e2.api.prepareSessionForLoad();
    const red = scen === 'L1' ? e2.api.canPlayerInitiateEndTurn() === false
      : scen === 'L2' ? e2.api.canPlayerInitiateEndTurn() === false
        : e2.api.canPlayerInitiateEndTurn() === false;
    ok(red, 'mutacja ' + name + ' czerwieni ' + scen);
  }
  resetPre(PB);
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log('load-blockers-exec: ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FAIL wyjatek: ' + (e && e.stack || e)); process.exit(1); });
