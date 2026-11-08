// Dopisuje wektory rodziny (argv[4]) na koniec roadplan.json. Wejscie = realne heksy z wyszukiwania
// (terrain jak w mapie weba), `out` = wynik WEB planRoadNetwork na tym samym wejsciu (z search-gen.mjs).
import { readFileSync, writeFileSync } from 'node:fs';

const [, , rpPath, foundPath, outPath, fam] = process.argv;
const root = JSON.parse(readFileSync(rpPath, 'utf8'));
const found = JSON.parse(readFileSync(foundPath, 'utf8')).found;
const normHex = (h) => (Array.isArray(h) ? `${h[0]},${h[1]}` : h);
let idx = 0;
for (const f of found) {
  const out = {
    hexes: f.orig.hexes.map(normHex),
    edges: f.orig.edges.map((e) => ({ a: e.a, b: e.b, cost: e.cost })),
    disconnected: f.orig.disconnected,
  };
  root.plans.push({
    fam: `${fam}-${idx}`,
    hexes: f.hexes,
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
