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
  effectiveNastawienieScores,
  resolveFormalDiplomaticStatus,
  respektTooltipPl,
  treatyDisplayLabel,
  activeTreatyLabelsForPair,
  formatDiploCivListLines,
  formatDiploPlayerSummaryLines,
  formatRecruitsUnitsPart,
  RECRUITS_UNITS_TOOLTIP_PL,
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
  relationStatus: 'sojusz', allianceFormalKind: 'wojskowy', hasNap: false, hasTrade: false, contactEstablished: true,
});
ok(ally.kind === 'sojusz' && ally.label === 'Sojusz wojskowy', 'formal: sojusz wojskowy');

const allyDef = mod.resolveFormalDiplomaticStatus({
  relationStatus: 'pokoj', allianceFormalKind: 'obronny', hasNap: false, hasTrade: false, contactEstablished: true,
});
ok(allyDef.kind === 'sojusz' && allyDef.label === 'Sojusz obronny', 'formal: sojusz obronny');

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
ok(mod.nastawienieLabelFromScore(74, 54, { atWar: true }) === 'Wrogi', 'nastawienie: wojna → Wrogi mimo wysokiego score');
ok(mod.effectiveNastawienieScores(74, 54).zaufanie === 74, 'effective scores: prawdziwa wartość Z (bez obcięcia wojną)');
ok(mod.effectiveNastawienieScores(74, 54).respekt === 54, 'effective scores: prawdziwa wartość R (bez obcięcia wojną)');

ok(mod.treatyDisplayLabel('pakt_nieagresji') === 'Pakt nieagresji', 'etykieta: NAP');
ok(mod.treatyDisplayLabel('sojusz_pelny') === 'Sojusz wojskowy', 'etykieta: wojskowy');
ok(mod.treatyDisplayLabel('sojusz_defensywny') === 'Sojusz obronny', 'etykieta: obronny');
ok(mod.treatyDisplayLabel('umowa_szlakow') === 'Traktat handlowy', 'etykieta: traktat handlowy');
ok(mod.treatyDisplayLabel('umowa_handlowa') === 'Umowa handlowa', 'etykieta: legacy handel');
const labels = mod.activeTreatyLabelsForPair([
  { id: 't1', rodzaj: 'pakt_nieagresji', strony: [0, 2], wygasaTura: 50 },
  { id: 't2', rodzaj: 'umowa_handlowa', strony: [0, 2], wygasaTura: null },
  { id: 't3', rodzaj: 'pakt_nieagresji', strony: [0, 3], wygasaTura: 50 },
], 0, 2);
ok(labels.length === 2 && labels.includes('Pakt nieagresji') && labels.includes('Umowa handlowa'),
  'activeTreatyLabelsForPair: tylko para 0↔2');

// R-DYP-PAKIET-USUN (2026-08-08, Maciej): ilosc to sztuki wprost — bez ×10 pakietu.
const woodPerTurn = mod.formatBasketItemBrief(
  { typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 },
  { perTurn: true, turns: 10 },
);
ok(woodPerTurn.includes('1 Drewno na turę'), 'surowiec per turn: ilość na turę');
ok(woodPerTurn.includes('łącznie 10 Drewno przez 10 tur'), 'surowiec per turn: suma');

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

// R-WEB-DIPLO-CITIZENS-VS-RECRUITS-SEPARATE-Q1 (dodatek 2): wiersz „Rekruci" w uproszczonej karcie listy.
const nb = (t) => t.replace(/\u00a0/g, ' ');
ok(nb(mod.formatRecruitsUnitsPart(1234, 5678)) === 'Rekruci: 1 234 / 5 678 jedn.', 'recruits part: format bieżąca / maks. jedn.');
ok(nb(mod.formatRecruitsUnitsPart(-3, 0)) === 'Rekruci: 0 / 0 jedn.', 'recruits part: clamp <0');
const civLines = mod.formatDiploCivListLines({
  theirPopulation: 98, theirArmyCount: 4, theirRecruitsUnits: 12, theirRecruitsUnitsMax: 40,
});
ok(civLines.detailLine.includes('Armia: 4') && nb(civLines.detailLine).includes('Rekruci: 12 / 40'),
  'civ list: wiersz Rekruci obok Obywatele/Armia');
ok(!mod.formatDiploCivListLines({ theirPopulation: 98 }).detailLine.includes('Rekruci'),
  'civ list: brak danych rekrutów -> brak wiersza');
const plLines = mod.formatDiploPlayerSummaryLines({
  militaryPower: 10, population: 50, armyCount: 2, recruitsUnits: 7, recruitsUnitsMax: 9,
});
ok(nb(plLines.detailLine).includes('Rekruci: 7 / 9 jedn.'), 'player summary: wiersz Rekruci');
ok(!plLines.detailLine.includes('Ludność') && plLines.detailLine.includes('Obywatele: 50'), 'player summary: Obywatele zamiast Ludność');
ok(civLines.detailLine.includes('Obywatele: 98') && !civLines.detailLine.includes('Ludność'), 'civ list: Obywatele zamiast Ludność');
ok(mod.RECRUITS_UNITS_TOOLTIP_PL.includes('rekrutEkw'), 'tooltip Rekruci: przeliczenie jak rekrutEkw');
// Ustawienie atrybutu title w diploListHud.ts (obie ścieżki: playerSummary + wpis obcej cywilizacji).
// Guard źródłowy (nie DOM): liczy przypisania tooltipu; oczekiwane dokładnie 2.
const HUD_SRC = fs.readFileSync(path.resolve(SRC, 'ui', 'diploListHud.ts'), 'utf8');
const hudTitleAssigns = HUD_SRC.split('stats.title = RECRUITS_UNITS_TOOLTIP_PL').length - 1;
ok(hudTitleAssigns === 2, 'diploListHud: tooltip Rekruci ustawiany w obu ścieżkach (playerSummary + obca cywilizacja), liczba=' + hudTitleAssigns);

try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }

console.log(`[diplomacy-display-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
