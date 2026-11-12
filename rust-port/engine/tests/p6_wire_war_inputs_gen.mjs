// P6-WIRE-WAR-PIPELINE (W8 r4): generator wektorow z WEBA (pin 07d2fbd72) dla producentow wejsc fazy Diplomacy.
// Wyniki: vectors.json z dwoma zbiorami:
//  - pairParams: `diploBrakeWarParams(a, b)` (main.ts:11567) zlozone z `resolveWarPeaceProfile` + `brakeRelationThreshold`
//    (gra/src/game/diplomacy-war-peace-profile.ts) dla par kluczy cywilizacji (null = gracz, `isMe`).
//  - tickBrake: skladanie tick -> brake dla pary ze wspolna granica: `tickDiplomacy` z
//    `karaWspolnaGranicaDelta = sharedBorderPenaltyForEpochs(epokaA, epokaB)` (diplomacy.ts), potem
//    `relationScore` i `crisisStepForPair` (diplomacy-tick-war-brake.ts) z progiem/N z `diploBrakeWarParams`.
//    Id web: gracz 0, AI 1 (Rust: 1 i 2; mapowanie `web_owner_id`).
// Uzycie (poza repo):
//   git archive <pin> gra/src gra/data | tar -x -C <work>/web
//   (cd <work>/esb && npm install esbuild@0.24.2)
//   node p6_wire_war_inputs_gen.mjs --web <work>/web/gra/src --esbuild <work>/esb/node_modules/esbuild \
//     --work <work>/bundle --out rust-port/engine/tests/p6_wire_war_inputs_vectors/vectors.json
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const webSrc = resolve(arg('--web', ''));
const esbuildDir = resolve(arg('--esbuild', ''));
const workDir = resolve(arg('--work', ''));
const outFile = resolve(arg('--out', ''));
const matrixPath = resolve(arg('--matrix', join(webSrc, '..', 'data', 'civ-matrix.json')));
if (!existsSync(join(webSrc, 'game', 'diplomacy.ts')) || !existsSync(matrixPath) || !outFile) {
  console.error('Brak --web/--esbuild/--work/--out albo plikow pinu.');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const esbuild = require(esbuildDir);
mkdirSync(workDir, { recursive: true });
mkdirSync(resolve(outFile, '..'), { recursive: true });

async function bundle(entry, name) {
  const outfile = join(workDir, `${name}.bundle.mjs`);
  await esbuild.build({
    entryPoints: [join(webSrc, 'game', entry)],
    bundle: true, format: 'esm', platform: 'node', target: 'node22', outfile, logLevel: 'error',
  });
  return import(pathToFileURL(outfile).href);
}
const D = await bundle('diplomacy.ts', 'diplomacy');
const B = await bundle('diplomacy-tick-war-brake.ts', 'brake');
const P = await bundle('diplomacy-war-peace-profile.ts', 'profile');

// diploBrakeWarParams (main.ts:11567); `civ == null` = gracz (isMe -> brak wiersza macierzy).
function brakeParams(civA, civB) {
  const pa = P.resolveWarPeaceProfile(civA ?? undefined);
  const pb = P.resolveWarPeaceProfile(civB ?? undefined);
  const higher = pa.progWojnyRelacji >= pb.progWojnyRelacji ? pa : pb;
  return { prog: P.brakeRelationThreshold(higher.progWojnyRelacji), n: higher.hamulecN };
}

const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
const civKeys = matrix.cywilizacje.map((c) => c.typCywilizacji);
const pairParams = [];
const pool = [null, ...civKeys.slice(0, 8), 'player-2', 'nieznana'];
for (const a of pool) for (const b of pool) pairParams.push({ civA: a, civB: b, out: brakeParams(a, b) });

// tick -> brake: pary (gracz 0 w roli `me`, AI 1), wspolna granica, epoki 1..3.
const tickBrake = [];
const startRels = [[40, 30], [20, 10], [60, 50], [5, 5]];
for (const [civA, civB] of [[null, 'player-2'], [null, civKeys[0]], [null, civKeys[3]]]) {
  const bp = brakeParams(civA, civB);
  for (const [ea, eb] of [[1, 1], [2, 1], [3, 2], [3, 3]]) {
    for (const [z0, r0] of startRels) {
      let z = z0, r = r0, counter = 0;
      const turns = [];
      for (let t = 1; t <= 6; t++) {
        const delta = D.sharedBorderPenaltyForEpochs(ea, eb);
        const out = D.tickDiplomacy(
          { graczA: 'a', graczB: 'b', zaufanie: z, respekt: r, relacjaOgolna: z + r, traktaty: [],
            urazyHistoryczne: 0, kontaktNawiazany: true, status: 'neutralni' },
          { turn: t, karaWspolnaGranica: true, karaWspolnaGranicaDelta: delta },
        );
        z = out.zaufanie; r = out.respekt;
        const rel = D.relationScore({ zaufanie: z, respekt: r });
        const step = B.crisisStepForPair(counter, rel, false,
          { kryzysProgZaufania: bp.prog, kryzysTurDoWojny: bp.n, kryzysOstrzezenieTurPrzed: 2 });
        counter = step.counter;
        turns.push({ turn: t, zaufanie: String(z), respekt: String(r), rel: String(rel), counter: step.counter,
          warTriggerReady: step.warTriggerReady });
      }
      tickBrake.push({ civA, civB, epochA: ea, epochB: eb, z0: String(z0), r0: String(r0), brake: bp, turns });
    }
  }
}
writeFileSync(outFile, JSON.stringify({ pin: PIN, generator: 'p6_wire_war_inputs_gen.mjs', pairParams, tickBrake }, null, 1) + '\n');
console.log(`pairParams=${pairParams.length} tickBrake=${tickBrake.length}`);
