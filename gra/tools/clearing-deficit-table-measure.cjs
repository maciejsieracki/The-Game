'use strict';
/**
 * clearing-deficit-table-measure.cjs — tabela zbiorcza z plikow summary-*.json (wynik
 * `clearing-deficit-summarize-measure.cjs`). Usage: node tools/clearing-deficit-table-measure.cjs <evidenceDir>
 */
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('summary-') && x.endsWith('.json')).sort()) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const cities = Object.entries(j.wgLiczbyMiast).map(([k, v]) => `${k}m:${v.def}/${v.n}(avg ${v.avgKeys})`).join(' ');
  console.log([
    j.tag, 'tur=' + j.tur,
    '>=1 klucz=' + j.niedobor_ge1_klucz,
    'mag<10=' + j.niedobor_magazynowy_lt_pakiet,
    'flagaZywnosc=' + j.niedobor_zywnosci_flag,
    'beZywnosci=' + j.niedobor_bez_zywnosci,
    'srKluczy=' + j.sredniaLiczbaKluczy,
    'turBezNiedoboru=' + JSON.stringify(j.tury_bez_niedoboru),
    'surowceStale95=' + j.kluczeStale95SurowceLiczba + ' flagaZywnoscStala95=' + j.flagaZywnoscStala95,
    'kolejkaPozaMag=' + j.niedobor_z_kolejki_poza_magazynowym + ' klucze=' + JSON.stringify(j.kolejkaPozaMagazynem_kluczeLiczbaTur),
    'maxMiast=' + j.maxMiast + ' tury2+=' + j.turyZ2PlusMiast,
    'bywa=' + JSON.stringify(j.kluczeBywa),
    'zapas>=10(tur)=' + JSON.stringify(j.surowceZapasGePakiet_liczbaTur),
    'wgMiast ' + cities,
    'kolejkaNiepusta=' + j.turyZNiepustaKolejkaBudowyLubRekrutacji,
    'imp=' + JSON.stringify(j.ulepszeniaNaMapieWTerytorium),
    'budynki=' + JSON.stringify(j.budynkiWMiastach),
    'popOst=' + JSON.stringify(j.ostatniaTura.pop),
  ].join(' | '));
  console.log('');
}
