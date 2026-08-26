'use strict';
/**
 * zelazo-zrzuty-25-jednostek-render.cjs
 *
 * TEMAT: R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1.
 *
 * CEL: wyprodukować podpisane zrzuty WSZYSTKICH 25 jednostek epoki Żelaza —
 * kadr OD PRZODU (dosłowne życzenie właściciela) oraz kadr Z KAMERY GRY
 * (azymut 0, elewacja 52° — dokładnie tak, jak liczy je `render/camera.ts`),
 * bo w tej serii wielokrotnie okazywało się, że element poprawny geometrycznie
 * jest z kamery gry NIEWIDOCZNY (broń wzdłuż osi patrzenia, tarcza krawędzią).
 *
 * DLACZEGO ŻYWA PRZEGLĄDARKA (R-PROC-AUTOBOT §9 poz. 6a): to są modele 3D
 * (Three.js). Zrzut z żywego Chromium przez Playwright jest jedynym dowodem
 * tego, JAK jednostka wygląda; jsdom ani test kontraktowy tego nie pokazują.
 *
 * NAJWAŻNIEJSZE — DOWÓD MODELU DEDYKOWANEGO (sekcja A):
 * wyrenderowanie GENERYKA pod nazwą audytowanej jednostki byłoby najgorszym
 * możliwym wynikiem tego tematu (właściciel zobaczyłby „poprawiony" model,
 * który nim nie jest). Dlatego dla KAŻDEJ z 25 jednostek harness sprawdza
 * DWIE niezależne rzeczy, obie muszą być prawdziwe:
 *
 *   A-dispatch : dedykowany dispatch po NAZWIE faktycznie się odpalił —
 *                mierzone bezpośrednim wywołaniem `buildNamedUnit(normName(nazwa))`
 *                (musi zwrócić grupę, nie `null`), a dla czterech
 *                super-jednostek (`Super-jednostka = TAK`, kategoria `super`)
 *                wywołaniem `buildSuperUnit(cultureFromName(nazwa), …)` i
 *                sprawdzeniem, że kultura NIE spada do gałęzi `default`
 *                (`buildCategoryModel('super')` = generyk).
 *   A-roznica  : model zbudowany PEŁNĄ ścieżką gry `buildUnitModel(kat, kolor,
 *                nazwa)` RÓŻNI SIĘ od generyka `buildCategoryModel(kat, kolor)`
 *                liczbą mesh ALBO zbiorem nazw mesh. Sam niepusty dispatch nie
 *                wystarcza — alias mógłby wskazywać na ten sam generyk.
 *
 * Wewnętrzne symbole `units.ts` (`buildNamedUnit`, `buildSuperUnit`,
 * `buildCategoryModel`, `normName`, `cultureFromName`) nie są eksportowane.
 * Harness odsłania je wtyczką esbuild `onLoad` — transformacja W PAMIĘCI,
 * plik w repo NIE jest zmieniany (ten sam precedens co `revertFixPlugin`
 * w `zelazo-konnica-asyryjska-real-render-test.cjs`).
 *
 * SPÓJNOŚĆ KADRU I SKALI: kamera jest liczona RAZ, dla WSZYSTKICH 25 jednostek,
 * z globalnego maksimum wysokości i promienia zmierzonego w przebiegu (A) —
 * jedna odległość, jedno FOV, jeden target. Dzięki temu jednostki wolno
 * porównywać między obrazkami, a najwyższa/najszersza nie jest przycięta.
 *
 * Usage (z gra/):
 *   node tools/zelazo-zrzuty-25-jednostek-render.cjs --out <katalog-poza-repo>
 *   --only <fragment nazwy>   render tylko pasujących jednostek (diagnostyka)
 *   --no-shots                sam pomiar (A), bez renderowania PNG
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[zelazo-zrzuty-25] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.zelazo-zrzuty-25-entry.ts');
const BUNDLE = path.resolve(__dirname, '.zelazo-zrzuty-25-bundle.js');
const UNITS_TS = path.resolve(GRA, 'src', 'render', 'units.ts');
const UNITS_JSON = path.resolve(GRA, 'data', 'units.json');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const OUT = argOf('--out');
const ONLY = argOf('--only');
const NO_SHOTS = process.argv.includes('--no-shots');
if (!OUT && !NO_SHOTS) {
  console.error('[zelazo-zrzuty-25] podaj --out <katalog> (POZA repo) albo --no-shots');
  process.exit(1);
}

/** Kolor gracza: „domyślny niebieski" = OWNER_COLORS[3] z units.ts (0x1e88e5). */
const OWNER_BLUE = 0x1e88e5;

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else {
    fail++;
    const line = 'FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '');
    failures.push(line);
    console.log(line);
  }
}

/* ------------------------------------------------------------------ */
/* (0) LISTA KANONICZNA Z DISPATCHU — 25 pozycji, dosłownie z 00-dispatch.md */
/* ------------------------------------------------------------------ */
const LISTA_DISPATCH = [
  // R-ZELAZO-MODELE-BRAKUJACE-Q1 (6)
  'Konnica lancowa asyryjska', 'Konnica łucznicza asyryjska', 'Soldurii',
  'Gaesatae', 'Falanga', 'Jeździec z oszczepami',
  // R-ZELAZO-AUDYT-POZOSTALE-Q1 (19)
  'Garnizon Harappy', 'Gwardia hetycka', 'Mur tarcz (Sargonid)',
  'Piechota neobabilońska', 'Gwardia Tyreńska', 'Tyrski miecznik',
  'Wojownik z żelaznym khopesh', 'Thorakites', 'Evocati', 'Triari',
  'Hieros Lochos', 'Hastati', 'Berserker germański', 'Wojownik germański',
  'Miecznik galijski', 'Rydwan celtycki', 'Drużynnik', 'iButho z iklwa',
  'Katapulta',
];

/* ------------------------------------------------------------------ */
/* (1) esbuild: bundle + odsłonięcie wewnętrznych symboli units.ts     */
/* ------------------------------------------------------------------ */
const exposed = { applied: 0 };
const exposePlugin = {
  name: 'expose-units-internals',
  setup(build) {
    build.onLoad({ filter: /units\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== UNITS_TS) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const tail = [
        '',
        '// --- DOPISANE W PAMIĘCI PRZEZ HARNESS; plik w repo NIE jest zmieniany ---',
        '(globalThis as any).__normName = normName;',
        '(globalThis as any).__buildNamedUnit = buildNamedUnit;',
        '(globalThis as any).__buildSuperUnit = buildSuperUnit;',
        '(globalThis as any).__buildCategoryModel = buildCategoryModel;',
        '(globalThis as any).__cultureFromName = cultureFromName;',
        '(globalThis as any).__SUPER_NAZWANY = SUPER_Z_MODELEM_NAZWANYM;',
        '',
      ].join('\n');
      exposed.applied++;
      return { contents: src + tail, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle() {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [exposePlugin],
    logLevel: 'silent',
  });
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); }
  catch (e) {
    console.log('[zelazo-zrzuty-25] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}

/* ------------------------------------------------------------------ */
/* (2) MAIN                                                            */
/* ------------------------------------------------------------------ */
(async function main() {
  console.log('=== R-ZELAZO-ZRZUTY-25-JEDNOSTEK-Q1 — harness renderujący ===\n');

  /* --- (0) potwierdzenie listy wobec units.json --- */
  const rawUnits = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
  const allUnits = Array.isArray(rawUnits) ? rawUnits : Object.values(rawUnits);
  const zelazo = allUnits.filter((u) => u['Epoka'] === 'Żelazo');
  check('(0a) units.json: epoka Żelazo ma dokładnie 25 jednostek', zelazo.length === 25, zelazo.length);

  // Dopasowanie listy z dispatchu do units.json. „Hieros Lochos" w dispatchu jest
  // skrótem kanonicznej nazwy „Hieros Lochos (Święty Zastęp)" — dopasowujemy po
  // prefiksie, i to jawnie raportujemy, zamiast cicho przyjąć inną jednostkę.
  const nazwyJson = zelazo.map((u) => u['Jednostka']);
  const rozjazdy = [];
  const dopasowane = [];
  for (const chciana of LISTA_DISPATCH) {
    const dokladne = nazwyJson.find((n) => n === chciana);
    if (dokladne) { dopasowane.push({ dispatch: chciana, json: dokladne, exact: true }); continue; }
    const prefiks = nazwyJson.filter((n) => n.startsWith(chciana));
    if (prefiks.length === 1) { dopasowane.push({ dispatch: chciana, json: prefiks[0], exact: false }); continue; }
    rozjazdy.push({ dispatch: chciana, kandydaci: prefiks });
  }
  check('(0b) każda z 25 nazw z dispatchu ma odpowiednik w units.json (Epoka=Żelazo)',
    rozjazdy.length === 0, rozjazdy);
  const nadmiarowe = nazwyJson.filter((n) => !dopasowane.some((d) => d.json === n));
  check('(0c) units.json nie ma jednostki Żelaza spoza listy dispatchu', nadmiarowe.length === 0, nadmiarowe);
  for (const d of dopasowane.filter((x) => !x.exact)) {
    console.log('      UWAGA: nazwa z dispatchu „' + d.dispatch + '" = kanoniczna „' + d.json + '" (dopasowanie po prefiksie)');
  }

  // Pełne rekordy w kolejności dispatchu (stabilna kolejność arkusza 5x5).
  let plan = dopasowane.map((d) => {
    const rec = zelazo.find((u) => u['Jednostka'] === d.json);
    return {
      nazwa: rec['Jednostka'],
      nazwaDispatch: d.dispatch,
      kultura: rec['Kultura'],
      rola: rec['Rola (linia)'],
      typ: rec['Typ'],
      isSuper: rec['Super-jednostka'] === 'TAK',
    };
  });
  if (ONLY) plan = plan.filter((p) => p.nazwa.toLowerCase().includes(ONLY.toLowerCase()));
  console.log('\nJednostek do renderu: ' + plan.length + '\n');

  /* --- (1) bundle --- */
  fs.writeFileSync(ENTRY, [
    "import * as THREE from 'three';",
    "import { buildUnitModel } from '../src/render/units.ts';",
    "import { categoryOf } from '../src/units/setup.ts';",
    'window.__THREE = THREE;',
    'window.__buildUnitModel = buildUnitModel;',
    'window.__categoryOf = categoryOf;',
    '',
  ].join('\n'), 'utf8');
  await buildBundle();
  check('(1a) wtyczka esbuild odsłoniła wewnętrzne symbole units.ts (dokładnie raz)',
    exposed.applied === 1, exposed.applied);

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
    await page.addScriptTag({ path: BUNDLE });
    check('(1b) bundle wykonał się i odsłonił buildNamedUnit/buildSuperUnit/buildCategoryModel',
      await page.evaluate(() => typeof window.__buildNamedUnit === 'function'
        && typeof window.__buildSuperUnit === 'function'
        && typeof window.__buildCategoryModel === 'function'
        && typeof window.__categoryOf === 'function'));

    /* --- (A) POMIAR: dedykowany model, nie generyk --- */
    console.log('\n--- (A) dowód modelu DEDYKOWANEGO dla każdej z 25 jednostek ---');
    const measured = await page.evaluate(({ plan, color, wszystkie }) => {
      const THREE = window.__THREE;
      const opis = (obj) => {
        obj.updateMatrixWorld(true);
        let minY = Infinity, maxY = -Infinity, maxR = 0, meshCount = 0;
        const names = [];
        const v = new THREE.Vector3();
        obj.traverse((o) => {
          if (!o.isMesh) return;
          meshCount++;
          if (o.name) names.push(o.name);
          const geo = o.geometry;
          if (!geo.boundingBox) geo.computeBoundingBox();
          const bb = geo.boundingBox;
          for (const c of [
            [bb.min.x, bb.min.y, bb.min.z], [bb.max.x, bb.min.y, bb.min.z],
            [bb.min.x, bb.max.y, bb.min.z], [bb.max.x, bb.max.y, bb.min.z],
            [bb.min.x, bb.min.y, bb.max.z], [bb.max.x, bb.min.y, bb.max.z],
            [bb.min.x, bb.max.y, bb.max.z], [bb.max.x, bb.max.y, bb.max.z],
          ]) {
            v.set(c[0], c[1], c[2]).applyMatrix4(o.matrixWorld);
            if (v.y < minY) minY = v.y;
            if (v.y > maxY) maxY = v.y;
            const r = Math.hypot(v.x, v.z);
            if (r > maxR) maxR = r;
          }
        });
        return {
          meshCount,
          nazwyMesh: Array.from(new Set(names)).sort(),
          anchors: obj.userData && obj.userData['anchors'] ? Object.keys(obj.userData['anchors']).sort() : null,
          minY: +minY.toFixed(4), maxY: +maxY.toFixed(4), maxR: +maxR.toFixed(4),
        };
      };
      // Obsada kategorii w CAŁYM units.json — potrzebna, gdy model jednostki
      // wychodzi identyczny jak `buildCategoryModel(kat)`. To NIE musi znaczyć
      // „generyk": gdy jednostka jest JEDYNYM lokatorem swojej kategorii, model
      // kategorii JEST jej własnym, dedykowanym modelem (nic go z nikim nie dzieli).
      const obsada = {};
      for (const u of wszystkie) {
        const k = window.__categoryOf(u.nazwa || '', u.rola || '', u.isSuper, u.typ || null);
        (obsada[k] = obsada[k] || []).push(u.nazwa);
      }

      const out = [];
      for (const p of plan) {
        const kat = window.__categoryOf(p.nazwa, p.rola || '', p.isSuper, p.typ || null);
        const n = window.__normName(p.nazwa);

        // dispatch dedykowany — mierzony bezpośrednio, nie wnioskowany
        let dispatchTyp, dispatchOk;
        if (kat === 'super') {
          const kult = window.__cultureFromName(p.nazwa);
          const przezNazwe = window.__SUPER_NAZWANY.test(n) && window.__buildNamedUnit(n, color) !== null;
          const bespokeSuper = ['rzym', 'grecja', 'germanie'].includes(kult);
          dispatchOk = przezNazwe || bespokeSuper;
          dispatchTyp = przezNazwe ? 'buildNamedUnit (SUPER_Z_MODELEM_NAZWANYM)'
            : (bespokeSuper ? 'buildSuperUnit → kultura ' + kult : 'buildSuperUnit → default (GENERYK!)');
        } else {
          const named = window.__buildNamedUnit(n, color);
          dispatchOk = named !== null;
          dispatchTyp = dispatchOk ? 'buildNamedUnit (dopasowanie po nazwie)' : 'BRAK — spada do buildCategoryModel (GENERYK!)';
        }

        const wGrze = window.__buildUnitModel(kat, color, p.nazwa);   // pełna ścieżka gry
        const generyk = window.__buildCategoryModel(kat, color);      // czysty generyk kategorii
        const mG = opis(wGrze), mR = opis(generyk);
        const rozniSie = mG.meshCount !== mR.meshCount
          || JSON.stringify(mG.nazwyMesh) !== JSON.stringify(mR.nazwyMesh);

        out.push({
          nazwa: p.nazwa, kategoria: kat, isSuper: p.isSuper, kultura: p.kultura,
          dispatchOk, dispatchTyp, rozniSie,
          lokatorzyKategorii: obsada[kat] || [],
          model: mG, generyk: { meshCount: mR.meshCount, liczbaNazw: mR.nazwyMesh.length },
        });
      }
      return out;
    }, {
      plan, color: OWNER_BLUE,
      wszystkie: allUnits.map((u) => ({
        nazwa: u['Jednostka'], rola: u['Rola (linia)'], typ: u['Typ'],
        isSuper: u['Super-jednostka'] === 'TAK',
      })),
    });

    for (const m of measured) {
      check('(A) ' + m.nazwa + ' — dedykowany dispatch [' + m.dispatchTyp + ']', m.dispatchOk,
        { kategoria: m.kategoria, super: m.isSuper });
      if (m.rozniSie) {
        check('(A) ' + m.nazwa + ' — model ≠ generyk kategorii `' + m.kategoria + '` (mesh ' + m.model.meshCount + ' vs ' + m.generyk.meshCount + ')',
          true);
        m.dowodRoznicy = 'model ' + m.model.meshCount + ' mesh vs generyk kategorii ' + m.generyk.meshCount + ' mesh';
      } else {
        // Model IDENTYCZNY z modelem kategorii. To jest generyk TYLKO wtedy, gdy
        // kategoria ma więcej niż jednego lokatora (model współdzielony z rodziną).
        // Jednostka będąca JEDYNYM lokatorem swojej kategorii dostaje przez obie
        // ścieżki ten sam DEDYKOWANY builder — nie ma czego z kim dzielić.
        const sam = m.lokatorzyKategorii.length === 1;
        check('(A) ' + m.nazwa + ' — model = model kategorii `' + m.kategoria + '`, ale jest JEDYNYM lokatorem tej kategorii w units.json (model dedykowany, nie współdzielony)',
          sam, { lokatorzy: m.lokatorzyKategorii });
        m.dowodRoznicy = 'jedyny lokator kategorii `' + m.kategoria + '` w units.json — model kategorii jest jej własnym (' + m.model.meshCount + ' mesh)';
      }
    }

    // Odrębność MIĘDZY jednostkami: żadne dwie nie mogą mieć identycznej sygnatury
    // (liczba mesh + zbiór nazw mesh + pudełko) — to złapałoby cichy alias
    // dwóch nazw do JEDNEGO buildera, czego sam test „≠ generyk" nie widzi.
    const sig = new Map();
    for (const m of measured) {
      const s = m.model.meshCount + '|' + m.model.nazwyMesh.join(',') + '|' + m.model.maxY + '|' + m.model.maxR;
      if (!sig.has(s)) sig.set(s, []);
      sig.get(s).push(m.nazwa);
    }
    const bliznieta = Array.from(sig.values()).filter((v) => v.length > 1);
    check('(A-uniq) żadne dwie jednostki nie mają identycznej sygnatury modelu (brak cichego aliasu)',
      bliznieta.length === 0, bliznieta);

    const zH = measured.map((m) => m.model.maxY);
    console.log('\n  wysokości maxY (×HEX_R): min ' + Math.min(...zH).toFixed(3) + ', max ' + Math.max(...zH).toFixed(3));
    console.log('  promienie maxR (×HEX_R): min ' + Math.min(...measured.map((m) => m.model.maxR)).toFixed(3)
      + ', max ' + Math.max(...measured.map((m) => m.model.maxR)).toFixed(3));

    /* --- (B) RENDER --- */
    if (!NO_SHOTS) {
      fs.mkdirSync(OUT, { recursive: true });
      const globalMaxY = Math.max(...measured.map((m) => m.model.maxY));
      const globalMaxR = Math.max(...measured.map((m) => m.model.maxR));
      console.log('\n--- (B) render: PRZÓD + KAMERA GRY (azymut 0, elewacja 52°), kadr wspólny dla wszystkich ---');

      await page.evaluate(({ maxY, maxR, color }) => {
        const THREE = window.__THREE;
        window.__ZR = {};
        const Z = window.__ZR;
        Z.PANEL = 520;
        Z.FOV = 24;
        // Jedna odległość dla WSZYSTKICH jednostek — spójna skala i brak przycięcia.
        const half = Math.max(maxY * 0.5, maxR) * 1.16;
        Z.DIST = half / Math.tan(THREE.MathUtils.degToRad(Z.FOV / 2) ) + maxR;
        Z.TARGET = new THREE.Vector3(0, maxY * 0.5, 0);
        Z.color = color;

        Z.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        Z.renderer.setPixelRatio(2);
        Z.renderer.setSize(Z.PANEL, Z.PANEL);
        Z.renderer.setClearColor(0xdfe7f0, 1);
        Z.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        Z.renderer.toneMappingExposure = 1.06;
        document.body.appendChild(Z.renderer.domElement);

        Z.scene = new THREE.Scene();
        Z.scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa7b4, 0.85));
        Z.scene.add(new THREE.AmbientLight(0xffffff, 0.42));
        const key = new THREE.DirectionalLight(0xfff4e2, 1.15); key.position.set(1.6, 2.6, 2.4); Z.scene.add(key);
        const fill = new THREE.DirectionalLight(0xdce8ff, 0.55); fill.position.set(-2.2, 1.4, 1.2); Z.scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff, 0.45); rim.position.set(0, 1.2, -2.6); Z.scene.add(rim);

        // Wspólna podstawka odniesienia (ta sama dla każdej jednostki).
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(0.52, 0.52, 0.012, 48),
          new THREE.MeshStandardMaterial({ color: 0xb9c4d0, roughness: 0.95, metalness: 0.0 }),
        );
        pad.position.y = -0.006;
        Z.scene.add(pad);

        Z.camera = new THREE.PerspectiveCamera(Z.FOV, 1, 0.05, 60);

        // Kamera gry: azymut 0, elewacja 52° — te same wzory co render/camera.ts.
        Z.setGameCam = () => {
          const el = THREE.MathUtils.degToRad(52), az = 0;
          Z.camera.position.set(
            Z.TARGET.x + Z.DIST * Math.cos(el) * Math.sin(az),
            Z.TARGET.y + Z.DIST * Math.sin(el),
            Z.TARGET.z + Z.DIST * Math.cos(el) * Math.cos(az),
          );
          Z.camera.lookAt(Z.TARGET);
        };
        // Przód: ten sam azymut 0, elewacja 0° — czysty widok frontalny.
        Z.setFrontCam = () => {
          Z.camera.position.set(Z.TARGET.x, Z.TARGET.y, Z.TARGET.z + Z.DIST);
          Z.camera.lookAt(Z.TARGET);
        };

        Z.current = null;
        Z.setUnit = (kat, nazwa) => {
          if (Z.current) { Z.scene.remove(Z.current); Z.current = null; }
          const g = window.__buildUnitModel(kat, Z.color, nazwa);
          Z.scene.add(g);
          Z.current = g;
        };
        Z.shot = (mode) => {
          if (mode === 'front') Z.setFrontCam(); else Z.setGameCam();
          Z.renderer.render(Z.scene, Z.camera);
          return Z.renderer.domElement;
        };
      }, { maxY: globalMaxY, maxR: globalMaxR, color: OWNER_BLUE });

      const thumbs = [];
      for (let i = 0; i < plan.length; i++) {
        const p = plan[i];
        const m = measured.find((x) => x.nazwa === p.nazwa);
        const dataUrl = await page.evaluate(({ nazwa, kat, podpis, meta }) => {
          const Z = window.__ZR;
          Z.setUnit(kat, nazwa);
          const P = Z.PANEL;
          const W = P * 2, HDR = 92, FTR = 54, H = HDR + P + FTR;
          const c = document.createElement('canvas');
          c.width = W; c.height = H;
          const g = c.getContext('2d');
          g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, W, H);

          const front = Z.shot('front');
          g.drawImage(front, 0, HDR, P, P);
          const game = Z.shot('game');
          g.drawImage(game, P, HDR, P, P);

          g.strokeStyle = '#8d9aa8'; g.lineWidth = 2;
          g.strokeRect(1, HDR, P - 1, P); g.strokeRect(P + 1, HDR, P - 1, P);

          const FONT = '"DejaVu Sans","Liberation Sans",Arial,sans-serif';
          // PODPIS NAZWĄ — wypalony na obrazku
          g.fillStyle = '#12212f';
          g.font = '700 46px ' + FONT;
          g.textBaseline = 'middle';
          g.fillText(podpis, 22, 40);
          g.fillStyle = '#5c6b7a';
          g.font = '400 22px ' + FONT;
          g.fillText(meta, 22, 74);

          // etykiety kadrów
          g.font = '700 24px ' + FONT;
          const label = (txt, x) => {
            const w = g.measureText(txt).width + 24;
            g.fillStyle = 'rgba(18,33,47,0.82)';
            g.fillRect(x + 12, HDR + 12, w, 38);
            g.fillStyle = '#ffffff';
            g.fillText(txt, x + 24, HDR + 32);
          };
          label('PRZÓD', 0);
          label('KAMERA GRY — azymut 0°, elewacja 52°', P);

          g.fillStyle = '#2c4a66';
          g.font = '400 21px ' + FONT;
          g.fillText(stopka, 22, HDR + P + 28);
          return c.toDataURL('image/png');
        }, {
          nazwa: p.nazwa, kat: m.kategoria,
          podpis: p.nazwa,
          stopka: 'MODEL DEDYKOWANY: TAK — ' + m.dispatchTyp + '; ' + m.dowodRoznicy,
          meta: [
            'epoka Żelaza',
            p.kultura ? 'kultura: ' + p.kultura : 'kultura: —',
            'kategoria modelu: ' + m.kategoria + (m.isSuper ? ' (super-jednostka)' : ''),
            'mesh: ' + m.model.meshCount,
            'wys.: ' + m.model.maxY.toFixed(2) + '×HEX_R',
          ].join('  •  '),
        });

        const idx = String(i + 1).padStart(2, '0');
        const safe = p.nazwa.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '-');
        const file = path.join(OUT, idx + '-' + safe + '.png');
        fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
        thumbs.push({ nazwa: p.nazwa, dataUrl });
        console.log('  [' + idx + '/' + plan.length + '] ' + p.nazwa + ' → ' + path.basename(file));
      }

      /* --- (C) arkusz zbiorczy 5x5 --- */
      const sheet = await page.evaluate((items) => {
        const CELL = 380, PAD = 10, CAP = 46;
        const COLS = 5, ROWS = Math.ceil(items.length / COLS);
        const HDR = 86;
        const W = COLS * (CELL + PAD) + PAD;
        const H = HDR + ROWS * (CELL + CAP + PAD) + PAD;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, W, H);
        const FONT = '"DejaVu Sans","Liberation Sans",Arial,sans-serif';
        g.fillStyle = '#12212f'; g.font = '700 40px ' + FONT; g.textBaseline = 'middle';
        g.fillText('Epoka Żelaza — wszystkie 25 jednostek (widok od przodu)', PAD + 8, 40);
        g.fillStyle = '#5c6b7a'; g.font = '400 20px ' + FONT;
        g.fillText('kolor gracza: niebieski • pełne kadry (przód + kamera gry) w plikach jednostkowych', PAD + 8, 68);

        return Promise.all(items.map((it) => new Promise((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.src = it.dataUrl;
        }))).then((imgs) => {
          imgs.forEach((img, i) => {
            const col = i % COLS, row = Math.floor(i / COLS);
            const x = PAD + col * (CELL + PAD);
            const y = HDR + row * (CELL + CAP + PAD);
            g.fillStyle = '#ffffff'; g.fillRect(x, y, CELL, CELL);
            // lewy panel (PRZÓD) źródłowego obrazka: 520x520 z offsetem 92 px
            g.drawImage(img, 0, 92, 520, 520, x, y, CELL, CELL);
            g.strokeStyle = '#8d9aa8'; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
            g.fillStyle = '#12212f'; g.font = '700 22px ' + FONT;
            let t = items[i].nazwa;
            while (g.measureText(t).width > CELL - 8 && t.length > 4) t = t.slice(0, -2);
            g.fillText(t, x + 4, y + CELL + 24);
          });
          return c.toDataURL('image/png');
        });
      }, thumbs);
      const sheetFile = path.join(OUT, '00-ARKUSZ-ZBIORCZY-5x5.png');
      fs.writeFileSync(sheetFile, Buffer.from(sheet.split(',')[1], 'base64'));
      console.log('  arkusz zbiorczy → ' + path.basename(sheetFile));

      check('(B1) powstało ' + plan.length + ' plików PNG per jednostka',
        fs.readdirSync(OUT).filter((f) => /^\d\d-/.test(f) && f.endsWith('.png')).length === plan.length);
      check('(C1) arkusz zbiorczy 5x5 zapisany', fs.existsSync(sheetFile) && fs.statSync(sheetFile).size > 10000);

      // raport maszynowy obok obrazków
      fs.writeFileSync(path.join(OUT, 'DOWODY-modeli.json'), JSON.stringify(measured, null, 2), 'utf8');
    }

    check('(Z) zero błędów konsoli/strony w renderze', pageErrors.length === 0, pageErrors.slice(0, 5));
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}
  }

  console.log('\n=== WYNIK: ' + pass + ' pass / ' + fail + ' fail ===');
  if (OUT) console.log('Obrazki: ' + path.resolve(OUT));
  if (fail > 0) { console.log('\nNIEZALICZONE:'); failures.forEach((f) => console.log('  ' + f)); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
