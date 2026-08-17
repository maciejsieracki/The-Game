'use strict';

/**
 * P-AI-BRAK-POJECIA-MGLY-Q1 — testy kontraktu A+C.
 * Uruchomienie: node tools/ai-fog-test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.ai-fog-entry.ts');
const bundle = path.join(__dirname, '.ai-fog-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn } from ${JSON.stringify(path.join(root, 'src/game/ai'))};
export {
  aiCityCaptureAllowed, aiTargetVisibleForAction, rememberVisibleAiTargets, rememberedAiTargets,
  restoreAiTargetMemory, snapshotAiTargetMemory,
} from ${JSON.stringify(path.join(root, 'src/game/ai-fog'))};
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: bundle, absWorkingDir: root, logLevel: 'silent',
  });
} catch (error) {
  console.error('[ai-fog-test] bundling failed:', error.message || error);
  process.exit(1);
}
const api = require(bundle);

function makeMap(size = 12) {
  const hexes = {};
  for (let q = 0; q < size; q += 1) {
    for (let r = 0; r < size; r += 1) {
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak',
        ulepszenie: 'brak', wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: size, wysokoscR: size, hexes, seed: 42, riverPaths: [] };
}

const data = {
  units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2, 'Widok pola': 2 }],
  buildings: [],
  terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }] },
  aiParams: {},
};
const unit = (id, ownerId, q, r) => ({
  id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2,
});
const city = (id, ownerId, q, r) => ({
  id, ownerId, q, r, population: 5, kultura: 0, name: id,
});
const atWar = () => true;
const keyOf = (q, r) => `${q},${r}`;

console.log('W1 visible target -> attack');
{
  const commands = api.decideAITurn(
    1, [unit('a1', 1, 5, 5), unit('e1', 2, 6, 5)], [city('home', 1, 4, 4)],
    makeMap(), data, { canEngageOwner: atWar, visibleHexes: new Set(['6,5']) },
  );
  assert.strictEqual(commands.filter(c => c.type === 'attack').length, 1);
}

console.log('W2 invisible target -> not selected/attacked');
{
  const commands = api.decideAITurn(
    1, [unit('a2', 1, 5, 5), unit('e2', 2, 6, 5)], [city('home', 1, 4, 4)],
    makeMap(), data, { canEngageOwner: atWar, visibleHexes: new Set(['5,5']) },
  );
  assert.strictEqual(commands.some(c => c.type === 'attack'), false);
  assert.strictEqual(api.aiTargetVisibleForAction(new Set(['5,5']), true, 6, 5, keyOf), false);
  assert.strictEqual(api.aiTargetVisibleForAction(undefined, false, 6, 5, keyOf), true);
}

console.log('W3 remembered target -> planning only, no attack');
{
  const memory = [{
    targetId: 'e3', targetOwnerId: 2, kind: 'unit', q: 8, r: 5,
  }];
  const commands = api.decideAITurn(
    1, [unit('a3', 1, 5, 5)], [city('home', 1, 4, 4)],
    makeMap(), data, {
      canEngageOwner: atWar, visibleHexes: new Set(['5,5']), rememberedTargets: memory,
    },
  );
  assert.strictEqual(commands.some(c => c.type === 'attack'), false);
  assert.deepStrictEqual(commands.find(c => c.type === 'move'), {
    type: 'move', unitId: 'a3', toQ: 6, toR: 5,
  });
}

console.log('W4 owner A/B parity');
{
  const a = api.decideAITurn(
    1, [unit('a4', 1, 5, 5), unit('ea', 2, 6, 5)], [city('ha', 1, 4, 4)],
    makeMap(), data, { canEngageOwner: atWar, visibleHexes: new Set(['6,5']) },
  );
  const b = api.decideAITurn(
    2, [unit('b4', 2, 5, 5), unit('eb', 1, 6, 5)], [city('hb', 2, 4, 4)],
    makeMap(), data, { canEngageOwner: atWar, visibleHexes: new Set(['6,5']) },
  );
  assert.strictEqual(a.filter(c => c.type === 'attack').length, b.filter(c => c.type === 'attack').length);
}

console.log('W5 old save without memory -> empty, no crash');
{
  const restored = api.restoreAiTargetMemory(undefined);
  assert.strictEqual(restored.size, 0);
  assert.strictEqual(api.rememberedAiTargets(restored, 1).length, 0);
  const persisted = new Map([[1, new Map([['unit:e5', {
    targetId: 'e5', targetOwnerId: 2, kind: 'unit', q: 7, r: 7,
  }]])]]);
  const roundTrip = api.restoreAiTargetMemory(api.snapshotAiTargetMemory(persisted));
  assert.deepStrictEqual(api.rememberedAiTargets(roundTrip, 1), [{
    targetId: 'e5', targetOwnerId: 2, kind: 'unit', q: 7, r: 7,
  }]);
}

console.log('W6 edge cases: invalid entry and own target ignored');
{
  const restored = api.restoreAiTargetMemory([[1, [
    { targetId: 'bad', targetOwnerId: 2, kind: 'other', q: 1, r: 1 },
    { targetId: 'ok', targetOwnerId: 2, kind: 'city', q: 2, r: 2 },
  ]]]);
  assert.deepStrictEqual(api.rememberedAiTargets(restored, 1).map(x => x.targetId), ['ok']);
  const memory = new Map();
  api.rememberVisibleAiTargets(
    memory, 1, new Set(['2,2']),
    [{ id: 'own', ownerId: 1, q: 2, r: 2 }, { id: 'enemy', ownerId: 2, q: 2, r: 2 }],
    [], keyOf,
  );
  assert.deepStrictEqual(api.rememberedAiTargets(memory, 1).map(x => x.targetId), ['enemy']);
}

console.log('W7 mutation: memory snapshots are detached');
{
  const memory = new Map();
  const target = { id: 'mut', ownerId: 2, q: 3, r: 3 };
  api.rememberVisibleAiTargets(memory, 1, new Set(['3,3']), [target], [], keyOf);
  target.q = 9;
  const returned = api.rememberedAiTargets(memory, 1);
  returned[0].q = 10;
  assert.strictEqual(api.rememberedAiTargets(memory, 1)[0].q, 3);
}

console.log('W8 remembered city A cannot capture replacement city B; A can be recaptured');
{
  const commands = api.decideAITurn(
    1,
    [unit('a8', 1, 5, 5)],
    [city('home', 1, 4, 4), city('city-a', 2, 6, 5)],
    makeMap(), data,
    { canEngageOwner: atWar, visibleHexes: new Set(['6,5']) },
  );
  const cityMove = commands.find(c => c.type === 'move' && c.targetCityId !== undefined);
  assert.strictEqual(cityMove.targetCityId, 'city-a');
  const cityB = { id: 'city-b', ownerId: 2, q: 6, r: 5 };
  assert.strictEqual(
    api.aiCityCaptureAllowed('city-a', cityB, new Set(['6,5']), true, keyOf),
    false,
  );
  assert.strictEqual(
    api.aiCityCaptureAllowed('city-a', { ...cityB, id: 'city-a' }, new Set(['6,5']), true, keyOf),
    true,
  );
}

console.log('AI fog tests PASS (8/8)');
