// Szuka wejsc, dla ktorych wynik web planRoadNetwork rozni sie od wersji z mutantem N90 (`nd >= cap` zamiast `nd > cap`).
const orig = await import('/home/user/scratch_r1/web/gra/src/game/road-network-plan.ts');
const mut = await import('/home/user/scratch_r1/webmut90/gra/src/game/road-network-plan.ts');
const HX = await import('/home/user/scratch_r1/web/gra/src/types/hex.ts');
const TB = HX.TerenBazowy, NK = HX.Nakladka;
let seed = Number(process.argv[3] || 777);
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pickW = (items) => { const tot = items.reduce((s, x) => s + x[1], 0); let x = rnd() * tot; for (const [v, w] of items) { x -= w; if (x <= 0) return v; } return items[0][0]; };
const dist = (a, b) => { const dq = a[0] - b[0], dr = a[1] - b[1]; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; };
const disk = (R) => { const o = []; for (let q = -R; q <= R; q++) for (let r = -R; r <= R; r++) if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= R) o.push([q, r]); return o; };
const want = Number(process.argv[2] || 3);
const found = [];
let tries = 0;
while (found.length < want && tries < 40000) {
  tries++;
  const R = ri(3, 7);
  const cells = disk(R);
  const hexes = {};
  const lakeP = pickW([[0, 5], [0.05, 2], [0.15, 1]]);
  for (const [q, r] of cells) {
    const t = rnd() < lakeP ? TB.Morze : pickW([[TB.Laka, 3], [TB.Rownina, 3], [TB.Wzgorza, 2], [TB.Gory, 2]]);
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: t, nakladka: NK.Brak, ulepszenie: 'brak', rzeka: { obecna: false, krawedzie: [] } };
  }
  const nC = ri(6, 9);
  const cities = [];
  const used = new Set();
  let guard = 0;
  while (cities.length < nC && guard++ < 500) {
    const [q, r] = cells[ri(0, cells.length - 1)];
    if (used.has(`${q},${r}`)) continue;
    if (hexes[`${q},${r}`].terenBazowy === TB.Morze) continue;
    used.add(`${q},${r}`);
    cities.push({ id: 'c' + String.fromCharCode(97 + cities.length), q, r });
  }
  if (cities.length < 2) continue;
  const map = { hexes, riverPaths: [] };
  const a = JSON.stringify(orig.planRoadNetwork(cities, map, {}));
  const b = JSON.stringify(mut.planRoadNetwork(cities, map, {}));
  if (a !== b) {
    const lst = cells.map(([q, r]) => [q, r, hexes[`${q},${r}`].terenBazowy, 'brak', null]);
    found.push({ R, cities, hexes: lst, orig: JSON.parse(a), mut: JSON.parse(b) });
    console.error('found at try', tries, 'R', R, 'cities', cities.length);
  }
}
console.log(JSON.stringify({ tries, found }));
