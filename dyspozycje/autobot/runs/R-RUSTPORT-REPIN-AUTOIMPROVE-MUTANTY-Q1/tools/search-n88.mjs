// Szuka wejsc, dla ktorych wynik web planRoadNetwork rozni sie od wersji z mutantem N88 (krok 2b, remis).
const orig = await import('/home/user/scratch_r1/web/gra/src/game/road-network-plan.ts');
const mut = await import('/home/user/scratch_r1/webmut/gra/src/game/road-network-plan.ts');
const HX = await import('/home/user/scratch_r1/web/gra/src/types/hex.ts');
const TB = HX.TerenBazowy, NK = HX.Nakladka;
let seed = Number(process.argv[3] || 12345);
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const R = 16;
const hexes = {};
for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) {
  if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: TB.Laka, nakladka: NK.Brak, ulepszenie: 'brak', rzeka: { obecna: false, krawedzie: [] } };
  }
}
const map = { hexes, riverPaths: [] };
const dist = (a, b) => { const dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; };
const found = [];
const want = Number(process.argv[2] || 3);
let tries = 0;
while (found.length < want && tries < 20000) {
  tries++;
  const k = ri(3, 4);
  const centers = [];
  let g0 = 0;
  while (centers.length < k && g0++ < 1000) {
    const c = [ri(-12, 12), ri(-12, 12)];
    if (Math.max(Math.abs(c[0]), Math.abs(c[1]), Math.abs(c[0] + c[1])) > 12) continue;
    if (centers.every(o => dist(o, c) >= 9)) centers.push(c);
  }
  if (centers.length < k) continue;
  const cities = [];
  const used = new Set();
  for (const c of centers) {
    const m = ri(6, 7);
    let placed = 0, guard = 0;
    while (placed < m && guard++ < 200) {
      const p = [c[0] + ri(-2, 2), c[1] + ri(-2, 2)];
      if (used.has(`${p[0]},${p[1]}`) || dist(p, c) > 2) continue;
      used.add(`${p[0]},${p[1]}`);
      const id = String.fromCharCode(97 + ri(0, 25)) + String.fromCharCode(97 + ri(0, 25)) + ri(0, 9);
      cities.push({ id, q: p[0], r: p[1] });
      placed++;
    }
  }
  if (new Set(cities.map(c => c.id)).size !== cities.length) continue;
  const a = JSON.stringify(orig.planRoadNetwork(cities, map, {}));
  const b = JSON.stringify(mut.planRoadNetwork(cities, map, {}));
  if (a !== b) {
    found.push({ cities, orig: JSON.parse(a), mut: JSON.parse(b) });
    console.error('found at try', tries, 'cities', cities.length);
  }
}
console.log(JSON.stringify({ tries, found }));
