import * as THREE from 'three';
import { buildBronzeCity } from '../render/bronzeCity';
import type { BronzeCiv } from '../render/bronzeCity';

// 9 cywilizacji (bez aztekow)
const CIVS: BronzeCiv[] = ['grecja', 'rzym', 'chiny', 'inka', 'zulu', 'egipt', 'sumer', 'celtowie', 'germanie'];
const CIV_NAMES: Partial<Record<BronzeCiv, string>> = {
  grecja: 'Grecja', rzym: 'Rzym', chiny: 'Chiny', inka: 'Inka', zulu: 'Zulu',
  egipt: 'Egipt', sumer: 'Sumer', celtowie: 'Celtowie', germanie: 'Germanie',
};
const OWNER_COLORS: number[] = [0x3a6fd8, 0xcc3c2c, 0xe8a020, 0x2e8c50, 0x8c2ca8, 0x206090, 0xb06020, 0x3c8878, 0x8c8c1c];
const ATTACKER_COLOR = 0xc42020;

function mk(c: number): THREE.MeshLambertMaterial { return new THREE.MeshLambertMaterial({ color: c }); }

function makeGateMarker(wallR: number, cityX: number, cityZ: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), mk(0xeeeeee));
  pole.position.y = 0;
  g.add(pole);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 6), mk(0xdd2020));
  cone.position.y = 0.16;
  g.add(cone);
  g.position.set(cityX, 0.42, cityZ + wallR + 0.05);
  return g;
}

function makeSoldiers(count: number, color: number): THREE.Group {
  const g = new THREE.Group();
  const mat = mk(color);
  const helmetMat = mk(0x888888);
  for (let i = 0; i < count; i++) {
    const sx = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.1, 0.04), mat);
    body.position.y = 0.05; body.castShadow = true; sx.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), mat);
    head.position.y = 0.135; head.castShadow = true; sx.add(head);
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.02, 6), helmetMat);
    helm.position.y = 0.155; sx.add(helm);
    const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.22, 4), mk(0x6b4f2a));
    spear.position.set(0.04, 0.11, 0); sx.add(spear);
    sx.position.set((i - (count - 1) / 2) * 0.13, 0, 0);
    g.add(sx);
  }
  return g;
}

function makeRam(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = mk(0x6b4f2a);
  const roofMat = mk(0x8a6a3a);
  const metalMat = mk(0x555555);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.1), woodMat);
  body.position.y = 0.07; body.castShadow = true; g.add(body);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 3, 1), roofMat);
  roof.rotation.z = Math.PI / 2; roof.scale.y = 0.62;
  roof.position.y = 0.135; roof.castShadow = true; g.add(roof);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), woodMat);
  beam.rotation.z = Math.PI / 2; beam.position.set(0.1, 0.07, 0); beam.castShadow = true; g.add(beam);
  const ramHead = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), metalMat);
  ramHead.position.set(0.22, 0.07, 0); g.add(ramHead);
  for (const xs of [-1, 1] as const) for (const zs of [-1, 1] as const) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 8), mk(0x3a2c1a));
    w.rotation.z = Math.PI / 2; w.position.set(xs * 0.07, 0.022, zs * 0.04); g.add(w);
  }
  return g;
}

function makeCatapult(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = mk(0x6b4f2a);
  const rockMat = mk(0x888880);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.1), woodMat);
  base.position.y = 0.04; base.castShadow = true; g.add(base);
  for (const xs of [-1, 1] as const) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.09, 0.018), woodMat);
    post.position.set(xs * 0.04, 0.09, 0); post.castShadow = true; g.add(post);
  }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.1, 6), woodMat);
  axle.rotation.z = Math.PI / 2; axle.position.set(0, 0.135, 0); g.add(axle);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.18, 0.016), woodMat);
  arm.rotation.z = -0.65; arm.position.set(0.04, 0.155, 0); arm.castShadow = true; g.add(arm);
  const rock = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 5), rockMat);
  rock.position.set(0.12, 0.23, 0); rock.castShadow = true; g.add(rock);
  for (const xs of [-1, 1] as const) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 8), mk(0x3a2c1a));
    w.rotation.z = Math.PI / 2; w.position.set(xs * 0.04, 0.022, 0.04); g.add(w);
  }
  return g;
}

function makeSiegeTower(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = mk(0x6b4f2a);
  const planks = mk(0x7a5c32);
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.09), woodMat);
  tower.position.y = 0.17; tower.castShadow = true; g.add(tower);
  for (let i = 0; i < 3; i++) {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.012, 0.095), planks);
    floor.position.y = 0.05 + i * 0.11; g.add(floor);
  }
  const roofTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.1), planks);
  roofTop.position.y = 0.34; g.add(roofTop);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.01, 0.15), planks);
  ramp.rotation.x = -0.45; ramp.position.set(0, 0.26, 0.09); ramp.castShadow = true; g.add(ramp);
  for (const xs of [-1, 1] as const) for (const zs of [-1, 1] as const) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 8), mk(0x3a2c1a));
    w.rotation.z = Math.PI / 2; w.position.set(xs * 0.038, 0.022, zs * 0.035); g.add(w);
  }
  return g;
}

function boot(): void {
  const canvas = document.getElementById('c') as HTMLCanvasElement | null;
  if (!canvas) { console.error('brak canvas'); return; }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7ab8d8);
  scene.add(new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.9));
  const sun = new THREE.DirectionalLight(0xfff0cc, 1.4);
  sun.position.set(8, 18, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 120;
  const sc = 22;
  sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc;
  sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc;
  scene.add(sun);

  const bigGround = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshLambertMaterial({ color: 0x4a7a2c })
  );
  bigGround.rotation.x = -Math.PI / 2; bigGround.receiveShadow = true; scene.add(bigGround);

  const COLS = 3;
  const SPACX = 6.5, SPACZ = 8.0;
  const CITY_LEVEL = 6;
  const spread = 0.13 + CITY_LEVEL * 0.05; // 0.43
  const wallR = spread * 1.42;             // ~0.61

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
  let tx = 0, tz = 0, radius = 32, theta = 0.25, phi = 0.72;

  function cam(): void {
    const s = Math.sin(phi);
    camera.position.set(
      tx + radius * s * Math.sin(theta),
      radius * Math.cos(phi),
      tz + radius * s * Math.cos(theta)
    );
    camera.lookAt(tx, 0, tz);
  }

  // Overlay etykiet
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
  document.body.appendChild(overlay);
  const labelDivs: HTMLDivElement[] = [];
  const labelPos3D: THREE.Vector3[] = [];

  for (let i = 0; i < CIVS.length; i++) {
    const civ = CIVS[i];
    if (!civ) continue;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx = (col - 1) * SPACX;
    const cz = (row - 1) * SPACZ;
    const ownerColor = OWNER_COLORS[i] ?? 0xffffff;

    // Łatka trawy pod miasto+formację
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 24),
      new THREE.MeshLambertMaterial({ color: 0x5d9e3a })
    );
    patch.rotation.x = -Math.PI / 2; patch.position.set(cx, 0.002, cz + 0.7);
    patch.receiveShadow = true; scene.add(patch);

    // Miasto z murem
    const city = buildBronzeCity(civ, CITY_LEVEL, ownerColor, true);
    city.position.set(cx, 0, cz); scene.add(city);

    // Marker bramy (czerwony stożek nad wejściem front +Z)
    scene.add(makeGateMarker(wallR, cx, cz));

    // Formacja atakujących: z przodu bramy (+Z)
    const attackZ = cz + wallR + 0.6;

    const soldiers = makeSoldiers(5, ATTACKER_COLOR);
    soldiers.position.set(cx, 0, attackZ);
    soldiers.rotation.y = Math.PI; // patrzą w stronę bramy
    scene.add(soldiers);

    // Taran — na osi, dziobem w bramę
    const ram = makeRam();
    ram.position.set(cx, 0, attackZ + 0.38);
    ram.rotation.y = Math.PI;
    scene.add(ram);

    // Katapulta — lekko z boku
    const cat = makeCatapult();
    cat.position.set(cx + 0.55, 0, attackZ + 0.22);
    cat.rotation.y = Math.PI;
    scene.add(cat);

    // Wieża oblężnicza — z drugiej strony
    const siegeTower = makeSiegeTower();
    siegeTower.position.set(cx - 0.55, 0, attackZ + 0.3);
    siegeTower.rotation.y = Math.PI;
    scene.add(siegeTower);

    // Etykieta HTML nad centrum miasta
    const d = document.createElement('div');
    d.textContent = CIV_NAMES[civ] ?? civ;
    d.style.cssText = 'position:absolute;color:#fff;font:bold 13px/1 system-ui,Arial,sans-serif;text-shadow:0 1px 4px #000,0 0 8px #000;background:rgba(0,0,0,.5);padding:2px 8px;border-radius:5px;transform:translateX(-50%);pointer-events:none;white-space:nowrap;';
    overlay.appendChild(d);
    labelDivs.push(d);
    labelPos3D.push(new THREE.Vector3(cx, 1.2, cz));
  }

  function updateLabels(): void {
    const W = canvas!.clientWidth, H = canvas!.clientHeight;
    for (let i = 0; i < labelPos3D.length; i++) {
      const lp = labelPos3D[i];
      const ld = labelDivs[i];
      if (!lp || !ld) continue;
      const v = lp.clone().project(camera);
      const x = (v.x * 0.5 + 0.5) * W;
      const y = (-v.y * 0.5 + 0.5) * H;
      ld.style.left = x + 'px';
      ld.style.top = y + 'px';
    }
  }

  let drag = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointerup', () => { drag = false; });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    theta -= (e.clientX - lx) * 0.005;
    phi = Math.min(1.45, Math.max(0.12, phi - (e.clientY - ly) * 0.005));
    lx = e.clientX; ly = e.clientY; cam();
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius = Math.min(80, Math.max(4, radius * (1 + Math.sign(e.deltaY) * 0.09)));
    cam();
  }, { passive: false });
  const keys = new Set<string>();
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) {
      keys.add(k); e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

  cam();
  renderer.setAnimationLoop(() => {
    if (keys.size) {
      const st = radius * 0.012;
      const fx = -Math.sin(theta), fz = -Math.cos(theta);
      const rx = Math.cos(theta), rz = -Math.sin(theta);
      if (keys.has('w') || keys.has('arrowup'))    { tx += fx * st; tz += fz * st; }
      if (keys.has('s') || keys.has('arrowdown'))  { tx -= fx * st; tz -= fz * st; }
      if (keys.has('d') || keys.has('arrowright')) { tx += rx * st; tz += rz * st; }
      if (keys.has('a') || keys.has('arrowleft'))  { tx -= rx * st; tz -= rz * st; }
      cam();
    }
    updateLabels();
    renderer.render(scene, camera);
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
