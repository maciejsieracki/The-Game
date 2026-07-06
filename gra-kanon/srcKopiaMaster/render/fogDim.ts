/**
 * fogDim.ts — wspólne przyciemnianie dekoracji 3D (FoW explored).
 * Płaski teren (InstancedMesh) dimuje setFog; grupy 3D muszą dostać ten sam mnożnik,
 * inaczej wyglądają jak „ląd zalany oceanem” (jasne drzewa/góry na ciemnym heksie + tafla).
 */
import * as THREE from 'three';
import { FOG_EXPLORED_BRIGHTNESS } from '../game/visibility';

const DIM_MAT_TYPES = new Set<unknown>([
  THREE.MeshLambertMaterial,
  THREE.MeshStandardMaterial,
  THREE.MeshBasicMaterial,
  THREE.MeshPhongMaterial,
]);

export function fogBrightnessForHex(
  hexKey: string,
  visible: Set<string>,
  explored: Set<string>,
  fogActive: boolean,
): number {
  if (!fogActive) return 1;
  if (visible.has(hexKey)) return 1;
  if (explored.has(hexKey)) return FOG_EXPLORED_BRIGHTNESS;
  return 0;
}

/** Mnożnik jasności koloru materiału (1 = pełny, FOG_EXPLORED_BRIGHTNESS = explored). */
export function applyFogDimToObject3D(root: THREE.Object3D, brightness: number): void {
  if (brightness <= 0) return;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat || !DIM_MAT_TYPES.has(mat.constructor)) continue;
      const m = mat as THREE.MeshLambertMaterial;
      if (!m.userData.fogBaseColor) {
        m.userData.fogBaseColor = m.color.clone();
      }
      m.color.copy(m.userData.fogBaseColor as THREE.Color).multiplyScalar(brightness);
    }
  });
}
