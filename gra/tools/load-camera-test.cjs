'use strict';
/**
 * load-camera-test.cjs -- R-WEB-LOAD-CAMERA-Q1 (LOADCAM).
 *
 * BLAD: po wczytaniu zapisu, ktory wymaga przebudowy mapy (regenerateWorldForLoad), kamera konczy z dystansem ~316
 * zamiast ~22 (mapa wyglada jak mala wyspa w pustce). Przyczyna: buildScene (render/scene.ts ok. 3107-3108) ustawia
 * kamere na center + camDist; regenerateWorldForLoad (main.ts) tworzy new CameraController(camera, canvas, center, ...),
 * a jego konstruktor (render/camera.ts ok. 122) liczy dist = |camera.position - target|, czyli ~camDist*1.14 na duzej mapie.
 * POPRAWKA: loadGameFromSlot po restoreGameFromSave, tylko gdy mapa byla przebudowana, ustawia widok na stolice gracza
 * (camCtrl.focusAt(..., 22)) -- tak jak po zalozeniu stolicy w nowej grze.
 *
 * Test tekstowy (bez przegladarki): sprawdza kolejnosc i obecnosc kodu w src/main.ts; mutacje semantyczne MUSZA byc czerwone.
 * Uruchom z gra/:  node tools/load-camera-test.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');

function sliceFn(src) {
  const start = src.indexOf('async function loadGameFromSlot(');
  if (start < 0) return null;
  // Koniec funkcji: klamra domykajaca poziom otwarcia.
  let depth = 0;
  let begun = false;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') { depth++; begun = true; }
    else if (ch === '}') {
      depth--;
      if (begun && depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function check(src) {
  const fn = sliceFn(src);
  const r = {};
  r['T0 funkcja loadGameFromSlot znaleziona'] = fn !== null;
  if (!fn) return r;
  const restoreIdx = fn.indexOf('restoreGameFromSave(saved);');
  const flagDecl = fn.indexOf('let regeneratedMapForLoad = false;');
  const regenIdx = fn.indexOf('regenerateWorldForLoad(');
  const flagSet = /regeneratedMapForLoad\s*=\s*ok\s*;/.test(fn);
  const guardIdx = fn.indexOf('if (regeneratedMapForLoad) {');
  const focusRe = /camCtrl\.focusAt\(\s*capPos\.x\s*,\s*capPos\.z\s*,\s*22\s*\)\s*;/;
  const focusIdx = fn.search(focusRe);
  const cityRe = /cities\.find\(c\s*=>\s*c\.ownerId\s*===\s*ME\(\)\)/;
  r['T1 flaga zadeklarowana przed przebudowa'] = flagDecl >= 0 && flagDecl < regenIdx;
  r['T2 flaga ustawiona z wyniku regenerateWorldForLoad'] = flagSet;
  r['T3 blok strzezony flaga istnieje'] = guardIdx >= 0;
  r['T4 focusAt na stolicy gracza dystans 22'] = focusIdx >= 0 && cityRe.test(fn);
  r['T5 widok ustawiany po restoreGameFromSave'] = restoreIdx >= 0 && guardIdx > restoreIdx && focusIdx > guardIdx;
  return r;
}

function mutants(src) {
  const fn = sliceFn(src);
  const out = {};
  const mut = (name, from, to) => {
    if (!fn || !fn.includes(from)) { out[name] = null; return; }
    out[name] = src.replace(fn, fn.replace(from, to));
  };
  mut('M1 bez focusAt', 'camCtrl.focusAt(capPos.x, capPos.z, 22);', '');
  mut('M2 zly dystans 316', 'camCtrl.focusAt(capPos.x, capPos.z, 22);', 'camCtrl.focusAt(capPos.x, capPos.z, 316);');
  mut('M3 bez przypisania flagi', 'regeneratedMapForLoad = ok;', '');
  mut('M4 flaga zawsze true', 'regeneratedMapForLoad = ok;', 'regeneratedMapForLoad = true;');
  mut('M6 bez filtra wlasciciela', 'cities.find(c => c.ownerId === ME())', 'cities[0]');
  return out;
}

// Mutacja M5 w tej formie nie przenosi bloku: ustawiona jako test kontrolny ponizej.
function movedBlockMutant(src) {
  const fn = sliceFn(src);
  if (!fn) return null;
  const startMark = '        if (regeneratedMapForLoad) {';
  const bStart = fn.indexOf(startMark);
  if (bStart < 0) return null;
  const bEnd = fn.indexOf('\n        }\n', bStart) + '\n        }\n'.length;
  const block = fn.slice(bStart, bEnd);
  const without = fn.slice(0, bStart) + fn.slice(bEnd);
  const rIdx = without.indexOf('        restoreGameFromSave(saved);');
  const moved = without.slice(0, rIdx) + block + without.slice(rIdx);
  return src.replace(fn, moved);
}

let failed = 0;
const base = check(SRC);
console.log('== wariant bazowy (oczekiwane: wszystko true)');
for (const [k, v] of Object.entries(base)) {
  console.log(`${v ? 'OK  ' : 'FAIL'} ${k}`);
  if (!v) failed++;
}

console.log('== mutacje (oczekiwane: kazda czerwona)');
const all = mutants(SRC);
const moved = movedBlockMutant(SRC);
all['M5b blok przeniesiony przed restore'] = moved;
for (const [name, msrc] of Object.entries(all)) {
  if (msrc === null || msrc === undefined) {
    console.log(`FAIL ${name} -- wzorzec mutacji nie znaleziony`);
    failed++;
    continue;
  }
  const r = check(msrc);
  const red = Object.values(r).some((v) => !v);
  console.log(`${red ? 'OK  ' : 'FAIL'} ${name} -> ${red ? 'czerwony' : 'ZIELONY (test za slaby)'}`);
  if (!red) failed++;
}

console.log(failed === 0 ? 'load-camera-test: PASS' : `load-camera-test: FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);
