'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.bagel-gap-entry.ts');
const BUNDLE = path.join(__dirname, '.bagel-gap-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
setRiverGenEnabledOverride(false);
export { generujSwiat } from '../src/map/generator';
export { TerenBazowy } from '../src/types/hex';`,
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

function dryMasses(hexes) {
  const visited = new Set();
  const groups = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy === TB.Morze || hex.terenBazowy === TB.Wybrzeze) continue;
    if (visited.has(key)) continue;
    const mass = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop();
      mass.push(k);
      const [q, r] = k.split(',').map(Number);
      for (const [dq, dr] of DIRS) {
        const nk = `${q + dq},${r + dr}`;
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || nh.terenBazowy === TB.Morze || nh.terenBazowy === TB.Wybrzeze) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    groups.push(mass);
  }
  return groups.sort((a, b) => b.length - a.length);
}

function gapBetween(hexes, main, other) {
  const mainSet = new Set(main);
  const otherSet = new Set(other);
  const dist = new Map();
  const parent = new Map();
  const q = [];
  for (const k of main) {
    const [q0, r0] = k.split(',').map(Number);
    for (const [dq, dr] of DIRS) {
      const nk = `${q0 + dq},${r0 + dr}`;
      const nh = hexes[nk];
      if (!nh) continue;
      if (nh.terenBazowy !== TB.Morze && nh.terenBazowy !== TB.Wybrzeze) continue;
      if (dist.has(nk)) continue;
      dist.set(nk, 1);
      parent.set(nk, k);
      q.push(nk);
    }
  }
  let hit = null;
  let qi = 0;
  while (qi < q.length) {
    const cur = q[qi++];
    const d = dist.get(cur);
    if (d > 80) continue;
    const [cq, cr] = cur.split(',').map(Number);
    let found = false;
    for (const [dq, dr] of DIRS) {
      const nk = `${cq + dq},${cr + dr}`;
      const nh = hexes[nk];
      if (!nh) continue;
      if (nh.terenBazowy !== TB.Morze && nh.terenBazowy !== TB.Wybrzeze) {
        if (otherSet.has(nk)) {
          hit = cur;
          found = true;
          break;
        }
        continue;
      }
      if (dist.has(nk)) continue;
      dist.set(nk, d + 1);
      parent.set(nk, cur);
      q.push(nk);
    }
    if (found) break;
  }
  if (!hit) return null;
  let cur = hit;
  let morze = 0;
  let wybrzeze = 0;
  let len = 0;
  while (cur && len < 100) {
    const h = hexes[cur];
    if (!h) break;
    if (h.terenBazowy === TB.Morze) morze++;
    if (h.terenBazowy === TB.Wybrzeze) wybrzeze++;
    if (mainSet.has(cur)) break;
    cur = parent.get(cur);
    len++;
  }
  return { gapLen: dist.get(hit), pathMorze: morze, pathWybrzeze: wybrzeze };
}

const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };
for (const lf of [0.3, 0.5, 0.6, 0.8]) {
  const map = M.generujSwiat(42, 'standardowy', 'pangea', {
    worldDensity: DENSITY,
    landFraction: lf,
  });
  const masses = dryMasses(map.hexes);
  const gap = masses.length >= 2 ? gapBetween(map.hexes, masses[0], masses[1]) : null;
  console.log(
    `land=${Math.round(lf * 100)}% dryMasses=${masses.length}`
    + (masses.length >= 2 ? ` main=${masses[0].length} ring=${masses[1].length}` : '')
    + (gap ? ` gapLen=${gap.gapLen} pathMorze=${gap.pathMorze} pathWybrzeze=${gap.pathWybrzeze}` : ' gap=n/a'),
  );
}
