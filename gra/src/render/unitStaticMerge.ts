import * as THREE from 'three';

/**
 * unitStaticMerge.ts — R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1 (wariant B, decyzja właściciela 2026-11-07).
 *
 * Żeton jednostki z `buildUnitModel` to 20–100 osobnych meshy (każdy = Object3D + draw call), choć na mapie
 * ŻADNA część figurki nie jest animowana: ruch, atak i stanie przesuwają/obracają wyłącznie KORZEŃ żetonu
 * (`UnitRenderer.setTokenWorldPosition`). Tu, raz przy rejestracji żetonu, statyczne części o tym samym
 * (już wspólnym — `MaterialContentPool`) materiale i zgodnym stanie rysowania są scalane w JEDEN mesh
 * (wierzchołki przeliczone do układu korzenia, `mergeTransformed`). Scaloną geometrię współdzieli potem
 * `GeometryContentPool` (identyczne typy żetonów → jedna instancja).
 *
 * Czego NIE scalamy (zostaje osobnym meshem jak dotąd): części przezroczyste (sortowanie wg głębi), z dziećmi,
 * z tablicą materiałów, Instanced/Skinned, niewidoczne (także przez przodka), z `userData` (znaczniki trafień,
 * `noSmallPartLod`), pod poddrzewem `unitStatPlate`/ze znacznikiem, z własnym `onBeforeRender`, z nietypową
 * warstwą (`layers`), z ujemnym wyznacznikiem macierzy (lustro), z atrybutami morph/przeplatanymi albo
 * niestandardowym `drawRange`. Nakładki (tabliczka, odznaki, gwiazdki, pierścienie właściciela) dochodzą do
 * żetonu PO scaleniu albo są przezroczyste — nie są ruszane.
 *
 * LOD drobnych części (`SmallPartLod`) po scaleniu: części w scalonej geometrii są ułożone MALEJĄCO wg
 * średnicy (w układzie korzenia, z iloczynem skal przodków — dokładnie ta liczba, którą `SmallPartLod`
 * liczył dla osobnego meshu). Dla każdego scalonego meshu trzymamy tablicę średnic i końców zakresów, więc
 * „schowaj części o rzucie < N px” = rysuj tylko PREFIKS geometrii (`drawRange` ustawiany na czas rysowania
 * tego jednego meshu w `onBeforeRender`, przywracany w `onAfterRender` — raycast/picking i inne żetony
 * dzielące geometrię widzą pełny zakres). Zestaw chowanych części jest więc ten sam co przed scaleniem,
 * bez dodatkowych draw calli.
 */

/** Tablica LOD scalonego meshu: średnice części (malejąco) i końce ich zakresów (indeksy albo wierzchołki). */
export interface MergedPartLod {
  readonly diam: Float64Array;
  readonly ends: Uint32Array;
}

/** Pole na meshu: liczba elementów do narysowania (undefined = całość). Własne pole — bez `userData`. */
interface LodDrawTagged { __lodDrawCount?: number }

const partLodOf = new WeakMap<THREE.Object3D, MergedPartLod>();

/** Tablica LOD scalonego meshu albo undefined (mesh zwykły). */
export function getMergedPartLod(o: THREE.Object3D): MergedPartLod | undefined {
  return partLodOf.get(o);
}

/**
 * Ustawia, ile pierwszych części scalonego meshu ma być rysowanych (`parts` = nParts albo więcej → całość).
 * Zwraca true, gdy mesh rysuje mniej niż całość.
 */
export function setMergedPartsDrawn(mesh: THREE.Object3D, parts: number): boolean {
  const lod = partLodOf.get(mesh);
  if (!lod) return false;
  const t = mesh as unknown as LodDrawTagged;
  if (parts >= lod.ends.length) { t.__lodDrawCount = undefined; return false; }
  t.__lodDrawCount = parts <= 0 ? 0 : (lod.ends[parts - 1] as number);
  return true;
}

function lodBeforeRender(this: THREE.Object3D, _r: unknown, _s: unknown, _c: unknown, geometry: THREE.BufferGeometry): void {
  const n = (this as unknown as LodDrawTagged).__lodDrawCount;
  if (n !== undefined) geometry.setDrawRange(0, n);
}

function lodAfterRender(this: THREE.Object3D, _r: unknown, _s: unknown, _c: unknown, geometry: THREE.BufferGeometry): void {
  if ((this as unknown as LodDrawTagged).__lodDrawCount !== undefined) geometry.setDrawRange(0, Infinity);
}

/** Znacznik sortowania z `MaterialContentPool` (id materiału sprzed puli). */
interface SortTagged { __msId?: number; __msMat?: THREE.Material }

const DEFAULT_BEFORE_RENDER = THREE.Object3D.prototype.onBeforeRender;

function isPlainAttr(a: unknown): boolean {
  const x = a as { isBufferAttribute?: boolean; isInterleavedBufferAttribute?: boolean } | undefined;
  return !!x && x.isBufferAttribute === true && x.isInterleavedBufferAttribute !== true;
}

function geometrySignature(g: THREE.BufferGeometry): string | null {
  if (Object.keys(g.morphAttributes).length > 0) return null;
  if (g.drawRange.start !== 0 || g.drawRange.count !== Infinity) return null;
  const names = Object.keys(g.attributes).sort();
  if (!names.includes('position')) return null;
  const parts: string[] = [];
  for (const n of names) {
    const a = g.attributes[n];
    if (!isPlainAttr(a)) return null;
    const b = a as THREE.BufferAttribute;
    // atrybuty przeliczane macierzą: tylko Float32 bez normalizacji (dokładnie jak `applyMatrix4` three.js)
    if ((n === 'position' || n === 'normal' || n === 'tangent') && (!(b.array instanceof Float32Array) || b.normalized)) return null;
    parts.push(`${n}:${b.itemSize}:${(b.array as { constructor: { name: string } }).constructor.name}:${b.normalized ? 1 : 0}`);
  }
  if (g.index) {
    if (!isPlainAttr(g.index)) return null;
    parts.push('I:' + (g.index.array as { constructor: { name: string } }).constructor.name);
  } else parts.push('N');
  return parts.join(',');
}

const _v = new THREE.Vector3();
const _nm = new THREE.Matrix3();

/**
 * Scala geometrie części (ten sam podpis atrybutów) w jedną, z wierzchołkami przeliczonymi macierzą `rel` każdej
 * części — te same operacje co `BufferGeometry.clone().applyMatrix4(rel)` + `mergeGeometries` (pozycja:
 * `Vector3.applyMatrix4`, normalna: `applyNormalMatrix`, tangens: `transformDirection`), ale bez klonowania
 * (klon `BoxGeometry` itp. najpierw buduje domyślną bryłę — to był główny koszt tworzenia żetonu).
 */
function mergeTransformed(list: ReadonlyArray<{ mesh: THREE.Mesh; rel: THREE.Matrix4 }>): THREE.BufferGeometry {
  const g0 = list[0]!.mesh.geometry as THREE.BufferGeometry;
  const names = Object.keys(g0.attributes);
  let nVert = 0;
  let nIdx = 0;
  for (const { mesh } of list) {
    const g = mesh.geometry as THREE.BufferGeometry;
    nVert += g.attributes['position']!.count;
    if (g.index) nIdx += g.index.count;
  }
  const out = new THREE.BufferGeometry();
  for (const n of names) {
    const a0 = g0.attributes[n] as THREE.BufferAttribute;
    const isz = a0.itemSize;
    const Ctor = (a0.array as unknown as { constructor: new (len: number) => THREE.TypedArray }).constructor;
    const arr = new Ctor(nVert * isz);
    let off = 0;
    for (const { mesh, rel } of list) {
      const a = (mesh.geometry as THREE.BufferGeometry).attributes[n] as THREE.BufferAttribute;
      const src = a.array as THREE.TypedArray;
      const cnt = a.count;
      if (n === 'position') {
        for (let i = 0; i < cnt; i++) {
          _v.set(src[i * 3]!, src[i * 3 + 1]!, src[i * 3 + 2]!).applyMatrix4(rel);
          arr[off + i * 3] = _v.x; arr[off + i * 3 + 1] = _v.y; arr[off + i * 3 + 2] = _v.z;
        }
      } else if (n === 'normal') {
        _nm.getNormalMatrix(rel);
        for (let i = 0; i < cnt; i++) {
          _v.set(src[i * 3]!, src[i * 3 + 1]!, src[i * 3 + 2]!).applyNormalMatrix(_nm);
          arr[off + i * 3] = _v.x; arr[off + i * 3 + 1] = _v.y; arr[off + i * 3 + 2] = _v.z;
        }
      } else if (n === 'tangent') {
        for (let i = 0; i < cnt; i++) {
          _v.set(src[i * isz]!, src[i * isz + 1]!, src[i * isz + 2]!).transformDirection(rel);
          arr[off + i * isz] = _v.x; arr[off + i * isz + 1] = _v.y; arr[off + i * isz + 2] = _v.z;
          for (let k = 3; k < isz; k++) arr[off + i * isz + k] = src[i * isz + k]!;
        }
      } else {
        arr.set(src.subarray(0, cnt * isz), off);
      }
      off += cnt * isz;
    }
    out.setAttribute(n, new THREE.BufferAttribute(arr, isz, a0.normalized));
  }
  if (g0.index) {
    const idx = nVert > 65535 ? new Uint32Array(nIdx) : new Uint16Array(nIdx);
    let o = 0;
    let base = 0;
    for (const { mesh } of list) {
      const g = mesh.geometry as THREE.BufferGeometry;
      const src = g.index!.array;
      for (let i = 0; i < g.index!.count; i++) idx[o++] = (src[i] as number) + base;
      base += g.attributes['position']!.count;
    }
    out.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  return out;
}

function maxAbsScale(o: THREE.Object3D): number {
  return Math.max(Math.abs(o.scale.x), Math.abs(o.scale.y), Math.abs(o.scale.z));
}

interface Part {
  mesh: THREE.Mesh;
  rel: THREE.Matrix4;
  diam: number;
  order: number;
}

export interface UnitStaticMergeResult {
  meshesBefore: number;
  meshesAfter: number;
  /** Nowe scalone geometrie (dopisane też do `ownedGeos`). */
  merged: THREE.BufferGeometry[];
}

/**
 * Scala statyczne części żetonu `root` (W MIEJSCU). `ownedGeos` = `userData['perTokenGeos']` żetonu:
 * geometrie własne, których po scaleniu nie używa już żaden mesh drzewa, są z niej usuwane i zwalniane
 * (nigdy nie trafiły do GPU), a scalone geometrie są do niej dopisywane (zwalnia je `GeometryContentPool`).
 * Wołać PO `MaterialContentPool.poolOwned` (klucz kubełka = wspólny materiał), PRZED `GeometryContentPool.poolOwned`.
 */
export function mergeUnitStaticParts(root: THREE.Object3D, ownedGeos: THREE.BufferGeometry[]): UnitStaticMergeResult {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<string, Part[]>();
  let meshesBefore = 0;
  let order = 0;

  const visit = (o: THREE.Object3D, chainScale: number, blocked: boolean): void => {
    const isRoot = o === root;
    // nakładki ze znacznikiem: nie scalamy niczego w ich poddrzewie
    const flagged = !isRoot && (o.name === 'unitStatPlate' || Object.keys(o.userData).length > 0);
    const hidden = !isRoot && !o.visible;
    const sc = isRoot ? 1 : chainScale * maxAbsScale(o);
    const blk = blocked || flagged || hidden || (!isRoot && o.layers.mask !== root.layers.mask);
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      meshesBefore++;
      if (!blk && !isRoot) tryAdd(m, sc);
    }
    for (const c of o.children) visit(c, sc, blk);
  };

  const tryAdd = (m: THREE.Mesh, sc: number): void => {
    if ((m as unknown as THREE.InstancedMesh).isInstancedMesh || (m as unknown as THREE.SkinnedMesh).isSkinnedMesh) return;
    if (m.children.length > 0 || Array.isArray(m.material) || !m.material) return;
    if (m.onBeforeRender !== DEFAULT_BEFORE_RENDER) return;
    const mat = m.material as THREE.Material;
    if (mat.transparent) return;
    const g = m.geometry as THREE.BufferGeometry;
    const sig = geometrySignature(g);
    if (sig === null) return;
    const rel = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    if (!(rel.determinant() > 0)) return;
    if (!g.boundingSphere) g.computeBoundingSphere();
    const r = g.boundingSphere?.radius ?? 0;
    const key = `${mat.id}|${m.renderOrder}|${m.castShadow ? 1 : 0}${m.receiveShadow ? 1 : 0}${m.frustumCulled ? 1 : 0}|${sig}`;
    let b = buckets.get(key);
    if (!b) { b = []; buckets.set(key, b); }
    b.push({ mesh: m, rel, diam: r * 2 * sc, order: order++ });
  };

  visit(root, 1, false);

  const merged: THREE.BufferGeometry[] = [];
  const mergedAway = new Set<THREE.BufferGeometry>();
  const wasOwned = new Set(ownedGeos);
  let removed = 0;
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    // malejąco wg średnicy (prefiks = największe części), remisy w kolejności drzewa
    list.sort((a, b) => (b.diam - a.diam) || (a.order - b.order));
    const geo = mergeTransformed(list);
    const diam = new Float64Array(list.length);
    const ends = new Uint32Array(list.length);
    let acc = 0;
    for (let i = 0; i < list.length; i++) {
      const g = list[i]!.mesh.geometry as THREE.BufferGeometry;
      acc += g.index ? g.index.count : g.attributes['position']!.count;
      ends[i] = acc;
      diam[i] = list[i]!.diam;
    }
    // reprezentant stanu rysowania: pierwszy w kolejności drzewa
    let first = list[0]!;
    for (const p of list) if (p.order < first.order) first = p;
    const fm = first.mesh;
    const mesh = new THREE.Mesh(geo, fm.material);
    mesh.renderOrder = fm.renderOrder;
    mesh.castShadow = fm.castShadow;
    mesh.receiveShadow = fm.receiveShadow;
    mesh.frustumCulled = fm.frustumCulled;
    const ft = fm as unknown as SortTagged;
    if (ft.__msMat === fm.material && ft.__msId !== undefined) {
      (mesh as unknown as SortTagged).__msId = ft.__msId;
      (mesh as unknown as SortTagged).__msMat = ft.__msMat;
    }
    mesh.onBeforeRender = lodBeforeRender as unknown as THREE.Object3D['onBeforeRender'];
    mesh.onAfterRender = lodAfterRender as unknown as THREE.Object3D['onAfterRender'];
    partLodOf.set(mesh, { diam, ends });
    for (const { mesh: part } of list) { part.parent?.remove(part); removed++; mergedAway.add(part.geometry as THREE.BufferGeometry); }
    root.add(mesh);
    merged.push(geo);
  }

  if (merged.length > 0) {
    // puste grupy pośrednie (bez znaczników) po wyjęciu części
    const prune = (o: THREE.Object3D): void => {
      for (const c of [...o.children]) {
        prune(c);
        if (c.children.length === 0 && (c.type === 'Group' || c.type === 'Object3D') && Object.keys(c.userData).length === 0) o.remove(c);
      }
    };
    prune(root);
    // geometrie własne, których nie używa już żaden mesh → zwolnij (nigdy nie wysłane do GPU)
    // (tylko te, których używały wyjęte części — reszty tablicy nie ruszamy)
    const used = new Set<THREE.BufferGeometry>();
    root.traverse((o) => { const mm = o as THREE.Mesh; if (mm.isMesh && mm.geometry) used.add(mm.geometry as THREE.BufferGeometry); });
    const gone = new Set<THREE.BufferGeometry>();
    for (const g of mergedAway) if (!used.has(g)) gone.add(g);
    let w = 0;
    for (let i = 0; i < ownedGeos.length; i++) {
      const g = ownedGeos[i]!;
      if (!gone.has(g)) ownedGeos[w++] = g;
    }
    ownedGeos.length = w;
    const ownedSet = new Set(ownedGeos);
    for (const g of gone) if (!ownedSet.has(g) && wasOwned.has(g)) g.dispose();
    for (const g of merged) ownedGeos.push(g);
  }

  return { meshesBefore, meshesAfter: meshesBefore - removed + merged.length, merged };
}
