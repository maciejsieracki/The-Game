'use strict';
/**
 * live-verify-robocza-farm-analyze.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-Q1, punkt 2 (analiza wyników żywych biegów
 * autoclear-priority-live-test.cjs): dla każdego dodanego ulepszenia: tura, typ, heks, teren/nakładka (z REALNEGO
 * snapshotu mapy z żywej gry), rzeka na/obok heksa, odległość od miasta. Wyznacza kolejność farma vs trzoda (bydło).
 * Usage: node gra/tools/live-verify-robocza-farm-analyze.cjs <wynik1.json> [...]
 */
const fs = require('fs');
const path = require('path');
const dist = (a, b) => { const dq = a.q - b.q, dr = a.r - b.r; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };
const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const out = [];
for (const f of process.argv.slice(2)) {
  const o = JSON.parse(fs.readFileSync(f, 'utf8'));
  const m = o.mapSnapshot;
  const idx = new Map();
  for (let i = 0; i < m.n; i++) idx.set(m.q[i] + ',' + m.r[i], i);
  const riverEdge = new Set(m.rzekaKrawedzie.hexIdx);
  const riverPathHex = new Set();
  for (const p of m.riverPaths) for (const h of p) riverPathHex.add(h.q + ',' + h.r);
  const onRiver = (q, r) => { const i = idx.get(q + ',' + r); return (i !== undefined && (m.rzekaObecna[i] === 1 || riverEdge.has(i))) || riverPathHex.has(q + ',' + r); };
  const nearRiver = (q, r) => onRiver(q, r) || NB.some(([dq, dr]) => onRiver(q + dq, r + dr));
  const terr = (q, r) => { const i = idx.get(q + ',' + r); return i === undefined ? '?' : m.dict[m.terenIdx[i]]; };
  const nak = (q, r) => { const i = idx.get(q + ',' + r); return i === undefined ? '?' : m.dict[m.nakladkaIdx[i]]; };
  const rows = [];
  for (const e of o.log) for (const a of e.added) {
    const [q, r] = a.hex.split(',').map(Number);
    rows.push({ turn: e.turnFrom, key: a.key, hex: a.hex, teren: terr(q, r), nakladka: nak(q, r), naRzece: onRiver(q, r), obokRzeki: nearRiver(q, r), distCity: dist({ q, r }, o.city), poolBefore: Math.round(e.poolBefore) });
  }
  const firstFarm = rows.find((x) => x.key === 'farma');
  const firstHerd = rows.find((x) => x.key === 'bydlo' || x.key === 'trzoda');
  const wyrab = rows.filter((x) => /wyrab|wycink/.test(x.key));
  // kolejność per heks: czy farma wcześniej (lub tej samej tury) niż trzoda NA TYM SAMYM heksie
  const perHex = {};
  for (const x of rows) (perHex[x.hex] = perHex[x.hex] || []).push(x);
  const farmBeforeHerdPerHex = Object.entries(perHex).filter(([, v]) => v.some((x) => x.key === 'bydlo')).map(([h, v]) => ({
    hex: h, teren: v[0].teren, nakladka: v[0].nakladka, farmTurn: (v.find((x) => x.key === 'farma') || {}).turn ?? null, herdTurn: (v.find((x) => x.key === 'bydlo') || {}).turn,
  }));
  const forestInR3 = [];
  for (let dq = -3; dq <= 3; dq++) for (let dr = -3; dr <= 3; dr++) {
    if (Math.abs(dq + dr) > 3) continue;
    const q = o.city.q + dq, r = o.city.r + dr;
    if (nak(q, r) === 'las') forestInR3.push({ hex: q + ',' + r, naRzece: onRiver(q, r), obokRzeki: nearRiver(q, r), d: dist({ q, r }, o.city) });
  }
  out.push({ file: path.basename(f), policy: o.policy[0][1], city: o.city, cityNaRzece: onRiver(o.city.q, o.city.r), cityObokRzeki: nearRiver(o.city.q, o.city.r), errors: o.errors, turns: o.log.length, rows, firstFarm, firstHerd, wyrabCount: wyrab.length, farmBeforeHerdPerHex, forestInR3 });
}
const dst = process.env.FARM_OUT;
if (dst) fs.writeFileSync(dst, JSON.stringify(out, null, 2));
for (const x of out) {
  console.log('== ' + x.file + ' focus=' + x.policy.focus + ' wolno=' + x.policy.wolnoWycinacLas + ' miasto ' + x.city.q + ',' + x.city.r + ' naRzece=' + x.cityNaRzece + ' obokRzeki=' + x.cityObokRzeki + ' bledy=' + x.errors.length);
  for (const r of x.rows) console.log(`  t${r.turn} ${r.key.padEnd(18)} ${r.hex.padEnd(7)} teren=${r.teren} nak=${r.nakladka} rzeka=${r.naRzece ? 'NA' : r.obokRzeki ? 'obok' : '-'} d=${r.distCity} pula=${r.poolBefore}`);
  console.log('  farma-vs-trzoda per heks: ' + JSON.stringify(x.farmBeforeHerdPerHex));
  console.log('  las w R3: ' + JSON.stringify(x.forestInR3));
  console.log('  wyrab zdarzeń: ' + x.wyrabCount);
}
