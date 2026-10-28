'use strict';
/**
 * web-memory-leaks-test.cjs — R-WEB-MEMORY-LEAKS-RELEASE-ROBOCZA-Q1 (runda 2)
 * Run: cd gra && node tools/web-memory-leaks-test.cjs
 *
 * Dowody jednostkowe dla poprawek z 5f5eea8f (M1 dispose modeli miast, M2 przycinanie cache
 * plakietek, ?memdebug=1) + statyczna straznica M3 (nasluchiwacze battleScene). M3 w
 * przegladarce NIE jest weryfikowane (BattleScene wymaga pelnego DOM/WebGL).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.web-memory-leaks-entry.ts');
const BUNDLE = path.join(__dirname, '.web-memory-leaks-bundle.cjs');
fs.writeFileSync(ENTRY, `
import * as THREE from 'three';
export { THREE };
export { CityRenderer } from '../src/render/cities';
export { isMemDebugEnabled, logRendererMemoryAtTurnEnd } from '../src/render/memDebug';
export { disposeTransientObject3D, markSharedTransientGeometry, markSharedTransientMaterial, cloneTransientMaterial, cloneObject3DMaterialsForTransient } from '../src/render/transientObjectResources';
export { buildSettlementModel } from '../src/render/settlementModel';
export { buildImprovementSectored } from '../src/render/improvements';
`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'] });

function makeStubCtx() {
  return {
    setTransform() {}, save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {}, closePath() {}, fill() {}, stroke() {}, clip() {}, arc() {},
    clearRect() {}, fillRect() {}, rect() {}, translate() {}, rotate() {}, scale() {},
    drawImage() {}, createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    measureText: (s) => ({ width: String(s).length * 9 }), fillText() {},
    font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: '', textBaseline: '', globalAlpha: 1,
  };
}
function makeStubCanvas() {
  const c = { width: 300, height: 150, nodeName: 'CANVAS', _ctx: null };
  c.getContext = () => (c._ctx || (c._ctx = makeStubCtx()));
  return c;
}
global.document = { createElement: (t) => (t === 'canvas' ? makeStubCanvas() : {}) };
global.window = { devicePixelRatio: 1 };
global.self = global;
global.Image = class {
  constructor() { this.width = 64; this.height = 64; }
  set src(v) { if (this.onload) this.onload(); }
  get src() { return ''; }
};
global.HTMLImageElement = global.Image;
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) { passed++; console.log('PASS:', m); } else { failed++; console.error('FAIL:', m); } };
const eq = (g, w, m) => assert(g === w, `${m} (got=${JSON.stringify(g)} want=${JSON.stringify(w)})`);
function load() { delete require.cache[BUNDLE]; return require(BUNDLE); }

// --- [1] memDebug ---------------------------------------------------------------------
console.log('\n[1] memDebug');
const fakeRenderer = { info: { memory: { geometries: 11, textures: 7 }, programs: [1, 2, 3] } };
const logged = [];
const origLog = console.log;
global.location = { search: '' };
let M = load();
console.log = (...a) => logged.push(a.join(' '));
M.logRendererMemoryAtTurnEnd(fakeRenderer, 5, { cityModels: 2 });
console.log = origLog;
eq(M.isMemDebugEnabled(), false, 'bez parametru: isMemDebugEnabled=false');
eq(logged.length, 0, 'bez parametru: zero wyjscia (no-op)');
global.location = { search: '?memdebug=1' };
M = load();
console.log = (...a) => logged.push(a.join(' '));
M.logRendererMemoryAtTurnEnd(fakeRenderer, 5, { cityModels: 2, cityBadgeTextures: 3 });
console.log = origLog;
eq(M.isMemDebugEnabled(), true, '?memdebug=1: isMemDebugEnabled=true');
eq(logged.length, 1, '?memdebug=1: dokladnie jedna linia na wywolanie');
assert(/^\[memdebug\] koniec tury=5 · geometries=11 · textures=7 · programs=3 · cityModels=2 · cityBadgeTextures=3/.test(logged[0]),
  'format linii memdebug zgodny (tura, geometries, textures, programs, extra)');
global.location = { search: '?memdebug=0' };
M = load();
eq(M.isMemDebugEnabled(), false, '?memdebug=0: wylaczony');

// --- [2] M2 ---------------------------------------------------------------------------
console.log('\n[2] M2 pruneUnusedStatChipTextures / getMemDebugCounts');
const scene = new M.THREE.Scene();
const cr = new M.CityRenderer(scene, { hexes: {} });
const cities = [
  { id: 'a', ownerId: 0, q: 0, r: 0, name: 'Ateny', population: 5 },
  { id: 'b', ownerId: 1, q: 4, r: 0, name: 'Rzym', population: 7 },
];
const opts = { playerOwnerId: 0, isVisible: () => true, hideStatChips: false };
cr.sync(cities, opts);
const liveCount = cr.statTexCache.size;
assert(liveCount >= 2, 'po sync: tekstury plakietek zywych miast w cache (kontrola harnessu)');
let disposed = 0;
const orphan = new M.THREE.Texture();
orphan.dispose = () => { disposed++; };
cr.statTexCache.set('SIEROTA|l0', orphan);
eq(cr.getMemDebugCounts().badgeTextures, liveCount + 1, 'getMemDebugCounts.badgeTextures = rozmiar statTexCache');
eq(cr.getMemDebugCounts().cityModels, 2, 'getMemDebugCounts.cityModels = liczba modeli miast');
eq(cr.pruneUnusedStatChipTextures(), 1, 'prune zwraca liczbe zwolnionych (1 sierota)');
eq(disposed, 1, 'sierota dostala dispose()');
eq(cr.statTexCache.has('SIEROTA|l0'), false, 'sierota usunieta z cache');
eq(cr.statTexCache.size, liveCount, 'tekstury zywych sprite NIE zwolnione');
eq(cr.pruneUnusedStatChipTextures(), 0, 'drugie wywolanie: 0 (idempotentne)');
const keysBefore = new Set(cr.statTexCache.keys());
cities[0].population = 6;
cr.sync(cities, opts);
const keysAfter = [...cr.statTexCache.keys()];
assert(keysAfter.some((k) => !keysBefore.has(k)), 'zmiana populacji: powstal nowy klucz tekstury');
eq(keysAfter.filter((k) => keysBefore.has(k)).length, liveCount - 1, 'stara tekstura zmienionego miasta zwolniona przez sync(), druga zostaje');
eq(cr.statTexCache.size, liveCount, 'rozmiar cache staly po zmianie tekstu (brak kumulacji)');
for (let i = 7; i < 40; i++) { cities[0].population = i; cr.sync(cities, opts); }
eq(cr.statTexCache.size, liveCount, '33 kolejne zmiany populacji: cache nadal staly');

// --- [3] M1 ---------------------------------------------------------------------------
console.log('\n[3] M1 dispose geometrii/materialow starego modelu');
const scene2 = new M.THREE.Scene();
const cr2 = new M.CityRenderer(scene2, { hexes: {} });
const c = [{ id: 'x', ownerId: 0, q: 0, r: 0, name: 'Teby', population: 2 }];
cr2.sync(c, opts);
const findGroup = () => scene2.children.find((o) => o.type === 'Group');
const grp1 = findGroup();
assert(!!grp1, 'model miasta w scenie (kontrola harnessu)');
const geos = new Set(), mats = new Set();
grp1.traverse((o) => {
  if (o.isMesh) {
    geos.add(o.geometry);
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
  }
});
assert(geos.size > 0 && mats.size > 0, `model ma wlasne zasoby (geos=${geos.size}, mats=${mats.size})`);
eq((grp1.userData.perCityGeos || []).length, geos.size, 'userData.perCityGeos zarejestrowane dla modelu (galaz roblox)');
eq((grp1.userData.mats || []).length, mats.size, 'userData.mats zarejestrowane dla modelu');
let geoDisp = 0, matDisp = 0;
geos.forEach((g) => g.addEventListener('dispose', () => geoDisp++));
mats.forEach((m) => m.addEventListener('dispose', () => matDisp++));
let rebuilt = false;
for (const pop of [6, 12, 20, 30, 45, 60, 80]) {
  c[0].population = pop; cr2.sync(c, opts);
  if (findGroup() !== grp1) { rebuilt = true; break; }
}
assert(rebuilt, 'wzrost populacji spowodowal przebudowe modelu (nowa grupa w scenie)');
eq(geoDisp, geos.size, 'WSZYSTKIE geometrie starego modelu zwolnione (dispose)');
eq(matDisp, mats.size, 'WSZYSTKIE materialy starego modelu zwolnione (dispose)');
eq(scene2.children.includes(grp1), false, 'stary model zdjety ze sceny');
const grp2 = findGroup();
let newDisposed = false;
grp2.traverse((o) => { if (o.isMesh) o.geometry.addEventListener('dispose', () => { newDisposed = true; }); });
cr2.sync(c, opts);
eq(newDisposed, false, 'nowy model NIE jest zwalniany przy kolejnym sync bez zmiany klucza');

// --- [4] M3 ---------------------------------------------------------------------------
console.log('\n[4] M3 straznica statyczna battleScene.ts (NIE jest dowodem runtime)');
const bs = fs.readFileSync(path.join(GRA, 'src', 'battle', 'battleScene.ts'), 'utf8');
const reDoc = /document\.removeEventListener\('click', this\._deployToolbarDocClick\)/g;
assert(reDoc.test(bs), 'zdejmowanie _deployToolbarDocClick z document obecne');
assert((bs.match(reDoc) || []).length >= 2, 'rebuild paska zdejmuje stary nasluchiwacz + dispose (>=2 miejsca)');
assert(/window\.removeEventListener\('resize', this\._deployLayoutListener\)/.test(bs), 'dispose zdejmuje _deployLayoutListener z window');

// --- [5] transient world-map previews and clearing markers ------------------------------
console.log('\n[5] zasoby transient ghostów i znaczników wyrębu');
const { disposeTransientObject3D, markSharedTransientGeometry, markSharedTransientMaterial, cloneTransientMaterial, cloneObject3DMaterialsForTransient, buildSettlementModel, buildImprovementSectored } = M;
const transientRoot = new M.THREE.Group();
const ownedGeometry = new M.THREE.BoxGeometry(1, 1, 1);
const sharedGeometry = markSharedTransientGeometry(new M.THREE.BoxGeometry(2, 2, 2));
const ownedMaterial = new M.THREE.MeshBasicMaterial();
const sharedMaterial = markSharedTransientMaterial(new M.THREE.MeshBasicMaterial());
const ownedMesh1 = new M.THREE.Mesh(ownedGeometry, ownedMaterial);
const ownedMesh2 = new M.THREE.Mesh(ownedGeometry, ownedMaterial); // duplicate references dispose once
transientRoot.add(ownedMesh1, ownedMesh2, new M.THREE.Mesh(sharedGeometry, sharedMaterial));
let ownedGeoDispose = 0, sharedGeoDispose = 0, ownedMatDispose = 0, sharedMatDispose = 0;
ownedGeometry.addEventListener('dispose', () => ownedGeoDispose++);
sharedGeometry.addEventListener('dispose', () => sharedGeoDispose++);
ownedMaterial.addEventListener('dispose', () => ownedMatDispose++);
sharedMaterial.addEventListener('dispose', () => sharedMatDispose++);
disposeTransientObject3D(transientRoot);
eq(ownedGeoDispose, 1, 'własna geometria meshów transient dispose tylko raz');
eq(sharedGeoDispose, 0, 'oznaczona współdzielona geometria pozostaje żywa');
eq(ownedMatDispose, 1, 'współdzielony przez dzieci materiał transient dispose tylko raz');
eq(sharedMatDispose, 0, 'oznaczony współdzielony materiał cache pozostaje żywy');
const cachedSourceMat = markSharedTransientMaterial(new M.THREE.MeshBasicMaterial());
const clonedGhostMat = cloneTransientMaterial(cachedSourceMat);
let sourceMatStillLive = 0, ghostMatDisposed = 0;
cachedSourceMat.addEventListener('dispose', () => sourceMatStillLive++);
clonedGhostMat.addEventListener('dispose', () => ghostMatDisposed++);
const materialGhost = new M.THREE.Group();
materialGhost.add(new M.THREE.Mesh(new M.THREE.BoxGeometry(), clonedGhostMat));
disposeTransientObject3D(materialGhost);
eq(ghostMatDisposed, 1, 'klon materiału cache należy do ghosta i jest zwalniany');
eq(sourceMatStillLive, 0, 'materiał źródłowy cache pozostaje żywy po zwolnieniu ghosta');

const clearingMarker = buildImprovementSectored(['wyrab']);
let clearingGeoCount = 0, clearingGeoDispose = 0;
const clearingSourceMaterials = new Set();
clearingMarker.traverse((obj) => {
  const mesh = obj;
  if (mesh.isMesh) {
    clearingGeoCount++;
    mesh.geometry.addEventListener('dispose', () => clearingGeoDispose++);
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((material) => clearingSourceMaterials.add(material));
  }
});
assert(clearingGeoCount > 0, 'wyrąb ma geometrie modelu do zwolnienia');
let clearingSourceMatDispose = 0;
clearingSourceMaterials.forEach((material) => material.addEventListener('dispose', () => clearingSourceMatDispose++));
cloneObject3DMaterialsForTransient(clearingMarker, (material) => { material.transparent = true; material.opacity = 0.52; });
eq(clearingSourceMatDispose, clearingSourceMaterials.size, 'zastąpione, własne materiały ghosta zwolnione po sklonowaniu');
const clearingCloneMaterials = new Set();
clearingMarker.traverse((obj) => { if (obj.isMesh) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => clearingCloneMaterials.add(m)); });
assert([...clearingCloneMaterials].every((material) => !clearingSourceMaterials.has(material)), 'ghost używa wyłącznie własnych klonów materiałów');
let clearingCloneDispose = 0;
clearingCloneMaterials.forEach((material) => material.addEventListener('dispose', () => clearingCloneDispose++));
disposeTransientObject3D(clearingMarker);
eq(clearingGeoDispose, clearingGeoCount, 'wszystkie geometrie świeżego znacznika wyrębu zwolnione');
eq(clearingCloneDispose, clearingCloneMaterials.size, 'wszystkie klonowane materiały ghosta zwolnione po jego usunięciu');

const cityGhost = buildSettlementModel(1, 'grecja', 1, 0xffd54a, true);
const cachedCityGeometries = new Set();
cityGhost.traverse((obj) => { if (obj.isMesh && obj.geometry.userData.sharedTransientGeometry) cachedCityGeometries.add(obj.geometry); });
assert(cachedCityGeometries.size > 0, 'ghost miasta wskazuje cache geometrii muru oznaczony jako współdzielony');
let cachedCityDisposed = 0;
cachedCityGeometries.forEach((geo) => geo.addEventListener('dispose', () => cachedCityDisposed++));
disposeTransientObject3D(cityGhost);
eq(cachedCityDisposed, 0, 'usuwanie ghosta miasta nie zwalnia geometrii muru używanej też przez live miasta');
const liveCityUsingCache = buildSettlementModel(1, 'grecja', 1, 0xffd54a, true);
const liveCityHasCache = [];
liveCityUsingCache.traverse((obj) => { if (obj.isMesh && cachedCityGeometries.has(obj.geometry)) liveCityHasCache.push(obj.geometry); });
assert(liveCityHasCache.length > 0, 'kolejny live model miasta nadal korzysta ze współdzielonego cache');

const improvementGhost = buildImprovementSectored(['kopalnia_cyny']);
const cachedImprovementGeometries = new Set();
const cachedImprovementMaterials = new Set();
improvementGhost.traverse((obj) => {
  if (!obj.isMesh) return;
  if (obj.geometry.userData.sharedTransientGeometry) cachedImprovementGeometries.add(obj.geometry);
  if (obj.material.userData.sharedTransientMaterial) cachedImprovementMaterials.add(obj.material);
});
assert(cachedImprovementGeometries.size > 0, 'ghost kopalni cyny wskazuje oznaczone geometrie cache');
let cachedImprovementDisposed = 0;
cachedImprovementGeometries.forEach((geo) => geo.addEventListener('dispose', () => cachedImprovementDisposed++));
let cachedImprovementMaterialsDisposed = 0;
cachedImprovementMaterials.forEach((mat) => mat.addEventListener('dispose', () => cachedImprovementMaterialsDisposed++));
cloneObject3DMaterialsForTransient(improvementGhost, (material) => { material.transparent = true; material.opacity = 0.52; });
eq(cachedImprovementMaterialsDisposed, 0, 'zastępowanie materiałów ghosta nie zwalnia oznaczonych źródeł cache');
const cachedMineCloneMaterials = new Set();
improvementGhost.traverse((obj) => { if (obj.isMesh) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => cachedMineCloneMaterials.add(m)); });
assert([...cachedMineCloneMaterials].every((material) => !material.userData.sharedTransientMaterial), 'klony materiałów cache są oznaczone jako zasoby własne ghosta');
let cachedMineCloneDisposals = 0;
cachedMineCloneMaterials.forEach((material) => material.addEventListener('dispose', () => cachedMineCloneDisposals++));
disposeTransientObject3D(improvementGhost);
eq(cachedImprovementDisposed, 0, 'usuwanie ghosta kopalni nie zwalnia geometrii używanej przez live ulepszenie');
assert(cachedImprovementMaterials.size > 0, 'ghost kopalni wskazuje oznaczone materiały cache');
eq(cachedImprovementMaterialsDisposed, 0, 'usuwanie ghosta kopalni nie zwalnia materiałów używanych przez live ulepszenie');
eq(cachedMineCloneDisposals, cachedMineCloneMaterials.size, 'klony materiałów cache są zwalniane wraz z ghostem');

const mainSource = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
assert(/function disposeGhostObject3D\(g: THREE\.Object3D\): void \{\s*disposeTransientObject3D\(g\);/.test(mainSource), 'ghost builderów deleguje disposal do helpera zasobów transient');
assert(/function removeClearingMesh[\s\S]*?disposeTransientObject3D\(old\)/.test(mainSource), 'zastępowany znacznik wyrębu zwalnia zasoby');
assert(/function syncClearingMeshesFromState[\s\S]*?disposeTransientObject3D\(mesh\)/.test(mainSource), 'reset stanu wyrębu zwalnia stare zasoby');
assert(/function clearAllHexClearing[\s\S]*?disposeTransientObject3D\(mesh\)/.test(mainSource), 'czyszczenie wyrębu zwalnia zasoby');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
