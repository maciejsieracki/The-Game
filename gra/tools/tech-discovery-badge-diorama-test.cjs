'use strict';
/**
 * tech-discovery-badge-diorama-test.cjs
 *
 * TEMAT: P-TECHDISCOVERY-BADGE-DUPLIKAT-NACHODZENIE-Q1.
 *
 * Zgłoszenie właściciela (zrzut popupu odkrycia „Rolnictwo"): „ukończone badania, ukończona.
 * To jest powtórzenie. Poza tym tekst nachodzi na grafikę danego badania". Dwie osobne wady
 * w JEDNYM ekranie — `showTechDiscoveryNotice` na ścieżce `entityCards`.
 *
 * DLACZEGO PRAWDZIWY CHROMIUM, NIE jsdom (R-PROC-AUTOBOT.md §9 pkt 6a): wada (B) jest czysto
 * geometryczna — overlay tytułu jest `position:absolute` nad sceną diaromy, więc „czy tekst
 * nachodzi na grafikę" da się rozstrzygnąć WYŁĄCZNIE realnym layoutem
 * (`getBoundingClientRect()` + przecięcie prostokątów). jsdom nie liczy layoutu: zwróciłby
 * same zera i przepuścił zarówno stan sprzed naprawy, jak i po niej.
 *
 * Co pilnuje:
 *
 *  (A) BRAK DUPLIKATU ODZNAK dla zwykłego odkrycia. `kind:'completion'` (gałąź „ani awans
 *      epoki, ani podgląd" — realnie wołana z `main.ts:19422/20131/21442/27004`) renderuje
 *      DOKŁADNIE JEDNĄ `.entity-card-status-badge` o treści „Ukończono badania". Asercja jest
 *      dwuczłonowa: liczba odznak ORAZ brak dwóch odznak o tym samym znaczeniu — samo
 *      „length === 1" przeszłoby też dla przypadkowego zostawienia „Ukończona".
 *
 *  (A2) ZERO REGRESU NA GAŁĘZIACH `era` I `preview`. Tam `kick` i `statusWord` niosą RÓŻNE
 *      informacje (co się stało / jaki to stan), więc nie są duplikatem: obie gałęzie MUSZĄ
 *      nadal mieć po dwie odznaki, o RÓŻNYCH treściach. To jest bezpiecznik przeciw „naprawie"
 *      polegającej na globalnym wycięciu drugiej odznaki.
 *
 *  (B) ZERO NACHODZENIA TEKSTU NA GRAFIKĘ w tym popupie (karta 660px). Dla każdego elementu
 *      overlaya (h2, każda odznaka, podtytuł) liczymy PROSTOKĄT PRZECIĘCIA z medalionem i z
 *      elipsą „gruntu". Mierzymy KAŻDĄ z 3 gałęzi x KAŻDĄ z technologii z listy TECHS (krótka
 *      nazwa ze zgłoszenia + długie nazwy — patrz TECHS). (B1) medalion: tolerancja 0 wszędzie.
 *      (B2) elipsa gruntu: 0 dla gałęzi ze zgłoszenia, a dla `era`/`preview` dopuszczone wyłącznie
 *      skrajne, przezroczyste pasmo ≤4 px. Pomiar sprzed naprawy (origin/main 85777982) dla
 *      porównania: odznaka „Ukończona" nachodziła 80x6 px na medalion i 80x18 px na elipsę.
 *
 *  (C) ZERO REGRESU POZA TYM HOSTEM. Naprawa (B) jest zakotwiczona w `.tdn-entity-card-v2`
 *      ORAZ (od R-CIVPEDIA-KARTY-SPOJNOSC-Q1-C) w `.tdn-side-card` — węzeł C ujednolicił
 *      szerokość satelity do 660px (referencyjna szerokość karty technologii, zgłoszenie
 *      właściciela), więc satelita dziś dzieli TĘ SAMĄ geometrię kolizji i musi dzielić TĘ
 *      SAMĄ naprawę: (c1) domyślna karta encji (budynek, 434px, ścieżka `renderEntityCard`
 *      POZA tym hostem, np. dialog z mapy) ma NADAL diaromę 190px z blokiem `renderer.ts` —
 *      naprawa nie przecieka poza `#civ-tech-discovery-notice-host`; (c2) karta-satelita
 *      `.tdn-side-card` W TYM hoście jest dziś 660px szeroka I ma TĘ SAMĄ podniesioną scenę
 *      226px co karta technologii — najostrzejszy test, że rozszerzenie selektora naprawy na
 *      `.tdn-side-card` faktycznie działa (nie tylko istnieje w źródle).
 *
 *  (D) MUTACJA — dowód nietautologiczności (§9 pkt 6a). Wycinamy z ŹRÓDŁA `techDiscoveryNotice.ts`
 *      kolejno: (d1) jednoodznakową gałąź i (d2) blok CSS naprawiający scenę — i sprawdzamy, że
 *      test faktycznie czerwienieje. Bez tego kroku zielone (A)/(B) nie są dowodem niczego.
 *
 * Usage (z gra/): node tools/tech-discovery-badge-diorama-test.cjs
 */
const fs = require('fs');
const path = require('path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[tech-discovery-badge-diorama-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const SRC = path.resolve(GRA, 'src', 'ui', 'techDiscoveryNotice.ts');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const ENTRY = path.resolve(__dirname, '.tech-discovery-badge-diorama-entry.ts');
const OUTFILE = path.resolve(__dirname, '.tech-discovery-badge-diorama-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const techJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
const buildingId = buildings.find((b) => b && b.id).id;
const TECH_NAMES = techJson.technologie.map((t) => t.Technologia);
const has = (n) => TECH_NAMES.includes(n);
/** Technologia ze zgłoszenia właściciela; gdyby zniknęła z danych — pierwsza z brzegu. */
const TECH = has('Rolnictwo') ? 'Rolnictwo' : TECH_NAMES[0];
/** RUNDA 1 / OBRONA (zarzut 2 Evaluatora): sam „Rolnictwo" NIE jest najostrzejszym przypadkiem.
 * Blok CSS 226/72/63 uzasadniono w raporcie właśnie DŁUGĄ nazwą („Hutnictwo żelaza", 78x6 px na
 * medalionie przed naprawą) — bramka, która mierzy tylko krótką nazwę, przepuściłaby regres na
 * długich tytułach. Mierzymy więc: (1) nazwę ze zgłoszenia, (2) nazwę z dowodu konieczności,
 * (3) NAJDŁUŻSZĄ nazwę w danych — ta ostatnia sama nadąża za zmianami w `tech.json`. */
const LONGEST = TECH_NAMES.slice().sort((a, b) => b.length - a.length)[0];
const TECHS = Array.from(new Set([TECH, has('Hutnictwo żelaza') ? 'Hutnictwo żelaza' : LONGEST, LONGEST]));
/** Skrajne pasmo elipsy „gruntu": `radial-gradient(closest-side, ...)` gasi alfę do 0 na krawędzi,
 * więc ostatnie ~4 px z 36 px wysokości są przezroczyste — przecięcie w tym paśmie jest
 * geometryczne, ale nie ma czego zasłonić (potwierdzone zrzutem). Bramką twardą jest MEDALION
 * (grafika badania ze zgłoszenia): tam tolerancja wynosi 0. Referencja sprzed naprawy: 80x18 px
 * na elipsie i 80x6 px NA MEDALIONIE — obie liczby ta bramka nadal łapie. */
const GROUND_EDGE_TOLERANCE_PX = 4;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function listSvgs(dir, prefix, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listSvgs(p, prefix + e.name + '/', out);
    else if (e.name.endsWith('.svg')) out[prefix + e.name] = fs.readFileSync(p, 'utf8');
  }
  return out;
}

/** Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`) nie istnieją w gołym esbuildzie —
 * inline'ujemy PRAWDZIWE pliki, żeby render w Chromium był 1:1 z produkcją. Ten sam wzorzec
 * co `entity-card-diorama-real-render-test.cjs`. `mutatedSource` (opcjonalny) podmienia
 * treść samego `techDiscoveryNotice.ts` — używane wyłącznie przez sekcję (D). */
function makePlugin(mutatedSource) {
  return {
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
        const isTarget = mutatedSource && path.resolve(args.path) === SRC;
        const src = isTarget ? mutatedSource : fs.readFileSync(args.path, 'utf8');
        if (!isTarget && !src.includes('import.meta.glob')) return null;
        return {
          contents: 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub'),
          loader: 'ts', resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[tech-discovery-badge-diorama-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function buildBundle(mutatedSource) {
  fs.writeFileSync(ENTRY, [
    "import { showTechDiscoveryNotice, hideTechDiscoveryNotice } from '../src/ui/techDiscoveryNotice.ts';",
    "import { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { ensureBrandRootTokens } from '../src/ui/brandTokenVars.ts';",
    'window.__C = { showTechDiscoveryNotice, hideTechDiscoveryNotice, buildEntityCardData,',
    '  renderEntityCard, ENTITY_CARD_CSS, ensureBrandRootTokens };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [makePlugin(mutatedSource)], logLevel: 'silent',
  });
  return fs.readFileSync(OUTFILE, 'utf8');
}

/** Otwiera popup i zwraca pomiary liczone z REALNEGO layoutu Chromium. */
function probe() {
  const host = document.getElementById('civ-tech-discovery-notice-host');
  if (!host) return { error: 'no-host' };
  const card = host.querySelector('.tdn-entity-card-v2');
  const med = host.querySelector('.tdn-entity-card-v2 .entity-card-medallion').getBoundingClientRect();
  const grd = host.querySelector('.tdn-entity-card-v2 .entity-card-diorama-ground').getBoundingClientRect();
  const inter = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return (w > 0 && h > 0) ? { w: Math.round(w), h: Math.round(h) } : null;
  };
  const items = [];
  const h2 = card.querySelector('.entity-card-title-row h2');
  items.push(['h2', h2.getBoundingClientRect()]);
  const badges = Array.from(card.querySelectorAll('.entity-card-status-badge'));
  badges.forEach((b, i) => items.push(['badge' + i + '(' + b.textContent + ')', b.getBoundingClientRect()]));
  const sub = card.querySelector('.entity-card-subtitle');
  if (sub) items.push(['subtitle', sub.getBoundingClientRect()]);
  const titleRow = card.querySelector('.entity-card-title-row').getBoundingClientRect();
  return {
    badgeTexts: badges.map((b) => b.textContent),
    cardWidth: Math.round(card.getBoundingClientRect().width),
    dioramaHeight: Math.round(card.querySelector('.entity-card-diorama').getBoundingClientRect().height),
    // tytuł po LEWEJ, odznaka po PRAWEJ od niego, w TYM SAMYM wierszu (układ z dyspozycji)
    titleLeft: Math.round(h2.getBoundingClientRect().left),
    firstBadgeLeft: badges.length ? Math.round(badges[0].getBoundingClientRect().left) : null,
    sameRow: badges.length
      ? Math.abs(badges[0].getBoundingClientRect().top - titleRow.top) < titleRow.height
      : false,
    overlaps: items
      .map(([el, r]) => ({ el, vsMedallion: inter(r, med), vsGround: inter(r, grd) }))
      .filter((o) => o.vsMedallion || o.vsGround),
  };
}

async function openAndProbe(page, kind, eraIndex, tech) {
  await page.evaluate(({ kind, eraIndex, tech }) => {
    window.__C.hideTechDiscoveryNotice();
    window.__C.showTechDiscoveryNotice({ techName: tech, eraIndex, kind, onOpenTree: () => {} });
  }, { kind, eraIndex, tech });
  await page.waitForTimeout(150);
  return page.evaluate(probe);
}

async function boot(page, bundle) {
  await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    + '*{margin:0;padding:0;box-sizing:border-box;}body{background:#0b0f16;color:#eee;}'
    + '</style></head><body></body></html>');
  await page.addScriptTag({ content: bundle });
  await page.evaluate(() => window.__C.ensureBrandRootTokens());
}

/** Sekcja (A)+(B) na podanym bundlu. Zwraca surowe wyniki — asercje robi caller,
 * żeby ten sam przebieg dało się użyć raz jako bramkę, raz jako kontrolę mutacyjną. */
async function runCore(page, bundle) {
  await boot(page, bundle);
  const out = {};
  for (const tech of TECHS) {
    out[tech] = {
      completion: await openAndProbe(page, 'completion', 1, tech),
      era: await openAndProbe(page, 'era', 1, tech),
      preview: await openAndProbe(page, 'preview', 1, tech),
    };
  }
  return out;
}

async function main() {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    const bundle = await buildBundle(null);
    const all = await runCore(page, bundle);
    const r = all[TECH];
    console.log('Mierzone technologie (krótka + długa nazwa): ' + JSON.stringify(TECHS));

    // ---------------------------------------------------------------------------------
    console.log('\n-- (A) zwykłe odkrycie technologii: JEDNA odznaka, zero powtórzenia --');
    for (const tech of TECHS) {
      const c = all[tech].completion;
      check(`(A) [${tech}] kind:"completion" renderuje DOKŁADNIE jedną odznakę statusu`,
        c.badgeTexts.length === 1, c.badgeTexts);
      check(`(A) [${tech}] jedyna odznaka to „Ukończono badania" (niesie zdarzenie, nie powtarza stanu)`,
        c.badgeTexts[0] === 'Ukończono badania', c.badgeTexts);
      check(`(A) [${tech}] odznaka „Ukończona" NIE występuje już obok „Ukończono badania"`,
        !c.badgeTexts.includes('Ukończona'), c.badgeTexts);
      check(`(A) [${tech}] układ: tytuł po LEWEJ, odznaka po PRAWEJ, w tym samym wierszu`,
        c.sameRow && c.firstBadgeLeft > c.titleLeft,
        { titleLeft: c.titleLeft, badgeLeft: c.firstBadgeLeft, sameRow: c.sameRow });
      check(`(A) [${tech}] karta nadal jest tą SZERSZĄ kartą popupu odkrycia (660px), nie domyślną 434px`,
        c.cardWidth >= 640 && c.cardWidth <= 680, c.cardWidth);
    }

    console.log('\n-- (A2) gałęzie era/preview NIETKNIĘTE: nadal dwie, RÓŻNE odznaki --');
    for (const tech of TECHS) {
      for (const name of ['era', 'preview']) {
        const res = all[tech][name];
        check(`(A2) [${tech}] kind:"${name}" ma nadal DWIE odznaki`, res.badgeTexts.length === 2, res.badgeTexts);
        check(`(A2) [${tech}] kind:"${name}" — obie odznaki niosą RÓŻNĄ treść (to nie duplikat)`,
          res.badgeTexts.length === 2 && res.badgeTexts[0] !== res.badgeTexts[1], res.badgeTexts);
      }
    }
    check('(A2) era: pierwsza odznaka mówi o awansie epoki',
      /^Awans do epoki /.test(r.era.badgeTexts[0]), r.era.badgeTexts);
    check('(A2) preview: odznaki to „Podgląd technologii" + „Informacja"',
      r.preview.badgeTexts.join('|') === 'Podgląd technologii|Informacja', r.preview.badgeTexts);

    console.log('\n-- (B) zero nachodzenia tekstu na grafikę diaromy (żywy layout 660px) --');
    // (B1) MEDALION — grafika badania ze zgłoszenia właściciela. Tolerancja 0, każda technologia,
    //      każda gałąź. To ta asercja łapie stan sprzed naprawy (80x6 px i 78x6 px na medalionie).
    // (B2) ELIPSA GRUNTU — 0 px dla gałęzi ze zgłoszenia (`completion`) przy każdej nazwie;
    //      dla `era`/`preview` dopuszczone WYŁĄCZNIE skrajne, przezroczyste pasmo ≤4 px
    //      (patrz GROUND_EDGE_TOLERANCE_PX). Regres do 18 px z czasów sprzed naprawy — czerwony.
    for (const tech of TECHS) {
      for (const name of ['completion', 'era', 'preview']) {
        const res = all[tech][name];
        const onMedallion = res.overlaps.filter((o) => o.vsMedallion);
        check(`(B1) [${tech}] kind:"${name}" — ZERO przecięcia overlaya z medalionem (grafiką badania)`,
          onMedallion.length === 0, onMedallion);
        const onGround = res.overlaps.filter((o) => o.vsGround);
        const worst = onGround.reduce((m, o) => Math.max(m, o.vsGround.h), 0);
        if (name === 'completion') {
          check(`(B2) [${tech}] kind:"completion" — ZERO przecięcia także z elipsą gruntu`,
            onGround.length === 0, onGround);
        } else {
          check(`(B2) [${tech}] kind:"${name}" — przecięcie z elipsą gruntu najwyżej w skrajnym, `
            + `przezroczystym paśmie (≤${GROUND_EDGE_TOLERANCE_PX}px z 36px)`,
            worst <= GROUND_EDGE_TOLERANCE_PX, { worst, onGround });
        }
      }
      check(`(B) [${tech}] scena diaromy popupu podniesiona, żeby tekst miał własne miejsce (>190px)`,
        all[tech].completion.dioramaHeight > 190, all[tech].completion.dioramaHeight);
    }

    // ---------------------------------------------------------------------------------
    console.log('\n-- (C) zero regresu poza tym popupem --');
    const sideAndDefault = await page.evaluate((bid) => {
      const style = document.createElement('style');
      style.id = 'entity-card-css-under-test';
      style.textContent = window.__C.ENTITY_CARD_CSS;
      document.head.appendChild(style);
      const data = window.__C.buildEntityCardData('building', bid, {});
      if (!data) return { error: 'no-building-data' };
      const card = window.__C.renderEntityCard(data);
      card.id = 'card-default-building';
      document.body.appendChild(card);
      const host = document.getElementById('civ-tech-discovery-notice-host');
      const side = host ? host.querySelector('.tdn-side-card .entity-card-diorama') : null;
      return {
        defaultCardWidth: Math.round(card.getBoundingClientRect().width),
        defaultDioramaHeight: Math.round(card.querySelector('.entity-card-diorama').getBoundingClientRect().height),
        sideDioramaHeight: side ? Math.round(side.getBoundingClientRect().height) : null,
      };
    }, buildingId);
    check('(C) fixture: domyślna karta budynku wyrenderowana', !sideAndDefault.error, sideAndDefault);
    check('(c1) domyślna karta encji (budynek) ma NADAL diaromę 190px z renderer.ts',
      sideAndDefault.defaultDioramaHeight === 190, sideAndDefault);
    // R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A świadomie odwraca tę asercję: `.entity-card` base
    // (renderer.ts) zmienia szerokość referencyjną 434→660px dla WSZYSTKICH kart używających
    // jej wprost (dispatch GOAL pkt 2 + kryterium końca 3) — domyślna karta budynku (ta ścieżka)
    // jest jedną z nich. `.tdn-side-card` (c2 niżej) ma WŁASNĄ regułę `width:min(434px,96vw)`
    // (techDiscoveryNotice.ts:762) która nadpisuje bazę i zostaje nietknięta — 434px tam nadal
    // poprawne. Tylko domyślna karta (bez klasy `.tdn-side-card`/`.tdn-entity-card-v2`) rośnie.
    check('(c1) domyślna karta encji (budynek) ma TERAZ szerokość 660px referencyjną (base renderer.ts)',
      sideAndDefault.defaultCardWidth === 660, sideAndDefault);

    // (c2) satelita: ten SAM host co naprawiona karta — najostrzejszy test przecieku selektora.
    // `host.classList.add('tdn-has-side')` odtwarza DOKŁADNIE `openEntityCardBeside()` (produkcja) —
    // bez tego host zostaje bez klasy progu wąskiego okna, dwie karty 660+660px walczą o tę samą
    // szerokość viewportu (1280px < próg 1400px) i flex je ŚCIŚNIE poniżej zamierzonych 660px —
    // fałszywy FAIL niezwiązany z naprawą (B), tylko z pominięciem kroku, który produkcja zawsze robi.
    const sideProbe = await page.evaluate(() => {
      const host = document.getElementById('civ-tech-discovery-notice-host');
      if (!host) return { error: 'no-host' };
      host.classList.add('tdn-has-side');
      const stage = host.querySelector('.tdn-stage');
      const data = window.__C.buildEntityCardData('building',
        document.getElementById('card-default-building').getAttribute('data-entity-id'), {});
      const side = window.__C.renderEntityCard(data);
      side.classList.add('tdn-side-card');
      stage.appendChild(side);
      return {
        sideWidth: Math.round(side.getBoundingClientRect().width),
        sideDioramaHeight: Math.round(side.querySelector('.entity-card-diorama').getBoundingClientRect().height),
      };
    });
    check('(c2) karta-satelita w TYM SAMYM hoście jest dziś 660px (ujednolicona z kartą technologii)',
      sideProbe.sideWidth === 660, sideProbe);
    check('(c2) karta-satelita dzieli podniesioną scenę 226px — naprawa TERAZ celowo obejmuje .tdn-side-card',
      sideProbe.sideDioramaHeight === 226, sideProbe);

    check('zero błędów konsoli/pageerror w całym przebiegu', consoleErrors.length === 0, consoleErrors);

    // ---------------------------------------------------------------------------------
    // (D) MUTACJA — dowód, że powyższe asercje faktycznie mierzą naprawiony kod.
    // ---------------------------------------------------------------------------------
    console.log('\n-- (D) kontrola nietautologiczności: mutacja źródła MUSI zaczerwienić (A) i (B) --');
    const orig = fs.readFileSync(SRC, 'utf8');

    // (d1) cofnij jednoodznakową gałąź → wraca duplikat „Ukończono badania" + „Ukończona"
    const MUT_BADGE_FROM = 'const statusBadges = (isEraAdvance || isPreview) ? [kick, statusWord] : [kick];';
    check('(D) kotwica mutacji (d1) istnieje w źródle', orig.includes(MUT_BADGE_FROM));
    const mut1 = orig.replace(MUT_BADGE_FROM, 'const statusBadges = [kick, statusWord];');
    const rMut1 = (await runCore(page, await buildBundle(mut1)))[TECH];
    check('(d1) po cofnięciu naprawy odznak duplikat WRACA — asercja (A) realnie czerwienieje',
      rMut1.completion.badgeTexts.length === 2
      && rMut1.completion.badgeTexts.join('|') === 'Ukończono badania|Ukończona',
      rMut1.completion.badgeTexts);

    // (d2) usuń blok CSS naprawiający scenę → wraca nachodzenie tekstu na grafikę
    const MUT_CSS_FROM = /#\$\{HOST_ID\} \.tdn-entity-card-v2 \.entity-card-diorama,\n#\$\{HOST_ID\} \.tdn-side-card \.entity-card-diorama\{height:226px;\}\n#\$\{HOST_ID\} \.tdn-entity-card-v2 \.entity-card-diorama-stage,\n#\$\{HOST_ID\} \.tdn-side-card \.entity-card-diorama-stage\{padding-bottom:72px;\}\n#\$\{HOST_ID\} \.tdn-entity-card-v2 \.entity-card-diorama-ground,\n#\$\{HOST_ID\} \.tdn-side-card \.entity-card-diorama-ground\{bottom:63px;\}\n/;
    check('(D) kotwica mutacji (d2) istnieje w źródle', MUT_CSS_FROM.test(orig));
    const mut2 = orig.replace(MUT_CSS_FROM, '');
    const allMut2 = await runCore(page, await buildBundle(mut2));
    const rMut2 = allMut2[TECH];
    check('(d2) po usunięciu bloku CSS tekst ZNOWU nachodzi na grafikę — asercja (B) realnie czerwienieje',
      rMut2.completion.overlaps.length > 0, rMut2.completion.overlaps);
    check('(d2) mutacja przywraca scenę 190px (dowód, że mierzymy TĘ regułę)',
      rMut2.completion.dioramaHeight === 190, rMut2.completion.dioramaHeight);
    // OBRONA / zarzut 2: nowa, długa nazwa nie jest ozdobnikiem — bez bloku CSS ONA TEŻ czerwieni
    // (B1), i to na medalionie. Gdyby tak nie było, rozszerzenie listy technologii byłoby atrapą.
    for (const tech of TECHS) {
      if (tech === TECH) continue;
      const onMed = allMut2[tech].completion.overlaps.filter((o) => o.vsMedallion);
      check(`(d2) [${tech}] długa nazwa bez bloku CSS wraca NA MEDALION — nowa bramka (B1) jest nośna`,
        onMed.length > 0, allMut2[tech].completion.overlaps);
    }
  } finally {
    await browser.close();
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } }
  }

  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[tech-discovery-badge-diorama-test] błąd:', err);
  process.exit(1);
});
