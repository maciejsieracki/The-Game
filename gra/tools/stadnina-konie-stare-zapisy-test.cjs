'use strict';
/**
 * stadnina-konie-stare-zapisy-test.cjs -- BRAMKA TEMATU R-WEB-STADNINA-KONIE-STARE-ZAPISY-Q1.
 * Stary zapis: kon pod lasem = hex.zloze==='konie' (nakladka Las). Wspolny predykat hexHasHorseDeposit
 * (terrain-improvements.ts) ma go uznawac za zloze konia (bez migracji). Dowod na prawdziwych
 * funkcjach: hexHasHorseDeposit, isLivestockUnlockedForPlacement, createImprovementBuildApi.
 * Uruchom z gra/:  node tools/stadnina-konie-stare-zapisy-test.cjs   (STADNINA_SRC=<src> = inny src, np. baseline)
 */
const fs = require('fs'), os = require('os'), path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const SRC = process.env.STADNINA_SRC || path.resolve(__dirname, '..', 'src');
const TMP = fs.mkdtempSync(path.join(fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir(), 'stadnina-stare-'));

async function bundle(tag, mutate) {
  const entry = path.join(TMP, `e-${tag}.ts`), out = path.join(TMP, `b-${tag}.cjs`);
  fs.writeFileSync(entry, `
export { createImprovementBuildApi } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { hexHasHorseDeposit, improvementHidesDepositOnHex } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { isLivestockUnlockedForPlacement, improvementMatchesLivestockDeposit } from ${JSON.stringify(SRC + '/game/livestock-unlock')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`);
  const plugin = { name: 'mut', setup(b) { if (!mutate) return;
    b.onLoad({ filter: /terrain-improvements\.ts$/ }, (a) => {
      const s = fs.readFileSync(a.path, 'utf8'), m = mutate(s);
      if (m === s) throw new Error('mutacja nie zmienila zrodla');
      return { contents: m, loader: 'ts', resolveDir: path.dirname(a.path) }; }); } };
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: out, resolveExtensions: ['.ts', '.js', '.json'], logLevel: 'silent', plugins: [plugin] });
  return require(out);
}
let pass = 0, fail = 0;
const ok = (c, n, x) => { if (c) { pass++; console.log(`  [OK] ${n}`); } else { fail++; console.log(`  [FAIL] ${n}${x !== undefined ? ' :: ' + JSON.stringify(x) : ''}`); } };

function mk(q, r, teren, nakladka, zloze) {
  const h = { coords: { q, r }, terenBazowy: teren, nakladka, rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak', wioska: { istnieje: false, ludnosc: 0 }, wlasciciel: null };
  if (zloze !== undefined) h.zloze = zloze;
  return h;
}
function api(M, hexes, extra = {}) {
  const state = { map: { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] },
    cityNodes: [{ q: 0, r: 0, pop: 1, level: 1 }], territoryNodes: [{ q: 0, r: 0, pop: 1, level: 1, ownerId: 0 }],
    playerOwnerIdNum: 0, playerCivArchetype: 'rzymianie', playerEra: 3, researchedTechs: new Set(['Jeździectwo']),
    horseStockAvailable: 0, tradeRouteKonUnlocked: false, ...extra };
  return M.createImprovementBuildApi(state);
}
const has = (b, q, r) => b.getQualifyingHexes('stadnina').some(h => h.q === q && h.r === r);
// Predykat w baseline mogl nie byc eksportowany z terrain-improvements -> wywolanie przez bezpieczny wrapper.
const hhd = (M, hex) => (typeof M.hexHasHorseDeposit === 'function' ? M.hexHasHorseDeposit(hex) : 'BRAK_EKSPORTU');

async function main() {
  let M;
  try { M = await bundle('good', null); } catch (e) {
    // baseline: hexHasHorseDeposit zyje w livestock-unlock
    const entry = path.join(TMP, 'e-base.ts'), out = path.join(TMP, 'b-base.cjs');
    fs.writeFileSync(entry, `
export { createImprovementBuildApi } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { hexHasHorseDeposit, isLivestockUnlockedForPlacement, improvementMatchesLivestockDeposit } from ${JSON.stringify(SRC + '/game/livestock-unlock')};
export { improvementHidesDepositOnHex } from ${JSON.stringify(SRC + '/game/terrain-improvements')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`);
    await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: out, resolveExtensions: ['.ts', '.js', '.json'], logLevel: 'silent' });
    M = require(out);
  }
  const T = M.TerenBazowy, N = M.Nakladka;
  const base = () => { const hx = {}; for (let q = -4; q <= 4; q++) for (let r = -4; r <= 4; r++) hx[`${q},${r}`] = mk(q, r, T.Laka, N.Brak); return hx; };

  console.log('\n--- (A) predykat hexHasHorseDeposit ---');
  ok(hhd(M, { nakladka: N.ZlozeKonia }) === true, 'nowa mapa: nakladka ZlozeKonia');
  ok(hhd(M, { nakladka: N.Las, zloze: 'konie' }) === true, 'stary zapis: Las + zloze konie');
  ok(hhd(M, { nakladka: N.Brak, zloze: 'konie' }) === true, 'zloze konie bez nakladki');
  ok(hhd(M, { nakladka: N.Brak }) === false, 'brak zloza');
  ok(hhd(M, { nakladka: N.Las }) === false, 'las bez zloza');
  ok(hhd(M, { nakladka: N.Brak, zloze: 'owce' }) === false, 'inne zloze (owce)');
  ok(hhd(M, { nakladka: N.Brak, zloze: '' }) === false, 'puste zloze');
  ok(hhd(M, { nakladka: N.Brak, zloze: null }) === false, 'zloze null');
  for (const z of [' Konie ', 'KONIE', 'konie\n']) ok(hhd(M, { nakladka: N.Las, zloze: z }) === true, `wielkosc liter/spacje: ${JSON.stringify(z)}`);
  ok(hhd(M, { zloze: 'kon' }) === false, 'zloze "kon" (bez e) nie jest zlozem (jak dotad)');

  console.log('\n--- (B) isLivestockUnlockedForPlacement / improvementMatchesLivestockDeposit / ukrywanie ikony ---');
  ok(M.isLivestockUnlockedForPlacement('stadnina', { nakladka: N.Las, zloze: 'konie' }, false, 0) === true, 'stary zapis bez magazynu/szlaku -> dozwolone');
  ok(M.isLivestockUnlockedForPlacement('stadnina', { nakladka: N.Brak }, false, 0) === false, 'brak zloza, brak magazynu -> odrzucone');
  ok(M.improvementMatchesLivestockDeposit('stadnina', { nakladka: N.Las, zloze: 'konie' }) === true, 'matches: stary zapis');
  ok(M.improvementHidesDepositOnHex('stadnina', { nakladka: N.Las, zloze: 'konie' }) === true, 'stadnina ukrywa ikone zloza w starym zapisie');

  console.log('\n--- (C) prawdziwy kwalifikator budowy (getQualifyingHexes) ---');
  {
    const hx = base();
    hx['1,0'] = mk(1, 0, T.Laka, N.Las, 'konie');
    hx['2,0'] = mk(2, 0, T.Rownina, N.ZlozeKonia);
    hx['0,2'] = mk(0, 2, T.Laka, N.Brak, ' KONIE ');
    hx['0,3'] = mk(0, 3, T.Laka, N.Las);
    hx['3,0'] = mk(3, 0, T.Laka, N.Brak, 'owce');
    const b = api(M, hx);
    ok(has(b, 1, 0), 'stary zapis (Las + zloze konie) -> kandydat');
    ok(has(b, 2, 0), 'nowa mapa (ZlozeKonia) -> kandydat');
    ok(has(b, 0, 2), 'zloze " KONIE " -> kandydat');
    ok(!has(b, 0, 3), 'las bez zloza -> NIE kandydat');
    ok(!has(b, 3, 0), 'zloze owce -> NIE kandydat dla stadniny');
    ok(!has(b, -1, 0), 'brak zloza -> NIE kandydat (magazyn 0)');
    ok(!has(api(M, hx, { horseStockAvailable: 50 }), -1, 0), '[R-WEB-IRON-STUD-ADJACENCY-Q1: bez sąsiedniej stadniny -> NIE] sciezka magazynu 50 koni bez sąsiada -> nie kandydat');
    const hxW = base(); hxW['1,0'] = mk(1, 0, T.Wzgorza, N.Las, 'konie');
    ok(!has(api(M, hxW), 1, 0), 'teren Wzgorza + zloze konie -> NIE (reguly terenu bez zmian)');
  }

  console.log('\n--- (D) regex-pin: miejsca uzywaja wspolnego predykatu ---');
  const rd = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
  ok(/case 'stadnina':\s*return hexHasHorseDeposit\(hex\);/.test(rd('map/improvement-build.ts')), 'improvement-build depositAllows uzywa predykatu');
  ok(/key === 'stadnina' && !hexHasHorseDeposit\(/.test(rd('ui/hexContextTooltip.ts')), 'tooltip uzywa predykatu');
  ok(/req\.key === 'stadnina' && !hexHasHorseDeposit\(/.test(rd('main.ts')), 'main (koszt 50 koni) uzywa predykatu');

  console.log('\n--- (E) MUTACJA: predykat bez zloze MUSI czerwienic ---');
  if (fs.readFileSync(path.join(SRC, 'game/terrain-improvements.ts'), 'utf8').includes('export function hexHasHorseDeposit')) {
    const bad = await bundle('mut', (s) => s.replace(/hex\.nakladka === Nakladka\.ZlozeKonia\s*\|\|\s*\(typeof hex\.zloze === 'string' && hex\.zloze\.trim\(\)\.toLowerCase\(\) === 'konie'\)/, 'hex.nakladka === Nakladka.ZlozeKonia'));
    ok(bad.hexHasHorseDeposit({ nakladka: N.Las, zloze: 'konie' }) === false, 'mutacja: stary zapis odrzucony');
    const hx = base(); hx['1,0'] = mk(1, 0, T.Laka, N.Las, 'konie');
    ok(!has(api(bad, hx), 1, 0), 'mutacja: kwalifikator odrzuca stary zapis (test C by padl)');
  } else console.log('  (baseline: brak predykatu w terrain-improvements -- mutacja pominieta)');
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\nWYNIK: pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {} process.exit(2); });
