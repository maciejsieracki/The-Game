'use strict';
/**
 * eko-tech-paczka1-test.cjs — regresja EKO-TECH Paczka 1 (2026-07-04)
 * node tools/eko-tech-paczka1-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.eko-tech-p1-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eko-tech-p1-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  canResearch, availableTechs, createResearchState, buildingGateMet,
  resolveRequiredBuildingId,
} from '../src/game/research';
export {
  availableProduction, applyCompletedBuildingIds, isBuildingSupersededByUpgrade,
} from '../src/game/production';
export { setPlayerResearchTarget, availableTechs as playerAvailableTechs, createPlayerState } from '../src/game/playerState';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const techData = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8')).technologie;
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  PASS:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

const gateEmpty = { empireBuiltIds: new Set(), buildings };
const gateWithCeg = { empireBuiltIds: new Set(['cegielnia']), buildings };

// T-TECH-7: Pismo wymaga Cegielni
// Fixture (klasa A, R-WEB-TEST-DEBT-PREEXISTING-B-Q1): Pismo (Brąz, Poziom 4) ma wymagania
// "Garncarstwo + Wymiana" oraz Zasadę 2 (epochTierGateMet: wszystkie niższe Poziomy tej
// epoki zbadane). Stary fixture miał tylko Garncarstwo, więc test nie mierzył bramki Cegielni.
// Teraz: wszystkie pozostałe technologie zbadane — różnicuje wyłącznie bramka budynku.
const allTechsButPismo = techData.map(t => t.Technologia).filter(n => n !== 'Pismo');
{
  const st = M.createResearchState();
  st.ukonczone = allTechsButPismo;
  ok(!M.canResearch(st, techData, 'Pismo', gateEmpty), 'Pismo blocked bez Cegielni (gate)');
  ok(M.canResearch(st, techData, 'Pismo', gateWithCeg), 'Pismo OK z Cegielnia');
  const avail = M.availableTechs(st, techData, gateWithCeg).filter(t => t === 'Pismo');
  ok(avail.includes('Pismo'), 'Pismo on available list z gate');
}

// T-TECH-8: upgrade łańcucha budynków (upgradeFrom) zastępuje poprzednika.
// Fixture (klasa A, R-WEB-TEST-DEBT-PREEXISTING-B-Q1): Świątynia NIE ma już upgradeFrom
// w buildings.json; wymaga Kamiennych kręgów W TYM MIEŚCIE jako warunku wstępnego
// (building-resource-gate.ts CITY_BUILDING_PREREQ: swiatynia: 'kamienne_kregi'; przywrócony
// wymóg wcześniejszego budynku, commit a167fc0b1). Kręgi zostają obok Świątyni.
// Mechanizm T-TECH-8 sprawdzamy na prawdziwej parze upgradeFrom: spichlerz -> spichlerz_ii.
{
  const built = ['kamienne_kregi'];
  ok(!M.isBuildingSupersededByUpgrade('kamienne_kregi', built, buildings), 'kręgi not superseded yet');
  const withTemple = M.applyCompletedBuildingIds(built, 'swiatynia', buildings);
  ok(withTemple.includes('swiatynia') && withTemple.includes('kamienne_kregi'), 'Świątynia nie zastępuje kręgów (wymóg, nie upgrade)');
  ok(!M.isBuildingSupersededByUpgrade('kamienne_kregi', withTemple, buildings), 'kręgi nie są superseded przez Świątynię');
  const spich = M.applyCompletedBuildingIds(['spichlerz'], 'spichlerz_ii', buildings);
  ok(spich.includes('spichlerz_ii') && !spich.includes('spichlerz'), 'upgrade replaces poprzednika (spichlerz -> spichlerz_ii)');
  ok(M.isBuildingSupersededByUpgrade('spichlerz', spich, buildings), 'poprzednik superseded after upgrade');
}

// ABC-9 (zaktualizowany 2026-07-23): Mielerz USUNIETY calkowicie (decyzja Macieja --
// paliwo zamydlalo sprawe, konwertery biora DREWNO 1:1). Test dostosowany do nowego
// modelu: sprawdzamy, ze Stolarnia (ta sama bramka techUnlock="Obróbka drewna",
// jedyny budynek tej bramki, ktory PRZETRWAL) nadal odblokowuje sie poprawnie, oraz
// ze Mielerz juz NIGDZIE sie nie pojawia w produkcji (regresja usuniecia).
// Uwaga: activeResourceLabels:['Drewno'] jest WYMAGANE tu -- Stolarnia (epoka 1) ma
// bramke eraAccessLabels(1)=['Drewno'] (building-resource-gate.ts); bez tego kontekstu
// ZADEN budynek epoki 1 nie przejdzie bramki (to samo dotyczylo dawniej Mielerza --
// PRE-ISTNIEJACY brak w oryginalnym teście, niezwiazany z usunieciem paliwa/Mielerza).
{
  const items = M.availableProduction(
    { id: 'c1', name: 'X', ownerId: 0, population: 3, q: 0, r: 0 },
    { buildings, units: [] },
    ['Obróbka drewna'],
    // Pola kontekstu: empireActiveResourceLabels / empireResourceStock (production.ts:491-496).
    // Stary fixture używał nieistniejącej nazwy activeResourceLabels (ignorowana) — klasa A.
    // Stolarnia ma koszt 25 drewna w magazynie państwa (buildings.json), więc stock też potrzebny.
    { epoch: 1, builtBuildingIds: [], empireActiveResourceLabels: ['Drewno'], empireResourceStock: { drewno: 100 } },
  );
  ok(items.some(i => i.id === 'stolarnia'), 'Stolarnia in production after Obróbka drewna');
  ok(!items.some(i => i.id === 'mielerz'), 'Mielerz NIE istnieje juz w produkcji (usuniety 2026-07-23)');
  ok(!buildings.some(b => b.id === 'mielerz'), 'Mielerz NIE istnieje juz w buildings.json');
}

// playerState gate
{
  const ps = M.createPlayerState();
  for (const t of allTechsButPismo) ps.zbadane.add(t);
  ok(!M.setPlayerResearchTarget(ps, 'Pismo', techData, gateEmpty), 'setPlayerResearchTarget rejects bez Cegielni');
  ok(M.setPlayerResearchTarget(ps, 'Pismo', techData, gateWithCeg), 'setPlayerResearchTarget OK z Cegielnia');
}

console.log(`\neko-tech-paczka1: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
