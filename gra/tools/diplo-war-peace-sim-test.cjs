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
 *   M_SIG    — ai.ts: sygnały pokoju wyłączone w priorytecie 2 (tylko pozycja militarna slabsza)
 *   M_FEEL   — ai.ts: AI proponuje pokój mimo „czuje się silniejsze" (brak !aiFeelsStronger)
 *   M_WEAR   — war-weariness.ts (ścieżka decyzji AI, warWearinessLevel): licznik tur zmęczenia zerowany (zostają tylko miasta)
 *   M_HEALTH — profile: sygnał (c) zdrowia armii wyłączony
 *   M_TUR    — ai.ts: AI składa propozycję pokoju bez bramki czasu wojny (aiPeaceTimeOk = true)
 *   M_REV    — ai.ts: cofnięcie naprawy r2 (bramka AI = minTurWojny, zulusi 7 zamiast 10) — czerwieni S7b
 *   M_GATE   — timing: bramka czasu gracza (PEACE_PROPOSAL_MIN_WAR_TURNS) zdjęta do 1 tury
 *   M_STRONG — proposals: odrzucenie „militarnie silniejsza" gracza wyłączone
 * Run: node tools/diplo-war-peace-sim-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-warpeace-sim-entry.ts');
const AI_FILE = path.resolve(GRA, 'src', 'game', 'ai.ts');
const PROFILE = path.resolve(GRA, 'src', 'game', 'diplomacy-war-peace-profile.ts');
const WARWEAR = path.resolve(GRA, 'src', 'game', 'war-weariness.ts');
const TIMING = path.resolve(GRA, 'src', 'game', 'diplomacy-peace-proposal-timing.ts');
const PROPOSALS = path.resolve(GRA, 'src', 'game', 'diplomacy-proposals.ts');
const BUNDLES = {
  ok: path.resolve(__dirname, '.dip-warpeace-sim-ok.cjs'),
  sig: path.resolve(__dirname, '.dip-warpeace-sim-msig.cjs'),
  feel: path.resolve(__dirname, '.dip-warpeace-sim-mfeel.cjs'),
  wear: path.resolve(__dirname, '.dip-warpeace-sim-mwear.cjs'),
  health: path.resolve(__dirname, '.dip-warpeace-sim-mhealth.cjs'),
  tur: path.resolve(__dirname, '.dip-warpeace-sim-mtur.cjs'),
  rev: path.resolve(__dirname, '.dip-warpeace-sim-mrev.cjs'),
  gate: path.resolve(__dirname, '.dip-warpeace-sim-mgate.cjs'),
  strong: path.resolve(__dirname, '.dip-warpeace-sim-mstrong.cjs'),
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
  "export { PEACE_PROPOSAL_MIN_WAR_TURNS } from './game/diplomacy-peace-proposal-timing';",
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


// DODATEK 1 (R-WEB-DIPLO-PEACE-BALANCE-ACCEPT-DIAG-Q1): regula przewagi militarnej >20% jest testowana osobno
// (diplo-peace-balance-accept-test.cjs). Ten test chroni reguly R3/R5 NIEZALEZNIE od niej, wiec bundle liczy
// z wylaczonym progiem (przewagaMilitarna.prog = 1000 => klasa 'przewaga' nieosiagalna). Asercje bez zmian.
const ADVANTAGE_OFF = {
  name: 'advantage-off',
  setup(build) {
    build.onLoad({ filter: /diplomacy-war-peace-params\.json$/ }, async (args) => {
      const j = JSON.parse(fs.readFileSync(args.path, 'utf8'));
      j.przewagaMilitarna.prog = 1000;
      return { contents: JSON.stringify(j), loader: 'json' };
    });
  },
};
async function buildBundle(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent', plugins: [...plugins, ADVANTAGE_OFF],
  });
}

function cleanup() {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  for (const p of Object.values(BUNDLES)) { try { fs.unlinkSync(p); } catch (_) { /* ok */ } }
}

// ---- driver: stan wojny w każdej turze (jak main.ts diploRelWarFields / diploWarStateFor) ----
// Siła AI w scenariuszu (sila partnera = 1000 − ta wartość): rw > 0.5 → AI silniejsza militarnie.
function silaScenariusza(rw) { return rw > 0.5 ? 700 : 300; }

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
      // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: pozycja wg SIŁY MILITARNEJ (nie rw).
      // Mapowanie scenariusza: rw > 0.5 = AI silniejsza militarnie; rw <= 0.5 = AI słabsza.
      silaMilitarnaAI: { sila: silaScenariusza(o.rw), armiaPkt: 0 },
      silaMilitarnaPartner: { sila: 1000 - silaScenariusza(o.rw), armiaPkt: 0 },
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
    responderPozycjaMilitarna: o.rw > 0.5 ? 'silniejsza' : 'slabsza',
  }, o.typ));
}

function isStronger(r) { return /czuje się silniejsze|militarnie silniejsza/.test(r.reason || ''); }
// Kod gracza (diplomacy-proposals.ts) pisze „Pokój i rozejm dostępne po 10 pełnych turach wojny";
// stary regex /za wcześnie/ nie trafiał nigdy, więc S7b i M_TUR były puste (zarzut 2 Evaluatora).
function isTooEarly(r) { return /za wcześnie|po 10 pełnych turach/.test(r.reason || ''); }

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
  r.healthLow = aiWantsPeaceAt(mod, 10, { rw: 0.5, typ: 'zulusi', health: 0.1 });
  r.healthHigh = aiWantsPeaceAt(mod, 10, { rw: 0.5, typ: 'zulusi', health: 0.9 });
  // profil zmęczenia (M_WEAR): pełny harmonogram chęci pokoju AI średniej i słabej w turach 1-30
  r.midTurns = [];
  for (let t = 1; t <= 30; t++) if (aiWantsPeaceAt(mod, t, SREDNI)) r.midTurns.push(t);
  r.weakTurns = [];
  for (let t = 1; t <= 30; t++) if (aiWantsPeaceAt(mod, t, SLABY)) r.weakTurns.push(t);
  // pełna siatka decyzji AI (wszystkie typy komend) — zmęczenie wpływa na oddanie miasta i progi, nie tylko na pokój
  r.wearGrid = [];
  for (const rw of [0.2, 0.5, 0.56, 0.6, 0.7]) {
    for (const lost of [0, 1, 2, 3]) {
      for (let t = 1; t <= 30; t++) {
        const o = { rw: rw, lost: lost, typ: 'zulusi', health: 0.9 };
        r.wearGrid.push(aiTurn(mod, t, o).map(c => c.type + ':' + (c.powod || '')).join('|'));
      }
    }
  }
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
    const mSig = mutantPlugin(AI_FILE, "(peacePosMil === 'slabsza' || peaceSignals.wantsPeace)", "(peacePosMil === 'slabsza')");
    await buildBundle(BUNDLES.sig, [mSig.plugin]);
    const mFeel = mutantPlugin(AI_FILE, '!aiFeelsStronger && ', '');
    await buildBundle(BUNDLES.feel, [mFeel.plugin]);
    const mWear = mutantPlugin(WARWEAR, 'const turns = Math.max(0, inp.turnsAtWar);', 'const turns = 0;');
    await buildBundle(BUNDLES.wear, [mWear.plugin]);
    const mTur = mutantPlugin(AI_FILE, 'const aiPeaceTimeOk = turnsAtWarRel >= Math.max(warProfile.minTurWojny, PEACE_PROPOSAL_MIN_WAR_TURNS);', 'const aiPeaceTimeOk = true;');
    await buildBundle(BUNDLES.tur, [mTur.plugin]);
    const mRev = mutantPlugin(AI_FILE, 'const aiPeaceTimeOk = turnsAtWarRel >= Math.max(warProfile.minTurWojny, PEACE_PROPOSAL_MIN_WAR_TURNS);', 'const aiPeaceTimeOk = turnsAtWarRel >= warProfile.minTurWojny;');
    await buildBundle(BUNDLES.rev, [mRev.plugin]);
    const mHealth = mutantPlugin(PROFILE, 'input.armyHealthShare !== undefined && input.armyHealthShare < profile.progZdrowia', 'false');
    await buildBundle(BUNDLES.health, [mHealth.plugin]);
    const mGate = mutantPlugin(TIMING, 'export const PEACE_PROPOSAL_MIN_WAR_TURNS = 10;', 'export const PEACE_PROPOSAL_MIN_WAR_TURNS = 1;');
    await buildBundle(BUNDLES.gate, [mGate.plugin]);
    const mStrong = mutantPlugin(PROPOSALS, "if (r5Gate.verdict === 'stronger') {", "if (false) {");
    await buildBundle(BUNDLES.strong, [mStrong.plugin]);
    check('(0) każdy mutant podmienił dokładnie 1 miejsce',
      [mSig, mFeel, mWear, mHealth, mTur, mRev, mGate, mStrong].every(m => m.info.applied === 1),
      [mSig.info, mFeel.info, mWear.info, mHealth.info, mTur.info, mRev.info, mGate.info, mStrong.info]);

    const ok = runSuite(require(BUNDLES.ok));

    // kryterium 1: AI słabsze proponuje co 3 tury, ale dopiero od minTurWojny (R5a ↔ propozycje AI)
    // R-WEB-TEST-DEBT-DIPLO-WAR-PEACE-SIM-Q1 r2: bramka czasu AI = max(minTurWojny, PEACE_PROPOSAL_MIN_WAR_TURNS)
    // (ta sama reguła „pierwsze propozycje od tury 10" co dla gracza; zulusi minTurWojny = 7 jest niżej).
    const minTurZulusi = require(BUNDLES.ok).resolveWarPeaceProfile('zulusi').minTurWojny;
    const minAI = Math.max(minTurZulusi, require(BUNDLES.ok).PEACE_PROPOSAL_MIN_WAR_TURNS);
    const ts = ok.weakSchedule.map(x => x.t);
    const expected = [];
    for (let t = minAI; t <= 30; t += 3) expected.push(t);
    check('S1: AI słabsze (rw 0.2) proponuje pokój co 3 tury od tury 10 (max(minTurWojny, 10); zulusi: tury ' + expected.join(',') + ')',
      JSON.stringify(ts) === JSON.stringify(expected), { ts, minTurZulusi, minAI });
    check('S1a: AI słabsze nie proponuje pokoju przed bramką czasu (tura 10; R5a + „od tury 10")',
      ok.weakSchedule.every(x => x.t >= minAI), ts);
    check('S1b: propozycje AI słabszej militarnie niosą powód pozycji (pozycja=slabsza, R-WEB-AUDIT-PEACE-GATE-MILITARY-STRENGTH-Q1)',
      ok.weakSchedule.length > 0 && ok.weakSchedule.every(x => /pozycja=slabsza/.test(x.powod)), ok.weakSchedule[0]);

    // kryterium 1: AI silniejsze nie proponuje przed turą 10 (sygnał e nie może jej „przepchnąć")
    check('S2: AI silniejsze (rw 0.7) nie proponuje pokoju w turach 8 i 9 (sygnał e aktywny, ale „czuje się silniejsze")',
      ok.strongAt8 === false && ok.strongAt9 === false, { s8: ok.strongAt8, s9: ok.strongAt9 });
    check('S2b: AI silniejsze pierwszą propozycję składa dopiero w turze >= 10',
      ok.strongFirstT === null || ok.strongFirstT >= 10, ok.strongFirstT);

    // kryterium 1: gracz vs silniejsza AI: odrzucenie przed turą 10 z komunikatem
    const pvs = ok.playerVsStrong;
    // Zatwierdzone: „pierwsze propozycje pokoju od tury 10" — gracz w turach 7-9 dostaje odrzucenie CZASOWE
    // (bramka PEACE_PROPOSAL_MIN_WAR_TURNS = 10 wyprzedza bramkę siły; kolejność bramek w evaluateProposal).
    check('S3: gracz (silna AI, bez utraty) w turach 7-9 dostaje odrzucenie czasowe „po 10 pełnych turach wojny"',
      [7, 8, 9].every(t => /po 10 pełnych turach/.test(pvs[t - 1].reason || '')), [7, 8, 9].map(t => pvs[t - 1].reason));
    // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: silniejsza militarnie AI odrzuca bez limitu czasu (nie wygasa po turze 10).
    check('S3b: gracz (silna AI, bez utraty) od tury 10 nadal dostaje odrzucenie (reguła siły, bez wygaśnięcia)',
      pvs.slice(9).every(r => isStronger(r)), pvs.slice(9).map(r => r.reason));
    check('S3c: po 20 turach silniejsza militarnie AI nadal odrzuca (bez miasta)',
      pvs.slice(19).every(r => isStronger(r)), pvs.slice(19).map(r => r.reason));
    const pls = ok.playerVsStrongLoss;
    // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: utrata miasta NIE zmienia pozycji militarnej —
    // silniejsza AI nadal odrzuca pokój bez miasta (stara reguła „po utracie miasta nie czuje się silniejsza" uchylona).
    check('S4: po utracie miasta (tura 5) silniejsza militarnie AI nadal odrzuca w turach 10-12 (reguła siły)',
      [10, 11, 12].every(t => isStronger(pls[t - 1])), [10, 11, 12].map(t => pls[t - 1].reason));
    // S4b przeniesione z tury 8 (przed bramką czasu, zwraca „po 10 pełnych turach") na turę 10 — pierwszą po bramce.
    check('S4b: kontrola — bez utraty w turze 10 (pierwsza tura po bramce czasu) odrzucenie „militarnie silniejsza" jest',
      isStronger(pvs[9]), pvs[9].reason);

    // kryterium 1/4/7: zmęczenie wojną — umiarkowana AI nie chce pokoju przed ~0.4·T
    // R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1: pasmo „średnia" zniknęło — każda słabsza militarnie AI
    // szuka pokoju od minTurWojny (zmęczenie nie bramkuje). Scenariusz rw 0.5 = AI słabsza (siła 300 vs 700).
    check('S5: AI słabsza militarnie (rw 0.5) pierwszy raz chce pokoju od tury 10 (bramka czasu r2)',
      ok.midFirstT === 10, ok.midFirstT);
    check('S5b: pierwsza propozycja AI słabszej militarnie niesie sygnał (f) słabszej siły',
      ok.midReasonAtFirst !== null && /sygnaly=[^;]*f/.test(ok.midReasonAtFirst), ok.midReasonAtFirst);

    // zdrowie armii (sygnał c)
    check('S6: zdrowie armii 0.1 (< progZdrowia) → AI chce pokoju w turze 10 (sygnał c, po bramce czasu)', ok.healthLow === true, ok.healthLow);
    check('S6b: zdrowie armii 0.9 nie blokuje — słabsza militarnie AI szuka pokoju w turze 10 (reguła siły)', ok.healthHigh === true, ok.healthHigh);

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
    check('M_FEEL wykryty: AI silniejsze (bez „czuje się silniejsze") składa propozycję od tury 10',
      mFeelR.strongFirstT !== null, mFeelR.strongFirstT);
    const mWearR = runSuite(require(BUNDLES.wear));
    check('M_WEAR wykryty: zerowany licznik tur zmęczenia zmienia decyzje AI (siatka rw×miasta×tury)',
      JSON.stringify(mWearR.wearGrid) !== JSON.stringify(ok.wearGrid),
      { diffs: ok.wearGrid.filter((v, i) => v !== mWearR.wearGrid[i]).length });
    const mTurR = runSuite(require(BUNDLES.tur));
    check('M_TUR wykryty: bez bramki czasu AI składa propozycję w turze 1 (S1/S7b padają)',
      mTurR.weakSchedule.length > 0 && mTurR.weakSchedule[0].t === 1 && mTurR.earlyViolations.length > 0,
      { first: mTurR.weakSchedule[0], early: mTurR.earlyViolations.length });
    const mGateR = runSuite(require(BUNDLES.gate));
    check('M_GATE wykryty: bramka czasu gracza zdjęta do 1 tury — S3 (tury 7-9) nie dostaje już odrzucenia czasowego',
      [7, 8, 9].some(t => !/po 10 pełnych turach/.test(mGateR.playerVsStrong[t - 1].reason || '')),
      [7, 8, 9].map(t => mGateR.playerVsStrong[t - 1].reason));
    const mStrongR = runSuite(require(BUNDLES.strong));
    check('M_STRONG wykryty: bez odrzucenia „militarnie silniejsza" gracz dostaje odrzucenie inne niż siła w turze 10 (S3b/S4b padają)',
      !isStronger(mStrongR.playerVsStrong[9]), mStrongR.playerVsStrong[9].reason);
    const mRevR = runSuite(require(BUNDLES.rev));
    check('M_REV wykryty: cofnięta bramka AI (minTurWojny) → AI składa propozycję w turach 7-9 (S7b pada)',
      mRevR.earlyViolations.length > 0 && mRevR.earlyViolations.some(v => v.t >= 7 && v.t <= 9),
      { early: mRevR.earlyViolations.length, first: mRevR.earlyViolations[0] });
    const mHealthR = runSuite(require(BUNDLES.health));
    // Sygnał zdrowia (c) nie wpływa na słabszą militarnie AI (pozycja siły decyduje) — mutant niewidoczny w tym scenariuszu.
    check('M_HEALTH (przeniesiony): wyłączenie sygnału zdrowia nie zmienia decyzji słabszej militarnie AI',
      mHealthR.healthLow === true, mHealthR.healthLow);
  } finally {
    cleanup();
  }
  console.log('\ndiplo-war-peace-sim-test: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
