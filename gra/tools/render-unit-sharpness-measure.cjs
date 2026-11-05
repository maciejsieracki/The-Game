'use strict';
/**
 * R-WEB-RENDER-UNIT-BLUR-HORSES-Q1 — pomiar ostrosci jednostki konnej (rydwan) w realnym WebGL.
 * Uzycie: node tools/render-unit-sharpness-measure.cjs <outDir> [--shots <dir>]
 * Bundle esbuild i zrzuty ida POZA repo (outDir). Metryka: wariancja Laplace'a luminancji
 * w srodkowym wycinku zrzutu (piksele URZADZENIA, czyli to, co widzi gracz po skalowaniu canvasu).
 * Tryb --assert (obrona r1): kryterium binarne, bez zrzutow calej siatki. Miara = ostrosc / ostrosc REFERENCJI NATYWNEJ
 *   (ten sam DPR, pr=DPR, bez AA, ta sama scena i odleglosc). Prog: LOD0 >= 0.90 dla DPR 1 i 2 (PRZED poprawka DPR2: ~0.28).
 *   LOD>=1 na DPR2 jest raportowany, NIE asertowany (drabina LOD jest swiadomym kompromisem wydajnosci, poza zakresem tematu).
 *   Dodatkowo: wariant alternatywny (pr 1.5 + AA) oraz ruch (przesuniecie modelu o ulamek piksela) — raportowane.
 * Konfiguracje pixelRatio/AA pochodza z render/mapRenderStyle.ts + render/zoomLod.ts (importowane, nie kopiowane).
 */
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const { PNG } = require('pngjs');
const { chromium } = require('playwright');

const GRA = path.resolve(__dirname, '..');
const outDir = path.resolve(process.argv[2] || '.');
const shotsDir = process.argv.includes('--shots') ? path.resolve(process.argv[process.argv.indexOf('--shots') + 1]) : null;
fs.mkdirSync(outDir, { recursive: true });
if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });

const G = GRA.replace(/\\/g, '/');
const entry = `
import * as THREE from 'three';
import { buildUnitModel } from '${G}/src/render/units';
import { resolveRenderPreset } from '${G}/src/render/mapRenderStyle';
import { zoomLodFlags } from '${G}/src/render/zoomLod';
window.__h = {
  presetFor(q) { return resolveRenderPreset({ style: 'civ', renderQuality: q, mapDetailQuality: 'high' }, 1000); },
  lodMul(l) { return zoomLodFlags(l, false).pixelRatioMul; },
  render(cfg) {
    document.body.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;display:block';
    document.body.appendChild(canvas);
    const r = new THREE.WebGLRenderer({ canvas, antialias: cfg.aa, powerPreference: 'high-performance' });
    r.setPixelRatio(cfg.pr);
    r.setSize(canvas.clientWidth, canvas.clientHeight, false);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x87ceeb);
    scene.add(new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.9));
    const sun = new THREE.DirectionalLight(0xfff0cc, 1.4); sun.position.set(60, 100, 40); scene.add(sun);
    const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35); fill.position.set(-50, 60, -30); scene.add(fill);
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x5aa83c, roughness: 1 }));
    ground.scale.set(8, 1, 8); ground.position.y = -0.1; scene.add(ground);
    const m = buildUnitModel('rydwan', 0x2a5cff, cfg.name || 'Rydwan konny');
    scene.add(m);
    const cam = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.5, 2000);
    const pitch = cfg.pitchDeg * Math.PI / 180;
    cam.position.set(0, 0.4 + Math.sin(pitch) * cfg.dist, Math.cos(pitch) * cfg.dist);
    cam.lookAt(0, 0.4, 0);
    if (cfg.offX) m.position.x = cfg.offX;
    const t0 = performance.now(); let n = 0;
    for (let i = 0; i < (cfg.frames || 1); i++) { r.render(scene, cam); n++; }
    r.getContext().finish();
    const ms = (performance.now() - t0) / n;
    return { calls: r.info.render.calls, tris: r.info.render.triangles, ms, bufW: canvas.width, bufH: canvas.height };
  },
};
`;
const entryFile = path.join(outDir, 'entry.ts');
fs.writeFileSync(entryFile, entry);
esbuild.buildSync({
  entryPoints: [entryFile], bundle: true, format: 'iife', platform: 'browser', target: 'es2020',
  outfile: path.join(outDir, 'bundle.js'), absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')],
  loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'error',
});
const bundle = fs.readFileSync(path.join(outDir, 'bundle.js'), 'utf8');

function lapVar(png, x0, y0, w, h) {
  const lum = (x, y) => { const i = (png.width * y + x) * 4; return 0.299 * png.data[i] + 0.587 * png.data[i + 1] + 0.114 * png.data[i + 2]; };
  let s = 0, s2 = 0, n = 0;
  for (let y = y0 + 1; y < y0 + h - 1; y++) for (let x = x0 + 1; x < x0 + w - 1; x++) {
    const l = 4 * lum(x, y) - lum(x - 1, y) - lum(x + 1, y) - lum(x, y - 1) - lum(x, y + 1);
    s += l; s2 += l * l; n++;
  }
  const mean = s / n; return s2 / n - mean * mean;
}

async function assertMode() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--ignore-gpu-blocklist'] });
  const rows = []; const fails = []; const THRESH = 0.9;
  try {
    for (const dpr of [1, 2]) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: dpr });
      const page = await ctx.newPage();
      await page.setContent('<body style="margin:0;background:#000"></body>');
      await page.addScriptTag({ content: bundle });
      const shoot = async (cfg) => {
        await page.evaluate((c) => window.__h.render(c), { dist: 4, pitchDeg: 55, frames: 1, ...cfg });
        const png = PNG.sync.read(await page.screenshot({ type: 'png' }));
        const cw = Math.round(png.width * 0.36), ch = Math.round(png.height * 0.4);
        return lapVar(png, Math.round((png.width - cw) / 2), Math.round((png.height - ch) / 2), cw, ch);
      };
      const native = await shoot({ aa: false, pr: dpr });
      rows.push({ dpr, case: 'native(pr=DPR,noAA)', sharp: +native.toFixed(1), ratio: 1 });
      for (const lod of [0, 1, 2, 3]) {
        const info = await page.evaluate(({ lod, dpr }) => { const p = window.__h.presetFor('medium'); const mul = window.__h.lodMul(lod); return { aa: p.antialias, pr: Math.min(dpr, Math.max(0.75, p.pixelRatioMax * mul)) }; }, { lod, dpr });
        const sh = await shoot({ aa: info.aa, pr: info.pr });
        const ratio = sh / native;
        rows.push({ dpr, case: 'medium LOD' + lod, effPR: +info.pr.toFixed(3), sharp: +sh.toFixed(1), ratio: +ratio.toFixed(3), asserted: lod === 0 });
        if (lod === 0 && ratio < THRESH) fails.push('DPR' + dpr + ' medium LOD0 ratio ' + ratio.toFixed(3) + ' < ' + THRESH);
      }
      if (dpr === 2) {
        const alt = await shoot({ aa: true, pr: 1.5 });
        rows.push({ dpr, case: 'ALT pr1.5+AA LOD0', effPR: 1.5, sharp: +alt.toFixed(1), ratio: +(alt / native).toFixed(3) });
        for (const offX of [0.13, 0.37, 0.71]) {
          const mv = await shoot({ aa: false, pr: 2, offX });
          rows.push({ dpr, case: 'ruch medium LOD0 offX=' + offX, effPR: 2, sharp: +mv.toFixed(1), ratio: +(mv / native).toFixed(3) });
        }
      }
      await ctx.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(outDir, 'results-assert.json'), JSON.stringify({ threshold: THRESH, rows, fails }, null, 1));
  console.log(JSON.stringify(rows, null, 1));
  console.log(fails.length ? 'FAIL ' + fails.join('; ') : 'PASS sharpness-ratio LOD0 >= ' + THRESH);
  process.exit(fails.length ? 1 : 0);
}
if (process.argv.includes('--assert')) { assertMode().catch((e) => { console.error(e); process.exit(1); }); return; }

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--ignore-gpu-blocklist'] });
  const results = [];
  try {
    const W = 1280, H = 800;
    const scenarios = [];
    for (const dpr of [1, 2]) for (const q of ['low', 'medium', 'high']) for (const lod of [0, 1, 2, 3]) scenarios.push({ dpr, q, lod });
    const dists = [4, 9];
    for (const dpr of [1, 2]) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: dpr });
      const page = await ctx.newPage();
      await page.setContent('<body style="margin:0;background:#000"></body>');
      await page.addScriptTag({ content: bundle });
      for (const sc of scenarios.filter((s) => s.dpr === dpr)) {
        const info = await page.evaluate(({ q, lod, dpr }) => {
          const p = window.__h.presetFor(q); const mul = window.__h.lodMul(lod);
          return { aa: p.antialias, max: p.pixelRatioMax, mul, pr: Math.min(dpr, Math.max(0.75, p.pixelRatioMax * mul)) };
        }, { q: sc.q, lod: sc.lod, dpr });
        for (const dist of dists) {
          const perf = await page.evaluate((c) => window.__h.render(c), { aa: info.aa, pr: info.pr, dist, pitchDeg: 55, frames: 20 });
          const buf = await page.screenshot({ type: 'png' });
          const png = PNG.sync.read(buf);
          const cw = Math.round(png.width * 0.36), ch = Math.round(png.height * 0.4);
          const x0 = Math.round((png.width - cw) / 2), y0 = Math.round((png.height - ch) / 2);
          const sharp = lapVar(png, x0, y0, cw, ch);
          results.push({ dpr, quality: sc.q, lod: sc.lod, dist, aa: info.aa, effPixelRatio: +info.pr.toFixed(3), sharp: +sharp.toFixed(1), msPerFrame: +perf.ms.toFixed(2), drawCalls: perf.calls, bufW: perf.bufW });
          if (shotsDir && dist === 4) {
            const crop = new PNG({ width: cw, height: ch });
            PNG.bitblt(png, crop, x0, y0, cw, ch, 0, 0);
            fs.writeFileSync(path.join(shotsDir, `d${dpr}-${sc.q}-L${sc.lod}-dist${dist}.png`), PNG.sync.write(crop));
          }
        }
      }
      await ctx.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results));
})().catch((e) => { console.error(e); process.exit(1); });
