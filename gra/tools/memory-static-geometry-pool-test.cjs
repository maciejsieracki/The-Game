'use strict';
/**
 * memory-static-geometry-pool-test.cjs -- R-WEB-MEMORY-STATIC-FOOTPRINT-Q1 (B/C): wspolne geometrie modeli jednostek
 * i miast (`render/geometryContentPool.ts`, wolane z UnitRenderer._registerToken i CityRenderer._registerModel).
 *
 *   P1 -- dwa modele z identyczna geometria -> jedna instancja; inna tresc -> osobna; tablica `owned` zmieniana w miejscu;
 *   P2 -- licznik odwolan: dispose dopiero po ostatnim zwolnieniu; geometria niewspolna zwalniana od razu;
 *   P3 -- geometria z userData (np. markSharedTransientGeometry), z nazwa lub nieuzywana w drzewie -> nietknieta;
 *   P4 -- REALNE modele jednostek (buildUnitModel, wszystkie kategorie x typy z danych) i miast (buildMiastoKamien/Braz):
 *         po pooling kazdy mesh ma geometrie o bitowo tej samej tresci co przed (pozycje/normalne/uv/indeks/grupy),
 *         liczba unikalnych geometrii i bajty atrybutow spadaja (raport), a po zwolnieniu wszystkich modeli pula jest pusta
 *         i kazda geometria dostala dispose dokladnie wtedy, gdy nikt jej juz nie uzywa;
 *   P5 -- materialy (`render/materialContentPool.ts`) na tych samych modelach: stan kazdego materialu meshu (toJSON bez
 *         uuid) identyczny, mniej unikalnych materialow, kopia przy zapisie (`unshareMaterials`, uzywana przez
 *         przyciemnienie odroczenia) nie przenosi mutacji na inne modele, po zwolnieniu pula pusta;
 *   P6 -- material z tekstura / z userData nie trafia do puli; rozny kolor -> osobne instancje.
 * Usage: node tools/memory-static-geometry-pool-test.cjs --gra <kopia gra z node_modules (esbuild, three)>
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const argv = process.argv;
const opt = (n) => (argv.indexOf('--' + n) !== -1 ? argv[argv.indexOf('--' + n) + 1] : null);
const GRA = opt('gra');
if (!GRA) { console.error('podaj --gra <kopia gra z node_modules>'); process.exit(2); }
let pass = 0; let fail = 0;
const ok = (label, cond, detail) => { if (cond) { pass++; console.log('  OK  ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); } };

const SRC = path.join(__dirname, '..', 'src');
const entry = `
export * as THREE from 'three';
export { poolOwnedGeometries, releaseOwnedGeometries, geometryPoolStats } from '${SRC}/render/geometryContentPool';
export { poolOwnedMaterials, releaseOwnedMaterials, unshareMaterials, materialPoolStats } from '${SRC}/render/materialContentPool';
export { buildUnitModel } from '${SRC}/render/units';
export { buildMiastoKamien } from '${SRC}/render/miasto-kamien';
export { buildMiastoBraz } from '${SRC}/render/miasto-braz';
`;

function installDomStubs() {
  // Buildery jednostek rysuja czasem tekstury na <canvas>; w Node wystarczy atrapa kontekstu 2D.
  const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'measureText' ? () => ({ width: 10 }) : (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') ? () => ({ addColorStop() {} }) : (k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {}))), set: (t, k, v) => { t[k] = v; return true; } });
  const mkCanvas = () => ({ width: 64, height: 64, style: {}, getContext: () => ctx, addEventListener() {}, toDataURL: () => '' });
  global.document = { createElement: (tag) => (tag === 'canvas' ? mkCanvas() : { style: {}, appendChild() {}, setAttribute() {} }), createElementNS: () => mkCanvas(), body: { appendChild() {} } };
  global.window = global.window || { devicePixelRatio: 1, addEventListener() {}, location: { search: '' } };
  global.self = global.window;
  global.OffscreenCanvas = function (w, h) { return Object.assign(mkCanvas(), { width: w, height: h }); };
}

async function main() {
  const esbuild = require(path.join(path.resolve(GRA), 'node_modules', 'esbuild'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-mem2-pooltest-'));
  const out = path.join(tmpDir, 'bundle.cjs');
  try {
    await esbuild.build({
      stdin: { contents: entry, resolveDir: path.resolve(GRA), loader: 'ts' },
      bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error',
      nodePaths: [path.join(path.resolve(GRA), 'node_modules')], loader: { '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl', '.mp3': 'dataurl', '.svg': 'dataurl' },
    });
    installDomStubs();
    const M = require(out);
    const { THREE, poolOwnedGeometries, releaseOwnedGeometries, geometryPoolStats } = M;
    const disposed = new Map();
    const watch = (g) => { if (!g.__w) { g.__w = 1; g.addEventListener('dispose', () => disposed.set(g, (disposed.get(g) || 0) + 1)); } return g; };

    // P1/P2
    const mat = new THREE.MeshBasicMaterial();
    const mk = (geo) => { const grp = new THREE.Group(); grp.add(new THREE.Mesh(geo, mat)); return grp; };
    const g1 = watch(new THREE.BoxGeometry(1, 2, 3)); const g2 = watch(new THREE.BoxGeometry(1, 2, 3)); const g3 = watch(new THREE.BoxGeometry(1, 2, 4));
    const m1 = mk(g1); const m2 = mk(g2); const m3 = mk(g3);
    const o1 = [g1]; const o2 = [g2]; const o3 = [g3];
    poolOwnedGeometries(m1, o1); poolOwnedGeometries(m2, o2); poolOwnedGeometries(m3, o3);
    ok('P1 identyczna tresc -> ta sama instancja', m2.children[0].geometry === g1 && o2[0] === g1, { same: m2.children[0].geometry === g1 });
    ok('P1 inna tresc -> osobna instancja', m3.children[0].geometry === g3 && o3[0] === g3);
    ok('P2 duplikat zwolniony od razu', disposed.get(g2) === 1 && !disposed.has(g1));
    releaseOwnedGeometries(o1);
    ok('P2 po pierwszym zwolnieniu wspolna zyje', !disposed.has(g1));
    releaseOwnedGeometries(o2);
    ok('P2 po ostatnim zwolnieniu dispose', disposed.get(g1) === 1);
    releaseOwnedGeometries(o3);
    ok('P2 pula pusta', geometryPoolStats().shared === 0, geometryPoolStats());
    // P3
    const ga = watch(new THREE.BoxGeometry(1, 1, 1)); ga.userData.sharedTransientGeometry = true;
    const gb = watch(new THREE.BoxGeometry(1, 1, 1)); gb.userData.sharedTransientGeometry = true;
    const gn = watch(new THREE.BoxGeometry(1, 1, 1)); gn.name = 'x';
    const gu = watch(new THREE.BoxGeometry(1, 1, 1)); // nieuzyta w drzewie
    const ma = mk(ga); const mb = mk(gb); const mn = mk(gn);
    const oa = [ga]; const ob = [gb, gu]; const on = [gn];
    poolOwnedGeometries(ma, oa); poolOwnedGeometries(mb, ob); poolOwnedGeometries(mn, on);
    ok('P3 userData/nazwa/nieuzyta -> bez zmian', mb.children[0].geometry === gb && ob[1] === gu && mn.children[0].geometry === gn && geometryPoolStats().shared === 0, geometryPoolStats());
    releaseOwnedGeometries(oa); releaseOwnedGeometries(ob); releaseOwnedGeometries(on);
    ok('P3 zwolnione jak dotad (od razu)', disposed.get(ga) === 1 && disposed.get(gb) === 1 && disposed.get(gu) === 1 && disposed.get(gn) === 1);

    // P4 realne modele
    const dataDir = path.join(__dirname, '..', 'data');
    const unitNames = [];
    for (const f of fs.readdirSync(dataDir).filter((x) => /unit|jednost/i.test(x) && x.endsWith('.json'))) {
      try { const j = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')); const arr = Array.isArray(j) ? j : Object.values(j); for (const u of arr) if (u && typeof (u.name || u.Jednostka) === 'string') unitNames.push(u.name || u.Jednostka); } catch { /* inne formaty */ }
    }
    const cats = ['melee', 'ranged', 'cavalry', 'siege', 'settler', 'worker', 'scout', 'naval', 'super', 'general'];
    const specs = [];
    for (const c of cats) specs.push([c, undefined]);
    for (const n of unitNames.slice(0, 200)) specs.push(['melee', n]);
    const sig = (g) => { const parts = []; for (const k of Object.keys(g.attributes).sort()) parts.push(k + ':' + Buffer.from(g.attributes[k].array.buffer, g.attributes[k].array.byteOffset, g.attributes[k].array.byteLength).toString('base64')); if (g.index) parts.push('i:' + Buffer.from(g.index.array.buffer, g.index.array.byteOffset, g.index.array.byteLength).toString('base64')); parts.push(JSON.stringify(g.groups)); return parts.join('|'); };
    const bytesOf = (g) => { let b = 0; for (const k in g.attributes) b += g.attributes[k].array.byteLength; if (g.index) b += g.index.array.byteLength; return b; };
    const models = []; let buildErr = 0;
    const COPIES = 3; const OWNERS = [0xff0000, 0x0000ff];
    for (let k = 0; k < COPIES; k++) for (const col of OWNERS) for (const [c, n] of specs) {
      try { const grp = n ? M.buildUnitModel(c, col, n) : M.buildUnitModel(c, col); models.push({ grp, owned: grp.userData.perTokenGeos || [], mats: grp.userData.mats || [], kind: 'unit' }); } catch (e) { buildErr++; }
    }
    for (let k = 0; k < COPIES; k++) for (const col of OWNERS) for (const lvl of [1, 2, 3, 4]) {
      for (const [kind, fn] of [['kamien', () => M.buildMiastoKamien(lvl, { mur: lvl > 2, color: col })], ['braz', () => M.buildMiastoBraz('egipt', lvl, { mur: lvl > 2, palisada: false, color: col })]]) {
        try {
          const grp = fn(); const geos = new Set(); const mats = new Set(); grp.traverse((o) => { if (o.isMesh) { geos.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach((x) => mats.add(x)); } });
          models.push({ grp, owned: [...geos], mats: [...mats], kind });
        } catch (e) { buildErr++; }
      }
    }
    ok('P4 modele zbudowane', models.length > 100, { models: models.length, unitNames: unitNames.length, buildErr });
    const before = new Map(); const uniqBefore = new Set(); let bytesBefore = 0;
    for (const m of models) m.grp.traverse((o) => { if (o.isMesh) { before.set(o, sig(o.geometry)); if (!uniqBefore.has(o.geometry)) { uniqBefore.add(o.geometry); bytesBefore += bytesOf(o.geometry); } watch(o.geometry); } });
    for (const m of models) poolOwnedGeometries(m.grp, m.owned);
    const ownedAll = new Set(); for (const m of models) for (const g of m.owned) ownedAll.add(g);
    let mism = 0; const uniqAfter = new Set(); let bytesAfter = 0;
    for (const [o, s] of before) { if (sig(o.geometry) !== s) mism++; if (!uniqAfter.has(o.geometry)) { uniqAfter.add(o.geometry); bytesAfter += bytesOf(o.geometry); } }
    ok('P4 kazdy mesh: tresc geometrii bitowo ta sama', mism === 0, { meshes: before.size, mism });
    ok('P4 mniej unikalnych geometrii i bajtow', uniqAfter.size < uniqBefore.size / 3, { uniqBefore: uniqBefore.size, uniqAfter: uniqAfter.size, kbBefore: Math.round(bytesBefore / 1024), kbAfter: Math.round(bytesAfter / 1024) });
    let usedButDisposed = 0;
    for (const g of uniqAfter) if (disposed.has(g)) usedButDisposed++;
    ok('P4 zadna uzywana geometria nie dostala dispose', usedButDisposed === 0, { usedButDisposed });
    // zwolnij w odwrotnej kolejnosci; sprawdzaj, ze nie zwalnia sie geometrii jeszcze uzywanej
    let early = 0;
    for (let i = models.length - 1; i >= 0; i--) {
      releaseOwnedGeometries(models[i].owned);
      if (i % 50 === 0) { const live = new Set(); for (let j = 0; j < i; j++) models[j].grp.traverse((o) => { if (o.isMesh) live.add(o.geometry); }); for (const g of live) if (disposed.has(g) && ownedAll.has(g)) early++; }
    }
    ok('P4 brak przedwczesnego dispose wspolnej geometrii', early === 0, { early });
    // Geometrie spoza list `owned` (wspolne geometrie modulowe builderow, np. geoAvLeg) nie naleza do modelu i nigdy
    // nie byly przez niego zwalniane -- liczymy tylko geometrie nalezace do modeli.
    let notDisposed = 0; for (const g of ownedAll) if (!disposed.has(g)) notDisposed++;
    ok('P4 po zwolnieniu wszystkiego: pula pusta, kazda geometria zwolniona', geometryPoolStats().shared === 0 && notDisposed === 0, { pool: geometryPoolStats(), notDisposed });

    // P5 materialy (te same modele; geometrie juz zwolnione nie maja znaczenia dla stanu materialow)
    const { poolOwnedMaterials, releaseOwnedMaterials, unshareMaterials, materialPoolStats } = M;
    const mstate = (m) => { const j = m.toJSON(); delete j.uuid; delete j.metadata; return JSON.stringify(j); };
    const mDisposed = new Map();
    const mwatch = (m) => { if (!m.__w) { m.__w = 1; m.addEventListener('dispose', () => mDisposed.set(m, (mDisposed.get(m) || 0) + 1)); } return m; };
    const mBefore = new Map(); const mUniqBefore = new Set();
    const meshMats = (o) => (Array.isArray(o.material) ? o.material : [o.material]);
    for (const m of models) m.grp.traverse((o) => { if (o.isMesh) { mBefore.set(o, meshMats(o).map(mstate).join('#')); for (const x of meshMats(o)) { mUniqBefore.add(x); mwatch(x); } } });
    for (const m of models) for (const x of m.mats) mwatch(x); // takze materialy z listy modelu nieuzyte w drzewie
    for (const m of models) poolOwnedMaterials(m.grp, m.mats);
    const matsOwnedAll = new Set(); for (const m of models) for (const x of m.mats) matsOwnedAll.add(x);
    let mMism = 0; const mUniqAfter = new Set();
    for (const [o, st] of mBefore) { if (meshMats(o).map(mstate).join('#') !== st) mMism++; for (const x of meshMats(o)) mUniqAfter.add(x); }
    ok('P5 kazdy mesh: stan materialu identyczny (toJSON bez uuid)', mMism === 0, { meshes: mBefore.size, mMism });
    ok('P5 mniej unikalnych materialow', mUniqAfter.size < mUniqBefore.size / 3, { before: mUniqBefore.size, after: mUniqAfter.size, pool: materialPoolStats() });
    let mUsedDisposed = 0; for (const x of mUniqAfter) if (mDisposed.has(x)) mUsedDisposed++;
    ok('P5 zaden uzywany material nie dostal dispose', mUsedDisposed === 0, { mUsedDisposed });
    // kopia przy zapisie: model A i B dziela material; po unshare(A) zmiana A nie dotyka B
    const unitModels = models.filter((m) => m.kind === 'unit');
    let pairA = null; let pairB = null;
    outer: for (let i = 0; i < unitModels.length; i++) for (let j = i + 1; j < unitModels.length; j++) {
      const sa = new Set(unitModels[i].mats); if (unitModels[j].mats.some((x) => sa.has(x))) { pairA = unitModels[i]; pairB = unitModels[j]; break outer; }
    }
    ok('P5 sa modele ze wspolnym materialem', !!pairA);
    if (pairA) {
      const bState = []; pairB.grp.traverse((o) => { if (o.isMesh) bState.push(meshMats(o).map(mstate).join('#')); });
      unshareMaterials(pairA.grp, pairA.mats);
      const sb = new Set(pairB.mats);
      const stillShared = pairA.mats.filter((x) => sb.has(x)).length;
      for (const x of pairA.mats) { x.transparent = true; x.opacity = 0.42; }
      const bAfter = []; pairB.grp.traverse((o) => { if (o.isMesh) bAfter.push(meshMats(o).map(mstate).join('#')); });
      let aUsesOwn = true; pairA.grp.traverse((o) => { if (o.isMesh) for (const x of meshMats(o)) if (sb.has(x) && pairA.mats.length && matsOwnedAll.has(x) && !pairA.mats.includes(x)) aUsesOwn = false; });
      ok('P5 unshare: mutacja A nie zmienia B', stillShared === 0 && JSON.stringify(bState) === JSON.stringify(bAfter) && aUsesOwn, { stillShared });
    }
    for (let i = models.length - 1; i >= 0; i--) releaseOwnedMaterials(models[i].mats);
    let mNotDisposed = 0; for (const x of matsOwnedAll) if (!mDisposed.has(x)) mNotDisposed++;
    ok('P5 po zwolnieniu: pula materialow pusta, kazdy material modelu zwolniony', materialPoolStats().shared === 0 && mNotDisposed === 0, { pool: materialPoolStats(), mNotDisposed });
    // P6 materialy nie do puli
    const tex = new THREE.Texture();
    const t1 = new THREE.MeshBasicMaterial({ map: tex }); const t2 = new THREE.MeshBasicMaterial({ map: tex });
    const u1 = new THREE.MeshBasicMaterial(); u1.userData.x = 1; const u2 = new THREE.MeshBasicMaterial(); u2.userData.x = 1;
    const c1 = new THREE.MeshBasicMaterial({ color: 0x123456 }); const c2 = new THREE.MeshBasicMaterial({ color: 0x123457 });
    const g6 = new THREE.BoxGeometry(1, 1, 1);
    const mk6 = (mat) => { const grp = new THREE.Group(); grp.add(new THREE.Mesh(g6, mat)); return grp; };
    const r1 = mk6(t1); const r2 = mk6(t2); const r3 = mk6(u1); const r4 = mk6(u2); const r5 = mk6(c1); const r6 = mk6(c2);
    const l1 = [t1]; const l2 = [t2]; const l3 = [u1]; const l4 = [u2]; const l5 = [c1]; const l6 = [c2];
    poolOwnedMaterials(r1, l1); poolOwnedMaterials(r2, l2); poolOwnedMaterials(r3, l3); poolOwnedMaterials(r4, l4); poolOwnedMaterials(r5, l5); poolOwnedMaterials(r6, l6);
    ok('P6 tekstura/userData -> bez puli; rozny kolor -> osobne', r2.children[0].material === t2 && r4.children[0].material === u2 && r6.children[0].material === c2 && materialPoolStats().shared === 2, materialPoolStats());
    for (const l of [l1, l2, l3, l4, l5, l6]) releaseOwnedMaterials(l);
    ok('P6 pula pusta po zwolnieniu', materialPoolStats().shared === 0, materialPoolStats());
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  console.log(`\nWYNIK: ${pass} OK / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
