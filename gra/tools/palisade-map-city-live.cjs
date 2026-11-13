'use strict';
/**
 * palisade-map-city-live.cjs -- dowod WIZUALNY modelu miasta na MAPIE swiata z obwarowaniem
 * (R-WEB-PALISADE-BATTLE-WALL-RULES-Q1, runda 2 obrona, zarzut 1).
 * Renderuje TE SAME funkcje, ktorych uzywa render/cities.ts (buildMiastoKamien / buildMiastoBraz)
 * w prawdziwym Chromium (WebGL swiftshader): bez obwarowania / palisada / mur, era 1 i 2.
 * Usage: node tools/palisade-map-city-live.cjs <outDir> <tmpDir>
 * Wynik: <outDir>/mapa-miasto-era{1,2}-{brak,palisada,mur}.png (<= 1 MB), JSON na stdout.
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

(async () => {
  const [outDir, tmpDir] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(tmpDir, { recursive: true });
  const entry = path.join(tmpDir, 'entry.ts');
  const src = path.resolve(__dirname, '..', 'src', 'render');
  fs.writeFileSync(entry, `
import * as THREE from 'three';
import { buildMiastoKamien } from ${JSON.stringify(path.join(src, 'miasto-kamien.ts'))};
import { buildMiastoBraz } from ${JSON.stringify(path.join(src, 'miasto-braz.ts'))};
(window as any).renderCity = (era: number, wall: string, level: number) => {
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  r.setSize(900, 600, false);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x8fb870);
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(6, 10, 5); scene.add(sun);
  const col = 0x3a6bd6;
  const g = era >= 2
    ? buildMiastoBraz('grecja', level, { mur: wall === 'mur', palisada: wall === 'palisada', color: col })
    : buildMiastoKamien(level, { mur: wall !== 'brak', color: col });
  scene.add(g);
  const box = new THREE.Box3().setFromObject(g); const c = box.getCenter(new THREE.Vector3());
  const rad = box.getSize(new THREE.Vector3()).length();
  const cam = new THREE.PerspectiveCamera(35, 900 / 600, 0.1, 1000);
  cam.position.set(c.x + rad * 0.55, c.y + rad * 0.55, c.z + rad * 0.75); cam.lookAt(c);
  r.render(scene, cam);
  return { size: box.getSize(new THREE.Vector3()).toArray() };
};`);
  const js = path.join(tmpDir, 'bundle.js');
  esbuild.buildSync({ entryPoints: [entry], bundle: true, outfile: js, format: 'iife', platform: 'browser',
    loader: { '.json': 'json' }, logLevel: 'error', absWorkingDir: path.resolve(__dirname, '..'),
    nodePaths: [path.resolve(__dirname, '..', 'node_modules')] });
  fs.writeFileSync(path.join(tmpDir, 'index.html'),
    '<!doctype html><body style="margin:0"><canvas id="c" width="900" height="600"></canvas><script src="bundle.js"></script></body>');
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  }).catch(() => chromium.launch({ headless: true, args: ['--no-sandbox'] }));
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('file://' + path.join(tmpDir, 'index.html'));
  const out = [];
  for (const era of [1, 2]) for (const wall of ['brak', 'palisada', 'mur']) {
    const info = await page.evaluate(([e, w]) => window.renderCity(e, w, 5), [era, wall]);
    await page.waitForTimeout(300);
    const f = path.join(outDir, `mapa-miasto-era${era}-${wall}.png`);
    await page.screenshot({ path: f });
    out.push({ f: path.basename(f), bytes: fs.statSync(f).size, size: info.size });
  }
  console.log(JSON.stringify({ out, errors }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
