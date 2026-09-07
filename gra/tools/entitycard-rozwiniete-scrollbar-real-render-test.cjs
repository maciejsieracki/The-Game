'use strict';
/**
 * entitycard-rozwiniete-scrollbar-real-render-test.cjs
 *
 * TEMAT: R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1
 *
 * Zgłoszenie właściciela (żywa rozmowa, zrzut karty technologii "Gospodarka wodna"):
 * "Wszystkie możliwe elementy w karcie technologii powinny być rozwinięte, a nie
 * zwinięte. Za każdym razem muszę klikać i rozwijać... Powinien być pasek przewijania,
 * żeby było widoczne, że poniżej jest jeszcze treść."
 *
 * Sprawdza w PRAWDZIWYM Chromium (nie jsdom — jsdom nie liczy layoutu/scrollHeight,
 * wiec overflow/scrollbar sa tu bezuzyteczne bez zywej przegladarki):
 *
 *  (K1) Karta technologii "Gospodarka wodna" (dokladnie ta ze zrzutu wlasciciela) —
 *       sekcje "Ulepszenia terenu" (key=improvements) i "Zmiany ekonomiczne" (key=econ)
 *       maja `data-open="1"` i widoczne body (bez `hidden`) ZARAZ po otwarciu, BEZ
 *       zadnego kliku.
 *  (K2) Mechanizm recznego zwijania ZOSTAJE: klik w naglowek sekcji "improvements"
 *       zwija ja (`data-open` -> "0", body `hidden`), drugi klik ja przywraca — dowod,
 *       ze zmienil sie WYLACZNIE stan startowy, nie usunieto akordeonu.
 *  (K3) Pasek przewijania `.entity-card-dialog` jest zarezerwowany w layoucie
 *       (offsetWidth - clientWidth >= 8px) na karcie, ktorej tresc przekracza
 *       wysokosc okna (scrollHeight > clientHeight), BEZ zadnej interakcji scrolla.
 *  (K4, DOWOD NIETAUTOLOGICZNOSCI) Ten sam pomiar (K1) i (K3) powtorzony z CSS
 *       SPRZED tego tematu (dwie linie `.entity-card-dialog{...}` bez reguł
 *       ::-webkit-scrollbar/scrollbar-width, sekcje z `openDefault:false`) —
 *       MUSI dac przeciwny wynik: sekcje zwiniete, `getComputedStyle(dialog,
 *       '::-webkit-scrollbar').width` rozny od wartosci PO zmianie. Gdyby (K1)/(K3)
 *       przechodzily tez na starym kodzie, nie dowodzilyby niczego.
 *  (K5, PIKSELE) Uchwyt paska jest FAKTYCZNIE NAMALOWANY (>200 zlotych pikseli w pasie
 *       prawej krawedzi dialogu, bez zadnej interakcji), jest KROTSZY niz dialog i
 *       PRZESUWA SIE po przewinieciu — (K3) mierzy wylacznie rezerwacje miejsca, ktora
 *       `scrollbar-gutter:stable` daje takze bez malowanego uchwytu.
 *  (K6, DOWOD NIETAUTOLOGICZNOSCI DLA PASKA) Ten sam pomiar pikselowy uruchomiony na kodzie
 *       SPRZED tematu daje < 50 zlotych pikseli (natywny pasek Chromium jest SZARY), przy
 *       czym (K6a) jawnie pokazuje, ze samo (K3, `>= 8`) na starym kodzie TEZ jest zielone
 *       (natywny pasek 15px) — czyli (K3) w tym srodowisku niczego nie dowodzi i to (K5)/(K6)
 *       niosa dowod dla czesci (B) GOAL. Zarzut #2 Evaluatora, runda 2.
 *
 * Zrzuty dowodowe: ustaw CIV_SHOTS_DIR=<katalog>, test zapisze tam PNG.
 *
 * Usage (z gra/): xvfb-run -a node tools/entitycard-rozwiniete-scrollbar-real-render-test.cjs
 * (MUSI biec pod `xvfb-run` — patrz komentarz przy launchBrowser(): headless:true w Playwright
 * dokleja `--hide-scrollbars`, co unieważnia (K3) niezaleznie od CSS pod testem.)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { PNG } = require(path.resolve(__dirname, '..', 'node_modules', 'pngjs'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entitycard-rozwiniete-scrollbar] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTITY_CARDS_DIR = path.resolve(GRA, 'src', 'ui', 'entityCards');
const RENDERER_TS = path.resolve(ENTITY_CARDS_DIR, 'renderer.ts');
const TECH_ADAPTER_TS = path.resolve(ENTITY_CARDS_DIR, 'technologyAdapter.ts');
// P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1 (R-PROC-AUTOBOT.md §6): katalog tymczasowy bramki
// MUSI byc unikalny per przebieg. Stale nazwy w `gra/tools/` dawaly juz w tym repo falszywy
// ZIELONY i falszywy CZERWONY przy rownoleglych przebiegach, a przerwany przebieg (timeout/kill
// przed `finally`) zostawial w drzewie roboczym NIEIGNOROWANE artefakty (*-bundle-*.cjs nie sa
// w .gitignore). Wszystkie pliki robocze ida wiec do wlasnego mkdtemp poza repo.
const TMPDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'entitycard-rozwiniete-scrollbar-'));
const ENTRY = path.join(TMPDIR, 'entry.ts');
const OUTFILE_FIXED = path.join(TMPDIR, 'bundle-fixed.cjs');
const OUTFILE_PRE = path.join(TMPDIR, 'bundle-pre.cjs');
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

// UWAGA (K3, pasek przewijania): Playwright w trybie `headless:true` dokleja BEZWARUNKOWO
// `--hide-scrollbars` (playwright-core, chromium.js::_innerDefaultArgs) — to ukrywa KAZDY
// pasek przewijania, tez wlasny/stylowany ::-webkit-scrollbar, wiec test paska musi biegac
// PRAWDZIWIE nieheadless (`headless:false`) pod wirtualnym X (Xvfb, `xvfb-run`), inaczej
// (K3) bylby zielony/czerwony przypadkowo niezaleznie od CSS (test zawsze widzialby brak
// paska). Skrypt uruchamiaj przez `xvfb-run -a node tools/...cjs` (patrz naglowek pliku).
async function launchBrowser() {
  try { return await chromium.launch({ headless: false }); }
  catch (e) {
    console.log('[entitycard-rozwiniete-scrollbar] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: false, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Vite-owe konstrukcje nie istnieja w golym esbuildzie (kopia wzorca z
 * entity-card-single-dialog-real-render-test.cjs / entity-card-cross-links-button-style). */
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

/** Wstrzykuje wersje `renderer.ts` PRZEZ wirtualna sciezke `prefix-renderer`, ORAZ
 * przechwytuje jego WEWNETRZNY wzgledny import `./technologyAdapter` (ktorego renderer.ts
 * uzywa naprawde, linia 16), przekierowujac go na WLASNA tresc `technologyAdapter.ts` —
 * inaczej bundle uzylby prawdziwego pliku z dysku zamiast wersji mutowanej dla (PRZED). */
function prefixRendererPlugin(rendererSource, techAdapterSource) {
  const virtualRendererPath = path.resolve(ENTITY_CARDS_DIR, '__renderer_virtual__.ts');
  const virtualTechAdapterPath = path.resolve(ENTITY_CARDS_DIR, '__tech_adapter_virtual__.ts');
  return {
    name: 'prefix-renderer',
    setup(build) {
      build.onResolve({ filter: /^prefix-renderer$/ }, () => ({ path: virtualRendererPath, namespace: 'ns-renderer' }));
      build.onLoad({ filter: /.*/, namespace: 'ns-renderer' }, () => ({
        contents: rendererSource, loader: 'ts', resolveDir: ENTITY_CARDS_DIR,
      }));
      // Przechwycenie WYLACZNIE importu './technologyAdapter' pochodzacego z wirtualnego
      // renderera — importer musi byc dokladnie virtualRendererPath, zeby nie przekierowac
      // przypadkiem jakiegos innego, niezwiazanego importu tej samej nazwy pliku.
      build.onResolve({ filter: /^\.\/technologyAdapter$/ }, (args) => {
        if (args.importer !== virtualRendererPath) return null;
        return { path: virtualTechAdapterPath, namespace: 'ns-tech-adapter' };
      });
      build.onLoad({ filter: /.*/, namespace: 'ns-tech-adapter' }, () => ({
        contents: techAdapterSource, loader: 'ts', resolveDir: ENTITY_CARDS_DIR,
      }));
    },
  };
}

async function buildBundle(outfile, rendererSource, techAdapterSource) {
  fs.writeFileSync(ENTRY, [
    "import { openEntityCard as openEntityCardImpl, ENTITY_CARD_CSS } from 'prefix-renderer';",
    // ENTRY lezy w mkdtemp poza repo — sciezka do registry.ts MUSI byc absolutna,
    // relatywne '../src/...' rozwiazaloby sie wzgledem katalogu tymczasowego.
    'import { technologyIdFromName } from ' + JSON.stringify(path.resolve(ENTITY_CARDS_DIR, 'registry.ts').split(path.sep).join('/')) + ';',
    'window.__openEntityCard = openEntityCardImpl;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__technologyIdFromName = technologyIdFromName;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    // KOLEJNOSC KRYTYCZNA (jak w entity-card-single-dialog-real-render-test.cjs):
    // prefixRendererPlugin PRZED viteCompatPlugin — generyczny onLoad tego drugiego
    // czytalby wirtualna sciezke z dysku (ENOENT) zanim namespace'owy onLoad tego
    // pierwszego zdazyl ja przechwycic.
    plugins: [prefixRendererPlugin(rendererSource, techAdapterSource), viteCompatPlugin],
    logLevel: 'silent',
  });
}

// ---------- (K5) analiza PIKSELI uchwytu paska ----------
// POWOD ISTNIENIA (zarzut #2 Evaluatora, runda 2): kryterium (K3) `offsetWidth - clientWidth >= 8`
// jest w tym srodowisku TAUTOLOGICZNE — kod SPRZED tematu daje natywny pasek 15px, wiec 15 >= 8
// tez wypada zielono. Podobnie `getComputedStyle(dialog,'::-webkit-scrollbar').width` odczytuje
// DEKLARACJE reguly, a nie to, czym silnik maluje (Chromium majac `scrollbar-width:thin` +
// `scrollbar-color` blok ::-webkit-scrollbar IGNORUJE: deklaracja 12px, realny gutter 10px).
// Jedyny pomiar, ktory faktycznie ODROZNIA obie wersje, to liczba ZLOTYCH pikseli uchwytu
// w pasie prawej krawedzi dialogu — zmierzone: PO ~1700, PRZED 0 (natywny pasek jest szary).
/** Uchwyt rgba(232,216,138,.55) skomponowany na ciemnym torze daje kolor wyraznie zoltawy
 *  (r>g>b, duze r-b). Tor rgba(20,26,34,.9) i natywny SZARY pasek Chromium (r==g==b) nie przechodza. */
function isGold(r, g, b) { return r >= 100 && g >= 85 && r - b >= 35 && g - b >= 20; }
/** Zwraca {count, minY, maxY, segs} dla pasa [x0,x1) x [y0,y1) na zrzucie PNG.
 *  Zlota kolumna na CALEJ wysokosci dialogu to zlote OBRAMOWANIE karty, nie uchwyt — odrzucana
 *  jawnie. Prog gestosci wiersza (>=4) odcina antyaliasing, a segmentacja (najdluzszy spojny
 *  segment = uchwyt) nie pozwala, zeby gorna/dolna krawedz ramki udawala uchwyt na cala wysokosc. */
function goldProfile(pngPath, x0, x1, y0, y1) {
  const png = PNG.sync.read(fs.readFileSync(pngPath));
  const X0 = Math.max(0, x0), X1 = Math.min(png.width, x1);
  const Y0 = Math.max(0, y0), Y1 = Math.min(png.height, y1);
  const H = Y1 - Y0;
  const gold = (x, y) => { const i = (png.width * y + x) << 2; return isGold(png.data[i], png.data[i + 1], png.data[i + 2]); };
  const border = [];
  for (let x = X0; x < X1; x++) {
    let c = 0;
    for (let y = Y0; y < Y1; y++) if (gold(x, y)) c++;
    if (c > H * 0.9) border.push(x);
  }
  let count = 0; const segs = []; let st = null;
  for (let y = Y0; y < Y1; y++) {
    let rowCount = 0;
    for (let x = X0; x < X1; x++) { if (border.includes(x)) continue; if (gold(x, y)) rowCount++; }
    if (rowCount >= 4) { count += rowCount; if (st === null) st = y; }
    else if (st !== null) { segs.push([st, y - 1]); st = null; }
  }
  if (st !== null) segs.push([st, Y1 - 1]);
  const longest = segs.slice().sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0] || null;
  return { count, minY: longest ? longest[0] : null, maxY: longest ? longest[1] : null, segs, borderCols: border };
}
/** Pas prawej krawedzi dialogu — dokladnie tam, gdzie silnik maluje pasek przewijania. */
function strip(m) {
  return {
    x0: Math.round(m.rect.right) - Math.max(9, m.scrollbarWidth),
    x1: Math.round(m.rect.right) - 1,
    y0: Math.round(m.rect.y),
    y1: Math.round(m.rect.y + m.rect.h),
  };
}

async function measure(page, techId) {
  return page.evaluate((techId) => {
    document.querySelectorAll('.entity-card-backdrop').forEach((n) => n.remove());
    window.__openEntityCard('technology', techId, { mode: 'dialog' });
    const dialog = document.querySelector('.entity-card-dialog');
    const sec = (key) => {
      const s = document.querySelector(`.entity-card-section[data-section-key="${key}"]`);
      if (!s) return null;
      const body = s.querySelector('.entity-card-section-body');
      return {
        open: s.getAttribute('data-open'),
        bodyHidden: body ? body.hidden : null,
        rowsVisible: body ? (body.offsetParent !== null && !body.hidden) : false,
      };
    };
    const scrollbarWidth = dialog.offsetWidth - dialog.clientWidth;
    const cs = getComputedStyle(dialog, '::-webkit-scrollbar');
    const r = dialog.getBoundingClientRect();
    return {
      improvements: sec('improvements'),
      econ: sec('econ'),
      scrollTop: dialog.scrollTop,
      scrollHeight: dialog.scrollHeight,
      clientHeight: dialog.clientHeight,
      overflows: dialog.scrollHeight > dialog.clientHeight,
      scrollbarWidth,
      webkitScrollbarWidth: cs ? cs.width : null,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right },
    };
  }, techId);
}

async function main() {
  // --- (0) Wersja "PO" = drzewo robocze (dokladnie stan po zadaniu Operatora). ---
  const rendererFixed = fs.readFileSync(RENDERER_TS, 'utf8');
  const techAdapterFixed = fs.readFileSync(TECH_ADAPTER_TS, 'utf8');
  check('(0) renderer.ts niesie nowy blok ::-webkit-scrollbar dla .entity-card-dialog',
    /\.entity-card-dialog::-webkit-scrollbar\{/.test(rendererFixed));
  check('(0) renderer.ts niesie scrollbar-width:thin dla .entity-card-dialog',
    /\.entity-card-dialog\{[^}]*scrollbar-width:thin/.test(rendererFixed));
  check('(0) technologyAdapter.ts: sekcja improvements ma openDefault: true',
    /key: 'improvements'[\s\S]{0,80}openDefault: true/.test(techAdapterFixed));
  check('(0) technologyAdapter.ts: sekcja econ ma openDefault: true',
    /key: 'econ'[\s\S]{0,80}openDefault: true/.test(techAdapterFixed));

  // --- (0) Wersja "PRZED" = dokladnie odtworzony stan sprzed tego tematu (mutacja w pamieci,
  //     bez zaleznosci od historii Gita — precedens entity-card-single-dialog-real-render-test). ---
  check('(0) technologyAdapter.ts na dysku nie zawiera juz starego "openDefault: false" (zeby regex podmiany mial czego dotyczyc)',
    (techAdapterFixed.match(/openDefault: false/g) || []).length === 0);
  const techAdapterPre = techAdapterFixed
    .replace("key: 'improvements', title: 'Ulepszenia terenu', rows: improvementsRows,\n    collapsible: true, openDefault: true,",
      "key: 'improvements', title: 'Ulepszenia terenu', rows: improvementsRows,\n    collapsible: true, openDefault: false,")
    .replace("key: 'econ', title: 'Zmiany ekonomiczne', rows: econRows, collapsible: true, openDefault: true,",
      "key: 'econ', title: 'Zmiany ekonomiczne', rows: econRows, collapsible: true, openDefault: false,");
  check('(0) mutacja PRZED faktycznie zmienila tresc technologyAdapter.ts (nie no-op)',
    techAdapterPre !== techAdapterFixed && (techAdapterPre.match(/openDefault: false/g) || []).length === 2);

  const rendererPre = rendererFixed.replace(
    /\.entity-card-dialog\{position:relative;height:min\(80vh,calc\(100vh - 32px\)\);overflow:auto;\s*\n\s*margin:auto 0;[\s\S]*?entity-card-dialog::-webkit-scrollbar-thumb:hover\{background:rgba\(232,216,138,\.75\);\}\n/,
    '.entity-card-dialog{position:relative;height:min(80vh,calc(100vh - 32px));overflow:auto;\n  margin:auto 0;}\n',
  );
  check('(0) mutacja PRZED faktycznie usunela nowy CSS scrollbara (nie no-op)',
    rendererPre !== rendererFixed && !/::-webkit-scrollbar/.test(rendererPre) && !/scrollbar-width:thin/.test(rendererPre));

  await buildBundle(OUTFILE_FIXED, rendererFixed, techAdapterFixed);
  await buildBundle(OUTFILE_PRE, rendererPre, techAdapterPre);

  const browser = await launchBrowser();
  // Viewport celowo mala wysokosc — wymusza scrollHeight > clientHeight niezaleznie od
  // dlugosci tresci konkretnej technologii (Fibonacci nie jest potrzebny: 80vh z okna 560px
  // wysokosci to dialog max ~448px, a karta "Gospodarka wodna" z pelnymi sekcjami przekracza to).
  const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:"Segoe UI",Tahoma,sans-serif;}'
      + '</style></head><body></body></html>');

    // ===================== CZESC PO (drzewo robocze) =====================
    console.log('\n-- CZESC PO (renderer.ts + technologyAdapter.ts z drzewa roboczego) --');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE_FIXED, 'utf8') });
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = 'entity-card-css-under-test';
      style.textContent = window.__ENTITY_CARD_CSS;
      document.head.appendChild(style);
    });
    const techId = await page.evaluate(() => window.__technologyIdFromName('Gospodarka wodna'));
    check('(setup) id technologii "Gospodarka wodna" rozwiazany', !!techId, techId);

    const post = await measure(page, techId);
    await shot(page, 'po-01-karta-otwarta.png', { fullPage: false });
    check('(K1a) sekcja "Ulepszenia terenu" (improvements) ma data-open="1" ZARAZ po otwarciu, bez klikniecia',
      post.improvements && post.improvements.open === '1', post.improvements);
    check('(K1a) sekcja "Ulepszenia terenu": body NIE ma atrybutu hidden (faktycznie widoczna)',
      post.improvements && post.improvements.bodyHidden === false && post.improvements.rowsVisible === true, post.improvements);
    check('(K1b) sekcja "Zmiany ekonomiczne" (econ) ma data-open="1" ZARAZ po otwarciu, bez klikniecia',
      post.econ && post.econ.open === '1', post.econ);
    check('(K1b) sekcja "Zmiany ekonomiczne": body NIE ma atrybutu hidden (faktycznie widoczna)',
      post.econ && post.econ.bodyHidden === false && post.econ.rowsVisible === true, post.econ);

    check('(precond) karta "Gospodarka wodna" w oknie 900x560 faktycznie przekracza wysokosc dialogu (scrollHeight > clientHeight) — bez tego test paska przewijania jest pusty',
      post.overflows === true, { scrollHeight: post.scrollHeight, clientHeight: post.clientHeight });
    check('(K3) pasek przewijania .entity-card-dialog jest TRWALE zarezerwowany w layoucie (offsetWidth - clientWidth >= 8px), bez zadnej interakcji scrolla',
      post.scrollbarWidth >= 8, post.scrollbarWidth);
    check('(K3, precond) karta jest w stanie NIETKNIETYM: scrollTop === 0 (zaden gest przewijania nie byl wykonany)',
      post.scrollTop === 0, post.scrollTop);

    // ---- (K5) DOWOD PIKSELOWY: uchwyt jest FAKTYCZNIE NAMALOWANY i SIE PRZESUWA ----
    // (K3) mierzy tylko REZERWACJE miejsca, ktora `scrollbar-gutter:stable` daje takze wtedy,
    // gdy zaden uchwyt nie jest malowany — i ktora kod sprzed tematu tez spelnia (natywne 15px).
    const sPost = strip(post);
    const shotPostTop = path.join(TMPDIR, 'po-top.png');
    await page.screenshot({ path: shotPostTop });
    const gPostTop = goldProfile(shotPostTop, sPost.x0, sPost.x1, sPost.y0, sPost.y1);
    console.log('   [info] PO, pas x=' + sPost.x0 + '..' + sPost.x1 + ': zlotych pikseli=' + gPostTop.count
      + ', segmenty=' + JSON.stringify(gPostTop.segs) + ', kolumny-ramka=' + JSON.stringify(gPostTop.borderCols));
    check('(K5a, PIKSELE) BEZ zadnej interakcji w pasie prawej krawedzi dialogu jest > 200 ZLOTYCH pikseli uchwytu — pasek jest NAMALOWANY, nie tylko zarezerwowany w layoucie',
      gPostTop.count > 200, gPostTop.count);
    const thumbLen = gPostTop.minY === null ? 0 : gPostTop.maxY - gPostTop.minY + 1;
    check('(K5b, PIKSELE) uchwyt jest KROTSZY niz dialog (blok przewijania z proporcja, nie zlota listwa na calej wysokosci)',
      thumbLen > 10 && thumbLen < post.rect.h * 0.9, { thumbLen, dialogH: Math.round(post.rect.h) });
    check('(K5c, PIKSELE) przy scrollTop=0 uchwyt lezy PRZY GORZE toru',
      gPostTop.minY !== null && gPostTop.minY - sPost.y0 < post.rect.h * 0.2, { minY: gPostTop.minY, y0: sPost.y0 });
    await page.evaluate(() => { const d = document.querySelector('.entity-card-dialog'); d.scrollTop = d.scrollHeight; });
    const shotPostBot = path.join(TMPDIR, 'po-bot.png');
    await page.screenshot({ path: shotPostBot });
    const gPostBot = goldProfile(shotPostBot, sPost.x0, sPost.x1, sPost.y0, sPost.y1);
    console.log('   [info] PO po przewinieciu na dol: segmenty=' + JSON.stringify(gPostBot.segs));
    check('(K5d, PIKSELE) po przewinieciu na dol uchwyt PRZESUNAL SIE w dol o > 1/3 wysokosci dialogu — to DZIALAJACY pasek przewijania, nie namalowany ornament',
      gPostBot.minY !== null && gPostTop.minY !== null && gPostBot.minY - gPostTop.minY > post.rect.h / 3,
      { topMinY: gPostTop.minY, botMinY: gPostBot.minY, dialogH: Math.round(post.rect.h) });
    await page.evaluate(() => { const d = document.querySelector('.entity-card-dialog'); d.scrollTop = 0; });

    // Dodatkowy zrzut dowodowy: przewiniecie do sekcji improvements/econ pokazuje ich
    // TRESC (nie sam naglowek) — dowod, ze "rozwiniete" znaczy realnie widoczne wiersze,
    // nie tylko atrybut data-open bez odpowiadajacego im layoutu. Celowo PO dowodzie
    // pikselowym (K5), zeby tamten mierzyl karte w stanie nietknietym (scrollTop === 0).
    await page.evaluate(() => {
      const s = document.querySelector('.entity-card-section[data-section-key="improvements"]');
      s.scrollIntoView({ block: 'start' });
    });
    await shot(page, 'po-01b-scroll-do-improvements-econ.png', { fullPage: false });
    await page.evaluate(() => { const d = document.querySelector('.entity-card-dialog'); d.scrollTop = 0; });

    // ---- K2: mechanizm recznego zwijania ZOSTAJE ----
    const toggle1 = await page.evaluate(() => {
      const s = document.querySelector('.entity-card-section[data-section-key="improvements"]');
      const headBtn = s.querySelector('.entity-card-section-head');
      headBtn.click();
      const body = s.querySelector('.entity-card-section-body');
      return { open: s.getAttribute('data-open'), bodyHidden: body.hidden };
    });
    check('(K2) klik w naglowek sekcji "Ulepszenia terenu" nadal ZWIJA ja recznie (data-open -> "0", body hidden) — mechanizm akordeonu NIE zostal usuniety',
      toggle1.open === '0' && toggle1.bodyHidden === true, toggle1);
    const toggle2 = await page.evaluate(() => {
      const s = document.querySelector('.entity-card-section[data-section-key="improvements"]');
      const headBtn = s.querySelector('.entity-card-section-head');
      headBtn.click();
      const body = s.querySelector('.entity-card-section-body');
      return { open: s.getAttribute('data-open'), bodyHidden: body.hidden };
    });
    check('(K2) drugi klik w ten sam naglowek PRZYWRACA rozwiniecie (data-open -> "1", body widoczna) — akordeon dziala w obie strony',
      toggle2.open === '1' && toggle2.bodyHidden === false, toggle2);
    await shot(page, 'po-02-po-recznym-zwinieciu-i-przywroceniu.png', { fullPage: false });

    // ===================== CZESC PRZED (dowod nietautologicznosci) =====================
    console.log('\n-- CZESC PRZED (renderer.ts + technologyAdapter.ts SPRZED tego tematu, mutacja w pamieci) --');
    await page.evaluate(() => { document.getElementById('entity-card-css-under-test').remove(); });
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE_PRE, 'utf8') });
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.id = 'entity-card-css-pre';
      style.textContent = window.__ENTITY_CARD_CSS;
      document.head.appendChild(style);
    });
    const pre = await measure(page, techId);
    await shot(page, 'przed-01-karta-otwarta-zwiniete.png', { fullPage: false });

    check('(PRE, ANTY-SAMOOSZUKIWANIE) sprzed tematu: sekcja "Ulepszenia terenu" jest domyslnie ZWINIETA (data-open="0", body hidden) — dokladnie zglaszany problem',
      pre.improvements && pre.improvements.open === '0' && pre.improvements.bodyHidden === true, pre.improvements);
    check('(PRE, ANTY-SAMOOSZUKIWANIE) sprzed tematu: sekcja "Zmiany ekonomiczne" jest domyslnie ZWINIETA (data-open="0", body hidden)',
      pre.econ && pre.econ.open === '0' && pre.econ.bodyHidden === true, pre.econ);
    check('(PRE, ANTY-SAMOOSZUKIWANIE) sprzed tematu: ::-webkit-scrollbar dialogu NIE ma jawnej szerokosci 12px z naszego CSS (rozny wynik niz PO)',
      pre.webkitScrollbarWidth !== post.webkitScrollbarWidth || post.webkitScrollbarWidth == null, { pre: pre.webkitScrollbarWidth, post: post.webkitScrollbarWidth });
    check('(K4, PRZYCZYNOWOSC) ta sama miara (K1a/K1b) daje PRZECIWNY wynik na starym kodzie niz na nowym — dowod, ze (K1) faktycznie testuje zmiane, nie przechodzi z definicji',
      post.improvements.open === '1' && pre.improvements.open === '0'
      && post.econ.open === '1' && pre.econ.open === '0', { post, pre });

    // ---- (K6) DOWOD NIETAUTOLOGICZNOSCI DLA CZESCI (B) GOAL ----
    // Ten sam pomiar pikselowy, ktory na wersji PO dal (K5a), uruchomiony na kodzie SPRZED
    // tematu. Bez tego (K3) mierzy kryterium, ktore stary kod tez spelnia.
    const sPre = strip(pre);
    const shotPre = path.join(TMPDIR, 'przed-top.png');
    await page.screenshot({ path: shotPre });
    const gPre = goldProfile(shotPre, sPre.x0, sPre.x1, sPre.y0, sPre.y1);
    console.log('   [info] PRZED, pas x=' + sPre.x0 + '..' + sPre.x1 + ': zlotych pikseli=' + gPre.count
      + ', gutter=' + pre.scrollbarWidth + 'px (PO: ' + post.scrollbarWidth + 'px)');
    check('(K6a, JAWNIE) kryterium (K3) `>= 8` uruchomione na kodzie SPRZED tematu TEZ wypada zielono — samo (K3) NIE jest dowodem zmiany, dlatego istnieje (K5)/(K6b)',
      pre.scrollbarWidth >= 8, { pre: pre.scrollbarWidth, post: post.scrollbarWidth });
    check('(K6b, PRZYCZYNOWOSC PIKSELOWA) ta sama miara co (K5a) daje na kodzie SPRZED tematu < 50 zlotych pikseli w tym samym pasie (natywny pasek jest SZARY) — pomiar odroznia obie wersje',
      gPre.count < 50, { pre: gPre.count, post: gPostTop.count });
    check('(K6c) roznica miedzy wersjami jest ILOSCIOWO jednoznaczna (PO co najmniej 10x wiecej zlotych pikseli niz PRZED) — regresja CSS paska ZACZERWIENI ta bramke',
      gPostTop.count >= Math.max(200, 10 * (gPre.count + 1)), { pre: gPre.count, post: gPostTop.count });

    check('brak bledow konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(TMPDIR, { recursive: true, force: true });
  }

  console.log('');
  console.log(`[entitycard-rozwiniete-scrollbar] ${pass} pass, ${fail} fail`);
  if (SHOTS_DIR) console.log('[entitycard-rozwiniete-scrollbar] zrzuty: ' + SHOTS_DIR);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
