#!/usr/bin/env node
// R-WEB-ECONOMY-LATE-GAME-RESOURCE-GROWTH-AUDIT-Q1 — analiza jsonl harnessu ekonomii AI (tylko odczyt).
// Uzycie: node gra/tools/econ-growth-analyze.cjs <plik.jsonl> [więcej plików...]
// Wypisuje per tura kontrolna (10,25,50,75,100,125,150; najbliższa <= tury dostępnej) statystyki
// właścicieli AI z miastem: skarbiec, spichlerz, utrzymanie (Pieniądz/Surowce), miasta.
// Tura kontrolna powyżej ostatniej zmierzonej tury pliku = NIEZMIERZONO (nie powtarzamy danych).
// Pola, których jsonl NIE zawiera (przychód/turę, Praca, Nauka PN, zapasy surowców poza skarbcem
// i spichlerzem), są oznaczone NIEZMIERZONO. Nie modyfikuje plików wejściowych.
'use strict';
const fs = require('fs');

const CONTROL = [10, 25, 50, 75, 100, 125, 150];

function stats(xs) {
  if (xs.length === 0) return null;
  const s = xs.slice().sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  const med = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  return { n: s.length, mean: sum / s.length, median: med, max: s[s.length - 1] };
}
const fmt = (v) => (v == null ? 'NIEZMIERZONO' : String(Math.round(v * 10) / 10));
const sumObj = (o) => Object.values(o || {}).reduce((a, b) => a + (Number(b) || 0), 0);

function loadRows(file) {
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

function analyzeFile(file) {
  const rows = loadRows(file);
  const byTurn = new Map(rows.map((r) => [r.turn, r]));
  const turns = rows.map((r) => r.turn).sort((a, b) => a - b);
  const out = { file, firstTurn: turns[0], lastTurn: turns[turns.length - 1], points: [] };
  for (const t of CONTROL) {
    // najbliższa tura <= t: nie dopisujemy danych ponad to, co zmierzono
    const avail = turns.filter((x) => x <= t);
    if (avail.length === 0) continue;
    if (t > turns[turns.length - 1]) {
      // tura kontrolna poza zakresem pliku: NIE kopiujemy ostatniej zmierzonej tury
      out.points.push({ turnRequested: t, turnMeasured: null, unmeasured: true });
      continue;
    }
    const tt = avail[avail.length - 1];
    const r = byTurn.get(tt);
    const ai = (r.owners || []).filter((o) => o.owner !== 0 && o.miasta > 0);
    const pick = (f) => stats(ai.map(f));
    out.points.push({
      turnRequested: t,
      turnMeasured: tt,
      n: ai.length,
      skarbiec: pick((o) => o.skarbiec),
      spichlerz: pick((o) => o.spichlerz),
      utrzymBudynkiPieniadz: pick((o) => o.utrzymanieBudynkowPieniadz),
      utrzymBudynkiSurowce: pick((o) => sumObj(o.utrzymanieBudynkowSurowce)),
      utrzymJednostkiPieniadz: pick((o) => o.utrzymanieJednostekPieniadz),
      utrzymJednostkiSurowce: pick((o) => sumObj(o.utrzymanieJednostekSurowce)),
      miasta: pick((o) => o.miasta),
    });
  }
  return out;
}

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (files.length === 0) {
  console.error('uzycie: node gra/tools/econ-growth-analyze.cjs <plik.jsonl> [...]');
  process.exit(2);
}
const results = files.map(analyzeFile);
const gm = (s) => (s ? `${fmt(s.mean)}/${fmt(s.max)}` : '-');
const gmed = (s) => (s ? `${fmt(s.mean)}/${fmt(s.median)}/${fmt(s.max)}` : '-');
for (const res of results) {
  console.log(`\n== ${res.file}  tury ${res.firstTurn}..${res.lastTurn}`);
  console.log(
    'tura(zad/zmierz) | n | skarbiec mean/med/max | spichlerz mean/max | utrzym. budynki Pieniądz mean/max | utrzym. jednostki Pieniądz mean/max | utrzym. surowce budynki / jednostki mean/max | miasta mean/max'
  );
  for (const p of res.points) {
    if (p.unmeasured) {
      console.log(`${p.turnRequested}(NIEZMIERZONO: plik kończy się na t${res.lastTurn}) | - | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO | NIEZMIERZONO`);
      continue;
    }
    console.log(
      `${p.turnRequested}(${p.turnMeasured}) | ${p.n} | ${gmed(p.skarbiec)} | ${gm(p.spichlerz)} | ${gm(p.utrzymBudynkiPieniadz)} | ${gm(p.utrzymJednostkiPieniadz)} | ${gm(p.utrzymBudynkiSurowce)} / ${gm(p.utrzymJednostkiSurowce)} | ${gm(p.miasta)}`
    );
  }
  console.log('NIEZMIERZONO w jsonl: przychod/ture (Skarb, Praca, Nauka PN), zapasy surowcow (zelazo, braz, cegla, drewno, kamien, ceramika), Praca, Nauka.');
}
if (process.argv.includes('--json')) console.log(JSON.stringify(results));
