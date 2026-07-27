'use strict';
/**
 * grupy-budynkow-test.cjs — regresja GRUPY-BUDYNKOW (decyzja Macieja 2026-07-25):
 *   A. Likwidacja "awansu bocznego" — Mury+Cytadela, Biblioteka+Akademia,
 *      Koszary+Akademia wojskowa, Kamienne kręgi+Świątynia stoją w mieście
 *      OBOK siebie (upgradeFrom usunięty); łańcuchy "w górę" zostają nietknięte.
 *   B. Rozdzielenie wartości drugiego budynku w każdej z czterech par, żeby
 *      wkład pierwszego nie liczył się dwa razy.
 *   C. Grupowanie 38 budynków w osiem grup dziedzinowych (pole `grupa` w
 *      buildings.json / BuildingDef, data-driven — nie hardkod w UI).
 *   D. Rozwijana lista "co jest pod spodem" tylko przy awansie w górę
 *      (upgradeCompositionLines / upgradeChainSteps z building-upgrades.ts).
 *
 * Run from gra/:  node tools/grupy-budynkow-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.grupy-budynkow-entry.ts');
const BUNDLE = path.resolve(__dirname, '.grupy-budynkow-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  upgradeChainSteps, upgradeCompositionLines, buildingStatSummaryLines,
  groupBuiltBuildingIds, BUILDING_GROUP_ORDER, BUILDING_GROUP_FALLBACK,
} from '../src/game/building-upgrades';
export {
  citySoftStatBonusPercent, cumulativeMnoznikForBuildingId,
} from '../src/game/unit-building-bonuses';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const byId = new Map(buildings.map(b => [b.id, b]));

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; }
  else { fail++; console.error('  FAIL:', m); }
}

// ===========================================================================
// C. Każdy budynek ma przypisaną grupę — jedną z ośmiu dozwolonych.
// ===========================================================================
{
  // KOSZTY-SUROWCOWE (Maciej 2026-07-27): 40 budynków od dodania Wielkiej odlewni
  // (było 39 po Baszcie 41B).
  ok(buildings.length === 40, `buildings.json ma 40 budynków (ma: ${buildings.length})`);
  ok(M.BUILDING_GROUP_ORDER.length === 8, 'BUILDING_GROUP_ORDER ma dokładnie 8 grup');
  const allowed = new Set(M.BUILDING_GROUP_ORDER);
  let missing = [];
  let unknownGroup = [];
  for (const b of buildings) {
    if (typeof b.grupa !== 'string' || b.grupa.trim().length === 0) missing.push(b.id);
    else if (!allowed.has(b.grupa)) unknownGroup.push(`${b.id}:${b.grupa}`);
  }
  ok(missing.length === 0, `wszystkie budynki mają pole grupa (brakuje: ${missing.join(', ')})`);
  ok(unknownGroup.length === 0, `grupa każdego budynku to jedna z 8 dozwolonych (poza listą: ${unknownGroup.join(', ')})`);

  // Rozkład przypisań zgodny z tabelą z zadania (kontrola liczności każdej grupy).
  // 'Wojsko i obrona' 5 -> 6 (Baszta dołącza obok Murów/Cytadeli, decyzja 41B).
  const expectedCounts = {
    'Prawo i administracja': 8,
    'Wojsko i obrona': 6,
    'Handel i pieniądz': 5,
    'Nauka i kultura': 4,
    'Wiara': 2,
    'Zdrowie': 3,
    'Produkcja surowców': 10,
    'Żywność': 2,
  };
  const counts = {};
  for (const b of buildings) counts[b.grupa] = (counts[b.grupa] ?? 0) + 1;
  for (const [g, n] of Object.entries(expectedCounts)) {
    ok(counts[g] === n, `grupa "${g}" ma ${n} budynków (ma: ${counts[g] ?? 0})`);
  }
  const totalAssigned = Object.values(counts).reduce((a, b) => a + b, 0);
  ok(totalAssigned === 40, `suma budynków we wszystkich grupach = 40 (ma: ${totalAssigned})`);
}

// ===========================================================================
// A. Cztery pary "awansu bocznego" NIE mają już upgradeFrom; sześć łańcuchów
//    "w górę" mają — nietknięte.
// ===========================================================================
{
  for (const id of ['fort', 'akademia', 'akademia_wojskowa', 'swiatynia']) {
    const b = byId.get(id);
    ok(b.upgradeFrom === undefined, `${id}: upgradeFrom usunięty (para boczna)`);
  }
  const upwardChains = {
    palac_ii: 'palac',
    palac_iii: 'palac_ii',
    dwor_zarzadcy: 'dom_starszyzny',
    pretorium: 'dwor_zarzadcy',
    // KOSZTY-SUROWCOWE (Maciej 2026-07-25, ZADANIE 3): ogniwo naprawione --
    // kuznia_zelaza teraz zastępuje kuznia (Kuźnia brązu → Kuźnia żelaza,
    // jak Pałac), a nie stoi obok niej.
    kuznia_zelaza: 'kuznia',
    wielka_kuznia: 'kuznia_zelaza',
    spichlerz_ii: 'spichlerz',
    port_wielki: 'port',
    odlewnia_zelaza: 'odlewnia_brazu',
  };
  for (const [id, from] of Object.entries(upwardChains)) {
    ok(byId.get(id).upgradeFrom === from, `${id}: upgradeFrom === '${from}' (łańcuch w górę nietknięty)`);
  }
}

// ===========================================================================
// B. Rozdzielenie wartości — sumy w mieście z obiema parami niezmienione
//    względem stanu sprzed rozdzielenia.
// ===========================================================================
{
  const bib = byId.get('biblioteka'), aka = byId.get('akademia');
  ok(bib.baza.nauka + aka.baza.nauka === 9, `Biblioteka+Akademia: suma Nauki = 9 (ma: ${bib.baza.nauka + aka.baza.nauka})`);
  ok(bib.baza.kultura + aka.baza.kultura === 7, `Biblioteka+Akademia: suma Kultury = 7 (ma: ${bib.baza.kultura + aka.baza.kultura})`);
  ok(aka.baza.nauka === 6, 'Akademia baza.nauka rozdzielona = 6');
  ok(aka.baza.kultura === 5, 'Akademia baza.kultura rozdzielona = 5');

  const kosz = byId.get('koszary'), aw = byId.get('akademia_wojskowa');
  ok(kosz.baza.praca + aw.baza.praca === 5, `Koszary+Akademia wojskowa: suma Pracy = 5 (ma: ${kosz.baza.praca + aw.baza.praca})`);
  ok(aw.baza.praca === 3, 'Akademia wojskowa baza.praca rozdzielona = 3');

  const kregi = byId.get('kamienne_kregi'), sw = byId.get('swiatynia');
  ok(kregi.baza.kultura + sw.baza.kultura === 3, `Kamienne kręgi+Świątynia: suma Kultury = 3 (ma: ${kregi.baza.kultura + sw.baza.kultura})`);
  ok(kregi.baza.zadowolenie + sw.baza.zadowolenie === 3, `Kamienne kręgi+Świątynia: suma Zadowolenia = 3 (ma: ${kregi.baza.zadowolenie + sw.baza.zadowolenie})`);
  ok(sw.baza.kultura === 2, 'Świątynia baza.kultura rozdzielona = 2');
  ok(sw.baza.zadowolenie === 2, 'Świątynia baza.zadowolenie rozdzielona = 2');

  const fort = byId.get('fort'), mury = byId.get('mury');
  const stats = ['praca', 'pieniadz', 'zywnosc', 'nauka', 'kultura', 'zadowolenie', 'obrona', 'mnoznik'];
  for (const k of stats) {
    ok(fort.baza[k] === 0 && mury.baza[k] === 0, `Mury+Cytadela: baza.${k} = 0 dla obu (obrona miasta wyłącznie procentowa, nietknięte)`);
  }

  // Mnoznik (ścieżka B, unit-building-bonuses.ts) — z obydwoma budynkami RAZEM
  // w mieście: Koszary(20)+Akademia wojskowa(20) = 40%, +Warsztat oblężniczy(10) = 50%.
  const soft40 = M.citySoftStatBonusPercent(['koszary', 'akademia_wojskowa'], buildings);
  ok(soft40 === 40, `Koszary+Akademia wojskowa (oba w mieście): +40% parametry miękkie (ma: ${soft40})`);
  const soft50 = M.citySoftStatBonusPercent(['koszary', 'akademia_wojskowa', 'warsztat_oblezniczy'], buildings);
  ok(soft50 === 50, `+ Warsztat oblężniczy: +50% parametry miękkie (ma: ${soft50})`);
}

// ===========================================================================
// D. Rozwijana lista "co jest pod spodem" tylko przy awansie w górę.
// ===========================================================================
{
  // Pałac III rozwija dwoma poprzednikami: Pałac II, Pałac.
  const palacChain = M.upgradeChainSteps('palac_iii', buildings);
  ok(palacChain.length === 3, `Pałac III: łańcuch długości 3 (ma: ${palacChain.length})`);
  ok(palacChain.map(c => c.id).join(',') === 'palac,palac_ii,palac_iii', 'Pałac III: kolejność łańcucha palac→palac_ii→palac_iii');
  const palacLines = M.upgradeCompositionLines('palac_iii', buildings);
  ok(palacLines.length > 0, 'Pałac III: upgradeCompositionLines() rozwija coś (niepuste)');
  ok(palacLines.some(l => l.includes('Pałac') && l.includes('Pałac II')), 'Pałac III: linia łańcucha wymienia Pałac i Pałac II');

  // Pretorium rozwija dwoma poprzednikami: Dwór Zarządcy, Dom Starszyzny.
  const pretChain = M.upgradeChainSteps('pretorium', buildings);
  ok(pretChain.map(c => c.id).join(',') === 'dom_starszyzny,dwor_zarzadcy,pretorium', 'Pretorium: kolejność łańcucha dom_starszyzny→dwor_zarzadcy→pretorium');

  // Kuźnia żelaza rozwija Kuźnia brązu; Spichlerz II rozwija Spichlerz;
  // Port wielki rozwija Port; Odlewnia żelaza rozwija Odlewnię brązu.
  for (const [id, expectedPrev] of [
    ['kuznia_zelaza', 'kuznia'],
    ['spichlerz_ii', 'spichlerz'],
    ['port_wielki', 'port'],
    ['odlewnia_zelaza', 'odlewnia_brazu'],
  ]) {
    const chain = M.upgradeChainSteps(id, buildings);
    ok(chain.length === 2 && chain[0].id === expectedPrev, `${id}: rozwija poprzednika ${expectedPrev}`);
    const lines = M.upgradeCompositionLines(id, buildings);
    ok(lines.length > 0, `${id}: upgradeCompositionLines() niepuste (jest następcą)`);
  }

  const wielkaOdlewniaChain = M.upgradeChainSteps('wielka_odlewnia', buildings);
  ok(wielkaOdlewniaChain.length === 3, `Wielka odlewnia: łańcuch długości 3 (ma: ${wielkaOdlewniaChain.length})`);
  ok(wielkaOdlewniaChain.map(c => c.id).join(',') === 'odlewnia_brazu,odlewnia_zelaza,wielka_odlewnia',
    'Wielka odlewnia: kolejność odlewnia_brazu→odlewnia_zelaza→wielka_odlewnia');
  ok(M.upgradeCompositionLines('wielka_odlewnia', buildings).length > 0,
    'Wielka odlewnia: upgradeCompositionLines() niepuste');

  // Wielka Kuźnia rozwija DWOMA poprzednikami (Kuźnia żelaza, Kuźnia brązu) --
  // łańcuch pełny od naprawy ogniwa kuznia_zelaza->kuznia (ZADANIE 3), tak jak
  // Pałac III i Pretorium wyżej.
  const wielkaKuzniaChain = M.upgradeChainSteps('wielka_kuznia', buildings);
  ok(wielkaKuzniaChain.length === 3, `Wielka Kuźnia: łańcuch długości 3 (ma: ${wielkaKuzniaChain.length})`);
  ok(wielkaKuzniaChain.map(c => c.id).join(',') === 'kuznia,kuznia_zelaza,wielka_kuznia',
    'Wielka Kuźnia: kolejność łańcucha kuznia→kuznia_zelaza→wielka_kuznia');
  const wielkaKuzniaLines = M.upgradeCompositionLines('wielka_kuznia', buildings);
  ok(wielkaKuzniaLines.length > 0, 'Wielka Kuźnia: upgradeCompositionLines() niepuste (jest następcą)');

  // Budynki bez upgradeFrom (w tym cztery pary boczne + nowa Baszta) nie rozwijają nic.
  for (const id of ['akademia', 'fort', 'akademia_wojskowa', 'swiatynia', 'biblioteka', 'koszary', 'kamienne_kregi', 'mury', 'baszta']) {
    const chain = M.upgradeChainSteps(id, buildings);
    ok(chain.length === 1, `${id}: łańcuch to tylko on sam (długość 1, brak upgradeFrom)`);
    const lines = M.upgradeCompositionLines(id, buildings);
    ok(lines.length === 0, `${id}: upgradeCompositionLines() puste — nic się nie rozwija`);
  }
}

console.log(`\ngrupy-budynkow-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
