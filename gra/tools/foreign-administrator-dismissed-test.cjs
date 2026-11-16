'use strict';
/**
 * foreign-administrator-dismissed-test.cjs — R-WEB-UI-EVENTS-NO-FOREIGN-ADMINISTRATOR-DISMISSED-Q1.
 * Wpis „Administrator odszedł” w wydarzeniach gracza liczy się wg POPRZEDNIEGO właściciela miasta:
 *  (a) gracz zdobywa miasto obcej cywilizacji z zarządcą  => 0 wpisów dla gracza (brak wpisu o zarządcy obcej),
 *  (b) gracz traci własne miasto z zarządcą               => wpis dla gracza (może zostać),
 *  (c) AI zdobywa miasto AI z zarządcą                    => 0 wpisów dla gracza,
 *  (d) zmiana bez zarządcy / bez zmiany właściciela       => bez zmian,
 *  (e) zmiany stanu (brak środków, wznowienie, koniec bez budynku) nadal liczą się wg właściciela miasta.
 * Mechanika (zwalnianie, koszt, stan) nie jest sprawdzana tu inaczej niż w city-administrator-test.cjs.
 * Gracz = ownerId 0 (jak w grze, `isHuman`). Run z gra/:  node tools/foreign-administrator-dismissed-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'foreign-adm-'));
const entry = path.join(temp, 'entry.ts'), bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(SRC + '/game/city-administrator')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error' });
const M = require(bundle);

const HUMAN = 0, AI_A = 1, AI_B = 2;
const isHuman = (id) => id === HUMAN;
// Ta sama eksportowana bramka, której używa noteAdministratorChange w main.ts (nie kopia w teście).
const notifiesPlayer = (ch) => M.administratorChangeNotifiesPlayer(ch, isHuman);
const bld = 'pretorium';
const run = (cities, built, treasury) => M.refreshAdministratorState(cities, new Map(built), treasury ?? (() => 100));

console.log('(a) gracz zdobywa miasto obcej cywilizacji z zarządcą');
{
  const city = { id: 'x', ownerId: HUMAN, administrator: { ownerId: AI_A, hiredTurn: 1, pracuje: true } };
  const ch = run([city], [['x', [bld]]]);
  ok(!city.administrator && ch.length === 1 && ch[0].kind === 'ended_owner_changed', 'zmiana właściciela => koniec służby (mechanika bez zmian)');
  ok(ch[0].prevOwnerId === AI_A, 'zmiana niesie poprzedniego właściciela (AI_A)');
  ok(!notifiesPlayer(ch[0]), 'brak wpisu dla gracza o zwolnieniu zarządcy obcej cywilizacji');
}

console.log('(b) gracz traci własne miasto z zarządcą');
{
  const city = { id: 'y', ownerId: AI_A, administrator: { ownerId: HUMAN, hiredTurn: 1, pracuje: true } };
  const ch = run([city], [['y', [bld]]]);
  ok(ch.length === 1 && ch[0].kind === 'ended_owner_changed' && ch[0].prevOwnerId === HUMAN, 'utrata miasta: zmiana z prevOwnerId = gracz');
  ok(notifiesPlayer(ch[0]), 'wpis dla gracza o własnym zarządcy po utracie miasta');
}

console.log('(c) AI zdobywa miasto AI z zarządcą');
{
  const city = { id: 'z', ownerId: AI_B, administrator: { ownerId: AI_A, hiredTurn: 1, pracuje: true } };
  const ch = run([city], [['z', [bld]]]);
  ok(ch.length === 1 && !notifiesPlayer(ch[0]), 'AI↔AI: 0 wpisów dla gracza');
}

console.log('(d) bez zarządcy / bez zmiany właściciela');
{
  const plain = { id: 'p', ownerId: AI_A };
  ok(run([plain], [['p', [bld]]]).length === 0, 'miasto bez zarządcy przechodzi bez zmian');
  const kept = { id: 'k', ownerId: HUMAN, administrator: { ownerId: HUMAN, hiredTurn: 1, pracuje: true } };
  const ch = run([kept], [['k', [bld]]]);
  ok(ch.length === 0 && kept.administrator, 'zarządca gracza przy własnym mieście: brak zmiany');
}

console.log('(e) pozostałe zmiany wg właściciela miasta (bez zmian zachowania)');
{
  const lost = { id: 'l', ownerId: HUMAN, administrator: { ownerId: HUMAN, hiredTurn: 1, pracuje: true } };
  const ch = run([lost], [['l', []]]);
  ok(ch.length === 1 && ch[0].kind === 'ended_no_building' && ch[0].prevOwnerId === undefined, 'utrata budynku: kind ended_no_building, bez prevOwnerId');
  ok(notifiesPlayer(ch[0]), 'utrata budynku gracza nadal trafia do wydarzeń gracza');
  const foreign = { id: 'f', ownerId: AI_A, administrator: { ownerId: AI_A, hiredTurn: 1, pracuje: true } };
  const ch2 = run([foreign], [['f', []]]);
  ok(ch2.length === 1 && !notifiesPlayer(ch2[0]), 'utrata budynku AI nie trafia do wydarzeń gracza');
  const ai2 = { id: 'g', ownerId: HUMAN, administrator: { ownerId: HUMAN, hiredTurn: 1, pracuje: true } };
  const ch3 = run([ai2], [['g', [bld]]], () => 0);
  ok(ch3.length === 1 && ch3[0].kind === 'stopped_no_funds' && notifiesPlayer(ch3[0]), 'brak środków gracza: stopped_no_funds trafia do gracza');
}

console.log(`\nPASS ${passed} / FAIL ${failed}`);
fs.rmSync(temp, { recursive: true, force: true });
if (failed > 0) process.exit(1);
