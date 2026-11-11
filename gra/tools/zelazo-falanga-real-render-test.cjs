'use strict';
/**
 * zelazo-falanga-real-render-test.cjs
 *
 * HISTORIA. R-ZELAZO-MODELE-BRAKUJACE-Q1-T3 dodal dispatch „Falanga" PO NAZWIE i
 * dopracowal model hoplity. R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1 (2026-11)
 * ZASTEPUJE model hoplity modelem FALANGITY MACEDONSKIEGO: sarissa trzymana
 * OBYDWIEMA rekami + mala tarcza (pelte) przypieta do lewego przedramienia.
 * Dispatch po nazwie (sekcja A, 0a/0b), kwestia blazonu (K1-K4, 0d, H8-H10) i
 * zasady geometrii (relacje, nie nazwy) zostaja; asercje o dory/aspis hoplity
 * zastapily asercje o sarissie/pelte.
 *
 * DLACZEGO PRAWDZIWA PRZEGLADARKA. To jest model 3D (Three.js): relacje czesci
 * (obie piesci NA osi drzewca, drzewce poza korpusem, tarcza na przedramieniu)
 * mierzymy w zywym silniku, nie czytaniem zrodla. Asercje liczace same nazwy
 * mesh swieca na zielono rowniez wtedy, gdy bron przechodzi przez cialo.
 *
 * SEKCJA (E): pamiec/scalanie — zero nowej geometrii per instancja (dwie
 * instancje dziela wszystkie geometrie), zgodnosc z unitStaticMerge (brak userData
 * na meshach, dodatni wyznacznik), inne jednostki wloczne (Wlocznik, Thorakites,
 * Hieros Lochos) BEZ ZMIAN wzgledem origin/main.
 *
 * DOWOD NIETAUTOLOGICZNOSCI (R-PROC-AUTOBOT.md §9 poz. 6a): sekcja (B) buduje
 * osobny bundle dla KAZDEJ z mutacji W LOCIE (bez dotykania plikow w repo) i
 * wymaga, zeby wskazane asercje padly: dispatch, lewa dlon poza drzewcem, krotkie
 * drzewce, drzewce przez srodek korpusu, tarcza bokiem.
 *
 * Usage (z gra/): node tools/zelazo-falanga-real-render-test.cjs
 *   --shots <katalog>   zrzuty po-falanga-{zblizenie,z-daleka}.png
 *   --dist <index.html> uzyj gotowego artefaktu vite zamiast budowac go w tescie
 *   --skip-vite         pomin sekcje (G) artefaktu produkcyjnego
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[zelazo-falanga-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-falanga-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.zelazo-falanga-bundle.js');
const BUNDLE_MUT = path.resolve(__dirname, '.zelazo-falanga-bundle-mut.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const MODEL_TS = path.resolve(GRA, 'src', 'render', 'hastati-falangita.ts');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');
const CIVS_JSON = path.resolve(GRA, 'data', 'civs.json');
const POOLS_JSON = path.resolve(GRA, 'data', 'city-names-pools.json');
const VITE_BIN = path.resolve(GRA, 'node_modules', 'vite', 'bin', 'vite.js');

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const SKIP_VITE = process.argv.includes('--skip-vite');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const NAME_FALANGA = 'Falanga';
const NAME_HIEROS = 'Hieros Lochos (Święty Zastęp)';
const NAME_THORAKITES = 'Thorakites';
const NAME_WLOCZNIK = 'Włócznik';

// Stan innych jednostek WŁÓCZNICZYCH zmierzony na origin/main PRZED tematem
// R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1 (liczba mesh, trójkątów):
// zmiana ma dotyczyć WYŁĄCZNIE Falangi.
const BASELINE_INNE = {
  [NAME_WLOCZNIK]: [77, 1228],
  [NAME_THORAKITES]: [32, 430],
  [NAME_HIEROS]: [40, 552],
  'Włócznik sumeryjski': [36, 448],
};
const HOPLITA_DORY_LEN = 0.740;   // dawna jednoreczna dory (×HEX_R)

// --- kotwice źródłowe = dokładny stan PO zmianie -----------------------------
const LINE_DISPATCH =
  "  if (n.includes('falanga') || n.includes('hoplit') || n.includes('phalanx')) return newBuildFalangita(ownerColor_);";
const LINE_FALLBACK = "      return newBuildFalangita(ownerColor_);";

/**
 * Mutacje W LOCIE (nie dotykają plików repo) — każda cofa JEDEN element nowego
 * modelu i MUSI zapalić na czerwono wskazane asercje (sekcja B).
 */
const MUTACJE = [
  { id: 'M1-bez-dispatchu-po-nazwie', plik: UNITS_TS, from: LINE_DISPATCH, to: '', czerwone: ['A1'] },
  { id: 'M2-lewa-dlon-poza-drzewcem', plik: MODEL_TS,
    from: 'const gripL = gripR.clone().addScaledVector(sarDir, SA_GRIP_GAP);',
    to: 'const gripL = gripR.clone().addScaledVector(sarDir, SA_GRIP_GAP).add(new THREE.Vector3(0.12, 0, 0));',
    czerwone: ['H1'] },
  { id: 'M3-drzewce-hoplity', plik: MODEL_TS,
    from: 'const SA_SHAFT_LEN = 0.90 * HEX_R;', to: 'const SA_SHAFT_LEN = 0.60 * HEX_R;',
    czerwone: ['H3'] },
  { id: 'M4-drzewce-przez-srodek-korpusu', plik: MODEL_TS,
    from: 'const SA_GRIP_R = new THREE.Vector3(-0.10 * HEX_R,', to: 'const SA_GRIP_R = new THREE.Vector3(0.0 * HEX_R,',
    czerwone: ['H5'] },
  { id: 'M5-tarcza-bokiem', plik: MODEL_TS,
    from: 'sh.rotation.y = 0.30;', to: 'sh.rotation.y = 1.45;',
    czerwone: ['H7'] },
];

function mutationPlugin(m, counter) {
  return {
    name: 'mutacja',
    setup(build) {
      build.onLoad({ filter: /(units|hastati-falangita)\.ts$/ }, (args) => {
        const p = path.resolve(args.path);
        if (p !== m.plik) return null;
        let out = fs.readFileSync(args.path, 'utf8');
        if (out.includes(m.from)) { out = out.replace(m.from, m.to); counter.n++; }
        return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
}

async function buildBundle(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA,
    loader: { '.ts': 'ts' }, plugins: plugins || [],
    logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[zelazo-falanga-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Buduje warianty i mierzy je w żywym Three.js. */
async function measureAll(page) {
  return page.evaluate(({ nFal, nHie, nTho, nWlo, inne }) => {
    const THREE = window.__THREE;
    const buildUnitModel = window.__buildUnitModel;

    function measureGroup(g) {
      g.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      const qw = new THREE.Quaternion();
      let minY = Infinity, maxY = -Infinity, maxR = 0, meshCount = 0, tri = 0;
      let meshesWithUserData = 0, negativeDet = 0;
      const names = [];
      const box = {};
      const corners = {};
      const ctr = {};
      const axis = {};
      const colors = [];
      const geoIds = [];
      g.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
        geoIds.push(o.geometry.uuid);
        if (Object.keys(o.userData).length > 0) meshesWithUserData++;
        if (o.matrixWorld.determinant() <= 0) negativeDet++;
        if (o.material && o.material.color) colors.push(o.material.color.getHex());
        const geo = o.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        tri += (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
        const bb = geo.boundingBox;
        const cs = [];
        for (const x of [bb.min.x, bb.max.x]) {
          for (const y of [bb.min.y, bb.max.y]) {
            for (const z of [bb.min.z, bb.max.z]) cs.push([x, y, z]);
          }
        }
        let b = null;
        const world = [];
        for (const c of cs) {
          v.set(c[0], c[1], c[2]).applyMatrix4(o.matrixWorld);
          world.push(v.toArray());
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
          const r = Math.hypot(v.x, v.z);
          if (r > maxR) maxR = r;
          if (b === null) b = { minX: v.x, maxX: v.x, minY: v.y, maxY: v.y, minZ: v.z, maxZ: v.z };
          else {
            b.minX = Math.min(b.minX, v.x); b.maxX = Math.max(b.maxX, v.x);
            b.minY = Math.min(b.minY, v.y); b.maxY = Math.max(b.maxY, v.y);
            b.minZ = Math.min(b.minZ, v.z); b.maxZ = Math.max(b.maxZ, v.z);
          }
        }
        if (o.name) {
          names.push(o.name);
          box[o.name] = b;
          corners[o.name] = world;
          ctr[o.name] = new THREE.Vector3().copy(bb.min).add(bb.max)
            .multiplyScalar(0.5).applyMatrix4(o.matrixWorld).toArray();
          o.getWorldQuaternion(qw);
          axis[o.name] = {
            x: new THREE.Vector3(1, 0, 0).applyQuaternion(qw).toArray(),
            y: new THREE.Vector3(0, 1, 0).applyQuaternion(qw).toArray(),
            z: new THREE.Vector3(0, 0, 1).applyQuaternion(qw).toArray(),
          };
        }
      });
      return {
        meshCount, names, colors, box, corners, ctr, axis, tri, geoIds,
        meshesWithUserData, negativeDet,
        perTokenGeos: (g.userData['perTokenGeos'] || []).length,
        minY, maxY, maxR, height: maxY - minY,
        anchors: g.userData['anchors'] || null,
      };
    }

    const OWNER = 0x3366ee;
    const sig = (n, cat) => { const m = measureGroup(buildUnitModel(cat, OWNER, n)); return [m.meshCount, m.tri]; };
    const innePo = {};
    for (const k of Object.keys(inne)) innePo[k] = sig(k, k === nHie ? 'super' : 'wlocznik');
    // scalanie statycznych części (R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1) na prawdziwym modelu Falangi
    const mg = buildUnitModel('falanga', OWNER, nFal);
    const bbox = (g) => { g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); return [b.min.toArray(), b.max.toArray()]; };
    const bb0 = bbox(mg);
    const res = window.__merge(mg, mg.userData['perTokenGeos'] || []);
    const bb1 = bbox(mg);
    const scalanie = { przed: res.meshesBefore, po: res.meshesAfter,
      dBox: Math.max(...bb0[0].concat(bb0[1]).map((v, i) => Math.abs(v - bb1[i < 3 ? 0 : 1][i % 3]))) };
    return {
      scalanie,
      // ścieżka PO NAZWIE — kategoria celowo BŁĘDNA, żeby wynik zależał
      // wyłącznie od rozpoznania nazwy w buildNamedUnit()
      poNazwie: measureGroup(buildUnitModel('miecznik', OWNER, nFal)),
      pelna: measureGroup(buildUnitModel('falanga', OWNER, nFal)),
      pelna2: measureGroup(buildUnitModel('falanga', 0xcc4422, nFal)),   // druga instancja
      poKategorii: measureGroup(buildUnitModel('falanga', OWNER)),
      hieros: measureGroup(buildUnitModel('super', OWNER, nHie)),
      wlocznik: measureGroup(buildUnitModel('wlocznik', OWNER, nWlo)),
      innePo,
    };
  }, { nFal: NAME_FALANGA, nHie: NAME_HIEROS, nTho: NAME_THORAKITES, nWlo: NAME_WLOCZNIK, inne: BASELINE_INNE });
}

// --- drobna algebra w Node (mierzone dane, nie zaszyte liczby) --------------
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const r4 = (x) => (Number.isFinite(+x) ? +(+x).toFixed(4) : x);

/** Odległość punktu od prostej (P0, kier jednostkowy). */
function odlOdProstej(p, P0, kier) {
  const w = sub(p, P0);
  const proj = dot(w, kier);
  return len(sub(w, mul(kier, proj)));
}

/** Zakres rzutu narożników bryły na oś jednostkową. */
function zakresRzutu(cs, o) {
  let lo = Infinity, hi = -Infinity;
  for (const c of cs) { const p = dot(c, o); lo = Math.min(lo, p); hi = Math.max(hi, p); }
  return { lo, hi, ext: hi - lo };
}

const jestFalangita = (u) =>
  u.names.includes('falangita-sarissa-shaft') && u.names.includes('falangita-pelte-face');

function assertReport(m, soft) {
  const results = [];
  const t = (id, name, cond, detail) => {
    results.push({ id, name, cond: !!cond, detail });
    if (!soft) check(name, cond, detail);
  };
  const F = m.pelna;

  // --- (A) DISPATCH ---------------------------------------------------------
  t('A1', '(A1) „Falanga" dostaje model falangity PO NAZWIE, przy błędnej kategorii',
    jestFalangita(m.poNazwie), m.poNazwie.names.slice(0, 6));
  t('A2', '(A2) fallback kategorii „falanga" (BEZ nazwy) nadal daje falangitę — zero regresji',
    jestFalangita(m.poKategorii), m.poKategorii.names.slice(0, 6));
  t('A3', '(A3) ścieżka po nazwie i ścieżka po kategorii dają IDENTYCZNĄ bryłę',
    m.poNazwie.meshCount === m.poKategorii.meshCount
    && m.poNazwie.tri === m.poKategorii.tri
    && r4(m.poNazwie.maxY) === r4(m.poKategorii.maxY)
    && r4(m.poNazwie.maxR) === r4(m.poKategorii.maxR));
  t('A4', '(A4) nowa reguła nazwy NIE przechwytuje „Hieros Lochos" (inna jednostka grecka)',
    !jestFalangita(m.hieros), m.hieros.names.slice(0, 6));

  const BRAK = { hexR: 1, gripR: [NaN, NaN, NaN], gripL: [NaN, NaN, NaN], sarissaAxis: [NaN, NaN, NaN],
    sarissaLen: NaN, sarissaButtBehind: NaN, torsoHalfW: NaN, torsoHalfD: NaN, torsoTopY: NaN, torsoBotY: NaN,
    armStretchR: NaN, armStretchL: NaN, shoulderY: NaN };
  const a = F.anchors || BRAK;
  const os = a.sarissaAxis;

  // --- (H) RELACJE GEOMETRYCZNE ---------------------------------------------
  // H1 — OBIE DŁONIE TRZYMAJĄ TO SAMO DRZEWCE: pięść każdej ręki leży na osi
  // drzewca (odległość środka pięści od osi < połowa grubości drzewca + zapas)
  // i punkt chwytu leży wewnątrz pięści. Lewa pięść jest DALEJ na drzewcu niż prawa.
  const pestR = F.ctr['falangita-arm-right-fist'];
  const pestL = F.ctr['falangita-arm-left-fist'];
  const odlR = pestR ? odlOdProstej(pestR, a.gripR, os) : NaN;
  const odlL = pestL ? odlOdProstej(pestL, a.gripR, os) : NaN;
  const rozstaw = pestR && pestL ? dot(sub(pestL, pestR), os) : NaN;
  t('H1', '(H1) OBIE pięści leżą na osi sarissy (< 0.01×HEX_R), lewa przed prawą o ≥ 0.07×HEX_R',
    odlR < 0.010 * a.hexR && odlL < 0.010 * a.hexR && rozstaw >= 0.07 * a.hexR,
    { odlPrawa: r4(odlR), odlLewa: r4(odlL), rozstaw: r4(rozstaw) });

  // H2 — pięści są po OBU stronach: dwa różne ramiona (lewe +X barku, prawe −X
  // w układzie korpusu) sięgają do drzewca; zasięg bez rozciągania > 1.15.
  t('H2', '(H2) oba ramiona dosięgają drzewca bez nienaturalnego rozciągnięcia (≤ 1.15)',
    Number.isFinite(a.armStretchR) && a.armStretchR <= 1.15 && a.armStretchL <= 1.15,
    { prawe: r4(a.armStretchR), lewe: r4(a.armStretchL) });

  // H3 — SARISSA jest DŁUGA: drzewce ≥ 0.85×HEX_R i wyraźnie dłuższe niż dawna dory
  // (0.74), grot jest najdalej wysuniętym punktem figury i celuje w przód.
  const shaft = F.box['falangita-sarissa-shaft'];
  const grot = F.box['falangita-sarissa-tip'];
  const dlugosc = shaft ? len([shaft.maxX - shaft.minX, shaft.maxY - shaft.minY, shaft.maxZ - shaft.minZ]) : NaN;
  let najdalejZ = -Infinity;
  for (const nm of F.names) najdalejZ = Math.max(najdalejZ, F.box[nm].maxZ);
  t('H3', '(H3) sarissa ≥ 0.85×HEX_R (dory było 0.74), grot najdalej w przód, oś celuje w przód',
    Number.isFinite(a.sarissaLen) && a.sarissaLen >= 0.85 * a.hexR && a.sarissaLen > HOPLITA_DORY_LEN * 1.15 * a.hexR
    && grot && r4(grot.maxZ) === r4(najdalejZ) && os[2] > 0.9,
    { len: r4(a.sarissaLen), bboxShaft: r4(dlugosc), grotMaxZ: r4(grot && grot.maxZ), najdalejZ: r4(najdalejZ), os: os.map(r4) });

  // H4 — sauroter ZA plecami (z < 0), nie w ziemi ani w nogach.
  const sauro = F.box['falangita-sauroter'];
  t('H4', '(H4) sauroter jest za plecami (z<0), powyżej kolan i nie schodzi pod 0.18×HEX_R',
    sauro && sauro.maxZ < 0 && sauro.minY > 0.18 * a.hexR,
    { z: [r4(sauro && sauro.minZ), r4(sauro && sauro.maxZ)], y: [r4(sauro && sauro.minY), r4(sauro && sauro.maxY)] });

  // H5 — DRZEWCE NIE PRZECHODZI PRZEZ WŁASNY KORPUS. Bryła tułowia = obrócone
  // pudełko (osie z mesha 'falangita-torso'); punkty osi sarissy poza strefami
  // dłoni (±0.035) muszą leżeć poza pudełkiem (zapas = połowa grubości drzewca).
  const torAx = F.axis['falangita-torso'];
  const torC = F.ctr['falangita-torso'];
  let minPoza = Infinity;
  if (torAx && torC) {
    const polX = a.torsoHalfW, polY = (a.torsoTopY - a.torsoBotY) / 2, polZ = a.torsoHalfD;
    const gap = rozstaw;
    for (let s = -a.sarissaButtBehind; s <= a.sarissaLen - a.sarissaButtBehind; s += 0.01) {
      if (Math.abs(s) < 0.035 || Math.abs(s - gap) < 0.035) continue;
      const p = add(a.gripR, mul(os, s));
      const d = sub(p, torC);
      const q = [dot(d, torAx.x), dot(d, torAx.y), dot(d, torAx.z)];
      const wx = Math.abs(q[0]) - polX, wy = Math.abs(q[1]) - polY, wz = Math.abs(q[2]) - polZ;
      // odległość do pudełka (dodatnia na zewnątrz; ujemna wewnątrz)
      const out = Math.hypot(Math.max(wx, 0), Math.max(wy, 0), Math.max(wz, 0))
        + Math.min(Math.max(wx, wy, wz), 0);
      minPoza = Math.min(minPoza, out);
    }
  } else { minPoza = NaN; }
  t('H5', '(H5) oś drzewca poza strefami dłoni NIE przecina korpusu (odl. od tułowia > 0.0105×HEX_R)',
    Number.isFinite(minPoza) && minPoza > 0.0105 * a.hexR, { minOdlOdTulowia: r4(minPoza) });

  // H6 — SKRĘT KORPUSU: tors obrócony (szyk pikinierów, lewy bark do przodu),
  // głowa zostaje przodem do +Z (patrzy na wroga).
  const glowaAx = F.axis['falangita-head'];
  t('H6', '(H6) tors skręcony (|yaw| ≥ 0.3 rad), głowa przodem do +Z',
    Math.abs(a.torsoYaw) >= 0.3 && torAx && glowaAx && glowaAx.z[2] > 0.99 && torAx.z[2] < 0.95,
    { yaw: r4(a.torsoYaw), torsoZ: torAx && torAx.z.map(r4), glowaZ: glowaAx && glowaAx.z.map(r4) });

  // H5b — DRZEWCE NIE PRZECHODZI PRZEZ ŻADNE RAMIĘ (to samo, co mierzył audyt T3 dla
  // dory): oś każdego RAMIENIA (bark-łokieć) jest od osi sarissy dalej niż suma
  // półgrubości (0.027 + 0.0105 = 0.0375×HEX_R). Przedramię kończy się W DŁONI na
  // drzewcu — z definicji chwytu — więc nie jest tu mierzone.
  const POL_RAMIE = 0.027, POL_DRZEWCE = 0.0105;
  const klirensRamion = {};
  for (const strona of ['right', 'left']) {
    const nm = 'falangita-arm-' + strona + '-upper';
    const ax = F.axis[nm], c = F.ctr[nm];
    const st = strona === 'right' ? a.armStretchR : a.armStretchL;
    let best = Infinity;
    if (ax && c) {
      const half = 0.050 * a.hexR * st;
      for (let i = 0; i <= 40; i++) {
        const s = -half + (2 * half * i) / 40;
        best = Math.min(best, odlOdProstej(add(c, mul(ax.y, s)), a.gripR, os));
      }
    }
    klirensRamion[strona] = best;
  }
  t('H5b', '(H5b) drzewce NIE przechodzi przez żadne ramię (klirens osi > 0.0375×HEX_R)',
    klirensRamion.right > (POL_RAMIE + POL_DRZEWCE) * a.hexR && klirensRamion.left > (POL_RAMIE + POL_DRZEWCE) * a.hexR,
    { prawe: r4(klirensRamion.right), lewe: r4(klirensRamion.left), prog: POL_RAMIE + POL_DRZEWCE });

  // --- PELTE: mała tarcza na lewym przedramieniu --------------------------
  const licoAxis = F.axis['falangita-pelte-face'];
  const n = licoAxis ? licoAxis.y : null;   // rotation.x=π/2 => lokalne +Y = normalna tarczy
  const u = licoAxis ? licoAxis.x : null;
  const w = licoAxis ? licoAxis.z : null;
  const licoC = F.corners['falangita-pelte-face'];
  const rzutL = licoC && n ? zakresRzutu(licoC, n) : null;
  const licoU = licoC && u ? zakresRzutu(licoC, u) : null;
  const licoW = licoC && w ? zakresRzutu(licoC, w) : null;

  // H7 — PELTE: lico patrzy w kamerę/przód (|n·+Z| > 0.85), tarcza po LEWEJ stronie (+X),
  // PRZYPIĘTA do lewego przedramienia (środek tarczy ≤ 0.10×HEX_R od środka przedramienia)
  // i MAŁA (średnica < 0.20×HEX_R — mniejsza niż aspis 0.256).
  const przedL = F.ctr['falangita-arm-left-fore'];
  const srodekTarczy = F.ctr['falangita-pelte-face'];
  const odlPrzedramie = przedL && srodekTarczy ? len(sub(srodekTarczy, przedL)) : NaN;
  const srednica = licoU && licoW ? Math.max(licoU.ext, licoW.ext) : NaN;
  t('H7', '(H7) pelte: lico ku przodowi, po lewej, przypięta do lewego przedramienia (≤0.10×HEX_R), mała (<0.20×HEX_R)',
    n && Math.abs(dot(n, [0, 0, 1])) > 0.85 && srodekTarczy && srodekTarczy[0] > 0
    && odlPrzedramie <= 0.10 * a.hexR && srednica < 0.20 * a.hexR,
    { normalna: n && n.map(r4), srodek: srodekTarczy && srodekTarczy.map(r4),
      odlPrzedramie: r4(odlPrzedramie), srednica: r4(srednica) });

  // H8 — EPISEMA leży na tarczy (równoległa, wystaje przed lico) i mieści się w polu.
  const epis = F.axis['falangita-pelte-episema'];
  const episC = F.corners['falangita-pelte-episema'];
  const rzutE = episC && n ? zakresRzutu(episC, n) : null;
  const rzutEu = episC && u ? zakresRzutu(episC, u) : null;
  const rzutEw = episC && w ? zakresRzutu(episC, w) : null;
  t('H8', '(H8) episema równoległa do tarczy, wystaje przed lico i mieści się w obrysie pola',
    epis && n && Math.abs(dot(epis.z, n)) > 0.999 && rzutE && rzutL && rzutE.hi > rzutL.hi
    && rzutEu && licoU && rzutEu.lo >= licoU.lo && rzutEu.hi <= licoU.hi
    && rzutEw && licoW && rzutEw.lo >= licoW.lo && rzutEw.hi <= licoW.hi,
    { rzutEpisemy: rzutE && r4(rzutE.hi), rzutLica: rzutL && r4(rzutL.hi) });

  // H9 — godło neutralne (K7): współśrodkowe z polem i symetryczne obrotowo.
  const srE = rzutEu && rzutEw ? [(rzutEu.lo + rzutEu.hi) / 2, (rzutEw.lo + rzutEw.hi) / 2] : null;
  const srL = licoU && licoW ? [(licoU.lo + licoU.hi) / 2, (licoW.lo + licoW.hi) / 2] : null;
  const mimosrod = srE && srL ? Math.hypot(srE[0] - srL[0], srE[1] - srL[1]) : NaN;
  t('H9a', '(H9a) godło na pelte jest WSPÓŁŚRODKOWE z polem tarczy',
    Number.isFinite(mimosrod) && mimosrod < 0.010 * a.hexR, { mimosrodowosc: r4(mimosrod) });
  const proporcja = rzutEu && rzutEw && rzutEw.ext > 0
    ? Math.max(rzutEu.ext, rzutEw.ext) / Math.min(rzutEu.ext, rzutEw.ext) : NaN;
  t('H9b', '(H9b) godło na pelte jest symetryczne obrotowo (proporcja < 1.2)',
    Number.isFinite(proporcja) && proporcja < 1.2, { proporcja: r4(proporcja) });

  // H10 — pelte nie ma umba (K7): najdalej na normalnej wystaje płaska episema.
  let najdalejNaNormalnej = -Infinity, ktoNajdalej = null;
  for (const nm of ['falangita-pelte-face', 'falangita-pelte-rim', 'falangita-pelte-episema']) {
    if (!F.corners[nm] || !n) continue;
    const z = zakresRzutu(F.corners[nm], n).hi;
    if (z > najdalejNaNormalnej) { najdalejNaNormalnej = z; ktoNajdalej = nm; }
  }
  t('H10', '(H10) pelte nie ma umba — najdalej wysuniętą częścią tarczy jest płaska episema',
    ktoNajdalej === 'falangita-pelte-episema' && !F.names.some((x) => x.includes('umbo') || x.includes('boss')),
    { najdalej: ktoNajdalej });

  // H11 — NIE ZWYKŁY HOPLITA: brak grzebienia hoplity (K4 dotyczył hoplity), są
  // dwa piora po bokach helmu i chlamys; model inny niż Włócznik i Hieros Lochos.
  t('H11', '(H11) falangita ≠ hoplita: brak grzebienia, są 2 piora helmu i chlamys',
    !F.names.some((x) => x.includes('crest')) && F.names.includes('falangita-plume-left')
    && F.names.includes('falangita-plume-right') && F.names.includes('falangita-chlamys'),
    F.names.filter((x) => /crest|plume|chlamys/.test(x)));
  const nazwyW = new Set(m.wlocznik.names);
  t('H11b', '(H11b) model Falangi ≠ model Włócznika (inne części, inna liczba trójkątów)',
    !jestFalangita(m.wlocznik) && (m.wlocznik.tri !== F.tri || m.wlocznik.meshCount !== F.meshCount)
    && !F.names.every((x) => nazwyW.has(x)),
    { falanga: [F.meshCount, F.tri], wlocznik: [m.wlocznik.meshCount, m.wlocznik.tri] });

  // H12 — NAGOLENNIKI NA OBU GOLENIACH (K8).
  const gl = F.box['falangita-leg-left-greave'];
  const gp = F.box['falangita-leg-right-greave'];
  const sl = F.box['falangita-leg-left-foot'];
  const sp = F.box['falangita-leg-right-foot'];
  t('H12', '(H12) nagolenniki są na OBU goleniach i schodzą na kostkę',
    gl && gp && sl && sp && gl.minY <= sl.maxY && gp.minY <= sp.maxY
    && (gl.maxY - gl.minY) > 0.08 * a.hexR && (gp.maxY - gp.minY) > 0.08 * a.hexR);

  // H13 — HELM ZAKRYWA GŁOWĘ I NIESIE SZCZELINĘ OCZNĄ.
  const dzwon = F.box['falangita-helmet-dome'];
  const szcz = F.box['falangita-helmet-slit'];
  const glowa = F.box['falangita-head'];
  t('H13', '(H13) dzwon helmu przykrywa czubek głowy, a szczelina oczna leży NA nim',
    dzwon && glowa && szcz && dzwon.maxY > glowa.maxY
    && dzwon.maxX > glowa.maxX && dzwon.minX < glowa.minX
    && szcz.minY > dzwon.minY && szcz.maxY < dzwon.maxY && szcz.maxZ > glowa.maxZ);

  if (soft) return results;

  // --- (E) proporcje, pamięć, scalanie statycznych części -------------------
  check('(E1) stopy na y≈0 (minY > -0.01 i < 0.02×HEX_R)', F.minY > -0.01 && F.minY < 0.02, r4(F.minY));
  check('(E2) promień poziomy w twardym limicie heksu (≤0.866×HEX_R)', F.maxR <= 0.866, r4(F.maxR));
  check('(E3) figurka niesie barwę właściciela na polu tarczy', F.colors.includes(0x3366ee));
  check('(E4) budżet trójkątów: model bardziej złożony niż dawny hoplita (404), ale ≤ 460',
    F.tri > 404 && F.tri <= 460, F.tri);
  check('(E5) bez nowej geometrii per instancja: perTokenGeos puste, dwie instancje dzielą WSZYSTKIE geometrie',
    F.perTokenGeos === 0 && m.pelna2.geoIds.length === F.geoIds.length
    && m.pelna2.geoIds.every((id, i) => id === F.geoIds[i]),
    { perToken: F.perTokenGeos, mesh: F.geoIds.length });
  check('(E6) zgodność ze scalaniem statycznych części: żaden mesh bez wyznacznika>0 ani z userData',
    F.negativeDet === 0 && F.meshesWithUserData === 0, { negDet: F.negativeDet, userData: F.meshesWithUserData });
  // inne jednostki włóczniczy BEZ ZMIAN
  const rozne = Object.keys(BASELINE_INNE).filter(
    (k) => m.innePo[k][0] !== BASELINE_INNE[k][0] || m.innePo[k][1] !== BASELINE_INNE[k][1]);
  check('(E7) Włócznik, Thorakites, Hieros Lochos, Włócznik sumeryjski: model BEZ ZMIAN (mesh, tri)',
    rozne.length === 0, { zmienione: rozne, po: m.innePo, baza: BASELINE_INNE });
  check('(E8) mergeUnitStaticParts na modelu Falangi: mniej meshy po scaleniu, bryła obrysu bez zmian (<1e-4)',
    m.scalanie.po < m.scalanie.przed && m.scalanie.dBox < 1e-4, m.scalanie);
  console.log('  [wymiary] Falanga: wysokość=' + F.height.toFixed(3)
    + '×HEX_R, promień=' + F.maxR.toFixed(3) + '×HEX_R, mesh=' + F.meshCount + ', tri=' + F.tri);
  console.log('  [sarissa] długość=' + r4(a.sarissaLen) + '×HEX_R; rozciągnięcie ramion P/L=' + r4(a.armStretchR) + '/' + r4(a.armStretchL)
    + '; min odl. drzewca od tułowia=' + r4(minPoza));

  return results;
}

async function shot(page, file, view) {
  await page.evaluate(({ view }) => {
    const THREE = window.__THREE;
    const build = window.__buildUnitModel;
    document.body.innerHTML = '';
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(900, 460);
    renderer.setClearColor(0x78a7ff, 1);
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 900 / 460, 0.05, 60);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(2, 3, 2);
    scene.add(dir);
    if (view === 'close') {
      const a = build('falanga', 0x3366ee, 'Falanga'); a.position.x = -0.55; a.rotation.y = 0.7; scene.add(a);
      const b = build('falanga', 0xcc4422, 'Falanga'); b.position.x = 0.55; b.rotation.y = Math.PI / 2; scene.add(b);
      camera.position.set(0, 0.62, 2.6); camera.lookAt(0, 0.28, 0.1);
    } else {
      for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) {
        const u = build('falanga', 0x3366ee, 'Falanga');
        u.position.set((i - 2.5) * 0.62, 0, -row * 0.75);
        scene.add(u);
      }
      camera.position.set(0, 5.2, 6.2); camera.lookAt(0, 0.2, -0.4);
    }
    renderer.render(scene, camera);
    window.__shotReady = true;
  }, { view });
  await page.waitForFunction('window.__shotReady === true');
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 900, height: 460 } });
  await page.evaluate(() => { window.__shotReady = false; });
}

async function main() {
  // --- (0) statyczne kotwice w źródle -------------------------------------
  const srcUnits = fs.readFileSync(UNITS_TS, 'utf8');
  const srcModel = fs.readFileSync(MODEL_TS, 'utf8');
  const unitsJson = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));

  check('(0a) units.ts: „Falanga" ma JAWNY dispatch po nazwie w buildNamedUnit',
    srcUnits.includes(LINE_DISPATCH));
  check('(0b) units.ts: `case \'falanga\'` NADAL istnieje jako fallback kategorii',
    srcUnits.includes("case 'falanga': {") && srcUnits.includes(LINE_FALLBACK));
  check('(0c) hastati-falangita.ts: sekcja ZGODNOŚĆ HISTORYCZNA z punktami K1-K9 i K5 = SARISSA',
    /ZGODNOSC HISTORYCZNA/.test(srcModel) && /K1\. LINOTHORAX/.test(srcModel)
    && /K5\. SARISSA/.test(srcModel) && /K9\. WYKROK/.test(srcModel));
  check('(0d) K7 rozstrzyga kwestię blazonu z uzasadnieniem (Lakedaimon + roster gry), tarcza = pelte',
    /K7\. PELTE I EPISEMA/.test(srcModel) && /Lakedaimon/.test(srcModel)
    && /city-names-pools/.test(srcModel) && /Hieros/.test(srcModel));
  check('(0e) dokumentacja pozy: skręt korpusu i dobór parametrów chwytu opisane w źródle',
    /SA_TORSO_YAW/.test(srcModel) && /obydwiema rekami|OBYDWOMA rekami|OBYDWIEMA rekami/i.test(srcModel));
  check('(0f) buildHastati() nietknięty — nadal montefortino + gladius (poza zakresem tematu)',
    /export function buildHastati/.test(srcModel) && /getGNIMontBowl\(\), mGold/.test(srcModel));

  const jF = unitsJson.find((u) => u['Jednostka'] === NAME_FALANGA);
  check('(0g) units.json: Falanga = Epoka Żelazo, Kultura Grecka, Typ Falangite',
    jF !== undefined && jF['Epoka'] === 'Żelazo' && jF['Kultura'] === 'Grecka'
    && jF['Typ'] === 'Falangite',
    jF && { e: jF['Epoka'], k: jF['Kultura'], t: jF['Typ'] });
  check('(0h) units.json: Falanga ma Atak dystansowy=0 — sarissa NIE jest miotana, poza do walki wręcz',
    jF !== undefined && jF['Atak dystansowy'] === 0 && jF['missileAttack'] === 0,
    jF && { d: jF['Atak dystansowy'], m: jF['missileAttack'] });

  // --- (K) przesłanki decyzji o blazonie (K7) — pilnowane w DANYCH ---------
  const civs = JSON.parse(fs.readFileSync(CIVS_JSON, 'utf8'));
  const pools = JSON.parse(fs.readFileSync(POOLS_JSON, 'utf8'));
  const civArr = civs.cywilizacje || civs;
  const greckie = civArr.filter((c) => /grec/i.test(String(c['Cywilizacja'] ?? '')));
  check('(K1) civs.json: istnieje DOKŁADNIE JEDNA cywilizacja grecka (nie osobna Sparta)',
    greckie.length === 1, greckie.map((c) => c['Cywilizacja']));
  const sparta = unitsJson.some((u) => /spart/i.test(
    String(u['Jednostka']) + String(u['Nazwa EN']) + String(u['Kultura']) + String(u['Nacja'])));
  check('(K2) units.json: „Sparta" NIE jest kulturą, nacją ani jednostką', sparta === false);
  const grecy = pools['grecy'] || {};
  const miasta = [].concat(grecy['miasta_cywilizacji'] || [], grecy['miasta_panstwa'] || []);
  check('(K3) city-names-pools.json: Sparta jest RÓWNORZĘDNĄ nazwą miasta greckiego (obok Aten i Teb)',
    miasta.includes('Sparta') && miasta.includes('Ateny') && miasta.includes('Teby'));
  check('(K4) units.json: jedyna grecka jednostka przypisana konkretnej polis jest TEBAŃSKA',
    unitsJson.some((u) => String(u['Jednostka']).includes('Hieros Lochos')));

  fs.writeFileSync(ENTRY, [
    "import * as THREE from 'three';",
    "import { buildUnitModel } from '../src/render/units.ts';",
    "import { mergeUnitStaticParts } from '../src/render/unitStaticMerge.ts';",
    'window.__THREE = THREE;',
    'window.__merge = mergeUnitStaticParts;',
    'window.__buildUnitModel = buildUnitModel;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, []);

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function renderWith(bundleFile) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
    await page.addScriptTag({ path: bundleFile });
    return measureAll(page);
  }

  try {
    console.log('\n--- (A)/(H)/(E) render modelu falangity (sarissa) ---');
    const after = await renderWith(BUNDLE_PO);
    assertReport(after, false);
    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await shot(page, path.join(SHOTS, 'po-falanga-zblizenie.png'), 'close');
      await shot(page, path.join(SHOTS, 'po-falanga-z-daleka.png'), 'far');
    }

    console.log('\n--- (B) mutacje: cofnięcie JEDNEGO elementu musi zapalić wskazane asercje ---');
    for (const mu of MUTACJE) {
      const counter = { n: 0 };
      await buildBundle(BUNDLE_MUT, [mutationPlugin(mu, counter)]);
      check(`(B0:${mu.id}) mutacja zaaplikowana dokładnie raz (kod się nie przesunął)`, counter.n === 1, counter);
      if (counter.n !== 1) continue;
      const mm = await renderWith(BUNDLE_MUT);
      const soft = assertReport(mm, true);
      const zielone = soft.filter((r) => mu.czerwone.includes(r.id) && r.cond).map((r) => r.id);
      for (const r of soft) {
        if (mu.czerwone.includes(r.id)) {
          console.log('  [' + mu.id + '] ' + r.id + ' = ' + (r.cond ? 'ZIELONE (źle!)' : 'CZERWONE')
            + (r.detail !== undefined ? ' — ' + JSON.stringify(r.detail) : ''));
        }
      }
      check(`(B1:${mu.id}) asercje ${mu.czerwone.join('+')} padają na zmutowanym kodzie — test nie jest tautologiczny`,
        zielone.length === 0, { nadal_zielone: zielone });
    }

    check('(F0) zero błędów konsoli/JS w renderach', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close();
  }

  // --- (G) artefakt PRODUKCYJNY vite build (C-001) ------------------------
  // C-001: NIGDY `npm run build`/`npm run dev` ani `npx`; wyłącznie binarka
  // vite z node_modules, do katalogu POZA drzewem repo.
  if (!SKIP_VITE) {
    let dist = DIST_ARG;
    if (dist === null) {
      const outDir = path.join(os.tmpdir(), `civ-zelazo-t3-render-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(G1) artefakt vite build niesie dispatch falangi po nazwie', /phalanx/i.test(built));
    check('(G2) artefakt vite build niesie model falangity (nazwy mesh sarissy)', /falangita-sarissa/i.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_PO); fs.unlinkSync(BUNDLE_MUT); } catch (_) {}

  console.log('\nzelazo-falanga-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
