'use strict';
/**
 * diplo-truce-n6-saveload-test.cjs — R-WEB-TRUCE-Q1 (runda 4, N6): zapis/odczyt stanu rozejmu.
 * (a) Roundtrip przez PRAWDZIWE serializeGame/deserializeGame (src/game/save.ts) dla wpisu
 *     diplomacyPairMeta z truceUntilTurn (5/10/15) — ta sama forma, którą main.ts zapisuje
 *     (`diplomacyPairMeta: Array.from(diplomacyPairMeta.entries())`, main.ts ~32979).
 * (b) Stary zapis bez truceUntilTurn wczytuje się bez crasha i bez rozejmu (undefined).
 * (c) Asercje na miejsca w main.ts: zapis (snapshot), odczyt (clear + set przy wczytaniu) oraz
 *     reset nowej gry (clear wewnątrz applyClusterStartPlan).
 * Run: node tools/diplo-truce-n6-saveload-test.cjs
 */
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SAVE_SRC = path.resolve(GRA, 'src', 'game', 'save.ts');
const MAIN_SRC = path.resolve(GRA, 'src', 'main.ts');
const BUNDLE = path.resolve(__dirname, '.dip-truce-n6-save-bundle.cjs');

let pass = 0;
let fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log('PASS: ' + name); }
  catch (e) { fail++; console.log('FAIL: ' + name + ' — ' + (e && e.message ? e.message.split('\n')[0] : e)); }
}

async function main() {
  await esbuild.build({
    entryPoints: [SAVE_SRC], bundle: true, platform: 'node', format: 'cjs',
    outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  });
  const { serializeGame, deserializeGame } = require(BUNDLE);
  const makeSave = meta => ({
    wersja: 3, tura: 12, seed: 7, units: [], cities: [], exploredByHuman: [],
    gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0, meta,
  });
  const keyA = '0|1';
  const keyB = '0|2';

  for (const turns of [5, 10, 15]) {
    check(`roundtrip truceUntilTurn dla rozejmu ${turns} tur`, () => {
      const pairs = [[keyA, { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0, truceUntilTurn: 12 + turns }]];
      const back = deserializeGame(serializeGame(makeSave({ diplomacyPairMeta: pairs })));
      const got = new Map(back.meta.diplomacyPairMeta);
      assert.equal(got.get(keyA).truceUntilTurn, 12 + turns, 'truceUntilTurn przeżywa zapis i odczyt');
      assert.equal(got.get(keyA).peaceUntilTurn, undefined, 'rozejm nie zakłada peaceUntilTurn');
    });
  }

  check('roundtrip: rozejm obok pokoju w tej samej zapisanej mapie zachowuje obie pary', () => {
    const pairs = [
      [keyA, { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0, truceUntilTurn: 20 }],
      [keyB, { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0, peaceUntilTurn: 30 }],
    ];
    const back = deserializeGame(serializeGame(makeSave({ diplomacyPairMeta: pairs })));
    const got = new Map(back.meta.diplomacyPairMeta);
    assert.equal(got.get(keyA).truceUntilTurn, 20);
    assert.equal(got.get(keyA).peaceUntilTurn, undefined);
    assert.equal(got.get(keyB).peaceUntilTurn, 30);
    assert.equal(got.get(keyB).truceUntilTurn, undefined);
  });

  check('stary zapis bez truceUntilTurn wczytuje się jako brak rozejmu (bez crasha)', () => {
    const legacy = [[keyA, { trustPnGainedThisTurn: 1, dobraWolaRemainingTur: 0 }]];
    const back = deserializeGame(serializeGame(makeSave({ diplomacyPairMeta: legacy })));
    const got = new Map(back.meta.diplomacyPairMeta);
    assert.equal(got.get(keyA).truceUntilTurn, undefined);
  });

  const main = fs.readFileSync(MAIN_SRC, 'utf8');

  check('zapis: snapshot zapisuje diplomacyPairMeta wraz z polami meta (main.ts)', () => {
    assert.match(main, /diplomacyPairMeta: Array\.from\(diplomacyPairMeta\.entries\(\)\)/);
  });

  check('odczyt: wczytanie czyści i odtwarza diplomacyPairMeta (main.ts ~42263)', () => {
    assert.match(main, /diplomacyPairMeta\.clear\(\);\s*\n\s*const savedPairMeta = saved\.meta\?\.diplomacyPairMeta[\s\S]*?diplomacyPairMeta\.set\(key, meta\)/);
  });

  check('reset nowej gry: applyClusterStartPlan czyści diplomacyPairMeta (main.ts ~9714)', () => {
    const start = main.indexOf('function applyClusterStartPlan(');
    assert.ok(start >= 0, 'applyClusterStartPlan istnieje');
    const seg = main.slice(start, start + 20000);
    assert.match(seg, /diplomacyPairMeta\.clear\(\)/, 'reset nowej gry czyści pary (w tym truceUntilTurn)');
  });

  console.log(`\n${pass} pass / ${fail} fail`);
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
