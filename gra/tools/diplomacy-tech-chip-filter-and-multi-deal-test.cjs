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
 * CZĘŚĆ E — Runda 2 (Evaluator, 2026-08-13): CZĘŚĆ D sprawdza WYŁĄCZNIE że
 * `withOwnTableTechFilter` w oderwaniu zwraca poprawny wynik — nie że KAŻDE z TRZECH miejsc
 * wpięcia w diplomacyAudience.ts (`openCounterNegotiationModal`, handler nowego kliknięcia w
 * `render()`, `openQuickDealBasket`) faktycznie WOŁA tę funkcję i przekazuje jej wynik dalej.
 * Zweryfikowane mutacyjnie przez Evaluatora: cofnięcie wywołania `withOwnTableTechFilter(...)`
 * we WSZYSTKICH TRZECH miejscach naraz (zostaje wyłącznie definicja funkcji) przechodziło przez
 * WSZYSTKIE 53 ówczesne asercje pliku bez ani jednej czerwonej — DOKŁADNIE ta sama luka co w
 * CZĘŚCI C (patrz komentarz tam), tym razem dla trzeciej, nowszej funkcji. CZĘŚĆ E renderuje
 * PRAWDZIWY `showDiplomacyAudience`/`render()` (nie samą funkcję filtra w oderwaniu), klika trzy
 * realne wejścia do koszyka i asertuje na PRZECHWYCONYM `ctx` przekazanym do prawdziwego
 * `showTradeBasketModal`/`openQuickDealBasket` (moduł `diplomacyTradeBasket` zaślepiony tak, by
 * ZAPISYWAŁ argument zamiast go ignorować — w odróżnieniu od zaślepki CZĘŚCI D, która była
 * no-opem, bo tam testowaliśmy samą funkcję filtra, nie jej wiązanie).
 *
 * **Korekta N1 (Runda 2 Operatora, 2026-08-13):** raport Operatora z Rundy 1 błędnie zgłosił
 * CZĘŚĆ D jako „22 asercje" — faktyczny, policzony przez `grep -c 'ok('` na blok CZĘŚCI D,
 * stan **15**. CZĘŚĆ E dopisana w tej rundzie dokłada kolejnych 13 — łączny stan pliku po tej
 * rundzie: 66 asercji (patrz `console.log` sumy na końcu pliku, liczony programowo, nie ręcznie).
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

  // =========================================================================
  // CZĘŚĆ D — P-UMOWA-SUROWCOW-TECH-CHIP-NADAL-WYBIERALNY-PO-DODANIU (2026-08-13):
  // ekran „Umowa wymiany surowców" (aid '14') dopuszcza WIELE własnych wpisów na stole
  // (R-DYPLO-UMOWA-SUROWCOW-WIELOKROTNA, CZĘŚĆ B/C wyżej) — każda KOLEJNA instancja koszyka
  // startuje z PUSTYMI giveItems/receiveItems, więc filtr CZĘŚCI A (lokalny, `existingItems`
  // w `buildAddForm`) nie ma czego odfiltrować: technologia widniejąca już w INNYM,
  // wcześniej wysłanym własnym wierszu (widoczna w koszyku OFERUJEMY) nadal pokazuje się
  // jako wybieralny chip w NOWYM formularzu. Naprawa: `withOwnTableTechFilter`
  // (diplomacyAudience.ts) zbiera id technologii z `dealPayload.giveItems/receiveItems`
  // WSZYSTKICH innych własnych wierszy tego samego aid i usuwa je z `ctx.giveTechOptions`/
  // `receiveTechOptions` PRZED przekazaniem do koszyka — tak że nawet pusty `existingItems`
  // nowej instancji i tak nie pokaże już zaangażowanej technologii.
  // =========================================================================
  {
    console.log('CZĘŚĆ D — withOwnTableTechFilter: technologia z INNEGO własnego wiersza stołu znika z listy nowej instancji');

    const STUB_DIR = path.resolve(__dirname, '.stubs');
    fs.mkdirSync(STUB_DIR, { recursive: true });
    const stubs = {
      music: path.resolve(STUB_DIR, 'own-table-filter-music-stub.ts'),
      diploUiSkin: path.resolve(STUB_DIR, 'own-table-filter-diplouiskin-stub.ts'),
      negotiationModal: path.resolve(STUB_DIR, 'own-table-filter-negotiationmodal-stub.ts'),
      tradeBasket: path.resolve(STUB_DIR, 'own-table-filter-tradebasket-stub.ts'),
      leaderPortraits: path.resolve(STUB_DIR, 'own-table-filter-leaderportraits-stub.ts'),
      civBrandDisplay: path.resolve(STUB_DIR, 'own-table-filter-civbranddisplay-stub.ts'),
      brandAssets: path.resolve(STUB_DIR, 'own-table-filter-brandassets-stub.ts'),
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
    // `withOwnTableTechFilter` samo nie WOŁA żadnej z tych funkcji (są w tym module tylko
    // dla INNYCH funkcji w diplomacyAudience.ts) — zaślepienie jest bezpieczne dla testu
    // TEJ konkretnej, czystej funkcji. Prawdziwy `buildAddForm` (CZĘŚĆ A/E) bundlowany jest
    // OSOBNO, żeby end-to-end sklejenie w teście używało realnej implementacji obu stron.
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

    const ENTRY = path.resolve(__dirname, '.dip-own-table-filter-entry.ts');
    const BUNDLE = path.resolve(__dirname, '.dip-own-table-filter-bundle.cjs');
    fs.writeFileSync(ENTRY, `export { withOwnTableTechFilter } from '../src/ui/diplomacyAudience.ts';\n`, 'utf8');

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
        name: 'stub-vite-assets-own-table-filter',
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

    const { withOwnTableTechFilter } = require(BUNDLE);

    const TECH_OPTS = [
      { id: 'Obróbka drewna', label: 'Obróbka drewna', suggestedPrice: 50 },
      { id: 'Rolnictwo', label: 'Rolnictwo', suggestedPrice: 40 },
      { id: 'Oswojenie zwierząt', label: 'Oswojenie zwierząt', suggestedPrice: 40 },
      { id: 'Łowiectwo', label: 'Łowiectwo', suggestedPrice: 30 },
    ];
    function baseCtx(over) {
      return Object.assign({ civName: 'Inkowie', giveTechOptions: TECH_OPTS, receiveTechOptions: TECH_OPTS }, over || {});
    }
    /** Wiersz stołu jak w main.ts (patrz `dealPayload: p`, main.ts ok. linia 13865). */
    function ownRow(id, aid, giveItems, receiveItems) {
      return {
        id, direction: 'own', uiActionId: aid, actionLabel: 'Umowa wymiany surowców', summary: 'x',
        round: 1, maxRounds: 3, expiresInTurns: 5, canCounter: true,
        dealPayload: { giveItems: giveItems || [], receiveItems: receiveItems || [] },
      };
    }

    // 1) Odtworzenie DOKŁADNEGO zgłoszenia: koszyk OFERUJEMY ma już "Obróbka drewna" i
    //    "Rolnictwo" (jeden własny wiersz stołu, aid '14') — NOWA, pusta instancja koszyka nie
    //    powinna już oferować tych dwóch technologii.
    {
      const st = { pendingNegotiations: [
        ownRow('n1', '14', [{ typ: 'tech', id: 'Obróbka drewna' }, { typ: 'tech', id: 'Rolnictwo' }], []),
      ] };
      const filtered = withOwnTableTechFilter(baseCtx(), st, '14');
      const ids = filtered.giveTechOptions.map(t => t.id);
      ok(!ids.includes('Obróbka drewna'), 'give: "Obróbka drewna" (już w koszyku OFERUJEMY) znika z nowej instancji');
      ok(!ids.includes('Rolnictwo'), 'give: "Rolnictwo" (już w koszyku OFERUJEMY) znika z nowej instancji');
      ok(ids.includes('Oswojenie zwierząt') && ids.includes('Łowiectwo'),
        'give: technologie NIEUŻYTE w żadnym wierszu zostają wybieralne — dokładnie stan ze zgłoszenia (2 z 4 chipów)');
    }

    // 2) Wiele osobnych własnych wierszy (kolejne instancje R-DYPLO-UMOWA-SUROWCOW-WIELOKROTNA)
    //    sumują się do wspólnego wykluczenia, nie tylko ostatni wiersz.
    {
      const st = { pendingNegotiations: [
        ownRow('n1', '14', [{ typ: 'tech', id: 'Obróbka drewna' }], []),
        ownRow('n2', '14', [{ typ: 'tech', id: 'Rolnictwo' }], []),
      ] };
      const filtered = withOwnTableTechFilter(baseCtx(), st, '14');
      const ids = filtered.giveTechOptions.map(t => t.id);
      ok(!ids.includes('Obróbka drewna') && !ids.includes('Rolnictwo'),
        'dwa OSOBNE własne wiersze: obie technologie (po jednej z każdego) wykluczone razem');
    }

    // 3) Strona 'receive' filtrowana NIEZALEŻNIE od 'give' (analogicznie do CZĘŚCI A pkt 3).
    {
      const st = { pendingNegotiations: [
        ownRow('n1', '14', [], [{ typ: 'tech', id: 'Obróbka drewna' }]),
      ] };
      const filtered = withOwnTableTechFilter(baseCtx(), st, '14');
      ok(!filtered.receiveTechOptions.map(t => t.id).includes('Obróbka drewna'),
        'receive: technologia już DOSTAWANA w innym wierszu (receiveItems) znika z listy receive');
      ok(filtered.giveTechOptions.map(t => t.id).includes('Obróbka drewna'),
        'receive-only wpis NIE filtruje strony give (niezależne tablice, jak w buildAddForm)');
    }

    // 4) Wiersz INNEGO typu akcji (nie aid '14') NIE wpływa na filtr — kontrola negatywna.
    {
      const st = { pendingNegotiations: [
        ownRow('n1', '6', [{ typ: 'tech', id: 'Obróbka drewna' }], []),
      ] };
      const filtered = withOwnTableTechFilter(baseCtx(), st, '14');
      ok(filtered.giveTechOptions.map(t => t.id).includes('Obróbka drewna'),
        'wiersz innego aid ("6") nie wyklucza technologii z filtra dla aid "14"');
    }

    // 5) Wiersz PRZYCHODZĄCY (direction 'incoming', propozycja AI) NIE wpływa na filtr —
    //    dotyczy wyłącznie WŁASNYCH ("own") zobowiązań gracza.
    {
      const st = { pendingNegotiations: [
        { id: 'n1', direction: 'incoming', uiActionId: '14', actionLabel: 'x', summary: 'x',
          round: 1, maxRounds: 3, expiresInTurns: 5, canCounter: true,
          dealPayload: { giveItems: [{ typ: 'tech', id: 'Obróbka drewna' }], receiveItems: [] } },
      ] };
      const filtered = withOwnTableTechFilter(baseCtx(), st, '14');
      ok(filtered.giveTechOptions.map(t => t.id).includes('Obróbka drewna'),
        'wiersz przychodzący (AI) nie wyklucza technologii — filtr patrzy WYŁĄCZNIE na direction "own"');
    }

    // 6) WYJĄTEK EDYCJI: `excludeRowId` = id wiersza aktualnie edytowanego/kontrowanego — jego
    //    WŁASNE technologie nie mogą same siebie wykluczyć (inaczej edycja własnej pozycji
    //    chowałaby jej chip, tak samo jak wymóg z CZĘŚCI A pkt 5 dla filtra lokalnego).
    {
      const st = { pendingNegotiations: [
        ownRow('n1', '14', [{ typ: 'tech', id: 'Obróbka drewna' }], []),
        ownRow('n2', '14', [{ typ: 'tech', id: 'Rolnictwo' }], []),
      ] };
      const filtered = withOwnTableTechFilter(baseCtx(), st, '14', 'n1');
      const ids = filtered.giveTechOptions.map(t => t.id);
      ok(ids.includes('Obróbka drewna'),
        'excludeRowId="n1": własna technologia wiersza n1 NIE jest wykluczana (edycja nie chowa sama siebie)');
      ok(!ids.includes('Rolnictwo'),
        'excludeRowId="n1": technologia INNEGO wiersza (n2) nadal wykluczona');
    }

    // 7) MUTACJA: bez żadnych własnych wierszy na stole — `ctx` wraca BEZ ZMIAN (ten sam obiekt
    //    referencyjnie, dowód że filtr jest no-opem gdy nie ma czego wykluczyć).
    {
      const st = { pendingNegotiations: [] };
      const ctx = baseCtx();
      const filtered = withOwnTableTechFilter(ctx, st, '14');
      ok(filtered === ctx, 'brak własnych wierszy na stole: ctx zwrócony BEZ ZMIAN (no-op, dowód że filtr czyta stan, nie zawsze kopiuje)');
    }

    // 8) Integracja z prawdziwym `buildAddForm` (CZĘŚĆ A) — sklejenie end-to-end: wynik
    //    `withOwnTableTechFilter` podany do REALNEGO renderu koszyka odtwarza dokładnie stan ze
    //    zrzutu ekranu zgłoszenia (2 z 4 chipów widoczne).
    {
      // buildAddForm (diplomacyTradeBasket.ts) potrzebuje PEŁNIEJSZEGO stubu leaderPortraits/
      // brandAssets niż CZĘŚĆ D wyżej (diploUiSkin.ts importuje `civIconSvg`/`leaderPortraitUrl`
      // itd., których stub CZĘŚCI D celowo nie ma — wystarczał tam do zaślepienia importu bez
      // wykonania) — reużycie DOKŁADNIE stubów z CZĘŚCI A (buildAddForm bundlowany tam identycznie).
      const LEADER_PORTRAITS_STUB_A = path.resolve(STUB_DIR, 'own-table-filter-e2e-leaderportraits-stub.ts');
      const BRAND_ASSETS_STUB_A = path.resolve(STUB_DIR, 'own-table-filter-e2e-brandassets-stub.ts');
      fs.writeFileSync(
        LEADER_PORTRAITS_STUB_A,
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
        BRAND_ASSETS_STUB_A,
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

      const BUNDLE_A = path.resolve(__dirname, '.dip-own-table-filter-buildaddform-bundle.cjs');
      const ENTRY_A = path.resolve(__dirname, '.dip-own-table-filter-buildaddform-entry.ts');
      fs.writeFileSync(ENTRY_A, `export { buildAddForm } from '../src/ui/diplomacyTradeBasket.ts';\n`, 'utf8');
      await esbuild.build({
        entryPoints: [ENTRY_A],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        outfile: BUNDLE_A,
        absWorkingDir: path.resolve(__dirname, '..'),
        logLevel: 'silent',
        loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
        plugins: [{
          name: 'stub-vite-assets-e2e',
          setup(build) {
            build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB_A }));
            build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB_A }));
          },
        }],
      });
      const { buildAddForm } = require(BUNDLE_A);

      let JSDOM;
      try { ({ JSDOM } = require('jsdom')); }
      catch (e) { console.error('jsdom missing — npm i -D jsdom'); process.exit(1); }
      const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
      global.document = dom.window.document;
      global.window = dom.window;
      global.HTMLElement = dom.window.HTMLElement;
      global.Element = dom.window.Element;
      function mount(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div;
      }

      const st = { pendingNegotiations: [
        ownRow('n1', '14', [{ typ: 'tech', id: 'Obróbka drewna' }, { typ: 'tech', id: 'Rolnictwo' }], []),
      ] };
      const filteredCtx = withOwnTableTechFilter(
        baseCtx({ relacjaTotal: 200, progHandelRelacja: 100 }), st, '14',
      );
      // NOWA (pusta) instancja koszyka: existingItems=[] — dokładnie jak przy kolejnym kliku
      // „Umowa wymiany surowców" (R-DYPLO-UMOWA-SUROWCOW-WIELOKROTNA).
      const html = buildAddForm('give', filteredCtx, 'trade', '14', undefined, undefined, []);
      const box = mount(html);
      ok(box.querySelector('.cdb-chip-tech[data-value="Obróbka drewna"]') === null,
        'E2E: chip "Obróbka drewna" (w koszyku OFERUJEMY) NIEOBECNY w prawdziwym renderze nowej instancji');
      ok(box.querySelector('.cdb-chip-tech[data-value="Rolnictwo"]') === null,
        'E2E: chip "Rolnictwo" (w koszyku OFERUJEMY) NIEOBECNY w prawdziwym renderze nowej instancji');
      ok(box.querySelector('.cdb-chip-tech[data-value="Oswojenie zwierząt"]') !== null,
        'E2E: chip "Oswojenie zwierząt" (nieużyta technologia) nadal WIDOCZNY');
      ok(box.querySelector('.cdb-chip-tech[data-value="Łowiectwo"]') !== null,
        'E2E: chip "Łowiectwo" (nieużyta technologia) nadal WIDOCZNY');

      for (const f of [ENTRY_A, BUNDLE_A, LEADER_PORTRAITS_STUB_A, BRAND_ASSETS_STUB_A]) {
        try { fs.unlinkSync(f); } catch (_) { /* ok */ }
      }
    }

    for (const f of Object.values(stubs).concat([ENTRY, BUNDLE])) {
      try { fs.unlinkSync(f); } catch (_) { /* ok */ }
    }
  }

  // =========================================================================
  // CZĘŚĆ E — Runda 2: warstwa WIĄZANIA pełnego renderu — 3 realne wejścia do koszyka
  // (nowy klik, edycja własnego wiersza, SZYBKA WYMIANA) + 1 negatywna (kontroferta cudzego
  // wiersza). Patrz komentarz nagłówkowy pliku dla pełnego uzasadnienia.
  // =========================================================================
  {
    console.log('CZĘŚĆ E — 3 realne wejścia do koszyka: wiązanie withOwnTableTechFilter z rendera/kliknięć');

    const STUB_DIR = path.resolve(__dirname, '.stubs');
    fs.mkdirSync(STUB_DIR, { recursive: true });
    const stubs = {
      music: path.resolve(STUB_DIR, 'wiring-music-stub.ts'),
      diploUiSkin: path.resolve(STUB_DIR, 'wiring-diplouiskin-stub.ts'),
      negotiationModal: path.resolve(STUB_DIR, 'wiring-negotiationmodal-stub.ts'),
      tradeBasket: path.resolve(STUB_DIR, 'wiring-tradebasket-stub.ts'),
      leaderPortraits: path.resolve(STUB_DIR, 'wiring-leaderportraits-stub.ts'),
      civBrandDisplay: path.resolve(STUB_DIR, 'wiring-civbranddisplay-stub.ts'),
      brandAssets: path.resolve(STUB_DIR, 'wiring-brandassets-stub.ts'),
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
    /** W ODRÓŻNIENIU od zaślepki CZĘŚCI C/D (no-op) — TA zaślepka ZAPISUJE przechwycony `ctx`
     *  (3. argument obu funkcji — patrz sygnatury `showTradeBasketModal`/`openQuickDealBasket`
     *  w diplomacyTradeBasket.ts) do `global.__wiringCaptured`, żeby asercje niżej mogły badać
     *  DOKŁADNIE to, co realny kod produkcyjny faktycznie przekazał do koszyka — nie tylko że
     *  COŚ przekazał. */
    fs.writeFileSync(stubs.tradeBasket, [
      "export function actionUsesTradeBasket(id) { return id === '14'; }",
      "export function getTradeBasketMode() { return 'trade'; }",
      "export function showTradeBasketModal(mode, action, ctx) { global.__wiringCaptured.push({ via: 'showTradeBasketModal', ctx }); }",
      "export function hideTradeBasketModal() {}",
      "export function openQuickDealBasket(action, ctx) { global.__wiringCaptured.push({ via: 'openQuickDealBasket', ctx }); }",
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

    const ENTRY = path.resolve(__dirname, '.dip-wiring-entry.ts');
    const BUNDLE = path.resolve(__dirname, '.dip-wiring-bundle.cjs');
    fs.writeFileSync(ENTRY, `export { showDiplomacyAudience } from '../src/ui/diplomacyAudience.ts';\n`, 'utf8');

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
        name: 'stub-vite-assets-wiring',
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

    const { showDiplomacyAudience } = require(BUNDLE);

    let JSDOM;
    try { ({ JSDOM } = require('jsdom')); }
    catch (e) { console.error('jsdom missing — npm i -D jsdom'); process.exit(1); }
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;

    function ownRow(id, aid, giveItems, direction) {
      return {
        id, direction: direction || 'own', uiActionId: aid, actionLabel: 'Umowa wymiany surowców', summary: 'x',
        round: 1, maxRounds: 3, expiresInTurns: 5, canCounter: true,
        dealPayload: { giveItems: giveItems || [], receiveItems: [] },
      };
    }
    function baseState(pendingNegotiations) {
      return {
        playerTitle: 'Gracz', playerCivName: 'Rzym', otherTitle: 'Rozmówca', otherCivName: 'Grecja',
        zaufanie: 50, respekt: 50, tier: 1, layer: 'full', contactEstablished: true,
        actions: [{ id: '14', label: 'Umowa wymiany surowców', enabled: true }],
        pendingNegotiations,
      };
    }
    function negCtx() {
      return {
        civName: 'Inkowie',
        giveTechOptions: [
          { id: 'Obróbka drewna', label: 'Obróbka drewna', suggestedPrice: 50 },
          { id: 'Garncarstwo', label: 'Garncarstwo', suggestedPrice: 40 },
        ],
        receiveTechOptions: [],
        relacjaTotal: 200, progHandelRelacja: 100,
      };
    }
    function click(el) { el.dispatchEvent(new dom.window.Event('click', { bubbles: true })); }
    function open(state) {
      global.__wiringCaptured = [];
      showDiplomacyAudience({
        ownerId: 1,
        getState: () => state,
        onAction: () => {},
        onBack: () => {},
        getNegotiationContext: () => negCtx(),
      });
    }

    // (a) Świeży klik na aid '14' — otwiera NOWĄ, pustą instancję koszyka (kolejna umowa,
    //     R-DYPLO-UMOWA-SUROWCOW-WIELOKROTNA). Na stole już leży własny wiersz n1 z „Obróbka
    //     drewna" — call site: handler `button[data-aid]` w `render()` (linia ok. 2083).
    {
      open(baseState([ownRow('n1', '14', [{ typ: 'tech', id: 'Obróbka drewna' }])]));
      const btn = document.querySelector('button[data-aid="14"]');
      ok(btn !== null && !btn.disabled, '(a) świeży klik: przycisk aid "14" obecny i klikalny');
      if (btn) click(btn);
      ok(global.__wiringCaptured.length === 1, '(a) świeży klik: koszyk faktycznie się otworzył (1 przechwycone wywołanie)');
      const ids = (global.__wiringCaptured[0]?.ctx.giveTechOptions ?? []).map(t => t.id);
      ok(!ids.includes('Obróbka drewna'),
        '(a) świeży klik na aid "14": ctx.giveTechOptions NIE zawiera "Obróbka drewna" (już committed w n1) — dowód wiązania handlera nowego kliknięcia w render()');
    }

    // (b) `openCounterNegotiationModal` dla WŁASNEGO wiersza (edycja n2) — n1 (inny własny
    //     wiersz) trzyma "Obróbka drewna"; n2 (edytowany) trzyma "Garncarstwo". Poprawne
    //     wiązanie: n1 dalej wykluczone (inny wiersz), n2 NIE wykluczone samo siebie
    //     (excludeRowId=n2.id, wymóg CZĘŚCI D pkt 6).
    {
      open(baseState([
        ownRow('n1', '14', [{ typ: 'tech', id: 'Obróbka drewna' }]),
        ownRow('n2', '14', [{ typ: 'tech', id: 'Garncarstwo' }]),
      ]));
      const btn = document.querySelector('button[data-negot-act="edit"][data-negot-id="n2"]');
      ok(btn !== null, '(b) edycja własnego wiersza n2: przycisk "Edytuj" obecny');
      if (btn) click(btn);
      ok(global.__wiringCaptured.length === 1, '(b) edycja n2: openCounterNegotiationModal faktycznie otworzył koszyk (1 przechwycone wywołanie)');
      const ids = (global.__wiringCaptured[0]?.ctx.giveTechOptions ?? []).map(t => t.id);
      ok(!ids.includes('Obróbka drewna'),
        '(b) edycja n2: ctx.giveTechOptions NIE zawiera "Obróbka drewna" (committed w INNYM własnym wierszu n1) — dowód wiązania openCounterNegotiationModal');
      ok(ids.includes('Garncarstwo'),
        '(b) edycja n2: ctx.giveTechOptions ZAWIERA "Garncarstwo" (własna technologia n2 — excludeRowId poprawnie = n2.id, nie chowa sam siebie)');
    }

    // (c) `.da-quickdeal` / „SZYBKA WYMIANA" — call site: openQuickDealBasket (linia ok. 2123).
    {
      open(baseState([ownRow('n1', '14', [{ typ: 'tech', id: 'Obróbka drewna' }])]));
      const btn = document.querySelector('.da-quickdeal');
      ok(btn !== null && !btn.disabled, '(c) SZYBKA WYMIANA: przycisk obecny i klikalny');
      if (btn) click(btn);
      ok(global.__wiringCaptured.length === 1, '(c) SZYBKA WYMIANA: openQuickDealBasket faktycznie się otworzył (1 przechwycone wywołanie)');
      const ids = (global.__wiringCaptured[0]?.ctx.giveTechOptions ?? []).map(t => t.id);
      ok(!ids.includes('Obróbka drewna'),
        '(c) SZYBKA WYMIANA: ctx.giveTechOptions NIE zawiera "Obróbka drewna" — dowód wiązania openQuickDealBasket');
    }

    // (d) NEGATYWNA: kontroferta do CUDZEGO (przychodzącego, AI) wiersza — `excludeRowId`
    //     przekazany do filtra MUSI być `undefined`, nie id żadnego własnego wiersza
    //     (isOwnEdit = row.direction === 'own', linia ok. 456/460). Id kolizyjne UMYŚLNIE: wiersz
    //     przychodzący i własny wiersz z „Obróbka drewna" mają TEN SAM id ('shared'), przychodzący
    //     PIERWSZY w tablicy — `.find(r => r.id === negotId)` w handlerze kliknięcia rozstrzyga
    //     WYŁĄCZNIE po kolejności w tablicy `pendingNegotiations`, niezależnie od tego, który
    //     DOM-owy przycisk fizycznie kliknięto, więc to bezpiecznie zwraca wiersz PRZYCHODZĄCY.
    //     Gdyby kod błędnie przekazywał `excludeRowId = row.id` BEZ WARUNKU `isOwnEdit ? … :
    //     undefined` (regresja identyczna do usunięcia samego warunku), `excludeRowId` wyszedłby
    //     'shared' i przypadkowo wykluczyłby WŁASNY wiersz o tym samym id z listy zaangażowanych
    //     technologii — "Obróbka drewna" wróciłaby jako wybieralna. W realnej grze id-y nigdy się
    //     nie powtarzają, więc to jedyny sposób, by ten konkretny błąd ujawnił się przez wynik
    //     `ctx`, a nie tylko przez podgląd samego argumentu.
    {
      open(baseState([
        ownRow('shared', '14', [], 'incoming'),
        ownRow('shared', '14', [{ typ: 'tech', id: 'Obróbka drewna' }], 'own'),
      ]));
      const btn = document.querySelector('button[data-negot-act="edit"][data-negot-id="shared"]');
      ok(btn !== null, '(d) kontroferta cudzego wiersza: przycisk "Edytuj" obecny');
      if (btn) click(btn);
      ok(global.__wiringCaptured.length === 1, '(d) kontroferta cudzego wiersza: openCounterNegotiationModal faktycznie się otworzył (1 przechwycone wywołanie)');
      const ids = (global.__wiringCaptured[0]?.ctx.giveTechOptions ?? []).map(t => t.id);
      ok(!ids.includes('Obróbka drewna'),
        '(d) NEGATYWNA: kontroferta PRZYCHODZĄCEGO wiersza — "Obróbka drewna" (committed w OSOBNYM własnym wierszu o tym samym id) nadal WYKLUCZONA, dowód że excludeRowId poszedł jako undefined, nie jako id własnego wiersza');
    }

    delete global.__wiringCaptured;
    for (const f of Object.values(stubs).concat([ENTRY, BUNDLE])) {
      try { fs.unlinkSync(f); } catch (_) { /* ok */ }
    }
  }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
