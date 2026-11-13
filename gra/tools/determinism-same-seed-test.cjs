'use strict';
/**
 * R-WEB-DETERMINISM-GAME-RNG-Q1: test determinizmu tego samego ziarna.
 *
 * Uzycie: node tools/determinism-same-seed-test.cjs   (z gra/; exit 0 = PASS, 1 = FAIL)
 *
 * CZESCI:
 *  A. Generator z ziarnem (gra/src/game/game-rng.ts): ten sam (ziarno, tura, salt, owner) => ten sam ciag;
 *     inna tura / salt / ziarno => inny ciag.
 *  B. REGULA ZRODLA: brak `Math.random` w gra/src/game/** poza WYJATKAMI. Kazdy wyjatek ma klucz
 *     (plik + tresc linii, bez numeru linii — odporny na edycje) i uzasadnienie. Wyjatek bez trafienia
 *     (stale) tez czerwieni test, wiec lista nie rozjezdza sie z kodem.
 *  C. gra/src/main.ts: pozostale `Math.random` w kodzie (nie komentarzach) to WYLACZNIE dwa miejsca poza
 *     petla tury: losowe ziarno nowej gry (SEED startowe i newSeed przy nowej grze). Kazde inne = FAIL.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const GAME_DIR = path.join(GRA, 'src', 'game');
const MAIN_TS = path.join(GRA, 'src', 'main.ts');
const ENTRY = path.join(__dirname, '.determinism-same-seed-entry.ts');
const BUNDLE = path.join(__dirname, '.determinism-same-seed-bundle.cjs');

let failed = 0;
function check(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' — ' + detail : ''));
  if (!ok) failed++;
}

// ---- A. generator z ziarnem ------------------------------------------------
fs.writeFileSync(ENTRY, "export { gameStreamRng, gameIdSuffix } from '../src/game/game-rng';\n", 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent' });
const R = require(BUNDLE);
const take = (f, n) => Array.from({ length: n }, () => f());
const a1 = take(R.gameStreamRng(2222, 25, 'scout-auto-explore', 0), 50);
const a2 = take(R.gameStreamRng(2222, 25, 'scout-auto-explore', 0), 50);
check('A1 ten sam (ziarno,tura,salt,owner) => identyczny ciag', JSON.stringify(a1) === JSON.stringify(a2));
check('A2 inna tura => inny ciag', JSON.stringify(a1) !== JSON.stringify(take(R.gameStreamRng(2222, 26, 'scout-auto-explore', 0), 50)));
check('A3 inny salt => inny ciag', JSON.stringify(a1) !== JSON.stringify(take(R.gameStreamRng(2222, 25, 'cs-war-cluster', 0), 50)));
check('A4 inne ziarno => inny ciag', JSON.stringify(a1) !== JSON.stringify(take(R.gameStreamRng(2223, 25, 'scout-auto-explore', 0), 50)));
check('A5 wartosci w [0,1)', a1.every((v) => v >= 0 && v < 1));
const ids = new Set(Array.from({ length: 500 }, (_, i) => R.gameIdSuffix(2222, 25, 'prod_', i + 1)));
check('A6 sufiksy ID unikalne w przebiegu (500 kolejnych seq)', ids.size === 500, 'unikalnych=' + ids.size);
check('A7 sufiks ID powtarzalny', R.gameIdSuffix(2222, 25, 'prod_', 7) === R.gameIdSuffix(2222, 25, 'prod_', 7));

// ---- B. regula zrodla: brak Math.random w gra/src/game/** ----------------
// Klucz wyjatku = "<plik wzgledem src/game>|<tresc linii po trim>". Uzasadnienie w wartosci.
// Lista jawna wyjatkow. Wartosci = uzasadnienie + status wplywu na stan.
const WYJATKI = {
  'city-founding.ts|rand: () => number = Math.random,':
    'parametr domyslny pickSourceCityForFounding; wywolanie z ai.ts:3215 podaje rand (aiFoundingRand). Wplyw na stan: tak, tylko gdy wolajacy nie podaje rand (brak takiego wywolania w kodzie gry).',
  'city-founding.ts|const rand = opts?.rand ?? Math.random;':
    'domyslny rand w evaluateFoundCityAffordance; ai.ts:3215 podaje rand. Wplyw na stan: tylko bez rand (brak w kodzie gry).',
  'city-state-difficulty.ts|rng: () => number = Math.random,':
    'resolveClusterCityStateWarOnPlayer (line ~120) i shouldCityStateRollWarOnPlayer (line ~146): main.ts podaje gameStreamRng (klaster wojny). Domyslny nieuzywany w grze.',
  'scout-auto-explore.ts|rng: () => number = Math.random,':
    'advanceScoutAutoExplore (~211) i runScoutsAutoExplore (~263): main.ts podaje gameStreamRng; wywolanie advanceScoutAutoExplore z runScoutsAutoExplore przekazuje rng. Domyslny tylko dla testow.',
  'ai-cs-absorption.ts|rng: () => number = Math.random,':
    'rollAiCsAccept: main.ts (trybut/wasal) podaje gameStreamRng(cs-accept). Domyslny tylko dla testow. Wplyw na stan: tak, gdy brak rng.',
  'combat.ts|const rng = opts.rng ?? (() => Math.random());':
    'resolveCombat: wolajacy w gra/src bez rng = battleScene.ts:20795 (skip-resolve "Pomin", zmienia wynik) i battle/manualBattle.ts:1062 (bitwa reczna). Wplyw na stan: TAK. Poza allowlista tego tematu (battleScene = zakaz; manualBattle spoza allowlisty). Kandydat do osobnego tematu.',
  'siege.ts|const rng = opts.rng ?? (() => Math.random());':
    'resolveSiegeAttack: brak wolajacych w gra/src (wolajacy tylko w tools/*.cjs, testy). Wplyw na stan w grze: brak (martwa domyslna sciezka). Pozostaje jako zabezpieczenie API.',
  'auto-battle-power.ts|const rng = input.rng ?? Math.random;':
    'resolveAutoBattleByPower: domyslny rng tylko dla wolajacych BEZ rng (testy). Wszystkie wolania w gra/src podaja rng (kontrola D1/D2). Wplyw na stan w grze: brak od R-WEB-DETERMINISM-AUTO-BATTLE-RNG-Q1.',
};

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}
const isCodeLine = (t) => t && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*') && /Math\.random/.test(t);

const found = new Map(); // klucz -> liczba trafien
const foundLines = [];
for (const f of walk(GAME_DIR, [])) {
  const rel = path.relative(GAME_DIR, f).split(path.sep).join('/');
  fs.readFileSync(f, 'utf8').split('\n').forEach((raw, i) => {
    const t = raw.trim();
    if (!isCodeLine(t)) return;
    const key = rel + '|' + t;
    found.set(key, (found.get(key) || 0) + 1);
    foundLines.push(rel + ':' + (i + 1) + ' ' + t);
  });
}
const unexpected = [...found.keys()].filter((k) => !(k in WYJATKI));
const stale = Object.keys(WYJATKI).filter((k) => !found.has(k));
check('B1 brak nieuzasadnionego Math.random w gra/src/game/**', unexpected.length === 0,
  unexpected.length ? 'NIEOCZEKIWANE: ' + unexpected.join(' ;; ') : 'trafien=' + foundLines.length + ', wyjatkow=' + Object.keys(WYJATKI).length);
check('B2 kazdy wyjatek nadal istnieje w kodzie (brak stale)', stale.length === 0, stale.length ? 'NIEAKTUALNE: ' + stale.join(' ;; ') : '');
console.log('--- lista Math.random w gra/src/game/** (plik:linia, wyjatek?, uzasadnienie) ---');
for (const l of foundLines) {
  const rel = l.split(':')[0];
  const t = l.slice(l.indexOf(' ') + 1);
  const k = rel + '|' + t;
  console.log('  ' + l + '  [' + (k in WYJATKI ? 'WYJATEK: ' + WYJATKI[k] : 'NIEDOZWOLONE') + ']');
}

// ---- C. main.ts: tylko start nowej gry poza petla tury --------------------
const mainLines = fs.readFileSync(MAIN_TS, 'utf8').split('\n');
const mainHits = mainLines
  .map((raw, i) => ({ t: raw.trim(), i: i + 1 }))
  .filter((x) => !x.t.startsWith('//') && !x.t.startsWith('*') && !x.t.startsWith('/*') && /Math\.random/.test(x.t));
const MAIN_ALLOWED = [
  'const SEED = (typeof location',
  'const newSeed = params.seed > 0 ? params.seed : Math.floor(Math.random() * 1e9);',
];
const mainBad = mainHits.filter((h) => !MAIN_ALLOWED.some((a) => h.t.startsWith(a)));
check('C1 main.ts: Math.random tylko w starcie nowej gry (SEED, newSeed)', mainBad.length === 0 && mainHits.length === 2,
  mainBad.length ? 'NIEDOZWOLONE: ' + mainBad.map((h) => h.i + ' ' + h.t).join(' ;; ') : 'trafien=' + mainHits.length + ' (oczekiwane 2)');

// ---- D. walka automatyczna (resolveAutoBattleByPower) z ziarnem gry ---------
// D1: kazde wolanie resolveAutoBattleByPower({...}) w gra/src podaje klucz rng (bez Math.random w grze).
// D2: main.ts wiaze strumien z ziarnem (autoBattleRng) i przekazuje go do mapFieldBattle.
const SRC_DIR = path.join(GRA, 'src');
const CALL_HEAD = 'resolveAutoBattleByPower(';
// Dopasowanie nawiasow zamiast regex [^}]*: obsluguje zagniezdzone klamry i nawiasy w argumentach.
function callArgs(txt, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < txt.length; i++) {
    const c = txt[i];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return txt.slice(openIdx + 1, i); }
  }
  return null;
}
const autoCalls = [];
for (const f of walk(SRC_DIR, [])) {
  const txt = fs.readFileSync(f, 'utf8');
  let idx = -1;
  while ((idx = txt.indexOf(CALL_HEAD, idx + 1)) !== -1) {
    // pomin definicje (function resolveAutoBattleByPower) i import
    const before = txt.slice(Math.max(0, idx - 9), idx);
    if (/function\s*$/.test(before) || /import\s*\{[^}]*$/.test(txt.slice(Math.max(0, idx - 200), idx))) continue;
    const args = callArgs(txt, idx + CALL_HEAD.length - 1);
    if (args === null) continue;
    const line = txt.slice(0, idx).split('\n').length;
    // ZRODLO: rng musi byc strumieniem z ziarna gry (autoBattleRng lub deps.autoBattleRng?.), nie dowolnym kluczem
    const rngM = /\brng\s*:\s*([^,}]*)/.exec(args);
    const good = !!rngM && /(^|[.\s])autoBattleRng\??\.?\(/.test(rngM[1]) && !/Math\.random/.test(rngM[1]);
    autoCalls.push({ where: path.relative(GRA, f) + ':' + line, bare: !good });
  }
}
const bareCalls = autoCalls.filter((c) => c.bare);
check('D1 kazde wolanie resolveAutoBattleByPower w gra/src podaje rng = autoBattleRng(...) (strumien z ziarna)', autoCalls.length >= 6 && bareCalls.length === 0,
  bareCalls.length ? 'RNG NIE Z ZIARNA: ' + bareCalls.map((c) => c.where).join(', ') : 'wolan=' + autoCalls.length + ' (oczekiwane >= 6)');
const mainTxt = fs.readFileSync(MAIN_TS, 'utf8');
const mfbDeps = mainTxt.slice(mainTxt.indexOf('const mapFieldBattleDeps = {'), mainTxt.indexOf('const mapFieldBattleDeps = {') + 400);
check('D2 main.ts: autoBattleRng z ziarna gry wiazany i przekazany do mapFieldBattleDeps',
  /autoBattleRng\(defQ/.test(mainTxt) && /gameStreamRng\(_gameSeed, turn, 'auto-battle:'/.test(mainTxt) && mfbDeps.includes('autoBattleRng:'),
  mfbDeps.includes('autoBattleRng:') ? '' : 'brak autoBattleRng w mapFieldBattleDeps');

console.log(failed === 0 ? 'WYNIK: PASS' : 'WYNIK: FAIL (' + failed + ')');
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* sprzatanie best-effort */ }
process.exit(failed === 0 ? 0 : 1);
