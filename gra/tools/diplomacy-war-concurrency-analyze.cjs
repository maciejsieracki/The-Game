'use strict';
/**
 * diplomacy-war-concurrency-analyze.cjs -- R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1 (pomiar).
 *
 * Wejscie: pliki jsonl runnera (`diplomacy-harder-measure-run.cjs`), jedna linia na ture:
 *   { seed, harder, turn, diplo: { pairs: [{ a, b, status, typWojny? }] } }
 * Liczy per tura i per cywilizacja liczbe ROWNOCZESNYCH wojen (status === 'wojna'), rozklad (0/1/2/3+),
 * maksimum, osobno maksimum wojen 'epoki' i 'naturalna' (brak typWojny = 'naturalna'), oraz tury,
 * w ktorych ktorakolwiek cywilizacja ma >1 wojne lacznie / >1 epoki / >1 naturalna.
 * Barbarzyncy nie sa liczeni, jesli runner ich nie wpisuje do pairs; filtr --owners-only nie jest potrzebny.
 *
 * Brak danych = pole NIE_ZMIERZONO (nigdy zero zastepcze).
 *
 * Uzycie: node tools/diplomacy-war-concurrency-analyze.cjs --dir <abs-katalog> [--harder 0|1] [--json <abs-plik>]
 *         node tools/diplomacy-war-concurrency-analyze.cjs --file <abs-plik.jsonl>
 */
const fs = require('fs');
const path = require('path');

function parseLines(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch (_) { /* pominiete: uszkodzona linia */ }
  }
  return rows;
}

/**
 * Analiza wierszy. `rows` = tablica obiektow jak wyzej. Zwraca raport (czysty obiekt, bez I/O).
 */
function analyzeRows(rows) {
  const perTurn = new Map(); // klucz: `${seed}|${turn}` -> { seed, turn, civs: Map<civ, {total, epoki, naturalna}> }
  let linie = 0;
  for (const r of rows) {
    if (!r || !r.diplo || !Array.isArray(r.diplo.pairs) || typeof r.turn !== 'number') continue;
    linie++;
    const key = `${r.seed}|${r.turn}`;
    if (!perTurn.has(key)) perTurn.set(key, { seed: r.seed, turn: r.turn, civs: new Map() });
    const slot = perTurn.get(key);
    const bump = (civ, typ) => {
      if (!slot.civs.has(civ)) slot.civs.set(civ, { total: 0, epoki: 0, naturalna: 0 });
      const c = slot.civs.get(civ);
      c.total++;
      if (typ === 'epoki') c.epoki++; else c.naturalna++;
    };
    for (const p of r.diplo.pairs) {
      if (!p || p.status !== 'wojna') continue;
      const typ = p.typWojny === 'epoki' ? 'epoki' : 'naturalna';
      bump(p.a, typ);
      bump(p.b, typ);
    }
  }

  const rozklad = { '0': 0, '1': 0, '2': 0, '3+': 0 };
  let maxTotal = 0;
  let maxEpoki = 0;
  let maxNaturalna = 0;
  let civObservations = 0;
  const turyZWieloma = [];
  const turyZWieloma_epoki = [];
  const turyZWieloma_naturalna = [];

  const sortedKeys = [...perTurn.keys()].sort((x, y) => {
    const a = perTurn.get(x);
    const b = perTurn.get(y);
    return a.seed === b.seed ? a.turn - b.turn : String(a.seed).localeCompare(String(b.seed));
  });
  for (const k of sortedKeys) {
    const slot = perTurn.get(k);
    let turnMaxTotal = 0;
    let turnMaxEpoki = 0;
    let turnMaxNat = 0;
    for (const c of slot.civs.values()) {
      civObservations++;
      if (c.total === 0) rozklad['0']++;
      else if (c.total === 1) rozklad['1']++;
      else if (c.total === 2) rozklad['2']++;
      else rozklad['3+']++;
      turnMaxTotal = Math.max(turnMaxTotal, c.total);
      turnMaxEpoki = Math.max(turnMaxEpoki, c.epoki);
      turnMaxNat = Math.max(turnMaxNat, c.naturalna);
    }
    maxTotal = Math.max(maxTotal, turnMaxTotal);
    maxEpoki = Math.max(maxEpoki, turnMaxEpoki);
    maxNaturalna = Math.max(maxNaturalna, turnMaxNat);
    const ref = { seed: slot.seed, turn: slot.turn };
    if (turnMaxTotal > 1) turyZWieloma.push(ref);
    if (turnMaxEpoki > 1) turyZWieloma_epoki.push(ref);
    if (turnMaxNat > 1) turyZWieloma_naturalna.push(ref);
  }

  // Obserwacje liczone tylko z wierszy, w ktorych sa pary (brak pairs = brak danych, nie zero).
  const turTotal = sortedKeys.length;
  return {
    wiersze: linie,
    tury: turTotal,
    obserwacjeCywilizacjiTura: civObservations,
    rozkladWojenNaCywilizacjeTure: civObservations > 0 ? rozklad : 'NIE_ZMIERZONO',
    maksimumWojenNaCywilizacje: turTotal > 0 ? maxTotal : 'NIE_ZMIERZONO',
    maksimumWojenEpokiNaCywilizacje: turTotal > 0 ? maxEpoki : 'NIE_ZMIERZONO',
    maksimumWojenNaturalnychNaCywilizacje: turTotal > 0 ? maxNaturalna : 'NIE_ZMIERZONO',
    turyZWiecejNiZJednaWojna: turyZWieloma,
    turyZWiecejNiZJednaWojnaEpoki: turyZWieloma_epoki,
    turyZWiecejNiZJednaWojnaNaturalna: turyZWieloma_naturalna,
  };
}

function readJsonlFiles(files) {
  let rows = [];
  for (const f of files) rows = rows.concat(parseLines(fs.readFileSync(f, 'utf8')));
  return rows;
}

function filterHarder(rows, harder) {
  if (harder === null || harder === undefined) return rows;
  return rows.filter(r => String(r.harder) === String(harder));
}

module.exports = { analyzeRows, parseLines, filterHarder };

if (require.main === module) {
  const arg = (name, def) => {
    const i = process.argv.indexOf('--' + name);
    return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
  };
  const dir = arg('dir', null);
  const file = arg('file', null);
  const harder = arg('harder', null);
  const jsonOut = arg('json', null);
  let files = [];
  if (file) files = [file];
  else if (dir) files = fs.readdirSync(dir).filter(n => /\.jsonl$/.test(n)).map(n => path.join(dir, n));
  if (files.length === 0) {
    console.log('NIE_ZMIERZONO: brak plikow jsonl (--dir albo --file)');
    process.exit(2);
  }
  const rows = filterHarder(readJsonlFiles(files), harder);
  const report = analyzeRows(rows);
  console.log(JSON.stringify(report, null, 2));
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2));
}
