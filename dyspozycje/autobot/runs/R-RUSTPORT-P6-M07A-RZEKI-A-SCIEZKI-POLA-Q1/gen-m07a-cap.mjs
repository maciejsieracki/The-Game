// Sidecar (poza repo): wyniki WEBA estimateLandCentroidFromSeed dla capow 1..40 i 6000.
import { writeFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const vec = JSON.parse(readFileSync(process.argv[3], 'utf8'));
const out = process.argv[4];
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const LAND = new Set(['laka', 'rownina', 'wzgorza', 'gory', 'pustynia', 'polarny']);
const cstr = (c) => (c == null ? null : [String(c.q), String(c.r)]);
const res = [];
const CAPS = [...Array.from({ length: 40 }, (_, i) => i + 1), 6000];
vec.maps.forEach((m, mi) => {
  const hexes = {};
  for (const [k, terr, nak, z, ro, ed] of m.rows) {
    const [q, r] = k.split(',').map(Number);
    hexes[k] = { coords: { q, r }, terenBazowy: terr, nakladka: nak, rzeka: { obecna: ro === 1, krawedzie: [...ed] }, ...(z ? { zloze: 'rudy' } : {}) };
  }
  const mouths = m.rows.filter((row) => LAND.has(row[1])).slice(0, 3);
  for (const row of mouths) {
    const [k] = row;
    const [mq, mr] = k.split(',').map(Number);
    for (const allowRelief of [false, true]) {
      for (const cap of CAPS) {
        const ret = cstr(G.estimateLandCentroidFromSeed(hexes, mq, mr, allowRelief, cap));
        res.push({ map: mi, mq, mr, allowRelief, cap, ret });
      }
    }
  }
});
writeFileSync(out, JSON.stringify(res));
console.log('cases', res.length);
