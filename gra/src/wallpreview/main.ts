/**
 * wallpreview/main.ts — podglad 9 murow obronnych (siegeWall) w siatce 3x3.
 * Wzorzec: citypreview/main.ts
 * WYMOG NASTER: obroncy stoja NA CHODNIKU muru (wallWalkY z userData).
 */
import * as THREE from 'three';
import { buildSiegeWall } from '../battle/siegeWall';
import type { BronzeCiv } from '../render/bronzeCity';

const CIVS: BronzeCiv[] = ['grecja', 'rzym', 'sumer', 'egipt', 'inka', 'chiny', 'zulu', 'celtowie', 'germanie'];
const CIV_LABELS: Record<BronzeCiv, string> = {
  grecja: 'Grecja', rzym: 'Rzym', sumer: 'Sumer', egipt: 'Egipt', inka: 'Inka',
  aztek: 'Aztek', chiny: 'Chiny', zulu: 'Zulu', celtowie: 'Celtowie', germanie: 'Germanie',
};

function boot(): void {
  try {
    const canvas = document.getElementById('c') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('brak canvas #c');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ab4c8);

    // Oswietlenie
    scene.add(new THREE.AmbientLight(0xd0e8ff, 0.85));
    const sun = new THREE.DirectionalLight(0xfff4d0, 1.4);
    sun.position.set(10, 18, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    const sc = 60;
    sun.shadow.camera.left = -sc; sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc; sun.shadow.camera.bottom = -sc;
    scene.add(sun);

    const TILE = 1;
    const LENGTH = 10;
    const HEIGHT = 3;
    const GATE = 2;
    const GAP = (LENGTH + 4) * TILE; // odstep miedzy segmentami
    const COLS = 3, ROWS = 3;

    // Podloze — zielona plansza
    const groundW = COLS * GAP + GAP * 0.5;
    const groundD = ROWS * GAP + GAP * 0.5;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(groundW, groundD),
      new THREE.MeshLambertMaterial({ color: 0x4a7c3f })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Siatka pol
    const gridHelper = new THREE.GridHelper(groundW, Math.floor(groundW), 0x2a5c2f, 0x2a5c2f);
    gridHelper.position.y = 0.01;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    // Materialy dla figur
    const redMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
    const blueMat = new THREE.MeshLambertMaterial({ color: 0x2244cc });

    // Pozycje srodkow murow w siatce 3x3
    const wallPositions: THREE.Vector3[] = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        const civ = CIVS[idx];
        if (!civ) continue;

        const cx = (col - 1) * GAP;
        const cz = (row - 1) * GAP;

        wallPositions.push(new THREE.Vector3(cx, 0, cz));

        // Buduj mur
        const wall = buildSiegeWall(civ, {
          lengthTiles: LENGTH,
          tileSize: TILE,
          height: HEIGHT,
          gateWidthTiles: GATE,
        });
        wall.position.set(cx, 0, cz);
        scene.add(wall);

        // Pobierz wallWalkY z userData (chodnik bojowy)
        const walkY: number = (typeof wall.userData['wallWalkY'] === 'number')
          ? wall.userData['wallWalkY'] as number
          : HEIGHT;
        // Figurka-zolnierz ma wysokosc 0.8, stoi na chodniku: Y = walkY + 0.4
        const soldierStandY = walkY + 0.4;

        // Figurki atakujacych (5 czerwonych, +Z, na ziemi)
        const wallHalfL = LENGTH * TILE * 0.5;
        for (let fi = 0; fi < 5; fi++) {
          const fx = cx - wallHalfL * 0.7 + fi * (wallHalfL * 1.4 / 4);
          const figure = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.8, 0.3),
            redMat
          );
          figure.position.set(fx, 0.4, cz + TILE * 2.5);
          figure.castShadow = true;
          scene.add(figure);
        }

        // Figurki obroncy — STOJA NA MURZE (wallWalkY + polowa wysokosci figurki)
        // 4 obroncy rozlozeni wzdluz korony muru (z dala od bramy)
        const defenderCount = 4;
        // Rozkladamy na lewej polowie muru, bo prawa symetrycznie
        const murHalfL = wallHalfL * 0.72; // trzymamy sie z dala od krawedzi
        for (let fi = 0; fi < defenderCount; fi++) {
          // Pozycja wzdluz X: od lewej do prawej, omijajac bramy
          const span = murHalfL * 1.6;
          const fx = cx - span / 2 + fi * (span / (defenderCount - 1));
          // Pomijamy pozycje przy bramie (srodkowe X)
          const distFromGate = Math.abs(fx - cx);
          const gateHalfW = GATE * TILE / 2 + TILE * 0.3;
          if (distFromGate < gateHalfW) continue;

          // Chodnik: Z = cz (srodek muru w Z), lekko przesuniety do wewnatrz
          const defZ = cz + TILE * 0.15; // srodek chodnika (w Z)

          const figure = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.8, 0.3),
            blueMat
          );
          figure.position.set(fx, soldierStandY, defZ);
          figure.castShadow = true;
          scene.add(figure);
        }
      }
    }

    // Kamera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
    let tx = 0, tz = 0, radius = 45, theta = 0, phi = 0.72;

    function updateCamera(): void {
      const s = Math.sin(phi);
      camera.position.set(
        tx + radius * s * Math.sin(theta),
        radius * Math.cos(phi),
        tz + radius * s * Math.cos(theta)
      );
      camera.lookAt(tx, 0, tz);
    }

    // Etykiety HTML
    const labelsContainer = document.getElementById('labels') as HTMLDivElement;
    const labelEls: HTMLDivElement[] = [];
    for (let i = 0; i < CIVS.length; i++) {
      const div = document.createElement('div');
      div.className = 'label';
      const civKey = CIVS[i];
      div.textContent = civKey !== undefined ? CIV_LABELS[civKey] : '';
      labelsContainer.appendChild(div);
      labelEls.push(div);
    }

    function updateLabels(): void {
      for (let i = 0; i < wallPositions.length; i++) {
        const wp = wallPositions[i];
        if (!wp) continue;
        const pos = wp.clone();
        pos.y = HEIGHT + 1.0;
        pos.project(camera);
        const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
        const el = labelEls[i];
        if (!el) continue;
        if (pos.z < 1) {
          el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      }
    }

    // Sterowanie myszka
    let drag = false, lx = 0, ly = 0;
    canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointerup', () => { drag = false; });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      theta -= (e.clientX - lx) * 0.005;
      phi = Math.min(1.45, Math.max(0.12, phi - (e.clientY - ly) * 0.005));
      lx = e.clientX; ly = e.clientY;
      updateCamera();
    });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      radius = Math.min(100, Math.max(4, radius * (1 + Math.sign(e.deltaY) * 0.09)));
      updateCamera();
    }, { passive: false });

    // WASD
    const keys = new Set<string>();
    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) {
        keys.add(k); e.preventDefault();
      }
    });
    window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

    updateCamera();

    renderer.setAnimationLoop(() => {
      if (keys.size) {
        const st = radius * 0.012;
        const fx = -Math.sin(theta), fz = -Math.cos(theta);
        const rx = Math.cos(theta), rz = -Math.sin(theta);
        if (keys.has('w') || keys.has('arrowup'))    { tx += fx * st; tz += fz * st; }
        if (keys.has('s') || keys.has('arrowdown'))  { tx -= fx * st; tz -= fz * st; }
        if (keys.has('d') || keys.has('arrowright')) { tx += rx * st; tz += rz * st; }
        if (keys.has('a') || keys.has('arrowleft'))  { tx -= rx * st; tz -= rz * st; }
        updateCamera();
      }
      renderer.render(scene, camera);
      updateLabels();
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message + '\n' + (err.stack ?? '') : String(err);
    const overlay = document.getElementById('__e__');
    if (overlay) overlay.innerHTML += '\nBOOT ERROR: ' + msg;
    else console.error('BOOT ERROR:', msg);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
