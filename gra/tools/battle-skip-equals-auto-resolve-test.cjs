'use strict';

/**
 * R-WEB-BATTLE-SKIP-TO-RESULT-ABSURD-OUTCOME-Q1
 * "Pomin do wyniku" (skip) = szybkie przewiniecie TEJ SAMEJ symulacji co walka AUTO.
 * Test uzywa prawdziwego kodu BattleScene (esbuild) z dublerami sceny/zasobow.
 * NIE_ZMIERZONO: pelny przebieg 3D w Chromium (brak przegladarki w srodowisku Operatora);
 * identycznosc wyniku skip == auto wynika z konstrukcji (ten sam silnik, te same timery
 * wirtualne, brak osobnej sciezki wyniku) i jest sprawdzana kontraktowo ponizej.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

async function bundle(entry, stubs) {
  const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: ROOT, sourcefile: 'skip-test-entry.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [{ name: 'stub', setup(build) {
      for (const [filter, namespace, contents] of stubs) {
        build.onResolve({ filter }, args => ({ path: args.path, namespace }));
        build.onLoad({ filter: /.*/, namespace }, () => ({ contents, loader: 'js' }));
      }
    } }],
    write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require, console, process, globalThis,
    setTimeout, clearTimeout, performance,
  }, { filename: 'skip-test.js' });
  return module.exports;
}

const STUBS = [
  [/brandAssets/, 'brand', 'export const civIconSvg=()=>""; export const brandIconSvg=()=>"";'],
  [/leaderPortraits/, 'leader', 'export const leaderPortraitUrl=()=>""; export const leaderName=()=>""; export const civIconIdFromCivLabel=()=>"";'],
  [/muzyka-antyczna/, 'audio', 'export const startVictoryMusic=()=>{}; export const startDefeatMusic=()=>{}; export const startBattleMusic=()=>{};'],
];

async function main() {
  // --- 1) Format liczb ekranu wyniku -------------------------------------------------
  const { formatEndLoss } = await bundle(
    "import { formatEndLoss } from './src/battle/endScreen1E.ts'; module.exports = { formatEndLoss };", STUBS);
  assert.strictEqual(formatEndLoss(2443.1999999999925), (2443).toLocaleString('pl-PL'), 'float -> integer');
  assert.strictEqual(formatEndLoss(1584.999999999996), (1585).toLocaleString('pl-PL'), 'float rounds');
  assert.strictEqual(formatEndLoss(-5), '0', 'negative -> 0');
  assert.strictEqual(formatEndLoss(NaN), '0', 'NaN -> 0');
  assert.strictEqual(formatEndLoss(Infinity), '0', 'Infinity -> 0');
  assert.ok(!/[.,]\d{3,}$/.test(formatEndLoss(0.30000000000000004)), 'no float tails');

  // --- 2) skip() = przewiniecie symulacji, nie osobny rachunek -----------------------
  const { BattleScene } = await bundle(
    "import { BattleScene } from './src/battle/battleScene.ts'; module.exports = { BattleScene };", STUBS);

  function makeScene() {
    const s = Object.create(BattleScene.prototype);
    Object.assign(s, {
      finished: false, started: true, deployPhase: false, paused: true, _manualMode: true,
      _battleAwaitingOrders: true, _ffActive: false, _ffQueue: [], _ffVirtualMs: 0,
      vNow: 0, vLastWall: 0, vTimers: [], vTimerSeq: 0, hint: { textContent: '' },
      atk: [], def: [], log: [], _autoBatchPlanning: false,
      _tickProjectiles() {}, _tickFades() {},
      _toggleManualMode() { this._manualMode = false; this.toggled = (this.toggled || 0) + 1; },
      _kickoffBattleTurn() { this._battleAwaitingOrders = false; this.kicked = (this.kicked || 0) + 1; },
      _skipInstantFallback() { this.fallback = (this.fallback || 0) + 1; this.finished = true; },
    });
    return s;
  }

  // 2a) skip w trybie recznym: przelacza na AUTO, startuje ture, wlacza FF, NIE konczy bitwy.
  {
    const s = makeScene();
    s.skip();
    assert.strictEqual(s.finished, false, 'skip nie moze od razu zakonczyc bitwy (brak wyniku 0:0)');
    assert.strictEqual(s._ffActive, true, 'tryb przewijania wlaczony');
    assert.strictEqual(s.toggled, 1, 'przelaczono na AUTO');
    assert.strictEqual(s.kicked, 1, 'tura rozpoczeta');
    assert.strictEqual(s.paused, false, 'pauza zdjeta');
    assert.ok(!s.fallback, 'bez rachunku awaryjnego');
    s.skip(); // idempotentne
    assert.strictEqual(s.toggled, 1);
  }

  // 2b) Pelna petla przewijania: lancuch timerow wirtualnych + kroki _raf (jak ruch/cios)
  //     dochodzi do konca bitwy; numer tury jak w zwyklej grze; koniec zgloszony RAZ.
  {
    const s = makeScene();
    s.roundNo = 0;
    let ends = 0;
    const TURNS = 11;
    const turn = () => {
      s.roundNo++;
      if (s.roundNo >= TURNS) { s.finished = true; ends++; return; }
      const t0 = s.vNow;
      const step = () => {
        if (s.vNow - t0 < 240) { s._raf(step); return; } // MOVE_STEP_MS
        s._schedule(240, turn);                          // TURN_GAP_MS
      };
      s._raf(step);
    };
    s._schedule(0, turn);
    s.skip();
    let frames = 0;
    while (!s.finished && frames < 100000) { s._runFastForward(); frames++; }
    assert.strictEqual(s.finished, true, 'przewiniecie konczy bitwe');
    assert.strictEqual(s.roundNo, TURNS, 'ten sam numer tury co zwykla symulacja (nie 0)');
    assert.strictEqual(ends, 1, 'koniec zgloszony raz');
    assert.ok(s.vNow > 0, 'czas bitwy niezerowy (nie "Tura 0 / 00:00")');
    assert.ok(!s.fallback, 'bez rachunku awaryjnego');
  }

  // 2c) Bezpiecznik: symulacja ktora sie nie konczy -> rachunek awaryjny (bez wieszania).
  {
    const s = makeScene();
    const loop = () => { s._schedule(1000, loop); };
    s._schedule(1000, loop);
    s.skip();
    let frames = 0;
    while (!s.finished && frames < 1e6) { s._runFastForward(); frames++; }
    assert.strictEqual(s.fallback, 1, 'bezpiecznik uruchomil rachunek awaryjny raz');
    assert.strictEqual(s._ffActive, false);
  }

  // --- 3) Kontrakt zrodlowy ---------------------------------------------------------
  const src = fs.readFileSync(path.join(ROOT, 'src/battle/battleScene.ts'), 'utf8');
  const skipBody = src.slice(src.indexOf('  skip(): void {'), src.indexOf('  private _skipInstantFallback'));
  assert.ok(!/computeInstantResult\(/.test(skipBody), 'skip() nie wola osobnego rachunku');
  const fbStart = src.indexOf('  private _skipInstantFallback');
  const fbBody = src.slice(fbStart, fbStart + 3000);
  assert.ok(/computeInstantResult\(/.test(fbBody), 'rachunek natychmiastowy tylko jako awaryjny');
  assert.ok(/this\._raf\(step\)/.test(src), 'krok ruchu przez _raf');
  assert.ok(/this\._raf\(stepAnim\)/.test(src), 'krok ciosu przez _raf');
  assert.ok(!/requestAnimationFrame\(stepAnim\)|requestAnimationFrame\(step\)/.test(src), 'brak surowego rAF w krokach walki');
  const endStart = src.indexOf('  private _showEndScreen(');
  assert.ok(/_ffActive = false/.test(src.slice(endStart, endStart + 300)), 'ekran konca wylacza FF');
  const es = fs.readFileSync(path.join(ROOT, 'src/battle/endScreen1E.ts'), 'utf8');
  assert.ok(/formatEndLoss\(playerStats\.hpMax - playerStats\.hp\)/.test(es), 'straty gracza sformatowane');

  console.log('battle-skip-equals-auto-resolve-test: PASS');
}

main().catch(e => { console.error(e); process.exit(1); });
