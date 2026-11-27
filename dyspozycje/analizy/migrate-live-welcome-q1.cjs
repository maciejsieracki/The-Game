'use strict';
// R-WEB-LIVE-TESTS-WELCOME-GATE-Q1 (runda 2): wsadowe przepiecie testow live na wspolny helper
// closeCivWelcome z gra/tools/_live-ready.cjs. Zmienia WYLACZNIE: dodaje import helpera oraz jedno
// wywolanie `await closeCivWelcome(page);` w miejscu, w ktorym strona gry jest juz gotowa (po
// waitForSelector HUD / po wait() przed pierwszym kliknieciem). Asercji ani logiki gry nie rusza.
// Uzycie (z korzenia worktree):  node dyspozycje/analizy/migrate-live-welcome-q1.cjs [--dry]
// Kazdy anchor musi wystapic DOKLADNIE raz w pliku; inaczej skrypt przerywa bez zapisu tego pliku.
const fs = require('fs');
const path = require('path');

const TOOLS = path.resolve(__dirname, '../../gra/tools');
const DRY = process.argv.includes('--dry');
const IMPORT_LINE = "const { closeCivWelcome } = require('./_live-ready.cjs');";
const CALL = 'await closeCivWelcome(page);';

// [plik, anchor (dokladnie raz), tryb: 'after' = po linii anchora, 'before' = przed linia anchora]
const HUD_WAIT = "await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs'";
const PLAN = [
  ['forced-war-iron-player-target-live-test.cjs', HUD_WAIT],
  ['forced-war-player-no-contact-live-test.cjs', HUD_WAIT],
  ['forced-war-player-target-live-test.cjs', HUD_WAIT],
  ['forced-war-r9-no-auto-end-live-test.cjs', HUD_WAIT],
  ['forced-war-trojstronna-domino-live-test.cjs', HUD_WAIT],
  ['era-change-toast-live-test.cjs', HUD_WAIT],
  ['diplo-truce-live-test.cjs', HUD_WAIT],
  ['sidepanel-diplo-dismiss-real-render-test.cjs', HUD_WAIT],
  ['diplo-truce-ai-table-live-test.cjs', '      { timeout: 300000 },\n    );\n'],
  ['diplo-truce-saveload-live-test.cjs', "    { timeout: 100000 },\n  );\n"],
  ['end-turn-gate-live-test.cjs', '  await wait(800);\n  return page;\n'],
  ['end-turn-block-event-live-test.cjs', '    await wait(800);\n    const D = fn'],
];
// Miejsca 'before': wstawiamy PRZED anchorem (gotowy stan gry, przed pierwszym wait/klikiem).
const BEFORE = new Set(['end-turn-gate-live-test.cjs', 'end-turn-block-event-live-test.cjs']);

function countOf(src, needle) {
  return src.split(needle).length - 1;
}

let failed = 0;
for (const [name, anchor] of PLAN) {
  const file = path.join(TOOLS, name);
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('closeCivWelcome')) {
    console.log('SKIP (juz przepiete) ' + name);
    continue;
  }
  // Dla HUD_WAIT anchor to poczatek linii; wstawiamy po calej linii (do konca linii).
  let idx;
  let insertAt;
  if (anchor === HUD_WAIT) {
    const n = countOf(src, anchor);
    if (n !== 1) { console.error('BLAD anchor x' + n + ' ' + name); failed++; continue; }
    idx = src.indexOf(anchor);
    const eol = src.indexOf('\n', idx);
    insertAt = eol + 1;
  } else {
    const n = countOf(src, anchor);
    if (n !== 1) { console.error('BLAD anchor x' + n + ' ' + name); failed++; continue; }
    idx = src.indexOf(anchor);
    if (BEFORE.has(name)) {
      insertAt = idx; // przed linia anchora (gotowa gra, przed wait/klikiem)
    } else {
      insertAt = idx + anchor.length; // po calym anchorze (konczy sie znakiem nowej linii)
      if (!anchor.endsWith('\n')) { console.error('BLAD anchor bez \\n ' + name); failed++; continue; }
    }
  }
  const indent = (() => {
    const lineStart = src.lastIndexOf('\n', idx) + 1;
    const m = /^\s*/.exec(src.slice(lineStart, idx));
    return m ? m[0] : '';
  })();
  const insertion = (anchor === HUD_WAIT ? indent : '    ') + CALL + '\n';
  let out = src.slice(0, insertAt) + insertion + src.slice(insertAt);
  // import: po pierwszej linii 'use strict' lub na poczatku
  if (out.startsWith("'use strict';\n")) {
    out = "'use strict';\n" + IMPORT_LINE + '\n' + out.slice("'use strict';\n".length);
  } else {
    out = IMPORT_LINE + '\n' + out;
  }
  if (!DRY) fs.writeFileSync(file, out);
  console.log((DRY ? 'DRY ' : 'OK  ') + name + ' (wstawiono po linii ' + (src.slice(0, idx).split('\n').length) + ')');
}
if (failed) { console.error('FAILED ' + failed); process.exit(1); }
