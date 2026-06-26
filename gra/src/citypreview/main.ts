import * as THREE from 'three';
import { buildStoneAgeCity } from '../render/stoneCity';

function boot(): void {
  const canvas = document.getElementById('c') as HTMLCanvasElement | null;
  if (!canvas) { console.error('brak canvas'); return; }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fcfe6);
  scene.add(new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.95));
  const sun = new THREE.DirectionalLight(0xfff0cc, 1.3);
  sun.position.set(6, 14, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 80;
  const sc = 14; sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc; sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(42, 14), new THREE.MeshLambertMaterial({ color: 0x6aa53f }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const spacing = 1.75;
  const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8a6a45 });
  function placeCity(L: number, x: number, z: number, walls: boolean) {
    const city = buildStoneAgeCity(L, 0xffd54a, walls);
    city.position.set(x, 0, z); scene.add(city);
    const dirt = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.74, 0.02, 16), dirtMat);
    dirt.position.set(x, 0.005, z); dirt.receiveShadow = true; scene.add(dirt);
  }
  for (let L = 1; L <= 10; L++) {
    const x = (L - 5.5) * spacing;
    placeCity(L, x, -2.2, false); // przod: bez murow
    placeCity(L, x, 2.2, true);   // tyl: z murami
  }

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 300);
  let tx = 0, tz = 0, radius = 16, theta = 0, phi = 0.78;
  function cam(): void {
    const s = Math.sin(phi);
    camera.position.set(tx + radius * s * Math.sin(theta), radius * Math.cos(phi), tz + radius * s * Math.cos(theta));
    camera.lookAt(tx, 0, tz);
  }
  let drag = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointerup', () => { drag = false; });
  window.addEventListener('pointermove', e => { if (!drag) return; theta -= (e.clientX - lx) * 0.005; phi = Math.min(1.4, Math.max(0.15, phi - (e.clientY - ly) * 0.005)); lx = e.clientX; ly = e.clientY; cam(); });
  canvas.addEventListener('wheel', e => { e.preventDefault(); radius = Math.min(50, Math.max(3, radius * (1 + Math.sign(e.deltaY) * 0.08))); cam(); }, { passive: false });
  const keys = new Set<string>();
  window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) { keys.add(k); e.preventDefault(); } });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  cam();
  renderer.setAnimationLoop(() => {
    if (keys.size) {
      const st = radius * 0.012, fx = -Math.sin(theta), fz = -Math.cos(theta), rx = Math.cos(theta), rz = -Math.sin(theta);
      if (keys.has('w') || keys.has('arrowup')) { tx += fx * st; tz += fz * st; }
      if (keys.has('s') || keys.has('arrowdown')) { tx -= fx * st; tz -= fz * st; }
      if (keys.has('d') || keys.has('arrowright')) { tx += rx * st; tz += rz * st; }
      if (keys.has('a') || keys.has('arrowleft')) { tx -= rx * st; tz -= rz * st; }
      cam();
    }
    renderer.render(scene, camera);
  });
  window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
