// Generator wektorow referencyjnych z URUCHOMIONEGO kodu weba (P6.1: civ-entry-epoch, owner-utils, human-owners).
// Uzycie (z katalogu runu, web = wyeksportowany git archive edb8fb56 w katalogu tymczasowym):
//   node --experimental-strip-types --import ./p61-loader-register.mjs ./gen-p61-web-vectors.mjs <WEB_ROOT> <OUT_JSON>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outArg] = process.argv;
if (!webRootArg || !outArg) {
  console.error('usage: <WEB_ROOT> <OUT_JSON>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const game = (f) => pathToFileURL(join(webRoot, 'gra/src/game', f)).href;

// Weryfikacja, ze stuby zgadzaja sie z trescia weba (dowod, ze stale sa werbatim).
const barbSrc = readFileSync(join(webRoot, 'gra/src/game/barbarians.ts'), 'utf8');
const socSrc = readFileSync(join(webRoot, 'gra/src/game/society-breakdown.ts'), 'utf8');
const stubChecks = {
  barbarian_const: /export const BARBARIAN_OWNER_ID = -1;/.test(barbSrc),
  barbarian_fn: /export function isBarbarian\(ownerId: number\): boolean \{\s*return ownerId === BARBARIAN_OWNER_ID;\s*\}/.test(barbSrc),
  rebel_const: /export const REBEL_FACTION_OWNER_ID = -99;/.test(socSrc),
};
for (const [k, v] of Object.entries(stubChecks)) {
  if (!v) throw new Error(`stub drift: ${k}`);
}

const civ = await import(game('civ-entry-epoch.ts'));
const own = await import(game('owner-utils.ts'));
const hum = await import(game('human-owners.ts'));

const GAME_EPOCHS = ['kamien', 'braz', 'zelazo', 'bogus', '', 'Kamien', 'stone'];
const CIVS = [
  { epokaWejscia: 'kamien' },
  { epokaWejscia: 'braz' },
  { epokaWejscia: 'zelazo' },
  { epokaWejscia: 'bogus' },
  { epokaWejscia: 'Kamien' },
  { epokaWejscia: 'stone' },
  { epokaWejscia: '' },
  {},
  { epokiStartowe: [] },
  { epokiStartowe: ['zelazo', 'braz'] },
  { epokiStartowe: ['xyz', 'braz'] },
  { epokiStartowe: ['xyz'] },
  { epokiStartowe: ['stone'] },
  { epokaWejscia: 'bogus', epokiStartowe: ['zelazo'] },
  { epokaWejscia: 'zelazo', epokiStartowe: ['kamien'] },
  { epokiStartowe: ['braz', 'kamien', 'zelazo'] },
];

const civEntry = CIVS.map((c) => ({
  input: c,
  entry: civ.getCivEpokaWejscia(c),
  available: Object.fromEntries(GAME_EPOCHS.map((g) => [g, civ.isCivAvailableAtGameEpoch(c, g)])),
}));

const roster = [
  { ikonaId: 'A', epokaWejscia: 'kamien' },
  { ikonaId: 'B', epokaWejscia: 'braz' },
  { ikonaId: 'C', epokaWejscia: 'zelazo' },
  { ikonaId: 'D', epokiStartowe: ['braz', 'zelazo'] },
  { epokaWejscia: 'kamien' }, // bez ikonaId - pomijany
  { ikonaId: 'E', epokiStartowe: ['xyz'] },
];
const rosterAvail = Object.fromEntries(
  GAME_EPOCHS.map((g) => [g, civ.civIdsAvailableAtGameEpoch(roster, g)]),
);

const OWNERS = [-99, -1, 0, 1, 2, 3, 100];
const CITY_STATES = new Set([2, 3]);
const majorAi = OWNERS.map((o) => ({ owner: o, major: own.isMajorAiOwner(o, (id) => CITY_STATES.has(id)) }));

const SEATS = [
  { humanOwnerIds: [0], activeHumanOwnerId: 0 },
  { humanOwnerIds: [0, 1], activeHumanOwnerId: 0 },
  { humanOwnerIds: [0, 1], activeHumanOwnerId: 1 },
  { humanOwnerIds: [0, 5, 7], activeHumanOwnerId: 5 },
  { humanOwnerIds: [0, 5, 7], activeHumanOwnerId: 7 },
  { humanOwnerIds: [], activeHumanOwnerId: 0 },
  { humanOwnerIds: [0, 1], activeHumanOwnerId: 9 },
  { humanOwnerIds: [2, 2], activeHumanOwnerId: 2 },
];
const OWNER_PROBE = [-99, -1, 0, 1, 2, 5, 7, 9];
const seats = SEATS.map((s) => ({
  seats: s,
  isHotSeat: hum.isHotSeat(s),
  nextHumanSeat: hum.nextHumanSeat(s),
  owners: OWNER_PROBE.map((o) => ({
    owner: o,
    isHuman: hum.isHumanOwner(s, o),
    isActive: hum.isActiveHuman(s, o),
    isAi: hum.isAiOwner(s, o),
  })),
}));

const out = {
  pin: 'edb8fb56',
  sourceFiles: ['gra/src/game/civ-entry-epoch.ts', 'gra/src/game/owner-utils.ts', 'gra/src/game/human-owners.ts'],
  stubNote: 'barbarians.ts / society-breakdown.ts zastapione stubami z werbatim stalymi (stubChecks)',
  stubChecks,
  constants: {
    GAME_EPOCH_ORDER: [...civ.GAME_EPOCH_ORDER],
    HUMAN_OWNER_PRIMARY: hum.HUMAN_OWNER_PRIMARY,
    gameEpochIndex: Object.fromEntries(GAME_EPOCHS.map((g) => [g, civ.gameEpochIndex(g)])),
  },
  civEntry,
  rosterAvail,
  majorAi,
  seats,
};
writeFileSync(presolve(outArg), JSON.stringify(out, null, 2) + '\n');
console.log(`OK civEntry=${civEntry.length} seats=${seats.length} out=${presolve(outArg)}`);
