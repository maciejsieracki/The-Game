/**
 * apply-matrix-v2-stats.cjs
 * C4-Q1=A — eksport statow z Macierz-walki-analiza.md v2.0 -> units.json
 * Usage (from gra/): node tools/apply-matrix-v2-stats.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const UNITS_JSON = path.join(__dirname, '..', 'data', 'units.json');

/** Macierz v2.0 (skala 0-100) — nazwy gry po lewej, macierz po prawej w komentarzu */
const MATRIX = {
  Wojownik: {
    Atak: 45, Obrona: 38, 'Obrażenia': 45, Przebicie: 10, Pancerz: 20, Uderzenie: 20,
    Health: 45, 'Morale bazowe': 50,
  },
  Zwiadowca: {
    Atak: 5, Obrona: 10, 'Obrażenia': 0, Przebicie: 0, Pancerz: 0, Uderzenie: 0,
    Health: 20, 'Morale bazowe': 30,
  },
  'Łucznik': {
    Atak: 30, Obrona: 20, 'Obrażenia': 35, Przebicie: 15, Pancerz: 10, Uderzenie: 10,
    Health: 30, 'Morale bazowe': 40, 'Atak dystansowy': 35,
  },
  'Wojownik z mieczem i tarczą': {
    Atak: 60, Obrona: 48, 'Obrażenia': 65, Przebicie: 20, Pancerz: 35, Uderzenie: 35,
    Health: 55, 'Morale bazowe': 60,
  },
  Hastati: {
    Atak: 88, Obrona: 70, 'Obrażenia': 100, Przebicie: 40, Pancerz: 90, Uderzenie: 80,
    Health: 75, 'Morale bazowe': 85,
  },
  Konnica: {
    Atak: 80, Obrona: 55, 'Obrażenia': 80, Przebicie: 60, Pancerz: 40, Uderzenie: 100,
    Health: 65, 'Morale bazowe': 70,
  },
  'Włócznik': {
    Atak: 50, Obrona: 80, 'Obrażenia': 50, Przebicie: 20, Pancerz: 55, Uderzenie: 40,
    Health: 65, 'Morale bazowe': 65,
  },
  'Rydwan (woły)': {
    Atak: 65, Obrona: 40, 'Obrażenia': 70, Przebicie: 30, Pancerz: 25, Uderzenie: 90,
    Health: 80, 'Morale bazowe': 55,
  },
  Falanga: {
    Atak: 48, Obrona: 100, 'Obrażenia': 45, Przebicie: 15, Pancerz: 85, Uderzenie: 70,
    Health: 100, 'Morale bazowe': 75,
  },
};

const TAG = 'C4-Q1=A macierz v2.0';

const raw = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
let updated = 0;

for (const unit of raw) {
  const name = unit['Jednostka'];
  const patch = MATRIX[name];
  if (!patch) continue;
  Object.assign(unit, patch);
  const note = unit['Uwagi'] ? unit['Uwagi'] + ' | ' + TAG : TAG;
  unit['Uwagi'] = note;
  updated++;
  console.log('OK:', name);
}

if (updated === 0) {
  console.error('Brak dopasowanych jednostek — sprawdz nazwy w units.json');
  process.exit(1);
}

fs.writeFileSync(UNITS_JSON, JSON.stringify(raw, null, 2) + '\n', 'utf8');
console.log('\nZaktualizowano', updated, 'jednostek ->', UNITS_JSON);
