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
/** userData flag — grupa już przeszła collapseToMergedMesh (R-SCENA-PERF: unikaj podwójnego merge). */
export const MERGED_DECOR_FLAG = 'civMergedDecor';

/** true gdy grupa ma już jeden mesh po collapse (nie wołaj merge ponownie). */
export function isAlreadyMergedDecor(group: THREE.Object3D): boolean {
  if (group.userData?.[MERGED_DECOR_FLAG] === true) return true;
  const only = group.children.length === 1 ? group.children[0] : null;
  if (!only || !(only as THREE.Mesh).isMesh) return false;
  const mat = (only as THREE.Mesh).material;
  const m0 = Array.isArray(mat) ? mat[0] : mat;
  return !!(m0 as THREE.MeshLambertMaterial | undefined)?.vertexColors;
}

/**
 * Buduje pojedynczy zmergowany mesh z wszystkich Mesh-dzieci grupy (w przestrzeni
 * LOKALNEJ grupy). flatShading = normalne liczone w shaderze, więc nie pieczemy normalnych.
 */
/** Macierz mesh w układzie grupy-root — bez pełnego updateMatrixWorld (O(głębokość), nie O(drzewo)). */
function meshMatrixInGroupSpace(mesh: THREE.Mesh, root: THREE.Object3D, out: THREE.Matrix4): void {
  out.identity();
  let o: THREE.Object3D | null = mesh;
  while (o && o !== root) {
    o.updateMatrix();
    out.premultiply(o.matrix);
    o = o.parent;
  }
}

/**
 * R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1: zamiana listy trójkątów bez indeksów (3 wierzchołki na trójkąt)
 * na wierzchołki unikalne + indeksy. Wierzchołki są „ten sam", gdy 6 liczb Float32 (xyz + rgb) jest
 * identycznych BIT W BIT — bez tolerancji, więc żaden trójkąt nie zmienia kształtu ani koloru.
 * Kolejność trójkątów zachowana (indeks i = i-ty wierzchołek wejścia). Gdy nic się nie powtarza,
 * zwraca wejście bez indeksu (index = null). Hash z otwartym adresowaniem na Uint32 (bez stringów —
 * merge woła się tysiące razy przy budowie mapy). / EN: dedupe bit-identical (pos,color) vertices.
 */
export function indexIdenticalVertices(
  positions: Float32Array,
  colors: Float32Array,
): { positions: Float32Array; colors: Float32Array; index: Uint16Array | Uint32Array | null } {
  const n = positions.length / 3;
  if (n === 0 || colors.length !== positions.length) return { positions, colors, index: null };
  const pb = new Uint32Array(positions.buffer, positions.byteOffset, positions.length);
  const cb = new Uint32Array(colors.buffer, colors.byteOffset, colors.length);
  let cap = 16; while (cap < n * 2) cap <<= 1;
  const mask = cap - 1;
  const table = new Int32Array(cap).fill(-1); // slot -> indeks unikalnego wierzchołka
  const firstSrc = new Uint32Array(n);        // unikalny -> pierwszy wierzchołek wejścia
  const remap = new Uint32Array(n);           // wierzchołek wejścia -> unikalny
  let unique = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    let h = Math.imul(pb[o]! ^ 0x9e3779b9, 0x85ebca6b);
    h = Math.imul(h ^ pb[o + 1]!, 0xc2b2ae35); h = Math.imul(h ^ pb[o + 2]!, 0x85ebca6b);
    h = Math.imul(h ^ cb[o]!, 0xc2b2ae35); h = Math.imul(h ^ cb[o + 1]!, 0x85ebca6b);
    h = Math.imul(h ^ cb[o + 2]!, 0xc2b2ae35); h ^= h >>> 15;
    let s = h & mask;
    for (;;) {
      const u = table[s]!;
      if (u < 0) { table[s] = unique; firstSrc[unique] = i; remap[i] = unique; unique++; break; }
      const q = firstSrc[u]! * 3;
      if (pb[q] === pb[o] && pb[q + 1] === pb[o + 1] && pb[q + 2] === pb[o + 2]
        && cb[q] === cb[o] && cb[q + 1] === cb[o + 1] && cb[q + 2] === cb[o + 2]) { remap[i] = u; break; }
      s = (s + 1) & mask;
    }
  }
  if (unique === n) return { positions, colors, index: null };
  const outP = new Float32Array(unique * 3); const outC = new Float32Array(unique * 3);
  for (let u = 0; u < unique; u++) {
    const src = firstSrc[u]! * 3; const dst = u * 3;
    outP[dst] = positions[src]!; outP[dst + 1] = positions[src + 1]!; outP[dst + 2] = positions[src + 2]!;
    outC[dst] = colors[src]!; outC[dst + 1] = colors[src + 1]!; outC[dst + 2] = colors[src + 2]!;
  }
  const index = unique <= 65535 ? new Uint16Array(n) : new Uint32Array(n);
  index.set(remap);
  return { positions: outP, colors: outC, index };
}

function buildMergedMesh(group: THREE.Object3D): THREE.Mesh {
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
    meshMatrixInGroupSpace(mesh, group, _m);
    const mat0 = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
      | THREE.MeshLambertMaterial
      | undefined;
    _c.copy(mat0?.color ?? WHITE);
    // Modele z WYPIECZONYMI vertex colors (teren-gory-wzgorza / tarasy / lasy — atrybut 'color')
    // zachowują własny kolor per-wierzchołek; reszta (solidne materiały) bierze mat.color jak dotąd.
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute | undefined;
    const push = (i: number): void => {
      _v.fromBufferAttribute(posAttr, i).applyMatrix4(_m);
      positions.push(_v.x, _v.y, _v.z);
      if (colAttr) colors.push(colAttr.getX(i), colAttr.getY(i), colAttr.getZ(i));
      else colors.push(_c.r, _c.g, _c.b);
    };
    if (idx) {
      for (let i = 0; i < idx.count; i++) push(idx.getX(i));
    } else {
      for (let i = 0; i < posAttr.count; i++) push(i);
    }
  });

  const merged = new THREE.BufferGeometry();
  // R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1: wierzchołki o IDENTYCZNEJ pozycji i kolorze (bit w bit, Float32)
  // są współdzielone przez bufor indeksów. Te same trójkąty w tej samej kolejności, a flatShading liczy
  // normalną z pochodnych pozycji w shaderze — obraz identyczny, a geometria ~3-4x mniejsza (CPU i GPU).
  // Pomiar: zmergowane meshe ulepszeń = 155 MB z 573 MB sterty w t.100 (seed 4242).
  const ix = indexIdenticalVertices(new Float32Array(positions), new Float32Array(colors));
  merged.setAttribute('position', new THREE.BufferAttribute(ix.positions, 3));
  merged.setAttribute('color', new THREE.BufferAttribute(ix.colors, 3));
  if (ix.index) merged.setIndex(new THREE.BufferAttribute(ix.index, 1));
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
/** Liczba Mesh w grupie (do decyzji czy warto merge — lekki brzeg 1–6 boxów nie). */
export function countMeshesInGroup(group: THREE.Object3D): number {
  let n = 0;
  group.traverse((o) => { if ((o as THREE.Mesh).isMesh) n++; });
  return n;
}

export function collapseToMergedMesh<T extends THREE.Object3D>(group: T): T {
  if (group.children.length === 0) return group;
  if (isAlreadyMergedDecor(group)) return group;
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
  merged.userData[MERGED_DECOR_FLAG] = true;
  for (let i = group.children.length - 1; i >= 0; i--) {
    group.remove(group.children[i]!);
  }
  group.add(merged);
  group.userData[MERGED_DECOR_FLAG] = true;
  return group;
}

/**
 * P-PERF-SPOWOLNIENIE-PO-60-TURACH (2026-08-12): dispose GPU resources of a group
 * PRODUCED by collapseToMergedMesh() before it is discarded (e.g. respawned on
 * improvement/layer change). Bezpieczne WYŁĄCZNIE dla wyniku collapse — merged
 * BufferGeometry + Material są tworzone od zera w buildMergedMesh() (nigdy
 * współdzielone), więc dispose ich tutaj nie psuje żadnego innego obiektu w
 * scenie. Bez flagi MERGED_DECOR_FLAG (collapse się nie powiódł / grupa pusta)
 * celowo NIC nie robi — dzieci mogły być współdzielonymi singletonami (patrz
 * komentarz nagłówkowy pliku), dispose złamałoby inne miejsca ich użycia.
 * / EN: dispose GPU resources of a group PRODUCED by collapseToMergedMesh()
 * before discarding it (e.g. respawned on an improvement/layer change). Safe
 * ONLY for a collapse result — the merged BufferGeometry + Material are built
 * from scratch in buildMergedMesh() (never shared), so disposing them here
 * cannot break any other object in the scene. Without MERGED_DECOR_FLAG
 * (collapse failed / empty group) this deliberately does nothing — children
 * may be shared singleton geometries (see file header comment); disposing
 * them would break every other place still using them.
 *
 * ZAKRES TWIERDZENIA: sam wyciek jest architektonicznie pewny (bez dispose()
 * gl.deleteBuffer nigdy nie leci, a GC JS buforów GPU nie zwalnia). Natomiast
 * to, że TŁUMACZY zgłoszone spowolnienie po ~60 turach, jest HIPOTEZĄ —
 * niezweryfikowaną pomiarem; do potwierdzenia licznikami `?perfDebug=1`.
 * / EN: SCOPE OF THE CLAIM: the leak itself is architecturally certain (without
 * dispose() gl.deleteBuffer never runs and JS GC does not free GPU buffers).
 * That it EXPLAINS the reported slowdown after ~60 turns is a HYPOTHESIS —
 * not verified by measurement; to be confirmed via the `?perfDebug=1` counters.
 */
export function disposeMergedDecor(group: THREE.Object3D): void {
  if (group.userData?.[MERGED_DECOR_FLAG] !== true) return;
  for (const child of group.children) {
    // Dysponuj WYŁĄCZNIE mesh wyprodukowany przez collapseToMergedMesh — on jako
    // jedyny nosi własną flagę (ustawianą w tej samej funkcji tuż przed group.add).
    // Dziecko dołożone do grupy PO collapse może być współdzielonym singletonem,
    // więc je pomijamy. Dziś żadna ścieżka produkcyjna nic po collapse nie dodaje —
    // to zabezpieczenie pod przyszłe zmiany, bez wpływu na dzisiejsze zachowanie.
    // / EN: dispose ONLY the mesh produced by collapseToMergedMesh — it is the sole
    // carrier of its own flag (set in that same function right before group.add).
    // A child appended to the group AFTER the collapse may be a shared singleton,
    // so it is skipped. No production path adds anything post-collapse today — this
    // guards future changes and does not alter current behaviour.
    if (child.userData?.[MERGED_DECOR_FLAG] !== true) continue;
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) continue;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach(m => m.dispose());
    else mat?.dispose();
  }
}

/**
 * R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1: zwolnienie KOPII CPU (Float32Array position/color) zmergowanej
 * geometrii PO wysłaniu jej do GPU. Pomiar (seed 4242, 100 tur): zmergowane meshe ulepszeń trzymały
 * ~48 KB/heks tablic w pamięci JS (81 MB przy 1676 heksach w t.60) — po uploadzie three.js rysuje
 * WYŁĄCZNIE z bufora WebGL (także cienie), a tablic nikt już nie czyta: meshe ulepszeń nie są
 * raycastowane, a mgła zmienia tylko `material.color`. Sfera/prostopadłościan otaczający są liczone
 * TERAZ (frustum culling / Box3 nie potrzebują już tablic). Atrybut zachowuje `count` (draw range).
 * Wołać TYLKO dla grup, których geometrii nic później nie czyta ani nie modyfikuje (ulepszenia).
 * Utrata kontekstu WebGL: three.js po `webglcontextrestored` wgrałby bufory od nowa z `array` —
 * dlatego wołający musi wtedy przebudować te meshe (main.ts: rebuildImprovementMeshesAfterContextRestore).
 * / EN: drop the CPU copy of a merged decor geometry once it has been uploaded to the GPU.
 */
export function releaseMergedDecorCpuArraysAfterUpload(group: THREE.Object3D): void {
  if (group.userData?.[MERGED_DECOR_FLAG] !== true) return;
  for (const child of group.children) {
    if (child.userData?.[MERGED_DECOR_FLAG] !== true) continue;
    const geo = (child as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!geo) continue;
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    if (!geo.boundingBox) geo.computeBoundingBox();
    for (const name of Object.keys(geo.attributes)) {
      (geo.attributes[name] as THREE.BufferAttribute).onUpload(releaseAttributeArrayAfterUpload);
    }
    geo.index?.onUpload(releaseAttributeArrayAfterUpload);
  }
}

/** true gdy KAŻDY atrybut zmergowanego meshu grupy ma już zwolnioną kopię CPU (hak testowy/pomiar). */
export function mergedDecorCpuArraysReleased(group: THREE.Object3D): boolean {
  let any = false;
  for (const child of group.children) {
    const geo = (child as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!geo || child.userData?.[MERGED_DECOR_FLAG] !== true) continue;
    for (const name of Object.keys(geo.attributes)) {
      any = true;
      if ((geo.attributes[name] as THREE.BufferAttribute).array !== null) return false;
    }
    if (geo.index && geo.index.array !== null) return false;
  }
  return any;
}

function releaseAttributeArrayAfterUpload(this: THREE.BufferAttribute): void {
  // three.js r169 nie czyta `array` po uploadzie, dopóki `version` się nie zmieni (nie zmienia się).
  (this as unknown as { array: ArrayLike<number> | null }).array = null;
}
