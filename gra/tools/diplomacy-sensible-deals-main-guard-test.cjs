'use strict';

/**
 * R-WEB-DIPLO-DEALS-SENSIBLE-Q1 (R2, B5) — tekstowa bramka wiązania z `main.ts`.
 *
 * DLACZEGO: `diplomacy-sensible-deals-test.cjs` bunduje wyłącznie czysty moduł; wiązanie
 * w `main.ts` (filtr bilansu w enqueueNegotiationFromAiCmd, bramki niedobór/nadwyżka w
 * pickResourceTradeRelOffer, blokada końca tury w canPlayerInitiateEndTurn, siatka w
 * healStaleEndTurnBlockers, zapis/odczyt opcji) nie jest tam bundlowane. Ta bramka pinuje
 * wiązanie asercjami źródłowymi i MUTACJAMI: każda mutacja kluczowego wywołania musi dać
 * czerwień (FAIL), inaczej bramka jest tautologiczna.
 *
 * Uruchamianie z gra/: node tools/diplomacy-sensible-deals-main-guard-test.cjs
 */

const fs = require('fs');
const path = require('path');
const MAIN_PATH = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_PATH, 'utf8');

function functionSlice(source, signature, nextSignature) {
  const start = source.indexOf(signature);
  if (start < 0) return '';
  const end = source.indexOf(nextSignature, start + signature.length);
  return source.slice(start, end < 0 ? source.length : end);
}

/** Zwraca listę wyników bramek dla podanego źródła main.ts (true = wiązanie obecne). */
function guardResults(main) {
  const enqueue = functionSlice(main, 'function enqueueNegotiationFromAiCmd(', '\n    /**');
  const pickFn = functionSlice(main, 'function pickResourceTradeRelOffer(', '\n    function pickResourceSurplusForOwnerPair(');
  const endTurn = functionSlice(main, 'function canPlayerInitiateEndTurn(): boolean {', '\n    function hintEndTurnBlocked(');
  const healFn = functionSlice(main, 'function healStaleEndTurnBlockers(): void {', '\n    /** R-WEB-DIPLO-DEALS-SENSIBLE-Q1: oferta handlowa AI');
  const builder = functionSlice(main, 'function buildHandelSurowiecCmdFromOffer(', '\n    /** AI proaktywnie prosi');
  const resolveFn = functionSlice(main, 'function resolveNegotiationEntryAt(', '\n    /**');
  return [
    ['import: flaga, bramki i reason z diplomacy-sensible-deals',
      /from '\.\/game\/diplomacy-sensible-deals';/.test(main)
      && /isBuyerDeficitJustified,/.test(main) && /isSellerSurplusJustified,/.test(main)],
    ['filtr bilansu PW wywołany w enqueueNegotiationFromAiCmd (sensibleBalanceFilterApplies + isPlayerBalanceAcceptable)',
      enqueue.includes('sensibleBalanceFilterApplies(isDiploSensibleDealsEnabled(), workingCmd.type)')
      && enqueue.includes('!isPlayerBalanceAcceptable(')
      && enqueue.includes('aiProposalPlayerBenefitSurplus(balancedPayload')],
    ['bramka zakupu isBuyerDeficitJustified w pickResourceTradeRelOffer',
      pickFn.includes("pick.powod === 'deficyt'") && pickFn.includes('!isBuyerDeficitJustified(proposerStockForPick, proposerNetForPick')],
    ['bramka sprzedaży isSellerSurplusJustified (z warunkiem niedoboru partnera) w pickResourceTradeRelOffer',
      pickFn.includes("pick.powod === 'nadwyzka'") && pickFn.includes('!isSellerSurplusJustified(')
      && pickFn.includes('partnerNeedForPick')],
    ['reason: sensibleReason zwracany z pickResourceTradeRelOffer',
      pickFn.includes('reason: sensibleReason')],
    ['reason przenoszony do komendy (reasonHandlu: offer.reason) i na stół (entry.reason)',
      builder.includes('reasonHandlu: offer.reason') && enqueue.includes('entry.reason = workingCmd.reasonHandlu')],
    ['blokada końca tury: canPlayerInitiateEndTurn zwraca false przy hasBlockingAiTradeOfferForPlayer()',
      endTurn.includes('if (hasBlockingAiTradeOfferForPlayer()) {') && endTurn.includes('return false;')],
    ['siatka: healStaleEndTurnBlockers woła pruneStaleAiTradeOffersAwaitingPlayer()',
      healFn.includes('pruneStaleAiTradeOffersAwaitingPlayer();')],
    ['kontroferta AI (resolveNegotiationEntryAt) podlega filtrowi bilansu PW gracza (B9)',
      resolveFn.includes("sensibleBalanceFilterApplies(isDiploSensibleDealsEnabled(), 'zaproponuj_handel')")
      && resolveFn.includes('!isPlayerBalanceAcceptable(')],
    ['opcja nowej gry: doStartGame ustawia dealsEndTurnGateEnabled z params (domyślnie ON)',
      /dealsEndTurnGateEnabled = params\.dealsEndTurnGate \?\? true;/.test(main)],
    ['zapis: meta.dealsEndTurnGate; odczyt: stary zapis = OFF',
      /dealsEndTurnGate: dealsEndTurnGateEnabled,/.test(main)
      && /dealsEndTurnGateEnabled = \(saved\.meta\?\.dealsEndTurnGate as boolean \| undefined\) === true;/.test(main)],
  ];
}

let passed = 0;
let failed = 0;
function report(label, ok) {
  if (ok) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}`);
  }
}

console.log('R-WEB-DIPLO-DEALS-SENSIBLE-Q1 — main.ts wiring guard (R2)\n');

// 1. Na prawdziwym main.ts wszystkie wiązania muszą być obecne.
const real = guardResults(mainSrc);
for (const [label, ok] of real) report(`realne main.ts: ${label}`, ok);

// 2. MUTACJE: każde usunięcie kluczowego wywołania MUSI wywołać co najmniej jedną czerwień.
const mutations = [
  {
    name: 'usunięcie wywołania filtru bilansu',
    from: 'sensibleBalanceFilterApplies(isDiploSensibleDealsEnabled(), workingCmd.type)',
    to: 'false',
  },
  {
    name: 'usunięcie bramki zakupu isBuyerDeficitJustified',
    from: '!isBuyerDeficitJustified(proposerStockForPick, proposerNetForPick, sensiblePakiet, sensibleOn)',
    to: 'false',
  },
  {
    name: 'usunięcie bramki sprzedaży isSellerSurplusJustified',
    from: '!isSellerSurplusJustified(\n          proposerStockForPick, proposerNetForPick, sensiblePakiet, partnerNeedForPick, sensibleOn,\n        )',
    to: 'false',
  },
  {
    name: 'usunięcie reason z pickResourceTradeRelOffer',
    from: 'reason: sensibleReason,',
    to: '',
  },
  {
    name: 'usunięcie blokady końca tury',
    from: "if (hasBlockingAiTradeOfferForPlayer()) {\n        console.warn('[EndTurn] blocked: oferta",
    to: "if (false) {\n        console.warn('[EndTurn] blocked: oferta",
  },
  {
    name: 'usunięcie filtru bilansu z kontrofert AI',
    from: "sensibleBalanceFilterApplies(isDiploSensibleDealsEnabled(), 'zaproponuj_handel')\n          && isSensibleTradeActionId",
    to: "false\n          && isSensibleTradeActionId",
  },
  {
    name: 'usunięcie siatki bezpieczeństwa w healStaleEndTurnBlockers',
    from: 'pruneStaleAiTradeOffersAwaitingPlayer();\n    }\n\n    /** R-WEB-DIPLO-DEALS-SENSIBLE-Q1: oferta',
    to: '}\n\n    /** R-WEB-DIPLO-DEALS-SENSIBLE-Q1: oferta',
  },
];

for (const m of mutations) {
  const idx = mainSrc.indexOf(m.from);
  if (idx < 0) {
    report(`mutacja "${m.name}": fragment nie istnieje w main.ts (bramka nieaktualna)`, false);
    continue;
  }
  const mutated = mainSrc.slice(0, idx) + m.to + mainSrc.slice(idx + m.from.length);
  const res = guardResults(mutated);
  const redCount = res.filter(([, ok]) => !ok).length;
  report(`mutacja "${m.name}" -> czerwień (FAIL bramek: ${redCount})`, redCount > 0);
}

console.log(`\ndiplomacy-sensible-deals-main-guard-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
