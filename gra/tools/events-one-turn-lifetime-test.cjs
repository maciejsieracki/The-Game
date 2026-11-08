'use strict';
/**
 * events-one-turn-lifetime-test.cjs — R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1.
 *
 * Regula: wydarzenie informacyjne zyje jedna ture; nieprzeczytane/nieusuniete znika przy
 * przejsciu tury i nie wraca; w nowej turze sa tylko wydarzenia tej tury. Decyzyjne (blocking)
 * zostaja.
 *
 * Czesc A: silnik (game/event-lifetime.ts, zbundlowany esbuildem) + symulacja sekwencji EOT.
 * Czesc B: kontrakt zrodlowy main.ts — kazdy producent wpisu do dziennika stempluje turnCreated,
 *          a sweep wygasania stoi tuz po `turn++` (przed dopisaniem wpisow nowej tury).
 * Usage (z gra/): node tools/events-one-turn-lifetime-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const OUT = process.env.EVLT_TMP || path.join(require('os').tmpdir(), 'evlt-' + process.pid);
fs.mkdirSync(OUT, { recursive: true });
const ENTRY = path.join(OUT, 'entry.ts');
const BUNDLE = path.join(OUT, 'bundle.cjs');
fs.writeFileSync(ENTRY,
  `export * from ${JSON.stringify(path.join(GRA, 'src/game/event-lifetime.ts'))};\n` +
  `export { deferredHintsToSidePanelEvents } from ${JSON.stringify(path.join(GRA, 'src/game/eot-event-defer.ts'))};\n`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, logLevel: 'silent' });
const B = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

console.log('events-one-turn-lifetime-test');

// Symulacja dziennika + sekwencji EOT zgodnej z main.ts: turn++ -> sweep -> dopisanie wpisow nowej tury.
function mkSim() {
  const sim = { turn: 5, log: [], dismissed: new Set() };
  sim.add = (id, extra) => sim.log.unshift(B.stampEventTurn({ id, title: id, ...(extra || {}) }, sim.turn));
  sim.visible = () => sim.log.filter(e => !sim.dismissed.has(e.id)).map(e => e.id);
  sim.endTurn = (addNew) => {
    sim.turn++;
    B.expireEventsBeforeTurn(sim.log, sim.turn);
    sim.dismissed.clear();
    if (addNew) addNew(sim);
  };
  return sim;
}

// A1: nieprzeczytane z tury N nie ma w N+1; nowe z N+1 sa.
{
  const s = mkSim();
  s.add('war-5-0-1'); s.add('tech-done-5-rolnictwo');
  ok(s.visible().length === 2, 'tura N: dwa wydarzenia widoczne');
  s.endTurn((x) => x.add('era-6-2'));
  ok(JSON.stringify(s.visible()) === JSON.stringify(['era-6-2']), 'tura N+1: tylko nowe wydarzenie (stare znikly)');
  s.endTurn();
  ok(s.visible().length === 0, 'tura N+2: puste, wydarzenie z N+1 tez wygaslo');
}

// A2: usuniete przez gracza (dismiss) tez nie wraca; przeczytane (widziane) bez usuniecia tez znika.
{
  const s = mkSim();
  s.add('a'); s.add('b');
  s.dismissed.add('a');
  s.endTurn();
  ok(s.visible().length === 0, 'dismissed i nieusuniete znikaja po zmianie tury');
}

// A3: wydarzenia odroczone z tur AI (stampowane numerem NOWEJ tury po turn++) trafiaja do nowej tury.
{
  const s = mkSim();
  s.add('old-player-turn-event');
  s.endTurn((x) => {
    // odroczone hinty z fazy AI: deferredHintsToSidePanelEvents(…, turn) + stamp, jak w main.ts
    const hs = B.deferredHintsToSidePanelEvents([{ msg: 'Egipt handluje z Rzym', durationMs: 3000 }], x.turn);
    for (const h of hs) x.log.unshift(B.stampEventTurn(h, x.turn));
  });
  ok(s.visible().length === 1 && s.visible()[0].startsWith('eot-hint-6'), 'odroczony hint z fazy AI widoczny w nowej turze, stary zniknal');
}

// A4: decyzyjne (blocking) nie wygasaja przez sweep.
{
  const log = [{ id: 'diplo-pend-1', blocking: true, turnCreated: 1 }, { id: 'info', turnCreated: 1 }, { id: 'noStamp' }];
  const removed = B.expireEventsBeforeTurn(log, 9);
  ok(log.length === 1 && log[0].id === 'diplo-pend-1', 'blocking zostaje, info i wpis bez znacznika wygasaja');
  ok(removed.map(e => e.id).sort().join() === 'info,noStamp', 'sweep zwraca usuniete (do zwolnienia szczegolow)');
}

// A5: stary zapis / wpis bez turnCreated: wygasa bez bledu; stamp nie nadpisuje istniejacego.
{
  ok(B.isEventLiveInTurn({ id: 'x' }, 3) === false, 'wpis bez turnCreated jest przeterminowany');
  ok(B.stampEventTurn({ id: 'x', turnCreated: 2 }, 9).turnCreated === 2, 'stamp nie nadpisuje turnCreated');
  ok(B.isEventLiveInTurn({ id: 'x', turnCreated: 7 }, 7) === true, 'wpis z biezacej tury zyje');
  ok(B.isEventLiveInTurn({ id: 'x', turnCreated: 6 }, 7) === false, 'wpis z poprzedniej tury nie zyje');
  const empty = []; B.expireEventsBeforeTurn(empty, 4); ok(empty.length === 0, 'pusty dziennik bez bledu');
}

// A6: hot-seat — dziennik fotela wygasa po jego turze (kazdy fotel osobno): symulacja dwoch dziennikow.
{
  const seatA = mkSim(); const seatB = mkSim();
  seatA.add('a-ev'); seatB.add('b-ev');
  seatA.endTurn((x) => x.add('a-new'));
  ok(JSON.stringify(seatA.visible()) === JSON.stringify(['a-new']), 'fotel A: tylko nowe');
  ok(JSON.stringify(seatB.visible()) === JSON.stringify(['b-ev']), 'fotel B nietkniety do konca swojej tury');
  seatB.endTurn();
  ok(seatB.visible().length === 0, 'fotel B: wygasa po swojej turze');
}

// ---- Czesc B: kontrakt zrodlowy main.ts -------------------------------------------------
const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
const lines = main.split('\n');

// B1: kazdy unshift do dziennika wydarzen niesie turnCreated (literal) albo stampEventTurn.
{
  const re = /(warEventLog|villageEventLog|tradeRouteEventLog|rationAutoEventLog|borderMarchEventLog)\.unshift\(/;
  let sites = 0; const bad = [];
  lines.forEach((ln, i) => {
    if (!re.test(ln)) return;
    sites++;
    const win = lines.slice(i, i + 14).join('\n');
    if (!/turnCreated:\s*turn|stampEventTurn\(/.test(win)) bad.push(i + 1);
  });
  ok(sites >= 13, 'znaleziono >=13 producentow wpisow dziennika (jest ' + sites + ')');
  ok(bad.length === 0, 'kazdy producent stempluje turnCreated' + (bad.length ? ' (braki: ' + bad.join(',') + ')' : ''));
}

// B2: sweep wygasania woluje sie w sekwencji turn++ przed dismissed.clear() i obejmuje wszystkie dzienniki.
{
  const iTurn = lines.findIndex(l => /^\s{8}turn\+\+;\s*$/.test(l));
  const iSweep = lines.findIndex((l, i) => i > iTurn && /expireInformationalEventsBeforeTurn\(turn\)/.test(l));
  const iDismiss = lines.findIndex((l, i) => i > iTurn && /dismissedSidePanelEventIds\.clear\(\)/.test(l));
  ok(iTurn > 0 && iSweep > iTurn && iSweep - iTurn < 80, 'sweep tuz po turn++ (linie ' + (iTurn + 1) + ' -> ' + (iSweep + 1) + ')');
  ok(iDismiss > iSweep, 'sweep przed dismissedSidePanelEventIds.clear()');
  const fn = main.slice(main.indexOf('function expireInformationalEventsBeforeTurn'));
  const body = fn.slice(0, fn.indexOf('function pruneVeteranEnemyEducationJournal'));
  for (const log of ['warEventLog', 'villageEventLog', 'tradeRouteEventLog', 'rationAutoEventLog', 'borderMarchEventLog']) {
    ok(body.includes(log), 'sweep obejmuje ' + log);
  }
  ok(body.includes('warEventDetailOwners'), 'sweep zwalnia szczegoly modali usunietych kart');
}

try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (_) { /* best effort */ }
console.log(`\n${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
