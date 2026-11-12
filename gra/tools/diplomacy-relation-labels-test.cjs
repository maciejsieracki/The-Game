'use strict';
/**
 * diplomacy-relation-labels-test.cjs — R-WEB-UI-DIPLO-RELATION-LABELS-AND-TONE-Q1.
 * Wiersz „Wpływ Relacji na deal” podpisuje Relację jako perspektywę AI („Relacja z perspektywy AI …”),
 * a wariant 'incomingAccepted' (oferta AI→gracz, „Możesz przyjąć”) jest neutralny: bez klasy `worse`
 * i bez „Twoja strona słabsza”. Wariant 'treaty' zachowuje czerwień przy niskiej Relacji.
 * Run: node tools/diplomacy-relation-labels-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-rel-labels-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-rel-labels-bundle.cjs');

function cleanupTemp() {
  try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
}
process.on('exit', cleanupTemp);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => process.exit(128));
}

fs.writeFileSync(ENTRY, `
export { renderPnBalancePanelHtml, renderRelationDealModRowHtml, RELATION_DEAL_PERSPECTIVE_NOTE } from './ui/diplomacyAcceptanceBalance';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
});

const mod = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('[FAIL]', msg);
}

function basketBalance(relCurrent, net) {
  return {
    offerPn: 0, demandPn: 0, fairMinPn: 0, balancePn: net, treatyBasePn: 0, relCurrent,
    mode: 'basket', statusLabel: net >= 0 ? 'OK' : 'Brakuje', accepted: net >= 0,
  };
}

function panel(direction, canAccept, relCurrent, net) {
  return {
    actionLabel: 'Wymiana', direction, myOfferPn: 40, theirOfferPn: 10,
    theirBalance: basketBalance(relCurrent, net), canAccept,
  };
}

// 1. Etykieta perspektywy AI w wierszu wpływu (wariant treaty, Relacja 11,6).
const row116 = mod.renderRelationDealModRowHtml(11.6, 'treaty');
ok(row116.includes('Relacja z perspektywy AI 11,6'), 'wiersz wpływu: etykieta „Relacja z perspektywy AI 11,6”');
ok(!/<strong>Relacja 11,6<\/strong>/.test(row116), 'wiersz wpływu: stara etykieta „Relacja 11,6” usunięta');
ok(row116.includes('Wpływ Relacji na deal'), 'wiersz wpływu: nazwa wiersza bez zmian');
ok(row116.includes(mod.RELATION_DEAL_PERSPECTIVE_NOTE), 'tooltip wiersza zawiera dopisek o perspektywie AI');

// 2. Wariant trade z Relacją ≥100 — etykieta z perspektywą AI.
const rowTrade = mod.renderRelationDealModRowHtml(120, 'trade');
ok(rowTrade.includes('Relacja z perspektywy AI ≥100'), 'trade ≥100: etykieta z perspektywą AI');

// 3. incomingAccepted przy Relacji poniżej 100 (kara po stronie gracza): neutralny ton, bez „słabsza”.
const accNeg = mod.renderRelationDealModRowHtml(52, 'incomingAccepted');
ok(/class="da-pn-rel-mod neutral"/.test(accNeg), 'incomingAccepted @52: klasa neutral');
ok(!/class="da-pn-rel-mod worse"/.test(accNeg), 'incomingAccepted @52: brak klasy worse (czerwień)');
ok(!accNeg.includes('słabsza'), 'incomingAccepted @52: brak „Twoja strona słabsza”');
ok(accNeg.includes('wymiana symetryczna'), 'incomingAccepted @52: tekst „wymiana symetryczna”');
ok(accNeg.includes('Relacja z perspektywy AI 52'), 'incomingAccepted @52: etykieta perspektywy AI');

// 3b. incomingAccepted przy Relacji >100 (dotąd 'better' / „Twoja strona silniejsza”): decyzja — ton neutralny
// i „wymiana symetryczna” obowiązują dla całego wariantu incomingAccepted (dispatch: bez „strona słabsza”).
const accPos = mod.renderRelationDealModRowHtml(120, 'incomingAccepted');
ok(/class="da-pn-rel-mod neutral"/.test(accPos), 'incomingAccepted @120: klasa neutral (decyzja: cały wariant neutralny)');
ok(!/class="da-pn-rel-mod better"/.test(accPos), 'incomingAccepted @120: brak klasy better');
ok(accPos.includes('wymiana symetryczna') && !accPos.includes('silniejsza'), 'incomingAccepted @120: „wymiana symetryczna”, bez „silniejsza”');
ok(accPos.includes('Relacja z perspektywy AI 120'), 'incomingAccepted @120: etykieta perspektywy AI');

// 3c. Tooltip incomingAccepted nie mówi „trzeba dopłacić” (sprzeczne z „Możesz przyjąć”); treaty zachowuje pełny tooltip.
const accTitle = (accNeg.match(/title="([^"]*)"/) || [])[1] || '';
ok(accTitle.length > 0 && !accTitle.includes('dopłacić'), 'incomingAccepted @52: tooltip bez „trzeba dopłacić”');
ok(accTitle.includes('Relacje:'), 'incomingAccepted @52: tooltip zawiera wartość wpływu');

// 4. Wariant treaty przy tej samej Relacji zachowuje czerwień (bez zmiany zachowania).
const treatyNeg = mod.renderRelationDealModRowHtml(52, 'treaty');
ok(/class="da-pn-rel-mod worse"/.test(treatyNeg), 'treaty @52: klasa worse zachowana');
ok(treatyNeg.includes('Twoja strona słabsza'), 'treaty @52: tekst „Twoja strona słabsza” zachowany');
const treatyTitle = (treatyNeg.match(/title="([^"]*)"/) || [])[1] || '';
ok(treatyTitle.includes('trzeba dopłacić'), 'treaty @52: tooltip zachowuje „trzeba dopłacić”');

// 5. Panel PW: AI→gracz z Przyjmij aktywnym przy ujemnym wpływie — brak czerwieni w wierszu.
const incomingPanel = mod.renderPnBalancePanelHtml(panel('incoming', true, 52, 5));
ok(incomingPanel.includes('Możesz przyjąć'), 'panel incoming+accept: werdykt „Możesz przyjąć”');
ok(!incomingPanel.includes('da-pn-rel-mod worse'), 'panel incoming+accept @52: brak czerwonego wiersza Relacji');
ok(!incomingPanel.includes('słabsza'), 'panel incoming+accept @52: brak „słabsza”');

// 6. Gracz→AI (own) przy tej samej Relacji — dotychczasowa czerwień zostaje.
const ownPanel = panel('own', true, 52, -3);
ownPanel.awaitingAiResponse = true;
const ownHtml = mod.renderPnBalancePanelHtml(ownPanel);
ok(ownHtml.includes('da-pn-rel-mod worse') || ownHtml.includes('musisz dać więcej'),
  'panel own @52: wariant nieneutralny zachowany');

console.log(`diplomacy-relation-labels-test: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
