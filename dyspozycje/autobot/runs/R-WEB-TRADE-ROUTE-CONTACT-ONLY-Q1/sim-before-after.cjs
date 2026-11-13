'use strict';
// Symulacja PRZED/PO (R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1): prawdziwe refreshTradeRoutes + dochod.
// Uzycie (z gra/): node ../dyspozycje/autobot/runs/R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1/sim-before-after.cjs old|new
// 'old' wymaga tymczasowej kopii HEAD:gra/src/game/trade-routes.ts jako src/game/trade-routes.old.ts (usuwana po pomiarze).
const fs = require('fs'), path = require('path');
const GRA = path.resolve(__dirname, '..', '..', '..', '..', 'gra');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const which = process.argv[2] === 'old' ? 'old' : 'new';
const entry = path.join(GRA, 'tools', `.sim-${which}-entry.ts`);
const out = path.join(GRA, 'tools', `.sim-${which}-bundle.cjs`);
const mod = which === 'old' ? '../src/game/trade-routes.old' : '../src/game/trade-routes';
fs.writeFileSync(entry, `export * from '${mod}';`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: out, logLevel: 'silent' });
const TR = require(out);
fs.unlinkSync(entry); fs.unlinkSync(out);

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function buildWorld(seed) {
  const R = rng(seed), W = 100, H = 60, hexes = {};
  const islands = []; for (let i = 0; i < 6; i++) islands.push({ q: 10 + R() * 80, r: 8 + R() * 44, rad: 6 + R() * 6 });
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) {
    const land = islands.some(i => Math.hypot(q - i.q, (r - i.r) * 1.2) < i.rad);
    hexes[`${q},${r}`] = { terenBazowy: land ? 'rownina' : 'morze' };
  }
  const map = { szerokoscQ: W, wysokoscR: H, hexes, seed, riverPaths: [] };
  const cities = [], built = new Map(); let id = 0;
  const civs = 5;
  for (let o = 0; o < civs; o++) for (let k = 0; k < 3; k++) {
    const isl = islands[Math.floor(R() * islands.length)];
    for (let tries = 0; tries < 200; tries++) {
      const q = Math.round(isl.q + (R() - 0.5) * isl.rad * 1.6), r = Math.round(isl.r + (R() - 0.5) * isl.rad * 1.2);
      const h = hexes[`${q},${r}`]; if (!h || h.terenBazowy !== 'rownina') continue;
      if (cities.some(c => c.q === q && c.r === r)) continue;
      const c = { id: `s${seed}-o${o}-${id++}`, ownerId: o, q, r }; cities.push(c);
      const b = []; if (R() < 0.5) b.push('port'); if (R() < 0.5) b.push('targowisko'); built.set(c.id, b); break;
    }
  }
  return { map, cities, built };
}
const rows = [];
const noWar = () => false, allTreaty = () => true, yes = () => true;
for (const seed of [11, 22, 33]) {
  const w = buildWorld(seed);
  const call = (existing) => TR.refreshTradeRoutes(w.cities, existing, w.map, w.built, noWar, allTreaty, undefined, undefined, undefined, yes, yes);
  const t0 = process.hrtime.bigint();
  const routes = call([]);
  const t1 = process.hrtime.bigint();
  let warm = 0n; const N = 20;
  for (let i = 0; i < N; i++) { const a = process.hrtime.bigint(); call(routes); warm += process.hrtime.bigint() - a; }
  const ext = routes.filter(r => r.ownerId !== r.toOwnerId), int = routes.filter(r => r.ownerId === r.toOwnerId);
  const inc = rs => rs.reduce((s, r) => s + TR.tradeRouteIncomeForRoute(r) * 2, 0); // obie strony kredytowane
  rows.push({ seed, cities: w.cities.length, routes: routes.length, external: ext.length, internal: int.length,
    extLand: ext.filter(r => r.medium === 'lad').length, extSea: ext.filter(r => r.medium === 'morze').length,
    incomeAll: inc(routes), incomeExt: inc(ext), coldMs: +(Number(t1 - t0) / 1e6).toFixed(2), warmMs: +(Number(warm) / N / 1e6).toFixed(2) });
}
console.log(which.toUpperCase()); console.table(rows);
