'use strict';
/**
 * diplo-truce-impl-test.cjs — R-WEB-DIPLO-TRUCE-IMPL-Q1 (runda 3): luki rozejmu wg ABC 2026-11-09.
 * (B) po wygaśnięciu rozejmu propozycja pokoju do drugiej strony: zgoda = pokój, odmowa/timeout = wojna;
 * (C) rozejm daje 0 Zaufania (pokój stały +5 bez zmian);
 * (E) AI wybiera tryb (rozejm vs pokój stały) wg pozycji, zmęczenia wojną i Zaufania;
 * (G) kontroferta na rozejm otwiera się z trybem „rozejm” i długością (5/10/15).
 * Część 1: czyste helpery (esbuild bundle diplomacy-peace-lock.ts + applyDiplomaticEvent).
 * Część 2: wiring w main.ts / ai.ts (sprawdzenie źródła — pełny przepływ silnika NIE jest uruchamiany
 *          tutaj; main.ts to bundel ~46k linii; runtime = NIE_ZMIERZONO w raporcie operatora).
 * Mutanty: (M1) truceEndAiAccepts zawsze true, (M2) aiTruceOrPeaceMode ignoruje zmęczenie.
 * Run: node tools/diplo-truce-impl-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const LOCK = path.resolve(GRA, 'src', 'game', 'diplomacy-peace-lock.ts');
const MAIN = path.resolve(GRA, 'src', 'main.ts');
const AI = path.resolve(GRA, 'src', 'game', 'ai.ts');
const ENTRY = path.resolve(GRA, 'src', '.dip-truce-impl-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-truce-impl.cjs');
const BUNDLE_M1 = path.resolve(__dirname, '.dip-truce-impl-m1.cjs');
const BUNDLE_M2 = path.resolve(__dirname, '.dip-truce-impl-m2.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const ENTRY_SRC = [
  'export {',
  '  truceEndAiAccepts, truceEndOfferTarget, truceEndOfferExpired, aiTruceOrPeaceMode,',
  '  TRUCE_AI_FATIGUE_PEACE_MIN, TRUCE_AI_TRUST_PEACE_MIN, TRUCE_END_AI_ACCEPT_TRUST_MIN,',
  '  normalizeTruceDuration, truceUntilTurn, truceExpiryAction,',
  '} from \'./game/diplomacy-peace-lock\';',
  'export { applyDiplomaticEvent } from \'./game/diplomacy\';',
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

(async () => {
  const lib = await buildBundle(BUNDLE);

  // ---- Część 1a: (B) adresat propozycji pokoju po rozejmie ----
  check('B: inicjator=a → adresat=b', lib.truceEndOfferTarget(3, 3, 7) === 7);
  check('B: inicjator=b → adresat=a', lib.truceEndOfferTarget(7, 3, 7) === 3);
  check('B: brak inicjatora → null (stara wojna)', lib.truceEndOfferTarget(undefined, 3, 7) === null);
  check('B: inicjator spoza pary → null', lib.truceEndOfferTarget(9, 3, 7) === null);

  // ---- B: zgoda AI-adresata wg Zaufania ----
  check('B: AI przyjmuje przy progu Zaufania', lib.truceEndAiAccepts(lib.TRUCE_END_AI_ACCEPT_TRUST_MIN) === true);
  check('B: AI odmawia poniżej progu Zaufania', lib.truceEndAiAccepts(lib.TRUCE_END_AI_ACCEPT_TRUST_MIN - 1) === false);
  check('B: AI odmawia przy NaN', lib.truceEndAiAccepts(NaN) === false);

  // ---- B: timeout (kolejna tura bez odpowiedzi) ----
  check('B: oferta w turze T nie wygasa w T', lib.truceEndOfferExpired(10, 10) === false);
  check('B: oferta wygasa w T+1 (timeout = wojna)', lib.truceEndOfferExpired(10, 11) === true);

  // ---- Część 1b: (E) tryb AI ----
  check('E: duże zmęczenie → pokój stały',
    lib.aiTruceOrPeaceMode({ fatigueShare: lib.TRUCE_AI_FATIGUE_PEACE_MIN, zaufanie: 0, weaker: true, fallbackKind: 'rozejm' }) === 'pokoj');
  check('E: wysokie Zaufanie → pokój stały',
    lib.aiTruceOrPeaceMode({ fatigueShare: 0.1, zaufanie: lib.TRUCE_AI_TRUST_PEACE_MIN, weaker: true, fallbackKind: 'rozejm' }) === 'pokoj');
  check('E: słabsza + małe zmęczenie + niskie zaufanie → rozejm',
    lib.aiTruceOrPeaceMode({ fatigueShare: 0.05, zaufanie: 20, weaker: true, fallbackKind: 'pokoj' }) === 'rozejm');
  check('E: brak sygnału → fallback (po turach wojny)',
    lib.aiTruceOrPeaceMode({ fatigueShare: 0.05, zaufanie: 20, weaker: false, fallbackKind: 'pokoj' }) === 'pokoj'
    && lib.aiTruceOrPeaceMode({ fatigueShare: 0.05, zaufanie: 20, weaker: false, fallbackKind: 'rozejm' }) === 'rozejm');

  // ---- Część 1c: (C) rozejm = 0 Zaufania; pokój stały = +5 (applyDiplomaticEvent bez zmian) ----
  const base = { zaufanie: 40, respekt: 40, status: 'wojna' };
  const peaceNow = lib.applyDiplomaticEvent(base, 'pokoj');
  check('C: pokój stały (applyDiplomaticEvent pokoj) daje +5 Zaufania', peaceNow.zaufanie === 45, peaceNow);
  check('C: pokój ustawia status pokoj', peaceNow.status === 'pokoj', peaceNow);

  // ---- Część 1d: regresja cyklu życia rozejmu (sprzed R3) ----
  check('regresja: długość 5/10/15 akceptowana', [5, 10, 15].every(t => lib.normalizeTruceDuration(t) === t));
  check('regresja: długość 7 odrzucona', lib.normalizeTruceDuration(7) === null);
  check('regresja: truceUntilTurn = start + N', lib.truceUntilTurn(100, 10) === 110);
  check('regresja: wygaśnięcie dokładnie w until', lib.truceExpiryAction(110, 110) === 'revert_to_war'
    && lib.truceExpiryAction(110, 109) === 'none');

  // ---- Część 2: wiring (źródło) ----
  const mainSrc = src(MAIN);
  const aiSrc = src(AI);
  const lockSrc = src(LOCK);

  // (C) gałąź rozejmu w finalizePeaceTreatyBetween NIE wywołuje 'pokoj' na Zaufaniu
  const finStart = mainSrc.indexOf('function finalizePeaceTreatyBetween(');
  const finBody = finStart >= 0 ? mainSrc.slice(finStart, finStart + 5000) : '';
  check('C: finalize — gałąź rozejmu ustawia tylko status (bez applyDiploEventTracked)',
    /truceTurns != null\)\s*\{[\s\S]{0,400}?setDiploRelation\(proposerId, responderId, \{ \.\.\.cur, status: 'pokoj' \}\);/.test(finBody), 'brak wzorca');
  check('C: finalize — applyDiploEventTracked(…,\'pokoj\') tylko w gałęzi pokoju stałego',
    /\} else \{\s*setDiploRelation\(\s*proposerId,\s*responderId,\s*applyDiploEventTracked\(proposerId, responderId, cur, 'pokoj'\)/.test(finBody));

  // (B) tick: oferta zamiast cofnięcia do wojny
  check('B: tickTruceExpiries tworzy truceEndOffer dla gracza',
    /truceEndOffer: \{ turn, fromOwnerId: initiator, toOwnerId: target \}/.test(mainSrc));
  check('B: tickTruceExpiries — AI-adresat: zgoda → finalizePeaceTreatyBetween',
    /truceEndAiAccepts\(cur\.zaufanie\)\)\s*\{[\s\S]{0,300}?finalizePeaceTreatyBetween\(initiator, target\)/.test(mainSrc));
  check('B: odmowa gracza w resolvePendingDiplomacy → truceEndToWar',
    /zaproponuj_pokoj' && getDiploPairMeta\(ME\(\), p\.ownerId\)\.truceEndOffer != null\)\s*\{\s*truceEndToWar\(ME\(\), p\.ownerId\)/.test(mainSrc));
  check('B: wojna wypowiedziana kasuje ofertę (chargeWarDeclarationCredibility)',
    /clearTruceEndOffer\(declarerId, targetId\);/.test(mainSrc));
  check('B: DiploPairMeta ma pola truceInitiatorId / truceEndOffer',
    /truceInitiatorId\?: number/.test(src(path.resolve(GRA, 'src', 'game', 'diplomacy-pn-engine.ts')))
    && /truceEndOffer\?:/.test(src(path.resolve(GRA, 'src', 'game', 'diplomacy-pn-engine.ts'))));

  // (E) AI wybiera tryb w decideAIDiplomacy
  check('E: ai.ts używa aiTruceOrPeaceMode przy zaproponuj_pokoj',
    /rodzaj:\s+peaceKindAi,/.test(aiSrc) && /aiTruceOrPeaceMode\(\{/.test(aiSrc)
    && /warWearinessShare\(turnsAtWarRel, warProfile\.zmeczenieT\)/.test(aiSrc));

  // (G) kontroferta na rozejm
  check('G: counterInitial dla akcji 10 niesie peaceKind/truceTurns',
    /uiActionId === '10' && entry\.actionId === 'rozejm'[\s\S]{0,120}truceTurns: p\.turns/.test(mainSrc));

  // stałe z lock
  check('stała: TRUCE_AI_FATIGUE_PEACE_MIN w module lock', /TRUCE_AI_FATIGUE_PEACE_MIN = 0\.5/.test(lockSrc));

  // ---- Mutanty (wykrywalność testów) ----
  const m1 = mutantPlugin(LOCK, 'return Number.isFinite(zaufanie) && zaufanie >= TRUCE_END_AI_ACCEPT_TRUST_MIN;', 'return true;');
  const libM1 = await buildBundle(BUNDLE_M1, [m1.plugin]);
  check('M1 (zgoda AI zawsze) zastosowany', m1.info.applied === 1, m1.info);
  check('M1 wykryty: AI odmawia przy niskim Zaufaniu w czystej wersji, zgadza się w mutancie',
    lib.truceEndAiAccepts(0) === false && libM1.truceEndAiAccepts(0) === true);

  const m2 = mutantPlugin(LOCK, 'if (input.fatigueShare >= TRUCE_AI_FATIGUE_PEACE_MIN) return \'pokoj\';', '');
  const libM2 = await buildBundle(BUNDLE_M2, [m2.plugin]);
  check('M2 (ignoruje zmęczenie) zastosowany', m2.info.applied === 1, m2.info);
  check('M2 wykryty: duże zmęczenie daje pokój w czystej wersji, rozejm w mutancie',
    lib.aiTruceOrPeaceMode({ fatigueShare: 0.9, zaufanie: 0, weaker: true, fallbackKind: 'rozejm' }) === 'pokoj'
    && libM2.aiTruceOrPeaceMode({ fatigueShare: 0.9, zaufanie: 0, weaker: true, fallbackKind: 'rozejm' }) === 'rozejm');

  for (const f of [BUNDLE, BUNDLE_M1, BUNDLE_M2]) {
    try { fs.unlinkSync(f); } catch (_) { /* ignore */ }
  }

  console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('BLAD:', e);
  process.exit(2);
});
