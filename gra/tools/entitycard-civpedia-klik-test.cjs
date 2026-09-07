'use strict';
/**
 * entitycard-civpedia-klik-test.cjs
 *
 * TEMAT: P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1.
 *
 * BUG: przycisk „Więcej informacji (Civpedia)" na kartach encji nie robił NIC.
 * `entityCards/renderer.ts` ustawiał `data-civpedia-folder`/`data-civpedia-slug`
 * i NIE dopinał żadnego `addEventListener`; jedyny delegowany listener karty łapie
 * `button[data-entity-kind]`, którego ten przycisk nie ma. `openEncyEntry`
 * (`wikiHubHud.ts`) miało ZERO wywołań z kodu kart. Głębiej: cztery z pięciu
 * adapterów zwracały `civpediaLink: null`, więc dla jednostek, technologii,
 * ulepszeń terenu i cudów przycisk w ogóle NIE POWSTAWAŁ w DOM.
 *
 * REGUŁA PRZECIW SAMOOSZUKIWANIU (dyspozycja, tryb pierwszy): defekt przeżył
 * migrację całej rodziny kart (T1–T10), bo istniejące bramki asertują, że
 * atrybuty `data-civpedia-*` SĄ USTAWIONE — i one były. Dlatego ta bramka
 * NIE sprawdza atrybutów jako dowodu. Buduje kartę, URUCHAMIA ją w jsdom na
 * bundlu esbuild z PRAWDZIWEGO `renderer.ts` + PRAWDZIWEGO `wikiHubHud.ts`,
 * wykonuje REALNY `click()` i mierzy:
 *   (a) czy szew `civpediaOpenGate` dostał wywołanie z parą (folder, slug) —
 *       przez SZPIEGA DELEGUJĄCEGO (nie stub: nagrywa argumenty i przepuszcza
 *       wywołanie do prawdziwego huba);
 *   (b) czy prawdziwy hub CivPedii faktycznie otworzył się na WŁAŚCIWYM haśle
 *       (tytuł w `.wh-dtitle` z realnego `wikiBundle.json`).
 * Sam (a) byłby tautologią wobec stubu, sam (b) nie przypinałby argumentów —
 * dopiero para jest dowodem.
 *
 * Tryb drugi (naprawa jednego rodzaju karty): każdy z czterech rodzajów
 * — budynek, jednostka, technologia, ulepszenie terenu — ma WŁASNY, osobny
 * zestaw asercji. Cuda (piąty rodzaj tej samej rodziny) dochodzą jako bonus.
 *
 * Kryterium 2 dyspozycji (brak hasła = czytelny komunikat, nie cisza ani wyjątek)
 * ma osobną sekcję: klik na encji bez hasła musi pokazać widoczny tekst w karcie,
 * NIE rzucić wyjątku i NIE ukryć przycisku.
 *
 * Wszystkie artefakty (entry/bundle/szpieg) lądują w UNIKALNYM katalogu
 * `fs.mkdtempSync` poza repo — R-PROC-AUTOBOT §6 („katalog tymczasowy bramki
 * musi być unikalny per przebieg", dwa udokumentowane fałszywe wyniki w tym repo).
 *
 * Usage (z gra/): node tools/entitycard-civpedia-klik-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[entitycard-civpedia-klik-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'entitycard-civpedia-klik-'));
const ENTRY = path.join(TMP, 'entry.ts');
const SPY = path.join(TMP, 'civpedia-open-gate-spy.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

/** `?raw` / `import.meta.glob` to składnia WYŁĄCZNIE Vite — esbuild ich nie zna.
 * Ten sam plugin co w `civpedia-wikihubhud-rys-historyczny-duplikacja-test.cjs`. */
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

/**
 * SZPIEG DELEGUJĄCY, nie stub. Podstawia się pod `entityCards/civpediaOpenGate`
 * dla WSZYSTKICH importerów (i `renderer.ts`, i `wikiHubHud.ts`), reeksportuje
 * prawdziwy moduł 1:1 i nakłada nagrywanie na `openCivpediaEntry`. Prawdziwy
 * `wikiHubHud` nadal rejestruje w nim swój opener i nadal jest wołany — czyli
 * mierzymy realną ścieżkę produkcyjną, a przy okazji widzimy argumenty.
 */
const REAL_GATE = path.join(SRC, 'ui', 'entityCards', 'civpediaOpenGate.ts');
fs.writeFileSync(SPY, [
  `import { setCivpediaEntryOpener, openCivpediaEntry as realOpen } from '${REAL_GATE.replace(/\\/g, '/')}';`,
  "export type { CivpediaOpenResult, CivpediaEntryOpener } from '" + REAL_GATE.replace(/\\/g, '/') + "';",
  'export { setCivpediaEntryOpener };',
  'export function openCivpediaEntry(folder: string, gameId: string) {',
  '  const g = globalThis as unknown as { __civpediaCalls?: Array<{ folder: string; gameId: string; result: string }> };',
  '  const result = realOpen(folder, gameId);',
  '  (g.__civpediaCalls ??= []).push({ folder, gameId, result });',
  '  return result;',
  '}',
  '',
].join('\n'), 'utf8');

const spyPlugin = {
  name: 'civpedia-gate-spy',
  setup(build) {
    build.onResolve({ filter: /civpediaOpenGate$/ }, (args) => {
      // Sam szpieg importuje prawdziwy moduł po ścieżce ABSOLUTNEJ z rozszerzeniem,
      // więc ten filtr go nie łapie i rekurencja nie powstaje.
      if (path.resolve(args.importer) === SPY) return null;
      return { path: SPY };
    });
  },
};

fs.writeFileSync(ENTRY, [
  `export { buildEntityCardData, renderEntityCard } from '${SRC}/ui/entityCards/renderer.ts';`,
  `export { createWikiHubHud, hasWikiEncyEntry, openWikiHubEncyEntry } from '${SRC}/ui/wikiHubHud.ts';`,
  `export { unitToSlug, technologyIdFromName } from '${SRC}/ui/entityCards/registry.ts';`,
  '',
].join('\n'), 'utf8');

/** Cztery rodzaje kart z dyspozycji, każdy osobno, na REALNYCH id z danych gry.
 * `expectTitle` to tytuł HASŁA w `wikiBundle.json` — celowo inny obiekt niż tytuł
 * karty, żeby asercja mierzyła co otworzył hub, a nie co narysowała karta. */
const KINDS = [
  { label: 'budynek',           kind: 'building',    id: 'biblioteka',    expectFolder: 'budynki',     expectTitle: 'Biblioteka' },
  { label: 'jednostka',         kind: 'unit',        id: null,            expectFolder: 'jednostki',   expectTitle: 'Włócznik', unitName: 'Włócznik' },
  { label: 'technologia',       kind: 'technology',  id: null,            expectFolder: 'technologie', expectTitle: 'Brązownictwo', techName: 'Brązownictwo' },
  { label: 'ulepszenie terenu', kind: 'improvement', id: 'farma',         expectFolder: 'ulepszenia',  expectTitle: 'Farma' },
  { label: 'cud (5. rodzaj)',   kind: 'wonder',      id: null,            expectFolder: 'cuda',        expectTitle: null, wonderFirst: true },
];

/** Encja BEZ hasła w CivPedii — ścieżka „czytelny komunikat" (kryterium 2). */
const NO_ENTRY_CASE = { kind: 'building', id: 'akwedukt', folder: 'budynki' };

function freshDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.MouseEvent = dom.window.MouseEvent;
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  return dom;
}

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE, absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json', '.png': 'dataurl', '.jpg': 'dataurl' },
    plugins: [viteCompatPlugin, spyPlugin], logLevel: 'silent',
  });

  freshDom();
  const api = require(BUNDLE);
  const { buildEntityCardData, renderEntityCard, createWikiHubHud, hasWikiEncyEntry,
    unitToSlug, technologyIdFromName } = api;

  // Realny hub CivPedii — dokładnie ten, który tworzy `main.ts`. Montuje własny
  // element w `document.body`, więc karty dostają WŁASNY host: czyszczenie
  // `document.body.innerHTML` między przypadkami skasowałoby panel huba i test
  // mierzyłby wtedy własną pomyłkę zamiast kodu.
  createWikiHubHud({});
  const cardHost = document.createElement('div');
  cardHost.id = 'card-host';
  document.body.appendChild(cardHost);

  // Uzupełnij id liczone slugifierami gry (nie wpisane z ręki — inaczej test
  // sprawdzałby moją literówkę, nie kod).
  const wonders = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'wonders.json'), 'utf8')).cuda;
  for (const c of KINDS) {
    if (c.unitName) c.id = unitToSlug(c.unitName);
    if (c.techName) c.id = technologyIdFromName(c.techName);
    if (c.wonderFirst) { c.id = wonders[0].id; c.expectTitle = null; }
  }

  console.log('--- 1. Klik faktycznie woła handler z poprawnym folder/slug (per rodzaj) ---');
  for (const c of KINDS) {
    const data = buildEntityCardData(c.kind, c.id, {});
    check(`[${c.label}] fixture: encja ${c.kind}/${c.id} istnieje w danych gry`, data != null, c);
    if (data == null) continue;

    check(`[${c.label}] karta ma civpediaLink (do tego tematu było null dla 4 z 5 rodzajów)`,
      data.civpediaLink != null, data.civpediaLink);
    check(`[${c.label}] civpediaLink.folder === "${c.expectFolder}"`,
      data.civpediaLink && data.civpediaLink.folder === c.expectFolder, data.civpediaLink);
    check(`[${c.label}] civpediaLink.slug === kanoniczne id karty (zero rozjazdu link↔karta)`,
      data.civpediaLink && data.civpediaLink.slug === data.id,
      { slug: data.civpediaLink && data.civpediaLink.slug, id: data.id });

    // --- URUCHOMIENIE karty i REALNY klik ---
    cardHost.innerHTML = '';
    const card = renderEntityCard(data);
    cardHost.appendChild(card);
    const btn = card.querySelector('.entity-card-civpedia-link');
    check(`[${c.label}] przycisk „Więcej informacji (Civpedia)" ISTNIEJE w zbudowanej karcie`,
      btn != null);
    if (btn == null) continue;

    globalThis.__civpediaCalls = [];
    let threw = null;
    try { btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }
    catch (e) { threw = String(e); }
    check(`[${c.label}] klik nie rzuca wyjątku`, threw === null, threw);

    const calls = globalThis.__civpediaCalls;
    check(`[${c.label}] KLIK FAKTYCZNIE WOŁA HANDLER (dokładnie 1 wywołanie, nie 0 i nie 2)`,
      calls.length === 1, calls);
    if (calls.length !== 1) continue;
    check(`[${c.label}] handler dostał folder="${c.expectFolder}"`,
      calls[0].folder === c.expectFolder, calls[0]);
    check(`[${c.label}] handler dostał slug === id karty ("${data.id}")`,
      calls[0].gameId === data.id, calls[0]);
    check(`[${c.label}] handler zwrócił "opened" (hasło znalezione, nie cisza)`,
      calls[0].result === 'opened', calls[0]);

    // --- efekt w PRAWDZIWYM hubie, nie w szpiegu ---
    const dtitle = document.querySelector('.wh-dtitle');
    check(`[${c.label}] prawdziwy hub CivPedii otworzył widok hasła (.wh-dtitle)`,
      dtitle != null && dtitle.textContent.trim().length > 0,
      dtitle && dtitle.textContent);
    if (c.expectTitle != null) {
      check(`[${c.label}] hub pokazuje WŁAŚCIWE hasło: „${c.expectTitle}"`,
        dtitle != null && dtitle.textContent.trim() === c.expectTitle,
        dtitle && dtitle.textContent);
    }
  }

  console.log('--- 2. Brak hasła = CZYTELNY KOMUNIKAT, nie cisza i nie wyjątek ---');
  {
    const c = NO_ENTRY_CASE;
    check(`fixture: "${c.id}" faktycznie NIE ma hasła w folderze "${c.folder}"`,
      hasWikiEncyEntry(c.folder, c.id) === false);
    const data = buildEntityCardData(c.kind, c.id, {});
    check(`fixture: encja ${c.kind}/${c.id} istnieje w danych gry`, data != null);
    if (data != null) {
      cardHost.innerHTML = '';
      const card = renderEntityCard(data);
      cardHost.appendChild(card);
      const btn = card.querySelector('.entity-card-civpedia-link');
      check('brak hasła: przycisk NADAL istnieje (zakaz ukrywania — ECHO właściciela)', btn != null);
      const noteBefore = card.querySelector('.entity-card-civpedia-note');
      check('brak hasła: przed klikiem komunikatu NIE widać', noteBefore != null && noteBefore.hidden === true);
      globalThis.__civpediaCalls = [];
      let threw = null;
      try { btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); }
      catch (e) { threw = String(e); }
      check('brak hasła: klik NIE rzuca wyjątku', threw === null, threw);
      const calls = globalThis.__civpediaCalls;
      check('brak hasła: handler i tak został zawołany (to nie martwy przycisk)', calls.length === 1, calls);
      check('brak hasła: handler zwrócił "no-entry"', calls.length === 1 && calls[0].result === 'no-entry', calls);
      const note = card.querySelector('.entity-card-civpedia-note');
      check('brak hasła: komunikat jest WIDOCZNY po kliku (nie cisza)',
        note != null && note.hidden === false, note && { hidden: note.hidden });
      check('brak hasła: komunikat jest CZYTELNY — nazywa encję i mówi, że hasła jeszcze nie ma',
        note != null && note.textContent.includes(data.title) && /nie ma jeszcze hasła/i.test(note.textContent),
        note && note.textContent);
      const dtitle = document.querySelector('.wh-dtitle');
      check('brak hasła: hub NIE otworzył przypadkowego, cudzego hasła',
        dtitle == null || dtitle.textContent.trim() !== data.title, dtitle && dtitle.textContent);
    }
  }

  console.log('--- 3. Pokrycie: ile encji gry ma osiągalne hasło (regresja mostka slug↔id) ---');
  {
    const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
    const unitHits = units.filter((u) => u.Jednostka).filter((u) => hasWikiEncyEntry('jednostki', unitToSlug(u.Jednostka))).length;
    // Folder `jednostki` ma 49 haseł; przy samym `slug === id` osiągalnych było 13.
    // Ta asercja pilnuje, żeby tolerancyjne dopasowanie nie zniknęło po cichu.
    check(`jednostki: osiągalnych haseł ${unitHits} (przed naprawą: 13; próg regresji: >= 45)`,
      unitHits >= 45, unitHits);
    const improvements = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'));
    const impHits = Object.keys(improvements).filter((k) => k !== '_meta')
      .filter((k) => hasWikiEncyEntry('ulepszenia', k)).length;
    check(`ulepszenia: mostek gameIds nadal działa (kopalnia_* → hasło "kopalnia"), trafień ${impHits} (próg >= 20)`,
      impHits >= 20, impHits);
  }

  console.log('');
  console.log(`WYNIK: ${pass} PASS / ${fail} FAIL`);
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* sprzątanie best-effort */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
