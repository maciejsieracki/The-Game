'use strict';
// R-WEB-RENDER-UNIT-BLUR-HORSES-Q1 — straznik: domyslny (medium) preset nie moze ograniczac
// pixelRatio ponizej 2.0 (rozmywanie jednostek na ekranach HiDPI), a LOD zoom ma tylko OBNIZAC.
// Uzycie: node tools/render-unit-sharpness-guard.cjs <outDir>   (bundle poza repo)
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const GRA = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || '.');
fs.mkdirSync(out, { recursive: true });
const G = GRA.replace(/\\/g, '/');
const entry = path.join(out, 'guard-entry.ts');
fs.writeFileSync(entry, `
import { resolveRenderPreset } from '${G}/src/render/mapRenderStyle';
import { zoomLodFlags, effectivePixelRatio } from '${G}/src/render/zoomLod';
const o = (q: any) => ({ style: 'civ', renderQuality: q, mapDetailQuality: 'high' } as any);
(globalThis as any).window = { devicePixelRatio: 2 };
const fails: string[] = [];
const med = resolveRenderPreset(o('medium'), 1000);
const hi = resolveRenderPreset(o('high'), 1000);
const lo = resolveRenderPreset(o('low'), 1000);
if (med.pixelRatioMax < 2) fails.push('medium.pixelRatioMax < 2: ' + med.pixelRatioMax);
if (hi.pixelRatioMax < med.pixelRatioMax) fails.push('high < medium');
if (lo.pixelRatioMax > med.pixelRatioMax) fails.push('low > medium');
if (effectivePixelRatio(med.pixelRatioMax, zoomFlags0()) < 2) fails.push('LOD0 na DPR2 < 2');
// Obrona r1: macierz zachowania (nie tylko stala) — na LOD0 bufor nie moze byc mniejszy niz piksele urzadzenia
// dla DPR 1, 1.5 i 2 (medium). Mutacja pixelRatioMax 2.0 -> 1.5 czerwieni wiersz DPR=2.
for (const dpr of [1, 1.5, 2]) {
  (globalThis as any).window = { devicePixelRatio: dpr };
  const eff = effectivePixelRatio(med.pixelRatioMax, zoomLodFlags(0, false).pixelRatioMul);
  if (eff < dpr) fails.push('LOD0 DPR' + dpr + ': eff ' + eff + ' < DPR (bufor rozciagany)');
}
(globalThis as any).window = { devicePixelRatio: 2 };
function zoomFlags0() { return zoomLodFlags(0, false).pixelRatioMul; }
let prev = 9; for (const l of [0,1,2,3,4] as const) { const m = zoomLodFlags(l, false).pixelRatioMul; if (m > prev) fails.push('LOD mnoznik rosnie na ' + l); prev = m; }
console.log(fails.length ? 'FAIL ' + fails.join('; ') : 'PASS guard');
process.exit(fails.length ? 1 : 0);
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: path.join(out, 'guard-bundle.cjs'), absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')], loader: { '.ts': 'ts' }, logLevel: 'error' });
require(path.join(out, 'guard-bundle.cjs'));
