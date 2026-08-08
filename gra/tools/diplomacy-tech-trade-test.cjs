'use strict';
/**
 * diplomacy-tech-trade-test.cjs — R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08).
 * Zgłoszenie Macieja (playtest): koszyk handlu technologiami pokazywał identyczną listę
 * po obu stronach (daję/dostaję), bez filtrowania po tym, czy druga strona już ją ma.
 * Test pokrywa czystą funkcję filtrującą (game/diplomacy-tech-trade.ts), używaną
 * symetrycznie przez main.ts::getSellableTechForPlayer („daję") i getBuyableTechFromOwner
 * („dostaję") — patrz PARITY.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const BUNDLE = path.resolve(__dirname, '.dip-tech-trade-bundle.cjs');
const entry = path.resolve(__dirname, '.dip-tech-trade-entry.ts');
fs.writeFileSync(entry, `
export { tradeableTechIdsForSide } from '../src/game/diplomacy-tech-trade.ts';
`);
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});
const { tradeableTechIdsForSide } = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplomacy-tech-trade-test');

// Scenariusz: gracz (offering) zna 'rolnictwo' i 'garncarstwo'; responder zna
// 'garncarstwo' i 'ceramika'. Wspólna: garncarstwo. Tylko-offering: rolnictwo.
// Tylko-responder: ceramika. Żadna strona: 'zelazo'.
const offeringKnown = new Set(['rolnictwo', 'garncarstwo']);
const responderKnown = new Set(['garncarstwo', 'ceramika']);

const giveList = tradeableTechIdsForSide(offeringKnown, responderKnown);
const receiveList = tradeableTechIdsForSide(responderKnown, offeringKnown);

// 1) Tech znana przez OBIE strony (garncarstwo) wykluczona z obu list.
ok(!giveList.includes('garncarstwo'), 'garncarstwo (obie strony) NIE na liście "daję"');
ok(!receiveList.includes('garncarstwo'), 'garncarstwo (obie strony) NIE na liście "dostaję"');

// 2) Tech znana TYLKO przez oferującego (rolnictwo) -> tylko na liście "daję".
ok(giveList.includes('rolnictwo'), 'rolnictwo (tylko oferujący) NA liście "daję"');
ok(!receiveList.includes('rolnictwo'), 'rolnictwo (tylko oferujący) NIE na liście "dostaję"');

// 2b) symetrycznie: tech znana tylko przez respondenta (ceramika) -> tylko "dostaję".
ok(receiveList.includes('ceramika'), 'ceramika (tylko responder) NA liście "dostaję"');
ok(!giveList.includes('ceramika'), 'ceramika (tylko responder) NIE na liście "daję"');

// 3) Tech znana przez ŻADNĄ ze stron (zelazo) nie pojawia się jako tradeable w żadnym
//    kierunku (funkcja operuje tylko na przekazanych zbiorach zbadanych technologii —
//    nieznana obu stronom nigdy nie wejdzie do ownKnown, więc nie może się pojawić).
ok(!giveList.includes('zelazo') && !receiveList.includes('zelazo'), 'zelazo (żadna strona) nietradeable w żadnym kierunku');

// Parytet rozmiaru: dokładnie 1 pozycja na każdej liście (po odjęciu wspólnej).
ok(giveList.length === 1 && receiveList.length === 1, 'po 1 unikalnej technologii na każdej stronie');

console.log(`\ndiplomacy-tech-trade-test: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(entry); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}
process.exit(fail === 0 ? 0 : 1);
