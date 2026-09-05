'use strict';
/**
 * zelazo-super-rzym-grecja-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T7 — audyt czterech jednostek Rzymu i
 * Grecji: **Evocati**, **Triari**, **Hieros Lochos (Święty Zastęp)**, **Hastati**.
 *   `gra/src/render/jednostki-p6-super.ts`   — buildSuperGreece, buildSuperRome
 *   `gra/src/render/jednostki-z2-srodziemne.ts` — WYŁĄCZNIE buildTriari
 *   `gra/src/render/hastati-opus5.ts`        — buildHastatiOpus5
 *
 * ZGŁOSZENIE. Żaden z tych trzech plików nie nazywał ANI JEDNEGO mesh przed T7
 * (zmierzone: 0/36, 0/36, 0/37, 0/92) i żaden nie miał `userData.anchors` — ta
 * sama przyczyna, dla której z1-mezopotamia (T5) i z2-śródziemnomorze (T6) nie
 * były sprawdzone przez wcześniejsze tematy serii. Bez nazw żadna asercja nie
 * może zaadresować części, a punkty odniesienia musiałyby być wpisane liczbowo
 * w test — czyli test mierzyłby sam siebie.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA (R-PROC-AUTOBOT.md §9 poz. 6a): to są modele
 * 3D (Three.js). Trzy z sześciu defektów tego audytu są NIEWIDOCZNE bez
 * policzenia, ile pikseli danej części widać z kamery gry — geometria była
 * poprawna, a element i tak nie istniał na ekranie.
 *
 * KAMERA GRY: `src/render/camera.ts` — stały azymut 0 (yaw nie zmienia się
 * nigdy), elewacja 52°. Kierunek patrzenia (0; -sin52; -cos52). Baza
 * płaszczyzny obrazu: poziom (1;0;0), pion (0; cos52; -sin52).
 *
 * PROGI BIORĄ SIĘ Z RODZINY, NIE Z SUFITU. Modele odniesienia to Falangita
 * (naprawiona w T3) i Thorakites (naprawiony w T6) — obie zaakceptowane,
 * obie w tej samej konwencji, obie mierzone W TYM SAMYM RENDERZE co czwórka
 * T7, nie z pamięci:
 *   - broń w RAMIENIU ręki uzbrojonej: 0.0000 (chwyt w pięści/przedramieniu
 *     jest dozwolony i wynosi w rodzinie 0.0335 / 0.0218),
 *   - widoczność broni (rzut ekranowy / długość własna): 0.895 i 0.903,
 *   - widoczność twarzy w pikselach z kamery gry: Thorakites 14 (oczy),
 *     Falangita 6 (szczelina hełmu).
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI — MACIERZ ABLACYJNA, POJEDYNCZA MUTACJA NA ASERCJĘ
 * (standard serii ustalony przez Evaluatora T4, utrzymany w T5 i T6): każdy
 * bundel M* różni się od źródła DOKŁADNIE JEDNYM podmienionym miejscem i musi
 * zaczerwienić DOKŁADNIE swoją asercję. Większość mutacji odtwarza dosłowny
 * stan sprzed audytu T7.
 *
 * Usage (z gra/): node tools/zelazo-super-rzym-grecja-real-render-test.cjs
 *   --shots <katalog>   zrzuty PRZED/PO z kamery gry do <katalog>/*.png
 *   --dist <index.html> użyj gotowego artefaktu vite zamiast budować go w teście
 *   --skip-vite         pomiń sekcję (G) artefaktu produkcyjnego
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[zelazo-super-rzym-grecja-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-super-rzym-grecja-entry.ts');
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
const OUTDIR = path.resolve(os.tmpdir(), `civ-zelazo-t7-bundles-${TMPDIR_RUN_ID}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const P6_TS = path.resolve(GRA, 'src', 'render', 'jednostki-p6-super.ts');
const Z2_TS = path.resolve(GRA, 'src', 'render', 'jednostki-z2-srodziemne.ts');
const HO_TS = path.resolve(GRA, 'src', 'render', 'hastati-opus5.ts');
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');
// C-001: jedyny dozwolony build to binarka vite z node_modules przez `node`,
// NIGDY `npm run build` ani `npx`; katalog wyjściowy POZA drzewem repo.
const VITE_BIN = path.resolve(GRA, 'node_modules', 'vite', 'bin', 'vite.js');

const argOf = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const SKIP_VITE = process.argv.includes('--skip-vite');

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

// ── czwórka tematu + jej prefiksy mesh ─────────────────────────────────────
const UNITS = [
  { key: 'evocati', pl: 'Evocati', en: 'Evocati', pf: 'ev', cat: 'super' },
  { key: 'triari',  pl: 'Triari',  en: 'Triari',  pf: 'tr', cat: 'super' },
  { key: 'hieros',  pl: 'Hieros Lochos (Święty Zastęp)', en: 'Hieros Lochos (Sacred Band)', pf: 'hl', cat: 'super' },
  { key: 'hastati', pl: 'Hastati', en: 'Hastati', pf: 'ha', cat: 'miecznik' },
];
// Modele ODNIESIENIA — zaakceptowane, poza zakresem T7, mierzone w tym samym
// renderze. Nie wolno ich zmieniać; służą za skalę i za kontrolę regresji.
const REF = [
  { key: 'falanga',    pl: 'Falanga',    cat: 'falanga',  pfs: ['falangita-'] },
  { key: 'thorakites', pl: 'Thorakites', cat: 'wlocznik', pfs: ['th-'] },
  { key: 'gwardia',    pl: 'Gwardia Tyreńska', cat: 'miecznik', pfs: ['gt-'] },
];

/**
 * (M) MACIERZ ABLACYJNA — jedna mutacja = jedno miejsce = jedna asercja.
 * `cel` mówi, KTÓRA asercja ma się zaczerwienić; `plik` — w którym źródle
 * podmiana ma trafić w DOKŁADNIE jedno wystąpienie.
 */
const MUTATIONS = [
  { id: 'M1', cel: 'H1', plik: P6_TS,
    opis: 'dory Hieros Lochos zakotwiczone w torsie zamiast w nadgarstku',
    from: '  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);\n  const shaft = new THREE.Mesh(getGS6DoryShaft(), mWood);',
    to:   '  const grip = new THREE.Vector3(0, S6_TORSO_CTR, 0);\n  const shaft = new THREE.Mesh(getGS6DoryShaft(), mWood);' },

  { id: 'M2', cel: 'H2', plik: P6_TS,
    opis: 'kat przedramienia Hieros Lochos z powrotem 1.32 (stan sprzed T7 = blad sprzed T3)',
    from: "  const armR = s6BuildArm(group, -S6_SHLD_X, -2.55, 1.85, mBronze, mSkin, mLeath, 'hl', 'right');",
    to:   "  const armR = s6BuildArm(group, -S6_SHLD_X, -2.55, 1.32, mBronze, mSkin, mLeath, 'hl', 'right');" },

  { id: 'M3', cel: 'H3', plik: P6_TS,
    opis: 'choragiew Hieros Lochos z powrotem po stronie bronnej (stan sprzed T7)',
    from: "  s6Banner(group, mWoodD, mOwner, mGold, 'hl', +1);",
    to:   "  s6Banner(group, mWoodD, mOwner, mGold, 'hl', -1);" },

  { id: 'M4', cel: 'H4', plik: P6_TS,
    opis: 'Evocati bez oczu (stan sprzed T7)',
    from: "  const mSkin = s6Core(group, mat, mMail, S6_SKIN, true, 'ev');",
    to:   "  const mSkin = s6Core(group, mat, mMail, S6_SKIN, false, 'ev');" },

  { id: 'M5', cel: 'H5', plik: P6_TS,
    opis: 'montefortino Evocatiego z powrotem na HEAD_CTR+0.030 (polyka twarz — stan sprzed T7)',
    from: 'const S6_MONT_Y_OFF = 0.068 * HEX_R;',
    to:   'const S6_MONT_Y_OFF = 0.030 * HEX_R;' },

  { id: 'M6', cel: 'H6', plik: HO_TS,
    opis: 'zespol helmu Hastatiego z powrotem nisko (polyka oczy i nos — stan sprzed T7)',
    from: 'const HO_HELM_UP = 0.035 * HEX_R;',
    to:   'const HO_HELM_UP = 0.000 * HEX_R;' },

  { id: 'M7', cel: 'H7', plik: HO_TS,
    opis: 'szczeka Hastatiego z powrotem wewnatrz szescianu glowy (stan sprzed T7)',
    from: '  jaw.position.set(0, HO_HEAD_CTR - HO_HEAD_S * 0.38, 0.048 * HEX_R);',
    to:   '  jaw.position.set(0, HO_HEAD_CTR - HO_HEAD_S * 0.38, 0.010 * HEX_R);' },

  { id: 'M8', cel: 'H8', plik: Z2_TS,
    opis: 'zarost Triariego z powrotem wewnatrz glowy (stan sprzed T7)',
    from: '  beard.position.set(0, HEAD_CTR - 0.052 * HEX_R, 0.082 * HEX_R);',
    to:   '  beard.position.set(0, HEAD_CTR - 0.052 * HEX_R, 0.056 * HEX_R);' },

  { id: 'M9', cel: 'H9', plik: Z2_TS,
    opis: 'stopa kleczacej nogi Triariego z powrotem pod teren (stan sprzed T7)',
    from: '  footR.position.set(-Z2_HIP_X, 0.039 * HEX_R, knee.z - 0.118 * HEX_R);',
    to:   '  footR.position.set(-Z2_HIP_X, 0.036 * HEX_R, knee.z - 0.118 * HEX_R);' },

  { id: 'M10', cel: 'H10', plik: P6_TS,
    opis: 'scutum Evocatiego obrocone tylem do kamery gry (klasa bledu T2)',
    from: '  sh.rotation.y = -0.22;',
    to:   '  sh.rotation.y = Math.PI - 0.22;' },

  { id: 'M11', cel: 'H11', plik: HO_TS,
    opis: 'reka Hastatiego wyprostowana jak kij (klasa bledu T1)',
    from: "  const armR = hoBuildArm(group, -HO_SHLD_X, 0.95, 1.50, mRed, mSkin, mSkinDk, 'right');",
    to:   "  const armR = hoBuildArm(group, -HO_SHLD_X, 1.50, 1.50, mRed, mSkin, mSkinDk, 'right');" },

  { id: 'M12', cel: 'H12', plik: P6_TS,
    opis: 'tors Evocatiego z powrotem czerwony jak tunika Hastatiego (stan sprzed T7)',
    from: "  const mSkin = s6Core(group, mat, mMail, S6_SKIN, true, 'ev');",
    to:   "  const mSkin = s6Core(group, mat, mRed, S6_SKIN, true, 'ev');" },

  { id: 'M13', cel: 'H16', plik: P6_TS,
    opis: 'helm Hieros Lochos z powrotem nasuniety na twarz jak u liniowego Falangity (stan sprzed T7)',
    from: '  dome.position.set(0, S6_HEAD_CTR + 0.072 * HEX_R, -0.016 * HEX_R);',
    to:   '  dome.position.set(0, S6_HEAD_CTR + 0.014 * HEX_R, 0);' },

  { id: 'M14', cel: 'H14', plik: Z2_TS,
    opis: 'hasta Triariego uniesiona WZDLUZ osi patrzenia kamery (klasa bledu T6/A1)',
    from: '  const EL = 0.30;                                 // elewacja hasty (w gore)',
    to:   '  const EL = 0.91;                                 // elewacja hasty (w gore)' },

  { id: 'M15', cel: 'H15', plik: HO_TS,
    opis: 'grot pilum Hastatiego opuszczony za rant tarczy — znika z ekranu',
    from: '  pHead.position.set(0, 0.687 * HEX_R, 0);',
    to:   '  pHead.position.set(0, 0.300 * HEX_R, 0);' },

  { id: 'M16', cel: 'H13', plik: P6_TS,
    opis: 'zloty pierscien aspidy Hieros Lochos w kolorze pola — znika roznica wobec Falangity',
    from: '  const band = new THREE.Mesh(getGS6AspisBand(), mGold);',
    to:   '  const band = new THREE.Mesh(getGS6AspisBand(), mOwner);' },
];

function makeMutPlugin(mut, stat) {
  const base = path.basename(mut.plik);
  return {
    name: 'mut-' + mut.id,
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== mut.plik) return null;
        let out = fs.readFileSync(args.path, 'utf8');
        const n = out.split(mut.from).length - 1;
        if (n === 1) { out = out.split(mut.from).join(mut.to); stat.applied++; }
        else { stat.bad.push(mut.id + ':' + base + ':' + n); }
        return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
}

async function buildBundle(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins, logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[zelazo-super-rzym-grecja-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

// ── geometria pomocnicza (Node) ────────────────────────────────────────────
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vlen = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const L = vlen(a); return [a[0] / L, a[1] / L, a[2] / L]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function obb(p) {
  const lc = [0, 1, 2].map((i) => (p.localMin[i] + p.localMax[i]) / 2);
  const c = [0, 1, 2].map((j) => p.pos[j] + p.axX[j] * lc[0] + p.axY[j] * lc[1] + p.axZ[j] * lc[2]);
  const h = [0, 1, 2].map((i) => (p.localMax[i] - p.localMin[i]) / 2);
  return { c, u: [p.axX, p.axY, p.axZ], h };
}
/** Głębokość penetracji dwóch OBB (SAT, 15 osi). 0 = brak kolizji. */
function satDepth(A, B) {
  const axes = [A.u[0], A.u[1], A.u[2], B.u[0], B.u[1], B.u[2]];
  for (const a of A.u) for (const b of B.u) { const c = cross(a, b); if (vlen(c) > 1e-6) axes.push(unit(c)); }
  let min = Infinity;
  const d = sub(B.c, A.c);
  for (const ax of axes) {
    const ra = A.h[0] * Math.abs(dot(ax, A.u[0])) + A.h[1] * Math.abs(dot(ax, A.u[1])) + A.h[2] * Math.abs(dot(ax, A.u[2]));
    const rb = B.h[0] * Math.abs(dot(ax, B.u[0])) + B.h[1] * Math.abs(dot(ax, B.u[1])) + B.h[2] * Math.abs(dot(ax, B.u[2]));
    const sep = Math.abs(dot(d, ax)) - (ra + rb);
    if (sep > 0) return 0;
    if (-sep < min) min = -sep;
  }
  return min;
}
function distPointLine(P, A, D) {
  const w = sub(P, A); const t = dot(w, D);
  return vlen(sub(P, [A[0] + D[0] * t, A[1] + D[1] * t, A[2] + D[2] * t]));
}
const byName = (m) => { const o = {}; for (const p of m.parts) if (p.name) o[p.name] = p; return o; };

// kierunek patrzenia kamery gry i baza jej płaszczyzny obrazu (camera.ts)
const EL = 52 * Math.PI / 180;
const CAM_VIEW = [0, -Math.sin(EL), -Math.cos(EL)];
const IMG_X = [1, 0, 0];
const IMG_Y = [0, Math.cos(EL), -Math.sin(EL)];
const toImg = (p) => [dot(p, IMG_X), dot(p, IMG_Y)];

/** Widoczność łamanej broni: długość NA EKRANIE / długość WŁASNA w 3D. */
function weaponVisibility(m, names) {
  const n = byName(m);
  const pts3 = names.map((x) => n[x]).filter(Boolean).map((p) => p.pos);
  if (pts3.length < 2) return { vis: NaN, screen: NaN };
  let l3 = 0, l2 = 0;
  const p2 = pts3.map(toImg);
  for (let i = 1; i < pts3.length; i++) {
    l3 += vlen(sub(pts3[i], pts3[i - 1]));
    l2 += Math.hypot(p2[i][0] - p2[i - 1][0], p2[i][1] - p2[i - 1][1]);
  }
  return { vis: l3 > 1e-9 ? l2 / l3 : NaN, screen: l2 };
}

// ── zestawy części adresowane po NAZWIE (biorą się z modelu, nie z tabelki) ─
const BODY_RE = /-(torso|chest|neck|head|jaw|nose|eye-[a-z]+|beard|tunic-hem|tunic-fold-\d|pteruges|belt|belt-buckle|mail-hem|harness|phalera-\d|cuirass-[a-z]+|cloak|greave-[a-z]+|kneecop-[a-z]+|pectorale[a-z-]*|leg-[a-z]+-(thigh|shin|foot|sole|toes)|arm-(left|right)-upper|arm-left-fore|helmet-[a-z-]+|kita-[a-z]+|crest-[a-z]+|plume-[a-z0-9-]+)$/;
const WEAPON_RE = /-(sword-(blade|blade-lo|blade-hi|tip|guard)|dory-(shaft|tip)|hasta-(shaft|tip)|sauroter)$/;
const KOLIZJA_PROG = 0.006;

const WEAPON_CHAIN = {
  evocati: ['ev-sword-guard', 'ev-sword-blade', 'ev-sword-tip'],
  triari:  ['tr-arm-right-fist', 'tr-hasta-shaft', 'tr-hasta-tip'],
  hieros:  ['hl-sauroter', 'hl-dory-shaft', 'hl-dory-tip'],
  hastati: ['ha-sword-guard', 'ha-sword-blade-lo', 'ha-sword-blade-hi', 'ha-sword-tip'],
};
const WEAPON_MAIN = { evocati: 'ev-sword-blade', triari: 'tr-hasta-shaft', hieros: 'hl-dory-shaft', hastati: 'ha-sword-blade-lo' };
const SHIELD_FACE = { evocati: 'ev-shield-face', triari: 'tr-shield-face', hieros: 'hl-shield-face', hastati: 'ha-shield-face' };
// oś normalnej BIERZE SIĘ Z MODELU (`anchors.shieldKind`), nie z tabelki w teście
const FACE_AXIS_FOR_KIND = { 'round-aspis': 'axY', 'oval-scutum': 'axZ' };
// części twarzy, których widoczność jest asercją (K-sekcje sprzedają je jako cechę)
const FACE_PARTS = {
  evocati: ['ev-eye-left', 'ev-eye-right'],
  triari:  ['tr-beard'],
  hieros:  ['hl-eye-left', 'hl-eye-right'],
  hastati: ['ha-eye-left', 'ha-eye-right', 'ha-nose'],
};
const REF_FACE = { thorakites: ['th-eye-left', 'th-eye-right'], falanga: ['falangita-helmet-slit'] };

/** Pomiar w żywym Three.js: OBB + osie + kotwice dla każdej nazwanej części. */
async function measureAll(page) {
  return page.evaluate(({ units, refs }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    function dump(g) {
      g.updateMatrixWorld(true);
      const parts = []; const names = [];
      let meshCount = 0, minY = Infinity, maxY = -Infinity, maxR = 0;
      const v = new THREE.Vector3();
      g.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
        const geo = o.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        const bb = geo.boundingBox;
        for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) {
          v.set(cx, cy, cz).applyMatrix4(o.matrixWorld);
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
          const r = Math.hypot(v.x, v.z);
          if (r > maxR) maxR = r;
        }
        if (!o.name) return;
        names.push(o.name);
        const wp = new THREE.Vector3(); o.getWorldPosition(wp);
        const q = new THREE.Quaternion(); o.getWorldQuaternion(q);
        const ax = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(q).toArray();
        parts.push({
          name: o.name,
          localMin: [bb.min.x, bb.min.y, bb.min.z], localMax: [bb.max.x, bb.max.y, bb.max.z],
          pos: wp.toArray(), axX: ax(1, 0, 0), axY: ax(0, 1, 0), axZ: ax(0, 0, 1),
        });
      });
      return {
        meshCount, names, parts, minY, maxY, maxR, height: maxY - minY,
        anchors: g.userData['anchors'] || null,
        matCount: Array.isArray(g.userData['mats']) ? g.userData['mats'].length : -1,
      };
    }
    const out = { generic: {} };
    for (const u of units) {
      out[u.key] = dump(B(u.cat, 0x3366ee, u.pl));
      out[u.key + '_en'] = dump(B(u.cat, 0x3366ee, u.en));
    }
    for (const r of refs) out[r.key] = dump(B(r.cat, 0x3366ee, r.pl));
    out.generic.super = dump(B('super', 0x3366ee));
    out.generic.miecznik = dump(B('miecznik', 0x3366ee));
    out.generic.wlocznik = dump(B('wlocznik', 0x3366ee));
    return out;
  }, { units: UNITS, refs: REF });
}

/**
 * WIDOCZNOŚĆ CZĘŚCI Z KAMERY GRY, w PIKSELACH i z testem głębi GPU. Wybrane
 * mesh dostają jednolity wyróżnik, reszta modelu płaski ciemny materiał;
 * liczymy piksele wyróżnika po renderze. To jedyny sposób odróżnić „element
 * istnieje w 3D" od „element widać na ekranie" — trzy defekty tego audytu
 * przechodziły każdy test geometryczny i miały ZERO pikseli.
 */
async function measureFaceVisibility(page) {
  return page.evaluate(({ units, refs, faceParts, refFace }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 384, el = 52 * Math.PI / 180;
    const countVisible = (cat, name, wanted) => {
      document.body.innerHTML = '';
      const r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      r.setSize(S, S); r.setClearColor(0x000000, 1);
      document.body.appendChild(r.domElement);
      const s = new THREE.Scene();
      s.add(new THREE.AmbientLight(0xffffff, 1.0));
      const g = B(cat, 0x3366ee, name);
      let tinted = 0;
      g.traverse((o) => {
        if (!o.isMesh) return;
        if (wanted.indexOf(o.name) >= 0) { o.material = new THREE.MeshBasicMaterial({ color: 0xff00ff }); tinted++; }
        else { o.material = new THREE.MeshBasicMaterial({ color: 0x303030 }); }
      });
      s.add(g);
      const cam = new THREE.OrthographicCamera(-0.60, 0.60, 0.72, -0.48, 0.01, 10);
      cam.position.set(0, 0.30 + 3 * Math.sin(el), 3 * Math.cos(el));
      cam.lookAt(0, 0.30, 0);
      r.render(s, cam);
      const gl = r.getContext(); const px = new Uint8Array(S * S * 4);
      gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let vis = 0;
      for (let k = 0; k < S * S; k++) {
        if (px[k * 4] > 200 && px[k * 4 + 1] < 80 && px[k * 4 + 2] > 200) vis++;
      }
      r.dispose();
      return { vis, tinted };
    };
    const out = {};
    for (const u of units) out[u.key] = countVisible(u.cat, u.pl, faceParts[u.key]);
    for (const r of refs) if (refFace[r.key]) out[r.key] = countVisible(r.cat, r.pl, refFace[r.key]);
    // pilum Hastatiego — osobno (B7 nagłówka hastati-opus5.ts)
    out.hastati_pilum = countVisible('miecznik', 'Hastati',
      ['ha-pilum-shaft', 'ha-pilum-ferrule', 'ha-pilum-collar', 'ha-pilum-shank', 'ha-pilum-head']);
    out.hastati_pilum_head = countVisible('miecznik', 'Hastati', ['ha-pilum-head']);
    return out;
  }, { units: UNITS, refs: REF, faceParts: FACE_PARTS, refFace: REF_FACE });
}

/**
 * ODRÓŻNIALNOŚĆ z KAMERY GRY — piksele, nie binarna sylwetka (metoda T5/T6):
 * udział pikseli różniących się pokryciem albo barwą o ≥40/255 w sumie obrysów
 * pary. Kontrola miary: ten sam model porównany sam ze sobą musi dać ~0.
 */
async function pixelDistinctness(page) {
  return page.evaluate(({ all }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 192, el = 52 * Math.PI / 180;
    const shot = (cat, name) => {
      document.body.innerHTML = '';
      const r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      r.setSize(S, S); r.setClearColor(0x000000, 1);
      document.body.appendChild(r.domElement);
      const s = new THREE.Scene();
      const cam = new THREE.OrthographicCamera(-0.60, 0.60, 0.72, -0.48, 0.01, 10);
      cam.position.set(0, 0.30 + 3 * Math.sin(el), 3 * Math.cos(el));
      cam.lookAt(0, 0.30, 0);
      s.add(new THREE.AmbientLight(0xffffff, 0.95));
      const d = new THREE.DirectionalLight(0xffffff, 0.8); d.position.set(2, 4, 3); s.add(d);
      s.add(B(cat, 0x3366ee, name));
      r.render(s, cam);
      const gl = r.getContext(); const px = new Uint8Array(S * S * 4);
      gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
      r.dispose();
      return Array.from(px);
    };
    const diff = (A, B2) => {
      let uni = 0, dif = 0;
      for (let i = 0; i < S * S; i++) {
        const ar = A[i * 4], ag = A[i * 4 + 1], ab = A[i * 4 + 2];
        const br = B2[i * 4], bg = B2[i * 4 + 1], bb = B2[i * 4 + 2];
        const aOn = (ar + ag + ab) > 24, bOn = (br + bg + bb) > 24;
        if (!aOn && !bOn) continue;
        uni++;
        if (aOn !== bOn) { dif++; continue; }
        if (Math.abs(ar - br) >= 40 || Math.abs(ag - bg) >= 40 || Math.abs(ab - bb) >= 40) dif++;
      }
      return uni ? dif / uni : 0;
    };
    const shots = all.map((u) => shot(u.cat, u.pl));
    const pairs = [];
    for (let a = 0; a < shots.length; a++) for (let b = a + 1; b < shots.length; b++) {
      pairs.push({ a: all[a].key, b: all[b].key, d: diff(shots[a], shots[b]) });
    }
    return { pairs, same: diff(shots[0], shot(all[0].cat, all[0].pl)) };
  }, { all: UNITS.concat(REF) });
}

// ═══ ASERCJE H1-H15 — każda ma swoją POJEDYNCZĄ mutację M1-M15 ═════════════
function assertGeometry(m, faceVis, dist, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };

  // H1 — BROŃ nie tkwi w CIELE (klasa T1/T3/T5). Ręka uzbrojona wyłączona:
  // styk pięści i przedramienia z bronią to CHWYT, próg z rodziny (patrz H2).
  const h1 = [];
  for (const u of UNITS) {
    const mm = m[u.key];
    const body = mm.parts.filter((p) => BODY_RE.test(p.name));
    const weap = mm.parts.filter((p) => WEAPON_RE.test(p.name));
    for (const w of weap) for (const b of body) {
      const d = satDepth(obb(w), obb(b));
      if (d > KOLIZJA_PROG) h1.push({ u: u.key, w: w.name, b: b.name, d: +d.toFixed(4) });
    }
  }
  t('H1', '(H1) ŻADNA broń nie przenika ciała własnej figurki (4 jednostki, pełny SAT)', h1.length === 0, h1);

  // H2 — BROŃ nie przenika RAMIENIA ręki uzbrojonej. Ten sam błąd naprawiono
  // w T3 dla Falangity; kopia w jednostki-p6-super.ts go zachowała do T7.
  const armPen = {};
  for (const u of UNITS) {
    const n = byName(m[u.key]);
    const w = n[WEAPON_MAIN[u.key]], up = n[u.pf + '-arm-right-upper'];
    armPen[u.key] = (w && up) ? +satDepth(obb(w), obb(up)).toFixed(4) : NaN;
  }
  const nf = byName(m.falanga), nt = byName(m.thorakites);
  armPen.falangita = +satDepth(obb(nf['falangita-dory-shaft']), obb(nf['falangita-arm-right-upper'])).toFixed(4);
  armPen.thorakites = +satDepth(obb(nt['th-spear-shaft']), obb(nt['th-arm-right-upper'])).toFixed(4);
  t('H2', '(H2) broń NIE przenika ramienia ręki uzbrojonej — 0.0000 jak Falangita (T3) i Thorakites (T6)',
    UNITS.every((u) => armPen[u.key] === 0) && armPen.falangita === 0 && armPen.thorakites === 0, armPen);

  // H3 — BROŃ nie przenika własnej CHORĄGWI SUPER (znacznika elity).
  const h3 = [];
  for (const u of UNITS) {
    const mm = m[u.key];
    const ban = mm.parts.filter((p) => /-banner-/.test(p.name));
    if (ban.length === 0) continue;
    const weap = mm.parts.filter((p) => WEAPON_RE.test(p.name));
    for (const w of weap) for (const b of ban) {
      const d = satDepth(obb(w), obb(b));
      if (d > KOLIZJA_PROG) h3.push({ u: u.key, w: w.name, b: b.name, d: +d.toFixed(4) });
    }
  }
  t('H3', '(H3) ŻADNA broń nie przebija własnej chorągwi SUPER (3 supery mają chorągiew)',
    h3.length === 0 && UNITS.filter((u) => m[u.key].names.some((x) => /-banner-pole$/.test(x))).length === 3, h3);

  // H4 — EVOCATI MA OCZY i widać je z kamery gry. Przed T7 nie miał ich wcale.
  t('H4', '(H4) Evocati ma DWOJE oczu i widać je z kamery gry (≥ szczeliny hełmu Falangity)',
    m.evocati.names.filter((n) => /^ev-eye-/.test(n)).length === 2
    && faceVis.evocati.tinted === 2 && faceVis.evocati.vis >= faceVis.falanga.vis,
    { oczu: m.evocati.names.filter((n) => /^ev-eye-/.test(n)).length,
      pikseli: faceVis.evocati.vis, falangita_szczelina: faceVis.falanga.vis });

  // H5 — DOLNY RANT montefortino Evocatiego LEŻY POWYŻEJ linii oczu. To jest
  // przyczyna, a nie skutek: rant o promieniu 1.45x półszerokości głowy patrzy
  // z elewacji 52° na widza od góry i zasłania wszystko, co jest pod nim.
  // Wzorzec relacji: Thorakites po naprawie T6 — rant HEAD_CTR+0.022, oczy +0.008.
  const evN = byName(m.evocati);
  const evBowl = evN['ev-helmet-bowl'], evEye = evN['ev-eye-left'];
  const bowlBot = evBowl ? evBowl.pos[1] - (evBowl.localMax[1] - evBowl.localMin[1]) / 2 : NaN;
  const eyeTop = evEye ? evEye.pos[1] + (evEye.localMax[1] - evEye.localMin[1]) / 2 : NaN;
  t('H5', '(H5) dolny rant hełmu Evocatiego leży POWYŻEJ górnej krawędzi oczu (nie połyka twarzy)',
    Number.isFinite(bowlBot) && Number.isFinite(eyeTop) && bowlBot > eyeTop,
    { rant: +bowlBot.toFixed(4), gorna_krawedz_oka: +eyeTop.toFixed(4),
      pikseli_twarzy: faceVis.evocati.vis, thorakites_T6: faceVis.thorakites.vis });

  // H6 — TWARZ HASTATIEGO widoczna. Nagłówek pliku sprzedaje ją jako cechę.
  t('H6', '(H6) oczy i nos Hastatiego widoczne z kamery gry (≥ progu rodziny z T6)',
    faceVis.hastati.tinted === 3 && faceVis.hastati.vis >= faceVis.thorakites.vis,
    { hastati: faceVis.hastati.vis, thorakites_T6: faceVis.thorakites.vis });

  // H7 — SZCZĘKA HASTATIEGO leży na licu głowy, nie w jej wnętrzu.
  const haJaw = byName(m.hastati)['ha-jaw'];
  const haHead = byName(m.hastati)['ha-head'];
  const jawFront = haJaw ? Math.max(...[1, -1].map(() => haJaw.pos[2])) + (haJaw.localMax[2] - haJaw.localMin[2]) / 2 : NaN;
  const headFront = haHead ? haHead.pos[2] + (haHead.localMax[2] - haHead.localMin[2]) / 2 : NaN;
  t('H7', '(H7) szczęka Hastatiego wystaje POZA lico głowy (nie tkwi w jej wnętrzu)',
    Number.isFinite(jawFront) && Number.isFinite(headFront) && jawFront > headFront,
    { szczeka_przod: +jawFront.toFixed(4), glowa_lico: +headFront.toFixed(4) });

  // H8 — SIWY ZAROST TRIARIEGO widoczny z kamery gry (cecha charakteru z nagłówka).
  t('H8', '(H8) siwy zarost Triariego widoczny z kamery gry (≥ progu rodziny z T6)',
    faceVis.triari.tinted === 1 && faceVis.triari.vis >= faceVis.thorakites.vis,
    { triari: faceVis.triari.vis, thorakites_T6: faceVis.thorakites.vis });

  // H9 — STOPY NA TERENIE. Cała rodzina ma minY = 0.0000; Triari miał -0.0030.
  const minYs = {};
  for (const u of UNITS) minYs[u.key] = +m[u.key].minY.toFixed(4);
  for (const r of REF) minYs[r.key] = +m[r.key].minY.toFixed(4);
  t('H9', '(H9) żaden model nie schodzi poniżej płaszczyzny terenu (minY ≥ -0.0005)',
    UNITS.every((u) => minYs[u.key] >= -0.0005), minYs);

  // H10 — POLE TARCZY w kolorze gracza zwrócone DO kamery (klasa błędu T2).
  const dots = {};
  for (const u of UNITS) {
    const mm = m[u.key];
    const p = byName(mm)[SHIELD_FACE[u.key]];
    const kind = mm.anchors && mm.anchors.shieldKind;
    const axKey = kind ? FACE_AXIS_FOR_KIND[kind] : null;
    dots[u.key] = (p && axKey) ? +dot(p[axKey], CAM_VIEW).toFixed(3) : NaN;
  }
  t('H10', '(H10) pole tarczy w kolorze gracza zwrócone DO kamery gry we WSZYSTKICH 4 (klasa błędu T2)',
    UNITS.every((u) => Number.isFinite(dots[u.key]) && dots[u.key] < -0.30), dots);

  // H11 — ŁOKIEĆ ręki uzbrojonej ZGIĘTY (klasa błędu T1: ręka prosta jak kij).
  const bends = {};
  for (const u of UNITS) {
    const n = byName(m[u.key]);
    const up = n[u.pf + '-arm-right-upper'], fo = n[u.pf + '-arm-right-fore'];
    bends[u.key] = (up && fo) ? +Math.acos(Math.max(-1, Math.min(1, dot(up.axY, fo.axY)))).toFixed(3) : NaN;
  }
  t('H11', '(H11) łokieć ręki uzbrojonej ZGIĘTY (>0.30 rad) we wszystkich 4',
    UNITS.every((u) => Number.isFinite(bends[u.key]) && bends[u.key] > 0.30), bends);

  // H12 — ODRÓŻNIALNOŚĆ: żadna para z sześciu modeli nie jest jedną figurką.
  // Próg 0.558 to WYNIK naprawy T6 dla analogicznej pary elita/liniowa
  // (Gwardia Tyreńska vs Tyrski miecznik) — liczba z rodziny, nie z sufitu.
  const PROG_T6 = 0.558;
  const worst = dist.pairs.slice().sort((x, y) => x.d - y.d)[0];
  t('H12', '(H12) KAŻDA z 15 par sześciu modeli różni się z kamery gry ≥0.558 (wynik naprawy T6)',
    dist.same < 0.01 && dist.pairs.every((p) => p.d >= PROG_T6),
    { kontrola_ten_sam_model: +dist.same.toFixed(4),
      najgorsza_para: worst.a + '/' + worst.b + '=' + worst.d.toFixed(3),
      ponizej: dist.pairs.filter((p) => p.d < PROG_T6).map((p) => p.a + '/' + p.b + '=' + p.d.toFixed(3)) });

  // H13 — ELITA vs JEDNOSTKA LINIOWA tej samej kultury. To jest para, która
  // przed T7 dawała 0.390 (Hieros Lochos vs Falanga) — dokładnie klasa T6/A4.
  const hf = dist.pairs.find((p) => (p.a === 'hieros' && p.b === 'falanga') || (p.a === 'falanga' && p.b === 'hieros'));
  const eh = dist.pairs.find((p) => (p.a === 'evocati' && p.b === 'hastati') || (p.a === 'hastati' && p.b === 'evocati'));
  t('H13', '(H13) obie pary elita/liniowa (Hieros vs Falanga, Evocati vs Hastati) ≥0.558',
    hf && eh && hf.d >= PROG_T6 && eh.d >= PROG_T6,
    { hieros_falanga: hf && +hf.d.toFixed(3), evocati_hastati: eh && +eh.d.toFixed(3) });

  // H14 — WIDOCZNOŚĆ BRONI z kamery gry (klasa błędu T6/A1). Próg to 0.60
  // widoczności dory Falangity policzonej W TYM SAMYM renderze.
  const visF = weaponVisibility(m.falanga, ['falangita-arm-right-fist', 'falangita-dory-shaft', 'falangita-dory-tip']).vis;
  const vis = {}, scr = {};
  for (const u of UNITS) {
    const w = weaponVisibility(m[u.key], WEAPON_CHAIN[u.key]);
    vis[u.key] = +w.vis.toFixed(3); scr[u.key] = +w.screen.toFixed(4);
  }
  t('H14', '(H14) broń KAŻDEJ z 4 widoczna z kamery gry (≥0.60 widoczności dory Falangity z T3)',
    Number.isFinite(visF) && UNITS.every((u) => Number.isFinite(vis[u.key]) && vis[u.key] >= 0.60 * visF),
    { falangita: +visF.toFixed(3), prog: +(0.60 * visF).toFixed(3), widocznosc: vis, dlugosc_ekranowa: scr });

  // H15 — GROT PILUM HASTATIEGO wychodzi ponad rant tarczy i widać go z kamery
  // gry. Drzewce przechodzi ZA czaszą tarczy (tak jest zaprojektowane), więc
  // jedynym nośnikiem „Atak dystansowy = 3" w sylwetce jest wystający grot.
  const haN = byName(m.hastati);
  const haHead2 = haN['ha-pilum-head'], haFace2 = haN['ha-shield-face'];
  const grotY = haHead2 ? toImg(haHead2.pos)[1] : NaN;
  const tarczaY = haFace2 ? toImg(haFace2.pos)[1] + (haFace2.localMax[1] - haFace2.localMin[1]) / 2 * Math.cos(EL) : NaN;
  t('H15', '(H15) grot pilum Hastatiego widoczny z kamery gry i PONAD rantem tarczy (nośnik ataku dystansowego)',
    faceVis.hastati_pilum.tinted === 5 && faceVis.hastati_pilum.vis >= 100
    && faceVis.hastati_pilum_head.vis >= 8 && Number.isFinite(grotY) && grotY > tarczaY,
    { pikseli_calego_pilum: faceVis.hastati_pilum.vis, pikseli_grotu: faceVis.hastati_pilum_head.vis,
      grot_ekran_y: +grotY.toFixed(4), gorny_rant_tarczy_y: +tarczaY.toFixed(4) });

  // H16 — TWARZ HIEROS LOCHOS widoczna z kamery gry. Przed T7 helm koryncki
  // siedział nasunięty na twarz dokładnie jak u liniowego Falangity.
  t('H16', '(H16) twarz Hieros Lochos widoczna z kamery gry (hełm zsunięty na ciemię, ≥ progu z T6)',
    m.hieros.names.filter((n) => /^hl-eye-/.test(n)).length === 2
    && faceVis.hieros.tinted === 2 && faceVis.hieros.vis >= faceVis.thorakites.vis,
    { hieros: faceVis.hieros.vis, thorakites_T6: faceVis.thorakites.vis });

  if (!soft) {
    console.log('  [relacje] widocznosc broni=' + JSON.stringify(vis) + ' (Falangita T3=' + visF.toFixed(3) + ')'
      + ' | bron w ramieniu=' + JSON.stringify(armPen)
      + ' | normale tarcz do kamery=' + JSON.stringify(dots)
      + ' | lokcie=' + JSON.stringify(bends) + ' | minY=' + JSON.stringify(minYs)
      + ' | piksele twarzy=' + JSON.stringify(Object.fromEntries(Object.entries(faceVis).map(([k, v]) => [k, v.vis]))));
  }
  return res;
}

/** Reszta: dispatch, nazwy, kotwice, proporcje, chwyt, dane, brak regresji, sekcje K. */
function assertRest(m, faceVis, dist, src, unitRows) {
  // --- (D) DISPATCH: nazwa PL i EN trafia we WŁASNY model, nie w generyka ----
  for (const u of UNITS) {
    const a = m[u.key], g = m.generic[u.cat];
    // Kryterium NIE jest „inna liczba mesh" — generyk `super` ma dzis przypadkiem
    // dokladnie tyle samo mesh co Triari (37). Rozstrzyga to, ze wszystkie czesci
    // maja nazwe z prefiksem jednostki, a generyk nie nazywa ANI JEDNEJ.
    check('(D:' + u.key + ') „' + u.pl + '" (PL) buduje własny model, nie generyk `' + u.cat + '`',
      a.names.length === a.meshCount && a.names.every((n) => n.startsWith(u.pf + '-'))
      && g.names.length === 0 && a.anchors !== null && g.anchors === null,
      { unit: a.meshCount, generic: g.meshCount, nazwane: a.names.length, generic_nazwane: g.names.length });
    const b = m[u.key + '_en'];
    check('(D:' + u.key + ':en) „' + u.en + '" (EN) trafia w TEN SAM model co nazwa PL',
      b.meshCount === a.meshCount && b.names.length === a.names.length
      && b.names.every((n) => n.startsWith(u.pf + '-')),
      { en: b.meshCount, pl: a.meshCount });
  }

  // --- (N) każdy mesh nazwany + kotwice (warunek możliwości audytu) ----------
  for (const u of UNITS) {
    const mm = m[u.key];
    check('(N:' + u.key + ') KAŻDY mesh ma nazwę z prefiksem `' + u.pf + '-` i grupa ma `userData.anchors`',
      mm.names.length === mm.meshCount && mm.names.every((n) => n.startsWith(u.pf + '-')) && mm.anchors !== null,
      { mesh: mm.meshCount, nazwane: mm.names.length, anchors: mm.anchors !== null });
    check('(N:' + u.key + ':unikat) nazwy części są UNIKALNE (żadna nie nadpisuje adresu innej)',
      new Set(mm.names).size === mm.names.length,
      mm.names.filter((n, i) => mm.names.indexOf(n) !== i));
    check('(N:' + u.key + ':kotwice) kotwice niosą rodzaj tarczy, rodzaj broni i punkt chwytu',
      mm.anchors !== null && typeof mm.anchors.shieldKind === 'string'
      && typeof mm.anchors.weaponKind === 'string' && Array.isArray(mm.anchors.grip),
      mm.anchors && { shieldKind: mm.anchors.shieldKind, weaponKind: mm.anchors.weaponKind });
  }

  // --- (E) proporcje ---------------------------------------------------------
  for (const u of UNITS) {
    const mm = m[u.key];
    check('(E:' + u.key + ') stopy na y≈0, promień w limicie heksu (≤0.866), wysokość 0.55–0.90×HEX_R',
      mm.minY > -0.0005 && mm.maxR <= 0.866 && mm.height > 0.55 && mm.height < 0.90,
      { minY: +mm.minY.toFixed(4), maxR: +mm.maxR.toFixed(4), h: +mm.height.toFixed(4) });
  }

  // --- (C) CHWYT: dłoń trzyma broń, a nie mija ją (klasa błędu T1) -----------
  for (const u of UNITS) {
    const n = byName(m[u.key]);
    const fist = n[u.pf + '-arm-right-fist'], w = n[WEAPON_MAIN[u.key]];
    const off = (fist && w) ? distPointLine(fist.pos, w.pos, unit(w.axY)) : NaN;
    check('(C:' + u.key + ') dłoń uzbrojona leży NA OSI broni (<0.030×HEX_R) — trzyma, nie mija',
      Number.isFinite(off) && off < 0.030, { odleglosc: +(off || 0).toFixed(4) });
  }

  // --- (R) BRAK REGRESJI modeli sąsiednich (T3, T6) --------------------------
  check('(R1) Falangita (T3, hastati-falangita.ts) nadal 27 mesh, wszystkie nazwane, bez nazw T7',
    m.falanga.meshCount === 27 && m.falanga.names.length === 27
    && !m.falanga.names.some((n) => /^(ev|tr|hl|ha)-/.test(n)),
    { mesh: m.falanga.meshCount, nazwane: m.falanga.names.length });
  check('(R2) Thorakites (T6) nadal 32 mesh, wszystkie nazwane, bez nazw T7',
    m.thorakites.meshCount === 32 && m.thorakites.names.length === 32
    && !m.thorakites.names.some((n) => /^(ev|tr|hl|ha)-/.test(n)),
    { mesh: m.thorakites.meshCount });
  check('(R3) Gwardia Tyreńska (T6, ten sam plik co Triari) nadal 33 mesh z prefiksem `gt-`',
    m.gwardia.meshCount === 33 && m.gwardia.names.every((n) => n.startsWith('gt-')),
    { mesh: m.gwardia.meshCount });
  check('(R4) generyki `super`/`miecznik`/`wlocznik` nietknięte (brak nazw czwórki T7)',
    ['super', 'miecznik', 'wlocznik'].every((k) => !m.generic[k].names.some((n) => /^(ev|tr|hl|ha)-/.test(n))));

  // --- (0) KOTWICE W DANYCH — model musi zgadzać się z units.json ------------
  const row = (nm) => unitRows.find((r) => r['Jednostka'] === nm);
  {
    const tri = row('Triari');
    check('(0a) units.json: Triari to Spearman z Atakiem dystansowym 0 — model MUSI mieć włócznię',
      tri && tri['Typ'] === 'Spearman' && tri['Atak dystansowy'] === 0
      && m.triari.anchors.weaponKind === 'spear-hasta',
      tri && { typ: tri['Typ'], ad: tri['Atak dystansowy'], bron: m.triari.anchors.weaponKind });
    const has = row('Hastati');
    check('(0b) units.json: Hastati ma Atak dystansowy 3, zasięg 2, 2 pociski — model MUSI mieć pilum',
      has && has['Atak dystansowy'] === 3 && has['Zasięg ataku (hex)'] === 2
      && has['Ilość pocisków'] === 2 && m.hastati.anchors.missileKind === 'pilum',
      has && { ad: has['Atak dystansowy'], zasieg: has['Zasięg ataku (hex)'], pociski: has['Ilość pocisków'] });
    const hie = row('Hieros Lochos (Święty Zastęp)');
    check('(0c) units.json: Hieros Lochos ma w Uwagach „włócznia (dory) + aspis" — model MUSI mieć dory',
      hie && /dory/i.test(hie['Uwagi']) && m.hieros.anchors.weaponKind === 'spear-dory',
      hie && { uwagi: hie['Uwagi'], bron: m.hieros.anchors.weaponKind });
    const evo = row('Evocati');
    check('(0d) units.json: Evocati to Swordsman/Super — model MUSI mieć gladius',
      evo && evo['Typ'] === 'Swordsman' && evo['Super-jednostka'] === 'TAK'
      && m.evocati.anchors.weaponKind === 'sword-gladius',
      evo && { typ: evo['Typ'], super: evo['Super-jednostka'] });
  }
  {
    // Trzy z czwórki są SUPER (Hastati nie) — chorągiew jest znacznikiem SUPER.
    const superne = UNITS.filter((u) => m[u.key].names.some((n) => /-banner-pole$/.test(n))).map((u) => u.key);
    const superneWDanych = UNITS.filter((u) => { const r = row(u.pl); return r && r['Super-jednostka'] === 'TAK'; }).map((u) => u.key);
    check('(0e) chorągiew-znacznik SUPER mają DOKŁADNIE te jednostki, które są SUPER w units.json',
      JSON.stringify(superne.slice().sort()) === JSON.stringify(superneWDanych.slice().sort()),
      { model: superne, dane: superneWDanych });
  }
  {
    const uniq = ['evocati', 'triari', 'hieros', 'hastati'];
    const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[Łł]/g, 'l').toLowerCase();
    for (const core of uniq) {
      const hits = unitRows.filter((r) => norm(r['Jednostka']).includes(core) || norm(r['Nazwa EN'] || '').includes(core));
      check('(0f:' + core + ') rdzeń dispatchu JEDNOZNACZNY w całym units.json (dokładnie 1 trafienie)',
        hits.length === 1, hits.map((r) => r['Jednostka']));
    }
  }

  // --- (K) SEKCJE HISTORYCZNE — obecność i KONKRET, nie sam nagłówek --------
  const naglowkiP6 = (src.p6.match(/ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(/g) || []).length;
  const naglowkiZ2 = (src.z2.match(/ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(/g) || []).length;
  check('(K0) każdy z trzech plików ma sekcję ZGODNOSC HISTORYCZNA dla swojej jednostki T7',
    naglowkiP6 === 2 && naglowkiZ2 === 5
    && /ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(Triari\)/.test(src.z2)
    && /ZGODNOSC HISTORYCZNA/.test(src.ho),
    { p6: naglowkiP6, z2: naglowkiZ2 });
  const K = [
    ['K:hieros-plutarch',   src.p6, /Plutarch, „Pelopidas" 18/],
    ['K:hieros-leuktry',    src.p6, /371 p\.n\.e/],
    ['K:hieros-chaironeja', src.p6, /338 p\.n\.e/],
    ['K:hieros-gorgidas',   src.p6, /Gorgidas/],
    ['K:hieros-ksenofont',  src.p6, /Ksenofont, „Hellenika" VI\.4/],
    ['K:hieros-maczuga',    src.p6, /MACZUGA HERAKLESA, NIE THETA/],
    ['K:hieros-helm-anach', src.p6, /helm koryncki \(pelna|Helm koryncki \(pelna/i],
    ['K:hieros-stylizacja', src.p6, /SWIADOMA STYLIZACJA GRY, NIE ZRODLO/],
    ['K:hieros-beocka-odrzucona', src.p6, /TARCZA BEOCKA — ROZWAZONA I ODRZUCONA/],
    ['K:evocati-dion',      src.p6, /Kasjusz Dion XLV\.12/],
    ['K:evocati-appian',    src.p6, /Appian, „Wojny domowe" III\.40/],
    ['K:evocati-polibiusz', src.p6, /Polibiusz\s*\n?\s*\/\/\s*VI\.23|Polibiusz VI\.23/],
    ['K:evocati-10000',     src.p6, /10 000 drachm/],
    ['K:evocati-fajum',     src.p6, /Fajum/],
    ['K:evocati-falery-anachronizm', src.p6, /ANACHRONIZM POGRANICZNY, NAZWANY WPROST/],
    ['K:triari-liwiusz',    src.z2, /sinistro crure porrecto/],
    ['K:triari-proverb',    src.z2, /res ad triarios\s*\n?\s*\/\/\s*rediit|res ad triarios rediit/],
    ['K:triari-polibiusz',  src.z2, /Polibiusz VI\.23\.16/],
    ['K:triari-pliniusz',   src.z2, /Pliniusz „Historia naturalna" VII\.211/],
    ['K:triari-falery-anachronizm', src.z2, /TEN SAM ANACHRONIZM CO U EVOCATIEGO/],
    ['K:triari-czego-nie-odwzorowuje', src.z2, /CZEGO MODEL NIE ODWZOROWUJE/],
    ['K:hastati-sprostowanie-podpiecia', src.ho, /OBA ZDANIA SA NIEPRAWDZIWE/],
    ['K:hastati-sprostowanie-ubostwa',   src.ho, /Polibiusz tego NIE mowi/],
    ['K:hastati-welici',    src.ho, /VI\.21\.7-9/],
    ['K:hastati-poza-rzutu', src.ho, /NIE JEST — i tak ma zostac/],
  ];
  for (const [id, text, re] of K) {
    check('(' + id + ') sekcja historyczna niesie konkret, nie sam nagłówek', re.test(text));
  }
  check('(K:sprostowanie-naglowka) hastati-opus5.ts NIE twierdzi już, że jest niepodpięty do gry',
    !/WARIANT PORÓWNAWCZY modelu HASTATI \(nie podpięty do gry\)/.test(src.ho)
    && /MODEL HASTATIEGO UZYWANY PRZEZ GRE/.test(src.ho));
  check('(K:units-ts) units.ts faktycznie dispatchuje Hastatiego do hastati-opus5.ts (podstawa sprostowania)',
    /if \(n\.includes\('hastati'\)\) return buildHastatiOpus5\(ownerColor_\);/.test(src.units));
}

async function main() {
  const src = {
    p6: fs.readFileSync(P6_TS, 'utf8'),
    z2: fs.readFileSync(Z2_TS, 'utf8'),
    ho: fs.readFileSync(HO_TS, 'utf8'),
    units: fs.readFileSync(UNITS_TS, 'utf8'),
  };
  const unitsJson = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
  const unitRows = Array.isArray(unitsJson) ? unitsJson : Object.values(unitsJson);

  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(ENTRY, [
    "import * as THREE from 'three';",
    "import { buildUnitModel } from '../src/render/units.ts';",
    'window.__THREE = THREE;',
    'window.__buildUnitModel = buildUnitModel;',
    '',
  ].join('\n'), 'utf8');

  const BUNDLE_PO = path.join(OUTDIR, 'po.js');
  await buildBundle(BUNDLE_PO, []);

  const bundles = [];
  for (const mut of MUTATIONS) {
    const stat = { applied: 0, bad: [] };
    const out = path.join(OUTDIR, 'mut-' + mut.id + '.js');
    await buildBundle(out, [makeMutPlugin(mut, stat)]);
    bundles.push({ mut, out, stat });
  }
  const bad = bundles.filter((g) => g.stat.applied !== 1);
  check('(M0) każda z ' + MUTATIONS.length + ' mutacji trafiła w DOKŁADNIE JEDNO miejsce w źródle',
    bad.length === 0, bad.map((g) => g.mut.id + ' applied=' + g.stat.applied + ' ' + g.stat.bad.join(',')));
  if (bad.length > 0) {
    console.log('\nPRZERWANE: nie da się odtworzyć stanu sprzed poprawki — kod się przesunął, popraw MUTATIONS.');
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1400, height: 560 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function loadBundle(file) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
    await page.addScriptTag({ path: file });
  }

  const SHOT_SET = UNITS.map((u) => [u.pl, u.cat]).concat(REF.slice(0, 2).map((r) => [r.pl, r.cat]));
  const SHOT = async (file) => {
    await page.evaluate(({ set }) => {
      const THREE = window.__THREE;
      const B = window.__buildUnitModel;
      document.body.innerHTML = '';
      const W = 1400, H = 560, halfW = (set.length * 0.95) / 2 + 0.15;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setClearColor(0x6f8f5f, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 0.78));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.05); d1.position.set(2, 4, 3); scene.add(d1);
      const el = 52 * Math.PI / 180;                 // KAMERA GRY (camera.ts)
      const cols = [0x3366ee, 0xcc4422, 0x22aa55, 0xbb33bb, 0xddaa22, 0x22aacc];
      set.forEach((p, i) => {
        const g = B(p[1], cols[i % 6], p[0]);
        g.position.x = (i - (set.length - 1) / 2) * 0.95;
        scene.add(g);
      });
      const cy = 0.20, halfH = halfW * H / W;
      const cam = new THREE.OrthographicCamera(-halfW, halfW, cy + halfH, cy - halfH, 0.01, 20);
      cam.position.set(0, cy + 6 * Math.sin(el), 6 * Math.cos(el));
      cam.lookAt(0, cy, 0);
      renderer.render(scene, cam);
      window.__ready = true;
    }, { set: SHOT_SET });
    await page.waitForFunction('window.__ready === true');
    await page.screenshot({ path: file });
    await page.evaluate(() => { window.__ready = false; });
  };

  const matrix = [];
  try {
    console.log('\n--- (D)-(K) pomiar PO audycie (bundel z niezmienionych źródeł) ---');
    await loadBundle(BUNDLE_PO);
    const after = await measureAll(page);
    const faceAfter = await measureFaceVisibility(page);
    const distAfter = await pixelDistinctness(page);
    assertGeometry(after, faceAfter, distAfter, false);
    assertRest(after, faceAfter, distAfter, src, unitRows);
    console.log('  [odroznialnosc] kontrola „ten sam model" = ' + distAfter.same.toFixed(4)
      + ' | pary = ' + distAfter.pairs.slice().sort((a, b) => a.d - b.d)
        .map((r) => r.a + '/' + r.b + '=' + r.d.toFixed(3)).join(' '));

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await SHOT(path.join(SHOTS, 'po-super-rzym-grecja-kamera-gry.png'));
    }

    console.log('\n--- (M) MACIERZ ABLACYJNA: jedna mutacja = jedno miejsce = jedna asercja ---');
    const base = assertGeometry(after, faceAfter, distAfter, true);
    matrix.push({ label: 'BAZA'.padEnd(5) + ' (bez mutacji)'.padEnd(64), res: base });
    for (const g of bundles) {
      await loadBundle(g.out);
      const mm = await measureAll(page);
      const fv = await measureFaceVisibility(page);
      const dd = await pixelDistinctness(page);
      matrix.push({ label: g.mut.id.padEnd(5) + ' ' + g.mut.opis.slice(0, 62).padEnd(64), res: assertGeometry(mm, fv, dd, true), mut: g.mut });
      if (SHOTS !== null && (g.mut.id === 'M6' || g.mut.id === 'M8' || g.mut.id === 'M13')) {
        await SHOT(path.join(SHOTS, 'przed-' + g.mut.id + '.png'));
      }
    }
    const ids = base.map((r) => r.id);
    console.log('       ' + ids.map((i) => i.padEnd(6)).join(''));
    for (const row of matrix) {
      const map = Object.fromEntries(row.res.map((r) => [r.id, r.cond]));
      console.log(row.label + ids.map((i) => (map[i] ? 'green' : 'RED  ').padEnd(6)).join(''));
    }
    const nieNosne = [];
    for (const row of matrix) {
      if (!row.mut) continue;
      const map = Object.fromEntries(row.res.map((r) => [r.id, r.cond]));
      if (map[row.mut.cel] !== false) nieNosne.push(row.mut.id + '→' + row.mut.cel);
    }
    check('(M1) KAŻDA z H1-H' + ids.length + ' czerwienieje pod SWOJĄ pojedynczą mutacją — (H) nie jest tautologią',
      nieNosne.length === 0, { nienosne: nieNosne });
    check('(M2) na niezmienionym źródle WSZYSTKIE asercje (H) są zielone (baza macierzy)',
      base.every((r) => r.cond), base.filter((r) => !r.cond).map((r) => r.id));

    check('(F0) zero błędów konsoli/JS we wszystkich renderach', pageErrors.length === 0, pageErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  // --- (G) artefakt PRODUKCYJNY vite build (C-001) ---------------------------
  if (!SKIP_VITE) {
    let distDir = DIST_ARG !== null ? path.dirname(DIST_ARG) : null;
    if (distDir === null) {
      distDir = path.join(os.tmpdir(), `civ-zelazo-t7-render-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', distDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
    }
    const collect = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return collect(p);
      return /\.(html|js|css)$/.test(e.name) ? [fs.readFileSync(p, 'utf8')] : [];
    });
    const built = collect(distDir).join('\n');
    check('(G1) artefakt vite build niesie wszystkie 4 rdzenie dispatchu tematu',
      /evocati/i.test(built) && /triari/i.test(built) && /hieros/i.test(built) && /hastati/i.test(built));
    check('(G2) artefakt vite build niesie nazwy mesh dodane przez T7 (naprawa jest w produkcji)',
      /hl-dory-shaft/.test(built) && /ev-shield-face/.test(built)
      && /tr-hasta-shaft/.test(built) && /ha-pilum-head/.test(built));
    // Stałe liczbowe NIE nadają się na kotwicę: vite minifikuje `0.068` do `.068`
    // i skleja je z setkami innych liczb. Kotwicą są nazwy mesh, które istnieją
    // WYŁĄCZNIE w kodzie naprawionym w T7 — jeśli są w artefakcie, znaczy że
    // naprawiona ścieżka faktycznie się kompiluje i trafia do produkcji.
    // (Nazwy skladane w petli, np. 'hl-episema-club-' + i, trafiaja do artefaktu
    // jako sam PREFIKS — dlatego kotwice sa prefiksami, nie pelnymi nazwami.)
    const T7_ONLY = ['hl-episema-club-', 'hl-shield-band', 'hl-helmet-dome',
                     'ha-helmet-rib', 'ha-helmet-cheek-', 'tr-helmet-bowl', 'tr-beard',
                     'ev-mail-hem', 'ev-shield-face'];
    const brak = T7_ONLY.filter((n) => !built.includes(n));
    check('(G3) artefakt vite build niesie części dodane/naprawione w T7 (naprawa jest w produkcji)',
      brak.length === 0, { brak });
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch (_) {}

  console.log('\nzelazo-super-rzym-grecja-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
