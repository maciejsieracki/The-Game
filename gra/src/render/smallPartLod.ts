/**
 * smallPartLod.ts — R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R3): LOD drobnych części modeli.
 *
 * Token jednostki ma 70-100 meshy, model miasta ~65 (każdy = osobny draw call). Przy dużym
 * oddaleniu kamery większość z nich ma rzut na ekran < kilku pikseli. Chowamy (visible=false)
 * tylko mesze o średnicy rzutu poniżej progu i przywracamy je przy zbliżeniu. Przeliczenie
 * następuje wyłącznie przy zmianie kubełka odległości kamery albo zestawu modeli ("version"),
 * nigdy co klatkę. Nie zmienia stanu gry; raycast (picking) ignoruje `visible`.
 *
 * R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1: mesh scalony z wielu części (`unitStaticMerge.ts`) ma części ułożone
 * malejąco wg średnicy; LOD rysuje wtedy tylko prefiks części o rzucie >= progu (`setMergedPartsDrawn`),
 * a gdy żadna nie przechodzi — chowa cały mesh. Ta sama średnica części co dla osobnego meshu → ten sam
 * zestaw chowanych części co przed scaleniem.
 */
import * as THREE from 'three';
import { getMergedPartLod, setMergedPartsDrawn } from './unitStaticMerge';

/** Kubełki ~12% szerokości piksela w świecie (nie przeliczamy przy każdej klatce zoomu). */
const BUCKET_BASE = 1.12;

export class SmallPartLod {
  private appliedKey = '';
  /** Promień sfery brzegowej geometrii (bez skali przodków - ta bywa zmieniana w grze). */
  private geoRadiusCache = new WeakMap<THREE.BufferGeometry, number>();
  private hidden = new Set<THREE.Mesh>();
  /** Scalone mesze rysujące tylko prefiks części. */
  private trimmed = new Set<THREE.Mesh>();
  private hiddenParts = 0;
  private readonly rootBuf: THREE.Object3D[] = [];

  /** Liczba meshy aktualnie schowanych przez LOD (diagnostyka/test). */
  get hiddenCount(): number { return this.hidden.size; }
  /** Liczba CZĘŚCI modeli schowanych przez LOD (mesh zwykły = 1, scalony = liczba schowanych części). */
  get hiddenPartCount(): number { return this.hiddenParts; }

  /** Przywraca schowane mesze podpięte jeszcze do `stopAt`; odpięte (usunięte modele) tylko zapomina. */
  private restoreHidden(stopAt: THREE.Object3D | null): void {
    for (const m of this.hidden) {
      // mesz odpięty od sceny (model usunięty) - nie trzymamy referencji i nie dotykamy go
      let attached = stopAt === null;
      for (let a: THREE.Object3D | null = m.parent; a && !attached; a = a.parent) attached = a === stopAt;
      if (attached) m.visible = true;
    }
    this.hidden.clear();
    for (const m of this.trimmed) setMergedPartsDrawn(m, Infinity);
    this.trimmed.clear();
    this.hiddenParts = 0;
  }

  /** Przywraca wszystkie schowane mesze i zapomina klucz (np. po dispose sceny). */
  reset(): void {
    for (const m of this.hidden) m.visible = true;
    this.hidden.clear();
    for (const m of this.trimmed) setMergedPartsDrawn(m, Infinity);
    this.trimmed.clear();
    this.hiddenParts = 0;
    this.appliedKey = '';
  }

  /**
   * @param roots modele (tokeny/miasta); niewidoczne korzenie są pomijane
   * @param stopAt rodzic, do którego liczymy skalę (zwykle scena)
   * @param version licznik zmian zestawu modeli (nowy/usunięty model wymusza przeliczenie)
   * @param camDist odległość kamery od punktu skupienia (świat)
   * @param fovDeg pionowy FOV, @param viewportH wysokość obszaru rysowania w px
   * @param minPx mesh o średnicy rzutu < minPx znika (<= 0 wyłącza LOD)
   *
   * Poza kubełkiem zoomu i `version` klucz zawiera podpis korzeni (liczba widocznych + suma
   * id/skali): odsłonięcie jednostki z mgły/stosu albo zmiana skali figurki (wejście do miasta)
   * wymusza przeliczenie, a skala przodków jest liczona przy każdym przeliczeniu (bez cache).
   * Koszt per klatka: jedno przejście po korzeniach (setki obiektów), bez trawersowania meshy.
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
    let nVisible = 0;
    let sig = 0;
    // `roots` bywa jednorazowym iteratorem (Map.values()) - jeden przebieg zbiera widoczne korzenie
    const vis = this.rootBuf;
    vis.length = 0;
    for (const root of roots) {
      if (!root.visible) continue;
      vis.push(root);
      nVisible++;
      sig = (Math.imul(sig, 31) + root.id + Math.round(root.scale.x * 1000)) | 0;
    }
    const key = bucket + ':' + version + ':' + nVisible + ':' + sig;
    if (key === this.appliedKey) { vis.length = 0; return; }
    this.appliedKey = key;
    this.restoreHidden(stopAt);
    if (minPx <= 0) { vis.length = 0; return; }
    const cutoff = minPx * Math.pow(BUCKET_BASE, bucket); // średnica w świecie
    const walk = (o: THREE.Object3D): void => {
      // nakładki (tabliczka statystyk, emblematy) mają zmienną skalę/renderOrder - nie ruszamy
      if (o.name === 'unitStatPlate' || o.userData['noSmallPartLod']) return;
      const m = o as THREE.Mesh;
      if (!m.isMesh) { for (const c of o.children) walk(c); return; }
      if ((m as unknown as THREE.InstancedMesh).isInstancedMesh || !m.visible || m.renderOrder !== 0) return;
      const parts = getMergedPartLod(m);
      if (parts) {
        let sc = 1;
        for (let a: THREE.Object3D | null = m; a && a !== stopAt; a = a.parent) {
          sc *= Math.max(Math.abs(a.scale.x), Math.abs(a.scale.y), Math.abs(a.scale.z));
        }
        const d = parts.diam;
        let keep = 0;
        while (keep < d.length && (d[keep] as number) * sc >= cutoff) keep++;
        if (keep === 0) { m.visible = false; this.hidden.add(m); this.hiddenParts += d.length; }
        else if (keep < d.length) { setMergedPartsDrawn(m, keep); this.trimmed.add(m); this.hiddenParts += d.length - keep; }
        return;
      }
      const g = m.geometry;
      let gr = this.geoRadiusCache.get(g);
      if (gr === undefined) {
        if (!g.boundingSphere) g.computeBoundingSphere();
        gr = g.boundingSphere?.radius ?? 0;
        this.geoRadiusCache.set(g, gr);
      }
      let sc = 1;
      for (let a: THREE.Object3D | null = m; a && a !== stopAt; a = a.parent) {
        sc *= Math.max(Math.abs(a.scale.x), Math.abs(a.scale.y), Math.abs(a.scale.z));
      }
      if (gr * sc * 2 < cutoff) { m.visible = false; this.hidden.add(m); this.hiddenParts++; }
      for (const c of m.children) walk(c);
    };
    for (const root of vis) walk(root);
    vis.length = 0;
  }
}
