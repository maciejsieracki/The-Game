'use strict';
/**
 * diplo-active-treaties-resource-deals-test.cjs — R-WEB-DIPLO-ACTIVE-TREATIES-RESOURCE-DEALS-Q1.
 * Zawarta CYKLICZNA umowa wymiany surowców (ze stanem) musi pojawić się w kolumnie
 * „Aktywne traktaty" z: partnerem, co/ile/za ile, częstotliwością i statusem OSTATNIEJ dostawy.
 * Po turze z brakiem surowca status = „nie dostarczono".
 * Usage (z gra/): node tools/diplo-active-treaties-resource-deals-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const entryFile = path.resolve(__dirname, '.diplo-active-treaties-entry.ts');
const BUNDLE = path.resolve(__dirname, '.diplo-active-treaties-bundle.cjs');
fs.writeFileSync(entryFile, `
export { treatiesColumnHtml } from '../src/ui/diplomacyAudience.ts';
export {
  cyclicDeliveryRecord, describeCyclicExchangeItem, cyclicExchangeFrequencyLabel, cyclicExchangeLinesForDeal,
} from '../src/game/diplomacy-cyclic-display.ts';
`);
let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

(async () => { try {
  await esbuild.build({
    entryPoints: [entryFile], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE,
    absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl' },
    plugins: [{
      name: 'stub-vite-raw-imports',
      setup(build) {
        build.onResolve({ filter: /\?raw$/ }, (a) => ({ path: a.path, namespace: 'raw-stub' }));
        build.onLoad({ filter: /.*/, namespace: 'raw-stub' }, () => ({ contents: 'export default "";', loader: 'js' }));
        // Vite-only `import.meta.glob(...)` -> pusty obiekt (Node nie ma Vite).
        build.onLoad({ filter: /\.ts$/ }, (a) => {
          const src = fs.readFileSync(a.path, 'utf8');
          if (!src.includes('import.meta.glob')) return null;
          return { contents: src.replace(/import\.meta\.glob\(/g, '((..._a) => ({}))('), loader: 'ts' };
        });
      },
    }],
  });
  const {
    treatiesColumnHtml, cyclicDeliveryRecord, cyclicExchangeFrequencyLabel, cyclicExchangeLinesForDeal,
  } = require(BUNDLE);

  // Umowa: gracz (0) dostarcza 3 Żelazo/turę Chińczykom (2) za 12 ¤/turę, do t.20.
  const item = { surowiecKey: 'zelazo', pakietyPerTura: 3, sellerOwnerId: 0, buyerOwnerId: 2, zaplataTyp: 'zloto', zaplataPerTura: 12 };
  const deal = { id: 'd1', rodzaj: 'umowa_wymiany', strony: [0, 2], wygasaTura: 20, zawartaTura: 10, handelSurowiecCykliczny: [item] };
  const build = (turn) => {
    const lines = cyclicExchangeLinesForDeal(deal, 0, 'Chińczycy');
    return treatiesColumnHtml({
      activeTreaties: [{
        id: deal.id, label: 'Umowa wymiany', sinceTurns: 2,
        exchanges: lines, frequencyLabel: cyclicExchangeFrequencyLabel(deal.wygasaTura, turn),
      }],
    }, undefined);
  };

  // 1) Przed pierwszym rozliczeniem
  let html = build(12);
  ok(html.includes('Umowa wymiany'), 'umowa widoczna w „Aktywne traktaty"');
  ok(!html.includes('Brak aktywnych traktatów'), 'brak komunikatu „Brak aktywnych traktatów"');
  ok(html.includes('Dostarczasz: 3 Żelazo na turę') && html.includes('Chińczycy') && html.includes('za 12 ¤ na turę'), 'co / ile / partner / za ile');
  ok(html.includes('co turę, pozostało 8 tur'), 'częstotliwość: pozostało N tur');
  ok(html.includes('data-exch-status="pending"'), 'status przed pierwszą dostawą = pending');

  // 2) Dostawa udana w t.12
  item.ostatniaDostawa = cyclicDeliveryRecord(12, true, false, false);
  html = build(12);
  ok(html.includes('✓ dostarczono w t.12') && html.includes('data-exch-status="ok"'), 'udana dostawa: ✓ dostarczono w t.12');

  // 3) Tura 13: brak surowca u dostawcy (gracza) -> nie dostarczono
  item.ostatniaDostawa = cyclicDeliveryRecord(13, false, true, false);
  html = build(13);
  ok(html.includes('✗ nie dostarczono w t.13 — brak surowca u Ciebie') && html.includes('data-exch-status="fail"'), 'brak surowca u mnie: ✗ nie dostarczono');

  // 4) Brak surowca u partnera (widok gracza jako kupującego)
  const item2 = { surowiecKey: 'drewno', pakietyPerTura: 5, sellerOwnerId: 2, buyerOwnerId: 0, zaplataTyp: 'zloto', zaplataPerTura: 4,
    ostatniaDostawa: cyclicDeliveryRecord(14, false, true, false) };
  const l2 = cyclicExchangeLinesForDeal({ ...deal, handelSurowiecCykliczny: [item2] }, 0, 'Chińczycy')[0];
  ok(l2.text.startsWith('Otrzymujesz: 5 Drewno na turę') && l2.statusText.includes('brak surowca u partnera'), 'brak surowca u partnera');

  // 5) Brak środków u kupującego
  const l3 = cyclicExchangeLinesForDeal({ ...deal, handelSurowiecCykliczny: [{ ...item, ostatniaDostawa: cyclicDeliveryRecord(15, false, false, true) }] }, 0, 'Chińczycy')[0];
  ok(l3.statusText.includes('partner nie miał środków'), 'brak środków u kupującego');

  // 6) Bezterminowo + umowa bez wymiany cyklicznej nie dostaje wierszy
  ok(cyclicExchangeFrequencyLabel(null, 5) === 'co turę, bezterminowo', 'bezterminowo');
  ok(cyclicExchangeLinesForDeal({ ...deal, handelSurowiecCykliczny: undefined }, 0, 'X').length === 0, 'inne traktaty bez wierszy wymiany');
  html = treatiesColumnHtml({ activeTreaties: [] }, undefined);
  ok(html.includes('Brak aktywnych traktatów'), 'pusta lista nadal pokazuje „Brak aktywnych traktatów"');
} finally {
  for (const f of [entryFile, BUNDLE]) { try { fs.unlinkSync(f); } catch {} }
}
console.log(`\n${pass} OK, ${fail} FAIL`); process.exit(fail ? 1 : 0); })().catch(e => { console.error(e); process.exit(1); });
