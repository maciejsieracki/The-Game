'use strict';
/** merge-decor-no-regress-test.cjs — skip podwójnego collapse + offline overlay count */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(__dirname, '.merge-decor-no-regress-entry.ts');
const BUNDLE = path.join(__dirname, '.merge-decor-no-regress-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  MERGED_DECOR_FLAG,
  isAlreadyMergedDecor,
  countMeshesInGroup,
  collapseToMergedMesh,
  disposeMergedDecor,
} from '../src/render/mergeDecor';
export { generujSwiat } from '../src/map/generator';
export { countSceneOverlayCandidates } from '../src/render/countSceneOverlayCandidates';
export { buildZlozeKonie } from '../src/render/kon-nowy-model';
// SEKCJA T — realny buildScene w node. THREE MUSI byc reeksportowane z bundla: esbuild
// wklaja wlasna kopie three do bundla, wiec require('three') w tescie to INNY modul i
// zalatanie jego prototypow nie widzialoby zwolnien robionych przez kod sceny.
export * as THREE_BUNDLED from 'three';
export { buildScene, SCENE_BUILD_PHASE_LABELS } from '../src/render/scene';
export { TEREN_MATERIAL, goraGeometria, wzgorzeGeometria } from '../src/render/teren-gory-wzgorza';
export { LAS_MATERIAL, lasGeometria } from '../src/render/lasy-modele';
export { DJUNGLA_MATERIAL, djunglaGeometria } from '../src/render/djungla-modele';
export { DEKOR_MATERIAL, dekorLakaGeometria, dekorRowninaGeometria } from '../src/render/dekor-laki-rowniny';
export { getCoastSharedGeometries, coastWaterMaterial, coastSandMaterial } from '../src/render/mapRenderStyle';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const THREE = require('three');
const M = require(BUNDLE);

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}

// --- isAlreadyMergedDecor + podwójny collapse ---
const g = new THREE.Group();
const m1 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0xff0000 }),
);
const m2 = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
);
g.add(m1);
g.add(m2);
ok(M.countMeshesInGroup(g) === 2, 'pre-merge: 2 meshy');

M.collapseToMergedMesh(g);
ok(g.children.length === 1, 'po merge: 1 dziecko');
ok(M.isAlreadyMergedDecor(g), 'isAlreadyMergedDecor po collapse');

const posBefore = g.children[0].geometry.getAttribute('position').array.length;
M.collapseToMergedMesh(g);
ok(g.children.length === 1, 'drugi collapse: nadal 1 dziecko');
ok(
  g.children[0].geometry.getAttribute('position').array.length === posBefore,
  'drugi collapse: geometria bez zmian (skip)',
);
ok(g.userData[M.MERGED_DECOR_FLAG] === true, 'flaga MERGED_DECOR na grupie');

// ---------------------------------------------------------------------------
// disposeMergedDecor — kontrakt bezpieczenstwa (P-PERF-SPOWOLNIENIE-PO-60-TURACH).
// Cala poprawnosc dispose opiera sie na jednym niezmienniku: zwalniamy WYLACZNIE
// zasoby GPU wyprodukowane przez collapseToMergedMesh, nigdy wspoldzielonych
// singletonow (np. geoNH* z kon-nowy-model.ts, uzywanych tez przez tokeny jednostek).
// Bez tych asercji zadna bramka nie chronila tego niezmiennika.
// ---------------------------------------------------------------------------

/** Licznik zdarzen 'dispose' per obiekt (THREE dispatchuje je z BufferGeometry i Material). */
function watchDisposes(objs) {
  const seen = new Map();
  for (const o of objs) {
    if (seen.has(o)) continue;
    seen.set(o, 0);
    o.addEventListener('dispose', () => seen.set(o, seen.get(o) + 1));
  }
  return seen;
}
const sumDisposes = (m) => [...m.values()].reduce((a, b) => a + b, 0);

// D1: merged geometry + material zwolnione dokladnie 1x; wspoldzielone dzieci nietkniete.
const dShared = new THREE.Group();
const SHARED_GEO = new THREE.BoxGeometry(1, 1, 1);        // udaje geoNH* (module-level singleton)
const SHARED_MAT = new THREE.MeshLambertMaterial({ color: 0x112233 });
for (let i = 0; i < 8; i++) {
  const m = new THREE.Mesh(SHARED_GEO, SHARED_MAT);
  m.position.x = i * 0.3;
  dShared.add(m);
}
const unitToken = new THREE.Mesh(SHARED_GEO, SHARED_MAT); // "token jednostki" ZOSTAJE w scenie
const wShared = watchDisposes([SHARED_GEO, SHARED_MAT]);
M.collapseToMergedMesh(dShared);
const mergedGeo = dShared.children[0].geometry;
const mergedMat = dShared.children[0].material;
const wMerged = watchDisposes([mergedGeo, mergedMat]);
M.disposeMergedDecor(dShared);
ok(wMerged.get(mergedGeo) === 1, 'dispose: merged geometry zwolniona dokladnie 1x');
ok(wMerged.get(mergedMat) === 1, 'dispose: merged material zwolniony dokladnie 1x');
ok(sumDisposes(wShared) === 0, 'dispose: wspoldzielona geometria/material singletona NIE zwolnione');
ok(unitToken.geometry.getAttribute('position').count > 0, 'dispose: token jednostki nadal ma atrybuty');

// D2: grupa BEZ flagi (nigdy nie collapsowana, np. lekki brzeg <7 mesh) -> NO-OP.
const dNoFlag = new THREE.Group();
const plainGeo = new THREE.BoxGeometry(1, 1, 1);
const plainMat = new THREE.MeshLambertMaterial();
dNoFlag.add(new THREE.Mesh(plainGeo, plainMat));
const wNoFlag = watchDisposes([plainGeo, plainMat]);
M.disposeMergedDecor(dNoFlag);
ok(sumDisposes(wNoFlag) === 0, 'dispose: grupa bez flagi MERGED_DECOR = NO-OP');

// D3: grupa zlapana heurystyka isAlreadyMergedDecor (1 mesh + vertexColors) — collapse
// robi early-return NIE ustawiajac flagi, wiec dispose tez musi byc NO-OP.
const dHeur = new THREE.Group();
const heurGeo = new THREE.BoxGeometry(1, 1, 1);
const heurMat = new THREE.MeshLambertMaterial({ vertexColors: true });
dHeur.add(new THREE.Mesh(heurGeo, heurMat));
const wHeur = watchDisposes([heurGeo, heurMat]);
M.collapseToMergedMesh(dHeur);
ok(dHeur.userData[M.MERGED_DECOR_FLAG] !== true, 'dispose: heurystyka isAlreadyMergedDecor NIE ustawia flagi grupy');
M.disposeMergedDecor(dHeur);
ok(sumDisposes(wHeur) === 0, 'dispose: grupa z heurystyki (bez flagi) = NO-OP');

// D4: straznik flagi NA GRUPIE — zmergowany mesh przepiety do OBCEJ grupy (ta nie
// przeszla collapse, wiec nie ma prawa go zwalniac). Mutacja usuwajaca
// `if (group.userData?.[MERGED_DECOR_FLAG] !== true) return;` czyni ten test czerwonym.
const dForeign = new THREE.Group();
dForeign.add(dHeur.children[0]);                          // dziecko bez flagi
const dCollapsed = new THREE.Group();
for (let i = 0; i < 8; i++) {
  dCollapsed.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial()));
}
M.collapseToMergedMesh(dCollapsed);
const adoptedMerged = dCollapsed.children[0];             // mesh Z flaga
dForeign.add(adoptedMerged);
const wForeign = watchDisposes([adoptedMerged.geometry, adoptedMerged.material, heurGeo, heurMat]);
M.disposeMergedDecor(dForeign);
ok(sumDisposes(wForeign) === 0, 'dispose: obca grupa bez flagi NIE zwalnia przepietego merged mesh (straznik grupy)');

// D5: dziecko dodane do grupy PO collapse (potencjalny wspoldzielony singleton)
// nie moze zostac zwolnione. Mutacja usuwajaca straznik flagi DZIECKA -> czerwone.
const dLate = new THREE.Group();
for (let i = 0; i < 8; i++) {
  dLate.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial()));
}
M.collapseToMergedMesh(dLate);
const lateShared = new THREE.BoxGeometry(2, 2, 2);        // singleton dolozony PO collapse
const wLate = watchDisposes([lateShared]);
dLate.add(new THREE.Mesh(lateShared, SHARED_MAT));
M.disposeMergedDecor(dLate);
ok(wLate.get(lateShared) === 0, 'dispose: dziecko dodane PO collapse NIE zostalo zwolnione');

// D6 (KLUCZOWA): REALNY model zloza koni — kon-nowy-model.ts trzyma 20 lazy-cache'owanych
// geometrii modulowych geoNH*, wspoldzielonych miedzy zlozami a tokenami jednostek.
// Zwolnienie ktorejkolwiek z nich = zepsuty model wszedzie indziej w scenie.
const horseA = M.buildZlozeKonie(1.0);
const horseB = M.buildZlozeKonie(1.0);                    // drugie zloze — te same geoNH*
const geosB = [];
horseB.traverse((o) => { if (o.isMesh) geosB.push(o.geometry); });
const wHorse = watchDisposes(geosB);
ok(M.countMeshesInGroup(horseA) >= 7, 'dispose: model konia ma >=7 mesh (idzie sciezka collapse)');
M.collapseToMergedMesh(horseA);
M.disposeMergedDecor(horseA);
ok(sumDisposes(wHorse) === 0, 'dispose: realny kon — ZADNA wspoldzielona geoNH* nie zostala zwolniona');
ok(
  geosB.every((g) => g.getAttribute('position') && g.getAttribute('position').count > 0),
  'dispose: drugie zloze koni zachowalo komplet atrybutow pozycji',
);

// D7: mieszany pool jak styledOverlays w scene.ts — grupy CIEZKIE (przeszly collapse)
// obok LEKKICH (brzeg 1-6 boxow, collapse pominiety, dzieci to wspoldzielone singletony).
// Petla dispose w scene.ts leci po CALEJ tablicy, wiec musi byc bezpieczna dla obu rodzajow:
// ciezkie zwalniane dokladnie 1x, lekkie nietkniete.
const SHARED_LIGHT_GEO = new THREE.BoxGeometry(0.5, 0.5, 0.5);   // udaje singleton brzegu
const SHARED_LIGHT_MAT = new THREE.MeshLambertMaterial({ color: 0x445566 });
const poolLikeScene = [];
for (let i = 0; i < 5; i++) {
  const heavy = new THREE.Group();
  for (let k = 0; k < 8; k++) {
    heavy.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial()));
  }
  M.collapseToMergedMesh(heavy);                                  // ciezka -> merged
  poolLikeScene.push({ group: heavy, hexKey: `h${i}`, meshCount: 8 });
  const light = new THREE.Group();
  for (let k = 0; k < 3; k++) light.add(new THREE.Mesh(SHARED_LIGHT_GEO, SHARED_LIGHT_MAT));
  poolLikeScene.push({ group: light, hexKey: `l${i}`, meshCount: 3 }); // lekka -> BEZ collapse
}
const heavyRes = [];
for (const { group } of poolLikeScene) {
  if (group.userData[M.MERGED_DECOR_FLAG] !== true) continue;
  heavyRes.push(group.children[0].geometry, group.children[0].material);
}
const wPool = watchDisposes(heavyRes);
const wPoolLight = watchDisposes([SHARED_LIGHT_GEO, SHARED_LIGHT_MAT]);
for (const { group } of poolLikeScene) M.disposeMergedDecor(group); // petla 1:1 jak w dispose()
ok(heavyRes.length === 10, 'dispose pool: 5 grup ciezkich dalo 10 zasobow GPU do zwolnienia');
ok(
  heavyRes.every((r) => wPool.get(r) === 1),
  'dispose pool: KAZDY zasob grupy ciezkiej zwolniony dokladnie 1x',
);
ok(sumDisposes(wPoolLight) === 0, 'dispose pool: grupy lekkie (bez collapse) nietkniete');

// ---------------------------------------------------------------------------
// SEKCJA S — straznik tekstowy scene.ts::dispose(). Sekcja D testuje sam
// disposeMergedDecor; nic natomiast nie chroni jego WYWOLANIA po stronie sceny,
// a to tam byl wyciek: dispose() zwalnial instancje/rzeki/ocean/ramke i ANI JEDNEJ
// zmergowanej grupy styledOverlays (tysiace grup, 5 call site disposeScene()).
// Bramka nie moze uruchomic buildScene w node (WebGL), wiec kontrola idzie po tresci
// pliku — wzorzec jak straznik tekstowy w ai-founding-territory-test.cjs.
// ---------------------------------------------------------------------------
const SCENE_SRC = fs.readFileSync(path.join(ROOT, 'src/render/scene.ts'), 'utf8');

/** Wycina cialo funkcji `header` (dopasowanie klamr). Zwraca null gdy nie znaleziono. */
function extractFnBody(src, header) {
  const at = src.indexOf(header);
  if (at < 0) return null;
  const open = src.indexOf('{', at);
  if (open < 0) return null;
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(open + 1, j);
  }
  return null;
}

// S1: import disposeMergedDecor w scene.ts (bez niego nie ma czym zwalniac).
ok(
  /import\s*\{[^}]*\bdisposeMergedDecor\b[^}]*\}\s*from\s*'\.\/mergeDecor'/.test(SCENE_SRC),
  'scene.ts: disposeMergedDecor zaimportowany z ./mergeDecor',
);

const disposeBody = extractFnBody(SCENE_SRC, 'function dispose()');
ok(disposeBody != null, 'scene.ts: znaleziono cialo function dispose()');
// S2: kotwica poprawnosci wyciecia — bez niej kolejne asercje moglyby badac nie ten fragment.
// P-PERF-BUILDSCENE-TRY-FINALLY przeniosl ocean/ramke/listenery do rejestru sceneTeardown
// (ich const-y zyja w bloku try, dispose() stoi PRZED nim), wiec kotwica idzie po drenazu
// rejestru zamiast po literalnym oceanGeo.dispose() — to ta sama sila, tylko inny znacznik.
ok(
  disposeBody != null
    && /renderer\.dispose\(\)/.test(disposeBody)
    && /for\s*\(\s*const\s+\w+\s+of\s+sceneTeardown\s*\)/.test(disposeBody),
  'scene.ts: wyciete cialo to faktycznie dispose() (zawiera renderer.dispose + drenaz sceneTeardown)',
);
// S2b: ocean i ramka swiata MUSZA sie rejestrowac w sceneTeardown — inaczej wypadaja
// z dispose() calkowicie (dispose() nie widzi juz ich const-ow) i wyciekaja przy KAZDYM
// zwolnieniu sceny, nie tylko na sciezce wyjatku.
ok(
  /sceneTeardown\.push\(\(\)\s*=>\s*\{\s*oceanGeo\.dispose\(\);\s*oceanMat\.dispose\(\);/.test(SCENE_SRC)
    && /sceneTeardown\.push\(\(\)\s*=>\s*\{\s*for\s*\(const g of frameGeos\) g\.dispose\(\); frameMat\.dispose\(\);/.test(SCENE_SRC),
  'scene.ts: ocean + ramka swiata zarejestrowane w sceneTeardown (inaczej wypadaja z dispose)',
);

// S3: w dispose() istnieje petla po CALEJ tablicy styledOverlays wolajaca disposeMergedDecor.
// Cofniecie tej jednej linii = powrot wycieku; ta asercja jest jedynym jego straznikiem.
const overlayLoop = /for\s*\(\s*const\s+(?:\{[^}]*\bgroup\b[^}]*\}|\w+)\s+of\s+styledOverlays\s*\)\s*\{?\s*disposeMergedDecor\s*\(/;
ok(
  disposeBody != null && overlayLoop.test(disposeBody),
  'scene.ts dispose(): petla `for (const { group } of styledOverlays) disposeMergedDecor(group)`',
);

// S4: petla nie moze pomijac zadnego wpisu — zaden filtr/limit/skrot na tablicy ani
// warunek w ciele. (Wyciek jest proporcjonalny do liczby POMINIETYCH grup, wiec
// „prawie wszystkie" nie wystarczy.) Wycinamy CALA instrukcje petli — dziala tak samo
// dla formy jednolinijkowej jak i blokowej, wiec legalny refaktor nie da falszywej czerwieni.
/** Naglowek + cialo petli `for (... of styledOverlays)` — blok {…} albo jedna instrukcja do `;`. */
function extractOverlayLoop(body) {
  const m = /for\s*\([^)]*\bof\b[^)]*styledOverlays[^)]*\)/.exec(body || '');
  if (!m) return null;
  const header = m[0];
  let i = m.index + header.length;
  while (i < body.length && /\s/.test(body[i])) i++;
  if (body[i] === '{') {
    let depth = 0;
    for (let j = i; j < body.length; j++) {
      if (body[j] === '{') depth++;
      else if (body[j] === '}' && --depth === 0) return { header, stmt: body.slice(i + 1, j) };
    }
    return null;
  }
  const end = body.indexOf(';', i);
  return end < 0 ? null : { header, stmt: body.slice(i, end) };
}
const overlayLoopParts = extractOverlayLoop(disposeBody);
ok(
  overlayLoopParts != null
    && /disposeMergedDecor\s*\(/.test(overlayLoopParts.stmt)
    && !/\.(slice|filter|splice)\s*\(/.test(overlayLoopParts.header)
    && !/\bcontinue\b|\bbreak\b|\bif\s*\(|\?\s*disposeMergedDecor/.test(overlayLoopParts.stmt),
  'scene.ts dispose(): petla leci po pelnej tablicy (bez filter/slice/if/continue/break w ciele)',
);

// S5: styledOverlays to JEDYNY zbiornik zmergowanych grup w scene.ts. Drugie miejsce
// wolajace collapseToMergedMesh oznaczaloby pool nieobjety petla z S3 — wtedy ta asercja
// ma zaswiecic na czerwono i wymusic podpiecie nowego miejsca do dispose().
const collapseCalls = (SCENE_SRC.match(/collapseToMergedMesh\s*\(/g) || []).length;
ok(
  collapseCalls === 1,
  `scene.ts: dokladnie 1 call site collapseToMergedMesh (jest ${collapseCalls}) — inaczej istnieje pool poza styledOverlays`,
);
ok(
  /const\s+entry\s*=\s*styledOverlays\[oi\]/.test(SCENE_SRC),
  'scene.ts: jedyny collapse dziala na wpisie styledOverlays (zrodlo poola = ta sama tablica co w dispose)',
);

// --- offline overlay count (roblox pangea standard) ---
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };
const map = M.generujSwiat(42, 'standardowy', 'pangea', { worldDensity: DENSITY });
const counts = M.countSceneOverlayCandidates(map, 'roblox');
ok(counts.total >= 0, 'countSceneOverlayCandidates zwraca total');
ok(
  counts.estHeavyMerge + counts.estLightSkip === counts.total,
  'heavy+light = total',
);
console.log('  overlay roblox/pangea/standard:', JSON.stringify(counts));

// ---------------------------------------------------------------------------
// SEKCJA T — P-PERF-BUILDSCENE-TRY-FINALLY. Test MUTACYJNY, nie tekstowy: uruchamia
// PRAWDZIWY buildScene z scene.ts w node i wstrzykuje wyjatek W TRAKCIE budowy sceny.
//
// Dlaczego to w ogole dziala bez WebGL (komentarz sekcji S mowil, ze sie nie da):
// buildScene przyjmuje `sharedRenderer` i przy nim NIE tworzy WebGLRenderera, a przy
// `previewViewport` nie dotyka window/document. Zostaje requestAnimationFrame (stub nizej).
//
// Wstrzykniecie: getter na map.riverPaths, uzbrajany dopiero gdy onProgress zglosi
// pct>=90 — a to raport wysylany PO markBuildPhase('overlays'), czyli po calej fazie
// merge (raporty z wnetrza petli merge maja pct < 90). Faza rzek siega po map.riverPaths
// jako pierwsza po uzbrojeniu → wyjatek leci DOKLADNIE w scenariuszu ze zgloszenia:
// zmergowane grupy styledOverlays juz istnieja, sceny nikt nie dostal.
//
// PRZED poprawka: buildScene porzuca scene bez dispose() → ponizsze asercje na czerwono
// (zero zwolnien). PO poprawce: catch woła dispose() i puszcza TEN SAM blad dalej.
// ---------------------------------------------------------------------------
globalThis.requestAnimationFrame = globalThis.requestAnimationFrame
  || ((cb) => setTimeout(() => cb(Date.now()), 0));

/** Bundlowa kopia three — jedyna, ktorej prototypy widzi kod sceny (patrz komentarz w ENTRY). */
const TB = M.THREE_BUNDLED;

/** obiekt -> ile razy zwolniony. Latka na prototypach, bo scena nie oddaje swoich zasobow. */
const disposeCalls = new Map();
for (const proto of [TB.BufferGeometry.prototype, TB.Material.prototype]) {
  const orig = proto.dispose;
  proto.dispose = function patchedDispose(...args) {
    disposeCalls.set(this, (disposeCalls.get(this) || 0) + 1);
    return orig.apply(this, args);
  };
}
/** Wszystko, co trafilo do grafu sceny — jedyny uchwyt do zasobow PORZUCONEJ budowy. */
let addedObjects = [];
const origObj3dAdd = TB.Object3D.prototype.add;
TB.Object3D.prototype.add = function patchedAdd(...objs) {
  for (const o of objs) addedObjects.push(o);
  return origObj3dAdd.apply(this, objs);
};

/** Renderer-atrapa: buildScene z `sharedRenderer` nie tworzy kontekstu WebGL. */
const fakeRenderer = {
  shadowMap: { enabled: false, type: 0, autoUpdate: true, needsUpdate: false },
  toneMapping: 0,
  toneMappingExposure: 1,
  disposeCount: 0,
  setSize() {}, setPixelRatio() {},
  dispose() { this.disposeCount++; },
};
const fakeCanvas = { clientWidth: 800, clientHeight: 600 };
const RENDER_OPTS = {
  style: 'roblox', renderQuality: 'medium', mapDetailQuality: 'high',
  previewViewport: { width: 800, height: 600, panelColumns: 1 },
  sharedRenderer: fakeRenderer,
};

/** Wspoldzielone singletony modulowe — ZADEN nie ma prawa zostac zwolniony przez scene. */
function sharedSingletons() {
  const out = [M.TEREN_MATERIAL, M.LAS_MATERIAL, M.DJUNGLA_MATERIAL, M.DEKOR_MATERIAL,
    M.coastWaterMaterial(), M.coastSandMaterial()];
  for (let v = 0; v < 5; v++) {
    out.push(M.goraGeometria(v), M.wzgorzeGeometria(v), M.lasGeometria(v));
  }
  for (const lite of [true, false]) out.push(...Object.values(M.getCoastSharedGeometries(lite)));
  return out.filter(Boolean);
}
/**
 * Zmergowane grupy styledOverlays wylowione z grafu sceny (flaga MERGED_DECOR na grupie).
 * Warunek isGroup jest istotny: collapseToMergedMesh stawia te sama flage TAKZE na samym
 * zmergowanym meshu (patrz D4 wyzej), wiec bez niego kazda grupa liczylaby sie podwojnie.
 */
const mergedGroupsFrom = (objs) =>
  objs.filter((o) => o && o.isGroup === true && o.userData && o.userData[M.MERGED_DECOR_FLAG] === true);
/** Zasoby GPU nalezace do zmergowanej grupy: geometria + material jej jedynego dziecka. */
function mergedResources(groups) {
  const res = [];
  for (const g of groups) {
    const child = g.children[0];
    if (child && child.geometry) res.push(child.geometry, child.material);
  }
  return res;
}

(async () => {
  // --- T1 (kontrola): budowa konczy sie sukcesem, dispose() zwalnia zmergowane grupy.
  addedObjects = [];
  const okRes = await M.buildScene(map, fakeCanvas, RENDER_OPTS);
  const collapsedCount = okRes.buildTimings.detail.nakladki.scalMergeCollapsed;
  const okMerged = mergedGroupsFrom(addedObjects);
  ok(collapsedCount > 0, `T1: buildScene faktycznie scalil grupy (collapsed=${collapsedCount})`);
  // Kotwica kompletnosci przechwytywania: gdyby graf sceny gubil grupy, kolejne asercje
  // badalyby probke zamiast calosci i „zero wyciekow" nic by nie znaczylo.
  ok(
    okMerged.length === collapsedCount,
    `T1: z grafu sceny wylowiono WSZYSTKIE zmergowane grupy (${okMerged.length}/${collapsedCount})`,
  );
  const okRes1 = mergedResources(okMerged);
  okRes.dispose();
  ok(
    okRes1.length > 0 && okRes1.every((r) => disposeCalls.get(r) === 1),
    'T1: po udanej budowie dispose() zwalnia kazdy zasob zmergowanej grupy dokladnie 1x',
  );
  ok(fakeRenderer.disposeCount === 0, 'T1: wspoldzielony renderer NIE zwalniany (ownRenderer=false)');

  // --- T2 (mutacja): wyjatek TUZ PO fazie merge — scenariusz ze zgloszenia.
  const realRiverPaths = map.riverPaths;
  const BOOM_MERGE = new Error('T2-inject-po-fazie-merge');
  let armed = false;
  Object.defineProperty(map, 'riverPaths', {
    configurable: true,
    get() { if (armed) throw BOOM_MERGE; return realRiverPaths; },
  });
  addedObjects = [];
  disposeCalls.clear();
  const sharedBefore = sharedSingletons();
  let caught = null;
  try {
    await M.buildScene(map, fakeCanvas, RENDER_OPTS, (pct) => { if (pct >= 90) armed = true; });
  } catch (err) { caught = err; }
  Object.defineProperty(map, 'riverPaths', { configurable: true, writable: true, value: realRiverPaths });

  ok(caught === BOOM_MERGE, 'T2: buildScene przepuszcza TEN SAM blad dalej (nie polyka, nie podmienia)');
  const boomMerged = mergedGroupsFrom(addedObjects);
  ok(boomMerged.length > 0, `T2: przed wyjatkiem powstaly zmergowane grupy (${boomMerged.length})`);
  const boomRes = mergedResources(boomMerged);
  const freed = boomRes.filter((r) => disposeCalls.get(r) === 1).length;
  // TA asercja jest cala pointa zgloszenia: bez try/catch w buildScene freed === 0.
  ok(
    boomRes.length > 0 && freed === boomRes.length,
    `T2: porzucona scena zwolnila KAZDY zasob zmergowanej grupy (${freed}/${boomRes.length})`,
  );
  ok(
    addedObjects.some((o) => o && o.isInstancedMesh && disposeCalls.get(o.geometry) === 1),
    'T2: porzucona scena zwolnila takze geometrie InstancedMesh (nie tylko merge)',
  );
  ok(
    sharedBefore.every((s) => !disposeCalls.has(s)),
    'T2: sprzatanie po wyjatku NIE tyka wspoldzielonych singletonow modulowych',
  );
  ok(fakeRenderer.disposeCount === 0, 'T2: sprzatanie po wyjatku NIE zwalnia cudzego renderera');

  // --- T3 (mutacja): wyjatek PO utworzeniu oceanu i ramki swiata — dowod, ze rejestr
  // sceneTeardown realnie sie drenuje (ocean/ramka nie sa juz widoczne dla dispose()).
  const realSzer = map.szerokoscQ;
  const BOOM_TAIL = new Error('T3-inject-po-oceanie');
  const oceanBuilt = () => addedObjects.some((o) => o && o.isMesh && o.renderOrder === -10);
  Object.defineProperty(map, 'szerokoscQ', {
    configurable: true,
    get() { if (oceanBuilt()) throw BOOM_TAIL; return realSzer; },
  });
  addedObjects = [];
  disposeCalls.clear();
  let caughtTail = null;
  try { await M.buildScene(map, fakeCanvas, RENDER_OPTS); } catch (err) { caughtTail = err; }
  Object.defineProperty(map, 'szerokoscQ', { configurable: true, writable: true, value: realSzer });

  ok(caughtTail === BOOM_TAIL, 'T3: blad z fazy finalowej tez leci dalej nietkniety');
  const oceanIdx = addedObjects.findIndex((o) => o && o.isMesh && o.renderOrder === -10);
  const tailMeshes = oceanIdx < 0 ? [] : addedObjects.slice(oceanIdx).filter((o) => o && o.isMesh && o.geometry);
  ok(tailMeshes.length >= 5, `T3: ocean + listwy ramki trafily do sceny (${tailMeshes.length} meshy, min. 1+4)`);
  ok(
    tailMeshes.length > 0 && tailMeshes.every((m) => disposeCalls.get(m.geometry) === 1),
    'T3: ocean i ramka swiata zwolnione przez rejestr sceneTeardown mimo wyjatku',
  );
  ok(
    sharedSingletons().every((s) => !disposeCalls.has(s)),
    'T3: sprzatanie fazy finalowej tez nie tyka wspoldzielonych singletonow',
  );

  // --- T4 (mutacja): wyjatek W POLOWIE petli merge, nie po niej. Petla oddaje klatke
  // przez `await c3NextFrame()` — a to jedyne miejsce w niej POZA wewnetrznym try/catch,
  // ktory swiadomie polyka bledy pojedynczej grupy ('[civ] overlay item failed'). Rzucenie
  // z requestAnimationFrame odwzorowuje wiec realna, jedyna droga ucieczki wyjatku z tej
  // fazy — i zostawia pool nakladek W POLOWIE scalony (czesc grup zmergowana, reszta nie).
  const BOOM_MID = new Error('T4-inject-w-trakcie-merge');
  const realRaf = globalThis.requestAnimationFrame;
  let armedMid = false;
  globalThis.requestAnimationFrame = (cb) => {
    if (armedMid) { armedMid = false; throw BOOM_MID; }
    return realRaf(cb);
  };
  addedObjects = [];
  disposeCalls.clear();
  let caughtMid = null;
  try {
    await M.buildScene(map, fakeCanvas, RENDER_OPTS, (pct, label) => {
      if (label === M.SCENE_BUILD_PHASE_LABELS.overlays) armedMid = true;
    });
  } catch (err) { caughtMid = err; }
  globalThis.requestAnimationFrame = realRaf;

  ok(caughtMid === BOOM_MID, 'T4: wyjatek z wnetrza petli merge leci dalej nietkniety');
  const midMerged = mergedGroupsFrom(addedObjects);
  // Kotwica „to naprawde srodek fazy": czesc puli juz scalona, ale NIE cala (38 = komplet).
  ok(
    midMerged.length > 0 && midMerged.length < collapsedCount,
    `T4: wyjatek trafil w SRODEK fazy merge (${midMerged.length} z ${collapsedCount} grup scalonych)`,
  );
  const midRes = mergedResources(midMerged);
  const midFreed = midRes.filter((r) => disposeCalls.get(r) === 1).length;
  ok(
    midRes.length > 0 && midFreed === midRes.length,
    `T4: pol-scalona pula nakladek zwolniona w calosci (${midFreed}/${midRes.length})`,
  );
  ok(
    sharedSingletons().every((s) => !disposeCalls.has(s)),
    'T4: sprzatanie pol-scalonej puli nie tyka wspoldzielonych singletonow',
  );

  console.log(`\nmerge-decor-no-regress-test: ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
})().catch((err) => {
  console.error('merge-decor-no-regress-test: BLAD HARNESSU', err);
  process.exit(1);
});
