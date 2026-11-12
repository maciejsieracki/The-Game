'use strict';
/**
 * copper-income-audit-summarize.cjs -- R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1.
 * Czyta JSONL z copper-income-audit-measure.cjs i drukuje (markdown):
 *  1) tabelę tura -> zapas Rudy miedzi / Brązu per GŁÓWNA cywilizacja (co `--every` tur),
 *  2) bilans źródeł per cywilizacja (suma ledgera wg źródła = stos wywołań), osobno ruda i braz,
 *  3) resztę NIEOPISANĄ (delta zapasu - suma ledgera) per cywilizacja,
 *  4) maksimum zapasu Rudy/Brązu w grze + kto i w której turze.
 * Uzycie: node tools/copper-income-audit-summarize.cjs <plik.jsonl> [--every 10] [--keys ruda,braz]
 */
const fs = require('fs');
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; }
const file = process.argv[2];
const EVERY = Number(arg('every', '10'));
const KEYS = arg('keys', 'ruda,braz').split(',');
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
if (!rows.length) { console.log('brak danych'); process.exit(0); }

const majors = rows[0].owners.filter((o) => !o.cs).map((o) => o.o);
const civOf = new Map(); for (const r of rows) for (const o of r.owners) civOf.set(o.o, o.civ + (o.cs ? '(MP)' : ''));
const label = (o) => `${o}:${civOf.get(o)}`;

// 1) tabela
console.log(`# ${file.split('/').pop()} — tury ${rows[0].turn}..${rows[rows.length - 1].turn}\n`);
for (const k of KEYS) {
  console.log(`## Zapas \`${k}\` per główna cywilizacja (co ${EVERY} tur)\n`);
  console.log('| tura | ' + majors.map(label).join(' | ') + ' |');
  console.log('|---|' + majors.map(() => '---:').join('|') + '|');
  for (const r of rows) {
    if (r.turn % EVERY !== 0 && r !== rows[rows.length - 1]) continue;
    const by = new Map(r.owners.map((o) => [o.o, o]));
    console.log(`| ${r.turn} | ` + majors.map((m) => { const o = by.get(m); return o ? `${Math.round(o.stock[k])}${o.cities ? '' : '†'}` : '-'; }).join(' | ') + ' |');
  }
  console.log('');
}

// 2) bilans źródeł + 3) reszta
const bal = new Map(); // owner|key -> Map(src -> sum)
const resid = new Map(); // owner|key -> sum
const residTurns = new Map(); // owner|key -> [{turn, amt}]
let prev = null;
for (const r of rows) {
  for (const e of r.ledger) {
    if (!KEYS.includes(e.k)) continue;
    const kk = e.o + '|' + e.k;
    const m = bal.get(kk) ?? new Map();
    const src = e.src.replace(/<\?/g, '');
    m.set(src, (m.get(src) ?? 0) + e.sum); bal.set(kk, m);
  }
  if (prev) {
    const pb = new Map(prev.owners.map((o) => [o.o, o]));
    const led = new Map();
    for (const e of r.ledger) { const kk = e.o + '|' + e.k; led.set(kk, (led.get(kk) ?? 0) + e.sum); }
    for (const o of r.owners) for (const k of KEYS) {
      const kk = o.o + '|' + k;
      const d = o.stock[k] - (pb.get(o.o)?.stock[k] ?? 0);
      const res = Math.round((d - (led.get(kk) ?? 0)) * 100) / 100;
      if (Math.abs(res) >= 1) {
        resid.set(kk, (resid.get(kk) ?? 0) + res);
        const arr = residTurns.get(kk) ?? []; arr.push({ turn: r.turn, amt: res }); residTurns.set(kk, arr);
      }
    }
  }
  prev = r;
}
for (const k of KEYS) {
  console.log(`## Bilans źródeł \`${k}\` (suma po całym biegu) — główne cywilizacje\n`);
  for (const m of majors) {
    const mp = bal.get(m + '|' + k); if (!mp) continue;
    const items = [...mp.entries()].filter(([, v]) => Math.abs(v) >= 1).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const res = Math.round(resid.get(m + '|' + k) ?? 0);
    console.log(`- **${label(m)}**: ` + items.slice(0, 8).map(([s, v]) => `${Math.round(v)} ← \`${s}\``).join('; ') + (res ? `; NIEOPISANE ${res} (tury: ${(residTurns.get(m + '|' + k) ?? []).slice(0, 6).map((x) => x.turn + ':' + Math.round(x.amt)).join(', ')})` : ''));
  }
  console.log('');
}

// 4) maksima
for (const k of KEYS) {
  let best = { v: -1 };
  for (const r of rows) for (const o of r.owners) if (o.stock[k] > best.v) best = { v: o.stock[k], o: o.o, turn: r.turn, era: o.era, cap: o.cap };
  console.log(`MAX \`${k}\`: ${Math.round(best.v)} (${label(best.o)}, tura ${best.turn}, epoka ${best.era}, cap ${best.cap})`);
}
