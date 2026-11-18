'use strict';
/**
 * diplomacy-harder-measure-analyze.cjs -- R-WEB-DIPLO-HARDER-MEASURE-RUNNER-Q1: analizator pomiaru OFF vs ON.
 *
 * Wejscie: dwa katalogi wynikow runnera (`diplomacy-harder-measure-run.cjs`), kazdy z plikami
 * `seed<S>-harder<0|1>.jsonl`. Katalog OFF = wiersze z harder=0, ON = harder=1 (wybierane po polu w wierszu).
 *
 * Wyjscie (tekst po polsku, na stdout; opcjonalnie --json <plik>):
 *   - Zaufanie par sasiadow (wspolna granica, bez NAP/sojuszu i z NAP/sojuszem osobno nie dzielone) — srednia i mediana
 *     po turach 25/50/75/100 (dla kazdego ziarna osobno i zbiorczo);
 *   - liczba wojen i NAP/sojuszy lacznie oraz per typ pary (AI↔AI, AI↔gracz) po turach 25/50/75/100;
 *   - tura pierwszej wojny AI↔AI i AI↔gracz (najmniejsza tura z status='wojna', per ziarno);
 *   - odsetek par ze Zaufaniem >= 50 sposrod par z kontaktem (wiersze, w ktorych para jest wymieniona);
 *   - laczna kara graniczna sasiadow (srednia): w OFF = kara bazowa; w ON = kara bazowa + napiecie z tury sasiedztwa
 *     (formula jak napieciePenaltyZaTure/karaGranicaZNapieciem w gra/src/game/diplomacy-harder.ts, parametry z
 *     gra/data/diplomacy-harder-params.json). Tura sasiedztwa liczona z ciagu wierszy (przebieg kolejnych tur, bez
 *     czytania licznika gry — hak jest tylko do odczytu).
 *
 * Brak danych = pole `NIE_ZMIERZONO` (nigdy NaN, nigdy zero zastepcze).
 *
 * Uzycie: node tools/diplomacy-harder-measure-analyze.cjs --off <abs-katalog-OFF> --on <abs-katalog-ON> [--json <abs-plik>]
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const PARAMS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'diplomacy-harder-params.json'), 'utf8'));
const TURY = [25, 50, 75, 100];
const NZ = 'NIE_ZMIERZONO';

function readDir(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const m = /^seed(\d+)-harder([01])\.jsonl$/.exec(f);
    if (!m) continue;
    const rows = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
    rows.sort((a, b) => a.turn - b.turn);
    out.push({ file: f, seed: Number(m[1]), harder: Number(m[2]), rows });
  }
  return out;
}

function mean(xs) { return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null; }
function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
}
const f2 = x => (x === null || x === undefined ? NZ : (Math.round(x * 100) / 100).toFixed(2));

/** Typ pary wg pola `gracz` z wiersza (hak zwraca ME()); bez tego pola typ = 'nieznany' (nie zgadujemy owner 0). */
function pairType(p, gracz) {
  if (typeof gracz !== 'number') return 'nieznany';
  return (p.a === gracz || p.b === gracz) ? 'ai-gracz' : 'ai-ai';
}

/** Napiecie graniczne (A1) jak gra: kara bazowa <0 + floor(tura/okres)*przyrost, ucieta do granicaMax. */
function napiecie(karaBazowa, tenure) {
  if (!(karaBazowa < 0)) return karaBazowa;
  if (!(tenure > 0) || PARAMS.granicaOkresTur <= 0) return karaBazowa;
  const suma = karaBazowa - Math.min(Math.floor(tenure / PARAMS.granicaOkresTur) * PARAMS.granicaPrzyrost, Math.abs(PARAMS.granicaMax));
  return Math.max(suma, -Math.abs(PARAMS.granicaMax));
}

/** Dla kazdego wiersza: pary (klucz a_b) -> tura sasiedztwa (liczona z ciagu kolejnych wierszy). */
function tenureSeries(rows) {
  const since = new Map();
  const tenureAt = new Map(); // turn -> Map(key -> tenure)
  for (const r of rows) {
    const per = new Map();
    const seen = new Set();
    for (const p of (r.diplo && r.diplo.pairs) || []) {
      const key = p.a + '_' + p.b;
      seen.add(key);
      if (p.sasiedztwoBezPokoju) {
        if (!since.has(key) || since.get(key) > r.turn) since.set(key, r.turn);
        per.set(key, r.turn - since.get(key));
      } else {
        since.delete(key);
        per.set(key, 0);
      }
    }
    for (const key of [...since.keys()]) if (!seen.has(key)) since.delete(key);
    tenureAt.set(r.turn, per);
  }
  return tenureAt;
}

function summarizeRun(run, tura) {
  const r = run.rows.find(x => x.turn === tura);
  if (!r || !r.diplo) return null;
  const pairs = r.diplo.pairs || [];
  const gracz = r.diplo.gracz;
  const tenure = tenureSeries(run.rows).get(tura) || new Map();
  const sasiedzi = pairs.filter(p => p.sasiad);
  const zaufNeigh = sasiedzi.map(p => p.zaufanie).filter(z => typeof z === 'number');
  const zaufWszystkie = pairs.filter(p => typeof p.zaufanie === 'number');
  const kontakt = pairs.filter(p => p.status !== 'neutralni' || p.pokoj);
  const ge50 = kontakt.filter(p => typeof p.zaufanie === 'number' && p.zaufanie >= 50).length;
  const kary = sasiedzi.map(p => {
    const t = tenure.get(p.a + '_' + p.b) ?? 0;
    return run.harder === 1 ? napiecie(p.karaBazowa ?? 0, t) : (p.karaBazowa ?? 0);
  });
  const wojny = pairs.filter(p => p.status === 'wojna');
  const nap = pairs.filter(p => p.pokoj === 'nap' || p.pokoj === 'sojusz' || p.status === 'sojusz');
  return {
    zaufanieSasiadMean: mean(zaufNeigh), zaufanieSasiadMedian: median(zaufNeigh), zaufanieSasiadN: zaufNeigh.length,
    zaufanieWszystkieMean: mean(zaufWszystkie.map(p => p.zaufanie)),
    wojnyLacznie: wojny.length,
    wojnyAiAi: wojny.filter(p => pairType(p, gracz) === 'ai-ai').length,
    wojnyAiGracz: wojny.filter(p => pairType(p, gracz) === 'ai-gracz').length,
    napLacznie: nap.length,
    napAiAi: nap.filter(p => pairType(p, gracz) === 'ai-ai').length,
    odsetekZaufanie50: kontakt.length ? ge50 / kontakt.length : null,
    kontaktN: kontakt.length,
    karaGranicaMean: mean(kary),
    sasiadN: sasiedzi.length,
    tenureMean: mean(sasiedzi.map(p => tenure.get(p.a + '_' + p.b) ?? 0)),
  };
}

/** Najmniejsza tura, w ktorej para danego typu jest w 'wojna' (per ziarno); null gdy nigdy. */
function firstWar(run, type) {
  for (const r of run.rows) {
    const gracz = r.diplo && r.diplo.gracz;
    const hit = ((r.diplo && r.diplo.pairs) || []).some(p => p.status === 'wojna' && pairType(p, gracz) === type);
    if (hit) return r.turn;
  }
  return null;
}

function group(runs) {
  const out = { perTura: {}, pierwszaWojna: {} };
  for (const t of TURY) {
    const per = runs.map(run => summarizeRun(run, t)).filter(Boolean);
    if (!per.length) { out.perTura[t] = null; continue; }
    const pool = (k) => per.map(s => s[k]).filter(v => typeof v === 'number');
    out.perTura[t] = {
      seedy: per.length,
      zaufanieSasiadMean: mean(pool('zaufanieSasiadMean')),
      zaufanieSasiadMedian: mean(pool('zaufanieSasiadMedian')),
      zaufanieWszystkieMean: mean(pool('zaufanieWszystkieMean')),
      wojnyLacznie: mean(pool('wojnyLacznie')),
      wojnyAiAi: mean(pool('wojnyAiAi')),
      wojnyAiGracz: mean(pool('wojnyAiGracz')),
      napLacznie: mean(pool('napLacznie')),
      napAiAi: mean(pool('napAiAi')),
      odsetekZaufanie50: mean(pool('odsetekZaufanie50')),
      karaGranicaMean: mean(pool('karaGranicaMean')),
      tenureMean: mean(pool('tenureMean')),
    };
  }
  for (const type of ['ai-ai', 'ai-gracz']) {
    out.pierwszaWojna[type] = runs.map(run => ({ seed: run.seed, tura: firstWar(run, type) }));
  }
  return out;
}

function tabela(nazwa, g) {
  const L = [];
  L.push(`== ${nazwa} ==`);
  L.push('tura | Zaufanie sąsiadów śr. | mediana | Zaufanie wszystkich par śr. | wojny razem | wojny AI↔AI | wojny AI↔gracz | NAP/sojusz razem | NAP/sojusz AI↔AI | odsetek par Zaufanie≥50 | kara graniczna śr. | seedy');
  for (const t of TURY) {
    const s = g.perTura[t];
    if (!s) { L.push(`${t} | ${NZ}`); continue; }
    L.push([t, f2(s.zaufanieSasiadMean), f2(s.zaufanieSasiadMedian), f2(s.zaufanieWszystkieMean), f2(s.wojnyLacznie),
      f2(s.wojnyAiAi), f2(s.wojnyAiGracz), f2(s.napLacznie), f2(s.napAiAi),
      s.odsetekZaufanie50 === null ? NZ : (s.odsetekZaufanie50 * 100).toFixed(1) + '%', f2(s.karaGranicaMean), s.seedy].join(' | '));
  }
  L.push('pierwsza wojna AI↔AI (ziarno: tura): ' + g.pierwszaWojna['ai-ai'].map(x => `${x.seed}: ${x.tura ?? 'brak'}`).join(', '));
  L.push('pierwsza wojna AI↔gracz (ziarno: tura): ' + g.pierwszaWojna['ai-gracz'].map(x => `${x.seed}: ${x.tura ?? 'brak'}`).join(', '));
  return L.join('\n');
}

function main() {
  const offDir = arg('off', '');
  const onDir = arg('on', '');
  if (!offDir || !onDir) { console.error('uzycie: --off <katalog> --on <katalog> [--json <plik>]'); process.exit(2); }
  const off = readDir(path.resolve(offDir)).filter(r => r.harder === 0);
  const on = readDir(path.resolve(onDir)).filter(r => r.harder === 1);
  if (!off.length || !on.length) { console.error('brak plikow jsonl (OFF=' + off.length + ', ON=' + on.length + ')'); process.exit(1); }
  const gOff = group(off);
  const gOn = group(on);
  console.log('Pomiar twardszej dyplomacji: OFF (' + off.length + ' ziaren) vs ON (' + on.length + ' ziaren). Tury ' + TURY.join('/') + '.');
  console.log(tabela('OFF (flaga wyłączona)', gOff));
  console.log('');
  console.log(tabela('ON (flaga włączona)', gOn));
  const json = arg('json', '');
  if (json) fs.writeFileSync(path.resolve(json), JSON.stringify({ off: gOff, on: gOn, params: PARAMS }, null, 2));
}

/** Samotest (bez przegladarki): `node tools/diplomacy-harder-measure-analyze.cjs --selftest`. Zielone = zgodne. */
function selfTest() {
  const wyniki = [];
  const ok = (nazwa, warunek) => { wyniki.push(!!warunek); console.log((warunek ? 'ZIELONE ' : 'CZERWONE ') + nazwa); };
  ok('napiecie: kara dodatnia bez zmian', napiecie(2, 50) === 2);
  ok('napiecie: tura 0 bez zmian', napiecie(-3, 0) === -3);
  ok('napiecie: 10 tur = -1 wiecej (przyrost 1, okres 10)', napiecie(-3, 10) === -4);
  ok('napiecie: ucięcie do granicaMax (6): -3 po 1000 turach = -6', napiecie(-3, 1000) === -6);
  ok('pairType: gracz = a -> ai-gracz', pairType({ a: 0, b: 2 }, 0) === 'ai-gracz');
  ok('pairType: brak gracz -> nieznany (nie zgadujemy)', pairType({ a: 0, b: 2 }, undefined) === 'nieznany');
  ok('pairType: dwie AI -> ai-ai', pairType({ a: 1, b: 2 }, 0) === 'ai-ai');
  const seria = [
    { turn: 1, diplo: { pairs: [{ a: 1, b: 2, sasiedztwoBezPokoju: true }] } },
    { turn: 2, diplo: { pairs: [{ a: 1, b: 2, sasiedztwoBezPokoju: true }] } },
    { turn: 3, diplo: { pairs: [{ a: 1, b: 2, sasiedztwoBezPokoju: false }] } },
    { turn: 4, diplo: { pairs: [{ a: 1, b: 2, sasiedztwoBezPokoju: true }] } },
  ];
  const t = tenureSeries(seria);
  ok('tenure: licznik narasta 0,1 potem reset po przerwie', t.get(1).get('1_2') === 0 && t.get(2).get('1_2') === 1 && t.get(3).get('1_2') === 0 && t.get(4).get('1_2') === 0);
  const bad = wyniki.filter(x => !x).length;
  console.log('WYNIK SAMOTESTU: ' + (wyniki.length - bad) + ' zielonych, ' + bad + ' czerwonych');
  process.exit(bad ? 1 : 0);
}

module.exports = { napiecie, tenureSeries, pairType, median, mean };

if (require.main === module) {
  if (process.argv.includes('--selftest')) selfTest(); else main();
}
