/**
 * riverLod.ts — LOD + merge helperów wstęg rzek (Batch 3 remainder).
 *
 * marker: civ-river-lod-merge
 *
 * Cel: na dużych / Super Huge mapach wstęgi rzek generują SETKI meshy
 * (woda + brzeg + delta + lejek), a to tysiące draw calli. Ten moduł:
 *
 *   (a) SCALA geometrie wstęg do kilku „kubełków" (land / coast / delta),
 *       każdy → jedna THREE.BufferGeometry → jeden mesh → jeden draw call;
 *   (b) UKRYWA wstęgi rzek na dalekim LOD (poziom oddalenia kamery), gdzie
 *       przy niskim pixelRatio i tak są ledwie widoczne.
 *
 * ZERO zmian wizualnych przy bliskim zoomie: scalona geometria to dokładnie
 * te same wierzchołki co przed scaleniem (mergeGeometries nie modyfikuje
 * współrzędnych), tylko w jednym buforze zamiast wielu. LOD-hide działa
 * dopiero od progu oddalenia (domyślnie poziom ≥ 3), więc bliski widok
 * (poziom 0/1/2) nie jest dotknięty.
 *
 * DETERMINIZM: brak losowości. Kolejność scalania = kolejność wrzucania
 * geometrii do kubełka (stabilna, wynika z kolejności trasowania rzek).
 *
 * Ten moduł jest samodzielny: NIE importuje scene.ts ani zoomLod.ts.
 * Poziom LOD przyjmuje jako parametr (number), więc nie ma twardej
 * zależności od zoomLod.ts — integrator podaje bieżący poziom z pętli
 * renderu. (Domyślny próg dobrany pod skalę zoomLod.ts: 0=blisko … 4=max.)
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Znacznik obecności modułu w zbudowanym kodzie (debug / weryfikacja bundla). */
export const RIVER_LOD_MARKER = 'civ-river-lod-merge';

/**
 * Kubełek geometrii jednej „warstwy" rzeki (np. woda lądowa, ujście, delta).
 * Zbieramy do niego wiele odcinków wstęgi, a potem scalamy w jeden mesh.
 *
 * Kształt zgodny strukturalnie z `RiverGeoBucket` w scene.ts — dzięki temu
 * integrator może przekazać istniejące kubełki wprost do helperów tego modułu.
 */
export interface RiverGeoBucket {
  /** Materiał wspólny dla całej scalonej warstwy. */
  mat: THREE.Material;
  /** Kolejka geometrii odcinków przed scaleniem. */
  geos: THREE.BufferGeometry[];
  /** Klucze hex "q,r" wzdłuż tras w tym kubełku (do fog-of-war). */
  hexKeys: Set<string>;
  /** renderOrder wynikowego mesha (kolejność malowania warstw rzeki). */
  renderOrder: number;
}

/**
 * Jeden scalony mesh rzeki + metadane do sterowania widocznością (fog + LOD).
 * Kompatybilny z `RiverEntry` w scene.ts (te same pola waterMesh/hexKeys/merged);
 * pola bankMesh/waterGeo/bankGeo scene.ts dubluje na ten sam obiekt — my również.
 */
export interface RiverBucketMesh {
  /** Scalony mesh (jeden draw call na całą warstwę). */
  mesh: THREE.Mesh;
  /** Scalona geometria (współwłasność mesha; do dispose przy sprzątaniu sceny). */
  geometry: THREE.BufferGeometry;
  /** Klucze hex "q,r" — suma tras w kubełku. */
  hexKeys: Set<string>;
  /** true, gdy powstał ze scalenia >1 odcinka (upraszcza reguły fog). */
  merged: boolean;
}

/** Pusty kubełek danej warstwy — wygodny konstruktor dla call-site'ów. */
export function createRiverBucket(
  mat: THREE.Material,
  renderOrder: number,
): RiverGeoBucket {
  return { mat, geos: [], hexKeys: new Set<string>(), renderOrder };
}

/**
 * Dorzuca geometrię jednego odcinka wstęgi do kubełka i dokłada jego klucze hex.
 * (Odpowiednik `queueRiverGeo` w scene.ts — wydzielony do współdzielenia.)
 */
export function queueRiverGeo(
  bucket: RiverGeoBucket,
  geo: THREE.BufferGeometry,
  hexKeys: Iterable<string>,
): void {
  bucket.geos.push(geo);
  for (const k of hexKeys) bucket.hexKeys.add(k);
}

/**
 * Scala wszystkie odcinki kubełka w JEDNĄ BufferGeometry, tworzy mesh, dodaje
 * go do sceny i zwraca wpis (lub null, gdy kubełek pusty). Źródłowe geometrie
 * są zwalniane po scaleniu (gdy było ich >1), bo scalony bufor jest kopią.
 *
 * WIZUALNIE bez zmian: mergeGeometries konkatenuje atrybuty 1:1, nie rusza
 * pozycji/normali/uv — te same trójkąty, jeden draw call zamiast N.
 *
 * @returns wpis mesha albo null, jeśli nie było czego scalać.
 */
export function flushRiverBucket(
  scene: THREE.Scene,
  bucket: RiverGeoBucket,
): RiverBucketMesh | null {
  if (bucket.geos.length === 0) return null;

  const merged: THREE.BufferGeometry | null =
    bucket.geos.length === 1 ? bucket.geos[0]! : mergeGeometries(bucket.geos);
  if (!merged) return null;

  const mesh = new THREE.Mesh(merged, bucket.mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = bucket.renderOrder;
  scene.add(mesh);

  const wasMerged = bucket.geos.length > 1;
  if (wasMerged) {
    // Odcinki źródłowe już niepotrzebne — scalony bufor jest ich kopią.
    for (const g of bucket.geos) g.dispose();
  }
  // Kubełek zużyty: wyczyść kolejkę, by ponowny flush nie zdublował meshy.
  bucket.geos = [];

  return {
    mesh,
    geometry: merged,
    hexKeys: bucket.hexKeys,
    merged: wasMerged,
  };
}

/**
 * Scala i „flushuje" wiele kubełków naraz (land / coast / delta / lejek…).
 * Pomija puste. Zwraca listę wpisów w tej samej kolejności co kubełki
 * (bez wpisów pustych). Determinizm: kolejność wejścia = kolejność wyjścia.
 */
export function mergeRiverBuckets(
  scene: THREE.Scene,
  buckets: RiverGeoBucket[],
): RiverBucketMesh[] {
  const out: RiverBucketMesh[] = [];
  for (const b of buckets) {
    const entry = flushRiverBucket(scene, b);
    if (entry) out.push(entry);
  }
  return out;
}

// ---------------------------------------------------------------------------
// LOD: widoczność wstęg rzek zależnie od oddalenia kamery.
// ---------------------------------------------------------------------------

/**
 * Najniższy poziom LOD, na którym rzeki są JESZCZE UKRYTE. Rzeki znikają dla
 * poziomu >= tego progu. Dobrane pod skalę zoomLod.ts (0=blisko … 4=max):
 * poziomy 0/1/2 = widoczne (bliski/średni widok, ZERO zmian), 3/4 = ukryte.
 * Ta sama polityka co `zoomLodFlags(...).rivers` (marker civ-zoom-lod-a1a4),
 * tu wyrażona jako czysty próg, bez importu zoomLod.ts.
 */
export const RIVER_LOD_HIDE_FROM_LEVEL = 3;

/**
 * Czy przy danym poziomie LOD wstęgi rzek mają być widoczne?
 * Czyste, deterministyczne; `hideFromLevel` pozwala nadpisać próg (np. test).
 *
 * @param level      bieżący poziom LOD z pętli renderu (0 = blisko).
 * @param hideFromLevel próg ukrycia (domyślnie RIVER_LOD_HIDE_FROM_LEVEL).
 */
export function riversVisibleAtLod(
  level: number,
  hideFromLevel: number = RIVER_LOD_HIDE_FROM_LEVEL,
): boolean {
  return level < hideFromLevel;
}

/**
 * Ustawia widoczność scalonych meshy rzek wg poziomu LOD.
 *
 * Zwraca, czy rzeki są na tym poziomie widoczne — dzięki temu wywołujący
 * może POMINĄĆ droższe przeliczenia fog-of-war dla rzek, gdy i tak są ukryte
 * (na dalekim LOD nie ma sensu iterować hexKeys po widoczności).
 *
 * WAŻNE: gdy rzeki są widoczne (bliski/średni LOD), ta funkcja NIE wymusza
 * `visible = true` bezwarunkowo — ustawia tylko przy przejściu do stanu
 * „ukryte". Sterowanie fog-of-war (per-hex) zostaje po stronie wywołującego,
 * żeby nie nadpisać decyzji mgły. Dlatego przy widoczności funkcja zwraca
 * true i NIE dotyka `mesh.visible` (poza reaktywacją z ukrycia — patrz niżej).
 *
 * @param entries       scalone meshe rzek (wynik mergeRiverBuckets).
 * @param level         bieżący poziom LOD.
 * @param hideFromLevel próg ukrycia (domyślnie RIVER_LOD_HIDE_FROM_LEVEL).
 * @returns             true, jeśli rzeki są na tym LOD widoczne.
 */
export function applyRiverLodVisibility(
  entries: Iterable<RiverBucketMesh>,
  level: number,
  hideFromLevel: number = RIVER_LOD_HIDE_FROM_LEVEL,
): boolean {
  const visible = riversVisibleAtLod(level, hideFromLevel);
  if (!visible) {
    for (const e of entries) e.mesh.visible = false;
  }
  return visible;
}

/**
 * Wariant „samowystarczalny": ustawia widoczność meshy rzek uwzględniając
 * JEDNOCZEŚNIE LOD oraz fog-of-war, w jednym przejściu. Użyteczny, gdy
 * wywołujący nie ma własnej pętli fog dla rzek i chce oddać całość tutaj.
 *
 * Reguły (identyczne z inline'em scene.ts, marker zgodny):
 *   - LOD ukrywa rzeki (level >= próg)            → mesh.visible = false;
 *   - brak mgły na mapie (anyHidden === false)    → mesh.visible = true;
 *   - mesh (scalony lub nie)                      → widoczny tylko gdy ŻADEN
 *       hex trasy nie jest ukryty (isHidden).
 *
 * Determinizm: brak losowości; zależy wyłącznie od argumentów.
 *
 * @param entries    scalone meshe rzek.
 * @param level      bieżący poziom LOD.
 * @param anyHidden  czy na mapie jest choć jeden hex ukryty (mgła aktywna).
 * @param isVisible  predykat: hex "q,r" widoczny.
 * @param isExplored predykat: hex "q,r" odkryty (ale niekoniecznie widoczny).
 * @param hideFromLevel próg ukrycia LOD (domyślnie RIVER_LOD_HIDE_FROM_LEVEL).
 */
export function applyRiverVisibility(
  entries: Iterable<RiverBucketMesh>,
  level: number,
  anyHidden: boolean,
  isVisible: (hexKey: string) => boolean,
  isExplored: (hexKey: string) => boolean,
  hideFromLevel: number = RIVER_LOD_HIDE_FROM_LEVEL,
): void {
  const lodVisible = riversVisibleAtLod(level, hideFromLevel);
  for (const e of entries) {
    if (!lodVisible) {
      e.mesh.visible = false;
      continue;
    }
    if (!anyHidden) {
      e.mesh.visible = true;
      continue;
    }
    let show = e.hexKeys.size > 0;
    if (show) {
      for (const k of e.hexKeys) {
        if (!isVisible(k) && !isExplored(k)) { show = false; break; }
      }
    }
    e.mesh.visible = show;
  }
}

/** Zwalnia scalone geometrie rzek (przy sprzątaniu sceny / dispose). */
export function disposeRiverBuckets(entries: Iterable<RiverBucketMesh>): void {
  for (const e of entries) {
    e.mesh.geometry.dispose();
    if (e.geometry !== e.mesh.geometry) e.geometry.dispose();
  }
}
