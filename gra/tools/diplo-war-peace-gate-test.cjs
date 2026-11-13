'use strict';
/**
 * diplo-war-peace-gate-test.cjs — R-WEB-PEACE-RULES-Q1 (runda 1), R5 w evaluateProposal (case 'pokoj').
 * Gracz proponuje pokój AI w trwającej wojnie; bramka AI: minimalny czas wojny, „czuje się silniejsze",
 * mnożnik ceny (siła × cywilizacja). Mutanty: (M1) brak bramki w evaluateProposal, (M2) bramka (b) bez progu 10 tur.
 * Run: node tools/diplo-war-peace-gate-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-warpeace-gate-entry.ts');
const BUNDLE_OK = path.resolve(__dirname, '.dip-warpeace-gate-ok.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export {",
  "  evaluateProposal, createNegotiation, negotiationAsProposal,",
  "} from './game/diplomacy-proposals';",
  "export { peaceProposalBlocked, PEACE_PROPOSAL_MIN_WAR_TURNS } from './game/diplomacy-peace-proposal-timing';",
  "",
].join('\n');

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
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins: [...plugins, ADVANTAGE_OFF],
  });
}

function cleanup() {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  for (const p of [BUNDLE_OK]) {
    try { fs.unlinkSync(p); } catch (_) { /* ok */ }
  }
}

const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };

function ctxFor({ warState, responderTyp, authorOwnerId }) {
  return {
    relation: WOJNA,
    stanWojny: true,
    turn: 80,
    proposerRespekt: 60,
    responderRespekt: 60,
    militaryRatio: 1,
    respektWzgledny: 0.5,
    karaWspolnaGranica: false,
    difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: responderTyp },
    proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId,
    warState,
  };
}

function propose(mod, authorOwner) {
  const entry = mod.createNegotiation(
    { actionId: 'pokoj', proposerOwnerId: authorOwner === 0 ? 0 : 1, responderOwnerId: authorOwner === 0 ? 1 : 0, payload: {} },
    80,
    authorOwner === 0 ? 'player' : 'ai',
    1,
  );
  return mod.negotiationAsProposal(entry);
}

function proposeAction(mod, actionId, authorOwner = 1) {
  const entry = mod.createNegotiation(
    { actionId, proposerOwnerId: authorOwner === 0 ? 0 : 1, responderOwnerId: authorOwner === 0 ? 1 : 0, payload: {} },
    80,
    authorOwner === 0 ? 'player' : 'ai',
    2,
  );
  return mod.negotiationAsProposal(entry);
}

function run(mod, label) {
  const out = {};
  // A: gracz autorem, AI (Zulusi, minTur 7) po 3 turach -> za wcześnie
  out.early = mod.evaluateProposal(propose(mod, 0), ctxFor({
    warState: { turnsAtWar: 3, lostCitiesResponder: 0, responderRw: 0.5 }, responderTyp: 'zulusi', authorOwnerId: 0,
  }));
  // B: gracz autorem, AI silniejsze (rw 0.6, bez utraty, 9 tur) -> czuje się silniejsze
  out.stronger = mod.evaluateProposal(propose(mod, 0), ctxFor({
    warState: { turnsAtWar: 9, lostCitiesResponder: 0, responderRw: 0.6 }, responderTyp: 'rzymianie', authorOwnerId: 0,
  }));
  // C: jak B, ale AI straciło miasto -> bramka (b) nie odrzuca
  out.afterLoss = mod.evaluateProposal(propose(mod, 0), ctxFor({
    warState: { turnsAtWar: 10, lostCitiesResponder: 1, responderRw: 0.6 }, responderTyp: 'rzymianie', authorOwnerId: 0,
  }));
  // D: 20 tur, AI silniejsze -> bramka (b) i (c) nieaktywne
  out.after20 = mod.evaluateProposal(propose(mod, 0), ctxFor({
    warState: { turnsAtWar: 20, lostCitiesResponder: 0, responderRw: 0.9 }, responderTyp: 'rzymianie', authorOwnerId: 0,
  }));
  // E: bez warState -> brak bramki R5 (zachowanie sprzed rundy)
  out.noWarState = mod.evaluateProposal(propose(mod, 0), ctxFor({
    warState: undefined, responderTyp: 'rzymianie', authorOwnerId: 0,
  }));
  // G0: silne AI (rw 0.9), 12 tur, z utratą miasta (bramka nie odrzuca) -> mnożnik ceny > 1
  out.highRw = mod.evaluateProposal(propose(mod, 0), ctxFor({
    warState: { turnsAtWar: 12, lostCitiesResponder: 1, responderRw: 0.9 }, responderTyp: 'rzymianie', authorOwnerId: 0,
  }));
  // F: AI autorem (propozycja AI) w tym samym stanie co B -> bramka nie dotyczy
  out.aiAuthor = mod.evaluateProposal(propose(mod, 1), ctxFor({
    warState: { turnsAtWar: 9, lostCitiesResponder: 0, responderRw: 0.6 }, responderTyp: 'rzymianie', authorOwnerId: 1,
  }));
  void label;
  return out;
}

const GATE_REASON = /za wcześnie|czuje się silniejsze/;

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SRC, 'utf8');
  try {
    await buildBundle(BUNDLE_OK, []);

    const ok = run(require(BUNDLE_OK), 'ok');

    check('A: gracz->AI elapsed 3 jest odrzucone przez globalny próg 10 tur',
      ok.early.accepted === false && /10 pełnych tur/.test(ok.early.reason || ''), ok.early);
    check('B: gracz->AI elapsed 9 jest odrzucone przez globalny próg 10 tur',
      ok.stronger.accepted === false && /10 pełnych tur/.test(ok.stronger.reason || ''), ok.stronger);
    check('C: po utracie miasta wcześniejsza bramka profilu nie jest źródłem odrzucenia',
      !GATE_REASON.test(ok.afterLoss.reason || ''), ok.afterLoss);
    check('D: po 20 turach bramka (b)/(c) nieaktywna',
      !GATE_REASON.test(ok.after20.reason || ''), ok.after20);
    check('E: bez warState brak komunikatu bramki',
      !GATE_REASON.test(ok.noWarState.reason || ''), ok.noWarState);
    check('F: propozycja AI (autor = AI) nie podlega bramce',
      !GATE_REASON.test(ok.aiAuthor.reason || ''), ok.aiAuthor);
    check('G: mnożnik ceny (rw 0.9 => x1.8 siła) podnosi wymagany PW: bilans głębszy niż bez warState',
      typeof ok.highRw.pwBalance === 'number' && typeof ok.noWarState.pwBalance === 'number'
      && ok.highRw.pwBalance < ok.noWarState.pwBalance,
      { highRw: ok.highRw.pwBalance, noWarState: ok.noWarState.pwBalance });

    const timing = require(BUNDLE_OK);
    const timingResult = (actionId, turnsAtWar, author = 1) => timing.evaluateProposal(
      proposeAction(timing, actionId, author),
      ctxFor({ warState: { turnsAtWar, lostCitiesResponder: 1, responderRw: 0.5 }, responderTyp: 'rzymianie', authorOwnerId: author }),
    );
    for (const actionId of ['pokoj', 'rozejm', 'trybut_oferta']) {
      check(`${actionId}: elapsed 0 jest zablokowane`, timingResult(actionId, 0).accepted === false
        && /10 pełnych tur/.test(timingResult(actionId, 0).reason || ''));
      check(`${actionId}: elapsed 9 jest zablokowane`, timingResult(actionId, 9).accepted === false
        && /10 pełnych tur/.test(timingResult(actionId, 9).reason || ''));
      check(`${actionId}: elapsed 10 przechodzi bramkę czasu`, !/10 pełnych tur/.test(timingResult(actionId, 10).reason || ''));
    }
    for (const actionId of ['pokoj', 'rozejm']) {
      check(`${actionId}: elapsed 10 przepuszcza do dotychczasowej wyceny po obu stronach`,
        !/10 pełnych tur/.test(timingResult(actionId, 10, 1).reason || '')
        && !/10 pełnych tur/.test(timingResult(actionId, 10, 0).reason || ''));
    }
    check('obie strony korzystają z tej samej bramki czasu',
      /10 pełnych tur/.test(timingResult('rozejm', 9, 0).reason || '')
      && !/10 pełnych tur/.test(timingResult('rozejm', 10, 0).reason || ''));
    for (const [warKind, startTurn] of [['zwykla', 30], ['epoki', 900]]) {
      const restored = JSON.parse(JSON.stringify({ wojnaStartTura: startTurn }));
      const elapsed = (turn) => turn - restored.wojnaStartTura;
      check(`${warKind}: zapis/wczytanie zachowuje start wojny; elapsed 0 i 9 blok, 10 wolne`,
        timing.peaceProposalBlocked('pokoj', true, elapsed(startTurn))
        && timing.peaceProposalBlocked('rozejm', true, elapsed(startTurn + 9))
        && !timing.peaceProposalBlocked('pokoj', true, elapsed(startTurn + 10)));
      const restartedAt = startTurn + 40; // po pokoju/rozejmie para rozpoczyna nową wojnę
      check(`${warKind}: nowa wojna po zakończeniu poprzedniej dostaje nowe okno`,
        timing.peaceProposalBlocked('pokoj', true, restartedAt - restartedAt)
        && !timing.peaceProposalBlocked('pokoj', true, (restartedAt + 10) - restartedAt));
    }

    check('F2: propozycja AI elapsed 9 także zatrzymuje się na globalnym progu',
      ok.aiAuthor.accepted === false && /10 pełnych tur/.test(ok.aiAuthor.reason || ''), ok.aiAuthor);
  } finally {
    cleanup();
  }
  console.log(`\ndiplo-war-peace-gate-test: ${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
