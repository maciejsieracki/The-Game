#!/usr/bin/env node
/* Bounded source-contract checks for matrix-only owner effects and UI. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const main = read('src/main.ts');
const playerState = read('src/game/playerState.ts');
const newGame = read('src/ui/newGameFlow.ts');
const diplomacy = read('src/ui/diplomacyAudience.ts');
const empire = read('src/ui/empireDetailPanel.ts');
const cityPanel = read('src/ui/cityPanel.ts');

function functionBody(source, signature) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `missing source function: ${signature}`);
  const open = source.indexOf('{', start);
  assert.notEqual(open, -1, `missing function body: ${signature}`);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  assert.fail(`unterminated function: ${signature}`);
}

const ownerKey = functionBody(main, 'function civKeyForOwnerId(');
assert.match(ownerKey, /_menuCivIdByOwner\.get\(ownerId\)/);
assert.match(ownerKey, /playerCivTypeByHuman\.get\(ownerId\)/);
assert.match(ownerKey, /aiOwnerCivMap\.get\(ownerId\)/);
assert.match(ownerKey, /loadCivMatrix\(\)\.cywilizacje\.find/);
assert.match(ownerKey, /return matrixRow\?\.ikonaId \?\? ''/);
assert.doesNotMatch(ownerKey, /\?\?\s*['"]grecy['"]/);

const matrixBundle = functionBody(main, 'function civBonusyForOwnerId(');
assert.match(matrixBundle, /if \(!civKey\) return \[\]/);
assert.match(matrixBundle, /civMatrixBonusyForCivKey\(civKey\)/);
assert.match(matrixBundle, /civProductionCostBonusyForCivKey\(civKey\)/);
assert.doesNotMatch(matrixBundle, /\.bonusy|civs\.cywilizacje|player\.civBonusy/);
assert.doesNotMatch(playerState, /civBonusy\??:/);
assert.doesNotMatch(main, /playerCivBonusyByHuman|player\.civBonusy/);

const aiProfile = functionBody(main, 'function civAiMatrixProfileForOwner(');
assert.match(aiProfile, /if \(!civKey\) return undefined/);
assert.match(aiProfile, /loadCivMatrix\(\)\.cywilizacje\.some/);
assert.match(aiProfile, /if \(!hasMatrixRow\) return undefined/);
assert.match(aiProfile, /civAiProfileForTyp\(data, civKey as TypCywilizacji/);
assert.doesNotMatch(main.slice(main.indexOf('function peacefulArchetypeForOwner('), main.indexOf('function buildAllianceWarObligationCtx(')), /\?\? 'grecy'/);

const availabilityContexts = (main.match(/civKey: civKeyForOwnerId\(/g) || []).length;
// A: konsolidacja kontekstu Zastap (R-WEB-UNIT-REPLACE-COST-AND-PROMOTION-IMPL-Q1 -> game/unit-replace-context.ts) zmniejszyla liczbe literalnych
// wystapien z 5 do 4; zamiast gołego progu >= 5 wymagamy 4 + jawnie obu kontekstow dostepnosci (Zastap i produkcja) z kluczem WLASCICIELA.
assert.ok(availabilityContexts >= 4, `expected owner civKey in availability contexts, found ${availabilityContexts}`);
assert.match(functionBody(main, 'function replaceAvailabilityCtxEmpireWide('), /civKey: civKeyForOwnerId\(ownerId\)/);
assert.match(functionBody(main, 'function productionAvailabilityCtxForCity('), /civKey: civKeyForOwnerId\(city\.ownerId\)/);
assert.equal((main.match(/getCivKey: \(ownerId: number\) => civKeyForOwnerId\(ownerId\)/g) || []).length, 2);
assert.match(cityPanel, /function rushCostModifierForCity\(city: City\): number[\s\S]*?cfg\.getCivKey\?\.\(city\.ownerId\)[\s\S]*?civMatrixParam\(civKey, 'prod_rush_koszt_proc'\)/);
assert.equal((main.match(/const expectedCost = rushCost\(/g) || []).length, 2);
assert.equal((main.match(/if \(koszt !== expectedCost\)/g) || []).length, 2);
assert.equal((main.match(/ownerTreasury\(rbOwnerId\) - expectedCost/g) || []).length, 2);

assert.doesNotMatch(newGame, /\['Bonus startowy'\]|\['Bonusy\/minusy \(do dopracowania\)'\]|bonusRowClass|appendBonusRow/);
assert.equal((newGame.match(/appendCivMatrixProfile\(detail, c(?:2)?\.id\)/g) || []).length, 2);
assert.doesNotMatch(diplomacy, /getCivBonusy|bonusListHtml|playerBon|otherBon/);
assert.doesNotMatch(empire, /bonusStartowy|bonusHtml/);

console.log('PR141 matrix-only owner/UI contracts: PASS');
