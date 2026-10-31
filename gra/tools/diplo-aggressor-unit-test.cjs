'use strict';
/**
 * diplo-aggressor-unit-test.cjs — R-WEB-WAR-AGGRESSOR-FLAG-Q1 (czyste funkcje flagi agresora).
 * Run: node tools/diplo-aggressor-unit-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', '.dip-aggressor-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-aggressor-bundle.cjs');
const PARAMS = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'data', 'diplomacy-aggressor-params.json'), 'utf8'));

fs.writeFileSync(ENTRY, `export * from './game/diplomacy-aggressor';\n`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent' });
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
}
const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function eq(name, got, want) {
  const ok = Object.is(got, want) || JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

const T = PARAMS.flagaAgresora.trwaTur;
const T0 = 100;

// 1. Przyczyny: tylko 'bez_powodu' nadaje flagę.
eq('cause bez_powodu daje flage', M.czyDajeFlageAgresora('bez_powodu'), true);
eq('cause casus_belli bez flagi', M.czyDajeFlageAgresora('casus_belli'), false);
eq('cause wymuszona_epoka bez flagi', M.czyDajeFlageAgresora('wymuszona_epoka'), false);
eq('cause hamulec bez flagi', M.czyDajeFlageAgresora('hamulec'), false);

// 2. Nadanie flagi i okno trwania (N-1 / N / N+1 wokół końca).
let st = M.ustawFlageAgresora({}, 1, T0, 'bez_powodu');
eq('flaga zapisana', st['1'], T0 + T);
eq('aktywna w turze T0', M.czyAgresor(st, 1, T0), true);
eq('aktywna w T0+T-1 (N-1)', M.czyAgresor(st, 1, T0 + T - 1), true);
eq('nieaktywna w T0+T (N)', M.czyAgresor(st, 1, T0 + T), false);
eq('nieaktywna w T0+T+1 (N+1)', M.czyAgresor(st, 1, T0 + T + 1), false);
// ZAŁOŻENIE: stan nie przechowuje tury startu; zapytanie o turę sprzed nadania jest poza kontraktem.
eq('brak wpisu przed nadaniem = false', M.czyAgresor({}, 1, T0 - 1), false);

// 3. Brak flagi przy innych przyczynach (stan niezmieniony).
const st2 = M.ustawFlageAgresora({}, 2, T0, 'hamulec');
eq('hamulec nie zmienia stanu', st2, {});
eq('wymuszona nie zmienia stanu', M.ustawFlageAgresora({}, 2, T0, 'wymuszona_epoka'), {});
eq('casus_belli nie zmienia stanu', M.ustawFlageAgresora({}, 2, T0, 'casus_belli'), {});

// 4. Ponowne wypowiedzenie nie skraca okna; późniejsze je przedłuża.
const stA = M.ustawFlageAgresora(st, 1, T0 + 5, 'bez_powodu');
eq('kolejna wojna przedluza okno', stA['1'], T0 + 5 + T);
const stB = M.ustawFlageAgresora({ '1': 200 }, 1, T0, 'bez_powodu');
eq('pozniejszy koniec okna nie jest skracany', stB['1'], 200);

// 5. Niemutowalność: wejściowy stan nie zmieniony.
const base = {};
M.ustawFlageAgresora(base, 3, T0, 'bez_powodu');
eq('wejscie nie mutowane', base, {});

// 6. Wejścia nie-skończone są ignorowane (NaN guard).
eq('NaN tura ignorowana', M.ustawFlageAgresora({}, 1, NaN, 'bez_powodu'), {});
eq('NaN owner ignorowany', M.ustawFlageAgresora({}, NaN, T0, 'bez_powodu'), {});
eq('NaN tura czyAgresor = false', M.czyAgresor({ '1': 200 }, 1, NaN), false);
eq('brak wpisu czyAgresor = false', M.czyAgresor({}, 9, T0), false);

// 7. Wpływ na AI: mnożnik i delta progu (N-1/N/N+1 wokół flagi).
const W = PARAMS.wplywNaAI.willingnessAllyMnoznik;
const D = PARAMS.wplywNaAI.relacjaDeltaSojusz;
eq('mnoznik bez flagi = 1', M.mnoznikWillingnessAlly(false), 1);
eq('mnoznik z flaga', M.mnoznikWillingnessAlly(true), W);
eq('delta bez flagi = 0', M.deltaRelacjiSojusz(false), 0);
eq('delta z flaga', M.deltaRelacjiSojusz(true), D);
eq('willingness 0.8 -> 0.8*W z flaga', 0.8 * M.mnoznikWillingnessAlly(true), 0.8 * W);
eq('wartosci parametrow w zakresie', W > 0 && W < 1 && D < 0, true);

// 8. Casus belli: okno N tur, klucz kierunkowy, brak self-casus.
const CB = PARAMS.casusBelli.trwaTur;
const cb = M.ustawCasusBelli({}, 1, 2, T0);
eq('casus belli aktywny w T0', M.maCasusBelli(cb, 1, 2, T0), true);
eq('casus belli N-1', M.maCasusBelli(cb, 1, 2, T0 + CB - 1), true);
eq('casus belli N', M.maCasusBelli(cb, 1, 2, T0 + CB), false);
eq('casus belli kierunkowy (odwrotnie)', M.maCasusBelli(cb, 2, 1, T0), false);
eq('casus belli self ignorowany', M.ustawCasusBelli({}, 1, 1, T0), {});
eq('casus belli NaN ignorowany', M.ustawCasusBelli({}, 1, 2, NaN), {});

// 9. Serializacja / save-load: roundtrip i odporność na śmieci.
const sv = M.serializujMape({ '1': 120, '2': NaN, '3': 'x', '4': Infinity });
eq('serializacja odrzuca NaN/Inf/string', sv, { '1': 120 });
eq('wczytanie undefined = pusty', M.wczytajMape(undefined), {});
eq('wczytanie null = pusty', M.wczytajMape(null), {});
eq('wczytanie tablicy = pusty', M.wczytajMape([1, 2]), {});
eq('wczytanie stringa = pusty', M.wczytajMape('abc'), {});
const roundtrip = M.wczytajMape(JSON.parse(JSON.stringify(M.serializujMape(st))));
eq('roundtrip flagi zachowany', roundtrip, st);

console.log(`diplo-aggressor-unit-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
