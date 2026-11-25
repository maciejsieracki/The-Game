'use strict';

/**
 * eliminated-relation-source-test.cjs — R-WEB-ELIMINATED-RELATION-CLOSE-Q1 (obrona r2, zarzut 2).
 *
 * Tekstowa bramka dowodu statycznego dla tezy dokumentu ELIMINACJA-RELACJA-WOJNY-2026-11-25.md:
 *  - eliminateOwner kasuje wpisy diplomacyRelations / diplomacyPairMeta / diplomacyFactorLog z ownerId
 *    (dzięki temu odczyt pary z martwym właścicielem daje neutralną relację, a nie „wojna");
 *  - isAiAiEligibleOwner odrzuca eliminowanych (!o.eliminated);
 *  - diploOwnerEligibleForBrake przekazuje eliminated: eliminatedOwners.has(o);
 *  - tickDiploAiAiPairsWithBrake filtruje właścicieli przez diploOwnerEligibleForBrake
 *    (martwy właściciel nie odtwarza wpisów neutralnych par).
 *
 * Nie zmienia zachowania gry. Pliki czytane z katalogu gra/ (względem __dirname).
 *
 * Uruchomienie (z katalogu gra/): node tools/eliminated-relation-source-test.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const main = fs.readFileSync(path.join(ROOT, 'main.ts'), 'utf8');
const brake = fs.readFileSync(path.join(ROOT, 'game', 'diplomacy-tick-war-brake.ts'), 'utf8');

let passed = 0;
let failed = 0;
function check(name, ok) {
  if (ok) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}`);
  }
}

// Ciało funkcji od jej nagłówka do następnego nagłówka `    function ` (wcięcie jak w main.ts).
function bodyOf(src, header) {
  const start = src.indexOf(header);
  if (start < 0) return '';
  const next = src.indexOf('\n    function ', start + header.length);
  return src.slice(start, next < 0 ? src.length : next);
}

const elim = bodyOf(main, 'function eliminateOwner(ownerId: number): void {');
check(
  'eliminateOwner: kasuje diplomacyRelations z ownerId',
  /for \(const key of Array\.from\(diplomacyRelations\.keys\(\)\)\)\s*\{\s*if \(diploPairKeyHasOwner\(key, ownerId\)\) diplomacyRelations\.delete\(key\);/.test(elim),
);
check(
  'eliminateOwner: kasuje diplomacyPairMeta z ownerId',
  /if \(diploPairKeyHasOwner\(key, ownerId\)\) diplomacyPairMeta\.delete\(key\);/.test(elim),
);
check(
  'eliminateOwner: early return dla ownerId === 0 (gracz nie jest czyszczony tą ścieżką)',
  /if \(ownerId === 0 \|\| eliminatedOwners\.has\(ownerId\)\) return;/.test(elim),
);

check(
  'isAiAiEligibleOwner: odrzuca eliminowanych (!o.eliminated)',
  /export function isAiAiEligibleOwner\(o: AiAiOwnerInfo\): boolean \{\s*return !o\.isPlayer && !o\.isBarbarian && !o\.isCityCopy && !o\.eliminated && o\.cityCount > 0;/.test(brake),
);

const elig = bodyOf(main, 'function diploOwnerEligibleForBrake(o: number): boolean {');
check(
  'diploOwnerEligibleForBrake: przekazuje eliminated: eliminatedOwners.has(o)',
  /isAiAiEligibleOwner\(\{[\s\S]*eliminated: eliminatedOwners\.has\(o\),/.test(elig),
);

const tick = bodyOf(main, 'function tickDiploAiAiPairsWithBrake(): void {');
check(
  'tickDiploAiAiPairsWithBrake: właściciele przez diploOwnerEligibleForBrake',
  /const owners = allPowerOwnerIds\(\)\.filter\(o => !isMe\(o\) && diploOwnerEligibleForBrake\(o\)\);/.test(tick),
);

console.log(`\n${passed} PASS / ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
