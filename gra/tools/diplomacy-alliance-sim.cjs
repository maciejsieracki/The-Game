'use strict';
/**
 * diplomacy-alliance-sim.cjs — sojusz v1.3: Power × Zaufanie + hegemon / wasal
 * node tools/diplomacy-alliance-sim.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-alliance-sim-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-alliance-sim-entry.ts');
fs.writeFileSync(entryFile, `
export {
  aiDiplomacyStance,
  relationScore,
  computeRespekt,
  getEffectiveDiplomacyParams,
  diplomacyAllianceStrengthAdjust,
  diplomacyAllianceMinZaufanie,
} from '../src/game/diplomacy.ts';
export {
  evaluateProposal,
} from '../src/game/diplomacy-proposals.ts';
export { decideAIDiplomacy, loadDefaultAIDiplomacyProgs } from '../src/game/ai.ts';
import { TypCywilizacji } from '../src/types/player.ts';
export { TypCywilizacji };
`);

esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  aiDiplomacyStance,
  relationScore,
  computeRespekt,
  getEffectiveDiplomacyParams,
  diplomacyAllianceStrengthAdjust,
  diplomacyAllianceMinZaufanie,
  evaluateProposal,
  decideAIDiplomacy: decideAIDiplomacyAi,
  TypCywilizacji,
} = require(BUNDLE);

const p = getEffectiveDiplomacyParams();

function stub(typ) { return { typCywilizacji: typ }; }

/** Gracz proponuje sojusz AI. */
function playerProposesAlliance(zaufanie, playerPower, aiPower, aiTyp = TypCywilizacji.Grecy) {
  const respekt = computeRespekt(aiPower, playerPower);
  const proposerRespekt = computeRespekt(playerPower, aiPower);
  const relation = { zaufanie, respekt, status: 'pokoj' };
  const score = relationScore(relation);
  const militaryRatio = playerPower / Math.max(1, aiPower);
  const adj = diplomacyAllianceStrengthAdjust(militaryRatio, proposerRespekt, respekt, p);

  const stance = aiDiplomacyStance(
    stub(aiTyp),
    stub(TypCywilizacji.Rzymianie),
    relation,
    {
      isMinorCiv: false,
      militaryRatio: militaryRatio > 0 ? 1 / militaryRatio : 99,
      currentTurn: 40,
      turnsAtWar: 0,
    },
  );

  const result = evaluateProposal(
    { actionId: 'sojusz_pelny', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
    {
      relation,
      stanWojny: false,
      turn: 40,
      proposerRespekt,
      responderRespekt: respekt,
      militaryRatio,
      proposerPlayer: stub(TypCywilizacji.Rzymianie),
      responderPlayer: stub(aiTyp),
    },
  );

  const minZ = diplomacyAllianceMinZaufanie(adj, militaryRatio, p);

  return {
    respekt,
    score,
    militaryRatio,
    minZ,
    allyW: stance.willingnessAlly,
    hegemon: adj.hegemonBlocksAlliance,
    accepted: result.accepted,
    reason: result.reason,
  };
}

/** AI (silniejsze) proponuje trybut/wasal graczowi. */
function aiDemandsTribute(zaufanie, playerPower, aiPower) {
  const respekt = computeRespekt(aiPower, playerPower);
  const proposerRespekt = computeRespekt(aiPower, playerPower);
  const relation = { zaufanie, respekt, status: 'pokoj' };
  const result = evaluateProposal(
    { actionId: 'trybut_zadanie', proposerOwnerId: 1, responderOwnerId: 0, payload: { goldPerTurn: 15 } },
    {
      relation,
      stanWojny: false,
      turn: 40,
      proposerRespekt,
      responderRespekt: computeRespekt(playerPower, aiPower),
      militaryRatio: aiPower / Math.max(1, playerPower),
    },
  );
  return { accepted: result.accepted, reason: result.reason };
}

/** AI proponuje sojusz graczowi. */
function aiProposesAlliance(zaufanie, playerPower, aiPower, aiTyp = TypCywilizacji.Chinczycy) {
  const respekt = computeRespekt(aiPower, playerPower);
  const relation = { zaufanie, respekt, status: 'pokoj' };
  const score = relationScore(relation);
  const rw = aiPower / (aiPower + playerPower);

  const stance = aiDiplomacyStance(
    stub(aiTyp),
    stub(TypCywilizacji.Rzymianie),
    relation,
    {
      isMinorCiv: false,
      militaryRatio: aiPower / Math.max(1, playerPower),
      currentTurn: 40,
      turnsAtWar: 0,
    },
  );

  const cmds = decideAIDiplomacyAi({
    myPlayerId: 'ai-1',
    agresja: 0.35,
    handlowosc: 0.6,
    relacje: [{
      partnerId: 'gracz',
      relation,
      respektWzgledny: rw,
      stanWojny: false,
    }],
  });

  const sojusz = cmds.find(c => c.type === 'zaproponuj_sojusz');
  const trybut = cmds.find(c => c.type === 'zaproponuj_trybut');
  const aiMilRatio = aiPower / Math.max(1, playerPower);
  const adj = diplomacyAllianceStrengthAdjust(
    aiMilRatio,
    Math.round(rw * 100),
    Math.round((1 - rw) * 100),
    p,
  );

  return {
    score,
    rw,
    allyW: stance.willingnessAlly,
    hegemon: adj.hegemonBlocksAlliance,
    aiOffersSojusz: !!sojusz,
    aiOffersTrybut: !!trybut,
  };
}

function mark(ok) { return ok ? '✅ TAK' : '❌ NIE'; }

console.log('=== SOJUSZ v1.3 — Power × Zaufanie (gracz → AI) ===\n');
console.log('Progi bazowe Panel-D:');
console.log(`  Zaufanie ≥ ${p.progSojuszZaufanie}  |  Relacja ≥ ${p.progSojuszRelacja}  |  allyW ≥ ${p.progSojuszWillingnessMin}`);
console.log(`  Hegemon: proponent/respondent ≤ ${p.progSojuszHegemonMilRatio} (~AI ${(1 / p.progSojuszHegemonMilRatio).toFixed(1)}× silniejsze) → brak sojuszu`);
console.log(`  2× gracz: min Zauf ≥ ${p.progSojuszPremiaGracz2xMinZaufanie}  |  3× gracz: min Zauf ≥ ${p.progSojuszPremiaGracz3xMinZaufanie}`);

const trustLevels = [100, 91, 85, 83, 82, 75, 50, 25];

const powerPairs = [
  { label: 'Gracz 3×', pl: 3000, ai: 1000 },
  { label: 'Gracz 2×', pl: 2000, ai: 1000 },
  { label: 'Gracz 1,5×', pl: 1500, ai: 1000 },
  { label: 'Równowaga', pl: 1500, ai: 1500 },
  { label: 'AI 1,5×', pl: 1000, ai: 1500 },
  { label: 'AI 2×', pl: 1000, ai: 2000 },
  { label: 'AI 3×', pl: 1000, ai: 3000 },
];

console.log('--- SIATKA GŁÓWNA: Zaufanie × Power (gracz proponuje sojusz pełny) ---\n');
process.stdout.write('| Zauf \\ Power |');
for (const pw of powerPairs) process.stdout.write(` ${pw.label.padEnd(10)} |`);
console.log('');
process.stdout.write('|' + '-------------|'.repeat(powerPairs.length + 1));
console.log('');

const gridDetail = [];
for (const z of trustLevels) {
  process.stdout.write(`| ${String(z).padStart(3)}        |`);
  for (const pw of powerPairs) {
    const r = playerProposesAlliance(z, pw.pl, pw.ai);
    gridDetail.push({ z, pw, r });
    const cell = r.hegemon ? ' 🚫 HEG' : (r.accepted ? ' ✅ ' : ' ❌ ');
    process.stdout.write(`${cell}       |`);
  }
  console.log('');
}

console.log('\n--- Szczegóły siatki (min Zauf · allyW · powód) ---\n');
for (const { z, pw, r } of gridDetail) {
  if (r.accepted || r.hegemon || z >= 50) {
    console.log(
      `  Z=${z} ${pw.label.padEnd(12)} P:A=${pw.pl}:${pw.ai} | minZ=${r.minZ} allyW=${r.allyW.toFixed(2)} | ${mark(r.accepted)} ${r.hegemon ? '[HEGEMON]' : ''} ${!r.accepted ? r.reason : ''}`,
    );
  }
}

console.log('\n--- Hegemon: AI silne → trybut zamiast sojuszu (AI→gracz) ---\n');
console.log('| Power | Zauf | AI proponuje sojusz | AI proponuje trybut | Gracz→AI sojusz |');
console.log('|-------|------|---------------------|---------------------|-----------------|');
for (const pw of [
  { label: 'AI 2×', pl: 1000, ai: 2000 },
  { label: 'AI 3×', pl: 1000, ai: 3000 },
]) {
  for (const z of trustLevels) {
    const ai = aiProposesAlliance(z, pw.pl, pw.ai);
    const pl = playerProposesAlliance(z, pw.pl, pw.ai);
    const trib = aiDemandsTribute(z, pw.pl, pw.ai);
    console.log(
      `| ${pw.label} | ${z} | ${mark(ai.aiOffersSojusz)} ${ai.hegemon ? '(heg)' : ''} | ${mark(ai.aiOffersTrybut || trib.accepted)} | ${mark(pl.accepted)} ${pl.hegemon ? 'HEG' : ''} |`,
    );
  }
}

console.log('\n--- Równowaga 1:1 — Zaufanie 100→25 ---\n');
for (const z of trustLevels) {
  const r = playerProposesAlliance(z, 1500, 1500);
  console.log(`  Zauf ${z} → ${mark(r.accepted)}  (score=${r.score}, minZ=${r.minZ}, allyW=${r.allyW.toFixed(2)})`);
}

console.log('\nLegenda: 🚫 HEG = strefa hegmona (sojusz zablokowany niezależnie od zaufania)\n');
