import * as THREE from 'three';
import { UnitRenderer } from '../../../../gra/src/render/units.ts';
import { setUnitOwnerEmblemAssets } from '../../../../gra/src/render/unitOwnerEmblem.ts';
import { TerenBazowy, Nakladka, Ulepszenie } from '../../../../gra/src/types/hex.ts';
import { axialToWorld, HEX_R } from '../../../../gra/src/render/hexutil.ts';

setUnitOwnerEmblemAssets({
  leaderPortraitUrl: () => null,
  civSigilSvg: () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#d6ba54"/><path d="M50 12 60 40 90 40 66 58 75 88 50 70 25 88 34 58 10 40 40 40Z" fill="#292719"/></svg>',
  barbarianSigilSvg: () => '',
});

const scene = new THREE.Scene();
scene.background = new THREE.Color('#202732');
scene.fog = new THREE.Fog('#202732', 12, 32);
scene.add(new THREE.HemisphereLight(0xe3edff, 0x44513f, 2.0));
const sun = new THREE.DirectionalLight(0xffefc5, 2.8);
sun.position.set(-5, 9, 6);
scene.add(sun);

const hexes: Record<string, any> = {};
const hexGeom = new THREE.CylinderGeometry(HEX_R, HEX_R, 0.20, 6, 1);
const terrainColors = ['#526f4a', '#617b4c', '#737961', '#4b6846', '#6a754c'];
for (let q = -3; q <= 3; q++) {
  for (let r = -3; r <= 3; r++) {
    if (Math.abs(q + r) > 3) continue;
    const key = `${q},${r}`;
    const terrain = (q === 2 && r === -1) || (q === -2 && r === 1)
      ? TerenBazowy.Wzgorza : TerenBazowy.Laka;
    hexes[key] = {
      coords: { q, r }, terenBazowy: terrain, nakladka: Nakladka.Brak,
      ulepszenie: Ulepszenie.Brak, wlasciciel: null, wioska: { obecna: false },
      widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
    const { x, z } = axialToWorld(q, r, HEX_R);
    const colorIndex = Math.abs(q * 3 + r * 5) % terrainColors.length;
    const tile = new THREE.Mesh(hexGeom, new THREE.MeshStandardMaterial({
      color: terrain === TerenBazowy.Wzgorza ? '#777766' : terrainColors[colorIndex], roughness: 1,
    }));
    tile.position.set(x, terrain === TerenBazowy.Wzgorza ? 0.23 : 0.40, z);
    tile.receiveShadow = true;
    scene.add(tile);
  }
}

const map = { szerokoscQ: 7, wysokoscR: 7, hexes, seed: 202610, riverPaths: [] };
const renderer = new UnitRenderer(scene, map as any);
renderer.setOwnerColorFn(() => 0xc8a84c);
renderer.setOwnerEmblemResolver(() => ({ civId: 'grecy', era: 1, isCityState: false, isBarbarian: false }));
const repId = 'preview-representative';
const representative = {
  id: repId, ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 0, r: 0,
  ruch: 2, ruchLeft: 2, hp: 24, hpMax: 30, isGeneral: false,
};
const vitals = {
  ruchLeft: 2, ruchMax: 2, hp: 48, hpMax: 60, fieldPowerM: 7, count: 2,
  armorBadgeLevel: 0, softBadgeLevel: 0, veteranLevel: 3, veteranStars: 3,
  hasCommander: true,
};
renderer.sync([representative as any], {
  visibleIds: new Set([repId]), badgeByRepId: new Map([[repId, 2]]),
  vitalsByRepId: new Map([[repId, vitals as any]]),
});

const camera = new THREE.PerspectiveCamera(38, 1440 / 1000, 0.1, 100);
// Production gameplay scene aims from a 52° elevation; this camera uses the same ratio.
camera.position.set(0, 13.0, 10.0);
camera.lookAt(0, 0.5, 0);
camera.updateProjectionMatrix();
const webgl = new THREE.WebGLRenderer({ antialias: true, alpha: false });
webgl.setPixelRatio(1);
webgl.setSize(1440, 1000);
webgl.outputColorSpace = THREE.SRGBColorSpace;
webgl.shadowMap.enabled = true;
webgl.domElement.id = 'game-scene';
document.getElementById('scene')!.appendChild(webgl.domElement);
let frame = 0;
const redraw = () => { webgl.render(scene, camera); if (++frame < 20) requestAnimationFrame(redraw); };
redraw();
