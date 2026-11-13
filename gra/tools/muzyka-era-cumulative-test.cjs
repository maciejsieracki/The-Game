'use strict';
/**
 * muzyka-era-cumulative-test.cjs — R-WEB-MUSIC-ERA-CUMULATIVE-PLAYLIST-Q1
 *
 * Realna egzekucja PRAWDZIWEGO kodu `src/audio/filePlayer.ts` (createPlaylist, eraTierUrls,
 * setEraMusicTier, setTracks) po transpilacji TypeScript -> CJS, z atrapami: import.meta.glob
 * (katalogi utwory/*), window (ręcznie sterowane timery), Audio (<audio>), performance.
 * Zero reimplementacji logiki — testowany jest ten sam moduł, który idzie do gry.
 *
 * Pokrycie:
 *  (a) pula epoki 1 = tylko kamień;
 *  (b) epoka 2 = kamień ∪ brąz, bez duplikatów, grający utwór NIE jest przerwany ani utracony;
 *  (c) epoka 3 bez katalogu żelaza = kamień ∪ brąz; gdy żelazo istnieje = kamień ∪ brąz ∪ żelazo;
 *  (d) awans w trakcie utworu nie zatrzymuje go (zero pause(), ten sam src, ta sama pozycja);
 *  (e) setEraMusicTier(1) po wcześniejszej późniejszej epoce (wczytanie zapisu) nie psuje stanu:
 *      grający utwór dogrywa się, potem gra tylko pula kamienia;
 *  (f) nowe utwory dołączają do shuffle bieżącej tury (wszystkie zagrane w tej turze);
 *  (g) przed startem: zmiana tieru nie tworzy elementów audio, start gra z nowej puli.
 *
 * Bramka (z katalogu gra/): node tools/muzyka-era-cumulative-test.cjs
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

const SRC_PATH = path.join(__dirname, '..', 'src', 'audio', 'filePlayer.ts');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');

/** Buduje świeży moduł filePlayer z zadanym zestawem plików per katalog. */
function loadModule(dirs) {
  let code = SRC
    .replace(/^import civMusicManifest[^\n]*\n/m, 'const civMusicManifest = {};\n')
    .replace(/^import \{ resolveCivDiplomacyTracks \}[^\n]*\n/m, 'const resolveCivDiplomacyTracks = () => [];\n')
    .replace(/^import type [^\n]*\n/gm, '')
    .replace(/import\.meta\.glob\(\s*'\.\/utwory\/([^']*)'[\s\S]*?\}\)/g, (_m, g) => `__glob(${JSON.stringify(g)})`);
  const js = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  const clock = { t: 0 };
  const timers = new Map();
  let nextTimer = 1;
  const win = {
    setInterval: (fn) => { const id = nextTimer++; timers.set(id, fn); return id; },
    clearInterval: (id) => { timers.delete(id); },
  };
  const audios = [];
  class FakeAudio {
    constructor() {
      this.src = ''; this.currentTime = 0; this.duration = NaN; this.volume = 0;
      this.paused = true; this.pauseCount = 0; this.preload = '';
      this.listeners = {};
      audios.push(this);
    }
    addEventListener(n, f) { this.listeners[n] = f; }
    removeEventListener(n) { delete this.listeners[n]; }
    removeAttribute() { this.src = ''; }
    load() {}
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; this.pauseCount++; }
  }
  function __glob(g) {
    // g np. 'kamien/*.mp3' albo 'dyplomacja/*/*.mp3'
    const m = /^([a-z_]+)\/\*\.mp3$/.exec(g);
    const out = {};
    if (m && dirs[m[1]]) for (const f of dirs[m[1]]) out[`./utwory/${m[1]}/${f}.mp3`] = `url:${m[1]}/${f}`;
    return out;
  }
  const mod = { exports: {} };
  const ctx = vm.createContext({
    module: mod, exports: mod.exports, window: win, Audio: FakeAudio, __glob,
    performance: { now: () => clock.t }, Math, Array, Set, Map, Number, Promise, console,
  });
  vm.runInContext(js, ctx);
  return {
    m: mod.exports, audios,
    tickAll: () => { for (const f of [...timers.values()]) f(); },
    advance: (ms) => { clock.t += ms; for (const f of [...timers.values()]) f(); },
  };
}

const sorted = (a) => a.slice().sort();
const setEq = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const KAM = ['k1', 'k2', 'k3'].map((x) => `url:kamien/${x}`);
const BRA = ['b1', 'b2'].map((x) => `url:braz/${x}`);
const ZEL = ['z1'].map((x) => `url:zelazo/${x}`);
const dirsNoIron = { kamien: ['k1', 'k2', 'k3'], braz: ['b1', 'b2'] };
const dirsIron = { ...dirsNoIron, zelazo: ['z1'] };

// ---- (a)(b)(c): pule per epoka
{
  const { m } = loadModule(dirsNoIron);
  assert('(a) tier 1 = tylko kamień', setEq(m.eraTierUrls(1), KAM), m.eraTierUrls(1));
  assert('(b) tier 2 = kamień ∪ brąz', setEq(m.eraTierUrls(2), [...KAM, ...BRA]), m.eraTierUrls(2));
  assert('(b) tier 2 bez duplikatów', new Set(m.eraTierUrls(2)).size === m.eraTierUrls(2).length);
  assert('(c) tier 3 bez katalogu żelaza = kamień ∪ brąz', setEq(m.eraTierUrls(3), [...KAM, ...BRA]), m.eraTierUrls(3));
  assert('(a) startowa pula playlisty = tier 1', setEq(m.eraMusicPlaylist.getTracks(), KAM), m.eraMusicPlaylist.getTracks());
}
{
  const { m } = loadModule(dirsIron);
  assert('(c) tier 3 z żelazem = kamień ∪ brąz ∪ żelazo', setEq(m.eraTierUrls(3), [...KAM, ...BRA, ...ZEL]), m.eraTierUrls(3));
  assert('(c) tier 2 NIE zawiera żelaza', setEq(m.eraTierUrls(2), [...KAM, ...BRA]), m.eraTierUrls(2));
}
{
  const { m } = loadModule({ ...dirsNoIron, kamien: [] });
  assert('kamień pusty + brąz: tier 1 pusta (synteza), tier 2 niepusta', m.eraTierUrls(1).length === 0 && m.eraTierUrls(2).length === 2);
}

// ---- (d)(b): awans w trakcie utworu
{
  const { m, audios, tickAll } = loadModule(dirsNoIron);
  const pl = m.eraMusicPlaylist;
  pl.setVolume(0.8);
  pl.start();
  const el0 = audios[0];
  const playingSrc = el0.src;
  el0.duration = 30; el0.currentTime = 10;
  tickAll();
  m.setEraMusicTier(2);
  assert('(d) po awansie 1->2 ten sam <audio> nadal gra ten sam utwór', el0.src === playingSrc && !el0.paused && el0.pauseCount === 0, { src: el0.src, paused: el0.paused });
  assert('(d) pozycja utworu nietknięta', el0.currentTime === 10);
  assert('(d) playlista nadal isPlaying()', pl.isPlaying() === true);
  assert('(b) pula po awansie = kamień ∪ brąz', setEq(pl.getTracks(), [...KAM, ...BRA]), pl.getTracks());
  m.setEraMusicTier(3);
  assert('(d) po awansie 2->3 bez przerwy', !el0.paused && el0.pauseCount === 0 && el0.src === playingSrc);
  assert('(c) pula tier 3 (bez żelaza) = kamień ∪ brąz', setEq(pl.getTracks(), [...KAM, ...BRA]));
}

// ---- (f): nowe utwory wchodzą do bieżącej tury shuffle
{
  let ok = true; let detail = null;
  for (let trial = 0; trial < 30 && ok; trial++) {
    const { m, audios, tickAll, advance } = loadModule(dirsNoIron);
    const pl = m.eraMusicPlaylist;
    pl.start();
    m.setEraMusicTier(2);
    // Przejdź przez całą turę: 5 utworów x 3 powtórzenia = 15 odtworzeń.
    const seen = new Set();
    for (let step = 0; step < 15; step++) {
      // znajdź aktywny: ostatnio odtwarzany
      const active = audios.filter((a) => !a.paused && a.src).pop() || null;
      if (!active) { ok = false; detail = { step, why: 'brak aktywnego' }; break; }
      seen.add(active.src);
      active.duration = 30; active.currentTime = 29; // <= fadeDur do końca -> crossfade
      tickAll();
      // domknij crossfade: sztucznie przesuń czas, wywołując kroki rampy
      advance(2000); advance(100);
    }
    if (ok && seen.size !== 5) { ok = false; detail = { seen: [...seen] }; }
  }
  assert('(f) wszystkie 5 utworów (kamień+brąz) zagrane w pierwszej turze po awansie przed startem pętli', ok, detail);
}

// ---- (e): obniżenie epoki po wczytaniu zapisu
{
  const { m, audios, tickAll, advance } = loadModule(dirsNoIron);
  const pl = m.eraMusicPlaylist;
  m.setEraMusicTier(3);          // zapis z epoką późniejszą
  pl.start();
  const el0 = audios[0];
  const playingSrc = el0.src;
  m.setEraMusicTier(1);          // setEra(1) — np. nowa gra po wczytaniu
  assert('(e) obniżenie epoki nie przerywa grającego utworu', !el0.paused && el0.pauseCount === 0 && el0.src === playingSrc);
  assert('(e) pula zawężona do kamienia', setEq(pl.getTracks(), KAM), pl.getTracks());
  // Dograj do końca: kolejne utwory muszą pochodzić z puli kamienia
  let bad = null;
  for (let step = 0; step < 12; step++) {
    const active = audios.filter((a) => !a.paused && a.src).pop() || null;
    if (!active) { bad = { step, why: 'brak aktywnego' }; break; }
    if (step > 0 || playingSrc.startsWith('url:kamien')) {
      if (!active.src.startsWith('url:kamien') && active.src !== playingSrc) { bad = { step, src: active.src }; break; }
    }
    active.duration = 30; active.currentTime = 29;
    tickAll();
    advance(2000); advance(100);
  }
  assert('(e) po obniżeniu kolejne utwory tylko z puli kamienia (brak utraty stanu / wyjątków)', bad === null, bad);
}
{
  // Grający utwór BRĄZU wypada z puli po obniżeniu — dogrywa się, potem tylko kamień
  const { m, audios, tickAll } = loadModule({ kamien: ['k1', 'k2', 'k3'], braz: ['b1'] });
  const pl = m.eraMusicPlaylist;
  m.setEraMusicTier(2);
  let bPlayed = false;
  for (let attempt = 0; attempt < 40 && !bPlayed; attempt++) {
    const L = loadModule({ kamien: ['k1', 'k2', 'k3'], braz: ['b1'] });
    L.m.setEraMusicTier(2); L.m.eraMusicPlaylist.start();
    if (L.audios[0].src === 'url:braz/b1') {
      const el = L.audios[0];
      L.m.setEraMusicTier(1);
      const still = !el.paused && el.pauseCount === 0 && el.src === 'url:braz/b1';
      assert('(e) wypadły z puli utwór brązu dogrywa się (bez pauzy)', still, { paused: el.paused });
      // przejście dalej: następny z kamienia
      el.duration = 30; el.currentTime = 29;
      L.advance(2000); L.advance(100);
      const next = L.audios.filter((a) => !a.paused && a.src && a.src !== 'url:braz/b1').map((a) => a.src);
      assert('(e) po dograniu następny utwór z kamienia', next.length >= 1 && next.every((s) => s.startsWith('url:kamien')), next);
      bPlayed = true;
    }
  }
  void pl; void audios; void tickAll;
  assert('(e) scenariusz z utworem brązu wypadającym z puli został zbadany', bPlayed);
}

// ---- (g): przed startem
{
  const { m, audios } = loadModule(dirsNoIron);
  m.setEraMusicTier(2);
  m.setEraMusicTier(3);
  assert('(g) zmiana tieru przed startem nie tworzy elementów audio', audios.length === 0);
  m.eraMusicPlaylist.start();
  assert('(g) start gra utwór z puli tieru 3', audios.length === 1 && [...KAM, ...BRA].includes(audios[0].src), audios.map((a) => a.src));
}

console.log('');
console.log('='.repeat(72));
console.log(`muzyka-era-cumulative-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
