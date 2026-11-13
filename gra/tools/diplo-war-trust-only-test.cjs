'use strict';
/**
 * diplo-war-trust-only-test.cjs — R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1 (krok 1 z 4).
 *
 * Decyzja właściciela (2026-11-13): w trakcie wojny obniżane jest WYŁĄCZNIE Zaufanie (do zera).
 * Respekt nie jest zmieniany przez wojnę; limit 29 na sumę Zaufania+Respektu został usunięty.
 *
 * Sekcje:
 *  (a) tick w wojnie: Zaufanie 40 / Respekt 50 → Zaufanie 0, Respekt 50
 *  (b) tick poza wojną: ten sam stan wejściowy → Zaufanie 40, Respekt 50 (bez zmian)
 *  (c) zdarzenie 'wygrana_bitwa' w wojnie: Respekt rośnie o wygraBitwa_respekt, nie maleje
 *  (d) treatyEvalRelationTotal w wojnie = Respekt (Zaufanie 0), poza wojną = Zaufanie+Respekt
 *  (e) źródło: w clampRelationForWar nie ma już obcinania sumy do WAR_RELATION_SCORE_CAP
 *
 * Run from gra/:  node tools/diplo-war-trust-only-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.diplo-war-trust-only-bundle.cjs');
const entryFile = path.resolve(__dirname, '.diplo-war-trust-only-entry.ts');
fs.writeFileSync(entryFile, `
export { applyDiplomaticEvent, clampRelationForWar, DIPLOMACY_PARAMS, tickDiplomacy } from '../src/game/diplomacy.ts';
export { treatyEvalRelationTotal } from '../src/game/diplomacy-proposals.ts';
`, 'utf8');

async function main() {
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    loader: { '.json': 'json', '.svg': 'text', '.css': 'text' },
  });

  const {
    applyDiplomaticEvent, clampRelationForWar, DIPLOMACY_PARAMS, tickDiplomacy, treatyEvalRelationTotal,
  } = require(BUNDLE);

  let pass = 0;
  let fail = 0;
  function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

  const rdip = (z, r, status) => ({ zaufanie: z, respekt: r, status, traktaty: [], urazyHistoryczne: 0 });

  // (a) tick w wojnie
  console.log('(a) tick w wojnie: Zaufanie do 0, Respekt bez zmian');
  const tw = tickDiplomacy(rdip(40, 50, 'wojna'), { turn: 1 });
  ok(tw.zaufanie === 0, `Zaufanie po ticku w wojnie = 0 (zmierzone ${tw.zaufanie})`);
  ok(tw.respekt === 50, `Respekt po ticku w wojnie = 50 (zmierzone ${tw.respekt})`);

  // (b) tick poza wojną
  console.log('(b) tick poza wojną: stan nietknięty');
  const tp = tickDiplomacy(rdip(40, 50, 'pokoj'), { turn: 1 });
  ok(tp.zaufanie === 40, `Zaufanie poza wojną = 40 (zmierzone ${tp.zaufanie})`);
  ok(tp.respekt === 50, `Respekt poza wojną = 50 (zmierzone ${tp.respekt})`);

  // (c) wygrana bitwy w wojnie nie obniża respektu
  console.log('(c) wygrana_bitwa w wojnie: Respekt nie maleje');
  const win = applyDiplomaticEvent(rdip(40, 50, 'wojna'), 'wygrana_bitwa');
  const dR = DIPLOMACY_PARAMS.wygraBitwa_respekt;
  ok(win.respekt === 50 + dR, `Respekt = 50 + ${dR} (zmierzone ${win.respekt})`);
  ok(win.zaufanie === 0, `Zaufanie w wojnie = 0 (zmierzone ${win.zaufanie})`);

  // (d) treatyEvalRelationTotal
  console.log('(d) treatyEvalRelationTotal: w wojnie Respekt (Zaufanie 0), poza wojną suma');
  const evalWar = treatyEvalRelationTotal(rdip(40, 50, 'wojna'));
  ok(evalWar === 50, `w wojnie = 50 (zmierzone ${evalWar})`);
  const evalPeace = treatyEvalRelationTotal(rdip(40, 50, 'pokoj'));
  ok(evalPeace === 90, `poza wojną = 90 (zmierzone ${evalPeace})`);
  const clampedWar = clampRelationForWar(rdip(60, 80, 'wojna'));
  ok(clampedWar.zaufanie === 0 && clampedWar.respekt === 80, 'clampRelationForWar(60/80, wojna) = 0/80 (bez limitu 29)');

  // (e) źródło: brak obcinania sumy do capu w clampie
  console.log('(e) źródło: clampRelationForWar nie obcina sumy do WAR_RELATION_SCORE_CAP');
  const src = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'game', 'diplomacy.ts'), 'utf8');
  const m = src.match(/export function clampRelationForWar[\s\S]*?\n}\n/);
  const body = m ? m[0] : '';
  ok(body.length > 0, 'funkcja clampRelationForWar znaleziona w diplomacy.ts');
  ok(body.indexOf('WAR_RELATION_SCORE_CAP') === -1 && body.indexOf('excess') === -1,
    'clampRelationForWar nie zawiera WAR_RELATION_SCORE_CAP ani obcinania „excess”');

  console.log(`\ndiplo-war-trust-only-test: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
