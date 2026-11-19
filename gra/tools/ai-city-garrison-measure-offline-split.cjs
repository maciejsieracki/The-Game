'use strict';
const fs = require('fs');
const recs = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(l => JSON.parse(l));
const CONTROL = [10, 20, 30, 40, 50, 60];
const inWar = (r, o) => (r.wars && r.wars.pairs || []).some(p => p[0] === o || p[1] === o);
const out = { control: [], garrisonLoss: { total: 0, war: 0, peace: 0, byMulti: 0, bySingle: 0 }, emptyNeverGarrisoned: {}, cityOwnerSwitch: 0, vanishedOwners: [] };
// (A) podzial: wlasciciele z >=2 miastami (proxy glownych cywilizacji) vs 1 miasto
for (const r of recs) {
  if (!CONTROL.includes(r.turn)) continue;
  const row = { turn: r.turn, multi: { cities: 0, empty: 0, owners: 0 }, single: { cities: 0, empty: 0, owners: 0 } };
  for (const o of r.owners) {
    const k = o.miasta >= 2 ? 'multi' : 'single';
    row[k].owners++;
    for (const c of o.miastaWojsko) { row[k].cities++; if (c.wojsko === 0) row[k].empty++; }
  }
  out.control.push(row);
}
// (B) utrata garnizonu: miasto mialo >=1 jednostke w N, w N+1 ma 0 i nadal nalezy do tego samego wlasciciela
const everGarrisoned = new Set();
for (let i = 0; i < recs.length; i++) {
  const r = recs[i];
  for (const o of r.owners) for (const c of o.miastaWojsko) if (c.wojsko > 0) everGarrisoned.add(o.owner + '|' + c.cityId);
  if (i + 1 >= recs.length || recs[i + 1].turn !== r.turn + 1) continue;
  const b = recs[i + 1];
  for (const o of r.owners) {
    const ob = b.owners.find(x => x.owner === o.owner);
    if (!ob) continue;
    for (const c of o.miastaWojsko) {
      const cb = ob.miastaWojsko.find(x => x.cityId === c.cityId);
      if (!cb) { out.cityOwnerSwitch++; continue; }
      if (c.wojsko > 0 && cb.wojsko === 0) {
        out.garrisonLoss.total++;
        if (inWar(b, o.owner)) out.garrisonLoss.war++; else out.garrisonLoss.peace++;
        if (o.miasta >= 2) out.garrisonLoss.byMulti++; else out.garrisonLoss.bySingle++;
      }
    }
  }
}
// (C) puste miasta w ostatniej turze: ile kiedykolwiek mialo garnizon vs nigdy
const last = recs[recs.length - 1];
let emptyLast = 0, emptyEver = 0, emptyNever = 0;
for (const o of last.owners) for (const c of o.miastaWojsko) if (c.wojsko === 0) {
  emptyLast++; if (everGarrisoned.has(o.owner + '|' + c.cityId)) emptyEver++; else emptyNever++;
}
out.emptyNeverGarrisoned = { turn: last.turn, emptyLast, emptyThatHadGarrisonSomeTurn: emptyEver, emptyNeverGarrisoned: emptyNever };
// (D) wlasciciele znikajacy miedzy t20 a t30: czy ich miasta przeszly do innego wlasciciela
const t20 = recs.find(r => r.turn === 20), t30 = recs.find(r => r.turn === 30);
const ids30 = new Map();
for (const o of t30.owners) for (const c of o.miastaWojsko) ids30.set(c.cityId, o.owner);
for (const o of t20.owners) if (!t30.owners.some(x => x.owner === o.owner)) {
  out.vanishedOwners.push({ owner: o.owner, cities: o.miastaWojsko.map(c => c.cityId), reappearAt30As: o.miastaWojsko.map(c => ids30.get(c.cityId) ?? null) });
}
out.vanishedCount = out.vanishedOwners.length;
console.log(JSON.stringify(out, null, 1));
