'use strict';
/**
 * chariot-move-6-data-test.cjs — R-WEB-CHARIOT-MOVE-6-DATA-Q1.
 *
 * Decyzja właściciela (ostateczna, 2026-11-12):
 *  - „Ruch w bitwie (heksy)” wpisu „Konnica” = 7 (zmiana z 6);
 *  - „Rydwan (woły)” nadal = 5;
 *  - pozostałe rydwany nadal = 6;
 *  - pole „Ruch” (mapa świata) NIE zmienione dla żadnej jednostki.
 *
 * Uruchomienie z katalogu gra:  node tools/chariot-move-6-data-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const units = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));

let passed = 0, failed = 0;
function assert(c, msg) { if (c) { passed++; } else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const byName = {};
for (const u of units) {
  if (u && u['Jednostka']) byName[u['Jednostka']] = u;
}

const BATTLE = 'Ruch w bitwie (heksy)';

// 1. Konnica w bitwie = 7
const konnica = byName['Konnica'];
assert(!!konnica, 'brak wpisu "Konnica" w units.json');
if (konnica) eq(konnica[BATTLE], 7, 'Konnica: ' + BATTLE);

// 2. Rydwany bez zmian
const woly = byName['Rydwan (woły)'];
assert(!!woly, 'brak wpisu "Rydwan (woły)"');
if (woly) eq(woly[BATTLE], 5, 'Rydwan (woły): ' + BATTLE);

const rydwany = units.filter(u => u && typeof u['Jednostka'] === 'string'
  && /^Rydwan/.test(u['Jednostka']) && u['Jednostka'] !== 'Rydwan (woły)');
assert(rydwany.length > 0, 'brak pozostałych rydwanów');
for (const r of rydwany) {
  eq(r[BATTLE], 6, r['Jednostka'] + ': ' + BATTLE);
}

// 3. Pole „Ruch” (mapa świata) nie zmienione — snapshot z origin/main b77a0b7b9.
const RUCH_SNAPSHOT = {
  'Wojownik': 2,
  'Procarz': 2,
  'Oszczepnik': 2,
  'Łucznik': 2,
  'Zwiadowca': 3,
  'Włócznik': 2,
  'Wojownik z mieczem i tarczą': 2,
  'Rydwan (woły)': 3,
  'Konnica': 4,
  'Galera': 4,
  'Falanga': 1,
  'Hieros Lochos (Święty Zastęp)': 2,
  'Hastati': 2,
  'Triari': 2,
  'Jeździec chiński': 4,
  'Hu Ben Wei (Gwardia Tygrysa)': 3,
  'Impi': 4,
  'Oszczepnik Zulu (Izijula)': 2,
  'uThulwana (Białe Tarcze)': 4,
  'Wojownik z maczugą (Chaska)': 3,
  'Wojownik z toporem': 2,
  'Procarz (Huaracoc)': 2,
  'Oszczepnik (Estólica)': 2,
  'Królewska Gwardia': 3,
  'Rydwan konny': 4,
  'Łucznik egipski': 2,
  'Rydwan egipski': 5,
  'Wojownik z khopesh': 2,
  'Medżaj (Gwardia Faraona)': 3,
  'Łucznik nubijski': 3,
  'Łucznik sumeryjski': 2,
  'Rydwan sumeryjski': 4,
  'Włócznik sumeryjski': 2,
  'Gwardia Królewska Sumeru': 2,
  'Wojownik mykeński': 2,
  'Rydwan mykeński': 4,
  'Wojownik Sherden': 2,
  'Halabardnik Shang': 2,
  'Rydwan Shang': 4,
  'Łucznik akadyjski': 2,
  'Gaesatae': 3,
  'Soldurii': 2,
  'Rydwan celtycki': 4,
  'Wojownik germański': 3,
  'Berserker germański': 3,
  'Taran': 1,
  'Taran okuty': 1,
  'Katapulta': 1,
  'Wieża oblężnicza': 1,
  'Wojownik tyrreński': 2,
  'Wojownik szekelesz': 2,
  'Konnica lancowa asyryjska': 4,
  'Konnica łucznicza asyryjska': 4,
  'Łucznik asyryjski': 2,
  'Drużynnik': 2,
  'Jeździec z oszczepami': 4,
  'Strażnik bram Harappy': 2,
  'Piechota induska': 2,
  'Garnizon Harappy': 2,
  'Rydwan Kapadokijski': 5,
  'Piechota hetycka': 2,
  'Gwardia hetycka': 2,
  'Gwardia Ishtar': 2,
  'Wojownik babiloński': 2,
  'Piechota neobabilońska': 2,
  'Tyrski miecznik': 2,
  'Wojownik fenicki': 2,
  'Gwardia Tyreńska': 2,
  'Thorakites': 2,
  'Evocati': 2,
  'iButho z iklwa': 4,
  'Gwardzista z champi': 2,
  'Wojownik z żelaznym khopesh': 2,
  'Mur tarcz (Sargonid)': 2,
  'Miecznik galijski': 3,
};

for (const [name, ruch] of Object.entries(RUCH_SNAPSHOT)) {
  const u = byName[name];
  assert(!!u, `brak jednostki "${name}" w units.json`);
  if (u) eq(u['Ruch'], ruch, `${name}: pole "Ruch" (mapa)`);
}
eq(Object.keys(RUCH_SNAPSHOT).length, units.filter(u => u && u['Jednostka']).length,
  'liczba jednostek w snapshocie pola "Ruch" zgodna z units.json');

console.log(`chariot-move-6-data-test: passed=${passed} failed=${failed}`);
if (failed > 0) process.exit(1);
