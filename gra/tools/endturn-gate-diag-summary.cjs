'use strict';
/**
 * endturn-gate-diag-summary.cjs -- podsumowanie wynikow endturn-gate-diag-measure.cjs (R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1, GOAL 4).
 * Uzycie: node tools/endturn-gate-diag-summary.cjs <on.jsonl> [<off.jsonl>] [--turns 54,55,56,57,58,59,60]
 * Wypisuje: liczbe tur, liste zdarzen `noadvance` (tura, przyczyna z konsoli, stan bramki, prognoza skarbca) oraz tabele czasow tur
 * wybranych tur dla ON i OFF (domyslnie 55-59) + sprawdzenie, czy ktorykolwiek endTurn mial ms = -1 (timeout 500 s).
 */
const fs = require('fs');
const files = process.argv.slice(2).filter((a) => a.endsWith('.jsonl'));
const tIdx = process.argv.indexOf('--turns');
const SHOW = tIdx >= 0 ? process.argv[tIdx + 1].split(',').map(Number) : [55, 56, 57, 58, 59];
const load = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const sum = files.map((f) => {
  const ev = load(f);
  const turns = ev.filter((e) => e.ev === 'turn');
  const no = ev.filter((e) => e.ev === 'noadvance');
  return {
    f, ev, turns, no,
    fix: ev.filter((e) => e.ev === 'gate-fix'),
    errors: ev.filter((e) => e.ev === 'error' || e.ev === 'pageerror'),
    timeouts: turns.filter((t) => t.ms < 0).length,
    done: ev.some((e) => e.ev === 'done'),
    byTurn: new Map(turns.map((t) => [t.turn, t])),
  };
});
for (const s of sum) {
  console.log(`\n== ${s.f}`);
  console.log(`tur zapisanych: ${s.turns.length}, done=${s.done}, timeouty endTurn (ms<0): ${s.timeouts}, bledy: ${s.errors.length}, max ms: ${Math.max(0, ...s.turns.map((t) => t.ms))}`);
  console.log(`noadvance: ${s.no.length}; gate-fix: ${s.fix.length}`);
  for (const n of s.no) {
    const p = n.pre || {};
    console.log(`  noadvance turn0=${n.turn0} attempt=${n.attempt} ms=${n.ms} blokada=${p.blokada} canEnd=${p.canEnd} prognozaSkarbca=${p.forecast && p.forecast.skarbiecPo} podatek=${JSON.stringify(p.tax)} konsola=${JSON.stringify(n.consoleBlocked)}`);
  }
  for (const x of s.fix) console.log(`  gate-fix po turze ${x.turn}: podzial=${JSON.stringify(x.taxsplit)} blokadaPo=${x.gateAfterFix && x.gateAfterFix.blokada}`);
}
if (sum.length >= 1) {
  console.log('\ntura | ' + sum.map((s) => `ms ${s.f.split('/').slice(-2, -1)[0]}`).join(' | '));
  for (const t of SHOW) console.log(`${t} | ` + sum.map((s) => (s.byTurn.get(t) ? s.byTurn.get(t).ms : 'brak')).join(' | '));
}

// --- tryb --toggle (+ --from N): mediany czasu tury dla rec=1 (ksiega zapisuje) vs rec=0 (zapis wylaczony), kolejnosc ABBA ---
if (process.argv.includes('--toggle')) {
  const med = (a) => { const x = [...a].sort((p, q) => p - q); const m = x.length >> 1; return x.length ? (x.length % 2 ? x[m] : (x[m - 1] + x[m]) / 2) : NaN; };
  const avg = (a) => a.reduce((p, q) => p + q, 0) / (a.length || 1);
  const fi = process.argv.indexOf('--from');
  const from = fi >= 0 ? Number(process.argv[fi + 1]) : 2;
  for (const s of sum) {
    const on = s.turns.filter((t) => t.rec === 1 && t.turn >= from).map((t) => t.ms);
    const off = s.turns.filter((t) => t.rec === 0 && t.turn >= from).map((t) => t.ms);
    const mOn = med(on); const mOff = med(off);
    console.log(`\n[toggle] ${s.f}: tury od ${from}; ON n=${on.length} mediana=${mOn} srednia=${avg(on).toFixed(0)} | OFF n=${off.length} mediana=${mOff} srednia=${avg(off).toFixed(0)} | roznica mediany ON-OFF = ${(mOn - mOff).toFixed(0)} ms (${(((mOn - mOff) / mOff) * 100).toFixed(2)}%), srednich ${(((avg(on) - avg(off)) / avg(off)) * 100).toFixed(2)}%`);
  }
}
