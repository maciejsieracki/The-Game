'use strict';
/**
 * zelazo-falanga-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T3 (Falanga, Żelazo / kultura Grecka).
 *
 * ZGŁOSZENIE. `buildFalangita()` (`src/render/hastati-falangita.ts`) istniał i był
 * dopracowany, ale docierał do gracza WYŁĄCZNIE przez `case 'falanga'` w
 * `buildCategoryModel()`. „Falanga" jest dziś jedyną jednostką tej kategorii, więc
 * była wizualnie unikalna „z przypadku", nie z projektu — niespójnie z resztą
 * rodziny Opus 5, gdzie dispatch idzie PO NAZWIE.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA. To jest model 3D (Three.js). Jedyny sposób
 * sprawdzenia, że włócznia nie przechodzi przez ramię wojownika — a nie że kod
 * się kompiluje — to zbudować grupę w żywym silniku i ZMIERZYĆ wzajemne relacje
 * części: odległości osi, orientacje, rzuty na normalne.
 *
 * SEKCJA (H) — SEDNO TEGO TESTU. Lekcja z T1/T2 tej serii: asercje mierzące NAZWY
 * mesh i bryłę ZBIORCZĄ świecą na zielono również wtedy, gdy broń przechodzi na
 * wylot przez własne ciało (T1) albo tarcza jest odwrócona krawędzią do kamery
 * (T2). Audyt istniejącego `buildFalangita()` — pomiarem w żywym Three.js, nie
 * czytaniem źródła — znalazł JEDEN twardy błąd tej właśnie klasy:
 *
 *   DORY W RAMIENIU. Kąt przedramienia (1.32) był praktycznie osią włóczni
 *   (1.371 w tej samej konwencji — różnica 2.9°). Przy historycznym chwycie w
 *   punkcie równowagi dory 0.240×HEX_R drzewca wystaje ZA dłoń, więc ta część
 *   szła wzdłuż przedramienia PROSTO W ŁOKIEĆ i dalej w ramię. Zmierzone PRZED:
 *   odległość osi ramienia od osi włóczni spadała z 0.0747×HEX_R przy barku do
 *   0.0044×HEX_R przy łokciu, przy progu styczności 0.027+0.0105 = 0.0375 —
 *   drzewce było zanurzone w górnych ~45% ramienia. Bez ucieczki bokiem: obie
 *   części leżą w tej samej płaszczyźnie X (drzewce −0.1305..−0.1095, ramię
 *   −0.147..−0.093). PO poprawce (przedramię 1.32 → 1.85) najmniejszy klirens
 *   na całej długości ramienia = 0.0587×HEX_R.
 *
 * KWESTIA BLAZONU (K7 w źródle). Pole aspis niosło Λ = Lakedaimon, godło SPARTY.
 * W tej grze Sparta nie jest kulturą, nacją ani jednostką — jest jedną z dziesięciu
 * równorzędnych nazw miast greckich (`data/city-names-pools.json`), a jedyna
 * jednostka grecka przypisana konkretnej polis to tebański „Hieros Lochos".
 * Λ zastąpiona neutralną, współśrodkową EPISEMĄ; sekcja (K) tego testu pilnuje
 * przesłanek tej decyzji w danych, żeby nie zdezaktualizowały się po cichu.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (R-PROC-AUTOBOT.md §9 poz. 6a): sekcja (B) buduje
 * DRUGI bundle, w którym cofnięto W LOCIE (bez dotykania plików w repo) dispatch
 * po nazwie, kąt przedramienia ORAZ episemę — i wymaga, żeby KAŻDA asercja
 * rozstrzygająca zapaliła się na czerwono.
 *
 * Usage (z gra/): node tools/zelazo-falanga-real-render-test.cjs
 *   --shots <katalog>   zrzuca PRZED/PO do <katalog>/{przed,po}-falanga.png
 *   --dist <index.html> użyj gotowego artefaktu vite zamiast budować go w teście
 *   --skip-vite         pomiń sekcję (G) artefaktu produkcyjnego
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
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[zelazo-falanga-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-falanga-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.zelazo-falanga-bundle.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.zelazo-falanga-bundle-przed.js');
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

// Półgrubości brył biorących udział w teście kolizji (z geometrii-singletonów
// w hastati-falangita.ts): ramię 0.054/2, drzewce dory 0.021/2.
const POL_RAMIE = 0.027;
const POL_DRZEWCE = 0.0105;
const PROG_STYCZNOSCI = POL_RAMIE + POL_DRZEWCE;   // 0.0375 × HEX_R

// --- kotwice źródłowe = dokładny stan PO poprawce ---------------------------
const LINE_DISPATCH =
  "  if (n.includes('falanga') || n.includes('hoplit') || n.includes('phalanx')) return newBuildFalangita(ownerColor_);";
const LINE_FALLBACK = "      return newBuildFalangita(ownerColor_);";
const ARM_PO = '  const armR = niBuildArm(group, -NI_SHLD_X, -2.55, 1.85, mWoad, mSkin, mLeath);';
const ARM_PRZED = '  const armR = niBuildArm(group, -NI_SHLD_X, -2.55, 1.32, mWoad, mSkin, mLeath);';
const EPISEMA_PO = [
  '  const epis = new THREE.Mesh(getGNIEpisema(), mLinen);',
  "  epis.position.set(0, 0, 0.022 * HEX_R);",
  "  epis.name = 'falangita-aspis-episema';",
  '  sh.add(epis);',
].join('\n');
const EPISEMA_PRZED = [
  '  for (const s of [-1, 1]) {',
  '    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.024 * HEX_R, 0.120 * HEX_R, 0.012 * HEX_R), mLinen);',
  '    bar.rotation.z = s * 0.40;',
  '    bar.position.set(s * 0.026 * HEX_R, -0.010 * HEX_R, 0.022 * HEX_R);',
  "    bar.name = 'falangita-aspis-episema' + (s < 0 ? '' : '-b');",
  '    sh.add(bar);',
  '  }',
].join('\n');

/**
 * Odwrócenie poprawki W LOCIE (tylko dla bundla PRZED). Nie dotyka plików repo.
 * Cofa DOKŁADNIE to, co ten temat zmienił: (1) dispatch po nazwie, (2) kąt
 * przedramienia trzymającego dory, (3) neutralną episemę z powrotem na lambdę.
 */
const mutation = { dispatch: 0, arm: 0, episema: 0 };
const revertFixPlugin = {
  name: 'revert-fix',
  setup(build) {
    build.onLoad({ filter: /(units|hastati-falangita)\.ts$/ }, (args) => {
      const p = path.resolve(args.path);
      if (p !== UNITS_TS && p !== MODEL_TS) return null;
      let out = fs.readFileSync(args.path, 'utf8');
      if (p === UNITS_TS && out.includes(LINE_DISPATCH)) {
        out = out.replace(LINE_DISPATCH, '');
        mutation.dispatch++;
      }
      if (p === MODEL_TS) {
        if (out.includes(ARM_PO)) { out = out.replace(ARM_PO, ARM_PRZED); mutation.arm++; }
        if (out.includes(EPISEMA_PO)) { out = out.replace(EPISEMA_PO, EPISEMA_PRZED); mutation.episema++; }
      }
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA,
    loader: { '.ts': 'ts' }, plugins: mutate ? [revertFixPlugin] : [],
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
  return page.evaluate(({ nFal, nHie }) => {
    const THREE = window.__THREE;
    const buildUnitModel = window.__buildUnitModel;

    function measureGroup(g) {
      g.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      const qw = new THREE.Quaternion();
      let minY = Infinity, maxY = -Infinity, maxR = 0, meshCount = 0, tri = 0;
      const names = [];
      const box = {};        // nazwa -> {minX,maxX,minY,maxY,minZ,maxZ}
      const corners = {};    // nazwa -> 8 narożników w świecie (do dowolnych rzutów)
      const ctr = {};        // nazwa -> środek bryły w świecie
      const axis = {};       // nazwa -> {x,y,z} lokalne osie części w świecie
      const colors = [];
      g.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
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
        meshCount, names, colors, box, corners, ctr, axis, tri,
        minY, maxY, maxR, height: maxY - minY,
        anchors: g.userData['anchors'] || null,
      };
    }

    const OWNER = 0x3366ee;
    return {
      // ścieżka PO NAZWIE — kategoria celowo BŁĘDNA, żeby wynik zależał
      // wyłącznie od rozpoznania nazwy w buildNamedUnit()
      poNazwie: measureGroup(buildUnitModel('miecznik', OWNER, nFal)),
      // ścieżka „normalna" (kategoria + nazwa)
      pelna: measureGroup(buildUnitModel('falanga', OWNER, nFal)),
      // fallback kategorii — BEZ nazwy
      poKategorii: measureGroup(buildUnitModel('falanga', OWNER)),
      // jednostka, której nowa reguła nazwy NIE ma prawa przechwycić
      hieros: measureGroup(buildUnitModel('super', OWNER, nHie)),
    };
  }, { nFal: NAME_FALANGA, nHie: NAME_HIEROS });
}

// --- drobna algebra w Node (mierzone dane, nie zaszyte liczby) --------------
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const r4 = (x) => (Number.isFinite(+x) ? +(+x).toFixed(4) : x);

/** Najmniejsza odległość odcinka osi A(t)=P+t·d (t∈[0,L]) od prostej (g, kier). */
function minOdlegloscOdProstej(P, d, L, g, kier) {
  let best = Infinity;
  for (let i = 0; i <= 200; i++) {
    const t = (i / 200) * L;
    const A = [P[0] + d[0] * t, P[1] + d[1] * t, P[2] + d[2] * t];
    const w = sub(A, g);
    const proj = dot(w, kier);
    const perp = [w[0] - proj * kier[0], w[1] - proj * kier[1], w[2] - proj * kier[2]];
    best = Math.min(best, Math.hypot(perp[0], perp[1], perp[2]));
  }
  return best;
}

/** Zakres rzutu narożników bryły na oś jednostkową. */
function zakresRzutu(cs, o) {
  let lo = Infinity, hi = -Infinity;
  for (const c of cs) { const p = dot(c, o); lo = Math.min(lo, p); hi = Math.max(hi, p); }
  return { lo, hi, ext: hi - lo };
}

function assertReport(m, soft) {
  const results = [];
  const t = (id, name, cond, detail) => {
    results.push({ id, name, cond: !!cond, detail });
    if (!soft) check(name, cond, detail);
  };
  // Podmiot sekcji (H)/(E) to `pelna` (kategoria 'falanga' + nazwa), a NIE
  // `poNazwie`. Powód: w bundlu PRZED sama mutacja dispatchu sprawia, że
  // `poNazwie` jest w ogóle miecznikiem, więc asercje geometryczne padałyby na
  // BRAKU falangity, a nie na jej faktycznej geometrii — i mutacje kąta ramienia
  // oraz episemy nie byłyby niczym potwierdzone. `pelna` przechodzi fallbackiem
  // kategorii w OBU bundlach, więc (H) mierzy tam realnie starą geometrię.
  const F = m.pelna;
  const jestFalangita = (u) =>
    u.names.includes('falangita-dory-shaft') && u.names.includes('falangita-aspis-face');

  // --- (A) DISPATCH ---------------------------------------------------------
  // A1 jest asercją rozstrzygającą dla całego GOAL-a: kategoria jest celowo
  // błędna („miecznik"), więc falangita może wyjść WYŁĄCZNIE z rozpoznania nazwy.
  t('A1', '(A1) „Falanga" dostaje model falangity PO NAZWIE, przy błędnej kategorii',
    jestFalangita(m.poNazwie), m.poNazwie.names.slice(0, 6));
  t('A2', '(A2) fallback kategorii „falanga" (BEZ nazwy) nadal daje falangitę — zero regresji',
    jestFalangita(m.poKategorii), m.poKategorii.names.slice(0, 6));
  t('A3', '(A3) ścieżka po nazwie i ścieżka po kategorii dają IDENTYCZNĄ bryłę',
    m.poNazwie.meshCount === m.poKategorii.meshCount
    && m.poNazwie.tri === m.poKategorii.tri
    && r4(m.poNazwie.maxY) === r4(m.poKategorii.maxY)
    && r4(m.poNazwie.maxR) === r4(m.poKategorii.maxR),
    { poNazwie: [m.poNazwie.meshCount, m.poNazwie.tri, r4(m.poNazwie.maxY)],
      poKategorii: [m.poKategorii.meshCount, m.poKategorii.tri, r4(m.poKategorii.maxY)] });
  t('A4', '(A4) nowa reguła nazwy NIE przechwytuje „Hieros Lochos" (inna jednostka grecka)',
    !jestFalangita(m.hieros), m.hieros.names.slice(0, 6));

  // --- (H) RELACJE GEOMETRYCZNE — sedno testu ------------------------------
  // Bundle PRZED naprawą zwraca dla „Falangi" model MIECZNIKA, który nie ma
  // kotwic. Podstawiamy wtedy NaN-y zamiast przerywać: każda asercja (H) ma
  // wtedy WYPAŚĆ, i to jest dokładnie to, czego sekcja (B) od niej oczekuje.
  const BRAK = { shoulderX: NaN, shoulderY: NaN, hexR: 1, grip: [NaN, NaN, NaN], spearAxis: [NaN, NaN, NaN] };
  const a = F.anchors || BRAK;
  const upper = F.axis['falangita-arm-right-upper'];
  const bark = [-a.shoulderX, a.shoulderY, 0];

  // H1 — DORY NIE PRZECHODZI PRZEZ WŁASNE RAMIĘ. To jest ten błąd, który
  // znalazł audyt: przed poprawką klirens spadał do 0.0044 przy progu 0.0375.
  const klirens = a && upper
    ? minOdlegloscOdProstej(bark, upper.y, 0.100 * a.hexR, a.grip, a.spearAxis)
    : NaN;
  t('H1', '(H1) drzewce dory NIE przechodzi przez prawe ramię (klirens osi > 0.0375×HEX_R)',
    Number.isFinite(klirens) && klirens > PROG_STYCZNOSCI * a.hexR,
    { klirens: r4(klirens), prog: PROG_STYCZNOSCI });

  // H2 — włócznia jest FAKTYCZNIE trzymana: punkt chwytu leży wewnątrz pięści.
  const piesc = F.box['falangita-arm-right-fist'];
  t('H2', '(H2) punkt chwytu włóczni leży WEWNĄTRZ pięści (broń trzymana, nie zawieszona)',
    piesc && a.grip[0] >= piesc.minX && a.grip[0] <= piesc.maxX
    && a.grip[1] >= piesc.minY && a.grip[1] <= piesc.maxY
    && a.grip[2] >= piesc.minZ && a.grip[2] <= piesc.maxZ,
    { chwyt: a.grip.map(r4), piesc });

  // H3 — sauroter (tylny kolec) idzie W TYŁ I W GÓRĘ ponad bark, i NIE wchodzi
  // w głowę ani w grzebień (rozdzielone w osi X).
  const sauro = F.box['falangita-sauroter'];
  const grot = F.box['falangita-dory-tip'];
  const glowa = F.box['falangita-head'];
  const grzebien = F.box['falangita-crest-hair'];
  t('H3', '(H3) sauroter jest ZA plecami i ponad barkiem, rozdzielony w X od głowy i grzebienia',
    sauro && grot && glowa && grzebien
    && sauro.maxZ < 0 && sauro.minY > a.shoulderY
    && (sauro.maxX < glowa.minX || sauro.minX > glowa.maxX)
    && (sauro.maxX < grzebien.minX || sauro.minX > grzebien.maxX),
    { sauroterZ: [r4(sauro && sauro.minZ), r4(sauro && sauro.maxZ)],
      sauroterY: [r4(sauro && sauro.minY), r4(sauro && sauro.maxY)], bark: r4(a.shoulderY) });

  // H4 — grot jest NAJDALEJ WYSUNIĘTYM PUNKTEM całej figury i celuje w przód
  // i w dół (poza wręcz, units.json: Atak dystansowy = 0).
  let najdalejZ = -Infinity;
  for (const nm of F.names) najdalejZ = Math.max(najdalejZ, F.box[nm].maxZ);
  t('H4', '(H4) grot dory jest najdalej wysuniętym punktem figury i celuje w przód-w dół',
    grot && r4(grot.maxZ) === r4(najdalejZ) && a.spearAxis[2] > 0.9 && a.spearAxis[1] < 0,
    { grotMaxZ: r4(grot && grot.maxZ), najdalejZ: r4(najdalejZ), osWloczni: a.spearAxis.map(r4) });

  // --- ASPIS: baza tarczy brana z SAMEGO MODELU (osie mesh lica) -----------
  const licoAxis = F.axis['falangita-aspis-face'];
  const n = licoAxis ? licoAxis.y : null;   // rotation.x=π/2 => lokalne +Y = normalna tarczy
  const u = licoAxis ? licoAxis.x : null;   // oś tarczy w płaszczyźnie, poziomo
  const w = licoAxis ? licoAxis.z : null;   // oś tarczy w płaszczyźnie, pionowo
  const licoC = F.corners['falangita-aspis-face'];
  const rzutL = licoC && n ? zakresRzutu(licoC, n) : null;   // przód/tył tarczy

  // H5 — LICO ASPIS PATRZY W KAMERĘ. Kamera gry ma stały azymut 0 (camera.ts),
  // więc tarcza z licem w ±X byłaby niewidoczna — dokładnie ten błąd naprawiono
  // w T2 tej serii dla tarczy Gaesatae.
  t('H5', '(H5) lico aspis patrzy w kamerę (|normala · +Z| > 0.9), nie krawędzią',
    n !== null && Math.abs(dot(n, [0, 0, 1])) > 0.9, { normalnaTarczy: n && n.map(r4) });

  // H6 — PORPAX: lewe przedramię jest CAŁKOWICIE ZA polem tarczy.
  // Mierzone NA NORMALNEJ TARCZY, nie na osi Z świata. Aspis jest dyskiem
  // odchylonym o 0.20 rad ku osi ciała, więc jego najdalszy w tył narożnik
  // pudełka osiowego leży przy krawędzi −X — po przeciwnej stronie tarczy niż
  // przedramię. Porównanie pudełek osiowych zestawiałoby więc dwie części,
  // które w ogóle się nie widzą, i dawało wynik na granicy szumu (0.1394 vs
  // 0.1394). Rzut na normalną porównuje to, co trzeba: tył tarczy z przodem
  // przedramienia.
  const przedC = F.corners['falangita-arm-left-fore'];
  const rzutPrzedL = przedC && n ? zakresRzutu(przedC, n) : null;
  t('H6', '(H6) lewe przedramię jest w całości ZA polem aspis (chwyt porpax), nie przecina go',
    rzutPrzedL && rzutL && rzutPrzedL.hi <= rzutL.lo + 1e-9,
    { przedramieNaNormalnej: rzutPrzedL && r4(rzutPrzedL.hi),
      tylTarczy: rzutL && r4(rzutL.lo) });

  // H7 — EPISEMA LEŻY NA TARCZY, nie w powietrzu i nie zatopiona: jej normalna
  // jest równoległa do normalnej tarczy, a rzut na tę normalną WYSTAJE przed lico.
  const epis = F.axis['falangita-aspis-episema'];
  const episC = F.corners['falangita-aspis-episema'];
  const rzutE = episC && n ? zakresRzutu(episC, n) : null;
  t('H7', '(H7) episema jest równoległa do tarczy i WYSTAJE przed jej lico (nie tonie w polu)',
    epis && n && Math.abs(dot(epis.z, n)) > 0.999 && rzutE && rzutL && rzutE.hi > rzutL.hi,
    { normalnaEpisemy: epis && epis.z.map(r4), normalnaTarczy: n && n.map(r4),
      rzutEpisemy: rzutE && r4(rzutE.hi), rzutLica: rzutL && r4(rzutL.hi) });

  // H8 — episema MIEŚCI SIĘ w polu tarczy (nie wychodzi poza rant).
  const rzutEu = episC && u ? zakresRzutu(episC, u) : null;
  const rzutLu = licoC && u ? zakresRzutu(licoC, u) : null;
  const rzutEw = episC && w ? zakresRzutu(episC, w) : null;
  const rzutLw = licoC && w ? zakresRzutu(licoC, w) : null;
  t('H8', '(H8) episema mieści się w obrysie pola tarczy (nie wychodzi poza rant)',
    rzutEu && rzutLu && rzutEw && rzutLw
    && rzutEu.lo >= rzutLu.lo && rzutEu.hi <= rzutLu.hi
    && rzutEw.lo >= rzutLw.lo && rzutEw.hi <= rzutLw.hi,
    { episemaU: [r4(rzutEu && rzutEu.lo), r4(rzutEu && rzutEu.hi)],
      licoU: [r4(rzutLu && rzutLu.lo), r4(rzutLu && rzutLu.hi)] });

  // H9 — GODŁO JEST NEUTRALNE, NIE POLIS-OWE (K7). Dwie miary naraz:
  //   (a) współśrodkowość z polem tarczy — lambda była wyraźnie przesunięta,
  //   (b) symetria obrotowa — lambda ma proporcję ramion ok. 5:1, pierścień 1:1.
  const srodekE = rzutEu && rzutEw ? [(rzutEu.lo + rzutEu.hi) / 2, (rzutEw.lo + rzutEw.hi) / 2] : null;
  const srodekL = rzutLu && rzutLw ? [(rzutLu.lo + rzutLu.hi) / 2, (rzutLw.lo + rzutLw.hi) / 2] : null;
  const mimosrod = srodekE && srodekL
    ? Math.hypot(srodekE[0] - srodekL[0], srodekE[1] - srodekL[1]) : NaN;
  t('H9a', '(H9a) godło na aspis jest WSPÓŁŚRODKOWE z polem tarczy (nie przesunięte jak lambda)',
    Number.isFinite(mimosrod) && mimosrod < 0.010 * a.hexR, { mimosrodowosc: r4(mimosrod) });
  const proporcja = rzutEu && rzutEw && rzutEw.ext > 0
    ? Math.max(rzutEu.ext, rzutEw.ext) / Math.min(rzutEu.ext, rzutEw.ext) : NaN;
  t('H9b', '(H9b) godło na aspis jest symetryczne obrotowo (proporcja < 1.2 — nie litera polis)',
    Number.isFinite(proporcja) && proporcja < 1.2,
    { proporcja: r4(proporcja), ext: [r4(rzutEu && rzutEu.ext), r4(rzutEw && rzutEw.ext)] });

  // H10 — aspis NIE MA UMBA (K7): centralny guz to cecha scutum/tarczy celtyckiej.
  // Mierzone, nie deklarowane: żadna część tarczy nie wystaje przed episemę.
  let najdalejNaNormalnej = -Infinity, ktoNajdalej = null;
  for (const nm of ['falangita-aspis-face', 'falangita-aspis-rim', 'falangita-aspis-episema']) {
    if (!F.corners[nm] || !n) continue;
    const z = zakresRzutu(F.corners[nm], n).hi;
    if (z > najdalejNaNormalnej) { najdalejNaNormalnej = z; ktoNajdalej = nm; }
  }
  t('H10', '(H10) aspis nie ma umba — najdalej wysuniętą częścią tarczy jest płaska episema',
    ktoNajdalej === 'falangita-aspis-episema'
    && !F.names.some((x) => x.includes('umbo') || x.includes('boss')),
    { najdalej: ktoNajdalej });

  // H11 — GRZEBIEŃ WZDŁUŻNY, nie poprzeczny (K4): poprzeczny = oznaka oficera.
  const gh = F.box['falangita-crest-hair'];
  t('H11', '(H11) grzebień helmu biegnie WZDŁUŻ (przód-tył), nie w poprzek — szeregowy, nie oficer',
    gh && (gh.maxZ - gh.minZ) > 2 * (gh.maxX - gh.minX),
    { wzdluz: r4(gh && gh.maxZ - gh.minZ), wszerz: r4(gh && gh.maxX - gh.minX) });

  // H12 — NAGOLENNIKI NA OBU GOLENIACH (K8), obejmujące kostkę.
  const gl = F.box['falangita-leg-left-greave'];
  const gp = F.box['falangita-leg-right-greave'];
  const sl = F.box['falangita-leg-left-foot'];
  const sp = F.box['falangita-leg-right-foot'];
  t('H12', '(H12) nagolenniki są na OBU goleniach i schodzą na kostkę (pełna panoplia)',
    gl && gp && sl && sp && gl.minY <= sl.maxY && gp.minY <= sp.maxY
    && (gl.maxY - gl.minY) > 0.08 * a.hexR && (gp.maxY - gp.minY) > 0.08 * a.hexR,
    { lewy: [r4(gl && gl.minY), r4(gl && gl.maxY)], prawy: [r4(gp && gp.minY), r4(gp && gp.maxY)] });

  // H13 — HELM ZAKRYWA GŁOWĘ I NIESIE SZCZELINĘ OCZNĄ (K4).
  const dzwon = F.box['falangita-helmet-dome'];
  const szcz = F.box['falangita-helmet-slit'];
  t('H13', '(H13) dzwon korynckiego helmu przykrywa czubek głowy, a szczelina oczna leży NA nim',
    dzwon && glowa && szcz && dzwon.maxY > glowa.maxY
    && dzwon.maxX > glowa.maxX && dzwon.minX < glowa.minX
    && szcz.minY > dzwon.minY && szcz.maxY < dzwon.maxY && szcz.maxZ > glowa.maxZ,
    { dzwon: [r4(dzwon && dzwon.minY), r4(dzwon && dzwon.maxY)],
      glowa: [r4(glowa && glowa.minY), r4(glowa && glowa.maxY)] });

  if (soft) return results;

  // --- (E) proporcje względem HEX_R ---------------------------------------
  check('(E1) stopy na y≈0 (minY > -0.01 i < 0.02×HEX_R)', F.minY > -0.01 && F.minY < 0.02, r4(F.minY));
  check('(E2) promień poziomy w twardym limicie heksu (≤0.866×HEX_R)', F.maxR <= 0.866, r4(F.maxR));
  check('(E3) figurka niesie barwę właściciela na polu tarczy', F.colors.includes(0x3366ee));
  check('(E4) budżet trójkątów bez zmian (404 tri — episema zajmuje tyle co lambda)',
    F.tri === 404, F.tri);
  console.log('  [wymiary] Falanga: wysokość=' + F.height.toFixed(3)
    + '×HEX_R, promień=' + F.maxR.toFixed(3) + '×HEX_R, mesh=' + F.meshCount + ', tri=' + F.tri);
  console.log('  [klirens] oś ramienia ↔ oś włóczni = ' + klirens.toFixed(5)
    + '×HEX_R (próg styczności ' + PROG_STYCZNOSCI + ')');

  return results;
}

async function shot(page, file) {
  await page.evaluate(({ nFal }) => {
    const THREE = window.__THREE;
    const build = window.__buildUnitModel;
    document.body.innerHTML = '';
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(900, 460);
    renderer.setClearColor(0x78a7ff, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    document.body.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    // Kamera ustawiona jak w grze: azymut 0, elewacja ~50° (camera.ts:131).
    const camera = new THREE.PerspectiveCamera(32, 900 / 460, 0.1, 20);
    camera.position.set(0, 1.05, 1.35);
    camera.lookAt(0, 0.33, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.68));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(2, 3, 2);
    scene.add(dir);
    // Trzy ujęcia, każde dowodzi czegoś innego i każde MUSI dać się porównać
    // PRZED/PO:
    //  (1) dispatch PO NAZWIE przy błędnej kategorii — PRZED wyjdzie miecznik,
    //  (2) ten sam model z frontu ścieżką kategorii — istnieje w OBU bundlach,
    //  (3) profil od strony BRONI — jedyne ujęcie, na którym widać, czy drzewce
    //      dory idzie obok ramienia, czy przez nie.
    const poNazwie = build('miecznik', 0x3366ee, nFal);
    poNazwie.position.x = -0.34;
    scene.add(poNazwie);
    const front = build('falanga', 0x3366ee);
    front.position.x = 0.02;
    scene.add(front);
    const profil = build('falanga', 0xcc4422);
    profil.position.x = 0.36;
    profil.rotation.y = Math.PI / 2;   // prawy (uzbrojony) bok ku kamerze
    scene.add(profil);
    renderer.render(scene, camera);
    window.__shotReady = true;
  }, { nFal: NAME_FALANGA });
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
  check('(0c) hastati-falangita.ts: sekcja ZGODNOŚĆ HISTORYCZNA z punktami K1-K9',
    /ZGODNOSC HISTORYCZNA/.test(srcModel) && /K1\. LINOTHORAX/.test(srcModel)
    && /K5\. DORY/.test(srcModel) && /K9\. WYKROK/.test(srcModel));
  check('(0d) K7 rozstrzyga kwestię blazonu z uzasadnieniem (Lakedaimon + roster gry)',
    /K7\. ASPIS I EPISEMA/.test(srcModel) && /Lakedaimon/.test(srcModel)
    && /city-names-pools/.test(srcModel) && /Hieros/.test(srcModel));
  check('(0e) naprawa geometrii ramienia udokumentowana z POMIAREM, nie deklaracją',
    /NAPRAWA 2026-08-25/.test(srcModel) && /0\.0044\*HEX_R/.test(srcModel)
    && /1\.32 -> 1\.85/.test(srcModel));
  check('(0f) buildHastati() nietknięty — nadal montefortino + gladius (poza zakresem tematu)',
    /export function buildHastati/.test(srcModel) && /getGNIMontBowl\(\), mGold/.test(srcModel));

  const jF = unitsJson.find((u) => u['Jednostka'] === NAME_FALANGA);
  check('(0g) units.json: Falanga = Epoka Żelazo, Kultura Grecka, Typ Falangite',
    jF !== undefined && jF['Epoka'] === 'Żelazo' && jF['Kultura'] === 'Grecka'
    && jF['Typ'] === 'Falangite',
    jF && { e: jF['Epoka'], k: jF['Kultura'], t: jF['Typ'] });
  check('(0h) units.json: Falanga ma Atak dystansowy=0 — poza dory MUSI być do walki wręcz',
    jF !== undefined && jF['Atak dystansowy'] === 0 && jF['missileAttack'] === 0,
    jF && { d: jF['Atak dystansowy'], m: jF['missileAttack'] });

  // --- (K) przesłanki decyzji o blazonie (K7) — pilnowane w DANYCH ---------
  // Gdyby ktoś kiedyś dodał do gry osobną kulturę/nację/jednostkę „Sparta",
  // uzasadnienie K7 przestałoby obowiązywać i ta sekcja musi to wykryć.
  const civs = JSON.parse(fs.readFileSync(CIVS_JSON, 'utf8'));
  const pools = JSON.parse(fs.readFileSync(POOLS_JSON, 'utf8'));
  const civArr = civs.cywilizacje || civs;
  const greckie = civArr.filter((c) => /grec/i.test(String(c['Cywilizacja'] ?? '')));
  check('(K1) civs.json: istnieje DOKŁADNIE JEDNA cywilizacja grecka (nie osobna Sparta)',
    greckie.length === 1, greckie.map((c) => c['Cywilizacja']));
  const sparta = unitsJson.some((u) => /spart/i.test(
    String(u['Jednostka']) + String(u['Nazwa EN']) + String(u['Kultura']) + String(u['Nacja'])));
  check('(K2) units.json: „Sparta" NIE jest kulturą, nacją ani jednostką',
    sparta === false);
  const grecy = pools['grecy'] || {};
  const miasta = [].concat(grecy['miasta_cywilizacji'] || [], grecy['miasta_panstwa'] || []);
  check('(K3) city-names-pools.json: Sparta jest RÓWNORZĘDNĄ nazwą miasta greckiego (obok Aten i Teb)',
    miasta.includes('Sparta') && miasta.includes('Ateny') && miasta.includes('Teby'),
    { sparta: miasta.includes('Sparta'), ateny: miasta.includes('Ateny'), teby: miasta.includes('Teby') });
  check('(K4) units.json: jedyna grecka jednostka przypisana konkretnej polis jest TEBAŃSKA',
    unitsJson.some((u) => String(u['Jednostka']).includes('Hieros Lochos')));

  fs.writeFileSync(ENTRY, [
    "import * as THREE from 'three';",
    "import { buildUnitModel } from '../src/render/units.ts';",
    'window.__THREE = THREE;',
    'window.__buildUnitModel = buildUnitModel;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_PRZED, true);
  check('(B0) mutacja PRZED cofnęła dispatch, kąt ramienia i episemę (test nie jest pusty)',
    mutation.dispatch === 1 && mutation.arm === 1 && mutation.episema === 1, mutation);
  if (mutation.dispatch !== 1 || mutation.arm !== 1 || mutation.episema !== 1) {
    console.log('\nPRZERWANE: nie udało się odtworzyć stanu sprzed poprawki — kod się przesunął.');
    process.exit(1);
  }

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
    console.log('\n--- (A)/(H)/(E) render PO poprawce ---');
    const after = await renderWith(BUNDLE_PO);
    assertReport(after, false);
    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await shot(page, path.join(SHOTS, 'po-falanga.png'));
    }

    console.log('\n--- (B) mutacja: ten sam kod PRZED naprawą ---');
    const before = await renderWith(BUNDLE_PRZED);
    const soft = assertReport(before, true);
    const DISCRIMINATING = ['A1', 'H1', 'H9a', 'H9b'];
    // Wypisz ZMIERZONE wartości sprzed poprawki — to jest dowód, że asercje
    // czerwienieją na faktycznej starej geometrii, a nie na braku modelu.
    for (const r of soft) {
      if (!DISCRIMINATING.includes(r.id)) continue;
      console.log('  [PRZED] ' + r.id + ' = ' + (r.cond ? 'ZIELONE (źle!)' : 'CZERWONE')
        + (r.detail !== undefined ? ' — ' + JSON.stringify(r.detail) : ''));
    }
    const stillGreen = soft.filter((r) => r.cond && DISCRIMINATING.includes(r.id)).map((r) => r.id);
    check('(B1) na kodzie sprzed poprawki KAŻDA asercja rozstrzygająca pada — test nie jest tautologiczny',
      stillGreen.length === 0, { nadal_zielone: stillGreen });
    check('(B2) PRZED poprawką „Falanga" przy kategorii „miecznik" NIE była falangitą',
      !before.poNazwie.names.includes('falangita-dory-shaft'),
      before.poNazwie.names.slice(0, 6));
    if (SHOTS !== null) await shot(page, path.join(SHOTS, 'przed-falanga.png'));

    check('(F0) zero błędów konsoli/JS w obu renderach', pageErrors.length === 0, pageErrors);
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
    check('(G2) artefakt vite build niesie model falangity (nazwy mesh)', /falangita-aspis/i.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_PO); fs.unlinkSync(BUNDLE_PRZED); } catch (_) {}

  console.log('\nzelazo-falanga-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty PRZED/PO: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
