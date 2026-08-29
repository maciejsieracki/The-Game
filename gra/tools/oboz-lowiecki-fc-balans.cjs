'use strict';
/**
 * oboz-lowiecki-fc-balans.cjs — sonda Final Control (runda 1)
 * R-ULEPSZENIA-OBOZ-LOWIECKI-TYLKO-LAS-Q1
 *
 * Dwa pytania, ktorych nie zamknely runda Operatora i Evaluatora:
 *  A) BALANS — ile pol REALNIE kwalifikuje sie po zmianie (czy oboz nie stal sie martwy).
 *     Liczone na WLASNYCH ziarnach FC, trzema wariantami + udzial w ladzie.
 *  B) P7 niezalezna reprodukcja — nie przez wolanie samego strip*, tylko przez
 *     ODTWORZENIE DOSLOWNEJ SEKWENCJI main.ts:11908-11912 (gracz) / :28905-28906 (AI).
 *
 * Uruchamiaj z gra/:  node tools/oboz-lowiecki-fc-balans.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.OBOZ_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.oboz-fc-entry.ts');
const BUNDLE = path.resolve(__dirname, '.oboz-fc-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export {
  buildImprovementQualifier, computeImprovementBuildImpact,
  stripImprovementsWhenForestRemoved, hasAnimalDeposit,
} from ${JSON.stringify(SRC + '/map/improvement-build')};
export { Nakladka, TerenBazowy } from ${JSON.stringify(SRC + '/types/hex')};
`);
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, outfile: BUNDLE,
  platform: 'node', format: 'cjs', logLevel: 'error',
});
const M = require(BUNDLE);
const { Nakladka, TerenBazowy, hasAnimalDeposit, stripImprovementsWhenForestRemoved } = M;

let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (x ? ' :: ' + x : '')); } };

const SEEDS = [777, 4242, 90210, 5, 31415];
const WODA = new Set([TerenBazowy.Morze, TerenBazowy.Wybrzeze]);

console.log('\n=== A. BALANS — ile pol kwalifikuje sie na wariant (ziarna FC) ===');
console.log('ziarno | ladu | DZIS Las|zloze | TYLKO Las | Las&zloze | Las na wzgorzu | %ladu(Las)');
let tLad = 0, tDzis = 0, tLas = 0, tOba = 0, tWzg = 0;
for (const seed of SEEDS) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  let lad = 0, dzis = 0, las = 0, oba = 0, wzg = 0;
  for (const h of Object.values(map.hexes)) {
    if (WODA.has(h.terenBazowy)) continue;
    lad++;
    const isLas = h.nakladka === Nakladka.Las;
    const isZw = hasAnimalDeposit(h.nakladka);
    if (isLas || isZw) dzis++;
    if (isLas) las++;
    if (isLas && isZw) oba++;
    if (isLas && h.terenBazowy === TerenBazowy.Wzgorza) wzg++;
  }
  tLad += lad; tDzis += dzis; tLas += las; tOba += oba; tWzg += wzg;
  console.log(`${String(seed).padStart(6)} | ${String(lad).padStart(4)} | ${String(dzis).padStart(14)} | ${String(las).padStart(9)} | ${String(oba).padStart(9)} | ${String(wzg).padStart(14)} | ${(100*las/lad).toFixed(1)}%`);
}
console.log(`RAZEM  | ${tLad} | ${tDzis} | ${tLas} | ${tOba} | ${tWzg} | ${(100*tLas/tLad).toFixed(1)}%`);
ok(tLas > 0, `wariant „tylko Las" NIE jest martwy (${tLas} pol na ${SEEDS.length} mapach)`);
ok(tWzg > 0, `kryt.2 — las NA WZGORZU istnieje na mapach (${tWzg} pol)`);
ok(tOba === 0, `wariant „Las I zloze" = 0 pol (potwierdzone niezaleznie na ziarnach FC)`);
const strata = tDzis - tLas;
console.log(`  -> zawezenie odbiera ${strata} pol z ${tDzis} (${(100*strata/tDzis).toFixed(2)}%) — reszta to Las`);

console.log('\n=== B. P7 — ODTWORZENIE SEKWENCJI WYREBU Z main.ts (nie samo strip*) ===');
// main.ts:11908-11912 (gracz, finishClearing) oraz :28905-28906 (AI):
//     hex.nakladka = Nakladka.Brak;
//     stripForestDependentImprovements(hexKey);
//   gdzie stripForestDependentImprovements (main.ts:11893) to:
//     const next = stripImprovementsWhenForestRemoved(prev);
//     if (next.length === prev.length) return;   <- brak zmiany => NIC nie zapisuje
function odtworzWyrab(hex, placedLayers) {
  hex.nakladka = Nakladka.Brak;                          // main.ts:11910 / :28905
  const prev = placedLayers;
  const next = stripImprovementsWhenForestRemoved(prev); // main.ts:11895
  if (next.length === prev.length) return prev;          // main.ts:11896 — wczesny return
  return next;
}
let znaleziono = 0, sprawdzono = 0;
for (const seed of SEEDS) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  for (const [k, h] of Object.entries(map.hexes)) {
    if (h.nakladka !== Nakladka.Las) continue;
    sprawdzono++;
    const hex = { ...h };
    const po = odtworzWyrab(hex, ['oboz_lowiecki']);
    if (po.includes('oboz_lowiecki') && hex.nakladka !== Nakladka.Las) znaleziono++;
    if (sprawdzono >= 200) break;
  }
  if (sprawdzono >= 200) break;
}
console.log(`  heksy Las poddane sekwencji wyrebu: ${sprawdzono}; oboz ZOSTAL poza lasem na: ${znaleziono}`);
ok(znaleziono === 0, 'P7 po wyrebie lasu oboz NIE zostaje na heksie bez lasu', `zostal na ${znaleziono}/${sprawdzono}`);

console.log('\n=== C. czy po wyrebie taki oboz da sie POSTAWIC PONOWNIE (kontrola gate\'ow) ===');
const map0 = M.generateMap(36, 28, 777, 'kontynenty');
const lasHex = Object.values(map0.hexes).find(h => h.nakladka === Nakladka.Las);
const poWyrebie = { ...lasHex, nakladka: Nakladka.Brak };
const impact = M.computeImprovementBuildImpact('oboz_lowiecki', poWyrebie, [], { pracaPool: 999 });
ok(impact === null, 'gate commitu: na heksie po wyrebie NOWEGO obozu nie postawisz (impact==null)', 'impact=' + JSON.stringify(impact));

console.log(`\noboz-lowiecki-fc-balans: ${pass} passed, ${fail} failed`);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}
process.exit(fail ? 1 : 0);
