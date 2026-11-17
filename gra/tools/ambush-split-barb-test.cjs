'use strict';
/**
 * R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (r5, zarzuty 1-3 Evaluatora) -- test DYNAMICZNY dwoch jader z game/ambushMove.ts:
 *  - planSplitAgainstHiddenAmbush: rozdzielenie armii na heks z UKRYTA zasadzka wroga = wejscie w zasadzke
 *    (zamiast komunikatu „Heks zajety”, ktory ujawnialby zasadzke);
 *  - planBarbarianStep: pelna trasa barbarzyncy liczona TYLKO przy zasadzce na planszy i uzywana do przyciecia trasy.
 * Bundlowany jest prawdziwy ambushMove.ts (esbuild), asercje dzialaja na wynikach funkcji, nie na tekscie zrodla.
 * Mutacje podmieniaja fragment ambushMove.ts w pamieci (plugin esbuild); KAZDA MUSI dac FAIL.
 * Wiring main.ts (jedno wolanie kazdej funkcji, brak starej petli) sprawdza ambush-wiring-test.cjs.
 * Uruchomienie: node gra/tools/ambush-split-barb-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const AMBUSH_MOVE = path.join(GRA, 'src', 'game', 'ambushMove.ts');
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'ambush-split-barb-'));
const ORIGINAL = fs.readFileSync(AMBUSH_MOVE, 'utf8');

const MUTANTS = {
  S1_splitPlannerOff: {
    from: "  return hidden ? { kind: 'ambush', ambushHex: { q: destQ, r: destR } } : { kind: 'split' };",
    to: "  return { kind: 'split' };",
  },
  S2_ignoreOwnerAndWar: {
    from: 'const hidden = units.some(u => u.q === destQ && u.r === destR && isAmbushHiddenFromMover(u, moverOwnerId, isAtWar));',
    to: 'const hidden = units.some(u => u.q === destQ && u.r === destR && u.ambush === true);',
  },
  B1_neverComputeFullPath: {
    from: 'const fullPath = units.some(x => x.ambush === true) ? computeFullPath() : null;',
    to: 'const fullPath = null;',
  },
  B2_alwaysComputeFullPath: {
    from: 'const fullPath = units.some(x => x.ambush === true) ? computeFullPath() : null;',
    to: 'const fullPath = computeFullPath();',
  },
};

/** Bundluje ambushMove.ts (opcjonalnie z podmienionym zrodlem) i zwraca modul CJS. */
async function loadModule(tag, sourceOverride) {
  const out = path.join(WORK, tag + '.cjs');
  const entry = path.join(WORK, tag + '-entry.ts');
  fs.writeFileSync(entry, `export * from ${JSON.stringify(AMBUSH_MOVE)};\n`);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: out,
    logLevel: 'silent',
    plugins: sourceOverride === undefined ? [] : [{
      name: 'mutant',
      setup(build) {
        build.onLoad({ filter: /[\\/]ambushMove\.ts$/ }, () => ({ contents: sourceOverride, loader: 'ts', resolveDir: path.dirname(AMBUSH_MOVE) }));
      },
    }],
  });
  delete require.cache[out];
  return require(out);
}

const NO_WAR = () => false;
const WAR = (a, b) => a !== b;

/** Zestaw asercji na realnych funkcjach; rzuca wyjatek przy pierwszej porazce. */
function runAssertions(M) {
  // --- planSplitAgainstHiddenAmbush ---
  const enemyAmbush = [{ q: 0, r: 0, ownerId: 0, ambush: false, id: 'me' }, { q: 1, r: 0, ownerId: 1, ambush: true, id: 'amb' }];
  const hit = M.planSplitAgainstHiddenAmbush(enemyAmbush, 1, 0, 0, WAR);
  assert.equal(hit.kind, 'ambush', 'ukryta zasadzka wroga w wojnie na celu = wejscie w zasadzke');
  assert.deepEqual(hit.ambushHex, { q: 1, r: 0 });
  assert.equal(M.planSplitAgainstHiddenAmbush(enemyAmbush, 1, 0, 0, NO_WAR).kind, 'split', 'pokoj: brak wyzwolenia (zajety heks jest widoczny w panelu, nie tu)');
  assert.equal(M.planSplitAgainstHiddenAmbush(enemyAmbush, 0, 0, 0, WAR).kind, 'split', 'heks bez zasadzki wroga = zwykly podzial');
  const own = [{ q: 1, r: 0, ownerId: 0, ambush: true, id: 'own' }];
  assert.equal(M.planSplitAgainstHiddenAmbush(own, 1, 0, 0, WAR).kind, 'split', 'wlasna zasadzka nie wyzwala (ownerId == mover)');
  assert.equal(M.planSplitAgainstHiddenAmbush([{ q: 1, r: 0, ownerId: 1, ambush: false, id: 'x' }], 1, 0, 0, WAR).kind, 'split', 'zwykla jednostka wroga nie jest zasadzka');

  // --- planBarbarianStep: pelna trasa liczona tylko przy zasadzce ---
  const barb = { q: 0, r: 0, ownerId: 9 };
  const ambushOnPath = [{ q: 2, r: 0, ownerId: 1, ambush: true, id: 'a' }];
  let calls = 0;
  const fullPath = () => { calls++; return [{ q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }]; };
  const cut = M.planBarbarianStep(ambushOnPath, barb, 3, 0, fullPath, WAR);
  assert.equal(calls, 1, 'przy zasadzce na planszy pelna trasa liczona dokladnie raz');
  assert.equal(cut.toQ, 1, 'trasa przycieta PRZED zasadzka (q=2)');
  assert.equal(cut.toR, 0);
  assert.equal(cut.stays, false);
  assert.deepEqual(cut.ambushHex, { q: 2, r: 0 });

  calls = 0;
  const clear = M.planBarbarianStep([barb], barb, 3, 0, fullPath, WAR);
  assert.equal(calls, 0, 'bez zasadzki na planszy pathfinding z zasadzkami nie jest wolany');
  assert.equal(clear.toQ, 3, 'bez zasadzki cel zostaje zadany');
  assert.equal(clear.ambushHex, undefined);
}

async function run(tag, sourceOverride) {
  try {
    runAssertions(await loadModule(tag, sourceOverride));
    return null;
  } catch (e) {
    return String(e && e.message ? e.message : e).split('\n')[0];
  }
}

// 1) Oryginal musi byc zielony.
async function main() {
const base = await run('base');
assert.equal(base, null, 'oryginalny ambushMove.ts: asercje zielone: ' + base);
console.log('PASS base: planSplitAgainstHiddenAmbush + planBarbarianStep (dynamicznie)');

// 2) Kazda mutacja musi dac FAIL.
for (const [key, m] of Object.entries(MUTANTS)) {
  const occurrences = ORIGINAL.split(m.from).length - 1;
  assert.equal(occurrences, 1, `mutacja ${key}: fragment musi wystapic dokladnie raz (jest ${occurrences})`);
  const mutated = ORIGINAL.replace(m.from, m.to);
  const err = await run('mut-' + key, mutated);
  assert.notEqual(err, null, `mutacja ${key} PRZEZYLA (asercje nadal zielone)`);
  console.log(`MUTANT ${key}: FAIL (oczekiwane) -> ${err}`);
}

console.log('OK ambush-split-barb-test: base zielony, wszystkie mutanty czerwone');
}
main().catch(e => { console.error(e); process.exit(1); });
