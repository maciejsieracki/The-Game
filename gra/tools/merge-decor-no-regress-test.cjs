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
export { buildZlozeKonie } from '../src/render/kon-nowy-model';`,
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
ok(
  disposeBody != null && /renderer\.dispose\(\)/.test(disposeBody) && /oceanGeo\.dispose\(\)/.test(disposeBody),
  'scene.ts: wyciete cialo to faktycznie dispose() (zawiera renderer.dispose + oceanGeo.dispose)',
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

console.log(`\nmerge-decor-no-regress-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
