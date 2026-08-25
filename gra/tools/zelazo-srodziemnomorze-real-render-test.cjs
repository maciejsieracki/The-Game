'use strict';
/**
 * zelazo-srodziemnomorze-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T6 (audyt czterech jednostek
 * śródziemnomorskich epoki Żelaza: Gwardia Tyreńska, Tyrski miecznik,
 * Wojownik z żelaznym khopesh, Thorakites — `gra/src/render/jednostki-z2-srodziemne.ts`).
 *
 * ZGŁOSZENIE: te cztery jednostki MIAŁY dedykowany kod, ale nigdy nie przeszły
 * rygorystycznego pomiaru. Przed audytem plik nie nazywał ANI JEDNEGO mesh
 * (zmierzone: 0/33, 0/30, 0/31, 0/32) i nie miał `userData.anchors` — więc
 * żaden test nie mógł zaadresować części, a punkty odniesienia musiałyby być
 * wpisane liczbowo w test (czyli test mierzyłby sam siebie).
 *
 * Audyt znalazł pięć realnych defektów; trzy z nich to NOWA klasa błędu w tej
 * serii — nie „broń tkwi w ciele" (T1/T3/T5), tylko „element jest fizycznie
 * NIEWIDOCZNY z jedynej kamery, jakiej używa gra":
 *   (A1) miecz Gwardii Tyreńskiej uniesiony wzdłuż kierunku patrzenia kamery —
 *        rzutował się na 14% własnej długości;
 *   (A2) sierp khopesza wygięty w płaszczyźnie strzałkowej, w którą kamera
 *        patrzy wzdłuż — krzywizna (jedyna cecha odróżniająca khopesz od
 *        miecza) miała na ekranie strzałkę 0,0000;
 *   (A3) dzwon helmu attyckiego Thorakitesa pochłaniał oczy (przenikanie
 *        0,0195 na oko) — model renderował helm ZAMKNIĘTY;
 *   (A4) Gwardia Tyreńska i Tyrski miecznik były z kamery gry tą samą
 *        figurką (0,373 przy 0,721–0,811 dla każdej innej pary);
 *   (A5) dwie z czterech nazw angielskich z units.json dawały 28-meshowy
 *        generyk `miecznik` zamiast własnego modelu.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA (R-PROC-AUTOBOT.md §9 poz. 6a): to są modele
 * 3D (Three.js). Wszystkie pięć defektów „wyglądało" w kodzie poprawnie —
 * (A1) i (A2) są w ogóle niewidoczne bez policzenia RZUTU na płaszczyznę
 * obrazu kamery gry, a (A3) bez policzenia przenikania brył.
 *
 * KAMERA GRY: `camera.ts` — stały azymut 0, elewacja 52°. Kierunek patrzenia
 * (0; -sin52; -cos52). Baza płaszczyzny obrazu: poziom (1;0;0), pion
 * (0; cos52; -sin52). Wszystkie asercje „widoczności" liczą się w tej bazie.
 *
 * PROGI BIORĄ SIĘ Z RODZINY, NIE Z SUFITU: modelem odniesienia jest Falangita
 * (T3, `hastati-falangita.ts`) — zaakceptowany model tej samej serii i tej
 * samej konwencji. Jego dory ma widoczność 0,894 (rzut/długość własna), a jego
 * chwyt: przedramię/drzewce 0,0218, pięść/drzewce 0,0335, RAMIĘ 0,0000 —
 * dlatego pięść i przedramię ręki uzbrojonej są z kontroli (H1) wyłączone,
 * a RAMIĘ nie.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI — MACIERZ ABLACYJNA, MUTACJA POJEDYNCZA NA
 * ASERCJĘ (standard serii ustalony przez Evaluatora T4, utrzymany w T5):
 *   (D) dispatch: bundel z usuniętymi DOKŁADNIE dwoma aliasami angielskimi
 *       w `units.ts` — asercje (A5-A6) muszą się zaczerwienić, (A1-A4) zostać
 *       zielone.
 *   (M1..M11) geometria: JEDENAŚCIE osobnych bundli, każdy z DOKŁADNIE JEDNĄ
 *       podmienioną stałą/linią w `jednostki-z2-srodziemne.ts`. Każda z
 *       asercji H1-H11 musi zaczerwienić się pod SWOJĄ mutacją.
 *
 * Usage (z gra/): node tools/zelazo-srodziemnomorze-real-render-test.cjs
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
  console.error('[zelazo-srodziemnomorze-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-srodziemnomorze-entry.ts');
const OUTDIR = path.resolve(os.tmpdir(), 'civ-zelazo-t6-bundles');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const Z2_TS = path.resolve(GRA, 'src', 'render', 'jednostki-z2-srodziemne.ts');
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

// ── jednostki i ich prefiksy mesh ──────────────────────────────────────────
const UNITS = [
  { pl: 'Gwardia Tyreńska',            en: 'Tyre Guard',           pf: 'gt', cat: 'miecznik' },
  { pl: 'Tyrski miecznik',             en: 'Tyrian Swordsman',     pf: 'tm', cat: 'miecznik' },
  { pl: 'Wojownik z żelaznym khopesh', en: 'Iron Khopesh Warrior', pf: 'kh', cat: 'miecznik' },
  { pl: 'Thorakites',                  en: 'Thorakites',           pf: 'th', cat: 'wlocznik' },
];
// „Iron Khopesh Warrior" NIE jest tu sprawdzany jako trafiający we własny model:
// zmierzone, że łapie go WCZEŚNIEJSZA linia dispatchu brązowego wojownika
// z khopesh (`khopesh warrior` — rdzeń NIEjednoznaczny w units.json, 2 wiersze).
// Poprawka leży poza allowlistą T6; asercja (A8) niżej PILNUJE tego stanu
// jawnie, żeby nikt nie uznał go za naprawiony bez zmiany tamtej linii.
const EN_TRAFIA = ['gt', 'tm', 'th'];

// ── (D) mutacja DISPATCHU: cofnięcie dwóch aliasów angielskich ─────────────
const EN_ALIASES = [
  [" || n.includes('tyrian swordsman')", ''],
  [" || n.includes('tyre guard')", ''],
];
function makeDispatchPlugin(stat) {
  return {
    name: 'revert-en-dispatch',
    setup(build) {
      build.onLoad({ filter: /units\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== UNITS_TS) return null;
        let out = fs.readFileSync(args.path, 'utf8');
        for (const [from, to] of EN_ALIASES) {
          if (out.includes(from)) { out = out.split(from).join(to); stat.applied++; }
        }
        return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    },
  };
}

/**
 * (M) MACIERZ ABLACYJNA — jedna mutacja = jedno miejsce = jedna asercja.
 * Każda odtwarza konkretny, prawdopodobny błąd konstrukcyjny (w większości
 * DOKŁADNIE stan sprzed audytu); `cel` mówi, KTÓRA asercja ma się zaczerwienić.
 */
const GEOM_MUTATIONS = [
  { id: 'M1', cel: 'H1', opis: 'miecz Gwardii zakotwiczony w torsie zamiast w nadgarstku',
    from: "z2IronSword(group, armR.wrist, armR.axis, THF, mSteel, mGold, getGZ2Blade(), 'gt');",
    to:   "z2IronSword(group, new THREE.Vector3(0, Z2_TORSO_CTR, 0), armR.axis, THF, mSteel, mGold, getGZ2Blade(), 'gt');" },
  { id: 'M2', cel: 'H2', opis: 'tarcza Tyrskiego miecznika nasunieta na wlasne przedramie',
    from: "  z2MountShield(group, sh, armL.wrist);\n\n  group.userData['mats'] = mats;\n  group.userData['perTokenGeos'] = [];\n  // Kotwice do asercji geometrycznych",
    to:   "  sh.position.copy(armL.wrist); sh.rotation.y = -0.20; group.add(sh);\n\n  group.userData['mats'] = mats;\n  group.userData['perTokenGeos'] = [];\n  // Kotwice do asercji geometrycznych" },
  { id: 'M3', cel: 'H3', opis: 'miecz Gwardii z powrotem w gore-w PRZOD (stan sprzed audytu)',
    from: '  const THF = 4.10;                                 // przedramie/miecz: w gore-w tyl',
    to:   '  const THF = 2.62;                                 // przedramie/miecz: w gore-w tyl' },
  { id: 'M4', cel: 'H4', opis: 'sierp khopesza z powrotem w plaszczyznie strzalkowej (sprzed audytu)',
    from: '  const KH_ROLL = -1.15;                            // obrot plaszczyzny sierpa ku kamerze',
    to:   '  const KH_ROLL = 0.0;                              // obrot plaszczyzny sierpa ku kamerze' },
  { id: 'M5', cel: 'H5', opis: 'khopesz wyprostowany — przestaje byc sierpem',
    from: "    const a = [0.40, 0.95, 1.55][i]!;",
    to:   "    const a = [0.02, 0.04, 0.06][i]!;" },
  { id: 'M6', cel: 'H6', opis: 'helm attycki Thorakitesa z powrotem pochlania oczy (sprzed audytu)',
    from: '  const HELM_Y = Z2_HEAD_CTR + 0.068 * HEX_R;       // dzwon SIEDZI na glowie, nie polyka jej',
    to:   '  const HELM_Y = Z2_HEAD_CTR + 0.042 * HEX_R;       // dzwon SIEDZI na glowie, nie polyka jej' },
  { id: 'M7', cel: 'H7', opis: 'tarcza Egipcjanina obrocona tylem do kamery gry (klasa bledu T2)',
    from: "  z2MountShield(group, sh, armL.wrist);\n\n  group.userData['mats'] = mats;\n  group.userData['perTokenGeos'] = [];\n  group.userData['anchors'] = {\n    hexR: HEX_R,\n    headTopY: Z2_HEAD_TOP, headCtrY: Z2_HEAD_CTR,\n    torsoTopY: Z2_TORSO_TOP, torsoBotY: Z2_TORSO_BOT,\n    torsoHalfW: Z2_TORSO_W * 0.5, torsoHalfD: Z2_TORSO_D * 0.5,\n    hipY: HIP_Y, shoulderY: Z2_SHLD_Y, shoulderX: Z2_SHLD_X,\n    grip: armR.wrist.toArray(),\n    weaponAxis: armR.axis.toArray(),\n    weaponKind: 'khopesh-sickle',",
    to:   "  z2MountShield(group, sh, armL.wrist);\n  sh.rotation.y = Math.PI - 0.20;\n\n  group.userData['mats'] = mats;\n  group.userData['perTokenGeos'] = [];\n  group.userData['anchors'] = {\n    hexR: HEX_R,\n    headTopY: Z2_HEAD_TOP, headCtrY: Z2_HEAD_CTR,\n    torsoTopY: Z2_TORSO_TOP, torsoBotY: Z2_TORSO_BOT,\n    torsoHalfW: Z2_TORSO_W * 0.5, torsoHalfD: Z2_TORSO_D * 0.5,\n    hipY: HIP_Y, shoulderY: Z2_SHLD_Y, shoulderX: Z2_SHLD_X,\n    grip: armR.wrist.toArray(),\n    weaponAxis: armR.axis.toArray(),\n    weaponKind: 'khopesh-sickle'," },
  { id: 'M8', cel: 'H8', opis: 'khopesz odsuniety od dloni (dlon mija bron — klasa bledu T1)',
    from: '  kh.position.copy(armR.wrist);',
    to:   '  kh.position.set(armR.wrist.x - 0.090 * HEX_R, armR.wrist.y, armR.wrist.z);' },
  { id: 'M9', cel: 'H9', opis: 'ramie Tyrskiego miecznika wyprostowane jak kij (klasa bledu T1)',
    from: "  const armR = z2BuildArm(group, -Z2_SHLD_X, 0.95, THF, mPurple, mSkin, mLeath, Z2_SHLD_Y, 'tm', 'right');",
    to:   "  const armR = z2BuildArm(group, -Z2_SHLD_X, THF, THF, mPurple, mSkin, mLeath, Z2_SHLD_Y, 'tm', 'right');" },
  { id: 'M10', cel: 'H10', opis: 'tarcza Gwardii zmniejszona do rozmiaru tarczy miecznika',
    from: "  const sh = z2RoundShield(mOwner, mGold, true, 'gt');",
    to:   "  const sh = z2RoundShield(mOwner, mGold, false, 'gt');" },
  { id: 'M11', cel: 'H11', opis: 'thureos Thorakitesa zamieniony na male kolo (przestaje byc thureosem)',
    from: '  const face = new THREE.Mesh(getGZ2ThurFace(), mOwner);',
    to:   '  const face = new THREE.Mesh(getGZ2ShFace(), mOwner);' },
];
function makeGeomPlugin(mut, stat) {
  return {
    name: 'geom-' + mut.id,
    setup(build) {
      build.onLoad({ filter: /jednostki-z2-srodziemne\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== Z2_TS) return null;
        let out = fs.readFileSync(args.path, 'utf8');
        const n = out.split(mut.from).length - 1;
        if (n === 1) { out = out.split(mut.from).join(mut.to); stat.applied++; }
        else { stat.bad.push(mut.id + ':' + n); }
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
    console.log('[zelazo-srodziemnomorze-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Pomiar w żywym Three.js: OBB + osie + kotwice dla każdej nazwanej części. */
async function measureAll(page) {
  return page.evaluate(({ units }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    function dump(g) {
      g.updateMatrixWorld(true);
      const parts = [];
      const names = [];
      let meshCount = 0;
      let minY = Infinity, maxY = -Infinity, maxR = 0;
      const v = new THREE.Vector3();
      g.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
        const geo = o.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        const bb = geo.boundingBox;
        const corners = [];
        for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) {
          v.set(cx, cy, cz).applyMatrix4(o.matrixWorld);
          corners.push([v.x, v.y, v.z]);
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
          pos: wp.toArray(), axX: ax(1, 0, 0), axY: ax(0, 1, 0), axZ: ax(0, 0, 1), corners,
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
      out[u.pf] = dump(B(u.cat, 0x3366ee, u.pl));
      out[u.pf + '_en'] = dump(B(u.cat, 0x3366ee, u.en));
    }
    out.generic.miecznik = dump(B('miecznik', 0x3366ee));
    out.generic.wlocznik = dump(B('wlocznik', 0x3366ee));
    out.falanga = dump(B('falanga', 0x3366ee, 'Falanga'));
    out.triari = dump(B('super', 0x3366ee, 'Triari'));
    out.khopeshBraz = dump(B('miecznik', 0x3366ee, 'Wojownik z khopesh'));
    return out;
  }, { units: UNITS });
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
const byName = (m) => { const o = {}; for (const p of m.parts) o[p.name] = p; return o; };
const bboxOf = (parts) => {
  let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const p of parts) for (const c of p.corners) for (let i = 0; i < 3; i++) {
    if (c[i] < mn[i]) mn[i] = c[i]; if (c[i] > mx[i]) mx[i] = c[i];
  }
  return { mn, mx };
};

// części CIAŁA (bez ręki uzbrojonej — styk dłoni z bronią to CHWYT, nie defekt;
// próg wzięty z zaakceptowanego modelu Falangity z T3, patrz nagłówek)
const BODY_RE = /-(torso|neck|head|eye-[a-z]+|skirt|hem|belt|sash|greave|mail-hem|scale-band-\d|leg-[a-z]+-(thigh|shin|foot)|arm-(left|right)-upper|arm-left-fore|helmet-[a-z-]+|khepresh-[a-z]+|crest-[a-z]+)$/;
const WEAPON_RE = /-(sword|khopesh|spear)-(blade|tip|guard|straight|seg-\d|shaft|butt)$/;
const SHIELD_RE = /-shield(-|$)/;
const KOLIZJA_PROG = 0.006;
// kierunek patrzenia kamery gry: camera.ts — azymut 0 (yaw stałe), elewacja 52°
const EL = 52 * Math.PI / 180;
const CAM_VIEW = [0, -Math.sin(EL), -Math.cos(EL)];
// baza płaszczyzny obrazu tej kamery (poziom, pion)
const IMG_X = [1, 0, 0];
const IMG_Y = [0, Math.cos(EL), -Math.sin(EL)];
const toImg = (p) => [dot(p, IMG_X), dot(p, IMG_Y)];

/**
 * WIDOCZNOŚĆ broni z kamery gry: długość jej łamanej NA EKRANIE podzielona
 * przez jej długość WŁASNĄ w 3D. 1,0 = broń leży w płaszczyźnie obrazu,
 * 0,0 = broń celuje dokładnie w kamerę i jest punktem. Skala odniesienia
 * bierze się z RENDERU zaakceptowanego modelu (Falangita, T3), nie z sufitu.
 */
function weaponVisibility(m, names) {
  const n = byName(m);
  const pts3 = names.map((x) => n[x]).filter(Boolean).map((p) => p.pos);
  if (pts3.length < 2) return { vis: NaN, sag: NaN, spanX: NaN, chord: NaN };
  let l3 = 0, l2 = 0;
  const pts2 = pts3.map(toImg);
  for (let i = 1; i < pts3.length; i++) {
    l3 += vlen(sub(pts3[i], pts3[i - 1]));
    l2 += Math.hypot(pts2[i][0] - pts2[i - 1][0], pts2[i][1] - pts2[i - 1][1]);
  }
  const A = pts2[0], B = pts2[pts2.length - 1];
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
  let sag = 0;
  for (let i = 1; i < pts2.length - 1; i++) {
    const s = L > 1e-9 ? Math.abs((pts2[i][0] - A[0]) * dy - (pts2[i][1] - A[1]) * dx) / L : 0;
    if (s > sag) sag = s;
  }
  let mnx = 1e9, mxx = -1e9;
  for (const p of pts2) { if (p[0] < mnx) mnx = p[0]; if (p[0] > mxx) mxx = p[0]; }
  return { vis: l3 > 1e-9 ? l2 / l3 : NaN, sag, spanX: mxx - mnx, chord: L };
}
const WEAPON_CHAIN = {
  gt: ['gt-sword-guard', 'gt-sword-blade', 'gt-sword-tip'],
  tm: ['tm-sword-guard', 'tm-sword-blade', 'tm-sword-tip'],
  kh: ['kh-khopesh-guard', 'kh-khopesh-straight', 'kh-khopesh-seg-0', 'kh-khopesh-seg-1', 'kh-khopesh-seg-2'],
  th: ['th-arm-right-fist', 'th-spear-shaft', 'th-spear-tip'],
};
const FALANGA_CHAIN = ['falangita-arm-right-fist', 'falangita-dory-shaft', 'falangita-dory-tip'];

/** Asercje ROZSTRZYGAJĄCE dispatch — mają padać na bundlu (D) dla nazw EN. */
function assertDispatch(m, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };
  UNITS.forEach((u, i) => {
    const a = m[u.pf], g = m.generic[u.cat];
    t('A' + (i + 1), '(A' + (i + 1) + ') „' + u.pl + '" (PL) buduje własny model, nie generyk `' + u.cat + '`',
      a.meshCount > g.meshCount && a.names.length === a.meshCount && a.names.every((n) => n.startsWith(u.pf + '-')),
      { unit: a.meshCount, generic: g.meshCount });
  });
  EN_TRAFIA.forEach((pf, i) => {
    const u = UNITS.find((x) => x.pf === pf);
    const a = m[pf], b = m[pf + '_en'], g = m.generic[u.cat];
    t('A' + (i + 5), '(A' + (i + 5) + ') „' + u.en + '" (EN) trafia w TEN SAM model co nazwa PL',
      b.meshCount === a.meshCount && b.meshCount > g.meshCount
      && b.names.filter((n) => n.startsWith(pf + '-')).length === a.names.filter((n) => n.startsWith(pf + '-')).length,
      { en: b.meshCount, pl: a.meshCount, generic: g.meshCount });
  });
  return res;
}

/** Asercje GEOMETRYCZNE (H1-H11) — każda ma swoją pojedynczą mutację (M1-M11). */
function assertGeometry(m, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };

  // H1 — BROŃ nie tkwi w CIELE (bez ręki uzbrojonej: to chwyt). Klasa T1/T3/T5.
  const h1 = [];
  for (const u of UNITS) {
    const mm = m[u.pf];
    const body = mm.parts.filter((p) => BODY_RE.test(p.name));
    const weap = mm.parts.filter((p) => WEAPON_RE.test(p.name));
    for (const w of weap) for (const b of body) {
      const d = satDepth(obb(w), obb(b));
      if (d > KOLIZJA_PROG) h1.push({ u: u.pf, w: w.name, b: b.name, d: +d.toFixed(4) });
    }
  }
  t('H1', '(H1) ŻADNA broń nie przenika ciała własnej figurki (4 jednostki, pełny SAT)',
    h1.length === 0, h1);

  // H2 — PRZEDRAMIĘ/RAMIĘ tarczowe nie sterczy przez własną tarczę. Klasa T5-A2.
  const h2 = [];
  for (const u of UNITS) {
    const mm = m[u.pf];
    const arms = mm.parts.filter((p) => /-arm-left-(fore|upper)$/.test(p.name));
    const shld = mm.parts.filter((p) => SHIELD_RE.test(p.name));
    for (const a of arms) for (const s of shld) {
      const d = satDepth(obb(a), obb(s));
      if (d > KOLIZJA_PROG) h2.push({ u: u.pf, a: a.name, s: s.name, d: +d.toFixed(4) });
    }
  }
  t('H2', '(H2) ŻADNE ramię tarczowe nie przenika własnej tarczy (4 jednostki, pełny SAT)',
    h2.length === 0, h2);

  // H3 — BROŃ JEST WIDOCZNA Z KAMERY GRY. Nowa klasa błędu tej serii (A1/A2).
  // Próg NIE jest liczbą z sufitu: to 0,60 widoczności dory Falangity (T3),
  // policzonej w tym samym renderze, w tej samej bazie obrazu.
  const visF = weaponVisibility(m.falanga, FALANGA_CHAIN).vis;
  const vis = {};
  for (const u of UNITS) vis[u.pf] = +weaponVisibility(m[u.pf], WEAPON_CHAIN[u.pf]).vis.toFixed(3);
  t('H3', '(H3) broń KAŻDEJ z 4 jest widoczna z kamery gry (≥0,60 widoczności dory Falangity z T3)',
    Number.isFinite(visF) && UNITS.every((u) => Number.isFinite(vis[u.pf]) && vis[u.pf] >= 0.60 * visF),
    { falangita: +visF.toFixed(3), prog: +(0.60 * visF).toFixed(3), ...vis });

  // H4 — KRZYWIZNA khopesza jest widoczna Z KAMERY GRY, a nie tylko w danych.
  const khV = weaponVisibility(m.kh, WEAPON_CHAIN.kh);
  t('H4', '(H4) sierp khopesza wygina się NA EKRANIE kamery gry (rozrzut poziomy >0,05 i strzałka >0,10 cięciwy)',
    Number.isFinite(khV.sag) && khV.spanX > 0.05 && khV.chord > 1e-6 && khV.sag / khV.chord > 0.10,
    { spanX: +khV.spanX.toFixed(4), sagitta: +khV.sag.toFixed(4), chord: +khV.chord.toFixed(4) });

  // H5 — khopesz jest ZAKRZYWIONY W 3D (pytanie dispatchu wprost).
  const khN = byName(m.kh);
  const khStr = khN['kh-khopesh-straight'], khEnd = khN['kh-khopesh-seg-2'];
  const khAng = (khStr && khEnd)
    ? Math.acos(Math.max(-1, Math.min(1, dot(unit(khStr.axY), unit(khEnd.axY))))) : NaN;
  t('H5', '(H5) khopesz jest faktycznym SIERPEM: ostatni segment odchylony od części prostej o >1,0 rad',
    Number.isFinite(khAng) && khAng > 1.0, { kat_rad: +(khAng || 0).toFixed(3) });

  // H6 — Thorakites ma ODKRYTĄ TWARZ: oczy istnieją i NIE tkwią w hełmie.
  const thN = byName(m.th);
  const eyes = ['th-eye-left', 'th-eye-right'].map((x) => thN[x]).filter(Boolean);
  const helmParts = m.th.parts.filter((p) => /-helmet-/.test(p.name));
  let eyeIn = 0;
  for (const e of eyes) for (const h of helmParts) if (satDepth(obb(e), obb(h)) > KOLIZJA_PROG) eyeIn++;
  t('H6', '(H6) Thorakites ma DWOJE oczu i żadne nie tkwi w hełmie attyckim (twarz faktycznie odkryta)',
    eyes.length === 2 && eyeIn === 0, { oczu: eyes.length, w_helmie: eyeIn });

  // H7 — KAŻDE pole tarczy w kolorze gracza jest zwrócone DO KAMERY GRY.
  // Dokładnie błąd znaleziony w T2 (tarcza fizycznie niewidoczna). Oś normalnej
  // zależy od BRYŁY, nie od wyniku: pole tarczy okrągłej to WALEC obrócony
  // o π/2, więc jego normalną jest oś symetrii (lokalne +Y); pole tarczy
  // prostokątnej i thureosa to płyta/skorupa, więc lokalne +Z. Rodzaj tarczy
  // bierze się z `userData.anchors.shieldKind` — czyli Z MODELU, nie z tabelki
  // w teście.
  const dots = {};
  for (const u of UNITS) {
    const mm = m[u.pf];
    const p = byName(mm)[u.pf + '-shield-face'];
    const kind = mm.anchors && mm.anchors.shieldKind;
    if (!p || !kind) { dots[u.pf] = NaN; continue; }
    const axis = /^round-/.test(kind) ? p.axY : p.axZ;
    dots[u.pf] = +dot(axis, CAM_VIEW).toFixed(3);
  }
  t('H7', '(H7) pole tarczy w kolorze gracza zwrócone DO kamery gry we WSZYSTKICH 4 (klasa błędu T2)',
    UNITS.every((u) => Number.isFinite(dots[u.pf]) && dots[u.pf] < -0.30), dots);

  // H8 — dłoń uzbrojona leży NA OSI broni (klasa błędu T1: dłoń mija broń).
  const WEAP_MAIN = { gt: 'gt-sword-blade', tm: 'tm-sword-blade', kh: 'kh-khopesh-straight', th: 'th-spear-shaft' };
  const offs = {};
  for (const u of UNITS) {
    const n = byName(m[u.pf]);
    const fist = n[u.pf + '-arm-right-fist'], w = n[WEAP_MAIN[u.pf]];
    offs[u.pf] = (fist && w) ? +distPointLine(fist.pos, w.pos, unit(w.axY)).toFixed(4) : NaN;
  }
  t('H8', '(H8) dłoń uzbrojona leży NA OSI broni (<0,030×HEX_R) we wszystkich 4 — trzyma, nie mija',
    UNITS.every((u) => Number.isFinite(offs[u.pf]) && offs[u.pf] < 0.030), offs);

  // H9 — łokieć ręki uzbrojonej ZGIĘTY (klasa błędu T1: ręka prosta jak kij).
  const bends = {};
  for (const u of UNITS) {
    const n = byName(m[u.pf]);
    const up = n[u.pf + '-arm-right-upper'], fo = n[u.pf + '-arm-right-fore'];
    bends[u.pf] = (up && fo) ? +Math.acos(Math.max(-1, Math.min(1, dot(up.axY, fo.axY)))).toFixed(3) : NaN;
  }
  t('H9', '(H9) łokieć ręki uzbrojonej ZGIĘTY (>0,30 rad) we wszystkich 4',
    UNITS.every((u) => Number.isFinite(bends[u.pf]) && bends[u.pf] > 0.30), bends);

  // H10 — ELITA ma WIĘKSZĄ tarczę niż jednostka liniowa tego samego miasta
  // (units.json: Obrona 7 vs 6 — jedyna różnica statystyk tej pary).
  const faceArea = (mm, nm) => {
    const p = byName(mm)[nm];
    if (!p) return NaN;
    const bb = bboxOf([p]);
    return (bb.mx[0] - bb.mn[0]) * (bb.mx[1] - bb.mn[1]);
  };
  const aGt = faceArea(m.gt, 'gt-shield-face'), aTm = faceArea(m.tm, 'tm-shield-face');
  t('H10', '(H10) tarcza Gwardii Tyreńskiej jest WIĘKSZA od tarczy Tyrskiego miecznika (Obrona 7 vs 6)',
    Number.isFinite(aGt) && Number.isFinite(aTm) && aGt > aTm * 1.05,
    { gwardia: +aGt.toFixed(4), miecznik: +aTm.toFixed(4) });

  // H11 — Thorakites ma NAJWYŻSZE pole tarczy z czwórki (thureos to tarcza
  // korpusowa; units.json daje mu Obronę 9 — najwyższą z czwórki).
  const faceH = {};
  for (const u of UNITS) {
    const p = byName(m[u.pf])[u.pf + '-shield-face'];
    faceH[u.pf] = p ? +(bboxOf([p]).mx[1] - bboxOf([p]).mn[1]).toFixed(4) : NaN;
  }
  t('H11', '(H11) thureos Thorakitesa jest NAJWYŻSZĄ tarczą czwórki (Obrona 9 — najwyższa)',
    Number.isFinite(faceH.th) && ['gt', 'tm', 'kh'].every((pf) => faceH.th > faceH[pf]), faceH);

  if (!soft) {
    console.log('  [relacje] widocznosc broni=' + JSON.stringify(vis) + ' (Falangita T3=' + visF.toFixed(3) + ')'
      + ' | khopesz spanX=' + khV.spanX.toFixed(4) + ' sagitta=' + khV.sag.toFixed(4) + ' kat3D=' + khAng.toFixed(3)
      + ' | normale do kamery=' + JSON.stringify(dots)
      + ' | lokcie=' + JSON.stringify(bends) + ' | dlon na osi=' + JSON.stringify(offs)
      + ' | wysokosci pol tarcz=' + JSON.stringify(faceH));
  }
  return res;
}

/** Reszta: proporcje, nazwy, brak regresji sąsiadów, dane, sekcje historyczne. */
function assertRest(m, z2Src, unitsSrc, unitRows) {
  // --- (E) proporcje ---------------------------------------------------------
  for (const u of UNITS) {
    const mm = m[u.pf];
    check('(E:' + u.pf + ') stopy na y≈0, promień w limicie heksu (≤0.866), wysokość 0.55–0.90×HEX_R',
      mm.minY < 0.02 && mm.maxR <= 0.866 && mm.height > 0.55 && mm.height < 0.90,
      { minY: +mm.minY.toFixed(4), maxR: +mm.maxR.toFixed(4), h: +mm.height.toFixed(4) });
  }
  // --- (N) każdy mesh nazwany + kotwice (warunek możliwości audytu) ----------
  for (const u of UNITS) {
    const mm = m[u.pf];
    check('(N:' + u.pf + ') KAŻDY mesh ma nazwę z prefiksem `' + u.pf + '-` i grupa ma `userData.anchors`',
      mm.names.length === mm.meshCount && mm.names.every((n) => n.startsWith(u.pf + '-')) && mm.anchors !== null,
      { mesh: mm.meshCount, nazwane: mm.names.length, anchors: mm.anchors !== null });
    check('(N:' + u.pf + ':unikat) nazwy części są UNIKALNE (żadna nie nadpisuje adresu innej)',
      new Set(mm.names).size === mm.names.length,
      mm.names.filter((n, i) => mm.names.indexOf(n) !== i));
  }
  // --- (C) odróżnialność strukturalna: różne rodzaje tarcz, różne zestawy ----
  const kinds = UNITS.map((u) => m[u.pf].anchors && m[u.pf].anchors.shieldKind);
  check('(C1) cztery RÓŻNE rodzaje tarczy (żadna para nie dzieli typu)',
    new Set(kinds).size === 4, kinds);
  const sig = UNITS.map((u) => m[u.pf].names.slice().sort().join('|'));
  check('(C2) cztery RÓŻNE zestawy części (żadna para modeli nie jest aliasem)',
    new Set(sig).size === 4, UNITS.map((u, i) => u.pf + ':' + m[u.pf].meshCount + '/' + sig[i].length));

  // --- (R) brak regresji sąsiadów Z TEGO SAMEGO PLIKU i z T3 -----------------
  // buildTriari korzysta z TYCH SAMYCH funkcji pomocniczych, którym T6 dodał
  // parametry nazw — dowód, że domyślne wartości puste faktycznie go omijają.
  check('(R1) Triari (ten sam plik, poza zakresem T6) nadal się buduje i NIE dostał ani jednej nazwy mesh',
    m.triari.meshCount > 30 && m.triari.names.length === 0,
    { mesh: m.triari.meshCount, nazwane: m.triari.names.length });
  check('(R2) Falanga (T3, inny plik) nadal się buduje i NIE dostała mesh tej czwórki',
    m.falanga.meshCount > 20 && !m.falanga.names.some((n) => /^(gt|tm|kh|th)-/.test(n)),
    { mesh: m.falanga.meshCount });
  check('(R3) generyczne `miecznik`/`wlocznik` nietknięte (brak nazw tej czwórki)',
    !m.generic.miecznik.names.some((n) => /^(gt|tm|kh|th)-/.test(n))
    && !m.generic.wlocznik.names.some((n) => /^(gt|tm|kh|th)-/.test(n)));

  // --- (0) kotwice statyczne w źródle ---------------------------------------
  check('(0a) units.ts: linie dispatchu Fenicjan mają rdzeń PL i rdzeń EN',
    unitsSrc.includes("n.includes('tyrski miecznik') || n.includes('tyrian swordsman')")
    && unitsSrc.includes("n.includes('gwardia tyrensk') || n.includes('tyre guard')"));
  const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[Łł]/g, 'l').toLowerCase();
  for (const core of ['tyrski miecznik', 'tyrian swordsman', 'gwardia tyrensk', 'tyre guard',
    'zelaznym khopesh', 'iron khopesh', 'thorakites']) {
    const hits = unitRows.filter((r) => norm(r['Jednostka']).includes(core) || norm(r['Nazwa EN'] || '').includes(core));
    check('(0b:' + core + ') rdzeń dispatchu JEDNOZNACZNY w całym units.json (dokładnie 1 trafienie)',
      hits.length === 1, hits.map((r) => r['Jednostka']));
  }
  // Kontrapunkt: rdzeń `khopesh warrior` NIE jest jednoznaczny — to jest
  // PRZYCZYNA (A8) niżej, zapisana jako fakt, a nie jako domysł.
  {
    const hits = unitRows.filter((r) => norm(r['Jednostka']).includes('khopesh warrior') || norm(r['Nazwa EN'] || '').includes('khopesh warrior'));
    check('(0c) rdzeń `khopesh warrior` pasuje do DWÓCH wierszy units.json — udokumentowana przyczyna (A8)',
      hits.length === 2, hits.map((r) => r['Nazwa EN']));
  }
  for (const u of UNITS) {
    const row = unitRows.find((r) => r['Jednostka'] === u.pl);
    check('(0d:' + u.pf + ') units.json: Epoka=Żelazo, Tech=Hutnictwo żelaza, Atak dystansowy=0, Nazwa EN zgodna',
      row !== undefined && row['Epoka'] === 'Żelazo' && row['Tech'] === 'Hutnictwo żelaza'
      && row['Atak dystansowy'] === 0 && row['Nazwa EN'] === u.en,
      row && { e: row['Epoka'], t: row['Tech'], ad: row['Atak dystansowy'], en: row['Nazwa EN'] });
  }
  {
    const gt = unitRows.find((r) => r['Jednostka'] === 'Gwardia Tyreńska');
    const tm = unitRows.find((r) => r['Jednostka'] === 'Tyrski miecznik');
    check('(0e) units.json: Gwardia ma WYŻSZĄ Obronę i TEN SAM Pancerz co miecznik (podstawa H10 i K6)',
      gt && tm && gt['Obrona'] > tm['Obrona'] && gt['Pancerz'] === tm['Pancerz'],
      gt && tm && { gwardia: [gt['Obrona'], gt['Pancerz']], miecznik: [tm['Obrona'], tm['Pancerz']] });
    const th = unitRows.find((r) => r['Jednostka'] === 'Thorakites');
    check('(0f) units.json: Thorakites ma NAJWYŻSZĄ Obronę z czwórki (podstawa H11)',
      th !== undefined && UNITS.filter((u) => u.pf !== 'th').every((u) => {
        const r = unitRows.find((x) => x['Jednostka'] === u.pl);
        return r && th['Obrona'] > r['Obrona'];
      }), th && { obrona: th['Obrona'] });
  }

  // --- (K) sekcje historyczne — obecność i konkret, nie sam nagłówek --------
  check('(K0) plik ma sekcję ZGODNOSC HISTORYCZNA dla KAŻDEJ z czterech jednostek',
    (z2Src.match(/ZGODNOSC HISTORYCZNA/g) || []).length === 4);
  const K = [
    ['K:fenicja-brak-zrodel', /NAJMNIEJ\s*\n?\s*\/\/\s*WLASNYCH PRZEDSTAWIEN WOJSKA|WLASNYCH PRZEDSTAWIEN WOJSKA/],
    ['K:fenicja-balawat', /Balawat/],
    ['K:fenicja-ezechiel', /Ezechiel 27,10-11/],
    ['K:fenicja-herodot', /Herodot VII\.89/],
    ['K:fenicja-purpura', /Pliniusz.*IX\.60-65|IX\.60-65/],
    ['K:gwardia-argos', /panoplia z Argos|Courbin/],
    ['K:gwardia-asztarte', /Asztarte/],
    ['K:egipt-khopesz-braz', /1300 p\.n\.e\./],
    ['K:egipt-zelazo-saickie', /XXVI dynastii saickiej|664-525 p\.n\.e\./],
    ['K:egipt-khepresz-krolewski', /zastrzezonym dla FARAONA/],
    ['K:egipt-luski', /Malkata/],
    ['K:grecja-polibiusz', /Polibiusz/],
    ['K:grecja-galaci', /280-275 p\.n\.e\./],
    ['K:grecja-thorax', /thorax = PANCERZ/],
    ['K:grecja-attycki', /helm attycki|helmu attyckiego/i],
  ];
  for (const [id, re] of K) {
    check('(' + id + ') sekcja historyczna niesie konkret, nie sam nagłówek', re.test(z2Src));
  }
  check('(K:anachronizmy-nazwane) TRZY twarde anachronizmy NAZWANE wprost (żelazny khopesz, khepresz, thorakitai)',
    /TWARDY ANACHRONIZM, ZOSTAWIONY SWIADOMIE/.test(z2Src)
    && /DRUGI ANACHRONIZM, TAKZE NAZWANY/.test(z2Src)
    && /TWARDY ANACHRONIZM, NAZWANY WPROST/.test(z2Src));
  check('(K:sprostowanie-dispatchu) fałszywe założenie dispatchu (Falanga „w tym samym pliku") sprostowane w źródle',
    /SPROSTOWANIE ZALOZENIA DISPATCHU/.test(z2Src) && /hastati-falangita\.ts/.test(z2Src));
}

/**
 * ODRÓŻNIALNOŚĆ z KAMERY GRY — mierzona PIKSELAMI, ale NIE na binarnej
 * sylwetce (metoda przejęta z T5): udział pikseli różniących się pokryciem
 * albo barwą o ≥40/255 w sumie obrysów pary. Skala odniesienia bierze się
 * z RENDERU: ten sam model porównany sam ze sobą daje 0,000, a para z góry
 * odróżnialna (Falangita z T3 vs każda z czwórki) wyznacza górny koniec pasma.
 */
async function pixelDistinctness(page) {
  return page.evaluate(({ units }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 192;
    const shot = (cat, name, owner) => {
      document.body.innerHTML = '';
      const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      renderer.setSize(S, S);
      renderer.setClearColor(0x000000, 1);
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const cam = new THREE.OrthographicCamera(-0.55, 0.55, 0.85, -0.25, 0.01, 10);
      const el = 52 * Math.PI / 180;
      cam.position.set(0, 0.30 + 3 * Math.sin(el), 3 * Math.cos(el));
      cam.lookAt(0, 0.30, 0);
      scene.add(new THREE.AmbientLight(0xffffff, 0.95));
      const d = new THREE.DirectionalLight(0xffffff, 0.8); d.position.set(2, 4, 3); scene.add(d);
      scene.add(B(cat, owner, name));
      renderer.render(scene, cam);
      const gl = renderer.getContext();
      const px = new Uint8Array(S * S * 4);
      gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
      renderer.dispose();
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
    const shots = units.map((u) => shot(u.cat, u.pl, 0x3366ee));
    const pairs = [];
    for (let a = 0; a < shots.length; a++) for (let b = a + 1; b < shots.length; b++) {
      pairs.push({ a: units[a].pf, b: units[b].pf, d: diff(shots[a], shots[b]) });
    }
    const same = diff(shots[0], shot(units[0].cat, units[0].pl, 0x3366ee));
    const falanga = shot('falanga', 'Falanga', 0x3366ee);
    const vsFalanga = units.map((u, i) => ({ pf: u.pf, d: diff(shots[i], falanga) }));
    return { pairs, same, vsFalanga };
  }, { units: UNITS });
}

async function main() {
  const unitsSrc = fs.readFileSync(UNITS_TS, 'utf8');
  const z2Src = fs.readFileSync(Z2_TS, 'utf8');
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
  const BUNDLE_D = path.join(OUTDIR, 'mut-D.js');
  await buildBundle(BUNDLE_PO, []);
  const statD = { applied: 0 };
  await buildBundle(BUNDLE_D, [makeDispatchPlugin(statD)]);
  check('(D0) mutacja (D) usunęła DOKŁADNIE 2 aliasy angielskie (test nie jest pusty)',
    statD.applied === 2, statD.applied);

  const geomBundles = [];
  for (const mut of GEOM_MUTATIONS) {
    const stat = { applied: 0, bad: [] };
    const out = path.join(OUTDIR, 'mut-' + mut.id + '.js');
    await buildBundle(out, [makeGeomPlugin(mut, stat)]);
    geomBundles.push({ mut, out, stat });
  }
  const badMut = geomBundles.filter((g) => g.stat.applied !== 1);
  check('(M0) każda z ' + GEOM_MUTATIONS.length + ' mutacji trafiła w DOKŁADNIE JEDNO miejsce w źródle',
    badMut.length === 0, badMut.map((g) => g.mut.id + ' applied=' + g.stat.applied + ' ' + g.stat.bad.join(',')));
  if (statD.applied !== 2 || badMut.length > 0) {
    console.log('\nPRZERWANE: nie da się odtworzyć stanu sprzed poprawki — kod się przesunął, popraw EN_ALIASES/GEOM_MUTATIONS.');
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1500, height: 500 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function renderWith(bundleFile) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
    await page.addScriptTag({ path: bundleFile });
    return measureAll(page);
  }

  const SHOT = async (file, names) => {
    await page.evaluate(({ nm }) => {
      const THREE = window.__THREE;
      const B = window.__buildUnitModel;
      document.body.innerHTML = '';
      const W = 1500, H = 500;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setClearColor(0x6f8f5f, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.05); d1.position.set(2, 4, 3); scene.add(d1);
      const el = 52 * Math.PI / 180;                 // KAMERA GRY (camera.ts)
      const cols = [0x3366ee, 0xcc4422, 0x22aa55, 0xbb33bb, 0xddaa22];
      nm.forEach((p, i) => {
        const g = B(p[1], cols[i], p[0]);
        g.position.x = (i - (nm.length - 1) / 2) * 0.80;
        scene.add(g);
      });
      const cam = new THREE.OrthographicCamera(-2.1, 2.1, 0.86, -0.54, 0.01, 20);
      cam.position.set(0, 0.30 + 6 * Math.sin(el), 6 * Math.cos(el));
      cam.lookAt(0, 0.30, 0);
      renderer.render(scene, cam);
      window.__ready = true;
    }, { nm: names });
    await page.waitForFunction('window.__ready === true');
    await page.screenshot({ path: file });
    await page.evaluate(() => { window.__ready = false; });
  };
  const SHOT_SET = UNITS.map((u) => [u.pl, u.cat]).concat([['Falanga', 'falanga']]);

  let matrix = [];
  try {
    console.log('\n--- (0)-(K) pomiar PO audycie (bundel z niezmienionych źródeł) ---');
    const after = await renderWith(BUNDLE_PO);
    assertDispatch(after, false);
    assertGeometry(after, false);
    assertRest(after, z2Src, unitsSrc, unitRows);

    // (A8) — stan JAWNIE UDOKUMENTOWANY, nie naprawiony (poza allowlistą T6).
    check('(A8) „Iron Khopesh Warrior" (EN) buduje dziś model BRĄZOWEGO wojownika — stan udokumentowany, nie naprawiony',
      after.kh_en.meshCount === after.khopeshBraz.meshCount
      && after.kh_en.meshCount !== after.kh.meshCount,
      { en: after.kh_en.meshCount, brazowy: after.khopeshBraz.meshCount, zelazny: after.kh.meshCount });

    const dist = await pixelDistinctness(page);
    console.log('  [odroznialnosc] kontrola „ten sam model" = ' + dist.same.toFixed(3)
      + ' | vs Falangita (para z gory odroznialna) = '
      + dist.vsFalanga.map((r) => r.pf + '=' + r.d.toFixed(3)).join(' ')
      + ' | pary czworki = ' + dist.pairs.map((r) => r.a + '/' + r.b + '=' + r.d.toFixed(3)).join(' '));
    check('(C3a) kontrola miary: ten sam model porównany sam ze sobą daje ~0 (miara nie jest szumem)',
      dist.same < 0.01, dist.same);
    check('(C3b) każda z 6 par czwórki różni się z KAMERY GRY na ≥45% pikseli obrysu',
      dist.pairs.every((r) => r.d >= 0.45), dist.pairs.map((r) => r.a + '/' + r.b + '=' + r.d.toFixed(3)));
    check('(C3c) różnice wewnątrz czwórki są w tym samym paśmie co para z góry odróżnialna (vs Falangita)',
      Math.min(...dist.pairs.map((r) => r.d)) >= 0.60 * Math.min(...dist.vsFalanga.map((r) => r.d)),
      { minPara: +Math.min(...dist.pairs.map((r) => r.d)).toFixed(3),
        minVsFalanga: +Math.min(...dist.vsFalanga.map((r) => r.d)).toFixed(3) });

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await SHOT(path.join(SHOTS, 'po-srodziemnomorze-kamera-gry.png'), SHOT_SET);
    }

    console.log('\n--- (D) mutacja DISPATCHU: nazwy EN sprzed audytu ---');
    const beforeD = await renderWith(BUNDLE_D);
    const softD = assertDispatch(beforeD, true);
    const plGreen = softD.filter((r) => /^A[1-4]$/.test(r.id));
    const enGreen = softD.filter((r) => /^A[5-7]$/.test(r.id) && r.cond).map((r) => r.id);
    check('(D1) bez aliasów EN asercje angielskie Fenicjan (A5-A6) padają',
      !softD.find((r) => r.id === 'A5').cond && !softD.find((r) => r.id === 'A6').cond,
      { nadal_zielone: enGreen });
    check('(D2) „Thorakites" (A7) zostaje ZIELONY — jego nazwa PL i EN są identyczne, mutacja go nie dotyczy',
      softD.find((r) => r.id === 'A7').cond === true);
    check('(D3) bez aliasów EN asercje polskie (A1-A4) zostają ZIELONE (mutacja jest chirurgiczna)',
      plGreen.every((r) => r.cond), plGreen.filter((r) => !r.cond).map((r) => r.id));
    check('(D4) PRZED audytem „Tyre Guard"/„Tyrian Swordsman" dawały DOKŁADNIE generyk `miecznik`',
      ['gt', 'tm'].every((pf) => beforeD[pf + '_en'].meshCount === beforeD.generic.miecznik.meshCount),
      ['gt', 'tm'].map((pf) => pf + ':' + beforeD[pf + '_en'].meshCount + '/' + beforeD.generic.miecznik.meshCount));

    console.log('\n--- (M) MACIERZ ABLACYJNA: jedna mutacja = jedno miejsce = jedna asercja ---');
    const base = assertGeometry(after, true);
    matrix.push({ label: 'BAZA'.padEnd(6) + ' (bez mutacji)'.padEnd(62), res: base });
    for (const g of geomBundles) {
      const mm = await renderWith(g.out);
      const soft = assertGeometry(mm, true);
      matrix.push({ label: g.mut.id.padEnd(6) + ' ' + g.mut.opis.slice(0, 60).padEnd(62), res: soft, mut: g.mut });
      if (SHOTS !== null && (g.mut.id === 'M3' || g.mut.id === 'M4' || g.mut.id === 'M6')) {
        await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
        await page.addScriptTag({ path: g.out });
        await SHOT(path.join(SHOTS, 'przed-' + g.mut.id + '.png'), SHOT_SET);
      }
    }
    const ids = base.map((r) => r.id);
    console.log('        ' + ids.map((i) => i.padEnd(6)).join(''));
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
    let dist = DIST_ARG;
    if (dist === null) {
      const outDir = path.join(os.tmpdir(), 'civ-zelazo-t6-render-dist');
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(G1) artefakt vite build niesie wszystkie 4 rdzenie PL',
      /tyrski miecznik/i.test(built) && /gwardia tyrensk/i.test(built)
      && /zelaznym khopesh/i.test(built) && /thorakites/i.test(built));
    check('(G2) artefakt vite build niesie oba dodane rdzenie EN (naprawa T6 jest w produkcji)',
      /tyre guard/i.test(built) && /tyrian swordsman/i.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch (_) {}

  console.log('\nzelazo-srodziemnomorze-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
