'use strict';
/**
 * zelazo-celtowie-miecznik-rydwan-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-AUDYT-POZOSTALE-Q1-T9 — audyt dwoch jednostek celtyckich:
 * **Miecznik galijski** i **Rydwan celtycki**.
 *   `gra/src/render/jednostki-z3-plemiona.ts` — buildMiecznikGalijski()
 *   `gra/src/render/units.ts`                 — decorateChariot() + linie dispatchu
 *
 * DLACZEGO PRAWDZIWA PRZEGLADARKA (R-PROC-AUTOBOT.md §9 poz. 6a): to sa modele
 * 3D (Three.js). Dwa z siedmiu defektow tego audytu byly NIEWIDOCZNE bez
 * policzenia, ile pikseli danej czesci widac z kamery gry — krata na braccae
 * i torques istnialy w geometrii i mialy odpowiednio 0 i 4 piksele na ekranie.
 *
 * KAMERA GRY: `src/render/camera.ts` — staly azymut 0 (yaw nie zmienia sie
 * nigdy), elewacja 52 stopnie. Kierunek patrzenia (0; -sin52; -cos52). Baza
 * plaszczyzny obrazu: poziom (1;0;0), pion (0; cos52; -sin52).
 *
 * PROGI BIORA SIE Z RODZINY, NIE Z SUFITU. Modele odniesienia (Falangita z T3,
 * Thorakites z T6, Triari i Hastati z T7, Gaesatae/Soldurii/Druzynnik z main,
 * Rydwan Kapadokijski jako JEDYNY rydwan z bespoke bryla) sa mierzone W TYM
 * SAMYM RENDERZE co para T9, nigdy z pamieci.
 *
 * JAWNA LUKA, KTOREJ TEN TEMAT NIE DOMYKA. Rydwan celtycki dzieli bryle
 * kategorii `rydwan` z mykenskim i Shang. T9 mial w allowliscie WYLACZNIE
 * `decorateChariot()`, wiec podniosl odroznialnosc pikselowa rydwanu celtyckiego
 * od mykenskiego z 0.010 (praktycznie zero) do wartosci wypisywanej nizej, ale
 * progu rodziny 0.558 tym sposobem osiagnac sie NIE DA — osiagaja go wylacznie
 * rydwany z wlasna bryla (Kapadokijski). Asercja (H19) pilnuje FAKTYCZNEJ
 * poprawy, a (H20) pilnuje, ze mykenski i Shang zostaly NIETKNIETE i nadal sa
 * wzgledem siebie nieodroznialne (0.0139) — luka jest w tescie WIDOCZNA,
 * nie schowana.
 *
 * DOWOD NIETAUTOLOGICZNOSCI — MACIERZ ABLACYJNA, POJEDYNCZA MUTACJA NA ASERCJE
 * (standard serii ustalony przez Evaluatora T4, utrzymany w T5-T8): kazdy
 * bundel M* rozni sie od zrodla DOKLADNIE JEDNYM podmienionym miejscem (M0
 * pilnuje tego mechanicznie). Egzekwowana asercja jest w kierunku PER-H:
 * KAZDA z H1-H21 ma co najmniej JEDNA mutacje, ktora ja SAMA czerwieni.
 * Wiekszosc mutacji odtwarza doslowny stan sprzed audytu T9.
 *
 * Usage (z gra/): node tools/zelazo-celtowie-miecznik-rydwan-real-render-test.cjs
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
  console.error('[zelazo-celtowie-miecznik-rydwan-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-celtowie-t9-entry.ts');
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
const OUTDIR = path.resolve(os.tmpdir(), `civ-zelazo-t9-bundles-${TMPDIR_RUN_ID}`);
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

// ── modele mierzone w kazdym renderze ──────────────────────────────────────
const GALIJ = { key: 'galij', pl: 'Miecznik galijski', en: 'Gallic Swordsman', pf: 'mg', cat: 'miecznik' };
const RYDC  = { key: 'rydC',  pl: 'Rydwan celtycki',   en: 'Celtic Chariot',   pf: 'rc', cat: 'rydwan' };
// Modele ODNIESIENIA — zaakceptowane, poza zakresem T9. Nie wolno ich zmieniac.
const REF = [
  { key: 'falanga',    pl: 'Falanga',    cat: 'falangita', pf: 'falangita' },
  { key: 'thorakites', pl: 'Thorakites', cat: 'wlocznik',  pf: 'th' },
  { key: 'triari',     pl: 'Triari',     cat: 'super',     pf: 'tr' },
  { key: 'hastati',    pl: 'Hastati',    cat: 'legionista', pf: 'ha' },
];
// SASIEDZI, wobec ktorych mierzymy odroznialnosc Miecznika galijskiego.
const SASIEDZI = [
  { key: 'gaesatae', pl: 'Gaesatae',  cat: 'miecznik' },
  { key: 'soldurii', pl: 'Soldurii',  cat: 'miecznik' },
  { key: 'druz',     pl: 'Drużynnik', cat: 'miecznik' },
];
// RYDWANY: mykenski i Shang MUSZA wyjsc z T9 bez zmian; Kapadokijski jest
// jedynym rydwanem z bespoke bryla i sluzy za skale „co osiaga wlasna bryla".
const RYDWANY = [
  { key: 'rydM', pl: 'Rydwan mykeński', cat: 'rydwan' },
  { key: 'rydS', pl: 'Rydwan Shang',    cat: 'rydwan' },
  { key: 'rydKap', pl: 'Rydwan Kapadokijski', cat: 'rydwan' },
];
// Stan mykenskiego/Shang zmierzony na `main` PRZED T9 — pin regresji.
const RYD_PRZED_T9 = { mesh: 97, minY: 0, maxY: 0.6694, maxR: 0.8163 };
const RYD_DEKOR_PRZED_T9 = { tarcza: [0.15, 0.2, 0.12], boss: [0.162, 0.2, 0.12] };
const PROG_PARA = 0.558;     // prog rodziny (T6 -> T7 -> T8), pary PIESZE
const KOLIZJA_PROG = 0.006;
const MONTAZ_PROG = 0.012;   // dozwolone zaglebienie MONTAZOWE czesci T9 w bryle

/**
 * (M) MACIERZ ABLACYJNA — jedna mutacja = jedno miejsce = jedna asercja.
 */
const MUTATIONS = [
  { id: 'M1', cel: 'H1', plik: Z3_TS,
    opis: 'klinga Miecznika zakotwiczona w torsie zamiast w dloni',
    from: '  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.140 * HEX_R));\n  blade.name',
    to:   '  blade.position.set(0, TR_TORSO_CTR, 0);\n  blade.name' },

  { id: 'M2', cel: 'H2', plik: Z3_TS,
    opis: 'klinga cofnieta w ramie reki uzbrojonej (bron w barku)',
    from: '  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.140 * HEX_R));\n  blade.name',
    to:   '  blade.position.copy(armR.wrist.clone().addScaledVector(ax, -0.155 * HEX_R));\n  blade.name' },

  { id: 'M3', cel: 'H3', plik: Z3_TS,
    opis: 'klinga polozona WZDLUZ osi patrzenia kamery gry (klasa bledu T6/A1)',
    from: '  const TH_ARM = -1.85, TH_SWORD = -2.35;\n  const armR = trBuildArm',
    to:   '  const TH_ARM = -1.85, TH_SWORD = -0.665;\n  const armR = trBuildArm' },

  { id: 'M4', cel: 'H4', plik: Z3_TS,
    opis: 'krata braccae z powrotem na udach z przesunieciem w osi swiata Z (stan sprzed T9: 0 pikseli)',
    from: '    pionU.name = PF + \'-braccae-stripe-thigh-\' + side;',
    to:   '    pionU.position.copy(leg.thighCtr.clone().add(new THREE.Vector3(0, 0, 0.033 * HEX_R)));\n'
        + '    pionL.position.copy(leg.thighCtr.clone().add(new THREE.Vector3(0, 0, 0.033 * HEX_R)));\n'
        + '    bandL.position.copy(leg.thighCtr);\n'
        + '    bandU.position.copy(leg.thighCtr);\n'
        + '    pionU.name = PF + \'-braccae-stripe-thigh-\' + side;' },

  { id: 'M5', cel: 'H5', plik: Z3_TS,
    opis: 'torques z powrotem w polowie szyi, pod broda (stan sprzed T9: 4 piksele)',
    from: '  torc.position.set(0, TR_TORSO_TOP + 0.002 * HEX_R, 0.012 * HEX_R);',
    to:   '  torc.position.set(0, TR_TORSO_TOP + TR_NECK_H * 0.5, 0.004 * HEX_R);' },

  { id: 'M6', cel: 'H6', plik: Z3_TS,
    opis: 'guz helmu usuniety — kita znow nie ma na czym siedziec (stan sprzed T9)',
    from: '  knob.name = PF + \'-helmet-knob\';\n  group.add(knob);\n',
    to:   '  knob.name = PF + \'-helmet-knob\';\n' },

  { id: 'M7', cel: 'H7', plik: Z3_TS,
    opis: 'Miecznik bez oczu (stan sprzed T9)',
    from: '  trCore(group, mat, mTunic, TR_SKIN, true, PF);',
    to:   '  trCore(group, mat, mTunic, TR_SKIN, false, PF);' },

  { id: 'M8', cel: 'H8', plik: Z3_TS,
    opis: 'stopy rodziny Z3 wpuszczone pod teren',
    from: '  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);',
    to:   '  foot.position.set(sx, 0.010 * HEX_R, P.z + 0.016 * HEX_R);' },

  { id: 'M9', cel: 'H9', plik: Z3_TS,
    opis: 'reka z mieczem wyprostowana jak kij (klasa bledu T1)',
    from: '  const armR = trBuildArm(group, -TR_SHLD_X, TH_ARM, TH_SWORD, mTunic, mSkin, mLeath, PF, \'right\');',
    to:   '  const armR = trBuildArm(group, -TR_SHLD_X, TH_SWORD, TH_SWORD, mTunic, mSkin, mLeath, PF, \'right\');' },

  { id: 'M10', cel: 'H10', plik: Z3_TS,
    opis: 'tarcza owalna Miecznika obrocona tylem do kamery gry (klasa bledu T2)',
    from: '  sh.rotation.y = -0.22;\n  const shell = new THREE.Mesh(getGTROvalShell(), mLeath);',
    to:   '  sh.rotation.y = Math.PI - 0.22;\n  const shell = new THREE.Mesh(getGTROvalShell(), mLeath);' },

  { id: 'M11', cel: 'H11', plik: Z3_TS,
    opis: 'poza z powrotem PCHNIECIEM zamiast ciecia (stan sprzed T9)',
    from: '  const TH_ARM = -1.85, TH_SWORD = -2.35;',
    to:   '  const TH_ARM = -1.85, TH_SWORD = 1.46;' },

  { id: 'M12', cel: 'H12', plik: Z3_TS,
    opis: 'CALA poza mieczowa cofnieta do pozy Druzynnika (0.95/1.50) — dwie jednostki, jedna sylwetka',
    from: '  const TH_ARM = -1.85, TH_SWORD = -2.35;\n  const armR',
    to:   '  const TH_ARM = 0.95, TH_SWORD = 1.50;\n  const armR' },

  { id: 'M13', cel: 'H13', plik: Z3_TS,
    opis: 'pole tarczy Miecznika w skorze zamiast w kolorze gracza — znika kazdy piksel barwy wlasciciela',
    from: '  const face = new THREE.Mesh(getGTROvalFace(), mOwner);    // POLE = KOLOR GRACZA',
    to:   '  const face = new THREE.Mesh(getGTROvalFace(), mLeath);    // POLE = KOLOR GRACZA' },

  { id: 'M14', cel: 'H14', plik: UNITS_TS,
    opis: 'tarcza rydwanu z powrotem wisi w powietrzu przed skrzynia (stan sprzed T9)',
    from: '    const SH_X = 0.078 * HEX_R, SH_Y = 0.185 * HEX_R, SH_Z = 0.0695 * HEX_R;',
    to:   '    const SH_X = 0.150 * HEX_R, SH_Y = 0.200 * HEX_R, SH_Z = 0.1200 * HEX_R;' },

  { id: 'M15', cel: 'H15', plik: UNITS_TS,
    opis: 'pole tarczy rydwanu z powrotem KRAWEDZIA do kamery gry (stan sprzed T9: iloczyn skalarny 0.000)',
    from: '    face.rotation.x = Math.PI / 2;\n    face.scale.set(0.72, 1.0, 1.10);',
    to:   '    face.rotation.z = Math.PI / 2;\n    face.scale.set(0.72, 1.0, 1.10);' },

  { id: 'M16', cel: 'H16', plik: UNITS_TS,
    opis: 'tarcza rydwanu wepchnieta w nogi woznicy (kolizja z bryla wspolna)',
    from: '    rim.position.set(SH_X, SH_Y, SH_Z - 0.002 * HEX_R);',
    to:   '    rim.position.set(SH_X, SH_Y, SH_Z - 0.030 * HEX_R);' },

  { id: 'M17', cel: 'H17', plik: UNITS_TS,
    opis: 'kablaki burtowe usuniete (stan sprzed T9)',
    from: '    for (const s of [1, -1]) {\n      const hoop = new THREE.Mesh(gHoop, mWoodC);',
    to:   '    for (const s of []) {\n      const hoop = new THREE.Mesh(gHoop, mWoodC);' },

  { id: 'M18', cel: 'H18', plik: UNITS_TS,
    opis: 'okucia rydwanu celtyckiego z powrotem BRAZOWE (stan sprzed T9)',
    from: '      iron:  retint(COLOR_BRONZE,  COLOR_MAIL),',
    to:   '      iron:  retint(COLOR_BRONZE,  COLOR_BRONZE),' },

  { id: 'M19', cel: 'H19', plik: UNITS_TS,
    opis: 'tunika woznicy z powrotem w czerwieni lakowej (stan sprzed T9)',
    from: '      tunic: retint(COLOR_LACQUER, COLOR_WOAD),',
    to:   '      tunic: retint(COLOR_LACQUER, COLOR_LACQUER),' },

  { id: 'M20', cel: 'H20', plik: UNITS_TS,
    opis: 'dekoracja celtycka wlaczona dla WSZYSTKICH rydwanow — regresja mykenskiego i Shang',
    from: '                         shieldColor: number, celtic: boolean = false): THREE.Group {',
    to:   '                         shieldColor: number, celtic: boolean = true): THREE.Group {' },

  { id: 'M21', cel: 'H21', plik: UNITS_TS,
    opis: 'tarcza celtycka rozdeta na cala przednia sciane — zaslania panel w kolorze gracza',
    from: '    face.scale.set(0.72, 1.0, 1.10);',
    to:   '    face.scale.set(2.60, 1.0, 1.60);' },
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
    console.log('[zelazo-celtowie-t9] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

// ── geometria pomocnicza (Node) ────────────────────────────────────────────
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vlen = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => { const L = vlen(a); return [a[0] / L, a[1] / L, a[2] / L]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

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
const byName = (m) => { const o = {}; for (const p of m.parts) if (p.name) o[p.name] = p; return o; };
const halfY = (p) => [0, 1, 2].reduce((s, i) =>
  s + (p.localMax[i] - p.localMin[i]) / 2 * Math.abs([p.axX, p.axY, p.axZ][i][1]), 0);
// UWAGA: bryla obrotowa (TorusGeometry z `arc`) ma pudelko NIESYMETRYCZNE
// wzgledem wlasnego srodka, wiec skrajne Y liczymy od SRODKA OBB, nie od
// `position` mesha — inaczej luk wychodzi o 0.045 x HEX_R nizszy niz jest.
const ctrY = (p) => obb(p).c[1];
/** AABB w osiach swiata, policzone z OBB (a nie z `position`, ktore dla bryl
 *  obrotowych z `arc` nie lezy w srodku pudelka). */
function aabb(p) {
  const o = obb(p);
  const h = [0, 1, 2].map((j) => o.h[0] * Math.abs(o.u[0][j]) + o.h[1] * Math.abs(o.u[1][j]) + o.h[2] * Math.abs(o.u[2][j]));
  return { min: [0, 1, 2].map((j) => o.c[j] - h[j]), max: [0, 1, 2].map((j) => o.c[j] + h[j]) };
}
const topY = (p) => (p ? ctrY(p) + halfY(p) : NaN);
const botY = (p) => (p ? ctrY(p) - halfY(p) : NaN);
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

// zestawy czesci Miecznika galijskiego adresowane po NAZWIE
const MG_BODY_RE = /^mg-(torso|neck|head|eye-[a-z]+|hair|moustache-[a-z]+|belt|skirt|torc|helmet-[a-z]+|braccae-[a-z-]+|shield-[a-z0-9-]+|leg-(left|right)-(thigh|shin|foot)|arm-left-(upper|fore)|arm-right-upper)$/;
const MG_WEAPON = ['mg-sword-guard', 'mg-sword-blade', 'mg-sword-tip'];
const MG_CHAIN = ['mg-arm-right-fist', 'mg-sword-guard', 'mg-sword-blade', 'mg-sword-tip'];
const RC_PARTS = ['rc-shield-rim', 'rc-shield-face', 'rc-shield-spina', 'rc-shield-boss',
                  'rc-hoop-left', 'rc-hoop-right'];

/** Pomiar w zywym Three.js: OBB + osie + kotwice dla kazdego mesh. */
async function measureAll(page) {
  return page.evaluate(({ all, owner }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    function dump(g) {
      g.updateMatrixWorld(true);
      const parts = []; const names = [];
      let meshCount = 0, minY = Infinity, maxY = -Infinity, maxR = 0, ownerMeshes = 0;
      const kolory = {};
      const v = new THREE.Vector3();
      g.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
        const hex = o.material && o.material.color ? o.material.color.getHex() : -1;
        kolory[hex] = (kolory[hex] || 0) + 1;
        if (hex === owner) ownerMeshes++;
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
        if (o.name) names.push(o.name);
        const wp = new THREE.Vector3(); o.getWorldPosition(wp);
        const q = new THREE.Quaternion(); o.getWorldQuaternion(q);
        const sc = new THREE.Vector3(); o.getWorldScale(sc);
        const ax = (x, y, z) => new THREE.Vector3(x, y, z).applyQuaternion(q).toArray();
        parts.push({
          name: o.name || '',
          localMin: [bb.min.x * sc.x, bb.min.y * sc.y, bb.min.z * sc.z],
          localMax: [bb.max.x * sc.x, bb.max.y * sc.y, bb.max.z * sc.z],
          pos: wp.toArray(), axX: ax(1, 0, 0), axY: ax(0, 1, 0), axZ: ax(0, 0, 1),
        });
      });
      return {
        meshCount, names, parts, minY, maxY, maxR, height: maxY - minY, ownerMeshes, kolory,
        anchors: g.userData['anchors'] || null,
        retint: g.userData['celticRetint'] || null,
        matCount: Array.isArray(g.userData['mats']) ? g.userData['mats'].length : -1,
      };
    }
    const out = { generic: {} };
    for (const u of all) out[u.key] = dump(B(u.cat, owner, u.pl));
    out.galij_en = dump(B('miecznik', owner, 'Gallic Swordsman'));
    out.rydC_en  = dump(B('rydwan',   owner, 'Celtic Chariot'));
    out.generic.miecznik = dump(B('miecznik', owner));
    out.generic.rydwan   = dump(B('rydwan', owner));
    return out;
  }, { all: [GALIJ, RYDC].concat(REF).concat(SASIEDZI).concat(RYDWANY), owner: OWNER });
}

/** WIDOCZNOSC CZESCI Z KAMERY GRY, w PIKSELACH i z testem glebi GPU. */
async function measurePixels(page) {
  return page.evaluate(({ owner, sets }) => {
    const THREE = window.__THREE;
    const B = window.__buildUnitModel;
    const S = 384, el = 52 * Math.PI / 180;
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
      { id: 'mg_krata_ochra', cat: 'miecznik', pl: 'Miecznik galijski', sel: 'mg-braccae-band-' },
      { id: 'mg_krata_urzet', cat: 'miecznik', pl: 'Miecznik galijski', sel: 'mg-braccae-stripe-' },
      { id: 'mg_torc',        cat: 'miecznik', pl: 'Miecznik galijski', sel: 'mg-torc' },
      { id: 'mg_oczy',        cat: 'miecznik', pl: 'Miecznik galijski', sel: 'mg-eye-' },
      { id: 'mg_wasy',        cat: 'miecznik', pl: 'Miecznik galijski', sel: 'mg-moustache-' },
      { id: 'mg_helm',        cat: 'miecznik', pl: 'Miecznik galijski', sel: 'mg-helmet-' },
      { id: 'mg_miecz',       cat: 'miecznik', pl: 'Miecznik galijski', sel: 'mg-sword-' },
      { id: 'mg_owner',       cat: 'miecznik', pl: 'Miecznik galijski', sel: '', byColor: true },
      { id: 'rc_tarcza',      cat: 'rydwan',   pl: 'Rydwan celtycki',   sel: 'rc-shield-face' },
      { id: 'rc_kablaki',     cat: 'rydwan',   pl: 'Rydwan celtycki',   sel: 'rc-hoop-' },
      { id: 'rc_owner',       cat: 'rydwan',   pl: 'Rydwan celtycki',   sel: '', byColor: true },
      { id: 'rydM_owner',     cat: 'rydwan',   pl: 'Rydwan mykeński',   sel: '', byColor: true },
      { id: 'ref_thorak_eyes',  cat: 'wlocznik',  pl: 'Thorakites', sel: 'th-eye-' },
      { id: 'ref_falanga_slit', cat: 'falangita', pl: 'Falanga',    sel: 'falangita-helmet-slit' },
      { id: 'ref_gaesatae_owner', cat: 'miecznik', pl: 'Gaesatae',  sel: '', byColor: true },
    ],
  });
}

/** ODROZNIALNOSC z KAMERY GRY — piksele, nie binarna sylwetka (metoda T5-T8). */
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
  }, { all: [GALIJ, RYDC].concat(REF).concat(SASIEDZI).concat(RYDWANY), owner: OWNER });
}

// ═══ ASERCJE H1-H21 — kazda ma swoja POJEDYNCZA mutacje M1-M21 ═════════════
function assertGeometry(m, pix, dist, soft) {
  const res = [];
  const t = (id, name, cond, detail) => { res.push({ id, cond: !!cond }); if (!soft) check(name, cond, detail); };
  const ng = byName(m.galij), nr = byName(m.rydC);
  const par = (a, b) => { const p = dist.pairs.find((q) => (q.a === a && q.b === b) || (q.a === b && q.b === a)); return p ? p.d : NaN; };

  // ---- MIECZNIK GALIJSKI --------------------------------------------------
  // H1 — BRON nie tkwi w CIELE (klasa T1/T3/T5). Reka uzbrojona wylaczona:
  // styk piesci z bronia to CHWYT, pilnowany osobno w H2.
  const bron = new Set(MG_WEAPON);
  const body = m.galij.parts.filter((p) => MG_BODY_RE.test(p.name) && !bron.has(p.name));
  const h1 = [];
  for (const wn of MG_WEAPON) {
    const w = ng[wn];
    if (!w) { h1.push({ brak: wn }); continue; }
    for (const b of body) {
      const d = satDepth(obb(w), obb(b));
      if (d > KOLIZJA_PROG) h1.push({ w: wn, b: b.name, d: +d.toFixed(4) });
    }
  }
  t('H1', '(H1) miecz Miecznika galijskiego NIE przenika ciala wlasnej figurki (pelny SAT, ' + body.length + ' czesci)',
    h1.length === 0, h1);

  // H2 — BRON nie przenika RAMIENIA reki uzbrojonej; CHWYT (piesc) istnieje.
  const armPen = {}, fistPen = {};
  const nf = byName(m.falanga), nt = byName(m.thorakites);
  armPen.galij = ng['mg-sword-blade'] && ng['mg-arm-right-upper']
    ? +satDepth(obb(ng['mg-sword-blade']), obb(ng['mg-arm-right-upper'])).toFixed(4) : NaN;
  armPen.falangita = +satDepth(obb(nf['falangita-dory-shaft']), obb(nf['falangita-arm-right-upper'])).toFixed(4);
  armPen.thorakites = +satDepth(obb(nt['th-spear-shaft']), obb(nt['th-arm-right-upper'])).toFixed(4);
  fistPen.galij = ng['mg-sword-guard'] && ng['mg-arm-right-fist']
    ? +satDepth(obb(ng['mg-sword-guard']), obb(ng['mg-arm-right-fist'])).toFixed(4) : NaN;
  t('H2', '(H2) miecz NIE przenika ramienia reki uzbrojonej — 0.0000 jak Falangita (T3) i Thorakites (T6); jelec trzymany w piesci',
    armPen.galij === 0 && armPen.falangita === 0 && armPen.thorakites === 0
    && Number.isFinite(fistPen.galij) && fistPen.galij > 0.008 && fistPen.galij < 0.045,
    { ramie: armPen, chwyt_jelca: fistPen });

  // H3 — WIDOCZNOSC BRONI z kamery gry (klasa bledu T6/A1). Prog to 0.60
  // widocznosci dory Falangity policzonej W TYM SAMYM renderze.
  const visF = weaponVisibility(m.falanga, ['falangita-arm-right-fist', 'falangita-dory-shaft', 'falangita-dory-tip']).vis;
  const visMG = weaponVisibility(m.galij, MG_CHAIN);
  t('H3', '(H3) miecz widoczny z kamery gry (>=0.60 widocznosci dory Falangity z T3)',
    Number.isFinite(visF) && Number.isFinite(visMG.vis) && visMG.vis >= 0.60 * visF,
    { galij: +visMG.vis.toFixed(3), falangita: +visF.toFixed(3), prog: +(0.60 * visF).toFixed(3) });

  // H4 — KRATA NA BRACCAE WIDOCZNA. Przed T9: 0 pikseli OBU barw przy
  // 4 istniejacych mesh — cecha istniala w geometrii i nie istniala na ekranie.
  t('H4', '(H4) krata braccae WIDOCZNA z kamery gry w OBU barwach (przed T9: 0 i 0 pikseli przy 4 mesh)',
    pix.mg_krata_ochra.tinted === 4 && pix.mg_krata_urzet.tinted === 4
    && pix.mg_krata_ochra.vis > 0 && pix.mg_krata_urzet.vis > 0,
    { ochra: pix.mg_krata_ochra, urzet: pix.mg_krata_urzet, przed_T9: { ochra: 0, urzet: 0 } });

  // H5 — TORQUES WIDOCZNY. Przed T9: 4 piksele. Prog rodziny: szczelina helmu
  // Falangity, najmniejsza zaakceptowana czesc twarzowa serii, mierzona tu.
  const torc = ng['mg-torc'];
  const torcBox = torc ? aabb(torc) : null;
  const anch = m.galij.anchors;
  t('H5', '(H5) torques siedzi na OBOJCZYKU (nie w polowie szyi) i wystaje przed piers — i dzieki temu widac go z kamery gry',
    !!torc && !!anch && pix.mg_torc.tinted === 1 && pix.mg_torc.vis >= pix.ref_falanga_slit.vis
    && torc.pos[1] <= anch.torsoTopY + 0.006
    && torcBox.max[2] > anch.torsoHalfD,
    { torc_piksele: pix.mg_torc.vis, falangita_szczelina: pix.ref_falanga_slit.vis,
      torc_y: +torc.pos[1].toFixed(4), bark_y: +anch.torsoTopY.toFixed(4),
      torc_przod_z: +torcBox.max[2].toFixed(4), piers_z: +anch.torsoHalfD.toFixed(4), przed_T9: 4 });

  // H6 — KITA SIEDZI NA GUZIE, GUZ NA MISCE. Przed T9 guza NIE BYLO w kodzie
  // (mimo ze naglowek funkcji go wymienial), a kita wisiala nad miska w powietrzu.
  const bowl = ng['mg-helmet-bowl'], knob = ng['mg-helmet-knob'], crest = ng['mg-helmet-crest'];
  const dKnobBowl = (bowl && knob) ? satDepth(obb(bowl), obb(knob)) : 0;
  const dCrestKnob = (crest && knob) ? satDepth(obb(crest), obb(knob)) : 0;
  t('H6', '(H6) helm Montefortino ma GUZ, guz styka sie z miska, a kita siedzi na guzie (przed T9: brak guza, kita 0.018 nad miska)',
    !!bowl && !!knob && !!crest && dKnobBowl > 0 && dCrestKnob > 0,
    { guz_x_miska: +dKnobBowl.toFixed(4), kita_x_guz: +dCrestKnob.toFixed(4) });

  // H7 — OCZY widoczne z kamery gry (przed T9 model nie mial oczu w ogole).
  t('H7', '(H7) oczy Miecznika widoczne z kamery gry (>= progu rodziny: Thorakites z T6)',
    pix.mg_oczy.tinted === 2 && pix.mg_oczy.vis >= pix.ref_thorak_eyes.vis,
    { galij: pix.mg_oczy.vis, thorakites_T6: pix.ref_thorak_eyes.vis, przed_T9: 'brak oczu' });

  // H8 — PROPORCJE: stopy na terenie, promien w limicie heksu, wysokosc rodziny.
  t('H8', '(H8) stopy na y>=0, promien w limicie heksu (<=0.866), wysokosc 0.55-0.90 x HEX_R',
    m.galij.minY > -1e-9 && m.galij.maxR <= 0.866 && m.galij.height > 0.55 && m.galij.height < 0.90,
    { minY: +m.galij.minY.toFixed(4), maxR: +m.galij.maxR.toFixed(4), h: +m.galij.height.toFixed(4) });

  // H9 — LOKCIE ZGIETE (klasa bledu T1: reka prosta jak kij).
  const bends = {};
  for (const side of ['right', 'left']) {
    const up = ng['mg-arm-' + side + '-upper'], fo = ng['mg-arm-' + side + '-fore'];
    bends[side] = (up && fo) ? +Math.acos(Math.max(-1, Math.min(1, dot(up.axY, fo.axY)))).toFixed(3) : NaN;
  }
  t('H9', '(H9) OBA lokcie Miecznika sa ZGIETE (>0.30 rad)',
    Object.values(bends).every((v) => Number.isFinite(v) && v > 0.30), bends);

  // H10 — POLE TARCZY zwrocone DO kamery (klasa bledu T2) i widoczne.
  const mgFace = ng['mg-shield-face'];
  const dotMG = mgFace ? +dot(mgFace.axZ, CAM_VIEW).toFixed(3) : NaN;
  t('H10', '(H10) pole tarczy owalnej Miecznika zwrocone DO kamery gry (klasa bledu T2)',
    Number.isFinite(dotMG) && dotMG < -0.30
    && m.galij.anchors !== null && m.galij.anchors.shieldKind === 'oval-celtic',
    { dot: dotMG, shieldKind: m.galij.anchors && m.galij.anchors.shieldKind });

  // H11 — POZA CIECIA, NIE PCHNIECIA (Polibiusz II.33.3: miecz galijski sluzy
  // wylacznie do ciecia). Sztych MUSI byc WYRAZNIE WYZEJ niz dlon.
  const fist = ng['mg-arm-right-fist'], tip = ng['mg-sword-tip'];
  const podniesienie = (fist && tip) ? tip.pos[1] - fist.pos[1] : NaN;
  t('H11', '(H11) miecz WZNIESIONY do ciecia — sztych co najmniej 0.12 x HEX_R nad dlonia (przed T9: poza pchniecia, sztych PONIZEJ dloni)',
    Number.isFinite(podniesienie) && podniesienie > 0.12,
    { sztych_nad_dlonia: +(podniesienie || 0).toFixed(4) });

  // H12 — ODROZNIALNOSC PIESZA: Miecznik galijski nie zlewa sie z zadnym
  // sasiadem. Przed T9 dwie pary byly PONIZEJ progu rodziny 0.558:
  // galij/Druzynnik 0.509 i galij/Hastati 0.526.
  const paryMG = ['druz', 'hastati', 'gaesatae', 'soldurii', 'triari', 'falanga']
    .map((k) => ({ k, d: par('galij', k) }));
  const ponizejMG = paryMG.filter((p) => !(p.d >= PROG_PARA));
  t('H12', '(H12) Miecznik galijski odrozniay od KAZDEGO sasiada pieszego (>=0.558 progu rodziny); przed T9 dwie pary byly ponizej',
    dist.same < 0.01 && ponizejMG.length === 0,
    { kontrola_ten_sam_model: +dist.same.toFixed(4),
      pary: paryMG.map((p) => p.k + '=' + p.d.toFixed(3)),
      przed_T9: { druz: 0.509, hastati: 0.526 } });

  // H13 — KOLOR GRACZA obecny i WIDOCZNY z kamery gry.
  t('H13', '(H13) kolor gracza Miecznika obecny i WIDOCZNY z kamery gry (nosnik: pole tarczy)',
    m.galij.ownerMeshes >= 1 && pix.mg_owner.tinted >= 1
    && pix.mg_owner.vis >= 0.5 * pix.ref_gaesatae_owner.vis,
    { galij: pix.mg_owner.vis, gaesatae: pix.ref_gaesatae_owner.vis });

  // ---- RYDWAN CELTYCKI ----------------------------------------------------
  // Bryla wozu = wszystkie mesh BEZ nazwy `rc-` ponizej pasa woznicy (y<=0.25).
  // Odcinamy w ten sposob konie (z>=0.22) i gorna polowe woznicy, zostawiajac
  // kola, os, podloge, burty, sciane przednia, listwe i nogi woznicy.
  const rcNames = new Set(RC_PARTS);
  const rcFace = nr['rc-shield-face'];
  // Odniesienie NIE jest tabelka: to najdalej wysunieta ku widzowi powierzchnia
  // pojazdu LEZACA DOKLADNIE ZA tarcza (pokrywajaca sie z nia w X i w Y).
  const shBox = rcFace ? aabb(rcFace) : null;
  const zaTarcza = shBox ? m.rydC.parts.filter((p) => {
    if (rcNames.has(p.name)) return false;
    const b = aabb(p);
    return b.min[0] < shBox.max[0] && b.max[0] > shBox.min[0]
        && b.min[1] < shBox.max[1] && b.max[1] > shBox.min[1]
        && b.min[2] < shBox.max[2];
  }) : [];
  const przodWozu = zaTarcza.length ? Math.max(...zaTarcza.map((p) => aabb(p).max[2])) : -Infinity;
  const tylTarczy = shBox ? shBox.min[2] : NaN;
  const luz = tylTarczy - przodWozu;

  // H14 — TARCZA PRZYLEGA DO POJAZDU. Przed T9 wisiala 0.052 x HEX_R przed
  // najdalej wysunietym punktem skrzyni, stykajac sie z nia tylko rogiem listwy.
  t('H14', '(H14) tarcza celtycka PRZYLEGA do skrzyni — luz tylnej sciany <= 0.010 x HEX_R (przed T9: 0.052)',
    Number.isFinite(luz) && luz >= -MONTAZ_PROG && luz <= 0.010,
    { luz: +(luz || 0).toFixed(4), przod_wozu_z: +przodWozu.toFixed(4), tyl_tarczy_z: +(tylTarczy || 0).toFixed(4),
      czesci_za_tarcza: zaTarcza.length });

  // H15 — TARCZA ZWROCONA DO KAMERY i WIDOCZNA. Przed T9 normalna pola byla
  // (-1;0;0), czyli iloczyn skalarny z kierunkiem patrzenia DOKLADNIE 0.000,
  // a caly „znacznik kultury" mial 198 pikseli wobec 1070 tarczy Gaesatow.
  const dotRC = rcFace ? +dot(rcFace.axY, CAM_VIEW).toFixed(3) : NaN;
  t('H15', '(H15) pole tarczy rydwanu zwrocone DO kamery gry i widoczne >=3x mocniej niz przed T9 (198 pikseli)',
    Number.isFinite(dotRC) && dotRC < -0.30 && pix.rc_tarcza.tinted === 1 && pix.rc_tarcza.vis >= 3 * 198,
    { dot: dotRC, piksele: pix.rc_tarcza.vis, przed_T9: { dot: 0.0, piksele: 198 } });

  // H16 — DEKORACJA NIE PRZENIKA BRYLY WSPOLNEJ. Zaglebienie MONTAZOWE
  // (kablak siedzacy na burcie) jest dozwolone do 0.012; wiecej to kolizja.
  const hullAll = m.rydC.parts.filter((p) => !rcNames.has(p.name));
  const h16 = [];
  // Kablaki sa LUKAMI: ich pudelko OBB wypelnia caly obszar POD lukiem, wiec
  // test SAT dalby dla nich falszywe kolizje z burta i sciana przednia.
  // Kablakom poswiecona jest osobna, geometryczna asercja (H17).
  for (const rn of RC_PARTS.filter((x) => !x.startsWith('rc-hoop-'))) {
    const p = nr[rn];
    if (!p) { h16.push({ brak: rn }); continue; }
    for (const b of hullAll) {
      const d = satDepth(obb(p), obb(b));
      if (d > MONTAZ_PROG) h16.push({ czesc: rn, d: +d.toFixed(4) });
    }
  }
  t('H16', '(H16) ZADNA plaska czesc tarczy celtyckiej nie przenika bryly wspolnej glebiej niz 0.012 x HEX_R (montaz wolno, kolizja nie)',
    h16.length === 0, h16.slice(0, 6));

  // H17 — KABLAKI BURTOWE: dwa, siedza NA burcie i wznosza sie ponad nia.
  const hoopL = nr['rc-hoop-left'], hoopR = nr['rc-hoop-right'];
  // BURTY bryly wspolnej rozpoznane po GEOMETRII, nie po tabelce: to jedyne
  // dwa nienazwane mesh o glebokosci w osi Z > 0.20 lezace poza osia wozu.
  const burty = m.rydC.parts.filter((p) => p.name === '' && Math.abs(p.pos[0]) > 0.10
    && (p.localMax[2] - p.localMin[2]) > 0.20);
  const burtaTop = burty.length ? Math.max(...burty.map(topY)) : NaN;
  const burtaX = burty.length ? Math.max(...burty.map((p) => Math.abs(p.pos[0]))) : NaN;
  const hoopTop = hoopL ? topY(hoopL) : NaN;
  const naBurcie = (h) => h && Math.abs(h.pos[1] - burtaTop) < 0.005 && Math.abs(Math.abs(h.pos[0]) - burtaX) < 0.005;
  t('H17', '(H17) dwa kablaki burtowe siedza NA burtach (ta sama wysokosc i ten sam odstep od osi), wznosza sie >=0.05 ponad nie i widac je z kamery gry',
    burty.length === 2 && naBurcie(hoopL) && naBurcie(hoopR) && hoopTop > burtaTop + 0.05
    && pix.rc_kablaki.tinted === 2 && pix.rc_kablaki.vis > 0,
    { burt: burty.length, gora_burty: +burtaTop.toFixed(4), x_burty: +burtaX.toFixed(4),
      gora_kablaka: +(hoopTop || 0).toFixed(4),
      kablak_y: hoopL && +hoopL.pos[1].toFixed(4), kablak_x: hoopL && +hoopL.pos[0].toFixed(4),
      piksele: pix.rc_kablaki.vis });

  // H18 — OKUCIA ZELAZNE TYLKO U CELTOW. W rydwanie celtyckim ma NIE BYC ani
  // jednego mesh w barwie brazu / czerwieni lakowej / czerwieni zywej;
  // w mykenskim i Shang MUSZA one zostac — to dowod, ze retint jest wylacznie
  // celtycki, a nie globalny.
  const BRONZE = 0xcf9234, LACQUER = 0xa8252a, RED_VIV = 0xc0392b, MAIL = 0x9098a0;
  const cnt = (mm, hex) => mm.kolory[hex] || 0;
  t('H18', '(H18) rydwan celtycki ma okucia ZELAZNE i tunike woznicy poza czerwienia lakowa; mykenski i Shang zachowuja braz i lak',
    cnt(m.rydC, BRONZE) === 0 && cnt(m.rydC, LACQUER) === 0 && cnt(m.rydC, RED_VIV) === 0
    && cnt(m.rydC, MAIL) === 6
    && cnt(m.rydM, BRONZE) === 7 && cnt(m.rydM, LACQUER) === 3 && cnt(m.rydM, RED_VIV) === 1
    && cnt(m.rydS, LACQUER) === 5
    && m.rydC.retint !== null && m.rydC.retint.iron === 1 && m.rydC.retint.tunic === 1 && m.rydC.retint.crest === 1
    && m.rydM.retint === null && m.rydS.retint === null,
    { celtycki: { braz: cnt(m.rydC, BRONZE), lak: cnt(m.rydC, LACQUER), zelazo: cnt(m.rydC, MAIL) },
      mykenski: { braz: cnt(m.rydM, BRONZE), lak: cnt(m.rydM, LACQUER) },
      shang: { lak: cnt(m.rydS, LACQUER) }, retint: m.rydC.retint });

  // H19 — FAKTYCZNA POPRAWA ODROZNIALNOSCI RYDWANU. Przed T9: 0.0102 wobec
  // mykenskiego, czyli tyle co nic (kontrola „ten sam model" = 0.0000).
  // Prog rodziny 0.558 osiaga wylacznie rydwan z WLASNA bryla (Kapadokijski,
  // mierzony tu obok) — dlatego asercja pilnuje realnej poprawy, a nie progu,
  // a niedomknieta reszta luki jest wypisana jawnie.
  const dCM = par('rydC', 'rydM'), dCS = par('rydC', 'rydS'), dKapM = par('rydKap', 'rydM');
  t('H19', '(H19) rydwan celtycki odrozniay od mykenskiego i Shang co najmniej 0.30 (przed T9: 0.0102) — LUKA NIEDOMKNIETA do progu 0.558, patrz naglowek',
    dCM >= 0.30 && dCS >= 0.30 && dKapM >= PROG_PARA,
    { celt_myken: +dCM.toFixed(4), celt_shang: +dCS.toFixed(4), przed_T9: 0.0102,
      bespoke_kapadokijski_vs_myken: +dKapM.toFixed(4), prog_rodziny: PROG_PARA });

  // H20 — ZERO REGRESJI MYKENSKIEGO I SHANG. Pin liczbowy ze stanu `main`
  // sprzed T9 plus dokladne pozycje dwoch mesh dekoracji.
  const pinRyd = (mm) => mm.meshCount === RYD_PRZED_T9.mesh
    && Math.abs(mm.minY - RYD_PRZED_T9.minY) < 1e-6
    && Math.abs(mm.maxY - RYD_PRZED_T9.maxY) < 6e-4
    && Math.abs(mm.maxR - RYD_PRZED_T9.maxR) < 6e-4
    && mm.names.length === 0;
  const dekor = (mm) => {
    const kolo = mm.parts.filter((p) => p.name === '' && p.pos[1] > 0.19 && p.pos[1] < 0.21 && p.pos[2] > 0.11 && p.pos[2] < 0.13);
    return kolo.length === 2
      && Math.abs(kolo[0].pos[0] - RYD_DEKOR_PRZED_T9.tarcza[0]) < 1e-4
      && Math.abs(kolo[1].pos[0] - RYD_DEKOR_PRZED_T9.boss[0]) < 1e-4;
  };
  t('H20', '(H20) mykenski i Shang wychodza z T9 BEZ ZMIAN: 97 mesh, te same skrajne wymiary, 0 nazwanych mesh, dekoracja w tych samych punktach, i nadal 0.0139 wzgledem siebie',
    pinRyd(m.rydM) && pinRyd(m.rydS) && dekor(m.rydM) && dekor(m.rydS)
    && Math.abs(par('rydM', 'rydS') - 0.0139) < 0.005,
    { mykenski: { mesh: m.rydM.meshCount, maxY: +m.rydM.maxY.toFixed(4), maxR: +m.rydM.maxR.toFixed(4), nazwane: m.rydM.names.length },
      shang: { mesh: m.rydS.meshCount, maxY: +m.rydS.maxY.toFixed(4), nazwane: m.rydS.names.length },
      myken_shang: +par('rydM', 'rydS').toFixed(4) });

  // H21 — KOLOR GRACZA RYDWANU nie zostal poswiecony na rzecz tarczy kultury.
  t('H21', '(H21) kolor gracza rydwanu celtyckiego nadal widoczny i >=0.75 tego, co u mykenskiego (tarcza nie zjada identyfikacji gracza)',
    pix.rc_owner.tinted === 5 && pix.rydM_owner.tinted === 5
    && pix.rc_owner.vis >= 0.75 * pix.rydM_owner.vis,
    { celtycki: pix.rc_owner.vis, mykenski: pix.rydM_owner.vis,
      udzial: +(pix.rc_owner.vis / pix.rydM_owner.vis).toFixed(3) });

  if (!soft) {
    console.log('  [relacje] miecz: widocznosc=' + visMG.vis.toFixed(3) + ' (Falangita ' + visF.toFixed(3) + ')'
      + ' | w ramieniu=' + JSON.stringify(armPen) + ' | lokcie=' + JSON.stringify(bends)
      + ' | sztych nad dlonia=' + (podniesienie || 0).toFixed(4));
    console.log('  [relacje] rydwan: luz tarczy=' + (luz || 0).toFixed(4) + ' | dot pola=' + dotRC
      + ' | kablak nad burta=' + ((hoopTop || 0) - burtaTop).toFixed(4)
      + ' | piksele=' + JSON.stringify(Object.fromEntries(Object.entries(pix).map(([k, v]) => [k, v.vis]))));
  }
  return res;
}

/** Reszta: dispatch, nazwy, kotwice, dane units.json, sekcje K. */
function assertRest(m, pix, dist, src, unitRows) {
  // --- (D) DISPATCH: nazwa PL i EN trafia we WLASNY model, nie w generyka ----
  check('(D:galij) „Miecznik galijski" (PL) buduje wlasny model, nie generyk `miecznik`',
    m.galij.names.length === m.galij.meshCount && m.galij.names.every((n) => n.startsWith('mg-'))
    && m.generic.miecznik.names.length === 0 && m.galij.anchors !== null && m.generic.miecznik.anchors === null,
    { unit: m.galij.meshCount, generic: m.generic.miecznik.meshCount });
  check('(D:galij:en) „Gallic Swordsman" (EN) trafia w TEN SAM model co nazwa PL',
    m.galij_en.meshCount === m.galij.meshCount && m.galij_en.names.length === m.galij.names.length
    && m.galij_en.names.every((n) => n.startsWith('mg-')),
    { en: m.galij_en.meshCount, pl: m.galij.meshCount });
  check('(D:rydC) „Rydwan celtycki" (PL) dostaje dekoracje celtycka, generyk `rydwan` NIE',
    m.rydC.names.filter((n) => n.startsWith('rc-')).length === 6
    && m.generic.rydwan.names.length === 0 && m.generic.rydwan.retint === null
    && m.rydC.meshCount === m.generic.rydwan.meshCount + 6,
    { rydC: m.rydC.meshCount, generic: m.generic.rydwan.meshCount });
  check('(D:rydC:en) „Celtic Chariot" (EN) trafia w TEN SAM model co nazwa PL',
    m.rydC_en.meshCount === m.rydC.meshCount
    && m.rydC_en.names.filter((n) => n.startsWith('rc-')).length === 6,
    { en: m.rydC_en.meshCount, pl: m.rydC.meshCount });

  // --- (N) nazwy + kotwice (warunek mozliwosci audytu) ----------------------
  check('(N:galij) KAZDY mesh Miecznika ma nazwe z prefiksem `mg-` i grupa ma `userData.anchors`',
    m.galij.names.length === m.galij.meshCount && m.galij.anchors !== null,
    { mesh: m.galij.meshCount, nazwane: m.galij.names.length });
  check('(N:galij:unikat) nazwy czesci Miecznika sa UNIKALNE (zadna nie nadpisuje adresu innej)',
    new Set(m.galij.names).size === m.galij.names.length,
    m.galij.names.filter((n, i) => m.galij.names.indexOf(n) !== i));
  check('(N:galij:kotwice) kotwice niosa rodzaj tarczy, rodzaj broni, rodzaj helmu i punkt chwytu',
    m.galij.anchors !== null && m.galij.anchors.shieldKind === 'oval-celtic'
    && m.galij.anchors.weaponKind === 'sword-long-latene'
    && m.galij.anchors.helmetKind === 'montefortino-celtic'
    && m.galij.anchors.missileKind === 'none' && Array.isArray(m.galij.anchors.grip),
    m.galij.anchors);
  check('(N:rydC:unikat) nazwy czesci celtyckich rydwanu sa UNIKALNE i jest ich dokladnie 6',
    new Set(m.rydC.names).size === m.rydC.names.length && m.rydC.names.length === 6,
    m.rydC.names);

  // --- (R) BRAK REGRESJI: modele odniesienia i sasiedzi ---------------------
  for (const r of REF) {
    const mm = m[r.key];
    check('(R:' + r.key + ') „' + r.pl + '" (T3/T6/T7) nadal w calosci nazwany i bez nazw T9',
      mm.names.length === mm.meshCount && mm.meshCount > 0
      && mm.names.every((n) => n.startsWith(r.pf + '-'))
      && !mm.names.some((n) => /^(mg|rc)-/.test(n)),
      { mesh: mm.meshCount, nazwane: mm.names.length });
  }
  for (const s of SASIEDZI) {
    check('(R:' + s.key + ') „' + s.pl + '" (poza zakresem T9) nie dostal ANI JEDNEJ nazwy T9',
      !m[s.key].names.some((n) => /^(mg|rc)-/.test(n)));
  }
  check('(R:generyki) generyki `miecznik` i `rydwan` nietkniete (brak nazw i brak retintu T9)',
    !m.generic.miecznik.names.some((n) => /^(mg|rc)-/.test(n))
    && !m.generic.rydwan.names.some((n) => /^(mg|rc)-/.test(n))
    && m.generic.rydwan.retint === null);
  check('(R:kapadokijski) „Rydwan Kapadokijski" (bespoke, poza zakresem T9) bez dekoracji celtyckiej',
    !m.rydKap.names.some((n) => /^rc-/.test(n)) && m.rydKap.retint === null);

  // --- (0) KOTWICE W DANYCH — model musi zgadzac sie z units.json -----------
  const row = (nm) => unitRows.find((r) => r['Jednostka'] === nm);
  {
    const mg = row('Miecznik galijski');
    check('(0a) units.json: Miecznik ma Pancerz 3 i Atak dystansowy 0 — model MUSI miec helm i tarcze, a NIE miec broni miotanej',
      mg && mg['Pancerz'] === 3 && mg['Atak dystansowy'] === 0
      && m.galij.anchors.missileKind === 'none'
      && m.galij.names.some((n) => /^mg-helmet-/.test(n))
      && m.galij.names.some((n) => /^mg-shield-/.test(n))
      && !m.galij.names.some((n) => /mail|cuirass|lorica|scale/.test(n)),
      mg && { pancerz: mg['Pancerz'], ad: mg['Atak dystansowy'] });
    check('(0b) units.json: Uwagi Miecznika zadaja DLUGIEGO MIECZA — model niesie klinge najdluzsza w swoim pliku i nosi ja w nazwach mesh',
      mg && /długi miecz/.test(mg['Uwagi'])
      && m.galij.names.filter((n) => /^mg-sword-/.test(n)).length === 3
      && /getGTRLongBlade\(\)/.test(src.z3),
      mg && { uwagi: mg['Uwagi'] });
    check('(0c) units.json: Miecznik NIE jest super — model nie ma choragwi-znacznika',
      mg && mg['Super-jednostka'] !== 'TAK' && !m.galij.names.some((n) => /-banner-/.test(n)));

    const rc = row('Rydwan celtycki');
    const rm = row('Rydwan mykeński'), rs = row('Rydwan Shang');
    check('(0d) units.json: Rydwan celtycki ma Epoke ZELAZO (mykenski i Shang — BRAZ), co uzasadnia zelazne okucia tylko u niego',
      rc && rm && rs && rc['Epoka'] === 'Żelazo' && rm['Epoka'] === 'Brąz' && rs['Epoka'] === 'Brąz'
      && rc['Kultura'] === 'Celtowie',
      { celt: rc && rc['Epoka'], myken: rm && rm['Epoka'], shang: rs && rs['Epoka'] });
    check('(0e) units.json: rydwan celtycki jest LZEJSZY od obu pozostalych (Pancerz 1 wobec 2 i 2), a Shang ma zaloge TRZECH ludzi — dane zadaja roznych pojazdow',
      rc && rm && rs && rc['Pancerz'] === 1 && rm['Pancerz'] === 2 && rs['Pancerz'] === 2
      && /lekki/.test(rc['Uwagi']) && /ciężki/.test(rs['Uwagi']) && /załoga 3/.test(rs['Uwagi']),
      { celt: rc && rc['Pancerz'], myken: rm && rm['Pancerz'], shang: rs && rs['Pancerz'] });
    check('(0f) units.json: Rydwan celtycki ma Atak dystansowy 0 — model swiadomie NIE dostal widocznych oszczepow (rozjazd Uwag i liczb zgloszony)',
      rc && rc['Atak dystansowy'] === 0 && /oszczep/.test(rc['Uwagi'])
      && !m.rydC.names.some((n) => /javelin|oszczep|spear/.test(n)),
      rc && { ad: rc['Atak dystansowy'] });
  }
  {
    const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[Łł]/g, 'l').toLowerCase();
    for (const core of ['miecznik galijski', 'rydwan celtycki']) {
      const hits = unitRows.filter((r) => norm(r['Jednostka']).includes(core));
      check('(0g:' + core + ') rdzen dispatchu JEDNOZNACZNY w calym units.json (dokladnie 1 trafienie)',
        hits.length === 1, hits.map((r) => r['Jednostka']));
    }
  }

  // --- (K) SEKCJE HISTORYCZNE — obecnosc i KONKRET, nie sam naglowek --------
  check('(K0) obie jednostki maja sekcje ZGODNOSC HISTORYCZNA we wlasciwym pliku',
    /ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(Miecznik galijski\)/.test(src.z3)
    && /ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA \(Rydwan celtycki\)/.test(src.units));
  const K = [
    ['K:mg-latene',     src.z3, /Kultura LATENSKA \(od stanowiska La Tene nad jeziorem Neuchatel/],
    ['K:mg-polibiusz',  src.z3, /Polibiusz II\.33\.3/],
    ['K:mg-diodor-brac', src.z3, /Diodor V\.30\.1/],
    ['K:mg-diodor-spatha', src.z3, /Diodor V\.30\.3/],
    ['K:mg-diodor-wasy', src.z3, /Diodor V\.28\.3/],
    ['K:mg-torc-telamon', src.z3, /Polibiusz II\.29\.8/],
    ['K:mg-chertsey',   src.z3, /CHERTSEY \(Surrey/],
    ['K:mg-llyn',       src.z3, /LLYN CERRIG\s*\n?\s*\/\/\s*BACH|LLYN CERRIG BACH/],
    ['K:mg-montefortino', src.z3, /Montefortino di Arcevia \(Ankona, Senonowie/],
    ['K:mg-braz-nie-zelazo', src.z3, /kanoniczne Montefortino sa z BRAZU/],
    ['K:mg-czego-nie',  src.z3, /CZEGO MODEL NIE ODWZOROWUJE/],
    ['K:rc-cezar-433',  src.units, /„De bello Gallico" IV\.33/],
    ['K:rc-tela',       src.units, /per omnes partes\s*\n?\s*\/\/\s*perequitant et tela coniciunt|perequitant et tela coniciunt/],
    ['K:rc-dyszel',     src.units, /BIEC PO DYSZLU/],
    ['K:rc-kasywelaun', src.units, /BG V\.19\.1/],
    ['K:rc-diodor-529', src.units, /Diodor Sycylijski V\.29\.1/],
    ['K:rc-bellowacy',  src.units, /BELLOWAKOW/],
    ['K:rc-wetwang',    src.units, /WETWANG SLACK/],
    ['K:rc-newbridge',  src.units, /NEWBRIDGE pod Edynburgiem, ok\. 475 p\.n\.e\./],
    ['K:rc-stylizacja', src.units, /STYLIZACJA oparta na tej rekonstrukcji/],
    ['K:rc-zelazne-obrecze', src.units, /ZELAZNE obrecze nabijane na skurcz/],
    ['K:rc-vitrum',     src.units, /Cezara BG V\.14/],
    ['K:rc-luk',        src.units, /lucznictwo rydwanowe nie jest poswiadczone/],
    ['K:rc-czastkowa',  src.units, /STAN PO T9 JEST WIEC POPRAWA CZASTKOWA/],
    ['K:rc-rozjazd',    src.units, /`Atak dystansowy` = 0/],
  ];
  for (const [id, txt, re] of K) {
    check('(' + id + ') sekcja historyczna niesie konkret, nie sam naglowek', re.test(txt));
  }
  // Sprostowanie NIEPRAWDZIWEGO zdania w istniejacym kodzie (klasa bledu T8).
  check('(K:sprostowanie-decorateChariot) doc-komentarz decorateChariot NIE twierdzi juz, ze przebarwia panel/tunike „tak, ze warianty czytaja sie odrebnie"',
    !/re-tints its car front-panel \/ driver tunic so\n \* the three chariot variants read distinctly\./.test(src.units)
    && /That sentence was\n \* a description of an intent that was never implemented/.test(src.units));
  check('(K:sprostowanie-guz) naglowek Miecznika wymienia GUZ, a guz faktycznie jest w kodzie',
    /miska \+ GUZ \+ kita/.test(src.z3) && /'-helmet-knob'/.test(src.z3));
  check('(K:units-ts) obie linie dispatchu Rydwanu celtyckiego (PL i EN) wolaja decorateChariot z celtic = true',
    (src.units.match(/COLOR_GOLD_BR, COLOR_FOREST, true\)/g) || []).length === 2
    && !/COLOR_BRONZE, COLOR_WOAD, true\)/.test(src.units)
    && !/COLOR_LACQUER, COLOR_LACQUER, true\)/.test(src.units));
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 620 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (mm) => { if (mm.type() === 'error') pageErrors.push(mm.text()); });

  async function loadBundle(file) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>');
    await page.addScriptTag({ path: file });
  }

  const SHOT_SET = [['Miecznik galijski', 'miecznik'], ['Drużynnik', 'miecznik'], ['Gaesatae', 'miecznik'],
                    ['Rydwan celtycki', 'rydwan'], ['Rydwan mykeński', 'rydwan'], ['Rydwan Shang', 'rydwan']];
  const SHOT = async (file) => {
    await page.evaluate(({ set, owner }) => {
      const THREE = window.__THREE;
      const B = window.__buildUnitModel;
      document.body.innerHTML = '';
      const W = 1200, H = 620, halfW = (set.length * 0.98) / 2 + 0.15;
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
        g.position.x = (i - (set.length - 1) / 2) * 0.98;
        scene.add(g);
      });
      const cy = 0.26, halfH = halfW * H / W;
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
      await SHOT(path.join(SHOTS, 'po-celtowie-kamera-gry.png'));
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
      if (SHOTS !== null && (g.mut.id === 'M4' || g.mut.id === 'M11' || g.mut.id === 'M14')) {
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
      distDir = path.join(os.tmpdir(), `civ-zelazo-t9-render-dist-${TMPDIR_RUN_ID}`);
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
      /miecznik galijski/i.test(built) && /rydwan celtycki/i.test(built));
    // Stale liczbowe NIE nadaja sie na kotwice: vite minifikuje `0.055` do `.055`.
    // Nazwy czesci T9 rowniez powstaja jako `PF + '-czesc'`, wiec w bundlu jest
    // SUFIKS osobno i staly prefiks osobno — dlatego kotwica sa sufiksy i prefiks.
    const T9_ONLY = ['-braccae-band-shin-', '-braccae-stripe-shin-', '-helmet-knob', '-helmet-cheek-',
                     'rc-shield-face', 'rc-shield-spina', 'rc-hoop-'];
    const brak = T9_ONLY.filter((n) => !built.includes(n));
    check('(G2) artefakt vite build niesie czesci dodane/naprawione w T9 (naprawa jest w produkcji)',
      brak.length === 0 && built.includes('"mg"'), { brak });
    check('(G3) artefakt vite build niesie sciezke celtyckiego retintu (przebarwienie jest w produkcji)',
      /celticRetint/.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominieta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); } catch (_) {}
  try { fs.rmSync(OUTDIR, { recursive: true, force: true }); } catch (_) {}

  console.log('\nzelazo-celtowie-miecznik-rydwan-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
