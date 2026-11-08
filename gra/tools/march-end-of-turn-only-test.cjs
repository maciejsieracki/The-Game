'use strict';
/**
 * march-end-of-turn-only-test.cjs — R-WEB-MARCH-END-OF-TURN-ONLY-Q1.
 * Zaplanowany marsz jednostek gracza wykonuje sie WYLACZNIE w fazie konca tury gracza
 * (runPlannedMarchesAtPlayerEndTurn). Nigdy na starcie nowej tury / po animacji / dla nowych jednostek.
 * Wyjatek (decyzja A): pierwszy segment rozkazu wydanego przez gracza w tej turze.
 * Uruchomienie (z gra/): node tools/march-end-of-turn-only-test.cjs   (kod != 0 = RED)
 */
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');

function fnBody(src, header) {
  const i = src.indexOf(header);
  if (i < 0) return '';
  const b = src.indexOf('{', src.indexOf(')', i));
  let d = 0;
  for (let k = b; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1);
  }
  return '';
}
const nc = (s) => s.replace(/\/\/.*$/gm, '');

function checks(src) {
  const bad = [];
  let outside = nc(src);
  for (const h of ['function processMarchQueue(', 'function enqueueMarchSegments(', 'function executePlannedMarchesEndTurn(']) {
    outside = outside.replace(nc(fnBody(src, h)), '');
  }
  // E1: nic poza definicjami kolejki nie wola processMarchQueue (w szczegolnosci koniec animacji w renderLoop).
  const calls = (outside.match(/\bprocessMarchQueue\(\)/g) || []).length;
  if (calls > 0) bad.push('E1 processMarchQueue() wolane poza definicjami kolejki (' + calls + ')');
  // E2/E3: nowe jednostki idace do wodza nie sa wykonywane od razu.
  const flush = nc(fnBody(src, 'function flushDeferredPlayerUnitReveals('));
  if (/enqueueMarchSegments/.test(flush)) bad.push('E2 flushDeferredPlayerUnitReveals enqueue-uje marsz (nowa tura)');
  const aps = nc(fnBody(src, 'function afterPlayerUnitSpawned('));
  if (/enqueueMarchSegments|executeMarchSegmentForUnit/.test(aps)) bad.push('E3 afterPlayerUnitSpawned wykonuje marsz od razu');
  // E4/E5: syncGeneralMarchTargets kolejkuje tylko w fazie konca tury.
  const sg = nc(fnBody(src, 'function syncGeneralMarchTargets('));
  if (!/if \(!enqueueNewlyPlanned\) return;/.test(sg)) bad.push('E4 syncGeneralMarchTargets kolejkuje poza koncem tury');
  const run = nc(fnBody(src, 'function runPlannedMarchesAtPlayerEndTurn('));
  if (!/syncGeneralMarchTargets\(true\)/.test(run)) bad.push('E5 faza konca tury nie kolejkuje podopiecznych wodza');
  // E6: jednostka ruszona recznie nie maszeruje tej tury.
  if (!/movedByPlayerThisTurn\.has\(id\)/.test(run)) bad.push('E6 kolejka konca tury nie pomija jednostek ruszonych recznie');
  return bad;
}

let fail = 0;
const base = checks(SRC);
if (base.length) { fail++; console.error('FAIL zrodlo:', base); } else console.log('OK   zrodlo spelnia E1-E6');

const baseline = new Set(base.map((b) => b.slice(0, 2)));
function mutate(label, code, fn) {
  const m = fn(SRC);
  const added = checks(m).map((b) => b.slice(0, 2)).filter((c) => !baseline.has(c));
  if (m !== SRC && added.includes(code)) console.log('OK   MUTACJA ' + label + ' wykryta (' + code + ')');
  else { fail++; console.error('FAIL MUTACJA ' + label + ' niewykryta', { changed: m !== SRC, added }); }
}
mutate('M1 processMarchQueue po animacji', 'E1', (s) =>
  s.replace('          updateHud();\n          refreshD1bHud();\n', '          updateHud();\n          refreshD1bHud();\n          processMarchQueue();\n'));
mutate('M2 nowe jednostki -> enqueue w nowej turze', 'E2', (s) =>
  s.replace('        deferMarchToEndOfTurn,\n', '        enqueueMarchSegments,\n'));
mutate('M3 afterPlayerUnitSpawned wykonuje marsz', 'E3', (s) =>
  s.replace('      // R-WEB-MARCH-END-OF-TURN-ONLY-Q1: nowa jednostka idaca',
    '      if (autoMarchingToGeneral && !generalMarchPreplanned) enqueueMarchSegments([newUnitId]);\n      // R-WEB-MARCH-END-OF-TURN-ONLY-Q1: nowa jednostka idaca'));
mutate('M4 sync kolejkuje zawsze', 'E4', (s) => s.replace('if (!enqueueNewlyPlanned) return;', ''));
mutate('M5 brak pomijania recznie ruszonych', 'E6', (s) => s.replace(' || movedByPlayerThisTurn.has(id)) continue;', ') continue;'));
process.exit(fail ? 1 : 0);
