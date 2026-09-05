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

// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// Przerwanie (SIGTERM z `timeout`, SIGINT z Ctrl-C, SIGHUP) nie odpala haka `exit`.
// Przekierowujemy je na process.exit(), zeby sprzatanie wyzej wykonalo sie tak samo.
// SIGKILL jest nieprzechwytywalny i zostawi katalog — to jedyna luka i jest swiadoma.
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { process.exit(130); });
}
const outfile = path.join(os.tmpdir(), `era-change-notify-bundle-${TMPDIR_RUN_ID}.cjs`);
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
