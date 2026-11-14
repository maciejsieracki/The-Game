'use strict';
/**
 * no-negative-stocks-end-turn-gate-levers-test.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-END-TURN-GATE-LEVERS-Q1.
 *
 * Sprawdza czystą logikę bramki „Zakończ turę” z dźwigniami podatku i racji:
 *  (a) blokada z każdą dźwignią osobno (podatek / racje / jednostki) przy minusie,
 *  (b) brak blokady, gdy żadna dźwignia nie wystarcza (brak zakleszczenia),
 *  (c) mutacja: bez dźwigni podatku ten sam przypadek NIE blokuje,
 *  (d) tura 1–10 zwolniona,
 *  (e) komunikat zawiera zasób, wielkość minusu i listę dźwigni z liczbami z projekcji,
 *  (f) wiring: main.ts podaje dźwignie do bramki i tooltip przycisku (bottomBarHud),
 *  (i) R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1: komunikat blokady i tooltip NIE wspominają kolejki
 *      produkcji (prognoza gracza jej nie zawiera, więc dźwignia kolejki nie ma modelu);
 *      komunikat wskazuje pozostałe dźwignie (podatek, racje, jednostki),
 *  (j) wiring: nnsGateForPlayer / nnsEndTurnTooltipText nie czytają kolejki produkcji.
 *
 * Run: node tools/no-negative-stocks-end-turn-gate-levers-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-end-turn-gate-levers-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-end-turn-gate-levers-bundle.cjs');

fs.writeFileSync(ENTRY, "export { decideEndTurnGate, evaluateEndTurnStocks } from '../src/game/no-negative-stocks';\n", 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}
function proj(turn, skObecny, skPo, spObecny, spPo) {
  return { turn, skarbiecObecny: skObecny, skarbiecPo: skPo, spichlerzObecny: spObecny, spichlerzPo: spPo };
}

// (a1) minus skarbca, dźwignia podatku wystarcza (bez jednostek)
{
  const g = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 0, 0, { podatekSkarbiec: 25 });
  ok(g.blokada === true, '(a1) minus skarbca + podatek 25 >= 20 -> blokada');
  ok(g.dzwignie.some(d => d.id === 'podatek-skarbiec' && d.zysk === 25), '(a1) dzwignie zawiera podatek 25');
}
// (a2) minus spichlerza, dźwignia racji wystarcza
{
  const g = M.decideEndTurnGate(proj(12, 100, 100, 3, -8), 0, 0, { suwakZywnosc: 10 });
  ok(g.blokada === true, '(a2) minus spichlerza + racje 10 >= 8 -> blokada');
  ok(g.dzwignie.some(d => d.id === 'suwak-zywnosc' && d.zysk === 10), '(a2) dzwignie zawiera racje 10');
}
// (a3) minus skarbca, same jednostki wystarczają
{
  const g = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 30, 0);
  ok(g.blokada === true, '(a3) minus skarbca + jednostki 30 -> blokada');
  ok(g.dzwignie.some(d => d.id === 'rozwiaz-skarbiec'), '(a3) dzwignie zawiera rozwiazanie jednostek');
}
// (b) żadna dźwignia nie wystarcza -> brak blokady (brak zakleszczenia)
{
  const g = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 5, 0, { podatekSkarbiec: 4 });
  ok(g.blokada === false, '(b) podatek 4 + jednostki 5 < 20 -> brak blokady');
  ok(g.komunikat === '' && g.dzwignie.length === 0, '(b) brak blokady = pusty komunikat i brak dzwigni');
}
// (c) mutacja: bez dźwigni podatku ten sam przypadek (a1) nie blokuje
{
  const g = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 0, 0);
  ok(g.blokada === false, '(c) mutacja: bez podatku przypadek (a1) nie blokuje (czerwony test)');
}
// (d) tury 1-10 zwolnione
{
  const g = M.decideEndTurnGate(proj(10, 5, -20, 0, 0), 0, 0, { podatekSkarbiec: 50 });
  ok(g.blokada === false, '(d) tura 10 zwolniona nawet przy dźwigni podatku');
}
// (e) komunikat: zasób, minus, dźwignie z liczbami
{
  const g = M.decideEndTurnGate(proj(12, 5, -20.4, 0, 0), 30, 0, { podatekSkarbiec: 12.6 });
  ok(/Skarbiec/.test(g.komunikat), '(e) komunikat nazywa zasób');
  ok(/zabraknie 20/.test(g.komunikat), '(e) komunikat podaje minus (20)');
  ok(/podatek złota: \+13 złota\/turę/.test(g.komunikat), '(e) komunikat podaje dźwignię podatku z liczbą (13)');
  ok(/rozwiązanie jednostek \(złoto\): \+30 złota\/turę/.test(g.komunikat), '(e) komunikat podaje dźwignię jednostek (30)');
}
// (g) łączenie dźwigni: podatek 12 + jednostki 10 razem pokrywają minus skarbca 20 (żadna sama nie wystarcza)
{
  const pojedyncze = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 10, 0, { podatekSkarbiec: 12 });
  ok(pojedyncze.blokada === true, '(g) podatek 12 + jednostki 10 razem >= 20 -> blokada');
  ok(pojedyncze.dzwignie.some(d => d.id === 'podatek-skarbiec') && pojedyncze.dzwignie.some(d => d.id === 'rozwiaz-skarbiec'),
    '(g) obie dźwignie (podatek + jednostki) wymienione w dzwignie');
  const samPodatek = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 0, 0, { podatekSkarbiec: 12 });
  ok(samPodatek.blokada === false, '(g) sam podatek 12 < 20 -> brak blokady (łączenie wymagane)');
}
// (h) minus obu zasobów: blokada tylko gdy KAŻDY brak pokryty; spichlerz bez dźwigni blokuje całość
{
  const niePokryty = M.decideEndTurnGate(proj(12, 5, -20, 3, -8), 30, 0, { podatekSkarbiec: 5 });
  ok(niePokryty.blokada === false, '(h) skarbiec pokryty (35>=20), spichlerz bez dźwigni -> brak blokady (brak zakleszczenia)');
  const spichlerzNiePokryty = M.decideEndTurnGate(proj(12, 5, -20, 3, -8), 30, 6, { podatekSkarbiec: 0 });
  ok(spichlerzNiePokryty.blokada === false, '(h) skarbiec pokryty, spichlerz 6 < 8 -> brak blokady');
  const obaPokryte2 = M.decideEndTurnGate(proj(12, 5, -20, 3, -8), 30, 8, { podatekSkarbiec: 0 });
  ok(obaPokryte2.blokada === true, '(h) minus obu zasobów pokryty przez jednostki (30 >= 20, 8 >= 8) -> blokada');
  ok(/Skarbiec/.test(obaPokryte2.komunikat) && /Spichlerz/.test(obaPokryte2.komunikat),
    '(h) komunikat wymienia OBA zasoby na minusie');
}
// (f) wiring
{
  const mainSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  ok(/decideEndTurnGate\(live, _nnsZyskSkarbiec, _nnsZyskSpichlerz, levers\)/.test(mainSrc), '(f) main.ts podaje dźwignie do bramki');
  ok(/getEndTurnTooltip: \(\) => nnsEndTurnTooltipText\(\)/.test(mainSrc), '(f) main.ts wiąże tooltip przycisku');
  const barSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'ui', 'bottomBarHud.ts'), 'utf8');
  ok(/endTipAttr/.test(barSrc) && /getEndTurnTooltip/.test(barSrc), '(f) bottomBarHud ustawia title przycisku');
  const hudSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'ui', 'hud.ts'), 'utf8');
  ok(/legacyEndTipAttr\(\) \+ '>/.test(hudSrc) && /cfg\?\.getEndTurnTooltip/.test(hudSrc), '(f) legacy hud.ts (renderBarLegacy) ustawia title przycisku Zakończ turę');
}

// (i) R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1: komunikat bez wzmianki o kolejce produkcji
{
  const v = M.evaluateEndTurnStocks(proj(12, 5, -20, 0, 0));
  ok(v.blokada === true, '(i) minus skarbca -> evaluateEndTurnStocks blokuje');
  ok(!/kolejk/i.test(v.komunikat), '(i) komunikat evaluateEndTurnStocks NIE zawiera „kolejk” (czerwony na bazie)');
  ok(/podatk/i.test(v.komunikat) && /racj/i.test(v.komunikat) && /jednost/i.test(v.komunikat),
    '(i) komunikat wskazuje podatki, racje i jednostki');
  const g = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 30, 0, { podatekSkarbiec: 12.6, suwakZywnosc: 4 });
  ok(g.blokada === true && !/kolejk/i.test(g.komunikat), '(i) komunikat bramki gracza NIE zawiera „kolejk”');
  ok(g.dzwignie.every(d => !/kolejk/i.test(d.id) && !/kolejk/i.test(d.opis)), '(i) żadna dźwignia gracza nie jest kolejką');
  // dźwignie podatku/racji/jednostki nadal działają po usunięciu kolejki
  ok(g.dzwignie.some(d => d.id === 'podatek-skarbiec') && g.dzwignie.some(d => d.id === 'suwak-zywnosc') &&
    g.dzwignie.some(d => d.id === 'rozwiaz-skarbiec'), '(i) podatek, racje i jednostki nadal dźwigniami gracza');
  const samaRacja = M.decideEndTurnGate(proj(12, 5, -20, 0, 0), 0, 0, { suwakZywnosc: 25 });
  ok(samaRacja.blokada === false, '(i) racje nie pokrywają skarbca (suwak żywności nie działa na złoto) -> brak blokady');
}
// (j) wiring: funkcje bramki gracza nie czytają kolejki produkcji
{
  const mainSrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'main.ts'), 'utf8');
  const a = mainSrc.indexOf('function nnsGateForPlayer(');
  const b = mainSrc.indexOf('function canPlayerInitiateEndTurn(');
  const blok = a >= 0 && b > a ? mainSrc.slice(a, b) : '';
  ok(blok.length > 0, '(j) znaleziono nnsGateForPlayer / nnsEndTurnTooltipText w main.ts');
  ok(!/kolejk|productionQueue|cityProd|\.kolejka/.test(blok), '(j) nnsGateForPlayer / nnsEndTurnTooltipText nie czytają kolejki produkcji');
}

console.log(`no-negative-stocks-end-turn-gate-levers-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
