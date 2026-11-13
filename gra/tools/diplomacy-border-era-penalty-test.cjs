'use strict';
/** Shared-border factor follows the higher live owner era in tick and breakdown. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.border-era-penalty-entry.ts');
const bundle = path.resolve(__dirname, '.border-era-penalty-bundle.cjs');
fs.writeFileSync(entry, `
export { DIPLOMACY_PARAMS, getEffectiveDiplomacyParams, sharedBorderPenaltyForEpochs, computeTickZaufanieDelta, tickDiplomacy } from '../src/game/diplomacy.ts';
export { buildRelationBreakdown } from '../src/game/diplomacy-factors.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'silent' });
const B = require(bundle);
let pass = 0;
let fail = 0;
function ok(condition, message) { if (condition) { pass++; console.log('  OK:', message); } else { fail++; console.error('  FAIL:', message); } }
function eq(actual, expected, message) { ok(actual === expected, `${message} (got ${actual}, want ${expected})`); }
const params = B.getEffectiveDiplomacyParams('normal');

// Owner-era resolution is symmetric and honors the owner's current epoch on each call.
for (const [a, b, expected, label] of [
  [1, 1, -2, 'Stone/Stone'], [1, 2, -3, 'Stone/Bronze'],
  [2, 1, -3, 'Bronze/Stone'], [2, 3, -4, 'Bronze/Iron'],
  [3, 2, -4, 'Iron/Bronze'], [1, 3, -4, 'Stone/Iron'],
  [3, 3, -4, 'Iron/Iron'],
]) {
  eq(B.sharedBorderPenaltyForEpochs(a, b, params), expected, `${label}: higher era rate`);
  eq(B.sharedBorderPenaltyForEpochs(b, a, params), expected, `${label}: reversed owner order`);
}

// The same resolved pair rate is consumed by the live tick and shown in continuous factors.
for (const [a, b, expected, label] of [[1, 1, -2, 'stone'], [1, 2, -3, 'mixed stone/bronze'], [2, 3, -4, 'mixed bronze/iron']]) {
  for (const [ownerA, ownerB] of [[a, b], [b, a]]) {
    const rate = B.sharedBorderPenaltyForEpochs(ownerA, ownerB, params);
    const ctx = { turn: 1, karaWspolnaGranica: true, karaWspolnaGranicaDelta: rate };
    eq(B.computeTickZaufanieDelta(ctx, false), expected, `${label} (${ownerA}→${ownerB}): trust delta matches owner epochs`);
    const breakdown = B.buildRelationBreakdown([], {
      karaWspolnaGranica: true,
      karaWspolnaGranicaZaufaniePerTura: rate,
    }, params);
    const row = breakdown.negatywne.find(item => item.label === 'Kara za wspólną granicę');
    eq(row?.value, expected, `${label} (${ownerA}→${ownerB}): relation breakdown matches tick`);
    const relation = B.tickDiplomacy({ zaufanie: 50, respekt: 20, status: 'pokoj' }, ctx);
    eq(relation.zaufanie, 50 + expected, `${label} (${ownerA}→${ownerB}): full relation tick applies exactly once`);
  }
}
const noBorderBreakdown = B.buildRelationBreakdown([], {
  karaWspolnaGranica: false,
  karaWspolnaGranicaZaufaniePerTura: -4,
}, params);
ok(!noBorderBreakdown.negatywne.some(item => item.label === 'Kara za wspólną granicę'),
  'no shared border / city-count guard: no penalty in UI');

// Main wiring resolves the live owner eras in the common pair context, its player-AI fallback,
// and uses that same context for preview and the relation breakdown. Era maps already round-trip.
const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
ok(/sharedBorderPenaltyForEpochs\(\s*empireEpochForOwner\(a\),\s*empireEpochForOwner\(b\)/.test(main), 'pair tick context resolves current epochs for both owners');
ok(/sharedBorderPenaltyForEpochs\(\s*empireEpochForOwner\(ownerId\),\s*empireEpochForOwner\(ME\(\)\)/.test(main), 'player-AI fallback resolves current epochs for both owners');
ok(/const tickCtxAudience = buildDiplomacyTickCtxForPair\(ME\(\), ownerId\);[\s\S]*?computeTickZaufanieDelta\(tickCtxAudience/.test(main), 'UI delta preview consumes shared pair tick context');
ok(/const pairTickCtx = buildDiplomacyTickCtxForPair\(a, b\);[\s\S]*?karaWspolnaGranicaZaufaniePerTura: pairTickCtx\.karaWspolnaGranicaDelta/.test(main), 'breakdown consumes same resolved rate as tick');
ok(/ownerEraByOwner\.set\(ownerId/.test(main) && /ownerEraByOwner\.get\(ownerId\)/.test(main), 'AI owner era is held in the existing owner-era state');
ok(/const savedOwnerEra = saved\.meta\?\.ownerEraByOwner/.test(main) && /for \(const \[oid, e\] of savedOwnerEra\) ownerEraByOwner\.set\(oid, e\)/.test(main), 'save restore reinstates AI owner era before live pair recalculation');

console.log(`\nResult: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch {}
process.exit(fail > 0 ? 1 : 0);
