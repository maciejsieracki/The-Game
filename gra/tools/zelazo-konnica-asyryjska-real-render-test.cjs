'use strict';
/**
 * zelazo-konnica-asyryjska-real-render-test.cjs
 *
 * TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T1.
 *
 * ZGŁOSZENIE: dwie jednostki Żelaza — „Konnica lancowa asyryjska" i „Konnica
 * łucznicza asyryjska" — dostawały identyczny, generyczny model kategorii
 * `konnica` (units.ts, `case 'konnica'`). Łucznik NIE dzierżył łuku (dostawał
 * ten sam model co lancer, z bronią drzewcową) — to realny błąd wizualny, nie
 * tylko brak unikalności. Naprawa: `zelazo-konnica-asyryjska-opus5.ts`
 * (dwa dedykowane buildery) + dwie nowe gałęzie w `buildNamedUnit()`
 * (`units.ts`), stojące PRZED generycznym dopasowaniem `case 'konnica'`.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA: to jest model 3D (Three.js). Jedynym
 * sposobem sprawdzenia, że łucznik faktycznie dzierży łuk (a nie że kod się
 * tylko kompiluje) jest zbudowanie GRUPY w żywym silniku i zmierzenie jej
 * faktycznej struktury (nazwane mesh'e, bounding box), nie odczyt źródła.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (C-031 / R-PROC-AUTOBOT §9 poz. 6a): sekcja (B)
 * buduje DRUGI bundle z odwróconą poprawką (usunięcie DOKŁADNIE dwóch linii
 * dispatchu w `units.ts`, BEZ dotykania plików w repo) i wymaga, żeby
 * asercje rozstrzygające (A1–A4) na tym bundlu ZAPALIŁY SIĘ NA CZERWONO —
 * czyli żeby obie jednostki spadły z powrotem do identycznego, generycznego
 * modelu `case 'konnica'`, dokładnie jak przed tym dispatchem.
 *
 * Usage (z gra/): node tools/zelazo-konnica-asyryjska-real-render-test.cjs
 *   --shots <katalog>   zrzuca PRZED/PO do <katalog>/{przed,po}.png
 *   --dist <index.html> użyj gotowego artefaktu vite zamiast budować go w teście
 *   --skip-vite         pomiń sekcję (E) artefaktu produkcyjnego
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[zelazo-konnica-asyryjska-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-konnica-asyryjska-entry.ts');
const BUNDLE_PO = path.resolve(__dirname, '.zelazo-konnica-asyryjska-bundle.js');
const BUNDLE_PRZED = path.resolve(__dirname, '.zelazo-konnica-asyryjska-bundle-przed.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const RENDER_TS = path.resolve(GRA, 'src', 'render', 'zelazo-konnica-asyryjska-opus5.ts');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');

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

const NAME_LANCOWA = 'Konnica lancowa asyryjska';
const NAME_LUCZNICZA = 'Konnica łucznicza asyryjska';
const NAME_BRONZE = 'Konnica';

const LINE_LANCOWA = "  if (n.includes('konnica lancowa asyryjsk') || n.includes('assyrian lancer')) return buildZelazoKonnicaLancowaAsyryjska(ownerColor_);\n";
const LINE_LUCZNICZA = "  if (n.includes('konnica lucznicza asyryjsk') || n.includes('assyrian horse archer')) return buildZelazoKonnicaLuczniczaAsyryjska(ownerColor_);\n";

/** Odwrócenie poprawki W LOCIE (tylko dla bundla PRZED). Nie dotyka plików w repo. */
const mutation = { applied: 0 };
const revertFixPlugin = {
  name: 'revert-fix',
  setup(build) {
    build.onLoad({ filter: /units\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== UNITS_TS) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      let out = src;
      if (out.includes(LINE_LANCOWA)) { out = out.replace(LINE_LANCOWA, ''); mutation.applied++; }
      if (out.includes(LINE_LUCZNICZA)) { out = out.replace(LINE_LUCZNICZA, ''); mutation.applied++; }
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, mutate) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: mutate ? [revertFixPlugin] : [],
    logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[zelazo-konnica-asyryjska-real-render-test] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Buduje wszystkie warianty i mierzy je w żywym Three.js. */
async function measureAll(page) {
  return page.evaluate(({ nameLancowa, nameLucznicza, nameBronze, acCoat }) => {
    const THREE = window.__THREE;
    const buildUnitModel = window.__buildUnitModel;

    function measureGroup(obj) {
      obj.updateMatrixWorld(true);
      let minY = Infinity, maxY = -Infinity, maxR = 0;
      let meshCount = 0;
      const names = [];
      const v = new THREE.Vector3();
      obj.traverse((o) => {
        if (!o.isMesh) return;
        meshCount++;
        if (o.name) names.push(o.name);
        const geo = o.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        const bb = geo.boundingBox;
        const corners = [
          [bb.min.x, bb.min.y, bb.min.z], [bb.max.x, bb.min.y, bb.min.z],
          [bb.min.x, bb.max.y, bb.min.z], [bb.max.x, bb.max.y, bb.min.z],
          [bb.min.x, bb.min.y, bb.max.z], [bb.max.x, bb.min.y, bb.max.z],
          [bb.min.x, bb.max.y, bb.max.z], [bb.max.x, bb.max.y, bb.max.z],
        ];
        for (const c of corners) {
          v.set(c[0], c[1], c[2]).applyMatrix4(o.matrixWorld);
          if (v.y < minY) minY = v.y;
          if (v.y > maxY) maxY = v.y;
          const r = Math.hypot(v.x, v.z);
          if (r > maxR) maxR = r;
        }
      });
      const matCount = Array.isArray(obj.userData['mats']) ? obj.userData['mats'].length : -1;
      const coatHexes = (obj.userData['mats'] || [])
        .filter((m) => m && m.color)
        .map((m) => m.color.getHex());
      return {
        meshCount, matCount, names, minY, maxY, maxR,
        height: maxY - minY,
        hasAcCoat: coatHexes.includes(acCoat),
      };
    }

    const OWNER = 0x3366ee;
    const lancowa = buildUnitModel('konnica', OWNER, nameLancowa);
    const lucznicza = buildUnitModel('konnica', OWNER, nameLucznicza);
    const generic = buildUnitModel('konnica', OWNER);
    const bronze = buildUnitModel('konnica', OWNER, nameBronze);

    return {
      lancowa: measureGroup(lancowa),
      lucznicza: measureGroup(lucznicza),
      generic: measureGroup(generic),
      bronze: measureGroup(bronze),
    };
  }, {
    nameLancowa: NAME_LANCOWA, nameLucznicza: NAME_LUCZNICZA, nameBronze: NAME_BRONZE,
    acCoat: 0x7a4527,
  });
}

function assertReport(m, soft) {
  const results = [];
  const t = (id, name, cond, detail) => {
    results.push({ id, name, cond: !!cond });
    if (!soft) check(name, cond, detail);
  };

  // --- (A) łucznik dzierży ŁUK, nie broń drzewcową ------------------------
  t('A1', '(A1) Konnica łucznicza ma mesh "ac-lucznicza-bow" (łuk)',
    m.lucznicza.names.includes('ac-lucznicza-bow'), m.lucznicza.names);
  t('A2', '(A2) Konnica łucznicza ma grot strzały i kołczan, ZERO lancy/tarczy',
    m.lucznicza.names.includes('ac-lucznicza-arrow-tip')
    && m.lucznicza.names.includes('ac-lucznicza-quiver')
    && !m.lucznicza.names.some((n) => n.includes('lance') || n.includes('shield')),
    m.lucznicza.names);

  // --- (B) lancer dzierży LANCĘ + TARCZĘ, nie łuk -------------------------
  t('A3', '(A3) Konnica lancowa ma drzewce+grot lancy ORAZ tarczę, ZERO łuku/kołczanu',
    m.lancowa.names.includes('ac-lancowa-lance-shaft')
    && m.lancowa.names.includes('ac-lancowa-lance-head')
    && m.lancowa.names.includes('ac-lancowa-shield')
    && !m.lancowa.names.some((n) => n.includes('bow') || n.includes('quiver')),
    m.lancowa.names);

  // --- (C) obie jednostki odróżnialne od generycznego case 'konnica' -----
  t('A4', '(A4) obie nowe jednostki mają WIĘCEJ mesh niż generyczny fallback (bogatszy model)',
    m.lancowa.meshCount > m.generic.meshCount && m.lucznicza.meshCount > m.generic.meshCount,
    { lancowa: m.lancowa.meshCount, lucznicza: m.lucznicza.meshCount, generic: m.generic.meshCount });

  if (soft) return results;

  // --- (D) odróżnialność od dedykowanej Konnicy (Brąz) --------------------
  check('(D1) maść konia obu nowych jednostek (AC_COAT) NIE występuje w dedykowanej Konnicy Brązu',
    !m.bronze.hasAcCoat, m.bronze.hasAcCoat);
  check('(D2) obie nowe jednostki NIOSĄ własną maść AC_COAT (odróżnialną od Brązu)',
    m.lancowa.hasAcCoat && m.lucznicza.hasAcCoat, { lancowa: m.lancowa.hasAcCoat, lucznicza: m.lucznicza.hasAcCoat });
  check('(D3) lancer i łucznik mają różną liczbę mesh (różne uzbrojenie ramion)',
    m.lancowa.meshCount !== m.lucznicza.meshCount, { lancowa: m.lancowa.meshCount, lucznicza: m.lucznicza.meshCount });

  // --- (E) proporcje względem HEX_R (wzorem serii Opus 5) -----------------
  check('(E1) Konnica lancowa: kopyta na y≈0 (minY < 0.02×HEX_R)', m.lancowa.minY < 0.02, m.lancowa.minY);
  check('(E2) Konnica łucznicza: kopyta na y≈0 (minY < 0.02×HEX_R)', m.lucznicza.minY < 0.02, m.lucznicza.minY);
  check('(E3) Konnica lancowa: promień poziomy w twardym limicie heksu (≤0.866×HEX_R)', m.lancowa.maxR <= 0.866, m.lancowa.maxR);
  check('(E4) Konnica łucznicza: promień poziomy w twardym limicie heksu (≤0.866×HEX_R)', m.lucznicza.maxR <= 0.866, m.lucznicza.maxR);
  console.log('  [wymiary] lancowa: wysokość=' + m.lancowa.height.toFixed(3) + '×HEX_R, promień=' + m.lancowa.maxR.toFixed(3) + '×HEX_R, minY=' + m.lancowa.minY.toFixed(4));
  console.log('  [wymiary] łucznicza: wysokość=' + m.lucznicza.height.toFixed(3) + '×HEX_R, promień=' + m.lucznicza.maxR.toFixed(3) + '×HEX_R, minY=' + m.lucznicza.minY.toFixed(4));

  return results;
}

async function main() {
  // --- (0) statyczne kotwice w źródle -------------------------------------
  const unitsSrc = fs.readFileSync(UNITS_TS, 'utf8');
  const renderSrc = fs.readFileSync(RENDER_TS, 'utf8');
  const unitsJson = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));

  check('(0a) units.ts zawiera dispatch Konnicy lancowej PRZED generycznym `case \'konnica\'`',
    unitsSrc.includes(LINE_LANCOWA.trim()));
  check('(0b) units.ts zawiera dispatch Konnicy łuczniczej PRZED generycznym `case \'konnica\'`',
    unitsSrc.includes(LINE_LUCZNICZA.trim()));
  const idxLancowa = unitsSrc.indexOf(LINE_LANCOWA.trim());
  const idxGenericKonnica = unitsSrc.indexOf("case 'konnica': {");
  check('(0c) dispatch nazwany stoi PRZED generycznym fallbackiem (kolejność w pliku)',
    idxLancowa > -1 && idxGenericKonnica > -1 && idxLancowa < idxGenericKonnica,
    { idxLancowa, idxGenericKonnica });
  check('(0d) render zawiera sekcję ZGODNOŚĆ HISTORYCZNA z punktami Z1-Z9',
    /Z1\./.test(renderSrc) && /Z9\./.test(renderSrc));
  check('(0e) Z1 (brak strzemion) i Z2 (brak siodła z drzewem) są jawnie udokumentowane',
    /BRAK STRZEMION/.test(renderSrc) && /BRAK SIODŁA/.test(renderSrc));

  const jLancowa = unitsJson.find((u) => u['Jednostka'] === NAME_LANCOWA);
  const jLucznicza = unitsJson.find((u) => u['Jednostka'] === NAME_LUCZNICZA);
  check('(0f) units.json: Konnica lancowa ma Atak dystansowy=0 (broń drzewcowa, nie łuk)',
    jLancowa !== undefined && jLancowa['Atak dystansowy'] === 0, jLancowa && jLancowa['Atak dystansowy']);
  check('(0g) units.json: Konnica łucznicza ma Atak dystansowy=6 (jednostka dystansowa — MUSI mieć łuk)',
    jLucznicza !== undefined && jLucznicza['Atak dystansowy'] === 6, jLucznicza && jLucznicza['Atak dystansowy']);
  check('(0h) units.json: obie jednostki Epoka=Żelazo, Kultura=Asyria',
    jLancowa && jLancowa['Epoka'] === 'Żelazo' && jLancowa['Kultura'] === 'Asyria'
    && jLucznicza && jLucznicza['Epoka'] === 'Żelazo' && jLucznicza['Kultura'] === 'Asyria');

  fs.writeFileSync(ENTRY, [
    "import * as THREE from 'three';",
    "import { buildUnitModel } from '../src/render/units.ts';",
    'window.__THREE = THREE;',
    'window.__buildUnitModel = buildUnitModel;',
    '',
  ].join('\n'), 'utf8');

  await buildBundle(BUNDLE_PO, false);
  await buildBundle(BUNDLE_PRZED, true);
  check('(D0) mutacja PRZED faktycznie usunęła OBIE linie dispatchu (test nie jest pusty)',
    mutation.applied === 2, mutation.applied);
  if (mutation.applied !== 2) {
    console.log('\nPRZERWANE: nie udało się odtworzyć stanu sprzed poprawki — kod się przesunął, popraw LINE_LANCOWA/LINE_LUCZNICZA.');
    process.exit(1);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  async function renderWith(bundleFile) {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
    await page.addScriptTag({ path: bundleFile });
    return measureAll(page);
  }

  try {
    console.log('\n--- (A)-(E) render PO poprawce (bundel z niezmienionych źródeł) ---');
    const after = await renderWith(BUNDLE_PO);
    assertReport(after, false);

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.evaluate(({ nameLancowa, nameLucznicza }) => {
        const THREE = window.__THREE;
        const buildUnitModel = window.__buildUnitModel;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(900, 420);
        renderer.setClearColor(0x78a7ff, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        document.body.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 900 / 420, 0.1, 20);
        camera.position.set(0, 1.7, 2.0);
        camera.lookAt(0.2, 0.35, 0);
        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(2, 3, 2);
        scene.add(dir);
        const l = buildUnitModel('konnica', 0x3366ee, nameLancowa);
        l.position.x = -0.55;
        scene.add(l);
        const a = buildUnitModel('konnica', 0xcc4422, nameLucznicza);
        a.position.x = 0.55;
        scene.add(a);
        renderer.render(scene, camera);
        window.__shotReady = true;
      }, { nameLancowa: NAME_LANCOWA, nameLucznicza: NAME_LUCZNICZA });
      await page.waitForFunction('window.__shotReady === true');
      await page.screenshot({ path: path.join(SHOTS, 'po-lancowa-lucznicza.png') });
    }

    console.log('\n--- (B) mutacja: te same jednostki, PRZED naprawą (dispatch nazwany usunięty) ---');
    const before = await renderWith(BUNDLE_PRZED);
    const soft = assertReport(before, true);
    const DISCRIMINATING = ['A1', 'A2', 'A3', 'A4'];
    const stillGreen = soft.filter((r) => r.cond && DISCRIMINATING.includes(r.id)).map((r) => r.id);
    check('(D4) na kodzie sprzed poprawki KAŻDA asercja rozstrzygająca (A1-A4) pada — test nie jest tautologiczny',
      stillGreen.length === 0, { nadal_zielone: stillGreen });
    check('(D5) PRZED poprawką obie jednostki mają DOKŁADNIE tyle samo mesh co generyczny fallback (spadły na wspólny model)',
      before.lancowa.meshCount === before.generic.meshCount && before.lucznicza.meshCount === before.generic.meshCount,
      { lancowa: before.lancowa.meshCount, lucznicza: before.lucznicza.meshCount, generic: before.generic.meshCount });

    if (SHOTS !== null) {
      await page.evaluate(({ nameLancowa, nameLucznicza }) => {
        const THREE = window.__THREE;
        const buildUnitModel = window.__buildUnitModel;
        document.body.innerHTML = '';
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(900, 420);
        renderer.setClearColor(0x78a7ff, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        document.body.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 900 / 420, 0.1, 20);
        camera.position.set(0, 1.7, 2.0);
        camera.lookAt(0.2, 0.35, 0);
        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        dir.position.set(2, 3, 2);
        scene.add(dir);
        const l = buildUnitModel('konnica', 0x3366ee, nameLancowa);
        l.position.x = -0.55;
        scene.add(l);
        const a = buildUnitModel('konnica', 0xcc4422, nameLucznicza);
        a.position.x = 0.55;
        scene.add(a);
        renderer.render(scene, camera);
        window.__shotReady2 = true;
      }, { nameLancowa: NAME_LANCOWA, nameLucznicza: NAME_LUCZNICZA });
      await page.waitForFunction('window.__shotReady2 === true');
      await page.screenshot({ path: path.join(SHOTS, 'przed-oba-generyczne.png') });
    }

    check('(F0) zero błędów konsoli/JS w obu renderach', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close();
  }

  // --- (G) artefakt PRODUKCYJNY vite build (C-001) ------------------------
  if (!SKIP_VITE) {
    let dist = DIST_ARG;
    if (dist === null) {
      const outDir = path.join(os.tmpdir(), 'civ-zelazo-t1-render-dist');
      execFileSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'],
        { cwd: GRA, stdio: 'ignore' });
      dist = path.join(outDir, 'index.html');
    }
    const built = fs.readFileSync(dist, 'utf8');
    check('(G1) artefakt vite build niesie ciąg rozpoznawania "assyrian lancer"',
      /assyrian lancer/i.test(built));
    check('(G2) artefakt vite build niesie ciąg rozpoznawania "assyrian horse archer"',
      /assyrian horse archer/i.test(built));
  } else {
    console.log('SKIP: (G) sekcja artefaktu vite build pominięta (--skip-vite)');
  }

  try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE_PO); fs.unlinkSync(BUNDLE_PRZED); } catch (_) {}

  console.log('\nzelazo-konnica-asyryjska-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzuty PRZED/PO: ' + SHOTS);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
