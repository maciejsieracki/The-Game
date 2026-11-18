'use strict';
/**
 * ai-city-garrison-measure-analyze.cjs -- R-WEB-AI-CITY-GARRISON-MIN-ONE-LIVE-AUDIT-Q1: analiza JSONL
 * z ai-economy-measure-run.cjs (pole owners[].miastaWojsko / wojskoPozaMiastem; hak tylko odczyt).
 * Uzycie: node tools/ai-city-garrison-measure-analyze.cjs <seedN.jsonl> [--player 0]
 * Liczy: (a) miasta AI bez wojska w turach kontrolnych (10..60), osobno pokoj/wojna (wlasciciel w parze wojny);
 *        (b) zdarzenia: jednostka stacjonujaca w miescie w turze N, w N+1 poza miastem, a miasto w N+1 bez wojska;
 *        (c) miasta oblezone (units.oblegaCityId) i ich wojsko.
 */
const fs = require('fs');
const path = require('path');
const file = process.argv[2];
const pIdx = process.argv.indexOf('--player');
const PLAYER = pIdx >= 0 ? Number(process.argv[pIdx + 1]) : 0;
const recs = fs.readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const CONTROL = [10, 20, 30, 40, 50, 60];
const inWar = (r, o) => (r.wars && r.wars.pairs || []).some(p => p[0] === o || p[1] === o);
const out = { file: path.basename(file), player: PLAYER, control: [], events: [], siege: [] };
for (const r of recs) {
  if (!CONTROL.includes(r.turn)) continue;
  const row = { turn: r.turn, peace: { cities: 0, empty: 0 }, war: { cities: 0, empty: 0 }, playerCities: 0 };
  for (const o of r.owners) {
    if (o.owner === PLAYER) { row.playerCities += o.miasta; continue; }
    const k = inWar(r, o.owner) ? 'war' : 'peace';
    row[k].cities += o.miastaWojsko.length;
    row[k].empty += o.miastaWojsko.filter(c => c.wojsko === 0).length;
  }
  out.control.push(row);
}
for (let i = 0; i + 1 < recs.length; i++) {
  const a = recs[i], b = recs[i + 1];
  if (b.turn !== a.turn + 1) continue;
  for (const o of a.owners) {
    if (o.owner === PLAYER) continue;
    const ob = b.owners.find(x => x.owner === o.owner);
    if (!ob) continue;
    for (const c of o.miastaWojsko) {
      const cb = ob.miastaWojsko.find(x => x.cityId === c.cityId);
      if (!cb) continue;
      const left = c.ids.filter(id => ob.wojskoPozaMiastem.includes(id) && !cb.ids.includes(id));
      if (left.length === 0) continue;
      out.events.push({ turn: b.turn, owner: o.owner, city: c.cityId, war: inWar(b, o.owner), left: left.length,
        stillInCity: cb.wojsko, cityEmptyAfter: cb.wojsko === 0 });
    }
  }
}
for (const r of recs) {
  if (!CONTROL.includes(r.turn)) continue;
  for (const o of r.owners) for (const c of o.miastaWojsko) if (c.oblega > 0)
    out.siege.push({ turn: r.turn, owner: o.owner, city: c.cityId, wojsko: c.wojsko, oblega: c.oblega, war: inWar(r, o.owner) });
}
out.eventsCount = out.events.length;
out.eventsEmptyAfter = out.events.filter(e => e.cityEmptyAfter).length;
console.log(JSON.stringify(out, null, 1));
