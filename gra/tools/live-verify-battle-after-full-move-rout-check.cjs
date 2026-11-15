'use strict';
/**
 * R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1 — asercje na dowodach z zywej bitwy (Chromium).
 * Wejscie: JSONL z tools/battle-rout-pursuit-measure.cjs (wiersze {scen,seed,mode,timedOut,errors,r}).
 * Sprawdza tylko tryb 'skip' (AUTO przewijana). Kod wyjscia 1 przy dowolnym niespelnionym kryterium.
 *
 * Usage (z gra/): node tools/live-verify-battle-after-full-move-rout-check.cjs <plik1.jsonl> [plik2.jsonl ...]
 *
 * Kryteria (binarne, na kazdym wierszu skip):
 *  K1 bez timeoutu i bez bledow strony (pageerror);
 *  K2 zadna jednostka uciekajaca nie konczy poza krawedzia (fledNotAtEdge === 0);
 *  K3 zadna jednostka rozbita nie zostaje na polu po zakonczeniu bitwy (routedLeft === 0 po obu stronach);
 *  K4 gdy ktos uciekl, pogon byla: attacksOnRouted > 0 (konnica/atakujacy dobijaja uciekajacych);
 *  K5 bilans jednostek: killed + fled + survived === total po obu stronach (brak zgubionych jednostek).
 * Czego ten skrypt NIE sprawdza (NIE_ZMIERZONO w raporcie): limit 3 odwrotow na ture, liczba ciosow na jednostke
 * na ture, zachowanie "walczy do smierci" per jednostka -- tych danych runner nie eksportuje.
 */
const fs = require('node:fs');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node tools/live-verify-battle-after-full-move-rout-check.cjs <plik.jsonl> [...]');
  process.exit(2);
}

let fails = 0;
let checked = 0;
let pursuitRows = 0;
let k6Max = 0;
let k6Missing = 0;
const instantRows = []; // tryb 'instant' (rozstrzygniecie bez bitwy): NIE oceniany kryteriami K1-K5, tylko raportowany
const lines = [];
for (const f of files) {
  for (const raw of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!raw.trim()) continue;
    const row = JSON.parse(raw);
    if (row.mode !== 'skip') { instantRows.push(row); continue; }
    checked++;
    const r = row.r;
    const tag = `${row.scen} seed=${row.seed}`;
    const bad = [];
    if (row.timedOut) bad.push('K1 timeout');
    if (row.errors && row.errors.length) bad.push(`K1 pageerror x${row.errors.length}`);
    if (r.fledNotAtEdge !== 0) bad.push(`K2 fledNotAtEdge=${r.fledNotAtEdge}`);
    if (r.def.routedLeft !== 0 || r.atk.routedLeft !== 0) bad.push(`K3 routedLeft def=${r.def.routedLeft} atk=${r.atk.routedLeft}`);
    const fled = r.def.fled + r.atk.fled;
    if (fled > 0) {
      pursuitRows++;
      if (!(r.attacksOnRouted > 0)) bad.push(`K4 brak pogoni (fled=${fled}, attacksOnRouted=${r.attacksOnRouted})`);
    }
    for (const [side, s] of [['atk', r.atk], ['def', r.def]]) {
      const sum = s.killed + s.fled + s.survived;
      if (sum !== s.total) bad.push(`K5 ${side} killed+fled+survived=${sum} != total=${s.total}`);
    }
    // K6/K7 (N3, runner eksportuje r.events): odwrot <=3 na ture i strony; flaga neverRout nigdy nie ucieka
    if (r.events) {
      const perRoundSide = new Map();
      for (const ev of r.events.rout) {
        if (ev.neverRout) { bad.push(`K7 neverRout rozbity id=${ev.id} tura=${ev.round}`); continue; }
        const k = `${ev.round}|${ev.side}`;
        perRoundSide.set(k, (perRoundSide.get(k) || 0) + 1);
      }
      for (const [k, n] of perRoundSide) {
        if (n > 3) bad.push(`K6 odwrot ${n}>3 w turze/stronie ${k} (tura|strona)`);
      }
      k6Max = Math.max(k6Max, ...perRoundSide.values(), 0);
    } else {
      k6Missing++;
    }
    lines.push(`${bad.length ? 'FAIL' : 'PASS'} ${tag} | A k/f/s=${r.atk.killed}/${r.atk.fled}/${r.atk.survived} D k/f/s=${r.def.killed}/${r.def.fled}/${r.def.survived} | fledAtEdge=${r.fledAtEdge} fledNotEdge=${r.fledNotAtEdge} atkOnRouted=${r.attacksOnRouted} killedRouted=${r.killedWhileRouted} collapseRnd=${r.collapseRound}${bad.length ? ' | ' + bad.join('; ') : ''}`);
    if (bad.length) fails++;
  }
}
for (const l of lines) console.log(l);
const instantFled = instantRows.reduce((a, x) => a + x.r.def.fled + x.r.atk.fled, 0);
console.log(`INFO tryb instant (NIE oceniany K1-K5; bitwa nie jest rozgrywana): ${instantRows.length} wierszy, fled=${instantFled}`);
console.log('NIE_ZMIERZONO (runner nie eksportuje): cios na jednostke/ture; kto dobija uciekinierow (konnica); ruch uciekinierow 50%.');
console.log(`INFO K6 max odwrotow w turze/stronie=${k6Max}; wierszy bez events (K6/K7 pominiete)=${k6Missing}`);
console.log(`=== rout-check: ${checked} wierszy skip, ${pursuitRows} z ucieczka+pogonia, ${fails} FAIL ===`);
if (checked === 0) { console.error('brak wierszy skip'); process.exit(1); }
process.exit(fails === 0 ? 0 : 1);
