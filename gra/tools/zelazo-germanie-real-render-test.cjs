'use strict';
/**
 * zelazo-germanie-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T8 — audyt dwoch jednostek germanskich:
 * **Berserker germanski** i **Wojownik germanski** (SUPER).
 *   `gra/src/render/jednostki-z3-plemiona.ts` — buildBerserker, buildGermanSuper
 *   `gra/src/render/units.ts`                 — WYLACZNIE linie dispatchu
 *
 * ZGLOSZENIE. Zaden z tych dwoch modeli nie nazywal ANI JEDNEGO mesh przed T8
 * (zmierzone: 0/23 Berserker, 0/37 Wojownik germanski) i zaden nie mial
 * `userData.anchors` — ta sama przyczyna, dla ktorej z1-mezopotamia (T5),
 * z2-srodziemnomorze (T6) i p6-super (T7) nie byly sprawdzone przez wczesniejsze
 * tematy serii. Bez nazw zadna asercja nie moze zaadresowac czesci, a punkty
 * odniesienia musialyby byc wpisane liczbowo w test — czyli test mierzylby
 * sam siebie.
 *
 * DLACZEGO PRAWDZIWA PRZEGLADARKA (R-PROC-AUTOBOT.md §9 poz. 6a): to sa modele
 * 3D (Three.js). Dwa z pieciu defektow Berserkera sa NIEWIDOCZNE bez policzenia,
 * ile pikseli danej czesci widac z kamery gry — oczy istnialy w geometrii
 * i mialy ZERO pikseli na ekranie.
 *
 * KAMERA GRY: `src/render/camera.ts` — staly azymut 0 (yaw nie zmienia sie
 * nigdy), elewacja 52 stopnie. Kierunek patrzenia (0; -sin52; -cos52). Baza
 * plaszczyzny obrazu: poziom (1;0;0), pion (0; cos52; -sin52).
 *
 * PROGI BIORA SIE Z RODZINY, NIE Z SUFITU. Modele odniesienia to Falangita
 * (naprawiona w T3), Thorakites (T6) oraz Triari i Hastati (T7) — wszystkie
 * zaakceptowane, wszystkie mierzone W TYM SAMYM RENDERZE co para T8, nie
 * z pamieci:
 *   - bron w RAMIENIU reki uzbrojonej: 0.0000 (styk z piescia i przedramieniem
 *     to CHWYT i jest dozwolony — w rodzinie 0.0335 / 0.0093-0.0218),
 *   - widocznosc broni (rzut ekranowy / dlugosc wlasna): dory Falangity 0.8946,
 *   - widocznosc twarzy w pikselach: Thorakites 14 (oczy), Falangita 6
 *     (szczelina helmu), Triari 336 (zarost).
 *
 * DOWOD NIETAUTOLOGICZNOSCI — MACIERZ ABLACYJNA, POJEDYNCZA MUTACJA NA ASERCJE
 * (standard serii ustalony przez Evaluatora T4, utrzymany w T5, T6 i T7): kazdy
 * bundel M* rozni sie od zrodla DOKLADNIE JEDNYM podmienionym miejscem (M0
 * pilnuje tego mechanicznie). Egzekwowana asercja jest w kierunku PER-H, nie
 * PER-M: KAZDA z H1-H16 ma co najmniej JEDNA mutacje, ktora ja SAMA czerwieni
 * (patrz (M1) nizej) — nie znaczy to, ze kazda mutacja czerwieni WYLACZNIE
 * jedna asercje; kilka (np. M1, M10, M16) w praktyce czerwieni kilka H naraz,
 * bo dotyka geometrii, od ktorej zalezy wiecej niz jedna asercja (pelna
 * macierz jest drukowana ponizej, nic nie jest ukryte). Wiekszosc mutacji
 * odtwarza doslowny stan sprzed audytu T8.
 *
 * Usage (z gra/): node tools/zelazo-germanie-real-render-test.cjs
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
  console.error('[zelazo-germanie-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-germanie-entry.ts');
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
const OUTDIR = path.resolve(os.tmpdir(), `civ-zelazo-t8-bundles-${TMPDIR_RUN_ID}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const Z3_TS = path.resolve(GRA, 'src', 'render', 'jednostki-z3-plemiona.ts');
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

// ── para tematu + jej prefiksy mesh ────────────────────────────────────────
const UNITS = [
  { key: 'bers', pl: 'Berserker germański', en: 'Germanic Berserker', pf: 'bs', cat: 'miecznik' },
  { key: 'gsup', pl: 'Wojownik germański',  en: 'Germanic Warrior',   pf: 'gw', cat: 'super' },
];
// Modele ODNIESIENIA — zaakceptowane, poza zakresem T8, mierzone w tym samym
// renderze. Nie wolno ich zmieniac; sluza za skale i za kontrole regresji.
const REF = [
  { key: 'falanga',    pl: 'Falanga',           cat: 'falangita', pf: 'falangita' },
  { key: 'thorakites', pl: 'Thorakites',        cat: 'wlocznik',  pf: 'th' },
  { key: 'triari',     pl: 'Triari',            cat: 'super',     pf: 'tr' },
  { key: 'hastati',    pl: 'Hastati',           cat: 'miecznik',  pf: 'ha' },
];
// SASIEDZI Z TEGO SAMEGO PLIKU — poza zakresem T8 (tematy T9/T10). To, czego
// ta asercja pilnowala i pilnuje nadal, to JEDNO: nazewnictwo wprowadzone
// w T8 NIE WYLALO SIE na sasiadow — zaden z nich nie ma mesh o prefiksie
// `bs-` ani `gw-`.
//
// `own` = prefiks WLASNYCH nazw sasiada, albo null, gdy sasiad nie zostal
// jeszcze zaudytowany i ma miec 0 nazwanych mesh. T10 zaudytowal Druzynnika
// (`dr-`) i iButho (`ib-`); T9 zaudytowal Miecznika galijskiego (`mg-`) —
// wszyscy troje maja juz komplet wlasnych nazw i wlasne `anchors`. Liczby
// `mesh`/`maxY` sa domyslnie null dla sasiadow po audycie, bo audyt MOZE
// zmienic ich bryle — ale gdy da sie DOWIESC, ze konkretna liczba przetrwala
// audyt bez zmiany (zmierzone niezaleznie w Final Control T10: Druzynnik
// mial mesh=32, maxY=0.6540 zarowno przed, jak i po T10), pin zostaje
// przywrocony zamiast skasowany: to jedyne dokladne przypiecie geometrii tej
// jednostki w calej bramce T8. iButho zmienil sie realnie (odroznialnosc od
// Impi 0.370→0.589, sylwetka 3.5%→18.8%), wiec dla niego `null` jest
// uzasadnione i zostaje. Miecznik galijski po T9: mesh=44, maxY=0.7410
// (przed T9: 35/0.7230, zmierzone bez nazw).
const SIBLINGS = [
  { key: 'druz',   pl: 'Drużynnik',        cat: 'miecznik', own: 'dr-', mesh: 32, maxY: 0.6540 },
  { key: 'ibutho', pl: 'iButho z iklwa',   cat: 'wlocznik', own: 'ib-', mesh: null, maxY: null },
  { key: 'galij',  pl: 'Miecznik galijski', cat: 'miecznik', own: 'mg-', mesh: 44, maxY: 0.7410 },
];

/**
 * (M) MACIERZ ABLACYJNA — jedna mutacja = jedno miejsce = jedna asercja.
 * `cel` mowi, KTORA asercja ma sie zaczerwienic; `plik` — w ktorym zrodle
 * podmiana ma trafic w DOKLADNIE jedno wystapienie.
 */
const MUTATIONS = [
  { id: 'M1', cel: 'H1', plik: Z3_TS,
    opis: 'toporzysko Berserkera zakotwiczone w torsie zamiast w dloni',
    from: '  haft.position.copy(armR.wrist.clone().addScaledVector(ax, 0.095 * HEX_R));',
    to:   '  haft.position.set(0, TR_TORSO_CTR, 0);' },

  { id: 'M2', cel: 'H2', plik: Z3_TS,
    opis: 'framea z powrotem DOKLADNIE po osi przedramienia (stan mierzony w toku T8)',
    from: '  const TH_W = -2.763;',
    to:   '  const TH_W = TH_ARM;' },

  { id: 'M3', cel: 'H3', plik: Z3_TS,
    opis: 'topor Berserkera odsuniety obok reki — stan sprzed T8 (dlon mija bron)',
    from: '  haft.name = PF + \'-axe-haft\';',
    to:   '  haft.position.x -= 0.060 * HEX_R;\n  haft.name = PF + \'-axe-haft\';' },

  { id: 'M4', cel: 'H4', plik: Z3_TS,
    opis: 'leb wilka nasuniety na twarz — klasa bledu sprzed T8 (0 pikseli oczu)',
    from: '  hood.position.set(0, TR_HEAD_TOP, 0);',
    to:   '  hood.position.set(0, TR_HEAD_CTR + 0.020 * HEX_R, 0.030 * HEX_R);' },

  { id: 'M5', cel: 'H5', plik: Z3_TS,
    opis: 'oczy podniesione ponad dolna krawedz kaptura (odwrotna strona tej samej relacji)',
    from: '      eye.position.set(sx * 0.028 * HEX_R, TR_HEAD_CTR + 0.008 * HEX_R, TR_HEAD_S * 0.5 + 0.004 * HEX_R);',
    to:   '      eye.position.set(sx * 0.028 * HEX_R, TR_HEAD_CTR + 0.040 * HEX_R, TR_HEAD_S * 0.5 + 0.004 * HEX_R);' },

  { id: 'M6', cel: 'H6', plik: Z3_TS,
    opis: 'stopy rodziny Z3 wpuszczone pod teren (klasa bledu Berserkera sprzed T8)',
    from: '  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);',
    to:   '  foot.position.set(sx, 0.010 * HEX_R, P.z + 0.016 * HEX_R);' },

  { id: 'M7', cel: 'H7', plik: Z3_TS,
    opis: 'reka Berserkera wyprostowana jak kij — stan sprzed T8 (klasa bledu T1)',
    from: '  const armR = trBuildArm(group, -TR_SHLD_X, -2.05, TH_R, mSkin, mSkin, mSkin, PF, \'right\');',
    to:   '  const armR = trBuildArm(group, -TR_SHLD_X, TH_R, TH_R, mSkin, mSkin, mSkin, PF, \'right\');' },

  { id: 'M8', cel: 'H8', plik: Z3_TS,
    opis: 'Berserker dostaje tarcze wbrew Pancerz=0 w units.json',
    from: '  trBuildArm(group, TR_SHLD_X, 1.05, 0.55, mSkin, mSkin, mSkin, PF, \'left\');',
    to:   '  const armLx = trBuildArm(group, TR_SHLD_X, 1.05, 0.55, mSkin, mSkin, mSkin, PF, \'left\');\n'
        + '  const shX = new THREE.Mesh(getGTRRndFace(), mOwner);\n'
        + '  shX.rotation.x = Math.PI / 2;\n'
        + '  shX.position.copy(armLx.wrist);\n'
        + '  shX.name = PF + \'-shield-face\';\n'
        + '  group.add(shX);' },

  { id: 'M9', cel: 'H9', plik: Z3_TS,
    opis: 'barwnik Berserkera w kolorze skory — z figurki znika KAZDY piksel koloru gracza',
    from: '    const paint = new THREE.Mesh(getGTRWarPaint(), mOwner);',
    to:   '    const paint = new THREE.Mesh(getGTRWarPaint(), mLeath);' },

  { id: 'M10', cel: 'H10', plik: Z3_TS,
    opis: 'drzewce framei przemianowane na klinge miecza — sylwetka traci bron miotana',
    from: '  shaft.name = PF + \'-framea-shaft\';',
    to:   '  shaft.name = PF + \'-sword-blade\';' },

  { id: 'M11', cel: 'H11', plik: Z3_TS,
    opis: 'framea chwycona przy pietce jak miecz — drzewce nie wystaje za dlon',
    from: '  shaft.position.copy(grip.clone().addScaledVector(wx, 0.055 * HEX_R));',
    to:   '  shaft.position.copy(grip.clone().addScaledVector(wx, 0.170 * HEX_R));' },

  { id: 'M12', cel: 'H12', plik: Z3_TS,
    opis: 'grot framei o proporcjach dlugiej klingi (przeciwienstwo „angusto et brevi ferro")',
    from: '  const head = new THREE.Mesh(getGTRFrameaHead(), mIron);',
    to:   '  const head = new THREE.Mesh(getGTRLongBlade(), mIron);' },

  { id: 'M13', cel: 'H13', plik: Z3_TS,
    opis: 'framea polozona WZDLUZ osi patrzenia kamery gry (klasa bledu T6/A1)',
    from: '  const TH_W = -2.763;\n  const wx = trDirDown(TH_W);',
    to:   '  const TH_W = 2.20;\n  const wx = trDirDown(TH_W);' },

  { id: 'M14', cel: 'H14', plik: Z3_TS,
    opis: 'tarcza Wojownika germanskiego obrocona tylem do kamery gry (klasa bledu T2)',
    from: '  sh.rotation.y = -0.20;\n  const face = new THREE.Mesh(getGTRRndFace(), mOwner);   // pole = KOLOR GRACZA',
    to:   '  sh.rotation.y = Math.PI - 0.20;\n  const face = new THREE.Mesh(getGTRRndFace(), mOwner);   // pole = KOLOR GRACZA' },

  { id: 'M15', cel: 'H15', plik: Z3_TS,
    opis: 'drzewce choragwi supera przelozone na tor framei (klasa bledu T7/A?, Hieros Lochos)',
    from: '  trSuperBanner(group, mPole, mOwner, mGold, PF, +1);',
    to:   '  trSuperBanner(group, mPole, mOwner, mGold, PF, +1);\n'
        + '  const polX = new THREE.Mesh(getGTRPole(), mPole);\n'
        + '  polX.position.copy(shaft.position);\n'
        + '  polX.name = PF + \'-banner-pole-alt\';\n'
        + '  group.add(polX);' },

  { id: 'M16', cel: 'H16', plik: UNITS_TS,
    opis: 'Berserker dispatchowany do modelu Wojownika germanskiego — dwie jednostki, jedna figurka',
    from: 'if (n.includes(\'berserker germansk\') || n.includes(\'berserk\')) return buildBerserkerZ3(ownerColor_);',
    to:   'if (n.includes(\'berserker germansk\') || n.includes(\'berserk\')) return buildGermanSuper(ownerColor_);' },
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
    console.log('[zelazo-germanie-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
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
// moze z niczym kolidowac. Mutacja usuwajaca NAZWE mesh (np. M10) nie ma
// wywracac calej macierzy — ma zaczerwienic swoja asercje. Kazda asercja,
// dla ktorej brak czesci jest sam w sobie bledem, sprawdza obecnosc JAWNIE.
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
function distPointLine(P, A, D) {
  const w = sub(P, A); const t = dot(w, D);
  return vlen(sub(P, [A[0] + D[0] * t, A[1] + D[1] * t, A[2] + D[2] * t]));
}
const byName = (m) => { const o = {}; for (const p of m.parts) if (p.name) o[p.name] = p; return o; };
/** Skrajna wartosc Y bryly OBB — pelny rzut polwymiarow na os swiata Y. */
const halfY = (p) => [0, 1, 2].reduce((s, i) =>
  s + (p.localMax[i] - p.localMin[i]) / 2 * Math.abs([p.axX, p.axY, p.axZ][i][1]), 0);
const topY = (p) => (p ? p.pos[1] + halfY(p) : NaN);
const botY = (p) => (p ? p.pos[1] - halfY(p) : NaN);
const sizeOf = (p) => (p ? [0, 1, 2].map((i) => p.localMax[i] - p.localMin[i]) : null);

// kierunek patrzenia kamery gry i baza jej plaszczyzny obrazu (camera.ts)
const EL = 52 * Math.PI / 180;
const CAM_VIEW = [0, -Math.sin(EL), -Math.cos(EL)];
const toImg = (p) => [p[0], p[1] * Math.cos(EL) - p[2] * Math.sin(EL)];

/** Widocznosc lamanej broni: dlugosc NA EKRANIE / dlugosc WLASNA w 3D. */
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

// ── zestawy czesci adresowane po NAZWIE (biora sie z modelu, nie z tabelki) ─
// CIALO na potrzeby H1. Reka UZBROJONA (prawa piesc i przedramie) jest
// wylaczona swiadomie — jej styk z bronia to CHWYT, pilnowany osobno w H2.
// Lewa reka i prawe RAMIE zostaja w zbiorze: tam bron byc nie ma prawa.
// Uwaga na `-head$`: pasuje takze do `bs-axe-head` i `gw-framea-head`, dlatego
// zbior czesci broni jest z ciala odejmowany JAWNIE, a nie przez regexp.
const BODY_RE = /-(torso|neck|head|jaw|eye-[a-z]+|hair|beard|beard-braid-[a-z]+|loincloth|belt|skirt|strap|pelt-cape|warpaint-[a-z]+|fur-pad-[a-z]+|wolf-(hood|snout|ear-[a-z]+)|helmet-[a-z]+|leg-(left|right)-(thigh|shin|foot)|arm-left-(upper|fore|fist)|arm-right-upper)$/;
const WEAPON = {
  bers: ['bs-axe-haft', 'bs-axe-head'],
  gsup: ['gw-framea-shaft', 'gw-framea-socket', 'gw-framea-head'],
};
const WEAPON_MAIN = { bers: 'bs-axe-haft', gsup: 'gw-framea-shaft' };
const WEAPON_CHAIN = {
  bers: ['bs-arm-right-fist', 'bs-axe-haft', 'bs-axe-head'],
  gsup: ['gw-arm-right-fist', 'gw-framea-shaft', 'gw-framea-socket', 'gw-framea-head'],
};
const KOLIZJA_PROG = 0.006;
// Prog odroznialnosci: 0.558 to WYNIK naprawy T6 dla pary elita/liniowa
// i tak uzyl go T7 — liczba z rodziny, nie z sufitu. Obowiazuje BEZ WYJATKU
// dla kazdej pary z udzialem jednostki T8. Uwaga na kontekst przy czytaniu
// wypisu [odroznialnosc]: pary z Miecznikiem galijskim byly na `main` w chwili
// T8 PONIZEJ tego progu (galij/Druzynnik 0.509, galij/Hastati 0.526) — byl to
// stan zastany, ktorego T8 nie dotykal. Zaudytowal go i podniosl dopiero T9
// (galij/Druzynnik 0.608, galij/Hastati 0.640, mierzone tam).
const PROG_PARA = 0.558;

/** Pomiar w zywym Three.js: OBB + osie + kotwice dla kazdej nazwanej czesci. */
async function measureAll(page) {
  return page.evaluate(({ units, refs, siblings, owner }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    function dump(g) {
      g.updateMatrixWorld(true);
      const parts = []; const names = [];
      let meshCount = 0, minY = Infinity, maxY = -Infinity, maxR = 0, ownerMeshes = 0;
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
        meshCount, names, parts, minY, maxY, maxR, height: maxY - minY, ownerMeshes,
        anchors: g.userData['anchors'] || null,
        matCount: Array.isArray(g.userData['mats']) ? g.userData['mats'].length : -1,
      };
    }
    const out = { generic: {} };
    for (const u of units) {
      out[u.key] = dump(B(u.cat, owner, u.pl));
      out[u.key + '_en'] = dump(B(u.cat, owner, u.en));
    }
    for (const r of refs) out[r.key] = dump(B(r.cat, owner, r.pl));
    for (const s of siblings) out[s.key] = dump(B(s.cat, owner, s.pl));
    out.generic.super = dump(B('super', owner));
    out.generic.miecznik = dump(B('miecznik', owner));
    out.generic.wlocznik = dump(B('wlocznik', owner));
    return out;
  }, { units: UNITS, refs: REF, siblings: SIBLINGS, owner: OWNER });
}

/**
 * WIDOCZNOSC CZESCI Z KAMERY GRY, w PIKSELACH i z testem glebi GPU. Wybrane
 * mesh dostaja jednolity wyroznik, reszta modelu plaski ciemny material;
 * liczymy piksele wyroznika po renderze. To jedyny sposob odroznic „element
 * istnieje w 3D" od „element widac na ekranie" — oczy Berserkera przechodzily
 * kazdy test geometryczny i mialy ZERO pikseli.
 */
async function measurePixels(page) {
  return page.evaluate(({ owner, sets }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 384, el = 52 * Math.PI / 180;
    // `sel` = prefiks nazwy mesh; `byColor` = tint po KOLORZE materialu
    // (uzywane dla koloru gracza, ktory nie jest zwiazany z jedna nazwa).
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
      { id: 'bers_eyes',   cat: 'miecznik', pl: 'Berserker germański', sel: 'bs-eye-' },
      { id: 'bers_axe',    cat: 'miecznik', pl: 'Berserker germański', sel: 'bs-axe-' },
      { id: 'bers_wolf',   cat: 'miecznik', pl: 'Berserker germański', sel: 'bs-wolf-' },
      { id: 'bers_owner',  cat: 'miecznik', pl: 'Berserker germański', sel: '', byColor: true },
      { id: 'gsup_framea', cat: 'super',    pl: 'Wojownik germański',  sel: 'gw-framea-' },
      { id: 'gsup_grot',   cat: 'super',    pl: 'Wojownik germański',  sel: 'gw-framea-head' },
      { id: 'gsup_beard',  cat: 'super',    pl: 'Wojownik germański',  sel: 'gw-beard' },
      { id: 'gsup_owner',  cat: 'super',    pl: 'Wojownik germański',  sel: '', byColor: true },
      { id: 'ref_thorak_eyes', cat: 'wlocznik',  pl: 'Thorakites', sel: 'th-eye-' },
      { id: 'ref_falanga_slit', cat: 'falangita', pl: 'Falanga',   sel: 'falangita-helmet-slit' },
      { id: 'ref_triari_beard', cat: 'super',     pl: 'Triari',    sel: 'tr-beard' },
    ],
  });
}

/**
 * ODROZNIALNOSC z KAMERY GRY — piksele, nie binarna sylwetka (metoda T5/T6/T7):
 * udzial pikseli rozniacych sie pokryciem albo barwa o >=40/255 w sumie obrysow
 * pary. Kontrola miary: ten sam model porownany sam ze soba musi dac ~0.
 */
async function pixelDistinctness(page) {
  return page.evaluate(({ all, owner }) => {
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
      s.add(B(cat, owner, name));
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
  }, { all: UNITS.concat(REF).concat(SIBLINGS), owner: OWNER });
}

// ═══ ASERCJE H1-H16 — kazda ma swoja POJEDYNCZA mutacje M1-M16 ═════════════
function assertGeometry(m, pix, dist, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };
  const nb = byName(m.bers), ng = byName(m.gsup);

  // H1 — BRON nie tkwi w CIELE (klasa T1/T3/T5). Reka uzbrojona wylaczona:
  // styk piesci i przedramienia z bronia to CHWYT, progi rodziny w H2.
  const h1 = [];
  for (const u of UNITS) {
    const mm = m[u.key];
    const bron = new Set(WEAPON[u.key]);
    const body = mm.parts.filter((p) => BODY_RE.test(p.name) && !bron.has(p.name));
    for (const wn of WEAPON[u.key]) {
      const w = byName(mm)[wn];
      if (!w) { h1.push({ u: u.key, brak: wn }); continue; }
      for (const b of body) {
        const d = satDepth(obb(w), obb(b));
        if (d > KOLIZJA_PROG) h1.push({ u: u.key, w: wn, b: b.name, d: +d.toFixed(4) });
      }
    }
  }
  t('H1', '(H1) ZADNA bron nie przenika ciala wlasnej figurki (2 jednostki, pelny SAT)', h1.length === 0, h1);

  // H2 — BRON nie przenika RAMIENIA reki uzbrojonej. Ten sam blad naprawiono
  // w T3 dla Falangity, a T7 znalazl jego kopie u Hieros Lochos. Progi
  // BIORA SIE Z RODZINY, mierzonej w tym samym renderze.
  const armPen = {};
  let brakCzesci = false;
  for (const u of UNITS) {
    const n = byName(m[u.key]);
    const w = n[WEAPON_MAIN[u.key]], up = n[u.pf + '-arm-right-upper'];
    if (!w || !up) { brakCzesci = true; armPen[u.key] = NaN; continue; }
    armPen[u.key] = +satDepth(obb(w), obb(up)).toFixed(4);
  }
  const nf = byName(m.falanga), nt = byName(m.thorakites);
  armPen.falangita = +satDepth(obb(nf['falangita-dory-shaft']), obb(nf['falangita-arm-right-upper'])).toFixed(4);
  armPen.thorakites = +satDepth(obb(nt['th-spear-shaft']), obb(nt['th-arm-right-upper'])).toFixed(4);
  // chwyt (piesc) MUSI istniec i miescic sie w pasmie rodziny — bron ani nie
  // mija dloni, ani nie tonie w niej na wylot
  const fistPen = {};
  for (const u of UNITS) {
    const n = byName(m[u.key]);
    const w = n[WEAPON_MAIN[u.key]], fi = n[u.pf + '-arm-right-fist'];
    if (!w || !fi) { brakCzesci = true; fistPen[u.key] = NaN; continue; }
    fistPen[u.key] = +satDepth(obb(w), obb(fi)).toFixed(4);
  }
  fistPen.falangita = +satDepth(obb(nf['falangita-dory-shaft']), obb(nf['falangita-arm-right-fist'])).toFixed(4);
  fistPen.thorakites = +satDepth(obb(nt['th-spear-shaft']), obb(nt['th-arm-right-fist'])).toFixed(4);
  t('H2', '(H2) bron NIE przenika ramienia reki uzbrojonej — 0.0000 jak Falangita (T3) i Thorakites (T6); chwyt w pasmie rodziny',
    !brakCzesci
    && UNITS.every((u) => armPen[u.key] === 0) && armPen.falangita === 0 && armPen.thorakites === 0
    && UNITS.every((u) => fistPen[u.key] > 0.015 && fistPen[u.key] < 0.045),
    { ramie: armPen, piesc: fistPen, brak_czesci: brakCzesci });

  // H3 — CHWYT BERSERKERA: dlon LEZY NA OSI toporzyska. Przed T8 lezala
  // 0.0487 od niej i nie dotykala broni w ogole (SAT = 0.0000).
  const bFist = nb['bs-arm-right-fist'], bHaft = nb['bs-axe-haft'];
  const bOff = (bFist && bHaft) ? distPointLine(bFist.pos, bHaft.pos, unit(bHaft.axY)) : NaN;
  t('H3', '(H3) dlon Berserkera lezy NA OSI toporzyska (<0.030 x HEX_R) — trzyma topor, nie mija go',
    Number.isFinite(bOff) && bOff < 0.030, { odleglosc: +(bOff || 0).toFixed(4), przed_T8: 0.0487 });

  // H4 — OCZY BERSERKERA widoczne z kamery gry. Przed T8: 0 pikseli.
  t('H4', '(H4) oczy Berserkera widoczne z kamery gry (>= progu rodziny: Thorakites)',
    m.bers.names.filter((n) => /^bs-eye-/.test(n)).length === 2
    && pix.bers_eyes.tinted === 2 && pix.bers_eyes.vis >= pix.ref_thorak_eyes.vis,
    { berserker: pix.bers_eyes.vis, thorakites_T6: pix.ref_thorak_eyes.vis,
      falangita_szczelina: pix.ref_falanga_slit.vis, przed_T8: 0 });

  // H5 — PRZYCZYNA, NIE SKUTEK: dolna krawedz lba wilka lezy POWYZEJ gornej
  // krawedzi oka. Wzorzec relacji: naprawa montefortino Evocatiego w T7.
  const hoodBot = nb['bs-wolf-hood'] ? botY(nb['bs-wolf-hood']) : NaN;
  const eyeTop = nb['bs-eye-left'] ? topY(nb['bs-eye-left']) : NaN;
  t('H5', '(H5) dolna krawedz lba wilka lezy POWYZEJ gornej krawedzi oka (nie polyka twarzy)',
    Number.isFinite(hoodBot) && Number.isFinite(eyeTop) && hoodBot > eyeTop
    && satDepth(obb(nb['bs-wolf-hood']), obb(nb['bs-eye-left'])) === 0
    && satDepth(obb(nb['bs-wolf-snout']), obb(nb['bs-eye-left'])) === 0,
    { kaptur_dol: +hoodBot.toFixed(4), oko_gora: +eyeTop.toFixed(4),
      przed_T8: { kaptur_dol: 0.4900, oko_gora: 0.5325 } });

  // H6 — STOPY NA TERENIE. Cala rodzina ma minY = 0.0000; Berserker mial -0.0005.
  const minYs = {};
  for (const u of UNITS) minYs[u.key] = +m[u.key].minY.toFixed(4);
  for (const r of REF) minYs[r.key] = +m[r.key].minY.toFixed(4);
  t('H6', '(H6) zadna z dwoch jednostek T8 nie schodzi ponizej plaszczyzny terenu (minY >= 0)',
    UNITS.every((u) => minYs[u.key] >= 0), { minY: minYs, berserker_przed_T8: -0.0005 });

  // H7 — LOKCIE ZGIETE (klasa bledu T1: reka prosta jak kij). Przed T8 obie
  // osie ramion Berserkera wynosily (0, 1, 0) — rece zwisaly pionowo.
  const bends = {};
  for (const u of UNITS) for (const side of ['right', 'left']) {
    const n = byName(m[u.key]);
    const up = n[u.pf + '-arm-' + side + '-upper'], fo = n[u.pf + '-arm-' + side + '-fore'];
    bends[u.key + ':' + side] = (up && fo)
      ? +Math.acos(Math.max(-1, Math.min(1, dot(up.axY, fo.axY)))).toFixed(3) : NaN;
  }
  t('H7', '(H7) KAZDY z czterech lokci obu jednostek jest ZGIETY (>0.30 rad)',
    Object.values(bends).every((v) => Number.isFinite(v) && v > 0.30), bends);

  // H8 — PANCERZ = 0 W DANYCH => ZERO tarczy, helmu i zbroi w modelu.
  const zbroja = m.bers.names.filter((n) => /shield|helmet|mail|cuirass|armou?r|greave|boss/.test(n));
  t('H8', '(H8) Berserker NIE ma tarczy, helmu ani zbroi — zgodnie z Pancerz=0 w units.json',
    zbroja.length === 0 && m.bers.anchors !== null
    && m.bers.anchors.shieldKind === 'none' && m.bers.anchors.helmetKind === 'none'
    && m.bers.anchors.armorKind === 'none',
    { mesh_zbroi: zbroja, anchors: m.bers.anchors && {
      shieldKind: m.bers.anchors.shieldKind, helmetKind: m.bers.anchors.helmetKind,
      armorKind: m.bers.anchors.armorKind } });

  // H9 — KOLOR GRACZA JEST NA FIGURCE I WIDAC GO. Berserker nie ma tarczy,
  // wiec nosnikiem jest barwnik na piersi; gdyby go zabraklo, jednostka nie
  // mialaby ANI JEDNEGO piksela barwy wlasciciela.
  t('H9', '(H9) kolor gracza obecny i WIDOCZNY z kamery gry u OBU jednostek (Berserker nosi go na barwniku, nie na tarczy)',
    m.bers.ownerMeshes >= 1 && pix.bers_owner.tinted >= 1 && pix.bers_owner.vis > 0
    && m.gsup.ownerMeshes >= 1 && pix.gsup_owner.tinted >= 1 && pix.gsup_owner.vis > 0,
    { berserker: { mesh: m.bers.ownerMeshes, piksele: pix.bers_owner.vis },
      wojownik: { mesh: m.gsup.ownerMeshes, piksele: pix.gsup_owner.vis } });

  // H10 — FRAMEA ISTNIEJE, MIECZA NIE MA. units.json: Atak dystansowy = 4,
  // Zasieg 2, Ilosc pociskow 4, Uwagi mowia wprost o framei. Przed T8 model
  // niosl dlugi miecz i ZADNEJ broni miotanej.
  const framea = m.gsup.names.filter((n) => /^gw-framea-/.test(n));
  const miecz = m.gsup.names.filter((n) => /sword|blade/.test(n));
  t('H10', '(H10) Wojownik germanski ma FRAMEA (drzewce+tulejka+grot) i ZADNEGO miecza — nosnik Ataku dystansowego 4',
    framea.length === 3 && miecz.length === 0
    && m.gsup.anchors !== null && m.gsup.anchors.missileKind === 'framea'
    && m.gsup.anchors.weaponKind === 'spear-framea',
    { framea, miecz, anchors: m.gsup.anchors && m.gsup.anchors.missileKind });

  // H11 — CHWYT DO RZUTU, NIE DO CIECIA: drzewce wystaje TAKZE ZA dlon.
  // Miecz zaczyna sie przy dloni i idzie wylacznie do przodu.
  const gShaft = ng['gw-framea-shaft'], gFist = ng['gw-arm-right-fist'];
  let zaDlonia = NaN, przedDlonia = NaN, dlugosc = NaN;
  if (gShaft && gFist) {
    const axw = unit(gShaft.axY);
    dlugosc = sizeOf(gShaft)[1];
    const tt = dot(sub(gFist.pos, gShaft.pos), axw);   // dlon wzgledem srodka drzewca
    zaDlonia = dlugosc / 2 + tt; przedDlonia = dlugosc / 2 - tt;
  }
  t('H11', '(H11) framea trzymana w punkcie ROWNOWAGI — drzewce wystaje za dlon (chwyt do rzutu, nie do ciecia)',
    Number.isFinite(zaDlonia) && zaDlonia > 0.060 && przedDlonia > zaDlonia,
    { za_dlonia: +(zaDlonia || 0).toFixed(4), przed_dlonia: +(przedDlonia || 0).toFixed(4),
      dlugosc: +(dlugosc || 0).toFixed(4) });

  // H12 — GROT „ANGUSTO ET BREVI FERRO" (Tacyt, Germania 6): WASKI i KROTKI.
  // Odniesienie bierze sie z TEGO SAMEGO PLIKU — dluga klinga celtycka
  // (getGTRLongBlade) uzywana przez Miecznika galijskiego; T9 zmienil jego poze,
  // ale NIE dlugosc klingi, wiec liczba 0.210 nadal jest wlasciwa.
  const grot = sizeOf(ng['gw-framea-head']);
  t('H12', '(H12) grot framei jest WASKI I KROTKI — krotszy niz 1/2 dlugiej klingi z tego samego pliku (0.210)',
    grot !== null && grot[1] < 0.105 && grot[0] < 0.030 && grot[2] < 0.020
    && grot[1] > grot[0] && grot[1] > grot[2],
    { grot: grot && grot.map((x) => +x.toFixed(4)), dluga_klinga_getGTRLongBlade: [0.026, 0.210, 0.013] });

  // H13 — WIDOCZNOSC BRONI z kamery gry (klasa bledu T6/A1). Prog to 0.60
  // widocznosci dory Falangity policzonej W TYM SAMYM renderze.
  const visF = weaponVisibility(m.falanga, ['falangita-arm-right-fist', 'falangita-dory-shaft', 'falangita-dory-tip']).vis;
  const vis = {}, scr = {};
  for (const u of UNITS) {
    const w = weaponVisibility(m[u.key], WEAPON_CHAIN[u.key]);
    vis[u.key] = +w.vis.toFixed(3); scr[u.key] = +w.screen.toFixed(4);
  }
  t('H13', '(H13) bron OBU jednostek widoczna z kamery gry (>=0.60 widocznosci dory Falangity z T3)',
    Number.isFinite(visF) && UNITS.every((u) => Number.isFinite(vis[u.key]) && vis[u.key] >= 0.60 * visF),
    { falangita: +visF.toFixed(3), prog: +(0.60 * visF).toFixed(3), widocznosc: vis, dlugosc_ekranowa: scr });

  // H14 — POLE TARCZY w kolorze gracza zwrocone DO kamery (klasa bledu T2).
  // Os normalnej BIERZE SIE Z MODELU (`anchors.shieldKind`), nie z tabelki.
  const gFace = ng['gw-shield-face'];
  const kind = m.gsup.anchors && m.gsup.anchors.shieldKind;
  const dotFace = (gFace && kind === 'round-germanic') ? +dot(gFace.axY, CAM_VIEW).toFixed(3) : NaN;
  t('H14', '(H14) pole tarczy Wojownika germanskiego zwrocone DO kamery gry (klasa bledu T2)',
    Number.isFinite(dotFace) && dotFace < -0.30, { dot: dotFace, shieldKind: kind });

  // H15 — BRON nie przebija wlasnej CHORAGWI SUPER (znacznika elity) i stoi po
  // PRZECIWNEJ stronie figurki. T7 naprawil dokladnie to u Hieros Lochos,
  // przenoszac choragiew na strone tarczowa; kopia w tym pliku parametru `side`
  // nie miala. Rozdzielenie stron jest tu konieczne takze EKRANOWO: obie bryly
  // leza w plaszczyznie YZ, wiec obie rzutuja sie na linie PIONOWE i stojac po
  // tej samej stronie daja dwa nakladajace sie slupy z kamery gry.
  const h15 = [];
  const bannery = m.gsup.parts.filter((p) => /-banner-/.test(p.name));
  for (const wn of WEAPON.gsup) {
    if (!ng[wn]) { h15.push({ brak: wn }); continue; }
    for (const b of bannery) {
      const d = satDepth(obb(ng[wn]), obb(b));
      if (d > 0) h15.push({ w: wn, b: b.name, d: +d.toFixed(4) });
    }
  }
  const bronX = ng['gw-framea-shaft'] ? ng['gw-framea-shaft'].pos[0] : NaN;
  const banX = bannery.length ? bannery.reduce((s, p) => s + p.pos[0], 0) / bannery.length : NaN;
  t('H15', '(H15) framea NIE przebija wlasnej choragwi SUPER (SAT 0.0000) i stoi po PRZECIWNEJ stronie figurki',
    h15.length === 0 && bannery.length === 3
    && Number.isFinite(bronX) && Number.isFinite(banX) && bronX * banX < 0,
    { kolizje: h15, czesci_choragwi: bannery.length,
      bron_x: +(bronX || 0).toFixed(3), choragiew_x: +(banX || 0).toFixed(3) });

  // H16 — ODROZNIALNOSC: dwie jednostki T8 nie sa jedna figurka, i zadna z nich
  // nie zlewa sie z modelem odniesienia ani z sasiadem z tego samego pliku.
  const par = (a, b2) => dist.pairs.find((p) => (p.a === a && p.b === b2) || (p.a === b2 && p.b === a));
  const paraT8 = par('bers', 'gsup');
  const zT8 = dist.pairs.filter((p) => ['bers', 'gsup'].includes(p.a) || ['bers', 'gsup'].includes(p.b));
  const ponizej = zT8.filter((p) => p.d < PROG_PARA);
  t('H16', '(H16) Berserker i Wojownik germanski to DWIE rozne figurki (>=0.558), a kazda para z modelem odniesienia trzyma prog rodziny',
    dist.same < 0.01 && paraT8 && paraT8.d >= PROG_PARA && ponizej.length === 0,
    { kontrola_ten_sam_model: +dist.same.toFixed(4),
      bers_gsup: paraT8 && +paraT8.d.toFixed(3),
      ponizej_progu: ponizej.map((p) => p.a + '/' + p.b + '=' + p.d.toFixed(3)) });

  if (!soft) {
    console.log('  [relacje] widocznosc broni=' + JSON.stringify(vis) + ' (Falangita T3=' + visF.toFixed(3) + ')'
      + ' | bron w ramieniu=' + JSON.stringify(armPen) + ' | chwyt w piesci=' + JSON.stringify(fistPen)
      + ' | lokcie=' + JSON.stringify(bends) + ' | minY=' + JSON.stringify(minYs)
      + ' | piksele=' + JSON.stringify(Object.fromEntries(Object.entries(pix).map(([k, v]) => [k, v.vis]))));
  }
  return res;
}

/** Reszta: dispatch, nazwy, kotwice, proporcje, brak regresji, dane, sekcje K. */
function assertRest(m, pix, dist, src, unitRows) {
  // --- (D) DISPATCH: nazwa PL i EN trafia we WLASNY model, nie w generyka ----
  for (const u of UNITS) {
    const a = m[u.key], g = m.generic[u.cat];
    // Kryterium NIE jest „inna liczba mesh" — rozstrzyga to, ze wszystkie
    // czesci maja nazwe z prefiksem jednostki, a generyk nie nazywa ANI JEDNEJ.
    check('(D:' + u.key + ') „' + u.pl + '" (PL) buduje wlasny model, nie generyk `' + u.cat + '`',
      a.names.length === a.meshCount && a.names.every((n) => n.startsWith(u.pf + '-'))
      && g.names.length === 0 && a.anchors !== null && g.anchors === null,
      { unit: a.meshCount, generic: g.meshCount, nazwane: a.names.length, generic_nazwane: g.names.length });
    const b = m[u.key + '_en'];
    check('(D:' + u.key + ':en) „' + u.en + '" (EN) trafia w TEN SAM model co nazwa PL',
      b.meshCount === a.meshCount && b.names.length === a.names.length
      && b.names.every((n) => n.startsWith(u.pf + '-')),
      { en: b.meshCount, pl: a.meshCount });
  }

  // --- (N) kazdy mesh nazwany + kotwice (warunek mozliwosci audytu) ----------
  for (const u of UNITS) {
    const mm = m[u.key];
    check('(N:' + u.key + ') KAZDY mesh ma nazwe z prefiksem `' + u.pf + '-` i grupa ma `userData.anchors`',
      mm.names.length === mm.meshCount && mm.names.every((n) => n.startsWith(u.pf + '-')) && mm.anchors !== null,
      { mesh: mm.meshCount, nazwane: mm.names.length, anchors: mm.anchors !== null });
    check('(N:' + u.key + ':unikat) nazwy czesci sa UNIKALNE (zadna nie nadpisuje adresu innej)',
      new Set(mm.names).size === mm.names.length,
      mm.names.filter((n, i) => mm.names.indexOf(n) !== i));
    check('(N:' + u.key + ':kotwice) kotwice niosa rodzaj tarczy, rodzaj broni i punkt chwytu',
      mm.anchors !== null && typeof mm.anchors.shieldKind === 'string'
      && typeof mm.anchors.weaponKind === 'string' && Array.isArray(mm.anchors.grip),
      mm.anchors && { shieldKind: mm.anchors.shieldKind, weaponKind: mm.anchors.weaponKind });
  }

  // --- (E) proporcje ---------------------------------------------------------
  for (const u of UNITS) {
    const mm = m[u.key];
    check('(E:' + u.key + ') stopy na y>=0, promien w limicie heksu (<=0.866), wysokosc 0.55-0.90 x HEX_R',
      mm.minY > -1e-9 && mm.maxR <= 0.866 && mm.height > 0.55 && mm.height < 0.90,
      { minY: +mm.minY.toFixed(4), maxR: +mm.maxR.toFixed(4), h: +mm.height.toFixed(4) });
  }

  // --- (R) BRAK REGRESJI: sasiedzi z TEGO SAMEGO PLIKU i modele T3/T6/T7 ----
  // To jest asercja pilnujaca, ze parametr nazwy z domyslna wartoscia pusta
  // faktycznie NIC nie zmienil trzem jednostkom poza zakresem T8.
  for (const s of SIBLINGS) {
    const mm = m[s.key];
    const wlasne = s.own === null
      ? (mm.names.length === 0 && mm.anchors === null)
      : (mm.names.length === mm.meshCount && mm.meshCount > 0
         && mm.names.every((n) => n.startsWith(s.own)) && mm.anchors !== null);
    check('(R:' + s.key + ') „' + s.pl + '" (poza zakresem T8) nie dostal ANI JEDNEJ nazwy `bs-`/`gw-`'
      + (s.own === null ? ' i nadal nie jest nazwany' : ' i nosi wylacznie wlasne nazwy `' + s.own + '`'),
      wlasne
      && !mm.names.some((n) => /^(bs|gw)-/.test(n))
      && (s.mesh === null || mm.meshCount === s.mesh)
      && (s.maxY === null || Math.abs(mm.maxY - s.maxY) < 0.0006),
      { mesh: mm.meshCount, oczekiwane: s.mesh, nazwane: mm.names.length,
        wlasny_prefiks: s.own, anchors: mm.anchors !== null,
        maxY: +mm.maxY.toFixed(4), oczekiwane_maxY: s.maxY });
  }
  for (const r of REF) {
    const mm = m[r.key];
    check('(R:' + r.key + ') „' + r.pl + '" (T3/T6/T7) nadal w calosci nazwany i bez nazw T8',
      mm.names.length === mm.meshCount && mm.meshCount > 0
      && mm.names.every((n) => n.startsWith(r.pf + '-'))
      && !mm.names.some((n) => /^(bs|gw)-/.test(n)),
      { mesh: mm.meshCount, nazwane: mm.names.length });
  }
  check('(R:generyki) generyki `super`/`miecznik`/`wlocznik` nietkniete (brak nazw pary T8)',
    ['super', 'miecznik', 'wlocznik'].every((k) => !m.generic[k].names.some((n) => /^(bs|gw)-/.test(n))));

  // --- (0) KOTWICE W DANYCH — model musi zgadzac sie z units.json ------------
  const row = (nm) => unitRows.find((r) => r['Jednostka'] === nm);
  {
    const be = row('Berserker germański');
    check('(0a) units.json: Berserker ma Pancerz 0 i Atak dystansowy 0 — model MUSI byc bez zbroi i bez broni miotanej',
      be && be['Pancerz'] === 0 && be['Atak dystansowy'] === 0
      && m.bers.anchors.armorKind === 'none' && m.bers.anchors.missileKind === 'none'
      && m.bers.anchors.shieldKind === 'none',
      be && { pancerz: be['Pancerz'], ad: be['Atak dystansowy'] });
    check('(0b) units.json: Uwagi Berserkera zadaja lba zwierzecia i braku tarczy — model ma leb wilka i ZERO tarczy',
      be && /łeb zwierzęcia na głowie/.test(be['Uwagi']) && /bez tarczy/.test(be['Uwagi'])
      && m.bers.names.filter((n) => /^bs-wolf-/.test(n)).length === 4
      && pix.bers_wolf.vis > 0,
      be && { wolf_mesh: m.bers.names.filter((n) => /^bs-wolf-/.test(n)).length, piksele: pix.bers_wolf.vis });
    check('(0c) units.json: Berserker NIE jest super — model nie ma choragwi-znacznika',
      be && be['Super-jednostka'] !== 'TAK' && !m.bers.names.some((n) => /-banner-/.test(n)));

    const wg = row('Wojownik germański');
    check('(0d) units.json: Wojownik germanski ma Atak dystansowy 4, zasieg 2 i 4 pociski — model MUSI miec framea',
      wg && wg['Atak dystansowy'] === 4 && wg['Zasięg ataku (hex)'] === 2
      && wg['Ilość pocisków'] === 4 && m.gsup.anchors.missileKind === 'framea',
      wg && { ad: wg['Atak dystansowy'], zasieg: wg['Zasięg ataku (hex)'], pociski: wg['Ilość pocisków'] });
    check('(0e) units.json: Uwagi Wojownika germanskiego mowia wprost o „frameą" — model niesie ja w nazwach mesh',
      wg && /frame/i.test(wg['Uwagi']) && m.gsup.names.filter((n) => /^gw-framea-/.test(n)).length === 3);
    check('(0f) units.json: Wojownik germanski JEST super — model ma choragiew-znacznik (3 czesci)',
      wg && wg['Super-jednostka'] === 'TAK'
      && m.gsup.names.filter((n) => /-banner-/.test(n)).length === 3);
    check('(0g) units.json: Wojownik germanski ma Pancerz 2 (nie 0) — model ma helm, ale NIE ma kolczugi',
      wg && wg['Pancerz'] === 2
      && m.gsup.names.some((n) => /^gw-helmet-/.test(n))
      && !m.gsup.names.some((n) => /mail|cuirass|lorica/.test(n)),
      wg && { pancerz: wg['Pancerz'] });
  }
  {
    const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[Łł]/g, 'l').toLowerCase();
    for (const core of ['berserker', 'wojownik germansk']) {
      const hits = unitRows.filter((r) => norm(r['Jednostka']).includes(core));
      check('(0h:' + core + ') rdzen dispatchu JEDNOZNACZNY w calym units.json (dokladnie 1 trafienie)',
        hits.length === 1, hits.map((r) => r['Jednostka']));
    }
  }

  // --- (K) SEKCJE HISTORYCZNE — obecnosc i KONKRET, nie sam naglowek --------
  // AKTUALIZACJA T9: warunek brzmi „OBIE jednostki T8 maja swoja sekcje", a nie
  // „w pliku sa DOKLADNIE dwie sekcje". Do T9 obie postacie dawaly ten sam
  // wynik, bo sekcje mial tylko T8; T9 dopisal trzecia (Miecznik galijski)
  // i doslowna liczba przestala opisywac to, o co ta asercja pyta.
  const naglowki = (src.z3.match(/ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(/g) || []).length;
  // `>= 2`, nie `=== 2`: plik trzyma pieciu builderow i kolejne tematy serii
  // dopisuja WLASNE sekcje historyczne (T10 dolozyl dwie — Druzynnik i iButho).
  // Rozstrzyga tu obecnosc DWOCH IMIENNYCH naglowkow T8, a nie licznik
  // wszystkich naglowkow w pliku, ktory rosnie z kazdym kolejnym audytem.
  check('(K0) plik ma sekcje ZGODNOSC HISTORYCZNA dla OBU jednostek T8',
    naglowki >= 2
    && /ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(Berserker germanski\)/.test(src.z3)
    && /ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(Wojownik germanski\)/.test(src.z3),
    { naglowkow: naglowki });
  const K = [
    ['K:bers-anachronizm',   /„Berserkr" to\s*\n?\s*\/\/\s*slowo STARONORDYCKIE|slowo STARONORDYCKIE/],
    ['K:bers-snorri',        /Ynglinga\s+saga/],
    ['K:bers-hornklofi',     /Haraldskvaedi|Hrafnsmal/],
    ['K:bers-harii',         /nigra scuta, TINCTA CORPORA/],
    ['K:bers-feralis',       /FERALIS EXERCITUS/],
    ['K:bers-nudi',          /aut NUDI aut sagulo leves/],
    ['K:bers-flagitium',     /scutum reliquisse praecipuum flagitium/],
    ['K:bers-torslunda',     /TORSLUNDA/],
    ['K:bers-hjortspring',   /HJORTSPRING/],
    ['K:bers-nie-francisca', /NIE jest to francisca/],
    ['K:bers-osterby',       /czlowiek z Osterby|Osterby, Szlezwik/],
    ['K:bers-czego-nie',     /CZEGO MODEL NIE ODWZOROWUJE/],
    ['K:gw-framea-cytat',    /ANGUSTO ET BREVI FERRO/],
    ['K:gw-comminus',        /VEL COMMINUS VEL EMINUS/],
    ['K:gw-rari-gladiis',    /RARI GLADIIS/],
    ['K:gw-illerup',         /ILLERUP ADAL/],
    ['K:gw-nydam',           /NYDAM \(Szlezwik/],
    ['K:gw-helm-cytat',      /VIX UNI ALTERIVE cassis aut galea/],
    ['K:gw-bez-rogow',       /ROGATYCH HELMOW NIE MA I NIE BEDZIE/],
    ['K:gw-scuta-coloribus', /scuta lectissimis coloribus distinguunt/],
    ['K:gw-wezel-swebski',   /insigne gentis obliquare crinem nodoque substringere/],
    ['K:gw-sagum',           /tegumen omnibus SAGUM fibula/],
    ['K:gw-plaszcz-odrzucony', /rozwazona i ODRZUCONA/],
    ['K:gw-czego-nie',       /CZEGO MODEL NIE ODWZOROWUJE I CO ZOSTAJE OTWARTE/],
    ['K:gw-rozjazd-danych',  /`Dostepna w epokach` = „Braz"/],
  ];
  for (const [id, re] of K) {
    check('(' + id + ') sekcja historyczna niesie konkret, nie sam naglowek', re.test(src.z3));
  }
  // Naglowek modelu NIE moze twierdzic czegos, czego geometria nie robi —
  // wlasnie takie zdanie („ciecie znad glowy") bylo defektem G2 tego audytu.
  check('(K:sprostowanie-naglowka) naglowek Wojownika germanskiego NIE twierdzi juz „ciecie/miecz znad glowy"',
    !/POZA: ciecie znad glowy/.test(src.z3) && !/miecz w PRAWEJ\s*\n?\s*\/\/ \(-X\) znad glowy/.test(src.z3)
    && /POZA: rzut\/pchniecie FRAMEA/.test(src.z3));
  check('(K:units-ts) units.ts faktycznie dispatchuje Berserkera do modelu z serii Z3 (podstawa naglowka)',
    /return buildBerserkerZ3\(ownerColor_\);/.test(src.units)
    && /buildBerserker as buildBerserkerZ3/.test(src.units));
}

async function main() {
  const src = {
    z3: fs.readFileSync(Z3_TS, 'utf8'),
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
  check('(M0) kazda z ' + MUTATIONS.length + ' mutacji trafila w DOKLADNIE JEDNO miejsce w zrodle',
    bad.length === 0, bad.map((g) => g.mut.id + ' applied=' + g.stat.applied + ' ' + g.stat.bad.join(',')));
  if (bad.length > 0) {
    console.log('\nPRZERWANE: nie da sie odtworzyc stanu sprzed poprawki — kod sie przesunal, popraw MUTATIONS.');
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1200, height: 560 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function loadBundle(file) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
    await page.addScriptTag({ path: file });
  }

  const SHOT_SET = UNITS.map((u) => [u.pl, u.cat])
    .concat([['Miecznik galijski', 'miecznik'], ['Falanga', 'falangita'], ['Triari', 'super']]);
  const SHOT = async (file) => {
    await page.evaluate(({ set, owner }) => {
      const THREE = window.__THREE;
      const B = window.__buildUnitModel;
      document.body.innerHTML = '';
      const W = 1200, H = 560, halfW = (set.length * 0.95) / 2 + 0.15;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setClearColor(0x6f8f5f, 1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      document.body.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 0.78));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.05); d1.position.set(2, 4, 3); scene.add(d1);
      const el = 52 * Math.PI / 180;                 // KAMERA GRY (camera.ts)
      const cols = [owner, 0xcc4422, 0x22aa55, 0xbb33bb, 0xddaa22];
      set.forEach((p, i) => {
        const g = B(p[1], cols[i % 5], p[0]);
        g.position.x = (i - (set.length - 1) / 2) * 0.95;
        scene.add(g);
      });
      const cy = 0.22, halfH = halfW * H / W;
      const cam = new THREE.OrthographicCamera(-halfW, halfW, cy + halfH, cy - halfH, 0.01, 20);
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
    console.log('\n--- (D)-(K) pomiar PO audycie (bundel z niezmienionych zrodel) ---');
    await loadBundle(BUNDLE_PO);
    const after = await measureAll(page);
    const pixAfter = await measurePixels(page);
    const distAfter = await pixelDistinctness(page);
    assertGeometry(after, pixAfter, distAfter, false);
    assertRest(after, pixAfter, distAfter, src, unitRows);
    console.log('  [odroznialnosc] kontrola „ten sam model" = ' + distAfter.same.toFixed(4)
      + ' | pary = ' + distAfter.pairs.slice().sort((a, b) => a.d - b.d)
        .map((r) => r.a + '/' + r.b + '=' + r.d.toFixed(3)).join(' '));

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await SHOT(path.join(SHOTS, 'po-germanie-kamera-gry.png'));
    }

    console.log('\n--- (M) MACIERZ ABLACYJNA: jedna mutacja = jedno miejsce = jedna asercja ---');
    const base = assertGeometry(after, pixAfter, distAfter, true);
    matrix.push({ label: 'BAZA'.padEnd(5) + ' (bez mutacji)'.padEnd(64), res: base });
    for (const g of bundles) {
      await loadBundle(g.out);
      const mm = await measureAll(page);
      const pp = await measurePixels(page);
      const dd = await pixelDistinctness(page);
      matrix.push({ label: g.mut.id.padEnd(5) + ' ' + g.mut.opis.slice(0, 62).padEnd(64), res: assertGeometry(mm, pp, dd, true), mut: g.mut });
      if (SHOTS !== null && (g.mut.id === 'M3' || g.mut.id === 'M4' || g.mut.id === 'M10')) {
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
      distDir = path.join(os.tmpdir(), `civ-zelazo-t8-render-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', distDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
    }
    const collect = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return collect(p);
      return /\.(html|js|css)$/.test(e.name) ? [fs.readFileSync(p, 'utf8')] : [];
    });
    const built = collect(distDir).join('\n');
    check('(G1) artefakt vite build niesie oba rdzenie dispatchu tematu',
      /berserk/i.test(built) && /wojownik germansk/i.test(built));
    // Stale liczbowe NIE nadaja sie na kotwice: vite minifikuje `0.055` do `.055`
    // i skleja je z setkami innych liczb. Kotwica sa nazwy mesh, ktore istnieja
    // WYLACZNIE w kodzie dodanym w T8 — jesli sa w artefakcie, znaczy ze
    // naprawiona sciezka faktycznie sie kompiluje i trafia do produkcji.
    //
    // UWAGA NA POSTAC KOTWICY (sprawdzone w artefakcie, nie zalozone): nazwy
    // powstaja jako `PF + '-czesc'`, wiec vite zostawia w bundlu SUFIKS
    // (`t+"-framea-shaft"`) i OSOBNO staly prefiks (`t="gw"`). Pelna nazwa
    // „gw-framea-shaft" NIE wystepuje w artefakcie jako jeden ciag i szukanie
    // jej dawaloby falszywy FAIL. Dlatego kotwicami sa sufiksy + oba prefiksy.
    const T8_ONLY = ['-axe-haft', '-axe-head', '-wolf-hood', '-wolf-snout', '-wolf-ear-',
                     '-warpaint-', '-pelt-cape', '-loincloth',
                     '-framea-shaft', '-framea-socket', '-framea-head'];
    const brak = T8_ONLY.filter((n) => !built.includes(n));
    const prefiksy = ['"bs"', '"gw"'].filter((n) => !built.includes(n));
    check('(G2) artefakt vite build niesie czesci dodane/naprawione w T8 (naprawa jest w produkcji)',
      brak.length === 0 && prefiksy.length === 0, { brak, brak_prefiksow: prefiksy });
    check('(G3) artefakt vite build NIE niesie juz starej sciezki miecza Wojownika germanskiego',
      !/gw-sword-blade/.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominieta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch (_) {}

  console.log('\nzelazo-germanie-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
