'use strict';
/**
 * diplo-alliance-gate-test.cjs — R-WEB-DIPLO-ALLIANCE-BLOCKED-AT-TRUST-100-Q1
 * Run from gra/:  node tools/diplo-alliance-gate-test.cjs   (opcjonalnie ESBUILD_PATH=...)
 *
 * Pokrywa:
 *  A) scenariusz ze zrzutu: Zaufanie 100 + Respekt 28 = Relacja 128 < progSojuszRelacja 130
 *     -> akcja „Sojusz" zablokowana z powodem po polsku (Relacji 130, masz 128), a przy 130+ odblokowana;
 *  B) relationTierDisplay: tier „Sojusz" (4) wyłącznie przy faktycznym traktacie (emblemat = lista = silnik);
 *  C) main.ts: wszystkie 3 miejsca tieru UI używają relationTierDisplay (zero surowego relationTier).
 */
const fs = require('fs');
const path = require('path');
let esbuild;
for (const p of [process.env.ESBUILD_PATH, path.resolve(__dirname, '..', 'node_modules', 'esbuild')]) {
  if (!p) continue;
  try { esbuild = require(p); break; } catch (e) { /* next */ }
}
if (!esbuild) { console.error('esbuild not found (npm install w gra/ lub ESBUILD_PATH)'); process.exit(1); }

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.dip-alliance-gate-entry.ts');
const OUT = path.resolve(__dirname, '.dip-alliance-gate-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { DIPLOMACY_PARAMS, relationTier, relationTierDisplay, relationScore } from ${JSON.stringify(SRC + '/game/diplomacy')};
export { resolveDiplomacyActionLock } from ${JSON.stringify(SRC + '/game/diplomacy-locks')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: OUT, logLevel: 'silent' });
} catch (e) { console.error(e.message || e); process.exit(1); }
const B = require(OUT);
fs.unlinkSync(ENTRY); fs.unlinkSync(OUT);

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.error('FAIL: ' + m); } }
const P = B.DIPLOMACY_PARAMS;

// A) lock — scenariusz ze zrzutu
function lockCtx(zaufanie, respekt) {
  return {
    actionId: '3', contact: true, atWar: false,
    relTotal: B.relationScore({ zaufanie, respekt, status: 'pokoj' }),
    zaufanie, respekt, hasNap: true, hasHandel: false, hasSojusz: false,
    sellableTechCount: 0, buyableTechCount: 0, knownRivalsCount: 0,
    progNapRelacja: P.progNapRelacja, progHandelRelacja: P.progHandelRelacja,
    progSojuszRelacja: P.progSojuszRelacja, progSojuszZaufanie: P.progSojuszZaufanie,
    progGraniceRelacja: P.progGraniceRelacja, progGraniceZaufanie: P.progGraniceZaufanie,
    progWymianaTechZaufanie: P.progWymianaTechZaufanie, progNamowWojneZaufanie: P.progNamowWojneZaufanie,
    progWasalizacjaRespekt: P.progWasalizacjaRespekt, progTrybutZadanieMinRespekt: P.progTrybutZadanieMinRespekt,
    progDarRelacja: P.progDarRelacja,
  };
}
const l128 = B.resolveDiplomacyActionLock(lockCtx(100, 28));
ok(P.progSojuszRelacja === 130, 'próg Relacji sojuszu = 130 (dane)');
ok(P.progSojuszZaufanie === 90, 'próg Zaufania sojuszu = 90 (dane)');
ok(l128.locked === true, 'Relacja 128 < 130 -> sojusz zablokowany');
ok(/Relacji 130 \(masz 128\)/.test(l128.note), 'powód po polsku: ' + l128.note);
const l130 = B.resolveDiplomacyActionLock(lockCtx(100, 30));
ok(l130.locked === false, 'Relacja 130 + Zaufanie 100 -> sojusz odblokowany');
const l89 = B.resolveDiplomacyActionLock(lockCtx(89, 50));
ok(l89.locked === true && /Zaufania 90 \(masz 89\)/.test(l89.note), 'Zaufanie 89 < 90 -> zablokowany: ' + l89.note);
const l90 = B.resolveDiplomacyActionLock(lockCtx(90, 40));
ok(l90.locked === false, 'Relacja 130 + Zaufanie 90 -> sojusz odblokowany');

// B) tier do wyświetlenia
const hi = { zaufanie: 100, respekt: 52, status: 'pokoj' };
ok(B.relationTier(hi) === 4, 'surowy tier przy score 152 = 4 (próg osiągnięty)');
ok(B.relationTierDisplay(hi, false) === 3, 'bez traktatu emblemat NIE „Sojusz" (3 Przyjazny)');
ok(B.relationTierDisplay(hi, true) === 4, 'z traktatem emblemat „Sojusz"');
ok(B.relationTierDisplay({ zaufanie: 50, respekt: 50, status: 'sojusz' }, false) === 3, 'status=sojusz bez traktatu (nieaktualny) -> nie „Sojusz"');
ok(B.relationTierDisplay({ zaufanie: 80, respekt: 80, status: 'wojna' }, true) === 0, 'wojna zawsze tier 0');
ok(B.relationTierDisplay({ zaufanie: 10, respekt: 10, status: 'neutralni' }, false) === 1, 'niski score -> Wrogi bez zmian');

// C) spójność w main.ts
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
ok(!/\brelationTier\(/.test(main), 'main.ts nie woła surowego relationTier(');
ok((main.match(/relationTierDisplay\(rel, hasAllianceDealBetween\(/g) || []).length === 3, 'main.ts: 3 miejsca tieru UI przez relationTierDisplay');
// C2) jedno źródło: emblemat (hasAllianceDealBetween) i lista „Sojusze" (sojuszPartners) używają tego samego predykatu
// (strukturalnie, z tekstu main.ts — nie jest to test runtime UI; pełny test na żywo NIE_ZMIERZONO)
const hadBody = (main.match(/function hasAllianceDealBetween\(a: number, b: number\): boolean \{\s*return ([^;]+);/) || [])[1] || '';
const PRED = /activeDeals\.some\(d => dealInvolvesOwners\(d, a, b\) && isAllianceDealKind\(d\.rodzaj\)\)/;
ok(PRED.test(hadBody), 'hasAllianceDealBetween: predykat = activeDeals.some(dealInvolvesOwners && isAllianceDealKind)');
const sojIdx = main.indexOf('const sojuszPartners = new Set<number>();');
const sojBlk = sojIdx >= 0 ? main.slice(sojIdx, sojIdx + 600) : '';
ok(/for \(const d of activeDeals\)/.test(sojBlk) && /if \(isAllianceDealKind\(d\.rodzaj\)\) sojuszPartners\.add\(other\)/.test(sojBlk),
  'lista Sojusze (sojuszPartners) czyta activeDeals przez isAllianceDealKind');
// C3) hasSojusz w locku (dualGate) też z activeDeals + isAllianceDealKind
ok(/const hasSojusz = activeDeals\.some\(\s*d => dealInvolvesOwners\(d, ME\(\), ownerId\) && isAllianceDealKind\(d\.rodzaj\),?\s*\)/.test(main),
  'lock hasSojusz: activeDeals + isAllianceDealKind (ten sam predykat)');

console.log(`diplo-alliance-gate-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
