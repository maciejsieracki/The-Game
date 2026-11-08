'use strict';
/**
 * ai-war-weariness-live-audit-summarize.cjs -- R-WEB-AI-WAR-WEARINESS-LIVE-AUDIT-Q1.
 * node tools/ai-war-weariness-live-audit-summarize.cjs <plik.jsonl> [--md]
 * Z JSONL pomiaru (ai-war-weariness-live-audit-measure.cjs) liczy: wojny (pary, start/koniec, czas, wynik: pokoj/eliminacja/trwa,
 * miasta utracone przez strony, szczyt zmeczenia, najwyzszy stopien oferty, odrzucenia), eliminacje cywilizacji,
 * koncentracje miast (najwieksza civ, HHI) w czasie, sposob zakonczenia (z logow "[Dyplomacja]").
 */
const fs = require('fs');
const file = process.argv[2];
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const key = (a, b) => a + '-' + b;
const wars = new Map(); // key -> war record (aktualna)
const done = [];
let prev = null;
const elim = [];
const conc = [];
for (const r of rows) {
  const owners = new Map(r.owners.map((o) => [o.o, o]));
  const alive = r.owners.filter((o) => !o.elim && o.cities > 0);
  const tot = alive.reduce((s, o) => s + o.cities, 0);
  const max = alive.reduce((m, o) => (o.cities > m.cities ? o : m), { cities: 0 });
  const hhi = tot > 0 ? alive.reduce((s, o) => s + (o.cities / tot) ** 2, 0) : 0;
  conc.push({ turn: r.turn, alive: alive.length, total: tot, maxCiv: max.civ, maxCities: max.cities, maxShare: tot ? max.cities / tot : 0, hhi, per: alive.map((o) => `${o.civ}${o.me ? '*' : ''}:${o.cities}`).join(' ') });
  if (prev) for (const o of r.owners) { const p = prev.owners.find((x) => x.o === o.o); if (p && !p.elim && p.cities > 0 && (o.elim || o.cities === 0)) elim.push({ turn: r.turn, o: o.o, civ: o.civ }); }
  const cur = new Set();
  for (const w of r.wars) {
    const k = key(w.a, w.b); cur.add(k);
    let rec = wars.get(k);
    if (!rec) { rec = { a: w.a, b: w.b, civA: owners.get(w.a)?.civ, civB: owners.get(w.b)?.civ, start: r.turn - w.tw, firstSeen: r.turn, forced: w.forced, peak: 0, stage: 0, rej: 0, minShareA: 1, maxShareA: 0, logs: [] }; wars.set(k, rec); }
    rec.last = r.turn; rec.tw = w.tw; rec.lostA = w.lostA; rec.lostB = w.lostB; rec.forced = rec.forced || w.forced;
    rec.minShareA = Math.min(rec.minShareA, w.share); rec.maxShareA = Math.max(rec.maxShareA, w.share);
    if (w.wear) { rec.peak = Math.max(rec.peak, w.wear.peak); rec.stage = Math.max(rec.stage, w.wear.stage); rec.rej = Math.max(rec.rej, w.wear.rej); }
    for (const l of r.logs) if (/R-WEB-WEARINESS|R-AI-PEACE-2T|CAP-DWA|wypowiada wojne|PEACE-CITY-CESSION/.test(l) && (l.includes(`AI${w.a}`) || l.includes(`AI${w.b}`))) rec.logs.push(`T${r.turn} ${l.replace('[Dyplomacja] ', '').slice(0, 200)}`);
  }
  for (const [k, rec] of Array.from(wars.entries())) {
    if (cur.has(k)) continue;
    const oa = owners.get(rec.a); const ob = owners.get(rec.b);
    const eliminated = (oa && (oa.elim || oa.cities === 0)) || (ob && (ob.elim || ob.cities === 0));
    rec.end = r.turn; rec.result = eliminated ? 'ELIMINACJA' : 'POKOJ/ROZEJM'; rec.dur = rec.end - rec.start;
    done.push(rec); wars.delete(k);
  }
  prev = r;
}
const open = Array.from(wars.values()).map((w) => ({ ...w, end: null, result: 'TRWA', dur: (rows[rows.length - 1].turn) - w.start }));
const all = [...done, ...open].sort((x, y) => x.start - y.start);
const md = process.argv.includes('--md');
const lines = [];
lines.push(`# Podsumowanie ${file.split('/').pop()} (tury 1..${rows[rows.length - 1].turn}, ${rows.length} wierszy)`);
lines.push('');
lines.push('| wojna | start | koniec | dur | wynik | wymus. | utr.A/B | minShareA | szczyt zm. | max stopien | odrz. |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
for (const w of all) lines.push(`| ${w.civA}(${w.a}) vs ${w.civB}(${w.b}) | ${w.start} | ${w.end ?? '-'} | ${w.dur} | ${w.result} | ${w.forced ?? '-'} | ${w.lostA}/${w.lostB} | ${w.minShareA.toFixed(2)} | ${w.peak.toFixed(2)} | ${w.stage} | ${w.rej} |`);
lines.push('');
const cnt = (r) => all.filter((w) => w.result === r).length;
lines.push(`Wojny: ${all.length}; pokoj/rozejm: ${cnt('POKOJ/ROZEJM')}; eliminacja: ${cnt('ELIMINACJA')}; trwa: ${cnt('TRWA')}.`);
lines.push(`Eliminacje cywilizacji: ${elim.length} ${elim.map((e) => `T${e.turn} ${e.civ}(${e.o})`).join(', ')}`);
lines.push('');
lines.push('| tura | zywych civ | miast | najwieksza | jej miast | udzial | HHI | rozklad |');
lines.push('|---|---|---|---|---|---|---|---|');
for (const c of conc.filter((c) => c.turn % 10 === 0 || c.turn === conc[conc.length - 1].turn)) lines.push(`| ${c.turn} | ${c.alive} | ${c.total} | ${c.maxCiv} | ${c.maxCities} | ${c.maxShare.toFixed(2)} | ${c.hhi.toFixed(2)} | ${c.per} |`);
lines.push('');
lines.push('## Logi zakonczenia/oferty (wybrane)');
for (const w of all) for (const l of w.logs.filter((x) => /R-WEB-WEARINESS|R-AI-PEACE-2T|CAP-DWA/.test(x)).slice(0, 6)) lines.push(`- ${w.civA}-${w.civB}: ${l}`);
const out = lines.join('\n');
console.log(md ? out : out);
