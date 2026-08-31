'use strict';
/**
 * muzyka-braz-era-playlist-test.cjs — R-MUZYKA-BRAZ-23-UTWORY-Q1
 *
 * Realna egzekucja (nie regex-nad-tekstem) trzech funkcji dodanych/zmienionych w
 * `gra/src/audio/muzyka-antyczna.ts` przy wpięciu playlisty plikowej Brązu obok
 * już istniejącej playlisty Kamienia: `activeFilePlaylist`, `usesFilePlayer`,
 * `setEra`. Wyodrębnia dokładny tekst tych funkcji ze źródła (regex po
 * niepowtarzalnych kotwicach), wykonuje go w izolowanym kontekście z atrapami
 * playlist/silnika syntezy (rejestrującymi wywołania), bez reimplementacji
 * formuły.
 *
 * Pokrycie:
 *  A. activeFilePlaylist(1)===kamień, activeFilePlaylist(2)===brąz.
 *  B. usesFilePlayer(era) odzwierciedla realny .hasTracks() właściwej playlisty.
 *  C. setEra(): playlista plikowa -> INNA playlista plikowa (kamień<->brąz,
 *     oba katalogi mają utwory) — poprzednia .stop(), następna .setVolume()+.start(),
 *     ZERO wywołań spawnEngine/respawn (nowa gałąź tego tematu).
 *  C'. Lustrzany kierunek C: brąz -> kamień (ta sama gałąź plik->plik), dodane
 *     R-MUZYKA-ERA-LIVE-E2E-Q1 po retro-audycie P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1
 *     (Zarzut #2) — scenariusz C testował WYŁĄCZNIE kamień(1)->brąz(2).
 *  D. setEra(): playlista plikowa -> synteza (fallback, gdy katalog docelowy
 *     pusty — "rozłącz, nie kasuj") — spawnEngine wołane, cel .start() NIE.
 *  E. setEra(): synteza -> playlista plikowa — engines czyszczone (fadeOut),
 *     docelowa playlista .setVolume()+.start().
 *  F. setEra(): oba w syntezie — respawn() wołane, żadna playlista nietknięta.
 *  G. setEra() z playing=false: tylko zapamiętuje epokę, zero efektu dźwiękowego.
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

// Strip proste adnotacje typów TS, żeby dało się to wykonać jako zwykły JS
// (ten sam trik co praca-auto-ulepszenia-koszt-split-test.cjs — usuwa TYLKO
// adnotacje parametrów/zwrotu, nie dotyka logiki).
function stripTypes(tsSrc) {
  return tsSrc
    .replace(/export function/g, 'function')
    .replace(/:\s*Era\b/g, '')
    .replace(/:\s*void\b/g, '')
    .replace(/:\s*boolean\b/g, '')
    .replace(/:\s*number\b/g, '')
    .replace(/:\s*FilePlaylist\b/g, '')
    .replace(/const e: Era/g, 'const e')
    .replace(/\s+as unknown as \{[^}]*\}/gs, '')
    .replace(/:\s*typeof AudioContext\b/g, '');
}

// Kotwiczymy się o
// unikalne nazwy funkcji i pierwszy `\n}\n` po nich (płaskie funkcje, bez
// zagnieżdżonych `}\n` na początku linii wewnątrz).
function extractFn(signatureAnchor) {
  const idx = SRC.indexOf(signatureAnchor);
  if (idx === -1) throw new Error(`sygnatura nie znaleziona: ${signatureAnchor}`);
  const closeIdx = SRC.indexOf('\n}\n', idx);
  if (closeIdx === -1) throw new Error(`koniec funkcji nie znaleziony dla: ${signatureAnchor}`);
  return stripTypes(SRC.slice(idx, closeIdx + 2));
}

const fnActiveFilePlaylist = extractFn('function activeFilePlaylist(era: Era): FilePlaylist {');
const fnUsesFilePlayer = extractFn('function usesFilePlayer(era: Era): boolean {');
const fnSetEra = extractFn('export function setEra(era: number): void {');

assert('activeFilePlaylist wyodrębniona ze źródła', fnActiveFilePlaylist.includes('era === 1 ? kamienPlaylist : brazPlaylist'));
assert('usesFilePlayer wyodrębniona ze źródła', fnUsesFilePlayer.includes('activeFilePlaylist(era).hasTracks()'));
assert('setEra wyodrębniona ze źródła (nowa gałąź plik->plik)', fnSetEra.includes('playlista plikowa -> INNA playlista plikowa'));

function makeMockPlaylist(hasTracksVal) {
  const calls = [];
  return {
    calls,
    hasTracks: () => hasTracksVal,
    stop: () => calls.push('stop'),
    start: () => calls.push('start'),
    setVolume: (v) => calls.push('setVolume:' + v),
  };
}

function runScenario({ eraStart, playing, kamienHasTracks, brazHasTracks, setEraArg, preEngines }) {
  const kamienPlaylist = makeMockPlaylist(kamienHasTracks);
  const brazPlaylist = makeMockPlaylist(brazHasTracks);
  const spawnEngineCalls = [];
  const respawnCalls = [];
  const engineDisposeCalls = [];
  const sandbox = {
    kamienPlaylist, brazPlaylist,
    eraNow: eraStart,
    playing,
    engines: (preEngines || []).map(() => ({ fadeOutAndDispose: (fade) => engineDisposeCalls.push(fade) })),
    moodNow: 'mapa',
    volume: 0.8,
    ctx: { state: 'running', resume: () => {} }, // niepusty -> pomija gałąź inicjalizacji AudioContext/window
    graf: {},
    ERA_XFADE: 6.0,
    spawnEngine: (era, mood, fade) => spawnEngineCalls.push({ era, mood, fade }),
    respawn: (fade) => respawnCalls.push(fade),
  };
  const harnessSrc = `
    ${fnActiveFilePlaylist}
    ${fnUsesFilePlayer}
    ${fnSetEra}
    setEra(${setEraArg});
    return { eraNow, playing };
  `;
  const fn = new Function(
    'kamienPlaylist', 'brazPlaylist', 'eraNow0', 'playing0', 'engines0', 'moodNow0',
    'volume0', 'ctx0', 'graf0', 'ERA_XFADE', 'spawnEngine', 'respawn',
    `
    let eraNow = eraNow0, playing = playing0, engines = engines0, moodNow = moodNow0,
        volume = volume0, ctx = ctx0, graf = graf0;
    ${harnessSrc}
    `,
  );
  const result = fn(
    kamienPlaylist, brazPlaylist, sandbox.eraNow, sandbox.playing, sandbox.engines, sandbox.moodNow,
    sandbox.volume, sandbox.ctx, sandbox.graf, sandbox.ERA_XFADE, sandbox.spawnEngine, sandbox.respawn,
  );
  return { result, kamienPlaylist, brazPlaylist, spawnEngineCalls, respawnCalls, engineDisposeCalls };
}

// --- A/B: routing czysty (bez setEra) ---
{
  const kamienPlaylist = makeMockPlaylist(true);
  const brazPlaylist = makeMockPlaylist(false);
  const fn = new Function('kamienPlaylist', 'brazPlaylist', `
    ${fnActiveFilePlaylist}
    ${fnUsesFilePlayer}
    return {
      active1: activeFilePlaylist(1) === kamienPlaylist,
      active2: activeFilePlaylist(2) === brazPlaylist,
      uses1: usesFilePlayer(1),
      uses2: usesFilePlayer(2),
    };
  `);
  const r = fn(kamienPlaylist, brazPlaylist);
  assert('A. activeFilePlaylist(1) === kamień', r.active1);
  assert('A. activeFilePlaylist(2) === brąz', r.active2);
  assert('B. usesFilePlayer(1) odzwierciedla kamien.hasTracks()===true', r.uses1 === true, r);
  assert('B. usesFilePlayer(2) odzwierciedla braz.hasTracks()===false', r.uses2 === false, r);
}

// --- C: plik -> INNY plik (kamień<->brąz), oba katalogi mają utwory ---
{
  const { result, kamienPlaylist, brazPlaylist, spawnEngineCalls, respawnCalls } = runScenario({
    eraStart: 1, playing: true, kamienHasTracks: true, brazHasTracks: true, setEraArg: 2,
  });
  assert('C. era faktycznie 2 po setEra(2)', result.eraNow === 2, result);
  assert('C. kamień.stop() wołane', kamienPlaylist.calls.includes('stop'), kamienPlaylist.calls);
  assert('C. kamień.start() NIE wołane', !kamienPlaylist.calls.includes('start'), kamienPlaylist.calls);
  assert('C. brąz.setVolume+start wołane', brazPlaylist.calls.includes('setVolume:0.8') && brazPlaylist.calls.includes('start'), brazPlaylist.calls);
  assert('C. ZERO spawnEngine (nie ma syntezy w tym przejściu)', spawnEngineCalls.length === 0, spawnEngineCalls);
  assert('C. ZERO respawn (nie ma syntezy w tym przejściu)', respawnCalls.length === 0, respawnCalls);
}

// --- C': plik -> INNY plik, lustrzany kierunek (brąz -> kamień), oba katalogi
// mają utwory. Ta sama gałąź kodu co C ("playlista plikowa -> INNA playlista
// plikowa"), dotąd niepokryta w tym kierunku (P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1
// Zarzut #2) ---
{
  const { result, kamienPlaylist, brazPlaylist, spawnEngineCalls, respawnCalls } = runScenario({
    eraStart: 2, playing: true, kamienHasTracks: true, brazHasTracks: true, setEraArg: 1,
  });
  assert("C'. era faktycznie 1 po setEra(1)", result.eraNow === 1, result);
  assert("C'. brąz.stop() wołane", brazPlaylist.calls.includes('stop'), brazPlaylist.calls);
  assert("C'. brąz.start() NIE wołane", !brazPlaylist.calls.includes('start'), brazPlaylist.calls);
  assert("C'. kamień.setVolume+start wołane", kamienPlaylist.calls.includes('setVolume:0.8') && kamienPlaylist.calls.includes('start'), kamienPlaylist.calls);
  assert("C'. ZERO spawnEngine (nie ma syntezy w tym przejściu)", spawnEngineCalls.length === 0, spawnEngineCalls);
  assert("C'. ZERO respawn (nie ma syntezy w tym przejściu)", respawnCalls.length === 0, respawnCalls);
}

// --- D: plik -> synteza (fallback, katalog docelowy pusty) ---
{
  const { result, kamienPlaylist, brazPlaylist, spawnEngineCalls } = runScenario({
    eraStart: 1, playing: true, kamienHasTracks: true, brazHasTracks: false, setEraArg: 2,
  });
  assert('D. era faktycznie 2', result.eraNow === 2, result);
  assert('D. kamień.stop() wołane', kamienPlaylist.calls.includes('stop'), kamienPlaylist.calls);
  assert('D. brąz.start() NIE wołane (pusty katalog -> fallback synteza)', !brazPlaylist.calls.includes('start'), brazPlaylist.calls);
  assert('D. spawnEngine(2, mapa, ERA_XFADE) wołane', spawnEngineCalls.length === 1 && spawnEngineCalls[0].era === 2 && spawnEngineCalls[0].fade === 6.0, spawnEngineCalls);
}

// --- E: synteza -> plik (dokładając zaangażowane silniki syntezy) ---
{
  const { result, kamienPlaylist, engineDisposeCalls } = runScenario({
    eraStart: 2, playing: true, kamienHasTracks: true, brazHasTracks: false, setEraArg: 1, preEngines: [1, 2],
  });
  assert('E. era faktycznie 1', result.eraNow === 1, result);
  assert('E. 2 silniki syntezy dostały fadeOutAndDispose(ERA_XFADE)', engineDisposeCalls.length === 2 && engineDisposeCalls.every((f) => f === 6.0), engineDisposeCalls);
  assert('E. kamień.setVolume+start wołane', kamienPlaylist.calls.includes('setVolume:0.8') && kamienPlaylist.calls.includes('start'), kamienPlaylist.calls);
}

// --- F: oba w syntezie (żaden katalog nie ma utworów) ---
{
  const { result, kamienPlaylist, brazPlaylist, respawnCalls, spawnEngineCalls } = runScenario({
    eraStart: 1, playing: true, kamienHasTracks: false, brazHasTracks: false, setEraArg: 2,
  });
  assert('F. era faktycznie 2', result.eraNow === 2, result);
  assert('F. respawn(ERA_XFADE) wołane', respawnCalls.length === 1 && respawnCalls[0] === 6.0, respawnCalls);
  assert('F. żadna playlista plikowa nietknięta', kamienPlaylist.calls.length === 0 && brazPlaylist.calls.length === 0, { kamienPlaylist: kamienPlaylist.calls, brazPlaylist: brazPlaylist.calls });
  assert('F. spawnEngine NIE wołane (respawn zajmuje się tym sam)', spawnEngineCalls.length === 0, spawnEngineCalls);
}

// --- G: playing=false -> tylko zapamiętanie epoki, zero efektu dźwiękowego ---
{
  const { result, kamienPlaylist, brazPlaylist, spawnEngineCalls, respawnCalls } = runScenario({
    eraStart: 1, playing: false, kamienHasTracks: true, brazHasTracks: true, setEraArg: 2,
  });
  assert('G. era zapamiętana jako 2', result.eraNow === 2, result);
  assert('G. zero wywołań playlist/silnika', kamienPlaylist.calls.length === 0 && brazPlaylist.calls.length === 0 && spawnEngineCalls.length === 0 && respawnCalls.length === 0);
}

console.log('');
console.log('='.repeat(72));
console.log(`muzyka-braz-era-playlist-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
