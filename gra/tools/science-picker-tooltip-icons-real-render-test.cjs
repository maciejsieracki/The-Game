'use strict';
/**
 * science-picker-tooltip-icons-real-render-test.cjs
 *
 * TEMAT: P-SCIENCEHUB-TOOLTIP-EMOJI-ZAMIAST-IKON-Q1.
 *
 * DRUGA, NIEZALEŻNA INSTANCJA klasy błędu naprawionej tematem
 * `P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1` (commit `a2c887e8`, wiersz „Odblok."
 * w hubie badań). Tamten temat naprawiał WYŁĄCZNIE listę huba; tooltip hover na węźle
 * drzewka technologii (`sciencePicker.ts::buildTooltipHTML`) był osobnym call site
 * i dalej emitował surowe, generyczne glify:
 *     reqs.push('\u{1F3DB} budynek: ' + esc(node.wymaganyBudynek));
 *     reqs.push('\u{1F33E} ulepszenie: ' + esc(node.wymaganeUlepszenie));
 * JEDEN znak dla KAŻDEGO budynku i JEDEN dla KAŻDEGO ulepszenia terenu — ta sama
 * „Cegielnia", która w panelu miasta i w hubie badań ma ikonę marki, w tooltipie
 * dostawała 🏛.
 *
 * STAN PO: `techRequirementItems()` zwraca DANE (`prefix` + `TechUnlockItem`), a ikonę
 * rozwiązuje `unlockIconSvg()` — TEN SAM resolver z `scienceHubHud.ts`, którym idzie
 * wiersz „Odblok.". Jeden resolver na obie powierzchnie ⇒ rozjazd między nimi jest
 * strukturalnie niemożliwy, a nie tylko „sprawdzony raz".
 *
 * DLACZEGO PRAWDZIWA PRZEGLĄDARKA, NIE SAM GREP ŹRÓDŁA (R-PROC-AUTOBOT.md §9 poz. 6a):
 * czy gracz zobaczy ikonę, zależy naraz od czterech rzeczy — czy `iconKey` trafia we
 * właściwy wpis mapy marki, czy tooltip w ogóle powstaje na `mouseover` (handler jest
 * delegowany na `panelEl`, węzeł to `<g>` w SVG), czy SVG dociera do `innerHTML`
 * (a nie do `textContent`), i czy CSS nadaje slotowi niezerowy rozmiar. Żadnej z nich
 * nie widać w źródle. Rozstrzyga dopiero prawdziwy `mouseover` na prawdziwym drzewku
 * i `getBoundingClientRect()` na żywym DOM. jsdom nie nadaje się (zerowe prostokąty).
 *
 * ASERCJE:
 *  (0) statyczne kotwice w źródle — czytelny sygnał, gdyby poprawka zniknęła;
 *  (A) tooltip KAŻDEJ technologii z warunkiem badania ma po jednej ikonie SVG na
 *      pozycję, niezerowy rozmiar i ZERO surowych emoji w sekcji „Warunek badania:";
 *  (B) TOŻSAMOŚĆ IKONY z tą samą encją tam, gdzie gra rysuje ją dziś:
 *      budynek → `cityPanel.ts::buildingIconHtml(def, def.id)`,
 *      ulepszenie → `buildModeHud.ts::impIconHtml(IMPROVEMENTS.key)`;
 *  (B2) TOŻSAMOŚĆ MIĘDZY POWIERZCHNIAMI — ta sama encja w tooltipie drzewka i w
 *      wierszu „Odblok." huba badań (naprawionym poprzednim tematem) ma ten sam SVG;
 *  (C) brak regresji na CAŁEJ tech.json + zero wyjątków JS;
 *  (G) placeholder („—", „brak") nigdy nie dociera do gracza z ikoną marki obok,
 *      a technologia bez warunku nie dostaje pustego nagłówka sekcji;
 *  (E) MUTACJA (kontrola negatywna): odtworzenie renderu sprzed poprawki musi zapalić
 *      (A) na czerwono — bramka, która nie czerwienieje, niczego nie pilnuje.
 *
 * Uruchomienie: node tools/science-picker-tooltip-icons-real-render-test.cjs [--shot-dir DIR]
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[science-picker-tooltip-icons-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.science-picker-tooltip-icons-entry.ts');
const OUTFILE = path.resolve(__dirname, '.science-picker-tooltip-icons-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BRAND_DIR = path.resolve(GRA, 'src', 'ui', 'icons', 'brand');
const BRAND_ASSETS_TS = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
const SCIENCE_PICKER_TS = path.resolve(GRA, 'src', 'ui', 'sciencePicker.ts');
const SCIENCE_HUB_TS = path.resolve(GRA, 'src', 'ui', 'scienceHubHud.ts');

const SHOT_DIR = (() => {
  const i = process.argv.indexOf('--shot-dir');
  return i > -1 ? process.argv[i + 1] : null;
})();

/** Glify sprzed poprawki — nie mogą już dotrzeć do gracza w „Warunek badania:". */
const BANNED = ['\u{1F3DB}', '\u{1F33E}'];
const ANY_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

/**
 * LUSTRO produkcyjnego `isPlaceholderLabel()` z `sciencePicker.ts` — bramka musi liczyć
 * oczekiwaną liczbę pozycji tą samą regułą, którą produkcja odsiewa placeholdery.
 * Rozjazd lustra ze źródłem łapie kotwica (0) „lustro placeholdera zgodne z produkcją".
 */
function isPlaceholderLabelJs(label) {
  const s = String(label === null || label === undefined ? '' : label).trim().toLowerCase();
  if (s === '') return true;
  if (/^[-—–‒―_.·•]+$/.test(s)) return true;
  return s === 'brak' || s === 'n/a' || s === 'nie dotyczy' || s === 'brak.';
}
/** Pozycje, których gracz MA zobaczyć dla danej wartości pola: człon po członie, bez placeholderów. */
function expectedLabels(raw) {
  return String(raw === null || raw === undefined ? '' : raw)
    .split(',').map((s) => s.trim()).filter((s) => !isPlaceholderLabelJs(s));
}

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
 * Vite-owe konstrukcje (`import.meta.glob`, `*.svg?raw`) nie istnieją w gołym esbuildzie.
 * Inline'ujemy PRAWDZIWE pliki SVG z `src/ui/icons/brand/` — ten sam wzorzec, co
 * `science-hub-unlock-icons-real-render-test.cjs`. Stub zamiast realnych plików uczyniłby
 * test ślepym z definicji: nie widziałby ŻADNEJ ikony ani przed, ani po poprawce.
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
    console.log('[science-picker-tooltip-icons-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function main() {
  // --- (0) statyczne kotwice w źródle ---------------------------------------------------
  const pickerSrc = fs.readFileSync(SCIENCE_PICKER_TS, 'utf8');
  const hubSrc = fs.readFileSync(SCIENCE_HUB_TS, 'utf8');

  // Kotwice liczą się WYŁĄCZNIE na kodzie: komentarze w obu plikach CYTUJĄ stan sprzed
  // poprawki (razem z glifami 🏛/🌾 i starą linią `reqs.push(...)`), żeby był ślad, co
  // i dlaczego zniknęło. Skanowanie surowego pliku łapałoby ten cytat i dawało fałszywy
  // alarm — a po usunięciu komentarza bramka „zzieleniałaby" bez żadnej zmiany zachowania.
  const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const pickerCode = stripComments(pickerSrc);
  /** Ciało funkcji od jej nagłówka do następnej deklaracji najwyższego poziomu. */
  const bodyOf = (src, head) => {
    const i = src.indexOf(head);
    if (i < 0) return '';
    const j = src.indexOf('\n}', i);
    return j > i ? src.slice(i, j + 2) : src.slice(i, i + 4000);
  };
  const ttBody = bodyOf(pickerCode, 'function buildTooltipHTML');

  check('(0) sciencePicker.ts eksportuje techRequirementItems() — producent danych, nie stringu',
    /export function techRequirementItems\(/.test(pickerCode));
  check('(0) buildTooltipHTML() nie emituje już żadnego surowego emoji kategorii',
    ttBody !== '' && !BANNED.some((g) => ttBody.includes(g)), ttBody.slice(0, 200));
  check('(0) tooltip nie skleja już warunku płaskim stringiem z glifem kategorii',
    !/reqs\.push\(/.test(pickerCode) && !/const reqs: string\[\]/.test(pickerCode));
  check('(0) tooltip renderuje ikonę przez resolver marki reużyty z huba (unlockIconSvg)',
    /unlockIconSvg\(rq\.item\)/.test(pickerCode)
    && /import \{ refreshScienceHubIfOpen, unlockIconSvg \} from '\.\/scienceHubHud'/.test(pickerCode));
  check('(0) scienceHubHud.ts udostępnia ten sam resolver (export, bez zmiany logiki listy)',
    /export function unlockIconSvg\(item: TechUnlockItem\): string/.test(stripComments(hubSrc)));
  // Błąd (a) z tematu poprzedniego: pełny `def` (id + kategoria) do resolvera, nie samo id.
  const reqFnBody = bodyOf(pickerCode, 'export function techRequirementItems');
  check('(0) budynek warunku niesie iconCategory (def z kategorią) — inaczej tooltip ≠ cityPanel',
    /iconCategory: ref\.kategoria/.test(reqFnBody), reqFnBody.slice(0, 200));
  // Błąd (b) z tematu poprzedniego: placeholdery odsiane PRZED utworzeniem pozycji.
  check('(0) techRequirementItems() odsiewa placeholdery w OBU gałęziach (reużyta isPlaceholderLabel)',
    (reqFnBody.match(/isPlaceholderLabel\(/g) || []).length === 2, reqFnBody.slice(0, 400));
  check('(0) ulepszenie warunku idzie przez IMPROVEMENT_NAME_TO_KEY, nie przez surową etykietę',
    /IMPROVEMENT_NAME_TO_KEY\[key\]/.test(reqFnBody));
  // Zarzut 2 Evaluatora: pozycja per CZŁON pola, nie jedna pozycja na całe pole —
  // inaczej „Cegielnia, Koszary" dostaje jedną ikonę Cegielni przy etykiecie o dwóch
  // budynkach (ikona sprzeczna z tekstem obok, regresja wprowadzona tym tematem).
  check('(0) techRequirementItems() rozbija OBIE gałęzie po przecinku (splitLabels), nie bierze pola w całości',
    (reqFnBody.match(/for \(const \w+ of splitLabels\(/g) || []).length === 2
    && /function splitLabels\(raw: string\): string\[\]/.test(pickerCode)
    // klucz ikony rozwiązywany z TEGO SAMEGO członu, który stoi w etykiecie —
    // `firstLabel()` (pierwszy człon całego pola) byłby tu właśnie rozjazdem
    && !/firstLabel\(/.test(reqFnBody), reqFnBody.slice(0, 600));
  // Zarzut 1 Evaluatora: lustro placeholdera w bramce musi być tą samą regułą, co produkcja.
  const prodPlaceholderBody = bodyOf(pickerCode, 'function isPlaceholderLabel');
  const mirrorAgrees = ['', ' ', '—', '--', '·', 'brak', 'BRAK', 'brak.', 'n/a', 'Nie dotyczy',
    'Cegielnia', 'Tartak', '-x-'].every((s) => {
    // Lustro odtwarza dokładnie trzy reguły produkcji; sprawdzamy, że wszystkie trzy
    // nadal stoją w źródle, i że lustro daje dla nich niesprzeczny werdykt.
    const src = prodPlaceholderBody;
    const empty = /if \(s === ''\) return true;/.test(src);
    const dashes = /\^\[-—–‒―_\.·•\]\+\$/.test(src);
    const words = /'brak' \|\| s === 'n\/a' \|\| s === 'nie dotyczy' \|\| s === 'brak\.'/.test(src);
    return empty && dashes && words && typeof isPlaceholderLabelJs(s) === 'boolean';
  });
  check('(0) lustro placeholdera w bramce zgodne z produkcyjnym isPlaceholderLabel()',
    mirrorAgrees && isPlaceholderLabelJs('—') && isPlaceholderLabelJs('brak')
    && !isPlaceholderLabelJs('Cegielnia'), prodPlaceholderBody.slice(0, 300));

  // --- bundle ---------------------------------------------------------------------------
  fs.writeFileSync(ENTRY, [
    "import { configureSciencePicker, showSciencePicker, techRequirementItems } from '../src/ui/sciencePicker.ts';",
    "import { techUnlockItems } from '../src/ui/sciencePicker.ts';",
    "import { createScienceHubHud } from '../src/ui/scienceHubHud.ts';",
    "import { buildingIconSvg, improvementIconSvg } from '../src/ui/icons/brandAssets.ts';",
    "import { IMPROVEMENTS } from '../src/render/improvements.ts';",
    "import { loadGameData } from '../src/data/loader.ts';",
    "import techData from '../../gra/data/tech.json';",
    'window.__configureSciencePicker = configureSciencePicker;',
    'window.__showSciencePicker = showSciencePicker;',
    'window.__techRequirementItems = techRequirementItems;',
    'window.__techUnlockItems = techUnlockItems;',
    'window.__createScienceHubHud = createScienceHubHud;',
    'window.__buildingIconSvg = buildingIconSvg;',
    'window.__improvementIconSvg = improvementIconSvg;',
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

  // Technologie z warunkiem badania — czytane z PRAWDZIWEJ tech.json, nie przepisane
  // do testu z pamięci: gdy dane się zmienią, bramka pokryje nowy zestaw sama.
  const techs = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'tech.json'), 'utf8')).technologie;
  const slugify = (name) => name.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  // Oczekiwanie fixture'u liczone TĄ SAMĄ regułą, co produkcja: człony po przecinku,
  // placeholdery („—", „brak") odsiane. Sama prawdziwość `.trim()` dawała bramkę, która
  // przy placeholderze w danych czerwieniałaby z NIEWŁAŚCIWEGO powodu — obwiniałaby brak
  // pozycji, zamiast potwierdzić, że filtr produkcyjny zadziałał POPRAWNIE. Zgodności
  // tego lustra z produkcją pilnuje kotwica (0) wyżej, nie dobra wola.
  const WITH_REQ = techs
    .map((t) => ({
      name: t.Technologia,
      slug: slugify(t.Technologia),
      buds: expectedLabels(t['wymagany budynek']),
      uleps: expectedLabels(t['wymagane ulepszenie']),
    }))
    .filter((t) => t.buds.length + t.uleps.length > 0);
  check('fixture: tech.json ma technologie z warunkiem badania (jest co sprawdzać)',
    WITH_REQ.length >= 5, WITH_REQ.map((t) => t.name));
  check('fixture: pokryte są OBIE gałęzie warunku (budynek i ulepszenie)',
    WITH_REQ.some((t) => t.buds.length > 0) && WITH_REQ.some((t) => t.uleps.length > 0));

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}'
      + '</style></head><body></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    // Drzewko montowane PRAWDZIWĄ `showSciencePicker()`; stubowane jest wyłącznie
    // otoczenie stanu gracza (zbadane/dostępne/plan), które z ikonami nic nie ma
    // wspólnego. Tooltip powstaje z prawdziwego `mouseover`, nie jest wołany bokiem.
    const boot = await page.evaluate(() => {
      const all = window.__techData.technologie.map((t) => t.Technologia.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
      window.__configureSciencePicker({
        getResearchState: () => ({ pula: 0, targetId: null, kosztCelu: 0, postepFraction: 0, turnsLeft: 0 }),
        getResearchedTechs: () => [],
        getAvailableTechs: () => all,
        onSelectTarget: () => {},
        getPlan: () => [],
      });
      window.__showSciencePicker(0);
      return {
        nodes: document.querySelectorAll('[data-tech-id]').length,
        hasTooltip: !!document.querySelector('.civ-sci-tooltip'),
      };
    });
    check('fixture: drzewko wyrenderowało węzły technologii', boot.nodes > 25, boot);
    check('fixture: element tooltipa istnieje w DOM', boot.hasTooltip, boot);

    /** Prawdziwy hover na węźle + pomiar żywego tooltipa. */
    const hoverAndMeasure = (slug) => page.evaluate((s) => {
      const node = document.getElementById('snode-' + s);
      if (!node) return { found: false };
      const r = node.getBoundingClientRect();
      node.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true, cancelable: true,
        clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2),
      }));
      const tip = document.querySelector('.civ-sci-tooltip');
      if (!tip || tip.style.display === 'none') return { found: true, shown: false };
      const norm = (svg) => (svg || '')
        .replace(/\swidth="[^"]*"/g, '').replace(/\sheight="[^"]*"/g, '')
        .replace(/\sclass="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
      // Sekcja „Warunek badania:" = nagłówek + następujący po nim <ul>.
      const heads = Array.from(tip.querySelectorAll('.tt-section'));
      const head = heads.find((h) => (h.textContent || '').indexOf('Warunek badania') > -1) || null;
      const ul = head ? head.nextElementSibling : null;
      const lis = ul ? Array.from(ul.querySelectorAll('li')) : [];
      return {
        found: true, shown: true,
        hasSection: !!head,
        tipText: (tip.textContent || '').replace(/\s+/g, ' ').trim(),
        secText: ul ? (ul.textContent || '').replace(/\s+/g, ' ').trim() : '',
        items: lis.map((li) => {
          const ic = li.querySelector('.tt-req-ic');
          const svg = ic ? ic.querySelector('svg') : null;
          const box = ic ? ic.getBoundingClientRect() : { width: 0, height: 0 };
          const lab = li.querySelector('.tt-req-label');
          return {
            kind: ic ? ic.getAttribute('data-req-kind') : null,
            iconKey: ic ? ic.getAttribute('data-req-icon-key') : null,
            hasSvg: !!svg,
            svgCount: li.querySelectorAll('svg').length,
            svg: norm(svg ? svg.outerHTML : ''),
            w: Math.round(box.width), h: Math.round(box.height),
            label: lab ? (lab.textContent || '').trim() : (li.textContent || '').trim(),
          };
        }),
      };
    }, slug);

    const measured = {};
    for (const t of WITH_REQ) measured[t.name] = await hoverAndMeasure(t.slug);

    // --- (A) każda technologia z warunkiem badania ----------------------------------------
    for (const t of WITH_REQ) {
      const r = measured[t.name];
      const expected = t.buds.length + t.uleps.length;
      check('(A) „' + t.name + '" — węzeł w drzewku i tooltip pokazany po hoverze',
        !!r && r.found && r.shown, r);
      if (!r || !r.shown) continue;
      check('(A) „' + t.name + '" — sekcja „Warunek badania:" obecna z kompletem pozycji',
        r.hasSection && r.items.length === expected, { items: r.items.length, expected });
      check('(A) „' + t.name + '" — każda pozycja ma DOKŁADNIE jedną ikonę SVG',
        r.items.length > 0 && r.items.every((i) => i.hasSvg && i.svgCount === 1), r.items);
      check('(A) „' + t.name + '" — żaden slot ikony nie jest zerowy wizualnie',
        r.items.every((i) => i.w > 4 && i.h > 4), r.items.map((i) => [i.iconKey, i.w, i.h]));
      check('(A) „' + t.name + '" — ZERO surowych emoji w sekcji widzianej przez gracza',
        !BANNED.some((g) => r.secText.includes(g)) && !ANY_EMOJI.test(r.secText), r.secText);
      check('(A) „' + t.name + '" — treść etykiet zachowana 1:1 z tech.json (człon po członie)',
        t.buds.every((b) => r.items.some((i) => i.label === 'budynek: ' + b))
        && t.uleps.every((u) => r.items.some((i) => i.label === 'ulepszenie: ' + u)),
        { labels: r.items.map((i) => i.label), buds: t.buds, uleps: t.uleps });
    }

    // --- (B) tożsamość z tą samą encją tam, gdzie gra rysuje ją dziś ----------------------
    const identity = await page.evaluate((rows) => {
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
      for (const t of rows) {
        for (const it of window.__techRequirementItems(t.slug)) {
          const item = it.item;
          let elsewhere = null;
          let source = null;
          if (item.kind === 'budynek') {
            // Wzorzec `cityPanel.ts::buildingIconHtml(def, def.id)` — def z REALNYCH danych.
            const def = buildings.find((b) => b && b.id === item.iconKey);
            source = def ? 'cityPanel/buildings.json:' + def.id + ' (' + def.nazwa + ')' : 'brak w buildings.json';
            elsewhere = def ? norm(window.__buildingIconSvg(def, def.id)) : null;
          } else {
            // Wzorzec `buildModeHud.ts::impIconHtml` — klucz z REALNEJ listy IMPROVEMENTS.
            const imp = window.__IMPROVEMENTS.find((i) => i.key === item.iconKey);
            source = imp ? 'buildModeHud/IMPROVEMENTS:' + imp.key + ' (' + imp.label + ')' : 'brak w IMPROVEMENTS';
            elsewhere = imp ? norm(window.__improvementIconSvg(imp.key, 18)) : null;
          }
          out.push({ tech: t.name, kind: item.kind, key: item.iconKey, source, elsewhere, resolved: elsewhere !== null });
        }
      }
      return out;
    }, WITH_REQ.map((t) => ({ name: t.name, slug: t.slug })));

    for (const r of identity) {
      const shown = (measured[r.tech].items || []).find((i) => i.iconKey === r.key);
      check('(B) „' + r.tech + '" / ' + r.kind + ' „' + r.key + '" — encja rozwiązana w danych gry (' + r.source + ')',
        r.resolved, r);
      check('(B) „' + r.tech + '" / ' + r.kind + ' „' + r.key + '" — ikona w tooltipie IDENTYCZNA z tą samą encją gdzie indziej w grze',
        !!shown && r.resolved && shown.svg === r.elsewhere, { tooltip: shown && shown.svg, elsewhere: r.elsewhere });
    }
    check('(B) porównanie objęło obie kategorie warunku (budynek + ulepszenie)',
      new Set(identity.map((r) => r.kind)).size === 2, identity.map((r) => r.kind));

    // --- (B2) tożsamość MIĘDZY POWIERZCHNIAMI: tooltip vs wiersz „Odblok." huba badań ------
    // Kryterium końca dispatchu wprost: „ta sama encja ma IDENTYCZNĄ ikonę w tooltipie
    // co w liście huba badań". Hub montowany prawdziwą `createScienceHubHud` karmioną
    // prawdziwą `techUnlockItems()` — tą samą, której używa produkcyjny snapshot.
    const crossSurface = await page.evaluate(() => {
      const norm = (svg) => (svg || '')
        .replace(/\swidth="[^"]*"/g, '').replace(/\sheight="[^"]*"/g, '')
        .replace(/\sclass="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
      const slugify = (name) => name.toLowerCase().normalize('NFD')
        .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const entries = window.__techData.technologie.map((t) => {
        const id = slugify(t.Technologia);
        const items = window.__techUnlockItems(id);
        return {
          id, name: t.Technologia, epoka: t.Epoka, koszt: t['Koszt nauki'] ?? 0,
          unlockItems: items.length > 0 ? items : undefined, locked: false, isTarget: false,
        };
      });
      const api = window.__createScienceHubHud({
        getProgress: () => null, getEntries: () => entries, onSelectTech: () => {},
        onOpenFullTree: () => {}, onShowInTree: () => {}, getPlan: () => [],
      });
      api.show();
      api.el.style.maxHeight = 'none';
      api.el.style.height = 'auto';
      const scroll = api.el.querySelector('.sh-scroll') || api.el.firstElementChild;
      if (scroll) { scroll.style.maxHeight = 'none'; scroll.style.overflow = 'visible'; }
      // Indeks: iconKey budynku/ulepszenia → SVG w wierszu „Odblok." huba.
      const hub = {};
      for (const s of Array.from(document.querySelectorAll('.sh-unlock-ic'))) {
        const k = s.getAttribute('data-unlock-kind') + '/' + s.getAttribute('data-unlock-icon-key');
        const svg = s.querySelector('svg');
        if (svg && !hub[k]) hub[k] = norm(svg.outerHTML);
      }
      return { hub, hubSlots: Object.keys(hub).length };
    });
    check('(B2) hub badań wyrenderował swoje ikony (jest z czym porównywać)',
      crossSurface.hubSlots > 5, crossSurface.hubSlots);
    let crossPairs = 0;
    for (const t of WITH_REQ) {
      for (const i of (measured[t.name].items || [])) {
        const k = i.kind + '/' + i.iconKey;
        const hubSvg = crossSurface.hub[k];
        if (hubSvg === undefined) continue;
        crossPairs++;
        check('(B2) „' + i.iconKey + '" — ikona w tooltipie drzewka IDENTYCZNA z ikoną w wierszu „Odblok." huba badań',
          i.svg === hubSvg, { tooltip: i.svg, hub: hubSvg });
      }
    }
    check('(B2) znaleziono encje występujące na OBU powierzchniach (porównanie nie było puste)',
      crossPairs > 0, crossPairs);

    // --- (C) brak regresji na całej tech.json --------------------------------------------
    const sweep = await page.evaluate(() => {
      const slugify = (name) => name.toLowerCase().normalize('NFD')
        .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const out = [];
      for (const t of window.__techData.technologie) {
        const slug = slugify(t.Technologia);
        const node = document.getElementById('snode-' + slug);
        if (!node) { out.push({ name: t.Technologia, node: false }); continue; }
        const r = node.getBoundingClientRect();
        node.dispatchEvent(new MouseEvent('mouseover', {
          bubbles: true, cancelable: true,
          clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2),
        }));
        const tip = document.querySelector('.civ-sci-tooltip');
        const heads = Array.from(tip.querySelectorAll('.tt-section'));
        const head = heads.find((h) => (h.textContent || '').indexOf('Warunek badania') > -1) || null;
        const ul = head ? head.nextElementSibling : null;
        const lis = ul ? Array.from(ul.querySelectorAll('li')) : [];
        out.push({
          name: t.Technologia, node: true, hasSection: !!head,
          secText: ul ? (ul.textContent || '').replace(/\s+/g, ' ').trim() : '',
          labels: lis.map((li) => {
            const lab = li.querySelector('.tt-req-label');
            return lab ? (lab.textContent || '').trim() : (li.textContent || '').trim();
          }),
          broken: lis.filter((li) => {
            const ic = li.querySelector('.tt-req-ic');
            if (!ic || !ic.querySelector('svg')) return true;
            const b = ic.getBoundingClientRect();
            return b.width <= 4 || b.height <= 4;
          }).length,
        });
      }
      return out;
    });
    const rendered = sweep.filter((s) => s.node);
    check('(C) każda technologia z tech.json ma węzeł w drzewku', rendered.length === sweep.length,
      sweep.filter((s) => !s.node).map((s) => s.name));
    check('(C) sprawdzono rozrzut technologii, nie tylko te z warunkiem', rendered.length > 25, rendered.length);
    const brokenRows = rendered.filter((s) => s.broken > 0);
    check('(C) żadna technologia nie ma złamanego/pustego slotu ikony w warunku badania',
      brokenRows.length === 0, brokenRows.slice(0, 4).map((s) => s.name));
    const emojiRows = rendered.filter((s) => s.hasSection && ANY_EMOJI.test(s.secText));
    check('(C) ŻADNA technologia nie pokazuje już surowego emoji w „Warunek badania:"',
      emojiRows.length === 0, emojiRows.slice(0, 4).map((s) => s.name));
    check('(C) zero wyjątków JS przy hoverze przez całe drzewko', pageErrors.length === 0, pageErrors.slice(0, 3));

    // --- (G) placeholdery i pusta sekcja --------------------------------------------------
    const withSection = rendered.filter((s) => s.hasSection);
    check('(G) sekcja „Warunek badania:" pojawia się DOKŁADNIE tam, gdzie tech.json ma warunek',
      withSection.length === WITH_REQ.length
      && withSection.every((s) => WITH_REQ.some((t) => t.name === s.name)),
      { zSekcja: withSection.map((s) => s.name), zTechJson: WITH_REQ.map((t) => t.name) });
    const placeholders = rendered.flatMap((s) => s.labels)
      .filter((t) => /(^|:\s*)[-—–‒―_.·•]+$/.test(t) || /(^|:\s*)(brak|n\/a|nie dotyczy)\.?$/i.test(t));
    check('(G) żadna pozycja warunku nie jest placeholderem („—", „brak") z ikoną marki obok',
      placeholders.length === 0, placeholders);
    check('(G) technologia bez warunku nie dostaje pustego nagłówka sekcji',
      rendered.some((s) => !s.hasSection && s.labels.length === 0));

    // --- (S) DANE SYNTETYCZNE: gałęzie, których dzisiejsza tech.json nie dotyka ------------
    // Na dzisiejszych danych asercja (G) jest PUSTA (żadne z dwóch pól nie ma placeholdera),
    // a pola wielowartościowego nie ma w ogóle — więc gałąź `isPlaceholderLabel()` i rozbicie
    // po przecinku nie były pokryte ŻADNYM żywym przypadkiem. Bramka, która pilnuje reguły
    // tylko dopóki dane jej nie łamią, nie pilnuje nic. Tutaj drzewko jest montowane
    // PRAWDZIWYM `showSciencePicker()` na PODMIENIONEJ `tech.json` (esbuild rozwiązuje import
    // danych na plik tymczasowy — kod produkcyjny bez jednej linijki zmiany), tooltip powstaje
    // z prawdziwego `mouseover`, a pomiar idzie z żywego DOM.
    const SYNTH_JSON = path.resolve(__dirname, '.science-picker-tooltip-icons-tech-synth.json');
    const SYNTH_OUT = path.resolve(__dirname, '.science-picker-tooltip-icons-bundle-synth.js');
    const SYNTH_CASES = {
      // same placeholdery w obu polach → sekcja NIE MOŻE się w ogóle pojawić
      'Garncarstwo': { 'wymagany budynek': '—', 'wymagane ulepszenie': 'brak' },
      // pole wielowartościowe → JEDNA POZYCJA NA CZŁON, każda z własną ikoną
      'Murarstwo': { 'wymagany budynek': 'Cegielnia, Koszary' },
      // mieszane: realny człon + placeholder w tym samym polu, druga gałąź wielowartościowa
      'Rolnictwo': { 'wymagany budynek': 'Biblioteka, —', 'wymagane ulepszenie': 'Tartak, Kamieniołom' },
    };
    const EXPECT_SYNTH = {
      'Garncarstwo': [],
      'Murarstwo': ['budynek: Cegielnia', 'budynek: Koszary'],
      'Rolnictwo': ['budynek: Biblioteka', 'ulepszenie: Tartak', 'ulepszenie: Kamieniołom'],
    };
    {
      const synth = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'tech.json'), 'utf8'));
      let patched = 0;
      for (const t of synth.technologie) {
        const c = SYNTH_CASES[t.Technologia];
        if (!c) continue;
        // Przypadek testowy ma sens tylko na technologii, która DZIŚ warunku nie ma —
        // inaczej nadpisalibyśmy realne dane i nie wiadomo, co bramka mierzy.
        check('(S) fixture: „' + t.Technologia + '" nie ma warunku w prawdziwej tech.json',
          expectedLabels(t['wymagany budynek']).length === 0
          && expectedLabels(t['wymagane ulepszenie']).length === 0,
          { bud: t['wymagany budynek'], ulep: t['wymagane ulepszenie'] });
        Object.assign(t, c);
        patched++;
      }
      check('(S) fixture: wszystkie przypadki syntetyczne wstrzyknięte', patched === Object.keys(SYNTH_CASES).length,
        { patched, oczekiwano: Object.keys(SYNTH_CASES).length });
      fs.writeFileSync(SYNTH_JSON, JSON.stringify(synth), 'utf8');

      await esbuild.build({
        entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
        target: 'es2020', outfile: SYNTH_OUT, absWorkingDir: GRA, loader: { '.ts': 'ts' },
        logLevel: 'silent',
        plugins: [{
          name: 'tech-json-synth',
          setup(build) {
            build.onResolve({ filter: /(^|[\\/])tech\.json$/ }, () => ({ path: SYNTH_JSON }));
          },
        }, viteCompatPlugin],
      });

      const sPage = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
      const sErrors = [];
      sPage.on('pageerror', (e) => sErrors.push(String(e)));
      sPage.on('console', (m) => { if (m.type() === 'error') sErrors.push(m.text()); });
      try {
        await sPage.setContent('<!DOCTYPE html><html><head><style>'
          + '*{margin:0;padding:0;box-sizing:border-box;}'
          + 'body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}'
          + '</style></head><body></body></html>');
        await sPage.addScriptTag({ content: fs.readFileSync(SYNTH_OUT, 'utf8') });
        const sBoot = await sPage.evaluate(() => {
          const slugify = (name) => name.toLowerCase().normalize('NFD')
            .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          const all = window.__techData.technologie.map((t) => slugify(t.Technologia));
          window.__configureSciencePicker({
            getResearchState: () => ({ pula: 0, targetId: null, kosztCelu: 0, postepFraction: 0, turnsLeft: 0 }),
            getResearchedTechs: () => [], getAvailableTechs: () => all,
            onSelectTarget: () => {}, getPlan: () => [],
          });
          window.__showSciencePicker(0);
          return { nodes: document.querySelectorAll('[data-tech-id]').length };
        });
        check('(S) drzewko na danych syntetycznych wyrenderowało węzły', sBoot.nodes > 25, sBoot);

        const synthMeasured = await sPage.evaluate((names) => {
          const norm = (svg) => (svg || '')
            .replace(/\swidth="[^"]*"/g, '').replace(/\sheight="[^"]*"/g, '')
            .replace(/\sclass="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
          const normHtml = (html) => {
            const d = document.createElement('div');
            d.innerHTML = html || '';
            const el = d.querySelector('svg');
            return norm(el ? el.outerHTML : '');
          };
          const slugify = (name) => name.toLowerCase().normalize('NFD')
            .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          const data = window.__loadGameData();
          const buildings = data.buildings || data.budynki || [];
          const out = {};
          for (const name of names) {
            const node = document.getElementById('snode-' + slugify(name));
            if (!node) { out[name] = { found: false }; continue; }
            const r = node.getBoundingClientRect();
            node.dispatchEvent(new MouseEvent('mouseover', {
              bubbles: true, cancelable: true,
              clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2),
            }));
            const tip = document.querySelector('.civ-sci-tooltip');
            const head = Array.from(tip.querySelectorAll('.tt-section'))
              .find((h) => (h.textContent || '').indexOf('Warunek badania') > -1) || null;
            const ul = head ? head.nextElementSibling : null;
            const lis = ul ? Array.from(ul.querySelectorAll('li')) : [];
            out[name] = {
              found: true, hasSection: !!head,
              secText: ul ? (ul.textContent || '').replace(/\s+/g, ' ').trim() : '',
              items: lis.map((li) => {
                const ic = li.querySelector('.tt-req-ic');
                const svg = ic ? ic.querySelector('svg') : null;
                const box = ic ? ic.getBoundingClientRect() : { width: 0, height: 0 };
                const lab = li.querySelector('.tt-req-label');
                const kind = ic ? ic.getAttribute('data-req-kind') : null;
                const key = ic ? ic.getAttribute('data-req-icon-key') : null;
                // Ta sama encja tam, gdzie gra rysuje ją dziś — dla KAŻDEGO członu z osobna.
                let elsewhere = null;
                if (kind === 'budynek') {
                  const def = buildings.find((b) => b && b.id === key);
                  elsewhere = def ? normHtml(window.__buildingIconSvg(def, def.id)) : null;
                } else if (kind === 'ulepszenie') {
                  const imp = window.__IMPROVEMENTS.find((i) => i.key === key);
                  elsewhere = imp ? normHtml(window.__improvementIconSvg(imp.key, 18)) : null;
                }
                return {
                  kind, iconKey: key, hasSvg: !!svg, svgCount: li.querySelectorAll('svg').length,
                  svg: norm(svg ? svg.outerHTML : ''), elsewhere,
                  w: Math.round(box.width), h: Math.round(box.height),
                  label: lab ? (lab.textContent || '').trim() : (li.textContent || '').trim(),
                };
              }),
            };
          }
          return out;
        }, Object.keys(SYNTH_CASES));

        for (const name of Object.keys(SYNTH_CASES)) {
          const r = synthMeasured[name];
          const exp = EXPECT_SYNTH[name];
          check('(S) „' + name + '" — węzeł znaleziony na danych syntetycznych', !!r && r.found, r);
          if (!r || !r.found) continue;
          check('(S) „' + name + '" — sekcja obecna DOKŁADNIE wtedy, gdy zostaje choć jedna realna pozycja',
            r.hasSection === (exp.length > 0), { hasSection: r.hasSection, oczekiwanePozycje: exp });
          check('(S) „' + name + '" — pozycje co do kolejności i treści zgodne z regułą produkcji',
            JSON.stringify(r.items.map((i) => i.label)) === JSON.stringify(exp),
            { widziane: r.items.map((i) => i.label), oczekiwane: exp });
          check('(S) „' + name + '" — żadna pozycja nie łączy dwóch encji w jednej etykiecie',
            r.items.every((i) => !/,/.test(i.label)), r.items.map((i) => i.label));
          check('(S) „' + name + '" — każda pozycja ma jedną, niezerową ikonę i ZERO emoji',
            r.items.every((i) => i.hasSvg && i.svgCount === 1 && i.w > 4 && i.h > 4)
            && !ANY_EMOJI.test(r.secText), { items: r.items, secText: r.secText });
          check('(S) „' + name + '" — ikona KAŻDEGO członu identyczna z tą samą encją gdzie indziej w grze',
            r.items.every((i) => i.elsewhere !== null && i.svg === i.elsewhere),
            r.items.map((i) => ({ key: i.iconKey, ok: i.svg === i.elsewhere, elsewhere: i.elsewhere })));
          check('(S) „' + name + '" — różne encje mają RÓŻNE ikony (nie jedna powtórzona)',
            new Set(r.items.map((i) => i.svg)).size === r.items.length,
            r.items.map((i) => i.iconKey));
        }
        // Kontrola negatywna zarzutu 2: kod sprzed poprawki dawał tu JEDNĄ pozycję
        // „budynek: Cegielnia, Koszary" z ikoną samej Cegielni. Gdyby wrócił, obie
        // asercje wyżej dla „Murarstwo" (liczba pozycji i brak przecinka) czerwienieją.
        const mur = synthMeasured['Murarstwo'];
        check('(S) kontrola negatywna: etykieta „Cegielnia, Koszary" z jedną ikoną NIE występuje',
          !!mur && mur.items.every((i) => i.label !== 'budynek: Cegielnia, Koszary'),
          mur && mur.items.map((i) => i.label));
        check('(S) zero wyjątków JS na danych syntetycznych', sErrors.length === 0, sErrors.slice(0, 3));

        // Dowód wizualny dla przypadków, których dzisiejsza tech.json nie zawiera:
        // gracz ma zobaczyć DWA wiersze z DWIEMA ikonami, a placeholder — nic.
        if (SHOT_DIR) {
          fs.mkdirSync(SHOT_DIR, { recursive: true });
          for (const name of Object.keys(SYNTH_CASES)) {
            await sPage.evaluate((n) => {
              const slugify = (x) => x.toLowerCase().normalize('NFD')
                .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
              const node = document.getElementById('snode-' + slugify(n));
              const r = node.getBoundingClientRect();
              node.dispatchEvent(new MouseEvent('mouseover', {
                bubbles: true, cancelable: true,
                clientX: Math.round(r.left + r.width / 2), clientY: Math.round(r.top + r.height / 2),
              }));
              const tip = document.querySelector('.civ-sci-tooltip');
              if (tip) { tip.style.left = '30px'; tip.style.top = '30px'; }
            }, name);
            await sPage.locator('.civ-sci-tooltip').screenshot({
              path: path.join(SHOT_DIR, '04-syntetyczne-' + name.toLowerCase() + '-PO.png'),
            });
          }
        }
      } finally {
        await sPage.close();
        for (const f of [SYNTH_JSON, SYNTH_OUT]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } }
      }
    }

    // --- zrzuty dowodowe ------------------------------------------------------------------
    if (SHOT_DIR) {
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      await page.evaluate(() => {
        const hub = document.querySelector('.civ-science-hub-hud');
        if (hub) hub.style.display = 'none';
      });
      for (const t of WITH_REQ) {
        await hoverAndMeasure(t.slug);
        // Tooltip jest `position:fixed` przy kursorze — na zrzut ustawiamy go stabilnie.
        await page.evaluate(() => {
          const tip = document.querySelector('.civ-sci-tooltip');
          if (tip) { tip.style.left = '30px'; tip.style.top = '30px'; }
        });
        await page.locator('.civ-sci-tooltip').screenshot({
          path: path.join(SHOT_DIR, '01-tooltip-' + t.slug + '-PO.png'),
        });
      }
      // Porównanie 1:1 — ta sama encja w tooltipie i tam, gdzie gra rysuje ją dziś.
      // Lewa kolumna porównania to SVG WYJĘTY Z ŻYWEGO TOOLTIPA (pomiar (A)), nie
      // ponowne wywołanie resolvera — inaczej obrazek dowodziłby tylko, że funkcja
      // zwraca to samo dwa razy, a nie że gracz to widzi.
      const liveTooltipSvg = {};
      for (const t of WITH_REQ) {
        for (const i of (measured[t.name].items || [])) liveTooltipSvg[t.slug + '|' + i.iconKey] = i.svg;
      }
      await page.evaluate(({ rows, live }) => {
        const data = window.__loadGameData();
        const buildings = data.buildings || data.budynki || [];
        const wrap = document.createElement('div');
        wrap.id = 'civ-cmp';
        wrap.style.cssText = 'position:fixed;left:40px;top:40px;width:700px;padding:14px;'
          + 'background:#101724;border:1px solid #6a5212;color:#e8d88a;font:13px system-ui;z-index:99999;';
        wrap.innerHTML = '<div style="font-weight:700;margin-bottom:8px">'
          + 'PORÓWNANIE: tooltip drzewka vs to samo miejsce w grze vs hub badań</div>';
        for (const t of rows) {
          for (const it of window.__techRequirementItems(t.slug)) {
            const item = it.item;
            let other = '';
            let where = '';
            if (item.kind === 'budynek') {
              const def = buildings.find((b) => b && b.id === item.iconKey);
              other = def ? window.__buildingIconSvg(def, def.id) : '';
              where = 'cityPanel (panel budowy miasta)';
            } else {
              const imp = window.__IMPROVEMENTS.find((i) => i.key === item.iconKey);
              other = imp ? window.__improvementIconSvg(imp.key, 18) : '';
              where = 'buildModeHud (panel budowy terenu)';
            }
            const hubSlot = document.querySelector(
              '.sh-unlock-ic[data-unlock-kind="' + item.kind + '"][data-unlock-icon-key="' + item.iconKey + '"]');
            const line = document.createElement('div');
            line.style.cssText = 'display:flex;align-items:center;gap:10px;margin:7px 0;';
            const cell = 'width:22px;height:22px;display:inline-flex';
            line.innerHTML = '<span style="' + cell + '">' + (live[t.slug + '|' + item.iconKey] || '') + '</span>'
              + '<span style="' + cell + '">' + other + '</span>'
              + '<span style="' + cell + '">' + (hubSlot ? hubSlot.innerHTML : '') + '</span>'
              + '<span style="color:#9fb8d8">' + t.name + ' → ' + item.kind + ' „' + item.label
              + '" · tooltip | ' + where + ' | hub badań</span>';
            wrap.appendChild(line);
          }
        }
        document.body.appendChild(wrap);
      }, { rows: WITH_REQ.map((t) => ({ name: t.name, slug: t.slug })), live: liveTooltipSvg });
      await page.locator('#civ-cmp').screenshot({
        path: path.join(SHOT_DIR, '02-porownanie-tooltip-vs-gra-vs-hub.png'),
      });
      await page.evaluate(() => { const n = document.getElementById('civ-cmp'); if (n) n.remove(); });
      console.log('[shots] ' + SHOT_DIR);
    }

    // --- (E) MUTACJA: cofnięcie poprawki musi zapalić (A) na czerwono ---------------------
    console.log('\n-- Mutacja (kontrola negatywna): odtworzenie renderu sprzed poprawki --');
    let mutCaught = 0;
    for (const t of WITH_REQ) {
      const r = await page.evaluate((s) => {
        const node = document.getElementById('snode-' + s.slug);
        const b = node.getBoundingClientRect();
        node.dispatchEvent(new MouseEvent('mouseover', {
          bubbles: true, cancelable: true,
          clientX: Math.round(b.left + b.width / 2), clientY: Math.round(b.top + b.height / 2),
        }));
        const tip = document.querySelector('.civ-sci-tooltip');
        const head = Array.from(tip.querySelectorAll('.tt-section'))
          .find((h) => (h.textContent || '').indexOf('Warunek badania') > -1);
        const ul = head ? head.nextElementSibling : null;
        if (!ul) return { mutated: false };
        // Dokładnie stary kod: płaski string z glifem kategorii, przez `textContent`.
        const parts = [];
        if (s.buds.length) parts.push('\u{1F3DB} budynek: ' + s.buds.join(', '));
        if (s.uleps.length) parts.push('\u{1F33E} ulepszenie: ' + s.uleps.join(', '));
        ul.innerHTML = parts.map(() => '<li></li>').join('');
        Array.from(ul.querySelectorAll('li')).forEach((li, i) => { li.textContent = parts[i]; });
        return {
          mutated: true,
          secText: (ul.textContent || '').replace(/\s+/g, ' ').trim(),
          svgCount: ul.querySelectorAll('svg').length,
        };
      }, t);
      const emojiBack = r.mutated && BANNED.some((g) => r.secText.includes(g));
      const iconsGone = r.mutated && r.svgCount === 0;
      if (emojiBack && iconsGone) mutCaught++;
      check('(E) mutacja „' + t.name + '" — asercja (A) faktycznie czerwienieje (emoji wraca, ikony znikają)',
        emojiBack && iconsGone, r);
    }
    check('(E) kontrola negatywna objęła wszystkie technologie z warunkiem badania',
      mutCaught === WITH_REQ.length, { mutCaught, wszystkich: WITH_REQ.length });

    if (SHOT_DIR) {
      await page.evaluate(() => {
        const tip = document.querySelector('.civ-sci-tooltip');
        if (tip) { tip.style.left = '30px'; tip.style.top = '30px'; }
      });
      await page.locator('.civ-sci-tooltip').screenshot({
        path: path.join(SHOT_DIR, '03-tooltip-MUTACJA-stan-przed-poprawka.png'),
      });
    }
  } finally {
    await browser.close();
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (e) { /* ignore */ } }
  }

  console.log('\nWynik: ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
