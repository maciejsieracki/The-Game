/**
 * smallPartLod.ts — R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R3): LOD drobnych części modeli.
 *
 * Token jednostki ma 70-100 meshy, model miasta ~65 (każdy = osobny draw call). Przy dużym
 * oddaleniu kamery większość z nich ma rzut na ekran < kilku pikseli. Chowamy (visible=false)
 * tylko mesze o średnicy rzutu poniżej progu i przywracamy je przy zbliżeniu. Przeliczenie
 * następuje wyłącznie przy zmianie kubełka odległości kamery albo zestawu modeli ("version"),
 * nigdy co klatkę. Nie zmienia stanu gry; raycast (picking) ignoruje `visible`.
 */
import * as THREE from 'three';

/** Kubełki ~12% szerokości piksela w świecie (nie przeliczamy przy każdej klatce zoomu). */
const BUCKET_BASE = 1.12;

export class SmallPartLod {
  private appliedKey = '';
  private radiusCache = new WeakMap<THREE.Mesh, number>();
  private hidden = new Set<THREE.Mesh>();

  /** Liczba meshy aktualnie schowanych przez LOD (diagnostyka/test). */
  get hiddenCount(): number { return this.hidden.size; }

  /** Przywraca wszystkie schowane mesze i zapomina klucz (np. po dispose sceny). */
  reset(): void {
    for (const m of this.hidden) m.visible = true;
    this.hidden.clear();
    this.appliedKey = '';
  }

  /**
   * @param roots modele (tokeny/miasta); niewidoczne korzenie są pomijane
   * @param stopAt rodzic, do którego liczymy skalę (zwykle scena)
   * @param version licznik zmian zestawu modeli (nowy/usunięty model wymusza przeliczenie)
   * @param camDist odległość kamery od punktu skupienia (świat)
   * @param fovDeg pionowy FOV, @param viewportH wysokość obszaru rysowania w px
   * @param minPx mesh o średnicy rzutu < minPx znika (<= 0 wyłącza LOD)
   */
  apply(
    roots: Iterable<THREE.Object3D>,
    stopAt: THREE.Object3D | null,
    version: number,
    camDist: number,
    fovDeg: number,
    viewportH: number,
    minPx = 3,
  ): void {
    const worldPerPx = (2 * camDist * Math.tan((fovDeg * Math.PI / 180) / 2)) / Math.max(1, viewportH);
    const bucket = minPx <= 0 ? -1e9 : Math.round(Math.log(Math.max(1e-6, worldPerPx)) / Math.log(BUCKET_BASE));
    const key = bucket + ':' + version;
    if (key === this.appliedKey) return;
    this.appliedKey = key;
    for (const m of this.hidden) m.visible = true;
    this.hidden.clear();
    if (minPx <= 0) return;
    const cutoff = minPx * Math.pow(BUCKET_BASE, bucket); // średnica w świecie
    const walk = (o: THREE.Object3D): void => {
      // nakładki (tabliczka statystyk, emblematy) mają zmienną skalę/renderOrder - nie ruszamy
      if (o.name === 'unitStatPlate' || o.userData['noSmallPartLod']) return;
      const m = o as THREE.Mesh;
      if (!m.isMesh) { for (const c of o.children) walk(c); return; }
      if ((m as unknown as THREE.InstancedMesh).isInstancedMesh || !m.visible || m.renderOrder !== 0) return;
      let r = this.radiusCache.get(m);
      if (r === undefined) {
        const g = m.geometry;
        if (!g.boundingSphere) g.computeBoundingSphere();
        let sc = 1;
        for (let a: THREE.Object3D | null = m; a && a !== stopAt; a = a.parent) {
          sc *= Math.max(Math.abs(a.scale.x), Math.abs(a.scale.y), Math.abs(a.scale.z));
        }
        r = (g.boundingSphere?.radius ?? 0) * sc;
        this.radiusCache.set(m, r);
      }
      if (r * 2 < cutoff) { m.visible = false; this.hidden.add(m); }
      for (const c of m.children) walk(c);
    };
    for (const root of roots) {
      if (root.visible) walk(root);
    }
  }
}
