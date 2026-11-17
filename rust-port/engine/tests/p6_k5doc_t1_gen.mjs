// P6 SIEGE K5DOC-T1 MODEL-UI (dispatch R-RUSTPORT-P6-K5DOC-T1-MODEL-UI, runda 1, Operator):
// generator wektorow dla `GroupDoctrine`, `_ensureGroupMeta` i `_setGroupDoctrine`
// (rust-port/engine/src/domain/siege_tactics_doctrine_model.rs).
//
// Uruchomienie: node rust-port/engine/tests/p6_k5doc_t1_gen.mjs
// Wynik: tests/p6_k5doc_t1_vectors/vectors.json
//
// ORAKUL = WYKONANIE TEKSTU PINA. Fragmenty pina (git show 07d2fbd72, bez checkoutu) sa transpilowane przez TypeScript
// i WYKONYWANE, wiec wartosci oczekiwane pochodza z pina, a nie z reimplementacji JS:
//   type GroupDoctrine          battleScene.ts:1938
//   _ensureGroupMeta            battleScene.ts:17586-17593
//   _setGroupDoctrine           battleScene.ts:17864-17929
// STUBOWANE sa wyłącznie metody sceny, ktore `_setGroupDoctrine` wola poza modelem doktryny (formacja, rysowanie
// komunikatow, kolejka rozkazow, geometria). Nie wplywaja na pola `doctrine` i `autoPlay`, ktore sa przedmiotem testu.
//
// Straznik: pierwsza i ostatnia linia kazdego wycinka musza zawierac oczekiwany tekst (inaczej przesuniecie linii pina).

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const PIN_PATH = 'gra/src/battle/battleScene.ts';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const pinLines = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
}).split('\n');
const pinRange = (a, b) => pinLines.slice(a - 1, b).join('\n');

// [poczatek, koniec, tekst poczatku, tekst konca]
const FRAGMENTS = {
  groupDoctrineType: { range: [1938, 1938], head: 'type GroupDoctrine', tail: "'manual';" },
  ensureGroupMeta: { range: [17586, 17593], head: 'private _ensureGroupMeta', tail: '  }' },
  setGroupDoctrine: { range: [17864, 17929], head: 'private _setGroupDoctrine', tail: '  }' },
};
const digests = {};
for (const [name, { range: [a, b], head, tail }] of Object.entries(FRAGMENTS)) {
  const tailOk = tail.startsWith('  ') ? pinLines[b - 1] === tail : pinLines[b - 1].includes(tail);
  if (!pinLines[a - 1].includes(head) || !tailOk) {
    throw new Error(`straznik wycinka ${name} (${a}-${b}) nie zgadza sie z pinem`);
  }
  digests[name] = createHash('sha256').update(pinRange(a, b)).digest('hex');
}

// --- Wykonanie pina ---
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const tsLib = createRequire(import.meta.url)(TS_JS);
const modSrc = [
  pinRange(1938, 1938),
  'class P {',
  'constructor() { this._groupMeta = new Map(); this.deployPhase = false; this._generalPanel = null; this.feedback = []; }',
  '_liveGroupMemberIds(gid) { return []; }',
  '_groupCentroid(gid) { return { col: 0, row: 0 }; }',
  '_groupSide(gid) { return "atk"; }',
  '_forwardCol(side, col, steps) { return col + steps; }',
  '_inferDefaultFormationForGroup(gid) { return "F3"; }',
  '_applyGroupFormation(gid, f) { }',
  '_applySkirmishFlags(gid) { }',
  '_groupHasRanged(gid) { return false; }',
  '_findUnitById(id) { return null; }',
  '_pickTargetByPriority(u) { return null; }',
  '_refreshQueuedOrderVisuals() { }',
  '_showOrderFeedback(t) { this.feedback.push(t); }',
  '_updateSelectedPanel() { }',
  '_updateDeployStrategyBar() { }',
  '_updateDeployToolbarStatus() { }',
  '_refreshGeneralPanelBody() { }',
  '_doctrineLabel(d) { return d; }',
  pinRange(17586, 17593),
  pinRange(17864, 17929),
  '}',
  'module.exports.P = P;',
].join('\n');
const execJs = tsLib.transpileModule(modSrc, {
  compilerOptions: { module: tsLib.ModuleKind.CommonJS, target: tsLib.ScriptTarget.ES2020 },
}).outputText;
const pinMod = { exports: {} };
new Function('module', 'exports', 'require', execJs)(pinMod, pinMod.exports, createRequire(import.meta.url));
const Pin = pinMod.exports.P;

const VARIANTS = ['defensive', 'steady', 'aggressive', 'skirmish', 'manual'];

const ensureDefault = (() => {
  const p = new Pin();
  const m = p._ensureGroupMeta('g1');
  return { doctrine: m.doctrine, autoPlay: m.autoPlay, size: p._groupMeta.size };
})();

const ensureIdempotent = (() => {
  const p = new Pin();
  const first = p._ensureGroupMeta('g1');
  first.doctrine = 'aggressive';
  first.autoPlay = false;
  const second = p._ensureGroupMeta('g1');
  return {
    after_first_mutation: { doctrine: 'aggressive', autoPlay: false },
    second: { doctrine: second.doctrine, autoPlay: second.autoPlay },
    size: p._groupMeta.size,
  };
})();

const setCases = VARIANTS.map((v) => {
  const p = new Pin();
  p._setGroupDoctrine('g1', v);
  const m = p._groupMeta.get('g1');
  return { input: v, doctrine: m.doctrine, autoPlay: m.autoPlay, size: p._groupMeta.size };
});

const setSequence = (() => {
  const p = new Pin();
  const steps = [];
  for (const v of ['manual', 'steady', 'manual', 'skirmish']) {
    p._setGroupDoctrine('g1', v);
    const m = p._groupMeta.get('g1');
    steps.push({ input: v, doctrine: m.doctrine, autoPlay: m.autoPlay });
  }
  return steps;
})();

const out = {
  pin: PIN,
  digests,
  pins: {
    groupDoctrineType: 'battleScene.ts:1938',
    ensureGroupMeta: 'battleScene.ts:17586-17593',
    setGroupDoctrine: 'battleScene.ts:17864-17929',
  },
  variants: VARIANTS.map((v) => ({ pin: 'battleScene.ts:1938', value: v })),
  ensure_default: ensureDefault,
  ensure_idempotent: ensureIdempotent,
  set_cases: setCases,
  set_sequence: setSequence,
};

const dir = join(here, 'p6_k5doc_t1_vectors');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'vectors.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`OK: ${Object.keys(digests).length} wycinki pina, ${VARIANTS.length} wariantow, ${setCases.length} przypadkow set`);
