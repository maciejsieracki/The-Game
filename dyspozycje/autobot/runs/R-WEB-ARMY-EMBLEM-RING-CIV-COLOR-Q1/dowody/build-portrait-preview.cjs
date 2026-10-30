// Podgląd tabliczek z WŁĄCZONYMI portretami władców (ścieżka pierścienia na portrecie).
// Użycie: node build-portrait.cjs <gra-root> <out.html>
const path = require('path');
const fs = require('fs');

const [GRA, OUT] = process.argv.slice(2);
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const SCRATCH = path.dirname(OUT);
const ENTRY = path.join(SCRATCH, 'entry-portrait.ts');
const r = (p) => path.join(GRA, 'src', p);

const src = `
import * as THREE from 'three';
import { applyUnitStatPlate } from ${JSON.stringify(r('render/unitStatPlate.ts'))};
import { setUnitOwnerEmblemAssets, ownerEmblemTexture } from ${JSON.stringify(r('render/unitOwnerEmblem.ts'))};

const PORTRAIT = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#8a6a4a"/><circle cx="64" cy="56" r="26" fill="#e0c8a0"/><rect x="34" y="88" width="60" height="30" fill="#5a3a24"/></svg>');
const SIGIL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><path d="M20 4 L34 20 L20 36 L6 20 Z" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>';
const SKULL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="18" r="11" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>';
setUnitOwnerEmblemAssets({
  leaderPortraitUrl: () => PORTRAIT,
  civSigilSvg: () => SIGIL,
  barbarianSigilSvg: () => SKULL,
});

const owners = [
  { label: 'Grecy', civId: 'grecy', era: 1, isCityState: false, isBarbarian: false, ringHex: '#1e5aa8', ownerColor: 0x1e5aa8 },
  { label: 'Persowie', civId: 'persowie', era: 1, isCityState: false, isBarbarian: false, ringHex: '#c41e3a', ownerColor: 0xc41e3a },
  { label: 'Celtowie', civId: 'celtowie', era: 1, isCityState: false, isBarbarian: false, ringHex: '#d4a017', ownerColor: 0xd4a017 },
  { label: 'Miasto-panstwo', civId: 'grecy', era: 1, isCityState: true, isBarbarian: false, ringHex: null, ownerColor: 0xb9c8d8 },
  { label: 'Barbarzyncy', civId: null, era: 1, isCityState: false, isBarbarian: true, ringHex: null, ownerColor: 0xc84040 },
];

const W = 1000, H = 420;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.setClearColor(0x3f5e36, 1);
document.body.style.margin = '0';
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
camera.position.set(0, 5.6, 4.4);
camera.lookAt(0, 0, 0);

owners.forEach((o, i) => {
  const g = new THREE.Group();
  g.position.set(-3.2 + i * 1.6, 0, 0);
  scene.add(g);
  applyUnitStatPlate(g, o, { ruchLeft: 3, ruchMax: 4, hp: 7, hpMax: 10, fieldPowerM: 6, ownerColor: o.ownerColor });
});

function ringPixel(o) {
  const tex = ownerEmblemTexture(o);
  if (!tex || !tex.image || !tex.image.getContext) return null;
  const d = tex.image.getContext('2d').getImageData(64, 10, 1, 1).data;
  return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
}

let frames = 0;
function loop() {
  renderer.render(scene, camera);
  frames++;
  if (frames < 240) requestAnimationFrame(loop);
  else {
    window.__ring = owners.map(o => ({ label: o.label, want: o.ringHex, got: ringPixel(o) }));
    window.__done = true;
  }
}
requestAnimationFrame(loop);
`;
fs.writeFileSync(ENTRY, src);

const out = esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
  write: false, absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')], logLevel: 'error',
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
fs.writeFileSync(OUT, `<!doctype html><html><head><meta charset="utf-8"><title>plate</title></head><body><script>${js}</script></body></html>`);
console.log('wrote', OUT);
