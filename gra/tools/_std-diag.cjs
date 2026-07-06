'use strict';
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const entry = path.join(__dirname, '.std-diag-entry.ts');
fs.writeFileSync(entry, `
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes } from '../src/map/gen-helpers';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: path.join(__dirname, '.std-diag-bundle.cjs'),
  logLevel: 'silent',
});
const M = require('./.std-diag-bundle.cjs');
const HEX = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
function landMasses(map) {
  const v = new Set();
  const sizes = [];
  for (const k of Object.keys(map.hexes)) {
    if (v.has(k)) continue;
    const h = map.hexes[k];
    if (!h || h.terenBazowy === M.TerenBazowy.Morze) continue;
    const st = [k]; v.add(k); let sz = 0;
    while (st.length) {
      const c = st.pop(); sz++;
      const [q, r] = c.split(',').map(Number);
      for (const [dq, dr] of HEX) {
        const nk = `${q + dq},${r + dr}`;
        if (v.has(nk)) continue;
        const nh = map.hexes[nk];
        if (!nh || nh.terenBazowy === M.TerenBazowy.Morze) continue;
        v.add(nk); st.push(nk);
      }
    }
    sizes.push(sz);
  }
  sizes.sort((a, b) => b - a);
  return sizes;
}
for (const seed of [1, 42, 99, 2026]) {
  const map = M.generujSwiat(seed, 'standardowy', 'kontynenty', {
    landFraction: 0.5,
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium' },
  });
  const c = M.countLandSeaHexes(map.hexes);
  let las = 0, gory = 0;
  for (const h of Object.values(map.hexes)) {
    if (h.nakladka === M.Nakladka.Las) las++;
    if (h.terenBazowy === M.TerenBazowy.Gory) gory++;
  }
  const sizes = landMasses(map);
  console.log(
    `seed ${seed}: ląd ${(100 * c.land / c.total).toFixed(1)}%,`,
    `masy [${sizes.slice(0, 6).join(', ')}],`,
    `rzeki ${map.riverPaths?.length ?? 0}, góry ${gory}, las ${las}`,
  );
}
