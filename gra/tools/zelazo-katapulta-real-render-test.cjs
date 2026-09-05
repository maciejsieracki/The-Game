'use strict';
/**
 * zelazo-katapulta-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T11 — audyt KATAPULTY (bez kultury/nacji),
 * ostatniej jednostki serii.
 *   `gra/src/render/units.ts` — WYLACZNIE buildCatapult() + linia dispatchu.
 *
 * ZGLOSZENIE. buildCatapult() przed T11 nie nazywal ANI JEDNEGO mesh
 * (zmierzone: 0/11) i nie mial `userData.anchors` — ta sama przyczyna,
 * dla ktorej z1-mezopotamia (T5), z2-srodziemnomorze (T6), p6-super (T7)
 * i z3-plemiona (T8) nie byly wczesniej sprawdzone. Bez nazw zadna asercja
 * nie moze zaadresowac czesci, a punkty odniesienia musialyby byc wpisane
 * liczbowo w test — czyli test mierzylby sam siebie.
 *
 * TO NIE JEST JEDNOSTKA PIESZA. Katapulta nie ma anatomii, wiec asercje
 * rodziny T1-T10 („bron w ciele", „tarcza wzgledem kamery", „stopy pod
 * terenem") nie przenosza sie 1:1. Ich ODPOWIEDNIKIEM dla maszyny jest
 * LANCUCH MECHANICZNY: ramie musi siedziec na swojej osi obrotu, pocisk musi
 * wisiec na haku, lina musi laczyc dwa ISTNIEJACE punkty, a swobodny tor
 * ramienia musi konczyc sie NA poduszce zderzaka. Kazda z tych relacji jest
 * mierzona, nie zakladana.
 *
 * DLACZEGO PRAWDZIWA PRZEGLADARKA (R-PROC-AUTOBOT.md §9 poz. 6a): to model 3D
 * (Three.js). Dwa z defektow znalezionych w T11 sa NIEWIDOCZNE bez policzenia,
 * ile pikseli danej czesci widac z kamery gry — lina kolowrotu istniala
 * w geometrii i miala ZERO PIKSELI, bo zaslanialo ja wlasne ramie; sciag
 * glowicy tak samo. To ta sama klasa bledu co oczy Berserkera w T8.
 *
 * KAMERA GRY: `src/render/camera.ts` — staly azymut 0 (yaw nie zmienia sie
 * nigdy), elewacja 52 stopnie.
 *
 * PROGI BIORA SIE Z RODZINY, NIE Z SUFITU. Modele odniesienia to pozostale
 * trzy machiny oblezicze (Taran, Taran okuty, Wieza oblezicza) oraz Hastati
 * i Falanga jako dolna granica „to juz piechota, nie machina" — wszystkie
 * mierzone W TYM SAMYM RENDERZE co Katapulta, nie z pamieci.
 *
 * DOWOD NIETAUTOLOGICZNOSCI — MACIERZ ABLACYJNA, POJEDYNCZA MUTACJA NA ASERCJE
 * (standard serii ustalony przez Evaluatora T4, utrzymany w T5-T8): kazdy
 * bundel M* rozni sie od zrodla DOKLADNIE JEDNYM podmienionym miejscem (M0
 * pilnuje tego mechanicznie). Egzekwowana asercja jest w kierunku PER-H:
 * KAZDA z H1-H15 ma co najmniej JEDNA mutacje, ktora ja SAMA czerwieni.
 * Nie znaczy to, ze kazda mutacja czerwieni WYLACZNIE jedna asercje — kilka
 * dotyka geometrii, od ktorej zalezy wiecej niz jedna relacja; pelna macierz
 * jest drukowana ponizej, nic nie jest ukryte. Wiekszosc mutacji odtwarza
 * DOSLOWNY stan sprzed audytu T11.
 *
 * Usage (z gra/): node tools/zelazo-katapulta-real-render-test.cjs
 *   --shots <katalog>   zrzuty z kamery gry do <katalog>/*.png
 *   --dist <index.html> uzyj gotowego artefaktu vite zamiast budowac go w tescie
 *   --skip-vite         pomin sekcje (G) artefaktu produkcyjnego
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[zelazo-katapulta-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-katapulta-entry.ts');
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
const OUTDIR = path.resolve(os.tmpdir(), `civ-zelazo-t11-bundles-${TMPDIR_RUN_ID}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');
// C-001: jedyny dozwolony build to binarka vite z node_modules przez `node`,
// NIGDY `npm run build` ani `npx`; katalog wyjsciowy POZA drzewem repo.
const VITE_BIN = path.resolve(GRA, 'node_modules', 'vite', 'bin', 'vite.js');

const argOf = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const SKIP_VITE = process.argv.includes('--skip-vite');
const OWNER = 0x3366ee;

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

// jednostka tematu + RODZINA ODNIESIENIA (poza zakresem T11, mierzona tym samym
// renderem: sluzy za skale i za kontrole regresji sasiadow)
const KAT = { key: 'kat', pl: 'Katapulta', en: 'Catapult', cat: 'katapulta' };
const SIEGE_REF = [
  { key: 'taranOkuty', pl: 'Taran okuty',      cat: 'taran' },
  { key: 'taran',      pl: 'Taran',            cat: 'taran' },
  { key: 'wieza',      pl: 'Wieża oblężnicza', cat: 'wieza' },
];
const FOOT_REF = [
  { key: 'hastati', pl: 'Hastati', cat: 'miecznik' },
  { key: 'falanga', pl: 'Falanga', cat: 'falangita' },
];

/**
 * (M) MACIERZ ABLACYJNA — jedna mutacja = jedno miejsce = jedna asercja.
 * `cel` mowi, KTORA asercja ma sie zaczerwienic. Wszystkie trafiaja w units.ts,
 * bo caly zakres T11 mieszka w tym jednym pliku.
 */
const MUTATIONS = [
  { id: 'M1', cel: 'H1',
    opis: 'ODTWORZENIE BLEDU SPRZED T11: odwrocony znak Z w polozeniu ramienia',
    from: '    [0, PIVOT_Y + ARM_DY * t, PIVOT_Z + ARM_DZ * t];',
    to:   '    [0, PIVOT_Y + ARM_DY * t, PIVOT_Z - ARM_DZ * t];' },

  { id: 'M2', cel: 'H2',
    opis: 'proca przestaje wisiec pod hakiem (odtworzenie „kubla w powietrzu")',
    from: "  add('kt-sling-pouch', gPouch, mRope, 0, POUCH_Y, hookZ);",
    to:   "  add('kt-sling-pouch', gPouch, mRope, 0, POUCH_Y, hookZ + 0.070 * U);" },

  { id: 'M3', cel: 'H3',
    opis: 'zderzak podniesiony POZA zasieg ramienia — ramie nie mialoby o co uderzyc',
    from: '  const STOP_TOP  = 0.506 * U;                // góra słupów = spód belki',
    to:   '  const STOP_TOP  = 0.620 * U;                // góra słupów = spód belki' },

  { id: 'M4', cel: 'H4',
    opis: 'lina kolowrotu wpieta w punkt STALY zamiast w ucho na ramieniu',
    from: "         [s * 0.032 * U, WIN_TOP, WIN_Z], [0, wy, wz]);",
    to:   "         [s * 0.032 * U, WIN_TOP, WIN_Z], [0, 0.560 * U, 0.060 * U]);" },

  { id: 'M5', cel: 'H5',
    opis: 'ODTWORZENIE BLEDU SPRZED T11: barwa wlasciciela odsunieta od burty (wisi w powietrzu)',
    from: "        s * (FRAME_X + FRAME_HW - 0.001 * U), FRAME_BOT + FRAME_H / 2, 0.125 * U);",
    to:   "        s * (FRAME_X + FRAME_HW + 0.030 * U), FRAME_BOT + FRAME_H / 2, 0.125 * U);" },

  { id: 'M6', cel: 'H6',
    opis: 'ODTWORZENIE BLEDU SPRZED T11: obrecz o liczbie segmentow niepodzielnej przez 4 — kolo pod terenem',
    from: '    const gTyre = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.032 * U, 16, 1);',
    to:   '    const gTyre = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.032 * U, 14, 1);' },

  { id: 'M7', cel: 'H7',
    opis: 'ODTWORZENIE BLEDU ZNALEZIONEGO W T11: obie liny kolowrotu z powrotem w osi x=0 (ZERO pikseli)',
    from: "         [s * 0.032 * U, WIN_TOP, WIN_Z], [0, wy, wz]);\n  }",
    to:   "         [0, WIN_TOP, WIN_Z], [0, wy, wz]);\n  }" },

  { id: 'M8', cel: 'H8',
    opis: 'ODTWORZENIE STANU SPRZED T11: token zmniejszony ponizej pasma rodziny obleziczej',
    from: '  const U = 1.06 * HEX_R;',
    to:   '  const U = 0.82 * HEX_R;' },

  { id: 'M9', cel: 'H9',
    opis: 'ODTWORZENIE BLEDU SPRZED T11: barwa wlasciciela tylko po JEDNEJ burcie',
    from: "    add('kt-owner-panel-' + side, gPanel, mOwner,",
    to:   "    if (s > 0) add('kt-owner-panel-' + side, gPanel, mOwner," },

  { id: 'M10', cel: 'H10',
    opis: 'DRUGIE ramie miotajace — to juz nie onager, tylko dwuramienna balista',
    from: "    add('kt-arm', gArm, mDkWood, ax, ay, az, ARM_RX);",
    to:   "    add('kt-arm', gArm, mDkWood, ax, ay, az, ARM_RX);\n"
        + "    add('kt-arm-second', gArm, mDkWood, ax, ay, az, -ARM_RX);" },

  { id: 'M11', cel: 'H11',
    opis: 'pek liny skretnej traci nazwe — czesc znow niemierzalna',
    from: "  add('kt-skein-bundle', gSkein, mRope, 0, PIVOT_Y, PIVOT_Z, 0, 0, Math.PI / 2);",
    to:   "  add('', gSkein, mRope, 0, PIVOT_Y, PIVOT_Z, 0, 0, Math.PI / 2);" },

  { id: 'M12', cel: 'H12',
    opis: 'Katapulta dispatchowana do taranu — dwie jednostki, jeden model',
    from: "  if (n.includes('katapulta') || n.includes('catapult')) return buildCatapult(ownerColor_);",
    to:   "  if (n.includes('katapulta') || n.includes('catapult')) return buildBatteringRam(ownerColor_);" },

  { id: 'M13', cel: 'H13',
    opis: 'rdzen dispatchu rozszerzony na „taran" — Katapulta przechwytuje SASIADA',
    from: "  if (n.includes('taran') || n.includes('battering ram')) return buildBatteringRam(ownerColor_);",
    to:   "  if (n.includes('taran') || n.includes('battering ram')) return buildCatapult(ownerColor_);" },

  { id: 'M14', cel: 'H14',
    opis: 'z sekcji historycznej znika lokalizacja zrodla (Ammianus XXIII.4.4-5)',
    from: ' * K6. RAMIĘ I PROCA — Ammianus XXIII.4.4–5: z tych lin wyrasta drewniany',
    to:   ' * K6. RAMIĘ I PROCA — jak w wielu machinach: z tych lin wyrasta drewniany' },

  { id: 'M15', cel: 'H15',
    opis: 'ramie odchylone DO PRZODU, choc lina kolowrotu ciagnie je do tylu — poza niespojna',
    from: '  const ARM_RX   = -(Math.PI / 2 - ARM_DEG * Math.PI / 180);',
    to:   '  const ARM_RX   = +(Math.PI / 2 - ARM_DEG * Math.PI / 180);' },
];

function makeMutPlugin(mut, stat) {
  return {
    name: 'mut-' + mut.id,
    setup(build) {
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        if (path.resolve(args.path) !== UNITS_TS) return null;
        let out = fs.readFileSync(args.path, 'utf8');
        const n = out.split(mut.from).length - 1;
        if (n === 1) { out = out.split(mut.from).join(mut.to); stat.applied++; }
        else { stat.bad.push(mut.id + ':units.ts:' + n); }
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
    console.log('[zelazo-katapulta-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

// ── geometria pomocnicza (Node) ────────────────────────────────────────────
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vlen = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const L = vlen(a); return [a[0] / L, a[1] / L, a[2] / L]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Bryla nieistniejacej czesci: zdegenerowana i odsunieta tak daleko, ze nie
// moze z niczym kolidowac ani niczego dotknac. Mutacja usuwajaca NAZWE (M11)
// ma zaczerwienic swoja asercje, a nie wywrocic calej macierzy wyjatkiem.
const MISSING = { c: [1e6, 1e6, 1e6], u: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], h: [0, 0, 0] };
function obb(p) {
  if (!p) return MISSING;
  const lc = [0, 1, 2].map((i) => (p.localMin[i] + p.localMax[i]) / 2);
  const c = [0, 1, 2].map((j) => p.pos[j] + p.axX[j] * lc[0] + p.axY[j] * lc[1] + p.axZ[j] * lc[2]);
  const h = [0, 1, 2].map((i) => (p.localMax[i] - p.localMin[i]) / 2);
  return { c, u: [p.axX, p.axY, p.axZ], h };
}
/** Glebokosc penetracji dwoch OBB (SAT, 15 osi). 0 = brak kolizji. */
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
/** Szczelina miedzy dwiema brylami: <=0 gdy sie przenikaja, >0 = realny odstep. */
function gapOf(A, B) {
  const dep = satDepth(A, B);
  if (dep > 0) return -dep;
  const d = sub(B.c, A.c);
  let best = 0;
  for (const ax of [A.u[0], A.u[1], A.u[2], B.u[0], B.u[1], B.u[2]]) {
    const ra = A.h[0] * Math.abs(dot(ax, A.u[0])) + A.h[1] * Math.abs(dot(ax, A.u[1])) + A.h[2] * Math.abs(dot(ax, A.u[2]));
    const rb = B.h[0] * Math.abs(dot(ax, B.u[0])) + B.h[1] * Math.abs(dot(ax, B.u[1])) + B.h[2] * Math.abs(dot(ax, B.u[2]));
    const sep = Math.abs(dot(d, ax)) - (ra + rb);
    if (sep > best) best = sep;
  }
  return best;
}
function distPointSeg(P, A, B) {
  const AB = sub(B, A);
  const t = Math.max(0, Math.min(1, dot(sub(P, A), AB) / dot(AB, AB)));
  return vlen(sub(P, [A[0] + AB[0] * t, A[1] + AB[1] * t, A[2] + AB[2] * t]));
}
const byName = (m) => { const o = {}; for (const p of m.parts) if (p.name) o[p.name] = p; return o; };
const halfY = (p) => [0, 1, 2].reduce((s, i) =>
  s + (p.localMax[i] - p.localMin[i]) / 2 * Math.abs([p.axX, p.axY, p.axZ][i][1]), 0);
const topY = (p) => (p ? p.pos[1] + halfY(p) : NaN);
const botY = (p) => (p ? p.pos[1] - halfY(p) : NaN);
/** Konce osi cylindra (lokalna os Y) w swiecie. */
function axisEnds(p) {
  if (!p) return null;
  const d = unit(p.axY), h = (p.localMax[1] - p.localMin[1]) / 2;
  return [
    [0, 1, 2].map((i) => p.pos[i] + d[i] * h),
    [0, 1, 2].map((i) => p.pos[i] - d[i] * h),
  ];
}
const nearestEnd = (P, ends) => (ends ? Math.min(vlen(sub(P, ends[0])), vlen(sub(P, ends[1]))) : NaN);

/**
 * WIDOCZNOSC CZESCI Z KAMERY GRY, w PIKSELACH i z testem glebi GPU. Wybrane
 * mesh dostaja jednolity wyroznik, reszta modelu plaski ciemny material;
 * liczymy piksele wyroznika po renderze. To jedyny sposob odroznic „element
 * istnieje w 3D" od „element widac na ekranie" — lina kolowrotu przechodzila
 * kazdy test geometryczny i miala ZERO PIKSELI.
 */
async function measurePixels(page) {
  return page.evaluate(({ owner, sets }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 420, el = 52 * Math.PI / 180;
    const countVisible = (cat, name, sel, byColor) => {
      document.body.innerHTML = '';
      const r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      r.setSize(S, S); r.setClearColor(0x000000, 1);
      document.body.appendChild(r.domElement);
      const s = new THREE.Scene();
      s.add(new THREE.AmbientLight(0xffffff, 1.0));
      const g = B(cat, owner, name);
      let tinted = 0;
      g.traverse((o) => {
        if (!o.isMesh) return;
        const hit = byColor
          ? !!(o.material && o.material.color && o.material.color.getHex() === owner)
          : (typeof o.name === 'string' && o.name !== '' && o.name.indexOf(sel) === 0);
        if (hit) { o.material = new THREE.MeshBasicMaterial({ color: 0xff00ff }); tinted++; }
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
    for (const q of sets) out[q.id] = countVisible(q.cat, q.pl, q.sel, !!q.byColor);
    return out;
  }, {
    owner: OWNER,
    sets: [
      { id: 'arm',     cat: 'katapulta', pl: 'Katapulta', sel: 'kt-arm' },
      { id: 'stone',   cat: 'katapulta', pl: 'Katapulta', sel: 'kt-stone' },
      { id: 'sling',   cat: 'katapulta', pl: 'Katapulta', sel: 'kt-sling' },
      { id: 'skein',   cat: 'katapulta', pl: 'Katapulta', sel: 'kt-skein' },
      { id: 'pad',     cat: 'katapulta', pl: 'Katapulta', sel: 'kt-stop-pad' },
      { id: 'wheel',   cat: 'katapulta', pl: 'Katapulta', sel: 'kt-wheel' },
      { id: 'winch',   cat: 'katapulta', pl: 'Katapulta', sel: 'kt-windlass' },
      { id: 'trigger', cat: 'katapulta', pl: 'Katapulta', sel: 'kt-trigger' },
      { id: 'ropeL',   cat: 'katapulta', pl: 'Katapulta', sel: 'kt-winch-rope-left' },
      { id: 'ropeR',   cat: 'katapulta', pl: 'Katapulta', sel: 'kt-winch-rope-right' },
      { id: 'owner',   cat: 'katapulta', pl: 'Katapulta', sel: '', byColor: true },
      // rodzina — te same miary, ten sam render
      { id: 'ref_taranOkuty_owner', cat: 'taran', pl: 'Taran okuty',      sel: '', byColor: true },
      { id: 'ref_wieza_owner',      cat: 'wieza', pl: 'Wieża oblężnicza', sel: '', byColor: true },
    ],
  });
}

/** SYLWETKA z kamery gry: pole rzutu i wysokosc ekranowa. Progi = rodzina. */
async function measureSilhouette(page) {
  return page.evaluate(({ owner, units }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 420, el = 52 * Math.PI / 180;
    const sil = (cat, name) => {
      document.body.innerHTML = '';
      const r = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
      r.setSize(S, S); r.setClearColor(0x000000, 1);
      document.body.appendChild(r.domElement);
      const s = new THREE.Scene(); s.add(new THREE.AmbientLight(0xffffff, 1.0));
      const g = B(cat, owner, name);
      g.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ color: 0xff00ff }); });
      s.add(g);
      const cam = new THREE.OrthographicCamera(-0.60, 0.60, 0.72, -0.48, 0.01, 10);
      cam.position.set(0, 0.30 + 3 * Math.sin(el), 3 * Math.cos(el));
      cam.lookAt(0, 0.30, 0);
      r.render(s, cam);
      const gl = r.getContext(); const px = new Uint8Array(S * S * 4);
      gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let n = 0, minR = S, maxR = -1;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const k = (y * S + x) * 4;
        if (px[k] > 200 && px[k + 1] < 80 && px[k + 2] > 200) { n++; if (y < minR) minR = y; if (y > maxR) maxR = y; }
      }
      r.dispose();
      return { px: n, hPx: maxR < 0 ? 0 : maxR - minR + 1 };
    };
    const out = {};
    for (const u of units) out[u.key] = sil(u.cat, u.pl);
    return out;
  }, { owner: OWNER, units: [KAT].concat(SIEGE_REF).concat(FOOT_REF) });
}

// ═══ ASERCJE H1-H15 — kazda ma swoja POJEDYNCZA mutacje M1-M15 ═════════════
function assertGeometry(m, pix, sil, src, unitRows, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };
  const K = m.kat, n = byName(K);
  const A = K.anchors || {};
  const arm = n['kt-arm'], skein = n['kt-skein-bundle'];
  const armEnds = axisEnds(arm);
  const pivot = Array.isArray(A.pivot) ? A.pivot : [1e6, 1e6, 1e6];

  // H1 — RAMIE SIEDZI NA SWOJEJ OSI OBROTU. Odpowiednik „bron w dloni" dla
  // maszyny. PRZED T11: os obrotu lezala 0.1985 HEX_R od odcinka ramienia,
  // czyli 43% jego dlugosci — ramie wisialo w powietrzu obok wlasnego skretu.
  const dAxis = armEnds ? distPointSeg(pivot, armEnds[0], armEnds[1]) : NaN;
  const dEnd = nearestEnd(pivot, armEnds);
  const satArmSkein = satDepth(obb(arm), obb(skein));
  t('H1', '(H1) ramię miotające OSADZONE na osi obrotu — stopka tkwi w pęku liny skrętnej',
    !!arm && !!skein && dAxis < 0.001 && dEnd < 0.001 && satArmSkein > 0.01,
    { os_od_odcinka: +dAxis.toFixed(4), os_od_konca: +dEnd.toFixed(4), sat_ramie_skret: +satArmSkein.toFixed(4) });

  // H2 — POCISK JEST TRZYMANY: proca ZWISA pod hakiem (pion), kamien LEZY
  // w kieszeni, kieszen SPOCZYWA na tylnej poprzeczce. PRZED T11 „kubel"
  // z kamieniem unosil sie 0.2072 HEX_R obok ramienia, nie dotykajac niczego.
  const hook = n['kt-arm-hook'], pouch = n['kt-sling-pouch'], stone = n['kt-stone'], bed = n['kt-frame-cross-rear'];
  const pion = (hook && pouch)
    ? Math.max(Math.abs(hook.pos[0] - pouch.pos[0]), Math.abs(hook.pos[2] - pouch.pos[2])) : NaN;
  const satStone = satDepth(obb(stone), obb(pouch));
  const bedGap = (pouch && bed) ? Math.abs(botY(pouch) - topY(bed)) : NaN;
  const cordsOk = ['kt-sling-cord-left', 'kt-sling-cord-right'].every((cn) => {
    const c = n[cn]; if (!c || !hook || !pouch) return false;
    return nearestEnd(hook.pos, axisEnds(c)) < 0.020 && satDepth(obb(c), obb(pouch)) >= 0;
  });
  t('H2', '(H2) pocisk TRZYMANY: proca zwisa pionowo pod hakiem, kamień leży w kieszeni, kieszeń na łożu',
    !!hook && !!pouch && !!stone && !!bed && pion < 0.001 && satStone > 0.005 && bedGap < 0.002 && cordsOk,
    { pion: +pion.toFixed(4), sat_kamien_kieszen: +satStone.toFixed(4), szczelina_loza: +bedGap.toFixed(4), sznury: cordsOk });

  // H3 — SWOBODNY TOR RAMIENIA KONCZY SIE NA PODUSZCE (Ammianus XXIII.4.6:
  // trzon „trafiwszy na miekkie wlosie, miota kamien"). Jesli poduszka jest
  // POZA zasiegiem, machina nie ma o co uderzyc i geometria klamie.
  // Jednoczesnie w pozie SPOCZYNKOWEJ ramie NIE dotyka poduszki (jest odciagniete).
  const pad = n['kt-stop-pad'];
  const dPad = pad ? vlen(sub(pad.pos, pivot)) : NaN;
  const armLen = typeof A.armLen === 'number' ? A.armLen : NaN;
  const satArmPad = satDepth(obb(arm), obb(pad));
  t('H3', '(H3) poduszka zderzaka W ZASIĘGU ramienia (i nietknięta w pozie napiętej)',
    !!pad && dPad < armLen && dPad > armLen * 0.55 && satArmPad === 0,
    { dist_os_poduszka: +dPad.toFixed(4), ARM_LEN: +armLen.toFixed(4), zapas: +(armLen - dPad).toFixed(4), sat_ramie_poduszka: satArmPad });

  // H4 — LINA KOLOWROTU LACZY DWA ISTNIEJACE PUNKTY. PRZED T11 dwie „liny"
  // wychodzily ze srodka belki podstawy i konczyly sie w powietrzu 0.134 HEX_R
  // od osi, do ktorej rzekomo prowadzily.
  const eye = n['kt-arm-winch-eye'], drum = n['kt-windlass-drum'];
  const ropeOk = ['kt-winch-rope-left', 'kt-winch-rope-right'].map((rn) => {
    const r = n[rn]; if (!r || !eye || !drum) return { ok: false };
    const ends = axisEnds(r);
    const dEye = nearestEnd(eye.pos, ends);
    const dDrum = Math.min(Math.abs(ends[0][1] - topY(drum)), Math.abs(ends[1][1] - topY(drum)));
    return { ok: dEye < 0.002 && dDrum < 0.002, dEye: +dEye.toFixed(4), dDrum: +dDrum.toFixed(4) };
  });
  const eyeOnArm = (eye && armEnds) ? distPointSeg(eye.pos, armEnds[0], armEnds[1]) : NaN;
  t('H4', '(H4) lina kołowrotu spina bęben z uchem NA RAMIENIU — oba końce na istniejących częściach',
    ropeOk.every((r) => r.ok) && eyeOnArm < 0.002,
    { liny: ropeOk, ucho_na_osi_ramienia: +eyeOnArm.toFixed(4) });

  // H5 — NIC NIE WISI W POWIETRZU. Dla maszyny to asercja NACZELNA: kazda
  // bryla musi dotykac jakiejkolwiek innej. Poprawka Final Control: pod TYM
  // SAMYM testem (kazda bryla vs NAJBLIZSZA INNA, przeliczone niezaleznie na
  // starym modelu) PRZED T11 realnie lapane byly DWIE bryly, nie szesc: ramie
  // (nie dotykalo skretu/stojaka) i lewe kolo (0.005 od ramy). Kubel z
  // kamieniem i obie „liny" dotykaly SIEBIE NAWZAJEM (szczelina zero
  // wewnatrz pary), wiec algorytm liczacy jedynie najblizsza INNA bryle ich
  // nie lapal — caly ten sklejony ze soba zestaw byl mimo to oderwany od
  // reszty maszyny, co widac dopiero na pelnym obrazie (zrzut ekranu), nie
  // w tej pojedynczej asercji.
  const FLOAT_EPS = 0.004;
  const floating = [];
  for (const p of K.parts) {
    let best = Infinity, who = '';
    for (const q of K.parts) {
      if (q === p) continue;
      const g = gapOf(obb(p), obb(q));
      if (g < best) { best = g; who = q.name; }
    }
    if (best > FLOAT_EPS) floating.push({ czesc: p.name, najblizej: who, szczelina: +best.toFixed(4) });
  }
  t('H5', '(H5) ŻADNA bryła nie wisi w powietrzu — każda dotyka innej (pełny skan par)',
    K.parts.length > 30 && floating.length === 0, floating.slice(0, 6));

  // H6 — MASZYNA STOI NA ZIEMI i stoi STABILNIE: minY dokladnie 0 (klasa bledu
  // „stopy pod terenem" z T7/T8, tu w wydaniu kolowym — 14-katna obrecz siegala
  // 0.0022 pod teren), a punkty styku rozlozone w Z, nie na jednej linii.
  const ground = K.parts.filter((p) => botY(p) < 0.0005);
  const gz = ground.map((p) => p.pos[2]);
  const spanZ = gz.length ? Math.max(...gz) - Math.min(...gz) : 0;
  t('H6', '(H6) maszyna stoi NA ziemi (minY = 0.0000) i na podparciu rozłożonym w Z, nie na jednej linii',
    Math.abs(K.minY) < 0.0005 && ground.length >= 3 && spanZ > 0.10,
    { minY: +K.minY.toFixed(5), punkty_styku: ground.map((p) => p.name), rozpietosc_Z: +spanZ.toFixed(4) });

  // H7 — WIDOCZNOSC Z JEDYNEJ KAMERY GRY. Prog dolny bierze sie z RODZINY
  // mierzonej w tym samym renderze: barwa wlasciciela Taranu okutego i Wiezy.
  // Lina kolowrotu miala tu ZERO i to bylo znalezisko T11, nie zalozenie.
  const ownerRef = Math.min(pix.ref_taranOkuty_owner.vis, pix.ref_wieza_owner.vis);
  const mustSee = ['arm', 'stone', 'sling', 'skein', 'pad', 'wheel', 'winch', 'trigger', 'ropeL', 'ropeR'];
  const zero = mustSee.filter((k) => !pix[k] || pix[k].vis <= 0);
  t('H7', '(H7) KAŻDA istotna część ma niezerowy ślad na ekranie z kamery gry; barwa właściciela w paśmie rodziny',
    zero.length === 0 && pix.arm.vis > 400 && pix.stone.vis > 60
    && pix.owner.vis > ownerRef * 0.5 && pix.owner.vis < ownerRef * 2.0,
    { zerowe: zero, piksele: Object.fromEntries(mustSee.concat(['owner']).map((k) => [k, pix[k] && pix[k].vis])),
      rodzina_owner: { taranOkuty: pix.ref_taranOkuty_owner.vis, wieza: pix.ref_wieza_owner.vis } });

  // H8 — SKALA RODZINY, mierzona rzutem z kamery gry, nie bounding boxem:
  // Katapulta ma czytac sie jak MACHINA, nie jak piechota. Pasmo bierze sie
  // z trzech pozostalych machin i dwoch jednostek pieszych w TYM renderze.
  const siegePx = SIEGE_REF.map((u) => sil[u.key].px);
  const footPx = FOOT_REF.map((u) => sil[u.key].px);
  const siegeH = SIEGE_REF.map((u) => sil[u.key].hPx);
  const kPx = sil.kat.px, kH = sil.kat.hPx;
  // PROG WYSOKOSCI EKRANOWEJ JEST OSTRY I NIEDOPASOWANY DO WYNIKU: Katapulta
  // ma byc na ekranie CO NAJMNIEJ tak wysoka jak NAJNIZSZA machina rodziny
  // (Wieza oblezicza, 217 px). To granica z rodziny, nie z sufitu — i to ona
  // lapie stan sprzed T11, ktory mial 209 px, czyli byl NAJNIZSZYM z szesciu
  // mierzonych modeli. Pasmo pola rzutu jest kontrola drugiego rzedu (szersze,
  // bo pole zalezy tez od glebokosci maszyny, ktora kamera skraca).
  t('H8', '(H8) sylwetka z kamery gry NIE niższa od najniższej machiny rodziny i wyraźnie powyżej piechoty',
    kH >= Math.min(...siegeH) && kH < Math.max(...siegeH) * 1.15
    && kPx > Math.max(...footPx) * 1.10 && kPx < Math.max(...siegePx) * 1.15,
    { katapulta: { px: kPx, h: kH }, oblezicze: siegePx, piesze: footPx, wys_oblezicze: siegeH });

  // H9 — NEUTRALNOSC KULTUROWA I SYMETRIA BARWY (units.json: Kultura=null,
  // Nacja=""). PRZED T11 barwa wlasciciela byla POJEDYNCZA banderola po
  // stronie +X — token mial „strone". Barwa musi byc parzysta i lustrzana.
  const ownerParts = K.parts.filter((p) => p.isOwner);
  const mirrored = ownerParts.every((p) => ownerParts.some((q) =>
    q !== p && Math.abs(q.pos[0] + p.pos[0]) < 0.001
    && Math.abs(q.pos[1] - p.pos[1]) < 0.001 && Math.abs(q.pos[2] - p.pos[2]) < 0.001));
  // Dopasowanie po CZLONACH nazwy, nie po podciagu: „kt-arm-winch-eye" to
  // UCHO liny, a nie oko — podciag „eye" dawal falszywy alarm.
  const CULTURE_TOK = new Set(['crest', 'plume', 'torc', 'helmet', 'beard', 'hair',
    'totem', 'emblem', 'godlo', 'feather', 'skull', 'horn', 'face', 'mask', 'banner']);
  const kulturowe = K.names.filter((x) => x.split('-').some((tok) => CULTURE_TOK.has(tok)));
  const katRow = unitRows.find((r) => String(r['Jednostka']) === 'Katapulta');
  t('H9', '(H9) model kulturowo NEUTRALNY, barwa właściciela parzysta i lustrzana wobec osi X',
    ownerParts.length >= 4 && ownerParts.length % 2 === 0 && mirrored
    && kulturowe.length === 0
    && !!katRow && katRow['Kultura'] === null && String(katRow['Nacja']) === '',
    { owner_mesh: ownerParts.length, lustro: mirrored, nazwy_kulturowe: kulturowe,
      json: katRow ? { Kultura: katRow['Kultura'], Nacja: katRow['Nacja'] } : null });

  // H10 — TYP MACHINY: ONAGER, czyli JEDNO ramie. Dwa ramiona to balista,
  // ktora strzela torem plaskim i nie umie „lobu nad murem" z units.json.
  // Sprawdzane razem z danymi jednostki, zeby typ nie byl deklaracja w kodzie.
  const armCount = K.names.filter((x) => x === 'kt-arm' || /^kt-arm-second/.test(x)).length;
  const uwagi = katRow ? String(katRow['Uwagi']) : '';
  t('H10', '(H10) typ = ONAGER: dokładnie JEDNO ramię + kamień kulisty, zgodnie z „lob nad murem" w units.json',
    A.machineType === 'onager' && armCount === 1
    && !!stone && stone.geoType === 'SphereGeometry'
    && /lob nad murem/.test(uwagi) && Number(katRow['Atak dystansowy']) > 0,
    { machineType: A.machineType, ramion: armCount, kamien: stone && stone.geoType, uwagi_json: uwagi.slice(0, 60) });

  // H11 — MIERZALNOSC: kazdy mesh NAZWANY, prefiks jednolity, anchors pelne.
  // To warunek istnienia calego tego testu — 0/11 przed T11.
  const badPrefix = K.names.filter((x) => x.indexOf('kt-') !== 0);
  const ANCHOR_KEYS = ['hexR', 'machineType', 'pivot', 'armDir', 'armLen', 'armDeg', 'armTip',
                       'hook', 'winchEye', 'stopPad', 'frameTopY', 'wheelR', 'stoneR', 'skeinR'];
  const brakKotwic = ANCHOR_KEYS.filter((k) => A[k] === undefined);
  t('H11', '(H11) wszystkie bryły NAZWANE prefiksem kt- i model niesie komplet anchors (warunek mierzalności)',
    K.named === K.meshCount && K.meshCount >= 40 && badPrefix.length === 0 && brakKotwic.length === 0,
    { mesh: K.meshCount, nazwane: K.named, zly_prefiks: badPrefix, brak_kotwic: brakKotwic });

  // H12 — DISPATCH: „Katapulta"/„Catapult" trafia do buildCatapult, a rdzenie
  // dopasowania sa w units.json JEDNOZNACZNE (sprawdzone w danych, nie zalozone).
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const kolizje = unitRows.filter((r) =>
    ['Jednostka', 'Nazwa EN'].some((k) => norm(r[k]).includes('katapult') || norm(r[k]).includes('catapult')));
  const enSame = m.kat_en && m.kat_en.meshCount === K.meshCount;
  t('H12', '(H12) dispatch PL i EN prowadzi do buildCatapult, a rdzenie „katapult"/„catapult" są w units.json unikalne',
    /if \(n\.includes\('katapulta'\) \|\| n\.includes\('catapult'\)\) return buildCatapult\(ownerColor_\);/.test(src.units)
    && kolizje.length === 1 && enSame,
    { kolizje: kolizje.map((r) => r['Jednostka']), en_mesh: m.kat_en && m.kat_en.meshCount, pl_mesh: K.meshCount });

  // H13 — ZERO REGRESJI SASIADOW. Trzy pozostale machiny musza wyjsc z T11
  // BEZ ZMIAN; ich liczby mesh i wysokosci to stan zastany, mierzony tu, nie
  // przepisany. Chroni przed rozlaniem rdzenia dispatchu na sasiada.
  const sasiedzi = SIEGE_REF.map((u) => ({ key: u.key, mesh: m[u.key].meshCount, h: +m[u.key].height.toFixed(4) }));
  const rozne = sasiedzi.filter((r) => r.mesh === K.meshCount);
  t('H13', '(H13) Taran, Taran okuty i Wieża oblężnicza NIE zostały przechwycone przez dispatch Katapulty',
    rozne.length === 0 && sasiedzi.every((r) => r.mesh > 40),
    { sasiedzi, katapulta_mesh: K.meshCount });

  // H14 — SEKCJA HISTORYCZNA NIESIE KONKRET, nie sam naglowek. Kazdy punkt
  // K1-K9 musi zawierac dajaca sie sprawdzic lokalizacje albo dane z units.json.
  const KS = [
    ['K1:lob',        /K1\. TYP MACHINY[\s\S]{0,900}lob nad murem/],
    ['K2:chronologia', /K2\. CHRONOLOGIA[\s\S]{0,700}Ammianus Marcellinus[\s\S]{0,200}IV w\. n\.e\./],
    ['K3:witruwiusz', /K3\. NAZWA[\s\S]{0,500}Witruwiusza[\s\S]{0,300}X\.10[\s\S]{0,120}X\.11/],
    ['K4:modul',      /K4\. KANON PROPORCJI[\s\S]{0,500}X\.10\.1[\s\S]{0,600}X\.11\.2/],
    ['K5:rama',       /K5\. RAMA I SKRĘT — Ammianus XXIII\.4\.4/],
    ['K6:proca',      /K6\. RAMIĘ I PROCA — Ammianus XXIII\.4\.4–5/],
    ['K7:poduszka',   /K7\. PODUSZKA UDERZENIOWA — Ammianus XXIII\.4\.5/],
    ['K8:spust',      /K8\. POZA SPOCZYNKOWA[\s\S]{0,400}XXIII\.4\.6/],
    ['K9:neutralnosc', /K9\. NEUTRALNOŚĆ KULTUROWA[\s\S]{0,400}Kultura": null/],
  ];
  const brakK = KS.filter(([, re]) => !re.test(src.units)).map(([id]) => id);
  t('H14', '(H14) sekcja ZGODNOŚĆ HISTORYCZNA K1-K9 niesie sprawdzalne lokalizacje źródeł, nie same nagłówki',
    brakK.length === 0, { brak: brakK });

  // H15 — POZA NAPIETA JEST SPOJNA: ramie odciagniete KU TYLOWI (−Z) i w GORE,
  // a lina kolowrotu ciagnie je w TE SAMA strone (od bebna z tylu). Sworzen
  // spustu faktycznie przechodzi przez tarcze i wchodzi w koziol (Amm. XXIII.4.6).
  const dir = Array.isArray(A.armDir) ? A.armDir : [0, 0, 0];
  const bolt = n['kt-trigger-bolt'], ratchet = n['kt-windlass-ratchet'], blk = n['kt-windlass-block-left'];
  const ropeBackward = drum && eye ? (drum.pos[2] < eye.pos[2]) : false;
  const armTip = Array.isArray(A.armTip) ? A.armTip : null;
  t('H15', '(H15) poza NAPIĘTA spójna: ramię odciągnięte ku tyłowi i w górę, lina ciągnie w tę samą stronę, sworzeń spustu założony',
    dir[2] < -0.2 && dir[1] > 0.2 && ropeBackward
    && !!armTip && armTip[2] < pivot[2] && armTip[1] > pivot[1]
    && satDepth(obb(bolt), obb(ratchet)) > 0.002 && satDepth(obb(bolt), obb(blk)) > 0.002,
    { armDir: dir.map((x) => +x.toFixed(4)), lina_ku_tylowi: ropeBackward,
      sworzen_x_tarcza: +satDepth(obb(bolt), obb(ratchet)).toFixed(4),
      sworzen_x_koziol: +satDepth(obb(bolt), obb(blk)).toFixed(4) });

  return res;
}

async function main() {
  const src = { units: fs.readFileSync(UNITS_TS, 'utf8') };
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
  check('(M0) kazda z ' + MUTATIONS.length + ' mutacji trafila w DOKLADNIE JEDNO miejsce w zrodle',
    bad.length === 0, bad.map((g) => g.mut.id + ' applied=' + g.stat.applied + ' ' + g.stat.bad.join(',')));
  if (bad.length > 0) {
    console.log('\nPRZERWANE: nie da sie odtworzyc stanu sprzed poprawki — kod sie przesunal, popraw MUTATIONS.');
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1240, height: 520 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function loadBundle(file) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
    await page.addScriptTag({ path: file });
  }

  /** Pomiar geometrii — argumenty przekazane jawnie, bez zmiennych z domkniecia. */
  async function measure(pg) {
    return pg.evaluate(({ all, katEn, katCat, owner }) => {
      const THREE = window.__THREE;
      const B = window.__buildUnitModel;
      function dump(g) {
        g.updateMatrixWorld(true);
        const parts = []; const names = [];
        let meshCount = 0, named = 0, ownerMeshes = 0;
        let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxR = 0;
        const v = new THREE.Vector3();
        g.traverse((o) => {
          if (!o.isMesh) return;
          meshCount++;
          if (o.material && o.material.color && o.material.color.getHex() === owner) ownerMeshes++;
          const geo = o.geometry;
          if (!geo.boundingBox) geo.computeBoundingBox();
          const bb = geo.boundingBox;
          for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) {
            v.set(cx, cy, cz).applyMatrix4(o.matrixWorld);
            if (v.y < minY) minY = v.y;
            if (v.y > maxY) maxY = v.y;
            if (v.x < minX) minX = v.x;
            if (v.x > maxX) maxX = v.x;
            if (v.z < minZ) minZ = v.z;
            if (v.z > maxZ) maxZ = v.z;
            const r = Math.hypot(v.x, v.z);
            if (r > maxR) maxR = r;
          }
          if (!o.name) return;
          named++; names.push(o.name);
          const wp = new THREE.Vector3(); o.getWorldPosition(wp);
          const q = new THREE.Quaternion(); o.getWorldQuaternion(q);
          const ax = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(q).toArray();
          parts.push({
            name: o.name, geoType: geo.type,
            localMin: [bb.min.x, bb.min.y, bb.min.z], localMax: [bb.max.x, bb.max.y, bb.max.z],
            pos: wp.toArray(), axX: ax(1, 0, 0), axY: ax(0, 1, 0), axZ: ax(0, 0, 1),
            isOwner: !!(o.material && o.material.color && o.material.color.getHex() === owner),
          });
        });
        return {
          meshCount, named, names, parts, ownerMeshes,
          minY, maxY, minX, maxX, minZ, maxZ, maxR, height: maxY - minY,
          anchors: g.userData['anchors'] || null,
          matCount: Array.isArray(g.userData['mats']) ? g.userData['mats'].length : -1,
        };
      }
      const out = {};
      for (const u of all) out[u.key] = dump(B(u.cat, owner, u.pl));
      out.kat_en = dump(B(katCat, owner, katEn));
      return out;
    }, { all: [KAT].concat(SIEGE_REF).concat(FOOT_REF), katEn: KAT.en, katCat: KAT.cat, owner: OWNER });
  }

  const SHOT_SET = [['Katapulta', 'katapulta'], ['Taran okuty', 'taran'],
                    ['Wieża oblężnicza', 'wieza'], ['Hastati', 'miecznik']];
  const SHOT = async (file) => {
    await page.evaluate(({ set, owner }) => {
      const THREE = window.__THREE;
      const B = window.__buildUnitModel;
      document.body.innerHTML = '';
      const W = 1240, H = 520, halfW = (set.length * 0.95) / 2 + 0.15;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setClearColor(0x6f8f5f, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 0.78));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.05); d1.position.set(2, 4, 3); scene.add(d1);
      const el = 52 * Math.PI / 180;                 // KAMERA GRY (camera.ts)
      const cols = [owner, 0xcc4422, 0x22aa55, 0xddaa22];
      set.forEach((p, i) => {
        const g = B(p[1], cols[i % 4], p[0]);
        g.position.x = (i - (set.length - 1) / 2) * 0.95;
        scene.add(g);
      });
      const cy = 0.24, halfH = halfW * H / W;
      const cam = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.01, 20);
      cam.position.set(0, cy + 6 * Math.sin(el), 6 * Math.cos(el));
      cam.lookAt(0, cy, 0);
      renderer.render(scene, cam);
      window.__ready = true;
    }, { set: SHOT_SET, owner: OWNER });
    await page.waitForFunction('window.__ready === true');
    await page.screenshot({ path: file });
    await page.evaluate(() => { window.__ready = false; });
  };

  const matrix = [];
  try {
    console.log('\n--- (H) pomiar PO audycie (bundel z niezmienionych zrodel) ---');
    await loadBundle(BUNDLE_PO);
    const after = await measure(page);
    const pixAfter = await measurePixels(page);
    const silAfter = await measureSilhouette(page);
    assertGeometry(after, pixAfter, silAfter, src, unitRows, false);

    console.log('  [wymiary] Katapulta: mesh ' + after.kat.meshCount
      + ' | H ' + after.kat.height.toFixed(4)
      + ' | X ±' + after.kat.maxX.toFixed(4)
      + ' | Z [' + after.kat.minZ.toFixed(4) + ',' + after.kat.maxZ.toFixed(4) + ']'
      + ' | maxR ' + after.kat.maxR.toFixed(4));
    console.log('  [rodzina] ' + SIEGE_REF.concat(FOOT_REF).map((u) =>
      u.pl + ': mesh ' + after[u.key].meshCount + '/H ' + after[u.key].height.toFixed(3)).join(' | '));
    console.log('  [sylwetka px] ' + Object.entries(silAfter).map(([k, v]) => k + '=' + v.px + '/' + v.hPx).join(' '));
    console.log('  [piksele czesci] ' + Object.entries(pixAfter).map(([k, v]) => k + '=' + v.vis).join(' '));

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await SHOT(path.join(SHOTS, 'po-katapulta-kamera-gry.png'));
    }

    console.log('\n--- (M) MACIERZ ABLACYJNA: jedna mutacja = jedno miejsce = jedna asercja ---');
    const base = assertGeometry(after, pixAfter, silAfter, src, unitRows, true);
    matrix.push({ label: 'BAZA'.padEnd(5) + ' (bez mutacji)'.padEnd(66), res: base });
    for (const g of bundles) {
      await loadBundle(g.out);
      // mutacje K* dotykaja tylko komentarza — geometria bez zmian, zrodlo inne
      const srcMut = { units: src.units.split(g.mut.from).join(g.mut.to) };
      const mm = await measure(page);
      const pp = await measurePixels(page);
      const ss = await measureSilhouette(page);
      matrix.push({
        label: g.mut.id.padEnd(5) + ' ' + g.mut.opis.slice(0, 64).padEnd(66),
        res: assertGeometry(mm, pp, ss, srcMut, unitRows, true), mut: g.mut,
      });
      if (SHOTS !== null && (g.mut.id === 'M1' || g.mut.id === 'M2' || g.mut.id === 'M7')) {
        await SHOT(path.join(SHOTS, 'przed-' + g.mut.id + '.png'));
      }
    }
    const ids = base.map((r) => r.id);
    console.log('       '.padEnd(72) + ids.map((i) => i.padEnd(6)).join(''));
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
    check('(M1) KAZDA z H1-H' + ids.length + ' czerwienieje pod SWOJA pojedyncza mutacja — (H) nie jest tautologia',
      nieNosne.length === 0, { nienosne: nieNosne });
    check('(M2) na niezmienionym zrodle WSZYSTKIE asercje (H) sa zielone (baza macierzy)',
      base.every((r) => r.cond), base.filter((r) => !r.cond).map((r) => r.id));

    check('(F0) zero bledow konsoli/JS we wszystkich renderach', pageErrors.length === 0, pageErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  // --- (G) artefakt PRODUKCYJNY vite build (C-001) ---------------------------
  if (!SKIP_VITE) {
    let distDir = DIST_ARG !== null ? path.dirname(DIST_ARG) : null;
    if (distDir === null) {
      distDir = path.join(os.tmpdir(), `civ-zelazo-t11-render-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', distDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
    }
    const collect = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return collect(p);
      return /\.(html|js|css)$/.test(e.name) ? [fs.readFileSync(p, 'utf8')] : [];
    });
    const built = collect(distDir).join('\n');
    check('(G1) artefakt vite build niesie rdzen dispatchu tematu', /catapult/i.test(built) && /katapulta/i.test(built));
    // Stale liczbowe NIE nadaja sie na kotwice: vite minifikuje `0.056` do `.056`
    // i skleja z setkami innych liczb. Kotwica sa NAZWY MESH, ktore istnieja
    // WYLACZNIE w kodzie dodanym w T11 i sa w zrodle pelnymi literalami
    // (nie sklejane z prefiksu), wiec przezywaja minifikacje w calosci.
    const T11_ONLY = ['kt-skein-bundle', 'kt-skein-washer-', 'kt-arm-heel', 'kt-arm-hook',
                      'kt-arm-winch-eye', 'kt-sling-pouch', 'kt-sling-cord-', 'kt-stone',
                      'kt-stop-pad', 'kt-stop-beam', 'kt-windlass-drum', 'kt-windlass-ratchet',
                      'kt-trigger-bolt', 'kt-winch-rope-', 'kt-owner-panel-', 'kt-frame-sill-front'];
    const brak = T11_ONLY.filter((x) => !built.includes(x));
    check('(G2) artefakt vite build niesie czesci dodane w T11 (naprawa jest w produkcji)',
      brak.length === 0, { brak });
    // G3 NIE moze byc negacja komentarza — minifikacja i tak usuwa komentarze,
    // wiec taka asercja bylaby zawsze zielona (tautologia). Nie moze tez byc
    // samym slowem „onager": sprawdzone grepem, wystepuje ono takze
    // w battle/battleScene.ts i battle/testBattle.ts (predykaty pociskow),
    // wiec trafiloby do artefaktu nawet bez zmiany T11. Kotwica sa KLUCZE
    // anchors, ktore w calym repo istnieja WYLACZNIE w buildCatapult po T11:
    // `machineType`, `winchEye`, `skeinR`. Drugie ramie ('kt-arm-second')
    // istnieje wylacznie w mutacji M10 i w artefakcie wystapic NIE MOZE.
    const T11_KEYS = ['machineType', 'winchEye', 'skeinR'];
    const brakKluczy = T11_KEYS.filter((x) => !built.includes(x));
    check('(G3) artefakt vite build niesie kotwice typu machiny z T11 i NIE ma drugiego ramienia',
      brakKluczy.length === 0 && /onager/.test(built) && !/kt-arm-second/.test(built),
      { brak_kluczy: brakKluczy });
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominieta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch (_) {}

  console.log('\nzelazo-katapulta-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
