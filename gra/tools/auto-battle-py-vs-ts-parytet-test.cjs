'use strict';
/**
 * auto-battle-py-vs-ts-parytet-test.cjs
 * P-AUTO-BATTLE-SYMULATOR-PY-ROZJAZD-Q1 — bramka parytetu symulatora i runtime.
 *
 * Porównuje DWA RZECZYWISTE ŹRÓDŁA, nie ich reimplementacje:
 *  • runtime TS `gra/src/game/auto-battle-power.ts` — zbundlowany esbuildem,
 *    wzorem `auto-battle-power-test.cjs` (ŹRÓDŁO PRAWDY);
 *  • symulator `gra/tools/auto-battle-power.py` — uruchomiony przez
 *    `child_process` w trybie maszynowym `--resolve-json`.
 *
 * Parametry (L_MAX, p_atk, p_def, L_MIN, coef_*) NIE są tu zaszyte — obie
 * strony czytają `gra/data/auto-battle-params.json`, a bramka odczytuje ten sam
 * plik i sprawdza, że symulator faktycznie zobaczył te wartości. Kolejna
 * kalibracja przechodzi więc przez bramkę zamiast po cichu rozjeżdżać źródła.
 *
 * Punkty skrajne (do r = 50000) są obowiązkowe: rozjazd podłogi L_MIN ujawnia
 * się od r >= 10, a błędna kolejność „podłoga przed zaokrągleniem" dopiero
 * przy r ~ 1866 — sam zakres grywalny przepuścił ten defekt.
 *
 * Run: node gra/tools/auto-battle-py-vs-ts-parytet-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const TOOLS = __dirname;
const ROOT = path.resolve(TOOLS, '..', '..');
const PARAMS_FILE = path.join(ROOT, 'gra', 'data', 'auto-battle-params.json');
const PY_FILE = path.join(TOOLS, 'auto-battle-power.py');
const ENTRY = path.join(TOOLS, '.auto-battle-parytet-entry.ts');
const BUNDLE = path.join(TOOLS, '.auto-battle-parytet-bundle.cjs');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else {
    fail++;
    console.error('FAIL:', msg);
  }
}

// --- strona TS (bundlowany rzeczywisty runtime) ---
fs.writeFileSync(
  ENTRY,
  `
import { resolveAutoBattleByPower } from '../src/game/auto-battle-power';
import { loadAutoBattleParams } from '../src/game/auto-battle-params';
export { resolveAutoBattleByPower, loadAutoBattleParams };
`,
);
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});
const { resolveAutoBattleByPower, loadAutoBattleParams } = require(BUNDLE);

// --- parametry: jedno źródło, żadnych stałych w bramce ---
const paramsFile = JSON.parse(fs.readFileSync(PARAMS_FILE, 'utf8'));
const S = paramsFile.straty || {};
const L_MIN = S.L_MIN;
const tsParams = loadAutoBattleParams();
for (const k of ['L_MAX', 'p_atk', 'p_def', 'L_MIN', 'coef_zwyciezca', 'coef_przegrany']) {
  assert(tsParams[k] === S[k], `TS czyta ${k} z auto-battle-params.json (${tsParams[k]} vs ${S[k]})`);
}

// --- punkty pomiarowe: grywalne + skrajne (kryterium 2 dispatchu) ---
const RATIOS = [1.5, 2, 3, 5, 10, 20, 100, 1000, 2000, 5000, 41821, 50000];
// mL = max(min(mAtk,mDef),1) — przy podstawie 1 stosunek sił jest dokładnie r.
// Każde r w dwóch wariantach: wygrywa ATK i wygrywa DEF, żeby pokryć również
// stronę przegranego (loserLossPct), nie tylko zwycięzcy.
const pairs = [];
for (const r of RATIOS) {
  pairs.push([r, 1]);
  pairs.push([1, r]);
}

// --- strona .py (rzeczywisty skrypt, child_process) ---
const pyRaw = execFileSync('python3', [PY_FILE, '--resolve-json'], {
  input: JSON.stringify(pairs),
  encoding: 'utf8',
  cwd: ROOT,
});
const py = JSON.parse(pyRaw);
for (const k of ['L_MAX', 'p_atk', 'p_def', 'L_MIN', 'coef_zwyciezca', 'coef_przegrany']) {
  assert(py.params[k] === S[k], `.py czyta ${k} z auto-battle-params.json (${py.params[k]} vs ${S[k]})`);
}
assert(py.results.length === pairs.length, 'py zwrocil komplet wynikow');

const TOL = 0.0005;
// Sama tolerancja bezwzgledna ±0,0005 jest w punktach skrajnych spelniona przez
// DOWOLNA liczbe z [0; 0,0005]: od r ~ 1866 wygrywa podloga L_MIN, a procent NA
// JEDNOSTKE spada tam do 1e-5..1e-6. Asercja parytetu bylaby wiec bezwarunkowo
// prawdziwa dokladnie w zakresie, ktorego dotyczy naprawa. Dlatego obok
// tolerancji bezwzglednej obowiazuje WZGLEDNA: obie strony licza te sama
// arytmetyke, wiec zgodnosc ma byc co do bitu (margines 1e-9 na reprezentacje).
const REL_TOL = 1e-9;
function zgodne(a, b) {
  const diff = Math.abs(a - b);
  return diff <= TOL && diff <= Math.abs(a) * REL_TOL + 1e-12;
}
const winnerSums = [];

for (let i = 0; i < pairs.length; i++) {
  const [mAtk, mDef] = pairs[i];
  const r = Math.max(mAtk, mDef) / Math.max(Math.min(mAtk, mDef), 1);
  const ts = resolveAutoBattleByPower({ mAtk, mDef, rng: () => 1 });
  const p = py.results[i];
  const label = `r=${r} (${mAtk} vs ${mDef})`;

  assert(
    (ts.winner === 'attacker' ? 'attacker' : 'defender') === p.winner,
    `werdykt zgodny ${label}: TS=${ts.winner} py=${p.winner}`,
  );
  assert(
    zgodne(ts.lossAtkPct, p.loss_atk_pct),
    `lossAtkPct ${label}: TS=${ts.lossAtkPct} py=${p.loss_atk_pct}`,
  );
  assert(
    zgodne(ts.lossDefPct, p.loss_def_pct),
    `lossDefPct ${label}: TS=${ts.lossDefPct} py=${p.loss_def_pct}`,
  );

  // Podłoga L_MIN dotyczy SUMY strat składu zwycięzcy (lossPct × r), nie
  // pojedynczej jednostki. Podłoga na jednostce dawała tu L_MIN × r.
  const winnerPct = ts.winner === 'attacker' ? p.loss_atk_pct : p.loss_def_pct;
  const tsWinnerPct = ts.winner === 'attacker' ? ts.lossAtkPct : ts.lossDefPct;
  const sum = winnerPct * r;
  const tsSum = tsWinnerPct * r;
  // Parytet mierzony na SUMIE skladu, a nie na jednostce: suma jest rzedu L_MIN,
  // wiec tolerancja ±0,0005 cos tu faktycznie ogranicza takze przy r = 50000.
  assert(
    Math.abs(tsSum - sum) <= TOL,
    `suma strat zwyciezcy TS vs py ${label}: TS=${tsSum} py=${sum}`,
  );
  assert(sum >= L_MIN - 1e-9, `suma strat zwyciezcy >= L_MIN ${label}: ${sum}`);
  if (mAtk > mDef) winnerSums.push([r, sum]);
}

// Podłoga na jednostce dawała sumę L_MIN × r, więc ciąg ZAWRACAŁ (20:1 → 1,000).
// Podłoga na sumie składu utrzymuje go nierosnącym aż do punktów skrajnych.
for (let i = 1; i < winnerSums.length; i++) {
  const [rPrev, sPrev] = winnerSums[i - 1];
  const [rCur, sCur] = winnerSums[i];
  assert(
    sCur <= sPrev + TOL,
    `suma strat zwyciezcy nierosnaca: r=${rPrev} -> ${sPrev}, r=${rCur} -> ${sCur}`,
  );
}

// --- kryterium 1: ciąg sum strat zwycięzcy identyczny z runtime TS ---
// Wartości odniesienia obowiązują dla kalibracji, przy której powstał dispatch;
// po rekalibracji parytet TS↔py sprawdzają asercje wyżej, a ta kotwica milczy.
const ANCHOR_CALIB = 'v2b-2026-06-30';
const ANCHOR = {
  1.5: 0.3873, 2: 0.3656, 3: 0.3372, 5: 0.3045, 10: 0.265, 20: 0.23,
};
if (paramsFile.kalibracja === ANCHOR_CALIB) {
  for (const [rStr, expected] of Object.entries(ANCHOR)) {
    const r = Number(rStr);
    const idx = pairs.findIndex(([a, b]) => a === r && b === 1);
    const p = py.results[idx];
    const sum = Math.round(p.loss_atk_pct * r * 10000) / 10000;
    assert(
      Math.abs(sum - expected) <= TOL,
      `kotwica sumy strat zwyciezcy r=${r}: py=${sum}, oczekiwane ${expected}`,
    );
  }
} else {
  console.log(`(kotwica tabeli GOAL pominieta — kalibracja ${paramsFile.kalibracja})`);
}

console.log(`auto-battle-py-vs-ts-parytet-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
