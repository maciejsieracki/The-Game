'use strict';
/**
 * era-war-ignore-treaties-test.cjs -- R-WEB-ERA-WAR-IGNORE-TREATIES-Q1 (decyzja właściciela 2026-11-08):
 * "Wojna epoki powinna omijać wszelkie umowy pomiędzy cywilizacjami poza tylko sojuszem."
 *
 * Niezmiennik:
 *   - wojna epoki (Kamień/Brąz/Żelazo) NIE jest blokowana przez NAP, blokadę pokoju (w tym cooldown),
 *     umowy handlowe ani Relację (R8); BLOKUJE ją wyłącznie aktywny sojusz formalny;
 *   - zwykłe (nie-epokowe) wypowiedzenie wojny nadal respektuje NAP i blokadę pokoju.
 *
 * Część A -- PRAWDZIWY moduł (esbuild): game/war-rules-multiwar.ts (isWarTreatyBlocked). Bez reimplementacji.
 * Część B -- kontrakt okablowania (tekstowy): main.ts (predykat pary, bramka wypowiedz_wojne),
 *           ai.ts (guardy Kamienia/Brązu/Żelaza), diplomacy-treaties.ts (BREAK_ON_WAR zawiera NAP).
 *
 * Test pada na kodzie sprzed zmiany (brak eksportu isWarTreatyBlocked + stare guardy w main/ai).
 * Uruchomienie (z katalogu gra/): node tools/era-war-ignore-treaties-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const entry = path.resolve(__dirname, '.era-war-ignore-treaties-entry.ts');
const bundle = path.resolve(__dirname, '.era-war-ignore-treaties-bundle.cjs');
const J = (p) => JSON.stringify(path.join(SRC, p));
fs.writeFileSync(entry, `
export * from ${J('game/war-rules-multiwar')};
`, 'utf8');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

let api;
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  api = require(bundle);
} finally {
  try { fs.unlinkSync(entry); } catch (e) { /* nieistotne */ }
}

const blocked = (o) => api.isWarTreatyBlocked({
  eraWar: false, hasNap: false, peaceLocked: false, hasAlliance: false, ...o,
});

console.log('--- A1: wojna epoki omija NAP, blokadę pokoju i Relację (ignoruje umowy poza sojuszem) ---');
assert(typeof api.isWarTreatyBlocked === 'function', 'isWarTreatyBlocked wyeksportowane z war-rules-multiwar.ts');
assert(blocked({ eraWar: true, hasNap: true }) === false, 'era: NAP NIE blokuje');
assert(blocked({ eraWar: true, peaceLocked: true }) === false, 'era: blokada pokoju (cooldown pary) NIE blokuje');
assert(blocked({ eraWar: true, hasNap: true, peaceLocked: true }) === false, 'era: NAP + blokada pokoju NIE blokują');
assert(blocked({ eraWar: true }) === false, 'era: brak umów -> dozwolona');

console.log('--- A2: sojusz formalny blokuje wojnę epoki (jedyny blokujący warunek) ---');
assert(blocked({ eraWar: true, hasAlliance: true }) === true, 'era: sojusz BLOKUJE');
assert(blocked({ eraWar: true, hasAlliance: true, hasNap: true, peaceLocked: true }) === true, 'era: sojusz + NAP + pokój BLOKUJĄ');

console.log('--- A3: zwykłe (nie-epokowe) wypowiedzenie nadal respektuje NAP i blokadę pokoju ---');
assert(blocked({ eraWar: false, hasNap: true }) === true, 'zwykłe: NAP blokuje');
assert(blocked({ eraWar: false, peaceLocked: true }) === true, 'zwykłe: blokada pokoju blokuje');
assert(blocked({ eraWar: false }) === false, 'zwykłe: bez umów -> dozwolone (sojusz nie jest tu rozstrzygany)');
assert(blocked({ eraWar: false, hasAlliance: true }) === false, 'zwykłe: sojusz NIE zmienia guardu zwykłego wypowiedzenia');

console.log('--- B: kontrakt okablowania main.ts / ai.ts / diplomacy-treaties.ts ---');
const read = (p) => fs.readFileSync(path.resolve(SRC, p), 'utf8');
const mainSrc = read('main.ts');
const aiSrc = read('game/ai.ts');
const treatySrc = read('game/diplomacy-treaties.ts');

assert(
  /const isForcedWarPairBlocked = \(a: number, b: number\): boolean =>\s*\n\s*isWarTreatyBlocked\(\{\s*\n\s*eraWar: true,/.test(mainSrc),
  'B1: main.ts isForcedWarPairBlocked = isWarTreatyBlocked({ eraWar: true, ... }) (para wojny epoki)',
);
assert(
  !/pairRelationScore: pairRelationOfR8/.test(mainSrc) && !/isForcedWarRelationBlocked\(pairRelationOfR8/.test(mainSrc),
  'B2: main.ts nie przekazuje Relacji R8 do parowania wojny epoki',
);
assert(
  /if \(isWarTreatyBlocked\(\{\s*\n\s*eraWar: gateForcedTagAny !== null,/.test(mainSrc),
  'B3: bramka wypowiedz_wojne rozróżnia wojnę epoki po powodzie (eraWar: gateForcedTagAny !== null)',
);
assert(
  /breakTreatiesOnWar\(ownerId, targetId, false\);/.test(mainSrc),
  'B4: wypowiedzenie wojny nadal zrywa umowy (breakTreatiesOnWar) -- NAP/handel rozwiązywane',
);
assert(
  /const BREAK_ON_WAR: ReadonlySet<TreatyKind> = new Set\(\[\s*\n\s*RodzajTraktatu\.PaktNieagresji,/.test(treatySrc),
  'B5: BREAK_ON_WAR obejmuje PaktNieagresji (NAP zrywany wojną epoki)',
);
// Guardy wczesnego zwrotu wojny epoki (Brąz/Kamień/Żelazo) -- bez peaceLocked/hasNapTreaty.
// Guard klastra państw-miast (AI-CS-CLUSTER-DIFF) NIE jest wojną epoki i zostaje nietknięty.
const eraGuardBlocks = ['bronzeForceWarTargetId', 'stoneForceWarTargetId', 'ironForceWarTargetId'].map((k) => {
  const i = aiSrc.indexOf('if (inp.' + k + ' != null) {');
  return i < 0 ? '' : aiSrc.slice(i, i + 700).split('type:')[0];
});
assert(
  eraGuardBlocks.every((b) => b.length > 0 && !/peaceLocked|hasNapTreaty/.test(b)),
  'B6: ai.ts guardy wojny epoki (Brąz/Kamień/Żelazo) nie wykluczają NAP ani blokady pokoju',
);
assert(
  (aiSrc.match(/&& !forcedRel\.hasAllianceTreaty\s*\n?\s*\)/g) || []).length >= 3,
  'B7: ai.ts guardy Brązu/Kamienia/Żelaza nadal wykluczają sojusz z celem',
);

console.log(`\nera-war-ignore-treaties-test: ${passed} pass, ${failed} fail`);
try { fs.unlinkSync(bundle); } catch (e) { /* nieistotne */ }
if (failed > 0) process.exitCode = 1;
