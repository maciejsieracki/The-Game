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

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
