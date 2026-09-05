'use strict';
/**
 * zelazo-celtowie-soldurii-gaesatae-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T2.
 *
 * ZGŁOSZENIE: dwie jednostki Żelaza kultury Celtowie — „Soldurii" i „Gaesatae" —
 * renderowały się IDENTYCZNYM modelem `buildCeltWarrior()` (`units.ts`, dwie
 * sąsiadujące linie dispatchu). Kompletna funkcja `buildGaesatae()` już istniała
 * w pliku, ale NIGDY nie była wywoływana — martwy kod.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA: to są modele 3D (Three.js). Jedynym sposobem
 * sprawdzenia, że tarcza faktycznie patrzy LICEM do kamery (a nie że kod się
 * kompiluje), jest zbudowanie grupy w żywym silniku i zmierzenie jej faktycznej
 * geometrii — orientacji, rozmiarów i wzajemnych relacji części.
 *
 * SEKCJA (H) — SEDNO TEGO TESTU. Lekcja z rundy 2 tematu T1: asercje mierzące
 * NAZWY mesh i pudełko ZBIORCZE świecą na zielono nawet wtedy, gdy broń
 * przechodzi na wylot przez własne ciało. Tu było analogicznie — audyt
 * istniejącego `buildGaesatae()` znalazł (pomiarem w żywym Three.js, nie
 * czytaniem źródła) cztery twarde błędy geometryczne, których nie widać ani
 * w liczbie mesh, ani w bryle zbiorczej:
 *
 *   1. TARCZA NIEWIDOCZNA. `addTallOvalShield` używało `rotation.z = π/2`,
 *      przez co LICO tarczy patrzyło w bok (±X). Kamera gry ma stały azymut 0
 *      (`camera.ts:131`), więc widziała tarczę DOKŁADNIE KRAWĘDZIĄ. Pomiar
 *      PRZED: rozmiar w świecie [0.0166, 0.156, 0.296]×HEX_R — 0.0166
 *      szerokości, 0.296 głębokości. Dokładnie ten sam błąd naprawiono
 *      2026-08-06 dla tarczy hide w tym samym pliku; poprawka nigdy nie
 *      trafiła do TEGO helpera. Dotyczyło OBU jednostek tematu.
 *   2. SPINA W POWIETRZU. Pionowa spina tarczy ma 0.255 wysokości, a tarcza
 *      miała w osi Y tylko 0.156 — spina wystawała 0.0495 nad i pod tarczę.
 *   3. WŁÓCZNIA KRÓTSZA OD WOJOWNIKA. Czubek grotu Gaesatae sięgał y=0.5655,
 *      przy czubku głowy y=0.58 — broń nie wystawała ponad sylwetkę tokena.
 *   4. HEŁM ŚCINAJĄCY OCZY (znaleziony przy budowie Soldurii). Dolna krawędź
 *      czaszy wypadała na y=0.527, przy górze oczu y=0.5325.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (R-PROC-AUTOBOT.md §9 poz. 6a): sekcja (B) buduje
 * DRUGI bundle, w którym cofnięto W LOCIE (bez dotykania plików w repo) dwie
 * linie dispatchu ORAZ orientację tarczy — i wymaga, żeby KAŻDA asercja
 * rozstrzygająca zapaliła się na czerwono.
 *
 * Usage (z gra/): node tools/zelazo-celtowie-soldurii-gaesatae-real-render-test.cjs
 *   --shots <katalog>   zrzuca PRZED/PO do <katalog>/{przed,po}-*.png
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
  console.error('[zelazo-celtowie-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-celtowie-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.zelazo-celtowie-bundle.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.zelazo-celtowie-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');
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

const NAME_SOLDURII = 'Soldurii';
const NAME_GAESATAE = 'Gaesatae';
const NAME_CELT = 'Wojownik celtycki';

const LINE_SOLDURII = "  if (n.includes('soldurii') || n.includes('soldur')) return buildSoldurii(ownerColor_);";
const LINE_GAESATAE = "  if (n.includes('gaesatae')) return buildGaesatae(ownerColor_);";
const SHIELD_ROT_PO = '  mShield.rotation.x = Math.PI / 2;';
const BOSS_ROT_PO = '  mB.rotation.x = Math.PI / 2;';

/**
 * Odwrócenie poprawki W LOCIE (tylko dla bundla PRZED). Nie dotyka plików repo.
 * Cofa DOKŁADNIE to, co ten temat naprawił: (1) oba dispatche wracają na wspólny
 * `buildCeltWarrior()`, (2) tarcza wraca na `rotation.z` (lico w bok).
 */
const mutation = { dispatch: 0, shield: 0 };
const revertFixPlugin = {
  name: 'revert-fix',
  setup(build) {
    build.onLoad({ filter: /units\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== UNITS_TS) return null;
      let out = fs.readFileSync(args.path, 'utf8');
      if (out.includes(LINE_SOLDURII)) {
        out = out.replace(LINE_SOLDURII,
          "  if (n.includes('soldurii') || n.includes('soldur')) return buildCeltWarrior(ownerColor_);");
        mutation.dispatch++;
      }
      if (out.includes(LINE_GAESATAE)) {
        out = out.replace(LINE_GAESATAE,
          "  if (n.includes('gaesatae')) return buildCeltWarrior(ownerColor_);");
        mutation.dispatch++;
      }
      if (out.includes(SHIELD_ROT_PO)) {
        out = out.replace(SHIELD_ROT_PO, '  mShield.rotation.z = Math.PI / 2;');
        mutation.shield++;
      }
      if (out.includes(BOSS_ROT_PO)) {
        out = out.replace(BOSS_ROT_PO, '  mB.rotation.z = Math.PI / 2;');
        mutation.shield++;
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
    console.log('[zelazo-celtowie-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Buduje warianty i mierzy je w żywym Three.js. */
async function measureAll(page) {
  return page.evaluate(({ nSold, nGaes, nCelt }) => {
    const THREE = window.__THREE;
    const buildUnitModel = window.__buildUnitModel;

    function measureGroup(g) {
      g.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      const CORNERS = (bb) => [
        [bb.min.x, bb.min.y, bb.min.z], [bb.max.x, bb.min.y, bb.min.z],
        [bb.min.x, bb.max.y, bb.min.z], [bb.max.x, bb.max.y, bb.min.z],
        [bb.min.x, bb.min.y, bb.max.z], [bb.max.x, bb.min.y, bb.max.z],
        [bb.min.x, bb.max.y, bb.max.z], [bb.max.x, bb.max.y, bb.max.z],
      ];
      let minY = Infinity, maxY = -Infinity, maxR = 0, meshCount = 0;
      const names = [];
      const box = {};      // nazwa -> {minX,maxX,minY,maxY,minZ,maxZ}
      const axis = {};     // nazwa -> lokalne +Y części w świecie (oś walca/pudełka)
      const colors = [];
      const qw = new THREE.Quaternion();
      g.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
        if (o.material && o.material.color) colors.push(o.material.color.getHex());
        const geo = o.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        const cs = CORNERS(geo.boundingBox);
        let b = null;
        for (const c of cs) {
          v.set(c[0], c[1], c[2]).applyMatrix4(o.matrixWorld);
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
          o.getWorldQuaternion(qw);
          axis[o.name] = new THREE.Vector3(0, 1, 0).applyQuaternion(qw).toArray();
        }
      });
      return {
        meshCount, names, colors, box, axis,
        minY, maxY, maxR, height: maxY - minY,
        anchors: g.userData['anchors'] || null,
      };
    }

    const OWNER = 0x3366ee;
    return {
      soldurii: measureGroup(buildUnitModel('miecznik', OWNER, nSold)),
      gaesatae: measureGroup(buildUnitModel('miecznik', OWNER, nGaes)),
      celt: measureGroup(buildUnitModel('miecznik', OWNER, nCelt)),
    };
  }, { nSold: NAME_SOLDURII, nGaes: NAME_GAESATAE, nCelt: NAME_CELT });
}

function assertReport(m, soft) {
  const results = [];
  const t = (id, name, cond, detail) => {
    results.push({ id, name, cond: !!cond });
    if (!soft) check(name, cond, detail);
  };
  const ext = (b) => (b ? [b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ] : null);
  const dot = (a, b) => (a && b ? a[0] * b[0] + a[1] * b[1] + a[2] * b[2] : NaN);
  const r4 = (x) => +(+x).toFixed(4);

  // --- (A) każda jednostka ma SWOJE, rozłączne części ----------------------
  t('A1', '(A1) Gaesatae ma włócznię (gaesum) i ZERO miecza',
    m.gaesatae.names.includes('gaesatae-spear-shaft')
    && m.gaesatae.names.includes('gaesatae-spear-tip')
    && !m.gaesatae.names.some((n) => n.includes('sword')),
    m.gaesatae.names);
  t('A2', '(A2) Soldurii ma miecz, kolczugę i hełm, ZERO włóczni',
    m.soldurii.names.includes('soldurii-sword-blade')
    && m.soldurii.names.includes('soldurii-mail')
    && m.soldurii.names.includes('soldurii-helmet')
    && !m.soldurii.names.some((n) => n.includes('spear')),
    m.soldurii.names);
  t('A3', '(A3) Gaesatae ma nagie nogi i złote naramienniki, ZERO kolczugi/hełmu',
    m.gaesatae.names.includes('gaesatae-bare-leg')
    && m.gaesatae.names.includes('gaesatae-armlet')
    && !m.gaesatae.names.some((n) => n.includes('mail') || n.includes('helmet')),
    m.gaesatae.names);
  t('A4', '(A4) Soldurii i Gaesatae to RÓŻNE bryły (różna liczba mesh)',
    m.soldurii.meshCount !== m.gaesatae.meshCount,
    { soldurii: m.soldurii.meshCount, gaesatae: m.gaesatae.meshCount });

  // --- (H) RELACJE GEOMETRYCZNE — sedno testu -----------------------------
  for (const u of ['soldurii', 'gaesatae']) {
    const face = m[u].box[u + '-shield-face'];
    const fAxis = m[u].axis[u + '-shield-face'];
    const spine = m[u].box[u + '-shield-spine'];
    const boss = m[u].box[u + '-shield-boss'];
    const armL = m[u].box[u + '-arm-left'];
    const e = ext(face);

    // H1 — lico tarczy patrzy w KAMERĘ (+Z), nie w bok. Kamera gry ma stały
    // azymut 0, więc tarcza z licem w ±X jest niewidoczna (błąd sprzed poprawki).
    t(u + '-H1', '(H1/' + u + ') lico tarczy patrzy w kamerę (|oś lica · +Z| > 0.99), nie krawędzią',
      Number.isFinite(dot(fAxis, [0, 0, 1])) && Math.abs(dot(fAxis, [0, 0, 1])) > 0.99,
      { osLica: fAxis });

    // H2 — tarcza jest WYSOKA i WĄSKA i CIENKA: wysokość > szerokość > grubość.
    // Przed poprawką: [0.0166, 0.156, 0.296] — najkrótszy bok był szerokością.
    t(u + '-H2', '(H2/' + u + ') tarcza jest wysoka > szeroka > cienka (owalna tarcza tułowiowa)',
      e !== null && e[1] > e[0] && e[0] > e[2],
      { szerokosc: r4(e && e[0]), wysokosc: r4(e && e[1]), grubosc: r4(e && e[2]) });

    // H3 — spina mieści się W PIONOWYM ZAKRESIE tarczy (nie wisi w powietrzu).
    t(u + '-H3', '(H3/' + u + ') pionowa spina mieści się w obrysie tarczy (nie wystaje nad/pod nią)',
      face && spine && spine.minY >= face.minY - 1e-6 && spine.maxY <= face.maxY + 1e-6,
      { spina: [r4(spine && spine.minY), r4(spine && spine.maxY)],
        tarcza: [r4(face && face.minY), r4(face && face.maxY)] });

    // H4 — umbo WYSTAJE PRZED lico tarczy (wybrzusza się ku kamerze).
    t(u + '-H4', '(H4/' + u + ') umbo wystaje PRZED lico tarczy (ku kamerze), nie tkwi w jej płaszczyźnie',
      face && boss && boss.maxZ > face.maxZ,
      { umboMaxZ: r4(boss && boss.maxZ), licoMaxZ: r4(face && face.maxZ) });

    // H5 — tarcza jest PRZED lewym przedramieniem, nie przechodzi przez nie.
    t(u + '-H5', '(H5/' + u + ') tarcza jest PRZED lewym przedramieniem, nie przecina go',
      face && armL && face.minZ > armL.maxZ,
      { tarczaMinZ: r4(face && face.minZ), ramieMaxZ: r4(armL && armL.maxZ) });
  }

  // H6/H7 — broń WYSTAJE PONAD SYLWETKĘ. Punkt odniesienia (czubek głowy) jest
  // brany z SAMEGO MODELU (userData.anchors), nie wpisany liczbowo.
  const gTip = m.gaesatae.box['gaesatae-spear-tip'];
  const gHead = m.gaesatae.anchors && m.gaesatae.anchors.headTopY;
  t('H6', '(H6) grot gaesum Gaesatae wystaje PONAD czubek głowy (broń czytelna w sylwetce)',
    gTip && Number.isFinite(gHead) && gTip.maxY > gHead,
    { grotMaxY: r4(gTip && gTip.maxY), czubekGlowy: r4(gHead) });

  const sBlade = m.soldurii.box['soldurii-sword-blade'];
  const sHead = m.soldurii.anchors && m.soldurii.anchors.headTopY;
  t('H7', '(H7) czubek miecza Soldurii wystaje PONAD czubek głowy',
    sBlade && Number.isFinite(sHead) && sBlade.maxY > sHead,
    { mieczMaxY: r4(sBlade && sBlade.maxY), czubekGlowy: r4(sHead) });

  // H8 — hełm Soldurii siedzi NA głowie i NIE ścina oczu.
  const helm = m.soldurii.box['soldurii-helmet'];
  const eyeTop = m.soldurii.anchors && m.soldurii.anchors.eyeTopY;
  t('H8', '(H8) czasza hełmu Soldurii siedzi nad oczami (nie ścina ich) i przykrywa czubek głowy',
    helm && Number.isFinite(eyeTop) && Number.isFinite(sHead)
    && helm.minY >= eyeTop && helm.maxY > sHead,
    { helmMinY: r4(helm && helm.minY), goraOczu: r4(eyeTop), helmMaxY: r4(helm && helm.maxY), czubekGlowy: r4(sHead) });

  // H9 — nakładka nagiej nogi Gaesatae W PEŁNI kryje ciemną nogawkę awatara.
  const bare = m.gaesatae.box['gaesatae-bare-leg'];
  const aG = m.gaesatae.anchors;
  t('H9', '(H9) nakładka nagiej nogi Gaesatae w PEŁNI kryje nogawkę (brak ciemnego rantu u kostki i biodra)',
    bare && aG && bare.minY <= aG.legBotY + 1e-6 && bare.maxY >= aG.legTopY - 1e-6,
    { nakladka: [r4(bare && bare.minY), r4(bare && bare.maxY)],
      nogawka: [r4(aG && aG.legBotY), r4(aG && aG.legTopY)] });

  if (soft) return results;

  // --- (D) odróżnialność ---------------------------------------------------
  const SKIN = 0xe0ac69, GOLD = 0xe0b53a, MAIL = 0x8d97a3, BRONZE = 0xcf9234;
  check('(D1) Gaesatae niesie ZŁOTO (torc + naramienniki), Soldurii NIE',
    m.gaesatae.colors.includes(GOLD) && !m.soldurii.colors.includes(GOLD));
  check('(D2) Soldurii niesie KOLCZUGĘ i BRĄZ (hełm + torc), Gaesatae NIE kolczugi',
    m.soldurii.colors.includes(MAIL) && m.soldurii.colors.includes(BRONZE)
    && !m.gaesatae.colors.includes(MAIL));
  check('(D3) Gaesatae ma WIĘCEJ powierzchni w barwie skóry niż Soldurii (nagość)',
    m.gaesatae.colors.filter((c) => c === SKIN).length
      > m.soldurii.colors.filter((c) => c === SKIN).length,
    { gaesatae: m.gaesatae.colors.filter((c) => c === SKIN).length,
      soldurii: m.soldurii.colors.filter((c) => c === SKIN).length });
  check('(D4) obie jednostki różnią się od „Wojownika celtyckiego" (nie są już jego kopią)',
    m.soldurii.meshCount !== m.celt.meshCount && m.gaesatae.meshCount !== m.celt.meshCount,
    { soldurii: m.soldurii.meshCount, gaesatae: m.gaesatae.meshCount, celt: m.celt.meshCount });
  check('(D5) obie jednostki niosą barwę właściciela (czytelność przynależności na mapie)',
    m.soldurii.colors.includes(0x3366ee) && m.gaesatae.colors.includes(0x3366ee));

  // --- (E) proporcje względem HEX_R ---------------------------------------
  for (const [k, u] of [['Soldurii', m.soldurii], ['Gaesatae', m.gaesatae]]) {
    check('(E/' + k + ') stopy na y≈0 (minY > -0.01 i < 0.02×HEX_R)', u.minY > -0.01 && u.minY < 0.02, u.minY);
    check('(E/' + k + ') promień poziomy w twardym limicie heksu (≤0.866×HEX_R)', u.maxR <= 0.866, u.maxR);
    console.log('  [wymiary] ' + k + ': wysokość=' + u.height.toFixed(3)
      + '×HEX_R, promień=' + u.maxR.toFixed(3) + '×HEX_R, mesh=' + u.meshCount);
  }

  return results;
}

async function shot(page, file) {
  await page.evaluate(({ nSold, nGaes }) => {
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
    const s = build('miecznik', 0x3366ee, nSold); s.position.x = -0.30; scene.add(s);
    const g = build('miecznik', 0xcc4422, nGaes); g.position.x = 0.30; scene.add(g);
    renderer.render(scene, camera);
    window.__shotReady = true;
  }, { nSold: NAME_SOLDURII, nGaes: NAME_GAESATAE });
  await page.waitForFunction('window.__shotReady === true');
  await page.screenshot({ path: file });
  await page.evaluate(() => { window.__shotReady = false; });
}

async function main() {
  // --- (0) statyczne kotwice w źródle -------------------------------------
  const src = fs.readFileSync(UNITS_TS, 'utf8');
  const unitsJson = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));

  check('(0a) units.ts: Soldurii woła buildSoldurii() (nie współdzielony buildCeltWarrior)',
    src.includes(LINE_SOLDURII));
  check('(0b) units.ts: Gaesatae woła buildGaesatae() — martwy kod jest już wpięty',
    src.includes(LINE_GAESATAE));
  check('(0c) units.ts: „Wojownik celtycki" NADAL woła buildCeltWarrior() (zero regresji)',
    src.includes("if (n.includes('wojownik celtycki') || (n.includes('celtyck') && n.includes('wojownik'))) return buildCeltWarrior(ownerColor_);"));
  check('(0d) units.ts: sekcja ZGODNOŚĆ HISTORYCZNA Gaesatae z punktami K1-K7',
    /K1\. NAGOŚĆ/.test(src) && /K4\. GAESUM/.test(src) && /K7\. TARCZA OWALNA/.test(src));
  check('(0e) units.ts: sekcja ZGODNOŚĆ HISTORYCZNA Soldurii z punktami S1-S8',
    /S1\. KIM BYLI/.test(src) && /S3\. KOLCZUGA/.test(src) && /S8\. SPODNIE I BUTY/.test(src));
  check('(0f) K5 dokumentuje decyzję o pozie wobec „Atak dystansowy = 0" (nie „bo tak ładniej")',
    /K5\. POZA/.test(src) && /missileAttack/.test(src) && /Atak dystansowy/.test(src));
  check('(0g) naprawa orientacji tarczy jest udokumentowana z powodem i pomiarem',
    /NAPRAWA 2026-08-25/.test(src) && /rotation\.x = π\/2/.test(src) && /azymut 0/.test(src));

  const jS = unitsJson.find((u) => u['Jednostka'] === NAME_SOLDURII);
  const jG = unitsJson.find((u) => u['Jednostka'] === NAME_GAESATAE);
  check('(0h) units.json: Gaesatae ma Atak dystansowy=0 — poza włóczni MUSI być do walki wręcz',
    jG !== undefined && jG['Atak dystansowy'] === 0 && jG['missileAttack'] === 0,
    jG && { d: jG['Atak dystansowy'], m: jG['missileAttack'] });
  check('(0i) units.json: obie jednostki Epoka=Żelazo, Kultura=Celtowie',
    jS && jS['Epoka'] === 'Żelazo' && jS['Kultura'] === 'Celtowie'
    && jG && jG['Epoka'] === 'Żelazo' && jG['Kultura'] === 'Celtowie',
    { soldurii: jS && [jS['Epoka'], jS['Kultura']], gaesatae: jG && [jG['Epoka'], jG['Kultura']] });

  fs.writeFileSync(ENTRY, [
    "import * as THREE from 'three';",
    "import { buildUnitModel } from '../src/render/units.ts';",
    'window.__THREE = THREE;',
    'window.__buildUnitModel = buildUnitModel;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_PRZED, true);
  check('(B0) mutacja PRZED cofnęła 2 linie dispatchu i 2 rotacje tarczy (test nie jest pusty)',
    mutation.dispatch === 2 && mutation.shield === 2, mutation);
  if (mutation.dispatch !== 2 || mutation.shield !== 2) {
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
    console.log('\n--- (A)/(H)/(D)/(E) render PO poprawce ---');
    const after = await renderWith(BUNDLE_PO);
    assertReport(after, false);
    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await shot(page, path.join(SHOTS, 'po-soldurii-gaesatae.png'));
    }

    console.log('\n--- (B) mutacja: ten sam kod PRZED naprawą ---');
    const before = await renderWith(BUNDLE_PRZED);
    const soft = assertReport(before, true);
    const DISCRIMINATING = [
      'A1', 'A2', 'A3', 'A4',
      'soldurii-H1', 'soldurii-H2', 'soldurii-H3', 'soldurii-H5',
      'gaesatae-H1', 'gaesatae-H2', 'gaesatae-H3', 'gaesatae-H5',
      'H6', 'H8', 'H9',
    ];
    const stillGreen = soft.filter((r) => r.cond && DISCRIMINATING.includes(r.id)).map((r) => r.id);
    check('(B1) na kodzie sprzed poprawki KAŻDA asercja rozstrzygająca pada — test nie jest tautologiczny',
      stillGreen.length === 0, { nadal_zielone: stillGreen });
    check('(B2) PRZED poprawką Soldurii i Gaesatae mają DOKŁADNIE tę samą bryłę (były kopią)',
      before.soldurii.meshCount === before.gaesatae.meshCount
      && before.soldurii.meshCount === before.celt.meshCount,
      { soldurii: before.soldurii.meshCount, gaesatae: before.gaesatae.meshCount, celt: before.celt.meshCount });
    if (SHOTS !== null) await shot(page, path.join(SHOTS, 'przed-oba-identyczne.png'));

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
      const outDir = path.join(os.tmpdir(), `civ-zelazo-t2-render-dist-${TMPDIR_RUN_ID}`);
      execFileSync(process.execPath, [VITE_BIN, 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(G1) artefakt vite build niesie dispatch buildSoldurii', /soldurii/i.test(built));
    check('(G2) artefakt vite build niesie dispatch buildGaesatae', /gaesatae/i.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_PO); fs.unlinkSync(BUNDLE_PRZED); } catch (_) {}

  console.log('\nzelazo-celtowie-soldurii-gaesatae-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty PRZED/PO: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
