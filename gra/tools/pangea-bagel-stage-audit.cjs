'use strict';
/** Audyt: który etap generatora tworzy/odtwarza obwarzanka (moat oceanu) vs pierścień rzek. */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.pangea-bagel-audit-entry.ts');
const BUNDLE = path.join(__dirname, '.pangea-bagel-audit-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
export { setRiverGenEnabledOverride };
export { generujSwiat } from '../src/map/generator';
export {
  startPangeaBagelAudit,
  takePangeaBagelAuditSnaps,
  pangeaLandLayoutParams,
  measurePangeaAnnularCorridorHexes,
  groupLandMassKeys,
} from '../src/map/gen-helpers';
export { TerenBazowy } from '../src/types/hex';
export { menuLabelToDims } from '../src/map/generator';`,
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
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const LAND_PCTS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const SEEDS = [42, 777];

function seaDistMap(hexes, W, H) {
  const dist = new Map();
  const q = [];
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const k = `${c},${r}`;
      const h = hexes[k];
      if (!h) continue;
      if (h.terenBazowy === TB.Morze || h.terenBazowy === TB.Wybrzeze) {
        dist.set(k, 0);
        q.push(k);
      }
    }
  }
  let qi = 0;
  while (qi < q.length) {
    const cur = q[qi++];
    const d = dist.get(cur);
    const [cq, cr] = cur.split(',').map(Number);
    for (const [dq, dr] of DIRS) {
      const nk = `${cq + dq},${cr + dr}`;
      if (!hexes[nk] || dist.has(nk)) continue;
      dist.set(nk, d + 1);
      q.push(nk);
    }
  }
  return dist;
}

function riverBands(map) {
  const hexes = map.hexes;
  const W = map.szerokoscQ;
  const H = map.wysokoscR;
  const dist = seaDistMap(hexes, W, H);
  const bins = { '0-5': 0, '6-10': 0, '11-20': 0, '21+': 0, land: 0, river: 0 };
  for (const [k, h] of Object.entries(hexes)) {
    if (h.terenBazowy === TB.Morze || h.terenBazowy === TB.Wybrzeze) continue;
    bins.land++;
    const d = dist.get(k) ?? 99;
    const hasR = !!(h.rzeka && h.rzeka.obecna);
    if (hasR) {
      bins.river++;
      if (d <= 5) bins['0-5']++;
      else if (d <= 10) bins['6-10']++;
      else if (d <= 20) bins['11-20']++;
      else bins['21+']++;
    }
  }
  return bins;
}

function worstJump(snaps) {
  let best = null;
  for (let i = 1; i < snaps.length; i++) {
    const dAnn = snaps[i].annular - snaps[i - 1].annular;
    const dMass = snaps[i].dryMasses - snaps[i - 1].dryMasses;
    const score = dAnn + dMass * 200;
    if (!best || score > best.score) {
      best = { from: snaps[i - 1].stage, to: snaps[i].stage, dAnn, dMass, score, annular: snaps[i].annular, masses: snaps[i].dryMasses };
    }
  }
  return best;
}

console.log('=== Layout params (standardowy dims) ===');
const dims = M.menuLabelToDims('Standardowy');
for (const lf of LAND_PCTS) {
  const p = M.pangeaLandLayoutParams(lf, dims.w, dims.h);
  console.log(
    `  land=${(lf * 100).toFixed(0)}% nBlobs=${p.nBlobs} ringR=${p.ringRMin.toFixed(3)}-${p.ringRMax.toFixed(3)} `
    + `valley=${p.valley.toFixed(3)} clusterR=${p.clusterRadius.toFixed(3)} fillMin=${p.fillMinScore.toFixed(3)}`,
  );
}

console.log('\n=== Stage audit (rzeki OFF — czysty moat oceanu) ===');
M.setRiverGenEnabledOverride(false);
const summary = [];
for (const lf of LAND_PCTS) {
  for (const seed of SEEDS) {
    M.startPangeaBagelAudit();
    const map = M.generujSwiat(seed, 'standardowy', 'pangea', {
      worldDensity: DENSITY,
      landFraction: lf,
    });
    const snaps = M.takePangeaBagelAuditSnaps();
    const jump = worstJump(snaps);
    const final = snaps[snaps.length - 1] || { annular: -1, dryMasses: -1 };
    summary.push({ lf, seed, finalAnn: final.annular, finalMass: final.dryMasses, jump });
    console.log(`\n-- land=${(lf * 100).toFixed(0)}% seed=${seed} --`);
    for (const s of snaps) {
      console.log(
        `  ${s.stage.padEnd(22)} annular=${String(s.annular).padStart(5)} masses=${s.dryMasses} `
        + `dryLand=${s.dryLand} inlandMorze=${s.inlandMorze}`,
      );
    }
    if (jump) {
      console.log(
        `  WORST_JUMP: ${jump.from} → ${jump.to}  Δannular=${jump.dAnn} Δmasses=${jump.dMass} `
        + `(annular@to=${jump.annular} masses@to=${jump.masses})`,
      );
    }
  }
}

console.log('\n=== Podsumowanie jumpów (rzeki OFF) ===');
for (const row of summary) {
  const j = row.jump;
  console.log(
    `  ${(row.lf * 100).toFixed(0)}% seed=${row.seed}: final annular=${row.finalAnn} masses=${row.finalMass} | `
    + (j ? `worst ${j.from}→${j.to} Δa=${j.dAnn} Δm=${j.dMass}` : 'n/a'),
  );
}

console.log('\n=== River bands (rzeki ON — czy „obwarzanek” to tylko rzeki) ===');
M.setRiverGenEnabledOverride(true);
for (const lf of [0.3, 0.6, 0.8]) {
  const map = M.generujSwiat(42, 'standardowy', 'pangea', {
    worldDensity: DENSITY,
    landFraction: lf,
  });
  const annular = M.measurePangeaAnnularCorridorHexes(map.hexes, map.szerokoscQ, map.wysokoscR);
  const bands = riverBands(map);
  console.log(
    `  land=${(lf * 100).toFixed(0)}% annularSea=${annular} rivers=${bands.river}/${bands.land} `
    + `bins seaDist: 0-5=${bands['0-5']} 6-10=${bands['6-10']} 11-20=${bands['11-20']} 21+=${bands['21+']}`,
  );
}

console.log('\nDONE');
