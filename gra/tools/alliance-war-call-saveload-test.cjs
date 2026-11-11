'use strict';
/** R-WEB-DIPLO-ALLIANCE-JOIN-WAR-CALL-TO-ARMS-Q1: durable call inbox roundtrip + lifecycle guards. */
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const BUNDLE = path.resolve(__dirname, '.alliance-war-call-save-bundle.cjs');
let pass = 0;
function check(name, fn) { fn(); pass++; console.log('PASS: ' + name); }

async function main() {
  await esbuild.build({
    entryPoints: [path.join(GRA, 'src/game/save.ts')], bundle: true, platform: 'node', format: 'cjs',
    outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  });
  const { serializeGame, deserializeGame } = require(BUNDLE);
  const makeSave = meta => ({ wersja: 3, tura: 18, seed: 9, units: [], cities: [], exploredByHuman: [], gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0, meta });
  const call = { id: 'alliance-war-18-2-3-call-3', ownerId: 2, civName: 'Ateny', cmdType: 'alliance_war_call', reason: 'Wypowiedz wojnę: Sparta', allianceWar: { warId: 'alliance-war-18-2-3', attackerId: 2, victimId: 3, targetId: 3 } };
  const history = [{ id: call.id, warId: call.allianceWar.warId, allyId: 0, targetId: 3, outcome: 'joined' }];
  check('rzeczywisty serializer zachowuje nested call i stable war ID', () => {
    const back = deserializeGame(serializeGame(makeSave({ pendingDiplomacyInbox: [call], allianceWarCallHistory: history })));
    assert.deepEqual(back.meta.pendingDiplomacyInbox[0], call);
    assert.deepEqual(back.meta.allianceWarCallHistory, history);
  });
  check('starszy zapis bez pól alliance call pozostaje prawidłowy', () => {
    const back = deserializeGame(serializeGame(makeSave({ pendingDiplomacyInbox: [] })));
    assert.deepEqual(back.meta.pendingDiplomacyInbox, []);
    assert.equal(back.meta.allianceWarCallHistory, undefined);
  });
  const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
  check('wołanie jest idempotentne dla stable warID i targetu', () => {
    assert.match(main, /const id = `\$\{warId\}-call-\$\{targetId\}`;\s*if \(pendingDiplomacyInbox\.some\(p => p\.id === id\)\) return;/);
  });
  check('odpowiedź ponownie waliduje wojnę i formalny obowiązek', () => {
    const start = main.indexOf('function resolveAllianceWarCall(');
    const body = main.slice(start, start + 2600);
    assert.match(body, /getDiploRelation\(call\.attackerId, call\.victimId\)\.status !== 'wojna'/);
    assert.match(body, /allianceObligationsForWarDeclaration\(activeDeals, call\.attackerId, call\.victimId\)/);
    assert.match(body, /allianceFormalKindBetween\(activeDeals, ME\(\), call\.targetId\)/);
  });
  check('save restore validates calls only after saved treaties are hydrated', () => {
    const dealsAt = main.indexOf('const savedDeals = saved.meta?.diplomacyDeals');
    const validateAt = main.indexOf('const savedAllianceCallHistory', dealsAt);
    assert.ok(dealsAt >= 0 && validateAt > dealsAt);
    const segment = main.slice(validateAt, validateAt + 1600);
    assert.match(segment, /allianceObligationsForWarDeclaration\(activeDeals, call\.attackerId, call\.victimId\)/);
    assert.match(segment, /if \(!liveObligation\) pendingDiplomacyInbox\.splice\(pi, 1\)/);
  });
  console.log(`\n${pass} pass / 0 fail`);
  try { fs.unlinkSync(BUNDLE); } catch (_) {}
}
main().catch(e => { console.error(e); process.exitCode = 1; });
