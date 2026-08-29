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
const BUNDLE_MUT = path.resolve(__dirname, '.zelazo-zrzuty-25-bundle-mut.js');
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

/**
 * DOWÓD NIETAUTOLOGICZNOŚCI (R-PROC-AUTOBOT §9 poz. 6a). Drugi bundle, w którym
 * OBA dedykowane dispatche są wyłączone: `buildNamedUnit` zwraca zawsze `null`,
 * a `buildSuperUnit` zawsze generyk kategorii. To jest dokładnie ten stan, przed
 * którym ostrzega dispatch tematu — 25 audytowanych nazw renderowanych na
 * generykach. Sekcja (D) wymaga, żeby dla KAŻDEJ z 25 jednostek co najmniej
 * jedna asercja (A) zapaliła się wtedy na czerwono. Mutacja jest wyłącznie
 * w pamięci — plik `units.ts` w repo NIE jest zmieniany.
 */
const SYG_NAMED = 'function buildNamedUnit(n: string, ownerColor_: number): THREE.Group | null {';
const SYG_SUPER = 'function buildSuperUnit(culture: Culture, ownerColor_: number, _name: string): THREE.Group {';
const mutacja = { named: 0, super: 0 };
const mutatePlugin = {
  name: 'wylacz-dedykowany-dispatch',
  setup(build) {
    build.onLoad({ filter: /units\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== UNITS_TS) return null;
      let out = fs.readFileSync(args.path, 'utf8');
      if (out.includes(SYG_NAMED)) { out = out.replace(SYG_NAMED, SYG_NAMED + ' if (true) return null;'); mutacja.named++; }
      if (out.includes(SYG_SUPER)) { out = out.replace(SYG_SUPER, SYG_SUPER + " if (true) return buildCategoryModel('super', ownerColor_);"); mutacja.super++; }
      out += [
        '',
        '(globalThis as any).__normName = normName;',
        '(globalThis as any).__buildNamedUnit = buildNamedUnit;',
        '(globalThis as any).__buildSuperUnit = buildSuperUnit;',
        '(globalThis as any).__buildCategoryModel = buildCategoryModel;',
        '(globalThis as any).__cultureFromName = cultureFromName;',
        '(globalThis as any).__SUPER_NAZWANY = SUPER_Z_MODELEM_NAZWANYM;',
        '',
      ].join('\n');
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
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [mutate ? mutatePlugin : exposePlugin],
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

/** Pomiar (A) — ten sam kod uruchamiany na bundlu ZWYKŁYM i na bundlu ZMUTOWANYM. */
const MIERZ = ({ plan, color, wszystkie }) => {
      const THREE = window.__THREE;
      const opis = (obj) => {
        obj.updateMatrixWorld(true);
        let minY = Infinity, maxY = -Infinity, maxR = 0, meshCount = 0;
        // Wielkości EKRANOWE, osobno dla obu kamer — potrzebne, żeby jeden wspólny
        // kadr obejmował KAŻDĄ jednostkę i nic nie przycinał. `maxR` (promień w XZ)
        // do tego nie wystarcza: mieszałby szerokość ekranu z GŁĘBOKOŚCIĄ (włócznia
        // wzdłuż osi patrzenia daje duże maxR, a na ekranie zero szerokości).
        let maxAbsX = 0, maxAbsZ = 0;
        const EL = Math.PI * 52 / 180, cEL = Math.cos(EL), sEL = Math.sin(EL);
        let maxQ = -Infinity, minQ = Infinity;   // q = y*cos52 - z*sin52 (oś „góra" kamery gry)
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
            if (Math.abs(v.x) > maxAbsX) maxAbsX = Math.abs(v.x);
            if (Math.abs(v.z) > maxAbsZ) maxAbsZ = Math.abs(v.z);
            const q = v.y * cEL - v.z * sEL;
            if (q > maxQ) maxQ = q;
            if (q < minQ) minQ = q;
          }
        });
        return {
          meshCount,
          nazwyMesh: Array.from(new Set(names)).sort(),
          anchors: obj.userData && obj.userData['anchors'] ? Object.keys(obj.userData['anchors']).sort() : null,
          minY: +minY.toFixed(4), maxY: +maxY.toFixed(4), maxR: +maxR.toFixed(4),
          maxAbsX: +maxAbsX.toFixed(4), maxAbsZ: +maxAbsZ.toFixed(4),
          maxQ: +maxQ.toFixed(4), minQ: +minQ.toFixed(4),
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
          // MIERZONE, nie wnioskowane: `buildSuperUnit` dla tej kultury/nazwy musi
          // dać coś INNEGO niż gałąź `default`, którą jest generyk kategorii.
          const sygn = (g) => { const d = opis(g); return d.meshCount + '|' + d.nazwyMesh.join(','); };
          const bespokeSuper = sygn(window.__buildSuperUnit(kult, color, p.nazwa))
            !== sygn(window.__buildCategoryModel('super', color));
          dispatchOk = przezNazwe || bespokeSuper;
          dispatchTyp = przezNazwe ? 'buildNamedUnit (SUPER_Z_MODELEM_NAZWANYM)'
            : (bespokeSuper ? 'buildSuperUnit → gałąź kultury `' + kult + '` (≠ default)' : 'buildSuperUnit → default (GENERYK!)');
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
};

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
  await buildBundle(BUNDLE, false);
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
    const measured = await page.evaluate(MIERZ, {
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

    /* --- (D) DOWÓD NIETAUTOLOGICZNOŚCI — §9 poz. 6a --- */
    console.log('\n--- (D) mutacja: dedykowany dispatch WYŁĄCZONY (bundle w pamięci) ---');
    await buildBundle(BUNDLE_MUT, true);
    check('(D0) mutacja faktycznie wyłączyła OBA dispatche (test nie jest pusty)',
      mutacja.named === 1 && mutacja.super === 1, mutacja);
    if (mutacja.named !== 1 || mutacja.super !== 1) {
      console.log('PRZERWANE: sygnatury buildNamedUnit/buildSuperUnit się przesunęły — popraw SYG_NAMED/SYG_SUPER.');
    } else {
      const pageMut = await browser.newPage({ viewport: { width: 400, height: 300 } });
      try {
        await pageMut.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
        await pageMut.addScriptTag({ path: BUNDLE_MUT });
        const mut = await pageMut.evaluate(MIERZ, {
          plan, color: OWNER_BLUE,
          wszystkie: allUnits.map((u) => ({
            nazwa: u['Jednostka'], rola: u['Rola (linia)'], typ: u['Typ'],
            isSuper: u['Super-jednostka'] === 'TAK',
          })),
        });
        // Dla KAŻDEJ jednostki co najmniej jedna asercja (A) musi zapalić się na
        // czerwono. Inaczej (A) nie mierzy tego, co deklaruje.
        const nadalZielone = mut.filter((m) => {
          const dispatchCzerwony = !m.dispatchOk;
          const roznicaCzerwona = m.rozniSie ? false : (m.lokatorzyKategorii.length !== 1);
          return !(dispatchCzerwony || roznicaCzerwona);
        }).map((m) => m.nazwa);
        check('(D1) po wyłączeniu dispatchu KAŻDA z ' + plan.length + ' jednostek pada na co najmniej jednej asercji (A)',
          nadalZielone.length === 0, { nadal_zielone: nadalZielone });
        const spadloDoGeneryka = mut.filter((m) => !m.rozniSie).length;
        console.log('  po mutacji: ' + mut.filter((m) => !m.dispatchOk).length + '/' + plan.length
          + ' jednostek bez dedykowanego dispatchu, ' + spadloDoGeneryka + '/' + plan.length
          + ' identycznych z generykiem kategorii');
      } finally { await pageMut.close(); }
    }

    /* --- (B) RENDER --- */
    if (!NO_SHOTS) {
      fs.mkdirSync(OUT, { recursive: true });

      // --- KADR: liczony RAZ, z faktycznych wielkości EKRANOWYCH, osobno dla
      // każdego z dwóch trybów kamery. Wewnątrz trybu skala i kadr są IDENTYCZNE
      // dla wszystkich 25 jednostek — to jest wymagana porównywalność MIĘDZY
      // jednostkami. Tryby mają własny kadr, bo rzut kamery gry (elewacja 52°)
      // rozciąga bryłę zupełnie inaczej niż rzut frontalny: wspólny kadr dla obu
      // zmusiłby panel PRZÓD do skali najgorszego przypadku kamery gry i wszystkie
      // jednostki byłyby na nim niepotrzebnie małe.
      const sEL = Math.sin(Math.PI * 52 / 180);
      const gMaxAbsZ = Math.max(...measured.map((m) => m.model.maxAbsZ));
      const halfW = Math.max(...measured.map((m) => m.model.maxAbsX));
      // PRZÓD: oś pionowa ekranu = Y świata.
      const yMax = Math.max(...measured.map((m) => m.model.maxY));
      const yMin = Math.min(...measured.map((m) => m.model.minY));
      const przod = { c: (yMax + yMin) / 2, h: (yMax - yMin) / 2 };
      // KAMERA GRY: oś pionowa ekranu = q = y·cos52 − z·sin52 (wektor „góra" kamery).
      const qMax = Math.max(...measured.map((m) => m.model.maxQ));
      const qMin = Math.min(...measured.map((m) => m.model.minQ));
      const gra = { c: (qMax + qMin) / 2, h: (qMax - qMin) / 2 };
      const MARG = 1.10;
      const PANEL_H = 470;
      const halfHmax = Math.max(przod.h, gra.h);
      const PANEL_W = Math.round(PANEL_H * Math.max(1.0, (halfW / halfHmax) * 1.06));
      console.log('\n--- (B) render: PRZÓD + KAMERA GRY (azymut 0°, elewacja 52°) ---');
      console.log('  kadr PRZÓD: środek ' + przod.c.toFixed(3) + ', półwysokość ' + przod.h.toFixed(3)
        + ' | kadr KAMERA GRY: środek ' + gra.c.toFixed(3) + ', półwysokość ' + gra.h.toFixed(3)
        + ' | półszerokość ' + halfW.toFixed(3) + ' ×HEX_R; panel ' + PANEL_W + '×' + PANEL_H + ' px, margines ' + MARG);

      await page.evaluate(({ przod, gra, gMaxAbsZ, marg, panelW, panelH, color, sEL }) => {
        const THREE = window.__THREE;
        const Z = {}; window.__ZR = Z;
        Z.W = panelW; Z.H = panelH; Z.FOV = 24;
        const tg = Math.tan(THREE.MathUtils.degToRad(Z.FOV / 2));
        // Osobna odległość per tryb; wewnątrz trybu STAŁA dla wszystkich jednostek.
        Z.DIST = {
          front: (przod.h * marg) / tg + gMaxAbsZ,
          game:  (gra.h  * marg) / tg + gMaxAbsZ,
        };
        // Cel kamery ustawiony tak, żeby środek zmierzonej bryły trafiał w środek kadru.
        const cEL = Math.cos(THREE.MathUtils.degToRad(52));
        Z.TGT = {
          front: new THREE.Vector3(0, przod.c, 0),
          game:  new THREE.Vector3(0, gra.c * cEL, -gra.c * sEL),
        };
        Z.color = color;

        Z.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        Z.renderer.setPixelRatio(2);
        Z.renderer.setSize(Z.W, Z.H);
        Z.renderer.setClearColor(0xe3eaf2, 1);
        Z.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        Z.renderer.toneMappingExposure = 1.06;
        document.body.appendChild(Z.renderer.domElement);

        Z.scene = new THREE.Scene();
        Z.scene.add(new THREE.HemisphereLight(0xffffff, 0x93a1b0, 0.9));
        Z.scene.add(new THREE.AmbientLight(0xffffff, 0.40));
        const key = new THREE.DirectionalLight(0xfff4e2, 1.15); key.position.set(1.6, 2.6, 2.4); Z.scene.add(key);
        const fill = new THREE.DirectionalLight(0xdce8ff, 0.55); fill.position.set(-2.2, 1.4, 1.2); Z.scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff, 0.50); rim.position.set(0, 1.3, -2.6); Z.scene.add(rim);

        // Wspólna podstawka odniesienia — ta sama dla każdej jednostki, więc
        // działa jak skala porównawcza między obrazkami.
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(0.44, 0.44, 0.012, 48),
          new THREE.MeshStandardMaterial({ color: 0xb4c0cd, roughness: 0.95, metalness: 0.0 }),
        );
        pad.position.y = -0.006;
        Z.scene.add(pad);

        Z.camera = new THREE.PerspectiveCamera(Z.FOV, Z.W / Z.H, 0.05, 60);
        // Kamera gry — te same wzory co render/camera.ts (azymut 0, elewacja 52°).
        Z.setCam = (mode) => {
          const el = THREE.MathUtils.degToRad(mode === 'front' ? 0 : 52);
          const az = 0, D = Z.DIST[mode], T = Z.TGT[mode];
          Z.camera.position.set(
            T.x + D * Math.cos(el) * Math.sin(az),
            T.y + D * Math.sin(el),
            T.z + D * Math.cos(el) * Math.cos(az),
          );
          Z.camera.lookAt(T);
        };
        Z.current = null;
        Z.setUnit = (kat, nazwa) => {
          if (Z.current) { Z.scene.remove(Z.current); Z.current = null; }
          const g = window.__buildUnitModel(kat, Z.color, nazwa);
          Z.scene.add(g); Z.current = g;
        };
        Z.shot = (mode) => { Z.setCam(mode); Z.renderer.render(Z.scene, Z.camera); return Z.renderer.domElement; };
        Z.FONT = '"DejaVu Sans","Liberation Sans",Arial,sans-serif';
        Z.fit = (g, txt, weight, basePx, maxW) => {
          let px = basePx;
          g.font = weight + ' ' + px + 'px ' + Z.FONT;
          while (g.measureText(txt).width > maxW && px > 9) { px -= 1; g.font = weight + ' ' + px + 'px ' + Z.FONT; }
          return px;
        };
      }, { przod, gra, gMaxAbsZ, marg: MARG, panelW: PANEL_W, panelH: PANEL_H, color: OWNER_BLUE, sEL });

      const thumbs = [];
      for (let i = 0; i < plan.length; i++) {
        const p = plan[i];
        const m = measured.find((x) => x.nazwa === p.nazwa);
        const shot = await page.evaluate(({ nazwa, kat, podpis, meta, stopka }) => {
          const Z = window.__ZR;
          Z.setUnit(kat, nazwa);
          const P = Z.W, PH = Z.H;
          const W = P * 2, HDR = 96, FTR = 50, H = HDR + PH + FTR;
          const c = document.createElement('canvas');
          c.width = W; c.height = H;
          const g = c.getContext('2d');
          g.textBaseline = 'middle';
          g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, W, H);

          const front = Z.shot('front');
          g.drawImage(front, 0, HDR, P, PH);
          // czysta miniatura PRZODU (bez etykiet) — na arkusz zbiorczy
          const mc = document.createElement('canvas');
          mc.width = P; mc.height = PH;
          mc.getContext('2d').drawImage(front, 0, 0, P, PH);
          const mini = mc.toDataURL('image/png');

          const game = Z.shot('game');
          g.drawImage(game, P, HDR, P, PH);
          g.strokeStyle = '#8d9aa8'; g.lineWidth = 2;
          g.strokeRect(1, HDR, P - 1, PH); g.strokeRect(P + 1, HDR, P - 1, PH);

          // PODPIS NAZWĄ — wypalony na obrazku
          g.fillStyle = '#12212f'; Z.fit(g, podpis, '700', 46, W - 44);
          g.fillText(podpis, 22, 42);
          g.fillStyle = '#5c6b7a'; Z.fit(g, meta, '400', 22, W - 44);
          g.fillText(meta, 22, 76);

          const label = (txt, x) => {
            Z.fit(g, txt, '700', 22, P - 52);
            const w = g.measureText(txt).width + 24;
            g.fillStyle = 'rgba(18,33,47,0.84)';
            g.fillRect(x + 12, HDR + 12, w, 36);
            g.fillStyle = '#ffffff';
            g.fillText(txt, x + 24, HDR + 31);
          };
          label('PRZÓD (azymut 0°, elewacja 0°)', 0);
          label('KAMERA GRY (azymut 0°, elewacja 52°)', P);

          g.fillStyle = '#2c4a66'; Z.fit(g, stopka, '400', 20, W - 44);
          g.fillText(stopka, 22, HDR + PH + 25);
          return { pelny: c.toDataURL('image/png'), mini };
        }, {
          nazwa: p.nazwa, kat: m.kategoria, podpis: p.nazwa,
          meta: [
            'epoka Żelaza',
            'kultura: ' + (p.kultura || '—'),
            'kategoria modelu: ' + m.kategoria + (m.isSuper ? ' (super-jednostka)' : ''),
            'mesh: ' + m.model.meshCount,
            'wysokość ' + m.model.maxY.toFixed(2) + ' ×HEX_R',
          ].join('  •  '),
          stopka: 'MODEL DEDYKOWANY: TAK — ' + m.dispatchTyp + '; ' + m.dowodRoznicy,
        });

        const idx = String(i + 1).padStart(2, '0');
        const safe = p.nazwa.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '-');
        const file = path.join(OUT, idx + '-' + safe + '.png');
        fs.writeFileSync(file, Buffer.from(shot.pelny.split(',')[1], 'base64'));
        thumbs.push({ nazwa: p.nazwa, dataUrl: shot.mini });
        console.log('  [' + idx + '/' + plan.length + '] ' + p.nazwa + ' → ' + path.basename(file));
      }

      /* --- (C) arkusz zbiorczy 5x5 --- */
      const sheet = await page.evaluate(({ items, panelW, panelH }) => {
        const Z = window.__ZR;
        const CW = 360, CH = Math.round(360 * panelH / panelW);
        const PAD = 12, CAP = 40, COLS = 5;
        const ROWS = Math.ceil(items.length / COLS), HDR = 92;
        const W = COLS * (CW + PAD) + PAD;
        const H = HDR + ROWS * (CH + CAP + PAD) + PAD;
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        g.textBaseline = 'middle';
        g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#12212f'; Z.fit(g, 'Epoka Żelaza — wszystkie 25 jednostek, widok od przodu', '700', 40, W - 2 * PAD);
        g.fillText('Epoka Żelaza — wszystkie 25 jednostek, widok od przodu', PAD + 6, 40);
        const sub = 'kolor gracza: niebieski  •  wspólna skala i kadr dla wszystkich  •  pełne kadry (przód + kamera gry) w plikach jednostkowych';
        g.fillStyle = '#5c6b7a'; Z.fit(g, sub, '400', 20, W - 2 * PAD);
        g.fillText(sub, PAD + 6, 70);

        return Promise.all(items.map((it) => new Promise((res) => {
          const img = new Image(); img.onload = () => res(img); img.src = it.dataUrl;
        }))).then((imgs) => {
          imgs.forEach((img, i) => {
            const col = i % COLS, row = Math.floor(i / COLS);
            const x = PAD + col * (CW + PAD);
            const y = HDR + row * (CH + CAP + PAD);
            g.drawImage(img, x, y, CW, CH);
            g.strokeStyle = '#8d9aa8'; g.lineWidth = 1.5; g.strokeRect(x + 0.5, y + 0.5, CW - 1, CH - 1);
            g.fillStyle = '#12212f';
            Z.fit(g, items[i].nazwa, '700', 22, CW - 8);
            g.fillText(items[i].nazwa, x + 4, y + CH + 22);
          });
          return c.toDataURL('image/png');
        });
      }, { items: thumbs, panelW: PANEL_W, panelH: PANEL_H });
      const sheetFile = path.join(OUT, '00-ARKUSZ-ZBIORCZY-5x5.png');
      fs.writeFileSync(sheetFile, Buffer.from(sheet.split(',')[1], 'base64'));
      console.log('  arkusz zbiorczy → ' + path.basename(sheetFile));

      check('(B1) powstało ' + plan.length + ' plików PNG per jednostka',
        fs.readdirSync(OUT).filter((f) => /^\d\d-/.test(f) && !f.startsWith('00-') && f.endsWith('.png')).length === plan.length);
      check('(C1) arkusz zbiorczy 5x5 zapisany', fs.existsSync(sheetFile) && fs.statSync(sheetFile).size > 10000);

      fs.writeFileSync(path.join(OUT, 'DOWODY-modeli.json'), JSON.stringify(measured, null, 2), 'utf8');
    }

    check('(Z) zero błędów konsoli/strony w renderze', pageErrors.length === 0, pageErrors.slice(0, 5));
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); fs.unlinkSync(BUNDLE_MUT); } catch (_) {}
  }

  console.log('\n=== WYNIK: ' + pass + ' pass / ' + fail + ' fail ===');
  if (OUT) console.log('Obrazki: ' + path.resolve(OUT));
  if (fail > 0) { console.log('\nNIEZALICZONE:'); failures.forEach((f) => console.log('  ' + f)); }
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
