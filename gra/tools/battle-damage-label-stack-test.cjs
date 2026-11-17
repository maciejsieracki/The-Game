'use strict';
/**
 * battle-damage-label-stack-test.cjs
 * R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1
 *
 * Test logiczny (bez przegladarki): kolejne etykiety obrazen tej samej jednostki
 * dostaja rosnace przesuniecie pionowe, wiec nie nakladaja sie na siebie.
 *   A -- czysta funkcja damageLabelStackOffset (src/battle/damageLabelStack.ts):
 *        0 aktywnych -> 0; 1 -> >0; 2 -> wiekszy niz 1; odstepy rowne i dodatnie.
 *   B -- battleScene.ts: _spawnDamageLabel liczy aktywne etykiety tej samej jednostki
 *        (owner === ru) i dodaje damageLabelStackOffset do worldPos.y.
 *   C -- kolory i tresc liczb bez zmian (battleLossTextColor, '-' + dmg).
 *
 * Helper jest transpilowany przez esbuild w pamieci (bez zapisu plikow).
 * Mutacja: --src <plik> podmienia zrodlo helpera (np. kopia z zerowym odstepem);
 * wtedy test MUSI zakonczyc sie FAIL.
 *
 * Usage (z katalogu gra/):  node tools/battle-damage-label-stack-test.cjs [--src <helper.ts>]
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const GRA = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const srcArg = argv.includes('--src') ? argv[argv.indexOf('--src') + 1] : null;
const helperPath = srcArg ? path.resolve(srcArg) : path.join(GRA, 'src/battle/damageLabelStack.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? ' -- ' + detail : '')); }
}

// --- A: czysta funkcja --------------------------------------------------------
console.log('A. damageLabelStackOffset (czysta funkcja)');
let mod = null;
try {
  const esbuild = require('esbuild');
  const code = esbuild.transformSync(fs.readFileSync(helperPath, 'utf8'), {
    loader: 'ts', format: 'cjs', target: 'es2020',
  }).code;
  const m = new Module(helperPath, null);
  m.paths = Module._nodeModulePaths(GRA);
  m._compile(code, helperPath);
  mod = m.exports;
} catch (e) {
  check('helper daje sie zaladowac', false, String(e && e.message || e));
}
if (mod) {
  const off = mod.damageLabelStackOffset;
  check('eksport damageLabelStackOffset jest funkcja', typeof off === 'function');
  check('DMG_LABEL_STACK_STEP jest dodatnia liczba', typeof mod.DMG_LABEL_STACK_STEP === 'number' && mod.DMG_LABEL_STACK_STEP > 0,
    String(mod.DMG_LABEL_STACK_STEP));
  if (typeof off === 'function') {
    const o0 = off(0), o1 = off(1), o2 = off(2), o3 = off(3);
    check('0 aktywnych etykiet -> przesuniecie 0 (pierwsza etykieta bez zmiany)', o0 === 0, String(o0));
    check('1 aktywna -> przesuniecie > 0 (druga etykieta wyzej)', o1 > 0, String(o1));
    check('2 aktywne -> wieksze niz 1 aktywna', o2 > o1, o2 + ' vs ' + o1);
    check('odstepy rowne: off(2)-off(1) == off(1)-off(0)', Math.abs((o2 - o1) - (o1 - o0)) < 1e-12);
    check('odstep kolejnych etykiet == DMG_LABEL_STACK_STEP', Math.abs((o3 - o2) - mod.DMG_LABEL_STACK_STEP) < 1e-12,
      String(o3 - o2));
    check('wartosc ujemna / NaN -> 0 (odporne na bledne wejscie)', off(-1) === 0 && off(NaN) === 0);
  }
}

// --- B: integracja w battleScene.ts --------------------------------------------
console.log('B. battleScene.ts: stosowanie przesuniecia w _spawnDamageLabel');
const scene = fs.readFileSync(path.join(GRA, 'src/battle/battleScene.ts'), 'utf8');
const bodyStart = scene.indexOf('private _spawnDamageLabel(');
const bodyEnd = bodyStart >= 0 ? scene.indexOf('\n  }\n', bodyStart) : -1;
const body = bodyStart >= 0 && bodyEnd > bodyStart ? scene.slice(bodyStart, bodyEnd) : '';
check('import damageLabelStackOffset z ./damageLabelStack',
  /import \{ damageLabelStackOffset \} from '\.\/damageLabelStack';/.test(scene));
check('_spawnDamageLabel znaleziona', body.length > 0);
check('liczy aktywne etykiety tej samej jednostki (fl.owner === ru)',
  /floatLabels\.reduce\(\(n, fl\) => n \+ \(fl\.owner === ru \? 1 : 0\), 0\)/.test(body));
check('worldPos.y dodaje damageLabelStackOffset(activeOnUnit)',
  /wpTopY \+ HPBAR_Y \+ 0\.20 \+ damageLabelStackOffset\(activeOnUnit\)/.test(body));
check('etykieta zapisuje owner: ru', /owner:\s+ru,/.test(body));
check('FloatLabel ma pole owner', /interface FloatLabel \{[\s\S]*?owner\?:\s+RuntimeBattleUnit;[\s\S]*?\}/.test(scene));

// --- C: kolory i tresc bez zmian ----------------------------------------------
console.log('C. kolory i tresc liczb bez zmian');
check("tresc liczby nadal '-' + dmg", /el\.textContent = '-' \+ dmg;/.test(body));
check('kolor nadal battleLossTextColor(this._isPlayerSide(ru.side))',
  /color:\s+battleLossTextColor\(this\._isPlayerSide\(ru\.side\)\),/.test(body));
check('czas zycia i predkosc unoszenia bez zmian (2000 ms, 0.00012)',
  /duration:\s+2000,/.test(body) && /riseRate:\s+0\.00012,/.test(body));

console.log('');
console.log('WYNIK: ' + pass + ' PASS, ' + fail + ' FAIL');
process.exitCode = fail === 0 ? 0 : 1;
