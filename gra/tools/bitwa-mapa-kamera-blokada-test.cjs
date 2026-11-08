'use strict';
/**
 * bitwa-mapa-kamera-blokada-test.cjs
 *
 * P-BITWA-MAPA-BLACKOUT-PO-WYGRANEJ (zgłoszenie Macieja 2026-08-14):
 * „Po wygranej bitwie nagle nastąpił blackout, zniknęła cała mapa świata."
 *
 * PRZYCZYNA: `CameraController` (mapa świata) trzyma nasłuchy `keydown`/`mousemove`
 * na `window` (`camera.ts` `_bind`), a `renderLoop` w `main.ts` wołał `camCtrl.update()`
 * BEZWARUNKOWO — także wtedy, gdy na wierzchu stała nakładka sceny bitwy. Gracz panujący
 * kamerą BITWY (WASD/strzałki) albo trzymający kursor przy krawędzi ekranu przesuwał
 * jednocześnie kamerę MAPY ŚWIATA pod spodem. Po powrocie z bitwy kadr mapy stał poza
 * mapą i gracz widział pusty ekran. `isWorldMapUnitMode()` (bramka edge-panu) sprawdzała
 * tylko `isPreBattleOpen()` — okienko pre-bitwy, zamykane w chwili startu bitwy 3D —
 * mimo że komentarz przy `edgePanActive` deklarował wykluczenie także „bitwy".
 *
 * / EN: the world-map CameraController listens on `window`, and renderLoop called
 * camCtrl.update() unconditionally, so panning the BATTLE camera also panned the world
 * map underneath; after the battle the world-map view sat off the map (empty screen).
 *
 * Trzy części:
 *  A) BEHAWIORALNY test rejestru `src/battle/battleSceneOpen.ts` (esbuild, bez DOM):
 *     open/close, IDEMPOTENCJA close (dispose() leci dwa razy na ścieżce wygranej),
 *     dwie sceny naraz, stan po zamknięciu wszystkich.
 *  B) BEHAWIORALNY test `src/render/camera.ts` na atrapie DOM: dowodzi, że pan WASD
 *     dzieje się WYŁĄCZNIE w `update()` — czyli że bramka na wywołaniu `update()`
 *     realnie zatrzymuje przesuwanie kamery mapy.
 *  C) PIN TEKSTOWY na `src/main.ts` — bramka `if (!isBattleSceneOpen()) camCtrl.update();`
 *     w pętli renderu ORAZ `if (isBattleSceneOpen()) return false;` w `isWorldMapUnitMode()`.
 *     Bez pinu części A/B przechodziłyby dalej, nawet gdyby ktoś usunął samą naprawę.
 *
 * Usage (z gra/): node tools/bitwa-mapa-kamera-blokada-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// A) Rejestr otwartych scen bitwy — zachowanie, nie tekst.
// ---------------------------------------------------------------------------
const ENTRY_A = path.join(__dirname, '.bitwa-mapa-kamera-entry-a.ts');
const OUT_A = path.join(__dirname, '.bitwa-mapa-kamera-bundle-a.cjs');
fs.writeFileSync(
  ENTRY_A,
  "export { markBattleSceneOpen, markBattleSceneClosed, isBattleSceneOpen } from '../src/battle/battleSceneOpen';\n",
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ENTRY_A],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT_A,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});
const reg = require(OUT_A);

ok(reg.isBattleSceneOpen() === false, '[A1] start: brak otwartej sceny bitwy');

const sceneA = {};
reg.markBattleSceneOpen(sceneA);
ok(reg.isBattleSceneOpen() === true, '[A2] po markBattleSceneOpen -> true (nakładka przykrywa mapę)');

reg.markBattleSceneClosed(sceneA);
ok(reg.isBattleSceneOpen() === false, '[A3] po markBattleSceneClosed -> false (mapa znów interaktywna)');

// EDGE: dispose() na ścieżce wygranej leci DWA RAZY (onFinish ekranu końca +
// afterSummary podsumowania w main.ts). Licznik zszedłby poniżej zera i mapa
// zostałaby zablokowana na stałe — Set musi być idempotentny.
reg.markBattleSceneClosed(sceneA);
reg.markBattleSceneClosed(sceneA);
ok(reg.isBattleSceneOpen() === false, '[A4] EDGE: podwójne/potrójne zamknięcie tej samej sceny nie psuje stanu');
const sceneAfterDouble = {};
reg.markBattleSceneOpen(sceneAfterDouble);
ok(reg.isBattleSceneOpen() === true, '[A5] EDGE: po podwójnym zamknięciu kolejna scena nadal poprawnie blokuje mapę');
reg.markBattleSceneClosed(sceneAfterDouble);

// EDGE: dwie sceny naraz — zamknięcie jednej NIE odblokowuje mapy.
const s1 = {}, s2 = {};
reg.markBattleSceneOpen(s1);
reg.markBattleSceneOpen(s2);
reg.markBattleSceneClosed(s1);
ok(reg.isBattleSceneOpen() === true, '[A6] EDGE: dwie sceny, zamknięta jedna -> mapa nadal zablokowana');
reg.markBattleSceneClosed(s2);
ok(reg.isBattleSceneOpen() === false, '[A7] EDGE: po zamknięciu obu -> mapa odblokowana');

// EDGE: zamknięcie sceny, której nigdy nie otwarto (defensywnie — nie rzuca, nie psuje stanu).
reg.markBattleSceneOpen(s1);
reg.markBattleSceneClosed({});
ok(reg.isBattleSceneOpen() === true, '[A8] EDGE: zamknięcie NIEZNANEJ sceny nie odblokowuje otwartej');
reg.markBattleSceneClosed(s1);
ok(reg.isBattleSceneOpen() === false, '[A9] EDGE: stan końcowy czysty');

// ---------------------------------------------------------------------------
// B) CameraController — cały pan WASD dzieje się w update() (atrapa DOM).
// ---------------------------------------------------------------------------
const ENTRY_B = path.join(__dirname, '.bitwa-mapa-kamera-entry-b.ts');
const OUT_B = path.join(__dirname, '.bitwa-mapa-kamera-bundle-b.cjs');
fs.writeFileSync(
  ENTRY_B,
  [
    "export { CameraController } from '../src/render/camera';",
    "export * as THREE from 'three';",
  ].join('\n'),
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ENTRY_B],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT_B,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

// Minimalna atrapa DOM: CameraController w konstruktorze podpina listenery na
// window/document/canvas i czyta getBoundingClientRect przy edge-panie.
const listeners = new Map();
function fakeTarget() {
  return {
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener: () => {},
  };
}
const fakeCanvas = Object.assign(fakeTarget(), {
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 900 }),
});
global.window = fakeTarget();
global.document = fakeTarget();
function fire(type, ev) {
  for (const fn of listeners.get(type) ?? []) fn(ev);
}

const camMod = require(OUT_B);
const THREE = camMod.THREE;
const camera = new THREE.PerspectiveCamera(50, 1440 / 900, 0.5, 600);
camera.position.set(0, 20, 20);
const cam = new camMod.CameraController(camera, fakeCanvas, { x: 0, z: 0 }, {
  keyPanSpeed: 0.3,
  edgePanActive: () => false,
});

const before = cam.getFocusState();
fire('keydown', { key: 's' });
// Bez update() kamera NIE rusza — czyli bramka na wywołaniu update() faktycznie
// zatrzymuje pan (to jest mechanizm naprawy, nie jej kopia).
for (let i = 0; i < 120; i++) { /* 120 klatek "pominiętych" przez bramkę */ }
const afterNoUpdate = cam.getFocusState();
ok(afterNoUpdate.x === before.x && afterNoUpdate.z === before.z,
  '[B1] wciśnięty klawisz pan BEZ update() nie rusza kamery mapy (bramka na update() = skuteczna blokada)');

// 120 klatek Z update() — kamera odjeżdża o dziesiątki jednostek świata (HEX_R = 1.0),
// czyli o kilkadziesiąt heksów: dokładnie ten dryf, który wynosił mapę poza kadr.
for (let i = 0; i < 120; i++) cam.update();
const afterUpdate = cam.getFocusState();
const drift = Math.abs(afterUpdate.z - before.z);
ok(drift > 20,
  `[B2] 120 klatek z update() przy wciśniętym 's' przesuwa kamerę o >20 jedn. świata (zmierzone: ${drift.toFixed(1)}) — skala dryfu, który gubił mapę`);

fire('keyup', { key: 's' });
const afterKeyUp = cam.getFocusState();
for (let i = 0; i < 120; i++) cam.update();
const afterRelease = cam.getFocusState();
ok(afterRelease.x === afterKeyUp.x && afterRelease.z === afterKeyUp.z,
  '[B3] po keyup update() już nie przesuwa kamery (kontrola: dryf pochodzi z klawisza, nie z samego update)');

// ---------------------------------------------------------------------------
// C) PIN TEKSTOWY na src/main.ts — sama naprawa.
// ---------------------------------------------------------------------------
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

ok(/import \{ isBattleSceneOpen \} from '\.\/battle\/battleSceneOpen';/.test(mainSrc),
  '[C1] main.ts importuje isBattleSceneOpen z ./battle/battleSceneOpen');

{
  // Zakres = TYLKO ciało function renderLoop(). Poza nim jest jeszcze jedna,
  // legalna klatka `camCtrl.update()` — jednorazowy render startowy w boot()
  // (przed jakąkolwiek bitwą), której ta naprawa nie dotyczy.
  const rlStart = mainSrc.indexOf('function renderLoop() {');
  ok(rlStart >= 0, '[C2a] znaleziono function renderLoop() { w main.ts');
  const rlEnd = rlStart >= 0 ? mainSrc.indexOf('\n    function ', rlStart + 10) : -1;
  const rlBody = (rlStart >= 0 && rlEnd > rlStart) ? mainSrc.slice(rlStart, rlEnd) : '';
  ok(rlBody.length > 500, '[C2b] ciało renderLoop() wycięte poprawnie');

  ok(/if \(!isBattleSceneOpen\(\)\) camCtrl\.update\(\);/.test(rlBody),
    '[C2] pętla renderu: camCtrl.update() bramkowane przez !isBattleSceneOpen()');

  ok(!/\n\s*camCtrl\.update\(\);/.test(rlBody),
    '[C3] w pętli renderu NIE ma już gołego, niebramkowanego "camCtrl.update();"');
}

{
  const start = mainSrc.indexOf('function isWorldMapUnitMode(): boolean {');
  ok(start >= 0, '[C4] znaleziono function isWorldMapUnitMode(): boolean {');
  const end = start >= 0 ? mainSrc.indexOf('\n    }', start) : -1;
  const body = (start >= 0 && end > start) ? mainSrc.slice(start, end) : '';
  ok(/if \(isBattleSceneOpen\(\)\) return false;/.test(body),
    '[C5] isWorldMapUnitMode() zwraca false, gdy scena bitwy jest otwarta (bramka edge-panu i reszty interakcji mapy)');
  ok(/if \(isPreBattleOpen\(\)\) return false;/.test(body),
    '[C6] kontrola: dotychczasowy warunek isPreBattleOpen() NIE został zastąpiony (naprawa dokłada, nie podmienia)');
}

// PIN na battleScene.ts — rejestracja/wyrejestrowanie faktycznie podpięte pod cykl życia.
const BATTLE_TS = path.join(__dirname, '..', 'src', 'battle', 'battleScene.ts');
const battleSrc = fs.readFileSync(BATTLE_TS, 'utf8');
ok(/import \{ markBattleSceneOpen, markBattleSceneClosed \} from '\.\/battleSceneOpen';/.test(battleSrc),
  '[C7] battleScene.ts importuje markBattleSceneOpen/markBattleSceneClosed');
{
  const loopIdx = battleSrc.indexOf('    this._startLoop();');
  const markIdx = battleSrc.indexOf('markBattleSceneOpen(this);');
  ok(loopIdx >= 0 && markIdx > loopIdx,
    '[C8] markBattleSceneOpen(this) wołane dopiero po pomyślnym zakończeniu konstruktora');
  const disposeIdx = battleSrc.indexOf('  dispose(): void {');
  const closeIdx = battleSrc.indexOf('markBattleSceneClosed(this);');
  ok(disposeIdx >= 0 && closeIdx > disposeIdx,
    '[C9] markBattleSceneClosed(this) wołane w dispose()');
  const cancelFrameIdx = battleSrc.indexOf('cancelAnimationFrame(this.animFrameId);');
  ok(closeIdx > 0 && cancelFrameIdx > closeIdx,
    '[C10] wyrejestrowanie leci PRZED resztą sprzątania dispose() (gdyby dalsza część rzuciła, mapa i tak wraca do życia)');
}

for (const f of [ENTRY_A, OUT_A, ENTRY_B, OUT_B]) { try { fs.unlinkSync(f); } catch { /* ignore */ } }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
