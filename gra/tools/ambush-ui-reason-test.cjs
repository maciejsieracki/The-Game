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

console.log('');
console.log('Wynik: ' + pass + ' OK, ' + fail + ' FAIL');
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
