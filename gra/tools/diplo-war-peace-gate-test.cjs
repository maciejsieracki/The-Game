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
const BUNDLE_M1 = path.resolve(__dirname, '.dip-warpeace-gate-m1.cjs');
const BUNDLE_M2 = path.resolve(__dirname, '.dip-warpeace-gate-m2.cjs');
const PROPOSALS = path.resolve(GRA, 'src', 'game', 'diplomacy-proposals.ts');
const PROFILE = path.resolve(GRA, 'src', 'game', 'diplomacy-war-peace-profile.ts');

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
  "",
].join('\n');

function mutantPlugin(from, to, file = PROPOSALS) {
  const info = { applied: 0 };
  return {
    info,
    plugin: {
      name: 'mutant-peace-gate',
      setup(build) {
        build.onLoad({ filter: new RegExp(path.basename(file).replace(/[.]/g, '\\.') + '$') }, async () => {
          const src = fs.readFileSync(file, 'utf8');
          const n = src.split(from).length - 1;
          info.applied = n;
          return { contents: src.split(from).join(to), loader: 'ts' };
        });
      },
    },
  };
}

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
    plugins,
  });
}

function cleanup() {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  for (const p of [BUNDLE_OK, BUNDLE_M1, BUNDLE_M2]) {
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
    warState: { turnsAtWar: 9, lostCitiesResponder: 1, responderRw: 0.6 }, responderTyp: 'rzymianie', authorOwnerId: 0,
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
    const m1 = mutantPlugin("if (ctx.warState && r5PlayerAuthors && r5RespondentIsAi && !ctx.responderIsCityState) {", "if (false) {");
    await buildBundle(BUNDLE_M1, [m1.plugin]);
    const m2 = mutantPlugin("Math.max(0, input.turnsAtWar) < C.odrzucenieMaxTurWojny", "Math.max(0, input.turnsAtWar) < 0", PROFILE);
    await buildBundle(BUNDLE_M2, [m2.plugin]);
    check('(0) mutanty faktycznie zmienily zrodlo (M1, M2 po 1 podmianie)', m1.info.applied === 1 && m2.info.applied === 1, [m1.info, m2.info]);

    const ok = run(require(BUNDLE_OK), 'ok');
    const m1r = run(require(BUNDLE_M1), 'M1');
    const m2r = run(require(BUNDLE_M2), 'M2');

    check('A: gracz->AI przed minimalnym czasem wojny = odrzucenie (za wcześnie)',
      ok.early.accepted === false && /za wcześnie/.test(ok.early.reason || ''), ok.early);
    check('B: gracz->AI silniejsze (bez utraty, <10 tur) = odrzucenie „czuje się silniejsze"',
      ok.stronger.accepted === false && /czuje się silniejsze/.test(ok.stronger.reason || ''), ok.stronger);
    check('C: po utracie miasta bramka (b) nie odrzuca',
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

    // mutacje
    check('M1 (brak bramki): przypadek B przechodzi (bramka usunieta wykrywalna)',
      !(m1r.stronger.accepted === false && /czuje się silniejsze/.test(m1r.stronger.reason || '')),
      m1r.stronger);
    check('F2: propozycja AI (autor = AI, respondent = gracz) jest przyjeta (accepted=true)',
      ok.aiAuthor.accepted === true, ok.aiAuthor);
    check('M2 (bramka bez progu 10 tur): przypadek B przechodzi (mutacja progu wykrywalna)',
      !(m2r.stronger.accepted === false && /czuje się silniejsze/.test(m2r.stronger.reason || '')),
      m2r.stronger);
  } finally {
    cleanup();
  }
  console.log(`\ndiplo-war-peace-gate-test: ${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
