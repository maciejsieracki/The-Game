'use strict';
/**
 * diplo-war-peace-d7-test.cjs — R-WEB-PEACE-RULES-Q1 D7 (zachowanie, nie grep).
 * Gracz NIGDY nie wypowiada wojny automatycznie z hamulca; para AI↔AI bez zmian.
 * Test wywołuje prawdziwą funkcję brakeWarOutcome (używaną przez processDiploCrisisQueue w main.ts).
 * Mutant M_D7: mayDeclare zawsze true (usunięty warunek gracza) — test musi paść.
 * Run: node tools/diplo-war-peace-d7-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.dip-d7-entry.ts');
const BRAKE = path.resolve(GRA, 'src', 'game', 'diplomacy-tick-war-brake.ts');
const BUNDLE_OK = path.resolve(__dirname, '.dip-d7-ok.cjs');
const BUNDLE_M = path.resolve(__dirname, '.dip-d7-m.cjs');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const PLAYER = 0;
const isPlayer = (o) => o === PLAYER;

function cleanup() {
  for (const p of [ENTRY, BUNDLE_OK, BUNDLE_M]) { try { fs.unlinkSync(p); } catch (_) { /* ok */ } }
}

async function build(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile, absWorkingDir: GRA, loader: { '.ts': 'ts' }, logLevel: 'silent', plugins,
  });
}

function mutantPlugin(from, to) {
  const info = { applied: 0 };
  return {
    info,
    plugin: {
      name: 'mutant-d7',
      setup(b) {
        b.onLoad({ filter: /diplomacy-tick-war-brake\.ts$/ }, async () => {
          const src = fs.readFileSync(BRAKE, 'utf8');
          info.applied = src.split(from).length - 1;
          return { contents: src.split(from).join(to), loader: 'ts' };
        });
      },
    },
  };
}

async function main() {
  fs.writeFileSync(ENTRY, "export { brakeWarOutcome, pickWarDeclarer } from './game/diplomacy-tick-war-brake';\n", 'utf8');
  try {
    await build(BUNDLE_OK, []);
    const m = mutantPlugin('mayDeclare: !isPlayer(declarer)', 'mayDeclare: true');
    await build(BUNDLE_M, [m.plugin]);
    check('(0) mutant M_D7 podmienił dokładnie 1 miejsce', m.info.applied === 1, m.info);

    const ok = require(BUNDLE_OK);
    const mut = require(BUNDLE_M);

    // gracz silniejszy (ownerId 0, moc 100 vs AI 1, moc 50)
    const pl = ok.brakeWarOutcome({ ownerId: PLAYER, power: 100 }, { ownerId: 1, power: 50 }, isPlayer);
    check('D7a: gracz silniejszy -> brak deklaracji (mayDeclare=false), deklaruje gracz', pl.mayDeclare === false && pl.declarer === PLAYER, pl);
    // gracz silniejszy jako strona B
    const plB = ok.brakeWarOutcome({ ownerId: 2, power: 40 }, { ownerId: PLAYER, power: 90 }, isPlayer);
    check('D7b: gracz silniejszy jako strona B -> mayDeclare=false', plB.mayDeclare === false && plB.declarer === PLAYER, plB);
    // AI silniejsza od gracza -> wojna z hamulca wybucha, ofiarą jest gracz
    const ai = ok.brakeWarOutcome({ ownerId: PLAYER, power: 30 }, { ownerId: 3, power: 80 }, isPlayer);
    check('D7c: AI silniejsza -> mayDeclare=true, deklaruje AI, ofiara = gracz', ai.mayDeclare === true && ai.declarer === 3 && ai.victim === PLAYER, ai);
    // para AI↔AI
    const aa = ok.brakeWarOutcome({ ownerId: 4, power: 60 }, { ownerId: 5, power: 70 }, isPlayer);
    check('D7d: para AI↔AI -> mayDeclare=true (bez zmian), deklaruje silniejsza', aa.mayDeclare === true && aa.declarer === 5 && aa.victim === 4, aa);
    // remis mocy: niższe ownerId deklaruje (pickWarDeclarer) — gracz (0) wygrywa remis -> brak deklaracji
    const tie = ok.brakeWarOutcome({ ownerId: PLAYER, power: 50 }, { ownerId: 6, power: 50 }, isPlayer);
    check('D7e: remis z graczem -> deklaruje gracz (niższe ownerId) -> mayDeclare=false', tie.declarer === PLAYER && tie.mayDeclare === false, tie);

    // mutacja M_D7 musi zmienić wynik D7a (gracz by wypowiedział)
    const mPl = mut.brakeWarOutcome({ ownerId: PLAYER, power: 100 }, { ownerId: 1, power: 50 }, isPlayer);
    check('M_D7 wykryty: bez warunku gracza gracz silniejszy wypowiada (mayDeclare=true)', mPl.mayDeclare === true, mPl);
    check('M_D7 test pada: D7a w wersji ok jest rozróżnialna od mutanta', pl.mayDeclare !== mPl.mayDeclare);
  } finally {
    cleanup();
  }
  console.log('\ndiplo-war-peace-d7-test: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { cleanup(); console.error(e); process.exit(1); });
