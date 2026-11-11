'use strict';
/**
 * R-WEB-CURRENCY-MULT-PER-CIV-Q1 (decyzja D): mnoznik Efektu 1 (Waluta + Mennica) per cywilizacja
 *   = max(minimum 1,38; meta_mnoznik_waluta[civ] + delta trudnosci +0,5 / 0 / -0,5), bez gornego limitu.
 * Run from gra/: node tools/currency-mult-per-civ-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.currency-mult-per-civ-entry.ts');
const bundle = path.join(__dirname, '.currency-mult-per-civ-bundle.cjs');

fs.writeFileSync(entry, `
export { cityYieldPerTurn, loadEconParams, mennicaMnoznikForCiv } from '../src/game/economy';
export { buildEconParams } from '../src/game/turn-economy';
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) { passed++; }
  else { failed++; console.error('FAIL:', message); }
}
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent',
  });
  const M = require(bundle);
  const econ = require('../data/econ-params.json');
  const matrix = require('../data/civ-matrix.json');
  const DELTA = { easy: 0.5, normal: 0, hard: -0.5 };
  const MIN = econ.globalne.mennica_mnoznik_po_walucie_minimum.hard;
  assert(MIN === 1.38, 'econ-params: minimum = 1,38 (dawna globalna wartosc hard)');
  assert(MIN === econ.globalne.mennica_mnoznik_po_walucie.hard, 'minimum == globalne.mennica_mnoznik_po_walucie.hard');

  const expected = (row, d) => Math.max(MIN, row.params.meta_mnoznik_waluta + DELTA[d]);

  // 1. Tabela 15 x 3 przez parametry z obu builderow (parytet gracz/AI = jedna funkcja).
  const table = [];
  for (const row of matrix.cywilizacje) {
    const line = { civ: row.ikonaId };
    for (const d of ['easy', 'normal', 'hard']) {
      const pLoad = M.loadEconParams(econ, d);
      const pBuild = M.buildEconParams({ econParams: econ }, d);
      const a = M.mennicaMnoznikForCiv(row.ikonaId, pLoad);
      const b = M.mennicaMnoznikForCiv(row.ikonaId, pBuild);
      assert(near(a, expected(row, d)), `${row.ikonaId} ${d}: ${a} == ${expected(row, d)}`);
      assert(near(a, b), `${row.ikonaId} ${d}: loadEconParams == buildEconParams`);
      line[d] = Number(a.toFixed(2));
    }
    table.push(line);
  }
  console.log('civ          easy  normal  hard');
  for (const t of table) console.log(`${t.civ.padEnd(12)} ${String(t.easy).padEnd(5)} ${String(t.normal).padEnd(7)} ${t.hard}`);

  // 2. Dolny limit na hard (Germanie/Asyria/Zulusi/Slowianie) i brak gornego limitu (Fenicjanie easy 3,1).
  const hard = M.loadEconParams(econ, 'hard');
  for (const k of ['germanie', 'asyria', 'zulusi', 'slowianie']) {
    assert(near(M.mennicaMnoznikForCiv(k, hard), 1.38), `${k} hard = 1,38 (dolny limit)`);
  }
  assert(near(M.mennicaMnoznikForCiv('fenicjanie', M.loadEconParams(econ, 'easy')), 3.1), 'Fenicjanie easy = 3,1 (bez gornego limitu)');
  assert(near(M.mennicaMnoznikForCiv('grecy', M.loadEconParams(econ, 'normal')), 2.3), 'Grecy normal = 2,3 (nie globalne 1,5)');

  // 3. Fallback globalny: brak civ / nieznana civ / params bez trudnosci.
  const normal = M.loadEconParams(econ, 'normal');
  assert(M.mennicaMnoznikForCiv(null, normal) === normal.mennicaMnoznikPoWalucie, 'brak civ -> globalny fallback');
  assert(M.mennicaMnoznikForCiv('nieznana', normal) === normal.mennicaMnoznikPoWalucie, 'nieznana civ -> globalny fallback');
  const legacy = { ...normal }; delete legacy.trudnosc;
  assert(M.mennicaMnoznikForCiv('grecy', legacy) === normal.mennicaMnoznikPoWalucie, 'params bez trudnosci -> globalny fallback');

  // 4. Realny podatek (cityYieldPerTurn): stosunek Nauka(z Mennica+Waluta) / Nauka(bez) == mnoznik civ.
  const tile = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
  const tiles = Array(600).fill(tile);
  const mkCity = civKey => ({
    id: 'c1', civKey, ludnosc: 1, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0, specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 100, procentPieniadz: 0, procentLuksus: 0 },
    podziałPracy: { procentBudynki: 100 },
  });
  const ctx = on => ({
    wojskoZuzycieZywnosci: 0, strataFraction: 0, maMlyn: false, maCegielnia: false,
    maTargowisko: false, maMennica: on, walutaOdkryta: on,
  });
  for (const d of ['easy', 'normal', 'hard']) {
    const params = M.loadEconParams(econ, d);
    for (const k of ['grecy', 'zulusi', 'fenicjanie', 'germanie']) {
      const row = matrix.cywilizacje.find(r => r.ikonaId === k);
      const withM = M.cityYieldPerTurn(mkCity(k), tiles, [], params, ctx(true)).nauka;
      const noM = M.cityYieldPerTurn(mkCity(k), tiles, [], params, ctx(false)).nauka;
      assert(noM > 100, `${k} ${d}: baza podatku > 0 (${noM})`);
      assert(Math.abs(withM / noM - expected(row, d)) < 0.02,
        `${k} ${d}: silnik podatku x${(withM / noM).toFixed(3)} == x${expected(row, d)}`);
    }
  }
  // 4b. Bramka Mennica+Waluta bez zmian: samo Waluta albo sama Mennica -> x1.
  const pN = M.loadEconParams(econ, 'normal');
  const base = M.cityYieldPerTurn(mkCity('grecy'), tiles, [], pN, ctx(false)).nauka;
  for (const c of [{ maMennica: true, walutaOdkryta: false }, { maMennica: false, walutaOdkryta: true }]) {
    const r = M.cityYieldPerTurn(mkCity('grecy'), tiles, [], pN, { ...ctx(false), ...c }).nauka;
    assert(r === base, `bramka AND: ${JSON.stringify(c)} -> bez mnoznika`);
  }
  // 4c. Parytet gracz/AI: wynik nie zalezy od ownerId.
  const aiCity = { ...mkCity('grecy'), ownerId: 3 }; const plCity = { ...mkCity('grecy'), ownerId: 0 };
  assert(M.cityYieldPerTurn(aiCity, tiles, [], pN, ctx(true)).nauka === M.cityYieldPerTurn(plCity, tiles, [], pN, ctx(true)).nauka,
    'parytet player/AI: ten sam mnoznik');

  // 5. Wiki <-> silnik: haslo cywilizacji pokazuje wartosc NORMAL == silnik normal; wspomina trudnosc i minimum.
  const root = path.resolve(GRA, '..');
  const wiki = require('../src/data/wikiBundle.json');
  for (const k of ['celtowie', 'chinczycy', 'egipt', 'germanie', 'grecy', 'inkowie', 'rzymianie', 'sumer', 'zulusi']) {
    const row = matrix.cywilizacje.find(r => r.ikonaId === k);
    const engine = M.mennicaMnoznikForCiv(k, normal);
    const src = fs.readFileSync(path.join(root, 'docs/encyklopedia/cywilizacje', `${k}.md`), 'utf8');
    const bun = wiki.encyklopedia.find(e => e.id === `cywilizacje/${k}`).full;
    for (const [lbl, txt] of [['source', src], ['bundle', bun]]) {
      const m = txt.match(/Mnożnik waluty:\s*\*\*([0-9.]+)\*\*/);
      assert(m && near(Number(m[1]), engine) && near(Number(m[1]), row.params.meta_mnoznik_waluta),
        `${k} ${lbl}: wiki mnoznik == silnik normal (${engine})`);
      assert(/poziom trudności|poziomu trudności/.test(txt) && /1[,.]38/.test(txt),
        `${k} ${lbl}: haslo opisuje korekte trudnosci i minimum 1,38`);
    }
  }
} finally {
  for (const f of [entry, bundle]) { try { fs.unlinkSync(f); } catch {} }
}
console.log(`\ncurrency-mult-per-civ-test: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
