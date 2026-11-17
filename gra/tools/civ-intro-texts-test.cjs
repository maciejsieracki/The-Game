// Test danych: gra/data/civ-intro-texts.json (teksty ekranu powitalnego nowej cywilizacji).
// Uruchomienie: node gra/tools/civ-intro-texts-test.cjs [opcjonalna_sciezka_do_pliku_json]
// Opcjonalna sciezka pozwala uruchomic test na kopii pliku (mutacje bez git checkout).
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const textsPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'data', 'civ-intro-texts.json');
const civs = require(path.join(root, 'data', 'civs.json')).cywilizacje;

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL: ' + msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); };

function sentenceCount(text) {
  const parts = text.trim().split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  return parts.length;
}

function endsWithPunct(text) {
  return /[.!?]$/.test(text.trim());
}

let data;
try {
  data = JSON.parse(fs.readFileSync(textsPath, 'utf8'));
} catch (e) {
  console.error('FAIL: plik nie parsuje sie jako JSON: ' + e.message);
  process.exit(1);
}

const civIds = civs.map((c) => c.ikonaId).sort();
const keys = Object.keys(data).sort();
ok(keys.length === 15, 'liczba kluczy = ' + keys.length + ', oczekiwano 15');
ok(JSON.stringify(keys) === JSON.stringify(civIds), 'zbior kluczy != zbior ikonaId z civs.json (brak: ' +
  civIds.filter((k) => !keys.includes(k)).join(',') + '; nadmiar: ' + keys.filter((k) => !civIds.includes(k)).join(',') + ')');

const allGreetings = [];
const rulerNames = new Set();
for (const c of civs) {
  for (const name of Object.values(c.wodzowie || {})) rulerNames.add(name);
  for (const name of (c.wodzowiePula || [])) rulerNames.add(name);
}

for (const id of civIds) {
  const e = data[id];
  if (!e || typeof e !== 'object') { fail(id + ': wpis brakuje lub nie jest obiektem'); continue; }

  const rys = e.rys_historyczny;
  ok(typeof rys === 'string', id + ': rys_historyczny musi byc string');
  if (typeof rys === 'string') {
    const n = sentenceCount(rys);
    ok(n >= 3 && n <= 4, id + ': rys ma ' + n + ' zdan, oczekiwano 3-4');
    ok(rys.length >= 300 && rys.length <= 700, id + ': rys ma ' + rys.length + ' znakow, oczekiwano 300-700');
    ok(endsWithPunct(rys), id + ': rys nie konczy sie znakiem konca zdania');
    ok(!/'/.test(rys), id + ': rys zawiera apostrof');
    ok(!/  /.test(rys), id + ': rys zawiera podwojna spacje');
  }

  for (const field of ['powitanie_przyjazne', 'powitanie_nieprzyjazne']) {
    const list = e[field];
    ok(Array.isArray(list), id + ': ' + field + ' musi byc lista');
    if (!Array.isArray(list)) continue;
    ok(list.length === 3, id + ': ' + field + ' ma ' + list.length + ' elementow, oczekiwano 3');
    ok(new Set(list).size === list.length, id + ': ' + field + ' zawiera duplikaty');
    for (const g of list) {
      ok(typeof g === 'string', id + ': powitanie nie jest stringiem');
      if (typeof g !== 'string') continue;
      ok(g.length >= 20 && g.length <= 260, id + ': powitanie ma ' + g.length + ' znakow (oczekiwano 20-260): ' + g);
      const n = sentenceCount(g);
      ok(n >= 1 && n <= 2, id + ': powitanie ma ' + n + ' zdan, oczekiwano 1-2: ' + g);
      ok(endsWithPunct(g), id + ': powitanie nie konczy sie znakiem konca zdania: ' + g);
      ok(!/'/.test(g), id + ': powitanie zawiera apostrof: ' + g);
      ok(!/  /.test(g), id + ': powitanie zawiera podwojna spacje: ' + g);
      ok(!/\d/.test(g), id + ': powitanie zawiera liczbe: ' + g);
      for (const name of rulerNames) {
        ok(!g.includes(name), id + ': powitanie zawiera imie wladcy "' + name + '": ' + g);
      }
      allGreetings.push(g);
    }
  }
}

const dupes = allGreetings.filter((g, i) => allGreetings.indexOf(g) !== i);
ok(dupes.length === 0, 'powitania powtarzaja sie w pliku: ' + dupes.join(' | '));

if (failures > 0) {
  console.error('civ-intro-texts-test: ' + failures + ' blednych asercji');
  process.exit(1);
}
console.log('civ-intro-texts-test: OK (15 cywilizacji, ' + allGreetings.length + ' powitan)');
