'use strict';
// Czy ostatnia jednostka wojskowa miasta AI (wojsko 1->0) ODESZLA do armii (zyje, poza miastem) czy zginela/zniknela.
const fs = require('fs');
const recs = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').map(l => JSON.parse(l));
const inWar = (r, o) => (r.wars && r.wars.pairs || []).some(p => p[0] === o || p[1] === o);
const res = { lastUnitLeftCity_alive_outside: 0, lastUnitLeftCity_war: 0, lastUnitLeftCity_peace: 0,
  lastUnitGone_dead_or_other: 0, cityOwnerMultiCities: 0, samples: [] };
for (let i = 0; i + 1 < recs.length; i++) {
  const a = recs[i], b = recs[i + 1];
  if (b.turn !== a.turn + 1) continue;
  for (const o of a.owners) {
    const ob = b.owners.find(x => x.owner === o.owner);
    if (!ob) continue;
    for (const c of o.miastaWojsko) {
      const cb = ob.miastaWojsko.find(x => x.cityId === c.cityId);
      if (!cb || c.wojsko === 0 || cb.wojsko !== 0) continue;
      if (o.miasta >= 2) res.cityOwnerMultiCities++;
      const alive = c.ids.filter(id => ob.wojskoPozaMiastem.includes(id));
      if (alive.length === c.ids.length) {
        res.lastUnitLeftCity_alive_outside++;
        if (inWar(b, o.owner)) res.lastUnitLeftCity_war++; else res.lastUnitLeftCity_peace++;
        if (res.samples.length < 8) res.samples.push({ turn: b.turn, owner: o.owner, city: c.cityId, war: inWar(b, o.owner), units: c.ids.length });
      } else res.lastUnitGone_dead_or_other++;
    }
  }
}
console.log(JSON.stringify(res, null, 1));
