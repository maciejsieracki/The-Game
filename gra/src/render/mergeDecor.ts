/**
 * mergeDecor.ts — FPS: scalanie grupy dekoracji per-heks (dziesiątki/setki małych
 * boxów) w JEDEN mesh ze zmergowaną BufferGeometry + vertex colors. Redukuje liczbę
 * obiektów Mesh w scenie (główny koszt CPU: traversal + culling + macierze per obiekt).
 *
 * ZACHOWANIE MGŁY: merged mesh dostaje WŁASNY materiał MeshLambert(vertexColors,flatShading).
 * `applyFogDimToObject3D` przyciemnia `material.color` (biały × jasność) — mnoży się przez
 * vertex colors → poprawny per-heks dimming, tak jak przy grupach wielomateriałowych.
 *
 * NIE dysponuje geometrii dzieci (mogą być współdzielonymi singletonami, np. koń z
 * kon-nowy-model). Spójne z istniejącym wzorcem (clearResourceOverlays też nie dispose'uje).
 */
import * as THREE from 'three';

const WHITE = new THREE.Color(1, 1, 1);

/**
 * Buduje pojedynczy zmergowany mesh z wszystkich Mesh-dzieci grupy (w przestrzeni
 * LOKALNEJ grupy). flatShading = normalne liczone w shaderze, więc nie pieczemy normalnych.
 */
function buildMergedMesh(group: THREE.Object3D): THREE.Mesh {
  group.updateMatrixWorld(true);
  const invRoot = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const _m = new THREE.Matrix4();
  const _v = new THREE.Vector3();
  const _c = new THREE.Color();
  const positions: number[] = [];
  const colors: number[] = [];

  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    let geo = mesh.geometry as THREE.BufferGeometry;
    const idx = geo.index;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!posAttr) return;
    _m.multiplyMatrices(invRoot, mesh.matrixWorld);
    const mat0 = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
      | THREE.MeshLambertMaterial
      | undefined;
    _c.copy(mat0?.color ?? WHITE);
    const push = (i: number): void => {
      _v.fromBufferAttribute(posAttr, i).applyMatrix4(_m);
      positions.push(_v.x, _v.y, _v.z);
      colors.push(_c.r, _c.g, _c.b);
    };
    if (idx) {
      for (let i = 0; i < idx.count; i++) push(idx.getX(i));
    } else {
      for (let i = 0; i < posAttr.count; i++) push(i);
    }
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  // flatShading: normalne liczone w shaderze z pochodnych — nie pieczemy atrybutu normal.
  const m = new THREE.Mesh(
    merged,
    new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }),
  );
  m.castShadow = true;
  m.receiveShadow = true;
  m.matrixAutoUpdate = false; // FPS: statyczny (lokalna macierz = identyczność) — bez per-frame updateMatrix
  return m;
}

/**
 * Zwija grupę dekoracji W MIEJSCU: usuwa wszystkie dzieci i wstawia jeden zmergowany mesh.
 * Grupa zostaje (ta sama referencja, ta sama pozycja) — więc fog-sync i mapy overlayów
 * działają bez zmian. Zwraca tę samą grupę dla wygody łańcuchowania.
 */
export function collapseToMergedMesh<T extends THREE.Object3D>(group: T): T {
  if (group.children.length === 0) return group;
  let merged: THREE.Mesh;
  try {
    merged = buildMergedMesh(group);
    if (merged.geometry.getAttribute('position').count === 0) return group; // nic do scalenia
  } catch (err) {
    // Fail-safe: gdyby nietypowa dekoracja nie dała się scalić — zostaw grupę bez zmian
    // (renderuje się dalej, tylko bez zysku FPS na tym heksie). Nigdy nie psuj sceny.
    console.warn('[mergeDecor] collapse skipped', err);
    return group;
  }
  for (let i = group.children.length - 1; i >= 0; i--) {
    group.remove(group.children[i]!);
  }
  group.add(merged);
  return group;
}
