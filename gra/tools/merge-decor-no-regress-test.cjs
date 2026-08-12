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
