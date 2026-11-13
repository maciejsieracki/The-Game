'use strict';
/**
 * muzyka-braz-era-playlist-test.cjs — R-MUZYKA-BRAZ-23-UTWORY-Q1, zaktualizowany w
 * R-WEB-MUSIC-ERA-CUMULATIVE-PLAYLIST-Q1 (muzyka kumulatywna po epokach).
 *
 * Realna egzekucja (nie regex-nad-tekstem) funkcji z `gra/src/audio/muzyka-antyczna.ts`:
 * `activeFilePlaylist`, `usesFilePlayer`, `setEra`. Wyodrębnia dokładny tekst tych funkcji
 * ze źródła (kotwice), wykonuje go w izolowanym kontekście z atrapami playlisty/silnika
 * syntezy (rejestrującymi wywołania), bez reimplementacji logiki.
 *
 * MODEL KUMULATYWNY: jedna playlista gry `eraMusicPlaylist`; pula rośnie z epoką przez
 * setEraMusicTier(): kamień -> +brąz -> +żelazo. Awans NIE zatrzymuje grającego utworu.
 *
 * Pokrycie:
 *  A. activeFilePlaylist(dowolna era) === eraMusicPlaylist; B. usesFilePlayer = hasTracks puli.
 *  C. setEra(1->2, 2->3, 1->3) przy grającej muzyce: setEraMusicTier(tier) wołane raz,
 *     playlista NIE jest stop()/start()-owana, zero syntezy (utwór dogrywa się).
 *  C'. Obniżenie (2->1, 3->1, 3->2; wczytanie zapisu): pula zawężona, też bez stop()/start().
 *  D. plik -> synteza (pula nowej epoki pusta); E. synteza -> plik (pula niepusta);
 *  F. oba w syntezie: respawn tylko gdy zmienia się era syntezy (1<->2), nie przy 2->3.
 *  G. playing=false: tylko zapamiętanie tieru i synchronizacja puli, zero efektu dźwiękowego.
 *  H. ta sama epoka = no-op; era>=3 -> tier 3, era<=1 -> tier 1.
 *
 * Bramka (z katalogu gra/): node tools/muzyka-braz-era-playlist-test.cjs
 */

const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'audio', 'muzyka-antyczna.ts'),
  'utf8',
);

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

// Strip prostych adnotacji typów TS, żeby wykonać jako zwykły JS (usuwa TYLKO adnotacje).
function stripTypes(tsSrc) {
  return tsSrc
    .replace(/export function/g, 'function')
    .replace(/:\s*Era\b/g, '')
    .replace(/:\s*void\b/g, '')
    .replace(/:\s*boolean\b/g, '')
    .replace(/:\s*number\b/g, '')
    .replace(/:\s*FilePlaylist\b/g, '')
    .replace(/const prevEra = eraNow;/g, 'const prevEra = eraNow;')
    .replace(/\s+as unknown as \{[^}]*\}/gs, '')
    .replace(/:\s*typeof AudioContext\b/g, '');
}

function extractFn(signatureAnchor) {
  const idx = SRC.indexOf(signatureAnchor);
  if (idx === -1) throw new Error(`sygnatura nie znaleziona: ${signatureAnchor}`);
  const closeIdx = SRC.indexOf('\n}\n', idx);
  if (closeIdx === -1) throw new Error(`koniec funkcji nie znaleziony dla: ${signatureAnchor}`);
  return stripTypes(SRC.slice(idx, closeIdx + 2));
}

const fnActiveFilePlaylist = extractFn('function activeFilePlaylist(_era: Era): FilePlaylist {');
const fnUsesFilePlayer = extractFn('function usesFilePlayer(era: Era): boolean {');
const fnSetEra = extractFn('export function setEra(era: number): void {');

assert('activeFilePlaylist wyodrębniona ze źródła', fnActiveFilePlaylist.includes('return eraMusicPlaylist;'));
assert('usesFilePlayer wyodrębniona ze źródła', fnUsesFilePlayer.includes('activeFilePlaylist(era).hasTracks()'));
assert('setEra wyodrębniona ze źródła (gałąź plik->plik)', fnSetEra.includes('plik -> plik'));

// Atrapa puli kumulatywnej: hasTracks zależy od aktualnego tieru (jak realna eraTierUrls).
// poolByTier: [bool tier1, bool tier2, bool tier3]
function makeMockPlaylist(poolByTier, state) {
  const calls = [];
  return {
    calls,
    hasTracks: () => poolByTier[state.tier - 1],
    stop: () => calls.push('stop'),
    start: () => calls.push('start'),
    setVolume: (v) => calls.push('setVolume:' + v),
  };
}

function runScenario({ tierStart, playing, poolByTier, setEraArg, preEngines }) {
  const state = { tier: tierStart };
  const eraMusicPlaylist = makeMockPlaylist(poolByTier, state);
  const tierCalls = [];
  const setEraMusicTier = (t) => { tierCalls.push(t); state.tier = t; };
  const spawnEngineCalls = [];
  const respawnCalls = [];
  const engineDisposeCalls = [];
  const fn = new Function(
    'eraMusicPlaylist', 'setEraMusicTier', 'eraNow0', 'tierNow0', 'playing0', 'engines0', 'moodNow0',
    'volume0', 'ctx0', 'graf0', 'ERA_XFADE', 'spawnEngine', 'respawn',
    `
    let eraNow = eraNow0, tierNow = tierNow0, playing = playing0, engines = engines0, moodNow = moodNow0,
        volume = volume0, ctx = ctx0, graf = graf0;
    ${fnActiveFilePlaylist}
    ${fnUsesFilePlayer}
    ${fnSetEra}
    setEra(${setEraArg});
    return { eraNow, tierNow, playing };
    `,
  );
  const result = fn(
    eraMusicPlaylist, setEraMusicTier, tierStart >= 2 ? 2 : 1, tierStart, playing,
    (preEngines || []).map(() => ({ fadeOutAndDispose: (fade) => engineDisposeCalls.push(fade) })),
    'mapa', 0.8, { state: 'running', resume: () => {} }, {}, 6.0,
    (era, mood, fade) => spawnEngineCalls.push({ era, mood, fade }),
    (fade) => respawnCalls.push(fade),
  );
  return { result, eraMusicPlaylist, tierCalls, spawnEngineCalls, respawnCalls, engineDisposeCalls };
}

const ALL = [true, true, true];

// --- A/B: routing ---
{
  const state = { tier: 1 };
  const pl = makeMockPlaylist([true, false, false], state);
  const fn = new Function('eraMusicPlaylist', `
    ${fnActiveFilePlaylist}
    ${fnUsesFilePlayer}
    return { a1: activeFilePlaylist(1) === eraMusicPlaylist, a2: activeFilePlaylist(2) === eraMusicPlaylist,
             u1: usesFilePlayer(1), u2: usesFilePlayer(2) };
  `);
  const r = fn(pl);
  assert('A. activeFilePlaylist(1) === eraMusicPlaylist', r.a1);
  assert('A. activeFilePlaylist(2) === eraMusicPlaylist (jedna wspólna pula)', r.a2);
  assert('B. usesFilePlayer odzwierciedla hasTracks() puli (tier 1 niepusty)', r.u1 === true && r.u2 === true, r);
}

// --- C: awans, muzyka gra: pula rośnie, NIC się nie zatrzymuje ---
for (const [from, to] of [[1, 2], [2, 3], [1, 3]]) {
  const { result, eraMusicPlaylist, tierCalls, spawnEngineCalls, respawnCalls } = runScenario({
    tierStart: from, playing: true, poolByTier: ALL, setEraArg: to,
  });
  const L = `C(${from}->${to}).`;
  assert(L + ' tier muzyki = ' + to, result.tierNow === to, result);
  assert(L + ' setEraMusicTier(' + to + ') wołane dokładnie raz', tierCalls.length === 1 && tierCalls[0] === to, tierCalls);
  assert(L + ' playlista NIE zatrzymana ani restartowana (grający utwór dogrywa się)', eraMusicPlaylist.calls.length === 0, eraMusicPlaylist.calls);
  assert(L + ' zero syntezy', spawnEngineCalls.length === 0 && respawnCalls.length === 0, { spawnEngineCalls, respawnCalls });
}

// --- C': obniżenie epoki (wczytanie zapisu): pula zawężona, też bez stop/start ---
for (const [from, to] of [[2, 1], [3, 1], [3, 2]]) {
  const { result, eraMusicPlaylist, tierCalls, spawnEngineCalls, respawnCalls } = runScenario({
    tierStart: from, playing: true, poolByTier: ALL, setEraArg: to,
  });
  const L = `C'(${from}->${to}).`;
  assert(L + ' tier muzyki = ' + to, result.tierNow === to, result);
  assert(L + ' setEraMusicTier(' + to + ') wołane', tierCalls.length === 1 && tierCalls[0] === to, tierCalls);
  assert(L + ' playlista nietknięta (stan się nie psuje)', eraMusicPlaylist.calls.length === 0 && spawnEngineCalls.length === 0 && respawnCalls.length === 0, eraMusicPlaylist.calls);
}

// --- D: plik -> synteza (pula nowej epoki pusta) ---
{
  const { result, eraMusicPlaylist, spawnEngineCalls } = runScenario({
    tierStart: 2, playing: true, poolByTier: [true, true, false], setEraArg: 3,
  });
  assert('D. era syntezy 2', result.eraNow === 2, result);
  assert('D. playlista stop() wołana', eraMusicPlaylist.calls.includes('stop'), eraMusicPlaylist.calls);
  assert('D. spawnEngine(2, mapa, ERA_XFADE)', spawnEngineCalls.length === 1 && spawnEngineCalls[0].era === 2 && spawnEngineCalls[0].fade === 6.0, spawnEngineCalls);
}

// --- E: synteza (pusty kamień) -> plik (brąz niepusty) ---
{
  const { result, eraMusicPlaylist, engineDisposeCalls } = runScenario({
    tierStart: 1, playing: true, poolByTier: [false, true, true], setEraArg: 2, preEngines: [1, 2],
  });
  assert('E. tier 2', result.tierNow === 2, result);
  assert('E. 2 silniki fadeOutAndDispose(ERA_XFADE)', engineDisposeCalls.length === 2 && engineDisposeCalls.every((f) => f === 6.0), engineDisposeCalls);
  assert('E. playlista setVolume+start', eraMusicPlaylist.calls.includes('setVolume:0.8') && eraMusicPlaylist.calls.includes('start'), eraMusicPlaylist.calls);
}

// --- F: oba w syntezie ---
{
  const a = runScenario({ tierStart: 1, playing: true, poolByTier: [false, false, false], setEraArg: 2 });
  assert('F. 1->2 (era syntezy się zmienia): respawn(ERA_XFADE)', a.respawnCalls.length === 1 && a.respawnCalls[0] === 6.0, a.respawnCalls);
  assert('F. playlista nietknięta', a.eraMusicPlaylist.calls.length === 0, a.eraMusicPlaylist.calls);
  const b = runScenario({ tierStart: 2, playing: true, poolByTier: [false, false, false], setEraArg: 3 });
  assert('F. 2->3 (era syntezy ta sama = 2): BEZ respawn', b.respawnCalls.length === 0 && b.spawnEngineCalls.length === 0, b);
}

// --- G: playing=false ---
{
  const { result, eraMusicPlaylist, tierCalls, spawnEngineCalls, respawnCalls } = runScenario({
    tierStart: 1, playing: false, poolByTier: ALL, setEraArg: 3,
  });
  assert('G. tier zapamiętany jako 3', result.tierNow === 3, result);
  assert('G. pula zsynchronizowana mimo braku muzyki (setEraMusicTier(3))', tierCalls.length === 1 && tierCalls[0] === 3, tierCalls);
  assert('G. zero wywołań playlisty/silnika', eraMusicPlaylist.calls.length === 0 && spawnEngineCalls.length === 0 && respawnCalls.length === 0);
}

// --- H: ta sama epoka = no-op; przycinanie argumentu ---
{
  const same = runScenario({ tierStart: 2, playing: true, poolByTier: ALL, setEraArg: 2 });
  assert('H. setEra(tej samej) = no-op', same.tierCalls.length === 0 && same.eraMusicPlaylist.calls.length === 0, same);
  const hi = runScenario({ tierStart: 1, playing: false, poolByTier: ALL, setEraArg: 7 });
  assert('H. setEra(7) -> tier 3', hi.result.tierNow === 3, hi.result);
  const lo = runScenario({ tierStart: 3, playing: false, poolByTier: ALL, setEraArg: 0 });
  assert('H. setEra(0) -> tier 1', lo.result.tierNow === 1, lo.result);
}

console.log('');
console.log('='.repeat(72));
console.log(`muzyka-braz-era-playlist-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
