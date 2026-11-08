'use strict';
/**
 * diplo-city-offer-reject-own-cooldown-test.cjs — R-WEB-DIPLO-CITY-OFFER-REJECT-OWN-COOLDOWN-Q1 (2026-11-08).
 * Odrzucenie oferty miasta za pokój (oferuj_/zada_miasto_za_pokoj) ma WŁASNY klucz cooldownu
 * ('miasto_za_pokoj'), nie blokuje zwykłego pokoju ('pokoj') i odwrotnie. Długość cooldownu bez zmian.
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.diplo-city-cooldown-bundle.cjs');
const entryFile = path.resolve(__dirname, '.diplo-city-cooldown-entry.ts');
fs.writeFileSync(entryFile, `
export {
  AI_REJECTED_OFFER_COOLDOWN_TURNS,
  CITY_FOR_PEACE_COOLDOWN_KEY,
  rejectCooldownKeyFor,
  makeRejectedOfferCooldown,
  recordRejectedOffer,
  isOfferRejectedOnCooldown,
  pruneExpiredRejectedOffers,
} from '../src/game/diplomacy-rejection-cooldown.ts';
`);

esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  AI_REJECTED_OFFER_COOLDOWN_TURNS,
  CITY_FOR_PEACE_COOLDOWN_KEY,
  rejectCooldownKeyFor,
  makeRejectedOfferCooldown,
  recordRejectedOffer,
  isOfferRejectedOnCooldown,
  pruneExpiredRejectedOffers,
} = require(BUNDLE);

// Ta sama logika co w main.ts (enqueueNegotiationFromAiCmd + handleNegotiationReject).
function keyAtEnqueue(cmdType, convertedActionId) {
  return rejectCooldownKeyFor(cmdType, convertedActionId);
}
function keyAtReject(entry) {
  return entry.rejectCooldownKey ?? entry.actionId;
}

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('diplo-city-offer-reject-own-cooldown-test');

ok(AI_REJECTED_OFFER_COOLDOWN_TURNS === 3, 'długość cooldownu bez zmian (3 tury)');
ok(CITY_FOR_PEACE_COOLDOWN_KEY === 'miasto_za_pokoj', 'klucz oferty miasta = miasto_za_pokoj');

const AI = 2;
const T = 10;

{
  ok(rejectCooldownKeyFor('oferuj_miasto_za_pokoj', 'pokoj') === 'miasto_za_pokoj', 'oferuj_miasto_za_pokoj → klucz miasta');
  ok(rejectCooldownKeyFor('zada_miasto_za_pokoj', 'pokoj') === 'miasto_za_pokoj', 'zada_miasto_za_pokoj → klucz miasta');
  ok(rejectCooldownKeyFor('zaproponuj_pokoj', 'pokoj') === 'pokoj', 'zaproponuj_pokoj → nadal pokoj');
  ok(rejectCooldownKeyFor('zaproponuj_pakt', 'nap') === 'nap', 'inne komendy → actionId bez zmian');
}

{
  // Odrzucenie oferty miasta: zapis pod kluczem miasta, NIE pod 'pokoj'.
  const key = keyAtReject({ actionId: 'pokoj', rejectCooldownKey: keyAtEnqueue('oferuj_miasto_za_pokoj', 'pokoj') });
  ok(key === 'miasto_za_pokoj', 'odrzucenie oferty miasta zapisuje klucz miasta');
  const cd = recordRejectedOffer([], AI, key, T);
  ok(cd.length === 1 && cd[0].actionId === 'miasto_za_pokoj', 'wpis cooldownu ma klucz miasta');
  ok(isOfferRejectedOnCooldown(cd, AI, 'miasto_za_pokoj', T + 1), 'kolejna oferta miasta blokowana w cooldownie');
  ok(!isOfferRejectedOnCooldown(cd, AI, 'pokoj', T + 1), 'zwykły pokój NIE jest blokowany po odrzuceniu oferty miasta');
  ok(!isOfferRejectedOnCooldown(cd, AI, 'pokoj', T), 'zwykły pokój nie blokowany nawet w turze odrzucenia');
  ok(!isOfferRejectedOnCooldown(cd, AI, 'miasto_za_pokoj', T + 3), 'klucz miasta wygasa po 3 turach');
}

{
  // Zwykły pokój odrzucony: blokuje 'pokoj', NIE blokuje oferty miasta.
  const key = keyAtReject({ actionId: 'pokoj' });
  ok(key === 'pokoj', 'odrzucenie zwykłego pokoju zapisuje pokoj');
  const cd = recordRejectedOffer([], AI, key, T);
  ok(isOfferRejectedOnCooldown(cd, AI, 'pokoj', T + 1), 'zwykły pokój blokowany po własnym odrzuceniu');
  ok(!isOfferRejectedOnCooldown(cd, AI, 'miasto_za_pokoj', T + 1), 'oferta miasta NIE blokowana po odrzuceniu zwykłego pokoju');
}

{
  // Oba klucze równolegle — niezależne wpisy i nadpisywanie tylko własnego klucza.
  let cd = recordRejectedOffer([], AI, 'miasto_za_pokoj', 5);
  cd = recordRejectedOffer(cd, AI, 'pokoj', 6);
  ok(cd.length === 2, 'oba klucze mają osobne wpisy');
  ok(isOfferRejectedOnCooldown(cd, AI, 'miasto_za_pokoj', 7) && isOfferRejectedOnCooldown(cd, AI, 'pokoj', 7), 'oba cooldowny aktywne równolegle');
  cd = recordRejectedOffer(cd, AI, 'miasto_za_pokoj', 9);
  ok(cd.length === 2 && cd.find(c => c.actionId === 'pokoj').rejectedAtTurn === 6, 'nadpisanie klucza miasta nie rusza klucza pokoju');
}

{
  // Stare zapisy (bez nowego klucza): brak cooldownu miasta, cooldown 'pokoj' bez zmian.
  const legacy = [makeRejectedOfferCooldown(AI, 'pokoj', T)];
  ok(!isOfferRejectedOnCooldown(legacy, AI, 'miasto_za_pokoj', T + 1), 'stary zapis bez klucza miasta = brak cooldownu miasta');
  ok(isOfferRejectedOnCooldown(legacy, AI, 'pokoj', T + 1), 'stary zapis pokoju nadal działa');
  const pruned = pruneExpiredRejectedOffers([...legacy, makeRejectedOfferCooldown(AI, 'miasto_za_pokoj', 1)], T + 1);
  ok(pruned.length === 1 && pruned[0].actionId === 'pokoj', 'prune usuwa wygasły wpis miasta, zachowuje aktywny pokój');
}

{
  // Zwykła propozycja pokoju po odrzuceniu oferty miasta: klucz przy sprawdzeniu to 'pokoj'.
  const cd = recordRejectedOffer([], AI, keyAtEnqueue('oferuj_miasto_za_pokoj', 'pokoj'), T);
  ok(!isOfferRejectedOnCooldown(cd, AI, keyAtEnqueue('zaproponuj_pokoj', 'pokoj'), T + 1), 'zaproponuj_pokoj możliwy po odrzuceniu oferty miasta');
}

console.log(`\nWynik: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
