'use strict';
/**
 * entity-card-single-dialog-real-render-test.cjs
 *
 * TEMAT: P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1, ZAKTUALIZOWANY przez
 * R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1 (runda 2, ECHO wlasciciela 2026-09-05).
 *
 * Zgloszenie wlasciciela, ktore powolalo ten plik: "Dopiero jak wylacze karte technologii,
 * to wtedy sie wlacza [poprzednia]. Chodzi o to, zeby nie wszystkie wlaczaly sie naraz,
 * tylko ta, ktora sie kliknie, aby pojawila sie obok, a gdy klika sie inna karte lub inny
 * przycisk, powinna zniknac i pojawic sie nowa."
 *
 * PO CO TA AKTUALIZACJA (jawnie, zeby nikt nie czytal tego pliku jako cichego oslabienia
 * bramki): wlasciciel zamowil pozniej STOS Z SUFITEM DWOCH — karta zrodlowa ZOSTAJE
 * widoczna pod docelowa, ale trzecia karta zamyka NAJSTARSZA. Intencja "zeby nie wszystkie
 * wlaczaly sie naraz" jest odtad realizowana przez SUFIT, nie przez bezwarunkowe zamykanie
 * karty zrodlowej. Asercje, ktore utrwalaly "dokladnie 1 backdrop", sa tu ODWROCONE — kazda
 * z komentarzem [ZMIANA R2] mowiacym, co asertowala przed i co asertuje po. Asercje, ktorych
 * ECHO nie dotknelo (K3 — trzy drogi zamkniecia; K4 — idempotencja), zostaja BEZ ZMIAN.
 *
 * Co pilnuje (w PRAWDZIWYM Chromium, nie jsdom — jsdom nie liczy layoutu/kaskady, wiec
 * scrollIntoView + elementFromPoint + realny klik mysza sa tu bezuzyteczne bez zywej
 * przegladarki; precedens: entity-card-cross-links-button-style-real-render-test.cjs):
 *
 *  CZESC 1 — REGULA PRZECIW SAMOOSZUKIWANIU (00-dispatch.md): bundlujemy DWIE wersje
 *  `renderer.ts` W TYM SAMYM biegu testu — (a) PRZED-SUFITEM, czyli prawdziwe zrodlo
 *  z drzewa roboczego ze ZMUTOWANA jedna stala (`ENTITY_CARD_STACK_LIMIT` 2 -> 1, co
 *  dokladnie odtwarza zachowanie sprzed R-ENTITYCARD-JEDNA-KARTA-CZY-STOS-Q1: karta
 *  docelowa ZASTEPUJE zrodlowa), zaladowana jako WIRTUALNY modul, oraz (b) PO-SUFICIE,
 *  prawdziwy plik bez mutacji. Obie maja WLASNA, ODDZIELONA instancje modulu (osobne
 *  domkniecia `overlaySeq`/`dialogStack`) — esbuild deduplikuje wg sciezki, a wersja
 *  PRZED ladowana jest pod sciezka wirtualna, wiec kolizji nie ma.
 *
 *  [ZMIANA R2 — DEFEKT NAPRAWIONY PRZY OKAZJI] wersja PRZED byla dotad pobierana przez
 *  `git show HEAD:gra/src/ui/entityCards/renderer.ts`. To wiazalo bramke z historia Gita
 *  zamiast z kodem: w chwili scalenia naprawy do `main` HEAD PRZESTAL byc "kodem sprzed
 *  naprawy" i CALA CZESC 1 czerwieniala sama z siebie, niezaleznie od jakiegokolwiek
 *  tematu (zmierzone na bazie `d7819ab7`: 21 pass, 5 fail). Mutacja jednej stalej w
 *  PAMIECI daje ten sam dowod nietautologicznosci i nie psuje sie z uplywem czasu.
 *
 *  CZESC 2 — PO SUFICIE, cztery kryteria binarne (K1/K2 w brzmieniu po ECHO):
 *   (K1) [ZMIANA R2] Otwarcie A (technologia "Garncarstwo"), REALNY klik mysza w link
 *        krzyzowy WEWNATRZ A (budynek "Cegielnia" — dokladnie ta para ze zrzutow
 *        wlasciciela) → po otwarciu B w DOM sa DWA backdropy: A pod B. PRZED R2 ta sama
 *        asercja zadala "dokladnie 1 backdrop, A juz nie istnieje".
 *   (K2) [ZMIANA R2] Dwa NIEZWIAZANE, bezposrednie wywolania `openEntityCard(...)`
 *        (symulujace dwa rozne miejsca UI, np. buildModeHud.ts vs cityPanel.ts) w OBU
 *        kolejnosciach → ostatnio otwarty jest ZAWSZE NA WIERZCHU, a stos nigdy nie
 *        przekracza DWOCH kart. PRZED R2: "zawsze dokladnie 1 backdrop".
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
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[entity-card-single-dialog] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTITY_CARDS_DIR = path.resolve(GRA, 'src', 'ui', 'entityCards');
const RENDERER_TS = path.resolve(ENTITY_CARDS_DIR, 'renderer.ts');
/** Stala, ktorej mutacja (2 -> 1) odtwarza zachowanie sprzed sufitu dwoch kart. */
const LIMIT_DECL = 'const ENTITY_CARD_STACK_LIMIT = 2;';
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

/** Wstrzykuje PRZED-SUFITEM `renderer.ts` (prawdziwe zrodlo ze zmutowana stala sufitu) pod
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
  // --- (0) Zbuduj wersje PRZED-SUFITEM przez mutacje JEDNEJ stalej w pamieci.
  //     [ZMIANA R2] Bylo: `git show HEAD:...` + asercje na obecnosc/nieobecnosc slowa
  //     "activeDialog". Obie te asercje byly ZALEZNE OD HISTORII GITA, nie od kodu, i po
  //     scaleniu naprawy do main czerwienialy same z siebie. Teraz sprawdzamy to, co
  //     naprawde ma znaczenie: ze w zrodle jest jawna stala sufitu i ze mutacja ja zmienia. ---
  const fixedSourceOnDisk = fs.readFileSync(RENDERER_TS, 'utf8');
  check('(0) renderer.ts niesie jawna stala sufitu ' + JSON.stringify(LIMIT_DECL)
    + ' (bez niej mutacja nie mialaby czego odwrocic)', fixedSourceOnDisk.includes(LIMIT_DECL));
  const prefixSource = fixedSourceOnDisk.replace(LIMIT_DECL, 'const ENTITY_CARD_STACK_LIMIT = 1;');
  check('(0) tresc PRZED-SUFITEM i PO-SUFICIE realnie sie roznia (nie ten sam string)',
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
    console.log('\n-- CZESC 1: PRZED SUFITEM (zrodlo ze zmutowana stala 2 -> 1) — dowod nietautologicznosci --');

    await page.evaluate((techA) => { window.__prefixOpenEntityCard('technology', techA, { mode: 'dialog' }); }, TECH_A);
    let s = await domState();
    check('(PRE-P1) otwarcie A (Garncarstwo) daje 1 backdrop', s.count === 1 && s.entries[0].kind === 'technology' && s.entries[0].id === TECH_A, s);
    // [ZMIANA R2] Ponizsze trzy asercje opisuja teraz ZACHOWANIE SPRZED SUFITU (karta docelowa
    // ZASTEPUJE zrodlowa), a nie "bug ze zrzutow wlasciciela" — bo bugiem juz nie jest, tylko
    // stanem, ktory ECHO wlasciciela zastapilo stosem. Ich rola sie nie zmienila: dowodza, ze
    // asercje K1/K2 z CZESCI 2 realnie zaleza od sufitu, a nie przechodza same z siebie.
    await shot(page, 'pre-01-single-tech.png');

    const clickRectPre = await clickBuildingLinkInsideTopDialog();
    check('(PRE) link krzyzowy "Cegielnia" znaleziony i widoczny wewnatrz A', !!clickRectPre && clickRectPre.w > 0 && clickRectPre.h > 0, clickRectPre);
    s = await domState();
    await shot(page, 'pre-02-po-kliku-JEDEN-backdrop.png', { fullPage: true });
    check('(PRE-P2, ANTY-SAMOOSZUKIWANIE) [ZMIANA R2] bez sufitu klik w link wewnatrz A ZAMYKA A — w DOM zostaje DOKLADNIE JEDEN backdrop (sama Cegielnia). PRZED R2 ta asercja zadala tu 2 backdropow, bo "wersja PRE" byla wtedy kodem sprzed P-ENTITYCARD-DIALOG-WIELOKROTNY-Q1, a nie sprzed sufitu',
      s.count === 1 && s.entries[0].kind === 'building' && s.entries[0].id === BUILDING_B, s);

    await page.evaluate((idC) => { window.__prefixOpenEntityCard('building', idC, { mode: 'dialog' }); }, BUILDING_C);
    s = await domState();
    check('(PRE-P3) [ZMIANA R2] bez sufitu bezposrednie otwarcie NIEZWIAZANEGO C tez tylko ZASTEPUJE — 1 backdrop, C. PRZED R2: 3 backdropy',
      s.count === 1 && s.entries[0].kind === 'building' && s.entries[0].id === BUILDING_C, s);

    await page.evaluate((idC) => { window.__prefixOpenEntityCard('building', idC, { mode: 'dialog' }); }, BUILDING_C);
    s = await domState();
    check('(PRE-P4) [ZMIANA R2] idempotencja dziala juz PRZED sufitem (ponowne otwarcie tego samego kind+id nie duplikuje) — sufit jej nie dotknal. PRZED R2: 4 backdropy',
      s.count === 1, s);

    // Sprzatanie po sekcji PRZED — idzie przez PRAWDZIWA droge zamkniecia (Escape), bo
    // `openDialog` trzyma wlasny `dialogStack` i samo wyrwanie wezlow z DOM zostawiloby
    // w module wpisy dla nieistniejacych kart. Modul "fixed" to osobna instancja
    // (wlasny `overlaySeq`/`dialogStack`), wiec CZESC 2 zaczyna od czystego stanu.
    for (let i = 0; i < 8; i++) {
      const n = await page.evaluate(() => document.querySelectorAll('.entity-card-backdrop').length);
      if (n === 0) break;
      await page.keyboard.press('Escape');
    }
    await page.evaluate(() => {
      document.querySelectorAll('.entity-card-backdrop').forEach((n) => n.remove());
      window.__escResetForTest();
    });
    s = await domState();
    check('(0) sprzatanie po CZESCI 1 skuteczne (0 backdropow, glebokosc stosu 0)', s.count === 0 && s.escDepth === 0, s);

    // =================================================================================
    // CZESC 2 — PO NAPRAWIE: kryteria 1-4 z GOAL.
    // =================================================================================
    console.log('\n-- CZESC 2: PO SUFICIE (renderer.ts z drzewa roboczego, bez mutacji) — kryteria 1-4 --');

    // ---- K1: klik w link WEWNATRZ A zamyka A i pokazuje wylacznie B ----
    await page.evaluate((techA) => { window.__fixedOpenEntityCard('technology', techA, { mode: 'dialog' }); }, TECH_A);
    s = await domState();
    check('(K1 setup) otwarcie A (Garncarstwo) po naprawie daje 1 backdrop', s.count === 1 && s.entries[0].id === TECH_A, s);
    await shot(page, 'fixed-01-single-tech.png');

    const clickRectFixed = await clickBuildingLinkInsideTopDialog();
    check('(K1) link krzyzowy "Cegielnia" znaleziony i widoczny wewnatrz A (po suficie)', !!clickRectFixed && clickRectFixed.w > 0, clickRectFixed);
    s = await domState();
    await shot(page, 'fixed-02-po-kliku-DWIE-karty.png', { fullPage: true });
    // [ZMIANA R2] BYLO: "dokladnie 1 backdrop w DOM, wylacznie B — A juz nie istnieje".
    // JEST: A ZOSTAJE pod B. Uzasadnienie: ECHO wlasciciela 2026-09-05 ("stos, ale
    // maksymalnie dwie karty" + "zamkniecie B odslania A") wprost odwraca ten punkt.
    // To jedyna asercja tego pliku, ktora byla bezposrednim zapisem sporu rozstrzygnietego
    // przez ECHO; reszta CZESCI 2 (K3, K4) jest nietknieta.
    check('(K1) [ZMIANA R2] po realnym kliku myszy w link WEWNATRZ A: DWA backdropy — A (Garncarstwo) pod B (Cegielnia), obie zyja',
      s.count === 2
      && s.entries[0].kind === 'technology' && s.entries[0].id === TECH_A
      && s.entries[1].kind === 'building' && s.entries[1].id === BUILDING_B, s);

    // ---- K2: dwa NIEZWIAZANE, bezposrednie wywolania — obie kolejnosci ----
    await page.evaluate((idC) => { window.__fixedOpenEntityCard('building', idC, { mode: 'dialog' }); }, BUILDING_C);
    s = await domState();
    // [ZMIANA R2] BYLO: "zamyka poprzedni — 1 backdrop, C". JEST: doklada sie na wierzch
    // istniejacego stosu, ale stos nigdy nie przekracza DWOCH — najstarsza (A) wypada.
    check('(K2a) [ZMIANA R2] bezposrednie otwarcie NIEZWIAZANEGO C (symulacja innego miejsca UI) laduje NA WIERZCHU, a sufit wypycha NAJSTARSZA — 2 backdropy: B pod C, A juz nie ma',
      s.count === 2
      && s.entries[1].kind === 'building' && s.entries[1].id === BUILDING_C
      && !s.entries.some((e) => e.kind === 'technology' && e.id === TECH_A), s);

    await page.evaluate((techD) => { window.__fixedOpenEntityCard('technology', techD, { mode: 'dialog' }); }, TECH_D);
    s = await domState();
    check('(K2b) [ZMIANA R2] kolejnosc #1 (building → technology): otwarcie D po C daje 2 backdropy, D NA WIERZCHU (bylo: 1 backdrop, D wygrywa)',
      s.count === 2 && s.entries[1].kind === 'technology' && s.entries[1].id === TECH_D, s);

    await page.evaluate((idC) => { window.__fixedOpenEntityCard('building', idC, { mode: 'dialog' }); }, BUILDING_C);
    s = await domState();
    // [ZMIANA R2] BYLO: "otwarcie C po D daje 1 backdrop, C wygrywa". JEST: te same 1 backdrop
    // i to samo C — ale z INNEGO powodu, wiec asercja dostaje jawny opis mechanizmu zamiast
    // przechodzic zbiegiem okolicznosci. C jest w tym momencie NA DOLE stosu ([C, D]), a nowe
    // otwarcie tego samego kind+id nie buduje duplikatu, tylko zdejmuje to, co C zaslania —
    // czyli "wraca do karty pod spodem" (ECHO 2). Kolejnosc otwarcia nadal nie ma znaczenia.
    check('(K2c) [ZMIANA R2] kolejnosc #2, odwrotna (technology → building): ponowne otwarcie C, ktore lezy JUZ na dole stosu, zdejmuje D i wraca do C — 1 backdrop, C (bez duplikatu)',
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
    // [ZMIANA R2] Drenaz stosu PRZED sekcja K3 — przez prawdziwe Escape, nie przez wyrywanie
    // wezlow z DOM: `openDialog` trzyma wlasny `dialogStack`, wiec sam `node.remove()`
    // zostawilby w module wpisy dla nieistniejacych kart (i kolejne otwarcie tej samej encji
    // poszloby sciezka idempotencji, nie budujac nic). Bez sufitu ten stan byl niemozliwy,
    // wiec wczesniej wystarczalo czyszczenie DOM.
    for (let i = 0; i < 8; i++) {
      const n = await page.evaluate(() => document.querySelectorAll('.entity-card-backdrop').length);
      if (n === 0) break;
      await page.keyboard.press('Escape');
    }
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
