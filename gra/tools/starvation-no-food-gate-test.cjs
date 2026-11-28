'use strict';
/**
 * starvation-no-food-gate-test.cjs — R-WEB-STARVATION-IMPL-Q44A (Q42=C).
 * Kontrakt: tura gracza przechodzi z ujemnym zapasem żywności (brak blokady z powodu spichlerza);
 * skarbiec nadal blokuje; wywołanie bez opcji ignorujZywnosc (ścieżka AI / inne) bez zmian.
 * Mutacje semantyczne: usunięcie opcji ignorujZywnosc albo filtra spichlerza musi zaczerwienić test.
 * Run: node tools/starvation-no-food-gate-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.starvation-no-food-gate-entry.ts');
const BUNDLE = path.resolve(__dirname, '.starvation-no-food-gate-bundle.cjs');
fs.writeFileSync(ENTRY, `export { decideEndTurnGate } from '../src/game/no-negative-stocks';\n`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});
const M = require(BUNDLE);

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) passed++; else { failed++; console.error('FAIL:', label); }
}

const ZYW = { ignorujZywnosc: true, suwakZywnosc: 10, podatekSkarbiec: 0 };
// Tura 16 (po oknie łaski): zapas żywności ujemny po turze, skarbiec dodatni.
const food = { turn: 16, skarbiecObecny: 100, skarbiecPo: 100, spichlerzObecny: 5, spichlerzPo: -18 };

// 1) Ujemna żywność NIE blokuje tury gracza.
{
  const g = M.decideEndTurnGate(food, 0, 0, ZYW);
  ok(g.blokada === false, 'gracz: ujemna żywność nie blokuje tury (ignorujZywnosc)');
  ok(g.komunikat === '', 'gracz: brak komunikatu blokady dla żywności');
}
// 2) Bez opcji ta sama sytuacja nadal blokuje (kontrakt AI / innych wywołań bez zmian).
{
  const g = M.decideEndTurnGate(food, 0, 0, { suwakZywnosc: 10 });
  ok(g.blokada === true && g.zasob === 'spichlerz', 'bez opcji: ujemna żywność blokuje (AI bez zmian)');
}
// 3) Skarbiec ujemny nadal blokuje, także przy ujemnej żywności.
{
  const g = M.decideEndTurnGate({ ...food, skarbiecPo: -20 }, 0, 0, { ...ZYW, podatekSkarbiec: 5 });
  ok(g.blokada === true && g.zasob === 'skarbiec', 'skarbiec<0 nadal blokuje przy ignorujZywnosc');
}
// 4) Dodatnia żywność: brak blokady niezależnie od opcji.
{
  const g = M.decideEndTurnGate({ ...food, spichlerzPo: 3 }, 0, 0, ZYW);
  ok(g.blokada === false, 'dodatnia żywność: brak blokady');
}

console.log(`starvation-no-food-gate-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
process.exit(failed === 0 ? 0 : 1);
