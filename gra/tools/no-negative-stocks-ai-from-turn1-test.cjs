'use strict';
/**
 * no-negative-stocks-ai-from-turn1-test.cjs — R-WEB-NNS-AI-BALANCE-FROM-TURN1-Q1 (decyzja właściciela 2026-11-14).
 *
 * Sprawdza src/game/no-negative-stocks.ts:
 *  - AI równoważy skarbiec/spichlerz OD TURY 1 (NNS_AI_BALANCE_TURN_MIN = 1), w turach 1, 5, 10 i 11,
 *    przy prognozie ujemnej: aktywne = true, zakupy wstrzymane, plan niepusty gdy są dźwignie,
 *  - ta sama logika dla każdego AI (brak gałęzi po ownerId w tej funkcji),
 *  - AI bez minusu w T1 nie jest aktywne (brak zbędnego działania),
 *  - mutacja pomiarowa: flaga równoważenia wyłączona -> T1 nieaktywne (test wykrywa wyłączenie),
 *  - gracz: wyjątek 1–10 zostaje (evaluateEndTurnStocks w turach 1, 5, 10 bez blokady; w 11 blokada),
 *  - NNS_WOLNE_TURY nadal = 10 (próg gracza bez zmian).
 *
 * Na bazie sprzed zmiany (próg AI = 11) pierwsze asercje dla tur 1/5/10 są CZERWONE.
 *
 * Run: node tools/no-negative-stocks-ai-from-turn1-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-ai-from-turn1-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-ai-from-turn1-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  NNS_WOLNE_TURY,
  NNS_AI_BALANCE_TURN_MIN,
  evaluateEndTurnStocks,
  decideAiOwnerBalance,
  buildAiLevers,
  setNnsAiBalanceEnabled,
  isNnsAiBalanceEnabled,
} from '../src/game/no-negative-stocks';
`, 'utf8');

let M;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  M = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) {}
}

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

// Dźwignie AI: podatek + jednostki wsparcia (obronne nigdy nie są rozwiązywane).
const levers = M.buildAiLevers({
  podatekSkarbiec: 3,
  jednostkiWsparcia: [{ id: 'tani', stock: 'skarbiec', zysk: 2, koszt: 3 }],
  jednostkiObronne: [{ id: 'mur', stock: 'skarbiec', zysk: 5, koszt: 50 }],
});

// 1) Próg AI od tury 1.
ok(M.NNS_AI_BALANCE_TURN_MIN === 1, 'prog AI = 1');
ok(M.NNS_WOLNE_TURY === 10, 'prog gracza (NNS_WOLNE_TURY) bez zmian = 10');

// 2) AI równoważy w turach 1, 5, 10, 11 przy minusie skarbca.
for (const t of [1, 5, 10, 11]) {
  const d = M.decideAiOwnerBalance(t, -5, 0, levers);
  ok(d.aktywne === true, `AI tura ${t}: równoważenie aktywne przy minusie`);
  ok(d.wstrzymajZakupy === true, `AI tura ${t}: zakupy wstrzymane`);
  ok(d.plan.akcje.length > 0, `AI tura ${t}: plan z dźwigniami niepusty`);
  ok(d.rozwiazJednostki.indexOf('mur') === -1, `AI tura ${t}: jednostka obronna nigdy nie rozwiązywana`);
}

// 3) Minus spichlerza w T1 także aktywuje równoważenie (ten sam kod dla skarbca i spichlerza).
{
  const d = M.decideAiOwnerBalance(1, 10, -4, levers);
  ok(d.aktywne === true && d.wstrzymajZakupy === true, 'AI tura 1: minus spichlerza aktywuje równoważenie');
}

// 4) Bez minusu w T1: nieaktywne (brak zbędnego działania).
{
  const d = M.decideAiOwnerBalance(1, 100, 100, levers);
  ok(d.aktywne === false && d.wstrzymajZakupy === false && d.rozwiazJednostki.length === 0,
    'AI tura 1 bez minusu: nieaktywne');
}

// 5) Determinizm: ta sama wejście -> ta sama decyzja (T1).
{
  const a = M.decideAiOwnerBalance(1, -7, -2, levers);
  const b = M.decideAiOwnerBalance(1, -7, -2, levers);
  ok(JSON.stringify(a) === JSON.stringify(b), 'AI tura 1: decyzja deterministyczna');
}

// 6) Mutacja pomiarowa: flaga równoważenia wyłączona -> T1 z minusem nieaktywne (wykrywalne).
M.setNnsAiBalanceEnabled(false);
{
  const wyl = M.decideAiOwnerBalance(1, -5, -5, levers);
  ok(wyl.aktywne === false && wyl.wstrzymajZakupy === false, 'mutacja: flaga off -> T1 nieaktywne');
}
M.setNnsAiBalanceEnabled(true);
ok(M.isNnsAiBalanceEnabled() === true, 'flaga przywrócona na włączoną');

// 7) Gracz: wyjątek 1–10 zostaje (bez blokady przy ujemnej prognozie), od 11 blokada.
const base = { skarbiecObecny: 100, skarbiecPo: 100, spichlerzObecny: 100, spichlerzPo: 100 };
for (const t of [1, 5, 10]) {
  const v = M.evaluateEndTurnStocks({ ...base, turn: t, skarbiecPo: -50 });
  ok(v.wyjatekTur === true && v.blokada === false, `gracz tura ${t}: bez blokady (wyjątek zostaje)`);
}
{
  const v = M.evaluateEndTurnStocks({ ...base, turn: 11, skarbiecObecny: 30, skarbiecPo: -20 });
  ok(v.blokada === true, 'gracz tura 11: blokada przy minusie (bez zmian)');
}

console.log(`no-negative-stocks-ai-from-turn1-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
