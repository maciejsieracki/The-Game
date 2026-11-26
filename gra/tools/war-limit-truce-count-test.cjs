'use strict';
/**
 * war-limit-truce-count-test.cjs — R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1.
 *
 * Rozejm (status 'pokoj' + truceUntilTurn / truceEndOffer) to pauza tej samej wojny: para nadal
 * liczy się w limicie wojen tego typu, który miała przed rozejmem. Dopiero pokój (bez rozejmu)
 * zwalnia limit. Wznowienie wojny po rozejmie (declareWarAfterTruce) nie przechodzi przez bramkę
 * limitu i nie jest blokowane.
 *
 * Pokrycie:
 *  (a) para w rozejmie z wojną naturalną X liczy się: druga wojna naturalna odrzucona;
 *  (b) po pokoju (bez rozejmu, status 'pokoj') druga wojna naturalna dozwolona;
 *  (c) wojna epoki w rozejmie liczy się jako epoki; naturalna dalej dozwolona;
 *  (d) wznowienie po rozejmie przy pełnym limicie: źródło declareWarAfterTruce nie wywołuje bramki;
 *  (e) źródło main.ts: warTypesForOwner używa isWarForLimit (nie samego status === 'wojna').
 * Mutacja: usunięcie gałęzi truceUntilTurn/truceEndOffer z isWarForLimit -> (a) i (c) czerwone.
 * Run: node tools/war-limit-truce-count-test.cjs   (wymaga gra/node_modules z esbuild)
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', 'game', 'diplomacy-war-limit.ts');
const MAIN_TS = path.resolve(ROOT, 'src', 'main.ts');
const BUNDLE = path.resolve(__dirname, '.war-limit-truce-bundle.cjs');

esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent' });
const lib = require(BUNDLE);
const { warLimitAllows, isWarForLimit, collectWarTypes, loadWarLimitParams, setWarLimitEnabledForTest } = lib;

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; console.log(`FAIL ${name}${detail ? ': ' + detail : ''}`); }
}

const PARAMS = loadWarLimitParams({ limitWojenAktywny: true, maxWojenEpoki: 1, maxWojenNaturalnych: 1 });
setWarLimitEnabledForTest(true);

const truceMeta = (typWojny) => ({ typWojny, truceUntilTurn: 40 });
const offerMeta = (typWojny) => ({ typWojny, truceEndOffer: { turn: 50, fromOwnerId: 1, toOwnerId: 2 } });
const peaceMeta = (typWojny) => ({ typWojny });

// Wiersze jak w warTypesForOwner: atWar = isWarForLimit(status, meta), meta tylko dla liczonych par.
function rowsFor(pairs) {
  return pairs.map(({ status, meta }, i) => {
    const atWar = isWarForLimit(status, meta);
    return { otherId: i + 2, atWar, isBarbarian: false, excluded: false, meta: atWar ? meta : undefined };
  });
}

// (a) rozejm z wojną naturalną X: druga wojna naturalna odrzucona
{
  const wars = collectWarTypes(rowsFor([{ status: 'pokoj', meta: truceMeta('naturalna') }]));
  ok('a: rozejm liczy wojnę naturalną', wars.length === 1 && wars[0] === 'naturalna', JSON.stringify(wars));
  ok('a: druga naturalna odrzucona w rozejmie', warLimitAllows('naturalna', wars, [], PARAMS) === false);
  const wars2 = collectWarTypes(rowsFor([{ status: 'pokoj', meta: offerMeta('naturalna') }]));
  ok('a: oferta pokoju po rozejmie liczy się', wars2.length === 1 && wars2[0] === 'naturalna');
  ok('a: druga naturalna odrzucona przy ofercie', warLimitAllows('naturalna', wars2, [], PARAMS) === false);
}

// (b) po pokoju (bez rozejmu) druga wojna naturalna dozwolona
{
  const wars = collectWarTypes(rowsFor([{ status: 'pokoj', meta: peaceMeta('naturalna') }]));
  ok('b: pokój bez rozejmu nie liczy się', wars.length === 0, JSON.stringify(wars));
  ok('b: druga naturalna dozwolona po pokoju', warLimitAllows('naturalna', wars, [], PARAMS) === true);
  ok('b: isWarForLimit false dla pokoju stałego', isWarForLimit('pokoj', peaceMeta('naturalna')) === false);
  ok('b: isWarForLimit false dla pokoju bez meta', isWarForLimit('pokoj', undefined) === false);
  ok('b: isWarForLimit true dla wojny', isWarForLimit('wojna', undefined) === true);
  ok('b: isWarForLimit false dla neutralnej pary', isWarForLimit('neutralny', undefined) === false);
}

// (c) wojna epoki w rozejmie liczy się jako epoki; naturalna nadal dozwolona
{
  const wars = collectWarTypes(rowsFor([{ status: 'pokoj', meta: truceMeta('epoki') }]));
  ok('c: rozejm epoki liczy się jako epoki', wars.length === 1 && wars[0] === 'epoki', JSON.stringify(wars));
  ok('c: druga epoki odrzucona w rozejmie', warLimitAllows('epoki', wars, [], PARAMS) === false);
  ok('c: naturalna dozwolona przy wojnie epoki w rozejmie', warLimitAllows('naturalna', wars, [], PARAMS) === true);
}

// (d) wznowienie po rozejmie nie przechodzi przez bramkę limitu (źródło main.ts)
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
{
  const start = mainSrc.indexOf('declareWarAfterTruce: (a, b) => {');
  const body = start >= 0 ? mainSrc.slice(start, start + 1500) : '';
  ok('d: declareWarAfterTruce istnieje', start >= 0);
  ok('d: declareWarAfterTruce bez bramki limitu', start >= 0 && !/warLimit|warTypesForOwner/.test(body));
  ok('d: declareWarAfterTruce bez isWarForLimit', start >= 0 && !/isWarForLimit/.test(body));
}

// (e) warTypesForOwner używa isWarForLimit
{
  const start = mainSrc.indexOf('function warTypesForOwner(');
  const body = start >= 0 ? mainSrc.slice(start, start + 1200) : '';
  ok('e: warTypesForOwner istnieje', start >= 0);
  ok('e: warTypesForOwner woła isWarForLimit', /isWarForLimit\(/.test(body));
  ok('e: warTypesForOwner nie opiera się wyłącznie na status === wojna', !/atWar = getDiploRelation\(ownerId, oid\)\.status === 'wojna'/.test(body));
}

try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`war-limit-truce-count: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
