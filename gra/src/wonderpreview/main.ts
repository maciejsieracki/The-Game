/**
 * wonderpreview — galeria 19 cudów Antyku na heksie (Roblox 3D).
 * Build: gra/tools/build-wonderpreview.ps1 → Civ-MAPA/Gra-podglad-CUDA-ROBLOX.html
 *
 * Inicjalizacja po DOMContentLoaded — vite-plugin-singlefile wstawia bundle w <head>,
 * więc #canvas-wrap nie istnieje w momencie eval skryptu.
 */
import * as THREE from 'three';
import { axialToWorld, HEX_R } from '../render/hexutil';
import { buildWonderModel, WONDER_MODEL_IDS } from '../render/wonderModels';

type ViewMode = 'active' | 'ruiny' | 'compare';

const WONDER_NAMES: Record<string, string> = {
  piramidy: 'Piramidy',
  wielka_stela: 'Wielka stela',
  wiszace_ogrody: 'Wiszące ogrody',
  wyrocznia: 'Wyrocznia',
  roquepertuse: 'Roquepertuse',
  stupa_sanchi: 'Stupa w Sanchi',
  petra: 'Petra',
  hamonga: "Kamień Ha'amonga",
  kolos: 'Kolos Rodyjski',
  osada_aschaffenburg: 'Osada Aschaffenburg',
  ziggurat: 'Ziggurat',
  mundo_perdido: 'Mundo Perdido',
  terakotowa_armia: 'Terakotowa armia',
  koloseum: 'Koloseum',
  dur_sharrukin: 'Dur-Sharrukin',
  brama_narodow: 'Brama wszystkich narodów',
  palac_weiyang: 'Pałac Weiyang',
  yerkapi: 'Yerkapı',
  posag_peruna: 'Posąg Peruna',
};

const OWNER_DEMO = 0xffd54a;
const WONDER_SCALE = 1.15;
const WONDER_LIFT = 0.004 * HEX_R;
const HEX_H = 0.45;

function boot(): void {
  const params = new URLSearchParams(location.search);
  const viewMode: ViewMode =
    params.get('view') === 'ruiny' ? 'ruiny'
      : params.get('view') === 'compare' ? 'compare'
        : 'active';

  const wrap = document.getElementById('canvas-wrap');
  const tabsEl = document.getElementById('tabs');
  const listEl = document.getElementById('wonder-list');
  if (!wrap || !tabsEl || !listEl) {
    throw new Error('wonderpreview: brak elementów DOM (#canvas-wrap, #tabs, #wonder-list)');
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87b8e8);
  scene.fog = new THREE.Fog(0x87b8e8, 40, 120);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x88aa66, 1.05));
  const sun = new THREE.DirectionalLight(0xfffef0, 1.25);
  sun.position.set(30, 50, 25);
  sun.castShadow = true;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -40;
  sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -40;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x404860, 0.35));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshLambertMaterial({ color: 0x5a9048 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);

  interface WonderAnchor {
    id: string;
    label: string;
    x: number;
    z: number;
    group: THREE.Group;
  }

  const anchors: WonderAnchor[] = [];
  const focusTargets = new Map<string, THREE.Vector3>();

  function hexPlatform(): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(HEX_R, HEX_R, HEX_H, 6),
      new THREE.MeshLambertMaterial({ color: 0x6a9850, flatShading: true }),
    );
    mesh.position.y = HEX_H / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  function gridSlot(index: number, mode: ViewMode): { q: number; r: number; ruin: boolean }[] {
    const cols = mode === 'compare' ? 4 : 5;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const qStep = mode === 'compare' ? 3 : 2;
    const q = col * qStep;
    const r = row * 2;
    if (mode === 'compare') {
      return [{ q, r, ruin: false }, { q: q + 1, r, ruin: true }];
    }
    return [{ q, r, ruin: mode === 'ruiny' }];
  }

  function labelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(10,14,24,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 28px Segoe UI, sans-serif';
    ctx.fillStyle = '#e8d88a';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, 42);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(2.4, 0.35, 1);
    sp.position.y = 1.35;
    return sp;
  }

  WONDER_MODEL_IDS.forEach((id, index) => {
    const slots = gridSlot(index, viewMode);
    const label = WONDER_NAMES[id] ?? id;
    const root = new THREE.Group();

    let cx = 0;
    let cz = 0;
    for (const slot of slots) {
      const { x, z } = axialToWorld(slot.q, slot.r, HEX_R);
      cx += x;
      cz += z;

      const cell = new THREE.Group();
      cell.position.set(x, 0, z);
      cell.add(hexPlatform());

      const model = buildWonderModel(id, {
        ruin: slot.ruin,
        ownerColor: OWNER_DEMO,
      });
      model.position.y = HEX_H + WONDER_LIFT;
      model.scale.setScalar(WONDER_SCALE);
      cell.add(model);

      if (viewMode === 'compare') {
        const tag = labelSprite(slot.ruin ? 'Ruina' : 'Aktywny');
        tag.position.set(0, 0.95, 0);
        cell.add(tag);
      }

      root.add(cell);
    }

    cx /= slots.length;
    cz /= slots.length;
    const nameTag = labelSprite(label);
    nameTag.position.set(cx, 1.35, cz);
    root.add(nameTag);

    scene.add(root);
    anchors.push({ id, label, x: cx, z: cz, group: root });
    focusTargets.set(id, new THREE.Vector3(cx, 0.8, cz));
  });

  for (const a of anchors) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = a.label;
    btn.addEventListener('click', () => focusWonder(a.id));
    li.appendChild(btn);
    listEl.appendChild(li);
  }

  const TAB_DEFS: { id: ViewMode; label: string }[] = [
    { id: 'active', label: 'Aktywne (19)' },
    { id: 'ruiny', label: 'Ruiny po absolut' },
    { id: 'compare', label: 'Aktywny vs ruina' },
  ];

  for (const tab of TAB_DEFS) {
    const b = document.createElement('button');
    b.className = 'tab' + (viewMode === tab.id ? ' active' : '');
    b.textContent = tab.label;
    b.addEventListener('click', () => {
      const u = new URL(location.href);
      u.searchParams.set('view', tab.id);
      location.href = u.toString();
    });
    tabsEl.appendChild(b);
  }

  let yaw = 0.65;
  let pitch = 0.42;
  let dist = viewMode === 'compare' ? 38 : 28;
  let target = new THREE.Vector3(
    anchors[Math.floor(anchors.length / 2)]?.x ?? 0,
    0,
    anchors[Math.floor(anchors.length / 2)]?.z ?? 0,
  );

  function focusWonder(id: string): void {
    const p = focusTargets.get(id);
    if (p) target.copy(p);
    dist = viewMode === 'compare' ? 10 : 7;
    if (!listEl) return;
    for (const btn of Array.from(listEl.querySelectorAll('button'))) {
      btn.classList.toggle('focused', btn.textContent === (WONDER_NAMES[id] ?? id));
    }
  }

  function updateCamera(): void {
    const cp = Math.cos(pitch);
    camera.position.set(
      target.x + dist * cp * Math.sin(yaw),
      target.y + dist * Math.sin(pitch) + 2,
      target.z + dist * cp * Math.cos(yaw),
    );
    camera.lookAt(target.x, target.y + 0.5, target.z);
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  renderer.domElement.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    yaw -= (e.clientX - lastX) * 0.008;
    pitch = Math.max(0.12, Math.min(1.2, pitch + (e.clientY - lastY) * 0.006));
    lastX = e.clientX;
    lastY = e.clientY;
  });
  renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    dist = Math.max(5, Math.min(60, dist + e.deltaY * 0.02));
  }, { passive: false });

  function onResize(): void {
    if (!wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', onResize);
  onResize();
  updateCamera();

  function animate(): void {
    requestAnimationFrame(animate);
    updateCamera();
    renderer.render(scene, camera);
  }
  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
