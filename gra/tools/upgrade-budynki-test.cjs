'use strict';
/**
 * upgrade-budynki-test.cjs — regresja UPGRADE budynków (2026-07-05)
 * node tools/upgrade-budynki-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.upgrade-budynki-entry.ts');
const BUNDLE = path.resolve(__dirname, '.upgrade-budynki-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  availableProduction, applyCompletedBuildingIds, isBuildingSupersededByUpgrade,
} from '../src/game/production';
export {
  upgradeProductionDisplayName, isBuildingSuppressedFromProduction,
  upgradeChainSteps, cityHasBibliotekaLine, cityHasAmfiteatrLine, cityHasMurLine,
} from '../src/game/building-upgrades';
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
const terrain = JSON.parse(fs.readFileSync(path.join(GRA, 'data/terrain-improvements.json'), 'utf8'));

const city = { id: 'c1', name: 'X', ownerId: 0, population: 5, q: 0, r: 0 };
const prodData = { buildings, units: [] };

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  PASS:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

// ABC-21: Teatr ukryty
{
  const teatr = buildings.find(b => b.id === 'teatr');
  ok(M.isBuildingSuppressedFromProduction(teatr), 'Teatr suppressed from production');
  const items = M.availableProduction(city, prodData, ['Filozofia'], {
    epoch: 3, builtBuildingIds: ['biblioteka'],
  });
  ok(!items.some(i => i.id === 'teatr'), 'Teatr not in production list');
}

// ABC-20: Port → Port wielki
{
  const pw = buildings.find(b => b.id === 'port_wielki');
  ok(pw && pw.upgradeFrom === 'port', 'port_wielki upgradeFrom port');
  const label = M.upgradeProductionDisplayName(pw, buildings);
  ok(label.includes('Rozbuduj') && label.includes('Port'), 'Rozbuduj label port');
  // TEMAT 8 Q2 (2026-07-24): Port/Port wielki wymagaja ctx.cityHasCoastOrRiver (dostep do
  // wody per miasto, production.ts WATER_ACCESS_BUILDING_IDS) -- bez tego bramka blokuje.
  const items = M.availableProduction(city, prodData, ['Inżynieria'], {
    epoch: 3, builtBuildingIds: ['port'], cityHasCoastOrRiver: true,
  });
  ok(items.some(i => i.id === 'port_wielki'), 'port_wielki available with port built');
  ok(!items.some(i => i.id === 'port'), 'port hidden when not superseded but built — still in built');
}

// GRUPY-BUDYNKOW (Maciej 2026-07-25, likwidacja "awansu bocznego"): Mury + Cytadela
// (fort) TERAZ NIEZALEZNE budynki -- upgradeFrom usuniety, stoja w miescie obok siebie.
// Obrona miasta wylacznie procentowa (miasto-params.json), baza.obrona pozostaje 0 dla
// obu -- patrz handoff §7 / buildings.json uwagi.
// REGRESJA-KOLEJNOSC (Maciej 2026-07-25, wieczor): usuniecie upgradeFrom skasowalo PRZY
// OKAZJI wymog kolejnosci budowy, ktorego nikt nie planowal usuwac -- przywrocony przez
// CITY_BUILDING_PREREQ (building-resource-gate.ts): Cytadela wymaga wybudowanych Murow
// w tym samym miescie (patrz tez tools/prereq-budynkow-test.cjs, pelne pokrycie bramki).
{
  const fort = buildings.find(b => b.id === 'fort');
  ok(fort.upgradeFrom === undefined, 'fort NIE ma juz upgradeFrom (niezalezny od Murow)');
  ok(fort.baza.obrona === 0, 'fort baza.obrona = 0 (obrona wylacznie procentowa, miasto-params.json)');
  const items = M.availableProduction(city, prodData, ['Inżynieria'], {
    epoch: 3, builtBuildingIds: ['mury'],
  });
  ok(items.some(i => i.id === 'fort'), 'fort dostepny gdy Mury juz zbudowane');
  const noMury = M.availableProduction(city, prodData, ['Inżynieria'], {
    epoch: 3, builtBuildingIds: [],
  });
  ok(!noMury.some(i => i.id === 'fort'), 'fort NIEDOSTEPNY bez Murow (REGRESJA-KOLEJNOSC, CITY_BUILDING_PREREQ)');
  const after = M.applyCompletedBuildingIds(['mury'], 'fort', buildings);
  ok(after.includes('fort') && after.includes('mury'), 'po ukonczeniu fort: Mury ZOSTAJA na builtIds (nie sa zastepowane)');
  ok(M.cityHasMurLine(after), 'cityHasMurLine z obydwoma budynkami w miescie');
}

// GRUPY-BUDYNKOW: Biblioteka + Akademia TERAZ niezalezne (upgradeFrom usuniety).
// Wartosci rozdzielone, zeby wklad Biblioteki nie liczyl sie w Akademii drugi raz:
// Nauka 9=3(Biblioteka)+6(Akademia), Kultura 7=2(Biblioteka)+5(Akademia).
{
  const bib = buildings.find(b => b.id === 'biblioteka');
  const ak = buildings.find(b => b.id === 'akademia');
  ok(ak.upgradeFrom === undefined, 'akademia NIE ma juz upgradeFrom (niezalezna od Biblioteki)');
  ok(ak.baza.nauka === 6 && ak.baza.kultura === 5, 'akademia baza rozdzielona (6 nauki, 5 kultury -- bez wkladu Biblioteki)');
  ok(bib.baza.nauka === 3 && bib.baza.kultura === 2, 'biblioteka baza niezmieniona (3 nauki, 2 kultury)');
  ok(bib.baza.nauka + ak.baza.nauka === 9, 'suma Nauki w miescie z obydwoma budynkami = 9 (jak przed rozdzieleniem)');
  ok(bib.baza.kultura + ak.baza.kultura === 7, 'suma Kultury w miescie z obydwoma budynkami = 7 (jak przed rozdzieleniem)');
  const after = M.applyCompletedBuildingIds(['biblioteka'], 'akademia', buildings);
  ok(after.includes('akademia') && after.includes('biblioteka'), 'po ukonczeniu akademia: Biblioteka ZOSTAJE na builtIds (nie jest zastepowana)');
  ok(M.cityHasBibliotekaLine(after), 'cityHasBibliotekaLine z obydwoma budynkami');
  ok(M.cityHasAmfiteatrLine(after), 'cityHasAmfiteatrLine z akademia (merge teatru bez zmian)');
}

// GRUPY-BUDYNKOW: Koszary + Akademia wojskowa TERAZ niezalezne (upgradeFrom usuniety).
// Praca rozdzielona: 5=2(Koszary)+3(Akademia wojskowa).
{
  const kosz = buildings.find(b => b.id === 'koszary');
  const aw = buildings.find(b => b.id === 'akademia_wojskowa');
  ok(aw.upgradeFrom === undefined, 'akademia_wojskowa NIE ma juz upgradeFrom (niezalezna od Koszar)');
  ok(aw.baza.praca === 3, 'akademia_wojskowa baza.praca rozdzielona (3 -- bez wkladu Koszar)');
  ok(kosz.baza.praca === 2, 'koszary baza.praca niezmieniona (2)');
  ok(kosz.baza.praca + aw.baza.praca === 5, 'suma Pracy w miescie z obydwoma budynkami = 5 (jak przed rozdzieleniem)');
  // REGRESJA-KOLEJNOSC (Maciej 2026-07-25, wieczor): Akademia wojskowa wymaga wybudowanych
  // Koszar w tym samym miescie (CITY_BUILDING_PREREQ) -- usuniecie upgradeFrom NIE mialo
  // znosic wymogu kolejnosci budowy, tylko relacje "zastepuje w builtIds".
  const items = M.availableProduction(city, prodData, ['Sztuka wojenna'], {
    epoch: 3, builtBuildingIds: [],
  });
  ok(!items.some(i => i.id === 'akademia_wojskowa'), 'Akademia wojskowa NIEDOSTEPNA bez Koszar (REGRESJA-KOLEJNOSC)');
  const afterAw = M.applyCompletedBuildingIds(['koszary'], 'akademia_wojskowa', buildings);
  ok(afterAw.includes('koszary') && afterAw.includes('akademia_wojskowa'), 'po ukonczeniu akademia_wojskowa: Koszary ZOSTAJA na builtIds');

  // TEMAT 8 Q2 fix (GRUPY-BUDYNKOW): Warsztat oblezniczy wymaga Koszar LUB Akademii
  // wojskowej w miescie (CITY_BUILDING_PREREQ, building-resource-gate.ts) -- musi dzialac
  // TEZ gdy miasto ma WYLACZNIE Akademie wojskowa (mozliwe od 2026-07-25, bo Akademia
  // wojskowa juz nie wymaga Koszar zbudowanych wczesniej).
  const withOnlyAw = M.availableProduction(city, prodData, ['Oblężnictwo'], {
    epoch: 3, builtBuildingIds: ['akademia_wojskowa'],
  });
  ok(withOnlyAw.some(i => i.id === 'warsztat_oblezniczy'), 'Warsztat oblezniczy dostepny z SAMA Akademia wojskowa (bez Koszar)');
  const withOnlyKoszary = M.availableProduction(city, prodData, ['Oblężnictwo'], {
    epoch: 3, builtBuildingIds: ['koszary'],
  });
  ok(withOnlyKoszary.some(i => i.id === 'warsztat_oblezniczy'), 'Warsztat oblezniczy dostepny z SAMYMI Koszarami');
  const withNeither = M.availableProduction(city, prodData, ['Oblężnictwo'], {
    epoch: 3, builtBuildingIds: [],
  });
  ok(!withNeither.some(i => i.id === 'warsztat_oblezniczy'), 'Warsztat oblezniczy NIEDOSTEPNY bez Koszar ani Akademii wojskowej');
}

// GRUPY-BUDYNKOW: Kamienne kręgi + Świątynia TERAZ niezalezne (upgradeFrom usuniety).
// Kultura/Zadowolenie rozdzielone: 3=1(Kamienne kręgi)+2(Świątynia) dla obu pol.
{
  const kregi = buildings.find(b => b.id === 'kamienne_kregi');
  const sw = buildings.find(b => b.id === 'swiatynia');
  ok(sw.upgradeFrom === undefined, 'swiatynia NIE ma juz upgradeFrom (niezalezna od Kamiennych kręgów)');
  ok(sw.baza.kultura === 2 && sw.baza.zadowolenie === 2, 'swiatynia baza rozdzielona (2 kultury, 2 zadowolenia)');
  ok(kregi.baza.kultura === 1 && kregi.baza.zadowolenie === 1, 'kamienne_kregi baza niezmieniona (1 kultury, 1 zadowolenia)');
  ok(kregi.baza.kultura + sw.baza.kultura === 3, 'suma Kultury z obydwoma budynkami = 3 (jak przed rozdzieleniem)');
  ok(kregi.baza.zadowolenie + sw.baza.zadowolenie === 3, 'suma Zadowolenia z obydwoma budynkami = 3 (jak przed rozdzieleniem)');
  const afterSw = M.applyCompletedBuildingIds(['kamienne_kregi'], 'swiatynia', buildings);
  ok(afterSw.includes('kamienne_kregi') && afterSw.includes('swiatynia'), 'po ukonczeniu swiatynia: Kamienne kregi ZOSTAJA na builtIds');
}

// Kuźnia → Wielka kuźnia
{
  const wk = buildings.find(b => b.id === 'wielka_kuznia');
  ok(wk.upgradeFrom === 'kuznia_zelaza', 'wielka_kuznia upgradeFrom kuznia_zelaza');
}

// ABC-23: Drogi brukowane prereq
{
  const drogi = techData.find(t => t.Technologia === 'Drogi brukowane');
  ok(drogi['Wymaga (prereq)'] === 'Inżynieria + Budownictwo', 'Drogi brukowane prereq ABC-23');
}

// ABC-24: droga brukowana tylko +2 ruch
{
  const bruk = terrain.droga_brukowana;
  ok(bruk.bonus_ruch === 2, 'bonus_ruch 2');
  ok(!bruk.bonus || Object.keys(bruk.bonus).length === 0, 'no handel bonus on bruk');
}

// upgrade chain depth (UPG-LOC max 3 — sanity). GRUPY-BUDYNKOW (Maciej 2026-07-25):
// swiatynia/akademia/fort/akademia_wojskowa NIE maja juz upgradeFrom -- lancuch to
// tylko one same (dlugosc 1), zgodnie z "przy budynkach bez upgradeFrom nie rozwija
// się nic" (task D). Lancuchy "w gore" zostaja nietkniete (port_wielki, palac_iii, ...).
{
  for (const id of ['swiatynia', 'akademia', 'fort', 'akademia_wojskowa']) {
    const chain = M.upgradeChainSteps(id, buildings);
    ok(chain.length === 1, `chain ${id} length ${chain.length} === 1 (niezalezny budynek, bez upgradeFrom)`);
  }
  for (const id of ['port_wielki', 'palac_iii', 'pretorium', 'wielka_kuznia', 'spichlerz_ii']) {
    const chain = M.upgradeChainSteps(id, buildings);
    ok(chain.length >= 2 && chain.length <= 3, `chain ${id} length ${chain.length} in 2..3`);
  }
}

console.log(`\nupgrade-budynki-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
