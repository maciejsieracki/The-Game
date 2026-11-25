'use strict';
/**
 * ai-ai-treaty-live-proof-wiring-test.cjs — R-WEB-AI-AI-TREATIES-LIVE-PROOF-INERT-Q1, punkt (2): wiring ticku w żywej grze.
 *
 * Analizator wyniku `ai-ai-treaty-live-proof-wiring-run.cjs` (ziarno 4242, tor AI↔AI WŁĄCZONY hakiem civTest przez całą grę).
 * Czyta <outDir>/seed4242.jsonl (metryki per właściciel), seed4242.wiring.log (linie konsoli „AI↔AI”),
 * seed4242.events.log (pageerror/crash). Nie uruchamia gry.
 *
 * Asercje:
 *   A1  ≥59 zakończonych tur EOT z torem włączonym (wiersze JSONL; turn 60 = 59 EOT)
 *   A2  skarbiec każdego właściciela w każdej turze ≥ 0 (metryka ownerTreasury)
 *   A3  dopłata D (AI↔AI) jest zalogowana w torze: albo co najmniej jedno NAP z dopłatą D>0 (linia „dopłata D ¤ od …”),
 *       albo co najmniej jeden SOJUSZ AI↔AI z dopłatą D>0 (linia „Sojusz … dopłata D ¤ od …”). R-WEB-TEST-DEBT-Q14-B (runda 3):
 *       dopłata D obowiązuje przy SOJUSZU (FALA 892, ai-ai-treaty-params.json); NAP z dopłatą jest OPCJONALNY — owner
 *       potwierdził „NAP AI↔AI zostaje”. Poprzednia wersja wymagała wyłącznie NAP (STARY-PIN wobec FALI 892).
 *   A4  zero pageerror / crash w events.log
 * Liczniki (raport, NIE asercje): liczba wierszy z aktywnym torem, liczba linii NAP, sumy D, liczba linii „Umowa Handlowa”.
 * NIE ZMIERZONO: liczba prób ticku i powody odmów — tick nie eksportuje liczników (bez zmiany logiki gry).
 *
 * Usage: node tools/ai-ai-treaty-live-proof-wiring-test.cjs <outDirAbs> [seed=4242]
 */
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2];
const SEED = process.argv[3] || '4242';
let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
  else { fail++; console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

if (!OUT || !fs.existsSync(OUT)) { console.error('Brak katalogu wyniku: ' + OUT); process.exit(2); }
const rows = fs.readFileSync(path.join(OUT, `seed${SEED}.jsonl`), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const wiringPath = path.join(OUT, `seed${SEED}.wiring.log`);
const wiring = fs.existsSync(wiringPath) ? fs.readFileSync(wiringPath, 'utf8').split('\n').filter(Boolean) : [];
const evPath = path.join(OUT, `seed${SEED}.events.log`);
const events = fs.existsSync(evPath) ? fs.readFileSync(evPath, 'utf8').split('\n').filter(Boolean) : [];

const nap = wiring.filter(l => l.includes('Pakt o nieagresji'));
const napD = nap.map(l => { const m = l.match(/dopłata (\d+(?:\.\d+)?) ¤ od/); return m ? Number(m[1]) : 0; });
const dopl = wiring.filter(l => /dopłata \d+ ¤ od/.test(l));
const handlowe = wiring.filter(l => l.includes('Umowa Handlowa'));
// R-WEB-TEST-DEBT-Q14-B (runda 3): sojusz AI↔AI z dopłatą D (linia „AI↔AI Sojusz … (pełny, bezterminowy), dopłata N ¤ od …”).
const sojusze = wiring.filter(l => /Sojusz .*\(pełny/.test(l));
const sojuszD = sojusze.map(l => { const m = l.match(/dopłata (\d+(?:\.\d+)?) ¤ od/); return m ? Number(m[1]) : 0; });

let minS = Infinity; let minWhere = null; let negCount = 0;
for (const r of rows) for (const o of r.owners || []) {
  if (typeof o.skarbiec !== 'number') continue;
  if (o.skarbiec < minS) { minS = o.skarbiec; minWhere = { turn: r.turn, owner: o.owner }; }
  if (o.skarbiec < 0) negCount++;
}

console.log(`Wiring ziarno ${SEED}: wiersze=${rows.length}, linie NAP=${nap.length}, dopłaty(log)=${napD.reduce((a, b) => a + b, 0)} ¤, ` +
  `linie 'Umowa Handlowa' (tor handlowy, nie NAP)=${handlowe.length}`);
console.log('Asercje:');
assert('A1 ≥59 zakończonych tur EOT z torem włączonym (turn 60 osiągnięty: 59 wierszy)', rows.length >= 59, { rows: rows.length });
assert('A2 skarbiec ≥ 0 we wszystkich turach i właścicielach', negCount === 0, { min: minS, minWhere, negCount });
const napZDoplata = nap.length >= 1 && napD.some(d => d > 0) && dopl.length >= napD.filter(d => d > 0).length;
const sojuszZDoplata = sojuszD.some(d => d > 0);
assert('A3 dopłata D AI↔AI zalogowana: NAP z dopłatą D>0 LUB sojusz (pełny) z dopłatą D>0 (przelew D zaplanowany i zapisany)',
  napZDoplata || sojuszZDoplata,
  { nap: nap.length, napD, sojusze: sojusze.length, sojuszD, dopl: dopl.length });
assert('A4 zero pageerror / crash w events.log', !events.some(l => / (pageerror|crash) /.test(l)), events.filter(l => / (pageerror|crash) /.test(l)).slice(0, 3));
console.log(`\nWynik: ${pass} OK / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
