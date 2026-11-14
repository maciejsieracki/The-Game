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
  propozycjaPodatkuKrokami,
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

// (9) Dodatek 2 (martwy punkt Spichlerza) — kolejność: automat PRZED oceną, brak dźwigni = brak blokady.
{
  // (9a) spichlerz -10, automat naprawia do +2 (dźwignia racji 12 dostępna): bez automatu blokada, z automatem brak blokady.
  const a = M.decideEndTurnGate(proj(1, 50, 50, 0, -10), 0, 0, { suwakZywnosc: 12, automat: { spichlerzPo: 2 } });
  ok(a.blokada === false && a.automatPoprawil === true, '(9a) automat naprawia spichlerz -> tura się kończy (mimo dostępnej racji)');
  // (9b) spichlerz -10, automat nie wystarcza (-4), dźwignia racji 12 -> blokada z prognozą PO automacie.
  const b = M.decideEndTurnGate(proj(1, 50, 50, 0, -10), 0, 0, { suwakZywnosc: 12, automat: { spichlerzPo: -4 } });
  ok(b.blokada === true && b.prognoza === -4 && b.zasob === 'spichlerz', '(9b) automat za mało + racja -> blokada, prognoza po automacie');
  // (9c) spichlerz -10, brak automatu, brak dźwigni -> brak blokady (no softlock).
  const c = M.decideEndTurnGate(proj(1, 50, 50, 0, -10), 0, 0, {});
  ok(c.blokada === false, '(9c) brak automatu i brak dźwigni -> brak blokady');
  // (9d) mutacja: bez uwzględnienia automatu (ten sam przypadek co 9a bez pola automat) musi blokować, gdy jest dźwignia.
  const d = M.decideEndTurnGate(proj(1, 50, 50, 0, -10), 0, 0, { suwakZywnosc: 12 });
  ok(d.blokada === true, '(9d) bez automatu, z dźwignią racji -> blokada (automat jest jedyną różnicą względem 9a)');
}

// (10) Wiązanie main.ts: projekcja automatu (Auto-Żywienie) liczona przed bramką i przekazywana do decideEndTurnGate.
// Test strukturalny (main.ts nie jest importowalny); mutacja: usunięcie przekazania `automat` -> FAIL.
{
  const mainSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  ok(/_nnsAutoSpichlerzDelta = fAuto\.spichlerzPo - _nnsHumanForecast\.spichlerzPo;/.test(mainSrc),
    '(10a) main.ts: delta spichlerza po automacie liczona z projekcji po autoBalanceRationsToSolvency');
  ok(/autoBalanceRationsToSolvency\(\{[\s\S]*?onlyAutoManaged: true,[\s\S]*?\}\);/.test(mainSrc),
    '(10b) main.ts: projekcja wywołuje autoBalanceRationsToSolvency z onlyAutoManaged: true');
  ok(/automat: \{ spichlerzPo: spLive \+ _nnsAutoSpichlerzDelta \}/.test(mainSrc),
    '(10c) main.ts: nnsGateForPlayer przekazuje automat (spichlerzPo na żywym stanie) do decideEndTurnGate');
}

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
// Runda 2 pkt 3: wyszukiwanie po krokach 10% (ta sama projekcja co bramka; prognoza ≥ 0 po zastosowaniu).
{
  // Nieliniowa projekcja: każdy % podatku daje 1,3 złota, ale pierwsze 5 pkt są bez efektu (progi).
  const proj = (pkt) => -40 + Math.max(0, pkt - 5) * 1.3;
  const r = M.propozycjaPodatkuKrokami(proj, 100, 10);
  ok(r !== null && r.punktyProcentowe === 40, 'krokami: najmniejszy krok dający prognozę ≥ 0 (40; kroki 10 i 20 i 30 za małe)');
  ok(r !== null && proj(r.punktyProcentowe) >= 0, 'krokami: po zastosowaniu propozycji prognoza ≥ 0');
  const brak = M.propozycjaPodatkuKrokami(() => -1, 30, 10);
  ok(brak === null, 'krokami: nawet maksimum nie wystarcza -> null (niewystarczające)');
  const maks = M.propozycjaPodatkuKrokami((pkt) => (pkt >= 25 ? 0 : -1), 25, 10);
  ok(maks !== null && maks.punktyProcentowe === 25, 'krokami: ostatni krok ograniczony do maksimum');
  ok(M.propozycjaPodatkuKrokami(() => 5, 0, 10) === null, 'krokami: brak dostępnych punktów -> null');
}

// (r2, zarzuty 3/7/8) Krokowa propozycja podatku w bramce + flaga „niewystarczające”.
{
  // Skarbiec po turze przy podatku +p pkt: -30 + 3*p (zysk 3 złota na punkt). Krok 10: 10->0? nie (-0), 20->30 ok.
  const sk = (pkt) => -30 + 3 * pkt;
  const g = M.decideEndTurnGate(proj(20, 5, sk(0), 0, 0), 0, 0,
    { podatekSkarbiec: 30, podatekPunkty: 100, prognozaPoPodatku: sk });
  ok(g.blokada === true, 'r2: skarbiec po turze -30 -> blokada');
  ok(g.propozycjaPodatku !== null && g.propozycjaPodatku.szacunek === 'krokowy', 'r2: propozycja idzie krokami (szacunek krokowy)');
  ok(g.propozycjaPodatku !== null && g.propozycjaPodatku.punktyProcentowe === 10, 'r2: najmniejszy krok 10 daje 0 (>=0)');
  ok(g.propozycjaPodatku !== null && sk(g.propozycjaPodatku.punktyProcentowe) >= 0, 'r2: po zastosowaniu propozycji prognoza >= 0');
  ok(g.niewystarczajace === false, 'r2: przy pokryciu flaga niewystarczające = false');

  // Maksimum nie wystarcza: nawet +100 pkt daje -10 -> niewystarczające, propozycja null, bramka nadal blokuje.
  const sk2 = (pkt) => -10 - 0 * pkt;
  const g2 = M.decideEndTurnGate(proj(20, 5, sk2(0), 0, 0), 0, 0,
    { podatekSkarbiec: 30, podatekPunkty: 100, prognozaPoPodatku: sk2 });
  ok(g2.blokada === true && g2.propozycjaPodatku === null && g2.niewystarczajace === true,
    'r2: maksymalny podatek nie wystarcza -> propozycja null + flaga niewystarczające (blokada zostaje)');

  // Częściowa dźwignia (zysk < brak) -> brak blokady, ale flaga niewystarczające dla UI.
  const g3 = M.decideEndTurnGate(proj(20, 5, -50, 0, 0), 0, 0, { podatekSkarbiec: 10, podatekPunkty: 10 });
  ok(g3.blokada === false && g3.niewystarczajace === true, 'r2: dźwignia częściowa -> bez blokady, flaga niewystarczające = true');

  // Brak jakiejkolwiek dźwigni -> brak blokady, flaga false (nic do zgłoszenia).
  const g4 = M.decideEndTurnGate(proj(20, 5, -50, 0, 0), 0, 0, {});
  ok(g4.blokada === false && g4.niewystarczajace === false, 'r2: brak dźwigni -> bez blokady, flaga false');

  // Brak prognozaPoPodatku -> stara estymacja liniowa (szacunek 'liniowy').
  const g5 = M.decideEndTurnGate(proj(20, 5, -5, 0, 0), 0, 0, { podatekSkarbiec: 20, podatekPunkty: 10 });
  ok(g5.propozycjaPodatku !== null && g5.propozycjaPodatku.szacunek === 'liniowy', 'r2: bez callbacku -> szacunek liniowy (fallback)');
}

console.log(`end-turn-gate-projection-only-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
