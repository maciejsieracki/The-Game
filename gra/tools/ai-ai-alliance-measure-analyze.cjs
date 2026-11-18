'use strict';
/**
 * ai-ai-alliance-measure-analyze.cjs -- R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1: analizator pomiaru sojuszy AI↔AI.
 * Czyta <katalog>/seed*.jsonl (wiersze z `diag.sojusze` i `wars`, zapisane przez ai-ai-alliance-measure-run.cjs /
 * ai-economy-measure-run.cjs) i drukuje tabelę po polsku: OFF vs ON (albo jeden katalog z --in).
 *
 * Metryki (wszystkie z surowego jsonl, bez wzorów własnych poza prostym zliczaniem):
 *   - tura pierwszego sojuszu AI↔AI (pierwszy wiersz z sojuszeAiAi > 0);
 *   - liczba sojuszy AI↔AI w turach 25/50/75/100/150 (wiersz o największej turze <= punktu kontrolnego);
 *   - odsetek głównych AI z >= 1 sojuszem w tych turach (cel właściciela: 100%);
 *   - maksimum sojuszy na cywilizację po wszystkich wierszach (MUSI być <= 2);
 *   - liczba wojen AI↔AI w punktach kontrolnych oraz tura pierwszej wojny AI↔AI (z wars.aiAi);
 *   - próby i odmowy toru (skumulowane, ostatni wiersz).
 * Brak pola -> "NIE ZMIERZONO" (nie zero). Pierwsze/ostatnie wiersze nie są odrzucane (warm-up tylko w runnerze).
 *
 * Uzycie:
 *   node tools/ai-ai-alliance-measure-analyze.cjs --off <abs-katalog> --on <abs-katalog>
 *   node tools/ai-ai-alliance-measure-analyze.cjs --in <abs-katalog>
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const CHECK = [25, 50, 75, 100, 150];
const NZ = 'NIE ZMIERZONO';

/** Wczytuje wiersze jsonl z katalogu; zwraca { seed: [wiersz...] } posortowane po turze. */
function loadDir(dir) {
  const bySeed = {};
  // Akceptuje dowolną nazwę `*.jsonl` (np. seed4242-t30.jsonl, smoke-...-seed4242.jsonl); numer ziarna z nazwy, gdy występuje.
  const files = fs.readdirSync(dir).filter(n => /\.jsonl$/.test(n)).sort();
  for (const f of files) {
    const seed = (f.match(/seed(\d+)/) || f.match(/(\d+)/) || [null, f])[1];
    const rows = [];
    for (const ln of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
      if (!ln.trim()) continue;
      let rec;
      try { rec = JSON.parse(ln); } catch (_) { continue; }
      if (typeof rec.turn === 'number') rows.push(rec);
    }
    rows.sort((a, b) => a.turn - b.turn);
    bySeed[seed] = rows.map(r => {
      const s = r.diag && r.diag.sojusze;
      const w = r.wars && typeof r.wars.aiAi === 'number' ? r.wars.aiAi : null;
      return {
        turn: r.turn,
        flaga: s ? s.flaga : null,
        wymuszona: s ? s.wymuszona : null,
        sojuszeAiAi: s ? s.sojuszeAiAi : null,
        naCyw: s && Array.isArray(s.naCywilizacje) ? s.naCywilizacje : null,
        proby: s ? s.proby : null,
        odmowy: s ? s.odmowy : null,
        powodyOdmow: s && Array.isArray(s.powodyOdmow) ? s.powodyOdmow : null,
        wojny: w,
      };
    });
  }
  return bySeed;
}

/** Wiersz o DOKŁADNIE turze cp (null gdy bieg nie dotarł do cp lub brak wiersza).
 *  Nie podstawiamy wiersza z wcześniejszej tury: kolumna "tura cp" musi pokazywać wartość z tury cp. */
function atCheckpoint(rows, cp) {
  return rows.find(r => r.turn === cp) || null;
}

/** Ostatnia tura biegu (null gdy brak wierszy). */
function lastTurn(rows) {
  return rows.length ? rows[rows.length - 1].turn : null;
}

function fmt(v) { return v === null || v === undefined ? NZ : String(v); }

function summarize(bySeed) {
  const out = {};
  for (const [seed, rows] of Object.entries(bySeed)) {
    const firstAlly = rows.find(r => r.sojuszeAiAi !== null && r.sojuszeAiAi > 0);
    const firstWar = rows.find(r => r.wojny !== null && r.wojny > 0);
    let maxPerCiv = null;
    for (const r of rows) {
      if (!r.naCyw) continue;
      for (const c of r.naCyw) maxPerCiv = maxPerCiv === null ? c.n : Math.max(maxPerCiv, c.n);
    }
    const last = rows[rows.length - 1] || null;
    const cps = {};
    for (const cp of CHECK) {
      const r = atCheckpoint(rows, cp);
      let pct = null;
      if (r && r.naCyw && r.naCyw.length > 0) {
        pct = Math.round((100 * r.naCyw.filter(c => c.n >= 1).length) / r.naCyw.length);
      }
      // Brak wiersza o turze cp: bieg krótszy niż cp (poza biegiem) albo luka w jsonl (NIE ZMIERZONO).
      cps[cp] = r
        ? { turn: r.turn, sojusze: r.sojuszeAiAi, pct, wojny: r.wojny }
        : { poza: (lastTurn(rows) !== null && lastTurn(rows) < cp) ? `poza biegiem (koniec t${lastTurn(rows)})` : NZ };
    }
    out[seed] = {
      ostatniaTura: last ? last.turn : null,
      flaga: last ? last.flaga : null,
      wymuszona: last ? last.wymuszona : null,
      turaPierwszegoSojuszu: firstAlly ? firstAlly.turn : (rows.some(r => r.sojuszeAiAi !== null) ? 'brak' : null),
      turaPierwszejWojny: firstWar ? firstWar.turn : (rows.some(r => r.wojny !== null) ? 'brak' : null),
      maxNaCywilizacje: maxPerCiv,
      proby: last ? last.proby : null,
      odmowy: last ? last.odmowy : null,
      // Histogram powodów odmów toru (skumulowany; ostatni wiersz z polem).
      powody: (() => { const L = [...rows].reverse().find(r => r.powodyOdmow !== null); return L ? L.powodyOdmow : null; })(),
      cps,
    };
  }
  return out;
}

function printTable(label, sum) {
  console.log(`\n=== ${label} ===`);
  const seeds = Object.keys(sum);
  if (seeds.length === 0) { console.log('brak wierszy jsonl'); return; }
  console.log('ziarno | ostatnia tura | flaga | wymuszona | tura 1. sojuszu AI↔AI | tura 1. wojny AI↔AI | max sojuszy/cyw. | próby | odmowy');
  for (const s of seeds) {
    const x = sum[s];
    console.log([s, fmt(x.ostatniaTura), fmt(x.flaga), fmt(x.wymuszona), fmt(x.turaPierwszegoSojuszu),
      fmt(x.turaPierwszejWojny), fmt(x.maxNaCywilizacje), fmt(x.proby), fmt(x.odmowy)].join(' | '));
  }
  console.log('\nPowody odmów toru (skumulowane, n = liczba odmów E1 wg powodu; liczby w powodzie zastąpione przez N):');
  for (const s of seeds) {
    const p = sum[s].powody;
    if (!p) { console.log(`ziarno ${s}: ${NZ}`); continue; }
    if (p.length === 0) { console.log(`ziarno ${s}: brak odmów`); continue; }
    for (const e of p) console.log(`ziarno ${s} | n=${e.n} | ${e.powod}`);
  }
  console.log('\nPunkty kontrolne (wartość z wiersza o DOKŁADNIEJ turze kontrolnej): sojusze AI↔AI / odsetek głównych AI z >=1 sojuszem (%) / wojny AI↔AI');
  console.log('ziarno | ' + CHECK.map(cp => `tura ${cp}`).join(' | '));
  for (const s of seeds) {
    const cells = CHECK.map(cp => {
      const c = sum[s].cps[cp];
      if (!c) return NZ;
      if (c.poza) return c.poza;
      return `${fmt(c.sojusze)} / ${fmt(c.pct)}% / ${fmt(c.wojny)}`;
    });
    console.log(s + ' | ' + cells.join(' | '));
  }
}

function main() {
  const off = arg('off', null);
  const on = arg('on', null);
  const single = arg('in', null);
  if (single) {
    printTable(path.resolve(single), summarize(loadDir(path.resolve(single))));
    return;
  }
  if (!off || !on) {
    console.error('Uzycie: --off <katalog> --on <katalog>  albo  --in <katalog>');
    process.exit(2);
  }
  const sOff = summarize(loadDir(path.resolve(off)));
  const sOn = summarize(loadDir(path.resolve(on)));
  printTable('OFF (' + path.resolve(off) + ')', sOff);
  printTable('ON (' + path.resolve(on) + ')', sOn);
  // Werdykt pomocniczy: limit 2 na cywilizację (twardy) i cel 100% AI z sojuszem (informacyjny, decyzja po stronie właściciela).
  const maxAll = Object.values(sOn).reduce((m, x) => (x.maxNaCywilizacje === null ? m : Math.max(m, x.maxNaCywilizacje)), 0);
  console.log(`\nLimit 2 na cywilizację (ON, wszystkie wiersze): max = ${maxAll} -> ${maxAll <= 2 ? 'OK' : 'NARUSZONY'}`);
}

main();
