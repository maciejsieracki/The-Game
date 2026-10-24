'use strict';
/**
 * endturn-battle-deadlock-exec-test.cjs
 *
 * R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1, runda 5 (zarzut Evaluatora po r4: brak testu WYKONAWCZEGO).
 *
 * Test wykonuje PRAWDZIWE ciała funkcji wyciągnięte ze źródła gra/src/main.ts:
 *   advanceSeat, triggerPlayerEndTurn, canPlayerInitiateEndTurn, hintEndTurnBlocked,
 *   healStaleEndTurnBlockers, healStuckDeferredPreBattleQueueOnEndTurnAttempt,
 *   flushDeferredPreBattleSafely, scheduleDeferredPreBattleQueueWatchdog,
 *   maybeScheduleDeferredPreBattleQueueWatchdog (funkcje nieobecne w źródle są pomijane).
 * Ciała są transpilowane przez esbuild i uruchamiane w fabryce z podstawionym stanem
 * (zmienne `let` z main.ts) i zaślepkami modułów, których main.ts nie da się zbundlować.
 * Kolejka bitew (ui/preBattle.ts) jest PRAWDZIWA (bundel esbuild + jsdom).
 * Zegar jest sterowany ręcznie: Date.now() i window.setTimeout (watchdog 50 ms) to fałszywe
 * timery, odpalane wyłącznie przez advanceFakeClock(). Nic nie czeka na prawdziwy czas.
 *
 * Źródła:
 *   - wersja naprawiona: gra/src/main.ts (worktree)
 *   - baza origin/main: `git show fcd86933:gra/src/main.ts` (scenariusz A i kontrola D-base)
 *
 * Scenariusze:
 *   A  (fcd86933) deadlock trwały: klik 1 i 2 -> endTurn=0, podpowiedź „Zakończ ekran bitwy…”
 *   B  (poprawka) klik 1 otwiera ekran bitwy; po jego rozstrzygnięciu klik 2 kończy turę
 *   C1 (poprawka) legalna blokada przy OTWARTYM ekranie bitwy zostaje (także po 9 s czasu)
 *   C2 (poprawka) legalna blokada przy otwartej audiencji (bitwa czeka w kolejce) zostaje
 *   D  (poprawka) N=4 bitwy w kolejce, jedna rzuca w showPreBattle -> koniec tury po skończonej
 *                 liczbie kliknięć (≤ N+1), kolejność FIFO, wyjątek nie wychodzi z kliknięcia
 *   E  (poprawka) WATCHDOG 50 ms: timer zaplanowany, odpalony bez kliknięcia, otwiera kolejkę;
 *                 przy otwartej audiencji w chwili odpalenia NIE otwiera
 *   F  mutacje (każda musi czerwienić swój scenariusz):
 *        M1 brak flush-first w healStuck, M2 brak watchdoga, M3 brak try/catch,
 *        M4 osłabiona bramka (tylko isPreBattleOpen)
 *
 * Usage (z gra/): node tools/endturn-battle-deadlock-exec-test.cjs
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.error('  FAIL ' + label); }
}

const GRA = path.join(__dirname, '..');
const REPO = path.join(GRA, '..');
const MAIN_FIXED = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const MAIN_BASE = execFileSync('git', ['show', 'fcd86933:gra/src/main.ts'], {
  cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
});

// ---------------------------------------------------------------------------
// Wyciąganie ciał funkcji z main.ts (wcięcie 4 spacje = poziom bootstrapu)
// ---------------------------------------------------------------------------
function findFn(src, header, indent = '    ') {
  const start = src.indexOf(header);
  if (start < 0) return null;
  const endMarker = '\n' + indent + '}\n';
  const end = src.indexOf(endMarker, start);
  if (end < 0) throw new Error('[extract] brak końca funkcji: ' + header);
  return { start, end: end + endMarker.length - 1 };
}
function extractFn(src, header) {
  const r = findFn(src, header);
  return r ? src.slice(r.start, r.end) : null;
}
function replaceFn(src, header, newText) {
  const r = findFn(src, header);
  if (!r) throw new Error('[mutant] brak funkcji ' + header);
  return src.slice(0, r.start) + newText + src.slice(r.end);
}
function replaceOnce(src, needle, repl) {
  const n = src.split(needle).length - 1;
  if (n !== 1) throw new Error('[mutant] needle występuje ' + n + 'x: ' + needle.slice(0, 80));
  return src.replace(needle, () => repl);
}

const FN_HEADERS = [
  'function flushDeferredPreBattleSafely(where: string): void {',
  'function scheduleDeferredPreBattleQueueWatchdog(): void {',
  'function maybeScheduleDeferredPreBattleQueueWatchdog(): void {',
  'function healStaleEndTurnBlockers(): void {',
  'function canPlayerInitiateEndTurn(): boolean {',
  'function hintEndTurnBlocked(): void {',
  'function healStuckDeferredPreBattleQueueOnEndTurnAttempt(): void {',
  'function advanceSeat(): void {',
  'function triggerPlayerEndTurn(): void {',
];
// Zmienne `let` z main.ts, które ciała funkcji czytają/zapisują.
const STATE = [
  ['deferredPreBattleWatchdogTimer', 'null'],
  ['endTurnInProgress', 'false'],
  ['endTurnStartedAt', '0'],
  ['battleUiResolving', 'false'],
  ['aiCmdResume', 'null'],
  ['aiTurnAwaitingBattle', 'false'],
  ['playtestWalkaActive', 'false'],
  ['gameOver', 'false'],
  ['galleryOn', 'false'],
];

// Buduje fabrykę z ciał funkcji podanego źródła main.ts.
function buildFactory(mainSrc) {
  const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
  const bodies = [];
  const present = [];
  for (const h of FN_HEADERS) {
    const t = extractFn(mainSrc, h);
    if (t === null) continue;
    bodies.push(t);
    present.push(h.match(/function (\w+)/)[1]);
  }
  const stateDecl = STATE.map(([n, v]) => `let ${n}: any = ${v};`).join('\n  ');
  const stateAcc = STATE.map(([n]) => `get ${n}() { return ${n}; }, set ${n}(v: any) { ${n} = v; },`).join('\n    ');
  const prog = `
function __factory(deps: any) {
  const { isPreBattleOpen, hidePreBattle, hasPendingAutoPreBattle, oldestPendingAutoPreBattleAgeMs,
    clearDeferredAutoPreBattleQueue, flushDeferredAutoPreBattle, isDiplomacyAudienceOpen, isArmyMergePanelOpen,
    isAwaitingFirstPlayerCity, isTurnTransitionActive, endTurnTransition, showHintMessage,
    switchActiveHuman, beginOnboardingFoundCity, endActiveHumanTurn, humanSeats, window, console,
    isBattleSceneOpen, isPostBattleSummaryOpen } = deps;
  let seatsFinishedThisRound: Set<number> = new Set<number>();
  ${stateDecl}
  ${bodies.join('\n\n')}
  return {
    api: { ${present.join(', ')} },
    S: {
    ${stateAcc}
    get seatsFinishedThisRound() { return seatsFinishedThisRound; },
    },
  };
}
`;
  const js = esbuild.transformSync(prog, { loader: 'ts' }).code;
  const factory = new Function(js + '\nreturn __factory;')();
  return { factory, present };
}

// ---------------------------------------------------------------------------
// Bundel PRAWDZIWEGO ui/preBattle.ts + jsdom (zaślepki jak w endturn-battle-deadlock-test.cjs)
// ---------------------------------------------------------------------------
const TMP = path.join(__dirname, '.endturn-exec-stubs');
const ENTRY = path.join(__dirname, '.endturn-exec-entry.ts');
const OUT = path.join(__dirname, '.endturn-exec-bundle.cjs');
const CLEANUP = [];
function writeStub(name, text) {
  const p = path.join(TMP, name);
  fs.writeFileSync(p, text, 'utf8');
  CLEANUP.push(p);
  return p;
}

async function loadPreBattle() {
  const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
  const { JSDOM } = require('jsdom');
  fs.mkdirSync(TMP, { recursive: true });
  const brand = writeStub('brandAssets-stub.ts', [
    "export function terrainIconSvg() { return ''; }",
    "export function civIconSvg() { return ''; }",
    "export function brandIconSvg() { return ''; }",
    "export function unitIconSvg() { return ''; }",
  ].join('\n'));
  const leader = writeStub('leaderPortraits-stub.ts', [
    'export function leaderPortraitUrl() { return null; }',
    "export function leaderName() { return ''; }",
  ].join('\n'));
  const audio = writeStub('audio-stub.ts', [
    'export function startPreBattleMusic() {}',
    'export function stopPreBattleMusic() {}',
  ].join('\n'));
  const hud = writeStub('hud-stub.ts', 'export function setArmyStackHudSuppressed() {}\n');
  fs.writeFileSync(ENTRY, [
    'export {',
    '  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,',
    '  hasPendingAutoPreBattle, oldestPendingAutoPreBattleAgeMs, clearDeferredAutoPreBattleQueue,',
    "} from '../src/ui/preBattle.ts';",
  ].join('\n'), 'utf8');
  CLEANUP.push(ENTRY, OUT);
  const stubPlugin = {
    name: 'stub-endturn-exec',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: brand }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: brand }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: leader }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({ path: audio }));
      build.onResolve({ filter: /hud$/ }, () => ({ path: hud }));
    },
  };
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: OUT,
    absWorkingDir: GRA, logLevel: 'silent', plugins: [stubPlugin],
  });
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  return require(OUT);
}

// Fałszywy zegar: Date.now() i window.setTimeout sterowane ręcznie.
const clock = { now: 1000000, timers: [], nextId: 1 };
const realDateNow = Date.now;
Date.now = () => clock.now;
const fakeWindow = {
  setTimeout(fn, ms) {
    const id = clock.nextId++;
    clock.timers.push({ id, at: clock.now + (ms || 0), delay: ms, fn });
    return id;
  },
  clearTimeout(id) { clock.timers = clock.timers.filter(t => t.id !== id); },
};
function advanceFakeClock(ms) {
  const target = clock.now + ms;
  for (;;) {
    clock.timers.sort((a, b) => a.at - b.at || a.id - b.id);
    const t = clock.timers[0];
    if (!t || t.at > target) break;
    clock.timers.shift();
    clock.now = t.at;
    t.fn();
  }
  clock.now = target;
}

// ---------------------------------------------------------------------------
// Środowisko scenariusza
// ---------------------------------------------------------------------------
function makeEnv(PB, mainSrc) {
  const { factory } = buildFactory(mainSrc);
  const env = {
    audience: false, armyMerge: false, transition: false, battleScene: false, postSummary: false,
    hints: [], warns: [], endTurnCalls: [],
  };
  const capConsole = {
    log: () => {},
    warn: (...a) => { env.warns.push(a.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')); },
    error: () => {},
  };
  PB.configurePreBattle({ isOtherEndTurnModalOpen: () => env.audience });
  const humanSeats = { humanOwnerIds: [0], activeHumanOwnerId: 0 };
  const inst = factory({
    isPreBattleOpen: PB.isPreBattleOpen,
    hidePreBattle: PB.hidePreBattle,
    hasPendingAutoPreBattle: PB.hasPendingAutoPreBattle,
    oldestPendingAutoPreBattleAgeMs: PB.oldestPendingAutoPreBattleAgeMs,
    clearDeferredAutoPreBattleQueue: PB.clearDeferredAutoPreBattleQueue,
    flushDeferredAutoPreBattle: PB.flushDeferredAutoPreBattle,
    isDiplomacyAudienceOpen: () => env.audience,
    isArmyMergePanelOpen: () => env.armyMerge,
    isBattleSceneOpen: () => env.battleScene,
    isPostBattleSummaryOpen: () => env.postSummary,
    isAwaitingFirstPlayerCity: () => false,
    isTurnTransitionActive: () => env.transition,
    endTurnTransition: () => {},
    showHintMessage: (m) => { env.hints.push(m); },
    switchActiveHuman: (id) => { humanSeats.activeHumanOwnerId = id; },
    beginOnboardingFoundCity: () => {},
    endActiveHumanTurn: (id) => { env.endTurnCalls.push(id); },
    humanSeats,
    window: fakeWindow,
    console: capConsole,
  });
  env.api = inst.api;
  env.S = inst.S;
  return env;
}

// Zeruje moduł preBattle między scenariuszami (singleton w bundlu) i fałszywy zegar.
function resetPre(PB) {
  PB.configurePreBattle({ isOtherEndTurnModalOpen: () => false });
  PB.hidePreBattle();
  PB.clearDeferredAutoPreBattleQueue();
  clock.timers.length = 0;
}

function battleInfo(label, opts = {}) {
  const atk = {
    nazwa: 'Barbarzyncy', ownerId: 99,
    units: [{ nazwa: 'Wojownik ' + label, kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }],
  };
  const info = {
    atakujacy: atk,
    obronca: { nazwa: 'Osada', ownerId: 0, units: [{ nazwa: 'Milicja', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }] },
    teren: 'Rownina', szanseAtkPct: 30, miejsce: 'Bitwa ' + label, tura: 43, canRetreat: false,
  };
  if (opts.throwing) {
    // Getter rzuca PO zdjęciu elementu z kolejki (shift() w flushDeferredAutoPreBattle).
    Object.defineProperty(info, 'atakujacy', {
      enumerable: true, configurable: true,
      get() { if (opts.armed.on) { opts.armed.on = false; throw new Error('boom-' + label); } return atk; },
    });
  }
  return info;
}
const cb = () => ({ onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} });
// Etykieta bitwy z tytułu ekranu („Broni się: Bitwa W0”); null gdy brak ekranu.
const screenLabel = () => {
  const t = document.querySelector('.pb-ttl');
  const m = /Bitwa ([A-Za-z0-9]+)/.exec(t ? (t.textContent || '') : '');
  return m ? m[1] : null;
};

// Jedno „kliknięcie” w ZAKOŃCZ TURĘ. Nie rzuca -- wyjątek jest zapisany w wyniku.
function click(env, entry) {
  const before = env.endTurnCalls.length;
  const hintsBefore = env.hints.length;
  let threw = null;
  try { env.api[entry](); } catch (e) { threw = String((e && e.message) || e); }
  return {
    ended: env.endTurnCalls.length - before,
    threw,
    hint: env.hints.length > hintsBefore ? env.hints[env.hints.length - 1] : null,
  };
}

// ---------------------------------------------------------------------------
// Scenariusze
// ---------------------------------------------------------------------------
const HINT_BLOCK = 'Zakończ ekran bitwy, potem zakończ turę.';

// Osierocona kolejka: bitwa odłożona (audiencja otwarta), audiencja zamknięta BEZ flusha, ekranu brak.
function orphanQueue(PB, env) {
  env.audience = true;
  PB.showPreBattle(battleInfo('WOJNA1'), cb(), { auto: true });
  env.audience = false;
}

function scenarioA(PB, src) {
  resetPre(PB);
  const env = makeEnv(PB, src);
  orphanQueue(PB, env);
  const r = { queued: PB.hasPendingAutoPreBattle(), screen: PB.isPreBattleOpen() };
  r.c1 = click(env, 'advanceSeat');
  r.c2 = click(env, 'advanceSeat');
  for (let i = 0; i < 8; i++) click(env, 'advanceSeat');
  r.endAfter10 = env.endTurnCalls.length;
  r.screenAfter10 = PB.isPreBattleOpen();
  return r;
}

function scenarioB(PB, src) {
  resetPre(PB);
  const env = makeEnv(PB, src);
  orphanQueue(PB, env);
  const r = {};
  r.c1 = click(env, 'advanceSeat');
  r.screenAfterC1 = PB.isPreBattleOpen();
  r.titleAfterC1 = screenLabel();
  PB.hidePreBattle();                       // gracz rozstrzyga bitwę
  r.c2 = click(env, 'advanceSeat');
  r.endAfterC2 = env.endTurnCalls.length;
  return r;
}

function scenarioC1(PB, src) {
  resetPre(PB);
  const env = makeEnv(PB, src);
  PB.showPreBattle(battleInfo('LEGALSHOWN'), cb(), { auto: false });   // ekran otwarty (ręczny)
  PB.showPreBattle(battleInfo('LEGALQUEUED'), cb(), { auto: true });   // + odłożona (ekran otwarty)
  const r = { queuedBefore: PB.hasPendingAutoPreBattle() };
  r.c1 = click(env, 'advanceSeat');
  advanceFakeClock(9000);                   // 9 s fałszywego czasu (> próg 8000 ms)
  r.c2 = click(env, 'advanceSeat');
  advanceFakeClock(1000);                   // odpal wszystkie timery watchdoga
  r.screenStill = screenLabel();
  r.queuedAfter = PB.hasPendingAutoPreBattle();
  r.endTurn = env.endTurnCalls.length;
  return r;
}

function scenarioC2(PB, src) {
  resetPre(PB);
  const env = makeEnv(PB, src);
  orphanQueue(PB, env);
  env.audience = true;                      // audiencja nadal otwarta -- legalne odroczenie
  const r = { c1: click(env, 'advanceSeat') };
  advanceFakeClock(60);
  r.c2 = click(env, 'advanceSeat');
  r.screen = PB.isPreBattleOpen();
  r.queued = PB.hasPendingAutoPreBattle();
  r.endTurn = env.endTurnCalls.length;
  return r;
}

function scenarioD(PB, src, entry) {
  resetPre(PB);
  const env = makeEnv(PB, src);
  const armed = { on: false };
  env.audience = true;
  PB.showPreBattle(battleInfo('W0'), cb(), { auto: true });
  PB.showPreBattle(battleInfo('W1', { throwing: true, armed }), cb(), { auto: true });
  PB.showPreBattle(battleInfo('W2'), cb(), { auto: true });
  PB.showPreBattle(battleInfo('W3'), cb(), { auto: true });
  const queuedN = PB.hasPendingAutoPreBattle();   // boolean: kolejka niepusta (liczność -- patrz FIFO)
  armed.on = true;                         // showPreBattle(W1) rzuci PO zdjęciu z kolejki
  env.audience = false;
  const N = 4;
  const shown = [];
  const clicks = [];
  let threwOut = false;
  for (let i = 0; i < N + 6 && env.endTurnCalls.length === 0; i++) {
    const c = click(env, entry);
    clicks.push(c.ended ? 'END' : (c.threw ? 'THREW' : 'blocked'));
    if (c.threw) threwOut = true;
    if (PB.isPreBattleOpen()) {
      const lab = screenLabel();
      if (lab) shown.push(lab);
      PB.hidePreBattle();                   // gracz rozstrzyga bieżącą bitwę
    }
  }
  return {
    queuedN, shown, clicks: clicks.length, endTurn: env.endTurnCalls.length, threwOut,
    warnedFlush: env.warns.some(w => /flush rzucił wyjątek/.test(w)),
    queueLeft: PB.hasPendingAutoPreBattle(), screenLeft: PB.isPreBattleOpen(),
  };
}

function scenarioE(PB, src) {
  resetPre(PB);
  const env = makeEnv(PB, src);
  if (!env.api.scheduleDeferredPreBattleQueueWatchdog) return { absent: true };
  orphanQueue(PB, env);
  const r = {};
  env.api.healStaleEndTurnBlockers();       // ścieżka pasywna (HUD render / canEndTurn)
  r.timers = clock.timers.map(t => t.delay);
  advanceFakeClock(49);
  r.screenAt49 = PB.isPreBattleOpen();
  r.queuedAt49 = PB.hasPendingAutoPreBattle();
  advanceFakeClock(1);
  r.screenAt50 = PB.isPreBattleOpen();
  r.titleAt50 = screenLabel();
  r.queuedAt50 = PB.hasPendingAutoPreBattle();
  r.watchdogWarn = env.warns.some(w => /watchdog/.test(w));
  r.endTurnNoClick = env.endTurnCalls.length;

  // E2: audiencja otwarta W CHWILI odpalenia -> watchdog NIE otwiera ekranu
  resetPre(PB);
  const env2 = makeEnv(PB, src);
  orphanQueue(PB, env2);
  env2.api.healStaleEndTurnBlockers();
  env2.audience = true;
  advanceFakeClock(50);
  r.e2Screen = PB.isPreBattleOpen();
  r.e2Queued = PB.hasPendingAutoPreBattle();
  env2.audience = false;
  return r;
}

// G (r6, zarzut 1): scena bitwy otwarta (preBattle zamknięty, battleUiResolving=false), bitwa
// odłożona w kolejce. Ani watchdog, ani flush-first, ani 8 s czyszczenie NIE mogą ruszyć kolejki
// na żywej scenie; po zamknięciu sceny kolejka wznawia się normalnie.
function scenarioG(PB, src) {
  resetPre(PB);
  const env = makeEnv(PB, src);
  env.battleScene = true;
  env.audience = true;
  PB.showPreBattle(battleInfo('WOJNA1'), cb(), { auto: true });   // odłożona (audiencja)
  env.audience = false;                                            // audiencja zamknięta, BEZ flusha
  const r = { queuedBefore: PB.hasPendingAutoPreBattle() };
  env.api.healStaleEndTurnBlockers();                              // pasywna ścieżka HUD
  advanceFakeClock(60);                                            // ewentualny watchdog odpala się
  r.screenLive = PB.isPreBattleOpen();
  r.queuedLive = PB.hasPendingAutoPreBattle();
  r.c1 = click(env, 'advanceSeat');
  advanceFakeClock(9000);                                          // > próg 8000 ms
  r.c2 = click(env, 'advanceSeat');
  r.screenAfterClicks = PB.isPreBattleOpen();
  r.queuedAfterClicks = PB.hasPendingAutoPreBattle();
  r.endTurn = env.endTurnCalls.length;
  env.battleScene = false;                                         // scena bitwy zamknięta
  r.c3 = click(env, 'advanceSeat');
  r.screenAfterClose = screenLabel();
  PB.hidePreBattle();                                              // gracz rozstrzyga
  r.c4 = click(env, 'advanceSeat');
  r.endAfterClose = env.endTurnCalls.length;
  return r;
}

// H (r6, zarzut 5): gameOver -- klik NIE może sprzątać/otwierać kolejki (bramka niezwiązana z kolejką).
function scenarioH(PB, src) {
  resetPre(PB);
  const env = makeEnv(PB, src);
  orphanQueue(PB, env);
  env.S.gameOver = true;
  const r = { c1: click(env, 'advanceSeat') };
  r.screen = PB.isPreBattleOpen();
  r.queued = PB.hasPendingAutoPreBattle();
  env.S.gameOver = false;
  return r;
}

async function main() {
  console.log('== endturn-battle-deadlock-exec-test (R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1 r6) ==');
  const PB = await loadPreBattle();

  // ---- A: baza origin/main (fcd86933): deadlock trwały
  console.log('\n[A] origin/main fcd86933 -- deadlock');
  console.log('    funkcje obecne w bazie: ' + buildFactory(MAIN_BASE).present.join(', '));
  const a = scenarioA(PB, MAIN_BASE);
  ok(a.queued === true && a.screen === false, '[A0] stan osierocony odtworzony: kolejka niepusta, ekranu brak');
  ok(a.c1.ended === 0 && a.c2.ended === 0, '[A1] na fcd86933 klik 1 i klik 2 NIE kończą tury (endTurn=0)');
  ok(a.c1.hint === HINT_BLOCK && a.c2.hint === HINT_BLOCK, '[A2] na fcd86933 podpowiedź: „Zakończ ekran bitwy, potem zakończ turę.”');
  ok(a.endAfter10 === 0 && a.screenAfter10 === false, '[A3] na fcd86933 po 10 kliknięciach nadal endTurn=0 i brak ekranu (deadlock trwały)');

  // ---- B: poprawka
  console.log('\n[B] poprawka: klik 1 otwiera bitwę, klik 2 kończy turę');
  const b = scenarioB(PB, MAIN_FIXED);
  ok(b.c1.ended === 0 && b.screenAfterC1 === true, '[B1] klik 1 OTWIERA ekran bitwy (flush-first) i nie kończy tury');
  ok(b.titleAfterC1 === 'WOJNA1', '[B1b] otwarty ekran to odłożona bitwa WOJNA1; got ' + b.titleAfterC1);
  ok(b.c1.hint === HINT_BLOCK, '[B1c] klik 1 pokazuje podpowiedź blokady przy otwartym ekranie');
  ok(b.c2.ended === 1 && b.endAfterC2 === 1, '[B2] po rozstrzygnięciu bitwy klik 2 KOŃCZY turę (endTurn=1)');

  // ---- C: legalna blokada
  console.log('\n[C] legalna blokada zostaje');
  const c1 = scenarioC1(PB, MAIN_FIXED);
  ok(c1.queuedBefore === true, '[C1-setup] bitwa odłożona przy otwartym ekranie');
  ok(c1.c1.ended === 0 && c1.c2.ended === 0 && c1.endTurn === 0,
    '[C1] przy OTWARTYM ekranie bitwy klik NIE kończy tury (także po 9 s fałszywego czasu)');
  ok(c1.c1.hint === HINT_BLOCK && c1.c2.hint === HINT_BLOCK, '[C1b] podpowiedź blokady zachowana przy otwartym ekranie');
  ok(c1.screenStill === 'LEGALSHOWN' && c1.queuedAfter === true, '[C1c] watchdog NIE rusza kolejki ani ekranu, gdy ekran jest otwarty');
  const c2 = scenarioC2(PB, MAIN_FIXED);
  ok(c2.c1.ended === 0 && c2.c2.ended === 0 && c2.endTurn === 0, '[C2] przy otwartej audiencji (odroczenie legalne) klik NIE kończy tury');
  ok(c2.screen === false && c2.queued === true, '[C2b] przy otwartej audiencji bitwa NIE jest pokazywana i NIE jest kasowana z kolejki');

  // ---- D: N=4, wyjątek, FIFO
  console.log('\n[D] N=4, jedna bitwa rzuca w showPreBattle');
  for (const entry of ['advanceSeat', 'triggerPlayerEndTurn']) {
    const d = scenarioD(PB, MAIN_FIXED, entry);
    ok(d.queuedN === true, `[D1 ${entry}] kolejka niepusta przed kliknięciami (4 żądania odłożone)`);
    ok(d.threwOut === false, `[D2 ${entry}] wyjątek z showPreBattle NIE wychodzi z kliknięcia`);
    ok(d.endTurn === 1 && d.clicks <= 5, `[D3 ${entry}] koniec tury po ${d.clicks} kliknięciach (≤ N+1=5)`);
    ok(JSON.stringify(d.shown) === JSON.stringify(['W0', 'W2', 'W3']),
      `[D4 ${entry}] FIFO: pokazane W0,W2,W3 (W1 odrzucona przy wyjątku); got ${JSON.stringify(d.shown)}`);
    ok(d.warnedFlush === true && d.queueLeft === false && d.screenLeft === false,
      `[D5 ${entry}] ostrzeżenie w logu, kolejka pusta, brak ducha ekranu`);
  }
  {
    const dBase = scenarioD(PB, MAIN_BASE, 'advanceSeat');
    ok(dBase.endTurn === 0, '[D-base] na fcd86933 ten sam scenariusz NIE kończy tury (kontrola: test wykrywa deadlock)');
  }

  // ---- E: watchdog 50 ms
  console.log('\n[E] watchdog 50 ms (fałszywy zegar)');
  const e = scenarioE(PB, MAIN_FIXED);
  ok(!e.absent, '[E0] watchdog obecny w main.ts');
  ok(e.timers && e.timers.length === 1 && e.timers[0] === 50,
    '[E1] po healStale z kolejką bez ekranu zaplanowany DOKŁADNIE jeden timer 50 ms; got ' + JSON.stringify(e.timers));
  ok(e.screenAt49 === false && e.queuedAt49 === true, '[E2] przed 50 ms nic się nie dzieje (kolejka czeka)');
  ok(e.screenAt50 === true && e.titleAt50 === 'WOJNA1' && e.queuedAt50 === false,
    '[E3] timer 50 ms ODPALONY bez kliknięcia: otwiera odłożoną bitwę, kolejka pusta');
  ok(e.watchdogWarn === true && e.endTurnNoClick === 0,
    '[E4] odpalenie zalogowane (console.warn watchdog), koniec tury NIE nastąpił bez kliknięcia');
  ok(e.e2Screen === false && e.e2Queued === true,
    '[E5] audiencja otwarta w chwili odpalenia -> watchdog NIE otwiera ekranu, kolejka zachowana');

  // ---- G: scena bitwy otwarta (r6, zarzut 1)
  console.log('\n[G] scena bitwy otwarta: kolejka nietknięta, brak flusha na żywej scenie');
  const g = scenarioG(PB, MAIN_FIXED);
  ok(g.queuedBefore === true, '[G0] bitwa odłożona przy otwartej scenie');
  ok(g.screenLive === false && g.queuedLive === true,
    '[G1] watchdog (50 ms) NIE pokazuje pre-bitwy na żywej scenie; kolejka zachowana');
  ok(g.c1.ended === 0 && g.c2.ended === 0 && g.endTurn === 0,
    '[G2] przy otwartej scenie klik NIE kończy tury (legalna blokada)');
  ok(g.screenAfterClicks === false && g.queuedAfterClicks === true,
    '[G3] flush-first i 8 s czyszczenie NIE ruszają kolejki przy otwartej scenie (po 9 s nadal czeka)');
  ok(g.c3.ended === 0 && g.screenAfterClose === 'WOJNA1',
    '[G4] po zamknięciu sceny kolejka wznawia się: pokazana WOJNA1');
  ok(g.c4.ended === 1 && g.endAfterClose === 1,
    '[G5] po rozstrzygnięciu bitwy koniec tury (endTurn=1)');

  // ---- H: bramka niezwiązana z kolejką (r6, zarzut 5)
  console.log('\n[H] gameOver: klik nie wywołuje flush-first');
  const h = scenarioH(PB, MAIN_FIXED);
  ok(h.c1.ended === 0 && h.screen === false && h.queued === true,
    '[H1] przy gameOver klik NIE otwiera ani nie czyści kolejki (kolejność bramek zachowana)');

  // ---- F: mutacje
  console.log('\n[F] mutacje siatki (każda musi czerwienić swój scenariusz)');
  const M1 = replaceOnce(MAIN_FIXED,
    "      if (!endTurnInProgress) flushDeferredPreBattleSafely('healStuck');",
    '      /* M1: flush-first usunięty */');
  const m1b = scenarioB(PB, M1);
  ok(!(m1b.c1.ended === 0 && m1b.screenAfterC1 === true && m1b.c2.ended === 1),
    '[F-M1] usunięcie flush-first w healStuck CZERWIENI scenariusz B (klik 1 nie otwiera bitwy)');
  const m1d = scenarioD(PB, M1, 'advanceSeat');
  ok(!(m1d.endTurn === 1 && m1d.clicks <= 5),
    '[F-M1d] usunięcie flush-first CZERWIENI też scenariusz D (bez watchdoga kolejka nie drenuje)');

  const M2 = replaceOnce(MAIN_FIXED,
    '      scheduleDeferredPreBattleQueueWatchdog();',
    '      /* M2: watchdog usunięty */');
  const m2e = scenarioE(PB, M2);
  ok(!(m2e.timers && m2e.timers.length === 1 && m2e.screenAt50 === true),
    '[F-M2] usunięcie watchdoga CZERWIENI scenariusz E (brak timera / brak otwarcia bez kliknięcia)');

  const M3 = replaceFn(MAIN_FIXED, 'function flushDeferredPreBattleSafely(where: string): void {',
    'function flushDeferredPreBattleSafely(where: string): void {\n      flushDeferredAutoPreBattle();\n    }');
  const m3d = scenarioD(PB, M3, 'advanceSeat');
  ok(m3d.threwOut === true, '[F-M3] usunięcie try/catch CZERWIENI scenariusz D (wyjątek wychodzi z kliknięcia)');

  const M4 = replaceOnce(MAIN_FIXED,
    "      if (isPreBattleOpen() || hasPendingAutoPreBattle()) {\n        console.warn('[EndTurn] blocked: preBattleOpen'",
    "      if (isPreBattleOpen()) {\n        console.warn('[EndTurn] blocked: preBattleOpen'");
  const m4c2 = scenarioC2(PB, M4);
  ok(!(m4c2.endTurn === 0 && m4c2.c1.ended === 0 && m4c2.c2.ended === 0),
    '[F-M4] osłabiona bramka (tylko isPreBattleOpen) CZERWIENI scenariusz C2 (koniec tury przy czekającej kolejce)');

  const M5 = replaceOnce(MAIN_FIXED,
    "      if (isBattleSceneOpen() || isPostBattleSummaryOpen()) return;\n      if (isPreBattleOpen()) return;",
    '      if (isPreBattleOpen()) return;');
  const m5g = scenarioG(PB, M5);
  ok(!(m5g.screenAfterClicks === false && m5g.queuedAfterClicks === true),
    '[F-M5] usunięcie bramki sceny w healStuck CZERWIENI scenariusz G (flush/clear na żywej scenie)');

  const M6 = replaceOnce(replaceOnce(MAIN_FIXED,
    '        if (isBattleSceneOpen() || isPostBattleSummaryOpen()) return;\n        if (isPreBattleOpen()',
    '        if (isPreBattleOpen()'),
    "      if (isBattleSceneOpen() || isPostBattleSummaryOpen()) return; // r6, zarzut 1 (patrz watchdog)\n", '');
  const m6g = scenarioG(PB, M6);
  ok(!(m6g.screenLive === false && m6g.queuedLive === true),
    '[F-M6] usunięcie bramki sceny w watchdogu CZERWIENI scenariusz G (pre-bitwa na żywej scenie)');

  const M7 = replaceOnce(MAIN_FIXED,
    '      if (!playtestWalkaActive && !isAwaitingFirstPlayerCity() && !galleryOn && !gameOver) {',
    '      if (true) {');
  const m7h = scenarioH(PB, M7);
  ok(!(m7h.screen === false && m7h.queued === true),
    '[F-M7] heal bez bramek niezwiązanych z kolejką CZERWIENI scenariusz H (flush przy gameOver)');

  // sprzątanie
  resetPre(PB);
  Date.now = realDateNow;
  for (const p of CLEANUP) { try { fs.unlinkSync(p); } catch { /* ignore */ } }
  try { fs.rmdirSync(TMP); } catch { /* ignore */ }

  console.log(`\nendturn-battle-deadlock-exec-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
