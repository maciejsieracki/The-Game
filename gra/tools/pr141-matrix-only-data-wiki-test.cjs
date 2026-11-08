'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const civs = JSON.parse(fs.readFileSync(path.join(root, 'data/civs.json'), 'utf8')).cywilizacje;
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/civ-matrix.json'), 'utf8'));
const unitsJson = JSON.parse(fs.readFileSync(path.join(root, 'data/units.json'), 'utf8'));
const units = Array.isArray(unitsJson) ? unitsJson : Object.values(unitsJson);
const wiki = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wikiBundle.json'), 'utf8'));
const sourceRoot = path.resolve(root, '..');

// Snapshot of the 15 legacy `jednostka_specjalna` arrays before deleting that
// bonus carrier. Keeping this independent makes roster loss visible after cleanup.
const expected = {
  grecy: ['Falanga', 'Wojownik mykeński', 'Rydwan mykeński', 'Thorakites'],
  rzymianie: ['Hastati', 'Triari'],
  chinczycy: ['Jeździec chiński', 'Halabardnik Shang', 'Rydwan Shang'],
  inkowie: ['Wojownik z maczugą (Chaska)', 'Wojownik z toporem', 'Procarz (Huaracoc)', 'Oszczepnik (Estólica)', 'Gwardzista z champi'],
  zulusi: ['Impi', 'Oszczepnik Zulu (Izijula)', 'iButho z iklwa'],
  egipt: ['Łucznik egipski', 'Rydwan egipski', 'Wojownik z khopesh', 'Łucznik nubijski', 'Wojownik z żelaznym khopesh'],
  sumer: ['Łucznik sumeryjski', 'Rydwan sumeryjski', 'Włócznik sumeryjski', 'Łucznik akadyjski', 'Mur tarcz (Sargonid)'],
  celtowie: ['Soldurii', 'Rydwan celtycki', 'Miecznik galijski'],
  germanie: ['Berserker germański'],
  harappa: ['Strażnik bram Harappy', 'Piechota induska', 'Garnizon Harappy'],
  hetyci: ['Rydwan Kapadokijski', 'Piechota hetycka', 'Gwardia hetycka'],
  slowianie: ['Drużynnik', 'Jeździec z oszczepami'],
  babilonia: ['Gwardia Ishtar', 'Wojownik babiloński', 'Piechota neobabilońska'],
  asyria: ['Konnica lancowa asyryjska', 'Konnica łucznicza asyryjska', 'Łucznik asyryjski'],
  fenicjanie: ['Tyrski miecznik', 'Wojownik fenicki', 'Gwardia Tyreńska'],
};
const nationByCiv = {
  grecy: 'Grecja', rzymianie: 'Rzym', chinczycy: 'Chiny', inkowie: 'Inkowie', zulusi: 'Zulu',
  egipt: 'Egipt', sumer: 'Sumer', celtowie: 'Celtowie', germanie: 'Germanie', harappa: 'Harappa',
  hetyci: 'Hetyci', slowianie: 'Słowianie', babilonia: 'Babilonia', asyria: 'Asyria', fenicjanie: 'Fenicjanie',
};
const retiredKeys = ['bonusy', 'Bonus startowy', 'Bonusy/minusy (do dopracowania)', 'mnoznikHandelPieniadz'];
const civByKey = new Map(civs.map(c => [c.ikonaId, c]));
assert.equal(civs.length, 15, 'all 15 civilization rows remain');
assert.deepEqual([...civByKey.keys()].sort(), Object.keys(expected).sort(), 'same complete civilization key set remains');
for (const [key, row] of civByKey) {
  for (const field of retiredKeys) assert.equal(Object.hasOwn(row, field), false, `${key}: retired source field ${field} removed`);
  assert.ok(row.Cywilizacja && row['Styl / charakter'] && row['Jednostka specjalna'] && row.Religia && row.ikonaId,
    `${key}: identity, flavor, religion and special-unit display remain`);
  const actualRoster = units.filter(u => u.Nacja === nationByCiv[key]
    && u['W zamian za'] && !['-', '—'].includes(u['W zamian za']))
    .map(u => u.Jednostka).sort();
  assert.deepEqual(actualRoster, [...expected[key]].sort(), `${key}: current units.json roster matches exact pre-cleanup snapshot`);
  for (const unitName of expected[key]) assert.ok(units.some(u => u.Jednostka === unitName && u.Nacja === nationByCiv[key]), `${key}: ${unitName} remains in unit data`);
}

const civpediaKeys = ['celtowie', 'chinczycy', 'egipt', 'germanie', 'grecy', 'inkowie', 'rzymianie', 'sumer', 'zulusi'];
for (const key of civpediaKeys) {
  const source = fs.readFileSync(path.join(sourceRoot, 'docs/encyklopedia/cywilizacje', `${key}.md`), 'utf8');
  const bundled = wiki.encyklopedia.find(entry => entry.id === `cywilizacje/${key}`);
  assert.ok(bundled, `${key}: generated game encyclopedia entry exists`);
  for (const [label, content] of [['source', source], ['bundle', bundled.full]]) {
    assert.match(content, /Obowiązujące bonusy i modyfikatory cywilizacji wynikają z macierzy parametrów\. Dawne bonusy opisowe nie są doliczane\./,
      `${key}: ${label} describes matrix-based bonuses in player-facing language`);
    assert.doesNotMatch(content, /wszystkie pola macierzy są aktywne|każde pole macierzy działa/,
      `${key}: ${label} does not claim every matrix field is active`);
    assert.doesNotMatch(content, /Bonus startowy|Trzy linie bonusów \(macierz\)|Słabsza strona \(balans\)/,
      `${key}: ${label} has no retired civilization-bonus claims`);
    assert.doesNotMatch(content, /Kusznik|bonus \+20% działa dalej przez `bonusy\[\]`/,
      `${key}: ${label} has no obsolete Chinese crossbowman claim`);
    const formula = content.match(/Mnożnik handlu\/waluty:\s*\*\*([0-9.]+)\*\*/);
    const matrixRow = matrix.cywilizacje.find(row => row.ikonaId === key);
    assert.ok(formula && matrixRow, `${key}: ${label} retains its matrix-sourced currency parameter`);
    assert.equal(Number(formula[1]), matrixRow.params.meta_mnoznik_waluta,
      `${key}: ${label} currency parameter matches civ-matrix.json`);
  }
}
console.log('pr141-matrix-only-data-wiki-test: 15 civ rows and 9 bundled CivPedia pages passed');
