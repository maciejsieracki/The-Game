'use strict';
/**
 * war-duration-summarize.cjs -- R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1.
 * Analiza jsonl z war-duration-measure.cjs: lista wojen (start, koniec, czas, typ, powod konca) + rozklady.
 *   node tools/war-duration-summarize.cjs <plik.jsonl> [...] [--json <wyjscie.json>]
 *
 * Definicje (z pol __wwDump, kolejne rekordy tur):
 * - wojna = para (a,b) w rekordach `wars`; start = rec.turn - tw z pierwszego rekordu (tw liczy od 0); koniec = pierwsza tura,
 *   w ktorej pary nie ma w `wars` (relacja przestala byc wojna); czas = koniec - start.
 * - typ: 'wymuszona-epoki' gdy pole `forced` != null w ktorymkolwiek rekordzie wojny (bronze/stone/iron), inaczej 'naturalna'.
 * - czas = tw w ostatnim rekordzie (tury w stanie wojny); poziom zmeczenia = min(1, tw/40 + 0,1 x (lostA+lostB)) z ostatniego rekordu.
 * - powod konca (WNIOSEK z ostatniego rekordu wojny, gra go nie loguje):
 *   'eliminacja' gdy strona w `owners[].elim`; 'pokoj-100% (wymuszony)' gdy poziom >= 1 (tw 40 lub miasta);
 *   'oferta-przegrywajacego' gdy wear.last to tura konca-1 lub pozniej; 'inne/nieznane' w pozostalych (np. pokoj dyplomacyjny).
 * - Poziom zmeczenia w chwili konca = wear.peak z ostatniego rekordu (null gdy brak wear).
 * - Wojny nadal trwajace na koncu pliku: powod 'trwa (koniec danych)'.
 */
const fs = require('fs');

const argv = process.argv.slice(2);
const jIdx = argv.indexOf('--json');
const jsonOut = jIdx >= 0 ? argv[jIdx + 1] : null;
const files = argv.filter((a, i) => !a.startsWith('--') && (jIdx < 0 || (i !== jIdx && i !== jIdx + 1)));

function summarize(file) {
  const recs = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  const open = new Map(); const done = []; let lastTurn = null;
  for (const rec of recs) {
    const present = new Set();
    for (const w of rec.wars) {
      const key = `${w.a}-${w.b}`; present.add(key);
      if (!open.has(key)) open.set(key, { a: w.a, b: w.b, start: rec.turn - w.tw, first: rec.turn, recs: [] });
      open.get(key).recs.push({ turn: rec.turn, w, elim: rec.owners.filter((o) => o.elim).map((o) => o.o) });
    }
    for (const [key, v] of [...open.entries()]) {
      if (!present.has(key)) {
        const last = v.recs[v.recs.length - 1];
        const forced = v.recs.some((x) => x.w.forced);
        const lastWear = [...v.recs].reverse().find((x) => x.w.wear);
        const tw = last.w.tw; const cities = last.w.lostA + last.w.lostB;
        const level = Math.min(1, tw / 40 + 0.1 * cities);
        let reason = 'inne/nieznane (nie zapisane w logu)';
        if (last.elim.length && (last.elim.includes(v.a) || last.elim.includes(v.b))) reason = 'eliminacja';
        else if (level >= 1) reason = 'pokoj-100% (wymuszony)';
        else if (lastWear && lastWear.w.wear.last >= last.turn - 1 && lastWear.w.wear.last >= 0) reason = 'oferta-przegrywajacego (wniosek z wear.last)';
        // duration = tury w stanie wojny (tw w ostatnim rekordzie); koniec = pierwsza tura bez wojny
        done.push({ file: file.split('/').pop(), a: v.a, b: v.b, start: v.start, end: rec.turn, duration: tw,
          type: forced ? 'wymuszona-epoki' : 'naturalna', reason, fatigueAtEnd: level, citiesChanged: cities });
        open.delete(key);
      }
    }
    lastTurn = rec.turn;
  }
  for (const v of open.values()) {
    const last = v.recs[v.recs.length - 1];
    done.push({ file: file.split('/').pop(), a: v.a, b: v.b, start: v.start, end: null, duration: last.w.tw,
      type: v.recs.some((x) => x.w.forced) ? 'wymuszona-epoki' : 'naturalna', reason: 'trwa (koniec danych)',
      fatigueAtEnd: Math.min(1, last.w.tw / 40 + 0.1 * (last.w.lostA + last.w.lostB)), citiesChanged: last.w.lostA + last.w.lostB });
  }
  return { file, lastTurn, wars: done };
}

const all = files.map(summarize);
const rows = all.flatMap((s) => s.wars);
const med = (xs) => { if (!xs.length) return null; const s = [...xs].sort((p, q) => p - q); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const stat = (xs) => ({ n: xs.length, mediana: med(xs), min: xs.length ? Math.min(...xs) : null, maks: xs.length ? Math.max(...xs) : null });
const byType = {};
for (const t of ['naturalna', 'wymuszona-epoki']) byType[t] = stat(rows.filter((r) => r.type === t && r.end !== null).map((r) => r.duration));
const byReason = {};
for (const r of rows) byReason[r.reason] = (byReason[r.reason] || 0) + 1;
const out = { files: all.map((s) => ({ file: s.file, lastTurn: s.lastTurn })), wars: rows, durationByType: byType, endReasonCounts: byReason };

console.log('| plik | para | start | koniec | czas (tury) | typ | powod konca (wniosek) | zmeczenie w chwili konca | miasta zmienione (suma L+P) |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.file} | ${r.a} vs ${r.b} | ${r.start} | ${r.end ?? '-'} | ${r.duration} | ${r.type} | ${r.reason} | ${r.fatigueAtEnd ?? 'n/d'} | ${r.citiesChanged} |`);
console.log('');
console.log('Rozklad czasu trwania (zakonczone wojny):', JSON.stringify(byType));
console.log('Powody konca:', JSON.stringify(byReason));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(out, null, 2));
