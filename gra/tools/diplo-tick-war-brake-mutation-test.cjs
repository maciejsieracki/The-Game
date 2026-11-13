'use strict';
/**
 * diplo-tick-war-brake-mutation-test.cjs — R-WEB-DIPLO-TICK-WAR-BRAKE-Q1 r3 (zarzut Evaluatora 2).
 *
 * BEHAVIORAL mutation test czystej logiki hamulca (P3/P4/P6/P7, moduł diplomacy-tick-war-brake.ts):
 *  - bazowa wersja modułu MUSI przejść wszystkie asercje zachowania (0 porażek);
 *  - każdy mutant (zmiana jednego operatora/warunku w ŹRÓDLE modułu, bundlowanego w pamięci)
 *    MUSI wywołać co najmniej jedną porażkę asercji zachowania.
 * Nie sprawdza tekstu main.ts (to robi diplo-tick-war-brake-test.cjs).
 * Run: node tools/diplo-tick-war-brake-mutation-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.resolve(ROOT, 'src', 'game', 'diplomacy-tick-war-brake.ts'), 'utf8');
const PARAMS = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'data', 'diplomacy-tick-params.json'), 'utf8'));
const P6 = PARAMS.p6;
const P7 = PARAMS.p7;

function loadModule(source) {
  const out = esbuild.buildSync({
    stdin: { contents: source, loader: 'ts', resolveDir: ROOT },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', out.outputFiles[0].text)(m, m.exports);
  return m.exports;
}

/** Zwraca listę nazw nieprzechodzących asercji zachowania (pusta = wszystko OK). */
function behaviorFailures(M) {
  const fails = [];
  const check = (name, got, want) => {
    if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  };
  const bonus = (nadwyzkaPn, epoka = 1, zaufanie = 10, kolejneTuryDostaw = 2) =>
    M.tradeTrustBonusPerTura({ nadwyzkaPn, epoka, zaufanie, kolejneTuryDostaw }, P7);

  // P7 — schodki, bez interpolacji, limit, sufit, min. tury
  check('P7 kamien 99', bonus(99), 0);
  check('P7 kamien 100', bonus(100), 0.5);
  check('P7 kamien 199', bonus(199), 0.5);
  check('P7 kamien 200', bonus(200), 1);
  check('P7 kamien 1000 (limit 5)', bonus(1000), 5);
  check('P7 kamien 5000 (limit 5)', bonus(5000), 5);
  check('P7 braz 199', bonus(199, 2), 0);
  check('P7 braz 200', bonus(200, 2), 0.5);
  check('P7 zelazo 400', bonus(400, 3), 0.5);
  check('P7 sufit 60', bonus(1000, 1, 60), 0);
  check('P7 sufit przycina do wolnego miejsca (59,5 -> 0,5)', bonus(1000, 1, 59.5), 0.5);
  check('P7 tura 1 cyklu = 0', bonus(1000, 1, 10, 1), 0);
  check('P7 jednorazowa/0 PN = 0', bonus(0), 0);

  // P6 — histereza N=5, ostrzezenie N-2, gotowosc, stan wojny
  let cs = { counter: 0, warningActive: false, warTriggerReady: false };
  const seq = [];
  for (let t = 1; t <= 6; t++) {
    cs = M.crisisStepForPair(cs.counter, 0, false, P6);
    seq.push([cs.counter, cs.warningActive, cs.warTriggerReady]);
  }
  check('P6 sekwencja licznika/ostrzezenia/gotowosci', seq, [
    [1, false, false], [2, false, false], [3, true, false], [4, true, false], [5, true, true], [6, true, true],
  ]);
  check('P6 reset po Zaufaniu > prog', M.crisisStepForPair(4, 1, false, P6).counter, 0);
  check('P6 prog wlacznie (Zaufanie == 0 liczy)', M.crisisStepForPair(0, 0, false, P6).counter, 1);
  check('P6 para w wojnie = 0', M.crisisStepForPair(3, -5, true, P6).counter, 0);
  check('P6 para w wojnie bez gotowosci', M.crisisStepForPair(4, -5, true, P6).warTriggerReady, false);

  // P4 — dobra wola: aktywna w dokladnie N=3 turach po darze
  let dw = 3;
  const act = [];
  for (let t = 1; t <= 4; t++) {
    const st = M.dobraWolaTurnStep(dw);
    act.push(st.activeThisTurn);
    dw = st.next;
  }
  check('P4 dobra wola 3 tury aktywne', act, [true, true, true, false]);
  check('P4 licznik 0 nieaktywny', M.dobraWolaTurnStep(0), { activeThisTurn: false, next: 0 });

  // P3 — pary AI↔AI i filtr duchow
  const pairs = M.aiAiPairs([1, 2, 3, 4]);
  check('P3 4 owners = 6 par', pairs.length, 6);
  check('P3 pary unikalne', new Set(pairs.map(p => p.join('_'))).size, 6);
  const ok = { isPlayer: false, isBarbarian: false, isCityCopy: false, eliminated: false, cityCount: 3 };
  check('P3 zwykly AI kwalifikuje', M.isAiAiEligibleOwner(ok), true);
  check('P3 gracz odpada', M.isAiAiEligibleOwner({ ...ok, isPlayer: true }), false);
  check('P3 barbarzynca odpada', M.isAiAiEligibleOwner({ ...ok, isBarbarian: true }), false);
  check('P3 kopia odpada', M.isAiAiEligibleOwner({ ...ok, isCityCopy: true }), false);
  check('P3 eliminowany odpada', M.isAiAiEligibleOwner({ ...ok, eliminated: true }), false);
  check('P3 duch bez miast odpada', M.isAiAiEligibleOwner({ ...ok, cityCount: 0 }), false);

  // P6 — kolejka i strona silniejsza
  const q = M.sortCrisisQueue([
    { ownerA: 3, ownerB: 4, counter: 2 },
    { ownerA: 5, ownerB: 1, counter: 6 },
    { ownerA: 2, ownerB: 9, counter: 6 },
  ]).map(e => [e.ownerA, e.ownerB]);
  check('P6 kolejka: dluzej na progu, remis nizszy owner', q, [[5, 1], [2, 9], [3, 4]]);
  check('P6 silniejsza strona wypowiada', M.pickWarDeclarer({ ownerId: 1, power: 10 }, { ownerId: 2, power: 30 }), 2);
  check('P6 remis mocy -> nizszy owner', M.pickWarDeclarer({ ownerId: 8, power: 10 }, { ownerId: 3, power: 10 }), 3);

  return fails;
}

// Mutanty: [nazwa, from, to]. `from` MUSI wystapic w zrodle dokladnie raz.
const MUTANTS = [
  ['P6 licznik nie rosnie', 'const counter = prev + 1;', 'const counter = 1;'],
  ['P6 prog wojny o 1 za wysoki', 'warTriggerReady: counter >= p.kryzysTurDoWojny', 'warTriggerReady: counter > p.kryzysTurDoWojny'],
  ['P6 prog Zaufania bez granicy (<)', 'if (!(zaufanie <= p.kryzysProgZaufania))', 'if (!(zaufanie < p.kryzysProgZaufania))'],
  ['P6 ostrzezenie o 1 pozno', 'warningActive: counter >= warnAt', 'warningActive: counter > warnAt'],
  ['P6 stan wojny ignorowany', 'if (atWar) return', 'if (false) return'],
  ['P4 aktywnosc liczona po odliczeniu (r2 bug)', 'activeThisTurn: r > 0', 'activeThisTurn: r > 1'],
  ['P4 brak odliczania', 'next: Math.max(0, r - 1)', 'next: r'],
  ['P3 para pominieta (j = i+2)', 'for (let j = i + 1; j < owners.length; j++)', 'for (let j = i + 2; j < owners.length; j++)'],
  ['P3 duchy bez miast wlaczone', 'o.cityCount > 0;', 'o.cityCount >= 0;'],
  ['P3 gracz wlaczony', '!o.isPlayer && !o.isBarbarian', '!o.isBarbarian'],
  ['P7 interpolacja (bez pelnych krokow)', 'const pelneKroki = Math.floor(input.nadwyzkaPn / krok);', 'const pelneKroki = input.nadwyzkaPn / krok;'],
  ['P7 limit usuniety', 'Math.min(surowy, p.wymianaMaxPerTura, headroom)', 'Math.min(surowy, headroom)'],
  ['P7 sufit usuniety', 'return Math.min(surowy, p.wymianaMaxPerTura, headroom);', 'return Math.min(surowy, p.wymianaMaxPerTura);'],
  ['P7 min. tury usuniety', 'if (input.kolejneTuryDostaw < p.wymianaMinTurDostaw) return 0;', 'if (false) return 0;'],
  ['P6 kolejka odwrocona', 'if (y.counter !== x.counter) return y.counter - x.counter;', 'if (y.counter !== x.counter) return x.counter - y.counter;'],
  ['P6 strona slabsza wypowiada', 'return a.power > b.power ? a.ownerId : b.ownerId;', 'return a.power < b.power ? a.ownerId : b.ownerId;'],
];

let pass = 0;
let fail = 0;

const baseFails = behaviorFailures(loadModule(SRC));
if (baseFails.length === 0) pass++;
else { fail++; console.log('FAIL baza nie przechodzi asercji zachowania:\n  ' + baseFails.join('\n  ')); }

for (const [name, from, to] of MUTANTS) {
  const occurrences = SRC.split(from).length - 1;
  if (occurrences !== 1) {
    fail++;
    console.log(`FAIL mutant "${name}": fragment wystepuje ${occurrences}x (wymagane 1)`);
    continue;
  }
  const mutated = SRC.replace(from, to);
  let fails;
  try {
    fails = behaviorFailures(loadModule(mutated));
  } catch (e) {
    fails = ['wyjatek: ' + (e && e.message ? e.message : String(e))];
  }
  if (fails.length > 0) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL mutant "${name}" PRZEZYL (zadna asercja zachowania nie czerwieni)`);
  }
}

console.log(`diplo-tick-war-brake-mutation-test: ${pass} pass / ${fail} fail (baza + ${MUTANTS.length} mutantow)`);
process.exit(fail === 0 ? 0 : 1);
