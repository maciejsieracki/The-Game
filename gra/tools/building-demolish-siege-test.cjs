'use strict';
/**
 * building-demolish-siege-test.cjs -- R-WEB-BUILDING-DEMOLISH-Q1 runda 3 (odp. 28a właściciela).
 *
 * Kontrakt:
 *  (1) Miasto oblężone (flaga City.oblegane, jedyne źródło prawdy: city-siege-state.ts) -> wyburzenie
 *      odmówione: removed=false, blocked='siege', zero zmian w builtByCity i w surowcach.
 *  (2) Dotyczy KAŻDEGO budynku bez wyjątków: zwykłego, Mennicy, Pałacu, murów.
 *  (3) Miasto nieoblężone -> wyburzenie działa jak dotąd (zwrot 50%).
 *  (4) Oblężenie innego miasta nie blokuje wyburzenia w tym mieście.
 *  (5) Mutacje czerwone: wersja bez sprawdzenia oblężenia MUSI wyburzyć w mieście oblężonym;
 *      wersja odwrócona MUSI wyburzyć w mieście nieoblężonym jako odmowę (test wykrywa obie).
 *  (6) Okablowanie UI: przycisk „Wyburz” nieaktywny przy oblężeniu.
 *
 * Run from gra/:  node tools/building-demolish-siege-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[building-demolish-siege-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(GRA, 'src/game');
const SRC_MODULE = path.resolve(SRC_DIR, 'building-demolish.ts');

// Bundluje moduł ze ścieżki (tymczasowy wejściowy plik tylko w tools/ -- sprzątany po buildzie).
function bundle(tag, moduleSrcPath) {
  const entry = path.join(__dirname, `.building-demolish-siege-${tag}-entry.ts`);
  const outfile = path.join(__dirname, `.building-demolish-siege-${tag}-bundle.cjs`);
  fs.writeFileSync(entry, `export { demolishBuilding, isDemolishBlockedBySiege, DEMOLISH_SIEGE_BLOCK_PL } from ${JSON.stringify(moduleSrcPath)};\n`);
  try {
    esbuild.buildSync({ entryPoints: [entry], bundle: true, format: 'cjs', platform: 'node', outfile, logLevel: 'silent', absWorkingDir: GRA });
  } finally {
    try { fs.unlinkSync(entry); } catch (_) { /* ignore */ }
  }
  const lib = require(outfile);
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
  return lib;
}

const srcText = fs.readFileSync(SRC_MODULE, 'utf8');
const guardLine = "if (isDemolishBlockedBySiege(state.cities, cityId)) return { removed: false, refund: {}, blocked: 'siege' };";
const guardCount = srcText.split(guardLine).length - 1;
const mutantA = srcText.replace(guardLine, '');
const mutantB = srcText.replace(guardLine, "if (!isDemolishBlockedBySiege(state.cities, cityId)) return { removed: false, refund: {}, blocked: 'siege' };");
const MUT_A = path.join(SRC_DIR, '.building-demolish-mutA.ts');
const MUT_B = path.join(SRC_DIR, '.building-demolish-mutB.ts');

const lib = bundle('real', SRC_MODULE);
const { demolishBuilding, isDemolishBlockedBySiege, DEMOLISH_SIEGE_BLOCK_PL } = lib;

let libA = null;
let libB = null;
fs.writeFileSync(MUT_A, mutantA);
fs.writeFileSync(MUT_B, mutantB);
try {
  libA = bundle('mutA', MUT_A);
  libB = bundle('mutB', MUT_B);
} finally {
  try { fs.unlinkSync(MUT_A); } catch (_) { /* ignore */ }
  try { fs.unlinkSync(MUT_B); } catch (_) { /* ignore */ }
}

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mkState(oblegane) {
  return {
    cities: [
      { id: 'stolica', ownerId: 1, surowce: { drewno: 0, kamien: 0, cegla: 0 }, oblegane },
      { id: 'inne', ownerId: 1, surowce: { drewno: 0 }, oblegane: false },
    ],
    builtByCity: new Map([
      ['stolica', ['mennica', 'stolarnia', 'palac', 'mury']],
      ['inne', ['mennica']],
    ]),
  };
}
const snap = (st) => JSON.stringify({ c: st.cities, b: [...st.builtByCity.entries()] });

console.log('[1] Miasto oblężone -> wyburzenie odmówione, zero zmian');
{
  const st = mkState(true);
  const before = snap(st);
  const r = demolishBuilding(st, 'stolica', 'stolarnia');
  check('oblężone: removed=false, blocked=siege', r.removed === false && r.blocked === 'siege', r);
  check('oblężone: stan (budynki + surowce) bez zmian', snap(st) === before);
  check('oblężone: brak zwrotu', eq(r.refund, {}), r.refund);
}

console.log('[2] Bez wyjątków: Mennica, Pałac, mury w oblężonym mieście też odmówione');
{
  for (const id of ['mennica', 'palac', 'mury']) {
    const st = mkState(true);
    const r = demolishBuilding(st, 'stolica', id);
    check(`oblężone: ${id} odmówione`, r.removed === false && r.blocked === 'siege' && st.builtByCity.get('stolica').includes(id), r);
  }
}

console.log('[3] Miasto nieoblężone -> wyburzenie działa (zwrot 50%)');
{
  const st = mkState(false);
  const r = demolishBuilding(st, 'stolica', 'stolarnia');
  check('nieoblężone: removed=true, bez blocked', r.removed === true && r.blocked === undefined, r);
  check('nieoblężone: budynek usunięty', !st.builtByCity.get('stolica').includes('stolarnia'));
  const poolDrewno = st.cities.reduce((a, c) => a + (c.surowce.drewno ?? 0), 0);
  check('nieoblężone: zwrot do puli ownera (stolarnia 50 drewna -> 25, suma miast ownera)', poolDrewno === 25 && eq(r.refund, { drewno: 25 }), [st.cities.map(c => c.surowce), r.refund]);
  const st2 = mkState(false);
  const rm = demolishBuilding(st2, 'stolica', 'mennica');
  check('nieoblężone: Mennica wyburzalna', rm.removed === true && !st2.builtByCity.get('stolica').includes('mennica'));
}

console.log('[4] Oblężenie innego miasta nie blokuje tego miasta');
{
  const st = mkState(false);
  st.cities[1].oblegane = true;
  const r = demolishBuilding(st, 'stolica', 'stolarnia');
  check('inne miasto oblężone, stolica wolna: wyburzenie działa', r.removed === true, r);
  const r2 = demolishBuilding(st, 'inne', 'mennica');
  check('miasto oblężone: wyburzenie odmówione', r2.removed === false && r2.blocked === 'siege', r2);
}

console.log('[5] Predykat i komunikat');
{
  check('isDemolishBlockedBySiege: oblężone -> true', isDemolishBlockedBySiege(mkState(true).cities, 'stolica') === true);
  check('isDemolishBlockedBySiege: nieoblężone -> false', isDemolishBlockedBySiege(mkState(false).cities, 'stolica') === false);
  check('komunikat PL: „Nie można wyburzać podczas oblężenia”', DEMOLISH_SIEGE_BLOCK_PL === 'Nie można wyburzać podczas oblężenia');
}

console.log('[6] Mutacje czerwone (test MUSI je wykryć)');
{
  const stA = mkState(true);
  const rA = libA.demolishBuilding(stA, 'stolica', 'stolarnia');
  check('mutacja A (brak guarda) wyburza w oblężonym -> test [1] by padł', rA.removed === true, rA);
  const rB1 = libB.demolishBuilding(mkState(true), 'stolica', 'stolarnia');
  const rB2 = libB.demolishBuilding(mkState(false), 'stolica', 'stolarnia');
  check('mutacja B (odwrócona) blokuje nieoblężone -> test [3] by padł', rB2.removed === false && rB2.blocked === 'siege', rB2);
  check('mutacja B nie blokuje oblężonego -> test [1] by padł', rB1.removed === true, rB1);
  check('guard obecny dokładnie raz w module źródłowym', guardCount === 1, guardCount);
}

console.log('[7] Okablowanie UI: przycisk nieaktywny przy oblężeniu');
{
  const panel = fs.readFileSync(path.resolve(GRA, 'src/ui/cityPanel.ts'), 'utf8');
  check('cityPanel: isDemolishBlockedBySiege -> demoBtn.disabled', /isDemolishBlockedBySiege\(\[city\], city\.id\)[\s\S]{0,200}demoBtn\.disabled = true/.test(panel));
  check('cityPanel: podpowiedź = DEMOLISH_SIEGE_BLOCK_PL', panel.includes('demoBtn.title = DEMOLISH_SIEGE_BLOCK_PL'));
  check('cityPanel: klik przy oblężeniu nie otwiera potwierdzenia', /if \(isDemolishBlockedBySiege\(\[city\], city\.id\)\) return;[\s\S]{0,120}demolishRefundFor/.test(panel));
}

console.log('');
console.log('RESULT: ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail === 0 ? 0 : 1);
