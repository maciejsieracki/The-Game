'use strict';
/**
 * ai-trade-oneshot-overpay-limit-test.cjs — R-WEB-AI-TRADE-ONESHOT-OVERPAY-LIMIT-Q1.
 * Jednorazowa oferta handlowa AI -> gracz nie może oddawać więcej PW, niż AI otrzymuje
 * (givePn <= receivePn). Dar (isGift), oferta cykliczna i inne actionId są poza limitem.
 *
 * Test obejmuje helper `aiOneshotHandelOverpaysPlayer` (jedyne miejsce reguły) oraz
 * kontrakt wywołania w main.ts (filtr enqueue) — ten drugi jako strażnik źródła,
 * bo boot main.ts nie jest izolowalny w teście jednostkowym.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const bundle = path.resolve(__dirname, '.ai-trade-oneshot-overpay-bundle.cjs');
const entry = path.resolve(__dirname, '.ai-trade-oneshot-overpay-entry.ts');
fs.writeFileSync(entry, `
export { aiOneshotHandelOverpaysPlayer } from '../src/game/diplomacy-proposals.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
const { aiOneshotHandelOverpaysPlayer: over } = require(bundle);
let pass = 0;
function ok(v, m) { if (!v) throw new Error(`FAIL: ${m}`); pass++; console.log('  OK:', m); }

// Jednorazowa oferta AI -> gracz z nadpłatą (AI oddaje 300, dostaje 100): odrzucana.
ok(over('handel', 'zaproponuj_handel_surowiec', { givePn: 300, receivePn: 100 }) === true, 'one-shot AI overpay (300 > 100) is flagged');
// Równa wartość nie jest nadpłatą.
ok(over('handel', 'zaproponuj_handel_surowiec', { givePn: 100, receivePn: 100 }) === false, 'one-shot equal PW (100 == 100) is not an overpay');
// Oferta cykliczna jest poza tym filtrem (ma własny limit A1).
ok(over('handel', 'zaproponuj_wymiane_cykliczna', { givePn: 300, receivePn: 100 }) === false, 'cyclic offer is exempt (own A1 limit)');
// Inne actionId niż handel są poza filtrem.
ok(over('pokoj', 'zaproponuj_pokoj', { givePn: 300, receivePn: 100 }) === false, 'non-handel actionId is exempt');
// Dar AI (isGift jawny) jest poza limitem.
ok(over('handel', 'zaproponuj_handel_surowiec', { isGift: true, givePn: 200, receivePn: 0 }) === false, 'explicit AI gift (isGift) is exempt');
// Dar bez flagi: AI oddaje same surowce, receivePn 0 i brak receiveItems -> traktowany jako dar.
ok(over('handel', 'zaproponuj_handel_surowiec', { giveItems: [{ id: 'drewno', n: 2 }], givePn: 0, receivePn: 0 }) === false, 'unflagged gift (items out, receivePn 0) is exempt');
// Ten sam kształt z receivePn > 0 to już handel (nie dar): nadpłata wykrywana.
ok(over('handel', 'zaproponuj_handel_surowiec', { giveItems: [{ id: 'drewno', n: 2 }], givePn: 200, receivePn: 100 }) === true, 'items-out with receivePn>0 is a trade and overpay is flagged');
// Brak ścieżki PW (nic nie wymieniane) nie jest nadpłatą.
ok(over('handel', 'zaproponuj_handel_surowiec', { givePn: 0, receivePn: 0 }) === false, 'empty payload has no PW path and is not flagged');

// Strażnik wiringu: filtr enqueue w main.ts MUSI wołać helper w warunku `if (`.
const mainSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
ok(/if \(\s*aiOneshotHandelOverpaysPlayer\(\s*converted\.actionId,\s*workingCmd\.type,\s*balancedPayload,\s*pnBalanceOpts\s*\)\s*\)\s*\{\s*return;/.test(mainSrc),
  'main.ts enqueue filter calls aiOneshotHandelOverpaysPlayer(converted.actionId, workingCmd.type, balancedPayload, pnBalanceOpts) -> return');
ok(mainSrc.includes('  aiOneshotHandelOverpaysPlayer,'), 'main.ts imports aiOneshotHandelOverpaysPlayer');

console.log(`ai-trade-oneshot-overpay-limit-test: ${pass} assertions passed`);
fs.rmSync(bundle, { force: true });
fs.rmSync(entry, { force: true });
