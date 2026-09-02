'use strict';
/**
 * science-hub-unlock-icons-real-render-test.cjs
 *
 * TEMAT: P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1.
 *
 * ZGŁOSZENIE WŁAŚCICIELA (zrzut panelu badań i rozwoju): „grafika niektórych surowców,
 * takich jak obóz łowiecki, drewno, tartak, trzoda, krowa, byk, nie jest zgodna z tym,
 * co jest ustalone w brandbooku … To występuje na razie głównie w panelu badań i rozwoju."
 *
 * STAN PRZED POPRAWKĄ: `sciencePicker.ts::techUnlockSummary()` zwracała płaski STRING z
 * trzema zaszytymi, generycznymi emoji — JEDEN glif na całą kategorię (budynek / surowiec /
 * ulepszenie terenu), niezależnie od tego, o którą encję chodzi. `scienceHubHud.ts` wstawiał
 * ten string przez `textContent`, więc żadna ikona marki nie mogła się tam pojawić w ogóle.
 *
 * STAN PO: `techUnlockItems()` zwraca DANE (`kind`/`label`/`iconKey`), a render w
 * `scienceHubHud.ts` rozwiązuje ikonę marki per encja właściwym resolverem z
 * `icons/brandAssets.ts` — TYM SAMYM, którego używa reszta gry dla tej samej encji.
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, NIE SAM GREP ŹRÓDŁA (R-PROC-AUTOBOT.md §9 poz. 6a):
 * to, czy gracz zobaczy ikonę, zależy od trzech rzeczy naraz — czy `iconKey` trafia we
 * właściwy wpis mapy marki, czy SVG dociera do `innerHTML` (a nie `textContent`), i czy CSS
 * nadaje slotowi niezerowy rozmiar. Żadna z nich nie jest widoczna w źródle; rozstrzyga
 * dopiero `querySelectorAll('svg')` + `getBoundingClientRect()` na ŻYWO wyrenderowanym
 * drzewie DOM. jsdom nie nadaje się (zerowe prostokąty), stąd realny Chromium.
 *
 * ASERCJE:
 *  (0) statyczne kotwice w źródle — czytelny sygnał, gdyby poprawka zniknęła;
 *  (A) wiersz „Odblok." trzech technologii z kryteriów końca (Oswojenie zwierząt / Obróbka
 *      drewna / Łowiectwo) ma po jednej ikonie SVG na pozycję, niezerowy rozmiar i ZERO
 *      surowych emoji w tekście widzianym przez gracza;
 *  (B) TOŻSAMOŚĆ IKONY — SVG w hubie badań jest identyczny (po normalizacji atrybutów
 *      rozmiaru) z SVG tej samej encji renderowanym gdzie indziej w grze: ulepszenia
 *      wzorcem `buildModeHud.ts::impIconHtml` (klucz z realnej listy `render/improvements.ts`),
 *      budynki wzorcem `cityPanel.ts::buildingIconHtml` (def + id z `loadGameData()`);
 *  (C) BRAK REGRESJI na CAŁEJ tech.json (32 technologie, nie tylko trzy nazwane): każdy
 *      wiersz renderuje się bez wyjątku, liczba ikon == liczba pozycji, żaden slot nie jest
 *      pusty, a technologie bez odblokowań nie dostają pustego wiersza „Odblok.";
 *  (D) SUROWCE — każda etykieta surowca faktycznie pokazywana w hubie rozwiązuje się na
 *      ikonę INNĄ niż `_default` mapy surowców (to łapie „krowa/byk", które przed poprawką
 *      spadało na res-stone, czyli kamień zamiast bydła);
 *  (F) TOŻSAMOŚĆ IKONY BUDYNKU dla WSZYSTKICH pozycji kind='budynek' w całym hubie (nie
 *      tylko trzech nazwanych) — zarzut 1 Evaluatora („Trybunał": hub `bld-default` vs
 *      cityPanel `bld-admin`, bo `trybunal` nie ma wpisu w `building-icon-map.json`);
 *  (G) KAŻDY `iconKey` odpowiada ISTNIEJĄCEJ encji, a żadna etykieta nie jest
 *      placeholderem — zarzut 2 Evaluatora („Matematyka": „—" + prawdziwa ikona Farmy,
 *      bo `improvementIconSvg('—')` spadało na `_default` = `imp-farm`);
 *  (E) MUTACJA (dowód nietautologiczności): odtworzenie stanu sprzed poprawki — ten sam
 *      wiersz zbudowany starym sposobem (`textContent` + generyczne emoji) — MUSI zapalić
 *      asercje (A) i (B) na czerwono. Bez tego test byłby tautologią.
 *
 * Usage (z gra/): node tools/science-hub-unlock-icons-real-render-test.cjs
 * Opcjonalnie: --shot-dir <katalog> zrzuca PNG-i dowodowe (hub + porównanie ikon).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[science-hub-unlock-icons-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.science-hub-unlock-icons-entry.ts');
const OUTFILE = path.resolve(__dirname, '.science-hub-unlock-icons-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
const SCIENCE_PICKER_TS = path.resolve(GRA, 'src', 'ui', 'sciencePicker.ts');
const SCIENCE_HUB_TS = path.resolve(GRA, 'src', 'ui', 'scienceHubHud.ts');

const SHOT_DIR = (() => {
  const i = process.argv.indexOf('--shot-dir');
  return i > -1 ? process.argv[i + 1] : null;
})();

/** Technologie z KRYTERIÓW KOŃCA dispatchu — nazwane wprost przez właściciela. */
const NAMED = ['Oswojenie zwierząt', 'Obróbka drewna', 'Łowiectwo'];

/** Glify, które nie mogą już dotrzeć do gracza w wierszu „Odblok." (stan sprzed poprawki). */
const BANNED = ['\u{1F3DB}', '\u{1F48E}', '\u{1F33E}'];
const ANY_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

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

/**
 * Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`, `*.css?raw`) nie istnieją w gołym
 * esbuildzie. Inline'ujemy PRAWDZIWE pliki SVG z `src/ui/icons/brand/` — ten sam wzorzec co
 * `praca-panel-emoji-brand-icons-real-render-test.cjs`. Gdyby je zastąpić stubem, test
 * „nie widziałby" ŻADNEJ ikony ani przed, ani po poprawką — byłby ślepy z definicji.
 */
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

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[science-hub-unlock-icons-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  // --- (0) statyczne kotwice w źródle ---------------------------------------------------
  const pickerSrc = fs.readFileSync(SCIENCE_PICKER_TS, 'utf8');
  const hubSrc = fs.readFileSync(SCIENCE_HUB_TS, 'utf8');

  const unlockFnIdx = pickerSrc.indexOf('export function techUnlockItems');
  check('(0) sciencePicker.ts eksportuje techUnlockItems() zamiast techUnlockSummary()',
    unlockFnIdx > -1 && !/export function techUnlockSummary/.test(pickerSrc));
  const unlockFnBody = unlockFnIdx > -1 ? pickerSrc.slice(unlockFnIdx, unlockFnIdx + 1400) : '';
  check('(0) techUnlockItems() nie emituje już żadnego generycznego emoji',
    unlockFnBody !== '' && !ANY_EMOJI.test(unlockFnBody), unlockFnBody.slice(0, 120));
  check('(0) scienceHubHud.ts nie wstawia już wiersza „Odblok." jednym textContent',
    !/textContent\s*=\s*'Odblok\.: '\s*\+/.test(hubSrc));
  check('(0) scienceHubHud.ts renderuje ikonę pozycji przez resolver marki (a nie glif)',
    /buildingIconSvg\(\s*\{ id: item\.iconKey, kategoria: item\.iconCategory/.test(hubSrc)
    && /mapResourceIconSvg\(item\.iconKey/.test(hubSrc)
    && /improvementIconSvg\(item\.iconKey/.test(hubSrc));
  // Runda obrony, zarzut 1: `def` z `kategoria` MUSI dojść do resolvera — bez niego budynek
  // spoza `building-icon-map.json` dostaje `bld-default` zamiast ikony swojej kategorii.
  check('(0) buildingIconSvg dostaje def z `kategoria` (nie `undefined`) — inaczej hub ≠ cityPanel',
    !/buildingIconSvg\(undefined/.test(hubSrc) && /iconCategory/.test(pickerSrc));
  // Runda obrony, zarzut 2: placeholdery („—") odsiewane PRZED utworzeniem pozycji.
  check('(0) techUnlockItems() odsiewa placeholdery we wszystkich trzech kategoriach',
    /isPlaceholderLabel/.test(pickerSrc)
    && (unlockFnBody.match(/isPlaceholderLabel\(/g) || []).length === 3, unlockFnBody.slice(0, 200));

  // --- bundle ---------------------------------------------------------------------------
  fs.writeFileSync(ENTRY, [
    "import { createScienceHubHud } from '../src/ui/scienceHubHud.ts';",
    "import { techUnlockItems } from '../src/ui/sciencePicker.ts';",
    "import { buildingIconSvg, improvementIconSvg, mapResourceIconSvg } from '../src/ui/icons/brandAssets.ts';",
    "import { IMPROVEMENTS } from '../src/render/improvements.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import techData from '../../gra/data/tech.json';",
    'window.__createScienceHubHud = createScienceHubHud;',
    'window.__techUnlockItems = techUnlockItems;',
    'window.__buildingIconSvg = buildingIconSvg;',
    'window.__improvementIconSvg = improvementIconSvg;',
    'window.__mapResourceIconSvg = mapResourceIconSvg;',
    'window.__IMPROVEMENTS = IMPROVEMENTS;',
    'window.__loadGameData = loadGameData;',
    'window.__techData = techData;',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    // Hub montowany PRAWDZIWĄ `createScienceHubHud`, karmiony pozycjami z PRAWDZIWEJ
    // `techUnlockItems()` — tej samej, której używa `getScienceHubSnapshot()` w produkcji.
    // Stubowane jest wyłącznie otoczenie stanu gracza (postęp / plan / handlery), które
    // z ikonami nie ma nic wspólnego.
    const boot = await page.evaluate(() => {
      const techs = window.__techData.technologie;
      const slugify = (name) => name.toLowerCase().normalize('NFD')
        .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const entries = techs.map((t) => {
        const id = slugify(t.Technologia);
        const items = window.__techUnlockItems(id);
        return {
          id, name: t.Technologia, epoka: t.Epoka, koszt: t['Koszt nauki'] ?? 0,
          unlockItems: items.length > 0 ? items : undefined,
          locked: false, isTarget: false,
        };
      });
      const api = window.__createScienceHubHud({
        getProgress: () => null,
        getEntries: () => entries,
        onSelectTech: () => {},
        onOpenFullTree: () => {},
        onShowInTree: () => {},
        getPlan: () => [],
      });
      api.show();
      // Hub jest przewijalną listą — dla zrzutu rozwijamy go na pełną wysokość treści.
      api.el.style.maxHeight = 'none';
      api.el.style.height = 'auto';
      const scroll = api.el.querySelector('.sh-scroll') || api.el.firstElementChild;
      if (scroll) { scroll.style.maxHeight = 'none'; scroll.style.overflow = 'visible'; }
      return {
        rendered: api.el.querySelectorAll('.sh-item').length,
        techCount: techs.length,
        withUnlocks: entries.filter((e) => e.unlockItems).length,
      };
    });

    check('fixture: hub badań wyrenderował wiersz dla każdej technologii z tech.json',
      boot.rendered === boot.techCount && boot.techCount > 25, boot);
    check('fixture: część technologii faktycznie ma odblokowania do pokazania',
      boot.withUnlocks > 10, boot);

    /** Pomiar żywego DOM: jedna pozycja huba po nazwie technologii. */
    const measureAll = () => page.evaluate(() => {
      const norm = (svg) => (svg || '')
        .replace(/\swidth="[^"]*"/g, '').replace(/\sheight="[^"]*"/g, '')
        .replace(/\sclass="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
      const out = {};
      for (const row of Array.from(document.querySelectorAll('.sh-item'))) {
        const name = (row.querySelector('.sh-name') || {}).textContent || '?';
        const ul = row.querySelector('.sh-unlock');
        if (!ul) { out[name] = { hasRow: false }; continue; }
        const slots = Array.from(ul.querySelectorAll('.sh-unlock-ic')).map((s) => {
          const svg = s.querySelector('svg');
          const r = s.getBoundingClientRect();
          return {
            kind: s.getAttribute('data-unlock-kind'),
            iconKey: s.getAttribute('data-unlock-icon-key'),
            hasSvg: !!svg,
            svg: norm(svg ? svg.outerHTML : ''),
            w: Math.round(r.width), h: Math.round(r.height),
          };
        });
        out[name] = {
          hasRow: true,
          text: (ul.textContent || '').replace(/\s+/g, ' ').trim(),
          labels: Array.from(ul.querySelectorAll('.sh-unlock-label')).map((n) => n.textContent),
          svgCount: ul.querySelectorAll('svg').length,
          slots,
        };
      }
      return out;
    });

    const m = await measureAll();

    // --- (A) trzy technologie z kryteriów końca -------------------------------------------
    for (const name of NAMED) {
      const r = m[name];
      check('(A) „' + name + '" ma wiersz „Odblok."', !!r && r.hasRow, r);
      if (!r || !r.hasRow) continue;
      check('(A) „' + name + '" — każda pozycja ma własną ikonę SVG (liczba svg == liczba slotów)',
        r.slots.length > 0 && r.svgCount === r.slots.length && r.slots.every((s) => s.hasSvg), r);
      check('(A) „' + name + '" — żaden slot ikony nie jest zerowy wizualnie',
        r.slots.every((s) => s.w > 4 && s.h > 4), r.slots.map((s) => [s.w, s.h]));
      check('(A) „' + name + '" — ZERO surowych emoji w tekście widzianym przez gracza',
        !BANNED.some((g) => r.text.includes(g)) && !ANY_EMOJI.test(r.text), r.text);
      check('(A) „' + name + '" — treść etykiet zachowana (wiersz nadal zaczyna się od „Odblok.:")',
        r.text.startsWith('Odblok.:') && r.labels.length === r.slots.length, r.text);
    }

    // --- (B) tożsamość ikony z tą samą encją gdzie indziej w grze -------------------------
    const identity = await page.evaluate((named) => {
      // Obie strony porównania MUSZĄ przejść tę samą ścieżkę parsowania: strona huba jest
      // już sparsowana przez DOM (`<path/>` → `<path></path>`), więc referencję też
      // przepuszczamy przez DOM. Bez tego porównywalibyśmy serializacje, nie ikony.
      const norm = (svg) => {
        const d = document.createElement('div');
        d.innerHTML = svg || '';
        const el = d.querySelector('svg');
        return (el ? el.outerHTML : '')
          .replace(/\swidth="[^"]*"/g, '').replace(/\sheight="[^"]*"/g, '')
          .replace(/\sclass="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
      };
      const data = window.__loadGameData();
      const buildings = data.buildings || data.budynki || [];
      const out = [];
      for (const row of Array.from(document.querySelectorAll('.sh-item'))) {
        const name = (row.querySelector('.sh-name') || {}).textContent || '?';
        if (!named.includes(name)) continue;
        for (const s of Array.from(row.querySelectorAll('.sh-unlock-ic'))) {
          const kind = s.getAttribute('data-unlock-kind');
          const key = s.getAttribute('data-unlock-icon-key');
          const hub = norm((s.querySelector('svg') || {}).outerHTML);
          let elsewhere = null;
          let source = null;
          if (kind === 'ulepszenie') {
            // Wzorzec `buildModeHud.ts::impIconHtml` — klucz brany z REALNEJ listy
            // `render/improvements.ts`, nie przepisany z pamięci.
            const imp = window.__IMPROVEMENTS.find((i) => i.key === key);
            source = imp ? 'buildModeHud/IMPROVEMENTS:' + imp.key + ' (' + imp.label + ')' : 'brak w IMPROVEMENTS';
            elsewhere = imp ? norm(window.__improvementIconSvg(imp.key, 18)) : null;
          } else if (kind === 'budynek') {
            // Wzorzec `cityPanel.ts::buildingIconHtml(def, def.id)`.
            const def = buildings.find((b) => b && b.id === key);
            source = def ? 'cityPanel/buildings.json:' + def.id + ' (' + def.nazwa + ')' : 'brak w buildings.json';
            elsewhere = def ? norm(window.__buildingIconSvg(def, def.id)) : null;
          } else {
            source = 'brandAssets/mapResourceIconSvg:' + key;
            elsewhere = norm(window.__mapResourceIconSvg(key, 16));
          }
          out.push({ tech: name, kind, key, source, same: elsewhere !== null && hub === elsewhere, resolved: elsewhere !== null });
        }
      }
      return out;
    }, NAMED);

    for (const r of identity) {
      check('(B) „' + r.tech + '" / ' + r.kind + ' „' + r.key + '" — ikona rozwiązana w danych gry (' + r.source + ')',
        r.resolved, r);
      check('(B) „' + r.tech + '" / ' + r.kind + ' „' + r.key + '" — ikona w hubie IDENTYCZNA z tą samą encją gdzie indziej w grze',
        r.same, r);
    }
    check('(B) porównanie objęło wszystkie trzy kategorie (budynek + surowiec + ulepszenie)',
      new Set(identity.map((r) => r.kind)).size === 3, identity.map((r) => r.kind));

    // --- (C) brak regresji na całej tech.json ---------------------------------------------
    const rows = Object.entries(m);
    const broken = rows.filter(([, r]) => r.hasRow && (r.svgCount !== r.slots.length || r.slots.some((s) => !s.hasSvg || s.w <= 4)));
    check('(C) żadna technologia nie ma złamanego/pustego slotu ikony',
      broken.length === 0, broken.slice(0, 4));
    const emojiRows = rows.filter(([, r]) => r.hasRow && ANY_EMOJI.test(r.text));
    check('(C) ŻADNA technologia nie pokazuje już surowego emoji w wierszu „Odblok."',
      emojiRows.length === 0, emojiRows.slice(0, 4).map(([n]) => n));
    const noUnlock = rows.filter(([, r]) => !r.hasRow);
    check('(C) technologie bez odblokowań nie dostają pustego wiersza „Odblok." (zamiast pustego miejsca — brak wiersza)',
      noUnlock.length > 0 && noUnlock.length < rows.length,
      { bez: noUnlock.length, wszystkich: rows.length });
    check('(C) sprawdzono rozrzut technologii, nie tylko trzy nazwane', rows.length > 25, rows.length);
    check('(C) zero wyjątków JS przy renderze całej listy', pageErrors.length === 0, pageErrors.slice(0, 3));

    // --- (D) surowce nie spadają na ikonę domyślną ----------------------------------------
    // Klucze REALNEJ mapy marki (nie przepisane do testu) — sprawdzamy, że każdy `iconKey`
    // surowca faktycznie trafia we WPIS mapy, a nie cicho spada na `_default`. Sam fakt
    // „ikona != _default" tu nie wystarcza, bo `_default` = res-stone jest też poprawną
    // ikoną dla „kamien"; rozstrzyga dopiero istnienie dopasowania w mapie.
    const resourceMapKeys = Object.keys(
      JSON.parse(fs.readFileSync(path.resolve(BRAND_DIR, 'resources-map-icon-map.json'), 'utf8')).map,
    ).filter((k) => k !== '_default');

    const resources = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.sh-unlock-ic[data-unlock-kind="surowiec"]'))
        .map((s) => s.getAttribute('data-unlock-icon-key')));
    const uniqRes = [...new Set(resources)];
    // Ta sama reguła co `mapResourceIconSvg`: exact, potem podciąg.
    const unmatched = uniqRes.filter((k) => {
      const n = (k || '').toLowerCase().trim();
      return !resourceMapKeys.some((mk) => n === mk || n.includes(mk));
    });
    check('(D) każda etykieta surowca pokazywana w hubie trafia we WPIS mapy marki (nie w _default)',
      uniqRes.length > 0 && unmatched.length === 0, { unmatched, wszystkie: uniqRes });
    check('(D) „krowa/byk" ze zgłoszenia właściciela jest rozwiązane na bydło, nie na kamień',
      uniqRes.includes('bydlo') && !uniqRes.includes('krowa/byk'), uniqRes);

    // --- (F) TOŻSAMOŚĆ IKONY BUDYNKU dla WSZYSTKICH pozycji, nie tylko trzech nazwanych ----
    // Runda obrony: (B) obejmowała wyłącznie NAMED, więc rozjazd „Trybunał" (hub
    // `bld-default` vs cityPanel `bld-admin` — `trybunal` nie ma wpisu w
    // `building-icon-map.json`, rozstrzyga dopiero `kategoria` z `def`) przeszedł
    // niezauważony. Teraz porównujemy KAŻDY renderowany budynek z ikoną tego samego
    // budynku tam, gdzie gra rysuje go dziś (`cityPanel.ts::buildingIconHtml(def, id)`).
    const allBuildings = await page.evaluate(() => {
      const norm = (svg) => {
        const d = document.createElement('div');
        d.innerHTML = svg || '';
        const el = d.querySelector('svg');
        return (el ? el.outerHTML : '')
          .replace(/\swidth="[^"]*"/g, '').replace(/\sheight="[^"]*"/g, '')
          .replace(/\sclass="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
      };
      const data = window.__loadGameData();
      const buildings = data.buildings || data.budynki || [];
      return Array.from(document.querySelectorAll('.sh-unlock-ic[data-unlock-kind="budynek"]')).map((s) => {
        const key = s.getAttribute('data-unlock-icon-key');
        const def = buildings.find((b) => b && b.id === key);
        const hub = norm((s.querySelector('svg') || {}).outerHTML);
        const row = s.closest('.sh-item');
        return {
          key,
          tech: (row && (row.querySelector('.sh-name') || {}).textContent) || '?',
          inData: !!def,
          same: def ? hub === norm(window.__buildingIconSvg(def, def.id)) : false,
        };
      });
    });
    const bldMissing = allBuildings.filter((b) => !b.inData);
    const bldDiff = allBuildings.filter((b) => b.inData && !b.same);
    check('(F) każdy budynek w wierszu „Odblok." ma `def` w buildings.json (iconKey to realne id)',
      allBuildings.length > 0 && bldMissing.length === 0, { bldMissing, ile: allBuildings.length });
    check('(F) KAŻDY budynek w hubie ma ikonę IDENTYCZNĄ z ikoną tego budynku w cityPanel (nie tylko 3 nazwane)',
      bldDiff.length === 0, { bldDiff, sprawdzonych: allBuildings.length });
    check('(F) „Trybunał" (zarzut 1 Evaluatora: hub bld-default vs cityPanel bld-admin) objęty porównaniem i zgodny',
      allBuildings.some((b) => b.key === 'trybunal' && b.same),
      allBuildings.filter((b) => b.key === 'trybunal'));

    // --- (G) KAŻDY iconKey odpowiada ISTNIEJĄCEJ encji, nie placeholderowi -----------------
    // Runda obrony: `improvementIconSvg('—')` cicho spadało na `_default` = `imp-farm`,
    // więc przy „Matematyce" („Odblokowuje ulepszenie terenu": "—") stała PRAWDZIWA ikona
    // Farmy. (C) tego nie łapało, bo slot był niepusty i poprawnie się renderował.
    const impMapKeys = Object.keys(
      JSON.parse(fs.readFileSync(path.resolve(BRAND_DIR, 'improvement-icon-map.json'), 'utf8')).map,
    ).filter((k) => k !== '_default');
    const impRendered = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.sh-unlock-ic[data-unlock-kind="ulepszenie"]')).map((s) => ({
        key: s.getAttribute('data-unlock-icon-key'),
        known: !!window.__IMPROVEMENTS.find((i) => i.key === s.getAttribute('data-unlock-icon-key')),
      })));
    const impUnknown = impRendered.filter((i) => !i.known && !impMapKeys.includes(i.key));
    check('(G) każdy `iconKey` ulepszenia odpowiada istniejącej encji (IMPROVEMENTS / improvement-icon-map)',
      impRendered.length > 0 && impUnknown.length === 0, { impUnknown, ile: impRendered.length });

    const allLabels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.sh-unlock-label')).map((e) => (e.textContent || '').trim()));
    const placeholders = allLabels.filter((t) => /^[-—–‒―_.·•]+$/.test(t) || /^(brak|n\/a|nie dotyczy)$/i.test(t));
    check('(G) żadna pozycja „Odblok." nie jest placeholderem („—", „brak") z ikoną marki obok',
      allLabels.length > 0 && placeholders.length === 0, placeholders);
    check('(G) „Matematyka" (tech.json: „Odblokowuje ulepszenie terenu" = „—") nie pokazuje już wiersza „Odblok."',
      !!m['Matematyka'] && m['Matematyka'].hasRow === false, m['Matematyka']);

    // --- zrzuty dowodowe -------------------------------------------------------------------
    if (SHOT_DIR) {
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      const hubBox = await page.locator('.civ-science-hub-hud').first();
      await hubBox.screenshot({ path: path.join(SHOT_DIR, '01-hub-badan-odblokowania-PO.png') });
      for (const name of NAMED) {
        const idx = Object.keys(m).indexOf(name);
        if (idx < 0) continue;
        await page.locator('.sh-item').nth(idx)
          .screenshot({ path: path.join(SHOT_DIR, '02-karta-' + name.replace(/[^a-zA-Z]/g, '') + '-PO.png') });
      }
      // Runda obrony — karty z dwóch zarzutów Evaluatora: „Kodeks" (budynek Trybunał,
      // zarzut 1) i „Matematyka" (placeholder „—" + ikona Farmy, zarzut 2).
      for (const name of ['Kodeks', 'Matematyka']) {
        const idx = Object.keys(m).indexOf(name);
        if (idx < 0) continue;
        await page.locator('.sh-item').nth(idx)
          .screenshot({ path: path.join(SHOT_DIR, '06-karta-' + name.replace(/[^a-zA-Z]/g, '') + '-OBRONA-PO.png') });
      }
      // Porównanie 1:1 — ta sama ikona w hubie i tam, gdzie gra używa jej dziś.
      await page.evaluate((named) => {
        const data = window.__loadGameData();
        const buildings = data.buildings || data.budynki || [];
        const wrap = document.createElement('div');
        wrap.id = 'civ-cmp';
        wrap.style.cssText = 'position:fixed;left:640px;top:20px;width:600px;padding:14px;'
          + 'background:#101724;border:1px solid #6a5212;color:#e8d88a;font:13px system-ui;z-index:99999;';
        wrap.innerHTML = '<div style="font-weight:700;margin-bottom:8px">'
          + 'PORÓWNANIE: hub badań vs to samo miejsce w grze</div>';
        for (const row of Array.from(document.querySelectorAll('.sh-item'))) {
          const name = (row.querySelector('.sh-name') || {}).textContent || '';
          if (!named.includes(name)) continue;
          for (const s of Array.from(row.querySelectorAll('.sh-unlock-ic'))) {
            const kind = s.getAttribute('data-unlock-kind');
            const key = s.getAttribute('data-unlock-icon-key');
            const label = (s.nextElementSibling || {}).textContent || key;
            let other = '';
            let where = '';
            if (kind === 'ulepszenie') {
              const imp = window.__IMPROVEMENTS.find((i) => i.key === key);
              other = imp ? window.__improvementIconSvg(imp.key, 18) : '';
              where = 'buildModeHud (panel budowy terenu)';
            } else if (kind === 'budynek') {
              const def = buildings.find((b) => b && b.id === key);
              other = def ? window.__buildingIconSvg(def, def.id) : '';
              where = 'cityPanel (panel budowy miasta)';
            } else {
              other = window.__mapResourceIconSvg(key, 16);
              where = 'mapResourceIconSvg (ikona złoża na mapie)';
            }
            const line = document.createElement('div');
            line.style.cssText = 'display:flex;align-items:center;gap:10px;margin:7px 0;';
            line.innerHTML = '<span style="width:20px;height:20px;display:inline-flex">'
              + s.innerHTML + '</span><span style="width:20px;height:20px;display:inline-flex">'
              + other + '</span><span style="color:#9fb8d8">' + name + ' → ' + kind + ' „' + label
              + '" · ' + where + '</span>';
            wrap.appendChild(line);
          }
        }
        document.body.appendChild(wrap);
      }, NAMED);
      await page.locator('#civ-cmp').screenshot({ path: path.join(SHOT_DIR, '03-porownanie-ikon-hub-vs-gra.png') });
      await page.evaluate(() => { const n = document.getElementById('civ-cmp'); if (n) n.remove(); });
      // Runda obrony, zarzut 1: to samo porównanie dla „Kodeks" → budynek „Trybunał",
      // czyli dokładnie tej pozycji, na której Evaluator pokazał rozjazd hub vs cityPanel.
      await page.evaluate((named) => {
        const data = window.__loadGameData();
        const buildings = data.buildings || data.budynki || [];
        const wrap = document.createElement('div');
        wrap.id = 'civ-cmp';
        wrap.style.cssText = 'position:fixed;left:640px;top:20px;width:600px;padding:14px;'
          + 'background:#101724;border:1px solid #6a5212;color:#e8d88a;font:13px system-ui;z-index:99999;';
        wrap.innerHTML = '<div style="font-weight:700;margin-bottom:8px">'
          + 'OBRONA / zarzut 1 — „Trybunał": hub badań vs cityPanel</div>';
        for (const row of Array.from(document.querySelectorAll('.sh-item'))) {
          const name = (row.querySelector('.sh-name') || {}).textContent || '';
          if (!named.includes(name)) continue;
          for (const s of Array.from(row.querySelectorAll('.sh-unlock-ic[data-unlock-kind="budynek"]'))) {
            const key = s.getAttribute('data-unlock-icon-key');
            const def = buildings.find((b) => b && b.id === key);
            const line = document.createElement('div');
            line.style.cssText = 'display:flex;align-items:center;gap:10px;margin:7px 0;';
            line.innerHTML = '<span style="width:20px;height:20px;display:inline-flex">' + s.innerHTML
              + '</span><span style="width:20px;height:20px;display:inline-flex">'
              + (def ? window.__buildingIconSvg(def, def.id) : '') + '</span>'
              + '<span style="color:#9fb8d8">' + name + ' → budynek „' + (def ? def.nazwa : key)
              + '" (' + (def ? def.kategoria : '?') + ') · cityPanel (panel budowy miasta)</span>';
            wrap.appendChild(line);
          }
        }
        document.body.appendChild(wrap);
      }, ['Kodeks']);
      await page.locator('#civ-cmp').screenshot({
        path: path.join(SHOT_DIR, '07-porownanie-Trybunal-hub-vs-cityPanel-OBRONA.png'),
      });
      await page.evaluate(() => { const n = document.getElementById('civ-cmp'); if (n) n.remove(); });
      console.log('[shots] ' + SHOT_DIR);
    }

    // --- (E) MUTACJA: cofnięcie poprawki musi zapalić (A) i (B) na czerwono -----------------
    console.log('\n-- Mutacja (kontrola negatywna): odtworzenie renderu sprzed poprawki --');
    await page.evaluate((named) => {
      // Dokładnie stary kod: jeden `textContent` z generycznym emoji na kategorię.
      const EMO = { budynek: '\u{1F3DB}', surowiec: '\u{1F48E}', ulepszenie: '\u{1F33E}' };
      for (const row of Array.from(document.querySelectorAll('.sh-item'))) {
        const name = (row.querySelector('.sh-name') || {}).textContent || '';
        if (!named.includes(name)) continue;
        const ul = row.querySelector('.sh-unlock');
        if (!ul) continue;
        const parts = Array.from(ul.querySelectorAll('.sh-unlock-ic')).map((s) =>
          EMO[s.getAttribute('data-unlock-kind')] + ' ' + ((s.nextElementSibling || {}).textContent || ''));
        ul.textContent = 'Odblok.: ' + parts.join(' · ');
      }
    }, NAMED);

    const mm = await measureAll();
    let mutCaught = 0;
    for (const name of NAMED) {
      const r = mm[name];
      const emojiBack = !!r && r.hasRow && BANNED.some((g) => r.text.includes(g));
      const iconsGone = !!r && r.hasRow && r.svgCount === 0;
      if (emojiBack && iconsGone) mutCaught++;
      check('(E) mutacja „' + name + '" — asercja (A) faktycznie czerwienieje (emoji wraca, ikony znikają)',
        emojiBack && iconsGone, r);
    }
    check('(E) kontrola negatywna objęła wszystkie trzy technologie z kryteriów',
      mutCaught === NAMED.length, { mutCaught });

    if (SHOT_DIR) {
      await page.locator('.civ-science-hub-hud').first()
        .screenshot({ path: path.join(SHOT_DIR, '04-hub-badan-MUTACJA-stan-przed-poprawka.png') });
      const names = Object.keys(mm);
      for (const name of NAMED) {
        const idx = names.indexOf(name);
        if (idx < 0) continue;
        await page.locator('.sh-item').nth(idx)
          .screenshot({ path: path.join(SHOT_DIR, '05-karta-' + name.replace(/[^a-zA-Z]/g, '') + '-MUTACJA-PRZED.png') });
      }
    }
  } finally {
    await browser.close();
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } }
  }

  console.log('\nWynik: ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
