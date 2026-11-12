'use strict';
/**
 * diplomacy-relation-deal-text-consistent-test.cjs — R-WEB-UI-DIPLO-RELATION-DEAL-TEXT-CONSISTENT-Q1.
 * Panel „Wpływ Relacji na deal" nie może pisać „musisz dać więcej" przy ofercie AI→gracz,
 * gdy werdykt mówi „Możesz przyjąć" (Przyjmij aktywne). Oferta gracz→AI zostaje bez zmian.
 * Run: node tools/diplomacy-relation-deal-text-consistent-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-rel-deal-text-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-rel-deal-text-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { renderPnBalancePanelHtml } from './ui/diplomacyAcceptanceBalance';
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
    offerPn: 0,
    demandPn: 0,
    fairMinPn: 0,
    balancePn: net,
    treatyBasePn: 0,
    relCurrent,
    mode: 'basket',
    statusLabel: net >= 0 ? 'OK' : 'Brakuje',
    accepted: net >= 0,
  };
}

function panel(direction, canAccept, relCurrent, net) {
  return {
    actionLabel: 'Wymiana',
    direction,
    myOfferPn: 40,
    theirOfferPn: 10,
    theirBalance: basketBalance(relCurrent, net),
    canAccept,
  };
}

const REL_TEXT_BAD = 'musisz dać więcej';

// 1. AI→gracz, Przyjmij aktywne, relacja < 100 — brak sprzeczności.
const incomingOk = mod.renderPnBalancePanelHtml(panel('incoming', true, 60, 5));
ok(incomingOk.includes('Możesz przyjąć'), 'incoming+accept: werdykt „Możesz przyjąć" obecny');
ok(!incomingOk.includes(REL_TEXT_BAD), 'incoming+accept: brak „musisz dać więcej" (sprzeczność z werdyktem)');
ok(incomingOk.includes('da-pn-rel-mod-deal'), 'incoming+accept: wiersz Relacji nadal renderowany');

// 1b. AI→gracz, Przyjmij aktywne, bilans ujemny (przewaga u gracza) — też bez sprzeczności.
const incomingNeg = mod.renderPnBalancePanelHtml(panel('incoming', true, 60, -3));
ok(!incomingNeg.includes(REL_TEXT_BAD), 'incoming+accept, net<0: brak „musisz dać więcej"');

// 2. Gracz→AI (own), oczekujący na odpowiedź AI — dotychczasowy komunikat zostaje.
const ownPanel = panel('own', true, 60, -3);
ownPanel.awaitingAiResponse = true;
const own = mod.renderPnBalancePanelHtml(ownPanel);
ok(own.includes(REL_TEXT_BAD), 'own (gracz→AI): dotychczasowy komunikat „musisz dać więcej" zachowany');

// 3. AI→gracz, Przyjmij nieaktywne — wiersz Relacji nadal wariant 'trade' (bez zmiany zachowania).
const incomingBlocked = mod.renderPnBalancePanelHtml(panel('incoming', false, 60, -3));
ok(incomingBlocked.includes(REL_TEXT_BAD), 'incoming bez accept: wariant „trade" bez zmian');

console.log(`diplomacy-relation-deal-text-consistent-test: ${pass} pass / ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
