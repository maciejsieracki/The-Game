import * as THREE from 'three';

/**
 * R-WEB-MEMORY-SHARED-MATERIALS-UNIT-MERGE-Q1 — wspólne materiały modeli jednostek i miast (para do
 * `GeometryContentPool`), BEZ zmiany kolejności rysowania.
 *
 * Każdy żeton jednostki ma ~17 własnych `MeshStandardMaterial` (fabryka `makeMatFactory`, buildery „opus5”,
 * pierścienie właściciela), a materiał three.js to duży obiekt (kolory, kilkadziesiąt pól). Pula zamienia
 * materiał należący do modelu na JEDNĄ wspólną instancję o identycznym stanie (typ + WSZYSTKIE własne pola
 * obiektu poza tożsamością: `uuid`, `id`, `name`, `version`, nasłuchiwacze), z licznikiem odwołań.
 *
 * Kolejność rysowania (powód odrzucenia w R-WEB-MEMORY-STATIC-FOOTPRINT-Q1: 51 px z 1,6 mln): three.js sortuje
 * nieprzezroczyste obiekty `painterSortStable` = groupOrder → renderOrder → `material.id` → z → `object.id`.
 * Wspólny materiał ma id PIERWSZEGO modelu, więc współpłaszczyznowe ściany rozstrzygały się inaczej. Dlatego
 * mesh, któremu pula podmieniła materiał, zapamiętuje id swojego DAWNEGO materiału (`__msId`, ważne tylko
 * dopóki `mesh.material === __msMat`), a `pooledMaterialOpaqueSort` (instalowany na rendererze mapy przez
 * `renderer.setOpaqueSort`) porównuje dokładnie tak jak `painterSortStable`, tylko z tym zapamiętanym id.
 * Kolejność wywołań rysowania jest więc identyczna jak bez puli → obraz bitowo ten sam
 * (`gra/tools/memory-static-material-pool-pixel-test.cjs`). Obiekty bez znacznika sortują się jak dotąd.
 *
 * Do puli NIE trafia materiał z teksturą, z `userData`, z nazwą, z własną funkcją (`onBeforeCompile` itp.),
 * z niepustą tablicą (np. `clippingPlanes`), z polem obiektowym nieznanego rodzaju ani materiał użyty przez
 * mesh z TABLICĄ materiałów — zostaje własnością modelu jak dotąd.
 *
 * Mutacja materiału po rejestracji (przyciemnienie okna odroczenia w UnitRenderer) MUSI najpierw wywołać
 * `unshare(root, owned)` — kopia przy zapisie (prywatny klon, znacznik sortowania przechodzi na klon).
 *
 * Zakres jak `GeometryContentPool`: instancja na renderer (nie globalna dla modułu).
 */

interface MatEntry {
  mat: THREE.Material;
  refs: number;
  key: string;
}

/** Znacznik sortowania na meshu (własne pola, bez `userData`). */
interface SortTagged {
  __msId?: number;
  __msMat?: THREE.Material;
}

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

/** Id materiału, którym mesh sortowałby się bez puli. */
function sortMaterialId(item: THREE.RenderItem): number {
  const o = item.object as unknown as SortTagged;
  const mat = item.material;
  return o.__msMat === mat && o.__msId !== undefined ? o.__msId : mat.id;
}

/**
 * Dokładna kopia `painterSortStable` z three.js r169 (WebGLRenderLists), z `material.id` zastąpionym
 * przez id sprzed puli. Dla obiektów bez znacznika — identyczna z domyślną.
 */
export function pooledMaterialOpaqueSort(a: THREE.RenderItem, b: THREE.RenderItem): number {
  if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder;
  if (a.renderOrder !== b.renderOrder) return a.renderOrder - b.renderOrder;
  const ma = sortMaterialId(a);
  const mb = sortMaterialId(b);
  if (ma !== mb) return ma - mb;
  if (a.z !== b.z) return a.z - b.z;
  return a.id - b.id;
}

function forEachMesh(root: THREE.Object3D, fn: (mesh: THREE.Mesh) => void): void {
  root.traverse((o) => { if ((o as { isMesh?: boolean }).isMesh) fn(o as THREE.Mesh); });
}

export class MaterialContentPool {
  private readonly pool = new Map<string, MatEntry>();
  private readonly entryOf = new WeakMap<THREE.Material, MatEntry>();

  private acquire(m: THREE.Material): THREE.Material | null {
    const own = this.entryOf.get(m);
    if (own) { own.refs++; return own.mat; }
    const key = materialKey(m);
    if (key === null) return null;
    const e = this.pool.get(key);
    if (e) { e.refs++; return e.mat; }
    const entry: MatEntry = { mat: m, refs: 1, key };
    this.entryOf.set(m, entry);
    this.pool.set(key, entry);
    return m;
  }

  private releaseOne(m: THREE.Material): void {
    const e = this.entryOf.get(m);
    if (!e) { m.dispose(); return; }
    if (--e.refs > 0) return;
    if (this.pool.get(e.key) === e) this.pool.delete(e.key);
    this.entryOf.delete(m);
    m.dispose();
  }

  /**
   * Podmienia materiały modelu `root` należące do `owned` na wspólne instancje z puli (w miejscu: w tablicy
   * `owned` i w `mesh.material`), zapisując na meshu id dawnego materiału dla `pooledMaterialOpaqueSort`.
   * Duplikaty są zwalniane od razu (nigdy jeszcze nie renderowane).
   */
  poolOwned(root: THREE.Object3D, owned: THREE.Material[]): void {
    if (owned.length === 0) return;
    const entryOf = this.entryOf;
    const used = new Set<THREE.Material>();
    const inArray = new Set<THREE.Material>();
    forEachMesh(root, (mesh) => {
      if (Array.isArray(mesh.material)) for (const x of mesh.material) inArray.add(x);
      else if (mesh.material) used.add(mesh.material);
    });
    const canonOf = new Map<THREE.Material, THREE.Material>();
    for (let i = 0; i < owned.length; i++) {
      const m = owned[i] as THREE.Material;
      if (inArray.has(m)) continue;
      if (!used.has(m) && !entryOf.has(m)) continue;
      const prev = canonOf.get(m);
      if (prev) { const e = entryOf.get(prev); if (e) e.refs++; owned[i] = prev; continue; }
      const c = this.acquire(m);
      if (c === null) continue;
      owned[i] = c;
      canonOf.set(m, c);
    }
    forEachMesh(root, (mesh) => {
      if (Array.isArray(mesh.material)) return;
      const old = mesh.material;
      const c = canonOf.get(old);
      if (!c || c === old) return;
      const t = mesh as unknown as SortTagged;
      if (t.__msMat !== old || t.__msId === undefined) t.__msId = old.id;
      t.__msMat = c;
      mesh.material = c;
    });
    for (const [m, c] of canonOf) if (c !== m && !entryOf.has(m)) m.dispose();
  }

  /** Zwalnia materiały modelu: wspólne — po ostatnim odwołaniu, pozostałe — od razu (jak dotąd `dispose()`). */
  release(owned: Iterable<THREE.Material>): void {
    for (const m of owned) this.releaseOne(m);
  }

  /**
   * Kopia przy zapisie: wspólne materiały modelu → prywatne klony (w `owned` i w `mesh.material`), żeby mutacja
   * (przezroczystość, kolor) nie przeszła na inne modele. Znacznik sortowania przechodzi na klon (ten sam
   * porządek rysowania co bez puli). Idempotentne.
   */
  unshare(root: THREE.Object3D, owned: THREE.Material[]): void {
    const cloneOf = new Map<THREE.Material, THREE.Material>();
    for (let i = 0; i < owned.length; i++) {
      const m = owned[i] as THREE.Material;
      if (!this.entryOf.has(m)) continue;
      let c = cloneOf.get(m);
      if (!c) { c = m.clone(); cloneOf.set(m, c); }
      owned[i] = c;
      this.releaseOne(m);
    }
    if (cloneOf.size === 0) return;
    forEachMesh(root, (mesh) => {
      if (Array.isArray(mesh.material)) return;
      const old = mesh.material;
      const c = cloneOf.get(old);
      if (!c) return;
      const t = mesh as unknown as SortTagged;
      t.__msId = t.__msMat === old && t.__msId !== undefined ? t.__msId : old.id;
      t.__msMat = c;
      mesh.material = c;
    });
  }

  /** Diagnostyka/testy: liczba wspólnych materiałów i suma odwołań. */
  stats(): { shared: number; refs: number } {
    let refs = 0;
    for (const e of this.pool.values()) refs += e.refs;
    return { shared: this.pool.size, refs };
  }
}
