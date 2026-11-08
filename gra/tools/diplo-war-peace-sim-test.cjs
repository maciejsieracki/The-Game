'use strict';
/**
 * diplo-war-peace-sim-test.cjs — R-WEB-PEACE-RULES-Q1 (runda 1), kryterium 1/4/7 (zachowanie, nie grep).
 *
 * Symulacja WIELOTUROWA na poziomie reguł: wojna AI↔gracz trwa 30 tur, a w każdej turze wołamy
 * prawdziwe `decideAIDiplomacy` (ai.ts) i prawdziwe `evaluateProposal` (diplomacy-proposals.ts).
 * Silnik (endTurn, bitwy) NIE jest uruchamiany — wojna nie kończy się automatycznie, a stan
 * (turnsAtWar, utracone miasta, zdrowie armii) podaje driver tak, jak robi to main.ts.
 * Cooldown propozycji AI = 3 tury (driver odtwarza AI_REJECTED_OFFER_COOLDOWN_TURNS).
 *
 * Mutanty (każdy musi być wykryty przez test zachowania):
 *   M_SIG    — ai.ts: sygnały pokoju wyłączone w priorytecie 2 (tylko rw <= progPokojSlabosc)
 *   M_FEEL   — ai.ts: AI proponuje pokój mimo „czuje się silniejsze" (brak !aiFeelsStronger)
 *   M_WEAR   — profile: zmęczenie stałe 0.5 (powrót do martwej heurystyki)
 *   M_HEALTH — profile: sygnał (c) zdrowia armii wyłączony
 *   M_TUR    — ai.ts: AI składa propozycję pokoju bez bramki minTurWojny (R5a ↔ propozycje AI)
 * Run: node tools/diplo-war-peace-sim-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-warpeace-sim-entry.ts');
const AI_FILE = path.resolve(GRA, 'src', 'game', 'ai.ts');
const PROFILE = path.resolve(GRA, 'src', 'game', 'diplomacy-war-peace-profile.ts');
const BUNDLES = {
  ok: path.resolve(__dirname, '.dip-warpeace-sim-ok.cjs'),
  sig: path.resolve(__dirname, '.dip-warpeace-sim-msig.cjs'),
  feel: path.resolve(__dirname, '.dip-warpeace-sim-mfeel.cjs'),
  wear: path.resolve(__dirname, '.dip-warpeace-sim-mwear.cjs'),
  health: path.resolve(__dirname, '.dip-warpeace-sim-mhealth.cjs'),
  tur: path.resolve(__dirname, '.dip-warpeace-sim-mtur.cjs'),
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { decideAIDiplomacy } from './game/ai';",
  "export { evaluateProposal, createNegotiation, negotiationAsProposal } from './game/diplomacy-proposals';",
  "export { warWearinessFraction, warWearinessShare, resolveWarPeaceProfile, aiPeaceSignals } from './game/diplomacy-war-peace-profile';",
  '',
].join('\n');

function mutantPlugin(file, from, to) {
  const info = { applied: 0 };
  return {
    info,
    plugin: {
      name: 'mutant-sim',
      setup(build) {
        build.onLoad({ filter: new RegExp(path.basename(file).replace(/[.]/g, '\\.') + '$') }, async () => {
          const src = fs.readFileSync(file, 'utf8');
          info.applied = src.split(from).length - 1;
          return { contents: src.split(from).join(to), loader: 'ts' };
        });
      },
    },
  };
}

async function buildBundle(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent', plugins,
  });
}

function cleanup() {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  for (const p of Object.values(BUNDLES)) { try { fs.unlinkSync(p); } catch (_) { /* ok */ } }
}

// ---- driver: stan wojny w każdej turze (jak main.ts diploRelWarFields / diploWarStateFor) ----
function aiTurn(mod, t, o) {
  return mod.decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.5,
    currentTurn: t,
    myTypCywilizacji: o.typ,
    relacje: [{
      partnerId: 'gracz',
      relation: { zaufanie: 10, respekt: 20, status: 'wojna' },
      respektWzgledny: o.rw,
      stanWojny: true,
      turnsAtWar: t,
      lostCitiesInWar: o.lost || 0,
      turnsSinceCityChange: t,
      armyHealthShare: o.health,
    }],
  });
}

// AI proponuje pokój, cooldown 3 tury między propozycjami (odtwarza AI_REJECTED_OFFER_COOLDOWN_TURNS).
function aiProposalsOver(mod, o, turns) {
  const out = [];
  let last = -Infinity;
  for (let t = 1; t <= turns; t++) {
    const cmd = aiTurn(mod, t, o).find(c => c.type === 'zaproponuj_pokoj');
    if (cmd && t - last >= 3) { out.push({ t, powod: cmd.powod }); last = t; }
  }
  return out;
}

// Czy AI w ogóle chce pokoju w tej turze (bez cooldownu).
function aiWantsPeaceAt(mod, t, o) {
  return aiTurn(mod, t, o).some(c => c.type === 'zaproponuj_pokoj');
}

const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };
function ctxFor(warState, responderTyp) {
  return {
    relation: WOJNA, stanWojny: true, turn: 80, proposerRespekt: 60, responderRespekt: 60,
    militaryRatio: 1, respektWzgledny: 0.5, karaWspolnaGranica: false, difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: responderTyp },
    proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId: 0, warState,
  };
}

// Gracz proponuje pokój AI (autor = gracz) w turze t.
function playerPeaceProposal(mod, t, o) {
  const entry = mod.createNegotiation(
    { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} }, 80, 'player', 1,
  );
  return mod.evaluateProposal(mod.negotiationAsProposal(entry), ctxFor({
    turnsAtWar: t, lostCitiesResponder: o.lost || 0, responderRw: o.rw,
  }, o.typ));
}

function isStronger(r) { return /czuje się silniejsze/.test(r.reason || ''); }
function isTooEarly(r) { return /za wcześnie/.test(r.reason || ''); }

const SLABY = { rw: 0.2, typ: 'zulusi', health: 0.9 };
const SILNY = { rw: 0.7, typ: 'zulusi', health: 0.9 };
const SREDNI = { rw: 0.5, typ: 'zulusi', health: 0.9 };

function runSuite(mod) {
  const r = {};
  r.weakSchedule = aiProposalsOver(mod, SLABY, 30);
  r.strongFirstT = null;
  for (let t = 1; t <= 30; t++) { if (aiWantsPeaceAt(mod, t, SILNY)) { r.strongFirstT = t; break; } }
  r.strongAt8 = aiWantsPeaceAt(mod, 8, SILNY);
  r.strongAt9 = aiWantsPeaceAt(mod, 9, SILNY);
  r.midFirstT = null;
  for (let t = 1; t <= 30; t++) { if (aiWantsPeaceAt(mod, t, SREDNI)) { r.midFirstT = t; break; } }
  r.midReasonAtFirst = null;
  if (r.midFirstT !== null) {
    r.midReasonAtFirst = aiTurn(mod, r.midFirstT, SREDNI).find(c => c.type === 'zaproponuj_pokoj').powod;
  }
  r.healthLow = aiWantsPeaceAt(mod, 7, { rw: 0.5, typ: 'zulusi', health: 0.1 });
  r.healthHigh = aiWantsPeaceAt(mod, 7, { rw: 0.5, typ: 'zulusi', health: 0.9 });
  // gracz proponuje pokój silnej AI (bez utraty miasta) w każdej turze
  r.playerVsStrong = [];
  for (let t = 1; t <= 30; t++) r.playerVsStrong.push(playerPeaceProposal(mod, t, SILNY));
  // gracz proponuje pokój silnej AI, która straciła miasto w turze 5
  r.playerVsStrongLoss = [];
  for (let t = 1; t <= 30; t++) {
    r.playerVsStrongLoss.push(playerPeaceProposal(mod, t, { rw: 0.7, typ: 'zulusi', lost: t >= 5 ? 1 : 0 }));
  }
  // spójność: AI nie proponuje pokoju w stanie, który sama odrzuciłaby od gracza jako „silniejsze"
  r.earlyViolations = [];
  r.consistencyViolations = [];
  const rws = [0.2, 0.5, 0.56, 0.6, 0.7, 0.9];
  for (const rw of rws) {
    for (const lost of [0, 1]) {
      for (let t = 1; t <= 30; t++) {
        const o = { rw: rw, lost: lost, typ: 'zulusi', health: 0.9 };
        if (!aiWantsPeaceAt(mod, t, o)) continue;
        const verdict = playerPeaceProposal(mod, t, o);
        if (isStronger(verdict)) r.consistencyViolations.push({ rw: rw, lost: lost, t: t });
        if (isTooEarly(verdict)) r.earlyViolations.push({ rw: rw, lost: lost, t: t });
      }
    }
  }
  return r;
}

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SRC, 'utf8');
  try {
    await buildBundle(BUNDLES.ok, []);
    const mSig = mutantPlugin(AI_FILE, '(rw <= progPokojSlabosc || peaceSignals.wantsPeace)', '(rw <= progPokojSlabosc)');
    await buildBundle(BUNDLES.sig, [mSig.plugin]);
    const mFeel = mutantPlugin(AI_FILE, '!aiFeelsStronger && ', '');
    await buildBundle(BUNDLES.feel, [mFeel.plugin]);
    const mWear = mutantPlugin(PROFILE, 'return Math.min(1, turns / zmeczenieT);', 'return 0.5;');
    await buildBundle(BUNDLES.wear, [mWear.plugin]);
    const mTur = mutantPlugin(AI_FILE, 'const aiPeaceTimeOk = turnsAtWarRel >= warProfile.minTurWojny;', 'const aiPeaceTimeOk = true;');
    await buildBundle(BUNDLES.tur, [mTur.plugin]);
    const mHealth = mutantPlugin(PROFILE, 'input.armyHealthShare !== undefined && input.armyHealthShare < profile.progZdrowia', 'false');
    await buildBundle(BUNDLES.health, [mHealth.plugin]);
    check('(0) każdy mutant podmienił dokładnie 1 miejsce',
      [mSig, mFeel, mWear, mHealth, mTur].every(m => m.info.applied === 1), [mSig.info, mFeel.info, mWear.info, mHealth.info, mTur.info]);

    const ok = runSuite(require(BUNDLES.ok));

    // kryterium 1: AI słabsze proponuje co 3 tury, ale dopiero od minTurWojny (R5a ↔ propozycje AI)
    const minTurZulusi = require(BUNDLES.ok).resolveWarPeaceProfile('zulusi').minTurWojny;
    const ts = ok.weakSchedule.map(x => x.t);
    const expected = [];
    for (let t = minTurZulusi; t <= 30; t += 3) expected.push(t);
    check('S1: AI słabsze (rw 0.2) proponuje pokój co 3 tury od minTurWojny (zulusi: tury ' + expected.join(',') + ')',
      JSON.stringify(ts) === JSON.stringify(expected), { ts, minTurZulusi });
    check('S1a: AI słabsze nie proponuje pokoju przed minTurWojny (zarzut 2: spójność z R5a)',
      ok.weakSchedule.every(x => x.t >= minTurZulusi), ts);
    check('S1b: propozycje AI słabszej niosą powód sygnału (a)',
      ok.weakSchedule.length > 0 && ok.weakSchedule.every(x => /sygnaly=a/.test(x.powod)), ok.weakSchedule[0]);

    // kryterium 1: AI silniejsze nie proponuje przed turą 10 (sygnał e nie może jej „przepchnąć")
    check('S2: AI silniejsze (rw 0.7) nie proponuje pokoju w turach 8 i 9 (sygnał e aktywny, ale „czuje się silniejsze")',
      ok.strongAt8 === false && ok.strongAt9 === false, { s8: ok.strongAt8, s9: ok.strongAt9 });
    check('S2b: AI silniejsze pierwszą propozycję składa dopiero w turze >= 10',
      ok.strongFirstT === null || ok.strongFirstT >= 10, ok.strongFirstT);

    // kryterium 1: gracz vs silniejsza AI: odrzucenie przed turą 10 z komunikatem
    const pvs = ok.playerVsStrong;
    check('S3: gracz (silna AI, bez utraty) dostaje „czuje się silniejsze" w turach 7-9 (po minTur 7)',
      [7, 8, 9].every(t => isStronger(pvs[t - 1])), [7, 8, 9].map(t => pvs[t - 1].reason));
    check('S3b: gracz (silna AI, bez utraty) od tury 10 nie dostaje odrzucenia „silniejsze"',
      pvs.slice(9).every(r => !isStronger(r)), pvs.slice(9).map(r => r.reason));
    check('S3c: po 20 turach odrzucenie (silniejsze / za wcześnie) znika całkowicie',
      pvs.slice(19).every(r => !isStronger(r) && !isTooEarly(r)), pvs.slice(19).map(r => r.reason));
    const pls = ok.playerVsStrongLoss;
    check('S4: po utracie miasta (tura 5) gracz NIE dostaje „silniejsze" w turach 6-9',
      [6, 7, 8, 9].every(t => !isStronger(pls[t - 1])), [6, 7, 8, 9].map(t => pls[t - 1].reason));
    check('S4b: kontrola — bez utraty w turze 8 odrzucenie „silniejsze" jest',
      isStronger(pvs[7]), pvs[7].reason);

    // kryterium 1/4/7: zmęczenie wojną — umiarkowana AI nie chce pokoju przed ~0.4·T
    check('S5: AI średnia (rw 0.5, bez sygnału) pierwszy raz chce pokoju w turze 8 (zmęczenie 8/20 = 0.4)',
      ok.midFirstT === 8, ok.midFirstT);
    check('S5b: pierwsza propozycja AI średniej to sygnał (e) zmęczenia',
      ok.midReasonAtFirst !== null && /sygnaly=e/.test(ok.midReasonAtFirst), ok.midReasonAtFirst);

    // zdrowie armii (sygnał c)
    check('S6: zdrowie armii 0.1 (< progZdrowia) → AI chce pokoju w turze 7 (sygnał c, po minTurWojny)', ok.healthLow === true, ok.healthLow);
    check('S6b: zdrowie armii 0.9 → brak chęci pokoju w turze 7 (minTurWojny zulusi)', ok.healthHigh === false, ok.healthHigh);

    // spójność: AI nie proponuje pokoju, którego sama by odrzuciła
    check('S7: spójność — AI nigdy nie proponuje pokoju w stanie „czuje się silniejsze" (0 naruszeń)',
      ok.consistencyViolations.length === 0, ok.consistencyViolations.slice(0, 5));
    check('S7b: spójność — AI nigdy nie proponuje pokoju w stanie „za wcześnie" (R5a, 0 naruszeń)',
      ok.earlyViolations.length === 0, ok.earlyViolations.slice(0, 5));

    // mutanty: każdy musi być wykryty przez zachowanie
    const mSigR = runSuite(require(BUNDLES.sig));
    check('M_SIG wykryty: AI średnia nie chce pokoju w turze 8 (sygnał e wyłączony)',
      mSigR.midFirstT !== 8, mSigR.midFirstT);
    const mFeelR = runSuite(require(BUNDLES.feel));
    check('M_FEEL wykryty: AI silniejsze chce pokoju w turze 8 lub 9',
      mFeelR.strongAt8 === true || mFeelR.strongAt9 === true, { s8: mFeelR.strongAt8, s9: mFeelR.strongAt9 });
    const mWearR = runSuite(require(BUNDLES.wear));
    check('M_WEAR wykryty: stałe zmęczenie 0.5 daje chęć pokoju AI średniej już w turze 1',
      mWearR.midFirstT !== 8, mWearR.midFirstT);
    const mTurR = runSuite(require(BUNDLES.tur));
    check('M_TUR wykryty: bez bramki minTurWojny AI składa propozycję w turze 1 (S1/S7b padają)',
      mTurR.weakSchedule.length > 0 && mTurR.weakSchedule[0].t === 1 && mTurR.earlyViolations.length > 0,
      { first: mTurR.weakSchedule[0], early: mTurR.earlyViolations.length });
    const mHealthR = runSuite(require(BUNDLES.health));
    check('M_HEALTH wykryty: zdrowie armii 0.1 nie daje chęci pokoju (sygnał c off)',
      mHealthR.healthLow === false, mHealthR.healthLow);
  } finally {
    cleanup();
  }
  console.log('\ndiplo-war-peace-sim-test: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
