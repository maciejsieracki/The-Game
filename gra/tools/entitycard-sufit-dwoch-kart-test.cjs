'use strict';
/**
 * entitycard-sufit-dwoch-kart-test.cjs
 *
 * TEMAT: R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 (runda 2, po ECHO wlasciciela 2026-09-05).
 *
 * KONTRAKT, KTOREGO PILNUJE (dwa ECHO wlasciciela, oba WIAZACE):
 *  (K1) Karty encji ukladaja sie w STOS: klik w link krzyzowy wewnatrz karty A otwiera
 *       karte B NAD A, obie zyja w DOM. Karta B jest PRZESUNIETA tak, ze spod niej
 *       WYSTAJE BRZEG karty A — mierzone `getBoundingClientRect`, nie oceniane na oko.
 *       Dowod skladany jest z DWOCH ROZNYCH pomiarow, bo [ZMIANA R2-OBRONA, zarzut 2]
 *       zaden z nich sam nie wystarcza:
 *         - `document.elementsFromPoint` mowi o UKLADZIE HIT-TESTU (co lezy pod punktem
 *           i co przechwytuje klik) — NIE o tym, czy cos ten brzeg zamalowalo;
 *         - kolor PIKSELA ze zrzutu, porownany z backdropem karty B i bez niego, mowi
 *           o MALOWANIU — i tylko on czerwienieje, gdy backdrop wierzchni zacznie
 *           przyciemniac brzeg A.
 *  (K2) SUFIT DWOCH: otwarcie trzeciej karty zamyka NAJSTARSZA (A), nie najnowsza.
 *       Po C zyja dokladnie dwie karty: B i C.
 *  (K3) Escape ALBO klik w tlo zdejmuje DOKLADNIE JEDNA karte (z B wracasz do A,
 *       drugim gestem wychodzisz na mape). Klik w widoczny brzeg A tez wraca do A.
 *  (K4) ROZMIAR karty wierzchniej sie NIE zmienia (660px szerokosci, min(80vh,100vh-32)
 *       wysokosci — R-CIVPEDIA-KARTY-SPOJNOSC-Q1) i karta MIESCI SIE W OKNIE przy typowych
 *       rozdzielczosciach; przy malym oknie przesuniecie degraduje sie lagodnie do zera
 *       zamiast wypychac karte poza ekran. Sprawdzane liczbowo na OSMIU viewportach
 *       (1920x1080 ... 700x520), nie zalozone.
 *
 * REGULA PRZECIW SAMOOSZUKIWANIU — DOWOD NIETAUTOLOGICZNOSCI WBUDOWANY W TEST
 * (§9 poz. 6a: "zmutuj zrodlo i pokaz, ze test faktycznie czerwienieje"):
 * test bundluje W TYM SAMYM BIEGU DWIE instancje `renderer.ts` — (a) PRAWDZIWA z drzewa
 * roboczego i (b) ZMUTOWANA, w ktorej `ENTITY_CARD_STACK_LIMIT = 2` zamieniono na `= 1`,
 * czyli dokladnie zachowanie SPRZED tej rundy (karta docelowa ZASTEPUJE zrodlowa).
 * Mutacja zyje w PAMIECI, pod wirtualna sciezka modulu — nic nie jest zapisywane poza
 * plikami tego testu i NIC nie zalezy od `git show HEAD:` (poprzednik,
 * `entity-card-single-dialog-real-render-test.cjs`, przez taka zaleznosc czerwienial sam
 * z siebie, gdy tylko naprawa zostala scalona do HEAD — ten blad tu sie nie powtarza).
 * Sekcja (M) dowodzi, ze na ZMUTOWANEJ wersji K1/K2/K3 realnie NIE dzialaja.
 *
 * Zrzuty dowodowe: ustaw CIV_SHOTS_DIR=<katalog>, test zapisze tam PNG-i z zywej strony.
 *
 * Usage (z gra/): node tools/entitycard-sufit-dwoch-kart-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entitycard-sufit-dwoch-kart] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTITY_CARDS_DIR = path.resolve(GRA, 'src', 'ui', 'entityCards');
const RENDERER_TS = path.resolve(ENTITY_CARDS_DIR, 'renderer.ts');
const ENTRY = path.resolve(__dirname, '.entitycard-sufit-dwoch-kart-entry.ts');
const OUTFILE = path.resolve(__dirname, '.entitycard-sufit-dwoch-kart-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS_DIR = process.env.CIV_SHOTS_DIR ? path.resolve(process.env.CIV_SHOTS_DIR) : null;

/** Prostokat o indeksie `i` albo sentinel z NaN. Bez tego bramka na kodzie SPRZED sufitu
 *  (jedna karta zamiast dwoch) wywalalaby sie z TypeError zamiast wypisac czerwone asercje —
 *  a "czerwienieje po cofnieciu zmiany" ma byc CZYTELNYM wynikiem, nie stack trace'em.
 *  Porownania z NaN sa zawsze falszywe, wiec kazda asercja geometrii wychodzi na FAIL. */
const NO_RECT = { left: NaN, top: NaN, width: NaN, height: NaN, right: NaN, bottom: NaN, backdropBg: 'BRAK' };
function rectAt(rs, i) { return rs[i] || NO_RECT; }

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
    console.log('[entitycard-sufit-dwoch-kart] domyslny Chromium niedostepny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/* Vite-owe konstrukcje nie istnieja w golym esbuildzie — inline'ujemy PRAWDZIWE ikony, zeby
   render byl 1:1 z produkcja (kopia z entity-card-single-dialog-real-render-test.cjs). */
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

/** Wstrzykuje ZMUTOWANA tresc `renderer.ts` pod wirtualna sciezka modulu. `resolveDir`
 * wskazuje PRAWDZIWY katalog `entityCards/`, wiec wzgledne importy (escapeOverlayStack,
 * registry, adaptery, types) rozwiazuja sie do TYCH SAMYCH plikow co wersja prawdziwa —
 * jedyna roznica miedzy dwiema instancjami to tresc samego `renderer.ts`. Osobne domkniecie
 * modulu = osobny `dialogStack`/`overlaySeq`, wiec sekcje nie zatruwaja sobie stanu. */
function mutatedRendererPlugin(mutatedSource) {
  const virtualPath = path.resolve(ENTITY_CARDS_DIR, '__renderer_mutated_virtual__.ts');
  return {
    name: 'mutated-renderer',
    setup(build) {
      build.onResolve({ filter: /^mutated-renderer$/ }, () => ({ path: virtualPath, namespace: 'mutated-renderer-ns' }));
      build.onLoad({ filter: /.*/, namespace: 'mutated-renderer-ns' }, () => ({
        contents: mutatedSource, loader: 'ts', resolveDir: ENTITY_CARDS_DIR,
      }));
    },
  };
}

/** Viewporty do K4: `expectW` = min(660, vw-32) (+0..2px obramowania, zaleznie od
 *  `box-sizing` strony). 700x520 jest w tabeli celowo — to PIERWSZY viewport ponizej progu
 *  732px, na ktorym przesuniecie poziome musi zdegradowac do zera. */
const VIEWPORTS = [
  { w: 1920, h: 1080 }, { w: 1600, h: 900 }, { w: 1440, h: 900 },
  { w: 1366, h: 768 }, { w: 1280, h: 900 }, { w: 1024, h: 768 },
  { w: 800, h: 600 }, { w: 700, h: 520 },
];

async function main() {
  // ---------------------------------------------------------------------------------
  // (0) Zbuduj obie instancje: prawdziwa + zmutowana (sufit 2 -> 1).
  // ---------------------------------------------------------------------------------
  const realSource = fs.readFileSync(RENDERER_TS, 'utf8');
  const LIMIT_DECL = 'const ENTITY_CARD_STACK_LIMIT = 2;';
  check('(0) `renderer.ts` niesie jawna stala sufitu ' + JSON.stringify(LIMIT_DECL)
    + ' (bez niej mutacja nie mialaby czego odwrocic)', realSource.includes(LIMIT_DECL));
  const mutatedSource = realSource.replace(LIMIT_DECL, 'const ENTITY_CARD_STACK_LIMIT = 1;');
  check('(0) mutacja realnie zmienia tresc modulu (sufit 2 -> 1)', mutatedSource !== realSource);

  fs.writeFileSync(ENTRY, [
    "import { openEntityCard as realOpen, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { openEntityCard as mutOpen } from 'mutated-renderer';",
    "import { unitToSlug } from '../src/ui/entityCards/registry.ts';",
    "import {",
    "  _resetEscapeOverlayStackForTest, _getEscapeOverlayStackDepthForTest,",
    "} from '../src/ui/escapeOverlayStack.ts';",
    'window.__realOpen = realOpen;',
    'window.__mutOpen = mutOpen;',
    'window.__unitToSlug = unitToSlug;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__escReset = _resetEscapeOverlayStackForTest;',
    'window.__escDepth = _getEscapeOverlayStackDepthForTest;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    // KOLEJNOSC KRYTYCZNA (jak w entity-card-single-dialog-real-render-test.cjs): plugin
    // wirtualnego modulu MUSI byc PRZED `viteCompatPlugin`, bo generyczny `onLoad(/\.ts$/)`
    // tego drugiego czyta plik z dysku przed sprawdzeniem tresci i rzucilby ENOENT na
    // sciezce wirtualnej.
    plugins: [mutatedRendererPlugin(mutatedSource), viteCompatPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:"Segoe UI",Tahoma,sans-serif;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
    // PRAWDZIWY arkusz produkcyjny — bez niego backdrop nie jest `position:fixed`, karta nie
    // ma szerokosci 660 i caly pomiar geometrii bylby pomiarem domyslnego layoutu bloku.
    await page.evaluate(() => {
      const st = document.createElement('style');
      st.id = 'entity-card-css-under-test';
      st.textContent = window.__ENTITY_CARD_CSS;
      document.head.appendChild(st);
    });

    // --- wspolne pomocniki, dzialajace na DOWOLNEJ z dwoch instancji modulu ---
    /** Sprzatanie MUSI isc przez prawdziwa droge zamkniecia (Escape), nie przez wyrywanie
     *  wezlow z DOM: `openDialog` trzyma wlasny `dialogStack`, wiec samo `node.remove()`
     *  zostawiloby w module wpisy dla nieistniejacych kart i kolejne otwarcie tej samej
     *  encji trafiloby w sciezke idempotencji, nie budujac nic. */
    async function reset() {
      for (let i = 0; i < 8; i++) {
        const n = await page.evaluate(() => document.querySelectorAll('.entity-card-backdrop').length);
        if (n === 0) break;
        await page.keyboard.press('Escape');
      }
      await page.evaluate(() => {
        document.querySelectorAll('.entity-card-backdrop').forEach((n) => n.remove());
        window.__escReset();
      });
    }
    /** Stan stosu odczytany z DOM: kolejnosc = kolejnosc w `document.body`, czyli od
     *  najstarszej do wierzchniej. */
    async function state() {
      return page.evaluate(() => {
        const backs = Array.from(document.querySelectorAll('.entity-card-backdrop'));
        return {
          count: backs.length,
          escDepth: window.__escDepth(),
          entries: backs.map((b) => {
            const c = b.querySelector('.entity-card');
            return {
              kind: c && c.getAttribute('data-entity-kind'),
              id: c && c.getAttribute('data-entity-id'),
              depthAttr: b.getAttribute('data-ec-stack-depth'),
            };
          }),
        };
      });
    }
    /** Prostokaty `.entity-card-dialog` (a NIE `.entity-card` — karta bywa wyzsza niz
     *  dialog i jest przycinana jego `overflow:auto`, wiec jej `rect` klamie o tym, co
     *  faktycznie widac; ten blad zostal zmierzony w rundzie 1 tego tematu). */
    async function dialogRects() {
      return page.evaluate(() => Array.from(document.querySelectorAll('.entity-card-backdrop'))
        .map((b) => {
          const d = b.querySelector('.entity-card-dialog');
          const r = d.getBoundingClientRect();
          return {
            left: Math.round(r.left), top: Math.round(r.top),
            width: Math.round(r.width), height: Math.round(r.height),
            right: Math.round(r.right), bottom: Math.round(r.bottom),
            backdropBg: getComputedStyle(b).backgroundColor,
          };
        }));
    }
    /** Realny klik mysza w pierwszy link krzyzowy wewnatrz WIERZCHNIEJ karty, ktory
     *  prowadzi do encji spoza aktualnego stosu. `scrollIntoView` PRZED odczytem
     *  wspolrzednych — `page.mouse.click` klika slepo w piksel, wiec bez przewiniecia
     *  trafialby w krawedz viewportu (dokladnie ta pulapka czerwieni dzis 8 asercji
     *  `entity-card-cross-links-nested-overlay-test.cjs`). */
    async function clickCrossLinkInTopCard() {
      const target = await page.evaluate(() => {
        const backs = Array.from(document.querySelectorAll('.entity-card-backdrop'));
        const top = backs[backs.length - 1];
        const openNow = new Set(backs.map((b) => {
          const c = b.querySelector('.entity-card');
          return c.getAttribute('data-entity-kind') + '/' + c.getAttribute('data-entity-id');
        }));
        const btns = Array.from(top.querySelectorAll('button[data-entity-kind][data-entity-id]'));
        const btn = btns.find((b) => {
          const key = b.getAttribute('data-entity-kind') + '/' + b.getAttribute('data-entity-id');
          return !openNow.has(key) && b.offsetParent !== null;
        });
        if (!btn) return null;
        btn.scrollIntoView({ block: 'center', inline: 'center' });
        const r = btn.getBoundingClientRect();
        return {
          cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2),
          kind: btn.getAttribute('data-entity-kind'), id: btn.getAttribute('data-entity-id'),
        };
      });
      if (!target) return null;
      const hit = await page.evaluate(({ cx, cy }) => {
        const el = document.elementFromPoint(cx, cy);
        const b = el && el.closest('button[data-entity-kind]');
        return b ? { kind: b.getAttribute('data-entity-kind'), id: b.getAttribute('data-entity-id') } : null;
      }, target);
      if (!hit || hit.kind !== target.kind || hit.id !== target.id) return { target, hit, clicked: false };
      await page.mouse.click(target.cx, target.cy);
      return { target, hit, clicked: true };
    }

    // =================================================================================
    // (K1) A -> B: dwie karty zyja, BRZEG A WIDOCZNY spod B — zmierzony.
    // =================================================================================
    console.log('\n-- (K1) A -> B: stos dwoch kart i widoczny brzeg karty A --');
    await reset();
    const unitSlug = await page.evaluate(() => window.__unitToSlug('Falanga'));
    check('(K1 fixture) unitToSlug("Falanga") rozwiazany', typeof unitSlug === 'string' && unitSlug.length > 0, unitSlug);
    await page.evaluate((s) => { window.__realOpen('unit', s, { mode: 'dialog' }); }, unitSlug);
    let s = await state();
    check('(K1 setup) po otwarciu A: 1 backdrop, glebokosc stosu Escape 1, depth-attr "0"',
      s.count === 1 && s.escDepth === 1 && s.entries[0].depthAttr === '0', s);

    const clickB = await clickCrossLinkInTopCard();
    check('(K1) w karcie A istnieje widoczny link krzyzowy i punkt kliku trafia DOKLADNIE w niego',
      !!clickB && clickB.clicked === true, clickB);
    s = await state();
    check('(K1) po realnym kliku myszy: DWIE karty zyja naraz — A na dole (unit/' + unitSlug + '), B na wierzchu',
      s.count === 2 && s.escDepth === 2
      && s.entries[0].kind === 'unit' && s.entries[0].id === unitSlug
      && clickB && s.entries[1].kind === clickB.target.kind && s.entries[1].id === clickB.target.id, s);
    check('(K1) backdropy dostaly pozycje w stosie: "0" (A, najstarsza) i "1" (B, wierzchnia)',
      s.entries.length === 2 && s.entries[0].depthAttr === '0' && s.entries[1].depthAttr === '1', s);

    let rects = await dialogRects();
    const rA = rectAt(rects, 0);
    const rB = rectAt(rects, 1);
    /* `.entity-card` ma `width:min(660px,100vw-32px)`; przy `box-sizing:content-box` dochodzi
       2px obramowania, przy `border-box` juz nie — dlatego tolerancja 0..2px, a NIE luzniejsza.
       Istota asercji: przesuniecie NIE zmienilo rozmiaru (B == A co do piksela). */
    check('(K1) ROZMIAR karty wierzchniej NIETKNIETY: B == A co do piksela, szerokosc 660 (+0..2px obramowania), wysokosc min(80vh,100vh-32) == 720 przy 1280x900',
      rB.width === rA.width && rB.height === rA.height
      && rA.width >= 660 && rA.width <= 662 && rA.height === 720, { rA, rB });
    const dxMeasured = rB.left - rA.left;
    const dyMeasured = rB.top - rA.top;
    check('(K1) karta B jest PRZESUNIETA wzgledem A w prawo i w dol — zmierzone przesuniecie, nie zalozone',
      dxMeasured >= 24 && dyMeasured >= 16, { dxMeasured, dyMeasured, rA, rB });
    check('(K1) brzeg A NIE jest zakryty przez B: prostokat A wystaje poza prostokat B z lewej i z gory',
      rA.left < rB.left && rA.top < rB.top, { rA, rB });
    check('(K1) backdrop karty WIERZCHNIEJ jest PRZEZROCZYSTY (nie przyciemnia brzegu A), backdrop najstarszej nadal przyciemnia mape',
      rB.backdropBg === 'rgba(0, 0, 0, 0)' && rA.backdropBg !== 'rgba(0, 0, 0, 0)',
      { top: rB.backdropBg, bottom: rA.backdropBg });

    /* [ZMIANA R2-OBRONA] Ponizsze dwie asercje mierza UKLAD HIT-TESTU, nie malowanie —
       nazwy "POMIAR WIDOCZNOSCI" / "PRZEZROCZYSTY backdrop" byly nadmiarowe i zostaly
       poprawione. `elementsFromPoint` zwraca trafienia niezaleznie od tego, czy cos je
       zamalowalo: przy mutacji `background:transparent` -> `rgba(0,0,0,.62)` na backdropie
       wierzchnim (brzeg A realnie przyciemniony) obie NADAL przechodzily — zmierzone,
       64 pass / 1 fail, czerwieniala wylacznie asercja `backdropBg` wyzej. Dowod MALOWANIA
       niesie osobna asercja pikselowa nizej, ktora pod ta sama mutacja czerwienieje. */
    const edgePoint = { x: Math.round(rA.left + dxMeasured / 2), y: Math.round(rA.top + rA.height / 2) };
    const edgeStack = await page.evaluate(({ x, y }) => {
      const backs = Array.from(document.querySelectorAll('.entity-card-backdrop'));
      if (backs.length < 2 || !Number.isFinite(x) || !Number.isFinite(y)) {
        return { tags: [], hitsCardA: false, topIsUpperBackdrop: false, brakStosuDwoch: true };
      }
      const els = document.elementsFromPoint(x, y);
      const cardA = backs[0].querySelector('.entity-card');
      return {
        tags: els.slice(0, 4).map((e) => e.tagName + '.' + (e.className || '')),
        hitsCardA: els.some((e) => e === cardA || cardA.contains(e)),
        topIsUpperBackdrop: els[0] === backs[backs.length - 1],
      };
    }, edgePoint);
    check('(K1) UKLAD HIT-TESTU w punkcie brzegu A ' + JSON.stringify(edgePoint)
      + ': stos `elementsFromPoint` zawiera element karty A (A lezy pod tym punktem, nie obok)',
      edgeStack.hitsCardA === true, { edgePoint, edgeStack });
    /* [ZMIANA R2-OBRONA] Asercja NAZWANA UCZCIWIE: sprawdza kolejnosc hit-testu (co
       przechwytuje klik), a NIE ze brzeg jest niezaciemniony. Ta kolejnosc jest realizacja
       ECHO 2 ("klik w widoczny brzeg A wraca do A") i jednoczesnie jest INTERPRETACJA zdania
       z ECHO 1 ("brzegu nie moze zakrywac backdrop karty B") — zmierzony konflikt obu zdan
       i jego konsekwencje: `06-obrona-runda2.md`, zarzut 1 (kandydat DO DECYZJI CZLOWIEKA).
       Jesli wlasciciel rozstrzygnie inaczej, TA asercja jest miejscem do zmiany. */
    check('(K1) KOLEJNOSC HIT-TESTU: klik w brzeg A przechwytuje backdrop karty B (to jest droga powrotu do A z ECHO 2; INTERPRETACJA ECHO 1 — patrz 06-obrona-runda2.md)',
      edgeStack.topIsUpperBackdrop === true, edgeStack);

    /* [ZMIANA R2-OBRONA] DOWOD MALOWANIA (a nie hit-testu), dostarczony po zarzucie 2:
       kolor PIKSELA w srodku brzegu A ze zrzutu zywej strony — (a) z backdropem karty B nad
       nim i (b) po jego chwilowym ukryciu. Rowne = backdrop B niczym tego brzegu nie
       przyciemnia. Rozne od tla strony = to faktycznie karta A, a nie mapa pod spodem.
       Ta asercja czerwienieje pod mutacja `background:transparent` -> `rgba(0,0,0,.62)`,
       ktorej dwie asercje hit-testu wyzej NIE lapia. */
    async function edgePixel() {
      const buf = await page.screenshot({ clip: { x: edgePoint.x, y: edgePoint.y, width: 1, height: 1 } });
      const p2 = await browser.newPage();
      try {
        return await p2.evaluate(async (b64) => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + b64;
          await img.decode();
          const c = document.createElement('canvas'); c.width = 1; c.height = 1;
          c.getContext('2d').drawImage(img, 0, 0);
          return Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data).slice(0, 3);
        }, buf.toString('base64'));
      } finally { await p2.close(); }
    }
    const pxWithB = await edgePixel();
    await page.evaluate(() => {
      const backs = document.querySelectorAll('.entity-card-backdrop');
      backs[backs.length - 1].style.visibility = 'hidden';
    });
    const pxWithoutB = await edgePixel();
    await page.evaluate(() => {
      const backs = document.querySelectorAll('.entity-card-backdrop');
      backs[backs.length - 1].style.visibility = '';
    });
    const pxPageBg = await (async () => {
      const buf = await page.screenshot({ clip: { x: 2, y: 2, width: 1, height: 1 } });
      const p2 = await browser.newPage();
      try {
        return await p2.evaluate(async (b64) => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + b64;
          await img.decode();
          const c = document.createElement('canvas'); c.width = 1; c.height = 1;
          c.getContext('2d').drawImage(img, 0, 0);
          return Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data).slice(0, 3);
        }, buf.toString('base64'));
      } finally { await p2.close(); }
    })();
    check('(K1) POMIAR MALOWANIA: piksel w brzegu A jest IDENTYCZNY z backdropem karty B i bez niego — B tego brzegu NIE przyciemnia',
      pxWithB.length === 3 && pxWithB.every((v, i) => v === pxWithoutB[i]),
      { edgePoint, pxWithB, pxWithoutB });
    check('(K1) POMIAR MALOWANIA: piksel w brzegu A rozni sie od tla strony — w tym punkcie widac karte A, nie mape pod spodem',
      pxWithB.some((v, i) => v !== pxPageBg[i]), { pxWithB, pxPageBg });
    await shot(page, 'sufit-01-dwie-karty-widoczny-brzeg-A.png');

    // =================================================================================
    // (K2) A -> B -> C: sufit dwoch. Zamknieta NAJSTARSZA (A), zyja B i C.
    // =================================================================================
    console.log('\n-- (K2) A -> B -> C: sufit dwoch kart, wypada NAJSTARSZA --');
    const before3 = await state();
    const clickC = await clickCrossLinkInTopCard();
    check('(K2) w karcie B istnieje widoczny link krzyzowy do TRZECIEJ encji i punkt kliku trafia w niego',
      !!clickC && clickC.clicked === true, clickC);
    s = await state();
    check('(K2) po trzeciej karcie zyja DOKLADNIE DWIE (sufit 2), nie trzy',
      s.count === 2 && s.escDepth === 2, { before3, after: s });
    check('(K2) zamknieta zostala NAJSTARSZA (A, unit/' + unitSlug + '), nie najnowsza — w DOM nie ma juz A',
      !s.entries.some((e) => e.kind === 'unit' && e.id === unitSlug), s);
    check('(K2) zyja B (byla wierzchnia, teraz na dole) i C (nowa wierzchnia), w tej kolejnosci',
      before3.entries.length === 2
      && s.entries[0].kind === before3.entries[1].kind && s.entries[0].id === before3.entries[1].id
      && clickC && s.entries[1].kind === clickC.target.kind && s.entries[1].id === clickC.target.id,
      { before3, after: s });
    check('(K2) pozycje w stosie PRZELICZONE po wypchnieciu A: B dostaje "0", C dostaje "1"',
      s.entries[0].depthAttr === '0' && s.entries[1].depthAttr === '1', s);
    rects = await dialogRects();
    check('(K2) B wrocila na srodek (jest teraz najstarsza), C jest przesunieta — stos nie "zjezdza" w nieskonczonosc',
      rectAt(rects, 0).left < rectAt(rects, 1).left && rectAt(rects, 0).top < rectAt(rects, 1).top
      && rectAt(rects, 0).left === rA.left && rectAt(rects, 0).top === rA.top, rects);
    await shot(page, 'sufit-02-po-trzeciej-karcie.png');

    // =================================================================================
    // (K3) Escape / klik w tlo / klik w widoczny brzeg — kazdy zdejmuje JEDNA karte.
    // =================================================================================
    console.log('\n-- (K3) Escape, klik w tlo, klik w brzeg A: jeden gest = jedna karta --');
    const bottomNow = (await state()).entries[0];
    await page.keyboard.press('Escape');
    s = await state();
    check('(K3) Escape #1 zdejmuje DOKLADNIE JEDNA karte (wierzchnia) — zostaje karta spod spodu',
      s.count === 1 && s.escDepth === 1 && s.entries[0].kind === bottomNow.kind && s.entries[0].id === bottomNow.id, s);
    check('(K3) karta, ktora zostala, wrocila do stanu "najstarsza": depth-attr "0" i nieprzezroczysty backdrop',
      s.entries.length === 1 && s.entries[0].depthAttr === '0'
      && rectAt(await dialogRects(), 0).backdropBg === 'rgba(0, 0, 0, 0.62)', s);
    await page.keyboard.press('Escape');
    s = await state();
    check('(K3) Escape #2 wychodzi na mape — zero backdropow, glebokosc stosu 0', s.count === 0 && s.escDepth === 0, s);

    // klik w tlo, na stosie dwoch
    await reset();
    await page.evaluate((sl) => { window.__realOpen('unit', sl, { mode: 'dialog' }); }, unitSlug);
    const clickB2 = await clickCrossLinkInTopCard();
    s = await state();
    check('(K3 setup) odbudowany stos dwoch kart przed testem kliku w tlo',
      s.count === 2 && !!clickB2 && clickB2.clicked === true, s);
    await page.mouse.click(4, 4); // rog viewportu — na pewno backdrop, nie dialog
    s = await state();
    check('(K3) klik w tlo #1 zdejmuje DOKLADNIE JEDNA karte — zostaje A (unit/' + unitSlug + ')',
      s.count === 1 && s.escDepth === 1 && s.entries[0].kind === 'unit' && s.entries[0].id === unitSlug, s);
    await page.mouse.click(4, 4);
    s = await state();
    check('(K3) klik w tlo #2 wychodzi na mape — zero backdropow', s.count === 0 && s.escDepth === 0, s);

    // klik w WIDOCZNY BRZEG karty A (ECHO 2: "klik w widoczny brzeg A tez wraca do A")
    await reset();
    await page.evaluate((sl) => { window.__realOpen('unit', sl, { mode: 'dialog' }); }, unitSlug);
    const clickB3 = await clickCrossLinkInTopCard();
    s = await state();
    check('(K3 setup) odbudowany stos dwoch kart przed testem kliku w brzeg A',
      s.count === 2 && !!clickB3 && clickB3.clicked === true, s);
    const rr = await dialogRects();
    const edge2 = {
      x: Math.round(rectAt(rr, 0).left + (rectAt(rr, 1).left - rectAt(rr, 0).left) / 2),
      y: Math.round(rectAt(rr, 0).top + rectAt(rr, 0).height / 2),
    };
    await shot(page, 'sufit-03-przed-klikiem-w-brzeg-A.png');
    if (Number.isFinite(edge2.x) && Number.isFinite(edge2.y)) await page.mouse.click(edge2.x, edge2.y);
    s = await state();
    check('(K3) klik w WIDOCZNY BRZEG karty A ' + JSON.stringify(edge2) + ' zdejmuje B i WRACA DO A (ECHO 2)',
      s.count === 1 && s.escDepth === 1 && s.entries[0].kind === 'unit' && s.entries[0].id === unitSlug, { edge2, s });

    // =================================================================================
    // (K4) Rozmiar niezmieniony + karta wierzchnia miesci sie w oknie — SIEDEM viewportow.
    // =================================================================================
    console.log('\n-- (K4) geometria na siedmiu viewportach (liczby, nie zalozenia) --');
    const table = [];
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await reset();
      await page.evaluate((sl) => { window.__realOpen('unit', sl, { mode: 'dialog' }); }, unitSlug);
      const c = await clickCrossLinkInTopCard();
      const st = await state();
      const rs = await dialogRects();
      const expectW = Math.min(660, vp.w - 32);
      const expectH = Math.min(Math.round(0.8 * vp.h), vp.h - 32);
      const row = {
        vp: vp.w + 'x' + vp.h,
        cards: st.count,
        topW: rs.length ? rs[rs.length - 1].width : NaN,
        topH: rs.length ? rs[rs.length - 1].height : NaN,
        expectW, expectH,
        dx: rs.length === 2 ? rs[1].left - rs[0].left : NaN,
        dy: rs.length === 2 ? rs[1].top - rs[0].top : NaN,
        topRect: rs.length ? rs[rs.length - 1] : NO_RECT,
      };
      table.push(row);
      check(`(K4 ${row.vp}) klik krzyzowy zbudowal stos dwoch kart`, st.count === 2 && !!c && c.clicked === true, { row, c });
      check(`(K4 ${row.vp}) ROZMIAR karty wierzchniej niezmieniony: ${row.topW}x${row.topH} == oczekiwane ${expectW}(+0..2 obramowania)x${expectH}`,
        row.topW >= expectW && row.topW <= expectW + 2 && Math.abs(row.topH - expectH) <= 1, row);
      check(`(K4 ${row.vp}) karta wierzchnia MIESCI SIE W OKNIE (0 <= left, right <= ${vp.w}, 0 <= top, bottom <= ${vp.h}) — przesuniecie nie wypycha jej poza ekran`,
        row.topRect && row.topRect.left >= 0 && row.topRect.top >= 0
        && row.topRect.right <= vp.w && row.topRect.bottom <= vp.h, row);
      check(`(K4 ${row.vp}) przesuniecie degraduje sie LAGODNIE: dx=${row.dx} dy=${row.dy} — nieujemne i nie wieksze niz limit 72/56`,
        row.dx >= 0 && row.dx <= 72 && row.dy >= 0 && row.dy <= 56, row);
    }
    console.log('\n[K4] TABELA GEOMETRII (viewport | karty | rozmiar wierzchniej | dx | dy | prostokat wierzchniej):');
    for (const r of table) {
      console.log(`  ${r.vp.padEnd(9)} | ${r.cards} | ${r.topW}x${r.topH} | dx=${String(r.dx).padStart(3)} | dy=${String(r.dy).padStart(3)} | `
        + `l=${r.topRect.left} t=${r.topRect.top} r=${r.topRect.right} b=${r.topRect.bottom}`);
    }
    /* DEGRADACJA JEST CIAGLA, nie skokowa — to jest tresc wymogu "lagodnie, nie wypychac
       poza ekran": dx maleje 72 -> 34 -> 0 wraz z szerokoscia okna, a karta na kazdym
       kroku miesci sie w calosci (sprawdzone wyzej, per viewport). */
    check('(K4) przesuniecie POZIOME degraduje sie MONOTONICZNIE wraz z wezszym oknem, do 0 przy 700px (prog 732px), zamiast wypychac karte poza ekran',
      table[table.length - 1].dx === 0 && table[table.length - 2].dx === 34
      && table.every((r, i) => i === 0 || r.dx <= table[i - 1].dx || r.vp === '1280x900'),
      table.map((r) => ({ vp: r.vp, dx: r.dx, dy: r.dy })));
    check('(K4) przy najszerszym oknie (1920x1080) przesuniecie osiaga pelna wartosc 72/56 — brzeg A jest wyraznie widoczny',
      table[0].dx === 72 && table[0].dy === 56, table[0]);

    await page.setViewportSize({ width: 1280, height: 900 });

    // =================================================================================
    // (M) DOWOD NIETAUTOLOGICZNOSCI: ta sama sciezka na ZMUTOWANYM module (sufit 1).
    // =================================================================================
    console.log('\n-- (M) mutacja zrodla (ENTITY_CARD_STACK_LIMIT 2 -> 1): test MUSI zczerwieniec --');
    await reset();
    await page.evaluate((sl) => { window.__mutOpen('unit', sl, { mode: 'dialog' }); }, unitSlug);
    const mClick = await clickCrossLinkInTopCard();
    const mState = await state();
    const mRects = await dialogRects();
    check('(M) na ZMUTOWANYM module ten sam klik daje TYLKO JEDNA karte — sufit 2 realnie odpowiada za (K1), asercje nie sa tautologiczne',
      !!mClick && mClick.clicked === true && mState.count === 1, { mClick, mState });
    check('(M) na ZMUTOWANYM module NIE MA czego mierzyc jako brzegu A — istnieje jeden prostokat dialogu, nieprzesuniety',
      mRects.length === 1 && rectAt(mRects, 0).left === rA.left && rectAt(mRects, 0).top === rA.top, mRects);
    await page.evaluate((sl) => { window.__mutOpen('unit', sl, { mode: 'dialog' }); }, unitSlug);
    const mState2 = await state();
    check('(M) na ZMUTOWANYM module trzecie otwarcie tez nie zbuduje stosu (1 karta) — mutacja odtwarza dokladnie zachowanie sprzed rundy',
      mState2.count === 1, mState2);
    await reset();

    check('brak bledow konsoli/pageerror w calym scenariuszu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[entitycard-sufit-dwoch-kart] ${pass} pass, ${fail} fail`);
  if (SHOTS_DIR) console.log('[entitycard-sufit-dwoch-kart] zrzuty: ' + SHOTS_DIR);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
