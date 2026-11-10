'use strict';
/**
 * diplo-truce-impl-test.cjs — R-WEB-DIPLO-TRUCE-IMPL-Q1 (runda 4, odpowiedź na zarzuty Evaluatora r3).
 * (B) po wygaśnięciu rozejmu propozycja pokoju do drugiej strony: zgoda = pokój, odmowa/timeout = wojna;
 * (C) rozejm daje 0 Zaufania (pokój stały nadal +5);
 * (E) AI wybiera tryb (rozejm vs pokój stały) wg zmęczenia wojną (ułamek t/T), willingnessPeace, Zaufania i pozycji;
 * (G) kontroferta na rozejm otwiera się z trybem „rozejm” i długością (5/10/15) — tylko wiring (NIE_ZMIERZONO runtime).
 *
 * Część 1: RUNTIME czystej logiki (esbuild bundle diplomacy-peace-lock.ts): cykl życia propozycji pokoju
 *          przez truceEndTickPair z portami-atrapami (ten sam kod, który wywołuje main.ts przez truceEndPorts()).
 *          Pokrywa: wygaśnięcie → oferta gracza, timeout → wojna, AI-adresat zgoda/odmowa, brak inicjatora,
 *          brak deduplikacji (dwie oferty tego samego AI nie wypadają), usuwanie po id, okno oferty = złamanie.
 * Część 2: wiring w main.ts / ai.ts / engine (sprawdzenie źródła). Pełny silnik tury (main.ts, ~46k linii,
 *          DOM/three) NIE jest uruchamiany — runtime w przeglądarce = NIE_ZMIERZONO (brak Chromium).
 * Mutanty: M1 truceEndAiAccepts zawsze true; M2 aiTruceOrPeaceMode ignoruje zmęczenie;
 *          M3 isTruceWindowBreach ignoruje ofertę pokoju po rozejmie.
 * Run: node tools/diplo-truce-impl-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const LOCK = path.resolve(GRA, 'src', 'game', 'diplomacy-peace-lock.ts');
const MAIN = path.resolve(GRA, 'src', 'main.ts');
const AI = path.resolve(GRA, 'src', 'game', 'ai.ts');
const ENGINE = path.resolve(GRA, 'src', 'game', 'diplomacy-pn-engine.ts');
const ENTRY = path.resolve(GRA, 'src', '.dip-truce-impl-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-truce-impl.cjs');
const BUNDLE_M1 = path.resolve(__dirname, '.dip-truce-impl-m1.cjs');
const BUNDLE_M2 = path.resolve(__dirname, '.dip-truce-impl-m2.cjs');
const BUNDLE_M3 = path.resolve(__dirname, '.dip-truce-impl-m3.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  'export {',
  '  truceEndAiAccepts, truceEndOfferTarget, truceEndOfferExpired, aiTruceOrPeaceMode,',
  '  TRUCE_AI_FATIGUE_PEACE_MIN, TRUCE_AI_WILLINGNESS_PEACE_MIN, TRUCE_AI_TRUST_PEACE_MIN, TRUCE_END_AI_ACCEPT_TRUST_MIN,',
  '  normalizeTruceDuration, truceUntilTurn, truceExpiryAction,',
  '  isTruceWindowBreach, peaceFinalizeTrustEvent,',
  '  truceEndTickPair, truceEndToWarCore, clearTruceEndOfferCore,',
  '} from \'./game/diplomacy-peace-lock\';',
  'export { applyDiplomaticEvent } from \'./game/diplomacy\';',
  'export { warWearinessFraction } from \'./game/diplomacy-war-peace-profile\';',
  '',
].join('\n');

function mutantPlugin(target, from, to) {
  const info = { applied: 0 };
  const filter = new RegExp(path.basename(target).replace(/[.]/g, '\\.') + '$');
  return {
    info,
    plugin: {
      name: 'mutant-truce-impl',
      setup(build) {
        build.onLoad({ filter }, async () => {
          const src = fs.readFileSync(target, 'utf8');
          info.applied = src.split(from).length - 1;
          return { contents: src.split(from).join(to), loader: 'ts' };
        });
      },
    },
  };
}

async function buildBundle(outfile, plugins) {
  fs.writeFileSync(ENTRY, ENTRY_SRC);
  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      format: 'cjs',
      platform: 'node',
      outfile,
      logLevel: 'silent',
      plugins: plugins || [],
    });
  } finally {
    fs.unlinkSync(ENTRY);
  }
  return require(outfile);
}

function src(file) {
  return fs.readFileSync(file, 'utf8');
}

/** Atrapy portów: stan pary w pamięci; ta sama semantyka co truceEndPorts() w main.ts. */
function makeWorld() {
  const world = {
    meta: {}, status: {}, zaufanie: {}, humans: new Set([0]), warCalls: [], finalize: [], inbox: [], seq: 0,
  };
  const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  world.key = key;
  world.ports = {
    getMeta: (a, b) => world.meta[key(a, b)] || {},
    setMeta: (a, b, m) => { world.meta[key(a, b)] = m; },
    getStatus: (a, b) => world.status[key(a, b)] || 'wojna',
    getZaufanie: (a, b) => (world.zaufanie[key(a, b)] != null ? world.zaufanie[key(a, b)] : 0),
    isHuman: id => world.humans.has(id),
    declareWarAfterTruce: (a, b) => { world.status[key(a, b)] = 'wojna'; world.warCalls.push(key(a, b)); },
    enqueueOffer: (ownerId, reason) => {
      world.seq++;
      const id = 'inbox-' + world.seq;
      world.inbox.push({ id, ownerId, reason });
      return id;
    },
    removeOffer: id => { world.inbox = world.inbox.filter(x => x.id !== id); },
    finalizePeace: (p, r) => { world.finalize.push([p, r]); world.status[key(p, r)] = 'pokoj'; },
  };
  return world;
}

(async () => {
  const lib = await buildBundle(BUNDLE);

  // ---- Część 1a: (B) adresat i zgoda (helpery) ----
  check('B: inicjator=a → adresat=b', lib.truceEndOfferTarget(3, 3, 7) === 7);
  check('B: inicjator=b → adresat=a', lib.truceEndOfferTarget(7, 3, 7) === 3);
  check('B: brak inicjatora → null (stara wojna)', lib.truceEndOfferTarget(undefined, 3, 7) === null);
  check('B: inicjator spoza pary → null', lib.truceEndOfferTarget(9, 3, 7) === null);
  check('B: AI przyjmuje przy progu Zaufania', lib.truceEndAiAccepts(lib.TRUCE_END_AI_ACCEPT_TRUST_MIN) === true);
  check('B: AI odmawia poniżej progu Zaufania', lib.truceEndAiAccepts(lib.TRUCE_END_AI_ACCEPT_TRUST_MIN - 1) === false);
  check('B: timeout — oferta w T nie wygasa w T', lib.truceEndOfferExpired(10, 10) === false);
  check('B: timeout — oferta wygasa w T+1 (= wojna)', lib.truceEndOfferExpired(10, 11) === true);

  // ---- Część 1b: RUNTIME cyklu życia propozycji pokoju po rozejmie (B) ----
  // B-1: wygaśnięcie rozejmu zainicjowanego przez AI(7) → oferta do gracza(0); bez wojny.
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110, truceInitiatorId: 7 };
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    const m = w.meta[w.key(0, 7)];
    check('B-1: wygaśnięcie → truceEndOffer do gracza (to=0, from=7)',
      m.truceEndOffer != null && m.truceEndOffer.toOwnerId === 0 && m.truceEndOffer.fromOwnerId === 7, m);
    check('B-1: wygaśnięcie → wpis w skrzynce gracza (ownerId=inicjator)',
      w.inbox.length === 1 && w.inbox[0].ownerId === 7, w.inbox);
    check('B-1: wygaśnięcie → brak wojny i brak pokoju w tej turze',
      w.warCalls.length === 0 && w.finalize.length === 0 && w.status[w.key(0, 7)] === 'pokoj');
    check('B-1: wygaśnięcie czyści truceUntilTurn', m.truceUntilTurn === undefined);
    check('B-1: oferta zapisuje inboxId wpisu', m.truceEndOffer.inboxId === w.inbox[0].id);
  }
  // B-2: timeout (kolejna tura bez odpowiedzi) → wojna, oferta i wpis usunięte.
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110, truceInitiatorId: 7 };
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    lib.truceEndTickPair(w.ports, 0, 7, 111);
    check('B-2: timeout → wojna (declareWarAfterTruce raz)', w.warCalls.length === 1 && w.status[w.key(0, 7)] === 'wojna', w.warCalls);
    check('B-2: timeout → oferta wyczyszczona', w.meta[w.key(0, 7)].truceEndOffer === undefined);
    check('B-2: timeout → wpis w skrzynce usunięty', w.inbox.length === 0, w.inbox);
  }
  // B-3: brak deduplikacji — dwie oferty tego samego AI do różnych par nie wypadają; usuwanie po id.
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110, truceInitiatorId: 7 };
    w.status[w.key(0, 9)] = 'pokoj';
    w.meta[w.key(0, 9)] = { truceUntilTurn: 110, truceInitiatorId: 9 };
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    lib.truceEndTickPair(w.ports, 0, 9, 110);
    check('B-3: obie oferty trafiają do skrzynki (brak deduplikacji)', w.inbox.length === 2, w.inbox);
    check('B-3: każda oferta ma własne id', w.inbox[0].id !== w.inbox[1].id);
    lib.truceEndTickPair(w.ports, 0, 7, 111); // timeout tylko pary 0-7
    check('B-3: timeout jednej pary usuwa tylko jej wpis',
      w.inbox.length === 1 && w.inbox[0].ownerId === 9 && w.status[w.key(0, 9)] === 'pokoj', w.inbox);
  }
  // B-4: AI-adresat (inicjator = gracz 0, adresat = AI 7): zgoda przy Zaufaniu ≥ progu, odmowa poniżej.
  {
    const w = makeWorld();
    w.humans.add(0);
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110, truceInitiatorId: 0 };
    w.zaufanie[w.key(0, 7)] = lib.TRUCE_END_AI_ACCEPT_TRUST_MIN;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('B-4: AI-adresat przy progu Zaufania → zgoda = finalizePeace(gracz, AI)',
      w.finalize.length === 1 && w.finalize[0][0] === 0 && w.finalize[0][1] === 7, w.finalize);
    check('B-4: zgoda AI nie daje wojny i nie tworzy oferty', w.warCalls.length === 0 && w.inbox.length === 0);
  }
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110, truceInitiatorId: 0 };
    w.zaufanie[w.key(0, 7)] = lib.TRUCE_END_AI_ACCEPT_TRUST_MIN - 1;
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('B-4: AI-adresat poniżej progu → odmowa = wojna (bez pokoju)',
      w.finalize.length === 0 && w.warCalls.length === 1, { f: w.finalize, w: w.warCalls });
  }
  // B-5: stare zapisy bez inicjatora → wojna (zachowanie sprzed rundy 3).
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110 };
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('B-5: brak inicjatora → wojna', w.warCalls.length === 1 && w.inbox.length === 0);
  }
  // B-6: po wygaśnięciu, gdy pary nie ma już w stanie pokoju (np. wojna wypowiedziana) — nic nie robi.
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'wojna';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110, truceInitiatorId: 7 };
    lib.truceEndTickPair(w.ports, 0, 7, 110);
    check('B-6: wygaśnięcie przy statusie≠pokoj → brak oferty i brak wojny', w.inbox.length === 0 && w.warCalls.length === 0);
  }
  // B-7: okno oferty = złamanie rozejmu (N1): wypowiedzenie w oknie karane.
  check('B-7: aktywny rozejm = okno złamania', lib.isTruceWindowBreach({ truceUntilTurn: 110 }, 109) === true);
  check('B-7: oferta po rozejmie = okno złamania', lib.isTruceWindowBreach({ truceEndOffer: { turn: 110, fromOwnerId: 7, toOwnerId: 0 } }, 111) === true);
  check('B-7: brak rozejmu i oferty = brak złamania', lib.isTruceWindowBreach({}, 111) === false && lib.isTruceWindowBreach(undefined, 111) === false);

  // ---- Część 1c: (C) rozejm = 0 Zaufania; pokój stały = +5 ----
  const base = { zaufanie: 40, respekt: 40, status: 'wojna' };
  const peaceNow = lib.applyDiplomaticEvent(base, 'pokoj');
  check('C: pokój stały (applyDiplomaticEvent pokoj) daje +5 Zaufania', peaceNow.zaufanie === 45, peaceNow);
  check('C: pokój ustawia status pokoj', peaceNow.status === 'pokoj', peaceNow);
  check('C: rozejm (5/10/15) → brak zdarzenia Zaufania', [5, 10, 15].every(t => lib.peaceFinalizeTrustEvent(t) === null));
  check('C: pokój stały (brak/0/nieprawidłowa długość) → zdarzenie pokoj',
    lib.peaceFinalizeTrustEvent(undefined) === 'pokoj' && lib.peaceFinalizeTrustEvent(0) === 'pokoj'
    && lib.peaceFinalizeTrustEvent(7) === 'pokoj' && lib.peaceFinalizeTrustEvent(null) === 'pokoj');

  // ---- Część 1d: (E) tryb AI — nowe wejście (ułamek t/T + willingnessPeace + Zaufanie + słabość) ----
  check('E: ułamek zmęczenia t=T → 1 (pełna skala)', lib.warWearinessFraction(15, 15) === 1);
  check('E: ułamek zmęczenia t=T/2 → 0.5 (poniżej progu pełnego zmęczenia)',
    lib.warWearinessFraction(7.5, 15) === 0.5 && 0.5 < lib.TRUCE_AI_FATIGUE_PEACE_MIN);
  check('E: 19 tur wojny przy T=20 → ułamek < progu (rozejm wg N4)',
    lib.warWearinessFraction(19, 20) < lib.TRUCE_AI_FATIGUE_PEACE_MIN);
  check('E: duże zmęczenie (ułamek ≥ progu) → pokój stały',
    lib.aiTruceOrPeaceMode({ fatigueFraction: lib.TRUCE_AI_FATIGUE_PEACE_MIN, willingnessPeace: 0, zaufanie: 0, weaker: true, fallbackKind: 'rozejm' }) === 'pokoj');
  check('E: wysoka willingnessPeace → pokój stały (przy małym zmęczeniu)',
    lib.aiTruceOrPeaceMode({ fatigueFraction: 0.1, willingnessPeace: lib.TRUCE_AI_WILLINGNESS_PEACE_MIN, zaufanie: 0, weaker: true, fallbackKind: 'rozejm' }) === 'pokoj');
  check('E: wysokie Zaufanie → pokój stały',
    lib.aiTruceOrPeaceMode({ fatigueFraction: 0.1, willingnessPeace: 0.2, zaufanie: lib.TRUCE_AI_TRUST_PEACE_MIN, weaker: true, fallbackKind: 'rozejm' }) === 'pokoj');
  check('E: słabsza + małe zmęczenie + niska gotowość + niskie zaufanie → rozejm',
    lib.aiTruceOrPeaceMode({ fatigueFraction: 0.2, willingnessPeace: 0.5, zaufanie: 20, weaker: true, fallbackKind: 'pokoj' }) === 'rozejm');
  check('E: brak sygnału i nie słabsza → fallback (po turach wojny)',
    lib.aiTruceOrPeaceMode({ fatigueFraction: 0.1, willingnessPeace: 0.2, zaufanie: 20, weaker: false, fallbackKind: 'pokoj' }) === 'pokoj'
    && lib.aiTruceOrPeaceMode({ fatigueFraction: 0.1, willingnessPeace: 0.2, zaufanie: 20, weaker: false, fallbackKind: 'rozejm' }) === 'rozejm');

  // ---- Część 2: wiring (źródło) ----
  const mainSrc = src(MAIN);
  const aiSrc = src(AI);
  const lockSrc = src(LOCK);
  const engineSrc = src(ENGINE);

  const finStart = mainSrc.indexOf('function finalizePeaceTreatyBetween(');
  const finBody = finStart >= 0 ? mainSrc.slice(finStart, finStart + 5000) : '';
  check('C: finalize — rozejm (peaceFinalizeTrustEvent) ustawia tylko status, bez applyDiploEventTracked',
    /const isTruce = peaceFinalizeTrustEvent\(truceTurns\) === null;[\s\S]{0,900}?if \(isTruce\) \{[\s\S]{0,400}?setDiploRelation\(proposerId, responderId, \{ \.\.\.cur, status: 'pokoj' \}\);/.test(finBody));
  check('C: finalize — applyDiploEventTracked(…,\'pokoj\') tylko w gałęzi pokoju stałego',
    /\} else \{\s*setDiploRelation\(\s*proposerId,\s*responderId,\s*applyDiploEventTracked\(proposerId, responderId, cur, 'pokoj'\)/.test(finBody));
  check('B: finalize zeruje truceEndOffer (zgoda gracza/AI kończy ofertę)',
    /truceEndOffer: undefined/.test(finBody));

  const tickStart = mainSrc.indexOf('function tickTruceExpiries(): void {');
  const tickBody = tickStart >= 0 ? mainSrc.slice(tickStart, tickStart + 400) : '';
  check('B: tickTruceExpiries deleguje do truceEndTickPair (ten sam kod co testy)',
    /truceEndTickPair\(ports, ids\[i\]!, ids\[j\]!, turn\)/.test(tickBody));
  const enqStart = mainSrc.indexOf('function enqueueTruceEndOffer(');
  const enqBody = enqStart >= 0 ? mainSrc.slice(enqStart, enqStart + 700) : '';
  check('B: enqueueTruceEndOffer dodaje wpis BEZ deduplikacji',
    enqBody.length > 0 && /pendingDiplomacyInbox\.push\(/.test(enqBody) && !/pendingDiplomacyInbox\.some\(/.test(enqBody));
  check('B: removeOffer usuwa wpis po id (nie po ownerId)',
    /removeOffer: inboxId => \{\s*const k = pendingDiplomacyInbox\.findIndex\(p => p\.id === inboxId\);/.test(mainSrc));
  check('B: odmowa gracza w resolvePendingDiplomacy → truceEndToWar',
    /zaproponuj_pokoj' && getDiploPairMeta\(ME\(\), p\.ownerId\)\.truceEndOffer != null\)\s*\{\s*truceEndToWar\(ME\(\), p\.ownerId\)/.test(mainSrc));
  check('B: wojna wypowiedziana kasuje ofertę (chargeWarDeclarationCredibility)',
    /clearTruceEndOffer\(declarerId, targetId\);/.test(mainSrc));
  check('B/N1: chargeWarDeclarationCredibility liczy okno rozejmu przez isTruceWindowBreach (w tym ofertę)',
    /const truceBreach = isTruceWindowBreach\(getDiploPairMeta\(declarerId, targetId\), turn\);/.test(mainSrc));
  check('B: DiploPairMeta ma pola truceInitiatorId / truceEndOffer.inboxId',
    /truceInitiatorId\?: number/.test(engineSrc) && /truceEndOffer\?:[^\n]*inboxId\?: string/.test(engineSrc));

  // (E) AI wybiera tryb w decideAIDiplomacy — wejście: ułamek t/T, willingnessPeace ze stance, Zaufanie, słabość rw
  const eStart = aiSrc.indexOf('const peaceKindAi = aiTruceOrPeaceMode({');
  const eBody = eStart >= 0 ? aiSrc.slice(eStart, eStart + 500) : '';
  check('E: ai.ts — fatigueFraction = warWearinessFraction(turnsAtWarRel, zmeczenieT)',
    /fatigueFraction: warWearinessFraction\(turnsAtWarRel, warProfile\.zmeczenieT\)/.test(eBody));
  check('E: ai.ts — willingnessPeace z stance (aiDiplomacyStance)',
    /willingnessPeace: stance\.willingnessPeace/.test(eBody));
  check('E: ai.ts — weaker tylko z progu słabości rw (sygnały peaceSignals nie czynią słabszym)',
    /weaker: weakerByPower,/.test(eBody) && /const weakerByPower = rw <= progPokojSlabosc;/.test(aiSrc));
  check('E: ai.ts — rodzaj wybrany przez aiTruceOrPeaceMode trafia do komendy (rodzaj: peaceKindAi)',
    /rodzaj:\s+peaceKindAi,/.test(aiSrc));
  check('E: AI↔AI — rodzaj z cmd.rodzaj (decideAIDiplomacy), nie osobny wybór',
    /cmd\.type === 'zaproponuj_pokoj' && cmd\.rodzaj === 'rozejm' \? 'rozejm' : 'pokoj'/.test(mainSrc));

  // (G) kontroferta na rozejm — tylko wiring (runtime NIE_ZMIERZONO)
  check('G: counterInitial dla akcji 10 niesie peaceKind/truceTurns (wiring)',
    /uiActionId === '10' && entry\.actionId === 'rozejm'[\s\S]{0,120}truceTurns: p\.turns/.test(mainSrc));

  // stałe z lock
  check('stała: TRUCE_AI_FATIGUE_PEACE_MIN = 1 (pełne zmęczenie, ZAŁOŻENIE)', /TRUCE_AI_FATIGUE_PEACE_MIN = 1;/.test(lockSrc));
  check('stała: TRUCE_AI_WILLINGNESS_PEACE_MIN = 0.7 (ZAŁOŻENIE)', /TRUCE_AI_WILLINGNESS_PEACE_MIN = 0\.7;/.test(lockSrc));

  // ---- Mutanty (wykrywalność testów części 1) ----
  const m1 = mutantPlugin(LOCK, 'return Number.isFinite(zaufanie) && zaufanie >= TRUCE_END_AI_ACCEPT_TRUST_MIN;', 'return true;');
  const libM1 = await buildBundle(BUNDLE_M1, [m1.plugin]);
  check('M1 (zgoda AI zawsze) zastosowany', m1.info.applied === 1, m1.info);
  {
    const w = makeWorld();
    w.status[w.key(0, 7)] = 'pokoj';
    w.meta[w.key(0, 7)] = { truceUntilTurn: 110, truceInitiatorId: 0 };
    w.zaufanie[w.key(0, 7)] = 0;
    libM1.truceEndTickPair(w.ports, 0, 7, 110);
    check('M1 wykryty: przy Zaufaniu 0 czysta wersja → wojna, mutant → pokój', w.finalize.length === 1, w.finalize);
  }

  const m2 = mutantPlugin(LOCK, 'if (input.fatigueFraction >= TRUCE_AI_FATIGUE_PEACE_MIN) return \'pokoj\';', '');
  const libM2 = await buildBundle(BUNDLE_M2, [m2.plugin]);
  check('M2 (ignoruje zmęczenie) zastosowany', m2.info.applied === 1, m2.info);
  check('M2 wykryty: duże zmęczenie daje pokój w czystej wersji, rozejm w mutancie',
    lib.aiTruceOrPeaceMode({ fatigueFraction: 1, willingnessPeace: 0, zaufanie: 0, weaker: true, fallbackKind: 'rozejm' }) === 'pokoj'
    && libM2.aiTruceOrPeaceMode({ fatigueFraction: 1, willingnessPeace: 0, zaufanie: 0, weaker: true, fallbackKind: 'rozejm' }) === 'rozejm');

  const m3 = mutantPlugin(LOCK, '|| meta.truceEndOffer != null;', ';');
  const libM3 = await buildBundle(BUNDLE_M3, [m3.plugin]);
  check('M3 (okno oferty nie liczy się jako złamanie) zastosowany', m3.info.applied === 1, m3.info);
  check('M3 wykryty: oferta po rozejmie = złamanie w czystej wersji, brak złamania w mutancie',
    lib.isTruceWindowBreach({ truceEndOffer: { turn: 110, fromOwnerId: 7, toOwnerId: 0 } }, 111) === true
    && libM3.isTruceWindowBreach({ truceEndOffer: { turn: 110, fromOwnerId: 7, toOwnerId: 0 } }, 111) === false);

  for (const f of [BUNDLE, BUNDLE_M1, BUNDLE_M2, BUNDLE_M3]) {
    try { fs.unlinkSync(f); } catch (_) { /* ignore */ }
  }

  console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('BLAD:', e);
  process.exit(2);
});
