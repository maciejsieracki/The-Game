'use strict';
/**
 * plrrevolt-r3-table.cjs -- R-WEB-PLAYER-LASTCITY-REVOLT-Q1 r3: tabela z biegow plrrevolt-run.cjs (pole rec.plr z haka __cityOwnerChangeLogDebug).
 * Uzycie: node tools/plrrevolt-r3-table.cjs <katalog dane-r3>
 * Dla kazdego podkatalogu <label>/seed<S>.jsonl: ostatnia tura, liczba miast gracza, min/srednia Porzadek (porPct) miast gracza,
 * pierwsza tura porPct<12 (REVOLT_CRITICAL_POR_PCT), pierwsza tura revoltWarning, zmiany wlasciciela miast GRACZA (z przyczyna) i
 * wszystkie zmiany na -99 (rebelianci). Tylko odczyt plikow.
 */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const dir = path.resolve(process.argv[2] || '.');
const CRIT = 12;
const rows = [];
for (const label of fs.readdirSync(dir).sort()) {
  const sub = path.join(dir, label);
  if (!fs.statSync(sub).isDirectory()) continue;
  const f = fs.readdirSync(sub).find(x => /^seed\d+\.jsonl(\.gz)?$/.test(x));
  if (!f) continue;
  const raw = fs.readFileSync(path.join(sub, f));
  const recs = (f.endsWith('.gz') ? zlib.gunzipSync(raw) : raw).toString('utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  let min = null, sum = 0, n = 0, firstCrit = null, firstWarn = null, maxCities = 0;
  const humanChanges = [];
  let rebel99 = 0;
  for (const r of recs) {
    const p = r.plr || {};
    const hc = p.humanCities || [];
    maxCities = Math.max(maxCities, hc.length);
    for (const c of hc) {
      if (typeof c.porPct === 'number') {
        min = min === null ? c.porPct : Math.min(min, c.porPct);
        sum += c.porPct; n++;
        if (c.porPct < CRIT && firstCrit === null) firstCrit = r.turn;
      }
      if (c.revoltWarning && firstWarn === null) firstWarn = r.turn;
    }
    for (const ch of p.ownerChanges || []) {
      if (ch.newOwner === -99) rebel99++;
      if (ch.oldOwner === 0) {
        const caller = (ch.stack || []).map(s => s.replace(/^at\s+/, '').split(' ')[0]).slice(0, 4).join('<');
        humanChanges.push(`t${ch.turn} ${ch.name} 0->${ch.newOwner} ${ch.path} [por=${ch.porPct} ${ch.bandLabel}; osiedle=${ch.osiedle}; pop=${ch.population}; stos=${caller}]`);
      }
    }
  }
  const last = recs[recs.length - 1];
  const sj = path.join(sub, f.replace(/\.jsonl(\.gz)?$/, '.summary.json'));
  let stop = null;
  try { stop = JSON.parse(fs.readFileSync(sj, 'utf8')).stop; } catch (_) { /* brak summary (segment w toku) */ }
  rows.push({ label, lastTurn: last ? last.turn : null, maxCities, porMin: min, porAvg: n ? Math.round(sum / n * 10) / 10 : null, firstCrit, firstWarn, rebel99, stop: stop ? stop.reason + '@t' + stop.tura : null, humanChanges });
}
console.log('label | ostatnia_tura | max_miast | Porzadek min | Porzadek sr | 1.tura <12% | 1.tura ostrzezenie | zmian na -99 | stop');
for (const r of rows) {
  console.log([r.label, r.lastTurn, r.maxCities, r.porMin, r.porAvg, r.firstCrit, r.firstWarn, r.rebel99, r.stop].join(' | '));
  for (const h of r.humanChanges) console.log('    ' + h);
}
