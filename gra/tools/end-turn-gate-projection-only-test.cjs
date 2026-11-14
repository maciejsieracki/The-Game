'use strict';
/**
 * end-turn-gate-projection-only-test.cjs — R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1.
 *
 * Reguła (decyzja właściciela 2026-11-14): blokadę „Zakończ turę” decyduje WYŁĄCZNIE prognoza po turze,
 * od tury 1; reakcja automatu zarządzania (pole `automat`) jest uwzględniana PRZED oceną;
 * brak ręcznej dźwigni = brak blokady (bez softlocku); propozycja podatku do zera (estymacja liniowa).
 *
 * Run: node tools/end-turn-gate-projection-only-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.end-turn-gate-projection-only-entry.ts');
const BUNDLE = path.resolve(__dirname, '.end-turn-gate-projection-only-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  decideEndTurnGate,
  evaluateEndTurnStocks,
  propozycjaPodatkuDoZera,
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
// proj(turn, skarbiecObecny, skarbiecPo, spichlerzObecny, spichlerzPo)
function proj(turn, skObecny, skPo, spObecny, spPo) {
  return { turn, skarbiecObecny: skObecny, skarbiecPo: skPo, spichlerzObecny: spObecny, spichlerzPo: spPo };
}

// (1) obecny skarbiec < 0, prognoza po turze >= 0 -> BEZ blokady; tury 1 i 20.
for (const t of [1, 20]) {
  const g = M.decideEndTurnGate(proj(t, -4, 15, 0, 0), 0, 0, { podatekSkarbiec: 10, podatekPunkty: 10 });
  ok(g.blokada === false, `(1) tura ${t}: obecny -4, prognoza +15 -> brak blokady`);
}

// (2) prognoza po turze < 0 -> BLOKADA w turze 1 i 20, z komunikatem po zakończeniu tury i dźwignią.
for (const t of [1, 20]) {
  const g = M.decideEndTurnGate(proj(t, 5, -20, 0, 0), 0, 0, { podatekSkarbiec: 50, podatekPunkty: 10 });
  ok(g.blokada === true, `(2) tura ${t}: prognoza -20 -> blokada`);
  ok(/po zakończeniu tury/.test(g.komunikat) && /podatek/.test(g.komunikat), `(2) tura ${t}: komunikat po zakończeniu tury + podatek`);
  ok(g.zasob === 'skarbiec' && g.prognoza === -20, `(2) tura ${t}: zasob i prognoza w strukturze`);
}

// (3) zmiana podatku odblokowuje: prognoza po podniesieniu >= 0 -> blokada znika.
{
  const przed = M.decideEndTurnGate(proj(20, 5, -6, 0, 0), 0, 0, { podatekSkarbiec: 10, podatekPunkty: 10 });
  const po = M.decideEndTurnGate(proj(20, 5, 4, 0, 0), 0, 0, { podatekSkarbiec: 10, podatekPunkty: 10 });
  ok(przed.blokada === true && po.blokada === false, '(3) podniesienie podatku (prognoza >= 0) znosi blokade');
}

// (4) brak ręcznej dźwigni -> brak blokady (no softlock), tury 1 i 20.
for (const t of [1, 20]) {
  const g = M.decideEndTurnGate(proj(t, 5, -20, 0, 0), 0, 0, {});
  ok(g.blokada === false, `(4) tura ${t}: prognoza < 0 bez dźwigni -> brak blokady (no softlock)`);
}

// (5) Spichlerz: obecny < 0, prognoza >= 0 -> brak blokady.
{
  const g = M.decideEndTurnGate(proj(1, 50, 50, -10, 3), 0, 0, { suwakZywnosc: 5 });
  ok(g.blokada === false, '(5) spichlerz obecny -10, prognoza +3 -> brak blokady');
}

// (6) Automat zarządzania naprawia PRZED oceną: prognoza spichlerza -10, automat +2 -> brak blokady.
{
  const g = M.decideEndTurnGate(proj(1, 50, 50, 0, -10), 0, 0, { suwakZywnosc: 0, automat: { spichlerzPo: 2 } });
  ok(g.blokada === false && g.automatPoprawil === true, '(6a) automat naprawia spichlerz -> brak blokady');
}
// (6b) Automat niewystarczający -> nadal blokada z ręczną dźwignią (racje); prognoza po automacie.
{
  const g = M.decideEndTurnGate(proj(1, 50, 50, 0, -10), 0, 0, { suwakZywnosc: 12, automat: { spichlerzPo: -4 } });
  ok(g.blokada === true && g.zasob === 'spichlerz' && g.prognoza === -4, '(6b) automat za mało -> blokada, prognoza po automacie');
}
// (6c) Brak automatu i dźwignia racji -> blokada.
{
  const g = M.decideEndTurnGate(proj(1, 50, 50, 0, -10), 0, 0, { suwakZywnosc: 12 });
  ok(g.blokada === true && g.automatPoprawil === false, '(6c) bez automatu -> blokada z racjami');
}

// (7) Propozycja podatku do zera: brak 5, 10 punktów = 20 złota, potrzeba ceil(5/2) = 3 pkt.
{
  const p = M.propozycjaPodatkuDoZera(5, 10, 20);
  ok(p !== null && p.punktyProcentowe === 3 && p.szacunek === 'liniowy', '(7a) minimalne podniesienie podatku = 3 pkt');
  ok(M.propozycjaPodatkuDoZera(50, 10, 20) === null, '(7b) gdy pelny podatek nie wystarcza -> null');
  ok(M.propozycjaPodatkuDoZera(0, 10, 20) === null, '(7c) brak minusu -> null');
}
// (7d) decideEndTurnGate zwraca propozycję podatku dla skarbca.
{
  const g = M.decideEndTurnGate(proj(20, 5, -5, 0, 0), 0, 0, { podatekSkarbiec: 20, podatekPunkty: 10 });
  ok(g.blokada === true && g.propozycjaPodatku !== null && g.propozycjaPodatku.punktyProcentowe === 3,
    '(7d) blokada skarbca niesie propozycje podatku = 3 pkt');
}

// (8) Stary zapis: stan ujemny, prognoza nadal < 0 -> blokada (wyjatekStarego usuniety).
{
  const v = M.evaluateEndTurnStocks(proj(15, -30, -25, 0, 0));
  ok(v.blokada === true && v.wyjatekStarego === false, '(8) stary zapis z prognoza < 0 -> blokada');
}

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log(`end-turn-gate-projection-only-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
