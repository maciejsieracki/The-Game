'use strict';
/**
 * diplo-peace-offer-dedup-one-active-test.cjs -- R-WEB-DIPLO-AI-PEACE-OFFER-DEDUP-ONE-ACTIVE-Q1 (DIPLO-5).
 * Zgloszenie wlasciciela 2026-11-17: na stole dwie „Propozycje pokoju / zawieszenia broni” naraz
 * (oferta gracza i oferta AI) oraz oferty AI nawarstwiaja sie co cooldown.
 *
 * Testy BEHAWIORALNE na realnej funkcji planAiOfferOnTable + createNegotiation (diplomacy-proposals.ts),
 * bez regex na zrodle. Symulacja stolu: AI skladaja oferte co 3 tury (cooldownOfertTur), naprzemiennie
 * pokoj/rozejm, wygasaja po 5 turach; gracz sklada rozejm w tur 7.
 *   (T1) na stole dla pary gracz<->AI co najwyzej 1 aktywna propozycja pokoju/rozejmu w kazdej turze;
 *   (T2) oferta gracza zajmuje stol — AI nie dokłada drugiej (accept=false);
 *   (T3) nowa oferta AI zastepuje poprzednia oferte AI tej pary (replacedIds = jej id);
 *   (T4) inne typy akcji (np. handel) — dedup tego samego typu bez zmian;
 *   (T5) MUTACJA: stary dedup (tylko ten sam actionId) dopuszcza 2 oferty (pokoj + rozejm) -> T1 czerwieni;
 *   (T6) para AI<->AI nie jest blokowana przez oferte gracza z innej pary.
 *
 *   node tools/diplo-peace-offer-dedup-one-active-test.cjs   # exit 0 = wszystko zielone
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const TARGET = path.resolve(GRA_ROOT, 'src', 'game', 'diplomacy-proposals.ts');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.dedup-one-active-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.dedup-one-active-${TAG}-bundle.cjs`);

function load() {
  fs.writeFileSync(ENTRY, `export * as D from ${JSON.stringify(TARGET)};\n`);
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE,
      logLevel: 'silent', loader: { '.json': 'json' },
    });
  } finally {
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
  }
  delete require.cache[BUNDLE];
  const mod = require(BUNDLE).D;
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
  return mod;
}

const HUMAN = 0;
const AI = 2;
const AI2 = 3;
const EXPIRY = 5;
const COOLDOWN = 3;
const WAR_PEACE = new Set(['pokoj', 'rozejm']);

let failures = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ` -- ${detail}` : ''}`);
  if (!ok) failures += 1;
}

/** Stol zgodny z main.ts: wygasanie, planowanie (planAiOfferOnTable), zastapienie, wstawienie. */
function makeTable(D, { mutantOldDedup = false } = {}) {
  let table = [];
  let seq = 0;
  const pairEntries = (t, a, b) => t.filter(n => WAR_PEACE.has(n.actionId)
    && ((n.proposerOwnerId === a && n.responderOwnerId === b) || (n.proposerOwnerId === b && n.responderOwnerId === a)));
  return {
    get table() { return table; },
    expire(turn) { table = table.filter(n => n.expiresTurn > turn); },
    purgePair(a, b) { table = table.filter(n => !(WAR_PEACE.has(n.actionId) && pairEntries([n], a, b).length)); },
    offer(turn, proposer, responder, actionId) {
      if (mutantOldDedup) {
        // Stare zachowanie: blokada tylko tego samego typu, bez zastepowania.
        const dup = table.some(n => n.actionId === actionId
          && ((n.proposerOwnerId === proposer && n.responderOwnerId === responder)
            || (n.proposerOwnerId === responder && n.responderOwnerId === proposer)));
        if (dup) return { accepted: false };
        seq += 1;
        table.push(D.createNegotiation({ actionId, proposerOwnerId: proposer, responderOwnerId: responder, payload: {} }, turn, 'ai', seq));
        return { accepted: true };
      }
      const plan = D.planAiOfferOnTable(table, proposer, responder, actionId);
      if (!plan.accept) return { accepted: false, plan };
      if (plan.replacedIds.length > 0) table = table.filter(n => !plan.replacedIds.includes(n.id));
      seq += 1;
      table.push(D.createNegotiation({ actionId, proposerOwnerId: proposer, responderOwnerId: responder, payload: {} }, turn, 'ai', seq));
      return { accepted: true, plan };
    },
    pairCount(a, b) { return pairEntries(table, a, b).length; },
  };
}

/** Symulacja: AI co COOLDOWN tur, naprzemiennie pokoj/rozejm; gracz rozejm w turze 7 (jesli wolne). */
function simulate(D, opts) {
  const sim = makeTable(D, opts);
  let maxPair = 0;
  let aiTurn = 1;
  let kind = 0;
  for (let turn = 1; turn <= 24; turn += 1) {
    sim.expire(turn);
    if (turn === 7) sim.offer(turn, HUMAN, AI, 'rozejm');
    if (turn >= aiTurn) {
      sim.offer(turn, AI, HUMAN, kind % 2 === 0 ? 'pokoj' : 'rozejm');
      kind += 1;
      aiTurn = turn + COOLDOWN;
    }
    maxPair = Math.max(maxPair, sim.pairCount(HUMAN, AI));
  }
  return { maxPair, sim };
}

function main() {
  const D = load();
  check('modul diplomacy-proposals zaladowany (planAiOfferOnTable)', typeof D.planAiOfferOnTable === 'function');

  // (T1) symulacja z nowa logika: co najwyzej 1 aktywna propozycja pokoju/rozejmu na pare.
  const run = simulate(D, {});
  check('T1: na stole <=1 aktywna propozycja pokoju/rozejmu na pare (8 cykli cooldown)', run.maxPair <= 1,
    `maxPair=${run.maxPair}`);

  // (T2) oferta gracza zajmuje stol.
  {
    const sim = makeTable(D);
    sim.offer(1, HUMAN, AI, 'rozejm');
    const r = sim.offer(2, AI, HUMAN, 'pokoj');
    check('T2: oferta gracza blokuje oferte AI tej pary', r.accepted === false && sim.pairCount(HUMAN, AI) === 1);
  }

  // (T3) nowa oferta AI zastepuje poprzednia AI tej pary.
  {
    const sim = makeTable(D);
    sim.offer(1, AI, HUMAN, 'pokoj');
    const firstId = sim.table[0].id;
    const r = sim.offer(4, AI, HUMAN, 'rozejm');
    const ok = r.accepted && r.plan && r.plan.replacedIds.includes(firstId)
      && sim.pairCount(HUMAN, AI) === 1 && sim.table[0].actionId === 'rozejm';
    check('T3: nowa oferta AI zastepuje poprzednia (wymiana, nie nawarstwianie)', ok,
      `accepted=${r.accepted} count=${sim.pairCount(HUMAN, AI)}`);
  }

  // (T4) inny typ akcji: dedup tego samego typu zachowany, bez zastepowania.
  {
    const sim = makeTable(D);
    sim.offer(1, AI, HUMAN, 'handel');
    const dup = sim.offer(2, AI, HUMAN, 'handel');
    const other = sim.offer(2, AI, HUMAN, 'nap');
    check('T4: handel — dedup tego samego typu zachowany; inny typ przechodzi', dup.accepted === false && other.accepted === true);
  }

  // (T5) mutacja: stare zachowanie dopuszcza dwie oferty (pokoj + rozejm) -> T1 musi czerwiec.
  const mutant = simulate(D, { mutantOldDedup: true });
  check('T5: mutant (stary dedup) lamie regule — wykryty', mutant.maxPair > 1, `mutant maxPair=${mutant.maxPair}`);

  // (T6) oferta gracza z innej pary nie blokuje AI2<->AI.
  {
    const sim = makeTable(D);
    sim.offer(1, HUMAN, AI, 'rozejm');
    const r = sim.offer(1, AI2, HUMAN, 'pokoj');
    check('T6: para AI2<->gracz niezalezna od pary AI<->gracz', r.accepted === true);
  }

  // (T7) DIPLO-5 r2: kontroferta gracza na ofertę AI zajmuje stół — AI nie nadpisuje jej nową ofertą.
  {
    const sim = makeTable(D);
    sim.offer(1, AI, HUMAN, 'pokoj');
    const aiEntry = sim.table[0];
    sim.table[0] = D.applyCounterOffer(aiEntry, {}, HUMAN, 2);
    const r = sim.offer(3, AI, HUMAN, 'rozejm');
    check('T7: kontroferta gracza (authorOwner=gracz) blokuje nowa oferte AI tej pary',
      r.accepted === false && sim.pairCount(HUMAN, AI) === 1 && sim.table[0].authorOwnerId === HUMAN,
      `accepted=${r.accepted} count=${sim.pairCount(HUMAN, AI)}`);
  }

  // (T8) DIPLO-5 r2 (kryterium 3): oferta miasta wygasa, gdy miasto nie należy do strony oferującej / nie istnieje.
  {
    const entry = D.createNegotiation({
      actionId: 'pokoj', proposerOwnerId: AI, responderOwnerId: HUMAN,
      payload: { giveItems: [{ typ: 'miasto', id: 'City27', ilosc: 1 }] },
    }, 1, 'ai', 1);
    const world = cityOwnerOf => ({
      turn: 2, isAtWar: false, isAtPeace: false, proposerEliminated: false, responderEliminated: false, cityOwnerOf,
    });
    const own = D.negotiationStillValid(entry, world(() => AI)).valid === true;
    const lost = D.negotiationStillValid(entry, world(() => AI2)).valid === false;
    const gone = D.negotiationStillValid(entry, world(() => undefined)).valid === false;
    const noWiring = D.negotiationStillValid(entry, world(undefined)).valid === true;
    check('T8: miasto oferty: wlasne=wazne, oddane/utracone/nieistniejace=wygasa, brak wiringu=bez zmian',
      own && lost && gone && noWiring, `own=${own} lost=${lost} gone=${gone} noWiring=${noWiring}`);
  }

  // (T9) wiring-guard (ZRODLO, nie zachowanie): main.ts musi korzystac z planera i podawac cityOwnerOf.
  // Wyjatek swiadomy od zasady „bez regex na zrodle": main.ts nie laduje sie w node; guard wylapuje usuniecie wiringu.
  {
    const mainSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
    const wired = mainSrc.includes('planAiOfferOnTable(negotiationTable, ownerId, ME(), converted.actionId)')
      && mainSrc.includes('offerPlan.replacedIds.length > 0')
      && /cityOwnerOf:\s*\(cityId: string\)\s*=>\s*cities\.find/.test(mainSrc);
    check('T9 (wiring-guard, zrodlo): main.ts uzywa planAiOfferOnTable, zastepuje replacedIds i podaje cityOwnerOf', wired);
  }

  console.log(failures === 0 ? 'diplo-peace-offer-dedup-one-active-test: WSZYSTKO ZIELONE' : `FAILURES=${failures}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
