// Generator wektorow referencyjnych z URUCHOMIONEGO kodu weba (P6.1, pin edb8fb56).
// Moduly: civ-entry-epoch.ts, owner-utils.ts, human-owners.ts, civ-roster.ts (makeRng, civIdsFromRoster).
// Uzycie (z katalogu runu, web = git archive edb8fb56 gra/src w katalogu tymczasowym):
//   node --experimental-strip-types --import ./p61-loader-register.mjs ./gen-p61-web-vectors.mjs <WEB_ROOT> <OUT_JSON>
//
// STUBY (r2): stubs/barbarians.ts i stubs/society-breakdown.ts NIE sa pisane recznie. Ten generator
// wycina je z plikow weba (linie zakotwiczone regexem) i zapisuje werbatim. Loader podstawia je
// wylacznie w grafie importow owner-utils/human-owners (ciezki graf barbarians.ts nie jest potrzebny).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const [, , webRootArg, outArg] = process.argv;
if (!webRootArg || !outArg) {
  console.error('usage: <WEB_ROOT> <OUT_JSON>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const game = (f) => pathToFileURL(join(webRoot, 'gra/src/game', f)).href;

// --- Stuby werbatim: wyciecie linii z weba + kotwice (blad => generator konczy sie bledem) ---
function sliceLines(src, from, to) {
  return src.split('\n').slice(from - 1, to).join('\n') + '\n';
}
const barbLines = readFileSync(join(webRoot, 'gra/src/game/barbarians.ts'), 'utf8');
const socLines = readFileSync(join(webRoot, 'gra/src/game/society-breakdown.ts'), 'utf8');
const barbStub = sliceLines(barbLines, 49, 54);
const socStub = sliceLines(socLines, 205, 206);
const anchors = {
  barb_const_49: barbLines.split('\n')[48] === 'export const BARBARIAN_OWNER_ID = -1;',
  barb_fn_52: barbLines.split('\n')[51] === 'export function isBarbarian(ownerId: number): boolean {',
  barb_ret_53: barbLines.split('\n')[52] === '  return ownerId === BARBARIAN_OWNER_ID;',
  barb_close_54: barbLines.split('\n')[53] === '}',
  rebel_doc_205: socLines.split('\n')[204].startsWith('/** Id frakcji rebeliant'),
  rebel_const_206: socLines.split('\n')[205] === 'export const REBEL_FACTION_OWNER_ID = -99;',
};
for (const [k, v] of Object.entries(anchors)) {
  if (!v) throw new Error(`stub anchor drift: ${k}`);
}
const stubDir = fileURLToPath(new URL('./stubs/', import.meta.url));
writeFileSync(join(stubDir, 'barbarians.ts'), barbStub);
writeFileSync(join(stubDir, 'society-breakdown.ts'), socStub);

const civ = await import(game('civ-entry-epoch.ts'));
const own = await import(game('owner-utils.ts'));
const hum = await import(game('human-owners.ts'));
const roster_ = await import(game('civ-roster.ts'));

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
  label: civ.formatCivEntryEpochLabel(c),
}));

// gameEpochHudLabel: wejscia numeryczne; NaN/Infinity jako tekst (JSON nie zna NaN).
const HUD_INPUTS = ['-1', '0', '0.4', '0.5', '1', '1.4', '1.5', '2', '2.5', '2.6', '3', '3.4', '3.5', '4', '1e9', '-1e9', 'NaN', 'Infinity', '-Infinity'];
const hudLabels = HUD_INPUTS.map((s) => ({ input: s, label: civ.gameEpochHudLabel(Number(s)) }));

const roster = [
  { ikonaId: 'A', epokaWejscia: 'kamien' },
  { ikonaId: 'B', epokaWejscia: 'braz' },
  { ikonaId: 'C', epokaWejscia: 'zelazo' },
  { ikonaId: 'D', epokiStartowe: ['braz', 'zelazo'] },
  { epokaWejscia: 'kamien' }, // bez ikonaId - pomijany
  { ikonaId: 'E', epokiStartowe: ['xyz'] },
  { ikonaId: '', epokaWejscia: 'kamien' }, // pusty ikonaId - pomijany
];
const rosterAvail = Object.fromEntries(
  GAME_EPOCHS.map((g) => [g, civ.civIdsAvailableAtGameEpoch(roster, g)]),
);
const rosterIds = roster_.civIdsFromRoster(roster);

// makeRng (mulberry32): seedy w zakresie u32; kazdy strumien: 8 kolejnych wartosci.
const RNG_SEEDS = [0, 1, 42, 123456789, 0xffffffff, 0x6d2b79f5, 2147483648];
const rng = RNG_SEEDS.map((seed) => {
  const next = roster_.makeRng(seed);
  const values = Array.from({ length: 8 }, () => next());
  // valuesText: dokladna forma tekstowa JS (String(x), najkrotsza reprezentacja round-trip).
  // serde_json bez feature float_roundtrip nie parsuje z pelna dokladnoscia, wiec test Rust czyta tekst.
  return { seed, values, valuesText: values.map((v) => String(v)) };
});

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

// Poza domena (NIE-DOTYCZY w Rust): id -5 nie jest reprezentowalne w OwnerRef. Web zwraca:
const outOfDomain = {
  note: 'id -5 spoza {-99,-1,>=0}: niereprezentowalne w OwnerRef (rust ids.rs from_legacy_i64 => None)',
  owner: -5,
  isAiOwner_default_seats: hum.isAiOwner({ humanOwnerIds: [0], activeHumanOwnerId: 0 }, -5),
  isMajorAiOwner: own.isMajorAiOwner(-5, () => false),
};

const out = {
  pin: 'edb8fb56',
  generator: 'gen-p61-web-vectors.mjs (r2)',
  sourceFiles: [
    'gra/src/game/civ-entry-epoch.ts',
    'gra/src/game/owner-utils.ts',
    'gra/src/game/human-owners.ts',
    'gra/src/game/civ-roster.ts',
  ],
  stubNote: 'stubs/barbarians.ts = linie 49-54 i stubs/society-breakdown.ts = linie 205-206 weba, wyciete werbatim przez generator (kotwice anchors)',
  anchors,
  constants: {
    GAME_EPOCH_ORDER: [...civ.GAME_EPOCH_ORDER],
    HUMAN_OWNER_PRIMARY: hum.HUMAN_OWNER_PRIMARY,
    gameEpochIndex: Object.fromEntries(GAME_EPOCHS.map((g) => [g, civ.gameEpochIndex(g)])),
  },
  civEntry,
  hudLabels,
  rosterAvail,
  rosterIds,
  rng,
  majorAi,
  seats,
  outOfDomain,
};
writeFileSync(presolve(outArg), JSON.stringify(out, null, 2) + '\n');
console.log(`OK civEntry=${civEntry.length} hud=${hudLabels.length} rng=${rng.length} seats=${seats.length} out=${presolve(outArg)}`);
