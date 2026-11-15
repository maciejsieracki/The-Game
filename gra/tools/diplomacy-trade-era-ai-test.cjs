'use strict';
/**
 * R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 (runda 2, zarzuty Evaluatora 4 i 1) — oferty AI wg epoki umowy.
 * Testuje PRAWDZIWE moduly: selectAiTradeBarter (ai-trade-proposal.ts) i katalog wyceny.
 * Epoka umowy przekazywana jawnie (`tradeEra`), jak w main.ts pickAiPlayerCyclicBarter.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-era-ai-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-era-ai-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { selectAiTradeBarter } from '../src/game/ai-trade-proposal';
export {
  diplomacyPnSurowiecIlosc,
  diplomacyDealTradeEra,
  diplomacyHandelKrokBlokEpoki,
  withDiplomacyTradeEra,
  diplomacyTradeEra,
} from '../src/game/diplomacy-value-catalog';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const D = require(BUNDLE);
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${a}, want ${b})`); }

function makeInput(stockDrewno, stockGlina) {
  return {
    aiResources: [
      { key: 'drewno', stock: stockDrewno, netRate: 0, deficit: false, surplus: true, reserve: 0 },
      { key: 'glina', stock: 0, netRate: 0, deficit: true, surplus: false, reserve: 0 },
    ],
    playerResources: [
      { key: 'glina', stock: stockGlina, netRate: 0, deficit: false, surplus: true, reserve: 0 },
      { key: 'drewno', stock: 0, netRate: 0, deficit: true, surplus: false, reserve: 0 },
    ],
    turns: 1,
    fairnessGate: () => true,
    evaluateExactPayload: () => true,
  };
}

function runBarter(era, stockDrewno, stockGlina) {
  const seen = [];
  const input = makeInput(stockDrewno, stockGlina);
  input.tradeEra = era;
  input.resolvePayloadPn = payload => {
    const g = payload.giveItems[0];
    const r = payload.receiveItems[0];
    const givePn = D.diplomacyPnSurowiecIlosc(g.id, g.ilosc, era) ?? 0;
    const receivePn = D.diplomacyPnSurowiecIlosc(r.id, r.ilosc, era) ?? 0;
    seen.push([g.ilosc, r.ilosc]);
    return { givePn, receivePn };
  };
  const res = D.selectAiTradeBarter(input);
  return { res, seen };
}

// Braz (epoka 2): oferta AI w wielokrotnosciach bloku 50, nie odrzucona przez bramke.
{
  const { res, seen } = runBarter(2, 1234, 1234);
  ok(res !== null, 'AI w Brazie: znaleziono oferte');
  if (res) {
    eq(res.giveQty % 50, 0, 'AI Braz: ilosc oddawana = wielokrotnosc 50');
    eq(res.receiveQty % 50, 0, 'AI Braz: ilosc odbierana = wielokrotnosc 50');
    eq(res.giveQty, 1200, 'AI Braz: 1234 -> floor do 1200 (blok 50)');
    ok(res.givePn > 0 && res.receivePn > 0, 'AI Braz: oferta ma PN > 0 po obu stronach');
  }
  ok(seen.length > 0 && seen.every(([g, r]) => g % 50 === 0 && r % 50 === 0), 'AI Braz: kazda sprawdzona para w bloku 50');
}

// Kamien (epoka 1): kontrola — blok 10.
{
  const { res } = runBarter(1, 1234, 1234);
  eq(res ? res.giveQty : null, 1230, 'AI Kamien: 1234 -> floor do 1230 (blok 10)');
}

// Zelazo (epoka 3): blok 100.
{
  const { res } = runBarter(3, 1234, 1234);
  eq(res ? res.giveQty : null, 1200, 'AI Zelazo: 1234 -> floor do 1200 (blok 100)');
  eq(res ? res.receiveQty % 100 : null, 0, 'AI Zelazo: odbior w bloku 100');
}

// Epoka umowy = wyzsza z dwoch stron: gracz Kamien + AI Braz => blok 50.
{
  const era = D.diplomacyDealTradeEra(1, 2);
  const { res } = runBarter(era, 1234, 1234);
  eq(res ? res.giveQty % 50 : null, 0, 'mieszane (gracz Kamien, AI Braz): blok 50');
}

// Brak jawnej epoki: selectAiTradeBarter bierze epoke globalna (Braz) — wejscie przez withDiplomacyTradeEra.
{
  const res = D.withDiplomacyTradeEra(2, () => {
    const input = makeInput(1234, 1234);
    input.resolvePayloadPn = () => ({ givePn: 1, receivePn: 1 });
    return D.selectAiTradeBarter(input);
  });
  eq(res ? res.giveQty : null, 1200, 'brak tradeEra: epoka globalna (Braz) -> blok 50');
  eq(D.diplomacyTradeEra(), 1, 'po withDiplomacyTradeEra epoka globalna wraca do 1');
}

eq(D.diplomacyHandelKrokBlokEpoki(2), 50, 'krok bloku Braz = 50');
// Mutacja: blok 10 w Brazie nie moze dac ilosci 1230.
ok(!(runBarter(2, 1234, 1234).res && runBarter(2, 1234, 1234).res.giveQty === 1230), 'mutacja: blok 10 w Brazie odrzucony');

console.log(`diplomacy-trade-era-ai-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
if (fail > 0) process.exit(1);
