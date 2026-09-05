'use strict';
/**
 * improvement-card-callsites-test.cjs
 *
 * TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, T7b KARTA-ULEPSZENIA-TERENU.
 *
 * Weryfikuje WSZYSTKIE 3 miejsca wywołania nowej karty ulepszenia terenu
 * (`entityCards/improvementAdapter.ts` + `entityCards/renderer.ts:openEntityCard`),
 * każde otwierające TĘ SAMĄ kartę encji (`kind==='improvement'`, `data-entity-id`
 * = klucz z `terrain-improvements.json`):
 *
 * [1] Popup odkrycia technologii (`techDiscoveryNotice.ts`) — sekcja „Ulepszenia
 *     terenu": wiersz dostaje `linkTo` dopięte lokalnie w tym pliku (renderer.ts,
 *     poza allowlistą T7b, sam nie generuje kliku dla `linkTo` — to zakres T10).
 *     Real Chromium/Playwright (nie jsdom) — precedens
 *     `tech-discovery-card-real-click-test.cjs` (R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1):
 *     jsdom nie robi realnego hit-testingu (`elementFromPoint`), więc fałszywie
 *     zielone światło na stackingowe regresje CSS jest możliwe.
 * [2] Tryb budowy (`buildModeHud.ts`) — osobna, zawsze widoczna ikonka „ⓘ" w
 *     `.civ-build-item`, NIEZALEŻNA od kliku wyboru typu budowy (regresja
 *     krytyczna: klik wyboru typu MUSI zostać nietknięty). esbuild+jsdom, wzorem
 *     `build-mode-hud-affordability-test.cjs` — brak tu konkurencyjnego
 *     kontekstu stackowania (position:fixed overlay), więc dispatchEvent
 *     wystarcza (w przeciwieństwie do [1]).
 * [3] Panel miasta (`cityPanel.ts`, `buildOkolicaDetailCard`, sekcja „Ulepszenia
 *     w zasięgu") — nowa treść (T7a potwierdził brak istniejącej listy). Plik jest
 *     zbyt duży/zależny (>11k linii, cały panel miasta) do pełnego zbundlowania w
 *     rozsądnym czasie testu — wycięcie realnych ciał `improvementsInCityRange`/
 *     `improvementRangeRow`/`hexDist` przez `vm` (wzorzec
 *     `citypanel-uwagi-abc-filter-test.cjs`), wykonanie z prawdziwą logiką
 *     agregacji i prawdziwym wiązaniem kliku → `openEntityCard`, PLUS strukturalna
 *     weryfikacja źródła (sekcja rzeczywiście wpięta w `buildOkolicaDetailCard`,
 *     `map` rzeczywiście przekazywane z `renderOkolica`).
 *
 * Usage (z gra/): node tools/improvement-card-callsites-test.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[improvement-card-callsites-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}
let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[improvement-card-callsites-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[improvement-card-callsites-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox'],
    });
  }
}

// ===========================================================================
// [1] techDiscoveryNotice.ts — real Chromium click, wzorem tech-discovery-card-
//     real-click-test.cjs (stackingowe ryzyko: pełny kontrakt entityCards renderer
//     + lokalnie dopinany listener na `card`).
// ===========================================================================
async function testCallSite1TechDiscoveryNotice() {
  const BRAND_STUB = path.resolve(STUB_DIR, 'improvement-callsites-brandAssets-stub.ts');
  const OWL_STUB = path.resolve(STUB_DIR, 'improvement-callsites-scienceOwlIcon-stub.ts');
  const ENTRY = path.resolve(__dirname, '.improvement-callsites-site1-entry.ts');
  const OUTFILE = path.resolve(__dirname, '.improvement-callsites-site1-bundle.cjs');

  fs.writeFileSync(
    ENTRY,
    [
      "import { showTechDiscoveryNotice, hideTechDiscoveryNotice } from '../src/ui/techDiscoveryNotice.ts';",
      'window.__showTechDiscoveryNotice = showTechDiscoveryNotice;',
      'window.__hideTechDiscoveryNotice = hideTechDiscoveryNotice;',
      '',
    ].join('\n'),
    'utf8',
  );

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  try {
    await page.setContent('<!DOCTYPE html><html><head><title>improvement-card-callsites-test [1]</title></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    // "Obróbka drewna" -> "Tartak, Posterunek (Strażnica)" (tech.json realne dane) — technologia
    // z NIEPUSTĄ sekcją "Ulepszenia terenu", żeby test faktycznie ćwiczył ten call-site.
    const techData = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
    const tech = techData.technologie.find((t) => t.Technologia === 'Obróbka drewna');
    check('fixture: tech.json ma "Obróbka drewna" z niepustym "Odblokowuje ulepszenie terenu"',
      !!tech && !!tech['Odblokowuje ulepszenie terenu'], tech && tech['Odblokowuje ulepszenie terenu']);

    await page.evaluate(() => {
      window.__showTechDiscoveryNotice({ techName: 'Obróbka drewna', eraIndex: 1, kind: 'preview' });
    });

    // Sekcja "Ulepszenia terenu" jest collapsible (openDefault:false) — realny klik na
    // nagłówku sekcji, żeby ją rozwinąć (bez tego rzędy są `hidden`, więc niekliklane).
    const sectionHeadRect = await page.evaluate(() => {
      const host = document.getElementById('civ-tech-discovery-notice-host');
      const section = host?.querySelector('[data-section-key="improvements"]');
      const head = section?.querySelector('.entity-card-section-head');
      if (!head) return null;
      const r = head.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });
    check('sekcja "Ulepszenia terenu" (data-section-key="improvements") istnieje w DOM', !!sectionHeadRect, sectionHeadRect);
    if (sectionHeadRect) await page.mouse.click(sectionHeadRect.cx, sectionHeadRect.cy);

    // P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 (GOAL 3) — DWIE zmiany w tym bloku, obie
    // wymuszone pomiarem na żywym Chromium, nie domysłem:
    //
    // (a) SELEKTOR. Do tego tematu przyciskiem był `value` („Szczegóły →"), dziś jest nim
    //     SAMA NAZWA ulepszenia (`.entity-card-row-key`, `linkAnchor:'label'`). Selektor
    //     celuje więc w `button[data-entity-kind="improvement"]` — DOKŁADNIE ten sam
    //     selektor, którym łapie klik delegacja w `renderEntityCard`, więc test jest
    //     odporny na to, po której stronie wiersza stoi przycisk.
    //
    // (b) SCROLL PRZED HIT-TESTEM. Karta ma STAŁĄ wysokość `min(80vh,calc(100vh - 36px))`
    //     z `overflow:auto` (R-CIVPEDIA-KARTY-SPOJNOSC-Q1-C, jawne żądanie właściciela).
    //     Po rozwinięciu sekcji „Ulepszenia terenu" wiersz wypada PONIŻEJ przyciętego boxa
    //     karty, więc `getBoundingClientRect()` zwraca punkt spoza karty, a `elementFromPoint`
    //     trafia w `.tdn-back` pod spodem. To NIE jest defekt produktu — zmierzone na żywo
    //     (1280x900, „Obróbka drewna"): karta scrollHeight 914 vs clientHeight 720, czyli
    //     realnie przewijalna; wiersz przed scrollem top 813,6 przy dolnej krawędzi karty
    //     811,0 (2,6 px poniżej cięcia); po przewinięciu KÓŁKIEM MYSZY (nie tylko API)
    //     scrollTop 194, wiersz top 619,6, `elementFromPoint` = BUTTON, a realny klik
    //     otwiera kartę `tartak`. Gracz dosięga wiersza normalnym scrollem — brakowało
    //     tego kroku TESTOWI, nie graczowi. Dowód: `dowody/goal3-01..03-*.png` w katalogu
    //     runu tematu. Bez tej linii test mierzyłby punkt, którego użytkownik nigdy nie klika.
    const linkRowInfo = await page.evaluate(() => {
      const host = document.getElementById('civ-tech-discovery-notice-host');
      const section = host?.querySelector('[data-section-key="improvements"]');
      const btn = section?.querySelector('button[data-entity-kind="improvement"]');
      if (!btn) return null;
      btn.scrollIntoView({ block: 'center' });
      const r = btn.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2, cy: r.top + r.height / 2,
        entityId: btn.getAttribute('data-entity-id'),
        text: btn.textContent,
      };
    });
    check('wiersz ulepszenia w karcie technologii ma data-entity-kind="improvement" + data-entity-id',
      !!linkRowInfo && !!linkRowInfo.entityId, linkRowInfo);

    if (linkRowInfo) {
      const hitEl = await page.evaluate(({ cx, cy }) => {
        const el = document.elementFromPoint(cx, cy);
        return el ? { tag: el.tagName, className: el.className } : null;
      }, linkRowInfo);
      check('elementFromPoint na środku wiersza ulepszenia trafia w SAM PRZYCISK (nie w tło/kartę pod spodem)',
        hitEl && hitEl.tag === 'BUTTON', hitEl);

      await page.mouse.click(linkRowInfo.cx, linkRowInfo.cy);

      const nestedCard = await page.evaluate(() => {
        const card = document.querySelector('.entity-card-improvement');
        return card ? { entityId: card.getAttribute('data-entity-id'), kind: card.getAttribute('data-entity-kind') } : null;
      });
      check('realny klik otwiera ZAGNIEŻDŻONĄ kartę encji improvement (openEntityCard) NA WIERZCHU',
        !!nestedCard && nestedCard.kind === 'improvement' && nestedCard.entityId === linkRowInfo.entityId, nestedCard);
    }

    check('zero błędów konsoli/pageerror w scenariuszu [1]', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }
}

// ===========================================================================
// [2] buildModeHud.ts — esbuild+jsdom, wzorem build-mode-hud-affordability-test.cjs.
//     Krytyczne: klik wyboru typu budowy (klik reszty wiersza) MUSI zostać
//     nietknięty przez dodanie ikonki info (zero regresji, wg kryterium ukończenia).
// ===========================================================================
async function testCallSite2BuildModeHud() {
  const BRAND_STUB = path.resolve(STUB_DIR, 'improvement-callsites-buildmodehud-brandassets-stub.ts');
  const OWL_STUB = path.resolve(STUB_DIR, 'improvement-callsites-scienceOwlIcon-stub.ts');
  const ENTRY = path.resolve(__dirname, '.improvement-callsites-site2-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.improvement-callsites-site2-bundle.cjs');

  fs.writeFileSync(ENTRY, `export { createBuildModeHud } from '../src/ui/buildModeHud.ts';\n`, 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  delete require.cache[BUNDLE];
  const { createBuildModeHud } = require(BUNDLE);

  const selected = [];
  // 'fort' i 'droga' są klucze REALNE w terrain-improvements.json (nie fixture zmyślony) —
  // żeby openEntityCard('improvement', key, ...) faktycznie rozwiązywał się przez registry.ts.
  const config = {
    listTypes: () => [
      { key: 'droga', label: 'Droga', kosztPraca: 10, epoka: 1 },
      { key: 'fort', label: 'Fort', kosztPraca: 999, epoka: 1, techUnlocked: false, lockHint: 'Wymaga: Wojskowość' },
    ],
    getActiveKey: () => null,
    onSelectType: (key) => { selected.push(key); },
    onExit: () => {},
    isOpen: () => true,
    getPracaPool: () => 100,
  };

  const hud = createBuildModeHud(config);

  const drogaItem = hud.el.querySelector('[data-key="droga"]');
  const fortItem = hud.el.querySelector('[data-key="fort"]');
  check('pozycja "Droga" renderuje się', !!drogaItem);
  check('pozycja "Fort" (zablokowana) renderuje się', !!fortItem);

  const drogaInfoIc = drogaItem && drogaItem.querySelector('.civ-build-info-ic');
  const fortInfoIc = fortItem && fortItem.querySelector('.civ-build-info-ic');
  check('ikonka info (ⓘ) obecna w wierszu "Droga" (zawsze widoczna, niezależnie od stanu)', !!drogaInfoIc);
  check('ikonka info (ⓘ) obecna w wierszu "Fort" (zablokowany, ale ikonka wciąż widoczna)', !!fortInfoIc);

  // --- Regresja krytyczna: klik reszty wiersza (wybór typu budowy) bez zmian ---------------
  if (drogaItem) drogaItem.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('klik reszty wiersza "Droga" (NIE ikonka info) nadal wywołuje onSelectType("droga") — zero regresji',
    selected.length === 1 && selected[0] === 'droga', JSON.stringify(selected));

  // --- Ikonka info: strefa klikalna NIEZALEŻNA od wyboru typu -------------------------------
  selected.length = 0;
  document.querySelectorAll('.entity-card-backdrop').forEach((b) => b.remove());
  if (drogaInfoIc) drogaInfoIc.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('klik ikonki info NIE wywołuje onSelectType (stopPropagation, strefa niezależna)',
    selected.length === 0, JSON.stringify(selected));
  const openedCardDroga = document.querySelector('.entity-card-improvement[data-entity-id="droga"]');
  check('klik ikonki info na "Droga" otwiera kartę encji improvement z data-entity-id="droga"',
    !!openedCardDroga, !!openedCardDroga);

  // --- Ikonka info działa TAKŻE na zablokowanej pozycji (podgląd karty ≠ akcja budowy) ------
  selected.length = 0;
  document.querySelectorAll('.entity-card-backdrop').forEach((b) => b.remove());
  if (fortInfoIc) fortInfoIc.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('klik ikonki info na "Fort" (zablokowany) NIE wywołuje onSelectType', selected.length === 0, JSON.stringify(selected));
  const openedCardFort = document.querySelector('.entity-card-improvement[data-entity-id="fort"]');
  check('klik ikonki info na "Fort" (zablokowany) MIMO TO otwiera kartę encji ("ⓘ" zawsze widoczna, niezależna od locka)',
    !!openedCardFort, !!openedCardFort);

  hud.destroy();
  document.querySelectorAll('.entity-card-backdrop').forEach((b) => b.remove());

  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(BUNDLE, { force: true });
}

// ===========================================================================
// [3] cityPanel.ts — vm-extraction (plik zbyt duży/zależny do pełnego bundlowania w
//     rozsądnym czasie, wzorem citypanel-uwagi-abc-filter-test.cjs) + weryfikacja
//     strukturalna źródła.
// ===========================================================================
/**
 * Wycina pełne ciało `function name(...) { ... }` z surowego TS. NIE zakłada, że
 * pierwszy `{` po nazwie funkcji to początek ciała — parametry mogą mieć inline
 * typy obiektowe (`opts: { ... }`, jak `buildOkolicaDetailCard`), więc najpierw
 * liczymy głębokość NAWIASÓW OKRĄGŁYCH, żeby znaleźć koniec listy parametrów
 * (uwzględniając zagnieżdżone `{}`/`()` w typach), dopiero potem szukamy `{`
 * ciała funkcji (po ewentualnym `: ReturnType`).
 */
function extractFn(name, source) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const parenStart = start + marker.length - 1; // index of the opening '('
  let parenDepth = 0;
  let parenEnd = -1;
  for (let i = parenStart; i < source.length; i++) {
    if (source[i] === '(') parenDepth++;
    else if (source[i] === ')') {
      parenDepth--;
      if (parenDepth === 0) { parenEnd = i; break; }
    }
  }
  if (parenEnd < 0) return null;
  const braceStart = source.indexOf('{', parenEnd);
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

/** Zdejmuje adnotacje typów TS z sygnatury funkcji (parametry + typ zwracany), nie rusza ciała —
 * ten sam wzorzec co `citypanel-uwagi-abc-filter-test.cjs::detypeFnSignature`. */
function detypeFnSignature(fnSrc) {
  if (!fnSrc) return fnSrc;
  const headEnd = fnSrc.indexOf('{');
  let head = fnSrc.slice(0, headEnd);
  const body = fnSrc.slice(headEnd);
  head = head.replace(/\)\s*:\s*[^({]+$/, ')');
  head = head.replace(/([A-Za-z_$][\w$]*)\s*:\s*[^,()]+(?=[,)])/g, '$1');
  return head + body;
}

function testCallSite3CityPanel() {
  const CITY_PANEL_TS = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
  const src = fs.readFileSync(CITY_PANEL_TS, 'utf8');

  const hexDistSrc = extractFn('hexDist', src);
  const improvementsInCityRangeSrc = extractFn('improvementsInCityRange', src);
  const improvementRangeRowSrc = extractFn('improvementRangeRow', src);

  check('znaleziono hexDist(...) w cityPanel.ts', !!hexDistSrc);
  check('znaleziono improvementsInCityRange(...) w cityPanel.ts', !!improvementsInCityRangeSrc);
  check('znaleziono improvementRangeRow(...) w cityPanel.ts', !!improvementRangeRowSrc);

  // --- Weryfikacja strukturalna: sekcja faktycznie wpięta w buildOkolicaDetailCard,
  //     `map` faktycznie przekazywane z jedynego call site (renderOkolica). --------------
  const buildOkolicaDetailCardSrc = extractFn('buildOkolicaDetailCard', src);
  check('znaleziono buildOkolicaDetailCard(...) w cityPanel.ts', !!buildOkolicaDetailCardSrc);
  if (buildOkolicaDetailCardSrc) {
    check('buildOkolicaDetailCard woła improvementsInCityRange(city, map, Rwork)',
      /improvementsInCityRange\(\s*city\s*,\s*map\s*,\s*Rwork\s*\)/.test(buildOkolicaDetailCardSrc));
    check('buildOkolicaDetailCard renderuje sekcję "Ulepszenia w zasięgu"',
      buildOkolicaDetailCardSrc.includes('Ulepszenia w zasięgu'));
    check('buildOkolicaDetailCard woła improvementRangeRow(...) per unikalny typ ulepszenia',
      /improvementRangeRow\(\s*gImp\s*,/.test(buildOkolicaDetailCardSrc));
  }
  check('jedyne wywołanie buildOkolicaDetailCard(...) (w renderOkolica) przekazuje "map,"',
    /buildOkolicaDetailCard\(city,\s*\{[\s\S]{0,400}?\bmap,/.test(src));

  // --- improvementRangeRow musi wołać openEntityCard('improvement', key, {mode:'dialog'}) ---
  check('improvementRangeRow woła openEntityCard(\'improvement\', key, { mode: \'dialog\' })',
    !!improvementRangeRowSrc
    && /openEntityCard\(\s*'improvement'\s*,\s*key\s*,\s*\{\s*mode:\s*'dialog'\s*\}\s*\)/.test(improvementRangeRowSrc));

  if (!hexDistSrc || !improvementsInCityRangeSrc || !improvementRangeRowSrc) return;

  // --- Wykonanie REALNEJ logiki agregacji (vm) — nie tylko obecność wzorca w źródle --------
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  const sandbox = {
    document: dom.window.document,
    console,
    // Stub minimalny — sama funkcja agregująca nie musi znać PRAWDZIWEGO mechanizmu
    // wielowarstwowych ulepszeń (game/terrain-improvements.ts), tylko wywołać go raz
    // per hex i zsumować zwrócone klucze — dokładnie to sprawdza ten test.
    improvementKeysForHex: (hex) => (hex && hex.__keys) || [],
    openEntityCardSpy: [],
  };
  sandbox.openEntityCard = (kind, key, opts) => { sandbox.openEntityCardSpy.push({ kind, key, opts }); };
  sandbox.el = (tag, cls) => {
    const n = dom.window.document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  };
  vm.createContext(sandbox);
  // `new Map<string, number>()` w ciele `improvementsInCityRange` — generic na WYWOŁANIU,
  // nie w sygnaturze funkcji, więc `detypeFnSignature` (tylko head) go nie dotyka.
  const stripInlineGenerics = (s) => s.replace(/new Map<[^>]*>\(/g, 'new Map(');
  vm.runInContext(
    stripInlineGenerics(
      [hexDistSrc, improvementsInCityRangeSrc, improvementRangeRowSrc].map(detypeFnSignature).join('\n'),
    ),
    sandbox,
  );

  check('hexDist/improvementsInCityRange/improvementRangeRow wykonalne w sandboxie (vm)',
    typeof sandbox.hexDist === 'function'
    && typeof sandbox.improvementsInCityRange === 'function'
    && typeof sandbox.improvementRangeRow === 'function');

  // Miasto w (0,0), Rwork=1 -> 7 heksów (środek + 6 sąsiadów, axial/cube dist<=1).
  // 3 z nich mają ulepszenie "farma" (klucz), 1 ma "kopalnia_zelaza" — reszta bez ulepszeń.
  const city = { q: 0, r: 0 };
  const hexes = {};
  const neighbors = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  hexes['0,0'] = { __keys: ['farma'] };
  hexes['1,0'] = { __keys: ['farma'] };
  hexes['1,-1'] = { __keys: ['farma'] };
  hexes['0,-1'] = { __keys: ['kopalnia_zelaza'] };
  hexes['-1,0'] = { __keys: [] };
  hexes['-1,1'] = { __keys: [] };
  hexes['0,1'] = { __keys: [] };
  // Poza zasięgiem (Rwork=1) — NIE powinien wejść do agregacji mimo tego samego klucza.
  hexes['2,0'] = { __keys: ['farma'] };
  const map = { hexes };
  void neighbors;

  const counts = sandbox.improvementsInCityRange(city, map, 1);
  check('improvementsInCityRange: zwraca Map', counts instanceof dom.window.Map || typeof counts.get === 'function');
  check('improvementsInCityRange: "farma" policzona 3× (w zasięgu, nie 4× — pole poza r=1 pominięte)',
    counts.get('farma') === 3, counts.get('farma'));
  check('improvementsInCityRange: "kopalnia_zelaza" policzona 1×', counts.get('kopalnia_zelaza') === 1, counts.get('kopalnia_zelaza'));
  check('improvementsInCityRange: dokładnie 2 unikalne typy w zasięgu (farma, kopalnia_zelaza)', counts.size === 2, counts.size);

  const counts0 = sandbox.improvementsInCityRange(city, map, undefined);
  check('improvementsInCityRange: Rwork=undefined -> Map pusta (brak crasha)', counts0.size === 0);
  const countsNoMap = sandbox.improvementsInCityRange(city, undefined, 1);
  check('improvementsInCityRange: map=undefined -> Map pusta (brak crasha)', countsNoMap.size === 0);

  // --- improvementRangeRow: DOM + klik wywołuje openEntityCard z poprawnymi argumentami -----
  const grid = dom.window.document.createElement('div');
  sandbox.improvementRangeRow(grid, 'farma', 'Farma', 3);
  const label = grid.querySelector('.dc-l');
  const btn = grid.querySelector('.dc-v-btn');
  check('improvementRangeRow: renderuje etykietę (dc-l) z nazwą ulepszenia', !!label && label.textContent === 'Farma', label && label.textContent);
  check('improvementRangeRow: renderuje klikalny przycisk (dc-v-btn) z licznikiem w tekście', !!btn && btn.textContent.includes('3'), btn && btn.textContent);
  check('improvementRangeRow: data-entity-kind="improvement" na przycisku', btn && btn.getAttribute('data-entity-kind') === 'improvement');
  check('improvementRangeRow: data-entity-id="farma" na przycisku', btn && btn.getAttribute('data-entity-id') === 'farma');

  sandbox.openEntityCardSpy.length = 0;
  if (btn) btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('klik przycisku wiersza wywołuje openEntityCard(\'improvement\', \'farma\', {mode:\'dialog\'}) DOKŁADNIE raz',
    sandbox.openEntityCardSpy.length === 1
    && sandbox.openEntityCardSpy[0].kind === 'improvement'
    && sandbox.openEntityCardSpy[0].key === 'farma'
    && sandbox.openEntityCardSpy[0].opts && sandbox.openEntityCardSpy[0].opts.mode === 'dialog',
    sandbox.openEntityCardSpy);
}

async function main() {
  console.log('[1] techDiscoveryNotice.ts — real Chromium click na wierszu "Ulepszenia terenu"');
  await testCallSite1TechDiscoveryNotice();

  console.log('\n[2] buildModeHud.ts — ikonka info niezależna od wyboru typu budowy (jsdom)');
  await testCallSite2BuildModeHud();

  console.log('\n[3] cityPanel.ts — sekcja "Ulepszenia w zasięgu" (vm-extraction + strukturalne)');
  testCallSite3CityPanel();

  console.log(`\n[improvement-card-callsites-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[improvement-card-callsites-test] błąd:', err);
  process.exit(1);
});
