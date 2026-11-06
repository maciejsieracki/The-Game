import * as THREE from 'three';

/**
 * R-WEB-MEMORY-STATIC-FOOTPRINT-Q1 — wspólne materiały modeli jednostek i miast (para do geometryContentPool).
 *
 * Każdy żeton jednostki ma ~17 własnych `MeshStandardMaterial` (fabryka `makeMatFactory` i buildery „opus5”),
 * a materiał three.js to duży obiekt (kolory, wektory, kilkadziesiąt pól). Ta pula zamienia materiał należący
 * do modelu na jedną wspólną instancję o identycznym stanie (typ + WSZYSTKIE własne pola obiektu poza
 * tożsamością: `uuid`, `id`, `name`, `version`, nasłuchiwacze), z licznikiem odwołań. Stan jest ten sam co do
 * bitu, więc shader, kolor i przezroczystość są identyczne.
 *
 * Do puli NIE trafia materiał z teksturą, z `userData`, z nazwą, z własnym `onBeforeCompile`/funkcją, z tablicą
 * (np. `clippingPlanes`) ani z polem obiektowym nieznanego rodzaju — zostaje własnością modelu jak dotąd.
 *
 * Mutacja materiału po rejestracji (np. przyciemnienie okna odroczenia w UnitRenderer) MUSI najpierw wywołać
 * `unshareMaterials(root, owned)` — zamienia wspólne materiały modelu na prywatne klony (kopia przy zapisie),
 * żeby zmiana nie przeszła na inne modele.
 */

interface MatEntry {
  mat: THREE.Material;
  refs: number;
  key: string;
}

const pool = new Map<string, MatEntry>();
const entryOf = new WeakMap<THREE.Material, MatEntry>();
const SKIP = new Set(['uuid', 'id', 'name', 'version', '_listeners', 'userData']);

function valueKey(v: unknown): string | null {
  if (v === null) return 'null';
  const t = typeof v;
  if (t === 'number') return Object.is(v, -0) ? '-0' : String(v);
  if (t === 'string') return JSON.stringify(v);
  if (t === 'boolean' || t === 'undefined') return String(v);
  if (t !== 'object') return null; // funkcja itp.
  const o = v as { isColor?: boolean; isVector2?: boolean; isVector3?: boolean; isVector4?: boolean; isEuler?: boolean; isTexture?: boolean };
  if (o.isTexture) return null;
  if (o.isColor) { const c = v as THREE.Color; return `C${c.r},${c.g},${c.b}`; }
  if (o.isVector2 || o.isVector3 || o.isVector4) return 'V' + (v as THREE.Vector3).toArray().join(',');
  if (o.isEuler) { const e = v as THREE.Euler; return `E${e.x},${e.y},${e.z},${e.order}`; }
  if (Array.isArray(v)) return v.length === 0 ? '[]' : null;
  if (Object.getPrototypeOf(v) === Object.prototype) {
    const parts: string[] = [];
    for (const k of Object.keys(v as object).sort()) {
      const s = valueKey((v as Record<string, unknown>)[k]);
      if (s === null) return null;
      parts.push(k + ':' + s);
    }
    return '{' + parts.join(';') + '}';
  }
  return null;
}

/** Klucz stanu materiału albo null, gdy nie wolno go współdzielić. */
function materialKey(m: THREE.Material): string | null {
  if (m.name !== '' || Object.keys(m.userData).length > 0) return null;
  const parts: string[] = [m.type];
  for (const k of Object.keys(m).sort()) {
    if (SKIP.has(k)) continue;
    const s = valueKey((m as unknown as Record<string, unknown>)[k]);
    if (s === null) return null;
    parts.push(k + '=' + s);
  }
  return parts.join('|');
}

function acquire(m: THREE.Material): THREE.Material | null {
  const own = entryOf.get(m);
  if (own) { own.refs++; return own.mat; }
  const key = materialKey(m);
  if (key === null) return null;
  const e = pool.get(key);
  if (e) { e.refs++; return e.mat; }
  const entry: MatEntry = { mat: m, refs: 1, key };
  entryOf.set(m, entry);
  pool.set(key, entry);
  return m;
}

function releaseOne(m: THREE.Material): void {
  const e = entryOf.get(m);
  if (!e) { m.dispose(); return; }
  if (--e.refs > 0) return;
  if (pool.get(e.key) === e) pool.delete(e.key);
  entryOf.delete(m);
  m.dispose();
}

function forEachMesh(root: THREE.Object3D, fn: (mesh: THREE.Mesh) => void): void {
  root.traverse((o) => { if ((o as { isMesh?: boolean }).isMesh) fn(o as THREE.Mesh); });
}

/**
 * Podmienia materiały modelu `root` należące do `owned` na wspólne instancje z puli (w miejscu: w tablicy
 * `owned` i w `mesh.material`). Duplikaty są zwalniane od razu (nigdy jeszcze nie renderowane).
 */
export function poolOwnedMaterials(root: THREE.Object3D, owned: THREE.Material[]): void {
  if (owned.length === 0) return;
  const used = new Set<THREE.Material>();
  forEachMesh(root, (mesh) => {
    if (Array.isArray(mesh.material)) for (const x of mesh.material) used.add(x); else if (mesh.material) used.add(mesh.material);
  });
  const canonOf = new Map<THREE.Material, THREE.Material>();
  for (let i = 0; i < owned.length; i++) {
    const m = owned[i] as THREE.Material;
    if (!used.has(m) && !entryOf.has(m)) continue;
    const prev = canonOf.get(m);
    if (prev) { const e = entryOf.get(prev); if (e) e.refs++; owned[i] = prev; continue; }
    const c = acquire(m);
    if (c === null) continue;
    owned[i] = c;
    canonOf.set(m, c);
  }
  forEachMesh(root, (mesh) => {
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((x) => canonOf.get(x) ?? x);
    else { const c = canonOf.get(mesh.material); if (c) mesh.material = c; }
  });
  for (const [m, c] of canonOf) if (c !== m && !entryOf.has(m)) m.dispose();
}

/** Zwalnia materiały modelu: wspólne — po ostatnim odwołaniu, pozostałe — od razu (jak dotąd `dispose()`). */
export function releaseOwnedMaterials(owned: Iterable<THREE.Material>): void {
  for (const m of owned) releaseOne(m);
}

/**
 * Kopia przy zapisie: wspólne materiały modelu → prywatne klony (w `owned` i w `mesh.material`), żeby mutacja
 * (przezroczystość, kolor) nie przeszła na inne modele. Idempotentne.
 */
export function unshareMaterials(root: THREE.Object3D, owned: THREE.Material[]): void {
  const cloneOf = new Map<THREE.Material, THREE.Material>();
  for (let i = 0; i < owned.length; i++) {
    const m = owned[i] as THREE.Material;
    if (!entryOf.has(m)) continue;
    let c = cloneOf.get(m);
    if (!c) { c = m.clone(); cloneOf.set(m, c); }
    owned[i] = c;
    releaseOne(m);
  }
  if (cloneOf.size === 0) return;
  forEachMesh(root, (mesh) => {
    if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((x) => cloneOf.get(x) ?? x);
    else { const c = cloneOf.get(mesh.material); if (c) mesh.material = c; }
  });
}

/** Diagnostyka/testy: liczba wspólnych materiałów i suma odwołań. */
export function materialPoolStats(): { shared: number; refs: number } {
  let refs = 0;
  for (const e of pool.values()) refs += e.refs;
  return { shared: pool.size, refs };
}
