'use strict';

/**
 * Kontrakt tymczasowej karty jednostki.
 * Uruchomienie: z katalogu gra: node tools/unit-info-card-contract-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const counters = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'counters.json'), 'utf8'));
const cardSource = fs.readFileSync(path.join(GRA, 'src', 'ui', 'unitInfoCard.ts'), 'utf8');
const previewSource = fs.readFileSync(path.join(GRA, 'src', 'ui', 'unitMiniPreview.ts'), 'utf8');
const rendererSource = fs.readFileSync(path.join(GRA, 'src', 'render', 'units.ts'), 'utf8');

let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) {
    pass++;
    console.log('  PASS:', message);
  } else {
    fail++;
    console.error('  FAIL:', message);
  }
}

const hastati = units.find(u => u.Jednostka === 'Hastati');
ok(!!hastati, 'Hastati istnieje w units.json');
const required = [
  'Jednostka', 'Epoka', 'Tech', 'Typ', 'Atak', 'Obrona', 'Health', 'Ruch',
  'Zasięg ataku (hex)', 'Pieniądz (koszt)', 'Utrzymanie (Pieniądz/turę)',
  'Surowiec', 'Surowiec (ilość)', 'Utrzymanie surowiec',
  'Utrzymanie surowiec (ilość)',
];
if (hastati) {
  for (const key of required) ok(Object.prototype.hasOwnProperty.call(hastati, key),
    `Hastati ma pole: ${key}`);
}

const swordCounters = counters.filter(row =>
  String(row['Typ atakujący'] || '').toLowerCase() === 'swordsman');
ok(swordCounters.length > 0, 'counters.json zawiera kontry dla Swordsman');
ok(cardSource.includes('dataset.unit3dHook'), 'karta publikuje hook renderu 3D w DOM');
ok(cardSource.includes('mountUnitMiniPreview') && cardSource.includes('buildUnitModel'),
  'karta korzysta z łańcucha renderera 3D');
ok(previewSource.includes('buildUnitModel(cat, ownerColor, name)'),
  'mini preview wywołuje buildUnitModel z nazwą');
ok(rendererSource.includes('export function buildUnitModel'),
  'renderer eksportuje prawdziwy builder modelu');
ok(cardSource.includes('value == null') && cardSource.includes("text(value) !== '—'"),
  'brakujące pola są pomijane bez undefined');
ok(!cardSource.includes('Civpedia') && !cardSource.includes('Wikipedia'),
  'karta nie dodaje linków zewnętrznych');

console.log(`\nunit-info-card-contract-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
