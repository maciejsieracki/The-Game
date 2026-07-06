/**
 * roster6-batch3-patch.cjs — Batch 0 (Wojownik germański) + Batch 3 (oryginalne 7 + Miecznik galijski)
 * Run: node tools/roster6-batch3-patch.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const UNITS_PATH = path.join(__dirname, '../data/units.json');
const units = JSON.parse(fs.readFileSync(UNITS_PATH, 'utf8'));

function cloneByName(name) {
  const u = units.find(x => x.Jednostka === name);
  if (!u) throw new Error('Brak wzorca: ' + name);
  return JSON.parse(JSON.stringify(u));
}

function upsert(entry) {
  const i = units.findIndex(u => u.Jednostka === entry.Jednostka);
  if (i >= 0) {
    units[i] = { ...units[i], ...entry };
    console.log('UPDATE:', entry.Jednostka);
  } else {
    units.push(entry);
    console.log('ADD:', entry.Jednostka);
  }
}

// --- Batch 0: Wojownik germański → super Brązu (decyzja Macieja 2026-07-03) ---
const germ = units.find(u => u.Jednostka === 'Wojownik germański');
if (germ) {
  Object.assign(germ, {
    Epoka: 'Brąz',
    Tech: '—',
    'Pieniądz (koszt)': 0,
    Surowiec: '—',
    'Surowiec (ilość)': 0,
    'Utrzymanie (Pieniądz/turę)': 0,
    'W zamian za': '—',
    'Super-jednostka': 'TAK',
    Klasa: 'Super',
    'Próg dezercji (% health)': 0.1,
    'Morale bazowe': 120,
    'Morale ucieczki': 18,
    'Zmiana na': '—',
    'Dostępna w epokach': 'Brąz',
    Uwagi: (germ.Uwagi || '') + ' | Super Brązu (framea); max 1; stolica; Koszt=0',
  });
  console.log('FIX Batch 0: Wojownik germański → Super Brąz');
}

// --- Batch 3 ---
const wmt = cloneByName('Wojownik z mieczem i tarczą');
upsert({
  ...wmt,
  Jednostka: 'Thorakites',
  'Nazwa EN': 'Thorakites',
  Epoka: 'Żelazo',
  Kultura: 'Grecja',
  Nacja: 'Grecja',
  Klasa: 'Specjalna',
  'W zamian za': 'Wojownik z mieczem i tarczą',
  Atak: 7,
  Obrona: 9,
  Uderzenie: 6,
  Health: 65,
  Pancerz: 6,
  'Dostępna w epokach': 'Żelazo',
  Uwagi: 'Żelazna piechota defensywna; tarcza + miecz; profil obronny hoplitów późnego okresu',
});

const leg = cloneByName('Wojownik z mieczem i tarczą');
upsert({
  ...leg,
  Jednostka: 'Legionarius',
  'Nazwa EN': 'Legionary',
  Epoka: 'Brąz',
  Kultura: 'Rzymianie',
  Nacja: 'Rzym',
  Klasa: 'Specjalna',
  'W zamian za': 'Wojownik z mieczem i tarczą',
  Atak: 7,
  Obrona: 7,
  Uderzenie: 6,
  Health: 58,
  Pancerz: 5,
  'Dostępna w epokach': 'Brąz',
  Uwagi: 'Wczesny legionariusz Brązu; gladius + scutum; przed reformą Mariusza',
});

const evo = cloneByName('Triari');
upsert({
  ...evo,
  Jednostka: 'Evocati',
  'Nazwa EN': 'Evocati',
  Epoka: 'Brąz',
  Kultura: 'Rzymianie',
  Nacja: 'Rzym',
  Klasa: 'Super',
  'Super-jednostka': 'TAK',
  Tech: '—',
  'Pieniądz (koszt)': 0,
  Surowiec: '—',
  'Surowiec (ilość)': 0,
  'Utrzymanie (Pieniądz/turę)': 0,
  'W zamian za': '—',
  Atak: 9,
  Obrona: 9,
  Uderzenie: 8,
  Health: 75,
  Pancerz: 6,
  'Dostępna w epokach': 'Brąz',
  Uwagi: 'Super Brązu; weterani evocati; elitarna piechota Rzymu',
});

const impi = cloneByName('Impi');
upsert({
  ...impi,
  Jednostka: 'iButho z iklwa',
  'Nazwa EN': 'iButho with iklwa',
  Epoka: 'Żelazo',
  Kultura: 'Zulusi',
  Nacja: 'Zulu',
  'W zamian za': 'Impi',
  Atak: 5,
  Obrona: 7,
  Ruch: 4,
  Health: 72,
  'Dostępna w epokach': 'Żelazo',
  Uwagi: 'Żelazna ewolucja Impi; iklwa + tarcza; szybsza piechota liniowa',
});

const topo = cloneByName('Wojownik z toporem');
upsert({
  ...topo,
  Jednostka: 'Gwardzista z champi',
  'Nazwa EN': 'Champi Guardsman',
  Epoka: 'Brąz',
  Kultura: 'Inkowie',
  Nacja: 'Inkowie',
  Klasa: 'Specjalna',
  'W zamian za': 'Wojownik z toporem',
  Atak: 8,
  Obrona: 7,
  Uderzenie: 7,
  Health: 60,
  Pancerz: 5,
  Uwagi: 'Elitarna gwardia Inków; maczuga gwiaździsta (champi); profil ofensywny',
});

const khop = cloneByName('Wojownik z khopesh');
upsert({
  ...khop,
  Jednostka: 'Wojownik z żelaznym khopesh',
  'Nazwa EN': 'Iron Khopesh Warrior',
  Epoka: 'Żelazo',
  Kultura: 'Egipt',
  Nacja: 'Egipt',
  'W zamian za': 'Wojownik z khopesh',
  Atak: 8,
  Obrona: 7,
  Uderzenie: 7,
  Health: 58,
  Pancerz: 6,
  'Dostępna w epokach': 'Żelazo',
  Uwagi: 'Żelazny khopesh; silniejsza wersja egipskiego wojownika brązowego',
});

const sumer = cloneByName('Włócznik sumeryjski');
upsert({
  ...sumer,
  Jednostka: 'Mur tarcz (Sargonid)',
  'Nazwa EN': 'Shield Wall (Sargonid)',
  Epoka: 'Żelazo',
  Kultura: 'Sumerowie',
  Nacja: 'Sumer',
  'W zamian za': 'Włócznik sumeryjski',
  Atak: 6,
  Obrona: 10,
  Uderzenie: 6,
  Health: 85,
  Pancerz: 7,
  'Dostępna w epokach': 'Żelazo',
  Uwagi: 'Żelazna formacja tarczowa Sargonidów; mur tarcz + włócznie',
});

const gaes = cloneByName('Gaesatae');
upsert({
  ...gaes,
  Jednostka: 'Miecznik galijski',
  'Nazwa EN': 'Gallic Swordsman',
  Epoka: 'Żelazo',
  Kultura: 'Celtowie',
  Nacja: 'Celtowie',
  'W zamian za': 'Wojownik z mieczem i tarczą',
  Atak: 9,
  Uderzenie: 7,
  Obrona: 5,
  Ruch: 3,
  Health: 58,
  Uwagi: 'Ofensywna piechota galijska; długi miecz + szarża; uzupełnienie linii Celtów',
});

// Dedupe
const seen = new Set();
const deduped = [];
for (const u of units) {
  if (seen.has(u.Jednostka)) {
    console.warn('SKIP duplicate:', u.Jednostka);
    continue;
  }
  seen.add(u.Jednostka);
  deduped.push(u);
}

fs.copyFileSync(UNITS_PATH, UNITS_PATH + '.bak-UNITS-batch3-20260704');
fs.writeFileSync(UNITS_PATH, JSON.stringify(deduped, null, 2) + '\n', 'utf8');
console.log('\nunits.json:', deduped.length, 'entries (was', units.length, ')');
