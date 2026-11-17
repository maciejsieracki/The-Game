'use strict';
/**
 * diplo-weariness-pw-row-ui-test.cjs -- R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (historycznie wiersz Z „Zmeczenie wojna +N PW”).
 * Panel dyplomacji / audiencja pokazuja AKTUALNA cene pokoju (peacePriceRowHtml; jedna funkcja ceny wearinessPeaceCashPn):
 *   (u1) brak informacji (undefined / brak cenaPokojuPn) => pusty wiersz;
 *   (u2) „Cena pokoju: 3 900 PN (zmeczenie 65%)”; tooltip: tury wojny, utracone miasta, zmeczenie;
 *   (u3) cena 0 => „pokoj bez oddawania miast”;
 *   (u4) renderPnBalancePanelHtml z responderPreview.wearinessInfo zawiera wiersz ceny (obie strony: ai/player);
 *   (u5) cena w panelu maleje z poziomem zmeczenia (6000 -> 0) — liczby z funkcji produkcyjnej.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', `.pw-row-ui-entry-${process.pid}.ts`);
const BUNDLE = path.resolve(__dirname, `.pw-row-ui-${process.pid}.cjs`);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

fs.writeFileSync(ENTRY, [
  "export { peacePriceRowHtml, renderPnBalancePanelHtml, balancePanelDataFromRows } from './ui/diplomacyAcceptanceBalance';\nexport * as W from './game/war-weariness';",
  '',
].join('\n'), 'utf8');
let U;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
  });
  U = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }
}

const info = { turnsAtWar: 13, lostCities: 2, level: 0.65, cenaPokojuPn: 2100 };
check('(u1) brak informacji (undefined) => pusty wiersz', U.peacePriceRowHtml(undefined) === '');
check('(u1) brak cenaPokojuPn => pusty wiersz', U.peacePriceRowHtml({ turnsAtWar: 1, lostCities: 0, level: 0.1 }) === '');

const html = U.peacePriceRowHtml(info);
check('(u2) etykieta „Cena pokoju: 2100 PN (zmęczenie 65%)” (separator tysięcy wg formatLiczbaPl)', /Cena pokoju: 2[\s\u00a0.]?100 PN \(zmęczenie 65%\)/.test(html), html);
check('(u2) tooltip: tury wojny 13', /title="[^"]*tury wojny 13/.test(html), html);
check('(u2) tooltip: utracone miasta 2', /title="[^"]*utracone miasta 2/.test(html), html);
check('(u2) tooltip: zmęczenie 65%', /title="[^"]*zmęczenie 65%/.test(html), html);
check('(u3) cena 0 => bez oddawania miast', /Cena pokoju: 0 PN[^<]*bez oddawania miast/.test(U.peacePriceRowHtml({ turnsAtWar: 40, lostCities: 0, level: 1, cenaPokojuPn: 0 })));

function panelFor(i, side) {
  return {
    actionLabel: 'Pokój', myOfferPn: 0, theirOfferPn: 0,
    theirBalance: { mode: 'treaty', pw: 0 }, myBalance: { mode: 'treaty', pw: 0 },
    canAccept: true, extraOnTable: 0, responderPreview: { accepted: true, wearinessSide: side, wearinessInfo: i },
  };
}
for (const side of ['ai', 'player']) {
  let panelHtml = '';
  try { panelHtml = U.renderPnBalancePanelHtml(panelFor(info, side)); } catch (e) { panelHtml = 'ERR ' + e.message; }
  check(`(u4) panel (side ${side}) zawiera wiersz „Cena pokoju” z tooltipem`, /Cena pokoju: 2[\s\u00a0.]?100 PN/.test(panelHtml) && panelHtml.includes('tury wojny 13'), panelHtml.slice(0, 300));
  check(`(u4) panel (side ${side}) nie zawiera starego wiersza „Zmęczenie wojną +N PW”`, !/Zmęczenie wojną \((AI|gracz)\) \+/.test(panelHtml));
}

// (u5) cena z funkcji produkcyjnej: tura 0 => 6000, tura 20 => 3000, tura 40 => 0 (malejaca)
const W = U.W;
const prices = [0, 20, 40].map((t) => W.wearinessPeaceCashPn(W.warWearinessLevel({ turnsAtWar: t, lostCitiesTotal: 0 })));
check('(u5) cena maleje 6000 -> 3000 -> 0 (tury 0/20/40)', JSON.stringify(prices) === JSON.stringify([6000, 3000, 0]), prices);
for (const t of [0, 20, 40]) {
  const lvl = W.warWearinessLevel({ turnsAtWar: t, lostCitiesTotal: 0 });
  const row = U.peacePriceRowHtml({ turnsAtWar: t, lostCities: 0, level: lvl, cenaPokojuPn: W.wearinessPeaceCashPn(lvl) });
  check(`(u5) wiersz w turze ${t} pokazuje cene z funkcji`, new RegExp('Cena pokoju: ' + (t === 0 ? '6[\s\u00a0.]?000' : t === 20 ? '3[\s\u00a0.]?000' : '0') + ' PN').test(row), row);
}

console.log(`\ndiplo-weariness-pw-row-ui-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
