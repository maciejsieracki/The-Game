'use strict';
/**
 * diplomacy-tech-chip-filter-and-multi-deal-test.cjs — dwa sąsiadujące bugi UI dyplomacji,
 * jeden plik testowy z dwiema sekcjami (wzorem `diplomacy-tech-trade-test.cjs`).
 *
 * CZĘŚĆ A — P-HANDEL-TECH-CHIP-BEZ-FILTRU-JUZ-DODANE (2026-08-13): kreator oferty handlowej
 * (`buildAddForm`, ui/diplomacyTradeBasket.ts) pokazywał WSZYSTKIE dostępne technologie jako
 * chipy, nawet te już dodane do bieżącego koszyka po tej samej stronie. Naprawa: nowy
 * parametr `existingItems` filtruje chipy technologii już obecnych w koszyku, Z WYJĄTKIEM
 * edytowanej pozycji (musi zostać widoczna i zaznaczona).
 *
 * CZĘŚĆ B — R-DYPLO-UMOWA-SUROWCOW-WIELOKROTNA (2026-08-13): „Umowa wymiany surowców"
 * (UI-owy actionId '14') dawała się dodać do stołu negocjacji tylko RAZ — kolumna „Możliwe
 * umowy" blokowała przycisk kłódką po pierwszym dodaniu, niezależnie od typu akcji. Naprawa
 * na TRZECH warstwach, każda z osobną asercją mutacyjną tutaj:
 *   1. `uiActionAllowsMultipleOwnOnTable` (game/diplomacy-audience-actions.ts) — gating
 *      przycisku w kolumnie „Możliwe umowy" (`dealsColumnHtml`, diplomacyAudience.ts).
 *   2. TA SAMA funkcja — handler kliknięcia (`blockDuplicateNegotiationClick`,
 *      diplomacyAudience.ts) musi się zgadzać z (1), inaczej przycisk wygląda klikalny, ale
 *      klik nic nie robi.
 *   3. `allowsMultipleOwnOutgoingNegotiations` (game/diplomacy-proposals.ts) — silnikowa
 *      bramka w `main.ts::handleNegotiatedProposal`, która wcześniej pokazywała komunikat
 *      „Ta umowa jest już na stole" i odrzucała NOWĄ propozycję zamiast dołożyć ją jako
 *      osobny wpis stołu. `main.ts` nie ma eksportów (czysty skrypt imperatywny) — nie da się
 *      go tu zbundlować i przetestować bezpośrednio (to samo ograniczenie dotyczy istniejącej
 *      infrastruktury testowej w tym repo — żaden inny plik w tools/ nie bundluje main.ts).
 *      Warstwa (3) jest więc przetestowana przez DOKŁADNIE tę samą, wyeksportowaną, czystą
 *      funkcję, którą main.ts faktycznie woła w miejscu bramki (zweryfikowane czytaniem
 *      main.ts) — złożoną z `findOwnOutgoingNegotiation` (niezmieniona, silnikowa) tak samo
 *      jak w main.ts, żeby asercja odzwierciedlała realną decyzję bramki, nie tylko samą
 *      funkcję w oderwaniu.
 *
 * CZĘŚĆ C — Runda 2 (Evaluator, 2026-08-13): CZĘŚĆ B wyżej sprawdza WYŁĄCZNIE że
 * `uiActionAllowsMultipleOwnOnTable`/`allowsMultipleOwnOutgoingNegotiations` ZWRACAJĄ poprawną
 * wartość w oderwaniu — nie że `dealsColumnHtml` (diplomacyAudience.ts) faktycznie z nich
 * KORZYSTA przy renderze. Zweryfikowane mutacyjnie przez Evaluatora: cofnięcie
 * `onTableBlocks`→`onTable` w `dealsColumnHtml` (predykaty NIETKNIĘTE) przeszło przez WSZYSTKIE
 * 41 testów `diplomacy-*.cjs` bez ani jednej czerwonej asercji — luka w pokryciu. CZĘŚĆ C
 * renderuje PRAWDZIWY `dealsColumnHtml` (wyeksportowany wyłącznie do tego testu — patrz
 * komentarz nad definicją w diplomacyAudience.ts) ze stanem „Umowa wymiany surowców (id 14)
 * już na stole" i asertuje na PRAWDZIWYM HTML-u: kafelek '14' NIE ma `disabled` (naprawa
 * działa) + kontrola negatywna, inny typ (id '2', Pokój — NIE dopuszcza wielokrotności) NADAL
 * ma `disabled` (bez regresji dla wszystkich pozostałych typów).
 *
 * Usage (z gra/): node tools/diplomacy-tech-chip-filter-and-multi-deal-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

async function main() {
  console.log('diplomacy-tech-chip-filter-and-multi-deal-test');

  // =========================================================================
  // CZĘŚĆ A — P-HANDEL-TECH-CHIP-BEZ-FILTRU-JUZ-DODANE (buildAddForm)
  // =========================================================================
  {
    console.log('CZĘŚĆ A — buildAddForm: chip technologii znika po dodaniu do koszyka');

    let JSDOM;
    try { ({ JSDOM } = require('jsdom')); }
    catch (e) {
      console.error('jsdom missing — npm i -D jsdom');
      process.exit(1);
    }

    const STUB_DIR = path.resolve(__dirname, '.stubs');
    const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'leaderPortraits-tech-chip-filter-stub.ts');
    const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'brandAssets-tech-chip-filter-stub.ts');
    fs.mkdirSync(STUB_DIR, { recursive: true });
    fs.writeFileSync(
      LEADER_PORTRAITS_STUB,
      [
        "export function leaderPortraitUrl() { return null; }",
        "export function leaderName() { return null; }",
        "export function leaderNameFromPool() { return null; }",
        "export function civDisplayNameFromKey() { return null; }",
        "export function civCardDisplayName(label) { return label; }",
        "export function civIconIdFromCivLabel() { return null; }",
      ].join('\n'),
      'utf8',
    );
    fs.writeFileSync(
      BRAND_ASSETS_STUB,
      [
        "export function brandIconSvg() { return ''; }",
        "export function improvementIconSvg() { return ''; }",
        "export function mapResourceIconSvg() { return ''; }",
        "export function terrainIconSvg() { return ''; }",
        "export function buildingIconSvg() { return ''; }",
        "export function unitIconSvg() { return ''; }",
        "export function civIconSvg() { return ''; }",
        "export function epochIconSvg() { return ''; }",
        "export function settingIconSvg() { return ''; }",
        "export function brandMenuComponentsCss() { return ''; }",
        "export function menuIconSvg() { return ''; }",
        "export function brandMenuEmblemSvg() { return ''; }",
        "export function newGameIntroEmblemSvg() { return ''; }",
        "export function brandMotionCss() { return ''; }",
        "export function brandMenuBackgroundCss() { return ''; }",
        "export function svgThumbHtml() { return ''; }",
      ].join('\n'),
      'utf8',
    );

    const BUNDLE = path.resolve(__dirname, '.dip-tech-chip-filter-bundle.cjs');
    const entryFile = path.resolve(__dirname, '.dip-tech-chip-filter-entry.ts');
    fs.writeFileSync(entryFile, `
export { buildAddForm } from '../src/ui/diplomacyTradeBasket.ts';
`);

    const stubViteAssetsPlugin = {
      name: 'stub-vite-assets',
      setup(build) {
        build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB }));
        build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
      },
    };

    await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: BUNDLE,
      absWorkingDir: path.resolve(__dirname, '..'),
      logLevel: 'silent',
      loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
      plugins: [stubViteAssetsPlugin],
    });

    const { buildAddForm } = require(BUNDLE);

    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;

    function baseCtx(over) {
      return Object.assign({ civName: 'Test', relacjaTotal: 200, progHandelRelacja: 100 }, over || {});
    }
    function mount(html) {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div;
    }
    const TECH_OPTS = [
      { id: 'Obróbka drewna', label: 'Obróbka drewna', suggestedPrice: 50 },
      { id: 'Garncarstwo', label: 'Garncarstwo', suggestedPrice: 40 },
    ];

    // 1) Koszyk PUSTY (existingItems=[]) → obie technologie widoczne jako chipy.
    {
      const html = buildAddForm('give', baseCtx({ giveTechOptions: TECH_OPTS }), 'trade', '14', undefined, undefined, []);
      const box = mount(html);
      ok(box.querySelector('.cdb-chip-tech[data-value="Obróbka drewna"]') !== null,
        'koszyk pusty: chip "Obróbka drewna" widoczny');
      ok(box.querySelector('.cdb-chip-tech[data-value="Garncarstwo"]') !== null,
        'koszyk pusty: chip "Garncarstwo" widoczny');
    }

    // 2) „Obróbka drewna" już w koszyku (existingItems) → jej chip ZNIKA, "Garncarstwo" zostaje.
    {
      const existingItems = [{ typ: 'tech', id: 'Obróbka drewna' }];
      const html = buildAddForm('give', baseCtx({ giveTechOptions: TECH_OPTS }), 'trade', '14', undefined, undefined, existingItems);
      const box = mount(html);
      ok(box.querySelector('.cdb-chip-tech[data-value="Obróbka drewna"]') === null,
        'technologia już w koszyku: jej chip ZNIKA z listy do wyboru (P-HANDEL-TECH-CHIP-BEZ-FILTRU-JUZ-DODANE)');
      ok(box.querySelector('.cdb-chip-tech[data-value="Garncarstwo"]') !== null,
        'inna technologia (nie w koszyku): chip zostaje widoczny');
    }

    // 3) Pozycje po stronie 'receive' NIE wpływają na filtr strony 'give' (niezależne tablice).
    {
      const existingItems = [{ typ: 'tech', id: 'Obróbka drewna' }];
      const html = buildAddForm('receive', baseCtx({ receiveTechOptions: TECH_OPTS }), 'trade', '14', undefined, undefined, existingItems);
      const box = mount(html);
      ok(box.querySelector('.cdb-chip-tech[data-value="Obróbka drewna"]') === null,
        'strona receive: filtr działa niezależnie na PRZEKAZANEJ tablicy existingItems (tu też ukryta)');
    }

    // 4) Tylko pozycje typu 'tech' filtrują — inny typ o tym samym `id` (nierealne w praktyce,
    //    ale potwierdza że filtr patrzy na `typ`, nie tylko `id`) NIE chowa chipa.
    {
      const existingItems = [{ typ: 'zloto', id: 'Obróbka drewna' }];
      const html = buildAddForm('give', baseCtx({ giveTechOptions: TECH_OPTS }), 'trade', '14', undefined, undefined, existingItems);
      const box = mount(html);
      ok(box.querySelector('.cdb-chip-tech[data-value="Obróbka drewna"]') !== null,
        'pozycja o innym `typ` (nie "tech") z tym samym id NIE filtruje chipa technologii');
    }

    // 5) EDYCJA: „Garncarstwo" edytowana (editItem), „Obróbka drewna" już w koszyku (inna
    //    pozycja, NIE edytowana) → „Obróbka drewna" ukryta, „Garncarstwo" WIDOCZNA i ZAZNACZONA
    //    (edycja własnej pozycji nie chowa jej samej — wymóg ze zgłoszenia).
    {
      const existingItems = [
        { typ: 'tech', id: 'Obróbka drewna' },
        { typ: 'tech', id: 'Garncarstwo' },
      ];
      const editItem = { item: { typ: 'tech', id: 'Garncarstwo' }, idx: 1 };
      const html = buildAddForm('give', baseCtx({ giveTechOptions: TECH_OPTS }), 'trade', '14', undefined, editItem, existingItems);
      const box = mount(html);
      ok(box.querySelector('.cdb-chip-tech[data-value="Obróbka drewna"]') === null,
        'edycja "Garncarstwo": chip "Obróbka drewna" (INNA, już istniejąca pozycja) nadal ukryty');
      const editedChip = box.querySelector('.cdb-chip-tech[data-value="Garncarstwo"]');
      ok(editedChip !== null, 'edycja "Garncarstwo": jej WŁASNY chip pozostaje widoczny (nie chowa sam siebie)');
      ok(editedChip !== null && editedChip.classList.contains('selected'),
        'edycja "Garncarstwo": jej chip jest ZAZNACZONY (defaultTech === edytowana pozycja)');
    }

    // 6) MUTACJA: bez `existingItems` (parametr pominięty, wartość domyślna []) — chip
    //    "Obróbka drewna" NIE MOŻE zniknąć tylko dlatego, że jest w opcjach — potwierdza że
    //    filtr faktycznie zależy od argumentu, nie od czegoś przypadkowego.
    {
      const html = buildAddForm('give', baseCtx({ giveTechOptions: TECH_OPTS }), 'trade', '14');
      const box = mount(html);
      ok(box.querySelector('.cdb-chip-tech[data-value="Obróbka drewna"]') !== null,
        'bez existingItems (domyślne []): żadna technologia nie jest filtrowana — dowód, że filtr czyta argument, nie coś innego');
    }

    for (const f of [entryFile, BUNDLE, LEADER_PORTRAITS_STUB, BRAND_ASSETS_STUB]) {
      try { fs.unlinkSync(f); } catch (_) { /* ok */ }
    }
  }

  // =========================================================================
  // CZĘŚĆ B — R-DYPLO-UMOWA-SUROWCOW-WIELOKROTNA (3 warstwy: UI-lock, klik, silnik)
  // =========================================================================
  {
    console.log('CZĘŚĆ B — "Umowa wymiany surowców" (id 14 / actionId "handel") wielokrotnie na stole');

    const BUNDLE = path.resolve(__dirname, '.dip-multi-deal-bundle.cjs');
    const entryFile = path.resolve(__dirname, '.dip-multi-deal-entry.ts');
    fs.writeFileSync(entryFile, `
export { uiActionAllowsMultipleOwnOnTable } from '../src/game/diplomacy-audience-actions.ts';
export {
  allowsMultipleOwnOutgoingNegotiations, findOwnOutgoingNegotiation, createNegotiation,
} from '../src/game/diplomacy-proposals.ts';
`);
    esbuild.buildSync({
      entryPoints: [entryFile],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: path.resolve(__dirname, '..'),
      logLevel: 'silent',
    });
    const {
      uiActionAllowsMultipleOwnOnTable, allowsMultipleOwnOutgoingNegotiations,
      findOwnOutgoingNegotiation, createNegotiation,
    } = require(BUNDLE);

    // --- Warstwa 1+2: UI (dealsColumnHtml gating) i handler kliknięcia
    // (blockDuplicateNegotiationClick) w diplomacyAudience.ts współdzielą TĘ SAMĄ funkcję —
    // testujemy ją raz, obie warstwy z niej korzystają (zweryfikowane czytaniem kodu: oba
    // wywołania to `uiActionAllowsMultipleOwnOnTable(a.id)` / `uiActionAllowsMultipleOwnOnTable(aid)`).
    ok(uiActionAllowsMultipleOwnOnTable('14') === true,
      'uiActionAllowsMultipleOwnOnTable("14"): TAK — Umowa wymiany surowców dopuszcza wiele wpisów własnych na stole');
    for (const otherId of ['2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '13', '15']) {
      ok(uiActionAllowsMultipleOwnOnTable(otherId) === false,
        `uiActionAllowsMultipleOwnOnTable("${otherId}"): NIE — pozostałe typy nadal blokowane przez onTable (zamierzone ograniczenie zgłoszenia)`);
    }

    // --- Warstwa 3: silnikowa bramka main.ts::handleNegotiatedProposal.
    // main.ts nie eksportuje niczego (czysty skrypt) — replikujemy DOKŁADNIE tę samą
    // kompozycję, którą main.ts faktycznie woła w miejscu bramki (czytanie kodu potwierdza:
    // `if (!allowsMultipleOwnOutgoingNegotiations(proposal.actionId) && findOwnOutgoingNegotiation(...))`),
    // złożoną z dwóch REALNIE wyeksportowanych, niezmienionych/nowych funkcji silnika.
    function engineWouldBlockNewOwnProposal(table, ownerId, actionId) {
      return !allowsMultipleOwnOutgoingNegotiations(actionId) && findOwnOutgoingNegotiation(table, ownerId, actionId) != null;
    }

    ok(allowsMultipleOwnOutgoingNegotiations('handel') === true,
      'allowsMultipleOwnOutgoingNegotiations("handel"): TAK — engine-actionId UI "14"/"13"');
    for (const otherActionId of ['nap', 'granice', 'umowa_szlakow', 'tech', 'wasal', 'ultimatum']) {
      ok(allowsMultipleOwnOutgoingNegotiations(otherActionId) === false,
        `allowsMultipleOwnOutgoingNegotiations("${otherActionId}"): NIE — pozostałe typy nietknięte`);
    }

    {
      const table = [];
      const handelProposal = { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 2, payload: {} };
      table.push(createNegotiation(handelProposal, 10, 'player', 1));
      ok(findOwnOutgoingNegotiation(table, 2, 'handel') != null,
        'stan wyjściowy: nasza "handel" propozycja jest wykrywana na stole (query silnika niezmieniona)');
      ok(engineWouldBlockNewOwnProposal(table, 2, 'handel') === false,
        'silnik: DRUGA "Umowa wymiany surowców" do TEGO SAMEGO partnera NIE jest blokowana — dołącza jako osobny wpis');

      const napProposal = { actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 2, payload: {} };
      table.push(createNegotiation(napProposal, 10, 'player', 2));
      ok(engineWouldBlockNewOwnProposal(table, 2, 'nap') === true,
        'silnik: kontrola negatywna — druga "nap" (Pakt nieagresji) do TEGO SAMEGO partnera nadal BLOKOWANA (zamierzone ograniczenie zgłoszenia)');
    }

    for (const f of [entryFile, BUNDLE]) {
      try { fs.unlinkSync(f); } catch (_) { /* ok */ }
    }
  }

  // =========================================================================
  // CZĘŚĆ C — Runda 2: warstwa WIĄZANIA — `dealsColumnHtml` faktycznie CZYTA
  // `onTableBlocks`/`uiActionAllowsMultipleOwnOnTable`, nie tylko że te predykaty są poprawne
  // w oderwaniu (patrz komentarz nagłówkowy pliku).
  // =========================================================================
  {
    console.log('CZĘŚĆ C — dealsColumnHtml: kafelek "14" na stole NIE jest disabled (warstwa wiązania)');

    const STUB_DIR = path.resolve(__dirname, '.stubs');
    fs.mkdirSync(STUB_DIR, { recursive: true });
    /** Moduły UI-owe BEZ związku z `dealsColumnHtml` (muzyka, koszyk, modal negocjacji,
     *  portrety, ikony brandowe) — zaślepione, żeby bundlować WYŁĄCZNIE realny kod
     *  dyplomacji (`diplomacy-audience-actions.ts`, `diplomacy-proposals.ts`, ...), bez
     *  wciągania plików audio (`import.meta.glob`, znany pre-istniejący limit bundlera —
     *  patrz CLAUDE.md) ani `?raw` importów SVG/CSS. */
    const stubs = {
      music: path.resolve(STUB_DIR, 'deals-col-music-stub.ts'),
      diploUiSkin: path.resolve(STUB_DIR, 'deals-col-diplouiskin-stub.ts'),
      negotiationModal: path.resolve(STUB_DIR, 'deals-col-negotiationmodal-stub.ts'),
      tradeBasket: path.resolve(STUB_DIR, 'deals-col-tradebasket-stub.ts'),
      leaderPortraits: path.resolve(STUB_DIR, 'deals-col-leaderportraits-stub.ts'),
      civBrandDisplay: path.resolve(STUB_DIR, 'deals-col-civbranddisplay-stub.ts'),
      brandAssets: path.resolve(STUB_DIR, 'deals-col-brandassets-stub.ts'),
    };
    fs.writeFileSync(stubs.music, [
      "export function startDiplomacyMusic() {}",
      "export function stopDiplomacyMusic() {}",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.diploUiSkin, [
      "export function civLeaderMedallionHtmlById() { return ''; }",
      "export function dipBrandIconHtml() { return ''; }",
      "export function dipCapitalLocateBtnHtml() { return ''; }",
      "export const DIPLO_1E_SHARED_CSS = '';",
      "export function ensureDiploBrandScope() {}",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.negotiationModal, [
      "export function actionNeedsNegotiation() { return false; }",
      "export function showNegotiationModal() {}",
      "export function proposalActionIdFromPayload() { return undefined; }",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.tradeBasket, [
      "export function actionUsesTradeBasket() { return false; }",
      "export function getTradeBasketMode() { return 'trade'; }",
      "export function showTradeBasketModal() {}",
      "export function hideTradeBasketModal() {}",
      "export function openQuickDealBasket() {}",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.leaderPortraits, [
      "export function civCardDisplayName(label) { return label; }",
      "export function leaderName() { return null; }",
    ].join('\n'), 'utf8');
    fs.writeFileSync(stubs.civBrandDisplay, "export function civBrandLineForKey() { return ''; }\n", 'utf8');
    fs.writeFileSync(stubs.brandAssets, [
      "export function brandIconSvg() { return ''; }",
      "export function mapResourceIconSvg() { return ''; }",
    ].join('\n'), 'utf8');

    const ENTRY = path.resolve(__dirname, '.dip-deals-col-entry.ts');
    const BUNDLE = path.resolve(__dirname, '.dip-deals-col-bundle.cjs');
    fs.writeFileSync(ENTRY, `export { dealsColumnHtml } from '../src/ui/diplomacyAudience.ts';\n`, 'utf8');

    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: path.resolve(__dirname, '..'),
      logLevel: 'silent',
      loader: { '.json': 'json' },
      plugins: [{
        name: 'stub-vite-assets-deals-col',
        setup(build) {
          build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubs.music }));
          build.onResolve({ filter: /diploUiSkin$/ }, () => ({ path: stubs.diploUiSkin }));
          build.onResolve({ filter: /diplomacyNegotiationModal$/ }, () => ({ path: stubs.negotiationModal }));
          build.onResolve({ filter: /diplomacyTradeBasket$/ }, () => ({ path: stubs.tradeBasket }));
          build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: stubs.leaderPortraits }));
          build.onResolve({ filter: /civBrandDisplay$/ }, () => ({ path: stubs.civBrandDisplay }));
          build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: stubs.brandAssets }));
        },
      }],
    });

    const { dealsColumnHtml } = require(BUNDLE);

    /** Stan: „Umowa wymiany surowców" (id '14', dopuszcza wielokrotność) I „Pokój" (id '2',
     *  NIE dopuszcza wielokrotności — kontrola negatywna) już leżą na stole gracza. */
    function stateWithBothOnTable() {
      return {
        playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Rozmówca', otherCivName: 'Grecja',
        zaufanie: 50, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
        actions: [
          { id: '14', label: 'Umowa wymiany surowców', enabled: true },
          { id: '2', label: 'Pokój', enabled: true },
        ],
        pendingNegotiations: [
          { id: 'n14', direction: 'own', uiActionId: '14', actionLabel: 'Umowa wymiany surowców',
            summary: 'x', round: 1, maxRounds: 3, expiresInTurns: 5, canCounter: true },
          { id: 'n2', direction: 'own', uiActionId: '2', actionLabel: 'Pokój',
            summary: 'y', round: 1, maxRounds: 3, expiresInTurns: 5, canCounter: true },
        ],
      };
    }

    function tileHtml(html, aid) {
      const re = new RegExp('<button[^>]*data-aid="' + aid + '"[^>]*>');
      const m = re.exec(html);
      return m ? m[0] : null;
    }
    /** Zwraca listę klas z `class="..."` kafelka — porównanie po TOKENACH, nie substringiem
     *  (regex `\bon-table\b` łapałby też "on-table-ok" — myślnik jest znakiem niesłownym,
     *  więc granica słowa wypada tuż po "table"). */
    function tileClasses(tileHtmlStr) {
      const m = /class="([^"]*)"/.exec(tileHtmlStr || '');
      return m ? m[1].split(/\s+/) : [];
    }

    {
      const html = dealsColumnHtml(stateWithBothOnTable());
      const tile14 = tileHtml(html, '14');
      const tile2 = tileHtml(html, '2');
      ok(tile14 !== null, 'kafelek "14" (Umowa wymiany surowców) obecny w wygenerowanym HTML');
      ok(tile2 !== null, 'kafelek "2" (Pokój) obecny w wygenerowanym HTML');
      ok(tile14 !== null && !/\bdisabled\b/.test(tile14),
        'kafelek "14" na stole (uiActionAllowsMultipleOwnOnTable=true): BRAK atrybutu disabled — kliknięcie faktycznie dodaje kolejną umowę (naprawa Rundy 2)');
      const cls14 = tileClasses(tile14);
      ok(!cls14.includes('on-table') && !cls14.includes('locked'),
        'kafelek "14" na stole: BEZ klasy "on-table"/"locked" (klasy: ' + cls14.join(' ') + ') — nie wygląda wizualnie na zablokowany (Runda 2, naprawa UX)');
      ok(tile2 !== null && /\bdisabled\b/.test(tile2),
        'kontrola negatywna: kafelek "2" (Pokój, NIE dopuszcza wielokrotności) na stole NADAL ma disabled — bez regresji dla pozostałych typów');
    }

    for (const f of Object.values(stubs).concat([ENTRY, BUNDLE])) {
      try { fs.unlinkSync(f); } catch (_) { /* ok */ }
    }
  }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
