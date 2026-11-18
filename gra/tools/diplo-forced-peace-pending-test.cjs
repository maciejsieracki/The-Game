'use strict';
/**
 * diplo-forced-peace-pending-test.cjs -- PENDING-FORCED-PEACE-Q1 (wymuszona dyplomacja, 2026-11-18).
 *
 * Pokoj wymuszony (zmeczenie 100%) z udzialem gracza NIE wchodzi w zycie w ticku. Tick zwraca outcome
 * `forced_peace` z `deferred: true` i karencja `lockTurns`, bez pay/finalize; wykonuje je akceptacja gracza
 * (main.ts: acceptPendingForcedPeace). Bramka „Zakoncz ture” w main.ts (canPlayerInitiateEndTurn) i okno
 * (ui/diplomacyAudience.ts: showForcedPeaceModal) sa sprawdzone zrodlowo (main.ts jest zbyt duzy na bundling).
 *
 *   (a) gracz (id 0) przy 100% -> deferred, brak pay, brak finalize, karencja przekazana, stan pary usuniety;
 *   (b) AI<->AI przy 100% (deferForcedPeace=false) -> natychmiastowy pokoj (pay + finalize), bez deferred;
 *   (c) AI<->AI przy 100% z deferForcedPeace (zwraca false dla pary bez gracza) -> natychmiastowy pokoj;
 *   (d) gracz przy 80% -> brak pokoju wymuszonego (bez zmian, brak deferred);
 *   (e) battlePending przy 100% dla gracza -> odroczenie, brak outcome forced_peace;
 *   (f) tekst okna: zawiera %, liczbe tur, przycisk „Akceptuję warunki pokoju”, bez surowych ID;
 *   (g) zrodlo main.ts: bramka w canPlayerInitiateEndTurn, pole meta.pendingForcedPeaceTreaty w zapisie/odczycie,
 *       reset przy nowej grze (stary zapis = pusta lista);
 *   (h) zrodlo diplomacyAudience.ts: brak zamkniecia klikiem w tlo i blokada Esc, jedyny przycisk = akceptacja;
 *   (i) mutacja: usuniecie deferForcedPeace z war-weariness.ts czerwieni (a).
 *
 *   node tools/diplo-forced-peace-pending-test.cjs   # exit 0 = wszystko zielone
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const WW = path.join(SRC, 'game', 'war-weariness.ts');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.fpend-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.fpend-${TAG}-bundle.cjs`);
const J = (p) => JSON.stringify(p);

function bundle(entrySource, extraTmp) {
  fs.writeFileSync(ENTRY, entrySource);
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE,
      logLevel: 'silent', loader: { '.json': 'json' },
    });
  } finally {
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
    if (extraTmp) try { fs.unlinkSync(extraTmp); } catch (_) { /* ignore */ }
  }
  delete require.cache[BUNDLE];
  const m = require(BUNDLE);
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
  return m;
}

function loadWW(source) {
  const MUT = path.join(path.dirname(WW), `.fpend-mut-${TAG}.ts`);
  fs.writeFileSync(MUT, source);
  return bundle(`export * as W from ${J(MUT)};\n`, MUT).W;
}

function loadView() {
  return bundle(`export * as V from ${J(path.join(SRC, 'game', 'war-weariness-view.ts'))};\n`).V;
}

const CITY = [{ kind: 'miasto', id: 'c1', amount: 1, pn: 400 }];

/** Scenariusz pary a–b w wojnie; o.level sterowane przez turnsAtWar (40 tur = 100%, 32 tury = 80%). */
function mk(W, o) {
  const log = [];
  const deps = {
    store: new Map(), turn: 400, pairs: [{ a: o.a, b: o.b }],
    pairKey: (x, y) => `${Math.min(x, y)}-${Math.max(x, y)}`,
    warInfo: () => ({
      warStart: 400 - o.turnsAtWar, turnsAtWar: o.turnsAtWar,
      lostA: 0, lostB: 0, turnsSinceCityChange: o.turnsAtWar,
    }),
    shareOf: (x) => (x === o.a ? 0.5 : 0.5),
    weakerOf: () => o.weakerId,
    cityCountOf: () => 6,
    isPlayerPair: (x, y) => x === 0 || y === 0,
    price: () => ({ requiredPn: 0, balanceFor: (c) => c, tolerancePn: 20 }),
    assets: () => CITY,
    cityCessionOk: () => true,
    battlePending: !!o.battlePending,
    pay: (l, w, plan) => log.push({ ev: 'pay', l, w, plan }),
    finalize: (l, w, lock) => log.push({ ev: 'peace', l, w, lock }),
    ...(o.defer !== undefined ? { deferForcedPeace: o.defer } : {}),
  };
  return { deps, log };
}

const results = [];
const chk = (name, ok) => results.push({ name, ok: !!ok });

function behaviour(W) {
  // (a) gracz (id 0) przy 100% -> odroczony pokoj
  {
    const { deps, log } = mk(W, { a: 0, b: 2, turnsAtWar: 40, weakerId: 0, defer: (l, w) => l === 0 || w === 0 });
    const r = W.runWarWearinessTick(deps)[0];
    chk('a: gracz 100% -> action forced_peace', r && r.action === 'forced_peace');
    chk('a: gracz 100% -> deferred=true', r && r.deferred === true);
    chk('a: gracz 100% -> brak pay i finalize (odroczone)', log.length === 0);
    chk('a: gracz 100% -> karencja lockTurns przekazana', r && typeof r.lockTurns === 'number');
    chk('a: gracz 100% -> stan pary usuniety (brak ponownego wymuszenia)', deps.store.size === 0);
  }
  // (b) AI<->AI przy 100% bez deferForcedPeace -> natychmiast
  {
    const { deps, log } = mk(W, { a: 1, b: 2, turnsAtWar: 40, weakerId: 1 });
    const r = W.runWarWearinessTick(deps)[0];
    chk('b: AI<->AI 100% -> forced_peace natychmiast', r && r.action === 'forced_peace' && !r.deferred);
    chk('b: AI<->AI 100% -> finalize wykonany', log.some(e => e.ev === 'peace'));
  }
  // (c) AI<->AI z deferForcedPeace zwracajacym false -> natychmiast
  {
    const { deps, log } = mk(W, { a: 1, b: 2, turnsAtWar: 40, weakerId: 1, defer: (l, w) => l === 0 || w === 0 });
    const r = W.runWarWearinessTick(deps)[0];
    chk('c: AI<->AI (bez gracza) nie jest odraczany', r && r.action === 'forced_peace' && !r.deferred && log.some(e => e.ev === 'peace'));
  }
  // (d) gracz przy 80% -> brak pokoju wymuszonego
  {
    const { deps, log } = mk(W, { a: 0, b: 2, turnsAtWar: 32, weakerId: 0, defer: () => true });
    const r = W.runWarWearinessTick(deps)[0];
    chk('d: gracz 80% -> brak forced_peace', r && r.action !== 'forced_peace');
    chk('d: gracz 80% -> brak pay/finalize', log.length === 0);
  }
  // (e) battlePending przy 100% dla gracza -> odroczenie na nastepna ture
  {
    const { deps, log } = mk(W, { a: 0, b: 2, turnsAtWar: 40, weakerId: 0, battlePending: true, defer: () => true });
    const r = W.runWarWearinessTick(deps)[0];
    chk('e: battlePending -> brak forced_peace', r && r.action !== 'forced_peace' && log.length === 0);
  }
}

function textChecks(V) {
  const t = V.forcedPeaceModalTextPl({ otherName: 'Rzym', humanIsLoser: true, cityNames: [], levelPct: 100, turnsAtWar: 40, citiesChanged: 2 });
  chk('f: tekst zawiera procent zmeczenia (100%)', /100%/.test(t.why) || /100%/.test(t.lead));
  chk('f: tekst zawiera liczbe tur wojny (40)', /40 tur/.test(t.why));
  chk('f: tekst zawiera liczbe zmienionych miast (2)', /zmieniło właściciela: 2/.test(t.why));
  chk('f: przycisk = „Akceptuję warunki pokoju”', t.acceptLabel === 'Akceptuję warunki pokoju');
  chk('f: brak surowych ID w tekstach', !/City\d+|c\d+/.test(JSON.stringify(t)));
  const t2 = V.forcedPeaceModalTextPl({ otherName: 'Rzym', humanIsLoser: false, cityNames: ['Ateny'] });
  chk('f: miasta po nazwach (Ateny)', /Otrzymujesz: Ateny/.test(t2.terms));
}

function sourceChecks() {
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const ui = fs.readFileSync(path.join(SRC, 'ui', 'diplomacyAudience.ts'), 'utf8');
  const gateStart = main.indexOf('function canPlayerInitiateEndTurn(): boolean {');
  const gateEnd = main.indexOf('function hintEndTurnBlocked', gateStart);
  const gate = gateStart >= 0 && gateEnd > gateStart ? main.slice(gateStart, gateEnd) : '';
  chk('g: bramka „Zakończ turę” sprawdza oczekujący pokój wymuszony', gate.includes('pendingForcedPeaceTreaties.length > 0'));
  chk('g: zapis meta.pendingForcedPeaceTreaties', /pendingForcedPeaceTreaties:\s*pendingForcedPeaceTreaties\.map/.test(main));
  chk('g: odczyt zapisu z pustą listą dla starych zapisów', /savedPendingPeace[\s\S]{0,200}Array\.isArray\(savedPendingPeace\)/.test(main));
  chk('g: reset przy nowej grze', /pendingForcedPeaceTreaties\.length = 0; \/\/ PENDING-FORCED-PEACE-Q1: nowa gra/.test(main));
  chk('g: akceptacja wykonuje zaplate i finalizacje', /function acceptPendingForcedPeace[\s\S]{0,900}finalizePeaceTreatyBetween\(p\.loser, p\.winner, p\.lockTurns\)/.test(main));
  chk('h: okno bez zamkniecia klikiem w tlo', !/modalOverlay\.addEventListener\('click', \(e\) => \{ if \(e\.target === modalOverlay\) close\(\); \}\);\s*\n\}\s*\n\n\/\*\* @deprecated/.test(ui) && /Klik w tło NIE zamyka/.test(ui));
  chk('h: Esc blokowany w oknie pokoju wymuszonego', /blockEsc/.test(ui) && /e\.key !== 'Escape'/.test(ui));
  chk('h: jedyny przycisk wywołuje onAccept', /opts\.onAccept\(\)/.test(ui) && /cd-forced-peace-ok/.test(ui));
  // R2 (zarzuty Evaluatora 1, 2, 4, 5, 9): wpis w Ważne, auto-otwarcie po wczytaniu i turze, czyszczenie nieaktualnych, walidacja zapisu, zdjęcie strażnika Esc.
  chk('r2-1: wpis „Nie można zakończyć tury” w Ważne dla pokoju wymuszonego', /id: 'end-turn-block-forced-peace'/.test(main) && /END_TURN_BLOCK_EVENT_TITLE,/.test(main));
  chk('r2-2: okno wraca po wczytaniu zapisu z oczekującym traktatem', /setTimeout\(\(\) => showNextPendingForcedPeace\(\), 0\)/.test(main));
  chk('r2-3: okno wraca na początku tury po turn++', /turn\+\+;[\s\S]{0,200}if \(pendingForcedPeaceTreaties\.length > 0\) showNextPendingForcedPeace\(\)/.test(main));
  chk('r2-4: nieaktualne oczekujące pokoje są usuwane (prune) przed bramką i oknem', /function prunePendingForcedPeace[\s\S]{0,400}stillAtWar/.test(main) && (main.match(/prunePendingForcedPeace\(\);/g) || []).length >= 4);
  chk('r2-5: strażnik Esc zdejmowany przy ponownym otwarciu i akceptacji', /clearForcedPeaceEscGuard\(\);\s*\n\s*if \(modalOverlay !== null\)/.test(ui) && /if \(!overlay\.isConnected\) \{ clearForcedPeaceEscGuard\(\)/.test(ui));
  chk('r2-6: walidacja wpisu zapisu (loser/winner/pairKey)', /typeof r\.pairKey !== 'string' \|\| typeof r\.loser !== 'number'/.test(main));
  chk('r2-7: tekst okna zawiera formułę zmęczenia, karencję i 0 PN', /zmęczenie rośnie o 5%|Zmęczenie rośnie o 5%/.test(fs.readFileSync(path.join(SRC, 'game', 'war-weariness-view.ts'), 'utf8')) && /Zapłata: 0 PN/.test(fs.readFileSync(path.join(SRC, 'game', 'war-weariness-view.ts'), 'utf8')));
}

function mutation() {
  const original = fs.readFileSync(WW, 'utf8');
  const mutant = original.replace('if (d.deferForcedPeace?.(loser, winner)) {', 'if (false) {');
  if (mutant === original) { chk('i: mutacja: wzorzec deferForcedPeace nie znaleziony', false); return; }
  const W = loadWW(mutant);
  const { deps, log } = mk(W, { a: 0, b: 2, turnsAtWar: 40, weakerId: 0, defer: () => true });
  const r = W.runWarWearinessTick(deps)[0];
  chk('i: mutant (bez odroczenia) czerwieni (a): pokoj zapada od razu', !(r && r.deferred === true && log.length === 0));
}

const W = loadWW(fs.readFileSync(WW, 'utf8'));
behaviour(W);
textChecks(loadView());
sourceChecks();
mutation();

let fail = 0;
for (const r of results) {
  if (!r.ok) fail++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}`);
}
console.log(`diplo-forced-peace-pending-test: PASS=${results.length - fail} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
