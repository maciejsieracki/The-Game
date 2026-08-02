'use strict';
/**
 * diplomacy-layers-test.cjs — kontakt dyplomatyczny vs widoczność / formalny kontakt.
 * Run from gra/: node tools/diplomacy-layers-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.dip-layers-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-layers-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeDiplomaticContacts,
  filterDiplomacyCommandsForEstablishedContact,
  filterDiplomacyCommandsForLayer,
  filterCityStateTributeCommands,
  diplomacyLayerForOwner,
  barbarianWarRelation,
  audienceRestrictedActionLockNote,
  AUDIENCE_LOCK_NOTE_CITY_STATE,
  AUDIENCE_LOCK_NOTE_SAME_TYPE_RIVAL,
} from ${JSON.stringify(SRC + '/game/diplomacy-layers')};
export { BARBARIAN_OWNER_ID } from ${JSON.stringify(SRC + '/game/barbarians')};
export type { AIDiplomacyCommand } from ${JSON.stringify(SRC + '/game/ai')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  computeDiplomaticContacts,
  filterDiplomacyCommandsForEstablishedContact,
  filterDiplomacyCommandsForLayer,
  filterCityStateTributeCommands,
  diplomacyLayerForOwner,
  barbarianWarRelation,
  audienceRestrictedActionLockNote,
  AUDIENCE_LOCK_NOTE_CITY_STATE,
  AUDIENCE_LOCK_NOTE_SAME_TYPE_RIVAL,
  BARBARIAN_OWNER_ID,
} = require(BUNDLE);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error('  FAIL:', msg);
}

const cities = [
  { ownerId: 1, q: 5, r: 5 },
  { ownerId: 2, q: 20, r: 20 },
];
const units = [
  { ownerId: 3, q: 8, r: 8 },
];

const visibleNear = new Set(['5,5', '8,8']);
const exploredFar = new Set(['5,5', '8,8', '20,20']);

const visContacts = computeDiplomaticContacts(visibleNear, cities, units);
ok(visContacts.has(1), 'widoczne miasto → kontakt');
ok(visContacts.has(3), 'widoczna jednostka → kontakt');
ok(!visContacts.has(2), 'niewidoczne miasto → brak kontaktu');

const exploredContacts = computeDiplomaticContacts(exploredFar, cities, units);
ok(exploredContacts.has(2), 'explored hex dalekiego miasta → kontakt (API)');

const simplified = new Set([1]);
const foreign = new Set([2]);
const contacted = new Set([1]);
ok(
  diplomacyLayerForOwner(2, simplified, foreign, contacted) === 'pre_contact',
  'obcy typ bez odkrycia → pre_contact',
);
ok(
  diplomacyLayerForOwner(1, simplified, foreign, contacted) === 'simplified',
  'odkryte miasto-panstwo → simplified',
);

const cmds = [
  { type: 'zaproponuj_handel', targetId: 0, powod: 'test' },
  { type: 'wypowiedz_wojne', targetId: 0, powod: 'test' },
  { type: 'zaproponuj_audiencje', targetId: '0', powod: 'test' },
];
const filtered = filterDiplomacyCommandsForEstablishedContact(cmds, false);
ok(filtered.length === 2, 'brak handlu bez formalnego kontaktu — audiencja dozwolona');
ok(filtered.some(c => c.type === 'zaproponuj_audiencje'), 'audiencja przechodzi bez kontaktu');
ok(filtered.some(c => c.type === 'wypowiedz_wojne'), 'wojna bez kontaktu OK');
ok(!filtered.some(c => c.type === 'zaproponuj_handel'), 'handel zablokowany bez kontaktu');
ok(
  filterDiplomacyCommandsForEstablishedContact(cmds, true).length === 3,
  'po formalnym kontakcie — pełna lista',
);

// C-BARB-Q1/Q2 (Maciej 2026-07-26): barbarzyńcy nie są "cywilizacją" do
// negocjacji -- widoczny obóz/jednostka barbarzyńców nie może wpaść do
// diplomaticallyDiscoveredOwners (inaczej main.ts checkNewDiplomaticContacts
// otwierałby graczowi pełną audiencję z "Barbarzyńcami").
{
  const citiesWithBarb = [
    { ownerId: 1, q: 5, r: 5 },
  ];
  const unitsWithBarb = [
    { ownerId: 3, q: 8, r: 8 },
    { ownerId: BARBARIAN_OWNER_ID, q: 9, r: 9 },
  ];
  const vis = new Set(['5,5', '8,8', '9,9']);
  const contacts = computeDiplomaticContacts(vis, citiesWithBarb, unitsWithBarb);
  ok(contacts.has(1), 'real city owner still contacted');
  ok(contacts.has(3), 'real unit owner still contacted');
  ok(!contacts.has(BARBARIAN_OWNER_ID), 'visible barbarian unit NEVER becomes a diplomatic contact');
}

// barbarianWarRelation: realna relacja 'wojna' w tej samej strukturze Relation.
{
  const rel = barbarianWarRelation();
  ok(rel.status === 'wojna', 'barbarianWarRelation status is wojna');
  ok(rel.zaufanie === 0, 'barbarianWarRelation zaufanie is 0 (no trust, ever)');
  ok(typeof rel.respekt === 'number', 'barbarianWarRelation respekt is a number');
}

// Maciej 2026-07-29 — etykiety wyszarzonych akcji na audiencji (MP vs rywal tego samego typu).
{
  const simplified = new Set([7]);
  ok(
    audienceRestrictedActionLockNote(7, simplified) === AUDIENCE_LOCK_NOTE_SAME_TYPE_RIVAL,
    'rywal tego samego typu → własny komunikat',
  );
  ok(
    audienceRestrictedActionLockNote(9, simplified) === AUDIENCE_LOCK_NOTE_CITY_STATE,
    'obce miasto-państwo → komunikat MP',
  );
  ok(
    AUDIENCE_LOCK_NOTE_CITY_STATE === 'Niedostępne u miasta-państwa',
    'kanon etykiety MP',
  );
}

// Maciej 2026-08-02 — miasta-państwa nie generują komend trybutu (spójnie z UI).
{
  const cmds = [
    { type: 'zadaj_trybut', targetId: '0', powod: 'test' },
    { type: 'oferuj_trybut_za_pokoj', targetId: '0', powod: 'test' },
    { type: 'wypowiedz_wojne', targetId: '0', powod: 'test' },
  ];
  const filtered = filterCityStateTributeCommands(cmds, true);
  ok(filtered.length === 1 && filtered[0].type === 'wypowiedz_wojne', 'CS: trybut odfiltrowany, wojna zostaje');
  ok(filterCityStateTributeCommands(cmds, false).length === 3, 'pełne AI: trybut bez zmian');
}

console.log(`\ndiplomacy-layers-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
