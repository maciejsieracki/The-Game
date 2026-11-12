'use strict';
/**
 * copper-income-audit-check.cjs — R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1 (Obrona, zarzut 2 Evaluatora).
 *
 * Bramka POZIOMU PEŁNEJ GRY dla przecieku miedzi: czyta JSONL z copper-income-audit-measure.cjs
 * (headless Chromium, realny endTurn, wszyscy właściciele: główne cywilizacje + państwa-miasta)
 * i kończy się kodem 1, gdy którykolwiek właściciel przekroczy pułap:
 *
 *   P1  skok liczby Kopalń miedzi u jednego właściciela w JEDNEJ turze  <= --max-mine-jump (domyślnie 9)
 *   P2  zapas `ruda` i `braz` właściciela                               <= --max-stock-share × cap magazynu
 *                                                                          (domyślnie 0,20 = 20% capu)
 *
 * Skąd progi (z pomiaru, nie z głowy — 3 ziarna × PRE/POST, 10-operator-claude.md §4 i 30-obrona-claude.md):
 *   P1: PRE max skok w 1 turze = +58 / +37 / +24 (ziarna 4242 / 777 / 1234), POST = +4 / +4 / +5.
 *       9 = kryterium „skok >= 10 kopalń” z raportu Operatora (§4.2), mieści się między POST a PRE.
 *   P2: zgłoszenie właściciela = ~24 000 szt. miedzi w epoce Brązu (cap 100 000) = 24% capu.
 *       Zmierzone tym narzędziem (max zapas/cap po wszystkich właścicielach, ziarna 4242 / 777 / 1234):
 *       PRE 74,7% / 14,4% / 100% (cap), POST (do t77 / t82 / t79) 2,6% / 2,0% / 10,3%.
 *       20% leży poniżej wartości zgłoszonej; P2 sam nie łapie PRE 777 (tam łapie P1: +37).
 *   Obie liczby to ZAŁOŻENIE do ABC właściciela (próg balansu) — dlatego są parametrami CLI, a nie stałą gry.
 *
 * Uzycie (z gra/):
 *   node tools/copper-income-audit-check.cjs <plik.jsonl> [<plik2.jsonl> ...] [--max-mine-jump 9] [--max-stock-share 0.2] [--keys ruda,braz]
 * Kod wyjścia: 0 = wszystkie pliki w pułapie, 1 = przekroczenie (lista naruszeń na stderr), 2 = brak danych.
 */
const fs = require('fs');

function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; }
const MAX_JUMP = Number(arg('max-mine-jump', '9'));
const MAX_SHARE = Number(arg('max-stock-share', '0.2'));
const KEYS = String(arg('keys', 'ruda,braz')).split(',');
const files = [];
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) { i++; continue; }
  files.push(process.argv[i]);
}
if (!files.length) { console.error('Uzycie: node tools/copper-income-audit-check.cjs <plik.jsonl> [...]'); process.exit(2); }

let totalViolations = 0;
let anyRows = false;
for (const file of files) {
  // Bieg może trwać (plik dopisywany) — niepełna ostatnia linia jest pomijana.
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .flatMap((l) => { try { return [JSON.parse(l)]; } catch (_) { return []; } });
  if (!rows.length) { console.error(`${file}: brak danych`); continue; }
  anyRows = true;
  const prevMines = new Map();
  const viol = [];
  let maxJump = { v: 0 }, maxShare = { v: 0 };
  for (const r of rows) {
    for (const o of r.owners) {
      const who = `${o.o}:${o.civ}${o.cs ? '(MP)' : ''}`;
      const km = (o.mines && o.mines.kopalnia_miedzi) || 0;
      if (prevMines.has(o.o)) {
        const d = km - prevMines.get(o.o);
        if (d > maxJump.v) maxJump = { v: d, who, t: r.turn };
        if (d > MAX_JUMP) viol.push(`P1 t${r.turn} ${who}: Kopalnie miedzi ${prevMines.get(o.o)}→${km} (+${d} > ${MAX_JUMP})`);
      }
      prevMines.set(o.o, km);
      const cap = Number(o.cap) || 0;
      if (cap <= 0) continue;
      for (const k of KEYS) {
        const s = Number(o.stock && o.stock[k]) || 0;
        const share = s / cap;
        if (share > maxShare.v) maxShare = { v: share, who, t: r.turn, k, s, cap };
        if (share > MAX_SHARE) viol.push(`P2 t${r.turn} ${who}: ${k}=${s} > ${(MAX_SHARE * 100).toFixed(0)}% capu ${cap}`);
      }
    }
  }
  const name = file.split('/').pop();
  console.log(`${name}: tury ${rows[0].turn}..${rows[rows.length - 1].turn}, właściciele ${rows[rows.length - 1].owners.length}`);
  console.log(`  P1 max skok Kopalń miedzi/turę = +${maxJump.v}${maxJump.who ? ` (${maxJump.who}, t${maxJump.t})` : ''} [pułap ${MAX_JUMP}]`);
  console.log(`  P2 max zapas/cap = ${(maxShare.v * 100).toFixed(1)}%${maxShare.who ? ` (${maxShare.who} ${maxShare.k}=${maxShare.s}/${maxShare.cap}, t${maxShare.t})` : ''} [pułap ${(MAX_SHARE * 100).toFixed(0)}%]`);
  console.log(`  naruszenia: ${viol.length}${viol.length ? ' → ' + (viol.length > 5 ? viol.slice(0, 5).join(' | ') + ' | …' : viol.join(' | ')) : ''}`);
  totalViolations += viol.length;
}
if (!anyRows) process.exit(2);
console.log(`\ncopper-income-audit-check: ${totalViolations === 0 ? 'PASS' : 'FAIL'} (naruszeń: ${totalViolations})`);
process.exit(totalViolations ? 1 : 0);
