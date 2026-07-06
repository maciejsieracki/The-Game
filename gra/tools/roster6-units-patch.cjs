/**
 * roster6-units-patch.cjs — Grupa C batch: Celtowie + roster-6
 * Run: node tools/roster6-units-patch.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const UNITS_PATH = path.join(__dirname, '../data/units.json');
const units = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));

function base(overrides) {
  return {
    Epoka: 'Brąz',
    'Pieniądz (koszt)': 18,
    Ludność: 1,
    Surowiec: 'braz',
    'Surowiec (ilość)': 5,
    'Utrzymanie (Pieniądz/turę)': 2,
    'żywność/turę': 1,
    Atak: 6,
    Uderzenie: 6,
    Obrona: 6,
    Ruch: 2,
    'Ruch w bitwie (heksy)': 3,
    Health: 50,
    'Próg dezercji (% health)': 0.3,
    'Widok pola': 1,
    'Atak dystansowy': 0,
    'Zasięg ataku (hex)': '—',
    'Ilość pocisków': '—',
    'W zamian za': '—',
    'Super-jednostka': '—',
    Uwagi: '',
    'Rola (linia)': 'Wręcz',
    Pancerz: 4,
    Przebicie: 4,
    'Kara obrony z flanki (%)': 15,
    'Kara obrony z tyłu (%)': 30,
    'Morale bazowe': 100,
    'Morale ucieczki': 22,
    Typ: 'Swordsman',
    Klasa: 'Specjalna',
    'Bonus vs Swordsman %': 0,
    'Bonus vs Spearman %': 15,
    'Bonus vs Falangite %': 0,
    'Bonus vs Offensive %': 0,
    'Bonus vs Distance %': 0,
    'Bonus vs Mount %': 0,
    'Zmiana na': 'Swordsman',
    'Dostępna w epokach': 'Brąz;Żelazo',
    Tech: 'Brązownictwo',
    Kultura: null,
    Nacja: '',
    'Nazwa EN': '',
    ...overrides,
  };
}

function superUnit(overrides) {
  return base({
    Tech: '—',
    'Pieniądz (koszt)': 0,
    Surowiec: '—',
    'Surowiec (ilość)': 0,
    'Utrzymanie (Pieniądz/turę)': 0,
    'Super-jednostka': 'TAK',
    Klasa: 'Super',
    'W zamian za': '—',
    'Próg dezercji (% health)': 0.1,
    'Morale bazowe': 120,
    'Morale ucieczki': 18,
    'Zmiana na': '—',
    Uwagi: 'max 1 sztuka; stolica; bezpłatna (Koszt=0)',
    ...overrides,
  });
}

function mount(overrides) {
  return base({
    Surowiec: 'Koń',
    'Surowiec (ilość)': 1,
    'Utrzymanie (Pieniądz/turę)': 3,
    Typ: 'Mount',
    'Rola (linia)': 'Flanka',
    'Bonus vs Offensive %': 25,
    'Bonus vs Distance %': 50,
    'Zmiana na': 'Mount',
    Tech: 'Jeździectwo',
    'Kara obrony z flanki (%)': 25,
    'Kara obrony z tyłu (%)': 40,
    'Morale ucieczki': 10,
    Ruch: 4,
    'Ruch w bitwie (heksy)': 6,
    'Widok pola': 2,
    ...overrides,
  });
}

function distance(overrides) {
  return base({
    Typ: 'Distance',
    'Rola (linia)': 'Dystans',
    'Kara obrony z flanki (%)': 50,
    'Kara obrony z tyłu (%)': 80,
    'Morale bazowe': 85,
    'Morale ucieczki': 25,
    Tech: 'Łucznictwo',
    Surowiec: 'drewno',
    'Surowiec (ilość)': 4,
    'Zmiana na': 'Kusznik',
    ...overrides,
  });
}

// --- Celtowie: remove Wojownik celtycki, fix Gaesatae, add Soldurii ---
const celtStats = {
  Atak: 8,
  Uderzenie: 6,
  Obrona: 5,
  Ruch: 2,
  'Ruch w bitwie (heksy)': 4,
  Health: 55,
  'Próg dezercji (% health)': 0.3,
  Pancerz: 3,
  Przebicie: 4,
  'Kara obrony z flanki (%)': 20,
  'Kara obrony z tyłu (%)': 35,
  'Morale bazowe': 100,
  'Morale ucieczki': 22,
};

let filtered = units.filter(u => u.Jednostka !== 'Wojownik celtycki');

const gaIdx = filtered.findIndex(u => u.Jednostka === 'Gaesatae');
if (gaIdx >= 0) {
  filtered[gaIdx] = {
    ...filtered[gaIdx],
    ...celtStats,
    'W zamian za': '—',
    Uwagi:
      'Rename Wojownik celtycki → Gaesatae; elitarna piechota najemna; długi miecz sieczny + owalna tarcza; tunika + torc; brawura szarży',
    'Nazwa EN': 'Gaesatae',
  };
}

const soldurii = base({
  Jednostka: 'Soldurii',
  Epoka: 'Żelazo',
  Kultura: 'Celtowie',
  Nacja: 'Celtowie',
  ...celtStats,
  'W zamian za': 'Wojownik',
  'Pieniądz (koszt)': 18,
  Uwagi:
    'Jednostka specjalna Celtów; elitarna gwardia wodza; miecz + tarcza + torc; identyczne staty jak Gaesatae (CELT-Q2=A)',
  'Nazwa EN': 'Soldurii',
  'Dostępna w epokach': 'Żelazo',
});

const newUnits = [
  soldurii,
  // --- Batch 1: Asyria ---
  mount({
    Jednostka: 'Konnica lancowa asyryjska',
    Epoka: 'Żelazo',
    Kultura: 'Asyria',
    Nacja: 'Asyria',
    'W zamian za': 'Konnica',
    Atak: 10,
    Uderzenie: 12,
    Obrona: 5,
    Health: 85,
    Pancerz: 5,
    Przebicie: 6,
    'Pieniądz (koszt)': 32,
    Uwagi:
      'Elitarna konnica szturmowa z długą lancą i okrągłą tarczą; najmocniejsza konnica ofensywna roster-6',
    'Nazwa EN': 'Assyrian Lancer',
    'Dostępna w epokach': 'Brąz;Żelazo',
  }),
  mount({
    Jednostka: 'Konnica łucznicza asyryjska',
    Epoka: 'Żelazo',
    Kultura: 'Asyria',
    Nacja: 'Asyria',
    'W zamian za': 'Konnica',
    Atak: 7,
    Uderzenie: 5,
    Obrona: 3,
    Health: 75,
    Pancerz: 3,
    Przebicie: 3,
    'Atak dystansowy': 12,
    'Zasięg ataku (hex)': 2,
    'Ilość pocisków': 20,
    'Pieniądz (koszt)': 30,
    Uwagi:
      'Konnica z łukiem kompozytowym; silny ostrzał przed zwarciem; słabsza w walce wręcz',
    'Nazwa EN': 'Assyrian Horse Archer',
    'Dostępna w epokach': 'Brąz;Żelazo',
  }),
  distance({
    Jednostka: 'Łucznik asyryjski',
    Epoka: 'Brąz',
    Kultura: 'Asyria',
    Nacja: 'Asyria',
    'W zamian za': 'Łucznik',
    Atak: 5,
    Uderzenie: 3,
    Obrona: 7,
    Health: 25,
    Pancerz: 2,
    Przebicie: 2,
    'Atak dystansowy': 12,
    'Zasięg ataku (hex)': 4,
    'Ilość pocisków': 14,
    'Pieniądz (koszt)': 14,
    Uwagi: 'Jednostka specjalna Asyrii; łucznik imperium; silniejszy od standardowego Łucznika',
    'Nazwa EN': 'Assyrian Archer',
    'Dostępna w epokach': 'Brąz;Żelazo',
  }),
  // --- Batch 1: Słowianie ---
  base({
    Jednostka: 'Drużynnik',
    Epoka: 'Żelazo',
    Kultura: 'Słowianie',
    Nacja: 'Słowianie',
    'W zamian za': 'Włócznik',
    Atak: 8,
    Uderzenie: 7,
    Obrona: 6,
    Health: 55,
    Pancerz: 3,
    Przebicie: 4,
    Uwagi: 'Jednostka specjalna Słowian; elitarny wojownik drużyny księcia; piechota leśna',
    'Nazwa EN': 'Druzhinnik',
    'Dostępna w epokach': 'Żelazo',
  }),
  mount({
    Jednostka: 'Jeździec z szczepnikami',
    Epoka: 'Żelazo',
    Kultura: 'Słowianie',
    Nacja: 'Słowianie',
    'W zamian za': 'Konnica',
    Atak: 7,
    Uderzenie: 6,
    Obrona: 4,
    Health: 70,
    Pancerz: 3,
    Przebicie: 4,
    'Atak dystansowy': 5,
    'Zasięg ataku (hex)': 2,
    'Ilość pocisków': 5,
    'Pieniądz (koszt)': 26,
    Uwagi: 'Lekka konnica leśna; rzut oszczepami/szczepnikami przed walką wręcz',
    'Nazwa EN': 'Slavic Javelin Cavalry',
    'Dostępna w epokach': 'Żelazo',
  }),
  // --- Batch 2: Harappa ---
  base({
    Jednostka: 'Strażnik bram Harappy',
    Epoka: 'Brąz',
    Kultura: 'Harappa',
    Nacja: 'Harappa',
    'W zamian za': 'Włócznik',
    Atak: 6,
    Uderzenie: 5,
    Obrona: 9,
    Health: 70,
    Pancerz: 5,
    Przebicie: 2,
    'Bonus vs Spearman %': 0,
    Uwagi: 'Jednostka specjalna Harappy; elitarna piechota bram miasta-plan; obrona > atak',
    'Nazwa EN': 'Harappan Gate Guard',
    Typ: 'Spearman',
    'Zmiana na': 'Spearman',
  }),
  base({
    Jednostka: 'Piechota induska',
    Epoka: 'Brąz',
    Kultura: 'Harappa',
    Nacja: 'Harappa',
    'W zamian za': 'Włócznik',
    Atak: 7,
    Uderzenie: 6,
    Obrona: 7,
    Health: 60,
    Pancerz: 4,
    Uwagi: 'Piechota doliny Indus; wyrównana obrona i atak',
    'Nazwa EN': 'Indus Infantry',
    Typ: 'Spearman',
    'Zmiana na': 'Spearman',
  }),
  base({
    Jednostka: 'Garnizon Harappy',
    Epoka: 'Żelazo',
    Kultura: 'Harappa',
    Nacja: 'Harappa',
    'W zamian za': 'Wojownik z mieczem i tarczą',
    Atak: 8,
    Uderzenie: 7,
    Obrona: 8,
    Health: 65,
    Pancerz: 5,
    Uwagi: 'Żelazny garnizon miasta-plan; silna obrona terytorium',
    'Nazwa EN': 'Harappan Garrison',
    'Dostępna w epokach': 'Żelazo',
  }),
  // --- Batch 2: Hetyci ---
  mount({
    Jednostka: 'Rydwan Kapadokijski',
    Epoka: 'Brąz',
    Kultura: 'Hetyci',
    Nacja: 'Hetyci',
    'W zamian za': 'Rydwan konny',
    Atak: 8,
    Uderzenie: 9,
    Obrona: 3,
    Health: 90,
    Pancerz: 3,
    Przebicie: 5,
    Ruch: 5,
    'Pieniądz (koszt)': 34,
    Uwagi: 'Jednostka specjalna Hetytów; rydwan bojowy Anatolii; mobilna flanka',
    'Nazwa EN': 'Cappadocian Chariot',
    Typ: 'Mount',
    'Zmiana na': 'Mount',
  }),
  base({
    Jednostka: 'Piechota hetycka',
    Epoka: 'Brąz',
    Kultura: 'Hetyci',
    Nacja: 'Hetyci',
    'W zamian za': 'Włócznik',
    Atak: 7,
    Uderzenie: 6,
    Obrona: 8,
    Health: 65,
    Pancerz: 5,
    Uwagi: 'Piechota fortyfikacyjna Anatolii',
    'Nazwa EN': 'Hittite Infantry',
    Typ: 'Spearman',
    'Zmiana na': 'Spearman',
  }),
  base({
    Jednostka: 'Gwardia hetycka',
    Epoka: 'Żelazo',
    Kultura: 'Hetyci',
    Nacja: 'Hetyci',
    'W zamian za': 'Wojownik z mieczem i tarczą',
    Atak: 9,
    Uderzenie: 8,
    Obrona: 8,
    Health: 70,
    Pancerz: 5,
    Uwagi: 'Elitarna gwardia pałacowa żelaza',
    'Nazwa EN': 'Hittite Guard',
    'Dostępna w epokach': 'Żelazo',
  }),
  // --- Batch 2: Babilonia ---
  base({
    Jednostka: 'Gwardia Ishtar',
    Epoka: 'Brąz',
    Kultura: 'Babilonia',
    Nacja: 'Babilonia',
    'W zamian za': 'Wojownik z khopesh',
    Atak: 9,
    Uderzenie: 8,
    Obrona: 8,
    Health: 75,
    Pancerz: 5,
    Przebicie: 4,
    Uwagi: 'Jednostka specjalna Babilonii; elitarna garda świątynna/pałacowa',
    'Nazwa EN': 'Ishtar Guard',
  }),
  base({
    Jednostka: 'Wojownik babiloński',
    Epoka: 'Brąz',
    Kultura: 'Babilonia',
    Nacja: 'Babilonia',
    'W zamian za': 'Wojownik z khopesh',
    Atak: 7,
    Uderzenie: 6,
    Obrona: 7,
    Health: 55,
    Pancerz: 4,
    Uwagi: 'Standardowy wojownik babiloński z khopesh',
    'Nazwa EN': 'Babylonian Warrior',
  }),
  base({
    Jednostka: 'Piechota neobabilońska',
    Epoka: 'Żelazo',
    Kultura: 'Babilonia',
    Nacja: 'Babilonia',
    'W zamian za': 'Wojownik z mieczem i tarczą',
    Atak: 8,
    Uderzenie: 7,
    Obrona: 8,
    Health: 65,
    Pancerz: 5,
    Uwagi: 'Piechota neobabilońska; zbalansowana elita żelaza',
    'Nazwa EN': 'Neo-Babylonian Infantry',
    'Dostępna w epokach': 'Żelazo',
  }),
  // --- Batch 2: Fenicjanie ---
  base({
    Jednostka: 'Tyrski miecznik',
    Epoka: 'Żelazo',
    Kultura: 'Fenicjanie',
    Nacja: 'Fenicjanie',
    'W zamian za': 'Wojownik z mieczem i tarczą',
    Atak: 8,
    Uderzenie: 7,
    Obrona: 6,
    Health: 55,
    Pancerz: 4,
    Przebicie: 4,
    Uwagi: 'Jednostka specjalna Fenicjan; piechota kolonialna/miejska Tyr',
    'Nazwa EN': 'Tyrian Swordsman',
    'Dostępna w epokach': 'Żelazo',
  }),
  base({
    Jednostka: 'Wojownik fenicki',
    Epoka: 'Brąz',
    Kultura: 'Fenicjanie',
    Nacja: 'Fenicjanie',
    'W zamian za': 'Wojownik z mieczem i tarczą',
    Atak: 6,
    Uderzenie: 6,
    Obrona: 6,
    Health: 50,
    Pancerz: 3,
    Uwagi: 'Lekka piechota fenicka; handlowe kolonie',
    'Nazwa EN': 'Phoenician Warrior',
  }),
  base({
    Jednostka: 'Gwardia Tyr',
    Epoka: 'Żelazo',
    Kultura: 'Fenicjanie',
    Nacja: 'Fenicjanie',
    'W zamian za': 'Wojownik z mieczem i tarczą',
    Atak: 8,
    Uderzenie: 7,
    Obrona: 7,
    Health: 60,
    Pancerz: 4,
    Uwagi: 'Elitarna gwardia miasta Tyr',
    'Nazwa EN': 'Tyre Guard',
    'Dostępna w epokach': 'Żelazo',
  }),
];

// Insert Soldurii after Gaesatae; append rest at end
const gaPos = filtered.findIndex(u => u.Jednostka === 'Gaesatae');
if (gaPos < 0) throw new Error('Gaesatae not found');
const before = filtered.slice(0, gaPos + 1);
const after = filtered.slice(gaPos + 1);
const result = [...before, soldurii, ...after.slice(0), ...newUnits.slice(1)];

// Dedupe by Jednostka name
const seen = new Set();
const deduped = [];
for (const u of result) {
  if (seen.has(u.Jednostka)) {
    console.warn('SKIP duplicate:', u.Jednostka);
    continue;
  }
  seen.add(u.Jednostka);
  deduped.push(u);
}

fs.writeFileSync(UNITS_PATH, JSON.stringify(deduped, null, 2) + '\n', 'utf8');
console.log('units.json updated:', deduped.length, 'entries (was', units.length, ')');
console.log('Removed: Wojownik celtycki');
console.log('Added:', newUnits.map(u => u.Jednostka).join(', '));
