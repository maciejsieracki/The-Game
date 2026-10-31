'use strict';
/**
 * diplo-truce-r4-ai-test.cjs — R-WEB-TRUCE-Q1 (runda 4, N4): AI proponuje ROZEJM zamiast pokoju.
 * Sprawdza prawdziwe: aiPeaceProposalKind + decideAIDiplomacy (ai.ts) oraz aiCommandToPendingProposal
 * i treatyBasePnFromConfig (diplomacy-proposals.ts).
 * Granice N-1/N/N+1 wokół AI_ROZEJM_DO_TUR (19 → rozejm, 20 → pokój, 21 → pokój).
 * Mutanty: (M1) granica `<=` zamiast `<`, (M2) gałąź rozejmu w aiCommandToPendingProposal wyłączona,
 * (M3) decyzja AI zawsze 'pokoj' (brak wiązania rodzaju w decideAIDiplomacy).
 * Run: node tools/diplo-truce-r4-ai-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-truce-r4-ai-entry.ts');
const AI_FILE = path.resolve(GRA, 'src', 'game', 'ai.ts');
const PROPOSALS = path.resolve(GRA, 'src', 'game', 'diplomacy-proposals.ts');
const BUNDLE_OK = path.resolve(__dirname, '.dip-truce-r4-ai-ok.cjs');
const BUNDLE_M1 = path.resolve(__dirname, '.dip-truce-r4-ai-m1.cjs');
const BUNDLE_M2 = path.resolve(__dirname, '.dip-truce-r4-ai-m2.cjs');
const BUNDLE_M3 = path.resolve(__dirname, '.dip-truce-r4-ai-m3.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  "export { decideAIDiplomacy, aiPeaceProposalKind, AI_ROZEJM_DO_TUR } from './game/ai';",
  "export { aiCommandToPendingProposal, treatyBasePnFromConfig } from './game/diplomacy-proposals';",
  '',
].join('\n');

function mutantPlugin(target, from, to) {
  const info = { applied: 0 };
  const filter = new RegExp(target.replace(/[.\\+*?^$()[\]{}|]/g, '\\$&') + '$');
  return {
    info,
    plugin: {
      name: 'mutant-truce-r4-ai',
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
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent', plugins,
  });
}

function cleanup() {
  for (const p of [ENTRY, BUNDLE_OK, BUNDLE_M1, BUNDLE_M2, BUNDLE_M3]) {
    try { fs.unlinkSync(p); } catch (_) { /* ok */ }
  }
}

// Słaby AI (rw 0.2) w wojnie z graczem; turnsAtWar niezależne od tury gry (test granic).
function aiTurn(mod, turnsAtWar) {
  return mod.decideAIDiplomacy({
    myPlayerId: 'ai-1',
    agresja: 0.5,
    currentTurn: 100 + turnsAtWar,
    myTypCywilizacji: 'zulusi',
    relacje: [{
      partnerId: 'gracz',
      relation: { zaufanie: 10, respekt: 20, status: 'wojna' },
      respektWzgledny: 0.2,
      stanWojny: true,
      turnsAtWar,
      lostCitiesInWar: 0,
      turnsSinceCityChange: turnsAtWar,
      armyHealthShare: 0.9,
    }],
  });
}

function pokojCmd(mod, turnsAtWar) {
  return aiTurn(mod, turnsAtWar).find(c => c.type === 'zaproponuj_pokoj');
}

async function runSuite(bundle, label, expectFailures) {
  const mod = require(bundle);
  const results = {};
  // 1. Granice helpera (N-1 / N / N+1 wokół 20 oraz zero)
  results.k0 = mod.aiPeaceProposalKind(0);
  results.k19 = mod.aiPeaceProposalKind(19);
  results.k20 = mod.aiPeaceProposalKind(20);
  results.k21 = mod.aiPeaceProposalKind(21);
  // 2. Decyzja AI w tych samych granicach
  results.c19 = pokojCmd(mod, 19);
  results.c20 = pokojCmd(mod, 20);
  results.c21 = pokojCmd(mod, 21);
  // 3. Mapowanie komendy na propozycję stołu
  results.pRozejm = mod.aiCommandToPendingProposal(
    { type: 'zaproponuj_pokoj', targetId: 'gracz', powod: 'x', rodzaj: 'rozejm' }, 1, 0, 100,
  );
  results.pPokoj = mod.aiCommandToPendingProposal(
    { type: 'zaproponuj_pokoj', targetId: 'gracz', powod: 'x', rodzaj: 'pokoj' }, 1, 0, 100,
  );
  results.pBrak = mod.aiCommandToPendingProposal(
    { type: 'zaproponuj_pokoj', targetId: 'gracz', powod: 'x' }, 1, 0, 100,
  );
  results.baseRozejm = mod.treatyBasePnFromConfig('rozejm', { turns: 10 });
  results.basePokoj = mod.treatyBasePnFromConfig('pokoj', {});

  if (expectFailures) return results;

  check(`[${label}] helper: 0 tur → rozejm`, results.k0 === 'rozejm', results.k0);
  check(`[${label}] helper: 19 tur (N-1) → rozejm`, results.k19 === 'rozejm', results.k19);
  check(`[${label}] helper: 20 tur (N) → pokój`, results.k20 === 'pokoj', results.k20);
  check(`[${label}] helper: 21 tur (N+1) → pokój`, results.k21 === 'pokoj', results.k21);
  check(`[${label}] AI 19 tur wojny → zaproponuj_pokoj z rodzaj=rozejm`,
    !!results.c19 && results.c19.rodzaj === 'rozejm', results.c19 && results.c19.rodzaj);
  check(`[${label}] AI 20 tur wojny → zaproponuj_pokoj z rodzaj=pokoj`,
    !!results.c20 && results.c20.rodzaj === 'pokoj', results.c20 && results.c20.rodzaj);
  check(`[${label}] AI 21 tur wojny → zaproponuj_pokoj z rodzaj=pokoj`,
    !!results.c21 && results.c21.rodzaj === 'pokoj', results.c21 && results.c21.rodzaj);
  check(`[${label}] propozycja rozejmu → actionId 'rozejm', payload.turns=10`,
    !!results.pRozejm && results.pRozejm.actionId === 'rozejm' && results.pRozejm.payload.turns === 10,
    results.pRozejm && { actionId: results.pRozejm.actionId, payload: results.pRozejm.payload });
  check(`[${label}] propozycja pokoju (rodzaj=pokoj) → actionId 'pokoj'`,
    !!results.pPokoj && results.pPokoj.actionId === 'pokoj', results.pPokoj && results.pPokoj.actionId);
  check(`[${label}] brak rodzaju → actionId 'pokoj' (dawne zachowanie)`,
    !!results.pBrak && results.pBrak.actionId === 'pokoj', results.pBrak && results.pBrak.actionId);
  check(`[${label}] baza PW rozejmu = 200 (≠ pokój 500)`,
    results.baseRozejm === 200 && results.basePokoj === 500,
    { rozejm: results.baseRozejm, pokoj: results.basePokoj });
  return results;
}

async function main() {
  const onlyMutants = process.argv.includes('--mutants-only');
  try {
    fs.writeFileSync(ENTRY, ENTRY_SRC, 'utf8');
    if (!onlyMutants) {
      await buildBundle(BUNDLE_OK, []);
      await runSuite(BUNDLE_OK, 'OK', false);
    }

    // Mutanty: każdy musi złamać przynajmniej jedną asercję.
    const mutants = [
      { name: 'M1 granica <= zamiast <', file: AI_FILE, out: BUNDLE_M1,
        from: 'Math.max(0, turnsAtWar) < AI_ROZEJM_DO_TUR', to: 'Math.max(0, turnsAtWar) <= AI_ROZEJM_DO_TUR' },
      { name: 'M2 gałąź rozejmu w propozycji wyłączona', file: PROPOSALS, out: BUNDLE_M2,
        from: "if (cmd.rodzaj === 'rozejm') {\n        return {", to: "if (false) {\n        return {" },
      { name: 'M3 AI zawsze pokój (brak rodzaju w decyzji)', file: AI_FILE, out: BUNDLE_M3,
        from: 'rodzaj:   aiPeaceProposalKind(turnsAtWarRel),', to: "rodzaj:   'pokoj'," },
    ];
    for (const m of mutants) {
      const { info, plugin } = mutantPlugin(m.file, m.from, m.to);
      await buildBundle(m.out, [plugin]);
      check(`mutant ${m.name}: podmiana zastosowana`, info.applied === 1, info.applied);
      const r = await runSuite(m.out, m.name, true);
      const survived = r.k19 === 'rozejm' && r.k20 === 'pokoj' && r.k21 === 'pokoj'
        && !!r.c19 && r.c19.rodzaj === 'rozejm' && !!r.c20 && r.c20.rodzaj === 'pokoj'
        && !!r.pRozejm && r.pRozejm.actionId === 'rozejm';
      check(`mutant ${m.name}: zabity (asercje padają)`, !survived);
    }
  } catch (err) {
    fail++;
    console.log('FAIL: wyjątek — ' + (err && err.stack ? err.stack : err));
  } finally {
    cleanup();
  }
  console.log(`\ndiplo-truce-r4-ai-test: ${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
