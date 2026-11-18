'use strict';
/**
 * battle-damage-label-stack-test.cjs
 * R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1
 *
 * Test logiczny (bez przegladarki): kolejne etykiety obrazen tej samej jednostki
 * startuja co najmniej jeden krok (DMG_LABEL_STACK_STEP_PX na ekranie, przeliczony
 * na jednostki swiata skala kamery) powyzej AKTUALNEJ pozycji aktywnych etykiet tej
 * jednostki, wiec nie nakladaja sie na siebie.
 *   A -- czysta funkcja damageLabelStackY / damageLabelStackStepWorld (src/battle/damageLabelStack.ts).
 *   S -- symulacja osi czasu (te same wzory co battleScene: start, riseRate, duration 2000 ms,
 *        krok z 7.5 px/jedn.): seria trafien, takze po wygasnieciu starszych etykiet; w kazdej
 *        chwili kazda para jednoczesnie widocznych etykiet ma odstep >= krok (w swiecie i w px).
 *   B -- battleScene.ts: _spawnDamageLabel liczy AKTUALNE Y aktywnych etykiet tej jednostki
 *        i ustawia worldPos.y = damageLabelStackY(baseY, activeYs, krok z kamery).
 *   C -- kolory i tresc liczb bez zmian (battleLossTextColor, '-' + dmg), czas zycia 2000 ms.
 *
 * Helper jest transpilowany przez esbuild w pamieci (bez zapisu plikow).
 * Mutacje:
 *   --src <helper.ts>   podmienia zrodlo helpera (np. zerowy krok) -> test MUSI dac FAIL
 *   --scene <scene.ts>  podmienia zrodlo battleScene.ts (np. bez stackY) -> test MUSI dac FAIL
 *
 * Usage (z katalogu gra/): node tools/battle-damage-label-stack-test.cjs [--src <h.ts>] [--scene <s.ts>]
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const GRA = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const argOf = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : null);
const srcArg = argOf('--src');
const sceneArg = argOf('--scene');
const helperPath = srcArg ? path.resolve(srcArg) : path.join(GRA, 'src/battle/damageLabelStack.ts');
const scenePath = sceneArg ? path.resolve(sceneArg) : path.join(GRA, 'src/battle/battleScene.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? ' -- ' + detail : '')); }
}

// --- A: czysta funkcja --------------------------------------------------------
console.log('A. damageLabelStackY / damageLabelStackStepWorld (czyste funkcje)');
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
const PX = mod ? mod.DMG_LABEL_STACK_STEP_PX : NaN;
if (mod) {
  const stackY = mod.damageLabelStackY;
  const stepW = mod.damageLabelStackStepWorld;
  check('eksport damageLabelStackY / damageLabelStackStepWorld sa funkcjami',
    typeof stackY === 'function' && typeof stepW === 'function');
  check('DMG_LABEL_STACK_STEP_PX jest dodatnia liczba (20 px)', Number.isFinite(PX) && PX > 0, String(PX));
  if (typeof stepW === 'function' && Number.isFinite(PX) && PX > 0) {
    const s75 = stepW(7.5);
    check('krok swiata = px / skala kamery (20 px przy 7.5 px/jedn.)', Math.abs(s75 - PX / 7.5) < 1e-12, String(s75));
    check('brak / zerowa skala -> krok zapasowy dodatni', stepW(0) > 0 && stepW(NaN) > 0 && stepW(-3) > 0);
  }
  if (typeof stackY === 'function' && typeof stepW === 'function' && Number.isFinite(PX) && PX > 0) {
    const base = 1.0;
    const st = stepW(7.5);
    check('0 aktywnych etykiet -> baseY (pierwsza bez zmiany)', stackY(base, [], st) === base);
    const one = stackY(base, [base], st);
    check('1 aktywna na bazie -> nowa o krok wyzej', Math.abs(one - (base + st)) < 1e-12, String(one));
    const two = stackY(base, [base, base + st], st);
    check('2 aktywne (A na bazie, B o krok wyzej) -> nowa o krok nad najwyzsza', Math.abs(two - (base + 2 * st)) < 1e-12, String(two));
    check('etykieta ponizej bazy: nowa stoi o krok nad nia (nie ponizej bazy)',
      Math.abs(stackY(base, [base - 0.5], st) - (base - 0.5 + st)) < 1e-12);
    check('kolejnosc aktywnych bez znaczenia', stackY(base, [base + st, base], st) === stackY(base, [base, base + st], st));
    check('NaN / nieskonczone wejscie ignorowane', stackY(base, [NaN, Infinity], st) === base);
    check('wynik nigdy nizszy niz baza', stackY(base, [-5], st) === base);
  }
}

// --- S: symulacja osi czasu (ta sama matematyka co battleScene) ---------------
console.log('S. symulacja serii trafien (wygasanie 2000 ms, riseRate 0.00012, krok 20 px przy 7.5 px/jedn.)');
if (mod && typeof mod.damageLabelStackY === 'function' && typeof mod.damageLabelStackStepWorld === 'function') {
  const DUR = 2000;
  const RISE = 0.00012;
  const BASE = 1.0;
  const PXU = 7.5;
  const STEP = mod.damageLabelStackStepWorld(PXU);
  // Seria: 4 trafienia w krotkim czasie, potem ciagly strumien (wygasanie starszych).
  const hits = [0, 500, 1000, 2100, 2200, 2300, 2400, 2500, 3000, 3600, 4200];
  const labels = [];
  let worstPx = Infinity;
  let worstAt = null;
  for (const t of hits) {
    const activeYs = [];
    for (const l of labels) {
      const age = t - l.start;
      if (age >= DUR) continue;
      activeYs.push(l.y + age * RISE);
    }
    const y = mod.damageLabelStackY(BASE, activeYs, STEP);
    labels.push({ start: t, y: y });
    // Odstepy WSZYSTKICH par jednoczesnie widocznych w chwili t (po dodaniu nowej), w pikselach.
    const live = labels.filter(l => t - l.start < DUR);
    const ys = live.map(l => l.y + (t - l.start) * RISE).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) {
      const gapPx = (ys[i] - ys[i - 1]) * PXU;
      if (gapPx < worstPx) { worstPx = gapPx; worstAt = t; }
    }
  }
  check('zadna para jednoczesnie widocznych etykiet nie nachodzi (odstep >= 20 px)', worstPx >= PX - 1e-6,
    'najmniejszy odstep ' + worstPx.toFixed(3) + ' px przy t=' + worstAt);
  // Scenariusz z przegladu: A(0) B(500) C(1000), D(2100) po wygasnieciu A -> D nad C o krok.
  const cNow = labels[2].y + (2100 - 1000) * RISE;
  const dNow = labels[3].y;
  check('D (t=2100, po wygasnieciu A) lezy >= krok nad C', dNow - cNow >= STEP - 1e-9, (dNow - cNow).toFixed(4));
} else {
  check('symulacja pominieta (brak helpera)', false);
}

// --- B: integracja w battleScene.ts --------------------------------------------
console.log('B. battleScene.ts: stosowanie damageLabelStackY w _spawnDamageLabel');
const scene = fs.readFileSync(scenePath, 'utf8');
const bodyStart = scene.indexOf('private _spawnDamageLabel(');
const bodyEnd = bodyStart >= 0 ? scene.indexOf('\n  }\n', bodyStart) : -1;
const body = bodyStart >= 0 && bodyEnd > bodyStart ? scene.slice(bodyStart, bodyEnd) : '';
check('import damageLabelStackY i damageLabelStackStepWorld z ./damageLabelStack',
  /import \{ damageLabelStackY, damageLabelStackStepWorld \} from '\.\/damageLabelStack';/.test(scene));
check('_spawnDamageLabel znaleziona', body.length > 0);
check('zbiera AKTUALNE Y aktywnych etykiet tej jednostki (owner === ru, age < duration)',
  /if \(fl\.owner !== ru\) continue;[\s\S]*?if \(age >= fl\.duration\) continue;[\s\S]*?activeYs\.push\(fl\.worldPos\.y \+ age \* fl\.riseRate\);/.test(body));
check('krok z biezacej skali kamery (worldToScreen) i stackY = damageLabelStackY(baseY, activeYs, krok)',
  /const stackY = damageLabelStackY\(stackBaseY, activeYs, damageLabelStackStepWorld\(pxPerUnit\)\);/.test(body)
  && /worldToScreen\(new THREE\.Vector3\(wp\.x, stackBaseY \+ 1, wp\.z\), this\.camera, this\.canvas\)/.test(body));
check('worldPos.y = stackY (nie sama baza)', /new THREE\.Vector3\(wp\.x, stackY, wp\.z\)/.test(body));
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
