'use strict';
/**
 * unit-replace-archer-slinger-test.cjs -- R-WEB-DATA-REPLACE-ARCHER-TO-SLINGER-Q1
 * Łucznik (Kamień, Typ=Distance) może zostać zastąpiony przez Procarza (Brąz, Typ=Slinger)
 * w mechanizmie "Zastąp" (gracz i AI, te same reguły). Run from gra/:
 *   node tools/unit-replace-archer-slinger-test.cjs
 *
 * Testuje REALNE funkcje (availableReplacementsFor z production.ts, bundlowane esbuild-em)
 * na REALNYM data/units.json. Bez regexów po źródle.
 *   1. Brąz + koszary + drewno: Łucznik -> zawiera Procarz, koszt > 0.
 *   2. Kamień (Procarz niedostępny epoką): Łucznik -> NIE zawiera Procarza.
 *   3. Inkowie w Brązie: Łucznik -> zawiera Procarz (Huaracoc); Rzym -> nie zawiera Huaracoc.
 *   4. Brak drewna w magazynie (bramka surowca) -> Procarz znika.
 *   5. Mutacja KOPII danych (pole Łucznika cofnięte do "—") -> Procarz znika.
 *   6. Kierunek jednokierunkowy: Procarz -> Łucznik NIE jest zamiennikiem.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[unit-replace-archer-slinger-test] esbuild not found. Run: npm ci (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.unit-replace-archer-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-replace-archer-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, "export { availableReplacementsFor } from '../src/game/production';\n", 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: BUNDLE_FILE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[unit-replace-archer-slinger-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}
const { availableReplacementsFor } = require(BUNDLE_FILE);
const unitsJson = require('../data/units.json');

let passed = 0, failed = 0;
function check(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + (extra ? ' -- ' + extra : '')); }
}
const TECHS = ['Łucznictwo', 'Brązownictwo', 'Hutnictwo żelaza'];
const idsOf = (data, unit, ctx) =>
  availableReplacementsFor(unit, data, TECHS, ctx).map(i => i.id);

const baseCtx = (epoch, nacja, drewno = 10) => ({
  epoch,
  civUnitNacja: nacja,
  civBonusy: [],
  builtBuildingIds: epoch >= 2 ? ['koszary'] : [],
  empireResourceStock: { braz: 10, zelazo: 10, drewno },
});

const DATA = { buildings: [], units: Object.values(unitsJson) };

console.log('\n[unit-replace-archer-slinger-test] Running tests...\n');

console.log('1. Brąz: Łucznik -> Procarz');
{
  const items = availableReplacementsFor('Łucznik', DATA, TECHS, baseCtx(2, 'Rzym'));
  const procarz = items.find(i => i.id === 'Procarz');
  check(!!procarz, 'Procarz jest na liście zamienników Łucznika w epoce Brązu', JSON.stringify(items.map(i => i.id)));
  check(!!procarz && procarz.kind === 'jednostka' && typeof procarz.koszt === 'number' && procarz.koszt > 0,
    'Procarz ma kind=jednostka i dodatni pełny koszt', JSON.stringify(procarz));
}

console.log('2. Kamień: Procarz niedostępny epoką');
{
  const ids = idsOf(DATA, 'Łucznik', baseCtx(1, 'Rzym'));
  check(!ids.includes('Procarz'), 'w epoce Kamienia Procarz NIE jest zamiennikiem Łucznika', JSON.stringify(ids));
}

console.log('3. Nacja: Procarz (Huaracoc) tylko dla Inków');
{
  const inca = idsOf(DATA, 'Łucznik', baseCtx(2, 'Inkowie'));
  const rome = idsOf(DATA, 'Łucznik', baseCtx(2, 'Rzym'));
  check(inca.includes('Procarz (Huaracoc)'), 'Inkowie w Brązie: Procarz (Huaracoc) na liście', JSON.stringify(inca));
  check(!rome.includes('Procarz (Huaracoc)'), 'Rzym: Procarz (Huaracoc) NIE jest na liście');
}

console.log('4. Bramka surowca: brak drewna -> brak Procarza');
{
  const ids = idsOf(DATA, 'Łucznik', baseCtx(2, 'Rzym', 0));
  check(!ids.includes('Procarz'), 'bez drewna w magazynie Procarz znika z listy (bramka surowca)');
}

console.log('5. Mutacja kopii danych: pole Łucznika cofnięte do "—"');
{
  const mutated = unitsJson.map(u => (u.Jednostka === 'Łucznik' ? { ...u, 'Zastąp specjalnie': '—' } : u));
  const ids = idsOf({ buildings: [], units: mutated }, 'Łucznik', baseCtx(2, 'Rzym'));
  check(!ids.includes('Procarz'), 'po cofnięciu wpisu (mutacja kopii) Procarz znika -- test wykrywa usunięcie zmiany');
}

console.log('6. Kierunek jednokierunkowy');
{
  const ids = idsOf(DATA, 'Procarz', baseCtx(2, 'Rzym'));
  check(!ids.includes('Łucznik'), 'Procarz NIE może zostać zamieniony z powrotem na Łucznika');
}

console.log(`\n[unit-replace-archer-slinger-test] ${passed} OK, ${failed} FAIL`);
try { fs.unlinkSync(ENTRY_FILE); fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
process.exit(failed ? 1 : 0);
