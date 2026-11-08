'use strict';
/**
 * citypanel-tech-tile-dead-effects-test.cjs — R-WEB-CITYPANEL-TECH-TILE-DEAD-EFFECTS-Q1.
 *
 * Kafelek „Technologie” w karcie budynku (cityPanel.ts::appendTechDetailBlock) NIE może pokazywać
 * efektów martwych, które karta odkrycia już ukrywa. Test pilnuje jednego wspólnego filtra
 * (src/ui/entityCards/techDeadEffects.ts) i jego użycia w trzech miejscach:
 *   [A] źródło: moduł eksportuje wspólny filtr; karta odkrycia (technologyAdapter.ts,
 *       techDiscoveryNotice.ts) i kafelek (cityPanel.ts) używają go, bez drugiej listy `ukryte`;
 *   [B] zachowanie (bundle esbuild, bez przeglądarki): Filozofia — „Teatr” zniknął z wiersza
 *       „Odblokowuje budynek” i z „Uwagi tech”, „Akademia” zostaje; dla KAŻDEJ technologii z
 *       tech.json żaden wiersz tekstowy kafelka nie zawiera efektu ukrytego ani budynku martwego;
 *   [C] regresja: nie ukrywamy tego, co karta odkrycia pokazuje (Katapulta, „elitarnych”, Akademia).
 *
 * Usage (z gra/):  node tools/citypanel-tech-tile-dead-effects-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? ' -> ' + JSON.stringify(detail) : '')); }
}

const readSrc = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const cityPanel = readSrc('ui/cityPanel.ts');
const techAdapter = readSrc('ui/entityCards/technologyAdapter.ts');
const techNotice = readSrc('ui/techDiscoveryNotice.ts');
const deadSrc = readSrc('ui/entityCards/techDeadEffects.ts');

console.log('[A] źródło: wspólny filtr w jednym module');
check('[A] techDeadEffects.ts eksportuje filterDeadEffectText / hiddenTechEffectNames / isDeadTechCardBuilding',
  /export function filterDeadEffectText\b/.test(deadSrc)
  && /export function hiddenTechEffectNames\b/.test(deadSrc)
  && /export function isDeadTechCardBuilding\b/.test(deadSrc));
check('[A] cityPanel.ts importuje filterDeadEffectText z entityCards/techDeadEffects',
  /import\s*\{[^}]*filterDeadEffectText[^}]*\}\s*from\s*'\.\/entityCards\/techDeadEffects'/.test(cityPanel));
const tdStart = cityPanel.indexOf('function appendTechDetailBlock(');
const tdBody = tdStart > -1 ? cityPanel.slice(tdStart, cityPanel.indexOf('\n}\n', tdStart)) : '';
check('[A] appendTechDetailBlock: „Odblokowuje budynek” idzie przez filterDeadEffectText',
  tdBody.includes("filterDeadEffectText(t['Odblokowuje budynek']") && tdBody.includes("'Odblokowuje budynek'"));
check('[A] appendTechDetailBlock: „Uwagi tech” idzie przez filterDeadEffectText(playerFacingNote(t.Uwagi))',
  tdBody.includes('filterDeadEffectText(playerFacingNote(t.Uwagi)'));
check('[A] technologyAdapter.ts i techDiscoveryNotice.ts używają hiddenTechEffectNames (jedna reguła)',
  techAdapter.includes('hiddenTechEffectNames(techName)') && techNotice.includes('hiddenTechEffectNames(tech.Technologia)'));
check('[A] cityPanel/technologyAdapter/techDiscoveryNotice nie czytają `ukryte` z danych bezpośrednio (brak drugiej listy)',
  !/\.ukryte\b/.test(cityPanel) && !/\.ukryte\b/.test(techAdapter) && !/\.ukryte\b/.test(techNotice));

// ---- [B]/[C] zachowanie: bundle modułu esbuild-em (bez przeglądarki) ----
console.log('[B/C] zachowanie filtra na danych tech.json / tech-cards-top5.json');
const bundled = esbuild.buildSync({
  entryPoints: [path.join(SRC, 'ui/entityCards/techDeadEffects.ts')], bundle: true, format: 'cjs',
  platform: 'node', write: false, absWorkingDir: GRA, logLevel: 'silent',
}).outputFiles[0].text;
const mod = { exports: {} };
new Function('module', 'exports', 'require', bundled)(mod, mod.exports, require);
const { filterDeadEffectText, hiddenTechEffectNames, deadBuildingNames, isDeadTechCardBuilding } = mod.exports;

const techRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8'));
const techs = Array.isArray(techRaw) ? techRaw : techRaw.technologie;
const byName = Object.fromEntries(techs.map((t) => [t.Technologia, t]));

check('[B] reguła budynku martwego: suppressed → martwy', isDeadTechCardBuilding({ suppressed: true }) === true);
check('[B] reguła budynku martwego: epokaWejscia 4 → martwy', isDeadTechCardBuilding({ epokaWejscia: 4 }) === true);
check('[B] reguła budynku martwego: epokaWejscia 3 → żywy', isDeadTechCardBuilding({ epokaWejscia: 3 }) === false);
check('[B] deadBuildingNames zawiera Teatr', deadBuildingNames().includes('Teatr'), deadBuildingNames());

const fil = byName['Filozofia'];
check('[B] Filozofia „Odblokowuje budynek” = „Akademia” (Teatr ukryty)',
  filterDeadEffectText(fil['Odblokowuje budynek'], 'Filozofia') === 'Akademia',
  filterDeadEffectText(fil['Odblokowuje budynek'], 'Filozofia'));
const filUwagi = filterDeadEffectText(fil.Uwagi, 'Filozofia');
check('[B] Filozofia „Uwagi” bez Teatru, z treścią o Akademii',
  filUwagi !== null && !filUwagi.includes('Teatr') && filUwagi.includes('Akademia = NOWY budynek'), filUwagi);
check('[B] filtr pustej wartości → null', filterDeadEffectText(null, 'Filozofia') === null
  && filterDeadEffectText('', 'Filozofia') === null && filterDeadEffectText('Teatr', 'Filozofia') === null);
check('[B] filtr nie rusza nazw innych technologii (Filozofia ≠ Astronomia)',
  filterDeadEffectText('Obserwatorium (Biblioteka poz. 6)', 'Filozofia') === 'Obserwatorium (Biblioteka poz. 6)');

// [B] dla KAŻDEJ technologii: żaden wiersz tekstowy kafelka nie zawiera efektu ukrytego ani martwego budynku
const TEXT_FIELDS = ['Odblokowuje budynek', 'wymagany budynek', 'Dostęp do surowca.', 'Odblokowuje surowiec.', 'Odblokowuje ulepszenie terenu', 'Uwagi'];
let leaks = [];
let checkedRows = 0;
for (const t of techs) {
  const name = t.Technologia;
  const dead = [...hiddenTechEffectNames(name), ...deadBuildingNames()];
  for (const f of TEXT_FIELDS) {
    const out = filterDeadEffectText(t[f], name);
    if (out == null) continue;
    checkedRows++;
    for (const d of dead) if (d && out.includes(d)) leaks.push(`${name}|${f}|${d}`);
  }
}
check(`[B] żaden wiersz tekstowy kafelka nie zawiera efektu martwego (sprawdzono ${checkedRows} wierszy)`, leaks.length === 0, leaks);

// [C] regresja: rzeczy widoczne na karcie odkrycia zostają
const oblez = byName['Oblężnictwo'];
check('[C] Oblężnictwo „Odblokowuje budynek” nadal zawiera Katapultę (Warsztat odblokowuje Katapultę)',
  (filterDeadEffectText(oblez['Odblokowuje budynek'], 'Oblężnictwo') || '').includes('Katapult'));
const sztuka = byName['Sztuka wojenna'];
check('[C] Sztuka wojenna „Uwagi” nadal zawiera „elitarnych” (realna bramka jednostek elit)',
  (filterDeadEffectText(sztuka.Uwagi, 'Sztuka wojenna') || '').includes('elitarnych'));

console.log(`\n[citypanel-tech-tile-dead-effects-test] ${pass} pass, ${fail} fail`);
if (fail > 0) process.exitCode = 1;
