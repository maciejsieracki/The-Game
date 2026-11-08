// Dopisuje wektory rodziny rp-tie-n88 (wynik WEB planRoadNetwork, pin 180c08305) na koniec roadplan.json.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , rpPath, foundPath, outPath] = process.argv;
const root = JSON.parse(readFileSync(rpPath, 'utf8'));
const found = JSON.parse(readFileSync(foundPath, 'utf8')).found;
const R = 16;
const cells = [];
for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) {
  if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R) cells.push([q, r]);
}
const hexArr = cells.map(([q, r]) => [q, r, 'laka', 'brak', null]);
const normHex = (h) => (Array.isArray(h) ? `${h[0]},${h[1]}` : h);
let idx = 0;
for (const f of found) {
  const out = {
    hexes: f.orig.hexes.map(normHex),
    edges: f.orig.edges.map((e) => ({ a: e.a, b: e.b, cost: e.cost })),
    disconnected: f.orig.disconnected,
  };
  root.plans.push({
    fam: `rp-tie-n88-${idx}`,
    hexes: hexArr,
    cities: f.cities,
    trav: null,
    extra: [],
    out,
  });
  idx++;
}
writeFileSync(outPath, JSON.stringify(root) + '\n');
console.log(`plans total=${root.plans.length} added=${found.length}`);
for (const f of found) {
  console.log(`cities=${f.cities.length} orig.edges=${JSON.stringify(f.orig.edges.map((e) => [e.a, e.b, e.cost]))} disc=${f.orig.disconnected} | mut.edges=${JSON.stringify(f.mut.edges.map((e) => [e.a, e.b, e.cost]))} mut.disc=${f.mut.disconnected}`);
}
