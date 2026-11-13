'use strict';
/**
 * R-WEB-DIPLO-TRUST-DRIFT-IN-WAR-Q1 — realny tik tury (tickDiplomacy) dla zaufania startowego 0:
 * para w wojnie, neutralna i w pokoju; po 1, 3 i 6 turach. Wypisuje tabelę.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.diplo-trust-war-drift-entry.ts');
const bundle = path.resolve(__dirname, '.diplo-trust-war-drift-bundle.cjs');
fs.writeFileSync(entry, `
export { tickDiplomacy, computeTickZaufanieDelta, getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
export { zaufanieDryfOdWiarygodnosci } from '../src/game/diplomacy-credibility.ts';
`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, logLevel: 'silent' });
const B = require(bundle);
let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); } else { fail++; console.error('  FAIL:', msg); }
}

const W_START = 20; // Normalny: wiarygodnoscStartNormalny
function run(status, turns, wiar) {
  let rel = { zaufanie: 0, respekt: 0, status, traktaty: [], urazyHistoryczne: 0 };
  const out = [];
  for (let t = 1; t <= turns; t++) {
    const ctx = { turn: t, wiarygodnoscSelf: wiar, aktywnyHandel: false, pokojTrustTier: undefined,
      dobraWolaAktywna: false, wspolnyWrog: false, karaWspolnaGranica: false };
    rel = B.tickDiplomacy(rel, ctx);
    out.push(rel.zaufanie);
  }
  return out;
}
const war = run('wojna', 6, undefined);
const neu = run('neutralni', 6, W_START);
const pok = run('pokoj', 6, W_START);
console.log('| scenariusz | po t1 | po t3 | po t6 |');
console.log('|---|---|---|---|');
console.log(`| wojna (W=undefined) | ${war[0]} | ${war[2]} | ${war[5]} |`);
console.log(`| neutralna (W=${W_START}) | ${neu[0]} | ${neu[2]} | ${neu[5]} |`);
console.log(`| pokoj (W=${W_START}) | ${pok[0]} | ${pok[2]} | ${pok[5]} |`);
ok(war[0] === 0 && war[2] === 0 && war[5] === 0, 'wojna: zaufanie 0 po 1/3/6 turach (brak wzrostu)');
ok(B.zaufanieDryfOdWiarygodnosci(W_START) > 0, 'neutralna: dryf W>0 daje wzrost (zgodnie z ustawionym dryfem)');
ok(B.computeTickZaufanieDelta({ turn: 1, wiarygodnoscSelf: W_START }, true) === 0,
  'computeTickZaufanieDelta(atWar=true) z dryfem W=20 = 0');
console.log(`PASS=${pass} FAIL=${fail}`);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
process.exit(fail ? 1 : 0);
