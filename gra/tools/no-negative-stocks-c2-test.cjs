'use strict';
/**
 * no-negative-stocks-c2-test.cjs — R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (etap C2).
 *
 * Sprawdza:
 *  - decideAiOwnerBalance: brama tury (tury 1–10 wolne), flaga wyłączona, wstrzymanie zakupów,
 *    wybór jednostek wsparcia od najdroższej, brak rozwiązania jednostek obronnych,
 *  - wiązanie z main.ts (statyczne): wywołanie decideAiOwnerBalance w bankowaniu AI,
 *    bramka zakupów aiNnsHoldOwners, funkcja disbandAiSupportUnit (mutacja: usunięcie
 *    wywołania lub bramki powinno wywalić test).
 *
 * NIE mierzy trajektorii 15 AI × 3 ziarna × 150 tur (runner headless — NIE_WYKONANE w tym etapie).
 *
 * Run: node tools/no-negative-stocks-c2-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.no-negative-stocks-c2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.no-negative-stocks-c2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildAiLevers,
  decideAiOwnerBalance,
  setNnsAiBalanceEnabled,
  isNnsAiBalanceEnabled,
  NNS_AI_BALANCE_TURN_MIN,
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

const levers = M.buildAiLevers({
  podatekSkarbiec: 0,
  wstrzymania: [],
  jednostkiWsparcia: [
    { id: 'tani', stock: 'skarbiec', zysk: 2, koszt: 3 },
    { id: 'drogi', stock: 'skarbiec', zysk: 2, koszt: 9 },
  ],
  jednostkiObronne: [{ id: 'mur', stock: 'skarbiec', zysk: 5, koszt: 50 }],
});

// Brama tury: tury 1–10 wolne.
ok(M.NNS_AI_BALANCE_TURN_MIN === 11, 'próg tury = 11');
const wolna = M.decideAiOwnerBalance(10, -5, 0, levers);
ok(wolna.aktywne === false && wolna.rozwiazJednostki.length === 0, 'tura 10: brak równoważenia');

// Brak minusu: nieaktywne.
const czysto = M.decideAiOwnerBalance(20, 100, 100, levers);
ok(czysto.aktywne === false && czysto.wstrzymajZakupy === false, 'brak minusu: nieaktywne');

// Minus skarbca w turze 20: aktywne, zakupy wstrzymane, najdroższe wsparcie pierwsze.
const d = M.decideAiOwnerBalance(20, -3, 0, levers);
ok(d.aktywne === true, 'minus skarbca: aktywne');
ok(d.wstrzymajZakupy === true, 'minus skarbca: zakupy wstrzymane');
ok(d.rozwiazJednostki[0] === 'drogi', 'najdroższa jednostka wsparcia pierwsza');
ok(!d.rozwiazJednostki.includes('mur'), 'jednostka obronna nigdy nie rozwiązywana');
ok(d.plan.pokryte === true, 'brak 3 pokryty dwiema jednostkami (zysk 2+2)');

// Flaga wyłączona (mutacja pomiarowa): nic się nie dzieje.
M.setNnsAiBalanceEnabled(false);
const wył = M.decideAiOwnerBalance(20, -3, -3, levers);
ok(wył.aktywne === false && wył.rozwiazJednostki.length === 0 && wył.wstrzymajZakupy === false, 'flaga off: brak działania');
ok(M.isNnsAiBalanceEnabled() === false, 'flaga off odczytywalna');
M.setNnsAiBalanceEnabled(true);
ok(M.isNnsAiBalanceEnabled() === true, 'flaga przywrócona na włączoną (domyślnie)');

// Wiązanie statyczne z main.ts i ai-turn.
const mainTs = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
ok(/decideAiOwnerBalance\(turn,\s*aiSkarb,\s*nnsSpichlerzPo,\s*nnsLevers\)/.test(mainTs), 'main.ts wywołuje decideAiOwnerBalance w bankowaniu AI');
ok(/!aiNnsHoldOwners\.has\(ownerId\)\s*&&\s*shouldAIPurchaseUnit/.test(mainTs), 'main.ts: bramka zakupów AI (aiNnsHoldOwners)');
ok(/function disbandAiSupportUnit\(unitId: string, ownerId: number\)/.test(mainTs), 'main.ts: disbandAiSupportUnit zdefiniowana');
ok(/for \(const uid of nnsDec\.rozwiazJednostki\) disbandAiSupportUnit\(uid, oid\)/.test(mainTs), 'main.ts: rozwiązanie jednostek wsparcia wpięte');

try { fs.unlinkSync(ENTRY); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`no-negative-stocks-c2-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
