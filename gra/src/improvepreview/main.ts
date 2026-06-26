import * as THREE from 'three';
import { buildImprovement, IMPROVEMENTS, ImprovementKey } from '../render/improvements';

const R = 1.0;
const TERR = [
  { name: 'Łąka', color: 0x6aa53f, top: 0.40 }, { name: 'Równina', color: 0xa9b257, top: 0.45 },
  { name: 'Pustynia', color: 0xd9c179, top: 0.40 }, { name: 'Wzgórza', color: 0x4f7d34, top: 0.55 },
  { name: 'Góry', color: 0x9aa1a9, top: 0.60 }, { name: 'Wybrzeże', color: 0x46a3d6, top: 0.35 }, { name: 'Morze', color: 0x1f5a86, top: 0.30 },
];

function boot(): void {
  const canvas = document.getElementById('c') as HTMLCanvasElement | null;
  if (!canvas) { console.error('brak canvas'); return; }
  const params = new URLSearchParams(location.search);
  const fp = (params.get('imp') || '').toLowerCase();
  const keys = IMPROVEMENTS.map(i => i.key) as string[];
  const focus = keys.includes(fp) ? fp as ImprovementKey : null;

  const impsEl = document.getElementById('imps');
  if (impsEl) { let h = `<a href="?imp=all" class="${focus ? '' : 'on'}">Wszystkie</a>`;
    for (const it of IMPROVEMENTS) h += `<a href="?imp=${it.key}" class="${focus === it.key ? 'on' : ''}">${it.label}</a>`; impsEl.innerHTML = h; }
  const titleEl = document.getElementById('title');
  const labelOf = (k: string) => IMPROVEMENTS.find(i => i.key === k)?.label || k;
  if (titleEl) titleEl.textContent = focus ? `Ulepszenie: ${labelOf(focus)} — na wszystkich terenach` : 'Ulepszenia terenu — przeglad (wiersz = ulepszenie, kolumna = teren)';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fcfe6);
  scene.add(new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.95));
  const sun = new THREE.DirectionalLight(0xfff0cc, 1.3); sun.position.set(10, 22, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 150;
  const sc = 30; sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc; sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc; scene.add(sun);

  const colGap = 2.2, rowGap = 2.5;
  function cell(impKey: ImprovementKey, ti: number, x: number, z: number) {
    const t = TERR[ti];
    const hex = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.998, R * 0.998, t.top, 6, 1), new THREE.MeshLambertMaterial({ color: t.color }));
    hex.position.set(x, t.top / 2, z); hex.castShadow = true; hex.receiveShadow = true; scene.add(hex);
    if (impKey === 'irygacja') { const w = new THREE.Mesh(new THREE.BoxGeometry(R * 1.0, 0.05, 0.18), new THREE.MeshLambertMaterial({ color: 0x4a93c4 })); w.position.set(x, t.top, z + R * 0.82); scene.add(w); }
    const imp = buildImprovement(impKey, 0xffd54a); imp.position.set(x, t.top, z); scene.add(imp);
  }

  const nT = TERR.length;
  let rows: string[] = [];
  if (focus) {
    for (let ti = 0; ti < nT; ti++) cell(focus, ti, (ti - (nT - 1) / 2) * colGap, 0);
    rows = [labelOf(focus)];
  } else {
    IMPROVEMENTS.forEach((it, ii) => { const z = (ii - (IMPROVEMENTS.length - 1) / 2) * rowGap;
      for (let ti = 0; ti < nT; ti++) cell(it.key, ti, (ti - (nT - 1) / 2) * colGap, z); rows.push('[ep.' + it.epoka + '] ' + it.label); });
  }
  // grunt
  const depth = (focus ? 1 : IMPROVEMENTS.length) * rowGap + 3, width = nT * colGap + 3;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshLambertMaterial({ color: 0x5f8f44 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);

  const legEl = document.getElementById('legend');
  if (legEl) legEl.innerHTML = '<b>Kolumny (lewo→prawo):</b><br>' + TERR.map(t => t.name).join(' · ') + (focus ? '' : '<br><br><b>Wiersze (od dolu):</b><br>' + [...rows].reverse().join('<br>'));

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
  let tx = 0, tz = 0, radius = focus ? 11 : 26, theta = 0, phi = focus ? 0.78 : 0.6;
  function cam(){ const s = Math.sin(phi); camera.position.set(tx + radius * s * Math.sin(theta), radius * Math.cos(phi), tz + radius * s * Math.cos(theta)); camera.lookAt(tx, 0, tz); }
  let drag = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointerup', () => { drag = false; });
  window.addEventListener('pointermove', e => { if (!drag) return; theta -= (e.clientX - lx) * 0.005; phi = Math.min(1.45, Math.max(0.1, phi - (e.clientY - ly) * 0.005)); lx = e.clientX; ly = e.clientY; cam(); });
  canvas.addEventListener('wheel', e => { e.preventDefault(); radius = Math.min(80, Math.max(3, radius * (1 + Math.sign(e.deltaY) * 0.08))); cam(); }, { passive: false });
  const kk = new Set<string>();
  window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) { kk.add(k); e.preventDefault(); } });
  window.addEventListener('keyup', e => kk.delete(e.key.toLowerCase()));
  cam();
  renderer.setAnimationLoop(() => { if (kk.size) { const st = radius * 0.012, fx = -Math.sin(theta), fz = -Math.cos(theta), rx = Math.cos(theta), rz = -Math.sin(theta);
    if (kk.has('w') || kk.has('arrowup')) { tx += fx * st; tz += fz * st; } if (kk.has('s') || kk.has('arrowdown')) { tx -= fx * st; tz -= fz * st; }
    if (kk.has('d') || kk.has('arrowright')) { tx += rx * st; tz += rz * st; } if (kk.has('a') || kk.has('arrowleft')) { tx -= rx * st; tz -= rz * st; } cam(); }
    renderer.render(scene, camera); });
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
