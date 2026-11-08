'use strict';
// Bounded runtime owner route: main.ts owner resolver -> real map battle setup -> resolveCombat.
// Run from gra/: node tools/pr141-combat-defense-owner-route-test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pr141-owner-route-'));
const mainSource = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');

function extractFunction(source, name) {
  const re = new RegExp(`function ${name}\\s*\\(`);
  const match = re.exec(source);
  assert.ok(match, `main.ts contains ${name}`);
  let parens = 0;
  let signatureEnd = match.index;
  for (; signatureEnd < source.length; signatureEnd++) {
    if (source[signatureEnd] === '(') parens++;
    else if (source[signatureEnd] === ')' && --parens === 0) { signatureEnd++; break; }
  }
  const open = source.indexOf('{', signatureEnd);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(match.index, i + 1);
  }
  throw new Error(`unterminated source function ${name}`);
}

const keyResolver = extractFunction(mainSource, 'civKeyForOwnerId');
const bonusResolver = extractFunction(mainSource, 'civBonusyForOwnerId');
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
const stubAudio = path.join(root, 'tools/.stubs/map-field-battle-muzyka-stub.ts');
fs.writeFileSync(entry, `
 import { civBonusyForCivKey } from ${JSON.stringify(path.join(root, 'src/game/economy'))};
 import { civMatrixBonusyForCivKey } from ${JSON.stringify(path.join(root, 'src/game/civ-bonuses'))};
 export { launchFieldBattleFromMap } from ${JSON.stringify(path.join(root, 'src/battle/mapFieldBattle'))};
 export { resolveCombat } from ${JSON.stringify(path.join(root, 'src/game/combat'))};
 export function makeOwnerResolver(player, aiOwnerCivMap, data) {
   ${keyResolver}
   ${bonusResolver}
   return { civKeyForOwnerId, civBonusyForOwnerId };
 }
`);
async function run() {
try {
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
    plugins: [{ name: 'stub-muzyka', setup(build) {
      build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: stubAudio }));
    } }],
    logLevel: 'silent',
  });
} finally { fs.rmSync(entry, { force: true }); }
const G = require(bundle);

const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/civ-matrix.json'), 'utf8'));
const cases = [
  { id: 'walka_obrona_morska', civ: 'grecy', foreign: 'rzymianie', def: { typNazwa: 'Galera', rola: 'Morska', counterTyp: 'Naval' } },
  { id: 'walka_obrona_piechota_teren_las', civ: 'slowianie', foreign: 'grecy', terrain: 'las' },
  { id: 'walka_obrona_piechota_terytorium_wlasne', civ: 'harappa', foreign: 'grecy', own: true },
  { id: 'walka_obrona_piechota_w_murze', civ: 'hetyci', foreign: 'grecy', wall: true },
  { id: 'walka_obrona_piechota_teren_plytkie_morze', civ: 'grecy', foreign: 'rzymianie', terrain: 'plytkie_morze', shallow: true },
];
const attackerStats = { typNazwa: 'Wojownik', rola: 'Wrecz', counterTyp: 'Piechota', meleeAttack: 30, meleeDefence: 20, weaponDamage: 20, armor: 0, piercing: 0, chargeBonus: 0, health: 100, 'Prog dezercji (% health)': 0 };
const infantryDefender = { ...attackerStats, meleeAttack: 4, meleeDefence: 20, weaponDamage: 4 };
const baseCombat = { rng: () => 0.497, maxRounds: 1, attackerMoved: false };
let checks = 0;

function battleOptsForOwner(defOwnerId, defCivKey, terrain, playerCivKey = 'rzymianie') {
  const player = { civType: playerCivKey, civBonusy: [] };
  const aiOwnerCivMap = new Map([[defOwnerId, defCivKey]]);
  const resolver = G.makeOwnerResolver(player, aiOwnerCivMap, { civs: { cywilizacje: [] } });
  const city = { id: 'city-' + defOwnerId, ownerId: defOwnerId, q: 6, r: 0, name: 'Field City', maMur: false, population: 10, garnizon: 0 };
  const anchor = { id: 'attacker-' + defOwnerId, ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 5, r: 0, ruch: 2, ruchLeft: 2 };
  const defender = { id: 'defender-' + defOwnerId, ownerId: defOwnerId, typeId: 'Wojownik', category: 'miecznik', q: 6, r: 0, ruch: 2, ruchLeft: 2 };
  let sceneOpts;
  G.launchFieldBattleFromMap({ attacker: anchor, ctx: { city } }, {
    cities: [city], units: [anchor, defender], turn: 3,
    getTerrainAt: () => terrain, getStructBonus: () => 0,
    unitDefFor: () => ({ meleeAttack: 8, meleeDefence: 7, weaponDamage: 8, armor: 0, piercing: 0, chargeBonus: 0, health: 100, missileAttack: 0, 'Rola (linia)': 'Wrecz' }),
    unitHealth: () => 100, unitAtak: () => 8,
    civLabelForOwner: id => resolver.civKeyForOwnerId(id),
    civBonusyForOwnerId: resolver.civBonusyForOwnerId,
    civIdForOwner: resolver.civKeyForOwnerId,
    lookupUnitDef: () => ({}),
    runtimeToBattleUnit: u => ({ id: u.id, ownerId: u.ownerId }),
    fortifyScaledDefFor: () => ({ meleeAttack: 8, meleeDefence: 7, weaponDamage: 8, armor: 0, piercing: 0, health: 100, fieldPower: 15 }),
    terrainCombatData: [], battleData: {}, showHint: () => {},
    showPreBattle: (_info, callbacks) => callbacks.onBattlefield(), hidePreBattle: () => {},
    applyMapBattleOutcomeWithSummary: () => {}, clearBattleUiState: () => {},
    createBattleScene: opts => { sceneOpts = opts; return { play: () => {}, dispose: () => {} }; },
  });
  assert.ok(sceneOpts, `real launchFieldBattleFromMap setup reached BattleScene options for owner ${defOwnerId}`); checks++;
  return sceneOpts;
}

for (let index = 0; index < cases.length; index++) {
  const c = cases[index];
  const targetRow = matrix.cywilizacje.find(row => row.ikonaId === c.civ);
  const foreignRow = matrix.cywilizacje.find(row => row.ikonaId === c.foreign);
  assert.ok(targetRow && targetRow.params[c.id] > 0, `${c.id}: target is a real positive matrix row`); checks++;
  assert.ok(foreignRow && (foreignRow.params[c.id] ?? 0) === 0, `${c.id}: foreign owner is a real zero matrix row`); checks++;

  const terrain = c.terrain ?? 'rownina';
  const activeOpts = battleOptsForOwner(20 + index, c.civ, terrain);
  const foreignOpts = battleOptsForOwner(20 + index, c.foreign, terrain);
  const defender = { ...infantryDefender, ...(c.def ?? {}) };
  const context = {
    defenderTerrain: activeOpts.teren,
    defenderOwnTerritory: c.own ?? false,
    defenderOnWallWalkway: c.wall ?? false,
    shallowSea: c.shallow ?? false,
  };
  const active = G.resolveCombat(attackerStats, defender, { ...baseCombat, ...context, ...activeOpts });
  const foreign = G.resolveCombat(attackerStats, defender, { ...baseCombat, ...context, ...foreignOpts });
  assert.ok(active.defenderHpLeft > foreign.defenderHpLeft,
    `${c.id}: real owner-id battle setup yields defender HP ${active.defenderHpLeft} vs foreign ${foreign.defenderHpLeft}`); checks++;

  // The actual setup gives the attacker the target civ too. Its defense trait must not
  // protect the attacker when the same resolver evaluates that unit on side=attacker.
  const sideOpts = battleOptsForOwner(40 + index, c.foreign, terrain, c.civ);
  const attackerOnly = G.resolveCombat(attackerStats, defender, { ...baseCombat, ...context, ...sideOpts });
  const noCivDefense = G.resolveCombat(attackerStats, defender, { ...baseCombat, ...context });
  assert.equal(attackerOnly.attackerHpLeft, noCivDefense.attackerHpLeft,
    `${c.id}: attack-side owner does not receive defensive HP protection`);
  assert.equal(attackerOnly.defenderHpLeft, noCivDefense.defenderHpLeft,
    `${c.id}: defense trait on attacker side does not mitigate against defender`); checks += 2;
  console.log(`${c.id}: active owner=${c.civ} HP=${active.attackerHpLeft}/${active.defenderHpLeft}; foreign owner=${c.foreign} HP=${foreign.attackerHpLeft}/${foreign.defenderHpLeft}; attacker-side control=${attackerOnly.attackerHpLeft}/${attackerOnly.defenderHpLeft}`);
}
console.log(`PASS: ${checks} assertions; fixed RNG=0.497; source-extracted main owner resolver -> actual map field battle setup -> resolveCombat`);
fs.rmSync(tmp, { recursive: true, force: true });
}
run().catch(error => { console.error(error); process.exitCode = 1; });
