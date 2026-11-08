'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

async function main() {
  const root = path.resolve(__dirname, '..');
  const built = await esbuild.build({
    stdin: { contents: "export { serializeGame, deserializeGame } from './src/game/save.ts';", resolveDir: root, sourcefile: 'recruit-rally-save-entry.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020', write: false, logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', built.outputFiles[0].text)(mod, mod.exports);
  const { serializeGame, deserializeGame } = mod.exports;
  const snapshot = { wersja: 3, tura: 1, units: [
    { id: 'a', ownerId: 0, followGeneral: true },
    { id: 'b', ownerId: 0, followGeneral: false },
  ], cities: [], exploredByHuman: [], gracze: [], humanOwnerIds: [0], activeHumanOwnerId: 0,
    recruitFollowGeneralDefault: false };
  const loaded = deserializeGame(serializeGame(snapshot));
  assert.equal(loaded.recruitFollowGeneralDefault, false);
  assert.deepEqual(loaded.units.map(unit => unit.followGeneral), [true, false]);
  const legacy = deserializeGame(JSON.stringify({ ...snapshot, recruitFollowGeneralDefault: undefined,
    units: [{ id: 'legacy', ownerId: 0 }], wersja: 3 }));
  assert.equal(legacy.recruitFollowGeneralDefault, undefined);
  assert.equal(legacy.units[0].followGeneral, undefined);
  console.log('PASS save roundtrip preserves global default and per-unit overrides; legacy save omits them safely');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
