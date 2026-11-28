'use strict';
/**
 * save-load-ai-cs-absorption-state-test.cjs -- R-WEB-SAVE-LOAD-MATRIX-Q1 (SAVEMAT) r3.
 *
 * BLAD: zegary absorpcji miast-panstw przez AI (`aiCsTrybutSince`, `aiCsWasalSince`) i licznik odmow (`aiCsFailCount`) w main.ts
 * NIE byly zapisywane w zapisie ani odtwarzane przy wczytaniu. `decideAiCsClusterAction` (ai-cs-absorption.ts) czyta je (wasal_timer ->
 * annex, vassalFailBeforeWar). Po wczytaniu w trakcie absorpcji traktat (activeDeals) wracal, ale zegar nie -- AI "zapominalo" o trwajacym
 * wasalu, wchloniecie spoznialo sie i przebieg po wczytaniu rozjezdzal sie z ciaglym (zywy dowod: save-load-continuity-live.cjs
 * --cfg bunt --seed 7 --saves 7: przy zapisie 106 par trybut/wasal, po wczytaniu 0; B!=A 6/6 tur, 106 miast zmienia wlasciciela w A a nie w B).
 *
 * TEST (tekstowy, w stylu reszty bramek zapisu -- sam silnik wymaga przegladarki; zywy dowod w runnerze powyzej):
 *  T1 zapis (buildSaveGameSnapshot meta) niesie 3 pola z Array.from(<mapa>.entries()).
 *  T2 odtworzenie (restore) CZYSCI mape i wpisuje wartosci z saved.meta.<pole> (dla kazdej z 3 map).
 *  T3 reset swiata (nowa gra / przed restore) czysci 3 mapy (stan nie przezywa resetu).
 *  T4 MUTACJE: (a) wyciecie zapisu, (b) wyciecie odtworzenia, (c) wyciecie czyszczenia przy resecie -- kazda MUSI czerwienic test.
 * Uruchom z gra/:  node tools/save-load-ai-cs-absorption-state-test.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
const FIELDS = ['aiCsFailCount', 'aiCsTrybutSince', 'aiCsWasalSince'];

function check(src) {
  const r = {};
  for (const f of FIELDS) {
    r['T1 zapis ' + f] = new RegExp(`\\b${f}:\\s*Array\\.from\\(${f}\\.entries\\(\\)\\)`).test(src);
    r['T2 restore ' + f] = new RegExp(`saved\\.meta\\?\\.${f}\\b`).test(src)
      && new RegExp(`${f}\\.set\\(`).test(src.slice(src.indexOf(`saved.meta?.${f}`)));
    // T3: co najmniej DWA wywolania .clear() (reset swiata + poczatek restore) -- kazde poza definicja mapy
    r['T3 clear x2 ' + f] = (src.match(new RegExp(`\\b${f}\\.clear\\(\\)`, 'g')) || []).length >= 2;
  }
  return r;
}

let pass = 0; let fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };

const base = check(SRC);
for (const [k, v] of Object.entries(base)) ok(v, k);

// MUTACJE
const mutate = {
  'T4a wyciety zapis aiCsWasalSince': (s) => s.replace('aiCsWasalSince: Array.from(aiCsWasalSince.entries()),', ''),
  'T4b wyciete odtworzenie aiCsTrybutSince': (s) => s.replace('saved.meta?.aiCsTrybutSince', 'saved.meta?.NIEISTNIEJACE'),
  'T4c wyciete czyszczenie aiCsFailCount (oba clear)': (s) => s.split('aiCsFailCount.clear();').join(''),
};
for (const [name, fn] of Object.entries(mutate)) {
  const m = fn(SRC);
  if (m === SRC) { fail++; console.log('FAIL', name, '-- mutacja nic nie zmienila (nieaktualny wzorzec)'); continue; }
  const rm = check(m);
  ok(Object.values(rm).some((v) => !v), name + ' -> test czerwienieje (' + Object.entries(rm).filter(([, v]) => !v).map(([k]) => k).join(', ') + ')');
}
console.log(`\nWYNIK: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
