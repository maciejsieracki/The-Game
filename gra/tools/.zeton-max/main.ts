/**
 * .zeton-max/main.ts — PODGLĄD ŻETONU W MAKSYMALNEJ KONFIGURACJI.
 * NIE jest częścią gry.
 *
 * W przeciwieństwie do .zeton-mockup (który rysował własne sprite'y) ten podgląd
 * woła DOKŁADNIE te same funkcje, których używa UnitRenderer.sync() na mapie:
 *   applyUnitOwnerEmblem()  · syncUnitUpgradeBadges()  · syncUnitVeteranBadges()
 * z assetami wstrzykniętymi tak samo jak w main.ts. Czyli to jest to, co gracz
 * zobaczy w grze, a nie makieta.
 *
 * Konfiguracja MAKSYMALNA:
 *   premia Pancerza    = 45 pp (komplet: Kuznia + Kuznia zelaza + Wielka Kuznia) -> ikona Kuzni poziom III
 *   premia Parametrow  = 50 pp (komplet: Koszary + Akademia wojskowa + Warsztat) -> ikona Koszar poziom III
 *   battlesSurvived    = 5     (poziom weterana 3, sufit)                        -> komplet gwiazdek
 *
 * Budowanie (z katalogu gra/, NIGDY `npm run build`):
 *   node ./node_modules/vite/bin/vite.js build --config tools/.zeton-max/vite.config.ts
 */
import * as THREE from 'three';
import { buildUnitModel } from '../../src/render/units';
import { HEX_R, axialToWorld } from '../../src/render/hexutil';
import { leaderPortraitUrl } from '../../src/ui/leaderPortraits';
import { civIconSvg, brandIconSvg } from '../../src/ui/icons/brandAssets';
import {
  applyUnitOwnerEmblem,
  setUnitOwnerEmblemAssets,
  type UnitOwnerEmblemContext,
} from '../../src/render/unitOwnerEmblem';
import {
  syncUnitUpgradeBadges,
  setUnitUpgradeBadgeAssets,
} from '../../src/render/unitUpgradeBadges';
import { syncUnitVeteranBadges } from '../../src/render/unitVeteranBadges';

// --- assety: DOKŁADNIE to samo wstrzyknięcie co w main.ts ------------------
setUnitOwnerEmblemAssets({
  leaderPortraitUrl: (civId: string, era: number) => leaderPortraitUrl(civId, era),
  civSigilSvg: (civId: string) => civIconSvg(civId, 40),
  barbarianSigilSvg: () => brandIconSvg('chip-death', 40),
});
setUnitUpgradeBadgeAssets({
  barracksSvg: () => brandIconSvg('bld-koszary', 40),
  forgeSvg: () => brandIconSvg('bld-kuznia', 40),
});

// --- MAKSIMUM wszystkiego ---------------------------------------------------
const MAX_UNIT = {
  pancerzBonusProc: 45,
  parametryBonusProc: 50,
  battlesSurvived: 5,
};

interface Wariant {
  opis: string;
  unitKey: string;
  kolor: number;
  ctx: UnitOwnerEmblemContext;
}

const WARIANTY: Wariant[] = [
  {
    opis: 'GRACZ — portret władcy',
    unitKey: 'wlocznik',
    kolor: 0x3a7bd5,
    ctx: { civId: 'rzymianie', era: 2, isCityState: false, isBarbarian: false },
  },
  {
    opis: 'Miasto-państwo — sygnet kultury',
    unitKey: 'wlocznik',
    kolor: 0x9b59b6,
    ctx: { civId: 'grecy', era: 2, isCityState: true, isBarbarian: false },
  },
  {
    opis: 'Barbarzyńcy — czaszka',
    unitKey: 'wojownik',
    kolor: 0x8b1f1f,
    ctx: { civId: null, era: 1, isCityState: false, isBarbarian: true },
  },
];

// --- kafelek i obwódka właściciela (kopia stałych z units.ts) ---------------
const OWNER_RING_OUTER = HEX_R * 0.9;
const OWNER_RING_INNER = OWNER_RING_OUTER - 0.045 * HEX_R;

function appendPointyTopHex(path: THREE.Path | THREE.Shape, radius: number, reverse = false): void {
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  for (let j = 0; j < 6; j++) {
    const i = order[j]!;
    const a = Math.PI / 2 + (i * Math.PI) / 3;
    if (j === 0) path.moveTo(radius * Math.cos(a), radius * Math.sin(a));
    else path.lineTo(radius * Math.cos(a), radius * Math.sin(a));
  }
  path.closePath();
}

function hexTile(kolor: number): THREE.Mesh {
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, HEX_R * 0.985);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: kolor, roughness: 0.95, metalness: 0 }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

function ownerRing(kolor: number): THREE.Mesh {
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, OWNER_RING_OUTER);
  const hole = new THREE.Path();
  appendPointyTopHex(hole, OWNER_RING_INNER, true);
  shape.holes.push(hole);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color: kolor, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006 * HEX_R;
  return m;
}

/** Żeton zbudowany PRAWDZIWĄ ścieżką render/ — tak jak w UnitRenderer.sync(). */
function zeton(w: Wariant): THREE.Group {
  const g = new THREE.Group();
  try {
    const model = buildUnitModel(w.unitKey, w.kolor) as THREE.Object3D;
    g.add(model);
  } catch {
    const f = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12 * HEX_R, 0.4 * HEX_R, 4, 8),
      new THREE.MeshStandardMaterial({ color: w.kolor }),
    );
    f.position.y = 0.35 * HEX_R;
    g.add(f);
  }
  // TE SAME trzy wywołania co w grze:
  syncUnitUpgradeBadges(g, MAX_UNIT);
  syncUnitVeteranBadges(g, MAX_UNIT);
  applyUnitOwnerEmblem(g, w.ctx);
  return g;
}

function swiatlo(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.78));
  const d = new THREE.DirectionalLight(0xffffff, 1.08);
  d.position.set(3, 6, 4);
  scene.add(d);
}

const ELEV = (52 * Math.PI) / 180;

function render(canvas: HTMLCanvasElement, tryb: 'blisko' | 'gra'): void {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(tryb === 'gra' ? 0x6f8f4a : 0x0e1318, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  swiatlo(scene);

  const step = Math.sqrt(3) * HEX_R;
  let cam: THREE.PerspectiveCamera;

  if (tryb === 'blisko') {
    WARIANTY.forEach((w, i) => {
      const g = new THREE.Group();
      g.add(hexTile(0x5d7f3e));
      g.add(ownerRing(w.kolor));
      g.add(zeton(w));
      g.position.x = (i - (WARIANTY.length - 1) / 2) * step;
      scene.add(g);
    });
    cam = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 100);
    const dist = 5.6;
    cam.position.set(0, Math.sin(ELEV) * dist + 0.3, Math.cos(ELEV) * dist);
    cam.lookAt(0, 0.5 * HEX_R, 0);
  } else {
    // REALNA skala rozgrywki: siatka heksów, kamera gry (fov 50, elewacja 52°).
    const W = 11, H = 9;
    let sx = 0, sz = 0, n = 0;
    const h01 = (q: number, r: number): number => {
      const s = Math.sin(q * 12.9898 + r * 78.233) * 43758.5453;
      return s - Math.floor(s);
    };
    for (let r = 0; r < H; r++) {
      for (let q = 0; q < W; q++) {
        const { x, z } = axialToWorld(q - (r - (r & 1)) / 2, r, HEX_R);
        sx += x; sz += z; n++;
        const t = h01(q, r);
        const tile = hexTile(t > 0.7 ? 0x6f8f4a : t > 0.4 ? 0x5d7f3e : 0x7a8a46);
        tile.position.set(x, 0, z);
        scene.add(tile);
      }
    }
    // trzy żetony w maksymalnej konfiguracji, w środku kadru
    const srodekQ = 5, srodekR = 4;
    WARIANTY.forEach((w, i) => {
      const q = srodekQ + (i - 1) * 2;
      const { x, z } = axialToWorld(q - (srodekR - (srodekR & 1)) / 2, srodekR, HEX_R);
      const g = new THREE.Group();
      g.add(ownerRing(w.kolor));
      g.add(zeton(w));
      g.position.set(x, 0.002, z);
      scene.add(g);
    });
    cam = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.5, 500);
    const cx = sx / n, cz = sz / n;
    const dist = 11;
    cam.position.set(cx, Math.sin(ELEV) * dist, cz + Math.cos(ELEV) * dist);
    cam.lookAt(cx, 0, cz);
  }

  renderer.render(scene, cam);
}

function main(): void {
  render(document.getElementById('blisko') as HTMLCanvasElement, 'blisko');
  render(document.getElementById('gra') as HTMLCanvasElement, 'gra');
  document.getElementById('legenda')!.innerHTML =
    WARIANTY.map(w => `<div>${w.opis}</div>`).join('');
  // sprite'y ładują obrazy asynchronicznie — flaga po kolejnej klatce
  setTimeout(() => {
    render(document.getElementById('blisko') as HTMLCanvasElement, 'blisko');
    render(document.getElementById('gra') as HTMLCanvasElement, 'gra');
    document.body.dataset['gotowe'] = '1';
  }, 2500);
}

main();
