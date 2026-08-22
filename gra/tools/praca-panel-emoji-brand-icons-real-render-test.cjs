'use strict';
/**
 * praca-panel-emoji-brand-icons-real-render-test.cjs
 *
 * TEMAT: P-PRACA-PANEL-EMOJI-ZAMIAST-IKON-Q1.
 *
 * PROBLEM: panel miasta „PODZIAŁ PRACY" (`gra/src/ui/cityPanel.ts`) ma od dawna gotowy,
 * zaakceptowany system reskinu emoji → ikona marki: mapę `CP_INLINE_EMOJI_BRAND`
 * (znak emoji → id ikony SVG w `src/ui/icons/brand/`) i funkcję `cpInlineIcons(text)`,
 * przez którą przechodzą wszystkie helpery kart szczegółów (`el()`, `gridDetailRow`,
 * `appendDetailFormula`, `appendDetailAlgo`, `setNoteHtml`). Mimo to do DOM trafiały
 * jeszcze SUROWE emoji, z dwóch niezależnych powodów:
 *
 *   (1) OMINIĘTY HELPER — hero panelu „Podział pracy" (`renderPodzialPracy`) skleja
 *       `summary.innerHTML` ręcznie i wstawia literalne `🔨` w „(+N 🔨/turę)"; karta
 *       „Praca — co to znaczy" (`buildTopBarPracaDetailCard`) ustawia intro przez
 *       `intro.textContent = '... (👤). ...'`, a `textContent` z definicji NIE renderuje
 *       HTML, więc nawet zmapowany emoji zostałby gołym glifem.
 *
 *   (2) BRAK MAPOWANIA — `📦` (skrzynka „Ulepszenia") w ogóle nie było w
 *       `CP_INLINE_EMOJI_BRAND`, więc `cpInlineIcons()` przepuszczało je nietknięte
 *       przez CAŁĄ ścieżkę helperów: „ściąga" `buildPracaDetailCard` (etykieta suwaka,
 *       wiersze trade-off) oraz `buildTopBarPracaDetailCard` (blok „Gdzie zarządzać").
 *       To dokładnie ta sama skrzynka `chip-crate`, którą właściciel zatwierdził dla
 *       pojęcia „Ulepszenia" w `P-PRACA-PANEL-IKONY-NIESPOJNE-Q1`.
 *
 * Brand-book 1E: „bez emoji" w interfejsie gracza.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, NIE SAM GREP ŹRÓDŁA:
 * defekt (1) i (2) są NIEODRÓŻNIALNE na poziomie źródła — w obu przypadkach w pliku
 * stoi ten sam literalny glif w stringu. To, czy dotrze on do gracza, zależy wyłącznie
 * od tego, czy string przeszedł przez `cpInlineIcons()` ORAZ czy jego emoji jest w mapie
 * ORAZ czy wynik trafił do `innerHTML`, a nie `textContent`. Rozstrzyga to dopiero
 * `node.textContent` / `querySelectorAll('svg')` na ŻYWO wyrenderowanym drzewie DOM.
 * Dlatego asercje główne (A–C) mierzą realny DOM w Chromium, a statyczne kotwice (0)
 * są tylko czytelnym sygnałem, gdy ktoś usunie samą poprawkę.
 *
 * MUTACJA (D): przywrócenie stanu sprzed poprawki (usunięcie `📦` z mapy + wstawienie
 * surowych emoji z powrotem do hero/intro) MUSI zapalić te same asercje na czerwono —
 * inaczej test byłby tautologiczny (precedens `P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1`).
 *
 * Usage (z gra/): node tools/praca-panel-emoji-brand-icons-real-render-test.cjs
 * Opcjonalnie: --shot <plik.png> zrzuca panel do PNG (materiał PRZED/PO do raportu).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[praca-panel-emoji-brand-icons-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.praca-panel-emoji-entry.ts');
const OUTFILE = path.resolve(__dirname, '.praca-panel-emoji-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CITY_PANEL = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');

const SHOT = (() => {
  const i = process.argv.indexOf('--shot');
  return i > -1 ? process.argv[i + 1] : null;
})();

/** Emoji, które w panelu Pracy NIE MOGĄ już dotrzeć do gracza jako gołe glify. */
const BANNED = ['\u{1F528}', '\u{1F3DB}', '\u{1F4E6}', '\u{1F464}']; // 🔨 🏛 📦 👤
const BANNED_LABEL = { '\u{1F528}': 'mlotek 🔨', '\u{1F3DB}': 'budynek 🏛', '\u{1F4E6}': 'skrzynka 📦', '\u{1F464}': 'chlopek 👤' };

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

/** Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`, `*.css?raw`) nie istnieją w gołym
 * esbuildzie. Inline'ujemy PRAWDZIWE pliki SVG (ten sam wzorzec co
 * `civpedia-cross-link-style-real-render-test.cjs`) — inaczej `cityPanelChipIconWrap()`
 * zwracałoby pusty string i test „nie widziałby" żadnej ikony ANI przed, ANI po. */
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

/** `cityPanel.ts` nie eksportuje wewnętrznych builderów panelu — dokładamy eksporty przez
 * onLoad, BEZ modyfikowania pliku w repo (kod produkcyjny leci do bundla 1:1). */
const exposeCityPanelPlugin = {
  name: 'expose-city-panel',
  setup(build) {
    build.onLoad({ filter: /cityPanel\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== CITY_PANEL) return null;
      return {
        contents: fs.readFileSync(args.path, 'utf8')
          + '\nexport { renderPodzialPracy as __renderPodzialPracy,'
          + ' buildPracaDetailCard as __buildPracaDetailCard,'
          + ' buildTopBarPracaDetailCard as __buildTopBarPracaDetailCard,'
          + ' computeView as __computeView,'
          + ' cpInlineIcons as __cpInlineIcons,'
          + ' CP_INLINE_EMOJI_BRAND as __CP_INLINE_EMOJI_BRAND,'
          + ' ensureStyles as __ensureCityPanelStyles };\n',
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[praca-panel-emoji-brand-icons-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/**
 * Zbiera z ŻYWEGO DOM-u, dla każdego z trzech renderowanych fragmentów panelu Pracy:
 *  - `text`  — pełny `textContent` (tu ujawnia się goły emoji, którego reskin nie złapał),
 *  - `svgs`  — liczba realnie wstawionych ikon SVG marki,
 *  - `wraps` — id ikon w `<span class="civ-cs-chip-ic-wrap">` (dowód KTÓREJ ikony użyto).
 */
async function measure(page) {
  return page.evaluate(() => {
    const grab = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return { missing: true };
      const wraps = Array.from(el.querySelectorAll('.civ-cs-chip-ic-wrap svg'))
        .map((s) => s.getAttribute('data-brand-icon') || s.getAttribute('data-icon') || s.classList.value || '?');
      return {
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
        html: el.innerHTML,
        svgs: el.querySelectorAll('svg').length,
        wraps,
      };
    };
    return {
      hero: grab('#civ-praca-hero'),
      sciaga: grab('#civ-praca-sciaga'),
      topbar: grab('#civ-praca-topbar'),
      // Osobno SAM akapit intro — zbiorczy `#civ-praca-topbar` ma ikony także w wierszach
      // grid niżej, więc na nim asercja „intro ma SVG" przechodziłaby także PRZED poprawką.
      topbarIntro: grab('#civ-praca-topbar .dc-note'),
    };
  });
}

/** Czy tekst wyrenderowany do gracza zawiera którykolwiek zakazany glif. */
function bannedIn(text, banned) {
  return banned.filter((g) => text.includes(g));
}

async function main() {
  const citySrc = fs.readFileSync(CITY_PANEL, 'utf8');

  // --- (0) Statyczne kotwice w źródle — czytelny sygnał, gdy poprawka zniknie ------------
  check('(0) CP_INLINE_EMOJI_BRAND mapuje skrzynkę 📦 na zatwierdzoną ikonę chip-crate',
    /'\u{1F4E6}':\s*'chip-crate'/u.test(citySrc));
  // Kotwica celowo na samym GLIFIE PRZYKLEJONYM DO „/turę", a nie na oknie znaków wokół
  // `summary.innerHTML` — komentarz opisujący poprawkę też wymienia 🔨, więc szerokie okno
  // zapalałoby się na własnej dokumentacji.
  check('(0) hero „Podział pracy" nie wstawia już literalnego 🔨 przed „/turę"',
    !/\u{1F528}\/turę/u.test(citySrc));
  check('(0) hero „Podział pracy" używa ikony marki res-work przy „/turę"',
    /cityPanelChipIconWrap\('res-work',\s*\d+\)\}\/turę/u.test(citySrc));
  check('(0) intro karty „Praca — co to znaczy" idzie przez setNoteHtml (a nie .textContent)',
    /setNoteHtml\(intro,\s*\n?\s*'Praca to surowiec z pól okolicy/u.test(citySrc));

  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel } from '../src/ui/cityPanel.ts';",
    "import { __renderPodzialPracy, __buildPracaDetailCard, __buildTopBarPracaDetailCard,",
    "  __computeView, __cpInlineIcons, __CP_INLINE_EMOJI_BRAND, __ensureCityPanelStyles } from '../src/ui/cityPanel.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import { foundCityAt } from '../src/game/cities.ts';",
    "import { TerenBazowy, Nakladka } from '../src/types/hex.ts';",
    'window.__configureCityPanel = configureCityPanel;',
    'window.__renderPodzialPracy = __renderPodzialPracy;',
    'window.__buildPracaDetailCard = __buildPracaDetailCard;',
    'window.__buildTopBarPracaDetailCard = __buildTopBarPracaDetailCard;',
    'window.__computeView = __computeView;',
    'window.__cpInlineIcons = __cpInlineIcons;',
    'window.__CP_INLINE_EMOJI_BRAND = __CP_INLINE_EMOJI_BRAND;',
    'window.__ensureCityPanelStyles = __ensureCityPanelStyles;',
    'window.__loadGameData = loadGameData;',
    'window.__foundCityAt = foundCityAt;',
    'window.__TerenBazowy = TerenBazowy;',
    'window.__Nakladka = Nakladka;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, exposeCityPanelPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  try {
    // Reset 1:1 z `gra/index.html` — panel dziedziczy po nim box-sizing i tło.
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const boot = await page.evaluate(() => {
      window.__ensureCityPanelStyles();
      const data = window.__loadGameData();
      const T = window.__TerenBazowy;
      const N = window.__Nakladka;

      // Mini-mapa 11×11: łąki + wieniec lasów, żeby auto-przypisanie pól dało
      // NIEZEROWĄ Pracę (bez tego hero nie renderuje w ogóle dopisku „(+N/turę)").
      const hexes = {};
      for (let q = -5; q <= 5; q++) {
        for (let r = -5; r <= 5; r++) {
          const far = Math.max(Math.abs(q), Math.abs(r)) >= 2;
          hexes[q + ',' + r] = {
            coords: { q, r },
            terenBazowy: far ? T.Wzgorza : T.Laka,
            nakladka: far ? N.Las : undefined,
          };
        }
      }
      const map = { szerokoscQ: 11, wysokoscR: 11, hexes, seed: 1, riverPaths: [] };

      const city = window.__foundCityAt(0, 0, 0, [], map, 'Testowo');
      if (!city) return { error: 'foundCityAt zwrocilo null' };
      city.population = 6;

      window.__configureCityPanel({
        data,
        difficulty: 'normal',
        getCities: () => [city],
        onPodzialPracyChange: () => {},
        getEmpireHud: () => ({ pracaPool: 137, pracaRate: 13 }),
      });

      const view = window.__computeView(city, map, data);
      if (!view) return { error: 'computeView zwrocilo null' };

      const wrap = document.createElement('div');
      wrap.className = 'civ-cs';
      wrap.style.cssText = 'position:static;display:block;pointer-events:auto;width:460px;padding:16px;';
      document.body.appendChild(wrap);

      // (A) hero + suwak — PRAWDZIWY `renderPodzialPracy` (ścieżka produkcyjna panelu).
      const heroMount = document.createElement('div');
      heroMount.id = 'civ-praca-hero';
      wrap.appendChild(heroMount);
      window.__renderPodzialPracy(heroMount, city, view, data);

      // (B) „ściąga" — PRAWDZIWY `buildPracaDetailCard` (klik w ⓘ przy tytule sekcji).
      const scope = document.createElement('div');
      scope.className = 'civ-detail-scope civ-hover-detail-scope';
      const dock = document.createElement('div');
      dock.className = 'civ-hover-detail-content';
      dock.id = 'civ-praca-sciaga';
      dock.style.cssText = 'width:440px;';
      scope.appendChild(dock); wrap.appendChild(scope);
      dock.appendChild(window.__buildPracaDetailCard(city, view, data));

      // (C) karta paska górnego „Praca — co to znaczy" — PRAWDZIWY builder z hovera chipa.
      const scope2 = document.createElement('div');
      scope2.className = 'civ-detail-scope civ-hover-detail-scope';
      const dock2 = document.createElement('div');
      dock2.className = 'civ-hover-detail-content';
      dock2.id = 'civ-praca-topbar';
      dock2.style.cssText = 'width:440px;';
      scope2.appendChild(dock2); wrap.appendChild(scope2);
      dock2.appendChild(window.__buildTopBarPracaDetailCard(
        city, view, { pracaPool: 137, pracaRate: 13, zloto: 200 }, data,
      ));

      return { praca: Math.round(view.praca), mapaCrate: window.__CP_INLINE_EMOJI_BRAND['\u{1F4E6}'] };
    });

    check('fixture: panel wyrenderowany bez błędu bootstrapu', !boot.error, boot);
    check('fixture: miasto ma NIEZEROWĄ Pracę (inaczej hero nie renderuje dopisku „/turę")',
      boot.praca > 0, boot);

    const m = await measure(page);
    if (SHOT) {
      await page.screenshot({ path: SHOT, fullPage: true });
      console.log('[shot] ' + SHOT);
    }

    // --- (A) hero „Podział pracy" ---------------------------------------------------------
    check('(A) hero panelu „Podział pracy" wyrenderowany', !m.hero.missing, m.hero);
    check('(A) hero pokazuje dopisek „/turę" (ta sama treść co przed reskinem)',
      !m.hero.missing && m.hero.text.includes('/turę'), m.hero.text);
    check('(A) hero NIE zawiera już ŻADNEGO gołego emoji w tekście widzianym przez gracza',
      !m.hero.missing && bannedIn(m.hero.text, BANNED).length === 0,
      { text: m.hero.text, banned: m.hero.missing ? null : bannedIn(m.hero.text, BANNED).map((g) => BANNED_LABEL[g]) });
    check('(A) hero ma realne ikony SVG marki (>=2: skrzynka „Ulepszenia" + młotek Pracy)',
      !m.hero.missing && m.hero.svgs >= 2, m.hero.svgs);

    // --- (B) „ściąga" buildPracaDetailCard ------------------------------------------------
    check('(B) karta-ściąga „Podział pracy" wyrenderowana', !m.sciaga.missing, m.sciaga);
    check('(B) ściąga NIE zawiera już ŻADNEGO gołego emoji (🔨/🏛/📦/👤) w tekście',
      !m.sciaga.missing && bannedIn(m.sciaga.text, BANNED).length === 0,
      { banned: m.sciaga.missing ? null : bannedIn(m.sciaga.text, BANNED).map((g) => BANNED_LABEL[g]) });
    check('(B) ściąga zachowała treść merytoryczną (wiersze trade-off „Więcej …")',
      !m.sciaga.missing && m.sciaga.text.includes('Więcej') && m.sciaga.text.includes('Skrajności'),
      m.sciaga.text.slice(0, 200));
    check('(B) ściąga ma dużo realnych ikon SVG marki zamiast emoji (>=10)',
      !m.sciaga.missing && m.sciaga.svgs >= 10, m.sciaga.svgs);

    // --- (C) karta paska górnego „Praca — co to znaczy" ------------------------------------
    check('(C) karta „Praca — co to znaczy" wyrenderowana', !m.topbar.missing, m.topbar);
    check('(C) karta „Praca — co to znaczy" NIE zawiera już gołego emoji w tekście',
      !m.topbar.missing && bannedIn(m.topbar.text, BANNED).length === 0,
      { banned: m.topbar.missing ? null : bannedIn(m.topbar.text, BANNED).map((g) => BANNED_LABEL[g]) });
    check('(C) SAM akapit intro renderuje ikonę SVG (dowód, że nie jest już .textContent)',
      !m.topbarIntro.missing && m.topbarIntro.svgs >= 1
      && m.topbarIntro.text.includes('Praca to surowiec z pól okolicy'),
      { svgs: m.topbarIntro.svgs, text: m.topbarIntro.text });
    check('(C) SAM akapit intro nie zawiera już gołego 👤',
      !m.topbarIntro.missing && !m.topbarIntro.text.includes('\u{1F464}'), m.topbarIntro.text);
    check('(C) karta ma realne ikony SVG marki (>=8)', !m.topbar.missing && m.topbar.svgs >= 8, m.topbar.svgs);

    // --- kontrakt reskinu: 📦 faktycznie idzie na chip-crate, nie na dowolną inną ikonę ----
    const crate = await page.evaluate(() => {
      const out = window.__cpInlineIcons('x \u{1F4E6} y');
      const d = document.createElement('div');
      d.innerHTML = out;
      const svg = d.querySelector('svg');
      return {
        mapped: window.__CP_INLINE_EMOJI_BRAND['\u{1F4E6}'],
        hasSvg: !!svg,
        stillEmoji: (d.textContent || '').includes('\u{1F4E6}'),
      };
    });
    check('(kontrakt) 📦 zmapowane na chip-crate — TĘ SAMĄ skrzynkę co „Ulepszenia" w P-PRACA-PANEL-IKONY-NIESPOJNE-Q1',
      crate.mapped === 'chip-crate', crate);
    check('(kontrakt) cpInlineIcons("📦") zwraca SVG i zjada glif', crate.hasSvg && !crate.stillEmoji, crate);

    // --- (D) MUTACJA: cofnięcie poprawki MUSI zapalić asercje na czerwono ------------------
    console.log('\n-- Mutacja: cofnięcie poprawki (usuń 📦 z mapy + wstaw surowe emoji z powrotem) --');
    const mut = await page.evaluate(() => {
      // (2) cofnięcie mapowania — cpInlineIcons znów przepuści 📦 nietknięte.
      const before = window.__CP_INLINE_EMOJI_BRAND['\u{1F4E6}'];
      delete window.__CP_INLINE_EMOJI_BRAND['\u{1F4E6}'];
      // (1) cofnięcie „ominiętego helpera" — dokładnie tak wyglądał DOM przed poprawką:
      // hero z gołym 🔨 sklejonym w innerHTML, intro karty ustawione przez .textContent.
      const hero = document.getElementById('civ-praca-hero').querySelector('.praca-split-summary');
      hero.innerHTML = hero.innerHTML.replace(/\/turę/, ' \u{1F528}/turę');
      const intro = document.getElementById('civ-praca-topbar').querySelector('.dc-note');
      intro.textContent = 'Praca to surowiec z pól okolicy (\u{1F464}). Duża liczba to pula imperium.';
      return { before };
    });
    check('(D) mutacja wyszła ze stanu naprawionego (📦 było zmapowane na chip-crate)',
      mut.before === 'chip-crate', mut);

    const mm = await page.evaluate(() => {
      const d = document.createElement('div');
      d.innerHTML = window.__cpInlineIcons('Etykieta: 60% \u{1F3DB} · 40% \u{1F4E6} — jeden pasek.');
      return {
        sciagaLike: d.textContent,
        heroText: document.getElementById('civ-praca-hero').textContent,
        introText: document.getElementById('civ-praca-topbar').querySelector('.dc-note').textContent,
        introSvgs: document.getElementById('civ-praca-topbar').querySelector('.dc-note').querySelectorAll('svg').length,
      };
    });
    check('(D) mutacja: 📦 znów przecieka przez cpInlineIcons jako goły glif (dowód, że (0)/(B) nie są puste)',
      mm.sciagaLike.includes('\u{1F4E6}') && !mm.sciagaLike.includes('\u{1F3DB}'), mm.sciagaLike);
    check('(D) mutacja: hero znów pokazuje goły młotek 🔨 (dowód, że asercja (A) łapie regres)',
      mm.heroText.includes('\u{1F528}'), mm.heroText);
    check('(D) mutacja: intro przez .textContent znów gubi ikonę i zostawia goły 👤 (dowód dla (C))',
      mm.introText.includes('\u{1F464}') && mm.introSvgs === 0, mm);

    check('brak błędów konsoli/pageerror w trakcie renderu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
    fs.rmSync(ENTRY, { force: true });
    fs.rmSync(OUTFILE, { force: true });
  }

  console.log('');
  console.log(`[praca-panel-emoji-brand-icons-real-render-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
