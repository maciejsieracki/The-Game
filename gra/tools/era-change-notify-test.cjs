/**
 * era-change-notify-test.cjs — copy + logika shouldNotifyPlayerEraChange.
 * Usage (z gra/): node tools/era-change-notify-test.cjs
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const ENTRY = path.join(GRA_DIR, 'src/game/era-change-notify.ts');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');

const outfile = path.join(os.tmpdir(), 'era-change-notify-bundle.cjs');
execSync(
  '"' + ESBUILD_BIN + '" "' + ENTRY + '" --bundle --platform=node --format=cjs --outfile="' + outfile + '"',
  { stdio: 'inherit' },
);

const mod = require(outfile);
const {
  ERA_CHANGE_NOTIFY,
  shouldNotifyPlayerEraChange,
  eraChangeNotifyBody,
  eraChangeNotifyToastHtml,
  eraChangeJournalTitle,
} = mod;

let pass = 0;
let fail = 0;

function check(label, cond) {
  if (cond) {
    pass++;
    console.log('  OK', label);
  } else {
    fail++;
    console.error(' FAIL', label);
  }
}

console.log('era-change-notify-test.cjs\n');

check('title PL', ERA_CHANGE_NOTIFY.title === 'Nowa epoka');
check('shouldNotify 1→2', shouldNotifyPlayerEraChange(1, 2) === true);
check('shouldNotify 2→2 false', shouldNotifyPlayerEraChange(2, 2) === false);
check('shouldNotify 3→2 false', shouldNotifyPlayerEraChange(3, 2) === false);

check('body Brąz', eraChangeNotifyBody(2) === 'Wkraczasz w epokę Brązu.');
check('body Żelazo', eraChangeNotifyBody(3) === 'Wkraczasz w epokę Żelaza.');
check('toast HTML', eraChangeNotifyToastHtml(2).includes('<b>Nowa epoka</b>'));
check('journal title', eraChangeJournalTitle(3) === 'Nowa epoka: Żelaza');

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
