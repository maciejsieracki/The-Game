'use strict';
/**
 * save-load-ai-state-fields-test.cjs -- R-WEB-SAVE-STATE-FIX-Q1 (tag SAVESTATEFIX), FIX #1 i FIX #2.
 *
 * BLAD (audyt SAVEAUDIT, dokument dyspozycje/analizy/ZAPIS-STAN-AUDYT-2026-11-28.md, §3.1 i §3.4):
 *  - aiWonderStuckTurnsByOwner (licznik utykania cudu AI, steruje relaxedWonderCostThreshold) NIE byl
 *    zapisywany w meta i restoreGameFromSave zerowal go (clear) -> po wczytaniu cud AI opozniany o do 30 tur.
 *  - aiGarrisonUnitIdByOwner (typ garnizonu wybrany przez AI, steruje aiGarrisonGoldReserve) NIE byl
 *    zapisywany, NIE byl czyszczony przy resecie swiata ani przy wczytaniu (przeciek miedzy sesjami).
 *
 * TEST (tekstowy, w stylu save-load-ai-cs-absorption-state-test.cjs; zywy dowod w save-load-continuity-live.cjs):
 *  T1 zapis (buildSaveGameSnapshot, meta) niesie pole jako Array.from(<mapa>.entries()) -- kotwica na przecinku.
 *  T2 restoreGameFromSave: clear() PRZED odczytem saved.meta.<pole>, a set() po odczycie (bez przecieku sesji).
 *  T3 doStartGame (reset swiata) czysci mape.
 *  T4 MUTACJE: wyciety zapis, zapis obciety do pustej tablicy, wyciete odtworzenie, wyciete czyszczenie
 *     przy resecie, wyciete czyszczenie przy wczytaniu, czyszczenie po odtworzeniu -- kazda MUSI czerwienic test.
 *
 * Uruchom z gra/:  node tools/save-load-ai-state-fields-test.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
const FIELDS = ['aiWonderStuckTurnsByOwner', 'aiGarrisonUnitIdByOwner'];
// Dokladna forma petli odtworzenia (kolejnosc argumentow set(oid, wartosc) i warunek if(<zmienna>?.length)).
// Zapisane tu jako wzorce, zeby mutacje argumentow i strazy byly czerwone (audyt Evaluatora, zarzut 1).
const RESTORE_LOOP = {
  aiWonderStuckTurnsByOwner: {
    re: /if \(savedWonderStuck\?\.length\) \{\s*for \(const \[oid, t\] of savedWonderStuck\) aiWonderStuckTurnsByOwner\.set\(oid, t\);\s*\}/,
    line: 'if (savedWonderStuck?.length) {\n        for (const [oid, t] of savedWonderStuck) aiWonderStuckTurnsByOwner.set(oid, t);\n      }',
  },
  aiGarrisonUnitIdByOwner: {
    re: /if \(savedGarrisonUnit\?\.length\) \{\s*for \(const \[oid, uid\] of savedGarrisonUnit\) aiGarrisonUnitIdByOwner\.set\(oid, uid\);\s*\}/,
    line: 'if (savedGarrisonUnit?.length) {\n        for (const [oid, uid] of savedGarrisonUnit) aiGarrisonUnitIdByOwner.set(oid, uid);\n      }',
  },
};

// Wycinek ciala funkcji zaczynajacej sie od `header` (do nastepnej deklaracji funkcji na tym samym wcieciu).
function bodyOf(src, header) {
  const start = src.indexOf(header);
  if (start < 0) return '';
  const rest = src.slice(start + header.length);
  const m = rest.search(/\n {4}(async )?function /);
  return m < 0 ? src.slice(start) : src.slice(start, start + header.length + m);
}

function check(src) {
  const save = bodyOf(src, 'function buildSaveGameSnapshot(');
  const restore = bodyOf(src, 'function restoreGameFromSave(');
  const reset = bodyOf(src, 'async function doStartGame(');
  const r = {};
  for (const f of FIELDS) {
    // T1: zapis w meta = DOKLADNIE cala mapa, zakonczona przecinkiem (bez slice/filter).
    r['T1 zapis ' + f] = new RegExp(`\\b${f}:\\s*Array\\.from\\(${f}\\.entries\\(\\)\\)\\s*,`).test(save);
    // T2: w restore: clear() -> odczyt saved.meta.<pole> -> set() z odczytu (kolejnosc indeksami).
    const clr = restore.indexOf(`${f}.clear();`);
    const rd = clr >= 0 ? restore.indexOf(`saved.meta?.${f}`, clr) : -1;
    const st = rd >= 0 ? restore.indexOf(`${f}.set(`, rd) : -1;
    r['T2 restore clear->odczyt->set ' + f] = clr >= 0 && rd > clr && st > rd && st - rd < 400;
    // T2b: dokladna petla odtworzenia (straz if(<zmienna>?.length) + set(oid, wartosc) w tej kolejnosci).
    r['T2b petla odtworzenia (kolejnosc set, straz) ' + f] = RESTORE_LOOP[f].re.test(restore);
    // T3: reset swiata (doStartGame) czysci mape.
    r['T3 reset czysci ' + f] = reset.includes(`${f}.clear();`);
  }
  return r;
}

let pass = 0; let fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); } };

for (const [k, v] of Object.entries(check(SRC))) ok(v, k);

// Pomocnik: usun n-te (0-based) wystapienie needle.
const removeNth = (s, needle, n) => {
  let idx = -1;
  for (let i = 0; i <= n; i++) { idx = s.indexOf(needle, idx + 1); if (idx < 0) return s; }
  return s.slice(0, idx) + s.slice(idx + needle.length);
};

const mutate = {};
for (const f of FIELDS) {
  const clearNeedle = `${f}.clear();`;
  mutate[`wyciety zapis ${f}`] = (s) => s.replace(`${f}: Array.from(${f}.entries()),`, '');
  mutate[`zapis obciety slice(0,0) ${f}`] = (s) => s.replace(`${f}: Array.from(${f}.entries()),`, `${f}: Array.from(${f}.entries()).slice(0, 0),`);
  mutate[`wyciete odtworzenie ${f}`] = (s) => s.replace(`saved.meta?.${f} as`, `saved.meta?.NIEISTNIEJACE_${f} as`);
  mutate[`wyciete czyszczenie przy resecie ${f}`] = (s) => {
    // w doStartGame (reset): usun jedyne clear tej mapy w ciele doStartGame
    const body = bodyOf(s, 'async function doStartGame(');
    if (!body.includes(clearNeedle)) return s;
    return s.replace(body, body.replace(clearNeedle, ''));
  };
  mutate[`wyciete czyszczenie przy wczytaniu ${f}`] = (s) => {
    const body = bodyOf(s, 'function restoreGameFromSave(');
    const nb = body.replace(clearNeedle, '');
    return nb === body ? s : s.replace(body, nb);
  };
  // T2b mutacje: zamiana argumentow set, straz wylaczona, odtwarzanie kluczem zamiast wartoscia.
  const rl = RESTORE_LOOP[f];
  const swapped = rl.line.replace(/\.set\((oid), (t|uid)\)/, '.set($2, $1)');
  mutate[`zamiana argumentow set (wartosc, klucz) ${f}`] = (s) => s.replace(rl.line, swapped);
  mutate[`wylaczona straz if(false) ${f}`] = (s) => s.replace(rl.line, rl.line.replace(/if \(\w+\?\.length\)/, 'if (false)'));
  mutate[`petla bez zapisu wartosci (set(oid, oid)) ${f}`] = (s) => s.replace(rl.line, rl.line.replace(/\.set\(oid, (t|uid)\)/, '.set(oid, oid)'));
  mutate[`czyszczenie po odtworzeniu ${f}`] = (s) => {
    const body = bodyOf(s, 'function restoreGameFromSave(');
    const clr = body.indexOf(clearNeedle);
    const rd = clr >= 0 ? body.indexOf(`saved.meta?.${f}`, clr) : -1;
    if (rd < 0) return s;
    const without = body.slice(0, clr) + body.slice(clr + clearNeedle.length);
    const rd2 = without.indexOf(`saved.meta?.${f}`);
    const st = without.indexOf(`${f}.set(`, rd2);
    if (st < 0) return s;
    const nb = without.slice(0, st) + clearNeedle + ' ' + without.slice(st);
    return s.replace(body, nb);
  };
}

for (const [name, fn] of Object.entries(mutate)) {
  const m = fn(SRC);
  if (m === SRC) { fail++; console.log('FAIL', name, '-- mutacja nic nie zmienila (nieaktualny wzorzec)'); continue; }
  const rm = check(m);
  const red = Object.entries(rm).filter(([, v]) => !v).map(([k]) => k);
  ok(red.length > 0, `mutacja ${name} -> test czerwieni sie (${red.join(', ')})`);
}

// T5 (behawioralny, bez przegladarki): wejscie progu cudu zalezy od licznika. Licznik 12 odtworzony z zapisu
// musi dac prog 1,667 (nie 1,000 jak po samym clear()). Funkcja bundlowana z gra/src/game/ai.ts do katalogu
// tymczasowego poza repo (jak w save-state-audit-ablation.cjs).
const os = require('os');

// Wycinek zrodla funkcji relaxedWonderCostThreshold z gra/src/game/ai.ts (funkcja czysta, bez importow).
// Bez bundlowania calego ai.ts (ciagnie modul render -> three), ale z tym samym kodem, ktory gra wykonuje.
function loadRelax() {
  const aiSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'ai.ts'), 'utf8');
  const head = 'export function relaxedWonderCostThreshold(';
  const start = aiSrc.indexOf(head);
  if (start < 0) return null;
  const end = aiSrc.indexOf('\n}\n', start);
  if (end < 0) return null;
  // Usun adnotacje typow TS (sygnatura: parametry i typ zwrotu number); cialo nie ma innych adnotacji.
  const js = aiSrc.slice(start, end + 2).replace(/^export /, '').replace(/:\s*number/g, '');
  try {
    return new Function(js + '\nreturn relaxedWonderCostThreshold;')();
  } catch (e) {
    console.log('  diag T5:', String(e && e.message || e).slice(0, 300));
    return null;
  }
}

const relax = loadRelax();
if (typeof relax !== 'function') {
  fail++; console.log('FAIL T5 nie udalo sie wyciagnac relaxedWonderCostThreshold z ai.ts');
} else {
  const kept = relax(1, 12, 30);
  const reset = relax(1, 0, 30);
  ok(Math.abs(kept - 1.6667) < 1e-3, `T5 licznik 12 odtworzony -> prog ${kept.toFixed(4)} (oczekiwane 1,667)`);
  ok(reset === 1, `T5 licznik 0 (clear bez odtworzenia) -> prog ${reset} (oczekiwane 1,000)`);
  ok(Math.abs(kept - reset) > 0.5, 'T5 odtworzenie licznika zmienia prog (B!=A) -- sens FIX #1');
}
console.log(`\nWYNIK: ${pass} PASS / ${fail} FAIL`);
process.exit(fail ? 1 : 0);
