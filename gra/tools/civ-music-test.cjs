'use strict';
/**
 * civ-music-test.cjs — R-WEB-DIPLO-CIV-MUSIC-Q1
 *
 * Czysty test jednostkowy wyboru sciezki muzyki dyplomacji (src/audio/civMusic.ts)
 * na REALNYM manifescie data/civ-music.json i realnej liscie plikow z dysku
 * (src/audio/utwory/dyplomacja/_civ/<civId>/*.mp3). Kod TS kompilowany esbuildem
 * i wykonywany (nie regex-nad-tekstem).
 *
 *  A. Manifest <-> dysk: kazdy plik z manifestu istnieje; kazdy mp3 w _civ/ jest w manifescie.
 *  B. Grecy/Rzymianie/Chinczycy/Zulusi/Egipt: [przywitanie, negocjacje], leadCount=1.
 *  C. Inkowie: DWA utwory negocjacji, brak przywitania (leadCount=0).
 *  D. Sumerowie (civId sumer): tylko przywitanie, po nim dotychczasowy utwor dyplomacji (fallback).
 *  E. Cywilizacja bez wpisu / undefined / pusty / klucz "_opis" / prototyp => null.
 *  F. Plik z manifestu nieobecny na dysku => pominiety; brak wszystkiego => null (fallback).
 *  G. Wybor po civId rozmowcy (parametr), nie gracza.
 *  H. Rozmiar: suma plikow <= 12 MB.
 *  I. Mutacja: usuniecie wpisu z manifestu => null (test pada na bazie bez kodu).
 *
 * Bramka (z gra/): node tools/civ-music-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.join(__dirname, '..');
const MUSIC_DIR = path.join(GRA, 'src', 'audio', 'utwory', 'dyplomacja', '_civ');
const manifest = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'civ-music.json'), 'utf8'));

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

const js = esbuild.transformSync(
  fs.readFileSync(path.join(GRA, 'src', 'audio', 'civMusic.ts'), 'utf8'),
  { loader: 'ts', format: 'cjs' },
).code;
const mod = { exports: {} };
new Function('module', 'exports', js)(mod, mod.exports);
const { resolveCivDiplomacyTracks } = mod.exports;

// URL-e = "url:<civ>/<plik>" (identyfikowalne w asercjach)
const available = {};
let totalBytes = 0;
const onDisk = [];
for (const civ of fs.readdirSync(MUSIC_DIR)) {
  const d = path.join(MUSIC_DIR, civ);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.mp3')) continue;
    available[`${civ}/${f}`] = `url:${civ}/${f}`;
    onDisk.push(`${civ}/${f}`);
    totalBytes += fs.statSync(path.join(d, f)).size;
  }
}
const FALLBACK = ['url:fallback/Gilded_Porticos.mp3'];

console.log('--- A. manifest <-> dysk');
const inManifest = [];
for (const [civ, e] of Object.entries(manifest)) {
  if (civ.startsWith('_')) continue;
  for (const f of [e.greeting, ...(e.negotiation || [])].filter(Boolean)) inManifest.push(`${civ}/${f}`);
}
assert('A1 kazdy plik z manifestu istnieje', inManifest.every((k) => onDisk.includes(k)),
  inManifest.filter((k) => !onDisk.includes(k)));
assert('A2 kazdy mp3 z _civ/ jest w manifescie', onDisk.every((k) => inManifest.includes(k)),
  onDisk.filter((k) => !inManifest.includes(k)));

console.log('--- B. pelne cywilizacje');
for (const civ of ['grecy', 'rzymianie', 'chinczycy', 'zulusi', 'egipt']) {
  const r = resolveCivDiplomacyTracks(manifest, civ, available, FALLBACK);
  assert(`B ${civ}: [przywitanie, negocjacje], lead=1`,
    r && r.leadCount === 1 && r.urls.length === 2
    && r.urls[0] === `url:${civ}/${civ}_przywitanie.mp3` && r.urls[1] === `url:${civ}/${civ}_negocjacje.mp3`, r);
}

console.log('--- C. Inkowie');
const ink = resolveCivDiplomacyTracks(manifest, 'inkowie', available, FALLBACK);
assert('C1 dwa utwory negocjacji', ink && ink.urls.length === 2 && ink.urls[0] !== ink.urls[1], ink);
assert('C2 brak przywitania (lead=0)', ink && ink.leadCount === 0, ink);

console.log('--- D. Sumerowie (civId sumer)');
const sum = resolveCivDiplomacyTracks(manifest, 'sumer', available, FALLBACK);
assert('D1 przywitanie + dotychczasowy utwor dyplomacji po nim',
  sum && sum.leadCount === 1 && sum.urls[0] === 'url:sumer/sumer_przywitanie.mp3' && sum.urls[1] === FALLBACK[0], sum);
const sumNoFb = resolveCivDiplomacyTracks(manifest, 'sumer', available, []);
assert('D2 bez utworu fallback: tylko przywitanie w petli (lead=0)', sumNoFb && sumNoFb.urls.length === 1 && sumNoFb.leadCount === 0, sumNoFb);

console.log('--- E. brak wpisu => null (zero regresji)');
for (const civ of ['persowie', 'babilon', undefined, '', '_opis', 'constructor', '__proto__', 'toString']) {
  assert(`E civ=${JSON.stringify(civ)} => null`, resolveCivDiplomacyTracks(manifest, civ, available, FALLBACK) === null);
}

console.log('--- F. brakujace pliki / bledny manifest');
const partial = { ...available };
delete partial['grecy/grecy_przywitanie.mp3'];
const g1 = resolveCivDiplomacyTracks(manifest, 'grecy', partial, FALLBACK);
assert('F1 brak przywitania na dysku => same negocjacje', g1 && g1.urls.length === 1 && g1.leadCount === 0, g1);
delete partial['grecy/grecy_negocjacje.mp3'];
assert('F2 brak wszystkich plikow => null', resolveCivDiplomacyTracks(manifest, 'grecy', partial, FALLBACK) === null);
assert('F3 pusty manifest => null', resolveCivDiplomacyTracks({}, 'grecy', available, FALLBACK) === null);
assert('F4 wpis nie-obiekt => null', resolveCivDiplomacyTracks({ grecy: 'x' }, 'grecy', available, FALLBACK) === null);
assert('F5 negotiation nie-tablica => bez wyjatku',
  resolveCivDiplomacyTracks({ grecy: { negotiation: 'x' } }, 'grecy', available, FALLBACK) === null);

console.log('--- G. wybor po civId rozmowcy');
const a = resolveCivDiplomacyTracks(manifest, 'egipt', available, FALLBACK);
const b = resolveCivDiplomacyTracks(manifest, 'rzymianie', available, FALLBACK);
assert('G1 rozne civId => rozne utwory', a.urls[0] !== b.urls[0]);

console.log('--- H. rozmiar');
const mb = totalBytes / 1048576;
console.log(`      suma plikow: ${totalBytes} B (${mb.toFixed(2)} MiB)`);
assert('H1 suma <= 12 MiB', mb <= 12, mb);

console.log('--- I. mutacja (usuniety wpis)');
const mut = { ...manifest };
delete mut.grecy;
assert('I1 bez wpisu grecy => null (test wykrywa zmiane manifestu)', resolveCivDiplomacyTracks(mut, 'grecy', available, FALLBACK) === null);

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
