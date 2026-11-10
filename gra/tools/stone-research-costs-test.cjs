'use strict';

/** Regression gate for R-WEB-STONE-RESEARCH-COSTS-PRIORITY-Q1. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.stone-research-costs-entry.ts');
const bundle = path.join(__dirname, '.stone-research-costs-bundle.cjs');
fs.writeFileSync(entry, "export { techCost } from '../src/game/research';\nexport { applyTempoKoszt } from '../src/game/tech-tempo';\n");

try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: bundle, absWorkingDir: root, logLevel: 'silent',
  });
  const { techCost, applyTempoKoszt } = require(bundle);
  const rows = JSON.parse(fs.readFileSync(path.join(root, 'data/tech.json'), 'utf8')).technologie;
  const byName = new Map(rows.map((row) => [row.Technologia, row]));
  const expectations = {
    Garncarstwo: {
      cost: 40, level: 1,
      prereq: 'Obróbka drewna + Rolnictwo + Łowiectwo + Oswojenie zwierząt',
      buildings: 'Spichlerz; Garncarnia; Cegielnia',
      improvements: 'Glinianka, Warzelnia soli',
    },
    'Gospodarka wodna': {
      cost: 180, level: 2, prereq: 'Rolnictwo',
      buildings: 'Studnia', improvements: 'Irygacja',
    },
    'Koło': {
      cost: 180, level: 3, prereq: 'Oswojenie zwierząt',
      buildings: 'Jednostki: Rydwan (woły)', improvements: 'Droga',
    },
    'Brązownictwo': {
      cost: 480, level: 3,
      prereq: 'Garncarstwo + Murarstwo + Obróbka drewna',
      buildings: 'Odlewnia brązu; Kuźnia brązu; Jednostki: Włócznik, Wojownik z mieczem i tarczą, Impi, Wojownik z toporem, Wojownik z khopesh, Włócznik sumeryjski, Wojownik mykeński, Wojownik Sherden, Halabardnik Shang, Wieża oblężnicza, Wojownik tyrreński, Wojownik szekelesz',
      improvements: null,
    },
  };
  let pass = 0;
  let fail = 0;
  function check(condition, message) {
    if (condition) pass++;
    else { fail++; console.error(`FAIL: ${message}`); }
  }
  for (const [name, expected] of Object.entries(expectations)) {
    const row = byName.get(name);
    check(!!row, `${name} exists in tech.json`);
    if (!row) continue;
    check(row['Koszt nauki'] === expected.cost, `${name} base cost = ${expected.cost}`);
    check(techCost(row) === expected.cost, `${name} actual research cost = ${expected.cost}`);
    check(row.Epoka === 'Kamień', `${name} epoch unchanged`);
    check(row.Poziom === expected.level, `${name} level unchanged`);
    check(row['Wymaga (prereq)'] === expected.prereq, `${name} prerequisites unchanged`);
    check(row['Odblokowuje budynek'] === expected.buildings, `${name} building unlocks unchanged`);
    check(row['Odblokowuje ulepszenie terenu'] === expected.improvements, `${name} improvement unlocks unchanged`);
    for (const [tempo, multiplier] of [['szybka', 1], ['standardowa', 2], ['dluga', 4]]) {
      check(applyTempoKoszt(techCost(row), tempo) === expected.cost * multiplier,
        `${name} ${tempo} cost = ${expected.cost * multiplier}`);
    }
  }
  // Pin the complete technology dataset after normalizing the four owner-approved
  // costs. This catches changes to any other technology field or row as well.
  for (const [name, expected] of Object.entries(expectations)) {
    byName.get(name)['Koszt nauki'] = expected.cost;
  }
  const techDataDigest = crypto.createHash('sha256')
    .update(JSON.stringify(rows))
    .digest('hex');
  check(techDataDigest === '3b7ab35bb94196dca015c34068c25c787aa9cc9c21e998835ee0d5ece05ee754',
    'complete technology dataset unchanged apart from the four approved costs');

  const wikiEntries = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wikiBundle.json'), 'utf8')).encyklopedia;
  const bronzeWiki = wikiEntries.find((entry) => entry.id === 'technologie/brazownictwo');
  check(!!bronzeWiki, 'Brązownictwo encyclopedia entry exists in wiki bundle');
  if (bronzeWiki) {
    check(bronzeWiki.wikiS.includes('koszt **480** PN'), 'Brązownictwo Wiki-S shows 480 PN');
    check(bronzeWiki.wikiM.includes('**Koszt nauki:** 480 PN'), 'Brązownictwo Wiki-M shows 480 PN');
  }
  console.log(`stone-research-costs-test: ${pass} pass, ${fail} fail`);
  process.exitCode = fail > 0 ? 1 : 0;
} finally {
  for (const file of [entry, bundle]) {
    try { fs.unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
