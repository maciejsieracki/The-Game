'use strict';
/**
 * diplomacy-basket-edit-test.cjs — R-PROPOZYCJA-BRAK-EDYCJI + BUG-PROPOZYCJA-KASACJA-PUSTEJ-
 * STRONY-KASUJE-CALOSC (runda 3).
 *
 * 1) `negotiationTableDealSideHasContent` (diplomacyDealDisplay.ts) MUSI zgadzać się DOKŁADNIE
 *    z tym co faktycznie renderuje `renderNegotiationTableDealSideHtml` — dla traktatu dwustronnego
 *    (NAP/sojusz bez koszyka) z PW=0, PW=undefined i PW>0. Runda 2 zacementowała błędną asercję
 *    (`pw=0 → hasContent=false`, mimo że render pokazuje etykietę traktatu niezależnie od PW) —
 *    ten test odwraca to na poprawne zachowanie i pilnuje regresji przy przyszłych zmianach.
 * 2) `computeAvailableTypes`/`basketItemEditAvailable` (diplomacyTradeBasket.ts) — gating przycisku
 *    „✎ Edytuj" pozycji koszyka (pkt 4): nie pokazuj edycji dla typu, którego formularz „Dodaj" i
 *    tak by nie zaoferował (złoto/praca w wojnie, tech poniżej progu Relacji po stronie „receive").
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const STUB_DIR = path.resolve(__dirname, '.stubs');
const LEADER_PORTRAITS_STUB = path.resolve(STUB_DIR, 'leaderPortraits-basket-edit-stub.ts');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'brandAssets-basket-edit-stub.ts');
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

const BUNDLE = path.resolve(__dirname, '.dip-basket-edit-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-basket-edit-entry.ts');
fs.writeFileSync(entryFile, `
export {
  renderNegotiationTableDealSideHtml,
  negotiationTableDealSideHasContent,
} from '../src/ui/diplomacyDealDisplay.ts';
export {
  computeAvailableTypes,
  basketItemEditAvailable,
} from '../src/ui/diplomacyTradeBasket.ts';
`);

const stubViteAssetsPlugin = {
  name: 'stub-vite-assets',
  setup(build) {
    build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_PORTRAITS_STUB }));
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
  },
};

async function main() {
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

  const {
    renderNegotiationTableDealSideHtml,
    negotiationTableDealSideHasContent,
    computeAvailableTypes,
    basketItemEditAvailable,
  } = require(BUNDLE);

  let pass = 0;
  let fail = 0;
  function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

  console.log('diplomacy-basket-edit-test');

  // --- 1) render <-> hasContent parity dla traktatu dwustronnego bez koszyka (pkt 2 + pkt 8) ---
  // Payload bez giveItems/receiveItems/goldOnce -> splitNegotiationDealPlayerSides zwraca null,
  // items=[] po obu stronach -> jedyna treść karty to fallback traktatu (jeśli podany).
  const treatyPayload = { turns: 15 };
  const label = 'Pakt o nieagresji';

  function rendersLabel(html) {
    return html.includes(label) && !html.includes('da-deal-empty');
  }

  // 1a — PW = 0 (realny przypadek: treatyBasePn > 0 ? … : 0 w diplomacy-acceptance-points.ts).
  {
    const html = renderNegotiationTableDealSideHtml(treatyPayload, 'we', false, label, 0, undefined);
    const has = negotiationTableDealSideHasContent(treatyPayload, 'we', false, label);
    ok(rendersLabel(html), 'traktat PW=0: render POKAZUJE etykietę (bez sprawdzania PW)');
    ok(has === true, 'traktat PW=0: hasContent = true (NIE false — to była zacementowana runda-2 pomyłka)');
    ok(rendersLabel(html) === has, 'traktat PW=0: render i gating ZGODNE');
  }

  // 1b — PW = undefined (traktat bez wyceny PW w ogóle).
  {
    const html = renderNegotiationTableDealSideHtml(treatyPayload, 'we', false, label, undefined, undefined);
    const has = negotiationTableDealSideHasContent(treatyPayload, 'we', false, label);
    ok(rendersLabel(html), 'traktat PW=undefined: render pokazuje etykietę');
    ok(has === true, 'traktat PW=undefined: hasContent = true');
    ok(rendersLabel(html) === has, 'traktat PW=undefined: render i gating ZGODNE');
  }

  // 1c — PW > 0 (przypadek, który zawsze działał poprawnie — kontrola, że naprawa go nie psuje).
  {
    const html = renderNegotiationTableDealSideHtml(treatyPayload, 'we', false, label, 40, 40);
    const has = negotiationTableDealSideHasContent(treatyPayload, 'we', false, label);
    ok(rendersLabel(html), 'traktat PW=40: render pokazuje etykietę + PW');
    ok(html.includes('40 PW'), 'traktat PW=40: render pokazuje wartość PW w treści');
    ok(has === true, 'traktat PW=40: hasContent = true');
    ok(rendersLabel(html) === has, 'traktat PW=40: render i gating ZGODNE');
  }

  // --- 2) Karta bez treści i bez fallbacku traktatu -> "-" puste, hasContent=false ---
  // (BUG-PROPOZYCJA-KASACJA-PUSTEJ-STRONY-KASUJE-CALOSC: strona bez pozycji I bez traktatu —
  // np. „Umowa wymiany surowców" gdzie druga strona nic nie oddaje.)
  {
    const emptyPayload = { giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 25 }], receiveItems: [] };
    const htmlTheySide = renderNegotiationTableDealSideHtml(emptyPayload, 'they', false, undefined, undefined, undefined);
    const hasTheySide = negotiationTableDealSideHasContent(emptyPayload, 'they', false, undefined);
    ok(htmlTheySide.includes('da-deal-empty'), 'pusta strona bez traktatu: render pokazuje "-" (da-deal-empty)');
    ok(hasTheySide === false, 'pusta strona bez traktatu: hasContent = false (Usuń chowany na tej karcie)');

    const htmlWeSide = renderNegotiationTableDealSideHtml(emptyPayload, 'we', false, undefined, undefined, undefined);
    const hasWeSide = negotiationTableDealSideHasContent(emptyPayload, 'we', false, undefined);
    ok(!htmlWeSide.includes('da-deal-empty'), 'strona z realną pozycją: render POKAZUJE treść');
    ok(hasWeSide === true, 'strona z realną pozycją: hasContent = true (Usuń zostaje widoczny)');
  }

  // --- 3) computeAvailableTypes / basketItemEditAvailable (pkt 4 — gating "✎ Edytuj") ---
  function baseCtx(over) {
    return Object.assign({ civName: 'Test', relacjaTotal: 100 }, over || {});
  }

  {
    // W wojnie (bez wyjątku ultimatum/trybutu) złoto/praca odpadają z formularza "Dodaj" po obu stronach.
    const types = computeAvailableTypes('give', baseCtx({ atWar: true }), 'trade', '14', undefined);
    ok(!types.includes('zloto'), 'wojna: zloto NIE jest dostępnym typem formularza Dodaj');
    ok(!types.includes('praca'), 'wojna: praca NIE jest dostępnym typem formularza Dodaj');
    ok(types.includes('zywnosc'), 'wojna: zywnosc dalej dostępna (nie waluta wojenna)');

    const zlotoItem = { typ: 'zloto', id: 'zloto', ilosc: 20 };
    ok(
      basketItemEditAvailable(zlotoItem, 'give', baseCtx({ atWar: true }), 'trade', '14', undefined) === false,
      'wojna: pozycja zloto w koszyku NIE dostaje przycisku Edytuj (typ dziś niewybieralny)',
    );
    ok(
      basketItemEditAvailable(zlotoItem, 'give', baseCtx({ atWar: false }), 'trade', '14', undefined) === true,
      'pokój: pozycja zloto w koszyku DOSTAJE przycisk Edytuj',
    );
  }

  {
    // Tech po stronie "receive" wymaga Relacji >= progHandelRelacja (domyślnie 100).
    const belowThreshold = computeAvailableTypes('receive', baseCtx({ relacjaTotal: 40 }), 'trade', '14', undefined);
    ok(!belowThreshold.includes('tech'), 'Relacja 40 < 100: tech NIEDOSTĘPNY po stronie receive');
    const aboveThreshold = computeAvailableTypes('receive', baseCtx({ relacjaTotal: 150 }), 'trade', '14', undefined);
    ok(aboveThreshold.includes('tech'), 'Relacja 150 >= 100: tech dostępny po stronie receive');

    const techItem = { typ: 'tech', id: 'kolo' };
    ok(
      basketItemEditAvailable(techItem, 'receive', baseCtx({ relacjaTotal: 40 }), 'trade', '14', undefined) === false,
      'Relacja za niska: pozycja tech (receive) NIE dostaje przycisku Edytuj — uniknięty cichy swap typu',
    );
    ok(
      basketItemEditAvailable(techItem, 'give', baseCtx({ relacjaTotal: 40 }), 'trade', '14', undefined) === true,
      'tech po stronie give nie ma progu Relacji: Edytuj dostępny',
    );
  }

  {
    // Typy bez formularza edycji (zloze/surowiec_boolean/jednostka) — nigdy Edytuj, niezależnie od kontekstu.
    ok(
      basketItemEditAvailable({ typ: 'zloze', id: 'x' }, 'give', baseCtx(), 'trade', '14', undefined) === false,
      'zloze: brak formularza edycji (ITEM_EDIT_TYPES) -> Edytuj nigdy',
    );
    ok(
      basketItemEditAvailable({ typ: 'jednostka', id: 'x' }, 'give', baseCtx(), 'trade', '14', undefined) === false,
      'jednostka: brak formularza edycji -> Edytuj nigdy',
    );
  }

  try { fs.unlinkSync(entryFile); } catch (_) { /* ok */ }
  try { fs.unlinkSync(LEADER_PORTRAITS_STUB); } catch (_) { /* ok */ }
  try { fs.unlinkSync(BRAND_ASSETS_STUB); } catch (_) { /* ok */ }

  console.log(`\n${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
