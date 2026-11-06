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
 *         i kazda geometria dostala dispose dokladnie wtedy, gdy nikt jej juz nie uzywa.
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
      try { const grp = n ? M.buildUnitModel(c, col, n) : M.buildUnitModel(c, col); models.push({ grp, owned: grp.userData.perTokenGeos || [], kind: 'unit' }); } catch (e) { buildErr++; }
    }
    for (let k = 0; k < COPIES; k++) for (const col of OWNERS) for (const lvl of [1, 2, 3, 4]) {
      for (const [kind, fn] of [['kamien', () => M.buildMiastoKamien(lvl, { mur: lvl > 2, color: col })], ['braz', () => M.buildMiastoBraz('egipt', lvl, { mur: lvl > 2, palisada: false, color: col })]]) {
        try {
          const grp = fn(); const geos = new Set(); grp.traverse((o) => { if (o.isMesh) geos.add(o.geometry); });
          models.push({ grp, owned: [...geos], kind });
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

  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  console.log(`\nWYNIK: ${pass} OK / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
