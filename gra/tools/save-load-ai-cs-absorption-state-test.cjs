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
    // T1: wpis zapisu = DOKLADNIE cala mapa (zakonczona przecinkiem, bez .slice/.filter); wzorzec kotwiczony na `,` po `entries()`.
    r['T1 zapis ' + f] = new RegExp(`\\b${f}:\\s*Array\\.from\\(${f}\\.entries\\(\\)\\)\\s*,`).test(src);
    // T2: w restore (po DRUGIM clear, czyli poczatku restoreGameFromSave) odczyt saved.meta.<pole> i set() z tego odczytu,
    // kolejnosc clear -> odczyt -> set (sprawdzana indeksami, nie samym wystapieniem).
    const clears = [];
    const reClear = new RegExp(`\\b${f}\\.clear\\(\\)`, 'g');
    let m;
    while ((m = reClear.exec(src)) !== null) clears.push(m.index);
    const clearIdx = clears.length >= 2 ? clears[1] : -1;
    const readIdx = clearIdx >= 0 ? src.indexOf(`saved.meta?.${f}`, clearIdx) : -1;
    const setIdx = readIdx >= 0 ? src.indexOf(`${f}.set(`, readIdx) : -1;
    r['T2 restore ' + f] = readIdx >= 0 && setIdx > readIdx && setIdx - readIdx < 400;
    // T3: co najmniej DWA wywolania .clear() (reset swiata + poczatek restore) -- kazde poza definicja mapy
    r['T3 clear x2 ' + f] = clears.length >= 2;
  }
  return r;
}

let pass = 0; let fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };

const base = check(SRC);
for (const [k, v] of Object.entries(base)) ok(v, k);

// MUTACJE: 18 = 6 mutacji x (3 mapy): wyciety zapis, zapis slice(0,0), wyciete odtworzenie, czyszczenie przy resecie/wczytaniu, czyszczenie po odtworzeniu. Czyszczenie ma 2 wystapienia na mape:
// n=0 -> reset swiata (ponowna gra), n=1 -> poczatek restoreGameFromSave (wczytanie).
const removeNth = (s, needle, n) => {
  let idx = -1;
  for (let i = 0; i <= n; i++) { idx = s.indexOf(needle, idx + 1); if (idx < 0) return s; }
  return s.slice(0, idx) + s.slice(idx + needle.length);
};
const mutate = {};
for (const f of FIELDS) {
  mutate[`T4 wyciety zapis ${f}`] = (s) => s.replace(`${f}: Array.from(${f}.entries()),`, '');
  mutate[`T4 wyciete odtworzenie ${f}`] = (s) => s.replace(`saved.meta?.${f} as`, `saved.meta?.NIEISTNIEJACE_${f} as`);
  mutate[`T4 wyciete czyszczenie przy resecie ${f}`] = (s) => removeNth(s, `${f}.clear();`, 0);
  mutate[`T4 wyciete czyszczenie przy wczytaniu ${f}`] = (s) => removeNth(s, `${f}.clear();`, 1);
  // semantyczna: zapis obciety do pustej tablicy (regex prefiksowy T1 bez kotwicy `,` przepuszczal to; dowod: mutacja M2 z r2)
  mutate[`T4 zapis obciety slice(0,0) ${f}`] = (s) => s.replace(`${f}: Array.from(${f}.entries()),`, `${f}: Array.from(${f}.entries()).slice(0, 0),`);
  // semantyczna: odtworzenie PRZED czyszczeniem w restore (kolejnosc clear->odczyt->set)
  mutate[`T4 czyszczenie po odtworzeniu ${f}`] = (s) => {
    const needle = `${f}.clear();`;
    const first = s.indexOf(needle);
    const second = s.indexOf(needle, first + 1);
    const st = second < 0 ? -1 : s.indexOf(`${f}.set(`, s.indexOf(`saved.meta?.${f}`, second));
    if (st < 0) return s;
    const t = s.slice(0, second) + s.slice(second + needle.length); // usun drugie clear (poczatek restore)
    const at = st - needle.length; // pozycja `.set(` po skroceniu
    return t.slice(0, at) + needle + ' ' + t.slice(at); // wstaw clear tuz przed set (po odczycie)
  };
}
for (const [name, fn] of Object.entries(mutate)) {
  const m = fn(SRC);
  if (m === SRC) { fail++; console.log('FAIL', name, '-- mutacja nic nie zmienila (nieaktualny wzorzec)'); continue; }
  const rm = check(m);
  ok(Object.values(rm).some((v) => !v), name + ' -> test czerwienieje (' + Object.entries(rm).filter(([, v]) => !v).map(([k]) => k).join(', ') + ')');
}
console.log(`\nWYNIK: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
