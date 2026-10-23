// P6.7B - tabela Unicode `nfd-strip-table.json`: dla kazdego punktu kodowego, ktorego rozklad NFD z uruchomionego
// Node (`String.prototype.normalize('NFD')`) jest inny niz sam znak, zapisuje wynik rozkladu po wycieciu
// znakow laczacych U+0300-U+036F (to dokladnie pierwsze dwa kroki webowego `stripDiacriticsLower`).
// Sylaby Hangul (U+AC00-U+D7A3) sa pominiete - rozklada je algorytm (stale w sekcji `hangul`).
// Uzycie: node gen-p67b-nfd-table.mjs <OUT_JSON>
import { writeFileSync } from 'node:fs';

const out = process.argv[2];
if (!out) {
  console.error('usage: <OUT_JSON>');
  process.exit(2);
}
const STRIP = /[̀-ͯ]/g;
const entries = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  if (cp >= 0xac00 && cp <= 0xd7a3) continue; // Hangul: algorytmicznie
  if (cp >= 0x0300 && cp <= 0x036f) continue; // wycinane wprost
  const ch = String.fromCodePoint(cp);
  const nfd = ch.normalize('NFD');
  if (nfd === ch) continue;
  entries.push([cp, nfd.replace(STRIP, '')]);
}

// Sortowanie kanoniczne: JS nie udostepnia klasy laczenia (ccc), wiec porzadek wyprowadzamy z zachowania
// `normalize('NFD')`: dwa znaki laczace sa zamieniane miejscami tylko wtedy, gdy ccc pierwszego > ccc drugiego.
// Znak ma ccc != 0 <=> zostaje przestawiony wzgledem wzorca o ccc=240 (U+0345) albo wzgledem wzorca o ccc=1 (U+0334).
const BASE = 'a';
const swapped = (m1, m2) => m1 !== m2 && (BASE + m1 + m2).normalize('NFD') === BASE + m2 + m1;
const R_HI = 'ͅ';
const R_LO = '̴';
const marks = [];
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue;
  if (cp >= 0x0300 && cp <= 0x036f) continue;
  const ch = String.fromCodePoint(cp);
  if (!/\p{M}/u.test(ch)) continue;
  if (swapped(R_HI, ch) || swapped(ch, R_LO) || ch === R_HI || ch === R_LO) marks.push(ch);
}
const cmpMarks = (a, b) => (swapped(a, b) ? 1 : swapped(b, a) ? -1 : 0);
marks.sort(cmpMarks);
const order = [];
let rank = 0;
for (let i = 0; i < marks.length; i++) {
  if (i === 0 || cmpMarks(marks[i - 1], marks[i]) !== 0) rank++;
  order.push([marks[i].codePointAt(0), rank]);
}
// kontrola: kazda para o roznych rangach jest uporzadkowana zgodnie z NFD
for (let i = 0; i < marks.length; i += 7) {
  for (let j = i + 1; j < marks.length; j += 11) {
    const a = marks[i];
    const b = marks[j];
    const ra = order[i][1];
    const rb = order[j][1];
    const expectSwap = ra > rb;
    if (swapped(a, b) !== expectSwap) throw new Error('niespojny porzadek ccc: ' + order[i] + ' ' + order[j]);
  }
}

const doc = {
  meta: {
    zrodlo: 'Node ' + process.version + ' (ICU ' + process.versions.icu + ', Unicode ' + process.versions.unicode + '): String.prototype.normalize(NFD) + wyciecie U+0300-U+036F',
    wygenerowano: 'R-RUSTPORT-P6-7B-MIASTA-WZROST-B-Q1, generator: gen-p67b-nfd-table.mjs',
    uwaga: 'Dane Unicode, nie balans. Wpis [punkt_kodowy, napis] = pelny rozklad kanoniczny po wycieciu znakow laczacych U+0300-U+036F. Hangul rozkladany algorytmicznie (sekcja hangul). Sortowanie kanoniczne: sekcja kolejnosc_znakow_laczacych = [punkt_kodowy, ranga], ranga rosnaca z klasa laczenia (ccc), znaki bez wpisu maja ccc 0.',
  },
  wycinany_zakres: { od: 0x0300, do: 0x036f },
  hangul: { s_base: 0xac00, l_base: 0x1100, v_base: 0x1161, t_base: 0x11a7, l_count: 19, v_count: 21, t_count: 28 },
  wpisy: entries,
  kolejnosc_znakow_laczacych: order,
};
// jeden wpis w linii (czytelny diff); reszta pretty-print
const lines = (list) => '[\n' + list.map((e) => '    ' + JSON.stringify(e)).join(',\n') + '\n  ]';
const body = JSON.stringify({ ...doc, wpisy: '@@WPISY@@', kolejnosc_znakow_laczacych: '@@ORDER@@' }, null, 2)
  .replace('"@@WPISY@@"', lines(entries))
  .replace('"@@ORDER@@"', lines(order));
writeFileSync(out, body + '\n');
console.log('wpisow: ' + entries.length);
