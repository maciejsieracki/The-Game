'use strict';
/**
 * diplomacy-all-flags-measure-analyze.cjs -- R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1: analizator ŁĄCZNEGO pomiaru
 * wszystkich flag dyplomacji (OFF vs ON). POMIAR, nie zmiana gry.
 *
 * Wejście: dwa katalogi wyników `diplomacy-all-flags-measure-run.cjs` (runner `--all-flags`), pliki
 * `seed<S>-all<0|1>.jsonl`. Katalog OFF = wiersze allFlags=0, ON = allFlags=1 (po polu w wierszu).
 *
 * Wyjście (tekst po polsku na stdout; opcjonalnie --json <plik>), tury 25/50/75/100/125/150:
 *   - zaufanie sąsiadów (średnia, mediana), odsetek par z zaufaniem ≥ 50 (pary z kontaktem);
 *   - wojny razem / AI↔AI / AI↔gracz (liczone z par wiersza);
 *   - maks. równoległych wojen jednej cywilizacji (średnia po ziarnach i maksimum z ziaren);
 *   - sojusze AI↔AI i NAP AI↔AI (z licznika `liczniki`), pary gracza w sojuszu;
 *   - zerwania przy zerowym zaufaniu (licznik sesji, narastający);
 *   - pierwsza wojna AI↔AI / AI↔gracz per ziarno.
 * Brak danych = `NIE_ZMIERZONO` (nigdy NaN, nigdy zero zastępcze).
 *
 * Użycie: node tools/diplomacy-all-flags-measure-analyze.cjs --off <abs-katalog> --on <abs-katalog> [--json <abs-plik>]
 * Samotest bez przeglądarki: node tools/diplomacy-all-flags-measure-analyze.cjs --selftest
 */
const fs = require('fs');
const path = require('path');

const TURY = [25, 50, 75, 100, 125, 150];
const NZ = 'NIE_ZMIERZONO';

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

function readDir(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const m = /^seed(\d+)-all([01])\.jsonl$/.exec(f);
    if (!m) continue;
    const rows = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
    rows.sort((a, b) => a.turn - b.turn);
    out.push({ file: f, seed: Number(m[1]), allFlags: Number(m[2]), rows });
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
const f2 = x => (x === null || x === undefined || Number.isNaN(x) ? NZ : (Math.round(x * 100) / 100).toFixed(2));

/** Typ pary: 'ai-gracz' gdy jeden z końców = gracz (wiersz.diplo.gracz); bez pola gracz = 'nieznany'. */
function pairType(p, gracz) {
  if (typeof gracz !== 'number') return 'nieznany';
  return (p.a === gracz || p.b === gracz) ? 'ai-gracz' : 'ai-ai';
}

/** Metryki jednego wiersza (tura). Zwraca null, gdy wiersza brak. */
function rowMetrics(r) {
  if (!r || !r.diplo) return null;
  const pairs = r.diplo.pairs || [];
  const gracz = r.diplo.gracz;
  const sasiedzi = pairs.filter(p => p.sasiad).map(p => p.zaufanie).filter(z => typeof z === 'number');
  const kontakt = pairs.filter(p => p.status !== 'neutralni' || p.pokoj);
  const ge50 = kontakt.filter(p => typeof p.zaufanie === 'number' && p.zaufanie >= 50).length;
  const wojny = pairs.filter(p => p.status === 'wojna');
  const L = r.liczniki || null;
  return {
    zaufSasiadMean: mean(sasiedzi),
    zaufSasiadMedian: median(sasiedzi),
    odsetekZaufanie50: kontakt.length ? ge50 / kontakt.length : null,
    wojnyLacznie: wojny.length,
    wojnyAiAi: wojny.filter(p => pairType(p, gracz) === 'ai-ai').length,
    wojnyAiGracz: wojny.filter(p => pairType(p, gracz) === 'ai-gracz').length,
    wojnyRownolegleMax: L ? L.wojnyRownolegleMax : null,
    sojuszeAiAi: L ? L.sojuszeAiAi : null,
    napAiAi: L ? L.napAiAi : null,
    paryGraczSojusz: L ? L.paryGraczSojusz : null,
    zerwania: L ? L.zerwaniaZeroZaufania : null,
  };
}

function rowAt(run, tura) { return run.rows.find(x => x.turn === tura) || null; }

function firstWar(run, type) {
  for (const r of run.rows) {
    const gracz = r.diplo && r.diplo.gracz;
    if (((r.diplo && r.diplo.pairs) || []).some(p => p.status === 'wojna' && pairType(p, gracz) === type)) return r.turn;
  }
  return null;
}

function group(runs) {
  const out = { perTura: {}, pierwszaWojna: {} };
  for (const t of TURY) {
    const per = runs.map(run => rowMetrics(rowAt(run, t))).filter(Boolean);
    if (!per.length) { out.perTura[t] = null; continue; }
    const pool = k => per.map(s => s[k]).filter(v => typeof v === 'number');
    const maxPool = k => pool(k).length ? Math.max(...pool(k)) : null;
    out.perTura[t] = {
      seedy: per.length,
      zaufSasiadMean: mean(pool('zaufSasiadMean')),
      zaufSasiadMedian: mean(pool('zaufSasiadMedian')),
      odsetekZaufanie50: mean(pool('odsetekZaufanie50')),
      wojnyLacznie: mean(pool('wojnyLacznie')),
      wojnyAiAi: mean(pool('wojnyAiAi')),
      wojnyAiGracz: mean(pool('wojnyAiGracz')),
      wojnyRownolegleSrednia: mean(pool('wojnyRownolegleMax')),
      wojnyRownolegleMaks: maxPool('wojnyRownolegleMax'),
      sojuszeAiAi: mean(pool('sojuszeAiAi')),
      napAiAi: mean(pool('napAiAi')),
      paryGraczSojusz: mean(pool('paryGraczSojusz')),
      zerwania: mean(pool('zerwania')),
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
  L.push('tura | zaufanie sąsiadów śr. | mediana | odsetek par Zaufanie≥50 | wojny razem | AI↔AI | AI↔gracz | wojny równoległe śr. | maks. | sojusze AI↔AI | NAP AI↔AI | pary z graczem w sojuszu | zerwania (sesja, śr.) | seedy');
  for (const t of TURY) {
    const s = g.perTura[t];
    if (!s) { L.push(`${t} | ${NZ}`); continue; }
    L.push([t, f2(s.zaufSasiadMean), f2(s.zaufSasiadMedian),
      s.odsetekZaufanie50 === null ? NZ : (s.odsetekZaufanie50 * 100).toFixed(1) + '%',
      f2(s.wojnyLacznie), f2(s.wojnyAiAi), f2(s.wojnyAiGracz), f2(s.wojnyRownolegleSrednia), f2(s.wojnyRownolegleMaks),
      f2(s.sojuszeAiAi), f2(s.napAiAi), f2(s.paryGraczSojusz), f2(s.zerwania), s.seedy].join(' | '));
  }
  L.push('pierwsza wojna AI↔AI (ziarno: tura): ' + g.pierwszaWojna['ai-ai'].map(x => `${x.seed}: ${x.tura ?? 'brak'}`).join(', '));
  L.push('pierwsza wojna AI↔gracz (ziarno: tura): ' + g.pierwszaWojna['ai-gracz'].map(x => `${x.seed}: ${x.tura ?? 'brak'}`).join(', '));
  return L.join('\n');
}

function main() {
  const offDir = arg('off', '');
  const onDir = arg('on', '');
  if (!offDir || !onDir) { console.error('uzycie: --off <katalog> --on <katalog> [--json <plik>]'); process.exit(2); }
  const off = readDir(path.resolve(offDir)).filter(r => r.allFlags === 0);
  const on = readDir(path.resolve(onDir)).filter(r => r.allFlags === 1);
  if (!off.length || !on.length) { console.error('brak plikow jsonl (OFF=' + off.length + ', ON=' + on.length + ')'); process.exit(1); }
  const gOff = group(off);
  const gOn = group(on);
  console.log('Pomiar łączny flag dyplomacji: OFF (' + off.length + ' ziaren) vs ON (' + on.length + ' ziaren). Tury ' + TURY.join('/') + '.');
  console.log(tabela('OFF (wszystkie flagi wyłączone)', gOff));
  console.log('');
  console.log(tabela('ON (wszystkie flagi włączone)', gOn));
  const json = arg('json', '');
  if (json) fs.writeFileSync(path.resolve(json), JSON.stringify({ off: gOff, on: gOn }, null, 2));
}

/** Samotest (bez przeglądarki). */
function selfTest() {
  const wyniki = [];
  const ok = (nazwa, warunek) => { wyniki.push(!!warunek); console.log((warunek ? 'ZIELONE ' : 'CZERWONE ') + nazwa); };
  const row = { turn: 25, diplo: { gracz: 0, pairs: [
    { a: 1, b: 2, sasiad: true, zaufanie: 60, status: 'neutralni', pokoj: 'pokoj', aiAi: true },
    { a: 1, b: 3, sasiad: true, zaufanie: 20, status: 'wojna', aiAi: true },
    { a: 2, b: 3, sasiad: false, zaufanie: 40, status: 'wojna', aiAi: true },
  ] }, liczniki: { sojuszeAiAi: 1, napAiAi: 0, wojnyRownolegleMax: 2, paryGraczSojusz: 0, zerwaniaZeroZaufania: 3 } };
  const m = rowMetrics(row);
  ok('zaufanie sąsiadów średnia = (60+20)/2 = 40', m.zaufSasiadMean === 40);
  ok('wojny razem = 2, AI↔AI = 2, AI↔gracz = 0', m.wojnyLacznie === 2 && m.wojnyAiAi === 2 && m.wojnyAiGracz === 0);
  ok('liczniki przeniesione (sojusze 1, zerwania 3)', m.sojuszeAiAi === 1 && m.zerwania === 3);
  ok('brak liczników -> NIE_ZMIERZONO (null, nie 0)', rowMetrics({ turn: 1, diplo: { pairs: [] } }).sojuszeAiAi === null);
  ok('brak wiersza -> null', rowMetrics(null) === null);
  ok('format: null -> NIE_ZMIERZONO, nie NaN', f2(null) === NZ && f2(NaN) === NZ);
  ok('pairType bez gracza -> nieznany', pairType({ a: 1, b: 2 }, undefined) === 'nieznany');
  const bad = wyniki.filter(x => !x).length;
  console.log('WYNIK SAMOTESTU: ' + (wyniki.length - bad) + ' zielonych, ' + bad + ' czerwonych');
  process.exit(bad ? 1 : 0);
}

module.exports = { rowMetrics, pairType, f2, NZ };

if (require.main === module) {
  if (process.argv.includes('--selftest')) selfTest(); else main();
}
