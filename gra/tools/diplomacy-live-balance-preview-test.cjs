'use strict';
/**
 * P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA:
 * live panel „Wymiana" musi przyjmować wynik tej samej bramki PW co evaluator.
 *
 * Przed fixem renderPnBalancePanelFromBasket znał wyłącznie Relację i kwoty.
 * Przy niskiej chęci partnera pokazywał dodatni bilans relacyjny, mimo że
 * handelFairnessGate podnosił próg i odrzucał identyczną ofertę. Test sprawdza
 * zarówno ścieżkę odrzuconą, jak i ścieżkę po edycji koszyka, która przechodzi.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const srcDir = path.resolve(__dirname, '..', 'src');
const entry = path.join(srcDir, '.dip-live-balance-entry.ts');
const bundle = path.join(__dirname, '.dip-live-balance-bundle.cjs');
fs.writeFileSync(entry, `
  export { renderPnBalancePanelFromBasket } from './ui/diplomacyAcceptanceBalance';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: bundle,
  absWorkingDir: srcDir,
  logLevel: 'silent',
});

const { renderPnBalancePanelFromBasket } = require(bundle);
let pass = 0;
let fail = 0;
function ok(condition, label) {
  if (condition) pass++;
  else {
    fail++;
    console.error('FAIL:', label);
  }
}

const rel = 44.9;
const stalePreview = renderPnBalancePanelFromBasket(
  221,
  80,
  rel,
  'Wymiana',
  { accepted: false, pwBalance: -9 },
);
ok(stalePreview.includes('da-pn-balance-bar no'), 'N-E1: odrzucona bramka koloruje panel na czerwono');
ok(stalePreview.includes('−9') || stalePreview.includes('-9'), 'N-E1: panel pokazuje dokładny bilans z bramki (-9 PW)');
ok(stalePreview.includes('fair min 230'), 'N-E1: panel pokazuje próg wynikający z bramki (221 - (-9) = 230 PW)');
ok(stalePreview.includes('Brakuje 9 PW'), 'N-E1: komunikat nie udaje nadwyżki przy odrzuceniu');

const editedPreview = renderPnBalancePanelFromBasket(
  93,
  80,
  rel,
  'Wymiana',
  { accepted: true, pwBalance: 13 },
);
ok(editedPreview.includes('da-pn-balance-bar ok'), 'edycja koszyka: przechodząca bramka koloruje panel na zielono');
ok(editedPreview.includes('+13'), 'edycja koszyka: panel odświeża bilans do nowej oferty (+13 PW)');
ok(editedPreview.includes('fair min 80'), 'edycja koszyka: panel odświeża próg do aktualnej bramki');

const tradeBasketSource = fs.readFileSync(
  path.join(srcDir, 'ui', 'diplomacyTradeBasket.ts'),
  'utf8',
);
ok(
  tradeBasketSource.includes('ctx.tradeFairnessPreview?.(givePn ?? 0, receivePn ?? 0)'),
  'źródło: render koszyka przekazuje aktualne kwoty do callbacku pełnej bramki',
);

try { fs.unlinkSync(entry); } catch (_) { /* ignore */ }
try { fs.unlinkSync(bundle); } catch (_) { /* ignore */ }

console.log(`diplomacy-live-balance-preview-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
