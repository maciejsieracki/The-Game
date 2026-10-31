'use strict';
/**
 * clearing-deficit-summarize-measure.cjs — agregacja wynikow B z `clearing-deficit-live-measure.cjs`.
 * Usage: node tools/clearing-deficit-summarize-measure.cjs <plik.json|.partial.json> [...]
 * Dla kazdego pliku: odsetek tur z niedoborem (>=1 klucz), osobno: niedobor magazynowy (<pakiet),
 * niedobor "tylko z kolejki" (klucz poza stockDeficit i != zywnosc), niedobor zywnosci, niedobor
 * bez zywnosci; czestosc kluczy; tury "bez niedoboru"; podzial wg liczby miast.
 */
const fs = require('fs');

for (const f of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const rows = j.rows;
  const n = rows.length;
  const cnt = (pred) => rows.filter(pred).length;
  const pct = (x) => (100 * x / n).toFixed(1) + '%';
  const keyFreq = {};
  for (const r of rows) for (const k of r.deficit) keyFreq[k] = (keyFreq[k] || 0) + 1;
  const queueOnly = (r) => r.deficit.filter((k) => k !== 'zywnosc' && !r.stockDeficit.includes(k));
  const withoutFood = (r) => r.deficit.filter((k) => k !== 'zywnosc');
  const byCities = {};
  for (const r of rows) {
    const c = r.cities;
    byCities[c] = byCities[c] || { n: 0, def: 0, stockDef: 0, avgKeys: 0, avgStockKeys: 0 };
    byCities[c].n++;
    if (r.deficit.length) byCities[c].def++;
    if (r.stockDeficit.length) byCities[c].stockDef++;
    byCities[c].avgKeys += r.deficit.length;
    byCities[c].avgStockKeys += r.stockDeficit.length;
  }
  for (const c of Object.keys(byCities)) {
    byCities[c].avgKeys = +(byCities[c].avgKeys / byCities[c].n).toFixed(2);
    byCities[c].avgStockKeys = +(byCities[c].avgStockKeys / byCities[c].n).toFixed(2);
  }
  const noDef = rows.filter((r) => r.deficit.length === 0).map((r) => r.turn);
  const noDefStock = rows.filter((r) => r.stockDeficit.length === 0).map((r) => r.turn);
  // surowce "stale" (w deficycie w >=95% tur) i "bywa" (5..95%)
  const always = Object.entries(keyFreq).filter(([, v]) => v >= 0.95 * n).map(([k]) => k);
  const some = Object.entries(keyFreq).filter(([, v]) => v < 0.95 * n).map(([k, v]) => k + ':' + v + '/' + n);
  const stockKeysAbove = {};
  for (const r of rows) for (const k of r.pricedKeys) if (r.stock[k] >= r.pakiet) stockKeysAbove[k] = (stockKeysAbove[k] || 0) + 1;
  const last = rows[rows.length - 1];
  console.log(JSON.stringify({
    file: f.split('/').pop(), tag: j.tag, tur: n, turyZakres: [rows[0].turn, last.turn], foundAt: j.foundAt,
    niedobor_ge1_klucz: cnt((r) => r.deficit.length > 0) + '/' + n + ' = ' + pct(cnt((r) => r.deficit.length > 0)),
    niedobor_magazynowy_lt_pakiet: cnt((r) => r.stockDeficit.length > 0) + '/' + n + ' = ' + pct(cnt((r) => r.stockDeficit.length > 0)),
    niedobor_z_kolejki_poza_magazynowym: cnt((r) => queueOnly(r).length > 0) + '/' + n,
    niedobor_zywnosci_flag: cnt((r) => r.deficit.includes('zywnosc')) + '/' + n,
    niedobor_bez_zywnosci: cnt((r) => withoutFood(r).length > 0) + '/' + n,
    sredniaLiczbaKluczy: +(rows.reduce((s, r) => s + r.deficit.length, 0) / n).toFixed(2),
    sredniaLiczbaKluczyMagazyn: +(rows.reduce((s, r) => s + r.stockDeficit.length, 0) / n).toFixed(2),
    tury_bez_niedoboru: noDef, tury_bez_niedoboru_magazynowego: noDefStock,
    kluczeStale95: always, kluczeBywa: some,
    surowceZapasGePakiet_liczbaTur: stockKeysAbove,
    wgLiczbyMiast: byCities,
    turyZNiepustaKolejkaBudowyLubRekrutacji: cnt((r) => (r.queuedB && r.queuedB.length) || (r.queuedU && r.queuedU.length)) + '/' + n,
    ulepszeniaNaMapieWTerytorium: { t1: rows[0].imp, t30: (rows[Math.min(30, n - 1)] || {}).imp, tLast: last.imp },
    budynkiWMiastach: { t30: (rows[Math.min(30, n - 1)] || {}).built, tLast: last.built },
    zapasSurowcaGePakiet_liczbaTurPerKlucz: stockKeysAbove,
    ostatniaTura: { turn: last.turn, deficit: last.deficit, stock: last.stock, built: last.built, pop: last.pop, queuedB: last.queuedB },
  }));
}
