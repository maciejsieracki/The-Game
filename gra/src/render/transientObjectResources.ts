import * as THREE from 'three';

const SHARED_TRANSIENT_GEOMETRY = 'sharedTransientGeometry';
const SHARED_TRANSIENT_MATERIAL = 'sharedTransientMaterial';

/** Marks cached geometry which can be referenced by both a preview and a live map model. */
export function markSharedTransientGeometry<T extends THREE.BufferGeometry>(geometry: T): T {
  geometry.userData[SHARED_TRANSIENT_GEOMETRY] = true;
  return geometry;
}

/** Marks cached material which can be referenced by both a preview and a live map model. */
export function markSharedTransientMaterial<T extends THREE.Material>(material: T): T {
  material.userData[SHARED_TRANSIENT_MATERIAL] = true;
  return material;
}

/** Clones a cached material into a preview-owned material that may be disposed with the preview. */
export function cloneTransientMaterial<T extends THREE.Material>(material: T): T {
  const clone = material.clone() as T;
  delete clone.userData[SHARED_TRANSIENT_MATERIAL];
  return clone;
}

/** Replaces a group's source materials with owned clones, disposing any now-unreferenced originals. */
export function cloneObject3DMaterialsForTransient(
  root: THREE.Object3D,
  configure?: (material: THREE.Material) => void,
): void {
  const originals = new Set<THREE.Material>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const clones = sourceMaterials.map((source) => {
      originals.add(source);
      const clone = cloneTransientMaterial(source);
      configure?.(clone);
      return clone;
    });
    mesh.material = clones.length === 1 ? clones[0]! : clones;
  });
  disposeTransientMaterials(originals);
}

export function disposeTransientMaterials(materials: Iterable<THREE.Material>): void {
  const owned = new Set<THREE.Material>();
  for (const material of materials) {
    if (material && !material.userData[SHARED_TRANSIENT_MATERIAL]) owned.add(material);
  }
  for (const material of owned) material.dispose();
}

/** Disposes resources owned by a short-lived scene object without touching cached geometry. */
export function disposeTransientObject3D(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry;
    if (geometry && !geometry.userData[SHARED_TRANSIENT_GEOMETRY]) geometries.add(geometry);
    const attached = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of attached) if (material) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  disposeTransientMaterials(materials);
}
