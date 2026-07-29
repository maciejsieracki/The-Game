'use strict';
/**
 * diplomacy-display-test.cjs — tagi + stosunek Mocy (D3-UX BBBB).
 * Run: node tools/diplomacy-display-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-display-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-display-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  diplomacyPersonalityTags,
  formatPowerRatioLabel,
  formatPowerRelationLine,
  formatBasketItemBrief,
  formatNegotiationDealParts,
  formatNegotiationDealPlayerSummary,
  formatNegotiationDealSummary,
  splitNegotiationDealPlayerSides,
  nastawienieLabelFromScore,
  resolveFormalDiplomaticStatus,
  respektTooltipPl,
  treatyDisplayLabel,
  activeTreatyLabelsForPair,
} from './game/diplomacy-display';
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

const tagsGrecy = mod.diplomacyPersonalityTags('grecy');
ok(tagsGrecy.length >= 1 && tagsGrecy.length <= 3, 'grecy: 1–3 tagi');
ok(tagsGrecy.every(t => typeof t === 'string' && !/\d/.test(t)), 'tagi bez cyfr');

const tagsZulusi = mod.diplomacyPersonalityTags('zulusi');
ok(tagsZulusi.includes('Samotny wilk') || tagsZulusi.includes('Wojowniczy'), 'zulusi: tag ekstremalny');

ok(mod.formatPowerRatioLabel(4000, 2000) === '2:1', 'ratio 4000:2000 = 2:1');
ok(mod.formatPowerRatioLabel(3020, 3020) === '1:1', 'ratio parytet 1:1');

const line = mod.formatPowerRelationLine(4000, 2000);
ok(line.respekt === 67, 'respekt 4000 vs 2000 = 67');
ok(line.ratioLabel === '2:1', 'line ratio 2:1');

ok(mod.respektTooltipPl().includes('Respekt'), 'tooltip PL');

const war = mod.resolveFormalDiplomaticStatus({
  relationStatus: 'wojna', hasAlliance: false, hasNap: false, hasTrade: false, contactEstablished: true,
});
ok(war.kind === 'wojna' && war.label === 'Wojna', 'formal: wojna');

const ally = mod.resolveFormalDiplomaticStatus({
  relationStatus: 'sojusz', hasAlliance: true, hasNap: false, hasTrade: false, contactEstablished: true,
});
ok(ally.kind === 'sojusz', 'formal: sojusz');

const peace = mod.resolveFormalDiplomaticStatus({
  relationStatus: 'pokoj', hasAlliance: false, hasNap: false, hasTrade: false, contactEstablished: true,
});
ok(peace.kind === 'pokoj' && peace.label === 'Pokój', 'formal: pokój bez (neutralne)');

const trade = mod.resolveFormalDiplomaticStatus({
  relationStatus: 'pokoj', hasAlliance: false, hasNap: false, hasTrade: true, contactEstablished: true,
});
ok(trade.kind === 'handel' && trade.label === 'Traktat handlowy', 'formal: traktat handlowy');

ok(mod.nastawienieLabelFromScore(10, 10) === 'Wrogi', 'nastawienie: wrogi z score');
ok(mod.nastawienieLabelFromScore(25, 25) === 'Neutralny', 'nastawienie: neutralny z score');

ok(mod.treatyDisplayLabel('pakt_nieagresji') === 'Pakt nieagresji', 'etykieta: NAP');
ok(mod.treatyDisplayLabel('umowa_szlakow') === 'Traktat handlowy', 'etykieta: traktat handlowy');
ok(mod.treatyDisplayLabel('umowa_handlowa') === 'Umowa handlowa', 'etykieta: legacy handel');
const labels = mod.activeTreatyLabelsForPair([
  { id: 't1', rodzaj: 'pakt_nieagresji', strony: [0, 2], wygasaTura: 50 },
  { id: 't2', rodzaj: 'umowa_handlowa', strony: [0, 2], wygasaTura: null },
  { id: 't3', rodzaj: 'pakt_nieagresji', strony: [0, 3], wygasaTura: 50 },
], 0, 2);
ok(labels.length === 2 && labels.includes('Pakt nieagresji') && labels.includes('Umowa handlowa'),
  'activeTreatyLabelsForPair: tylko para 0↔2');

const woodPerTurn = mod.formatBasketItemBrief(
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 },
  { perTurn: true, turns: 10 },
);
ok(woodPerTurn.includes('10 Drewno na turę'), 'surowiec per turn: ilość na turę');
ok(woodPerTurn.includes('łącznie 100 Drewno przez 10 tur'), 'surowiec per turn: suma');

const goldOnce = mod.formatBasketItemBrief({ typ: 'zloto', id: 'zloto', ilosc: 21 }, { perTurn: false });
ok(goldOnce.includes('jednorazowo 21'), 'złoto jednorazowo');

const dealParts = mod.formatNegotiationDealParts({
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 21 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
}, { fromPlayerPerspective: true });
ok(dealParts && dealParts.giveLabel === 'Oni dają', 'deal parts: etykiety incoming');
ok(dealParts && dealParts.schedule === 'Wymiana co turę przez 10 tur', 'deal parts: harmonogram');

const playerSplit = mod.splitNegotiationDealPlayerSides({
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 21 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
}, true);
ok(playerSplit && playerSplit.weOffer.length === 1 && playerSplit.theyOffer.length === 1, 'player split: incoming');
ok(playerSplit && playerSplit.weOffer[0].typ === 'surowiec_ilosc', 'player split: we give wood');

const playerSummary = mod.formatNegotiationDealPlayerSummary({
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 21 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
}, true);
ok(playerSummary.startsWith('Oferujemy:'), 'player summary: Oferujemy');
ok(playerSummary.includes('Oferują:'), 'player summary: Oferują');

const legacyGoldSplit = mod.splitNegotiationDealPlayerSides({ goldOnce: 42 }, true);
ok(legacyGoldSplit && legacyGoldSplit.theyOffer.length === 1
  && legacyGoldSplit.theyOffer[0].typ === 'zloto' && legacyGoldSplit.theyOffer[0].ilosc === 42,
  'legacy goldOnce: incoming they offer gold');
ok(legacyGoldSplit && legacyGoldSplit.weOffer.length === 0, 'legacy goldOnce: incoming we offer nothing');

try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }

console.log(`[diplomacy-display-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
