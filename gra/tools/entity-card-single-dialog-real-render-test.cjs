'use strict';
/**
 * entity-card-single-dialog-real-render-test.cjs
 *
 * TEMAT: P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1.
 *
 * Zgloszenie wlasciciela: "Dopiero jak wylacze karte technologii, to wtedy sie wlacza
 * [poprzednia]. Chodzi o to, zeby nie wszystkie wlaczaly sie naraz, tylko ta, ktora sie
 * kliknie, aby pojawila sie obok, a gdy klika sie inna karte lub inny przycisk, powinna
 * zniknac i pojawic sie nowa."
 *
 * Co pilnuje (w PRAWDZIWYM Chromium, nie jsdom — jsdom nie liczy layoutu/kaskady, wiec
 * scrollIntoView + elementFromPoint + realny klik mysza sa tu bezuzyteczne bez zywej
 * przegladarki; precedens: entity-card-cross-links-button-style-real-render-test.cjs):
 *
 *  CZESC 1 — REGULA PRZECIW SAMOOSZUKIWANIU (00-dispatch.md): bundlujemy DWIE wersje
 *  `renderer.ts` W TYM SAMYM biegu testu — (a) PRE-NAPRAWA, dokladnie tresc z `git show
 *  HEAD:...` (czyli kod SPRZED tej rundy — HEAD jest commitem dispatchu, zanim Operator
 *  dotknal pliku), zaladowana jako WIRTUALNY modul (bez zapisu na dysk poza tools/), oraz
 *  (b) PO-NAPRAWIE, prawdziwy plik z drzewa roboczego. Obie maja WLASNA, ODDZIELONA
 *  instancje modulu (osobne domkniecia `overlaySeq`/`activeDialog`) — jsdom/esbuild
 *  deduplikuje wg sciezki, a wersja PRE ladowana jest pod sciezka wirtualna, wiec kolizji
 *  nie ma. Test NAJPIERW dowodzi, ze PRE-wersja FAKTYCZNIE reprodukuje dwa (a nawet cztery)
 *  jednoczesne `.entity-card-backdrop` w DOM przy scenariuszach z kryteriow 1/2/4 dispatchu
 *  — dopiero potem sprawdza, ze PO-wersja naprawia dokladnie te same scenariusze do zawsze
 *  JEDNEGO backdropu. Bez tej czesci test bylby tautologiczny (precedens
 *  P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1).
 *
 *  CZESC 2 — PO-NAPRAWIE, wszystkie 4 kryteria binarne z GOAL:
 *   (K1) Otwarcie A (technologia "Garncarstwo"), REALNY klik mysza w link krzyzowy
 *        WEWNATRZ A (budynek "Cegielnia" — dokladnie ta para ze zrzutow wlasciciela) →
 *        po otwarciu B dokladnie 1 backdrop w DOM, wylacznie B, A juz nie istnieje.
 *   (K2) Dwa NIEZWIAZANE, bezposrednie wywolania `openEntityCard(...)` (symulujace dwa
 *        rozne miejsca UI, np. buildModeHud.ts vs cityPanel.ts) w OBU kolejnosciach →
 *        zawsze dokladnie 1 backdrop, ostatnio otwarty wygrywa, niezaleznie od kolejnosci.
 *   (K3) Zamkniecie jedynego otwartego dialogu trzema drogami — wywolanie zwroconego
 *        `dismiss()` (droga X), klawisz Escape, klik w tlo backdropu poza dialogiem —
 *        za kazdym razem poprawnie usuwa go z DOM i z `escapeOverlayStack` (glebokosc 0).
 *   (K4) Otwarcie TEGO SAMEGO kind+id dwa razy pod rzad → zero duplikatu (nadal 1
 *        backdrop), zero dodatkowego wpisu w `escapeOverlayStack` (glebokosc nadal 1),
 *        zwrocony `dismiss` jest TYM SAMYM odwolaniem co za pierwszym razem (prawdziwy
 *        no-op, nie cichy rebuild).
 *
 * Zrzuty dowodowe: ustaw CIV_SHOTS_DIR=<katalog>, test zapisze tam PNG-i z zywej strony.
 *
 * Usage (z gra/): node tools/entity-card-single-dialog-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-card-single-dialog] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const REPO_ROOT = execSync('git rev-parse --show-toplevel', { cwd: GRA }).toString().trim();
const ENTITY_CARDS_DIR = path.resolve(GRA, 'src', 'ui', 'entityCards');
const RENDERER_REL_FROM_REPO_ROOT = 'gra/src/ui/entityCards/renderer.ts';
const ENTRY = path.resolve(__dirname, '.entity-card-single-dialog-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entity-card-single-dialog-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS_DIR = process.env.CIV_SHOTS_DIR ? path.resolve(process.env.CIV_SHOTS_DIR) : null;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function shot(page, name, opts) {
  if (!SHOTS_DIR) return Promise.resolve();
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  return page.screenshot(Object.assign({ path: path.join(SHOTS_DIR, name) }, opts || {}));
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[entity-card-single-dialog] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Vite-owe konstrukcje nie istnieja w golym esbuildzie — inline'ujemy PRAWDZIWE ikony,
 * zeby render byl 1:1 z produkcja (kopia z entity-card-cross-links-button-style-real-render-test). */
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'), loader: 'text',
    }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== BRAND_ASSETS_TS) return null;
      const src = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(BRAND_DIR, './brand/', {})),
      );
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const src = fs.readFileSync(args.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

/** Wstrzykuje PRE-NAPRAWA `renderer.ts` (dokladna tresc z `git show HEAD:...`) pod
 * wirtualna sciezka modulu — bez zapisu pliku gdziekolwiek poza plikami TEGO testu.
 * `resolveDir` wskazuje na PRAWDZIWY katalog `entityCards/`, wiec wzgledne importy
 * pre-naprawa wersji (escapeOverlayStack, registry, adaptery, types...) rozwiazuja sie
 * do TYCH SAMYCH, prawdziwych plikow co wersja po naprawie — jedyna roznica miedzy
 * dwiema zbundlowanymi instancjami to sama tresc `renderer.ts`. */
function prefixRendererPlugin(prefixSource) {
  const virtualPath = path.resolve(ENTITY_CARDS_DIR, '__renderer_prefix_virtual__.ts');
  return {
    name: 'prefix-renderer',
    setup(build) {
      build.onResolve({ filter: /^prefix-renderer$/ }, () => ({ path: virtualPath, namespace: 'prefix-renderer-ns' }));
      build.onLoad({ filter: /.*/, namespace: 'prefix-renderer-ns' }, () => ({
        contents: prefixSource, loader: 'ts', resolveDir: ENTITY_CARDS_DIR,
      }));
    },
  };
}

async function main() {
  // --- (0) Pobierz PRE-NAPRAWA tresc renderer.ts z HEAD (commit dispatchu, sprzed
  //     zmiany Operatora w tej rundzie) i upewnij sie, ze naprawde jest sprzed naprawy. ---
  const prefixSource = execSync(`git show HEAD:${RENDERER_REL_FROM_REPO_ROOT}`, { cwd: REPO_ROOT }).toString();
  const fixedSourceOnDisk = fs.readFileSync(path.resolve(ENTITY_CARDS_DIR, 'renderer.ts'), 'utf8');
  check('(0) HEAD:renderer.ts (PRE-naprawa) NIE zawiera jeszcze sledzenia "activeDialog"',
    !prefixSource.includes('activeDialog'));
  check('(0) plik roboczy renderer.ts (PO naprawie) zawiera sledzenie "activeDialog"',
    fixedSourceOnDisk.includes('activeDialog'));
  check('(0) tresc PRE i PO naprawie realnie sie roznia (nie ten sam string)',
    prefixSource !== fixedSourceOnDisk);

  fs.writeFileSync(ENTRY, [
    "import { openEntityCard as fixedOpenEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { openEntityCard as prefixOpenEntityCard } from 'prefix-renderer';",
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    "import { technologyIdFromName } from '../src/ui/entityCards/registry.ts';",
    "import {",
    "  _resetEscapeOverlayStackForTest, _getEscapeOverlayStackDepthForTest,",
    "} from '../src/ui/escapeOverlayStack.ts';",
    'window.__fixedOpenEntityCard = fixedOpenEntityCard;',
    'window.__prefixOpenEntityCard = prefixOpenEntityCard;',
    'window.__technologyIdFromName = technologyIdFromName;',
    'window.__escResetForTest = _resetEscapeOverlayStackForTest;',
    'window.__escDepthForTest = _getEscapeOverlayStackDepthForTest;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    // KOLEJNOSC KRYTYCZNA: `prefixRendererPlugin` MUSI byc PRZED `viteCompatPlugin` — generyczny
    // `onLoad({filter:/\.ts$/})` tego drugiego (bez namespace, wiec probowany dla KAZDEGO
    // dopasowania filtra niezaleznie od namespace) bezwarunkowo czyta plik z dysku PRZED
    // sprawdzeniem tresci, wiec dla wirtualnej sciezki rzucalby ENOENT, gdyby probowany byl
    // pierwszy. Rejestrujac wlasny plugin first, jego namespace'owy onLoad przechwytuje
    // wirtualna sciezke, zanim viteCompatPlugin w ogole ja zobaczy.
    plugins: [prefixRendererPlugin(prefixSource), viteCompatPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 980 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:"Segoe UI",Tahoma,sans-serif;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
    // PRAWDZIWY arkusz produkcyjny karty (backdrop position:fixed;inset:0, dialog
    // wysrodkowany itd.) — bez tego test klikniecia-w-tlo klikalby w domyslny, nieostylowany
    // layout bloku zamiast w realny, wyrenderowany overlay.
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = 'entity-card-css-under-test';
      style.textContent = window.__ENTITY_CARD_CSS;
      document.head.appendChild(style);
    });

    // Identyfikatory dokladnie ze zgloszenia wlasciciela: technologia "Garncarstwo"
    // odblokowuje budynek "Cegielnia" (link krzyzowy w sekcji "Budynki", widocznej
    // domyslnie — `technologyAdapter.ts` `buildingsSection` ma `openDefault: true`).
    const ids = await page.evaluate(() => ({
      techA: window.__technologyIdFromName('Garncarstwo'),
      techD: window.__technologyIdFromName('Rolnictwo'),
    }));
    check('(0) id technologii "Garncarstwo" rozwiazany', !!ids.techA, ids);
    check('(0) id technologii "Rolnictwo" rozwiazany', !!ids.techD, ids);
    const TECH_A = ids.techA;
    const TECH_D = ids.techD;
    const BUILDING_B = 'cegielnia'; // link krzyzowy wewnatrz karty Garncarstwa
    const BUILDING_C = 'kuznia'; // NIEZWIAZANY budynek — symuluje inne miejsce UI

    async function domState() {
      return page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('.entity-card-backdrop'));
        return {
          count: nodes.length,
          entries: nodes.map((n) => {
            const card = n.querySelector('.entity-card');
            return { kind: card && card.getAttribute('data-entity-kind'), id: card && card.getAttribute('data-entity-id') };
          }),
          escDepth: window.__escDepthForTest(),
        };
      });
    }

    /** Realny klik mysza (nie el.click()) w wiersz-link "Cegielnia" wewnatrz aktualnie
     * wierzchniego backdropu — dokladnie tak jak wlasciciel opisal w zgloszeniu. */
    async function clickBuildingLinkInsideTopDialog() {
      const rect = await page.evaluate(() => {
        const backs = document.querySelectorAll('.entity-card-backdrop');
        const top = backs[backs.length - 1];
        const row = top && top.querySelector('.entity-card-row[data-row-entity-kind="building"][data-row-entity-id="cegielnia"]');
        if (!row) return null;
        row.scrollIntoView({ block: 'center', inline: 'center' });
        const r = row.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
      });
      if (!rect) return null;
      await page.mouse.click(rect.x, rect.y);
      return rect;
    }

    // =================================================================================
    // CZESC 1 — REGULA PRZECIW SAMOOSZUKIWANIU: PRE-naprawa reprodukuje bug naprawde.
    // =================================================================================
    console.log('\n-- CZESC 1: PRE-naprawa (kod z HEAD, sprzed rundy) — dowod reprodukcji bugu --');

    await page.evaluate((techA) => { window.__prefixOpenEntityCard('technology', techA, { mode: 'dialog' }); }, TECH_A);
    let s = await domState();
    check('(PRE-P1) otwarcie A (Garncarstwo) daje 1 backdrop', s.count === 1 && s.entries[0].kind === 'technology' && s.entries[0].id === TECH_A, s);
    await shot(page, 'pre-01-single-tech.png');

    const clickRectPre = await clickBuildingLinkInsideTopDialog();
    check('(PRE) link krzyzowy "Cegielnia" znaleziony i widoczny wewnatrz A', !!clickRectPre && clickRectPre.w > 0 && clickRectPre.h > 0, clickRectPre);
    s = await domState();
    await shot(page, 'pre-02-po-kliku-DWA-backdropy.png', { fullPage: true });
    check('(PRE-P2, ANTY-SAMOOSZUKIWANIE) klik w link wewnatrz A NIE zamyka A — po otwarciu B w DOM sa DWA jednoczesne .entity-card-backdrop (Garncarstwo pod Cegielnia) — kod sprzed naprawy realnie reprodukuje bug ze zrzutow wlasciciela',
      s.count === 2
      && s.entries.some((e) => e.kind === 'technology' && e.id === TECH_A)
      && s.entries.some((e) => e.kind === 'building' && e.id === BUILDING_B), s);

    await page.evaluate((idC) => { window.__prefixOpenEntityCard('building', idC, { mode: 'dialog' }); }, BUILDING_C);
    s = await domState();
    check('(PRE-P3) bezposrednie otwarcie NIEZWIAZANEGO C przy 2 juz otwartych dokladajac trzeci — PRE-naprawa nie zamyka niczego (3 backdropy)', s.count === 3, s);

    await page.evaluate((idC) => { window.__prefixOpenEntityCard('building', idC, { mode: 'dialog' }); }, BUILDING_C);
    s = await domState();
    check('(PRE-P4) ponowne otwarcie TEGO SAMEGO kind+id (C) PRZED naprawa TWORZY duplikat (4 backdropy) — idempotencja rowniez byla zepsuta', s.count === 4, s);

    // Sprzatanie po sekcji PRE — nie dotyka modulu "fixed" (osobna instancja, nietkniete
    // dotad `overlaySeq`/`activeDialog`), wiec sekcja PO zaczyna od czystego stanu.
    await page.evaluate(() => {
      document.querySelectorAll('.entity-card-backdrop').forEach((n) => n.remove());
      window.__escResetForTest();
    });
    s = await domState();
    check('(0) sprzatanie po CZESCI 1 skuteczne (0 backdropow, glebokosc stosu 0)', s.count === 0 && s.escDepth === 0, s);

    // =================================================================================
    // CZESC 2 — PO NAPRAWIE: kryteria 1-4 z GOAL.
    // =================================================================================
    console.log('\n-- CZESC 2: PO naprawie (renderer.ts z drzewa roboczego) — kryteria 1-4 --');

    // ---- K1: klik w link WEWNATRZ A zamyka A i pokazuje wylacznie B ----
    await page.evaluate((techA) => { window.__fixedOpenEntityCard('technology', techA, { mode: 'dialog' }); }, TECH_A);
    s = await domState();
    check('(K1 setup) otwarcie A (Garncarstwo) po naprawie daje 1 backdrop', s.count === 1 && s.entries[0].id === TECH_A, s);
    await shot(page, 'fixed-01-single-tech.png');

    const clickRectFixed = await clickBuildingLinkInsideTopDialog();
    check('(K1) link krzyzowy "Cegielnia" znaleziony i widoczny wewnatrz A (po naprawie)', !!clickRectFixed && clickRectFixed.w > 0, clickRectFixed);
    s = await domState();
    await shot(page, 'fixed-02-po-kliku-JEDEN-backdrop.png', { fullPage: true });
    check('(K1) po realnym kliku myszy w link WEWNATRZ A: dokladnie 1 backdrop w DOM, wylacznie B (Cegielnia) — A (Garncarstwo) juz nie istnieje',
      s.count === 1 && s.entries[0].kind === 'building' && s.entries[0].id === BUILDING_B, s);

    // ---- K2: dwa NIEZWIAZANE, bezposrednie wywolania — obie kolejnosci ----
    await page.evaluate((idC) => { window.__fixedOpenEntityCard('building', idC, { mode: 'dialog' }); }, BUILDING_C);
    s = await domState();
    check('(K2a) bezposrednie otwarcie NIEZWIAZANEGO C (symulacja innego miejsca UI) zamyka poprzedni (Cegielnia) — 1 backdrop, C',
      s.count === 1 && s.entries[0].kind === 'building' && s.entries[0].id === BUILDING_C, s);

    await page.evaluate((techD) => { window.__fixedOpenEntityCard('technology', techD, { mode: 'dialog' }); }, TECH_D);
    s = await domState();
    check('(K2b) kolejnosc #1 (building → technology): otwarcie D po C daje 1 backdrop, D wygrywa',
      s.count === 1 && s.entries[0].kind === 'technology' && s.entries[0].id === TECH_D, s);

    await page.evaluate((idC) => { window.__fixedOpenEntityCard('building', idC, { mode: 'dialog' }); }, BUILDING_C);
    s = await domState();
    check('(K2c) kolejnosc #2, odwrotna (technology → building): otwarcie C po D daje 1 backdrop, C wygrywa — kolejnosc otwarcia nie ma znaczenia',
      s.count === 1 && s.entries[0].kind === 'building' && s.entries[0].id === BUILDING_C, s);

    // ---- K4: idempotencja — ten sam kind+id dwa razy pod rzad ----
    const idem = await page.evaluate((idC) => {
      const before = window.__escDepthForTest();
      const d1 = window.__fixedOpenEntityCard('building', idC, { mode: 'dialog' });
      const afterFirst = { count: document.querySelectorAll('.entity-card-backdrop').length, escDepth: window.__escDepthForTest() };
      const d2 = window.__fixedOpenEntityCard('building', idC, { mode: 'dialog' }); // TEN SAM kind+id
      const afterSecond = { count: document.querySelectorAll('.entity-card-backdrop').length, escDepth: window.__escDepthForTest() };
      return { before, afterFirst, afterSecond, sameDismiss: d1 === d2 };
    }, BUILDING_C);
    check('(K4) drugie otwarcie TEGO SAMEGO kind+id NIE tworzy duplikatu (nadal 1 backdrop)', idem.afterFirst.count === 1 && idem.afterSecond.count === 1, idem);
    check('(K4) drugie otwarcie TEGO SAMEGO kind+id NIE dodaje wpisu do escapeOverlayStack (glebokosc nadal 1)', idem.afterFirst.escDepth === 1 && idem.afterSecond.escDepth === 1, idem);
    check('(K4) zwrocony "dismiss" z drugiego wywolania jest TYM SAMYM odwolaniem co z pierwszego (prawdziwy no-op, nie cichy rebuild)', idem.sameDismiss === true, idem);

    // ---- K3a: zamkniecie przez zwrocony dismiss() (droga "X") ----
    const closedViaDismiss = await page.evaluate(() => {
      // jedyny obecnie otwarty dialog to ten z kroku K4 (building/kuznia) — jego dismiss
      // trzymamy tu, bo poprzedni page.evaluate zakonczyl sie i zwrocil tylko booleana.
      const btn = document.querySelector('.entity-card-backdrop .entity-card');
      // Otwierzmy JESZCZE RAZ swiezy dialog i uzyjmy jego wlasnego zwroconego dismiss —
      // czystszy dowod niz poleganie na zmiennej z poprzedniego evaluate.
      document.querySelectorAll('.entity-card-backdrop').forEach((n) => n.remove());
      window.__escResetForTest();
      const dismiss = window.__fixedOpenEntityCard('technology', window.__technologyIdFromName('Garncarstwo'), { mode: 'dialog' });
      const before = { count: document.querySelectorAll('.entity-card-backdrop').length, escDepth: window.__escDepthForTest() };
      dismiss();
      const after = { count: document.querySelectorAll('.entity-card-backdrop').length, escDepth: window.__escDepthForTest() };
      return { before, after };
    });
    check('(K3 — droga X) wywolanie zwroconego dismiss() usuwa jedyny dialog z DOM i ze stosu Escape (0/0), zero regresu',
      closedViaDismiss.before.count === 1 && closedViaDismiss.before.escDepth === 1
      && closedViaDismiss.after.count === 0 && closedViaDismiss.after.escDepth === 0, closedViaDismiss);

    // ---- K3b: zamkniecie klawiszem Escape ----
    await page.evaluate((techA) => { window.__fixedOpenEntityCard('technology', techA, { mode: 'dialog' }); }, TECH_A);
    s = await domState();
    check('(K3 — Escape, setup) dialog otwarty przed testem Escape', s.count === 1 && s.escDepth === 1, s);
    await page.keyboard.press('Escape');
    s = await domState();
    check('(K3 — Escape) klawisz Escape zamyka jedyny otwarty dialog — 0 backdropow, glebokosc stosu 0, zero regresu',
      s.count === 0 && s.escDepth === 0, s);

    // ---- K3c: zamkniecie klikiem w tlo (poza dialogiem) ----
    await page.evaluate((techA) => { window.__fixedOpenEntityCard('technology', techA, { mode: 'dialog' }); }, TECH_A);
    s = await domState();
    check('(K3 — klik w tlo, setup) dialog otwarty przed testem klikniecia w tlo', s.count === 1 && s.escDepth === 1, s);
    await page.mouse.click(4, 4); // rog viewportu — na pewno backdrop, nie .entity-card-dialog (wysrodkowany)
    s = await domState();
    await shot(page, 'fixed-03-po-kliku-w-tlo.png');
    check('(K3 — klik w tlo) klik w backdrop poza dialogiem zamyka go — 0 backdropow, glebokosc stosu 0, zero regresu',
      s.count === 0 && s.escDepth === 0, s);

    check('brak bledow konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[entity-card-single-dialog] ${pass} pass, ${fail} fail`);
  if (SHOTS_DIR) console.log('[entity-card-single-dialog] zrzuty: ' + SHOTS_DIR);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
