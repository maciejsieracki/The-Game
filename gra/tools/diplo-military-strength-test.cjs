#!/usr/bin/env node
/**
 * diplo-military-strength-test.cjs — R-WEB-DIPLO-WAR-MILITARY-STRENGTH-Q1
 *
 * Testy czystych funkcji siły militarnej pary w wojnie (src/game/diplomacy-military-strength.ts)
 * i jej parametrów (data/diplomacy-military-strength-params.json).
 *
 * Run from gra/: node tools/diplo-military-strength-test.cjs
 *
 * Przypadki:
 *  (a) siła = armia + rekruci przy braku bitew i trybutu; składniki military=true z Power = Armia + Rekruci
 *  (b) wygrane bitwy podnoszą siłę, gospodarka (miasta, tech, ludki) jej nie zmienia
 *  (c) trybut ×1,1
 *  (d) próg 20%: 119% brak, 120% przewaga (w obie strony)
 *  (e) symetria: zamiana A↔B odwraca wynik
 *  (f) remis rozstrzygnięty deterministycznie (niezależnie od kolejności)
 *  (g) parametry z JSON; brak magicznych liczb progu w kodzie .ts; moduł nie importuje silnika
 *  (h) mutacja: zmiana progu w JSON musi czerwienić test (wartości przypięte w (g) i (d))
 */

'use strict';

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[diplo-military-strength-test] esbuild not found. Run: npm ci --ignore-scripts (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const TS_FILE = path.join(GRA, 'src/game/diplomacy-military-strength.ts');
const PARAMS_JSON = path.join(GRA, 'data/diplomacy-military-strength-params.json');
const ENTRY_FILE = path.join(__dirname, '.diplo-military-strength-entry.ts');
const BUNDLE_FILE = path.join(__dirname, '.diplo-military-strength-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  computeMilitaryStrength, compareMilitaryStrength, loadMilitaryStrengthParams,
  DEFAULT_MILITARY_STRENGTH_PARAMS
} from '../src/game/diplomacy-military-strength';
export {
  computeObjectivePower, loadMilitaryComponentKeys, loadPowerCoefficients
} from '../src/game/power-objective';
`, 'utf8');

let mod;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
  mod = require(BUNDLE_FILE);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
}

const {
  computeMilitaryStrength, compareMilitaryStrength, loadMilitaryStrengthParams,
  DEFAULT_MILITARY_STRENGTH_PARAMS, computeObjectivePower, loadMilitaryComponentKeys,
} = mod;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail !== undefined ? ` — ${detail}` : ''}`); }
}
const near = (x, y) => Math.abs(x - y) < 1e-9;

const P = DEFAULT_MILITARY_STRENGTH_PARAMS;
const side = (id, sila, armiaPkt = 0) => ({ id, sila, armiaPkt });

// ---------------------------------------------------------------------------
console.log('(a) siła = armia + rekruci (bez bitew, bez trybutu)');
{
  // Scenariusz kalibracyjny z power-params.json: 10 jednostek, 80 ekwiwalentów rekrutów.
  const power = computeObjectivePower({
    ownerId: 1, epoka: 1, jednostki: 10, wygraneBitwy: 0, sumaLudkow: 0, rekrutEkw: 80,
    miasta: 0, heksyTerytorium: 0, budynki: 0, techZbadane: 0, ulepszeniaTerenu: 0,
  });
  const milKeys = loadMilitaryComponentKeys();
  const milKeysSorted = [...milKeys].sort().join(',');
  check('zbiór składników military=true z power-params.json = armia, rekruci',
    milKeysSorted === 'armia,rekruci', milKeysSorted);
  const milPoints = power.components
    .filter((c) => c.military)
    .reduce((s, c) => s + c.points, 0);
  const armiaPts = power.components.find((c) => c.key === 'armia').points;
  const rekrutPts = power.components.find((c) => c.key === 'rekruci').points;
  check('suma składników military=true z Power = Armia + Rekruci',
    near(milPoints, armiaPts + rekrutPts), `${milPoints} vs ${armiaPts}+${rekrutPts}`);
  const sila = computeMilitaryStrength({
    armiaPkt: armiaPts, rekrutPkt: rekrutPts, punktyWygranychBitewWojna: 0, trybutBonusAktywny: false,
  });
  check('siła bez bitew i trybutu = Armia + Rekruci (25 + 800 = 825)',
    near(sila, 825) && near(sila, armiaPts + rekrutPts), `sila=${sila}`);
}

// ---------------------------------------------------------------------------
console.log('(b) wygrane bitwy podnoszą siłę, gospodarka nie');
{
  const base = computeMilitaryStrength({ armiaPkt: 100, rekrutPkt: 50, punktyWygranychBitewWojna: 0, trybutBonusAktywny: false });
  const withBattles = computeMilitaryStrength({ armiaPkt: 100, rekrutPkt: 50, punktyWygranychBitewWojna: 40, trybutBonusAktywny: false });
  check('wygrane bitwy wojny zwiększają siłę o wagaBitew × punkty',
    near(withBattles - base, P.wagaBitew * 40), `delta=${withBattles - base}`);
  check('siła 100 + 50 + 0 bitew = 150 (bazowy wynik)', near(base, 150), `base=${base}`);
  // Gospodarka: NIE MA pola wejściowego. Test statyczny na źródle: ciało interfejsu
  // MilitaryStrengthInput nie zawiera kluczy gospodarki. Celowo nie przekazujemy pól
  // gospodarczych w runtime: funkcja by je zignorowała, a asercja byłaby tautologią.
  const srcIface = fs.readFileSync(TS_FILE, 'utf8');
  const ifaceBody = (srcIface.match(/export interface MilitaryStrengthInput \{([\s\S]*?)\n\}/) || [])[1] || '';
  const econKeys = /\b(miasta|techZbadane|sumaLudkow|budynki|kulturaImperium|heksy\w*|ulepszenia\w*)\b/;
  check('interfejs MilitaryStrengthInput nie ma pól gospodarki (miasta/tech/ludki/budynki/kultura)',
    ifaceBody.length > 0 && !econKeys.test(ifaceBody), `body=${ifaceBody.length} chars`);
  // Power z gospodarką: zmiana miast/tech zmienia Power, ale nie zmienia składników military=true.
  const mk = loadMilitaryComponentKeys();
  const pA = computeObjectivePower({ ownerId: 1, epoka: 1, jednostki: 4, wygraneBitwy: 0, sumaLudkow: 0, rekrutEkw: 8, miasta: 1, heksyTerytorium: 0, budynki: 0, techZbadane: 0, ulepszeniaTerenu: 0 });
  const pB = computeObjectivePower({ ownerId: 1, epoka: 1, jednostki: 4, wygraneBitwy: 0, sumaLudkow: 50, rekrutEkw: 8, miasta: 10, heksyTerytorium: 50, budynki: 20, techZbadane: 10, ulepszeniaTerenu: 5 });
  const milOf = (r) => r.components.filter((c) => mk.has(c.key)).reduce((s, c) => s + c.points, 0);
  check('Power rośnie przez gospodarkę, składniki military=true bez zmian',
    pB.power > pA.power && near(milOf(pA), milOf(pB)), `P ${pA.power}->${pB.power}, mil ${milOf(pA)}->${milOf(pB)}`);
}

// ---------------------------------------------------------------------------
console.log('(c) trybut ×1,1');
{
  const bez = computeMilitaryStrength({ armiaPkt: 60, rekrutPkt: 40, punktyWygranychBitewWojna: 0, trybutBonusAktywny: false });
  const z = computeMilitaryStrength({ armiaPkt: 60, rekrutPkt: 40, punktyWygranychBitewWojna: 0, trybutBonusAktywny: true });
  check('bez trybutu siła 100', near(bez, 100), `bez=${bez}`);
  check('z trybutem siła 110 (×1,1 z trybutBonusProc = 10)', near(z, 110), `z=${z}`);
}

// ---------------------------------------------------------------------------
console.log('(d) próg przewagi 20%');
{
  const r119 = compareMilitaryStrength(side('A', 119), side('B', 100));
  const r120 = compareMilitaryStrength(side('A', 120), side('B', 100));
  const r100b = compareMilitaryStrength(side('A', 100), side('B', 120));
  const r100c = compareMilitaryStrength(side('A', 100), side('B', 119));
  check('119% (A=119, B=100) → brak', r119.przewaga === 'brak', r119.przewaga);
  check('120% (A=120, B=100) → przewaga A', r120.przewaga === 'A', r120.przewaga);
  check('B = 120 przy A = 100 → przewaga B', r100b.przewaga === 'B', r100b.przewaga);
  check('A = 100 przy B = 119 → brak', r100c.przewaga === 'brak', r100c.przewaga);
  check('dwie strony po zero → brak', compareMilitaryStrength(side('A', 0), side('B', 0)).przewaga === 'brak');
  check('B = 0, A > 0 → przewaga A, stosunek Infinity',
    compareMilitaryStrength(side('A', 5), side('B', 0)).przewaga === 'A' &&
    compareMilitaryStrength(side('A', 5), side('B', 0)).stosunek === Infinity);
}

// ---------------------------------------------------------------------------
console.log('(e) symetria A↔B');
{
  const grid = [0, 1, 7, 50, 99, 100, 101, 119, 120, 121, 333, 1000];
  let ok = true;
  let firstBad = '';
  for (const a of grid) {
    for (const b of grid) {
      const ab = compareMilitaryStrength(side('A', a, 3), side('B', b, 3));
      const ba = compareMilitaryStrength(side('B', b, 3), side('A', a, 3));
      const swapped = ab.przewaga === 'brak' ? 'brak' : (ab.przewaga === 'A' ? 'B' : 'A');
      const okPrzewaga = ba.przewaga === swapped;
      const okStosunek = (ab.stosunek === Infinity && ba.stosunek === 0) ||
        (ab.stosunek === 0 && ba.stosunek === Infinity) ||
        (a === 0 && b === 0 && ab.stosunek === 1 && ba.stosunek === 1) ||
        near(ab.stosunek * ba.stosunek, 1);
      const okSilniejszy = ab.silniejszyId === ba.silniejszyId;
      if (!(okPrzewaga && okStosunek && okSilniejszy)) { ok = false; firstBad = firstBad || `a=${a} b=${b}`; }
    }
  }
  check('zamiana A↔B odwraca przewagę, odwraca stosunek i nie zmienia silniejszegoId', ok, firstBad);
}

// ---------------------------------------------------------------------------
console.log('(f) remis rozstrzygnięty deterministycznie');
{
  const r1 = compareMilitaryStrength(side('b', 100, 10), side('a', 100, 10));
  const r2 = compareMilitaryStrength(side('a', 100, 10), side('b', 100, 10));
  check('równa siła i armia → mniejszy id (a) przy obu kolejnościach',
    r1.silniejszyId === 'a' && r2.silniejszyId === 'a', `${r1.silniejszyId}/${r2.silniejszyId}`);
  check('równa siła, równa armia → brak przewagi (remis nie daje przewagi)', r1.przewaga === 'brak');
  const r3 = compareMilitaryStrength(side('z', 100, 30), side('a', 100, 10));
  const r4 = compareMilitaryStrength(side('a', 100, 10), side('z', 100, 30));
  check('równa siła → wyższa suma armii wygrywa (z) niezależnie od id',
    r3.silniejszyId === 'z' && r4.silniejszyId === 'z', `${r3.silniejszyId}/${r4.silniejszyId}`);
}

// ---------------------------------------------------------------------------
console.log('(g) parametry z JSON; brak magicznych liczb progu w kodzie; brak importu silnika');
{
  const raw = JSON.parse(fs.readFileSync(PARAMS_JSON, 'utf8'));
  const loaded = loadMilitaryStrengthParams();
  check('loadMilitaryStrengthParams czyta pole wartosc z JSON',
    loaded.progPrzewagiProc === raw.progPrzewagiProc.wartosc &&
    loaded.wagaBitew === raw.wagaBitew.wartosc &&
    loaded.trybutBonusProc === raw.trybutBonusProc.wartosc &&
    loaded.trybutBonusTur === raw.trybutBonusTur.wartosc);
  check('każdy parametr ma niepusty opis po polsku',
    ['progPrzewagiProc', 'wagaBitew', 'trybutBonusProc', 'trybutBonusTur'].every((k) => typeof raw[k].opis === 'string' && raw[k].opis.length > 20));
  check('wartości przypięte: próg 20, waga bitew 1, trybut 10%/10 tur',
    P.progPrzewagiProc === 20 && P.wagaBitew === 1 && P.trybutBonusProc === 10 && P.trybutBonusTur === 10,
    JSON.stringify(P));

  const src = fs.readFileSync(TS_FILE, 'utf8');
  const magic = src.split('\n').filter((l) => /(?<![\d.])(1\.2|0\.2|1\.1)(?![\d])/.test(l));
  check('brak literałów 1.2 / 0.2 / 1.1 w diplomacy-military-strength.ts', magic.length === 0, magic.join(' | '));
  const imports = src.split('\n').filter((l) => /^\s*(import|export)\b.*from\s+'/.test(l));
  const nonJson = imports.filter((l) => !/\.json'/.test(l));
  check('moduł importuje tylko JSON (brak importu silnika gry)', nonJson.length === 0, nonJson.join(' | '));
}

// ---------------------------------------------------------------------------
console.log('(h) mutacja progu w parametrach musi czerwienić przypadki (d)');
{
  // Zestaw przypadków (d) z oczekiwanym wynikiem; zwraca liczbę niezgodności.
  const countD = (params) => {
    const exp = [[119, 100, 'brak'], [120, 100, 'A'], [100, 120, 'B'], [100, 119, 'brak']];
    let bad = 0;
    for (const [a, b, want] of exp) {
      if (compareMilitaryStrength(side('A', a), side('B', b), params).przewaga !== want) bad++;
    }
    return bad;
  };
  // Mutacja idzie przez tę samą ścieżkę co odczyt z JSON (loadMilitaryStrengthParams na surowym obiekcie JSON).
  const raw = JSON.parse(fs.readFileSync(PARAMS_JSON, 'utf8'));
  const mutated = (wartosc) => {
    const r = JSON.parse(JSON.stringify(raw));
    r.progPrzewagiProc.wartosc = wartosc;
    return loadMilitaryStrengthParams(r);
  };
  check('bez mutacji: przypadki (d) zgodne z oczekiwaniem', countD(P) === 0, `niezgodnosci=${countD(P)}`);
  for (const v of [25, 30]) {
    const bad = countD(mutated(v));
    check(`mutacja progu na ${v}% czerwieni (d)`, bad > 0, `niezgodnosci=${bad}`);
  }
}

// ---------------------------------------------------------------------------
console.log('');
console.log(`RESULT: ${pass} PASS / ${fail} FAIL`);
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
