'use strict';
/**
 * diplomacy-audience-actions-test.cjs — pełny katalog akcji + lock notes (D-DYPLO-*).
 * Run from gra/: node tools/diplomacy-audience-actions-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.dip-audience-actions-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-audience-actions-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  AUDIENCE_BASIC_IDS,
  diplomacyActionIdFromLabel,
  buildAudienceActionsList,
  audienceActionStatusNote,
  audienceActionBarLockNote,
} from ${JSON.stringify(SRC + '/game/diplomacy-audience-actions')};
export { AUDIENCE_LOCK_NOTE_CITY_STATE } from ${JSON.stringify(SRC + '/game/diplomacy-layers')};
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
  AUDIENCE_BASIC_IDS,
  diplomacyActionIdFromLabel,
  buildAudienceActionsList,
  audienceActionStatusNote,
  audienceActionBarLockNote,
  AUDIENCE_LOCK_NOTE_CITY_STATE,
} = require(BUNDLE);

const diplomacyJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'data', 'diplomacy.json'), 'utf8'),
);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error('  FAIL:', msg);
}

const akcje = diplomacyJson.akcje_dyplomatyczne ?? [];

ok(diplomacyActionIdFromLabel('3. Sojusz') === '3', 'id z etykiety JSON');
ok(diplomacyActionIdFromLabel('14. Umowa') === '14', 'id dwucyfrowe');

const lockCtxBase = {
  contact: true,
  atWar: false,
  relTotal: 10,
  zaufanie: 10,
  respekt: 10,
  hasNap: false,
  hasHandel: false,
  hasTradeConnection: true,
  hasWymiana: false,
  hasSojusz: false,
  sellableTechCount: 1,
  knownRivalsCount: 1,
  progNapRelacja: 50,
  progHandelRelacja: 0,
  progSojuszRelacja: 151,
  progSojuszZaufanie: 91,
  progGraniceRelacja: 100,
  progGraniceZaufanie: 45,
  progWymianaTechZaufanie: 70,
  progNamowWojneZaufanie: 50,
  progWasalizacjaRespekt: 70,
  progTrybutZadanieMinRespekt: 70,
  progDarRelacja: 30,
  isCityStatePartner: true,
  hasWasal: false,
  wasalAgeTurns: 0,
  graczWchlonieciePoWasaluTur: 10,
};

// KATALOG=A: pełna lista z JSON (bez kontaktu '1').
{
  const full = buildAudienceActionsList({
    akcje,
    ownerId: 9,
    restrictToBasicActions: false,
    simplifiedOwners: new Set(),
    layer: 'full',
    lockCtxBase,
  });
  const expectedCount = akcje.filter(r => diplomacyActionIdFromLabel(r.Akcja ?? '') !== '1').length;
  ok(full.length === expectedCount, 'pełny katalog: ' + full.length + ' akcji (bez kontaktu)');
  ok(!full.some(a => a.id === '1'), 'kontakt id=1 pominięty');
  ok(full.some(a => a.id === '3'), 'sojusz id=3 obecny w katalogu');
  ok(full.some(a => a.id === '6'), 'wymiana tech id=6 obecna');
}

// MP restriction = lock, nie omit (sojusz szary wobec MP).
{
  const mp = buildAudienceActionsList({
    akcje,
    ownerId: 9,
    restrictToBasicActions: true,
    simplifiedOwners: new Set(),
    layer: 'full',
    lockCtxBase,
  });
  const sojusz = mp.find(a => a.id === '3');
  ok(sojusz != null, 'sojusz NIE ukryty wobec MP');
  ok(sojusz && sojusz.locked === true, 'sojusz locked wobec MP');
  ok(sojusz && sojusz.lockNote === AUDIENCE_LOCK_NOTE_CITY_STATE, 'sojusz lockNote MP');
  ok(!sojusz?.enabled, 'sojusz disabled wobec MP');

  const nap = mp.find(a => a.id === '2');
  ok(nap != null, 'NAP obecny wobec MP');
  ok(nap && nap.lockNote !== AUDIENCE_LOCK_NOTE_CITY_STATE, 'NAP nie locked z powodu MP (tylko progi/stan)');
}

ok(AUDIENCE_BASIC_IDS.has('2'), 'basic zawiera NAP');
ok(!AUDIENCE_BASIC_IDS.has('3'), 'basic NIE zawiera sojuszu');

// oś C — stały wiersz powodu (helper UI).
{
  const locked = { locked: true, enabled: false, lockNote: 'zablokowana — wymaga Zaufania 91 (masz 10)' };
  const note = audienceActionStatusNote(locked);
  ok(note.includes('Zaufania 91'), 'statusNote pełny tekst bez skrótu');
  ok(note.length > 40, 'statusNote nie obcina do 40 znaków');

  const barNote = audienceActionBarLockNote(locked);
  ok(barNote === locked.lockNote, 'actionBarLockNote z lockNote');

  const active = { locked: false, enabled: true, active: true, lockNote: '' };
  ok(audienceActionStatusNote(active) === 'już zawarta', 'active → już zawarta');

  // STRICT-EDGE — on-table + enabled (Evaluator FAIL #STRICT)
  ok(
    audienceActionStatusNote({ locked: false, enabled: true }, true) === 'na stole — Przyjmij w PN',
    'onTable → stały komunikat',
  );
  ok(audienceActionStatusNote({ locked: false, enabled: true }) === '', 'enabled → brak wiersza');
}

console.log('diplomacy-audience-actions-test: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
