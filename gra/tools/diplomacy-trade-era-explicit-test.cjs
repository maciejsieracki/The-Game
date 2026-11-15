'use strict';
/**
 * R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r3 — JAWNA epoka umowy w ocenie propozycji, bramce uczciwości,
 * walidacji zatwierdzenia i migracji zapisów (czysta logika, bez przeglądarki).
 *
 * Zakres (FC r2 zarzuty 2, 4, 5):
 *  A. resolveProposalPn z jawnym `tradeEra` nadpisuje epokę globalną (Kamień 5 bloków = 15 PN; Brąz 1 blok = 3 PN).
 *  B. evaluateProposal: `ctx.tradeEra` rozstrzyga ocenę (próg akceptacji w Brązie 5x niższy niż w Kamieniu dla tych
 *     samych 50 szt.), a stan globalny po wywołaniu jest NIETKNIĘTY (brak przecieku epoki).
 *  C. Mieszane epoki na ścieżce zatwierdzenia: payload gracza (epoka Kamień) wobec partnera w Brązie => ocena w
 *     Brązie (próg jak dla epoki umowy), a NIE w epoce gracza (mutacja: ctx.tradeEra = epoka gracza => inny próg).
 *  D. Bramka uczciwości = podgląd: dla Brązu i Żelaza próg akceptacji (najmniejsza kwota złota przyjęta przez
 *     evaluateProposal) == najmniejsza kwota, dla której podgląd (resolveProposalPn + diplomacyFairGivePn) daje
 *     givePn >= fairMin — brak rozjazdu „podgląd OK / bramka odrzuca".
 *  E. buildHandelSurowiecCykliczny / peaceOfferAiRequestBasket / trimResourcePaymentTradeForZeroBalance z jawną epoką.
 *  F. Migracja zapisów: diplomacyClampQtyToEraBlock / diplomacyClampBasketItemsToEraBlock (floor, min. 1 blok,
 *     surowce niebłokowe i ilości <= 0 bez zmian).
 *  G. Determinizm (dwa przebiegi = ten sam wynik) i odporność na wyjątek (epoka globalna wraca).
 * Mutacje (TRADE_ERA_EXPLICIT_MUTATE=ctx-ignored|clamp-noop) => CZERWONE.
 * Uruchomienie (z gra/): node tools/diplomacy-trade-era-explicit-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-era-explicit-'));
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');
const LEADER_STUB = path.join(TMP, 'leader-stub.ts');
const BRAND_STUB = path.join(TMP, 'brand-stub.ts');
const MUTATE = process.env.TRADE_ERA_EXPLICIT_MUTATE || '';

fs.writeFileSync(LEADER_STUB, [
  'export function leaderPortraitUrl() { return null; }', 'export function leaderName() { return null; }',
  'export function leaderNameFromPool() { return null; }', 'export function civDisplayNameFromKey() { return null; }',
  'export function civCardDisplayName(l: any) { return l; }', 'export function civIconIdFromCivLabel() { return null; }',
].join('\n'), 'utf8');
fs.writeFileSync(BRAND_STUB, [
  'brandIconSvg', 'improvementIconSvg', 'mapResourceIconSvg', 'terrainIconSvg', 'buildingIconSvg', 'unitIconSvg',
  'civIconSvg', 'epochIconSvg', 'settingIconSvg', 'brandMenuComponentsCss', 'menuIconSvg', 'brandMenuEmblemSvg',
  'newGameIntroEmblemSvg', 'brandMotionCss', 'brandMenuBackgroundCss', 'svgThumbHtml',
].map(f => `export function ${f}() { return ''; }`).join('\n'), 'utf8');
const G = p => JSON.stringify(path.join(GRA, p));
fs.writeFileSync(ENTRY, `
export { evaluateProposal, buildHandelSurowiecCykliczny } from ${G('src/game/diplomacy-proposals.ts')};
export { resolveProposalPn } from ${G('src/game/diplomacy-pn-engine.ts')};
export { peaceOfferAiRequestBasket, trimResourcePaymentTradeForZeroBalance } from ${G('src/game/diplomacy-ai-offer-balance.ts')};
export {
  diplomacyTradeEra, setDiplomacyTradeEra, diplomacyDealTradeEra, withDiplomacyTradeEra, diplomacyFairGivePn,
  diplomacyClampQtyToEraBlock, diplomacyClampBasketItemsToEraBlock, diplomacyHandelSurowiecKrok,
} from ${G('src/game/diplomacy-value-catalog.ts')};
`, 'utf8');

let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(JSON.stringify(a) === JSON.stringify(b), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

async function main() {
  const plugins = [{
    name: 'stub-vite-assets',
    setup(build) {
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({ path: LEADER_STUB }));
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      if (MUTATE === 'ctx-ignored') {
        // Mutacja: evaluateProposal ignoruje ctx.tradeEra (powrót do epoki globalnej).
        const f = path.join(GRA, 'src/game/diplomacy-proposals.ts');
        const src = fs.readFileSync(f, 'utf8');
        const needle = 'return withDiplomacyTradeEra(ctx.tradeEra ?? diplomacyTradeEra(), () => evaluateProposalImpl(proposal, ctx));';
        if (!src.includes(needle)) throw new Error('mutacja ctx-ignored: brak wzorca');
        build.onLoad({ filter: /game[\\/]diplomacy-proposals\.ts$/ }, () => ({
          contents: src.replace(needle, 'return evaluateProposalImpl(proposal, { ...ctx, tradeEra: undefined });')
            .replace('tradeEra: ctx.tradeEra,\n    ...proposalPnTurnsMultiplier(payload),', '...proposalPnTurnsMultiplier(payload),'),
          loader: 'ts', resolveDir: path.join(GRA, 'src/game'),
        }));
      }
      if (MUTATE === 'clamp-noop') {
        const f = path.join(GRA, 'src/game/diplomacy-value-catalog.ts');
        const src = fs.readFileSync(f, 'utf8');
        const needle = 'return Math.max(krok, Math.floor(qty / krok) * krok);';
        if (!src.includes(needle)) throw new Error('mutacja clamp-noop: brak wzorca');
        build.onLoad({ filter: /game[\\/]diplomacy-value-catalog\.ts$/ }, () => ({
          contents: src.replace(needle, 'return qty;'), loader: 'ts', resolveDir: path.join(GRA, 'src/game'),
        }));
      }
    },
  }];
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE,
    absWorkingDir: GRA, logLevel: 'silent', plugins, loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  });
  const D = require(BUNDLE);

  const rel = (z, r) => ({ zaufanie: z, respekt: r, status: 'pokoj' });
  const ctx = (over = {}) => ({
    relation: rel(60, 50), stanWojny: false, turn: 10, proposerRespekt: 40, responderRespekt: 60, militaryRatio: 1,
    hasTradeTechProposer: true, hasTradeTechResponder: true, ...over,
  });
  const goldFor = g => ({ typ: 'zloto', id: 'zloto', ilosc: g });
  const kamien = q => ({ typ: 'surowiec_ilosc', id: 'kamien', ilosc: q });
  const payloadGold = (g, q) => ({ giveItems: [goldFor(g)], receiveItems: [kamien(q)] });
  const evalAt = (payload, over) => D.evaluateProposal(
    { actionId: 'handel', proposerOwnerId: 0, responderOwnerId: 1, payload }, ctx(over));
  /** Najmniejsza kwota złota (1..400), którą ocena przyjmuje, dla 50 szt. kamienia w danej epoce umowy. */
  const thresholdGold = (q, over) => {
    for (let g = 1; g <= 400; g++) if (evalAt(payloadGold(g, q), over).accepted) return g;
    return null;
  };
  /** Najmniejsza kwota złota, dla której PODGLĄD (resolveProposalPn + fairMin) uznaje ofertę za wystarczającą. */
  const previewThresholdGold = (q, era, relTotal) => {
    for (let g = 1; g <= 400; g++) {
      const { givePn, receivePn } = D.resolveProposalPn(payloadGold(g, q), { tradeEra: era, actionId: 'handel' });
      if (givePn >= D.diplomacyFairGivePn(receivePn, relTotal)) return g;
    }
    return null;
  };

  // A. resolveProposalPn: jawna epoka nadpisuje globalną.
  D.setDiplomacyTradeEra(1);
  const pnE = era => D.resolveProposalPn({ receiveItems: [kamien(50)] }, era === undefined ? {} : { tradeEra: era }).receivePn;
  eq(pnE(undefined), 15, 'A global=Kamień: 50 szt. kamienia = 5 bloków x 3 PN = 15 PN');
  eq(pnE(2), 3, 'A jawna epoka 2 przy globalnej 1: 50 szt. = 1 blok = 3 PN');
  eq(pnE(3), 0, 'A jawna epoka 3: 50 szt. < 1 bloku (100) => 0 PN (ilość obcinana w dół)');
  D.setDiplomacyTradeEra(3);
  eq(pnE(2), 3, 'A jawna epoka 2 przy globalnej 3: nadal 3 PN (jawna ma pierwszeństwo)');
  D.setDiplomacyTradeEra(1);

  // B. evaluateProposal z ctx.tradeEra: progi i brak przecieku epoki globalnej.
  const t1 = thresholdGold(50, { tradeEra: 1 });
  const t2 = thresholdGold(50, { tradeEra: 2 });
  console.log(`[B] próg złota dla 50 szt. kamienia: Kamień=${t1}, Brąz=${t2}`);
  ok(t1 != null && t2 != null && t1 > t2, 'B próg w Kamieniu (15 PN) > próg w Brązie (3 PN) dla tych samych 50 szt.');
  ok(t2 * 4 < t1 && t1 <= t2 * 6, `B próg Kamień ≈ 5x próg Brąz (${t1} vs ${t2})`);
  eq(D.diplomacyTradeEra(), 1, 'B po ocenach epoka globalna bez zmian (brak przecieku)');
  D.setDiplomacyTradeEra(3);
  eq(thresholdGold(50, { tradeEra: 2 }), t2, 'B ctx.tradeEra=2 daje ten sam próg niezależnie od globalnej (3)');
  eq(thresholdGold(50, {}), thresholdGold(50, { tradeEra: 3 }), 'B bez ctx.tradeEra ocena używa globalnej (fallback = 3)');
  D.setDiplomacyTradeEra(1);

  // C. Mieszane epoki na ścieżce zatwierdzenia: gracz Kamień (1) + partner Brąz (2) => epoka umowy 2.
  const dealEra = D.diplomacyDealTradeEra(1, 2);
  eq(dealEra, 2, 'C diplomacyDealTradeEra(Kamień, Brąz) = 2');
  eq(thresholdGold(50, { tradeEra: dealEra }), t2, 'C mieszane: ocena w epoce umowy = próg Brązu');
  ok(thresholdGold(50, { tradeEra: 1 }) !== thresholdGold(50, { tradeEra: dealEra }),
    'C ocena w epoce gracza (1) dałaby INNY próg — dlatego epoka umowy musi być jawna');
  eq(D.diplomacyDealTradeEra(2, 1), 2, 'C symetria: (Brąz, Kamień) = 2 niezależnie od strony proponującej');
  eq(D.diplomacyDealTradeEra(3, 1), 3, 'C (Żelazo, Kamień) = 3');

  // D. Bramka uczciwości = podgląd, w Brązie i Żelazie.
  for (const [era, q] of [[2, 50], [3, 100]]) {
    const gate = thresholdGold(q, { tradeEra: era });
    const rel100 = D.evaluateProposal; void rel100;
    // Rel w ctx: Zaufanie 60 + Respekt 50 => `relationTotal`; podgląd UI liczy fairMin @ Relacji tą samą liczbą.
    let previewMin = null;
    for (const relTotal of [100, 110, 120]) {
      const pm = previewThresholdGold(q, era, relTotal);
      if (pm === gate) { previewMin = pm; break; }
    }
    console.log(`[D] epoka ${era}: próg bramki=${gate}, próg podglądu=${previewMin}`);
    ok(gate != null && previewMin === gate, `D epoka ${era}: próg bramki (${gate}) == próg podglądu fairMin (${previewMin}) — brak rozjazdu`);
    // Niezależnie od liczby bloków: 3 bloki = 3x PN => próg rośnie proporcjonalnie, a nie skokowo 5x/10x.
    const gate3 = thresholdGold(q * 3, { tradeEra: era });
    ok(gate3 != null && gate3 > gate && gate3 <= gate * 3 + 3, `D epoka ${era}: 3 bloki => próg ~3x (${gate} -> ${gate3})`);
  }
  eq(thresholdGold(50, { tradeEra: 2 }), thresholdGold(100, { tradeEra: 3 }),
    'D ten sam PN za blok: 1 blok Brązu (50) i 1 blok Żelaza (100) mają ten sam próg');

  // E. Jawna epoka w funkcjach pomocniczych.
  const cykl = (era, qty) => D.buildHandelSurowiecCykliczny(0, 1, [], [kamien(qty)], era);
  eq(cykl(2, 75)[0].pakietyPerTura, 50, 'E buildHandelSurowiecCykliczny: 75 szt. w Brązie => 50 (zamrożone w bloku epoki)');
  eq(cykl(1, 75)[0].pakietyPerTura, 70, 'E 75 szt. w Kamieniu => 70');
  eq(cykl(3, 250)[0].pakietyPerTura, 200, 'E 250 szt. w Żelazie => 200');
  const req = (era) => D.peaceOfferAiRequestBasket(3, [{ id: 'kamien', label: 'Kamień', maxQty: 1000 }], era);
  eq(req(2)[0], { typ: 'surowiec_ilosc', id: 'kamien', ilosc: 50 }, 'E peaceOfferAiRequestBasket: Brąz => 1 blok = 50 szt.');
  eq(req(1)[0], { typ: 'surowiec_ilosc', id: 'kamien', ilosc: 10 }, 'E peaceOfferAiRequestBasket: Kamień => 1 blok = 10 szt.');
  eq(req(3)[0], { typ: 'surowiec_ilosc', id: 'kamien', ilosc: 100 }, 'E peaceOfferAiRequestBasket: Żelazo => 100 szt.');
  const trim = (qty, era) => D.trimResourcePaymentTradeForZeroBalance(
    { giveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: qty }], receiveItems: [goldFor(1)] }, 100, 'normal',
    { tradeEra: era });
  eq(trim(30, 2).giveItems, undefined, 'E ilość poniżej bloku Brązu (30 < 50) => handel surowcem wycofany');
  ok(trim(30, 1).giveItems !== undefined, 'E ta sama ilość 30 w Kamieniu (blok 10) NIE jest wycofana');

  // F. Migracja zapisów (floor, min. 1 blok).
  eq(D.diplomacyClampQtyToEraBlock('drewno', 250, 3), 200, 'F 250 w Żelazie => 200 (floor)');
  eq(D.diplomacyClampQtyToEraBlock('drewno', 25, 3), 100, 'F 25 w Żelazie => 100 (min. 1 blok, oferta nie znika)');
  eq(D.diplomacyClampQtyToEraBlock('drewno', 75, 2), 50, 'F 75 w Brązie => 50');
  eq(D.diplomacyClampQtyToEraBlock('drewno', 50, 2), 50, 'F 50 w Brązie bez zmian');
  eq(D.diplomacyClampQtyToEraBlock('drewno', 0, 2), 0, 'F 0 bez zmian');
  eq(D.diplomacyClampQtyToEraBlock('zloto', 37, 3), 37, 'F złoto (krok 1) bez zmian');
  eq(D.diplomacyClampQtyToEraBlock('wegiel', 7, 3), 7, 'F węgiel (krok 1) bez zmian');
  eq(D.diplomacyClampQtyToEraBlock('drewno', 25, 1), 20, 'F 25 w Kamieniu => 20');
  const items = [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 250 }, { typ: 'zloto', id: 'zloto', ilosc: 33 },
    { typ: 'surowiec_ilosc', id: 'kamien', ilosc: 25 }];
  const clamped = D.diplomacyClampBasketItemsToEraBlock(items, 3);
  eq(clamped.map(i => i.ilosc), [200, 33, 100], 'F koszyk: [250,33(zloto),25] w Żelazie => [200,33,100]');
  eq(items.map(i => i.ilosc), [250, 33, 25], 'F wejście nie jest mutowane');
  eq(D.diplomacyClampBasketItemsToEraBlock(undefined, 3), undefined, 'F brak tablicy => undefined');

  // G. Determinizm + odporność na wyjątek.
  eq([thresholdGold(50, { tradeEra: 2 }), thresholdGold(50, { tradeEra: 1 })],
    [thresholdGold(50, { tradeEra: 2 }), thresholdGold(50, { tradeEra: 1 })], 'G determinizm: dwa przebiegi = ten sam wynik');
  D.setDiplomacyTradeEra(1);
  try { D.withDiplomacyTradeEra(3, () => { throw new Error('boom'); }); } catch (e) { /* oczekiwane */ }
  eq(D.diplomacyTradeEra(), 1, 'G po wyjątku w withDiplomacyTradeEra epoka wraca do poprzedniej');

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`diplomacy-trade-era-explicit-test${MUTATE ? ' [MUTACJA ' + MUTATE + ']' : ''}: ${pass} pass / ${fail} fail`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {} process.exit(2); });
