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
 *  J. R-WEB-DIPLO-CIV-MUSIC-PACK2-Q1: 15/15 cywilizacji z civs.json ma wpis i dostepne pliki.
 *  K. Przywitanie jako lista (Zulusi): dwa rozne pliki, rotacja bez powtorzenia z rzedu,
 *     wstrzykiwany indeks, string nadal dziala, braki w liscie.
 *  L. 19 plikow PACK2: stale MD5 po przekodowaniu (transcode-pack2.sh w runie) i brak duplikatow MD5 w _civ/.
 *  M. 19 plikow PACK2: dlugosci ffprobe (negocjacje >= 120 s, przywitania 30-70 s).
 *
 * Bramka (z gra/): node tools/civ-music-test.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
const { resolveCivDiplomacyTracks, resetGreetingRotation } = mod.exports;

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
  const greetings = [].concat(e.greeting || []);
  for (const f of [...greetings, ...(e.negotiation || [])].filter(Boolean)) inManifest.push(`${civ}/${f}`);
}
assert('A1 kazdy plik z manifestu istnieje', inManifest.every((k) => onDisk.includes(k)),
  inManifest.filter((k) => !onDisk.includes(k)));
assert('A2 kazdy mp3 z _civ/ jest w manifescie', onDisk.every((k) => inManifest.includes(k)),
  onDisk.filter((k) => !inManifest.includes(k)));

console.log('--- B. pelne cywilizacje');
for (const civ of ['grecy', 'rzymianie', 'chinczycy', 'egipt', 'sumer', 'asyria', 'babilonia', 'celtowie', 'fenicjanie', 'germanie', 'harappa', 'hetyci', 'slowianie']) {
  const r = resolveCivDiplomacyTracks(manifest, civ, available, FALLBACK);
  assert(`B ${civ}: [przywitanie, negocjacje], lead=1`,
    r && r.leadCount === 1 && r.urls.length === 2
    && r.urls[0] === `url:${civ}/${civ}_przywitanie.mp3` && r.urls[1] === `url:${civ}/${civ}_negocjacje.mp3`, r);
}

console.log('--- C. Inkowie');
const ink = resolveCivDiplomacyTracks(manifest, 'inkowie', available, FALLBACK);
assert('C1 przywitanie + dwa utwory negocjacji', ink && ink.urls.length === 3 && ink.urls[1] !== ink.urls[2], ink);
assert('C2 przywitanie (lead=1) jako pierwsze', ink && ink.leadCount === 1 && ink.urls[0] === 'url:inkowie/inkowie_przywitanie.mp3', ink);

console.log('--- D. zachowanie przy braku negocjacji / przywitania (sztuczny manifest)');
const sumNoNeg = resolveCivDiplomacyTracks({ sumer: { greeting: 'sumer_przywitanie.mp3' } }, 'sumer', available, FALLBACK);
assert('D1 przywitanie + dotychczasowy utwor dyplomacji po nim',
  sumNoNeg && sumNoNeg.leadCount === 1 && sumNoNeg.urls[0] === 'url:sumer/sumer_przywitanie.mp3' && sumNoNeg.urls[1] === FALLBACK[0], sumNoNeg);
const sumNoFb = resolveCivDiplomacyTracks({ sumer: { greeting: 'sumer_przywitanie.mp3' } }, 'sumer', available, []);
assert('D2 bez utworu fallback: tylko przywitanie w petli (lead=0)', sumNoFb && sumNoFb.urls.length === 1 && sumNoFb.leadCount === 0, sumNoFb);
const noGreet = resolveCivDiplomacyTracks({ sumer: { negotiation: ['sumer_negocjacje.mp3'] } }, 'sumer', available, FALLBACK);
assert('D3 brak przywitania => od negocjacji (lead=0)', noGreet && noGreet.leadCount === 0 && noGreet.urls.length === 1, noGreet);
const sum = resolveCivDiplomacyTracks(manifest, 'sumer', available, FALLBACK);
assert('D4 realny sumer: przywitanie + negocjacje', sum && sum.leadCount === 1 && sum.urls.length === 2 && sum.urls[1] === 'url:sumer/sumer_negocjacje.mp3', sum);

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
assert('H1 suma <= 27 MiB (PACK2: 10,72 + 14,21)', mb <= 27, mb);

console.log('--- I. mutacja (usuniety wpis)');
const mut = { ...manifest };
delete mut.grecy;
assert('I1 bez wpisu grecy => null (test wykrywa zmiane manifestu)', resolveCivDiplomacyTracks(mut, 'grecy', available, FALLBACK) === null);

console.log('--- J. 15/15 cywilizacji (civs.json)');
const civsRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'civs.json'), 'utf8'));
const civList = civsRaw.cywilizacje;
const civIds = civList.map((c) => c && c.ikonaId).filter(Boolean);
assert('J1 civs.json ma 15 cywilizacji', civIds.length === 15, civIds);
for (const civ of civIds) {
  const r = resolveCivDiplomacyTracks(manifest, civ, available, FALLBACK, () => 0);
  assert(`J ${civ}: wpis w manifescie, przywitanie + negocjacje dostepne`, r && r.leadCount === 1 && r.urls.length >= 2, r);
}

console.log('--- K. przywitanie jako lista (rotacja)');
const zul = manifest.zulusi;
assert('K1 Zulusi: dwa rozne przywitania w manifescie', Array.isArray(zul.greeting) && zul.greeting.length === 2 && zul.greeting[0] !== zul.greeting[1], zul);
resetGreetingRotation();
const seq = [];
for (let n = 0; n < 6; n++) seq.push(resolveCivDiplomacyTracks(manifest, 'zulusi', available, FALLBACK).urls[0]);
assert('K2 rotacja po kolei: dwa rozne pliki, nigdy to samo dwa razy z rzedu',
  new Set(seq).size === 2 && seq.every((u, i) => i === 0 || u !== seq[i - 1]), seq);
const forced0 = resolveCivDiplomacyTracks(manifest, 'zulusi', available, FALLBACK, () => 0);
const forced1 = resolveCivDiplomacyTracks(manifest, 'zulusi', available, FALLBACK, () => 1);
assert('K3 wstrzykniety indeks 0/1 wybiera przywitanie', forced0.urls[0] === 'url:zulusi/zulusi_przywitanie.mp3'
  && forced1.urls[0] === 'url:zulusi/zulusi_przywitanie_2.mp3' && forced1.leadCount === 1, [forced0, forced1]);
const forcedBad = resolveCivDiplomacyTracks(manifest, 'zulusi', available, FALLBACK, () => 99);
assert('K4 indeks poza zakresem => bezpiecznie pierwsze', forcedBad.urls[0] === 'url:zulusi/zulusi_przywitanie.mp3', forcedBad);
const strEntry = resolveCivDiplomacyTracks({ grecy: { greeting: 'grecy_przywitanie.mp3', negotiation: ['grecy_negocjacje.mp3'] } }, 'grecy', available, FALLBACK);
assert('K5 greeting jako string nadal dziala (zgodnosc wsteczna)', strEntry && strEntry.leadCount === 1 && strEntry.urls.length === 2, strEntry);
resetGreetingRotation();
const missing2 = { ...available };
delete missing2['zulusi/zulusi_przywitanie_2.mp3'];
const miss = [0, 1, 2].map(() => resolveCivDiplomacyTracks(manifest, 'zulusi', missing2, FALLBACK).urls[0]);
assert('K6 brak jednego pliku z listy => zawsze to jedno przywitanie', miss.every((u) => u === 'url:zulusi/zulusi_przywitanie.mp3'), miss);
const emptyList = resolveCivDiplomacyTracks({ zulusi: { greeting: [], negotiation: ['zulusi_negocjacje.mp3'] } }, 'zulusi', available, FALLBACK);
assert('K7 pusta lista przywitan => od negocjacji (lead=0)', emptyList && emptyList.leadCount === 0 && emptyList.urls.length === 1, emptyList);
resetGreetingRotation();
const rot = ['asyria', 'zulusi', 'asyria', 'zulusi'].map((c) => resolveCivDiplomacyTracks(manifest, c, available, FALLBACK).urls[0]);
assert('K8 stan rotacji per cywilizacja (druga rozmowa Zulusow = przywitanie 2)', rot[3] === 'url:zulusi/zulusi_przywitanie_2.mp3', rot);

console.log('--- L. MD5 19 plikow PACK2 + brak duplikatow');
const PACK2_MD5 = {
  "asyria/asyria_negocjacje.mp3": "381a7481f48375c7bfc06d4b309f4ca3",
  "asyria/asyria_przywitanie.mp3": "2903be82381824d44d45cb6917c51e17",
  "babilonia/babilonia_negocjacje.mp3": "10ee0733e231581c10d61f9c3a268c25",
  "babilonia/babilonia_przywitanie.mp3": "b9cedda4a486126e8957175e129fb9ad",
  "celtowie/celtowie_negocjacje.mp3": "85270f26e7d6c5631f88e7efc71669a3",
  "celtowie/celtowie_przywitanie.mp3": "ca327d2b2eb1ab0b9520c4177507ebf4",
  "fenicjanie/fenicjanie_negocjacje.mp3": "aed2f5eae13ba30e8d1f56280dd5668b",
  "fenicjanie/fenicjanie_przywitanie.mp3": "eaafb8f9d366cf4169c52f9d8d476a88",
  "germanie/germanie_negocjacje.mp3": "19487d761dfafb37c4d703cdda41c639",
  "germanie/germanie_przywitanie.mp3": "c87cac116b9a433b6aec136a00d372b9",
  "harappa/harappa_negocjacje.mp3": "b6db19109e6890f201ca6f36be4c389a",
  "harappa/harappa_przywitanie.mp3": "24cf78d65370004bc518bcb63352f1ed",
  "hetyci/hetyci_negocjacje.mp3": "e857983efff7c10302d411d8e18e1c8b",
  "hetyci/hetyci_przywitanie.mp3": "59ea3b02ddc0c51aac6f8cacfcca01b9",
  "inkowie/inkowie_przywitanie.mp3": "8f019a38f1521760402bc6776b3f820c",
  "slowianie/slowianie_negocjacje.mp3": "c10d1fd819efd8a6ecd5bb236f3208c6",
  "slowianie/slowianie_przywitanie.mp3": "794b4450bce7708382bfc8443fcd7bfa",
  "sumer/sumer_negocjacje.mp3": "e189ec9bcda0a7b900bbba3fce5d7a67",
  "zulusi/zulusi_przywitanie_2.mp3": "ba639a47dbe6ef974e9e0255a99ff329"
};
const md5 = {};
for (const k of onDisk) md5[k] = crypto.createHash('md5').update(fs.readFileSync(path.join(MUSIC_DIR, k))).digest('hex');
for (const [k, h] of Object.entries(PACK2_MD5)) assert(`L ${k} MD5`, md5[k] === h, md5[k]);
const byHash = {};
for (const [k, h] of Object.entries(md5)) (byHash[h] = byHash[h] || []).push(k);
const dups = Object.values(byHash).filter((a) => a.length > 1);
assert('L2 brak duplikatow MD5 w _civ/', dups.length === 0, dups);

console.log('--- M. dlugosci PACK2 (ffprobe): negocjacje >= 2:00, przywitania 0:30-1:10');
const { execFileSync } = require('child_process');
const dur = (rel) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(MUSIC_DIR, rel)]).toString());
for (const k of Object.keys(PACK2_MD5)) {
  const d = dur(k);
  if (k.includes('_negocjacje')) assert(`M ${k} >= 120 s`, d >= 120, d.toFixed(2));
  else assert(`M ${k} 30-70 s`, d >= 30 && d <= 70, d.toFixed(2));
}

console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
