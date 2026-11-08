'use strict';
/**
 * diplo-aggressor-unit-test.cjs — R-WEB-WAR-AGGRESSOR-FLAG-Q1 (flaga agresora, casus belli, wpływ na AI).
 * Run: node tools/diplo-aggressor-unit-test.cjs
 *
 * Sekcje 1-9: czyste funkcje modułu (src/game/diplomacy-aggressor.ts).
 * Sekcja 10: przyczyna wypowiedzenia (wszystkie gałęzie) + scenariusze na stanie modułu.
 * Sekcja 11: silnik AI — REALNE aiDiplomacyStance (src/game/diplomacy.ts): mnożnik i próg N-1/N/N+1.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', '.dip-aggressor-entry.ts');
const ENTRY_ENGINE = path.resolve(ROOT, 'src', '.dip-aggressor-engine-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-aggressor-bundle.cjs');
const BUNDLE_ENGINE = path.resolve(__dirname, '.dip-aggressor-engine-bundle.cjs');
const PARAMS = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'data', 'diplomacy-aggressor-params.json'), 'utf8'));

fs.writeFileSync(ENTRY, `export * from './game/diplomacy';\n`);
fs.writeFileSync(ENTRY_ENGINE, `export { aiDiplomacyStance, relationScore } from './game/diplomacy';\nexport { TypCywilizacji } from './types/player';\n`);
// (moduł flagi agresora mieszka w gra/src/game/diplomacy.ts — sekcja na końcu pliku)
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent' });
  esbuild.buildSync({ entryPoints: [ENTRY_ENGINE], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE_ENGINE, logLevel: 'silent' });
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
  try { fs.unlinkSync(ENTRY_ENGINE); } catch (_) { /* ignore */ }
}
const M = require(BUNDLE);
const E = require(BUNDLE_ENGINE);

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
eq('cause wymuszona_inna bez flagi', M.czyDajeFlageAgresora('wymuszona_inna'), false);

// 2. Nadanie flagi i okno trwania (N-1 / N / N+1 wokół końca).
let st = M.ustawFlageAgresora({}, 1, T0, 'bez_powodu');
eq('flaga zapisana', st['1'], T0 + T);
eq('aktywna w turze T0', M.czyAgresor(st, 1, T0), true);
eq('aktywna w T0+T-1 (N-1)', M.czyAgresor(st, 1, T0 + T - 1), true);
eq('nieaktywna w T0+T (N)', M.czyAgresor(st, 1, T0 + T), false);
eq('nieaktywna w T0+T+1 (N+1)', M.czyAgresor(st, 1, T0 + T + 1), false);
eq('brak wpisu = false', M.czyAgresor({}, 1, T0 - 1), false);

// 3. Brak flagi przy innych przyczynach (stan niezmieniony).
const st2 = M.ustawFlageAgresora({}, 2, T0, 'hamulec');
eq('hamulec nie zmienia stanu', st2, {});
eq('wymuszona nie zmienia stanu', M.ustawFlageAgresora({}, 2, T0, 'wymuszona_epoka'), {});
eq('wymuszona_inna nie zmienia stanu', M.ustawFlageAgresora({}, 2, T0, 'wymuszona_inna'), {});
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

// 7. Wpływ na AI: mnożnik i delta progu (wartości z JSON).
const W = PARAMS.wplywNaAI.willingnessAllyMnoznik;
const D = PARAMS.wplywNaAI.relacjaDeltaSojusz;
eq('mnoznik bez flagi = 1', M.mnoznikWillingnessAlly(false), 1);
eq('mnoznik z flaga', M.mnoznikWillingnessAlly(true), W);
eq('delta bez flagi = 0', M.deltaRelacjiSojusz(false), 0);
eq('delta z flaga', M.deltaRelacjiSojusz(true), D);
eq('willingness 0.8 -> 0.8*W z flaga', 0.8 * M.mnoznikWillingnessAlly(true), 0.8 * W);
eq('mnoznik w (0,1) i delta dodatnia (prog wyzej)', W > 0 && W < 1 && D > 0, true);

// 8. Casus belli: okno N tur, klucz kierunkowy, brak self-casus.
const CB = PARAMS.casusBelli.trwaTur;
const cb = M.ustawCasusBelli({}, 1, 2, T0);
eq('casus belli aktywny w T0', M.maCasusBelli(cb, 1, 2, T0), true);
eq('casus belli N-1', M.maCasusBelli(cb, 1, 2, T0 + CB - 1), true);
eq('casus belli N', M.maCasusBelli(cb, 1, 2, T0 + CB), false);
eq('casus belli kierunkowy (odwrotnie)', M.maCasusBelli(cb, 2, 1, T0), false);
// Format klucza jest zapisywany w SaveGame.meta.casusBelliUntilByPair — kontrakt zapisu.
eq('klucz casus belli = requester>target (kontrakt zapisu)', M.casusBelliKey(1, 2), '1>2');
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
const cbRound = M.wczytajMape(JSON.parse(JSON.stringify(M.serializujMape(cb))));
eq('roundtrip casus belli zachowany', cbRound, cb);
eq('wczytanie zsanitowane (smieci odrzucone)', M.wczytajMape({ '1': 'x', '2': 5, '3': NaN }), { '2': 5 });

// 10a. Przyczyna wypowiedzenia: wszystkie gałęzie i priorytety.
eq('przyczyna: nic = bez_powodu', M.przyczynaWypowiedzenia({}), 'bez_powodu');
eq('przyczyna: casus = casus_belli', M.przyczynaWypowiedzenia({ casusBelliAktywny: true }), 'casus_belli');
eq('przyczyna: epoka = wymuszona_epoka', M.przyczynaWypowiedzenia({ wymuszonaEpoka: true }), 'wymuszona_epoka');
eq('przyczyna: inna wymuszona = wymuszona_inna', M.przyczynaWypowiedzenia({ wymuszonaInna: true }), 'wymuszona_inna');
eq('przyczyna: hamulec = hamulec', M.przyczynaWypowiedzenia({ hamulec: true }), 'hamulec');
eq('priorytet: hamulec > casus', M.przyczynaWypowiedzenia({ hamulec: true, casusBelliAktywny: true }), 'hamulec');
eq('priorytet: epoka > casus', M.przyczynaWypowiedzenia({ wymuszonaEpoka: true, casusBelliAktywny: true }), 'wymuszona_epoka');
eq('priorytet: inna > casus', M.przyczynaWypowiedzenia({ wymuszonaInna: true, casusBelliAktywny: true }), 'wymuszona_inna');

// 10b. Scenariusze na stanie modułu (te same wywołania co main.ts).
M.resetStanAgresora();
eq('reset: brak flagi', M.czyAgresorAktywny(1, T0), false);
// (a) wypowiedzenie bez casus belli -> flaga.
M.zarejestrujWypowiedzenie(1, T0, M.przyczynaWypowiedzenia({ casusBelliAktywny: M.maCasusBelliAktywne(1, 2, T0) }));
eq('scenariusz a: flaga po wojnie bez powodu', M.czyAgresorAktywny(1, T0 + 1), true);
eq('scenariusz a: doTuryFlagi', M.doTuryFlagiAgresora(1, T0 + 1), T0 + T);
eq('scenariusz a: brak flagi po N', M.doTuryFlagiAgresora(1, T0 + T), undefined);
// (b) odmowa trybutu -> casus belli 2>1, potem wypowiedzenie 2->1 bez flagi.
M.zarejestrujCasusBelli(2, 1, T0);
eq('scenariusz b: casus belli po odmowie', M.maCasusBelliAktywne(2, 1, T0 + 1), true);
M.zarejestrujWypowiedzenie(2, T0 + 1, M.przyczynaWypowiedzenia({ casusBelliAktywny: M.maCasusBelliAktywne(2, 1, T0 + 1) }));
eq('scenariusz b: wojna z casus belli NIE daje flagi', M.czyAgresorAktywny(2, T0 + 2), false);
// (c) hamulec / wymuszona epoka / wymuszona inna -> brak flagi.
M.zarejestrujWypowiedzenie(3, T0, 'hamulec');
M.zarejestrujWypowiedzenie(4, T0, 'wymuszona_epoka');
M.zarejestrujWypowiedzenie(5, T0, 'wymuszona_inna');
eq('scenariusz c: hamulec bez flagi', M.czyAgresorAktywny(3, T0), false);
eq('scenariusz c: wymuszona epoka bez flagi', M.czyAgresorAktywny(4, T0), false);
eq('scenariusz c: wymuszona inna bez flagi', M.czyAgresorAktywny(5, T0), false);
// (d) casus belli wygasa po N turach -> kolejne wypowiedzenie daje flagę.
M.zarejestrujWypowiedzenie(2, T0 + CB, M.przyczynaWypowiedzenia({ casusBelliAktywny: M.maCasusBelliAktywne(2, 1, T0 + CB) }));
eq('scenariusz d: po wygasnieciu casus belli flaga', M.czyAgresorAktywny(2, T0 + CB + 1), true);
// (e) stan wychodzi/wchodzi przez zapis (roundtrip modułu).
const snapA = M.pobierzStanAgresorow();
const snapC = M.pobierzStanCasusBelli();
M.resetStanAgresora();
eq('save: po resecie brak flagi', M.czyAgresorAktywny(1, T0 + 1), false);
M.ustawStanAgresorow(M.wczytajMape(JSON.parse(JSON.stringify(snapA))));
M.ustawStanCasusBelli(M.wczytajMape(JSON.parse(JSON.stringify(snapC))));
eq('load: flaga przywrócona', M.czyAgresorAktywny(1, T0 + 1), true);
eq('load: casus belli przywrócony', M.maCasusBelliAktywne(2, 1, T0 + 1), true);
M.resetStanAgresora();

// 11. Silnik AI: REALNE aiDiplomacyStance. Próg sojuszu bez flagi = progSojuszRelacja (151).
const P = { typCywilizacji: E.TypCywilizacji.Rzymianie };
const O = { typCywilizacji: E.TypCywilizacji.Grecy };
const ctx0 = { isMinorCiv: false, militaryRatio: 1, currentTurn: 100, turnsAtWar: 0 };
const ctxOn = { ...ctx0, celAgresorAktywny: true };
const rows = [];
for (let z = 0; z <= 100; z += 1) {
  for (let r = 0; r <= 100; r += 1) {
    const rel = { zaufanie: z, respekt: r, status: 'pokoj' };
    rows.push({
      s: E.relationScore(rel),
      off: E.aiDiplomacyStance(P, O, rel, ctx0).willingnessAlly,
      on: E.aiDiplomacyStance(P, O, rel, ctxOn).willingnessAlly,
    });
  }
}
const tOff = Math.min(...rows.filter(x => x.off > 0).map(x => x.s));
const tOn = Math.min(...rows.filter(x => x.on > 0).map(x => x.s));
eq('prog sojuszu bez flagi (progSojuszRelacja)', tOff, 151);
eq('prog sojuszu z flaga = bez flagi + delta z JSON', tOn - tOff, D);
// N-1 / N / N+1 wokół progu (tylko wartości osiągalne przez relationScore).
const atScore = (sc, key) => rows.filter(x => x.s === sc).map(x => x[key]);
eq('N-1 bez flagi: brak sojuszu', atScore(tOff - 1, 'off').every(v => v === 0), true);
eq('N bez flagi: sojusz możliwy', atScore(tOff, 'off').some(v => v > 0), true);
eq('N-1 z flaga (poniżej nowego progu): brak sojuszu', atScore(tOn - 1, 'on').every(v => v === 0), true);
eq('N z flaga (nowy próg): sojusz możliwy', atScore(tOn, 'on').some(v => v > 0), true);
eq('N+1 z flaga: sojusz możliwy', atScore(tOn + 1, 'on').some(v => v > 0), true);
// Mnożnik willingnessAlly: wynik z flagą = wynik bez flagi * W (tolerancja zaokrąglenia do 4 miejsc).
const pairs = rows.filter(x => x.off > 0 && x.on > 0);
const maxDev = Math.max(...pairs.map(x => Math.abs(x.on - Math.min(1, x.off * W))));
eq('mnoznik willingnessAlly ~ W (blad <= 0.0002)', maxDev <= 0.0002, true);
// Brak flagi = identyczny wynik jak bez pola (regresja).
const relReg = { zaufanie: 100, respekt: 60, status: 'pokoj' };
eq('bez flagi = wynik jak przed zmiana (pole nieobecne)', E.aiDiplomacyStance(P, O, relReg, ctx0).willingnessAlly, E.aiDiplomacyStance(P, O, relReg, { ...ctx0, celAgresorAktywny: false }).willingnessAlly);

console.log(`diplo-aggressor-unit-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
