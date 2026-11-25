'use strict';

/**
 * R-WEB-ERA-WAR-END-LIKE-CLASSIC-Q1 — wojny epoki (Kamień/Brąz/Żelazo) AI↔AI kończą się
 * tymi samymi ścieżkami co klasyczne wojny (decyzja właściciela 2026-11-25).
 *
 * Pokrycie:
 *  A. Zachowanie (esbuild bundle `game/diplomacy-ai-forced-peace.ts`): para AI↔AI w wojnie
 *     uprawniona do pokoju wymuszonego niezależnie od tego, czy była wojną epoki (wykluczenie
 *     usunięte); para z graczem (człowiek) nadal nieuprawniona; miasto-państwo i brak wojny
 *     nadal nieuprawnione; wyeliminowany nadal nieuprawniony.
 *  B. Wiązanie z `main.ts` (tekstowe): brak wykluczenia epoki w `maybeResolveRegularWarOnCityCapture`
 *     i `aiAiForcedPeacePairEligible`; `finalizePeaceTreatyBetween` nadal sprząta rejestry wojen
 *     epoki i ustawia karencję `forcedEraPeaceUntilNextEraByPairKey` (pokój MUSI czyścić).
 *
 * Mutacja: przywrócenie `forcedEpochWar` w `isForcedPeaceEligiblePair` (lub wczesnego return
 * dla pary wymuszonej w `maybeResolveRegularWarOnCityCapture`) musi wywołać FAIL.
 *
 * Uruchamianie z gra/: node tools/era-war-end-like-classic-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed++;
    console.log(`PASS: ${label}`);
  } else {
    failed++;
    console.log(`FAIL: ${label}`);
  }
}

function loadForcedPeaceModule() {
  const entry = path.join(SRC, 'game', 'diplomacy-ai-forced-peace.ts');
  const built = esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  });
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', built.outputFiles[0].text)(mod, mod.exports);
  return mod.exports;
}

function functionSlice(source, signature, nextSignature) {
  const start = source.indexOf(signature);
  if (start < 0) return '';
  const end = source.indexOf(nextSignature, start + signature.length);
  return source.slice(start, end < 0 ? source.length : end);
}

// --- A. Zachowanie ---------------------------------------------------------
const P = loadForcedPeaceModule();
const aiAi = {
  aIsHuman: false, bIsHuman: false, aIsMajorAi: true, bIsMajorAi: true,
  eliminated: false, atWar: true,
};

check('A1 AI↔AI w wojnie (także wojna epoki) uprawniona do pokoju wymuszonego',
  P.isForcedPeaceEligiblePair(aiAi) === true);
check('A2 para z graczem (człowiek po stronie A) nadal nieuprawniona',
  P.isForcedPeaceEligiblePair({ ...aiAi, aIsHuman: true, aIsMajorAi: false }) === false);
check('A3 para z graczem (człowiek po stronie B) nadal nieuprawniona',
  P.isForcedPeaceEligiblePair({ ...aiAi, bIsHuman: true, bIsMajorAi: false }) === false);
check('A4 miasto-państwo (nie główna AI) nadal nieuprawnione',
  P.isForcedPeaceEligiblePair({ ...aiAi, bIsMajorAi: false }) === false);
check('A5 brak wojny nadal nieuprawnione',
  P.isForcedPeaceEligiblePair({ ...aiAi, atWar: false }) === false);
check('A6 wyeliminowany nadal nieuprawniony',
  P.isForcedPeaceEligiblePair({ ...aiAi, eliminated: true }) === false);

// --- B. Wiązanie z main.ts -------------------------------------------------
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const forcedPeaceSrc = fs.readFileSync(path.join(SRC, 'game', 'diplomacy-ai-forced-peace.ts'), 'utf8');

check('B1 diplomacy-ai-forced-peace.ts: brak pola forcedEpochWar (wykluczenie usunięte)',
  !/forcedEpochWar/.test(forcedPeaceSrc));
check('B2 main.ts: brak pola forcedEpochWar (aiAiForcedPeacePairEligible nie wyklucza epoki)',
  !/forcedEpochWar/.test(main));

const resolveSlice = functionSlice(
  main,
  'function maybeResolveRegularWarOnCityCapture(',
  'function applyCityCaptureToMap(',
);
check('B3 maybeResolveRegularWarOnCityCapture istnieje',
  resolveSlice.length > 0);
check('B4 maybeResolveRegularWarOnCityCapture: brak wczesnego return dla pary wojny epoki',
  resolveSlice.length > 0
  && !/ForceWarActiveByPairKey\.has\(pairKey\)/.test(resolveSlice));
check('B5 maybeResolveRegularWarOnCityCapture nadal liczy miasta i kończy auto-pokojem',
  /shouldEndForcedWarByCityCount\(/.test(resolveSlice)
  && /finalizePeaceTreatyBetween\(ownerA, ownerB,/.test(resolveSlice));
// B4b: wykluczenie może wrócić też przez pomocniczą funkcję / inną nazwę rejestru. Zamiast nazw helperów
// (zbyt dowolne) pilnujemy STRUKTURY: przed sprawdzeniem relacji 'wojna' są wyłącznie dwa strażniki
// właścicieli (oldOwner===newOwner, właściciel 0), bez odwołań do rejestrów i bez innych wczesnych wyjść.
const beforeRelation = resolveSlice.slice(0, Math.max(0, resolveSlice.indexOf('getDiploRelation(')));
check('B4b maybeResolveRegularWarOnCityCapture: przed sprawdzeniem relacji tylko 2 strażniki właścicieli, zero odwołań do rejestrów wojen',
  beforeRelation.length > 0
  && (beforeRelation.match(/\breturn\b/g) || []).length === 2
  && !/ByPairKey|ForceWar|forcedEpoch|EpochWar|\.has\(/.test(beforeRelation));
check('B4c maybeResolveRegularWarOnCityCapture: w całej funkcji brak jakiegokolwiek odwołania do rejestrów wojen wymuszonych',
  resolveSlice.length > 0 && !/ForceWarActive|ForceWarCycle|ForceWarPending/.test(resolveSlice));

const finalizeSlice = functionSlice(
  main,
  'function finalizePeaceTreatyBetween(',
  'function applyCityCaptureToMap(',
);
check('B6 finalizePeaceTreatyBetween: ustawia karencję ForcedEraPeaceLock dla wojny epoki',
  /forcedEraPeaceUntilNextEraByPairKey\.set\(pairKey,/.test(finalizeSlice));
check('B7 finalizePeaceTreatyBetween: sprząta rejestry Kamienia/Żelaza i zwykłą wojnę',
  /cleanupStoneForcedWarOnPeace\(proposerId, responderId\)/.test(finalizeSlice)
  && /cleanupIronForcedWarOnPeace\(proposerId, responderId\)/.test(finalizeSlice)
  && /cleanupRegularWarOnPeace\(proposerId, responderId\)/.test(finalizeSlice));

const eligibleSlice = functionSlice(
  main,
  'function aiAiForcedPeacePairEligible(',
  'function aiAiMilitaryRequesterShare(',
);
check('B8 aiAiForcedPeacePairEligible istnieje i nie czyta rejestrów wojny epoki',
  eligibleSlice.length > 0 && !/ForceWarActiveByPairKey/.test(eligibleSlice));
check('B9 registerAiAiPeaceRequest korzysta z aiAiForcedPeacePairEligible (prośby P20 dla wojny epoki)',
  /function registerAiAiPeaceRequest\([\s\S]*?aiAiForcedPeacePairEligible\(requesterId, otherId\)/.test(main));

console.log(`\nRazem: PASS ${passed} / FAIL ${failed}`);
process.exit(failed === 0 ? 0 : 1);
