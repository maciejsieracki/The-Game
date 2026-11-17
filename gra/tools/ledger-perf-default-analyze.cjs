/**
 * R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1 (r3): analiza par ON/OFF ksiegi „Skad zapasy” na WSPOLNYM slocie.
 * Tylko odczyt plikow JSONL runnera (ai-economy-measure-run.cjs); nic nie uruchamia.
 *
 * Uzycie:
 *   node tools/ledger-perf-default-analyze.cjs --from 51 --to 80 --warm 51,61,71,76 \
 *        on1=<out-on1>/seed4242.jsonl off1=<out-off1>/seed4242.jsonl off2=... on2=...
 * Etykiety MUSZA zaczynac sie od `on` lub `off`; kolejnosc na wspolnym slocie = kolejnosc argumentow.
 * --warm = tury pierwsze po wczytaniu slotu (rozgrzewka), odrzucane w analizie (jawnie wypisane).
 * Wyjscie: JSON (stdout) z tabelami per tura, medianami/srednimi Delta%, rozstepem same-variant i werdyktem progu 10%.
 */
const fs = require('fs');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const FROM = parseInt(arg('from', '51'), 10);
const TO = parseInt(arg('to', '80'), 10);
const MAXLOAD = parseFloat(arg('maxload', 'Infinity'));
const WARM = new Set(String(arg('warm', '')).split(',').filter(Boolean).map(Number));
const runs = process.argv.slice(2).filter(a => /^(on|off)\w*=/.test(a)).map(a => {
  const [label, file] = [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)];
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  const byTurn = new Map();
  for (const r of rows) byTurn.set(r.turn, r); // ostatni zapis tury wygrywa
  return { label, mode: label.startsWith('off') ? 'off' : 'on', byTurn };
});

const med = a => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const r2 = x => Math.round(x * 100) / 100;

const turns = [];
for (let t = FROM; t <= TO; t++) if (!WARM.has(t) && runs.every(r => r.byTurn.has(t) && (r.byTurn.get(t).load1 || 0) <= MAXLOAD)) turns.push(t); // --maxload: odrzuca tury, w ktorych KTOREKOLWIEK przebieg mial load1 > prog
const missing = [];
for (const r of runs) for (let t = FROM; t <= TO; t++) if (!r.byTurn.has(t)) missing.push(r.label + ':t' + t);

const out = { window: [FROM, TO], maxLoad1: Number.isFinite(MAXLOAD) ? MAXLOAD : null, warmDiscarded: [...WARM], turnsAnalysed: turns.length, missing, runs: {} };
for (const r of runs) {
  const secs = turns.map(t => r.byTurn.get(t).sec);
  out.runs[r.label] = {
    mode: r.mode, meanSec: r2(mean(secs)), medianSec: r2(med(secs)),
    meanLoad1: r2(mean(turns.map(t => r.byTurn.get(t).load1 || 0))),
    ledgerRecording: [...new Set(turns.map(t => r.byTurn.get(t).ledgerRecording))],
    ledgerBytes: Object.fromEntries([...r.byTurn.values()].filter(x => x.ledgerStats && typeof x.ledgerStats === 'object' && x.turn >= FROM - 1 && x.turn <= TO)
      .map(x => ['t' + x.turn, x.ledgerStats.bytes])),
  };
}

const pct = (a, b) => (a - b) / b * 100; // a wzgledem b
const ons = runs.filter(r => r.mode === 'on'), offs = runs.filter(r => r.mode === 'off');
const pairs = [];
for (const on of ons) for (const off of offs) {
  const d = turns.map(t => pct(on.byTurn.get(t).sec, off.byTurn.get(t).sec));
  const sumOn = turns.reduce((s, t) => s + on.byTurn.get(t).sec, 0), sumOff = turns.reduce((s, t) => s + off.byTurn.get(t).sec, 0);
  pairs.push({ on: on.label, off: off.label, medianPerTurnDeltaPct: r2(med(d)), meanPerTurnDeltaPct: r2(mean(d)), totalTimeDeltaPct: r2(pct(sumOn, sumOff)) });
}
out.pairsOnVsOff = pairs;
const allTotal = pairs.map(p => p.totalTimeDeltaPct);
out.overall = { medianTotalDeltaPct: r2(med(allTotal)), meanTotalDeltaPct: r2(mean(allTotal)),
  medianPerTurnDeltaPct: r2(med(pairs.map(p => p.medianPerTurnDeltaPct))) };

// Rozstep szumu: roznica calkowitego czasu miedzy dwoma przebiegami TEGO SAMEGO wariantu (na tych samych turach).
const same = [];
for (const grp of [ons, offs]) for (let i = 0; i < grp.length; i++) for (let j = i + 1; j < grp.length; j++) {
  const a = turns.reduce((s, t) => s + grp[i].byTurn.get(t).sec, 0), b = turns.reduce((s, t) => s + grp[j].byTurn.get(t).sec, 0);
  same.push({ a: grp[i].label, b: grp[j].label, totalDeltaPct: r2(pct(a, b)) });
}
out.sameVariantSpread = same;
const maxSpread = same.length ? Math.max(...same.map(s => Math.abs(s.totalDeltaPct))) : NaN;
out.maxSameVariantSpreadPct = r2(maxSpread);

// Okna tur (wzgledem calego okna FROM..TO), tylko tury analizowane.
const wins = [[51, 60], [61, 70], [71, 80]];
out.byWindow = wins.map(([a, b]) => {
  const ts = turns.filter(t => t >= a && t <= b);
  if (!ts.length) return { window: [a, b], n: 0 };
  const tot = r => ts.reduce((s, t) => s + r.byTurn.get(t).sec, 0);
  const d = pairs.map(p => pct(tot(ons.find(o => o.label === p.on)), tot(offs.find(o => o.label === p.off))));
  return { window: [a, b], n: ts.length, medianTotalDeltaPct: r2(med(d)), meanTotalDeltaPct: r2(mean(d)) };
});

// Kolejnosc: ON-pierwszy vs OFF-pierwszy (efekt rozgrzewki/pamieci podrecznej) -- pary na tych samych turach,
// dzielone wg tego, czy ON w danej parze byl uruchomiony PRZED (onFirst) czy PO (offFirst) wariancie OFF.
const order = runs.map(r => r.label);
const idx = l => order.indexOf(l);
const byOrder = { onFirst: [], offFirst: [] };
for (const p of pairs) (idx(p.on) < idx(p.off) ? byOrder.onFirst : byOrder.offFirst).push(p.totalTimeDeltaPct);
out.byRunOrder = { onFirst: { n: byOrder.onFirst.length, meanTotalDeltaPct: r2(mean(byOrder.onFirst)) }, offFirst: { n: byOrder.offFirst.length, meanTotalDeltaPct: r2(mean(byOrder.offFirst)) } };
// CSV per tura (do evidence): turn, sec dla kazdego przebiegu, load1.
const csvPath = arg('csv', '');
if (csvPath) {
  const hdr = ['turn', ...runs.flatMap(r => [r.label + '_sec', r.label + '_load1', r.label + '_ledgerBytes'])];
  const lines = [hdr.join(',')];
  for (let t = FROM; t <= TO; t++) {
    lines.push([t + (WARM.has(t) ? '(warm,odrzucona)' : ''), ...runs.flatMap(r => { const x = r.byTurn.get(t); return x ? [x.sec, x.load1, x.ledgerStats && x.ledgerStats.bytes !== undefined ? x.ledgerStats.bytes : ''] : ['', '', '']; })].join(','));
  }
  fs.writeFileSync(csvPath, lines.join('\n') + '\n');
}
out.order = order;
out.verdict10pct = (!Number.isFinite(maxSpread) || maxSpread >= 10)
  ? 'NIE ROZSTRZYGNIETE (rozstep same-variant >= 10% lub brak pary)'
  : (out.overall.medianTotalDeltaPct > 10 ? 'PRZEKROCZONY' : 'NIEPRZEKROCZONY');
console.log(JSON.stringify(out, null, 2));
