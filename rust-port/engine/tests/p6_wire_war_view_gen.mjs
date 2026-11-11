// P6-WIRE-WAR-WORLDVIEW (W2): generator wektorow z URUCHOMIONEGO weba.
// Uzycie: node --experimental-strip-types tests/p6_wire_war_view_gen.mjs <katalog gra/src z origin/main> > tests/p6_wire_war_view_vectors.json
// Katalog: `git archive origin/main gra/src gra/data` rozpakowany poza repo.
// Wywoluje prawdziwe `buildWarCityTargets` z gra/src/game/ai-war-target-select.ts (czysta funkcja).
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('podaj katalog gra/src z web');
const mod = await import(pathToFileURL(path.join(root, 'game', 'ai-war-target-select.ts')).href);

// Scenariusze: wejscia w ksztalcie Rust-owym (x = q, y = r; wlasciciele liczbowo).
const scenarios = [
  {
    name: 'AI atakuje AI: najblizsze miasto, obrona w miescie',
    selfOwnerId: 1,
    players: [{ id: 0, isHuman: true }, { id: 1, isHuman: false }, { id: 2, isHuman: false }, { id: 3, isHuman: false }],
    barbarianOwnerIds: [],
    enemyOwnerIds: [2, 3],
    engageOwnerIds: [2, 3],
    cities: [
      { id: '21', owner: 2, x: 4, y: 1, isCapital: true },
      { id: '22', owner: 2, x: 0, y: 3, isCapital: false },
      { id: '31', owner: 3, x: 7, y: 2, isCapital: true },
    ],
    combatUnits: [{ owner: 2, x: 0, y: 3 }, { owner: 2, x: 0, y: 3 }, { owner: 3, x: 7, y: 2 }],
  },
  {
    name: 'AI atakuje gracza: wszystkie miasta gracza; barbarzynca poza zasada',
    selfOwnerId: 2,
    players: [{ id: 0, isHuman: true }, { id: 2, isHuman: false }, { id: 9, isHuman: false }],
    barbarianOwnerIds: [9],
    enemyOwnerIds: [0, 9],
    engageOwnerIds: [0, 9],
    cities: [
      { id: '101', owner: 0, x: 2, y: 2, isCapital: true },
      { id: '102', owner: 0, x: 6, y: 0, isCapital: false },
      { id: '191', owner: 9, x: 3, y: 3, isCapital: true },
    ],
    combatUnits: [{ owner: 0, x: 6, y: 0 }, { owner: 9, x: 3, y: 3 }],
  },
  {
    name: 'Gracz jako atakujacy: poza zasada najblizszego miasta, tylko stolica wroga',
    selfOwnerId: 0,
    players: [{ id: 0, isHuman: true }, { id: 1, isHuman: false }, { id: 2, isHuman: false }],
    barbarianOwnerIds: [],
    enemyOwnerIds: [1, 2],
    engageOwnerIds: [1, 2],
    cities: [
      { id: '11', owner: 1, x: 1, y: 1, isCapital: false },
      { id: '12', owner: 1, x: 5, y: 4, isCapital: true },
      { id: '21', owner: 2, x: 6, y: 1, isCapital: true },
      { id: '22', owner: 2, x: 2, y: 4, isCapital: false },
    ],
    combatUnits: [{ owner: 1, x: 5, y: 4 }],
  },
  {
    name: 'Brak engage dla czesci wrogow; obrona tylko z jednostek bojowych',
    selfOwnerId: 3,
    players: [{ id: 3, isHuman: false }, { id: 4, isHuman: false }, { id: 5, isHuman: false }],
    barbarianOwnerIds: [],
    enemyOwnerIds: [4, 5],
    engageOwnerIds: [5],
    cities: [
      { id: '41', owner: 4, x: 3, y: 0, isCapital: true },
      { id: '51', owner: 5, x: 3, y: 2, isCapital: true },
      { id: '52', owner: 5, x: 0, y: 0, isCapital: false },
    ],
    combatUnits: [{ owner: 5, x: 3, y: 2 }, { owner: 5, x: 3, y: 2 }],
  },
];

const out = scenarios.map(s => {
  const isHuman = id => !!s.players.find(p => p.id === id)?.isHuman;
  const isBarbarian = id => s.barbarianOwnerIds.includes(id);
  const webCities = s.cities.map(c => ({ id: c.id, ownerId: c.owner, q: c.x, r: c.y }));
  const webUnits = s.combatUnits.map(u => ({ ownerId: u.owner, q: u.x, r: u.y }));
  const capMap = new Map(s.cities.filter(c => c.isCapital).map(c => [c.owner, c.id]));
  const targets = mod.buildWarCityTargets({
    selfOwnerId: s.selfOwnerId,
    enemyOwnerIds: s.enemyOwnerIds,
    engage: o => s.engageOwnerIds.includes(o),
    cities: webCities,
    combatUnits: webUnits,
    isHuman,
    isBarbarian,
    capitalCityIdForOwner: o => capMap.get(o) ?? null,
  });
  return {
    name: s.name,
    selfOwnerId: s.selfOwnerId,
    players: s.players,
    barbarianOwnerIds: s.barbarianOwnerIds,
    enemyOwnerIds: s.enemyOwnerIds,
    engageOwnerIds: s.engageOwnerIds,
    cities: s.cities,
    combatUnits: s.combatUnits,
    expected: targets.map(t => ({ ownerId: t.ownerId, cityId: t.cityId, q: t.q, r: t.r, defenders: t.defenders ?? null })),
  };
});

process.stdout.write(JSON.stringify({ webPin: 'origin/main gra/src/game/ai-war-target-select.ts buildWarCityTargets', scenarios: out }, null, 1) + '\n');
