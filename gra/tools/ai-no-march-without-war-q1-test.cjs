'use strict';
/**
 * ai-no-march-without-war-q1-test.cjs — R-WEB-AI-NO-MARCH-WITHOUT-WAR-Q1 (runda 1).
 * Marsz/zbiorka ofensywna AI (dyrektywa wojny wymuszonej, kampania wodza) wymaga faktycznej wojny z celem.
 * Run from gra/:  node tools/ai-no-march-without-war-q1-test.cjs
 */
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const work = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'nmww-q1-'));
const entry = path.join(work, 'entry.ts');
const out = path.join(work, 'bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn } from ${JSON.stringify(path.join(root, 'src/game/ai'))};
// (usuniete)
export { isCityUnderSiege } from ${JSON.stringify(path.join(root, 'src/game/city-siege-state'))};
export { siegeAllowedBetween, isSiegeStillValid, detectWarAutoSiegeOnCity } from ${JSON.stringify(path.join(root, 'src/game/diplomacy-siege-war-gate'))};
export { warPartnerIdsForOwner } from ${JSON.stringify(path.join(root, 'src/game/diplomacy-pair-summary'))};
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: out, absWorkingDir: root, logLevel: 'silent',
});
const api = require(out);

let ok = 0;
const t = (name, fn) => { fn(); ok++; console.log('[OK]', name); };

function makeMap(size = 14) {
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
const city = (id, ownerId, q, r) => ({ id, ownerId, q, r, population: 5, kultura: 0, name: id });

// Scenariusz: stos 4 jednostek AI(1) 2 heksy od pustego miasta (2), plus jednostka (2) obok.
function scenario() {
  const units = [
    unit('a1', 1, 5, 5), unit('a2', 1, 5, 6), unit('a3', 1, 6, 5), unit('a4', 1, 6, 6),
    unit('e1', 2, 8, 5),
  ];
  const cities = [city('home', 1, 3, 3), city('memfis', 2, 8, 6)];
  return { units, cities };
}
const hexDist = (q1, r1, q2, r2) => (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(q1 + r1 - q2 - r2)) / 2;
// rozkaz „pod mur / do wroga”: atak albo ruch na heks sąsiadujący z jednostką (8,5) lub miastem (8,6) gracza 2
const nearTarget = (c) => c.type === 'attack'
  || (c.type === 'move' && (hexDist(c.toQ, c.toR, 8, 5) <= 1 || hexDist(c.toQ, c.toR, 8, 6) <= 1));
const targetsEnemy = (cmds) => cmds.filter(c =>
  c.type === 'attack'
  || (c.type === 'move' && c.toQ === 8 && c.toR === 6));


const forced = { targetOwnerId: 2, role: 'attacker', era: 'bronze', capturedByAttacker: 0, capturedByDefender: 0 };
const campaign = (stage) => ({
  targetOwnerId: 2, stage, generalUnitId: 'g1', gatherTurnsCompleted: stage === 'attacking' ? 5 : 1,
  rallyQ: 1, rallyR: 1, target: { ownerId: 2, cityId: 'memfis', q: 8, r: 6 }, turn: 10,
});
const moves = (cmds) => cmds.filter(c => c.type === 'move' || c.type === 'attack')
  .map(c => `${c.type}:${c.unitId}:${c.toQ},${c.toR}`).join('|');
const run = (engage, extra) => {
  const { units, cities } = scenario();
  return api.decideAITurn(1, units, cities, makeMap(), data, { canEngageOwner: engage, ...extra });
};

t('K+ wojna wymuszona w WOJNIE: napastnik maszeruje na cel (czulosc harnessu)', () => {
  const cmds = run(() => true, { forcedWar: forced });
  assert.ok(cmds.some(nearTarget), 'w wojnie idzie pod mur / na miasto celu');
});
t('RED->GREEN: dyrektywa wojny wymuszonej BEZ wojny (relacja != wojna) = zero marszu na cel 2', () => {
  const cmds = run(o => o !== 2, { forcedWar: forced });
  assert.strictEqual(cmds.filter(nearTarget).length, 0, 'zero marszu pod mur / na miasto bez wojny');
  assert.strictEqual(cmds.filter(c => c.type === 'move' && c.toQ === 8 && c.toR === 6).length, 0, 'zero wejscia na heks miasta');
});
t('ruch przerwany po pokoju: ta sama dyrektywa, wojna -> pokoj w kolejnej turze', () => {
  let war = true;
  const engage = o => (o === 2 ? war : true);
  assert.ok(run(engage, { forcedWar: forced }).some(nearTarget), 'tura 1 (wojna): marsz');
  war = false;
  assert.strictEqual(run(engage, { forcedWar: forced }).filter(nearTarget).length, 0, 'tura 2 (pokoj): marsz przerwany');
});
t('rola obroncy (defender) bez wojny: zero ruchu na jednostki/miasta strony 2', () => {
  const cmds = run(o => o !== 2, { forcedWar: { ...forced, role: 'defender' } });
  assert.strictEqual(cmds.filter(nearTarget).length, 0);
});
for (const stage of ['recruiting', 'gathering', 'attacking']) {
  t(`kampania wodza (${stage}) bez wojny z celem: zero zbiorki/marszu; w wojnie kampania steruje jednostkami`, () => {
    const noWar = run(o => o !== 2, { aiGeneralWarCampaign: campaign(stage) });
    const base = run(o => o !== 2, {});
    assert.strictEqual(moves(noWar), moves(base), 'bez wojny kampania nie zmienia decyzji (brak zbiorki pod cel)');
    assert.strictEqual(noWar.filter(nearTarget).length, 0);
  });
}
t('K+ kampania wodza w wojnie zmienia decyzje wzgledem braku kampanii (harness czuly)', () => {
  const withWar = run(() => true, { aiGeneralWarCampaign: campaign('gathering') });
  const noCamp = run(() => true, {});
  assert.notStrictEqual(moves(withWar), moves(noCamp));
});
t('wojna jest JEDNYM wpisem pary (obustronna z definicji): getDiploRelation/setDiploRelation uzywaja nieuporzadkowanego klucza', () => {
  const src = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
  const get = src.match(/function getDiploRelation\([\s\S]*?const key = ([^;]+);/);
  const set = src.match(/function setDiploRelation\([\s\S]*?const key = ([^;]+);/);
  assert.ok(get && set, 'funkcje znalezione');
  assert.strictEqual(get[1], set[1], 'ten sam klucz pary (a<b ? a_b : b_a) w odczycie i zapisie');
  assert.ok(/a < b \?/.test(get[1]), 'klucz niezalezny od kolejnosci stron');
});
t('strazniki statyczne: main.ts czysci wpis wojny wymuszonej bez wojny; ai.ts bramkuje forcedWar i kampanie', () => {
  const m = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
  assert.ok(/R-WEB-AI-NO-MARCH-WITHOUT-WAR-Q1: wpis rejestru wojny wymuszonej bez FAKTYCZNEJ wojny/.test(m));
  assert.ok(/getDiploRelation\(staleSt\.attackerId, staleSt\.targetId\)\.status === 'wojna'/.test(m));
  const a = fs.readFileSync(path.join(root, 'src/game/ai.ts'), 'utf8');
  assert.ok(/forcedWar\?\.role === 'attacker'\s*&& aiCanEngageOwner\(opts, opts\.forcedWar\.targetOwnerId\)/.test(a));
  assert.ok(/if \(!aiCanEngageOwner\(opts, campaign\.target\.ownerId\)\) return false;/.test(a));
});
console.log(`\nPASS ${ok}`);
