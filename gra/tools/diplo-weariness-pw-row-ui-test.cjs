'use strict';
/**
 * diplo-weariness-pw-row-ui-test.cjs -- R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1, runda 2 (test UI wiersza Z).
 *   (u1) wearinessPwRowHtml(undefined | 0) = '' (brak wiersza przy braku zmęczenia w bilansie);
 *   (u2) wearinessPwRowHtml(125, info) pokazuje „Zmęczenie wojną +125 PW";
 *   (u3) tooltip (atrybut title) podaje tury wojny, utracone miasta i procent zmęczenia z info;
 *   (u4) renderPnBalancePanelHtml przenosi wiersz Z do kolumny „Oni oddają" (responderPreview.wearinessPw).
 * Run: node tools/diplo-weariness-pw-row-ui-test.cjs
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
  "export { wearinessPwRowHtml, renderPnBalancePanelHtml, balancePanelDataFromRows } from './ui/diplomacyAcceptanceBalance';",
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

const info = { turnsAtWar: 13, lostCities: 2, level: 0.65 };
check('(u1) brak zmęczenia (undefined) => pusty wiersz', U.wearinessPwRowHtml(undefined) === '');
check('(u1) zero zmęczenia => pusty wiersz', U.wearinessPwRowHtml(0, info) === '');

const html = U.wearinessPwRowHtml(125, info);
check('(u2) etykieta „Zmęczenie wojną (AI) +125 PW"', html.includes('Zmęczenie wojną (AI) +125 PW'), html);
check('(u3) tooltip: tury wojny 13', /title="[^"]*tury wojny 13/.test(html), html);
check('(u3) tooltip: utracone miasta 2', /title="[^"]*utracone miasta 2/.test(html), html);
check('(u3) tooltip: zmęczenie 65%', /title="[^"]*zmęczenie 65%/.test(html), html);

// (u4) panel z responderPreview.wearinessPw trafia do kolumny „Oni oddają" — minimalny PnBalancePanelData.
const panel = {
  actionLabel: 'Pokój', myOfferPn: 0, theirOfferPn: 0,
  theirBalance: { mode: 'treaty', pw: 0 }, myBalance: { mode: 'treaty', pw: 0 },
  canAccept: true, extraOnTable: 0, responderPreview: { accepted: true, wearinessPw: 125, wearinessInfo: info },
};
let panelHtml = '';
try { panelHtml = U.renderPnBalancePanelHtml(panel); } catch (e) { panelHtml = 'ERR ' + e.message; }
check('(u4) panel zawiera wiersz Z z tooltipem', panelHtml.includes('Zmęczenie wojną (AI) +125 PW') && panelHtml.includes('tury wojny 13'), panelHtml.slice(0, 300));

// (u5) kierunek AI->gracz (zarzut 1 r2): wiersz Z z side 'player' trafia do kolumny „My oddajemy" (przed „Oni oddają"), z etykieta (gracz).
const playerPanel = Object.assign({}, panel, { responderPreview: { accepted: true, wearinessPw: 80, wearinessSide: 'player', wearinessInfo: info } });
let playerHtml = '';
try { playerHtml = U.renderPnBalancePanelHtml(playerPanel); } catch (e) { playerHtml = 'ERR ' + e.message; }
const rowAt = playerHtml.indexOf('Zmęczenie wojną (gracz) +80 PW');
const mineAt = playerHtml.indexOf('<span class="da-pn-bal-lbl">My oddajemy</span>');
const theirAt = playerHtml.indexOf('<span class="da-pn-bal-lbl">Oni oddają</span>');
check('(u5) side player: wiersz „Zmęczenie wojną (gracz) +80 PW" w kolumnie My (przed Oni oddają)', rowAt > mineAt && rowAt > -1 && rowAt < theirAt, playerHtml.slice(0, 300));
check('(u5) side player: brak wiersza (AI) w kolumnie Oni', !playerHtml.includes('Zmęczenie wojną (AI) +80 PW'), playerHtml.slice(0, 300));
check('(u5) side ai (domyślnie): wiersz (AI) w kolumnie Oni', U.wearinessPwRowHtml(125, info).includes('(AI)') && panelHtml.indexOf('Zmęczenie wojną (AI) +125 PW') > panelHtml.indexOf('<span class="da-pn-bal-lbl">Oni oddają</span>'), panelHtml.slice(0, 300));

console.log(`\ndiplo-weariness-pw-row-ui-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
