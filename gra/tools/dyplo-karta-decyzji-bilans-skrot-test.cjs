'use strict';
/**
 * dyplo-karta-decyzji-bilans-skrot-test.cjs
 *
 * TEMAT: P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1.
 *
 * Testuje REALNE, produkcyjne funkcje formatujące (diplomacy-display.ts) nowym opcjonalnym
 * polem `BasketItemFormatCtx.omitTotal` / `formatNegotiationDealPlayerSummary(payload,
 * incoming, { omitTotal })`. Scenariusz dokładnie ze zrzutu właściciela: miasto-państwo
 * kupuje 20 Kamień/turę przez 10 tur (kierunek='zakup' w cmd AI — payload.receiveItems =
 * surowiec, payload.giveItems = zapłata).
 *
 * GOAL 1/2 (main.ts:13720 karta kompaktowa, main.ts:15039 toast): omitTotal=true — BEZ
 * „(łącznie X przez Y tur)".
 * GOAL 3 (main.ts:15485 wiersz stołu negocjacji, diplomacyTradeBasket.ts kreator koszyka):
 * bez zmian — omitTotal nieustawione/false zachowuje dzisiejszy tekst 1:1 (regresja).
 *
 * Run (z gra/): node tools/dyplo-karta-decyzji-bilans-skrot-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dyplo-bilans-skrot-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dyplo-bilans-skrot-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  formatBasketItemBrief,
  formatBasketListBrief,
  formatNegotiationDealPlayerSummary,
  splitNegotiationDealPlayerSides,
} from './game/diplomacy-display';
export { clampBasketItemsToAffordable } from './game/diplomacy-ai-balance';
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

try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }

const mod = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(cond, msg, detail) {
  if (cond) { pass++; console.log('  OK:', msg); return; }
  fail++;
  console.error('  FAIL:', msg, detail !== undefined ? JSON.stringify(detail) : '');
}

console.log('dyplo-karta-decyzji-bilans-skrot-test — start');

// --- Scenariusz ze zrzutu właściciela: miasto-państwo kupuje 20 Kamień/turę × 10 tur,
// płacąc 12 ¤/turę (fair @Relacja=50, wartość realna z diplomacyFairGivePn/diplomacyPnSurowiecIlosc).
const payloadZakupPlatny = {
  giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 12 }],
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 20 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
};

// --- KRYTERIUM 1 (GOAL 1): karta kompaktowa (omitTotal=true) — BEZ "łącznie".
const compact = mod.formatNegotiationDealPlayerSummary(payloadZakupPlatny, true, { omitTotal: true });
ok(compact.includes('Oferujemy: 20 Kamień na turę'), 'kompakt: "Oferujemy: 20 Kamień na turę" obecne', compact);
ok(!compact.includes('łącznie'), 'kompakt: BRAK słowa "łącznie"', compact);
ok(compact.includes('Oferują: 12 ¤ na turę'), 'kompakt: "Oferują: 12 ¤ na turę" obecne, bez sumy', compact);
ok(!/\(łącznie/.test(compact), 'kompakt: brak segmentu "(łącznie ...)" regexem', compact);

// --- KRYTERIUM 2 (GOAL 3 — regresja): bez omitTotal (dzisiejsze wywołanie stołu negocjacji /
// kreatora koszyka) — TA SAMA treść co przed tematem, "łącznie" NADAL obecne.
const detailNoOpts = mod.formatNegotiationDealPlayerSummary(payloadZakupPlatny, true);
ok(detailNoOpts.includes('łącznie 120 ¤ przez 10 tur'), 'szczegóły (bez opts): "łącznie 120 ¤ przez 10 tur" obecne (regresja)', detailNoOpts);
ok(detailNoOpts.includes('łącznie 200 Kamień przez 10 tur'), 'szczegóły (bez opts): "łącznie 200 Kamień przez 10 tur" obecne (regresja)', detailNoOpts);

const detailOmitFalse = mod.formatNegotiationDealPlayerSummary(payloadZakupPlatny, true, { omitTotal: false });
ok(detailOmitFalse === detailNoOpts, 'omitTotal:false === brak opts (identyczny tekst)', { detailOmitFalse, detailNoOpts });

// --- KRYTERIUM 3 (GOAL 4, dowód "Oferują: —"): scenariusz z payload.giveItems PUSTYM
// (dokładnie to, co main.ts::clampNegotiationPayloadToRealResources faktycznie produkuje,
// gdy skarbiec miasta-państwa < wymagana rezerwa na 10 tur — patrz raport Operatora, GOAL 4).
const payloadZakupBezZaplaty = {
  giveItems: undefined,
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 20 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
};
const compactBezZaplaty = mod.formatNegotiationDealPlayerSummary(payloadZakupBezZaplaty, true, { omitTotal: true });
ok(compactBezZaplaty.includes('Oferują: —'), 'GOAL 4: giveItems pusty w payloadzie -> "Oferują: —" (formatowanie POPRAWNE, dane faktycznie puste)', compactBezZaplaty);
const splitBezZaplaty = mod.splitNegotiationDealPlayerSides(payloadZakupBezZaplaty, true);
ok(splitBezZaplaty !== null && splitBezZaplaty.theyOffer.length === 0, 'GOAL 4: splitNegotiationDealPlayerSides.theyOffer=[] — split NIE gubi danych, danych po prostu nie ma w payloadzie', splitBezZaplaty);

// --- KRYTERIUM 3B (GOAL 4, poprawka po zarzucie Evaluatora runda 1): ŻYWE wywołanie
// realnej, eksportowanej funkcji produkcyjnej `clampBasketItemsToAffordable`
// (main.ts:8830 wywołuje ją identycznie wewnątrz clampNegotiationPayloadToRealResources)
// na zrekonstruowanym scenariuszu — miasto-państwo ma skarbiec=5 ¤, płatność
// 12 ¤/turę × 10 tur wymaga rezerwy 120 ¤. NIE zakładamy giveItems=[] ręcznie —
// wynik clampu jest faktycznym, zaobserwowanym payload.giveItems.
const ownerCtxUboga = { gold: 5, praca: 0, foodReserve: 0, stock: {}, pakietWielkosc: 1 };
const giveItemsPoClampie = mod.clampBasketItemsToAffordable(
  [{ typ: 'zloto', id: 'zloto', ilosc: 12 }],
  ownerCtxUboga,
  10,
  'per_turn',
);
ok(Array.isArray(giveItemsPoClampie) && giveItemsPoClampie.length === 0,
  'GOAL 4 ŻYWY DOWÓD: clampBasketItemsToAffordable(gold:5, 12/turę×10 tur) faktycznie zwraca [] (nie założenie — realny wynik funkcji)',
  giveItemsPoClampie);

const payloadZakupRealnieClampowany = {
  giveItems: giveItemsPoClampie, // <- realny wynik clampu, nie ręcznie wpisane undefined
  receiveItems: [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 20 }],
  resourceTradeMode: 'per_turn',
  turns: 10,
};
const compactRealnyClamp = mod.formatNegotiationDealPlayerSummary(payloadZakupRealnieClampowany, true, { omitTotal: true });
ok(compactRealnyClamp.includes('Oferują: —'),
  'GOAL 4 ŻYWY DOWÓD: payload.giveItems z realnego clampBasketItemsToAffordable -> "Oferują: —" (łańcuch clamp->format zweryfikowany end-to-end)',
  compactRealnyClamp);

// Kontrola: skarbiec WYSTARCZAJĄCY (gold:200) -> clamp NIE czyści pozycji, "Oferują: —" nie występuje.
const giveItemsBogata = mod.clampBasketItemsToAffordable(
  [{ typ: 'zloto', id: 'zloto', ilosc: 12 }],
  { ...ownerCtxUboga, gold: 200 },
  10,
  'per_turn',
);
ok(giveItemsBogata.length === 1 && giveItemsBogata[0].ilosc === 12,
  'GOAL 4 kontrola: skarbiec=200 (>=120 wymagane) -> clamp zachowuje pozycję 12 ¤/turę bez okrojenia',
  giveItemsBogata);

// --- KRYTERIUM 4: pozycja zloto (jednorazowa, perTurn=false) i surowiec bez perTurn —
// omitTotal nie ma efektu (brak segmentu "łącznie" w ogóle, bo perTurn=false) — brak regresji
// na wywołaniach jednorazowych (umowa jednorazowa, GOAL 5 "zero zmian w wycenie/logice").
const jednorazowy = mod.formatBasketItemBrief({ typ: 'zloto', id: 'zloto', ilosc: 50 }, { omitTotal: true });
ok(jednorazowy === 'jednorazowo 50 ¤', 'jednorazowa pozycja złota nietknięta przez omitTotal', jednorazowy);

console.log('\n' + pass + '/' + (pass + fail) + ' PASS');
process.exit(fail > 0 ? 1 : 0);
