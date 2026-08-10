'use strict';
/**
 * diplomacy-lista-podglad-przed-wizyta-test.cjs — R-DYPLOMACJA-LISTA-I-PODGLAD-PRZED-WIZYTA.
 * Runda 3 (Maciej 2026-08-09) — naprawia 2 noty BLOKUJĄCE + 1 realny problem UI +
 * 2 tanie noty z werdyktu Evaluatora rundy 2 (`dyspozycje/PYTANIA-OTWARTE.md`):
 *
 *   BB1 — bramka nie chroniła ISTNIENIA samego pop-upu: cofnięcie wpięcia
 *         `onSelectEntry` (main.ts) do starego `openDiplomacyAudience(ownerId)`
 *         bezpośredniego dawało 29/29 zielono — dokładnie bug zgłoszony przez
 *         Macieja wracał niezauważony. Część 5 poniżej wycina CIAŁO `onSelectEntry`
 *         i asercjonuje regexem, że wywołuje `showDiploPairSummary(` z
 *         `getData: () => buildDiploPairSummaryData(`, ORAZ że ciało NIE zawiera
 *         bezpośredniego `openDiplomacyAudience(ownerId)` (dopuszczalne tylko
 *         wewnątrz osobnej funkcji `onOpenAudience`, gdzie parametr jest
 *         przemianowany na `oid`, więc literał `ownerId` tam nie występuje).
 *   BB2 — bramka nie chroniła dopływu flagi `isCityState` z silnika: usunięcie
 *         `isCityState: rel.isCityState,` w `diploListEntryFromRelation`
 *         (diploListHud.ts) dawało 29/29 zielono — sortowanie degenerowało się
 *         do alfabetycznego bez wykrycia. Część 3 (jsdom) poniżej PRZEBUDOWANA:
 *         wejścia budowane PRZEZ `diploListEntryFromRelation(...)`, nie ręcznymi
 *         literałami obiektowymi — mutacja w tej funkcji teraz pada. Dołożona
 *         też osobna asercja kontraktu (Część 2b).
 *   BB3 — realny problem UI (nieblokujący dla ABC, ale naprawiony): ścieżka
 *         `getData()===null` w `showDiploPairSummary` zostawiała nieusuwalny
 *         czarny overlay + zombie-wpis na stosie Escape (`pairSummaryOpen`
 *         wracał `false`, ale `classList.add('open')`/`pushOverlay(...)` i tak
 *         wykonywały się bezwarunkowo PO `renderPairSummary()`). Naprawa:
 *         1-liniowy strażnik `if (!pairSummaryOpen) return;` między
 *         `renderPairSummary()` a `classList.add('open')`/`pushOverlay(...)`
 *         w `diplomacyPanel.ts`. Część 6 poniżej chroni kolejność tekstowo.
 *   N1  — tania: main.ts musi wołać `dealPartnerIdsForOwner(activeDeals, ownerId,
 *         'sojusz', ...)` dla `alliances` i `'handel'` dla `deals` — mutacja
 *         zamieniająca te literały przechodziła niezłapana. Część 5 poniżej.
 *   N4  — tania: `ensureDiplomacyUiClosed()` (main.ts, wołane z `selectPlayerUnit`)
 *         zamykała audiencję/panel/listę, ale NIE nowy pop-up — dołożone wołanie
 *         `hideDiploPairSummary()`. Część 7 poniżej.
 *
 * Runda 2 (naprawiała B1/B2/B3 rundy 1 — patrz historia w rejestrze):
 *   B1 — barbarzyńcy (BARBARIAN_OWNER_ID=-1) wpisują relację "wojna" ze WSZYSTKIMI
 *        niebarbarzyńcami do TEJ SAMEJ mapy `diplomacyRelations`, którą skanuje
 *        `warPartnerIdsForOwner` — bez filtra pojawialiby się w KAŻDEJ rozgrywce
 *        w sekcji "W stanie wojny z". Część 1 poniżej.
 *   B2 — wyciek mgły wojny: `warPartnerIdsForOwner`/`dealPartnerIdsForOwner` muszą
 *        respektować opcjonalny `isVisiblePartner`, żeby wywołujący (main.ts) mógł
 *        odciąć cywilizacje niespotkane/wyeliminowane. Część 2 poniżej.
 *   B3 — sortowanie listy dyplomacji (`compareDiploListEntries`, cywilizacje NAD
 *        miastami-państwami) miało czystą funkcję pokrytą testem, ale ŻADEN test nie
 *        chronił jej WPIĘCIA w `render()` — mutacja "usuń .sort(...)" przechodziła
 *        100%. Część 3 poniżej renderuje PRAWDZIWY DOM przez `createDiploListHud` +
 *        `showDiploListHud` (jsdom) i asercjonuje kolejność wierszy w drzewie, nie
 *        tylko wynik samego komparatora.
 *
 * Usage (z gra/): node tools/diplomacy-lista-podglad-przed-wizyta-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[diplomacy-lista-podglad-przed-wizyta-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
fs.mkdirSync(STUB_DIR, { recursive: true });

// Stuby assetów (Vite-owe `?raw` / `import.meta.glob`, które esbuild w trybie node/cjs
// nie obsługuje) — wzorzec z army-merge-dismiss-bounce-test.cjs / danina-podatek-tooltip-ui-test.cjs.
// Nazwy WŁASNE (nie współdzielone), żeby uruchomienie tej bramki nie brudziło trackowanych
// plików współdzielonych przez inne bramki (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY).
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'dyplo-lista-podglad-brandAssets-stub.ts');
const BRAND_TOKEN_VARS_STUB = path.resolve(STUB_DIR, 'dyplo-lista-podglad-brandTokenVars-stub.ts');
const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'dyplo-lista-podglad-leaderPortraits-stub.ts');

fs.writeFileSync(BRAND_ASSETS_STUB, `
export function brandIconSvg(_id, _size) { return ''; }
export function civIconSvg(_id, _size) { return ''; }
`, 'utf8');
fs.writeFileSync(BRAND_TOKEN_VARS_STUB, `
export const CIV_BRAND_SCOPE_VARS = '';
export function ensureBrandRootTokens() {}
`, 'utf8');
fs.writeFileSync(LEADER_PORTRAITS_STUB, `
export function leaderPortraitUrl(_civId, _era) { return null; }
`, 'utf8');

const ENTRY = path.resolve(__dirname, '.dyplo-lista-podglad-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dyplo-lista-podglad-bundle.cjs');

fs.writeFileSync(ENTRY, [
  "export { warPartnerIdsForOwner, dealPartnerIdsForOwner } from '../src/game/diplomacy-pair-summary.ts';",
  "export {",
  "  createDiploListHud, showDiploListHud, hideDiploListHud, destroyDiploListHud,",
  "  diploListEntryFromRelation, compareDiploListEntries,",
  "} from '../src/ui/diploListHud.ts';",
].join('\n'), 'utf8');

const stubPlugin = {
  name: 'stub-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: BRAND_TOKEN_VARS_STUB }));
    build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB }));
  },
};

async function main() {
  console.log('diplomacy-lista-podglad-przed-wizyta-test');
  let pass = 0, fail = 0;
  function ok(cond, label) {
    if (cond) { pass++; console.log('  OK:', label); }
    else { fail++; console.error('  FAIL:', label); }
  }

  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: GRA,
      plugins: [stubPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[diplomacy-lista-podglad-przed-wizyta-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const {
    warPartnerIdsForOwner, dealPartnerIdsForOwner,
    createDiploListHud, showDiploListHud, hideDiploListHud, destroyDiploListHud,
    diploListEntryFromRelation, compareDiploListEntries,
  } = require(BUNDLE);

  // =========================================================================
  // CZĘŚĆ 1 — B1: barbarzyńcy wykluczeni z partnerów wojny/traktatów
  // =========================================================================
  console.log('\n-- Część 1: B1 barbarzyńcy --');
  {
    // Owner 2 walczy z ownerem 1 (realna wojna) ORAZ ma relację "wojna" z
    // barbarzyńcą (-1) -- dokładnie tak, jak `getDiploRelation` ją wymusza w
    // main.ts (komentarz C-BARB-Q1) przy KAŻDYM starciu z barbarzyńcami.
    const relations = new Map([
      ['1_2', { status: 'wojna' }],
      ['-1_2', { status: 'wojna' }],
      ['2_3', { status: 'pokoj' }],
    ]);
    const wars = warPartnerIdsForOwner(relations, 2);
    ok(wars.includes(1), '1a) owner 2: wojna z 1 wykryta');
    ok(!wars.includes(-1), '1b) owner 2: barbarzyńca (-1) NIE pojawia się w wojnach (B1)');
    ok(wars.length === 1, '1c) owner 2: dokładnie jeden partner wojny (bez barbarzyńcy)');
  }
  {
    // Zapytanie o partnerów SAMEGO barbarzyńcy -- pusta lista (isBarbarian(ownerId) guard).
    const relations = new Map([['-1_2', { status: 'wojna' }]]);
    const wars = warPartnerIdsForOwner(relations, -1);
    ok(wars.length === 0, '1d) zapytanie o wojny SAMEGO barbarzyńcy zwraca pustą listę');
  }
  {
    // Traktaty: partner-barbarzyńca też wykluczony (symetria z wojnami).
    const deals = [
      { id: 'd1', rodzaj: 'sojusz_pelny', strony: [2, 5], wygasaTura: null },
      { id: 'd2', rodzaj: 'sojusz_pelny', strony: [-1, 2], wygasaTura: null },
    ];
    const alliances = dealPartnerIdsForOwner(deals, 2, 'sojusz');
    ok(alliances.includes(5), '1e) owner 2: sojusz z 5 wykryty');
    ok(!alliances.includes(-1), '1f) owner 2: sojusz z barbarzyńcą (-1) wykluczony');
  }

  // =========================================================================
  // CZĘŚĆ 2 — B2: mgła wojny / eliminacja (isVisiblePartner)
  // =========================================================================
  console.log('\n-- Część 2: B2 mgła wojny --');
  {
    const relations = new Map([
      ['2_5', { status: 'wojna' }], // 5 = spotkany, aktywny
      ['2_6', { status: 'wojna' }], // 6 = NIESPOTKANY (mgła wojny)
      ['2_7', { status: 'wojna' }], // 7 = wyeliminowany
    ]);
    const visible = new Set([5]); // tylko 5 przeszedł bramkę kontaktu+aktywności
    const isVisiblePartner = (id) => visible.has(id);
    const wars = warPartnerIdsForOwner(relations, 2, isVisiblePartner);
    ok(wars.includes(5), '2a) partner spotkany (5) widoczny');
    ok(!wars.includes(6), '2b) partner NIESPOTKANY (6) ukryty — wyciek mgły wojny naprawiony');
    ok(!wars.includes(7), '2c) partner wyeliminowany (7) ukryty');
    ok(wars.length === 1, '2d) dokładnie jeden widoczny partner wojny');
  }
  {
    // Bez isVisiblePartner (parametr opcjonalny) — brak filtrowania, zachowanie wsteczne.
    const relations = new Map([['2_9', { status: 'wojna' }]]);
    const wars = warPartnerIdsForOwner(relations, 2);
    ok(wars.includes(9), '2e) bez isVisiblePartner: brak filtrowania (parametr opcjonalny)');
  }
  {
    // Gracz (0) może zostać jawnie oznaczony jako ZAWSZE widoczny przez wywołującego —
    // dokładnie kontrakt, którego main.ts używa (id===0 || ...) w buildDiploPairSummaryData.
    const relations = new Map([
      ['0_2', { status: 'wojna' }],
      ['2_8', { status: 'wojna' }],
    ]);
    const isVisiblePartner = (id) => id === 0; // tylko gracz widoczny w tym scenariuszu
    const wars = warPartnerIdsForOwner(relations, 2, isVisiblePartner);
    ok(wars.includes(0), '2f) gracz (0) widoczny gdy wywołujący tak zdecyduje');
    ok(!wars.includes(8), '2g) inny AI (8) ukryty przy tej samej regule');
  }
  {
    // Traktaty (sojusz/handel) też respektują isVisiblePartner.
    const deals = [
      { id: 'd1', rodzaj: 'umowa_szlakow', strony: [2, 5] },
      { id: 'd2', rodzaj: 'umowa_szlakow', strony: [2, 6] },
    ];
    const isVisiblePartner = (id) => id === 5;
    const trade = dealPartnerIdsForOwner(deals, 2, 'handel', isVisiblePartner);
    ok(trade.includes(5) && !trade.includes(6), '2h) handel: mgła wojny respektowana');
  }

  // =========================================================================
  // Klasyfikacja rodzaju traktatu (sojusz vs handel) — kontrola poprawności,
  // nie tylko istnienia parametru.
  // =========================================================================
  console.log('\n-- Klasyfikacja rodzaju traktatu --');
  {
    const deals = [
      { id: 'd1', rodzaj: 'sojusz_pelny', strony: [2, 5] },
      { id: 'd2', rodzaj: 'umowa_szlakow', strony: [2, 6] },
      { id: 'd3', rodzaj: 'pakt_nieagresji', strony: [2, 7] }, // ani sojusz, ani handel
      { id: 'd4', rodzaj: 'sojusz_wojskowy', strony: [2, 9] }, // legacy -> normalizuje się do sojusz_pelny
    ];
    const alliances = dealPartnerIdsForOwner(deals, 2, 'sojusz');
    const trade = dealPartnerIdsForOwner(deals, 2, 'handel');
    ok(alliances.includes(5) && alliances.includes(9), '3a) sojusze: pełny + legacy wojskowy (znormalizowany)');
    ok(!alliances.includes(6) && !alliances.includes(7), '3b) sojusze: handel/NAP nie wliczone');
    ok(trade.includes(6) && !trade.includes(5) && !trade.includes(7) && !trade.includes(9), '3c) handel: tylko umowa_szlakow');
  }

  // =========================================================================
  // compareDiploListEntries — cywilizacje NAD miastami-państwami (czysta funkcja)
  // =========================================================================
  console.log('\n-- compareDiploListEntries (czysta funkcja) --');
  {
    const civ = { id: '1', name: 'Bbb', tier: 2, detailLine: '', isCityState: false };
    const cityState = { id: '2', name: 'Aaa', tier: 2, detailLine: '', isCityState: true };
    const arr = [cityState, civ].sort(compareDiploListEntries);
    ok(arr[0].id === '1' && arr[1].id === '2', '4a) cywilizacja przed miastem-państwem mimo odwrotnej kolejności alfabetycznej');
  }
  {
    const a = { id: '1', name: 'Aaa', tier: 2, detailLine: '', isCityState: false };
    const b = { id: '2', name: 'Bbb', tier: 2, detailLine: '', isCityState: false };
    ok(compareDiploListEntries(b, a) > 0, '4b) w obrębie grupy: alfabetycznie (pl)');
  }

  // =========================================================================
  // BB2 (Część 2b) — kontrakt diploListEntryFromRelation: isCityState MUSI
  // przepłynąć z relacji silnika do wpisu listy (nie tylko compareDiploListEntries
  // musi umieć nim posortować — sam dopływ danych też jest kontraktem).
  // =========================================================================
  console.log('\n-- Część 2b: BB2 kontrakt diploListEntryFromRelation.isCityState --');
  {
    const entryCS = diploListEntryFromRelation({ ownerId: 20, civ: 'Alfa', tier: 2, isCityState: true });
    const entryCiv = diploListEntryFromRelation({ ownerId: 10, civ: 'Babilon', tier: 2, isCityState: false });
    ok(entryCS !== null && entryCS.isCityState === true, '2b-1) BB2: isCityState:true przepływa przez diploListEntryFromRelation');
    ok(entryCiv !== null && entryCiv.isCityState === false, '2b-2) BB2: isCityState:false przepływa przez diploListEntryFromRelation');
  }

  // =========================================================================
  // CZĘŚĆ 3 — B3/BB2: sortowanie CHRONIONE w renderze prawdziwego DOM (jsdom),
  // wejścia budowane PRZEZ diploListEntryFromRelation (nie ręcznymi literałami) —
  // BB2 (Evaluator runda 2): usunięcie `isCityState: rel.isCityState,` w tej
  // funkcji dawało 29/29 zielono, bo Część 3 rundy 2 budowała DiploListEntry
  // ręcznie, z pominięciem realnej ścieżki danych z silnika.
  // =========================================================================
  console.log('\n-- Część 3: B3/BB2 sortowanie chronione w render() + w diploListEntryFromRelation (jsdom) --');
  {
    const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
    global.HTMLElement = dom.window.HTMLElement;
    // navigator: Node 22+ ma WŁASNY global `navigator` z getterem bez setter --
    // nadpisujemy przez defineProperty (escapeOverlayStack.ts czyta navigator.keyboard
    // opcjonalnie i już toleruje jego brak, ale samo przypisanie musi się udać).
    Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });

    // Wejście CELOWO w kolejności ŁAMIĄCEJ zarówno grupę (miasto-państwo przed
    // cywilizacją), jak i alfabet w obrębie grupy — jeśli render() nie sortuje,
    // DOM odzwierciedli TĘ kolejność 1:1. BB2: budowane przez diploListEntryFromRelation,
    // żeby mutacja usuwająca `isCityState: rel.isCityState,` w tej funkcji też
    // wywaliła tę asercję (nie tylko czystą compareDiploListEntries wyżej).
    const relInputs = [
      { ownerId: 30, civ: 'Zeta (miasto-państwo)', tier: 2, isCityState: true },
      { ownerId: 10, civ: 'Babilon', tier: 2, isCityState: false },
      { ownerId: 20, civ: 'Alfa (miasto-państwo)', tier: 2, isCityState: true },
      { ownerId: 40, civ: 'Sparta', tier: 2, isCityState: false },
    ];
    const entries = relInputs.map(diploListEntryFromRelation).filter((e) => e !== null);
    ok(entries.length === 4, '5-pre) wszystkie 4 wejścia zbudowane przez diploListEntryFromRelation (kontrola sanity)');
    // Oczekiwana kolejność PO sortowaniu: cywilizacje (Babilon, Sparta) alfabetycznie,
    // potem miasta-państwa (Alfa, Zeta) alfabetycznie.
    const expectedOrder = ['Babilon', 'Sparta', 'Alfa (miasto-państwo)', 'Zeta (miasto-państwo)'];

    const hud = createDiploListHud({
      getEntries: () => entries,
      onSelectEntry: () => {},
    });
    showDiploListHud();
    const names = Array.from(hud.el.querySelectorAll('.dl-name')).map(n => n.textContent);
    ok(
      JSON.stringify(names) === JSON.stringify(expectedOrder),
      '5a) DOM renderuje wiersze W POSORTOWANEJ kolejności (cywilizacje nad miastami-państwami, alfabetycznie w grupie), wejścia z diploListEntryFromRelation: ' + JSON.stringify(names),
    );
    hideDiploListHud();
    destroyDiploListHud();

    delete global.document;
    delete global.window;
    delete global.HTMLElement;
    delete global.navigator;
  }

  // =========================================================================
  // CZĘŚĆ 4 — wpięcie w main.ts (tekst) — chroni B2/N2, bo `warPartnerIdsForOwner`/
  // `dealPartnerIdsForOwner`/`isDiploPairSummaryOpen` żyją w domknięciu main.ts, nie
  // eksportowalnym przez esbuild-entry (wzorzec `border-march-wygasanie-test.cjs`).
  // =========================================================================
  console.log('\n-- Część 4: wpięcie w main.ts (tekst) --');
  const MAIN_TS = path.join(GRA, 'src', 'main.ts');
  const src = fs.readFileSync(MAIN_TS, 'utf8');

  function fnBody(name) {
    const re = new RegExp(`function ${name}\\([^)]*\\)[^{]*\\{`);
    const m = re.exec(src);
    if (!m) return null;
    let i = m.index + m[0].length;
    let depth = 1;
    const start = i;
    while (depth > 0 && i < src.length) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    return src.slice(start, i - 1);
  }

  /**
   * Wycina ciało bloku "KOTWICA: (...) => { ... }" (strzałka przypisana do
   * właściwości obiektu, np. `onSelectEntry: (ownerId) => { ... }`) — analogiczne
   * do `fnBody`, ale dla anonimowych arrow-funkcji, które nie mają własnej
   * nazwy `function`. Używane przez BB1 (Część 5).
   */
  function arrowBody(anchorRegexSource) {
    const re = new RegExp(anchorRegexSource);
    const m = re.exec(src);
    if (!m) return null;
    let i = m.index + m[0].length;
    let depth = 1;
    const start = i;
    while (depth > 0 && i < src.length) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') depth--;
      i++;
    }
    return src.slice(start, i - 1);
  }

  {
    const pairSummaryBody = fnBody('buildDiploPairSummaryData');
    ok(pairSummaryBody != null, '6a) źródło: buildDiploPairSummaryData znaleziona');
    if (pairSummaryBody) {
      ok(pairSummaryBody.includes('warPartnerIdsForOwner('), '6b) wywołuje warPartnerIdsForOwner');
      ok(pairSummaryBody.includes('dealPartnerIdsForOwner('), '6c) wywołuje dealPartnerIdsForOwner');
      ok(
        pairSummaryBody.includes('isVisiblePartner'),
        '6d) definiuje/przekazuje isVisiblePartner (B2 — bramka mgły wojny nie wypadła z wpięcia)',
      );
      ok(
        /id === 0 \|\|.*isActiveDiploOwner\(id\).*getDiplomaticContacts\(\)\.has\(id\)/.test(pairSummaryBody),
        '6e) predykat widoczności = id===0 || (isActiveDiploOwner(id) && kontakt) — dokładnie specyfikacja Evaluatora',
      );
      // N1 (Evaluator runda 2, tania): rodzaj traktatu przekazany do
      // dealPartnerIdsForOwner musi być POPRAWNY dla każdej sekcji — mutacja
      // zamieniająca 'handel' <-> 'sojusz' przechodziła niezłapana w rundzie 2.
      ok(
        /const alliances = dealPartnerIdsForOwner\(\s*activeDeals\s*,\s*ownerId\s*,\s*'sojusz'/.test(pairSummaryBody),
        "6j) N1: alliances wołane z rodzajem 'sojusz'",
      );
      ok(
        /const deals = dealPartnerIdsForOwner\(\s*activeDeals\s*,\s*ownerId\s*,\s*'handel'/.test(pairSummaryBody),
        "6k) N1: deals wołane z rodzajem 'handel'",
      );
    }

    const audienceBody = fnBody('openDiplomacyAudience');
    ok(audienceBody != null, '6f) źródło: openDiplomacyAudience znaleziona');
    if (audienceBody) {
      const guardIdx = audienceBody.indexOf('isDiploPairSummaryOpen()');
      ok(guardIdx >= 0, '6g) N2: openDiplomacyAudience sprawdza isDiploPairSummaryOpen()');
      ok(audienceBody.includes('hideDiploPairSummary()'), '6h) N2: openDiplomacyAudience woła hideDiploPairSummary()');
      const listGuardIdx = audienceBody.indexOf('isDiploListHudOpen()');
      ok(
        guardIdx >= 0 && listGuardIdx >= 0 && guardIdx < listGuardIdx,
        '6i) N2: strażnik pop-upu STOI NA POCZĄTKU funkcji (przed istniejącym strażnikiem listy) — pokrywa wszystkie 5 miejsc wywołania naraz',
      );
    }
  }

  // =========================================================================
  // CZĘŚĆ 5 — BB1 (Evaluator runda 2, BLOKUJĄCA): bramka nie chroniła ISTNIENIA
  // samego pop-upu. Cofnięcie wpięcia `onSelectEntry` do starego
  // `hideDiploListHud(); openDiplomacyAudience(ownerId); refreshD1bHud();`
  // przechodziło 29/29 zielono — dokładnie bug zgłoszony przez Macieja.
  // Wycinamy ciało `onSelectEntry: (ownerId) => { ... }` z createDiploListHud
  // i asercjonujemy WPIĘCIE pop-upu, nie tylko jego istnienie gdzieś w pliku.
  // =========================================================================
  console.log('\n-- Część 5: BB1 wpięcie showDiploPairSummary w onSelectEntry (main.ts) --');
  {
    // Kotwica: `onSelectEntry: (ownerId) => {` -- unikalna w main.ts (jedyne
    // wystąpienie tej właściwości, sprawdzone przy tworzeniu tej bramki).
    const onSelectEntryBody = arrowBody(`onSelectEntry:\\s*\\(ownerId\\)\\s*=>\\s*\\{`);
    ok(onSelectEntryBody != null, '7a) źródło: onSelectEntry(createDiploListHud) znalezione');
    if (onSelectEntryBody) {
      ok(
        onSelectEntryBody.includes('showDiploPairSummary('),
        '7b) BB1: onSelectEntry woła showDiploPairSummary(...) — pop-up podsumowania, nie audiencja wprost',
      );
      ok(
        onSelectEntryBody.includes('getData: () => buildDiploPairSummaryData('),
        '7c) BB1: showDiploPairSummary dostaje getData: () => buildDiploPairSummaryData(...)',
      );
      ok(
        !/openDiplomacyAudience\(\s*ownerId\s*\)/.test(onSelectEntryBody),
        '7d) BB1: BRAK bezpośredniego openDiplomacyAudience(ownerId) w ciele onSelectEntry — regres (stary skok wprost do audiencji) byłby wykryty',
      );
      // Kontrola sanity: przejście do audiencji WCIĄŻ istnieje, ale wyłącznie
      // wewnątrz osobnej funkcji onOpenAudience (parametr przemianowany na `oid`).
      ok(
        onSelectEntryBody.includes('onOpenAudience:') && onSelectEntryBody.includes('openDiplomacyAudience(oid)'),
        '7e) kontrola sanity: przejście do audiencji istnieje w onOpenAudience(oid), nie bezpośrednio w onSelectEntry',
      );
    }
  }

  // =========================================================================
  // CZĘŚĆ 6 — BB3 (Evaluator runda 2, realny problem UI): `getData()===null`
  // zostawiał nieusuwalny czarny overlay + zombie-wpis na stosie Escape, bo
  // `classList.add('open')`/`pushOverlay(...)` w `showDiploPairSummary` biegły
  // bezwarunkowo PO `renderPairSummary()`, nawet gdy ta ostatnia po drodze
  // zawołała `hideDiploPairSummary()` (ustawiając pairSummaryOpen=false).
  // Naprawa: strażnik `if (!pairSummaryOpen) return;` MUSI stać MIĘDZY
  // `renderPairSummary()` a `classList.add('open')`/`pushOverlay(...)`.
  // =========================================================================
  console.log('\n-- Część 6: BB3 showDiploPairSummary nie otwiera pustego pop-upu (diplomacyPanel.ts) --');
  {
    const DIPLOMACY_PANEL_TS = path.join(GRA, 'src', 'ui', 'diplomacyPanel.ts');
    const panelSrc = fs.readFileSync(DIPLOMACY_PANEL_TS, 'utf8');

    function fnBodyIn(text, name) {
      const re = new RegExp(`function ${name}\\([^)]*\\)[^{]*\\{`);
      const m = re.exec(text);
      if (!m) return null;
      let i = m.index + m[0].length;
      let depth = 1;
      const start = i;
      while (depth > 0 && i < text.length) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        i++;
      }
      return text.slice(start, i - 1);
    }

    const showBody = fnBodyIn(panelSrc, 'showDiploPairSummary');
    ok(showBody != null, '8a) źródło: showDiploPairSummary znalezione (diplomacyPanel.ts)');
    if (showBody) {
      const renderIdx = showBody.indexOf('renderPairSummary();');
      const guardIdx = showBody.indexOf('if (!pairSummaryOpen) return;');
      const classIdx = showBody.indexOf(".classList.add('open')");
      const pushIdx = showBody.indexOf('pushOverlay(');
      ok(renderIdx >= 0, '8b) wywołuje renderPairSummary()');
      ok(guardIdx >= 0, '8c) BB3: zawiera strażnik if (!pairSummaryOpen) return;');
      ok(classIdx >= 0 && pushIdx >= 0, '8d) kontrola sanity: classList.add(open) i pushOverlay( nadal obecne');
      ok(
        renderIdx >= 0 && guardIdx > renderIdx && classIdx > guardIdx && pushIdx > guardIdx,
        '8e) BB3: strażnik stoi DOKŁADNIE między renderPairSummary() a classList.add(open)/pushOverlay( — getData()===null nie otwiera pustego pop-upu',
      );
    }
  }

  // =========================================================================
  // CZĘŚĆ 7 — N4 (Evaluator runda 2, tania): ensureDiplomacyUiClosed() (wołane
  // m.in. z selectPlayerUnit) musi zamykać też nowy pop-up podsumowania pary.
  // =========================================================================
  console.log('\n-- Część 7: N4 ensureDiplomacyUiClosed zamyka też pop-up pary (main.ts) --');
  {
    const closedBody = fnBody('ensureDiplomacyUiClosed');
    ok(closedBody != null, '9a) źródło: ensureDiplomacyUiClosed znaleziona');
    if (closedBody) {
      ok(
        closedBody.includes('isDiploPairSummaryOpen()') && closedBody.includes('hideDiploPairSummary()'),
        '9b) N4: ensureDiplomacyUiClosed zamyka pop-up pary (isDiploPairSummaryOpen()/hideDiploPairSummary())',
      );
    }
  }

  console.log(`\ndiplomacy-lista-podglad-przed-wizyta-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
