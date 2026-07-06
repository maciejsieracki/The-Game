'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.pangea-visual-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pangea-visual-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { TerenBazowy } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;

function breakdown(map) {
  const c = { morse: 0, wybrzeze: 0, laka: 0, other: 0, total: 0 };
  for (const h of Object.values(map.hexes)) {
    c.total++;
    if (h.terenBazowy === TB.Morse) c.morse++;
    else if (h.terenBazowy === TB.Wybrzeze) c.wybrzeze++;
    else if (h.terenBazowy === TB.Laka) c.laka++;
    else c.other++;
  }
  return c;
}

const opts = {
  worldDensity: { resources: 'medium', rivers: 'high', desert: 'medium', forest: 'medium', relief: 'high' },
  mapSizeMenuLabel: 'Standardowy',
  landFraction: 0.2,
};

for (const typ of ['pangea', 'kontynenty']) {
  const m = M.generujSwiat(42, 'standardowy', typ, opts);
  const c = breakdown(m);
  const land = c.total - c.morse;
  console.log(`\n${typ} seed 42 (${m.szerokoscQ}x${m.wysokoscR}):`);
  console.log(`  ląd razem: ${(100*land/c.total).toFixed(1)}% (morze ${(100*c.morse/c.total).toFixed(1)}%)`);
  console.log(`  wybrzeże: ${(100*c.wybrzeze/c.total).toFixed(1)}% | łąka: ${(100*c.laka/c.total).toFixed(1)}% | reszta lądu: ${(100*c.other/c.total).toFixed(1)}%`);
  console.log(`  woda wizualna (morze+wybrzeże): ${(100*(c.morse+c.wybrzeze)/c.total).toFixed(1)}%`);
}

// Inland morse (not connected to map edge)?
function inlandMorseCount(map) {
  const hexes = map.hexes;
  const w = map.szerokoscQ, h = map.wysokoscR;
  const dist = new Map();
  const q = [];
  for (let r = 0; r < h; r++) {
    for (let x = 0; x < w; x++) {
      if (x===0||r===0||x===w-1||r===h-1) {
        const k = `${x},${r}`;
        if (hexes[k]?.terenBazowy === TB.Morze) { dist.set(k,0); q.push(k); }
      }
    }
  }
  let qi = 0;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
  while (qi < q.length) {
    const k = q[qi++];
    const [x,r] = k.split(',').map(Number);
    for (const [dq,dr] of dirs) {
      const nk = `${x+dq},${r+dr}`;
      if (dist.has(nk)) continue;
      if (hexes[nk]?.terenBazowy !== TB.Morse) continue;
      dist.set(nk, dist.get(k)+1);
      q.push(nk);
    }
  }
  let inland = 0;
  for (const h of Object.values(hexes)) {
    if (h.terenBazowy === TB.Morse && !dist.has(`${h.coords.q},${h.coords.r}`)) inland++;
  }
  return inland;
}

const p = M.generujSwiat(42, 'standardowy', 'pangea', opts);
console.log(`\nPangea inland morse (odcięte od brzegu mapy): ${inlandMorseCount(p)} hex`);
