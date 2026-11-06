import * as THREE from 'three';

/**
 * R-WEB-MEMORY-STATIC-FOOTPRINT-Q1 — wspólne geometrie modeli jednostek i miast.
 *
 * Buildery modeli (`buildUnitModel`, `buildSettlementModel`, `buildMiasto*`) tworzą przy KAŻDYM wywołaniu
 * świeże `BoxGeometry`/`CylinderGeometry`/…, więc 450 jednostek tego samego typu trzyma 450 kopii tych samych
 * buforów wierzchołków (CPU: obiekty BufferGeometry/BufferAttribute + tablice; GPU: osobne bufory).
 * Ta pula zamienia geometrię należącą do modelu na JEDNĄ wspólną instancję o bitowo identycznej treści
 * (atrybuty, indeks, grupy, zakres rysowania), z licznikiem odwołań. Treść jest ta sama co do bitu, więc obraz,
 * raycast (picking) i bryły otaczające są identyczne. Materiały NIE są współdzielone — są mutowane per model
 * (przyciemnienie odroczenia, przebarwienia, mgła).
 *
 * Zakres puli (obrona r1, zarzut Z6): pula NIE jest globalna dla modułu — każdy `UnitRenderer`/`CityRenderer`
 * ma WŁASNĄ instancję `GeometryContentPool`. `main.ts` przy nowej grze / wczytaniu / playtestach podmienia
 * renderery bez wołania `dispose()` na starych; gdy stary renderer staje się nieosiągalny, jego pula (Mapa
 * kluczy treści z kanonicznymi geometriami) staje się nieosiągalna razem z nim — dokładnie jak przed zmianą,
 * kiedy geometrie żetonów żyły wyłącznie w drzewie i mapach starego renderera. Globalna Mapa przypinałaby je
 * (i ich tablice CPU) na cały czas życia strony.
 *
 * Kontrakt: `pool.poolOwned(root, owned)` zamienia W MIEJSCU elementy tablicy `owned` (ta sama tablica
 * siedzi w `userData['perTokenGeos']`/`['perCityGeos']` i w mapach rendererów; późniejsze `push` do niej
 * nadal działają) i podmienia `mesh.geometry` w drzewie `root`. Zwolnienie: `pool.release(owned)`
 * zamiast `g.dispose()` — wspólna geometria jest zwalniana dopiero po ostatnim odwołaniu, niewspólna od razu.
 * Geometrii, której drzewo nie używa (albo która ma `userData`, atrybuty morph lub nazwę), pula nie dotyka.
 */

interface PoolEntry {
  geo: THREE.BufferGeometry;
  refs: number;
  key: string;
}

type AnyArray = ArrayLike<number> & { buffer: ArrayBufferLike; byteOffset: number; byteLength: number; constructor: unknown };

function u32View(arr: AnyArray): Uint32Array | Uint8Array {
  if (arr.byteOffset % 4 === 0 && arr.byteLength % 4 === 0) return new Uint32Array(arr.buffer, arr.byteOffset, arr.byteLength / 4);
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}

function hashArray(h: number, arr: AnyArray): number {
  const v = u32View(arr);
  for (let i = 0; i < v.length; i++) h = Math.imul(h ^ (v[i] as number), 16777619) >>> 0;
  return h;
}

function attrSig(a: THREE.BufferAttribute): string {
  return `${(a.array as { constructor: { name: string } }).constructor.name}:${a.itemSize}:${a.count}:${a.normalized ? 1 : 0}`;
}

function isPlainAttr(a: unknown): a is THREE.BufferAttribute {
  const x = a as THREE.BufferAttribute & { isInterleavedBufferAttribute?: boolean };
  return !!x && (x as { isBufferAttribute?: boolean }).isBufferAttribute === true && x.isInterleavedBufferAttribute !== true;
}

/** Klucz treści albo null, gdy geometrii nie wolno współdzielić. */
function contentKey(geo: THREE.BufferGeometry): string | null {
  if (geo.name !== '' || Object.keys(geo.userData).length > 0) return null;
  if (Object.keys(geo.morphAttributes).length > 0) return null;
  const names = Object.keys(geo.attributes).sort();
  let h = 2166136261;
  const parts: string[] = [];
  for (const n of names) {
    const a = geo.attributes[n];
    if (!isPlainAttr(a)) return null;
    parts.push(n + '=' + attrSig(a));
    h = hashArray(h, a.array as unknown as AnyArray);
  }
  const idx = geo.index;
  if (idx) {
    if (!isPlainAttr(idx)) return null;
    parts.push('i=' + attrSig(idx));
    h = hashArray(h, idx.array as unknown as AnyArray);
  }
  const groups = geo.groups.map((g) => `${g.start},${g.count},${g.materialIndex ?? ''}`).join(';');
  const dr = geo.drawRange;
  return `${geo.type}|${parts.join('|')}|g${groups}|d${dr.start},${dr.count}|h${h.toString(36)}`;
}

function sameArray(a: AnyArray, b: AnyArray): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const va = u32View(a);
  const vb = u32View(b);
  if (va.length !== vb.length) return false;
  for (let i = 0; i < va.length; i++) if (va[i] !== vb[i]) return false;
  return true;
}

function sameContent(a: THREE.BufferGeometry, b: THREE.BufferGeometry): boolean {
  for (const n of Object.keys(a.attributes)) {
    const x = a.attributes[n] as THREE.BufferAttribute;
    const y = b.attributes[n] as THREE.BufferAttribute | undefined;
    if (!y || !sameArray(x.array as unknown as AnyArray, y.array as unknown as AnyArray)) return false;
  }
  if (!!a.index !== !!b.index) return false;
  if (a.index && b.index && !sameArray(a.index.array as unknown as AnyArray, b.index.array as unknown as AnyArray)) return false;
  return true;
}

export class GeometryContentPool {
  private readonly pool = new Map<string, PoolEntry[]>();
  private readonly entryOf = new WeakMap<THREE.BufferGeometry, PoolEntry>();

  /** Wspólna instancja dla `geo` (+1 odwołanie) albo null, gdy `geo` nie nadaje się do puli. */
  private acquire(geo: THREE.BufferGeometry): THREE.BufferGeometry | null {
    const pool = this.pool;
    const entryOf = this.entryOf;
    const own = entryOf.get(geo);
    if (own) { own.refs++; return own.geo; }
    const key = contentKey(geo);
    if (key === null) return null;
    const list = pool.get(key);
    if (list) {
      for (const e of list) {
        if (sameContent(e.geo, geo)) { e.refs++; return e.geo; }
      }
    }
    const entry: PoolEntry = { geo, refs: 1, key };
    entryOf.set(geo, entry);
    if (list) list.push(entry); else pool.set(key, [entry]);
    return geo;
  }

  /**
   * Podmienia geometrie modelu `root` należące do `owned` na wspólne instancje z puli (w miejscu, w tablicy
   * `owned` i w `mesh.geometry`). Duplikaty (nigdy jeszcze niewysłane do GPU) są zwalniane od razu.
   */
  poolOwned(root: THREE.Object3D, owned: THREE.BufferGeometry[]): void {
    if (owned.length === 0) return;
    const entryOf = this.entryOf;
    const users = new Map<THREE.BufferGeometry, Array<THREE.Mesh>>();
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      const g = m.geometry as THREE.BufferGeometry | undefined;
      if (!g || !(m as { isMesh?: boolean }).isMesh) return;
      let arr = users.get(g);
      if (!arr) { arr = []; users.set(g, arr); }
      arr.push(m);
    });
    const canonOf = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
    for (let i = 0; i < owned.length; i++) {
      const g = owned[i] as THREE.BufferGeometry;
      // Geometria spoza drzewa (np. dopisana do tablicy, ale nieużyta) — zostaje własnością modelu.
      if (!users.has(g) && !entryOf.has(g)) continue;
      const c = this.acquire(g);
      if (c === null) continue;
      owned[i] = c;
      if (c !== g) canonOf.set(g, c);
    }
    for (const [g, c] of canonOf) {
      for (const m of users.get(g) ?? []) m.geometry = c;
      if (!entryOf.has(g)) g.dispose();
    }
  }

  /** Zwalnia geometrie modelu: wspólne — po ostatnim odwołaniu, pozostałe — od razu (jak dotąd `dispose()`). */
  release(owned: Iterable<THREE.BufferGeometry>): void {
    const pool = this.pool;
    const entryOf = this.entryOf;
    for (const g of owned) {
      const e = entryOf.get(g);
      if (!e) { g.dispose(); continue; }
      if (--e.refs > 0) continue;
      const list = pool.get(e.key);
      if (list) {
        const i = list.indexOf(e);
        if (i >= 0) list.splice(i, 1);
        if (list.length === 0) pool.delete(e.key);
      }
      entryOf.delete(g);
      g.dispose();
    }
  }

  /** Diagnostyka/testy: liczba wspólnych geometrii i suma odwołań. */
  stats(): { shared: number; refs: number } {
    const pool = this.pool;
    let shared = 0;
    let refs = 0;
    for (const list of pool.values()) for (const e of list) { shared++; refs += e.refs; }
    return { shared, refs };
  }
}
