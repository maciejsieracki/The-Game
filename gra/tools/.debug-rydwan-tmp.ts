import * as THREE from 'three';
import { buildRydwanWolyBrazOpus5 } from '../src/render/braz-rydwan-woly-opus5';

const HEX_R = 1.0;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('cv') as HTMLCanvasElement, antialias: true });
renderer.setSize(1000, 1000, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b2128);
scene.add(new THREE.HemisphereLight(0xffffff, 0x88cc88, 1.05));
const sun = new THREE.DirectionalLight(0xfffef0, 1.25);
sun.position.set(60, 100, 40);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35);
fill.position.set(-50, 60, -30);
scene.add(fill);

const grid = new THREE.GridHelper(2, 20, 0x556677, 0x334455);
scene.add(grid);
const hex = new THREE.Mesh(new THREE.CylinderGeometry(HEX_R, HEX_R, 0.02, 6),
  new THREE.MeshStandardMaterial({ color: 0x45505c, roughness: 0.95 }));
hex.position.y = -0.01;
scene.add(hex);

const model = buildRydwanWolyBrazOpus5(0x2f6fd0);
scene.add(model);

const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 100);
const TARGET = new THREE.Vector3(0, 0.35, 0.09);

function setAngle(deg: number, elDeg = 30, dist = 1.35): void {
  const az = THREE.MathUtils.degToRad(deg);
  const el = THREE.MathUtils.degToRad(elDeg);
  const r = Math.cos(el) * dist;
  camera.position.set(TARGET.x + Math.sin(az) * r, TARGET.y + Math.sin(el) * dist, TARGET.z + Math.cos(az) * r);
  camera.lookAt(TARGET);
}
(window as unknown as { setAngle: typeof setAngle }).setAngle = setAngle;
setAngle(0);
renderer.render(scene, camera);
(window as unknown as { render: () => void; getBox: () => unknown }).render = () => renderer.render(scene, camera);
(window as unknown as { getBox: () => unknown }).getBox = () => {
  const box = new THREE.Box3().setFromObject(model);
  return { min: box.min.toArray(), max: box.max.toArray() };
};
