import * as THREE from 'three';
import { buildBronzeCity, BronzeCiv, BRONZE_CIVS } from '../render/bronzeCity';

const LABEL: Record<BronzeCiv, string> = {
  grecja: 'Grecja', rzym: 'Rzym', sumer: 'Sumer', egipt: 'Egipt', inka: 'Inkowie',
  aztek: 'Aztekowie', chiny: 'Chiny', zulu: 'Zulusi', celtowie: 'Celtowie', germanie: 'Germanie',
};

function boot(): void {
  const canvas = document.getElementById('c') as HTMLCanvasElement | null;
  if (!canvas) { console.error('brak canvas'); return; }
  const params = new URLSearchParams(location.search);
  const focusParam = (params.get('civ') || '').toLowerCase();
  const focus = (BRONZE_CIVS as string[]).includes(focusParam) ? focusParam as BronzeCiv : null;

  // --- HUD: przyciski nacji ---
  const civsEl = document.getElementById('civs');
  if (civsEl) {
    const mkA = (href: string, txt: string, on: boolean) => `<a href="${href}" class="${on ? 'on' : ''}">${txt}</a>`;
    let html = mkA('?civ=all', 'Wszystkie', !focus);
    for (const c of BRONZE_CIVS) html += mkA('?civ=' + c, LABEL[c], focus === c);
    civsEl.innerHTML = html;
  }
  const titleEl = document.getElementById('title');
  if (titleEl) titleEl.textContent = focus ? `Miasta brazu — ${LABEL[focus]} (10 poziomow, z/bez murow)` : 'Miasta brazu — przeglad 10 stylow (poziomy 1→10)';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fcfe6);
  scene.add(new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.95));
  const sun = new THREE.DirectionalLight(0xfff0cc, 1.3); sun.position.set(10, 20, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 140;
  const sc = 26; sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc; sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc; scene.add(sun);

  const spacing = 1.75, rowGap = 1.95;
  const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8a6a45 });
  const owner = 0xffd54a;

  function placeRow(civ: BronzeCiv, z: number, walls: boolean) {
    for (let L = 1; L <= 10; L++) {
      const x = (L - 5.5) * spacing;
      const city = buildBronzeCity(civ, L, owner, walls); city.position.set(x, 0, z); scene.add(city);
      const dirt = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.76, 0.02, 16), dirtMat); dirt.position.set(x, 0.005, z); dirt.receiveShadow = true; scene.add(dirt);
    }
  }

  let rows: Array<{ z: number; txt: string }> = [];
  if (focus) {
    placeRow(focus, -rowGap / 2, false);
    placeRow(focus, rowGap / 2, true);
    rows = [{ z: -rowGap / 2, txt: LABEL[focus] + ' — bez murow' }, { z: rowGap / 2, txt: LABEL[focus] + ' — z murami' }];
  } else {
    const n = BRONZE_CIVS.length;
    BRONZE_CIVS.forEach((c, i) => { const z = (i - (n - 1) / 2) * rowGap; placeRow(c, z, false); rows.push({ z, txt: LABEL[c] }); });
  }

  // ground dopasowany
  const depth = (rows.length) * rowGap + 2;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(11 * spacing + 2, depth), new THREE.MeshLambertMaterial({ color: 0x6aa53f }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.001; ground.receiveShadow = true; scene.add(ground);

  // legenda rzedow (HTML, kolejnosc od przodu/gory)
  const legEl = document.getElementById('legend');
  if (legEl && !focus) { legEl.style.display = 'block'; legEl.innerHTML = '<b>Rzedy (od dolu mapy):</b><br>' + rows.map(r => LABEL ? r.txt : r.txt).reverse().join('<br>'); }

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
  let tx = 0, tz = 0, radius = focus ? 14 : 30, theta = 0, phi = focus ? 0.8 : 0.62;
  function cam(){ const s = Math.sin(phi); camera.position.set(tx + radius * s * Math.sin(theta), radius * Math.cos(phi), tz + radius * s * Math.cos(theta)); camera.lookAt(tx, 0, tz); }
  let drag = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointerup', () => { drag = false; });
  window.addEventListener('pointermove', e => { if (!drag) return; theta -= (e.clientX - lx) * 0.005; phi = Math.min(1.4, Math.max(0.12, phi - (e.clientY - ly) * 0.005)); lx = e.clientX; ly = e.clientY; cam(); });
  canvas.addEventListener('wheel', e => { e.preventDefault(); radius = Math.min(80, Math.max(3, radius * (1 + Math.sign(e.deltaY) * 0.08))); cam(); }, { passive: false });
  const keys = new Set<string>();
  window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) { keys.add(k); e.preventDefault(); } });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  cam();
  renderer.setAnimationLoop(() => {
    if (keys.size) { const st = radius * 0.012, fx = -Math.sin(theta), fz = -Math.cos(theta), rx = Math.cos(theta), rz = -Math.sin(theta);
      if (keys.has('w') || keys.has('arrowup')) { tx += fx * st; tz += fz * st; }
      if (keys.has('s') || keys.has('arrowdown')) { tx -= fx * st; tz -= fz * st; }
      if (keys.has('d') || keys.has('arrowright')) { tx += rx * st; tz += rz * st; }
      if (keys.has('a') || keys.has('arrowleft')) { tx -= rx * st; tz -= rz * st; } cam(); }
    renderer.render(scene, camera);
  });
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
