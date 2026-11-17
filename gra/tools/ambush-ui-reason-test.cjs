/** node gra/tools/ambush-ui-reason-test.cjs — R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (runda 2): powód blokady w `title` przycisku.
 * Sprawdza REALNĄ funkcję renderu paska akcji (buildUnitActionBarHtml) i realny komunikat z canSetAmbush. */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(__dirname, '.ambush-ui-reason-entry.ts');
const BUNDLE = path.join(__dirname, '.ambush-ui-reason-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { buildUnitActionBarHtml } from '../src/ui/unitActionBarHtml';
export { canSetAmbush, AMBUSH_BLOCK_MESSAGES } from '../src/game/ambush';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
  absWorkingDir: ROOT,
});

const M = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) {
    pass++;
    console.log('  OK: ' + name);
  } else {
    fail++;
    console.log('  FAIL: ' + name);
  }
}

function titleOf(html, id) {
  const re = new RegExp('data-act="' + id + '"[^>]*?title="([^"]*)"');
  const m = re.exec(html) || new RegExp('title="([^"]*)"[^>]*data-act="' + id + '"').exec(html);
  return m ? m[1] : null;
}

// Zablokowana zasadzka: w `title` ma być powód po polsku (disabled nie wywołuje handlera).
const blockedCheck = M.canSetAmbush(
  [{ id: 'a', ownerId: 0, q: 1, r: 1, ruchLeft: 0, ambush: undefined }],
  { cityOnHex: false, inBattle: false },
);
const reasonText = blockedCheck.ok ? '' : blockedCheck.message;
console.log('Powód blokady (canSetAmbush):', JSON.stringify(reasonText));

const blockedHtml = M.buildUnitActionBarHtml([
  { id: 'ambush', label: 'Zasadzka', disabled: true, disabledReason: reasonText, active: false },
]);
const blockedTitle = titleOf(blockedHtml, 'ambush');
ok(blockedCheck.ok === false && reasonText.length > 0, 'canSetAmbush zwraca niepusty powód dla stosu bez ruchu');
ok(blockedTitle === reasonText, 'zablokowany przycisk ma powód w title (a nie samą etykietę)');
ok(/disabled/.test(blockedHtml), 'przycisk zablokowany ma atrybut disabled');

// Odblokowany przycisk: title to etykieta (bez powodu).
const openHtml = M.buildUnitActionBarHtml([
  { id: 'ambush', label: 'Zasadzka', disabled: false, disabledReason: 'nieaktualny powód', active: false },
]);
ok(titleOf(openHtml, 'ambush') === 'Zasadzka', 'odblokowany przycisk ma etykietę w title (powód ignorowany)');

// Aktywna zasadzka: przycisk „Odwołaj” nie jest zablokowany, title = etykieta.
const activeHtml = M.buildUnitActionBarHtml([
  { id: 'ambush', label: 'Odwołaj zasadzkę', disabled: false, active: true },
]);
ok(titleOf(activeHtml, 'ambush') === 'Odwołaj zasadzkę', 'aktywna zasadzka: title = „Odwołaj zasadzkę”');

// R-WEB-ARMY-AMBUSH-REQUIRES-GENERAL-Q1 (zarzut Evaluatora 2): powód 'no-general' w title przycisku.
// Stos z ruchem, ale BEZ generała: canSetAmbush blokuje z komunikatem PL, a ten komunikat trafia do title.
const noGeneralCheck = M.canSetAmbush(
  [{ id: 'a', ownerId: 0, q: 1, r: 1, ruchLeft: 3, isGeneral: false, ambush: undefined }],
  { cityOnHex: false, inBattle: false },
);
const noGeneralReason = noGeneralCheck.ok ? '' : noGeneralCheck.message;
const NO_GENERAL_TEXT = 'Zasadzkę może zastawić tylko armia z generałem.';
ok(noGeneralCheck.ok === false && noGeneralCheck.reason === 'no-general', 'stos bez generała (ruch 3): canSetAmbush blokuje, powód no-general');
ok(noGeneralReason === NO_GENERAL_TEXT, 'komunikat no-general = „' + NO_GENERAL_TEXT + '”');
const noGeneralHtml = M.buildUnitActionBarHtml([
  { id: 'ambush', label: 'Zasadzka', disabled: true, disabledReason: noGeneralReason, active: false },
]);
ok(titleOf(noGeneralHtml, 'ambush') === NO_GENERAL_TEXT, 'przycisk Zasadzka bez generała: title = powód no-general');
ok(/disabled/.test(noGeneralHtml), 'przycisk Zasadzka bez generała jest zablokowany (disabled)');

// Kontrola: ten sam stos z generałem jest odblokowany (powód nie jest ustawiony).
const withGeneralCheck = M.canSetAmbush(
  [{ id: 'a', ownerId: 0, q: 1, r: 1, ruchLeft: 3, isGeneral: true, ambush: undefined }],
  { cityOnHex: false, inBattle: false },
);
ok(withGeneralCheck.ok === true, 'stos z generałem (ruch 3): canSetAmbush dopuszcza zasadzkę');

console.log('');
console.log('Wynik: ' + pass + ' OK, ' + fail + ' FAIL');
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
