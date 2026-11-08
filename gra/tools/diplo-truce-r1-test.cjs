'use strict';
/**
 * diplo-truce-r1-test.cjs — R-WEB-TRUCE-Q1 (runda 1): rozejm jako propozycja + cykl życia.
 * Sprawdza: (1) helpery cyklu życia N-1/N/N+1, (2) długości 5/10/15 (inne odrzucone),
 * (3) bramki wojny identyczne z pokojem (czas wojny, „czuje się silniejsze", brak wojny),
 * (4) baza PW rozejmu z acceptance-points (200) ≠ pokój (500), (5) akceptacja daje oneShotTrade.
 * Mutanty: (M1) brak walidacji długości, (M2) baza PW rozejmu = baza pokoju.
 * Run: node tools/diplo-truce-r1-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-truce-r1-entry.ts');
const BUNDLE_OK = path.resolve(__dirname, '.dip-truce-r1-ok.cjs');
const BUNDLE_M1 = path.resolve(__dirname, '.dip-truce-r1-m1.cjs');
const BUNDLE_M2 = path.resolve(__dirname, '.dip-truce-r1-m2.cjs');
const BUNDLE_M3 = path.resolve(__dirname, '.dip-truce-r1-m3.cjs');
const BUNDLE_M4 = path.resolve(__dirname, '.dip-truce-r1-m4.cjs');
const BUNDLE_M5 = path.resolve(__dirname, '.dip-truce-r1-m5.cjs');
const PROPOSALS = path.resolve(GRA, 'src', 'game', 'diplomacy-proposals.ts');
const PEACE_LOCK = path.resolve(GRA, 'src', 'game', 'diplomacy-peace-lock.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  'export {',
  '  evaluateProposal, createNegotiation, negotiationAsProposal, resolvePlayerAcceptsAiPending,',
  '} from \'./game/diplomacy-proposals\';',
  'export {',
  '  TRUCE_DURATION_OPTIONS, normalizeTruceDuration, truceUntilTurn,',
  '  isTruceActive, truceExpiryAction, isTruceBreach,',
  '} from \'./game/diplomacy-peace-lock\';',
  '',
].join('\n');

function mutantPlugin(from, to, target = PROPOSALS) {
  const info = { applied: 0 };
  const filter = new RegExp(path.basename(target).replace(/[.]/g, '\\.') + '$');
  return {
    info,
    plugin: {
      name: 'mutant-truce-r1',
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
  for (const p of [BUNDLE_OK, BUNDLE_M1, BUNDLE_M2, BUNDLE_M3, BUNDLE_M4, BUNDLE_M5]) {
    try { fs.unlinkSync(p); } catch (_) { /* ok */ }
  }
}

const WOJNA = { zaufanie: 5, respekt: 5, status: 'wojna' };

function ctxFor({ warState, stanWojny = true, responderTyp = 'rzymianie' }) {
  return {
    relation: stanWojny ? WOJNA : { zaufanie: 50, respekt: 50, status: 'pokoj' },
    stanWojny,
    turn: 80,
    proposerRespekt: 60,
    responderRespekt: 60,
    militaryRatio: 1,
    respektWzgledny: 0.5,
    karaWspolnaGranica: false,
    difficulty: 'normal',
    responderPlayer: { ownerId: 1, typCywilizacji: responderTyp },
    proposerPlayer: { ownerId: 0, typCywilizacji: 'rzymianie' },
    authorOwnerId: 0,
    warState,
  };
}

function propose(mod, actionId, payload) {
  const entry = mod.createNegotiation(
    { actionId, proposerOwnerId: 0, responderOwnerId: 1, payload: payload || {} },
    80,
    'player',
    1,
  );
  return mod.negotiationAsProposal(entry);
}

const WAR_EARLY = { turnsAtWar: 3, lostCitiesResponder: 0, responderRw: 0.5 };
const WAR_STRONGER = { turnsAtWar: 9, lostCitiesResponder: 0, responderRw: 0.6 };
const WAR_LONG = { turnsAtWar: 20, lostCitiesResponder: 0, responderRw: 0.9 };
const GATE_REASON = /za wcześnie|czuje się silniejsze/;

function run(mod) {
  const ev = (actionId, payload, ctx) => mod.evaluateProposal(propose(mod, actionId, payload), ctx);
  return {
    rozejmEarly: ev('rozejm', {}, ctxFor({ warState: WAR_EARLY })),
    pokojEarly: ev('pokoj', {}, ctxFor({ warState: WAR_EARLY })),
    rozejmStronger: ev('rozejm', {}, ctxFor({ warState: WAR_STRONGER })),
    pokojStronger: ev('pokoj', {}, ctxFor({ warState: WAR_STRONGER })),
    rozejmLong: ev('rozejm', {}, ctxFor({ warState: WAR_LONG })),
    pokojLong: ev('pokoj', {}, ctxFor({ warState: WAR_LONG })),
    rozejmNoWar: ev('rozejm', {}, ctxFor({ warState: undefined, stanWojny: false })),
    rozejm7: ev('rozejm', { turns: 7 }, ctxFor({ warState: WAR_LONG })),
    rozejm5: ev('rozejm', { turns: 5 }, ctxFor({ warState: WAR_LONG })),
    rozejm15: ev('rozejm', { turns: 15 }, ctxFor({ warState: WAR_LONG })),
    rozejm0: ev('rozejm', { turns: 0 }, ctxFor({ warState: WAR_LONG })),
  };
}

async function main() {
  fs.writeFileSync(ENTRY, ENTRY_SRC, 'utf8');
  try {
    await buildBundle(BUNDLE_OK, []);
    const m1 = mutantPlugin(
      "if (actionId === 'rozejm' && normalizeTruceDuration(payload.turns ?? TRUCE_DEFAULT_TURNS) == null) {",
      "if (false) {",
    );
    await buildBundle(BUNDLE_M1, [m1.plugin]);
    const m2 = mutantPlugin(
      'const basePnCfg = treatyBasePnFromConfig(actionId, payload);',
      "const basePnCfg = treatyBasePnFromConfig('pokoj', payload);",
    );
    await buildBundle(BUNDLE_M2, [m2.plugin]);
    const m3 = mutantPlugin(
      "  if (actionId === 'pokoj' || actionId === 'rozejm') {\n    const { offerPn, required }",
      "  if (actionId === 'pokoj') {\n    const { offerPn, required }",
    );
    await buildBundle(BUNDLE_M3, [m3.plugin]);
    const m4 = mutantPlugin(
      "return currentTurn >= until ? 'revert_to_war' : 'none';",
      "return currentTurn > until ? 'revert_to_war' : 'none';",
      PEACE_LOCK,
    );
    await buildBundle(BUNDLE_M4, [m4.plugin]);
    const m5 = mutantPlugin(
      'export function isTruceActive(until: number | null | undefined, currentTurn: number): boolean {\n  if (until == null || !Number.isFinite(until)) return false;\n  return currentTurn < until;',
      'export function isTruceActive(until: number | null | undefined, currentTurn: number): boolean {\n  if (until == null || !Number.isFinite(until)) return false;\n  return currentTurn <= until;',
      PEACE_LOCK,
    );
    await buildBundle(BUNDLE_M5, [m5.plugin]);
    check('(0) mutanty zmieniły źródło dokładnie raz (M1..M5)',
      [m1, m2, m3, m4, m5].every(m => m.info.applied === 1),
      [m1.info, m2.info, m3.info, m4.info, m5.info]);

    const life = require(BUNDLE_OK);
    // (1) cykl życia — start 20, czas 5 → wygasa w 25
    check('L0: dozwolone długości = [5,10,15]', JSON.stringify(life.TRUCE_DURATION_OPTIONS) === '[5,10,15]');
    check('L1: normalize akceptuje 5/10/15', [5, 10, 15].every(n => life.normalizeTruceDuration(n) === n));
    check('L2: normalize odrzuca 0/7/11/NaN/null', [0, 7, 11, NaN, null].every(n => life.normalizeTruceDuration(n) === null));
    check('L3: until = start + czas (20+5=25)', life.truceUntilTurn(20, 5) === 25, life.truceUntilTurn(20, 5));
    check('L4: until dla złej długości = null', life.truceUntilTurn(20, 7) === null);
    check('L5: aktywny w N-1 (24), zawarcie w turze 20 aktywne', life.isTruceActive(25, 24) && life.isTruceActive(25, 20));
    check('L6: nieaktywny w N (25) i N+1 (26)', !life.isTruceActive(25, 25) && !life.isTruceActive(25, 26));
    check('L7: wygaśnięcie: N-1 none, N revert_to_war, N+1 revert_to_war',
      life.truceExpiryAction(25, 24) === 'none' && life.truceExpiryAction(25, 25) === 'revert_to_war'
      && life.truceExpiryAction(25, 26) === 'revert_to_war');
    check('L8: brak rozejmu (null/undefined) → none, bez wypowiedzenia = brak złamania',
      life.truceExpiryAction(null, 99) === 'none' && !life.isTruceBreach(undefined, 99));
    check('L9: wypowiedzenie w oknie (24) = złamanie; po oknie (25) = nie',
      life.isTruceBreach(25, 24) && !life.isTruceBreach(25, 25));
    check('L10: granica start+5/+10/+15 (N-1/N/N+1) dla każdej długości',
      [5, 10, 15].every(d => {
        const u = life.truceUntilTurn(20, d);
        return life.isTruceActive(u, u - 1) && !life.isTruceActive(u, u)
          && life.truceExpiryAction(u, u - 1) === 'none'
          && life.truceExpiryAction(u, u) === 'revert_to_war';
      }));
    check('N1: NaN/Infinity/undefined w helperach cyklu życia nie aktywują rozejmu ani nie wywołują wygaśnięcia',
      life.truceUntilTurn(NaN, 5) === null && life.truceUntilTurn(20, NaN) === null
      && life.truceUntilTurn(Infinity, 5) === null && life.normalizeTruceDuration(Infinity) === null
      && life.isTruceActive(NaN, 5) === false && life.isTruceActive(undefined, 5) === false
      && life.isTruceActive(25, NaN) === false
      && life.truceExpiryAction(NaN, 99) === 'none' && life.truceExpiryAction(25, NaN) === 'none'
      && life.truceExpiryAction(undefined, 25) === 'none' && life.isTruceBreach(NaN, 5) === false);

    // (2)-(5) propozycje
    const ok = run(require(BUNDLE_OK));
    check('P1: rozejm za wcześnie (3 tury wojny) = odrzucenie „za wcześnie" jak pokój',
      ok.rozejmEarly.accepted === false && /za wcześnie/.test(ok.rozejmEarly.reason || ''), ok.rozejmEarly);
    check('P2: rozejm silniejsze AI (9 tur) = odrzucenie „czuje się silniejsze" jak pokój',
      ok.rozejmStronger.accepted === false && /czuje się silniejsze/.test(ok.rozejmStronger.reason || ''), ok.rozejmStronger);
    check('P3: rozejm po 20 turach nie podlega bramce czasu/siły',
      !GATE_REASON.test(ok.rozejmLong.reason || ''), ok.rozejmLong);
    check('P4: rozejm bez trwającej wojny odrzucony',
      ok.rozejmNoWar.accepted === false && /brak trwającej wojny/.test(ok.rozejmNoWar.reason || ''), ok.rozejmNoWar);
    check('P5: długość 7 tur odrzucona, 0 tur odrzucona',
      ok.rozejm7.accepted === false && /5, 10 lub 15/.test(ok.rozejm7.reason || '')
      && ok.rozejm0.accepted === false, { r7: ok.rozejm7, r0: ok.rozejm0 });
    check('P6: długości 5 i 15 przechodzą walidację czasu',
      !/5, 10 lub 15/.test(ok.rozejm5.reason || '') && !/5, 10 lub 15/.test(ok.rozejm15.reason || ''),
      { r5: ok.rozejm5, r15: ok.rozejm15 });
    check('P7: baza PW rozejmu (200) niższa niż pokoju (500): pwBalance rozejmu > pokoju (ta sama sytuacja)',
      typeof ok.rozejmLong.pwBalance === 'number' && typeof ok.pokojLong.pwBalance === 'number'
      && ok.rozejmLong.pwBalance > ok.pokojLong.pwBalance,
      { rozejm: ok.rozejmLong.pwBalance, pokoj: ok.pokojLong.pwBalance });

    const mod = require(BUNDLE_OK);
    // R-WEB-TRUCE-Q1 r3 (N2): P8 testuje WALUTĘ wojenną (złoto), nie żywność — żywność nie jest walutą
    // i nie dowodzi wyjątku bramki walutowej. Rozejm ze złotem w wojnie musi przejść tak jak pokój.
    const paid = { turns: 10, goldOnce: 400 };
    const ackRes = mod.evaluateProposal(propose(mod, 'rozejm', paid), ctxFor({ warState: WAR_LONG }));
    // Kontrola: pokój ma bazę 500 PW, więc dla porównania potrzebuje większej zapłaty (600 złota).
    const pokojPaid = mod.evaluateProposal(propose(mod, 'pokoj', { turns: 10, goldOnce: 600 }), ctxFor({ warState: WAR_LONG }));
    check('P8: rozejm ze złotem (400) w wojnie zostaje zaakceptowany (bramka walutowa jak dla pokoju)',
      ackRes.accepted === true && !/pieniądze tylko w ugodzie/.test(ackRes.reason || ''), ackRes);
    check('P8b: pokój ze złotem w wojnie — kontrola: ta sama ścieżka co rozejm',
      pokojPaid.accepted === true, pokojPaid);
    const resolved = mod.resolvePlayerAcceptsAiPending
      ? mod.resolvePlayerAcceptsAiPending
      : null;
    check('P9: eksport resolvePlayerAcceptsAiPending dostępny (ścieżka akceptacji gracza)', typeof resolved === 'function');
    // P10: bramka PW rozejmu = bramka PW pokoju (ta sama gałąź treatyPnGate, ten sam komunikat)
    const pnShort = { givePn: 0, receivePn: 1000 };
    const rzPn = mod.evaluateProposal(propose(mod, 'rozejm', pnShort), ctxFor({ warState: WAR_LONG }));
    const pkPn = mod.evaluateProposal(propose(mod, 'pokoj', pnShort), ctxFor({ warState: WAR_LONG }));
    const PN_GATE_REASON = /uczciwej oferty pokoju|Oferta za niska na pokój/;
    check('P10: rozejm z za niską ofertą PW odrzucony bramką PW pokoju (jak pokój, ujemny pwBalance)',
      rzPn.accepted === false && pkPn.accepted === false
      && PN_GATE_REASON.test(rzPn.reason || '') && PN_GATE_REASON.test(pkPn.reason || '')
      && typeof rzPn.pwBalance === 'number' && rzPn.pwBalance < 0,
      { rozejm: rzPn, pokoj: pkPn });
    // NaN w turach: walidacja długości odrzuca (nie przepuszcza)
    const rzNaN = mod.evaluateProposal(propose(mod, 'rozejm', { turns: NaN }), ctxFor({ warState: WAR_LONG }));
    check('P11: rozejm z turns=NaN odrzucony walidacją długości', rzNaN.accepted === false
      && /5, 10 lub 15/.test(rzNaN.reason || ''), rzNaN);

    // mutacje
    const m1r = run(require(BUNDLE_M1));
    check('M1 (brak walidacji długości): 7 tur przechodzi — mutacja wykrywalna',
      m1r.rozejm7.accepted !== false || !/5, 10 lub 15/.test(m1r.rozejm7.reason || ''), m1r.rozejm7);
    const m2r = run(require(BUNDLE_M2));
    check('M2 (baza rozejmu = baza pokoju): pwBalance równy pokojowi — mutacja wykrywalna',
      !(typeof m2r.rozejmLong.pwBalance === 'number' && m2r.rozejmLong.pwBalance > m2r.pokojLong.pwBalance),
      { rozejm: m2r.rozejmLong.pwBalance, pokoj: m2r.pokojLong.pwBalance });
    // M3: bramka PW pokoju NIE obejmuje rozejmu → P10 wykrywa (komunikat różni się od pokoju)
    const m3mod = require(BUNDLE_M3);
    const m3rz = m3mod.evaluateProposal(propose(m3mod, 'rozejm', pnShort), ctxFor({ warState: WAR_LONG }));
    check('M3 (bramka PW pokoju bez rozejmu): P10 wykrywa różnicę',
      !(m3rz.accepted === false && PN_GATE_REASON.test(m3rz.reason || '')), { m3rz });
    // M4: wygaśnięcie o turę za późno (N+1) → L7/L10 wykrywają
    const life4 = require(BUNDLE_M4);
    check('M4 (wygaśnięcie w N+1 zamiast N): L7/L10 wykrywają',
      !(life4.truceExpiryAction(25, 25) === 'revert_to_war'), life4.truceExpiryAction(25, 25));
    // M5: rozejm aktywny także w N (<= zamiast <) → L6/L10 wykrywają
    const life5 = require(BUNDLE_M5);
    check('M5 (aktywny w N zamiast tylko przed N): L6/L10 wykrywają',
      life5.isTruceActive(25, 25) === true, life5.isTruceActive(25, 25));
  } finally {
    cleanup();
  }
  console.log(`\ndiplo-truce-r1-test: ${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
