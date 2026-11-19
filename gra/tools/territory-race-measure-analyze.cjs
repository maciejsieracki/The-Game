'use strict';
/**
 * territory-race-measure-analyze.cjs -- R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1 (r3): analizator wyniku
 * pomiaru `territory-race-measure-run.cjs` (seed<S>.jsonl). TYLKO ODCZYT danych; nic nie uruchamia w grze.
 *
 * Uzycie: node tools/territory-race-measure-analyze.cjs --in <katalog z seed<S>.jsonl> --seed 4242 [--step 10] [--slim <plik.jsonl>] [--md <plik.md>]
 *
 * Tabela co --step tur (wlasciciele != 0 = AI; gracz 0 osobno, bo przy --player-ai 1 jest tez autopilotem):
 *   tura | AI z miastem | Σmiasta | Σheksy terytorium | z miast | z fortow/posterunkow | Σforty | Σposterunki
 *        | AI z fortem/posterunkiem | heksy sporne ogolem | Δheksow/tura (od poprzedniego wiersza, Σ AI)
 * Plus: tempo przyrostu per wlasciciel (najwiekszy i mediana, miedzy pierwszym a ostatnim wierszem tabeli),
 * moment pierwszego forta/posterunku per AI.
 * NIE ZMIERZONO: udzial wolnej ziemi (hak nie zwraca liczby wolnych heksow ladowych w zasiegu osadnictwa),
 * heksy „zajete pierwszy raz" (brak historii per heks).
 * --slim: zapis odchudzonego jsonl (tura + pola terytorium per wlasciciel) -- surowy seed<S>.jsonl bywa > 1 MB.
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
function arg(name, def) {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
}
const IN = path.resolve(arg('in', '.'));
const SEED = arg('seed', '4242');
const STEP = Math.max(1, parseInt(arg('step', '10'), 10));
const SLIM = arg('slim', '');
const MD = arg('md', '');
const file = path.join(IN, `seed${SEED}.jsonl`);
if (!fs.existsSync(file)) { console.error('brak ' + file); process.exit(1); }
const rows = fs.readFileSync(file, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
if (!rows.length) { console.error('pusty ' + file); process.exit(1); }
const FIELDS = ['miasta', 'forty', 'posterunki', 'hexyTerytorium', 'hexyZMiast', 'hexyZFortowPosterunkow', 'hexySporne'];

if (SLIM) {
  const out = rows.map(r => JSON.stringify({
    turn: r.turn, heksySporneOgolem: r.terytorium && r.terytorium.heksySporneOgolem, heksyMapy: r.terytorium && r.terytorium.heksyMapy,
    owners: (r.owners || []).map(o => { const x = { owner: o.owner }; for (const f of FIELDS) x[f] = o[f]; return x; }),
  }));
  fs.writeFileSync(path.resolve(SLIM), out.join('\n') + '\n');
}

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
let nanProblems = 0;
function aggregate(r) {
  const ai = (r.owners || []).filter(o => o.owner !== 0);
  const s = { aiZMiastem: 0, miasta: 0, hexy: 0, zMiast: 0, zFortow: 0, forty: 0, posterunki: 0, aiZFortem: 0 };
  for (const o of ai) {
    for (const f of FIELDS) if (num(o[f]) === null) nanProblems++;
    if ((o.miasta || 0) > 0) s.aiZMiastem++;
    s.miasta += o.miasta || 0; s.hexy += o.hexyTerytorium || 0; s.zMiast += o.hexyZMiast || 0;
    s.zFortow += o.hexyZFortowPosterunkow || 0; s.forty += o.forty || 0; s.posterunki += o.posterunki || 0;
    if ((o.forty || 0) + (o.posterunki || 0) > 0) s.aiZFortem++;
  }
  return s;
}

const turns = rows.map(r => r.turn);
const last = turns[turns.length - 1];
const pick = [];
for (let t = STEP; t <= last; t += STEP) {
  let best = null;
  for (const r of rows) if (r.turn <= t && (!best || r.turn > best.turn)) best = r;
  if (best && !pick.includes(best)) pick.push(best);
}
if (!pick.includes(rows[rows.length - 1])) pick.push(rows[rows.length - 1]);

const lines = [];
lines.push(`Seed ${SEED}; tury zapisane ${turns[0]}..${last} (${rows.length} wierszy); AI = wlasciciele != 0 (przy --player-ai 1 gracz 0 tez gra autopilotem, pominiety w sumach).`);
lines.push('');
lines.push('| tura | AI z miastem | Σmiasta | Σheksy teryt. | z miast | z fortów/post. | Σforty | Σposterunki | AI z fortem/post. | sporne ogółem | Δheksów/tura (Σ AI) |');
lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
let prev = null;
const tableJson = [];
for (const r of pick) {
  const a = aggregate(r);
  const d = prev ? ((a.hexy - prev.a.hexy) / Math.max(1, r.turn - prev.turn)).toFixed(1) : '-';
  lines.push(`| ${r.turn} | ${a.aiZMiastem} | ${a.miasta} | ${a.hexy} | ${a.zMiast} | ${a.zFortow} | ${a.forty} | ${a.posterunki} | ${a.aiZFortem} | ${r.terytorium ? r.terytorium.heksySporneOgolem : 'NIE ZMIERZONO'} | ${d} |`);
  tableJson.push(Object.assign({ tura: r.turn, heksySporneOgolem: r.terytorium ? r.terytorium.heksySporneOgolem : null }, a));
  prev = { turn: r.turn, a };
}

// Tempo per wlasciciel: pierwszy vs ostatni wiersz tabeli.
const firstR = pick[0], lastR = pick[pick.length - 1];
const byOwner = r => { const m = new Map(); for (const o of (r.owners || [])) if (o.owner !== 0) m.set(o.owner, o.hexyTerytorium || 0); return m; };
const m0 = byOwner(firstR), m1 = byOwner(lastR);
const dt = Math.max(1, lastR.turn - firstR.turn);
const rates = [];
for (const [ow, h1] of m1) rates.push({ owner: ow, delta: h1 - (m0.get(ow) || 0), perTura: Number(((h1 - (m0.get(ow) || 0)) / dt).toFixed(2)) });
rates.sort((x, y) => y.delta - x.delta);
const median = rates.length ? rates[Math.floor(rates.length / 2)].perTura : null;
lines.push('');
lines.push(`Tempo przyrostu terytorium per AI (tura ${firstR.turn} -> ${lastR.turn}, ${dt} tur): mediana ${median} heksów/tura; najszybsze 3: ` +
  rates.slice(0, 3).map(x => `owner ${x.owner} +${x.delta} (${x.perTura}/tura)`).join(', ') + '.');

const firstFort = {};
for (const r of rows) for (const o of (r.owners || [])) {
  if (o.owner === 0) continue;
  if ((o.forty || 0) + (o.posterunki || 0) > 0 && firstFort[o.owner] === undefined) firstFort[o.owner] = r.turn;
}
const aiAll = new Set(); for (const r of rows) for (const o of (r.owners || [])) if (o.owner !== 0) aiAll.add(o.owner);
lines.push(`AI w zapisie: ${aiAll.size}; z fortem lub posterunkiem (kiedykolwiek w ${rows.length} wierszach): ${Object.keys(firstFort).length}; pierwsza tura per AI: ${JSON.stringify(firstFort)}.`);
lines.push(`Pola nie-liczbowe (NaN/brak) w wierszach AI: ${nanProblems}.`);
lines.push('NIE ZMIERZONO: udział wolnej ziemi (hak nie zwraca wolnych heksów lądowych w zasięgu osadnictwa); heksy zajęte pierwszy raz (brak historii per heks).');

const text = lines.join('\n') + '\n';
console.log(text);
if (MD) fs.writeFileSync(path.resolve(MD), text);
fs.writeFileSync(path.join(IN, `seed${SEED}-analiza.json`), JSON.stringify({ seed: Number(SEED), step: STEP, tabela: tableJson, tempoPerAI: rates, pierwszyFortPerAI: firstFort, nanProblems }, null, 2) + '\n');
process.exit(nanProblems ? 2 : 0);
