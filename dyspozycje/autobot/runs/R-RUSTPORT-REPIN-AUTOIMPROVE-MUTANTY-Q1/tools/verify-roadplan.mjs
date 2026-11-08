// Weryfikacja spojnosci roadplan.json: dla kazdego planu uruchamia WEB planRoadNetwork na wejsciu z wektora
// i porownuje z polem `out`. Raport: liczba zgodnych / niezgodnych planow (indeksy niezgodnych).
import { readFileSync } from 'node:fs';
const base = process.env.WEB_DIR;
const vecPath = process.argv[2];
const orig = await import(`${base}/gra/src/game/road-network-plan.ts`);
const root = JSON.parse(readFileSync(vecPath, 'utf8'));
let ok = 0;
const bad = [];
root.plans.forEach((p, i) => {
  const hexes = {};
  for (const a of p.hexes) {
    hexes[`${a[0]},${a[1]}`] = { terenBazowy: a[2], ulepszenie: a[3] || 'brak', ulepszenia: a[4] || [] };
  }
  const map = { hexes, riverPaths: [] };
  const opts = {};
  if (p.trav) { const t = new Set(p.trav); opts.isTraversable = (q, r) => t.has(`${q},${r}`); }
  if (p.extra && p.extra.length) opts.extraRoadKeys = new Set(p.extra);
  const got = orig.planRoadNetwork(p.cities, map, opts);
  const gotN = { hexes: got.hexes.map(h => (Array.isArray(h) ? `${h[0]},${h[1]}` : h)), edges: got.edges.map(e => ({ a: e.a, b: e.b, cost: e.cost })), disconnected: got.disconnected };
  const want = p.out;
  const wantN = { hexes: want.hexes.map(h => (Array.isArray(h) ? `${h[0]},${h[1]}` : h)), edges: want.edges, disconnected: want.disconnected };
  const same = JSON.stringify(gotN) === JSON.stringify(wantN);
  if (same) ok++; else bad.push(i);
});
console.log(JSON.stringify({ plans: root.plans.length, ok, badCount: bad.length, bad: bad.slice(0, 50) }));
