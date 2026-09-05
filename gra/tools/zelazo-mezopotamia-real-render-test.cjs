'use strict';
/**
 * zelazo-mezopotamia-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T5 (audyt czterech jednostek mezopotamskich
 * epoki Żelaza: Gwardia hetycka, Piechota neobabilońska, Mur tarcz (Sargonid),
 * Garnizon Harappy — `gra/src/render/jednostki-z1-mezopotamia.ts`).
 *
 * ZGŁOSZENIE: te cztery jednostki MIAŁY dedykowany kod, ale nigdy nie przeszły
 * rygorystycznego pomiaru. „Mieć dedykowany model" ≠ „przeszedł proces Opus 5".
 * Audyt zmierzył żywą geometrię i znalazł trzy realne błędy — wszystkie w
 * „Murze tarcz", żaden widoczny w czytaniu kodu:
 *   (1) włócznia przechodziła na wylot przez własne ramię włócznika
 *       (SAT 0.0365×HEX_R w ramieniu) — ta sama klasa błędu co dory Falangi
 *       w T3 i lanca jeźdźca w T1;
 *   (2) lewe przedramię sterczało PRZEZ pole tarczy w kolorze gracza
 *       (SAT 0.0303×HEX_R), bo tarcza jako jedyna z czwórki miała pozycję
 *       wpisaną na sztywno zamiast zakotwiczonej w `armL.wrist`;
 *   (3) cztery linie dispatchu w `units.ts` miały WYŁĄCZNIE rdzeń polski —
 *       nazwy angielskie z `units.json` dawały 28-mesh generyk `miecznik`.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA (R-PROC-AUTOBOT.md §9 poz. 6a): to są modele
 * 3D (Three.js). Jedynym sposobem sprawdzenia, że broń NIE tkwi w ciele i że
 * tarcza jest zwrócona do kamery gry, jest zbudowanie grupy w żywym silniku
 * i ZMIERZENIE jej — nie odczyt źródła. Wszystkie trzy błędy wyżej „wyglądały"
 * poprawnie w kodzie.
 *
 * JAK MIERZY SEKCJA (H): pełny test SAT (separating axis theorem) na
 * zorientowanych pudełkach (OBB) każdej pary nazwanych mesh, w układzie
 * świata, z żywych macierzy Three.js. Punkty odniesienia bierze
 * `group.userData['anchors']` i same mesh — NIC nie jest wpisane liczbowo
 * jako „oczekiwana pozycja". Progi styku broni z dłonią wzięte z RODZINY,
 * nie z sufitu: zaakceptowany model Falangi (T3) ma przedramię/drzewce
 * 0.0218 i pięść/drzewce 0.0335 przy ramieniu 0.0000 — dlatego pięść i
 * przedramię ręki uzbrojonej są z kontroli (H1) wyłączone, a RAMIĘ nie.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI — MACIERZ ABLACYJNA, MUTACJA POJEDYNCZA NA
 * ASERCJĘ (standard serii ustalony przez Evaluatora T4, który zbudował taką
 * macierz zamiast zbiorczej mutacji Operatora):
 *   (D) dispatch: bundle z usuniętymi DOKŁADNIE czterema aliasami angielskimi
 *       w `units.ts` — asercje (A5-A8) muszą zapalić się na czerwono, a (A1-A4)
 *       zostać zielone.
 *   (M1..M11) geometria: JEDENAŚCIE osobnych bundli, każdy z DOKŁADNIE JEDNĄ
 *       podmienioną stałą/linią w `jednostki-z1-mezopotamia.ts`. Każda z
 *       asercji H1-H11 musi zaczerwienić się pod swoją mutacją. Bez tego (H)
 *       byłoby tautologią: „mierzę to, co sam przed chwilą zbudowałem".
 *
 * Usage (z gra/): node tools/zelazo-mezopotamia-real-render-test.cjs
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
  console.error('[zelazo-mezopotamia-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-mezopotamia-entry.ts');
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
const OUTDIR = path.resolve(os.tmpdir(), `civ-zelazo-t5-bundles-${TMPDIR_RUN_ID}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const MEZO_TS = path.resolve(GRA, 'src', 'render', 'jednostki-z1-mezopotamia.ts');
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
  { pl: 'Gwardia hetycka',        en: 'Hittite Guard',            pf: 'het', cat: 'miecznik' },
  { pl: 'Piechota neobabilońska', en: 'Neo-Babylonian Infantry',  pf: 'nb',  cat: 'miecznik' },
  { pl: 'Mur tarcz (Sargonid)',   en: 'Shield Wall (Sargonid)',   pf: 'mt',  cat: 'wlocznik' },
  { pl: 'Garnizon Harappy',       en: 'Harappan Garrison',        pf: 'gr',  cat: 'miecznik' },
];

// ── (D) mutacja DISPATCHU: cofnięcie czterech aliasów angielskich ──────────
const EN_ALIASES = [
  [" || n.includes('hittite guard')", ''],
  [" || n.includes('neo-babylonian infantry')", ''],
  [" || n.includes('shield wall')", ''],
  [" || n.includes('harappan garrison')", ''],
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
 * (M) MACIERZ ABLACYJNA — jedna mutacja = jedna linia = jedna asercja.
 * Każda odtwarza konkretny, prawdopodobny błąd konstrukcyjny; `cel` mówi,
 * KTÓRA asercja ma się pod nią zaczerwienić.
 */
const GEOM_MUTATIONS = [
  { id: 'M1', cel: 'H1', opis: 'wlocznia z powrotem na osi przedramienia (ramie prawie wspolliniowe)',
    from: 'const armR = z1BuildArm(group, -Z1_SHLD_X, 0.95, 2.15, mTeal, mSkin, mSkin);',
    to:   'const armR = z1BuildArm(group, -Z1_SHLD_X, 1.24, 1.58, mTeal, mSkin, mSkin);' },
  { id: 'M2', cel: 'H2', opis: 'tarcza Muru tarcz z powrotem na pozycji wpisanej na sztywno',
    from: '  sh.position.set(\n    armL.wrist.x - 0.078 * HEX_R,\n'
        + '    0.198 * HEX_R,                       // dol tuz nad ziemia — mur tarcz\n'
        + '    armL.wrist.z + 0.050 * HEX_R,\n  );',
    to:   '  sh.position.set(0.130 * HEX_R, 0.195 * HEX_R, 0.105 * HEX_R);' },
  { id: 'M3', cel: 'H3', opis: 'tarcza Muru tarcz podniesiona ponad chwyt wloczni',
    from: '    0.198 * HEX_R,                       // dol tuz nad ziemia — mur tarcz',
    to:   '    0.268 * HEX_R,                       // dol tuz nad ziemia — mur tarcz' },
  { id: 'M4', cel: 'H4', opis: 'pole tarczy Muru tarcz zmniejszone do rozmiaru sprzed audytu',
    from: "const face = new THREE.Mesh(gBox('mtshface', 0.230, 0.380, 0.014), mOwner);",
    to:   "const face = new THREE.Mesh(gBox('mtshface', 0.170, 0.340, 0.014), mOwner);" },
  { id: 'M5', cel: 'H5', opis: 'tarcza Muru tarcz odsunieta na zewnatrz, przestaje zaslaniac tors',
    from: '    armL.wrist.x - 0.078 * HEX_R,',
    to:   '    armL.wrist.x + 0.030 * HEX_R,' },
  { id: 'M6', cel: 'H6', opis: 'tarcza Harappy obrocona tylem do kamery gry (klasa bledu T2)',
    from: "  sh.rotation.y = -0.18;\n  const base = new THREE.Mesh(gBox('grshbase', 0.210, 0.340, 0.014), mReed);",
    to:   "  sh.rotation.y = Math.PI - 0.18;\n  const base = new THREE.Mesh(gBox('grshbase', 0.210, 0.340, 0.014), mReed);" },
  { id: 'M7', cel: 'H7', opis: 'klinga Gwardii zdjeta z osi dloni (dlon mija bron — klasa bledu T1)',
    from: '  blade.rotation.x = Math.PI - 1.40;',
    to:   '  blade.rotation.x = Math.PI - 0.60;' },
  { id: 'M8', cel: 'H8', opis: 'ramie Gwardii wyprostowane jak kij (lokiec bez zgiecia — klasa bledu T1)',
    from: 'const armR = z1BuildArm(group, -Z1_SHLD_X, 1.02, 1.40, mLinen, mSkin, mLeath);',
    to:   'const armR = z1BuildArm(group, -Z1_SHLD_X, 1.02, 1.02, mLinen, mSkin, mLeath);' },
  { id: 'M9', cel: 'H9', opis: 'ramie Piechoty opuszczone — cios z gory znika',
    from: 'const armR = z1BuildArm(group, -Z1_SHLD_X, -2.15, 2.45, mBrick, mSkin, mLeath);',
    to:   'const armR = z1BuildArm(group, -Z1_SHLD_X, -1.00, 2.45, mBrick, mSkin, mLeath);' },
  { id: 'M10', cel: 'H10', opis: 'tasak Harappy zwezony do szerokosci miecza mezopotamskiego',
    from: "gBox('grblade', 0.038, 0.130, 0.012)",
    to:   "gBox('grblade', 0.026, 0.130, 0.012)" },
  { id: 'M11', cel: 'H11', opis: 'Harappa traci odkryte oczy (helm zakryty jak u Mezopotamczykow)',
    from: 'const mSkin = z1Core(group, mat, mCotton, Z1_SKIN_INDUS, true);',
    to:   'const mSkin = z1Core(group, mat, mCotton, Z1_SKIN_INDUS, false);' },
];
function makeGeomPlugin(mut, stat) {
  return {
    name: 'geom-' + mut.id,
    setup(build) {
      build.onLoad({ filter: /jednostki-z1-mezopotamia\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== MEZO_TS) return null;
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
    console.log('[zelazo-mezopotamia-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
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
// próg wzięty z zaakceptowanego modelu Falangi z T3, patrz nagłówek)
const BODY_RE = /-(torso|neck|head|leg-[a-z]+-(thigh|shin|foot)|arm-(left|right)-upper|arm-left-fore)$/;
const WEAPON_RE = /-(sword|cleaver|spear)-(blade|tip|shaft|butt|guard|grip)$/;
const SHIELD_RE = /-shield(-|$)/;
const KOLIZJA_PROG = 0.006;
// kierunek patrzenia kamery gry: camera.ts — azymut 0 (yaw stałe), elewacja 52°
const EL = 52 * Math.PI / 180;
const CAM_VIEW = [0, -Math.sin(EL), -Math.cos(EL)];

/** Asercje ROZSTRZYGAJĄCE dispatch — mają padać na bundlu (D) dla nazw EN. */
function assertDispatch(m, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };
  UNITS.forEach((u, i) => {
    const a = m[u.pf], b = m[u.pf + '_en'], g = m.generic[u.cat];
    t('A' + (i + 1), '(A' + (i + 1) + ') „' + u.pl + '" (PL) buduje własny model, nie generyk `' + u.cat + '`',
      a.meshCount > g.meshCount && a.names.some((n) => n.startsWith(u.pf + '-')),
      { unit: a.meshCount, generic: g.meshCount });
    t('A' + (i + 5), '(A' + (i + 5) + ') „' + u.en + '" (EN) trafia w TEN SAM model co nazwa PL',
      b.meshCount === a.meshCount && b.meshCount > g.meshCount
      && b.names.filter((n) => n.startsWith(u.pf + '-')).length === a.names.filter((n) => n.startsWith(u.pf + '-')).length,
      { en: b.meshCount, pl: a.meshCount, generic: g.meshCount });
  });
  return res;
}

/** Asercje GEOMETRYCZNE (H1-H11) — każda ma swoją pojedynczą mutację (M1-M11). */
function assertGeometry(m, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };

  // H1 — BROŃ nie tkwi w CIELE (bez ręki uzbrojonej: to chwyt). Klasa T1/T3.
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

  // H3 — Mur tarcz: chwyt włóczni NAD górną krawędzią tarczy (poza „przyjęcia
  // szarży", units.json: Bonus vs Mount 50%). Krawędź z modelu, nie z liczby.
  const mt = m.mt, mtN = byName(mt);
  const mtShield = mt.parts.filter((p) => SHIELD_RE.test(p.name));
  const mtShieldTop = mtShield.length ? bboxOf(mtShield).mx[1] : NaN;
  const mtGripY = mt.anchors ? mt.anchors.grip[1] : NaN;
  t('H3', '(H3) Mur tarcz: chwyt włóczni jest NAD górną krawędzią tarczy (>0.015×HEX_R)',
    Number.isFinite(mtGripY) && Number.isFinite(mtShieldTop) && mtGripY - mtShieldTop > 0.015,
    { chwytY: +mtGripY.toFixed(4), krawedzY: +mtShieldTop.toFixed(4) });

  // H4 — „Mur tarcz" ma NAJWIĘKSZE POLE ROBOCZE tarczy z czwórki (Obrona 10/
  // Pancerz 7 vs 8/5 u pozostałych). Mierzone na PŁYCIE CZOŁOWEJ — tej, którą
  // widzi przeciwnik i kamera — a nie na pudełku całej tarczy z okuciami:
  // pudełko zbiorcze schowałoby zmniejszenie samej płyty za rozmiarem deski,
  // dokładnie tak, jak w tej serii pudełka zbiorcze chowały broń w ciele.
  const FIELD = {
    het: ['het-shield-face-upper', 'het-shield-face-lower'],
    nb: ['nb-shield-face'], mt: ['mt-shield-face'], gr: ['gr-shield-wicker'],
  };
  const pole = {};
  for (const u of UNITS) {
    const n = byName(m[u.pf]);
    const sp = FIELD[u.pf].map((x) => n[x]).filter(Boolean);
    if (!sp.length) { pole[u.pf] = NaN; continue; }
    const bb = bboxOf(sp);
    pole[u.pf] = (bb.mx[0] - bb.mn[0]) * (bb.mx[1] - bb.mn[1]);
  }
  t('H4', '(H4) „Mur tarcz" ma NAJWIĘKSZĄ płytę czołową tarczy z czwórki (nazwa + Obrona 10 + Pancerz 7)',
    Number.isFinite(pole.mt) && pole.mt > pole.gr && pole.mt > pole.het && pole.mt > pole.nb,
    Object.fromEntries(Object.entries(pole).map(([k, v]) => [k, +v.toFixed(4)])));

  // H5 — tarcza Muru tarcz FAKTYCZNIE zasłania tors: przecina oś ciała.
  const mtSB = bboxOf(mtShield);
  const halfW = mt.anchors ? mt.anchors.torsoHalfW : NaN;
  t('H5', '(H5) tarcza Muru tarcz przecina oś ciała i zasłania >2/3 szerokości torsu',
    Number.isFinite(halfW) && mtSB.mn[0] < -0.02
    && (Math.min(mtSB.mx[0], halfW) - Math.max(mtSB.mn[0], -halfW)) / (2 * halfW) > 0.66,
    { shieldMinX: +mtSB.mn[0].toFixed(4), shieldMaxX: +mtSB.mx[0].toFixed(4), torsHalf: halfW });

  // H6 — KAŻDE pole tarczy w kolorze gracza jest zwrócone DO KAMERY GRY.
  // Dokładnie błąd znaleziony w T2 (tarcza fizycznie niewidoczna).
  const OWNER_FACE = { het: 'het-shield-face-upper', nb: 'nb-shield-face', mt: 'mt-shield-face', gr: 'gr-shield-band' };
  const dots = {};
  for (const u of UNITS) {
    const p = byName(m[u.pf])[OWNER_FACE[u.pf]];
    dots[u.pf] = p ? +dot(p.axZ, CAM_VIEW).toFixed(3) : NaN;
  }
  t('H6', '(H6) pole tarczy w kolorze gracza jest zwrócone DO kamery gry we WSZYSTKICH 4 (klasa błędu T2)',
    UNITS.every((u) => Number.isFinite(dots[u.pf]) && dots[u.pf] < -0.30), dots);

  // H7 — dłoń uzbrojona leży NA OSI broni (klasa błędu T1: dłoń mija broń).
  const WEAP_MAIN = { het: 'het-sword-blade', nb: 'nb-sword-blade', mt: 'mt-spear-shaft', gr: 'gr-cleaver-blade' };
  const offs = {};
  for (const u of UNITS) {
    const n = byName(m[u.pf]);
    const fist = n[u.pf + '-arm-right-fist'], w = n[WEAP_MAIN[u.pf]];
    offs[u.pf] = (fist && w) ? +distPointLine(fist.pos, w.pos, unit(w.axY)).toFixed(4) : NaN;
  }
  t('H7', '(H7) dłoń uzbrojona leży NA OSI broni (<0.030×HEX_R) we wszystkich 4 — trzyma, nie mija',
    UNITS.every((u) => Number.isFinite(offs[u.pf]) && offs[u.pf] < 0.030), offs);

  // H8 — łokieć ręki uzbrojonej ZGIĘTY (klasa błędu T1: ręka prosta jak kij).
  const bends = {};
  for (const u of UNITS) {
    const n = byName(m[u.pf]);
    const up = n[u.pf + '-arm-right-upper'], fo = n[u.pf + '-arm-right-fore'];
    bends[u.pf] = (up && fo) ? +Math.acos(Math.max(-1, Math.min(1, dot(up.axY, fo.axY)))).toFixed(3) : NaN;
  }
  t('H8', '(H8) łokieć ręki uzbrojonej ZGIĘTY (>0.30 rad) we wszystkich 4',
    UNITS.every((u) => Number.isFinite(bends[u.pf]) && bends[u.pf] > 0.30), bends);

  // H9 — Piechota neobabilońska: CIOS Z GÓRY, czyli grot NAD hełmem.
  const nbN = byName(m.nb);
  const nbTipMinY = nbN['nb-sword-tip'] ? bboxOf([nbN['nb-sword-tip']]).mn[1] : NaN;
  const nbHelmMaxY = nbN['nb-helmet-cone'] ? bboxOf([nbN['nb-helmet-cone']]).mx[1] : NaN;
  t('H9', '(H9) Piechota neobabilońska: grot miecza NAD hełmem (cios z góry, nie pchnięcie)',
    Number.isFinite(nbTipMinY) && Number.isFinite(nbHelmMaxY) && nbTipMinY > nbHelmMaxY,
    { grotMinY: +nbTipMinY.toFixed(4), helmMaxY: +nbHelmMaxY.toFixed(4) });

  // H10 — Garnizon Harappy: SZEROKI tasak (Arrian, „Indike" 16 — szeroki miecz
  // piechoty indyjskiej), wyraźnie szerszy niż miecze mezopotamskie.
  const wid = (mm, nm) => { const p = byName(mm)[nm]; return p ? p.localMax[0] - p.localMin[0] : NaN; };
  const wGr = wid(m.gr, 'gr-cleaver-blade'), wHet = wid(m.het, 'het-sword-blade'), wNb = wid(m.nb, 'nb-sword-blade');
  t('H10', '(H10) tasak Harappy jest SZERSZY od obu mieczy mezopotamskich (K3: szeroki miecz indyjski)',
    Number.isFinite(wGr) && wGr > wHet * 1.2 && wGr > wNb * 1.2,
    { harappa: +wGr.toFixed(4), hetycki: +wHet.toFixed(4), babilonski: +wNb.toFixed(4) });

  // H11 — Garnizon Harappy JEDYNY ma odkryte oczy (K5: brak hełmu metalowego).
  const grEyes = m.gr.names.filter((n) => n.includes('-eye-')).length;
  const otherEyes = ['het', 'nb', 'mt'].reduce((s, pf) => s + m[pf].names.filter((n) => n.includes('-eye-')).length, 0);
  t('H11', '(H11) Harappa ma odkryte oczy i jest JEDYNA z czwórki, która je ma (K5: brak hełmu metalowego)',
    grEyes === 2 && otherEyes === 0, { harappa: grEyes, pozostale: otherEyes });

  if (!soft) {
    console.log('  [relacje] chwyt/krawedz Muru tarcz=' + (mtGripY - mtShieldTop).toFixed(4)
      + ' | pola tarcz mt=' + pole.mt.toFixed(4) + ' gr=' + pole.gr.toFixed(4)
      + ' het=' + pole.het.toFixed(4) + ' nb=' + pole.nb.toFixed(4)
      + ' | normale do kamery=' + JSON.stringify(dots)
      + ' | lokcie=' + JSON.stringify(bends) + ' | dlon na osi=' + JSON.stringify(offs));
    void mtN;
  }
  return res;
}

/** Reszta: proporcje, odróżnialność, brak regresji sąsiadów, sekcje historyczne. */
function assertRest(m, mezoSrc, unitsSrc, unitRows) {
  // --- (E) proporcje ---------------------------------------------------------
  for (const u of UNITS) {
    const mm = m[u.pf];
    check('(E:' + u.pf + ') kopyta/stopy na y≈0, promień w limicie heksu (≤0.866), wysokość 0.55–0.90×HEX_R',
      mm.minY < 0.02 && mm.maxR <= 0.866 && mm.height > 0.55 && mm.height < 0.90,
      { minY: +mm.minY.toFixed(4), maxR: +mm.maxR.toFixed(4), h: +mm.height.toFixed(4) });
  }
  // --- (N) każdy mesh nazwany + kotwice (warunek możliwości audytu) ----------
  for (const u of UNITS) {
    const mm = m[u.pf];
    check('(N:' + u.pf + ') KAŻDY mesh ma nazwę z prefiksem `' + u.pf + '-` i grupa ma `userData.anchors`',
      mm.names.length === mm.meshCount && mm.names.every((n) => n.startsWith(u.pf + '-')) && mm.anchors !== null,
      { mesh: mm.meshCount, nazwane: mm.names.length, anchors: mm.anchors !== null });
  }
  // --- (C) odróżnialność: różne rodzaje tarcz + różne palety ----------------
  const kinds = UNITS.map((u) => m[u.pf].anchors && m[u.pf].anchors.shieldKind);
  check('(C1) cztery RÓŻNE rodzaje tarczy (żadna para nie dzieli typu)',
    new Set(kinds).size === 4, kinds);
  const sig = UNITS.map((u) => m[u.pf].names.slice().sort().join('|'));
  check('(C2) cztery RÓŻNE zestawy części (żadna para modeli nie jest aliasem)',
    new Set(sig).size === 4, UNITS.map((u, i) => u.pf + ':' + m[u.pf].meshCount + '/' + sig[i].length));
  // --- (R) brak regresji sąsiadów -------------------------------------------
  check('(R1) Falanga (T3) nadal się buduje i NIE dostała mesh tej czwórki',
    m.falanga.meshCount > 20 && !m.falanga.names.some((n) => /^(het|nb|mt|gr)-/.test(n)),
    { mesh: m.falanga.meshCount });
  check('(R2) generyczne `miecznik`/`wlocznik` nietknięte (brak nazw tej czwórki)',
    !m.generic.miecznik.names.some((n) => /^(het|nb|mt|gr)-/.test(n))
    && !m.generic.wlocznik.names.some((n) => /^(het|nb|mt|gr)-/.test(n)));

  // --- (0) kotwice statyczne w źródle ---------------------------------------
  check('(0a) units.ts: wszystkie 4 linie dispatchu mają rdzeń PL i rdzeń EN',
    unitsSrc.includes("n.includes('gwardia hetycka') || n.includes('hittite guard')")
    && unitsSrc.includes("n.includes('piechota neobabilonska') || n.includes('neo-babylonian infantry')")
    && unitsSrc.includes("n.includes('mur tarcz') || n.includes('shield wall')")
    && unitsSrc.includes("n.includes('garnizon harappy') || n.includes('harappan garrison')"));
  const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[Łł]/g, 'l').toLowerCase();
  for (const core of ['gwardia hetycka', 'hittite guard', 'piechota neobabilonska', 'neo-babylonian infantry',
    'mur tarcz', 'shield wall', 'garnizon harappy', 'harappan garrison']) {
    const hits = unitRows.filter((r) => norm(r['Jednostka']).includes(core) || norm(r['Nazwa EN'] || '').includes(core));
    check('(0b:' + core + ') rdzeń dispatchu JEDNOZNACZNY w całym units.json (dokładnie 1 trafienie)',
      hits.length === 1, hits.map((r) => r['Jednostka']));
  }
  for (const u of UNITS) {
    const row = unitRows.find((r) => r['Jednostka'] === u.pl);
    check('(0c:' + u.pf + ') units.json: Epoka=Żelazo, Tech=Hutnictwo żelaza, Atak dystansowy=0, Nazwa EN zgodna',
      row !== undefined && row['Epoka'] === 'Żelazo' && row['Tech'] === 'Hutnictwo żelaza'
      && row['Atak dystansowy'] === 0 && row['Nazwa EN'] === u.en,
      row && { e: row['Epoka'], t: row['Tech'], ad: row['Atak dystansowy'], en: row['Nazwa EN'] });
  }
  const mt = unitRows.find((r) => r['Jednostka'] === 'Mur tarcz (Sargonid)');
  check('(0d) units.json: „Mur tarcz" ma NAJWYŻSZĄ Obronę i Pancerz z czwórki (podstawa asercji H4)',
    mt !== undefined && UNITS.filter((u) => u.pf !== 'mt').every((u) => {
      const r = unitRows.find((x) => x['Jednostka'] === u.pl);
      return r && mt['Obrona'] > r['Obrona'] && mt['Pancerz'] > r['Pancerz'];
    }), mt && { obrona: mt['Obrona'], pancerz: mt['Pancerz'] });

  // --- (K) sekcje historyczne — obecność i konkret, nie sam nagłówek --------
  check('(K0) plik ma sekcję ZGODNOŚĆ HISTORYCZNA dla KAŻDEJ z czterech jednostek',
    (mezoSrc.match(/ZGODNOSC HISTORYCZNA/g) || []).length === 4);
  const K = [
    ['K:hetyci-rama', /neohetyck|Karkemisz/i],
    ['K:hetyci-zelazo', /KBo 1\.14/],
    ['K:hetyci-buty', /zadart/i],
    ['K:babilon-brak-zrodel', /NIE MA\s*\n?\s*\*?\s*ZACHOWANEJ NARRACYJNEJ SZTUKI WOJENNEJ|ZACHOWANEJ NARRACYJNEJ SZTUKI WOJENNEJ/],
    ['K:babilon-isztar', /Isztar/],
    ['K:sargonid-rozjazd', /Sargon II \(722-705\)|OSTATNIA DYNASTIE\s*\n?\s*\*?\s*ASYRYJSKA|Sargonid/],
    ['K:sargonid-stela', /Stela Sepow Eannatuma|Eannatum/],
    ['K:sargonid-kaunakes', /ANACHRONIZM ZOSTAWIONY SWIADOMIE/],
    ['K:harappa-rama', /2600-1900 p\.n\.e\./],
    ['K:harappa-arrian', /Arrian/],
    ['K:harappa-herodot', /Herodot VII\.65/],
    ['K:harappa-kaplan-krol', /Kaplana-Krola|Kaplan/i],
  ];
  for (const [id, re] of K) {
    check('(' + id + ') sekcja historyczna niesie konkret, nie sam nagłówek', re.test(mezoSrc));
  }
  check('(K:anachronizmy-nazwane) oba twarde anachronizmy (kaunakes, Harappa w epoce żelaza) są NAZWANE, nie zamiecione',
    /ANACHRONIZM ZOSTAWIONY SWIADOMIE/.test(mezoSrc) && /z definicji anachronizmem/.test(mezoSrc));
}

/**
 * ODRÓŻNIALNOŚĆ z KAMERY GRY — mierzona PIKSELAMI, ale NIE na binarnej
 * sylwetce. Cztery figurki stoją na tym samym szkielecie piechura, więc same
 * obrysy są z natury podobne (zmierzone IoU obrysów: 0,71–0,83) i binarny
 * test niczego by nie rozstrzygnął — a obniżenie jego progu do „przechodzi"
 * byłoby dopasowaniem miary do wyniku. Mierzone jest więc to, co gracz
 * faktycznie rozróżnia: UDZIAŁ PIKSELI RÓŻNIĄCYCH SIĘ (pokryciem albo
 * barwą o ≥40/255 na którymkolwiek kanale) w suchym obrysie pary.
 * Skala odniesienia bierze się z RENDERU, nie z sufitu: ten sam model
 * porównany sam ze sobą daje 0,000, a para spoza tej czwórki, o której z
 * góry wiadomo, że jest odróżnialna (Falanga z T3 vs każda z czterech),
 * wyznacza górny koniec pasma.
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
    // KONTROLE skali (z renderu, nie z sufitu)
    const same = diff(shots[0], shot(units[0].cat, units[0].pl, 0x3366ee));
    const falanga = shot('falanga', 'Falanga', 0x3366ee);
    const vsFalanga = units.map((u, i) => ({ pf: u.pf, d: diff(shots[i], falanga) }));
    return { pairs, same, vsFalanga };
  }, { units: UNITS });
}

async function main() {
  const unitsSrc = fs.readFileSync(UNITS_TS, 'utf8');
  const mezoSrc = fs.readFileSync(MEZO_TS, 'utf8');
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
  check('(D0) mutacja (D) usunęła DOKŁADNIE 4 aliasy angielskie (test nie jest pusty)',
    statD.applied === 4, statD.applied);

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
  if (statD.applied !== 4 || badMut.length > 0) {
    console.log('\nPRZERWANE: nie da się odtworzyć stanu sprzed poprawki — kod się przesunął, popraw EN_ALIASES/GEOM_MUTATIONS.');
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1024, height: 640 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function renderWith(bundleFile) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
    await page.addScriptTag({ path: bundleFile });
    return measureAll(page);
  }

  const SHOT = async (file, names, colors) => {
    await page.evaluate(({ nm, cl }) => {
      const THREE = window.__THREE;
      const B = window.__buildUnitModel;
      document.body.innerHTML = '';
      const W = 1024, H = 420;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setClearColor(0x6f8f5f, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 40);
      const el = 52 * Math.PI / 180, dist = 4.0;      // KAMERA GRY (camera.ts)
      cam.position.set(0, 0.30 + dist * Math.sin(el), dist * Math.cos(el));
      cam.lookAt(0, 0.30, 0);
      scene.add(new THREE.AmbientLight(0xffffff, 0.72));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.05); d1.position.set(2, 4, 3); scene.add(d1);
      nm.forEach((n, i) => {
        const g = B(i === 2 ? 'wlocznik' : 'miecznik', cl[i], n);
        g.position.x = (i - (nm.length - 1) / 2) * 0.95;
        scene.add(g);
      });
      renderer.render(scene, cam);
      window.__ready = true;
    }, { nm: names, cl: colors });
    await page.waitForFunction('window.__ready === true');
    await page.screenshot({ path: file });
    await page.evaluate(() => { window.__ready = false; });
  };

  let matrix = [];
  try {
    console.log('\n--- (0)-(K) pomiar PO audycie (bundel z niezmienionych źródeł) ---');
    const after = await renderWith(BUNDLE_PO);
    assertDispatch(after, false);
    assertGeometry(after, false);
    assertRest(after, mezoSrc, unitsSrc, unitRows);

    const dist = await pixelDistinctness(page);
    console.log('  [odroznialnosc] kontrola „ten sam model" = ' + dist.same.toFixed(3)
      + ' | vs Falanga (para z gory odroznialna) = '
      + dist.vsFalanga.map((r) => r.pf + '=' + r.d.toFixed(3)).join(' ')
      + ' | pary czworki = ' + dist.pairs.map((r) => r.a + '/' + r.b + '=' + r.d.toFixed(3)).join(' '));
    check('(C3a) kontrola miary: ten sam model porównany sam ze sobą daje ~0 (miara nie jest szumem)',
      dist.same < 0.01, dist.same);
    check('(C3b) każda z 6 par czwórki różni się z KAMERY GRY na ≥45% pikseli obrysu',
      dist.pairs.every((r) => r.d >= 0.45), dist.pairs.map((r) => r.a + '/' + r.b + '=' + r.d.toFixed(3)));
    check('(C3c) różnice wewnątrz czwórki są w tym samym paśmie co para z góry odróżnialna (vs Falanga)',
      Math.min(...dist.pairs.map((r) => r.d)) >= 0.60 * Math.min(...dist.vsFalanga.map((r) => r.d)),
      { minPara: +Math.min(...dist.pairs.map((r) => r.d)).toFixed(3),
        minVsFalanga: +Math.min(...dist.vsFalanga.map((r) => r.d)).toFixed(3) });

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await SHOT(path.join(SHOTS, 'po-mezopotamia-kamera-gry.png'),
        UNITS.map((u) => u.pl), [0x3366ee, 0xcc4422, 0x22aa55, 0xbb33bb]);
    }

    console.log('\n--- (D) mutacja DISPATCHU: nazwy EN sprzed audytu ---');
    const beforeD = await renderWith(BUNDLE_D);
    const softD = assertDispatch(beforeD, true);
    const plGreen = softD.filter((r) => /^A[1-4]$/.test(r.id));
    const enGreen = softD.filter((r) => /^A[5-8]$/.test(r.id) && r.cond).map((r) => r.id);
    check('(D1) bez aliasów EN KAŻDA asercja angielska (A5-A8) pada', enGreen.length === 0, { nadal_zielone: enGreen });
    check('(D2) bez aliasów EN asercje polskie (A1-A4) zostają ZIELONE (mutacja jest chirurgiczna)',
      plGreen.every((r) => r.cond), plGreen.filter((r) => !r.cond).map((r) => r.id));
    check('(D3) PRZED audytem nazwy EN dawały DOKŁADNIE generyk `miecznik`/`wlocznik`',
      UNITS.every((u) => beforeD[u.pf + '_en'].meshCount === beforeD.generic[u.cat].meshCount),
      UNITS.map((u) => u.pf + ':' + beforeD[u.pf + '_en'].meshCount + '/' + beforeD.generic[u.cat].meshCount));

    if (SHOTS !== null) {
      await SHOT(path.join(SHOTS, 'przed-nazwy-EN-generyk.png'),
        UNITS.map((u) => u.en), [0x3366ee, 0xcc4422, 0x22aa55, 0xbb33bb]);
    }

    console.log('\n--- (M) MACIERZ ABLACYJNA: jedna mutacja = jedna linia = jedna asercja ---');
    const base = assertGeometry(after, true);
    matrix.push({ label: 'BAZA'.padEnd(6) + ' (bez mutacji)'.padEnd(62), res: base });
    for (const g of geomBundles) {
      const mm = await renderWith(g.out);
      const soft = assertGeometry(mm, true);
      matrix.push({ label: g.mut.id.padEnd(6) + ' ' + g.mut.opis.slice(0, 60).padEnd(62), res: soft, mut: g.mut });
    }
    const ids = base.map((r) => r.id);
    console.log('        ' + ids.map((i) => i.padEnd(6)).join(''));
    for (const row of matrix) {
      const map = Object.fromEntries(row.res.map((r) => [r.id, r.cond]));
      console.log(row.label + ids.map((i) => (map[i] ? 'green' : 'RED  ').padEnd(6)).join(''));
    }
    // każda asercja MUSI czerwienieć pod SWOJĄ mutacją
    const nieNosne = [];
    for (const row of matrix) {
      if (!row.mut) continue;
      const map = Object.fromEntries(row.res.map((r) => [r.id, r.cond]));
      if (map[row.mut.cel] !== false) nieNosne.push(row.mut.id + '→' + row.mut.cel);
    }
    check('(M1) KAŻDA z H1-H' + ids.length + ' czerwienieje pod SWOJĄ pojedynczą mutacją — (H) nie jest tautologią',
      nieNosne.length === 0, { nienosne: nieNosne });
    const baseAllGreen = base.every((r) => r.cond);
    check('(M2) na niezmienionym źródle WSZYSTKIE asercje (H) są zielone (baza macierzy)',
      baseAllGreen, base.filter((r) => !r.cond).map((r) => r.id));

    if (SHOTS !== null) {
      const gm1 = geomBundles.find((g) => g.mut.id === 'M1');
      await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
      await page.addScriptTag({ path: gm1.out });
      await SHOT(path.join(SHOTS, 'mutacja-M1-wlocznia-w-ramieniu.png'),
        UNITS.map((u) => u.pl), [0x3366ee, 0xcc4422, 0x22aa55, 0xbb33bb]);
    }

    check('(F0) zero błędów konsoli/JS we wszystkich renderach', pageErrors.length === 0, pageErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  // --- (G) artefakt PRODUKCYJNY vite build (C-001) ---------------------------
  if (!SKIP_VITE) {
    let dist = DIST_ARG;
    if (dist === null) {
      const outDir = path.join(os.tmpdir(), `civ-zelazo-t5-render-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(G1) artefakt vite build niesie wszystkie 4 rdzenie PL',
      /gwardia hetycka/i.test(built) && /piechota neobabilonska/i.test(built)
      && /mur tarcz/i.test(built) && /garnizon harappy/i.test(built));
    check('(G2) artefakt vite build niesie wszystkie 4 rdzenie EN (naprawa T5 jest w produkcji)',
      /hittite guard/i.test(built) && /neo-babylonian infantry/i.test(built)
      && /shield wall/i.test(built) && /harappan garrison/i.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch (_) {}

  console.log('\nzelazo-mezopotamia-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
