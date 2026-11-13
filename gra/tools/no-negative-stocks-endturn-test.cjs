'use strict';
/**
 * no-negative-stocks-endturn-test.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-B-Q1 (podtemat B).
 *
 * Sprawdza:
 *  (a) tura >= 11 + prognoza < 0 (gorsza niz stan obecny) + ruch naprawczy -> blokada z komunikatem (kwota i zasob),
 *  (a2) tura <= 10 -> brak blokady,
 *  (b) po wykonaniu ruchu naprawczego (prognoza >= 0) blokada znika (brak zakleszczenia),
 *  (c) brak ruchu naprawczego -> brak blokady (zgodnie z decyzja),
 *  (d) stary zapis: stan ujemny, prognoza nie gorsza -> brak blokady,
 *  (e) dryf arytmetyki: projekcja skarbca == obecny + netto HUD (pieniadz - utrzymanieRazem) == blok „Bank treasury”,
 *  (f) wiring: canPlayerInitiateEndTurn i hintEndTurnBlocked w main.ts wolaja bramke NNS.
 *
 * Run: node tools/no-negative-stocks-endturn-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-endturn-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-endturn-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  decideEndTurnGate,
  evaluateEndTurnStocks,
  projectTreasuryAfterTick,
} from '../src/game/no-negative-stocks';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

function proj(turn, skObecny, skPo, spObecny, spPo) {
  return { turn, skarbiecObecny: skObecny, skarbiecPo: skPo, spichlerzObecny: spObecny, spichlerzPo: spPo };
}

// (a) blokada z komunikatem
{
  const g = M.decideEndTurnGate(proj(11, 5, -20, 0, 0), 30, 0);
  ok(g.blokada === true, '(a) tura 11, prognoza < 0, ruch naprawczy -> blokada');
  ok(/Skarbiec/.test(g.komunikat) && /20/.test(g.komunikat), '(a) komunikat zawiera zasob i kwote (20)');
}
// (a2) tura <= 10 -> brak blokady
{
  const g = M.decideEndTurnGate(proj(10, 5, -20, 0, 0), 30, 0);
  ok(g.blokada === false, '(a2) tura 10 (wolna) -> brak blokady');
}
// (b) po ruchu naprawczym blokada znika
{
  const before = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 30, 0);
  const after = M.decideEndTurnGate(proj(12, 5, 10, 0, 0), 30, 0);
  ok(before.blokada === true && after.blokada === false, '(b) po wykonaniu dzwigni blokada znika');
}
// (c) brak ruchu naprawczego -> brak blokady stalej
{
  const g = M.decideEndTurnGate(proj(11, 5, -20, 0, 0), 10, 0);
  ok(g.blokada === false, '(c) zysk dzwigni < brak -> brak blokady (brak zakleszczenia)');
  const g0 = M.decideEndTurnGate(proj(11, 5, -20, 0, 0), 0, 0);
  ok(g0.blokada === false, '(c) brak jakichkolwiek dzwigni -> brak blokady');
}
// spichlerz
{
  const g = M.decideEndTurnGate(proj(11, 0, 0, 3, -7), 0, 10);
  ok(g.blokada === true && /Spichlerz/.test(g.komunikat), '(a-spich) spichlerz < 0 z dzwignia -> blokada, nazwa zasobu');
  const g2 = M.decideEndTurnGate(proj(11, 0, 0, 3, -7), 0, 5);
  ok(g2.blokada === false, '(c-spich) dzwignia spichlerza za mala -> brak blokady');
}
// (d) stary zapis: stan ujemny, prognoza nie gorsza
{
  const g = M.decideEndTurnGate(proj(15, -5, -3, 0, 0), 30, 0);
  ok(g.blokada === false, '(d) stary zapis ujemny, prognoza nie gorsza -> brak blokady');
}
// (e) dryf arytmetyki: projekcja skarbca == blok banku == obecny + netto HUD
{
  const perCity = [
    { cityId: 'a', ownerId: 0, pieniadz: 12, pieniadzZTras: 12, nauka: 0, doPuli: 0, praca: 0, kultura: 0 },
    { cityId: 'b', ownerId: 0, pieniadz: 7, pieniadzZTras: 7, nauka: 0, doPuli: 0, praca: 0, kultura: 0 },
    { cityId: 'c', ownerId: 1, pieniadz: 50, pieniadzZTras: 50, nauka: 0, doPuli: 0, praca: 0, kultura: 0 },
  ];
  const utrzymanie = 9;
  const econ = {
    perCity,
    upkeepByOwner: new Map([[0, { utrzymanieRazem: utrzymanie, utrzymanieBudynki: utrzymanie, utrzymanieJednostki: 0, saldo: 0, deficyt: false }]]),
  };
  const obecny = 40;
  const projected = M.projectTreasuryAfterTick(obecny, econ, 0);
  const hudNetto = obecny + (12 + 7 - utrzymanie);
  const bankBlock = obecny + (12 + 7) - utrzymanie;
  ok(projected === hudNetto && projected === bankBlock, '(e) dryf: projekcja == HUD netto == blok banku');
  const cityCut = M.projectTreasuryAfterTick(obecny, econ, 0, [{ id: 'a', ownerId: 0 }]);
  ok(cityCut === obecny + 12 - utrzymanie, '(e) wariant z lista miast (fotel czlowieka) liczy tylko miasta gracza');
}
// evaluate: spojnosc z decyzja
{
  const v = M.evaluateEndTurnStocks(proj(11, 5, -20, 0, 0));
  ok(v.blokada === true && v.brakuje.length === 1 && v.brakuje[0].ile === 20, 'evaluate: brak 20 skarbca');
}

// (f) wiring w main.ts
{
  const src = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  ok(src.includes('nnsGateForPlayer().blokada'), '(f) canPlayerInitiateEndTurn wola bramke NNS');
  const hintIdx = src.indexOf('function hintEndTurnBlocked(): void {');
  ok(hintIdx > 0 && src.slice(hintIdx, hintIdx + 9000).includes('nnsHint.komunikat'), '(f) hintEndTurnBlocked pokazuje komunikat NNS');
}

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log(`no-negative-stocks-endturn-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
