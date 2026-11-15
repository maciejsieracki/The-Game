'use strict';
/**
 * resource-ledger-hook-gate-test.cjs -- R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 (GOAL 1):
 * hak `openEmpirePanel` (zrzuty karty "Skad zapasy" z prawdziwej gry) istnieje WYLACZNIE za bramka ?civTest=1
 * (bez flagi obiekt `__ledgerTestDebug` nie jest tworzony). Test statyczny na src/main.ts:
 *  H1: dokladnie jedno przypisanie `__ledgerTestDebug = {` i dokladnie jedno `openEmpirePanel:` w main.ts;
 *  H2: przypisanie poprzedza w ciagu 6 linii `if (typeof location !== 'undefined' && /[?&]civTest=1/.test(location.search)) {`;
 *  H3: `openEmpirePanel` lezy w tym samym obiekcie (przed zamknieciem `};` obiektu `__ledgerTestDebug`);
 *  H4: hak wola istniejacy `openEmpireDetailFromHud(` (nie reimplementacje);
 *  H5 (mutacja): po wycieciu bramki z kopii tekstu H2 przestaje byc spelnione (test wykrywa brak bramki).
 * Test dynamiczny (bez flagi `typeof window.__ledgerTestDebug === 'undefined'`) jest w tools/resource-ledger-shots-live.cjs.
 * Uruchom z gra/: node tools/resource-ledger-hook-gate-test.cjs
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
let pass = 0; let fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL:', m); } };

const ASSIGN = '(window as any).__ledgerTestDebug = {';
const GUARD_RE = /if \(typeof location !== 'undefined' && \/\[\?&\]civTest=1\/\.test\(location\.search\)\) \{/;

function analyse(text) {
  const assigns = text.split(ASSIGN).length - 1;
  const opens = text.split('openEmpirePanel:').length - 1;
  const at = text.indexOf(ASSIGN);
  const head = at >= 0 ? text.slice(Math.max(0, at - 700), at).split('\n').slice(-7).join('\n') : '';
  const guarded = GUARD_RE.test(head);
  const openAt = text.indexOf('openEmpirePanel:');
  // koniec obiektu: pierwszy wiersz "      };" (wciecie 6) po przypisaniu
  const endRe = /\n      \};\n/g; endRe.lastIndex = at;
  const endM = at >= 0 ? endRe.exec(text) : null;
  const inside = at >= 0 && openAt > at && endM && openAt < endM.index;
  const callsReal = /openEmpirePanel:[^\n]*openEmpireDetailFromHud\(/.test(text);
  return { assigns, opens, guarded, inside, callsReal };
}

const a = analyse(src);
ok(a.assigns === 1, `H1: jedno przypisanie __ledgerTestDebug (jest ${a.assigns})`);
ok(a.opens === 1, `H1: jedno openEmpirePanel (jest ${a.opens})`);
ok(a.guarded, 'H2: przypisanie __ledgerTestDebug stoi za bramka civTest=1');
ok(a.inside, 'H3: openEmpirePanel wewnatrz obiektu __ledgerTestDebug');
ok(a.callsReal, 'H4: hak wola istniejace openEmpireDetailFromHud(');

// H5: mutacja -- usuniecie bramki z kopii tekstu musi zostac wykryte
{
  const at = src.indexOf(ASSIGN);
  const headStart = Math.max(0, at - 700);
  const mutated = src.slice(0, headStart) + src.slice(headStart, at).replace(GUARD_RE, 'if (true) {') + src.slice(at);
  const m = analyse(mutated);
  ok(m.guarded === false, 'H5: mutacja (bramka -> if (true)) jest wykrywana przez H2');
}

console.log(`resource-ledger-hook-gate-test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
